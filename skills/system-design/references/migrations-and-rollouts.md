# Migrations and Rollouts — Moving a Live System Safely

Most real designs are migrations: a datastore replaced, a table split out, a service extracted, a computation rewritten. This file names the patterns that recur across published cases and turns them into phase plans with verification and rollback. Schema-level mechanics (lock levels, `lock_timeout`, batched backfills in SQL) are in `data-modeling` → `references/migrations.md`; deploy mechanics (flags, canaries) are in `reliability`.

## Contents
1. Principles
2. Pattern: dual-write → verify → switch → delete
3. Pattern: shadow reads and comparison testing
4. Pattern: data-access layer or proxy first
5. Pattern: logical before physical (sharding and splitting)
6. Pattern: many logical shards on few machines
7. Pattern: cells
8. Pattern: strangler fig for services
9. Backfills
10. Rollout plan template
11. Rules catalog

## 1. Principles

- **Every phase is reversible until the last.** The destructive step (deleting old data, dropping the old path) comes after a bake period, with a date, and is a separate change.
- **Verify by comparison, not by confidence.** Run old and new side by side on real traffic and measure mismatches before switching.
- **Change one thing per phase.** Reads and writes switch in different phases; schema and code changes ship in different deploys.
- **Keep old and new versions compatible.** During any deploy, two versions of the code run at once; every intermediate state must work with both.
- **Bound the blast radius.** Switch a percentage, a tenant cohort, or a cell first — never everything.
- **Back up before, and prove the backup restores.** GitLab's 2017 database incident showed that having several backup mechanisms is worthless if none has been restore-tested.

## 2. Pattern: dual-write → verify → switch → delete

Stripe's four steps, with verification made explicit:

| Phase | Writes go to | Reads come from | Exit criteria | Rollback |
|---|---|---|---|---|
| 0. Prepare | Old | Old | New store provisioned, schema created, backup verified | Drop new store |
| 1. Dual-write | Old (source of truth) + new | Old | New writes succeed at ≥ 99.9%; failures logged and retried | Stop writing new |
| 2. Backfill | Old + new | Old | All historical rows copied; counts and checksums match | Truncate new, re-run |
| 3. Verify (shadow reads) | Old + new | Old (new read in shadow, compared) | Mismatch rate at or near 0 for a set period; each mismatch class explained | Keep reading old |
| 4. Switch reads | Old + new | New (by cohort: 1% → 10% → 100%) | SLOs hold; no correctness reports | Flip flag back to old |
| 5. Switch writes | New (source of truth); optionally old for rollback | New | Bake period passed | Re-enable old writes, reconcile |
| 6. Delete | New | New | Dated cleanup, final backup of old | Restore from backup |

Details that decide success:
- **Which store is authoritative** in each phase — write it in the plan. Conflicts during dual-write resolve toward the source of truth.
- **Write failures to the new store** during phase 1 must not fail the user request; log, queue for retry, and count them.
- **Dual-write inside one transaction** is only possible when both targets are in the same database. Across systems, use an outbox or change data capture instead of two independent writes, or accept and reconcile the gaps.
- Notion caught up dual-writes via an audit log and verified with dark reads before switching.

## 3. Pattern: shadow reads and comparison testing

- Run the new path for a sample of real requests, return the old result to the user, and compare. Log mismatches with enough context to classify them.
- Compare normalized results (ordering, float rounding, timestamps) to avoid false alarms, but never normalize away real differences.
- Track the mismatch rate as a metric; the exit criterion is a threshold held for a period, plus every mismatch class explained.
- Shadow reads add load; sample (1–10%) and rate-limit them. Never shadow **writes** with side effects (emails, charges, webhooks).
- Figma analyzed live production queries against the planned sharding rules before cutover ("shadow application readiness") to find what would break.

## 4. Pattern: data-access layer or proxy first

Put an indirection between the application and the store **before** changing the store:

| Form | Example | What it enables |
|---|---|---|
| Data service | Discord's Rust data services | Request coalescing, consistent routing, swapping the database underneath |
| SQL-aware proxy | Figma DBProxy; Vitess at Slack and GitHub | Routing by shard key, limited scatter-gather, online re-sharding |
| Repository layer in the monolith | One module owns all access to a table group | Changing the query path in one place; lint for bypasses |

The layer ships and stabilizes first, with no behavior change; the migration happens behind it.

## 5. Pattern: logical before physical

1. Group tables into domains (or colocated groups sharing a shard key).
2. Make the code respect the boundary while everything still lives in one database: lint cross-domain joins and transactions in CI (GitHub), or route queries as if sharded (Figma).
3. Fix every violation the lint or shadow analysis finds.
4. Move data physically — now a routine operation because nothing crosses the boundary.

Order of database splitting, cheapest first: bigger instance and replicas → **vertical partitioning** (table groups to their own databases; Figma paid about 30 s of partial unavailability per move) → horizontal sharding.

## 6. Pattern: many logical shards on few machines

- Fix a large logical shard count up front and map logical → physical with a table. Moving capacity later means moving whole logical shards, never re-hashing rows.
- Choose a highly divisible count so the physical fleet can grow evenly. Notion chose 480 logical shards on 32 databases because 480 divides by many fleet sizes.
- Encode or map the logical shard in the ID (Instagram's 13-bit shard field; Pinterest's shard bits in the 64-bit ID) so routing needs no lookup.
- Keep related data on the same shard key so joins and transactions stay local (Figma "colos"; Notion workspace).

