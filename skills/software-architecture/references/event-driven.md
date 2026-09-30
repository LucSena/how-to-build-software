# Event-Driven Architecture, CQRS, and Event Sourcing — Decision Rules

Events decouple *who reacts* from *who acts*. They also make flows harder to follow, delay consistency, and add delivery problems. Use this file to decide how far along the ladder to go and how to design events that stay safe to evolve.

## Contents
1. The ladder
2. Four meanings of "event-driven"
3. Event design rules
4. Delivery guarantees
5. Choreography vs orchestration
6. CQRS in steps
7. Event sourcing: requirements
8. Rules catalog

## 1. The ladder

Climb only as far as a present requirement forces:

1. **Direct call** inside the monolith. Default.
2. **In-process domain event** after commit. When the publisher should not know its reactors (send email, update search index, award points).
3. **In-process event + outbox table + worker.** When a reaction must survive crashes and retries.
4. **Broker** (managed queue or log). When a consumer runs in another deployable, needs independent scaling, or needs replay.
5. **Event streaming platform** (Kafka-class log) with schemas and a registry. When many independent consumers, replay, ordering per key, or very high throughput are required.
6. **Event sourcing.** Only when history is the source of truth.

Broker and queue selection (Postgres queue vs managed queue vs log vs durable execution) is in `scalability`.

## 2. Four meanings of "event-driven"

Martin Fowler distinguishes patterns people conflate:

| Pattern | What travels | Use when | Cost |
|---|---|---|---|
| Event notification | "X happened" + IDs; consumer calls back for details | Loose coupling; consumers need fresh state | Callback load on the source; source must be up |
| Event-carried state transfer | Event includes the data consumers need | Consumers need autonomy (keep a local copy) | Data duplication; eventual consistency; larger contracts |
| Event sourcing | Every state change stored as an event; state is derived | History is the product | Versioning, projections, erasure complexity |
| CQRS | Separate models for writes and reads | Read and write shapes/loads diverge sharply | Two models to keep in sync |

Say which one you mean in design docs and ADRs.

## 3. Event design rules

- **Name as a past-tense fact** in the domain language: `InvoicePaid`, `ShipmentDispatched`. Not commands (`SendEmail`) and not CRUD noise (`InvoiceUpdated`) — a vague "updated" event forces every consumer to diff.
- **Envelope** every integration event:

```json
{
  "id": "01J9Z6Q4F7X2M8K3T5V0B1N2C3",
  "type": "billing.invoice.paid",
  "version": 1,
  "occurredAt": "2026-09-30T12:04:11Z",
  "source": "billing",
  "subject": "inv_8f2k",
  "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "data": { "invoiceId": "inv_8f2k", "customerId": "cus_19a", "amountMinor": 4900, "currency": "EUR" }
}
```

  CloudEvents is a reasonable standard envelope if you want one.
- **Stable unique `id`** for deduplication; **`occurredAt`** from the producer; **trace context** so traces cross the broker.
- **Schema evolution is additive**: add optional fields; never remove, rename, or change meaning of a field within a version. Breaking change → new `version` or new type, publish both during migration.
- **Consumers ignore unknown fields** and tolerate unknown enum values.
- **No personal data you cannot delete.** Events are copied into logs, topics, and consumer stores; prefer IDs and fetch PII on demand, or encrypt per subject so the key can be destroyed.
- **Order only where needed**, scoped to a key (per account, per order). Global ordering does not scale and is rarely required.

## 4. Delivery guarantees

- Assume **at-least-once** delivery everywhere. "Exactly-once" in practice means at-least-once delivery plus idempotent processing.
- **Publishing**: use a transactional outbox — the state change and the event row commit together; a relay publishes afterwards. Writing to the DB and then to the broker in application code (dual write) loses or invents events on crashes.
- **Consuming**: record processed event IDs (inbox) in the same transaction as the effect, or make the effect naturally idempotent (upsert, set-to-value rather than increment).
- **Poison messages** go to a dead-letter queue after bounded retries, with alerting and a replay tool.
- Detailed outbox, inbox, and saga mechanics: `scalability` → `references/distributed-patterns.md`.

## 5. Choreography vs orchestration

