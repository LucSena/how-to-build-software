---
name: data-dense-ui
description: Use when building or improving data tables and grids, admin panels, back-office/CRUD screens, filters and saved views, bulk actions, charts, KPI tiles, or number formatting. Covers table alignment and tabular numerals, sticky headers, sorting, filtering, pagination vs virtualization, row and bulk actions, density modes, chart selection, number/date/currency formatting with Intl, empty/loading/partial states for data, and performance with large datasets. Also use when the user says "build an admin", "the table is hard to read", "add filters", "which chart should I use", "numbers look messy", or "the grid is slow", even for a single table or KPI card. For dashboard layout, KPI selection, widget states, date-range controls, and the app shell (sidebar, header, Cmd+K) use dashboard-design; for general component states and forms use interaction-design; for visual tokens and type scale use design-foundations; for backend query scaling use scalability.
license: MIT
metadata:
  version: "1.1.0"
  category: design
  related: "dashboard-design interaction-design design-foundations accessibility scalability frontend-architecture"
---

# Data-Dense UI

Most real software is tables, filters, and numbers used by the same people every day. Dense is good when it is organized: aligned columns, comparable numbers, one clear question per view, and state that survives a refresh. The failure modes are the opposite: dashboards that show everything and answer nothing, tables where decimals do not line up, filters that reset, and grids that freeze at 5,000 rows. This skill makes data views scannable, trustworthy, and fast.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Establish three facts before designing: **who uses the view and how often**, **the decisions it supports**, and **the data size** (rows now and in a year, update frequency). They decide density, chart types, and client- vs. server-side operations.

## Core principles

1. **Start from the decision, not the data.** A view answers a question ("Which accounts need attention today?"); fields that do not serve it go elsewhere.
2. **Every number carries context.** Unit, period, comparison (vs. target or previous period), and freshness; a bare number cannot be acted on.
3. **Align for comparison.** Numbers right-aligned in tabular numerals with consistent decimals; text left-aligned; one format per column.
4. **Density is a deliberate setting.** Pick one density per view from tokens, optionally user-switchable; never cramped by accident or airy by default in a work tool.
5. **Operate where the data lives.** Sort, filter, search, and paginate on the server once data outgrows the client; virtualize what you render.
6. **The URL is the view.** Filters, sort, columns, page, and selection are deep-linkable and survive refresh and Back.
7. **Bulk power needs bulk safety.** Show the count and scope, preview impact, allow undo or confirm proportionally.

## Workflow

- [ ] **Write the questions** the view must answer (1 primary, ≤ 3 secondary) and the action each answer leads to.
- [ ] **Inventory the data**: fields, types, units, cardinality, row counts, freshness, and which fields users search, filter, and sort by.
- [ ] **Choose the form**: KPI tiles, chart (use the selection table), table, or a combination; decide client vs. server operations from data size.
- [ ] **Lay out** by priority: primary answer first, then trends, then tables. For a full dashboard (KPI selection, bands, widget states, controls) switch to `dashboard-design`.
- [ ] **Specify the table**: columns in order, alignment, formats, sort defaults, row actions, bulk actions, density, empty/loading/error/partial states.
- [ ] **Wire state**: URL params for filters/sort/page/view; saved views if users repeat configurations.
- [ ] **Test with real volume and extremes**: 0 rows, 1 row, 10k+ rows, very long values, nulls, negative numbers, huge numbers, other locales. Fix and repeat.

## KPI tiles inside dashboards

Dashboard types, KPI selection, layout, widget states, date ranges, drill-down, refresh, and the app shell live in `dashboard-design`. This skill keeps the parts that are about data display:

- **KPI tile anatomy**: label · value (large, tabular numerals, compact notation when > 4 digits) · delta vs. comparison with direction icon **and** color (never color alone) · comparison period · optional sparkline. Make "good" direction explicit: a rising churn is red.
- **Attach meaning**: "15% below monthly target" beats "85%"; percentage points for changes in rates ("−2.3 pts"), not percent.
- **Tiny bases**: show absolute change or "new" instead of "+900%".
- **Charts in tiles** follow the chart selection table below; tables inside dashboards follow the table rules.

## Tables and data grids

| Content | Alignment and format |
|---|---|
| Text, names, statuses | Left |
| Numbers, currency, percentages, durations | Right, `font-variant-numeric: tabular-nums`, same decimals per column, unit in the header ("Amount (USD)") rather than every cell when uniform |
| Dates and times | Left (or right if compared as numbers), one locale-aware format per column; relative ("2 h ago") only for recency with absolute on hover |
| IDs, hashes, codes | Monospace or tabular, copy button on hover/focus, middle-truncate long IDs (`inv_8f3…a91c`) |
| Status | Badge with text (and icon); color is secondary |
| Booleans | Text or icon with label; not a bare checkmark in a sea of blanks |
| Actions | Rightmost column; visible kebab menu, not hover-only |

