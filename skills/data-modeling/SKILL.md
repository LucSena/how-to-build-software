---
name: data-modeling
description: Use when designing or changing a database schema — tables, columns, primary keys (bigint identity, UUIDv7, ULID, Snowflake), foreign keys and constraints (NOT NULL, CHECK, UNIQUE, EXCLUDE), enums vs lookup tables, money, timestamps and time zones, names, addresses, emails and phones, soft delete vs archive, audit logs and history tables, multi-tenant schemas (tenant_id, composite foreign keys, row-level security), JSONB columns, many-to-many, trees, counters and hot rows, optimistic locking, idempotency and outbox tables, zero-downtime migrations and backfills, indexing strategy, naming, DynamoDB single-table design, event sourcing storage, PII retention and deletion, OLTP vs analytics, and SQLite in production. Also use when the user says "design the schema", "what should the tables look like?", "UUID or auto-increment?", "how do I store money/time zones?", "add a column to a big table", or "review this migration". Not for choosing a database product (use data-infrastructure), slow-query triage and sharding (use scalability), or the end-to-end design method (use system-design).
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "system-design scalability data-infrastructure api-design application-security reliability"
---

# Data Modeling

The schema outlives every service, framework, and team that touches it, so it is where correctness is cheapest to buy and most expensive to fix later. This skill designs Postgres-first relational schemas from access patterns and invariants, puts the rules in the database where every client must obey them, and changes schemas only through migrations that never lock a live table by surprise. Examples use PostgreSQL (16–18); MySQL and SQLite differences are called out. The outcome it protects: data that stays correct, answerable, and deletable as the product and its load grow.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also read the existing schema (migrations folder, ORM models, `schema.sql`/`structure.sql`) and follow its conventions for keys, naming, and timestamps unless the user asks to change them.

## Core principles

1. **Access patterns and invariants before DDL.** List the top reads and writes and the rules that must never break; the schema is derived from them, not from the UI's form fields.
2. **Constraints in the database are the last line of defense.** App validation is for UX; NOT NULL, CHECK, UNIQUE, FK, and EXCLUDE are for correctness against every client, script, and future service.
3. **Normalize by default; denormalize on purpose.** Every copied value names its source of truth and its sync mechanism — or is a deliberate historical snapshot.
4. **Choose keys once.** 64-bit internal keys, non-sequential public IDs, and authorization on every access; an ID's opacity is never the access control.
5. **Model money, time, and people as the world is.** Integer minor units + currency; instants as `timestamptz`; future local events as local time + IANA zone; names and addresses without false assumptions.
6. **Decide history, deletion, and retention up front.** You cannot recover history you never recorded, and you cannot delete personal data you cannot find.
7. **Every schema change is expand → migrate → contract** with a known lock level, a `lock_timeout`, and a rollback.
8. **Relational by default.** Choose a key-value or document model only when access patterns are few, known, and proven too big for a relational database — and budget for losing ad-hoc queries.

## Workflow

- [ ] **Read what exists**: current schema, key and naming conventions, migration tool, database version. Gate: you can state the PK type, timestamp type, and naming style in use.
- [ ] **List entities and lifecycles**: who creates, mutates, and deletes each; which are tenant-owned.
- [ ] **List invariants** and assign each an enforcement: constraint, single transaction, or eventual + reconciliation job. Gate: no invariant is "enforced by the service checking first".
- [ ] **List access patterns** with frequency and latency need; mark analytics patterns (they go to a replica or warehouse, not the OLTP schema).
- [ ] **Write the normalized DDL**: keys, NOT NULL by default, CHECKs, UNIQUEs (tenant-scoped, case-insensitive where needed), FKs with a deliberate `ON DELETE`.
- [ ] **Add indexes for the access patterns** (and every FK column); verify with `EXPLAIN (ANALYZE, BUFFERS)` on realistic data.
- [ ] **Decide cross-cutting data**: tenancy, history/audit, deletion and retention, PII inventory, concurrency control on contested rows.
- [ ] **Write the migration** as expand/contract steps with lock levels, `lock_timeout`, batched backfill, and rollback.
- [ ] **Validate** against the review checklist and Gotchas; fix and repeat until clean.

