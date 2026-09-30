# Case studies: data-infrastructure choices in the real world

Sixteen compact cases, each as *what happened → why → the rule it teaches*. Use them to justify a default or to argue against an unneeded component. Full design narratives (migration phases, rollout) for several of these live in `system-design`'s case studies. Figures are as reported by the companies themselves.

## Contents

1. OpenAI — one Postgres primary at ChatGPT scale
2. Notion — sharding Postgres by workspace
3. Figma — vertical partitioning before sharding
4. Instagram — logical shards and time-ordered IDs
5. Uber — Postgres to MySQL, and the rebuttals
6. Discord — MongoDB → Cassandra → ScyllaDB
7. Slack — Vitess for sharded MySQL
8. GitHub — a year-long MySQL upgrade
9. Stack Overflow — few servers, scaled up
10. 37signals — DB-backed queue and cache instead of Redis
11. Amazon Prime Video — the hand-off store was the cost
12. Recall.ai — `LISTEN/NOTIFY` under load
13. Segment — exactly-once is built, not bought
14. Gunnar Morling — Postgres is not Kafka
15. Oxide — a license change forces a re-evaluation
16. MinIO — an open-source dependency abandoned

## 1. OpenAI — one Postgres primary at ChatGPT scale (2026)
**What.** ChatGPT's core Postgres runs on a single unsharded Azure Database for PostgreSQL primary with nearly 50 read replicas across regions. OpenAI minimizes primary load, pushes reads to replicas, pools with PgBouncer, avoids unnecessary writes, and moved shardable, write-heavy workloads to Azure Cosmos DB; new workloads default to sharded systems.
**Why.** Reads scale out on replicas; writes on one primary do not, and MVCC write amplification makes write-heavy churn the first thing to leave.
**Rule.** Replicas, pooling, and write reduction come before sharding; move the *write-heavy* workload, not the whole database.
Source: https://openai.com/index/scaling-postgresql/

## 2. Notion — sharding Postgres by workspace (2021)
**What.** Application-level sharding into 480 logical shards on 32 physical databases, keyed by workspace ID. 480 was chosen because it divides evenly many ways, allowing rebalancing without rehashing. Later, analytics moved off Postgres into a data lake fed by Kafka + Debezium CDC.
**Why.** Queries almost never cross workspaces, so the shard key matched the access pattern.
**Rule.** Shard on the key your queries never cross; move analytics out via CDC rather than running them on OLTP.
Sources: https://www.notion.com/blog/sharding-postgres-at-notion , https://www.notion.com/blog/building-and-scaling-notions-data-lake

## 3. Figma — vertical partitioning before sharding (2020–2024)
**What.** Postgres grew about 100× in four years. Figma first moved groups of tables to their own databases (vertical partitioning), then sharded horizontally behind an in-house proxy that parses SQL and routes queries, using logical sharding (views) before physical moves. Horizontal sharding took about nine months.
**Why.** The cheap split bought years of runway; the expensive one was needed only for the largest tables.
**Rule.** Split by table group first; treat horizontal sharding as a multi-quarter one-way door.
Source: https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/

## 4. Instagram — logical shards and time-ordered IDs (2012)
**What.** Thousands of logical shards (Postgres schemas) mapped to fewer physical servers; IDs generated inside Postgres from timestamp + shard ID + sequence.
**Why.** Logical shards move between machines without re-splitting data; time-ordered IDs keep indexes append-friendly and sortable.
**Rule.** If you must shard, create many logical shards up front and make IDs carry order and location.
Source: https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c

## 5. Uber — Postgres to MySQL, and the rebuttals (2016)
**What.** Uber moved its Schemaless storage layer from Postgres to MySQL, citing write amplification, replication volume, replica MVCC problems, and hard upgrades. Markus Winand, Robert Haas, and Christophe Pettus replied that the pain came from an update-heavy key-value workload on indexed columns, that HOT updates mitigate many cases, and that MySQL's design has its own costs.
**Why.** The workload, not the engine's general quality, decided the outcome.
**Rule.** Choose by your workload's write pattern; do not generalize one company's migration into "X does not scale".
Sources: https://www.uber.com/us/en/blog/postgres-to-mysql-migration/ , https://use-the-index-luke.com/blog/2016-07-29/on-ubers-choice-of-databases , http://rhaas.blogspot.com/2016/08/ubers-move-away-from-postgresql.html

## 6. Discord — MongoDB → Cassandra → ScyllaDB (2017–2022)
**What.** Messages moved to Cassandra in 2017. By 2022, 177 Cassandra nodes suffered hot partitions, GC pauses, and compaction backlogs. Discord moved to ScyllaDB on 72 nodes, added a Rust data-services layer that coalesces concurrent reads of the same hot data, and migrated trillions of messages in about nine days.
**Why.** At that write volume, wide-column storage fit; the hot-partition pain came from data modeling and traffic shape as much as from the engine.
**Rule.** Wide-column stores are for massive, key-partitioned write volume; protect any store from hot keys with request coalescing.
Source: https://discord.com/blog/how-discord-stores-trillions-of-messages

## 7. Slack — Vitess for sharded MySQL (2017–2020)
**What.** Slack migrated to Vitess from 2017; by December 2020 it served 99% of query load, peaking at 2.3M QPS.
**Why.** A proven sharding layer for MySQL beat maintaining their own application-level sharding.
**Rule.** When you must shard, prefer an established sharding layer (Vitess, Citus) or distributed SQL over a home-grown router.
Source: https://slack.engineering/scaling-datastores-at-slack-with-vitess/

