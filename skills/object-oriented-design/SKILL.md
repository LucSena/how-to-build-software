---
name: object-oriented-design
description: Use when designing classes, objects, or interfaces, deciding between a class and plain functions, or untangling an OOP mess — god objects, Manager/Helper/Util classes, deep inheritance, getters and setters everywhere, singletons, anemic models, IFoo + FooImpl pairs. Covers what objects are for, class-vs-function defaults for TypeScript, Python, Kotlin, Swift, Go, Java, and C#, responsibility assignment (GRASP, CRC, role stereotypes), composition over inheritance, a Liskov checklist, value objects vs entities, tell-don't-ask and Law of Demeter, structural vs nominal interfaces, dependency injection without a framework, what to mock, polymorphism vs switch vs data-oriented design, and OOP critiques. Also use when the user asks "should this be a class?", "how do I split this class?", "inheritance or composition?", or "is this over-engineered?". Not for picking GoF patterns (use design-patterns), function-level cleanup (use clean-code), or module and service boundaries (use software-architecture).
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "design-patterns clean-code testing-strategy software-architecture dependency-management"
---

# Object-Oriented Design

Objects are a tool for three jobs: protecting an invariant, varying behavior behind a stable message where variation really exists, and owning a resource's lifecycle. Almost everything else is clearer as functions over plain data. This skill makes you design from messages and responsibilities rather than nouns, keep behavior next to the data it guards, compose instead of inherit, wire dependencies explicitly, and stop before OOP ceremony (`IFoo` + `FooImpl`, `*Manager` classes, five-level hierarchies) turns into cognitive load for the next reader.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Name the invariant, role, or resource before creating a class.** If you can't, write functions; a class with none of the three is a namespace with extra syntax.
2. **Put behavior where the data is (Information Expert).** Code that pulls fields out of an object to decide for it spreads the object's rules across callers.
3. **Compose; inherit only for sealed sum types, framework hooks, or a designed base one level deep.** Inheritance couples you to the parent's implementation and multiplies with every aspect that varies.
4. **Pick polymorphism or `switch` by what changes faster: types or operations.** This is the expression problem; both sides of the Martin–Muratori debate accept the axis.
5. **Define interfaces at the consumer, and only for two real implementations or an I/O boundary.** A single-implementation interface is indirection with no payoff.
6. **Construct valid objects, inject what varies, wire everything in one composition root.** No `init()`-before-use, no hidden globals, no container calls in business code.
7. **Follow the language and the codebase.** Kotlin sealed/`when`, Swift structs and protocols, Go consumer-side interfaces, Python dataclasses and `Protocol` beat a Java design ported line by line.
8. **Optimize for the reader's working memory.** If understanding one behavior needs five classes open, the design failed, however "SOLID" it looks.

## Workflow

- [ ] **Read the neighborhood.** How does the codebase already model similar things: classes or functions, DI style, error style, test doubles? Match it; propose a change separately.
- [ ] **Write the messages first.** List the calls a client wants to make (`cart.add(item)`, `invoice.issue(now)`, `notifier.send(msg)`) before choosing classes. Sandi Metz's framing: you have objects because you send messages, not the other way round.
- [ ] **Justify each class in one line:** the invariant it protects, the role it plays polymorphically, or the resource it owns. No line → a function or module.
- [ ] **Assign responsibilities** to the object holding the information (GRASP Information Expert). Check role stereotypes; split a class that is two stereotypes at once.
- [ ] **Choose the variation mechanism** with the table in "Polymorphism, switch, or data-oriented?". One variant today → concrete code.
- [ ] **Wire dependencies** through constructors in one composition root. Inject only clock, IDs/randomness, I/O, vendors, and config.
- [ ] **Test through the public API** (Metz grid below). Write one contract test per interface that has two or more implementations.
- [ ] **Verify:** count implementations per new interface (one → justify as a boundary or delete); inheritance depth ≤ 2; no new `Manager`/`Helper`/`Util` names; a newcomer finds the concrete behavior in ≤ 2 jumps from the call site. Fix and repeat.