## 7. Pattern: cells

- A **cell** (Shopify "pod") is a full copy of the stateful stack serving a subset of tenants; a thin router maps tenant → cell.
- Rollouts go cell by cell, so a bad change hits one cell first.
- Needs: a tenant-move tool (copy, catch up, cut over), per-cell observability, and a plan for cross-tenant features (they break cell isolation).
- Use at large scale or for strict blast-radius needs; overkill before a single database is under pressure.

## 8. Pattern: strangler fig for services

1. Put a routing seam (proxy, facade, or module interface) in front of the old code.
2. Build the new implementation behind the seam for one capability.
3. Shift traffic gradually with comparison where possible.
4. Delete the old code path.
5. Repeat for the next capability — one at a time, measuring after each.

Airbnb moved from its Rails monolith to services this way and later re-aggregated into larger "macroservices" as service count grew hard to manage; plan for aggregation too. Big-bang rewrites fail far more often than incremental ones (see `lessons-from-failures`).

## 9. Backfills

- Batches of ~1k–10k rows, one transaction per batch, keyset cursor (`WHERE id > $last ORDER BY id LIMIT n`), cursor persisted so the job resumes.
- Idempotent: re-running a batch produces the same result.
- Throttled on replication lag, CPU, and lock waits; paused automatically when they exceed thresholds.
- Runs as a background job, not inside a schema migration.
- Verified: row counts and checksums per range, then shadow reads.
- SQL recipes: `data-modeling` → `references/migrations.md`.

## 10. Rollout plan template

```markdown
## Rollout plan
| Phase | Change | Flag / cohort | Verification (metric, threshold, duration) | Rollback | Owner | Date |
|---|---|---|---|---|---|---|
| 0 | Provision new store; restore-test backup of old | — | Restore completed in __ min | — | | |
| 1 | Dual-write | `x_dual_write` 100% | New-write failure rate < 0.1% for 3 days | Flag off | | |
| 2 | Backfill | job | Counts + checksums match per range | Truncate, rerun | | |
| 3 | Shadow reads | 5% sample | Mismatch rate < 0.01% for 7 days, all classes explained | — | | |
| 4 | Switch reads | 1% → 10% → 50% → 100% | SLOs hold at each step for 24 h | Flag back | | |
| 5 | Switch writes | `x_write_new` | Bake 14 days, no reconciliation diffs | Re-enable old writes + reconcile | | |
| 6 | Contract | — | Final backup of old taken | Restore | | |

Success metrics: <latency, error rate, cost, mismatch rate>
Abort criteria: <any SLO burn above X; data mismatch class unexplained>
Communication: <who is told before phases 4–6>
```

## 11. Rules catalog

### Switch reads and writes in separate phases
**Rule.** Move reads to the new system before writes, each behind its own flag, with verification in between.
**Apply when.** Migrating any data between stores, schemas, or services.
**Do / Avoid.** Do: dual-write → shadow reads → switch reads by cohort → switch writes. Avoid: one deploy that points all traffic at the new database.
**Why.** Separate phases keep a working source of truth at every step, so each step can be rolled back.

### Never shadow side effects
**Rule.** Shadow and comparison traffic may read and compute, never send email, charge, publish, or call webhooks.
**Apply when.** Adding a shadow path or dark launch.
**Do / Avoid.** Do: stub side-effect adapters in the shadow path. Avoid: running the new checkout flow "in shadow" against the real payment provider.
**Why.** Shadow traffic duplicates real requests; duplicated side effects reach real users.

### Date the cleanup
**Rule.** The contract/delete phase has an owner and a date, and ships as its own change after the bake period.
**Apply when.** Any migration or expand/contract change.
**Do / Avoid.** Do: "drop `orders_legacy` after 14 days of clean reconciliation; ticket assigned." Avoid: leaving dual-writes running indefinitely.
**Why.** Unfinished migrations double the code paths and the ways data can diverge.

## Sources

- Stripe, "Online migrations at scale": https://stripe.com/blog/online-migrations
- Notion, "Herding elephants: lessons learned from sharding Postgres at Notion": https://www.notion.com/blog/sharding-postgres-at-notion
- Figma, "How Figma's databases team lived to tell the scale": https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/
- GitHub, "Partitioning GitHub's relational databases to handle scale": https://github.blog/2021-09-27-partitioning-githubs-relational-databases-scale/
- Discord, "How Discord Stores Trillions of Messages": https://discord.com/blog/how-discord-stores-trillions-of-messages
- Slack, "Scaling Datastores at Slack with Vitess": https://slack.engineering/scaling-datastores-at-slack-with-vitess/
- Instagram, "Sharding & IDs at Instagram": https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c
- Pinterest, "Sharding Pinterest: How we scaled our MySQL fleet": https://medium.com/pinterest-engineering/sharding-pinterest-how-we-scaled-our-mysql-fleet-3f341e96ca6f
- Shopify, shard balancing: https://shopify.engineering/mysql-database-shard-balancing-terabyte-scale
- Jessica Tai, "The Human Side of Airbnb's Microservice Architecture": https://www.infoq.com/presentations/airbnb-culture-soa/
- GitLab, postmortem of the January 31, 2017 database outage: https://about.gitlab.com/2017/02/10/postmortem-of-database-outage-of-january-31/
- Martin Fowler, "StranglerFigApplication": https://martinfowler.com/bliki/StranglerFigApplication.html
