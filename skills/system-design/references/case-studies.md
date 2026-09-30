# System Design Case Studies

Fifteen published engineering cases, each reduced to what happened, the numbers the source reports, the lesson, and the rule it teaches. Use them to justify a choice with a real precedent — and to check that the precedent's constraints match yours before copying it. Numbers are as reported by the companies at the time; treat them as orders of magnitude.

`software-architecture` and `scalability` each carry a case file focused on their own angle (boundaries and service count; sharding and storage). This file is the cross-cutting library for the design method.

## Contents
- The eight principles the cases agree on
- Storage and scaling: 1 Discord · 2 Figma databases · 3 Notion · 4 Instagram IDs · 5 Slack · 6 GitHub
- Migrations and correctness: 7 Stripe
- Topology and cost: 8 Shopify · 9 Segment · 10 Prime Video · 11 Stack Overflow · 12 37signals
- Data flow and collaboration: 13 LinkedIn · 14 Figma multiplayer · 15 Linear

## The eight principles the cases agree on

| # | Principle | Cases |
|---|---|---|
| 1 | **Postpone distribution; buy runway with cheap levers** — bigger instance, replicas, pooling, caching, moving table groups to their own database | Figma, Notion, Stack Overflow |
| 2 | **Add an indirection layer before changing storage** — a data service or proxy between app and database | Discord, Figma, Slack, GitHub |
| 3 | **Logical first, physical second** — route as if split while data still sits together | Figma, GitHub, Notion, Instagram |
| 4 | **The tenant is usually the right partition key — until tenants share data or become huge** | Notion, Shopify, Slack |
| 5 | **Verify migrations by comparison, and keep a rollback at every step** | Stripe, Notion, Figma |
| 6 | **Service count is a cost** | Segment, Prime Video, Uber, Airbnb |
| 7 | **Cost is an architectural requirement** | Prime Video, 37signals, Dropbox |
| 8 | **Time-sortable IDs are a recurring enabler** | Twitter Snowflake, Instagram, Discord |

---

## 1. Discord — message storage (2015–2023)
- **What happened.** Messages started in a single MongoDB replica set; around 100M messages (late 2015) data and indexes no longer fit in RAM and latency became unpredictable. They moved to Cassandra, which grew from 12 nodes (2017) to 177 (2022) with unpredictable latency, costly compaction, JVM garbage-collection pauses, and **hot partitions** when many users read the same channel. In 2022–23 they put **data services written in Rust** between the API and the database — doing **request coalescing** (many concurrent reads of one row become one query) — and moved to ScyllaDB.
- **Design detail.** Partition key `(channel_id, bucket)` where the bucket is a fixed time window, so a busy channel's partition cannot grow without bound; message IDs are time-sortable Snowflakes used as the clustering key.
- **Numbers.** 177 Cassandra nodes → 72 ScyllaDB nodes; p99 read 40–125 ms → 15 ms; p99 insert 5–70 ms → 5 ms; trillions of messages migrated in about 9 days.
- **Lesson.** The partition key decides where hot spots and unbounded growth appear; a thin data-access layer lets you fix concurrency problems and swap databases.
- **Rule.** *Choose a partition key that bounds partition size (entity + time bucket) and matches the dominant query; put a data-access layer in front of any store you might replace.*
- **Source.** https://discord.com/blog/how-discord-stores-trillions-of-messages

## 2. Figma — scaling Postgres (2020–2024)
- **What happened.** Database load grew roughly 100× from 2020. Figma first ran one Postgres on AWS's largest instance, then added read replicas and connection pooling, then **vertically partitioned** — moving groups of related tables (files, organizations) to their own databases. By late 2022 the largest tables were several TB and billions of rows; vacuum caused reliability incidents and they approached managed-database I/O limits. They then built **horizontal sharding**: "colos" (groups of tables sharing a shard key such as user, file, or org ID, so joins and transactions within one key still work), **logical sharding** first (queries routed as if sharded while still on one database), then physical moves, all behind **DBProxy**, a Go service that parses SQL and routes it. Before cutover they analyzed live queries to find which would break.
- **Numbers.** ~100× growth in four years; each vertical-partition move caused about 30 s of partial unavailability; about nine months to shard the first tables (first shipped September 2023).
- **Lesson.** Exhaust cheap levers; when sharding, separate the logical step from the physical move and restrict the query surface so product engineers keep joins and transactions.
- **Rule.** *Before sharding, prove replicas, a bigger box, and vertical partitioning are exhausted; shard by keys taken from access patterns, co-locate related tables on the same key, and ship logical routing before moving data.*
- **Sources.** https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/ · https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/

