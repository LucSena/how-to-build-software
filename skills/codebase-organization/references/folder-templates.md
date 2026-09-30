# Folder templates per stack

Starting points, not mandates. Where the framework's official docs disagree with a template, the docs win. Grow into these trees: create a folder when its first file arrives. Each template lists its import rules, because a tree without rules decays into a tangle with nicer folder names.

## Contents
1. Next.js (App Router) product app
2. React SPA (Vite)
3. Node/TypeScript API service
4. Python FastAPI service
5. Django project
6. Go service
7. Spring Boot with Spring Modulith (Kotlin/Java)
8. Monorepo (`apps/` + `packages/`)
9. Rails (note)

## 1. Next.js (App Router) product app

Next.js is "unopinionated about how you organize and colocate your project files". Its documented options: keep project files outside `app/`, put them in top-level folders inside `app/`, or split by feature or route. Private folders (`_components`) opt out of routing, and route groups (`(marketing)`) organize without changing URLs and allow separate root layouts. The layout below combines "`app/` is routing only" with feature folders, aligned with create-t3-app (`src/env`, `src/server`) and bulletproof-react.

```
.
├── src/
│   ├── app/                        # routing only: layout, page, loading, error, route.ts
│   │   ├── (marketing)/            # public pages, own layout
│   │   ├── (app)/                  # authenticated app
│   │   │   └── projects/[id]/page.tsx   # thin: parse params → call feature → render
│   │   └── api/                    # route handlers (webhooks, public API) — thin
│   ├── features/
│   │   └── projects/
│   │       ├── components/         # feature UI (server + client components)
│   │       ├── server/             # queries, mutations, Server Actions, authz — import "server-only"
│   │       ├── schemas.ts          # zod schemas shared by form and action
│   │       └── projects.test.ts
│   ├── components/ui/              # design-system primitives (no feature imports)
│   ├── server/                     # cross-feature server infra
│   │   ├── db/{index.ts,schema.ts}
│   │   └── auth.ts
│   ├── lib/                        # framework-agnostic helpers with real names (money.ts, dates.ts)
│   └── env.ts                      # validated env
├── drizzle/ or prisma/             # migrations
├── e2e/                            # Playwright
├── public/
└── next.config.ts · tsconfig.json (strict, "@/*") · eslint config · .env.example · AGENTS.md
```

Import rules: `app → features → (components/ui, server, lib)`. Features don't import each other's internals; compose them in `app/`. `server/` and `features/*/server` are never imported by client components (`import "server-only"` makes a violation fail the build). Rendering and data-fetching decisions: `frontend-architecture`.

## 2. React SPA (Vite)

From bulletproof-react:

```
src/
├── app/              # routes/, app.tsx, provider.tsx, router.tsx
├── assets/
├── components/       # shared components
├── config/           # global config, validated env
├── features/<name>/  # api/ assets/ components/ hooks/ stores/ types/ utils/ — only the ones needed
├── hooks/            # shared hooks
├── lib/              # preconfigured libraries (api client, query client)
├── stores/           # global state
├── testing/          # test utilities, mocks (e.g. MSW)
├── types/
└── utils/            # generic helpers only; name files for what they do
```

Rules (bulletproof-react): no cross-feature imports, so compose at the app level; unidirectional shared → features → app, enforced with ESLint `import/no-restricted-paths`; import files directly instead of through barrels; absolute imports via `@/*`; kebab-case files and folders enforced by a lint rule. For many features or teams, move to Feature-Sliced Design (`frontend-architecture`).

## 3. Node/TypeScript API service

Components plus three tiers, from Node.js Best Practices:

```
src/
├── modules/                        # business components (bounded contexts)
│   └── orders/
│       ├── entry-points/
│       │   ├── http/orders.routes.ts         # validate (zod/TypeBox) → call domain → map response
│       │   └── queue/order-events.consumer.ts
│       ├── domain/                           # services/use cases, entities, errors — no HTTP/DB imports
│       ├── data-access/                      # repositories/queries for this module's tables only
│       ├── orders.public.ts                  # the module's API for other modules (small, named exports)
│       └── orders.test.ts                    # component tests through the API
├── libraries/                      # generic: logger, config, http-client, errors (each could be a package)
├── config.ts                       # validated env
├── app.ts                          # builds the app without listening (testable)
└── server.ts                       # listens; graceful shutdown on SIGTERM
migrations/ · test/ · Dockerfile · .env.example
```

