# Easing and Duration Reference

Exact values for motion tokens, with the reasoning needed to pick outside the defaults.

## Contents
- Token set to ship
- Curve catalog
- Duration by element and distance
- Asymmetric timing
- Stagger math
- Tokens in DTCG and Tailwind v4
- Rules

## Token set to ship

A product needs very few motion tokens. More than ~4 curves and ~5 durations means motion is being tuned per element instead of designed as a system.

```css
:root {
  /* curves */
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-exit:   cubic-bezier(0.4, 0, 1, 1);

  /* durations */
  --duration-instant: 100ms;  /* press, color */
  --duration-fast:    150ms;  /* hover, tooltip, small popover */
  --duration-base:    200ms;  /* dropdown, toast, modal */
  --duration-slow:    300ms;  /* view transition, larger panel */
  --duration-sheet:   450ms;  /* full-height drawer/sheet with --ease-drawer */
}
```

## Curve catalog

| Name | cubic-bezier | Use | Source |
|---|---|---|---|
| Strong ease-out | `0.23, 1, 0.32, 1` | Default for enter/exit and most UI | Emil Kowalski |
| Expo-like ease-out | `0.16, 1, 0.3, 1` | Authored marketing entrances; very fast start, long settle | Common in taste/impeccable skills |
| Strong ease-in-out | `0.77, 0, 0.175, 1` | Moving/morphing an element already on screen | Emil Kowalski |
| Drawer (iOS-like) | `0.32, 0.72, 0, 1` | Sheets and drawers; used by Vaul, originally Ionic | Emil Kowalski |
| Accelerate (exit) | `0.4, 0, 1, 1` | Element leaves the screen for good; keep ≤200 ms | Material-style accelerate |
| Material standard | `0.4, 0, 0.2, 1` | Matching a Material web app | Material |
| M3 emphasized | `0.2, 0, 0, 1` | Matching M3 emphasized transitions | Material 3 |
| Carbon standard productive | `0.2, 0, 0.38, 0.9` | Matching IBM Carbon | Carbon |
| `ease` | keyword | Hover, color, background | CSS |
| `linear` | keyword | Spinners, progress, marquees, scroll-linked timelines | CSS |

Pick curves from a visual tool (easing.dev, easings.co) rather than hand-tuning numbers.

### Why ease-out is the default
An ease-out curve covers most of the distance in the first third of the duration. The user's eye lands on the element as it appears, so the interface looks like it responded immediately. An ease-in curve spends its first frames barely moving; at the same 200 ms it *feels* slower because the visible response is delayed.

### When an accelerating exit is acceptable
Only when the element is leaving permanently and nothing the user is waiting for depends on its first frames: a dismissed toast flung off-screen, a sheet closing downward after the user released it. Keep it short. For exits that merely hide something (menu closing, popover dismissing), use `--ease-out` at a shorter duration.

## Duration by element and distance

| Element | Enter | Exit |
|---|---|---|
| Press scale | 100–160 ms | same (release) |
| Hover/color | 100–150 ms | same |
| Tooltip | 125–200 ms (first in a group has a delay; later ones 0 ms) | 100 ms or instant |
| Popover / dropdown / select | 150–250 ms | 100–150 ms |
| Context menu | none or ≤150 ms | fade ≤150 ms |
| Toast | 200–400 ms | 150–300 ms |
| Modal/dialog | 200–300 ms | 150–200 ms |
| Side panel / drawer | 250–400 ms | 200–300 ms |
| Full-height bottom sheet | 400–500 ms (drawer curve) | 300–400 ms |
| Route/view transition | 200–300 ms | (crossfade shares the duration) |
| Skeleton shimmer cycle | 1.5–2 s, linear | off under reduced motion |
| Marketing hero entrance | 500–800 ms, once | n/a |

Scale duration with **distance and area**: moving 8 px needs ~100 ms; moving across the viewport needs ~300–500 ms. A small element moving a long way looks too fast at 150 ms; a large surface moving a short way looks sluggish at 400 ms.

## Asymmetric timing

Slow where the user is deciding, fast where the system responds.

- Hold-to-confirm: the fill runs ~2 s `linear` while held; release snaps back in ~200 ms ease-out.
- Tooltip: delay before the first opens; peers open instantly.
- Loading: delay showing a spinner by ~150–300 ms, then keep it visible at least ~300–500 ms to avoid flicker.
- Exit faster than enter: ~70–75% of the enter duration.

## Stagger math

- Per-item delay: 30–80 ms (larger items and fewer of them sit toward 80 ms).
- Total budget: ≤ ~500 ms from first to last item start. With 50 ms steps, stagger the first ~8 items; the rest appear with the last staggered item.
- Pure CSS (Baseline newly available 2026-08): `transition-delay: calc(min(sibling-index(), 8) * 50ms);` with an `nth-child` or inline-style fallback for older browsers.
- Never stagger on every filter/sort change; stagger the first load only.

## Tokens in DTCG and Tailwind v4

DTCG 2025.10 has native `duration` and `cubicBezier` types and a composite `transition` type:

```json
{
  "motion": {
    "duration": {
      "$type": "duration",
      "fast": { "$value": { "value": 150, "unit": "ms" } }
    },
    "ease": {
      "$type": "cubicBezier",
      "out": { "$value": [0.23, 1, 0.32, 1] }
    }
  }
}
```

Tailwind v4 generates utilities from `--ease-*` and `--animate-*` theme variables:

```css
@theme {
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}
/* usage: class="transition-transform duration-200 ease-out-strong" */
```

## Rules

### Share one curve and duration across similar elements
**Rule.** Every popover uses the same pair; every toast uses the same pair.
**Apply when.** Adding a new animated component.
**Do / Avoid.** Do reuse `--ease-out` + `--duration-base`. Avoid `cubic-bezier(0.31, 0.9, 0.4, 1) 230ms` invented for one menu.
**Why.** Consistency is what makes motion read as a system (law of similarity); per-element tuning reads as noise and is impossible to maintain.

### Match motion personality to the product
**Rule.** Crisp and fast for tools; slightly slower and softer only where the brand calls for it.
**Apply when.** Setting motion tokens for a new product or theme.
**Do / Avoid.** Do keep a dashboard at 150–200 ms ease-out. Avoid 500 ms springy panels in an accounting app.
**Why.** Motion is part of brand voice; mismatched motion makes a serious product feel toy-like (cohesion).

## Sources

- Emil Kowalski, animation standards (`skills/review-animations/STANDARDS.md`): https://github.com/emilkowalski/skills/blob/main/skills/review-animations/STANDARDS.md
- Emil Kowalski, "You Don't Need Animations": https://emilkowal.ski/ui/you-dont-need-animations
- Vercel Web Interface Guidelines (animation, loading-state timing): https://github.com/vercel-labs/web-interface-guidelines
- impeccable `animate` reference (duration bands): https://github.com/pbakaus/impeccable
- GoogleChrome modern-web-guidance (`sibling-index()` Baseline data): https://github.com/GoogleChrome/modern-web-guidance
- DTCG Format 2025.10: https://www.designtokens.org/tr/2025.10/format/
- Tailwind CSS v4 theme variables: https://tailwindcss.com/docs/theme
