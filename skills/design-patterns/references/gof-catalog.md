# GoF and Enterprise Patterns — Modern Catalog

Each entry: the problem it solves, the modern idiom, when to use, when NOT to use, and red flags in review. Examples are TypeScript unless a language differs meaningfully. Default for every entry: if the forcing problem isn't present today, don't use it.

## Contents
1. Creational: Factory, Abstract Factory, Builder, Singleton, Prototype
2. Structural: Adapter, Facade, Decorator, Proxy, Composite, Bridge, Flyweight
3. Behavioral: Strategy, Observer, Command, State, Template Method, Chain of Responsibility, Iterator, Visitor, Mediator, Memento, Interpreter
4. Enterprise: Repository, Service layer, Unit of Work, DTO mapping, Dependency Injection, Service Locator, Specification, CQRS mediator

---

## 1. Creational

### Factory Method / factory function
- **Problem.** Callers shouldn't know which concrete type to build (depends on config, platform, input).
- **Modern idiom.** A plain function returning an interface or union: `createStorage(config): Storage`. Kotlin companion `of()`, Swift static factory, Go `NewX(...)`.
- **Use when.** Construction varies at runtime, or needs validation that a constructor can't express (return a `Result`).
- **Don't when.** There is one concrete type — call the constructor.
- **Red flags.** `UserFactory` whose only method is `return new User(...)`; factories of factories.

### Abstract Factory
- **Problem.** Families of related objects must vary together (e.g., a UI toolkit per platform).
- **Modern idiom.** An object/module of factory functions selected once at the composition root.
- **Use when.** You really ship ≥ 2 families (test vs prod counts only for I/O boundaries).
- **Don't when.** Almost always — most apps have one family.

### Builder
- **Problem.** Many optional parameters; telescoping constructors; staged or validated construction.
- **Modern idiom.** TS options object with defaults; Python keyword args; Kotlin named/default args or type-safe DSL; Swift memberwise init with defaults or result builders; Go functional options or a config struct.
- **Use when.** Construction is staged (query builders, HTTP request builders), must validate combinations before producing an immutable object, or the result is a DSL.
- **Don't when.** Named/default args already make the call readable — this is most cases in Kotlin, Python, and Swift.
- **Red flags.** Hand-written builder mirroring every field of a data class.

### Singleton
- **Problem.** Exactly one instance of a resource (connection pool, logger sink, config).
- **Modern idiom.** Create once at startup; pass it to consumers. ES modules and Python modules are already single-instance; Kotlin `object`; DI container "singleton scope".
- **Use when.** The resource is genuinely single per process — and you still inject it.
- **Don't when.** The motivation is convenient global access. Default in new code: no `getInstance()`.
- **Red flags.** `X.getInstance()` / `X.shared` called inside business logic; tests that must reset global state between runs.

### Prototype
- **Problem.** Create objects by copying a configured instance.
- **Modern idiom.** `structuredClone`, spread `{ ...obj, field }`, Kotlin `copy()`, Swift value-type copies, Python `dataclasses.replace`.
- **Use when.** Immutable updates — which the idioms above already cover.
- **Don't when.** Rarely worth naming as a pattern.

## 2. Structural

### Adapter
- **Problem.** An external API's shape doesn't match what your code needs; you want to isolate a vendor.
- **Modern idiom.** A thin module implementing *your* interface (port) over the SDK: `PaymentGateway` implemented by `stripeGateway`. Translates types and errors at the boundary.
- **Use when.** Wrapping third-party SDKs (payments, email, LLM providers, storage), legacy systems (anti-corruption layer). Justified with one implementation because it is a boundary you fake in tests.
- **Don't when.** Wrapping your own code 1:1.
- **Red flags.** Adapter that leaks vendor types (`Stripe.Charge`) through its interface.

### Facade
- **Problem.** A subsystem is complicated; most callers need a few operations.
- **Modern idiom.** A module exporting a small API (a deep module).
- **Use when.** It hides real complexity (sequencing, retries, several collaborators).
- **Don't when.** Each method forwards to one call — that's a pass-through.

