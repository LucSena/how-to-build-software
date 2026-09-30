---
name: scalability
description: Use when a system must handle more users, requests, or data, or is getting slow under load — capacity estimates and back-of-envelope math, the scaling ladder, caching and cache invalidation, database indexes, N+1 queries, pagination, connection pooling, read replicas, partitioning and sharding, background jobs and queues (Postgres queues, Kafka, durable execution), idempotent consumers, transactional outbox, sagas, consistency models, rate limiting, back-pressure and load shedding, multi-tenant SaaS data isolation (row-level security), and cloud cost. Also use when the user says "this endpoint is slow", "add caching", "will this scale?", "we're launching and expect 10x traffic", "the database is at 90% CPU", "should we add Redis or Kafka?", or "how many servers do we need?". Not for retries, timeouts, circuit breakers, SLOs, or deploy safety (use reliability), HTTP API shape (use api-design), choosing a database, cache, or queue product (use data-infrastructure), or schema design (use data-modeling).
license: MIT
metadata:
  version: "1.1.1"
  category: engineering
  related: "system-design data-infrastructure data-modeling reliability software-architecture api-design"
---

# Scalability

Most systems that "need to scale" need one missing index, one N+1 fixed, and a bounded query — not a new datastore. This skill estimates first, measures second, and then climbs a fixed ladder from the cheapest fix to the most expensive, stopping as soon as the numbers are met. Postgres on one well-sized machine goes very far; every new moving part must earn its place with a number. The outcome it protects: the system meets its load and latency targets at a cost the business can carry, without trading away correctness.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Estimate before designing, measure before optimizing.** Orders of magnitude decide architecture; profiles and query plans decide fixes. Guesses decide neither.
2. **Climb the scaling ladder in order.** The cheap steps (queries, indexes, caching) are also the reversible ones; sharding is a one-way door.
3. **Bound everything.** Every query has a limit, every queue a maximum, every payload a size cap, every pool a size. Unbounded things are future outages.
4. **Assume at-least-once, make it idempotent.** Retries, redeliveries, and double-clicks are normal; duplicates must be harmless.
5. **State the consistency guarantee whenever you add a copy of data.** Every cache, replica, queue, and search index introduces staleness; say how much and how the UI handles it.
6. **Use what Postgres already does before adding a datastore.** Indexes, `SKIP LOCKED` queues, full-text search, JSONB, partitioning, and pgvector cover a lot of ground with one system to operate.
7. **Treat cost as a requirement.** Know the unit cost (per request, tenant, or active user) of what you build.

## Workflow

- [ ] **Get the numbers**: current and 12-month load (DAU, requests/user/day, read:write ratio, payload sizes, data growth), latency targets (p95/p99), and budget. If unknown, estimate with the template in `references/numbers.md` and label it an estimate.
- [ ] **Measure the bottleneck**: traces, `pg_stat_statements` top queries by total time, `EXPLAIN (ANALYZE, BUFFERS)` on the slow ones, CPU/memory/connection saturation, queue age. Gate: you can name the resource that saturates first and the evidence.
- [ ] **Apply the lowest ladder step** that fixes that bottleneck. One change at a time.
- [ ] **Re-measure** against the target with a load test or production metrics. Stop when the target is met with headroom (≤ 60–70% sustained utilization).
- [ ] **Write down new guarantees**: consistency (staleness window), idempotency (keys, dedupe), limits (rate, page, payload), and cost impact.
- [ ] **Validate** against Gotchas; for any new infrastructure, ask the user and draft an ADR (see `software-architecture`).

## Estimate first

| Quick conversion | Value |
|---|---|
| 1 day | ≈ 86,400 s ≈ 10^5 s |
| 1M requests/day | ≈ 12 rps average |
| 100M requests/day | ≈ 1,160 rps average |
| Peak vs average | 2–10× (use 3× if unknown) |
| Redis GET, same zone | ~0.2–1 ms |
| Postgres indexed point lookup incl. network | ~1–3 ms |
| Cross-region round trip (US east↔west) | ~60–80 ms |

