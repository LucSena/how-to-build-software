# Modern CSS and Platform Features (status as of 2026-09)

Baseline terms: **Newly available** = supported in all core browsers (Chrome, Edge, Firefox, Safari); **Widely available** = 30 months after that; **Limited** = missing from at least one engine. Dates are when a feature became Baseline newly available, from the web-features data used by GoogleChrome/modern-web-guidance (checked 2026-09). Re-check anything marked Limited before relying on it; support moves every release.

## Contents
- Status table
- Use-it-this-way snippets
- Replace-the-library table
- Feature detection patterns
- Rules

## Status table

| Feature | Status | Notes / fallback |
|---|---|---|
| Container size queries, `cqi`/`cqb` units | Widely (2023-02-14) | `container-type: inline-size` on the wrapper |
| Container style queries | Newly (2026-05-19) | Fallback: variant class |
| Container scroll-state queries | Limited (Chromium 133+) | Stuck headers, snapped items; enhancement |
| `:has()` | Widely (2023-12-19) | Parent/sibling state styling |
| Cascade layers | Widely (2022-03-14) | Declare order once at the top |
| Subgrid | Widely (2023-09-15) | Aligned card internals across a row |
| CSS nesting | Widely | Keep nesting shallow (≤ 3 levels) |
| `oklch()` / `oklab()` | Widely (2023) | Author palettes here; browsers gamut-map |
| `color-mix()` | Widely (2023) | Tints, alpha variants, hover states |
| Relative color syntax | Newly (2024-09-16) | `oklch(from var(--c) calc(l - .05) c h)` |
| `light-dark()` | Newly (2024-05-13) | Requires `color-scheme` |
| `contrast-color()` | Newly (2026-04-10) | Returns black or white; keep an explicit fallback token |
| `@property` | Newly (2024-07-09) | Typed, animatable custom properties |
| `@starting-style` + `transition-behavior: allow-discrete` | Newly (2024-08-06) | Enter/exit from `display: none` |
| Popover API | Newly (2025-01-27) | `popover`, `popovertarget`; top layer + light dismiss |
| Invoker commands (`commandfor`/`command`) | Newly (2025-12-12) | Open dialogs/popovers without JS |
| `<dialog>` | Widely | `showModal()`; `closedby` is newer (check) |
| `popover="hint"` + `interestfor` | Limited | Declarative hover/focus tooltips; enhancement |
| Anchor positioning | In all engines since Firefox 147 (2026-01); older versions still in use | `@supports (anchor-name: --a)`; fallback position or `@oddbird/css-anchor-positioning` polyfill |
| View Transitions, same-document | Newly (2025-10-14) | `document.startViewTransition` |
| `view-transition-class` | Newly (2025-10-14) | |
| View Transitions, cross-document | Limited (Chromium 126+, Safari 18.2+; not Firefox) | `@view-transition { navigation: auto; }` harmless elsewhere |
| Scroll-driven animations | Limited (Chromium 115+, Safari 26; Firefox behind a flag) | `@supports (animation-timeline: view())` |
| `text-wrap: balance` | Newly (2024-05-13) | Headings only (limited line count, costs layout) |
| `text-wrap: pretty` | Limited (Chromium 117+, Safari 26) | Paragraphs; no-op elsewhere |
| `field-sizing: content` | Newly (2026-06-16) | Auto-growing inputs/textareas |
| `interpolate-size` / `calc-size()` | Limited (Chromium 129+) | Animate to `height: auto`; fallback grid-rows trick |
| Customizable `<select>` (`appearance: base-select`) | Limited (Chromium 135+, Safari 27) | Native select remains the fallback |
| `sibling-index()` / `sibling-count()` | Newly (2026-08-18) | Pure-CSS stagger |
| Typed `attr()` | Limited | Enhancement |
| `linear()` easing | Widely (2023-12-11) | Spring-like curves |
| Individual transforms (`translate`, `scale`, `rotate`) | Widely | Compose without overwriting `transform` |
| `font-size-adjust: from-font` | Newly (2024-07-25) | Stable fallback font metrics |
| `content-visibility: auto` | Newly (2025-09-15) | Skip rendering off-screen sections; pair with `contain-intrinsic-size` |
| `scrollbar-gutter`, `scrollbar-color`, `scrollbar-width` | Newly (2024-12 / 2025-12) | `scrollbar-gutter: stable` prevents shift |
| `inert` | Widely (2023-04-11) | Background behind custom overlays |
| `:user-valid` / `:user-invalid` | Widely (2023-11-02) | Validation styles after interaction |
| `dvh` / `svh` / `lvh` | Widely (2022-12-05) | Mobile viewport heights |
| Navigation API | Newly (2026-01-13) | SPA routing primitive |
| Custom highlights `::highlight()` | Newly (2026-03-24) | Search-hit highlighting without wrapping DOM |
| `Intl.DurationFormat` | Newly | Durations like "1 hr 5 min" |
| `shape()`, `corner-shape` | Limited / emerging | Enhancement only |

**Interop 2026 focus areas** (improving through 2026): anchor positioning, advanced `attr()`, container style queries, `contrast-color()`, dialog and popover additions, scroll-driven animations, scroll snap, `shape()`, View Transitions including cross-document, Navigation API.

