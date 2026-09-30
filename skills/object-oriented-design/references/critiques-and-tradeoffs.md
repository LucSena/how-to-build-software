# Critiques of OOP and How to Resolve the Trade-offs

Use this file when someone argues OOP vs FP, rich vs anemic models, or clean code vs performance, or when a hot path suggests data-oriented design. The aim is not to pick a side but to name which cost model applies in this codebase and choose accordingly.

## Contents
1. What the critics and defenders actually claim
2. Rich vs anemic models, resolved
3. OOP and FP together: functional core, imperative shell
4. When data-oriented design wins
5. Tension map for object design
6. How to argue a design choice in review

## 1. What the critics and defenders actually claim

| Voice | Core claim | Take for everyday work |
|---|---|---|
| Alan Kay (coined "OOP") | The big idea was messaging, local retention and hiding of state, and late binding — not classes | Design by messages and encapsulated state; don't treat "has classes" as "is object-oriented" |
| Robert Martin, "OO vs FP" (2014) | Objects are bags of functions, not bags of data; the design principles apply in either paradigm | Encapsulation is about behavior; a class of public fields is a data structure, so treat it as one |
| Casey Muratori, "Clean Code, Horrible Performance" (2023) | Following "clean" rules (polymorphism over switch, tiny functions, hiding internals) in a shape-area loop was far slower; switch and table versions were reported around 15× faster | In measured hot loops, use flat data, switches, tables, and batching. Elsewhere, measure before trading clarity |
| Martin's reply (2023 exchange) | Most systems use little CPU; conserving programmer cycles usually matters more; polymorphism when types change faster than operations, switch otherwise | State the cost model: CPU-bound hot path or change-bound business code |
| Mike Acton, "Data-Oriented Design and C++" (CppCon 2014) | Programs exist to transform data; design around the data and how it is accessed, not a model of the world | For bulk processing, design the data layout first; "where there is one, there are many" |
| Brian Will, "Object-Oriented Programming is Bad" (2016) | Forcing everything into small encapsulated units creates artificial coupling for control flow; abstract data types remain useful | Plain functions in modules are a legitimate default; use classes for ADTs and invariants |
| Steve Yegge, "Execution in the Kingdom of Nouns" (2006) | Java-style OO forces verbs to be owned by nouns, producing `Manager` and `Executor` classes | A one-method `-er` class is usually a function |
| John Carmack, "On Inlined Code" (2007, republished 2014) | Large objects hide what their methods mutate; straight-line code shows the real order of state changes | Prefer pure functions; keep single-use steps inline and sectioned rather than scattered across methods |
| Rich Hickey, "Simple Made Easy" (2011) | Objects braid state, identity, and time together ("complecting") | Keep values immutable; manage the few mutable references explicitly |
| Artem Zakirullin, "Cognitive load is what matters" | Deep inheritance, many shallow classes, and layer rituals raise extraneous load | Fewer, deeper classes; composition; layers only where they hide something |

What survives all of these: **encapsulate invariants, compose behavior, keep most logic in functions over values, and use dynamic dispatch where variation is open.** What does not survive: class-per-noun modeling, inheritance for reuse, and indirection layers with nothing behind them.

## 2. Rich vs anemic models, resolved

- **Fowler, "AnemicDomainModel" (2003):** entities with only getters/setters plus services holding all the logic go against the core idea of objects, which is to combine data and the process that uses it. He ties rich models to complex domains; in *Patterns of Enterprise Application Architecture*, simple logic is served well by a Transaction Script.
- **Scott Wlaschin, *Domain Modeling Made Functional* (2018):** separate immutable data types from pure functions, and get correctness from types (sum types, smart constructors) instead of encapsulation.
- **They agree on the invariant:** one authoritative place for each business rule, and illegal states that can't be constructed.

| Domain | Default |
|---|---|
| Simple CRUD (forms, admin, pass-through APIs) | Transaction script: handler → schema validation → persistence. No domain service layer |
| Complex invariants that change together (order lifecycle, ledger, scheduling with overlap rules) | A rich aggregate class **or** a module of pure functions over a sum-typed state — pick the codebase's idiom |
| Mixed | Rich where the rules are, scripts elsewhere; don't make every entity rich for consistency's sake |

The failure to avoid in both styles: logic about `X` living in `XService`, `XManager`, and `XHelper`, each re-checking `X`'s rules.

## 3. OOP and FP together: functional core, imperative shell

Gary Bernhardt's "Boundaries" (2012) gives the arrangement that lets both paradigms coexist inside an OO language:

