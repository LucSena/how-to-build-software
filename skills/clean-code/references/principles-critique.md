# Principles and Their Limits

Principles are compressed experience, and each one has a failure mode when applied as a law. Use this file when someone (including you) justifies a change by citing a principle: check the kernel, check the misreading, then decide on the actual cost in this codebase.

## Contents
1. Complexity as the measure (Ousterhout)
2. Ousterhout red flags — review checklist
3. SOLID with critique
4. DRY, WET, AHA, and the rule of three
5. YAGNI and KISS — and where they stop
6. Coupling: connascence and the Law of Demeter
7. Alternatives and critiques: CUPID, "small functions", performance

## 1. Complexity as the measure

Complexity is whatever makes a system hard to understand and change. It shows up as:
- **Change amplification** — a simple change requires edits in many places.
- **Cognitive load** — a developer must know a lot to make a change safely.
- **Unknown unknowns** — it is not obvious what must change or what will break (the worst of the three).

It is caused by **dependencies** (code that can't be understood or changed in isolation) and **obscurity** (important information is not obvious). It accumulates in small increments, so every change either pays it down or adds to it.

**Tactical vs strategic programming.** Tactical work optimizes for "it runs now"; strategic work also invests a little in design (Ousterhout suggests roughly 10–20% of effort). Agents default to tactical. Within the scope of a task, choose the strategic option when it costs little: a better name, a deeper function, one parsed type instead of three checks.

## 2. Ousterhout red flags — review checklist

| Red flag | What it looks like | Fix direction |
|---|---|---|
| Shallow module | Interface nearly as complex as the implementation; one-line wrappers | Merge into caller or into a deeper module |
| Information leakage | The same design decision (file format, protocol detail) known by several modules | Put the decision in one module; others use its interface |
| Temporal decomposition | Structure mirrors execution order (`readFile`, `parseFile`, `writeFile` classes sharing format knowledge) | Structure around knowledge hiding, not steps |
| Overexposure | Common use requires learning rarely used options | Sensible defaults; separate advanced API |
| Pass-through method | Method only forwards to another with the same signature | Remove the layer or give it real responsibility |
| Pass-through variable | Parameter threaded through many layers that don't use it | Context object, dependency injection at construction |
| Repetition | Same nontrivial code in several places | Extract once the shared knowledge is clear |
| Special-general mixture | General-purpose code contains special cases for one caller | Move the special case to the caller |
| Conjoined methods | You can't understand one method without reading another | Merge, or redraw the boundary |
| Comment repeats code | Comment adds nothing the code doesn't say | Delete or replace with "why" |
| Implementation contaminates interface | Interface docs describe internals | Document the contract only |
| Vague name | `data`, `info`, `manager`, `handle` | Precise name; if none fits, rethink |
| Hard to pick a name | No honest name fits | The entity mixes concerns — split |
| Hard to describe | Interface comment needs many caveats | The abstraction is wrong |
| Nonobvious code | Behavior or meaning can't be understood quickly | Better names, simpler structure, or a "why" comment |

**Deep module** = simple interface, substantial hidden implementation (Unix file I/O: a handful of calls hiding caching, devices, permissions). **General-purpose-ish interfaces are deeper**: design the interface slightly more general than today's single use (e.g., `insert(position, text)` instead of `handleBackspaceKey()`), but add no speculative features.

## 3. SOLID with critique

| Principle | Kernel worth keeping | Common misreading | Rule of thumb |
|---|---|---|---|
| Single Responsibility | Separate code that changes for different reasons (different actors/stakeholders) | "One method per class" → many shallow classes (classitis) | Group by reason to change; fewer, deeper modules |
| Open/Closed | Provide extension points where variation already exists | Adding plug-in points for imagined variation | Add a seam when the second real variant arrives |
| Liskov Substitution | Subtypes must honor the parent's contract | Treated as a checkbox while building deep hierarchies | Mostly an argument for composition and sealed types; never override to throw `NotImplemented` |
| Interface Segregation | Clients shouldn't depend on methods they don't use | One-method interfaces for everything | In TS/Go/Python, define the small interface at the consumer (structural typing) |
| Dependency Inversion | Policy shouldn't depend on I/O details | `IFoo` for every `Foo`, DI container for a script | Interface at architectural boundaries (DB, network, clock, LLM, filesystem) or with 2+ implementations |

The domain-driven-hexagon guide puts it plainly: SOLID can conflict with YAGNI and KISS; be pragmatic. Apply the kernel, not the ceremony.

## 4. DRY, WET, AHA, and the rule of three

- **DRY is about knowledge, not text** (*The Pragmatic Programmer*): each business rule should have one authoritative representation. Two similar-looking snippets that encode different rules are not a DRY violation.
- **The wrong abstraction** (Sandi Metz): when a shared function accumulates a parameter or flag for each new caller, "duplication is far cheaper than the wrong abstraction." Fix: inline the abstraction back into every caller, delete what each caller doesn't need, then re-extract what is truly common.
- **AHA — avoid hasty abstractions** (Kent C. Dodds) and **rule of three**: tolerate duplication until the third occurrence *and* until you understand how the cases vary.
- **WET codebases** (Dan Abramov): abstraction makes code harder to change in ways the original author didn't foresee; optimize for change first.

**The AI-era twist.** Measurements of AI-assisted codebases show both failure modes rising: GitClear's analysis of hundreds of millions of changed lines found copy/pasted code overtaking moved (refactored) code, and academic studies report LLM-generated code carrying more smells than human reference solutions. So:
1. Before writing a helper, component, type, or client, **search the repo** for an existing one and reuse/extend it.
2. Don't create a **new** abstraction for a single use.
3. When you find true duplication of knowledge (same rule, same reason to change), consolidate it.

## 5. YAGNI and KISS — and where they stop

- **YAGNI** (Fowler): a presumptive feature costs build time, delay of other work, carrying cost (complexity everyone must read around), and repair cost (it's usually wrong when the real need arrives). Google's review guide asks reviewers to reject solutions to problems "the developer speculates might need to be solved in the future."
- **KISS**: the simplest design meeting the *stated* requirements, including stated non-functional ones.

**YAGNI does not apply to decisions that are expensive to retrofit.** Design these properly now even for an MVP:
- Security: authn/authz checks, input parsing, secret handling
- Data model: IDs, constraints, time zones, money representation
- Idempotency of side-effecting operations
- Observability hooks (structured logs, trace propagation)
- Public API contracts and versioning
- Tenant isolation in multi-tenant systems
- Migration strategy for persisted data

## 6. Coupling: connascence and the Law of Demeter

Connascence ranks coupling from weaker to stronger; prefer the weaker forms, and allow strong forms only inside one module:

name → type → meaning (magic values) → position (argument order) → algorithm (both sides must hash the same way) → execution order → timing → identity.

Practical moves: replace connascence of meaning with named constants or enums; of position with named arguments or a parameter object; of algorithm with one shared function; of execution order with a constructor or state type that makes wrong order impossible.

**Law of Demeter** ("talk to friends, not strangers"): `order.customer.address.city` couples the caller to three structures. Fix when the chain crosses module boundaries (Hide Delegate); ignore it for plain data records and fluent pipelines.

## 7. Alternatives and critiques

- **CUPID** (Dan North) reframes principles as properties to aim for: Composable, Unix philosophy (does one thing well), Predictable, Idiomatic, Domain-based. Useful when SOLID produces ceremony.
- **"Functions should be tiny"** (a common reading of *Clean Code*) conflicts with Ousterhout's evidence that many shallow functions raise cognitive load. Length is a prompt to look for mixed abstraction levels, not a target.
- **Performance** (Casey Muratori, "Clean Code, Horrible Performance", 2023): polymorphism-heavy, many-small-objects style can cost large constant factors in tight loops. It matters only in measured hot paths; there, prefer plain data and flat loops, and document why.
- **Clean/hexagonal layering in small apps**: mapping DTO ↔ domain ↔ persistence for a CRUD form triples the code without adding safety. Layer where the domain model genuinely differs from storage or transport (see `software-architecture`).

## Sources

- John Ousterhout, *A Philosophy of Software Design* 2nd ed. (2021); summaries: https://lethain.com/notes-philosophy-software-design/ · https://www.sglavoie.com/posts/2025/03/30/book-summary-philosophy-software-design-2nd-edition/
- Sandi Metz, "The Wrong Abstraction": https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction
- Kent C. Dodds, "AHA Programming": https://kentcdodds.com/blog/aha-programming
- Dan Abramov, "The WET Codebase" (Deconstruct 2019): https://www.deconstructconf.com/2019/dan-abramov-the-wet-codebase
- Martin Fowler, "Yagni": https://martinfowler.com/bliki/Yagni.html
- Google Engineering Practices, "What to look for in a code review": https://google.github.io/eng-practices/review/reviewer/looking-for.html
- Dan North, "CUPID — for joyful coding": https://dannorth.net/cupid-for-joyful-coding/
- Casey Muratori, "Clean Code, Horrible Performance": https://www.computerenhance.com/p/clean-code-horrible-performance
- Connascence: https://connascence.io/
- Sairyss, domain-driven-hexagon: https://github.com/Sairyss/domain-driven-hexagon
- GitClear, AI code quality research: https://www.gitclear.com/the_ai_code_quality_maintainability_gap
- "Investigating the Smells of LLM Generated Code": https://arxiv.org/abs/2510.03029
