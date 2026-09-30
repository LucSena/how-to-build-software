# Queues, streams, and durable execution

Picking the messaging component by need, how far a Postgres queue goes, and when a broker, log, or workflow engine earns its place. Delivery semantics, idempotent consumers, outbox, and sagas are in `scalability`; running workers, cron, and graceful shutdown in production are in `deployment-and-infrastructure`. Dated facts are as of 2026-09.

## Name the need before the product

| Category | Semantics | Consumers | Retention | Examples |
|---|---|---|---|---|
| Job / task queue | One unit of work done once (at-least-once + idempotency), with retries, scheduling, priorities, uniqueness | Competing workers; each job goes to one | Until done (+ history) | Postgres queues (River, pg-boss, Graphile Worker, Solid Queue, Oban, pgmq), Sidekiq/BullMQ/Celery, SQS, Cloud Tasks |
| Broker (queue + routing) | Messages routed through exchanges/topics to queues; ack/nack; dead-letter exchanges | Competing consumers per queue; fan-out via bindings | Until acked | RabbitMQ, ActiveMQ/Artemis, Azure Service Bus, SNS+SQS |
| Log / stream | Append-only, partitioned, ordered per partition; consumers track offsets; **replay** | Many independent consumer groups, each reading everything | Time/size based, up to forever with tiered storage | Kafka, Redpanda, WarpStream, Kinesis, Pulsar, NATS JetStream, Redis Streams |
| Pub/sub | Publish once, deliver to all current subscribers | All subscribers | Ephemeral (core NATS, Redis Pub/Sub, `LISTEN/NOTIFY`) or durable per subscription (Google Pub/Sub, SNS→SQS) | |
| Durable execution | A multi-step function whose progress is checkpointed; resumes after crashes; timers, signals, compensation | Workflow workers | Workflow history | Temporal, Restate, Inngest, DBOS, Step Functions, Azure Durable Functions, Cloudflare Workflows |

