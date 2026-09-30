# O — Choosing Data Infrastructure: databases, caches, queues, search, object storage, vector stores, analytics

Research notes for an Agent Skill on **selecting** data infrastructure components. Written 2026-09-30. Facts that change over time (licences, prices, ownership, versions) are labelled "as of 2026-09" with a source. Anything I could not verify from a fetched/search-summarised source is marked **[unverified]**. Vendor-authored numbers are marked **[vendor claim]**; they point in a direction but are not neutral benchmarks.

Scope note: caching *mechanics* (cache-aside, write-through, invalidation, stampede protection) and the scaling ladder are already covered in `E-architecture.md` §4. This file is about **which component to pick, when to add it, and when to switch**.

---

## 0. The meta-rules (put these in SKILL.md body)

1. **Start with one relational database (Postgres) and one object store. Add every other data system only when a measured need names it.** Each new stateful system adds backups, HA, monitoring, upgrades, security patching, access control, on-call runbooks and a new consistency boundary. Dan McKinley's "Choose Boring Technology" frames this as a budget of roughly three "innovation tokens" per company; boring tech has *known failure modes*, which is the point. <https://mcfunley.com/choose-boring-technology>; follow-up on culture: <https://charity.wtf/2023/05/01/choose-boring-technology-culture/>
2. **Choose by access pattern and consistency need, not by data "type".** "It's JSON" does not imply MongoDB; "it's a graph" does not imply Neo4j; "it's events" does not imply Kafka; "it's embeddings" does not imply a vector DB. Postgres covers JSONB, recursive CTEs, queues and pgvector at small-to-medium scale.
3. **Every copy of data is a consistency liability.** Caches, search indexes, read replicas, vector indexes and warehouses are *derived* data. Name the source of truth, the sync mechanism (dual write is a bug; use transactional outbox or CDC), the staleness budget, and the rebuild procedure *before* adding the copy.
4. **Never run analytics on the OLTP primary.** Use a replica for light reporting, then CDC/ELT into a columnar store (ClickHouse, DuckDB/MotherDuck, BigQuery, Snowflake) when queries scan millions of rows.
5. **Distrust benchmarks, especially vendor benchmarks.** ClickBench's own README says "All Benchmarks Are ~~Bastards~~ Liars", tests one flat 100M-row table, runs queries sequentially with no concurrency, and "allow[s] but do[es] not encourage creating scoreboards". Benchmark your own workload on your own data shape. <https://github.com/ClickHouse/ClickBench>
6. **Licence and ownership are part of the selection.** 2024–2026 saw many relicensings (Redis, Elasticsearch, CockroachDB, ScyllaDB), a big-vendor acquisition wave (Confluent→IBM, Neon→Databricks, WarpStream→Confluent) and an OSS project abandoned (MinIO). Prefer foundation-governed or permissively licensed cores (Postgres, Valkey, OpenSearch, Kafka, NATS, Cassandra) when you self-host; check the licence at adoption *and* at every major upgrade.
7. **Plan the exit.** Prefer wire-compatible / open-protocol choices (Postgres wire protocol, S3 API, Redis protocol, Kafka protocol, SQL) so you can move between managed vendors.

---

## 1. Questions to ask before picking any data store (checklist)

Put this checklist in the skill; an agent should answer (or ask) these before recommending anything beyond Postgres.

**Data shape & relationships**
- [ ] What are the entities and relationships? Are there many-to-many joins, foreign keys, invariants across rows (uniqueness, balances, inventory)? → relational.
- [ ] Is the data naturally a self-contained aggregate always read/written whole (a document)? Is the schema genuinely heterogeneous per record?
- [ ] Are there large binary objects (images, video, PDFs, model files)? → object storage, store only keys/metadata in the DB.

**Access patterns**
- [ ] List the top 5–10 queries by frequency and by latency sensitivity. Point lookups? Range scans? Full-text? Similarity? Aggregations over millions of rows? Graph traversals of unbounded depth?
- [ ] Are access patterns **known and stable** (→ DynamoDB/Cassandra viable) or **still evolving** (→ relational; ad-hoc SQL keeps you flexible)?
- [ ] Read:write ratio? Update-heavy on indexed columns (Postgres MVCC write amplification) or append-only?

**Consistency & correctness**
- [ ] Which operations need ACID transactions across multiple rows/entities? What isolation level?
- [ ] What staleness is acceptable per feature (0 s for balances; seconds for feeds; minutes for analytics)?
- [ ] Do you need read-your-writes after a user action?
- [ ] Is multi-region *write* availability truly required, or is multi-region *read* + single-region write enough?

**Scale — with numbers, not adjectives**
- [ ] Data size today and in 24 months (GB/TB), row counts of the biggest tables.
- [ ] Peak reads/s, writes/s, and payload sizes. Peak-to-average ratio.
- [ ] Latency targets (p50/p99) per query class.
- [ ] Does the working set fit in RAM of one large machine? (Most do.)

**Team & operations**
- [ ] What does the team already know how to operate, debug and restore at 3 a.m.?
- [ ] Managed service available on your cloud? Who does upgrades, failover, backups, PITR?
- [ ] Have you *tested a restore*? What are RPO/RTO requirements?

**Cost**
- [ ] Pricing model: provisioned vs per-request vs storage vs egress. Model at 1×, 10×, 100× current load.
- [ ] Hidden costs: cross-AZ traffic, egress, replicas, backups, IOPS, support tiers, engineer time.

**Ecosystem & exit**
- [ ] Drivers/ORM support in your language, migration tooling, observability integration, local dev story (can it run in Docker/Testcontainers?).
- [ ] Licence (OSI-approved? source-available? usage limits?) and governance (foundation vs single vendor).
- [ ] Wire/API compatibility with alternatives; export format; how hard is migrating off in two years?

---

## 2. Databases

### 2.1 Default: PostgreSQL — why, and how far it goes

**Why Postgres is the default for new systems (as of 2026-09)**
- General-purpose relational DB with strong SQL, transactions, constraints, and an extension ecosystem that absorbs many specialised systems: JSONB (documents), full-text search + `pg_trgm`, PostGIS (geospatial), pgvector/pgvectorscale (vectors), TimescaleDB (time series), pg_partman (partition management), pg_cron (scheduling), pgmq and SKIP LOCKED libraries (queues), Citus (distributed/sharded Postgres), pg_duckdb / pg_mooncake (columnar analytics), ParadeDB pg_search / pg_textsearch (BM25). Curated lists: <https://github.com/Olshansk/postgres_for_everything>, inspired by "Just Use Postgres for Everything" <https://www.amazingcto.com/postgres-for-everything/> and cpursley's gist <https://gist.github.com/cpursley/c8fb81fe8a7e5df038158bdfe0f06dbb>.
- Every major cloud and many specialists offer managed Postgres (RDS/Aurora, Cloud SQL/AlloyDB, Azure Flexible Server, Supabase, Neon, PlanetScale Postgres, Crunchy Bridge, Tiger Cloud).
- Wire protocol is a de facto standard reused by distributed SQL systems (CockroachDB, YugabyteDB, Aurora DSQL, Spanner PG dialect), easing exit.
- Postgres 18 (released 2025-09-25) added an asynchronous I/O subsystem, native `uuidv7()`, virtual generated columns, B-tree skip scan and temporal constraints. <https://www.postgresql.org/about/news/postgresql-18-released-3142/>. Postgres 19 was at Beta 4 on 2026-09-24; GA expected ~Sept/Oct 2026 (as of 2026-09). <https://www.postgresql.org/about/news/postgresql-19-beta-4-released-3386/>

**How far one Postgres primary goes — real evidence**
- **OpenAI (Jan 2026):** ChatGPT (~800M users) runs on a **single primary** Azure Database for PostgreSQL Flexible Server with **nearly 50 read replicas** across regions; Postgres is unsharded. They minimise primary load, push reads to replicas, use PgBouncer, avoid unnecessary writes ("lazy writes"), and **migrated shardable, write-heavy workloads to Azure Cosmos DB**; new workloads default to sharded systems. Lesson: *one Postgres primary can carry enormous read-heavy scale; write-heavy, shardable workloads are what eventually leave.* <https://openai.com/index/scaling-postgresql/>; summaries: <https://blog.bytebytego.com/p/how-openai-scaled-to-800-million>, Microsoft: <https://techcommunity.microsoft.com/blog/adforpostgresql/scaling-postgresql-at-openai-lessons-in-reliability-efficiency-and-innovation/4428483>
- **Notion (2021):** sharded Postgres at the application layer into **480 logical shards on 32 physical databases**, partition key = workspace ID (queries rarely cross workspaces). 480 chosen because it's highly composite, allowing rebalancing without rehashing. <https://www.notion.com/blog/sharding-postgres-at-notion>
- **Figma (2024):** grew Postgres ~100× in four years: first vertical partitioning (moving table groups to their own DBs), then horizontal sharding with an in-house **DBProxy** (parses SQL, routes to shards) and "colos" (groups of tables sharing a shard key); logical sharding via views before physical sharding. <https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/>
- **Instagram (2012):** sharded Postgres into thousands of logical shards mapped to fewer physical servers (Postgres schemas), with IDs generated in PL/pgSQL (timestamp + shard + sequence). <https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c>
- **Stack Overflow (2016):** served a top-50 website from **4 Microsoft SQL Server** machines (two clusters), 11 web servers, 2 Redis, 3 Elasticsearch — a scale-up, cache-heavy monolith. <https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/>
- Takeaway for agents: **scale up (bigger box, NVMe, more RAM), add read replicas + pooling, fix queries/indexes, partition big tables, move derived workloads out — long before sharding.** Sharding is a multi-quarter project (Figma: ~9 months) and should be driven by write throughput or single-table size, not by user count.

**Postgres weaknesses to know (where "just use Postgres" stops)**
- **MVCC write amplification & bloat**: every UPDATE writes a new tuple version; indexed-column updates touch all indexes (HOT updates avoid this only when no indexed column changes and the page has room). Update-heavy, high-churn tables need autovacuum tuning. This is the core of Uber's 2016 complaint and of OpenAI's reason to move write-heavy workloads. PlanetScale explainer: <https://planetscale.com/blog/postgresql-mvcc>
- **Connection model**: process per connection → always use a pooler (PgBouncer, PgCat, Supavisor, RDS Proxy) at scale.
- **Single-writer primary**: no built-in multi-primary; write scale-out means sharding (app-level, Citus, or a distributed SQL DB).
- **Major version upgrades** need planning (pg_upgrade, logical replication blue/green).
- **Uber 2016 case, with counter-arguments:** Uber moved from Postgres to MySQL (for its Schemaless layer) citing write amplification, physical (WAL) replication amplification, replica MVCC issues, and difficult upgrades. <https://www.uber.com/us/en/blog/postgres-to-mysql-migration/>. Rebuttals: Markus Winand argued the problem was specific to an update-heavy workload on indexed columns, that HOT mitigates many cases, and that MySQL's clustered-index secondary lookup penalty was downplayed <https://use-the-index-luke.com/blog/2016-07-29/on-ubers-choice-of-databases>; Robert Haas <http://rhaas.blogspot.com/2016/08/ubers-move-away-from-postgresql.html>; Christophe Pettus, "A PostgreSQL Response to Uber" (claims "half-true, half-false") <https://thebuild.com/presentations/uber-perconalive-2017.pdf>; LWN summary <https://lwn.net/Articles/696085/>. **Lesson: the right answer depended on Uber's specific workload (update-heavy, used as a KV store beneath their own sharding layer); it is not a general verdict.** Logical replication (Postgres 10+, 2017) has since addressed some of the replication/upgrade points.

