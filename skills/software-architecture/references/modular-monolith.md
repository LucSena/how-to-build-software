# Modular Monolith — Boundaries, Enforcement, Extraction

One deployable, strong internal boundaries. This file covers module anatomy, data ownership, cross-module communication, boundary enforcement configs per language, and the path from module to service.

## Contents
1. Module anatomy
2. Data ownership
3. Cross-module communication
4. Enforcing boundaries (configs)
5. Monorepo rules
6. From module to service (strangler fig)
7. Rules catalog

## 1. Module anatomy

```
src/modules/billing/
  index.ts              # the ONLY file other modules may import (public API)
  domain/               # entities, value objects, rules, domain events
  application/          # use cases, ports
  infrastructure/       # SQL repositories, HTTP clients, event publishers
  interface/            # routes, consumers, DTOs, validation
  billing.test.ts       # tests through the public API
```

The public API is small and intention-revealing:

```ts
// src/modules/billing/index.ts
export { issueInvoice, getInvoiceSummary } from './application/invoices';
export type { InvoiceSummary, IssueInvoiceCommand } from './application/types';
export { billingEvents } from './domain/events'; // event names + payload types only
```

Equivalents: Python — a package whose `__init__.py` re-exports the public functions (`__all__`), internals in `_internal/`; Kotlin — Gradle module or package with `internal` visibility for everything non-public; Java — Spring Modulith `internal` subpackages; Swift — a SwiftPM target exposing only `public` symbols; Ruby — Packwerk packages with `public/` folders.

Size heuristic: a module is a business capability a small team could own. If it has one table and one endpoint, it is probably a feature inside a larger module. If it has twenty unrelated tables, it is several modules.

## 2. Data ownership

- Every table belongs to exactly one module. Record ownership: one Postgres schema per module (`billing.invoices`, `catalog.products`) is the clearest; a table-prefix convention plus a lint check is the minimum.
- Other modules never `JOIN` into, write to, or read from another module's tables. They call its public API or read a read model it publishes.
- Foreign keys across module schemas are a pragmatic exception while still in one database; mark them, because they block later extraction.
- Reporting that needs data from many modules reads a dedicated reporting store or views owned by a reporting module — not ad-hoc cross-module joins in feature code.
- Migrations live with the module that owns the tables.

## 3. Cross-module communication

| Need | Mechanism | Notes |
|---|---|---|
| Query another module's data now | Call its public function | Synchronous, in-process, typed; returns DTOs, not entities |
| React to something that happened | In-process domain event, dispatched after commit | Handler runs in its own transaction; make it idempotent |
| Guarantee the reaction even on crash | Transactional outbox + worker, even in-process | Needed when the reaction must not be lost (emails, billing) |
| Frequently read another module's data | Local read model updated from its events | Trades freshness for independence |
| Multi-step business process | Orchestrating use case or durable workflow | Keep compensations explicit |

Rules:
- Pass IDs and DTOs across boundaries; never ORM entities (lazy loading across modules couples them invisibly).
- Dispatch events after the transaction commits; dispatching inside means handlers see uncommitted data or fire for rolled-back work.
- No module-to-module call cycles. If you need one, you found either a missing module or an event.

## 4. Enforcing boundaries (configs)

Make violations fail CI. Examples below are starting points; adapt paths.

**TypeScript — dependency-cruiser** (`.dependency-cruiser.cjs`):

```js
module.exports = {
  forbidden: [
    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'only-public-api-across-modules',
      severity: 'error',
      comment: 'Import other modules only through their index.ts',
      from: { path: '^src/modules/([^/]+)/' },
      to: { path: '^src/modules/[^/]+/.+', pathNot: ['^src/modules/$1/', '^src/modules/[^/]+/index\\.ts$'] },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      from: { path: '/domain/' },
      to: { path: ['/infrastructure/', '/interface/', '^node_modules/(pg|prisma|express|fastify)'] },
    },
  ],
};
```

Alternatives: `eslint-plugin-boundaries` (element types + allowed imports) or Nx `@nx/enforce-module-boundaries` with project tags (`scope:billing`, `type:domain`).

**Python — import-linter** (`.importlinter`):

```ini
[importlinter]
root_package = app

[importlinter:contract:layers]
name = Layers inside billing
type = layers
layers =
    app.billing.interface
    app.billing.application
    app.billing.domain

[importlinter:contract:billing-internals]
name = Only billing may import billing internals
type = forbidden
source_modules =
    app.catalog
    app.identity
forbidden_modules =
    app.billing._internal
```

**JVM / Kotlin** — Spring Modulith verifies module boundaries in a test:

```kotlin
@Test fun verifyModules() { ApplicationModules.of(Application::class.java).verify() }
```

ArchUnit for custom rules and cycles:

