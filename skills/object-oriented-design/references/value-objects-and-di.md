# Value Objects, Dependency Injection, and Testing Objects

Use this file when introducing value objects or typed IDs, wiring dependencies by hand, removing singletons or a service locator, or deciding what to mock.

## Contents
1. Entities and value objects
2. Value-object idioms per language
3. Immutability without pain
4. Constructor injection and the composition root
5. Removing singletons and service locators
6. When a DI container is justified
7. Testing objects: what to assert, what to mock

## 1. Entities and value objects

From Eric Evans's *Domain-Driven Design* and Fowler's "ValueObject" entry:

- **Entity:** identity persists while attributes change. Equality by ID. Mutations go through methods that keep its invariants (`booking.reschedule(range)`).
- **Value object:** defined entirely by its attributes, immutable, equal by value. It validates on construction, so an invalid instance cannot exist.

**When to introduce a value object** (any one is enough):
- An **invariant** across fields: `DateRange` start ≤ end; `Money` never mixes currencies.
- A **unit**: `Cents`, `Duration`, `Meters` — prevents seconds-vs-milliseconds bugs.
- A **confusable sibling**: `UserId` vs `OrderId` are both strings; a typed ID makes swapping them a compile error.
- A **format with rules**: `EmailAddress`, `Iban`, `Slug` — parse once at the boundary, trust the type inside.

**When not to:** CRUD pass-through fields with no rule (a `Nickname` wrapper around a string that is only stored and displayed). That is boilerplate, and it makes every mapper longer.

## 2. Value-object idioms per language

| Language | Value object | Typed ID ("brand"/newtype) |
|---|---|---|
| TypeScript | `readonly` fields + factory returning a parsed type, or a schema (Zod/Valibot) with a brand | `type UserId = string & { readonly __brand: "UserId" }` |
| Python | `@dataclass(frozen=True, slots=True)` + `__post_init__` validation | `UserId = NewType("UserId", str)` (checked by the type checker only) |
| Kotlin | `data class` with `val`s + `init { require(...) }` | `@JvmInline value class UserId(val raw: String)` |
| Swift | `struct` (value semantics) + throwing or failable `init` | `struct UserId: Hashable { let raw: String }` |
| Go | Unexported fields + `NewMoney(...) (Money, error)`; pass by value | `type UserID string` (a distinct named type) |
| Java | `record` with validation in the compact constructor | `record UserId(String value)` |
| C# | `record` / `readonly record struct` with validation in the constructor or a factory | `readonly record struct UserId(Guid Value)` |
| Rust | Newtype + `TryFrom` | `struct UserId(String)` |

Example (Kotlin):

```kotlin
data class Money(val cents: Long, val currency: Currency) {
    init { require(cents >= 0) { "negative money" } }
    operator fun plus(other: Money): Money {
        require(currency == other.currency) { "currency mismatch" }
        return copy(cents = cents + other.cents)
    }
}
```

## 3. Immutability without pain

- Return a new value instead of setting: `order.withStatus(PAID)`, Kotlin `copy()`, Python `dataclasses.replace`, TS spread, Swift `var` copy of a `struct`.
- Keep mutable state inside a **small number of owners**: aggregates, stores, actors. Everything else passes values.
- Rich Hickey ("Simple Made Easy") calls unmanaged mutable objects the place where value and time get braided together; values can be shared, cached, queued, and compared safely.
- Pass `now`, IDs, and randomness **in** as values so decisions stay pure and testable (functional core, imperative shell).

## 4. Constructor injection and the composition root

**Constructor injection** is the default: the object states what it needs, is valid when built, and can't be used half-initialized. **Composition root** (Mark Seemann): wire the graph in one place near the entry point. Only that place knows concrete classes.

| Language | Lightweight form |
|---|---|
| TypeScript/JS | Factory functions taking a `deps` object: `makeOrderService({ db, clock, mailer })` returns an object of functions; or classes with constructor params |
| Python | Constructor args, optionally with production defaults (`clock: Clock = SystemClock()`); or module functions that take collaborators as parameters |
| Go | Struct fields set by `NewX(...)` in `main.go`; accept interfaces, return structs |
| Kotlin | Primary-constructor params; default arguments for production implementations |
| Swift | `init` params; protocol-typed where a boundary exists; default arguments |
| Java/C# | Constructor params (C# 12 primary constructors or Java records keep it short); wire in `main` or the framework's container if it already has one |

```go
// main.go — composition root
func main() {
    cfg := config.MustLoad()
    db := postgres.MustOpen(cfg.DatabaseURL)
    mailer := smtp.NewMailer(cfg.SMTP)
    orders := orders.NewService(db, mailer, clock.System{})
    http.ListenAndServe(cfg.Addr, api.NewRouter(orders))
}
```