### Decorator
- **Problem.** Add behavior (logging, caching, retries, auth, metrics) without changing the wrapped code.
- **Modern idiom.** Higher-order functions, HTTP middleware (Express/Hono/Koa, `http.Handler` in Go), Python decorators, Kotlin interface delegation (`by`).
- **Use when.** A cross-cutting concern applies to several call sites.
- **Don't when.** One call site — inline it. Or when the stack gets so deep the control flow is invisible.
- **Red flags.** Order-dependent decorator stacks nobody can explain; retries in a decorator *and* in the client (multiplied retries).

### Proxy
- **Problem.** Control access to an object: lazy init, caching, remote calls, access checks.
- **Modern idiom.** Wrapper with the same interface; JS `Proxy` only for tooling.
- **Use when.** Lazy loading of expensive resources, caching proxies, generated RPC stubs.
- **Don't when.** It hides network calls behind something that looks local — callers can't reason about latency and failure.

### Composite
- **Problem.** Treat parts and wholes uniformly in a tree.
- **Modern idiom.** Recursive types: `type Node = { kind: 'file', size } | { kind: 'dir', children: Node[] }`.
- **Use when.** UI trees, ASTs, org charts, file systems.
- **Don't when.** Data is flat.

### Bridge
- **Problem.** Two independent dimensions of variation (renderer × shape) would multiply subclasses.
- **Modern idiom.** Compose two interfaces instead of subclassing.
- **Use when.** Both dimensions really vary today.
- **Don't when.** Speculative.

### Flyweight
- **Problem.** Memory pressure from many identical objects.
- **Modern idiom.** Interning, object pools, memoization, sharing immutable values.
- **Use when.** Profiling shows the memory problem.
- **Don't when.** Unmeasured.

## 3. Behavioral

### Strategy
- **Problem.** Choose among interchangeable algorithms at runtime.
- **Modern idiom.** A function parameter or a map from key to function: `const pricing: Record<Tier, (o: Order) => Money> = {...}`.
- **Use when.** ≥ 2 real algorithms selected at runtime (pricing rules, retry policies, export formats).
- **Don't when.** One algorithm; or a class hierarchy for what would be two lambdas.
- **Red flags.** `StrategyFactory` + interface + N classes each with one method and no state.

### Observer
- **Problem.** Notify independent parties of an event without the source knowing them.
- **Modern idiom.** Event emitters, signals, reactive streams (RxJS, Kotlin `Flow`, Combine), in-process domain events.
- **Use when.** ≥ 2 independent listeners inside one process; UI reactivity.
- **Don't when.** Across services (use a broker with a transactional outbox); when ordering or failure handling matters (hidden listeners swallow or reorder); when there's one listener (just call it).
- **Red flags.** Listener registration scattered at import time; memory leaks from never-unsubscribed listeners.

### Command
- **Problem.** Treat an action as data: queue, log, retry, undo.
- **Modern idiom.** Serializable action objects (`{ type: 'refund', orderId, amount }`), job payloads, Redux-style actions.
- **Use when.** Background jobs, undo/redo, audit logs, offline mutation queues.
- **Don't when.** A direct function call suffices.
- **Red flags.** Job payloads carrying full objects (stale snapshots) instead of IDs plus a schema version.

### State
- **Problem.** Behavior depends on a lifecycle state with guarded transitions.
- **Modern idiom.** Discriminated union + reducer `(state, event) => state`; statechart library (XState) for complex flows; Kotlin sealed classes + `when`; Swift enums.
- **Use when.** ≥ 3 states with transition rules (orders, uploads, payments, auth flows, wizards).
- **Don't when.** Two states — a boolean or optional is fine.
- **Red flags.** Several booleans that can contradict each other (`isPaid && isCancelled`).

### Template Method
- **Problem.** A fixed algorithm with variable steps.
- **Modern idiom.** A function taking the variable steps as function parameters.
- **Use when.** The skeleton is stable and steps vary.
- **Don't when.** Implemented via abstract base class and subclass overrides — prefer the higher-order function.

### Chain of Responsibility
- **Problem.** Pass a request through handlers until one handles it or all process it.
- **Modern idiom.** Middleware pipelines; an array of validator functions.
- **Use when.** HTTP pipelines, validation chains, pluggable processing.
- **Don't when.** A fixed list of `if` checks is clearer.

