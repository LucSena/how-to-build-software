# Motion Review Checklist

Use this to audit existing animations or a PR that touches motion. Report every finding as **Before | After | Why** with a file:line or a described screen region, and label each item Observed (seen in code or running UI), Inferred (likely from code, not seen running), or Not checked.

## Contents
- How to run the review
- Code signatures to grep for
- Checklist by category
- Severity guide
- Example findings

## How to run the review

1. **List every animation** in scope: CSS `transition`/`animation`, `@keyframes`, `element.animate`, library calls (`motion.`, `animate(`, `gsap.`, `useSpring`, `withSpring`, `withTiming`), and view transitions.
2. **Classify each** by trigger (pointer/keyboard/system/scroll) and frequency (see the frequency table in SKILL.md).
3. **Run it**: slow-motion at 5–10× (DevTools Animations panel), interrupt it mid-flight, toggle it rapidly, turn on reduced motion (DevTools rendering emulation or OS setting), and profile with 4–6× CPU throttling.
4. **Test gestures on real touch hardware**; emulation misses tap delay, sticky hover, rubber-banding, and gesture conflicts with page scroll.
5. **Write findings** ordered by severity; cap P3 noise.

## Code signatures to grep for

| Pattern | Likely problem |
|---|---|
| `transition: all` / `transition-all` | Animates layout properties, unpredictable cost |
| `ease-in` on an entrance, `ease-in` without `-out` | Delayed first frames |
| `scale(0)` / `scale: 0` in a `from` or `@starting-style` | Pop from nothing |
| `transition` on `width`, `height`, `top`, `left`, `margin`, `padding` | Layout every frame |
| `box-shadow` inside a transition or keyframe | Paint every frame |
| `filter: blur(` / `backdrop-filter` animated | Expensive paint, worse on Safari and low-end GPUs |
| `addEventListener('scroll'` / `onScroll` driving styles | Main-thread scroll-linked animation |
| `will-change` in a base (non-active) rule | Permanent layer promotion, memory cost |
| `transition-duration: 0.01ms !important` under reduced motion | Global kill switch |
| `@keyframes` on toasts, toggles, or other re-triggered UI | Restarts instead of retargeting |
| `:hover` with transform outside a `(hover: hover)` query | Sticky hover on touch |
| `setState`/`useState` updated per animation frame | Re-render per frame |
| `infinite` animations on non-live content | Idle motion; also needs pause (WCAG 2.2.2 if > 5 s) |
| `opacity: 0` initial state waiting on JS/IntersectionObserver | Content hidden at rest |

## Checklist by category

**Necessity**
- [ ] No animation on keyboard-initiated or 100×/day actions.
- [ ] Every animation has a stated purpose (spatial, state, feedback, continuity, explanation).
- [ ] At most one orchestrated/authored moment per screen; no fade-up on every section.
- [ ] No idle loops on static content.

**Easing and timing**
- [ ] Entrances use ease-out (custom curve), never ease-in.
- [ ] On-screen moves use ease-in-out; constant motion uses linear.
- [ ] UI durations ≤ 300 ms (sheets up to ~500 ms); exits shorter than entrances.
- [ ] Similar elements share one curve/duration token.
- [ ] Stagger 30–80 ms per item, total ≤ ~500 ms, never blocking input.

**Physicality**
- [ ] No `scale(0)` starts; popovers scale from the trigger; modals from center.
- [ ] Press feedback 0.95–0.98 scale on pointer-down.
- [ ] Enter and exit follow the same path.
- [ ] Springs critically damped unless the gesture carried momentum; no overshoot on opacity/color.

**Interruptibility and gestures**
- [ ] Every animation can be interrupted and reversed; input never locked during a transition.
- [ ] Re-triggerable UI uses transitions or springs, not keyframes.
- [ ] Drag tracks 1:1, uses pointer capture, dismisses on velocity, rubber-bands at edges.
- [ ] `pointercancel` / lost capture reset state; next drag works.
- [ ] Drag actions have a non-drag alternative (WCAG 2.5.7).

**Accessibility**
- [ ] Reduced-motion variant exists and keeps opacity/color feedback; no global kill switch.
- [ ] Parallax, scroll-linked motion, and autoplay loops are off under reduced motion.
- [ ] Anything moving > 5 s has pause/stop/hide; nothing flashes > 3 times per second.
- [ ] Hover motion gated behind `(hover: hover) and (pointer: fine)`.
- [ ] Content is visible without JavaScript or before reveal scripts run.

**Performance**
- [ ] Only `transform`/`opacity` animated on anything large or long-running.
- [ ] No layout reads inside animation loops; reads batched before writes.
- [ ] `will-change` scoped to active animations only.
- [ ] Animated blur ≤ 8 px, one-shot, small elements only.
- [ ] Off-screen loops paused; long lists virtualized.
- [ ] No mixed animation systems on the same element tree.
- [ ] Holds 60 fps (or the display's refresh rate) with 4× CPU throttle on the main flows.

**Platform**
- [ ] iOS/Android use system navigation and sheet transitions; custom motion honors Reduce Motion / Remove animations.
- [ ] React Native gesture animations run on the UI thread.

## Severity guide

| Severity | Motion examples |
|---|---|
| P0 Blocking | Content hidden at rest when JS fails; input locked by an animation; flashing > 3/s; drag-only action with no alternative on a primary task |
| P1 Major | No reduced-motion handling for large movement or parallax; animation on keyboard/high-frequency actions; visible jank on a primary flow; autoplay > 5 s with no pause |
| P2 Minor | ease-in entrances; durations > 300 ms on UI; `transition: all`; `scale(0)` starts; keyframes on re-triggered UI; inconsistent curves |
| P3 Polish | Wrong `transform-origin` on a popover; stagger slightly long; exit same speed as enter |

## Example findings

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| P1 | `CommandPalette.tsx:42` (Observed) | `<motion.div initial={{ opacity: 0, scale: 0.9 }} ...>` on ⌘K open | Render instantly; no animation | Opened dozens of times a day from the keyboard; motion makes it feel slow |
| P1 | `globals.css:88` (Observed) | `@media (prefers-reduced-motion) { * { transition-duration: .01ms !important } }` | Per-component reduced variants: drop `translate`/`scale`, keep ≤ 200 ms opacity | Kill switch removes state feedback and breaks JS springs |
| P2 | `Toast.css:12` (Observed) | `animation: slideIn 400ms ease-in` | `transition: transform 250ms var(--ease-out), opacity 250ms var(--ease-out)` with `@starting-style` | ease-in delays the visible response; keyframes restart when toasts stack |
| P2 | Settings drawer, mobile (Inferred) | Dismiss only past 50% drag | Also dismiss when velocity > ~0.11 px/ms | Flicks feel ignored |
| P3 | `Popover.css:5` (Observed) | `transform-origin: center` | `transform-origin: var(--transform-origin)` | Should grow from its trigger |

## Sources

- Emil Kowalski, `review-animations` skill and standards: https://github.com/emilkowalski/skill
- ibelick ui-skills `fixing-motion-performance`: https://github.com/ibelick/ui-skills
- impeccable `audit` and `animate` references: https://github.com/pbakaus/impeccable
- Vercel Web Interface Guidelines (animation section, anti-patterns): https://github.com/vercel-labs/web-interface-guidelines
- WCAG 2.2 (2.2.2, 2.3.1, 2.5.7): https://www.w3.org/TR/WCAG22/
