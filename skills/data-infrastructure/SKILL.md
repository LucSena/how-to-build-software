---
name: data-infrastructure
description: Use when choosing, adding, or replacing a data component — which database (Postgres, MySQL, SQLite, MongoDB, DynamoDB, Cassandra, distributed SQL, ClickHouse/DuckDB/warehouse), which cache (Valkey, Redis, Memcached, in-process, CDN, Solid Cache), which queue or stream (Postgres job queues like River/pg-boss/Solid Queue, Sidekiq/BullMQ, SQS, RabbitMQ, Kafka, NATS, durable execution like Temporal), search engine (Postgres FTS, Meilisearch, Typesense, OpenSearch, Elasticsearch, Algolia), object storage (S3, R2, MinIO alternatives), or vector store (pgvector vs dedicated). Covers default stacks by stage, licenses, benchmarks, and exit plans. Also use when the user says "which database should I use?", "should we add Redis?", "do we need Kafka?", "Postgres or MongoDB?", "do I need a vector database?", or "where do I store uploads?". Not for schema design (use data-modeling), indexes, caching patterns, or the scaling ladder (use scalability), or running jobs in production (use deployment-and-infrastructure).
license: MIT
metadata:
  version: "1.0.1"
  category: engineering
  related: "scalability data-modeling system-design tech-stack-selection deployment-and-infrastructure software-architecture"
---

# Data Infrastructure

Most products need one managed Postgres and one S3-compatible bucket for a long time; the rest of the data zoo (Redis, Kafka, Elasticsearch, a vector database, a warehouse) is usually added too early, for a reason nobody measured. Every extra stateful system brings its own backups, failover, upgrades, security patching, monitoring, on-call runbook, bill, and a new consistency boundary with the data you already have. This skill makes the default explicit, names the concrete trigger that justifies each addition, and records the decision so it can be revisited. The outcome it protects: the fewest data systems that meet measured needs, each with a known source of truth, owner, restore path, and exit.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Default to Postgres (managed) plus S3-compatible object storage.** Postgres covers relational data, JSONB documents, job queues, full-text search, vectors, and geospatial data at most products' scale, with one system to operate.
2. **Every new data store needs a measured reason.** Each one adds a consistency boundary, operations work, cost, and new failure modes; "it scales" or "it's the modern way" is not a reason, a number the current store cannot meet after tuning is.
3. **Choose by access pattern and consistency need, not by data "type".** JSON does not imply MongoDB, events do not imply Kafka, embeddings do not imply a vector database, relationships do not imply a graph database.
4. **Treat every copy as derived data.** Caches, replicas, search and vector indexes, and warehouses need a named source of truth, a sync mechanism (outbox or CDC, never a dual write), a staleness budget, and a rebuild procedure.
5. **Never run analytics on the OLTP primary.** Scans evict the working set, long transactions block vacuum, and reports compete with user traffic; use a replica, then a columnar store.
6. **Distrust benchmarks, especially vendor benchmarks.** ClickBench's own README lists its limits (one flat table; the main run executes queries one after another and does not test system capacity) and sums them up as "All Benchmarks Are Liars"; benchmark your workload on your data.
7. **License, governance, and ownership are part of the decision.** Redis, Elasticsearch, CockroachDB, and ScyllaDB changed licenses in 2021–2024, and MinIO's community edition was archived in 2026; check at adoption and at every major upgrade.
8. **Plan the exit.** Prefer open protocols (Postgres wire, S3 API, Redis protocol, Kafka API, SQL) and managed services you can `pg_dump` or replicate out of.

## Workflow

