---
name: frontend-architecture
description: Use when choosing or restructuring how a web frontend is built — picking SSG, SSR, streaming SSR, React Server Components, SPA, islands, edge, or local-first per route; deciding where state lives (server cache, URL, form, client store); designing data fetching without waterfalls; securing Server Actions and RSC boundaries; routing, error boundaries, forms with shared validation, i18n plumbing, feature folders, Feature-Sliced Design, pnpm/Turborepo/Nx monorepos, micro-frontends, and JS bundle budgets. Also use when the user says "which rendering/framework should I use", "where should this state live", "the page loads in a waterfall", "the bundle is too big", "structure this React/Next/Vue/Svelte app", "set up a monorepo", or "should we do micro-frontends". Not for visual design (design-foundations), CSS and Core Web Vitals tuning (web-platform), backend service boundaries (software-architecture), or native apps (mobile-architecture).
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "software-architecture web-platform design-patterns api-design testing-strategy"
---

# Frontend Architecture

Server-render by default, ship the least JavaScript that delivers the interaction, give every piece of state exactly one owner, and let features, not file types, shape the folders. This skill protects four outcomes: a fast first load, no request waterfalls, no data leaking across the server/client boundary, and a codebase a new developer can navigate in a day.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Choose rendering per route, not per app.** A docs page and a collaborative editor have opposite needs; one global choice either over-ships JS or under-serves interaction.
2. **Give every piece of state one owner: server cache, URL, form, or local UI.** Copying server data into a client store creates a second source of truth that goes stale.
3. **Start independent requests together, as early as possible, and stream the rest.** Sequential awaits turn N round trips into N× latency; nothing else you optimize will hide that.
4. **Treat every server boundary as a public API.** Server Actions are HTTP endpoints anyone can call, and props passed to client components are serialized into the page.
5. **Organize by feature and enforce the boundaries in CI.** Folder conventions that are not linted decay within months.
6. **Budgets are architecture.** A JS-size and Core Web Vitals budget checked in CI catches regressions that code review misses.
7. **Match the existing stack first.** A second router, state library, or fetch layer costs more than the imperfect one already there.

## Workflow

- [ ] **Read what exists**: framework and version, router, data layer, state libraries, folder convention, lint boundary rules. Match them unless the task is to change them.
- [ ] **Classify each route** by freshness (static / per-request / real-time), personalization, interactivity, SEO need, and offline need; pick rendering from the table below. Check: no route client-renders its LCP content.
- [ ] **Map the state**: list each piece of data and assign an owner from the state table. Check: no server data lives in a client store; filters/tabs/pagination are in the URL.
- [ ] **Draw the request graph per route**: what is fetched where, what depends on what. Parallelize independent fetches; place Suspense/loading boundaries at region level. Check: no `await` chain of independent requests.
- [ ] **Define the server boundary**: server-only data-access layer, DTOs, and every mutation validating + authorizing. Check against `references/react-server-components.md` when using RSC or Server Actions.
- [ ] **Place the code**: feature folder or FSD slice with a public API; boundary lint rule added or updated.
- [ ] **Design failure paths**: error boundary per route segment and per independent widget; not-found distinct from error; loading and empty states.
- [ ] **Verify**: build, type-check, bundle analysis against budget, Lighthouse/field CWV on a throttled mid-range phone; fix and repeat until within budget and Gotchas are clean.

## Rendering strategy

Default: server-render (static where possible), hydrate only interactive islands. Use a client-rendered SPA when the app is behind login, SEO is irrelevant, and a separate API already exists.

| Product / route type | Default | Switch when |
|---|---|---|
| Marketing site, docs, blog | Static generation (or islands, e.g. Astro) with near-zero JS; rebuild or revalidate on publish | Thousands of frequently edited pages → on-demand/tag revalidation |
| E-commerce catalog, product pages | Cached static HTML + revalidation; price, stock, cart as streamed or client islands | Heavy per-user personalization → streaming SSR per request |
| Content with per-user data (feeds, account pages) | Streaming SSR + RSC: static shell first, slow regions in Suspense | No server runtime available → SPA with skeletons |
| Authenticated SaaS app, admin, internal tool | Keep the team's framework; SSR/RSC for first paint + client components for interaction, **or** SPA (Vite + client router) over an API — both fine behind login | — |
| Highly interactive tool (editor, canvas, Linear-like) | SPA shell + local-first sync engine, or client cache with optimistic updates | Server-authoritative invariants dominate (payments, inventory) → server state + optimistic UI |
| Must work offline (field work, flaky mobile) | Local-first: client database + background sync, installable PWA | Only brief drops → cached reads + queued writes |
| Embeddable widget | Small client bundle, framework-light (web component, Preact, Svelte) | — |

- **Edge**: use it for middleware (auth redirects, geo, A/B bucketing, rewrites) and cacheable work. Run data-heavy rendering in the region of the database; five queries from a far edge node each paying a cross-region round trip are slower than one regional render. Edge isolates have small memory (around 128 MB on Cloudflare Workers), CPU-time limits, no filesystem, and partial Node API support.
- **Local-first** only when latency, offline, or real-time collaboration is the product. Avoid it for server-authoritative invariants, huge datasets that cannot be partially replicated, or permissions too complex to express as sync rules.

