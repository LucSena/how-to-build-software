# Boundaries and enforcement tools

How to give each module a public surface and make a machine reject imports that cross it. Configs for dependency-cruiser, import-linter (layers and forbidden contracts), Spring Modulith, and ArchUnit already live in `software-architecture` (`references/modular-monolith.md`). This file covers the remaining tools, public-API mechanics per ecosystem, barrel files, and how to roll rules out on an existing codebase.

## Contents
1. Public API mechanisms per ecosystem
2. The minimum rule set
3. JS/TS configs
4. Python, Go, Ruby, JVM notes
5. Barrel files in depth
6. Rolling out on an existing codebase
7. Rules catalog

## 1. Public API mechanisms per ecosystem

| Ecosystem | Make internals private by… | Notes |
|---|---|---|
| TS app (single package) | Convention (a `<module>.public.ts` or small `index.ts` with named exports) + a lint rule that forbids deep imports | Types alone don't stop imports; the lint rule does |
| TS monorepo | `package.json` `exports`: only listed subpaths are importable by other packages | Turborepo recommends `exports` over `main` and over barrels |
| Python | `_`-prefixed modules for internals, and `__all__` in the package `__init__` | Not enforced by the language, so add import-linter |
| Go | `internal/` directories: "other packages can't import it unless they share a common ancestor" | Compiler-enforced; the strongest mechanism in this table |
| Java | Package-private classes; Spring Modulith: sub-packages of a module are internal; `@NamedInterface` exposes extra packages deliberately | Verified by `ApplicationModules.verify()` |
| Kotlin | `internal` visibility per Gradle module | Promote a package to a Gradle module to get compiler enforcement |
| Rust | `pub(crate)`, private modules; crates in a workspace | Compiler-enforced |
| .NET | Separate projects + `internal`; `InternalsVisibleTo` only for test projects | Project references define allowed dependencies |
| Ruby/Rails | Packwerk packs with `package.yml` declaring dependencies | Public-API (privacy) checks moved to packwerk-extensions |

## 2. The minimum rule set

Turn these on as soon as there are three or more modules. Add others only when a real violation shows up.

1. **No import cycles**, anywhere.
2. **No deep imports into another module**: only its public entry point.
3. **Shared code never imports feature code.** Dependencies flow shared → features → app (bulletproof-react).
4. **Client code never imports server-only code** (Next.js: `import "server-only"`).
5. **Domain code never imports framework or driver packages** (only where the module uses a domain tier).

## 3. JS/TS configs

**`import/no-restricted-paths`** (eslint-plugin-import), bulletproof-react's approach. One zone per feature blocks cross-feature imports, and two zones enforce one-way flow:

```js
'import/no-restricted-paths': ['error', {
  zones: [
    // features may not import other features (repeat per feature, or generate the list)
    { target: './src/features/billing', from: './src/features', except: ['./billing'] },
    { target: './src/features/projects', from: './src/features', except: ['./projects'] },
    // one-way flow: app → features → shared
    { target: './src/features', from: './src/app' },
    { target: ['./src/components', './src/hooks', './src/lib', './src/types', './src/utils'],
      from: ['./src/features', './src/app'] },
  ],
}],
```

**eslint-plugin-boundaries** classifies files into *elements* and declares which elements may depend on which, with editor feedback. Syntax from the current README; check the docs for your installed version:

```js
import boundaries from "eslint-plugin-boundaries";

export default [{
  plugins: { boundaries },
  settings: {
    "boundaries/elements": [
      { type: "app", pattern: "src/app/*" },
      { type: "feature", pattern: "src/features/*" },
      { type: "shared", pattern: "src/(components|lib|hooks)/*" },
    ],
  },
  rules: {
    "boundaries/dependencies": [2, {
      default: "disallow",
      policies: [
        { from: { element: { type: "app" } }, allow: { to: { element: { types: { anyOf: ["feature", "shared"] } } } } },
        { from: { element: { type: "feature" } }, allow: { to: { element: { type: "shared" } } } },
        { from: { element: { type: "shared" } }, allow: { to: { element: { type: "shared" } } } },
      ],
    }],
  },
}];
```