- [ ] **Inventory what exists**: current data stores, their load, who operates them, what the team can restore at 3 a.m. An existing store the team knows usually beats a better one it does not.
- [ ] **Answer the questions** in the next section. Write numbers, not adjectives; mark each *Measured* or *Estimated*. If the user cannot answer, choose the default and say which answer would change it.
- [ ] **Start from the default stack** for the product's stage (table below).
- [ ] **For each proposed addition, name the trigger** from the decision tables and show that the existing store fails it *after* the cheap fixes in `scalability` (indexes, query fixes, pooling, scale-up, replicas). No trigger → do not add it.
- [ ] **Specify the copy**: source of truth, sync mechanism, staleness budget, rebuild or reindex procedure, and what the product does when the copy is down or behind.
- [ ] **Check operations and exit**: managed option, backup and a tested restore (RPO/RTO), cost at 1×, 10×, 100×, license and governance as of today, and the migration path off it.
- [ ] **If performance decides it, run your own benchmark**: your data shape, your query mix, realistic concurrency, data larger than RAM if production will be.
- [ ] **Write the decision record** (Output format) and validate it against Gotchas; fix and repeat.

## Questions before picking a data store

| Area | Ask |
|---|---|
| Data shape | Entities and relationships? Many-to-many joins, cross-row invariants (uniqueness, balances, stock)? Self-contained aggregates always read whole? Large binaries (images, video, PDFs, models)? |
| Access patterns | Top 5–10 queries by frequency and latency: point lookup, range scan, full-text, similarity, aggregation over millions of rows, unbounded-depth traversal? Are patterns **known and stable** or still changing? Read:write ratio? Updates on indexed columns or append-only? |
| Consistency | Which operations need multi-row ACID transactions? Acceptable staleness per feature (0 s for balances, seconds for feeds, minutes for analytics)? Read-your-writes after a user action? Multi-region *writes* truly required, or multi-region reads enough? |
| Scale | Data size now and in 24 months; biggest tables' row counts; peak reads/s and writes/s; payload sizes; p50/p99 targets. Does the working set fit in RAM of one large machine? (It usually does.) |
| Team and ops | What can the team operate and debug? Managed offering on your cloud? Who does upgrades, failover, backups, point-in-time recovery? Has a restore been tested? |
| Cost | Provisioned vs per-request vs storage vs egress pricing, modeled at 1×, 10×, 100×. Hidden costs: cross-zone traffic, egress, replicas, IOPS, support tiers, engineer time. |
| Ecosystem and exit | Drivers and ORM support, migration tooling, runs locally in a container for tests? License (OSI-approved or source-available?), governance (foundation or single vendor)? Wire-compatible alternatives, export format, effort to leave in two years? |

## Databases

Default: **managed Postgres**. One primary goes much further than teams expect: as of January 2026, OpenAI reported running ChatGPT's core Postgres as a single unsharded primary with nearly 50 read replicas, moving only write-heavy, shardable workloads to a sharded store. Scale up, add replicas and a pooler, fix queries, partition big tables, and move derived workloads out long before sharding.

| Situation | Default | Switch when (trigger) | Switch to |
|---|---|---|---|
| New web/mobile backend, any domain | Postgres (managed) | — | — |
| Single server, internal tool, per-tenant DB files, desktop/edge | SQLite (WAL mode) + Litestream backups | More than one app node must write; HA failover needed; heavy concurrent writes | Postgres |
| Team or platform already on MySQL | MySQL | Need Postgres-only extensions (PostGIS depth, pgvector ecosystem) | Postgres |
| Reads saturate the primary | Read replicas + pooler + caching | Writes saturate the primary after scale-up and tuning | Partitioning → app-level sharding, Citus, Vitess (MySQL), or distributed SQL |
| Some records have flexible attributes | Postgres JSONB + GIN index | The whole model is self-contained aggregates, little cross-document querying, team fluent in it | MongoDB / Firestore |
| AWS serverless, key-based access patterns known up front, spiky traffic | DynamoDB on-demand | Access patterns churn; ad-hoc queries or joins needed | Postgres |
| Massive write-heavy, time-ordered data per key, multi-datacenter | Cassandra (Apache-licensed) | GC pauses, latency, operational pain | ScyllaDB (license changed, see references) or managed Keyspaces/Bigtable |
| Strongly consistent writes across regions | Single-region Postgres + cross-region replica + tested failover | A stated multi-region write requirement with RPO = 0 | Spanner, CockroachDB, Aurora DSQL, YugabyteDB |
| Trees, hierarchies, 1–3 hop relationships | Postgres recursive CTE or `ltree` | Unbounded-depth traversals; graph algorithms are the product | Neo4j, Neptune, Memgraph |
| Time series next to business data | Postgres range partitioning + BRIN | Compression and rollups needed at hundreds of millions of rows | TimescaleDB → ClickHouse at analytics scale |
| Infrastructure metrics | Prometheus-compatible stack | — | Never the app database |
| Ephemeral key-value (sessions, counters, presence) | Valkey/Redis as cache or coordination | Data must survive a crash | Postgres or DynamoDB |