Rules: other modules import only `orders.public.ts`. `domain/` imports nothing from `entry-points/` or framework packages. `data-access/` touches only this module's tables. Splitting app construction from `listen()` is older Node BP guidance (the English section was merged away), but it is still the simplest way to test HTTP without opening a port. NestJS: one Nest module per bounded context, with the same inward dependency rule.

## 4. Python FastAPI service

Domain packages, inspired by Netflix Dispatch (FastAPI Best Practices):

```
fastapi-project/
├── alembic/                        # migrations: YYYY-MM-DD_slug.py, static and reversible
├── src/
│   ├── auth/
│   │   ├── router.py  schemas.py  models.py  service.py
│   │   ├── dependencies.py  config.py  constants.py  exceptions.py  utils.py
│   ├── posts/                      # same shape, only the files it needs
│   ├── aws/                        # an external integration as its own package: client.py, schemas.py, config.py
│   ├── config.py  database.py  exceptions.py  pagination.py  models.py   # global
│   └── main.py                     # create app, include routers
├── tests/{auth,posts,aws}/         # async test client from day 0; dependency overrides for fakes
├── pyproject.toml + uv.lock
└── .env.example · alembic.ini · AGENTS.md
```

Rules: cross-package imports name the module (`from src.auth import constants as auth_constants`). Keep DB naming conventions and explicit constraint names. Let SQL do joins and aggregation, and use Pydantic for shaping. Ruff for lint and format. Enforce "posts never imports auth internals" with import-linter.

## 5. Django project

HackSoft Django Styleguide:

```
project/
├── config/
│   ├── django/{base,local,production,test}.py   # production differences come from env, not code
│   ├── settings/{celery,cors,sentry,sessions}.py
│   ├── env.py                                    # the single env reader
│   └── urls.py  wsgi.py  asgi.py
├── <project_name>/
│   ├── users/
│   │   ├── models.py  apis.py  urls.py  admin.py
│   │   ├── services.py      # writes: user_create(*, email: str, ...) -> User
│   │   ├── selectors.py     # reads:  user_list(*, fetched_by: User) -> QuerySet[User]
│   │   └── tests/{services/,selectors/}
│   ├── invoices/
│   ├── common/              # BaseModel and truly generic pieces only
│   └── integrations/        # third-party clients
├── manage.py
└── pyproject.toml
```

Rules: business logic only in services and selectors, never in views/APIs, serializers, forms, `save()`, managers, or signals. Integration settings are gated by `USE_<INTEGRATION>` and fail loudly when enabled without their config. Start from the Styleguide example project or cookiecutter-django: "Having the proper structure from the start pays off." When `services.py` grows, turn it into a `services/` package split by sub-domain.

## 6. Go service

The official go.dev guide, "Organizing a Go module": a basic package keeps its code in the root; supporting packages go in `internal/`, which the compiler prevents other modules from importing ("we're free to refactor its API"); a server project looks like:

```
project-root/
├── go.mod
├── cmd/
│   ├── api-server/main.go        # small: load config, wire dependencies, start
│   └── worker/main.go
├── internal/
│   ├── orders/                   # packages named for what they provide
│   ├── users/
│   └── platform/{postgres,httpserver,config}   # adapters (the name is a choice, not official)
└── migrations/ · deploy/ · docs/ # non-Go directories
```

- A single-binary service can start as `main.go` + `go.mod` + a few packages. Add `cmd/` only when there is a second binary.
- "In case the server repository grows packages that become useful for sharing with other projects, it's best to split these off to separate modules."
- **Not a standard**: `golang-standards/project-layout` says in its own README that it is not an official standard from the Go team and is overkill for small projects. Russ Cox opened issue #117 ("this is not a standard Go project layout"), noting most Go code doesn't use `pkg/` and the minimal standard is a LICENSE, a `go.mod`, and Go code organized as you see fit. Don't generate `pkg/`, `src/`, or empty `api/ build/ deployments/` folders.
- Avoid package names like `util`, `common`, `helpers`. Lint with `go vet` + staticcheck or golangci-lint.

