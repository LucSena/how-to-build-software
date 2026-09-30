# Language profiles (as of 2026-09)

One profile per mainstream language: what it is for, when to pick something else, the boring ecosystem defaults, and the traps agents fall into. Tool lists are dated. Check each project's current release notes before pinning versions.

## Contents
1. TypeScript · 2. Python · 3. Go · 4. Rust · 5. Java and Kotlin · 6. C# / .NET · 7. Swift · 8. Elixir · 9. Ruby · 10. PHP · 11. Close calls

## 1. TypeScript

- **Choose for**: every browser UI; full-stack web apps where sharing types and validation schemas between client and server removes a class of bugs; API services for TS teams; the app layer of AI products. GitHub's Octoverse 2025 reported TypeScript as the most-used language on GitHub by contributor count as of August 2025.
- **Avoid for**: CPU-heavy compute (image/video processing, heavy numeric work) and teams that won't run strict mode.
- **Defaults**: Node.js LTS; pnpm or npm; Prettier or Biome; ESLint + typescript-eslint (or Biome); `strict` + `noUncheckedIndexedAccess`; zod or valibot at runtime edges; Drizzle, Prisma, or Kysely; Vitest + Playwright. Web: Next.js, React Router (framework mode), SvelteKit, Nuxt, Astro. APIs: Fastify, Hono, NestJS.
- **Watch-outs**: types vanish at runtime, so validate every external input. The npm supply chain is an active attack surface (2025's worm-style package compromises), so vet dependencies and prefer the standard library (`dependency-management`). Node Best Practices advises keeping types simple and using advanced type features only when a real need arises. Alternative runtimes (Bun, Deno) cost an innovation token for production servers.

## 2. Python

- **Choose for**: data, ML, and AI work; scripting and automation; web apps with Django (batteries included, admin) or FastAPI (typed, async APIs).
- **Avoid for**: CPU-bound hot paths in the standard build (the GIL limits thread parallelism, so use processes, native extensions, or another language for that component); small static binaries.
- **Defaults**: `uv` for environments and locking; Ruff for linting and formatting (it replaces black, isort, and autoflake); pyright or mypy in strict mode; Pydantic v2 for validation and settings; SQLAlchemy 2.0 + Alembic (FastAPI) or the Django ORM; pytest. ThoughtWorks Radar Vol. 33 (Nov 2025) lists Pydantic in *Adopt*.
- **Watch-outs**: in FastAPI, blocking I/O inside an `async def` route stalls the event loop. Use `def` routes (run in a threadpool) or async drivers (FastAPI Best Practices). Django: keep business logic out of views, serializers, and signals and in services/selectors (HackSoft Styleguide). Annotate new code fully, because an untyped codebase gains nothing from the type checker.

## 3. Go

- **Choose for**: network services, infrastructure tooling, CLIs, and anything that benefits from a single static binary, fast builds, simple concurrency, and the Go 1 compatibility promise.
- **Avoid for**: domains that want rich type-level modeling (sum types, heavy generic abstractions) and UI.
- **Defaults**: Go modules with the `go`/`toolchain` directive; gofmt; `go vet` + staticcheck or golangci-lint (golint is deprecated); the standard library's `net/http` first and a framework only for a concrete need; `go test` with table-driven tests. Layout: the official go.dev "Organizing a Go module" (`cmd/` + `internal/` only when needed) — see `codebase-organization`.
- **Watch-outs**: `golang-standards/project-layout` is not an official standard. Its own README says so, and Russ Cox called it "not a standard Go project layout" (issue #117). Don't generate `pkg/` or empty scaffolding. Handle and wrap errors with context (`fmt.Errorf("…: %w", err)`); don't ignore them.

## 4. Rust

- **Choose for**: latency- or memory-critical components, systems work, WASM, embedded, and high-quality CLIs, and when memory safety without a GC is a requirement. Stack Overflow's 2025 survey again reported Rust as the most admired language (72%).
- **Avoid for**: a CRUD product backend for a team that doesn't already know Rust. The learning curve and compile times slow iteration where the domain, not performance, is the hard part.
- **Defaults**: cargo; rustfmt; clippy with `-D warnings` in CI; `rust-toolchain.toml`; the tokio async ecosystem for services.
- **Watch-outs**: it costs an innovation token unless the team already knows it. Isolate Rust in the component that needs it (a library, a service, or a WASM module) instead of writing the whole product in it.

## 5. Java and Kotlin

- **Choose for**: enterprise backends with large teams and long lifetimes (Spring Boot); Android (Kotlin + Jetpack Compose); orgs with JVM operations experience. Spring Modulith supports modular monoliths with verified module boundaries.
- **Avoid for**: very small serverless functions where cold start and memory dominate, unless the team knows the JVM tuning options.
- **Defaults**: Gradle (Kotlin DSL) or Maven; Spring Boot; JUnit; ktlint/detekt (Kotlin); ArchUnit or Spring Modulith for boundary tests. Java 21+ virtual threads suit I/O-heavy concurrency without reactive frameworks.
- **Watch-outs**: framework "magic" (annotations, auto-configuration) hides behavior, so keep domain code as plain classes. For mobile-shared code (Kotlin Multiplatform), decide with `mobile-architecture`.

## 6. C# / .NET

- **Choose for**: Microsoft-centric enterprises, Windows desktop, game development with Unity, and high-throughput web APIs with ASP.NET Core (cross-platform).
- **Avoid for**: teams with no .NET experience and no ecosystem reason to adopt it.
- **Defaults**: the modern cross-platform .NET (not the legacy .NET Framework for new work); ASP.NET Core; EF Core; xUnit; `<Nullable>enable</Nullable>` and warnings as errors; `dotnet format`.
- **Watch-outs**: legacy .NET Framework code needs a migration plan and cannot simply be upgraded. Modular monolith examples are common in the .NET community; enforce boundaries with separate projects and `internal`.

## 7. Swift

- **Choose for**: iOS, iPadOS, macOS, watchOS, and visionOS apps (SwiftUI first).
- **Avoid for**: server-side products (the ecosystem is small; hire for it only if the team is Swift-only).
- **Defaults and platform guidance**: `mobile-architecture` and `ios-design`.

## 8. Elixir

- **Choose for**: soft-real-time systems with massive concurrency, presence, chat, and collaboration (Phoenix, LiveView, Channels), and fault tolerance via OTP supervision trees.
- **Avoid for**: teams that must hire quickly in markets with few BEAM developers, and CPU-heavy numeric work.
- **Defaults**: Mix, Phoenix, Ecto (Postgres), ExUnit.
- **Watch-outs**: a small hiring pool. The BEAM's operational model (distribution, hot upgrades) is powerful but unfamiliar, so budget an innovation token unless the team knows it.

## 9. Ruby

- **Choose for**: CRUD-heavy SaaS built by a Rails team. Rails' conventions are still among the fastest paths from idea to a deployed product. Rails 8 (2024) ships database-backed Solid Queue, Solid Cache, and Solid Cable, so small apps can run without Redis.
- **Avoid for**: CPU-heavy workloads and teams with no Ruby experience.
- **Defaults**: Bundler; Rails; RuboCop or Standard; RSpec or Minitest; Sorbet or RBS if the team wants static types; Packwerk or engines for large apps (`codebase-organization`).
- **Watch-outs**: SQLite in production has sharp edges (a single writer, and volumes during deploys), so read the operational caveats before choosing it for multi-process deployments. Keep business logic out of callbacks.

## 10. PHP

- **Choose for**: Laravel or Symfony products, and the WordPress ecosystem; cheap, universally available hosting. McKinley lists PHP among boring, well-understood technologies.
- **Avoid for**: teams with no PHP experience and no ecosystem reason.
- **Defaults**: Composer; Laravel (Livewire for interactivity, Filament for admin) or Symfony; PHPStan or Psalm at a strict level; Pest or PHPUnit.
- **Watch-outs**: code quality in the wider ecosystem varies. Enforce static analysis from day one.

## 11. Close calls

| Choice | Default | Pick the other when |
|---|---|---|
| TS vs Python for an API | The language of the team and of the rest of the product | Python when the service is mostly data/ML work; TS when it mostly serves one TS front end |
| Go vs Rust for a service | Go | Rust when a measured latency/memory target or a safety requirement demands it, and the team can write it |
| Kotlin vs Java (new JVM code) | Kotlin for Android and new Spring services when the team is comfortable with it | Java where the org standardizes on it or tooling requires it |
| Django vs FastAPI | Django for full products (admin, auth, ORM, forms) | FastAPI for API-only services with heavy async I/O or ML serving |
| Next.js vs Rails/Laravel/Django | The team's stack | Next.js when rich client interactivity dominates; the server-rendered framework when CRUD and admin dominate |

## Sources

- GitHub Octoverse 2025: https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/
- Stack Overflow Developer Survey 2025, Technology: https://survey.stackoverflow.co/2025/technology
- JetBrains State of Developer Ecosystem 2025: https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/
- ThoughtWorks Technology Radar Vol. 33 (Nov 2025): https://www.thoughtworks.com/radar
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- FastAPI Best Practices: https://github.com/zhanymkanov/fastapi-best-practices
- HackSoft Django Styleguide: https://github.com/HackSoftware/Django-Styleguide
- Go, "Organizing a Go module": https://go.dev/doc/modules/layout · golang-standards/project-layout issue #117: https://github.com/golang-standards/project-layout/issues/117
- Spring Modulith reference: https://docs.spring.io/spring-modulith/reference/fundamentals.html
- Rails Solid Queue: https://github.com/rails/solid_queue · André Arko, "Rails on SQLite: exciting new ways to cause outages": https://andre.arko.net/2025/09/11/rails-on-sqlite-exciting-new-ways-to-cause-outages/
- Dan McKinley, "Choose Boring Technology": https://mcfunley.com/choose-boring-technology
- thoughtbot tech stack guide: https://github.com/thoughtbot/guides/tree/main/tech-stack