### Iterator
- **Modern idiom.** Language iterators, generators, async iterables, sequences, Go 1.23 range-over-func.
- **Rule.** Always use the built-in protocol; never write a custom `Iterator` class with `hasNext()`.

### Visitor
- **Problem.** Many operations over a closed set of node types.
- **Modern idiom.** Exhaustive pattern matching (`switch` with `never` check, `when`, `match`, Swift `switch`).
- **Use when.** Compilers, AST tooling in a language without pattern matching.
- **Don't when.** Business code — pattern matching covers it.

### Mediator
- **Problem.** Many objects interacting many-to-many.
- **Modern idiom.** One orchestrating function or service that coordinates collaborators.
- **Use when.** Coordination logic is otherwise scattered across peers.
- **Don't when.** It becomes a god object or a dispatch bus that only adds indirection (see CQRS mediator below).

### Memento
- **Modern idiom.** Snapshots of immutable state (undo stacks, drafts). With immutable data, a snapshot is just keeping the previous value.

### Interpreter
- **Problem.** Evaluate a small language.
- **Modern idiom.** Parser + AST + evaluator.
- **Don't when.** An existing parser/expression library exists — use it. Never `eval` user or model input.

## 4. Enterprise patterns agents misuse

### Repository
- **Good.** A port for loading/saving aggregates in a domain-rich core; lets you fake storage in tests of domain logic.
- **Bad.** Generic `IRepository<T>` with `getAll/getById/save` over an ORM that already provides this (Prisma, SQLAlchemy session, EF Core, ActiveRecord). It hides query capabilities (joins, projections, pagination) and invites N+1 and unbounded `getAll()`.
- **Default.** In CRUD-heavy apps, a data-access module of named query functions (`listOpenOrdersForTenant(tenantId, cursor)`). Add repositories for aggregates when domain logic is rich.

### Service layer
- **Good.** Application services that coordinate a use case: load, apply domain rules, persist, publish — with transactions.
- **Bad.** `UserService.getUser(id) { return userRepo.getUser(id) }` — pass-through methods.

### Unit of Work
- **Good.** Coordinating writes to several aggregates in one transaction.
- **Default.** Your ORM session/transaction is the unit of work; don't wrap it again.

### DTO ↔ domain ↔ persistence mapping
- **Good.** When the domain model differs meaningfully from storage or transport, and at public API boundaries (explicit output DTOs prevent leaking internal fields).
- **Bad.** Three identical classes per entity with mapper boilerplate in a CRUD app.

### Dependency Injection
- **Default.** Constructor/parameter injection wired in one composition root. Containers only where the framework expects them.
- **Red flags.** Property injection of required dependencies; containers resolving dependencies inside business logic.

### Service Locator
- **Always an anti-pattern** in application code: dependencies are hidden, tests depend on global registration order. Replace with constructor injection.

### Specification
- **Good.** Composable business predicates reused across queries and validation in rich domains.
- **Bad.** In CRUD apps — ceremony around a `WHERE` clause.

### CQRS mediator / in-process command bus
- **Good.** Large codebases with many handlers and cross-cutting pipeline behaviors.
- **Bad.** Small apps where every call goes `controller → mediator.send(cmd) → handler` with one handler per command — you lose "go to definition" for nothing. Full CQRS with separate read models is an architecture decision (see `software-architecture`).

## Sources

- Gamma, Helm, Johnson, Vlissides, *Design Patterns* (1994)
- Peter Norvig, "Design Patterns in Dynamic Languages" (1996): https://norvig.com/design-patterns/
- refactoring.guru pattern catalog: https://refactoring.guru/design-patterns
- Martin Fowler, *Patterns of Enterprise Application Architecture* catalog: https://martinfowler.com/eaaCatalog/
- Mark Seemann, "Service Locator is an Anti-Pattern": https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/
- Sairyss, domain-driven-hexagon (pattern pros/cons, "recommendations for smaller APIs"): https://github.com/Sairyss/domain-driven-hexagon
- yonatankarp/software-design-skills (per-pattern "when NOT to use" framing): https://github.com/yonatankarp/software-design-skills
- Go 1.23 release notes (range over function iterators): https://go.dev/doc/go1.23
