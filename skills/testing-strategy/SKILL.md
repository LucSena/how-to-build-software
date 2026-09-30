---
name: testing-strategy
description: Use when deciding what and how to test, writing or fixing tests, or when tests are slow, flaky, brittle, missing, or not catching bugs. Covers choosing a test shape (pyramid, trophy, honeycomb) by system type, what belongs at unit, integration, contract, and end-to-end level, test doubles (fakes vs stubs vs mocks, don't mock what you don't own), deterministic tests (time, randomness, network, concurrency), flaky test policy, when to use TDD, property-based testing, contract tests, Playwright end-to-end tests, visual regression, mobile UI testing, coverage and mutation testing, and characterization tests for legacy code. Also use when the user says "add tests", "write a test for this", "why is this test flaky", "CI fails randomly", "mock this API", "how should I test this", "our tests are slow", or asks for a test plan. For evaluating LLM output quality use ai-native-architecture (evals); for reviewing someone else's PR use code-review.
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "clean-code code-review reliability ai-native-architecture mobile-architecture"
---

# Testing Strategy

A test exists to fail when behavior breaks — and to stay green when only structure changes. Everything here serves that: test behavior through public interfaces, at the cheapest level that would catch the bug, with real collaborators where affordable and deterministic doubles where not. Agents fail at testing in predictable ways — asserting on mocks, snapshotting everything, weakening or deleting failing tests, sleeping instead of waiting — and this skill exists to stop those.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Follow the codebase's existing test conventions first.** Same runner, folder layout, naming, fixtures, and helpers; a second test framework is a cost everyone pays.
2. **Every test names the break it catches.** If you can't say which realistic bug makes it fail, it's coverage theater.
3. **Test behavior through public interfaces.** Tests coupled to private structure break on every refactor and miss real bugs.
4. **Cheapest level that catches the bug.** Unit for logic, integration for wiring and queries, end-to-end for a few critical journeys.
5. **Real over fake over mock.** Use the real thing when fast and deterministic, a fake at I/O boundaries, and a mock only when the interaction *is* the contract.
6. **Deterministic or it doesn't ship.** Control time, randomness, IDs, network, and ordering; a flaky test trains everyone to ignore red.
7. **Never weaken, skip, or delete a failing test to get green** without stating why the test — not the code — was wrong.

## Workflow

- [ ] **Survey.** Find the test runner, config, existing test folders, fixtures/factories, and CI job. Run the suite once to learn baseline time and failures.
- [ ] **Classify the system** (table below) to pick the test shape; note what already exists at each level.
- [ ] **List behaviors and risks** for the change: happy path, edge cases (empty, max, unicode, time zones, concurrency), error paths, authorization.
- [ ] **Assign each behavior a level** using "What to test where". Prefer extending existing test files.
- [ ] **Write the test first where practical** (bug fixes always: reproduce, watch it fail, then fix).
- [ ] **Prove it can fail.** Break the code (flip a condition, return early) and confirm the test goes red; restore.
- [ ] **Check determinism.** Run new tests repeatedly (e.g., 10–20 times, and in random order if the runner supports it). Any failure → fix before merging.
- [ ] **Report** using the Output format.

## Pick the shape by system type

| System | Shape | Rough distribution | Why |
|---|---|---|---|
| Library, algorithmic or domain-heavy core | Pyramid | Many unit, some integration, very few e2e | Logic is the risk; units are fast and precise |
| Typical web app / frontend | Trophy | Static types + lint as the base, some unit, **most integration** (component + API with real-ish deps), few e2e | Bugs live in wiring between components, data, and UI |
| Backend service / microservice | Honeycomb | Mostly integration tests through the service API with real DB (container), few implementation-detail units, contract tests at service edges | The service's contract and its data layer are the risk |
| Mobile app | Pyramid-ish | Unit for view models/domain, integration for data layer, a few UI flows, screenshot tests for key screens | Device UI tests are slow and flaky |
| Data pipeline / ETL | Data-centric | Unit on transforms, integration on sample datasets, data quality checks in production | Bad data is the main failure |
| LLM feature | Evals | Deterministic unit tests on plumbing + eval suite on behavior | Outputs are non-deterministic; see `ai-native-architecture` |

## What to test where

