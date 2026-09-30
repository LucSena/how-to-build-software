---
name: app-screen-patterns
description: Use when building or reviewing the common screens of a SaaS or product app - settings, profile and account, team members, invites and roles, billing, plans and usage, notifications, search, detail pages, create and edit flows, wizards, bulk actions, CSV import and export, file upload, audit log, API keys, webhooks, integrations, error pages, cookie consent, destructive confirmations, account deletion, and changelog or what's new. Covers the shared rules every screen inherits - save model, message type and placement, degraded states, disabled vs read-only vs hidden, loading thresholds, dialog vs page vs wizard, action verbs, destructive-action tiers - plus per-screen anatomy, states, and copy. Also use when the user only says "add a settings page", "invite teammates", "billing page", or "delete my account". Not for the app shell or dashboards (dashboard-design), onboarding (onboarding-design), login or signup (auth-flows), data grids (data-dense-ui), or pricing and checkout (conversion-ux).
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "interaction-design dashboard-design auth-flows data-dense-ui conversion-ux design-systems"
---

# App Screen Patterns

Most of a product is not the hero feature. It is settings, members, billing, notifications, search, imports, keys, and error pages, and users judge trust on those screens. They fail in predictable ways: a toggle that silently needs a Save, an empty state shown when the fetch failed (users think their data is gone), an invite that charges a seat without warning, a key that can be viewed forever, a deletion flow that app review rejects. This skill fixes the shared rules once, then gives each screen its anatomy, states, and copy. The rules come from design systems that publish their reasoning (GitHub Primer, IBM Carbon, Shopify Polaris, GOV.UK) and from platform policy (Apple, Google Play).

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Then look for what already exists: a design system or component library (Dialog, Banner, Toast, EmptyState, PageHeader), a `DESIGN.md`, existing settings or error pages, and the roles and plans model. **Compose existing components and patterns; don't invent a second modal or a third toast.**

## Core principles

1. **Decide the shared rules once per product.** Save model, message placement, and destructive tiers must be the same on every screen, or users can't predict what a click does.
2. **Design every state, not the happy path.** Loading, empty, error, partial, no-permission, over-limit, and offline are where users lose trust.
3. **Never make users think their data is gone.** A failed fetch of the user's own content shows "unavailable", never a first-use empty state.
4. **Show consequences before commitment.** Seats charged, prorated amounts, what a deletion cascades to, what a role can do: stated with numbers before the button.
5. **Scale friction to impact.** Undo for the reversible, a confirm for the irreversible, type-to-confirm for the catastrophic. Confirming everything trains people to click through.
6. **Platform and legal rules are requirements, not polish.** In-app account deletion, equal Accept/Reject on cookies, and online cancellation are review- and law-driven.
7. **Copy is specific.** Verb + noun buttons, the user's own data, exact numbers and dates. "Delete workspace", not "OK".

## Workflow

- [ ] **Identify the screen(s)** in the pattern index below and read the matching reference file.
- [ ] **Fix the shared rules** for this product if they aren't fixed yet (save model, message placement, destructive tiers). Write them into DESIGN.md or the project context so every later screen reuses them.
- [ ] **List the states** for the screen: loading, empty (first use, filtered, error), partial/degraded, success, no-permission, plan-limit, offline. Each gets a design and copy.
- [ ] **Map permissions and billing edges**: which roles see, edit, or never see each control; seat and plan limits; IdP-managed users; failed payment.
- [ ] **Write the copy** from the examples in the reference: headings say the effect, bodies say the fix, buttons say verb + object.
- [ ] **Build from existing components**; add a new pattern only when nothing fits (see `design-systems`).
- [ ] **Validate** against the pre-ship checklist and Gotchas; fix and repeat until clean.

## Shared rules every screen inherits

### Save model