**Little's law**: concurrency = arrival rate × time in system. 500 rps × 0.2 s = 100 requests in flight → that is the minimum worker/connection concurrency, before headroom. Use it to size pools, threads, and queue consumers.

**Utilization**: queueing delay grows sharply as utilization approaches 100%. Plan sustained load at ≤ 60–70% of a resource's capacity.

Full latency table, availability math, and the estimation template: `references/numbers.md`.

## The scaling ladder

| Step | Trigger | Action | New risk |
|---|---|---|---|
| 1. Measure | Anything feels slow | Trace, profile, `pg_stat_statements`, `EXPLAIN (ANALYZE, BUFFERS)` | None |
| 2. Fix queries and indexes | Seq scans on large tables, N+1, unbounded reads, O(n²) loops | Add/adjust indexes, eager-load or batch, paginate, select only needed columns | Write overhead per index |
| 3. Cache | Hot, repeatedly read data that tolerates bounded staleness | HTTP/CDN caching first, then cache-aside with TTL + invalidation | Staleness, stampedes, data leaks via bad keys |
| 4. Scale up, then read replicas | CPU/IO saturated after 2–3; read-heavy load | Bigger instance (large single machines go very far); replicas for reads that tolerate lag | Replication lag breaks read-your-writes |
| 5. Move work async | Work > ~100–500 ms not needed for the response; spiky load | Background jobs/queues; return 202 + status | Duplicates, ordering, visibility of failures |
| 6. Partition | Single tables huge (time-series, events, logs) | Postgres declarative partitioning by time; cheap retention by dropping partitions | Queries must include the partition key |
| 7. Shard | Writes or data exceed one primary after all the above | Prefer managed distributed SQL (Citus, Vitess, CockroachDB, Spanner-class) over hand-rolled | One-way door; cross-shard queries and transactions |

Never skip to step 5–7 without evidence that steps 2–4 are exhausted. How Discord, Figma, Notion, Slack, and GitHub climbed this ladder: `references/case-studies.md`.

## Caching defaults

- **Default pattern**: cache-aside (read cache → miss → load from DB → set with TTL). Invalidate by deleting the key **after** the DB transaction commits, or use versioned keys (`product:123:v42`).
- **HTTP first**: content-hashed static assets with `Cache-Control: public, max-age=31536000, immutable`; cacheable GETs with `ETag` and `s-maxage` + `stale-while-revalidate` at the CDN.
- **Keys include every input that changes the value**: tenant, locale, role/permissions, flag variant. **Never cache per-user or authorized data under a shared key** — it leaks data across users.
- **Stampede protection** on hot keys: TTL jitter (±10–20%), single-flight/request coalescing on miss, or background refresh; cache negative results briefly for keys that do not exist.
- **Bound and watch**: memory limit + eviction policy (LRU/LFU), hit ratio (aim > 80–90%, else question the cache), eviction rate, latency. Decide what happens when the cache is down (fall through to DB with a concurrency limit).
- Do not cache what is cheap to compute or rarely read; caching adds a consistency problem and must be justified with numbers.

Patterns, invalidation races, and CDN rules: `references/caching.md`.

## Database defaults

- **Index** every column used in `WHERE`, `JOIN`, `ORDER BY` on hot paths, and **every foreign key** (Postgres does not index FKs automatically). Composite order: equality columns first, then range/sort (`(tenant_id, created_at DESC)`). Remove unused indexes.
- **No N+1**: never run a query or network call inside a loop over a collection — eager-load, batch by IDs (`WHERE id = ANY($1)`), or use a DataLoader. Assert query counts in tests for list endpoints.
- **No unbounded reads**: every list has `LIMIT` (default 20–50, max ~100); keyset (cursor) pagination for large or live data; stream or batch exports.
- **Short transactions**: no HTTP, email, or LLM calls inside a DB transaction.
- **Invariants in the database**: unique, foreign key, and check constraints; atomic updates (`SET stock = stock - 1 WHERE stock >= 1`) or optimistic locking (`version`) instead of check-then-act.
- **Pool size** ≈ (DB cores × 2) + 1 for SSDs — a 4-core DB is well served by ~8–10 active connections. The sum across all app instances stays below `max_connections` minus admin headroom. Use PgBouncer (transaction mode) or a managed pooler for serverless or many instances.
- **Replicas lag** (milliseconds to seconds, unbounded under load): never make read-then-write decisions from a replica; route a user's reads to the primary for a short window after they write.
- **Timeouts**: set `statement_timeout`, `idle_in_transaction_session_timeout`, and a connection-acquire timeout.

