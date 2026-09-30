# Domain-Driven Design — Practical Reference

Strategic DDD (subdomains, bounded contexts, ubiquitous language) is useful in nearly every non-trivial system. Tactical DDD (aggregates, value objects, repositories) is for core subdomains with real invariants. This file shows both and says when to stop.

## Contents
1. Strategic design
2. Context mapping
3. Tactical building blocks
4. Aggregate design rules
5. Domain events vs integration events
6. When DDD is overkill
7. Rules catalog

## 1. Strategic design

**Subdomains** — classify each area of the business:

| Type | Meaning | Investment |
|---|---|---|
| Core | Where the business wins (pricing engine, matching, risk model) | Best people, custom rich model, tests, careful boundaries |
| Supporting | Needed, specific to you, not a differentiator (back-office workflows) | Build simply; CRUD is fine |
| Generic | Solved problems (auth, payments, email, search, billing plumbing) | Buy or use a library/SaaS; wrap behind an adapter |

**Bounded context** — an explicit boundary inside which one model and one vocabulary are consistent. "Account" in Identity (login credentials) and "Account" in Billing (a payer with a balance) are different models; forcing one shared `Account` class couples both teams and pleases neither.

Heuristics for finding context boundaries:
- A term changes meaning or gains different attributes.
- A different group of people (department, persona) owns the rules.
- Data changes at a different rate or under different consistency needs.
- Language in meetings shifts ("booking" vs "reservation" vs "order").

**Ubiquitous language** — use the domain experts' exact words in code, tables, events, and API fields. Keep a glossary in `project-context.md`. Rename code when the language changes.

**Discovery** — EventStorming (sticky notes of domain events on a timeline, then commands, actors, policies, and aggregates) or domain storytelling. Even a one-hour session with a domain expert catches boundary mistakes early.

## 2. Context mapping

How two contexts relate:

| Pattern | Use when |
|---|---|
| Partnership | Two teams succeed or fail together; coordinate releases |
| Shared kernel | A tiny, co-owned model (e.g., `Money`, `CountryCode`) — keep it minimal and changed only by agreement |
| Customer–supplier | Downstream needs are prioritized by the upstream team |
| Conformist | You accept the upstream model as-is (it is good enough and you have no leverage) |
| **Anti-corruption layer (ACL)** | Upstream model is legacy, third-party, or would distort yours — translate at your edge |
| Open host service + published language | You serve many consumers; publish a stable, documented protocol (OpenAPI, event schemas) |
| Separate ways | Integration costs more than duplication |

Default for any third-party API or legacy system: an ACL. The adapter maps their DTOs and error codes to your domain types; nothing past the adapter mentions the vendor's names.

## 3. Tactical building blocks

| Block | What it is | Example |
|---|---|---|
| Entity | Identity + lifecycle; equality by ID | `Order`, `Subscription` |
| Value object | Immutable, equality by value, validates itself | `Money(amountMinor, currency)`, `EmailAddress`, `DateRange` |
| Aggregate | Cluster of entities/values with one root that guards invariants; the unit of consistency | `Order` root with `OrderLine`s |
| Domain service | Rule spanning several aggregates with no natural home | `TransferFunds(from, to, amount)` policy |
| Repository | Load and save one aggregate type as a whole | `OrderRepository.get(id)`, `.save(order)` |
| Factory | Complex creation logic with invariants | `Order.place(cart, customer, clock)` |
| Domain event | Something that happened, past tense | `OrderPlaced { orderId, customerId, totalMinor, currency }` |

Value objects only where there are invariants. Wrapping every string in a class in a CRUD module is boilerplate.

A minimal aggregate in TypeScript:

```ts
export class Order {
  private constructor(
    readonly id: OrderId,
    private status: 'draft' | 'placed' | 'cancelled',
    private lines: OrderLine[],
    readonly version: number,
    private events: DomainEvent[] = [],
  ) {}

  place(now: Date): void {
    if (this.status !== 'draft') throw new DomainError('order_not_draft');
    if (this.lines.length === 0) throw new DomainError('order_empty');
    this.status = 'placed';
    this.events.push({ type: 'OrderPlaced', orderId: this.id, at: now.toISOString() });
  }

  pullEvents(): DomainEvent[] { const e = this.events; this.events = []; return e; }
}
```

The repository saves the aggregate with `WHERE id = $1 AND version = $2` and increments `version`; zero rows updated means a concurrent change → return a conflict (HTTP 409) or retry the command.

