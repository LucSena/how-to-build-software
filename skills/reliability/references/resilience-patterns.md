# Resilience Patterns — Timeouts, Retries, Breakers, Bulkheads, Fallbacks, Health

Implementation-level guidance. Prefer a maintained library or the platform (service mesh, SDK retry modes) over hand-rolled logic; the snippets show the shape to verify, not code to copy blindly.

## Contents
1. Timeouts and deadline propagation
2. Retries with backoff and jitter
3. Retry budgets and hedging
4. Circuit breakers
5. Bulkheads and concurrency limits
6. Fallbacks and graceful degradation
7. Health checks and graceful shutdown
8. LLM and third-party API specifics
9. Rules catalog

## 1. Timeouts and deadline propagation

Choosing values:
- Start from the dependency's observed latency: timeout ≈ a bit above p99 (p99.9 for critical, low-volume calls).
- Cap by the caller's remaining budget minus a margin for your own work.
- Separate connect timeout (short: the TCP/TLS handshake) from the overall request timeout.

Budget example — user-facing request with a 2 s budget:

| Hop | Own timeout | Effective timeout |
|---|---|---|
| Edge → API | 2,000 ms | 2,000 ms |
| API → pricing service (1 retry allowed) | 600 ms per attempt | min(600, remaining − 100 ms) |
| API → DB query | `statement_timeout` 500 ms | min(500, remaining − 50 ms) |
| API → recommendations (optional) | 150 ms | on timeout: omit the widget |

Deadline propagation in TypeScript:

```ts
async function handler(req: Request) {
  const deadline = Date.now() + 2000;
  const remaining = () => Math.max(0, deadline - Date.now() - 50);
  const price = await fetch(pricingUrl, { signal: AbortSignal.timeout(Math.min(600, remaining())) });
  // ...
}
```

Python (`httpx`): `httpx.Client(timeout=httpx.Timeout(2.0, connect=0.5))`, reused across requests. gRPC: set a deadline on every call; servers check `context` cancellation and stop work.

Rule of nesting: outer timeout > inner timeout × attempts + backoff. Otherwise the outer layer abandons work that is still running and may retry it.

## 2. Retries with backoff and jitter

Retryable: connection refused/reset, timeouts, 408, 429, 502, 503, 504; 500 only for idempotent operations. Not retryable: 400, 401, 403, 404, 409, 422 and other client errors.

Full-jitter backoff (AWS Architecture Blog):

```ts
function backoffMs(attempt: number, baseMs = 200, capMs = 20_000): number {
  return Math.random() * Math.min(capMs, baseMs * 2 ** attempt);
}

async function withRetry<T>(fn: () => Promise<T>, isRetryable: (e: unknown) => boolean, maxAttempts = 3): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await fn(); }
    catch (e) {
      if (attempt + 1 >= maxAttempts || !isRetryable(e)) throw e;
      const retryAfterMs = getRetryAfterMs(e);           // honor Retry-After when present
      await sleep(retryAfterMs ?? backoffMs(attempt));
    }
  }
}
```

Python: `tenacity` with `wait_random_exponential(multiplier=0.2, max=20)` and `stop_after_attempt(3)`, retrying only on specific exception types. JVM/Kotlin: resilience4j `Retry` with `IntervalFunction.ofExponentialRandomBackoff`. Many cloud SDKs already retry — check before adding your own layer.

Why full jitter: without randomization, clients that failed together retry together, creating synchronized waves against a recovering service.

## 3. Retry budgets and hedging

- **Retry budget**: allow retries only while retries are below ~10% of requests over a sliding window (per client or per dependency). When exceeded, fail fast. AWS SDK "standard" retry mode uses a token bucket for the same purpose.
- **Only one layer retries.** If a gateway, a service mesh, and your code all retry, disable all but one.
- **Hedged requests**: for idempotent reads with a long tail, send a second request after the p95 latency and take the first response. Limit hedges to a small percentage of traffic.

## 4. Circuit breakers

States: **closed** (calls flow; failures counted) → **open** (calls fail immediately with a fallback) → **half-open** (after a cooldown, allow a few probe calls) → closed on success, open again on failure.

Starting parameters (tune with data):

| Parameter | Starting value |
|---|---|
| Failure-rate threshold | 50% |
| Minimum calls in window before evaluating | 20 |
| Window | 10–60 s sliding |
| Slow-call threshold | Count calls slower than the timeout as failures |
| Open duration (cooldown) | ~30 s |
| Half-open probes | 3–5 calls |

Rules:
- One breaker per dependency (and per endpoint if they fail independently).
- Count timeouts and 5xx/429 as failures; do not count 4xx client errors.
- Emit breaker state changes as metrics and logs; alert on breakers stuck open.
- A breaker without a fallback just converts slow failures into fast ones — still valuable, because it frees threads and connections.

## 5. Bulkheads and concurrency limits