## 3. Notion — sharding Postgres and moving analytics off it (2021–2024)
- **What happened.** Notion sharded its block data at the application level (not via an extension): **480 logical shards** (Postgres schemas) spread over **32 physical databases**, 15 per machine. 480 was chosen because it divides evenly by many fleet sizes (8, 10, 12, 16, 20, 24, 32, 40, 48…), so the physical fleet can grow without re-hashing. Migration: double-write, backfill, **dark reads** comparing old and new results, then switch. Later (2024) they built a data lake: Postgres → change data capture (Debezium) → Kafka → Apache Hudi on S3.
- **Numbers.** Blocks grew from ~20B rows (early 2021) to 200B+ (2024); the data lake saved over $1M in 2022 and cut analytics freshness from days to minutes or hours.
- **Lesson.** Over-provision the logical shard count, shard by tenant (workspace), verify with dark reads, and move analytics off OLTP through CDC.
- **Rule.** *Shard by tenant when tenants are independent; pre-split into many logical shards; verify with dark reads before cutover; feed analytics from a change stream, not the primary.*
- **Sources.** https://www.notion.com/blog/sharding-postgres-at-notion · https://www.notion.com/blog/building-and-scaling-notions-data-lake

## 4. Instagram — sharded, time-ordered IDs (2012)
- **What happened.** Instagram mapped many **logical shards** (Postgres schemas) onto fewer physical servers and generated IDs inside each shard with PL/pgSQL: 64 bits = 41 bits of milliseconds since a custom epoch + 13 bits of logical shard ID + 10 bits of per-shard sequence (1,024 IDs per shard per millisecond).
- **Lesson.** IDs that embed time sort by creation (saving an index), and IDs that embed the shard make routing a bit operation — with no central ID service to fail.
- **Rule.** *If you must shard, generate 64-bit, time-ordered IDs that encode or map to the shard; avoid a central ID service as a single point of failure.*
- **Source.** https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c

## 5. Slack — moving to Vitess (2017–2020)
- **What happened.** Slack's original MySQL design sharded by workspace. Large enterprise workspaces and cross-workspace features strained the "one workspace, one shard" model. Over about three years they migrated to Vitess (MySQL sharding middleware), which allows different tables to be sharded by different keys and re-sharded online.
- **Numbers (late 2020).** Vitess served 99% of queries; peak 2.3M QPS (2M reads, 300K writes); median latency 2 ms, p99 11 ms. In March 2020 query rates rose 50% in one week, and hot shards were split online.
- **Lesson.** A tenant-per-shard model breaks when tenants become huge or start sharing data; the sharding layer must support online re-sharding and per-table keys.
- **Rule.** *Before committing to tenant sharding, ask what happens when one tenant outgrows a shard or two tenants share data; choose a layer that can re-shard online.*
- **Source.** https://slack.engineering/scaling-datastores-at-slack-with-vitess/

## 6. GitHub — partitioning the main MySQL cluster (2019–2021)
- **What happened.** GitHub grouped tables into **schema domains**, introduced **virtual partitions** in the application first, and added two **SQL linters** that flag queries and transactions spanning domains. Only after the code respected the boundaries did they move domains off the main cluster (some to Vitess).
- **Numbers.** Load on the hosts that held the former main-cluster data fell by 50%.
- **Lesson.** Boundaries enforced in CI make the physical move a routine operation.
- **Rule.** *Before splitting a database, make the boundaries enforceable in CI (lint cross-domain joins and transactions), then move data.*
- **Source.** https://github.blog/2021-09-27-partitioning-githubs-relational-databases-scale/

