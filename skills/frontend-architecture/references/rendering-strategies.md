# Rendering strategies

How each rendering mode works, what it costs, and when to pick it. Decide per route. Revisit when a route's freshness, personalization, or interactivity changes.

## Contents

1. Mode catalog
2. Decision questions
3. Caching and revalidation rules
4. Edge vs regional compute
5. Local-first and sync engines
6. Framework mapping (as of 2026-09)
7. Budgets and verification

## 1. Mode catalog

| Mode | How it works | Strengths | Costs and traps |
|---|---|---|---|
| **Static (SSG)** | HTML built ahead of time, served from CDN | Fastest TTFB and LCP, cheapest, most resilient | Build time grows with page count; content stale until rebuild |
| **Static + revalidation** (ISR, on-demand/tag revalidation) | Static HTML regenerated after a TTL or on a content event | Static speed with fresh-enough content | Staleness window must be acceptable; per-user data must never enter it |
| **SSR** | HTML rendered per request | Fresh and personalized; SEO-friendly | TTFB = slowest data dependency unless streamed; server cost per view |
| **Streaming SSR** | Shell flushed immediately; slow regions stream in behind Suspense boundaries | Fast first paint and fresh data | Boundaries must be placed deliberately; HTTP status is sent before streamed errors occur |
| **React Server Components** | Components run only on the server; their output (not their code) goes to the client; client components hydrate | Data fetching next to UI, zero JS for non-interactive parts, secrets stay server-side | New boundary to secure (Server Actions, serialization); framework and React versions must stay patched |
| **SPA (client-rendered)** | Empty HTML shell; JS renders everything | Simple hosting, rich interaction, clean separation from API | Slow first load, SEO weak, all data waterfalls happen on the client |
| **Islands** (e.g. Astro) | Static HTML with isolated hydrated widgets | Near-zero JS on content sites | Cross-island shared state is awkward; poor fit for app-like UIs |
| **Local-first** | UI reads and writes a client database; sync runs in the background | Instant interactions, offline, multi-device, collaboration | Sync, conflict resolution, partial replication, client migrations, device storage |

## 2. Decision questions

Ask in order; the first decisive answer wins.

1. **Must it work offline or feel instant under constant edits?** → local-first (see §5).
2. **Is the content the same for every visitor?** → static; add revalidation if it changes more than once per deploy.
3. **Does SEO or first paint matter, with per-user or per-request data?** → streaming SSR (with RSC if the framework supports it).
4. **Is it behind login, highly interactive, and already served by a separate API?** → SPA is acceptable and simpler to host.
5. **Mostly content with a few widgets?** → islands.

Rules that apply to every mode:
- Never client-render the LCP element (hero image, headline, product photo, article body).
- Hydrate the minimum: interactive leaves, not whole pages.
- A mixed app is normal: static marketing, streamed product pages, client-heavy editor.

## 3. Caching and revalidation rules

