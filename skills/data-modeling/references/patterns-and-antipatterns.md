# Schema Patterns and Anti-Patterns

SQL for the recurring shapes: denormalization, deletion, audit and history, tenancy, JSONB, relationships, hot rows, concurrency, and the idempotency/outbox tables that make side effects safe. Postgres syntax.

## Contents
1. Normalize, then denormalize on purpose
2. Deletion: hard, archive, soft, status
3. Audit log and history tables
4. Multi-tenancy models
5. JSONB
6. Polymorphic associations → alternatives
7. EAV → alternatives
8. Many-to-many
9. Hierarchies
10. Counters and hot rows
11. Optimistic and pessimistic concurrency
12. Idempotency, outbox, inbox
13. Rules catalog

## 1. Normalize, then denormalize on purpose

Default to third normal form: every non-key column depends on the key, the whole key, and nothing but the key. Duplicated facts get updated in one place and not the other.

| Denormalization | When it is right | Kept in sync by |
|---|---|---|
| Snapshot (`order_lines.unit_price_minor`) | The value must be frozen at event time (price paid, address shipped to) | Nothing — it is a historical fact |
| Counter cache (`posts.comment_count`) | Read far more than written, `count(*)` too slow | Same transaction as child insert/delete, or async + periodic reconciliation |
| Materialized view / summary table | Dashboards and aggregates | `REFRESH MATERIALIZED VIEW CONCURRENTLY` (needs a unique index) or incremental jobs |
| Read model / projection | Search, feeds, CQRS | Outbox events or CDC; must be rebuildable from the source |
| JSONB of child data | Child always read and written with its parent, never queried alone | Application; no constraints inside |

Every denormalized field names its source of truth and sync mechanism in the design doc.

## 2. Deletion: hard, archive, soft, status

Brandur Leach ("Soft Deletion Probably Isn't Worth It") found `deleted_at` leaks into every query, weakens foreign keys, and complicates real data removal — and was almost never used to undelete. Atlassian's 2022 incident (883 sites deleted by a script given the wrong IDs, restores taking up to two weeks) shows deletes must still be recoverable. Reconcile both:

| Approach | Use when | Cost |
|---|---|---|
| **Hard delete + archive copy** (default) | Ordinary rows; recovery by support/ops within a window | Restore is a manual insert; JSON may drift from the schema |
| `deleted_at` soft delete | The product has a user-visible trash/restore | Every query, index, and unique constraint must account for it; PII lingers |
| Status column | "Deleted" is really a lifecycle state (closed account, archived project) | None — it is domain data |
| Scheduled deletion | Tenant/account/bulk deletes | Grace period, dry run, audit trail |

```sql
-- Default: archive on delete, then hard delete
CREATE TABLE deleted_records (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text  NOT NULL,
  object_id  text  NOT NULL,
  data       jsonb NOT NULL,
  deleted_by bigint,
  deleted_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION archive_on_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO deleted_records (table_name, object_id, data, deleted_by)
  VALUES (TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD), current_setting('app.user_id', true)::bigint);
  RETURN OLD;
END $$;
CREATE TRIGGER projects_archive BEFORE DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION archive_on_delete();
-- purge job: DELETE FROM deleted_records WHERE deleted_at < now() - interval '30 days';

-- If the product needs trash/restore:
CREATE UNIQUE INDEX projects_tenant_slug_live_uniq ON projects (tenant_id, slug) WHERE deleted_at IS NULL;
CREATE VIEW live_projects AS SELECT * FROM projects WHERE deleted_at IS NULL;
```

Bulk and tenant-level deletes: produce a dry-run list (names, types, environment, counts), require confirmation, cap the batch size, accept exactly one identifier type per deletion API, and schedule the hard delete after a grace period.

## 3. Audit log and history tables

| Need | Pattern |
|---|---|
| Who did what, when | Append-only `audit_log`, written in the same transaction as the change |
| What a row looked like at time T | `<table>_history` populated by trigger with `valid_from`/`valid_to` |
| "What did we believe on date X about date Y" | Bitemporal: valid time + recorded time (finance, insurance, HR) |
| History is the product | Event sourcing (see `nosql-and-analytics.md`) |

