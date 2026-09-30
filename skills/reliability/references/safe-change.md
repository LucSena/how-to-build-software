# Safe Change — Flags, Progressive Delivery, Zero-Downtime Migrations, Incidents, Backups

Change is the largest source of production failure. This file turns each kind of change into small, observable, reversible steps, and covers what to do when one goes wrong anyway.

## Contents
1. Deploy vs release
2. Feature flags
3. Progressive delivery and rollback
4. Zero-downtime schema migrations (expand/contract)
5. Postgres DDL safety rules
6. Incident response
7. Postmortem template
8. Backups and restore drills
9. Rules catalog

## 1. Deploy vs release

- **Deploy** = new code running in production. **Release** = users experiencing new behavior. Keep them separate: deploy dark behind a flag, release by flag, roll back by flag.
- Small, frequent deploys beat large, rare ones: less to review, less to debug, faster rollback.
- Every deploy is reversible within minutes (previous artifact kept; rollback is one command or button; database compatible with both versions).
- Freeze windows are a smell of risky deploys; prefer making deploys safe over making them rare.

## 2. Feature flags

| Type | Purpose | Lifetime | Example |
|---|---|---|---|
| Release | Hide incomplete or risky work until ready | Days–weeks; delete after full rollout | `new-checkout-flow` |
| Experiment | A/B test variants | Duration of the experiment | `pricing-page-variant` |
| Ops / kill switch | Turn off expensive or risky features under stress | Long-lived | `disable-recommendations` |
| Permission | Entitlements per plan or customer | Long-lived (part of the product) | `sso-enabled` |

Rules:
- Use a standard API (OpenFeature) with any provider, so the flag vendor can change.
- **Safe defaults**: code specifies the default used when the flag service is unreachable, and that default is the old, known-good behavior.
- Evaluate security- or billing-relevant flags on the server; client-side flags are visible and editable by users.
- Every flag has an owner and an expiry date; remove release flags (and the dead branch) within weeks — flag debt makes behavior unknowable.
- Test both paths in CI while the flag exists.
- Log flag evaluations for key flags so incidents can be correlated with flag changes; treat flag flips as changes (audited, announced).

## 3. Progressive delivery and rollback

Canary rollout default:

| Stage | Traffic | Bake time | Gate |
|---|---|---|---|
| 1 | Internal users or 1% | 10–30 min | Error rate and latency within SLO vs baseline; no new error types |
| 2 | 5% | 30–60 min | Same, plus business metrics (conversion, job success) |
| 3 | 25% | 1–2 h | Same |
| 4 | 100% | — | Keep watching burn-rate alerts |

- Compare canary against the baseline running the old version at the same time, not against yesterday.
- Automate rollback when the canary breaches thresholds.
- **Blue/green** for instant switch-back when the platform supports two full environments; **shadow traffic / dark launch** to exercise new code paths with real load but discarded results.
- **Rollback first, debug later**: if symptoms correlate with a deploy or flag change, revert immediately, then investigate. Roll forward only when rollback is impossible (e.g., after a non-reversible migration) — and design so that is rare.
- Deploy markers on dashboards for every deploy and flag change.

## 4. Zero-downtime schema migrations (expand/contract)

During every deploy, old and new app versions run together (rolling updates, canaries, rollback). Each migration must work with both. Never combine a breaking schema change with the code that needs it.

**Rename a column `name` → `full_name`:**

1. **Expand** — `ALTER TABLE users ADD COLUMN full_name text;` (nullable, no volatile default).
2. **Dual-write** — deploy code that writes both columns and still reads `name`.
3. **Backfill** — in batches of ~1k–10k rows per transaction, throttled, watching replication lag and locks:
   ```sql
   UPDATE users SET full_name = name
   WHERE id IN (SELECT id FROM users WHERE full_name IS NULL ORDER BY id LIMIT 5000);
   ```
   Run as a job, not inside the migration.
