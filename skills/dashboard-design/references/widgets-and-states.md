# Widgets and their states

How to specify one dashboard widget: its anatomy, the chart form, the nine states, the numbers inside it, and how it stays accessible. Chart-by-chart styling and full number/date formatting recipes live in `data-dense-ui`.

## Contents
- Widget spec template
- KPI card anatomy
- Widget vocabulary
- Chart form per widget
- The nine states
- Numbers on dashboards
- Freshness and definitions
- Chart accessibility

---

## Widget spec template

```
Widget: <name>                     Question it answers: <…>
Query: <source, aggregation, grain> · Cost: <expected ms> · Cache TTL: <…>
Form: <KPI card | line | bar list | bullet | table | status line | small multiples>
Respects global range/filters: yes | no (flag shown: "<text>")
Comparison: <previous period | YoY | target> · Good direction: <up | down | neutral>
Definition (ⓘ): <plain-language definition, formula, source, freshness>
Drill: <URL of the detail view with current filters>
States: loading · not set up · no data in range · filtered out · partial · stale · error · no permission · ideal
Roles: <who sees it; what others see>
```

## KPI card anatomy

```
┌──────────────────────────────────────┐
│ Active accounts               ▲ 3.2% │  label (plain words)        delta badge
│ 1,284                                │  value: large, tabular-nums, compact if big
│ Up vs previous 30 days          ⌇⌇⌇  │  interpretation + period    sparkline (no axes)
│ Trending up this month           ⓘ → │  one-line takeaway          definition · drill
└──────────────────────────────────────┘
```

- **Order**: label → value → delta → interpretation line with comparison period → optional sparkline or target bar. shadcn's dashboard-01 uses the same structure (description, title with tabular numerals, action slot for the delta badge, footer with an interpretation such as "Acquisition needs attention").
- **Value**: tabular numerals; compact notation on the card ("48.2K"), exact value in the tooltip or detail.
- **Delta**: sign + arrow + color **by meaning**. Tremor's `BadgeDelta` models this with a delta type plus an `isIncreasePositive` flag that flips the color for metrics where up is bad (churn, latency, cost).
- **Target**: "31.4% · target 35%" with a small bullet or progress bar marking the target.
- **Whole card is a link** to the detail view with the same filters; keep an explicit focusable link or button inside for keyboard users.
- **Same decimals across a row** of cards; units in the label when uniform ("Latency (ms)").
- **No decorative icons** in every card corner and no gradient "hero metric" treatment; the number is the hero.

Markup sketch (framework-neutral):
```html
<article class="kpi" aria-labelledby="kpi-active-label">
  <h3 id="kpi-active-label">Active accounts</h3>
  <p class="kpi-value" style="font-variant-numeric: tabular-nums">1,284</p>
  <p class="kpi-delta" data-good="true">
    <span aria-hidden="true">▲</span> +3.2% <span class="sr-only">increase</span> vs previous 30 days
  </p>
  <a href="/accounts?range=30d&status=active">View active accounts</a>
</article>
```

## Widget vocabulary

A checklist of primitives most dashboards need. Tremor's component set (tremor-npm, Apache-2.0) is a useful naming reference even if you do not use it (as of 2026-09):

| Need | Primitive | Tremor name |
|---|---|---|
| Headline number | Metric + delta badge | `Metric`, `BadgeDelta` |
| Trend over time | Line or area chart | `LineChart`, `AreaChart` |
| Trend inside a card | Sparkline | `SparkLineChart`, `SparkAreaChart`, `SparkBarChart` |
| Ranked categories | Bar list (label, value, bar) | `BarList` |
| Part-to-whole in one bar | Category bar | `CategoryBar` |
| Actual vs target | Progress or marker bar | `ProgressBar`, `MarkerBar`, `DeltaBar` |
| Status history (uptime) | Row of colored blocks with labels | `Tracker` |
| Funnel | Horizontal bars with step conversion | `FunnelChart` |
| Range and filters | Date range picker, multi-select | `DateRangePicker`, `MultiSelect` |

shadcn/ui charts wrap Recharts and add an `accessibilityLayer` prop for keyboard and screen-reader support.

## Chart form per widget

| Question | Default | Avoid |
|---|---|---|
| Change over time | Line (area only for one series or a total) | Bars for long series; 3D |
| Compare categories | Sorted horizontal bar / bar list | Pie with more than 4–5 slices |
| Part-to-whole, few parts | 100% stacked bar or category bar | Pies with similar slices |
| Actual vs target | Bullet graph or progress with target marker | Gauges, speedometers |
| Many segments over time | Small multiples, shared y-axis | 10-line spaghetti |
| Distribution | Histogram or box plot | Average only |
| Funnel | Horizontal bars with step conversion % | Trapezoid funnel graphics |
| Two measures related | Scatter | Dual y-axes |
| Exact lookups | Table | Chart with a label on every point |

