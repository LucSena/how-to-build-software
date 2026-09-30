# Distributed Patterns — Idempotency, Outbox, Sagas, Consistency, Rate Limiting, Load Shedding

The moment data lives in two places or work crosses a network, you trade atomicity for availability. These patterns make that trade explicit and safe.

## Contents
1. Idempotent processing
2. Transactional outbox and inbox
3. Sagas
4. Consistency models and CAP/PACELC
5. Rate limiting algorithms
6. Back-pressure and load shedding
7. Rules catalog

## 1. Idempotent processing

An operation is idempotent when doing it twice has the same effect as once. Make every retried or redelivered operation idempotent:

| Technique | Example |
|---|---|
| Natural idempotency | `UPDATE orders SET status = 'shipped' WHERE id = $1` (set-to-value, not increment) |
| Upsert | `INSERT … ON CONFLICT (external_id) DO UPDATE …` |
| Dedupe table (inbox) | Insert message ID with a unique constraint in the same transaction as the effect; conflict → already processed |
| Idempotency key to downstream | Pass a deterministic key to the payment/email API (`{operationKey}:charge`) |
| Version check | Apply an update only if `incoming.version > current.version` |

Dedupe keys are scoped (per tenant, per consumer) and expire after a window longer than the maximum redelivery delay. The HTTP `Idempotency-Key` protocol for APIs is in `api-design`.

## 2. Transactional outbox and inbox

**Dual-write problem**: "save to DB, then publish to broker (or send email)" cannot be atomic. A crash between the two loses the event; publishing first and failing the DB write invents one.

**Outbox**:

```sql
BEGIN;
UPDATE orders SET status = 'paid' WHERE id = $1;
INSERT INTO outbox (id, aggregate_id, type, payload, created_at)
VALUES (gen_random_uuid(), $1, 'order.paid.v1', $2, now());
COMMIT;
```

A relay publishes outbox rows and marks them sent:
- **Polling publisher**: claim unsent rows with `FOR UPDATE SKIP LOCKED`, publish, mark sent. Simple; latency ≈ poll interval; adds DB load.
- **Change-data capture** (e.g., Debezium reading the write-ahead log): lower latency and DB load; more infrastructure.

Delivery is at-least-once (the relay can publish and crash before marking sent) → consumers dedupe. Clean up sent rows on a schedule or partition by time.

**Inbox**: the consumer inserts the message ID into `processed_messages` in the same transaction as its effects; a unique-constraint conflict means "already done — acknowledge and skip".

## 3. Sagas

A saga is a business transaction across services or modules made of local transactions, each with a **compensating action** that semantically undoes it.

Example — checkout: `reserve inventory` → `charge payment` → `create shipment`. If shipping fails: `refund payment` → `release inventory`.

| Style | How | Use when |
|---|---|---|
| Orchestration | A coordinator (durable workflow or persisted state machine) calls each step and compensations | Default for > 3–4 steps, timeouts, human steps; easy to observe |
| Choreography | Each participant reacts to the previous step's event | Short flows with few participants |

Rules:
- Compensations are **idempotent** and **semantic**: you cannot unsend an email; you send a correction. You refund, not "delete the charge".
- Identify the **pivot step** (point of no return, often the payment capture). Steps before it must be compensable; steps after it must be retriable until they succeed.
- Persist saga state; every step and compensation is retried with backoff; stuck sagas alert.
- Avoid distributed two-phase commit across services; it blocks on coordinator failure and couples availability.
- Expose intermediate states to users ("payment processing") rather than pretending the operation is instant.

## 4. Consistency models and CAP/PACELC

- **CAP**: during a network partition, a distributed store must choose consistency or availability. Partitions happen; you do not get to opt out.
- **PACELC**: if Partition → choose A or C; Else (normal operation) → choose Latency or Consistency. The "else" trade-off is the one you live with daily (synchronous replication = consistency at the cost of latency).
- Models from strongest to weakest: linearizable → sequential → causal → session guarantees (read-your-writes, monotonic reads, monotonic writes) → eventual.

| Data | Needs | Implementation |
|---|---|---|
| Money, balances, inventory, seat/booking, uniqueness | Strong | Single primary, transactions, constraints, conditional updates |
| User's own profile/settings after edit | Read-your-writes | Read from primary after write; version tokens |
| Feeds, counters, likes, search index, analytics | Eventual, bounded staleness | Async projections, caches with TTL |
| Collaborative documents, offline edits | Strong eventual (merge without conflicts) | CRDTs (e.g., Yjs, Automerge) |

Whenever you add a replica, cache, queue, search index, or second service, write down: the staleness bound, who can observe it, and how the UI handles it (optimistic update with reconciliation, "processing" state, read-your-writes routing).

**Clocks**: wall clocks on different machines disagree. Order events with DB sequences, per-entity version numbers, or hybrid logical clocks — not timestamps from different hosts.

## 5. Rate limiting algorithms

