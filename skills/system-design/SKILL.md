---
name: system-design
description: Use when designing a system, service, or large feature end to end, or writing or reviewing a design doc, RFC, or technical proposal — problem framing, requirements and non-goals, SLOs and downtime budgets, back-of-envelope and data-size estimates, access patterns and invariants, data model, API sketch, high-level architecture, deep dives, failure modes, trade-offs and alternatives considered, rollout and migration plans (dual-write, shadow reads, logical sharding, cells), and real case studies (Discord, Figma, Notion, Shopify, Stripe, Slack, GitHub, Segment, Prime Video). Also use when the user says "design X", "how would you architect this?", "write a design doc", "we need to move from A to B without downtime", or "review this design". Not for individual scaling techniques (use scalability), table-level schema design (use data-modeling), picking a database, cache, or queue product (use data-infrastructure), or module structure (use software-architecture).
license: MIT
metadata:
  version: "1.0.1"
  category: engineering
  related: "data-modeling scalability data-infrastructure software-architecture reliability api-design"
---

# System Design

System design turns a vague goal into explicit decisions about data, interfaces, components, and failure behavior — with the trade-offs written down so someone can disagree with them. This skill runs a fixed method in a fixed order: requirements, numbers, access patterns, and invariants come before any box is drawn, and every design ends with a rollout plan that can be reversed. Almost every real case study is a migration from an existing system, not a greenfield drawing; the method treats "how do we get there safely" as part of the design. The outcome it protects: a design that meets measured needs with the fewest moving parts, and a document that still explains itself a year later.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Access patterns and invariants before boxes.** If you cannot list the top reads and writes and the rules that must never break, you are not ready to choose a database or a topology.
2. **Start from what exists.** The design problem is usually "get from here to there without downtime"; read the current code, data, contracts, and numbers first.
3. **Numbers are estimated or measured, never assumed.** Label every figure *Estimated* or *Measured*; most products never need sharding, and the ones that did postponed it for years.
4. **Buy runway with cheap levers before distributing.** Bigger instance, indexes, replicas, pooling, caching, and splitting tables across databases come before sharding or new services (Figma, Notion, Stack Overflow).
5. **Write every trade-off as a sentence someone can disagree with.** "We choose X over Y because R matters more than P here; it costs C; revisit if M crosses T."
6. **Design the migration, not just the destination.** Every phase has entry and exit criteria, a verification step, and a rollback.
7. **Cost and service count are requirements.** Each deployable, datastore, and hop is paid for forever in money, latency, and on-call load (Segment, Prime Video).
8. **Consistency is chosen per operation, not per system.** Money, inventory, and auth get strong guarantees; feeds, counts, and search get a stated staleness bound.

## Workflow

The 13 steps. Write steps 1–5 before drawing anything; a mini design (small change) may compress 7–10 into a few lines, but never skips 5, 11, or 12.