## What objects are for

| Job | Examples | Signal |
|---|---|---|
| **Protect an invariant** | `Money` (amount + currency), `DateRange` (start ≤ end), `Cart` (totals match lines), a ledger, a state machine | A rule must hold across fields or across calls |
| **Vary behavior behind one message** | Storage adapters, payment providers, notification channels, drivers, plugins | Two or more real implementations, or a boundary you must fake in tests |
| **Own a resource lifecycle** | Connection pool, file handle, transaction, subscription, socket | Needs deterministic cleanup (`with`, `using`, `use`, `defer`, `try-with-resources`) |

Not a job for objects: modeling every noun in the domain, grouping unrelated functions, carrying data between layers (use records/structs/dataclasses), request handlers that validate → call → map, and pure calculations. Those are functions over plain data.

## Class or function?

Default: **a class when state, invariants, and behavior belong together, or for a polymorphic role; functions and modules otherwise.**

| Language | Stateless logic | Use a class/type when | Avoid |
|---|---|---|---|
| TypeScript | Exported functions; the module is the encapsulation boundary | Stateful client/cache/pool, ADT with invariants, framework requires it (Angular/Nest services) | Static-only `class Utils`, classes that only group functions, `this`-binding bugs in callbacks |
| Python | Module-level functions; `@dataclass` for data | Invariants, resources (context managers), `Protocol` roles | Java-style getters/setters (use attributes, then `@property`), a class with `__init__` + one method |
| Kotlin | Top-level and extension functions | `data`/`value class` for values, `sealed` hierarchies, stateful services | `companion object` full of helpers, `open` by default, `*Manager` objects |
| Swift | Free functions or static members on a case-less `enum`; `struct` for data | `class` only for identity or shared mutable state; `actor` for concurrency-safe state | Class inheritance for code sharing (use protocol extensions), `class` where a `struct` works |
| Go | Package functions; methods when there is receiver state | Types with invariants via unexported fields + `New…` constructor | `GetName()` getters (use `Name()`), interfaces before a second implementation |
| Java | Static methods in a `final` class when truly stateless; `record` for data | Anything stateful; `sealed` interfaces + records for sum types | `*ServiceImpl` for every entity, deep abstract base classes |
| C# | `static class` for stateless helpers; `record` for data | Stateful services, types with invariants, framework-registered services | Interfaces for every class "for DI", inheritance chains for reuse |

React: function components and hooks; as of 2026-09 a class component is still needed only for an error boundary (or use a small library that wraps one). Detail per language, including interfaces and value types: `references/per-language.md`.

## Assigning responsibilities

- **Information Expert first:** the object that has the data does the work. `order.total()`, not `OrderCalculator.total(order.getLines())`. This is the fix for Feature Envy and for most anemic "service" code.
- **Creator:** whoever aggregates or closely uses an object, or holds its initializing data, creates it.
- **Controller:** one non-UI object per use case coordinates the operation and delegates; it holds little state and no business rules.
- **Pure Fabrication:** invent a non-domain class (`Repository`, `Clock`, `EmailGateway`) when putting the job on a domain object would wreck its cohesion.
- **Protected Variations:** put a stable interface only in front of a variation you can already name (a second provider, a platform difference). Not in front of speculation.
- **Role stereotypes** (Wirfs-Brock): information holder, structurer, service provider, coordinator, controller, interfacer. A class that is two of them (a controller that also holds a lot of data) is a split candidate.
- **Name test:** a class name ending in `-er`/`-or`/`Manager` with one public method is usually a function (Yegge, "Execution in the Kingdom of Nouns"). If the only honest name contains "And", split.

All nine GRASP principles, CRC sessions, and worked examples: `references/responsibilities-and-grasp.md`.

## Composition over inheritance

Default: compose — inject a collaborator, delegate, or pass a function.

