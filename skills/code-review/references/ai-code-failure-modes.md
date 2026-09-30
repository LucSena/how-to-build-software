# AI-Generated Code Failure Modes

AI-assisted code fails in recognizable ways. Use this catalog when reviewing agent-written changes — including your own — and when a diff is large or adds dependencies. Each entry: what it looks like, how to detect it quickly, and the fix.

## Contents
1. Evidence base (why these checks exist)
2. Supply chain: hallucinated APIs and packages
3. Structure: over-abstraction, duplication, ignored conventions, god files
4. Errors: swallowed, missing, and over-defensive handling
5. Data and resilience: N+1, unbounded queries, missing timeouts, races
6. Security: secrets, injection, authorization
7. Hygiene: dead code, stubs, comments, unrelated changes, stale docs
8. Tests that don't test
9. Quick detection commands

## 1. Evidence base

Cite sparingly; these justify the checks, they are not review comments.
- **Security:** Veracode's 2025 GenAI Code Security Report tested 100+ models on 80 tasks: about 45% of outputs introduced an OWASP Top 10 vulnerability; cross-site scripting and log injection tasks failed in the large majority of cases; larger models were not materially safer.
- **Maintainability:** GitClear's analysis of hundreds of millions of changed lines found copy/pasted code exceeding moved (refactored) code for the first time, with refactoring declining and duplicated blocks rising.
- **Smells:** a 2025 study (arXiv 2510.03029) found LLM-generated code carried substantially more code smells than human reference solutions, worse on complex and object-oriented tasks.
- **Packages:** a USENIX Security 2025 study found 19.7% of package names suggested across 16 models were hallucinated (5.2% for commercial models, 21.7% for open-source ones), with many repeated across runs — an attack surface ("slopsquatting"). Later evaluations of frontier models report lower but non-zero rates.
- **Delivery:** DORA's 2025 report found AI adoption raises throughput but is associated with more delivery instability; AI amplifies existing practices, good or bad.

## 2. Supply chain

### Hallucinated or wrong APIs
- **Looks like.** Calls to methods or options that don't exist, wrong argument order, APIs from a different major version, deprecated functions.
- **Detect.** Run the type checker and build. For dynamic languages, open the installed package's source/types (`node_modules/<pkg>/...d.ts`, `site-packages/<pkg>`) or its docs for the exact version in the lockfile.
- **Fix.** Replace with the real API for the installed version; add a test that exercises the call path.

### Hallucinated, typosquatted, or unnecessary packages
- **Looks like.** A new dependency in the manifest with an unfamiliar name, a near-miss of a popular package, or one that duplicates something already installed.
- **Detect.** Check the lockfile diff; confirm on the registry that the package exists, is the canonical one (repository link, publisher, download volume, recent releases), and has an acceptable license. Search the repo for an existing dependency that covers the need.
- **Fix.** Remove, or replace with the canonical package; pin via lockfile. New infrastructure or major dependencies need a stated requirement (and an ADR where the project uses them).

## 3. Structure

### Over-abstraction / speculative generality
- **Looks like.** Interfaces with one implementation; `BaseService<T>`; factories building one type; strategy registries with one entry; config flags nobody sets; plugin systems for one plugin.
- **Detect.** For each new interface/abstract type, count implementations (`rg "implements Foo|: Foo\b"`). Ask "what second case exists today?"
- **Fix.** Inline to the concrete type; keep interfaces only at I/O boundaries. See `design-patterns`.

### Duplicate implementations
- **Looks like.** New `formatCurrency`, `httpClient`, `useDebounce`, `Button`, or date helper when one exists.
- **Detect.** Grep the repo for the concept name and synonyms (`format.*(money|currency|price)`), and for identical code blocks.
- **Fix.** Reuse or extend the existing one; delete the copy.

### Ignoring existing conventions
- **Looks like.** New folder structure, different error-handling style, different state library, different test framework, mixed naming.
- **Detect.** Compare with 2–3 sibling files.
- **Fix.** Match the neighbors; propose convention changes separately.

### God files and components
- **Looks like.** A single file growing past ~400 lines with unrelated concerns; a component handling fetching, forms, and business rules.
- **Fix.** Put new code in the module that owns the concept; split by cohesion.

## 4. Errors

### Missing or swallowed error handling
- **Looks like.** Happy path only; `catch (e) { console.log(e) }` then continue; `except Exception: pass`; unawaited promises; `_ = err`.
- **Detect.** `rg "catch\s*\([^)]*\)\s*\{\s*(console\.\w+\([^)]*\);?\s*)?\}"`, `rg "except.*:\s*pass"`; enable `no-floating-promises`.
- **Fix.** Handle, translate with context, or propagate. See `clean-code` error-handling reference.

### Over-defensive code
- **Looks like.** Null checks on non-nullable values; `try/catch` wrapped around code that can't throw; `?? []` fallbacks that hide missing data; re-validation deep in the core.
- **Fix.** Validate at boundaries, trust types inside; let bugs fail loudly.

## 5. Data and resilience