Header labels follow their column's alignment. Never truncate numbers; truncate text with an ellipsis plus full value on hover/focus or in the detail view.

**Density modes** (one per view; tokens, not ad-hoc padding):

| Mode | Row height | Use |
|---|---|---|
| Compact | ~32 px | Expert tools, logs, financial grids, large screens |
| Default | ~40 px | Most admin and SaaS tables |
| Comfortable | ~48–56 px | Touch, mixed audiences, rows with avatars or two lines |

Cell padding 8–16 px horizontally; 13–14 px text is acceptable in dense tools (keep ≥ 16 px for form inputs on mobile). Separate rows with light horizontal lines or subtle zebra striping, not full grid borders.

**Structure and behavior**
- Sticky header; pin the identifier column when scrolling horizontally; totals/summary row when sums matter.
- Sortable columns show the current sort (`aria-sort`); default sort answers the view's question (e.g. "most overdue first").
- Column management for wide data: show/hide, reorder, resize; remember per user.
- Row click opens the detail (side sheet or page, URL-addressable); inner controls stop propagation; the whole row is not the only target for keyboard users.
- Selection: checkbox column, shift-click range select, "Select all 50 on this page" then "Select all 12,304 matching" as an explicit second step.
- **Bulk action bar** appears on selection: count ("12 selected"), available actions, Clear. Destructive bulk actions preview scope and follow the undo-vs-confirm rules from `interaction-design`.
- Responsive: horizontal scroll inside a labeled, focusable region with the first column pinned; on narrow containers switch to stacked cards only if users read rows one at a time.

**Pagination, infinite scroll, or virtualization**

| Situation | Default |
|---|---|
| Work lists users return to, share, or reference by position | Server-side pagination with page size (25/50/100), total count if cheap, cursor-based for large or changing sets |
| Feeds and activity streams | "Load more" or infinite scroll with a visible end; not for tables with footers or actions at the bottom |
| Scanning thousands of loaded rows (logs, spreadsheets, trading) | Virtualized rendering (render only visible rows) plus windowed fetching |
| Data under ~1,000 rows that fits in memory | Client-side sort/filter is fine; still virtualize if rows are heavy |

Rule of thumb: virtualize once you render more than a few hundred rich rows or profiling shows jank; move sort/filter/search to the server once the dataset is too large to ship to the client or grows without bound.

## Chart selection

| Question | Default chart | Avoid |
|---|---|---|
| How did it change over time? | Line (≤ ~5 series; highlight one, grey the rest) | Pie, stacked area with many series |
| How do categories compare? | Bar, sorted; horizontal when labels are long | Unsorted bars, 3D |
| What is the ranking? | Sorted horizontal bar, or a table with inline bars | Radar |
| What share does each part have? | Stacked or 100% bar; pie/donut only for 2–4 parts | Pie with 6+ slices |
| How is it distributed? | Histogram or box plot | Averages alone |
| Are two measures related? | Scatter (size or color for a third, sparingly) | Dual-axis line |
| Where does a funnel lose people? | Horizontal bars per step with step-to-step conversion % | Funnel-shaped decoration |
| Is it on target? | KPI with bullet bar or progress to target | Gauges and speedometers |
| Intensity across two dimensions (hour × weekday) | Heatmap with a sequential palette | Rainbow color scales |
| What are the exact values? | Table | Chart with data labels on every point |
| Trend in a small space | Sparkline inside a KPI tile or table cell | Full axes in a tiny tile |

Chart rules: bar charts start at zero (line charts need not); label series directly instead of a distant legend; faint gridlines; color-blind-safe categorical palette with shape or labels as backup; use the same color for the same entity everywhere; tooltips add detail but never hold the only copy of a value; provide a table view or text summary for accessibility. For chart palettes and theming use `design-foundations`; details: `references/dashboards-and-charts.md`.

## Formatting numbers and dates

Format in the user's locale with `Intl` (or the platform equivalent). Create formatters once and reuse them; constructing them per cell is slow.

```js
const locale = navigator.language;            // or the user's saved preference
const money = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });
const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: userTz });
const rel = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

money.format(1234.5);   // "€1,234.50" (en) / "1.234,50 €" (de)
compact.format(12345);  // "12.3K"
pct.format(0.153);      // "+15.3%"
rel.format(-1, "day");  // "yesterday"
```

