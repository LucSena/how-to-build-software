# Canonical Talks and Essays — and How to Resolve Their Conflicts

Use this file when two principles pull in opposite directions (small functions vs deep modules, DRY vs duplication, comments vs names, tidy now vs leave it), or when the user cites a book, talk, or essay as the reason for a change. Each entry gives the idea in a few lines, what an agent should do with it, and where it stops applying. Section 15 is the tension map for resolving conflicts.

## Contents
1. How to use this file
2. Rich Hickey — "Simple Made Easy" (2011)
3. Gary Bernhardt — "Boundaries" (2012)
4. John Ousterhout vs Robert Martin (2024–2025)
5. Kent Beck — *Tidy First?* (2023)
6. Dan Abramov — "Goodbye, Clean Code" (2020)
7. Martin Fowler — design stamina and the cost of quality
8. tef — "Write code that is easy to delete, not easy to extend" (2016)
9. Casey Muratori — "Semantic Compression" (2014)
10. Joel Spolsky — "Making Wrong Code Look Wrong" (2005)
11. Kevlin Henney — "Seven Ineffective Coding Habits of Many Programmers"
12. Arlo Belshee — "Naming is a Process"
13. Artem Zakirullin — "Cognitive load is what matters"
14. Short takes: Carmack, grug, Wayne, and four laws
15. Tension map: resolving conflicting advice

## 1. How to use this file

- A citation is not an argument. When someone says "Clean Code says functions must be tiny" or "Ousterhout says long functions are fine", find the entry, check the **kernel** (what the author actually claimed), then decide on evidence in this codebase: how often the code changes, who reads it, what broke before.
- The authors disagree with each other openly. Don't pick a camp; use the tension map to pick the rule for the situation.
- Repository conventions still outrank all of these (see the precedence table in SKILL.md).

## 2. Rich Hickey — "Simple Made Easy" (Strange Loop 2011)

**Idea.** *Simple* (one fold, one role, not interleaved) is objective. *Easy* (near at hand, familiar) is relative to the person. Choosing easy over simple **complects** — braids independent concerns so they can no longer be reasoned about separately. Tests and type checkers are guard rails; they don't make a complex design simple.

**His contrast of constructs** (paraphrased from the talk):

| Complects… | Simpler alternative |
|---|---|
| State and objects (value + time) | Values; explicitly managed references |
| Methods (function + state) | Functions, namespaces |
| Inheritance, switch/matching (who + what) | Polymorphism à la carte (protocols) |
| Imperative loops (what + how) | Declarative set/sequence operations |
| Actors (what + who) | Queues |
| ORMs | Declarative data manipulation |
| Conditionals scattered through the program | Rules |
| Inconsistency | Consistency (transactions) |

**Agent use.** Familiarity ("the library I know", "how the last project did it") is not a justification. For each design, ask what got braided that could be separate. Usual suspects: I/O with decision logic, mutation with value (time + value), formatting with computation, config lookup with business rules.

**Limit.** Hickey's alternatives assume a language and team comfortable with values and protocols; in a codebase built around mutable objects, apply the question locally rather than rewriting the paradigm.

## 3. Gary Bernhardt — "Boundaries" (SCNA 2012)

**Idea.** Use simple **values** as the boundaries between components. Arrange code as a **functional core** (many paths, no dependencies, pure, unit-tested without doubles) inside an **imperative shell** (few paths, all the I/O, covered by a few integration tests).

```
shell: load (DB, HTTP, clock, env) → core(values) → perform effects (write, send, log)
core:  decide(state, input, now) → (newState, effects[])
```

**Agent use.** Pass `now`, IDs, and randomness in as values. When decision logic is complex, return effects as data (`[{ type: "send_email", to, template }]`) and let the shell run them. This works in any language, including class-based ones: the objects live mostly in the shell.

Bernhardt's lightning talk "Wat" (JavaScript and Ruby coercion absurdities) is the short argument for never relying on implicit coercion: strict equality, explicit conversions, strict type-checking.

## 4. John Ousterhout vs Robert Martin (2024–2025)

