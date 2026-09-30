---
name: motion-design
description: Use when adding, tuning, or reviewing animation and transitions in a web or mobile UI — deciding whether something should animate at all, choosing easing curves and durations, springs, stagger and choreography, drag/swipe gestures, press feedback, reduced-motion behavior, and animation performance (jank, layout thrash). Covers CSS transitions vs WAAPI vs motion libraries, @starting-style, View Transitions, scroll-driven animations, and iOS/Material spring pointers. Also use when the user says "make it feel smoother", "add some polish", "this animation feels off/slow/janky", "animate this modal", or "it feels cheap". Not for choosing which feedback pattern to show (toast vs inline, modal vs sheet); use interaction-design. For full accessibility audits use accessibility.
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "interaction-design accessibility web-platform ios-design android-design design-review"
---

# Motion Design

Motion is a tool for explaining change, not a coat of polish. The best-feeling products animate less than you expect: frequent actions are instant, state changes move quickly and along a path that makes sense, and one deliberate moment carries the personality. This skill decides *whether* to animate before *how*, then hands you exact curves, durations, and spring values so motion stays fast, interruptible, accessible, and cheap to render.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also check for existing motion tokens (`--ease-*`, `--duration-*`, a `motion` section in DESIGN.md, a Motion/GSAP/Reanimated dependency). Extend what exists; never add a second animation system to a component tree that already has one.

## Core principles

1. **Decide whether to animate before deciding how.** Frequency and purpose decide; most high-frequency UI should be instant.
2. **Every animation explains something.** Spatial origin, state change, feedback, or continuity — "it looks nice" is not a purpose on anything seen daily.
3. **Fast and responsive beats smooth and slow.** UI motion stays under 300 ms; ease-out starts moving immediately, which is when the user is watching.
4. **Interruptible always.** Users must be able to reverse or redirect any motion mid-flight; never lock input during a transition.
5. **Reduce, don't remove.** Reduced-motion users still get state feedback through opacity and color; they lose travel, scale, parallax, and bounce.
6. **Transform and opacity only.** Anything that triggers layout or large paints will drop frames on the devices your users actually own.
7. **One orchestrated moment beats scattered effects.** Spend expressiveness once (a hero entrance, a success moment); keep everything else quiet and consistent.

## Workflow