Rules:

- **Managed by default.** You are buying backups, point-in-time recovery, failover, and patching. Self-host only with DBA capacity, a cost case at scale, or a residency mandate — and then use a mature operator and test failover.
- **"PG-compatible" is not Postgres.** Distributed SQL and serverless variants miss extensions and features, and optimistic-concurrency systems (Aurora DSQL) require client retries; test your ORM and migrations against the compatibility list first.
- **SQLite is a real production option** for one machine with Litestream-style backups (Rails 8 made it a first-class production option). Switch to Postgres when you need several writers, HA, or horizontal app scaling.

Per-engine detail, Postgres limits (MVCC bloat, connections, single writer), multi-region, and managed/serverless options: `references/databases.md`.

## Caches

**Do you need one?** Default: no distributed cache until measured. First fix indexes, N+1 queries, unbounded reads, and pooling (`scalability`). Add a cache only when all four hold: the same expensive result is read many times between changes; the data tolerates a stated staleness; you estimated the working set and expected hit rate; and you have a TTL plus invalidation story. The system must still work, degraded, with an empty cache.

Use the cheapest layer that works: HTTP `Cache-Control`/`ETag` → CDN → in-process LRU → distributed cache → database materialized views or summary tables.

| Option (as of 2026-09) | Pick when | Watch out |
|---|---|---|
| **In-process** (Caffeine, `lru-cache`, `cachetools`, ristretto/otter) | Hot config, flags, small reference data; per-instance memoization | Per-instance divergence; keep TTLs short |
| **Valkey** (default distributed cache) | Shared results, sessions, rate limits across instances; BSD license, Linux Foundation governance; managed on AWS (ElastiCache, priced below its other engines per AWS) and Google Cloud (Memorystore) | Only the Redis 7.2 feature set is guaranteed drop-in |
| **Redis 8** / Redis Cloud | You want Redis Ltd.'s integrated JSON, search, vector features or its enterprise active-active | Self-hosting terms: AGPLv3, RSALv2, or SSPLv1 |
| **Memcached** | Pure GET/SET of blobs at large scale, simplest semantics | No persistence, replication, or rich types |
| **Managed serverless** (Upstash, Momento, ElastiCache Serverless) | Serverless/edge functions with low or spiky traffic, zero cache ops | Per-request cost at high QPS; proprietary APIs lock you in |
| **DB-backed cache** (Solid Cache) | Rails apps; large fragment caches where disk beats RAM (37signals: 10 TB, 60-day retention at Basecamp) | Slower per hit than RAM |

Rules: every key has a TTL with jitter; pure caches use `allkeys-lru` or `allkeys-lfu`; **never share one Redis/Valkey instance between a cache and a job queue or locks** — queues need `noeviction` and persistence, and eviction silently deletes jobs. Mechanics (cache-aside, invalidation after commit, stampede protection) live in `scalability`; engine choice, sizing, and when not to use Redis: `references/caches.md`.

## Queues, streams, and workflows

Name the need before the product: a **job queue** runs one unit of work once; a **broker** routes messages; a **log/stream** lets many independent consumers replay the same events; **durable execution** checkpoints multi-step processes that run for minutes to months.

