# Licenses, vendors, benchmarks, and exit plans

License, governance, and ownership decide whether you can keep running a data component on your terms. This file holds the dated timeline of changes an agent must know about, a checklist for evaluating a vendor, rules for reading benchmarks, and how to plan an exit. **Everything here is as of 2026-09**; licenses, owners, and prices change — re-check the project's LICENSE file and pricing page before recommending, and state the date in any recommendation.

## Why it matters

- A relicense can turn a free self-hosted dependency into a paid one, forbid offering it as a service, or trigger a legal review of copyleft terms.
- An acquisition can change pricing, roadmap, or support for a managed service you depend on.
- An abandoned project stops shipping security fixes.
- Oxide's RFD 508 ("Whither CockroachDB?") is a worked example: a license change forced a team to re-evaluate a core database it had already built on.

## Timeline of changes (2021–2026)

| When | What changed | Practical reading |
|---|---|---|
| 2021-01 | Elastic moved Elasticsearch and Kibana from Apache 2.0 to SSPL / Elastic License | Triggered the OpenSearch fork (from 7.10) |
| 2024-03 | Redis Ltd. relicensed Redis from BSD-3 to RSALv2 / SSPLv1 starting with 7.4 (neither OSI-approved) | Self-hosted Redis 7.4+ is not open source under those terms |
| 2024-03/04 | The Linux Foundation launched **Valkey**, a BSD-3 fork of Redis 7.2.4, backed by AWS, Google Cloud, Oracle, and others | Default choice for a BSD-licensed, foundation-governed Redis-compatible store |
| 2024-08 | Cockroach Labs announced retiring CockroachDB Core; from v24.3 (November 2024) a single Enterprise license, free below $10M annual revenue | Self-hosting costs money above the threshold; check terms before adopting |
| 2024-08 | Elasticsearch added **AGPLv3** as a license option | Open source again, with copyleft; OpenSearch remains Apache 2.0 |
| 2024-09 | OpenSearch moved to the **OpenSearch Software Foundation** under the Linux Foundation | Foundation governance |
| 2024-09 | Confluent acquired **WarpStream** (object-storage-based Kafka-compatible service) | Diskless Kafka joins a large vendor |
| 2024-12 | **ScyllaDB** moved to a source-available license; 6.2 (AGPL) was the last open-source release | Free tier for smaller deployments; Apache Cassandra stays Apache 2.0 |
| 2025-03 | Apache Kafka 4.0 removed ZooKeeper; KRaft only | Upgrade path matters for old clusters |
| 2025-05 | **Redis 8** added **AGPLv3** as a third option (with RSALv2 / SSPLv1) and folded JSON, search, time series, and probabilistic modules into the core | OSI-open again, but copyleft; some corporate policies reject AGPL |
| 2025-05 | CNCF and Synadia settled the NATS dispute: trademarks to the Linux Foundation, project stays in CNCF under Apache 2.0 | NATS remains foundation-governed |
| 2025-05 | Databricks announced acquiring **Neon** (serverless Postgres) | Neon now powers Databricks' Lakebase; still Postgres, so `pg_dump` exit remains |
| 2025-05 | **MinIO** removed the admin console from its Community Edition | First step of the community edition's wind-down |
| 2025-06 | Timescale renamed itself **Tiger Data** | TimescaleDB's advanced features stay under the Timescale License (no competing DBaaS) |
| 2025-05 | Amazon **Aurora DSQL** GA (Postgres-compatible, multi-region active-active) | Compatibility gaps; check the current list |
| 2025-10 | MinIO stopped publishing community binaries and container images | Self-hosters left without official builds |
| 2025-12 | MinIO repository moved to maintenance mode; Amazon **S3 Vectors** GA | — |
| 2025-12 → 2026-03 | **IBM** announced (December) and completed (March) its acquisition of **Confluent** | Kafka's main commercial vendor is now part of IBM |
| 2026-01 | OpenAI published how ChatGPT runs on one unsharded Postgres primary with ~50 replicas | Evidence for the Postgres default at huge read scale |
| 2026-02 | MinIO community repository marked no longer maintained / archived | **Do not recommend self-hosted MinIO**; use Garage, SeaweedFS, Ceph RGW, or a managed S3-compatible service |

## License quick reference (self-hosting view, as of 2026-09)

| Component | License / governance | Note |
|---|---|---|
| PostgreSQL | PostgreSQL License (permissive), community-governed | Safest base |
| Valkey | BSD-3, Linux Foundation | — |
| Redis 8 | AGPLv3 / RSALv2 / SSPLv1, Redis Ltd. | Choose the AGPL option knowingly |
| Memcached | Permissive | — |
| Dragonfly | BSL 1.1 | Cannot offer as a managed service |
| OpenSearch | Apache 2.0, Linux Foundation | — |
| Elasticsearch | AGPLv3 / SSPL / Elastic License, Elastic | — |
| Meilisearch | MIT (Community Edition) | Enterprise features separate |
| Typesense | GPL-3.0 | — |
| Apache Kafka, Apache Cassandra | Apache 2.0, ASF | — |
| NATS | Apache 2.0, CNCF | — |
| ClickHouse | Apache 2.0 | — |
| DuckDB | MIT | — |
| ScyllaDB | Source-available (since 2025.1) | Free tier with limits |
| CockroachDB | Enterprise license; free below revenue threshold | Paid above |
| TimescaleDB | Apache 2.0 core + Timescale License for advanced features | Third-party hosts often ship only the Apache subset |
| InfluxDB 3 Core | Permissive, deliberately limited (single query spans about 72 hours of data at defaults) | Enterprise lifts the limit |
| MinIO | Community edition archived (2026-02) | No security fixes |

