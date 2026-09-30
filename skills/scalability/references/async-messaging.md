# Async Work, Queues, and Messaging

Move work out of the request when the user does not need its result to continue. Pick the simplest queue that meets the requirement, then design for duplicates, failures, and visibility from the first job.

## Contents
1. When to go async
2. Choosing the mechanism
3. Postgres-backed queues
4. Job and consumer design
5. Retries and dead letters
6. Ordering
7. Operating queues
8. Rules catalog

## 1. When to go async

Move work to the background when it is:
- Slower than ~100–500 ms and not needed for the response (emails, webhooks out, PDF/image processing, exports, LLM batch work, search indexing).
- Spiky: a queue absorbs bursts so workers process at a steady rate (load leveling).
- Talking to a flaky dependency that needs retries over minutes or hours.
- Fan-out: one event, many independent reactions.

The API then returns `202 Accepted` with a status resource, or the UI shows a "processing" state and updates via polling, SSE, or a webhook.

## 2. Choosing the mechanism

| Option | Examples | Choose when | Watch out for |
|---|---|---|---|
| **Postgres-backed queue** | pg-boss, River, Graphile Worker, Solid Queue, Oban, PGMQ | **Default** when on Postgres: transactional enqueue with the business write, no new system; comfortable for most small–medium workloads | Very high job rates add vacuum and table churn; keep job tables lean |
| Redis-based | BullMQ, Sidekiq, Celery + Redis, RQ | Redis already operated; high job throughput; rich scheduling features | Durability depends on Redis persistence config; enqueue is not transactional with the DB (use an outbox) |
| Managed queue | SQS, Cloud Tasks, Google Pub/Sub, Azure Service Bus | Serverless or cloud-native; no ops | Vendor limits (message size, visibility timeout, FIFO throughput) |
| Log / stream | Kafka, Redpanda, Kinesis, NATS JetStream | Many independent consumer groups, replay, per-key ordering, very high throughput, event streaming | Significant operational and schema-governance cost; partitions cap consumer parallelism |
| Durable execution | Temporal, Restate, DBOS, Inngest, AWS Step Functions, Cloudflare Workflows | Multi-step, long-running processes; sagas; timers; human-in-the-loop; agent runs that must resume after crashes | New programming model (deterministic workflow code); another platform to run or buy |

Queue vs log in one line: a queue hands each message to one worker and forgets it; a log keeps messages for a retention period so many consumer groups can read and replay independently.

## 3. Postgres-backed queues

The core is `FOR UPDATE SKIP LOCKED`, which lets many workers claim different rows without blocking each other:

```sql
-- claim up to 10 jobs
WITH next AS (
  SELECT id FROM jobs
  WHERE queue = 'emails' AND status = 'pending' AND run_at <= now()
  ORDER BY run_at
  LIMIT 10
  FOR UPDATE SKIP LOCKED
)
UPDATE jobs j
SET status = 'running', locked_at = now(), attempts = attempts + 1
FROM next WHERE j.id = next.id
RETURNING j.*;
```

- Partial index: `CREATE INDEX ON jobs (queue, run_at) WHERE status = 'pending'`.
- Enqueue in the **same transaction** as the business write → no dual-write problem.
- Reclaim stuck jobs whose `locked_at` is older than the lease.
- Delete or archive finished jobs promptly (or partition by time) to keep the table small.
- Prefer a maintained library over hand-rolling; they handle leases, retries, scheduling, and cleanup.

## 4. Job and consumer design

- **Idempotent**: at-least-once delivery means every job may run twice. Dedupe by job or message ID in the same transaction as the effect, or make the effect naturally idempotent (upsert, set-to-value, check external state first). Pass an idempotency key to downstream APIs (payments, email providers).
- **Payload = IDs + schema version**, not large blobs or snapshots. The job loads current state when it runs (the snapshot may be stale by then). Large data goes to object storage with a reference.
- **Lease / visibility timeout > maximum processing time**; long jobs heartbeat or checkpoint.
- **Bounded work per job**: split big jobs into chunks (per 1k rows, per tenant) so retries are cheap and progress is visible.
- **Timeouts** on every external call inside the job.
- **Trace context** (`traceparent`) in message headers so traces continue across the queue.
- **Graceful shutdown**: on SIGTERM stop fetching, finish or release in-flight jobs within the grace period.
- **Priorities**: separate queues (and worker pools) for latency-sensitive vs bulk work, so a 100k-row export cannot delay password-reset emails.

