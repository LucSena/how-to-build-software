# Architecture Styles — Decision Reference

Use this file to pick or justify a structural style. Start from the defaults; move to a heavier style only when its trigger is present today and you can state it with a number.

## Contents
1. First questions
2. Full style table
3. Monolith vs microservices: the evidence
4. Quality-attribute scenarios
5. Conway's law and team topology
6. Twelve-factor baseline
7. Rules catalog

## 1. First questions

Answer these before proposing any structure:

1. **What exists?** Folder structure, deployables, boundary lint rules, ADRs, agent instruction files. Follow them unless the user asked to change them.
2. **What are the quality-attribute drivers?** Latency, throughput, availability, consistency, security, cost, time to market. Write them as scenarios (section 4).
3. **How complex is the domain?** CRUD and reporting vs rich rules with invariants (pricing, scheduling, ledgers, underwriting).
4. **How many teams and developers?** Architecture mirrors communication structure.
5. **Expected scale in 12–24 months?** Not ten years.
6. **Which decisions are one-way doors?** Data model, public API, datastore, vendor lock-in, service split. Spend effort there; record them in ADRs.

## 2. Full style table

| Style | Choose when | Avoid when | Key rule |
|---|---|---|---|
| Layered / MVC (controller → service → data) | CRUD-heavy app, small team, little domain logic | Rich rules spread across services and controllers | Keep layers thin; no business logic in controllers, no SQL in views |
| Vertical slice | Many independent use cases; feature teams; want low cross-feature coupling | Heavy shared invariants across features | One folder per use case, request → handler → data; share only what is truly shared |
| Hexagonal (ports and adapters) | Core logic must be testable without I/O; several entry points (HTTP, queue, CLI); vendor swap plausible | Scripts, CRUD glue | Core defines ports; adapters implement them; dependencies point inward |
| Clean / Onion | Same as hexagonal in larger codebases with many use cases | Small projects: four layers × mappings is boilerplate | Source dependencies point inward only; frameworks are details |
| **Modular monolith** | **Default for new products and most teams up to several** | Parts need independent deploy or scaling today; many teams blocking each other | Modules own their data, talk through public APIs or in-process events, boundaries enforced by tooling |
| Microservices | Several teams need independent deploy cadence; components have radically different scaling, runtime, or compliance needs; platform maturity exists | Startup, MVP, 1–3 teams, unclear domain boundaries, no platform engineering | Service per bounded context, database per service, async integration, contract tests, no shared DB |
| Serverless / FaaS | Spiky or low traffic, event glue, scheduled jobs, very small team | Long-running work, latency-sensitive steady high load, many DB connections | Stateless handlers, pooled or HTTP-based DB access, idempotent triggers |
| Event-driven integration | Fan-out reactions, integration between contexts, audit or analytics streams | Need immediate consistency and simple debugging; small systems | Events are past-tense facts, versioned schemas, at-least-once + idempotent consumers, outbox for publishing |
| CQRS | Read and write models differ drastically; very asymmetric load | Typical CRUD — it adds risky complexity for most systems | Apply per module; begin with separate query code over the same DB |
| Event sourcing | History is the core requirement (ledgers, regulated audit, temporal queries) | Most apps; teams without experience; heavy erasure needs | Immutable, versioned events; upcasting; snapshots; rebuildable projections |
| Cell-based | Very large scale where blast radius must be bounded | Everyone else | Partition customers into independent full-stack cells behind a thin routing layer |
| Local-first / sync engine | Highly interactive, offline, or real-time collaborative apps | Server-authoritative invariants dominate (payments, inventory) | Server still validates and authorizes; see `frontend-architecture` and `mobile-architecture` |

Styles combine. A common healthy shape: a modular monolith whose modules use vertical slices, with hexagonal ports only at I/O boundaries, in-process domain events between modules, and one extracted worker service for heavy background jobs.

## 3. Monolith vs microservices: the evidence

- Martin Fowler's "MonolithFirst": almost all successful microservice stories started with a monolith that grew too big and was broken up; systems built as microservices from scratch often ended in trouble. His "Microservice Prerequisites" — rapid provisioning, basic monitoring, rapid application deployment — remain the minimum.
- Amazon Prime Video's video-quality monitoring team moved from distributed serverless components to a single process and reported roughly 90% lower infrastructure cost (2023).
- Segment's "Goodbye Microservices" (2018) describes consolidating over a hundred destination services back into one to recover velocity.
- Shopify runs a very large modular monolith and enforces component boundaries with tooling (Packwerk).

**Costs microservices add**: network latency and partial failure on every call; distributed transactions (sagas, compensations); eventual consistency visible to users; tracing and log correlation; API versioning between teams; local development complexity; infrastructure spend; on-call load per service.

**What they buy**: independent deploy and scaling per team, fault isolation, technology freedom per service. These are real — for organizations large enough to need them.

