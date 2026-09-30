# Dashboard controls: time, comparison, filters, drill-down, refresh, customization

## Contents
- Date ranges
- Comparison
- Filters
- URL state
- Per-widget overrides and annotations
- Drill-down and details on demand
- Refresh and real-time
- Customization, templates, and roles
- Sharing and export

---

## Date ranges

- **Presets first, custom last.** A useful set: Today, Yesterday, Last 7 days, Last 28 days, Last 30 days, Last 90 days, Month to date, Last month, Year to date, Last 12 months, All time, Custom. Plausible gives each preset a single-key shortcut (for example D today, W last 7 days, M month to date, Y year to date, A all time, C custom) and uses ← / → to step to the previous or next period.
- **Narrow screens**: a select instead of a segmented control (shadcn's dashboard example switches its 7d / 30d / 90d toggle group to a select on small widths).
- **Default range** fits the decision cadence: operational = last hour or today; product analytics = last 28 or 30 days; executive = quarter to date.
- **Interval follows range**: minutes/hours for Today, days for a month, weeks or months for a year. Offer an interval control but constrain it to sensible values for the range (Plausible does this).
- **Incomplete periods**: either exclude the current partial day/week from rolling ranges or mark it (dotted line, "partial" label). Plausible excludes the current day except in "to date" and "all time" ranges, and draws the current period dotted.
- **Time zone**: bucket by the account's or user's time zone and say which, once, in the control bar.
- **Custom range picker**: two text inputs that accept typing plus a calendar; keyboard operable; validates start ≤ end; shows the resolved dates ("1 Jul – 30 Sep 2026").

## Comparison

- **Modes**: previous period (default), same period last year, custom.
- **Match day of week** for daily data so a Monday is compared with a Monday (Plausible offers this); otherwise weekday/weekend mix creates fake deltas.
- **Where it appears**: KPI deltas ("▲ 6.1% vs previous 30 days"), a second dashed line on the main chart, both values plus % change in tooltips, and optional columns in tables.
- **Label the comparison period** explicitly on the chart legend and in tooltips.
- **Comparison needs equal lengths**: a 30-day range compares to the previous 30 days, not "last month".

## Filters

- **Chips** at the top of content: `source is Newsletter ✕`, each removable, plus "Clear all". Operators: is, is not, contains (and ranges for numbers).
- **Click-to-filter**: clicking a row in any breakdown filters the whole dashboard; this is the cheapest drill-down there is (Plausible's core interaction).
- **Esc clears all filters** when no overlay is open (Plausible).
- **Cross-filtering** between charts must show which filters are active and clear in one click.
- **Filter options show counts** when cheap and never offer values that yield nothing without marking them.
- **Segments / saved views** for recurring combinations ("Paid users in EU"), personal or shared, with a visible "modified" state when the user changes a saved view.

## URL state

Everything that defines the view lives in the query string so links are shareable, Back works, and refresh keeps the view.

```
/dashboard/revenue?range=30d&compare=previous&interval=day&f=plan:is:pro&f=country:is:BR&view=table
```

- Omit parameters that equal the default; keep URLs short and stable.
- Use readable values (`range=30d`, `from=2026-07-01&to=2026-09-30`), not encoded blobs, unless the state is genuinely large (then store it server-side and put an ID in the URL).
- **History**: push a history entry for deliberate navigation (drill-down, applying a filter), replace it for continuous input (typing in a search box) so Back is not flooded.
- Validate every parameter server-side; filters are untrusted input and never carry tenant IDs.
- PostHog persists dashboard folder filters in the URL; Vercel's interface guidelines treat "URL as state" as a baseline for app UIs.

## Per-widget overrides and annotations

- A widget may use its own range or filters (a "Last 12 months" trend on a 30-day dashboard), but it must say so visibly ("Last 12 months · ignores dashboard range"). PostHog shows an indicator on tiles whose overrides take precedence over dashboard filters.
- **Annotations** on time-series charts mark deploys, campaigns, pricing changes, incidents, and metric-definition changes; Plausible supports chart annotations. Changes without context get misread.

## Drill-down and details on demand

Shneiderman's mantra ("overview first, zoom and filter, then details on demand") plus relate, history, and extract:

| Task | Dashboard control |
|---|---|
| Overview | KPI row + main trend |
| Zoom and filter | Date range, filters, click a segment |
| Details on demand | Tooltips, expand in place, drill to records |
| Relate | Comparison period, small multiples |
| History | URL state, Back button, saved views |
| Extract | Export CSV, share link, "View as table" |

- **Levels**: KPI card → filtered trend → breakdown list → record table → single record. Each level carries the filters forward.
- **Every KPI card links** to its detail view with the same filters.
- **Expand in place** for long lists: an expand icon opens the full list with more metrics and sortable columns (Plausible) instead of navigating away.
- **Tooltips** show value, comparison value, % change, and the exact bucket ("Mon 14 Sep · 1,204 vs 1,093 · +10%").
- **Breadcrumb of the drill path** with each crumb clickable to step back.
- **Action beside the insight**: "3 failed payments → Retry", "2 trials end tomorrow → Email them".

## Refresh and real-time

| Type | Cadence | Controls |
|---|---|---|
| Operational | Live or near-live; batch UI updates every 10–30 s | "Updated 12 s ago", Pause, stale warning |
| Analytical | On load + manual refresh | "Updated 3 min ago", Refresh (rate-limited) |
| Strategic | Daily or at period close | "As of 30 Sep" in the title |

- Plausible's realtime view counts "current visitors" over the last 5 minutes and refreshes its last-30-minutes graph every 30 seconds without a manual refresh; a useful model for "live enough".
- **Batch updates** rather than re-rendering per event; **throttle or pause when the tab is hidden** (`document.visibilityState`).
- **Never shift layout** on update; animate value changes subtly or not at all (none under reduced motion).
- **Pause** freezes live numbers while someone reads or screenshots.
- **Announce** only meaningful status changes to assistive technology (polite live region), never every tick.
- Use push (SSE/WebSocket) for operational views that must be live; polling is fine for minute-level freshness.

## Customization, templates, and roles

Most people keep defaults, so the default is the product. Customization is for power users.

**Ladder (cheapest first):**
1. Choose date range and comparison.
2. Pin or favorite a dashboard or widget.
3. Reorder or hide widgets.
4. Add widgets from a curated library (Stripe's home lets users pick charts from a library rather than build them).
5. Full builder (query + chart) for analysts.

**Why user-built dashboards fail:** the blank-canvas problem; widgets with inconsistent ranges; no owner; metrics drift and the dashboard rots; sprawl ("Copy of Copy of Revenue").

**Mitigations:**
- **Templates** (built-in, team, and "save as template"; PostHog offers all three) and, for AI-enabled products, starter prompts in an empty dashboard.
- **Role defaults**: a different home per role (seller, admin, finance); hide what a role cannot act on; show the permission state rather than silently missing widgets.
- **Reuse, don't copy**: one saved insight can appear on many dashboards (PostHog), so fixing it fixes it everywhere.
- **Owners, folders, and last-viewed dates**; archive dashboards nobody opened in a quarter.
- **Layout editing on wide screens only**; phones get the stacked read view (PostHog).

## Sharing and export

- **Share link** = the current URL (range, filters, view); public share links are read-only, expiring, and revocable.
- **Export** the current filtered view as CSV; large exports run as background jobs with a notification when ready.
- **Scheduled reports** (email or chat digest) for strategic dashboards; include the "as of" time and a link back.
- **Embeds** respect the same tenant scoping and permissions server-side.

## Sources

- Ben Shneiderman, "The Eyes Have It" (1996): https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf
- Plausible docs (guided tour, compare stats, keyboard shortcuts, realtime dashboard, annotations, segments): https://github.com/plausible/docs
- PostHog dashboards docs (templates, filter overrides, URL filters, insights on multiple dashboards, mobile layout): https://github.com/PostHog/posthog.com/blob/master/contents/docs/product-analytics/dashboards.mdx
- shadcn/ui dashboard-01 `chart-area-interactive` (MIT): https://github.com/shadcn-ui/ui
- Stripe, Dashboard home charts overview: https://support.stripe.com/questions/dashboard-home-charts-overview
- Vercel Web Interface Guidelines ("URL as state"): https://github.com/vercel-labs/web-interface-guidelines