```sql
CREATE TABLE audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id   bigint NOT NULL,
  actor_id    bigint,                         -- NULL for system actions; record which system
  action      text   NOT NULL,                -- 'invoice.voided'
  entity_type text   NOT NULL,
  entity_id   text   NOT NULL,
  diff        jsonb  NOT NULL DEFAULT '{}',   -- changed fields only; no secrets
  request_id  text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_entity_idx ON audit_log (tenant_id, entity_type, entity_id, occurred_at DESC);
REVOKE UPDATE, DELETE ON audit_log FROM app_role;

CREATE TABLE prices_history (LIKE prices INCLUDING DEFAULTS,
  valid_from timestamptz NOT NULL, valid_to timestamptz NOT NULL, changed_by bigint);
CREATE FUNCTION prices_history_capture() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO prices_history
  SELECT OLD.*, OLD.updated_at, now(), current_setting('app.user_id', true)::bigint;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER prices_history_trg BEFORE UPDATE OR DELETE ON prices
  FOR EACH ROW EXECUTE FUNCTION prices_history_capture();
```

Some databases (e.g., SQL Server, MariaDB) offer system-versioned temporal tables natively; in Postgres use triggers. Partition large audit/history tables by time so retention is cheap. Decide history needs before launch — the past cannot be reconstructed.

## 4. Multi-tenancy models

| Model | Isolation | Ops at thousands of tenants | Cross-tenant analytics | Per-tenant restore/residency | Fit |
|---|---|---|---|---|---|
| **Shared tables + `tenant_id`** | Logical (RLS helps) | Lowest | Easy | Hard | Default for B2B/SMB SaaS |
| Schema per tenant | Medium | Migrations × N schemas; catalog bloat | UNION across schemas | Medium | Tens to hundreds of tenants |
| Database per tenant | Strong | Highest (N databases, connections) | ETL needed | Easy | Enterprise, regulated, residency |
| Cells (groups of tenants per stack) | Blast-radius | Medium | Via warehouse | Move tenant between cells | Large scale (Shopify pods) |

Shared-table rules (SQL in `SKILL.md`):
- `tenant_id NOT NULL` on every tenant-owned table; first column of composite PKs, indexes, and unique constraints.
- Composite foreign keys `(tenant_id, x_id) → (tenant_id, id)` make cross-tenant references impossible.
- RLS with `ENABLE` + `FORCE`, policies with `USING` and `WITH CHECK`, tenant set via `SET LOCAL` per transaction; the app role is neither superuser nor `BYPASSRLS`. A query without the setting should fail, not return everything — `current_setting('app.tenant_id')` without the `missing_ok` argument errors when unset.
- Global tables (plans, currencies) have no `tenant_id` and are read-only to the app role.
- Tests assert that tenant A cannot read or write tenant B's rows.

## 5. JSONB

Good: sparse or per-integration settings, preferences, verbatim external payloads kept for audit or replay, document-shaped data always used whole.
Bad: anything you filter, join, sort, aggregate, or constrain on regularly; lists of children updated independently (each update rewrites the whole value, and large values are stored out of line).

```sql
ALTER TABLE integrations ADD COLUMN config jsonb NOT NULL DEFAULT '{}'
  CHECK (jsonb_typeof(config) = 'object');
CREATE INDEX integrations_config_gin ON integrations USING gin (config jsonb_path_ops);  -- for @> containment
ALTER TABLE integrations ADD COLUMN region text
  GENERATED ALWAYS AS (config->>'region') STORED;                                       -- promote a hot field
CREATE INDEX integrations_region_idx ON integrations (region);
```

Validate the shape at the application boundary and store a schema version inside (`{"v": 2, …}`); write a migration path for old versions.

## 6. Polymorphic associations → alternatives

Anti-pattern (common in ORM generators): `comments(commentable_type text, commentable_id bigint)`. No foreign key is possible, orphans accumulate, and type strings couple data to class names (Bill Karwin, *SQL Antipatterns*).

```sql
-- (a) Exclusive arc: one nullable FK per parent type, exactly one set
CREATE TABLE comments (
  id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id  bigint REFERENCES posts(id)  ON DELETE CASCADE,
  photo_id bigint REFERENCES photos(id) ON DELETE CASCADE,
  body     text NOT NULL,
  CHECK (num_nonnulls(post_id, photo_id) = 1)
);
CREATE INDEX comments_post_idx  ON comments (post_id)  WHERE post_id IS NOT NULL;
CREATE INDEX comments_photo_idx ON comments (photo_id) WHERE photo_id IS NOT NULL;
-- (b) Per-parent join tables: post_comments(post_id, comment_id), photo_comments(photo_id, comment_id)
-- (c) Common supertype: commentables(id); posts.id and photos.id reference it; comments.commentable_id → commentables(id)
```