Indexing recipes, pagination SQL, pooling gotchas, partitioning, sharding keys: `references/databases.md`.

## Queues and background work

| Option | Default for |
|---|---|
| **Postgres-backed queue** (`FOR UPDATE SKIP LOCKED`; e.g., pg-boss, River, Graphile Worker, Solid Queue, Oban) | **Default** when already on Postgres: enqueue in the same transaction as the business write |
| Redis-based (BullMQ, Sidekiq, Celery) | You already run Redis and need high job rates; configure persistence deliberately |
| Managed queue (SQS, Cloud Tasks, Pub/Sub, Service Bus) | Serverless or cloud-native, no ops appetite |
| Log/stream (Kafka, Redpanda, Kinesis, NATS JetStream) | Many independent consumers, replay, ordered per key, very high throughput |
| Durable execution (Temporal, Restate, DBOS, Inngest, Step Functions) | Multi-step, long-running workflows, sagas, human-in-the-loop, agent runs that must resume |

Rules: consumers are idempotent; lease/visibility timeout > max processing time; retries with backoff and a cap, then a dead-letter queue with alerting and replay; payloads carry IDs and a schema version, not large blobs; alert on **age of oldest message**, not only depth; graceful shutdown on SIGTERM. Details: `references/async-messaging.md`.

## Correctness under concurrency and distribution

- **Idempotency**: consumers dedupe by message ID in the same transaction as the effect (inbox), or effects are naturally idempotent (upsert, set-to-value). HTTP endpoints use `Idempotency-Key` (protocol in `api-design`).
- **Outbox**: when a state change must also publish an event or trigger a side effect, insert the event into an `outbox` table in the same transaction; a relay publishes it. Never "save then publish" in application code.
- **Sagas**: multi-service business transactions use local transactions plus idempotent compensations; orchestrate flows longer than 3–4 steps.
- **Consistency by use case**: money, inventory, uniqueness → strong (single primary, transactions, constraints). Feeds, counters, search, analytics → eventual with a stated bound. Collaborative editing → CRDTs.
- **Clocks**: never order events across machines by wall-clock time; use DB sequences, per-entity versions, or logical clocks.

Patterns with SQL: `references/distributed-patterns.md`.

## Protecting capacity

- **Rate limit** by API key/user/tenant, plus IP for unauthenticated routes. Default algorithm: token bucket (allows bursts up to capacity). Return 429 with `Retry-After`. Separate, stricter limits for login and expensive endpoints (search, exports, LLM calls — limit by tokens or cost, not only requests).
- **Bounded queues everywhere**; an unbounded buffer is a latent out-of-memory crash and unbounded latency.
- **Load shedding**: when overloaded, reject early and cheaply (429/503 + `Retry-After`) instead of queueing until everything times out; shed low-priority traffic first, protect health checks and critical paths (checkout, paid tier).
- **Back-pressure**: propagate "slow down" upstream (consumer pause, 429, reactive `request(n)`), and prefer adaptive concurrency limits over static ones where available.

Algorithms and implementations: `references/distributed-patterns.md`.

## Multi-tenant SaaS

- **Default: pooled** — shared schema with `tenant_id` on every tenant-owned table. Silo (own DB or cell) only for enterprise, regulated, residency, or whale tenants.
- `tenant_id` is the leading column of composite indexes and unique constraints (`UNIQUE (tenant_id, email)`).
- Resolve the tenant from the authenticated token, never the request body; scope every query in the data-access layer **and** enforce Postgres Row-Level Security as defense in depth (set the tenant per transaction with `SET LOCAL`; the app role must not bypass RLS).
- Tenant in cache keys, object-storage prefixes, search and vector filters, logs, and traces (tier — not ID — as a metric label).
- Per-tenant rate limits and concurrency caps against noisy neighbors; tests asserting cross-tenant access is denied.