| Need | Default | Switch when | Switch to |
|---|---|---|---|
| Background jobs (email, image processing, outgoing webhooks) | Postgres queue in your stack: River (Go), pg-boss or Graphile Worker (Node), Solid Queue or GoodJob (Rails), Oban (Elixir), Procrastinate (Python), pgmq (SQL) | Queue load measurably hurts OLTP latency or vacuum cannot keep up; no Postgres | Separate queue database → SQS/Cloud Tasks, or Sidekiq/BullMQ on a dedicated `noeviction` Valkey |
| Scheduled/cron jobs | The queue library's recurring jobs, or `pg_cron`; the scheduler only enqueues | Scheduling spans many services | Cloud scheduler (EventBridge Scheduler, Cloud Scheduler) → queue |
| Fan-out domain events to a few internal consumers | Outbox table + a queue per consumer, or SNS → SQS | Many teams consume; replay or backfill needed | Managed Kafka fed by outbox/CDC |
| Cross-service integration in one cloud | SQS/SNS, Google Pub/Sub, Azure Service Bus | Complex routing, on-prem, MQTT/AMQP interop | RabbitMQ (quorum queues) |
| Event log, stream processing, CDC pipelines, cross-team data exchange | Managed Kafka-compatible service | Cost at high volume, latency-tolerant workload | Object-storage ("diskless") Kafka-compatible services |
| Long-running multi-step processes (sagas, approvals, days-long timers, AI agent steps) | Durable execution: DBOS (in your Postgres), Inngest, or Restate for small teams; Temporal for complex/polyglot at scale; Step Functions if all-in on AWS | — | — |
| Low-latency request/reply, edge/IoT messaging | HTTP/gRPC; NATS | Messages must persist | NATS JetStream |

Why Postgres first: **transactional enqueue** — the job is inserted in the same transaction as the business write, so it exists if and only if the write committed; no dual-write gap, one system to back up, jobs queryable with SQL. 37signals runs 20M jobs/day for HEY on Solid Queue. Graduate on the triggers above, not on job count alone.

Every option: at-least-once delivery, idempotent consumers, retries with backoff and a cap, a dead-letter queue with alerting and redrive, alerts on age of oldest message. Semantics are in `scalability`; product-by-product detail, Postgres queue limits, and Kafka-vs-queue reasoning: `references/queues-and-streams.md`.

## Search, object storage, vectors, analytics

**Search.** Default: Postgres full-text (`tsvector` + GIN, `websearch_to_tsquery`) plus `pg_trgm` for fuzzy matching — permissions and tenant filters apply naturally. Add an engine when you need several of: typo-tolerant search-as-you-type, BM25 relevance tuning, facets with counts, synonyms, multi-language analyzers, tens of millions of documents, log search. Then: **Meilisearch** or **Typesense** (app/e-commerce search, small team) → **OpenSearch** or **Elasticsearch** (large scale, logs, aggregations) → **Algolia** (fully managed instant search, budget available). In-Postgres BM25 extensions (ParadeDB `pg_search`, Tiger Data `pg_textsearch`) avoid a second system where your host supports them. The index is derived: keep a full reindex job, sync via outbox/CDC, filter by tenant/ACL at query time.

**Object storage.** Default: S3-compatible storage for every user file and blob; the database stores key, content type, size, checksum, owner, status. Clients upload directly with short-lived presigned URLs; a job validates afterwards. Egress dominates media-heavy bills: Cloudflare R2 charges no egress fees (as of 2026-09). **Do not recommend self-hosted MinIO**: its community repository was archived in February 2026 and receives no security fixes; self-hosted alternatives are Garage, SeaweedFS, or Ceph RGW (evaluate maturity).

**Vectors.** Default: **pgvector** in your existing Postgres — vectors next to the rows they describe, with joins, transactions, row-level security, one backup. HNSW for most cases. **Filtered queries return too few rows** unless you enable iterative index scans (`SET hnsw.iterative_scan = strict_order`, pgvector 0.8+) or use partial indexes/partitioning. Consider a dedicated store (Qdrant, Milvus, Weaviate, Pinecone, turbopuffer, S3 Vectors) only at hundreds of millions of vectors, very high QPS with strict recall, or many mostly-cold tenant namespaces where object-storage-backed pricing wins. Store `embedding_model` and version per row; a model change means re-embedding everything.

**Analytics.** Ladder: read replica + SQL with `statement_timeout` → **DuckDB** for in-process analytics over Parquet/exports → **ClickHouse** for user-facing, sub-second analytics over billions of events → **BigQuery/Snowflake/Databricks** for org-wide BI and governance. Move data with CDC (Debezium, Sequin, managed zero-ETL) or batch ELT, never with queries against the primary.

