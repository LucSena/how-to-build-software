# Object-Oriented Design per Language

Use this file when writing classes, interfaces, value types, sum types, or dependency wiring in a specific language. It covers only the object-design side; naming, errors, and general idioms are in `clean-code` (`references/language-idioms.md`). When the codebase already has a convention that differs, follow the codebase.

## Contents
1. Quick matrix
2. TypeScript
3. Python
4. Kotlin
5. Swift
6. Go
7. Java
8. C#

## 1. Quick matrix

| | Interfaces | Closed sum type | Value type | Default DI |
|---|---|---|---|---|
| TypeScript | Structural `type`/`interface` at the consumer | Discriminated union + `never` check | `readonly` + factory, branded IDs | Factory functions with a `deps` object |
| Python | `typing.Protocol` (structural) or `abc.ABC` | Union of dataclasses + `match` | `@dataclass(frozen=True, slots=True)` | Constructor args; module functions with params |
| Kotlin | Nominal `interface`, `fun interface` | `sealed interface` + `when` | `data class`, `@JvmInline value class` | Primary constructor; Hilt/Koin on Android if present |
| Swift | Nominal `protocol` + extensions | `enum` with associated values + `switch` | `struct` | `init` parameters |
| Go | Structural, implicit, at the consumer | Interface + type switch (no exhaustiveness check) | Struct with unexported fields + `New…` | Struct fields set in `main` |
| Java | Nominal `interface` | `sealed interface` + `record`s + pattern `switch` | `record` | Constructor injection; Spring if present |
| C# | Nominal `interface` | Abstract record + sealed derived records + `switch` expression | `record` / `readonly record struct` | Constructor injection; ASP.NET Core container if present |

## 2. TypeScript

- **Modules are the unit of encapsulation.** Unexported functions and variables are private. A class is warranted for a stateful resource (client, cache, pool), an ADT with invariants, or a framework contract (Angular, NestJS, Lit).
- **Structural typing:** any object with the right shape satisfies an interface, so `implements` is optional. Declare the dependency type where it is used: `type Deps = { sendEmail(to: string, body: string): Promise<void> }`.
- **Brands for IDs and units** where structural typing is too loose: `type UserId = string & { readonly __brand: "UserId" }`, created only by a parser.
- **Sum types:** discriminated unions with a `kind`/`type` tag and a `never` default for exhaustiveness. Prefer these to class hierarchies for closed sets.
- **`this` binding:** passing `obj.method` as a callback loses `this`. Use arrow-function properties, `.bind` in the constructor, or factory functions that close over state.
- **Privacy:** `#field` is enforced at runtime; `private` is compile-time only. Either is fine; match the codebase.
- **Avoid:** `class Utils { static … }`, abstract base classes for sharing code, `IThing` prefixes, classes used only as namespaces.

## 3. Python

- **Module-level functions are the default.** A class is for invariants, resources (implement `__enter__`/`__exit__`), or a role with several methods.
- **Data:** `@dataclass(frozen=True, slots=True)` for values (the `slots` option needs Python 3.10+); validate in `__post_init__`. Pydantic models at I/O boundaries.
- **Roles:** `typing.Protocol` (PEP 544) at the consumer for structural typing; `abc.ABC` only when you need runtime enforcement or registration. Add `@runtime_checkable` only if you actually use `isinstance`.
- **Sum types:** a union of frozen dataclasses plus `match` (3.10+); a type checker (mypy, pyright) with exhaustiveness via `assert_never`.
- **Open dispatch on one argument's type:** `functools.singledispatch` adds an operation without touching the classes.
- **Properties, not getters:** start with a public attribute; switch to `@property` later without changing callers.
- **Avoid:** classes with only `__init__` and one method (use a function or `functools.partial`), deep ABC hierarchies, metaclass magic for ordinary code.

## 4. Kotlin

- **Final by default:** classes are closed unless marked `open`. Keep it that way.
- **Top-level and extension functions** for stateless logic; no `companion object` full of static helpers.
- **Sum types:** `sealed interface` / `sealed class` + `when` expression, which the compiler checks for exhaustiveness.
- **Values:** `data class` with `val`s and `init { require(…) }`; `@JvmInline value class` for typed IDs and units at near-zero cost.
- **Single-method roles:** a function type `(Order) -> Money` or a `fun interface`.
- **Delegation:** `class LoggingRepo(private val inner: Repo) : Repo by inner` gives composition without boilerplate forwarding.
- **`object`** only for stateless singletons; stateful services are created in the composition root.
- **DI:** primary-constructor parameters. On Android, use Hilt or Koin only if the project already does.

