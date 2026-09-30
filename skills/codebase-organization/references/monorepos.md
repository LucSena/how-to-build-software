# Monorepos vs polyrepos

A monorepo is one repository holding several projects. It is not a monolith: the projects can deploy independently. It pays off when projects share code and change together, and it costs tooling investment. Frontend-specific monorepo setup (Turborepo vs Nx for JS, internal UI packages) is also covered in `frontend-architecture`. Module-level data ownership is in `software-architecture`.

## Contents
1. Decision table
2. What the evidence says
3. Layout and rules
4. Tooling per ecosystem
5. Internal packages and versioning
6. CI in a monorepo
7. Ownership and agent instructions
8. Rules catalog

## 1. Decision table

| Choose a monorepo when | Choose polyrepos when |
|---|---|
| Several deployables share code or types (web + API + worker + mobile) | Products are truly independent, with no shared code or contracts |
| You want atomic cross-cutting changes (change the API and its clients in one PR) | Parts need different access control (an open-source component beside private code) |
| One organization owns all the parts | Toolchains and release processes share nothing and never will |
| You can adopt workspace tooling and affected-only CI | The org cannot invest in build tooling and repo sizes would hurt developer machines |

Default for a product company with 2+ deployables: **a monorepo**. Default for a single deployable: **a single repo, no monorepo tooling**. Node Best Practices notes that component isolation "does not necessarily demand physical separation" and can be achieved with a monorepo or with multiple repos. Boundaries come from module rules, not from repository count.

## 2. What the evidence says

Potvin and Levenberg, "Why Google Stores Billions of Lines of Code in a Single Repository" (CACM, 2016):

- Benefits: unified versioning (one source of truth), extensive code sharing and reuse, simplified dependency management, **atomic changes**, large-scale refactoring, collaboration across teams, flexible ownership, and code visibility.
- Scale as of January 2015: about 1 billion files, about 35 million commits, used by tens of thousands of developers. It required custom tooling (the Piper version-control system, CitC client workspaces) and trunk-based development.
- The lesson for everyone else: the benefits come from **trunk-based development, ownership files, and tooling**, not from putting folders in one repo. Without affected-only builds and ownership, a monorepo becomes one slow, contested codebase.

## 3. Layout and rules

```
apps/        deployables: web, api, worker, mobile, marketing
packages/    libraries with ≥ 2 consumers: ui, db, api-contract, config-*, <domain> (rare)
tooling/     scripts, generators, codemods
docs/adr/
```