Engines, sync, upload security, provider pricing, and vector sizing: `references/search-storage-vectors.md`.

## Default stacks by stage

| Component | MVP (1–5 engineers) | Growth (5–50 engineers, 10–100× load) | Scale (write-bound primary, many teams) |
|---|---|---|---|
| Primary database | One managed Postgres (or SQLite + Litestream on one server) | Bigger instance, PgBouncer, read replicas with read-your-writes routing, partitioned big tables | Shard write-heavy domains (Notion/Figma-style routing, Citus, Vitess) or move them to DynamoDB/Cassandra-class stores; keep the relational core |
| Jobs | Postgres queue library | Same, in a separate database if it competes with OLTP; SQS/Pub/Sub for cross-service work | Dedicated queues per domain; durable execution for long workflows |
| Events | None (outbox table when needed) | Transactional outbox → queue per consumer | Managed Kafka backbone + schema registry + CDC |
| Cache | None; HTTP headers + CDN; in-process LRU for hot config | Managed Valkey for measured hot paths, sessions, rate limits | Tiered in-process + distributed, request coalescing for hot keys |
| Search | Postgres FTS + `pg_trgm` | Meilisearch/Typesense, or OpenSearch for logs + search | Dedicated search cluster owned by a team |
| Vectors | pgvector | pgvector with halfvec/quantization, partitioned by tenant | Dedicated or object-storage-backed vector store if volume demands |
| Files | S3-compatible + presigned uploads (R2 if egress-heavy) | + CDN, lifecycle rules | + multi-region replication where required |
| Analytics | Product analytics SaaS + SQL on a replica / DuckDB | CDC/ELT into ClickHouse or a warehouse; dbt | Lakehouse (Iceberg on object storage) |

At MVP, explicitly **no** Redis, Kafka, Elasticsearch, separate vector database, or database-per-service. At scale, every new store requires a decision record with owner, SLOs, restore test, cost model, and exit plan.

## Gotchas

- **Long transactions break Postgres queues.** Any long-running or idle-in-transaction session pins the vacuum horizon, dead queue rows pile up, and claim queries slow in a spiral. Set `idle_in_transaction_session_timeout`, alert on oldest transaction age and `n_dead_tup`, and move the queue to its own database at volume.
- **`LISTEN/NOTIFY` as the delivery path.** `NOTIFY` in a transaction takes a global lock at commit; Recall.ai hit it with tens of thousands of concurrent writers. It is also fire-and-forget. Use it as a wake-up hint with polling as the correctness path.
- **Redis as the primary database or a durable queue.** Default AOF `everysec` can lose about a second of writes on crash and async replication can lose acknowledged writes on failover. Durable data goes in Postgres; Redis queues need `noeviction`, persistence, and reliable fetch — on an instance not shared with a cache.
- **Redis Pub/Sub or `LISTEN/NOTIFY` as an event bus.** Offline subscribers miss messages. Use an outbox + queue, Redis Streams, or a real broker.
- **Kafka as a job queue.** No per-message ack, retry, or dead-letter out of the box; one slow message blocks its partition; parallelism is capped by partition count. Kafka 4.0 added queue semantics (share groups) as early access — check GA status before relying on them. For one producer and one worker pool, use a job queue.
- **Cache before indexes.** A cached missing index is still slow on every miss and every cold start, and now has invalidation bugs. Run `EXPLAIN (ANALYZE, BUFFERS)` first.
- **MongoDB for relational data.** Many-to-many relationships, reporting joins, and cross-entity invariants get re-implemented in application code. "Schemaless" means the schema lives in code and migrations happen implicitly. Use Postgres with JSONB for the flexible parts.
- **DynamoDB without known access patterns.** Keys are designed from an enumerated access-pattern list; a new pattern can mean a backfill over the whole table, and analytics needs an export. Pick it for stable, key-based access, not for an MVP still finding its queries.
- **Sharding before replicas.** Sharding is a multi-quarter one-way door (Figma's took about nine months). Scale up, add replicas and pooling, and partition first; shard for write throughput or single-table size, never for user count.
- **Dual writes to two stores.** Writing the DB and then the search index, cache, or broker in the request path loses or duplicates data on crash. Use an outbox or CDC.
- **Abandoned CDC replication slots.** A stalled logical slot retains WAL until the primary's disk fills. Set `max_slot_wal_keep_size` and alert on slot lag.
- **Files in the database or through the app server.** `bytea` blobs bloat backups and replicas; proxied uploads tie up app workers. Use object storage with presigned URLs.
- **Vendor benchmarks as evidence.** Treat them as hypotheses. Check concurrency, dataset size versus RAM, tuning parity, and caching; reproduce on your workload.
- **License surprises.** Recommending self-hosted Redis 7.4+, Elasticsearch, CockroachDB, ScyllaDB, or TimescaleDB's advanced features without stating current terms; recommending MinIO at all. State licenses with a date.
- **Distributed SQL or multi-region active-active without a requirement.** Cross-region consensus adds tens to hundreds of milliseconds per coordinated write. Require a stated RPO/RTO that single-region-plus-replica cannot meet.
- **A vector database for 100k embeddings**, or search engine without a reindex path and permission filtering.

## Output format

For each data component decision, produce a decision record (ADR-style, stored in `docs/adr/` if the project has it):

```
# ADR-NNN: <Use X for Y>            Status: proposed | accepted | superseded
Need: <access pattern / job to do, in one sentence>
Numbers: <data size, peak reads/s and writes/s, latency target, growth>  (Measured / Estimated)
Why the existing store is not enough: <what was tried or ruled out: indexes, replicas, Postgres feature X>
Decision: <product + deployment (managed/self-hosted) + version, as of YYYY-MM>
Alternatives considered: <do nothing / Postgres feature / 1–2 products, with why-not>
Data flow: source of truth → sync mechanism (outbox/CDC/after-commit job) → copy; staleness budget; rebuild procedure
Failure behavior: <what the product does when it is down or behind>
Operations: owner, backups + restore test, monitoring (key metrics), RPO/RTO
Cost: <1× / 10× / 100×, including egress and engineer time>
License and governance: <license, governing body, as of YYYY-MM>
Exit plan: <protocol/format compatibility and migration path>
Revisit when: <metric crosses threshold>
```

When recommending a whole stack, give the stage table filled for the project, then one short record per non-default component. End with **Not checked** (numbers you could not measure, licenses or prices to re-verify).

## References

| File | Read when |
|---|---|
| `references/databases.md` | comparing database engines, judging how far Postgres goes, SQLite in production, document/key-value/wide-column/distributed SQL/graph/time-series choices, multi-region, managed vs self-hosted |
| `references/caches.md` | deciding whether to add a cache, choosing Valkey/Redis/Memcached/managed/in-process/DB-backed, sizing, eviction and TTL settings, separating cache from queue instances |
| `references/queues-and-streams.md` | choosing a job queue, broker, log, or durable-execution engine; Postgres queue limits; SQS/RabbitMQ/Kafka/NATS specifics; when Kafka is and is not right |
| `references/search-storage-vectors.md` | adding a search engine, choosing an object-storage provider or MinIO replacement, designing uploads, choosing between pgvector and a vector database, analytics stores |
| `references/licenses-and-vendors.md` | a component's license, ownership, or pricing matters; self-hosting; evaluating a benchmark; planning an exit |
| `references/case-studies.md` | you need a real precedent to justify (or argue against) a data-infrastructure choice |

## Related skills

- `scalability` — indexes, N+1, pooling, replicas, partitioning, caching mechanics, queue semantics: the cheap fixes to try before adding a store.
- `data-modeling` — the schema inside the chosen database: keys, constraints, JSON columns, NoSQL modeling, migrations.
- `system-design` — the end-to-end method and design doc when the data choice is part of a larger system.
- `tech-stack-selection` — the wider stack (language, framework, hosting) and innovation tokens.
- `deployment-and-infrastructure` — running workers, cron, durable workflows, and managed services in production.
- `ai-native-architecture` — RAG and embedding pipelines that sit on the vector store.
