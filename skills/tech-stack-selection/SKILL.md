---
name: tech-stack-selection
description: Use when choosing or changing a programming language, framework, database, hosting platform, or third-party service for a new or existing product — including "what stack should I use", "Next.js or Django?", "Go or Rust?", "where should we host this?", or "should we build our own auth?". Covers boring technology and innovation tokens, a weighted decision matrix (team skill, hiring, ecosystem, performance, type safety, AI-assistance quality, deployment target, longevity, license, lock-in, cost), 2026 default stacks by product type (web SaaS, content site, API, data/ML, CLI, mobile, real-time, AI product), language profiles, framework defaults, Postgres as the default database, PaaS vs containers vs serverless vs VM, buy vs build for auth, payments, email, search, analytics, and feature flags, and recording the decision in an ADR. Not for choosing among databases, caches, or queues in depth (use data-infrastructure), mobile frameworks (use mobile-architecture), or repo setup (use project-bootstrap).
license: MIT
metadata:
  version: "1.0.1"
  category: engineering
  related: "project-bootstrap software-architecture data-infrastructure deployment-and-infrastructure mobile-architecture codebase-organization"
---

# Tech Stack Selection

The best stack is the one the team can ship and operate for years, not the one that wins benchmarks. Most stack failures come from spending novelty where it buys nothing: a new language for a CRUD app, a second database for data Postgres handles, or a platform nobody on the team has run in production. This skill picks boring, well-understood defaults, spends innovation only where it differentiates the product, and writes the decision down with the trigger that should reopen it.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

You need four facts before recommending anything: **deployment target(s)**, **what the team already knows well**, **requirements stated in numbers** (or an explicit "none yet"), and **hard constraints** (compliance, budget, data residency, existing systems). If an existing codebase is involved, the default answer is "keep the current stack" unless a written reason makes it too expensive.

## Core principles

1. **Team skill and the deployment target decide first.** A team fluent in Django ships faster in Django than in a "better" stack it is learning. The platform (browser, iOS, GPU notebook) often leaves only one sensible language.
2. **Choose boring technology; spend innovation tokens deliberately.** Dan McKinley: every company gets "about three innovation tokens". Boring technology's value is that its capabilities *and failure modes* are known.
3. **Bleed responsibly.** Take risks only where the exit is cheap (T3 axiom: bet on thin, swappable layers, never on the database). The more data a component holds, the more boring it must be.
4. **Performance claims need numbers.** Without a stated p95 latency, throughput, memory, or cold-start target, performance is not a criterion. Most product backends are I/O-bound.
5. **Prefer typed, mainstream languages.** Types catch a class of bugs before runtime, and they make AI-generated code easier to check (see the evidence below). Popular ecosystems have more libraries, answers, and hires.
6. **Buy generic capabilities, build the differentiator.** Auth, payments, email, error tracking, and feature flags are solved problems. Your team's scarce expertise belongs in the core domain.
7. **Keep exits open at the data layer.** Standard protocols (SQL, Postgres wire protocol, S3 API, OCI images, OpenTelemetry) let you change vendors without rewriting.
8. **Compare 2–3 options, spike the uncertain part, write it down.** An ADR with the rejected options and a "revisit when" trigger ends the debate and lets it reopen only when the facts change.

## Workflow

- [ ] **1. Gather the four facts** (target, team skills, numeric requirements, constraints). Ask at most 5 questions, and only for gaps the context file and repo do not answer.
- [ ] **2. Start from the default** for the product type (table below). If the team's strongest stack also fits, prefer it over the table.
- [ ] **3. Shortlist at most 3 candidates**, and only when a default fails a requirement or constraint. Name the requirement it fails.
- [ ] **4. Score them** on the weighted matrix (`references/criteria-and-matrix.md`). Gates (license, compliance, target) are pass/fail before any scoring.
- [ ] **5. Spike the riskiest unknown**, time-boxed to a few days: the hardest integration, a load test on your own data shape, or a deploy to the chosen host. Gate: evidence, not opinion.
- [ ] **6. Choose buy vs build for each generic capability** (`references/buy-vs-build.md`).
- [ ] **7. Count innovation tokens.** List every component the team has not run in production before. More than ~3 means cut back.
- [ ] **8. Record the decision** as an ADR: context, options, decision, consequences, and a "revisit when" trigger. Hand off to `project-bootstrap`.

## Decision criteria (weighted)

Default weights for a small product team (1 = minor, 3 = decisive). Adjust them and show the adjustment.

