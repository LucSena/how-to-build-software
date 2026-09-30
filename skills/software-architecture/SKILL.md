---
name: software-architecture
description: Use when deciding how a codebase or system should be structured — starting a new product or service, drawing module or service boundaries, choosing between layered, hexagonal/clean, vertical slice, modular monolith, microservices, serverless, or event-driven/CQRS/event sourcing, applying DDD (bounded contexts, aggregates, domain events), splitting or strangling a monolith, laying out a monorepo, writing an ADR, drawing C4 diagrams, or adding architecture fitness functions. Also use when the user asks "should this be a microservice?", "where should this code live?", "how should I organize this project?", "this is a big ball of mud", or "modules keep importing each other". Not for code-level naming and refactoring (use clean-code), single patterns such as strategy or repository (use design-patterns), load and data growth (use scalability), or UI folder structure and rendering (use frontend-architecture).
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "design-patterns scalability reliability api-design frontend-architecture clean-code"
---

# Software Architecture

Architecture is the set of decisions that are expensive to change: where the boundaries are, who owns which data, which way dependencies point, and what gets deployed together. This skill defaults to boring, proven structure — a modular monolith on Postgres with managed services — and makes every heavier option earn its place with a named, measured trigger. It protects the one outcome that matters over years: a team can keep changing the system safely and quickly.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Follow the existing architecture unless there is a measured reason to change it.** A second structure beside the first is worse than either one alone.
2. **Default to boring: modular monolith + Postgres + managed services.** Every extra deployable, datastore, or broker is operational load forever; it needs a trigger you can state with a number.
3. **Draw boundaries around reasons to change and data ownership, not technical layers.** Things that change together live together; a module owns its tables.
4. **Point dependencies toward policy.** Business rules never import frameworks, drivers, or other modules' internals; I/O plugs in at the edges.
5. **Enforce boundaries with tools, not wiki pages.** An import rule that fails CI survives; a diagram nobody checks decays within months.
6. **Spend design time on one-way doors.** Data model, public API, datastore, service split, and auth model get an ADR; internal module layout does not.
7. **Evolve in small reversible steps.** Strangler fig, branch by abstraction, and expand/contract beat big-bang rewrites every time.

## Workflow

- [ ] **Inspect what exists** (read-only): top-level folders, deployables, import graph, boundary lint rules, `docs/adr/` or `decisions/`, `AGENTS.md`/`CLAUDE.md`. Gate: you can describe the current style in two sentences. If you cannot, the answer is "undeclared layered + feature folders" — say so.
- [ ] **Capture drivers** as scenarios with numbers: "p95 < 300 ms at 200 rps", "deploy billing without touching catalog", "EU data stays in EU". Also: domain complexity (CRUD vs rich rules), number of teams, 12–24-month scale (not ten years).
- [ ] **Pick the style** from the defaults table below. Deviate only when a row's trigger is present today; write the trigger down.
- [ ] **Define modules**: for each — name (domain language), capability, owned tables, public interface, allowed dependencies. Gate: no table has two owners; the dependency graph has no cycles.
- [ ] **List one-way doors** and draft an ADR for each (template: `assets/adr-template.md`). Ask the user before adding infrastructure, splitting a service, or changing a public contract.
- [ ] **Draw** C4 context + container diagrams in Mermaid (see `references/adr-c4.md`).
- [ ] **Add fitness functions**: dependency rules and cycle checks in CI at minimum.
- [ ] **Validate** against Gotchas; fix and repeat until clean.

## Defaults by team and stage

| Situation | Default structure | Move up only when |
|---|---|---|
| Solo / prototype / MVP | One deployable, feature folders, one Postgres, managed auth/payments/email | — |
| 1 team (≤ ~10 devs), traction | **Modular monolith**: modules with public APIs, schema or table ownership per module, boundary lint in CI | A module needs its own scaling, runtime, or release cadence *today* |
| 2–5 teams | Modular monolith with module ownership (CODEOWNERS); maybe 1–3 extracted services with a clear trigger | Teams block each other on deploys despite module boundaries |
| Many teams (heuristic: more than ~5–8) with platform engineering | Services per bounded context, database per service, async integration, contract tests | — |
| Very large scale, blast-radius limits | Cell-based: independent copies of the stack per customer partition behind a thin router | — |

Add to any of these only on a trigger: a worker process when work outlasts a request; a cache when a measured hot read needs it; a broker when multiple independent consumers need replay (see `scalability`).

## Style decision table

| Style | Choose when | Avoid when |
|---|---|---|
| Layered / MVC | CRUD-heavy, little domain logic, small team | Business rules leak into controllers or SQL in views |
| Vertical slices | Many independent use cases; want minimal cross-feature coupling | Strong invariants shared across many features |
| Hexagonal / clean | Core logic must be tested without I/O; several adapters (HTTP, queue, CLI); vendor swap plausible | Scripts, glue, thin CRUD — four layers of mapping for nothing |
| **Modular monolith** | **Default for new products** | Parts need independent deploy or scaling now |
| Microservices | Several teams need independent deploy cadence; a component has radically different scaling, runtime, or compliance needs; platform (CI/CD, tracing, on-call) exists | MVP, 1–3 teams, unclear domain boundaries |
| Serverless functions | Spiky or low traffic, event glue, tiny team | Steady high load, long jobs, many DB connections |
| Event-driven integration | Fan-out reactions, cross-context integration, audit streams | You need immediate consistency and simple debugging |
| CQRS | Read and write models differ drastically, or reads vastly outnumber writes with different shapes | Typical CRUD |
| Event sourcing | History *is* the product (ledgers, audit-mandated domains, temporal queries) | Most apps; heavy erasure requirements; no team experience |