## 4. Aggregate design rules

Based on Vaughn Vernon's "Effective Aggregate Design":

1. **Model true invariants in consistency boundaries.** Only rules that must hold *at the end of every transaction* belong inside one aggregate ("order total equals sum of lines"). Rules that can be briefly violated ("customer credit limit across all orders") are checked by a policy with eventual consistency or a reservation.
2. **Design small aggregates.** A root plus a few value objects is typical. Large aggregates cause lock contention, slow loads, and merge conflicts.
3. **Reference other aggregates by ID.** `Order.customerId`, never `Order.customer: Customer`. Loading is explicit; transaction scope stays small.
4. **Modify one aggregate per transaction.** Update others through domain events handled in separate transactions.
5. **Use optimistic concurrency.** A `version` column; conflicts are expected, surfaced, and retried.

Signs an aggregate is too big: it has collections that grow without bound (all of a customer's orders), different users edit different parts concurrently, or loading it needs many joins.

## 5. Domain events vs integration events

| | Domain event | Integration event |
|---|---|---|
| Scope | Inside one bounded context / process | Crosses contexts or services |
| Contract | Internal; may change with the code | Public, versioned, documented schema |
| Transport | In-process dispatcher after commit | Broker, via transactional outbox |
| Payload | Can reference internal types | Only stable primitives and IDs, plus data consumers need |
| Example | `OrderLinePriceAdjusted` | `billing.invoice.paid.v1` |

Translate domain events into integration events at the context boundary; do not publish internal events directly, or your internals become someone else's contract.

## 6. When DDD is overkill

Skip tactical DDD for:
- CRUD and admin screens where the "rules" are validation.
- Reporting, analytics, and read-heavy dashboards.
- Glue code, ETL, and integrations (use an ACL, not aggregates).
- Supporting and generic subdomains.
- Prototypes whose domain is not yet understood — model after the second or third real use case.

Keep, even then: ubiquitous language in names, explicit context boundaries, and ACLs around third parties.

## 7. Rules catalog

### Name code in the domain's language
**Rule.** Use the exact business terms for modules, types, tables, events, and API fields.
**Apply when.** Naming anything that represents a business concept.
**Do / Avoid.** Do: `Policy.bind()`, `ClaimSubmitted`. Avoid: `DataManager.process()`, `RecordUpdated`.
**Why.** Translation between business talk and code is where requirements get lost; one vocabulary removes a whole class of misunderstandings.

### Put an anti-corruption layer around every external model
**Rule.** Translate third-party and legacy models into your own types at a single adapter.
**Apply when.** Integrating payments, CRMs, ERPs, legacy databases, or partner APIs.
**Do / Avoid.** Do: `StripePaymentGateway implements PaymentGateway` returning your `PaymentResult`. Avoid: Stripe object types flowing into domain code and database columns.
**Why.** Contains the blast radius of vendor changes and keeps your model shaped by your domain, not theirs.

### Keep aggregates small and reference by ID
**Rule.** One root, few children, other aggregates referenced only by ID; one aggregate modified per transaction.
**Apply when.** Designing any entity cluster with invariants.
**Do / Avoid.** Do: `Order { customerId, lines[] }`. Avoid: `Customer { orders[], invoices[], addresses[] }` loaded and saved as one unit.
**Why.** Consistency boundaries equal lock and transaction scope; big ones serialize writes and time out under load.

### Publish integration events, not domain internals
**Rule.** Map internal domain events to versioned integration events at the boundary, published via an outbox.
**Apply when.** Another context or service needs to react.
**Do / Avoid.** Do: `catalog.product.discontinued.v1 { productId, discontinuedAt }`. Avoid: serializing the internal `Product` aggregate onto a topic.
**Why.** Consumers couple to whatever you publish; a narrow, versioned contract lets internals keep changing.

## Sources

- Eric Evans, Domain-Driven Design (2003) and DDD Reference: https://www.domainlanguage.com/ddd/reference/
- Vaughn Vernon, Effective Aggregate Design: https://www.dddcommunity.org/library/vernon_2011/
- Sairyss, domain-driven-hexagon: https://github.com/Sairyss/domain-driven-hexagon
- Alberto Brandolini, EventStorming: https://www.eventstorming.com/
- Martin Fowler, BoundedContext: https://martinfowler.com/bliki/BoundedContext.html
- DDD Crew, Context Mapping: https://github.com/ddd-crew/context-mapping
