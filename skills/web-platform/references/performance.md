# Web Performance Reference

How to measure and fix Core Web Vitals, with budgets and delivery rules for images, fonts, JavaScript, and third parties.

## Contents
- Thresholds and how they are judged
- Measurement setup
- LCP playbook
- INP playbook
- CLS playbook
- Images
- Fonts
- JavaScript and third parties
- Budgets
- Rules

## Thresholds and how they are judged

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5 s | ≤ 4.0 s | > 4.0 s |
| INP (Interaction to Next Paint) | ≤ 200 ms | ≤ 500 ms | > 500 ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

- Assessed at the **75th percentile** of real page loads, mobile and desktop separately (Chrome UX Report / Search Console).
- Supporting metrics: TTFB ≤ 0.8 s, FCP ≤ 1.8 s.
- Misinformation to ignore: "LCP is now 2.0 s" (not in the official library or docs as of 2026-09); FID (retired, replaced by INP in March 2024).

## Measurement setup

- **Field**: CrUX (PageSpeed Insights, Search Console) for public sites; the `web-vitals` library sending LCP/INP/CLS with attribution to your analytics for everything else. Break down by route and device class.
- **Lab**: Chrome DevTools Performance panel and Lighthouse with a mobile profile (4× CPU throttle, slow 4G). Disable extensions. Test on a real mid-range Android and in Safari (including iOS Low Power Mode) before calling it done.
- **CI**: Lighthouse CI or a synthetic tool with budgets per route; alert on regressions rather than chasing a score.
- Attribute before fixing: `web-vitals/attribution` reports the LCP element and its phase breakdown (TTFB, resource load delay, load time, render delay) and the INP interaction target and long-animation-frame script.

## LCP playbook

Work through the four phases in order:

1. **TTFB**: cache HTML at the edge/CDN; stream the response; avoid redirects; don't block the document on slow data (stream the rest).
2. **Resource load delay** (discovered late): the LCP image must be an `<img>` in the initial HTML, not a CSS background or rendered by client JS. Add `fetchpriority="high"`. Preload only if it truly cannot be in the HTML (`<link rel="preload" as="image" imagesrcset=… imagesizes=…>`).
3. **Resource load time**: right-size with `srcset`/`sizes`, AVIF/WebP, image CDN; `preconnect` to the image origin if different.
4. **Render delay**: render-blocking CSS (inline critical CSS, defer the rest), web fonts blocking text (use `swap`), client-side rendering of the hero (server-render it), hydration blocking paint.

Never `loading="lazy"` on the LCP candidate. Text LCP (headlines) depends mostly on CSS and font delivery.

## INP playbook

INP = input delay + processing time + presentation delay for the slow interactions.

- **Input delay**: the main thread was busy. Break up long tasks (> 50 ms), defer non-critical scripts, remove or delay third-party tags, avoid heavy work on page load.
- **Processing**: do the visible update first, then yield before non-urgent work:
  ```js
  async function onClick() {
    showPressedState();               // immediate visual feedback
    await (globalThis.scheduler?.yield?.() ?? new Promise(r => setTimeout(r)));
    doExpensiveWork();                // after the next paint
  }
  ```
  Debounce input-driven filtering (~150–300 ms), move parsing/sorting/crypto to Web Workers, memoize expensive renders, keep controlled-input updates cheap (or use uncontrolled inputs).
- **Presentation delay**: large DOM (virtualize lists > ~50–100 rows, `content-visibility: auto`), layout thrash (batch reads before writes), expensive style recalculation (avoid huge selectors on `:has()` over large subtrees; avoid animating inherited custom properties).
- Frameworks: React transitions (`startTransition`/`useDeferredValue`) keep typing responsive while results render.

## CLS playbook