The authors of *A Philosophy of Software Design* (APOSD) and *Clean Code* held a long written debate, published in full. Both define the goal the same way: code that is easy to understand and modify; Ousterhout frames complexity as how much information a developer must hold, and how obvious it is.

| Topic | Agree | Disagree |
|---|---|---|
| **Method length** | Modular decomposition is good; it is possible to over-decompose; *Clean Code* (1st ed.) gave little guidance on recognizing it; the book's `PrimeGenerator` decomposition is problematic | Martin decomposes much further and would "rather err on the side of decomposition". Ousterhout says tiny methods become shallow and **entangled** ("conjoined": to understand one you must read the other), which defeats the purpose. Martin accepts more entanglement for the benefit of names and ordering |
| **Comments** | Implementation code needs comments only where it is non-obvious; public APIs need interface comments | Ousterhout would write roughly 5–10× more comment lines and says interfaces and abstractions can't be defined without them; missing comments cost more than bad ones. Martin sees comments as generally net negative as practised, prefers recasting information into code (long names), and trusts comments only after checking the code |
| **TDD** | Unit tests are essential; TDD *can* produce good designs | Ousterhout thinks TDD discourages design and prefers **"bundling"** (write a chunk designed as an abstraction, then its tests). Martin thinks bundling can match TDD but may lower coverage, and that preference and personality matter |

Two shared lessons worth encoding:
- **"A Tale of Two Programmers."** Martin's long names and Ousterhout's comments each failed the *other* reader, because both authors already understood the algorithm. Explanations written from inside the box miss what a cold reader needs. Re-read your diff as a newcomer before finishing.
- **Hidden side effects in a query-shaped name are bug magnets** (the `PrimeGenerator` helper that looked like a predicate but mutated state). Separate query from modifier, or rename honestly.

Ousterhout's closing diagnosis of *Clean Code*: it focuses on things that matter little (splitting 10-line methods, avoiding English comments, test-first as the unit of work) and gives strong one-directional advice without saying how to tell when you've gone too far. Martin says he folded several of Ousterhout's points into the second edition.

**Agent rules from the debate:**
- Split a function only when the piece has a simple interface **and** can be understood without reading its caller or callee.
- Keep tightly related steps together (lock + critical section; a short setup beside its use).
- Write interface comments (contract, units, preconditions, side effects, errors) on non-obvious modules; skip "what" comments on obvious lines.
- Tests are mandatory; test-first vs test-after follows the repository's practice.

## 5. Kent Beck — *Tidy First?* (2023)

**Idea.** "Make the change easy (warning: this may be hard), then make the easy change." A **tidying** is a small, safe, behavior-preserving structural change done just before (or after) a behavior change.

| Tidying | What it is |
|---|---|
| Guard clauses | Exit early on preconditions |
| Dead code | Delete it; version control remembers |
| Normalize symmetries | One way to do the same thing |
| New interface, old implementation | Write the interface you wish you had; implement it by calling the old code |
| Reading order | Reorder a file in the order a reader wants |
| Cohesion order | Move coupled elements next to each other |
| Move declaration and initialization together | — |
| Explaining variables | Name a subexpression |
| Explaining constants | Name a magic value |
| Explicit parameters | Replace a params map with named parameters |
| Chunk statements | A blank line between parts |
| Extract helper | — |
| One pile | Inline over-split code back together to see it, then re-extract (Beck agreeing with Ousterhout) |
| Explaining comments | Write down what wasn't obvious, e.g. right after finding a bug |
| Delete redundant comments | — |

**Managing tidyings:** keep them in separate commits or PRs from behavior changes, a few at a time; tidyings enable more tidyings, so watch the batch size; tidying before a change should take minutes to an hour — longer means you've lost sight of the minimum needed.

**First, after, later, or never:**

| When | Choose it if |
|---|---|
| **Never** | The code won't change again |
| **Later** | A big batch with an eventual payoff; schedule it |
| **After** | The change is done and waiting would make the cleanup more expensive |
| **First** | It pays off immediately in the change you're making, and you know what and how |