## 4. Quality-attribute scenarios

Write each driver as a testable scenario: *source → stimulus → environment → response → measure*. Examples:

| Attribute | Scenario |
|---|---|
| Performance | 200 rps of catalog reads at peak → p95 < 300 ms, p99 < 800 ms |
| Availability | Payment provider down for 10 min → checkout queues orders; no order lost; UI says "processing" |
| Modifiability | Add a new tax rule → change touches only the Pricing module, shipped in < 1 day |
| Deployability | Billing team ships 10×/day without coordinating with Catalog |
| Security | Tenant A's user requests tenant B's invoice by ID → 404, logged, alert on repeated attempts |
| Cost | Infra cost per active tenant < $X/month at 5,000 tenants |
| Data residency | EU customers' personal data stored and processed only in EU regions |

A style choice that satisfies no scenario better than the default is not justified.

## 5. Conway's law and team topology

- Systems mirror the communication structure of the organization that builds them. Boundaries that cut across teams produce coordination costs; boundaries aligned with teams reduce them.
- The "inverse Conway maneuver" (Team Topologies): shape teams around the architecture you want — stream-aligned teams owning bounded contexts end-to-end, a platform team providing self-service infrastructure.
- Practical rule: one owning team per module or service. Code with no owner rots; code with two owners becomes a negotiation.

## 6. Twelve-factor baseline

Still the baseline for any deployable, monolith or service: one codebase with many deploys; explicit, isolated dependencies; config in the environment (secrets in a secret manager); backing services as attached resources; separate build, release, run; stateless share-nothing processes; port binding; scale out via processes; fast startup and graceful shutdown on SIGTERM; dev/prod parity; logs as event streams to stdout; admin tasks as one-off processes in the same environment. Modern additions: telemetry via OpenTelemetry, and API-first contracts.

## 7. Rules catalog

### Default to a modular monolith
**Rule.** For new products and teams up to several, ship one deployable with enforced internal modules.
**Apply when.** Greenfield work, MVPs, or restructuring a big ball of mud.
**Do / Avoid.** Do: `src/modules/{billing,catalog,identity}` each with a public `index.ts` and its own schema. Avoid: three services and a message broker for a two-person team.
**Why.** You get most of the modularity benefit with none of the distributed-systems tax (network failure, sagas, tracing), and the seams let you extract later.

### Extract a service only with a named trigger
**Rule.** Split out a service only when team topology, scaling profile, deploy cadence, isolation, or runtime needs demand it now.
**Apply when.** Someone proposes "let's make this a microservice".
**Do / Avoid.** Do: extract image processing because it needs GPUs and scales 20× differently. Avoid: extracting `user-service` because "users are a separate concept".
**Why.** Every service boundary converts in-process calls into unreliable network calls; the benefit must outweigh that permanent cost.

### Choose serverless for spiky glue, not steady cores
**Rule.** Use functions for event glue, webhooks, cron, and spiky low-volume APIs; use long-running containers for steady high load.
**Apply when.** Picking a runtime for a new component.
**Do / Avoid.** Do: a function that resizes uploaded images. Avoid: a function-per-endpoint API under sustained load opening a DB connection per invocation.
**Why.** Per-invocation pricing and cold starts favor bursty work; sustained load and connection-heavy work favor pooled, warm processes.

### Run compute close to its data
**Rule.** Place request handlers in the same region as their primary database; use the edge only for cacheable or stateless work.
**Apply when.** Choosing edge vs regional deployment.
**Do / Avoid.** Do: edge middleware for auth-token checks and redirects; regional API next to Postgres. Avoid: an edge function making five sequential queries to a database 80 ms away.
**Why.** Latency adds per round trip; chatty data access across regions is slower than a single hop to a nearby server.

## Sources

- Martin Fowler, MonolithFirst: https://martinfowler.com/bliki/MonolithFirst.html
- Martin Fowler, Microservice Prerequisites: https://martinfowler.com/bliki/MicroservicePrerequisites.html
- Martin Fowler, CQRS: https://martinfowler.com/bliki/CQRS.html
- Prime Video case (The New Stack): https://thenewstack.io/return-of-the-monolith-amazon-dumps-microservices-for-video-monitoring/
- Segment, Goodbye Microservices: https://segment.com/blog/goodbye-microservices/
- Alistair Cockburn, Hexagonal Architecture: https://alistair.cockburn.us/hexagonal-architecture/
- Jimmy Bogard, Vertical Slice Architecture: https://www.jimmybogard.com/vertical-slice-architecture/
- Sairyss, domain-driven-hexagon: https://github.com/Sairyss/domain-driven-hexagon
- The Twelve-Factor App: https://12factor.net/ (https://github.com/heroku/12factor)
- Team Topologies (Skelton & Pais): https://teamtopologies.com/
- Bass, Clements, Kazman, Software Architecture in Practice (quality-attribute scenarios)
