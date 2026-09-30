# Component checklist

What every component in a system must ship. It is adapted from the Design System Checklist (designsystemchecklist.com) and extended with the state matrix and API rules used in this collection.

## 1. The universal state matrix

Every interactive component specifies each applicable state, in both themes:

| State | Rule |
|---|---|
| Default | Uses semantic tokens only |
| Hover | Only with `@media (hover: hover)`; a small lightness step, no layout change |
| Focus-visible | 2px ring with 2px offset, ≥ 3:1 contrast, never obscured by sticky UI |
| Active / pressed | Darker fill or `scale(0.97–0.98)`, ≤ 100ms |
| Disabled | Reduced contrast, `cursor: not-allowed`, no tooltip (disabled elements can't be focused); use `aria-disabled` if it must stay focusable and explain why |
| Loading | Keeps its size and label, adds a spinner, prevents double submission |
| Selected / checked | Distinct from focus and from hover |
| Invalid / error | Text message + icon + color, never color alone; `aria-invalid` + `aria-describedby` |
| Read-only | Looks different from disabled; value is selectable and copyable |
| Empty / placeholder | Placeholder is an example, never the label |
| Dragging (if applicable) | Raised one elevation level; a keyboard or click alternative exists (WCAG 2.5.7) |

Cross-cutting requirements: RTL mirroring (logical properties), reduced motion, forced-colors mode, 200% zoom, long and short content, and touch targets ≥ 24px (44pt / 48dp on mobile).

## 2. Core components and their specific requirements

| Component | Must have |
|---|---|
| **Accordion** | Distinct open/closed icon; flexible content; subtle toggle transition; trigger is a button with `aria-expanded`/`aria-controls` |
| **Alert / banner** | Role colors with contrast; optional title; **icon** (for color-blind users); related actions; full width on mobile; `role="alert"` only for urgent messages, `status` otherwise |
| **Avatar** | Masks any image size; fallback chain (image → initials → icon); 2–3+ sizes; AA background for initials; groups/stacks; accessible label |
| **Badge** | Role colors (AA); subtle and solid variants; sizes; optional icon; dot (empty) state; positioned relative to its host |
| **Button** | Primary/secondary/ghost/destructive; sizes; icon-only needs an accessible name; hover, active, focus-visible, disabled; **loading must not change width**; a link-styled button that navigates is an `<a>` |
| **Breadcrumbs** | Current page not a link (`aria-current="page"`); collapsed middle items on overflow; custom separator hidden from AT |
| **Calendar / date picker** | Single and range selection; month switching; weekday labels; **i18n: date formats and first day of week**; arrow-key grid navigation; selection announced |
| **Card** | Flexible composition; media area; actions **or** a whole-card target (not both nested); full width on mobile; never nested in another card |
| **Carousel** | Visible previous/next controls; **peek of the next item** on mobile; touch scroll with snap; keyboard navigation; no autoplay, or pause/stop controls |
| **Checkbox** | Clickable linked label; checked, unchecked, **indeterminate**; error with text; disabled; native element or an equivalent role |
| **Combobox / select** | Label; placeholder resettable; helper and error text (+ icon); disabled; typeahead; async loading and empty results states; start icon or prefix |
| **Command palette** | Opens with a shortcut and has no open animation (it is a high-frequency action); fuzzy search; recent items; keyboard-only operation |
| **Data table** | See `data-dense-ui`: numbers right-aligned with tabular figures, sticky header, sort state (`aria-sort`), empty/loading/error rows, row actions reachable by keyboard |
| **Dialog / modal** | Title and description (`aria-labelledby`/`aria-describedby`); clear close; action area at the bottom; **focus moves inside and returns to the trigger**; Esc closes; background inert; sizes; a side-sheet variant |
| **Divider** | Horizontal and vertical; decorative by default (no role) |
| **Dropdown menu** | Opens on click and keyboard; stays in the viewport (flip); focus moves in and returns on close; Esc and Tab close it; typeahead; submenus with a hover-intent delay |
| **Empty state** | What will be here, why it matters, one primary action, optional template or sample data |
| **Icon** | `currentColor`; size scale paired with type; interactive icons wrapped in a button or link |
| **Image** | Aspect ratio; fallback; `srcset`/density; alt text or `alt=""` |
| **Link** | Inherits font; visible underline or other non-color cue in body text; external-link indicator if needed; wraps across lines |
| **List** | Ordered/unordered semantics; leading and trailing slots; announces item count |
| **Loading indicator** | Inherits color; sizes; determinate vs indeterminate; slows or goes static under reduced motion; accessible label; show-delay of about 150–300ms to avoid flicker |
| **Pagination** | Current page highlighted and not interactive; ranges with ellipsis; items-per-page; AT labels ("Page 3 of 10") |
| **Popover / tooltip** | Flips to stay in view; tooltip opens on hover **and focus** after a short delay (later tooltips in a group open instantly); hoverable and dismissible with Esc (WCAG 1.4.13); tooltips hold no interactive content |
| **Progress bar** | Visible label; determinate and indeterminate; `aria-valuenow`/`aria-valuemax` |
| **Radio group** | Always used as a group with a legend; arrow-key navigation; error text; disabled |
| **Skeleton** | Shapes match the final layout (no layout shift); composable; static under reduced motion |
| **Switch** | Label; **applies immediately** (no Save); disabled; `role="switch"` with state |
| **Tabs** | Exactly one selected; underline or pill variant; arrow keys, plus Home and End; disabled tabs; overflow handling |
| **Text field / textarea** | Visible label (click focuses the field); helper and error text; prefix and suffix; sizes; ≥ 16px text on mobile; correct `type`, `inputmode`, and `autocomplete`; never blocks paste; auto-grow for textarea (`field-sizing: content` where supported) |
| **Toast** | Role colors and icon; timeout long enough **or** a close button; pauses on hover and focus; focusable actions (Undo); stacking with a visible maximum; never the only channel for critical errors |

## 3. Component API rules

1. **Variants for intent, a separate size axis, booleans for state.** `variant`, `size`, `disabled`, `loading`, `invalid`. Hover and focus are CSS.
2. **Name props by purpose**: `tone="danger"`, `emphasis="high"`. Never `color="red"` or `bg="#f00"`.
3. **Compose with slots and subcomponents** instead of adding props (`Dialog.Title`, `Dialog.Footer`). More than about 10 appearance props means the component should be split.
4. **Polymorphism** through `asChild` or a render prop, keeping native semantics. Never a `<div onClick>`.
5. **Controlled and uncontrolled** forms (`value`/`defaultValue`/`onValueChange`, `open`/`defaultOpen`/`onOpenChange`).
6. **Forward refs and spread native props.** Default `type="button"` for buttons inside forms.
7. **No outer margin.** Layout belongs to the parent. `className` is for placement, not for overriding internals.
8. **Accessible primitives underneath** (Base UI, React Aria, Radix, or native elements). Don't hand-roll focus traps or roving tabindex, and don't mix primitive systems in one surface.
9. **Tokens only.** Variant styles map to semantic tokens. A lint rule rejects raw colors and arbitrary values in the component folder.
10. **Deprecate before removing.** Log a dev-only warning naming the replacement and keep the old API for one major version.

## 4. Documentation per component

- Purpose and when **not** to use it (point to the alternative).
- Anatomy (a labeled diagram or a list of slots).
- Props and variants table, with defaults.
- States (a rendered matrix: variant × state × theme).
- Accessibility: keyboard map, roles, announcements.
- Content guidelines: label length, casing, and verbs.
- Do/Don't examples.
- A live example or sandbox link, and a changelog.

## 5. Verification

- A catalog (Storybook, Ladle, Histoire, or a simple route) renders the variant × state × theme matrix.
- Visual regression runs on that catalog on every change.
- Automated accessibility checks (axe) run on every story, plus a manual keyboard pass for overlays and composite widgets.
- An RTL story and a 200%-zoom story exist for layout-sensitive components.

## Sources

- Design System Checklist (components, states, maintenance): https://www.designsystemchecklist.com/ ; source https://github.com/ardakaracizmeli/design-system-checklist
- Vercel Web Interface Guidelines (loading buttons, tooltips, don't pre-disable submit, forms): https://github.com/vercel-labs/web-interface-guidelines
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- WCAG 2.2 (1.4.13, 2.5.7, 2.5.8): https://www.w3.org/TR/WCAG22/
- ui-skills `baseline-ui` (accessible primitives, don't mix primitive systems): https://github.com/ibelick/ui-skills
- shadcn/ui and Base UI: https://ui.shadcn.com ; https://base-ui.com
