# Safe Schema Migrations

How to change a live schema without an outage or data loss. The high-level expand/contract discipline and rollout (flags, canaries) are in `reliability`; moving data between whole systems (dual-write, shadow reads) is in `system-design` → `references/migrations-and-rollouts.md`. This file covers the database mechanics. PostgreSQL first; MySQL tools at the end.

## Contents
1. Why migrations cause outages
2. Lock levels you must know
3. Safe and unsafe changes
4. Worked example: add a required foreign-key column to a big table
5. Changing a column type (int → bigint)
6. Renames and drops
7. Backfills
8. Before anything destructive
9. Tools
10. Migration PR checklist
11. Rules catalog

## 1. Why migrations cause outages

- **Two code versions run at once** during every deploy. A migration that the old code cannot handle (renamed column, new NOT NULL without default) breaks the old pods; one that the new code needs but has not run yet breaks the new pods.
- **The lock queue.** An `ALTER TABLE` needing ACCESS EXCLUSIVE waits behind any running query on the table — and every query that arrives after it waits behind the ALTER, including plain `SELECT`s. An instant change can stall the table for as long as the longest running transaction.
- **Rewrites and scans** of big tables under a strong lock hold it for minutes or hours.
- **Giant single-statement updates** create bloat, long row locks, and replication lag.

## 2. Lock levels you must know

| Operation | Lock | Blocks |
|---|---|---|
| Most `ALTER TABLE` (ADD/DROP COLUMN, ALTER TYPE, SET NOT NULL, RENAME, ADD CONSTRAINT without NOT VALID) | ACCESS EXCLUSIVE | Everything, including reads |
| `CREATE INDEX` (non-concurrent) | SHARE | Writes |
| `CREATE INDEX CONCURRENTLY`, `VALIDATE CONSTRAINT`, `VACUUM`, `ANALYZE` | SHARE UPDATE EXCLUSIVE | Other schema changes, not reads/writes |
| `ADD FOREIGN KEY … NOT VALID` | SHARE ROW EXCLUSIVE on both tables (brief) | Writes briefly; no scan |

Always, for every DDL statement on a live table:

```sql
SET lock_timeout = '2s';        -- give up quickly instead of blocking the queue
SET statement_timeout = '15min';-- bound anything that does scan
```

Retry on lock timeout with backoff (the migration tool or a wrapper loop). Check for long-running transactions first (`pg_stat_activity` where `xact_start` is old).

## 3. Safe and unsafe changes

| Change | Risk | Safe recipe |
|---|---|---|
| Add nullable column | Metadata only | Direct, with `lock_timeout` |
| Add column with constant DEFAULT | Metadata only since PG11 | Direct; volatile defaults (`random()`, `clock_timestamp()`, `gen_random_uuid()`) rewrite the table — add nullable, backfill, then set default |
| Add NOT NULL to existing column | Full scan under ACCESS EXCLUSIVE | `ADD CONSTRAINT … CHECK (col IS NOT NULL) NOT VALID` → `VALIDATE CONSTRAINT` → `ALTER COLUMN … SET NOT NULL` (PG12+ uses the valid check and skips the scan) → drop the check |
| Add FOREIGN KEY | Scan with locks on both tables | `ADD CONSTRAINT … NOT VALID` → `VALIDATE CONSTRAINT` |
| Add CHECK | Scan under ACCESS EXCLUSIVE | `NOT VALID` → `VALIDATE` |
| Create index | Blocks writes for the whole build | `CREATE INDEX CONCURRENTLY` outside a transaction; on failure it leaves an INVALID index — drop it and retry |
| Add UNIQUE constraint | Blocks writes | `CREATE UNIQUE INDEX CONCURRENTLY` → `ADD CONSTRAINT … UNIQUE USING INDEX` |
| Change column type | Usually a full rewrite | Expand/contract (section 5) |
| Widen `varchar(n)` or change to `text` | Metadata only | Direct |
| Rename column or table | Instant, but breaks running code | Expand/contract (section 6) |
| Drop column | Instant, but breaks code still selecting it | Remove from code (and ORM column cache) first, deploy, then drop |
| Drop table | Irreversible | Rename to `_deprecated_<date>` first; drop after a bake period and a verified backup |

## 4. Worked example: add a required foreign-key column to a big table

