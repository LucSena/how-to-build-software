# Error Handling

Rules first, then per-language defaults with short examples. Always follow the error style the codebase already uses; the language sections describe the default when there is none.

## Contents
1. Rules
2. Choosing exceptions vs error values
3. TypeScript
4. Python
5. Kotlin
6. Swift
7. Go
8. Review checklist

## 1. Rules

### Never swallow an error
**Rule.** Every caught error is handled (defined recovery), translated (wrapped with context and rethrown/returned), or propagated.
**Apply when.** Writing any `catch`, `except`, `recover`, `if err != nil`, `.catch()`, or `try?`.
**Do / Avoid.** Do: `catch (e) { throw new OrderSyncError(orderId, { cause: e }) }`. Avoid: `catch (e) { console.error(e) }` followed by normal flow; `except Exception: pass`; `_ = f()` on an error-returning call; Swift `try?` that discards an error you needed.
**Why.** A swallowed error converts a visible crash into silent wrong data — the most expensive class of bug to find later.

### Handle at the layer that can decide
**Rule.** Low layers add context and propagate; the boundary (HTTP handler, job runner, CLI entry, UI event) maps errors to responses and logs once.
**Apply when.** Deciding where to put a `try`.
**Do / Avoid.** Do: repository raises `NotFound(orderId)`; handler maps it to 404 problem details. Avoid: logging the same error in repository, service, and handler (triple log lines, no added information).
**Why.** Only the boundary knows the user-facing contract; duplicated logging destroys signal-to-noise in incidents.

### Parse, don't validate
**Rule.** At trust boundaries, convert untrusted input into a typed value in one step with a schema; pass the typed value inward.
**Apply when.** Request bodies, query params, env/config, files, queue messages, webhook payloads, third-party API responses, LLM output.
**Do / Avoid.** Do: `const input = CreateOrder.parse(body)` (Zod) or `CreateOrder.model_validate(body)` (Pydantic) and then `createOrder(input)`. Avoid: `validate(body)` returning a boolean, then passing the raw `any`/`dict` inward and re-checking fields in three places.
**Why.** A parser's output type is the proof of validity; a validator's boolean is forgotten one call later (Alexis King, "Parse, don't validate").

### Separate expected outcomes from bugs
**Rule.** Expected domain failures are part of the function's contract and typed; bugs fail fast.
**Apply when.** Designing a function's signature.
**Do / Avoid.** Do: `withdraw(): Result<Balance, InsufficientFunds | AccountFrozen>`; `assert`/`throw` for "this state cannot happen". Avoid: throwing a generic `Error("insufficient funds")` that callers must string-match; returning `null` for both "not found" and "database down".
**Why.** Typed outcomes force callers to handle them; generic exceptions make the contract invisible.

### Add context when propagating
**Rule.** Wrap with what the caller couldn't know (IDs, operation, input size) and keep the original as the cause.
**Apply when.** Re-raising across a module boundary.
**Do / Avoid.** Do: `raise PaymentFailed(order_id) from e`; `fmt.Errorf("charge order %s: %w", id, err)`. Avoid: `throw new Error(e.message)` (loses stack and type); wrapping at every single call level (noise).
**Why.** Context turns "connection reset" into an actionable incident; the cause chain keeps the root visible.

### Define errors out of existence
**Rule.** Where semantics allow, design the API so the error case cannot happen.
**Apply when.** A caller-facing error would be handled the same way by every caller.
**Do / Avoid.** Do: `remove(key)` is a no-op if absent; `slice` clamps indices; `getOrDefault`; idempotent `ensureExists`. Avoid: forcing every caller to catch `KeyNotFound` just to ignore it.
**Why.** Each exception in an interface is complexity pushed onto every caller (Ousterhout).

### Don't be over-defensive
**Rule.** Trust the type system inside the boundary; don't add checks for states types already exclude, and don't fall back silently.
**Apply when.** Tempted to add `if (!x) return` or `?? defaultValue` "just in case".
**Do / Avoid.** Do: let a violated invariant throw. Avoid: `user?.profile?.name ?? ''` on a non-optional type; `try { … } catch { return [] }` around a query.
**Why.** Silent fallbacks hide bugs and make them surface far from the cause.