Theory: software earns value through behavior today and through structure (options) for tomorrow; the time value of money favors tidying after, uncertainty favors tidying first. Coupling — two elements that must change together — is what makes change expensive.

## 6. Dan Abramov — "Goodbye, Clean Code" (2020)

**Story.** He replaced a colleague's repetitive code with a clever deduplicated abstraction, committed it without talking to the author, and was asked to revert it. The duplicated version was also easier to change once requirements diverged per case.

**Lessons.** Rewriting a teammate's code without discussion is a collaboration failure; deduplication can be the wrong abstraction; "clean code" is a phase to pass through, not a goal.

**Agent use.** Don't refactor outside the task's scope, and don't "clean up" code the user just wrote unless asked. Propose it instead.

## 7. Martin Fowler — design stamina and the cost of quality

**Idea.** *Internal* quality (architecture, clarity) is invisible to users and, unlike external quality, doesn't trade off against cost: cruft slows every later feature, so high internal quality is cheaper over time. The **design stamina hypothesis** (2007): "no design" starts faster, but good design overtakes it at a payoff line that Fowler estimates arrives in weeks rather than months — explicitly a hypothesis, not a measurement.

**Agent use.** The argument against tactical shortcuts under time pressure. It is not an argument for gold-plating: the payoff comes from less cruft, not from more abstraction.

## 8. tef — "Write code that is easy to delete, not easy to extend" (2016)

**Idea.** Treat lines of code as lines *spent*: deleting code lowers maintenance cost. Build disposable software rather than reusable software. The essay's progression: copy-paste at first; write a library once you've copied enough; keep frequently changing parts away from stable ones; write a big lump while you don't know the seams; break it into pieces once you know what is hard to write and likely to change.

**Agent use.** Prefer designs where a feature can be removed by deleting a folder and one registration line; avoid designs where every feature threads through a shared base class or a god-config.

## 9. Casey Muratori — "Semantic Compression" (2014)

**Idea.** Program like a compressor: write the specific code first; when a pattern appears a second time for real, compress it into a function. Don't design the reusable version up front — make code usable before trying to make it reusable. Consistent with the rule of three (Coding Horror: reusable components are about three times as hard to build as single-use ones).

**Agent use.** Extraction follows observed repetition, never anticipated repetition.

## 10. Joel Spolsky — "Making Wrong Code Look Wrong" (2005)

**Idea.** Conventions should make incorrect code visibly wrong where it is written. His example is "Apps Hungarian": prefixes for the *kind* of value (`us` = unsafe user input, `s` = safe/encoded), so `write(usName)` looks wrong — unlike "Systems Hungarian", which encodes machine types and is useless.

**2026 translation.** Put the kind in the **type system**: branded `UnsafeHtml` vs `SafeHtml` (the idea behind Trusted Types), parameterized queries instead of raw SQL strings, `Cents` vs `Dollars`, `Instant` vs local date-time. Where types can't express it, use names (`rawInput`, `escapedHtml`, `timeoutMs`). (His other claim in the essay, that exceptions are invisible gotos, is debatable today.)

## 11. Kevlin Henney — "Seven Ineffective Coding Habits of Many Programmers"

The habits: **noisy code** (comments and boilerplate that add nothing); **unsustainable spacing** (alignment that breaks on every edit and pollutes diffs); **Lego naming** (gluing `Manager`, `Value`, `Object`, `Impl`, `Data`, `Info` into long meaningless names); **under-abstraction** (primitives and collections instead of domain types); **unencapsulated state**; **getters and setters** (exposing implementation, not behavior); **uncohesive tests** (`testFoo1` instead of propositions).

**Agent use.**
- Tag-cloud check: if `data`, `info`, `manager`, `handle`, `process`, `string` dominate a module's identifiers over domain nouns, concepts are missing.
- Name tests as propositions: "rejects expired tokens", "applies the discount once per order".

## 12. Arlo Belshee — "Naming is a Process"

