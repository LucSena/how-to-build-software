# How to Build Software

**Agent Skills for building software that is well-architected, clean, scalable, and designed to 2026 standards — on the web, iOS, and Android.**

One place for the rules you keep pasting into your agent: architecture and design patterns, clean code, scalability and reliability, product design that doesn't look AI-generated, and native mobile design for iOS 26–27 (Liquid Glass) and Android 16–17 (Material 3 Expressive). The skills consolidate and verify guidance from the best existing skill collections, design references, and engineering literature. [Credits](CREDITS.md) lists every source.

Skills follow the open [Agent Skills](https://agentskills.io/specification) format. They work in Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, and any agent that reads `SKILL.md`.

## Install

```bash
# Any agent — interactive picker
npx skills add LucSena/how-to-build-software

# Only some skills
npx skills add LucSena/how-to-build-software --skill design-taste --skill ios-design

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
                 ┌────────────────────────┐
                 │  how-to-build-software  │  router: picks skills, sets the quality bar
                 └───────────┬────────────┘
                             │ reads
                 ┌───────────▼────────────┐
                 │    project-context     │  writes .agents/project-context.md once
                 └───────────┬────────────┘
         ┌───────────────────┼────────────────────┐
   Engineering            Design                Mobile
   architecture           taste · foundations   mobile-design
   patterns · clean code  systems · UX · motion ios-design · android-design
   scale · reliability    a11y · web · review   mobile-architecture
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
| [`clean-code`](skills/clean-code/SKILL.md) | Writing, refactoring, or cleaning up code, or when code is hard to read, name, change, or test |
| [`code-review`](skills/code-review/SKILL.md) | Reviewing code, a diff, a pull request, a branch, or AI-generated changes — including self-review before declaring your own work done |
| [`design-patterns`](skills/design-patterns/SKILL.md) | Deciding whether a design pattern fits, choosing between patterns, or when code feels over- or under-abstracted |
| [`frontend-architecture`](skills/frontend-architecture/SKILL.md) | Choosing or restructuring how a web frontend is built — picking SSG, SSR, streaming SSR, React Server Components, SPA, islands, edge, or local-first per route; deciding where state lives (server cache, URL, form, client store); designing data fetching without waterfalls; securing Server Actions and RSC boundaries; routing, error boundaries, forms with shared validation, i18n plumbing, feature folders, Feature-Sliced Design, pnpm/Turborepo/Nx monorepos, micro-frontends, and JS bundle budgets |
| [`reliability`](skills/reliability/SKILL.md) | A system must keep working when things go wrong — calling external services, APIs, databases, or LLMs; adding timeouts, retries with backoff and jitter, circuit breakers, bulkheads, fallbacks, or graceful degradation; health checks and graceful shutdown; observability with OpenTelemetry, structured logs, metrics, and traces; SLIs, SLOs, error budgets, and burn-rate alerts; safe deploys with feature flags, canaries, and rollbacks; zero-downtime database migrations (expand/contract); incident response, blameless postmortems, and backup/restore drills |
| [`scalability`](skills/scalability/SKILL.md) | A system must handle more users, requests, or data, or is getting slow under load — capacity estimates and back-of-envelope math, the scaling ladder, caching and cache invalidation, database indexes, N+1 queries, pagination, connection pooling, read replicas, partitioning and sharding, background jobs and queues (Postgres queues, Kafka, durable execution), idempotent consumers, transactional outbox, sagas, consistency models, rate limiting, back-pressure and load shedding, multi-tenant SaaS data isolation (row-level security), and cloud cost |
| [`software-architecture`](skills/software-architecture/SKILL.md) | Deciding how a codebase or system should be structured — starting a new product or service, drawing module or service boundaries, choosing between layered, hexagonal/clean, vertical slice, modular monolith, microservices, serverless, or event-driven/CQRS/event sourcing, applying DDD (bounded contexts, aggregates, domain events), splitting or strangling a monolith, laying out a monorepo, writing an ADR, drawing C4 diagrams, or adding architecture fitness functions |
| [`testing-strategy`](skills/testing-strategy/SKILL.md) | Deciding what and how to test, writing or fixing tests, or when tests are slow, flaky, brittle, missing, or not catching bugs |

### Design — product UI, UX, design systems (web-first)

| Skill | Use when |
|---|---|
| [`accessibility`](skills/accessibility/SKILL.md) | Building or reviewing any UI for accessibility — WCAG 2.2 AA conformance, semantic HTML and ARIA, keyboard navigation and focus management (focus rings, modals, skip links, roving tabindex), screen reader announcements and live regions, accessible forms and errors, color contrast (WCAG ratios, APCA as a secondary check), target sizes, reduced motion and vestibular safety, and mobile accessibility (VoiceOver, TalkBack, Dynamic Type, font scaling) |
| [`ai-interface-design`](skills/ai-interface-design/SKILL.md) | Designing or building the user-facing side of an AI feature — chat interfaces, copilots and side panels, inline assist (autocomplete, rewrite, summarize in place), agent and background-task UIs, or generative UI that renders components from model output |
| [`conversion-ux`](skills/conversion-ux/SKILL.md) | Building or improving the screens that turn visitors into users and users into customers — landing pages and heroes, CTAs, social proof, signup and login forms, onboarding and activation, empty states for new accounts, pricing pages, paywalls and upgrade prompts, trials, checkout, and cancellation flows — and when planning A/B tests for them |
| [`data-dense-ui`](skills/data-dense-ui/SKILL.md) | Building or improving dashboards, analytics views, data tables and grids, admin panels, back-office/CRUD screens, filters and saved views, bulk actions, or charts |
| [`design-foundations`](skills/design-foundations/SKILL.md) | Setting or fixing the visual fundamentals of any UI, such as type sizes, line length, spacing, grids, color palettes, contrast, dark mode, shadows, border radius, icon sizing, imagery, or responsive breakpoints |
| [`design-resources`](skills/design-resources/SKILL.md) | Picking or recommending design and UI resources, such as a component library, shadcn registry, icon set, animated icons, font source, inspiration gallery, motion snippets, AI design skill, DESIGN.md generator or library, design-engineering reading, or UX research sites |
| [`design-review`](skills/design-review/SKILL.md) | Asked to review, audit, critique, or QA a user interface — a web page, web app screen, component, design mockup, screenshot, or iOS/Android app — before release or after a build |
| [`design-systems`](skills/design-systems/SKILL.md) | Creating, cleaning up, or extending a design system |
| [`design-taste`](skills/design-taste/SKILL.md) | Choosing or judging the visual direction of any UI (a new landing page, app screen, portfolio, marketing site, or a redesign) and whenever the output risks looking generic or AI-generated |
| [`interaction-design`](skills/interaction-design/SKILL.md) | Building or fixing how UI behaves, not just how it looks — interaction states (hover, focus, active, disabled, loading, error), forms and validation, feedback (toasts, optimistic UI, undo vs confirm), loading, empty, and error states, overlays (modal, sheet, drawer, popover, tooltip), navigation patterns, keyboard shortcuts and command palettes, and microcopy/UX writing (button labels, error messages, empty-state copy) |
| [`motion-design`](skills/motion-design/SKILL.md) | Adding, tuning, or reviewing animation and transitions in a web or mobile UI — deciding whether something should animate at all, choosing easing curves and durations, springs, stagger and choreography, drag/swipe gestures, press feedback, reduced-motion behavior, and animation performance (jank, layout thrash) |
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
template/SKILL.template.md               starting point for new skills
scripts/validate_skills.py      spec + style contract validator
scripts/sync.py                 regenerates this README's index and the plugin manifest
STYLE.md                        the skill contract
```

## Contributing

Read [STYLE.md](STYLE.md) and [AGENTS.md](AGENTS.md), copy `template/SKILL.template.md` to `skills/<name>/SKILL.md`, then run:

```bash
python3 scripts/validate_skills.py
python3 scripts/sync.py
```

## License

[MIT](LICENSE). Adapted ideas are credited in [CREDITS.md](CREDITS.md).
