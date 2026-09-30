# I. Object-Oriented Design, Canonical Clean-Code Thinking, and Dependency Management — Research Notes (2026-09)

Research for agent skills. Scope: (A) OO design done right, (B) design thinking from canonical talks and essays, (C) dependency management and supply-chain safety. These notes build on `E-architecture.md` and do not repeat it. E already covers the SOLID critique, the GoF-in-modern-languages table, Fowler smells and refactorings, Ousterhout's red flags, deep modules, DRY/AHA/Wrong Abstraction, and "parse, don't validate". This file goes deeper where E is thin.

**Verification legend** (applies to every claim):
- **[V]**: verified this session against the primary text, from a cloned repo or a raw GitHub file.
- **[S]**: verified this session through web-search snippets, which are secondary reporting. Treat numbers as "as reported by".
- **[M]**: from model memory. Well known, but not re-checked this session. Check before quoting verbatim or citing a number.

Date-sensitive facts are labelled "as of YYYY-MM".

---

## PART A — Object-Oriented Design Done Right

### A1. What OOP is actually for

- **Alan Kay's definition, messaging first.** In his 2003 email to Stefan Ram, Kay wrote: "OOP to me means only messaging, local retention and protection and hiding of state-process, and extreme late-binding of all things." He also said he regretted coining "objects" because it pulled attention away from the bigger idea, messaging. [M] Source: http://userpage.fu-berlin.de/~ram/pub/pub_jf47ht81Ht/doc_kay_oop_en
  - For agents, the useful kernel of OOP is **not** "model the nouns of the world as classes". It is: (1) an object owns some state and **protects its invariants**, so nobody else can put it into an invalid state; (2) callers **send messages** (call methods) and don't reach into internals; (3) **late binding / polymorphism** lets a caller work with any object that answers the message.
- **Uncle Bob, "OO vs FP" (2014).** "OO is not about state. Objects are bags of functions, not bags of data." "FP imposes discipline upon assignment. OO imposes discipline on function pointers." The design principles still apply whatever the paradigm. [V via charlax list] https://blog.cleancoder.com/uncle-bob/2014/11/24/FPvsOO.html
- **What an agent should use objects for:**
  1. **Encapsulating an invariant.** Examples: `Money` (amount + currency, no negative totals), `DateRange` (start ≤ end), `Cart` (line totals always match the items), a connection pool, a state machine.
  2. **Polymorphism at a boundary where variation really exists.** Examples: storage adapters, payment providers, notification channels, plugin/driver systems. Everything else can often be plain functions over plain data.
  3. **Managing a resource lifecycle.** File handles, sockets, transactions, used with `using`/`with`/`use`/`defer`.
- **When OOP is not the point:** data transformation pipelines, request handlers that validate → call → map, and pure business calculations. These are often clearer as functions over immutable data (see A12 and B2).

### A2. Messages, not classes — Sandi Metz

Sandi Metz's work is the most practical modern OO teaching. It spans *Practical Object-Oriented Design in Ruby* (POODR, 2012; 2nd ed. 2018) and *99 Bottles of OOP* (with Katrina Owen, 2016; later JS/PHP editions).
- **Message-centric design.** POODR argues you design by deciding *what messages should be sent*, then which object should receive them. It is paraphrased as "You don't send messages because you have objects, you have objects because you send messages." [M] Paraphrase, so check before quoting.
- **"Nothing is Something"** (RailsConf 2015 / BathRuby 2015) [S] https://www.youtube.com/watch?v=OMPfEXIlTVE (talk) · notes https://dgmstuart.github.io/conference-notes/bathruby-2015/2015-03-13-sandi-metz-nothing-is-something-at-bathruby/
  - **Null Object pattern.** Replace `if (x == null)` checks scattered across callers with an object that answers the same messages and does the "nothing" behaviour. The absence of something is itself a behaviour, so model it.
  - **Inheritance is for specialisation, not for sharing code.** "There's no such thing as one specialization. If you're specializing something, you have two things." When you need to vary *more than one* aspect, subclassing explodes combinatorially (the House / RandomHouse / EchoHouse / RandomEchoHouse example). **Isolate** each varying role, give it a name (`Order`, `Formatter`), and **inject** it. That is composition plus dependency injection.
  - Recipe: "make the original behaviour and the new behaviour look the same to highlight how they're different," then extract the difference into a named role. [S]
- **"The Wrong Abstraction"** (2016): "duplication is far cheaper than the wrong abstraction." E already covers this. The key procedural advice: when an abstraction has grown conditionals and parameters for each caller, **inline it back into every caller**, delete the parts each caller doesn't use, and re-extract. [M] https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction
- **"All the Little Things"** (RailsConf 2014) [M]: refactors the Gilded Rose kata. It starts from a nested-conditional monster, uses "squint test" shape-of-code heuristics, tolerates temporary duplication, and ends with small polymorphic classes chosen by a factory. Lesson: **make it small, make it clear, and accept duplication while you learn the shape.** https://www.youtube.com/watch?v=8bZh5LMaSmE
- **Sandi Metz's rules** (Ruby Rogues ep. 87, 2013; written up by thoughtbot) [S] https://thoughtbot.com/blog/sandi-metz-rules-for-developers
  1. Classes ≤ 100 lines.
  2. Methods ≤ 5 lines.
  3. ≤ 4 parameters (a hash of options counts as parameters).
  4. A controller instantiates only one object, and the view knows one instance variable.
  - **Rule 0:** you may break a rule if you can convince your pair. These are prompts to reflect, not laws. Agents should **not** enforce 5-line methods mechanically. That conflicts with Ousterhout's deep-module guidance (B3). Use the rules as *smell triggers*, not hard lint limits.
- **"Magic Tricks of Testing"** (RailsConf 2013), linked from thoughtbot's testing guide [V link; grid from M]: https://speakerdeck.com/skmetz/magic-tricks-of-testing-railsconf
  | Message type | Query (returns something, no side effect) | Command (side effect) |
  |---|---|---|
  | **Incoming** (to object under test) | Assert on the **result** | Assert the **direct public side effect** |
  | **Sent to self** (private) | Don't test | Don't test |
  | **Outgoing** (to collaborators) | Don't test (no expectation) | **Expect** the message is sent (mock) |
  - Agent rule: never test private methods; mock only **outgoing commands**; never assert on outgoing queries.

### A3. Responsibility-driven design, CRC cards, GRASP

- **CRC cards** (Kent Beck & Ward Cunningham, OOPSLA 1989, "A Laboratory for Teaching Object-Oriented Thinking") [M]. Each card holds **Class**, **Responsibilities** (what it knows and does), and **Collaborators**. Designers role-play scenarios by moving cards. http://c2.com/doc/oopsla89/paper.html
- **Responsibility-Driven Design** (Rebecca Wirfs-Brock; *Object Design: Roles, Responsibilities, and Collaborations*, 2002) [M]. Think in **roles**, **responsibilities** and **collaborations** rather than data. Role stereotypes are useful for naming and reviewing classes:
  - **Information holder**: knows things.
  - **Structurer**: maintains relationships.
  - **Service provider**: does work.
  - **Coordinator**: reacts to events by delegating.
  - **Controller**: makes decisions and directs others.
  - **Interfacer**: transforms information between parts of the system or to external systems.
  
  A class that is several stereotypes at once is a candidate to split. A "Controller" that also holds lots of data is a smell.
- **GRASP** (Craig Larman, *Applying UML and Patterns*) [M; concept list V via charlax] https://en.wikipedia.org/wiki/GRASP_(object-oriented_design). Nine principles:
  1. **Information Expert**: give the responsibility to the class that has the information needed. This is the antidote to Feature Envy.
  2. **Creator**: B creates A if B contains, aggregates, or closely uses A, or has its initialising data.
  3. **Controller**: a non-UI object receives and coordinates a system operation (a use case handler).
  4. **Low Coupling.**
  5. **High Cohesion.**
  6. **Polymorphism**: when behaviour varies by type, use polymorphic operations instead of type switches (but see A7 for when switches win).
  7. **Pure Fabrication**: invent a class that is not a domain concept (e.g. `Repository`) to keep cohesion high.
  8. **Indirection**: add an intermediate to decouple.
  9. **Protected Variations**: wrap *points of predicted variation* behind a stable interface.
  - Agent use: **Information Expert** + **Protected Variations** are the two that most often fix agent-generated code. Agents tend to put logic in "service" classes that pull data out of entities (anemic model), and add abstraction layers at points of *no* predicted variation.

### A4. Composition over inheritance

- **GoF (1994):** "Favor object composition over class inheritance." Also "Program to an interface, not an implementation." [M; charlax V: "the main idea (composition is better than inheritance) definitely is a good philosophy"]
- **Inheritance costs cognitive load.** Zakirullin's "inheritance nightmare": `AdminController extends UserController extends GuestController extends BaseController`. Each hop adds a fact to working memory, and changing a mid-level class can break subclasses you haven't read. [V] https://github.com/zakirullin/cognitive-load
- **Sean Parent, "Inheritance Is The Base Class of Evil"** (GoingNative 2013). Runtime polymorphism does not need client types to inherit from an interface. Use **value semantics + type erasure** (concept-based polymorphism), so polymorphism becomes an implementation detail of a container, not a requirement on every type. [S] https://learn.microsoft.com/en-us/shows/goingnative-2013/inheritance-base-class-of-evil
- **Language defaults push the same way** [M]:
  - Kotlin classes are `final` unless marked `open`.
  - Swift encourages `struct` + protocols ("protocol-oriented programming", WWDC 2015 "Crusty" talk); `final class` is idiomatic.
  - Joshua Bloch, *Effective Java*: "Favor composition over inheritance" and "Design and document for inheritance or else prohibit it".
  - Go and Rust have no implementation inheritance at all. They use embedding/composition plus interfaces/traits.
- **When inheritance *is* fine** (agent checklist):
  - Closed, **sealed** hierarchies modelling a sum type (Kotlin `sealed class`, Swift `enum` with associated values, TS discriminated unions, Java `sealed interface` + records). Here "inheritance" is really a tagged union.
  - The framework requires it (Android `Activity`, `UIViewController`, Django class-based views, React error boundaries), and you keep the subclass thin.
  - One level deep, a true is-a that passes the LSP checklist (A5), with the base class *designed* for extension (template method with documented hooks).
  - Otherwise: **compose**. Inject a collaborator (strategy), delegate, or use a function parameter.

### A5. Liskov Substitution in practice

- Formal source: Barbara Liskov & Jeannette Wing, "A Behavioral Notion of Subtyping" (1994). [M]
- **Checklist for any subtype, implementation of an interface, or protocol conformance:**
  1. **Preconditions** no stronger. Don't reject inputs the parent accepts.
  2. **Postconditions** no weaker. Return at least what the parent promised.
  3. **Invariants** preserved.
  4. **History constraint.** Don't make mutable what the parent treated as immutable. This is the classic Square/Rectangle and `ReadOnlyList` vs `List` problem.
  5. **No new exceptions** the caller can't expect. No `throw new NotImplementedError()` / `UnsupportedOperationException` overrides. If you need them, the interface is too wide: split it (ISP).
  6. **No type checks in callers** (`if (x instanceof Special)`). A caller that must know the subtype means substitution failed.
- Tests: write the **contract test** once against the interface and run it against every implementation. For example, a `StorageContract` suite run against `InMemoryStorage` and `S3Storage`. This keeps fakes honest. [M; GOOS-style practice]

### A6. Value objects, entities, primitive obsession, immutability