Names move through stages as understanding grows: **missing or misleading** → **nonsense** (an obvious placeholder like `Applesauce`, better than a lie) → **honest** (says part of what it does) → **completely honest** (says everything: `ParseXmlAndStoreFlightAndStartSync`) → **does the right thing** (split so each piece has a short honest name) → **intent** (names *why*) → **domain abstraction** (new domain types emerge).

**Agent use.** When a name is hard, write the completely honest long name first; every "And" is a split point. Never leave a misleading name; a placeholder plus a TODO is better than a lie.

## 13. Artem Zakirullin — "Cognitive load is what matters"

A living essay (CC BY 4.0) that reframes clean-code advice around working memory, which holds about four chunks. **Intrinsic** load comes from the problem; **extraneous** load comes from how the code presents it, and is the part you can remove.

| Source of extraneous load | Fix |
|---|---|
| Complex conditionals | Named intermediate booleans (`isValid && isAllowed && isSecure`) |
| Nested `if`s | Early returns |
| Deep inheritance | Composition |
| Many shallow methods, classes, modules | Fewer, deeper ones — a name like `MetricsProviderFactoryFactory` costs more than its implementation |
| SRP read as "does one thing" | Responsible to one user or stakeholder: if one bug brings complaints from two different business people, the module mixes them |
| Feature-rich language used fully | Stick to a small, orthogonal subset |
| Business meaning in numeric codes (HTTP statuses, magic numbers) | Self-describing values (`"jwt_has_expired"`) |
| DRY abused across modules | "A little copying is better than a little dependency" (Pike) |
| Framework-shaped business logic | Keep domain logic outside the framework; use the framework like a library |
| Layer rituals | Abstraction should hide complexity; layers that only add indirection don't |

**Agent use.** Its companion prompt for agents condenses to: no "what" comments except bird's-eye summaries, write "why" comments; intermediate variables and early returns; composition and deep modules; minimal language subset; self-describing values; a little duplication over unnecessary dependencies; no unnecessary layers. A useful measure from the essay: if a newcomer is confused for more than about 40 minutes in a row, the code needs work — and familiarity is not the same as simplicity (a point it credits to Dan North).

## 14. Short takes: Carmack, grug, Wayne, and four laws

- **John Carmack, "On Inlined Code" (2007, republished 2014):** consider inlining single-use functions; straight-line code shows the true order of state changes and can't be called from the wrong place. A long, linear function chunked with blank lines and comments can beat a dozen single-use helpers. Prefer pure functions where possible.
- **"The Grug Brained Developer" (Carson Gross, 2022):** complexity is the enemy and "no" is the best tool; wait for good cut points (narrow interfaces that trap complexity) before factoring; prefer integration tests at the right level; locality of behavior beats separation of concerns when they conflict.
- **Hillel Wayne, "Uncle Bob and Silver Bullets" (2017):** discipline alone isn't enough, and neither are tests alone. Layer correctness techniques: strict types, tests, runtime validation at boundaries, property-based tests for parsers and serializers, and model checking only for genuinely concurrent protocols.
- **Hyrum's law:** with enough users, every observable behavior is depended on — ordering, timing, and error text changes can be breaking.
- **Chesterton's fence:** find out why odd code exists (blame, tests, linked issues) before deleting it.
- **Gall's law:** complex systems that work evolved from simple systems that worked.
- **Kernighan's law:** debugging is twice as hard as writing, so code written as cleverly as possible is beyond its author's ability to debug.

## 15. Tension map: resolving conflicting advice

