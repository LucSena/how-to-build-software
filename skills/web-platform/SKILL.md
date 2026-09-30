---
name: web-platform
description: Use when implementing or reviewing the web-platform layer of a site or web app — which modern CSS features are safe to use in 2026 (Baseline status for container queries, :has, @layer, subgrid, nesting, view transitions, anchor positioning, popover, @starting-style, light-dark, oklch, field-sizing and more), Core Web Vitals (LCP, INP, CLS) and how to fix them, images, fonts, JavaScript budgets, metadata/SEO/Open Graph basics, internationalization and RTL with logical properties, dark mode without a flash, and progressive enhancement. Also use when the user says "the site is slow", "Lighthouse score is bad", "can I use this CSS?", "add dark mode", "support Arabic/RTL", "fix layout shift", or "the share preview is broken". Not for rendering strategy, state, or routing architecture; use frontend-architecture. Not for visual direction or tokens; use design-foundations or design-systems.
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "frontend-architecture accessibility motion-design design-foundations design-systems"
---

# Web Platform

The browser now ships much of what used to need libraries: popovers, dialogs, anchored positioning, container-aware components, view transitions, perceptual color, and theme switching. This skill keeps you on the right side of browser support (use Baseline features freely, enhance with the rest), makes pages fast by the metrics users and search engines measure, and gets the unglamorous layer right: fonts, images, metadata, RTL, and dark mode.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also establish the **browser support policy** (default: Baseline widely available, plus newly available features with a graceful fallback) and whether real-user performance data exists (CrUX, RUM, analytics). Decisions differ when a large share of traffic is on old Android devices or in-app browsers.

## Core principles

1. **Baseline decides, not novelty.** Widely available: use freely. Newly available: use with a fallback that still works. Limited: progressive enhancement only, behind `@supports` or feature detection.
2. **Platform primitives before libraries.** `<dialog>`, popover, anchor positioning, `:has()`, container queries, and View Transitions replace JS you would otherwise ship, test, and patch.
3. **Measure the field at p75.** Core Web Vitals are judged on real users at the 75th percentile, mobile and desktop separately; lab scores are for debugging.
4. **Ship less JavaScript.** It is the main cause of poor INP and a major cause of slow LCP; HTML and CSS are cheap and resilient.
5. **The baseline experience works without the enhancement.** Content visible without JS, forms that submit, links that navigate.
6. **Write direction-agnostic, locale-aware code from day one.** Logical properties and `Intl` cost nothing up front and a rewrite later.

## Workflow

- [ ] **Establish targets**: support policy, CWV targets (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75), JS budget for the route type, locales/scripts.
- [ ] **Choose features** from the status table below (full table in `references/modern-css.md`); note the fallback for anything not widely available.
- [ ] **Build** with semantic HTML, platform primitives, logical properties, tokens that support light and dark.
- [ ] **Measure**: Lighthouse/DevTools performance panel with 4× CPU and slow 4G throttling on a mid-range Android profile; `web-vitals` in the field if available.
- [ ] **Fix** the largest bottleneck first (LCP element, long tasks, unsized media), re-measure, repeat.
- [ ] **Verify**: no-JS render, RTL (`dir="rtl"`), dark mode first paint (no flash), 200% zoom, metadata on a real URL, older-browser fallback path.
- [ ] Re-check against Gotchas; fix and repeat until clean.

## Modern CSS: what to use (as of 2026-09)

**Use freely (Baseline widely available, or newly available with harmless fallback):**

| Feature | Status | Replaces |
|---|---|---|
| Container size queries + `cqi` units | Widely (2023-02) | Component media-query hacks, ResizeObserver |
| `:has()` | Widely (2023-12) | JS state classes on parents |
| Cascade layers `@layer` | Widely (2022-03) | Specificity wars with resets/utilities |
| Subgrid | Widely (2023-09) | Manual alignment of card internals |
| CSS nesting | Widely | Preprocessor nesting |
| `oklch()`, `color-mix()` | Widely (2023) | HSL palettes, Sass color functions |
| `dvh`/`svh`/`lvh` | Widely (2022-12) | `100vh` mobile bugs |
| `:user-valid` / `:user-invalid` | Widely (2023-11) | JS "touched" tracking for validation styling |
| `inert`, `<dialog>` | Widely | Focus-trap libraries |
| Popover API | Newly (2025-01) | Custom dropdown/tooltip shells |
| `@starting-style` | Newly (2024-08) | JS mount flags for enter animations |
| `light-dark()`, relative color syntax | Newly (2024-05 / 2024-09) | Duplicated dark-mode rules |
| `text-wrap: balance` | Newly (2024-05) | Manual `<br>` in headings |
| View Transitions (same-document) | Newly (2025-10) | Route-animation libraries |
| `field-sizing: content` | Newly (2026-06) | Autosize-textarea libraries |
| `contrast-color()` | Newly (2026-04) | Computing black/white text in JS (keep a fallback) |
| Container style queries | Newly (2026-05) | Variant classes driven by custom properties |

