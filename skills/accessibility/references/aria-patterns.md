# ARIA Widget Patterns

Keyboard and semantics contracts for the widgets agents build most, condensed from the WAI-ARIA Authoring Practices Guide (APG). Prefer a native element or a maintained primitive (React Aria, Radix, Base UI, Ariakit, Headless UI) over hand-rolling any of these. If you do hand-roll one, it must meet every line of its contract.

## Contents
- Rules of ARIA
- Dialog (modal)
- Alert dialog
- Disclosure and accordion
- Menu button
- Tabs
- Combobox (autocomplete)
- Listbox and select
- Tooltip
- Toast / status
- Switch and toggle button
- Data grid vs table
- Carousel
- Breadcrumb, pagination, current item

## Rules of ARIA

1. Use a native HTML element if one has the semantics and behavior you need.
2. Do not change native semantics unless you really must (`<h2><button>` not `<h2 role="button">`).
3. All interactive ARIA controls must be keyboard operable.
4. Do not use `role="presentation"` or `aria-hidden="true"` on a focusable element.
5. All interactive elements must have an accessible name.

ARIA changes what assistive technology announces; it adds no behavior. Every `role` you add is a promise to implement its keyboard contract and keep its states (`aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed`) in sync.

## Dialog (modal)

**Default**: native `<dialog>` opened with `showModal()` (top layer, background inert, Escape closes), or a primitive's Dialog.

| Requirement | Detail |
|---|---|
| Name | `aria-labelledby` → the dialog title; optional `aria-describedby` → the description |
| Open | Focus moves inside: first input for forms; the title or first focusable for content; the least destructive button for confirmations |
| While open | Tab/Shift+Tab cycle inside; background is `inert`; page behind does not scroll (`overscroll-behavior: contain` on the dialog) |
| Close | Escape, a visible close button, and optionally backdrop click (`closedby="any"` on newer engines) |
| After close | Focus returns to the element that opened it (or a logical successor if it was removed) |

Do not stack modals on modals; use a step inside the same dialog.

## Alert dialog

`role="alertdialog"` for interruptions that require a response (destructive confirmation). Same focus rules as a dialog; initial focus on the safest action (Cancel). Buttons name the action ("Delete 3 files" / "Cancel"), never Yes/No.

## Disclosure and accordion

- Native `<details><summary>` for simple show/hide.
- Custom: a `<button aria-expanded="false" aria-controls="panel-id">` inside the heading element (`<h3><button>…</button></h3>`); toggle `aria-expanded` and the panel's `hidden`.
- Keyboard: Enter/Space toggles. Accordions may add Up/Down/Home/End between headers (optional).
- Do not make the heading itself clickable without a button.

## Menu button

Use `role="menu"` only for application-style action menus (like a desktop app menu). **Site navigation is not a menu**: use a `<nav>` with a disclosure button and a list of links.

| Element | Semantics |
|---|---|
| Trigger | `<button aria-haspopup="menu" aria-expanded="false|true" aria-controls="menu-id">` |
| Menu | `role="menu"`, items `role="menuitem"` / `menuitemcheckbox` / `menuitemradio` |
| Keyboard | Enter/Space/Down opens and focuses the first item; Up opens and focuses the last; Up/Down move; Home/End; type-ahead by first letter; Escape closes and returns focus to the trigger; Tab closes and moves on |
| Focus management | Roving tabindex or `aria-activedescendant` |

## Tabs

| Element | Semantics |
|---|---|
| Container | `role="tablist"` with `aria-label` or `aria-labelledby` |
| Tab | `<button role="tab" aria-selected="true|false" aria-controls="panel-id">`; only the selected tab has `tabindex="0"` |
| Panel | `role="tabpanel" aria-labelledby="tab-id" tabindex="0"` (if it has no focusable content) |
| Keyboard | Left/Right (Up/Down for vertical) move between tabs; Home/End; Tab moves into the panel |
| Activation | Automatic (on arrow) when panels render instantly; manual (Enter/Space) when switching is slow |

If the "tabs" change the URL and load a different page, they are navigation links with `aria-current="page"`, not ARIA tabs.

## Combobox (autocomplete)

The hardest common widget; use a primitive whenever possible.

