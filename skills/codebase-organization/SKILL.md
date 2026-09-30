---
name: codebase-organization
description: Use when deciding where code should live, laying out folders for a new project, reorganizing a growing or tangled codebase, or scaling a codebase across more developers and teams. Covers package by feature vs by layer, thin layers inside modules (entry points, domain, data access; Django services and selectors), module public APIs, enforced import boundaries (dependency-cruiser, eslint-plugin-boundaries, Nx, import-linter, ArchUnit, Spring Modulith, Go internal, Packwerk), barrel files and package exports, utils/common/shared smells, naming and file-size heuristics, growth stages from solo to many teams, when to split module → package → service, monorepo vs polyrepo, Conway's law and code ownership, and folder templates for Next.js, React SPA, Node/TS API, FastAPI, Django, Go, Spring Boot, and monorepos. Also use when the user says "where should this file go?", "our utils folder is huge", "features import each other", or "how do we structure this repo?". For system-level styles and service splits use software-architecture; for frontend rendering and state use frontend-architecture.
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "software-architecture frontend-architecture project-bootstrap design-patterns clean-code"
---

# Codebase Organization

A well-organized codebase lets a new developer find the code for a feature in one folder, change it without breaking an unrelated feature, and have a tool object before they cross a boundary they shouldn't. Three things get you there: grouping code by what it does for the business, hiding each module's internals behind a small public surface, and letting the structure grow with the team instead of scaffolding for an org chart that doesn't exist yet. This skill decides where code goes, which rules to enforce, and when to split.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

In an existing repo, **map before you move**: print the tree two or three levels deep, then read the lint and boundary configs, `AGENTS.md`, and `docs/adr/`. Extend the existing convention unless the user asked for a reorganization. Two competing structures are worse than one imperfect one.

## Core principles

1. **Package by feature, not by layer.** The top-level folders should name the domain (orders, billing, scheduling), not the framework (controllers, services, models). A change to one feature then touches one folder.
2. **Keep layers thin inside each module.** Entry points adapt and validate, domain code decides, data access persists. Three tiers are enough for most modules, and ceremony beyond that has to earn its place.
3. **Give every module a small public API.** Other code imports only that surface. Everything behind it can change freely.
4. **Enforce boundaries in CI.** A rule that is not checked is a suggestion. Tools catch regressions, but only design creates the boundaries in the first place.
5. **Keep code local until a second consumer exists.** Shared code is promoted, not pre-built, and it is named for what it is. `utils/` is not a name.
6. **Follow the ecosystem's official conventions.** The framework's documented layout (Next.js `app/`, Django apps, go.dev module layout, Spring Modulith packages) beats a custom tree agents and hires must learn.
7. **Grow structure with the team, and split along ownership seams.** Folder → module → package → service, each step only on a named trigger. Conway's law says the boundaries will follow team communication anyway, so draw them there on purpose.

## Workflow

