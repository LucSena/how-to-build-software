---
name: clean-code
description: Use when writing, refactoring, or cleaning up code, or when code is hard to read, name, change, or test. Covers naming, function size and shape, parameters, error handling (exceptions vs result types, parse-don't-validate, never swallowing errors), comments, immutability, deep vs shallow modules, duplication vs abstraction (DRY, rule of three, wrong abstraction), SOLID and its limits, code smells mapped to refactoring moves, safe refactoring of legacy code, and idioms for TypeScript, Python, Kotlin, Swift, and Go. Also use when the user says "clean this up", "refactor", "this is messy", "make it readable", "better names", "this function is too long", "god file", or "tidy before I add a feature". Not for choosing design patterns (use design-patterns), class and object design (use object-oriented-design), module or service boundaries (use software-architecture), or reviewing someone else's PR (use code-review).
license: MIT
metadata:
  version: "1.1.1"
  category: engineering
  related: "design-patterns object-oriented-design testing-strategy code-review software-architecture dependency-management"
---

# Clean Code

Clean code is code a future reader can understand and change safely. The enemy is complexity: change amplification (one change touches many places), cognitive load (too much to hold in your head), and unknown unknowns (you can't tell what a change will break). This skill makes you reduce complexity inside the scope of the task — without gold-plating, without imposing textbook structure on a codebase that already has conventions, and without either of the two failure modes AI-written code is measured to have: copy-pasted duplication and premature abstraction.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Follow the codebase's existing conventions first.** Linter config, style guide, and neighboring files outrank this skill; a consistent codebase beats a locally "better" file.
2. **Search before you write.** Grep for an existing helper, type, or component before creating one; a second `formatDate` is worse than either.
3. **Abstract only with two real uses or a real boundary.** One implementation behind an interface, factory, or base class is ceremony, not design.
4. **Prefer deep modules.** A small interface hiding a lot of work beats many shallow pass-through layers.
5. **Handle, translate, or propagate every error — never swallow it.** A silent `catch` turns a crash you can see into corruption you can't.
6. **Make illegal states unrepresentable.** Types that cannot hold a contradiction remove whole classes of bugs and checks.
7. **Refactor in small, behavior-preserving steps with tests green between steps.** Separate "make the change easy" from "make the easy change".

## Workflow

- [ ] **Read the neighborhood.** Open 2–3 sibling files, the linter/formatter config, and any style guide. Note naming, error style, file layout, test style. Match them.
- [ ] **Scope the cleanup.** Clean what the task touches (plus what blocks it). List anything larger as a follow-up instead of doing it silently.
- [ ] **Secure behavior first.** If the code you will change has no tests, write characterization tests that pin current behavior (see `testing-strategy`). Check: they pass before any change.
- [ ] **Diagnose.** Name each smell and its refactoring (table below, full map in `references/smells-refactorings.md`). If you can't name the smell, you may just have a preference — leave it.
- [ ] **Tidy first? Decide when.** If a small structural cleanup makes the requested change easy and you know exactly what it is, do it *first* as a separate commit (minutes, not hours). If it would only pay off later, list it as a follow-up; if the code won't change again, leave it (Beck's first/after/later/never).
- [ ] **Refactor in steps.** One named refactoring at a time; run tests/type checker after each. Never mix a refactor and a behavior change in one step or commit.
- [ ] **Self-check.** Walk the Gotchas list. Ask: did this change increase or decrease what a future reader must hold in their head?
- [ ] **Report** in the Output format, including what you did not verify.

## Precedence of rules

| Source | Wins over | Example |
|---|---|---|
| Explicit team decision (project context, ADR, style guide, lint config) | Everything below | Repo uses exceptions everywhere → don't introduce `Result` in one module |
| Consistency with surrounding code | Language idioms, this skill | Neighbors use `get*` for lookups → don't add `fetch*` for the same kind of operation |
| Language idioms (`references/language-idioms.md`) | Generic advice | Go returns `error` values; Python raises; don't port one style to the other |
| This skill | Personal taste | — |

If the existing convention is actively harmful (swallowed errors, SQL built by string concatenation), fix it in the code you touch and flag the rest; don't silently copy a bug pattern.

## Naming

- **Names carry intent and units:** `retryDelayMs`, `invoiceTotalCents`, `isEligibleForRefund` — not `data`, `tmp`, `info`, `val`, `handle`, `process`.
- **One word per concept.** Pick `get`/`fetch`/`load` once per kind of operation and use it everywhere; use the domain's own terms (what users and the business call it).
- **Booleans read as questions:** `is/has/can/should` prefix, positive form (`isEnabled`, not `isNotDisabled`).
- **Functions are verbs, types are nouns.** `Manager`, `Processor`, `Helper`, `Utils`, `Data`, `Info` are signs of a missing concept — name the concept.
- **Length tracks scope.** `i` is fine in a three-line loop; an exported symbol needs a full name.
- **Named constants for magic values:** `MAX_UPLOAD_BYTES = 10 * 1024 * 1024`, with the unit in the name.
- **Hard to name = hard to understand.** If no honest name fits, the function or class probably does two things. Split it before naming it.

## Functions

Size is a smell, not a rule. Use these as prompts to look, never as automatic split triggers:

| Signal | Soft threshold | Look for |
|---|---|---|
| Function length | > ~50 lines | Several levels of abstraction mixed; extractable phases |
| Parameters | > 3 | A parameter object, or a function doing two jobs |
| Boolean flag parameter | any | Two behaviors in one function → two functions or an enum |
| Nesting depth | > 3 | Guard clauses, early returns, extracted predicate |
| File length | > ~400 lines | Several concepts sharing a file → split by cohesion, not by line count |

- **One level of abstraction per function.** A function that calls `chargeCustomer()` should not also parse header bytes. Read it top to bottom like a summary.
- **Extract when** the piece has an honest name *and* a simple interface, or is reused, or needs its own test. **Don't extract** when the reader must jump back and forth to understand either half ("conjoined" functions) — that is fragmentation, not clarity.
- **Command–query separation:** a function either changes state or returns information. Exceptions are conventional (`pop`, upsert-returning-row).
- **Functional core, imperative shell.** Keep business rules pure (inputs → outputs); push I/O, clock, randomness, and logging to the edges. Pure code is trivially testable.
- **No hidden temporal coupling.** If `init()` must precede `run()`, make it impossible to get wrong: do the work in a constructor/factory, or return a ready object.

## Error handling

Decide per failure which kind it is, then use the language's native mechanism for that kind:

| Failure kind | Example | Default handling |
|---|---|---|
| Expected domain outcome | Validation failed, not found, insufficient funds | Return a typed result the caller must handle (union/sealed type/`Result`; Go `error`; Python: specific exception is idiomatic) |
| Environmental fault | Timeout, connection refused, disk full | Propagate with context; retry only at one layer and only if idempotent (see `reliability`) |
| Bug / broken invariant | Impossible state, null where the type forbids it | Fail fast and loudly (throw/panic/assert); don't "recover" into a default |

Rules that agents get wrong most:

- **Never swallow.** `catch {}`, `except: pass`, `catch (e) { console.log(e) }`, `_ = err` are defects. Handle (with a defined recovery), translate (wrap with context and rethrow), or propagate.
- **Handle where a decision can be made.** Lower layers add context (`cause`, `raise … from e`, `%w`); the boundary (request handler, job runner, UI) decides what the user sees and logs once.
- **Parse, don't validate.** At every trust boundary (HTTP input, env/config, files, queue messages, third-party and LLM responses) parse into a typed value with a schema (Zod/Valibot, Pydantic, kotlinx.serialization, `Codable`). Inside, trust the types and stop re-checking.
- **Don't be over-defensive.** Null checks on non-nullable types, `try` around code that cannot throw, and silent fallbacks to defaults hide bugs. Defense belongs at boundaries.
- **Define errors out of existence** where semantics allow: deleting a missing key is a no-op, `substring` clamps, an empty list is a valid result.
- **Fail fast on startup** for missing configuration or secrets — not on the first request that needs them.
- **Clean up deterministically:** `finally`, `with`, `use {}`, `defer`, `using`. Every promise/future/task is awaited or explicitly supervised.

Detailed rules with code in five languages: `references/error-handling.md`.

## Comments

- **Explain why, not what:** constraints, trade-offs, links to incidents or specs, why the obvious approach was not used.
- **Interface comments are design.** On exported functions/types, state what is promised: units, preconditions, error behavior, thread-safety. If this is hard to write, the interface is wrong.
- **Never narrate code or the conversation:** no `// increment counter`, no `// updated to use the new API`, no `// as requested`. History belongs in version control.
- **Delete commented-out code.** Git remembers.
- **TODOs carry an owner or ticket**, or they are deleted.
- Complex regexes and non-obvious algorithms deserve a "what" comment; that is the exception.

## State and immutability

- **Immutable by default:** `const`/`readonly`, `val`, `let`, frozen dataclasses, value-type structs. Mutate locally only for a measured performance need.
- **Unions over flag bags.** Replace `{ isLoading, error?, data? }` with `{ status: 'loading' } | { status: 'error', error } | { status: 'ok', data }` and switch exhaustively.
- **Value objects only where there is an invariant** (money with currency, email, IDs that must not be mixed). Wrapping every primitive in a CRUD app is boilerplate.
- **One owner for shared mutable state** with a narrow API (store, actor, repository). No module-level mutable globals.

## Duplication vs abstraction

AI-assisted codebases measurably drift both ways: GitClear's analysis found copy-pasted code overtaking refactored code, and studies of LLM output report more code smells than human baselines. The rule is two-sided:

| Situation | Do |
|---|---|
| The same business rule/knowledge lives in two places | Deduplicate now — it will drift |
| Two blocks look alike but encode different rules that change for different reasons | Leave them; similar text is not shared knowledge |
| Third occurrence and you understand how the cases vary | Extract, with parameters for the real variation only |
| An existing abstraction is growing flags/params per caller | Inline it back into callers, then re-extract what is truly shared ("duplication is far cheaper than the wrong abstraction") |
| A helper for this already exists | Reuse or extend it; never create `utils2` or a parallel version |

YAGNI does not cover things that are expensive to retrofit: security, data model and IDs, idempotency, observability hooks, migrations, public API contracts, tenant isolation. Design those now.

## Deep modules and SOLID, briefly

- **Deep > shallow.** A module earns its interface by hiding complexity. Red flags: pass-through methods, a `Service` that forwards every call to a `Repository`, a wrapper whose interface is as big as what it wraps, the same design decision leaking into several modules. Full red-flag list: `references/principles-critique.md`.
- **Pull complexity down.** The implementer absorbs complexity (sensible defaults, internal retries, normalization) instead of pushing knobs onto every caller.
- **Class and object design** (what deserves a class, responsibilities, inheritance vs composition, DI, value objects) lives in `object-oriented-design`.
- **SOLID is a set of heuristics, not laws.** Keep the kernels (separate things that change for different reasons; honor subtype contracts; depend on abstractions at I/O boundaries). Reject the misreadings: one-method classes (SRP), speculative extension points (OCP), an `IFoo` for every `Foo` (DIP). Details and critiques in `references/principles-critique.md`.

## Smells → refactorings (most common)

| Smell | Refactoring |
|---|---|
| Long function | Extract Function, Decompose Conditional, Split Phase |
| Long parameter list / flag argument | Introduce Parameter Object, Remove Flag Argument |
| Duplicated knowledge | Extract Function; Slide Statements first to line up the copies |
| Repeated `switch` on the same type tag | Exhaustive `switch` over a union/sealed type, or polymorphism when variants are open |
| Primitive obsession / data clumps | Replace Primitive with Object; Introduce Parameter Object |
| Feature envy | Move Function to the data it uses |
| Shotgun surgery (one change, many files) | Move Function/Field to gather the knowledge; Combine into module |
| Divergent change (one file, many reasons) | Split Phase; Extract Module |
| Speculative generality | Inline Function/Class, Collapse Hierarchy, delete unused parameters |
| Global or mutable data | Encapsulate Variable; Separate Query from Modifier |

For legacy code and large changes, use seams, characterization tests, Parallel Change, and Strangler Fig instead of a rewrite — procedure in `references/smells-refactorings.md`.

## Gotchas

- **Imposing a textbook style on an existing repo.** Introducing `Result` types, a new folder scheme, or a different error style in one file makes the codebase less consistent. Match, then propose the change separately.
- **Rewriting whole files for a small fix.** Large diffs hide bugs and are unreviewable. Keep the diff to what the task needs; no drive-by reformatting.
- **Splitting by line count.** Chopping a 60-line function into six 10-line functions that must be read together raises cognitive load. Split along concepts.
- **Interface with one implementation "for testability".** Test with the real class, or with a fake at the actual I/O boundary. Delete interfaces you introduced that have one implementation and no boundary.
- **Catching to log and continue.** `catch (e) { logger.error(e) }` followed by normal flow returns wrong data silently. Rethrow, return an error, or handle for real.
- **Validating in every layer.** Repeated `if (!user) throw` deep inside the core means the boundary did not parse. Parse once at the edge, pass typed values in.
- **Comments that narrate or address the user.** Remove `// Now we loop over the items` and `// Fixed per your request`.
- **Leftovers.** Unused imports, dead functions, debug prints, commented-out code, placeholder stubs (`// TODO: implement`) that look finished. Remove before reporting done.
- **Refactor plus behavior change in one step.** When tests fail you can't tell which caused it. Two steps, ideally two commits.
- **Renaming by text search.** Use the language server's rename or a typed codemod; text replace misses dynamic references and hits unrelated strings.
- **Installing a package for a few lines** (`is-odd`, `left-pad`, `uuid` for v4). Use the platform or write it with edge-case tests; see `dependency-management`.
- **Quoting a book as the reason.** "Clean Code says…" or "Ousterhout says…" is not evidence; the authors disagree with each other. Resolve with the tension map in `references/canonical-talks-and-essays.md` and evidence from this codebase.
- **"Improving" performance-critical code into polymorphic layers.** In measured hot paths, a flat loop over plain data can be much faster; profile before and after.

## Output format

For a cleanup or refactor, reply with:

```
Summary: <one sentence — what changed and whether behavior is preserved>
Changes:
- <smell> in <file:symbol> → <refactoring applied>
Verification: <tests/type check/lint run and result; characterization tests added>
Not checked: <what you could not verify>
Follow-ups (not done): <larger issues noticed, each one line>
```

When asked only for advice, list findings as `smell → refactoring → why`, ordered by impact.

## References

| File | Read when |
|---|---|
| `references/smells-refactorings.md` | You found a smell not in the table above, need the mechanics of a refactoring, or must change legacy code without tests |
| `references/error-handling.md` | Designing error types, choosing exceptions vs result values, wrapping errors, or handling async/cleanup in a specific language |
| `references/language-idioms.md` | Writing or cleaning TypeScript, Python, Kotlin, Swift, or Go and need the idiomatic default for that language |
| `references/principles-critique.md` | Someone cites SOLID, DRY, clean architecture rules, or "small functions" as a reason for a change, or you need Ousterhout's red flags as a checklist |
| `references/canonical-talks-and-essays.md` | Two principles conflict (small functions vs deep modules, DRY vs duplication, comments vs names, tidy now vs later), or the user cites a book, talk, or essay (Clean Code, A Philosophy of Software Design, Tidy First?, Simple Made Easy, cognitive load) |

## Related skills

- `design-patterns` — when the cleanup reveals a real need for a pattern (or an unnecessary one to remove).
- `object-oriented-design` — when the mess is at class level: god objects, Manager/Helper classes, deep inheritance, singletons, anemic models.
- `testing-strategy` — to add characterization or behavior tests before refactoring.
- `software-architecture` — when the problem is module or service boundaries, not code inside them.
- `code-review` — to review the result or someone else's change.
- `dependency-management` — before adding a package to solve something a few lines or the platform could.