Inheritance is fine only when:
- It models a **closed sum type**: Kotlin `sealed`, Swift `enum` with associated values, TS discriminated union, Java `sealed interface` + `record`. That is a tagged union, not reuse.
- The **framework requires it** (`Activity`, `UIViewController`, Django class-based views, React error boundaries). Keep the subclass thin; put logic in plain collaborators.
- It is **one level deep**, a true is-a, the base is **designed and documented for extension**, and it passes the Liskov checklist.

Sandi Metz ("Nothing is Something"): inheritance is for specialization, not for sharing code. When two aspects vary independently, subclasses explode combinatorially (`House`, `RandomHouse`, `EchoHouse`, `RandomEchoHouse`). Isolate each varying aspect as a named role (`Orderer`, `Formatter`) and inject it.

## Liskov checklist

Run this on every subclass, interface implementation, or protocol conformance:

1. **Preconditions no stronger** — accepts every input the parent accepts.
2. **Postconditions no weaker** — returns at least what the parent promised.
3. **Invariants preserved.**
4. **History preserved** — does not make mutable what the parent treats as immutable (Square/Rectangle, `ReadOnlyList` vs `List`).
5. **No new surprise exceptions** — no `NotImplementedError` / `UnsupportedOperationException` overrides. Needing one means the interface is too wide; split it.
6. **No type checks in callers** — `if (x instanceof Special)` means substitution already failed.

Enforce it with a **contract test**: one suite written against the interface, run against every implementation (for example `InMemoryStorage` and `S3Storage`). This also keeps test fakes honest.

## Polymorphism, switch, or data-oriented?

This is the expression problem. Robert Martin's rule from his exchange with Casey Muratori: use polymorphism when types change faster than operations, and a `switch` when operations change faster than types. Muratori argued that enums and switches often win even when types grow; they did not settle it. The table resolves it for everyday code:

| Situation | Prefer |
|---|---|
| Closed set of variants you own; new operations added often (render, validate, price, serialize) | **Sum type + exhaustive `switch`/`when`/`match`** — the compiler flags every missed case |
| Open set of variants added by others (plugins, drivers, providers); operations stable | **Interface/protocol + dynamic dispatch** |
| Measured hot loop over many homogeneous items (simulation, rendering, bulk data) | **Data-oriented**: arrays of plain data + switch or lookup table, batch processing |
| One variant today, "maybe more later" | **Neither** — concrete code; add the mechanism when the second variant arrives |

Muratori's "Clean Code, Horrible Performance" benchmark reported switch- and table-based versions around 15× faster than the polymorphic version in a tight loop. Take the lesson where it applies: measured hot paths. Elsewhere, choose for clarity and change rate.

## Tell, don't ask — and the Law of Demeter

- **Tell, don't ask:** `account.withdraw(amount)` rather than `if (account.balance >= amount) account.balance -= amount`. The invariant stays in one place.
- **Fowler's caveat:** the underlying principle is co-locating data with the behavior that uses it. Query methods are fine. Over-applying the rule stuffs objects with unrelated display and formatting code.
- **Law of Demeter** (talk only to yourself, your parameters, objects you create, and your fields) is **not a dot-counting rule**. Fluent builders, collection pipelines, and navigating plain data (DTOs, JSON, records) are fine.
- **A real violation:** `order.getCustomer().getAddress().getCountry().getTaxRate()` inside business logic. Fix with Hide Delegate (`order.taxRate()`) or pass the needed value in as a parameter.

## Interfaces: structural vs nominal

| Typing | Languages | Where the interface lives |
|---|---|---|
| Structural (implicit) | Go, TypeScript, Python `typing.Protocol` | **At the consumer**, declaring only the methods it calls. Go's review guide: interfaces belong in the package that uses them, implementers return concrete types, and don't define interfaces "for mocking" or before they are used |
| Nominal (declared) | Kotlin, Swift, Java, C#, Rust traits | With the owner of the abstraction (the domain or port layer); Swift extensions can add conformance to types you don't own |

- A one-method interface in TS, Kotlin, Swift, or Python is usually better as a **function type**.
- No `IUserService` + `UserServiceImpl` pairs with one implementation and no boundary.
- Structural typing makes ID confusion easy (`userId: string` accepts an order ID). Use brands or newtypes where mixing values is a real risk.

