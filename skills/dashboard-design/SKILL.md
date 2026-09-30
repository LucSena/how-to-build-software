---
name: dashboard-design
description: Use when designing or building a dashboard, home screen, analytics overview, live operations view, or executive KPI page, or the app shell around a product — sidebar, header, breadcrumbs, command palette (Cmd/Ctrl+K), workspace switcher, account menu, notifications entry, and responsive shell. Covers dashboard types (operational, analytical, strategic, home), KPI selection, layouts with wireframes, widget anatomy and states (loading, not set up, no data, filtered out, partial, stale, error, no permission), date ranges and comparisons, filters in the URL, drill-down, refresh and real-time, templates and customization, per-widget performance and caching, chart accessibility, density, and shortcuts. Also use when the user says "nobody looks at our dashboard", "make this dashboard useful", "add a sidebar", "what should the home page show", or "add Cmd+K". For tables, grids, chart-by-chart rules, and number formatting use data-dense-ui; for new users' empty dashboards use onboarding-design.
license: MIT
metadata:
  version: "1.0.1"
  category: design
  related: "data-dense-ui onboarding-design interaction-design accessibility design-foundations app-screen-patterns"
---

# Dashboard Design

A dashboard is a curated display of the few numbers someone needs to decide what to do next, readable at a glance on one screen (after Stephen Few). Most dashboards fail by accumulation: every metric the database can compute, twelve equal tiles, no comparison, no owner, and a spinner that blocks the page on the slowest query. The app shell around it fails the same way: navigation that hides, shifts, or forgets its state. This skill starts from the decision the screen supports and builds outward: type, KPIs, layout, widget states, controls, performance, and the shell.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Then establish: **who looks at it and how often**, **the one question it answers**, **what they do next** when a number is bad, **data freshness and volume** (per-query latency, update frequency), and **the roles** that see different things.

## Core principles

1. **Start from decisions, not available data.** A tile that changes no one's action this week belongs in a report.
2. **Name the dashboard type first.** Operational, analytical, strategic, and home screens differ in refresh, density, and interaction; mixing them serves none.
3. **Every number carries context.** Comparison, target or threshold, definition, and freshness; a bare number cannot be acted on (Few: "inadequate context").
4. **Overview first, zoom and filter, then details on demand** (Shneiderman). KPI row → trend → breakdowns → records.
5. **Each widget is its own mini-app.** Independent query, loading, empty, error, and permission states; one slow tile never blanks the page.
6. **The URL is the view.** Date range, comparison, filters, and drill path survive refresh, Back, and sharing.
7. **Opinionated defaults per role beat a blank builder.** Most people never customize; templates come before a canvas.
8. **The shell stays still.** Navigation in the same place on every page, state persisted, no layout shift.

## Workflow

- [ ] **Write the brief**: type, audience, frequency, the one question, and the action a bad number triggers. Check: the question fits in the page title or subtitle.
- [ ] **Select KPIs** with the four-question test below; cut to 3–5 headline metrics. Check: each has a comparison, a "good" direction, a definition, and a drill target.
- [ ] **Lay out** with the band pattern and a wireframe from `references/layouts.md`. Check: priority reads top-left first; groups follow business questions.
- [ ] **Specify every widget**: query, chart form, all nine states, drill link (`references/widgets-and-states.md`).
- [ ] **Wire controls**: global date range, comparison, filters in the URL, per-widget overrides flagged (`references/controls.md`).
- [ ] **Plan performance**: one query per widget, pre-aggregation, cache keys, freshness labels, timeouts.
- [ ] **Build or check the shell**: sidebar, header, ⌘K, account menu, responsive behavior (`references/app-shell.md`).
- [ ] **Validate** with real data extremes (zero, one row, huge values, slow query, failed query, no permission), keyboard only, a screen reader on one chart, and a 360 px viewport. Check against Anti-patterns and Gotchas; fix and repeat.

## Dashboard types