For MongoDB, Neo4j, Redpanda, and vector databases, read the current LICENSE file; this file does not re-verify them.

## Vendor evaluation checklist

- [ ] License is OSI-approved, or you have read the source-available terms and they fit how you will deploy (self-hosted, managed, embedded in a product you sell).
- [ ] Governance: foundation (ASF, Linux Foundation, CNCF) or single vendor? Single-vendor projects relicense more often.
- [ ] Ownership: recent acquisitions or funding trouble? Who would you call for support?
- [ ] Activity: releases and security fixes in the last few months; open issue response.
- [ ] Protocol: speaks an open protocol (Postgres wire, S3 API, Redis protocol, Kafka API, SQL) so a second vendor exists.
- [ ] Data export: documented, bulk, in an open format (SQL dump, Parquet, JSON lines).
- [ ] Pricing modeled at 1×, 10×, 100× including egress, replicas, backups, support tier, and minimums; price history (did it rise sharply before?).
- [ ] Managed-service limits: max connections, extensions available, version lag behind upstream, cold starts, regions.
- [ ] Local development: runs in a container or emulator for tests.

## Reading benchmarks

- **ClickBench's own limitations** (from its README): one flat table of about 100M rows (not a star schema), mostly single-node results, queries run one after another with no concurrency and no capacity test, few runs per query; it allows but does not encourage scoreboards, and its summary is "All Benchmarks Are Liars".
- Ask of any benchmark: Is there concurrency? Is the dataset larger than RAM, like production will be? Were all systems tuned equally? Are caches warm or cold? Is the query mix like yours? Who published it?
- Vendor-published comparisons (a Postgres extension vs Pinecone, one OLAP engine vs another) are hypotheses until you reproduce them.
- Prefer reproducible, workload-shaped suites: ClickBench for flat-table OLAP, TPC-H/TPC-DS for warehouses, ann-benchmarks-style methodology for vectors, and **Jepsen** analyses for correctness claims of distributed databases.
- Best evidence: a benchmark on your own data shape and query mix at realistic concurrency, run for long enough to include vacuum, compaction, and GC.

## Planning the exit

Write the exit into the decision record before adopting:
- **Protocol compatibility**: which other products speak the same protocol (Postgres wire, S3, Redis protocol, Kafka API)? Note gaps ("PG-compatible" systems miss extensions; Valkey matches the Redis 7.2 feature set).
- **Wrap proprietary APIs** (SQS, Pub/Sub, Algolia, Momento, a vector DB SDK) behind a small interface in your code so the call sites do not spread.
- **Avoid restricted features** you would lose on another host (TimescaleDB's licensed features, vendor-only extensions) unless you accept the lock-in explicitly.
- **Egress**: moving large data out costs money; 37signals' cloud exit involved a large egress bill (which AWS waived) — egress fees are a lock-in mechanism.
- **Derived stores are the easiest to leave**: caches, search indexes, and vector indexes can be rebuilt from the source of truth if you kept the rebuild job working.

## Sources

- Oxide RFD 508 — https://rfd.shared.oxide.computer/rfd/0508
- Redis AGPL and history — https://lwn.net/Articles/1019686/ , https://securityboulevard.com/2025/05/redis-returns-to-open-source-with-agplv3-license-key-insights/
- Valkey — https://github.com/valkey-io/valkey , https://www.linuxfoundation.org/press/valkey-8-0
- CockroachDB license — https://siliconangle.com/2024/08/15/cockroach-labs-changes-its-self-hosting-license-single-enterprise-model/
- Elasticsearch AGPL — https://simonwillison.net/2024/Aug/29/elasticsearch-is-open-source-again/ ; OpenSearch — https://en.wikipedia.org/wiki/OpenSearch_(software)
- ScyllaDB license — https://www.scylladb.com/2024/12/18/why-were-moving-to-a-source-available-license/
- Kafka 4.0 — https://blog.2minutestreaming.com/p/apache-kafka-4-0-release
- NATS — https://www.cncf.io/blog/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project-2/ , https://www.theregister.com/2025/05/02/cncf_synadia_nats/
- Neon/Databricks — https://techcrunch.com/2025/05/14/databricks-to-buy-open-source-database-startup-neon-for-1b/
- Tiger Data licenses — https://www.tigerdata.com/legal/licenses ; InfluxDB 3 Core — https://www.influxdata.com/blog/influxdb3-open-source-public-alpha/
- Aurora DSQL GA — https://aws.amazon.com/about-aws/whats-new/2025/05/amazon-aurora-dsql-generally-available/
- MinIO — https://blocksandfiles.com/2025/06/19/minio-removes-management-features-from-basic-community-edition-object-storage-code/ , https://github.com/minio/minio/issues/21714 , https://blog.vonng.com/en/db/minio-is-dead/
- S3 Vectors GA — https://aws-news.com/article/2025-12-02-amazon-s3-vectors-now-generally-available-with-increased-scale-and-performance
- IBM/Confluent — https://www.cnbc.com/2025/12/08/ibm-confluent-deal-data.html , https://finance.yahoo.com/news/ibm-completes-11bn-confluent-acquisition-101728540.html ; WarpStream — https://www.confluent.io/press-release/confluent-acquires-warpstream-to-advance-next-gen-byoc-data-streaming/
- OpenAI — https://openai.com/index/scaling-postgresql/
- Dragonfly license — https://www.dragonflydb.io/docs/about/license
- Typesense / Meilisearch — https://typesense.org/docs/guide/system-requirements.html , https://www.meilisearch.com/docs/learn/engine/storage
- ClickBench — https://github.com/ClickHouse/ClickBench
- Jepsen analyses — https://jepsen.io/analyses