| Criterion | Question | Weight |
|---|---|---|
| **Gates** (pass/fail) | Runs on the deployment target? License acceptable (OSI, no relicensing trap for how you use it)? Meets compliance/residency? | Gate |
| Team skill | Has the team shipped and operated this in production? | 3 |
| Ecosystem maturity | Mature libraries for *your* domain (auth, payments, ORM, queues, PDFs, ML)? Good docs? | 3 |
| Operational fit | Can this team deploy, monitor, and debug it (single binary vs VM runtime vs serverless limits)? | 2 |
| Type safety | Static or strict gradual typing that is idiomatic, not bolted on? | 2 |
| AI-assistance quality | Popular enough, and typed enough, that generated code is plentiful and checkable? | 2 |
| Hiring and community | Can you hire or contract for it in your market? Is the community stable or growing? | 2 |
| Longevity | Age, governance (foundation vs single vendor), LTS policy, compatibility record | 2 |
| Lock-in and exit cost | Proprietary APIs, or standard protocols with a migration path? | 1 |
| Performance | Meets the *stated* numeric requirement? Use weight 3 only when such a number exists | 1 (3 with numbers) |
| Cost | Licenses, hosting at today's and 10× load, people | 1 |

**Typed languages and AI-assisted coding.** Mündler et al. (PLDI 2025) found that, in their evaluation, about 94% of compilation errors in LLM-generated code were type-check failures rather than syntax errors, and that constraining generation with the type system reduced them. GitHub's Octoverse 2025 report connects TypeScript's rise to the same effect. Practical upshot: pick a typed language, turn on strict mode, and make the type checker part of every agent's edit loop.

## Default stacks by product type (as of 2026-09)

| Product | Default | Switch when |
|---|---|---|
| **Web SaaS, TS team** | Next.js (App Router) + TypeScript + Postgres (Drizzle or Prisma), T3-style | Team prefers Vue/Svelte → Nuxt/SvelteKit; less framework magic → React Router (framework mode) |
| **Web SaaS, Ruby/PHP/Python team, CRUD-heavy** | Rails / Laravel / Django, server-rendered, with Hotwire / Livewire / HTMX for interactivity | Rich client-side interaction dominates → add a React/TS front end |
| **Content site, docs, blog, marketing** | Astro (static + islands) or the CMS the team already runs | Part of the product app → the app's framework, statically rendered |
| **JSON/HTTP API** | Team's language: Fastify or Hono (TS) · FastAPI or Django + DRF/Ninja (Python) · Go `net/http` · Spring Boot (JVM) · ASP.NET Core (.NET) | NestJS when a large OOP/Java-minded team wants a structured framework |
| **Data / ML / pipelines** | Python (uv, Pydantic, FastAPI for serving), Postgres; warehouse/OLAP choice via `data-infrastructure` | Heavy streaming or analytics scale → `data-infrastructure` |
| **CLI / dev tool** | Go (single static binary, fast builds) | Rust when performance or safety is the product, or the team knows it; Python/TS for internal scripts where the runtime is already installed |
| **Mobile app** | Native (Swift/SwiftUI, Kotlin/Compose) or React Native + Expo for TS teams. Decide with `mobile-architecture` | Flutter or Kotlin Multiplatform per `mobile-architecture` |
| **Real-time (chat, presence, collaboration)** | Main stack + WebSockets/SSE, with a pub/sub layer only when fan-out spans instances | Real-time *is* the product and the team knows (or will learn) the BEAM → Elixir + Phoenix |
| **AI product (LLM features, RAG, agents)** | Main web stack (TS app layer) + hosted model APIs + Postgres with pgvector; Python service only where model/data work dominates | Heavy training, evaluation, or data pipelines → Python-first. Design via `ai-native-architecture` |
| **Internal tools / admin** | The framework's admin (Django admin, Rails, Laravel Filament) or a bought internal-tool builder | Becomes customer-facing → a real app |
| **Enterprise backend, many teams, long-lived** | Java/Kotlin + Spring Boot, or C# + ASP.NET Core | The org already standardizes on something else |
| **Latency/memory-critical, systems, WASM** | Rust | No Rust skills and no hard requirement → Go or the JVM |

Framework notes that change often (versions, routers, ORMs) belong in the ADR with a date, not in code comments. Deeper per-product guidance: `references/defaults-by-product.md`.

## Languages at a glance