| Control or context | Save model | Why |
|---|---|---|
| Text fields, checkbox groups, radio groups, native selects, multi-selects | **Explicit Save** | Auto-saving text can submit half-typed or sensitive values; keyboard and screen-reader users "read" radios and selects by moving through them, which would apply each option |
| Toggle switch, segmented control, single-select menu outside a form | **Auto-save** with inline "Saved" or visible state change | These act like a light switch; a Save button makes it unclear what is already applied |
| Menu that gains search, filters, or tabs | Treat it as a **dialog** with Apply/Cancel | It is no longer a simple menu |
| Long-form content (docs, posts, descriptions) | **Auto-save a draft**, publish explicitly | Never auto-publish |

- **Never mix** explicit and auto-save inside one form; avoid mixing them on one page.
- **Keep Save enabled** even when the form is invalid or unchanged; validate on submit. Disabled buttons can't be reached with Tab and are hard to read. (Exception: type-to-confirm dialogs enable Delete only when the typed name matches.)
- **One Save per form**, and prefer one per page. Several same-label Save buttons confuse screen-reader and voice-control users. Allow one inline edit mode at a time.
- On error, keep every input and show what failed. Warn on navigation away from unsaved changes (`beforeunload` shows only a generic browser message; add an in-app route guard for client-side navigation).
- After creating something, go to the new object. For slow creation, show a holding page that says the configuration is safe.

### Messages: type and placement

| Situation | Use | Placement |
|---|---|---|
| Result of an action, visible change on screen | **Nothing extra**; the change is the feedback | — |
| Result not visible (copied, saved elsewhere, created several) | Inline confirmation or toast | Next to the trigger |
| Error or warning about a section or form | **Inline message / banner** that persists until resolved | Top of the section or form body |
| Action taken inside a dialog | Message **inside the dialog**; don't close it and show a page banner | In the dialog |
| System state (outage, failed payment, maintenance, trial ending) | **Banner** above content, not dismissible until resolved (or per session) | Page top; global incidents above the nav with a status-page link |
| Long job the user may leave (import, export, report) | Progress, then the product's notification system | Notification center + optional email |
| Needs a decision before continuing | Modal dialog, one at a time | Center |

Never put errors that need action in a toast. Never open system pop-ups (NPS survey, promo) while the user is mid-task. Use success messages sparingly. Toast timing and accessibility live in `interaction-design`.

### Degraded experiences

- Separate **primary** content (the thing the page is for) from **secondary** (sidebars, counts, related items). Primary fails: render an error page or region with Retry. Secondary fails: render the page without it, or with an "unavailable" note.
- **Never show a first-use empty state for data the user created when the fetch failed.** Say "Couldn't load your projects. Try again", or remove the section and its heading.
- Hide counts and badges you can't compute; never show "0" as a guess.
- Never **disable** a control because of an outage. Hide non-critical actions, or keep the button active and explain on click.
- At most about 5 outage messages per page; for a global incident use one banner linking to the status page. Never hide the global navigation.

### Disabled vs read-only vs hidden

| Condition | Treatment | Example |
|---|---|---|
| User's role can never do this and doesn't need to know it exists | **Hidden** | Billing menu hidden from members |
| User can see the value but not change it | **Read-only** with who can change it | "Managed by Okta. Contact your admin." |
| A prerequisite is missing (temporary) | **Disabled + a visible reason** (or `aria-disabled` so it stays focusable) | "Add a payment method to enable auto-recharge" |
| User needs to know the feature exists but lacks plan or role | Visible, **inactive with an explanation and a path** | "SAML SSO is on the Business plan. Compare plans" / "Ask an owner" |
| User followed a link to a page they can't access | **Permission page**: who can grant access, "Request access", "Switch account" | See `references/system-pages.md` |

No tooltips on disabled elements: they can't receive focus, so keyboard and screen-reader users never see the reason. Put the reason in text.

### Loading thresholds

| Expected wait | Show |
|---|---|
| Under ~1 s | No indicator (use a show-delay so fast responses never flash a spinner) |
| ~1–3 s | Indeterminate indicator in place (button spinner, skeleton of the region) |
| ~3–10 s | Determinate progress when you can measure it |
| Over ~10 s | Determinate progress **and** move it to a background task with a notification on completion |

Load the most important content first and render items as they arrive; merge adjacent spinners into one. Every job has initiated → in progress → succeeded or failed (with Retry). A full interstitial page only for waits of several seconds that produce a big change (creating a workspace).

