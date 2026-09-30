# Project structure

Folder layouts, boundary enforcement, monorepos, i18n file plumbing, and the micro-frontend decision. Existing conventions win: if the repo already has a coherent structure, extend it instead of migrating.

## Contents

1. Feature folders (default)
2. Feature-Sliced Design (large apps)
3. Enforcing boundaries
4. Monorepos
5. i18n plumbing
6. Micro-frontends

## 1. Feature folders (default)

```
src/
  app/ or routes/          # thin: route files, layouts, loaders; import from features
  features/
    invoices/
      components/          # UI used only by this feature
      hooks/
      api/                 # queries, mutations, server actions, DTO mappers
      model/               # types, schemas, reducers, pure domain logic
      index.ts             # public API: the only import path for other code
    billing-settings/
  shared/
    ui/                    # design-system components (or packages/ui in a monorepo)
    lib/                   # generic helpers with no feature knowledge
    config/
  server/                  # server-only: data-access layer, auth, integrations
```

Rules:
- Code that changes together lives together. Type folders at the top level (`components/`, `hooks/`, `services/`) scatter every feature across the tree.
- A feature imports other features only through their `index.ts`. Deep imports (`features/invoices/components/Row`) are forbidden.
- `shared/` knows nothing about features. When something in `shared/` needs a feature type, it belongs in that feature.
- Server-only code sits in a folder that starts with `import "server-only"` (or the framework equivalent) so a client import fails the build.
- Soft size limits signal a split: files over ~400 lines, components with more than ~7 props or three concerns. Split by cohesion, not by line count.

## 2. Feature-Sliced Design (large apps)

Use FSD when the app has many features or several teams, and plain feature folders are producing cross-feature tangles.

| Layer (top → bottom) | Holds | Example |
|---|---|---|
| `app` | Providers, global styles, router setup | `app/providers.tsx` |
| `pages` | Full pages composed from widgets | `pages/invoice-detail` |
| `widgets` | Large self-contained UI blocks | `widgets/invoice-header` |
| `features` | User interactions that deliver value | `features/send-invoice` |
| `entities` | Business entities with UI + model | `entities/invoice`, `entities/customer` |
| `shared` | Reusable, business-agnostic code | `shared/ui`, `shared/api`, `shared/lib` |

(`processes` is deprecated; do not create it.)

- A module imports only from layers **strictly below** it. Slices on the same layer never import each other; compose them one layer up.
- Each slice exposes a public API (`index.ts`); segments inside a slice: `ui`, `model`, `api`, `lib`, `config`.
- With a file-system router (Next.js `app/`, SvelteKit `routes/`), keep the router folder thin: route files import and render a page from the FSD `pages` layer. FSD publishes a Next.js guide for this.
- Enforce with Steiger (the FSD linter) or ESLint boundary rules.
- For small apps FSD is ceremony. Feature folders are enough until the tangles appear.

## 3. Enforcing boundaries

A rule that is not checked in CI is a suggestion. Pick one tool and fail the build on violations and cycles:
- **eslint-plugin-boundaries** or **dependency-cruiser**: layer and feature rules in plain JS/TS repos.
- **Nx** module-boundary rules: tag projects (`scope:billing`, `type:ui`) and constrain which tags may depend on which.
- **Steiger**: FSD-specific rules.
- **TypeScript project references / package `exports`**: in a monorepo, only exported paths are importable.

Minimum rule set: no deep imports into features; `shared` never imports `features`; client code never imports `server/`; no circular dependencies.

## 4. Monorepos

Use one when two or more deployables share code (web app, marketing site, Expo app, API, worker). A single app does not need one.

```
apps/
  web/               # product app
  marketing/         # static site
  mobile/            # Expo app, if any
  api/
packages/
  ui/                # design-system components + tokens
  config/            # shared tsconfig, ESLint, Prettier/Biome presets
  api-client/        # typed client generated from OpenAPI or shared router types
  db/                # schema and migrations, server-only
tooling/             # scripts, generators
docs/adr/
```

| Choose | When |
|---|---|
| pnpm workspaces + **Turborepo** (default) | JS/TS repo that wants task caching, remote cache, and affected-only runs with minimal setup |
| **Nx** | Many projects or teams; you want generators, a project graph UI, and module-boundary enforcement built in |
| Bazel / Pants | Polyglot at large scale with a platform team to run it |

Rules:
- Dependency direction is `apps → packages`, never the reverse, and no cycles between packages.
- Every package declares its own dependencies (no phantom imports that only work because of hoisting). Internal packages reference each other with the `workspace:` protocol.
- Keep one version of key dependencies (React, TypeScript, the framework) across the repo.
- Internal packages can ship TypeScript source consumed directly by the apps' bundlers (fastest to set up) or a compiled build (needed when publishing or when consumers cannot transpile). Start with source; compile when a real consumer requires it.
- Run tasks affected by the change only, with remote caching in CI. Add CODEOWNERS per package.
- Create a package only when it has two consumers. Never create `packages/common` or `packages/utils` as a dumping ground.

## 5. i18n plumbing

```
messages/
  en.json            # ICU MessageFormat, keyed by stable IDs: "invoice.overdue.banner"
  de.json
src/i18n/
  config.ts          # supported locales, default locale, time zone policy
  request.ts         # resolve locale: URL segment or domain → saved preference → Accept-Language → default
```

- Public, crawlable pages carry the locale in the path (`/de/pricing`) or domain, with `hreflang` alternates. Apps use the user's saved preference.
- Detect from `Accept-Language` or `navigator.languages`, never from IP. Always allow a manual switch and remember it.
- Load only the active locale's messages, split by route or feature namespace. Missing keys fall back to the default locale and are reported in development.
- No concatenated strings (`"You have " + n + " invoices"`); use ICU plurals and select. Keep brand names, code, and identifiers untranslated (`translate="no"`).
- Format with `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat`, and `Intl.PluralRules`, passing an explicit locale **and time zone** on server and client to prevent hydration mismatches.
- Library examples (pick one that matches the framework): next-intl, react-i18next, FormatJS/react-intl, Lingui, Paraglide.

## 6. Micro-frontends

Micro-frontends solve an **organizational** problem: several teams that must release parts of the same UI on independent schedules. They are never a technical optimization.

| Consider them when | Do not use them when |
|---|---|
| Several autonomous teams, each owning a product area end to end | One team, or a few teams that can coordinate releases |
| Release coupling is a measured bottleneck that a monorepo with enforced boundaries and affected-only CI has not solved | The motivation is "clean separation" or future-proofing |
| Legacy migration: strangling an old frontend route by route | Performance is a priority and the budget cannot absorb duplicated runtimes |

Costs to state up front: duplicated framework code and larger bundles, version skew between shared dependencies, inconsistent UX without a strong shared design system, harder end-to-end testing, and cross-app state and routing glue. If adopted: split by route or page region (not by component), share the design system as a versioned package, and keep a single shell that owns routing and auth.

## Sources

- Feature-Sliced Design, layers reference: https://feature-sliced.design/docs/reference/layers
- Turborepo docs (internal packages, caching): https://turborepo.com/docs
- Nx docs (module boundaries): https://nx.dev/features/enforce-module-boundaries
- dependency-cruiser: https://github.com/sverweij/dependency-cruiser ; eslint-plugin-boundaries: https://github.com/javierbrea/eslint-plugin-boundaries
- Vercel Web Interface Guidelines (locale detection, `translate="no"`): https://github.com/vercel-labs/web-interface-guidelines
- Martin Fowler / Cam Jackson, "Micro Frontends": https://martinfowler.com/articles/micro-frontends.html