```
shell (objects): load inputs (DB, HTTP, clock, env) → call core → perform effects (write, send, log)
core (values + functions): decide(state, input, now) → (newState, effects[])
```

- The core has many paths and no dependencies, so it is unit-tested without doubles.
- The shell has few paths and many dependencies, so a few integration tests cover it.
- Objects live mostly in the shell: adapters, resources, repositories, the composition root. The core is values and functions, or small value objects with methods.
- Boundaries between components pass **values**, not live objects: values can be queued, stored, compared, and logged.
- When the decision logic is complex, return effects as data (`[{ type: "send_email", to, template }]`) and let the shell execute them.

## 4. When data-oriented design wins

Choose a data-oriented layout (arrays of plain records, grouped by kind, processed in batches) when **all** of these hold:
- A profiler shows the loop is a real share of runtime or latency budget.
- It processes many similar items per call (thousands or more), or runs per frame, per row, or per request at high volume.
- The operations are stable enough that switching over kinds is not a maintenance burden.

Keep an object-shaped API at the boundary if callers need it, and write down the measurement in a comment next to the layout. If the profiler does not point there, clarity wins.

## 5. Tension map for object design

| Tension | Side A | Side B | Rule |
|---|---|---|---|
| Polymorphism vs switch | GRASP, *Clean Code*: replace conditionals with polymorphism | Muratori, Hickey: switches, tables, "polymorphism à la carte" | Expression-problem table: closed set with growing operations → switch; open set with stable operations → dispatch |
| Encapsulation vs plain data | Objects hide data behind behavior | FP and data-oriented design expose data to functions | Hide data when there is an invariant; expose it when it is a message or a record |
| Tell, don't ask vs queries | Push behavior into objects | Fowler: co-location is the real point; queries are fine | Put decisions with data; keep formatting and reporting outside |
| Small classes vs deep classes | SRP read as "one thing" | Ousterhout, Zakirullin: many shallow classes raise load | One reason to change (one stakeholder), with a small interface over real work |
| DI everywhere vs directness | Inject all collaborators | Grug, cognitive load: indirection costs readers | Inject I/O and non-determinism; call pure code directly |
| Rich vs anemic | Fowler | Wlaschin, transaction scripts | Section 2 table |

## 6. How to argue a design choice in review

- Name the **cost model**: change-bound (how often does this change, by whom) or CPU-bound (measured profile).
- Name the **axis of change**: new variants or new operations.
- Count **real implementations**, not imagined ones.
- Point to **evidence in the code** (file:symbol) rather than a principle name. "SOLID says so" is not an argument; "adding a provider touched these six files last quarter" is.
- Offer the **simpler alternative** and its revisit trigger.

## Sources

- Alan Kay, email to Stefan Ram on the meaning of OOP (2003): http://userpage.fu-berlin.de/~ram/pub/pub_jf47ht81Ht/doc_kay_oop_en
- Robert C. Martin, "OO vs FP" (2014): https://blog.cleancoder.com/uncle-bob/2014/11/24/FPvsOO.html
- Casey Muratori, "Clean Code, Horrible Performance" (2023): https://www.computerenhance.com/p/clean-code-horrible-performance
- Robert C. Martin and Casey Muratori, discussion: https://github.com/cmuratori/misc/blob/main/cleancodeqa.md · https://github.com/cmuratori/misc/blob/main/cleancodeqa-2.md
- Mike Acton, "Data-Oriented Design and C++" (CppCon 2014): https://www.youtube.com/watch?v=rX0ItVEVjHc
- Brian Will, "Object-Oriented Programming is Bad" (2016): https://www.youtube.com/watch?v=QM1iUe6IofM
- Steve Yegge, "Execution in the Kingdom of Nouns" (2006): https://steve-yegge.blogspot.com/2006/03/execution-in-kingdom-of-nouns.html
- John Carmack, "On Inlined Code": http://number-none.com/blow/john_carmack_on_inlined_code.html
- Rich Hickey, "Simple Made Easy" (2011): https://www.infoq.com/presentations/Simple-Made-Easy
- Artem Zakirullin, "Cognitive load is what matters" (CC BY 4.0): https://github.com/zakirullin/cognitive-load
- Martin Fowler, "AnemicDomainModel": https://martinfowler.com/bliki/AnemicDomainModel.html
- Scott Wlaschin, *Domain Modeling Made Functional* (2018)
- Gary Bernhardt, "Boundaries" (SCNA 2012): https://www.destroyallsoftware.com/talks/boundaries
