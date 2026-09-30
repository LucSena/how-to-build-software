# Techniques: TDD, Characterization, Property-Based, Contract, Snapshot, Mutation

Use each technique where its specific strength matters. None of them replaces clear behavior tests at the right level.

## Contents
1. TDD
2. Characterization tests
3. Property-based testing
4. Contract testing
5. Snapshot and approval tests
6. Mutation testing
7. Fuzzing
8. What belongs elsewhere (load, security, accessibility, LLM evals)

## 1. TDD

**Cycle.** Red: write one small failing test for the next behavior and watch it fail for the expected reason. Green: write the minimum code to pass. Refactor: improve structure with the test green. Repeat.

**Why it suits agents.** A failing test written first is an executable specification: it pins what "done" means, prevents writing code that only looks plausible, and proves the test can fail. Tests written after the code often pass immediately — which proves nothing about whether they catch bugs.

**Use it for.**
- **Every bug fix:** reproduce the bug as a failing test first; the fix is done when it passes and nothing else broke.
- Pure logic, parsers, calculations, validation, state machines.
- Well-specified API behavior (status codes, error shapes).

**Skip or defer for.** Exploratory spikes, layout and visual work, throwaway prototypes. Before merging, add behavior tests — and if you write them after the code, break the code once to see them fail.

**Watch it fail for the right reason.** A test failing with `TypeError: undefined is not a function` is not red for the behavior; fix the scaffolding until the failure message describes the missing behavior.

**Common rationalizations to reject.**
| Excuse | Reality |
|---|---|
| "Too simple to test" | Simple code breaks too; the test costs a minute |
| "I'll add tests after" | Tests written after tend to mirror the implementation and pass by construction |
| "I tested it manually" | Manual checks don't run on the next change |
| "The test is wrong, I'll relax it" | Only after stating why the expectation was wrong, in the change summary |

## 2. Characterization tests

For legacy code without tests: record what the code *currently* does, then refactor under that net.
- Call the code with realistic and edge inputs; assert the actual outputs, even odd ones.
- Mark suspicious behavior with a comment and a ticket — don't fix it during the refactor.
- For large outputs, an approval/golden-master file is acceptable temporarily.
- Replace with intention-revealing behavior tests as the code gets decomposed.
Refactoring procedure: see `clean-code` (`references/smells-refactorings.md`).

## 3. Property-based testing

Generate many inputs and check a property that must hold for all of them; the framework shrinks failures to a minimal example.

| Property pattern | Example |
|---|---|
| Round-trip | `decode(encode(x)) == x` for serializers, parsers, URL builders |
| Invariant | Sorting preserves length and elements; balance never negative after valid operations |
| Idempotence | `normalize(normalize(x)) == normalize(x)`; applying the same event twice changes nothing |
| Oracle / reference model | Optimized implementation equals a simple slow one |
| Metamorphic | Adding a filter never increases result count; scaling all prices scales the total |
| State machine / model-based | Random sequences of commands against the system and a simple model agree |

Tools (use what the stack has): fast-check (TS/JS), Hypothesis (Python), Kotest property testing or jqwik (JVM), SwiftCheck-style libraries (Swift), Go's native fuzzing or `testing/quick`, proptest (Rust).

Rules:
- Constrain generators to valid domain inputs (or test the parser's rejection separately).
- Record the seed on failure; add the shrunk counterexample as a normal example test.
- Keep run counts modest in CI (the default is usually fine); run larger counts nightly.

## 4. Contract testing

Verify that independently deployed consumers and providers agree, without spinning up both in an e2e environment.

| Approach | How | Use when |
|---|---|---|
| Consumer-driven contracts (Pact) | Consumer tests record expected requests/responses into a contract; provider CI verifies against it | Several internal consumers of one service; teams deploy independently |
| Schema-based (OpenAPI, GraphQL SDL, protobuf) | Lint and diff the schema for breaking changes in CI (e.g., `buf breaking`, OpenAPI diff tools); validate responses against the schema in provider tests | Public APIs; many or unknown consumers |
| Event schemas | Schema registry with compatibility rules, or contract tests for message payloads | Async events between services |

Rules:
- Contracts describe what the consumer *uses*, not the full provider response.
- Provider verification runs in the provider's CI before deploy.
- A breaking schema change fails CI unless it's a new version (see `api-design`).
- Contract tests don't replace a few e2e smoke tests of the deployed system.

## 5. Snapshot and approval tests

**Use for** small, stable, reviewable outputs: CLI output, generated code/config, serialized error payloads, SQL generated by a query builder, a single design-system component's DOM.
**Avoid for** large component trees and full pages — diffs become unreadable and get accepted with `-u` without review.

Rules:
- Prefer inline snapshots for small outputs so the expectation is visible in the test.
- Scrub nondeterministic fields (timestamps, IDs) before snapshotting.
- Review snapshot diffs like code; an unexplained snapshot update in a PR is a review finding.
- For visual appearance use visual regression (`e2e-visual-mobile.md`), not DOM snapshots.

## 6. Mutation testing

Mutation tools change the production code (flip `<` to `<=`, remove a call, return a constant) and check whether any test fails. Surviving mutants mark behavior no test protects.

- Tools: Stryker (JS/TS, C#, Scala), mutmut or cosmic-ray (Python), PIT (JVM/Kotlin), go-mutesting and similar (Go).
- Run on critical modules (billing, auth, pricing, permissions) or on changed files — whole-codebase runs are slow.
- Treat the score as a signal for where tests are weak; don't set an arbitrary global target.
- Manual version for any change: mentally (or actually) mutate the key condition and confirm a test goes red.

## 7. Fuzzing

Coverage-guided fuzzing feeds random mutated bytes to find crashes and hangs.
- Use for parsers of untrusted input (file formats, protocol decoders, template engines) and anything security-sensitive.
- Go has native fuzzing (`go test -fuzz`); Python has Atheris; JS/TS has Jazzer.js; JVM has Jazzer; Rust has cargo-fuzz.
- Commit crashing inputs as regression tests.

## 8. What belongs elsewhere

| Concern | Where |
|---|---|
| Load, stress, capacity tests | `scalability` (and `reliability` for SLO-based checks) |
| Resilience (timeouts, retries, dependency failure, chaos) | `reliability` |
| Security testing (SAST, dependency scanning, authz tests) | `code-review` security checklist; `api-design` for API authz |
| Automated accessibility checks (axe) and manual screen reader passes | `accessibility` |
| LLM output quality (golden datasets, LLM-as-judge, regression evals) | `ai-native-architecture` |

## Sources

- Kent Beck, *Test-Driven Development: By Example* (2002)
- obra/superpowers test-driven-development skill ("watch it fail", rationalizations): https://github.com/obra/superpowers
- Michael Feathers, *Working Effectively with Legacy Code* (characterization tests)
- Hypothesis docs: https://hypothesis.readthedocs.io/ ; fast-check docs: https://fast-check.dev/
- Pact docs: https://docs.pact.io/ ; buf breaking change detection: https://buf.build/docs/breaking/
- Stryker Mutator: https://stryker-mutator.io/ ; PIT: https://pitest.org/ ; mutmut: https://github.com/boxed/mutmut
- Go fuzzing: https://go.dev/doc/security/fuzz/
- Kent C. Dodds, "Effective Snapshot Testing": https://kentcdodds.com/blog/effective-snapshot-testing