Rules (Turborepo's "Structuring a repository" plus common practice):
- `apps/*` for deployables and `packages/*` for libraries. **No nested packages**: Turborepo rejects `apps/a` alongside `apps/a/b`.
- Every package has its own manifest, declares its own dependencies (no phantom imports that only work through hoisting), and publishes entry points via `exports`.
- **No `../` across package boundaries.** Install the package where it's needed and import it by name.
- Dependency direction: apps → packages, never the reverse, with no cycles between packages.
- Internal package names are namespaced (`@repo/*` or `@acme/*`).
- Shared configs are packages (`@repo/config-typescript`, `@repo/config-eslint`). No root `tsconfig.json` does real work.
- The root manifest only orchestrates (`turbo run build`, `nx affected`). No app code lives at the root.
- A package is created at its **second consumer**. Never create `packages/common` or `packages/utils`.
- A modular monolith's modules stay inside their app (`apps/api/src/modules/*`). Packages are for code shared across deployables.

## 4. Tooling per ecosystem

| Ecosystem | Workspace | Task orchestration / caching |
|---|---|---|
| JS/TS | pnpm (default), npm, yarn, or bun workspaces | Turborepo (default: task caching, remote cache, minimal setup) or Nx (generators, project graph, built-in boundary rules; suits many projects and teams) |
| Python | uv workspaces | Task runner (`just`/`make`) + CI path filters; Pants for large polyglot repos |
| JVM | Gradle multi-project builds (Kotlin DSL) | Gradle build cache |
| Rust | Cargo workspaces | Cargo's own incremental builds; sccache-style caching in CI |
| Go | Usually one module per repo with packages; `go.work` for local multi-module development | Go's build cache |
| Swift | SwiftPM packages with explicit targets | Xcode / SwiftPM |
| Polyglot at large scale | — | Bazel or Pants, with a team to own the build |

Polyglot repos (a TS web app plus a Python API) keep each app's native toolchain, and add a thin root `justfile`/`Makefile` so `setup`, `dev`, and `check` work the same everywhere (`project-bootstrap`).

## 5. Internal packages and versioning

- **Unpublished internal packages** use the workspace protocol (`"@repo/ui": "workspace:*"`) and have no meaningful version. Consumers always get the current code.
- Turborepo describes two internal-package patterns. *Just-in-time* packages export TypeScript source that the app's bundler compiles (fastest setup). *Compiled* packages have their own build step (needed when publishing or when a consumer cannot transpile). Start with just-in-time.
- **Published packages** are versioned independently with SemVer. Tools such as Changesets record the intended bump in each PR and generate changelogs.
- Keep **one version** of framework-level dependencies (React, TypeScript, the web framework, the ORM) across the repo. Two Reacts in one app is a bug, not a flexibility feature.
- Contracts between apps (OpenAPI, GraphQL schema, protobuf, zod schemas) live in one package that the server owns and clients consume, so an API change and its client updates land atomically.

## 6. CI in a monorepo

- Run tasks **only for affected projects** (Turborepo filters, `nx affected`, Bazel's target graph) and cache task outputs remotely. Without this, CI time grows with the whole repo instead of with the change.
- Still run a full build on `main` periodically, or when root configs, the lockfile, or shared config packages change.
- Keep one `check` entry point that composes per-project checks, so local and CI stay identical.
- Deploy per app: each deployable has its own pipeline, triggered by changes to it or its dependencies.
- Pipeline security and caching details: `deployment-and-infrastructure`.

## 7. Ownership and agent instructions

- `CODEOWNERS` entries per app and per package, naming teams. Shared packages are owned by a platform team.
- Root `AGENTS.md` covers repo-wide rules (toolchain, task runner, dependency direction, commit convention). Each app or package with its own commands gets a short `AGENTS.md` beside its manifest, written to stand on its own and never contradict the root (`project-bootstrap`).
- Per-package READMEs state the purpose, the public entry points, and the owner.

## 8. Rules catalog

### Create a package at the second consumer
**Rule.** Code moves from an app into `packages/` only when a second deployable needs it.
**Apply when.** Someone proposes a new package.
**Do / Avoid.** Do: extract `packages/api-contract` when the Expo app starts calling the API. Avoid: `packages/utils` created on day one "for later".
**Why.** Premature packages add build config, versioning, and indirection, and they attract unrelated code, the junk-drawer effect.

### Never reach across package boundaries with relative paths
**Rule.** Import other packages by name through their `exports`. Relative paths stop at the package root.
**Apply when.** Writing or reviewing imports in a workspace.
**Do / Avoid.** Do: `import { Button } from "@repo/ui/button"`. Avoid: `import { Button } from "../../packages/ui/src/button"`.
**Why.** Turborepo: relative cross-package imports bypass declared dependencies, break caching and affected-graph detection, and couple you to internals.

### Keep CI proportional to the change
**Rule.** PR pipelines build and test only affected projects, with remote caching. Full runs happen on shared-config changes and periodically on `main`.
**Apply when.** A monorepo's CI exceeds ~10 minutes, or the repo has more than a handful of projects.
**Do / Avoid.** Do: `turbo run check --filter=...[origin/main]` or `nx affected -t check`. Avoid: rebuilding every app for a README change.
**Why.** DORA's CI guidance targets feedback within about 10 minutes. Monorepos only stay there with affected-only execution.

## Sources

- Potvin and Levenberg, "Why Google Stores Billions of Lines of Code in a Single Repository", CACM 59(7), 2016: https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/
- Turborepo, Structuring a repository; Internal packages: https://turborepo.com/docs/crafting-your-repository/structuring-a-repository · https://turborepo.com/docs/core-concepts/internal-packages
- monorepo.tools (Nx team): https://monorepo.tools
- Nx, Affected and module boundaries: https://nx.dev
- Node.js Best Practices §1.1: https://github.com/goldbergyoni/nodebestpractices
- uv workspaces: https://docs.astral.sh/uv/concepts/projects/workspaces/
- DORA, Continuous integration: https://dora.dev/capabilities/continuous-integration/
