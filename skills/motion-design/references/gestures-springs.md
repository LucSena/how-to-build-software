# Gestures and Springs Reference

How to make drag, swipe, sheets, and reorder feel physical, and how to tune springs on each platform. Most of this comes from lessons shipped in Sonner (toasts) and Vaul (drawers) and from Apple's "Designing Fluid Interfaces" talk.

## Contents
- The drag lifecycle
- Velocity and momentum
- Rubber-banding
- Interruptibility
- Spring parameters by platform
- Accessibility of gestures
- Rules

## The drag lifecycle

1. **pointerdown**: record the start position, the grab offset inside the element, and a timestamp. Show press feedback now, not on release.
2. **Hysteresis**: wait for ~10 px of movement before deciding the axis/direction. Until then, it might be a tap or a scroll.
3. **Capture**: once committed, call `element.setPointerCapture(e.pointerId)` so tracking continues outside the element. Disable text selection and set `inert` on unrelated regions while dragging.
4. **Track 1:1**: move the element exactly with the pointer (minus the grab offset). Write to `element.style.transform` directly, not to framework state, every frame.
5. **Keep a short history** of the last few `pointermove` samples (position + time) to compute release velocity.
6. **Release**: compute velocity, project the endpoint, pick the target, animate with a spring that starts at the release velocity.
7. **Cancel paths**: handle `pointercancel`, `lostpointercapture`, window `blur`, and release outside the element. Every path must reset drag state so the next drag works.
8. **Multi-touch**: once dragging, ignore additional pointers (`if (isDragging) return`) to prevent jumps.

CSS support:
```css
.sheet { touch-action: none; }            /* custom pan surface: you own the gesture */
.carousel-track { touch-action: pan-y; }  /* horizontal drag that must not block vertical page scroll */
.modal, .drawer { overscroll-behavior: contain; }
```

## Velocity and momentum

**Velocity-based dismissal** (Sonner/Vaul): dismiss when the gesture is fast enough, even if it did not travel far.

```js
const velocity = Math.abs(dragDistance) / (performance.now() - dragStartTime); // px per ms
const shouldDismiss = velocity > 0.11 || Math.abs(dragDistance) > dismissThreshold;
```

**Momentum projection** (Apple): choose the snap target from where the gesture *would* come to rest, not from where the finger lifted.

```js
// decelerationRate ≈ 0.998 for normal scroll feel, 0.99 for snappier
function project(velocityPxPerSec, decelerationRate = 0.998) {
  return (velocityPxPerSec / 1000) * decelerationRate / (1 - decelerationRate);
}
const target = nearestSnapPoint(currentPosition + project(releaseVelocity));
animateSpringTo(target, { velocity: releaseVelocity });
```

**Velocity handoff**: pass the release velocity to the spring so there is no visible seam between dragging and animating. Libraries such as Motion take absolute velocity (px/s); APIs that expect relative velocity want `velocity / (target - current)`.

## Rubber-banding

Past a boundary, move less the further the user drags, instead of stopping dead:

```js
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
```

Use it for sheets dragged above their top detent, lists pulled past their ends, and carousels at the first/last slide. On release, spring back with damping 1.0.

## Interruptibility

- **Never lock input during a transition.** A closing sheet the user grabs again should follow the finger immediately.
- **Animate from the presented value.** On interrupt, read the element's current on-screen transform and start from there; starting from the logical target causes a jump.
- **Retarget, do not restart.** Springs and CSS transitions retarget; `@keyframes` restart from zero and are wrong for anything re-triggerable.
- **Decompose 2D motion** into independent x and y springs so each axis keeps its own velocity.
- **`translateY(100%)`** is relative to the element's own height; use it to park drawers/toasts off-screen without measuring.

## Spring parameters by platform

### Mental model
- **Damping ratio**: 1.0 = critically damped (no overshoot); below 1.0 overshoots. 0.8–0.85 gives ~1–1.5% overshoot, "felt, not seen". 0.6–0.7 is visibly playful. Below 0.55 is never appropriate in product UI.
- **Response** (seconds): how quickly the value approaches the target. Lower is snappier. It is not a duration; settle time emerges from the parameters.
- Default to damping 1.0; lower it only when the gesture carried momentum.

### Apple reference values (Designing Fluid Interfaces)

| Interaction | Damping | Response |
|---|---|---|
| Move / reposition | 1.0 | 0.4 |
| Rotation | 0.8 | 0.4 |
| Drawer / sheet | 0.8 | 0.3 |

Response guide: chips and small controls 0.25–0.35 s; standard panels 0.35–0.5 s; weighted hero elements 0.5–0.7 s.