**Progressive enhancement only (limited or not yet in all engines):** scroll-driven animations (not in Firefox stable), cross-document View Transitions (not Firefox), `interpolate-size`/`calc-size()` (Chromium), customizable `<select>` (`appearance: base-select`), `popover="hint"`/`interestfor`, scroll-state container queries, typed `attr()`, `text-wrap: pretty` (harmless no-op where missing), `corner-shape`. **Anchor positioning** shipped in every engine by January 2026 (Firefox 147) but older versions are still in use; feature-detect with `@supports (anchor-name: --a)` and keep a sensible default position.

Snippets, fallbacks, and the rest of the table: `references/modern-css.md`.

## Core Web Vitals

| Metric | Good | Poor | Measures |
|---|---|---|---|
| LCP | ≤ 2.5 s | > 4.0 s | When the largest content element rendered |
| INP | ≤ 200 ms | > 500 ms | Latency of the slowest-ish interactions across the visit |
| CLS | ≤ 0.1 | > 0.25 | Unexpected layout movement |

Thresholds apply at **p75 of page loads**, mobile and desktop separately. They have not changed: claims that LCP was tightened to 2.0 s are wrong (the web-vitals library and web.dev still use 2.5 s), though 2.0 s is a useful internal target for headroom. INP replaced FID in March 2024.

| Symptom | Usual cause | Fix |
|---|---|---|
| Slow LCP | Hero image lazy-loaded, discovered late (CSS background, JS-rendered), or too large; slow TTFB; render-blocking CSS/fonts | `<img>` in the initial HTML with `fetchpriority="high"`, explicit `width`/`height`, no `loading="lazy"`; right-sized AVIF/WebP via `srcset`/`sizes`; server-render the hero; inline critical CSS; `preconnect` to critical origins |
| Poor INP | Long tasks (> 50 ms) in event handlers; heavy re-renders; third-party scripts; layout thrash | Update the UI first, then yield (`scheduler.yield()` with a `setTimeout` fallback); split work; move computation to a worker; debounce input handlers; defer third parties until idle/interaction; virtualize long lists |
| High CLS | Unsized images/embeds/ads; web fonts swapping with different metrics; content injected above existing content; skeletons that do not match | `width`/`height` or `aspect-ratio` on media; reserved slots; `font-size-adjust: from-font` or metric overrides; insert below the fold or on user action; skeletons that mirror final layout; `scrollbar-gutter: stable` |

Budgets, measurement setup, image/font/JS details: `references/performance.md`.

## Images and fonts (defaults)

- **Images**: AVIF first, WebP fallback (`<picture>` or an image CDN with content negotiation); `srcset` + accurate `sizes`; cap at 2× DPR; `loading="lazy"` + `decoding="async"` below the fold; exactly one or two `fetchpriority="high"` images (the LCP candidate); SVG for icons; `<video autoplay muted loop playsinline>` instead of GIFs.
- **Fonts**: self-host WOFF2 variable fonts, subset to the scripts you ship (`unicode-range`), preload only the 1–2 faces used above the fold, `font-display: swap` for brand text (`optional` for non-critical), metric-matched fallbacks (`size-adjust`, `ascent-override`, `descent-override`, or `font-size-adjust: from-font`). Aim for ≤ ~100 KB of font transfer on first view.

## JavaScript budgets (heuristics, compressed)

| Route type | Critical-path JS |
|---|---|
| Content/marketing page | ≤ ~150–200 KB, ideally near zero via static rendering, server components, or islands |
| App initial route | ≤ ~300–400 KB; everything else code-split per route |
| CSS | ≤ ~50–100 KB |

These are starting heuristics, not standards; tighten them if field INP/LCP are not green. Third-party tags (analytics, chat, A/B testing) are the usual budget breakers.

## Metadata and SEO basics

Every page: unique `<title>` and meta description, `<html lang>`, canonical URL, `og:title`/`og:description`/`og:image` (absolute URL) and `og:url` equal to the canonical, `twitter:card="summary_large_image"`, favicon + `apple-touch-icon`, `theme-color` per scheme. Staging and previews get `noindex`. JSON-LD only when it mirrors visible content — never invented ratings, prices, or reviews. One metadata source per page (no duplicate tags from competing systems). Details and templates: `references/metadata.md`.

## Internationalization and RTL

- Logical properties everywhere: `margin-inline-start`, `padding-block`, `inset-inline-end`, `text-align: start`, `border-start-start-radius`. Set `dir` on `<html>`; `dir="auto"` on user-generated text.
- Mirror directional icons (arrows, chevrons, back, progress direction); do not mirror logos, media play buttons, clocks, or checkmarks.
- Leave room for 30–40% text expansion (more for short strings); no fixed-width buttons.
- Format with `Intl` (`NumberFormat`, `DateTimeFormat`, `RelativeTimeFormat`, `ListFormat`, `PluralRules`); pick the locale from language settings (`Accept-Language`, `navigator.languages`), never IP.
- Full message strings with ICU plurals; never concatenate fragments.

