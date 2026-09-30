# Indexing Strategy at Schema-Design Time

Which indexes a new or changed table needs, derived from its access patterns. Finding and fixing slow queries in production (pg_stat_statements, EXPLAIN triage, N+1, pooling) is in `scalability` → `references/databases.md`; this file is about designing the right indexes up front and keeping the set lean.

## Contents
1. From access patterns to indexes
2. Composite order and the leftmost prefix
3. Indexes you always need
4. Partial, expression, and covering indexes
5. Index types
6. Pagination and sort order
7. Multi-tenant and RLS indexing
8. Keeping the index set lean
9. Verifying
10. Rules catalog

## 1. From access patterns to indexes

For each access pattern from the design, write the query shape and the index that serves it:

| Access pattern | Query shape | Index |
|---|---|---|
| AP1 order by id | `WHERE id = $1` | PK |
| AP2 tenant's orders, newest first | `WHERE tenant_id = $1 ORDER BY placed_at DESC, id DESC LIMIT 50` | `(tenant_id, placed_at DESC, id DESC)` |
| AP3 open orders of a customer | `WHERE customer_id = $1 AND status = 'open'` | `(customer_id) WHERE status = 'open'` |
| AP4 login by email | `WHERE tenant_id = $1 AND lower(email) = lower($2)` | unique `(tenant_id, lower(email))` |
| AP5 jobs due | `WHERE status = 'pending' AND run_at <= now() ORDER BY run_at LIMIT 100` | `(run_at) WHERE status = 'pending'` |

An index without an access pattern behind it is a cost with no owner. A hot access pattern without an index is a future incident.

## 2. Composite order and the leftmost prefix

- Put **equality** columns first, then the **range or sort** column: `(tenant_id, status, created_at DESC)` serves `WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC`.
- A B-tree on `(a, b, c)` helps filters on `a`, `a, b`, and `a, b, c` — not on `b` or `c` alone.
- Among equality columns, order by what other queries also need as a prefix (usually `tenant_id` first), not by "selectivity" folklore.
- A range condition on a column stops later columns from narrowing the scan: in `(a, b)` with `a > 5 AND b = 3`, `b` is only filtered, not seeked.
- Match sort direction for mixed orders: `ORDER BY created_at DESC, id ASC` needs `(created_at DESC, id ASC)`.

## 3. Indexes you always need

- **Primary key** (automatic).
- **Every foreign-key column** in Postgres (not automatic): otherwise deleting or updating a parent row scans the child table, and joins from parent to children are slow.
- **Every business-unique rule** as a unique index or constraint (tenant-scoped, case-insensitive where relevant).
- **The leading column of every RLS policy predicate** (`tenant_id`) in the indexes of tenant-owned tables.

## 4. Partial, expression, and covering indexes

```sql
-- Partial: index only the rows a hot query touches (skewed predicates)
CREATE INDEX jobs_pending_run_at_idx ON jobs (run_at) WHERE status = 'pending';
CREATE INDEX outbox_unpublished_idx  ON outbox (id)   WHERE published_at IS NULL;

-- Expression: must match the query expression exactly
CREATE UNIQUE INDEX users_tenant_email_uniq ON users (tenant_id, lower(email));
-- query: WHERE tenant_id = $1 AND lower(email) = lower($2)

-- Covering: add payload columns so hot reads become index-only scans (PG11+)
CREATE INDEX orders_customer_cover_idx ON orders (customer_id) INCLUDE (status, total_minor);
```

- A partial index is used only when the query's `WHERE` clause implies the index predicate; write queries with the same literal condition.
- Index-only scans also need a mostly up-to-date visibility map (regular vacuum).

## 5. Index types

| Type | Use for | Notes |
|---|---|---|
| B-tree | Equality, ranges, sorting, uniqueness | Default |
| GIN | JSONB containment (`@>`), arrays, full-text (`tsvector`), trigram search (`pg_trgm`) | `jsonb_path_ops` is smaller and faster for `@>` only; default `jsonb_ops` also supports key-existence operators |
| GiST | Ranges and overlap (`&&`), geometry, exclusion constraints, nearest-neighbor | Required for `EXCLUDE USING gist` |
| BRIN | Very large, append-only tables whose physical order follows a column (time) | Tiny; coarse; great for time-range scans on logs and events |
| Hash | Equality only | Rarely better than B-tree |
| HNSW / IVFFlat (pgvector) | Approximate nearest-neighbor on embeddings | Filter + vector search needs care; see `ai-native-architecture` |

