# Composition, Inheritance, and Polymorphism

Use this file when replacing an inheritance hierarchy, choosing between polymorphism, a sum type with `switch`, and data-oriented code, or checking a subtype against the Liskov principle.

## Contents
1. What inheritance costs
2. From inheritance to composition (worked example)
3. Null Object: absence as a role
4. When inheritance is the right tool
5. Liskov in practice, with a contract test
6. The expression problem: switch vs dispatch
7. Data-oriented variant for hot paths

## 1. What inheritance costs

- **It couples to implementation, not just interface.** A subclass depends on when and how the base calls its own methods (the fragile base class problem). A change to a middle class can break subclasses you have not read.
- **It stacks cognitive load.** Zakirullin's "inheritance nightmare": `AdminController extends UserController extends GuestController extends BaseController`. To understand one behavior you hold four classes in working memory, and working memory holds about four chunks.
- **It explodes with independent variation.** Two aspects that vary (ordering × formatting) need a subclass per combination.
- **The canon agrees.** The Gang of Four: "favor object composition over class inheritance". Joshua Bloch (*Effective Java*): design and document for inheritance or else prohibit it. Language defaults moved the same way: Kotlin classes are final unless `open`; Swift pushes `struct` + protocols and `final class`; Go and Rust have no implementation inheritance.

## 2. From inheritance to composition (worked example)

Sandi Metz's "Nothing is Something" talk uses a cumulative nursery rhyme ("This is the house that Jack built"). The first variant, `RandomHouse`, shuffles lines; the second, `EchoHouse`, repeats each line. A third request, random *and* echo, forces either a `RandomEchoHouse` subclass or duplication.

The move:

1. **Make the variants look the same** so the difference stands out: both change *how the lines are ordered*, and *how each line is formatted*.
2. **Name each difference as a role:** `Orderer` (default, random) and `Formatter` (default, echo).
3. **Inject the roles** into one `House` class.

```ts
type Orderer = (lines: string[]) => string[];
type Formatter = (line: string) => string;

const defaultOrder: Orderer = (lines) => lines;
const randomOrder: Orderer = (lines) => shuffle(lines);
const plain: Formatter = (line) => line;
const echo: Formatter = (line) => `${line} ${line}`;

class House {
  constructor(private order: Orderer = defaultOrder, private format: Formatter = plain) {}
  recite(): string { return this.order(LINES).map(this.format).join("\n"); }
}

new House(randomOrder, echo); // the combination needs no new class
```

Two roles with two implementations each give four behaviors from one class and four functions, and a third role costs one parameter, not a doubling of subclasses. In TS, Kotlin, Swift, and Python, single-method roles are function types; use an interface when the role has several methods or state.

**Template Method → function parameters.** A base class with abstract hook methods is usually clearer as a function that takes the hooks as arguments (`exportReport(rows, { header, formatRow })`).

## 3. Null Object: absence as a role

Scattered `if (x == null)` checks mean "no x" is behavior the code hasn't modeled. Give absence its own implementation of the same role:

```kotlin
interface DiscountPolicy { fun apply(total: Money): Money }
object NoDiscount : DiscountPolicy { override fun apply(total: Money) = total }
// callers always hold a DiscountPolicy; no null checks
```

Use it when "nothing" has a sensible default behavior. When absence must be handled differently by each caller, use an optional type with an early return or an explicit "absent" variant of a sum type instead.

## 4. When inheritance is the right tool

| Case | Example | Keep it safe by |
|---|---|---|
| Closed sum type | Kotlin `sealed interface Payment`, Java `sealed interface` + `record`s, Swift `enum` with associated values, TS discriminated union | Exhaustive `when`/`switch`; no behavior shared through the base |
| Framework hook | Android `Activity`, `UIViewController`, Django class-based views, React error boundary | Thin subclass; logic lives in injected plain objects |
| Designed extension point, one level | A base class with documented hook methods and tests for each hook | `final`/`sealed` everywhere else; passes the Liskov checklist |

Also acceptable: exception hierarchies, which are shallow sum types in languages that dispatch `catch` by type. Sean Parent ("Inheritance Is the Base Class of Evil") shows a further option in C++ and similar languages: runtime polymorphism through value types and type erasure, so client types need no common base at all.

## 5. Liskov in practice, with a contract test

The checklist in SKILL.md comes from Liskov and Wing's behavioral subtyping (1994). Common violations agents write:

| Violation | Looks like | Fix |
|---|---|---|
| Stronger precondition | `CachedRepo.find(id)` rejects IDs the base accepts | Accept the same inputs; handle internally |
| Weaker postcondition | `FastSorter.sort` returns "mostly sorted" output | Different contract → different interface |
| Broken history | `MutableSquare` changing width alone | Don't subtype; model both as values |
| Refused bequest | `ReadOnlyFile.write()` throws | Split `Readable`/`Writable` roles |
| Caller type checks | `if (repo instanceof S3Repo) repo.flush()` | Put `flush` in the role, or don't substitute |

