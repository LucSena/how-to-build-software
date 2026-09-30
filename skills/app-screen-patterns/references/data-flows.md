# Data flow screens

Search and zero results, detail pages, create and edit flows, drafts, wizards, bulk actions, CSV import, export, and file upload. Table and grid mechanics, filters, and saved views are in `data-dense-ui`; field-level form rules are in `interaction-design`.

## Contents

1. Search and zero results
2. Detail pages
3. Create and edit flows
4. Drafts and concurrent edits
5. Wizards (multi-step)
6. Bulk actions
7. CSV import
8. Export and download
9. File upload and attachments

---

## 1. Search and zero results

**Purpose.** Get people to the thing they're looking for, and never leave them at a dead end.

**Choose the search type (Carbon).**
| Type | Behavior | Use when |
|---|---|---|
| **Basic** | Query runs on submit; separate results page; recent/trending searches on focus, suggestions while typing | Search is slow or expensive, or content is unfamiliar |
| **Active** | Filters as you type; clear (x) button, no Go button; optional "See all results" | Small dataset, users know what they want, filtering an on-page list |
| **Scoped** | Active results within the current scope plus "Search everywhere" | Inside a project, folder, or suite |

**Results page anatomy.** Query echo + **result count** · scope tabs (All, Projects, Docs, People) with counts · facets (left column or top bar) · items (title with the match highlighted, path/breadcrumb, snippet, key metadata) · sort · pagination or "Load more".

**Rules.**
- **Always show the count, including 0.**
- One scope at a time, "All" by default; a chosen scope persists until cleared.
- The field needs an accessible name (`aria-label` or a visually hidden label) even if the design shows only an icon and a specific placeholder ("Search projects and people").
- Keyboard: `/` or Cmd/Ctrl+K focuses search where it doesn't clash; arrows move through suggestions, Enter opens, Esc closes; after facets reload results, focus stays on the facet.
- Debounce as-you-type queries (~200–300 ms) and cancel stale requests.
- Global command palette design (grouping, shortcuts) belongs to `dashboard-design`; keep content search and palette results consistent.

**Zero results — always offer a next step:**
- echo the query and the active filters, with "Clear filters";
- suggest a spelling correction;
- widen the scope ("Search all workspaces");
- show popular or recent items;
- offer "Create 'Q4 roadmap'" when the query names something the user could create, or "Contact support".

**Copy.** "No results for 'invoce' in Billing. Did you mean invoice? · Search everywhere · Clear 2 filters"

**Anti-patterns.** A blank page for zero results; count hidden; search that silently searches only the current page; results with no context about where they live.

**Source.** Carbon "Search" pattern; Carbon "Filtering" (for facets).

---

## 2. Detail pages

**Purpose.** Show everything that defines one object and the actions on it.

**Anatomy (Polaris resource details layout).**
- **Page header**: back link or breadcrumb, title, **status badge**, primary action, secondary actions, and a "More actions" menu. Previous/next arrows when users step through a list.
- **Two columns** on desktop: a **primary column (~two-thirds)** with what defines the object (content, line items, main fields), and a **secondary column** with status, metadata, owners, tags, and summaries. One column on mobile, primary first.
- Group related content into cards ordered by importance.
- "More actions" menu: unique actions for this page at the top; common object actions (Duplicate, Archive, Delete — marked destructive) at the bottom.

**Rules.**
- **Use the same layout for create and edit** (Polaris), so creating an object teaches its structure.
- Use the default content width; full width hurts reading.
- **Tabs vs sections**: tabs when groups are parallel and users need one at a time (Overview, Activity, Settings); one scrolling page with sections when users scan or compare, or there are only 2–3 short sections. Put counts in tab labels ("Comments 12") and keep the active tab in the URL.
- Show identity (name, ID with copy button, status) at the top; an activity or history section at the bottom or in a tab (see `communication.md`).

**States.** Loading (skeleton of the header and cards) · not found / no access (see `system-pages.md`) · archived (banner with Restore) · read-only for the user's role · partially failed secondary cards (degraded rules).

**Source.** Polaris "Resource details layout".

---

## 3. Create and edit flows

**Choose the surface** with the table in `SKILL.md`. Carbon's create-flow guidance, condensed: inline for quick simple items; a small **modal for one or two fields** (never more than about four fields, never scrolling inside it) or when the user moves to a new page after creating; a **side panel** for medium complexity that needs page context; a large overlay or **full page** for complex objects and anything the service can't work without.