## 6. Pagination and sort order

- Keyset pagination needs an index matching the sort, with a unique tiebreaker: `(tenant_id, created_at DESC, id DESC)` for `WHERE tenant_id = $1 AND (created_at, id) < ($2, $3) ORDER BY created_at DESC, id DESC LIMIT 50`.
- `OFFSET` scans and discards rows; keep it for small admin tables only.
- Time-ordered keys (identity, UUIDv7) let `ORDER BY id` stand in for `ORDER BY created_at` when creation order is what you need.

## 7. Multi-tenant and RLS indexing

- Lead composite indexes with `tenant_id`; it serves both the app's filter and the RLS predicate.
- Unique constraints include `tenant_id` unless the value is globally unique by design.
- Watch for plans that ignore the tenant filter because statistics are skewed by a whale tenant; per-tenant partial indexes or partitioning can help at extreme skew.

## 8. Keeping the index set lean

- Every index slows every insert and many updates, uses memory and disk, and adds WAL and replication volume.
- Remove **unused** indexes: `pg_stat_user_indexes.idx_scan = 0` over a representative period (include month-end jobs) — check replicas too, since usage stats are per server.
- Remove **redundant prefixes**: `(a)` is redundant when `(a, b)` exists, unless `(a)` is unique or much smaller and hot.
- Remove **duplicates**: two indexes with the same columns and predicate.
- Updates that touch no indexed column can be HOT updates (no index maintenance); indexing frequently updated columns forfeits that.
- Build and drop on live tables with `CONCURRENTLY` (see `migrations.md`).

## 9. Verifying

- Run `EXPLAIN (ANALYZE, BUFFERS)` on production-like data volumes — plans on a 100-row dev table are meaningless.
- Red flags: `Seq Scan` on a large table in a hot path; estimated vs actual rows off by 10× or more (run `ANALYZE`, or add extended statistics for correlated columns); sort spilling to disk; nested loops over large outer sets.
- Re-check plans after major data growth; the optimal plan changes with data distribution.

## 10. Rules catalog

### Derive every index from an access pattern
**Rule.** Each index names the access pattern it serves; each hot access pattern has an index.
**Apply when.** Creating a table or adding a query path.
**Do / Avoid.** Do: `-- AP2: tenant orders newest first` above `(tenant_id, placed_at DESC, id DESC)`. Avoid: indexing every column "for speed".
**Why.** Indexes cost writes and memory; only indexes tied to queries pay for themselves.

### Equality first, then range or sort
**Rule.** Order composite index columns: equality predicates, then the range or ORDER BY column, then a unique tiebreaker.
**Apply when.** Any multi-column filter or filtered sort.
**Do / Avoid.** Do: `(tenant_id, status, created_at DESC)`. Avoid: `(created_at, tenant_id)` for per-tenant recent lists.
**Why.** B-trees seek on the leftmost prefix; a range column in front stops later columns from narrowing the scan.

### Index foreign keys in Postgres
**Rule.** Create an index on every referencing column unless you have proven the parent is never deleted or joined from.
**Apply when.** Declaring any foreign key.
**Do / Avoid.** Do: `CREATE INDEX order_lines_order_id_idx ON order_lines (order_id)` (or a composite with it leading). Avoid: assuming the FK created one.
**Why.** Postgres does not create them; parent deletes then scan the child table under lock.

## Sources

- PostgreSQL docs, indexes: https://www.postgresql.org/docs/current/indexes.html
- PostgreSQL docs, index-only scans and covering indexes: https://www.postgresql.org/docs/current/indexes-index-only-scans.html
- PostgreSQL docs, GIN and JSONB operator classes: https://www.postgresql.org/docs/current/datatype-json.html
- PostgreSQL docs, BRIN indexes: https://www.postgresql.org/docs/current/brin.html
- Markus Winand, Use The Index, Luke: https://use-the-index-luke.com/
- PostgreSQL wiki, "Don't Do This": https://wiki.postgresql.org/wiki/Don't_Do_This