Default: (a) for two to four parent types; (c) when many types share the relationship.

## 7. EAV → alternatives

`attributes(entity_id, name, value text)` loses types, NOT NULL, CHECK, and FKs, and turns every read into a pivot.

| Situation | Use |
|---|---|
| Attributes known at design time | Real columns |
| Sparse, varied, rarely queried | JSONB with validation |
| End users define fields (CRM custom fields) | Typed definitions + values tables |

```sql
CREATE TABLE custom_field_definitions (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenants(id),
  key       text   NOT NULL,
  data_type text   NOT NULL CHECK (data_type IN ('text','number','date','boolean')),
  UNIQUE (tenant_id, key)
);
CREATE TABLE custom_field_values (
  field_id    bigint NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  record_id   bigint NOT NULL,
  text_value  text,
  num_value   numeric,
  date_value  date,
  bool_value  boolean,
  PRIMARY KEY (field_id, record_id),
  CHECK (num_nonnulls(text_value, num_value, date_value, bool_value) = 1)
);
```

## 8. Many-to-many

```sql
CREATE TABLE project_members (
  project_id bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    bigint NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       text   NOT NULL CHECK (role IN ('viewer','editor','admin')),
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX project_members_user_idx ON project_members (user_id);   -- "projects of a user"
```

The composite PK prevents duplicates; add the reverse index. The join table usually becomes an entity with its own data — name it after the relationship (`memberships`, `enrollments`). Arrays of IDs are fine only for small, unconstrained lists never joined.

## 9. Hierarchies

| Model | Read subtree | Move subtree | Integrity | Use |
|---|---|---|---|---|
| **Adjacency list** (`parent_id`) | Recursive CTE | One update | FK works | Default |
| Closure table (`ancestor, descendant, depth`) | One indexed query | Rewrite subtree × depth rows | FKs work | Frequent ancestor/subtree queries (permissions, org charts) |
| Materialized path / `ltree` | Prefix or GiST query | Rewrite paths of subtree | No FK on path | Categories, file paths |
| Nested sets | Fast | Expensive, fragile | Weak | Avoid for changing data |

```sql
WITH RECURSIVE subtree AS (
  SELECT id, parent_id, name, 1 AS depth FROM folders WHERE id = $1
  UNION ALL
  SELECT f.id, f.parent_id, f.name, s.depth + 1
  FROM folders f JOIN subtree s ON f.parent_id = s.id
  WHERE s.depth < 100                                  -- guard against cycles and runaway depth
)
SELECT * FROM subtree;
```

When moving a node, reject a new parent that is the node itself or one of its descendants.

## 10. Counters and hot rows

`UPDATE posts SET like_count = like_count + 1 WHERE id = $1` makes every writer wait on one row lock; a viral post or a global counter becomes the bottleneck.

| Option | Use when |
|---|---|
| Derive: `count(*)` on an indexed child table, cached | Moderate volumes |
| Slotted counter: N rows per counter, write a random slot, sum on read | High write concurrency, exact count needed |
| Buffer in memory/Redis and flush deltas periodically | Approximate, loss window acceptable |
| Append-only events + periodic rollup | The events are the truth anyway (likes table) |

```sql
CREATE TABLE post_like_counters (
  post_id bigint   NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  slot    smallint NOT NULL CHECK (slot BETWEEN 0 AND 15),
  count   bigint   NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, slot)
);
INSERT INTO post_like_counters (post_id, slot, count) VALUES ($1, floor(random() * 16)::int, 1)
ON CONFLICT (post_id, slot) DO UPDATE SET count = post_like_counters.count + 1;
SELECT coalesce(sum(count), 0) FROM post_like_counters WHERE post_id = $1;
```

Inventory and seats need correctness, not only throughput: `UPDATE stock SET qty = qty - $2 WHERE sku = $1 AND qty >= $2` and check the affected-row count, or use reservation rows with expiry.

## 11. Optimistic and pessimistic concurrency