## Primary keys

| Option | Use for | Watch out |
|---|---|---|
| **`bigint GENERATED ALWAYS AS IDENTITY`** | **Default** internal key in one database; FKs and joins | Leaks volume and eases enumeration if exposed; needs a DB round trip to know the ID |
| **UUIDv7** (RFC 9562, 2024) | Public IDs; IDs generated outside the DB (offline clients, multi-region, event-sourced aggregates) | 16 bytes; embeds creation time (ms) |
| UUIDv4 | Unguessable tokens; small tables | Random inserts scatter across the B-tree (page splits, cache misses); worst as a MySQL/InnoDB clustered PK |
| ULID | Same niche as UUIDv7 in systems that already use it | Not an IETF standard; store as `uuid`/binary, not text |
| Snowflake-style 64-bit | Very high write rates from many writers needing 64-bit sortable IDs | Unique worker-ID assignment; clock regression; send as strings in JSON (JS loses precision above 2^53) |
| Natural key (email, SKU) | Small, truly immutable reference data (ISO country or currency codes) | Real-world "immutable" values change; cascading key updates |

Default: the **two-ID model** — `bigint` identity for internal joins plus a UUIDv7 `public_id` for URLs and APIs. Use UUIDv7 as the single PK when IDs must be minted outside the database. Pick one per system and document it.

```sql
CREATE TABLE customers (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id  uuid NOT NULL DEFAULT uuidv7() UNIQUE,  -- built into PostgreSQL 18 (as of 2026-09); earlier: extension or app-generated
  tenant_id  bigint NOT NULL REFERENCES tenants(id),
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Never `serial` or 32-bit keys on growing tables: GitHub (2021) lost Actions and Pages for hours when a foreign key hit the INT32 maximum. Non-sequential public IDs reduce leaks, but **authorization on every access** is the control (see `application-security`). Password-reset and invite tokens are long random secrets, never UUIDv7.

Decision details, UUIDv7 generation before Postgres 18, and ID exposure: `references/keys-and-constraints.md`.

## Constraints in the database

```sql
CREATE TABLE orders (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id    bigint NOT NULL REFERENCES tenants(id),
  customer_id  bigint NOT NULL REFERENCES customers(id),
  status       text   NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','paid','shipped','cancelled','refunded')),
  currency     char(3) NOT NULL REFERENCES currencies(code),
  total_minor  bigint NOT NULL CHECK (total_minor >= 0),
  placed_at    timestamptz NOT NULL DEFAULT now(),
  shipped_at   timestamptz,
  CHECK ((status = 'shipped') = (shipped_at IS NOT NULL))
);
CREATE INDEX orders_customer_id_idx ON orders (customer_id);          -- Postgres does not index FK columns for you
CREATE INDEX orders_tenant_placed_idx ON orders (tenant_id, placed_at DESC);
CREATE UNIQUE INDEX users_tenant_email_uniq ON users (tenant_id, lower(email));