| Algorithm | Behavior | Use |
|---|---|---|
| **Token bucket** | Refill r tokens/s up to capacity b; request costs 1+ tokens; bursts up to b | **Default** per API key/user/tenant |
| GCRA | Token-bucket-equivalent with one timestamp per key | Efficient Redis implementation of the same policy |
| Leaky bucket | Constant outflow; excess queued or dropped | Shaping traffic toward a fragile downstream |
| Fixed window counter | Count per calendar window | Simple quotas; allows up to 2× burst at window edges |
| Sliding window log | Timestamp per request; exact | Low-volume security controls (login attempts) |
| Sliding window counter | Weighted current + previous window counts | Good accuracy/memory balance at scale |

Rules:
- Key by authenticated principal (API key, user, tenant) and by IP for unauthenticated routes.
- Distributed limits need atomic operations (Redis Lua script, GCRA library) or an API gateway; per-instance limits multiply by instance count.
- Different limits per cost: login and password reset strict; search, exports, and LLM endpoints limited by cost units (tokens, rows), not only request count; per-tenant quotas for noisy neighbors.
- Respond `429 Too Many Requests` with `Retry-After`; advertise quotas with rate-limit headers (header details in `api-design`).
- Decide fail-open vs fail-closed when the limiter store is down: fail-open for general traffic, fail-closed for security controls.

## 6. Back-pressure and load shedding

- **Bounded queues and buffers everywhere.** An unbounded in-memory queue converts overload into out-of-memory crashes and unbounded latency.
- **Back-pressure**: signal upstream to slow down — TCP flow control, reactive-streams `request(n)`, pausing a Kafka consumer, returning 429/503 with `Retry-After`.
- **Load shedding**: when saturated, reject cheaply and early (at the load balancer or first middleware) rather than accepting work that will time out anyway. Prioritize: health checks and critical flows (checkout, login, paid tier) last to be shed; background and best-effort features first.
- **Concurrency limits** per instance (max in-flight requests) derived from Little's law; adaptive limiters (gradient/Vegas-style, e.g., Netflix concurrency-limits) adjust to measured latency and beat static guesses.
- **Deadline awareness**: drop queued requests whose client deadline has already passed.
- **Steady state**: everything that grows (logs, sessions, cache, temp files, job tables) has a bound and automatic cleanup.

## 7. Rules catalog

### Use an outbox for every "save and notify"
**Rule.** Write the event or side-effect request to an outbox table in the same transaction as the state change.
**Apply when.** A write must also publish an event, send an email, or call another service.
**Do / Avoid.** Do: `UPDATE …; INSERT INTO outbox …; COMMIT`. Avoid: `await repo.save(x); await bus.publish(evt)`.
**Why.** Dual writes cannot be atomic; the outbox makes the database the single commit point.

### Design compensations before the happy path
**Rule.** For every saga step, define its compensating action and whether it is before or after the pivot.
**Apply when.** A business operation spans services, modules with separate stores, or external providers.
**Do / Avoid.** Do: reserve → charge (pivot) → ship with retries; compensations release and refund. Avoid: charge first, then discover inventory is gone with no refund path.
**Why.** Without distributed transactions, correctness under partial failure comes only from explicit compensation.

### Shed load early and cheaply
**Rule.** Reject excess requests at the edge with 429/503 + `Retry-After` when concurrency or queue limits are hit.
**Apply when.** Designing overload behavior for any service.
**Do / Avoid.** Do: max 200 in-flight per instance, then fast rejection, low-priority routes first. Avoid: accepting everything into an unbounded queue until all requests time out.
**Why.** Past saturation, queued work only increases latency for everyone (queueing theory); fast failure preserves goodput.

### Rate limit by cost, not just count
**Rule.** Weight limits by the resource consumed for expensive endpoints.
**Apply when.** Endpoints trigger LLM calls, large exports, searches, SMS, or other paid resources.
**Do / Avoid.** Do: per-tenant token budget per minute for an LLM feature. Avoid: 100 requests/min where each request may cost 100k tokens.
**Why.** Uniform request limits let a few expensive calls exhaust capacity or budget (OWASP API4: unrestricted resource consumption).

## Sources

- Transactional outbox (Conduktor): https://www.conduktor.io/glossary/outbox-pattern-for-reliable-event-publishing
- Outbox: when CDC beats polling: https://dev.to/gabrielanhaia/outbox-pattern-when-cdc-beats-polling-when-polling-beats-cdc-4dj4
- Chris Richardson, Saga pattern: https://microservices.io/patterns/data/saga.html
- Daniel Abadi, Consistency Tradeoffs in Modern Distributed Database System Design (PACELC): http://cs-www.cs.yale.edu/homes/dna/papers/abadi-pacelc.pdf
- Jepsen, Consistency models: https://jepsen.io/consistency
- Rate limiting algorithms (Arcjet): https://blog.arcjet.com/rate-limiting-algorithms-token-bucket-vs-sliding-window-vs-fixed-window/
- Redis rate limiting tutorials: https://redis.io/tutorials/howtos/ratelimiting/
- Michael Nygard, Release It! 2nd ed. (steady state, back-pressure, load shedding)
- OWASP API Security Top 10 2023, API4: https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/
