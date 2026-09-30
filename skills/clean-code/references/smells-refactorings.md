# Code Smells → Refactorings

A smell is a hint that a refactoring may help, not proof. Before applying anything, confirm the smell costs something real (a bug, a slow change, a confused reader). Smell names follow Fowler's *Refactoring* (2nd ed., 2018); Ousterhout's red flags are in `principles-critique.md`.

## Contents
1. Safe refactoring procedure
2. Smell catalog (signal → refactoring → caution)
3. Mechanics of the refactorings agents use most
4. Legacy code without tests
5. Large changes: Parallel Change, Branch by Abstraction, Strangler Fig

## 1. Safe refactoring procedure

1. **Green baseline.** Run the tests that cover the code. If none exist, write characterization tests first (§4). Never start refactoring on red.
2. **Name the refactoring.** "Extract Function `computeTax` from `checkout`" — if you can't name it, you are rewriting, not refactoring.
3. **One step at a time.** Apply one refactoring, run the tests and type checker. Green → next step. Red → undo that step, don't debug forward.
4. **Use tools for mechanical moves.** IDE/language-server rename, extract, move, and inline are behavior-preserving by construction; hand edits are not.
5. **Commit refactors separately** from behavior changes ("make the change easy, then make the easy change" — Kent Beck). Reviewers can skim a pure refactor and focus on the behavior diff.
6. **Stop when the task is unblocked.** Record further ideas as follow-ups rather than extending scope.

## 2. Smell catalog

| Smell | Signal | Refactorings | Caution |
|---|---|---|---|
| Mysterious Name | You need to read the body to know what it does | Rename Function/Variable/Field | If no good name exists, the thing does two jobs — split first |
| Duplicated Code | Same *knowledge* in 2+ places | Extract Function; Slide Statements to align copies; Pull Up Method | Similar text encoding different rules is not duplication |
| Long Function | Mixed abstraction levels; comments acting as section headers | Extract Function, Replace Temp with Query, Decompose Conditional, Split Loop, Split Phase | Don't fragment into conjoined pieces that must be read together |
| Long Parameter List | > 3 params, several always passed together | Introduce Parameter Object, Preserve Whole Object, Remove Flag Argument, Replace Parameter with Query | Named/default args (Kotlin, Python, Swift) may already make it readable |
| Global Data | Module-level mutable state read from many places | Encapsulate Variable; inject as a dependency | Constants are fine |
| Mutable Data | Values changed far from where they were created | Split Variable, Separate Query from Modifier, Change Reference to Value, return new values | Local mutation inside one function is fine |
| Divergent Change | One module edited for unrelated reasons | Split Phase, Extract Class/Module | Split by reason-to-change, not by size |
| Shotgun Surgery | One logical change edits many files | Move Function/Field, Combine Functions into Module/Transform, Inline Class | Some cross-cutting change is normal at architectural seams |
| Feature Envy | A function uses another module's data more than its own | Move Function (or part of it) to that module | Strategy/visitor code legitimately reads other data |
| Data Clumps | The same 3–4 fields travel together | Introduce Parameter Object, Extract Class | — |
| Primitive Obsession | Strings/ints for money, email, IDs, units | Replace Primitive with Object; branded/newtype IDs | Only where an invariant exists |
| Repeated Switches | Same `switch`/`if` chain on a type tag in several places | Exhaustive switch over a union/sealed type; Replace Conditional with Polymorphism when variants are open for extension | A single switch is not a smell |
| Loops | Imperative accumulation that obscures intent | Replace Loop with Pipeline (`map/filter/reduce`, sequences) | Keep loops in measured hot paths or when a pipeline needs 4+ chained steps with side effects |
| Lazy Element | Class/function that adds nothing | Inline Function/Class, Collapse Hierarchy | — |
| Speculative Generality | Hooks, params, base classes used by one caller or none | Collapse Hierarchy, Inline, Change Function Declaration (drop unused params), delete | Keep seams at real I/O boundaries |
| Temporary Field | Field set only in some code paths | Extract Class; move into a union state | — |
| Message Chains | `a.b().c().d()` | Hide Delegate, Extract/Move Function | Fluent builders and pipelines are fine |
| Middle Man | Most methods just forward | Remove Middle Man, Inline Function | Facades that simplify are not middle men |
| Insider Trading | Modules trading private details | Move Function/Field; narrow the interface | — |
| Large Class | Many fields, many unrelated methods | Extract Class, Extract Superclass (rarely), Replace Type Code with union | Split by cohesion |
| Alternative Classes with Different Interfaces | Two classes doing the same job with different method names | Change Function Declaration, Move Function until one remains | — |
| Data Class | Record with getters/setters and logic elsewhere | Move behavior in *if* there is behavior with invariants | Plain DTOs and CRUD records are fine anemic |
| Refused Bequest | Subclass overrides to throw or ignore parent behavior | Replace Subclass/Superclass with Delegate | Signals an LSP violation — prefer composition |
| Comments (as deodorant) | A comment explains confusing code | Extract Function with a good name; Rename; Introduce Assertion | Keep "why" comments |

