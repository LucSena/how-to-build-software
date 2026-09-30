# Dashboard layouts

Wireframes to start from, one per dashboard type, plus the grid and breakpoint rules they share. All values in the sketches are placeholders; label them as sample data in any demo.

## Contents
- Shared grid rules
- SaaS product home
- Operational / live status
- Analytics (single page, click-to-filter)
- Strategic / executive
- Mobile stacking
- Choosing widths and heights

---

## Shared grid rules

- **Bands, top to bottom**: control bar → KPI row → primary trend (full width) → breakdowns (2–3 columns) → detail table. This is Shneiderman's "overview first, zoom and filter, details on demand" laid out in space.
- **12-column grid** inside the content area; common spans: KPI cards 3 columns each (4 across), trend 12, breakdowns 4+4+4 or 6+6, table 12.
- **Equal-height cards per row**; 16–24 px internal padding; gaps from the spacing scale (16 or 24 px).
- **Container queries** on the main area and on cards, so a card reflows by its own width when the sidebar opens or an inspector docks. shadcn's dashboard example sets containers on the main area and card grid and moves KPI cards from 1 to 2 to 4 columns.
- **Card chrome is quiet**: one border or one subtle surface change, not border + shadow + gradient. Titles are sentence case; the takeaway can live in the subtitle.
- **One control bar** at the top of content, right-aligned in LTR: range, comparison, filters, refresh/updated time.
- **Priority top-left**; the most important number is the first thing read.

## SaaS product home

Purpose: "What changed, and what do I do next?" For every user, on load.

```
┌─ Home ─────────────────────────────── [Last 30 days ▾] [vs previous ▾] [Filter] ┐
│ ┌ MRR ─────────┐ ┌ Active accounts ┐ ┌ Activation rate ┐ ┌ Churned MRR ────┐   │
│ │ $48.2k       │ │ 1,284           │ │ 31.4%           │ │ $1.9k           │   │
│ │ ▲ 6.1% vs    │ │ ▲ 3.2%          │ │ ▼ 2.3 pts       │ │ ▲ 18% (bad)     │   │
│ │ prev 30d  ⌇⌇ │ │            ⌇⌇⌇  │ │ target 35%  ▭▭▮ │ │ 3 accounts →    │   │
│ └──────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│ ┌ MRR trend ── this period ─ previous (dashed) ──────────────────────────────┐ │
│ │     ___/‾‾‾\___/‾‾‾‾‾‾‾\__/‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\___/‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾┈┈ (today)│ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│ ┌ Needs attention ──────────┐ ┌ Top plans ──────────┐ ┌ Recent activity ─────┐│
│ │ ● 3 failed payments [Fix] │ │ Pro     ████████ 62 │ │ Acme upgraded · 2m   ││
│ │ ● 2 trials end tomorrow   │ │ Team    █████    31 │ │ Beta Co invited 4·1h ││
│ │ ● 1 dispute  [Respond]    │ │ Starter ██        7 │ │ …         View all → ││
│ └───────────────────────────┘ └─────────────────────┘ └──────────────────────┘│
│ ┌ Accounts (name · plan · MRR · health · last seen)            [Export]      ┐ │
└──────────────────────────────────────────────────────────────────────────────────┘
```
- The "Needs attention" list is the most valuable widget on a home screen: items with an action button beside each.
- Pair a lagging outcome (MRR) with a leading indicator (activation rate).
- The dotted "today" segment marks the incomplete period.
- For a personal home (not a company metrics page), replace the KPI row with "Your work": assigned items, due today, mentions.

## Operational / live status

Purpose: "Is anything wrong right now?" On a wall screen or an on-call laptop.

```
┌ Payments — live ● updated 12s ago ──────────────────────── [Pause] [Last 1h ▾] ┐
│ Status: ● Degraded — card auth latency p95 1.8 s (SLO 1.0 s)  [Open incident]  │
│ ┌ Success rate ─┐ ┌ p95 latency ─┐ ┌ Error rate ──┐ ┌ Queue depth ─┐           │
│ │ 97.2% ▼0.9pt │ │ 1.8 s ▲ SLO! │ │ 0.8% ▲       │ │ 214 ▲        │           │
│ │ ▭▭▭▭▭▭▭▮▭ tgt│ │ ⌇⌇⌇⌇⌇⌇⌇⌇⌇▲  │ │ ⌇⌇⌇⌇⌇⌇⌇⌇▲    │ │ ⌇⌇⌇⌇⌇⌇⌇▲     │           │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
│ Latency by region (small multiples, shared y-axis)                            │
│ [us-east ⌇⌇⌇]  [eu-west ⌇⌇⌇▲]  [ap-south ⌇⌇]                                   │
│ Recent errors (table, newest first, row → trace)                              │
└──────────────────────────────────────────────────────────────────────────────┘
```
- A single status line with text ("Degraded"), not just a color.
- Thresholds and SLOs drawn on the charts; the breaching value is labeled.
- Freshness is always visible; a stale feed turns the timestamp to a warning state.
- Pause freezes updates while someone investigates.
- Small multiples with a shared axis make the outlier region obvious at a glance.
- For wall displays: larger type, no hover-only information, high contrast, no interaction required.