| Level | Put here | Doubles allowed | Speed budget |
|---|---|---|---|
| Static (types, lint) | Type errors, unused code, floating promises, unsafe patterns | — | Seconds |
| Unit | Pure logic, parsers, state reducers, calculations, validation rules | Fakes for ports; no mocks of internals | ms per test |
| Integration | Repository/queries against a real DB, HTTP handlers end-to-end in process, component + hooks with a mocked network layer, message consumers | Real DB (container/ephemeral); network intercepted at the HTTP layer | < ~1 s per test |
| Contract | Agreement between a consumer and provider (API or events) | Provider verified against consumer expectations | Fast |
| End-to-end | 5–20 critical user journeys (signup, checkout, core workflow) | None, or only third-party sandboxes | Minutes for the suite |
| Visual regression | Key screens and design-system components in each theme/viewport | Stable fixtures, frozen time | Minutes |
| Exploratory / manual | New UX, accessibility with a screen reader, device feel | — | Planned sessions |

## Writing good tests

- **Arrange–Act–Assert**, one behavior per test, named as a sentence: `rejects_refund_after_30_days`, `"shows empty state when there are no invoices"`.
- **Expected values are literals** you derived by hand, not computed by the code under test or its helpers.
- **No logic in tests** — no loops or conditionals deciding what to assert; use table-driven cases instead.
- **Test data via factories/builders** with sensible defaults, overriding only fields the test cares about.
- **Assert on outcomes users or callers see:** return values, persisted state, emitted events, rendered text by accessible role — not private fields or call order of internals.
- **Each test sets up and cleans its own state;** no dependence on test order or data left by another test.

## Test doubles

| Double | What it is | Use for |
|---|---|---|
| Fake | Working lightweight implementation (in-memory repo, fake clock, fake payment gateway) | **Default** for your own ports/boundaries |
| Stub | Returns canned answers | Driving a code path (e.g., "API returns 503") |
| Spy | Records calls on a real or fake object | Verifying a side effect happened when the effect itself isn't observable |
| Mock (strict expectations) | Fails if not called as expected | Only when the interaction is the contract (email sent once with this template) |

Rules:
- **Don't mock what you don't own.** Wrap the third-party SDK in your adapter; fake the adapter in unit tests; test the adapter itself against the vendor's sandbox or a recorded/intercepted HTTP layer.
- **Don't mock the database for query code.** Run the real engine (Testcontainers, an ephemeral database, or the framework's transactional test DB). SQL mocks pass while production queries fail.
- **Intercept HTTP at the network boundary** (MSW, WireMock, nock, respx, OkHttp MockWebServer) rather than mocking the HTTP client library's methods.
- **Mocks mirror real shapes completely** — partial mock objects hide the fields production reads.
- **If mock setup is longer than the test, switch to an integration test** with real components.

More: `references/test-doubles.md`.

## Deterministic tests

| Source of nondeterminism | Control it with |
|---|---|
| Current time, timers | Inject a clock; runner fake timers (`vi.useFakeTimers`, `jest.useFakeTimers`); `time-machine`/`freezegun`; Playwright `page.clock` |
| Randomness, UUIDs | Inject a seeded RNG / ID generator; log the seed on failure |
| Network | No real external calls outside e2e; intercept at HTTP layer |
| Async completion | Await the condition (`findBy*`, `expect.poll`, auto-waiting assertions); never fixed `sleep` |
| Shared state | Fresh DB schema/transaction per test or unique tenant/IDs per test |
| Order dependence | Run in random order; each test owns its setup |
| Time zone, locale | Pin `TZ=UTC` in CI **and** add explicit tests for a non-UTC zone and DST boundaries |
| Floating point | Compare with tolerance; use integer minor units for money |
| Concurrency | Deterministic schedulers/test dispatchers; run with the race detector (Go `-race`, TSan) |

## Flaky test policy

1. **A flaky test is a bug** — in the test or in the product (race conditions are real).
2. **Reproduce** by running it in a loop (e.g., 50–100 times) and under load/parallelism; capture seed, trace, logs.
3. **Fix the root cause** (see `references/flaky-tests.md` for the cause → fix table).
4. **If it can't be fixed today, quarantine it** — excluded from the blocking run, still executed and reported — with an owner, a ticket, and a deadline. Never quarantine silently.
5. **CI retries only with reporting.** Automatic retry may unblock a merge, but a pass-on-retry is recorded as flaky and tracked; retries must never make flakiness invisible.

## TDD and other techniques — when

| Technique | Use when | Skip when |
|---|---|---|
| TDD (red → green → refactor) | Bug fixes (always reproduce first), pure logic, parsers, well-specified behavior, agent-written code (the failing test constrains hallucination) | Exploratory spikes and UI layout experiments — then add tests before merging |
| Characterization tests | Changing legacy code with no tests | Code with good behavior tests |
| Property-based (fast-check, Hypothesis, Kotest, jqwik, Go fuzzing) | Parsers/serializers (round-trip), invariants, sorting/merging, money math, state machines | Simple mappings with few cases |
| Contract tests (Pact or schema-based OpenAPI/protobuf checks) | Independently deployed consumer/provider, public API, event schemas | Monolith calling itself in-process |
| Snapshot tests | Small, stable serialized output (CLI output, generated config, error payloads) | Large component trees — they get rubber-stamped |
| Visual regression | Design-system components and key screens | Rapidly changing prototypes |
| Mutation testing (Stryker, mutmut, PIT) | Critical modules (billing, auth, pricing) to check test strength | Whole codebase on every CI run |

