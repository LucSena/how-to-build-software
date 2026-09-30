# Web Animation APIs Reference

Platform features for motion on the web, their Baseline status as of 2026-09, and the fallback each one needs. "Newly available" = in all core browsers; "widely available" = 30 months after that; "limited" = not in every engine, so progressive enhancement only.

## Contents
- Status table
- Entry and exit with @starting-style
- Popover and dialog animation
- View Transitions
- Scroll-driven animations
- WAAPI
- linear() springs
- Animating to height: auto
- Reduced motion for each API

## Status table

| Feature | Status (2026-09) | Use it for |
|---|---|---|
| CSS transitions / animations, individual transforms (`translate`, `scale`, `rotate`) | Widely | Everything basic |
| `linear()` easing | Widely (2023-12) | Spring approximations in pure CSS |
| `@starting-style` + `transition-behavior: allow-discrete` | Newly (2024-08-06) | Enter/exit from `display: none`, popovers, dialogs, inserted nodes |
| `@property` | Newly (2024-07) | Animating typed custom properties (gradient angles, colors) |
| View Transitions, same-document (`document.startViewTransition`) | Newly (2025-10-14) | SPA route changes, shared-element morphs, list reorder |
| `view-transition-class` | Newly (2025-10-14) | Styling groups of transitions at once |
| `:active-view-transition` | Newly (2026-01) | Styling the document during a transition |
| View Transitions, cross-document (`@view-transition { navigation: auto }`) | Limited: Chrome/Edge 126+, Safari 18.2+, not Firefox | MPA page transitions as enhancement |
| Scroll-driven animations (`animation-timeline: scroll()` / `view()`) | Limited: Chrome 115+, Safari 26; Firefox behind a flag | Scroll progress bars, reveal-on-scroll as enhancement |
| `interpolate-size: allow-keywords` / `calc-size()` | Limited: Chrome 129+ | Animating to `height: auto` as enhancement |
| `sibling-index()` / `sibling-count()` | Newly (2026-08-18) | Pure-CSS stagger delays |
| Web Animations API (`element.animate`) | Widely | Programmatic, interruptible, compositor-friendly animation |

## Entry and exit with @starting-style

```css
.panel {
  opacity: 1;
  translate: 0 0;
  transition: opacity 200ms var(--ease-out), translate 200ms var(--ease-out), display 200ms;
  transition-behavior: allow-discrete; /* separate declaration so old browsers keep the rest */
}
@starting-style { .panel { opacity: 0; translate: 0 8px; } }
.panel[hidden] { display: none; opacity: 0; translate: 0 8px; }
```

- `@starting-style` defines where an **entry** starts; the exit is the transition to the hidden state.
- Put `allow-discrete` in its own `transition-behavior` declaration: inside the `transition` shorthand it makes older browsers drop the whole declaration.
- `element.remove()` is instant: set the hidden state, await `element.getAnimations().map(a => a.finished)` (with a timeout failsafe), then remove.

## Popover and dialog animation

Top-layer elements must also transition `overlay`, or they leave the top layer before the exit finishes:

```css
.menu[popover] {
  transform-origin: top left;          /* the trigger side */
  transition: opacity 150ms var(--ease-out), scale 150ms var(--ease-out),
              display 150ms allow-discrete, overlay 150ms allow-discrete;
}
.menu[popover]:not(:popover-open) { opacity: 0; scale: 0.96; }
@starting-style { .menu[popover]:popover-open { opacity: 0; scale: 0.96; } }

dialog {
  transition: opacity 200ms var(--ease-out), scale 200ms var(--ease-out),
              display 200ms allow-discrete, overlay 200ms allow-discrete;
}
dialog:not([open]) { opacity: 0; scale: 0.96; }
@starting-style { dialog[open] { opacity: 0; scale: 0.96; } }
```

(Putting `allow-discrete` inside the shorthand is acceptable here only because losing the whole transition in old browsers is harmless: the element simply appears instantly.) Dialogs scale from center (≈0.96 → 1); popovers and menus scale from their trigger.

## View Transitions

Same-document (Baseline newly available):