## Dependency injection without a framework

- **Constructor injection by default.** Dependencies are visible, the object is valid once built, and there is no temporal coupling.
- **Composition root** (Mark Seemann): build the object graph in one place near the entry point (`main`, app bootstrap, per-request factory). Everything else just receives its collaborators.
- **Inject what is non-deterministic or slow:** clock, ID/random generator, database, HTTP and vendor clients, filesystem, config, LLM client. Don't inject pure helpers or value objects.
- **"Only one instance" is a wiring decision**, made in the composition root, not a property the class enforces. No new `getInstance()` singletons (Hevery: singletons lie about their dependencies).
- **No service locator.** `Container.get(Foo)` inside business code hides dependencies and fails at runtime rather than at construction.
- **No new DI container** unless the platform expects one (Spring, ASP.NET Core, NestJS, Angular, Hilt/Koin). Use the one the codebase already has.

```ts
// composition root (main.ts) — the only place that knows concrete types
const db = createPool(config.databaseUrl);
const orders = makeOrderService({ db, clock: systemClock, mailer: makeMailer(config.smtp) });
startHttpServer({ orders });
```

Language variants, value objects, and test wiring: `references/value-objects-and-di.md`.

## Value objects and entities

| Trait | Entity | Value object |
|---|---|---|
| Identity | Persists across changes (`User#42`) | None — defined by its attributes |
| Equality | By ID | By value |
| Mutability | State changes through methods that guard invariants | Immutable; "change" returns a new value |
| Examples | Order, Account, Booking | `Money`, `EmailAddress`, `DateRange`, `UserId` |

Wrap a primitive **only when there is an invariant, a unit, or a confusable sibling** (`UserId` vs `OrderId`, cents vs dollars). Wrapping every field in CRUD pass-through code is boilerplate. Validate in the constructor or factory so an invalid instance cannot exist.

## Rich model or anemic model?

- Fowler calls a model of getters/setters plus "service" classes holding all the logic anemic, and contrary to the point of objects. Functional domain modeling (Wlaschin) deliberately separates immutable data from pure functions and gets its safety from types instead.
- Both demand the same two things: **invariants live in one place** and **illegal states are unrepresentable**.
- **Rule:** complex invariants that change together (order lifecycle, ledger, bookings with overlap rules) → a rich aggregate class, *or* a module of pure functions over a sum-typed state — whichever is idiomatic in the codebase. Simple CRUD → a transaction script (handler + schema validation). No `OrderDomainService`/`OrderManager`/`OrderHelper` layering either way.

## Testing objects

Sandi Metz's "Magic Tricks of Testing" grid:

| Message | Query (returns, no side effect) | Command (side effect) |
|---|---|---|
| **Incoming** (public API of the object under test) | Assert the result | Assert the direct, public side effect |
| **Sent to self** (private) | Don't test | Don't test |
| **Outgoing** (to collaborators) | Don't assert | Expect it was sent (mock) |

- Mock **roles you own** (interfaces you defined, named for the role), never concrete classes or vendor SDKs directly ("Mock Roles, Not Objects", Freeman et al.). Wrap vendors in an adapter and integration-test the adapter.
- Default to real objects and in-memory fakes for I/O boundaries; mocks only for outgoing commands.
- Painful setup (many mocks, deep stubs) is design feedback: too many collaborators or a Demeter violation.

## Anti-patterns

| Anti-pattern | Symptom | Fix |
|---|---|---|
| `Manager`/`Helper`/`Util`/`Processor` class | Vague name, unrelated methods | Move each method to its Information Expert or a module named for the concept |
| Getters and setters everywhere | Logic lives outside the object | Expose behavior (`order.cancel()`), not fields |
| God object | One class knows and does most things | Split by role stereotype and reason to change |
| Deep inheritance for reuse | Must read 3+ classes to understand one | Compose; inject strategies |
| Singleton / global mutable state | Hidden dependencies, order-dependent tests | Composition root decides lifetime; inject |
| Service locator | `resolve()` calls in business code | Constructor injection |
| Interface per class | `IFoo` with one impl, no boundary | Delete until a second impl or boundary exists |
| Speculative hierarchy | `AbstractBaseFooFactory` with one subclass | Collapse Hierarchy, Inline Class |
| Refused bequest | Override throws `NotImplemented` | Split the interface; compose |
| Temporal coupling | `init()`/`setX()` required before use | Valid after construction; builders return finished objects |
| Train wreck through objects | `a.b().c().d()` in business logic | Hide Delegate; pass what's needed |
| Null checks in every caller | `if (x != null)` repeated | Null Object, optional with early return, or an "absent" variant |

