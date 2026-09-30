# Overlays, navigation, and keyboard

## Contents
- Overlay decision rules
- Implementing each overlay (focus, dismissal, ARIA)
- Mobile overlays: bottom sheets and full-screen
- Navigation structures
- URL as state
- Command palette
- Keyboard shortcuts

---

## Overlay decision rules

Ask in order; stop at the first "yes".

1. Can it be **inline** (expand in place, inline edit, disclosure)? → Inline. Keeps context and needs no focus management.
2. Is it a **short label** for an icon or truncated text? → Tooltip.
3. Is it **small, contextual, and anchored** to a trigger (filters, color picker, quick edit, date)? → Popover or menu.
4. Does the user need to **keep the list or page visible** while inspecting or editing an item? → Side sheet/drawer.
5. Must the user **decide before anything else** can happen, and the task is short? → Modal dialog (alert dialog for irreversible confirmation).
6. Otherwise (long, multi-section, shareable, or worth bookmarking) → A **page/route**.

Modals interrupt flow; each one needs a one-line justification. Never open a modal from a modal; replace the content or navigate instead.

## Implementing each overlay

### Modal dialog
- Native `<dialog>` with `showModal()` gives top-layer rendering, `::backdrop`, Esc to close, and inert background; or use an accessible primitive.
- Focus moves into the dialog on open (the first field, or the title for content dialogs) and **returns to the trigger** on close.
- Label with `aria-labelledby` (title) and `aria-describedby` (body).
- Close via Esc, a visible close button, and (for non-destructive content) backdrop click. If there is unsaved input, confirm before discarding.
- Actions at the bottom; primary on the side your platform expects, consistently across the product.
- Lock background scroll; `overscroll-behavior: contain` inside.
- Size to content; on small screens, go full-screen or become a bottom sheet.

### Alert dialog (confirmation)
- `role="alertdialog"`; title states action and object ("Delete 3 files?"); body states consequence ("This can't be undone.").
- Buttons use verbs ("Delete files" / "Cancel"), never Yes/No/OK. Initial focus on the least destructive action.
- Backdrop click does not confirm; Esc cancels.
- For high-impact deletes, require typing the resource name.

### Side sheet / drawer
- For detail views and medium forms that relate to the list behind them.
- Modal variant (focus trapped, backdrop) when editing; non-modal variant (no trap, list still usable) for inspection panels.
- Reflect the open item in the URL (`/invoices?open=inv_123` or `/invoices/inv_123`) so refresh, Back, and share work.
- Width that keeps the list visible on desktop (roughly 400–640 px); full-screen on mobile.

### Popover
- HTML `popover` attribute (Baseline since 2025) gives top-layer rendering and light dismiss; CSS anchor positioning places it next to the trigger where supported, otherwise use a positioning library.
- Trigger has `aria-expanded` and `aria-controls`; focus moves into the popover if it has interactive content and returns to the trigger on close.
- Stays within the viewport (flip and shift); dismiss on Esc and outside click.

### Menu / dropdown
- For actions, not navigation (navigation uses links).
- Arrow keys move, Enter/Space activate, type-ahead jumps, Esc closes and returns focus.
- Destructive items separated at the bottom; items that open further input end with "…".

### Tooltip
- Supplementary only: the name of an icon button, a truncated value, a shortcut hint.
- Opens on hover **and** keyboard focus; delay the first tooltip (~500 ms is common) and open neighbors instantly once one is open; dismissible with Esc and hoverable (WCAG 1.4.13).
- No interactive content, no essential information (touch users rarely see it), no tooltips on disabled buttons (they cannot be focused).
- An icon-only button still needs an `aria-label`; the tooltip does not replace it.

## Mobile overlays

- **Bottom sheet** for choices and short tasks: drag handle, dismiss by swipe down, backdrop tap, and a visible close or cancel button (swipe is never the only way). Detents (half/full) for content that can expand.
- **Action sheet** for a short list of actions on an item, destructive action separated and labeled.
- **Full-screen modal** for multi-field tasks on phones, with Cancel and Save in the header.
- Respect safe areas (`env(safe-area-inset-bottom)`) and the on-screen keyboard; keep the primary action visible above it.
- Native platform components (iOS sheets, Material bottom sheets) beat web imitations in native apps; see `ios-design` / `android-design`.