| Language | Choose for | Avoid when |
|---|---|---|
| TypeScript | Web front end; full-stack web; APIs when sharing types with the client pays off | CPU-heavy compute; teams unwilling to run strict mode |
| Python | Data, ML/AI, scripting; Django/FastAPI web | CPU-bound hot paths in the default GIL build; tiny-footprint binaries |
| Go | Network services, infra tooling, CLIs; simple deploys | The team wants rich type-level modeling (sum types, heavy generics); UI work |
| Rust | Performance/safety-critical components, WASM, embedded, CLIs | CRUD product backends for a team that doesn't know it |
| Java / Kotlin | Enterprise backends (Spring), Android (Kotlin) | Tiny serverless functions where cold start matters, unless tuned |
| C# / .NET | Enterprise and Windows shops, games (Unity), high-throughput APIs | Teams with no .NET experience and no Microsoft-ecosystem reason |
| Swift | Apple platforms | Server-side products (niche ecosystem) |
| Elixir | Soft-real-time, massive concurrency, fault tolerance (Phoenix/LiveView) | Hiring-constrained teams without BEAM experience |
| Ruby | Fastest path to a CRUD SaaS for a Rails team | Teams with no Ruby experience; CPU-heavy workloads |
| PHP | Laravel/WordPress-ecosystem products; cheap, well-understood hosting | Teams with no PHP experience |

Profiles with ecosystem defaults and watch-outs: `references/language-profiles.md`.

**Same language front and back?** It gives you shared types and validation schemas end to end, one toolchain, easier staffing, and fewer context switches. It also forces a JS runtime onto work that may fit Python or Go better. Rule: **share contracts, not necessarily runtimes.** If the backend is not TypeScript, generate typed clients from OpenAPI, GraphQL, or protobuf so type safety still crosses the boundary.

## Database

Default: **PostgreSQL**. It covers relational data, JSONB documents, full-text search, job queues (`FOR UPDATE SKIP LOCKED`), pub/sub (`LISTEN/NOTIFY`), vectors (pgvector), and geospatial data (PostGIS) at small-to-medium scale. Use **SQLite** for single-node apps with a persistent volume and modest write concurrency, and for embedded, desktop, mobile, and local-first products (Litestream replicates it to object storage). A second datastore (Redis/Valkey, a document DB, a search engine, Kafka, a vector DB) requires an ADR naming the query, throughput, or latency Postgres cannot meet. Choosing and combining stores in depth is `data-infrastructure`; schema design is `data-modeling`.

## Hosting

| Situation | Default |
|---|---|
| Framework front end (Next.js, SvelteKit, Astro), small team | Framework-native PaaS with preview deploys (e.g. Vercel, Netlify, Cloudflare) |
| Web app + Postgres + worker, small team | Container PaaS or managed containers (e.g. Render, Railway, Fly.io, Cloud Run, ECS Fargate) + managed Postgres |
| Single-node app, SQLite, cost-sensitive, steady load | One VM with a volume + Docker Compose or Kamal; Litestream backups |
| Spiky or low traffic, event glue, webhooks, cron | Serverless functions with pooled or HTTP database drivers |
| Many services and teams, compliance, a platform team exists | Major cloud with IaC; managed Kubernetes only with a platform team |

**Heroku**: in February 2026 Salesforce reportedly moved Heroku to a "sustaining engineering" model (no new features). Do not recommend it for new projects without flagging this. Existing apps can stay while a migration is planned. Lock-in guardrails: OCI containers, the Postgres wire protocol, S3-compatible storage, OpenTelemetry, IaC in the repo, and DNS you control. Platform trade-offs, CI/CD, and containers: `deployment-and-infrastructure`.

## Buy vs build

| Capability | Default | Build only if |
|---|---|---|
| Authentication (passwords, OAuth, passkeys, MFA, sessions) | The framework's built-in auth, a maintained library (e.g. Better Auth, Auth.js), or a hosted IdP | Identity *is* the product, or no vendor meets residency needs. Flows: `auth-flows` |
| Payments, billing, tax | Stripe, Paddle, Adyen; a merchant of record for global sales tax | Never build card handling (PCI scope) |
| Transactional email | Postmark, Amazon SES, Resend, SendGrid | — |
| Search | Postgres full-text/trigram → Meilisearch/Typesense/Algolia → OpenSearch at scale | — |
| Product analytics | A hosted or self-hostable analytics tool (e.g. PostHog); privacy-first web analytics (e.g. Plausible) | Only your warehouse's event tables, once a data team exists |
| Feature flags | OpenFeature API + a vendor or OSS provider (e.g. Unleash, Flagsmith, LaunchDarkly) | ≤ 5 static flags → plain config |
| Error tracking, APM, logs | Sentry or equivalent; OpenTelemetry to a vendor or the Grafana stack | — |
| File storage | S3-compatible object storage + CDN | — |
| Background jobs | The framework's queue or a Postgres-backed queue first | — |