### Dialog vs panel vs page vs wizard

| Task | Surface |
|---|---|
| Change one attribute in place | **Inline edit** with Save/Cancel next to the field |
| 1–4 fields, quick, user stays in context (rename, invite, add tag) | **Dialog**: one primary action on the right, Cancel on the left, specific verb |
| Medium task that needs the page behind it for reference | **Side panel / sheet** |
| Core object, many fields, or anything worth a URL | **Full page**, same layout for create and edit |
| Long, sequential, branching, or unfamiliar; answers depend on earlier answers | **Wizard, one question or topic per page**, Back link, review step before commit |
| Many independent parts done over several sessions | **Task list hub** (see `references/system-pages.md`) |

Never nest modals, never scroll inside a small create dialog, and never use a full-screen modal as a substitute for a page. A task done many times a day belongs on the page, not in a dialog. Cancel in a dialog discards everything done in it.

### Action vocabulary

| Verb | Means | Don't confuse with |
|---|---|---|
| **Create** | Make a new object | Add |
| **Add** | Put an existing thing into a set (add member, add tag) | Create |
| **Remove** | Take out of a list; the thing still exists elsewhere | Delete |
| **Delete** | Destroy it | Remove, Archive |
| **Archive** | Hide from active use, restorable | Delete |
| **Clear** | Empty a field, selection, or filters | Reset |
| **Reset** | Return to the last saved or default state | Clear |
| **Revoke** | End access granted earlier (key, invite, session) | Delete |
| **Cancel** | Stop the current action without applying it | Close (an icon, not a button) |

Buttons are verb + noun when the object isn't obvious ("Delete project", "Add SSH key", "Revoke key"). Never "OK", "Yes", "Submit", or "Done" for a consequential action.

### Destructive-action ladder

| Impact | Pattern | Example copy |
|---|---|---|
| Reversible or trivial (archive, move to trash, remove tag) | **Do it now + Undo** (toast ~5–10 s); soft-delete with a restore window | "Project archived. Undo" |
| Irreversible but limited, or several items | **Confirm dialog** naming action, object, and consequences | Title "Delete 3 invoices?" · Body "This can't be undone." · Button "Delete invoices" |
| Irreversible and costly, large, or cascading (project, workspace, account, production data) | **Confirm + type the resource name**; re-authenticate for account- and org-level deletes; offer export first | "Type acme-prod to confirm" · "Delete workspace" |

In every confirmation: concrete consequences with numbers ("124 tasks, 38 files, and all comments; 6 members lose access immediately"), whether recovery exists ("Restorable from Trash for 30 days" or "This can't be undone"), danger styling on a specific verb, and initial focus on the safe action for high-impact deletes. Afterwards, return to the list, confirm, and if deletion fails, say so and restore the item.

### Error-message content

Say what happened and what to do, using the user's data: "To save this product, make 2 changes: Enter a title · Add a weight", not "There are 2 errors. Invalid title". Headline = effect, body = fix + link, button = one-step solution. No "Oops", no blame, no "invalid", no "we" unless the company caused it. Red for problems that need action now, yellow for warnings.

## Pattern index