**Inject:** clock, ID/random generator, database, HTTP and vendor clients, filesystem, environment/config, LLM client, message publisher.
**Don't inject:** pure helpers, value objects, and your own stateless domain functions. Call them directly.

**Per-request scope:** create request-scoped objects (current user, transaction, tenant) in a per-request factory called from the root, not by reaching into globals.

## 5. Removing singletons and service locators

Miško Hevery ("Singletons are Pathological Liars"): a class that reaches a global through a static accessor lies about what it depends on, and tests become order-dependent. Seemann: a service locator hides dependencies and fails at runtime instead of at construction.

Procedure:
- [ ] Find the accessors: `getInstance()`, `shared`, `Container.get/resolve`, module-level mutable instances imported deep in business code.
- [ ] For one consumer at a time, add a constructor parameter for the dependency, defaulting to the old global so callers still compile.
- [ ] Create the instance once in the composition root and pass it down; remove the default.
- [ ] When no consumer uses the accessor, delete it. "Only one instance" now lives in the root as a wiring decision.
- [ ] Tests construct their own instances or fakes; remove any global reset hooks.

Language-level single instances (Kotlin `object`, an ES module-level instance) are fine for **stateless** things. For anything with state or I/O, create it in the root and inject it.

## 6. When a DI container is justified

- The platform expects one: Spring, ASP.NET Core, NestJS, Angular, Android Hilt/Koin, FastAPI `Depends`. Use it the way the framework intends; keep business classes free of container calls.
- The graph is large (dozens of services with different lifetimes) and hand-wiring has become the bottleneck.

Otherwise wire by hand. Don't introduce a container into a codebase that doesn't already have one without asking; it changes how every future class is written.

## 7. Testing objects: what to assert, what to mock

Sandi Metz's grid ("Magic Tricks of Testing", RailsConf 2013), applied:

| Message | Test |
|---|---|
| Incoming query (`cart.total()`) | Assert the returned value |
| Incoming command (`cart.add(item)`) | Assert the direct public effect (`cart.total()` changed, a row exists) |
| Private methods | Don't test; they are covered through the public API |
| Outgoing query (`priceList.priceOf(sku)`) | Don't assert it was called; stub the answer if needed |
| Outgoing command (`mailer.send(receipt)`) | Expect it was sent, with the right arguments |

From *Growing Object-Oriented Software, Guided by Tests* (Freeman and Pryce) and "Mock Roles, Not Objects" (OOPSLA 2004):
- **Mock roles you own:** interfaces you defined, named for the role (`ReceiptSender`), not concrete classes.
- **Don't mock what you don't own.** Wrap a vendor SDK in an adapter, integration-test the adapter against the sandbox or an emulator, and mock or fake your adapter's interface elsewhere.
- **Listen to the tests.** Many mocks, deep stub chains, or long setup mean the object has too many collaborators or reaches through them (Demeter).

Default style: classicist — real objects plus in-memory fakes at I/O boundaries; mocks only for outgoing commands (Fowler, "Mocks Aren't Stubs"). Keep every fake honest with the contract test described in `composition-and-polymorphism.md`.

## Sources

- Eric Evans, *Domain-Driven Design* (2003); Martin Fowler, "ValueObject": https://martinfowler.com/bliki/ValueObject.html
- Rich Hickey, "Simple Made Easy" (Strange Loop 2011): https://www.infoq.com/presentations/Simple-Made-Easy
- Gary Bernhardt, "Boundaries" (SCNA 2012): https://www.destroyallsoftware.com/talks/boundaries
- Mark Seemann, "Composition Root": https://blog.ploeh.dk/2011/07/28/CompositionRoot/ · "Service Locator is an Anti-Pattern": https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/
- Miško Hevery, "Singletons are Pathological Liars" (2008): http://misko.hevery.com/2008/08/17/singletons-are-pathological-liars/
- Go Code Review Comments, Interfaces: https://go.dev/wiki/CodeReviewComments#interfaces
- Sandi Metz, "The Magic Tricks of Testing" (RailsConf 2013): https://speakerdeck.com/skmetz/magic-tricks-of-testing-railsconf
- Steve Freeman and Nat Pryce, *Growing Object-Oriented Software, Guided by Tests* (2009): http://www.growing-object-oriented-software.com/
- Freeman, Pryce, Mackinnon, Walnes, "Mock Roles, Not Objects" (OOPSLA 2004): http://jmock.org/oopsla2004.pdf
- Martin Fowler, "Mocks Aren't Stubs": https://martinfowler.com/articles/mocksArentStubs.html
