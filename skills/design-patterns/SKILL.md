---
name: design-patterns
description: Use when deciding whether a design pattern fits, choosing between patterns, or when code feels over- or under-abstracted. Covers GoF patterns in modern languages (factory, builder, singleton, adapter, facade, decorator, strategy, observer, command, state, visitor), dependency injection, repository and service layers, plugins and middleware, functional patterns (algebraic data types, Result, pipelines, higher-order functions), React/frontend patterns (composition, compound components, custom hooks, headless components, state machines, server vs client components), and anti-patterns (god object, singleton abuse, service locator, anemic model misuse, premature abstraction, inheritance for reuse). Also use when the user asks "which pattern should I use", "how do I make this extensible", "too many if/else", "should this be a class", or "is this over-engineered". Not for module or service boundaries (use software-architecture) or line-level cleanup like naming and function size (use clean-code).
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "clean-code software-architecture frontend-architecture code-review"
---

# Design Patterns

Patterns are vocabulary for solutions to recurring problems, not goals. In TypeScript, Python, Kotlin, Swift, and Go, most classic patterns collapse into a function, a closure, a union type, or a language feature — Norvig showed in 1996 that 16 of the 23 GoF patterns become invisible or simpler with first-class functions and dynamic types. This skill makes you start from the problem, try the simplest thing, and reach for a named pattern only when a forcing problem exists today — and it makes you remove patterns that no longer earn their keep.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Follow the codebase's existing conventions first.** If the repo already solves this problem one way (its DI style, its state library, its event mechanism), use that; a second mechanism for the same job is worse than either.
2. **Name the forcing problem before the pattern.** If you can't state the problem in one sentence with a concrete current example, there is no pattern to apply.
3. **Climb the ladder: plain code → language feature → pattern → framework.** Stop at the first rung that solves today's problem.
4. **Two real variants or a real boundary.** Add indirection only when a second implementation exists now, or at an I/O boundary you must swap or fake (database, network, clock, vendor SDK, LLM).
5. **Composition over inheritance.** Inherit only for true is-a relationships with an honored contract, at most 1–2 levels; keep classes final/sealed by default.
6. **Every pattern has a removal condition.** When variants drop back to one, inline it.

## Workflow

- [ ] **State the problem** in one sentence with a concrete example from this code ("pricing differs for 3 customer tiers and product adds a tier every quarter").
- [ ] **Check the codebase** for an existing mechanism (grep for `Strategy`, `Factory`, `EventEmitter`, `middleware`, DI setup, state machines). Reuse it if it fits.
- [ ] **Write or sketch the simplest version** (a function, a `switch`, a map of functions, data). If it reads well and the change rate is low, stop here.
- [ ] **Look up the problem** in the decision table below. Apply the pattern only if its trigger threshold is met; otherwise record "revisit when…".
- [ ] **Implement in the language's idiom** (`references/gof-catalog.md`, `references/functional-patterns.md`, `references/frontend-patterns.md`), not a Java-shaped translation.
- [ ] **Verify:** count implementations of each new interface/abstract type (one → justify as a boundary or remove); confirm a newcomer can find the concrete behavior in ≤ 2 jumps from the call site.
- [ ] **Report** in the Output format, including the simpler option you rejected and why.

## Problem → simplest thing → pattern

