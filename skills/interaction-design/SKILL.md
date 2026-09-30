---
name: interaction-design
description: Use when building or fixing how UI behaves, not just how it looks — interaction states (hover, focus, active, disabled, loading, error), forms and validation, feedback (toasts, optimistic UI, undo vs confirm), loading, empty, and error states, overlays (modal, sheet, drawer, popover, tooltip), navigation patterns, keyboard shortcuts and command palettes, and microcopy/UX writing (button labels, error messages, empty-state copy). Also use when the user says "the form feels clunky", "add loading states", "what should this error say", "should this be a modal?", "add a toast", "make it feel responsive", or "handle the empty state", even for a single component. For principles and dark-pattern checks use ux-principles; for animation timing and easing use motion-design; for WCAG specifics use accessibility; for tables and dashboards use data-dense-ui.
license: MIT
metadata:
  version: "1.0.1"
  category: design
  related: "ux-principles accessibility motion-design data-dense-ui ai-interface-design frontend-architecture"
---

# Interaction Design

An interface is a conversation: the user acts, the system answers. Most "clunky" UI is a conversation with missing replies: a button that gives no sign it was pressed, a form that erases input on error, a spinner that flashes for 80 ms, a modal that traps without an exit, a label that changes its verb halfway through a flow. This skill specifies every state and every reply up front, so the interface feels fast, forgiving, and predictable.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Check the design system first: if it already provides a dialog, toast, form field, or command palette, use and extend it rather than hand-rolling a second one. Prefer accessible primitives (native elements, or headless libraries such as Radix, React Aria, Base UI, Ark) for anything with focus management.

## Core principles

1. **Every action gets an answer within 100 ms.** A pressed state, an optimistic change, or a pending indicator; silence reads as "broken".
2. **Design all states before the happy path is done.** Loading, empty, error, partial, disabled, and offline are part of the feature, not polish.
3. **Never lose user input.** Failed submits, navigation, and errors preserve what was typed; unsaved changes warn before leaving.
4. **Prefer undo to confirmation.** Confirm only the irreversible; for everything else act immediately and offer Undo.
5. **Choose the lightest surface that works.** Inline > popover > sheet/drawer > modal > new page for blocking decisions; modals are the exception, not the default.
6. **One verb per action, everywhere.** The button says "Publish", the toast says "Published", the menu says "Publish"; users map words to outcomes.
7. **Keyboard is a first-class input.** Everything works without a mouse; frequent actions get shortcuts, and nothing requires them.

## Workflow

- [ ] **Inventory interactions**: list every control, data view, and async action on the screen.
- [ ] **Fill the state matrix** (below) for each control and each data view. Missing cells are bugs.
- [ ] **Decide feedback per async action**: optimistic, pending-in-place, or background job (see decision table). Note the failure path.
- [ ] **Choose surfaces** with the overlay table; justify every modal in one line.
- [ ] **Write the copy**: labels, buttons, errors, empty states, toasts, confirmations, using the microcopy rules. Check verb consistency across the whole flow.
- [ ] **Wire keyboard and focus**: tab order, Esc behavior, focus on open/close, shortcuts.
- [ ] **Break it on purpose**: throttle the network, fail the API, submit invalid data, open with no data, double-click submit, press Back mid-flow. Fix every dead end and repeat.

## Interaction state matrix

Every interactive component specifies these states. Details and CSS/ARIA wiring: `references/states-and-feedback.md`.

