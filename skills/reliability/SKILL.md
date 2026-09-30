---
name: reliability
description: Use when a system must keep working when things go wrong — calling external services, APIs, databases, or LLMs; adding timeouts, retries with backoff and jitter, circuit breakers, bulkheads, fallbacks, or graceful degradation; health checks and graceful shutdown; observability with OpenTelemetry, structured logs, metrics, and traces; SLIs, SLOs, error budgets, and burn-rate alerts; safe deploys with feature flags, canaries, and rollbacks; zero-downtime database migrations (expand/contract); incident response, blameless postmortems, and backup/restore drills. Also use when the user says "this keeps breaking in production", "the service hangs when X is down", "add retries", "set up monitoring/alerts", "we had an outage", "how do we deploy safely?", or "rename this column without downtime". Not for capacity, caching, queues, or data scaling (use scalability), or for the HTTP contract of errors and idempotency keys (use api-design).
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "scalability software-architecture api-design testing-strategy"
---

# Reliability

Complex systems always run partly broken; failure is a question of when, not if. This skill makes failures bounded (nothing waits forever or retries forever), contained (one bad dependency cannot take everything down), visible (you learn from users' symptoms before users tell you), and reversible (every change can be rolled back or switched off quickly). The outcome it protects: users can rely on the critical journeys, and the team can ship often without fear.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Assume every dependency will be slow or down.** Bound every wait with a timeout and decide in advance what the user sees when it fails.
2. **Retry rarely, carefully, and in one layer.** Retries of non-idempotent work corrupt data; retries in several layers multiply load during the exact moment a dependency is struggling.
3. **Contain the blast radius.** Bulkheads, circuit breakers, and degraded modes keep one failure from becoming a total outage.
4. **Measure what users feel, alert on symptoms.** SLOs on user journeys and burn-rate alerts beat CPU alerts; every page needs an action.
5. **Make every change small, observable, and reversible.** Change is the main source of new failure; flags, canaries, and expand/contract migrations turn big bets into small ones.
6. **Fix the system, not the person.** Incidents have several contributing factors; blame hides them.
7. **Practice failure.** Untested backups, runbooks, and failovers are latent faults waiting to line up.

## Workflow

- [ ] **Map the critical path**: the 3–5 user journeys that matter (sign in, checkout, core action) and every dependency they touch (DB, cache, queues, third-party APIs, LLMs). Gate: each dependency is listed with its owner and failure impact.
- [ ] **Harden each outbound call** with the checklist below (timeout, retry policy, idempotency, breaker/bulkhead, fallback, telemetry). Gate: no call without a timeout.
- [ ] **Define degraded modes** per journey with the product owner: what still works when each dependency is down.
- [ ] **Instrument**: OpenTelemetry traces, RED metrics per endpoint and dependency, structured logs with trace IDs.
- [ ] **Set SLOs and alerts** for the critical journeys; multi-window burn-rate paging; runbook link on every alert.
- [ ] **Plan the rollout** of the change: flag, canary stages, rollback trigger, migration order.
- [ ] **Validate** against Gotchas; for incidents, write the postmortem with the template in `references/safe-change.md`.

## How complex systems fail — as rules

Richard Cook's 18 observations, condensed into the rules that change what you build (full mapping in `references/complex-systems.md`):

- **Failure is normal; the system always runs partly broken.** Build explicit degraded modes and show them honestly.
- **Catastrophe needs several faults lining up.** Hunt latent ones: untested backups, unmonitored queues, expiring certificates, stale runbooks.
- **Defenses are layered — keep every layer.** Never disable tests, alerts, validation, rate limits, or timeouts to "make it work".
- **Change introduces new forms of failure.** Small diffs, flags, canaries, reversible migrations — especially for large AI-generated changes.
- **There is no single root cause, and hindsight is biased.** Postmortems list contributing factors and what people knew at the time.
- **Fix systems, not people.** Guardrails and safer defaults beat "be more careful" rules.
- **People create safety through adaptation.** Give operators observability, kill switches, dry runs, and written policies ("rollback first").
- **Reliability needs experience with failure.** Game days and restore drills.

## Outbound-call checklist

Apply to every HTTP, gRPC, database, cache, queue, and LLM call:

- [ ] Connect timeout and overall request timeout; deadline propagated from the caller.
- [ ] Retry policy: which errors, max attempts, capped exponential backoff with full jitter, honors `Retry-After`, only one layer retries, retry budget.
- [ ] Idempotency: operation is naturally idempotent or carries an idempotency key.
- [ ] Circuit breaker and/or bulkhead if the dependency is on a critical path.
- [ ] Fallback defined (cached/stale data, default, degraded feature, queue for later, clear error).
- [ ] Latency histogram, error-rate metric, and a trace span.
- [ ] Response validated as untrusted input (schema, size).

## Defaults at a glance

| Setting | Default | Adjust when |
|---|---|---|
| Request timeout | Slightly above dependency p99, capped by remaining caller budget | Optional calls: much shorter, then omit the feature |
| Retry attempts | 2–3 user-facing, 3–5 background | Webhook delivery: hours-to-days schedule |
| Backoff | Full jitter, base 100–200 ms, cap 10–30 s | Server sends `Retry-After` → honor it |
| Retry budget | ~10% of requests | — |
| Circuit breaker | Open at ≥ 50% failures over ≥ 20 calls; 30 s cooldown | Tune from observed error patterns |
| Shutdown drain | 10–30 s | Long jobs: checkpoint and release |
| Canary | 1% → 5% → 25% → 100% with SLO gates | Low traffic: longer bake times |
| SLO window | Rolling 28–30 days | — |

## Timeouts

- **Every network call has a timeout.** Many client defaults wait forever: Python `requests` has no default timeout; `fetch` in Node and browsers has none (use `AbortSignal.timeout(ms)`). Set DB `statement_timeout` and pool acquire timeouts too.
- **Derive from data**: slightly above the dependency's observed p99 (or p99.9 for critical calls), and never longer than the remaining caller budget.
- **Budget propagation**: a request arriving with 2 s left must not start a 5 s downstream call. Pass the deadline (gRPC deadlines, context cancellation, a deadline header) and compute each hop's timeout as `min(own timeout, remaining budget − safety margin)`. Stop work when the caller has gone.
- **Outer > inner**: the caller's timeout must exceed the callee's timeout plus its retries, or the caller gives up while the work continues (and then retries it).

## Retries

- **Retry only transient failures**: connection errors, timeouts, 408, 429, 502, 503, 504; 500 only for idempotent operations known to fail transiently. Never retry validation, auth, or other 4xx errors.
- **Retry only idempotent operations** — GET, PUT, DELETE, or POST with an idempotency key.
- **Capped exponential backoff with full jitter**: `sleep = random(0, min(cap, base × 2^attempt))`. Defaults: base 100–200 ms, cap 10–30 s, 3–5 attempts for background work, 2–3 for user-facing calls. Honor `Retry-After` when present.
- **One layer retries.** Three layers × three attempts = up to 27× load on a struggling dependency. Retry at the layer closest to the failure that knows whether the operation is safe to repeat.
- **Retry budgets**: cap retries at roughly 10% of requests per client (or a token-bucket retry quota, as AWS SDKs do) so retries cannot become a storm.
- **Hedged requests** (a second request after the p95 latency) only for idempotent reads, within a budget.

## Circuit breakers, bulkheads, fallbacks

- **Circuit breaker**: closed → open when the failure rate crosses a threshold (e.g., ≥ 50% over at least 20 calls in a 10–60 s window) → fail fast with a fallback → half-open after a cooldown (e.g., 30 s) with a few probe calls → closed on success. Use a library or the service mesh (resilience4j, Polly, opossum/cockatiel, pybreaker, Envoy outlier detection); do not hand-roll.
- **Bulkheads**: separate connection pools, worker pools, queues, or concurrency limits per dependency, tenant tier, or priority, so one slow dependency cannot absorb every thread or connection.
- **Graceful degradation** — decide with product, per feature: serve stale cache; hide non-critical widgets (recommendations); read-only mode; accept and queue writes; disable expensive features by kill switch. The UI states the degraded mode honestly.
- **Load shedding and back-pressure** (reject early with 429/503 + `Retry-After`, bounded queues) — see `scalability`.

## Health checks and shutdown

- **Liveness**: "the process is not wedged." Never check dependencies — a DB outage would restart every instance and make things worse.
- **Readiness**: "I can serve traffic now." May check critical local prerequisites (pool initialized, migrations applied); fail it during shutdown.
- **Startup probe** for slow-starting apps so liveness does not kill them mid-boot.
- **Graceful shutdown on SIGTERM**: fail readiness → stop accepting new work → drain in-flight requests and jobs (10–30 s) → close pools → exit. Make the orchestrator's grace period longer than the drain.

## Observability

- **OpenTelemetry** as the vendor-neutral standard: OTel SDK + auto-instrumentation + OTLP export; W3C Trace Context (`traceparent`) propagated over HTTP and in message headers across queues.
- **Structured logs** (JSON): `timestamp`, `level`, `message`, `trace_id`, `span_id`, request ID, tenant ID, pseudonymous user ID, error type and stack. Log once at the boundary where the error is handled. **Never log secrets, tokens, passwords, full card numbers, or raw personal data**; escape user input (log injection).
- **Metrics**: RED per endpoint and dependency (Rate, Errors, Duration); USE per resource (Utilization, Saturation, Errors). Latency as **histograms**, reported as p50/p95/p99 — never averages alone. Keep label cardinality bounded: no user IDs, raw URLs, or request IDs as labels.
- **Traces**: a span per external call (DB, HTTP, queue, cache, LLM) with attributes, not payloads; sample head-based at a low rate plus tail-based retention of errors and slow traces where available.

Setup details: `references/observability-slos.md`.

## SLOs and alerting

- **SLI** = good events ÷ valid events, measured where users feel it (load balancer or client), e.g., "checkout requests that return non-5xx in < 800 ms".
- **SLO** = target over a rolling window (28–30 days), e.g., 99.9%. Choose the lowest target users will accept; each extra nine cuts allowed downtime tenfold and raises engineering cost steeply.
- **Error budget** = 1 − SLO (99.9% ≈ 43 minutes of full outage per 30 days). **Policy**: when the budget is spent, freeze risky launches and prioritize reliability work until it recovers.
- **Multi-window, multi-burn-rate alerts** (Google SRE Workbook, 30-day SLO):

| Severity | Burn rate | Long window | Short window | Budget consumed |
|---|---|---|---|---|
| Page | 14.4× | 1 h | 5 min | 2% |
| Page | 6× | 6 h | 30 min | 5% |
| Ticket | 1× | 3 d | 6 h | 10% |

Both windows must exceed the threshold (the short one confirms it is still happening). Alert on symptoms, not causes (not CPU); every page is actionable and links a runbook.

## Safe change

- **Decouple deploy from release**: ship code dark behind a flag, then release by flipping the flag.
- **Flag types**: release (short-lived, delete within weeks), experiment, ops/kill switch (long-lived), permission. Every flag has an owner and an expiry; safe default if the flag service is unreachable; security-relevant flags evaluated server-side; test both paths.
- **Progressive delivery**: canary 1% → 5% → 25% → 100% with automated comparison against SLOs and automatic rollback on regression; or blue/green for instant switch-back.
- **Rollback first, debug later.** If a deploy correlates with a symptom, revert before investigating.
- **Zero-downtime migrations — expand/contract**: old and new app versions run at the same time during every deploy, so every schema change must work with both. Add (nullable) → dual-write → backfill in batches → switch reads → enforce constraints → stop old writes → drop later. Never rename or drop something the running version uses. Postgres: `lock_timeout` on DDL, `CREATE INDEX CONCURRENTLY`, `NOT VALID` then `VALIDATE` for constraints. Lint migrations in CI.

Step-by-step recipes and flag/canary details: `references/safe-change.md`.

## Incidents, postmortems, backups

- **During an incident**: one incident commander; mitigate first (rollback, flag off, failover, shed load), then diagnose; one channel; timestamped notes; status updates to users at a fixed cadence.
- **Blameless postmortem** for every page-worthy incident: timeline, impact (users, duration, budget consumed), **contributing factors** (never a single root cause), what went well, action items with owners that change the system (guardrails, automation, alerts) rather than "be more careful".
- **Backups are only real once restored.** Define RPO/RTO per datastore; enable point-in-time recovery for primary databases; keep a copy in a separate account/region; automate a periodic restore into a scratch environment and check row counts and app boot; time it against the RTO.
- **Game days**: rehearse dependency outages, failovers, and restores in a controlled setting; untested recovery paths fail when needed.

## Gotchas

- **No timeout** on HTTP, DB, or LLM calls — the most common cause of cascading hangs. Add one on every call.
- **Retrying non-idempotent POSTs** (payments, orders, emails) without an idempotency key creates duplicates.
- **Retries at every layer** (SDK + service + gateway + client) amplify load 10–30× during an outage. Retry once, at one layer, with a budget.
- **Backoff without jitter** synchronizes clients into waves that hit the recovering service together.
- **Liveness probes that check the database** turn a DB blip into a fleet-wide restart loop.
- **Averages and CPU alerts.** Alert on SLO burn; show percentiles.
- **High-cardinality metric labels** (user ID, URL with IDs) explode cost and break the metrics backend.
- **Logging secrets or personal data** "temporarily" for debugging. They persist in log storage and backups.
- **Rename/drop in one deploy.** The old version, still running during rollout, crashes on the missing column.
- **Disabling safety mechanisms to make it work** (tests, alerts, rate limits, validation). Never; fix the cause or ask.
- **Big-bang releases.** One large diff with no flag and no canary is the riskiest change you can ship.
- **"Root cause: human error".** It ends learning; list contributing factors and systemic fixes.

## Output format

For a resilience review or plan:

```
Critical journeys: <3–5, with current SLI/SLO if any>
Dependencies: | Dependency | Timeout | Retry policy | Idempotency | Breaker/bulkhead | Fallback | Telemetry |
Gaps (Observed / Inferred / Not checked): <list, highest risk first>
Changes: <ordered, each with how it is verified>
SLOs & alerts: <SLI definition, target, burn-rate alerts, runbook link>
Rollout: <flag, canary stages, rollback trigger, migration steps>
```

For an incident: use the postmortem template in `references/safe-change.md`.

## References

| File | Read when |
|---|---|
| `references/resilience-patterns.md` | implementing timeouts, retries, breakers, bulkheads, fallbacks, or health checks in code |
| `references/observability-slos.md` | setting up OpenTelemetry, logs, metrics, tracing, SLIs/SLOs, or burn-rate alerts |
| `references/safe-change.md` | planning a deploy, feature flags, canary, a schema migration, an incident, a postmortem, or backup/restore drills |
| `references/complex-systems.md` | explaining why a failure happened, writing a postmortem, or reviewing operational design against Cook's 18 points |

## Related skills

- `scalability` — when the failure is overload: capacity, caching, queues, load shedding.
- `software-architecture` — when isolation needs a new boundary or service.
- `api-design` — for error payloads, `Retry-After`, and `Idempotency-Key` on your own API.
- `testing-strategy` — for contract tests, fault-injection tests, and migration tests.