- [ ] **1. Problem and context.** Output: a 3–5 sentence problem statement and what exists today (code, data, contracts, current load). Ask: what triggers this now, what breaks if we do nothing, what already exists that we can reuse? Skipped → solving the wrong problem or rewriting something that works.
- [ ] **2. Functional requirements and non-goals.** Output: numbered user-visible behaviors plus explicit non-goals. Ask: what must a user be able to do; what might a reader assume is in scope but is not? Skipped → scope creep and gold-plating.
- [ ] **3. Non-functional requirements (SLOs).** Output: the per-operation table in "Requirements and SLOs" below, plus data requirements (retention, PII, residency, deletion) and a cost ceiling. Ask: which operations need strong consistency; how stale may everything else be? Skipped → the strictest level everywhere (over-built), or money paths built like feeds (under-built).
- [ ] **4. Estimates.** Output: users, average and peak QPS, read:write ratio, data size now/+1y/+3y, the largest tenant or hottest key. Ask: at which number does the next step (replica, partition, shard) become necessary? Skipped → premature sharding, or a design that fails at a fraction of expected load (Prime Video hit a hard limit at ~5%).
- [ ] **5. Access patterns and invariants.** Output: top 5–10 queries/commands with frequency and latency need; every invariant, each mapped to a constraint, a transaction, or "eventual + reconciliation". Ask: what must always be true (balance ≥ 0, one active subscription, no double booking)? Skipped → a schema that cannot answer the main query cheaply; invariants enforced only in app code, which races.
- [ ] **6. Data model.** Output: entities, keys, relationships, constraints, owner module per table, partition key if any. Hand the table-level detail to `data-modeling`. Skipped → hot partitions (Discord), cross-shard joins everywhere.
- [ ] **7. API sketch.** Output: endpoints, commands, or events with request/response shapes, idempotency, pagination, and errors (details in `api-design`). Ask: which writes can be retried over a network? Skipped → chatty APIs and non-idempotent writes.
- [ ] **8. High-level design.** Output: one C4 container diagram (Mermaid) — clients, edge, deployables, datastores, queues, third parties. Ask: what is the *simplest* topology that meets steps 2–5? Skipped or overdone → a distributed monolith, unneeded components.
- [ ] **9. Deep dives.** Output: 2–4 of the riskiest parts examined in detail (flows including failure paths, concurrency, hot keys). Ask: where is uncertainty highest? Go there, not to the comfortable parts. Skipped → hand-waving the hard part.
- [ ] **10. Bottlenecks and failure modes.** Output: table of component → failure → detection → mitigation → blast radius. Ask: what happens at 100% DB CPU, when a dependency times out, when a zone or region fails? Skipped → outages discovered in production.
- [ ] **11. Trade-offs and alternatives.** Output: "Alternatives considered" including *do nothing / smallest change* and *boring off-the-shelf*, each with why-not; key choices in the trade-off sentence form. Skipped → decisions nobody can later explain or revisit.
- [ ] **12. Rollout and migration.** Output: phases with flags, dual-write or shadow-read plan, backfill, verification, rollback per phase, success metrics (patterns in `references/migrations-and-rollouts.md`). Skipped → big-bang cutovers.
- [ ] **13. Operations.** Output: SLIs and alerts tied to the SLOs, dashboards, runbook, owning team, cost estimate. Ask: who gets paged, and how do we know it works? Skipped → unowned systems.
- [ ] **Validate** against the review checklist and Gotchas below; fix and repeat until clean.

Per-step question lists, a worked example, and diagram guidance: `references/method.md`.

## Size the design to the change

| Change | Artifact | Must contain |
|---|---|---|
| Reversible, local (one module, no new infra, no schema change) | No design doc; a PR description | Problem, approach, test plan |
| Medium (new table/endpoint set, new job, cross-module change) | Mini design doc, 1–3 pages | Steps 1, 2, 5, 6, 11, 12 |
| One-way door (new datastore or service, data migration, public API, tenancy or sharding model) | Full design doc (`assets/design-doc-template.md`) + ADRs for each decision | All 13 steps |

A design doc is worth writing only when there are real trade-offs; if it would just be an implementation manual, write the code. An ADR records one decision; a design doc covers a project and usually produces several ADRs (see `software-architecture`).

## Requirements and SLOs

Write non-functional requirements per operation, not per system:

| Operation | Latency target | Availability | Consistency | Durability / RPO | Notes |
|---|---|---|---|---|---|
| Capture payment | p99 < 1 s | 99.95% | Strong + idempotent | RPO 0 | Idempotency key, reconciliation job |
| Load dashboard | p95 < 300 ms | 99.9% | ≤ 60 s stale OK | Derived; rebuildable | Served from read model/replica |
| Search | p95 < 500 ms | 99.5% | ≤ 5 min stale OK | Rebuildable from source | Index fed by CDC/outbox |