Full table with key rules and trade-offs: `references/styles-decision.md`.

## Module boundaries

A module is a business capability (Billing, Catalog, Identity), not a technical layer (`services/`, `models/`).

- **Public interface only.** Each module exposes one entry point (`index.ts`, `api` package, Python `__init__` with `__all__`, Kotlin `internal` for the rest). Other modules never deep-import internals.
- **Own your data.** Each table has exactly one owning module. No other module joins, writes, or reads its tables directly — call the owner's API or consume a read model it publishes. Separate Postgres schemas per module make this checkable.
- **Acyclic dependencies.** If A needs B and B needs A, either merge them, extract the shared concept, or invert one direction with an event.
- **Cross-module side effects through events.** "When an order is placed, reserve stock" is an in-process domain event now and can move to a broker later without changing the publisher.
- **No junk drawers.** `common/`, `shared/`, `utils/` may hold only technical code with no domain concepts. Shared domain models across modules are the seed of a distributed monolith.
- **Enforce in CI**: dependency-cruiser, eslint-plugin-boundaries, or Nx module boundaries (TS); import-linter (Python); ArchUnit, Spring Modulith, Konsist (JVM/Kotlin); Packwerk (Ruby); SwiftPM targets (Swift). Configs in `references/modular-monolith.md`.

## Inside a module: hexagonal without ceremony

```
<module>/
  domain/          # entities, value objects, rules, domain events — no framework or driver imports
  application/     # use cases (commands/queries); ports it needs (repo, clock, payment gateway)
  infrastructure/  # adapters implementing ports: SQL repos, HTTP clients, queue publishers
  interface/       # HTTP routes, resolvers, consumers, CLI; request/response DTOs + validation
```

- Introduce a port (interface) only at a real I/O boundary — database, network, clock, randomness, LLM, queue — or when two implementations exist today. An `IFooService` with one implementation is ceremony.
- For CRUD-shaped modules collapse to `feature/{routes, service, repo}` and stop there.
- ORM annotations on domain entities are an acceptable, conscious shortcut; record it in an ADR rather than building a parallel persistence model.
- Use cases are tested with in-memory fakes of ports; adapters get integration tests against real infrastructure (e.g., Testcontainers).

**Vertical slices** are the alternative when features share little: one folder per use case holding request, handler, and data access end-to-end. Share only what is genuinely shared; a slice may be a 30-line transaction script while its neighbor has a rich model. Slices and hexagonal compose: slices inside a module, ports only where I/O is swapped or faked.

## DDD: strategic always, tactical when earned

- **Strategic DDD pays off almost everywhere**: split the domain into subdomains — *core* (differentiator: build and model carefully), *supporting* (build simply), *generic* (buy: auth, payments, email, search). Draw bounded contexts where a word changes meaning ("Customer" in Billing ≠ "Customer" in Support). Use the domain's words in code.
- **Tactical DDD** (aggregates, value objects, domain services, repositories per aggregate) is for core subdomains with real invariants. For CRUD, reporting, and glue it is overkill — an anemic model is fine there.
- **Aggregate rules**: keep aggregates small; protect true invariants inside one aggregate; reference other aggregates by ID only; modify one aggregate per transaction; use eventual consistency (domain events) between aggregates; guard with optimistic concurrency (`version` column).
- **Domain vs integration events**: domain events are in-process and may change freely; integration events cross a context boundary, are versioned public contracts, and are published through an outbox.
- **Anti-corruption layer** at every integration with a legacy system or third party: translate their model into yours at the edge.

Details and examples: `references/ddd.md`.

## Microservices: when justified and how to get there

Justified only by at least one of these, present today:

| Trigger | Evidence to ask for |
|---|---|
| Team topology | Separate teams block each other's releases despite enforced module boundaries |
| Independent scaling | One component's load profile differs by an order of magnitude or needs different hardware (GPU, memory) |
| Deploy cadence / risk | One part ships many times a day while another needs slow, audited releases |
| Fault or compliance isolation | A failure or a data scope (PCI, PHI, residency) must be physically contained |
| Runtime mismatch | A component needs a different language or runtime for a concrete reason |

Prerequisites before the first split: automated deploys per service, centralized logs plus distributed tracing, on-call ownership, contract tests. Without them you get a distributed monolith.

**Distributed monolith red flags**: services deploy in lockstep; a shared database; synchronous call chains deeper than 2–3 hops; a shared library holding domain models; one feature touches many services.

