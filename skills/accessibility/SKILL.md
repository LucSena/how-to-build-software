---
name: accessibility
description: Use when building or reviewing any UI for accessibility — WCAG 2.2 AA conformance, semantic HTML and ARIA, keyboard navigation and focus management (focus rings, modals, skip links, roving tabindex), screen reader announcements and live regions, accessible forms and errors, color contrast (WCAG ratios, APCA as a secondary check), target sizes, reduced motion and vestibular safety, and mobile accessibility (VoiceOver, TalkBack, Dynamic Type, font scaling). Also covers how to test (axe, Lighthouse, keyboard pass, screen reader pass). Also use when the user says "is this accessible?", "add aria labels", "make it keyboard friendly", "screen reader support", "a11y audit", "EAA/ADA compliance", or builds a modal, menu, tabs, combobox, or custom control. Not for general UX critique; use design-review. For animation tuning use motion-design.
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "interaction-design motion-design web-platform design-review ios-design android-design"
---

# Accessibility

Accessibility is the floor every UI stands on, not a polish pass. The target is **WCAG 2.2 Level AA** — the bar referenced by the European Accessibility Act (enforced since 2025-06-28), ADA case law, and Section 508 — plus platform conventions on iOS and Android. Most failures come from a short list of mistakes (div buttons, missing names, lost focus, silent updates, low contrast), so this skill front-loads those and makes you prove conformance with a keyboard and a screen reader, not just a scanner.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Check which accessible primitives the project already uses (React Aria, Radix, Base UI, Headless UI, Ariakit, native `<dialog>`/popover, SwiftUI/Compose system components). Build on them; never hand-roll focus management for a widget a primitive already solves, and never mix primitive systems in one surface.

## Core principles

1. **Native semantics first, ARIA last.** A `<button>` is focusable, keyboard-operable, and announced for free; `role="button"` on a div gives you none of that.
2. **Everything works with a keyboard alone.** Reachable, operable, visible focus, logical order, no traps — pointer-only features exclude keyboard, switch, and voice users.
3. **Every control has a name, role, and state a screen reader can announce.** Visible label text is part of the accessible name.
4. **Changes are perceivable without sight.** Status messages, errors, and loading states are announced, not just painted.
5. **Meaning never depends on one sense.** Color, position, motion, or sound alone cannot carry information.
6. **Respect user settings.** Zoom, text size, reduced motion, contrast, and transparency preferences are requirements, not suggestions.
7. **Automated tools are the start of testing, not the end.** They catch a minority of issues; keyboard and screen-reader passes find the rest.

## Workflow

- [ ] **Scope**: list the screens/components and the primary user tasks on each.
- [ ] **Semantics**: landmarks, one `<h1>`, heading order, native elements for controls, labels on every input. Fix before anything else.
- [ ] **Keyboard pass**: unplug the mouse. Tab through every task; check order, visible focus, Escape, arrow-key widgets, focus return after overlays. Fix and repeat.
- [ ] **Screen reader pass**: VoiceOver (macOS/iOS) or NVDA (Windows); TalkBack on Android. Check names, roles, states, and announcements for async changes.
- [ ] **Visual pass**: contrast (text, UI, focus ring, both themes), 200% zoom, 320 px reflow, text-spacing override, color-blind simulation.
- [ ] **Motion and settings**: reduced motion, forced colors / high contrast, large text (Dynamic Type / font scale).
- [ ] **Automated scan**: axe (DevTools, `@axe-core/playwright`, or jest-axe) plus lint (`eslint-plugin-jsx-a11y` or equivalent) in CI. Triage results; they complement, never replace, the manual passes.
- [ ] **Report** findings with WCAG criterion, severity, evidence, and one fix each (see Output format); re-test fixed items.

## WCAG 2.2 AA: what agents break most

The full checklist lives in `references/wcag-22-checklist.md`. These cause most real failures:

| Criterion | Requirement | Typical fix |
|---|---|---|
| 1.1.1 Non-text content | Meaningful images have alt text; decorative ones `alt=""` | `alt` describes purpose, not appearance; icon-only buttons get `aria-label` |
| 1.3.1 Info and relationships | Structure is in the markup | Real headings, lists, `<table>` with `<th scope>`, `<label for>`, fieldset/legend, landmarks |
| 1.4.3 Contrast (minimum) | Text 4.5:1; large text (≥24 px, or ≥18.66 px bold) 3:1 | Adjust tokens; check every state and both themes |
| 1.4.10 Reflow | No 2-D scrolling at 320 CSS px | Responsive layout; tables and code scroll in their own container |
| 1.4.11 Non-text contrast | UI component boundaries, icons, focus rings, chart marks 3:1 | Stronger borders/rings |
| 1.4.13 Content on hover/focus | Tooltips dismissible (Esc), hoverable, persistent | Do not hide on pointer-leave to the tooltip itself |
| 2.1.1 Keyboard / 2.1.2 No trap | Everything operable by keyboard; you can always leave | Native elements; Escape releases modal focus |
| 2.4.3 Focus order | Order follows meaning | DOM order = visual order; never `tabindex > 0` |
| 2.4.7 Focus visible | Keyboard focus always visible | `:focus-visible` outline; never `outline: none` without a replacement |
| 2.4.11 Focus not obscured (new) | Focused element not entirely hidden by sticky UI | `scroll-padding-top` = sticky header height; banners don't cover focus |
| 2.5.7 Dragging movements (new) | Drag actions have a single-pointer alternative | Buttons or "Move to…" menus |
| 2.5.8 Target size (new) | Targets ≥ 24×24 CSS px (or spaced so 24 px circles don't overlap) | Pad hit areas; 44 px on touch as your default |
| 3.3.1 / 3.3.3 Errors | Errors identified in text, with a suggestion | Inline message linked to the field |
| 3.3.7 Redundant entry (new, A) | Don't ask for the same data twice in a process | Prefill or "Same as shipping" |
| 3.3.8 Accessible authentication (new) | No memory/puzzle test without an alternative | Allow paste and password managers; support passkeys, magic links, `autocomplete="one-time-code"` |
| 4.1.2 Name, role, value | Custom widgets expose correct semantics and state | Follow ARIA Authoring Practices, or use a primitive |
| 4.1.3 Status messages | Async results announced without moving focus | `role="status"` live region |

WCAG 2.2 also added 3.2.6 Consistent Help (A). 4.1.1 Parsing was removed.

## Semantics and ARIA

**First rule of ARIA: if a native element or attribute has the semantics and behavior you need, use it.** Then: never change native semantics (`<h2 role="button">`), every interactive ARIA role must be keyboard-operable, never put `aria-hidden="true"` or `role="presentation"` on something focusable, and every interactive element needs an accessible name.

| Need | Use | Not |
|---|---|---|
| Action | `<button type="button">` | `<div onClick>`, `<a href="#">` |
| Navigation | `<a href="/path">` | `<button onClick={navigate}>` |
| Modal | `<dialog>` + `showModal()` (or a primitive) | Hand-rolled div + focus trap |
| Disclosure | `<details>/<summary>` or button + `aria-expanded` | Clickable heading |
| Non-modal overlay / menu shell | `popover` attribute (Baseline 2025-01) | Absolutely positioned div without dismiss logic |
| Toggle | `<input type="checkbox" role="switch">` or `<button aria-pressed>` | Div with a class |
| Choice from a list | `<select>`, radio group | Custom listbox (only if you implement the full pattern) |

Accessible name order of preference: visible text content → `<label>` / `aria-labelledby` pointing at visible text → `aria-label` (only when nothing visible exists). The name must contain the visible label text (2.5.3 Label in Name) so voice-control users can say what they see. Widget patterns: `references/aria-patterns.md`.

## Keyboard and focus

- **Focus ring default**: `:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }`. Outlines follow `border-radius` in all current engines and survive Windows forced-colors mode; `box-shadow` rings disappear there. If you use a box-shadow ring, keep `outline: 2px solid transparent` as the forced-colors fallback. Ring contrast ≥ 3:1 against adjacent colors.
- **Skip link** as the first focusable element: "Skip to main content" → `<main id="main" tabindex="-1">`, visible on focus.
- **Tab order** follows the DOM. Fix order in markup, never with positive `tabindex`.
- **Modals**: move focus into the dialog on open (the first field, or the dialog heading for content dialogs), keep it inside while open (native modal `<dialog>` makes the rest `inert`), close on Escape, and **return focus to the trigger** on close.
- **Composite widgets** (tabs, toolbars, menus, listboxes, grids, radio groups): one Tab stop for the whole widget, arrow keys move inside it, via **roving tabindex** (`tabindex="0"` on the active item, `-1` on the rest) or `aria-activedescendant`.
- **SPA route changes**: update `document.title`, move focus to the new page's `<h1>` (with `tabindex="-1"`) or main region, and restore scroll on back/forward.
- **Deleting the focused item**: move focus to the next item, the previous one, or the list container — never let focus fall to `<body>`.
- **Sticky headers**: `scroll-padding-top` so focused elements are not hidden (2.4.11).

Details and code: `references/keyboard-focus.md`.

## Screen reader announcements

- Put a **live region in the DOM at page load** and change its text later; regions inserted together with their content are often not announced.
- `role="status"` (polite) for results, saves, counts ("12 results", "Saved"); `role="alert"` (assertive) only for urgent errors that need immediate attention.
- Toasts announce through a polite region; critical information never lives only in an auto-dismissing toast (2.2.1), and toast actions must be keyboard reachable.
- Loading: `aria-busy="true"` on the region being replaced, then a polite announcement on completion if the result is not obvious.
- Streaming/AI output: do not announce every token; announce completion or give each message a heading to navigate.
- Do not announce what focus movement already conveys, and never use live regions for purely decorative changes.

## Forms

- Every input has a visible, persistent `<label>` (placeholder is not a label). Group related inputs with `<fieldset>` + `<legend>`.
- Hints and errors are linked: `aria-describedby="hint-id error-id"`; invalid fields get `aria-invalid="true"`. Required fields use `required` (and a visible marker explained once).
- Validate on blur or submit, not on first keystroke. On submit failure, focus the first invalid field; for long forms add an error summary at the top with links to fields.
- Error text says what is wrong and how to fix it, in text, not color alone.
- `autocomplete` tokens on personal data (1.3.5): `name`, `email`, `tel`, `street-address`, `postal-code`, `cc-number`, `current-password`, `new-password`, `one-time-code`.
- Never block paste; keep submit enabled and explain errors rather than disabling it with no reason.
- Input font size ≥ 16 px on mobile to avoid iOS zoom; never disable zoom (`user-scalable=no`, `maximum-scale=1`).

## Color and contrast

**Compliance (normative)**: WCAG 2 ratios — text 4.5:1, large text 3:1, non-text UI and graphics 3:1. Check every state (hover, focus, disabled is exempt but must still be distinguishable, placeholder, selected), text on images, and **both themes**.

**Perceptual check (secondary)**: APCA is useful where WCAG 2 misjudges pairs — dark mode and thin or small type. It is **not** part of WCAG 2.x and not adopted by WCAG 3 (the algorithm there is undecided as of 2026-09), so it never replaces the WCAG 2 ratio for compliance. Commonly cited APCA guidance: about Lc 75 for body text, Lc 60 for other content text, Lc 45 for large headlines.

Never convey status by color alone: pair it with an icon, text, or pattern. Simulate protanopia/deuteranopia/tritanopia and grayscale on charts and status UI.

## Motion, targets, and user settings

- `prefers-reduced-motion`: remove travel, parallax, zoom, and autoplay; keep short opacity fades (see `motion-design`). Anything moving longer than 5 s needs pause/stop/hide (2.2.2); nothing flashes more than 3 times per second (2.3.1).
- Targets: 24×24 CSS px is the AA minimum; default to **44×44 px on touch** (`@media (pointer: coarse)`), 44×44 pt on iOS, 48×48 dp on Android with ≥ 8 dp spacing. Enlarge hit areas with padding or a pseudo-element rather than enlarging the visual.
- Text must survive 200% zoom, 320 px reflow, and the 1.4.12 text-spacing overrides (line-height 1.5, paragraph spacing 2em, letter spacing 0.12em, word spacing 0.16em). Use `rem`, avoid fixed-height text containers.
- Honor `prefers-contrast: more` (stronger borders and text) and `forced-colors: active` (system colors; don't rely on backgrounds or box-shadows for meaning). `prefers-reduced-transparency` → solid surfaces behind glass (limited browser support; enhancement).

## Mobile

Use system components first; they carry accessibility traits for free. Every custom control needs a label, a role/trait, and its state (iOS: `accessibilityLabel`, traits, `accessibilityValue`; Android Compose: `contentDescription`, `Modifier.semantics`, `Role`). Support Dynamic Type / font scaling up to the largest sizes without truncating critical text; test at iOS accessibility sizes and Android font scale ≥ 1.3 (and 2.0). Honor Reduce Motion, Reduce Transparency, Increase Contrast, and Bold Text. Group related elements so a card reads as one item, and provide custom actions instead of swipe-only gestures. Details: `references/mobile-a11y.md`, plus `ios-design` and `android-design`.

## Gotchas

- **Clickable divs and spans.** They are not focusable or keyboard-operable. Use `<button>` or `<a href>`.
- **`outline: none` / `outline-none` with no `:focus-visible` replacement.** Keyboard users lose their place (2.4.7).
- **ARIA added on top of native elements** (`<button role="button" tabindex="0">`) or ARIA that lies (`aria-expanded` never updated). Wrong ARIA is worse than none.
- **`aria-hidden="true"` on a focusable element or an ancestor of one.** Screen readers skip it while keyboard focus still lands there.
- **Icon-only buttons without a name**, and decorative SVGs without `aria-hidden="true"`.
- **Placeholder as the only label.** It disappears on typing and usually fails contrast.
- **Live region created at the moment of the update.** Often silent; render it empty at load.
- **Focus lost after closing a modal, deleting an item, or navigating.** Focus falls to `<body>` and the user starts over.
- **Positive `tabindex`.** It breaks the natural order for the whole page.
- **Disabling zoom or setting input text below 16 px on mobile.** Fails users with low vision; fix the font size instead.
- **Trusting a clean axe/Lighthouse score.** A perfect automated score is compatible with an unusable page for keyboard and screen-reader users.
- **Hover-only reveals** (row actions, tooltips with essential info). Provide focus and touch equivalents.
- **Cookie banners and chat widgets covering focused elements** (2.4.11) or trapping focus without Escape.
- **Checking contrast in the light theme only.** Dark themes often fail on muted text and borders.
- **Blocking paste or password managers in login/OTP fields.** Fails 3.3.8.

## Output format

For builds: the code, plus an **Accessibility notes** block listing semantics chosen, keyboard behavior, announcements, and what was tested.

For audits:

```
Scope: <screens/components> · Standard: WCAG 2.2 AA · Methods: <keyboard, VoiceOver 26/Safari, NVDA/Firefox, axe 4.x, zoom 200%...>

| Sev | WCAG | Location | Evidence (Observed/Inferred) | Fix |
|-----|------|----------|------------------------------|-----|
| P0  | 2.1.1 | Checkout › "Place order" (`PlaceOrder.tsx:31`) | Observed: `<div onClick>`; not reachable by Tab | Replace with `<button type="submit">` |

Summary: <n> P0 · <n> P1 · <n> P2 · <n> P3
Not checked: <criteria or areas not tested, and why>
```

Severity: P0 blocks a task for some users (keyboard trap, unlabeled primary control, missing form labels); P1 is an AA failure with a workaround; P2 is a minor AA failure or significant usability issue; P3 is best practice/AAA.

## References

| File | Read when |
|---|---|
| `references/wcag-22-checklist.md` | Running a conformance audit or checking a specific success criterion |
| `references/aria-patterns.md` | Building or fixing a custom widget: dialog, menu, tabs, combobox, listbox, accordion, tooltip, toast, grid |
| `references/keyboard-focus.md` | Implementing focus rings, focus traps, skip links, roving tabindex, SPA focus management, or keyboard shortcuts |
| `references/testing.md` | Setting up automated a11y tests in CI or running a manual keyboard / screen-reader test script |
| `references/mobile-a11y.md` | Working on iOS, Android, React Native, or Flutter accessibility, Dynamic Type, or TalkBack/VoiceOver behavior |

## Related skills

- `interaction-design` — form, error, and overlay patterns whose accessible behavior this skill specifies.
- `motion-design` — building the reduced-motion variants and vestibular-safe animation.
- `web-platform` — dark-mode implementation, color-scheme handling, and platform primitives (dialog, popover, inert).
- `design-review` — when accessibility is one pass inside a full UI audit.
- `ios-design` / `android-design` — platform accessibility APIs and review requirements.