### Fail fast on configuration
**Rule.** Parse and validate all required config/secrets at startup; crash with a clear message if missing.
**Apply when.** Reading env vars or config files.
**Do / Avoid.** Do: one `config` module parsed at boot with a schema. Avoid: `process.env.STRIPE_KEY!` read inside a request handler.
**Why.** A deploy that can't start is caught by the rollout; a deploy that fails on the first payment is an incident.

### Never leak internals across a public boundary
**Rule.** Map errors to a stable public shape (for HTTP: RFC 9457 problem details) with a trace ID; log the internals server-side.
**Apply when.** Returning errors to API clients or UIs.
**Do / Avoid.** Do: `{ type, title, status, detail, traceId }`. Avoid: stack traces, SQL text, hostnames, or raw exception messages in responses.
**Why.** Internals help attackers and break clients that parse messages. See `api-design`.

### Clean up deterministically and supervise async work
**Rule.** Release resources with the language's scoped construct; await or supervise every async task.
**Apply when.** Files, connections, locks, subscriptions, spawned tasks/goroutines/coroutines.
**Do / Avoid.** Do: `with`, `use {}`, `defer`, `using`, `finally`; structured concurrency (`TaskGroup`, `coroutineScope`, `errgroup`). Avoid: floating promises, `GlobalScope.launch`, goroutines with no way to stop.
**Why.** Leaked resources and orphaned tasks fail under load, far from the code that created them.

## 2. Choosing exceptions vs error values

