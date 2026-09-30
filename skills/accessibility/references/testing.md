# Accessibility Testing

A repeatable procedure: automated checks in CI to stop regressions, then manual keyboard, screen-reader, and visual passes to find what automation cannot.

## Contents
- What automation can and cannot catch
- Automated setup
- Manual keyboard script
- Screen reader script
- Visual and settings script
- Mobile checks
- Recording results

## What automation can and cannot catch

Automated rule engines (axe-core, Lighthouse's accessibility audit, which runs axe rules; WAVE; Pa11y) reliably detect missing alt attributes, missing form labels, contrast of plain text on solid backgrounds, invalid ARIA, duplicate IDs, missing `lang`, and heading-level skips. They catch only a minority of WCAG failures — commonly cited as roughly 30–40% of issues. They cannot judge:

- whether alt text or a label is *meaningful*
- keyboard operability of custom widgets, focus order, focus return, and traps
- whether announcements happen at the right moment (live regions)
- contrast of text over images/gradients, or states that only appear on interaction
- reflow, zoom, and text-spacing breakage
- cognitive issues: confusing errors, redundant entry, authentication barriers

A 100 Lighthouse accessibility score is not a claim of conformance.

## Automated setup

**Lint at author time** (JSX example): `eslint-plugin-jsx-a11y` with the recommended config. Vue: `eslint-plugin-vuejs-accessibility`. Angular: `@angular-eslint` template accessibility rules.

**Component tests** (jest/vitest + testing-library):
```js
import { axe } from "jest-axe";
test("dialog has no detectable a11y violations", async () => {
  const { container } = render(<SettingsDialog open />);
  expect(await axe(container)).toHaveNoViolations();
});
```
Query by role and name (`getByRole("button", { name: "Save" })`) — if a test cannot find an element by role and name, neither can a screen reader.

**End-to-end** (Playwright):
```js
import AxeBuilder from "@axe-core/playwright";
test("checkout is free of WCAG A/AA violations", async ({ page }) => {
  await page.goto("/checkout");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
```
Scan each state, not just the initial page: open dialogs, show errors, expand menus, then scan again. Run in both color themes.

**Keyboard smoke in E2E**: `await page.keyboard.press("Tab")` through the primary flow, asserting `document.activeElement` names in order and that Escape closes overlays and returns focus.

**CI gate**: fail on new serious/critical violations; track existing ones in a baseline file with owners rather than disabling rules.

## Manual keyboard script

1. Load the page; press Tab once. Is a skip link first? Does it work?
2. Tab through the whole page. At every stop: is focus visible, is the order logical, is anything focused that should not be (hidden, off-screen, `aria-hidden`)?
3. Operate every control with Enter/Space; widgets with arrow keys; close every overlay with Escape.
4. Open each dialog/menu: focus moves in, stays in, returns to the trigger on close.
5. Complete each primary task end to end (sign up, checkout, create, delete) without the mouse.
6. Trigger errors and confirm focus lands on the first invalid field or an error summary.
7. Scroll with a sticky header present and confirm focused elements are never fully hidden.

## Screen reader script

Pairings that match real usage: **VoiceOver + Safari** (macOS/iOS), **NVDA + Firefox or Chrome** (Windows), **TalkBack + Chrome** (Android). JAWS + Chrome/Edge where enterprise users matter.

1. Navigate by headings (VoiceOver rotor / NVDA `H`): does the outline make sense with one `<h1>`?
2. Navigate by landmarks: header, nav, main, footer present and labeled when repeated.
3. List links and form controls: every name is unique and meaningful out of context.
4. Tab through controls: each announces name, role, and state ("Notifications, switch, on").
5. Trigger async actions (save, search, add to cart, validation): is the result announced once, politely, without moving focus?
6. Open and close dialogs: the title is announced on open; background content is unreachable.
7. Images: meaningful ones described, decorative ones silent.
8. Tables: header cells announced when moving across cells.

Basic commands to know: VoiceOver on macOS toggles with ⌘F5, VO key is Ctrl+Option; NVDA insert key + arrows, `H`/`D`/`F`/`B` jump by heading/landmark/form field/button.

## Visual and settings script

- **Contrast**: check text, placeholder, icons, borders, focus rings, disabled-but-meaningful states, and text on images, in light and dark themes (DevTools contrast picker, or a checker). Use APCA as a secondary signal for dark mode and thin text.
- **Zoom 200%** (Ctrl/⌘ +): no clipped or overlapping text, no lost functionality.
- **Reflow**: 320 CSS px wide (or 1280 px at 400% zoom): single column, no horizontal page scroll except data tables/code in their own scroller.
- **Text spacing**: apply line-height 1.5, paragraph spacing 2em, letter spacing 0.12em, word spacing 0.16em (bookmarklet or user stylesheet); nothing clips.
- **Color vision**: DevTools rendering emulation for protanopia, deuteranopia, tritanopia, achromatopsia; status and charts still readable.
- **Reduced motion**: emulate `prefers-reduced-motion: reduce`; large movement, parallax, and autoplay stop.
- **Forced colors**: emulate `forced-colors: active` (Windows high contrast); focus rings, borders, and icons remain visible.

## Mobile checks

- iOS: turn on VoiceOver (triple-click side button shortcut), swipe through every element, use the rotor for headings; set the largest accessibility text size; turn on Reduce Motion, Reduce Transparency, Increase Contrast, Bold Text. Xcode's Accessibility Inspector audits simulator screens.
- Android: TalkBack swipe navigation and explore-by-touch; Accessibility Scanner app; font scale via `adb shell settings put system font_scale 1.3` (also test 2.0); "Remove animations" in accessibility settings; `adb shell cmd uimode night yes` for dark.
- Espresso's `AccessibilityChecks.enable()` and Compose UI tests with semantics matchers catch missing labels and small targets in CI.

## Recording results

For each finding record: WCAG criterion, severity (P0–P3), location (file:line or screen region), **Observed** vs **Inferred**, assistive technology and browser/OS versions used, and the fix. List what was **Not checked** (e.g., "JAWS not tested", "video captions not reviewed"). Re-test fixes with the same method that found them.

## Sources

- axe-core rules and tags: https://github.com/dequelabs/axe-core
- @axe-core/playwright: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright
- Lighthouse accessibility scoring: https://developer.chrome.com/docs/lighthouse/accessibility/scoring
- WCAG 2.2 Understanding documents: https://www.w3.org/WAI/WCAG22/Understanding/
- WAI, "Easy Checks – A First Review of Web Accessibility": https://www.w3.org/WAI/test-evaluate/preliminary/
- impeccable native audit (simulator/adb verification commands): https://github.com/pbakaus/impeccable