### Web (Motion library)
```js
// critically damped default
animate(el, { transform: "translateY(0px)" }, { type: "spring", bounce: 0, duration: 0.4 });
// after a flick: a little bounce, because momentum preceded it
animate(el, { transform: `translateY(${target}px)` }, { type: "spring", bounce: 0.2, duration: 0.4, velocity });
```
Keep `bounce` between 0 and 0.3. Under CPU load, prefer animating a full `transform` string (or CSS/WAAPI) over per-axis shorthand values, which Emil Kowalski reports can drop frames because they are computed on the main thread.

### iOS (SwiftUI)
`.spring(response:dampingFraction:)` maps directly to the table above; presets such as `.smooth` (no bounce) and `.snappy` (small bounce) cover most UI. Gesture-driven changes should be interruptible and inherit velocity; system navigation and sheet transitions should not be replaced. See `ios-design`.

### Android (Compose, Material 3 Expressive)
`MaterialTheme.motionScheme` returns the spring specs components use. `MotionScheme.standard()` is the default (utilitarian UI, recurring interactions); `MotionScheme.expressive()` is recommended for prominent/hero elements. *Spatial* specs are for position, size, and shape; *effects* specs are for color and alpha and never overshoot.

| Token | Standard (damping / stiffness) | Expressive (damping / stiffness) |
|---|---|---|
| fastSpatial | 0.9 / 1400 | 0.6 / 800 |
| defaultSpatial | 0.9 / 700 | 0.8 / 380 |
| slowSpatial | 0.9 / 300 | 0.8 / 200 |
| fastEffects | 1.0 / 3800 | 1.0 / 3800 |
| defaultEffects | 1.0 / 1600 | 1.0 / 1600 |
| slowEffects | 1.0 / 800 | 1.0 / 800 |

Use `MaterialTheme.motionScheme.defaultSpatialSpec()` rather than hand-written `spring()` values so custom components match Material components. See `android-design`.

### React Native
Run gesture-driven animation on the UI thread (Reanimated worklets with Gesture Handler); JS-thread animation stutters whenever JS is busy.

## Accessibility of gestures

- **WCAG 2.5.7 Dragging Movements (AA)**: anything done by dragging must also be possible with single pointer actions without dragging: up/down buttons or a "Move to…" menu for sortable lists, tap-on-track for sliders, a "Move to column" menu for kanban cards.
- **WCAG 2.5.1 Pointer Gestures**: path-based or multi-finger gestures (pinch, two-finger swipe) need a single-pointer alternative (buttons for zoom).
- **Keyboard**: sliders and reorderable lists support arrow keys; sheets close with Escape.
- **Reduced motion**: keep 1:1 tracking (it is user-driven), but replace post-release overshoot with a critically damped settle or an instant snap.

## Rules

### Dismiss on velocity, not only distance
**Rule.** A quick flick dismisses a sheet or toast even if it traveled only a few pixels.
**Apply when.** Implementing swipe-to-dismiss, drawers, carousels.
**Do / Avoid.** Do check `velocity > ~0.11 px/ms` or a distance threshold. Avoid "must drag 50% of the height".
**Why.** Users express intent through speed; ignoring it makes the UI feel unresponsive (momentum, Fitts-style effort).

### Resist at boundaries instead of stopping
**Rule.** Over-drag with increasing resistance and spring back.
**Apply when.** Any draggable surface with limits.
**Do / Avoid.** Do apply the rubber-band function. Avoid clamping the transform at the edge.
**Why.** A hard stop reads as frozen; progressive resistance reads as "responsive, but nothing more here".

### Bounce only after momentum
**Rule.** Overshoot only when the user threw the element; otherwise settle critically damped.
**Apply when.** Choosing spring parameters.
**Do / Avoid.** Do use damping 0.8 after a flick release. Avoid bouncy menus that simply opened.
**Why.** Overshoot mimics carried momentum; without a throw there is no momentum to carry, so it reads as wobble.

## Sources

- Emil Kowalski, animation standards and `apple-design` skill: https://github.com/emilkowalski/skills
- Sonner: https://github.com/emilkowalski/sonner ; Vaul: https://github.com/emilkowalski/vaul
- Apple WWDC 2018 "Designing Fluid Interfaces": https://developer.apple.com/videos/play/wwdc2018/803/
- hyperframes motion doctrine and easing adapter (spring damping bands): https://github.com/heygen-com/hyperframes
- androidx Compose Material 3 `MotionScheme.kt`, `StandardMotionTokens.kt`, `ExpressiveMotionTokens.kt`: https://android.googlesource.com/platform/frameworks/support/+/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt
- WCAG 2.2 (2.5.1, 2.5.7): https://www.w3.org/TR/WCAG22/
