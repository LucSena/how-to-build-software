# Default stacks by product type (as of 2026-09)

Starting points for a small team with no stronger prior. When the team has shipped with another mainstream stack that fits the target, prefer that stack. Each entry lists the default, the data and hosting pairing, what to avoid, and the trigger for switching. Vendor names are examples, not endorsements. Verify status and pricing at decision time.

## Contents
1. Web SaaS
2. Content sites
3. API / backend services
4. Data and ML
5. CLIs and developer tools
6. Mobile
7. Real-time products
8. AI products
9. Internal tools
10. Hosting choices in detail
11. SQLite vs Postgres
12. Rules catalog

## 1. Web SaaS

| Team | Stack | Data | Hosting |
|---|---|---|---|
| TypeScript | Next.js (App Router) + TS strict + Drizzle or Prisma + zod; tRPC or Server Actions internally, OpenAPI for public APIs | Postgres (managed) | Framework-native PaaS with preview deploys, or a container PaaS if you run workers |
| Ruby / PHP / Python | Rails / Laravel / Django, server-rendered, plus Hotwire / Livewire / HTMX | Postgres | Container PaaS + managed Postgres |

- Server-render by default (thoughtbot: "Use server-rendered HTML when possible… Avoid building single-page applications for the web"). Rendering strategy per route: `frontend-architecture`.
- Avoid: a separate SPA plus a separate API for a small team with no mobile client, since it doubles the deployables and the auth surface. Avoid microservices.
- Switch: a mobile app or third parties need a public API → add a versioned HTTP API (`api-design`) next to the web app, still in one deployable.

## 2. Content sites

- Default: Astro (static output, islands for the few interactive parts) or the CMS the editors already use. Host on a static/edge PaaS or object storage + CDN.
- Headless CMS only when non-developers edit frequently. Choose one that exports content in an open format.
- Avoid: a client-rendered SPA for content (SEO and performance cost), or a full app framework for a 10-page site.
- Switch: the site becomes part of the logged-in product → render it with the product's framework.

## 3. API / backend services

| Team | Default | Notes |
|---|---|---|
| TypeScript | Fastify, or Hono (especially for edge/serverless); NestJS for large OOP-minded teams | Node Best Practices: Nest suits OOP/Java-experienced teams and big monoliths; Fastify suits reasonably sized components |
| Python | FastAPI (typed, async, Pydantic), or Django + DRF / Django Ninja when you want the admin, ORM, and auth | FastAPI: `def` routes for blocking I/O; async drivers otherwise |
| Go | Standard library `net/http` + a small router if needed; `database/sql` or a Postgres driver; sqlc-style generated queries are a common choice | Single binary in a small container |
| JVM | Spring Boot (Kotlin or Java); Spring Modulith for module boundaries | |
| .NET | ASP.NET Core + EF Core | |

- Keep the web layer thin and the domain framework-agnostic so the same code runs in a container or a function (Node BP: keep Express within its boundaries).
- API style (REST/GraphQL/gRPC/tRPC), errors, and pagination: `api-design`.

## 4. Data and ML

- Default: Python with uv, Pydantic, and pytest; notebooks for exploration, promoted to packages for anything scheduled. Serve models with FastAPI or the platform's serving layer.
- Data: Postgres for application data; never run analytics on the OLTP primary. Pick an OLAP store, warehouse, or lakehouse via `data-infrastructure`.
- Orchestration of pipelines and durable jobs: `deployment-and-infrastructure`.
- Avoid: rewriting pipelines in a "faster" language before profiling. Vectorized libraries and the database usually do the heavy lifting.

## 5. CLIs and developer tools

- Default: Go. A single static binary, easy cross-compilation, fast startup.
- Rust when performance or safety is the selling point, or the team knows it. Python or TypeScript for internal tools where the runtime is guaranteed to be installed.
- Distribute through the ecosystem's package manager plus signed release binaries built in CI. Version with SemVer (`project-bootstrap`).

## 6. Mobile

