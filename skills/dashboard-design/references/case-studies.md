# Dashboard and app-shell case studies

Real references and the research behind the rules: what each does, what to copy, and the rule it teaches. Product details change; check the live product or docs before quoting specifics.

---

## Research foundations

### Stephen Few: a dashboard fits on one screen and gives context
**What.** Few defines a dashboard as a visual display of the most important information needed to achieve objectives, consolidated on a single screen and monitored at a glance. His "Common Pitfalls in Dashboard Design" lists, among others: exceeding a single screen, inadequate context for the data, excessive detail or precision, a deficient measure, inappropriate or poorly designed display media, meaningless variety, inaccurate encoding of quantities, poor arrangement, ineffective highlighting, useless decoration, and misused color (paraphrased; read the paper for the exact list).
**Rule.** Curate to the few metrics that matter, give each context (comparison, target), and remove decoration and variety that carry no data.
**Source.** https://www.perceptualedge.com/articles/Whitepapers/Common_Pitfalls.pdf ; https://www.perceptualedge.com/articles/misc/WhyMostDashboardsFail.pdf

### Few's bullet graph: replace the gauge
**What.** Gauges and speedometers spend a lot of space and decoration on one number. Few designed the bullet graph: a bar for the measure, a marker for the target, and 2–5 greyscale bands for qualitative ranges (poor, satisfactory, good).
**Rule.** Actual-vs-target is a bullet graph or a progress bar with a target marker, never a gauge.
**Source.** https://en.wikipedia.org/wiki/Bullet_graph

### Tufte: data-ink, sparklines, small multiples
**What.** Tufte argues for maximizing the share of ink that encodes data; for sparklines as "data-intense, design-simple, word-sized" graphics without frames or ticks; and for small multiples (the same chart repeated per segment on shared axes) over one overloaded chart.
**Rule.** Sparklines inside KPI cards; small multiples instead of 10-line spaghetti charts; delete borders, shadows, and gridlines that carry no data.
**Source.** https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/ ; https://jtr13.github.io/cc19/tuftes-principles-of-data-ink.html

### Shneiderman: overview, zoom and filter, details on demand
**What.** The 1996 "visual information-seeking mantra", with further tasks: relate, history, extract.
**Rule.** KPI row and trend first; range, filters, and click-to-filter next; tooltips, expansion, and record views last; URL state for history; export for extract.
**Source.** https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf

### NN/g: use length and position for quantities
**What.** NN/g's dashboard article (Page Laubheimer, 2017) explains preattentive processing: length and 2-D position are perceived most accurately, so linear charts beat area- and angle-based ones for quantities; color and shape suit categories. It also distinguishes operational from analytical dashboards.
**Rule.** Bars and lines for quantities; pies only for 2–4 parts; decide the dashboard type before the layout.
**Source.** https://www.nngroup.com/articles/dashboards-preattentive/

---

## Products

### Plausible Analytics: one page, everything clickable
**What.** A single-page dashboard with no sub-menus. The top metrics are clickable and switch the main chart; any row in any report filters the whole dashboard; comparison modes include matching the day of the week; the current incomplete period is drawn dotted; each report expands in place to a full sortable list; date ranges have single-key shortcuts, ← / → step periods, Esc clears filters, and 1–9 switch pinned sites; the realtime view refreshes every 30 seconds.
**Copy.** Click-to-filter, clickable KPI row, dotted incomplete period, keyboard shortcuts, expand in place.
**Source.** https://github.com/plausible/docs (guided-tour, compare-stats, keyboard-shortcuts, realtime-dashboard)

### Stripe Dashboard home: few numbers, comparison under each, a widget library
**What.** The home shows a small set of money metrics with the comparison period directly under each value, and lets users add charts from a library of predefined widgets rather than building from scratch; actionable items (disputes, failed payments) are surfaced. Stripe's test-mode indicator is a widely copied pattern for making the environment unmistakable.
**Copy.** Comparison under every number; a curated widget library before any builder; environment badge.
**Source.** https://support.stripe.com/questions/dashboard-home-charts-overview ; https://stripe.dev/blog/avoiding-test-mode-tangles-with-stripe-sandboxes

### PostHog: templates, overrides you can see, no blank dashboards
**What.** Dashboards can start from built-in, team, or organization templates (and any dashboard can be saved as a template); empty dashboards offer AI starter prompts; global date and filters apply to all tiles, tile-level overrides take precedence and are flagged on the tile; one insight can appear on many dashboards; tiles stack into one column on small screens, with layout editing on wide screens; filters persist in the URL. Dashboards track known metrics; notebooks are for ad hoc analysis.
**Copy.** Templates and starter prompts, visible overrides, reuse instead of copies, monitoring vs exploration split.
**Source.** https://github.com/PostHog/posthog.com/blob/master/contents/docs/product-analytics/dashboards.mdx

### Linear: keyboard-first shell
**What.** A dense sidebar with a workspace switcher, personal items (inbox, my issues) above team sections; the command menu (⌘K) is taught early as the primary way to act; a demo workspace shows good practice.
**Copy.** Personal-first sidebar order, ⌘K as a first-class interaction taught in onboarding, nested palette commands.
**Source.** https://www.candu.ai/blog/linear-onboarding-teardown ; https://supademo.com/user-flow-examples/linear

### shadcn/ui dashboard-01 and Sidebar: a reference composition (as of 2026-09)
**What.** An open-source (MIT) block combining a collapsible sidebar, a sticky site header, KPI cards (label, tabular-numeral value, delta badge, footer interpretation line), an interactive area chart with a 7d / 30d / 90d toggle that becomes a select on narrow widths, and a data table. The Sidebar component documents widths (16rem, 18rem mobile, 3rem icon), a ⌘/Ctrl+B toggle, cookie-persisted state, and a Sheet drawer below 768 px.
**Copy.** The composition and states, not the default look; restyle with your tokens (`design-systems`).
**Source.** https://github.com/shadcn-ui/ui ; https://ui.shadcn.com/docs/components/sidebar

### Tremor: a vocabulary of dashboard primitives
**What.** An Apache-2.0 React library whose component names map the primitives dashboards need: metric, delta badge, bar list, category bar, marker/progress bars, tracker, sparklines, funnel chart, date range picker. `BadgeDelta` separates delta direction from whether an increase is positive.
**Copy.** Use its list as a checklist of widget types and the "is increase positive" idea for delta colors.
**Source.** https://github.com/tremorlabs/tremor-npm

### Superhuman: the command palette as a teacher
**What.** Superhuman's guidance for command palettes: available everywhere with one shortcut, and every command displays its keyboard shortcut so users learn the faster path.
**Copy.** Palette everywhere; shortcuts shown on every row and in tooltips.
**Source.** https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/

## Sources

Listed with each case above.
