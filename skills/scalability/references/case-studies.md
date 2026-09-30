# Scaling Case Studies

Nine published cases about scaling data and throughput, each mapped to the step of the scaling ladder it illustrates. Compact format: what happened, the numbers the source reports, the lesson, the rule. Use them to justify a step with precedent — and to notice how long each company stayed on the cheap steps before reaching the expensive ones.

Architecture-style cases (Segment, Prime Video, Shopify's modular monolith) are in `software-architecture` → `references/case-studies.md`; migration method and design-doc cases are in `system-design` → `references/case-studies.md`.

## Contents
- Summary table
- 1 Discord — partition keys and a data-access layer
- 2 Figma — exhausting cheap levers, then sharding Postgres
- 3 Notion — many logical shards on few machines
- 4 Instagram and Twitter — time-ordered 64-bit IDs
- 5 Pinterest — boring sharded MySQL
- 6 Slack — re-sharding online with Vitess
- 7 GitHub — boundaries in CI before moving data
- 8 Dropbox — building storage when storage is the product
- 9 LinkedIn — the log as the integration backbone
- Rules these cases support

## Summary table

| Case | Ladder step illustrated | Key number | Lesson |
|---|---|---|---|
| Discord | Partitioning / data-access layer | p99 read 40–125 ms → 15 ms | Bound partitions; coalesce hot reads |
| Figma | Scale up → replicas → vertical partitioning → sharding | ~100× growth in 4 years | Exhaust cheap levers; logical before physical |
| Notion | Sharding | 480 logical / 32 physical | Over-provision logical shards |
| Instagram / Twitter | Sharding enablers | 64-bit time-ordered IDs | IDs that sort by time and route by shard |
| Pinterest | Sharding | Shard ID inside a 64-bit ID | Simple key lookups on a boring store |
| Slack | Sharding with middleware | 2.3M QPS peak, p99 11 ms | Tenant-per-shard breaks for whales |
| GitHub | Vertical partitioning | 50% load reduction | Lint boundaries before moving data |
| Dropbox | Custom storage | ~500 PB moved off S3 | Build only when storage is the product |
| LinkedIn | Async / streams | — | One durable log instead of N × M pipelines |

## 1. Discord — partition keys and a data-access layer (2015–2023)
- **What happened.** A single MongoDB replica set stopped fitting data and indexes in RAM around 100M messages (late 2015). Cassandra followed and grew from 12 nodes (2017) to 177 (2022), with unpredictable latency, expensive compaction, JVM garbage-collection pauses, and **hot partitions** when many users read one busy channel. Discord added **Rust data services** between the API and the database that coalesce concurrent requests for the same data into one query, then migrated to ScyllaDB.
- **Numbers.** 177 Cassandra nodes → 72 ScyllaDB nodes; p99 read latency 40–125 ms → 15 ms; p99 insert 5–70 ms → 5 ms; trillions of messages migrated in about nine days.
- **Lesson.** Partition key design (`channel_id` + time bucket) bounds partition growth; request coalescing removes hot-read amplification; the access layer made the database swap possible.
- **Rule.** *Bound partitions with a time bucket, coalesce identical concurrent reads, and put a data-access layer in front of any store you may replace.*
- **Source.** https://discord.com/blog/how-discord-stores-trillions-of-messages

## 2. Figma — exhausting cheap levers, then sharding Postgres (2020–2024)
- **What happened.** Starting in 2020 on a single Postgres instance on AWS's largest instance type, Figma added read replicas and connection pooling, then **vertically partitioned** related table groups into separate databases. By late 2022 the biggest tables were several TB with billions of rows, vacuum caused reliability incidents, and I/O limits were close. Horizontal sharding came next: table groups sharing a shard key ("colos") so joins and transactions still work within one key, **logical sharding** before physical moves, and **DBProxy**, a Go service that parses SQL and routes it.
- **Numbers.** Database load grew ~100× in four years; each vertical-partition move cost about 30 seconds of partial unavailability; roughly nine months to shard the first tables (first shipped September 2023).
- **Lesson.** Years of runway came from cheap steps; sharding was a multi-quarter project done only when necessary, with risk reduced by separating logical routing from data movement.
- **Rule.** *Climb every cheaper rung first; when you shard, co-locate related tables on one key and route logically before moving data physically.*
- **Sources.** https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/ · https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/

## 3. Notion — many logical shards on few machines (2021)
- **What happened.** Notion sharded its block data at the application level into **480 logical shards** (Postgres schemas) on **32 physical databases** (15 each), keyed by workspace so a workspace's blocks stay together. 480 divides evenly by many fleet sizes, so capacity can grow by moving whole logical shards without re-hashing. Migration used double-writes, backfill, and **dark reads** comparing results before switching. Analytics later moved to a data lake fed by change data capture.
- **Numbers.** Blocks grew from ~20B rows (early 2021) to 200B+ (2024).
- **Lesson.** Pick the logical shard count once, generously, and choose the tenant as the key when tenants are independent.
- **Rule.** *Pre-split into many logical shards mapped to few machines; shard by tenant; verify with dark reads; move analytics off the OLTP primary.*
- **The payoff (2023, "The Great Re-shard").** Ahead of a new-year traffic spike, CPU and IOPS on the 32 hosts crossed their thresholds. Because data already lived in 15 schemas per host, Notion tripled the fleet to **96 smaller hosts** (5 schemas each) without changing the routing key: Postgres logical replication copied each group of 5 schemas (index builds were deferred until the copy finished, which was much faster). The surprise was connections: about 100 PgBouncer instances × 6 connections = 600 per shard, which would have tripled on the old shards during cutover. So they first sharded PgBouncer into 4 groups of 24 databases. Before failover they ran sampled **dark reads** (queries returning ≤ 5 rows, after a 1-second wait for replication) and saw near-100% equality. Per shard: pause traffic in PgBouncer, confirm replication caught up, repoint, revoke app access to the old host, and **reverse the replication stream** so rollback stayed possible. Users saw at most about a second of "saving".
- **Rule from the re-shard.** *Plan the connection-pool topology as part of any shard split, defer index builds during bulk copy, and keep reverse replication running until you are sure.*
- **Sources.** https://www.notion.com/blog/sharding-postgres-at-notion · https://www.notion.com/blog/the-great-re-shard · https://www.notion.com/blog/building-and-scaling-notions-data-lake

## 4. Instagram and Twitter — time-ordered 64-bit IDs
- **Twitter Snowflake (2010).** 64 bits: sign bit + 41 bits of milliseconds since a custom epoch + 10 bits of machine ID + 12 bits of sequence (4,096 IDs per millisecond per worker). Uncoordinated, roughly time-ordered. Discord uses Snowflakes for all IDs.
- **Instagram (2012).** Many logical shards (Postgres schemas) on fewer servers; IDs generated inside each shard in PL/pgSQL: 41 bits of milliseconds + 13 bits of logical shard ID + 10 bits of sequence.
- **Lesson.** Time-ordered IDs sort by creation (often replacing a `created_at` index) and insert at the end of B-trees; shard bits make routing a bit shift; no central ID service to fail.
- **Rule.** *When sharding, use 64-bit time-ordered IDs that encode or map to the shard; otherwise prefer database identity or UUIDv7 (see `data-modeling`).*
- **Sources.** https://en.wikipedia.org/wiki/Snowflake_ID · https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c

## 5. Pinterest — boring sharded MySQL (2012–2015)
- **What happened.** Pinterest sharded MySQL with a 64-bit ID of `(shard_id << 46) | (type_id << 36) | local_id` (16/10/36 bits). Objects (pins, boards, users) are stored as JSON in MySQL tables keyed by local ID; relationships live in mapping tables; there are no cross-shard joins; a fixed set of virtual shards maps onto physical hosts.
- **Lesson.** Simple key lookups and application-side joins on a well-understood database scaled a very large site; the deterministic ID-to-shard mapping made moves routine.
- **Rule.** *Prefer a sharded, well-understood relational store with key-based access and deterministic shard mapping over unfamiliar clustering technology.*
- **Source.** https://medium.com/pinterest-engineering/sharding-pinterest-how-we-scaled-our-mysql-fleet-3f341e96ca6f

## 6. Slack — re-sharding online with Vitess (2017–2020)
- **What happened.** Slack originally sharded MySQL by workspace. Very large enterprise workspaces and features spanning workspaces strained that model. Over about three years Slack moved to Vitess, which lets tables be sharded by different keys and hot shards be split online.
- **Numbers (late 2020).** Vitess served 99% of queries; peak 2.3M QPS (2M reads, 300K writes); median 2 ms, p99 11 ms; in March 2020 query rates rose 50% in one week and hot shards were split online.
- **Lesson.** The tenant is a good shard key until one tenant is huge or tenants share data.
- **Rule.** *Plan for whale tenants and cross-tenant features before choosing tenant sharding; use a layer that supports online re-sharding and per-table keys.*
- **Source.** https://slack.engineering/scaling-datastores-at-slack-with-vitess/

## 7. GitHub — boundaries in CI before moving data (2019–2021)
- **What happened.** GitHub grouped tables into **schema domains**, added **virtual partitions** in the application, and ran two **SQL linters** in CI that flag queries and transactions crossing domains. Once the code respected the boundaries, domains moved off the main MySQL cluster, some onto Vitess.
- **Numbers.** 50% load reduction on the hosts that held the former main-cluster data.
- **Lesson.** Vertical partitioning is a code problem first and a data move second.
- **Rule.** *Make cross-domain joins and transactions fail in CI before splitting a database.*
- **Source.** https://github.blog/2021-09-27-partitioning-githubs-relational-databases-scale/

## 8. Dropbox — building storage when storage is the product (2015–2016)
- **What happened.** Dropbox built Magic Pocket, its own exabyte-scale blob store, and began serving user files from it in February 2015, moving about 90% of user data (~500 PB) off S3 within about two and a half years, across multiple regions.
- **Lesson.** Custom storage paid off because storage is Dropbox's core product and cost at that scale dominated; an abstraction over storage backends made the move incremental.
- **Rule.** *Build your own storage only when it is the product and the scale is enormous; otherwise use managed object storage behind an interface you control.*
- **Sources.** https://dropbox.tech/infrastructure/magic-pocket-infrastructure · https://www.infoq.com/articles/dropbox-magic-pocket-exabyte-storage/

## 9. LinkedIn — the log as the integration backbone (2010–2013)
- **What happened.** Pairwise pipelines between databases, search, Hadoop, and monitoring multiplied. LinkedIn built Kafka and made an ordered, append-only log the central integration point; systems subscribe to the changes they need and derived data can be rebuilt by replaying it.
- **Lesson.** A shared log replaces N × M integrations and makes new consumers cheap.
- **Rule.** *When many systems need the same changes, publish once to a durable log (via outbox or CDC); do not add a log for one producer and one consumer.*
- **Source.** https://web.archive.org/web/20240105095933/https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying

## Rules these cases support

1. Stay on cheap rungs as long as they work; each company above spent years there first (Figma, Notion).
2. Bound partitions and plan for the biggest key or tenant, not the average (Discord, Slack).
3. Put an access layer or proxy in front of the store before changing it (Discord, Figma, Slack, GitHub).
4. Route logically before moving data physically; enforce the boundary in CI (Figma, GitHub).
5. Fix a large logical shard count and encode routing in IDs (Notion, Instagram, Pinterest).
6. Verify data moves by comparison before switching (Notion).
7. Build custom infrastructure only when it is the product (Dropbox).
8. Use a log when many consumers need the same stream (LinkedIn).

## Sources

- Discord: https://discord.com/blog/how-discord-stores-trillions-of-messages
- Figma: https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/ ; https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/
- Notion: https://www.notion.com/blog/sharding-postgres-at-notion ; https://www.notion.com/blog/the-great-re-shard ; https://www.notion.com/blog/building-and-scaling-notions-data-lake
- Snowflake ID: https://en.wikipedia.org/wiki/Snowflake_ID
- Instagram: https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c
- Pinterest: https://medium.com/pinterest-engineering/sharding-pinterest-how-we-scaled-our-mysql-fleet-3f341e96ca6f
- Slack: https://slack.engineering/scaling-datastores-at-slack-with-vitess/
- GitHub: https://github.blog/2021-09-27-partitioning-githubs-relational-databases-scale/
- Dropbox: https://dropbox.tech/infrastructure/magic-pocket-infrastructure ; https://www.infoq.com/articles/dropbox-magic-pocket-exabyte-storage/
- LinkedIn (Jay Kreps, "The Log"): https://web.archive.org/web/20240105095933/https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying
- ByteByteGo system-design-101 case summaries: https://github.com/ByteByteGoHq/system-design-101