| Problem | Simplest thing first | Pattern when needed | Trigger |
|---|---|---|---|
| Pick an algorithm/policy at runtime | `switch` or a `Record<Key, Fn>` / dict of functions | Strategy (interface + implementations) | Strategies carry their own config/state, or ≥ 3 variants added by different people |
| Same type-tag `switch` repeated in many places | Exhaustive `switch`/`when`/`match` over a union or sealed type | Polymorphism (interface per variant) | Variant set is open to extension by other modules/teams |
| Many optional constructor params | Named/default args or an options object | Builder | Staged construction with validation, or an immutable object built incrementally (query builders) |
| Construction depends on config/platform | A factory *function* returning an interface | Abstract Factory | Families of related objects must vary together (rare) |
| Isolate a vendor SDK or external API | Adapter module implementing *your* interface | Adapter / anti-corruption layer | Justified from the first vendor — it's a boundary |
| Hide a complicated subsystem | One module exporting a few functions | Facade | It must actually simplify (deep), not forward 1:1 |
| Cross-cutting concern (logging, retries, auth, caching, metrics) | Higher-order function / language decorator | Decorator / middleware chain | Applied to ≥ 2 call sites; keep the stack short and visible |
| Notify others when something happens (in-process) | Direct call or callback | Observer / event emitter / signals | ≥ 2 independent listeners, and listeners must not be known by the emitter |
| Notify other services | — | Transactional outbox + broker (see `scalability`) | Never an in-process observer across services |
| Lifecycle with states and guarded transitions | Discriminated union + reducer function | State machine / statechart | ≥ 3 states, transitions with guards, or impossible states are causing bugs |
| Undo/redo, queueing, audit, retries of actions | Plain function call | Command (serializable action objects) | Actions must be stored, replayed, or undone |
| Exactly one shared resource (pool, config) | Create once at startup, pass it in | Module-level instance / DI singleton scope | Never a global `getInstance()` accessor |
| Data access | Query functions or the ORM used directly in a data-access module | Repository | Rich domain aggregates, or a storage boundary you truly swap/fake |
| Third parties extend your app | Configuration or a hook function | Plugin interface | ≥ 2 real plugins or external authors exist |
| Tree of parts and wholes | Recursive type | Composite | Uniform operations over nested structures (UI trees, ASTs) |
| Traverse a closed AST/union with many operations | Exhaustive pattern matching | Visitor | Only in languages without pattern matching |

## Language collapse cheatsheet

| Pattern | TypeScript | Python | Kotlin | Swift | Go |
|---|---|---|---|---|---|
| Strategy | function / map of functions | function / dict | lambda / `fun interface` | closure / protocol | func type / small interface |
| Builder | options object | keyword args with defaults | named + default args, `apply {}` | memberwise init with defaults | functional options (`WithTimeout(…)`) or config struct |
| Singleton | ES module instance | module instance | `object` | `static let shared` (still inject it) | package-level var set in `main` |
| Decorator | higher-order function / middleware | `@decorator` | delegation `by` | wrapper conforming to protocol | wrapper implementing interface / `http.Handler` middleware |
| Iterator | generators, `for…of` | generators | `Sequence` / `Flow` | `Sequence` / `AsyncSequence` | range over func (Go 1.23+), channels |
| Visitor | union + exhaustive `switch` | `match` | sealed + `when` | `enum` + `switch` | type switch |
| Template Method | higher-order function with hooks | function taking callables | function with lambda params | function with closure params | function with func params |

## Composition, inheritance, and DI

- **Inheritance only for substitutable is-a** with the parent's contract honored (Liskov). Never to share code — extract a function or compose an object instead.
- **Final/sealed by default.** Kotlin classes are final already; Swift `final class`; in TS prefer functions and composition.
- **Constructor injection is the default DI.** Wire objects in one composition root (app startup, `main`, framework provider). A DI container is optional — adopt one only if the framework expects it (Spring, Hilt, NestJS, FastAPI `Depends`).
- **Interfaces at boundaries, not everywhere.** Database, HTTP clients, clock, randomness, filesystem, LLM providers, message brokers. Internal pure logic uses concrete types.
- **Service locator is an anti-pattern:** it hides dependencies and makes tests order-dependent.

## Worked example: the right amount of structure

Shipping cost varies by method. Grow the structure only as the forcing problem grows.

```ts
// Stage 1 — two or three stable formulas: an exhaustive switch is enough.
type Method = "standard" | "express" | "pickup";
function shippingCost(method: Method, order: Order): Money {
  switch (method) {
    case "standard": return flatRate(order, 499);
    case "express":  return flatRate(order, 1299);
    case "pickup":   return ZERO;
  }
}

// Stage 2 — methods are selected from config and listed in the UI: a map of functions.
const shippingRules: Record<Method, (o: Order) => Money> = {
  standard: (o) => flatRate(o, 499),
  express:  (o) => flatRate(o, 1299),
  pickup:   () => ZERO,
};

// Stage 3 — carriers with their own credentials, rate APIs, and retries, added by
// another team: now an interface (Strategy + Adapter) earns its place.
interface Carrier { quote(order: Order): Promise<Money> }
```

Stage 3 at stage 1 is over-engineering; stage 1 at stage 3 is a 400-line `switch`. Move up a stage when the trigger in the decision table is met, and write down the trigger you saw.

## Removing a pattern