- Separate pools per dependency: a dedicated HTTP connection pool and concurrency semaphore for each third-party API; separate DB pools for web requests vs background jobs.
- Separate queues and workers by priority (critical vs bulk).
- Per-tenant concurrency caps in multi-tenant systems.
- Size limits with Little's law: expected rate × latency, plus headroom; beyond the limit, reject or queue with a bound.

```ts
const recommendationsLimit = pLimit(20); // at most 20 concurrent calls to this dependency
const recs = await recommendationsLimit(() => fetchRecs(userId)).catch(() => []);
```

## 6. Fallbacks and graceful degradation

Decide per feature, with product, before an outage:

| Dependency down | Degraded behavior |
|---|---|
| Recommendations | Hide the widget or show popular items from cache |
| Search index | Fall back to a simple DB query with a tighter limit, or show "search is temporarily limited" |
| Payment provider | Accept the order as "payment pending", retry in background, notify the user |
| Email provider | Queue and retry; show in-app confirmation |
| Pricing service | Serve last known prices if within an acceptable age; otherwise block checkout with a clear message |
| LLM provider | Fall back to an alternate model/provider if quality allows; otherwise a clear "assistant unavailable" state |
| Whole DB writes | Read-only mode with a banner |

Rules: fallbacks must be exercised (tests, game days) or they rot; never silently return wrong data where correctness matters (money, permissions); expose kill switches for expensive or risky features.

## 7. Health checks and graceful shutdown

| Probe | Checks | Never checks |
|---|---|---|
| Liveness | Event loop/threads responsive; process not deadlocked | Database, cache, downstream services |
| Readiness | Initialized; pools created; not shutting down; optionally critical local deps | Optional downstream services |
| Startup | Initialization finished | — |

Shutdown sequence on SIGTERM:
1. Mark not ready (readiness fails) so the load balancer stops routing.
2. Wait briefly for routing to update (a few seconds).
3. Stop accepting new connections/jobs; finish in-flight work within 10–30 s.
4. Close pools, flush telemetry, exit.

Set the orchestrator's termination grace period above the drain time.

## 8. LLM and third-party API specifics

- Stream long LLM responses; set a time-to-first-token timeout and a total timeout; abort the upstream call when the client disconnects.
- Retry 429, 529/overloaded, and 5xx with backoff and jitter, honoring `retry-after`.
- Long LLM or third-party workflows run as background jobs or durable workflows, not a single long HTTP request.
- Validate every response against a schema; treat it as untrusted input.
- Pass idempotency keys to payment, messaging, and provisioning APIs on every retry.

## 9. Rules catalog

### Put a timeout on every call
**Rule.** Every outbound network or database call has an explicit timeout derived from latency data and the caller's budget.
**Apply when.** Writing or reviewing any client call.
**Do / Avoid.** Do: `fetch(url, { signal: AbortSignal.timeout(800) })`. Avoid: relying on the library default, which may be infinite.
**Why.** Without a bound, a slow dependency holds threads and connections until the whole service stalls (cascading failure).

### Retry idempotent, transient failures only
**Rule.** Retry only retryable errors on operations that are idempotent or carry an idempotency key.
**Apply when.** Adding any retry logic.
**Do / Avoid.** Do: retry a 503 on `GET /prices` or on `POST /charges` with `Idempotency-Key`. Avoid: retrying a 422 or a keyless payment POST.
**Why.** Retrying permanent errors wastes capacity; retrying non-idempotent writes creates duplicates.

### Jitter every backoff
**Rule.** Use capped exponential backoff with full jitter and honor `Retry-After`.
**Apply when.** Any retry loop or reconnect loop.
**Do / Avoid.** Do: `random(0, min(cap, base × 2^n))`. Avoid: `sleep(1000 * 2 ** n)` for every client.
**Why.** Synchronized retries arrive as waves that re-overload a recovering service.

### Keep liveness free of dependencies
**Rule.** Liveness probes check only the process itself.
**Apply when.** Configuring health endpoints for any orchestrator.
**Do / Avoid.** Do: `/livez` returns 200 if the event loop responds. Avoid: `/livez` that queries Postgres.
**Why.** A dependency outage would make every instance fail liveness and restart simultaneously, turning a partial outage into a total one.

## Sources

- AWS Architecture Blog, Exponential Backoff and Jitter: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
- AWS Builders' Library, Timeouts, retries, and backoff with jitter: https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
- Google SRE Book, Handling Overload and Addressing Cascading Failures: https://sre.google/sre-book/handling-overload/ ; https://sre.google/sre-book/addressing-cascading-failures/
- Michael Nygard, Release It! 2nd ed. (timeouts, circuit breaker, bulkheads, steady state)
- resilience4j documentation: https://resilience4j.readme.io/
- Kubernetes, Configure Liveness, Readiness and Startup Probes: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
- ByteByteGo, system-design-101 (retry strategies): https://github.com/ByteByteGoHq/system-design-101
