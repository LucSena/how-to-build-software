# Databases at Scale — Indexes, Queries, Pooling, Replicas, Partitioning, Sharding, RLS

Postgres-centric; most rules carry over to MySQL and other relational databases. Run every change through `EXPLAIN (ANALYZE, BUFFERS)` on production-like data before and after.

## Contents
1. Finding the slow queries
2. Indexing rules
3. Query rules (N+1, bounds, pagination)
4. Concurrency control
5. Connection pooling
6. Read replicas
7. Partitioning
8. Sharding
9. Multi-tenancy and Row-Level Security
10. Rules catalog

## 1. Finding the slow queries

- Enable `pg_stat_statements`; sort by `total_exec_time` (not mean) — a 5 ms query run 10 million times beats a 5 s report.
- `EXPLAIN (ANALYZE, BUFFERS)` on each suspect. Red flags: `Seq Scan` on a large table in a hot path; estimated vs actual rows off by 10×+ (stale statistics → `ANALYZE`); `Sort` spilling to disk; nested loops over large row counts; high `shared read` buffers.
- Check index use: `pg_stat_user_indexes.idx_scan = 0` for unused indexes (they still cost writes and memory).
- Watch locks and long transactions: `pg_stat_activity` for `idle in transaction`, `pg_locks` for waiting queries.

## 2. Indexing rules

- Index columns in `WHERE`, `JOIN`, and `ORDER BY` of hot queries, and **every foreign-key column** (not automatic in Postgres; unindexed FKs make deletes and joins slow).
- **Composite order**: equality predicates first, then range or sort columns. `(tenant_id, status, created_at DESC)` serves `WHERE tenant_id = $1 AND status = 'open' ORDER BY created_at DESC LIMIT 20`.
- **Leftmost prefix**: an index on `(a, b, c)` helps queries on `a`, `a,b`, `a,b,c` — not on `b` alone.
- **Partial indexes** for common filtered subsets: `CREATE INDEX … ON jobs (run_at) WHERE status = 'pending'`; `… WHERE deleted_at IS NULL`.
- **Covering indexes** (`INCLUDE (col)`) for index-only scans on hot reads.
- **Expression indexes** for normalized lookups: `ON users (lower(email))`.
- **Index types**: B-tree default; GIN for JSONB, arrays, full-text; BRIN for huge append-only time-ordered tables; HNSW (pgvector) for embeddings.
- Unique constraints that must ignore soft-deleted rows: partial unique index `… WHERE deleted_at IS NULL`.
- On large live tables: `CREATE INDEX CONCURRENTLY` (outside a transaction). See `reliability` for migration safety.
- Every index slows writes and uses memory; justify each with a query.

## 3. Query rules (N+1, bounds, pagination)

**N+1**: one query for a list, then one per item.

```ts
// Bad: 1 + N queries
for (const order of orders) order.customer = await db.customer.findById(order.customerId);

// Good: 2 queries
const customers = await db.customer.findMany({ where: { id: { in: orders.map(o => o.customerId) } } });
```

Use ORM eager loading (`include`, `joinedload`/`selectinload`, `select_related`/`prefetch_related`), batch by IDs (`WHERE id = ANY($1)`), or DataLoader in GraphQL. Assert query counts in tests for list endpoints.

**Bounds**: every list query has `LIMIT`; default page 20–50, max ~100; no `SELECT *` on wide tables in hot paths; exports stream or run as background jobs.

**Keyset (cursor) pagination** — stable and O(log n) with the right index:

```sql
-- index: (tenant_id, created_at DESC, id DESC)
SELECT id, created_at, title
FROM tickets
WHERE tenant_id = $1
  AND (created_at, id) < ($2, $3)      -- values decoded from the opaque cursor
ORDER BY created_at DESC, id DESC
LIMIT 21;                               -- limit + 1 to know whether there is a next page
```

`OFFSET` costs grow with the offset and pages shift when rows are inserted; keep it only for small admin tables where jump-to-page matters. The API contract for cursors is in `api-design`.

**Writes**: multi-row inserts or `COPY` for bulk; backfills in batches of ~1k–10k rows per transaction with pauses, watching replication lag.