- **SLI** = good events / valid events (e.g., share of `POST /orders` returning non-5xx within 300 ms). **SLO** = target over a window. **Error budget** = 1 − SLO. Details: `reliability`.
- Always add **data requirements** (retention period, PII categories, residency, deletion deadline) and a **cost ceiling** (per month or per unit: per tenant, per 1k requests).
- Privacy-law obligations (for example GDPR's right to erasure) shape the data design; note them as requirements and have counsel confirm them — this skill is not legal advice.

**Downtime budgets** (computed; 30-day month):

| SLO | Bad minutes / 30 days | Per year |
|---|---|---|
| 99% | 432 min (7.2 h) | ~3.65 days |
| 99.5% | 216 min (3.6 h) | ~1.83 days |
| 99.9% | 43.2 min | ~8.76 h |
| 99.95% | 21.6 min | ~4.38 h |
| 99.99% | 4.32 min | ~52.6 min |
| 99.999% | ~26 s | ~5.3 min |

Serial dependencies multiply: three 99.9% dependencies in a request path give at most ≈ 99.7%. A 99.99% target rules out any manual failover step and any dependency with a lower SLO in the critical path.

## Estimation habits

Use the numbers reference in `scalability` for latency numbers, rps conversions, and Little's law. Add these data habits:

- **Size the data, not just the traffic.** Row size ≈ sum of column sizes + per-row overhead (tens of bytes in Postgres) + each index. × rows per year × years retained. Compare with one node's RAM (working set) and disk.
- **Find the biggest thing, not the average.** Largest tenant, most-read channel, celebrity account. Discord's problem was hot partitions from a few huge servers, not total volume.
- **Write growth trigger points.** "Read replica at sustained 60% primary CPU; move `events` to its own database at 2 TB; shard only when a single primary cannot hold the write rate after both." The design then says *not yet*, with a threshold.
- **Price it.** Unit cost per request/tenant/active user; include data transfer between stages (Prime Video paid per state transition and per S3 hand-off).

Worked estimates and a sizing worksheet: `references/estimation.md`.

## Access patterns and invariants

Write them as two lists before any schema or diagram:

```
Access patterns (frequency, latency need)
AP1 Get order with lines by id — hot, p95 < 50 ms
AP2 List a tenant's orders newest first, paginated — hot
AP3 Monthly revenue by country — analytics, minutes stale OK → not on the primary
Invariants (enforced by)
I1 Order total = sum of lines — same transaction
I2 Email unique per tenant, case-insensitive — UNIQUE (tenant_id, lower(email))
I3 A room is never double-booked — exclusion constraint
I4 Every paid order produces exactly one shipment — outbox + idempotent consumer + reconciliation
```

Every invariant maps to a database constraint, a single transaction, or an explicit eventual mechanism plus a reconciliation check. "The service checks first" is not enforcement.

## High-level defaults

Default to the smallest topology; product choices belong to `data-infrastructure`.

| Need | Default | Add something only when |
|---|---|---|
| Compute | One deployable (modular monolith) + one worker process | A part needs independent scaling, runtime, or release cadence now (`software-architecture`) |
| Primary data | One managed Postgres | Measured limits after the scaling ladder (`scalability`) |
| Background work | Postgres-backed queue, enqueued in the business transaction | Many independent consumers, replay, or very high throughput |
| Cache | None → HTTP/CDN caching → in-app cache → shared cache | A measured hot read that tolerates stated staleness |
| Search | Database full-text search | Relevance tuning, facets, or scale the database cannot serve |
| Files | Object storage + CDN, signed URLs | — |
| Analytics | Read replica → change data capture into a warehouse | Heavy reports touch the primary |
| Cross-system change feed | Transactional outbox | Many systems need the same stream → durable log |

## Trade-off sentences

Require this form for every non-trivial choice:

> We choose **X** over **Y** because **R** matters more than **P** here. This costs us **C**. We will revisit if **M crosses T**.

- Figma multiplayer: server-ordered, per-property last-writer-wins over full CRDTs, because a central server exists anyway and simplicity wins; costs peer-to-peer/offline editing.
- Segment: one service for all destinations over one service per destination, because operational overhead dominated; costs fault isolation between destinations.
- Prime Video monitoring: one process over a serverless pipeline, because per-transition and inter-stage transfer costs dominated; costs independent scaling of stages.

## Failure modes

For each critical component, fill one row:

| Component | Failure | Detection | Mitigation | Blast radius |
|---|---|---|---|---|
| Primary DB | CPU saturated / failover | p99 latency, CPU, replication lag alerts | Load shedding, pooled connections, tested failover | All writes |
| Payment provider | Timeouts | Error-rate SLI on outbound calls | Timeout + retry with idempotency key, circuit breaker, queue and reconcile | Checkout only |
| Queue consumer | Poison message | Age of oldest message, DLQ size | Retry cap → DLQ + replay tool | One job type |

Resilience mechanics (timeouts, retries, breakers, bulkheads): `reliability`. Real outages behind these rows: `lessons-from-failures`.

## Migration and rollout patterns

These recur in almost every published case; name them in the plan.

| Pattern | Use when | Seen at |
|---|---|---|
| **Dual-write → verify (shadow/dark reads) → switch reads → switch writes → delete old** | Moving data between stores or schemas online | Stripe, Notion |
| **Comparison testing** — run old and new paths, log mismatches | Any rewrite of a read path or computation | Stripe, Notion dark reads |
| **Logical before physical** — route as if split while data still sits together | Splitting or sharding a database | Figma logical sharding, GitHub virtual partitions |
| **Many logical shards on few machines** — fix a large logical count up front | Any sharding, so capacity grows without re-hashing | Notion (480 logical / 32 physical), Instagram, Pinterest |
| **Data-access layer or proxy first** | Before replacing or splitting a datastore | Discord data services, Figma DBProxy, Vitess at Slack/GitHub |
| **Enforce boundaries in CI before moving data** | Splitting a shared database by domain | GitHub SQL linters for cross-domain queries |
| **Cells / pods** — independent stacks per tenant group | Blast-radius isolation at scale | Shopify pods |
| **Strangler fig** — carve out one piece at a time behind a routing seam | Replacing a legacy system or extracting services | Airbnb, Shopify componentization |

Phase templates, backfill rules, verification metrics, and rollback criteria: `references/migrations-and-rollouts.md`.

## What the case studies agree on

1. Postpone distribution; buy runway with cheap levers (Figma, Notion, Stack Overflow).
2. Add an indirection layer before changing storage (Discord, Figma, Slack, GitHub).
3. Logical first, physical second (Figma, GitHub, Notion, Instagram).
4. The tenant is usually the right partition key — until tenants share data or become huge (Notion, Shopify, Slack).
5. Verify migrations by comparison and keep a rollback at every step (Stripe, Notion, Figma).
6. Service count is a cost (Segment, Prime Video, Uber, Airbnb).
7. Cost is an architectural requirement (Prime Video, 37signals, Dropbox).
8. Time-sortable IDs are a recurring enabler (Twitter Snowflake, Instagram, Discord).

Cases with numbers and sources: `references/case-studies.md`.

## Review checklist

Use when reviewing a design (yours or someone else's):

- [ ] Problem, goals, and **non-goals** are stated; success is measurable.
- [ ] Every number is labeled Estimated or Measured; peak and p99, not averages; largest tenant/hot key named.
- [ ] Access patterns and invariants are listed, and each invariant has an enforcement mechanism.
- [ ] Consistency and staleness are stated per operation; money/inventory/auth paths are strong and idempotent.
- [ ] The topology is the simplest that meets requirements; each extra component has a trigger with a number.
- [ ] Data ownership is clear (one writer module per table); PII, retention, and deletion are designed.
- [ ] Every network write is idempotent or safe to retry; every list is bounded; every call has a timeout.
- [ ] Failure-mode table covers the primary datastore, each external dependency, and each queue.
- [ ] Alternatives include "do nothing/smallest change" and "boring off-the-shelf", with honest why-nots.
- [ ] Rollout has phases, verification, rollback per phase, and a cleanup (contract) phase.
- [ ] Operations: SLIs/alerts, dashboards, runbook, owner, cost estimate.
- [ ] Hard limits listed (32-bit IDs, quotas, file-size caps, connection limits) with percent-to-limit alerts.

## Gotchas

- **Drawing the architecture first.** A diagram before access patterns becomes a set of boxes the data model is bent to fit. Gate step 8 on steps 1–5 being written.
- **The interview answer.** Microservices + Kafka + sharding + CQRS for a product with thousands of users is a failure, not rigor. Stack Overflow (2016) served one of the web's busiest sites from a .NET monolith on nine web servers.
- **Uniform "five nines".** Each extra nine multiplies cost; set SLOs per operation and derive them from user impact.
- **Averages and totals.** Design for peak (3× average if unknown), p99, and the biggest tenant.
- **Greenfield thinking on a brownfield system.** A design without a path from today's system and data is half a design.
- **Strawman alternatives.** Listing only options you already rejected hides the real trade-off; always include the smallest change and the boring product.
- **Sharding before vertical partitioning, replicas, and a bigger box.** It is a one-way door; Figma and Notion exhausted cheaper levers first.
- **Choosing the database product before the access patterns.** Pick the data model first; then the store (`data-infrastructure`).
- **Big-bang cutover.** Without dual-write, comparison, and a rollback per phase, the first real test is production.
- **"Exactly once".** Networks deliver at least once; design idempotency and dedupe, then say "effectively once".
- **Invented numbers presented as facts.** If there is no data, write "unknown — assume N (estimate)" and flag it as an open question.
- **Forgetting the delete path.** Retention, erasure, backups, and restore testing are part of the design; a backup never restored is not a backup (GitLab 2017).
- **A design doc that is never updated.** When implementation diverges, update the doc or supersede it; stale docs mislead the next designer.

## Output format

For a medium or large design, produce a design doc from `assets/design-doc-template.md` (mini version: sections 1–4, 6.2, 7, 10). Then reply with:

```
Design: <one-sentence summary of the chosen approach>
Key numbers: <peak QPS, data size +1y, largest tenant/hot key>  (Estimated/Measured)
Top access patterns & invariants: <3–5 lines>
Decisions (trade-off sentences): <2–4 lines>
Rejected alternatives: <option — why not>
Rollout: <phases, each with verification and rollback>
Open questions / Not checked: <list>
```

## References

| File | Read when |
|---|---|
| `references/method.md` | running the 13 steps in detail, needing question lists per step, a worked example, or C4/Mermaid diagram guidance |
| `references/estimation.md` | sizing storage, memory, or growth; finding hot keys; setting growth trigger points; pricing a design |
| `references/case-studies.md` | justifying a choice with a real precedent, or the design resembles chat storage, Postgres scaling, sharding, multi-tenant cells, online migrations, or microservice consolidation |
| `references/migrations-and-rollouts.md` | the design replaces or moves an existing system, datastore, or schema, or needs a phased rollout with rollback |
| `assets/design-doc-template.md` | writing a design doc or RFC |

## Related skills

- `data-modeling` — step 6 in depth: tables, keys, constraints, safe migrations.
- `data-infrastructure` — choosing the database, cache, queue, search, or storage product.
- `scalability` — the scaling ladder, caching, queues, idempotency, and capacity math.
- `software-architecture` — module and service boundaries, ADRs, C4 diagrams.
- `reliability` — SLOs, resilience patterns, safe deploys, incident practice.
- `api-design` — step 7 in depth: resource shapes, errors, pagination, idempotency keys.