**Migration path (strangler fig)**: modularize in place → enforce boundaries in CI → give the module its own schema and remove cross-module joins → route all access through its interface or events → put a routing seam (proxy, facade) in front → extract the module with the strongest trigger → shift traffic gradually → delete the old path. One service at a time; measure after each.

## Event-driven, CQRS, event sourcing

- Start with **in-process domain events** inside the monolith. Move to a broker when a consumer lives in another deployable or needs replay.
- **Events are facts** in past tense (`InvoicePaid`), carry IDs plus the data consumers need, have versioned schemas, and are delivered at-least-once → consumers are idempotent.
- **CQRS** can be applied to one module: first separate query functions over the same database, then a denormalized read table, and only then a separate store.
- **Event sourcing** needs upcasting for old event versions, snapshots, rebuildable projections, and crypto-shredding for erasure. Do not adopt it because audit is "nice to have" — an append-only audit table is far cheaper.
- Choreography is fine for flows of 3–4 steps; longer business processes get an explicit orchestrator (often a durable-execution engine).

Rules and templates: `references/event-driven.md`.

## Repository layout

Default for a product with more than one deployable: a monorepo.

```
apps/        # deployables: web, api, worker, mobile
packages/    # libraries with ≥ 2 consumers: ui, api-client, db, config presets
docs/adr/    # numbered decision records
```

Rules: apps depend on packages, never the reverse; no cycles; each package declares its dependencies explicitly; affected-only builds with remote caching (Turborepo or Nx; uv workspaces; Gradle multi-project; SwiftPM); CODEOWNERS per package; do not create a package until a second consumer exists; no `packages/common`.

## ADRs, C4, fitness functions

- **ADR** for each one-way door: new datastore or broker, service split, public API style, auth model, tenancy model, major framework. Numbered files in the existing ADR folder (create `docs/adr/` if none). ADRs are immutable; supersede, do not edit. Skip trivial or reversible choices.
- **C4**: level 1 (system context) and level 2 (containers) are almost always worth drawing; level 3 only for complex containers; level 4 never by hand.
- **Fitness functions** turn architecture rules into tests: dependency direction and no cycles (CI), migration linting, performance budgets, and SLO burn alerts in production.

Templates, Mermaid examples, and a fitness-function catalog: `references/adr-c4.md`.

## Gotchas

- **Imposing a textbook structure on an existing repo.** Adding `domain/application/infrastructure` next to an established `controllers/services` layout creates two architectures. Match what exists; propose migration separately.
- **Microservices for an MVP or one team.** Never propose them for greenfield work unless the user requires it; if asked, list the triggers, prerequisites, and costs first.
- **Splitting by technical layer** (`api-service`, `db-service`) or by entity (`user-service` that everyone calls). Split by business capability.
- **Shared database between services or modules.** It couples schemas, deploys, and failure. One owner per table.
- **Interface for every class.** Ports belong at I/O boundaries; one-implementation interfaces elsewhere are ceremony.
- **New infrastructure by reflex.** Redis, Kafka, Elasticsearch, a vector DB, or Kubernetes each need a requirement Postgres and a managed platform cannot meet, stated with numbers, plus an ADR.
- **Large aggregates.** `Customer` containing orders, invoices, and addresses means lock contention and huge loads. Reference by ID.
- **Event sourcing or CQRS for audit logging.** An audit table or change-data capture solves audit.
- **Boundaries only in diagrams.** If CI does not fail on a forbidden import, the boundary does not exist.
- **"Future-proofing" for ten-year scale.** Design for 12–24 months with a seam; one-way doors are the only place to over-invest.

## Output format

For an architecture proposal or review, reply with:

```
Current state: <2 sentences; "Observed" vs "Inferred">
Drivers: <3–6 quality-attribute scenarios with numbers>
Decision: <style> — because <trigger>; rejected: <alternative> because <reason>
Modules: | Module | Owns (tables) | Public interface | May depend on |
One-way doors → ADRs: <list, with drafted ADR files>
Diagrams: <Mermaid C4 context + container>
Fitness functions: <rules added to CI>
Migration steps (if changing): <ordered, reversible steps>
Not checked: <what you could not verify>
```

## References

| File | Read when |
|---|---|
| `references/styles-decision.md` | choosing or justifying a style, or the user asks "monolith or microservices?" |
| `references/ddd.md` | modeling a rich domain, drawing bounded contexts, sizing aggregates, or integrating a legacy system |
| `references/modular-monolith.md` | defining module boundaries, writing boundary lint configs, or extracting a module into a service |
| `references/event-driven.md` | adding domain/integration events, a broker, CQRS, event sourcing, or choreography vs orchestration |
| `references/adr-c4.md` | writing an ADR, drawing C4 diagrams in Mermaid, or adding fitness functions |
| `assets/adr-template.md` | creating a new ADR file |

## Related skills

- `design-patterns` — once boundaries are set, for the patterns inside a module.
- `scalability` — when a driver is load, data volume, caching, or queues.
- `reliability` — when a driver is availability, failure isolation, or safe deploys.
- `api-design` — when a module or service exposes a public or cross-team contract.
- `frontend-architecture` — for client-side structure, rendering, and state.
- `clean-code` — for code quality inside the modules.