**Transactions**: short; never wrap HTTP, email, file uploads, or LLM calls.

**IDs**: UUIDv7 or ULID (time-ordered, index-friendly) or bigint identity. Sequential IDs are guessable — authorize every access regardless.

## 4. Concurrency control

Postgres defaults to Read Committed. Prevent lost updates and check-then-act races with one of:

| Technique | Use when | Example |
|---|---|---|
| Atomic conditional update | Counters, stock, balances | `UPDATE items SET stock = stock - $1 WHERE id = $2 AND stock >= $1` (0 rows → out of stock) |
| Unique/check/exclusion constraint | Uniqueness, no overlapping bookings | `UNIQUE (tenant_id, email)`; `EXCLUDE USING gist (room_id WITH =, during WITH &&)` |
| Optimistic locking | User edits of the same record | `UPDATE … SET …, version = version + 1 WHERE id = $1 AND version = $2` → 409 on 0 rows |
| `SELECT … FOR UPDATE` | Short read-modify-write on a few rows | Lock row, compute, update, commit quickly |
| `SERIALIZABLE` + retry | Complex invariants across rows | Retry on SQLSTATE `40001` with backoff |
| Advisory lock | Singleton jobs, per-entity serialization | `pg_try_advisory_xact_lock(hashtext($1))` |

Application-level "check if exists, then insert" is a race; let the constraint decide and handle the conflict error.

## 5. Connection pooling

