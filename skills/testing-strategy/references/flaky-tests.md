# Flaky Tests and Determinism

A flaky test passes and fails on the same code. It is either a test bug or a real product bug (often a race condition) — treat it as a bug either way. Tolerated flakiness teaches everyone to re-run instead of read, and real regressions slip through.

## Contents
1. Triage procedure
2. Cause → fix table
3. Determinism recipes by stack
4. Quarantine and retry policy
5. Prevention checklist for new tests

## 1. Triage procedure

1. **Confirm it's flaky, not broken.** Re-run the failing commit's test alone. Fails every time → it's a regular failure; fix the code or test.
2. **Reproduce in a loop.** Run the single test many times (50–100), then the whole file, then the suite in parallel. Examples: a shell loop (`for i in $(seq 50); do npx vitest run path/to/file.test.ts || break; done`); `pytest --count=50` (pytest-repeat); `go test -run TestX -count=100 -race`; Playwright `--repeat-each=50`.
3. **Vary conditions:** random order, parallel workers, CPU throttling (`taskset`, slower CI machine), different time zone (`TZ=America/Sao_Paulo`), different locale.
4. **Collect evidence:** seed, timestamps, logs, Playwright trace, screenshots, DB state at failure.
5. **Classify the cause** with the table below and fix the root. Don't add a sleep or a retry as the fix.
6. **Add a regression guard** if the cause was a product race (a test that reliably triggers the interleaving, or a constraint that prevents it).

## 2. Cause → fix table

| Cause | Symptom | Fix |
|---|---|---|
| Fixed sleeps / timing assumptions | Fails on slow CI machines | Await the condition: auto-waiting assertions, `findBy*`, `expect.poll`, `waitFor`; for backends, poll with a deadline |
| Real clock | Fails near midnight, month end, DST change, or year boundary | Inject clock; freeze time; explicit tests at boundaries |
| Time zone / locale | Passes locally, fails in CI (or vice versa) | Pin `TZ` in CI; construct dates with explicit zones; format with explicit locale |
| Unseeded randomness / UUID ordering | Rare failures, not reproducible | Inject seeded RNG/ID generator; log seed on failure |
| Shared mutable state between tests | Fails only in certain orders or in parallel | Per-test setup; reset module state; unique IDs/tenants per test; transaction rollback |
| Test depends on data from another test | Fails when run alone | Each test creates its own data |
| Unordered results asserted in order | Fails intermittently on DB/hash ordering | Add `ORDER BY` in the query (if order matters to users) or compare as sets |
| Real network / third-party sandbox | Timeouts, rate limits, 5xx | Intercept HTTP; move sandbox tests to a separate non-blocking job |
| Async work not awaited | Assertions run before side effects | Await promises; flush queues; lint for floating promises |
| Leaking resources (ports, files, goroutines, timers) | Later tests fail with "address in use" or timeouts | Clean up in `afterEach`/`t.Cleanup`; random free ports; close servers |
| Product race condition | Double submits, lost updates under parallel tests | Fix in code: DB constraints, atomic updates, idempotency keys, proper locking |
| Animations and transitions (UI) | Element not clickable / screenshot diff | Disable animations in test mode; wait for stable state; `prefers-reduced-motion` emulation |
| Resource starvation in CI | Timeouts only in CI | Reduce parallelism for heavy suites; raise per-test timeouts only with evidence; split suites |
| Floating point comparisons | Off-by-epsilon failures | Compare with tolerance; integers for money |
| Test isolation in e2e (shared accounts) | Fails when two CI jobs run together | Create a user/tenant per test or per worker |

## 3. Determinism recipes by stack

**TypeScript (Vitest/Jest)**
- `vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-31T23:59:00Z"))` — restore with `vi.useRealTimers()` in `afterEach`.
- Advance timers explicitly (`vi.advanceTimersByTime`, or the async variant when promises are involved).
- Randomize test order (Vitest `sequence.shuffle`) in CI to surface order dependence.
- Network: MSW with `onUnhandledRequest: "error"` so unexpected real calls fail loudly.

**Python (pytest)**
- `time-machine` or `freezegun` to freeze or move time; prefer injecting a clock in new code.
- `pytest-randomly` shuffles order and reseeds `random` per test; print the seed on failure.
- `respx`/`responses` for HTTP; enable their "assert all requests were mocked" options.
- Use `tmp_path` and factory fixtures; avoid module-level state.

**Kotlin / Android**
- Coroutines: `runTest` with a `StandardTestDispatcher`; inject dispatchers; advance virtual time with `advanceUntilIdle()`.
- `java.time.Clock` injected; `Clock.fixed(...)` in tests.
- Compose/Espresso: rely on idling resources and the test framework's synchronization rather than sleeps.

**Swift / iOS**
- Inject a clock (`any Clock<Duration>` or a closure returning `Date`); avoid `Date()` in logic.
- XCTest: `XCTestExpectation` with `fulfillment(of:timeout:)`; Swift Testing: `confirmation` for async events.
- UI tests: disable animations via a launch argument your app honors; wait with `waitForExistence(timeout:)`.

**Go**
- Pass a clock interface or `func() time.Time`; newer Go versions provide `testing/synctest` for deterministic time in concurrent tests.
- `t.Parallel()` only for tests with no shared state; `-race` in CI; `-shuffle=on` to randomize order.
- `httptest.Server` for HTTP; `t.Cleanup` for teardown.

**Playwright**
- `page.clock` to control time; `expect(locator).toHaveText(...)` style web-first assertions auto-wait.
- Never `page.waitForTimeout` in committed tests.
- Isolated browser context per test (default); create data per test via API.

## 4. Quarantine and retry policy

- **Quarantine** = the test still runs and reports, but doesn't block merges. It requires an owner, a ticket, and a fix-by date. Review the quarantine list regularly; a test quarantined past its date is fixed or deleted with a written reason.
- **Retries:** CI retries (e.g., Playwright `retries: 2` on CI) are acceptable as a safety valve only if "passed on retry" is surfaced as flaky in reports and tracked. Never raise retries to make a suite green.
- **Never** delete, `.skip`, or loosen a flaky test's assertions without recording why and what replaces its coverage.
- **Measure:** track flaky rate per test (fails that pass on retry / total runs). Fix the worst offenders first.

## 5. Prevention checklist for new tests

- [ ] No fixed sleeps; all waits are for conditions
- [ ] Time, randomness, and IDs are injected or frozen
- [ ] No real external network calls
- [ ] Test creates and cleans up its own data
- [ ] Passes when run alone, in random order, and in parallel
- [ ] Ran 10–20 times locally without failure
- [ ] Asserts sets where order is not part of the contract

## Sources

- Martin Fowler, "Eradicating Non-Determinism in Tests": https://martinfowler.com/articles/nonDeterminism.html
- Google Testing Blog, "Flaky Tests at Google and How We Mitigate Them": https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html
- Playwright docs — auto-waiting and web-first assertions: https://playwright.dev/docs/test-assertions ; clock: https://playwright.dev/docs/clock ; retries: https://playwright.dev/docs/test-retries
- Vitest fake timers: https://vitest.dev/api/vi.html#vi-usefaketimers
- pytest-randomly: https://github.com/pytest-dev/pytest-randomly ; time-machine: https://github.com/adamchainz/time-machine
- Kotlin coroutines testing: https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/
- Go `testing` package (`-shuffle`, `t.Cleanup`) and `testing/synctest`: https://pkg.go.dev/testing ; https://pkg.go.dev/testing/synctest
- obra/superpowers condition-based waiting: https://github.com/obra/superpowers
