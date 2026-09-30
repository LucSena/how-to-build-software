# States and feedback

How to implement the state matrix, loading, optimistic updates, undo, toasts, and the non-happy states of data views.

## Contents
- Control states: implementation details
- Loading: timing and patterns
- Optimistic updates
- Undo
- Toasts and banners
- Data-view states: empty, no results, partial, error, offline, no permission
- Mapping failures to UI
- Verification checklist

---

## Control states: implementation details

- **Hover**: small lightness shift or subtle background; gate with `@media (hover: hover) and (pointer: fine)`. Interactive states increase contrast relative to rest.
- **Focus**: `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }`. Outlines follow `border-radius` in current engines and survive Windows forced-colors mode (box-shadow rings do not; if you use one, keep `outline: 2px solid transparent` as a fallback). Keep focused elements clear of sticky headers with `scroll-padding-top` (WCAG 2.4.11).
- **Active**: respond on pointer-down; `transform: scale(0.97)` or a darker fill within ~100 ms; no change in font weight or border width (layout shift).
- **Disabled**: dedicated tokens (not just 40% opacity on everything); `cursor: not-allowed`; explain why nearby ("Add a payment method to enable"). `disabled` removes the element from tab order and from form submission; `aria-disabled="true"` keeps it focusable so a reason can be announced, but you must block activation in code.
- **Loading button**: keep the label, add a spinner or change to "Saving…", reserve width so nothing shifts, set `aria-busy="true"`, ignore further clicks, send an idempotency key.
- **Selected vs. focused**: two different visuals; a selected row that is also focused shows both.
- **Read-only**: `readonly` inputs are focusable, selectable, and submitted; do not fake read-only with `disabled`.

## Loading: timing and patterns

| Pattern | Use when | Rules |
|---|---|---|
| Nothing | Response usually < ~300 ms | Use a show-delay so the indicator only appears if the wait runs long |
| Skeleton | Page or region with a known layout | Mirror the final layout exactly (same heights, columns, avatars) to avoid layout shift; shimmer subtle (~1.5–2 s cycle) and static under reduced motion |
| Inline spinner / "Saving…" | One component or button | In place; size unchanged; ellipsis in loading text |
| Progress bar (determinate) | > ~10 s or measurable (uploads, exports, imports, batch jobs) | Percent or steps, estimate, Cancel, "Continue in background", notify on completion |
| Staged text | Long, multi-phase, not measurable | Real phases only ("Uploading… Processing… Almost done"), never invented progress |
| Progressive rendering | Content can arrive in parts | Stream sections (Suspense boundaries, HTML streaming) instead of blocking the page |

Timing: show-delay ~150–300 ms; once shown, keep visible for at least ~300–500 ms to avoid flicker (React `<Suspense>` with transitions does this). Mark the loading region `aria-busy="true"` and announce completion only when meaningful.

After first load, never replace the page with a spinner. Refetches keep the old content visible (optionally dimmed) with a small refresh indicator.

GitHub's Primer uses the same idea with coarser bands, which is a useful cross-check: under 1 s, no loading state; 1–3 s, indeterminate (a spinner or skeleton, since a percentage cannot be read that fast); 3–10 s, determinate if you can; over 10 s, determinate and run it as a background task so the rest of the page stays usable. It also asks you to show each item of a collection as soon as it loads and to load the most important data first.

## Optimistic updates

Use when the action is likely to succeed and cheap to reverse: toggles, likes, renames, reorders, moving items, sending a message.

1. Snapshot the current state.
2. Apply the change immediately in the UI.
3. Send the request (with an idempotency key for creates).
4. On success, reconcile with the server response (IDs, timestamps, normalized values).
5. On failure, restore the snapshot, show an error near the item ("Couldn't rename. Retry"), and keep what the user typed so Retry is one click.

Do not use optimistic UI for payments, sends to other people, publishing, or anything with external side effects; show a pending state and confirm on real success. Examples of library support: TanStack Query `onMutate`/rollback, React `useOptimistic`, SWR `optimisticData`.

For a message or item that is "sending", show it in the list with a pending style, then a failed style with Retry if it fails. Never silently drop it.

## Undo

Undo is the default for reversible destructive actions because it protects users without slowing everyone down.

- **Soft-delete first**: mark as deleted (or move to trash), hide from the UI, and hard-delete after the undo window or via a scheduled job.
- **Undo window**: show "Deleted 3 files · Undo" for ~5–10 s; pause the timer while the toast is hovered or focused, and while the tab is hidden.
- **Keyboard**: ⌘/Ctrl+Z triggers the latest undo where it does not conflict with text editing; the Undo button is focusable.
- **Bulk operations**: undo restores the whole batch, not the last item.
- **Longer recovery**: a Trash or "Recently deleted" area for 30 days covers users who notice later.
- If you cannot actually restore everything (external emails sent, webhooks fired), do not offer Undo; use a review step or confirmation instead.

## Toasts and banners

| Feedback | Surface |
|---|---|
| Result of an action at the place it happened | Inline (check on the button, "Saved" next to the form) |
| Background or cross-surface result (job done, copied, undoable delete) | Toast |
| Page- or account-level condition that persists (offline, trial ending, payment failed, maintenance) | Banner at the top of the relevant region, dismissible only if non-critical |
| Field-level problem | Inline field error |
| Blocking failure (page cannot load) | Full error state in the region, with Retry |