Details: `references/advanced-techniques.md`.

## End-to-end, visual, and mobile (defaults)

- **Playwright is the default web e2e tool** unless the repo already uses another. Locate by role/label/text (`getByRole('button', { name: 'Pay' })`), use web-first assertions that auto-wait, never `waitForTimeout`. Seed data through APIs, reuse authenticated state, capture traces on retry. Keep the suite to critical journeys.
- **Visual regression:** fixed viewport, fonts loaded, animations disabled, time frozen, dynamic regions masked; review diffs like code.
- **Mobile:** unit-test view models and domain logic on the JVM/host; UI tests with Compose testing/Espresso and XCUITest for a few flows; screenshot tests for key screens; cross-platform flows (Maestro, Detox for React Native) where the project uses them. Details: `references/e2e-visual-mobile.md`.

## Coverage

- **Coverage is a signal, not a goal.** Low coverage on critical code is a finding; high coverage proves nothing about assertions.
- **Gate on diff coverage** (coverage of new/changed lines, at a threshold the team agrees on) rather than a global percentage that invites filler tests.
- **For critical modules, use mutation score** to check that tests actually detect changes.
- Ask the review question: "Will this test fail when the code is broken?"

## Gotchas

- **Asserting on the mock.** `expect(mockSend).toHaveBeenCalled()` when the real outcome (record saved, message rendered) is observable. Assert outcomes; if you're checking a mock exists, delete the assertion.
- **Tests that re-implement the code.** Computing the expected value with the same formula or helper guarantees a pass. Use literals.
- **Snapshotting everything.** Huge component snapshots get updated with `-u` without reading. Snapshot small, stable outputs only.
- **Weakening assertions or adding `.skip` to get green.** Forbidden without an explicit reason that the test was wrong; report it in the summary.
- **Catching the error in the test** so a throwing path "passes". Use the runner's `expect(...).rejects` / `pytest.raises` / `assertThrows` and assert the error type.
- **`sleep(2000)` to wait for async work.** Slow and still flaky. Await the condition.
- **Mocking the database or ORM** in repository tests. Use a real engine in a container.
- **Real network calls in unit/integration tests** (payment sandboxes, LLM APIs). Slow, flaky, and costly; intercept.
- **Tests that pass on first run and were never seen failing.** Break the code once to prove the test works.
- **One giant e2e test per feature.** Push edge cases down to unit/integration; e2e covers the journey.
- **Testing framework behavior** (that the router calls your handler, that `useState` updates). Test your contract.
- **Testing LLM output with exact string equality.** Use schema checks and eval suites (`ai-native-architecture`).
- **Adding a new test framework or assertion library** when the repo already has one.

## Output format

For a test plan:

```
System type → shape: <e.g., web app → trophy>
Behaviors and risks:
- <behavior> → <level> → <double strategy> → <break it catches>
Determinism controls: <clock/seed/network/data isolation>
Not tested (and why): <explicit gaps>
```

After writing tests:

```
Added/changed tests: <file: test names>
Proved failing: <how you broke the code and saw red>
Runs: <command, pass count over N repeated runs>
Removed/skipped/weakened tests: <none, or each with the reason>
Not checked: <what remains unverified>
```

## References

| File | Read when |
|---|---|
| `references/test-doubles.md` | Choosing between fake, stub, spy, and mock; wrapping a third-party SDK; testing against a real database or intercepted HTTP |
| `references/flaky-tests.md` | A test fails intermittently, CI is red randomly, or you need determinism recipes for time, randomness, or async in a specific stack |
| `references/advanced-techniques.md` | Applying TDD, property-based, contract, snapshot, mutation, or characterization testing |
| `references/e2e-visual-mobile.md` | Writing Playwright tests, setting up visual regression, or testing iOS/Android/React Native/Flutter apps |

## Related skills

- `clean-code` — refactoring safely once characterization tests are in place.
- `code-review` — reviewing tests in a PR for strength and test gaming.
- `reliability` — testing failure modes, timeouts, and resilience in production-like conditions.
- `ai-native-architecture` — eval suites for LLM features.
- `mobile-architecture` — test architecture for mobile apps.