## 7. Stripe — online migrations and idempotency keys
- **What happened.** Stripe migrates live data in four steps: **dual-write** to old and new; **change reads** to the new store (after backfilling and comparing); **change writes** to the new store only; **delete** old data. For API retries, clients send an `Idempotency-Key`; the server stores the key, a fingerprint of the request, and the response. Brandur Leach's write-up adds **atomic phases** separated by **recovery points**, so a request that failed mid-way resumes from the last completed phase; foreign calls (charging a card) sit between phases.
- **Lesson.** Online migration is a sequence of reversible steps, each verified; idempotency is persisted in the same transaction as the effect.
- **Rule.** *Every non-idempotent mutation reachable over a network gets an idempotency key stored with the effect; migrate data by dual-write → verify → switch reads → switch writes → delete.*
- **Sources.** https://stripe.com/blog/online-migrations · https://brandur.org/idempotency-keys

## 8. Shopify — modular monolith and pods
- **What happened.** Shopify runs a large Rails **modular monolith** whose components own their data and expose public APIs, with boundaries enforced by tooling. For data and blast radius it uses **pods**: each pod is an isolated MySQL shard with its own supporting stores, shops are assigned by shop ID, stateless tiers scale normally, and shops can be moved between pods without downtime. Their payments guidance adds low timeouts, circuit breakers, idempotency keys (ULIDs), and reconciliation.
- **Numbers.** 100+ pods (as reported).
- **Lesson.** Tenant-sharded cells limit blast radius while keeping one codebase.
- **Rule.** *For multi-tenant SaaS at scale, isolate tenant groups into cells behind a thin router; keep a single codebase and enforce module boundaries with tooling.*
- **Sources.** https://shopify.engineering/e-commerce-at-scale-inside-shopifys-tech-stack · https://shopify.engineering/mysql-database-shard-balancing-terabyte-scale

## 9. Segment — "Goodbye Microservices" (2018)
- **What happened.** One service and queue per destination integration grew to 140+ services; shared libraries drifted across versions, and a large part of a small team's time went to keeping the system running. Segment consolidated all destinations into one service and one repository, and built a traffic recorder to make tests fast and deterministic.
- **Trade-off.** They gave up some fault isolation between destinations in exchange for velocity.
- **Rule.** *Split services along real differences in scaling, ownership, or failure isolation — not one per integration or entity; if services share one team and one release cadence, merge them.*
- **Source.** https://segment.com/blog/goodbye-microservices/

## 10. Amazon Prime Video — monitoring pipeline to a single process (2023)
- **What happened.** A stream-quality monitoring pipeline built from Step Functions and Lambda, passing video frames through S3, hit a hard scaling limit at about 5% of expected load, and per-state-transition charges were high. The team moved all stages into one process on ECS, passing data in memory, and scaled by running more copies.
- **Numbers.** Over 90% lower infrastructure cost.
- **Nuance.** This was one team's service, not Amazon abandoning microservices; Adrian Cockcroft framed it as "serverless first, not serverless only".
- **Rule.** *For high-frequency pipelines, estimate orchestration and inter-stage transfer cost before choosing a distributed design; co-locate stages that exchange large data often.*
- **Sources.** https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90 · https://adrianco.medium.com/so-many-bad-takes-what-is-there-to-learn-from-the-prime-video-microservices-to-monolith-story-4bd0970423d4

## 11. Stack Overflow — the efficient monolith (2016)
- **What happened.** A .NET monolith, on-premises: nine primary web servers, four SQL Servers in two clusters, Redis, Elasticsearch, a custom tag engine, and heavy caching. Performance work on queries and allocations beat adding tiers.
- **Lesson.** The "interview answer" (microservices, sharding, CQRS) was not what one of the web's busiest sites needed.
- **Rule.** *Measure before distributing; a well-tuned monolith on a few strong servers goes very far.*
- **Source.** https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/

