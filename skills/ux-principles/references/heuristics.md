# Heuristic evaluation with Nielsen's 10

How to run a heuristic evaluation that finds real problems instead of producing a generic checklist. Use this when reviewing a flow before or after building it. For a full visual and accessibility audit, `design-review` builds on this.

## Procedure

1. **Scope.** Name 2–5 key tasks (e.g. "create a project and invite a teammate"). Evaluate tasks, not screens in isolation.
2. **Walk each task twice.** First pass: get the feel of the flow. Second pass: go element by element, including the slow, failed, empty, and undo paths. Force them: throttle the network, submit invalid data, open with no data, press Esc and Back mid-flow.
3. **Log every violation** with: where (screen, element, or file:line), what you observed, which heuristic, severity, and a specific fix.
4. **Rate severity** (scale below) by frequency × impact × persistence (does it bite once, or every time?).
5. **Merge duplicates, sort by severity**, and fix from the top. Re-walk the tasks after fixes.

One evaluator finds a fraction of the problems; different evaluators find different ones. If you can, have a second pass by someone who did not build it, or at least a fresh-eyes pass later.

## Severity scale (Nielsen)

| Score | Meaning | Action |
|---|---|---|
| 0 | Not a usability problem | Drop it |
| 1 | Cosmetic | Fix if time allows |
| 2 | Minor: slows or annoys users | Low priority |
| 3 | Major: users often fail or need help | Fix before release |
| 4 | Catastrophe: blocks the task, loses data, or misleads about money or consent | Fix now; do not ship |

Map to the review scale used across this collection: 4 → P0, 3 → P1, 2 → P2, 1 → P3.

## The 10 heuristics in depth

### 1. Visibility of system status
The design keeps users informed about what is going on, through appropriate feedback within a reasonable time.
**Check.** Pending, success, and error states on every async action. Current location marked (active nav, breadcrumb, page title, step indicator). Save state visible. Uploads and long jobs show progress. Background jobs report completion.
**Typical violations.** A button that does nothing visible for 2 s; "Save" with no confirmation; a list that silently refreshes; no indication which tab or filter is active; agent or batch jobs with no progress or elapsed time.

### 2. Match between the system and the real world
Speak the user's language and follow real-world conventions and order.
**Check.** No internal codes, enums, IDs, or DB field names in UI copy. Terms match what users say (check support tickets and search logs). Fields ordered as people think of them (name before address; country before region when it changes the fields).
**Typical violations.** "Entity", "Resource", "Workspace member role: 2"; "ERR_422"; statuses like `PENDING_SYNC` shown raw.

### 3. User control and freedom
Users need a clearly marked exit from unwanted states, without an extended process. Support undo and redo.
**Check.** Esc and a visible close on every overlay (confirm first only if unsaved input would be lost). Browser Back works because state lives in the URL. Undo for reversible actions. Cancel for long operations. Wizards allow going back without data loss.
**Typical violations.** Modals without a close; Back that exits the app from a filtered view; bulk operations with no undo and no preview.

### 4. Consistency and standards
Users should not wonder whether different words, situations, or actions mean the same thing. Keep internal consistency and follow platform conventions.
**Check.** One term per concept across the product. One component per job (one date picker, one select). Same action in the same place across screens. Platform conventions for back, shortcuts, and gestures.
**Typical violations.** "Delete" on one screen, "Remove" on another for the same action; primary button left on some dialogs and right on others; custom scrollbars or gestures that fight the OS.

### 5. Error prevention
Better than good error messages is preventing the problem. Eliminate error-prone conditions or check for them and confirm before commit. Distinguish slips (attention lapses by experts) from mistakes (wrong mental model).
**Check.** Constraints (date pickers, disabled impossible options with a reason), good defaults, formats parsed rather than enforced, confirmation only for irreversible high-impact actions, type-to-confirm for severe ones.
**Typical violations.** Free-text date fields with strict formats; "Delete" adjacent to "Save"; a destructive action with an undo that does not actually restore everything.
**Slip vs. mistake.** Prevent slips with spacing, constraints, and undo. Prevent mistakes with clearer labels, previews ("This will email 1,204 customers"), and better mental-model cues.