Details, caching/revalidation rules, and framework mapping: `references/rendering-strategies.md`.

## Where state lives

| Kind | Examples | Default owner | Never |
|---|---|---|---|
| Server state | records, lists, current user | RSC or framework loaders for reads on navigation; TanStack Query / SWR for client-side caching, polling, optimistic mutations | Copying into Redux/Zustand/Context and syncing with `useEffect` |
| URL state | filters, sort, tab, page, search, selected id | Search/route params with a typed parser | Memory-only; it breaks back, refresh, and sharing |
| Form state | drafts, field errors, dirty, submitting | Form library (React Hook Form, TanStack Form, Conform) or a native form + server action | A global store |
| Local UI state | open/closed, hover, active item | `useState`/`useReducer` colocated in the component | Global "just in case" |
| Shared client state | theme, sidebar, wizard progress, editor selection | Context for rarely changing values; a small store (Zustand, Jotai) for frequent updates | One mega-store for everything |
| Derived values | totals, filtered lists, validity | Compute during render | `useEffect` + `useState` mirror |
| Durable local / collaborative | offline drafts, shared documents | Client DB + sync engine; CRDT (Yjs, Automerge) for text | `localStorage` as the only copy of user work |

Use a reducer with a discriminated union, or a statechart, for flows with three or more states and guarded transitions (checkout, upload, onboarding). Full rules and code: `references/state-management.md`.

## Data fetching

- Start independent requests before awaiting any of them (`Promise.all`, parallel loaders, sibling server components). A layout that awaits blocks every child route.
- Fetch in the server component that needs the data; dedupe repeated reads within one request with a per-request cache instead of prop-drilling.
- Put Suspense/loading boundaries around **regions** with independent latency (a chart, a comments list). One boundary around the whole page loses streaming; one per component makes the layout pop in piece by piece.
- On the client, never fetch app data in `useEffect` by hand: it races, does not cache, and waterfalls. Use the data library; if an effect is unavoidable, abort in its cleanup.
- No per-item fetch inside a list component; batch by IDs or add a list endpoint.
- After a mutation, invalidate by key or tag; use optimistic updates only when success is likely, with rollback and an error message.
- Prefetch likely next navigations on hover/viewport intent. Give every request a timeout (`AbortSignal.timeout(ms)`).

## Routing

- Every screen a user can reach has a URL, including tabs, dialogs worth sharing, and selected items. Back, forward, refresh, and scroll restoration must work.
- Use nested layouts for persistent chrome (sidebar, tabs); give each segment its own loading and error UI.
- Do auth redirects on the server or in middleware before rendering, not by flashing protected UI and bouncing on the client.
- Prefer typed routes and typed search params where the router offers them; a renamed route should fail the build, not a user click.
- Split code per route (frameworks do this by default); do not import a heavy route's modules from the shell.

## Server boundary and Server Actions

MUST, in every Server Action or server function: authenticate, authorize the specific object (ownership or role), validate input with a schema, then return a minimal DTO. Hidden form fields and disabled buttons are not security. Keep database access in a server-only data-access layer. Never pass secrets or full rows to client components. Keep React and the framework patched: CVE-2025-55182 ("React2Shell", CVSS 10.0, December 2025) was a pre-auth remote code execution in the RSC protocol's deserialization, so a vulnerable app could be compromised even when your own code was correct. Checklist and examples: `references/react-server-components.md`.

## Structure, monorepos, micro-frontends

- **Small app, one team**: `src/features/<feature>/{components,hooks,api,model}` + `src/shared/`. Route files stay thin and import from features.
- **Large app, many features or teams**: Feature-Sliced Design (`app → pages → widgets → features → entities → shared`; import only from lower layers; slices on the same layer never import each other; each slice exposes a public `index.ts`). Enforce with Steiger or ESLint boundary rules.
- **Monorepo** when two or more deployables share code (web app + marketing site + Expo app + API). Default: pnpm workspaces + Turborepo; choose Nx when you want generators and built-in module-boundary enforcement. Standard packages: `packages/ui`, `packages/config` (tsconfig, lint presets), a typed API client. Create a package only once it has two consumers; no `packages/common` junk drawer.
- **Micro-frontends** only when the org requires it: several teams must deploy parts of one UI on independent cadences and a monorepo with enforced boundaries has already failed them. They cost duplicated dependencies, inconsistent UX, and slower pages.

Layouts, boundary rules, internal-package setup, i18n file plumbing: `references/project-structure.md`.

## Error boundaries

- One boundary per route segment and one per independent widget, so a failing chart does not blank the page. Keep a root boundary as the last resort, with a reload action.
- React error boundaries do not catch errors in event handlers, async callbacks, or the boundary itself. Handle those with `try/catch` and UI state.
- The fallback says what failed and offers "Try again" that resets the boundary **and** refetches. Render not-found as its own state, not as an error.
- Report caught errors to error tracking with route, release, and user/tenant (pseudonymous) tags.

## Forms