## Navigation structures

| Structure | Use when | Rules |
|---|---|---|
| Top nav bar | Marketing sites, small apps (≤ ~6 items) | Logo left linking home; current section marked; collapse to a menu on narrow screens but keep the primary CTA visible |
| Sidebar | Apps with 5+ areas or user-created items (projects, channels) | Collapsible to icons with tooltips; group with headings; current item marked; account at the bottom or top-right |
| Bottom tab bar | Mobile apps with 3–5 top destinations | Icons + labels; tapping the active tab scrolls to top / pops to root; overflow into a "More" tab |
| Tabs | Peer views of one object (Overview / Activity / Settings) | ≤ ~6; URL-driven; one always selected; do not use tabs as a stepper |
| Segmented control | Switching display mode (List / Board) or a small filter | 2–5 options; immediate effect |
| Breadcrumbs | Hierarchies deeper than 2 levels | Current page last and not a link; collapse middle levels when long |
| Stepper | Linear tasks with dependent steps | Step names and count; Back without loss |
| Hamburger / hidden menu | Only when space forces it | NN/g found hidden nav reduces discoverability; expose the top few items |

Every screen answers: where am I, where can I go, and how do I get back.

## URL as state

- Put filters, sort, search query, tab, pagination cursor, selected item, and open panels in the URL (query string or path).
- Push history for navigation-like changes (opening an item, switching tabs); replace history for continuous changes (typing in a filter) to avoid polluting Back.
- Restore scroll position on Back/Forward; keep list position when returning from a detail view.
- Use real links for navigation so Cmd/Ctrl-click, middle-click, and "Copy link" work.
- Update the document `<title>` on route change and move focus to the main heading for screen readers.

## Command palette

Build one when the app has many destinations or actions and repeat users (typically productivity, developer, and admin tools).

- Opens with ⌘K on macOS / Ctrl+K elsewhere; also reachable from a visible search/command button (discoverability).
- One input with fuzzy search across navigation (pages, records) and commands (create, toggle, assign), grouped by type; recent and suggested items when the query is empty.
- Each row shows its shortcut, so the palette teaches shortcuts.
- Arrow keys move, Enter runs, Esc closes (or goes back one level for nested commands), Tab may autocomplete.
- Context-aware: commands relevant to the current selection come first.
- No open/close animation, results in under ~100 ms for local items; async results stream in without reordering what the user is about to select.
- Accessible pattern: combobox with a listbox (`aria-activedescendant`).

## Keyboard shortcuts

- Every function reachable with Tab/Shift+Tab, Enter/Space, arrow keys within composite widgets, and Esc.
- Shortcuts for frequent actions only; show them in tooltips, menus, and the palette; provide a "?" shortcut sheet.
- Do not override browser/OS shortcuts (⌘T, ⌘W, ⌘L, ⌘R, ⌘Q, Ctrl+Tab). Scope shortcuts so they never fire while typing in an input.
- Single-character shortcuts must be turn-off-able, remappable, or active only when the component has focus (WCAG 2.1.4 Character Key Shortcuts).
- Use `event.key` with layout awareness for non-QWERTY keyboards, and show platform-specific symbols (⌘ vs Ctrl).
- Keyboard-initiated actions do not animate (they happen many times a day).

## Sources

- WAI-ARIA Authoring Practices Guide (dialog, alertdialog, menu, combobox, tabs, tooltip patterns): https://www.w3.org/WAI/ARIA/apg/patterns/
- MDN, `<dialog>` element: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
- MDN, Popover API: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- WCAG 2.2 SC 1.4.13 Content on Hover or Focus, 2.1.4 Character Key Shortcuts: https://www.w3.org/TR/WCAG22/
- NN/g, "Hamburger Menus and Hidden Navigation Hurt UX Metrics": https://www.nngroup.com/articles/hamburger-menus/
- Vercel Web Interface Guidelines (URL as state, deep-link everything, links are links, tooltip timing, locale-aware shortcuts): https://github.com/vercel-labs/web-interface-guidelines
- Design System Checklist (modal, dropdown, tooltip, tabs criteria): https://www.designsystemchecklist.com/
- Emil Kowalski, "You Don't Need Animations" (no animation on high-frequency keyboard actions): https://emilkowal.ski/ui/you-dont-need-animations