```sql
-- Deploy 1 (expand): schema only
SET lock_timeout = '2s';
ALTER TABLE orders ADD COLUMN warehouse_id bigint;                               -- nullable, instant
ALTER TABLE orders ADD CONSTRAINT orders_warehouse_id_fk
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) NOT VALID;                -- no scan

-- Deploy 2: application writes warehouse_id on every new or updated order

-- Background job (not a migration): backfill in batches, resumable, throttled
UPDATE orders SET warehouse_id = 1
WHERE id IN (
  SELECT id FROM orders
  WHERE warehouse_id IS NULL AND id > $last_id
  ORDER BY id LIMIT 5000
);
-- store the batch's max id as $last_id; sleep; pause when replica lag or lock waits exceed thresholds

-- Deploy 3 (enforce)
SET lock_timeout = '2s';
ALTER TABLE orders VALIDATE CONSTRAINT orders_warehouse_id_fk;                   -- reads/writes continue
ALTER TABLE orders ADD CONSTRAINT orders_warehouse_id_nn CHECK (warehouse_id IS NOT NULL) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_warehouse_id_nn;
ALTER TABLE orders ALTER COLUMN warehouse_id SET NOT NULL;                       -- no scan (PG12+)
ALTER TABLE orders DROP CONSTRAINT orders_warehouse_id_nn;
CREATE INDEX CONCURRENTLY orders_warehouse_id_idx ON orders (warehouse_id);      -- outside a transaction
```

Rollback at each stage: deploy 1 → drop the column; deploy 2 → revert code (column stays nullable); deploy 3 → drop the NOT NULL.

## 5. Changing a column type (int → bigint)

1. Add `id_new bigint` (nullable).
2. Trigger or application dual-write keeps `id_new = id` for new and updated rows.
3. Backfill existing rows in batches.
4. Build a unique index concurrently on `id_new`; for FKs, repeat the process on referencing columns.
5. In one short transaction with `lock_timeout`: swap names, move the PK constraint using the new index, update the sequence/identity ownership.
6. Keep the old column for a bake period, then drop it.

Plan this long before the limit: monitor sequences and alert when they pass 50% of their maximum. It is far easier to start with `bigint`.

## 6. Renames and drops

Rename a column `name` → `full_name`:
1. Add `full_name` (nullable).
2. Code writes both, reads old.
3. Backfill `full_name` from `name`.
4. Code reads new, still writes both.
5. Add constraints on `full_name` (NOT VALID → VALIDATE → SET NOT NULL).
6. Code stops writing `name`; mark it ignored in the ORM.
7. Drop `name` in a later release.

A view with the old name can bridge readers you do not control. For ORMs that cache column lists (e.g., Rails `ignored_columns`), ignore the column in code one deploy before dropping it.

## 7. Backfills

- Background job, not a schema migration; one transaction per batch of ~1k–10k rows.
- Keyset iteration (`WHERE id > $last ORDER BY id LIMIT n`), cursor persisted so it resumes after a crash or deploy.
- Idempotent: running a batch twice gives the same result.
- Throttle on replication lag, CPU, and lock waits; sleep between batches; run off-peak for very large tables.
- Watch autovacuum: large updates create dead tuples; consider tuning autovacuum on the table during the backfill.
- Verify: count remaining NULLs per range, spot-check values, then enforce constraints.
- Data changes that must be reproducible across environments are code (a job with tests), not one-off console sessions.

## 8. Before anything destructive

GitLab's 2017 database incident: an engineer ran a delete against the primary instead of a replica, and of the several backup and replication mechanisms in place, none turned out to work when needed; hours of data were lost. The Travis CI 2018 incident truncated a production database from a test run pointed at it. Before any destructive step (drop, truncate, mass delete, type swap):

- **Print and verify the target**: host, database name, environment. Refuse if it is production and the task is about dev/test/staging.
- **Confirm a restorable backup**: when it was last restore-tested, and how long a restore takes at production size.
- **Prefer reversible forms**: rename before drop; archive before delete; dry-run output with counts before bulk deletes.
- **Keep one backup outside the blast radius** (different account/provider and credentials).
- **Monitor limits**: sequence usage, transaction-ID age (Postgres wraparound has forced databases read-only for many hours at Sentry and Mandrill), disk.

## 9. Tools