## 8. GitHub — a year-long MySQL upgrade (2023)
**What.** 1,200+ MySQL hosts, 300+ TB, 5.5M QPS; upgrading from 5.7 to 8.0 took about a year of planning and staged rollout.
**Why.** Major-version upgrades of a large fleet carry replication, query-plan, and rollback risk.
**Rule.** Put major upgrades in the cost of every stateful system you add; each one is a recurring project.
Source: https://github.blog/2023-12-07-upgrading-github-com-to-mysql-8-0/

## 9. Stack Overflow — few servers, scaled up (2016)
**What.** A top-50 website served from 4 SQL Server machines (two clusters), 11 web servers, 2 Redis servers, and 3 Elasticsearch servers.
**Why.** Big machines, careful queries, and heavy caching carried the load without a distributed architecture; search ran as a sidecar.
**Rule.** Scale up and cache before scaling out; a search engine beside the database is normal, a dozen data stores is not.
Source: https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/

## 10. 37signals — DB-backed queue and cache instead of Redis (2024)
**What.** Rails 8 shipped Solid Queue, Solid Cache, and Solid Cable as database-backed replacements for Redis. 37signals reported Solid Queue running 20M jobs/day for HEY and Solid Cache holding 10 TB with 60-day retention at Basecamp, roughly halving P95 render times.
**Why.** Disk is cheaper than RAM, so a larger, longer-lived cache beat a smaller in-memory one; one fewer system to operate.
**Rule.** A database-backed queue or cache is a legitimate production default, not a toy.
Source: https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required

## 11. Amazon Prime Video — the hand-off store was the cost (2023)
**What.** One team's audio/video monitoring service, built from Step Functions and Lambda stages exchanging frames through S3, hit a hard scaling limit at about 5% of expected load. Moving all stages into one process, passing data in memory, cut infrastructure cost by more than 90%.
**Why.** Step Functions charged per state transition (several per second of stream) and every frame went through S3 calls.
**Rule.** Do not put a queue, workflow engine, or object store between steps that could share memory; every hop through a data service is paid for per call.
Sources: https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90 , https://www.thestack.technology/amazon-prime-video-microservices-monolith/

## 12. Recall.ai — `LISTEN/NOTIFY` under load (2025)
**What.** With tens of thousands of concurrent writers, `NOTIFY` inside transactions serialized commits through a global lock taken at commit time.
**Why.** Postgres preserves notification order by locking at commit.
**Rule.** Use `NOTIFY` as a wake-up hint; poll as the correctness path; measure under your concurrency (DBOS published a counterpoint with its own measurements).
Sources: https://www.recall.ai/blog/postgres-listen-notify-does-not-scale , https://www.dbos.dev/blog/postgres-listen-notify-scalability

## 13. Segment — exactly-once is built, not bought
**What.** Segment built a deduplication layer (Kafka + RocksDB keyed by message ID) to get effectively-once delivery of events.
**Why.** Every broker delivers at least once somewhere; duplicates come from producer retries and consumer crashes.
**Rule.** Never promise "exactly-once" end to end from a product feature; design idempotent consumers and dedupe by ID.
Source: https://segment.com/blog/exactly-once-delivery/

## 14. Gunnar Morling — Postgres is not Kafka (counterpoint essay)
**What.** A response to "you don't need Kafka, just use Postgres": Postgres queues give competing consumers, not independent consumer groups with offsets and replay, and for data exchange across many teams Postgres is "a definitive no-go, for architectural reasons rather than performance".
**Why.** Semantics (replay, fan-out to independent readers, cross-team contracts) differ from job processing.
**Rule.** Pick by semantics: job queue → Postgres; replayable, multi-consumer, cross-team event log → Kafka-class system.
Source: https://www.morling.dev/blog/you-dont-need-kafka-just-use-postgres-considered-harmful/

## 15. Oxide — a license change forces a re-evaluation (RFD 508)
**What.** After CockroachDB retired its free Core edition (2024), Oxide wrote an RFD, "Whither CockroachDB?", re-examining a database already built into its product.
**Why.** A single-vendor license change altered the cost and terms of a core dependency after adoption.
**Rule.** Check license and governance at adoption *and* at every major upgrade; prefer foundation-governed cores for things you self-host.
Source: https://rfd.shared.oxide.computer/rfd/0508

## 16. MinIO — an open-source dependency abandoned (2025–2026)
**What.** MinIO stripped the admin console from its community edition (May 2025), stopped publishing community binaries and images (October 2025), put the repository in maintenance mode (December 2025), and archived it (February 2026).
**Why.** A single-vendor open-source project shifted to a commercial product.
**Rule.** Keep an exit for every self-hosted component (an open protocol with other implementations); do not recommend MinIO for new self-hosted object storage.
Sources: https://github.com/minio/minio/issues/21714 , https://blog.vonng.com/en/db/minio-is-dead/

## Further reading (essays behind the defaults)
- Dan McKinley, "Choose Boring Technology" (2015): a limited budget of innovation tokens; boring technology has known failure modes. https://mcfunley.com/choose-boring-technology
- "Just use Postgres for everything" and the curated extension list. https://www.amazingcto.com/postgres-for-everything/ , https://github.com/Olshansk/postgres_for_everything

## Sources

All URLs are listed under each case above; in addition:
- Charity Majors on boring-technology culture — https://charity.wtf/2023/05/01/choose-boring-technology-culture/