A **contract test** makes the checklist executable:

```python
class StorageContract:
    """Mixin: every Storage implementation must pass these."""
    def make_storage(self) -> Storage: raise NotImplementedError

    def test_get_returns_what_was_put(self):
        s = self.make_storage()
        s.put("k", b"v")
        assert s.get("k") == b"v"

    def test_get_missing_returns_none(self):
        assert self.make_storage().get("missing") is None

class TestInMemoryStorage(StorageContract):
    def make_storage(self): return InMemoryStorage()

class TestS3Storage(StorageContract):  # integration: runs against a local S3 emulator
    def make_storage(self): return S3Storage(bucket=test_bucket())
```

The same suite running against the fake and the real adapter is what keeps fakes from drifting away from reality.

## 6. The expression problem: switch vs dispatch

Every design with several variants and several operations makes one axis cheap to extend and the other expensive:

| | Add a new **variant** | Add a new **operation** |
|---|---|---|
| Interface + one class per variant | One new class; no existing code changes | Touch every class |
| Sum type + exhaustive `switch` per operation | Touch every `switch` (the compiler lists them) | One new function; no existing code changes |

*Clean Code* chapter 6 makes the same point about objects vs data structures. In their 2023 written exchange, Robert Martin summarized his position as: use polymorphism when types change faster than operations, and switches when operations change faster than types. Casey Muratori argued that, for his operating-system driver example, enums and switches were better "along every axis" — faster, easier to read, write, and debug — and that the savings in programmer time claimed for class hierarchies were not demonstrated. Martin accepted that switches and dynamic polymorphism each have their place: go dynamic when you need the flexibility and can afford it. They did not converge further.

Decision procedure:
1. **Who adds variants?** You, rarely → sum type. Other teams, plugins, runtime-loaded modules → interface.
2. **What is added more often?** New operations (validate, render, price, export) → sum type. New variants with stable operations → interface.
3. **Does the language check exhaustiveness?** Kotlin `when` on sealed types, Swift `switch` on enums, Rust `match`, TS with `never` checks, Java `switch` over sealed types, Python `match` with a type checker. If not, the sum-type approach needs a lint rule or a default branch that fails loudly.
4. **One variant?** Neither. Write the concrete code.

```ts
type Shape =
  | { kind: "circle"; r: number }
  | { kind: "rect"; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "rect":   return s.w * s.h;
    default: { const _exhaustive: never = s; return _exhaustive; }
  }
}
// Adding perimeter(): one new function. Adding "triangle": the compiler flags every switch.
```

## 7. Data-oriented variant for hot paths

When profiling shows a loop over many items dominating (per-frame, per-pixel, per-row), design around the data layout instead of per-item objects:

- Store homogeneous items in arrays of plain data (struct-of-arrays when fields are processed separately).
- Group items by kind and process each group in one tight loop, or dispatch through a lookup table instead of per-item virtual calls.
- Mike Acton's rule of thumb: where there is one, there are many — write the function for the batch.
- Keep the object-style API at the boundary if callers need it; the inner loop stays flat.
- Leave a comment stating the measurement that justified the layout, so nobody "cleans it up" later.

Muratori's "Clean Code, Horrible Performance" (2023) reported roughly 15× speedups from switch- and table-based versions of a shape-area loop; the magnitude is specific to that benchmark, but the direction holds for tight loops. Outside measured hot paths, choose for clarity and change rate.

## Sources

- Sandi Metz, "Nothing is Something" (RailsConf 2015): https://www.youtube.com/watch?v=OMPfEXIlTVE · notes: https://dgmstuart.github.io/conference-notes/bathruby-2015/2015-03-13-sandi-metz-nothing-is-something-at-bathruby/
- Sandi Metz, "All the Little Things" (RailsConf 2014): https://www.youtube.com/watch?v=8bZh5LMaSmE
- Gamma, Helm, Johnson, Vlissides, *Design Patterns* (1994); Joshua Bloch, *Effective Java* (3rd ed.)
- Barbara Liskov and Jeannette Wing, "A Behavioral Notion of Subtyping" (1994)
- Artem Zakirullin, "Cognitive load is what matters" (CC BY 4.0): https://github.com/zakirullin/cognitive-load
- Sean Parent, "Inheritance Is The Base Class of Evil" (GoingNative 2013): https://learn.microsoft.com/en-us/shows/goingnative-2013/inheritance-base-class-of-evil
- Robert C. Martin and Casey Muratori, Clean Code discussion: https://github.com/cmuratori/misc/blob/main/cleancodeqa.md · https://github.com/cmuratori/misc/blob/main/cleancodeqa-2.md
- Casey Muratori, "Clean Code, Horrible Performance" (2023): https://www.computerenhance.com/p/clean-code-horrible-performance
- Mike Acton, "Data-Oriented Design and C++" (CppCon 2014): https://www.youtube.com/watch?v=rX0ItVEVjHc
