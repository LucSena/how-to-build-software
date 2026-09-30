# Functional Patterns

Functional techniques are available in every mainstream language now. Use them to make states explicit, keep side effects at the edges, and replace class hierarchies with data plus functions. Adopt heavier machinery (effect systems, monad transformers) only team-wide.

## Contents
1. Functional core, imperative shell
2. Algebraic data types and exhaustive matching
3. Result / Either for expected failures
4. Option and null safety
5. Pipelines and immutable updates
6. Higher-order functions instead of classes
7. Memoization
8. Effect systems — when not to

## 1. Functional core, imperative shell

**Rule.** Put decisions in pure functions (data in → data out); put I/O, time, randomness, and logging in a thin shell that calls them.
**Apply when.** Any business rule: pricing, eligibility, scheduling, permission decisions, state transitions.
**Do / Avoid.** Do: `const decision = decideRefund(order, policy, now)` in the core, then the shell performs the refund. Avoid: `decideRefund` that queries the database, reads `Date.now()`, and calls Stripe.
**Why.** Pure code is deterministic and testable without mocks; the shell is thin enough to cover with a few integration tests (Gary Bernhardt's "Boundaries").

## 2. Algebraic data types and exhaustive matching

**Rule.** Model "one of these cases, each with its own data" as a sum type, and branch on it exhaustively.
**Apply when.** States (`loading | error | success`), outcomes, commands/events, AST nodes, payment methods.
**Do / Avoid.** Do the per-language forms below. Avoid: an object with optional fields and booleans whose valid combinations live in comments.
**Why.** The compiler checks every branch when a case is added; impossible states can't be constructed.

```ts
// TypeScript
type Upload =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "failed"; error: string }
  | { status: "done"; url: string };

function label(u: Upload): string {
  switch (u.status) {
    case "idle": return "Choose a file";
    case "uploading": return `${Math.round(u.progress * 100)}%`;
    case "failed": return `Failed: ${u.error}`;
    case "done": return "Uploaded";
    default: { const _never: never = u; return _never; }
  }
}
```

```kotlin
// Kotlin
sealed interface Upload {
    data object Idle : Upload
    data class Uploading(val progress: Double) : Upload
    data class Failed(val error: String) : Upload
    data class Done(val url: String) : Upload
}
```

```swift
// Swift
enum Upload { case idle, uploading(progress: Double), failed(error: String), done(url: URL) }
```

```python
# Python 3.10+
@dataclass(frozen=True)
class Uploading: progress: float
@dataclass(frozen=True)
class Done: url: str
Upload = Uploading | Done   # match upload: case Uploading(progress=p): ...
```

Go has no sum types: use a small interface with an unexported marker method and a type switch, or a struct with a `Kind` enum — and add a test that covers every kind.

## 3. Result / Either for expected failures

**Rule.** When a failure is an expected, typed outcome that callers must handle, return it as a value.
**Apply when.** Parsing, validation, domain operations with named failure cases — and only if the codebase or language favors it (see `clean-code` error-handling reference).
**Do / Avoid.** Do: `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }` with a closed `E` union. Avoid: `Result<T, Error>` with a generic error (no better than throwing), or mixing `Result` and exceptions for the same failure.
**Why.** The signature documents the failure modes and the type checker enforces handling.

| Language | Default |
|---|---|
| TypeScript | Hand-rolled union as above, or neverthrow/Effect if the team has adopted it |
| Kotlin | Sealed interface of outcomes; Arrow `Either` if adopted; stdlib `Result` is fine for simple cases but carries `Throwable` |
| Swift | `throws` (typed throws for closed sets) or `Result` at callback/async boundaries |
| Python | Exceptions are idiomatic; don't introduce Result types unilaterally |
| Go | `(T, error)` returns |

## 4. Option and null safety

**Rule.** Make absence explicit in the type and handle it where the value enters the system.
**Apply when.** Any value that may legitimately be missing.
**Do / Avoid.** Do: TS `strictNullChecks`, Kotlin `T?`, Swift optionals, Python `T | None` with a type checker; convert to non-null once (`requireNotNull`, `guard let`). Avoid: `!`/`!!` to silence the checker; `null` meaning both "absent" and "failed".
**Why.** Null checks scattered everywhere indicate the boundary didn't decide.

## 5. Pipelines and immutable updates

**Rule.** Express data transformations as named steps over immutable values.
**Apply when.** Filtering, mapping, grouping, aggregating collections; updating nested state.
**Do / Avoid.** Do: `orders.filter(isOpen).map(toSummary)`; `{ ...state, items: [...state.items, item] }`; Kotlin `copy()`, Python `dataclasses.replace`. Avoid: 5+ chained steps with side effects in the middle; clever point-free chains nobody can debug.
**Why.** Named steps read like the specification; immutability removes aliasing bugs.

Performance notes: chained `map/filter` allocate intermediate arrays in JS — fine for UI-sized data, profile for hot paths. Kotlin `asSequence()` and Swift `.lazy` avoid intermediates for large collections.

## 6. Higher-order functions instead of classes

**Rule.** Pass behavior as functions when an interface would have a single method.
**Apply when.** Strategy, Template Method, Command, Decorator, callbacks, retry policies, comparators.
**Do / Avoid.** Do: `withRetry(fn, { attempts: 3 })`; `sortBy(users, u => u.lastName)`. Avoid: `interface Comparator { compare(a, b) }` + `LastNameComparator` class. Avoid excessive currying and partial application — readability first.
**Why.** Less code, same flexibility; the function signature is the interface.

Kotlin `fun interface`, Swift closures, Python callables, and Go function types all serve this.

## 7. Memoization

**Rule.** Cache results of pure, expensive functions keyed by their inputs.
**Apply when.** Measured cost, repeated identical inputs, pure function.
**Do / Avoid.** Do: `functools.cache` on a pure function; a bounded LRU for unbounded input spaces. Avoid: memoizing impure functions (stale results); unbounded caches keyed by user input (memory leak).
**Why.** Memoization is caching — it inherits cache invalidation and memory-bound problems.

## 8. Effect systems — when not to

Effect-TS, Arrow, and ZIO-style systems give typed errors, dependency injection, retries, and resource safety in one model. They are powerful and pervasive: once in, every function signature changes. **Default: don't introduce one in an existing codebase or on your own initiative.** Adopt only as a team decision recorded in an ADR, with training.

## Sources

- Gary Bernhardt, "Boundaries" (functional core, imperative shell): https://www.destroyallsoftware.com/talks/boundaries
- Alexis King, "Parse, don't validate": https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
- TypeScript handbook, narrowing and exhaustiveness checking: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Kotlin sealed classes and interfaces: https://kotlinlang.org/docs/sealed-classes.html
- Swift enumerations with associated values: https://docs.swift.org/swift-book/documentation/the-swift-programming-language/enumerations/
- Python structural pattern matching (PEP 636): https://peps.python.org/pep-0636/
- Arrow (Kotlin) typed errors: https://arrow-kt.io/learn/typed-errors/