A job queue retries the whole job; durable execution records each step and retries only the failed one, and keeps the run history. Architectures differ: DBOS is a library keeping its workflow log in your Postgres; Temporal replays workflow code against an event history held by a server cluster; Inngest calls your function per step over HTTP; Restate journals handlers in its own runtime (descriptions from the vendors' own comparisons).

## Default: a Postgres-backed job queue

**Why**
- **Transactional enqueue.** Insert the job in the same transaction as the business write. River's docs put it precisely: jobs are enqueued if the transaction commits, removed if it rolls back, and invisible to workers until commit. No dual-write gap, no separate outbox for jobs.
- One fewer stateful system to run, secure, back up, and monitor; jobs are queryable with SQL; backups include the queue.
- Mechanism: `SELECT … FOR UPDATE SKIP LOCKED` lets concurrent workers claim different rows without blocking (Postgres 9.5+, MySQL 8+, MariaDB 10.6+).

**Libraries (as of 2026-09)**
| Language | Library | Notes |
|---|---|---|
| Go | River | Transactional enqueue, unique jobs, periodic jobs, snoozing, web UI |
| Node.js | pg-boss | Enqueue inside an existing transaction (adapters for Drizzle, Knex, Kysely, Prisma), cron and RRULE scheduling, priorities, retries with exponential backoff, dead-letter queues with redrive, optional `LISTEN/NOTIFY` wake-ups; Postgres 13+ |
| Node.js | Graphile Worker | Low latency via `LISTEN/NOTIFY`. Its own performance statement reports under 5 ms from enqueue to execution and roughly 172k jobs/s queued or 196k jobs/s processed on a well-specced server (4 workers × concurrency 24), and says plainly it "is not intended to replace extremely high performance dedicated job queues for Facebook scale" |
| Ruby / Rails | Solid Queue (Rails 8 default), GoodJob | Solid Queue: delayed and recurring jobs, concurrency controls, pausing, priorities, bulk enqueue; MySQL, Postgres, or SQLite; can use a separate queue database. 37signals: 20M jobs/day for HEY |
| Elixir | Oban | Mature Postgres-backed queue |
| Python | Procrastinate, PgQueuer | Listed in postgres_for_everything |
| Any language (SQL) | pgmq | SQS-like API (send, read with visibility timeout, archive, delete), FIFO with message-group keys, topic routing; Postgres 14–18; SQL-only install possible |

**Limits — know them before you commit**
- **Dead tuples and vacuum.** Every claim and completion is an UPDATE or DELETE. A long-running transaction *anywhere in the database* holds back the vacuum horizon, so dead queue rows cannot be removed; the table and its indexes bloat and claim queries slow down, which lengthens transactions further. Set `idle_in_transaction_session_timeout`; alert on oldest transaction age and `n_dead_tup` of the queue table; partition or rotate queue tables at volume (PlanetScale, "Keeping a Postgres queue healthy"; Richard Yen, 2026).
- **`LISTEN/NOTIFY` under heavy concurrent writes.** A `NOTIFY` inside a transaction takes a global lock at commit to preserve ordering, effectively serializing commits; Recall.ai hit this with tens of thousands of concurrent writers (DBOS published counter-measurements). A fix has been discussed in Postgres core — check your version's release notes. Rule: `NOTIFY` is a wake-up hint; polling is the correctness path.
- **Competing consumers only.** One table serves one worker pool. There are no independent consumer groups with replay, and ordering is lost across concurrent workers (Gunnar Morling's counterpoint to "just use Postgres").
- **Shared fate.** Queue load competes with OLTP on the same primary. At volume, move the queue to its own database or instance.

**Graduate when** sustained throughput reaches thousands of jobs per second *and* vacuum cannot keep up, several independent consumers need the same events, data must flow between teams, or queue load measurably hurts OLTP latency.

## Managed cloud queues (SQS/SNS, Google Pub/Sub and Cloud Tasks, Azure Service Bus)

**When:** cloud-native or serverless apps, cross-service integration without running a broker, bursty load, function consumers.

**SQS facts (as of 2026-09)**
- Standard queues: very high throughput, at-least-once, best-effort ordering.
- FIFO queues: exactly-once *processing* within a 5-minute deduplication window, ordered per message group ID; default 300 API calls/s per action (3,000 messages/s with batches of 10); high-throughput mode up to 70,000 TPS without batching in the largest regions.
- Maximum payload raised from 256 KiB to 1 MiB in August 2025. Larger payloads go to S3 with a pointer in the message (claim check).
- Visibility timeout defaults to 30 s, maximum 12 h. Extend it with a heartbeat (`ChangeMessageVisibility`) for long jobs, or the message reappears and runs twice.
- Dead-letter queue via a redrive policy (`maxReceiveCount`), with redrive back to the source.
- Fan-out: SNS → SQS gives each subscriber its own durable queue; EventBridge routes and filters events across services.

Google Cloud Tasks is an HTTP-target task queue with rate limiting and scheduling; Azure Service Bus offers queues and topics with sessions (ordered groups), dead-lettering, and transactions.

**Costs:** API lock-in (wrap it behind a small interface), no transactional enqueue with your database (use an outbox), per-request pricing at very high volume, and emulators for local development.

## Redis-based job queues (Sidekiq, BullMQ, Celery, RQ)

- Mature, fast, large ecosystems.
- **Durability is configuration:** Redis must run with `maxmemory-policy noeviction` (eviction silently drops jobs) and AOF persistence. Basic Sidekiq fetch pops the job, so a crashed worker loses in-flight jobs; Sidekiq Pro's `super_fetch` keeps jobs until acknowledged. Completed-job retention can fill memory, and under `noeviction` Redis then rejects writes.
- **No transactional enqueue with your SQL database:** enqueue after commit (Rails `after_commit`) or use an outbox, or jobs run before their row is visible or vanish if the process dies between commit and enqueue.
- **Pick when** you already run Redis/Valkey, need very high job rates at low latency, and configure the durability caveats away — on an instance dedicated to the queue.

## RabbitMQ

- Strengths: flexible routing (direct, topic, fanout, headers exchanges), per-message acks, priorities, TTLs, dead-letter exchanges; AMQP 0-9-1 and 1.0, MQTT, STOMP; low-latency push delivery.
- RabbitMQ 4.0 (2024) removed classic mirrored queues: use **quorum queues** (Raft-replicated) for HA and **streams** for log-like replay.
- Operations: an Erlang cluster, queue-length alarms, memory and disk alarms (flow control), upgrades. Managed options: CloudAMQP, Amazon MQ.
- **Pick when** routing rules are complex, you need protocol interop (MQTT/AMQP), or you integrate polyglot services without a cloud lock-in. Not for long retention and replay at scale.

## Kafka and Kafka-compatible logs

**Genuinely right when**
- Many independent consumers need the same event stream, each with its own offset.
- **Replay** matters: reprocessing, backfilling a new service, rebuilding read models.
- High sustained throughput, per-key ordering, stream processing (Kafka Streams, Flink), CDC pipelines (Debezium).
- Data is exchanged across many teams or organizations. Conduktor's comparison calls Postgres "a definitive no-go" there, "for architectural reasons rather than performance". Gunnar Morling's argument is related but different: even at small scale you may need Kafka's log semantics (replay, retention, compaction), consumer groups, and automatic failover, and a Postgres queue under long-running consumer transactions can suffer MVCC bloat and WAL pile-up, so load-test it for hours, not minutes.

**Probably not needed when** one producer app feeds one consumer pool (that is a job queue), throughput is below a few thousand messages per second, nobody needs replay, and the team is small. Even managed Kafka costs engineering time: partitions, consumer-group rebalances, retention, schema registry, monitoring, upgrades. Aiven, itself a Kafka vendor, argues Kafka is overkill for most use cases.

**Kafka is not a job queue:** no per-message ack, retry, or dead-letter out of the box; a slow or poison message blocks its partition (head-of-line blocking); parallelism is capped by partition count. KIP-932 ("Queues for Kafka", share groups) shipped as early access in Kafka 4.0 — check its status in the current release before relying on it.

**Ecosystem (as of 2026-09)**
- Apache Kafka 4.0 (March 2025) removed ZooKeeper; KRaft is the only mode.
- IBM completed its acquisition of Confluent in March 2026. Confluent had acquired WarpStream (2024), a Kafka-compatible service whose brokers write straight to object storage.
- Other Kafka-API options: Redpanda (C++, single binary; source-available core — check the license), AutoMQ, Amazon MSK (including Serverless), Aiven, Azure Event Hubs' Kafka endpoint.
- Object-storage ("diskless") Kafka trades higher latency for no inter-zone replication cost; good for logging, observability, and data-lake feeds, not for latency-sensitive paths.

## NATS and JetStream

- Core NATS: lightweight, very low-latency pub/sub and request/reply, at-most-once. JetStream adds persistence, streams, acknowledged consumers, key-value and object stores.
- Good for edge/IoT, service request/reply, lightweight streaming where Kafka is too heavy.
- Governance: in 2025 Synadia moved to take NATS out of the CNCF; the dispute settled on 2025-05-01 with trademarks assigned to the Linux Foundation and the project staying in the CNCF under Apache 2.0.

## Durable execution

| Need | Use |
|---|---|
| Fire-and-forget single task | Job queue |
| Periodic task | Scheduler that only enqueues a job |
| Multi-step process with compensations (reserve → charge → ship; refund on failure) | Durable execution, or a state-machine table + outbox if small |
| Waiting hours to weeks for humans or external events (approvals, KYC, trial expiry) | Durable execution (durable timers and signals) |
| AI agent loops with tool calls that must resume after a crash | Durable execution |
| Data pipelines with lineage, partitions, backfills | A data orchestrator (Airflow, Dagster), not an app queue |

Defaults: DBOS (in your Postgres), Inngest, or Restate for small teams; Temporal for complex or polyglot workflows at scale (its workflow code must be deterministic, activities are at-least-once and must be idempotent, and changing code with in-flight workflows needs versioning); Step Functions when all-in on AWS. Derive workflow IDs from business keys (one workflow per `order_id`) and keep large payloads out of workflow history.

## Rules for every option

- At-least-once is the practical default; "exactly-once" exists only inside a boundary (Kafka transactions, SQS FIFO's dedup window, pgmq within a visibility timeout). End to end you get effectively-once = at-least-once + idempotent consumers. Segment built its own dedup layer to get there.
- Ordering only where required and scoped per key (partition key, message group, session).
- Retries with backoff and jitter, a cap, then a dead-letter queue with alerting and redrive; poison messages must not block the queue.
- Job timeout < visibility timeout; heartbeat long jobs.
- Alert on age of oldest message and DLQ size, not only depth.
- Publish events from database writes with a transactional outbox or CDC. With CDC, a stalled logical replication slot retains WAL until the primary's disk fills: set `max_slot_wal_keep_size` (Postgres 13+) and alert on slot lag.
- Version message schemas; include `event_id`, `type`, `occurred_at`, `schema_version`, and trace context.

## Sources

- Conduktor, "Kafka vs Postgres": https://www.conduktor.io/glossary/kafka-vs-postgres
- River — https://github.com/riverqueue/river ; transactional enqueueing — https://riverqueue.com/docs/transactional-enqueueing
- pg-boss — https://github.com/timgit/pg-boss ; Graphile Worker — https://github.com/graphile/worker ; performance statement: https://worker.graphile.org/docs/performance ; Solid Queue — https://github.com/rails/solid_queue ; pgmq — https://github.com/pgmq/pgmq
- postgres_for_everything — https://github.com/Olshansk/postgres_for_everything
- SKIP LOCKED explainer — https://www.2ndquadrant.com/en/blog/what-is-select-skip-locked-for-in-postgresql-9-5/
- Rails 8 (HEY 20M jobs/day) — https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required
- Postgres queue health — https://planetscale.com/blog/keeping-a-postgres-queue-healthy ; https://richyen.com/postgres/2026/05/04/postgres_job_queue.html
- LISTEN/NOTIFY — https://www.recall.ai/blog/postgres-listen-notify-does-not-scale ; counterpoint — https://www.dbos.dev/blog/postgres-listen-notify-scalability
- Morling, "You Don't Need Kafka, Just Use Postgres" Considered Harmful — https://www.morling.dev/blog/you-dont-need-kafka-just-use-postgres-considered-harmful/
- SQS FIFO quotas — https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-fifo.html ; high throughput — https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/enable-high-throughput-fifo.html ; 1 MiB payload — https://www.amazonaws.cn/en/new/2025/amazon-sqs-increases-maximum-message-payload-size-to-1mib/ ; visibility timeout — https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html
- Sidekiq reliability — https://github.com/sidekiq/sidekiq/wiki/Reliability
- RabbitMQ quorum queues in 4.0 — https://www.rabbitmq.com/blog/2024/08/28/quorum-queues-in-4.0
- Aiven, Kafka's 80% problem — https://aiven.io/blog/apache-kafkas-80-percent-problem ; "just use postgres" — https://blog.2minutestreaming.com/p/just-use-postgres
- Kafka 4.0 — https://blog.2minutestreaming.com/p/apache-kafka-4-0-release ; KIP-932 — https://www.confluent.io/blog/latest-apache-kafka-release/
- IBM/Confluent — https://www.cnbc.com/2025/12/08/ibm-confluent-deal-data.html , https://finance.yahoo.com/news/ibm-completes-11bn-confluent-acquisition-101728540.html ; WarpStream — https://www.confluent.io/press-release/confluent-acquires-warpstream-to-advance-next-gen-byoc-data-streaming/
- NATS governance — https://www.cncf.io/blog/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project-2/
- Durable execution comparisons (vendors) — https://www.inngest.com/blog/best-job-queue-alternatives , https://www.dbos.dev/blog/durable-execution-coding-comparison ; Temporal docs — https://docs.temporal.io
- Segment exactly-once — https://segment.com/blog/exactly-once-delivery/
- Debezium slot risk — https://streamkap.com/resources-and-guides/debezium-replication-slot-issues