## 5. Swift

- **`struct` by default** (value semantics, no shared mutable state). Use `class` only when identity or shared mutable state is the point; mark it `final`.
- **`actor`** for mutable state shared across concurrent tasks.
- **Protocols + extensions** provide shared behavior without base classes. Retroactive conformance adapts types you don't own.
- **`some P` vs `any P`:** prefer generics/opaque types (`some P`) for static dispatch and full type information; use existentials (`any P`) when you genuinely need a heterogeneous collection.
- **Sum types:** `enum` with associated values + exhaustive `switch`.
- **Namespacing:** static members on a case-less `enum` rather than a class of static functions.
- **UI models:** SwiftUI observable view models are classes by necessity; keep domain rules in structs and functions they call.
- **Avoid:** subclassing for code reuse (except UIKit/AppKit framework hooks), `class` where a `struct` works.

## 6. Go

- **Interfaces belong to the consumer.** From Go's code review guide: define the interface in the package that uses it; implementers return concrete types; don't define interfaces on the implementer side "for mocking"; don't define them before they are used. Proverb: the bigger the interface, the weaker the abstraction.
- **Accept interfaces, return structs.**
- **Embedding is not inheritance.** An embedded type's methods are promoted, but there is no override or virtual dispatch back into the outer type. Use it for composition, not for a template-method design.
- **Invariants:** unexported fields plus `NewX(...) (X, error)`; the zero value should be useful or clearly invalid.
- **Receivers:** pointer receivers when the method mutates or the struct is large; be consistent within a type.
- **Closed sets:** a type switch or a small interface with an unexported marker method. The compiler doesn't check exhaustiveness; an exhaustiveness linter can.
- **Avoid:** `GetName()` (use `Name()`), `I`-prefixed interfaces, `…Impl` types, huge interfaces mirroring a struct.

## 7. Java

- **`record`** for data and value objects (validate in the compact constructor).
- **`sealed interface` + `record`s** for sum types, and pattern-matching `switch` for exhaustive handling (records since Java 16, sealed types since 17, pattern matching for `switch` since 21).
- **Make classes `final`** unless designed for extension (Bloch: design and document for inheritance, or else prohibit it).
- **Interfaces** for real roles and boundaries; default methods for small shared behavior.
- **`Optional`** as a return type for "may be absent", not as a field or parameter type.
- **DI:** constructor injection (Spring supports it without annotations on single-constructor classes). No field injection in new code.
- **Avoid:** `*ServiceImpl` for every entity, anemic entities with a service per entity, deep abstract base classes, static mutable state.

## 8. C#

- **`record`** (or `readonly record struct` for small values) for data and value objects; validate in the constructor or a static factory.
- **`sealed`** classes unless designed for extension; the language does not default to it, so be explicit.
- **Sum types:** if your C# version has no native union types, use an abstract record with a private constructor and sealed derived records, handled with a `switch` expression whose discard arm throws.
- **Primary constructors** (C# 12) make constructor injection concise.
- **`static class`** is acceptable for truly stateless helpers; extension methods for fluent helpers on types you don't own.
- **DI:** ASP.NET Core ships a container; register services there and inject through constructors. Many teams add an interface for every service to allow mocking; follow the codebase, but don't add interfaces in front of pure logic in new code.
- **Avoid:** service locator via `IServiceProvider` inside business code, `static` mutable state, inheritance chains for reuse.

## Sources

- TypeScript Handbook, "Type Compatibility" (structural typing): https://www.typescriptlang.org/docs/handbook/type-compatibility.html
- PEP 544, Protocols: https://peps.python.org/pep-0544/ · Python `dataclasses` docs: https://docs.python.org/3/library/dataclasses.html
- Kotlin docs, sealed classes and inline value classes: https://kotlinlang.org/docs/sealed-classes.html · https://kotlinlang.org/docs/inline-classes.html
- The Swift Programming Language, Protocols and Opaque Types: https://docs.swift.org/swift-book/
- Go Code Review Comments: https://go.dev/wiki/CodeReviewComments#interfaces · Go Proverbs: https://go-proverbs.github.io · Effective Go: https://go.dev/doc/effective_go
- Joshua Bloch, *Effective Java* (3rd ed.); JEP 395 (records), JEP 409 (sealed classes), JEP 441 (pattern matching for switch)
- Microsoft Learn, C# records and primary constructors: https://learn.microsoft.com/dotnet/csharp/