- Postgres uses one process per connection; many connections cost memory and contention. Starting point: **pool size ≈ (DB cores × 2) + effective spindle count** (≈ 1 for SSD). A 4-core database: ~8–10 active connections; 16-core: ~32–40.
- Total across all app instances and workers stays below `max_connections` minus headroom for admin and migrations.
- Many instances or serverless: put **PgBouncer in transaction mode** or a managed pooler (RDS Proxy, Supavisor, Neon's pooler) in front. Transaction mode breaks session state: session-level `SET`, advisory locks spanning transactions, `LISTEN/NOTIFY`, `WITH HOLD` cursors; prepared statements need PgBouncer ≥ 1.21 with `max_prepared_statements` set. Use `SET LOCAL` inside transactions instead of `SET`.
- Serverless: create the client outside the handler; prefer HTTP/WebSocket drivers or the platform's pooler; cap function concurrency so it cannot exhaust the database.
- Set a connection-acquire timeout, `statement_timeout`, and `idle_in_transaction_session_timeout`; always release connections in `finally`.
- Same idea for HTTP clients: reuse keep-alive connections (one shared client/agent per process).

## 6. Read replicas

- Use for read-heavy traffic, reporting, and analytics offload — after indexes and caching.
- **Replication lag** is normally milliseconds, but grows to seconds or more under write bursts, long queries on the replica, or vacuum conflicts. Monitor it and alert.
- **Read-your-writes**: after a user writes, route their reads to the primary for a short window (session flag or cookie with the write timestamp), or wait until the replica has replayed the write's LSN.
- Never make a read-then-write decision (balance check, uniqueness check) from a replica.
- Long analytical queries on a hot-standby replica can be cancelled or cause bloat; use a dedicated analytics replica or warehouse for heavy reporting.

## 7. Partitioning (single node)

- Declarative range partitioning by time for large append-only tables (events, logs, audit, metrics).
- Benefits: retention by `DROP`/`DETACH PARTITION` (instant, no vacuum storm), smaller per-partition indexes, partition pruning.
- Queries must include the partition key to prune; unique constraints must include it.
- Keep partition counts moderate (hundreds, not tens of thousands); automate creation ahead of time (e.g., pg_partman).
- Partitioning is not sharding: it does not add write capacity beyond one node.

## 8. Sharding (multi-node) — last resort

Only after: indexes and queries fixed, vertical scaling, caching, replicas, partitioning, and archiving cold data.

| Strategy | Pros | Cons |
|---|---|---|
| Hash (consistent hashing) | Even distribution | Range scans hit all shards; resharding needs virtual nodes/planning |
| Range | Range queries, locality | Hot spots with monotonic keys |
| Directory / lookup | Flexible placement; move big tenants | Lookup service is on the critical path |
| Entity/tenant (`tenant_id`) | Most SaaS queries are single-tenant; natural isolation | Whale tenants create hot shards |

Shard key = the dominant access-path key, high cardinality, even load. Avoid cross-shard joins and transactions by design. Prefer managed or distributed SQL (Citus, Vitess/PlanetScale, CockroachDB, Spanner, YugabyteDB, Aurora Limitless) over hand-rolled routing.

## 9. Multi-tenancy and Row-Level Security

| Model | Isolation | Cost | Use |
|---|---|---|---|
| Pool: shared schema + `tenant_id` | Logical (app + RLS) | Lowest | Default for B2B SaaS |
| Bridge: schema per tenant | Medium | Medium | Mid-size; migrations × N schemas become painful past hundreds |
| Silo: database/account/cell per tenant | Strong | Highest | Enterprise, regulated, residency, whales |

RLS as defense in depth for the pooled model:

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;         -- applies to the table owner too
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- per request, inside the transaction (safe with transaction-mode poolers):
BEGIN;
SET LOCAL app.tenant_id = '6f1c…';
-- queries…
COMMIT;
```

Caveats: superusers and roles with `BYPASSRLS` skip policies — the application role must have neither; `SET` (not `LOCAL`) leaks tenant context across pooled connections; add an index leading with `tenant_id` so policies do not force scans; test that a query without the setting fails closed.

Still scope queries in the data-access layer; RLS catches the query someone forgot.

## 10. Rules catalog

### Index every foreign key and hot filter
**Rule.** Create indexes for FK columns and for the filter/sort columns of hot queries, equality columns first.
**Apply when.** Adding a table, relationship, or list endpoint.
**Do / Avoid.** Do: `CREATE INDEX CONCURRENTLY ON comments (post_id, created_at DESC)`. Avoid: relying on the PK index and discovering seq scans in production.
**Why.** Without an index, cost grows linearly with table size; deletes on the parent scan the whole child table.

### Never query inside a loop
**Rule.** Load related data in one batched query or eager load.
**Apply when.** Iterating over a collection that needs related rows or remote data.
**Do / Avoid.** Do: `WHERE id = ANY($1)`. Avoid: `await` a query per item.
**Why.** N+1 multiplies round-trip latency by N and floods the pool under load.

### Let the database enforce invariants
**Rule.** Uniqueness, referential integrity, and non-overlap belong in constraints; handle the violation error.
**Apply when.** Any "must be unique" or "must not overlap" rule.
**Do / Avoid.** Do: `UNIQUE (tenant_id, slug)` and map the error to 409. Avoid: `if (!await exists(slug)) await insert(slug)`.
**Why.** Check-then-act races under concurrency; only the database sees all writers.

### Size pools from database cores, not traffic
**Rule.** Keep total active connections near (cores × 2) + 1 and use a pooler for many clients.
**Apply when.** Configuring app pools, workers, or serverless functions.
**Do / Avoid.** Do: 10 connections per instance × 3 instances behind PgBouncer. Avoid: `pool: 100` on each of 20 pods.
**Why.** Beyond the database's parallelism, extra connections only add context switching and memory, lowering throughput.

## Sources

- PostgreSQL documentation (indexes, partitioning, RLS, explicit locking): https://www.postgresql.org/docs/current/
- Use The Index, Luke (Markus Winand): https://use-the-index-luke.com/
- HikariCP, About Pool Sizing: https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing
- PgBouncer configuration: https://www.pgbouncer.org/config.html
- Neon connection pooling: https://neon.com/docs/connect/connection-pooling
- Connection pool sizing in 2026: https://dev.to/gabrielanhaia/connection-pool-sizing-in-2026-the-formula-and-the-footguns-16hg
- Multi-tenant RLS (Nile): https://www.thenile.dev/blog/multi-tenant-rls
- Multi-tenant SaaS on Postgres (ClickHouse): https://clickhouse.com/resources/engineering/multi-tenant-saas-postgres-architecture
- donnemartin/system-design-primer (sharding, replication): https://github.com/donnemartin/system-design-primer