| Type | Question | Who | Refresh | Emphasis |
|---|---|---|---|---|
| Operational | "Is anything wrong right now? What needs action?" | On-call, support, ops, sellers | Seconds–minutes | Status, thresholds, queues, alerts, links to act |
| Analytical | "Why did it change? Which segment?" | Analysts, PMs, marketers | On demand | Filters, breakdowns, comparison, drill-down; denser |
| Strategic / executive | "Are we on track?" | Leadership | Daily–monthly | Few KPIs vs target, long trends, annotations, little interaction |
| Home (in a product) | "What's new for me, what do I do next?" | Every user | On load | 3–5 KPIs + tasks + recent activity, action-first |

An **admin panel** is CRUD (tables, search, bulk actions), not a dashboard: use `data-dense-ui`. A **report** explains (narrative, point in time, exportable); an **exploration tool** answers new questions (query builder, notebook). Do not put exploration controls on a monitoring dashboard; link to them.

## Choosing KPIs

Test every candidate tile with four questions; if one has no answer, cut the tile or move it to a report:

1. **Who looks at this, and how often?**
2. **What decision does it inform?**
3. **What is "good"?** (target, threshold, or comparison baseline)
4. **What do they click next?** (drill-down or action)

- **3–5 headline KPIs**; one North Star may be visually dominant.
- **Pair volume with quality** so neither can be gamed: sign-ups + activation rate; tickets closed + CSAT; deploys + change-failure rate.
- **Ratios over raw counts** when the population varies (conversion rate, errors per 1k requests).
- **Leading + lagging**: pair an outcome (MRR) with a leading indicator (trials started, activation rate).
- **Vanity metrics out**: all-time totals, raw page views, and cumulative charts that only go up.
- **Define every metric** in an ⓘ tooltip: definition, formula, source, freshness (Plausible links each metric to its definition).

## Layout