```js
function navigate(update) {
  if (!document.startViewTransition) return update();
  document.startViewTransition(() => update());
}
```

```css
.product-image { view-transition-name: product-hero; } /* unique per page at any moment */
::view-transition-group(*) { animation-duration: 250ms; animation-timing-function: var(--ease-in-out); }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none; }
}
```

Cross-document (limited; harmless where unsupported):

```css
@view-transition { navigation: auto; }
```

Rules:
- Keep durations 200–300 ms; navigation must not feel slower than without the transition.
- Every `view-transition-name` must be unique among rendered elements at capture time; duplicate names abort the transition.
- Use for navigation-level changes and shared elements. Avoid for interaction-heavy UI that needs interruption (drag, typing), because the page is non-interactive during the transition.
- Move focus and update `document.title` after SPA navigation as usual; the transition does not do it.

## Scroll-driven animations

Limited support; always enhancement, always content-visible without it:

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
    @keyframes reveal { from { opacity: 0; translate: 0 24px; } }
  }
}

/* reading progress bar */
@supports (animation-timeline: scroll()) {
  .progress { transform-origin: left; animation: grow linear both; animation-timeline: scroll(root); }
  @keyframes grow { from { scale: 0 1; } }
}
```

- Never implement these with `scroll` event listeners or `scrollY`; use timelines, or IntersectionObserver for one-shot reveals.
- Use `linear` timing: scroll position already provides the easing.
- Parallax and scroll-jacking are vestibular triggers; disable under reduced motion and prefer none on product surfaces.

## WAAPI

JS control with compositor performance and no dependency:

```js
const anim = el.animate(
  [{ opacity: 0, transform: "scale(0.96)" }, { opacity: 1, transform: "scale(1)" }],
  { duration: 180, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "both" }
);
await anim.finished;
anim.reverse(); // interrupt and return
```

Use it when you need to await completion, reverse, or scrub, but not springs with velocity (use a library for those).

## linear() springs

`linear()` takes a list of output stops (optionally with percentages) and interpolates straight lines between them, so enough stops can approximate any curve, including a spring's overshoot:

```css
/* shape only: 0 → overshoot above 1 → settle at 1 */
--spring-approx: linear(0, 0.6 15%, 1.08 30%, 0.98 50%, 1.01 70%, 1);
```

Generate production values with a spring-to-linear() generator tool rather than by hand, and store them as a token. A CSS "spring" has a fixed duration and cannot inherit gesture velocity; use it only for non-interactive motion.

## Animating to height: auto

Default (works everywhere): the grid-rows technique.

```css
.collapsible { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 250ms var(--ease-in-out); }
.collapsible[data-open] { grid-template-rows: 1fr; }
.collapsible > .inner { overflow: hidden; }
```

Enhancement (limited): `:root { interpolate-size: allow-keywords; }` lets `height: 0 → auto` transition directly in supporting browsers. Height animation triggers layout every frame; keep it to small, isolated regions.

## Reduced motion for each API

| API | Reduced-motion behavior |
|---|---|
| Transitions/`@starting-style` | Remove `translate`/`scale`, keep opacity ≤ 200 ms |
| View Transitions | `animation: none` on the pseudo-elements, or a plain crossfade |
| Scroll-driven | Do not apply at all (wrap in `prefers-reduced-motion: no-preference`) |
| WAAPI / libraries | Branch keyframes on `matchMedia('(prefers-reduced-motion: reduce)').matches` |
| Autoplay video/loops | Poster frame, no autoplay; pause controls regardless (WCAG 2.2.2) |

## Sources

- GoogleChrome modern-web-guidance (Baseline dates; entry/exit, scroll effects, view transitions guides): https://github.com/GoogleChrome/modern-web-guidance
- web.dev, same-document view transitions Baseline: https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available
- Chrome, cross-document view transitions: https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
- web-features explorer, scroll-driven animations: https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations/
- Interop 2026: https://web.dev/blog/interop-2026
- ibelick ui-skills `fixing-motion-performance`: https://github.com/ibelick/ui-skills
- Emil Kowalski, animation standards (WAAPI, @starting-style): https://github.com/emilkowalski/skill
