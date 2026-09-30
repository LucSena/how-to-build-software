# Jobs and Scheduling

How scheduled jobs, background workers, and long-running workflows are run and operated. Choosing the queue or database technology belongs to `data-infrastructure`; saga and outbox design to `scalability`. This file covers the operational side: scheduling, workers, durability, and monitoring.

## Contents
1. The at-least-once assumption
2. Cron pitfalls and rules
3. A safe Kubernetes CronJob
4. Queue workers
5. Durable execution
6. Queue vs durable execution vs data orchestrator
7. Deploys and long-running work
8. Monitoring
9. Rules catalog

## 1. The at-least-once assumption

Schedulers, queues, and workflow engines all deliver **at least once** under failure. The Kubernetes CronJob docs note that occasionally two jobs — or none — are created for one scheduled time, and ask that jobs be idempotent. Design every job so a second run with the same input is harmless: upserts, dedupe tables keyed by job or message ID, idempotency keys passed to payment and email providers, and state machines that ignore already-applied transitions.

## 2. Cron pitfalls and rules

| Pitfall | Rule | Source |
|---|---|---|
| Overlap: a slow run is still going when the next fires | `concurrencyPolicy: Forbid` (Kubernetes default is `Allow`), a distributed lock (database advisory lock, lock with TTL), or a unique job key per schedule slot | Kubernetes CronJob docs |
| Duplicates: every app replica runs its in-process cron | One scheduler (leader election or an external scheduler); the scheduler only enqueues | Kubernetes docs (idempotency) |
| Missed runs while the controller or app was down | Decide the catch-up policy; `startingDeadlineSeconds`; process "everything since the last successful watermark", not "the last hour". Kubernetes stops scheduling a CronJob after more than 100 missed schedules | Kubernetes CronJob docs |
| Time zones and DST | Explicit `.spec.timeZone` (e.g., `Etc/UTC`); `TZ`/`CRON_TZ` inside the schedule string is not supported there. Schedule in UTC unless business-local time matters; local-time jobs at 02:30 run twice or not at all on DST transition days | Kubernetes CronJob docs |
| Silent failure | Dead-man's-switch: alert when a job has not **succeeded** by its deadline; record last-success timestamp | Healthchecks/Cronitor pattern |
| Thundering herd at :00 | Use odd minutes and jitter; GitHub Actions `schedule` is delayed at the top of the hour and may drop queued runs | GitHub Actions docs |
| Deploys kill long jobs | Chunk and checkpoint; handle SIGTERM; resume from the watermark | — |
| Hidden cron on one server | Schedules live in code or IaC, visible and owned | — |

## 3. A safe Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata: { name: nightly-billing }
spec:
  schedule: "17 2 * * *"              # off the top of the hour
  timeZone: "Etc/UTC"                 # explicit zone
  concurrencyPolicy: Forbid           # default is Allow → overlapping runs
  startingDeadlineSeconds: 600        # skip if it cannot start within 10 min; the watermark catches up next run
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  jobTemplate:
    spec:
      backoffLimit: 2
      activeDeadlineSeconds: 3600
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: job
              image: registry.example.com/app@sha256:<digest>   # same release as the web app
              args: ["node", "dist/jobs/billing.js"]            # idempotent; processes since last watermark
              resources:
                requests: { cpu: 250m, memory: 512Mi }
                limits:   { memory: 512Mi }
