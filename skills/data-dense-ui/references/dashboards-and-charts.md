# Dashboards and charts

> **Scope note (data-dense-ui 1.1.0).** Dashboard types, KPI selection, layouts and wireframes, the nine widget states, date-range and comparison controls, filters in the URL, drill-down paths, refresh strategy, customization, per-widget performance, and the app shell now live in the `dashboard-design` skill. This file keeps what is about displaying data: KPI tiles, chart rules, chart color, chart interaction, chart states, chart accessibility, and large-series performance.

## Contents
- Dashboard types and layout (moved)
- KPI tiles
- Chart rules
- Color in charts
- Interaction: tooltips, drill-down, cross-filtering
- States for chart tiles
- Accessibility
- Performance with large series

---

## Dashboard types and layout (moved)

Operational vs analytical vs strategic vs home dashboards, the four-question KPI test, the band layout (KPI row → trend → breakdowns → table), ASCII wireframes, and role-based defaults are in `dashboard-design` (`references/layouts.md` there). The short version: one primary question per dashboard, 3–5 headline KPIs, primary answer top-left, global controls in the URL, and role defaults instead of a blank widget builder.

## KPI tiles

- Label (what, in plain words) · value (large, tabular numerals, compact notation for big values with exact value on hover) · delta with arrow icon **and** color **and** sign · comparison period ("vs. last 30 days") · optional sparkline.
- Encode good direction per metric: rising revenue green, rising churn red; neutral metrics neutral grey.
- Show targets explicitly ("€84k of €100k target") with a bullet or progress bar.
- Avoid percent changes on tiny bases ("+300%" from 1 to 4); show absolute change or suppress until the base is meaningful.
- The whole tile links to the underlying filtered view.
- Do not repeat the same metric in several tiles with different periods; one period per dashboard unless labeled.

## Chart rules

- **Bars start at zero.** Truncated bar axes exaggerate differences. Line charts may use a non-zero baseline when the change is the point; label the axis clearly.
- **Sort bars** by value unless the category has a natural order (time, stages, sizes).
- **≤ ~5 series per line chart**; highlight the one that matters and grey the rest, or use small multiples.
- **Direct labels** at the end of lines or on bars beat legends; if a legend is needed, order it like the data.
- **Faint gridlines** and no chart borders; minimal ticks with formatted labels (compact notation, units).
- **No 3D, no dual axes, no pie with more than ~4 slices, no gauges** for comparison.
- **Annotate events** (release, outage, price change) on time series; they explain the "why".
- **Same entity, same color** across every chart in the product.
- **Time axes** use consistent buckets (day/week/month) with partial buckets marked ("This week, partial").
- **Small multiples** beat one crowded chart when comparing many categories over time.

## Color in charts

- **Categorical**: a palette of distinguishable hues with similar lightness and chroma (easy to build in OKLCH), tested for common color-vision deficiencies; ≤ ~8 categories, then group into "Other".
- **Sequential** (one direction of magnitude): a single hue from light to dark.
- **Diverging** (above/below a meaningful midpoint): two hues with a neutral middle.
- Status colors (success/warning/danger) only for status, never as arbitrary series colors.
- Check both light and dark themes; non-text contrast of lines and bars against the background ≥ 3:1 (WCAG 1.4.11) where they carry meaning.
- Never rely on color alone: add labels, patterns, or shapes for key distinctions.

## Interaction: tooltips, drill-down, cross-filtering

- Tooltips show the exact value, unit, and period for the hovered point; on touch, tap to pin. Crosshair tooltips for multi-series lines list all series at that x, sorted by value.
- Tooltips never hold information that is not otherwise available (keyboard and screen-reader users need a table view).
- Click a bar or segment to drill down to the filtered table; show a breadcrumb of applied drill-downs.
- Cross-filtering between charts must show clearly which filters are active and allow clearing them in one click.
- Brushing (drag to select a time range) needs a keyboard/button alternative (date range inputs).

## States for chart tiles

The complete nine-state list for dashboard widgets (including stale and no-permission) is in `dashboard-design`; the chart-specific treatment:

| State | Treatment |
|---|---|
| First load | Skeleton per tile shaped like the chart or value |
| Refetch after filter change | Keep previous values visible and dimmed, thin progress indicator |
| No data for period | "No orders between 1–7 Oct" with a suggestion to widen the range |
| Partial or delayed data | "Data after 14:00 is still processing" badge on affected tiles; partial buckets marked |
| Tile error | Error with Retry inside the tile; other tiles unaffected |
| New account | Explain what will appear, link to setup (connect data source, install tracking); optionally sample data clearly labeled "Sample data" |

## Accessibility

- Every chart has a text alternative: a title stating the takeaway ("Signups rose 18% after the pricing change"), plus a data table view or downloadable CSV.
- SVG charts: `role="img"` with an accessible name and description, or an accessible charting library that exposes data points to the keyboard.
- Keyboard access for interactive charts (arrow keys between points, Enter to drill down), or an equivalent table.
- Respect reduced motion: no animated chart entrances beyond a quick fade.

## Performance with large series

- Downsample time series to roughly the number of horizontal pixels (for example the Largest-Triangle-Three-Buckets algorithm) before rendering; aggregate on the server by time bucket.
- SVG is fine for hundreds to low thousands of marks; switch to Canvas or WebGL beyond that.
- Precompute rollups (daily/weekly aggregates) rather than scanning raw events per request; cache dashboard queries with an explicit freshness label.
- Load tiles independently and in parallel; do not block the page on the slowest query.

## Sources

- NN/g, "Dashboards: Making Charts and Graphs Easier to Understand": https://www.nngroup.com/articles/dashboards-preattentive/
- Stephen Few, *Information Dashboard Design* (2nd ed., 2013) and Perceptual Edge articles: https://www.perceptualedge.com/articles/
- Edward Tufte, *The Visual Display of Quantitative Information* (data-ink ratio, small multiples)
- Datawrapper Academy, chart choice and color guidance: https://academy.datawrapper.de/
- WCAG 2.2 SC 1.4.1 Use of Color and 1.4.11 Non-text Contrast: https://www.w3.org/TR/WCAG22/
- Sveinn Steinarsson, "Downsampling Time Series for Visual Representation" (LTTB), 2013: https://skemman.is/handle/1946/15343
- Vercel Web Interface Guidelines (accessible charts, tabular numbers): https://github.com/vercel-labs/web-interface-guidelines
