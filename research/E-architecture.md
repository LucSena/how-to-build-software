# E. Architecture, Design Patterns, Clean Code & Scalability — Research Notes for Agent Skills (2026)

Purpose: raw material for writing SKILL.md files that steer AI coding agents toward sound architecture, clean code, and scalable, reliable systems. Everything is phrased as **actionable rules**, **decision tables**, **checklists**, and **numbers**. Sources at the end (§12). Confidence markers: facts from specs/primary sources are stated plainly; claims from secondary 2026 blog posts are marked "(reported)".

---

## 0. How existing agent-skill repos approach this (competitive analysis)

Cloned and read (Sept 2026): `anthropics/skills`, `obra/superpowers`, `wondelai/skills`, `keez97/claude-architecture-skills`, `nathankim0/clean-architecture-skills`, `45ck/software-architecture-skills`, `yonatankarp/software-design-skills`, `joelparkerhenderson/architecture-decision-record` (now ships `skills/architecture-decision-record-skill`).

| Repo | Shape | Strengths | Weaknesses to avoid |
|---|---|---|---|
| anthropics/skills (skill-creator) | Canonical format: `SKILL.md` with YAML `name` + `description`; optional `scripts/`, `references/`, `assets/`. Progressive disclosure: metadata (~100 words) always in context; body <500 lines; references loaded on demand; >300-line references need a TOC | Official spec; "descriptions should be a little pushy" because models under-trigger | n/a (it's the reference) |
| obra/superpowers (writing-skills) | Process skills (TDD, debugging, planning) | Key insight: **description must describe ONLY triggering conditions ("Use when…"), not summarize the workflow** — agents that see a workflow summary in the description follow the summary and skip the body. Third person. Token efficiency: frequently-loaded skills <200 words. Tests skills against subagents ("TDD for skills") | Process-heavy, little domain content |
| wondelai/skills | One skill per book (clean-code, clean-architecture, software-design-philosophy, ddia-systems, release-it, refactoring-patterns, domain-driven-design, working-with-legacy-code…), ~200 lines each + `references/` | Book-grounded; **scoring rubric (x/10) with "quick diagnostic" rows**; cross-links ("for architecture boundaries, see clean-architecture"); trigger phrases enumerated in description | Book-by-book split duplicates content across skills; agent must pick the "right book" |
| keez97/claude-architecture-skills | 7 large skills (400–560 lines) + an `architecture-workflow` that chains them | End-to-end workflow; tradeoff-first tone ("trade-offs, not dogma") | Long bodies; heavy general prose |
| nathankim0/clean-architecture-skills | 2 plugins (clean-architecture review, kent-beck-style) | Review checklists, ASCII diagrams of the dependency rule | Uncle-Bob-centric; little critique of when *not* to apply |
| 45ck/software-architecture-skills | 14 tiny (68-line) skills with frontmatter `purpose/inputs/outputs/handoffs`; mirrored into `.claude/skills` and `.agents/skills` | Explicit **handoffs** between skills, "failure modes to avoid" section, minimal output skeleton, multi-agent-directory portability | Templated/generic; no concrete numbers or code |
| yonatankarp/software-design-skills | ~60 micro-skills: `gof-*`, `ddd-*`, `arch-*` (incl. `arch-fitness-functions`, `arch-strangler-fig`), `kp-*` (Kotlin) + `*-identify`/`*-review` router skills | Each pattern has **"When NOT to use"** + "Anti-patterns" + "Decision heuristics" (e.g., gof-singleton says "default: don't introduce one in 2026 code") | Very fine-grained → trigger collisions; Kotlin-centric |
| joelparkerhenderson ADR skill | Single-purpose: decide if ADR needed → find dir → name file → pick template (table of 11 templates) → fill | Great "decide whether this deserves an ADR at all" gate; follow existing repo conventions first (`git ls-files | grep -iE '(adr|decisions?)'`) | Narrow |

**Implications for our repo design**
1. Descriptions = trigger conditions + keywords, third person, "Use when…"; no workflow summary. Include symptom words agents actually see ("god file", "N+1", "slow query", "should this be a microservice", "add caching", "retry").
2. Body = decision tables + hard rules + checklists + "when NOT to" + common agent mistakes; push long catalogs (GoF, smells, Postgres migration recipes) to `references/`.
3. Every pattern gets: *problem it solves → modern idiom in TS/Python/Kotlin/Swift → when NOT to use → red flags*.
4. Prefer a small number of **routing skills** (e.g., `architecture-decisions`, `clean-code`, `reliability`, `api-design`, `data-and-scaling`, `ai-native-apps`, `frontend-architecture`) with deep references, over 60 micro-skills (trigger collisions) or book-per-skill (duplication).
5. Include a **"match existing codebase conventions first"** rule in every skill (the ADR skill does this well) — agents otherwise impose textbook structures on existing repos.
6. Include measurable gates (numbers) — generic "consider scalability" prose is what the weak repos have.
7. Consider a scoring/diagnostic rubric for review-mode (wondelai), and handoffs between skills (45ck).

---

## 1. Clean Code

### 1.1 Meta-principle: complexity is the enemy (Ousterhout)
- Complexity = anything that makes a system hard to understand and modify. Symptoms: **change amplification**, **cognitive load**, **unknown unknowns** (worst). Causes: **dependencies** and **obscurity**. Complexity is incremental — "death by a thousand cuts" — so every change matters.
- **Strategic vs tactical programming**: tactical = "get it working" (the "tactical tornado"); strategic = working code is not enough, invest ~10–20% in design. Agents are tactical by default — skills must push strategic behavior *within the scope of the task* (not gold-plating).
- Rule for agents: before finishing, ask "did this change increase or decrease the complexity a future reader must hold in their head?"

### 1.2 Naming
Rules:
- Names reveal intent and units: `retryDelayMs`, `numBytesReceived`, `isEligibleForRefund`, not `n`, `data`, `tmp`, `handle`, `process`, `manager`, `util`.
- Same concept → same word across the codebase (don't mix `fetch/get/retrieve/load` for the same operation). Use the domain's ubiquitous language (DDD).
- Booleans: `is/has/can/should` prefixes; avoid negatives (`isNotDisabled`).
- Functions = verbs (`calculateInvoiceTotal`), types/classes = nouns; avoid `Manager/Processor/Helper/Utils` — they signal low cohesion.
- Name length proportional to scope: `i` fine in a 3-line loop; exported symbols need full names.
- Searchable constants instead of magic numbers (`const MAX_UPLOAD_BYTES = 10 * 1024 * 1024`).
- Ousterhout red flag: **"hard to pick a name"** → the thing probably doesn't have a clean design.
- Follow language idioms: `snake_case` (Python, PEP 8), `camelCase` (TS/JS/Kotlin/Swift members), `PascalCase` types; Swift API Design Guidelines (clarity at the point of use, omit needless words, fluent argument labels).

### 1.3 Functions
- Do one thing at one level of abstraction; but **don't fragment**: Ousterhout warns against over-splitting into many shallow functions ("classitis"/"conjoined methods" — you can't understand one without reading the other). Heuristic: extract when the extracted piece has a clean name *and* a simple interface, or is reused, or is independently testable.
- Parameters: ≤3 ideally; >3 → parameter object / options object with named fields. No boolean flag params that switch behavior (`render(true)`) — split into two functions or use an enum.
- Command–query separation: a function either changes state or returns data, not both (exceptions: `pop`, idempotent upserts returning the entity).
- Minimize side effects; keep I/O at the edges ("functional core, imperative shell" — Gary Bernhardt).
- Early returns / guard clauses over nested `if` pyramids.
- Pure functions for business rules → trivial to test.
- No hidden temporal coupling (`init()` must be called before `run()`) — enforce with constructors/types.

### 1.4 Comments & docs
- Comments explain **why** (intent, constraints, trade-offs, links to incidents/tickets), not **what** (Google eng-practices: "comments… explain why some code exists, and should not be explaining what some code is doing").
- Ousterhout nuance: **interface comments** (what a module/function promises, preconditions, units, error behavior) are design documentation and valuable; write them *first* ("comments-first design") to detect bad abstractions.
- Delete commented-out code (git has history). No changelog comments inline.
- TODOs must carry an owner/ticket.
- AI-specific: agents over-comment ("// increment counter"), narrate changes ("// updated to use new API"), and leave stale docstrings. Rule: no comments restating code; no references to the conversation/task in comments.

### 1.5 Error handling
Rules:
- **Never swallow errors** (`catch {}` / `except: pass`). Either handle (recover with a defined behavior), translate (wrap with context and rethrow), or propagate.
- Handle errors at the layer that can make a decision; lower layers add context (`cause`/`from e`/`%w`).
- Distinguish **expected domain failures** (validation, not found, insufficient funds → return typed results: `Result`/`Either`, sealed classes in Kotlin, Swift `Result`/`throws` with typed errors, discriminated unions in TS) from **unexpected faults/bugs** (exceptions/panics → crash the request, log with stack, alert).
- Ousterhout: **"define errors out of existence"** — design APIs so the error case can't happen (e.g., `delete` of missing key is a no-op; `substring` clamps indexes) — reduces exception handling burden. Also "mask exceptions at low level" and "aggregate exception handling" into one handler.
- Validate at trust boundaries (HTTP handlers, message consumers, file/env input, LLM output) with schema validators (Zod/Valibot, Pydantic, kotlinx.serialization + validation), then pass **parsed, typed** values inward ("parse, don't validate" — Alexis King).
- Fail fast on startup for missing config/secrets.
- Never leak stack traces/internal messages to API clients; map to RFC 9457 problem details (§5).
- Log once at the boundary, not at every layer (avoid duplicated log noise).
- Resource cleanup: `try/finally`, `with`, `use {}`, `defer`, `using` (TS 5.2+ explicit resource management).
- Async: every Promise awaited or explicitly handled; no floating promises (lint: `@typescript-eslint/no-floating-promises`); Python `asyncio.TaskGroup` for structured concurrency; Kotlin coroutines structured concurrency (no `GlobalScope`).

### 1.6 Immutability & state
- Default to immutable data (`const`, `readonly`, `val`, `let` in Swift, `@dataclass(frozen=True)`, Kotlin `data class` with `val`, records). Mutate locally only when it's a measured performance need.
- Make illegal states unrepresentable: discriminated unions/sealed hierarchies instead of bags of optional fields + booleans (`status: 'loading'|'error'|'success'` with per-state data).
- Value objects for domain primitives (Money with currency, EmailAddress, UserId branded types) — but only where there are invariants (see domain-driven-hexagon warning: in CRUD apps, wrapping every primitive is boilerplate).
- Minimize shared mutable state; if shared, own it in one place with a clear API (actor, store, repository).

### 1.7 SOLID — with critique
| Principle | Useful kernel | Critique / when it misleads | Agent rule |
|---|---|---|---|
| SRP ("one reason to change" — i.e., one actor/stakeholder) | Separate code that changes for different reasons | Misread as "one method per class" → classitis, shallow modules | Group by reason-to-change, not by size; prefer fewer, deeper modules |
| OCP | Extension points where variation is *known* | Speculative extension points = YAGNI violation | Add plug points only for variation that exists (≥2 real cases) |
| LSP | Subtypes must honor contracts | Mostly argues against inheritance hierarchies | Prefer composition; sealed types; don't override to throw `NotImplemented` |
| ISP | Small, client-specific interfaces | Can explode into 1-method interfaces everywhere | In TS/Go/Python use structural typing/Protocols defined at the consumer |
| DIP | High-level policy doesn't depend on details; inject I/O | "Interface for every class" (IFooService with one impl) is ceremony | Introduce an interface at an **architectural boundary** (DB, network, clock, LLM) or when ≥2 impls exist; otherwise depend on the concrete class |

Critiques to cite: Dan North's CUPID (Composable, Unix philosophy, Predictable, Idiomatic, Domain-based) as "properties not principles"; Ousterhout's deep-modules view contradicts small-class dogma; domain-driven-hexagon: "SOLID can be incompatible with YAGNI and KISS… be pragmatic". Casey Muratori's "Clean Code, Horrible Performance" (2023) — polymorphism-heavy style can cost large constant factors in hot loops; relevant only for hot paths.

### 1.8 DRY vs WET/AHA, KISS, YAGNI
- **DRY** is about *knowledge*, not text (Pragmatic Programmer): the same business rule in two places is bad; two similar-looking lines that encode different rules are fine.
- **The Wrong Abstraction** (Sandi Metz): "duplication is far cheaper than the wrong abstraction." When an abstraction accumulates parameters/flags for each caller, inline it back and re-extract.
- **AHA** (Kent C. Dodds: Avoid Hasty Abstractions) / **Rule of Three**: tolerate duplication until the 3rd occurrence *and* you understand the shape of variation. Dan Abramov "Goodbye, Clean Code" / "The WET Codebase".
- Tension with AI reality: GitClear data shows AI-era codebases have *too much* copy-paste (block duplication +81% vs 2023; refactoring/moved code down sharply). So the agent rule is two-sided:
  - Don't create a new abstraction for a one-off.
  - **Do** search the codebase for an existing helper/component before writing a new one (grep for similar names/logic) and reuse it. Never create `utils2.ts` / a parallel implementation.
- **KISS**: simplest thing that meets *current* requirements, including non-functional ones actually stated.
- **YAGNI** (Fowler): features/extension points for presumed future needs have cost of build, delay, carry, and repair. Google eng-practices: "solve the problem you know needs to be solved now… not the problem the developer speculates might need to be solved in the future."
- Counter-rule: YAGNI doesn't apply to things that are expensive to retrofit: security, data model/IDs, idempotency, observability hooks, migrations, API contracts, tenant isolation. ("It's easier to refactor over-design than no design" for these.)

### 1.9 Cohesion & coupling; deep modules
- High cohesion: things that change together live together (feature folders > type folders like `controllers/ services/ models/` at scale).
- Low coupling: modules interact through narrow, stable interfaces; no reaching into internals (enforce with public `index.ts`, Python `__all__`/leading underscore, Kotlin `internal`, Swift `internal`/`fileprivate`, package-private).
- Coupling taxonomy (connascence) — prefer weaker forms: name < type < meaning < position < algorithm < execution order < timing < identity. Strong connascence OK only within a module.
- **Deep module** = simple interface, powerful implementation (Unix file I/O: 5 calls hide enormous complexity). **Shallow** = interface nearly as complex as implementation (pass-through wrappers, one-line classes).
- **Ousterhout red flags** (use as a review checklist): Shallow Module; Information Leakage (same design decision in multiple modules); Temporal Decomposition (structure follows execution order, not information hiding); Overexposure (common use requires learning rare features); Pass-Through Method/Variable; Repetition; Special-General Mixture; Conjoined Methods; Comment Repeats Code; Implementation Documentation Contaminates Interface; Vague Name; Hard to Pick Name; Hard to Describe; Nonobvious Code.
- "Pull complexity downward": a module's implementer should absorb complexity rather than push config knobs/exceptions onto callers. Sensible defaults.
- "General-purpose modules are deeper" — "somewhat general-purpose": interface general enough for current uses without speculative features.

### 1.10 Code smells & refactoring catalog (Fowler, Refactoring 2nd ed., 2018, JS examples)
Smells (ch. 3): Mysterious Name · Duplicated Code · Long Function · Long Parameter List · Global Data · Mutable Data · Divergent Change (one module changed for many reasons) · Shotgun Surgery (one change touches many modules) · Feature Envy · Data Clumps · Primitive Obsession · Repeated Switches · Loops (→ pipelines) · Lazy Element · Speculative Generality · Temporary Field · Message Chains · Middle Man · Insider Trading · Large Class · Alternative Classes with Different Interfaces · Data Class · Refused Bequest · Comments (as deodorant).

Smell → refactoring map (put in `references/refactoring.md`):
| Smell | Refactorings |
|---|---|
| Long Function | Extract Function, Replace Temp with Query, Decompose Conditional, Split Loop |
| Long Parameter List | Introduce Parameter Object, Preserve Whole Object, Remove Flag Argument |
| Duplicated Code | Extract Function, Slide Statements, Pull Up Method |
| Divergent Change | Split Phase, Extract Class/Module |
| Shotgun Surgery | Move Function/Field, Combine Functions into Class/Transform, Inline Class |
| Feature Envy | Move Function |
| Data Clumps / Primitive Obsession | Introduce Parameter Object, Replace Primitive with Object (value object) |
| Repeated Switches | Replace Conditional with Polymorphism (or exhaustive `switch` on sealed type/union) |
| Speculative Generality | Collapse Hierarchy, Inline Function/Class, Remove Dead Code |
| Message Chains | Hide Delegate, Extract/Move Function |
| Middle Man | Remove Middle Man, Inline Function |
| Global/Mutable Data | Encapsulate Variable, Split Variable, Separate Query from Modifier |
| Loops | Replace Loop with Pipeline |

Refactoring rules for agents: refactor in **small behavior-preserving steps with tests green between steps**; separate refactoring commits from behavior changes ("make the change easy, then make the easy change" — Kent Beck); for legacy code without tests write **characterization tests** first (Feathers); use IDE/LSP-safe renames; prefer **Strangler Fig** / **Branch by Abstraction** / **Parallel Change (expand–contract)** for large changes over big-bang rewrites.

### 1.11 Testing strategy & test design
Shapes:
| Model | Emphasis | Best for |
|---|---|---|
| Test Pyramid (Cohn/Fowler) | Many unit, fewer integration/service, few E2E | Libraries, algorithmic/domain-heavy code |
| Testing Trophy (Kent C. Dodds) | Static analysis base (TS, lint) → some unit → **most integration** → few E2E. "Write tests. Not too many. Mostly integration." | Frontend & typical web apps |
| Honeycomb (Spotify) | Mostly integration tests of a service through its API, few implementation-detail tests | Microservices |

Agent rules:
- Test **behavior through public interfaces**, not implementation details; tests should survive refactoring (Beck: tests "sensitive to behavior, insensitive to structure").
- Arrange–Act–Assert; one behavior per test; descriptive names (`rejects_refund_after_30_days`).
- Deterministic: inject clock, randomness, IDs; no `sleep` — await conditions; hermetic (no shared state, no real network).
- **Don't mock what you don't own** — wrap third-party APIs in an adapter and fake the adapter; use real DB via Testcontainers / ephemeral Postgres for repository tests (mocks of SQL hide real bugs).
- Prefer fakes (in-memory implementations) over mocks for ports; use mocks for verifying interactions at boundaries only.
- Contract tests (Pact / schema-based) between services; snapshot tests only for stable serialized output.
- Property-based tests (fast-check, Hypothesis, Kotest) for parsers/serializers/invariants.
- Mutation testing (Stryker, mutmut, PIT) to check test effectiveness on critical modules.
- Coverage is a floor signal, not a goal; Google's code-review guide: "will the tests actually fail when the code is broken?"
- Agent-specific anti-patterns: weakening/deleting assertions to make tests pass, `skip`-ing failing tests, testing mocks instead of code, tests that re-implement the function's logic, catching the exception in the test to make it green. Hard rule: **never modify a test to pass without stating why the test was wrong.**
- TDD red–green–refactor is a strong fit for agents: the failing test is an executable spec that constrains hallucination (obra/superpowers TDD skill enforces "watch it fail first").

---

## 2. Design Patterns

### 2.1 General rules
- Patterns are vocabulary, not goals. Introduce a pattern only when the forcing problem is **present now** (≥2 concrete variants, or a boundary that must be swapped/tested).
- Norvig (1996): 16 of the 23 GoF patterns are "invisible or simpler" in languages with first-class functions, dynamic types, and macros. In 2026 TS/Python/Kotlin/Swift, many GoF patterns collapse to a function, a closure, a union type, or a language feature.
- Prefer composition over inheritance; inheritance max 1–2 levels; mark classes `final`/`sealed` by default (Kotlin classes are final by default; Swift `final`; TS: no `final` → prefer functions/composition).
- Every pattern in a skill: problem → modern idiom → when NOT → red flags.

### 2.2 GoF in modern languages
**Creational**
| Pattern | Modern idiom | Use when | Don't when |
|---|---|---|---|
| Factory Method / Abstract Factory | A function returning an interface/union; DI container provider; Kotlin companion `of()`; Swift static factory | Construction varies by runtime config/platform; need to hide concrete type | Only one concrete type — just call the constructor |
| Builder | TS/Python: options object / keyword args with defaults; Kotlin named + default args, `apply {}`, type-safe DSL builders; Swift memberwise init with defaults, result builders | Many optional params with validation, or staged/immutable construction (e.g., query builders, HTTP clients) | Kotlin/Python/Swift named/default args already solve telescoping constructors |
| Singleton | Module-level instance (ES modules/Python modules are singletons), Kotlin `object`, DI-scoped single instance | A genuinely single resource owned by the app (connection pool, logger sink), still injected | "Convenient global access" — hidden dependency, test pollution. Default: **don't** |
| Prototype | `structuredClone`, `copy()` on data classes, spread `{...obj}` | Cloning configured objects | Rarely needed as a named pattern |

**Structural**
| Pattern | Modern idiom | Use when | Don't when |
|---|---|---|---|
| Adapter | Thin wrapper module around a third-party SDK implementing *your* port interface | Isolating vendors (payments, LLM providers, email), anti-corruption layer | Wrapping your own code 1:1 (pass-through) |
| Facade | A module exporting a small API over a subsystem | Simplify a complex subsystem for most callers (deep module!) | It just forwards each call (shallow) |
| Decorator | Higher-order functions/middleware (Express/Koa/Hono middleware, Python decorators, Kotlin delegation `by`) | Cross-cutting: logging, retries, caching, auth, metrics | Stacking so many that control flow becomes invisible |
| Proxy | Lazy loading, caching proxy, remote proxy (RPC stubs), JS `Proxy` | Access control, lazy init, remote calls | Magic proxies that hide network calls from callers (latency surprise) |
| Composite | Recursive tree types (UI component trees, ASTs) | Part–whole hierarchies | Flat data |
| Bridge | Two independent dimensions via composition | Real 2-D variation (renderer × shape) | Speculative |
| Flyweight | Interning, object pools, memoization | Measured memory pressure with many identical objects | Premature |

**Behavioral**
| Pattern | Modern idiom | Use when | Don't when |
|---|---|---|---|
| Strategy | Pass a function / map of functions / union + `switch` | Runtime-selectable algorithms (pricing rules, retry policies) | Only one algorithm; class hierarchy for 2 lambdas |
| Observer | Event emitters, signals, RxJS/Flow/Combine, domain events | Decoupled notification within a process | Cross-service (use a message broker + outbox); when order/errors matter and hidden listeners obscure flow |
| Command | Serializable action objects/messages; job payloads; undo stacks; Redux actions | Queues, undo/redo, audit, retries | Direct calls suffice |
| State | Discriminated union + reducer; explicit state machine (XState, Kotlin sealed classes + `when`) | Workflow/lifecycle with ≥3 states and guarded transitions (orders, uploads, auth flows) | Two booleans |
| Template Method | Higher-order function with hooks | Fixed algorithm with variable steps | Deep inheritance to customize |
| Chain of Responsibility | Middleware pipelines | Request processing pipelines, validation chains | When a simple list of checks is clearer |
| Iterator | Built-in (generators, `Sequence`, `AsyncIterable`) | Always use language iterators/streams | Custom iterator classes |
| Visitor | Exhaustive pattern matching on sealed types / unions (`when`, `switch` with `never` check, Python `match`) | ASTs/compilers | Most business code |
| Mediator | Orchestrator/service coordinating collaborators; MediatR-style dispatch | Many-to-many interactions | Mediator becomes a god object or indirection-only bus |
| Memento | Snapshots of immutable state | Undo, drafts | — |
| Interpreter | Parser + AST | DSLs | Use an existing parser/lib |

### 2.3 Enterprise/architecture patterns commonly misused by agents
- **Repository**: good as a port for aggregates in domain-rich code; bad as a generic `IRepository<T>` wrapping an ORM that already is a repository/unit-of-work (EF Core, Prisma, SQLAlchemy session). Don't hide query capability behind a lowest-common-denominator interface.
- **Service layer** named `XService` with pass-through methods to repositories = shallow module.
- **DTO ↔ Entity ↔ Persistence model mapping** triplication: justified only when domain model differs meaningfully from storage/API.
- **Dependency injection**: constructor injection is enough; containers are optional (TS: plain factories; Python: FastAPI `Depends`; Kotlin: Koin/Hilt; Swift: init injection/Environment).
- **Service locator**: anti-pattern (hidden dependencies).
- **Specification/Unit of Work/CQRS mediators** in CRUD apps: ceremony.

### 2.4 Functional patterns (all four languages support them)
- Pure core, effects at edges; pipelines (`map/filter/reduce`, Kotlin sequences, Swift `lazy`); immutable updates.
- Algebraic data types: TS discriminated unions + exhaustive `switch` with `const _: never = x`; Kotlin `sealed interface`; Swift `enum` with associated values; Python `match` + dataclasses/`Literal` unions.
- `Result`/`Either` for expected failures (Kotlin `Result`/Arrow `Either`, Swift `Result`, TS neverthrow/Effect or hand-rolled union, Python returns lib or tuples) — don't mix styles within a module.
- Option/null safety: Kotlin `?`, Swift optionals, TS `strictNullChecks`, Python `Optional` + mypy/pyright strict.
- Composition of small functions; currying/partial application sparingly (readability).
- Memoization for pure expensive functions.
- Effect systems (Effect-TS, Arrow, ZIO-style) — powerful but steep; adopt only team-wide.

### 2.5 Frontend / React patterns (2026)
- **Composition over configuration**: `children`/slots, compound components (`<Tabs><Tabs.List/>…`), render props only when needed; avoid mega-components with 30 boolean props.
- **Headless components** (Radix, React Aria, Ark, TanStack Table) + design-system styling.
- **Custom hooks** for reusable stateful logic; hooks do one thing; name `useX`.
- **"You Might Not Need an Effect"** (react.dev): derive state during render instead of syncing with `useEffect`; effects only for synchronizing with external systems. Agents overuse `useEffect` + `useState` for derived data and data fetching.
- **Server state ≠ client state**: TanStack Query/SWR/RSC for server data (cache, dedupe, revalidate); small client store (Zustand/Jotai/Context) for UI state; URL as state for filters/pagination.
- **State machines/statecharts** (XState or reducer with union states) for multi-step flows, wizards, upload/payment states; eliminates impossible states.
- **Colocation**: keep state, styles, tests next to where they're used; lift only when shared.
- **React Compiler** (v1.0, Oct 2025) auto-memoizes → stop sprinkling `useMemo/useCallback/memo` by default; memoize only after profiling or where the compiler is not enabled.
- **Server Components (RSC)**: server by default, `"use client"` at the leaves (interactive islands); pass serializable props; fetch data in server components close to where it's used, parallelize with `Promise.all`, stream with `<Suspense>`; avoid request waterfalls.
- **Server Actions / Functions are public HTTP endpoints**: always authenticate, authorize (ownership), and validate input (Zod) inside each action; never trust hidden form fields. Put DB access behind a server-only data-access layer (`import 'server-only'`), return DTOs not raw rows (avoid leaking columns to the client). Keep React/Next patched — CVE-2025-55182 "React2Shell" (CVSS 10.0, pre-auth RCE via RSC Flight protocol deserialization; fixed in react-server-dom-* 19.0.1/19.1.2/19.2.1+; on CISA KEV Dec 2025).
- Accessibility & performance budgets are architecture: Core Web Vitals targets LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (p75).

### 2.6 Anti-patterns catalog (for review skills)
God object/god file · Big Ball of Mud · Anemic domain model (only when domain is rich — CRUD is fine anemic) · Distributed monolith (services that must deploy together, share DB, chatty sync calls) · Golden hammer · Lava flow (dead experimental code) · Poltergeist classes (short-lived pass-through objects) · Boat anchor (unused code "for later") · Copy-paste programming · Magic numbers/strings · Primitive obsession · Singletonitis · Inner-platform effect (building a generic engine/config language inside the app) · Premature optimization and premature generalization · Shared mutable global state · Stringly-typed code · Exceptions for control flow · Circular dependencies · Leaky abstraction · Sequential coupling · Callback hell / floating promises · "Utils" dumping grounds.

---

## 3. Architecture

### 3.1 First questions (agent must answer before proposing structure)
1. What exists? Follow the existing architecture and conventions unless the user asked to change them. Inspect folder structure, lint rules, ADRs (`docs/adr`, `decisions/`), `CLAUDE.md`/`AGENTS.md`.
2. What are the **quality attribute drivers** (latency, throughput, availability, consistency, security, cost, time-to-market, team size)? Write them as scenarios ("p95 < 300 ms at 200 rps") — ATAM-style.
3. How complex is the domain? CRUD/data-centric vs rich business rules.
4. Team topology: how many teams/devs? (Conway's law — architecture mirrors communication structure; Team Topologies' "inverse Conway maneuver".)
5. Expected scale in 12–24 months (not 10 years).
6. Reversibility: is this a one-way door (data model, public API, vendor lock-in) or two-way door (internal module layout)? Spend design effort on one-way doors; record them in ADRs.

### 3.2 Style decision table
| Style | Choose when | Avoid when | Key rule |
|---|---|---|---|
| Simple layered / MVC (controller → service → data) | CRUD-heavy apps, small team, little domain logic | Rich domain rules spread across services | Keep layers thin; no business logic in controllers or SQL scattered in views |
| Hexagonal / Ports & Adapters (Cockburn) | Business logic must be tested without I/O; multiple adapters (HTTP + queue + CLI); vendor swaps plausible | Tiny scripts, CRUD glue | Domain/application core defines ports (interfaces); adapters implement them; dependencies point inward |
| Clean Architecture (Martin) / Onion | Same as hexagonal, larger codebases | Small projects — 4 layers × mappings = boilerplate | Dependency Rule: source dependencies point inward only; frameworks are details |
| Vertical Slice (Bogard) | Feature-oriented apps; many independent use cases; want to minimize cross-feature coupling | Heavy shared domain invariants across features | Organize by feature/use case (request → handler → data) end-to-end; share only what's genuinely shared; each slice may choose its own approach |
| Modular monolith | **Default for new products** (2026 consensus) — one deployable, strong internal module boundaries | Need independent scaling/deploy per component *today*, or many teams stepping on each other | Modules own their data (schema/tables), communicate via public APIs or in-process events; enforce boundaries with tooling |
| Microservices | Many teams (e.g., >5–8 teams) needing independent deploy cadence; components with radically different scaling/tech/runtime/compliance needs; mature platform (CI/CD, observability, on-call) | Startup/MVP, 1–3 teams, unclear domain boundaries, no platform engineering | Service per bounded context, database per service, async integration, contract tests, no shared DB |
| Event-driven (pub/sub, streaming) | Decoupled reactions, fan-out, audit/analytics streams, integration between contexts | Need immediate consistency & simple debugging; small systems | Events are facts in past tense; schemas versioned; at-least-once + idempotent consumers; outbox for publishing |
| CQRS | Read and write models differ drastically (complex queries/denormalized views vs. invariant-heavy writes), very asymmetric load | Typical CRUD — Fowler: "for most systems CQRS adds risky complexity" | Can be applied per module; start with separate query functions over same DB before separate stores |
| Event Sourcing | Audit/legal history is a core requirement, temporal queries, complex state reconstruction (ledgers) | Most apps; teams without experience; heavy GDPR erasure needs (needs crypto-shredding) | Events immutable & versioned (upcasting); snapshots; projections rebuildable |
| Serverless/FaaS | Spiky/low traffic, event glue, small teams | Long-running, latency-sensitive steady high load, heavy DB connection needs | Stateless handlers, pooled DB access (proxy/HTTP drivers), idempotent triggers |
| Cell-based architecture | Very large scale, blast-radius containment (AWS, Slack reported) | Everyone else | Partition customers into independent cells with a thin routing layer |

### 3.3 Modular monolith vs microservices (2026 consensus)
- Consensus: **start with a (modular) monolith; extract services only for concrete reasons** — independent scaling, independent deployment by separate teams, fault isolation, different runtime/compliance needs. Fowler "MonolithFirst" (2015) and "Microservice Prerequisites" (rapid provisioning, basic monitoring, rapid deployment) still hold.
- Evidence: Amazon Prime Video's video-quality-monitoring service moved from distributed serverless components to a single process and reported ~90% infra cost reduction (2023); Segment's "Goodbye Microservices" (2018); Shopify's modular monolith with Packwerk; (reported) CNCF 2026 survey: ~42% of orgs that adopted microservices consolidated some services.
- Microservices costs: network latency & partial failure, distributed transactions (sagas), eventual consistency, observability overhead, versioning, local dev complexity, infra cost, on-call load.
- **Distributed monolith** red flags: lockstep deploys, shared database, synchronous call chains >2–3 deep, shared "common" library with domain models, one change touches many services.
- Extraction path: modularize in place → enforce boundaries → give module its own schema → communicate via interface/events → extract (Strangler Fig) the module with the strongest scaling/ownership reason.
- Agent rule: **never propose microservices for a greenfield app, MVP, or single team unless the user explicitly requires it**; if asked, list prerequisites and costs first.

### 3.4 Modular monolith rules
- Module = bounded context/feature with: public API (facade/`index.ts`/`api` package), private internals, own tables (or schema), own tests.
- No cross-module DB joins/writes into another module's tables; read via the other module's API or a read model.
- Cross-module side effects via in-process domain events (can later go through a broker).
- Enforce: dependency-cruiser / eslint-plugin-boundaries / Nx module boundaries (TS), import-linter (Python), ArchUnit / Spring Modulith (JVM), Konsist (Kotlin), Packwerk (Ruby), Swift packages with explicit targets. Fail CI on violations and on cycles.

### 3.5 Hexagonal / Clean — practical layout
```
src/
  <module or feature>/
    domain/          # entities, value objects, domain services, domain events — no framework imports
    application/     # use cases / command & query handlers, ports (interfaces) for repos, clocks, gateways
    infrastructure/  # adapters: DB repositories, HTTP clients, queue publishers, LLM providers
    interface/       # HTTP controllers/routes, GraphQL resolvers, CLI, message consumers, DTOs + validation
```
Rules: domain imports nothing from infrastructure/interface or frameworks (ORM decorators in domain entities are a pragmatic, conscious exception — record in ADR); ports defined by the consumer (application); adapters tested with integration tests; use cases tested with fakes. For small apps collapse to `feature/{handler, service, repo}.ts`.

### 3.6 DDD essentials
Strategic (highest value, language-agnostic):
- **Subdomains**: core (competitive advantage → invest, custom model), supporting, generic (buy/use SaaS/libs — auth, payments, email).
- **Bounded context**: explicit boundary within which a model and its **ubiquitous language** are consistent ("Customer" in Billing ≠ "Customer" in Support). One team per context ideally.
- **Context mapping**: partnership, shared kernel (small, co-owned), customer–supplier, conformist, **anti-corruption layer** (translate external/legacy models at the boundary), open host service + published language, separate ways.
- Discovery: EventStorming, domain storytelling; name things in the domain's language.

Tactical:
- **Entity** (identity + lifecycle), **Value Object** (immutable, equality by value, self-validating), **Aggregate** (consistency boundary with a root), **Domain Service** (logic not belonging to one entity), **Repository** (per aggregate), **Factory**, **Domain Event** (something that happened, past tense: `OrderPlaced`).
- Aggregate design rules (Vaughn Vernon, "Effective Aggregate Design"): model true invariants inside consistency boundaries; **design small aggregates**; **reference other aggregates by ID**; **use eventual consistency outside the boundary**; modify **one aggregate per transaction**. Use optimistic concurrency (version column).
- Domain events vs integration events: domain events are in-process and can be internal; integration events are public contracts across contexts, versioned, published via outbox.
- When NOT to use tactical DDD: CRUD/data-centric apps, reporting, glue code. Strategic DDD (boundaries & language) is almost always useful.

### 3.7 Frontend architecture: Feature-Sliced Design (FSD)
- Layers (top → bottom): `app` → (`processes`, deprecated) → `pages` → `widgets` → `features` → `entities` → `shared`.
- Import rule: a module may import only from layers **strictly below**; slices on the same layer can't import each other.
- Each slice exposes a **public API** (`index.ts`); no deep imports. Segments: `ui`, `model`, `api`, `lib`, `config`.
- Enforce with Steiger (FSD linter) or eslint boundaries rules.
- When to use: medium–large SPAs/Next apps with many features/teams. For small apps, simple feature folders (`src/features/x/{components,hooks,api}`) suffice. With Next.js App Router, keep `app/` as thin routing that imports from `pages`/`widgets` layers (FSD has a Next.js guide).

### 3.8 Monorepo structure
```
apps/          # deployables: web, api, worker, mobile
packages/      # shared libs: ui, config (eslint/tsconfig), domain-x, api-client, db
tooling/ or tools/
docs/adr/
```
- Tools: pnpm/yarn/bun workspaces + Turborepo or Nx (TS); uv workspaces (Python); Gradle multi-project (Kotlin); SwiftPM packages; Bazel/Pants for polyglot at scale.
- Rules: packages declare dependencies explicitly (no phantom deps); enforce dependency direction (apps → packages, never reverse; no cycles); affected-only builds/tests with remote caching; CODEOWNERS per package; single version policy for key deps; internal packages versioned by workspace protocol; shared `tsconfig`/lint presets as packages.
- Don't create a package until ≥2 consumers exist (YAGNI); avoid `packages/common` junk drawers.

### 3.9 ADRs
- Record architecturally significant, costly-to-reverse decisions: context, decision, consequences (Nygard template: Title, Status, Context, Decision, Consequences). MADR adds considered options with pros/cons. Y-statement: "In the context of <use case>, facing <concern>, we decided for <option> to achieve <quality>, accepting <downside>."
- File naming: `docs/adr/0007-use-postgres-for-job-queue.md` (numbered) or imperative verb phrase; statuses: proposed/accepted/deprecated/superseded-by-NNNN. ADRs are immutable; supersede rather than edit.
- Skip ADRs for trivial, reversible, or style-guide-covered choices.
- Agent rule: when the agent makes/suggests a one-way-door decision (new datastore, new service, new public API style, auth approach), draft an ADR; look for existing ADR dir first.

### 3.10 C4 model (Simon Brown)
- Level 1 **System Context** (system + users + external systems), Level 2 **Container** (deployable/runnable units & data stores: web app, API, DB, queue), Level 3 **Component** (major components inside a container), Level 4 **Code** (rarely drawn; generate if needed). Supplementary: dynamic, deployment, system landscape.
- Diagrams-as-code: Structurizr DSL, Mermaid C4 (`C4Context`), PlantUML C4. Agents should produce Mermaid for READMEs; each diagram has a title, legend, and labeled relationships ("reads/writes via SQL", "publishes OrderPlaced via Kafka").

### 3.11 Evolutionary architecture & fitness functions
- "Building Evolutionary Architectures" (Ford, Parsons, Kua, Sadalage; 2nd ed. 2022): support guided, incremental change across multiple dimensions.
- **Fitness function** = objective, automated check of an architectural characteristic. Types: atomic vs holistic, triggered (CI) vs continuous (prod monitoring), static vs dynamic.
- Examples to generate for users:
  - Dependency rules/no cycles: dependency-cruiser, eslint-plugin-boundaries, Nx enforce-module-boundaries, import-linter, ArchUnit, Konsist.
  - Performance budgets: k6/Gatling p95 thresholds in CI; bundle-size limits (size-limit); Lighthouse CI.
  - Security: dependency audit, secret scanning (gitleaks), SAST (Semgrep/CodeQL), SBOM.
  - Operability: every service exports health checks, RED metrics, trace propagation.
  - Data: migration linting (squawk for Postgres, strong_migrations).
  - Production: SLO burn-rate alerts as continuous fitness functions.
- Techniques for change: Strangler Fig, Branch by Abstraction, Parallel Change (expand–contract), feature flags, dark launches, consumer-driven contracts.

### 3.12 12-Factor (still relevant, cloud-native baseline)
Codebase (one repo per app, many deploys) · Dependencies (explicitly declared, isolated) · Config (in environment, not code) · Backing services (attached resources) · Build/release/run separated · Processes (stateless, share-nothing) · Port binding · Concurrency (scale out via process model) · Disposability (fast startup, graceful shutdown on SIGTERM) · Dev/prod parity · Logs (event streams to stdout) · Admin processes (one-off tasks in same env). Modern additions: telemetry (OTel), security/secret managers rather than raw env vars for sensitive values, API-first.

---

## 4. Scalability & Reliability

### 4.0 Order of operations (agent rule: cheapest effective fix first)
1. **Measure** (profile, `EXPLAIN (ANALYZE, BUFFERS)`, traces). Never optimize by guess.
2. Fix the query/algorithm (indexes, N+1, pagination, batch I/O, O(n²) loops).
3. Cache (with explicit invalidation & TTL).
4. Scale vertically (modern single machines: 100+ vCPUs, TBs RAM — Postgres on one big box goes very far).
5. Move work async (queues/jobs).
6. Read replicas / CDN / edge caching.
7. Partition/shard — last resort; one-way door.
Also: don't add Redis/Kafka/Elasticsearch/a new datastore when Postgres features (indexes, `SKIP LOCKED` queues, `LISTEN/NOTIFY`, full-text search, `pgvector`, JSONB, partitioning) suffice for the stated scale — each new datastore is an operational burden (backups, HA, monitoring, security).

### 4.1 Back-of-envelope estimation
Numbers (Jeff Dean/Peter Norvig "Latency numbers every programmer should know", as reproduced in donnemartin/system-design-primer; treat as orders of magnitude — modern hardware is faster for SSD/network):
```
L1 cache reference                    0.5 ns
Branch mispredict                       5 ns
L2 cache reference                      7 ns
Mutex lock/unlock                      25 ns
Main memory reference                 100 ns
Compress 1 KB (Snappy/Zippy)           10 µs
Send 1 KB over 1 Gbps network          10 µs
Read 4 KB randomly from SSD           150 µs   (modern NVMe: ~20–100 µs)
Read 1 MB sequentially from memory    250 µs
Round trip within same datacenter     500 µs
Read 1 MB sequentially from SSD         1 ms   (NVMe: ~0.1–0.3 ms)
HDD seek                               10 ms
Read 1 MB sequentially from 1 Gbps     10 ms
Read 1 MB sequentially from HDD        30 ms
Packet CA → Netherlands → CA          150 ms
```
Handy: memory ~4+ GB/s sequential (much higher today), SSD ~1–7 GB/s, 1 Gbps ≈ 100+ MB/s; ~2,000 DC round trips/s per serial caller; 6–7 intercontinental round trips/s.

Practical app-level numbers (typical, order-of-magnitude; state as ranges):
| Operation | Typical |
|---|---|
| Redis/Memcached GET (same AZ) | 0.2–1 ms |
| Postgres indexed point lookup (warm) | 0.1–1 ms server time; 1–3 ms incl. network |
| Cross-AZ round trip | ~0.5–2 ms |
| Cross-region (US east↔west) | ~60–80 ms RTT |
| TLS handshake new connection | 1–2 RTTs (TLS 1.3: 1 RTT; 0-RTT resumption) |
| LLM API time-to-first-token | ~0.3–2 s; full response seconds–minutes |
| Human-perceived "instant" | <100 ms; "flow" <1 s; attention lost >10 s (Nielsen) |

Powers of two: 2^10 ≈ 1 thousand (KB), 2^20 ≈ 1 million (MB), 2^30 ≈ 1 billion (GB), 2^40 ≈ 1 trillion (TB).

Time conversions: 1 day = 86,400 s ≈ 10^5 s. So **1M requests/day ≈ 12 rps average**; 10M/day ≈ 116 rps; 100M/day ≈ 1,160 rps; 1B/day ≈ 11,600 rps. Peak ≈ 2–10× average (use 3× default unless known).

Availability ("nines") → allowed downtime:
| SLO | per 30-day month | per year |
|---|---|---|
| 99% | 7.2 h | 3.65 d |
| 99.5% | 3.6 h | 1.83 d |
| 99.9% | 43.2 min | 8.76 h |
| 99.95% | 21.6 min | 4.38 h |
| 99.99% | 4.32 min | 52.6 min |
| 99.999% | 25.9 s | 5.26 min |
Serial dependencies multiply: three 99.9% dependencies in series → ≈ 99.7%. Redundant (parallel) components: 1 − (1−a)^n.

Laws:
- **Little's Law**: L = λ × W (concurrency = arrival rate × latency). E.g., 500 rps × 0.2 s = 100 concurrent requests → size pools/threads accordingly.
- **Amdahl's Law**: speedup limited by serial fraction.
- **Universal Scalability Law** (Gunther): contention + coherency cause retrograde scaling — adding nodes can reduce throughput.
- Queueing: latency explodes as utilization → 100% (M/M/1 wait ∝ ρ/(1−ρ)); plan for ≤ 60–70% sustained utilization on critical resources.

Estimation template (agents should fill it in when designing): DAU → requests/user/day → avg & peak rps → read:write ratio → payload size → storage/day & /year (× replication × index overhead ~1.5–3×) → bandwidth → cache working set (often 20% of data serves 80% of reads) → number of instances (peak rps / per-instance capacity measured by load test, + N+1/N+2 headroom).

### 4.2 Caching
Strategies:
| Pattern | How | Use | Pitfall |
|---|---|---|---|
| Cache-aside (lazy) | App reads cache → miss → DB → populate | Default for read-heavy | Stale data; stampede on hot miss |
| Read-through | Cache library loads on miss | Same, centralized loader | Library coupling |
| Write-through | Write to cache and DB synchronously | Read-after-write consistency | Write latency; caching unread data |
| Write-behind (write-back) | Write to cache, flush async | Write-heavy counters/metrics | Data loss on cache crash — avoid for money |
| Write-around | Write DB only, cache on read | Write-once/read-rarely data | Initial misses |
| Refresh-ahead / stale-while-revalidate | Serve stale, refresh in background | Hot keys, HTTP (`Cache-Control: stale-while-revalidate`) | Bounded staleness must be acceptable |

Cache layers: browser (`Cache-Control`, `ETag`) → CDN/edge → reverse proxy → application in-process (LRU, small, per-instance) → distributed (Redis/Valkey/Memcached) → DB buffer cache → materialized views.

Invalidation ("one of the two hard things"):
- Prefer **TTL + explicit invalidation on write** (delete key after DB commit, not before; or use versioned keys `user:123:v42`).
- Delete-after-commit race: concurrent reader may repopulate stale value → mitigations: short TTLs, versioned keys, delayed double delete, or CDC-driven invalidation (Debezium → invalidate).
- Keys include every input that affects the value (tenant, locale, permissions/role, feature-flag variant). **Never cache per-user/authorized data under a shared key** (data leak).
- Failure modes (ByteByteGo): **thundering herd/mass expiry** → add TTL jitter (±10–20%); **cache penetration** (keys that don't exist) → cache negative results briefly / Bloom filter; **cache breakdown (hot key expiry)** → request coalescing/single-flight lock, early probabilistic refresh (XFetch), or no-expiry + background refresh; **cache crash** → circuit breaker to DB, rate-limit fallback, replicated cache.
- Set memory limits + eviction policy (LRU/LFU; Redis `allkeys-lfu` for caches). Monitor hit ratio (aim >80–90% for effective caches), evictions, latency.
- Don't cache what's cheap to compute or rarely read; caching adds a consistency problem — justify with numbers.

### 4.3 CDN & edge
- Cache static assets with long TTL + content-hashed filenames (`Cache-Control: public, max-age=31536000, immutable`); HTML/API with short TTL or `s-maxage` + `stale-while-revalidate`; `Vary` correctly (Accept-Encoding; avoid `Vary: Cookie` explosion).
- Purge by surrogate keys/tags on content change.
- Use edge for: TLS termination, WAF/bot/DDoS protection, redirects, geo/AB routing, auth token checks, image optimization, static/ISR pages.
- Don't put chatty DB-bound logic at the edge when the DB is in one region: edge→origin-DB round trips (e.g., 5 queries × 80 ms) are slower than running near the DB. Rule: **run compute close to its data**; use regional functions near the primary DB, edge only for cacheable/stateless work. (Reported 2026: Vercel moved away from edge-by-default toward regional Node "Fluid" compute; edge mainly for middleware.)
- Edge runtime limits (V8 isolates, e.g., Cloudflare Workers): small memory (~128 MB), CPU-time limits, no filesystem, partial Node API compat — check library compatibility before choosing.

### 4.4 Databases: indexing, queries, replicas, partitioning, sharding
Indexing rules (Postgres-centric; mostly general):
- Index columns used in `WHERE`, `JOIN`, `ORDER BY`; **every foreign key column** (Postgres doesn't auto-index FKs) — prevents slow deletes/joins.
- Composite index order: equality columns first, then range/sort columns (leftmost-prefix rule). `(tenant_id, created_at DESC)` serves "latest N for tenant".
- Covering indexes (`INCLUDE`) for index-only scans; partial indexes (`WHERE deleted_at IS NULL`, `WHERE status='pending'`); expression indexes (`lower(email)`); GIN for JSONB/arrays/full-text; BRIN for huge append-only time series; HNSW (pgvector) for embeddings.
- Each index slows writes and uses memory — remove unused ones (`pg_stat_user_indexes.idx_scan = 0`).
- Verify with `EXPLAIN (ANALYZE, BUFFERS)`; watch for Seq Scan on large tables, row-estimate mismatches, sort spills, nested loops over large sets.
- Use `pg_stat_statements` to find top queries by total time.
Query rules:
- **No N+1**: eager load (`include`/`joinedload`/`select_related`/`prefetch_related`), batch by IDs (`WHERE id = ANY($1)`), DataLoader for GraphQL.
- **No unbounded queries**: every list endpoint has `LIMIT` (default 20–50, max 100–1000); no `SELECT *` on wide tables in hot paths; stream/batch large exports.
- Keyset (cursor) pagination for large/real-time sets instead of `OFFSET` (O(offset) cost, drift on inserts).
- Batch writes (multi-row insert, `COPY`); backfills in chunks (1k–10k rows, with sleeps) to avoid long locks and replication lag.
- Keep transactions short; no network calls (HTTP, LLM, email) inside DB transactions.
- Concurrency control: know your isolation level (Postgres default **Read Committed**). Prevent lost updates with atomic updates (`SET balance = balance - $1 WHERE balance >= $1`), `SELECT … FOR UPDATE`, optimistic locking (`version` column → 409 on conflict), or `SERIALIZABLE` + retry on serialization failure (SQLSTATE 40001).
- Uniqueness & invariants in the DB (unique constraints, FKs, CHECKs, exclusion constraints) — app-level checks race.
- IDs: UUIDv7 / ULID (time-ordered → index-friendly) or bigint identity; never expose sequential IDs where enumeration matters (still authorize every access — BOLA).
Read replicas:
- Offload reads/analytics; **replication lag** (ms to seconds, unbounded under load) breaks read-your-writes → route a user's reads to primary for a window after their write, or use LSN/"causal token" waits; never read-then-write decisions from a replica.
Partitioning (single node): Postgres declarative partitioning by time (range) for large append-only tables (events, logs) → cheap retention (`DROP PARTITION`), smaller indexes. Partition key must be in queries to prune.
Sharding (multi-node): last resort after vertical scaling + replicas + caching + partitioning + archiving.
| Strategy | Pros | Cons |
|---|---|---|
| Hash (consistent hashing) | Even distribution | Range scans across shards; resharding (mitigate with virtual nodes) |
| Range | Range queries, locality | Hot spots (monotonic keys) |
| Directory/lookup | Flexible placement (move big tenants) | Lookup service is critical path |
| Tenant/entity-based (`tenant_id`) | Most SaaS queries are single-tenant; isolation | Whale tenants → hot shards |
Choose shard key = most common access-path key with high cardinality and even load; avoid cross-shard transactions/joins; plan resharding from day one. Prefer managed/distributed SQL (Citus, Vitess/PlanetScale, CockroachDB, Spanner, Aurora Limitless, Yugabyte) over hand-rolled sharding.

### 4.5 Connection pooling
- Postgres uses a process per connection (several MB each); too many connections degrade throughput. HikariCP/PostgreSQL wiki heuristic: **pool size ≈ (DB cores × 2) + effective spindle count** (≈1 for SSD) — a 4-core DB is well served by ~8–10 active connections; 16-core by ~32–40. Total across all app instances must stay below `max_connections` minus admin headroom.
- App-side pool per process + **PgBouncer (transaction mode)** or a managed pooler (RDS Proxy, Supabase Supavisor, Neon pooler) for serverless/horizontally scaled apps. Transaction mode breaks session features (session `SET`, advisory locks across transactions, `LISTEN`, `WITH HOLD` cursors; prepared statements unless PgBouncer ≥1.21 with `max_prepared_statements`).
- Serverless: create the pool/client outside the handler; use HTTP/WebSocket drivers (Neon serverless, PlanetScale) or a proxy; cap concurrency.
- Always set connection timeout, statement_timeout, idle-in-transaction timeout; release connections in `finally`.
- Same pooling concept for HTTP clients: reuse keep-alive agents/sessions (Node undici agent, Python `httpx.Client`/`requests.Session`, OkHttp singleton client).

### 4.6 Queues & async jobs
When: work >~100–500 ms not needed for the response (emails, webhooks, image processing, LLM batch, exports), spiky load leveling, retries against flaky dependencies, fan-out.
| Option | Use when |
|---|---|
| Postgres queue (`FOR UPDATE SKIP LOCKED`; pg-boss, River, Graphile Worker, Solid Queue, PGMQ, Oban) | Default for small–medium apps already on Postgres; **transactional enqueue** with business write (no dual-write problem). Reported comfortable into thousands of jobs/s |
| Redis-based (BullMQ, Sidekiq, Celery+Redis, RQ) | Already run Redis; high job rates; accept Redis durability config |
| Managed queues (SQS, Cloud Tasks, Pub/Sub, Azure Service Bus) | Serverless/cloud-native, no ops |
| Log/streaming (Kafka, Redpanda, Kinesis, NATS JetStream) | Multiple independent consumers, replay, event streaming, very high throughput, ordering per partition key |
| Durable execution (Temporal, Restate, DBOS, Inngest, AWS Step Functions, Cloudflare Workflows) | Multi-step long-running workflows, sagas, human-in-the-loop, agent workflows needing resumability |
Rules:
- Assume **at-least-once** delivery → consumers must be **idempotent** (dedupe table keyed by message ID, upserts, natural idempotency).
- Visibility timeout / lease > max processing time; heartbeats for long jobs.
- Retries with exponential backoff + jitter, max attempts, then **dead-letter queue** with alerting and a replay tool.
- Poison messages must not block the queue.
- Ordering only where needed, scoped per key (Kafka partition key, SQS FIFO message group).
- Job payloads carry IDs, not large blobs or stale snapshots; include schema version.
- Monitor queue depth, age of oldest message, processing latency, DLQ size — alert on age, not only depth.
- Graceful shutdown: stop fetching, finish/abandon in-flight jobs on SIGTERM.

### 4.7 Idempotency
- GET/PUT/DELETE are idempotent by HTTP semantics; make POST/PATCH retry-safe with an **Idempotency-Key** header (IETF draft-ietf-httpapi-idempotency-key-header; Stripe-popularized; Azure uses `Repeatability-Request-ID`/`Repeatability-First-Sent` per OASIS Repeatable Requests and says *all* operations must be idempotent).
- Server algorithm: (1) client sends unique key (UUIDv4) per logical operation; (2) server atomically inserts `(key, principal, request_fingerprint, status='in_progress')` with unique constraint; (3) if key exists and completed → return stored response (same status/body); if in progress → 409/425 or wait; if fingerprint differs → 422 (key reuse with different payload); (4) store response in the same transaction as the side effect where possible; (5) expire keys after e.g. 24 h (Stripe) — Azure requires tracking window ≥ 5 min.
- Scope keys per tenant/user. Never use a timestamp as key.
- Downstream: pass idempotency keys to payment providers/other APIs; derive child keys deterministically (`{key}:charge`).
- Consumers: store processed message IDs (inbox pattern) in the same transaction as effects.

### 4.8 Timeouts, retries, backoff, jitter
Timeouts:
- **Every** network call has a timeout (connect + read/overall). Library defaults are often infinite (Python `requests` has none by default; Node `fetch` none → use `AbortSignal.timeout(ms)`).
- Set timeout from downstream latency percentiles (e.g., slightly above p99/p99.9) and the caller's **deadline budget**; propagate deadlines (gRPC deadlines; `X-Request-Deadline`/context cancellation) so downstream stops work nobody awaits.
- Outer timeouts > sum of inner timeouts + retries, or you retry work that's still running.
Retries:
- Retry only **transient** failures: connection errors, 408, 429, 502, 503, 504 (500 only if idempotent and known transient). Never retry 4xx validation/auth errors.
- Retry only idempotent operations (or with idempotency keys).
- **Capped exponential backoff with full jitter** (AWS Architecture Blog/Builders' Library): `sleep = random(0, min(cap, base × 2^attempt))`; typical base 100–200 ms, cap 10–30 s, max 3–5 attempts (user-facing: 2–3). Honor `Retry-After`.
- Retry at **one layer** only — nested retries multiply (3 layers × 3 attempts = 27× load).
- **Retry budgets**: cap retries to ~10% of requests per client (Google SRE) or token-bucket retry quota (AWS SDK "standard" mode) to avoid retry storms.
- Hedged requests (send duplicate after p95 latency) only for idempotent reads, with budget.

### 4.9 Circuit breakers, bulkheads, load shedding, backpressure
- **Circuit breaker** (Nygard, "Release It!"): closed → open when failure rate exceeds threshold (e.g., ≥50% over ≥20 calls in a 10–60 s window, or consecutive failures) → fail fast with fallback → half-open after cooldown (e.g., 30 s) with limited probes → close on success. Libraries: resilience4j (JVM/Kotlin), Polly (.NET), cockatiel/opossum (Node), pybreaker/tenacity (Python), service mesh (Envoy outlier detection).
- **Bulkheads**: isolate resources per dependency/tenant/priority — separate connection pools, thread pools, queues, concurrency semaphores — so one slow dependency can't exhaust everything.
- **Load shedding**: when overloaded, reject early and cheaply (429/503 + `Retry-After`) rather than queueing until timeouts; prioritize critical traffic (health checks, paid tier, checkout) — shed low-priority first.
- **Backpressure**: bounded queues/buffers everywhere (unbounded queues = latent OOM + infinite latency); propagate "slow down" upstream (TCP flow control, reactive streams `request(n)`, Kafka consumer pause, HTTP 429). Adaptive concurrency limits (Netflix `concurrency-limits`, TCP-Vegas/gradient style) beat static limits.
- **Steady state** (Release It!): purge logs, caches, sessions automatically; everything that grows needs a bound and a cleanup.
- Fallbacks: cached/stale data, default values, degraded feature, queue for later — decided per feature with product.

### 4.10 Rate limiting
| Algorithm | Behavior | Use |
|---|---|---|
| Token bucket | Refill r tokens/s, capacity b → allows bursts up to b | Default per-API-key/user limits |
| Leaky bucket | Constant outflow, queue/drop excess | Shaping traffic to a fragile downstream |
| Fixed window counter | Count per window | Simple quotas; allows ~2× burst at boundaries |
| Sliding window log | Timestamp per request; exact | Low-volume security controls (login attempts) |
| Sliding window counter | Weighted current+previous window; 2 integers | Good accuracy/memory balance at scale |
| GCRA | Token-bucket-equivalent with one timestamp | Efficient Redis implementations |
Rules: limit by API key/user/tenant **and** IP for unauthenticated routes; distributed limits via Redis atomic Lua / managed gateway; return **429** with `Retry-After`; advertise quota via `RateLimit-Policy`/`RateLimit` headers (IETF draft-ietf-httpapi-ratelimit-headers, still a draft in 2026) or de-facto `X-RateLimit-*`; separate limits for expensive endpoints (search, exports, LLM calls — limit by tokens/cost, not only requests); stricter limits on auth endpoints (credential stuffing). OWASP API4:2023 Unrestricted Resource Consumption requires limits on rate, payload size, page size, upload size, execution time, and paid-resource spend.

### 4.11 Outbox, inbox, sagas
- **Dual-write problem**: writing to DB and publishing to a broker/sending email cannot be atomic → lost or phantom events.
- **Transactional outbox**: in the same DB transaction as the state change, insert an event row into `outbox`; a relay publishes it (polling publisher with `SKIP LOCKED`, or CDC such as Debezium reading the WAL — lower latency and DB load, more infra). Delivery is **at-least-once** → consumers idempotent.
- **Inbox**: consumer records processed message IDs in the same transaction as its effects.
- **Sagas** for multi-service business transactions without 2PC: sequence of local transactions with **compensating actions** (refund, release inventory) on failure. Orchestration (central coordinator — explicit, easier to reason about/observe; 2026 trend: implement on durable-execution engines like Temporal/Restate/DBOS) vs choreography (services react to events — loose coupling but emergent, hard-to-trace flows; OK for ≤3–4 steps). Design compensations to be idempotent and semantic (you can't "unsend" an email; you send a correction). Use **pivot transaction** thinking: steps after the point of no return must be retriable until success.

### 4.12 Consistency, CAP, PACELC
- CAP: under a network **P**artition, choose **C**onsistency or **A**vailability. Partitions are not optional in distributed systems.
- **PACELC** (Abadi 2012): if Partition → A or C; **Else** → Latency or Consistency. The "else" trade-off matters more day-to-day. Examples: DynamoDB/Cassandra default PA/EL; Spanner/CockroachDB PC/EC; MongoDB commonly classed PA/EC.
- Consistency models (strong → weak): linearizable > sequential > causal > read-your-writes / monotonic reads / monotonic writes (session guarantees) > eventual. Pick per use case: money/inventory/uniqueness → strong (single-leader DB, transactions, constraints); feeds/counters/analytics/search indexes → eventual with bounded staleness; collaborative editing → CRDTs (strong eventual consistency).
- Agent rule: when introducing any replica, cache, queue, search index, or second service, **state the new consistency guarantee explicitly** and how the UI handles staleness (optimistic updates, "processing" states, read-your-writes routing).
- Clocks: don't rely on wall-clock ordering across machines; use DB sequences, logical/hybrid clocks, or per-entity versions.

### 4.13 Observability
- Three signals: **logs** (discrete events, structured JSON), **metrics** (aggregates, cheap, alertable), **traces** (request flow across services). Profiles emerging as 4th signal (OTel profiling in development).
- **OpenTelemetry** is the vendor-neutral standard (CNCF): use the OTel SDK + auto-instrumentation + OTLP exporter; W3C Trace Context (`traceparent`) propagation across HTTP/queues (put trace context in message headers). Tracing and metrics are stable; logs bridge/data model stable; **GenAI semantic conventions (`gen_ai.*`) are still "Development" status as of mid-2026 and were moved to a dedicated repo (semconv v1.42.0, June 2026)** — use them but pin versions.
- Logging rules: structured (key–value), include `trace_id`/`span_id`, request ID, tenant ID, user ID (pseudonymous); levels used consistently; **never log secrets, tokens, passwords, full card numbers, or raw PII**; log at boundaries once; sample high-volume debug logs; guard against log injection (CWE-117 — Veracode found LLMs fail this 88% of the time).
- Metrics: **RED** for services (Rate, Errors, Duration), **USE** for resources (Utilization, Saturation, Errors), Google's **four golden signals** (latency, traffic, errors, saturation). Use histograms for latency; report p50/p95/p99, never averages alone. Control **label cardinality** (no user IDs/URLs with IDs as metric labels).
- Tracing: sample (head-based % or tail-based to keep errors/slow traces); span per external call (DB, HTTP, queue, LLM); record attributes, not payloads.
- **SLIs/SLOs/error budgets** (Google SRE): SLI = good events / valid events (e.g., % of requests < 300 ms and non-5xx). SLO = target over window (e.g., 99.9% over 28–30 days). Error budget = 1 − SLO (0.1% ≈ 43 min/month). Error budget policy: when exhausted, freeze risky launches and prioritize reliability.
- Alerting: alert on symptoms/SLO burn, not causes (CPU). **Multiwindow, multi-burn-rate** (SRE Workbook): page if burn rate ≥ **14.4** over 1 h **and** 5 min (2% of 30-day budget in 1 h); page if ≥ **6** over 6 h and 30 min (5% budget); ticket if ≥ **1** over 3 d and 6 h (10% budget). Every page must be actionable with a runbook.
- Health checks: liveness (process alive — don't check dependencies) vs readiness (can serve — may check critical deps) vs startup probes.

### 4.14 Graceful degradation, feature flags, releases
- Design degraded modes per feature: read-only mode, cached results, hide non-critical widgets (recommendations), queue writes, disable expensive features via **kill switches**.
- Feature flag types (Pete Hodgson/Fowler): **release toggles** (short-lived, remove within weeks), **experiment toggles** (A/B), **ops toggles/kill switches** (long-lived), **permission toggles** (entitlements). Use OpenFeature (CNCF standard API) with a provider (LaunchDarkly, Unleash, Flagsmith, GrowthBook, flagd). Rules: default-safe values when flag service unavailable; evaluate server-side for security-relevant flags; flags have owners + expiry; remove dead flags (flag debt); test both paths.
- Progressive delivery: canary (1% → 5% → 25% → 100%) with automated rollback on SLO regression, blue/green, dark launches/shadow traffic. Decouple deploy from release.
- Graceful shutdown: handle SIGTERM → fail readiness → drain in-flight requests (e.g., 10–30 s) → close pools.

### 4.15 Zero-downtime schema migrations (expand/contract)
Principle: app versions N and N+1 run simultaneously during deploys → every migration must be compatible with both. Never combine a breaking schema change and the code change in one step.
Expand/contract (parallel change) for renaming a column `name` → `full_name`:
1. **Expand**: add nullable `full_name` (no default rewrite).
2. Deploy code that **writes both** columns, reads old.
3. **Backfill** in batches (1k–10k rows/txn, throttled; watch replication lag).
4. Deploy code reading new column (still writing both).
5. Add constraints (`NOT NULL` via `CHECK … NOT VALID` then `VALIDATE CONSTRAINT`, then `SET NOT NULL` in PG12+ uses the validated check).
6. Stop writing old column; **contract**: drop old column in a later release.
Postgres safety rules (lint with **squawk**, strong_migrations, or pgroll for automated expand/contract):
- `SET lock_timeout = '2s'` (and `statement_timeout`) for DDL; retry on timeout — a DDL waiting for `ACCESS EXCLUSIVE` blocks all subsequent queries.
- `CREATE INDEX CONCURRENTLY` / `DROP INDEX CONCURRENTLY` (not inside a transaction; migration tool must disable wrapping transaction).
- Adding FK: `ADD CONSTRAINT … NOT VALID` then `VALIDATE CONSTRAINT` separately.
- `ADD COLUMN … DEFAULT <constant>` is metadata-only since PG11; volatile defaults (e.g., `random()`, `clock_timestamp()`, `gen_random_uuid()`) force a full table rewrite (`now()` is STABLE and is fine), as do most column type changes; changing column types usually requires expand/contract.
- Never rename/drop columns or tables in use by the running version. For ORMs with column caching (Rails `ignored_columns`, etc.), ignore first, drop later.
- Large data migrations are jobs, not migrations. Always have a rollback/forward-fix plan and backups; test on production-sized data copies.

### 4.16 Multi-tenancy
| Model | Isolation | Cost | Use |
|---|---|---|---|
| Pool (shared DB/schema, `tenant_id` column) | Logical (app + RLS) | Lowest | Default for B2B SaaS long tail |
| Bridge (schema-per-tenant or hybrid) | Medium | Medium | Mid-size; migrations × N schemas get painful beyond hundreds/thousands |
| Silo (DB/account/cell per tenant) | Strong | Highest | Enterprise/regulated/data-residency tenants, whales |
Rules:
- `tenant_id` on every tenant-owned table, leading column of composite indexes and unique constraints (`UNIQUE (tenant_id, email)`).
- Enforce isolation in depth: resolve tenant from authenticated token (never from request body), scope every query via a repository/ORM middleware, **plus Postgres Row-Level Security** (`CREATE POLICY … USING (tenant_id = current_setting('app.tenant_id')::uuid)`; set per transaction with `SET LOCAL`; beware connection poolers and superuser/`BYPASSRLS` roles).
- Tenant context in logs, traces, metrics (bounded cardinality: tier, not ID, in metrics), caches keys, object storage prefixes, search indexes, vector store filters.
- Noisy neighbors: per-tenant rate limits/quotas, fair queuing, per-tenant concurrency caps, move whales to dedicated cells/shards.
- Tests that assert cross-tenant access is denied (BOLA tests).
- Tenant lifecycle: provisioning, export, deletion (GDPR), per-tenant encryption keys if required.

### 4.17 Cost awareness
- Treat cost as a non-functional requirement: estimate **unit cost** (per request, per tenant, per active user, per LLM conversation).
- Common cost traps: cross-AZ/region data transfer and internet egress; NAT gateway processing fees; over-provisioned always-on instances; log ingestion volume and high-cardinality metrics; unbounded object storage/versioning without lifecycle rules; chatty microservices; LLM tokens (largest variable cost in AI apps); idle dev environments; serverless at sustained high load (can exceed containers).
- Practices: tags/labels for cost allocation; budgets + anomaly alerts; lifecycle policies; right-size after measuring; autoscaling with sane min/max; caching; batch APIs (LLM batch APIs typically ~50% cheaper); choose simplest architecture (Prime Video's 90% reduction came from removing distribution overhead).

### 4.18 Richard Cook — "How Complex Systems Fail" (1998) — relevance for agents
18 observations; key ones as design/ops rules:
1. Complex systems are intrinsically hazardous → design for failure, not "if" but "when".
2. Heavily and successfully defended against failure → layered defenses (validation, timeouts, breakers, backups).
3. **Catastrophe requires multiple failures** — single-point failures aren't enough; incidents are combinations of latent faults → reduce latent faults (unmonitored queues, untested backups, expired certs).
4. Complex systems contain changing mixtures of latent failures → always running in degraded mode.
5. **Post-accident attribution to a single "root cause" is fundamentally wrong** → blameless postmortems, contributing factors.
6. **Hindsight biases** post-accident assessments.
7. Human operators have dual roles (producers and defenders); all practitioner actions are gambles.
8. **Change introduces new forms of failure** → small, reversible, observable changes; feature flags; canaries. Very relevant to AI agents generating large diffs.
9. Safety is a characteristic of systems, not components; people continuously create safety through adaptation → make systems operable: runbooks, dashboards, admin tools, clear error messages, manual override/kill switches.
10. Failure-free operations require experience with failure → game days, chaos engineering, restore drills.
Agent rules derived: prefer small diffs; never disable safety mechanisms (tests, lint, type checks, alerts, rate limits) to "make it work"; add observability with every new dependency; document operational procedures for new components.

---

## 5. API Design

### 5.1 General rules
- **API-first/contract-first**: define OpenAPI 3.1 (REST), GraphQL SDL, or `.proto` before implementation for public/cross-team APIs; generate types/clients; lint the contract (Spectral, Redocly, buf lint + buf breaking).
- Consistency beats cleverness: one naming style (JSON `camelCase` common; `snake_case` acceptable if consistent — Microsoft/Azure use camelCase), one error format, one pagination style, one date format (RFC 3339 / ISO 8601 UTC with `Z`), one ID format (strings, opaque).
- Design for evolution: additive changes only within a version; clients must ignore unknown fields; don't remove/rename fields or change types/semantics; new required request fields = breaking. Use extensible enums (clients handle unknown values).
- Money as integer minor units + currency or decimal strings; never floats.

### 5.2 REST conventions
- Resources are plural nouns: `/v1/orders`, `/v1/orders/{orderId}/items`; max ~2 levels of nesting; actions that don't fit CRUD: `POST /v1/orders/{id}:cancel` (Google AIP custom methods) or `POST /v1/orders/{id}/cancel`.
- Methods: GET (safe, cacheable), POST (create/non-idempotent action — make idempotent via key), PUT (full replace, idempotent; can create with client-chosen ID), PATCH (partial; JSON Merge Patch RFC 7396 or JSON Patch RFC 6902), DELETE (idempotent).
- Status codes: 200 OK, 201 Created + `Location`, 202 Accepted (async; return status-monitor URL — Azure LRO pattern with `Operation-Location`), 204 No Content, 304 Not Modified, 400 malformed, 401 unauthenticated, 403 forbidden, 404 not found (also use instead of 403 to avoid leaking existence), 405, 409 conflict (version/state conflict, idempotency in-progress), 412 precondition failed (ETag mismatch), 413 payload too large, 415, 422 semantic validation, 429 rate limited + `Retry-After`, 500, 502, 503 + `Retry-After`, 504.
- Optimistic concurrency: `ETag` on responses; `If-Match` on PUT/PATCH/DELETE → 412 on mismatch; `If-None-Match` for conditional GET → 304.
- Filtering/sorting/fields: `?status=active&sort=-createdAt&fields=id,name`; whitelist sortable/filterable fields (and index them).
- Long-running operations: 202 + operation resource with `status` (`notStarted|running|succeeded|failed|canceled`), poll with `Retry-After`, or webhooks.
- Bulk endpoints to avoid chatty clients; cap batch size.
- Microsoft guidance (cloned `microsoft/api-guidelines`, Azure): all operations idempotent; PUT/PATCH preferred to create when client can name the resource; `x-ms-client-request-id`-style correlation; conditional requests; distributed tracing headers.

### 5.3 Pagination
| Type | How | Pros | Cons |
|---|---|---|---|
| Offset/limit | `?offset=40&limit=20` | Simple, random page access | O(offset) DB cost; duplicates/skips when data changes |
| Page number | `?page=3&pageSize=20` | UI-friendly | Same as offset |
| **Cursor/keyset** (default) | `?limit=20&cursor=<opaque>` → `WHERE (created_at, id) < ($1,$2) ORDER BY created_at DESC, id DESC LIMIT 21` | Stable, O(log n) with index, works for infinite scroll & large sets | No jump-to-page; cursor tied to sort |
Rules: cursors opaque (base64 of sort keys + id; optionally signed/encrypted); deterministic order with unique tiebreaker (`id`); fetch `limit+1` to compute `hasMore`; response shape `{ data: [...], nextCursor: "..." | null }` (or `Link` header with `rel="next"`); default limit 20–50, enforce max (e.g., 100); totals are expensive — make `totalCount` optional/approximate.

### 5.4 Errors — RFC 9457 Problem Details
- RFC 9457 (July 2023) obsoletes RFC 7807; wire-compatible. Media type `application/problem+json`. Members: `type` (URI identifying problem type; `about:blank` default), `title` (short, stable per type), `status` (HTTP status), `detail` (occurrence-specific, human-readable), `instance` (URI of this occurrence) + extension members (e.g., `errors` array for field validation, `traceId`, `code`). RFC 9457 adds a registry of common problem types and guidance for multiple problems.
```json
{
  "type": "https://api.example.com/problems/insufficient-funds",
  "title": "Insufficient funds",
  "status": 422,
  "detail": "Account 12345 has balance 30.00 EUR; transfer requires 50.00 EUR.",
  "instance": "/v1/transfers/abc123",
  "code": "insufficient_funds",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "errors": [{ "pointer": "/amount", "detail": "exceeds available balance" }]
}
```
- Clients branch on `type`/`code`, never on `detail` text. Don't leak stack traces, SQL, internal hostnames. Include correlation/trace ID.

### 5.5 Versioning & deprecation
| Strategy | Example | Notes |
|---|---|---|
| URL major version | `/v1/…` | Most common, explicit, cache-friendly; bump only for breaking changes |
| Header/media type | `Accept: application/vnd.x.v2+json` | Clean URLs; harder to test/debug |
| Date-based (Stripe, Azure `api-version=2024-05-01`) | `Stripe-Version: 2024-06-20` | Fine-grained evolution with per-account pinning; needs version-transform layer |
| GraphQL | Schema evolution, `@deprecated` | No versions; additive only |
| gRPC/Protobuf | package `v1`, field numbers never reused | `buf breaking` in CI |
Deprecation: announce, `Deprecation` header (RFC 9745) and `Sunset` header (RFC 8594) + `Link` to migration docs; monitor usage of deprecated endpoints before removal; keep old major versions ≥ 6–12 months for public APIs.

### 5.6 REST vs GraphQL vs tRPC vs gRPC (2026)
| | Best for | Strengths | Costs/risks |
|---|---|---|---|
| REST/HTTP+JSON (OpenAPI) | Public APIs, partners, webhooks, simple CRUD, cacheable reads | Universal tooling, HTTP caching, curl-debuggable | Over/under-fetching; many round trips for nested data |
| GraphQL | Many client types with different data needs, complex graphs, BFF/federation across teams | Client-selected fields, single round trip, strong schema | N+1 (need DataLoader), query cost/depth limits, persisted queries, caching harder, authorization per field (BOPLA risk) |
| tRPC | Full-stack TypeScript monorepo, own clients only | End-to-end types without codegen, tiny client | TS-only, tight coupling, not for public/multi-language consumers |
| gRPC (Protobuf, HTTP/2) | Internal service-to-service, low latency, streaming, polyglot | Efficient binary, codegen, deadlines, bidi streaming | Not browser-native (needs gRPC-Web/Connect), opaque payloads to HTTP tools |
| Server Actions/Functions (RSC) | Mutations from own Next/React app | Colocated, typed | Public endpoints under the hood → must auth/validate; not an external API |
| Async (webhooks, AsyncAPI, event streams) | Notifications/integration | Decoupled | Delivery guarantees, security |
Common hybrid: REST (public) + tRPC/GraphQL/Server Actions (own frontend) + gRPC/events (internal).

### 5.7 Webhooks (producer & consumer)
- Follow **Standard Webhooks** spec (used by OpenAI, Anthropic, Twilio, Supabase etc.): headers `webhook-id` (stable across retries — dedupe key), `webhook-timestamp`, `webhook-signature` (`v1,<base64 HMAC-SHA256>` over `id.timestamp.body`; multiple space-delimited signatures during secret rotation).
- Consumer rules: verify signature over the **raw body** with constant-time comparison; reject timestamps outside tolerance (~5 min) to prevent replay; dedupe by event ID; respond 2xx fast (<~5–10 s) and process async via queue; handle out-of-order and duplicate delivery; fetch latest resource state from the API if ordering matters ("thin events").
- Producer rules: at-least-once with exponential backoff over hours/days; DLQ + manual replay UI; per-endpoint circuit breaking/disable after repeated failure; event types versioned; SSRF protection when calling customer URLs (block private IP ranges, re-resolve DNS, no redirects to internal) — OWASP API7:2023.

### 5.8 API security — OWASP API Security Top 10 (2023 edition, current)
| ID | Risk | Agent rule |
|---|---|---|
| API1 | **Broken Object Level Authorization (BOLA)** — ~40% of API attacks (reported) | Every handler that takes an ID checks the caller owns/may access that object (scope queries by user/tenant); tests for cross-user access |
| API2 | Broken Authentication | Use vetted IdP/libraries; rate-limit login; no homegrown crypto/JWT parsing; validate `iss/aud/exp/nbf`, reject `alg: none`, pin algorithms |
| API3 | Broken Object Property Level Authorization (mass assignment + excessive data exposure) | Explicit allow-listed input DTOs (no `update(req.body)`); explicit output DTOs/serializers (never return ORM entities raw) |
| API4 | Unrestricted Resource Consumption | Limits on rate, page size, payload, upload size, query complexity, timeouts, and paid-resource spend (SMS, LLM tokens) |
| API5 | Broken Function Level Authorization | Deny by default; admin routes require role checks server-side; don't rely on hidden UI |
| API6 | Unrestricted Access to Sensitive Business Flows | Anti-automation on purchase/signup/referral flows (rate limits, CAPTCHA/device signals, quotas) |
| API7 | Server-Side Request Forgery | Allow-list outbound hosts; block link-local/metadata IPs (169.254.169.254), private ranges; disable redirects |
| API8 | Security Misconfiguration | Secure headers, CORS allow-list (no `*` with credentials), TLS everywhere, no verbose errors, patched deps |
| API9 | Improper Inventory Management | Document all endpoints/versions; retire old versions; no forgotten debug/staging endpoints |
| API10 | Unsafe Consumption of APIs | Validate & bound data from third-party APIs (and LLM outputs) like user input; timeouts; TLS verification |
Also OWASP Top 10 web risks: injection (parameterized queries only, never string-concatenated SQL/shell), XSS (framework escaping; no `dangerouslySetInnerHTML`/`v-html` with untrusted data; CSP), CSRF (SameSite cookies + tokens for cookie-auth), secrets management.

### 5.9 Authentication & authorization (2026)
- **OAuth 2.1** (draft-ietf-oauth-v2-1, draft-15 March 2026, not yet an RFC) consolidates best practice (RFC 9700 OAuth 2.0 Security BCP, Jan 2025): **Authorization Code + PKCE for all clients**; implicit grant and resource-owner password grant removed; exact redirect URI matching; refresh tokens for public clients must be sender-constrained or rotated; bearer tokens not in query strings.
- Sender-constrained tokens: DPoP (RFC 9449) or mTLS (RFC 8705) for high-value APIs.
- **SPAs**: prefer the **BFF (backend-for-frontend) pattern** — tokens stay server-side, browser holds an `HttpOnly; Secure; SameSite=Lax/Strict` session cookie. Avoid storing tokens in `localStorage` (XSS-exfiltratable).
- Access tokens short-lived (5–15 min), refresh token rotation with reuse detection; revoke on logout/password change.
- OIDC for login; don't build your own identity system unless it's the core product — use an IdP (Auth0/Okta, Entra ID, Cognito, Keycloak, Clerk, WorkOS, Supabase/Firebase Auth, Better Auth/Auth.js libs).
- **Passkeys (WebAuthn/FIDO2)**: phishing-resistant; NIST SP 800-63-4 (final July 2025) recognizes syncable passkeys; roll out as an additional option alongside existing login, then promote; keep account recovery strong (recovery is the new attack surface).
- Passwords (if any): NIST 800-63B-4 — length over complexity (min 8, recommend ≥15 for single-factor), allow paste/password managers, screen against breached-password lists, no forced periodic rotation, no security questions. Hash with **Argon2id** (OWASP: m=19 MiB, t=2, p=1 minimum) or bcrypt (cost ≥10) / scrypt; never SHA-*/MD5.
- MFA: prefer passkeys/TOTP/push with number matching; SMS OTP is weakest.
- Authorization: centralize policy (RBAC → ABAC/ReBAC as needed; OpenFGA/SpiceDB (Zanzibar-style), Cedar, OPA/Rego, Oso); check at the resource level in the service, not just the gateway; deny by default; log authz decisions for sensitive actions.
- Service-to-service: workload identity (SPIFFE/SPIRE, cloud IAM roles), mTLS, OAuth client credentials; no long-lived shared API keys in code.
- Machine/agent auth (2026): MCP authorization spec uses OAuth 2.1 with PKCE, protected-resource metadata (RFC 9728) and dynamic client registration/client ID metadata documents; scope tools narrowly.

---

## 6. Failure modes of AI-generated code and how skills should prevent them

### 6.1 Evidence base (cite in skills sparingly; use to justify rules)
- **Security**: Veracode 2025 GenAI Code Security Report — 100+ LLMs, 80 tasks: **45%** of outputs introduced OWASP Top 10 vulnerabilities; Java >70% failure; Python/C#/JS 38–45%; XSS (CWE-80) failed 86%, log injection (CWE-117) 88%; larger models not materially safer.
- **Maintainability**: GitClear (211M lines through 2024): copy-pasted lines exceeded moved (refactored) lines for the first time; refactoring down ~40%; churn 4.5%→5.7%. 2026 follow-up (623M changes, reported): block duplication +81% vs 2023, reuse −70%.
- **Code smells**: "Investigating the Smells of LLM Generated Code" (arXiv 2510.03029): avg +63% smells vs human reference, worse for complex/OO tasks. "AI-Generated Smells" (arXiv 2605.02741, reported): code volume near-perfectly predicts structural degradation ("Volume-Quality Inverse Law"); more capable models generate more bloated/coupled code.
- **Supply chain**: package hallucination — 19.7% of suggested packages hallucinated across 16 LLMs/576k samples (USENIX Security 2025, "We Have a Package for You!"); commercial models ~5.2% vs open ~21.7%; 43% of hallucinated names recur on every rerun → "slopsquatting" attack surface. 2026 frontier re-evaluation (arXiv 2605.17062, reported): 4.6–6.1%.
- **Delivery**: DORA 2025 State of AI-assisted Software Development — ~90% use AI; AI improves throughput but **increases delivery instability**; AI is an "amplifier" of existing practices; ~30% report little or no trust in AI code.

### 6.2 Failure mode → prevention rule table (core content for a "guardrails" skill)
| Failure mode | What it looks like | Skill rule / check |
|---|---|---|
| Over-abstraction / speculative generality | Interfaces with one impl, factories for one class, generic `BaseService<T>`, config for things that never vary, plugin systems for one plugin | "Add an abstraction only with ≥2 concrete current uses or at an I/O boundary. Delete abstractions you introduced that have one implementation." |
| Premature distribution | Proposes microservices, Kafka, Kubernetes, Redis, event sourcing for an MVP | "Default: modular monolith + Postgres. Any new infrastructure component needs a stated requirement + number it satisfies + ADR." |
| God files / god components | 1,000+ line files, `utils.ts` junk drawers, 400-line React components | Soft limits: file > ~400 lines or function > ~50 lines or component with >~7 props/3 concerns → consider splitting by cohesion (not arbitrary). Put new code in the module that owns the concept |
| Duplicate implementations | New helper that already exists; parallel `formatDate2`; second HTTP client | "Before writing a helper/component/type, search the repo (grep by concept names) and reuse/extend." |
| Ignoring existing conventions | New folder structure, different error style, different state library, mixed naming | "Read neighboring files first; match patterns, libraries, naming, test style. Don't introduce a new dependency/pattern when an existing one covers the need." |
| Missing / swallowed error handling | Happy path only; `catch (e) { console.log(e) }`; unawaited promises | Error-handling checklist (§1.5); lint rules `no-floating-promises`, `no-empty`; every external call has timeout + error path |
| Over-defensive code | Null checks for non-nullable types, try/catch around everything, redundant validation deep inside the core, fallbacks that hide bugs | "Validate at boundaries, trust types inside. Don't catch what you can't handle. Don't silently fall back to defaults on errors that indicate bugs." |
| N+1 queries | ORM lazy loading inside loops; `await` inside `for` per item | "No DB/network call inside a loop over a collection; batch or eager-load. Check query count in tests (e.g., assertNumQueries/Prisma query logs)." |
| Unbounded queries / payloads | `findMany()` without `take`, `SELECT *` exports into memory, unlimited uploads | Every list query has limit + pagination; max page size; stream large results; payload size limits |
| Secrets in code | API keys in source, `.env` committed, keys in client bundles (`NEXT_PUBLIC_…SECRET`), secrets in logs | Env/secret manager only; `.env` in `.gitignore`; secret scanning (gitleaks/GitHub push protection); never prefix secrets with public env prefixes; never log tokens |
| Hallucinated APIs / packages | Non-existent functions, wrong signatures, deprecated APIs, invented npm/PyPI packages | "Verify every new dependency exists, is maintained, and is the canonical package (registry page, downloads, repo) before installing; check lockfile diff. Verify APIs against installed version's types/docs; run the type checker/tests." Pin versions |
| Security holes | SQL string concatenation, XSS via raw HTML, missing authz (BOLA), CORS `*`, SSRF, insecure deserialization, weak crypto | OWASP checklist (§5.8); parameterized queries; authorization check in every handler that takes an ID; SAST in CI |
| Race conditions | Check-then-act (`if (!exists) insert`), read-modify-write without locks | Use DB constraints, atomic updates, transactions with proper isolation, idempotency keys |
| Missing timeouts/retries (or naive retries) | `fetch()` with no timeout; retry loops without backoff | §4.8 rules |
| Test gaming | Weakened assertions, skipped tests, mocks of everything, tests mirroring implementation | "Never weaken or delete a test to pass; if a test is wrong, explain why. Tests must fail when behavior breaks." |
| Large unreviewable diffs | Rewrites of whole files for small changes; drive-by reformatting | "Minimal diff that solves the task; separate refactors; no unrelated formatting changes." (Cook: change introduces new failure forms) |
| Dead code & leftovers | Unused functions, commented-out code, debug logs, TODO stubs, placeholder implementations (`// implement later`) | Remove before finishing; never leave stubs that look complete; lint for unused exports (knip, ts-prune, vulture) |
| Excessive comments | Narration of obvious code, comments addressing the user | Comments explain why only |
| Stale/incorrect docs | README claims features that don't exist | Update docs in the same change; don't document unverified behavior |
| Config/infra drift | Hardcoded URLs/ports/regions | Config via env with validation at startup |
| useEffect misuse (React) | Syncing derived state, fetch-in-effect without cancellation → race conditions | Derive in render; use data-fetching libs or RSC; cleanup/abort in effects |
| Inconsistent data model | New tables without FKs/indexes/constraints; nullable everything; floats for money | Data-model checklist (§9.4) |
| Ignoring non-functional requirements | No logging/metrics/tracing for new endpoint; no rate limiting | Definition of done includes observability & limits for new external surfaces |

### 6.3 Process rules that reduce these failures (agent workflow)
1. **Explore before editing**: read related modules, find conventions, grep for existing solutions.
2. **Plan for non-trivial changes**: list files to touch, data model changes, API contract, risks; for one-way doors propose an ADR.
3. **Smallest viable change**; ask/flag before introducing new dependencies, infrastructure, or architectural patterns.
4. **Verify**: run type checker, linter, tests, and (for DB) EXPLAIN on new queries; for dependencies check registry existence.
5. **Self-review** against a checklist (§9) before declaring done; state what was not verified.
6. **Explain trade-offs** in the final message rather than silently choosing complex options.

---

## 7. 2026-relevant: AI-native apps, local-first, edge, server components

### 7.1 AI-native application architecture
Treat the LLM as an **unreliable, slow, expensive, non-deterministic remote dependency** that returns **untrusted input**.

Core rules:
- **Start with the simplest thing**: single well-prompted call with retrieval/tools before chains; workflows before autonomous agents. Anthropic "Building Effective Agents" distinguishes **workflows** (LLMs + tools orchestrated through predefined code paths) from **agents** (LLM dynamically directs its own process and tool use). Workflow patterns: prompt chaining (with programmatic gates), routing (e.g., cheap model for easy queries, capable model for hard), parallelization (sectioning/voting), orchestrator–workers, evaluator–optimizer. Use agents only for open-ended problems where steps can't be predicted and the cost/latency/error-compounding is acceptable.
- **Isolate provider SDKs behind an adapter/gateway** (port): model ID, params, retries, fallbacks, logging, cost accounting in one place. LLM gateways (LiteLLM, Portkey, Cloudflare/Vercel AI Gateway, Kong/Envoy AI) centralize auth, rate limits, routing, caching, observability.
- **Timeouts & streaming**: stream tokens to the UI (SSE is the common transport; handle client disconnect → abort upstream call); set time-to-first-token and total timeouts; long tasks → background job/durable workflow + progress events, not a single 5-minute HTTP request.
- **Retries**: 429/529/overloaded/5xx with backoff + jitter, honoring `retry-after`; fall back to alternate model/provider where quality allows; idempotency for side-effecting tool calls.
- **Structured outputs**: use provider JSON-schema/structured-output or tool-calling modes; still **validate with a schema** (Zod/Pydantic) and handle refusal/partial/invalid output; never `eval` model output; treat as untrusted (OWASP API10 applies; OWASP Top 10 for LLM Apps: prompt injection, sensitive info disclosure, supply chain, data/model poisoning, improper output handling, excessive agency, system prompt leakage, vector/embedding weaknesses, misinformation, unbounded consumption).
- **Prompt injection defense** (no complete solution): treat retrieved docs, web pages, emails, tool results as data; least-privilege tools; separate read vs write tools; human confirmation for irreversible/external side effects (payments, emails, deletes); allow-list egress; don't give the model secrets; per-user authorization enforced in tools (the model is not an auth boundary); limit tool call budgets/steps.
- **Prompts are code**: version prompts in the repo (or prompt registry), review changes, tie to eval results; keep static content (system prompt, tool definitions, examples) at the start to maximize **prompt caching** hits (provider caches discount cached input tokens heavily and cut latency); put variable content last.
- **Cost/latency levers**: model routing/cascades (small model first), prompt caching, shorter contexts (retrieve less but better), output length limits, batch APIs for offline work (~50% cheaper), semantic caching for repeated FAQ-type queries (with care for personalization and staleness), parallel tool calls, speculative/prefetch. Track cost per request/user/tenant; enforce per-tenant token budgets (OWASP "unbounded consumption").
- **Evals are the test suite**: golden datasets from real traffic; deterministic checks (schema valid, contains citation, tool called correctly) + LLM-as-judge with calibrated rubrics + human review sample; run in CI on prompt/model changes; track regressions per model version; online monitoring (thumbs, task success, escalation rate). Error analysis on real transcripts before writing evals.
- **Observability**: trace every LLM call/tool call/retrieval as spans (OTel GenAI semantic conventions — `gen_ai.request.model`, `gen_ai.usage.input_tokens`/`output_tokens`, etc.; still Development status); log prompts/completions only with PII controls and retention policies; tools: Langfuse, Arize Phoenix, Braintrust, LangSmith, Helicone, OpenLLMetry.
- **Durable execution for agents**: multi-step agent runs should be resumable (Temporal/Restate/DBOS/Inngest/LangGraph checkpointers) with idempotent tool calls — crashes mid-run otherwise duplicate side effects.
- **Context engineering**: give agents the minimal high-signal context; tools with clear names, narrow purposes, token-efficient outputs, good error messages; memory/state stored outside the context window (files, DB) with explicit summaries.
- **MCP (Model Context Protocol)**: standard way to expose tools/resources to agents; MCP servers are privileged integration points — authenticate (OAuth 2.1 per MCP auth spec), scope permissions, audit, don't trust tool descriptions from third-party servers (tool poisoning).

RAG architecture (default recipe, 2026):
1. Ingest: parse → clean → chunk (semantic/structure-aware, ~200–800 tokens with overlap; keep headings) → **contextual retrieval** (prepend LLM-generated chunk context; Anthropic reported −49% failed retrievals with contextual embeddings+BM25 and −67% adding reranking) → embed → store with metadata (tenant, ACL, source, timestamp, version).
2. Retrieve: **hybrid search** (BM25/keyword + dense vectors) fused with Reciprocal Rank Fusion (k≈60) → **cross-encoder reranker** → top-k (5–20) into prompt; metadata filters for **tenant/permissions enforced at query time** (never rely on the LLM to hide unauthorized content).
3. Generate with citations; instruct to answer "not found" when context lacks answer.
4. Evaluate retrieval (recall@k, MRR, context precision/recall) separately from generation (faithfulness/groundedness, answer relevance) — RAGAS, DeepEval, TruLens, Braintrust.
5. Store: start with `pgvector` in the existing Postgres (HNSW index) for ≤ tens of millions of vectors; move to dedicated vector DB (Qdrant, Weaviate, Pinecone, Turbopuffer, LanceDB, Vespa) only for scale/features. Re-embed on model change (version embeddings).
- Also consider "agentic RAG" (model issues multiple searches) and whether long-context + prompt caching makes RAG unnecessary for small corpora (<~200k tokens).

### 7.2 Local-first & sync engines
- Local-first (Ink & Switch, 2019 essay): data lives on the client, UI reads/writes local DB instantly, sync in background; offline-capable; multi-device; collaboration.
- Tools landscape (2026, reported): **Zero** (Rocicorp; successor of Replicache — Replicache sunset; query-result replication with server-authoritative mutators; 1.0 reported mid-2026; offline writes limited), **ElectricSQL** (Postgres logical-replication read-path sync of "shapes" over HTTP; writes via your API), **PowerSync** (Postgres/Mongo/MySQL → client SQLite, write-back queue through your backend; mature), **TanStack DB** (client reactive collections over sync engines), **Triplit, InstantDB, Jazz, LiveStore**; CRDT libraries **Yjs** and **Automerge** for collaborative documents/text.
- Decision rules:
| Use local-first/sync when | Avoid when |
|---|---|
| Latency-sensitive, highly interactive apps (Linear/Figma-like), offline requirement (field work, mobile), real-time collaboration, multi-device drafts | Server-authoritative invariants dominate (payments, inventory, bookings needing global uniqueness), huge datasets that can't be partially replicated, complex per-row permissions that are hard to express as sync rules, simple CRUD admin tools |
- Architecture rules: server remains authority for validation/authorization (mutators re-run on server); define **partial replication scopes** (per user/tenant) that also enforce permissions; plan conflict resolution (LWW per field, CRDTs for text/lists, server rebase for business ops); schema migrations must handle old clients (versioned mutators); encryption at rest on device for sensitive data; plan storage quotas and eviction on clients.

### 7.3 Edge runtimes & rendering strategy
- Rendering choice per route: static (SSG) → ISR/revalidate → streaming SSR with RSC → client-side for highly interactive app shells. Default: server-render by default, hydrate small interactive islands.
- Edge compute is good for: middleware (auth checks, redirects, geolocation, A/B bucketing), personalization from cookies, caching/transformation, lightweight APIs over edge-native data (KV, D1, Turso/libSQL replicas, Durable Objects for per-entity state/coordination).
- Edge is bad for: heavy CPU, Node-native libraries, long-lived connections to a single-region DB, large memory work.
- Rule: co-locate compute with data; if data is single-region, compute should be too (regional serverless/containers), with CDN caching in front.

### 7.4 Server Components (recap of §2.5 as architecture)
- Architecture layers in an RSC app: `app/` routes (thin) → server components (data fetching via a **server-only data access layer** that performs authz) → client components (interactivity only) → server actions (mutations; validate + authorize + revalidate cache tags).
- Don't pass secrets or full DB rows as props to client components (they're serialized to the browser); use DTOs; React's `taintObjectReference`/`taintUniqueValue` can guard.
- Cache & revalidation are part of the data model: define cache tags per entity; revalidate on mutation.
- Keep framework deps patched (React2Shell CVE-2025-55182 showed RSC protocol deserialization is attack surface).

---

## 8. Recommendations: skill set structure for the new repo

Proposed skills (each: SKILL.md ≤ ~300–450 lines + `references/`), descriptions trigger-only:
| Skill | Description (trigger-only draft) | References |
|---|---|---|
| `clean-code` | Use when writing, reviewing, or refactoring any code — naming, function size, comments, error handling, duplication vs abstraction, code smells, "clean this up", "refactor", "is this readable". | `smells-refactorings.md`, `error-handling.md`, `language-idioms-{ts,python,kotlin,swift}.md`, `ousterhout-red-flags.md` |
| `design-patterns` | Use when considering or reviewing a design pattern (factory, strategy, observer, singleton, repository, DI…) or when code feels over- or under-abstracted. | `gof-modern.md`, `functional-patterns.md`, `anti-patterns.md` |
| `architecture-decisions` | Use when starting a new project/service/module, choosing structure (layered, hexagonal, clean, vertical slice, modular monolith, microservices, event-driven, CQRS), splitting a monolith, or writing ADRs/C4 diagrams. | `styles-decision-table.md`, `ddd.md`, `modular-monolith.md`, `adr-templates.md`, `c4-mermaid.md`, `fitness-functions.md`, `monorepo.md` |
| `frontend-architecture` | Use when structuring React/Next/Vue/Svelte/mobile UI code — components, hooks, state management, server components, server actions, feature-sliced design. | `react-patterns.md`, `rsc.md`, `fsd.md`, `state-machines.md` |
| `scalability-and-performance` | Use when code must handle more load, is slow, adds caching, touches DB queries/indexes/pagination, queues/background jobs, or needs capacity estimates. | `latency-numbers.md`, `estimation.md`, `caching.md`, `postgres-indexing.md`, `queues.md`, `sharding.md` |
| `reliability-and-resilience` | Use when calling external services/APIs/LLMs, adding retries/timeouts, handling failures, idempotency, distributed transactions, observability/SLOs, deployments, feature flags, or DB migrations. | `retries-timeouts.md`, `idempotency.md`, `outbox-saga.md`, `observability-otel.md`, `slo-alerting.md`, `zero-downtime-migrations.md`, `how-complex-systems-fail.md` |
| `api-design` | Use when designing or changing HTTP/GraphQL/gRPC/tRPC APIs, webhooks, pagination, error formats, versioning, or API auth. | `rest-conventions.md`, `problem-details.md`, `pagination.md`, `versioning.md`, `webhooks.md`, `owasp-api-top10.md`, `auth-oauth-passkeys.md` |
| `multi-tenancy` (maybe folded into data) | Use when building SaaS features with tenants/organizations/workspaces. | `rls.md` |
| `ai-native-apps` | Use when integrating LLM calls, agents, tool use, RAG, embeddings, evals, streaming responses, or AI cost/latency concerns. | `agent-patterns.md`, `rag.md`, `evals.md`, `llm-security.md`, `llm-observability.md` |
| `ai-code-guardrails` (always-on-ish, short) | Use before finishing any code change — self-review for over-engineering, duplication, missing error handling, N+1, unbounded queries, secrets, hallucinated dependencies. | `failure-modes.md`, `review-checklist.md` |
| `local-first-sync` (optional) | Use when building offline-capable, real-time collaborative, or sync-engine-based apps. | `sync-engines.md`, `crdts.md` |

Writing guidance for SKILL.md bodies (from repo analysis):
- Lead with **"Default decisions"** (the 80% answer) before nuance: e.g., "Default: modular monolith, Postgres, REST+OpenAPI, cursor pagination, RFC 9457 errors, OTel."
- Each rule is imperative + reason in ≤2 lines; decision tables for choices; checklists for review; explicit **"Do NOT"** lists (agents respond well to explicit prohibitions tied to reasons).
- Include "**Escalate/ask the user when**" triggers: new infrastructure, public API breaking change, data migration on large tables, auth model change, microservice extraction.
- Include short, correct code snippets in TS + Python (and Kotlin/Swift where idioms differ) in references, not in the main body.
- Keep numbers in one reference file to avoid inconsistencies.
- Test skills with realistic prompts ("add caching to this endpoint", "build a SaaS backend", "make this service resilient") and check for the failure modes in §6 — follow skill-creator's eval loop.

---

## 9. Checklists (ready to paste into skills)

### 9.1 Pre-implementation design checklist
- [ ] Read existing structure, conventions, ADRs, CLAUDE.md/AGENTS.md
- [ ] Stated requirements incl. non-functional (latency, load, consistency, security, cost); numbers estimated
- [ ] Simplest design meeting them identified; alternatives + trade-offs noted
- [ ] One-way doors identified (data model, public API, new infra) → ADR drafted / user consulted
- [ ] Module ownership decided (where does this code live; which module owns the data)
- [ ] Failure modes considered (dependency down/slow, duplicate requests, partial failure)
- [ ] Security: authn/authz points, input validation, secrets, tenant isolation
- [ ] Observability: logs/metrics/traces for the new path
- [ ] Test plan (which levels, what fakes)
- [ ] Rollout plan (flags, migration order, backward compatibility)

### 9.2 Code review / self-review checklist (before "done")
Design & simplicity: [ ] no speculative abstraction/config · [ ] reused existing helpers · [ ] matches codebase conventions · [ ] minimal diff; no unrelated changes · [ ] deep modules, no pass-throughs
Correctness: [ ] edge cases (empty, null, large, unicode, time zones, concurrency) · [ ] errors handled or propagated with context; none swallowed · [ ] async awaited; resources closed
Data: [ ] no N+1 · [ ] bounded queries & pagination · [ ] indexes for new query patterns · [ ] constraints enforce invariants · [ ] transactions short, no network calls inside · [ ] migrations backward-compatible
Resilience: [ ] timeouts on all network calls · [ ] retries only transient + idempotent, backoff+jitter · [ ] idempotency for POST side effects/consumers
Security: [ ] authz check per object (BOLA) · [ ] input validated at boundary; output DTOs · [ ] parameterized queries; no raw HTML injection · [ ] no secrets in code/logs/client bundles · [ ] new dependencies verified real, maintained, pinned
Tests: [ ] behavior tests fail when code breaks · [ ] no weakened/skipped tests · [ ] deterministic
Ops: [ ] structured logs with trace IDs; no PII · [ ] metrics/traces for new external calls · [ ] config via env, validated at startup · [ ] docs/ADR updated
Cleanup: [ ] no dead code, debug prints, commented-out code, placeholder stubs, narrating comments

### 9.3 New external dependency / infrastructure checklist
- [ ] Requirement that existing stack (esp. Postgres) can't meet, with numbers
- [ ] Package exists on registry, canonical name, maintained (recent releases), license OK, downloads/popularity sane, no typosquat
- [ ] Operational cost: HA, backups, monitoring, upgrades, security patching, on-call
- [ ] Failure mode & fallback when it's down
- [ ] ADR written

### 9.4 Data model checklist
- [ ] Primary keys (UUIDv7/bigint identity), `created_at`/`updated_at` (timestamptz, UTC)
- [ ] Foreign keys + indexes on FK columns; unique constraints for business uniqueness (tenant-scoped)
- [ ] NOT NULL by default; CHECK constraints; enums via check/lookup tables (extensible)
- [ ] Money: integer minor units or `numeric`; never float
- [ ] Soft delete only if required (and partial indexes/unique constraints account for it)
- [ ] `tenant_id` + RLS for multi-tenant data
- [ ] Optimistic locking `version` where concurrent edits occur
- [ ] PII classified; retention/deletion plan; encryption for sensitive fields

### 9.5 Resilience checklist for any outbound call (HTTP, DB, queue, LLM)
- [ ] Connect + request timeout; deadline propagated
- [ ] Retry policy: which errors, max attempts, full-jitter backoff, respects Retry-After, single layer, budget
- [ ] Idempotency key for side effects
- [ ] Circuit breaker/bulkhead for critical-path dependencies
- [ ] Fallback/degraded behavior defined
- [ ] Metrics (latency histogram, error rate) + trace span
- [ ] Response validated (schema) as untrusted input

### 9.6 API endpoint checklist
- [ ] Resource naming, method semantics, status codes per §5.2
- [ ] Request DTO validation (allow-list), response DTO (no internal fields)
- [ ] AuthN + object-level AuthZ + function-level AuthZ
- [ ] Pagination (cursor), max limits, payload size limit, rate limit
- [ ] RFC 9457 errors with stable `type`/`code`, trace ID
- [ ] Idempotency-Key for non-idempotent creates/actions
- [ ] ETag/If-Match for concurrent updates
- [ ] OpenAPI/schema updated; backward compatible or new version; deprecation headers
- [ ] Contract/integration tests incl. unauthorized and cross-tenant cases

---

## 10. Language idiom quick notes (TS / Python / Kotlin / Swift) for references
- **TypeScript**: `strict: true` (+ `noUncheckedIndexedAccess`); discriminated unions + exhaustive `never` checks; `unknown` over `any`; validate external data with Zod/Valibot/ArkType and infer types; `readonly`/`as const`; ES modules with explicit public `index.ts`; avoid classes where modules + functions suffice; branded types for IDs; `using` for disposables; lint: typescript-eslint strict-type-checked, `no-floating-promises`, `consistent-type-imports`; Biome/ESLint + Prettier.
- **Python**: type hints everywhere + mypy/pyright strict; `@dataclass(frozen=True, slots=True)` or Pydantic v2 models at boundaries; `Protocol` for ports (structural typing); `Enum`/`Literal` + `match`; context managers; `asyncio.TaskGroup`/`anyio`; don't use mutable default args; ruff for lint+format; uv for env/deps; `pathlib`; raise specific exceptions, chain with `from`; avoid deep class hierarchies; modules as singletons.
- **Kotlin**: `val` and immutable collections by default; `data class`, `sealed interface` + exhaustive `when`; null safety (avoid `!!`); extension functions sparingly; named/default args instead of builders; `object` for true singletons; coroutines with structured concurrency (no `GlobalScope`), `Flow` for streams; `Result`/Arrow `Either` for expected failures; `internal` visibility for module boundaries; Konsist/ArchUnit for architecture tests; detekt/ktlint.
- **Swift**: value types (`struct`, `enum` with associated values) by default; `final class` when reference semantics needed; protocols + generics/`some`/`any` (prefer `some`); Swift 6 strict concurrency — `Sendable`, actors, `@MainActor` for UI; `async/await`, structured `TaskGroup`; typed throws (Swift 6) for domain errors; `Result` at boundaries; SwiftUI: small views, `@Observable` (Observation framework) models, unidirectional data flow (TCA optional—heavy); SwiftPM modules to enforce boundaries; follow Swift API Design Guidelines.

---

## 11. Key quotations / heuristics worth embedding (short)
- "The greatest limitation in writing software is our ability to understand the systems we are creating." — Ousterhout
- "Duplication is far cheaper than the wrong abstraction." — Sandi Metz
- "Make the change easy (warning: this may be hard), then make the easy change." — Kent Beck
- "Solve the problem you know needs to be solved now, not the problem you speculate might need to be solved in the future." — Google Engineering Practices (paraphrased)
- "Almost all the successful microservice stories have started with a monolith that got too big and was broken up." — Fowler, MonolithFirst
- "Before implementing any pattern always analyze if benefit given by using it worth extra code complexity." — domain-driven-hexagon
- "Change introduces new forms of failure." / "Post-accident attribution to a 'root cause' is fundamentally wrong." — Richard Cook
- "Everyone has a plan until they get punched in the mouth" → design fallbacks: "Hope is not a strategy." — SRE maxim
- "Parse, don't validate." — Alexis King

---

## 12. Sources

Cloned repositories (read locally, `$SCRATCH/refs5/`):
- donnemartin/system-design-primer — latency numbers, powers of two, caching/consistency/availability sections: https://github.com/donnemartin/system-design-primer
- ByteByteGoHq/system-design-101 — cache failure modes, caching strategies, pagination, retries, API guides: https://github.com/ByteByteGoHq/system-design-101
- sairyss/domain-driven-hexagon — hexagonal+DDD guide, pros/cons, "recommendations for smaller APIs", enforcing architecture with dependency-cruiser: https://github.com/Sairyss/domain-driven-hexagon
- microsoft/api-guidelines (Azure REST guidelines: idempotency, repeatability headers, LRO, conditional requests, versioning): https://github.com/microsoft/api-guidelines
- google/eng-practices (code review: design, complexity/over-engineering, tests, naming, comments): https://github.com/google/eng-practices
- joelparkerhenderson/architecture-decision-record (+ its ADR skill): https://github.com/joelparkerhenderson/architecture-decision-record
- heroku/12factor: https://github.com/heroku/12factor
- ryanmcdermott/clean-code-javascript: https://github.com/ryanmcdermott/clean-code-javascript ; zedr/clean-code-python: https://github.com/zedr/clean-code-python
- binhnguyennus/awesome-scalability: https://github.com/binhnguyennus/awesome-scalability
- anthropics/skills (skill-creator guidance): https://github.com/anthropics/skills
- obra/superpowers (writing-skills: trigger-only descriptions, token efficiency): https://github.com/obra/superpowers
- wondelai/skills: https://github.com/wondelai/skills ; keez97/claude-architecture-skills: https://github.com/keez97/claude-architecture-skills ; nathankim0/clean-architecture-skills: https://github.com/nathankim0/clean-architecture-skills ; 45ck/software-architecture-skills: https://github.com/45ck/software-architecture-skills ; yonatankarp/software-design-skills: https://github.com/yonatankarp/software-design-skills
- Also seen in search: davila7/claude-code-templates software-architecture skill; ericgandrade/claude-superskills senior-solution-architect; codewithmukesh/dotnet-claude-kit clean-architecture; ComposioHQ/travisvn/BehiSecc awesome-claude-skills lists.

Web sources:
- Veracode 2025 GenAI Code Security Report: https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/ ; https://www.veracode.com/blog/genai-code-security-report/
- GitClear AI code quality: https://www.gitclear.com/the_ai_code_quality_maintainability_gap ; LeadDev coverage: https://leaddev.com/ai/code-maintainability-plummets-in-the-ai-coding-era
- Investigating the Smells of LLM Generated Code: https://arxiv.org/abs/2510.03029 ; AI-Generated Smells: https://arxiv.org/html/2605.02741v1
- Package hallucinations (USENIX Sec 2025): https://arxiv.org/abs/2406.10279 ; 2026 re-evaluation: https://arxiv.org/pdf/2605.17062 ; Socket slopsquatting: https://socket.dev/blog/slopsquatting-targets-across-frontier-llms
- DORA 2025 report: https://dora.dev/dora-report-2025/ ; https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report
- RFC 9457 Problem Details: https://www.rfc-editor.org/rfc/rfc9457.html
- OAuth 2.1 status: https://workos.com/blog/oauth-2-1-whats-new ; https://blog.logto.io/oauth-2-1
- OWASP API Security Top 10 2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- IETF Idempotency-Key draft: https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header ; RateLimit headers draft: https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/
- Standard Webhooks spec: https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md
- NIST SP 800-63-4 summaries: https://www.strongdm.com/blog/nist-password-guidelines ; https://netwrix.com/en/resources/blog/nist-password-guidelines/
- AWS Exponential Backoff and Jitter: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
- Google SRE Workbook, Alerting on SLOs: https://sre.google/workbook/alerting-on-slos/
- OpenTelemetry GenAI observability (2026): https://opentelemetry.io/blog/2026/genai-observability/ ; status note: https://dev.to/azena-ai/opentelemetrys-genai-semantic-conventions-are-not-stable-yet-heres-what-actually-shipped-in-2026-3mke
- Testing Trophy: https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications ; web.dev test strategies: https://web.dev/articles/ta-strategies
- Feature-Sliced Design: https://feature-sliced.design/docs/reference/layers
- React2Shell CVE-2025-55182: https://www.microsoft.com/en-us/security/blog/2025/12/15/defending-against-the-cve-2025-55182-react2shell-vulnerability-in-react-server-components/ ; https://vercel.com/kb/bulletin/react2shell ; Next.js security guide: https://nextjs.org/blog/security-nextjs-server-components-actions
- Local-first 2026: https://www.smashingmagazine.com/2026/05/architecture-local-first-web-development/ ; https://kanopylabs.com/blog/tanstack-db-vs-electricsql-vs-zero-sync
- Anthropic, Building Effective Agents: https://www.anthropic.com/engineering/building-effective-agents
- RAG practices: https://atlan.com/know/advanced-rag-techniques/ ; RAG evals: https://atlan.com/know/how-to-evaluate-rag-systems-explained/
- Richard Cook, How Complex Systems Fail: https://how.complexsystems.fail/ ; Adrian Colyer summary: https://blog.acolyer.org/2016/02/10/how-complex-systems-fail/
- PACELC: https://en.wikipedia.org/wiki/PACELC_design_principle ; Abadi paper: http://cs-www.cs.yale.edu/homes/dna/papers/abadi-pacelc.pdf
- Outbox (CDC vs polling): https://dev.to/gabrielanhaia/outbox-pattern-when-cdc-beats-polling-when-polling-beats-cdc-4dj4 ; https://www.conduktor.io/glossary/outbox-pattern-for-reliable-event-publishing
- Fowler Refactoring 2nd ed.: https://martinfowler.com/articles/refactoring-2nd-ed.html ; code smells reference: https://sammancoaching.org/reference/code_smells/
- Dan Abramov, The WET Codebase: https://www.deconstructconf.com/2019/dan-abramov-the-wet-codebase
- Ousterhout red flags summaries: https://www.sglavoie.com/posts/2025/03/30/book-summary-philosophy-software-design-2nd-edition/ ; https://lethain.com/notes-philosophy-software-design/
- Monolith vs microservices 2026: https://thenewstack.io/return-of-the-monolith-amazon-dumps-microservices-for-video-monitoring/ ; https://www.javacodegeeks.com/2026/02/the-death-of-microservices-hype-when-modular-monoliths-win.html ; https://dev.to/x4nent/the-modular-monolith-2026-complete-guide-spring-modulith-archunit-fitness-functions-and-lessons-878
- Connection pool sizing: https://dev.to/gabrielanhaia/connection-pool-sizing-in-2026-the-formula-and-the-footguns-16hg ; PgBouncer config: https://www.pgbouncer.org/config.html ; Neon pooling: https://neon.com/docs/connect/connection-pooling
- Zero-downtime Postgres migrations: https://dev.to/ahmed_mahmoud360/zero-downtime-postgres-migrations-field-notes-on-expandcontract-locktimeout-and-the-alter-3d3m ; pgroll: https://neon.com/guides/pgroll
- Multi-tenancy with RLS: https://www.thenile.dev/blog/multi-tenant-rls ; https://clickhouse.com/resources/engineering/multi-tenant-saas-postgres-architecture
- API style comparison: https://wundergraph.com/blog/graphql-vs-federation-vs-trpc-vs-rest-vs-grpc-vs-asyncapi-vs-webhooks ; https://pockit.tools/blog/rest-graphql-trpc-grpc-api-comparison-2026/
- Rate limiting algorithms: https://blog.arcjet.com/rate-limiting-algorithms-token-bucket-vs-sliding-window-vs-fixed-window/ ; https://redis.io/tutorials/howtos/ratelimiting/
- Fitness functions: https://www.oreilly.com/library/view/building-evolutionary-architectures/9781492097532/ch04.html ; https://github.com/yonatankarp/software-design-skills/blob/main/plugins/architecture-patterns/skills/arch-fitness-functions/SKILL.md
- C4 model: https://www.infoq.com/articles/C4-architecture-model/
- Durable execution / sagas: https://www.kai-waehner.de/blog/2025/06/05/the-rise-of-the-durable-execution-engine-temporal-restate-in-an-event-driven-architecture-apache-kafka/ ; https://www.dbos.dev/blog/postgres-is-all-you-need-for-durable-execution
- Postgres queues (SKIP LOCKED): https://www.prisma.io/blog/you-dont-need-a-job-queue-postgres-already-has-skip-locked ; https://www.conduktor.io/glossary/kafka-vs-postgres
- Edge runtimes 2026: https://www.pkgpulse.com/guides/cloudflare-workers-vs-vercel-edge-vs-aws-lambda-2026 ; https://www.kunalganglani.com/blog/cloudflare-workers-vs-vercel-2026
- LLM app architecture/gateways: https://mlflow.org/articles/llm-application-architecture-a-2026-engineers-guide/ ; https://www.digitalapplied.com/blog/llm-gateway-architecture-2026-engineering-reference
- Additional canonical references (from knowledge, not fetched this session): Fowler bliki (MonolithFirst, MicroservicePrerequisites, CQRS, Yagni, StranglerFigApplication, FeatureToggles by Pete Hodgson); Vaughn Vernon "Effective Aggregate Design"; Jimmy Bogard "Vertical Slice Architecture"; Alistair Cockburn "Hexagonal Architecture"; Michael Nygard "Release It!" 2nd ed. and "Documenting Architecture Decisions"; Kleppmann "Designing Data-Intensive Applications"; Google SRE Book; react.dev "You Might Not Need an Effect"; Peter Norvig "Design Patterns in Dynamic Languages" (1996); Sandi Metz "The Wrong Abstraction" (2016); Kent C. Dodds "AHA Programming"; Dan North "CUPID"; Alexis King "Parse, don't validate"; Ink & Switch "Local-first software" (2019); OWASP Top 10 for LLM Applications 2025; RFC 9700 (OAuth 2.0 Security BCP), RFC 9449 (DPoP), RFC 9728 (Protected Resource Metadata), RFC 9745 (Deprecation header), RFC 8594 (Sunset), RFC 7396 (JSON Merge Patch).