| | Choreography | Orchestration |
|---|---|---|
| How | Each service reacts to events and emits its own | A coordinator tells participants what to do and tracks state |
| Good for | Short flows (≤ 3–4 steps), independent reactions, fan-out | Long business processes, compensations, timeouts, human steps |
| Risk | Emergent flow nobody can see; cyclic event chains | Coordinator becomes a god service if it absorbs domain logic |
| Observability | Needs tracing across the broker to reconstruct | State is explicit and queryable |

Default for multi-step processes with compensation: orchestration on a durable-execution engine or a persisted state machine. Keep domain rules in the participants; the orchestrator sequences.

## 6. CQRS in steps

Stop at the first step that satisfies the requirement:

1. **Separate code paths**: command handlers that enforce invariants; query functions that read directly with SQL tuned for the screen (no domain objects). Same database.
2. **Read-optimized views**: SQL views or materialized views for heavy screens.
3. **Denormalized read tables** updated in the same transaction or by an event handler.
4. **Separate read store** (search engine, analytics store, cache) fed by events or change-data capture; accept and design for lag.

Every step past 1 introduces staleness. State the guarantee ("search results may lag writes by up to ~5 s") and how the UI handles it (optimistic update, "processing" state, read-your-writes routing).

## 7. Event sourcing: requirements

Adopt only if you can say yes to all of these:

- History is a first-class requirement (ledger, regulated audit trail, "state as of date X", replaying decisions).
- The team can own **event versioning** — upcasters that transform old event versions on read, because stored events are immutable.
- You will maintain **snapshots** for long-lived streams and **projections** that can be rebuilt from scratch.
- You have a plan for **erasure** (crypto-shredding: encrypt personal data per subject; delete the key).
- You accept that ad-hoc queries go to projections, not the event store.

Cheaper alternatives that often satisfy "we need history": an append-only audit table written in the same transaction; temporal tables or history tables; change-data capture into an analytics store.

## 8. Rules catalog

### Start with in-process events, not a broker
**Rule.** Use an in-process dispatcher (plus outbox if needed) until a consumer lives in another deployable or needs replay.
**Apply when.** First introducing events.
**Do / Avoid.** Do: `OrderPlaced` handled in-process by Notifications and Loyalty modules. Avoid: Kafka for two handlers in the same process.
**Why.** A broker adds a stateful system to run, secure, and monitor; in-process events give the decoupling without the operations cost.

### Publish through an outbox
**Rule.** Write integration events to an outbox table in the same transaction as the state change; relay them afterwards.
**Apply when.** Any event leaving the process or triggering an external side effect.
**Do / Avoid.** Do: `INSERT INTO outbox …` in the order transaction. Avoid: `await db.save(order); await broker.publish(event)`.
**Why.** The dual-write problem: two systems cannot commit atomically, so a crash between writes loses or fabricates events.

### Make every consumer idempotent
**Rule.** Deduplicate by event ID or design effects to be safely repeatable.
**Apply when.** Writing any event or message handler.
**Do / Avoid.** Do: `INSERT INTO processed_events (id) … ON CONFLICT DO NOTHING` in the handler transaction. Avoid: `balance = balance + amount` with no dedupe.
**Why.** At-least-once delivery guarantees duplicates during retries, rebalances, and redeploys.

### Prefer orchestration for long processes
**Rule.** Use an explicit orchestrator for flows with more than 3–4 steps, compensations, or timeouts.
**Apply when.** Designing checkout, onboarding, provisioning, or refund flows across modules/services.
**Do / Avoid.** Do: a durable workflow `reserve → charge → ship`, compensating `release`/`refund`. Avoid: six services reacting to each other's events with no single place showing the flow.
**Why.** Choreographed long flows are emergent behavior; failures and stuck instances become hard to see and fix.

## Sources

- Martin Fowler, What do you mean by "Event-Driven"?: https://martinfowler.com/articles/201701-event-driven.html
- Martin Fowler, CQRS: https://martinfowler.com/bliki/CQRS.html
- Martin Fowler, Event Sourcing: https://martinfowler.com/eaaDev/EventSourcing.html
- CloudEvents specification: https://cloudevents.io/
- Outbox pattern (CDC vs polling): https://www.conduktor.io/glossary/outbox-pattern-for-reliable-event-publishing
- Durable execution and sagas: https://www.kai-waehner.de/blog/2025/06/05/the-rise-of-the-durable-execution-engine-temporal-restate-in-an-event-driven-architecture-apache-kafka/
- Martin Kleppmann, Designing Data-Intensive Applications (O'Reilly)