Patterns outlive their reasons. When you find one with a single implementation, a factory building one type, an event with one listener, or a strategy map with one entry:

- [ ] Confirm with a search that there is no second use (including tests, config, and plugins).
- [ ] Inline the concrete implementation at the call sites (Inline Class/Function); delete the interface, factory, or registry.
- [ ] Keep tests green after each step; commit the removal separately from behavior changes.
- [ ] Keep boundary adapters (vendor SDKs, clock, database) even with one implementation — they exist for isolation and tests.

## Frontend patterns (summary)

- **Composition over configuration:** `children`/slots and compound components (`<Tabs><Tabs.List/>…`) instead of one component with 20+ boolean props.
- **Headless primitives** (Radix, React Aria, Ark UI, TanStack Table) for behavior and accessibility; style with the design system.
- **Custom hooks** for reusable stateful logic, one concern each.
- **Derive, don't sync:** compute derived values during render; `useEffect` only to synchronize with external systems.
- **Server state ≠ client state:** a data-fetching cache (TanStack Query, SWR, or server components) for server data; small local/client store for UI state; the URL for filters and pagination.
- **Server components by default, `"use client"` at interactive leaves;** server actions are public endpoints — authenticate, authorize, and validate in each.
- **React Compiler:** where enabled, stop adding `useMemo`/`useCallback`/`memo` by reflex; memoize only after profiling.

Details, code, and when-not for each: `references/frontend-patterns.md`.

## Gotchas

- **Java-shaped patterns in expressive languages.** A `PricingStrategy` interface, three classes, and a `PricingStrategyFactory` for three one-line formulas. Use a map of functions.
- **Interface + one implementation "for testability".** Fake the real I/O boundary instead; delete single-implementation interfaces you introduced that sit in front of pure logic.
- **Generic `Repository<T>` over an ORM.** Prisma, SQLAlchemy, EF Core, and ActiveRecord already are repositories/units of work. A lowest-common-denominator wrapper hides their query power and adds nothing.
- **`XService` that forwards every call to `XRepository`.** A shallow pass-through layer. Put logic there or remove it.
- **Singletons with global access.** `Config.getInstance()` inside business logic creates hidden dependencies and test pollution. Create once, inject.
- **Observer for control flow that must be ordered or must fail loudly.** Hidden listeners make failures invisible. Use direct calls when order and errors matter.
- **Event bus inside a small app.** Indirection that makes "who handles this?" unanswerable. Direct calls until decoupling is a real need.
- **Plugin systems and config DSLs for one use** (inner-platform effect). Build the feature; generalize after the second real case.
- **State as booleans.** `isLoading && !isError && data` combinations produce impossible states. Use a union or a state machine.
- **`useEffect` to derive state or fetch data.** Causes extra renders and race conditions. Derive in render; use a data library or server components.
- **Mixing paradigms per module.** Half `Result`, half exceptions; half classes, half functions for the same concept. Pick the codebase's style.

## Output format

When recommending or reviewing a pattern:

```
Problem: <one sentence, with the concrete current case>
Simplest option considered: <plain code / language feature> — <why it is or isn't enough>
Recommendation: <pattern or "no pattern">, in <language idiom>
Why not simpler: <the trigger that is met — count of variants, boundary, change rate>
Cost: <indirection added, files added>
Revisit/remove when: <condition>
Sketch: <≤ 20 lines of code in the project's language>
```

When the answer is "no pattern", say so plainly and show the simple version.

## References

| File | Read when |
|---|---|
| `references/gof-catalog.md` | Considering or reviewing a specific GoF pattern, or an enterprise pattern (repository, service layer, unit of work, DI, specification) |
| `references/functional-patterns.md` | Modeling states/outcomes with unions or sealed types, using `Result`/`Option`, building pipelines, or replacing class hierarchies with functions |
| `references/frontend-patterns.md` | Designing React (or similar) component APIs, hooks, state handling, server/client component boundaries, or multi-step UI flows |
| `references/anti-patterns.md` | Reviewing a design for over-engineering or structural problems, or naming what is wrong with existing code |

## Related skills

- `clean-code` — naming, function shape, error handling, and refactoring moves inside the chosen design.
- `software-architecture` — when the question is module or service boundaries, layering, or architecture style.
- `frontend-architecture` — rendering strategy, state ownership, and folder structure for web apps.
- `code-review` — to review a change for pattern misuse and over-abstraction.
