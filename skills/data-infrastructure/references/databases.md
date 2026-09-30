# Databases: choosing the engine

Which database to run, how far the default goes, and the concrete trigger for each alternative. Schema design inside the engine is `data-modeling`; indexes, pooling, replicas, and sharding mechanics are `scalability`. Dated facts are as of 2026-09.

## Contents

- Postgres: why it is the default, how far it goes, where it stops
- MySQL / MariaDB and Vitess
- SQLite in production
- Document stores
- DynamoDB and managed key-value
- Wide-column: Cassandra / ScyllaDB
- Distributed SQL
- Redis as a database
- Graph databases
- Time series
- Analytics / OLAP
- Managed, self-hosted, serverless
- Consistency and multi-region

## Postgres

### Why it is the default
- One general-purpose relational engine with transactions, constraints, and an extension ecosystem that absorbs many specialized systems: JSONB (documents), full-text search and `pg_trgm`, PostGIS, pgvector, TimescaleDB, `pg_partman`, `pg_cron`, SKIP LOCKED queue libraries and pgmq, Citus (sharding), `pg_duckdb` (columnar analytics). The curated list `postgres_for_everything` catalogs these.
- Every major cloud and many specialists run it as a managed service, so you can change vendors with `pg_dump` or logical replication.
- Its wire protocol is reused by distributed SQL systems (CockroachDB, YugabyteDB, Aurora DSQL, Spanner's PG dialect), easing a later move.
- Postgres 18 (September 2025) added asynchronous I/O, native `uuidv7()`, virtual generated columns, B-tree skip scan, and temporal constraints. Postgres 19 was in beta in September 2026.

### How far one primary goes
| Case | What they did | Lesson |
|---|---|---|
| OpenAI, January 2026 | ChatGPT's Postgres: one unsharded Azure primary, nearly 50 read replicas across regions, PgBouncer, "lazy writes"; write-heavy, shardable workloads moved to Azure Cosmos DB; new workloads default to sharded systems | Read-heavy scale fits on one primary; write-heavy shardable workloads are what leave |
| Figma, 2020–2024 | Vertical partitioning (table groups to their own databases) first, then horizontal sharding behind an in-house SQL-parsing proxy; logical sharding via views before physical moves | Buy runway with the cheap split first; sharding took about nine months |
| Notion, 2021 | Application-level sharding: 480 logical shards on 32 physical databases, keyed by workspace ID | Shard on the key queries never cross |
| Stack Overflow, 2016 | Top-50 site on 4 SQL Server machines (two clusters), 2 Redis, 3 Elasticsearch | Scale up and cache before scaling out |

Order before sharding: bigger instance (NVMe, more RAM) → fix queries and indexes → pooler → read replicas → partition large tables → move derived workloads (analytics, search, queues at volume) out → only then shard, for write throughput or single-table size.

### Where "just use Postgres" stops
- **MVCC write amplification and bloat.** Every UPDATE writes a new row version; updates to indexed columns touch every index (HOT updates avoid this only when no indexed column changes and the page has room). High-churn, update-heavy tables need autovacuum tuning. This was the core of Uber's 2016 complaint and part of why OpenAI moved write-heavy workloads.
- **Process per connection.** Always put a pooler (PgBouncer, PgCat, Supavisor, RDS Proxy) in front at scale.
- **Single writer.** No built-in multi-primary; write scale-out means sharding (app-level, Citus) or distributed SQL.
- **Major upgrades need planning** (`pg_upgrade`, or logical replication blue/green).

**The Uber case is workload-specific.** Uber moved its Schemaless layer from Postgres to MySQL in 2016, citing write amplification, WAL replication volume, replica MVCC issues, and hard upgrades. Rebuttals (Markus Winand, Robert Haas, Christophe Pettus) argued the pain came from an update-heavy key-value workload on indexed columns beneath Uber's own sharding layer, that HOT mitigates many cases, and that MySQL's clustered-index secondary lookups cost something too. Logical replication has since addressed some points. Cite it as "fit your workload", not "Postgres does not scale".

## MySQL / MariaDB and Vitess

Pick MySQL when:
- The team or platform already runs it well (Rails, PHP, Laravel, WordPress shops). Switching engines for taste is not worth an innovation token.
- You need proven horizontal sharding for very large, simple, high-QPS OLTP: **Vitess** (built at YouTube). Slack moved to Vitess from 2017; by December 2020 it served 99% of query load, peaking at 2.3M QPS. GitHub runs 1,200+ MySQL hosts (300+ TB, 5.5M QPS) and spent about a year upgrading from 5.7 to 8.0 (2023).
- The workload is update-heavy on indexed columns, where InnoDB's in-place update with undo log may behave better than Postgres MVCC.

Trade-offs: a thinner extension ecosystem than Postgres (geospatial, vectors), a clustered primary key (fast PK range scans; secondary-index lookups need a second traversal). PlanetScale (managed Vitess) also offers managed Postgres since 2025.

## SQLite in production

**Fits:** one server or VM, internal tools, read-heavy sites, per-tenant database files, desktop/mobile/edge, test fixtures. Queries are in-process function calls, which changes N+1 economics. Rails 8 (November 2024) made it a first-class production default alongside DB-backed Solid Queue, Solid Cache, and Solid Cable.

**Settings:** `PRAGMA journal_mode=WAL` (readers do not block the single writer), a `busy_timeout`, short write transactions, `BEGIN IMMEDIATE` for writes.

**Replication and backup add-ons:**
| Tool | What it is | Status |
|---|---|---|
| Litestream | Streams WAL changes to a file or S3-compatible storage for disaster recovery; talks to SQLite only through its API | README badge: beta; not HA |
| LiteFS (Fly.io) | FUSE-based replication across a cluster with a single primary | README: beta |
| Turso / libSQL | libSQL is a SQLite fork adding replication and HTTP access; Turso Database is a Rust rewrite aiming at concurrent writes | Maturing (as of 2026-09) |

**Rule:** switch to Postgres when more than one app node must write, when you need HA failover, or when concurrent writes are heavy. Read André Arko's "Rails on SQLite: exciting new ways to cause outages" (2025) as the counterpoint before committing; the single writer, persistent volumes across deploys, and several processes sharing one file are where production surprises come from.

## Document stores (MongoDB, Firestore, Couchbase)

**Fits:** aggregates read and written whole (a product with variants, a CMS page of blocks, a form submission, a game save), little cross-aggregate joining, schema genuinely varying per record, a team comfortable enforcing schema in code or validators. Firestore when its offline sync and security rules *are* the product for a mobile/web client.

**Does not fit:** relational data with many-to-many relationships, reporting joins, cross-entity invariants. You re-implement joins and referential integrity in the app; "schemaless" becomes lazy, implicit migrations. Postgres JSONB with a GIN index covers "some fields are flexible" inside a relational schema.

**Correctness:** MongoDB added multi-document transactions in 4.0 (2018) and cross-shard transactions in 4.2 (2019). Jepsen's 2020 analysis of 4.2.6 found snapshot-isolation violations even at the strongest concerns; MongoDB says later versions fixed them. Use `majority` read/write concerns for anything that matters and check current Jepsen and vendor documentation. MongoDB Community's license is not OSI-approved (check current terms if you might offer it as a service).

## DynamoDB and managed key-value (Bigtable, Cosmos DB)

**Access-pattern-first.** Keys (partition + sort key, GSIs) are designed from an enumerated list of access patterns; no joins, limited ad-hoc queries. Alex DeBrie's single-table design guide lists the costs: a steep learning curve, inflexibility when new access patterns appear (possibly a backfill over the whole table), and poor fit for analytics.

**Right when:** AWS-native serverless apps wanting zero database operations, predictable low latency at any scale, key-value or known-pattern access (sessions, carts, profiles, idempotency keys, device state), spiky traffic, or multi-region active-active with last-writer-wins (global tables).

**Cost model (as of 2026-09):** AWS cut on-demand throughput prices by 50% and global tables by up to 67% from November 2024 and recommends on-demand as the default for most workloads. Cost drivers: item size (reads billed per 4 KB, writes per 1 KB), each GSI (every write is replicated to it), global tables (a write per region), scans (never on hot paths), backups/PITR, streams. Design high-cardinality partition keys; a date-only key creates a hot partition. Analytics: export to S3 or zero-ETL, then query elsewhere.

**Not for** an early product whose queries are still changing; on-demand pricing means single-table design does not save money by itself.

## Wide-column: Cassandra / ScyllaDB

**Fits:** very high write throughput, tens of terabytes and more, multi-datacenter replication, tunable consistency, queries known up front by partition key; time-ordered data per key (messages per channel, events per device).

**Discord (2017 → 2022):** moved messages from MongoDB to Cassandra; by 2022, 177 Cassandra nodes with hot partitions, GC pauses, and compaction backlogs caused latency spikes and pages. They moved to ScyllaDB (C++, shard-per-core) on 72 nodes, put a Rust data-services layer in front to coalesce hot reads, and migrated trillions of messages in about nine days. Lessons: modeling (partition = channel + time bucket) mattered more than engine, and a coalescing layer protects any database from hot keys.

**Licenses (as of 2026-09):** Apache Cassandra is Apache 2.0 under the ASF; 5.0 added Storage-Attached Indexes and vector search. ScyllaDB moved to a source-available license in December 2024 (the last open-source release was 6.2, AGPL) with a free tier for smaller deployments.

**Anti-pattern:** Cassandra for a small app "because it scales". You give up joins, general transactions (lightweight transactions are limited and slow), and ad-hoc queries, and inherit repair, compaction, and tombstone operations.

## Distributed SQL (Spanner, CockroachDB, YugabyteDB, Aurora DSQL, TiDB)

**Needed when** writes exceed one primary *and* you need relational transactions across shards without building a routing proxy yourself, or when strongly consistent multi-region writes (global ledgers, regulated finance) or surviving a region loss with RPO = 0 is a stated requirement. **Most apps do not:** single-region primary + cross-region replicas + a tested failover meets most DR needs, and each write coordinated across regions pays tens to hundreds of milliseconds of speed-of-light latency.

| System | Notes (as of 2026-09) |
|---|---|
| Google Spanner | Most mature; external consistency; GoogleSQL and a Postgres dialect; GCP only |
| CockroachDB | Postgres wire protocol, serializable by default. License: the free Core edition was retired with v24.3 (November 2024); one Enterprise license, free below $10M annual revenue, paid above. Oxide's RFD 508 is a worked example of re-evaluating after a license change |
| YugabyteDB | Reuses the Postgres query layer on distributed storage |
| Amazon Aurora DSQL | Serverless, Postgres-compatible, active-active multi-region, optimistic concurrency (conflicts surface at commit, so clients must retry). GA May 2025; launched without foreign keys, triggers, PL/pgSQL, and many extensions; foreign-key support was reported in 2026 — check the current compatibility guide |
| TiDB | MySQL-compatible, with a columnar replica for mixed workloads |

Costs: higher per-transaction latency than single node, hot-key contention, retry logic for serialization or OCC conflicts, missing extensions ("PG-compatible" is not Postgres), higher cost per GB and per operation. Test your ORM and migration tool against the compatibility list before choosing.

## Redis as a primary database

Avoid for data you cannot reconstruct. Data must fit in RAM. With the default AOF policy (`appendfsync everysec`) a crash can lose about one second of writes, and `always` is much slower; replication is asynchronous, so failover can lose acknowledged writes. No ad-hoc queries or joins. Acceptable for ephemeral or rebuildable data (sessions with a fallback login, rate-limit counters, leaderboards rebuilt from the database, presence) when you accept that durability model.

## Graph databases (Neo4j, Neptune, Memgraph; Apache AGE)

**Postgres first** for trees, org charts, category hierarchies, bills of materials, and friend-of-friend at 1–3 hops: an adjacency list with indexes plus `WITH RECURSIVE`, or `ltree` for paths. Cost grows with depth and fan-out.

**A graph database** when traversal depth is unbounded or variable and the graph *is* the product (fraud rings, multi-hop recommendations, network topology, knowledge graphs), and you want built-in algorithms (shortest path, PageRank, community detection) and a traversal language (Cypher/GQL). Apache AGE adds Cypher to Postgres, but deep traversals still compile to joins.

## Time series

| Need | Default | Switch to |
|---|---|---|
| App metrics/events next to business data, SQL joins with business tables | Postgres range partitioning (`pg_partman`) + BRIN indexes | TimescaleDB (hypertables, compression, continuous aggregates, retention) |
| Infrastructure/observability metrics | Prometheus-compatible stack (Prometheus, VictoriaMetrics, Mimir, managed) | — never the app database |
| High-cardinality events and logs, analytics over billions of rows | ClickHouse (self-hosted or managed) | — |
| IoT on the InfluxDB ecosystem | InfluxDB 3 | Mind the open-source edition's limits below |

Licenses (as of 2026-09): Timescale renamed itself Tiger Data in 2025. The TimescaleDB core is Apache 2.0, but compression, continuous aggregates, and hyperfunctions are under the Timescale License, which forbids offering them as a competing database service — so many third-party managed Postgres services ship only the Apache subset. InfluxDB 3 Core is permissively licensed but deliberately limited: at default settings a single query cannot span more than about 72 hours of data; Enterprise lifts it.

## Analytics / OLAP

Never on the OLTP primary: analytical scans evict the transactional working set, long transactions block vacuum, and reports compete for CPU and I/O with users.

1. **Read replica + SQL** for internal dashboards; set `statement_timeout`; replica lag is fine for reporting.
2. **DuckDB** (MIT, in-process, reads Parquet/CSV/Postgres) for ETL scripts, notebooks, per-customer analytics. MotherDuck's Jordan Tigani ("Big Data is Dead", a vendor author) argues most organizations' queried working set fits on one machine.
3. **ClickHouse** (Apache 2.0; self-hosted or managed, e.g., ClickHouse Cloud, Tinybird) for user-facing, sub-second aggregations over billions of rows and high ingest. Weak at updates/deletes (mutations); sharded clusters are real operations work.
4. **Warehouse** (BigQuery, Snowflake, Databricks SQL, Redshift) for many teams, governance, BI tools, separation of storage and compute. Latency in seconds and cost unpredictability make them a poor fit for interactive, user-facing queries.
5. **Lakehouse** (Parquet + Iceberg/Delta on object storage, several engines) for large organizations avoiding lock-in to one warehouse.

Move data with CDC (Debezium, Sequin, Fivetran/Airbyte, cloud zero-ETL) or batch ELT with dbt. Notion built a data lake (Kafka + Debezium CDC → S3 → Spark) when analytics on Postgres could not keep up.

## Managed, self-hosted, serverless

- **Default: managed** (RDS/Aurora, Cloud SQL/AlloyDB, Azure Flexible Server, Supabase, Neon, PlanetScale, Crunchy Bridge). Self-host only with DBA capacity, a cost case at scale, or residency/regulation requirements.
- **Self-hosting on Kubernetes:** a mature operator (CloudNativePG, Crunchy PGO, Zalando) or Patroni, and a failover you have actually tested.
- **Serverless Postgres and branching:** Neon separates storage and compute, scales to zero, and branches the database per PR (Databricks acquired Neon in 2025). Supabase is Postgres plus auth, storage, realtime, and functions — a strong MVP platform whose exit is still `pg_dump`. Watch cold starts after scale-to-zero, connection limits (use their poolers), and egress pricing.
- **Exit test:** can you `pg_dump` or logically replicate out? Do you depend on vendor-only extensions or license-restricted features?

## Consistency and multi-region

- **CAP** is about behavior *during* a network partition: refuse some requests (consistency) or serve possibly stale data (availability). **PACELC** (Abadi, 2012) adds the everyday trade-off: *else*, latency versus consistency — synchronous replication and consensus cost latency on every write.
- State staleness per feature and choose the read path accordingly (primary, replica, cache).
- **Multi-region ladder:** single region, multi-AZ → cross-region read replicas + a tested failover runbook (RPO seconds, RTO minutes) → multi-region writes only via (a) partitioning users or tenants by home region (residency often forces this anyway), (b) conflict-tolerant models (last-writer-wins, CRDTs), or (c) distributed SQL with consensus latency per write.

## Sources

- Choose Boring Technology (McKinley) — https://mcfunley.com/choose-boring-technology
- postgres_for_everything — https://github.com/Olshansk/postgres_for_everything
- PostgreSQL 18 release — https://www.postgresql.org/about/news/postgresql-18-released-3142/ ; 19 beta — https://www.postgresql.org/about/news/postgresql-19-beta-4-released-3386/
- OpenAI, Scaling PostgreSQL — https://openai.com/index/scaling-postgresql/
- Figma — https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/
- Notion sharding — https://www.notion.com/blog/sharding-postgres-at-notion ; data lake — https://www.notion.com/blog/building-and-scaling-notions-data-lake
- Stack Overflow architecture 2016 — https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/
- PlanetScale on Postgres MVCC — https://planetscale.com/blog/postgresql-mvcc
- Uber — https://www.uber.com/us/en/blog/postgres-to-mysql-migration/ ; Winand — https://use-the-index-luke.com/blog/2016-07-29/on-ubers-choice-of-databases ; Haas — http://rhaas.blogspot.com/2016/08/ubers-move-away-from-postgresql.html ; Pettus — https://thebuild.com/presentations/uber-perconalive-2017.pdf
- Slack Vitess — https://slack.engineering/scaling-datastores-at-slack-with-vitess/ ; GitHub MySQL 8 — https://github.blog/2023-12-07-upgrading-github-com-to-mysql-8-0/
- Rails 8 Solid stack — https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required
- Litestream — https://github.com/benbjohnson/litestream ; LiteFS — https://github.com/superfly/litefs ; Turso — https://github.com/tursodatabase/turso
- André Arko, Rails on SQLite — https://andre.arko.net/2025/09/11/rails-on-sqlite-exciting-new-ways-to-cause-outages/
- MongoDB transactions — https://www.mongodb.com/resources/products/capabilities/mongodb-multi-document-acid-transactions ; Jepsen MongoDB 4.2.6 — https://jepsen.io/analyses/mongodb-4.2.6
- DynamoDB single-table (DeBrie) — https://www.alexdebrie.com/posts/dynamodb-single-table/ ; price cut — https://www.amazonaws.cn/en/new/2024/amazon-dynamodb-reduces-prices-for-on-demand-throughput-and-global-tables/
- Discord — https://discord.com/blog/how-discord-stores-trillions-of-messages
- Cassandra 5.0 SAI — https://cassandra.apache.org/_/blog/Apache-Cassandra-5.0-Features-Storage-Attached-Indexes.html ; ScyllaDB license — https://www.scylladb.com/2024/12/18/why-were-moving-to-a-source-available-license/
- CockroachDB license — https://siliconangle.com/2024/08/15/cockroach-labs-changes-self-hosting-license-single-enterprise-model/ ; Oxide RFD 508 — https://rfd.shared.oxide.computer/rfd/0508
- Aurora DSQL GA — https://aws.amazon.com/about-aws/whats-new/2025/05/amazon-aurora-dsql-generally-available/ ; compatibility — https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-migration-guide.html
- Redis persistence — https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
- Timescale licenses — https://www.tigerdata.com/legal/licenses ; InfluxDB 3 Core — https://www.influxdata.com/blog/influxdb3-open-source-public-alpha/
- Big Data is Dead (vendor author) — https://motherduck.com/blog/big-data-is-dead/
- Neon acquisition — https://techcrunch.com/2025/05/14/databricks-to-buy-open-source-database-startup-neon-for-1b/