4. **Switch reads** — deploy code reading `full_name` (still writing both).
5. **Enforce** — add constraints safely:
   ```sql
   ALTER TABLE users ADD CONSTRAINT full_name_not_null CHECK (full_name IS NOT NULL) NOT VALID;
   ALTER TABLE users VALIDATE CONSTRAINT full_name_not_null;
   ALTER TABLE users ALTER COLUMN full_name SET NOT NULL; -- PG12+ uses the validated check, no full scan
   ```
6. **Stop writing the old column** — deploy.
7. **Contract** — in a later release, `ALTER TABLE users DROP COLUMN name;` (ORMs that cache columns may need the column ignored first).

The same shape applies to splitting tables, changing types (new column + backfill), and moving data between modules. Tools such as pgroll automate expand/contract with versioned views.

**Other safe-order rules**
- Adding a required field: add nullable → backfill → enforce `NOT NULL`, and make the app send it before enforcement.
- Removing a table or column: stop all reads and writes in code first (deploy), then drop in a later migration.
- Adding an enum value: consumers must tolerate unknown values before producers emit them.
- API/event contracts follow the same rule: consumers first learn to accept the new shape, then producers start sending it.

## 5. Postgres DDL safety rules

- Set `lock_timeout` (e.g., `'2s'`) and `statement_timeout` for migrations; retry on timeout. A DDL statement waiting for an `ACCESS EXCLUSIVE` lock blocks every query queued behind it.
- `CREATE INDEX CONCURRENTLY` / `DROP INDEX CONCURRENTLY` — cannot run inside a transaction block; configure the migration tool to skip its wrapping transaction for that migration. Check for and drop `INVALID` indexes left by a failed concurrent build.
- Foreign keys: `ADD CONSTRAINT … FOREIGN KEY … NOT VALID`, then `VALIDATE CONSTRAINT` in a separate step.
- `ADD COLUMN … DEFAULT <constant>` is metadata-only since PG11; volatile defaults (e.g., `gen_random_uuid()`, `clock_timestamp()`, `random()`) rewrite the table. `now()` is stable and fine.
- Most column type changes rewrite the table → expand/contract instead.
- Never rename or drop columns or tables the running version uses.
- Large data changes are background jobs, not migrations.
- Lint migrations in CI (squawk for Postgres SQL; strong_migrations for Rails); test on a production-sized copy; have a backup and a forward-fix plan.

## 6. Incident response

Roles (one person may hold several in a small team):
- **Incident commander** — coordinates, decides, delegates; does not debug.
- **Operations lead(s)** — investigate and mitigate.
- **Communications** — status page and stakeholder updates at a fixed cadence (e.g., every 30 min).
- **Scribe** — timestamped log of observations, decisions, and actions.

Sequence:
1. **Declare** early; a declared incident that turns out minor costs little.
2. **Assess impact**: which journeys, how many users, since when (SLO dashboards).
3. **Mitigate first**: roll back, flip a kill switch, fail over, shed load, scale up, block an abusive client. Restoring service beats understanding it.
4. **Communicate**: honest, specific, time-stamped updates; say what users should do.
5. **Resolve**, then confirm with metrics for a bake period.
6. **Postmortem** within a few days for every page-worthy incident.

Make policies explicit ahead of time ("rollback first", "anyone may declare an incident", "anyone may flip a kill switch") so responders do not have to guess under pressure.

## 7. Postmortem template

```markdown
# Postmortem: <short title> — <date>
Status: draft | reviewed · Authors: <names> · Incident commander: <name>

## Summary
Two or three sentences: what happened, impact, how it was resolved.

## Impact
Users/tenants affected, duration, journeys degraded, error budget consumed, data affected, SLA credits.

## Timeline (UTC)
- 12:04 Deploy 2026-09-30.3 starts canary at 1%
- 12:11 Burn-rate page fires for checkout availability
- ...

## Contributing factors
Several conditions that combined (technical, process, organizational). No single "root cause"; no individual blame.

## What went well / what was hard
Detection, response, tooling, communication.

## Where we got lucky

## Action items
| Action | Type (prevent / detect / mitigate / process) | Owner | Due | Ticket |
```