## Use-it-this-way snippets

### Layer order
```css
@layer reset, tokens, base, components, utilities, overrides;
```

### Container queries for components, media queries for page shells
```css
.card-list { container-type: inline-size; }
@container (width > 40rem) { .card { grid-template-columns: 12rem 1fr; } }
.card h3 { font-size: clamp(1rem, 0.9rem + 1.5cqi, 1.5rem); }
```

### :has() for parent state
```css
form:has(:user-invalid) .submit-hint { display: block; }
.field:has(input:focus-visible) { outline: 2px solid var(--ring); }
li:has(> input:checked) { background: var(--bg-selected); }
```

### Subgrid-aligned cards
```css
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 1.5rem; }
.card { display: grid; grid-row: span 3; grid-template-rows: subgrid; } /* title / body / footer align across the row */
```

### Popover menu anchored to its button (with fallback)
```html
<button popovertarget="menu" class="menu-btn">Options</button>
<div id="menu" popover class="menu">…</div>
```
```css
.menu { margin: 0; } /* default: UA centers popovers; acceptable fallback */
@supports (anchor-name: --a) {
  .menu-btn { anchor-name: --menu-btn; }
  .menu {
    position-anchor: --menu-btn;
    position-area: block-end span-inline-end;
    margin-top: 4px;
    position-try-fallbacks: flip-block, flip-inline;
  }
}
```

### Dialog opened without JS
```html
<button commandfor="confirm" command="show-modal">Delete…</button>
<dialog id="confirm" aria-labelledby="confirm-title">…</dialog>
```

### Auto-growing textarea
```css
textarea { field-sizing: content; min-block-size: 3lh; max-block-size: 12lh; }
```

### Palette derivation in OKLCH
```css
:root {
  --accent: oklch(0.62 0.17 40);
  --accent-hover: oklch(from var(--accent) calc(l - 0.05) c h);
  --accent-subtle: color-mix(in oklch, var(--accent) 15%, transparent);
  --on-accent: white;                      /* fallback */
}
@supports (color: contrast-color(red)) {
  :root { --on-accent: contrast-color(var(--accent)); }
}
```

### Text wrapping
```css
h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }
```

### Rendering cost of long pages
```css
.feed-section { content-visibility: auto; contain-intrinsic-size: auto 800px; }
```

## Replace-the-library table

| Instead of | Use | Keep the library when |
|---|---|---|
| Floating UI / Popper for simple menus | Popover + anchor positioning | You need complex collision logic across old browsers |
| Focus-trap modal libraries | `<dialog>` + `showModal()` | You need nested/stacked overlay management |
| Autosize textarea | `field-sizing: content` | You support browsers before 2026 without fallback tolerance |
| Route-transition libraries | View Transitions (same-document) | You need gesture-driven, interruptible transitions |
| JS scroll listeners for progress/reveal | Scroll-driven animations (enhancement) or IntersectionObserver | Firefox must have the effect (use IO) |
| Color manipulation libraries | OKLCH + relative color syntax + `color-mix()` | Build-time palette generation for native platforms |
| Parent-state JS (`.is-invalid` on wrappers) | `:has()` + `:user-invalid` | — |

## Feature detection patterns

```css
@supports (animation-timeline: view()) { … }
@supports (anchor-name: --a) { … }
@supports selector(:has(a)) { … }
@supports (field-sizing: content) { … }
```
```js
if ("startViewTransition" in document) { … }
if (CSS.supports("transition-behavior", "allow-discrete")) { … }
if (HTMLElement.prototype.hasOwnProperty("popover")) { … }
```

## Rules

### Pair every newly-available feature with a fallback that still works
**Rule.** The page must remain usable, not identical, where the feature is missing.
**Apply when.** Using anything not widely available.
**Do / Avoid.** Do let a popover fall back to the UA-centered position. Avoid layouts that collapse without `anchor-name` or content hidden until a scroll timeline runs.
**Why.** Baseline "newly" still excludes users on older OS versions and in-app browsers that update slowly (progressive enhancement).

### Prefer the platform primitive over a dependency
**Rule.** Reach for `<dialog>`, popover, `:has()`, container queries, and View Transitions before adding a library.
**Apply when.** A UI need matches a primitive in the table above.
**Do / Avoid.** Do use `popover` for a user menu. Avoid adding a positioning library for one dropdown.
**Why.** Primitives are accessible by default, cost zero bytes, and get faster with browser releases; libraries add bundle weight and upgrade debt (innovation budget).

## Sources

- GoogleChrome modern-web-guidance (Baseline dates, per-feature guides): https://github.com/GoogleChrome/modern-web-guidance
- web-features explorer: https://web-platform-dx.github.io/web-features-explorer/
- Baseline definition: https://web.dev/baseline
- Interop 2026: https://web.dev/blog/interop-2026 ; https://webkit.org/blog/17818/announcing-interop-2026/
- Anchor positioning update (Firefox 147): https://www.oddbird.net/2025/10/13/anchor-position-area-update/
- Same-document View Transitions Baseline: https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available
- Cross-document View Transitions: https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