| State | Trigger | Visual rule | Implementation notes |
|---|---|---|---|
| Default | — | Clear affordance (looks clickable/editable) | Native element first (`button`, `a`, `input`) |
| Hover | Pointer over | Small tone shift; never the only cue | Gate with `@media (hover: hover) and (pointer: fine)` so touch does not stick |
| Focus-visible | Keyboard focus | 2 px ring with offset, ≥ 3:1 contrast, not hidden by sticky UI | `:focus-visible`, never `outline: none` without replacement |
| Active / pressed | Pointer or key down | Immediate (≤ 100 ms): slight darken or scale ~0.97 | No layout shift (do not change weight or border width) |
| Disabled | Action unavailable | Reduced contrast plus a reason nearby | Prefer enabled-with-explanation; `aria-disabled` keeps it focusable for a tooltip |
| Loading / pending | Request in flight | Keep the label, add a spinner or "Saving…"; size unchanged | Block double submit; send an idempotency key |
| Selected / checked | User choice | Distinct from focus and hover | `aria-selected`, `aria-pressed`, `aria-checked` as appropriate |
| Invalid / error | Validation failed | Icon + color + text next to the field | `aria-invalid`, message linked with `aria-describedby` |
| Success | Completed | Brief inline confirmation (check, "Saved") | Announce with `role="status"` |
| Read-only | Viewable, not editable | Looks like text, still selectable and copyable | `readonly`, not `disabled`, so it is focusable and submitted |
| Dragging | Drag in progress | Lifted item, clear drop targets | Provide a non-drag alternative (WCAG 2.5.7); `inert` on the rest if needed |

Data views (lists, tables, cards, dashboards) additionally need: **loading, empty (first use), empty (no results/filtered), partial, error, offline/stale, and no-permission** states.

## Feedback and loading

| Wait | Pattern |
|---|---|
| Expected < ~300 ms | No indicator. Use a show-delay (~150–300 ms) so fast responses never flash a spinner. |
| Region or page content with known layout | Skeleton that mirrors the final layout exactly (no layout shift). Once shown, keep ≥ ~300–500 ms. |
| Single component (button, small panel) | Inline spinner or "Saving…" in place; label and size unchanged. |
| > ~10 s or measurable (upload, export, AI run) | Determinate progress with estimate, Cancel, and "Continue in background" plus a completion notification. |
| Streaming result | Render progressively; show a stop control (see `ai-interface-design`). |

Never show a full-page spinner after first load; load per region. Skeleton shimmer is subtle and stops under `prefers-reduced-motion`.

## Optimistic UI, undo, and confirmation

| Action | Default | Example |
|---|---|---|
| Likely to succeed, cheap to reverse (toggle, like, rename, reorder, move) | **Optimistic**: update immediately, reconcile on response, roll back with an error + Retry on failure | Star a file |
| Reversible destructive (archive, delete to trash, remove from list) | **Act + Undo**: do it now, show "Deleted 3 files · Undo" for ~5–10 s; hard-delete after the window | Delete email |
| Irreversible, low blast radius | **Confirm** in an alert dialog naming action and object; buttons use verbs | "Delete draft 'Q3 plan'?" · Delete draft / Cancel |
| Irreversible, high blast radius (delete project, account, production data; mass send) | **Type-to-confirm** with the exact consequence and count; offer export first | Type `acme-prod` to delete |
| Money, legal, or external side effects (pay, send, publish to customers) | **Review step** showing exactly what will happen, then commit; never optimistic | "Send to 1,204 customers" |

Never use "Yes / No / OK" on confirmation buttons. Never confirm something that has Undo.

## Toasts

- **Use for** background or cross-surface outcomes (saved elsewhere, job finished, copied, undoable delete). Prefer inline feedback where the action happened (a check on the copy button, "Saved" by the form).
- **Never for** errors that need action, validation errors, or anything the user must read to continue. Those go inline or in a banner that stays.
- **Timing**: ~4–6 s, plus ~1 s per extra 10–15 words; pause on hover, on focus, and while the tab is hidden. Toasts with actions (Undo) stay long enough to use them.
- **Behavior**: one consistent position; stack with at most ~3 visible; actions reachable by keyboard; `role="status"` (polite) for info, `role="alert"` only for urgent failures.

## Empty and error states