-- Non-overlap (bookings) with an exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE room_bookings (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id bigint NOT NULL REFERENCES rooms(id),
  during  tstzrange NOT NULL,
  EXCLUDE USING gist (room_id WITH =, during WITH &&)
);
```

- **NOT NULL by default.** Nullable only when "unknown / not applicable" is a real state. `NOT IN (subquery)` returns no rows if the subquery has a NULL.
- **FKs everywhere within one database.** `ON DELETE RESTRICT` by default; `CASCADE` only for true composition (order → order lines); `SET NULL` for optional links.
- **UNIQUE for business keys**, scoped by tenant and case-insensitive where people type the value.
- **CHECK for row-level rules**; cross-row rules go in a transaction or an exclusion constraint.
- **`text` + CHECK on length** instead of arbitrary `varchar(n)` in Postgres; changing a CHECK is cheaper than altering a type.
- **SQLite**: foreign keys are off until `PRAGMA foreign_keys = ON` on each connection.

## Enums, lookup tables, or CHECK

| Option | Default for | Avoid when |
|---|---|---|
| `text` + `CHECK (x IN (…))` | Small, code-owned state machines (order status) | Admins or users manage the values |
| Lookup table + FK | Values managed as data, needing labels, ordering, i18n, active flags | — |
| Postgres `ENUM` | Stable sets where 4-byte storage matters | Values may be removed or renamed (no `DROP VALUE`) |
| Integer codes checked only in app code | Never | Always — the database cannot validate them and SQL output is unreadable |

## Money, time, and people

- **Money**: never float. Store `amount_minor bigint` + `currency char(3)` (exponent per currency in a `currencies` table — JPY 0, USD 2, some currencies 3), or `numeric(p,s)` + currency for accounting and fractional unit prices. Avoid Postgres `money`. Snapshot prices onto order lines. Ledgers are double-entry and append-only; corrections are reversing entries.
- **Instants**: `timestamptz` (stores a UTC instant; does not keep the original zone). Never `timestamp` without time zone for things that happened.
- **Future local events** (meetings, classes, store hours): store local date-time + IANA zone (`Europe/Berlin`); derive the UTC instant and recompute when time-zone rules change. Storing only UTC breaks when a government changes DST rules.
- **Dates** (birthdays, due dates, billing periods): `date`. **Durations**: `interval` or integers with the unit in the name (`timeout_ms`).
- **User time zone**: IANA ID, never a fixed offset or an abbreviation like `EST`.
- **Names**: one `full_name` (plus optional `display_name`), any characters. **Emails**: store as entered, unique on `lower(email)`, verify by sending. **Phones**: E.164 + raw input, parsed with libphonenumber. **Addresses**: country code + free-form lines + structured fields only where tax or shipping needs them; snapshot onto orders.

SQL and the failure stories behind each rule: `references/time-money-people.md`.

## Deletion, history, and retention

Deletes must be recoverable for a window — Atlassian (2022) deleted 883 customer sites by script and needed up to two weeks to restore — but `deleted_at` on every table leaks into every query. Default:

| Need | Default |
|---|---|
| Ordinary rows, no product "trash" | Hard delete from the live table + copy the row as JSON into `deleted_records` (retention window, then purge) |
| Product has trash/restore | `deleted_at` + partial unique indexes `WHERE deleted_at IS NULL` + a `live_` view the app uses |
| "Deleted" is really a business state | A status (`closed`, `archived`) — it is not deletion |
| Tenant/account deletion, bulk deletes | Scheduled with a grace period, dry-run output first, one identifier type per API, audited |

- **Audit log** (who did what, when): append-only table written in the same transaction as the change (or by trigger) with `actor_id`, `action`, `entity_type`, `entity_id`, `diff jsonb`, `occurred_at`, `request_id`.
- **History** ("what did it look like at time T"): a `<table>_history` filled by trigger with `valid_from`/`valid_to`; bitemporal (valid time + recorded time) for finance, insurance, HR. Decide now — history not recorded is gone.
- **PII**: inventory it per column, keep it in few tables keyed by user, give every table a retention rule and a purge job, and design an erasure path that reaches search indexes, warehouses, caches, logs, and processors. Legal specifics (e.g., GDPR erasure) need counsel; this is not legal advice.

Patterns and SQL: `references/patterns-and-antipatterns.md` (deletion, audit, history) and `references/time-money-people.md` (PII, retention).

## Multi-tenancy

Default: shared tables with `tenant_id` (details and alternatives in `scalability`). Make cross-tenant references impossible, not just unlikely:

```sql
CREATE TABLE projects (
  tenant_id bigint NOT NULL REFERENCES tenants(id),
  id        bigint GENERATED ALWAYS AS IDENTITY,
  name      text NOT NULL,
  PRIMARY KEY (tenant_id, id)
);
CREATE TABLE tasks (
  tenant_id  bigint NOT NULL,
  id         bigint GENERATED ALWAYS AS IDENTITY,
  project_id bigint NOT NULL,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, project_id) REFERENCES projects (tenant_id, id)
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tasks
  USING (tenant_id = current_setting('app.tenant_id')::bigint)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint);