- Compact notation for KPI tiles and axes; full precision in tables and tooltips.
- Same decimals within a column; currency with 0 or 2 decimals per context, never mixed.
- Store and compute in UTC and minor units (cents); display in the user's time zone and state it when ambiguous.
- Show nulls explicitly ("—" with an accessible label such as "No data"), distinct from zero.
- More recipes (durations, ranges, units, sorting by locale): `references/formatting.md`.

## Filters and saved views

- Put the most-used 2–4 filters inline above the table; the rest under "More filters". Active filters appear as removable chips with a "Clear all".
- Search box for the fields people actually search by (name, email, ID); debounce ~200–300 ms and cancel stale requests.
- Filters apply immediately for single controls; a panel of many filters can batch with "Apply".
- Show the result count as filters change ("128 results").
- Everything in the URL; **saved views** (named filter + sort + columns) for repeated configurations, with personal and shared scopes and a clear "modified" state.
- Faceted counts next to filter options when cheap ("Overdue (12)"); never show options that yield zero results without marking them.

## Admin and CRUD patterns

Default flow: **list → detail (side sheet or page) → edit**, with create in the same surface as edit. Full patterns: `references/admin-crud.md`.

- Inline edit for single, low-risk fields (Enter saves, Esc cancels, error shown in the cell); forms for multi-field edits.
- Record pages show identity (name, ID, status) at the top, then key fields, related records as tabs, and an activity/audit log.
- Soft delete with trash and restore; destructive and bulk operations preview their scope ("This will cancel 37 subscriptions").
- Concurrency: detect edit conflicts (version or updated-at check) and explain them instead of silently overwriting.
- Permissions visible: read-only fields look read-only and say why; hidden actions only when the user can never gain access.
- Import/export: CSV import with column mapping, preview, validation report per row, and a dry run; exports of the current filtered view, async with notification when large.

## Gotchas

- **The "everything dashboard".** Twelve equal tiles with no question behind them. Cut to the metrics that drive a decision and move the rest to reports (`dashboard-design`).
- **Proportional digits in numeric columns.** Decimals jitter and comparisons fail; always `tabular-nums` and right alignment.
- **Color-only deltas and statuses.** Red/green without icon or text fails color-blind users and WCAG 1.4.1.
- **Client-side sorting of a paginated server list.** It sorts only the current page and silently lies; sort on the server.
- **Filters that reset on refresh or Back.** Put state in the URL.
- **"Select all" that means "this page" without saying so.** State the scope and offer "select all N matching".
- **Hover-only row actions.** Invisible on touch and to keyboard users; keep a visible kebab menu.
- **Truncated numbers and IDs.** "1,234,5…" is worse than no value; widen the column, use compact notation with the exact value on hover, or middle-truncate IDs with a copy button.
- **Pie charts with many slices, dual axes, and truncated bar axes.** They mislead; use the selection table.
- **Spinners replacing the whole table on every filter change.** Keep previous rows visible (dimmed) while fetching.
- **Invented demo metrics.** Placeholder data must be clearly labeled as sample; never present fabricated numbers as real.
- **Time zone ambiguity.** "Today" differs per user; state the zone on date-bucketed reports.

## Output format

For a data view, deliver the code plus a spec:

```
View: <name> — Primary question: <…> — Users: <role, frequency>
Layout: <KPI row / charts / table order>
KPIs: <metric · comparison · period · good direction>
Table: <column: alignment, format, sortable?> · default sort · density · row actions · bulk actions
Data ops: <client | server> for sort/filter/search/pagination · virtualization yes/no · page size
URL state: <params>
States: loading · empty(first use) · no results · partial · error · stale · no permission
Tested with: <row counts, extremes, locales>
```

## References

| File | Read when |
|---|---|
| `references/tables.md` | Building or reviewing a table/grid: column specs, selection, bulk actions, virtualization, responsive tables, keyboard navigation, accessibility. |
| `references/dashboards-and-charts.md` | Styling KPI tiles, picking or styling charts, chart color, tooltips and drill-down on a chart, chart accessibility, large-series performance. (Dashboard layout and states: `dashboard-design`.) |
| `references/formatting.md` | Formatting numbers, currency, percentages, dates, durations, units, nulls; locale and time-zone handling. |
| `references/admin-crud.md` | Building admin/back-office screens: list/detail/edit flows, inline edit, permissions, audit logs, import/export, destructive and bulk operations. |

## Related skills

- `dashboard-design` — dashboard types, KPI selection, layout, widget states, controls, and the app shell around data views.
- `interaction-design` — states, forms, undo vs. confirm, overlays used inside data views.
- `design-foundations` — type scale, color tokens, and chart palettes in light and dark mode.
- `accessibility` — table semantics, grid keyboard patterns, chart alternatives.
- `scalability` — query performance, indexes, and pagination on the backend.
- `frontend-architecture` — server state caching and URL-state plumbing.
