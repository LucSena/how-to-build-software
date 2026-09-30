# Tables and data grids

## Contents
- Table or grid?
- Column specification
- Layout, density, and typography
- Sorting
- Selection and bulk actions
- Row actions and row click
- Pagination, infinite loading, virtualization
- Responsive tables
- Keyboard and accessibility
- Performance checklist

---

## Table or grid?

| Need | Use |
|---|---|
| Read, compare, sort, filter; row click opens detail | **Data table**: semantic `<table>` with `<th scope>`; Tab moves between interactive elements |
| Spreadsheet-like cell editing, cell-level keyboard navigation, copy/paste ranges | **Data grid**: ARIA `grid` pattern with roving focus and arrow-key navigation |
| A handful of labelled values about one thing | **Description list** (`<dl>`), not a two-column table |
| Items that are read one at a time with rich content | **List or cards** |

Default to a table. A grid is much more work to make accessible; use one only when cell-level editing is the job. Headless libraries (for example TanStack Table) give sorting, filtering, and selection logic while you keep semantic markup; full grid products (for example AG Grid) cover editing and huge datasets out of the box. Pick by need, not habit.

## Column specification

Write a spec per column before building:

```
Column      Type      Align  Format                     Sort  Filter      Width
Customer    text      left   name + email (2 lines)     yes   search      flexible (min 200)
Status      enum      left   badge (text+icon)          yes   multi-select 120
MRR         currency  right  €1,234.00, tabular         yes   range       120
Last seen   datetime  left   relative, absolute on hover yes  date range  140
Actions     —         right  kebab menu                 no    —           48
```

- **Order**: identifier first (serial position), the columns that answer the view's question next, rarely used columns last or hidden by default.
- **Headers**: short nouns with units ("Amount (USD)", "Duration (ms)"); header alignment matches the column.
- **Widths**: fixed for predictable data (dates, status, numbers), flexible with a minimum for text; avoid layout jumps when data loads (`table-layout: fixed` or explicit widths).
- **Multi-line cells**: primary value on top, secondary in muted smaller text below (name / email). Keep row heights consistent within a density mode.
- **Empty cells**: "—" with an accessible label, distinct from 0.

## Layout, density, and typography

- Density tokens: compact ~32 px rows, default ~40 px, comfortable ~48–56 px. One density per table; a density toggle for power users is a good addition.
- Cell padding 8–16 px horizontal. More padding at the table's outer edges than between columns aligns content with the page grid.
- `font-variant-numeric: tabular-nums` on numeric columns (or the whole table); consistent decimals per column.
- Horizontal separators or subtle zebra striping; avoid vertical borders except in spreadsheet-like grids.
- Hover highlight on rows (pointer devices) plus a distinct selected style and a visible focus style.
- Sticky header (`position: sticky; top: 0`) inside the scroll container; pinned first column for horizontal scroll with a subtle shadow to show overflow.
- Totals row pinned at the bottom when sums matter, visually distinct and labeled.

## Sorting

- Click header to sort; click again to reverse; optional third click to clear. Show direction with an icon; set `aria-sort="ascending|descending"` on the sorted `<th>`.
- The sort control is a `<button>` inside the `<th>` so it is keyboard-operable.
- Default sort answers the view's question (most recent, most overdue, highest value). Stable secondary sort (e.g. by ID) prevents rows jumping.
- Sort nulls last in both directions unless there is a reason.
- Sort text with `Intl.Collator` (locale-aware, numeric option for "Item 2" before "Item 10").
- Paginated server data must sort on the server; sorting a single page on the client is wrong.

## Selection and bulk actions

- Checkbox column on the left; header checkbox selects the current page, with an indeterminate state for partial selection.
- Shift-click selects a range; ⌘/Ctrl-click toggles on grids with row selection.
- After selecting a full page, offer "Select all 12,304 matching" explicitly; when active, say so ("All 12,304 matching rows selected · Clear").
- Bulk action bar appears in context (above the table or sticky at the bottom) with the count, the actions, and Clear. It must not cover the last rows; add padding.
- Selections persist across pagination only if the UI clearly shows the count; otherwise clear on page change and say so.
- Bulk destructive actions: state scope ("Archive 37 projects"), preview a sample for large or irreversible changes, run as a background job with progress for big batches, report partial failures ("35 archived, 2 failed · View failures"), and offer undo where possible.