-- per request: BEGIN; SET LOCAL app.tenant_id = '42'; … COMMIT;
```

`tenant_id` NOT NULL on every tenant-owned table, leading every composite index and unique constraint. The app role must not be superuser or `BYPASSRLS`; use `SET LOCAL` with transaction poolers. The tenant is also your future shard key (Notion, Shopify).

## JSONB

Use for sparse or heterogeneous attributes rarely filtered (per-integration settings), verbatim external payloads (webhook bodies), and data always read and written whole with its parent. Make it a column when you filter, join, sort, aggregate, or constrain on it, or when it is really a list of child rows updated independently.

```sql
ALTER TABLE integrations ADD COLUMN config jsonb NOT NULL DEFAULT '{}'
  CHECK (jsonb_typeof(config) = 'object');
ALTER TABLE integrations ADD COLUMN region text GENERATED ALWAYS AS (config->>'region') STORED;
```

Validate shape at the app boundary (JSON Schema, zod, pydantic) and store a version field.

## Relationships and anti-patterns

| Situation | Default | Never |
|---|---|---|
| Many-to-many | Join table with composite PK + reverse index; name it after the relationship (`memberships`) | Arrays of IDs you need to join or constrain |
| One child, several parent types | Exclusive arc (one nullable FK per parent + `CHECK (num_nonnulls(a_id, b_id) = 1)`), per-parent join tables, or a common supertype | Polymorphic `(commentable_type, commentable_id)` — no FK possible |
| User-defined fields | Typed `custom_field_definitions` + `custom_field_values`, or JSONB | EAV `attributes(entity_id, name, value text)` for known attributes |
| Trees | Adjacency list (`parent_id`) + recursive CTE; closure table for heavy subtree/ancestor queries; `ltree` for path-like data | Nested sets for data that changes |
| Counters on hot rows | Derive with `count(*)`, slotted counters, or buffered increments; conditional decrement for stock | `UPDATE … SET n = n + 1` on one row from every request |
| Concurrent edits | `version` column; `UPDATE … WHERE id = $1 AND version = $2`; 0 rows → 409; expose as ETag | Last write silently wins on user-edited records |
| External side effects and events | `idempotency_keys` table and transactional `outbox`; consumers dedupe with an inbox table | Save, then publish from app code |

SQL for each: `references/patterns-and-antipatterns.md`.

## Safe migrations

Most `ALTER TABLE` forms take an ACCESS EXCLUSIVE lock, and a DDL statement waiting behind a long query blocks every query after it — an outage even when the change itself is instant. Always:

```sql
SET lock_timeout = '2s';   -- fail fast and retry with backoff instead of queueing everyone behind you
```

| Change | Safe recipe |
|---|---|
| Add nullable column / constant default | Direct (metadata-only since PG11); volatile defaults rewrite the table |
| Add NOT NULL | `CHECK (col IS NOT NULL) NOT VALID` → `VALIDATE` → `SET NOT NULL` (PG12+ skips the scan) → drop the check |
| Add FK or CHECK | `ADD CONSTRAINT … NOT VALID`, then `VALIDATE CONSTRAINT` |
| Add index / unique | `CREATE [UNIQUE] INDEX CONCURRENTLY` outside a transaction; attach unique with `USING INDEX` |
| Change type, rename, drop | Expand/contract: new column, dual-write, batched backfill, switch reads, drop later |

Backfills run as resumable jobs in batches of ~1k–10k rows with a keyset cursor, throttled on replication lag — never one giant `UPDATE`. Before any destructive step, confirm a recently restore-tested backup and print the target database (GitLab 2017: several backup mechanisms, none working when needed). Lint migrations in CI (strong_migrations, Squawk, Django's concurrent index operations); use pgroll or gh-ost where they fit.

Lock table, worked example, tools, and the migration PR checklist: `references/migrations.md`.

## Indexing

Index for the queries you have: equality columns first, then the range/sort column (`(tenant_id, status, created_at DESC)`); every FK column; partial indexes for skewed predicates (`WHERE status = 'pending'`); expression indexes matching the query exactly (`lower(email)`); `INCLUDE` for index-only scans; GIN for JSONB/arrays/full-text, GiST for ranges and exclusion, BRIN for huge time-ordered tables. Drop indexes with no scans. Verify with `EXPLAIN (ANALYZE, BUFFERS)`. Details: `references/indexing.md`; slow-query triage in production: `scalability`.

## Naming conventions

`snake_case`, unquoted, one plural-or-singular table style per codebase; PK `id`; FK `<entity>_id`; instants `<verb>_at` (`paid_at`), dates `<noun>_on` or `_date`; timestamps over booleans when "when" matters (`verified_at` over `is_verified`); units as suffixes (`_ms`, `_bytes`, `_minor`); constraints and indexes named `<table>_<cols>_<type>` (`orders_customer_id_fk`); avoid reserved words (`user`, `order`, `group`) and type prefixes.

## Beyond one relational database

- **DynamoDB single-table design** fits when access patterns are few, known, and latency-critical at scale; each pattern becomes one `Query` on PK/SK or a GSI. It is inflexible to new patterns and hard to analyze — often not worth it when product queries change often.
- **Event sourcing**: `events(stream_id, version, …)` with `PRIMARY KEY (stream_id, version)` for optimistic concurrency; rebuildable projections; keep PII out of events or crypto-shred it. Only where history *is* the requirement.
- **Analytics**: keep OLTP normalized; move analytics to a replica short-term, then change data capture into a warehouse (Notion: Postgres → CDC → lake). Treat CDC topics as a public contract.
- **SQLite in production** is legitimate for single-node, per-tenant, or edge databases with WAL, `busy_timeout`, `foreign_keys = ON`, and continuous off-host backup.

Details: `references/nosql-and-analytics.md`.

## Review checklist

- [ ] Access patterns and invariants listed; each invariant mapped to a constraint or transaction.
- [ ] NOT NULL by default; CHECKs for domains; UNIQUE for business keys (tenant-scoped, case-insensitive).
- [ ] FKs declared, FK columns indexed, `ON DELETE` chosen deliberately.
- [ ] 64-bit keys; public IDs non-sequential; authorization still enforced.
- [ ] Money = integer minor units or numeric + currency; no floats; prices and addresses snapshotted.
- [ ] `timestamptz` for instants; local time + IANA zone for future events; `date` for dates.
- [ ] Deletion recoverable for a window; soft delete justified; retention and purge defined.
- [ ] Tenant isolation: `tenant_id` everywhere, composite FKs, RLS as defense in depth.
- [ ] No polymorphic FKs, no EAV for known attributes, JSONB only for sparse/opaque data.
- [ ] Hot rows and contested edits have concurrency control; side effects use idempotency and outbox tables.
- [ ] Migration states lock level, `lock_timeout`, backfill plan, rollback; backup restore-tested.
- [ ] Indexes match top queries (EXPLAIN verified); no redundant or unused indexes.
- [ ] PII inventoried; history/audit decided; analytics off the primary.

## Gotchas

- **Designing tables from the UI form.** Forms change monthly; start from entities, invariants, and access patterns.
- **"The service validates it."** Two concurrent requests both pass the check; only a constraint sees all writers. Handle the violation error (map to 409/422).
- **Forgetting FK indexes in Postgres.** Deletes on the parent scan the child table; joins slow down. MySQL/InnoDB creates them; Postgres does not.
- **UUIDv4 as the PK of a large, write-heavy table.** Random inserts bloat indexes and WAL; use identity or UUIDv7.
- **Floats or `/100` for money.** Minor-unit exponents vary by currency; mixing major and minor units has caused 100× charges.
- **`timestamp` without time zone for events, or UTC-only for future meetings.** The first loses the instant; the second breaks when DST rules change.
- **`first_name`/`last_name` required, ASCII-only.** Many people have one name, several family names, or non-Latin scripts.
- **Soft delete bolted on everywhere.** Every query must filter; unique constraints break; deleted PII lingers. Archive table by default; `deleted_at` only for real trash/restore.
- **Unique constraints without `tenant_id`.** Tenant A's user blocks tenant B from using the same email.
- **Polymorphic associations from ORM generators.** The database cannot enforce them; orphans accumulate.
- **`ALTER TABLE` without `lock_timeout`, or `CREATE INDEX` without `CONCURRENTLY`, on a live table.** A blocked lock queue takes the app down.
- **Schema and code change in one deploy.** Old and new code run side by side; each step must be compatible with both.
- **One-shot backfill `UPDATE` on millions of rows.** Long locks, bloat, replica lag. Batch it.
- **Enum values stored as bare integers.** Unreadable in SQL and silently reusable; use text + CHECK or a lookup table.
- **Analytics queries on the primary.** Move them to a replica or warehouse before they cause an incident.

## Output format

For schema design or review, reply with:

```
Assumptions: <DB + version, existing conventions (Observed/Inferred)>
Access patterns: AP1 … (frequency, latency)   Invariants: I1 … → enforced by <constraint/txn/reconciliation>
DDL: <complete CREATE TABLE / INDEX statements>
Decisions: <keys, tenancy, deletion/history, money/time choices — one line each with why>
Migration (if changing a live schema): <ordered steps, lock level, lock_timeout, backfill, rollback>
Not checked: <e.g., production row counts, EXPLAIN on real data>
```

## References

| File | Read when |
|---|---|
| `references/keys-and-constraints.md` | choosing primary/public IDs, writing constraints (CHECK, UNIQUE, FK, EXCLUDE, deferrable), enums vs lookup tables, or naming |
| `references/time-money-people.md` | storing money, currencies, ledgers, timestamps, time zones, recurring events, names, addresses, emails, phones, or designing PII retention and erasure |
| `references/patterns-and-antipatterns.md` | soft delete, audit/history, multi-tenancy, JSONB, polymorphic associations, EAV, many-to-many, trees, counters, optimistic locking, idempotency/outbox tables, or denormalization |
| `references/migrations.md` | changing a live schema: adding columns/constraints/indexes, changing types, renaming, backfilling, or reviewing a migration PR |
| `references/indexing.md` | deciding which indexes a new table needs, composite order, partial/expression/covering indexes, index types, or removing indexes |
| `references/nosql-and-analytics.md` | DynamoDB or Cassandra modeling, document stores, event-sourcing storage, CDC to a warehouse, star schemas, or SQLite in production |

## Related skills

- `system-design` — the end-to-end method this schema serves (requirements, estimates, rollout).
- `data-infrastructure` — which database, cache, queue, or warehouse to use.
- `scalability` — slow queries, replicas, partitioning, sharding, pooling, and RLS with poolers.
- `api-design` — exposing IDs, pagination cursors, ETags, and idempotency keys over HTTP.
- `application-security` — authorization (IDOR/BOLA), encryption of sensitive fields, and logging without PII.
- `reliability` — rolling out migrations safely, backups, and restore drills.