Write it from what people knew *at the time*, not with hindsight. Prefer action items that change the system (guardrails, automation, alerts, safer defaults) over "be more careful" or new manual checklists.

## 8. Backups and restore drills

- Define **RPO** (maximum data loss) and **RTO** (maximum time to restore) per datastore with the business.
- Primary databases: continuous backups with point-in-time recovery; keep copies in a separate account and region, protected from deletion by the same credentials that run production.
- Object storage: versioning plus lifecycle rules; replication for critical buckets.
- **A backup is only proven by a restore.** Automate a periodic restore into an isolated environment, run integrity checks (row counts, checksums, app boot and smoke test), record the time taken, and compare to RTO. Alert when the drill fails or is skipped.
- Document the restore runbook step by step; rehearse it in game days with people who have not done it before.
- Include secrets, configuration, and infrastructure-as-code in recovery planning; data alone does not bring a system back.

## 9. Rules catalog

### Ship dark, release by flag
**Rule.** Deploy new behavior behind a flag defaulting to off and release by flipping the flag gradually.
**Apply when.** Any user-visible change with meaningful risk.
**Do / Avoid.** Do: merge `new-invoice-renderer` off, enable for staff, then 5%, then all. Avoid: shipping a rewrite that activates on deploy.
**Why.** Flags make release reversible in seconds without a redeploy and separate code risk from exposure risk.

### Make every migration compatible with both versions
**Rule.** Schema changes follow expand → migrate → contract across separate deploys.
**Apply when.** Renaming, dropping, retyping, or making columns required.
**Do / Avoid.** Do: add `full_name`, dual-write, backfill, switch reads, drop `name` later. Avoid: `RENAME COLUMN` in the same release as the code change.
**Why.** During rolling deploys and rollbacks, the old version runs against the new schema; incompatible changes crash it.

### Roll back before diagnosing
**Rule.** When a symptom correlates with a recent change, revert it first and investigate after.
**Apply when.** Any incident starting near a deploy, flag flip, or config change.
**Do / Avoid.** Do: revert the canary within minutes. Avoid: live-debugging production while users are affected.
**Why.** Mitigation time dominates user impact; understanding can wait for a stable system.

### Prove backups by restoring them
**Rule.** Automate periodic restores and verify them against RTO/RPO.
**Apply when.** Any datastore holding data you cannot regenerate.
**Do / Avoid.** Do: a scheduled job restoring last night's snapshot to a scratch instance and running checks. Avoid: trusting "backups enabled" in a console.
**Why.** Untested backups are latent failures; they are discovered broken exactly when needed.

## Sources

- Pete Hodgson, Feature Toggles (martinfowler.com): https://martinfowler.com/articles/feature-toggles.html
- OpenFeature: https://openfeature.dev/
- Martin Fowler, ParallelChange: https://martinfowler.com/bliki/ParallelChange.html
- Zero-downtime Postgres migrations (expand/contract, lock_timeout): https://dev.to/ahmed_mahmoud360/zero-downtime-postgres-migrations-field-notes-on-expandcontract-locktimeout-and-the-alter-3d3m
- pgroll: https://neon.com/guides/pgroll
- squawk: https://squawkhq.com/ ; strong_migrations: https://github.com/ankane/strong_migrations
- PostgreSQL ALTER TABLE documentation: https://www.postgresql.org/docs/current/sql-altertable.html
- Google SRE Book, Managing Incidents and Postmortem Culture: https://sre.google/sre-book/managing-incidents/ ; https://sre.google/sre-book/postmortem-culture/
- Richard Cook, How Complex Systems Fail: https://how.complexsystems.fail/