**dependency-cruiser** validates the whole import graph in CI (cycles, forbidden paths, orphans, dev dependencies in production code) and draws graphs. Start with `npx dependency-cruiser --init`. The cross-module rule config is in `software-architecture`.

**Nx**: tag each project (for example `scope:billing`, `type:feature`, `type:ui`, `type:util`) and declare which tags may depend on which, with the module-boundaries lint rule. Useful once a monorepo has many projects and several teams.

**TS package `exports`** (monorepo):

```json
{
  "name": "@repo/ui",
  "exports": {
    "./button": "./src/button.tsx",
    "./dialog": "./src/dialog.tsx",
    "./tokens.css": "./src/tokens.css"
  }
}
```

Consumers write `import { Button } from "@repo/ui/button"`. Anything not listed cannot be imported, and there is no barrel to parse.

## 4. Python, Go, Ruby, JVM notes

**Python — import-linter.** It imposes constraints on the imports between your modules and includes a browser UI for exploring the architecture. Beyond the `layers` and `forbidden` contracts shown in `software-architecture`, an **independence** contract keeps sibling feature packages from importing each other:

```ini
[importlinter:contract:features-independent]
name = Feature packages do not import each other
type = independence
modules =
    app.auth
    app.posts
    app.billing
```

Run `lint-imports` in CI.

**Go.** Put everything that is not a deliberate public API under `internal/`. A banned-import rule (for example, domain packages may not import `net/http` or database drivers) can be added with golangci-lint's import-restriction linters. Keep packages small and named for what they provide.

**Ruby — Packwerk.** A pack is a folder with a `package.yml`:

```yaml
# packs/billing/package.yml
enforce_dependencies: true
dependencies:
  - packs/accounts
```

`bin/packwerk check` reports references to constants in packs you did not declare. Packwerk is designed to avoid false positives and accepts some false negatives: it only sees static constant references through Zeitwerk autoloading. Public-API (privacy) checks were extracted to `packwerk-extensions`.

**JVM.** Spring Modulith: `ApplicationModules.of(App.class).verify()` in a test fails on cycles and on access to another module's internals. ArchUnit expresses layer and slice rules as unit tests (`slices().matching("com.acme.(*)..").should().beFreeOfCycles()`). Konsist offers Kotlin-native assertions.

## 5. Barrel files in depth

A barrel is an `index` file that re-exports its siblings (`export * from './color'`).

| Problem | Evidence |
|---|---|
| Dev servers load and transform every file behind the barrel, and run their side effects, even for one import | Vite performance guide, "Avoid Barrel Files" |
| Bundlers struggle to tree-shake through them | bulletproof-react dropped feature barrels for this reason; Turborepo calls barrels "difficult for compilers and bundlers to handle" |
| Build and tooling time grows with the codebase | Atlassian reported ~75% faster Jira front-end builds, and faster TypeScript highlighting, unit tests, and CI, after removing barrel files |
| The real dependency graph is hidden | Everything appears to depend on `index.ts` |

What to do instead:
- **App code**: import the file directly (`@/features/billing/components/invoice-row`) and enforce privacy with lint rules, not with a barrel.
- **Module public API**: one small file with explicit named re-exports (`export { createInvoice } from './domain/create-invoice'`), no `export *`, and never on the client's hot path if the module is large.
- **Shared packages**: `exports` subpaths, one per component or function group.
- **Third-party barrels** in Next.js: the framework's `optimizePackageImports` setting rewrites imports for listed packages.
- Remove existing barrels incrementally with a codemod that rewrites imports to direct paths, one folder per PR.

The tension with Feature-Sliced Design and modular-monolith practice, which want one public entry per slice, is resolved by the second bullet: small, explicit, named. The entry exists to define an API, not to save typing.

