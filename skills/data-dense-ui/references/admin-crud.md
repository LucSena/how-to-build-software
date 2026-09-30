# Admin and CRUD patterns

Admin and back-office screens are used for hours by people who know the domain. Optimize for speed, safety, and traceability, not first impressions.

## Contents
- Information architecture
- List screens
- Detail screens
- Create and edit
- Inline editing
- Destructive and bulk operations
- Concurrency and conflicts
- Permissions
- Audit and history
- Import and export
- Search

---

## Information architecture

- Sidebar navigation grouped by domain object (Customers, Orders, Invoices), not by operation (Create, Reports).
- Every object type gets the same set of screens: **list → detail → edit**, created from the same templates so behavior is consistent across the admin.
- Global search (or a command palette) that finds records by name, email, and ID from anywhere.
- Breadcrumbs for nested objects (Customer › Subscription › Invoice); related records linked both ways.

## List screens

Template, top to bottom: title with count ("Customers · 12,304") and primary action ("New customer") → saved views as tabs ("All", "Overdue", "My accounts") → search + key filters + "More filters" → active filter chips → table with bulk selection → pagination.

- Default view answers the most common question (e.g. "Needs attention" sorted by urgency).
- Columns chosen per the table spec in `tables.md`; user-configurable columns for wide objects.
- URL holds view, filters, sort, page, and open record.

## Detail screens

- **Header**: name, ID (copyable), status badge, key metadata, primary actions (Edit, one or two domain actions), overflow menu for the rest (destructive items last, separated).
- **Body**: key fields first as a description list; related records as tabs or sections (Orders, Invoices, Notes); activity/audit timeline.
- Side sheet for quick inspection from a list; full page for deep work. Both URL-addressable.
- Show computed and system fields (created, updated, owner) in a muted secondary area.

## Create and edit

- Use the same form for create and edit; required fields minimal, sensible defaults prefilled.
- Long objects: sections with headings, a sticky save bar showing unsaved-changes state ("Unsaved changes · Discard · Save"), and a warning before leaving.
- Save keeps the user in context and confirms inline ("Saved"); errors inline per field with the form preserved (see `interaction-design` forms).
- After create, go to the new record's detail (or back to the list with the new row highlighted), not to an empty form.
- Drafts for long or multi-step objects; autosave only where users expect it (documents), with a visible status.

## Inline editing

Use for single, low-risk fields in tables or detail views (name, owner, status, tags).

- Visible edit affordance on hover and focus (pencil icon or field styling); Enter or click to edit.
- Enter saves, Esc cancels, blur saves (or cancels, but be consistent and say which).
- Optimistic update with rollback and an error in the cell on failure.
- Validation inline in the cell; do not allow saving invalid values silently.
- Not for fields with side effects (price changes, role changes); those go through a form or a confirmation.

## Destructive and bulk operations

- **Prefer soft delete** with a Trash/"Recently deleted" view and restore; permanent purge as a separate, rarer action.
- **Proportional safeguards**: undo toast for reversible single actions; confirmation naming the object for irreversible ones; type-to-confirm for high blast radius (deleting a workspace, production data).
- **Preview scope before bulk changes**: "This will change the plan for 37 subscriptions and bill 12 of them today." Show a sample list for large batches.
- **Dry run** for imports, migrations, and mass updates: report what would change without changing it.
- **Background execution** for large batches, with progress, the ability to leave the page, and a completion report including partial failures and a way to retry only the failed items.
- **Idempotency**: repeated submissions of the same operation do not double-apply.

## Concurrency and conflicts

- Include a version or `updated_at` with every edit; the server rejects stale writes (HTTP 409 or 412 with `If-Match`).
- On conflict, explain and offer choices: "Maya changed this record 2 minutes ago. Review changes · Overwrite · Discard mine". Never silently overwrite.
- For collaborative objects, show presence ("Maya is editing") and live-update read-only views.

## Permissions

- Hide actions only when the user can never gain access; otherwise show them disabled with the reason ("Only admins can refund payments") or allow requesting access.
- Read-only fields look read-only (not disabled-grey inputs everywhere) and remain selectable and copyable.
- Enforce on the server; the UI only reflects permissions.
- For impersonation or "view as" tools, show a persistent banner with an exit, and log every action.

## Audit and history

- Every mutation records who, what (before → after), when, and from where (UI, API, import, automation).
- Show the timeline on the detail page with human-readable entries ("Maya changed plan from Pro to Business"), filterable by type.
- Provide restore from history for fields where it is safe.
- Admin actions affecting customers (refunds, plan changes, deletions) are always audited and ideally require a reason field.

## Import and export

- **Import**: upload → column mapping (auto-matched by header, editable) → preview of the first rows → validation report per row with reasons → dry run → import as a background job → summary with downloadable error file.
- Accept common variations (Postel's law): header case, whitespace, date formats, thousands separators; report how ambiguous values were interpreted.
- **Export**: exports the current view (filters, sort, visible columns) by default, with an option for all columns; async with notification for large exports; CSV plus the format users actually need (XLSX for finance); UTF-8 with BOM if Excel users are common.
- State time zone and currency in exported headers.

## Search

- Search by the identifiers people have in hand (email, order number, invoice ID, phone) with exact-match results ranked first.
- Show the object type and key context in results ("Invoice INV-204 · Acme GmbH · €1,200 · Overdue").
- Keyboard-first: `/` or ⌘K to focus, arrows to move, Enter to open.
- Recent searches and recently viewed records on empty query.

## Sources

- NN/g, "Applying the Usability Heuristics to Complex Applications": https://www.nngroup.com/articles/usability-heuristics-complex-applications/
- NN/g, "Confirmation Dialogs Can Prevent User Errors (If Not Overused)": https://www.nngroup.com/articles/confirmation-dialog/
- RFC 9110, HTTP Semantics (412 Precondition Failed, `If-Match`, 409 Conflict): https://www.rfc-editor.org/rfc/rfc9110
- Vercel Web Interface Guidelines (URL as state, deep-link everything, optimistic updates): https://github.com/vercel-labs/web-interface-guidelines
- Humane by Design, "Intentional" (friction before consequential actions): https://humanebydesign.com/principles/intentional