```sql
ALTER TABLE documents ADD COLUMN version integer NOT NULL DEFAULT 1;
UPDATE documents SET body = $2, version = version + 1, updated_at = now()
WHERE id = $1 AND version = $3;           -- $3 = version the client read
-- 0 rows → someone else saved first: return 409 (or 412 with If-Match) and show the newer version
```

- Expose the version as an HTTP `ETag`; require `If-Match` on updates (see `api-design`).
- Pessimistic `SELECT … FOR UPDATE` only for short, high-contention sections inside one transaction — never across a user's think time or a network call.
- `SERIALIZABLE` isolation for complex multi-row invariants, with automatic retry on serialization failures (SQLSTATE `40001`).

## 12. Idempotency, outbox, inbox

```sql
CREATE TABLE idempotency_keys (
  tenant_id      bigint NOT NULL,
  key            text   NOT NULL,                  -- client-supplied (UUID/ULID)
  request_hash   bytea  NOT NULL,                  -- same key + different body → 422
  locked_at      timestamptz,                      -- in flight: concurrent retry → 409
  recovery_point text   NOT NULL DEFAULT 'started',-- resume multi-phase work (Brandur Leach)
  response_code  integer,
  response_body  jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, key)
);
-- purge after a documented window that covers client retries

CREATE TABLE outbox (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate    text  NOT NULL,
  aggregate_id text  NOT NULL,
  event_type   text  NOT NULL,                    -- 'invoice.paid'
  payload      jsonb NOT NULL,                    -- includes schema version
  created_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX outbox_unpublished_idx ON outbox (id) WHERE published_at IS NULL;
-- relay: SELECT … WHERE published_at IS NULL ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED

CREATE TABLE processed_messages (                 -- inbox for consumers
  consumer     text NOT NULL,
  message_id   text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (consumer, message_id)
);
```

Write the business change and the outbox row in one transaction; consumers insert into `processed_messages` in the same transaction as their effect and skip duplicates. Protocol-level details: `scalability` (outbox, sagas) and `api-design` (`Idempotency-Key`).

## 13. Rules catalog

### Make illegal references impossible
**Rule.** If a column holds a foreign key, the database must be able to enforce it.
**Apply when.** Modeling "belongs to one of several things" or tenant-scoped relations.
**Do / Avoid.** Do: exclusive arc with a `num_nonnulls` CHECK; composite `(tenant_id, id)` FKs. Avoid: `*_type` + `*_id` columns; FKs that ignore `tenant_id`.
**Why.** Unenforced references rot into orphans and cross-tenant leaks that no code review catches.

### Keep deletes recoverable without polluting live queries
**Rule.** Hard delete from live tables with an archive copy; use `deleted_at` only for product-level trash.
**Apply when.** Designing any delete path.
**Do / Avoid.** Do: trigger to `deleted_records`, purge after 30 days. Avoid: `deleted_at` on every table "just in case".
**Why.** Soft delete forces a filter into every query and breaks uniqueness; an archive gives recovery without that tax.

### Spread writes away from single rows
**Rule.** Do not let a single row absorb every request's writes.
**Apply when.** Likes, views, global counters, rate-limit buckets, sequence tables.
**Do / Avoid.** Do: slotted counters or event rows + rollup. Avoid: `UPDATE counters SET n = n + 1 WHERE name = 'global'`.
**Why.** Row locks serialize writers; throughput caps at one lock holder at a time.

## Sources

- Brandur Leach, "Soft Deletion Probably Isn't Worth It": https://brandur.org/soft-deletion
- Brandur Leach, "Implementing Stripe-like Idempotency Keys in Postgres": https://brandur.org/idempotency-keys
- Atlassian, April 2022 outage post-incident review: https://www.atlassian.com/engineering/post-incident-review-april-2022-outage
- Bill Karwin, *SQL Antipatterns* (Pragmatic Bookshelf)
- PostgreSQL docs, Row Security Policies: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- PostgreSQL docs, WITH queries (recursive CTEs): https://www.postgresql.org/docs/current/queries-with.html
- PostgreSQL docs, JSON types and indexing: https://www.postgresql.org/docs/current/datatype-json.html
- Shopify Engineering, e-commerce at scale (pods): https://shopify.engineering/e-commerce-at-scale-inside-shopifys-tech-stack
- Cloudflare, SQLite in Durable Objects (single-writer actors instead of hot rows): https://blog.cloudflare.com/sqlite-in-durable-objects/