## 6. Rolling out on an existing codebase

1. **Measure**: generate the import graph (dependency-cruiser, import-linter's UI, `go list -deps`, IDE module diagrams). List cycles and the modules with the most inbound deep imports.
2. **Pick two rules**: "no new cycles" and "no deep imports into module X", where X is the module you most need to change safely.
3. **Allowlist today's violations** in a file checked into the repo, with an owner per entry. Make CI fail when the count goes **up** (a ratchet).
4. **Fix module by module.** Add the missing public function, route callers through it, and delete the allowlist entries in the same PR.
5. **Tighten**: once a module is clean, remove it from the allowlist permanently, then extend the rule to the next module.

Shopify's "A Packwerk Retrospective" is the cautionary tale. Dependency violations accumulated in "todo" files while the architecture did not improve, and privacy rules that fought Rails conventions confused people. Static checks catch regressions. They do not design the boundaries for you, so do the design work (what does this module own? what is its API?) before switching the checker on.

## 7. Rules catalog

### Enforce one-way dependencies from day three
**Rule.** Once three modules exist, CI rejects cycles and deep imports across modules.
**Apply when.** A codebase has three or more features or modules, or a second developer joins.
**Do / Avoid.** Do: `import/no-restricted-paths` zones or a dependency-cruiser rule in the `check` task. Avoid: a README paragraph asking people not to cross boundaries.
**Why.** Boundaries erode one convenient import at a time. A fitness function makes the erosion visible when it happens, not months later.

### Ratchet violations down, never baseline and forget
**Rule.** Existing violations go in an allowlist whose size may only shrink. Every entry has an owner.
**Apply when.** Introducing a boundary tool to a codebase that already violates it.
**Do / Avoid.** Do: fail CI if the allowlist grows, and delete entries as modules are fixed. Avoid: auto-generating thousands of "todo" entries and declaring victory.
**Why.** The Packwerk retrospective: baselines without follow-through record the mess without reducing it.

### Prefer compiler-enforced privacy when it is available
**Rule.** Use `internal/` (Go), `internal` + separate Gradle modules (Kotlin), `pub(crate)` (Rust), or `exports` maps (TS packages) before reaching for convention plus a linter.
**Apply when.** The ecosystem offers a language- or package-level visibility mechanism.
**Do / Avoid.** Do: move a Go package under `internal/` to free its API. Avoid: a `private/` folder name as the only protection.
**Why.** A compiler cannot be bypassed with an eslint-disable comment, so the boundary holds under deadline pressure.

## Sources

- bulletproof-react, Project structure (restricted paths, no barrels): https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md
- eslint-plugin-boundaries: https://github.com/javierbrea/eslint-plugin-boundaries · https://www.jsboundaries.dev
- dependency-cruiser: https://github.com/sverweij/dependency-cruiser
- Nx, Enforce module boundaries: https://nx.dev/features/enforce-module-boundaries
- import-linter: https://github.com/seddonym/import-linter · contract types: https://import-linter.readthedocs.io/en/stable/contract_types/
- Go, Organizing a Go module (`internal`): https://go.dev/doc/modules/layout
- Packwerk: https://github.com/Shopify/packwerk · "A Packwerk Retrospective": https://shopify.engineering/a-packwerk-retrospective
- Spring Modulith fundamentals: https://docs.spring.io/spring-modulith/reference/fundamentals.html · ArchUnit: https://github.com/TNG/ArchUnit
- Vite performance guide, Avoid Barrel Files: https://vite.dev/guide/performance
- Turborepo, Structuring a repository (`exports`, barrels): https://turborepo.com/docs/crafting-your-repository/structuring-a-repository
- Atlassian, "Faster builds when removing barrel files": https://www.atlassian.com/blog/atlassian-engineering/faster-builds-when-removing-barrel-files
- Vercel, "How we optimized package imports in Next.js": https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