- **First-use empty**: what will appear here, why it helps, and one primary action (plus template, sample data, or import). "No invoices yet. Create your first invoice or import from CSV."
- **No results**: echo the query and active filters, offer "Clear filters", suggest spelling fixes, never a blank area.
- **Error**: what happened, why if known, how to fix, a Retry or alternative, input preserved, an error ID as secondary text for support. One failed widget must not blank the page; isolate errors per region.
- **Offline / stale**: say so ("Offline. Showing data from 10:42."), queue safe actions, and sync with feedback when back.
- **No permission**: say who can grant access and offer "Request access", instead of hiding the page or showing a 404.

## Forms: the defaults

Full rules, validation state machine, and `autocomplete`/`inputmode` table: `references/forms.md`.

- Visible label above every field; placeholder only for an example value; hints between label and input, linked with `aria-describedby`.
- Single column; group related fields with `<fieldset>`/`<legend>`; mark optional fields (or required, consistently).
- Validate on blur, then re-validate on every input once a field has an error ("reward early, punish late"); `:user-invalid` gives this timing in CSS.
- Keep submit enabled; on submit, show all errors inline, focus the first invalid field, and add a linked error summary on long forms.
- Correct `type`, `inputmode`, `autocomplete`, `enterkeyhint`; input font-size ≥ 16 px on mobile; never block paste; never disable zoom.
- Button labels name the outcome ("Create account", "Pay $42.00"), never "Submit".

## Overlays: which surface

Full focus rules and mobile variants: `references/overlays-navigation.md`.

| Need | Use | Not |
|---|---|---|
| Brief supplementary label for an icon or truncated text | **Tooltip** (hover and focus, short delay, no interactive content) | Essential info, disabled buttons, touch-only UI |
| Small contextual controls anchored to a trigger (filter, date, quick edit) | **Popover** (non-modal, light dismiss, focus moves in and returns) | Long forms |
| List of actions or options from a trigger | **Menu / dropdown** (arrow keys, type-ahead) | Navigation between pages (use links) |
| Edit or inspect an item while keeping the list in view; medium-length form | **Side sheet / drawer** | Blocking decisions |
| Choose among actions on mobile; short task anchored to the thumb | **Bottom sheet** (drag handle, swipe and button to dismiss) | Desktop default |
| Decision that must be made before continuing; short focused task | **Modal dialog** (focus trap, Esc, return focus) | Field errors, content people want to reference or share |
| Confirm an irreversible action | **Alert dialog** (initial focus on the safe action) | Reversible actions (use Undo) |
| Multi-section task, long form, anything worth a URL | **Full page / route** | Squeezing into a modal |

Never stack a modal on a modal. Overlays that hold state (a drawer showing a record) should be reflected in the URL so Back and share work.

## Navigation

- Sidebar for apps with 5+ top-level areas; top nav for marketing sites and small apps; bottom tab bar (3–5 items) for mobile apps.
- Tabs for peer views of the same object (URL-driven); segmented control for switching the display mode of one view; stepper for linear tasks; breadcrumbs when hierarchy is deeper than two levels.
- Always mark the current location. Navigation uses real links (`<a>`), so open-in-new-tab, middle-click, and copy-link work.
- URL is state: filters, tabs, pagination, selection, and open panels are deep-linkable; Back/Forward and scroll position restore correctly.

## Microcopy

Full style guide with patterns per component: `references/ux-writing.md`.

- **Specific verbs**: "Save changes", "Send invite", "Delete project". Buttons ≤ ~3 words, verb first.
- **Same verb through the flow**: Publish → "Publishing…" → "Published". Menu items that open further input end with an ellipsis ("Rename…").
- **Sentence case** for UI labels, buttons, and headings by default (a documented brand choice of Title Case is fine if applied consistently).
- **Errors explain the fix**: "Enter a date after today", not "Invalid date"; no blame, no "Oops", no apology theater.
- **User's words, not the system's**: "notifications", not "webhook config"; no raw codes or enum names.
- **Success is calm**: "Invoice sent", no exclamation marks. Numbers as numerals, units with a non-breaking space ("10 MB").

