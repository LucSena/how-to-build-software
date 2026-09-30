# Language Idioms

The idiomatic default per language, and the mistakes agents make when they carry habits from one language into another. The repository's own config and conventions override everything here. Tool names are examples as of 2026-09; use what the project already has.

## Contents
1. TypeScript
2. Python
3. Kotlin
4. Swift
5. Go
6. Cross-language translation traps

## 1. TypeScript

**Compiler and lint baseline**
- `strict: true`, plus `noUncheckedIndexedAccess` (array/record access returns `T | undefined`) and `exactOptionalPropertyTypes` where the codebase tolerates it.
- typescript-eslint with type-aware rules; at minimum `no-floating-promises`, `no-misused-promises`, `switch-exhaustiveness-check`, `consistent-type-imports`. Formatter: whatever the repo uses (Prettier or Biome) — never hand-format.

**Types**
- `unknown` instead of `any` for untrusted values; narrow with a schema (Zod, Valibot, ArkType) and infer the static type from the schema (`z.infer<typeof Schema>`) so there is one source of truth.
- Discriminated unions for states and outcomes; exhaustive `switch` with a `never` check in the default branch.
- `readonly` properties and `ReadonlyArray`; `as const` for literal tables.
- Branded types for IDs that must not mix: `type UserId = string & { readonly __brand: "UserId" }`.
- Prefer `type` aliases for unions and object shapes; `interface` when you need declaration merging or the codebase prefers it. Be consistent.
- Avoid `enum` in new code unless the repo uses it; a union of string literals plus an `as const` object is simpler and tree-shakes.
- No non-null assertions (`!`) to silence the compiler; fix the type.

**Structure**
- Modules and functions before classes. A class earns its place with state plus invariants, or when a framework requires it.
- Explicit public surface per feature folder (`index.ts` exporting only what others may use); don't deep-import another feature's internals.
- Avoid barrel files that re-export entire trees in large apps — they slow bundlers and test runners and create import cycles.

**Async**
- Every promise awaited, returned, or explicitly `void`-ed with a comment.
- `Promise.all` for independent work; `Promise.allSettled` when partial failure is acceptable; never `await` inside a loop over independent items (sequential latency, N+1).
- `AbortSignal` for cancellation and timeouts (`AbortSignal.timeout(ms)`).

**Agent mistakes**
- Sprinkling `as SomeType` casts to make errors go away; `// @ts-ignore` instead of `@ts-expect-error` with a reason.
- `Object`/`Function`/`{}` as types.
- Java-style `IUserService` + `UserServiceImpl` pairs.

## 2. Python