## Row actions and row click

- Primary row action: clicking the row (or the identifier link) opens the detail. Implement as a real link on the identifier cell so middle-click and open-in-new-tab work; make the rest of the row a larger click target for pointer users.
- Secondary actions in a kebab menu in the last column, always visible (not hover-only), with an accessible name ("Actions for Invoice INV-204").
- One or two very frequent actions may be inline icon buttons with tooltips and labels.
- Interactive elements inside a clickable row stop propagation.
- Destructive row actions follow undo-vs-confirm rules (see `interaction-design`).

## Pagination, infinite loading, virtualization

- **Server pagination**: page size selector (25/50/100), "1–50 of 12,304", previous/next plus jump for offset pagination; cursor pagination for large or frequently changing data (no total, or an approximate one). Keep page and size in the URL.
- **Load more / infinite**: for feeds and timelines; show a count and a clear end; keep scroll position on Back. Avoid for tables with footers, totals, or bulk actions at the bottom.
- **Virtualization**: render only visible rows plus overscan. Needs known or measured row heights; fixed heights are simplest and fastest. Keep the header outside the virtual list; preserve `aria-rowcount`/`aria-rowindex` for assistive tech. Examples: TanStack Virtual, virtua, react-window; `content-visibility: auto` for simpler long pages.
- **Keep previous data while fetching** (dim or show a thin progress bar) instead of replacing the table with a skeleton on every page, sort, or filter change. Use skeleton rows only for the first load.
- **Stale request protection**: cancel in-flight requests when filters change (`AbortController`) or ignore out-of-order responses.

## Responsive tables

- Default: horizontal scroll inside a container that is labeled (`role="region"`, `aria-label`, `tabindex="0"`) so keyboard users can scroll, with the identifier column pinned and an overflow shadow.
- Hide low-priority columns at narrow widths (container queries) and expose them in the detail view.
- Stacked cards (each row becomes a card of label/value pairs) only when users read one record at a time; comparison across rows gets harder.
- Never shrink text below readable size to force a fit.

## Keyboard and accessibility

- Semantic `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, and `<caption>` (can be visually hidden) describing the table.
- Sort buttons, checkboxes, row links, and action menus are all reachable by Tab; order is left-to-right, top-to-bottom.
- For true grids: roving tabindex, arrow keys between cells, Home/End, Page Up/Down, Enter to edit, Esc to cancel (WAI-ARIA grid pattern).
- Announce result counts after filtering and sort changes via a polite live region ("128 results, sorted by amount, descending").
- Status and deltas carry text, not color alone. Row selection state is exposed (`aria-selected` in grids, checkbox state in tables).

## Performance checklist

- [ ] Server does sort/filter/search/pagination for datasets that do not fit comfortably in memory.
- [ ] Rendered rows are virtualized or paginated; no more than a few hundred rich rows in the DOM.
- [ ] Row components memoized; no per-row expensive work in render (formatters created once).
- [ ] Column widths fixed or measured once; no layout thrash when scrolling.
- [ ] Search debounced (~200–300 ms) and stale requests cancelled.
- [ ] Heavy client aggregations run in a Web Worker.
- [ ] Tested with production-like volume (10k+ rows), long strings, and slow network.

## Sources

- WAI-ARIA Authoring Practices, Table and Grid patterns: https://www.w3.org/WAI/ARIA/apg/patterns/table/ ; https://www.w3.org/WAI/ARIA/apg/patterns/grid/
- WAI-ARIA Authoring Practices, sortable table example: https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/
- Vercel Web Interface Guidelines (tabular numbers, URL as state, virtualize large lists): https://github.com/vercel-labs/web-interface-guidelines
- MDN, `font-variant-numeric`: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric
- MDN, `Intl.Collator`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
- web.dev, `content-visibility`: https://web.dev/articles/content-visibility
- TanStack Table and TanStack Virtual docs: https://tanstack.com/table ; https://tanstack.com/virtual