| Tension | Side A | Side B | Resolution |
|---|---|---|---|
| Function size | *Clean Code*: small functions, "One Thing" | Ousterhout, Carmack, Beck's "one pile": deep, linear, no entanglement | Extract when the piece has a simple interface and reads on its own; otherwise keep linear code chunked with blank lines and comments |
| Comments | Martin: recast into names; comments rot | Ousterhout: interface comments are essential | Interface and "why" comments yes; "what" comments no; update comments in the same diff as the code |
| DRY | DRY: one representation of each piece of knowledge | Metz, tef, Muratori, Pike: duplication beats the wrong abstraction or dependency | Deduplicate knowledge (business rules) immediately; deduplicate code shape after two or three real instances with the same reason to change |
| Polymorphism vs switch | GRASP, *Clean Code*: replace conditionals with polymorphism | Muratori, Hickey: switches, tables, protocols | By change axis: closed set with growing operations → switch; open set with stable operations → dispatch (see `object-oriented-design`) |
| Layers and abstraction | Clean/hexagonal architecture | Cognitive load, grug: layers add indirection | A seam only at a real I/O boundary or a proven variation point |
| Test-first | Martin, Beck: TDD | Ousterhout: bundling | Tests are non-negotiable; ordering follows the repository's practice |
| Performance | Martin: programmer time dominates | Muratori, Acton: hardware reality | Clarity by default; in measured hot paths go data-oriented and document why |
| Tidying | Beck: tidy first | Abramov: don't rewrite others' code | Tidy only what the task touches, minimally, in a separate commit; propose the rest |
| Simplicity vs familiarity | "Use what the team knows" | Hickey: easy is not simple | Prefer the familiar tool when it doesn't braid concerns; never justify complecting by familiarity |
| Reuse vs deletability | Build reusable components | tef, Muratori: build usable, deletable code | Build for the current use; extract after real repetition; keep features removable |

## Sources

- Rich Hickey, "Simple Made Easy" (Strange Loop 2011): https://www.infoq.com/presentations/Simple-Made-Easy · transcript: https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/SimpleMadeEasy.md
- Gary Bernhardt, "Boundaries" (SCNA 2012): https://www.destroyallsoftware.com/talks/boundaries · "Wat": https://www.destroyallsoftware.com/talks/wat
- John Ousterhout and Robert C. Martin, "A Philosophy of Software Design vs Clean Code": https://github.com/johnousterhout/aposd-vs-clean-code
- Kent Beck, *Tidy First?* (O'Reilly, 2023): https://www.oreilly.com/library/view/tidy-first/9781098151232/ · chapter notes: https://github.com/pkardas/notes/blob/master/books/tidy-first.md
- Dan Abramov, "Goodbye, Clean Code" (2020): https://overreacted.io/goodbye-clean-code/
- Martin Fowler, "Is High Quality Software Worth the Cost?": https://martinfowler.com/articles/is-quality-worth-cost.html · "DesignStaminaHypothesis": https://martinfowler.com/bliki/DesignStaminaHypothesis.html
- tef, "Write code that is easy to delete, not easy to extend" (2016): https://programmingisterrible.com/post/139222674273/write-code-that-is-easy-to-delete-not-easy-to
- Casey Muratori, "Semantic Compression" (2014): https://caseymuratori.com/blog_0015 · Jeff Atwood, "Rule of Three": https://blog.codinghorror.com/rule-of-three/
- Joel Spolsky, "Making Wrong Code Look Wrong" (2005): https://www.joelonsoftware.com/2005/05/11/making-wrong-code-look-wrong/
- Kevlin Henney, "Seven Ineffective Coding Habits of Many Programmers": https://www.slideshare.net/Kevlin/seven-ineffective-coding-habits-of-many-programmers-45312038
- Arlo Belshee, "Naming is a Process": https://web.archive.org/web/20210125104242/https://arlobelshee.com/naming-is-a-process-part-7-intent-to-domain-abstraction/
- Artem Zakirullin, "Cognitive load is what matters" (CC BY 4.0; ideas adapted with attribution): https://github.com/zakirullin/cognitive-load
- John Carmack, "On Inlined Code": http://number-none.com/blow/john_carmack_on_inlined_code.html
- Carson Gross, "The Grug Brained Developer": https://grugbrain.dev
- Hillel Wayne, "Uncle Bob and Silver Bullets" (2017): https://www.hillelwayne.com/post/uncle-bob/
- Laws (Hyrum, Chesterton, Gall, Kernighan): https://github.com/dwmkerr/hacker-laws · https://www.hyrumslaw.com
