# How to Build Software

**The notes a senior engineer would leave in your margins — written for your AI agent.**

45 Agent Skills for building software the way experienced people do: starting projects right, choosing a stack, a database, a cache, and a queue, architecture and system design, clean code and object-oriented design, fewer dependencies, environments and deployment, security, reliability, and the lessons of real postmortems — plus product design that doesn't look AI-generated (login, sign-up, onboarding, dashboards, and every common screen) and native mobile design for iOS 26–27 (Liquid Glass) and Android 16–17 (Material 3 Expressive).

The skills consolidate and verify guidance from the best existing skill collections, engineering blogs, talks, RFCs, design systems, platform guidelines, and postmortems. Every reference file ends with its sources — over 1,200 links in total — and [CREDITS.md](CREDITS.md) lists the collections and authors behind them.

**Website:** [lucsena.github.io/how-to-build-software](https://lucsena.github.io/how-to-build-software/) — in English, Português, and Español.

Skills follow the open [Agent Skills](https://agentskills.io/specification) format. They work in Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, and any agent that reads `SKILL.md`.

## Install

```bash
# Any agent — interactive picker
npx skills add LucSena/how-to-build-software

# Only some skills
npx skills add LucSena/how-to-build-software --skill system-design --skill auth-flows

# Running from inside an agent session? Name the agent explicitly
npx skills add LucSena/how-to-build-software -a claude-code
```

**Claude Code plugin marketplace**

```text
/plugin marketplace add LucSena/how-to-build-software
/plugin install how-to-build-software@how-to-build-software   # everything
/plugin install engineering-skills@how-to-build-software      # or one domain
/plugin install design-skills@how-to-build-software
/plugin install mobile-skills@how-to-build-software
```

**Manual**

```bash
git clone https://github.com/LucSena/how-to-build-software
cp -r how-to-build-software/skills/* ~/.claude/skills/     # Claude Code (user scope)
cp -r how-to-build-software/skills/* .agents/skills/       # most other agents (project scope)
```

## How it works

```
                 ┌─────────────────────────┐
                 │  how-to-build-software  │  router: picks 2–5 skills, sets the quality bar
                 └────────────┬────────────┘
                              │ reads
                 ┌────────────▼────────────┐
                 │     project-context     │  writes .agents/project-context.md once
                 └────────────┬────────────┘
       ┌──────────────────────┼───────────────────────┐
  Engineering              Design                   Mobile
  bootstrap · stack        taste · foundations      mobile-design
  architecture · system    systems · UX · motion    ios-design
  data · infra · deploy    auth · onboarding        android-design
  code · OOP · deps        dashboards · screens     mobile-architecture
  security · reliability   a11y · web · review
  failures · code-review
```

1. **Start with `how-to-build-software`.** It routes the request to the 2–5 skills that apply, in decision order: product → architecture → design → implementation → review.
2. **Capture context once with `project-context`.** Every skill reads `.agents/project-context.md` first, so you stop answering the same questions.
3. **Each skill is short and procedural.** `SKILL.md` holds the defaults, decision tables, and gotchas; deep material lives in `references/` and loads only when needed.
4. **Two exit gates:** `code-review` for engineering, `design-review` for UI.

## Skills

<!-- SKILLS:START -->

### Start here

| Skill | Use when |
|---|---|
| [`how-to-build-software`](skills/how-to-build-software/SKILL.md) | Starting or planning any non-trivial software work — a new app, feature, screen, service, refactor, redesign, or review — to pick which engineering, design, and mobile skills apply and in what order |
| [`project-context`](skills/project-context/SKILL.md) | Setting up a project for agent work, or when any other skill needs facts about the product, users, stack, platforms, scale targets, architecture style, design system, brand, or constraints and none are written down |

### Engineering — architecture, clean code, scalability

| Skill | Use when |
|---|---|
| [`ai-native-architecture`](skills/ai-native-architecture/SKILL.md) | Adding or changing any feature that calls an LLM — chat, summarization, extraction, classification, copilots, agents, tool or function calling, MCP servers, RAG, embeddings, semantic search — or when deciding whether an LLM is needed at all |
| [`api-design`](skills/api-design/SKILL.md) | Designing, changing, or reviewing an API contract — REST/HTTP JSON endpoints, GraphQL schemas, gRPC/Protobuf services, tRPC routers, server actions exposed to clients, or webhooks |
| [`application-security`](skills/application-security/SKILL.md) | Writing, reviewing, or hardening any server or web code that handles users, tenants, input, files, URLs, or secrets - authorization and permissions (RBAC, ABAC, ReBAC), IDOR/BOLA and tenant isolation, mass assignment, input validation, SQL and command injection, XSS and Content Security Policy, SSRF, CSRF, file uploads, security headers and CORS, secrets, security logging and alerting, fail-closed error handling, and threat modeling |
| [`clean-code`](skills/clean-code/SKILL.md) | Writing, refactoring, or cleaning up code, or when code is hard to read, name, change, or test |
| [`code-review`](skills/code-review/SKILL.md) | Reviewing code, a diff, a pull request, a branch, or AI-generated changes — including self-review before declaring your own work done |
| [`codebase-organization`](skills/codebase-organization/SKILL.md) | Deciding where code should live, laying out folders for a new project, reorganizing a growing or tangled codebase, or scaling a codebase across more developers and teams |
| [`data-infrastructure`](skills/data-infrastructure/SKILL.md) | Choosing, adding, or replacing a data component — which database (Postgres, MySQL, SQLite, MongoDB, DynamoDB, Cassandra, distributed SQL, ClickHouse/DuckDB/warehouse), which cache (Valkey, Redis, Memcached, in-process, CDN, Solid Cache), which queue or stream (Postgres job queues like River/pg-boss/Solid Queue, Sidekiq/BullMQ, SQS, RabbitMQ, Kafka, NATS, durable execution like Temporal), search engine (Postgres FTS, Meilisearch, Typesense, OpenSearch, Elasticsearch, Algolia), object storage (S3, R2, MinIO alternatives), or vector store (pgvector vs dedicated) |
| [`data-modeling`](skills/data-modeling/SKILL.md) | Designing or changing a database schema — tables, primary keys (bigint identity, UUIDv7, ULID, Snowflake), constraints (NOT NULL, CHECK, UNIQUE, foreign keys, EXCLUDE), enums vs lookup tables, money, timestamps and time zones, names, addresses, emails and phones, soft delete vs archive, audit and history tables, multi-tenant schemas (tenant_id, composite foreign keys, row-level security), JSONB, many-to-many, trees, hot-row counters, optimistic locking, idempotency and outbox tables, zero-downtime migrations and backfills, indexing, naming, DynamoDB single-table design, event-sourcing storage, PII retention, analytics via CDC, and SQLite in production |
| [`dependency-management`](skills/dependency-management/SKILL.md) | Adding, choosing, auditing, updating, or removing a package or library, or before running npm/pnpm/yarn/bun/pip/uv/go/cargo install |
| [`deployment-and-infrastructure`](skills/deployment-and-infrastructure/SKILL.md) | Shipping to production or changing how software runs — CI/CD pipelines, GitHub Actions, Dockerfiles and container images, build-once promotion by digest, deployment strategies (rolling, blue/green, canary, progressive delivery, feature flags), rollback vs roll-forward, migrations as a pipeline step, infrastructure as code (Terraform, OpenTofu, Pulumi), state and drift, GitOps (Argo CD, Flux), choosing where to run it (PaaS, containers on a VM with Kamal, serverless, managed Kubernetes, edge), Kubernetes probes and graceful shutdown, cron jobs, background workers, durable workflows (Temporal, Inngest, Restate), release markers, DORA metrics, and infra cost |
| [`design-patterns`](skills/design-patterns/SKILL.md) | Deciding whether a design pattern fits, choosing between patterns, or when code feels over- or under-abstracted |
| [`environments-and-config`](skills/environments-and-config/SKILL.md) | Setting up or fixing environments, config, or secrets — local, CI, preview, staging, production; env vars and .env files; typed config validated at startup (Zod/t3-env, pydantic-settings); config vs secrets vs feature flags vs public build-time vars (NEXT_PUBLIC_, VITE_); secret managers, workload identity, OIDC; secret scanning, rotation, leaked keys; per-environment cloud accounts; preview environments and database branching; staging limits and testing in production; seed and anonymized data; one-command local dev (Compose, dev containers, mise, devbox); config drift; env-specific bugs (time zones, locale, CPU arch) |
| [`frontend-architecture`](skills/frontend-architecture/SKILL.md) | Choosing or restructuring how a web frontend is built — picking SSG, SSR, streaming SSR, React Server Components, SPA, islands, edge, or local-first per route; deciding where state lives (server cache, URL, form, client store); designing data fetching without waterfalls; securing Server Actions and RSC boundaries; routing, error boundaries, forms with shared validation, i18n plumbing, feature folders, Feature-Sliced Design, pnpm/Turborepo/Nx monorepos, micro-frontends, and JS bundle budgets |
| [`lessons-from-failures`](skills/lessons-from-failures/SKILL.md) | Planning, running, or reviewing a risky change — a deploy, config or feature-flag push, schema migration, deletion or bulk script, dependency update, infrastructure change, an AI agent acting with production access, a rewrite, or a redesign — to check it against how real systems, projects, and products have failed |
| [`object-oriented-design`](skills/object-oriented-design/SKILL.md) | Designing classes, objects, or interfaces, deciding between a class and plain functions, or untangling an OOP mess — god objects, Manager/Helper/Util classes, deep inheritance, getters and setters everywhere, singletons, anemic models, IFoo + FooImpl pairs |
| [`project-bootstrap`](skills/project-bootstrap/SKILL.md) | Starting a new project, repository, service, or app, or when an existing repo is missing basic engineering standards |
| [`reliability`](skills/reliability/SKILL.md) | A system must keep working when things go wrong — calling external services, APIs, databases, or LLMs; adding timeouts, retries with backoff and jitter, circuit breakers, bulkheads, fallbacks, or graceful degradation; health checks and graceful shutdown; observability with OpenTelemetry, structured logs, metrics, and traces; SLIs, SLOs, error budgets, and burn-rate alerts; safe deploys with feature flags, canaries, and rollbacks; zero-downtime database migrations (expand/contract); incident response, blameless postmortems, and backup/restore drills |
| [`scalability`](skills/scalability/SKILL.md) | A system must handle more users, requests, or data, or is getting slow under load — capacity estimates and back-of-envelope math, the scaling ladder, caching and cache invalidation, database indexes, N+1 queries, pagination, connection pooling, read replicas, partitioning and sharding, background jobs and queues (Postgres queues, Kafka, durable execution), idempotent consumers, transactional outbox, sagas, consistency models, rate limiting, back-pressure and load shedding, multi-tenant SaaS data isolation (row-level security), and cloud cost |
| [`software-architecture`](skills/software-architecture/SKILL.md) | Deciding how a codebase or system should be structured — starting a new product or service, drawing module or service boundaries, choosing between layered, hexagonal/clean, vertical slice, modular monolith, microservices, serverless, or event-driven/CQRS/event sourcing, applying DDD (bounded contexts, aggregates, domain events), splitting or strangling a monolith, laying out a monorepo, writing an ADR, drawing C4 diagrams, or adding architecture fitness functions |
| [`system-design`](skills/system-design/SKILL.md) | Designing a system, service, or large feature end to end, or writing or reviewing a design doc, RFC, or technical proposal — problem framing, requirements and non-goals, SLOs and downtime budgets, back-of-envelope and data-size estimates, access patterns and invariants, data model, API sketch, high-level architecture, deep dives, failure modes, trade-offs and alternatives considered, rollout and migration plans (dual-write, shadow reads, logical sharding, cells), and real case studies (Discord, Figma, Notion, Shopify, Stripe, Slack, GitHub, Segment, Prime Video) |
| [`tech-stack-selection`](skills/tech-stack-selection/SKILL.md) | Choosing or changing a programming language, framework, database, hosting platform, or third-party service for a new or existing product — including "what stack should I use", "Next.js or Django?", "Go or Rust?", "where should we host this?", or "should we build our own auth?" |
| [`testing-strategy`](skills/testing-strategy/SKILL.md) | Deciding what and how to test, writing or fixing tests, or when tests are slow, flaky, brittle, missing, or not catching bugs |

### Design — product UI, UX, design systems (web-first)

| Skill | Use when |
|---|---|
| [`accessibility`](skills/accessibility/SKILL.md) | Building or reviewing any UI for accessibility — WCAG 2.2 AA conformance, semantic HTML and ARIA, keyboard navigation and focus management (focus rings, modals, skip links, roving tabindex), screen reader announcements and live regions, accessible forms and errors, color contrast (WCAG ratios, APCA as a secondary check), target sizes, reduced motion and vestibular safety, and mobile accessibility (VoiceOver, TalkBack, Dynamic Type, font scaling) |
| [`ai-interface-design`](skills/ai-interface-design/SKILL.md) | Designing or building the user-facing side of an AI feature — chat interfaces, copilots and side panels, inline assist (autocomplete, rewrite, summarize in place), agent and background-task UIs, or generative UI that renders components from model output |
| [`app-screen-patterns`](skills/app-screen-patterns/SKILL.md) | Building or reviewing the common screens of a SaaS or product app - settings, profile and account, team members, invites and roles, billing, plans and usage, notifications, search, detail pages, create and edit flows, wizards, bulk actions, CSV import and export, file upload, audit log, API keys, webhooks, integrations, error pages, cookie consent, destructive confirmations, account deletion, and changelog or what's new |
| [`auth-flows`](skills/auth-flows/SKILL.md) | Building, fixing, or reviewing login, sign-in, sign-up, registration, or account-security screens and the code behind them - email and password, email codes (OTP), magic links, social login (Google, Apple, Microsoft), enterprise SSO (SAML, OIDC), passkeys, MFA and 2FA, recovery codes, password reset, account recovery, email verification, sessions and cookies, remember me, sign out everywhere, and mobile auth |
| [`conversion-ux`](skills/conversion-ux/SKILL.md) | Building or improving the screens that turn visitors into users and users into customers — landing pages and heroes, CTAs, social proof, signup forms as a conversion step, pricing pages, paywalls and upgrade prompts, trials, checkout, and cancellation flows — and when planning A/B tests for them |
| [`dashboard-design`](skills/dashboard-design/SKILL.md) | Designing or building a dashboard, home screen, analytics overview, live operations view, or executive KPI page, or the app shell around a product — sidebar, header, breadcrumbs, command palette (Cmd/Ctrl+K), workspace switcher, account menu, notifications entry, and responsive shell |
| [`data-dense-ui`](skills/data-dense-ui/SKILL.md) | Building or improving data tables and grids, admin panels, back-office/CRUD screens, filters and saved views, bulk actions, charts, KPI tiles, or number formatting |
| [`design-foundations`](skills/design-foundations/SKILL.md) | Setting or fixing the visual fundamentals of any UI, such as type sizes, line length, spacing, grids, color palettes, contrast, dark mode, shadows, border radius, icon sizing, imagery, or responsive breakpoints |
| [`design-resources`](skills/design-resources/SKILL.md) | Picking or recommending design and UI resources, such as a component library, shadcn registry, icon set, animated icons, font source, inspiration gallery, motion snippets, AI design skill, DESIGN.md generator or library, design-engineering reading, or UX research sites |
| [`design-review`](skills/design-review/SKILL.md) | Asked to review, audit, critique, or QA a user interface — a web page, web app screen, component, design mockup, screenshot, or iOS/Android app — before release or after a build |
| [`design-systems`](skills/design-systems/SKILL.md) | Creating, cleaning up, or extending a design system |
| [`design-taste`](skills/design-taste/SKILL.md) | Choosing or judging the visual direction of any UI (a new landing page, app screen, portfolio, marketing site, or a redesign) and whenever the output risks looking generic or AI-generated |
| [`interaction-design`](skills/interaction-design/SKILL.md) | Building or fixing how UI behaves, not just how it looks — interaction states (hover, focus, active, disabled, loading, error), forms and validation, feedback (toasts, optimistic UI, undo vs confirm), loading, empty, and error states, overlays (modal, sheet, drawer, popover, tooltip), navigation patterns, keyboard shortcuts and command palettes, and microcopy/UX writing (button labels, error messages, empty-state copy) |
| [`motion-design`](skills/motion-design/SKILL.md) | Adding, tuning, or reviewing animation and transitions in a web or mobile UI — deciding whether something should animate at all, choosing easing curves and durations, springs, stagger and choreography, drag/swipe gestures, press feedback, reduced-motion behavior, and animation performance (jank, layout thrash) |
| [`onboarding-design`](skills/onboarding-design/SKILL.md) | Designing, building, or fixing what a new user experiences between sign-up and real value — first run, activation, aha moment, time-to-value, empty accounts, welcome screens, setup wizards, checklists, product tours, tooltips, personalization questions, sample data and templates, team invites and the invited teammate's first run, mobile first launch and permission timing, paywall placement in onboarding, lifecycle nudges, re-onboarding, and feature announcements |
| [`ux-principles`](skills/ux-principles/SKILL.md) | Deciding how a screen, flow, or feature should work for people, or when explaining why users struggle with it |
| [`web-platform`](skills/web-platform/SKILL.md) | Implementing or reviewing the web-platform layer of a site or web app — which modern CSS features are safe to use in 2026 (Baseline status for container queries, :has, @layer, subgrid, nesting, view transitions, anchor positioning, popover, @starting-style, light-dark, oklch, field-sizing and more), Core Web Vitals (LCP, INP, CLS) and how to fix them, images, fonts, JavaScript budgets, metadata/SEO/Open Graph basics, internationalization and RTL with logical properties, dark mode without a flash, and progressive enhancement |

### Mobile — iOS 26–27, Android 16–17, cross-platform

| Skill | Use when |
|---|---|
| [`android-design`](skills/android-design/SKILL.md) | Designing or building an Android phone, tablet, foldable, or ChromeOS app UI (Compose, Views, or cross-platform), or adopting Material 3 Expressive |
| [`ios-design`](skills/ios-design/SKILL.md) | Designing or building an iPhone or iPad app UI, in SwiftUI, UIKit, or a cross-platform stack targeting iOS, or when adopting or reviewing the iOS 26/27 Liquid Glass design |
| [`mobile-architecture`](skills/mobile-architecture/SKILL.md) | Choosing a mobile stack or structuring or shipping a mobile app |
| [`mobile-design`](skills/mobile-design/SKILL.md) | Designing, building, or reviewing any iPhone, iPad, Android phone, tablet, or foldable app screen or flow, native or cross-platform (React Native, Expo, Flutter, Compose Multiplatform) |

<!-- SKILLS:END -->

## Principles behind the collection

- **Signal over coverage.** Every line passes the test "would the agent get this wrong without it?" Generic advice is cut; defaults, thresholds, and gotchas stay.
- **Defaults, not menus.** Each skill picks a default and names the trigger for the alternative.
- **Boring by default.** Modular monolith, managed Postgres, platform conventions, system components. Heavier options need a stated reason.
- **Taste is a process, not a vibe.** Ground the design in the subject, plan tokens, compare against the generic default, spend boldness in one place, critique.
- **Platform-true mobile.** Liquid Glass (iOS 26+) and Material 3 Expressive are used as designed, not imitated on the wrong platform.
- **Ethics floor.** No dark patterns, fabricated data, or fake social proof — ever.
- **Dated and sourced.** Anything that ages (library versions, trendy fonts, Baseline status) is labeled with its date, and every reference file lists its sources.

## Repository layout

```
skills/<name>/SKILL.md          the skill (≤ 500 lines)
skills/<name>/references/*.md   deep material, loaded on demand
skills/<name>/evals/evals.json   test prompts with objective expectations
site/                           the website generator (built from the skills; deployed by GitHub Pages)
template/SKILL.template.md      starting point for new skills
scripts/validate_skills.py      spec + style contract validator
scripts/sync.py                 regenerates this README's index and the plugin manifest
STYLE.md                        the skill contract
```

## Contributing

Read [STYLE.md](STYLE.md) and [AGENTS.md](AGENTS.md), copy `template/SKILL.template.md` to `skills/<name>/SKILL.md`, then run:

```bash
python3 scripts/validate_skills.py --strict
python3 scripts/sync.py
cd site && npm ci && npm run build && npm run check   # preview the website in _site/
```

## License

[MIT](LICENSE). Adapted ideas are credited in [CREDITS.md](CREDITS.md).