### N+1 queries
- **Looks like.** ORM relation access or `await fetch` inside `for`/`map` over a collection.
- **Detect.** `rg -n "for .* of|\.map\(|\.forEach\(" -A5 | rg "await|\.find|\.get\("` as a rough pass; enable query logging in a test and count queries.
- **Fix.** Eager-load, batch by IDs (`WHERE id = ANY($1)`), DataLoader for GraphQL; add a query-count assertion.

### Unbounded queries and payloads
- **Looks like.** `findMany()` / `SELECT *` with no `LIMIT`; exports loaded into memory; uploads without size limits.
- **Fix.** Pagination (cursor by default) with max page size; streaming for exports; request size limits.

### Missing timeouts and naive retries
- **Looks like.** `fetch(url)` without a signal; `requests.get` without `timeout`; retry loops with fixed delays, no cap, or around non-idempotent calls; retries at several layers.
- **Fix.** Timeout on every call; capped exponential backoff with jitter at one layer; idempotency keys. See `reliability`.

### Race conditions
- **Looks like.** `if (!exists) insert`; read-modify-write of balances or counters; double-submit on forms.
- **Fix.** Unique constraints, atomic updates, transactions/locks, idempotency keys.

## 6. Security

### Secrets
- **Looks like.** Keys or tokens in source, tests, or fixtures; `.env` committed; secrets in public env prefixes (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`); tokens logged.
- **Detect.** Secret scanners (gitleaks, trufflehog, platform push protection); `rg -i "(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}"`.
- **Fix.** Remove and **rotate** (a committed secret is compromised even after deletion); load from env/secret manager.

### Injection and unsafe output
- **Looks like.** Template strings in SQL, `exec`/`subprocess` with `shell=True` and user input, `innerHTML`/`dangerouslySetInnerHTML`/`v-html` with untrusted data, `eval`, user input written raw into logs.
- **Fix.** Parameterized queries; argument arrays for processes; framework escaping or a sanitizer; structured logging.

### Missing authorization
- **Looks like.** `GET /invoices/:id` loading by ID alone; server actions without an ownership check; admin routes guarded only in the UI.
- **Fix.** Scope every query by tenant/owner; deny by default; test cross-user access. See `security-checklist.md`.

## 7. Hygiene

- **Dead code and leftovers:** unused exports, commented-out blocks, `console.log`/`print` debugging, feature flags that are always on. Detect with unused-code tools (knip or ts-prune for TS, vulture for Python, `staticcheck` for Go, IDE inspections).
- **Placeholder stubs that look finished:** `// TODO: implement`, functions returning hard-coded values, `pass`, `NotImplementedError` in reachable paths, mock data wired into production code. These are Blockers if reachable.
- **Narrating comments:** `// Now we call the API`, `// Updated to fix the bug`, comments addressing the user. Remove.
- **Unrelated changes:** reformatting, renames, or rewrites outside the task. Ask to split — they hide the real change.
- **Stale docs:** README or docstrings claiming features or flags that don't exist. Verify claims against code.
- **Hard-coded environment details:** URLs, ports, regions, IDs. Move to validated config.

## 8. Tests that don't test

- Assertions on mocks (`toHaveBeenCalled`) instead of outcomes.
- Expected values computed with the same logic or helper as the code under test.
- Tests weakened, `.skip`-ped, or deleted to get green — Blocker without an explicit reason.
- `try/catch` inside a test that makes a throwing path pass.
- Giant snapshots accepted without review.
- Tests that pass with the function body deleted (check by mutating one condition).
See `testing-strategy`.

## 9. Quick detection commands

Adjust to the repo's languages; hits are candidates, not verdicts.

```bash
git diff --stat origin/main...HEAD                    # size and spread of the change
git diff origin/main...HEAD -- '*package.json' '*requirements*.txt' '*pyproject.toml' '*go.mod' '*build.gradle*' '*Package.swift' '*Podfile'   # new dependencies
rg -n "TODO|FIXME|XXX|implement later|not implemented" $(git diff --name-only origin/main...HEAD)
rg -n "console\.log|print\(|debugger;|fmt\.Println" $(git diff --name-only origin/main...HEAD)
rg -n "\.skip\(|@pytest\.mark\.skip|@Disabled|@Ignore|xit\(|it\.only|describe\.only" $(git diff --name-only origin/main...HEAD)
rg -n "dangerouslySetInnerHTML|innerHTML\s*=|v-html|eval\(|shell=True" $(git diff --name-only origin/main...HEAD)
```

## Sources

- Veracode, 2025 GenAI Code Security Report: https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/
- GitClear, AI code quality research: https://www.gitclear.com/the_ai_code_quality_maintainability_gap ; LeadDev coverage: https://leaddev.com/ai/code-maintainability-plummets-in-the-ai-coding-era
- "Investigating the Smells of LLM Generated Code": https://arxiv.org/abs/2510.03029
- "We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs" (USENIX Security 2025): https://arxiv.org/abs/2406.10279 ; Socket on slopsquatting: https://socket.dev/blog/slopsquatting-targets-across-frontier-llms
- DORA 2025 State of AI-assisted Software Development: https://dora.dev/dora-report-2025/
- Google Engineering Practices, code review: https://google.github.io/eng-practices/review/
- obra/superpowers, requesting-code-review and verification-before-completion skills: https://github.com/obra/superpowers