- **Entity**: has identity that persists across state changes (`User#42`). Equality is by ID.
- **Value object**: defined entirely by its attributes, **immutable**, equality by value (`Money(10, "EUR")`, `EmailAddress`, `DateRange`). It validates on construction, so an invalid instance cannot exist. (Evans, *DDD*, 2003; Fowler bliki "ValueObject" https://martinfowler.com/bliki/ValueObject.html) [M]
- **Primitive obsession** (Fowler smell). `string` for email, `number` for money, `(lat, lng)` pairs passed separately. Fix: *Replace Primitive with Object* / *Introduce Parameter Object*.
- **The nuance agents miss:** wrap a primitive **only when there is an invariant, a unit, or a confusable sibling**. Examples: `UserId` vs `OrderId`, both strings; `cents` vs `dollars`. In CRUD pass-through code, wrapping every field is boilerplate. (Same caution as E §1.6.)
- **Cheap per-language forms** [M]:
  | Language | Value object idiom | Nominal "brand" for IDs |
  |---|---|---|
  | TypeScript | `readonly` fields + factory returning a parsed type; or a Zod schema with `.brand()` | `type UserId = string & { readonly __brand: "UserId" }` |
  | Kotlin | `data class` with `val`s + `init { require(...) }` | `@JvmInline value class UserId(val raw: String)` |
  | Swift | `struct` (value semantics) + failable/throwing `init` | wrapper `struct UserId: Hashable { let raw: String }` |
  | Python | `@dataclass(frozen=True, slots=True)` + `__post_init__` validation | `UserId = NewType("UserId", str)` (type-checker only) |
  | Go | unexported fields + constructor `NewMoney(...) (Money, error)`; pass by value | `type UserID string` (distinct named type) |
  | Rust | newtype `struct UserId(String)` + `TryFrom` | same |
- **Immutability in OO.** Prefer "withers" (`order.withStatus(PAID)`) or copy (`copy()`, `{...x}`, `dataclasses.replace`) over setters. Mutable state lives inside a small number of objects that own it (aggregates, stores, actors). Rich Hickey calls unmanaged mutable objects the main source of "complecting" value and time (B1).

### A7. Objects vs data structures, and the expression problem

- **Clean Code ch. 6 ("Objects and Data Structures")** [M]: *objects* hide data behind behaviour, and *data structures* expose data and have no meaningful behaviour. The chapter states the asymmetry:
  - Procedural code over data structures makes it easy to **add functions** without changing the structures, and hard to add new structures.
  - OO code makes it easy to **add classes** without changing functions, and hard to add functions.
  - Hybrids (objects with getters/setters *and* behaviour) get the worst of both.
  - "Train wrecks" (`a.getB().getC().doX()`) violate Demeter **only if they are objects**. Chaining through plain data structures (DTOs, JSON) is fine.
- **This is the expression problem**, and it is the real axis of the Muratori ↔ Martin debate [V] https://github.com/cmuratori/misc/blob/main/cleancodeqa.md and cleancodeqa-2.md:
  - Martin's position: "When operations proliferate more rapidly than types we both use switches. When types proliferate more rapidly than operations we both use dynamic dispatch." He also argues most software needs a tiny fraction of CPU, so programmer cycles dominate.
  - Muratori's rebuttal: enums/switches and data-oriented designs can win *even when* types proliferate (his OS driver example). Adding an operation to a vtable design multiplies work across all types. Designs like io_uring save **both** CPU and programmer cycles.
  - They agreed to disagree.
- **Decision table (agent)** — polymorphism vs switch/pattern-match:
  | Situation | Prefer |
  |---|---|
  | Closed set of variants you own; new *operations* added often (render, validate, serialize, price…) | **Sum type + exhaustive `switch`/`when`/`match`** (compiler checks exhaustiveness) |
  | Open set of variants added by others (plugins, drivers, payment providers); operations stable | **Interface/protocol + polymorphic dispatch** |
  | Hot loop over many homogeneous items (games, simulation, data processing) | **Data-oriented**: arrays of plain data + switch or lookup table (A13) |
  | One variant today, "maybe more later" | **Neither.** Write the concrete code (YAGNI) |

### A8. Tell-Don't-Ask and the Law of Demeter — with the nuance

- **Tell, Don't Ask**: instead of pulling data out of an object to decide what it should do, tell the object to do it (`account.withdraw(amt)`, not `if (account.balance >= amt) account.balance -= amt`). This keeps the invariant in one place. (Pragmatic Programmers; Fowler bliki) [M] https://martinfowler.com/bliki/TellDontAsk.html
  - **Fowler's own caveat** in that bliki [M]: he says he doesn't use tell-don't-ask much himself. The real principle is **co-locating data and the behaviour that uses it**. Query methods are fine, and over-applying TDA creates objects stuffed with unrelated display/formatting behaviour.
- **Law of Demeter** ("only talk to your immediate friends"): a method should call methods only on itself, its parameters, objects it creates, and its direct fields. [V] https://github.com/dwmkerr/hacker-laws#the-law-of-demeter
  - **Not** a dot-counting rule. Fluent builders, collection pipelines (`list.filter().map()`), and navigating plain data are fine (see A7).
  - A real violation is `order.getCustomer().getAddress().getCountry().getTaxRate()` in business logic. Fix: *Hide Delegate* (`order.taxRate()`) or pass what's needed as a parameter.
  - Metz's rule 4 (views know one object; `@object.collaborator.value` not allowed) is a Demeter application.

### A9. Interfaces and protocols per language — structural vs nominal

| Language | Typing of interfaces | Where to define the interface | Idiom notes |
|---|---|---|---|
| **Go** | Structural (implicit satisfaction) | **At the consumer.** "Go interfaces generally belong in the package that uses values of the interface type… The implementing package should return concrete types." "Do not define interfaces on the implementor side of an API 'for mocking'." "Do not define interfaces before they are used." [V] https://go.dev/wiki/CodeReviewComments#interfaces | Proverb: "The bigger the interface, the weaker the abstraction." [V] https://go-proverbs.github.io · Idiom: "accept interfaces, return structs" [M] |
| **TypeScript** | Structural | At the consumer (a `type Deps = { sendEmail(to: string, body: string): Promise<void> }`) | Any object literal with the right shape satisfies it, so no `implements` is needed. Use **brands** when structural typing is too loose (IDs). |
| **Python** | Nominal ABCs *or* structural `typing.Protocol` (PEP 544) | Prefer `Protocol` at the consumer; ABCs when you want runtime enforcement/registration | `@runtime_checkable` only when needed; duck typing is the default culture. [M] https://peps.python.org/pep-0544/ |
| **Kotlin** | Nominal (`interface`, must declare) | Where the abstraction is owned (often the domain/port layer) | `fun interface` for single-method (SAM) interfaces; sealed interfaces for sum types; function types `(A) -> B` often replace 1-method interfaces. |
| **Swift** | Nominal protocols, retroactive conformance via extensions | Owner of the abstraction; use extensions to adapt third-party types | Protocols with associated types / `some`/`any`; prefer generics (`some P`) over existentials (`any P`) for performance and type info. [M] |
| **Java/C#** | Nominal | Owner/port layer | Records + sealed interfaces (Java 17+), default methods. |
| **Rust** | Nominal traits, but implementable for foreign types (orphan rule applies) | Owner | Generic `impl Trait` (static) vs `dyn Trait` (dynamic) is an explicit choice. |

**Agent rules:**
- Don't create `IFooService` + `FooServiceImpl` pairs with a single implementation. That is E §1.7's DIP critique; Go's guidance says the same.
- A 1-method interface in TS, Kotlin or Swift is usually better as a **function type**.
- Structural languages (Go/TS/Python Protocol) let the **consumer** declare the minimal interface it needs. This is ISP for free.

### A10. Dependency injection without frameworks

- **Constructor injection** is the default. Dependencies are explicit, the object is valid after construction, and there is no temporal coupling (`init()` before `run()`).
- **Composition Root** (Mark Seemann): wire the whole object graph in **one place** near the entry point (`main`, app bootstrap, request scope factory). Everything else just receives its dependencies. [M] https://blog.ploeh.dk/2011/07/28/CompositionRoot/
- **Service Locator is an anti-pattern** (Seemann, 2010). Classes that call `Container.get(Foo)` hide their dependencies, fail at runtime instead of at construction, and are hard to test. [M] https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/
- **Singletons** (Miško Hevery, "Singletons are Pathological Liars", 2008): global state hidden behind a static accessor lies about a class's dependencies. [M] http://misko.hevery.com/2008/08/17/singletons-are-pathological-liars/
  - Rule: "one instance" is a *wiring decision* made in the composition root, not a property enforced by the class.
- **Lightweight forms per language** [M]:
  - TS/JS: pass a `deps` object or use closure factories: `export function makeOrderService({ db, clock, mailer }) { return { placeOrder(...) {...} } }`.
  - Python: constructor args with defaults for production (`def __init__(self, clock: Clock = SystemClock())`), or plain module-level functions that take collaborators as params.
  - Go: struct fields set by a `New...` constructor in `main.go`.
  - Kotlin/Swift: primary constructor params; default arguments for production implementations.
- **When a DI container is justified:** the platform expects one (Spring, NestJS, Angular, ASP.NET Core, Android Hilt/Koin). Otherwise wiring by hand is clearer until the graph is large (dozens of services with scopes). Agent rule: **don't introduce a DI framework into a codebase that doesn't already use one.**
- **Inject what varies or what's slow/non-deterministic**: clock, random/ID generator, network clients, DB, filesystem, env/config, LLM client. Don't inject pure helpers or value objects.

### A11. Testing OO code — "Growing Object-Oriented Software, Guided by Tests"

- **GOOS** (Steve Freeman & Nat Pryce, 2009) [M] http://www.growing-object-oriented-software.com/
  - Outside-in TDD: start with an end-to-end/acceptance test, then drive inner objects.
  - **"Mock Roles, Not Objects"** (Freeman, Pryce, Mackinnon, Walnes, OOPSLA 2004) [M] http://jmock.org/oopsla2004.pdf. Mocks are a *design* tool for discovering the **roles** (interfaces) an object needs from its neighbours. Mock interfaces that you define, named for the role (`AuctionEventListener`), not concrete classes.
  - **"Only mock types that you own"** / "don't mock what you don't own": wrap third-party APIs in your own adapter (C17) and integration-test the adapter against the real thing. Mocking a vendor SDK directly bakes your misunderstanding of it into your tests.
  - Listen to the tests: painful setup (many mocks, deep stubs) is design feedback. The object has too many collaborators or a Demeter violation.
- Classic vs mockist (Fowler "Mocks Aren't Stubs", 2007) [M] https://martinfowler.com/articles/mocksArentStubs.html. Agent default is **classicist** (real objects + fakes for I/O boundaries) and mocks only for outgoing commands (Metz grid, A2).

### A12. Anemic domain model debate; OOP vs FP pragmatism

- **Fowler, "AnemicDomainModel" (2003)**: domain objects with only getters/setters plus "service" classes holding all logic is "contrary to the basic idea of object-oriented design", which is to combine data and process. [M] https://martinfowler.com/bliki/AnemicDomainModel.html
- **Pragmatists' counter** [M]:
  1. In CRUD-heavy apps there is little domain logic, so a "rich model" is ceremony. Fowler himself ties rich models to complex domains (Transaction Script vs Domain Model in *PoEAA*).
  2. Functional domain modelling (Scott Wlaschin, *Domain Modeling Made Functional*, 2018) deliberately separates **immutable data types** from **pure functions**, and gets invariants from types (sum types, smart constructors) instead of encapsulation.
  - These are not really in conflict. Both demand that **invariants live in one place** and that **illegal states are unrepresentable**.
- **Agent decision rule:**
  - Complex invariants that change together (order lifecycle, ledger, booking with overlaps) → a rich aggregate (class with behaviour) *or* a module of pure functions over a sum-typed state. Pick the one idiomatic to the language/codebase.
  - Simple CRUD → transaction script / handler + schema validation. No `OrderDomainService`, `OrderManager`, `OrderHelper` layers.
- **Functional core, imperative shell** (Bernhardt; see B2): decisions are pure functions over values, and the shell does I/O. This works *inside* OO languages. The "objects" are mostly in the shell (adapters, resources), while the core is values + functions.
- **Carmack (2007/2014)**: large objects hide what their methods mutate. He wished for a "functional" keyword to forbid global references. He moved toward pure functions and inlining single-use code (B12). [S] http://number-none.com/blow/john_carmack_on_inlined_code.html

### A13. Critiques of OOP — what agents should take from them

| Critique | Core claim | Takeaway for agents |
|---|---|---|
| **Casey Muratori, "Clean Code, Horrible Performance"** (Feb 2023) [S] https://www.computerenhance.com/p/clean-code-horrible-performance | Following "clean" rules (polymorphism over switch, small functions, no internal knowledge) on a shape-area benchmark was far slower. Switch + table versions reached ~**15×** faster (as reported), which he framed as erasing years of hardware gains. | In **hot paths** (per-frame, per-pixel, per-row loops, tight numeric code), use flat data, switches/tables and batch processing. Measure. Elsewhere, clarity dominates. |
| **Uncle Bob's reply** [V cleancodeqa.md] | Most systems use a tiny fraction of CPU. "It is economically better for most organizations to conserve programmer cycles than computer cycles." | Cost model depends on context. State which one applies. |
| **Mike Acton, "Data-Oriented Design and C++"** (CppCon 2014) [M] https://www.youtube.com/watch?v=rX0ItVEVjHc | "The purpose of all programs… is to transform data from one form to another." Design around the data and how it's accessed (cache lines), not around a model of real-world objects. He lists "lies" of OO culture (code is more important than data; code should be designed around a model of the world; software is the platform). | For bulk processing, design the data layout first (struct-of-arrays, batching). "Where there is one, there are many." |
| **Brian Will, "Object-Oriented Programming is Bad"** (2016) [S] https://www.youtube.com/watch?v=QM1iUe6IofM | The problem is "orientedness": forcing *everything* into tiny encapsulated units, which creates artificial coupling for control flow. He favours procedural + functional code and large units of encapsulation (thousands of lines). ADTs remain valid. | Don't create a class per noun. Plain functions in modules are a legitimate default. Use classes for ADTs/invariants. |
| **Steve Yegge, "Execution in the Kingdom of Nouns"** (2006) [M] https://steve-yegge.blogspot.com/2006/03/execution-in-kingdom-of-nouns.html | Java-style OO forces verbs to be owned by nouns, producing `Manager`/`Executor`/`Helper` classes. | If a class name ends in -er/-or and has one method, it probably wants to be a function. |
| **Zakirullin, "Cognitive load"** [V] | Deep inheritance, many shallow classes, layered architecture and DDD-as-folder-structure all raise extraneous cognitive load. | See B15. |

### A14. "Class or function/module?" decision table per language

General rule: **use a class when you have state + invariants + behaviour that belong together, or a polymorphic role. Use functions/modules otherwise.**

| Language | Default for stateless logic | Use a class/type when | Avoid |
|---|---|---|---|
| **TypeScript/JS** | Exported functions in a module (the module is the namespace/encapsulation boundary) | Stateful resource (client, cache, pool), ADT with invariants, framework requires it (Angular/Nest services, Lit elements) | Static-only classes (`class Utils { static x() }`), classes just to group functions, `this`-binding bugs in callbacks |
| **React** | Function components + hooks; plain functions for logic | Error boundaries (still class components as of 2026-09) [M] | Class components for new code |
| **Python** | Module-level functions; `@dataclass` for data | Invariants/resources; `Protocol` roles; context managers | Java-style getters/setters (use attributes, then `@property` if needed later); classes with only `__init__` + one method (use a function or `functools.partial`) |
| **Go** | Package-level functions; structs with methods when there is a receiver's state | Types with invariants via unexported fields + constructor; interfaces at consumer | Getter-prefixed names (`GetName` → `Name`), [M] Effective Go; interfaces before a second implementation exists |
| **Kotlin** | Top-level functions; extension functions; `object` for true singletons without state | `data class` / `value class` for values; `sealed` hierarchies; classes for stateful services | `companion object` full of static helpers; `open` classes by default; `*Manager` objects |
| **Swift** | Free functions or static members on an `enum` namespace; `struct` for data | `class` only for identity/shared mutable state (or `actor` for concurrency-safe state); protocols for roles | Class inheritance for code sharing (use protocol extensions); `class` where a `struct` works |
| **Java/C#** | Static methods in a final utility class are acceptable when truly stateless; records for data | Everything stateful; sealed interfaces for sum types | Anemic entity + `*ServiceImpl` for every entity; deep abstract base classes |

### A15. OO anti-pattern catalog (with fixes)

| Anti-pattern | Symptom | Fix |
|---|---|---|
| **Manager / Helper / Util / Processor classes** | Vague name, many unrelated methods, low cohesion | Move each method to its **Information Expert** (GRASP), or to a well-named module by domain concept. Charlax: "Having a library that contains all utils" is an antipattern. [V] https://github.com/charlax/professional-programming/blob/master/antipatterns/code-antipatterns.md |
| **Getters/setters everywhere** | Every field exposed, so logic lives outside the object (anemic) | Expose behaviour (`order.cancel()`), not fields. Allen Holub, "Why getter and setter methods are evil" (JavaWorld 2003) [M]. Kevlin Henney lists "getters and setters" among ineffective habits [S]. |
| **Deep inheritance (>1–2 levels) for code reuse** | Must read 3+ classes to understand one | Composition + injected strategies (A4). |
| **Singleton / global mutable state** | Hidden dependencies, order-dependent tests | Composition root decides lifetime (A10). |
| **Service Locator** | `Container.resolve()` calls inside business code | Constructor injection. |
| **Interface for every class** | `IUserService` with one impl | Delete the interface until a second implementation or a boundary exists (Go wiki). |
| **Speculative hierarchies** | `AbstractBaseFooFactory` with one subclass | Collapse Hierarchy / Inline Class (Fowler). |
| **Refused Bequest / `NotImplemented` overrides** | Subclass throws for inherited methods | LSP violation. Split the interface or use composition. |
| **Primitive obsession / data clumps** | Same 3 params travel together; raw strings for IDs | Value object / parameter object (A6). |
| **Train wrecks through objects** | `a.b().c().d()` in business logic | Hide Delegate; pass what's needed (A8). |
| **Temporal coupling** | Must call `init()` / `setX()` before use | Constructor establishes validity; builders return immutable result. |
| **Boolean-flag parameters that switch behaviour** | `save(user, true)` | Two methods, an enum, or polymorphism. |
| **Null checks everywhere** | `if (x != null)` repeated across callers | Null Object (Metz), `Optional`/`?` with early return, or make absence a variant of a sum type. |
| **Stringly-typed status codes / magic numbers** | `status == 3`, HTTP codes carrying business meaning | Enums / self-describing strings (`"jwt_has_expired"`) [V cognitive-load] |

### A16. Agent rules — OOP

1. Before creating a class, name the **invariant it protects** or the **role it plays polymorphically**. If you can't, write functions.
2. Keep behaviour next to the data it uses (Information Expert). No `XService` that only reads `X`'s fields to compute things about `X`.
3. Compose; don't inherit to share code. Inheritance only for sealed sum types, framework hooks, or a designed-for-extension base one level deep that passes the LSP checklist.
4. Prefer exhaustive `switch`/`match` over a closed, owned set of variants. Use interfaces for open sets of implementations.
5. Define interfaces at the **consumer** and only when there are ≥2 implementations or a real I/O boundary. Prefer function types for single-method roles.
6. Constructor-inject what's non-deterministic or I/O. Wire in one composition root. Never add a service locator or new singleton. Don't add a DI framework the codebase doesn't use.
7. Value objects for concepts with invariants/units/confusable siblings. Immutable by default.
8. Test through the public API: assert results of incoming queries and side effects of incoming commands, and mock only outgoing commands on roles you own.
9. In measured hot paths, switch to data-oriented style and say why in a comment.
10. Follow the codebase's existing paradigm and language idioms over any of these rules (Kotlin sealed/when, Swift struct/protocol, Go consumer interfaces, Python dataclass/Protocol).

---

## PART B — Canonical Talks and Essays on Clean Code and Design Thinking

### B1. Rich Hickey — "Simple Made Easy" (Strange Loop 2011)

Source: https://www.infoq.com/presentations/Simple-Made-Easy [V link via charlax; content M]
- **Simple** (from *sim-plex*, "one fold/braid") is objective: one role, one concept, not interleaved with others. **Easy** (from "adjacent") is relative: near at hand, familiar, already installed. Choosing *easy* over *simple* produces **complecting**: braiding independent concerns together so they can't be reasoned about separately.
- "We can only hope to make reliable those things we can understand." Tests and type checkers are "guard rails", and don't make a complex system simple.
- **The complexity toolkit vs the simplicity toolkit** (Hickey's table, paraphrased from memory [M]):
  | Complex (complects…) | Simple alternative |
  |---|---|
  | State, objects (value + time; everything that touches it) | Values; managed references |
  | Methods (function + state, namespaces) | Functions, namespaces |
  | Variables | Managed refs |
  | Inheritance, switch/matching (who + what) | Polymorphism à la carte (protocols) |
  | Syntax | Data |
  | Imperative loops, fold (what + how) | Set functions / declarative ops |
  | Actors (what + who) | Queues |
  | ORM (OMG) | Declarative data manipulation |
  | Conditionals scattered through program | Rules |
  | Inconsistency | Consistency (transactions) |
- **Agent translation:** familiarity ("easy", including "the library I know") is not a justification. Ask of each design: what did I braid together that could be separate? Typical cases are I/O + decision logic, time + value (mutation), formatting + computation, config lookup + business rule.
- Related: **"Hammock Driven Development"** (2010). Think before typing, and state the problem before solving it. [V link via charlax]

### B2. Gary Bernhardt — "Boundaries" (SCNA 2012) and "Wat" (CodeMash 2012)

- **Boundaries** [S] https://www.destroyallsoftware.com/talks/boundaries
  - Use **simple values** as the boundaries between components and subsystems, not rich objects.
  - **Functional core, imperative shell.** The core has many paths and no dependencies, and is isolated and naturally unit-testable with no test doubles. The shell has few paths and many dependencies, and is covered by a few integration tests. It is a function-level version of Ports & Adapters. [S]
  - Mutability and OO: objects that mutate internally are hard to use as boundaries. Values can be passed, stored, queued and compared.
- **Agent pattern (FCIS):**
  ```
  shell:  load inputs (DB, HTTP, clock, env) → call core(values) → get decision/value → perform effects (write, send, log)
  core:   pure functions: (state, input, now) -> (newState, effects[])
  ```
  Pass `now`, IDs and randomness *in* as values. Return "effects to perform" as data when the decision logic is complex (e.g. `[{type:"send_email", to, template}]`).
- **Wat** (lightning talk) [M] https://www.destroyallsoftware.com/talks/wat. JavaScript/Ruby implicit coercion absurdities (`[] + {}`, `{} + []`, `Array(16).join("wat" - 1)`). Lesson: never rely on implicit coercion. Use strict equality, explicit `Number()`/`String()`, lint rules (`eqeqeq`), and TS strict mode.
- Bernhardt's gist "Types" (charlax lists it) is a concise primer on static/dynamic, strong/weak confusion [V link] https://gist.github.com/garybernhardt/122909856b570c5c457a6cd674795a9c

### B3. John Ousterhout vs Robert Martin — "A Philosophy of Software Design vs Clean Code" (2024-09 → 2025-02)

Source (primary, read in full this session) [V]: https://github.com/johnousterhout/aposd-vs-clean-code

- **Shared ground.** Both aim to make code easy to understand and modify. Ousterhout frames complexity as information: "How much information must a developer have in their head in order to carry out a task? How accessible and obvious is the information that the developer needs?" Martin agrees and adds that the programmer to help most is the *reader*.
- **Method length.**
  - Ousterhout quotes *Clean Code*: "Functions should hardly ever be 20 lines long", and blocks within `if`/`while` should be one line. He argues this over-decomposes. Tiny methods become **shallow** (the interface costs about as much as the body) and **entangled/"conjoined"** ("in order to understand how one of them works internally, you also need to read the code of the other").
  - Martin's criterion is "One Thing": extract if you can *meaningfully* extract a method with a descriptive name that does less than the original. He concedes the book gave little guidance on over-decomposition and says the 2nd edition is "more balanced". He still "would rather err on the side of decomposition".
  - Both agree `PrimeGenerator`'s internal decomposition (Clean Code listing 10-8) is problematic. Its `isMultipleOfNthPrimeFactor` looks like a pure predicate but has hidden side effects, and callers must pass monotonically increasing candidates.
  - Key Ousterhout line: "If there is one thing more likely to result in bugs than not understanding code, it's thinking you understand it when you don't."
- **Comments.** They "struggled to find areas of agreement."
  - Ousterhout would write "5-10x more lines of comments". He thinks interface comments are essential and irreplaceable ("not possible to define interfaces and create abstractions without a lot of comments") and that missing comments cost more than bad ones.
  - Martin says comments as generally practised are net negative. He prefers recasting information into code (long names), agrees comments are needed for public APIs, and trusts comments only after verifying them against code.
  - Both agree implementation code needs comments only when non-obvious.
- **"A Tale of Two Programmers."** Martin's names and Ousterhout's comments *each* failed to help the other reader, because both writers already understood the algorithm. Lesson: explanations written "from inside the box" fail. Test your naming and comments against a cold reader. For an agent, that means re-read the diff as a newcomer would.
- **TDD.** Both agree unit tests are essential and that TDD *can* produce good designs. Ousterhout believes TDD "discourages good design" and prefers **"bundling"**: write a larger chunk of code designed as an abstraction, then write its tests. Martin thinks bundling can be as good but may reduce coverage, and that personality matters.
- **Ousterhout's closing diagnosis.** *Clean Code*'s two errors are "failure to focus on what is important" and "failure to balance design tradeoffs". It gives strong one-directional advice with no guidance for recognising "too far".
- **Agent synthesis rules:**
  - Split a function only if the piece has a simple interface **and** can be understood without reading the caller/callee (no entanglement).
  - Keep closely related steps together, e.g. lock + critical section, or a short initialisation beside its use.
  - Write interface comments (contract, units, preconditions, side effects, error behaviour) for non-obvious modules. Don't write "what" comments on obvious lines.
  - Hidden side effects in a function named like a query is a bug magnet. Rename it (`advance…`) or separate query from modifier.
  - Tests are mandatory. Test-first vs test-after is the user's/repo's choice. Either way, design the abstraction deliberately.

### B4. Kent Beck — "Tidy First?" (O'Reilly, 2023)

Sources: chapter list via notes [V] https://github.com/pkardas/notes/blob/master/books/tidy-first.md · O'Reilly [S] https://www.oreilly.com/library/view/tidy-first/9781098151232/
- **"Make the change easy (warning: this may be hard), then make the easy change."** Beck, tweet, 2012 [M]. This is the central idea behind tidying before behaviour change.
- **The 15 tidyings** (Part I). Small, safe, behaviour-preserving structure changes:
  1. **Guard clauses**: exit early on preconditions.
  2. **Dead code**: delete it (version control remembers), a little per diff.
  3. **Normalize symmetries**: one way to do the same thing.
  4. **New interface, old implementation**: write the interface you wish you had and implement it by calling the old one.
  5. **Reading order**: reorder the file in the order a reader wants.
  6. **Cohesion order**: put coupled elements next to each other (functions, files).
  7. **Move declaration and initialization together.**
  8. **Explaining variables**: name subexpressions.
  9. **Explaining constants.**
  10. **Explicit parameters**: replace a params map with named params.
  11. **Chunk statements**: a blank line between parts.
  12. **Extract helper.**
  13. **One pile**: *inline* over-split code back together to regain clarity, then re-extract. This is Beck endorsing Ousterhout's point.
  14. **Explaining comments**: write what isn't obvious, e.g. right after finding a defect.
  15. **Delete redundant comments.**
- **Managing (Part II).**
  - **Separate tidying** from behaviour changes, in separate PRs/commits with few tidyings each.
  - **Chaining**: tidyings enable tidyings, but beware changing too much too fast.
  - **Batch sizes**: more tidyings per batch means more collision and accidental-behaviour-change risk.
  - **Rhythm**: tidying is "minutes-to-an-hour". More than an hour of tidying before a behaviour change means you've lost track of the minimum needed.
  - **Getting untangled**: if tidying and behaviour got mixed, ship, split, or redo tidy-first.
  - **First, After, Later, Never**:
    - *Never*: the code won't change again.
    - *Later*: big batch, eventual payoff.
    - *After*: waiting makes it more expensive.
    - *First*: pays off immediately, and you know what and how.
- **Theory (Part III).**
  - Software design is "beneficially relating elements".
  - Software creates value through **behaviour** today and **structure** (options) for tomorrow.
  - Time value of money favours *tidy after*. Optionality under uncertainty favours *tidy first*.
  - Coupling: two elements are coupled with respect to a change if changing one requires changing the other. Beck cites Constantine: cost of software ≈ cost of change ≈ cost of the big changes ≈ coupling. [M for exact phrasing]
- **Agent rules:**
  - Do the minimum tidying that makes the requested change easy, as a **separate commit** (or clearly separated diff section), before the behaviour change.
  - Don't tidy code you aren't changing (the "Never" case) unless asked.
  - Cap tidying scope and mention it in the summary.

### B5. Dan Abramov — "Goodbye, Clean Code" (overreacted.io, Jan 2020)

Source [M]: https://overreacted.io/goodbye-clean-code/
- Story: he "cleaned up" a colleague's repetitive shape-resizing code into an abstraction, committed it overnight without talking to them, and his boss asked him to revert. Lessons:
  1. Rewriting a teammate's code without discussion is a trust/collaboration failure.
  2. The deduplicated version was harder to change when requirements diverged per shape (see "The Wrong Abstraction").
  3. "Clean code" is not a goal. It's a phase many developers pass through. Let clean code guide you, then let it go.
- Agent rule: **don't refactor code outside the task's scope** or "clean up" code the user just wrote unless asked. Propose it instead.
- Related: Abramov's "The WET Codebase" talk (2020) [M], and "The Bug-O Notation" (how much a change can break) [V link via charlax] https://overreacted.io/the-bug-o-notation/

### B6. Martin Fowler — "Is High Quality Software Worth the Cost?" (2019) and the Design Stamina Hypothesis (2007)

Sources [M]: https://martinfowler.com/articles/is-quality-worth-cost.html · https://martinfowler.com/bliki/DesignStaminaHypothesis.html
- Internal quality (architecture, code clarity) is invisible to users. Unlike *external* quality, it doesn't trade off against cost. **High internal quality reduces the cost of future features**, so "high quality software is cheaper to produce".
- **Design stamina hypothesis.** Plotting cumulative functionality over time, "no design" starts faster but good design overtakes it at the **design payoff line**. Fowler estimates this is reached in **weeks, not months** (explicitly a hypothesis, not measured).
- Cruft slows teams quickly. Fowler cites DORA/*Accelerate* evidence that elite teams deliver faster *and* with higher quality. [M]
- Agent use: the argument for not taking tactical shortcuts even under time pressure. But it doesn't justify gold-plating, because the payoff is from lower *cruft*, not from more abstraction.

### B7. tef — "Write code that is easy to delete, not easy to extend" (2016)

Source [S]: https://programmingisterrible.com/post/139222674273/write-code-that-is-easy-to-delete-not-easy-to
- "If we see 'lines of code' as 'lines spent', then when we delete lines of code, we are lowering the cost of maintenance." [M exact wording; S gist]
- It lays out a progression:
  - Copy-paste code at first. It's easier to delete code inside a function than to delete a function everyone depends on.
  - Don't copy-paste code (once you've copied it enough times, write a library).
  - Write more boilerplate (to keep frequently-changing parts away from stable ones).
  - Don't write boilerplate (write a library to wrap it).
  - Write a big lump of code (when you don't yet know the seams).
  - Break the code into pieces (isolate the hard-to-write and the likely-to-change).
  - Keep writing code (feature flags, deploy separately).
- Core: **build disposable software, not reusable software.** Isolate the likely-to-change and hard-to-write parts so they can be replaced wholesale.
- Agent rule: prefer designs where a feature can be removed by deleting a folder and one registration line. Avoid designs where every feature threads through a shared base class or god-config.

### B8. Casey Muratori — "Semantic Compression" (2014)

Source [M]: https://caseymuratori.com/blog_0015
- Program like a compressor: write the specific code first, and when you see **two** real instances of the same pattern, compress them into a reusable function. Never design the reusable thing up front. "Make your code usable before you try to make it reusable." [M exact quote]
- This is consistent with the Rule of Three (charlax/Coding Horror: "It is three times as difficult to build reusable components as single use components") [V via charlax] https://blog.codinghorror.com/rule-of-three/

### B9. Joel Spolsky — "Making Wrong Code Look Wrong" (2005)

Source [M]: https://www.joelonsoftware.com/2005/05/11/making-wrong-code-look-wrong/
- Code conventions should make *incorrect* code visibly wrong at the point of use. His example is "Apps Hungarian" prefixes that encode **kind**, not type: `us` = unsafe (user input) string and `s` = safe (encoded) string, so `Write(usName)` looks wrong.
- Distinguishes Apps Hungarian (semantic kind, useful) from Systems Hungarian (machine type, useless).
- He also argues exceptions are invisible gotos, a debatable view today.
- **2026 translation:** encode the "kind" in the **type system** instead of prefixes. Examples: branded `UnsafeHtml` vs `SafeHtml` types (the Trusted Types concept), `RawSql` vs parameterized queries, `Cents` vs `Dollars`, `UtcInstant` vs `LocalDateTime`. Where types can't express it, use naming (`rawInput`, `escapedHtml`, `timeoutMs`).

### B10. Hillel Wayne — "Uncle Bob and Silver Bullets" (2017) and related

Source [S]: https://www.hillelwayne.com/post/uncle-bob/
- Rebuts the "tools are not the answer, discipline is" position. It challenges "you don't need static type checking if you have 100% unit test coverage" and points to TLA+ successes (Amazon, Microsoft) and property-based testing.
- Core line (paraphrased): unit tests are not enough, and neither are types, contracts or formal specs alone. Use everything, because there's one way to be right and infinite ways to be wrong.
- Agent rule: **layer correctness techniques**:
  - Types (strict mode) + tests + runtime validation at boundaries + linters.
  - Property-based tests for parsers and serialisers (fast-check, Hypothesis, jqwik, Kotest property testing, SwiftCheck).
  - Model-checking only for genuinely concurrent/distributed protocols.

### B11. "The Grug Brained Developer" (Carson Gross, 2022)

Source [M; V link via charlax]: https://grugbrain.dev
- "Complexity very, very bad", the "eternal enemy". The best weapon is the word **"no"**. Second best is **"ok"** plus the 80/20 solution.
- Don't factor early. Wait for good **"cut points"**: a narrow interface that traps complexity "like a crystal". This is Ousterhout's deep modules in cave-speak.
- Prefer **integration tests** at the right level. Be wary of mocks. Unit tests are fine early, but don't over-invest.
- **Chesterton's Fence**: understand why code exists before removing it [V hacker-laws].
- **Locality of behaviour** over separation of concerns when they conflict. Put the behaviour on the thing that does it.
- Beware "big brain" abstractions, SPA/microservice fads and "fear of looking dumb". Say "this is too complex for grug".
- Log generously. Use a debugger. Avoid premature optimisation.

### B12. John Carmack — "On Inlined Code" (email 2007-03-13, republished 2014)

Source [S]: http://number-none.com/blow/john_carmack_on_inlined_code.html
- Consider **inlining single-use functions** into the caller, as a style. Reading straight-line code shows the true order of operations and state changes, and prevents functions being called from unexpected places or in the wrong state.
- Many bugs come from unexpected state/ordering, so large objects whose methods mutate unknown fields are dangerous. He'd like a way to enforce "no global references" (functional purity).
- The 2014 preface prefers pure functions where possible. Where not, inlining large straight-line blocks with comments and braces-scoped sections beats a web of tiny functions.
- Agent translation: a long, **linear**, well-sectioned function (chunked with comments/blank lines, per Beck's "chunk statements") is acceptable. It is often better than a dozen single-use helpers. Extract when reused, independently testable, or genuinely deep.

### B13. Kevlin Henney — "Seven Ineffective Coding Habits of Many Programmers" (2014–16)

Source [S]: https://www.slideshare.net/Kevlin/seven-ineffective-coding-habits-of-many-programmers-45312038 · video (Build Stuff '14 / NDC) https://vimeo.com/97329157 [M link]
- The seven habits:
  1. **Noisy code**: comments and boilerplate that add no information.
  2. **Unsustainable spacing**: layouts like column alignment that break on edit and hurt diffs.
  3. **Lego naming**: gluing generic words (`Manager`, `Value`, `Object`, `Impl`, `Data`, `Info`) into long, meaningless names.
  4. **Under-abstraction**: primitive-heavy code with no domain types. His tag-cloud trick shows `string`, `int`, `List` dominating instead of domain words.
  5. **Unencapsulated state**: exposing mutable internals.
  6. **Getters and setters**: exposing implementation, not behaviour.
  7. **Uncohesive tests**: test names like `testFoo1` instead of propositions describing required behaviour.
- **Tag-cloud check (agent-usable):** count identifier tokens in a module. If `data`, `info`, `manager`, `handle`, `process`, `string` dominate over domain nouns, the code is under-abstracted or badly named.
- Test naming: name tests as **propositions** ("rejects expired tokens", "applies discount only once per order").

### B14. Arlo Belshee — "Naming is a Process" (blog series)

Source [S]: https://arlobelshee.com/naming-is-a-process-part-7-intent-to-domain-abstraction/ (series index on same site)
- Names evolve through **seven stages** as you learn what code does:
  1. **Missing / Misleading**
  2. **Nonsense**: an obviously placeholder name like `Applesauce`, which is *better* than misleading because it doesn't lie.
  3. **Honest**: says part of what it does.
  4. **Completely Honest**: says everything it does, e.g. `ParseXmlAndStoreFlightToDatabaseAndLocalCacheAndStartBackgroundSync`. The ugliness exposes the design problem.
  5. **Does the Right Thing**: split the thing so each piece has an honest short name.
  6. **Intent**: name *why*, not *what*.
  7. **Domain Abstraction**: new domain concepts/types emerge.
- Agent rules:
  - When a name is hard, write the **completely honest** long name first. If it contains "And", that is a split signal.
  - Never leave a *misleading* name. A nonsense name plus a TODO is better than a lie.
  - This complements Ousterhout's "hard to pick a name → design smell".

### B15. Artem Zakirullin — "Cognitive load is what matters" (living doc, updated 2026-06)

Source [V]: https://github.com/zakirullin/cognitive-load (README.md and README.agents.md, CC-BY-4.0)
- Working memory holds about 4 "chunks". **Intrinsic** load comes from the problem and can't be reduced. **Extraneous** load comes from presentation and must be minimised.
- Concrete practices:
  - **Complex conditionals** → named intermediate booleans (`isValid && isAllowed && isSecure`).
  - **Nested ifs** → early returns.
  - **Inheritance nightmare** → composition.
  - **Too many small methods/classes/modules** → prefer deep modules. "The names and interfaces of such classes tend to be more mentally taxing than their entire implementations" (`MetricsProviderFactoryFactory`).
  - **SRP reinterpreted**: "A module should be responsible to one, and only one, user or stakeholder". If one bug brings complaints from two business people, you violated it.
  - **Shallow microservices** → a well-crafted modular monolith. Anecdote: 5 devs, 17 microservices, 10 months late.
  - **Feature-rich languages**: "Reduce cognitive load by limiting the number of choices" (Rob Pike). Stick to an orthogonal subset.
  - **Business logic in HTTP status codes** → self-describing codes in the body (`{"code":"jwt_has_expired"}`). Prefer self-describing strings over numeric statuses.
  - **Abusing DRY**: quotes Pike's "A little copying is better than a little dependency" and "**All your dependencies are your code.**"
  - **Framework coupling** → keep business logic outside the framework, and use the framework "in a library-like fashion".
  - **Layered architecture** → "Abstraction is supposed to hide complexity, here it just adds indirection." A storage migration took 10 months despite an abstraction layer (a few hours for the adapter), because of Hyrum's-law ordering assumptions. Follow DIP, a single source of truth, and information hiding, not layer rituals.
  - **DDD** is about the problem space (ubiquitous language, bounded contexts), not folder structures.
  - **"Familiarity is not the same as simplicity"** (Dan North). Measure newcomer confusion: >~40 min confused in a row means improve the code.
- `README.agents.md` gives a ready-made agent prompt:
  - No "WHAT" comments except bird's-eye summaries; write "WHY" comments.
  - Use intermediate variables and early returns.
  - Prefer composition, and deep modules over shallow ones.
  - Use a minimal language subset and self-descriptive values.
  - "Don't abuse DRY, a little duplication is better than unnecessary dependencies."
  - Avoid unnecessary layers.
  - **Credit it in CREDITS.md if its ideas are adapted (CC-BY-4.0 requires attribution).**

### B16. Other laws and short essays worth encoding

- **Hyrum's Law**: "With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviors of your system will be depended on by somebody." [V hacker-laws/cognitive-load] https://www.hyrumslaw.com. For agents, "internal" behaviour changes (ordering, timing, error text) can be breaking changes.
- **Gall's Law**: complex systems that work evolved from simple systems that worked. [V charlax/hacker-laws]
- **Kernighan's Law**: debugging is twice as hard as writing, so code written as cleverly as possible can't be debugged by its author. [V hacker-laws]
- **Chesterton's Fence** [V hacker-laws]. Before deleting "weird" code, find out why it's there (git blame, tests, issue links).
- **CUPID** (Dan North): Composable, Unix philosophy, Predictable, Idiomatic, Domain-based. "Properties, not principles." [V via charlax] https://dannorth.net/blog/cupid-for-joyful-coding/
- **"Out of the Tar Pit"** (Moseley & Marks 2006): essential vs accidental complexity. State is the main source of accidental complexity. [V via charlax] https://curtclifton.net/papers/MoseleyMarks06a.pdf
- **"No Silver Bullet"** (Brooks 1986): essence vs accident. **Buy vs build** is one of the few real levers. [V via charlax]
- **"Software Design is Knowledge Building"** / Naur "Programming as Theory Building" (1985). The program's real asset is the team's theory of it. [V via charlax] https://olano.dev/blog/software-design-is-knowledge-building/
- **"Nobody Gets Promoted for Simplicity"** (terriblesoftware.org, 2026-03) [V link via charlax]. Incentives push toward complexity, so value simplicity explicitly.

### B17. Tension map — how to resolve conflicting canonical advice

| Tension | Side A | Side B | Resolution rule for agents |
|---|---|---|---|
| Function size | Clean Code: tiny functions, "One Thing" | Ousterhout/Carmack/Beck "One Pile": deep, linear, avoid entanglement | Extract when the piece has a **simple interface and can be read alone**. Otherwise keep linear code chunked with blank lines/comments. |
| Comments | Martin: recast into names; comments rot | Ousterhout: interface comments are essential | **Interface/why comments yes; what comments no.** Update comments in the same diff as code. |
| DRY | DRY / Rule of One | Metz, tef, Muratori, Pike: duplication is cheaper than the wrong abstraction/dependency | Dedupe **knowledge** (business rules) immediately. Dedupe **code shape** only after ≥2–3 real instances with the same reason to change. |
| Polymorphism vs switch | Clean Code / GRASP: replace conditionals with polymorphism | Muratori / Hickey: switches/tables, "polymorphism à la carte" | Expression-problem table (A7). |
| Layers & abstraction | Clean/Hexagonal architecture | Cognitive-load, grug: layers add indirection | Put a seam only at a real I/O boundary or a proven variation point (DIP), not per layer ritual. |
| TDD | Martin/Beck: test-first | Ousterhout: bundling | Tests are non-negotiable. Follow the repo's practice for order. |
| Performance | Bob: programmer cycles | Muratori/Acton: hardware reality | Default to clarity. In measured hot paths, go data-oriented and document why. |
| Tidying | Tidy first (Beck) | Don't touch others' code (Abramov) | Tidy only code the task touches, in a separate commit, minimal scope. |

### B18. Agent rules — design thinking

1. Optimise for the next reader's working memory. After writing, re-read the diff "from outside the box" (B3) and remove extraneous load (B15).
2. Separate structure changes (tidyings) from behaviour changes. Keep tidying minimal and relevant.
3. Keep decisions pure and push effects to the edges (FCIS). Pass time, IDs and randomness in.
4. Name honestly first, then by intent. A hard name is a design signal.
5. Prefer deletable designs: features as removable slices, not woven through shared bases.
6. Encode "kinds" in types (safe/unsafe, units, IDs) so wrong code looks wrong or doesn't compile.
7. Don't "clean up" code outside the request, and never overwrite a teammate's approach silently. Suggest instead.
8. Layer correctness: strict types + tests + boundary validation + property tests where input spaces are large.

---

## PART C — Dependency Management: Avoiding, Evaluating and Securing Dependencies

### C1. Why dependencies deserve friction

- **Russ Cox, "Our Software Dependency Problem" (2019-01-23)** [S] https://research.swtch.com/deps. Adding a dependency "outsources the work of developing that code — designing, writing, testing, debugging, and maintaining — to someone else on the internet, someone you often don't know." Fine-grained reuse arrived so fast that best practices lag behind.
- **Rob Pike (Go Proverbs, Gopherfest 2015):** "A little copying is better than a little dependency." [V] https://go-proverbs.github.io
- **Zakirullin:** "All your dependencies are your code." Debugging 10+ stack levels into a library is painful. [V]
- **Armin Ronacher, "Build It Yourself" (2025-01-24)** [V via charlax list]: "It's 2025 and it's faster for me to have ChatGPT or Cursor whip up a dependency free implementation of these common functions, than it is for me to start figuring out a dependency." https://lucumr.pocoo.org/2025/1/24/build-it-yourself/
- **Carl M. Johnson, "Tripping over the potholes in too many libraries" (2020)** [V link via charlax] https://blog.carlmjohnson.net/post/2020/avoid-dependencies/
- **OpenSSF counterweight** [V] https://best.openssf.org/Simplifying-Software-Component-Updates: "there is an inherent risk in reinventing the wheel – the code you write will almost certainly have bugs and potential security vulnerabilities. A well-maintained and widely used library will…" (likely be better). Avoiding dependencies is **not** a license to hand-roll crypto, parsers, or auth.
- **Brooks (1986):** buying what the mass market provides is one of the few real attacks on essential complexity. [V via charlax]
- **Build vs buy** (entropicthoughts): "an organisation has a limited capacity for expertise, so we don't want to have to become experts on things that don't make up a competitive advantage." Kane Narraway is sceptical of claims to build cheaper than a vendor, because long-term maintenance is rarely forecast. [V via charlax]
- **Net rule:** fewer, bigger, well-maintained dependencies for hard problems. **Zero** dependencies for trivial problems. Native platform APIs first.

### C2. Russ Cox's evaluation checklist (2019)

[M for full structure; S for the framing] https://research.swtch.com/deps

**Inspect before adopting:**
- **Design**: clear docs, sensible API.
- **Code quality**: skim the code. Is it careful?
- **Testing**: does it have tests? Run them.
- **Debugging**: how are bugs handled? Is the issue tracker responsive?
- **Maintenance**: recent commits, active maintainers, history of fixing things.
- **Usage**: are many others using it? Look at reverse dependencies.
- **Security**: history of vulnerabilities, does it process untrusted input, fuzzing?
- **Licensing**: compatible?
- **Its own dependencies**: every transitive dependency inherits all of these questions.

**Then:**
- **Test it**: run its tests in your context.
- **Abstract it**: wrap it behind your own interface so it can be replaced (C17).
- **Isolate it**: sandbox risky code (separate process/permissions).
- **Avoid it** if you only need a small part: copy (with licence and attribution) or write it.
- **Upgrade it**: plan for regular updates. Most bugs are fixed upstream.
- **Watch it**: monitor for vulnerabilities and changes in maintenance.

### C3. OpenSSF "Concise Guide for Evaluating Open Source Software" (2023-11, restructured 2025-04)

Source [V]: https://best.openssf.org/Concise-Guide-for-Evaluating-Open-Source-Software. Condensed:
- **Initial**:
  - **Consider necessity**: "Every new dependency increases the attack surface."
  - **Verify authenticity**: the correct source, not a fork or typosquat. Check the name, the project website link, the fork relationship, creation time and popularity.
- **Maintenance**:
  - Significant activity in the last **12 months**.
  - Recent releases/announcements.
  - More than one maintainer, ideally from different orgs (though many widely used projects have one).
  - Last release within 12 months.
  - Version stability (0.x/alpha/beta = unstable).
- **Security practices**:
  - OpenSSF Best Practices badge.
  - Up-to-date deps.
  - Branch protection.
  - Audits.
  - Timely security fixes, LTS.
  - **deps.dev + OpenSSF Scorecard** score.
  - CI tests.
  - No known important unfixed vulns.
- **Usability & security**:
  - API easy to use securely (e.g. parameterized queries).
  - API stability / breaking-change policy.
  - **Secure defaults** ("If not, avoid it").
  - Security guidance.
  - Vulnerability reporting instructions.
- **Adoption & licensing**:
  - A clear OSI licence consistent with use.
  - **Name verification** ("Check if a similar name is more popular — that could indicate a typosquatting attack").
  - Significant adoption.
  - Suitability ("Avoid Hype Driven Development").
- **Practical testing**:
  - Try it in an isolated environment.
  - Watch for exfiltration behaviour.
  - Check it doesn't add unnecessary production transitive deps.
- **Code evaluation**:
  - Look for many TODOs.
  - Check install scripts for malice, exfiltration from `~/.ssh`/env vars, and obfuscated/encoded executed values. Look at the most recent commits (attackers add recent code).
  - Sandbox test, static analysis, run its tests.

### C4. Agent decision checklist — "Should I add this dependency?"

(Synthesis of C1–C3; the thresholds are our proposals, **not** sourced standards.)

**Step 0 — Do we need code at all?** Is the feature required by the task? Is it already implemented in the codebase? Grep for an existing helper or an already-installed library that does it.

**Step 1 — Is it trivial?** If the functionality is ≤ ~20–50 lines, has no security or edge-case depth, and isn't a standard (see C5 "never hand-roll"): **write it** with tests, or use the platform API (C6). Examples: `isOdd`, `leftPad`, `chunk`, `uniq`, `sleep`, `clamp`, `debounce`, `pick/omit`, `capitalize`, `range`, `groupBy` (native `Object.groupBy`/`Map.groupBy` in modern JS [M]).

**Step 2 — Is it already in the platform?** Node/Web/Python/Go stdlib, or the framework already installed (C6).

**Step 3 — If a package is still warranted, verify it's real and right:**
- ☐ The exact name exists in the official registry and matches the project's docs/repo link. It is **not** a hallucinated or typosquatted name (C13).
- ☐ Repo link resolves. Stars/downloads/reverse deps are plausible. The package is not brand new unless expected.
- ☐ Maintained: a release in the last 12 months, recent issue/PR activity, >1 maintainer or org-backed.
- ☐ OpenSSF Scorecard / deps.dev checked. No unfixed high/critical CVEs.
- ☐ Licence compatible (C15).
- ☐ Transitive footprint acceptable: count added packages (`npm install --dry-run`, `npm ls`, `pnpm why`), check install size (pkg-size.dev) and, for front-end, bundle cost (bundlephobia.com). Check tree-shakeability/ESM.
- ☐ No install scripts, or scripts understood and allow-listed (C10).
- ☐ Types included (TS) and the API fits the use.
- ☐ Pin via the lockfile. Add as `devDependency` if build-only.

**Step 4 — Contain it:** import it in one place, behind our own function/interface if it touches business logic or might be swapped (C17).

**Step 5 — Report it:** in the PR/summary, name the new dependency, why native/own code wasn't used, and the evaluation signals checked.

**Hard stops (agent must not add without explicit user approval):**
- Any package the agent cannot confirm exists at the stated name.
- Packages published < N days ago (the cooldown, C9).
- Packages with install scripts not previously allow-listed.
- Copyleft (GPL/AGPL) packages in proprietary/distributed code.
- Any dependency that duplicates one already installed (a second date library, HTTP client or validation library).

### C5. Buy / borrow / build table

| Domain | Default | Why |
|---|---|---|
| Cryptography primitives, password hashing, JWT/JOSE, TLS | **Borrow** a mature library (platform `crypto`/WebCrypto, libsodium, argon2/bcrypt/scrypt, `jose`) | Hand-rolled crypto is the canonical security failure. OpenSSF: rewriting has inherent bug/vuln risk [V]. |
| Authentication / sessions / OAuth / passkeys | **Buy or borrow** (identity provider, or a well-maintained auth library/framework built-in) | High security depth; standards-heavy (OAuth 2.1, OIDC, WebAuthn). |
| Payments, tax, invoicing | **Buy** (payment processor SDK/hosted checkout) | PCI scope, fraud, regulatory; not a differentiator. |
| Email **deliverability** (SPF/DKIM/DMARC, bounces, reputation) | **Buy** (transactional email provider) | Reputation and infrastructure; building a mail server is rarely justified. |
| HTML sanitisation, Markdown→HTML with untrusted input | **Borrow** (DOMPurify-class sanitiser; framework escaping) | XSS depth. |
| Parsing standard formats (CSV edge cases, YAML, XML, dates/time zones, URLs, email-address parsing, semver) | **Borrow / platform** (`URL`, `Intl`, `Temporal` where available, stdlib `csv`/`json`) | Standards have edge cases; the platform often covers them now. |
| Search | Start with **DB full-text** (Postgres FTS, SQLite FTS5); **buy/borrow** a search engine when relevance tuning, facets or scale demand it | Avoid a new service for simple needs. [synthesis] |
| Feature flags, analytics, error tracking, observability | **Buy/borrow** (OpenTelemetry SDKs, hosted tools) until scale/cost argues otherwise | Undifferentiated; many edge cases. |
| UI component primitives with accessibility (dialogs, menus, comboboxes) | **Borrow** headless accessible primitives | ARIA/focus management depth. |
| Micro-utilities (padding, parity, type checks, array helpers, `sleep`, `uuid v4`) | **Build (inline) or platform** | Dependency cost exceeds code cost (C7). |
| Core domain logic (pricing rules, scheduling, your product's algorithms) | **Build** | Competitive advantage; you need the theory of it (Naur). |

### C6. Standard library / platform first — replacements (as of 2026-09)

**Source for the JS rows:** e18e `module-replacements` manifests and docs [V] https://github.com/es-tooling/module-replacements (native.json has 320 mappings and micro-utilities.json 153 as of the 2026-09 clone). Consumed by `eslint-plugin-depend` and `@e18e/eslint-plugin` [V]. **Agent tip:** these lint plugins flag replaceable deps automatically.

**Node.js built-ins:**
| Package | Native replacement | Available since |
|---|---|---|
| `node-fetch`, `axios` (simple cases), `cross-fetch` | global `fetch` (Undici) | Node 18 (stable 21) [M] |
| `dotenv` | `node --env-file=.env` / `--env-file-if-exists`; `process.loadEnvFile()` | 20.6 / 22.9 / 20.12 [V] |
| `rimraf` | `fs.rm(path, { recursive: true, force: true })` | 14.14 [V] |
| `mkdirp`, `make-dir` | `fs.mkdir(path, { recursive: true })` | 10.12 [V] |
| `glob`, `fast-glob`, `globby` | `fs.glob` / `fs.promises.glob` (or `tinyglobby`) | 22.x [V] |
| `chalk`, `colors`, `kleur` | `util.styleText` (hex colours from 26.1) | 20.x [V] |
| `minimist`, `yargs` (simple CLIs) | `util.parseArgs` | 18.3 / 16.17 [V] |
| `uuid` (v4), `uuidv4` | `crypto.randomUUID()` | Node + browsers [V] |
| `deep-equal` | `util.isDeepStrictEqual` | 9.0 [V] |
| `sqlite3` | `node:sqlite` (`DatabaseSync`), **Stability 1.2 Release Candidate** as of 2026-02 (Node 25.7 / 24.15) [S], not yet "stable". Available since 22.13 [V] | — |
| `mocha`/`jest` (for simple libs) | `node:test` + `node:assert` (+ `--watch`, coverage flags) | stable in Node 20 [M] |
| `nodemon` | `node --watch` | 18.11/22 stable [M] |
| `debug` | `util.debuglog` or `obug` (maintained fork) [V] | — |
| `lodash` | native (`structuredClone`, `Object.groupBy`, `Array.prototype.findLast`, `toSorted`, `at`, `flat`, `Set` methods) or `es-toolkit` [V/M] | — |
| `left-pad`, `object-assign`, `array-includes`, `es6-promise`, `abort-controller`, `globalthis`, `has`, `is-nan`, `xtend`, `inherits` | `padStart`, `Object.assign`, `includes`, `Promise`, `AbortController`, `globalThis`, `Object.hasOwn`/`hasOwnProperty`, `Number.isNaN`, spread, `class extends` | all widely available [V] |
| `moment` | `Intl.DateTimeFormat`, `Temporal` (where available), or `date-fns`/`dayjs`/`luxon` | — [M] |

**Web platform (browsers):**
- `structuredClone`, `crypto.randomUUID`, `fetch` + `AbortController`/`AbortSignal.timeout`, `Intl.*` (DateTimeFormat, NumberFormat, RelativeTimeFormat, PluralRules, Segmenter, ListFormat), `URL`/`URLSearchParams` [M].
- `URLPattern` is **Baseline Newly available since 2025-09-15** (Chrome 95, Firefox 142, Safari 26) [S] https://web.dev/blog/baseline-urlpattern
- **Temporal**: TC39 Stage 4 (2026-03, ES2026), shipped in Firefox 139 and Chrome/Edge 144 (2026-01), **not yet in stable Safari as of the sources** (2026). Unflagged in Node 26 [S] https://socket.dev/blog/temporal-api-ships-in-chrome-144-major-shift-for-javascript-date-handling · https://bryntum.com/blog/javascript-temporal-is-it-finally-here/. Agent rule: use Temporal with a polyfill or feature-detect when Safari support matters. Re-check caniuse at time of use.
- **Rule:** check Baseline status (web.dev/baseline, MDN compat) before replacing a dependency with a new native API. e18e: "very newly available native features are unlikely to join the list since they are not widely available yet" [V].

**Python stdlib first** [M]: `pathlib`, `dataclasses`, `enum`, `zoneinfo` (3.9), `tomllib` (3.11), `graphlib`, `statistics`, `functools.cache`, `itertools.batched` (3.12), `asyncio.TaskGroup` (3.11), `sqlite3`, `json`, `csv`, `argparse`, `logging`, `secrets`, `hashlib`, `uuid`, `http.HTTPStatus`, `urllib.parse`. Common deps still justified: `httpx`/`requests` (HTTP ergonomics), `pydantic` (validation), `pytest`.

**Go stdlib first** [M]: `net/http` (with the 1.22 method+pattern routing, reducing router dependencies), `log/slog` (1.21), `slices`/`maps` (1.21), `encoding/json`, `testing`, `context`, `embed`, `errors.Join`, `crypto/*`. Community norm: fewer deps, and a stdlib-first culture (Pike proverb).

**Caveat on "trivial" code:** e18e's own snippet for `is-odd` is `(n % 2) === 1` [V], which returns `false` for negative odd numbers (`-3 % 2 === -1`). When inlining a micro-utility, **write a test for edge cases** (negatives, NaN, empty, Unicode). Use `n % 2 !== 0` or `Math.abs(n % 2) === 1`.

### C7. Micro-package culture, left-pad, and the true cost of a dependency

- **left-pad (2016-03-22)** [M]: an author unpublished ~250 packages after a naming dispute with Kik. `left-pad` (an ~11-line function) disappeared and broke builds across the ecosystem (Babel, React toolchains). npm restored it and changed its unpublish policy. https://blog.npmjs.org/post/141577284765/kik-left-pad-and-npm (archived)
- **is-odd / is-even / is-number** micro-packages with millions of weekly downloads are the standard examples of dependency bloat. e18e's micro-utilities manifest maps them to one-line snippets [V].
- **Hidden costs of each dependency:**
  1. **Attack surface**, including transitive deps and maintainers' accounts (C8).
  2. **Update churn**: PRs, breaking changes, peer-dep conflicts.
  3. **Install time and disk** (CI minutes).
  4. **Bundle size** for front-end code.
  5. **Debugging depth.**
  6. **Licence obligations.**
  7. **Abandonment risk.**
  8. **Hyrum's-law lock-in** to its quirks.
- **Measuring:**
  - `npm ls --all | wc -l` / `pnpm list --depth Infinity`.
  - `npm install --dry-run`.
  - `npx knip` (finds unused deps/exports) [M].
  - `depcheck` (e18e lists replacements for it) [V].
  - bundlephobia.com / pkg-size.dev, and `source-map-explorer` or `vite-bundle-visualizer` [M].
  - Socket.dev / Snyk Advisor package health [V lirantal].
- **Libraries vs apps:** a **library** should minimise dependencies harder than an app, because every consumer inherits its tree. Lirantal §14: "Design packages with minimal or zero dependencies by leveraging modern JavaScript features" [V].

### C8. Supply-chain incident timeline (for skills and evals)

| Date | Incident | Vector | Lesson / control |
|---|---|---|---|
| 2016-03 | **left-pad** unpublish [M] | Maintainer removal | Registry policies; lockfiles + caches/mirrors; avoid trivial deps |
| 2018-07 | **eslint-scope** malicious publish [V lirantal fn] https://eslint.org/blog/2018/07/postmortem-for-malicious-package-publishes/ | Stolen npm token | 2FA; token hygiene |
| 2018-11 | **event-stream / flatmap-stream** [V lirantal fn] https://snyk.io/blog/a-post-mortem-of-the-malicious-event-stream-backdoor/ | Maintainer handed package to a stranger, who added a targeted backdoor | Maintainer-change signals; review new transitive deps |
| 2021-02 | **Dependency confusion** (Alex Birsan) [V lirantal fn] https://medium.com/@alex.birsan/dependency-confusion-4a5d60fec610 | Public package with same name as internal one, higher version | Scoped packages; registry config pinning scopes to private registry |
| 2022-01 | **colors/faker** sabotage [V lirantal fn] | Maintainer protestware | Pinning; lockfiles; cooldowns |
| 2022-03 | **node-ipc** protestware [V lirantal fn] | Maintainer added destructive geo-targeted code | Same |
| 2024-03 | **xz-utils backdoor** (CVE-2024-3094) [V OSSF] | Multi-year social engineering; payload hidden in release tarball, not VCS | Build from VCS source, not pre-generated release artefacts (OSSF item 27) |
| 2024-06 | **polyfill.io** domain takeover [V OSSF] | Third-party CDN script domain sold/subverted | Self-host assets; SRI; don't load JS from domains you don't control (OSSF item 28) |
| 2025-03-14/15 | **tj-actions/changed-files** (CVE-2025-30066) [S] https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066 | Attacker repointed **tags v1–v45.0.7** to a malicious commit that dumped CI secrets into logs; ~23k repos used it; linked to the reviewdog/action-setup compromise; in CISA KEV | **Pin GitHub Actions to full commit SHA**; "hash-pinned users were not impacted" [S]; least-privilege `GITHUB_TOKEN` |
| 2025-08 | **Nx "s1ngularity"** [V lirantal fn] https://snyk.io/blog/weaponizing-ai-coding-agents-for-malware-in-the-nx-malicious-package/ | Malicious postinstall that **weaponized local AI coding CLIs** to hunt for secrets | Disable install scripts; agents must never run untrusted installs with broad permissions |
| 2025-09-08 | **chalk/debug + 16 others** [S] https://www.stepsecurity.io/blog/20-popular-npm-packages-compromised-chalk-debug-strip-ansi-color-convert-wrap-ansi · https://vercel.com/blog/critical-npm-supply-chain-attack-response-september-8-2025 | Maintainer phished via look-alike domain `npmjs.help` (username, password and **live TOTP** captured); 18 packages, ~2.6B weekly downloads combined; browser crypto-wallet hijacking payload; malicious versions live ~**2 hours** | Phishing-resistant 2FA (FIDO/WebAuthn), cooldowns, lockfiles |
| 2025-09 (mid) | **Shai-Hulud** worm [V lirantal fn; S] https://unit42.paloaltonetworks.com/npm-supply-chain-attack/ | Self-replicating: stole npm/GitHub tokens with TruffleHog and republished victims' packages with malicious scripts | Short-lived tokens, trusted publishing, no install scripts |
| 2025-11-24 | **Shai-Hulud 2.0** ("Sha1-Hulud") [S] https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/ · https://posthog.com/blog/nov-24-shai-hulud-attack-post-mortem | **preinstall** script (`setup_bun.js`) installed Bun, harvested secrets, and could register the host as a GitHub Actions runner; ~700–800 packages (reports vary: 796 unique, 20M+ weekly downloads); 25k+ malicious GitHub repos | preinstall also runs, so disable **all** lifecycle scripts; CI secret isolation |
| 2026-03-31 | **axios 1.14.1 / 0.30.4** [S] https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/ · https://cloud.google.com/blog/topics/threat-intelligence/north-korea-threat-actor-targets-axios-npm-package | Hijacked maintainer account. The only change was a new dependency `plain-crypto-js` (a crypto-js look-alike, **pre-seeded with a clean 4.2.0 to build history**) whose 4.2.1 postinstall dropped a cross-platform RAT. Google attributes it to a North-Korea-nexus actor | New-transitive-dependency alerts; cooldowns; ignore-scripts; "history" isn't proof of trust |

### C9. How the ecosystem reacted (2025–2026)

- **GitHub/npm, "Our plan for a more secure npm supply chain" (2025-09)** [S] https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/:
  - Publishing restricted to **local publishing with required 2FA**, **granular tokens with short lifetimes (7 days)** for publishing, and **trusted publishing**.
  - Deprecate legacy/classic tokens and **TOTP 2FA in favour of FIDO-based 2FA**.
  - Publishing access disallows tokens by default.
  - Expand trusted-publishing providers.
  - Follow-up discussion about 2FA-bypass granular tokens: https://github.com/orgs/community/discussions/201329 [S]
- **npm trusted publishing (OIDC)**: publish from GitHub Actions/GitLab CI with short-lived OIDC credentials, and provenance is generated automatically. `npm publish --provenance` requires npm ≥ 9.5 on cloud-hosted runners [V lirantal §12–13]. Consumers verify with `npm audit signatures` [M].
- **npm CLI** [S]:
  - `min-release-age` (days) added in **npm 11.10.0 (2026-02-11)** (PR npm/cli#8965). It populates `--before` relatively, and errors if combined with `--before`.
  - `allow-git=none|root|all` added in npm 11.10 [V lirantal].
- **pnpm** [V lirantal; S pnpm 11]:
  - 10.0: dependency lifecycle scripts **off by default** (`onlyBuiltDependencies` allow-list, and `allowBuilds` from 10.26).
  - 10.3: `strictDepBuilds`.
  - 10.16: `minimumReleaseAge` (minutes) + `minimumReleaseAgeExclude`.
  - 10.21: `trustPolicy: no-downgrade`, which refuses a version whose publish trust (trusted publisher > provenance > signatures > none) regressed.
  - 10.26: `blockExoticSubdeps`.
  - **pnpm 11 (2026): `minimumReleaseAge` defaults to 1440 (1 day) and `blockExoticSubdeps` defaults to true** [S] https://pnpm.io/blog/releases/11.0
- **Yarn 4.10+**: `npmMinimalAgeGate` + `npmPreapprovedPackages`. **Bun 1.3+**: `minimumReleaseAge` (seconds) in `bunfig.toml`. Bun doesn't run dependency postinstall scripts except for `trustedDependencies` [V lirantal].
- **Dependabot**: a `cooldown` option (`default-days`, `semver-major-days`, …) [V lirantal]. **Snyk** auto-upgrade PRs skip versions < 21 days old [V lirantal].
- **Renovate** [V source] https://github.com/renovatebot/renovate/blob/main/lib/config/presets/internal/:
  - `security:minimumReleaseAgeNpm` (also `…Crate`, `…Pypi`) waits **3 days**. The stated rationale: time for malware researchers/scanners, and to avoid upgrading to versions later unpublished.
  - `config:best-practices` extends `config:recommended`, `docker:pinDigests`, `helpers:pinGitHubActionDigests`, `:pinDevDependencies`, `abandonments:recommended` (flags abandoned packages), `security:minimumReleaseAgeNpm`, `:maintainLockFilesWeekly`.
  - Caveat: minimumReleaseAge is **not enforced** for lockFileMaintenance, replacement, pin, bump, lockfileUpdate or rollback updates.
  - `config:js-app` = pin all except peer deps. `config:js-lib` = pin only devDependencies.
- **Python**: **pip 26.1 (2026-05) ships dependency cooldowns and experimental lockfile support** [S, InfoQ headline] https://www.infoq.com/news/2026/05/pip-261-dependency-cooldowns/. uv has `exclude-newer` [M, check relative-duration support]. PyPI supports trusted publishing and PEP 740 attestations [M].
- **Ruby**: gem.coop cooldowns beta [S headline].
- **William Woodruff, "We should all be using dependency cooldowns" (2025-11-21)** [S] https://blog.yossarian.net/2025/11/21/We-should-all-be-using-dependency-cooldowns
  - Of 10 prominent supply-chain attacks, **8 had windows of opportunity under a week**. A 7-day cooldown would have blocked most.
  - Cooldowns are "free, easy, and incredibly effective".
- **OpenSSF Concise Guide (developing)**, item 8 [V]: "Keep dependencies reasonably up-to-date after a cooldown… typically ~3 days… cooldowns counter the vast majority of malicious package releases (see cooldowns.dev)."
- **Security updates vs cooldown:** apply known-vulnerability fixes promptly (OpenSSF item 7 says "quickly update vulnerable dependencies" [V]). Use the package manager's exclude list or a manual override for a specific CVE fix, after checking the fix release's provenance.

### C10. Install hygiene — reference configs (as of 2026-09; verify flags against current docs)

`.npmrc` (npm ≥ 11.10) [V lirantal; S npm]:
```ini
ignore-scripts=true      # no lifecycle scripts from dependencies (also blocks your own `prepare` — run needed scripts explicitly)
allow-git=none           # reject git-sourced deps
min-release-age=3        # days; OpenSSF ~3, Woodruff 7, lirantal suggests up to 30
```
`pnpm-workspace.yaml` (pnpm 10.26+ / 11):
```yaml
minimumReleaseAge: 4320        # minutes (3 days); pnpm 11 default is 1440
minimumReleaseAgeExclude: []   # add a package only for an urgent, verified security fix
trustPolicy: no-downgrade
allowBuilds:                   # explicit allow-list for build scripts
  esbuild: true
strictDepBuilds: true
blockExoticSubdeps: true
```
CI:
- `npm ci` / `pnpm install --frozen-lockfile` / `yarn install --immutable --immutable-cache` / `bun install --frozen-lockfile` / `deno install --frozen` [V lirantal].
- Never run `npm install` or `npm update` in CI [V OSSF npm guide: `npm install`, `npm update`, `npx` "do not treat the lock file as read-only"].
- Least-privilege `permissions:` in GitHub Actions (`contents: read`) [V OSSF npm guide].
- **Pin third-party actions to a full 40-char SHA** with a version comment. Renovate `helpers:pinGitHubActionDigests` keeps them updated [V].
- (GitHub added an Actions policy to enforce SHA pinning / block actions in 2025-08 [M, unverified this session].)
- Lockfile integrity: `lockfile-lint` to ensure `resolved` URLs point only at your registry over https, which prevents lockfile injection [V lirantal §5].
- Anti-pattern: blind `npm update` / `npx npm-check-updates -u` [V lirantal §7].
- Agent sandboxing: run installs in a devcontainer or sandbox without access to `~/.ssh`, cloud credentials or `.env` secrets [V lirantal §9–10 headings; OSSF malicious code check].

### C11. Lockfiles, pinning and reproducibility

- **Applications (not libraries) use lockfiles** that include cryptographic hashes. Be as specific as the ecosystem supports [V OSSF Simplifying Updates #4]. Commit the lockfile.
- **npm specifics** [V OSSF npm guide]:
  - `package-lock.json` pins every direct and transitive dep with an `integrity` hash, but it is **not published**, so library consumers resolve their own versions.
  - `npm-shrinkwrap.json` **is** published. Use it only for standalone CLIs where the author takes responsibility for the whole tree.
  - `npm ci` treats the lockfile as read-only.
- **Ranges in manifests:**
  - Apps can pin exact versions (Renovate `js-app`).
  - **Libraries use ranges** for runtime deps (so consumers can dedupe and patch) and pin devDeps (Renovate `js-lib`) [V Renovate presets].
- **Other ecosystems** [M]:
  - Python: `uv.lock` / `poetry.lock` / `pip-tools` with `--generate-hashes` + `pip install --require-hashes`.
  - Go: `go.sum` + checksum DB (sum.golang.org); modules are immutable, and minimal version selection makes builds reproducible without a separate lockfile.
  - Rust: `Cargo.lock` (commit it for binaries; the Cargo team now also recommends committing it for libraries [M]).
  - Swift: `Package.resolved`. Gradle: dependency locking + verification-metadata.xml. CocoaPods: `Podfile.lock`.
- **Vendoring** (copying deps into the repo: Go `vendor/`, checked-in `node_modules` is rare):
  - Pros: builds survive registry outages/unpublishes, reviewable diffs.
  - Cons: repo bloat, and updates are manual, so vulns are easy to miss.
  - OpenSSF: projects that vendor must **issue their own advisory** (with the upstream CVE ID) when updating a vendored dep for a vuln [V] https://best.openssf.org/Vendored-Dependencies-Guide
  - Don't maintain downstream forks. Upstream changes instead [V OSSF #10].

### C12. Update strategy (agent-ready)

1. Automate with Renovate or Dependabot. **Group** related updates (e.g. all `@types/*`, a monorepo's packages, lint toolchain) to cut PR noise. Schedule non-security updates weekly.
2. Apply a **cooldown** of 3–7 days for non-security updates (C9). Security patches go fast but are verified.
3. **Automerge** only patch/minor updates of devDependencies (or well-tested runtime deps) when CI passes. Majors always get human review with changelog notes.
4. Run the full test suite on every dependency change [V OSSF #6].
5. Watch for **new transitive dependencies** in lockfile diffs. The axios attack's only visible change was a new dependency [S]. Review lockfile diffs for unexpected additions, new install scripts and non-registry URLs.
6. Keep reasonably current, because old versions make urgent security upgrades hard [V OSSF #8]. Pick a policy like "no dependency more than one major behind".
7. Remove unused dependencies periodically (knip/depcheck).

### C13. Typosquatting and slopsquatting (AI-hallucinated package names)

- **Typosquatting**: near-miss names (`crossenv` vs `cross-env`) and case variants (`JSONStream` vs `jsonstream`, uppercase was historically allowed). npm no longer permits non-ASCII names in the public registry, so homoglyph attacks there are limited. **npm org names are first-come-first-served**, with no verification [V OSSF npm guide].
- **Slopsquatting** (term coined by Seth Larson): attackers register package names that LLMs hallucinate [V OSSF AI guides].
  - Spracklen et al. (USENIX Security 2025, "We Have a Package for You!"): 2.23M generated package references, of which **440,445 (19.7%) were hallucinations**, covering **205,474 unique non-existent names** [V via OSSF citation] https://arxiv.org/abs/2406.10279
  - The same research found 3 of 4 models could detect their own hallucinations with >75% accuracy. That makes self-checking a worthwhile agent step [V OSSF citation].
- **OpenSSF AI-assistant instructions** [V] https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions:
  - "Use popular, community-trusted libraries… avoid adding obscure dependencies if a standard library or well-known package can do the same job. Do not add dependencies that may be malicious or hallucinated."
  - "Always use the official package manager… rather than copying code snippets."
  - Pin GitHub Actions to specific SHAs.
- **Agent verification protocol before `install`:**
  1. Confirm the package name from an authoritative source: the project's official docs/repo README, or the registry page linked from the repo. Don't rely on memory.
  2. Query the registry (`npm view <name> repository.url time.created maintainers dist-tags`, `pip index versions <name>`, `go list -m -versions <mod>`) and check that the repo URL matches, the creation date is not recent, and downloads are plausible.
  3. If the name is similar to a more popular package, stop and ask.
  4. If the registry says the package does not exist, **do not** pick a similarly named substitute. Tell the user.
  5. Install with scripts disabled (`--ignore-scripts`) and inspect the lockfile diff.

### C14. Maintenance and abandonment signals

- **Healthy** [V OSSF]:
  - Commits and a release within 12 months.
  - More than one maintainer (org-backed ideally).
  - Responsive issues/PRs; security policy (`SECURITY.md`).
  - Scorecard score; OpenSSF Best Practices badge.
  - Deps kept current; CI tests; semver discipline; a documented breaking-change policy.
- **Warning signs:**
  - Deprecated flag on the registry.
  - Archived repo.
  - Last release several years ago with open security issues.
  - A sole maintainer who recently transferred ownership. The event-stream pattern [V lirantal fn] and the axios attacker's account email change [S] are both examples.
  - Sudden new dependencies or install scripts in a patch release.
  - Obfuscated code.
  - Mismatch between registry tarball and repo source.
- "Finished" small libraries with no recent commits can be fine if they have zero deps, no open security issues and a stable API. **Judge by risk surface, not recency alone** [synthesis].
- Renovate `abandonments:recommended` flags packages with no releases for a long time [V preset name; threshold M].
- Tools: deps.dev, OpenSSF Scorecard (`scorecard --repo=...` or the Scorecard Action), Socket.dev, Snyk Advisor, `npm audit` / `pnpm audit`, `osv-scanner`, `govulncheck` (reachability-aware) [V OSSF / M].

### C15. Licences (not legal advice; label as such in skills)

| Licence family | Examples | Obligation when you use it | Agent default |
|---|---|---|---|
| Permissive | MIT, BSD-2/3, ISC, Apache-2.0 (adds explicit patent grant + NOTICE file) | Keep copyright/licence notice (and NOTICE for Apache) | OK |
| Weak copyleft | MPL-2.0 (file-level), LGPL (library-level; dynamic linking usually OK) | Changes to those files/that library must be shared under the same licence | OK with care; ask for static linking/bundling in proprietary mobile apps |
| Strong copyleft | GPL-2.0/3.0 | Distributing a combined work requires releasing it under the GPL | **Ask the user** before adding to proprietary distributed software |
| Network copyleft | AGPL-3.0 | Also triggered by letting users interact with it **over a network** (SaaS) | **Ask the user**; many companies ban it |
| Source-available / non-OSI | SSPL, BUSL, Elastic License, "Commons Clause" | Usage restrictions (competing services, production use) | Ask the user |
| **No licence** | Repo without LICENSE | All rights reserved by default: you may not legally reuse it | Don't copy or depend |

- [M] Sources: https://choosealicense.com/licenses/ · https://www.gnu.org/licenses/why-affero-gpl.html · https://opensource.org/licenses
- OpenSSF: "Verify that every component has a license, that it's a widely-used OSI license… Projects that won't provide clear license information are less likely to follow other good practices" [V].
- **Copying code** (Pike's "little copying") still carries the licence. Keep the notice and attribution in the file or in a THIRD_PARTY/CREDITS file. For this repo, CLAUDE.md rule 6 requires crediting permissive sources in `CREDITS.md`.
- Automate: licence checkers (`license-checker`, `pip-licenses`, `go-licenses`, ScanCode, FOSSA/Snyk) and SBOM licence fields [M].

### C16. SBOM, provenance, Scorecard, SLSA

- **SBOM**: publish and consume in **SPDX** or **CycloneDX** format to inventory components, find known vulns and spot licence issues [V OSSF #18]. Generators include `npm sbom` (npm ≥ 10.?) [M], `syft`, `cdxgen`, and GitHub's dependency graph export [M].
- **Provenance / signing**:
  - npm provenance and trusted publishing (C9).
  - Sigstore `cosign` for containers/artifacts [V OSSF #13].
  - SLSA levels for build integrity [V OSSF #17].
  - Consumers: `npm audit signatures`, and pnpm `trustPolicy: no-downgrade` [V].
- **OpenSSF Scorecard** checks repos for branch protection, pinned dependencies, token permissions, dangerous workflows, CI tests, fuzzing, signed releases and more. Use it both for evaluating deps and for improving your own repo [V OSSF].
- **EU Cyber Resilience Act** pressures SBOMs and vulnerability handling for products sold in the EU. OSSF has a brief guide [V file exists: CRA-Brief-Guide-for-OSS-Developers.md; details not read].

### C17. Wrapping third-party dependencies (anti-corruption layer)

- **Why:** confine a vendor's model, errors and quirks to one module. That enables swapping, focused integration tests, and "only mock types you own" (A11). It also implements Cox's "abstract it" and GRASP's Protected Variations.
- **Wrap** (define our own narrow interface in *our* domain terms):
  - External SaaS SDKs: payments, email/SMS, LLM providers, analytics, storage, search, feature flags.
  - Libraries used across many call sites with a churny API: date libraries, HTTP clients with auth/retry policy.
  - Anything with a plausible second implementation or a test fake.
- **Don't wrap:**
  - Frameworks you build *in* (React, Rails, Django, Spring, SwiftUI, Compose). Wrapping them only adds shallow indirection.
  - Language-level utilities.
  - Libraries used in exactly one place, where the call site is already the adapter.
  - Anything where the wrapper would just mirror the vendor API 1:1. That is a shallow module (Ousterhout); if you do wrap, **narrow** the interface.
- **Shape of a good adapter:**
  - Our types in, our types out.
  - Vendor errors translated into our error taxonomy.
  - Retries/timeouts/idempotency keys set once.
  - Config injected.
  - One integration test against sandbox/live, plus a fake implementing the same interface for unit tests (contract test, A5).
- **Hyrum caveat:** an adapter does not make migration free. Zakirullin's 10-month storage migration came from behavioural assumptions, not interfaces [V]. Document behavioural assumptions (ordering, consistency, rate limits) in the adapter's interface comment.

### C18. A dependency budget per project

A synthesis proposal. No canonical source prescribes numbers; phrase it in skills as a practice, not a standard.
- Keep a short **dependency policy** in the repo (e.g. `docs/dependencies.md` or an ADR). Envoy's documented criteria for new external dependencies is an example [V OSSF npm guide link] https://github.com/envoyproxy/envoy/blob/main/DEPENDENCY_POLICY.md
- The policy should define:
  - Allowed/forbidden licences.
  - Cooldown days.
  - Who approves new runtime deps.
  - The "one library per job" rule: one HTTP client, one date lib, one validation lib, one test runner.
  - Install-script allow-list.
  - Front-end bundle budget (e.g. max KB gzipped per route, enforced by `size-limit` or bundler budgets).
- Track counts over time: direct runtime deps, total transitive packages, packages with install scripts. Alert on step increases in the lockfile diff (CI check).
- For **libraries**: aim for zero runtime deps where feasible (lirantal §14 [V]). Peer-depend on frameworks rather than bundling them.

### C19. Agent rules — dependencies

1. **Native first, then existing deps, then own code for trivial logic, then a new package.** State which rung you stopped at and why.
2. **Never add a package whose existence and identity you haven't verified** in the registry and linked repo (slopsquatting defence). Never "try another similar name" when an install fails.
3. **Ask before adding** any new runtime dependency to an existing project, unless the user asked for that specific library. Always ask for copyleft, non-OSI, install-script, or <cooldown-age packages.
4. **One library per job.** Don't add a second library for something already covered (dates, HTTP, validation, state, CSS).
5. Install with the project's package manager and lockfile. Use frozen-lockfile/`ci` modes in CI. Never commit a manifest change without the matching lockfile change.
6. Keep install scripts disabled, and add to the allow-list only for known native-build packages (esbuild, sharp, etc.) with user approval.
7. Put new vendor SDKs behind a narrow adapter in our domain terms. Don't wrap frameworks.
8. Pin GitHub Actions to commit SHAs. Set least-privilege `permissions`. Never echo secrets.
9. When inlining a micro-utility, write tests for edge cases, and keep licence attribution if code was copied.
10. When upgrading: respect cooldowns, read changelogs for majors, run the full test suite, and inspect the lockfile diff for new transitive packages or scripts.
11. Remove dependencies made unused by your change in the same PR.
12. Report every dependency change in the final summary: added/removed/upgraded, reason, signals checked.

---

## Appendix — Sources consulted this session

Cloned/raw primary sources [V]:
- johnousterhout/aposd-vs-clean-code — https://github.com/johnousterhout/aposd-vs-clean-code
- zakirullin/cognitive-load (CC-BY-4.0) — https://github.com/zakirullin/cognitive-load
- cmuratori/misc (cleancodeqa.md, cleancodeqa-2.md) — https://github.com/cmuratori/misc
- es-tooling/module-replacements (e18e) — https://github.com/es-tooling/module-replacements
- ossf/wg-best-practices-os-developers (Concise Guides, Simplifying Updates, Vendored Deps, AI assistant guides) — https://github.com/ossf/wg-best-practices-os-developers
- ossf/package-manager-best-practices (npm.md) — https://github.com/ossf/package-manager-best-practices
- lirantal/npm-security-best-practices — https://github.com/lirantal/npm-security-best-practices
- renovatebot/renovate presets — https://github.com/renovatebot/renovate/tree/main/lib/config/presets/internal
- golang/wiki CodeReviewComments; go-proverbs — https://go.dev/wiki/CodeReviewComments · https://go-proverbs.github.io
- pkardas/notes Tidy First — https://github.com/pkardas/notes/blob/master/books/tidy-first.md
- charlax/professional-programming — https://github.com/charlax/professional-programming
- dwmkerr/hacker-laws — https://github.com/dwmkerr/hacker-laws

Search-verified [S]: chalk/debug (StepSecurity, Vercel, Semgrep), Shai-Hulud 2.0 (Datadog, Wiz, PostHog), tj-actions (Wiz, CISA via reports), GitHub npm plan (github.blog), npm min-release-age (npm/cli PR #8965, changelog), pnpm 11 defaults (pnpm.io blog, Socket), axios 2026 (Microsoft, Google GTIG, Datadog), Woodruff cooldowns, pip 26.1 (InfoQ), Temporal status (Socket, Bryntum, InfoQ), URLPattern Baseline (web.dev), node:sqlite stability (nodejs.org docs, reports), Sandi Metz rules (thoughtbot), Nothing is Something (conference notes), Tidy First (O'Reilly), Muratori 2023 (computerenhance), tef, Belshee, Henney, Carmack, Bernhardt Boundaries, Hillel Wayne, Brian Will, Sean Parent, Russ Cox.

Memory-only [M], to verify before quoting: Kay email text, POODR quotes, Clean Code ch.6 specifics, GOOS phrasing, Fowler bliki specifics (AnemicDomainModel, TellDontAsk caveat, Design Stamina "weeks not months"), Seemann, Hevery, Acton's "lies" list, Yegge, Hickey's table, Spolsky, Abramov, grug specifics, Semantic Compression quote, left-pad details, language-specific idiom claims, GitHub Actions SHA-pinning policy date, uv/Cargo lock specifics, `npm sbom` version.