## 12. 37signals — leaving the cloud (2022–2025)
- **What happened.** For stable, predictable workloads, 37signals moved compute from AWS to owned hardware and then planned to leave S3 for owned storage.
- **Numbers (as of 2024-10).** Cloud bill down from about $3.2M/year to about $1.3M/year, the remainder mostly S3 (~10 PB); projected savings over $10M across five years.
- **Lesson.** Elasticity is worth paying for only if you use it; at meaningful, steady spend, total cost of ownership can favor owned hardware.
- **Rule.** *For steady workloads at significant spend, compare 3–5 year total cost (hardware, people, contracts) with cloud before assuming cloud is cheaper.*
- **Source.** https://www.theregister.com/2024/10/21/37signals_aws_savings/

## 13. LinkedIn — the log as the integration backbone (2010–2013)
- **What happened.** Point-to-point pipelines between databases, search, Hadoop, and monitoring multiplied. LinkedIn built Kafka and made an append-only, ordered log the central integration point; every system subscribes to the changes it needs.
- **Lesson.** One durable change stream replaces N × M custom integrations; derived data is rebuilt from the log.
- **Rule.** *When many systems need the same changes, publish them once to a durable log (outbox or CDC into a stream) instead of building pairwise integrations.*
- **Source.** https://web.archive.org/web/20240105095933/https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying

## 14. Figma — multiplayer editing (2019)
- **What happened.** Figma's collaboration is **server-authoritative**: a document is a tree of objects with properties, and conflicts are resolved per (object, property) by **last write to reach the server wins**. It borrows ideas from CRDTs without being a full CRDT, because a central server already exists.
- **Lesson.** A central authority removes most of the complexity of peer-to-peer merging.
- **Rule.** *For real-time collaboration, start with server-ordered per-field last-writer-wins; reach for full CRDTs only for rich-text merging or true offline/peer-to-peer needs.*
- **Source.** https://www.figma.com/blog/how-figmas-multiplayer-technology-works/

## 15. Linear — the client sync engine
- **What happened.** Linear's client loads workspace data into IndexedDB and keeps an in-memory object graph; mutations are sent as transactions, and the server assigns increasing sync IDs and broadcasts deltas to all clients, including the sender. The UI is instant, offline and real-time come almost for free, and frontend engineers ship features without new endpoints.
- **Lesson.** A sync engine is an architectural decision that is very hard to retrofit.
- **Rule.** *For collaborative productivity apps, decide on a sync-engine architecture (local store + server-ordered deltas) early; for CRUD admin apps, don't.*
- **Sources.** https://www.youtube.com/watch?v=VLgmjzERT08 · https://github.com/wzhudev/reverse-linear-sync-engine

## Sources

- Discord: https://discord.com/blog/how-discord-stores-trillions-of-messages
- Figma: https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/ ; https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/ ; https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
- Notion: https://www.notion.com/blog/sharding-postgres-at-notion ; https://www.notion.com/blog/building-and-scaling-notions-data-lake
- Instagram: https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c
- Slack: https://slack.engineering/scaling-datastores-at-slack-with-vitess/
- GitHub: https://github.blog/2021-09-27-partitioning-githubs-relational-databases-scale/
- Stripe: https://stripe.com/blog/online-migrations ; Brandur Leach: https://brandur.org/idempotency-keys
- Shopify: https://shopify.engineering/e-commerce-at-scale-inside-shopifys-tech-stack ; https://shopify.engineering/mysql-database-shard-balancing-terabyte-scale
- Segment: https://segment.com/blog/goodbye-microservices/
- Prime Video: https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90 ; Adrian Cockcroft: https://adrianco.medium.com/so-many-bad-takes-what-is-there-to-learn-from-the-prime-video-microservices-to-monolith-story-4bd0970423d4
- Stack Overflow: https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/
- 37signals: https://www.theregister.com/2024/10/21/37signals_aws_savings/
- LinkedIn: https://web.archive.org/web/20240105095933/https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying
- Linear: https://www.youtube.com/watch?v=VLgmjzERT08 ; https://github.com/wzhudev/reverse-linear-sync-engine
- ByteByteGo system-design-101 case summaries: https://github.com/ByteByteGoHq/system-design-101