**Rules.**
- **Create ≠ Add.** Create makes a new resource; Add includes an existing one. Label the button accordingly ("Create project" vs "Add member").
- Primary button names the result: "Create project", not "Submit" or "Save". A multi-step dialog relabels its last "Next" to the final action.
- **After creating, go to the new object** (or highlight it in the list) — the result is the feedback, no success toast needed. For slow creation (provisioning, forking, importing a template) show a holding page: "Setting up your workspace… This usually takes under a minute. You can leave this page."
- Keep input on error; show an error summary on long forms and focus it.
- Pre-fill sensible defaults and remember the last-used choice where it helps (the last project, the last template).
- Edit uses the create layout with current values; Cancel restores the saved state.

**Anti-patterns.** A 12-field modal; create dialogs that close on outside click and lose input; "Save" as the create button; landing back on an unchanged list after creating.

**Source.** Carbon community "Create flows"; Carbon dialog pattern; Polaris resource details layout; Primer saving (redirect after create).

---

## 4. Drafts and concurrent edits

**Rules.**
- **Auto-save drafts** of long content (locally at minimum; to the server when the content matters across devices). Show "Draft saved · 2 min ago".
- **Auto-save the draft, publish explicitly.** Never auto-publish or auto-send.
- List the user's drafts; label draft status in lists.
- **Concurrent edits**: detect with a version or updated-at check. On conflict, explain and offer "Review changes" / "Overwrite" / "Discard mine" — never silently overwrite. For simple fields, show "Maya changed this 1 min ago. Reload" before the user starts typing.
- Warn before leaving with unsaved, un-drafted changes.

---

## 5. Wizards (multi-step)

**Purpose.** Guide people through long, unfamiliar, or branching tasks one decision at a time.

**Rules (GOV.UK question pages, adapted for apps).**
- Start with **one question or topic per page**. The page heading is the question (the label or legend becomes the H1).
- Every step has a **Back** control, a heading, and a **Continue** button. The last step's button names the action ("Create workspace").
- **Browser Back must work** and return the previous step with its answers. After a do-once action (payment, submission), Back shows a sensible page instead of repeating the action.
- Don't ask for the same information twice; pre-fill from earlier answers or account data.
- Mark optional fields "(optional)"; allow "I don't know" when that's a valid answer.
- **Progress indicator**: test without one first; improve the order and number of steps before adding one. If shown, step labels match page headings and totals are reliable.
- **Validate on Continue**: re-show the step with the input kept, an error summary at the top that receives focus, and messages next to fields (GOV.UK). Prefix the page title with "Error: ".
- **Review before commit** for anything with money, permissions, or many inputs: a "check your answers" step with Change links (see `system-pages.md`).
- Save progress for long flows so people can leave and resume; more than about 7 steps usually means grouping into a task list.

**Anti-patterns.** A stepper that lets users jump ahead into invalid states; losing answers on Back; a final Submit with no review; "Next" on the final step; wizard inside a small modal.

**Source.** GOV.UK "Question pages" and "Recover from validation errors"; Carbon dialog pattern (progress modal).

---

## 6. Bulk actions

**Anatomy.** Checkbox column with a header checkbox (selects the **visible page**); after selecting a full page, a link "Select all 1,240 matching items"; a **batch toolbar** that replaces the normal toolbar: "12 selected", the bulk actions, and "Clear selection".

**Rules.**
- Always show the selected count, and whether it covers the page or all matching items.
- Keep selection across pagination only when the count and a "Show selected" filter make it visible.
- Check permissions per item; say what will be skipped before running ("4 of 12 items can't be archived because you're not the owner").
- Confirmation scales with impact (destructive ladder); bulk delete is at least a confirm dialog with the count.
- Long jobs run in the background with progress and a notification.
- **Report partial failure**: "118 archived · 6 failed. View failed items" — and keep the failed ones selected.

**Source.** Carbon "Common actions" (single vs bulk considerations); full table mechanics in `data-dense-ui`.

---

## 7. CSV import

**Purpose.** Bring existing data in without corrupting what's there.