Toast rules:
- Duration ~4–6 s, plus ~1 s per extra 10–15 words; toasts with actions last long enough to use them, or persist until dismissed.
- Pause on hover and focus, and while the document is hidden.
- One position for the whole product (e.g. bottom-right on desktop, bottom above the tab bar on mobile, clear of safe areas); at most ~3 visible, the rest collapsed.
- Title is the outcome ("Invoice sent"); optional one-line detail; at most one action.
- `role="status"` / `aria-live="polite"` for info and success; `role="alert"` only for urgent failures. Actions reachable by keyboard (a focusable toast region or a hotkey).
- Never put an actionable error, a validation message, or the only copy of important information in an auto-dismissing toast (WCAG 2.2.1 Timing Adjustable).
- Motion: enter and exit along the same path; no animation under reduced motion beyond a fade (see `motion-design`).

## Data-view states

Design these for every list, table, feed, grid, search, and dashboard widget.

| State | Content | Example copy |
|---|---|---|
| **First-use empty** | What goes here, why it matters, one primary action; optional template, sample data, or import | "No projects yet. Projects group your tasks and files. **Create project** · Import from CSV" |
| **User-cleared empty** | Confirmation that the work is done; no nagging | "All caught up. New requests will appear here." |
| **No results** | Echo the query and filters, offer to clear, suggest alternatives | "No results for 'invioce'. Did you mean 'invoice'? · Clear filters" |
| **Filtered to nothing** | Show active filters as removable chips | "No open tasks assigned to you this week. · Remove 'This week'" |
| **Partial** | Show what loaded, mark what did not | "Showing 2 of 3 sources. GitHub is not responding. Retry" |
| **Error** | What happened, how to fix, Retry, error ID secondary | "Couldn't load invoices. Check your connection and try again. · Retry · ID 7F3A" |
| **Offline / stale** | Say so and when the data is from; queue safe actions | "You're offline. Showing data from 10:42. Changes will sync when you reconnect." |
| **No permission** | Who can grant access; request path | "You need Editor access to change billing. Ask an admin or **Request access**." |
| **Too much** | Pagination, "Load more", or virtualization; a count | "Showing 50 of 12,304 · Load more" |

Empty-state details the design systems agree on (Carbon, Primer):
- Write the title as the next step when you can ("Start by adding data sources") rather than as a lack ("You have no data sources").
- One primary action. Instead of a button, you can point at the real control ("Use **New** in the top bar"), which teaches where it lives.
- An **error** empty state is never playful: no mascot or delight illustration, an alert icon, a plain summary ("Repositories could not be loaded"), and a way forward (retry, status page, help). Avoid both "There was a problem" and internal detail such as cluster names.
- Save rich education (templates, sample data, walkthroughs) for first use of a primary feature; keep secondary features' empty states to a line and an action.

Isolate failures: wrap each independent region in its own error boundary so one failed widget shows its error state while the rest of the page works.

Test content extremes: very long names, empty strings, emoji, RTL text, missing images (fallback initials), 0, 1, and 10,000 items.

## Mapping failures to UI

| Failure | UI |
|---|---|
| Validation (400/422) | Inline field errors from the response, keyed by field name |
| Not signed in / session expired (401) | Preserve the in-progress work, re-authenticate in place or redirect and return to the same state |
| Forbidden (403) | No-permission state with request-access path |
| Not found (404) | Explain, link to the parent list or search; never a blank page |
| Conflict (409) | Explain what changed ("Someone else edited this 2 minutes ago"), offer to review or overwrite |
| Rate limited (429) | Say when to try again; disable the action with a countdown if known |
| Server error (5xx) / timeout | Region error state with Retry; retry idempotent requests automatically with backoff before surfacing |
| Offline | Offline banner; queue or disable network actions with a clear label |

## Verification checklist

- [ ] Throttled network (slow 3G / 400 ms latency): no spinner flashes, skeletons match, buttons show pending.
- [ ] API returns an error for each mutation: rollback works, message is specific, input preserved.
- [ ] Double-click every submit: exactly one request takes effect.
- [ ] Empty account, no search results, filters that match nothing: each shows its own state.
- [ ] Undo restores the full previous state, including order and selection.
- [ ] Screen reader announces save results and errors without moving focus unexpectedly.

## Sources

- NN/g, "Response Times: The 3 Important Limits": https://www.nngroup.com/articles/response-times-3-important-limits/
- NN/g, "Designing Empty States in Complex Applications": https://www.nngroup.com/articles/empty-state-interface-design/
- GitHub Primer, Loading and Empty states patterns: https://primer.style/ui-patterns/loading ; https://primer.style/ui-patterns/empty-states
- IBM Carbon, Empty states pattern: https://carbondesignsystem.com/patterns/empty-states-pattern/
- NN/g, "Button States: Communicate Interaction": https://www.nngroup.com/articles/button-states-communicate-interaction/
- Vercel Web Interface Guidelines (loading duration, optimistic updates, stable skeletons, all states designed): https://github.com/vercel-labs/web-interface-guidelines
- Design System Checklist (toast, button, skeleton, loading indicator criteria): https://www.designsystemchecklist.com/
- Sonner (toast behavior: pause on hover and hidden tab, stacking): https://github.com/emilkowalski/sonner
- WCAG 2.2 SC 2.2.1 Timing Adjustable, 2.4.11 Focus Not Obscured, 4.1.3 Status Messages: https://www.w3.org/TR/WCAG22/