## 5. Retries and dead letters

- Retry transient failures with capped exponential backoff and jitter; honor `Retry-After` from downstream.
- Cap attempts (e.g., 5–10 for jobs; hours-to-days schedules for webhook delivery).
- After the cap, move to a **dead-letter queue** (or `status = 'dead'`), alert, and provide a replay tool.
- Distinguish permanent errors (validation, 4xx other than 408/429) — do not retry them; dead-letter immediately with the reason.
- Poison messages must never block the rest of the queue.

## 6. Ordering

- Most work does not need ordering; design handlers to tolerate reordering (compare versions, ignore stale updates).
- When needed, scope ordering to a key: Kafka partition key, SQS FIFO message group ID, or a per-entity lock in a Postgres queue.
- Global ordering serializes everything and caps throughput at one consumer.
- With retries, "ordered" often becomes "ordered except after failures" — decide whether a failed message blocks its key (strict) or is skipped to the DLQ (available).

## 7. Operating queues

| Signal | Why |
|---|---|
| **Age of oldest message** | Best single health signal — users feel delay, not depth |
| Depth / lag per queue or consumer group | Capacity trend |
| Processing latency and error rate per job type | Regression detection |
| Retry and DLQ counts | Downstream trouble, poison messages |
| Worker utilization | Sizing (Little's law: in-flight = arrival rate × processing time) |

Alert on age crossing the user-facing promise (e.g., "emails within 2 minutes") and on DLQ growth. Autoscale workers on age or lag, with a max that protects the database.

## 8. Rules catalog

### Enqueue in the same transaction as the write
**Rule.** Insert the job (or outbox row) in the same database transaction as the business change.
**Apply when.** A state change must trigger background work.
**Do / Avoid.** Do: create order + insert `send_confirmation` job, then commit. Avoid: commit the order, then call `queue.add()` — a crash between them loses the job.
**Why.** Two systems cannot commit atomically; one transaction removes the dual-write gap.

### Alert on age, not depth
**Rule.** Page on the age of the oldest unprocessed message relative to the promised delay.
**Apply when.** Setting up monitoring for any queue.
**Do / Avoid.** Do: alert when the oldest `emails` job is older than 2 minutes. Avoid: alerting at "depth > 1,000", which is normal during a burst and silent during a stuck consumer with low traffic.
**Why.** Age measures user impact directly; depth measures load.

### Separate latency-sensitive and bulk work
**Rule.** Give critical jobs their own queue and worker pool.
**Apply when.** Mixed job types share workers.
**Do / Avoid.** Do: `critical` (auth emails, payments) and `bulk` (exports, reindexing) queues. Avoid: one FIFO where a bulk import delays password resets by an hour.
**Why.** Bulkheads: isolating capacity keeps one workload from starving another.

### Carry IDs, load state at run time
**Rule.** Job payloads contain identifiers and a version, not snapshots of entities.
**Apply when.** Designing any job or message payload.
**Do / Avoid.** Do: `{ "invoiceId": "inv_1", "v": 1 }`. Avoid: embedding the full invoice as it was at enqueue time.
**Why.** Jobs may run minutes later or be retried; snapshots act on stale data and bloat the queue.

## Sources

- You don't need a job queue — Postgres has SKIP LOCKED (Prisma): https://www.prisma.io/blog/you-dont-need-a-job-queue-postgres-already-has-skip-locked
- Kafka vs Postgres (Conduktor): https://www.conduktor.io/glossary/kafka-vs-postgres
- PostgreSQL `SELECT … FOR UPDATE SKIP LOCKED`: https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE
- AWS SQS visibility timeout and DLQs: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html
- Durable execution engines: https://www.kai-waehner.de/blog/2025/06/05/the-rise-of-the-durable-execution-engine-temporal-restate-in-an-event-driven-architecture-apache-kafka/ ; https://www.dbos.dev/blog/postgres-is-all-you-need-for-durable-execution
- ByteByteGo, system-design-101 (message queues): https://github.com/ByteByteGoHq/system-design-101