## 3. Mechanics of common refactorings

**Extract Function.** Pick a fragment with one purpose. Name it by *what* it does, not *how*. Pass in only what it reads; return what it computes. If it needs 5+ inputs or mutates several outer variables, the boundary is wrong — choose a different fragment or Split Phase first.

**Split Phase.** When a function does "parse then compute" or "compute then format", separate the phases with an explicit intermediate data structure. Each phase becomes testable alone, and phase 1 is often where parse-don't-validate belongs.

**Decompose Conditional / guard clauses.** Turn `if (a && !b || c)` into a named predicate (`isEligibleForRefund(order)`). Replace nested `if` pyramids with early returns for the exceptional cases, leaving the main path unindented.

**Introduce Parameter Object.** Group params that always travel together into a type with a domain name (`DateRange`, `Pagination`). Then look for behavior that belongs on it (`range.contains(date)`).

**Remove Flag Argument.** `render(user, true)` → `renderAdmin(user)` / `renderPublic(user)`, or an enum when there are more than two modes and callers choose dynamically.

**Replace Conditional with Polymorphism vs exhaustive switch.** Closed set of variants owned by you (payment status, AST nodes): use a union/sealed type with an exhaustive `switch`/`when`/`match` — the compiler flags every place to update when a variant is added. Open set extended by other teams or plugins: use an interface with implementations. Don't build a class hierarchy for two variants.

**Replace Loop with Pipeline.** Convert accumulation loops to `filter → map → reduce` when each step has a clear name. Stop if the pipeline needs indices, early exit with side effects, or becomes harder to read.

**Replace Primitive with Object.** Create a small immutable type with a constructor/factory that enforces the invariant (`Money.of(amountMinor, currency)`), then migrate call sites one by one.

**Move Function.** Copy to the new home, make the old one delegate, migrate callers, delete the old one. With tests green at each step.

**Inline (Function/Class).** The inverse of extract: when an abstraction no longer earns its keep, put its body back in callers and delete it. This is the first step of fixing a wrong abstraction.

## 4. Legacy code without tests (Feathers)

Legacy code = code without tests. Goal: get a safety net cheaply, then change.

1. **Identify the change point** and the behavior you must not break.
2. **Find a seam** — a place where you can observe or substitute behavior without editing the logic: a function parameter, a constructor argument, an overridable method, a module import, an environment variable.
3. **Write characterization tests.** Call the code with realistic inputs and assert whatever it currently returns, even if it looks wrong. Mark suspicious outputs with a comment and a ticket; don't "fix" them silently while refactoring.
4. **Break dependencies minimally** to get the code under test: Extract Interface for the one collaborator that does I/O, Parameterize Constructor, or wrap a static/global call in an injectable function.
5. **Add new behavior via Sprout** (write the new logic in a new, tested function and call it from the old code) or **Wrap** (a new function that calls the old one plus new behavior). Both avoid editing untested logic.
6. **Refactor under the net** using §1.

Approval/golden-master tests (snapshot the full output for many generated inputs) are acceptable as temporary characterization for large legacy functions; replace them with behavior tests once the code is decomposed.

## 5. Large changes

Never big-bang rewrite a working system inside one change. Choose:

| Technique | Use when | How |
|---|---|---|
| Parallel Change (expand–contract) | Changing a function signature, schema, or API used in many places | Add the new form alongside the old → migrate callers incrementally → remove the old form |
| Branch by Abstraction | Replacing an internal component (ORM, HTTP client, algorithm) | Put an abstraction in front of the old one → build the new implementation behind it → switch (optionally via flag) → delete old + abstraction if it has one impl left |
| Strangler Fig | Replacing a whole subsystem or legacy app | Route slices of traffic/features to the new system one at a time until the old one has nothing left |
| Feature flag | Behavior change must ship dark or be reversible | Flag at one decision point; remove the flag once rolled out (flags are debt) |

Each step must leave the system shippable with tests green.

## Sources

- Martin Fowler, *Refactoring* 2nd ed. (2018): https://martinfowler.com/articles/refactoring-2nd-ed.html
- Code smells reference (Samman coaching): https://sammancoaching.org/reference/code_smells/
- Michael Feathers, *Working Effectively with Legacy Code* (2004) — seams, characterization tests, sprout/wrap
- Kent Beck's "make the change easy, then make the easy change", discussed in Preparatory Refactoring: https://martinfowler.com/articles/preparatory-refactoring-example.html
- Martin Fowler, ParallelChange, BranchByAbstraction, StranglerFigApplication: https://martinfowler.com/bliki/ParallelChange.html · https://martinfowler.com/bliki/BranchByAbstraction.html · https://martinfowler.com/bliki/StranglerFigApplication.html
- Sandi Metz, "The Wrong Abstraction" (2016): https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction
