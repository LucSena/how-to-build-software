# Audit Checklists

Item-by-item checklists for each review pass. Tick only what you verified; anything unverified goes to Not checked. Grep signatures help find candidates in source; each candidate still needs confirmation before it becomes a finding.

## Contents
- Evidence capture
- Accessibility pass
- Visual pass
- Slop catalog (as of 2026-09)
- Copy pass
- Interaction-states pass
- Performance and implementation pass
- Consistency pass
- Native platform pass (iOS / Android)

## Evidence capture

| Platform | Capture |
|---|---|
| Web | 1440 px and 390 px full-page screenshots; first viewport at 1280 and 1600 px; dark mode; 200% zoom; keyboard walk recording or notes; console errors |
| iOS | `xcrun simctl io booted screenshot out.png`; `xcrun simctl ui booted appearance dark`; largest Dynamic Type size; iPhone and iPad |
| Android | `adb exec-out screencap -p > out.png`; `adb shell cmd uimode night yes`; `adb shell settings put system font_scale 1.3` (and 2.0); phone and tablet/foldable |
| Design file / screenshot only | Note that runtime behavior (states, motion, keyboard, performance) is Not checked unless shown |

Automated browser tools (Playwright, the agent's browser) can capture these consistently; record tool and engine in the report.

## Accessibility pass

- [ ] Every interactive element reachable and operable by keyboard; order matches the visual order.
- [ ] Focus visible on every element (`:focus-visible`), ≥ 3:1 against the background, not hidden by sticky UI.
- [ ] Overlays: focus moves in, Escape closes, focus returns to the trigger.
- [ ] Accessible names: icon-only buttons, inputs (visible `<label>`), links with meaningful text.
- [ ] Semantics: landmarks, one `<h1>`, no skipped heading levels, native buttons/links (no clickable divs).
- [ ] Contrast: body and secondary text 4.5:1, large text 3:1, UI boundaries/icons/focus 3:1 — in every state and both themes, including text over images.
- [ ] Color never the only signal (status, errors, links in body text, chart series).
- [ ] Targets ≥ 24×24 CSS px; 44 px on touch layouts; adequate spacing.
- [ ] Forms: errors in text, linked to fields, input preserved, paste allowed, `autocomplete` on personal fields.
- [ ] Async changes announced (status regions for saves, results, errors).
- [ ] Reduced motion honored; nothing auto-moves > 5 s without pause; no flashing.
- [ ] 200% zoom and 320 px reflow without loss or horizontal page scroll.

Grep candidates: `outline: none`, `outline-none`, `onClick` on `div`/`span`, `<img` without `alt`, `tabindex="[1-9]`, `user-scalable=no`, `maximum-scale=1`, `onPaste` + `preventDefault`, `aria-hidden="true"` near focusable elements.

## Visual pass

- [ ] **Squint test**: blurred, the primary element, secondary elements, and groups are still identifiable in order.
- [ ] One primary action per view; secondary actions visually quieter.
- [ ] Type: a clear scale (heading steps ≥ ~1.2× apart), body ≥ 16 px on web (17 pt iOS, 16 sp Android body), line-height ~1.5 for body, measure ≤ ~75 characters, no more than 2–3 weights per screen.
- [ ] Spacing: consistent scale (4 px base); tighter within groups than between them; more space above headings than below.
- [ ] Alignment: shared edges; optical alignment of icons and play glyphs.
- [ ] Color: a clear strategy (restrained neutrals + one accent, or deliberate brand color); tinted, consistent neutrals; no gray text on colored backgrounds.
- [ ] Radius and elevation: a small scale tied to component size; nested radius concentric (inner = outer − padding); shadows *or* hairlines per surface, not both by default.
- [ ] Icons: one family, one stroke weight, sized to text; no emoji as icons.
- [ ] Imagery: real, subject-specific, correctly cropped, sized without layout shift.
- [ ] Dark mode designed (elevation by lighter surfaces, desaturated accents), not inverted.
- [ ] Browser surfaces themed: `::selection`, caret, scrollbars, focus ring, `theme-color`.
- [ ] Responsive: layout restructures (not just shrinks) at 390 px; no horizontal page scroll; safe areas respected.

## Slop catalog (as of 2026-09)

A pattern is a finding when it is a reflex default that weakens the product's identity or usability, not merely because it appears. This list ages quickly; the test that does not age is: *is this the most probable output for this category, or a committed choice?*

**Palette and surface**
- Purple/violet/indigo-to-blue gradients; accent hue in the indigo–violet band by default.
- Gradient text on headings or metrics.
- Radial glows, blurred orbs, mesh-gradient blobs behind heroes; colored glow shadows in dark mode.
- Decorative glassmorphism (glass as ornament rather than to solve layering).
- The same soft gray shadow under every card; hairline border plus wide diffuse shadow on the same element.
- Decorative grid-line backgrounds or stripes that encode nothing.
- Second-order defaults: warm cream + high-contrast serif + terracotta accent; near-black + a single acid-green/vermilion accent; broadsheet hairlines with zero radius.

**Typography**
- Overused faces as the brand voice by reflex (as of 2026-09: Inter, Roboto, Open Sans, Geist, Space Grotesk, Instrument Sans/Serif, Fraunces, Plus Jakarta Sans, DM Sans). Fine as deliberate workhorse UI faces.
- Big italic serif hero headline as the default "premium" move.
- Tracked uppercase eyebrow labels above every heading; `01 / 02 / 03` markers on non-sequential content; middle-dot meta strings everywhere; "→" appended to every link. Allowed when they encode real information (a real sequence or category).
- Single accented word in a headline; oversized full-sentence H1.
- Flat hierarchy (adjacent sizes indistinguishable).

**Layout and components**
- Centered hero → logo strip → three identical icon-tile cards → testimonials → three-tier pricing → CTA → four-column footer as the entire page.
- Icon tile stacked above every card heading.
- Nested cards; one large radius on everything; pill radii on cards.
- Thick colored left border ("side stripe") on cards, callouts, and alerts.
- Hero metric triptych (big number + small label ×3) with invented stats.
- Div-built fake product UI (fake terminals, fake dashboards) instead of real screenshots.
- Bento grids with equal cells or empty cells.

**Motion**
- Fade-and-rise entrance on every section; hover lift on every card; image zoom on hover by default.
- Bounce/elastic easing; pulsing dots, floating or breathing idle loops; marquees.
- Content hidden until a scroll-reveal script runs.

**Copy and content**
- Buzzwords: seamless, supercharge, unleash, unlock, elevate, next-gen, world-class, cutting-edge.
- Aphoristic cadence repeated across sections ("Not a tool. A platform.").
- Generic CTAs: "Get started", "Learn more", "Submit" where an outcome verb fits.
- Placeholder people and brands (John Doe, Acme), lorem ipsum, identical dates.
- **Fabricated** testimonials, customer logos, ratings, or metrics — always P1 or higher (trust and legal risk), and never "fixed" by inventing more plausible ones; replace with real content or clearly labeled placeholders.
- Emoji in UI chrome.

## Copy pass

- [ ] Buttons name the outcome ("Save changes", "Create invoice"); the same verb carries through ("Publish" → "Published").
- [ ] Errors: what happened, why if useful, how to fix; no blame, no bare codes.
- [ ] Empty states: what goes here, why it matters, one next action.
- [ ] One term per concept across the product; sentence case consistently (or the project's documented convention).
- [ ] No lorem ipsum, no placeholder names in shipped UI; demo data labeled as such.
- [ ] Loading text names the real operation ("Saving…", "Generating report…").

## Interaction-states pass

**Controls** — each of: default · hover (pointer devices only) · focus-visible · active/pressed · disabled (with a reason visible nearby) · loading (label kept, no size change) · selected/checked · error.

**Data views** — each of: loading (skeleton matching layout, delayed ~150–300 ms to avoid flicker) · empty first-use · empty no-results (echo query, clear filters) · error with retry · partial/stale · ideal · very long content · missing images/avatars.

**Flows**
- [ ] Double submission prevented; optimistic updates roll back with an error on failure.
- [ ] Refresh or Back mid-flow keeps state (URL or saved draft).
- [ ] Destructive actions: undo when reversible; specific confirmation when irreversible.
- [ ] Offline/slow network: clear indicator, queued or retryable actions.
- [ ] Permission-limited views explain why and how to get access.
- [ ] Toasts not the only channel for critical information; pause on hover/focus.
- [ ] Unsaved-changes warning where work can be lost.

## Performance and implementation pass

- [ ] Images have dimensions; LCP image not lazy-loaded and prioritized.
- [ ] No visible layout shift on load, font swap, or state change.
- [ ] Interactions respond within ~100 ms (pressed state) and resolve or show progress within ~400 ms–1 s.
- [ ] Animations use transform/opacity; no `transition: all`; reduced-motion variant present.
- [ ] Long lists virtualized; no jank when scrolling on a mid-range phone.
- [ ] No console errors or warnings on load and during the main flow.
- [ ] Styles use tokens; no scattered hard-coded hex values, z-index spam (`9999`), or magic pixel widths.
- [ ] Responsive branches exist for every multi-column layout; no `overflow-x: hidden` masking overflow.
- [ ] Hover effects gated behind `(hover: hover)`; touch has `:active` feedback.

Grep candidates: `transition: all`, `z-index: 9999`, `#[0-9a-fA-F]{6}` in component files (vs tokens), `100vh`, `loading="lazy"` on hero images, `<img` without `width`, `console.log`.

## Consistency pass

- [ ] Components come from the design system; no one-off re-implementations of existing components.
- [ ] Tokens used for color, spacing, type, radius, shadow, motion; no near-duplicates (`#111` and `#121212`).
- [ ] Same function looks and behaves the same across screens (buttons, destructive actions, links, form fields, empty states).
- [ ] Terminology and icon meanings consistent.
- [ ] Matches DESIGN.md rules and documented exceptions.

Classify each drift: **missing token** (system needs a new value) · **one-off implementation** (use the existing component) · **conceptual mismatch** (flow/IA differs from comparable areas) · **local defect** (incomplete implementation). The fix differs by class; report the class with the finding.

## Native platform pass (iOS / Android)

**Platform conformance (critical)**
- [ ] iOS: tab bar for 2–5 top-level sections (never for actions); navigation stack with large titles where appropriate; edge-swipe back never disabled; sheets vs full-screen covers chosen deliberately with swipe-to-dismiss honored; SF Symbols; system materials rather than hand-rolled glass.
- [ ] Android: navigation bar (compact) / rail or drawer (medium/expanded); predictive back works everywhere; edge-to-edge with correct insets; one FAB for one primary action; Material type roles in `sp`; dynamic color with a static fallback.
- [ ] No cross-platform leakage (iOS controls on Android or the reverse) unless the brand deliberately unifies them.

**Accessibility and settings**
- [ ] VoiceOver/TalkBack: labels, roles, states, logical order, grouped cards, custom actions for swipe-only actions.
- [ ] Largest text sizes: no truncation of critical text; layouts reflow.
- [ ] Targets 44 pt / 48 dp; Reduce Motion / Remove animations honored; dark mode designed.

**Adaptivity and performance**
- [ ] Tablet/foldable layouts restructure (list-detail), not stretched phone UI; multi-window works.
- [ ] Safe areas: nothing under the notch, Dynamic Island, home indicator, or system bars.
- [ ] Startup feels fast; lists virtualized (`List`/`LazyColumn`/`FlatList`); no dropped frames on scroll.
- [ ] Permissions requested in context after showing value; offline states clear.

## Sources

- impeccable `audit`, `audit.native`, `critique`, `polish`, `craft-floor` references: https://github.com/pbakaus/impeccable
- ibelick ui-skills `improve-ui` (evidence proof gate), `fixing-accessibility`, `baseline-ui`: https://github.com/ibelick/ui-skills
- rams-plugin design review checklist: https://github.com/rams-design/rams-plugin
- Vercel Web Interface Guidelines: https://github.com/vercel-labs/web-interface-guidelines
- Anthropic `frontend-design` skill (calibration list of AI defaults): https://github.com/anthropics/skills/tree/main/skills/frontend-design
- samber/cc-skills `frontend-design-deslop` slop checklist: https://github.com/samber/cc-skills
- Taste Skill (anti-slop catalog): https://github.com/Leonxlnx/taste-skill
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Design System Checklist: https://www.designsystemchecklist.com/