- Decide with `mobile-architecture`: native (SwiftUI, Jetpack Compose), React Native + Expo (TS/web teams; thoughtbot's default for cross-platform app-store apps), Flutter (pixel-identical custom UI), or Kotlin Multiplatform (shared logic, native UI).
- Backend: the web SaaS default, exposing a versioned API. Buy push notifications, auth, and analytics.

## 7. Real-time products

- Default: the main stack + WebSockets or Server-Sent Events. Add a pub/sub layer (Postgres `LISTEN/NOTIFY` at small scale, Redis/Valkey pub/sub or a managed real-time service beyond it) only when connections span several instances.
- Elixir + Phoenix (Channels, LiveView, Presence) when real-time interaction *is* the product and the team knows or will learn the BEAM.
- Collaborative editing: use an established CRDT/sync library or service rather than inventing a conflict-resolution protocol. Local-first sync trade-offs: `frontend-architecture` and `mobile-architecture`.
- Avoid: pure serverless functions for long-lived connections, unless the platform offers a managed WebSocket primitive.

## 8. AI products

- Default: the main web stack (usually TypeScript for the app layer) + hosted model APIs behind one internal gateway module + Postgres with pgvector for retrieval.
- Add a Python service only where model or data work dominates (fine-tuning, evaluation pipelines, custom embeddings).
- Model choice, prompts as code, evals, guardrails, and cost/latency: `ai-native-architecture`. Chat and agent UI: `ai-interface-design`.
- Avoid: a dedicated vector database before pgvector is measured to be insufficient, and agent frameworks that hide the prompt and tool loop you need to debug.

## 9. Internal tools

- Default: the framework's generated admin (Django admin, Rails scaffolds/admin engines, Laravel Filament) or a bought internal-tool builder.
- Build a real app only when the tool becomes customer-facing or its workflow is a competitive advantage.
- Enforce authorization and audit logging even internally (`application-security`).

## 10. Hosting choices in detail

| Option | Examples | Best for | Avoid when |
|---|---|---|---|
| PaaS | Render, Railway, Fly.io, Vercel/Netlify (web), App Service | Startups, small teams, most CRUD SaaS; preview environments built in | Exotic networking, GPUs, or compliance the platform lacks |
| Managed containers | Cloud Run, ECS Fargate, App Runner, Azure Container Apps | Containerized services without a platform team; scale to zero on some | Host-level control; huge long-lived connection counts |
| Containers on a VM | Docker Compose, Kamal on a VM or bare metal | Steady traffic, cost-sensitive, few services; single-node SQLite apps | Spiky global traffic, many teams |
| Serverless functions | Lambda, Cloud Functions, Azure Functions | Spiky/low volume, glue, webhooks, cron | Long-running, latency-critical with cold starts, many DB connections (use a pooler or HTTP driver) |
| Edge functions | Cloudflare Workers, Vercel/Netlify Edge | Redirects, auth checks, personalization near users | Node-only libraries, long CPU, a database far from the edge |
| Managed Kubernetes | EKS, GKE, AKS | Many services and teams with a platform team | Fewer services than people to run the cluster |

- thoughtbot describes a PaaS as "our outsourced operations team": conventions for solved problems, review apps, and pipelines. People cost more than machines for small teams.
- **Heroku**: InfoWorld and others reported in February 2026 that Salesforce moved Heroku to a "sustaining engineering" model (no new features, no new enterprise contracts for new customers). Don't pick it for new projects without flagging this. Existing apps: plan an exit calmly, because nothing forces an emergency move.
- Production baseline on any host (thoughtbot's production checklist): at least two web and worker processes, TLS, config in env, long work in background jobs, remote log collection, a production-grade DB plan with backups, error tracking, and uptime monitoring.
- Lock-in guardrails: OCI images, the Postgres wire protocol, S3-compatible storage, OpenTelemetry, IaC and CI config in the repo, secrets in the platform's store, DNS you control.
- Pipeline, containers, deployment strategies, and Kubernetes criteria: `deployment-and-infrastructure`.

## 11. SQLite vs Postgres

| Choose SQLite when | Choose Postgres when |
|---|---|
| The app runs on one machine with a persistent volume | Several app instances write to the same database |
| Write concurrency is modest (one writer at a time; WAL mode lets readers proceed) | Heavy concurrent writes, or HA failover needed |
| You want zero database operations; Litestream streams changes to object storage for recovery | Serverless or ephemeral compute without a SQLite-over-network service |
| Embedded, desktop, mobile, local-first, per-tenant database files | Analytics, extensions (PostGIS, pgvector), or a large ecosystem of managed hosts |

Rails 8 (2024) made SQLite a first-class production option with database-backed Solid Queue, Solid Cache, and Solid Cable. André Arko's "Rails on SQLite: exciting new ways to cause outages" (2025) is the counterweight: read it before running SQLite with multiple processes or containers. Depth, and the other stores: `data-infrastructure`.

## 12. Rules catalog

### Prefer one deployable per product at the start
**Rule.** Ship the first version as one web app (plus a worker process if needed) against one database.
**Apply when.** Any new product or MVP.
**Do / Avoid.** Do: a Next.js or Django app + a worker + Postgres on a PaaS. Avoid: separate SPA, API gateway, auth service, and notification service on day one.
**Why.** Each deployable adds a pipeline, config, monitoring, and a network failure mode. Small teams pay that overhead with feature time (see `software-architecture`).

### Pair the host with the data layer
**Rule.** Choose hosting and database together: stateless containers + managed Postgres, or one VM + SQLite + Litestream, and never serverless functions opening raw connections to a small Postgres.
**Apply when.** Picking hosting.
**Do / Avoid.** Do: a pooled or HTTP driver for functions. Avoid: Lambda at 1,000 concurrent executions against a Postgres with 100 connections.
**Why.** Connection storms and single-writer limits are the usual first outages on mismatched pairs.

## Sources

- thoughtbot guides — tech stack, hosting, production checklist: https://github.com/thoughtbot/guides
- create-t3-app: https://create.t3.gg
- Node.js Best Practices (framework choice, layering): https://github.com/goldbergyoni/nodebestpractices
- FastAPI Best Practices (async routes): https://github.com/zhanymkanov/fastapi-best-practices
- Next.js project structure: https://nextjs.org/docs/app/getting-started/project-structure
- Litestream: https://github.com/benbjohnson/litestream
- Rails 8 "No PaaS Required": https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required · Solid Queue: https://github.com/rails/solid_queue
- André Arko, "Rails on SQLite: exciting new ways to cause outages": https://andre.arko.net/2025/09/11/rails-on-sqlite-exciting-new-ways-to-cause-outages/
- Heroku sustaining engineering (InfoWorld, Feb 2026): https://www.infoworld.com/article/4129430/salesforce-may-be-prepping-to-phase-out-heroku.html
- Kamal: https://kamal-deploy.org