Details: `references/i18n-rtl.md`.

## Dark mode without a flash

```html
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111111">
<script>
  /* inline, in <head>, before any stylesheet-dependent paint */
  try {
    const t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  } catch {}
</script>
```

```css
:root { color-scheme: light dark; }
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
:root {
  --bg: light-dark(oklch(0.99 0.003 250), oklch(0.17 0.01 250));
  --fg: light-dark(oklch(0.22 0.01 250), oklch(0.95 0.005 250));
}
body { background: var(--bg); color: var(--fg); }
```

- `color-scheme` on `:root` (not `body`) themes scrollbars, form controls, and the initial canvas; `light-dark()` follows the computed `color-scheme`, so a toggle only flips `color-scheme`.
- Default to the system preference; persist only an explicit user override. Server-render the theme attribute when you have it in a cookie.
- Disable transitions during the swap (add a class that sets `transition: none` for one frame).
- Design the dark palette (elevation = lighter surfaces, desaturated accents); never invert. Re-check contrast in both themes. Set explicit `background-color` and `color` on native `<select>`.

## Progressive enhancement

- Content and navigation work with HTML alone; JS adds behavior. Never ship content at `opacity: 0` waiting for a script.
- Forms are real `<form>` elements that submit without JS; enhance with client validation and optimistic updates.
- Links are `<a href>`; state that matters lives in the URL (filters, tabs, pagination).
- Feature-detect (`@supports`, `CSS.supports()`, `'startViewTransition' in document`), never user-agent sniff.
- Respect user preferences: `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`, `forced-colors`.

## Gotchas

- **Using a limited feature as if it were Baseline.** Scroll-driven animations, cross-document view transitions, `interpolate-size`, and customizable `<select>` still need fallbacks in 2026-09.
- **Lazy-loading the LCP image** or loading it as a CSS background / via JS. It gets discovered late and deprioritized.
- **`fetchpriority="high"` on many images.** It dilutes the boost; use it on one or two.
- **Images without `width`/`height`** (or `aspect-ratio`). Guaranteed CLS.
- **Quoting a 2.0 s LCP threshold** or FID. Good LCP is ≤ 2.5 s; INP replaced FID.
- **Optimizing the Lighthouse number instead of field data.** A lab 100 can coexist with poor p75 INP from real devices and third-party scripts.
- **`100vh` for full-height mobile layouts.** Use `100dvh` for app shells, `100svh` for heroes.
- **Physical properties in new CSS** (`margin-left`, `left`, `text-align: left`). They break RTL.
- **Theme flash on load** from reading the theme in a framework effect. Set it in an inline head script or on the server.
- **`color-scheme` set on `body`.** Root scrollbars and the canvas stay light.
- **Google Fonts `<link>` in production, preloading every weight, or `font-display: block`.** Self-host, subset, preload one or two, swap.
- **Duplicate or conflicting meta tags** from a layout and a page both setting titles/canonicals.
- **Invented structured data** (ratings, review counts). It is a policy violation and misleading.
- **`overflow-x: hidden` on `body`/`main` to hide horizontal scroll.** It masks the real overflow bug and breaks `position: sticky`.
- **Disabling zoom** (`maximum-scale=1`, `user-scalable=no`) to stop iOS input zoom. Set inputs to 16 px instead.

## Output format

For builds: code plus a short **Platform notes** block — features used with their Baseline status and fallback, performance-relevant decisions (LCP element, font strategy, JS added), and what was verified.

For reviews/performance work:

```
Targets: LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1 (p75)   Data: <field source or "lab only: Lighthouse mobile, 4× CPU">
| Sev | Metric/Area | Location | Evidence | Fix | Expected impact |
Baseline check: <features used → status → fallback present? yes/no>
Not checked: <e.g. field data unavailable, Safari not tested>
```

## References

| File | Read when |
|---|---|
| `references/modern-css.md` | Choosing a CSS feature, writing its fallback, or replacing a JS library with a platform primitive |
| `references/performance.md` | Fixing LCP/INP/CLS, setting budgets, optimizing images/fonts/third parties, or setting up measurement |
| `references/i18n-rtl.md` | Adding a locale, supporting RTL or CJK, formatting numbers/dates, or auditing hardcoded strings |
| `references/metadata.md` | Adding or fixing titles, canonical URLs, Open Graph/Twitter cards, icons, robots, hreflang, or JSON-LD |

## Related skills

- `frontend-architecture` — rendering strategy (SSR/SSG/RSC), data fetching, and i18n plumbing behind these pages.
- `accessibility` — semantics, focus, and contrast requirements for the primitives used here.
- `motion-design` — view transitions, scroll-driven animations, and `@starting-style` motion details.
- `design-foundations` — color, type, and dark-mode palette decisions.
- `design-systems` — turning `light-dark()` and OKLCH values into a token system.