- One schema (Zod, Valibot, ArkType) shared by client and server. The client validates for UX; the server always re-validates, because the client is optional.
- Prefer a native `<form>` with a server action or route action where the framework supports it; it works before hydration.
- Show pending state and block double submit; keep the user's input on error; map server field errors back onto fields and focus the first invalid one.
- Send an idempotency key with payments and other non-repeatable submits.

## i18n plumbing

- Public pages: locale in the URL path or domain (crawlable). Apps: the user's saved preference. Detect the initial locale from `Accept-Language`, never from IP, and always allow override.
- Messages in ICU MessageFormat keyed by stable IDs; no string concatenation; plurals and genders through ICU. Load only the active locale's messages, split per route.
- Format dates, numbers, and currency with `Intl.*` using an explicit locale **and time zone** on both server and client, or hydration will mismatch.
- Set `lang` and `dir` on `<html>`. Layout mirroring and text expansion belong to `web-platform`.

## Performance budgets

Starting budgets (heuristics as of 2026-09; measure on a throttled mid-range Android):

| Surface | JS (compressed, critical path) | CSS (compressed) |
|---|---|---|
| Marketing, docs, content | ≤ 150–200 KB, ideally near zero via SSG/islands | ≤ 50–100 KB |
| App, initial route | ≤ 300–400 KB, the rest split per route | ≤ 50–100 KB |

Core Web Vitals at p75: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. Split per route (frameworks do this by default); lazy-load heavy components such as editors, charts, and maps with `import()`; load third-party scripts after interaction or idle; enforce the budget in CI with a size checker or bundler budget. With React Compiler enabled, stop adding `useMemo`/`useCallback`/`memo` by default; memoize only after profiling.

## Gotchas

- **`"use client"` at the top of a page or layout** turns the whole subtree into client code and ships it. Push the directive down to the interactive leaves.
- **Trusting IDs from the form in a Server Action.** `deletePost(formData.get("id"))` without an ownership check lets any user delete any post (BOLA).
- **Passing a database row to a client component** serializes every column (hashes, internal flags, emails) into the HTML. Map to a DTO.
- **Secrets behind public env prefixes** (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`) are inlined into the bundle.
- **Caching per-user responses in a shared cache** (CDN, static generation, framework fetch cache) serves one user's data to another. Mark those routes dynamic and private.
- **`useEffect` to derive state or fetch data.** Derive during render; fetch with the data layer.
- **Filters and pagination in `useState`.** Back, refresh, and share lose them; put them in the URL.
- **Awaiting in a layout** or awaiting sequentially in a page: every child waits. Start fetches together and pass promises down or split into Suspense regions.
- **Hydration mismatches** from `Date.now()`, `Math.random()`, locale/time-zone formatting, or `typeof window` branches during render. Compute on the server, or render after mount deliberately.
- **Skeletons that differ from the final layout** cause layout shift; match dimensions.
- **Barrel files that re-export everything** can defeat tree-shaking and slow dev servers. A public `index.ts` exports only the public surface.
- **Adding a second fetch/state library** because it is familiar. Extend the one in use.
- **Proposing micro-frontends or a monorepo for a single app and team.** Feature folders and lint rules solve that problem.
- **Edge rendering in front of a single-region database.** Render near the data; cache at the edge.

## Output format

For a plan or review, produce:

```
Frontend architecture
- Routes: | route | rendering | data sources | cache/revalidate | interactive islands |
- State map: | data | owner (server cache / URL / form / local / store) | tool |
- Server boundary: data-access layer location; each action → authz rule + schema
- Structure: folder tree (features or FSD), boundary lint rule, packages if monorepo
- Failure paths: error boundaries, not-found, loading/empty per region
- Budgets: JS/CSS KB per surface, CWV targets, CI check
- Decisions needing an ADR / open questions
```

For code changes, end with **Done / Verified** (build, types, bundle size vs budget, what was tested) **/ Not checked**.

## References

| File | Read when |
|---|---|
| `references/rendering-strategies.md` | choosing between SSG, revalidation, SSR, streaming, RSC, SPA, islands, edge, or local-first; setting cache/revalidation rules; mapping a choice to a framework |
| `references/state-management.md` | deciding where a piece of state lives, picking a data/state library, writing optimistic mutations, URL state, forms with shared schemas, or state machines |
| `references/project-structure.md` | laying out folders, adopting Feature-Sliced Design, setting up a monorepo or internal packages, enforcing import boundaries, wiring i18n files, or evaluating micro-frontends |
| `references/react-server-components.md` | writing Server Components, `"use client"` boundaries, Server Actions, a data-access layer, cache tags, or auditing an RSC app for security |

## Related skills

- `software-architecture` — backend modules, service boundaries, ADRs for one-way-door frontend choices.
- `web-platform` — Core Web Vitals tuning, images, fonts, CSS, RTL and SEO metadata.
- `api-design` — the API the frontend consumes: pagination, errors, auth, BFF.
- `design-patterns` — React composition, hooks, and headless-component patterns.
- `testing-strategy` — what to test at component, integration, and E2E level.
- `interaction-design` — loading, empty, error, and optimistic UI states from the user's side.