- **Cache keys include every input that changes the output**: locale, tenant, auth state, feature-flag variant, device class if the HTML differs.
- **Per-user or permissioned responses are never stored in a shared cache.** Mark them dynamic (`Cache-Control: private, no-store` or the framework's dynamic flag). Shared-cache leaks are silent until a user sees someone else's data.
- **Tag cached data by entity** (`product:123`, `tenant:9:invoices`) and revalidate those tags from the mutation that changes them. Time-based TTL alone either serves stale data or wastes renders.
- **Static assets** get content-hashed filenames with `Cache-Control: public, max-age=31536000, immutable`. HTML gets short `s-maxage` plus `stale-while-revalidate`.
- **Avoid `Vary: Cookie`** on cacheable pages; it fragments the cache per user. Keep personalization in a streamed region or a client island.
- **Know your framework's caching defaults.** They have changed between major versions of popular frameworks; read the installed version's docs before assuming a `fetch` is or is not cached.

## 4. Edge vs regional compute

Run compute close to its data.

| Put at the edge | Keep regional (next to the database) |
|---|---|
| Auth redirects, token checks, geo routing, A/B bucketing, rewrites | Pages that make several database queries |
| Serving cached or static pages, image transforms | Node-native libraries, heavy CPU, large memory work |
| Lightweight APIs over edge-native data (KV, edge SQL replicas, per-entity durable objects) | Long-lived connections to a single-region database |

Edge isolates (for example Cloudflare Workers) have small memory limits (around 128 MB), CPU-time limits, no filesystem, and partial Node compatibility. Check every dependency before choosing an edge runtime. Reported 2026 direction: hosting platforms moved away from edge-by-default rendering toward regional functions, keeping the edge mainly for middleware.

## 5. Local-first and sync engines

| Use when | Avoid when |
|---|---|
| Latency-sensitive, highly interactive apps (issue trackers, design tools), offline requirement, real-time collaboration, multi-device drafts | Server-authoritative invariants dominate (payments, inventory, bookings needing global uniqueness), datasets too large to replicate partially, per-row permissions hard to express as sync rules, simple CRUD admin |

Architecture rules:
- The server stays the authority: mutations are re-run and validated on the server, which also enforces authorization.
- Define **partial replication scopes** (per user or tenant) that double as permission filters. Never sync data the user may not see and hide it in the UI.
- Choose conflict resolution per data type: last-writer-wins per field for simple records, CRDTs (Yjs, Automerge) for text and lists, server rebase for business operations.
- Old clients keep running: version mutators and schemas, and migrate client databases.
- Encrypt sensitive data at rest on the device; plan storage quotas and eviction.

Landscape (reported, as of 2026-09; verify maturity before adopting): Zero (Rocicorp; successor to Replicache, which is sunset), ElectricSQL (Postgres read-path sync of "shapes"; writes go through your API), PowerSync (Postgres/Mongo/MySQL to client SQLite with a write-back queue), TanStack DB (reactive client collections over sync engines), plus Triplit, InstantDB, Jazz, LiveStore.

## 6. Framework mapping (as of 2026-09)

Examples only; the choice is the rendering mode, and the framework follows the team's existing skills.

| Need | Typical choices |
|---|---|
| RSC + streaming SSR + Server Actions | Next.js App Router; other React meta-frameworks adding RSC support |
| Loader/action model with SSR or SPA mode | React Router (framework mode, formerly Remix), TanStack Start, SvelteKit, Nuxt |
| Content site with islands | Astro (with any UI library for islands) |
| Pure SPA | Vite + React/Vue/Svelte + a client router (TanStack Router, React Router, Vue Router) |

Before picking: confirm the deployment target supports the runtime (Node server, serverless, or static only), and that the team can operate it.

## 7. Budgets and verification

Heuristic starting budgets (compressed; set per project and enforce in CI):
- Content and marketing pages: ≤ about 150–200 KB JS on the critical path, ideally near zero.
- App initial route: ≤ about 300–400 KB JS; everything else split per route.
- CSS: ≤ about 50–100 KB.
- Core Web Vitals at p75, mobile and desktop separately: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. Ignore blog claims that the LCP threshold changed to 2.0 s; the official library still uses 2.5 s.

Verify with a bundle analyzer, a size-limit style CI check, Lighthouse CI for lab data, and field data (RUM or CrUX) for truth. Profile with 4× CPU throttling and slow network on a mid-range Android.

## Sources

- web-vitals thresholds: https://github.com/GoogleChrome/web-vitals ; https://web.dev/articles/vitals
- Vercel Web Interface Guidelines (throttled profiling, stable skeletons): https://github.com/vercel-labs/web-interface-guidelines
- Local-first architecture 2026: https://www.smashingmagazine.com/2026/05/architecture-local-first-web-development/ ; sync engine comparison: https://kanopylabs.com/blog/tanstack-db-vs-electricsql-vs-zero-sync
- Ink & Switch, "Local-first software" (2019): https://www.inkandswitch.com/local-first/
- Edge runtimes 2026: https://www.pkgpulse.com/guides/cloudflare-workers-vs-vercel-edge-vs-aws-lambda-2026 ; https://www.kunalganglani.com/blog/cloudflare-workers-vs-vercel-2026
- Next.js security guide for Server Components and Actions: https://nextjs.org/blog/security-nextjs-server-components-actions
