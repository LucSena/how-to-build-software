# Layout and spacing

Spacing scales, grids, app shells, and responsive procedure.

## Contents

1. Spacing scale
2. Relationship-driven spacing
3. Grouping before containers
4. Page grids
5. App shells
6. Control and component sizing
7. Responsive procedure
8. Container queries vs media queries
9. Viewport, safe areas, and input
10. Hierarchy checks

---

## 1. Spacing scale

Use a base unit of **4px** with an 8px rhythm. The 4px half-steps cover the gaps an 8-only scale misses (12, 20).

| Token | px | Typical use |
|---|---|---|
| `space-0.5` | 2 | Hairline offsets, icon nudges |
| `space-1` | 4 | Icon to label, tight inline groups |
| `space-2` | 8 | Items within a group, chip padding |
| `space-3` | 12 | Between bordered controls, compact card padding |
| `space-4` | 16 | Default card padding, form field gap, mobile page margin |
| `space-5` | 20 | Mobile page margin (roomier) |
| `space-6` | 24 | Card padding (comfortable), between related groups |
| `space-8` | 32 | Between groups in a section |
| `space-10` | 40 | |
| `space-12` | 48 | App section spacing |
| `space-16` | 64 | Marketing section spacing (mobile) |
| `space-20` | 80 | |
| `space-24` | 96 | Marketing section spacing (desktop) |
| `space-32` | 128 | Expressive or luxury section spacing |

Tailwind v4 generates the whole scale from `--spacing: 0.25rem`, so `p-6` means 1.5rem (24px). Use spacing utilities or tokens only. Arbitrary values like `mt-[13px]` are drift.

## 2. Relationship-driven spacing

Spacing should say how related two things are. Use one tier per relationship:

| Relationship | Gap |
|---|---|
| Parts of one element (icon + label, label + input) | 4–8 |
| Items in a group (list items, fields in a fieldset) | 8–16 |
| Related groups within a section | 16–32 |
| Sections in an app | 32–48 |
| Sections on a marketing page | 64–128 (up to 160 on large expressive layouts) |

- **Headings bind down:** space above a heading is about 2× the space below it. Equal spacing makes a heading float between sections.
- Start generous, then tighten. Cramped layouts are harder to fix than airy ones.
- Vary spacing deliberately. The same gap everywhere ("monotonous spacing") erases hierarchy.
- Bottom padding of a section often needs to be optically larger than the top.
- Padding inside a bordered or filled container is ≥ 8px, typically 12–24px. Text never touches a container edge.

## 3. Grouping before containers

Reach for tools in this order:
1. **Proximity** (space)
2. **Alignment** (shared edges)
3. **Similarity** (same type style, same color)
4. **A divider** (1px, low contrast)
5. **A container** (surface change or card)

Use a card only when the group is a real object (a product, a project, a message) or when elevation means something (it can be dragged, it floats, it can be selected). Never nest cards; inside a card, use spacing and dividers. Borders show structure and shadows show depth, so don't use both for the same job.

## 4. Page grids

| Viewport | Columns | Gutter | Outer margin | Max content |
|---|---|---|---|---|
| Mobile (under about 600px) | 4 | 16px | 16–20px | 100% |
| Tablet (about 600–1024px) | 8 | 16–24px | 24–32px | 100% |
| Desktop (about 1024px+) | 12 | 24–32px | 32–80px | 1200–1440px |

- Prose stays at about 65ch inside the grid, even on a 12-column page. Put figures, notes, and asides in the other columns.
- Use CSS Grid with named areas or spans. Use `subgrid` to align card internals (titles, prices, CTAs) across a row.
- Use `gap` for sibling rhythm. Avoid `calc(33% - 1rem)` widths and margin hacks.
- Bento layouts: cells of **unequal** size that encode importance, one real artefact per cell, 16–24px gutters, nested radius obeyed, and exactly N cells for N items (no empty filler cells).
- For horizontal scrollers, let 16–32px of the next item peek, keep equal insets on both sides, and use scroll snap.

## 5. App shells

| Region | Default |
|---|---|
| Sidebar | 240–280px, collapsible to a 56–64px rail. Use it for 5 or more top-level areas |
| Top bar | 48–64px. Holds the title or breadcrumbs, search or command, and account |
| Content | Fluid. Dense views use their full width; forms and settings cap at about 640–720px |
| Inspector / detail panel | 320–400px. Collapses to a sheet or drawer on narrow screens |
| List–detail | List 280–400px + detail. Stacks as push navigation on mobile |

- Keep the header, sidebar, and primary actions in the same place on every page.
- Sticky headers need `scroll-padding-top` equal to their height, so focused and anchored elements are not hidden (WCAG 2.4.11).
- Keep a z-index scale: base, dropdown, sticky, overlay, modal, toast, tooltip. Don't use `9999`.