| Language | Expected domain failure | Bug / invariant violation | Mixing rule |
|---|---|---|---|
| TypeScript | Discriminated union or small `Result` type; exceptions acceptable if the codebase uses them consistently | `throw` | Pick one style per module; never both for the same failure |
| Python | Specific exception subclasses (idiomatic) | `raise`/`assert` for internal invariants (asserts can be disabled with `-O`; don't use them for input validation) | Result libraries are uncommon; don't introduce one alone |
| Kotlin | Sealed interface of outcomes, or `Result`/Arrow `Either` if the team uses it | Exceptions (`error()`, `check()`, `require()`) | Don't catch `CancellationException` in coroutines |
| Swift | `throws` (typed throws in Swift 6 for closed domain error sets) or `Result` at async/callback boundaries | `precondition`/`fatalError` | Don't use `try!` outside tests and truly impossible cases |
| Go | `error` return values; sentinel errors or typed errors checked with `errors.Is`/`errors.As` | `panic` only for programmer errors; recover only at goroutine/request boundaries | Never `panic` for expected failures across a package API |

## 3. TypeScript

```ts
type ParseResult<T> = { ok: true; value: T } | { ok: false; error: ValidationError };

// Boundary: parse once
const CreateOrder = z.object({ sku: z.string().min(1), qty: z.number().int().positive() });
export async function handler(req: Request): Promise<Response> {
  const parsed = CreateOrder.safeParse(await req.json());
  if (!parsed.success) return problem(400, "Invalid order", parsed.error.issues);
  const result = await placeOrder(parsed.data);           // typed input from here on
  switch (result.kind) {
    case "placed": return json(201, result.order);
    case "out_of_stock": return problem(409, "Out of stock");
    default: { const _exhaustive: never = result; throw new Error("unreachable"); }
  }
}

// Wrap with context, keep cause (ES2022 error cause)
throw new SyncError(`sync order ${id}`, { cause: err });
```

- Type caught values as `unknown` (`useUnknownInCatchVariables`, on under `strict`); narrow before use.
- Enable `@typescript-eslint/no-floating-promises` and `no-misused-promises`.
- Timeouts on `fetch`: `fetch(url, { signal: AbortSignal.timeout(5000) })` — there is no default.
- `using` / `await using` (TS 5.2+) for disposables where the runtime supports it; otherwise `try/finally`.

## 4. Python

```python
class OrderError(Exception): ...
class OutOfStock(OrderError):
    def __init__(self, sku: str) -> None:
        super().__init__(f"out of stock: {sku}")
        self.sku = sku

try:
    charge(order)
except httpx.TimeoutException as e:
    raise PaymentUnavailable(order.id) from e      # keep the cause chain
```

- Catch the narrowest exception; never bare `except:` (it also catches `KeyboardInterrupt`/`SystemExit`). `except Exception` only at top-level boundaries, and log with `logger.exception`.
- Pydantic v2 models (`model_validate`) or dataclasses + explicit parsing at boundaries.
- Context managers (`with`) for every resource; `contextlib.ExitStack` for dynamic sets.
- `asyncio.TaskGroup` (3.11+) instead of bare `create_task`; exceptions surface as `ExceptionGroup` — handle with `except*`.
- `requests` has no default timeout; always pass `timeout=`. `httpx` has a default but set it explicitly.

## 5. Kotlin

```kotlin
sealed interface PlaceOrderResult {
    data class Placed(val order: Order) : PlaceOrderResult
    data class OutOfStock(val sku: Sku) : PlaceOrderResult
}

when (val r = placeOrder(cmd)) {          // exhaustive: compiler flags new variants
    is PlaceOrderResult.Placed -> respond(201, r.order)
    is PlaceOrderResult.OutOfStock -> respond(409, problem("Out of stock"))
}
```

- `require()` for argument checks, `check()` for state, `error()` for unreachable.
- Avoid `!!`; if a value is guaranteed, model it as non-null.
- `runCatching` also catches `CancellationException` and breaks structured concurrency — don't use it around suspending calls without rethrowing cancellation.
- Structured concurrency: `coroutineScope`/`supervisorScope`; never `GlobalScope`.
- `use {}` for `Closeable`.

## 6. Swift

```swift
enum PaymentError: Error { case declined(reason: String), insufficientFunds }

func charge(_ order: Order) throws(PaymentError) -> Receipt { ... }   // typed throws (Swift 6)

do {
    let receipt = try charge(order)
} catch .insufficientFunds {
    showTopUp()
} catch {
    report(error)
}
```

- Plain `throws` is still the default for open error sets; use typed throws when the set is closed and callers must switch over it.
- `try?` discards the error — acceptable only when absence is the complete answer.
- `defer` for cleanup; `async let`/`withThrowingTaskGroup` for structured concurrency; respect cancellation (`try Task.checkCancellation()`).
- `Codable` decoding at the boundary; map `DecodingError` to a domain error with context.

## 7. Go

```go
var ErrNotFound = errors.New("order not found")

func (s *Store) Get(ctx context.Context, id string) (Order, error) {
    o, err := s.q.GetOrder(ctx, id)
    if errors.Is(err, sql.ErrNoRows) {
        return Order{}, ErrNotFound
    }
    if err != nil {
        return Order{}, fmt.Errorf("get order %s: %w", id, err)
    }
    return o, nil
}
```

- Check every error; `_ =` on an error needs a comment explaining why ignoring is safe.
- Wrap with `%w` to keep the chain; compare with `errors.Is`, extract with `errors.As` — never compare error strings.
- Error strings are lowercase with no trailing punctuation (they get concatenated).
- Handle an error once: either log it or return it, not both.
- `defer` for cleanup, but check the error of `Close()` on writers (a failed close can mean lost data).
- `context.Context` first parameter for anything that does I/O; respect cancellation and deadlines.
- Every goroutine has an owner and an exit path; `errgroup` for fan-out with error propagation.

## 8. Review checklist

- [ ] No empty or log-and-continue catch blocks
- [ ] Expected failures typed; bugs fail fast
- [ ] Untrusted input parsed with a schema at the boundary; no re-validation deep inside
- [ ] Context added once per boundary crossing; original cause preserved
- [ ] Each error logged once, at the boundary, without secrets or PII
- [ ] Public errors use a stable shape; no internals leaked
- [ ] Every resource closed; every async task awaited or supervised
- [ ] Every network call has a timeout
- [ ] Config parsed at startup

## Sources

- Alexis King, "Parse, don't validate" (2019): https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
- John Ousterhout, *A Philosophy of Software Design* 2nd ed. — "define errors out of existence"; summary: https://lethain.com/notes-philosophy-software-design/
- RFC 9457 Problem Details for HTTP APIs: https://www.rfc-editor.org/rfc/rfc9457.html
- typescript-eslint `no-floating-promises`: https://typescript-eslint.io/rules/no-floating-promises/
- Python docs, exception chaining and `ExceptionGroup`: https://docs.python.org/3/tutorial/errors.html
- Kotlin coroutines exception handling: https://kotlinlang.org/docs/exception-handling.html
- Swift typed throws (SE-0413): https://github.com/swiftlang/swift-evolution/blob/main/proposals/0413-typed-throws.md
- Go blog, "Working with Errors in Go 1.13": https://go.dev/blog/go1.13-errors ; Go Code Review Comments: https://go.dev/wiki/CodeReviewComments