## Keyboard and command palette

- Tab order follows visual order; Esc closes the topmost layer; Enter submits single-field forms; ⌘/Ctrl+Enter submits textareas.
- Command palette (⌘K / Ctrl+K) for apps with many destinations or actions: fuzzy search over navigation and commands, recent items first, shortcut hints shown on each row, arrow keys + Enter, no open/close animation (it is used many times a day).
- Show shortcuts in tooltips and menus; never override browser or OS shortcuts (⌘T, ⌘W, ⌘L); single-character shortcuts must be disableable, remappable, or active only on focus (WCAG 2.1.4); adapt to non-QWERTY layouts and show platform symbols.

## Gotchas

- **Pre-disabled submit buttons.** Users cannot tell what is missing. Keep submit enabled and show errors on click.
- **Validation on every keystroke from the first character.** "Invalid email" after typing "j" is hostile; validate on blur first.
- **Clearing the form on a failed submit.** A critical failure; always preserve input.
- **Spinner flash.** Showing a loader for a 90 ms request makes the UI feel slower; add a show-delay and a minimum display time.
- **Skeletons that do not match the content.** They cause layout shift and look broken; mirror the real layout or use a simpler placeholder.
- **Errors only in toasts.** They vanish before being read and fail WCAG 2.2.1; put actionable errors inline and persistent.
- **Loading state that changes button width.** Keep the label and reserve spinner space.
- **Modal for everything.** Detail views, settings, and long forms in modals lose URL, Back, and context; use a sheet or page.
- **Tooltip as documentation.** Tooltips are invisible on touch and easy to miss; put essential information inline.
- **Hover-only actions.** Row actions visible only on hover need a keyboard- and touch-reachable equivalent (a visible kebab menu).
- **Optimistic UI without rollback.** If the request fails, restore the previous state and tell the user; silently diverging state is worse than a spinner.
- **Inconsistent verbs.** "Add member" button, "Invite sent" toast, "New user" page title for the same action; pick one verb.

## Output format

For a screen or component, deliver the code plus a short interaction spec:

```
Component/Screen: <name>
States: default · hover · focus-visible · active · disabled(<reason>) · loading · error · success · empty · … (✔ implemented / ✘ missing)
Async actions: <action> → optimistic | pending | background; failure → <behavior>
Surfaces: <overlay chosen> — because <one line>
Copy: <button labels, key messages, error strings>
Keyboard: <tab order notes, Esc, shortcuts>
Verified: <throttled network, API failure, empty data, double submit, Back mid-flow>
```

## References

| File | Read when |
|---|---|
| `references/forms.md` | Building or fixing any form: layout, validation timing, error messages, input types, autocomplete, passwords/OTP, multi-step, submission. |
| `references/states-and-feedback.md` | Implementing loading, optimistic updates, undo, toasts, or empty/error/offline/permission states; mapping HTTP errors to UI. |
| `references/overlays-navigation.md` | Choosing or implementing dialogs, sheets, popovers, tooltips, menus; focus management; navigation structure; command palette and shortcuts. |
| `references/ux-writing.md` | Writing or reviewing any UI text: buttons, errors, empty states, confirmations, toasts, loading text, onboarding hints. |

## Related skills

- `ux-principles` — the laws and heuristics behind these defaults; dark-pattern checks.
- `accessibility` — ARIA patterns, focus, screen reader testing, WCAG 2.2 AA details.
- `motion-design` — easing and duration for state transitions, overlays, and toasts.
- `data-dense-ui` — tables, filters, bulk actions, and dashboard states.
- `ai-interface-design` — streaming, stop/retry, and agent-approval interactions.
- `frontend-architecture` — form libraries, server vs. client state, URL state plumbing.