Rules:
- **Reading order = priority**: most important top-left in LTR (mirror for RTL).
- **Bands**: KPI row → primary trend (full width) → breakdowns (2–3 columns of ranked lists) → detail table.
- **Group by business question** (acquisition, activation, revenue), never by chart type.
- **12-column grid**, equal-height cards per row, consistent padding (16–24 px), gaps on the spacing scale. Cards reflow with **container queries** by their own width (shadcn's dashboard uses 1 → 2 → 4 KPI columns this way).
- **One global control bar** (date range, comparison, filters) at the top of content; widgets that ignore it say so.
- **Same range, currency, and time zone** across widgets; state the time zone once ("All times UTC−3").
- **Mark incomplete periods** (dotted line or "partial" label) or "today" looks like a crash (Plausible draws the current period dotted).
- **Mobile**: stack in priority order; show the KPI row, one chart, and "View details". Do not shrink a 4-column desktop grid.

SaaS home example (more layouts, including live ops, analytics, and executive, in `references/layouts.md`):
```
┌─ Home ─────────────────────────────── [Last 30 days ▾] [vs previous ▾] [Filter] ┐
│ ┌ MRR ─────────┐ ┌ Active accounts ┐ ┌ Activation rate ┐ ┌ Churned MRR ────┐   │
│ │ $48.2k       │ │ 1,284           │ │ 31.4%           │ │ $1.9k           │   │
│ │ ▲ 6.1% vs    │ │ ▲ 3.2%          │ │ ▼ 2.3 pts       │ │ ▲ 18% (bad)     │   │
│ │ prev 30d  ⌇⌇ │ │            ⌇⌇⌇  │ │ target 35%  ▭▭▮ │ │ 3 accounts →    │   │
│ └──────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│ ┌ MRR trend ── this period ─ previous (dashed) ───────────────── ┈┈ partial ─┐ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│ ┌ Needs attention ──────────┐ ┌ Top plans ──────────┐ ┌ Recent activity ─────┐│
│ │ ● 3 failed payments [Fix] │ │ Pro     ████████ 62 │ │ Acme upgraded · 2m   ││
│ │ ● 2 trials end tomorrow   │ │ Team    █████    31 │ │ Beta Co invited 4·1h ││
│ └───────────────────────────┘ └─────────────────────┘ └──────────────────────┘│
│ ┌ Accounts (name · plan · MRR · health · last seen)            [Export]      ┐ │
└──────────────────────────────────────────────────────────────────────────────────┘
```
(Values are placeholders.) "▲ 18% (bad)": color follows meaning, not arrow direction; rising churn is red.

## Widgets and their states

**KPI card anatomy**: label → value (tabular numerals, compact notation) → delta badge (sign + arrow + color by good/bad) → one-line interpretation with comparison period ("Down 20% vs last 30 days · Acquisition needs attention") → optional sparkline or target bar → whole card links to the filtered detail. This mirrors shadcn's dashboard-01 KPI cards.

Chart form by question (full rules in `data-dense-ui`): trend → line; compare categories → sorted bar or ranked bar list; actual vs target → bullet graph or progress bar with target marker (not a gauge); many segments over time → small multiples; exact values → table; status history → a row of labeled blocks.

Every widget designs **nine states**:

| State | The widget shows |
|---|---|
| Loading | Skeleton the shape and size of the final content |
| Empty — not set up | What it will show + setup CTA ("Install the snippet to see visitors"), optional labeled sample |
| Empty — no data in range | "No sign-ups in the last 7 days" + "Try last 30 days" |
| Empty — filtered out | "No results for source = Newsletter" + "Clear filter" |
| Partial | Data plus "Stripe sync 60% complete" or "Data delayed ~2 h" |
| Stale | Last-updated time turns warning-colored past its freshness target |
| Error | Widget-level message + Retry; the rest of the page works |
| No permission | "Ask an admin for access to revenue" (not a silently missing tile) |
| Ideal | Value/chart + comparison + definition tooltip + drill link |

On a range or filter change, keep the previous data visible and dimmed with a thin progress line; never flash back to skeletons. Specs, KPI card code shape, and number rules: `references/widgets-and-states.md`.

## Controls: time, comparison, filters

- **Date presets first, custom last**: Today, Yesterday, Last 7 / 28 / 30 / 90 days, Month to date, Last month, Year to date, Last 12 months, All time, Custom. Prev/next period arrows.
- **Comparison**: previous period, year over year, or custom; **match day of week** when comparing daily data (Plausible). Show it in KPI deltas, as a second (dashed) line on the main chart, and in tooltips.
- **Filters as chips** (is / is not / contains), removable one by one and all at once; **click a breakdown row to filter** the whole dashboard.
- **URL holds the state**: `?range=30d&compare=previous&f=source:newsletter`. Saved views for repeated combinations.
- **Per-widget overrides** of the global range or filters are visibly flagged ("Ignores dashboard filters"), as PostHog does.
- **Annotations** for deploys, campaigns, and incidents on time-series charts.

Details, URL schema, and interval rules: `references/controls.md`.

## Drill-down, refresh, customization

- **Drill path**: KPI → filtered trend → breakdown → record table → single record, each level keeping the filters, with a clickable breadcrumb (`Revenue › Plan: Pro › Country: BR`). Put the action beside the insight ("3 failed payments → Retry").
- **Refresh matches decision speed**: operational = live or near-live (batch updates every 10–30 s); analytical = on load + manual refresh; strategic = daily snapshot. Always show "Updated 2 min ago" and a Refresh; live views get Pause so numbers do not move while someone reads. Throttle when the tab is hidden; never shift layout on update.
- **Customization ladder** (cheapest first): date range → pin/favorite → reorder or hide tiles → add from a tile library → full builder. Ship a role default and templates before any builder; reuse one insight across dashboards rather than copies.

## Performance

- **One query per widget**, fetched in parallel, each with its own loading, error, and timeout (partial results over spinner-forever).
- **Stream the page**: shell and skeletons immediately, KPI row first (cheapest queries), charts next, tables last.
- **Pre-aggregate** (daily/hourly rollups, materialized views); hit raw events only for drill-down.
- **Cache by (tenant, query, filters, range)** with a TTL tied to freshness; show cache age and allow a rate-limited forced refresh.
- **Bound cardinality**: top-N + "Other" for breakdowns, server-side pagination, downsample series to roughly one point per few horizontal pixels.
- **Tenant scoping on the server** for every widget query; never trust a tenant ID from client filters.
- **Big exports** run as background jobs with a notification.

## Chart accessibility

- Treat charts as complex images: a short text alternative plus the data in an accessible table (W3C WAI). Offer **"View as table"** per chart; it doubles as the export.
- Put the takeaway in the title or subtitle ("Sign-ups up 12% since launch").
- Never color alone: direct labels, markers, arrows and signs on deltas, text on status ("Degraded").
- Chart marks ≥ 3:1 against the background (WCAG 1.4.11); tooltips reachable by focus and dismissible with Esc (WCAG 1.4.13).
- Keyboard access to data points or the table; shadcn charts expose an `accessibilityLayer` prop on Recharts for keyboard and screen-reader support.
- Announce only meaningful live changes (polite live region for status changes, not every tick); honor reduced motion.

## App shell

```
┌───────────────┬─────────────────────────────────────────────────────────────┐
│ [Acme ▾]      │ ☰  Projects › Website relaunch          ⌘K Search  🔔  (?)  │ header
│ ⌘K  Search    │─────────────────────────────────────────────────────────────│
│ ⌂  Home       │  Page title                         [Secondary] [Primary]   │ page header
│ ✓  My issues 3│  Tabs: Overview | Activity | Settings                       │
│ WORKSPACE     │                                                             │
│ ▣ Projects    │  content (fluid; max width for forms and prose)             │
│ ▤ Insights    │                                                             │
│ FAVORITES     │                                                             │
│ ★ Q3 roadmap  │                                                             │
│ + Invite      │                                                             │
│ ⚙ Settings    │                                                             │
│ (SM) Sam ▾    │  ← account menu                                            │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

- **Navigation choice**: left sidebar for 5+ top-level areas or a growing IA; top nav only for a small flat IA (≤ 5–7 peers); no hamburger on desktop (NN/g: hiding navigation reduces discoverability). Tabs for peer views of one object; breadcrumbs for depth.
- **Sidebar order**: workspace switcher → search/⌘K → personal (Home, Inbox, My work) → workspace sections → favorites → footer (invite, settings, help, account). 5–9 top-level items; group labels only for real groups; badges only for actionable counts.
- **Widths**: expanded 240–280 px (shadcn default 16rem), icon rail 48–64 px with tooltips, drawer below 768 px. Persist collapse per user and render it server-side without flash (shadcn stores it in a cookie).
- **Header** (about 48–56 px): sidebar toggle, breadcrumb or title, search/⌘K, notifications, help. Page actions live in the page header, not the global header.
- **⌘K palette**: available everywhere, groups (recent, navigation, actions, help), shows each command's shortcut, platform-correct hint (⌘K on macOS, Ctrl+K elsewhere), complements visible navigation, accessible combobox.
- **Account menu**: name/email, profile, preferences (theme, density, language), keyboard shortcuts, what's new, help, switch account, sign out last and separated.
- **Notifications**: bell with capped unread count ("9+"), actionable items only, each with actor, action, object, time, and link; preferences linked; no marketing in the bell.
- **Settings entry**: in the sidebar footer or account menu; personal vs workspace split; deep-linkable (`app-screen-patterns`).
- **Environment**: test/staging mode unmistakable (persistent badge or banner).
- **Keyboard**: ⌘/Ctrl+K palette, ⌘/Ctrl+B sidebar, `/` search, `?` shortcut sheet, `G` then a letter to go to sections, Esc closes or clears. Never override browser shortcuts (⌘L, ⌘T, ⌘W).
- **Density**: offer comfortable/compact in data-heavy apps; one density per view.
- **Landmarks**: `nav`, `header`, `main`, skip link, `aria-current="page"` on the active item.

Full anatomy, responsive rules, and reference implementations: `references/app-shell.md`.

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Wall of charts (everything computable) | 3–5 KPIs; the rest to reports or exploration |
| Vanity metrics (all-time totals, page views) | Rates, cohorts, activation; pair volume with quality |
| Numbers without comparison, target, or definition | Delta vs period, target marker, ⓘ definition |
| Gauges, speedometers, 3D, gradients | Bullet graphs, bars, sparklines (Few) |
| Pies with many slices, several pies to compare | Sorted bar or ranked bar list |
| A different chart type per tile "for variety" | Same form for the same kind of question |
| Rainbow categories, red/green only | Neutral base + one highlight; color-blind-safe palette; labels |
| Mixed ranges or time zones across tiles | One global range; overrides flagged |
| False precision (31.4159%) | Round to decision precision; exact value in tooltip |
| Page blocked by the slowest query | Per-widget loading and error |
| Blank dashboard for new users | Setup CTA, template, labeled sample (`onboarding-design`) |
| Customizable-only dashboard | Role default + templates |
| Auto-refresh that moves content while reading | "Updated Xs ago", Pause, no layout shift |
| Hamburger menu on desktop, icon-only nav without tooltips | Visible sidebar; icon rail with tooltips and easy expand |

## Gotchas

- **Designing tiles before the question.** Write the question and the action first; otherwise the result is a wall of charts.
- **Percent vs percentage points.** 33.7% → 31.4% is "−2.3 pts", not "−6.8%". Label which one you mean.
- **Coloring deltas by direction instead of meaning.** Churn, latency, and cost going up are bad; flip the mapping per metric.
- **A series changing color from chart to chart.** One data set keeps one color across every chart on the dashboard, and legends sit in the same place relative to each chart; never mix unit systems on one screen (Carbon).
- **Filters that update only one chart.** On an analytical dashboard, a filter, brush, or zoom on one chart updates every chart showing related data; state which charts a filter applies to.
- **Percent change on tiny bases.** 1 → 10 is not "+900%"; show the absolute change or "new".
- **One mega-query for the page.** One failure blanks everything; one query per widget.
- **Current partial period drawn like complete ones.** Today's half-day dip reads as an outage; mark or exclude it.
- **Filters and range kept only in component state.** Refresh and shared links lose the view; use the URL.
- **Tenant or role checks only in the UI.** Enforce them in every widget query on the server.
- **Invented demo numbers presented as real.** Placeholders must be labeled as sample data.
- **Hard-coding "⌘K" for everyone.** Show Ctrl+K on Windows and Linux.
- **Sidebar collapse state that flashes on load.** Persist it where the server can read it (cookie) and render the right state first.
- **Dropping navigation sections on mobile.** Keep the same IA; reach it through the drawer or "More".

## Output format

```
Dashboard: <name> · Type: <operational|analytical|strategic|home> · Users: <role, frequency>
Question: <one sentence> · Action when bad: <…>
KPIs: <metric — comparison — target/good direction — definition — drill target> (3–5)
Layout: <wireframe or band list, desktop and mobile>
Widgets: <name — query — chart form — states covered — drill link>
Controls: <range presets, comparison, filters, URL params, overrides>
Refresh & performance: <cadence, cache TTL, pre-aggregation, timeouts>
Accessibility: <text takeaways, table view, keyboard, color independence>
Shell (if in scope): <nav items, header, ⌘K groups, account menu, responsive behavior>
```

For reviews, list findings by severity with Observed / Inferred / Not checked.

## References

| File | Read when |
|---|---|
| `references/app-shell.md` | Building or reviewing the sidebar, header, breadcrumbs, ⌘K palette, workspace switcher, account menu, notifications, settings entry, responsive shell, density, or shortcuts; or adopting shadcn Sidebar. |
| `references/layouts.md` | Sketching a dashboard: ASCII layouts for SaaS home, live operations, analytics, executive, and mobile, plus grid and breakpoint rules. |
| `references/widgets-and-states.md` | Specifying a KPI card or widget, its nine states, dashboard number rules, chart form per widget, or chart accessibility. |
| `references/controls.md` | Implementing date ranges, comparisons, filters, URL state, saved views, drill-down, real-time refresh, or customization and templates. |
| `references/case-studies.md` | Looking for a real reference (Plausible, Stripe, PostHog, Linear, shadcn dashboard-01, Tremor) or the research behind a rule (Few, Tufte, Shneiderman, NN/g). |

## Related skills

- `data-dense-ui` — tables and data grids, chart-by-chart rules, number/date formatting, admin CRUD inside the dashboard.
- `onboarding-design` — the new user's first view of the dashboard: setup states, sample data, templates.
- `app-screen-patterns` — settings, notifications center, billing, search, and other screens reached from the shell.
- `interaction-design` — overlays, toasts, loading and error patterns, command palette mechanics.
- `accessibility` — landmarks, focus management, and chart alternatives in depth.
- `design-foundations` — grid, spacing, type scale, and chart color tokens in light and dark themes.