**Flow.**
1. **Upload**: drag-and-drop plus a Choose file button (and import-from-URL if supported, as Carbon's import pattern allows). State accepted types and the size limit up front; offer a **template download**. A single-file import can be a modal; imports that need extra steps (mapping, metadata) use a page or side panel.
2. **Map columns**: auto-match by header name; for each column choose a field or "Don't import"; show sample values beside each; flag required fields that aren't mapped.
3. **Preview and validate**: rows with per-cell errors highlighted; filter "Rows with errors"; allow inline fixes; choose "Skip invalid rows" or "Fix first".
4. **Duplicates**: choose update existing / skip / create new, and state the **match key** ("Match on email").
5. **Import**: background job with progress for large files; the user can leave.
6. **Summary**: "1,204 imported · 12 skipped. Download error report (CSV)". Offer undo or rollback within a time window when feasible.

**Rules.**
- Detect and show encoding, delimiter (`,` vs `;`), decimal separator, and date format; let users change them. Handle a UTF-8 byte-order mark.
- Treat the import as untrusted input: validate server-side, limit size and row count, and never execute content.
- A dry run (validate without writing) is the safest default for large or first imports.

**Error messages (GOV.UK file upload style — specific, one per failure).** "Select a CSV file" · "The selected file must be a CSV or XLSX" · "The selected file must be smaller than 10 MB" · "The selected file is empty" · "The selected file must use the template" · "The selected file could not be uploaded – try again".

**Anti-patterns.** "Import failed" with no detail; silently skipping bad rows; duplicates created with no warning; no template.

**Source.** Carbon community "Import" pattern; GOV.UK "File upload" component error messages.

---

## 8. Export and download

**Rules.**
- **Export** changes format (CSV, XLSX, JSON, PDF); **download** transfers the file as-is (Carbon). Label accordingly.
- Choose **scope** (current view and filters vs everything) and **format** (2–5 formats as radio buttons with a sensible default and a hint about which to pick).
- With an intuitive default filename and no choices, export on click with nothing extra; include the object and a timestamp in the filename (`invoices-2026-09-30.csv`).
- **Large exports run async**: "Preparing export… We'll notify you when it's ready", then a notification and email with an **expiring, authenticated** link.
- Show errors inside the export dialog; don't close it on failure.
- **Guard CSV/XLSX against formula injection**: cells that begin with `=`, `+`, `-`, or `@` can execute as formulas in spreadsheet apps; prefix or escape them.
- Log exports of sensitive data in the audit log.

**Source.** Carbon community "Export" pattern; OWASP "CSV Injection".

---

## 9. File upload and attachments

**Rules.**
- Ask for uploads only when they're necessary (GOV.UK).
- Offer both **Choose file** and drag-and-drop; in composers also paste-to-upload.
- State accepted types, size, and count limits before the user picks a file; check them client-side for fast feedback **and** server-side.
- Per file: name, size, type or thumbnail, **progress**, cancel, retry on failure, remove before submit.
- Scan for malware asynchronously and show "Scanning…" before the file is usable; say clearly when a file is blocked.
- Let users reuse a file already uploaded in the same journey instead of uploading again (GOV.UK), but think about shared or public devices before offering previews.
- One specific message per failure (see the CSV import list): wrong type, too big, empty, password-protected, contains a virus, too many files, upload failed – try again.
- Build on your design system's accessible file input; GOV.UK Frontend shipped an improved accessible file upload in 2025 (v5.9.0), a good reference.

**Anti-patterns.** Limits revealed only after a failed 200 MB upload; a single spinner for ten files; drag-and-drop as the only way; files lost when validation fails elsewhere on the form.

**Source.** GOV.UK "File upload" component; Carbon "Import" pattern (keyboard and focus order).

---

## Sources

- Carbon, Search: https://carbondesignsystem.com/patterns/search-pattern/ · Filtering: https://carbondesignsystem.com/patterns/filtering/
- Carbon, Dialogs: https://carbondesignsystem.com/patterns/dialog-pattern/ · Common actions: https://carbondesignsystem.com/patterns/common-actions/
- Carbon community patterns, Create flows: https://carbondesignsystem.com/community/patterns/create-flows/ · Import: https://carbondesignsystem.com/community/patterns/import-pattern/ · Export: https://carbondesignsystem.com/community/patterns/export-pattern/
- Polaris, Resource details layout: https://polaris.shopify.com/patterns/resource-details-layout
- Primer, Saving: https://primer.style/ui-patterns/saving
- GOV.UK Design System, Question pages: https://design-system.service.gov.uk/patterns/question-pages/ · Recover from validation errors: https://design-system.service.gov.uk/patterns/validation/ · File upload: https://design-system.service.gov.uk/components/file-upload/
- OWASP, CSV Injection: https://owasp.org/www-community/attacks/CSV_Injection