```

Better still for most apps: the CronJob (or platform scheduler, or the queue library's built-in cron) only **enqueues** a job; workers do the work with retries, backoff, and a dead-letter queue.

## 4. Queue workers

Operational rules (queue choice is in `data-infrastructure`):
- **Payload:** IDs plus a schema version, never large blobs or stale snapshots.
- **Idempotency:** a key per job; dedupe on consume; pass idempotency keys to external side effects.
- **Retries:** bounded attempts, exponential backoff with jitter, then a **dead-letter queue** with alerting and a replay tool. Poison messages must not block the queue.
- **Leases:** visibility timeout or lease longer than the maximum processing time; heartbeats for long jobs.
- **Isolation:** separate queues by latency class (critical vs bulk); per-queue concurrency limits protect downstream services; uniqueness keys debounce "sync user X" storms.
- **Transactional enqueue:** with a Postgres-backed queue (e.g., Solid Queue, pg-boss, Graphile Worker, River, Oban), enqueue in the same transaction as the business write; otherwise use an outbox.
- **Redis-backed queues** (BullMQ, Sidekiq, Celery with Redis): configure persistence and a no-eviction memory policy for the queue instance, and check the library's acknowledgment defaults so a crash mid-task does not lose work.
- **Shutdown:** on SIGTERM stop fetching, finish or release in-flight jobs within the grace period.
- **Scale:** scale workers on queue age or depth, not CPU.

## 5. Durable execution

Definition: you write the workflow as ordinary code; the engine persists each step's result (an event history or journal), and after a crash or deploy it **replays** the workflow code with the recorded results so execution resumes where it stopped.

- **Temporal:** workflow code must be **deterministic** — no direct clock, randomness, or I/O; use the SDK's APIs. Side effects live in **activities**, which run at least once and therefore must be idempotent; timeouts and retries are configured per activity; changing workflow code with executions in flight needs versioning or patching.
- **Inngest:** durable functions built from `step.run` steps, each retried individually; functions can wait for long periods; flow control per key (concurrency, throttling, debouncing, rate limits, priority).
- **Restate:** journaled durable execution with durable promises and timers and service-to-service calls.
- Others: AWS Step Functions, Azure Durable Functions, Cloudflare Workflows, DBOS (a Postgres-backed library).

Rules:
- Every external side effect is idempotent (idempotency keys to payment APIs); compensations are idempotent and retryable too.
- Workflow IDs derive from business keys (one workflow per `order_id`) so duplicate starts dedupe.
- Keep large payloads out of workflow history; store references.
- Plan code versioning for workflows that run for days or weeks.

## 6. Queue vs durable execution vs data orchestrator

| Need | Use |
|---|---|
| Fire-and-forget single task (send email, resize image, call webhook) | Job queue |
| Periodic task | Scheduler that enqueues a job |
| Multi-step business process with compensations (reserve stock → charge → ship; refund on failure) — a saga | Durable execution, or a hand-rolled state-machine table plus outbox if it is small |
| Waiting hours to weeks for humans or external events (approvals, KYC, trial expiry) | Durable execution (durable timers and signals) |
| Fan-out/fan-in with aggregation | Durable execution, or queue plus a counter table |
| AI agent loop with tool calls that must survive restarts | Durable execution |
| Data pipelines, ETL with backfills and partitions | Data orchestrator (e.g., Airflow, Dagster) |

Default: start with the queue your database already provides. Adopt a durable-execution engine when you find yourself writing a state machine, a timer table, and a retry scheduler by hand — it is a new piece of infrastructure with its own operational cost.

## 7. Deploys and long-running work

- Jobs run the **same release** (image digest and config) as the web app; the migration step completes before new workers start.
- Job and message schemas are N−1 compatible: workers from the new release must process jobs enqueued by the old one, and during a rolling deploy vice versa.
- Long jobs are chunked and checkpointed so SIGTERM costs one chunk, not the whole run.
- Recreate-style deploys for singleton consumers that must never overlap; everything else rolls.

## 8. Monitoring

- Queue depth **and** age of the oldest job (alert on age); processing latency; failure and retry rates; DLQ size.
- Last successful run per scheduled job, with a dead-man's-switch alert.
- Workflow engines: stuck or long-running executions, activity failure rates, and history size.
- Trace context propagated from the enqueuing request into the job.

## 9. Rules catalog

### Enqueue from the scheduler, work in the worker
**Rule.** Schedulers only enqueue; workers do the work with retries and a dead-letter queue.
**Apply when.** Any periodic task beyond a trivial cleanup.
**Do / Avoid.** Do a CronJob or platform schedule that enqueues `billing.run(date)` with a unique key. Avoid a 40-minute billing loop inside the scheduler process.
**Why.** Queues give retries, visibility, concurrency control, and deploy-safe draining; schedulers give none of that.

### Process since the watermark
**Rule.** A scheduled job processes everything since its last successful run, recorded durably.
**Apply when.** Any job over a time window (billing, digests, syncs, cleanups).
**Do / Avoid.** Do `WHERE updated_at > last_success_at`. Avoid "the last 24 hours".
**Why.** Missed, delayed, or duplicated runs then self-heal instead of skipping or double-processing data.

### Alert on missing success, not on failure alone
**Rule.** Every scheduled job has a deadline by which a success must be recorded; alert when it is missed.
**Apply when.** Every production scheduled job.
**Do / Avoid.** Do a heartbeat ping on success to a dead-man's-switch monitor. Avoid alerting only on logged errors.
**Why.** The worst job failures are silent: the scheduler did not fire, the pod never started, or the job hung.

## Sources

- Kubernetes CronJob docs — https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/
- GitHub Actions, events that trigger workflows (schedule delays) — https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- Temporal docs: understanding Temporal, workflow execution — https://docs.temporal.io/evaluate/understanding-temporal , https://docs.temporal.io/workflow-execution
- Inngest — https://github.com/inngest/inngest
- Restate — https://github.com/restatedev/restate
- Solid Queue — https://github.com/rails/solid_queue ; pg-boss — https://timgit.github.io/pg-boss ; Graphile Worker — https://worker.graphile.org/docs
- Microsoft Code-With Engineering Playbook — https://github.com/microsoft/code-with-engineering-playbook