## 7. Spring Boot with Spring Modulith (Kotlin/Java)

Spring Modulith treats each direct sub-package of the application's main package as an application module. Types in the module's base package are its API, and sub-packages such as `internal` are hidden from other modules.

```
src/main/kotlin/com/acme/shop/
├── ShopApplication.kt
├── order/                        # module; top-level types = public API
│   ├── OrderManagement.kt        # public service/facade
│   ├── OrderPlaced.kt            # public domain event
│   └── internal/
│       ├── OrderRepository.kt
│       └── OrderEntity.kt
├── inventory/
│   ├── InventoryManagement.kt
│   └── internal/…
└── shared/                       # a genuinely shared kernel only
src/test/kotlin/com/acme/shop/ModularityTests.kt
    // ApplicationModules.of(ShopApplication::class.java).verify()
```

Rules: modules talk through public types or application events. `verify()` fails on cycles and on access to another module's internals, so run it in CI. Add ArchUnit for extra layer rules. When build times or ownership demand it, promote modules to Gradle subprojects with Kotlin `internal` visibility.

## 8. Monorepo (`apps/` + `packages/`)

TS-centric and polyglot-ready, following Turborepo's recommendations:

```
.
├── apps/
│   ├── web/                # Next.js
│   ├── api/                # TS service, or Python/Go with its own toolchain
│   ├── worker/
│   └── mobile/             # Expo
├── packages/
│   ├── ui/                 # design system; exports subpaths, no index of everything
│   ├── db/                 # schema + client + migrations (one owner)
│   ├── api-contract/       # OpenAPI/zod/tRPC types shared by web, mobile, api
│   ├── config-typescript/  # shared tsconfig
│   ├── config-eslint/
│   └── <domain>/           # only when ≥ 2 apps need the same domain logic
├── tooling/                # scripts, generators
├── docs/adr/
├── pnpm-workspace.yaml · turbo.json · package.json (private, orchestration only)
├── .github/CODEOWNERS · .github/workflows/
└── AGENTS.md (+ apps/*/AGENTS.md for app-specific commands)
```

Rules: `apps → packages`, never the reverse; no cycles; no nested packages (Turborepo errors on `apps/a` + `apps/a/b`); every package has its own manifest and `exports`; no `../` across package boundaries (install the package instead); internal packages namespaced (`@repo/*`); no root `tsconfig.json` doing real work, because packages extend a shared config package. A modular monolith's modules live inside `apps/api/src/modules/`, not as packages. Details: `references/monorepos.md`.

## 9. Rails (note)

Rails conventions (`app/models`, `app/controllers`, …) are layer-first by design and work well for one domain. For large apps, group by domain with packs (`packs/<domain>/app/...`, Packwerk) or Rails engines, and keep Rails conventions inside each pack. Shopify's Packwerk retrospective found that privacy rules which fought Rails conventions caused confusion, so work with the framework rather than around it. thoughtbot's Suspenders is a common starting generator.

## Sources

- Next.js, Project structure and organization: https://nextjs.org/docs/app/getting-started/project-structure
- create-t3-app folder structure: https://create.t3.gg/en/folder-structure-app
- bulletproof-react, Project structure and Project standards: https://github.com/alan2207/bulletproof-react/tree/master/docs
- Node.js Best Practices (§1 project structure): https://github.com/goldbergyoni/nodebestpractices
- FastAPI Best Practices: https://github.com/zhanymkanov/fastapi-best-practices
- HackSoft Django Styleguide: https://github.com/HackSoftware/Django-Styleguide
- Go, Organizing a Go module: https://go.dev/doc/modules/layout
- golang-standards/project-layout README and issue #117: https://github.com/golang-standards/project-layout · https://github.com/golang-standards/project-layout/issues/117
- Spring Modulith fundamentals: https://docs.spring.io/spring-modulith/reference/fundamentals.html
- Turborepo, Structuring a repository: https://turborepo.com/docs/crafting-your-repository/structuring-a-repository
- Shopify Packwerk and "A Packwerk Retrospective": https://github.com/Shopify/packwerk · https://shopify.engineering/a-packwerk-retrospective
- thoughtbot tech stack guide: https://github.com/thoughtbot/guides/tree/main/tech-stack