- Every `<img>`, `<video>`, `<iframe>`: `width` + `height` attributes (or `aspect-ratio`), so space is reserved.
- Ads, embeds, cookie banners, late banners: reserve their slot or overlay them without pushing content.
- Fonts: metric-compatible fallbacks (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`, or `font-size-adjust: from-font`); frameworks such as `next/font` and tools such as Fontaine generate these.
- Don't insert content above what the user is reading unless in response to their action.
- Skeletons mirror the final layout dimensions exactly.
- `scrollbar-gutter: stable` where content toggles scrollbars.
- Animate `transform`, not `top`/`height` (transform-based motion does not count as layout shift).
- No font-weight change on hover/selection (text reflows).

## Images

| Decision | Default |
|---|---|
| Format | AVIF (Baseline 2024), WebP fallback; JPEG/PNG only as last fallback; SVG for icons/illustrations. JPEG XL: do not depend on it (Interop 2026 investigation only) |
| Sizing | `srcset` with width descriptors + accurate `sizes`; cap at 2× DPR; image CDN for on-the-fly resizing |
| Priority | `fetchpriority="high"` on the LCP image only (1–2 max); `fetchpriority="low"` for above-the-fold images hidden initially (carousel slides, menus) |
| Lazy | `loading="lazy"` for below-the-fold; never on the LCP image; never combined with `fetchpriority="high"` |
| Decoding | `decoding="async"` on non-critical images |
| Animation | `<video autoplay muted loop playsinline poster=…>` instead of GIF; paused under reduced motion |
| Decorative | CSS `image-set()` backgrounds, hidden from assistive tech |
| Quality | ~75–85 perceived quality for photos; check visually |

```html
<img src="/hero-1200.avif"
     srcset="/hero-800.avif 800w, /hero-1200.avif 1200w, /hero-1800.avif 1800w"
     sizes="(min-width: 64rem) 50vw, 100vw"
     width="1200" height="800" alt="Barista pouring latte art in the Lisbon shop"
     fetchpriority="high">
```

## Fonts

- Self-host WOFF2; prefer one **variable** font file per family over multiple static weights.
- Subset to the scripts you ship (`unicode-range` splits Latin, Latin-ext, Cyrillic…); limit variable axes you don't use.
- Preload only the 1–2 faces used above the fold:
  `<link rel="preload" href="/fonts/brand-var.woff2" as="font" type="font/woff2" crossorigin>`
- `font-display: swap` for brand/body text; `optional` for decorative or non-critical faces (no swap after first paint).
- Fallback metrics:
  ```css
  @font-face {
    font-family: "Brand Fallback";
    src: local("Arial");
    size-adjust: 104%; ascent-override: 92%; descent-override: 24%; line-gap-override: 0%;
  }
  body { font-family: "Brand", "Brand Fallback", system-ui, sans-serif; }
  ```
  (Compute the percentages with a tool for your actual font; the values above are placeholders.)
- Budget: ≤ ~100 KB of font transfer on first view; two families at most for most products.
- Do not load Google Fonts via a `<link>` to the third-party CSS in production: it adds a connection and a render-blocking stylesheet; download and self-host (check the license).

## JavaScript and third parties

- Default to server-rendered or static HTML for content; hydrate only interactive islands.
- Code-split per route and per heavy component (editors, charts, maps); lazy-load below-the-fold widgets on visibility.
- Audit dependencies: bundle analyzer on every major dependency addition; prefer platform APIs (see `modern-css.md`).
- Third-party scripts (analytics, tag managers, chat, A/B testing, session replay): load `async`/`defer`, after consent where required, and delay non-essential ones until idle or first interaction; use facades for heavy embeds (video players, chat) that load on click.
- Speculation Rules (Chromium) can prerender likely next pages; treat as enhancement.
- Network budget for mutations: POST/PATCH/DELETE should complete in < 500 ms; use optimistic UI where success is likely.

## Budgets

Starting heuristics (compressed transfer, critical path of the initial route). Tighten when field data is not green.

| Asset | Content/marketing | App initial route |
|---|---|---|
| JavaScript | ≤ ~150–200 KB (ideally near 0) | ≤ ~300–400 KB |
| CSS | ≤ ~50 KB | ≤ ~100 KB |
| Fonts | ≤ ~100 KB | ≤ ~100 KB |
| LCP image | ≤ ~150–200 KB at the served size | n/a |
| Third-party requests before interaction | as few as possible; none blocking render | same |

## Rules

### Fix the phase, not the symptom
**Rule.** Attribute LCP to TTFB, load delay, load time, or render delay, and INP to input delay, processing, or presentation delay, before changing code.
**Apply when.** Any Core Web Vitals regression.
**Do / Avoid.** Do read `web-vitals` attribution first. Avoid adding preloads everywhere hoping LCP improves.
**Why.** Each phase has different fixes; untargeted changes (extra preloads) often compete for bandwidth and make things worse (critical-path contention).

### Give feedback before doing work
**Rule.** In event handlers, paint the visible response first, then yield, then compute.
**Apply when.** Any handler that does more than a trivial update.
**Do / Avoid.** Do toggle the pressed/loading state then `await scheduler.yield()`. Avoid filtering 10,000 rows synchronously on keypress.
**Why.** INP measures time to the next paint; a quick visual response inside 100 ms feels instant (Doherty threshold, NN/g response-time limits).

## Sources

- web-vitals library (thresholds, attribution): https://github.com/GoogleChrome/web-vitals
- web.dev, Web Vitals: https://web.dev/articles/vitals ; thresholds rationale: https://web.dev/articles/defining-core-web-vitals-thresholds
- GoogleChrome modern-web-guidance (image priority, font fallbacks, INP causes): https://github.com/GoogleChrome/modern-web-guidance
- Vercel Web Interface Guidelines (performance section): https://github.com/vercel-labs/web-interface-guidelines
- NN/g, Response Times: The 3 Important Limits: https://www.nngroup.com/articles/response-times-3-important-limits/