| Screen | The three rules that matter most | Reference |
|---|---|---|
| Settings page | One save model per form; scope labeled (personal vs workspace vs project); danger zone last, separate | `references/settings-and-account.md` |
| Profile and account | Profile / account / preferences / privacy separated; verify a new email before switching and notify the old one; re-authenticate for sensitive changes | `references/settings-and-account.md` |
| Account deletion | Initiated in the app (Apple) and via a web link (Google Play); really deletes, not deactivate-only; states timeline and what is retained | `references/settings-and-account.md` |
| Data export, language and region | Async export with expiring link; languages in their own names, no flags; language separate from region and formats | `references/settings-and-account.md` |
| Members and invites | Seats shown before inviting; invites expire and can be resent or revoked; removal lists what the person loses | `references/team-and-billing.md` |
| Roles and ownership | Each role described in the picker; never zero owners; ownership transfer needs acceptance | `references/team-and-billing.md` |
| Billing, plan, usage, invoices | Prorated charge shown before upgrade; downgrade at period end listing what is lost; cancel reachable online | `references/team-and-billing.md` |
| Trial and plan-limit banners | Limit shown next to the limited thing; warn at ~80%; admins get Upgrade, members get "Ask an admin" | `references/team-and-billing.md` |
| Notification center and preferences | Each item shows why it was sent and links to its object; event × channel matrix; security notices locked on with a reason | `references/communication.md` |
| What's new, badges, changelog | "New" badge only for outsized features; it expires (click, 5 days, or 3 sessions); at most 2 feature alerts at a time | `references/communication.md` |
| Comments and mentions | Mention only people with access, warn otherwise; drafts survive navigation; edit needs no success message | `references/communication.md` |
| Activity feed vs audit log | Feed is social and grouped; audit log is complete, immutable, absolute timestamps, any actor type; filter and export | `references/communication.md` |
| Help and support | Pre-fill context (account, page, error ID); state response time; same channel order everywhere | `references/communication.md` |
| Search and zero results | Always show the count, including 0; zero results offers a next step; basic vs as-you-type chosen by cost | `references/data-flows.md` |
| Detail page | Header with title, status, primary and overflow actions; primary column defines the object; same layout as create/edit | `references/data-flows.md` |
| Create, edit, drafts, wizards | Surface chosen by the table above; drafts auto-save, publish is explicit; Back never loses answers | `references/data-flows.md` |
| Bulk actions | Selected count and "select all N matching"; per-item permissions; partial-failure report | `references/data-flows.md` |
| CSV import and export | Upload → map → preview/validate → import → summary with error file; duplicate strategy stated; exports escape formula cells | `references/data-flows.md` |
| File upload | Types and size stated up front; per-file progress, cancel, retry; one specific message per failure | `references/data-flows.md` |
| API keys | Secret shown once with Copy; expiration default with a warning on "never"; least-privilege scopes; list shows prefix and last used | `references/developer-surfaces.md` |
| Webhooks | Secret and HTTPS verification; deliveries log with Redeliver; minimum events | `references/developer-surfaces.md` |
| Integrations | Permissions listed before install; connection health and Reconnect; uninstall says what happens to data | `references/developer-surfaces.md` |
| 404, 500, 503, maintenance | No jargon, blame, or jokes; say what happened to entered data; 503 gives the return day and time | `references/system-pages.md` |
| Permission denied, rate limited, offline | Who grants access + Request access + Switch account; retry time; queued writes shown per item | `references/system-pages.md` |
| Cookie consent | Accept and Reject equally prominent on the first layer; nothing non-essential before consent; not sticky | `references/system-pages.md` |
| Review, confirmation, task list | Review page with Change links before commit; confirmation says what happens next and gives a reference; task list statuses minimal | `references/system-pages.md` |

## Pre-ship checklist

- [ ] **States**: loading (by threshold), empty (first use, filtered, error), partial/degraded, error, success, no-permission, plan-limit, offline — each designed with copy.
- [ ] **Save model** consistent with the product rule; dirty state visible; unsaved-changes guard; Save never disabled (except type-to-confirm).
- [ ] **Destructive actions** on the ladder, with numbers, recovery statement, and a specific verb.
- [ ] **Feedback** next to its cause; no success message when the result is visible; no actionable errors in toasts.
- [ ] **Permissions**: hidden vs read-only vs disabled-with-reason applied; IdP-managed and last-owner cases handled.
- [ ] **Billing edges**: seat limit, plan limit, trial end, failed payment (admins only), downgrade effects.
- [ ] **Real data**: 60-character names, zero / one / 10,000 items, RTL, 200% zoom, translated strings much longer than English.
- [ ] **Keyboard and screen reader**: focus moves into dialogs and to error summaries; no tooltips on disabled elements; status messages announced.
- [ ] **Legal and platform**: in-app account deletion plus web link (mobile), Accept/Reject equal, cancel online, no pre-ticked consent, marketing email opt-in.
- [ ] **Deep links**: every settings section and tab has a URL that support can send.