**Tooling baseline**
- Type hints on all public functions; a type checker in CI (mypy or pyright, strict where feasible).
- ruff for lint and format (or the repo's existing black/isort/flake8 setup); uv or the repo's existing tool for environments.

**Types and data**
- `@dataclass(frozen=True, slots=True)` for internal value types; Pydantic v2 models at I/O boundaries (requests, config, external APIs).
- `typing.Protocol` for ports — structural typing, defined next to the consumer, no inheritance required.
- `Literal` unions or `Enum` for closed sets; `match` statements (3.10+) for branching on them.
- `pathlib.Path` over string paths; `datetime` always timezone-aware (`datetime.now(tz=UTC)`), never naive.

**Idioms**
- PEP 8 names: `snake_case` functions/variables, `PascalCase` classes, `UPPER_SNAKE` constants; `_leading_underscore` for module-private; `__all__` to declare a module's public API.
- Comprehensions for simple transforms; a plain loop when there are side effects or more than one condition.
- Never use mutable default arguments (`def f(items=[])`); use `None` and create inside.
- Context managers for resources; `contextlib.contextmanager` for your own.
- Modules are singletons already — no Singleton classes.
- Keyword-only arguments (`def send(*, to, subject)`) for functions with several parameters of the same type.
- EAFP ("easier to ask forgiveness") is idiomatic for dictionary/attribute access, but catch the specific exception only.

**Async**
- `asyncio.TaskGroup` (3.11+) for concurrent tasks; never fire-and-forget `create_task` without keeping a reference.
- Don't call blocking I/O (`requests`, file reads of large files, CPU-heavy work) inside `async def`; use an async client or `asyncio.to_thread`.

**Agent mistakes**
- Bare `except:` or `except Exception: pass`.
- Deep class hierarchies and getters/setters instead of plain attributes or `@property`.
- `Dict[str, Any]` flowing through the whole codebase instead of a parsed model.

## 3. Kotlin

**Baseline**
- `val` over `var`; read-only collection types (`List`, `Map`) in signatures; `data class` for values.
- ktlint or detekt per repo config.

**Types**
- `sealed interface` + exhaustive `when` for states and results.
- Null safety: model optionality in types; avoid `!!`. Use `?.`, `?:`, `requireNotNull` with a message.
- `@JvmInline value class` for typed IDs and units (`value class UserId(val raw: String)`).
- Classes are final by default — keep them that way; `open` only with a documented extension contract.

**Idioms**
- Named and default arguments instead of builders or overload explosions.
- `object` for true singletons (stateless or app-wide), still passed as a dependency where tests need substitution.
- Extension functions for small, discoverable helpers on types you don't own; not for core domain behavior that belongs on the type.
- Scope functions (`let`, `apply`, `also`, `run`, `with`) sparingly — nesting two of them hurts readability.
- `internal` visibility to enforce module boundaries (Gradle modules).
- Delegation (`class Cached(private val inner: Repo) : Repo by inner`) for decorators.

**Coroutines**
- Structured concurrency: `coroutineScope`, `supervisorScope`, lifecycle scopes on Android (`viewModelScope`); never `GlobalScope`.
- Inject dispatchers (`CoroutineDispatcher`) so tests can substitute a test dispatcher.
- `Flow` for streams; `StateFlow` for observable state.
- Never swallow `CancellationException`.

**Agent mistakes**
- Java-style getters/setters, static utility classes (`object StringUtils`), and builder classes for data classes.
- `lateinit var` everywhere to avoid constructor injection.

## 4. Swift

**Baseline**
- Swift 6 language mode with strict concurrency checking where the project has migrated; follow the Swift API Design Guidelines.
- SwiftLint/swift-format per repo config.

**Types**
- Value types first: `struct` and `enum` (with associated values) for models; `final class` when you need identity or reference semantics; `actor` for shared mutable state across concurrency domains.
- Protocols for capabilities; prefer `some Protocol` (opaque) over `any Protocol` (existential) unless you need heterogeneity.
- `Sendable` conformance for types crossing concurrency boundaries; `@MainActor` for UI-bound types.

**Naming (API Design Guidelines)**
- Clarity at the point of use: `list.remove(at: index)`, `x.distance(to: y)`.
- Omit needless words (`removeElement(_:)` → `remove(_:)`); argument labels make calls read as phrases.
- Mutating/non-mutating pairs: `sort()` / `sorted()`, `append(_:)` / `appending(_:)`.
- Boolean properties read as assertions: `isEmpty`, `canUndo`.

**Idioms**
- `guard let` / `guard … else { return }` for early exits; avoid pyramids of `if let`.
- `defer` for cleanup.
- `async/await` and structured concurrency (`async let`, task groups); check cancellation in long loops.
- SwiftUI: small views, `@Observable` models (Observation framework) where the deployment target allows, unidirectional data flow; keep business logic out of `View` bodies.
- Swift Package Manager modules to enforce boundaries (`internal` by default, `public` only for the API).

**Agent mistakes**
- Force unwraps (`!`) and `try!` outside tests.
- Class hierarchies where an enum with associated values would model the cases.
- Objective-C-era naming (`getUserName()`, `NSString`-style prefixes).

## 5. Go

**Baseline**
- `gofmt` (non-negotiable), `go vet`, and a linter aggregator such as golangci-lint with `staticcheck` and `errcheck`.
- Follow Effective Go and the Go Code Review Comments wiki.

**Naming**
- `MixedCaps`, never underscores; exported = capitalized.
- Short, lowercase, single-word package names; no `util`, `common`, `helpers`, `models` packages.
- No stutter: `http.Server`, not `http.HTTPServer`; `order.New`, not `order.NewOrder` when the package says it.
- Short names for short scopes (`i`, `r`, `ctx`); receiver names are one or two letters, consistent across methods, never `this`/`self`.
- Initialisms keep case: `userID`, `ServeHTTP`, `URL`.

**Design**
- Accept interfaces, return concrete structs. Define small interfaces in the consuming package, not next to the implementation.
- "The bigger the interface, the weaker the abstraction" — one- or two-method interfaces (`io.Reader`) are the norm.
- Make the zero value useful (`var mu sync.Mutex`, `bytes.Buffer`).
- Errors are values: return `error` last; wrap with `%w`; see `error-handling.md`.
- `context.Context` is the first parameter of anything that does I/O or may block; never store it in a struct.
- No getters named `GetX` — `Owner()` and `SetOwner()`.
- Composition via struct embedding; there is no inheritance, don't simulate it.

**Concurrency**
- "Don't communicate by sharing memory; share memory by communicating" — but a mutex is fine for simple shared state.
- Every goroutine must have a clear exit (context cancellation, closed channel). Leaked goroutines are memory leaks.
- `errgroup.Group` for concurrent work with error propagation and cancellation; bound concurrency (`SetLimit`).
- Run tests with `-race` in CI.

**Testing idiom**
- Table-driven tests with `t.Run` subtests; `t.Helper()` in helpers; `t.Cleanup` for teardown.
- Hand-written fakes satisfying small interfaces over mocking frameworks.

**Agent mistakes**
- Java/TS-style `interfaces.go` files declaring an interface for every struct next to its only implementation.
- `panic` for ordinary errors; ignoring errors from `Close`, `Write`, `json.Unmarshal`.
- Giant `utils` packages; getters/setters on every field.

## 6. Cross-language translation traps

| Habit carried over | Where it hurts | Idiomatic replacement |
|---|---|---|
| Builder classes | Kotlin, Python, Swift | Named/default arguments |
| Singleton class | Python, TS (ES modules), Go | Module-level instance created at startup, injected |
| `IService` + `ServiceImpl` | All | Concrete type; interface only at an I/O boundary or with 2+ implementations (Go: at the consumer) |
| Exceptions for expected outcomes | Go | Return `error` values |
| `Result` types everywhere | Python | Specific exceptions |
| Getters/setters | Python, Kotlin, Go, TS | Properties / public readonly fields |
| Class hierarchies for variants | TS, Kotlin, Swift | Union / sealed / enum with associated values |
| `null` checks everywhere | Kotlin, Swift, TS strict | Non-null types; handle optionality where it enters |

## Sources

- TypeScript `strict` and compiler options: https://www.typescriptlang.org/tsconfig/
- typescript-eslint rules: https://typescript-eslint.io/rules/
- PEP 8: https://peps.python.org/pep-0008/ ; `typing.Protocol` (PEP 544): https://peps.python.org/pep-0544/
- Python `asyncio.TaskGroup`: https://docs.python.org/3/library/asyncio-task.html#task-groups
- Kotlin coding conventions: https://kotlinlang.org/docs/coding-conventions.html ; coroutines best practices (Android): https://developer.android.com/kotlin/coroutines/coroutines-best-practices
- Swift API Design Guidelines: https://www.swift.org/documentation/api-design-guidelines/
- Swift 6 concurrency migration guide: https://www.swift.org/migration/documentation/migrationguide/
- Effective Go: https://go.dev/doc/effective_go ; Go Code Review Comments: https://go.dev/wiki/CodeReviewComments ; Go Proverbs: https://go-proverbs.github.io/
- zedr/clean-code-python: https://github.com/zedr/clean-code-python ; ryanmcdermott/clean-code-javascript: https://github.com/ryanmcdermott/clean-code-javascript