RLS setup and pooler caveats: `references/databases.md`.

## Cost

- Estimate unit cost: per request, per active user, per tenant, per LLM conversation.
- Common traps: cross-zone/region transfer and egress, NAT gateway processing, always-on over-provisioned instances, log ingestion volume and high-cardinality metrics, object storage without lifecycle rules, chatty service-to-service calls, LLM tokens, serverless at sustained high load.
- Levers: right-size after measuring, autoscaling with sane min/max, caching, batch APIs for offline work, lifecycle and retention policies, cost-allocation tags, budgets with anomaly alerts.

## Gotchas

- **Adding Redis/Kafka/Elasticsearch first.** Check the query plan, indexes, and Postgres features first; a new datastore needs a number it satisfies, an owner, backups, and monitoring.
- **Caching a slow query instead of fixing it.** A missing index cached is still a missing index on every miss and every cold start.
- **Per-user data under shared cache keys.** A classic data leak. Include user/tenant/role in the key or do not cache.
- **Invalidating before commit.** A concurrent reader repopulates the old value; delete after commit, keep TTLs, or version keys.
- **`OFFSET` pagination on large tables.** Cost grows with the offset and rows shift under inserts; use keyset pagination.
- **Pool size = "as big as possible".** Hundreds of Postgres connections slow the database down; size by cores and use a pooler.
- **Reading from a replica right after a write.** Users see their change vanish; route to primary or wait for the replica to catch up.
- **Dual writes** (save to DB, then publish/email). Crashes lose or duplicate events; use an outbox.
- **Non-idempotent consumers.** Duplicates will arrive; dedupe by ID.
- **Averages.** Report and target p95/p99; averages hide the tail users feel.
- **Sharding by a monotonic key** (timestamp, sequential ID) creates a hot shard; shard by the dominant access key with high cardinality (often `tenant_id`).
- **Network calls inside transactions.** Locks are held while waiting on the network; connection pools drain.

## Output format

For a scaling review or plan, reply with:

```
Targets: <load now → 12 months; p95/p99; budget>   (Estimated / Measured)
Bottleneck: <resource + evidence: trace, EXPLAIN, metric>
Plan (ladder order):
  1. <change> — expected effect — how verified
  2. ...
New guarantees: consistency <staleness bound>, idempotency <mechanism>, limits <rate/page/payload>
Capacity: <instances/pool sizes from Little's law, with headroom>
Cost impact: <unit cost before → after, if known>
Not checked: <what you could not measure>
```

## References

| File | Read when |
|---|---|
| `references/numbers.md` | estimating capacity, sizing pools or instances, or computing availability |
| `references/caching.md` | adding or debugging a cache, CDN rules, invalidation, or stampedes |
| `references/databases.md` | slow queries, indexes, pagination SQL, pooling, replicas, partitioning, sharding, or RLS |
| `references/async-messaging.md` | choosing a queue/broker, designing jobs or consumers, DLQs, or ordering |
| `references/distributed-patterns.md` | idempotent consumers, outbox, sagas, consistency choices, rate limiting, or load shedding |
| `references/case-studies.md` | justifying a ladder step with precedent, choosing a partition or shard key, planning sharding or ID generation, or the user asks how Discord, Figma, Notion, Instagram, Pinterest, Slack, GitHub, Dropbox, or LinkedIn scaled |

## Related skills

- `system-design` — when scaling is part of a larger design or migration that needs a design doc and phased rollout.
- `data-infrastructure` — when the ladder justifies a new datastore, cache, queue, or search engine and you must choose which.
- `data-modeling` — keys, constraints, indexes, and safe migrations for the schema being scaled.
- `reliability` — timeouts, retries, circuit breakers, SLOs, and safe rollout of scaling changes.
- `software-architecture` — when scaling pressure suggests new services or datastores (ADR first).
- `api-design` — pagination contracts, `Idempotency-Key`, and rate-limit headers exposed to clients.
