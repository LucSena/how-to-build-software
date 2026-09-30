# Test Doubles

How to replace collaborators without making the test lie. The order of preference is **real → fake → stub → spy → mock**: move right only when the option to the left is slow, nondeterministic, costly, or impossible.

## Contents
1. Vocabulary
2. Rules
3. Boundary recipes: database, HTTP, third-party SDKs, clock/random, queues, file system, LLMs
4. Frontend component tests
5. Warning signs

## 1. Vocabulary (Meszaros / Fowler)

| Double | Behavior | Verifies via |
|---|---|---|
| Dummy | Passed but never used | — |
| Stub | Returns canned answers | State of the system under test |
| Fake | Working simplified implementation (in-memory store, fake clock) | State |
| Spy | Real or fake object that records calls | State + recorded calls |
| Mock | Pre-programmed expectations; fails on unexpected calls | Interaction |

Most mocking libraries (`vi.fn`, `jest.fn`, `unittest.mock`, MockK, Mockito) create objects usable as stubs, spies, or mocks. What matters is how you *use* them: returning values (stub) is low-risk; asserting on call details (mock) couples the test to implementation.

## 2. Rules

### Prefer fakes for your own ports
**Rule.** For each boundary interface you own (repository, gateway, clock, ID generator), write one in-memory fake and reuse it across tests.
**Apply when.** Unit-testing logic that depends on I/O.
**Do / Avoid.** Do: `new InMemoryOrderRepo()` with the same contract as the real one, and a shared contract test suite run against both. Avoid: per-test `mockResolvedValueOnce` chains re-describing the database.
**Why.** A fake encodes the contract once; mocks re-state it inconsistently in every test.

### Don't mock what you don't own
**Rule.** Don't mock third-party library or SDK methods directly; wrap the dependency in your adapter and double the adapter.
**Apply when.** Stripe, AWS SDK, Firebase, an LLM client, an ORM.
**Do / Avoid.** Do: `PaymentGateway` interface → `StripeGateway` (tested against Stripe's test mode or intercepted HTTP) and `FakeGateway` for unit tests. Avoid: `vi.mock('stripe')` with hand-written return shapes.
**Why.** Your mock encodes your *assumption* about the vendor; when the assumption is wrong, the test still passes (Freeman & Pryce, *Growing Object-Oriented Software*).

### Assert outcomes, not the double
**Rule.** Assert what the caller or user observes; use interaction assertions only when the interaction is the observable contract.
**Apply when.** Writing any assertion that names a double.
**Do / Avoid.** Do: assert the order is persisted with status `paid`; assert the fake mailer's outbox contains one email to the customer. Avoid: `expect(repo.save).toHaveBeenCalledWith(expect.anything())`.
**Why.** Interaction assertions break on refactors that keep behavior and pass when behavior is wrong.

### Mirror real data completely
**Rule.** Stubbed responses contain every field the real one has (use recorded fixtures or schema-generated data).
**Apply when.** Stubbing API responses or DB rows.
**Do / Avoid.** Do: fixtures captured from the real API, or generated from its OpenAPI/JSON schema. Avoid: `{ id: 1 }` when production code reads `status` and `items`.
**Why.** Partial fixtures pass tests while production reads a missing field.

### Keep test-only code out of production classes
**Rule.** Reset hooks, cleanup methods, and test setters live in test utilities.
**Apply when.** Tempted to add `resetForTests()` or `_setClock()` to a production type.
**Do / Avoid.** Do: inject the clock via the constructor. Avoid: public mutable statics for tests.
**Why.** Test-only APIs leak into production use and signal hidden global state.

## 3. Boundary recipes

**Database.** Use the real engine: Testcontainers (Java/Kotlin, Node, Python, Go, .NET), an ephemeral database per run, or the framework's transactional test mode (Django `TestCase`, Rails transactional fixtures). Isolate per test via transaction rollback or unique schema/tenant. Run migrations in the test setup so tests catch migration errors. SQLite as a stand-in for Postgres/MySQL hides dialect, locking, and constraint differences — avoid it unless production is SQLite.

**HTTP to other services.** Intercept at the network layer: MSW (browser and Node), nock or undici `MockAgent` (Node), respx (httpx) or `responses` (requests) in Python, WireMock (JVM, standalone), OkHttp `MockWebServer` (Android/JVM), `httptest.Server` (Go). Your real client code runs, including serialization, headers, and timeouts. Add cases for 4xx, 5xx, timeouts, and malformed bodies.

**Third-party SDKs.** Adapter + fake for unit tests; a small number of adapter integration tests against the vendor's sandbox, run nightly or on adapter changes rather than on every commit if they are slow or rate-limited.

**Clock and randomness.** Inject `Clock`/`now()` and an ID/RNG provider. Use runner utilities where injection isn't possible: Vitest/Jest fake timers and `setSystemTime`, Python `time-machine` or `freezegun`, Kotlin `TestCoroutineScheduler`/virtual time, Go: pass a clock interface or use `testing/synctest` where your Go version supports it.

**Queues and events.** Use an in-memory transport for unit tests of producers/consumers; one integration test with the real broker (container) for serialization, acknowledgement, and redelivery (at-least-once → assert idempotency by delivering twice).

**File system.** Use a temp directory per test (`tmp_path` in pytest, `t.TempDir()` in Go, `fs.mkdtemp` in Node). In-memory file systems only when the code is written against an abstraction.

**LLM calls.** In unit/integration tests, fake the model adapter with recorded or hand-written responses (including malformed JSON, refusals, and timeouts) to test your plumbing deterministically. Quality of model behavior is measured with evals, not unit tests — see `ai-native-architecture`.

## 4. Frontend component tests

- Render the component with its real children and hooks; intercept the network (MSW) instead of mocking data hooks.
- Query like a user: by role and accessible name, label, or visible text (Testing Library). `data-testid` only when nothing accessible exists.
- Drive with user-level events (`userEvent`), not by calling handlers directly.
- Assert on what's rendered, including loading, empty, and error states.
- Don't mock child components to "isolate" the parent — that tests the wiring of mocks.

## 5. Warning signs

- Mock setup longer than the test body
- An assertion that fails only if a mock is removed
- `toHaveBeenCalledTimes` on internal helpers
- Tests break after a pure refactor with no behavior change
- A test passes with the production function body deleted
- The same fake behavior re-written in many test files (extract a shared fake)
- Mocking the module under test itself

## Sources

- Martin Fowler, "Mocks Aren't Stubs": https://martinfowler.com/articles/mocksArentStubs.html
- Gerard Meszaros, *xUnit Test Patterns* (test double vocabulary): http://xunitpatterns.com/Test%20Double.html
- Steve Freeman and Nat Pryce, *Growing Object-Oriented Software, Guided by Tests* (don't mock types you don't own)
- Testcontainers: https://testcontainers.com/
- Mock Service Worker: https://mswjs.io/
- Testing Library guiding principles and query priority: https://testing-library.com/docs/queries/about/#priority
- obra/superpowers, "Writing Good Tests" (mock assertions, complete mock data, test-only methods): https://github.com/obra/superpowers