## 6. Control and component sizing

| Element | Desktop (dense / default / large) | Touch |
|---|---|---|
| Button, input, select height | 32 / 36 / 40px | ≥ 44px (iOS 44pt, Android 48dp) |
| Table row | 32 / 40 / 48–56px | ≥ 48px |
| Icon button | 28–32px visual, ≥ 24px hit area | 44–48px hit area |
| Gap between adjacent bordered controls | about 8–12px | ≥ 8px |

WCAG 2.5.8 (AA) requires targets of at least 24×24 CSS px, or enough spacing that 24px circles around them don't overlap. Expand small visuals with padding or a pseudo-element; the hit area does not need to match the visual size.

## 7. Responsive procedure

1. **Design at 360px first** with the real content.
2. **Widen the viewport slowly.** Where something breaks (lines too long, a card too wide, a nav that no longer fits), add a breakpoint *there*.
3. **Restructure, don't stretch:** 1 → 2 → 3 columns; drawer → sidebar; stacked rows → table; bottom sheet → popover. Keep the same information and functions at every size, and never hide core features on mobile.
4. **Name the breakpoints** by layout meaning, or map them to your framework's steps. Tailwind v4 defaults are sm 40rem (640), md 48rem (768), lg 64rem (1024), xl 80rem (1280), 2xl 96rem (1536). Most products need 2–4 of them.
5. **Declare the narrow fallback explicitly** for every multi-column layout: one column, full width, page margins. Remove overlaps and rotations on small screens, since they cause touch conflicts.
6. **Test at:** 320 (reflow floor), 360–390, 768, 1024, 1280–1440, and an ultra-wide or 50%-zoom view. Also test at 200% zoom and with a long translated string.

**Must pass**
- No two-dimensional scrolling at 320 CSS px wide (WCAG 1.4.10), except content that needs it, such as data tables, maps, and code.
- Nothing is lost at 200% zoom (WCAG 1.4.4).
- Don't mask horizontal overflow with `overflow-x: hidden` on page wrappers. Find the element that overflows.

## 8. Container queries vs media queries

| Use | Mechanism |
|---|---|
| Page shell: nav pattern, sidebar, number of page columns | Media queries (`min-width`) |
| Components that appear in several contexts: cards, media objects, tables that turn into lists, product tiles | Container size queries (`container-type: inline-size; @container (width > 30rem)`) |
| Type inside components | Container units (`cqi`) in `clamp()` |
| Variant switches driven by tokens | Container style queries (newly Baseline in 2026; check `web-platform`) |

```css
.card-list { container-type: inline-size; }
.card { display: grid; gap: var(--space-3); }
@container (width > 36rem) {
  .card { grid-template-columns: 12rem 1fr; }
}
```

## 9. Viewport, safe areas, and input

- Use `min-height: 100dvh` (or `svh` for layouts that must not jump). Avoid `100vh` on mobile.
- Use `viewport-fit=cover` with `env(safe-area-inset-*)` padding on fixed bars, for example `padding-bottom: max(1rem, env(safe-area-inset-bottom))`.
- Detect capability, not width: `@media (hover: hover) and (pointer: fine)` for hover effects, and `(pointer: coarse)` for larger targets.
- Keep primary mobile actions within thumb reach (the lower half of the screen), for example in a sticky bottom bar on long mobile flows.

## 10. Hierarchy checks

- **Squint test:** with the page blurred, you can still identify the primary element, 2–3 secondary elements, and the major groups in order.
- **One primary action per view.** Show 1–2 secondary actions, and put the rest in a menu. Aim for ≤ 4 visible choices per decision point.
- **Skeleton test:** replace the copy with grey bars. The structure alone should still communicate the page.
- **Alignment audit:** every element aligns to a grid line or a sibling's edge. Accidental 2–3px offsets are the most common "looks off" cause. Nudge icons and glyphs ±1px for *optical* alignment after rendering.

## Sources

- samber/cc-skills layout guidance (relationship-driven spacing, heading rhythm): https://github.com/samber/cc-skills
- Impeccable layout and craft floor (4px base, squint test, heading rhythm, no nested cards): https://github.com/pbakaus/impeccable
- Tailwind CSS v4 spacing and breakpoints: https://tailwindcss.com/docs/theme
- WCAG 2.2 (1.4.4, 1.4.10 Reflow, 2.4.11 Focus Not Obscured, 2.5.8 Target Size): https://www.w3.org/TR/WCAG22/
- Vercel Web Interface Guidelines (safe areas, optical alignment, let the browser size things): https://github.com/vercel-labs/web-interface-guidelines
- GoogleChrome modern-web-guidance (container queries, viewport units, responsive tables): https://github.com/GoogleChrome/modern-web-guidance
- Design System Checklist (units, grid, breakpoints, spacing): https://www.designsystemchecklist.com/