- [ ] **Inventory** every candidate animation: trigger (pointer, keyboard, system), how often a user sees it per day, and what it should explain.
- [ ] **Gate** each one with the frequency table below; delete the ones that fail. Write down the purpose of each survivor in a few words.
- [ ] **Assign tokens**: easing and duration from the tables (or the project's tokens). Similar elements share one curve + duration pair.
- [ ] **Implement** with the cheapest mechanism that works (CSS transition → WAAPI → library). Animate `transform`/`opacity` only.
- [ ] **Add the reduced-motion variant** at the same time, not later.
- [ ] **Verify**: play at 5–10× slow motion (DevTools animation panel), interrupt every animation mid-flight, test with reduced motion on, profile on a throttled CPU or a mid-range phone, test gestures on real touch hardware.
- [ ] **Review** against Gotchas and `references/review-checklist.md`; fix and repeat until clean.

## Should this animate at all?

| How often the user sees it | Decision | Examples |
|---|---|---|
| 100+ times a day, or keyboard-initiated | **No animation** | Command palette toggle, keyboard shortcuts, list focus movement, tab switch via shortcut |
| Tens of times a day | Remove, or reduce to ≤150 ms opacity/color | Hover states, row selection, context menus (animate exit only if at all) |
| Occasionally | Standard motion | Modals, drawers, popovers, toasts, route changes |
| Rarely / first time | May add delight | Onboarding, first success, empty-to-first-item, celebrations |

Valid purposes: **spatial consistency** (where did it come from / go), **state indication** (on/off, loading → done), **feedback** (press, drop, error shake), **continuity** (the same object across two layouts), **explanation** (marketing or onboarding showing how something works). If an animation has none of these, cut it.

Operate surfaces (apps, dashboards) get state-change motion only, 150–250 ms, no orchestrated page-load sequences. Persuade surfaces (landing pages) may add one authored entrance; content must still be readable with motion off.

## Easing defaults

Browser keywords (`ease`, `ease-out`) are too weak for UI. Ship these as tokens:

```css
:root {
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);    /* enter, exit, most UI */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* moving/morphing something already on screen */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* iOS-like sheet/drawer (used by Vaul) */
  --ease-exit:   cubic-bezier(0.4, 0, 1, 1);        /* accelerate away: only for elements leaving the screen for good */
}
```

| Motion | Curve | Why |
|---|---|---|
| Element enters (popover, toast, modal) | `--ease-out` | Moves fast at the start, when attention is highest |
| Element exits | `--ease-out` at ~75% of the enter duration | Stays responsive; faster exit reads as "dismissed" |
| Element leaves the screen entirely (sheet swiped away, toast flung off) | `--ease-exit`, ≤ 200 ms | Accelerating away reads as departure; short enough not to feel sluggish |
| On-screen move/resize/morph (reorder, shared element) | `--ease-in-out` | Natural acceleration and settle for an object already in view |
| Hover, color, background | `ease` (keyword) at 100–150 ms | Gentle; there is no travel to shape |
| Constant motion (progress bar, spinner, marquee) | `linear` | Anything else looks like it is stalling |
| Anything a finger or pointer drives | a spring, not a curve | Springs keep velocity and can be retargeted |

**Never use `ease-in` for UI entrances or feedback**: it delays the first frames — exactly the moment the user is looking — and a 200 ms ease-in feels slower than a 200 ms ease-out. No bounce or elastic curves by reflex; overshoot belongs only to momentum gestures (see Springs).

## Duration defaults

| Element | Duration | Notes |
|---|---|---|
| Press feedback (`:active` scale) | 100–160 ms | Apply on pointer-down, not click |
| Hover / color change | 100–150 ms | Gate behind `(hover: hover) and (pointer: fine)` |
| Tooltip, small popover | 125–200 ms | Subsequent tooltips in a group: no delay, no animation |
| Dropdown, select, menu | 150–250 ms | Menus may skip the open animation and fade on close |
| Toast | 200–400 ms | Transitions, not keyframes (toasts are added rapidly) |
| Modal, dialog | 200–300 ms | Centered; scale from ~0.96, not from the trigger |
| Drawer / bottom sheet | 300–500 ms | With `--ease-drawer`; larger distance earns more time |
| Route / view transition | 200–300 ms | Longer blocks perceived navigation speed |
| Authored marketing entrance | 500–800 ms max per element | One moment per page, never on every section |

Rules of thumb: **UI motion stays under 300 ms**; duration grows with distance and area (a chip moves faster than a full-screen sheet); exits run at ~70–75% of the enter duration; a faster spinner makes the same wait feel shorter.

## Springs

Use a spring for anything the user directly manipulates or can interrupt (drag, swipe, sheets, reorder, shared-element moves, "alive" elements). Springs have no fixed duration; they settle from their parameters and carry velocity through a retarget, which curves cannot.

Default: **critically damped (no overshoot)**. Add bounce only when the gesture itself carried momentum (a flick or throw).

| Interaction | Damping ratio | Response (s) | ≈ Motion (web) config |
|---|---|---|---|
| Move / reposition, most UI | 1.0 | 0.3–0.4 | `{ type: "spring", bounce: 0, duration: 0.4 }` |
| Drawer / sheet after a flick | 0.8 | 0.3 | `{ type: "spring", bounce: 0.2, duration: 0.3 }` |
| Playful, explicitly brand-driven | 0.6–0.7 | 0.35–0.5 | `bounce: 0.3` max |

Overshoot only on transforms, never on opacity or color. Never go below damping 0.55 in product UI. In CSS without a library, `linear()` (Baseline widely available) can approximate a spring for fixed, non-interrupted motion. Values and per-platform APIs: `references/gestures-springs.md`.

## Physicality and component rules

- **Never animate from `scale(0)`.** Start at `scale(0.95)` (range 0.9–0.97) with `opacity: 0`; scale amount is proportional to the element's size — dialogs need less than chips.
- **Press feedback**: `:active { transform: scale(0.97) }` with `transition: transform 150ms var(--ease-out)`; keep it between 0.95 and 0.98.
- **Origin-aware popovers**: set `transform-origin` to the trigger side (Radix/Base UI expose `--transform-origin`). Modals are the exception: they stay centered.
- **Enter and exit along the same path**: a panel that slides in from the right leaves to the right.
- **Transitions for interruptible UI, keyframes for one-shot sequences**: transitions retarget from the current value; keyframes restart from zero.
- **Crossfading two states** (icon swap, label change): opacity + slight scale (0.95→1), plus up to 2 px of blur if the overlap looks muddy.
- **Content is visible by default**: scroll reveals and entrance effects enhance an already-visible page; a failed script must never leave content at `opacity: 0`.
- **No idle motion**: no pulsing, floating, or breathing loops on static content. Loops only for genuinely live data, paused off-screen, off under reduced motion.

## Choreography and stagger

- Stagger related items **30–80 ms apart**; cap the **total** stagger at ~500 ms (stagger the first handful, bring the rest in together).
- Stagger is decoration: **never block interaction** while it plays, and do not re-run it on every re-render or filter change.
- Stagger first-load entrances only; repeated actions (switching tabs, paging a table) stay instant.
- One dominant direction per screen; reserve other directions for meaning (forward navigation moves one way, back moves the other).
- Cause before effect: the thing the user touched moves first; dependent elements follow within ~50–100 ms, not simultaneously in random order.
- Similar elements share one curve and duration; a unique pair per element reads as noise.

## Gestures and drag

Track the pointer 1:1 (respect the grab offset), capture the pointer once the drag starts, and hand the release velocity to a spring. Dismiss on **velocity** as well as distance (a flick above ~0.11 px/ms should dismiss even if the distance threshold is not crossed). Past a boundary, **rubber-band** with rising resistance instead of a hard stop. Require ~10 px of movement before committing to a direction. Ignore extra touch points mid-drag. Handle `pointercancel` and `lostpointercapture` so the next drag still works. Every drag action needs a non-drag alternative (WCAG 2.5.7). Formulas and code: `references/gestures-springs.md`.

## Reduced motion

`prefers-reduced-motion: reduce` means **fewer and gentler**, not zero:

| Keep | Replace or remove |
|---|---|
| Opacity crossfades ≤ 200 ms | Slides and travel → crossfade in place |
| Color/background state changes | Scale/zoom entrances → fade |
| Progress indicators (slower) | Parallax, scroll-linked motion, auto-playing loops, marquees |
| Focus and selection feedback | Spring overshoot and bounce → critically damped or instant |

```css
@media (prefers-reduced-motion: reduce) {
  .sheet { transform: none; transition: opacity 200ms ease; }
  ::view-transition-group(*) { animation-duration: 0s; }
}
```

Do **not** ship a global `* { transition-duration: 0.01ms !important }` kill switch: it destroys useful state feedback and breaks JS springs and code waiting on `transitionend`. In JS, read the preference (`matchMedia('(prefers-reduced-motion: reduce)')` or the library hook such as Motion's `useReducedMotion`) and branch the values. Anything that auto-plays for more than 5 s needs pause/stop/hide (WCAG 2.2.2); nothing flashes more than 3 times per second (WCAG 2.3.1). Native: iOS Reduce Motion and Android "Remove animations" should get crossfades or instant cuts.

## Performance

- Animate only `transform` and `opacity`; `width`, `height`, `top`, `left`, `margin`, `padding` trigger layout on every frame. For height, use FLIP, `grid-template-rows: 0fr → 1fr`, or `interpolate-size` as progressive enhancement.
- **Never `transition: all`**; list properties explicitly.
- Do not animate `box-shadow` or large `filter`/`backdrop-filter`; animate the opacity of a pseudo-element that holds the bigger shadow. Keep animated blur ≤ 8 px, one-shot, on small elements.
- `will-change: transform` only on elements about to animate (add before, remove after), or where you have observed jank; never as a blanket rule.
- Batch DOM reads before writes; never read layout (`getBoundingClientRect`, `offsetHeight`) inside an animation loop.
- Never drive animation from `scroll` events or `scrollY`; use scroll/view timelines or IntersectionObserver. Pause off-screen loops.
- Per-frame values go to `element.style.transform` (or a motion value), never React state; do not animate an inherited CSS variable on a parent that many children read.

## Choosing the mechanism

Default order: **CSS transition → CSS animation → WAAPI → motion library.**

| Need | Use |
|---|---|
| Hover, press, open/close, enter from `display: none` | CSS transitions + `@starting-style` |
| Predetermined multi-step sequence | CSS `@keyframes` or WAAPI (`element.animate()`) |
| Programmatic control (play, reverse, await finish) without a library | WAAPI |
| Springs with velocity, drag/gesture, layout/shared-element animation, exit animations of unmounting React components | A motion library (e.g. Motion, React Spring; Reanimated on React Native) |
| Long authored timelines, scroll storytelling on marketing pages | A timeline library (e.g. GSAP) — one per project |
| Route changes, same element across two layouts | View Transitions API (same-document Baseline 2025-10) |
| Scroll-linked progress or reveals | Scroll-driven animations as progressive enhancement (not yet in Firefox stable) |

A simple hover or fade never justifies a library. Platform APIs, Baseline status, and snippets: `references/web-apis.md`.

## Mobile platforms

Follow the platform's own motion first; custom motion that fights system transitions feels broken.

- **iOS**: system push/pop and sheet transitions; springs expressed as damping + response (SwiftUI `.spring(response:dampingFraction:)`, `.smooth`, `.snappy`). Interruptible, gesture-driven, critically damped by default. Honor Reduce Motion. Details in `ios-design`.
- **Android (Material 3 Expressive)**: Compose `MaterialTheme.motionScheme` supplies springs. *Spatial* specs (position, size, shape) may overshoot; *effects* specs (color, alpha) are critically damped. The `standard()` scheme is the default for utilitarian UI; `expressive()` is for prominent/hero elements. Values in `references/gestures-springs.md`; details in `android-design`.
- **React Native**: run animations on the UI thread (Reanimated worklets or native driver); JS-thread animations stutter under load.

## Gotchas

- **Animating keyboard-driven or 100×/day actions.** Command palettes, shortcuts, and list navigation must be instant; animation makes the whole app feel slow.
- **`ease-in` entrances and 400 ms+ UI transitions.** Both read as lag. Use ease-out, under 300 ms.
- **`scale(0)` pop-ins and `transform-origin: center` on popovers.** Start at 0.95; originate from the trigger (modals excepted).
- **Fade-and-rise on every section, hover lift on every card.** This is the generic default; pick one moment or none.
- **Bounce/elastic easing as "personality".** Overshoot belongs to momentum gestures on transforms, not to menus or opacity.
- **Keyframes on rapidly re-triggered elements.** Toasts and toggles need transitions so they retarget instead of restarting.
- **A global reduced-motion kill switch.** It removes useful feedback and breaks JS; write an intentional reduced variant.
- **Blocking input during a transition or stagger.** Users click during animations; they must never be ignored or queued.
- **Distance-only swipe dismissal.** Without a velocity check, quick flicks do nothing and the UI feels dead.
- **Drag without a non-drag alternative.** Fails WCAG 2.5.7; add buttons or a "Move to…" menu.
- **Content hidden until a scroll/JS reveal fires.** Slow or failed scripts leave a blank page; ship visible and enhance.
- **Mixing animation systems in one tree** (GSAP + Motion + CSS keyframes on the same element). They fight over the same properties and each measures layout.
- **Theme switch triggers transitions everywhere.** Disable transitions during the color-scheme swap.
- **Hover animations on touch.** Wrap them in `@media (hover: hover) and (pointer: fine)`; touch gets `:active` feedback instead.

## Output format

When building: the motion tokens used (or added) and, per animation, one line — `element · trigger · purpose · curve · duration/spring · reduced-motion behavior`.

When reviewing: a table, one row per finding, ordered by severity:

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| P1 | `Dropdown.css:14` | `transition: all 400ms ease-in` | `transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out)` | ease-in delays the first frames; `all` animates layout properties |

End with **Verified** (slow-motion, interrupt, reduced-motion, throttled-CPU checks actually performed) and **Not checked**.

## References

| File | Read when |
|---|---|
| `references/easing-durations.md` | Defining motion tokens, picking a curve or duration for an unusual element, or mapping to Material/Carbon curves |
| `references/gestures-springs.md` | Building drag, swipe-to-dismiss, sheets, carousels, or reorder; tuning springs; iOS/Compose/React Native spring values |
| `references/web-apis.md` | Using `@starting-style`, View Transitions, scroll-driven animations, WAAPI, `linear()`, `interpolate-size`, or `sibling-index()` stagger |
| `references/review-checklist.md` | Auditing existing animations or reviewing a PR that touches motion |

## Related skills

- `interaction-design` — which feedback, overlay, or state pattern to show before deciding how it moves.
- `accessibility` — vestibular safety, WCAG 2.2.2/2.3.1/2.5.7, and screen-reader behavior of animated content.
- `web-platform` — Baseline status and progressive-enhancement strategy for new CSS features.
- `ios-design` / `android-design` — platform-native transitions, springs, and reduce-motion settings.
- `design-review` — when motion is one part of a wider UI audit.