- [ ] **1. Map what exists.** Tree, entry points, boundary rules, cycles (run the ecosystem's graph tool if available), and ADRs. Note the stage (table below).
- [ ] **2. Pick the target shape** from the growth-stage table and the stack's template (`references/folder-templates.md`). Change only what the current stage needs.
- [ ] **3. Place new code** with the "Where does this go?" checklist. Gate: no new top-level technical-layer folder and no new `utils`/`common` file.
- [ ] **4. Add or extend boundary rules** once there are 3 or more modules: no cycles, no deep imports into another module, shared never imports features. Gate: the check runs in CI and fails on a deliberate violation.
- [ ] **5. Migrate incrementally**, one module per PR. Move files and fix imports with no behavior change in the same PR, then tighten the rule for that module. Record existing violations in a shrinking allowlist; never baseline thousands of them and call the codebase modular.
- [ ] **6. Verify**: typecheck, tests, and the boundary check pass; the dependency graph has no new cycles; `AGENTS.md` describes the new map.

## Package by feature, not by layer

| Package by layer (avoid for multi-domain apps) | Package by feature (default) |
|---|---|
| `controllers/ services/ models/ repositories/` | `orders/ billing/ users/` (plus a small `shared/`) |
| One feature change touches 4–6 folders | One feature change touches one folder |
| Anything can import anything; no seams | Each module has a public surface; internals are private |
| Structure names the framework ("screams Rails") | Structure names the domain ("screams Scheduling"): Uncle Bob's *Screaming Architecture* |

- Node Best Practices 1.1: root folders are "reasonably sized business modules", each with its own API, logic, and data access. Without them, "module-a controller might call module-b service" and nobody dares change anything.
- FastAPI Best Practices: organizing by file type (`crud/`, `routers/`, `models/`) "works well for microservices or smaller projects" but "didn't scale well for our monolith with many domains". They use one package per domain instead.
- Simon Brown's refinement, "package by component": keep a component's business logic and persistence behind one interface, with the web layer outside it, and use the compiler's visibility rules to enforce it.
- Layer-by-type **inside** a feature is fine (`orders/components/`, `orders/api/`), as is layering in a small single-domain service. bulletproof-react adds: "You don't need all of these folders for every feature."
- **Co-locate**: tests, styles, stories, and fixtures sit next to the code they cover (`invoice.ts` + `invoice.test.ts`), or in a mirrored `tests/<module>/` tree where the ecosystem expects that (Python/Django). Pick one convention per repo.

## Inside a module: thin layers

| Tier | Holds | Must not |
|---|---|---|
| Entry points (HTTP routes, queue consumers, cron jobs, CLI, Server Actions) | Parse and validate input, check authorization, call the domain, map the result to a response | Contain business rules; pass `req`/`res` into domain functions |
| Domain (services, use cases, entities, errors) | Business decisions and invariants, as plain functions and objects | Import HTTP frameworks or database drivers directly |
| Data access (repositories, queries) | SQL/ORM calls for this module's own tables | Reach into another module's tables |

- **Django (HackSoft Styleguide)**: business logic lives in `services.py` (writes, named `<entity>_<action>`, keyword-only typed arguments) and `selectors.py` (reads). Not in views, serializers, forms, model `save()`, managers, or signals.
- **FastAPI**: per domain `router.py, schemas.py, models.py, service.py, dependencies.py, config.py, constants.py, exceptions.py`. Cross-domain imports use the module name: `from src.auth import constants as auth_constants`.
- **CRUD-shaped modules** collapse to `route → service → repo` or even `route → repo`. Hexagonal ports and adapters, and when they pay off, are covered in `software-architecture`.

## Public APIs and enforced boundaries

| Ecosystem | Public-surface mechanism | Enforcement tool |
|---|---|---|
| TS/JS app | One small entry file per module (named exports), or path rules | dependency-cruiser, eslint-plugin-boundaries, `import/no-restricted-paths` |
| TS monorepo | `package.json` `exports` map per package | Package boundaries + Nx module-boundary rules or dependency-cruiser |
| Python | `_private` modules, `__all__` | import-linter contracts in CI |
| Go | `internal/` directories (compiler-enforced) | Compiler; banned-import linters via golangci-lint |
| Java/Kotlin | Package-private / Kotlin `internal`; Spring Modulith `internal` sub-packages | Spring Modulith `verify()`, ArchUnit, Konsist |
| Ruby/Rails | Packs with `package.yml` | Packwerk (dependency checks; privacy checks now live in packwerk-extensions) |
| .NET | Separate projects + `internal` | Project references; architecture tests |

**Minimum rule set**, enabled as soon as there are 3 or more modules: (1) no import cycles, (2) no deep imports into another module's internals, (3) `shared/` never imports features, and `app/` composes features (bulletproof-react: shared → features → app, one direction only), (4) client code never imports server-only code. Configs and adoption strategy: `references/boundaries-and-tools.md`.

## Barrel files and package entry points

- **Avoid `export *` barrels in app code.** Vite's performance guide: importing one symbol through a barrel forces every file behind it to be fetched and transformed, side effects included. bulletproof-react dropped barrels for the same reason and now imports files directly. Atlassian reported roughly 75% faster Jira front-end builds after removing barrel files (an Atlassian engineering blog report).
- **A module's public API file is acceptable** when it re-exports a handful of named symbols (no `export *`), is not a hot path, and never re-exports other barrels.
- **For shared packages, use `package.json` `exports` subpaths** (`@repo/ui/button`) instead of one index of everything. Turborepo recommends this because barrels are "difficult for compilers and bundlers to handle".
- Never put a barrel in `shared/ui` with hundreds of components, and never nest barrels of barrels.

## Shared code: where it goes

| The code is… | Put it in |
|---|---|
| Used by one feature | That feature's folder, even if it looks generic |
| Generic (no domain words), used by 2+ features | `shared/lib/<name>.ts` (or `libraries/<name>/` as a package with its own `exports`), named for what it does: `money.ts`, `slugify.ts`, `retry.ts` |
| Domain logic another module needs | The owning module's public API. Callers ask the owner; they don't copy it into `common` |
| Design-system UI primitives | `shared/ui` or `packages/ui` |
| Cross-cutting infrastructure (db client, logger, config, auth session) | `server/` or `platform/` / `infra/` with one owner |
| Types shared across deployables (API contracts) | A contract package generated from or defining the schema (`packages/api-contract`) |

Smells: a `utils.ts` over ~200 lines, a `helpers/` folder imported by everything, `common/` holding domain models (the seed of a distributed monolith), and Go packages named `util`, `common`, or `misc`. Promote code to shared at the **second real consumer**, not the first imagined one.

## Naming and size heuristics

- One filename case per repo, enforced by a linter (bulletproof-react enforces kebab-case files and folders). Ecosystem norms: TS kebab-case files; Python `snake_case` modules; Go short lowercase package names, no underscores; Java/Kotlin lowercase packages and PascalCase types.
- Name modules after domain concepts (`invoicing`, `scheduling`), not patterns (`managers`, `handlers`). Django-style `<entity>_<action>` function names (`invoice_send`) keep code greppable.
- Size is a review trigger, not a limit: a file over ~300–500 lines, a function over ~40–60 lines, nesting deeper than 3–4 levels, or a folder with more than ~15–20 files at one level. Split by cohesion, not by line count. Ousterhout's "deep modules" argue against shattering code into many shallow pieces.

## Growth stages

| Stage | People | Structure | Add at this stage |
|---|---|---|---|
| 0. Solo / prototype | 1–2 | Framework default layout, one app, one DB | Formatter, linter, types, CI (`project-bootstrap`) |
| 1. One team | 3–8 | Feature folders in one app; `shared/` with import rules; co-located tests | Boundary lint (no cycles, no cross-feature internals), ADRs, trunk-based PRs |
| 2. Several teams | 2–5 teams | **Modular monolith**: modules = bounded contexts with public APIs and their own tables or schema; monorepo `apps/` + `packages/` if there are several deployables | CODEOWNERS per module, per-module test suites, affected-only CI with caching, boundary rules as fitness functions |
| 3. Many teams | 5+ teams on independent cadences | Extract services only where a module needs independent scaling, deploys, runtime, or isolation; a platform team; paved-road templates | Contract tests, service templates, a developer portal |

Team Topologies treats team cognitive load as the main constraint and sizes teams at roughly 5–9 people. Give each team a slice of the codebase it can hold in its head. Details and signals: `references/growth-stages.md`.

## When to split

| Step | Split when (any one) | Not because |
|---|---|---|
| Folder → module (enforced boundary) | A feature exceeds ~15–20 files, or has sub-areas with separate vocabulary | It "feels big" |
| Module → package | A second deployable needs it, or independent build/test caching pays off | Neatness; one consumer |
| Package/module → service | Different scaling profile, independent deploy cadence owned by another team, fault or compliance isolation, different runtime | Size, or "microservices are best practice" |

Service extraction (strangler fig, data separation) is covered in `software-architecture`.

## Monorepo vs polyrepo

Default for one organization with several deployables that share code (web + API + worker + mobile): **a monorepo** with `apps/` for deployables and `packages/` for libraries. Google's 2016 CACM paper credits its monorepo with unified versioning, extensive code sharing, atomic cross-project changes, and large-scale refactoring, and also notes the tooling investment it required. Choose polyrepos for truly independent products, different access-control needs (open-source parts), or toolchains that share nothing. Tooling, rules, and CI: `references/monorepos.md`.

## Ownership

- **Conway's law**: system structure mirrors the organization's communication structure. Use the *inverse Conway maneuver*: shape teams and modules together.
- **One owning team per top-level module**, recorded in `CODEOWNERS` and enforced by branch protection that requires code-owner review. Shared packages are owned by a platform or enabling team. Never by "everyone".
- A module that two teams change every week is either mis-cut or needs an explicit collaboration mode for a limited time (Team Topologies).

## Folder templates

Eight starting points in `references/folder-templates.md`: **Next.js App Router**, **React SPA (Vite)**, **Node/TS API**, **FastAPI**, **Django**, **Go service** (the official go.dev layout; `golang-standards/project-layout` is not a standard, as Russ Cox's issue #117 points out), **Spring Boot with Spring Modulith**, and a **monorepo** (`apps/` + `packages/`). They are starting points: grow into them, and never scaffold empty folders.

## Gotchas

- **Imposing a textbook tree on an existing repo.** Adding `domain/application/infrastructure` next to an established `controllers/services` layout leaves two architectures. Extend what exists; propose the migration as its own plan.
- **Scaffolding empty folders for the future.** Go `pkg/ api/ build/ deployments/` in a 300-line service; `packages/` with one app; `features/x/{api,components,hooks,stores,types,utils}` for a feature with two files. Create a folder when the first file needs it.
- **Adding to `utils/` because it's convenient.** Name the concept and put it where its consumers are.
- **Cross-feature deep imports** (`../../billing/internal/tax`). Go through the owner's public API, or compose both features one level up (in the route or page).
- **`export *` barrels everywhere** "for clean imports". They slow dev servers and builds and hide the real dependency graph.
- **Turning on a boundary tool with a giant baseline.** Shopify's Packwerk retrospective: violation "todo" files piled up while real modularity did not improve. Start with a few rules, fix violations module by module, and shrink the allowlist.
- **Splitting into services to fix a tangled monolith.** You get a distributed tangle. Enforce module boundaries first.
- **Business logic in the wrong tier**: Django views, serializers, or signals; Express handlers receiving `req`/`res` deep in the domain; React components calling the database client.
- **Moving files and changing behavior in one PR.** Reviewers can't see the logic change inside a 200-file move. Do the move first, then the change.
- **Organizing tests differently from code.** Tests should mirror or sit next to the module they cover, so ownership and deletion move together.

## Output format

For a structure proposal or reorganization:

```
Codebase organization — <repo>
Stage: <0–3, with evidence: people, deployables, modules>
Current: <observed layout, main smells (Observed / Inferred)>
Target tree: <annotated tree, only folders needed now>
Boundary rules: <rules + tool + where it runs in CI>
Migration: <ordered PRs, one module each; allowlist plan>
Ownership: <CODEOWNERS entries, if more than one team>
Not changing now: <deferred splits and their triggers>
```

For "where does this go?": the path, the tier inside the module, and the reason, in 3 lines.

## References

| File | Read when |
|---|---|
| `references/folder-templates.md` | Laying out a new project or proposing a target tree for a specific stack |
| `references/boundaries-and-tools.md` | Configuring boundary enforcement, choosing a public-API mechanism, or planning a tool rollout on an existing codebase |
| `references/growth-stages.md` | The team or codebase is growing, deciding when to split, or setting up ownership and Conway-aligned boundaries |
| `references/monorepos.md` | Choosing monorepo vs polyrepo, structuring `apps/` and `packages/`, or setting up workspace tooling and affected-only CI |

## Related skills

- `software-architecture` — architecture styles, bounded contexts, modular monolith data ownership, and extracting services.
- `frontend-architecture` — rendering, state, data fetching, and Feature-Sliced Design for large front ends.
- `project-bootstrap` — setting up the repo, CI, and conventions the structure lives in.
- `design-patterns` — patterns to use inside a module once its place is clear.
- `clean-code` — naming and function-level structure within files.