| Tool | Database | What it does |
|---|---|---|
| strong_migrations (Rails), Squawk (SQL linter), Django `AddIndexConcurrently` | Postgres | Flag dangerous DDL in CI; enforce concurrent index builds |
| pgroll | Postgres | Automates expand/contract; serves old and new schema versions at once through versioned views; reversible |
| gh-ost | MySQL | Triggerless online schema change: copies to a ghost table, tails the binlog, pausable, controlled cut-over |
| pt-online-schema-change | MySQL | Shadow table + triggers + swap |
| Vitess / PlanetScale online DDL | MySQL | Managed shadow-table migrations |
| MySQL 8 `ALGORITHM=INSTANT` | MySQL | Instant for many column additions — check the manual for your exact version's limits |

Use the linter always; adopt pgroll or gh-ost when migrations on large tables are frequent.

## 10. Migration PR checklist

```
- [ ] Lock level of each statement, and expected duration on production-size data
- [ ] SET lock_timeout (and statement_timeout) in the migration
- [ ] Compatible with the currently deployed code AND the new code
- [ ] Indexes built CONCURRENTLY (migration not wrapped in a transaction)
- [ ] Constraints added NOT VALID, validated separately
- [ ] Backfill is a separate, resumable, throttled job
- [ ] Rollback steps for each deploy
- [ ] Destructive steps deferred to a later release; backup restore-tested
- [ ] Tested against a production-sized copy (or row counts and timings estimated)
```

## 11. Rules catalog

### Never let DDL wait in the lock queue
**Rule.** Set `lock_timeout` on every DDL against a live table and retry with backoff.
**Apply when.** Any `ALTER TABLE`, `CREATE INDEX` (non-concurrent), `DROP`, or `RENAME`.
**Do / Avoid.** Do: `SET lock_timeout = '2s'; ALTER TABLE …`. Avoid: running DDL while a long analytics query or idle-in-transaction session holds the table.
**Why.** A waiting ACCESS EXCLUSIVE request blocks every later query on the table, turning an instant change into an outage.

### Split schema, code, and data changes
**Rule.** Ship schema expansion, code changes, backfill, enforcement, and contraction as separate steps.
**Apply when.** Any change that alters meaning or requiredness of existing data.
**Do / Avoid.** Do: add nullable → write → backfill → validate → set NOT NULL. Avoid: one migration that adds a NOT NULL column, backfills, and renames in a single transaction.
**Why.** Old and new code run side by side during deploys, and each step needs its own rollback.

### Validate constraints separately from adding them
**Rule.** Add FKs and CHECKs as `NOT VALID`, then `VALIDATE CONSTRAINT` in a later statement.
**Apply when.** Adding a constraint to a table with existing rows.
**Do / Avoid.** Do: `ADD CONSTRAINT … NOT VALID; VALIDATE CONSTRAINT …`. Avoid: `ADD CONSTRAINT … FOREIGN KEY` on a 500M-row table in one step.
**Why.** Validation then scans under a lock that does not block reads or writes; new rows are checked immediately either way.

## Sources

- PostgreSQL docs, explicit locking: https://www.postgresql.org/docs/current/explicit-locking.html
- PostgreSQL docs, ALTER TABLE: https://www.postgresql.org/docs/current/sql-altertable.html
- Xata blog on migrations, exclusive locks, and the lock queue: https://xata.io/blog/migrations-and-exclusive-locks
- postgres.ai, zero-downtime migrations with lock_timeout and retries: https://postgres.ai/blog/20210923-zero-downtime-postgres-schema-migrations-lock-timeout-and-retries
- pgroll: https://github.com/xataio/pgroll
- gh-ost: https://github.com/github/gh-ost
- PlanetScale, online schema change tools comparison: https://planetscale.com/docs/vitess/schema-changes/online-schema-change-tools-comparison
- GitLab, postmortem of the January 31, 2017 database outage: https://about.gitlab.com/2017/02/10/postmortem-of-database-outage-of-january-31/
- Travis CI, 2018 incident post-mortem: https://web.archive.org/web/20191218220440/https://blog.travis-ci.com/2018-04-03-incident-post-mortem
- Sentry, transaction ID wraparound in Postgres: https://blog.sentry.io/transaction-id-wraparound-in-postgres/
- Mailchimp, Mandrill outage: https://mailchimp.com/what-we-learned-from-the-recent-mandrill-outage/
