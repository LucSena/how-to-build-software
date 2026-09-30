# Anti-Patterns

Use this to name what is wrong with a design and pick a fix. Each entry: how to detect it, why it hurts, and the fix. The first five get full entries because agents produce them most; the rest are a lookup table.

## Contents
1. Premature abstraction (speculative generality)
2. God object / god file
3. Singleton abuse and hidden globals
4. Inheritance for code reuse
5. Anemic domain model — misuse in both directions
6. Lookup table of other anti-patterns
7. Detection commands

## 1. Premature abstraction

**Detect.** Interfaces with one implementation; `Base*`/`Abstract*` classes with one subclass; factories that build one type; config options nobody sets; plugin registries with one plugin; generic `T` parameters instantiated with one type; "for future flexibility" in a comment or PR description.
**Why it hurts.** Every reader pays the indirection; the abstraction is usually shaped wrong when the second case arrives, and then it grows flags (Metz's wrong abstraction).
**Fix.** Inline to the concrete type. Keep interfaces only at I/O boundaries you fake in tests. Re-abstract when the second real case exists, shaped by both cases.
**Evidence.** Studies of LLM-generated code report more structural smells than human baselines, and larger generated volume tracks with more coupling and bloat — agents should treat new abstractions as a cost to justify.

## 2. God object / god file

**Detect.** A class or module that many others import and that changes in most PRs; > ~400–500 lines mixing unrelated concepts; names like `AppManager`, `Utils`, `helpers.ts`, `common.py`, `Core`; a React component > ~300 lines handling fetching, forms, layout, and business rules.
**Why it hurts.** Divergent change (edited for many reasons), merge conflicts, impossible to test in isolation, everything couples to it.
**Fix.** Split by reason to change, not by line count: identify clusters of functions that use the same data (Extract Class/Module, Move Function). Move each helper in a `utils` file to the module that owns its concept. For components: extract hooks for logic, subcomponents for sections, and a data layer for fetching.
**Not a god object.** A large but cohesive module with a small interface (a parser, a state machine) — that's a deep module.

## 3. Singleton abuse and hidden globals

**Detect.** `getInstance()`, `.shared`, `static` mutable fields, module-level mutable variables read from business logic; tests that must run in a particular order or reset global state.
**Why it hurts.** Hidden dependencies (you can't see what a function needs from its signature), test pollution, concurrency bugs, impossible to have two configurations (multi-tenant, tests).
**Fix.** Create the instance at the composition root and pass it in (constructor or parameter). Keep "one per process" as a lifetime choice in wiring, not an access pattern.
**Fine.** Immutable constants; a logger obtained through the logging framework's own convention; framework-managed singletons injected by the framework.

## 4. Inheritance for code reuse

**Detect.** Subclasses that override to throw `NotImplemented` or do nothing (refused bequest); hierarchies > 2 levels; `BaseController`/`BaseService` holding unrelated helpers; a change in a base class breaks distant subclasses (fragile base class).
**Why it hurts.** Inheritance couples subclass to parent implementation, not just interface; it violates Liskov when subclasses don't honor the parent contract.
**Fix.** Extract shared code into functions or collaborator objects and compose them; use interfaces/protocols for polymorphism; sealed/union types for closed variant sets. Replace Subclass with Delegate.
**Fine.** Framework-required base classes (UI views, test cases); shallow, sealed hierarchies modeling true is-a relationships.

## 5. Anemic domain model — misuse in both directions

**Detect (the real anti-pattern).** A domain with real invariants (money movement, inventory, scheduling, permissions) where entities are bags of getters/setters and rules are scattered across services, controllers, and UI — the same rule re-implemented in several places.
**Fix.** Move rules that protect invariants onto the entity/aggregate or into pure domain functions next to it (`account.withdraw(amount)` enforces the balance rule).
**The opposite mistake.** Forcing rich domain models, aggregates, and value objects onto CRUD. When the app mostly moves data between a form and a table, plain records plus validation at the boundary are correct. "Anemic" is only a problem when there is behavior to protect.

## 6. Lookup table

| Anti-pattern | Signal | Fix |
|---|---|---|
| Big ball of mud | No discernible module boundaries; everything imports everything | Establish module public APIs; enforce with lint rules (see `software-architecture`) |
| Distributed monolith | Services that must deploy together, share a DB, or call each other synchronously in chains | Merge back or cut along data ownership (see `software-architecture`) |
| Golden hammer | The same tool (Redux, Kafka, microservices, a DI container) applied to every problem | Choose per problem; default to the simplest |
| Lava flow | Dead experimental code nobody dares delete | Delete with tests green; git remembers |
| Boat anchor | Code kept "for later" | Delete |
| Poltergeist | Short-lived objects that only pass calls through | Inline |
| Copy-paste programming | Parallel implementations of the same knowledge | Search before writing; consolidate |
| Magic numbers/strings | Unexplained literals | Named constants with units |
| Primitive obsession | Strings/ints for IDs, money, emails | Value types / branded types where invariants exist |
| Stringly-typed code | Status and kinds as free-form strings | Enums / literal unions |
| Inner-platform effect | A generic rules engine or config language inside the app | Write the code; configuration only for what truly varies per deploy/tenant |
| Service locator | Dependencies fetched from a global registry | Constructor injection |
| Exceptions for control flow | `try/catch` for expected branches | Return values / conditionals |
| Circular dependencies | Module A imports B imports A | Extract the shared concept, or invert with an interface at the boundary |
| Leaky abstraction | Wrapper exposes the wrapped library's types or failure modes | Translate types and errors at the adapter |
| Sequential coupling | Methods must be called in a specific order | Constructor/factory that returns a ready object; state types |
| Callback hell / floating promises | Nested callbacks; un-awaited promises | `async/await`; lint for floating promises |
| Event soup | Everything communicates through a bus; nobody knows who handles what | Direct calls for in-process flows; events only for true decoupling |
| Mega-component | 20+ props, several boolean modes | Composition / compound components |
| Premature optimization | Caching, pooling, or micro-optimizations without measurement | Measure first; optimize the hot path only |

## 7. Detection commands

Quick greps to find candidates (adjust paths/extensions):

```bash
# Interfaces/abstract classes — then count implementations of each
rg -n "^(export )?(interface|abstract class) \w+" --type ts
rg -n "class \w+\(ABC\)|Protocol\)" --type py
# Singletons and service locators
rg -n "getInstance\(|\.shared\b|ServiceLocator|container\.resolve\(" 
# Junk-drawer modules
fd -t f "(utils?|helpers?|common|misc)\.(ts|js|py|kt|swift|go)$"
# Largest files (god-file candidates)
git ls-files | xargs wc -l 2>/dev/null | sort -rn | head -20
```

A grep hit is a candidate, not a verdict. Confirm with the detection criteria above.

## Sources

- Sandi Metz, "The Wrong Abstraction": https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction
- Martin Fowler, "AnemicDomainModel": https://martinfowler.com/bliki/AnemicDomainModel.html
- Mark Seemann, "Service Locator is an Anti-Pattern": https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/
- Brian Foote and Joseph Yoder, "Big Ball of Mud": http://www.laputan.org/mud/
- Sairyss, domain-driven-hexagon (when not to apply DDD patterns): https://github.com/Sairyss/domain-driven-hexagon
- "Investigating the Smells of LLM Generated Code": https://arxiv.org/abs/2510.03029 ; "AI-Generated Smells" (preprint): https://arxiv.org/html/2605.02741v1
- GitClear, AI code quality research: https://www.gitclear.com/the_ai_code_quality_maintainability_gap