### 2.2 MySQL / MariaDB (and Vitess/PlanetScale)

**When MySQL is the right call**
- Team or platform already runs MySQL (Rails/PHP/WordPress/Laravel shops, existing ops expertise). Switching engines for taste is not worth an innovation token.
- Very large, simple, high-QPS OLTP where proven horizontal sharding via **Vitess** matters: YouTube built Vitess; **Slack** migrated from 2017 and by Dec 2020 Vitess served 99% of query load, peaking at 2.3M QPS <https://slack.engineering/scaling-datastores-at-slack-with-vitess/>. **GitHub** runs 1,200+ MySQL hosts (300+ TB, 5.5M QPS) and upgraded 5.7→8.0 over a year (2023) <https://github.blog/2023-12-07-upgrading-github-com-to-mysql-8-0/>. Shopify, Pinterest, Square, Quora also sharded MySQL (see links in awesome-scalability: <https://github.com/binhnguyennus/awesome-scalability>).
- Update-heavy workloads on indexed columns where InnoDB's in-place update + undo log behaves better than Postgres MVCC (the Uber argument).
- Trade-offs vs Postgres: weaker extension ecosystem (no PostGIS-equivalent depth, no pgvector-class ecosystem; MySQL 9 added a VECTOR type **[unverified detail]**), historically looser SQL semantics, clustered primary key (good for PK range scans, secondary index lookups cost a second traversal).
- PlanetScale (managed Vitess) also launched **PlanetScale for Postgres** (GA Sept 2025) including NVMe "Metal" instances **[vendor claim]** <https://getautonoma.com/blog/neon-vs-planetscale>.

### 2.3 SQLite in production

**When it fits**
- Single-node apps (one server/VM), internal tools, low-to-moderate write concurrency, read-heavy sites, per-tenant databases (one file per customer), edge/embedded, desktop/mobile, test fixtures.
- Zero network hop → queries are function calls (microseconds), which changes N+1 economics.
- **Rails 8 made it a first-class production option** (Nov 2024): Solid Cache, Solid Queue and Solid Cable are DB-backed replacements for Redis, and can run on SQLite; "No PaaS Required". 37signals reported Solid Queue running **20M jobs/day for HEY** and Solid Cache storing **10 TB at Basecamp with a 60-day retention window, halving P95 render times** (on MySQL there, not SQLite). <https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required>

**Limits**
- **One writer at a time** (WAL mode lets readers proceed concurrently with the single writer). Use `PRAGMA journal_mode=WAL`, `busy_timeout`, short write transactions, `BEGIN IMMEDIATE` for write txns. <https://betterstack.com/community/guides/databases/turso-explained/>
- No built-in replication/HA; you need add-ons:
  - **Litestream**: continuous streaming backup of the WAL to S3-compatible storage for disaster recovery (not HA) <https://github.com/benbjohnson/litestream>.
  - **LiteFS** (Fly.io): FUSE-based replication across a cluster, single primary; README says beta <https://github.com/superfly/litefs>.
  - **Turso / libSQL**: libSQL is a C fork of SQLite adding replication, embedded replicas and HTTP access (basis of Turso Cloud); **Turso Database** (formerly "Limbo") is a from-scratch Rust rewrite targeting MVCC/`BEGIN CONCURRENT` concurrent writes and io_uring (as of 2026-09, maturing) <https://turso.tech/blog/introducing-limbo-a-complete-rewrite-of-sqlite-in-rust>, <https://github.com/tursodatabase/turso>.
- Horizontal scaling of app servers requires network storage or a replication layer — this is where most teams should just use Postgres.

**Rule:** SQLite is a good production choice when the app runs on *one* machine (or per-tenant DB files) and you have Litestream-style backups; switch to Postgres when you need multiple app servers writing, HA failover, or heavy concurrent writes.

### 2.4 Document stores (MongoDB, Firestore, Couchbase)

**When the document model actually fits**
- Aggregates read and written as a whole (a product with variants, a CMS page with blocks, a form submission, a game save), little cross-aggregate joining, schema that varies per record, teams comfortable enforcing schema in the app (or with MongoDB schema validation).
- Mobile/web sync use cases where Firestore/Realtime DB offline sync and security rules are the product.

**When it doesn't**
- Relational data with many-to-many relationships, reporting joins, cross-entity invariants → you'll re-implement joins and referential integrity in app code.
- "Schemaless" is really "schema-in-application"; migrations still happen, just lazily and implicitly.
- Postgres **JSONB with GIN indexes** covers the "some fields are flexible" case inside a relational schema <https://www.bytebase.com/blog/postgres-vs-mongodb/>.

**Transactions & correctness**
- MongoDB added multi-document ACID transactions in 4.0 (2018, replica sets) and distributed transactions across shards in 4.2 (2019) <https://www.mongodb.com/resources/products/capabilities/mongodb-multi-document-acid-transactions>.
- Jepsen's 2020 analysis of MongoDB 4.2.6 found that even at the strongest read/write concerns it failed to preserve snapshot isolation (read skew, cyclic information flow, etc.) <https://jepsen.io/analyses/mongodb-4.2.6>. MongoDB says issues were fixed later; **use the strongest write/read concerns (`majority`) for anything that matters and re-check current Jepsen/vendor docs** (as of 2026-09 I did not verify a newer Jepsen report).
- Licence: MongoDB Community is SSPL (since 2018) — not OSI-approved; relevant if you'd offer it as a service. **[well known; not re-verified this session]**

### 2.5 DynamoDB (and other managed key-value/wide-column: Bigtable, Cosmos DB)

**Access-pattern-first design**
- You design keys (partition key + sort key, GSIs) from an enumerated list of access patterns; there are no joins and limited ad-hoc query. Alex DeBrie's single-table design guide lists the downsides: steep learning curve, **inflexibility when new access patterns appear** (may need a backfill/ETL over the whole table), and poor fit for analytics. <https://www.alexdebrie.com/posts/dynamodb-single-table/>
- Don't use single-table design for early-stage products whose access patterns are still changing; on-demand pricing means single-table doesn't save money by itself. <https://singletable.dev/blog/when-not-to-use-single-table-design> **[community blog]**

**When DynamoDB is right**
- AWS-native, serverless apps wanting zero DB ops, predictable single-digit-ms latency at any scale, key-value / known-pattern access (sessions, carts, user profiles, idempotency keys, device state, leaderboards with GSIs), spiky traffic (on-demand).
- Global tables for multi-region active-active with last-writer-wins semantics.

**Cost model (as of 2026-09)**
- On-demand throughput price was cut **50%** and global tables up to **67%** effective 2024-11-01; AWS now recommends on-demand as default for most workloads. <https://www.amazonaws.cn/en/new/2024/amazon-dynamodb-reduces-prices-for-on-demand-throughput-and-global-tables/>
- Cost drivers: item size (reads billed per 4 KB, writes per 1 KB), GSIs (each write replicated to each GSI), global tables (write per region), scans (never in hot paths), backups/PITR, streams. Max item size 400 KB **[from DynamoDB docs, well known]**.
- Hot partitions: design high-cardinality partition keys; avoid date-only keys.
- Analytics: export to S3 (Parquet) / zero-ETL integrations, then query elsewhere.

### 2.6 Wide-column: Cassandra / ScyllaDB

**When**
- Very high write throughput, large datasets (tens of TB+), multi-datacenter replication, tunable consistency, queries known up front (partition-key access). Time-ordered data per key (messages per channel, events per device).

**Case: Discord**
- 2017: moved messages from MongoDB to Cassandra. By 2022: trillions of messages on **177 Cassandra nodes**, with hot partitions, JVM GC pauses and compaction backlogs causing latency spikes and pages. Migrated to **ScyllaDB (C++, shard-per-core)** on **72 nodes**; p99 latencies dropped sharply (The New Stack summarises it as ~200 ms → ~5 ms; Discord's own post gives per-operation p99s in the tens of ms for Cassandra vs ~15 ms reads / ~5 ms inserts on ScyllaDB) **[exact figures vary between summaries — quote Discord's post directly]**. They also put a Rust "data services" layer in front to coalesce hot reads (request coalescing), and migrated with a Rust migrator at ~3.2M rows/s — the migration took 9 days. <https://discord.com/blog/how-discord-stores-trillions-of-messages>, <https://thenewstack.io/how-discord-migrated-trillions-of-messages-to-scylladb/>
- Lessons: (1) wide-column shines at this write/data scale; (2) data modelling (bucketed partitions: channel_id + time bucket) matters more than engine; (3) a coalescing service layer protects the DB from hot keys.

**Operational & licence notes (as of 2026-09)**
- Cassandra (Apache 2.0, ASF) 5.0 added Storage-Attached Indexes (SAI) and vector search. <https://cassandra.apache.org/_/blog/Apache-Cassandra-5.0-Features-Storage-Attached-Indexes.html>
- **ScyllaDB moved to a source-available licence** (announced 2024-12-18); ScyllaDB OSS 6.2 (AGPL) was the last open-source release; 2025.1 is the first source-available release with a free tier for smaller deployments. <https://www.scylladb.com/2024/12/18/why-were-moving-to-a-source-available-license/>
- Managed: Amazon Keyspaces, Astra DB (DataStax, acquired by IBM in 2025 **[unverified]**), ScyllaDB Cloud.
- Anti-pattern: choosing Cassandra for a small app "because it scales" — you lose joins, transactions (LWT is limited and slow), ad-hoc queries, and you inherit repair/compaction/tombstone operations.

### 2.7 Distributed SQL / NewSQL: Spanner, CockroachDB, YugabyteDB, Aurora DSQL, TiDB

**When you actually need it**
- Write volume beyond one primary *and* you need relational transactions across shards without building DBProxy yourself.
- Multi-region active-active writes with strong consistency (regulated finance, global inventory/ledger), or survival of a region loss with RPO=0.
- **Most apps don't**: single-region primary + cross-region replicas + failover meets most DR needs; cross-region consensus adds tens-to-hundreds of ms to each write that must coordinate across regions (speed of light).

**Options (as of 2026-09)**
| System | Model | Notes |
|---|---|---|
| Google Spanner | TrueTime, external consistency, GoogleSQL + PG dialect | Most mature; GCP-only |
| CockroachDB | PG-wire, serializable by default, multi-region primitives | **Licence change 2024**: Core retired with v24.3 (Nov 2024); single Enterprise licence, free for companies <$10M revenue, paid above; telemetry required for free tier **[telemetry detail from coverage]** <https://siliconangle.com/2024/08/15/cockroach-labs-changes-its-self-hosting-license-single-enterprise-model/>. Oxide's RFD on whether to keep using it is a good example of licence-driven re-evaluation <https://rfd.shared.oxide.computer/rfd/0508> |
| YugabyteDB | Reuses Postgres query layer on distributed storage | Apache 2.0 core **[well known]** |
| Amazon Aurora DSQL | Serverless, PG-compatible, active-active multi-region, **optimistic concurrency control** (conflicts detected at commit → clients must retry) | GA 2025-05-27 <https://aws.amazon.com/about-aws/whats-new/2025/05/amazon-aurora-dsql-generally-available/>. Launched without foreign keys, triggers, PL/pgSQL, temp tables, PostGIS etc.; foreign keys reported added Aug 2026 <https://www.infoq.com/news/2026/09/aurora-dsql-foreign-keys/> — check the current compatibility list <https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-migration-guide.html> |
| TiDB | MySQL-compatible, HTAP (TiFlash columnar) | Apache 2.0 **[well known]** |

**Costs/gotchas**: higher per-transaction latency than single-node, hot-key contention, retry logic for serialization/OCC conflicts, "PG-compatible" ≠ Postgres (extensions often missing), and generally higher $/GB and $/op. Test your ORM and migration tool against the compatibility matrix before choosing.

### 2.8 Redis as a primary database — avoid (mostly)

- Data must fit in RAM (cost per GB is an order of magnitude above disk); persistence is RDB snapshots and/or AOF. With `appendfsync everysec` (default AOF policy) you can lose **up to ~1 second** of writes on crash; `always` is much slower. Replication is asynchronous, so failover can lose acknowledged writes. <https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/>
- No ad-hoc queries/joins, limited secondary indexing (modules/RediSearch aside).
- Acceptable: truly ephemeral or reconstructible data (sessions with fallback login, rate-limit counters, leaderboards rebuilt from DB, presence), or when you consciously accept the durability model. Otherwise use it as a **cache or coordination tool in front of a durable DB**.

### 2.9 Graph databases (Neo4j, Neptune, Memgraph; Apache AGE)

- **Use Postgres first** for trees/hierarchies, org charts, category trees, bill-of-materials, friend-of-friend at 1–3 hops: adjacency list + indexes + `WITH RECURSIVE`, or `ltree` for paths. Bounded shallow traversals on indexed tables are fast; cost grows with depth and fan-out. <https://www.puppygraph.com/learn/postgres-vs-neo4j> **[vendor-adjacent source]**
- **Use a graph DB** when traversal depth is unbounded or variable, the graph *is* the product (fraud rings, recommendation over many hops, network topology, knowledge graphs), and you want built-in graph algorithms (shortest path, PageRank, community detection) and a traversal language (Cypher/GQL).
- Apache AGE adds Cypher to Postgres but deep multi-hop traversals still compile to joins. <https://www.puppygraph.com/learn/apache-age-vs-neo4j>
- Neo4j Community is GPLv3; clustering is Enterprise-only **[well known; not re-verified]**.

### 2.10 Time-series

| Need | Default | Switch to |
|---|---|---|
| App metrics/events alongside relational data, < ~1B rows, SQL joins with business tables | Postgres with native range partitioning (pg_partman) + BRIN indexes | **TimescaleDB** (hypertables, compression, continuous aggregates, retention) |
| Infra/observability metrics | Prometheus-compatible stack (Prometheus, VictoriaMetrics, Mimir, managed) | — (don't put infra metrics in your app DB) |
| High-cardinality events/logs, analytics over billions of rows | **ClickHouse** (or managed ClickHouse/Tinybird) | — |
| IoT with InfluxDB ecosystem | InfluxDB 3 | Note licence/limits below |

Licence/ownership notes (as of 2026-09):
- Timescale renamed itself **Tiger Data** (2025-06-17); the extension is still TimescaleDB, cloud is Tiger Cloud. Core is Apache 2.0, but compression, continuous aggregates and hyperfunctions are under the **Timescale License (TSL)**, which forbids offering them as a competing DBaaS — so many third-party managed Postgres services ship only the Apache subset. <https://www.tigerdata.com/legal/licenses>, <https://en.wikipedia.org/wiki/TimescaleDB>
- **InfluxDB 3 Core** is MIT/Apache-2 but deliberately limited (a single query can't span more than ~432 Parquet files ≈ 72 hours at default settings; Enterprise lifts it). <https://www.influxdata.com/blog/influxdb3-open-source-public-alpha/>, <https://layerbase.com/blog/influxdb-3-core-72-hour-limit>

### 2.11 Analytics / OLAP — never on the OLTP primary

**Why separate**: analytical queries scan millions of rows, evict the OLTP working set from the buffer cache, hold long transactions (blocking vacuum → bloat), and compete for CPU/IO. Row stores are also 10–100× less efficient than columnar stores for aggregations **[order of magnitude, general knowledge]**.

**Ladder**
1. Small: read replica + SQL for internal dashboards (set `statement_timeout`; replica lag is fine for reporting).
2. In-process/embedded analytics: **DuckDB** (MIT, single-node, in-process, reads Parquet/CSV/Postgres) — ideal for ETL scripts, notebooks, per-customer analytics, "small data". Jordan Tigani's "Big Data is Dead" argues most organisations' *queried* working set fits on one machine. <https://motherduck.com/blog/big-data-is-dead/> **[vendor author; still widely cited]**. In-Postgres options: `pg_duckdb`, `pg_mooncake` **[extensions listed in postgres_for_everything]**.
3. Real-time / user-facing analytics over large event volumes (dashboards in your product, observability, clickstream): **ClickHouse** (Apache 2.0; self-host or ClickHouse Cloud; Tinybird etc.). Strength: sub-second aggregations over billions of rows, high ingest. Weakness: updates/deletes are expensive (mutations), joins improving but not its forte, ops of sharded clusters.
4. Enterprise warehouse (many teams, governance, BI tools, data sharing, separation of storage/compute, pay-per-query): **BigQuery**, **Snowflake**, **Databricks SQL**, **Redshift**. Strength: governance and scale-to-zero ops; weakness: latency (seconds) and cost unpredictability for interactive/user-facing workloads. <https://motherduck.com/learn/fastest-olap-databases-compared/> **[vendor]**
5. Lakehouse: Parquet + Iceberg/Delta on object storage, queried by multiple engines — for large orgs; avoid lock-in to one warehouse.

**Getting data there**: CDC (Debezium, Sequin, Fivetran/Airbyte, cloud zero-ETL), or batch ELT with dbt. Notion built a data lake (Kafka + Debezium CDC → S3/Hudi → Spark) when Postgres-based analytics could not keep up <https://www.notion.com/blog/building-and-scaling-notions-data-lake>.

**Benchmark caution**: ClickBench is useful and reproducible but limited — single flat table (~100M rows), sequential queries, no concurrency, favours systems built for flat-table scans; vendors publish rankings favourable to themselves. <https://github.com/ClickHouse/ClickBench>, <https://clickhouse.com/resources/engineering/fastest-olap-databases> **[vendor]**

### 2.12 Managed vs self-hosted; serverless Postgres

- **Default to managed** (RDS/Aurora, Cloud SQL/AlloyDB, Azure Flexible Server, Supabase, Neon, PlanetScale, Crunchy Bridge) unless you have DBA capacity, cost at scale justifies it, or data residency/regulation forces self-hosting. You're buying automated backups + PITR, failover, patching, monitoring.
- Self-hosting on Kubernetes: use a mature operator (CloudNativePG, Crunchy PGO, Zalando) and test failover; Patroni is the classic HA manager (Jepsen-style testing of Patroni: <https://www.binwang.me/2024-12-02-PostgreSQL-High-Availability-Solutions-Part-1.html>).
- **Serverless Postgres / branching**: Neon separates storage and compute, scales to zero, and offers copy-on-write **branches** per PR/preview environment. **Databricks acquired Neon (~$1B, announced 2025-05-14)**; Neon powers Databricks "Lakebase" (as of 2026-09) <https://techcrunch.com/2025/05/14/databricks-to-buy-open-source-database-startup-neon-for-1b/>. Supabase = Postgres + auth + storage + realtime + edge functions (good MVP platform; still plain Postgres underneath, so exit is `pg_dump`). Watch cold-start latency after scale-to-zero, connection limits (use their poolers), and egress pricing.
- Exit test: can you `pg_dump`/logical-replicate out? Are you depending on proprietary extensions (e.g., TSL features, vendor-only extensions)?

### 2.13 CAP / PACELC — keep it short

- **CAP**: during a network **P**artition, choose **C**onsistency (refuse some requests) or **A**vailability (serve possibly stale/conflicting data). Not a menu for normal operation.
- **PACELC** (Abadi, 2012): *if Partition → A or C; Else → Latency or Consistency.* The "else" branch is the everyday trade-off: synchronous replication/consensus costs latency. Dynamo-style stores (Cassandra, DynamoDB default reads) are PA/EL; Spanner/CockroachDB are PC/EC. **[Abadi, "Consistency Tradeoffs in Modern Distributed Database System Design", IEEE Computer 2012 — well known]**
- Practical rule: state per feature which staleness is acceptable and pick read paths accordingly (primary vs replica vs cache).

### 2.14 Multi-region realities

- Start single-region, multi-AZ. Add cross-region **read** replicas + tested failover runbook for DR (RPO seconds, RTO minutes).
- Multi-region **writes** require either (a) partitioning users/tenants by home region (data residency often forces this anyway), (b) conflict-tolerant models (DynamoDB global tables last-writer-wins, CRDTs), or (c) distributed SQL with consensus (latency cost per write).
- OpenAI keeps a single write primary with ~50 global read replicas (see §2.1): cross-region reads, single-region writes, is a strong default even at huge scale.

### 2.15 Database decision table

| Situation | Default | Switch when | To |
|---|---|---|---|
| New web/mobile backend, any domain | **Postgres (managed)** | — | — |
| Single-server app, internal tool, per-tenant files, edge/desktop | SQLite + Litestream | Need >1 writer node, HA failover | Postgres |
| Existing MySQL team/stack | MySQL | Need extensions (PostGIS, pgvector depth) | Postgres |
| Reads saturate primary | Read replicas + pooler + caching | Writes saturate primary after scale-up and tuning | Partition → app-level sharding / Citus / Vitess (MySQL) / distributed SQL |
| Flexible per-record attributes | Postgres JSONB + GIN | Whole model is document aggregates, team fluent in Mongo | MongoDB/Firestore |
| AWS serverless, known key-based access, spiky | DynamoDB on-demand | Access patterns churn; need ad-hoc queries/joins | Postgres (Aurora Serverless/Neon) |
| Massive write-heavy time-ordered data per key, multi-DC | Cassandra | GC/latency/ops pain | ScyllaDB (note licence) / managed Keyspaces/Bigtable |
| Global strongly consistent writes | Single-region Postgres + DR replica | True multi-region write RPO=0 requirement | Spanner / CockroachDB / Aurora DSQL / YugabyteDB |
| Hierarchies, shallow relationships | Postgres recursive CTE / ltree | Unbounded-depth traversals, graph algorithms | Neo4j / Neptune / Memgraph |
| Time series | Postgres partitioning (pg_partman) | Compression/rollups needed at 100M+ rows | TimescaleDB → ClickHouse for analytics scale |
| Product analytics / dashboards | Replica + SQL; DuckDB | Billions of events, sub-second user-facing | ClickHouse; org-wide BI → BigQuery/Snowflake |
| Ephemeral KV (sessions, counters) | Redis/Valkey (as cache/coordination) | Must be durable | Postgres/DynamoDB |

---

## 3. Caches

### 3.1 When to add a cache at all

- **Measure first.** Most "slow DB" problems are missing indexes, N+1 queries, unbounded result sets, or no pooling. Fix those, then cache. Postgres serves warm indexed point lookups in well under a millisecond server-side (see E-architecture latency table).
- A cache is a **consistency liability** and a **second failure mode**: stale reads, invalidation bugs, cold-start stampedes after flush/deploy, and a thundering herd on the DB if the cache dies. Your system must still function (degraded) when the cache is empty.
- Add a cache when: (1) the same expensive result is read many times between changes (high read:write ratio), (2) the data tolerates a stated staleness, (3) you've computed expected hit rate from the working set, and (4) you have an invalidation or TTL story.
- Cache mechanics (cache-aside, write-through, stampede protection with request coalescing/locks/probabilistic early expiry, negative caching) → see `E-architecture.md` §4. Facebook's "Scaling Memcache at Facebook" (NSDI 2013) introduced **leases** to prevent stale sets and thundering herds — classic reference **[well known]**.

### 3.2 Cache layers — use the cheapest layer that works

| Layer | Examples | Best for | Invalidation |
|---|---|---|---|
| Browser/HTTP | `Cache-Control`, `ETag`, `stale-while-revalidate` | Static assets (immutable hashed URLs), public GETs | Versioned URLs; short max-age + revalidate |
| CDN / edge | Cloudflare, Fastly, CloudFront, Vercel/Netlify edge | Public pages, images, API GETs that are the same for many users | Surrogate keys / tag purge, TTL |
| Reverse proxy | Nginx/Varnish micro-caching | Shielding origin from bursts | TTL (1–10 s micro-cache) |
| Application in-process | **Caffeine** (JVM, W-TinyLFU), `lru-cache` (Node), `ristretto`/`otter` (Go), `functools.lru_cache`/`cachetools` (Python) | Hot config, feature flags, small reference data, per-instance memoisation | TTL; pub/sub broadcast to evict; accept per-instance divergence |
| Distributed cache | Valkey/Redis, Memcached, managed (ElastiCache, Memorystore, Upstash, Momento) | Shared computed results, sessions, rate limits across instances | TTL + explicit delete on write / CDC-driven eviction |
| DB-backed cache | **Solid Cache** (Rails, disk-backed in SQL DB) | Large fragment caches where disk is cheaper than RAM; 37signals: 10 TB, 60-day retention <https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required> | TTL/FIFO eviction |
| DB buffer cache / materialized views | Postgres shared_buffers, OS page cache, MVs, summary tables | Aggregates refreshed on schedule | `REFRESH MATERIALIZED VIEW CONCURRENTLY` |

Two-tier (in-process L1 + distributed L2) is common for very hot keys; keep L1 TTLs short.

### 3.3 Redis vs Valkey vs Memcached vs others (as of 2026-09)

**Licence timeline (important for self-hosting and vendor choice)**
- **2024-03**: Redis Ltd. relicensed Redis from BSD-3 to dual **RSALv2 / SSPLv1** starting with 7.4 (neither OSI-approved).
- **2024-03/04**: Linux Foundation launched **Valkey**, a fork of Redis 7.2.4 under BSD-3, backed by AWS, Google Cloud, Oracle, Ericsson, Snap and others. <https://www.linuxfoundation.org/press/valkey-8-0>; Valkey README: "forked from the open source Redis project right before the transition to their new source available licenses" <https://github.com/valkey-io/valkey>.
- **2025-05-01**: **Redis 8** added **AGPLv3** as a third option (RSALv2 / SSPLv1 / AGPLv3), with antirez back at Redis; Redis 8 also folded former modules (JSON, search, time series, probabilistic) into the core distribution and added Vector Sets. <https://lwn.net/Articles/1019686/>, <https://securityboulevard.com/2025/05/redis-returns-to-open-source-with-agplv3-license-key-insights/>
- Practical reading: Redis 8 is OSI-open again but AGPL (copyleft for network services — fine for most app use, a problem for some corporate policies); Valkey is BSD and is now the default engine on the major clouds' managed offerings. **ElastiCache for Valkey** is priced ~20% lower (node-based) and ~33% lower (serverless) than other ElastiCache engines, with a 100 MB serverless minimum <https://aws.amazon.com/elasticache/features/>, <https://www.amazonaws.cn/en/new/2024/announcing-amazon-elasticache-for-valkey/>. Google offers Memorystore for Valkey (9.0 GA) <https://cloud.google.com/blog/products/databases/memorystore-for-valkey-9-0-is-now-ga>.
- Valkey releases: 8.0 (2024) reworked I/O threading, reporting ~1.2M QPS on a single node (AWS r7g) vs ~380K before **[project claim]** <https://valkey.io/blog/unlock-one-million-rps/>; 9.0 (2025) added hash-field expiration, atomic slot migration, multiple databases in cluster mode, claimed up to 40% more throughput vs 8.1 **[project claim]** <https://www.linuxfoundation.org/press/valkey-9.0-delivers-performance-and-resiliency-for-real-time-workloads>. Valkey 9.1 is out as of 2026 <https://www.phoronix.com/news/Valkey-9.1-Released>.
- Client compatibility: Valkey speaks the Redis protocol (RESP); existing Redis clients work; Valkey also ships its own GLIDE clients **[well known]**. Divergence after Redis 7.4/8 features (e.g., new Redis 8 data types) means "drop-in" holds for the 7.2 feature set.

**Choosing**
| Option | Pick when | Watch out |
|---|---|---|
| **Valkey** (default for new self-hosted or AWS/GCP managed) | You want Redis data structures (hashes, sorted sets, streams, pub/sub, Lua) with a BSD licence and foundation governance | Features added only in Redis 7.4+/8 aren't all present |
| **Redis 8 / Redis Cloud** | You want Redis Ltd.'s integrated search/JSON/vector features or Redis Enterprise (active-active CRDT) | AGPL/RSAL/SSPL terms for self-hosting; vendor pricing |
| **Memcached** | Pure GET/SET cache of blobs, multi-threaded, simplest possible semantics, huge fleets (Facebook, Pinterest) | No persistence, replication or rich types <https://redis.io/compare/memcached/> |
| **Dragonfly** | Single-node vertical scale with Redis/Memcached API, multi-threaded shared-nothing | **BSL 1.1** — free to self-host, not to offer as a managed service <https://www.dragonflydb.io/docs/about/license> |
| KeyDB | — | Development largely stalled after Snap acquisition **[unverified; check repo activity]** |
| **Upstash** (serverless Redis-compatible, per-request pricing, HTTP API) | Serverless/edge functions with low/spiky traffic | Per-request cost at high QPS; latency from far regions **[well known]** |
| **Momento** (serverless cache API) | Want zero cache ops | Proprietary API **[well known]** |
| **Solid Cache / DB-backed** | Rails apps; large caches where disk beats RAM | Slower per hit than RAM; fine for fragment caching |

### 3.4 Eviction, TTL, sizing

- **Eviction policy**: for pure caches use `allkeys-lru` or `allkeys-lfu` (LFU for skewed popularity). For instances that also hold data you can't lose (queues, locks) use `noeviction` — and then **don't share that instance with your cache**. Sidekiq and BullMQ require `noeviction`; eviction silently deletes jobs. <https://github.com/sidekiq/sidekiq/issues/5712>, <https://www.ibm.com/support/pages/understanding-redis-eviction-behavior-sidekiq-and-terraform-enterprise-tfe>
- **Separate instances by purpose**: cache (evictable, no persistence needed), queue/locks (noeviction + AOF), sessions (depends on durability need). Different failure/tuning profiles.
- **TTL strategy**: every cache key gets a TTL (a safety net for missed invalidations); add jitter (±10–20%) to avoid synchronized expiry; use short TTLs + `stale-while-revalidate` semantics for hot keys; version keys (`user:v3:{id}`) for schema changes; negative-cache "not found" with a short TTL.
- **Sizing**: estimate working set = hot keys × avg value size × overhead (Redis per-key overhead is tens of bytes **[order-of-magnitude, well known]**); target a hit ratio (e.g., ≥90% for read-through caches) and measure it; keep memory headroom for fork-based persistence (RDB/AOF rewrite copy-on-write) and replication buffers; monitor evictions, hit ratio, memory fragmentation, latency, connected clients.
- **Big keys & hot keys**: avoid multi-MB values and unbounded collections; shard hot keys or add L1 in-process caching/request coalescing (Discord's pattern, §2.6).

### 3.5 When NOT to use Redis/Valkey

- As a **durable job queue** without persistence/`noeviction`/reliable-fetch semantics (see §4.4).
- As the **primary database** for data you can't reconstruct (§2.8).
- As a **cache in front of a DB that is already fast enough** (adds latency hop and invalidation bugs for no gain).
- As a **pub/sub for durable events** — Redis Pub/Sub is fire-and-forget (offline subscribers miss messages); use Streams, a real broker, or Postgres outbox.
- As a **distributed lock for correctness-critical mutual exclusion** without fencing tokens (Martin Kleppmann's critique of Redlock: <https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html> **[well known]**). Prefer DB row locks/advisory locks or a consensus system for correctness; Redis locks are fine for efficiency (dedup of work).

---

## 4. Queues, streams, pub/sub, durable execution

### 4.1 Taxonomy — name the need before the product

| Category | Semantics | Consumers | Retention | Examples |
|---|---|---|---|---|
| **Job / task queue** | A unit of work executed once (at-least-once + idempotency), with retries, scheduling, priorities, uniqueness | Competing workers; each job to one worker | Until done (+ history) | Postgres queues (River, pg-boss, Graphile Worker, Solid Queue, Oban, pgmq), Sidekiq/BullMQ/Celery (Redis), SQS, Cloud Tasks |
| **Message broker (queue + routing)** | Messages routed via exchanges/topics/bindings to queues; ack/nack; DLX | Competing consumers per queue; fan-out via bindings | Until acked | RabbitMQ (AMQP), ActiveMQ/Artemis, Azure Service Bus, SQS+SNS |
| **Log / stream** | Append-only, partitioned, ordered per partition; consumers track offsets; **replay** | Many independent consumer groups each read everything | Time/size based (days → forever, tiered storage) | Kafka, Redpanda, WarpStream, AutoMQ, Kinesis, Pulsar, NATS JetStream, Redis Streams |
| **Pub/sub (fan-out notifications)** | Publish once, deliver to all current subscribers | All subscribers | Ephemeral (core NATS, Redis Pub/Sub, Postgres LISTEN/NOTIFY) or durable per subscription (Google Pub/Sub, SNS→SQS) | |
| **Durable execution / workflow** | Multi-step function whose progress is checkpointed; resumes after crashes; timers, signals, compensation (sagas) | Workflow workers | Workflow history | Temporal, Restate, Inngest, DBOS, AWS Step Functions, Azure Durable Functions, Cloudflare Workflows |

Durable execution vs queue: "a job queue treats one job as one function call… retrying the whole job on failure", whereas durable execution "persists progress after each step, retries only the failed step" and keeps run history. <https://www.inngest.com/blog/best-job-queue-alternatives> **[vendor]**. DBOS keeps the workflow log in your own Postgres (library, no orchestration server); Temporal replays workflow code against an event history (server cluster); Inngest invokes your function per step over HTTP; Restate journals handlers in a compact runtime. <https://www.dbos.dev/blog/durable-execution-coding-comparison> **[vendor]**

### 4.2 Default: a Postgres-backed job queue (if you already run Postgres)

**Why**
- **Transactional enqueue**: insert the job in the same transaction as the business write — "Jobs are guaranteed to be enqueued if their transaction commits, are removed if their transaction rolls back, and aren't visible for work until commit" (River docs). This eliminates the dual-write problem (DB committed but enqueue failed, or vice-versa) without a separate outbox. <https://github.com/riverqueue/river> (doc.go); <https://riverqueue.com/docs/transactional-enqueueing>
- One less stateful system to operate, back up, secure and monitor; jobs are queryable with SQL; backups include the queue.
- Mechanism: `SELECT … FOR UPDATE SKIP LOCKED` lets concurrent workers claim different rows without blocking (Postgres 9.5+, MySQL 8+, MariaDB 10.6+). Solid Queue README <https://github.com/rails/solid_queue>; 2ndQuadrant explainer <https://www.2ndquadrant.com/en/blog/what-is-select-skip-locked-for-in-postgresql-9-5/>

**Library options (as of 2026-09)**
| Language | Library | Notes |
|---|---|---|
| Go | **River** | Transactional enqueue, unique jobs, periodic/cron, snoozing, workflows (Pro), UI <https://github.com/riverqueue/river> |
| Node.js | **pg-boss** | SKIP LOCKED; transactional inserts via ORM adapters (Drizzle, Knex, Kysely, Prisma); LISTEN/NOTIFY low-latency option; cron/RRULE; priorities; **dead-letter queues with redrive**; retries with exponential backoff; dependency workflows <https://github.com/timgit/pg-boss> |
| Node.js | **Graphile Worker** | Self-reported "optimal conditions" ~183k jobs/s executed and ~4 ms add→start latency with batching on a well-specced DB; explicitly "not intended to replace extremely high performance dedicated job queues for Facebook scale" **[project claim]** <https://github.com/graphile/worker> (website/docs/performance.md) |
| Ruby/Rails | **Solid Queue** (Rails 8 default; MySQL/Postgres/SQLite) | Delayed jobs, concurrency controls, recurring jobs, pausing, priorities, bulk enqueue; HEY runs 20M jobs/day <https://github.com/rails/solid_queue>; also GoodJob (Postgres) |
| Elixir | **Oban** | Mature Postgres queue **[well known]** |
| Python | Procrastinate, PgQueuer, Django tasks backends **[listed in postgres_for_everything]** | |
| SQL-only / any language | **pgmq** | SQS-like API (send/read/archive/delete, visibility timeout), FIFO with message groups, topic routing; Postgres 14–18; SQL-only install possible <https://github.com/pgmq/pgmq>; Supabase Queues is built on pgmq **[unverified]** |

**Limits of Postgres queues (when to graduate)**
- **Dead tuples & vacuum**: every claim/complete is an UPDATE/DELETE → dead tuples. A **long-running transaction anywhere in the database pins the xmin horizon**, so VACUUM can't remove dead queue rows; the queue table and its indexes bloat and claim queries slow down, which feeds a spiral. Monitor `n_dead_tup`, oldest transaction age, and set `idle_in_transaction_session_timeout`; partition or rotate queue tables. PlanetScale, "Keeping a Postgres queue healthy" <https://planetscale.com/blog/keeping-a-postgres-queue-healthy>; Microsoft/Richard Yen, "Potential Consequences of Using Postgres as a Job Queue" <https://richyen.com/postgres/2026/05/04/postgres_job_queue.html>
- **LISTEN/NOTIFY at high concurrency**: NOTIFY inside a transaction takes a global lock at commit to preserve commit ordering, effectively serialising commits; Recall.ai hit this with tens of thousands of concurrent writers. <https://www.recall.ai/blog/postgres-listen-notify-does-not-scale>; counterpoint with measurements: <https://www.dbos.dev/blog/postgres-listen-notify-scalability>. A fix was reportedly committed to Postgres core afterwards **[unverified which release; likely PG 19]**. Rule: use NOTIFY as a wake-up hint, keep polling as the correctness path.
- **Competing consumers only**: one table = one worker pool; no independent consumer groups with replay, and ordering is lost across concurrent workers. <https://www.morling.dev/blog/you-dont-need-kafka-just-use-postgres-considered-harmful/>
- **Shared fate**: queue load competes with OLTP on the same primary; at high volume put the queue in a separate database/instance (Solid Queue supports a separate queue DB).
- Graduate when: sustained thousands of jobs/s *and* vacuum can't keep up, many independent consumers need the same events, you need cross-team data streaming, or queue load measurably hurts OLTP latency.

### 4.3 Managed cloud queues (SQS/SNS, Google Pub/Sub & Cloud Tasks, Azure Service Bus)

**When**: cloud-native/serverless apps, cross-service integration without running a broker, bursty load, Lambda/Cloud Run consumers.

**SQS facts (as of 2026-09)**
- Standard queues: near-unlimited throughput, **at-least-once**, best-effort ordering.
- FIFO queues: exactly-once *processing* within a 5-minute deduplication window, ordered per **message group ID**; default 300 API calls/s per action (3,000 msg/s with 10-message batches); **high-throughput mode** up to 70,000 TPS without batching (700,000 msg/s with batching in the largest regions). <https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-fifo.html>, <https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/enable-high-throughput-fifo.html>
- **Max message payload raised from 256 KiB to 1 MiB (Aug 2025)** for standard and FIFO; for larger payloads store in S3 and send a pointer (claim-check pattern). <https://www.amazonaws.cn/en/new/2025/amazon-sqs-increases-maximum-message-payload-size-to-1mib/>
- Visibility timeout default 30 s, max 12 h; extend it for long jobs (heartbeat via `ChangeMessageVisibility`) or the message reappears and runs twice. <https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html>
- DLQ via redrive policy (`maxReceiveCount`), with redrive back to source. Retention up to 14 days **[well known]**.
- SNS→SQS fan-out for pub/sub with durable per-subscriber queues; EventBridge for routing/filtering events across services.
- Google Pub/Sub: durable pub/sub with per-subscription acks, ordering keys, optional exactly-once delivery **[well known; verify current limits]**. Cloud Tasks: HTTP-target task queue with rate limiting/scheduling. Azure Service Bus: queues/topics with sessions (ordered groups), DLQ, transactions.

**Downsides**: cloud lock-in (API not portable — wrap behind a small interface), no transactional enqueue with your DB (use outbox), per-request costs at very high volume, local dev needs emulators (LocalStack, Pub/Sub emulator).

### 4.4 Redis-based job queues (Sidekiq, BullMQ, Celery w/ Redis, RQ)

- Mature, fast, huge ecosystems (Sidekiq in Ruby, BullMQ in Node, Celery in Python).
- **Durability caveats**: Redis must run with `maxmemory-policy noeviction` (eviction silently drops jobs) and AOF persistence; otherwise a restart/eviction loses jobs. Basic Sidekiq fetch uses a pop, so a crashed worker loses in-flight jobs; **Sidekiq Pro super_fetch** keeps jobs in Redis until acknowledged (LMOVE) for true at-least-once. Watch completed-job retention filling memory (under `noeviction` Redis then rejects writes). <https://github.com/sidekiq/sidekiq/wiki/Reliability>, <https://github.com/twentyhq/twenty/issues/26219>, <https://hookdeck.com/webhooks/platforms/redis-webhook-queue-teardown>
- No transactional enqueue with your SQL DB → enqueue after commit (Rails `after_commit`) or use an outbox; otherwise jobs can run before the row is visible, or be lost if the process dies between commit and enqueue.
- Pick when: you already run Redis/Valkey, need very high job throughput with low latency, and accept (or configure away) the durability caveats. Otherwise prefer the Postgres queue.

### 4.5 RabbitMQ

- Strengths: flexible **routing** (direct/topic/fanout/headers exchanges), per-message acks, priorities, TTL, dead-letter exchanges, AMQP 0-9-1 + AMQP 1.0/MQTT/STOMP, push delivery with low latency; good for task distribution and service integration where routing rules matter.
- **RabbitMQ 4.0 (2024) removed classic mirrored queues**; use **quorum queues** (Raft-replicated) for HA, and **streams** for log-like replay. Quorum queues sustain ~30k msg/s (1 KB) with 3-way replication per the RabbitMQ team **[project claim]**. <https://www.rabbitmq.com/blog/2024/08/28/quorum-queues-in-4.0>, <https://www.rabbitmq.com/docs/quorum-queues>
- Operational cost: Erlang cluster ops, queue-length alarms, memory/disk alarms (flow control), upgrades. Managed: CloudAMQP, Amazon MQ.
- Pick when: complex routing, protocol interop (MQTT/AMQP), polyglot service integration without cloud lock-in. Not for long-term retention/replay at scale (use Kafka).

### 4.6 Kafka and Kafka-compatible logs (Redpanda, WarpStream, AutoMQ, MSK, Confluent)

**When Kafka is genuinely right**
- Many independent consumers need the same event stream (each with its own offset), **replay** (reprocessing, backfilling new services, rebuilding read models), high sustained throughput (MB/s–GB/s), per-key ordering, stream processing (Kafka Streams, Flink), CDC pipelines (Debezium), and **cross-team data exchange** (the "central nervous system"). Gunnar Morling: for data exchange across many teams/services, Postgres is "a definitive no-go, for architectural reasons rather than performance" <https://www.morling.dev/blog/you-dont-need-kafka-just-use-postgres-considered-harmful/>
- Case links: Kafka at Shopify (on Kubernetes), Pinterest (at scale), Segment (exactly-once dedup layer on Kafka + RocksDB) via <https://github.com/binhnguyennus/awesome-scalability>; Segment dedup: <https://segment.com/blog/exactly-once-delivery/>

**When you probably don't need it**
- One producer app and one consumer pool (that's a job queue), < a few thousand msgs/s, no replay requirement, small team. The ops overhead is brokers, partitions, consumer-group rebalances, retention, schema registry, monitoring, upgrades — even managed Kafka costs engineering time. "For 80% of use cases Kafka is overkill" (Aiven, a Kafka vendor) <https://aiven.io/blog/apache-kafkas-80-percent-problem>; "Kafka vs Postgres? just use postgres" (2 Minute Streaming, 500 KB/s example) <https://blog.2minutestreaming.com/p/just-use-postgres>
- Kafka is not a job queue: no per-message ack/retry/DLQ semantics out of the box; a slow message blocks its partition (head-of-line); parallelism is capped by partition count. **KIP-932 "Queues for Kafka" (share groups)** arrived as early access in Kafka 4.0 to add queue semantics **[check GA status in current Kafka release]**. <https://www.confluent.io/blog/latest-apache-kafka-release/>

**Ecosystem & ownership (as of 2026-09)**
- **Apache Kafka 4.0** (2025-03-18) removed ZooKeeper entirely; KRaft is the only mode. <https://blog.2minutestreaming.com/p/apache-kafka-4-0-release>
- **IBM acquired Confluent** (announced 2025-12-08, ~$11B; completed 2026-03-17). <https://www.cnbc.com/2025/12/08/ibm-confluent-deal-data.html>, <https://finance.yahoo.com/news/ibm-completes-11bn-confluent-acquisition-101728540.html>
- **Confluent acquired WarpStream** (2024-09): Kafka-compatible, diskless brokers writing directly to object storage, BYOC; higher latency, much lower cost for logging/observability/data-lake feeds. <https://www.confluent.io/press-release/confluent-acquires-warpstream-to-advance-next-gen-byoc-data-streaming/>
- Other Kafka-API options: **Redpanda** (C++, no JVM, single binary; source-available BSL core **[well known]**), **AutoMQ** (diskless/S3-based Kafka fork), Amazon MSK (incl. Serverless), Aiven, Azure Event Hubs (Kafka endpoint). Object-storage ("diskless") Kafka is the 2024–26 trend: trade tens-to-hundreds of ms latency for no inter-AZ replication cost **[general trend; latency figures vary by vendor]**.

### 4.7 NATS / JetStream

- Core NATS: lightweight, very low-latency pub/sub and request/reply (at-most-once). **JetStream** adds persistence, streams, consumers with acks, key-value and object stores.
- Good for: edge/IoT, microservice request/reply, lightweight streaming where Kafka is too heavy.
- Governance (as of 2026-09): in 2025 Synadia sought to take NATS back from CNCF and move future releases to BSL; on 2025-05-01 CNCF and Synadia settled — trademarks assigned to the Linux Foundation, the project stays in CNCF under Apache 2.0. <https://www.cncf.io/blog/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project-2/>, <https://www.theregister.com/2025/05/02/cncf_synadia_nats/>

### 4.8 Delivery semantics & reliability rules (apply to every option)

- **At-most-once**: fire-and-forget; loss possible (core NATS, Redis Pub/Sub, LISTEN/NOTIFY).
- **At-least-once**: the practical default everywhere; **duplicates will happen** (visibility timeout expiry, consumer crash after side effect before ack, producer retries, rebalances).
- **"Exactly-once"** only exists within a boundary (Kafka transactions for read-process-write within Kafka; SQS FIFO dedup window; pgmq "exactly once within a visibility timeout"). End-to-end you get **effectively-once = at-least-once delivery + idempotent consumers**.
- **Idempotent consumers**: dedupe by message/event ID in a processed-messages table written in the same transaction as the side effect; use natural idempotency keys (upserts, `INSERT … ON CONFLICT DO NOTHING`); pass idempotency keys to external APIs (e.g., payment providers).
- **Ordering**: only where required, and scoped per key (Kafka partition key, SQS FIFO message group, Service Bus session). Global ordering kills parallelism. Design consumers to tolerate reordering (versions/timestamps, "fetch latest state").
- **Retries**: exponential backoff + jitter, max attempts, classify errors (retryable vs permanent), then **DLQ** with alerting and a redrive tool. **Poison messages** must not block the queue (DLQ after N attempts; in Kafka, route to a retry/DLQ topic rather than blocking the partition).
- **Timeouts/visibility**: job timeout < visibility timeout; heartbeat/extend for long jobs; make handlers safe to re-run.
- **Back-pressure**: bounded concurrency per worker, prefetch limits (RabbitMQ `basic.qos`), rate limits per downstream, pause consumers when downstream is unhealthy; alert on **age of oldest message** and DLQ size, not only depth.
- **Transactional outbox / CDC** for publishing events reliably from a DB write: write the event row in the same transaction; a relay (poller or CDC via Debezium/Sequin reading the WAL) publishes it. Risk: a stalled logical replication slot retains WAL until the primary's disk fills — set `max_slot_wal_keep_size` (PG13+), alert on slot lag, heartbeat. <https://streamkap.com/resources-and-guides/debezium-replication-slot-issues>, <https://bigdataboutique.com/blog/debezium-production-cdc-patterns>
- **Message contracts**: version schemas (JSON Schema/Avro/Protobuf + registry for Kafka); include `event_id`, `type`, `occurred_at`, `schema_version`, correlation/trace IDs (W3C traceparent) in headers.

### 4.9 Decision table by need

| Need | Default | Switch when | To |
|---|---|---|---|
| Background jobs (emails, image processing, webhooks out) | Postgres queue library in your stack (River/pg-boss/Graphile/Solid Queue/Oban) | Throughput/vacuum pressure hurts OLTP; no Postgres | Separate queue DB → SQS/Cloud Tasks or Sidekiq/BullMQ on dedicated Valkey |
| Scheduled/cron jobs | Queue library's cron (Solid Queue recurring, pg-boss cron, River periodic) or pg_cron | Need cross-service scheduling | Cloud scheduler (EventBridge Scheduler, Cloud Scheduler) → queue |
| Fan-out domain events to a few internal consumers | Outbox table + Postgres queue per consumer, or SNS→SQS | Many teams/consumers, replay needed | Kafka (managed) with outbox/CDC |
| Cross-service integration in the cloud | SQS/SNS / Pub/Sub / Service Bus | Complex routing, on-prem, protocol needs | RabbitMQ |
| Event sourcing / streaming analytics / CDC pipelines | Kafka-compatible managed service | Cost at high volume, latency-tolerant | Diskless Kafka (WarpStream/AutoMQ) |
| Long-running multi-step business processes (sagas, human approval, days-long timers, AI agent steps) | Durable execution: DBOS (in Postgres) / Inngest / Restate for small teams; Temporal for complex/polyglot at scale; Step Functions if all-in on AWS | — | — |
| Low-latency request/reply between services, edge/IoT | HTTP/gRPC; NATS | Need persistence | JetStream |
| Real-time UI updates (websockets) | Framework adapter (Solid Cable, Postgres LISTEN/NOTIFY hint, Valkey pub/sub) | Many connections/instances | Managed realtime (Ably/Pusher/Supabase Realtime) or NATS |

---

## 5. Search

### 5.1 Default: Postgres full-text + pg_trgm

- `tsvector`/`tsquery` with a GIN index on a generated `tsvector` column; language stemming dictionaries; `websearch_to_tsquery` for user input; `pg_trgm` GIN/GiST index for fuzzy/`ILIKE '%foo%'`/typo-tolerant-ish similarity; `unaccent`.
- Good enough for: admin search, in-app search over < a few million rows, filtering + keyword search combined with relational permissions (row-level security applies naturally — a major advantage over external engines).
- **Limits**: `ts_rank` has no IDF and no term-frequency saturation (not BM25), and ranking must score every matching row (no efficient top-k), so relevance and speed degrade on large corpora; weak faceting, typo tolerance, synonyms UX, highlighting at scale. <https://www.paradedb.com/learn/search-in-postgresql/bm25>, <https://neon.com/blog/postgres-full-text-search-vs-elasticsearch>
- **In-Postgres BM25 extensions** (as of 2026-09): ParadeDB **pg_search** (Tantivy-based), Tiger Data **pg_textsearch** (1.0), VectorChord-BM25. They avoid a second system but may not be available on every managed Postgres. <https://www.tigerdata.com/blog/pg-textsearch-bm25-full-text-search-postgres>, <https://github.com/paradedb/paradedb> **[vendor]**

### 5.2 When to add a search engine

Add one when you need **several** of: typo tolerance & prefix "search-as-you-type" with <50 ms latency, BM25 relevance tuning/boosting, facets with counts, synonyms, multi-language analysers, highlighting, geo + text, large corpora (tens of millions+ docs), log/observability search, or hybrid lexical+vector ranking at scale.

| Engine | Pick when | Notes (as of 2026-09) |
|---|---|---|
| **Meilisearch** | Instant, typo-tolerant app/e-commerce/docs search; small team | MIT (Community Edition); disk-based LMDB index, memory-mapped — dataset can exceed RAM <https://www.meilisearch.com/docs/learn/engine/storage> |
| **Typesense** | Same niche; lowest latency when index fits in RAM; built-in Raft HA | GPL-3.0; whole index in RAM (~2–3× data size) <https://typesense.org/docs/guide/system-requirements.html> |
| **Elasticsearch** | Large-scale search & analytics, logs (ELK), complex aggregations, mature ecosystem | Licence: Apache 2.0 → **SSPL/ELv2 (2021)** → **AGPLv3 added as an option (Aug 2024)** <https://simonwillison.net/2024/Aug/29/elasticsearch-is-open-source-again/>; JVM/Lucene/shard ops are real work |
| **OpenSearch** | Same as Elasticsearch; Apache 2.0; AWS-managed | Forked from ES 7.10 in 2021; moved to the **OpenSearch Software Foundation under the Linux Foundation (2024-09-16)** <https://en.wikipedia.org/wiki/OpenSearch_(software)> |
| **Algolia** | Fully managed, best-in-class instant search UX, merchandising; budget available | Proprietary SaaS, priced per records/searches; lock-in |
| Vespa / Solr | Large-scale ranking/recommendation (Vespa), legacy Lucene (Solr) | Specialist |

Stack Overflow ran 3 Elasticsearch servers beside SQL Server in 2016 — search as a sidecar is normal even for "boring" architectures. <https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/>

### 5.3 Keeping a search index in sync

- The DB stays the source of truth; the index is derived and **rebuildable** (keep a full reindex job and use index aliases for zero-downtime swaps).
- Sync via **outbox/CDC** (Debezium/Sequin → queue → indexer), or an after-commit job per change; never dual-write synchronously in the request path.
- Handle deletes (tombstones), permissions (filter by tenant/ACL fields at query time; don't leak data via facets/counts), and eventual consistency in UX ("results may take a few seconds to update").
- Track index lag as a metric.

---

## 6. Object storage & files

### 6.1 Default: S3-compatible object storage for all user files and blobs

- Store files in object storage; store only **key, content type, size, checksum, owner, status** in the DB. Blobs in the DB bloat backups/replication and waste buffer cache (Postgres TOAST works, but backups/restores and replicas pay for every byte). Exception: tiny blobs (< ~100 KB **[rule of thumb]**) that need transactional consistency, or SQLite apps where a single file is the point.
- **Uploads**: client uploads directly to storage with **presigned PUT/POST URLs** (short expiry, content-type and size constraints via POST policy), then the client confirms and a job validates (virus scan, image processing, metadata extraction). Never stream large uploads through your app servers. Multipart upload for large files.
- **Downloads**: private buckets + short-lived presigned GET URLs or a CDN with signed URLs/cookies; public immutable assets behind a CDN with content-hashed keys and long max-age.
- **S3 conditional writes** (`If-None-Match`, Aug 2024; `If-Match` later in 2024) enable create-if-absent and optimistic concurrency directly on objects (used for leader election, lakehouse commits). <https://simonwillison.net/2024/Aug/30/leader-election-with-s3-conditional-writes/>, <https://simonwillison.net/2024/Nov/26/s3-conditional-writes/>
- **Lifecycle rules**: expire temp/incomplete multipart uploads (abort after N days), transition old objects to infrequent-access/archive tiers, versioning + object lock for backups/ransomware protection, expire old versions.
- Security: block public access by default, bucket policies least-privilege, server-side encryption, never put secrets in object keys, validate content type server-side (don't trust client MIME), serve user uploads from a separate domain to avoid XSS on your main origin.

### 6.2 Provider choice (as of 2026-09; prices change — verify)

| Provider | Storage (std) | Egress to internet | Notes |
|---|---|---|---|
| AWS S3 | ~$0.023/GB-mo **[well known list price, us-east-1]** | ~$0.09/GB first 10 TB (after 100 GB free) <https://aws.amazon.com/s3/pricing/> | Richest features (events, Object Lambda, S3 Tables, **S3 Vectors**), IAM integration |
| Cloudflare R2 | $0.015/GB-mo | **$0** | Class A ops $4.50/M, Class B $0.36/M; 10 GB free <https://www.cloudflare.com/products/r2/> |
| Backblaze B2 | low (~$6/TB-mo **[unverified current]**) | Free up to 3× stored data, then $0.01/GB; free via CDN partners (Cloudflare, Fastly, bunny.net…) <https://www.backblaze.com/cloud-storage/pricing> | |
| Tigris | $0.02/GB-mo | $0 | Globally distributed, S3-compatible; integrated with Fly.io <https://www.tigrisdata.com/pricing/> |
| GCS / Azure Blob | similar to S3 | similar to S3 | Use with the rest of that cloud |

- **Egress drives cost** for media-heavy apps: a zero-egress provider (R2/Tigris) or a CDN in front can dominate the decision; inside one cloud, keep compute and storage in the same region to avoid transfer fees.
- **Self-hosted S3: MinIO is no longer a safe default.** MinIO removed the admin console from Community Edition (May 2025), stopped publishing community binaries/Docker images (Oct 2025), put the repo in maintenance mode (Dec 2025) and marked it no longer maintained/archived (Feb 2026) — no security fixes. <https://blocksandfiles.com/2025/06/19/minio-removes-management-features-from-basic-community-edition-object-storage-code/>, <https://github.com/minio/minio/issues/21714>, <https://blog.vonng.com/en/db/minio-is-dead/>. Alternatives: **Garage** (AGPL, lightweight geo-distributed), **SeaweedFS** (Apache 2.0), **Ceph RGW** (heavyweight), community MinIO forks **[evaluate maturity]**. For local dev/tests, use LocalStack or a maintained S3 emulator.

---

## 7. Vector stores

### 7.1 Default: pgvector in your existing Postgres

- `vector` (up to 2,000 dims indexed), `halfvec` (up to 4,000 dims indexed), `bit` (up to 64,000), `sparsevec`; **HNSW** (better speed/recall, slower build, more memory, no training step) and **IVFFlat** (faster build, less memory, lower recall/speed); L2, inner product, cosine, L1, Hamming, Jaccard. <https://github.com/pgvector/pgvector>
- **Filtering gotcha**: with approximate indexes, filters apply *after* the index scan — with `hnsw.ef_search = 40` and a filter matching 10% of rows, you get ~4 results on average. Enable **iterative index scans** (`SET hnsw.iterative_scan = strict_order`, pgvector 0.8+) or use partial indexes / partitioning per tenant. (pgvector README "Filtering")
- Advantages: vectors live next to the rows they describe → joins, transactions, row-level security, and one backup. Hybrid search = Postgres FTS/BM25 + vector with **Reciprocal Rank Fusion** in SQL.
- **pgvectorscale** (Tiger Data) adds StreamingDiskANN (disk-backed index) and statistical binary quantization; their benchmark on 50M 768-dim Cohere embeddings claimed 28× lower p95 latency and 16× higher throughput than Pinecone s1 at 99% recall, ~75% lower cost self-hosted **[vendor claim, 2024]** <https://www.tigerdata.com/blog/pgvector-is-now-as-fast-as-pinecone-at-75-less-cost>. VectorChord is another Postgres vector extension option.
- Practical ceiling: pgvector HNSW is comfortable into the low tens of millions of vectors on a well-sized instance; beyond that, HNSW memory and index build times dominate **[community consensus, not a hard limit]** <https://encore.dev/blog/you-probably-dont-need-a-vector-database>. Reduce memory with `halfvec`, binary quantization + re-ranking, smaller embedding dimensions (Matryoshka embeddings), or partitioning.

### 7.2 When to use a dedicated vector store

| Signal | Consider |
|---|---|
| Hundreds of millions to billions of vectors; heavy real-time upserts; very high QPS with strict recall | **Qdrant** (Apache 2.0, Rust, strong filtering), **Milvus/Zilliz** (Apache 2.0, distributed), **Weaviate** (BSD-3, hybrid built-in) **[licences well known]** |
| Many tenants, mostly cold data (one namespace per user/workspace), cost-sensitive | **turbopuffer** (object-storage-first; data in S3/GCS with NVMe/RAM cache; used by Cursor, Notion — Notion reported saving "millions" and removing per-user AI charges) **[vendor-reported]** <https://turbopuffer.com/blog/turbopuffer>; **Amazon S3 Vectors** (GA Dec 2025; up to 2B vectors/index; AWS claims up to 90% lower cost than specialised vector DBs; higher latency, suited to infrequently queried/large archives) <https://aws-news.com/article/2025-12-02-amazon-s3-vectors-now-generally-available-with-increased-scale-and-performance> |
| Want zero ops, fully managed, predictable API | **Pinecone** serverless (usage-based: storage + read/write units; minimums on paid plans) <https://www.pinecone.io/pricing/estimate/> |
| Embedded / local / multimodal on files | **LanceDB** (embedded, Lance columnar format on object storage) **[well known]**, sqlite-vec, DuckDB VSS |
| Already running Elasticsearch/OpenSearch/Redis/Mongo Atlas | Use their vector features before adding a new system |

- Cost at scale: RAM-resident HNSW is the expensive part; architectures that keep vectors on disk/object storage (DiskANN, turbopuffer, S3 Vectors) trade latency for 10–100× lower storage cost **[vendor framing; direction is robust]**. Model the cost per million vectors *and* per thousand queries at your expected recall.
- Keep the source text/metadata in the primary DB; the vector index is derived and rebuildable (embedding model upgrades force full re-embedding — budget for it, store `embedding_model` + version per row).

---

## 8. Case studies & essays (one-line lessons)

| Case | Lesson | Source |
|---|---|---|
| Dan McKinley, "Choose Boring Technology" (2015) | Limited innovation tokens; boring = known failure modes; adding tech has a cost the whole org pays | <https://mcfunley.com/choose-boring-technology> |
| "Just use Postgres for everything" / postgres_for_everything | Postgres extensions cover queues, search, vectors, GIS, time series, cron at most scales | <https://www.amazingcto.com/postgres-for-everything/>, <https://github.com/Olshansk/postgres_for_everything> |
| Counterpoint: Gunnar Morling, "'You Don't Need Kafka, Just Use Postgres' Considered Harmful" | Postgres queues ≠ Kafka's independent consumer groups, replay, cross-team data exchange; pick by semantics | <https://www.morling.dev/blog/you-dont-need-kafka-just-use-postgres-considered-harmful/> |
| OpenAI / ChatGPT (2026) | Single Postgres primary + ~50 replicas at 800M users; move write-heavy shardable workloads elsewhere | <https://openai.com/index/scaling-postgresql/> |
| Notion (2021) | App-level sharding: 480 logical shards / 32 DBs keyed by workspace; later a data lake via CDC | <https://www.notion.com/blog/sharding-postgres-at-notion> |
| Figma (2024) | Vertical partitioning first, then horizontal sharding with a query proxy; 100× growth on Postgres | <https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/> |
| Instagram (2012) | Postgres logical shards in schemas + time-sortable IDs | <https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c> |
| Uber (2016) Postgres→MySQL + rebuttals | Workload-specific (update-heavy on indexed columns, KV usage); not a general verdict | <https://www.uber.com/us/en/blog/postgres-to-mysql-migration/>, <https://use-the-index-luke.com/blog/2016-07-29/on-ubers-choice-of-databases> |
| Discord (2017→2022) | MongoDB→Cassandra→ScyllaDB; data services layer coalesces hot reads; 177→72 nodes | <https://discord.com/blog/how-discord-stores-trillions-of-messages> |
| Slack (2020) | Vitess for horizontally sharded MySQL, 99% of queries, 2.3M QPS peak | <https://slack.engineering/scaling-datastores-at-slack-with-vitess/> |
| GitHub (2023) | 1,200+ MySQL hosts, 5.5M QPS; major upgrade took a year of planning | <https://github.blog/2023-12-07-upgrading-github-com-to-mysql-8-0/> |
| Stack Overflow (2016) | Scale-up SQL Server + Redis + Elasticsearch; very few servers | <https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/> |
| 37signals / Rails 8 Solid stack (2024) | DB-backed queue/cache/cable replace Redis; 20M jobs/day (HEY), 10 TB cache (Basecamp) | <https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required> |
| Amazon Prime Video (2023) | A monitoring service moved from Step Functions + S3 hand-offs between microservices to one process, cutting infra cost ~90% — intermediate data via S3 calls was the cost driver | <https://www.thestack.technology/amazon-prime-video-microservices-monolith/> (original Prime Video tech blog post was later removed **[unverified]**) |
| Recall.ai (2025) | LISTEN/NOTIFY global commit lock under heavy concurrent writes | <https://www.recall.ai/blog/postgres-listen-notify-does-not-scale> |
| Segment | Exactly-once via dedup layer (Kafka + RocksDB) — "exactly once" is built, not bought | <https://segment.com/blog/exactly-once-delivery/> |
| Oxide RFD 508 "Whither CockroachDB?" | Licence change forces re-evaluation of a core dependency | <https://rfd.shared.oxide.computer/rfd/0508> |
| MinIO (2025–26) | OSS infra can be abandoned; prefer foundation-governed projects or have an exit | <https://blog.vonng.com/en/db/minio-is-dead/> |

**Benchmark hygiene (for the skill):** prefer reproducible, workload-shaped benchmarks (ClickBench for flat-table OLAP, TPC-H/TPC-DS for warehouses, ann-benchmarks/VectorDBBench for vectors **[well known]**); read the methodology (concurrency? caching? tuning parity? dataset size vs RAM?); treat vendor-published comparisons as marketing until reproduced; Jepsen analyses (<https://jepsen.io/analyses>) for correctness claims of distributed databases.

---

## 9. Default stacks by product stage

### 9.1 MVP / prototype (0 → first paying users; 1–5 engineers)
- **One managed Postgres** (Supabase/Neon/RDS/Cloud SQL/Railway/Render) — or **SQLite + Litestream** if single server (Rails 8 defaults).
- Queue: Postgres-backed library in your framework (Solid Queue, River, pg-boss, Graphile Worker, Oban, Procrastinate).
- Cache: none (HTTP caching headers + CDN for static assets). In-process LRU for hot config if needed.
- Search: Postgres FTS + pg_trgm.
- Vectors (AI features): pgvector.
- Files: S3-compatible (R2 if egress-heavy) with presigned uploads.
- Analytics: product analytics SaaS (PostHog etc.) + SQL on a replica/DuckDB for ad-hoc.
- Explicitly **no** Redis, Kafka, Elasticsearch, separate vector DB, microservice-per-DB.

### 9.2 Growth (product-market fit; 5–50 engineers; 10×–100× load)
- Postgres scaled up (bigger instance, NVMe), PgBouncer, **read replicas** for reads with read-your-writes routing, partitioning for big append-only tables, strict migration linting.
- Queue: keep Postgres queue, move it to a separate database if it competes with OLTP; or adopt SQS/Pub/Sub for cross-service integration. Transactional outbox for domain events.
- Cache: add **Valkey** (managed) for measured hot paths, sessions, rate limiting; CDN caching for public pages/APIs.
- Search: Meilisearch/Typesense for product search UX, or OpenSearch/Elasticsearch if logs+search+aggregations; sync via outbox/CDC.
- Analytics: CDC/ELT into ClickHouse (user-facing analytics) or BigQuery/Snowflake (BI); dbt.
- Durable execution (Temporal/Inngest/Restate/DBOS) if you have multi-step long-running processes.

### 9.3 Scale (hundreds of engineers; primary write-bound; multi-region)
- Shard the write-heavy domains (app-level sharding with a routing layer à la Notion/Figma, Citus, Vitess for MySQL) or move specific workloads to purpose-built stores (Cassandra/ScyllaDB/DynamoDB/Cosmos DB for high-write KV/time-ordered data; ClickHouse for events), keeping relational core on Postgres (OpenAI pattern).
- Kafka (managed or diskless) as the cross-team event backbone + schema registry; CDC from DBs.
- Distributed SQL only for domains needing multi-region strongly consistent writes.
- Dedicated vector/search clusters as volume demands; lakehouse (Iceberg on object storage) for analytics.
- Platform team owns data infrastructure; each new store requires an ADR with owner, SLOs, backup/restore test, cost model, exit plan.

---

## 10. Agent rules & common mistakes (for SKILL.md)

**Rules**
1. Before adding any data store, write down: the need (query/access pattern), numbers (size, QPS, latency target), why Postgres (or the existing store) can't meet it *after tuning*, the source of truth, the sync mechanism, the staleness budget, the owner, the backup/restore plan, and the cost at 10×. Record it in an ADR.
2. Default answers: Postgres (managed) · Postgres-backed job queue · no cache until measured · Postgres FTS · pgvector · S3-compatible storage with presigned uploads · DuckDB/replica for analytics.
3. Never dual-write to two systems in a request path; use outbox or CDC.
4. Every consumer is idempotent; every queue has retries with backoff + DLQ + alert on oldest-message age.
5. Every cache key has a TTL; the system works with an empty cache.
6. Separate Redis/Valkey instances for cache (evictable) vs queues/locks (`noeviction`, persistent).
7. No analytics or long-running reports on the OLTP primary.
8. Check licence + governance + ownership at selection time; prefer open protocols (PG wire, S3, RESP, Kafka API) for exit.
9. Label version/price/licence facts with a date; re-verify before recommending.
10. Use vendor benchmarks only as hypotheses; benchmark with your data and concurrency.

**Common mistakes agents make**
- Proposing MongoDB "because the data is JSON" or DynamoDB for an MVP with unknown access patterns.
- Adding Redis for caching before indexing/query fixes; using one Redis for cache + Sidekiq/BullMQ with `allkeys-lru` (silently drops jobs).
- Adding Kafka for a single producer/consumer job queue; or using Kafka as a work queue and hitting head-of-line blocking.
- Using Redis Pub/Sub or LISTEN/NOTIFY as a durable event bus.
- Enqueuing jobs before the DB transaction commits (worker can't find the row) or after commit without an outbox (job lost on crash).
- Storing uploaded files as `bytea` in Postgres; proxying uploads through the app server.
- Adding Elasticsearch without a reindex/rebuild path or permission filtering.
- Picking a vector DB for 100k embeddings.
- Recommending self-hosted MinIO in 2026, or Redis 7.4+ without noting licence terms, without checking current status.
- Claiming "exactly-once" end-to-end.
- Choosing distributed SQL/multi-region active-active without a stated RPO/RTO requirement.
- Leaving an abandoned logical replication slot (CDC) that fills the primary's disk.

---

## 11. Source index (primary / high-signal)

- Choose Boring Technology — <https://mcfunley.com/choose-boring-technology>
- Postgres for Everything list — <https://github.com/Olshansk/postgres_for_everything>
- OpenAI, Scaling PostgreSQL — <https://openai.com/index/scaling-postgresql/>
- Notion sharding — <https://www.notion.com/blog/sharding-postgres-at-notion>; Notion data lake — <https://www.notion.com/blog/building-and-scaling-notions-data-lake>
- Figma sharding — <https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/>
- Uber Postgres→MySQL — <https://www.uber.com/us/en/blog/postgres-to-mysql-migration/>; Winand — <https://use-the-index-luke.com/blog/2016-07-29/on-ubers-choice-of-databases>; Haas — <http://rhaas.blogspot.com/2016/08/ubers-move-away-from-postgresql.html>; Pettus — <https://thebuild.com/presentations/uber-perconalive-2017.pdf>
- Discord — <https://discord.com/blog/how-discord-stores-trillions-of-messages>
- Slack Vitess — <https://slack.engineering/scaling-datastores-at-slack-with-vitess/>
- GitHub MySQL 8 — <https://github.blog/2023-12-07-upgrading-github-com-to-mysql-8-0/>
- Stack Overflow architecture — <https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/>
- Rails 8 Solid stack — <https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required>; Solid Queue — <https://github.com/rails/solid_queue>
- River — <https://github.com/riverqueue/river>; pg-boss — <https://github.com/timgit/pg-boss>; Graphile Worker — <https://github.com/graphile/worker>; pgmq — <https://github.com/pgmq/pgmq>
- Postgres queue health — <https://planetscale.com/blog/keeping-a-postgres-queue-healthy>; LISTEN/NOTIFY — <https://www.recall.ai/blog/postgres-listen-notify-does-not-scale>
- Kafka counterpoint — <https://www.morling.dev/blog/you-dont-need-kafka-just-use-postgres-considered-harmful/>; Kafka 4.0 — <https://www.confluent.io/blog/latest-apache-kafka-release/>
- SQS quotas — <https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-fifo.html>; 1 MiB payload — <https://www.amazonaws.cn/en/new/2025/amazon-sqs-increases-maximum-message-payload-size-to-1mib/>
- RabbitMQ quorum queues 4.0 — <https://www.rabbitmq.com/blog/2024/08/28/quorum-queues-in-4.0>
- Sidekiq reliability — <https://github.com/sidekiq/sidekiq/wiki/Reliability>
- Redis persistence — <https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/>; Redis AGPL — <https://lwn.net/Articles/1019686/>; Valkey — <https://github.com/valkey-io/valkey>, <https://valkey.io/blog/unlock-one-million-rps/>
- DynamoDB single-table — <https://www.alexdebrie.com/posts/dynamodb-single-table/>; price cut — <https://www.amazonaws.cn/en/new/2024/amazon-dynamodb-reduces-prices-for-on-demand-throughput-and-global-tables/>
- Jepsen MongoDB 4.2.6 — <https://jepsen.io/analyses/mongodb-4.2.6>
- Aurora DSQL GA — <https://aws.amazon.com/about-aws/whats-new/2025/05/amazon-aurora-dsql-generally-available/>; CockroachDB licence — <https://siliconangle.com/2024/08/15/cockroach-labs-changes-its-self-hosting-license-single-enterprise-model/>
- ScyllaDB licence — <https://www.scylladb.com/2024/12/18/why-were-moving-to-a-source-available-license/>; Cassandra 5 SAI — <https://cassandra.apache.org/_/blog/Apache-Cassandra-5.0-Features-Storage-Attached-Indexes.html>
- TimescaleDB licence — <https://www.tigerdata.com/legal/licenses>; InfluxDB 3 Core — <https://www.influxdata.com/blog/influxdb3-open-source-public-alpha/>
- ClickBench — <https://github.com/ClickHouse/ClickBench>; Big Data is Dead — <https://motherduck.com/blog/big-data-is-dead/>
- Neon/Databricks — <https://techcrunch.com/2025/05/14/databricks-to-buy-open-source-database-startup-neon-for-1b/>
- Elasticsearch AGPL — <https://simonwillison.net/2024/Aug/29/elasticsearch-is-open-source-again/>; OpenSearch Foundation — <https://en.wikipedia.org/wiki/OpenSearch_(software)>
- Postgres BM25 — <https://www.paradedb.com/learn/search-in-postgresql/bm25>, <https://www.tigerdata.com/blog/pg-textsearch-bm25-full-text-search-postgres>
- Meilisearch storage — <https://www.meilisearch.com/docs/learn/engine/storage>; Typesense requirements — <https://typesense.org/docs/guide/system-requirements.html>
- pgvector — <https://github.com/pgvector/pgvector>; pgvectorscale benchmark — <https://www.tigerdata.com/blog/pgvector-is-now-as-fast-as-pinecone-at-75-less-cost>; turbopuffer — <https://turbopuffer.com/blog/turbopuffer>; S3 Vectors GA — <https://aws-news.com/article/2025-12-02-amazon-s3-vectors-now-generally-available-with-increased-scale-and-performance>
- R2 — <https://www.cloudflare.com/products/r2/>; B2 — <https://www.backblaze.com/cloud-storage/pricing>; Tigris — <https://www.tigrisdata.com/pricing/>; S3 pricing — <https://aws.amazon.com/s3/pricing/>; MinIO status — <https://github.com/minio/minio/issues/21714>
- Debezium slot risk — <https://streamkap.com/resources-and-guides/debezium-replication-slot-issues>
- NATS governance — <https://www.cncf.io/blog/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project-2/>
- IBM/Confluent — <https://www.cnbc.com/2025/12/08/ibm-confluent-deal-data.html>; WarpStream — <https://www.confluent.io/press-release/confluent-acquires-warpstream-to-advance-next-gen-byoc-data-streaming/>
- Postgres 18 — <https://www.postgresql.org/about/news/postgresql-18-released-3142/>; Postgres 19 beta — <https://www.postgresql.org/about/news/postgresql-19-beta-4-released-3386/>

**Unverified / to re-check before shipping as skill text**: Discord exact latency figures; MySQL 9 vector type details; DataStax→IBM acquisition; Supabase Queues built on pgmq; KeyDB activity; B2 current $/TB; Prime Video original post removal; LISTEN/NOTIFY fix release version; Kafka KIP-932 GA version; Neo4j clustering licensing; MongoDB SSPL (well known but not re-fetched); Redpanda BSL; Google Pub/Sub exactly-once details.