| Element | Semantics |
|---|---|
| Input | `role="combobox" aria-expanded aria-controls="listbox-id" aria-autocomplete="list"`, labeled with `<label>` |
| Popup | `role="listbox"` with `role="option"` children, `aria-selected` on the highlighted/selected option |
| Active option | `aria-activedescendant` on the input points at the highlighted option (focus stays in the input) |
| Keyboard | Down opens/moves; Up moves; Enter selects; Escape closes (second Escape may clear); typing filters |
| Announcements | Result count via a polite live region ("5 suggestions") after typing pauses |

## Listbox and select

Default to native `<select>` (customizable `<select>` via `appearance: base-select` is limited to newer Chromium/Safari as of 2026-09; use as enhancement). Custom listbox: `role="listbox"`, options `role="option"` with `aria-selected`; multi-select adds `aria-multiselectable="true"`; Up/Down/Home/End, type-ahead, Space toggles in multi-select.

## Tooltip

- Supplementary text only; never interactive content and never the only place essential information lives.
- Trigger references it with `aria-describedby` (the trigger still needs its own name).
- Shows on hover **and** keyboard focus; hides on Escape, blur, and pointer leave; stays open while the pointer is over the tooltip (1.4.13).
- Disabled buttons cannot be focused, so they cannot show tooltips; explain disabled state in visible text instead, or use `aria-disabled="true"` to keep the control focusable.
- Declarative `popover="hint"` + `interestfor` is limited to newer Chromium as of 2026-09; enhancement only.

## Toast / status

- A persistent live region (`role="status"` or `aria-live="polite"`) exists from page load; toasts render inside it.
- Errors needing immediate attention: `role="alert"`, sparingly.
- Actions in a toast (Undo) are reachable by keyboard (a documented shortcut such as F6 to the region, or a focusable container) and the timer pauses on hover and focus.
- Timeouts long enough to read (≥ ~5 s, longer for longer text); anything critical also appears persistently (2.2.1).

## Switch and toggle button

- Switch (setting applies immediately): `<input type="checkbox" role="switch">` with a `<label>`, or `<button role="switch" aria-checked="true|false">`. Space toggles.
- Toggle button (pressed state of an action, e.g. Bold): `<button aria-pressed="true|false">`. The label stays constant ("Bold"), the state changes.
- Never change the label and the state at the same time ("Mute" → "Unmute" plus `aria-pressed`) — pick one.

## Data grid vs table

- Static data: a plain `<table>` with `<caption>`, `<th scope="col|row">`. Sortable columns: a `<button>` in the header and `aria-sort="ascending|descending"` on the `<th>`.
- Interactive spreadsheet-like editing with cell navigation: `role="grid"` with arrow-key cell navigation (roving tabindex), Enter to edit, Escape to cancel. Only when users truly need cell-level navigation; otherwise a table with buttons in cells is simpler and better supported.

## Carousel

- Pause control for any auto-rotation (2.2.2); auto-rotation stops on hover and focus.
- Previous/next buttons with names; slide picker buttons with `aria-label="Slide 3 of 5"` and `aria-current` or `aria-selected`.
- Container: `aria-roledescription="carousel"` and a label; each slide `role="group"` with `aria-roledescription="slide"` and a label.
- Hidden slides are `inert` or otherwise unfocusable.

## Breadcrumb, pagination, current item

- `<nav aria-label="Breadcrumb">` with an ordered list; the current page link gets `aria-current="page"`.
- Pagination: `<nav aria-label="Pagination">`, links named "Page 3", current page `aria-current="page"`, previous/next named in text.
- Current navigation item in any nav: `aria-current="page"` (not a class alone).

## Sources

- WAI-ARIA Authoring Practices Guide (patterns): https://www.w3.org/WAI/ARIA/apg/patterns/
- Using ARIA (rules of ARIA use): https://www.w3.org/TR/using-aria/
- WAI-ARIA 1.2: https://www.w3.org/TR/wai-aria-1.2/
- Design System Checklist (component a11y rows): https://github.com/ardakaracizmeli/design-system-checklist
- GoogleChrome modern-web-guidance (dialog, popover, customizable select status): https://github.com/GoogleChrome/modern-web-guidance
- ibelick ui-skills `fixing-accessibility`: https://github.com/ibelick/ui-skills