## Analytics (single page, click-to-filter)

Purpose: "Why did it change, and for which segment?" Modeled on Plausible's single-page dashboard.

```
[site ▾]  [Filter +]  source = Newsletter ✕                [Last 28 days ▾] [Compare ▾]
Unique visitors | Visits | Pageviews | Views/visit | Bounce rate | Visit duration  ← click = chart metric
[ main line chart · comparison as second line · current period dotted          ]
┌ Top sources ── Channels | Sources | Campaigns ┐ ┌ Top pages ── Top | Entry | Exit ┐
│ ranked bar list, click row = filter      [⤢] │ │ ranked bar list             [⤢] │
┌ Locations ── Map | Countries | Regions ───────┐ ┌ Devices ── Browser | OS | Size ─┐
┌ Goals | Properties | Funnels ──────────────────────────────────────────────────────┐
```
- The KPI row doubles as a chart selector: clicking a metric swaps the main chart.
- Every breakdown row is a filter; active filters appear as chips at the top.
- Tabs inside a card switch dimension (Channels / Sources / Campaigns) without adding cards.
- Expand (⤢) opens the full list with more columns and sorting, instead of a longer card.
- No sub-menus: one page answers most questions.

## Strategic / executive

Purpose: "Are we on track?" Read weekly or monthly; little interaction.

```
┌ Company scorecard — Q3 · as of 30 Sep ───────────────────────── [Q3 ▾] [Export] ┐
│ ┌ ARR ────────────────────┐ ┌ Net revenue retention ─┐ ┌ Gross margin ──────────┐ │
│ │ $5.8M of $6.5M target   │ │ 108% (target 110%)     │ │ 71% (target 70%) ✓     │ │
│ │ ▭▭▭▭▭▭▭▭▭▭▭▮▭▭ bullet   │ │ ▭▭▭▭▭▭▭▭▭▭▮▭ bullet    │ │ ▭▭▭▭▭▭▭▭▭▭▭▮ bullet     │ │
│ │ On track to 94% of goal │ │ Below target 2 pts     │ │ Above target           │ │
│ └─────────────────────────┘ └────────────────────────┘ └────────────────────────┘ │
│ ┌ ARR, last 8 quarters (annotated: price change Q1, EU launch Q2) ─────────────┐ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│ Commentary: 3 lines written by the metric owner — what moved and why            │
└───────────────────────────────────────────────────────────────────────────────────┘
```
- Bullet graphs (value bar + target marker + qualitative bands) replace gauges; Few designed them for this.
- Long ranges and annotations explain changes; a short written commentary beats more charts.
- Snapshot refresh (daily or at period close), with the "as of" date in the title.

## Mobile stacking

```
┌──────────────────────────┐
│ Home        [30d ▾] [⚙]  │
│ ┌ MRR ───── $48.2k ▲6% ┐ │  KPI cards: 2 per row or a horizontal scroller
│ └──────────────────────┘ │  with the most important first
│ ┌ Activation 31% ▼2pts ┐ │
│ └──────────────────────┘ │
│ ┌ MRR trend (compact) ─┐ │  one chart, fewer ticks, tap for detail
│ └──────────────────────┘ │
│ Needs attention (3)   →  │  actions stay reachable
│ [ View full dashboard ]  │
└──────────────────────────┘
```
- Stack in the desktop priority order (PostHog does exactly this, and allows layout editing only on wide screens).
- Show the KPI row, one chart, and the attention list; put the rest behind "View details".
- Tooltips become tap-to-pin; nothing depends on hover.
- Filters move into a sheet with an "Apply" button and a visible active-filter count.

## Choosing widths and heights

| Widget | Desktop span (of 12) | Min height | Notes |
|---|---|---|---|
| KPI card | 3 (4 across) or 4 (3 across) | Content height | Same height across the row |
| Primary trend | 12 | ~240–320 px | Wide beats tall for time series |
| Ranked bar list | 4 or 6 | Top 5–10 rows | "View all" or expand for more |
| Small multiples | 12 (3–6 panels) | ~120 px per panel | Shared y-axis |
| Table | 12 | 5–10 rows + pagination | Rules in `data-dense-ui` |
| Status line | 12 | One line | Text + icon + action |

Heights above are starting points; tune to the density of the product, and keep skeletons the exact size of the loaded widget.

## Sources

- Ben Shneiderman, "The Eyes Have It" (1996): https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf
- Stephen Few, Common Pitfalls in Dashboard Design; bullet graph: https://www.perceptualedge.com/articles/Whitepapers/Common_Pitfalls.pdf ; https://en.wikipedia.org/wiki/Bullet_graph
- Edward Tufte, sparklines and small multiples: https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/
- Plausible docs, guided tour (click-to-filter, clickable metrics, dotted incomplete period, expand): https://github.com/plausible/docs
- PostHog dashboards docs (mobile stacking, filter overrides): https://github.com/PostHog/posthog.com/blob/master/contents/docs/product-analytics/dashboards.mdx
- shadcn/ui dashboard-01 block (MIT): https://github.com/shadcn-ui/ui
- NN/g, Dashboards: Making Charts and Graphs Easier to Understand: https://www.nngroup.com/articles/dashboards-preattentive/