## Gotchas

- **Toggles that need a Save**, or text fields that auto-save. Users leave thinking a setting is on when it isn't. Follow the save-model table.
- **A disabled Save button with no explanation.** Keyboard users can't reach it and nobody knows what's wrong. Keep it enabled and validate on submit.
- **"No projects yet" after a 500.** The user thinks their work was deleted. Render an error with Retry, or hide the section.
- **A Save button on every card plus a global Save.** Nobody knows which one saves what. One per form.
- **Confirm dialogs on everything.** People click through them by reflex, including the one that matters. Use Undo for reversible actions and keep dialogs for the irreversible.
- **"Are you sure?" with Yes/No.** The buttons must name the action: "Delete project" / "Cancel".
- **Invites that silently add a paid seat**, or removals that don't free one. Show seat count and cost in the invite dialog; say whether removing frees the seat.
- **Deletion that only deactivates.** Apple rejects deactivate-only flows and flows that require a call or email; Google Play also requires a web deletion link.
- **Showing the full API key again later** or letting the list display it. Show it once; list the prefix and last characters.
- **A cookie banner with "Accept all" and a "Manage" link.** Reject must sit on the first layer with the same prominence.
- **Funny or technical error pages** ("Oops! 404 bad request"). Say what happened in plain words, what happens to their data, and what to do next.
- **Permission problems shown as disabled buttons with tooltips.** The tooltip is unreachable. Hide, make read-only, or explain in text.
- **Upsells disguised as errors**, or upgrade prompts inside destructive or stressful flows. Show limits honestly, near the thing that is limited.
- **Building the app shell, dashboard, onboarding checklist, or login here.** Those have their own skills (see Related skills).

## Output format

For a screen build or review, deliver:

```
Screen: <name> · Pattern ref: <reference file>
Shared rules applied: save model <…>; messages <…>; destructive tier <…>
Anatomy: <regions top to bottom, primary action, overflow actions>
States: loading ✓ · empty ✓ · error ✓ · degraded ✓ · no-permission ✓ · limit ✓ · offline ✓/n.a.
Permissions: hidden <…> · read-only <…> · disabled-with-reason <…>
Copy: headings, buttons, confirmations, errors (exact strings)
Platform/legal: <deletion, consent, cancel — or n.a.>
Checked: <pre-ship items verified> · Not checked: <…>
```

## References

| File | Read when |
|---|---|
| `references/settings-and-account.md` | Building a settings page or sub-nav, profile, email or password change, danger zone, account deletion for App Store or Google Play, data export, or a language/region switcher |
| `references/team-and-billing.md` | Building members lists, invites, roles, ownership transfer, seat handling, billing and plan pages, usage meters, invoices, payment methods, upgrades, downgrades, proration, dunning, or trial and plan-limit banners |
| `references/communication.md` | Building a notification center or preferences, "New" badges, what's new, a changelog, comments and mentions, an activity feed, an audit log, or help and support entry points |
| `references/data-flows.md` | Building search and zero results, detail pages, create/edit flows, drafts, wizards, bulk actions, CSV import with mapping, exports, or file upload |
| `references/developer-surfaces.md` | Building API key or token pages, webhook settings and delivery logs, or an integrations directory and connection settings |
| `references/system-pages.md` | Building 404, 500, 503/maintenance, offline, permission-denied, or rate-limit pages, a cookie banner, a review ("check your answers") step, a confirmation page, or a task list hub |

## Related skills

- `interaction-design` — control states, forms and validation timing, toasts, overlays, and microcopy that these screens are built from.
- `dashboard-design` — the app shell, sidebar, account menu, and home dashboards that host these screens.
- `onboarding-design` — first-run, setup checklists, and empty-account activation.
- `auth-flows` — login, sign-up, MFA, password reset, and session management behind the account screens.
- `data-dense-ui` — tables, data grids, filters, and saved views used on list and admin screens.
- `conversion-ux` — pricing pages, paywalls, checkout, and cancel-flow ethics.
- `design-systems` — turning these patterns into reusable components and registry blocks.