```kotlin
@ArchTest val noCycles = slices().matching("com.acme.(*)..").should().beFreeOfCycles()
```

Konsist offers Kotlin-native architecture assertions. **Ruby**: Packwerk. **Swift**: separate SwiftPM targets; the compiler rejects undeclared dependencies.

Add a cycle check even when nothing else is enforced; cycles are the first sign of a boundary dissolving.

## 5. Monorepo rules

```
apps/        web, api, worker, mobile      (deployables)
packages/    ui, api-client, db, config    (libraries with ≥ 2 consumers)
tooling/     scripts, generators
docs/adr/
```

- Apps depend on packages; packages never depend on apps; no cycles.
- Every package declares its own dependencies (no phantom dependencies via hoisting).
- Affected-only builds and tests with remote caching (Turborepo, Nx; Gradle build cache; Bazel or Pants for large polyglot repos).
- CODEOWNERS per app and package.
- Single version policy for framework-level dependencies.
- A package is created when a second consumer exists, not before. No `packages/common`.
- Modules of a modular monolith usually live *inside* `apps/api/src/modules/`, not as packages — packages are for code shared across deployables.

## 6. From module to service (strangler fig)

Extract only with a trigger (team topology, scaling profile, deploy cadence, isolation, runtime). Then:

1. **Enforce the boundary in place.** Public API only, no cycles, lint in CI.
2. **Separate the data.** Own schema, no cross-module joins or foreign keys, migrations owned by the module.
3. **Make communication extraction-ready.** Calls go through an interface that could become a network client; side effects go through events and an outbox.
4. **Add a seam.** A facade or routing proxy in front of the module so callers do not know where it runs.
5. **Stand up the service** with its own deploy pipeline, database, telemetry, and on-call owner. Add timeouts, retries with backoff, and circuit breaking to the new network client (see `reliability`).
6. **Shift traffic gradually** (shadow reads, then a percentage of traffic, then all), comparing results.
7. **Delete the in-process path** and the old tables. Extraction is not done until the old code is gone.

Branch by abstraction works the same way inside one codebase: introduce the interface, implement the new version behind it, switch via flag, delete the old implementation.

## 7. Rules catalog

### Give every table exactly one owning module
**Rule.** Assign each table to one module; others access its data only through that module's API or published read models.
**Apply when.** Creating a table or writing a query that touches another module's data.
**Do / Avoid.** Do: `catalog.getProductsByIds(ids)`. Avoid: `SELECT … FROM orders JOIN catalog.products` inside the Orders module.
**Why.** Shared tables couple schemas, migrations, and deploys; they are the main reason "extract this module" later becomes a rewrite.

### Import other modules only through their public entry point
**Rule.** Cross-module imports target the module's `index`/API package only, enforced by a linter in CI.
**Apply when.** Any cross-module import.
**Do / Avoid.** Do: `import { issueInvoice } from '@/modules/billing'`. Avoid: `import { InvoiceRepo } from '@/modules/billing/infrastructure/invoice-repo'`.
**Why.** Information hiding: internals can change without breaking callers, and the public API documents what the module promises.

### Dispatch domain events after commit
**Rule.** Collect events during the transaction and dispatch them only after it commits (or write them to an outbox in the same transaction).
**Apply when.** A module reacts to another module's state change.
**Do / Avoid.** Do: `await tx.commit(); await dispatcher.publish(order.pullEvents())`. Avoid: publishing inside the transaction, then rolling back.
**Why.** Pre-commit dispatch produces phantom reactions to work that never happened; post-commit without an outbox can lose events on crash — choose based on how bad a lost event is.

### Make the boundary check part of the build
**Rule.** A boundary rule that is not executed in CI does not exist.
**Apply when.** Introducing or restructuring modules.
**Do / Avoid.** Do: `npm run depcruise` as a required CI step. Avoid: a README section titled "please don't import internals".
**Why.** Fitness functions keep architecture from eroding one convenient import at a time.

## Sources

- dependency-cruiser rules reference: https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- import-linter contract types: https://import-linter.readthedocs.io/en/stable/contract_types/
- Spring Modulith reference: https://docs.spring.io/spring-modulith/reference/
- ArchUnit user guide: https://www.archunit.org/userguide/html/000_Index.html
- Shopify, Packwerk: https://github.com/Shopify/packwerk
- Martin Fowler, StranglerFigApplication: https://martinfowler.com/bliki/StranglerFigApplication.html
- Martin Fowler, BranchByAbstraction: https://martinfowler.com/bliki/BranchByAbstraction.html
- Sairyss, domain-driven-hexagon (enforcing architecture): https://github.com/Sairyss/domain-driven-hexagon
- Modular monolith 2026 guide (Spring Modulith, ArchUnit): https://dev.to/x4nent/the-modular-monolith-2026-complete-guide-spring-modulith-archunit-fitness-functions-and-lessons-878