Length and position on a common scale are read most accurately; angle and area least (NN/g, citing preattentive processing research). Use the same form for the same kind of question across the dashboard (Few: avoid "meaningless variety").

## The nine states

| State | Trigger | Shows | Implementation notes |
|---|---|---|---|
| Loading | Query in flight | Skeleton the exact size and shape of the result | Delay showing it ~150–300 ms to avoid flicker; keep it ≥ ~300 ms once shown; `aria-busy` on the widget |
| Empty — not set up | Integration missing, tracking not installed | What it will show, why, and the setup CTA; optional labeled sample | This is an onboarding surface (`onboarding-design`) |
| Empty — no data in range | Query ok, zero rows | "No sign-ups in the last 7 days" + "Try last 30 days" | Distinguish from broken; zero is data |
| Empty — filtered out | Filters exclude everything | "No results for source = Newsletter" + Clear filter | Echo the filter |
| Partial | Backfill or sync in progress, some sources failed | Data + banner "Stripe sync 60% complete" or "Data delayed ~2 h" | Mark affected buckets |
| Stale | Last update older than its freshness target | "Updated 3 h ago" in warning style + Refresh | Operational views especially |
| Error | Query failed or timed out | Short cause + Retry + error ID; rest of the page unaffected | Per-widget error boundary; never a page crash |
| No permission | Role lacks access | "Revenue is visible to Finance and Admins · Request access" | Do not silently omit; do not leak the number |
| Ideal | — | Value/chart + comparison + ⓘ + drill | — |

**Refetching** is a variant of Loading: when the range or filters change on a widget that already has data, keep the previous data visible and dimmed with a thin progress line; never swap back to a skeleton.

Copy follows the error formula: what happened + why (if useful) + what to do. "Couldn't load revenue. The billing service timed out. Retry" beats "Something went wrong".

## Numbers on dashboards

- **Tabular numerals** everywhere numbers are compared.
- **Compact on cards, exact on hover and in tables**: `Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 })` → "48.2K".
- **Precision matches the decision** (Few: excessive precision); `$1,234,567.89` becomes `$1.23M` on a card.
- **Percent vs points**: a rate moving 33.7% → 31.4% is "−2.3 pts". A value moving 100 → 93 is "−7%". Label which.
- **Tiny bases**: 1 → 10 shows "+9" or "new", not "+900%"; division by zero shows "—".
- **Currency and locale** from the account; never sum mixed currencies without a conversion note.
- **Time**: relative for freshness ("updated 12 s ago"), absolute on hover; state the time zone once.
- Full recipes (durations, ranges, nulls, locales): `data-dense-ui`.

## Freshness and definitions

- Every widget can answer "how fresh is this?" (widget footer or dashboard header) and "what exactly is this?" (ⓘ with definition, formula, source).
- Definitions live in one place (a metrics catalog) and the ⓘ reads from it, so two dashboards never define "active" differently.
- When a metric definition changes, annotate the chart at the change date.

## Chart accessibility

- **Text alternative + data**: a short name for what the chart shows, and a long description or data table with the essential values (W3C WAI complex images). A "View as table" toggle per chart serves both and doubles as export.
- **Takeaway in text**: title or subtitle states the insight ("Sign-ups up 12% since launch").
- **Not color alone** (WCAG 1.4.1): direct labels, markers or patterns, arrows and signs on deltas, text on status.
- **Contrast**: meaningful marks ≥ 3:1 against the background (WCAG 1.4.11), checked in light and dark themes.
- **Keyboard**: data points or the table focusable; tooltips appear on focus, stay while hovered, and dismiss with Esc (WCAG 1.4.13).
- **SVG semantics**: `role="img"` with an accessible name when the chart is static; interactive charts expose points to assistive tech (shadcn's `accessibilityLayer`) or defer to the table.
- **Motion**: no animated entrances under `prefers-reduced-motion`; never animate every live tick.
- **Live updates**: announce only meaningful status changes through a polite live region.

## Sources

- Stephen Few, Common Pitfalls in Dashboard Design: https://www.perceptualedge.com/articles/Whitepapers/Common_Pitfalls.pdf
- NN/g, Dashboards: Making Charts and Graphs Easier to Understand: https://www.nngroup.com/articles/dashboards-preattentive/
- NN/g, Designing Empty States in Complex Applications: https://www.nngroup.com/articles/empty-state-interface-design/
- W3C WAI, Complex Images tutorial: https://www.w3.org/WAI/tutorials/images/complex/
- WCAG 2.2 (1.4.1, 1.4.11, 1.4.13, 4.1.3): https://www.w3.org/TR/WCAG22/
- Tremor (tremor-npm, Apache-2.0): https://github.com/tremorlabs/tremor-npm
- shadcn/ui dashboard-01 and charts (MIT): https://github.com/shadcn-ui/ui
- Vercel Web Interface Guidelines (loading delays, stable skeletons): https://github.com/vercel-labs/web-interface-guidelines
- ECMA-402 `Intl.NumberFormat`: https://tc39.es/ecma402/
