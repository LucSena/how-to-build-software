---
name: code-review
description: Use when reviewing code, a diff, a pull request, a branch, or AI-generated changes — including self-review before declaring your own work done. Covers the review order (intent, correctness, security, data and performance, design and maintainability, tests, style), severity levels (blocker, major, minor, nit), evidence discipline (observed vs inferred vs not checked), a checklist of AI-generated-code failure modes (hallucinated APIs and packages, over-abstraction, duplication, swallowed errors, N+1 and unbounded queries, secrets, injection, missing authorization, missing timeouts, dead code, tests that don't test), a security quick-scan, a performance quick-scan, and how to write specific, kind, actionable review comments. Also use when the user says "review this", "check my PR", "is this ready to merge", "LGTM?", "look over what the agent wrote", or "anything wrong with this diff". For UI and visual critique use design-review; for rewriting code yourself use clean-code.
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "clean-code testing-strategy design-patterns reliability api-design design-review"
---

# Code Review

Review protects the health of the codebase over time. The standard is not perfection: approve a change once it clearly improves overall code health, even if it isn't how you'd have written it — and never approve one that makes it worse. Most damage comes from many small degradations, and AI-generated code adds characteristic ones (plausible-looking APIs that don't exist, duplicated helpers, happy-path-only error handling, security holes). This skill gives you an order of attack, a severity scale, and an evidence discipline so every finding is real, ranked, and fixable.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Understand intent before judging lines.** Read the description, linked issue, and the most important file first; a correct implementation of the wrong thing is the biggest finding.
2. **Review in order of cost of being wrong.** Correctness and security before design; design before style. Don't bury a data-loss bug under twenty nits.
3. **Every finding has evidence.** Point to file and line, name the mechanism, and label it Observed, Inferred, or Not checked. No invented bugs.
4. **Every finding has a severity and a fix direction.** A comment the author can't act on is noise.
5. **Judge against the codebase's conventions, not your preferences.** Style the linter or style guide doesn't require is at most a nit.
6. **Review every line you're asked to review, in context.** Open the whole function or file when the diff hunk hides the surrounding logic.
7. **Be kind and specific.** Comment on the code, not the person; explain why; acknowledge what's done well.

## Workflow

- [ ] **Gather context.** PR description, linked issue/spec, project context, CI status, and `git diff --stat`. Note the author (human or agent) and the intended behavior in one sentence.
- [ ] **Size check.** Around 100 changed lines is comfortable; ~1,000 is usually too large to review well (Google's guidance). For large diffs, ask to split or review in explicit passes and say which parts you covered.
- [ ] **Run what you can.** Tests, type checker, linter, build. Anything you ran is Observed; anything you couldn't run goes in Not checked.
- [ ] **Pass 1 — Intent and design:** does the change belong here, solve the stated problem, and fit the architecture? If the approach is wrong, stop and say so before line comments.
- [ ] **Pass 2 — Correctness:** logic, edge cases, error paths, concurrency, data integrity (checklist below).
- [ ] **Pass 3 — Security quick-scan** (below; deep list in `references/security-checklist.md`).
- [ ] **Pass 4 — Data and performance quick-scan** (below; `references/performance-checklist.md`).
- [ ] **Pass 5 — Design and maintainability:** simplicity, reuse, conventions, naming, over-/under-abstraction (see `clean-code`, `design-patterns`).
- [ ] **Pass 6 — Tests:** do they exist at the right level and would they fail if the code broke?
- [ ] **Pass 7 — AI failure modes:** run the checklist below on every change; it is mandatory for agent-written code, including your own.
- [ ] **Pass 8 — Nits:** only what tooling doesn't catch; label them.
- [ ] **Write the review** in the Output format; re-read each finding and delete any you can't support with evidence.

## Severity levels

| Level | Meaning | Examples | Merge effect |
|---|---|---|---|
| **Blocker** | Will cause an incident, data loss, security breach, or clearly wrong behavior | SQL injection; missing authorization on an ID-based endpoint; migration that locks a large table; swallowed payment error; secret committed | Must fix before merge |
| **Major** | Likely bug or significant health cost | Missing error path on a network call; N+1 in a list endpoint; no tests for new logic; duplicated implementation of an existing helper; unbounded query | Fix before merge unless explicitly deferred with a ticket |
| **Minor** | Real but low-impact issue | Unclear name; missing edge-case test; small unnecessary abstraction; misleading comment | Author's call; fix now or follow up |
| **Nit** | Polish, preference within the style guide's latitude | Wording, ordering, tiny simplification | Optional; prefix with "Nit:" |

Also useful: **Question** (you don't understand — ask, don't assert), **FYI** (context for later, no action), and **Praise** (name good decisions specifically).

## Evidence discipline

- **Observed** — you saw it in the code or in output you produced (test run, type check, grep). Cite `file:line` and quote the minimal snippet.
- **Inferred** — likely, based on patterns, but not proven (e.g., "this ORM call inside the loop likely issues one query per item"). Say what would confirm it.
- **Not checked** — relevant but outside what you could verify (didn't run e2e, couldn't see the migration's table size, no access to production config).

Rules: never write "tests pass" unless you ran them; never assert a function doesn't exist without searching the dependency's installed version or docs; if unsure whether something is a bug, file it as a Question.

## Correctness checklist

- Does it do what the description says, for all inputs? Empty, null/missing, one, many, max size, duplicates, unicode, negative numbers, zero.
- Time: time zones, DST, end of month, clock skew, timestamps stored in UTC.
- Errors: every failure path handled, translated with context, or propagated — none swallowed; resources released; async work awaited.
- Concurrency: check-then-act races (`if not exists: insert`), read-modify-write without locking or atomic update, double submission, retries of non-idempotent operations.
- Data integrity: constraints in the database for invariants; transactions around multi-write operations; no network calls inside DB transactions.
- Backward compatibility: API contract changes, schema migrations (expand/contract), feature-flag defaults, old clients still in the field.
- Behavior users will see: loading, empty, error states; messages that tell the user what to do.

## AI-generated code failure modes

Check every item; details, detection commands, and fixes in `references/ai-code-failure-modes.md`.

- [ ] **Hallucinated or wrong APIs** — methods, options, or signatures that don't exist in the *installed* version. Verify against types/lockfile, not memory.
- [ ] **Hallucinated or typosquatted packages** — new dependency must exist, be the canonical package, maintained, and pinned in the lockfile.
- [ ] **Over-abstraction** — interfaces with one implementation, factories for one type, config for things that never vary, generic base classes.
- [ ] **Duplication** — a new helper/component/client that already exists in the repo.
- [ ] **Ignored conventions** — new folder scheme, error style, state library, or naming that differs from neighbors.
- [ ] **Missing or swallowed error handling** — happy path only; `catch` that logs and continues; floating promises.
- [ ] **Over-defensive code** — null checks on non-null types, `try` around everything, silent fallbacks that hide bugs.
- [ ] **N+1 queries and unbounded queries** — DB/HTTP calls inside loops; list queries with no limit.
- [ ] **Missing timeouts / naive retries** — network calls with no timeout; retries without backoff, cap, or idempotency.
- [ ] **Secrets and sensitive data** — keys in code, `.env` committed, secrets in client bundles or logs, PII in logs.
- [ ] **Injection and unsafe output** — string-built SQL/shell/HTML, `dangerouslySetInnerHTML`/`v-html` with untrusted data, `eval`, log injection.
- [ ] **Missing authorization** — ID-based access without an ownership/tenant check.
- [ ] **Dead code and leftovers** — unused functions, commented-out code, debug prints, placeholder stubs that look complete (`// TODO: implement`).
- [ ] **Tests that don't test** — assertions on mocks, expected values computed by the code under test, weakened/skipped tests, snapshot dumps.
- [ ] **Unrelated changes** — drive-by reformatting or rewrites outside the task.
- [ ] **Stale docs and comments** — README or docstrings describing behavior that doesn't exist; comments narrating the change.

## Security quick-scan

Blocker until proven otherwise:
- Every endpoint/handler/server action that takes an ID checks the caller may access that object (tenant/owner scoping in the query).
- Input parsed with a schema at the boundary; explicit allow-listed fields on writes (no `update(req.body)`); explicit output DTOs (no raw ORM entities returned).
- Parameterized queries only; no string-built SQL, shell commands, or file paths from user input.
- No secrets in code, config committed to git, client-side env (`NEXT_PUBLIC_*`, `VITE_*`), logs, or error responses.
- Outbound requests to user-supplied URLs are allow-listed (SSRF).
- Auth changes use vetted libraries; tokens validated (issuer, audience, expiry, algorithm).

Full list: `references/security-checklist.md`. This scan does not replace SAST, dependency scanning, and secret scanning — use them where available.

## Data and performance quick-scan

- No DB or network call inside a loop over a collection — batch, join, or eager-load.
- Every list query has a limit and pagination; max page size enforced.
- New query patterns have supporting indexes (and a migration for them); check with `EXPLAIN` when the table is large.
- Migrations safe for table size (no long locks; backfills batched).
- Every outbound call has a timeout; heavy work moved off the request path.
- No unbounded in-memory growth (caches without limits, reading whole files/exports into memory).

Full list: `references/performance-checklist.md`.

## Tests review

- Tests exist for new behavior and bug fixes, at the cheapest level that catches regressions.
- They would fail if the code broke — expected values are literals, assertions are on outcomes, not mocks.
- Error paths and authorization are tested, not only the happy path.
- No test was deleted, skipped, or loosened without an explicit reason in the PR.
- Tests are deterministic (no sleeps, real clocks, or real network).

See `testing-strategy` for what good looks like.

## Writing review comments

- **Anchor:** `file:line` and the smallest relevant snippet.
- **Say what and why:** the problem, the mechanism, the consequence. "This builds SQL from `req.query.sort`, so a crafted value can inject SQL; use an allow-list of sortable columns."
- **Suggest a direction** — or code when it's short. The author owns the fix; don't redesign their whole change in a comment.
- **Label severity** in the first word: `Blocker:`, `Major:`, `Minor:`, `Nit:`, `Question:`, `FYI:`.
- **Code, not person:** "This loop issues one query per order" — not "you wrote an N+1".
- **Ask when unsure:** "Question: can `items` be empty here? If so, `items[0]` throws."
- **Don't repeat the same comment 12 times** — note the pattern once and list locations.
- **Praise specifically:** "Good call making the webhook handler idempotent by event ID."

## Gotchas

- **Nit avalanche.** Thirty style comments and one buried blocker. Lead with blockers; cap nits or skip them when linters exist.
- **Rubber-stamping agent output.** Plausible code is not correct code. Verify imports and API calls against the installed versions, and run the tests.
- **Invented findings.** Claiming an API doesn't exist, or a bug exists, without checking. If you didn't verify it, it's a Question or Not checked.
- **Reviewing only the diff.** A 4-line change can break an invariant enforced 40 lines above. Open the file.
- **Preference as requirement.** "I'd use a class here" is not a finding unless it maps to a real cost.
- **Scope creep.** Asking the author to fix pre-existing problems unrelated to the change. File a follow-up instead.
- **Approving large unreviewable diffs.** Say what you did and didn't review, or ask for a split.
- **Missing the "should this exist" question.** Check for an existing helper, library, or feature flag before reviewing the details of a new one.
- **Self-review theater.** When reviewing your own work, run the full checklist and report honestly what you didn't verify.

## Output format

```
## Review: <PR title or change summary>
Intent: <one sentence — what the change is meant to do>
Verdict: Approve | Approve with comments | Request changes | Needs discussion
Scope reviewed: <files/areas covered; anything skipped>

### Blockers
- [Observed] `path/file.ts:42` — <problem, mechanism, consequence>. Fix: <direction>.
### Major
- [Inferred] `path/repo.py:88` — <…>. Confirm by: <how>. Fix: <direction>.
### Minor
- …
### Nits
- Nit: …
### Questions
- …
### What's good
- <specific praise>

Checks run: <tests/type check/lint/build and results>
Not checked: <what you could not verify>
```

Empty severity sections may be omitted. For self-review before finishing your own work, use the same shape and fix every Blocker and Major before reporting done.

## References

| File | Read when |
|---|---|
| `references/ai-code-failure-modes.md` | Reviewing agent-written code, a large generated diff, or any change adding dependencies — for detection commands and fixes per failure mode |
| `references/security-checklist.md` | The change touches auth, input handling, database queries, file or URL handling, secrets, dependencies, LLM output, or public endpoints |
| `references/performance-checklist.md` | The change touches queries, loops over data, list endpoints, migrations, caching, outbound calls, or rendering of large lists |

## Related skills

- `clean-code` — to fix the smells a review finds.
- `testing-strategy` — when tests are missing or weak.
- `design-patterns` — when the review finds over- or under-abstraction.
- `reliability` — timeouts, retries, and safe rollout of risky changes.
- `api-design` — contract, error format, pagination, and API security questions.
- `design-review` — for UI and visual critique of the same change.