Vendor names are examples, not endorsements. Verify current status and pricing before recommending one. Evaluation checklist and exit plans: `references/buy-vs-build.md`.

## Survey data (use only for the ecosystem and hiring criteria)

- **GitHub Octoverse 2025** (Oct 2025): TypeScript became the most-used language on GitHub by contributor count in August 2025, overtaking Python and JavaScript. Python still leads AI and data-science repositories.
- **Stack Overflow Developer Survey 2025**: PostgreSQL was reported as the most-used database among professional developers (55.6%) and the most admired and desired. Rust was again the most admired language (72%).
- **JetBrains State of Developer Ecosystem 2025**: TypeScript, Rust, and Go led its "Language Promise Index".

Popularity is not fitness. Use these numbers to argue against niche picks for teams without the skills, never to override team skill.

## Gotchas

- **Recommending what is fashionable, or what the agent writes best, instead of what the team knows.** Ask what the team has shipped. Team skill carries weight 3.
- **Benchmark-driven choices.** A framework that is "10× faster" in a hello-world benchmark changes nothing for an I/O-bound app. Demand a numeric requirement first.
- **Microservices, Kubernetes, or event sourcing for a new product.** Default to one deployable on a PaaS. See `software-architecture`.
- **A second datastore "for scale" on day one.** Redis for caching, Mongo for "flexible JSON", or Elasticsearch for simple search, all before any measurement. Postgres first, with an ADR for each addition.
- **Rewrites to change languages.** A rewrite restarts the bug count and freezes features. Prefer strangling one component with a measured problem.
- **Ignoring license and governance.** Redis moved to source-available licenses in 2024, which prompted the Linux Foundation's Valkey fork. Terraform moved to BUSL in 2023, which prompted OpenTofu. Check the license at adoption and at every major upgrade.
- **Recommending Heroku as the default PaaS** without flagging its 2026 sustaining-engineering status.
- **Building auth or billing "because it's simple".** Sessions, resets, MFA, proration, dunning, and tax become a permanent side project. Buy them.
- **Split-language stacks by accident.** A Python backend plus a TS front end with no generated client means types stop at the network boundary. Generate clients from the schema.
- **Hiding the decision in chat.** Without an ADR, the same debate returns every quarter. Write it down, with the revisit trigger.

## Output format

```
Stack decision — <product>
Facts: target <…> · team skills <…> · requirements <numbers or "none yet"> · constraints <…>
Recommendation: language · framework · database · hosting · services (auth, payments, email, flags, errors)
Why: <3–5 bullets tied to criteria>
Rejected: <option — reason> (1–2 lines each)
Innovation tokens spent: <list, or "none">
Risks and spike: <riskiest unknown → time-boxed experiment>
Revisit when: <measurable trigger>
ADR: docs/adr/NNNN-<title>.md (drafted, status: proposed)
```

When comparing options, include the weighted matrix table with scores and the weight adjustments you made.

## References

| File | Read when |
|---|---|
| `references/criteria-and-matrix.md` | Scoring 2–3 options, adjusting weights for context, checking license and longevity, or designing a spike |
| `references/language-profiles.md` | The team is weighing a specific language, or you need ecosystem defaults (tooling, frameworks, watch-outs) |
| `references/defaults-by-product.md` | Proposing a full stack for a product type, choosing hosting, or deciding SQLite vs Postgres |
| `references/buy-vs-build.md` | Deciding whether to build or buy auth, billing, email, search, analytics, flags, or observability, or evaluating a vendor |

## Related skills

- `project-bootstrap` — once the stack is chosen: scaffold, CI, walking skeleton, first ADRs.
- `data-infrastructure` — choosing and combining databases, caches, queues, search, and object storage in depth.
- `deployment-and-infrastructure` — hosting platform trade-offs, CI/CD, containers, IaC.
- `mobile-architecture` — native vs React Native vs Flutter vs KMP.
- `software-architecture` — architecture style and module boundaries for the chosen stack.
- `codebase-organization` — the folder layout for the chosen framework.