## Gotchas

- **A class per noun.** Agents model `User`, `UserManager`, `UserService`, `UserHelper`, `UserValidator` for CRUD. Start from messages and invariants; most of those should be functions or nothing.
- **Anemic entity + fat service.** `OrderService.calculateTotal(order)` reading `order.getLines()` — move it to `order.total()` or a pure function beside the type.
- **Interfaces "for testability".** Fake the real I/O boundary instead; don't wrap pure logic in an interface with one implementation.
- **Abstract base class after one subclass.** Wait for the second real variant; then compare composition first.
- **Replacing a clean `switch` over a closed union with a class hierarchy** because "conditionals are a smell". If operations change faster than types, the switch is the better design.
- **Adding a DI container, event bus, or mediator** to a codebase that wires by hand. Ask first (see `design-patterns`).
- **Mocking what you don't own.** Mocking a vendor SDK encodes your guess about its behavior into the tests. Adapter + integration test.
- **Setters to make testing easier.** Pass collaborators through the constructor instead; setters break invariants and add temporal coupling.
- **Java-shaped Go/Python/Swift.** `GetName()`, ABCs for every role, `class` where a `struct` fits. Use the language's idioms (`references/per-language.md`).
- **Performance "refactors" into polymorphism** in a hot loop. Profile first; data-oriented code may be the right design there — say why in a comment.
- **Dot-counting Demeter.** Rewriting `items.filter(…).map(…)` or `dto.address.city` into delegate methods adds noise without reducing coupling.

## Output format

When designing:

```
Design: <one sentence — what the objects collectively do>
Objects:
- <Name> — protects <invariant> | plays role <role> | owns <resource>; collaborators: <…>
Plain functions/modules: <logic kept out of classes, and why>
Variation: <sum type + switch | interface | none> — <what changes faster, number of real variants>
Wiring: <composition root location; what is injected>
Rejected: <class/interface/inheritance considered and why not>
Tests: <incoming queries/commands asserted; roles mocked; contract tests>
```

When reviewing existing OOP code, list findings as `anti-pattern → evidence (file:symbol) → fix → why`, ordered by impact, and mark each as Observed or Inferred.

## References

| File | Read when |
|---|---|
| `references/responsibilities-and-grasp.md` | Deciding which class owns a behavior, running a CRC-style design pass, splitting a god object, or naming classes |
| `references/composition-and-polymorphism.md` | Replacing inheritance, choosing between polymorphism, sum types, and data-oriented code, or checking a subtype against Liskov |
| `references/value-objects-and-di.md` | Introducing value objects or IDs, wiring dependencies by hand, removing singletons or a service locator, or deciding what to mock |
| `references/per-language.md` | Writing classes, interfaces, value types, or DI in TypeScript, Python, Kotlin, Swift, Go, Java, or C# |
| `references/critiques-and-tradeoffs.md` | Someone argues OOP vs FP, rich vs anemic models, or clean code vs performance, or a hot path suggests data-oriented design |

## Related skills

- `design-patterns` — when a specific pattern (strategy, adapter, state machine, repository) is on the table, or needs removing.
- `clean-code` — naming, function shape, error handling, and refactoring moves inside the classes.
- `testing-strategy` — test levels, doubles, and contract tests for the objects you designed.
- `software-architecture` — when the question is module, layer, or service boundaries rather than objects.
- `dependency-management` — before wrapping or adding a third-party library behind an adapter.