### 6. Recognition rather than recall
Minimize memory load by making elements, actions, and options visible. Users should not have to remember information from one part of the interface to another.
**Check.** Labels persist while typing. Recent items, autocomplete, and previews offered. Selected filters shown as chips. Summary visible across steps. Menus visible rather than gesture-only.
**Typical violations.** Placeholder-only labels; codes to copy between screens; options only discoverable by long-press.

### 7. Flexibility and efficiency of use
Accelerators, often unseen by novices, speed up experts. Let users tailor frequent actions.
**Check.** Keyboard shortcuts with discoverable hints (shown in tooltips and menus), a command palette for large apps, bulk actions, saved views, remembered preferences. None required.
**Typical violations.** Tools used all day with no shortcuts; no multi-select; filters that reset on every visit.

### 8. Aesthetic and minimalist design
Interfaces should not contain irrelevant or rarely needed information; every extra unit competes with the relevant ones. This is about focus, not flat styling.
**Check.** A clear primary element and primary action per view. Secondary information de-emphasized or on demand. No decorative elements that compete with content.
**Typical violations.** Several equally loud buttons; dashboards showing every metric at the same size; marketing banners inside task flows.

### 9. Help users recognize, diagnose, and recover from errors
Plain-language messages that state the problem precisely and suggest a solution, with traditional error visuals.
**Check.** Message next to the cause; icon + color + text (never color alone); says what happened and how to fix it; input preserved; a one-click fix when possible ("Did you mean gmail.com?", "Retry"); an error ID for support as secondary text.
**Typical violations.** "Something went wrong" with no action; "Invalid input"; a form cleared after a failed submit; a field error shown in a modal.

### 10. Help and documentation
Best if the system needs none, but help should be easy to search, task-focused, and concrete.
**Check.** Contextual help first (inline hints, a "?" next to hard fields, docs linked from errors and empty states). Help in a consistent location on every page (WCAG 3.2.6 Consistent Help).
**Typical violations.** A generic help center link as the only aid; help that describes the UI rather than the task.

## Heuristics in complex and expert applications

Complex tools (analytics, admin, developer tools, editors) need the same heuristics applied differently:

- **Efficiency outweighs first-use simplicity** for daily users. Density, shortcuts, bulk actions, and saved configurations are features, not clutter; progressive disclosure still applies to rarely used options.
- **Visibility of status extends to data freshness**: show when data was last updated, whether it is partial, and what is still processing.
- **Error prevention scales with blast radius**: preview the effect of bulk and destructive operations (count of affected items, a sample), and offer dry runs where possible.
- **Consistency across modules** matters more as the product grows; one term per concept and the same filter, table, and form components everywhere.
- **Recognition over recall** means showing IDs, names, and context together (never an ID alone), and keeping selections visible while acting on them.

## Findings template

```
[P1 · H3 User control] Settings > Members — Removing a member has no undo and no confirmation.
Observed: click "Remove" deletes immediately (MembersTable.tsx:88).
Fix: soft-remove with a 10 s Undo toast; hard-delete after the window.
```

## Sources

- Jakob Nielsen, "10 Usability Heuristics for User Interface Design": https://www.nngroup.com/articles/ten-usability-heuristics/
- NN/g, "How to Conduct a Heuristic Evaluation": https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/
- NN/g, "Severity Ratings for Usability Problems": https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/
- NN/g, "Applying the Usability Heuristics to Complex Applications": https://www.nngroup.com/articles/usability-heuristics-complex-applications/
- NN/g, "Error Message Guidelines": https://www.nngroup.com/articles/error-message-guidelines/
- WCAG 2.2 SC 3.2.6 Consistent Help: https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html
