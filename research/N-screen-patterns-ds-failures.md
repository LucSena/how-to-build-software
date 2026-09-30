# N: SaaS screen patterns, building a design system from zero, and why product design fails

Research notes for agent skills (English). Gathered 2026-09-30. Builds on and does not repeat: `F-web-design-2026.md` (tokens, DTCG, Tailwind v4, state matrix, loading and empty basics), `C-resources.md` (component libraries, DESIGN.md format), `B-ux-principles.md` (Nielsen heuristics, form and error rules, dark-pattern list, designsystemchecklist.com), `A1-design-skills.md`.

## Provenance legend

- **[V-repo]**: read directly from a cloned public repo in `refs7/`. The public URL of the rendered page is given.
  - `primer_design`: GitHub Primer docs, rendered at primer.style.
  - `carbon-design-system_carbon-website`: IBM Carbon, rendered at carbondesignsystem.com.
  - `alphagov_govuk-design-system`: GOV.UK Design System, rendered at design-system.service.gov.uk.
  - `Shopify_polaris`: Polaris docs, rendered at polaris.shopify.com.
  - `github_docs`: GitHub Docs, rendered at docs.github.com.
  - `shadcn_ui`: shadcn/ui docs, rendered at ui.shadcn.com.
  - `bradfrost_atomic-design`: Atomic Design book, rendered at atomicdesign.bradfrost.com. The book is **All Rights Reserved**, so these notes paraphrase it and do not copy it.
- **[V-web]**: read directly from the source page (developer.apple.com).
- **[V-search]**: confirmed by web-search result snippets from the named source. The claim is attributed, but the full page was not read.
- **[K]**: the author's background knowledge. **Unverified in this session.** Verify it before shipping it as fact, or phrase it as guidance rather than a citation.

Licenses: the Primer docs are MIT. Carbon website content is Apache-2.0 [K]. GOV.UK Design System content is under the Open Government Licence v3 [K]. Polaris is MIT [K]. All of these allow paraphrase with credit. Add each one to `CREDITS.md` if an idea from it is used.

---

# PART A: Product/SaaS screen patterns

## A.0 Cross-cutting rules that every pattern below inherits

These are the "meta-patterns". Put them in the skill once and reference them from each pattern.

### A.0.1 Save model: explicit vs automatic (Primer "Saving") [V-repo]
Source: https://primer.style/ui-patterns/saving
- **Default to explicit save** for forms. Never mix explicit and auto-save inside **one form**. Avoid mixing them on one page that has several forms. Example: a profile photo uploaded inside the "Public profile" form is not saved until the whole form is submitted.
- **Declarative controls use explicit save.** These are text inputs, checkbox groups, radio groups, native `<select>`, and multi-selects. Why:
  - text could submit sensitive values early (for example, a change-password field);
  - with checkbox groups it is unclear whether the selection was saved, and accidental clicks get saved;
  - with radio groups and native selects, screen-reader and keyboard users "read" the options by moving through them, which would apply each option in turn.
- **Imperative controls auto-save.** These are toggle switches (like a light switch), segmented controls (like tabs), and non-native single-select dropdowns that sit outside an explicit form (like a radio dial).
- **Menus vs dialogs.** A semantic menu has only options and no Save button. Once a menu gains search, filters or tabs, treat it as a **dialog** with Submit and Cancel buttons.
- **Keep the Save button enabled, even when the form is invalid or unchanged.** Disabled buttons cannot be reached with Tab and have low contrast. Validate on submit instead.
- **One Save button per form/page.** Several same-label Save buttons confuse screen-reader and voice-control users. If content is edited in separate sections (for example, an issue title), allow only one edit mode at a time.
- **Placement.** Page forms put the buttons bottom-left, with Cancel to the *right* of Submit. Dialogs and comment boxes put them bottom-right, with Cancel to the *left*. An inline edit places its Save button right next to the input.
- **Button emphasis.** A button that saves the whole page is primary. A button that saves one segment is secondary. In a Save + Cancel pair, Save is primary and Cancel is secondary.
- **Labels.** Use active verbs such as "Create", "Save", "Delete", "Update" and "Add". Add the object name when it would otherwise be ambiguous ("Add SSH key").
- **On error:** keep all of the user's input in the form and show feedback.
- **Unsaved changes:** you *may* use `beforeunload`. Browsers only show a generic message, which cannot be customized.
- **Feedback.** If the change is not visible in the viewport, confirm it. With no reload, use an inline message. After a reload or redirect, use a banner. As of the doc's writing, Primer advises against toasts on github.com because of known accessibility issues.
- **Error forgiveness.** Confirm before destructive submits. For risky changes, offer undo after saving (for example, a "Revert" button after a PR merge).
- **Redirect after create.** Send the user to the new entity. For slow creation (a fork, a template), show a holding page that reassures them the configuration is not lost.

**Agent rule of thumb.** Settings pages built from toggles auto-save, with per-control feedback. Settings pages built from text fields use one explicit Save per form.

### A.0.2 Message/notification choice (Primer "Notification messaging", Carbon "Notifications") [V-repo]
Sources: https://primer.style/ui-patterns/notification-messaging and https://carbondesignsystem.com/patterns/notification-pattern/
- Primer's three message *types*, from most to least prominent:
  - **System updates.** These come from the platform and cannot be dismissed until resolved. Use a Banner, or an Announcement for global messages.
  - **Feedback.** The result of a user action. Use a Banner or an InlineMessage.
  - **Awareness.** Contextual tips or information.
- Primer's six *states*: info, warning, critical, success, **unavailable** (degraded or permission problems), and **upsell** (the feature needs a higher plan).
- **Use success messages sparingly.** Skip them when the UI already shows the result (for example, you land on the new issue). They are still needed for things like "copied to clipboard", or when creating several issues in a row.
- **Proximity.** Place the message near the action that caused it. Put a page- or section-wide message at the top of the body. When the action happened inside a dialog, show the message *inside the dialog*; do not close the dialog and show a page banner.
- **Primer error flowchart, condensed:**
  - For a long-running action started from a dialog, do not close the dialog until it finishes, unless the user needs to move on.
  - If they need to move on, show progress in a banner that is later replaced by success or error.
  - If the user can leave the page, use the product's notification system.
- **Carbon's three principles:** relevant, timely, informative. It distinguishes **task-generated** notifications (a form submitted, an upload failed) from **system-generated** ones (lost connection, maintenance coming, report ready, session expiring).
- **Carbon types and when to use them:**
  - **Inline.** Persists until resolved. Two lines or fewer. Never covers content.
  - **Toast.** Time-based and slides in. Three lines or fewer, fixed width, stacks newest-on-top. For system messages not tied to a UI region.
  - **Actionable.** Takes focus, so it is disruptive to screen-reader users. Include the close "x" *only* if reading it is not critical.
  - **Callout.** Loads with the page content.
  - **Banner.** Product- or system-level.
  - **Notification panel.** The notification center.
  - **Modal.** Critical only, and one at a time.
- **Don't open system-generated pop-ups such as an NPS survey while the user is working.** Carbon's dialog guidance says to use a toast for background-process alerts instead.

### A.0.3 Degraded experiences (Primer) [V-repo]
Source: https://primer.style/ui-patterns/degraded-experiences
- Separate **primary** experiences from **secondary** ones.
  - If a primary experience fails (for example, an issue's title and body), render an error page.
  - If only secondary experiences fail, render the page without them.
- **Never show a generic empty state for content the user created.** It makes them think their data is gone. Say it is *unavailable*, or remove the section together with its heading.
- Show at most **5 outage messages** per page.
- For a global incident, show a warning banner above the global nav that links to the status page.
- Never hide the global navigation header.
- When you cannot compute a count or badge, hide it.
- Never *disable* a control because of an outage. Hide non-critical buttons, or use an "inactive" button that explains why when clicked.
- Tooltips work only on focusable elements, so a tooltip on a disabled button is inaccessible.
- A CLI must never fail silently.

### A.0.4 Disabled vs read-only vs hidden (Carbon "Disabled states") [V-repo]
Source: https://carbondesignsystem.com/patterns/disabled-states/
- **Disabled:** temporary, caused by a dependency or prerequisite. The element never fully disappears. Add an inline warning explaining how to enable it when it blocks the primary action.
- **Read-only:** the content matters but cannot be changed. It stays readable by screen readers and has no interactive styling.
- **Hidden:** use when the user lacks *permission*.
- This gives a 3-way rule for permission-aware SaaS UI:
  - a missing permission is *hidden*, or shown inactive with an explanation when the user needs to know the feature exists;
  - a missing prerequisite is *disabled plus a hint*;
  - a locked value is *read-only*.

### A.0.5 Loading thresholds (Primer "Loading") [V-repo]
Source: https://primer.style/ui-patterns/loading
- Under 1s, show no indicator. From 1 to 3s, show an indeterminate indicator. From 3 to 10s, show a determinate one if possible. Over 10s, show a determinate indicator and turn the work into a *background task*.
- Show items as they arrive (incremental loading) and load the most important data first.
- Collapse adjacent spinners into one.
- Use an interstitial loading page only for waits of about 3s or more that produce a big change (for example, repo creation).
- The lifecycle is initiated, in progress, then succeeded or failed, and a failure includes a retry.

### A.0.6 Empty states (Primer "Empty states", Carbon "Empty states") [V-repo]
Sources: https://primer.style/ui-patterns/empty-states and https://carbondesignsystem.com/patterns/empty-states-pattern/
- **Kinds:**
  - *first use / no data yet*;
  - *temporarily empty* (for example, no notifications);
  - *user-action result*: no search results, or everything completed;
  - *error*: permission, system, or configuration required.
- **Anatomy:** optional graphic, primary text, secondary text, one primary action, and an optional "Learn more" link.
- In an error state the graphic must not be playful; use an alert icon. Error states almost never have a secondary action.
- Carbon: cover only *one* option per empty state. Use no product jargon. Never create a dead end. When several empty states can show at once, use tertiary buttons.
- Error copy should be specific but not over-technical. "Form could not be submitted. Some required fields were empty." is good. "There was a problem" is too vague. "The US East-2 database cluster … is down" is too literal.

### A.0.7 Dialog vs page (Carbon "Dialogs") [V-repo]
Source: https://carbondesignsystem.com/patterns/dialog-pattern/
- Use a dialog for short, focused, user-initiated tasks. **Don't** nest modals, don't make a full-page modal ("a modal is not an alternative to a page"), and don't use a modal when the user needs to consult other information.
- If a task repeats often, move it onto the page.
- Modal variants:
  - *passive*: dismiss with x, Esc or a click outside;
  - *transactional*: Cancel plus a primary action;
  - *acknowledgment*: one button;
  - *progress*: Cancel, Previous and Next, where the last "Next" is relabeled to the final action.
- Dialogs have one primary action, on the far right, with Cancel on the far left. Use specific verbs; avoid "OK" and "Done".
- **Cancel undoes all changes** made in the dialog.

### A.0.8 Action vocabulary (Carbon "Common actions", Polaris "Common actions") [V-repo]
Sources: https://carbondesignsystem.com/patterns/common-actions/ and https://polaris.shopify.com/patterns/common-actions
- **Add** puts an existing object into a set. **Remove** takes an item out of a list without destroying it. **Delete** destroys it. Do not mix these up. **Clear** empties a field or selection. **Reset** returns to the last saved or applied state. **Refresh** re-syncs a view. **Close** dismisses and is always shown as an icon, never a button. **Cancel** stops the current action and warns about any consequences.
- Before any add or remove action, Carbon asks: are there financial, access or legal consequences? Does the user have permission? Is it permanent? How long does it take? What happens on failure? Is it single or bulk?
- **Polaris labels:** use verb + noun ("Add customer", "Delete products"). Put icons to the left of labels. Use no more than **two filled/shaped buttons per card**. Row actions in lists and tables use tertiary icon buttons, shown on hover on desktop and always shown on touch.

### A.0.9 Error-message content (Polaris "Error messages") [V-repo]
Source: https://polaris.shopify.com/content/error-messages
- Say what is wrong and what to do. Be specific: use the user's own data, exact numbers and dates.
- Don't over-apologize, and don't bring in "we" unless the company caused it. Avoid "invalid".
- **Do:** "To save this product, make 2 changes: Enter title · Add weight".
- **Don't:** "There are 2 errors on this page. Invalid title…".
- **Do:** "Couldn't deposit payout. The bank account we have on file was closed. Update your details, and we'll retry automatically."
- The pattern is: heading states the effect, then the body gives the fix plus a link, then a CTA offers a one-step solution.
- Use red for critical problems that need action now. Use yellow for everyday-workflow warnings.

---

## A.1 Settings pages

**Purpose.** Let users find and change configuration quickly and safely.

**Anatomy (Polaris "App settings layout" [V-repo], https://polaris.shopify.com/patterns/app-settings-layout):**
- Two columns on desktop.
  - The **left column** holds a glanceable section label plus a short description. Add a description only if it helps.
  - The **right column** holds the settings, grouped in **cards**.
- Sections are stacked vertically on the page. On a phone, the columns stack: label, then card.
- For large products, add a settings **sub-navigation** (a left nav list). Primer calls this sidebar navigation (NavList) for settings pages [V-repo, primer navigation/degraded docs].

**Rules**
- Choose the save model per section using A.0.1. Toggle-only sections auto-save with an inline "Saved" indication. Field sections get one explicit "Save changes" per form.
- **Dirty state.** When the form differs from saved values, show that it is dirty. Common implementations:
  - enable a sticky "Unsaved changes" bar with Discard and Save [K; Shopify admin's "contextual save bar" is the canonical example, unverified in this session];
  - warn on navigation away (`beforeunload`, or an in-app route guard).
  - Keep the Save button enabled at all times (Primer).
- **Scope labels.** Make clear whether a setting applies to *me*, *this workspace/org*, or *this project*. Separate "Personal settings" from "Organization settings" in the navigation [K; GitHub uses exactly this split].
- **Danger zone.** Put irreversible or high-impact actions in a visually separate section at the **bottom** of the general settings page. Examples: transfer, archive, delete, change visibility.
  - GitHub's flow is documented in https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository [V-repo]: scroll to "Danger Zone", click "Delete this repository", then "I want to delete this repository", then read the warnings and click "I have read and understand these effects", then **type the repository name**, then click "Delete this repository".
  - The warning spells out the consequences: team permissions are deleted permanently; deleting a *private* repository deletes all its forks; some deleted repositories can be restored within 90 days.
- **Permissions.** Settings the user cannot change are shown *read-only*, with who can change them ("Only owners can change this"). Settings the user must not know about are hidden (A.0.4).

**States:** loading (skeleton the cards), saved, saving (button spinner, stay on the page), error (keep the input and show an inline or banner message), no-permission (read-only), degraded (A.0.3).

**Anti-patterns**
- A Save button on every card combined with a global Save.
- Toggles that silently need a Save.
- Disabled Save with no explanation.
- Destructive actions mixed in with ordinary ones.
- Settings search that returns nothing and gives no link to documentation.
- A setting whose effect is invisible, with no preview and no description.

**Copy examples**
- Section: "Email address. Where we send receipts and security alerts."
- Danger button: "Delete workspace". Don't use "Delete".
- Read-only hint: "Managed by your identity provider. Contact your admin to change it."

## A.2 Account / profile

- **Separate these areas:** Profile (public: name, avatar, bio), Account (email, password, passkeys, connected logins, sessions/devices, 2FA), Preferences (language, region, theme, notifications), Privacy (data export, account deletion).
- **Changing an email** needs verification of the new address. Keep the old address active until the new one is confirmed, and notify the old address [K; standard security practice, see OWASP cheat sheets in refs7 for the auth details].
- Asking for **re-authentication** before sensitive changes (email, password, 2FA, deletion) is acceptable. Apple explicitly allows it for deletion (A.25).
- **GOV.UK "Create accounts"** [V-repo] (https://design-system.service.gov.uk/patterns/create-accounts/):
  - don't make accounts if the service works without them, because accounts are a barrier and costly to maintain;
  - let people use as much of the service as possible before creating one;
  - say "Create an account", and label fields "Create a password" so they don't look like sign-in;
  - make the sign-up/sign-in difference obvious, because side-by-side options alone are missed;
  - avoid CAPTCHAs, which are cognitive tests and culturally biased; WCAG's accessible-authentication criterion lists alternatives.
- **Names.** Use one free-text "Full name" field (plus an optional "What should we call you?") rather than first/last. See GOV.UK "Names" pattern (https://design-system.service.gov.uk/patterns/names/) [K; the file exists at `src/patterns/names`, content not read] and the falsehoods about names list in `refs7/kdeldycke_awesome-falsehood` [V-repo presence].

## A.3 Team & members management

**Anatomy.** A members table with columns avatar+name, email, role, status (Active / Pending / Expired / Deactivated), last active, and a row menu. Above the table sit an "Invite members" primary button, a search box, and a filter by role/status. Pending invitations appear as a tab or a separate section.

**Rules and evidence**
- **Invites expire.** GitHub org invitations expire after **7 days**. Expired invitations can be **retried or cancelled**, singly or in bulk [V-repo], https://docs.github.com/en/organizations/managing-membership-in-your-organization/inviting-users-to-join-your-organization. The UI needs "Resend", "Revoke/Cancel invite" and "Copy invite link" (if links exist), plus an expiry timestamp.
- **Seats.** With per-seat billing, an **unused seat must be available** before inviting or reinstating [V-repo, same doc].
  - The invite dialog should show "3 of 10 seats used". When seats run out, it should offer "Add seats" (and show the cost) rather than failing afterwards.
- **Removing a member.** Show the consequences before confirming. GitHub lists them [V-repo], https://docs.github.com/en/organizations/managing-membership-in-your-organization/removing-a-member-from-your-organization:
  - loss of access to private forks;
  - pending invites they sent are cancelled;
  - the paid license count does **not** go down automatically (seat-billing surprise);
  - membership data is kept for **3 months** and can be reinstated.
- **Reinstating:** returning within the retention window restores the former access and settings [V-repo, reinstating doc].
- **Roles.** Show a short description of each role inside the role picker ("Admin: can manage billing and members").
  - Preventing the last Owner from leaving or being demoted is a good rule [K; common practice].
  - "Transfer ownership" belongs in the danger zone. It needs the new owner to accept, or a type-to-confirm step, plus an email to both parties [K].
- **Identity-provider (SCIM) managed members** cannot be removed in the app; they are removed at the IdP. Show them as read-only with "Managed by <IdP>" [V-repo, removing doc mentions SCIM and IdP groups].
- **Offboarding:** GitHub recommends giving leavers a checklist [V-repo].
- **Bulk:** selecting rows lets you change role or remove in bulk (A.12).

**States**
- *Empty:* "Invite your team. Projects are better together." plus an Invite button. Also offer invite-link copying and a domain auto-join setting if relevant.
- *Invite pending, expired, failed* (email bounced).
- *Seat limit reached* (upsell state).
- *No permission* (the list is visible, actions are hidden).

**Anti-patterns**
- Silently charging for seats on invite.
- Removal without saying what the user loses.
- No way to resend an invite.
- A role list with no explanations.
- Letting the org end up with zero owners.

## A.4 Billing & plans

**Anatomy (a single "Billing" page, or tabs):**
1. **Current plan card:** plan name, price, billing period, renewal date, seats, "Change plan".
2. **Usage meters:** for each metered resource, show used / limit, percent, the reset date, and what happens at the limit. Use a bar with a text label; never color alone.
3. **Payment method:** card brand + last 4 + expiry, "Update". Show an expiry warning.
4. **Billing details:** company name, address, tax ID. These appear on invoices.
5. **Invoices/history:** date, number, amount, status (Paid / Open / Failed / Refunded), download PDF.
6. **Cancel subscription.** This is not hidden. It lives in the plan card menu or at the bottom.

**Reference implementation: Stripe Billing customer portal** [V-search], https://stripe.com/blog/billing-customer-portal and https://docs.stripe.com/api/customer_portal/configurations/object
- It lets customers update payment methods, view invoice/billing history, and update, upgrade/downgrade, pause or cancel subscriptions. It cannot create new subscriptions.
- Cancellation can collect a **reason** (`too_expensive`, `missing_features`, `switched_service`, `unused`, `other`) plus a comment.
- **Proration preview:** show the amount *before* applying a plan change [V-search], https://docs.stripe.com/billing/subscriptions/prorations.

**Rules**
- **Upgrade** takes effect now. Show the prorated amount due today and the new recurring price *before* confirming. Example: "You'll be charged $18.40 today for the rest of this billing period, then $49/month from 1 Nov."
- **Downgrade** usually takes effect at period end [K; the common default, which is configurable in Stripe]. Show "Your plan changes to Starter on 1 Nov. You'll keep Pro features until then". List what will be lost ("3 projects over the Starter limit will become read-only").
- **Cancel:**
  - One clear path. It may include one retention offer and a reason survey, and the survey must be optional.
  - Show the end-of-access date and what happens to the data.
  - Afterwards, show "Resume subscription" until the period ends.
  - Don't require a phone call or chat for cancellation [K; regulators treat this as a dark pattern].
  - Status as of 2025: the US FTC "click-to-cancel" rule was **vacated by a federal appeals court in July 2025**. Some US states still require an online cancellation path [K, unverified; check before citing].
- **Failed payment (dunning):** show a persistent banner to admins only: "Your last payment failed. Update your card by 12 Oct to avoid interruption." Other members see nothing, or a neutral "Contact your admin".
- **Trials:** show the days left and what happens at the end (auto-convert or not). Remind before conversion (A.26).
- **Taxes and currency:** show whether prices include tax. Localize currency formatting.

**Anti-patterns**
- Cancel buried behind a support email.
- Pre-checked add-ons.
- Price shown without the billing period.
- Downgrades that delete data without warning.
- Plan-comparison tables with hidden asterisks.
- Charging for seats silently when invites are accepted.

## A.5 Notifications (in-app center, preferences, digest)

**In-app notification center.** Carbon's notification-panel best practices [V-repo]:
- let users manage their preferences;
- don't re-send the same notification if it was ignored;
- list items in chronological order;
- you may group by source or urgency;
- use it together with toasts for incoming items.
- Carbon notes the panel still needs more research before it becomes a component, so this is not settled guidance.

**GitHub inbox as a reference** [V-repo], https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications
- Each item shows the **reason** you got it (mention, review requested, subscribed, assigned). You can filter by reason (`reason:review-requested`).
- Triage actions: **Done** (removes from inbox, reviewable later via `is:done`), mark read/unread, **Save** for later, unsubscribe.
- **Default subscriptions** come from participation: authored, assigned, commented, @mentioned, team mentioned, state changed. Watching is separate and opt-in, with auto-watch for repos you can push to as an on-by-default setting.
- Delivery channels are web inbox, mobile app and email. Web inbox items are kept for 3 months [V-repo, configuring-notifications].

**Preferences matrix**
- Rows are event types, grouped (Mentions, Assigned to me, Comments on my items, Billing, Security, Product news). Columns are channels (In-app, Email, Push, Slack).
- Security and billing notices to owners may be locked on (read-only, with a reason).
- Marketing email is separate and opt-in [K; also a legal requirement in many regions].
- Offer per-object overrides: Watch/Unwatch/Custom on a project, as GitHub does [V-repo].
- **Digest:** batch low-urgency items into a daily or weekly email with a chosen send time and timezone [K].
- **Quiet hours / snooze** for push [K].

**States:** empty inbox ("You're all caught up"), loading, error, and "notifications paused".

**Anti-patterns**
- One global on/off switch only.
- Unsubscribe links that need a login.
- Badge counts that never clear.
- Re-notifying about the same event.
- Notifications with no link to their object.
- Push permission requested on first launch without context. Ask at a moment of value; see the D-mobile notes.

## A.6 Search (global search, results page, zero results, facets)

**Carbon search types** [V-repo], https://carbondesignsystem.com/patterns/search-pattern/
- **Basic search.** Goes to a separate results page and only queries when the user submits. Use it when search is expensive or slow, or the content is unfamiliar. Show *recent* and/or *trending* searches on focus, and type-ahead suggestions while typing.
- **Active search.** Filters as you type, with no Go button and an "x" clear button. Use it for small datasets, when users know what they want, or to filter an on-page catalog. It may offer "See all results", which falls back to basic search.
- **Focused search.** Active results within the current scope, plus an option to widen the scope to everything. Good inside suites and folders.
  - Results can be clustered by category, with "View all" per category.
  - A chosen subcategory acts as a filter that **persists** until cleared or the session ends.

**Rules**
- Always **show the result count, including 0**. With scope filters, show a count per scope.
- **Scope filter:** one scope at a time, with "All" as the default.
- **No label is needed** on a search field. Use the magnifier icon plus specific placeholder text ("Search networks or devices"). Note: this is Carbon's position. It still needs an accessible name (`aria-label`) [K; WCAG 4.1.2].
- Mirror the layout for RTL languages.
- **Avoid dead ends.** For zero results, suggest a next step:
  - check the spelling or suggest a correction;
  - remove filters (list the active ones with a "Clear all");
  - search everything instead of this scope;
  - offer popular items;
  - "Can't find it? Contact support" or "Create '<query>'".
- Keyboard: Tab into the field, Enter runs the search. Arrows move through suggestions, Enter picks one, Esc closes. For facets, keep focus on the facet after results reload.
- For a **global command palette**, open it with ⌘K/Ctrl+K, group results by type (Pages, Projects, People, Actions), mark recent items, and let the user run actions directly [K; the common 2026 SaaS pattern].

**Results page anatomy:** query echo + count, scope tabs (All / Projects / Docs / People), facets (left column or top bar), result items (title with the match highlighted, breadcrumb/path, snippet, metadata), sort, pagination or "load more".

## A.7 Lists/tables with filters and saved views (brief; the data-grid skill covers depth)

**Carbon filtering** [V-repo], https://carbondesignsystem.com/patterns/filtering/
- **Selection methods:** single-select (radio semantics), multi-select (checkbox semantics), multiple categories, **batch** apply ("Apply filters" button) and **instant** apply.
  - Use batch for many selections across categories, or slow data.
  - Use instant for a single category or a single choice.
- **Multiple categories are never put inside one dropdown.** Place them in a left column or a top bar.
- Each category starts **all selected or all unselected**. Choose based on whether users usually exclude a few values or include one.
- When filters sit in a hidden drawer or menu, show a **count of applied filters** on the trigger and a clear action that does not require reopening it.
- Offer "Clear" per category and "Clear all" across categories. Clearing returns to the default state.

**Saved views** [K]:
- store the filters, sort, visible columns and grouping under a name;
- separate personal from shared views;
- mark a default view;
- show a "modified" indicator with "Save" / "Save as new" / "Reset";
- encode the view in the URL so it can be shared.

## A.8 Detail pages (header with actions; tabs vs sections)

**Polaris "Resource details layout"** [V-repo], https://polaris.shopify.com/patterns/resource-details-layout
- A full-width **page header** holds title, status badge, primary action, secondary actions ("More actions": Duplicate, Archive, Delete marked destructive), and previous/next pagination between records.
- Two columns:
  - the **primary** column is about two-thirds wide and holds what *defines* the object;
  - the **secondary** column holds status, metadata and summaries.
- Group similar content into one card and order cards by importance.
- In the actions menu, put *unique* page actions at the top and *typical object* actions (duplicate, archive, delete) at the bottom.
- Use the default width, because full width wastes space and hurts parsing.
- Use the **same layout for create and edit**, so creating an object teaches how to edit it later.

**Tabs vs sections** [K; NN/g "Tabs, Used Right", https://www.nngroup.com/articles/tabs-used-right/, unverified in this session]
- Use tabs when the content groups are parallel, users need only one at a time, and they don't need to compare across tabs.
- Use one scrolling page with sections (plus an in-page table of contents) when users scan or compare, or when there are only 2–3 short sections.
- Put a tab's item count in its label ("Comments 12").
- Keep the tab state in the URL.

## A.9 Create/edit flows (modal vs page vs wizard; drafts)

**Decision table** (synthesized from Carbon dialogs [V-repo], GOV.UK question pages [V-repo] and Polaris [V-repo]):

| Situation | Use |
|---|---|
| 1–3 fields, quick, user stays in context (rename, add tag, invite) | **Modal/dialog** |
| Many fields, needs reference to other info, or is a core object | **Full page** (the same layout as the detail page, per Polaris) |
| Long, sequential, branching, or unfamiliar to users; answers depend on earlier answers | **Wizard / one-thing-per-page** (GOV.UK) |
| Many independent parts completed over several sessions | **Task list hub** (GOV.UK "Complete multiple tasks"), A.23 |
| Inline tweak of one attribute | **Inline edit** with an adjacent Save/Cancel (Primer) |

**Drafts** [K]:
- auto-save drafts of long content locally and/or to the server;
- show "Draft saved 2 min ago";
- list the user's drafts;
- label the draft status in lists;
- on conflict (edited elsewhere), show a merge or "reload" prompt.
- Don't auto-*publish*. Auto-save the draft and publish explicitly.

## A.10 Multi-step wizards

**GOV.UK question pages** [V-repo], https://design-system.service.gov.uk/patterns/question-pages/
- Start with **one question per page**. Use the label or legend as the H1, so screen readers hear it once.
- Every page has a **Back link**, a page heading and a **Continue** button. Label it "Continue", not "Next", and left-align it.
- **Don't break the browser Back button.** It should return to the previous page in its last state. After a do-once action such as a payment, Back should show a sensible message instead of repeating the action.
- **Progress indicators:** first test without one. Improve order and number of questions before adding one. Show a total only if it is reliable.
- Never ask for the same information twice. Pre-fill it, or offer earlier answers as options.
- Mark optional fields "(optional)". **Never mark required fields with asterisks.**
- Allow "I do not know" when it is a valid answer.
- Hint text is one short sentence with no links. Screen readers may not announce links in hints.

**Validation (GOV.UK "Recover from validation errors")** [V-repo], https://design-system.service.gov.uk/patterns/validation/
- Validate **on submit, not on blur**.
- On error:
  - re-show the page with the user's input kept;
  - prefix the `<title>` with "Error: ";
  - put an **error summary** at the top and move focus to it;
  - put inline messages next to the fields.
- Accept varied formats (spaces in postcodes, apostrophes and diacritics in names). Strip invisible or pasted characters.
- Always validate on the server. GOV.UK turns off HTML5 validation (`novalidate`, no `required`) because it cannot be styled consistently.
- Don't use validation to decide *eligibility*. Send ineligible users to a page that explains what to do next.

**Carbon progress modal:** Cancel (ghost, left), then Previous and Next on the right, with the final Next relabeled to the action ("Create project") [V-repo].

**Wizard anti-patterns**
- A stepper that allows jumping ahead into invalid states.
- Losing data on Back.
- A final "Submit" with no review step (see A.22).
- Stepper labels that don't match page titles.
- More than about 7 steps without grouping them as tasks [K].

## A.11 Destructive action confirmation (type-to-confirm vs undo)

**Carbon's three tiers of delete** [V-repo], https://carbondesignsystem.com/patterns/common-actions/#delete

| Impact | Behavior |
|---|---|
| **Low**: trivial to undo or recreate | Delete immediately, with no warning (offer undo) |
| **Moderate**: can't be undone, or not easily recreated, or several items | A confirmation dialog explaining what will happen |
| **High**: very costly to recreate, large amounts of data, or cascades to other items | A dialog **plus typing the resource name** |

- **Post-deletion:** return to the list, animate the item out, and show a success notification.
- If the deletion failed, notify the user (and also by email if possible) and animate the item back in.

**Undo over confirm** [K]: Aza Raskin, "Never Use a Warning When You Mean Undo", A List Apart, 2007, https://alistapart.com/article/neveruseawarning/. Users habituate to confirmation dialogs and click through them. For reversible actions, act immediately and offer undo, using a toast with "Undo" that lasts about 5–10s. The soft-delete/trash then keeps the item for N days.

**Checklist for a destructive dialog**
- The title names the action and the object: "Delete project 'Apollo'?"
- The body gives concrete consequences with numbers: "This permanently deletes 124 tasks, 38 files and all comments. Members lose access immediately."
- It says whether recovery exists: "You can restore it from Trash for 30 days" or "This can't be undone".
- The destructive button uses danger styling and a specific verb: "Delete project". Never "OK" or "Yes".
- Cancel is the default focus for high-impact deletes [K].
- For high impact, the user types the name. Compare case-sensitively. Pasting is allowed [K; GitHub allows paste].
- For account-level or org-level deletes, re-authenticate.
- For cascading effects, list the affected dependents.

## A.12 Bulk actions

[K, synthesized; Carbon data table "batch actions" exists, https://carbondesignsystem.com/components/data-table/usage/, not read]
- **Anatomy:**
  - a checkbox column, with a header checkbox for "select page";
  - after selecting a page, a link "Select all 1,240 matching items";
  - a contextual **batch toolbar** that replaces the normal toolbar and shows "12 selected", the bulk actions, and "Cancel/Clear selection".
- **Rules:**
  - show the count;
  - keep the selection across pagination only if you show it clearly;
  - handle permissions per item;
  - run long bulk jobs in the background with a progress notification;
  - report partial failure ("118 archived, 6 failed. View failed items").
  - Carbon's "Add/Remove" considerations apply (single vs bulk) [V-repo].
- **Confirmation** scales with impact (A.11). Bulk delete is at least "moderate".

## A.13 Import/export (CSV import mapping and validation preview)

[K, synthesized from common practice (Flatfile/OneSchema-style importers), unverified in this session. Error wording follows GOV.UK file upload [V-repo].]
- **Steps:**
  1. **Upload.** Accept drag-and-drop or a button. State the accepted types and size limit up front, and offer a template download.
  2. **Map columns.** Auto-match by header name. Let users map each column to a field or "Don't import". Show sample values next to each. Flag required fields that are not mapped.
  3. **Review/validate.** Preview the rows with the errors highlighted per cell. Filter to "Rows with errors". Allow inline fixes. Offer "Skip invalid rows" vs "Fix first".
  4. **Import.** Run as a background job for large files, with progress.
  5. **Result summary:** "1,204 imported, 12 skipped. Download error report (CSV)". Offer undo or rollback within a time window if feasible.
- **Duplicates:** choose update existing / skip / create new, and state the matching key ("Match on email").
- **Encoding and locale:** handle UTF-8 BOM, `;` vs `,` delimiters, decimal commas and date formats. Show the detected settings and let users change them.
- **GOV.UK file-upload error messages** [V-repo], https://design-system.service.gov.uk/components/file-upload/:
  - "Select a report"
  - "The selected file must be a CSV or ODS"
  - "The selected file must be smaller than 2MB"
  - "The selected file is empty"
  - "The selected file contains a virus"
  - "The selected file is password protected"
  - "The selected file could not be uploaded – try again"
  - "You can only select up to 10 files at the same time"
  - "The selected file must use the template"
- **Export:**
  - choose the scope (current view/filters vs all) and the format (CSV, XLSX, JSON);
  - large exports run async and are delivered by email or notification with an expiring link;
  - include a timestamp in the filename;
  - guard CSV exports against formula injection by escaping cells that start with `=`, `+`, `-` or `@` [K; OWASP "CSV Injection", check `refs7/OWASP_CheatSheetSeries`].

## A.14 Activity feed / audit log

[K, with GitHub audit log docs as reference, https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/reviewing-the-audit-log-for-your-organization (sparse-checked out, not read in detail)]
- **The two are different things.**
  - An **activity feed** is user-facing and social: "Ana commented on Task 12".
  - An **audit log** is admin-facing, complete, immutable and filterable, for compliance.
- **Audit log row:** timestamp (absolute, with timezone, and a relative tooltip), actor (user, API token or integration, plus IP and location if collected), action (`member.remove`), target, and metadata/diff (old → new).
- Filter by actor, action, target and date range. Export (CSV/JSON) and stream to a SIEM for enterprise [K].
- Retention period is stated ("Events are kept for 180 days").
- **Activity feed:** group bursts ("Ana made 5 changes"), link to the object, show relative times (absolute on hover), and offer "Load more" instead of infinite scroll if users need the footer.

## A.15 Comments & mentions

[K, synthesized]
- The composer has a Write/Preview split (or WYSIWYG) with Markdown support stated. The Submit button sits right-aligned below the text area (Primer [V-repo]). Draft text is kept when navigating away.
- **@mentions:** typing @ opens a popover of people who **have access**. Warn if the person mentioned lacks access ("Sam can't see this project. Invite?"). Mentions notify people according to their preferences (A.5).
- **Threading:** use one level of replies plus "resolve thread" for review contexts. Edited comments show "edited" and their history. Deleted comments leave a placeholder if replies exist.
- **Reactions** reduce "+1" noise [K].
- Primer [V-repo]: a successful comment edit needs no success message, because returning to the updated comment is the feedback.

## A.16 File upload & attachments

- **GOV.UK** [V-repo]:
  - ask for uploads only if they are critical to the service;
  - support both "Choose file" and drag-and-drop;
  - **let users reuse a file** already uploaded in the same journey, but consider public devices before offering preview/download;
  - use a specific error message for each failure (see A.13).
  - The improved accessible component shipped in GOV.UK Frontend 5.9.0 (March 2025).
- **Attachments UI** [K]:
  - show per-file progress, cancel and retry;
  - thumbnail images;
  - show the file name, size and type;
  - allow remove before submit;
  - paste-to-upload in composers;
  - check limits client-side for fast feedback *and* server-side;
  - scan for malware asynchronously and show a "Scanning…" state.

## A.17 API keys / tokens page

**References**
- GitHub personal access tokens [V-search], https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens: the token value is **shown once** and must be copied immediately.
- The same GitHub doc [V-repo]:
  - fine-grained tokens have a name, description, resource owner, **expiration** (1–366 days or none; defaults to 30 days, or less under an org policy) and per-permission `read`/`write`/`admin`;
  - organizations can set maximum-lifetime policies;
  - pre-filled creation URLs (`/settings/personal-access-tokens/new?name=…&expires_in=45&contents=read`) show a "least-privilege template" idea.

**Anatomy**
- The list shows name, prefix/last 4 characters (never the full key), scopes/permissions, created by, created at, **last used** [K; GitHub shows last-used, unverified here], expires at, and status (Active / Expired / Revoked).
- The create flow collects name, expiration (with a *default*, and a warning when "no expiration" is chosen), scopes (least privilege, grouped with read/write), and environment (test/live).
- The reveal step shows the secret once in a monospace field with **Copy**, plus the warning "Make sure to copy your key now. You won't be able to see it again." There is a "Done" button and no Close-by-accident.
- Row actions: Regenerate/Roll (optionally with a grace period in which both keys work [K; Stripe offers this, unverified]), Revoke (confirm), Edit name/scopes.
- **Security** [K]:
  - use recognizable prefixes (such as `ghp_`, `github_pat_`, `sk_live_`) so secret scanners can detect leaked keys;
  - email the owner when a key is created;
  - show expiring-soon warnings.

**Anti-patterns**
- Showing full keys again later.
- Keys with no names.
- All-or-nothing scopes.
- No last-used date, which means admins can't safely revoke.
- Keys tied to a person with no service-account option [K].

## A.18 Webhooks settings page

**GitHub webhook best practices** [V-repo], https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks. The settings UI should encourage each of these:
- subscribe to the **minimum events**;
- set a **secret** (high entropy);
- use **HTTPS with SSL verification** (verification is on by default, so warn when it is turned off);
- publish an IP allow list via the `GET /meta` endpoint;
- the receiver must **respond 2XX within 10 seconds** (30 on GHES), so queue the processing;
- check the event type and action before processing;
- **redeliver** missed deliveries;
- use the unique delivery ID header against replay.

**UI anatomy** (GitHub's webhook page is the model [V-repo, viewing/redelivering deliveries docs]):
- endpoint URL, content type, secret (set and rotate, never shown again), SSL verification toggle, event selection ("Just push" / "Everything" / "Let me select"), and an active toggle;
- a **Recent deliveries** list with status (✓ / ✗ plus the HTTP code), timestamp and duration, expandable to request headers and payload plus the response;
- a **Redeliver** button;
- a "Send test event" action [K];
- auto-disable after repeated failures, with an email [K];
- Stripe retries failed live-mode deliveries for up to 3 days with exponential backoff and has a similar dashboard [K; unverified, https://docs.stripe.com/webhooks].

## A.19 Integrations / marketplace page

[K, synthesized]
- The directory has search, categories, and "Installed" / "Available" filters.
- Each card shows logo, name, one-line value, publisher, a verified badge and an install count.
- The detail page shows what it does, screenshots, **permissions requested** (listed plainly before install), pricing, support link and privacy policy.
- The install flow is OAuth consent (showing the requested scopes), then configuration, then success with next steps.
- Installed integrations have a settings page with connection status, last sync, errors, reconnect and **uninstall**, and they state what happens to synced data.
- A degraded connection (expired token) shows an actionable banner: "Reconnect Slack to resume notifications."

## A.20 Feature announcements / changelog / what's new

- **Polaris "New features"** [V-repo], https://polaris.shopify.com/patterns/new-features. Highlight a feature with a "New" badge only if it meets all 3 of these:
  - the company wants adoption because the feature has high business value;
  - it creates *new, outsized* value, not just an improvement;
  - it is worth interrupting the user's workflow for.
  - The badge uses the informational variant and sits to the right of text.
  - The badge **disappears once clicked, or 5 days after first seen, or after 3 sessions**.
  - Pips (dots) mark new *items*, such as notifications, not new features.
  - The aims are to avoid inconsistency and clutter.
- **Primer "Feature onboarding"** [V-repo], https://primer.style/ui-patterns/feature-onboarding:
  - place onboarding next to where the feature permanently lives, in proportion to the feature's importance;
  - don't derail or trap the user, and open any "learn more" link without losing their work;
  - set **campaign limits**: why (system or user trigger), when (maximum days), and a maximum number of impressions; respect dismissal;
  - show **no more than 2 alerts at a time**;
  - structure it as beginning (attention), middle (guide with a checklist), end (celebrate).
  - Teaching bubble: one at a time, a headline, **~160 characters**, dismissed with "OK, got it". Don't point at hidden elements, and don't use one if the user can't act on the feature right away.
- **Changelog page** [K]: reverse-chronological entries with a date, title, one-paragraph benefit, screenshot or GIF, "Available on: plans", and a link to docs. Offer RSS or email subscribe. An in-app "What's new" entry point shows an unread dot that clears on open.

## A.21 Help & support

- **GOV.UK "Contact a department or service team"** [V-repo], https://design-system.service.gov.uk/patterns/contact-a-department-or-service-team/:
  - order channels by what research says users need, and keep the **same order everywhere**;
  - give opening hours with exceptions;
  - say **how long a response takes**;
  - explain any charges;
  - list social channels last, and warn against posting personal information;
  - when help is secondary, tuck long contact info into a Details (disclosure).
- **In-app help** [K]:
  - a "?" menu with docs search, keyboard shortcuts, what's new, contact support, and status page;
  - contextual "Learn more" links next to complex settings;
  - when contacting support, pre-fill the context (account ID, page, recent error ID) and show the expected response time per plan;
  - an error pages' "Contact support" includes the error reference.

## A.22 "Check your answers" (GOV.UK)

**Source:** https://design-system.service.gov.uk/patterns/check-answers/ [V-repo]
- **Use it** right before submitting small-to-medium transactions. For very large ones, consider one at the end of each section.
- **Why it helps:** it raises confidence that everything was captured, and it lowers error rates by giving a second chance.
- **Rules:**
  - use the page title to say what to do, so the Submit button isn't missed;
  - state that the transaction isn't complete until confirmed;
  - use sections, and show only the relevant ones;
  - you may rephrase questions as short statements;
  - make the submit button say what it does ("Send your claim form").
- **Change links:**
  - put a "Change" link on each row, with visually hidden text for screen readers ("Change *date of birth*");
  - Change goes back to the pre-filled question;
  - Continue returns straight to the check page, not through the rest of the flow;
  - if the new answer triggers more questions, ask them first and then return.
- Skipped optional answers show "Not provided".
- **SaaS translation:** use it for plan upgrades, bulk imports, org creation, permission changes and payment setup. A "Review" step lists the key choices with Edit links before a final "Create workspace" or "Confirm and pay".

## A.23 Task-list hub (GOV.UK "Complete multiple tasks")

**Source:** https://design-system.service.gov.uk/patterns/complete-multiple-tasks/ [V-repo]
- Use it only for long transactions done over several sessions. Simplify first.
- Show it at the start and at the start of each returning session.
- Task names start with verbs.
- **Statuses:**
  - start minimal ("Completed" / "Incomplete");
  - add "Not yet started" / "In progress" only if research shows a need;
  - "Cannot start yet" is grey and not a link;
  - "There is a problem" is red, and red is used for no other status;
  - completed items get *no* colored background, so attention goes to the remaining work.
- Let the user mark a task complete themselves when it has optional parts or long answers.
- **SaaS translation:** the "Set up your workspace" checklist (connect domain, invite team, import data, configure billing). Keep it dismissible and reachable later.

## A.24 Confirmation pages

**GOV.UK** [V-repo], https://design-system.service.gov.uk/patterns/confirmation-pages/. A confirmation page must include:
- a reference number, if there is one;
- **what happens next and when**;
- contact details;
- links to the next likely tasks;
- a feedback link;
- a way to save a record (PDF).

Users bookmark confirmation pages as receipts, so a revisit should work or respond helpfully. Don't put interactive elements inside the green panel, because they fail contrast. For SaaS, this covers "Payment received", "Import complete", "Workspace created" and "Deletion scheduled".

## A.25 Error pages (404 / 500 / maintenance / offline / permission / rate-limited)

**GOV.UK, all [V-repo]:**
- **404** (https://design-system.service.gov.uk/patterns/page-not-found-pages/):
  - title "Page not found"; include contact info if useful;
  - don't blame the user;
  - **no** breadcrumbs, **no** jargon ("404", "bad request"), **no** "oops" or humor, **no** red text.
- **500** (https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/):
  - H1 "Sorry, there is a problem with the service" plus "Try again later.";
  - say what happened to their answers;
  - give contacts, or another service that can do the job;
  - avoid "We are experiencing technical difficulties";
  - use one page for all unexpected errors, show it only briefly, and if the problem lasts, switch to the unavailable page;
  - **store entered data** so users can resume;
  - tested with 5 users, whose needs were "when will it work" and "how can I do what I came to do".
- **503 / maintenance** (https://design-system.service.gov.uk/patterns/service-unavailable-pages/):
  - "Sorry, the service is unavailable", with the **day, date and time** it will return, or what replaced it;
  - avoid vague words like "maintenance" and "improvements";
  - keep a generic page ready for emergencies.
- **Polaris 404 example** [V-repo]: heading "The page you're looking for isn't available", body "Check the web address or try again later", button **Retry**. Avoid "You must have the wrong address".
- **Permission denied / 403** [K + Carbon error-management empty state + GOV.UK "don't use validation for eligibility"]:
  - say *who* can grant access;
  - offer "Request access" (notifies an admin) and "Switch account" (the user may be signed into the wrong account);
  - don't leak whether the resource exists when that is sensitive; GitHub returns 404 for private repos [K].
- **Rate limited / 429** [K]:
  - "You've made too many requests. Try again in 30 seconds.", with a countdown if a `Retry-After` value is known;
  - for plan limits, link to the upgrade path.
- **Offline** [K]:
  - a persistent but unobtrusive banner "You're offline. Changes will sync when you reconnect.";
  - queue writes and show pending state per item;
  - disable only the actions that truly need the network, and explain why (A.0.3).
- **Degraded** (partial outage): A.0.3.

## A.26 Trial / plan-limit banners and upsells

- **Primer "upsell" state** [V-repo]: a message state for features available on higher plans.
- **Rules** [K, consistent with Primer placement guidance]:
  - show limits *near the thing that is limited* ("3 of 3 projects used, Upgrade for unlimited"), not as global nags;
  - a trial countdown banner shows days left, what happens at the end, and the upgrade CTA, and is dismissible per session;
  - approaching limits (80%) is a warning; at the limit, a blocking inline message with an upgrade path for admins and "Ask your admin" for members;
  - never hide the limit until the user hits it;
  - upsells should not be disguised as errors, and they should not appear in destructive or high-stress flows.

## A.27 Cookie consent (compliant, not dark)

- **GOV.UK cookie banner** [V-repo], https://design-system.service.gov.uk/components/cookie-banner/:
  - a banner is needed only if you set **non-essential** cookies (analytics and functional); essential-only sites just need a cookies page;
  - "non-essential" also covers localStorage, service workers and other device storage;
  - the banner has **Accept** and **Reject** buttons **of equal prominence** and a link to the cookies page;
  - after a choice, show a confirmation message with a Hide button, and store the choice for 1 year;
  - don't set non-essential cookies before consent;
  - **don't make it sticky/fixed**, because it could obscure focused content (WCAG 2.2 SC 2.4.11);
  - place it right after `<body>`, before the skip link;
  - it works without JS via a form POST, with progressive enhancement to avoid losing form state.
- **Cookies page** [V-repo]: audit and categorize (essential / functional / analytics / other, and server vs client set). For each cookie list the name, purpose, third party, and expiry. Don't bury it in the terms and conditions.
- **EDPB Cookie Banner Taskforce report (Jan 2023)** [V-search], https://www.edpb.europa.eu/ (summaries: https://www.huntonprivacyblog.com/2023/01/27/edpb-publishes-report-of-outcome-of-the-cookie-banner-taskforce/):
  - most authorities want a **reject option on the first layer**;
  - reject must not be made harder than accept through deceptive colors or contrast;
  - **pre-ticked boxes are not valid consent**.

## A.28 Language / region switcher

- **GOV.UK "Language navigation"** [V-repo; component status "Trial" as of 2026-08], https://design-system.service.gov.uk/components/language-navigation/:
  - use it only when the key content is available in each language;
  - list each language by its **native name** ("Cymraeg", "Español"), and set a `lang` attribute on each link;
  - use **one consistent placement** throughout: after the H1 for single pages, in the service navigation for the whole service;
  - **don't lose entered data** when switching;
  - translate the nav's `aria-label` and hidden link text.
- **Rules** [K]:
  - don't use flags for languages;
  - separate **language** from **region/currency/format**;
  - remember the choice, and prefer the `Accept-Language` default with an easy override;
  - use locale-aware formatting (`Intl`).

## A.29 Invite / referral pages

[K, synthesized]
- The invite page shows an email input that accepts multiple addresses (paste a list), a role picker, an optional message, and a "Copy invite link" option (with expiry and a reset control).
- For referrals, state the reward terms in plain words, show referral status (Invited / Signed up / Qualified / Rewarded), and include share buttons.
- **Anti-patterns:**
  - importing contacts without clear consent;
  - sending invites on the user's behalf without confirming each recipient (LinkedIn settled a class action over "Add Connections" reminder emails in 2015 [K, unverified]);
  - fake scarcity.

## A.30 Account deletion (required by App Store and Google Play) and data export

- **Apple** [V-web], https://developer.apple.com/support/offering-account-deletion-in-your-app/ and App Review Guideline 5.1.1(v):
  - since **June 30, 2022**, apps that support account creation must let users **initiate deletion in the app**;
  - make it easy to find, typically in account settings;
  - deletion must remove the **whole account record and associated data**; offering deactivation *only* is insufficient;
  - if deletion finishes on the web, **link directly** to that page;
  - re-authentication and confirmation steps (a code sent to the known email or phone) are allowed, but unnecessarily hard flows fail review;
  - only highly regulated industries may require customer-service steps; other apps must not require a call or email;
  - manual or slow deletion is OK if you say how long it takes and confirm when done;
  - user-generated content that was shared is deleted too;
  - GDPR/CCPA-only flows limited to some regions are **not** sufficient, because all users must be able to delete;
  - Sign in with Apple apps must revoke tokens via the REST API;
  - for auto-renewable subscriptions, tell users that billing continues through Apple and ask them to cancel first (link `https://apps.apple.com/account/subscriptions`); you may offer to schedule deletion at the subscription's end, as long as immediate deletion is also offered.
- **Google Play** [V-search], https://support.google.com/googleplay/android-developer/answer/13327111 and https://android-developers.googleblog.com/2024/03/designing-your-account-deletion-experience-google-play.html:
  - apps that allow account creation must provide **both an in-app path and a web link** where users can request account and data deletion without reinstalling; the web link is declared in the Data safety form;
  - associated data must be deleted, and any retained data (security, fraud, legal) must be disclosed;
  - extensions ran until May 31, 2024.
- **Data export** [K]: GDPR Art. 20 (portability) and Art. 15 (access), https://gdpr-info.eu/art-20-gdpr/. Offer "Download your data" as a machine-readable ZIP (JSON/CSV) built asynchronously, with an emailed expiring link. Offer it *inside* the deletion flow ("Download your data first").
- **Deletion-flow spec:**
  1. Settings → Account → Delete account (red, bottom).
  2. Explain what is deleted and what is kept (legal retention), the effect on teams and orgs (transfer ownership first, and block deletion if the user is the sole owner of paid orgs), subscription handling, and the timeline.
  3. Offer data export.
  4. Re-authenticate.
  5. Type "DELETE" or the email to confirm (high-impact tier).
  6. Show a confirmation page with the timeline and support contact, and send an email confirmation. A grace-period undo ("Your account will be deleted on 14 Oct. Log in before then to cancel") is allowed, provided deletion still happens [K].

## A.31 Pre-ship checklist for any SaaS screen (agent-ready)

- [ ] **Every state designed:** loading (with thresholds), empty (first-use, filtered-empty, error), partial/degraded, error, success, no-permission (hidden, read-only or disabled with a reason), offline.
- [ ] **Save model** chosen and consistent. Dirty state and unsaved-changes guard in place. Save button never disabled.
- [ ] **Destructive actions** tiered by impact (undo, confirm, or type-to-confirm), with concrete consequences.
- [ ] **Feedback** placed near the action. Success messages only when the result isn't visible.
- [ ] **Buttons** use verb + noun labels, one primary per view, and dialog buttons ordered consistently.
- [ ] **Long, real data** tested: 60-character names, 10k rows, zero rows, RTL, 200% zoom, text 30–50% longer [K; the W3C i18n guidance on text expansion, https://www.w3.org/International/articles/article-text-size, unverified here].
- [ ] **Permissions and billing edges:** seat limits, plan limits, expired trial, failed payment, IdP-managed users.
- [ ] **Keyboard and screen reader:** focus moves to error summaries and dialogs. No tooltips on disabled elements. Search keyboard model in place.
- [ ] **Legal:** account deletion in the app plus a web link (mobile), cookie consent with equal Reject, cancel path online, pre-ticked consent boxes removed.

---

# PART B: Building a design system from zero (process)

## B.1 Do you even need one? The decision ladder

[Synthesis. Tiers 1–2 are covered in C-resources/F-web notes; the rest is sourced below.]

| Tier | What | When it is enough |
|---|---|---|
| 0 | Use an off-the-shelf system as-is (shadcn/ui defaults, Radix Themes, Polaris for Shopify apps, Primer for GitHub apps) | Prototypes, internal tools, one product with one small team |
| 1 | **DESIGN.md + tokens + a copied component library (shadcn)**, with a few product-specific compositions | **Most startups and single-product teams.** One codebase, fewer than about 10 UI contributors [K; heuristic] |
| 2 | Tier 1 plus a documented **pattern layer** (settings page, table + filters, empty states, destructive confirm) as reusable blocks, and a private **shadcn registry** | Several apps or repos needing the same look and patterns, or AI agents generating UI across repos |
| 3 | A dedicated **design system product**: its own package, versioning, docs site, Figma library with Code Connect, contribution model, adoption metrics, a team | Several product teams or platforms (web + iOS + Android), and a brand consistency mandate |

Signals that you need to move up a tier [K + Brad Frost interface inventory, below]:
- the inventory shows duplicated components (Frost's example of **37 button styles**, paraphrased [V-repo]);
- different teams are rebuilding the same patterns;
- accessibility bugs recur in the same widgets;
- rebrands or theme changes take months;
- designers' Figma and the code visibly disagree;
- agents keep inventing new UI because there is nothing to reuse.

**Brad Frost on timing** [V-repo, paraphrased], https://atomicdesign.bradfrost.com/chapter-4/: the best time to start is now. It is easiest to piggyback the system on a redesign or replatform, but it doesn't have to wait for one.

## B.2 Step 1: Interface inventory (audit)

**Brad Frost's interface inventory** [V-repo, paraphrased; the book is copyrighted, so do not quote at length], https://atomicdesign.bradfrost.com/chapter-4/
1. **Gather people from every discipline** (UX, visual, front-end, back-end, content, PM, business, QA). Everyone should feel the pain of the inconsistency, and the exercise builds a **shared vocabulary**.
2. **Pick one capture tool** so the results can be merged. Frost offers a Google Slides template.
3. **Screenshot one example of each unique pattern**, not every instance.
   - Assign categories to people: global elements, navigation, image types, icons, forms, buttons, headings, blocks, lists, interactive components, media, third-party components, ads, **messaging** (the hardest, because messages need a user action to trigger), colors, and animation (use screen recordings).
   - **Timebox it to 30–90 minutes.**
   - Cover *everything*, including the 404 page, help, and legal pages, not only the homepage or core flow.
4. **Present per category** in 5–10 minutes each. Discuss the rationale and **naming disagreements** ("utility bar" vs "admin nav").
5. **Regroup:** merge everything into one master document. Decide what to keep, remove or merge, settle on names, and plan the move to a living pattern library. The document is a strong way to convince stakeholders, because non-designers can see the inconsistency too.

**Code-side inventory (agent-executable)** [K]:
- grep for hard-coded colors, font sizes and spacing (and count unique values);
- list component files with similar names (Button, Btn, PrimaryButton, CTA);
- use `react-scanner` to count component and prop usage (see B.9);
- note every modal, toast and dropdown implementation;
- list all empty, error and loading states.
- The output is a table: pattern, number of variants, locations, and a keep/merge/delete decision.

## B.3 Step 2: Foundations (tokens) first

Covered in depth in F-web-design-2026 §4 (DTCG 2025.10, tiers, Tailwind v4, shadcn tokens). Process points only:
- **Why tokens came first historically.** "Design tokens" were coined by **Jina Anne** and the **Salesforce Lightning Design System** team around 2014, and Salesforce built **Theo**, the first token generator. It stored a value once and emitted platform formats (hex for web, ARGB for Android, and so on) [V-search], https://css-tricks.com/what-are-design-tokens/ and https://www.smashingmagazine.com/2019/11/smashing-podcast-episode-3/.
- **Order of work:**
  1. color (primitives, then semantic roles: bg, fg, border, accent, and status success/warning/danger/info);
  2. type scale;
  3. spacing;
  4. radius;
  5. elevation;
  6. motion;
  7. breakpoints and z-index.
  - Name **semantic tokens by purpose**, never by value (`--color-danger`, not `--red-500`), so theming and dark mode are a remap.
- **Primer's bar for components (Alpha)** [V-repo], https://primer.style/guides/component-lifecycle: a component must reference **no hard-coded values**. It uses functional variables and works in every color mode and theme. This is a good lint rule for agents.

## B.4 Step 3: Core components (the small set that covers most screens)

- The claim "~20 components cover 80% of UI" is a **heuristic, not a sourced figure**. Present it as such.
- A sourced alternative: designsystemchecklist.com lists **29 core components**, captured in B-ux-principles §6.3.
- **Suggested order for a SaaS app** [K, synthesized from the Part A patterns above]:
  - **Actions:** Button (primary/secondary/tertiary/danger, loading), IconButton, Link, Menu/Dropdown.
  - **Inputs:** TextField, Textarea, Select/Combobox, Checkbox, Radio, Switch, DatePicker, FileUpload, SearchField.
  - **Feedback:** InlineMessage/Alert, Banner, Toast, Badge/Tag/Status, Progress/Spinner, Skeleton, EmptyState (Blankslate), Tooltip.
  - **Containers:** Card, Dialog (plus a Danger/confirm variant), Sheet/Drawer, Popover, Tabs, Accordion/Details.
  - **Navigation:** Sidebar NavList, Breadcrumbs, Pagination, PageHeader (title, status, actions).
  - **Data:** Table/DataTable with batch actions, List, DescriptionList/SummaryList, Avatar.
- **Each component ships with** [V-repo, Primer lifecycle Alpha/Beta criteria]:
  - all interactive states (see the F-web state matrix);
  - responsive behavior and touch-friendly hit areas;
  - dark mode/themes;
  - docs with examples;
  - unit tests plus **visual regression** of default and interactive states;
  - interaction tests;
  - **zero axe violations plus a manual a11y review**.
- **Maturity levels (Primer)** [V-repo]:
  - Experimental;
  - Alpha (the criteria above);
  - Beta: used in production in several places (3 or more instances for Primer ViewComponents, 1 or more for React), design-reviewed, SSR-compatible, no performance regressions;
  - Stable: **no breaking API changes for at least 1 month**, full docs including common misuses, and **lint rules or codemods that prevent use of the alternatives**;
  - Deprecated: documented alternative, **runtime warning** to consumers;
  - Removed: announced **1 month or more** ahead, with manual and automated migration paths available for 1 month or more.

## B.5 Step 4: Patterns

- Patterns are *compositions plus behavior rules* (Part A): the save model, messaging choice, empty states, destructive tiers, the filter model, forms and validation, and degraded states.
- Primer, Carbon, Polaris and GOV.UK all publish patterns separately from components. That is the model to copy.
- A pattern page contains [synthesized from the four systems' page structures, V-repo]:
  - when to use it and when not;
  - how it works (anatomy);
  - rules with do/don't;
  - states;
  - content/copy;
  - accessibility;
  - related components and patterns;
  - **research on this pattern / known gaps** (GOV.UK is honest here: "More research is needed…").
- **For agents:** each pattern should also exist as a **code block/recipe**, such as a shadcn registry item (`registry:block`), so that "build the settings page" composes the approved pattern instead of inventing one.

## B.6 Step 5: Documentation

- **Primer's contribution on-ramp** [V-repo], https://primer.style/guides/contribute/adding-new-components. It sets the minimal bar a component needs before it is shared:
  1. it exists and can be found (name, description, at least 1 Storybook story);
  2. it passes a design checklist;
  3. it has documentation (all features in stories plus MVP docs);
  4. it is accessible (axe plus review);
  5. it is ready to upstream.
- **Doc page per component** [K + Primer]: purpose, anatomy, variants, states, usage do/don't (with images), content guidelines, accessibility (keyboard map, ARIA, common misuses), props/API, related components, and changelog/status.
- **For AI agents, add machine-readable docs** [V-repo + C-resources notes]:
  - `DESIGN.md` at the repo root (token front-matter plus prose rules; see C-resources §6);
  - `components.json` plus a **shadcn registry** (`registry.json`) that distributes components, hooks, pages, config and **rules** to any project and framework [V-repo], https://ui.shadcn.com/docs/registry;
  - the **shadcn MCP server** (`npx shadcn@latest mcp init --client claude`) lets assistants browse, search and install registry items using registries declared in `components.json` [V-repo], https://ui.shadcn.com/docs/mcp;
  - the **shadcn skill** (`npx skills add shadcn/ui`) runs `shadcn info --json` to give the agent the framework, Tailwind version, aliases, base library (radix/base/aria), icon library and installed components [V-repo], https://ui.shadcn.com/docs/skills;
  - **Figma MCP server** plus **Code Connect** (below).

## B.7 Naming, theming, accessibility baked in

- **Naming:**
  - use the names the team settled on in the inventory;
  - name components by *role*, not look (`Banner`, not `YellowBox`);
  - props are consistent across components (`variant`, `size`, `disabled`, `loading`);
  - **never reuse an existing component's name for a different thing** (Primer rule [V-repo]);
  - one name across Figma, code and docs, enforced by Code Connect mappings [K].
- **Theming:**
  - semantic tokens remapped per theme; brand themes swap primitives only;
  - test every component in every theme, which is part of Primer's Alpha criteria [V-repo].
- **Accessibility in the component, not the product:**
  - focus management in Dialog, roving tabindex in Menu/Tabs, labels required by the API (TypeScript can require `label` or `aria-label`);
  - error text wired with `aria-describedby`;
  - no disabled-with-tooltip;
  - reduced-motion support.
  - The goal is that product teams get a11y "for free" and have to work to break it [K].

## B.8 Versioning, deprecation, contribution, governance

- **Versioning:** use semver. Breaking changes only in majors, with codemods, a migration guide and a deprecation period (Primer lifecycle above [V-repo]). Changesets-style changelogs [K].
- **Deprecation:** mark it in docs and types (`@deprecated`), emit a runtime or console warning (Primer [V-repo]), add a lint rule, publish a removal date at least 1 month ahead (Primer's minimum; larger orgs use a quarter or more [K]), and track remaining usage (B.9).
- **Contribution model: Primer's decision path** [V-repo], https://primer.style/guides/contribute/handling-new-patterns
  - Is it in Primer and does it fit? Use it.
  - Is it in Primer but doesn't fit? Try to change Primer first. If that is rejected, fork it under a **new name**.
  - Not in Primer, but something similar exists in the product codebase? Use that.
  - Otherwise, build something generic enough in a shared package that the feature team owns.
  - **Upstreaming** happens when several teams use it, it solves a design or a11y problem well, it has no negative consequences such as performance, it fits an existing "theme", and the maintenance cost is worth it.
  - Signs a component is *not* ready to share: it was rushed with known issues, it is too specific, or it is too complex for others' use cases.
  - Primer "intentionally has a high barrier to entry" and asks teams to come **early**, because it can't unblock last-minute requests.
- **Team models (Nathan Curtis, EightShapes)** [V-search], https://medium.com/eightshapes-llc/team-models-for-scaling-a-design-system-2cf9d03be6a0:
  - **Solitary:** one team's system, offered to others but serving that team first; an "overlord" risk.
  - **Centralized:** a dedicated team builds and distributes, and may not design products itself.
  - **Federated:** designers from several product teams decide together.
  - Curtis later wrote "The Fallacy of Federated Design Systems" (https://medium.com/@nathanacurtis/the-fallacy-of-federated-design-systems-23b9a9a05542) [V-search title only]. It argues that a federated model without a dedicated core team tends not to work [K; paraphrase unverified, read before citing].
- **"A design system isn't a project. It's a product, serving products."** Nathan Curtis, 2016 [V-search], https://medium.com/eightshapes-llc/a-design-system-isn-t-a-project-it-s-a-product-serving-products-74dcfffef935. It needs a roadmap, a backlog, funding and ongoing support. Frost cites this in chapter 5 [V-repo].
- **Frost's path to official status** [V-repo, paraphrased], https://atomicdesign.bradfrost.com/chapter-5/:
  1. Build something (a pilot project; a first version can take a weekend).
  2. Show it is useful (time and money saved, allies from several disciplines).
  3. Make it official (people, budget, governance, roadmap).
  - "Design system first" adds *friendly friction*: a fix found in one app should be made in the system so all products get it.
  - A pattern library that no longer matches production is obsolete.

## B.9 Measuring adoption

[V-search] https://omlet.dev/blog/data-driven-design-systems-in-practice/, https://www.productboard.com/blog/how-we-measure-adoption-of-a-design-system-at-productboard/, https://developers.mews.com/design-system-adoption-metric-building/
- **Kinds of coverage:**
  - *technical*: imports of DS components vs local ones;
  - *visual*: the share of the rendered UI made of DS components;
  - *render-based*: the share of component renders that come from the DS.
- **Tools:** `react-scanner` (open source; counts component and prop usage but gives no percentage coverage) and **Omlet** (commercial component analytics with trends per project).
- **Other signals** [K]:
  - count of hard-coded color and spacing values over time (should fall);
  - count of deprecated-component usages (should reach 0 by the removal date);
  - time to build a standard screen;
  - a11y bugs per component;
  - contribution PRs from product teams;
  - designer and developer satisfaction surveys.
- **Caution:** adoption alone can mislead ("Design System 'Adoption' is a Red Herring", https://medium.com/@disco_lu/design-system-adoption-is-a-red-herring-6c6b5a504f43 [V-search title]). Pair it with outcome metrics such as consistency, speed and quality.

## B.10 Design–code sync (Figma ↔ tokens ↔ code)

- **Figma Code Connect** links published Figma library components to code components. Dev Mode then shows **your real code snippets** instead of auto-generated CSS. It comes as a CLI and an in-Figma UI that can connect to GitHub, and the in-app mapping view shows which components are linked or missing [V-search], https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect.
- The **Figma MCP server** (launched 2025 as the "Dev Mode MCP server") feeds agentic tools (Claude Code, Cursor, VS Code Copilot, Windsurf) with **components, variables and styles**. When code syntax is set on a Figma variable, the server returns that exact token name. Code Connect mappings flow into it [V-search], https://www.figma.com/blog/introducing-figma-mcp-server/ and https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/.
- **Token pipeline** [K + F-web notes]:
  - Figma variables are exported (plugin or REST) to DTCG JSON in git, which is the source of truth;
  - Style Dictionary / Terrazzo then builds CSS variables, a Tailwind v4 `@theme`, and iOS/Android outputs;
  - CI checks contrast and diffs.
  - **Pick one source of truth.** Keep tokens in code and push them to Figma, or pull from Figma, but never two-way edits without review.
- **Figma-only systems die.** If the library exists only in Figma and code components are reimplemented per team, drift is guaranteed. The system has to ship as code [K + failure evidence in B.11].

## B.11 Failure modes (why design systems die) and case lessons

**Common failure modes** [V-search, secondary blogs: https://www.netguru.com/blog/design-system-adoption-pitfalls, https://www.knapsack.cloud/blog/why-design-systems-fail, https://rangle.io/blog/why-your-first-design-system-will-fail]:
1. **Built in isolation.** It gets handed down, is seen as a restriction, and is not used. The fix is to *extract* from existing product patterns (the inventory) and build *with* product teams.
2. **Too rigid or too abstract.** Too many config options push decisions back onto teams. Too little flexibility fails real edge cases. The fix is composition (slots or children) plus a documented escape hatch (Primer's "fork under a new name").
3. **Treated as a project.** It is launched and then abandoned, and the library drifts from production. Frost: once the library stops reflecting production it is obsolete [V-repo]. Curtis: it is a product [V-search].
4. **Centralized creation vs decentralized use.** Consumers work to different timelines, so the DS team becomes a bottleneck. The fix is a contribution on-ramp and accepting local components (Primer [V-repo]).
5. **Value not visible, so no adoption.** The fix is to measure and show time saved, a11y wins and consistency (Frost's "show that it's useful" [V-repo]).
6. **Figma-only or docs-only.** No coded components, so every team reimplements [K].
7. **No deprecation discipline.** Old and new coexist forever [K].

**Case lessons**
- **Airbnb DLS (2016).** Karri Saarinen: a unified system makes work "better" (a cohesive experience is easier for users) and "faster" (a common language). It should be an **evolving ecosystem, not static rules**. The principles were Unified, Universal, Iconic and Conversational. A **small group** of designers and engineers worked from categorized artboards to keep decisions fast [V-search], https://medium.com/airbnb-design/building-a-visual-language-behind-the-scenes-of-our-airbnb-design-system-224748775e4e.
- **Salesforce Lightning (2014–).** It originated design tokens and Theo, a cross-platform source of truth [V-search].
- **GitHub Primer.** An explicit lifecycle (Experimental → Removed), a high bar to entry, a contribution on-ramp, lint rules and codemods, and accessibility reviews as gates [V-repo].
- **IBM Carbon.** Open source. Patterns documented with "References" and a GitHub feedback link on every page. Candid about gaps: the notification panel still "needs more design iteration and user testing" before it becomes a component [V-repo].
- **Shopify Polaris.** Patterns tie directly to layouts (index, details, settings). There is a strict governance rule on "New" badges to prevent clutter [V-repo]. Shopify moved Polaris toward framework-agnostic web components in 2025 [K, unverified].
- **GOV.UK.** Every pattern has a "Research on this pattern" section and a public backlog issue (`backlogIssueId`). Patterns are contributed from other departments (NHS, MOJ), for example the Interruption page [V-repo].
- **Atlassian.** Not on GitHub, so it was not researched this session.

**Atomic Design critiques** [K; unverified, phrase as opinion]:
- the chemistry metaphor (atom, molecule, organism) causes naming debates with little value, and many teams use "components / patterns / templates" instead;
- the "templates" and "pages" layers are often skipped;
- Frost himself says the stages are a *mental model*, not a linear process [V-repo, chapter 2/4 framing].

## B.12 Agent-ready "start a design system" checklist

- [ ] Choose the tier (B.1). Don't build Tier 3 for one app.
- [ ] Run the inventory: screens plus code grep. Record duplicates and names.
- [ ] Write the tokens (DTCG) and DESIGN.md. Use semantic names. Cover light and dark.
- [ ] Wrap or copy the core components (shadcn or similar), using tokens only (no hard-coded values). Cover all states. Pass axe plus a manual a11y check.
- [ ] Write the pattern pages and blocks for the Part A patterns the product needs. Publish them as registry items.
- [ ] Set up Storybook/docs with do/don't. Add visual regression.
- [ ] Add lint rules: no raw hex or px outside tokens, no imports of deprecated components.
- [ ] Add a lifecycle label per component, a changelog, semver and codemods.
- [ ] Document the contribution path (Primer-style flowchart).
- [ ] Set up adoption metrics (react-scanner) plus outcome metrics.
- [ ] Map Figma to code (Code Connect) *or* declare code the single source of truth.
- [ ] Name owners. A roadmap and backlog exist, so it runs as a product.

---

# PART C: Why product/UI design fails (process-level causes)

## C.1 Redesigns that remove features and break muscle memory

- **Sonos app, May 2024** [V-search]: https://www.macrumors.com/2025/01/13/sonos-ceo-steps-down-after-app-redesign/, https://www.digitaltrends.com/home-theater/a-profound-mistake-sonos-ceo-talks-about-its-broken-app-and-why-its-been-so-hard-to-fix/, https://www.forbes.com/sites/paullamkin/2024/07/26/sonos-says-sorry-for-app-update-issues/
  - A rebuilt app (tied to the Sonos Ace headphones launch) shipped **without existing features**: sleep timers, alarms, queue editing, playlist management and some accessibility options. It was also slow.
  - The CEO apologized in July 2024 and committed **$20–30M** to fixes.
  - Reported market-value loss was about half a billion dollars. There were ~100 layoffs in Aug 2024, and **CEO Patrick Spence stepped down in Jan 2025**.
  - **Lesson:** never ship a rewrite with feature regressions to existing users. Run a parity checklist, a staged rollout, and old and new side by side. Accessibility regressions count as blockers.
- **Snapchat redesign, late 2017 to 2018** [V-search]: https://techcrunch.com/2018/08/07/snapchat-earnings-q2-2018/, https://money.cnn.com/2018/02/22/technology/snapchat-update-kylie-jenner/index.html
  - A petition against the redesign passed **1.2M signatures**.
  - A Kylie Jenner tweet (Feb 2018) coincided with a ~6% stock drop (about $1.3B).
  - **Q2 2018 DAU fell from 191M to 188M**, Snap's first-ever decline. Snap attributed it to "disruption caused by our redesign".
  - **Lesson:** reorganizing core navigation that users rely on daily carries churn risk. Test with real heavy users, roll out gradually, and keep an escape hatch.
- **General rule** [K]: treat any change to *established* flows as a migration.
  - Announce it and explain why.
  - Keep old paths redirecting.
  - Keep keyboard shortcuts.
  - Offer a temporary "switch back" when feasible.
  - Measure task success for existing users, not only for new ones.

## C.2 Not researching and not testing with users

- **Nielsen, "Why You Only Need to Test with 5 Users"** (2000; based on Nielsen & Landauer 1993) [V-search], https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/:
  - five users in a *qualitative* test find about **85%** of usability problems;
  - after that, returns diminish, so the right move is to **run many small tests**: test 5, fix, test again.
  - **Caveat:** this applies to qualitative testing of one user group. Quantitative studies need far more participants ("Why 5 Participants Are Okay in a Qualitative Study, but Not in a Quantitative One", https://www.nngroup.com/articles/5-test-users-qual-quant/ [V-search title]). MeasuringU also questions the 85% figure (https://measuringu.com/five-user-85/ [V-search title]).
- **Designing with lorem ipsum or fake content.** Real content changes the layout: long names, translations, empty fields, 10k rows [K]. Frost's process argues for establishing content and display patterns early [V-repo, ch. 4 headings].
- **Intuition is poor at predicting outcomes.** Ronny Kohavi's Microsoft experiment data: about **1/3 of ideas improved** the target metric, 1/3 were flat and 1/3 were negative. Across companies, **60–90% of ideas do not improve** the metric they target [V-search], https://exp-platform.com/Documents/2013-06%20eMetricsOnlineControlledExperimentsNR.pdf. This argues against HiPPO decisions.
- **Jared Spool: "exposure hours"** (the more time the team spends watching users, the better the product) and "UX debt" [V-search, weak; Spool's article on UX debt was not found directly; https://articles.centercentre.com/all/]. **Mark as unverified** before quoting a definition.

## C.3 Designing only the happy path and ignoring edge cases

- The state set in Part A (A.0.3–A.0.6, A.25) exists because designers skip it. Primer: a missing state makes users think the process "silently failed" [V-repo, loading]. Showing an empty state for data the user owns makes them think it was deleted [V-repo, degraded].
- **Edge-case checklist** [K; data sources where noted]:
  - long and short names;
  - names with apostrophes and diacritics (GOV.UK validation says to accept them [V-repo]);
  - single-name people (see `awesome-falsehood` [V-repo presence]);
  - 0 / 1 / many / 10,000 items;
  - pluralization;
  - RTL;
  - translation length growth;
  - timezones and DST;
  - currencies;
  - slow 3G;
  - offline;
  - permission variants;
  - expired sessions mid-form (store answers, as GOV.UK 500 guidance says [V-repo]);
  - concurrent edits;
  - double submit;
  - the browser Back button after a payment (GOV.UK [V-repo]).

## C.4 Design–dev handoff gaps

[K + B.10]
- Static mockups leave out states, responsive behavior, focus order, motion, content limits and error copy. Developers then invent these, inconsistently.
- **Mitigations:**
  - design in the design system's components (Code Connect snippets);
  - hand off a **state matrix per screen**;
  - annotate a11y (headings, landmarks, focus order, labels);
  - review in the browser, not in Figma ("development is design" is a heading in Frost ch. 4 [V-repo]; his argument is that the in-browser version is where design is finalized).
  - For agents: generate from DESIGN.md and the registry, then screenshot and compare.

## C.5 Inconsistency debt

- Each local one-off (a new button style, a new modal) adds cost to later changes and learning. The interface inventory makes this visible (37 buttons [V-repo]).
- Polaris names **inconsistency** and **visual clutter** as the two harms of ad-hoc feature highlighting [V-repo], a small-scale example of the general problem.
- **Mitigations:** lint rules, codemods, the Primer "Stable" requirement for tooling that blocks alternatives [V-repo], and deleting duplicates as part of the work.

## C.6 Design by committee, HiPPO, vanity metrics

- **Design by committee:** many contributors with no unifying vision produce needless complexity, inconsistency and compromise [V-search], https://en.wikipedia.org/wiki/Design_by_committee.
  - **Mitigation:** one accountable decision-maker per surface, written design principles to settle disputes, and decisions logged with their rationale.
- **HiPPO ("highest paid person's opinion"):** the most senior person's view overrides evidence [V-search], https://dovetail.com/product-development/how-to-manage-the-hippo-effect-in-product-management/. The term is commonly attributed to Avinash Kaushik [K].
  - NN/g suggests **private or digital voting** in prioritization exercises when a team is prone to groupthink or the HiPPO effect [V-search], https://www.nngroup.com/articles/prioritization-matrices/.
  - Pair this with Kohavi's data (C.2): test instead of arguing.
- **Vanity metrics** [K]: page views, sign-ups or "time in app" without task success or retention. Engagement can rise because the UI got *harder* (people search longer).
  - Use task success, time-on-task for *completed* tasks, error rate, retention by cohort, support tickets per feature, and guardrail metrics in experiments.

## C.7 Ignoring accessibility

- Covered in B-ux-principles §9 (WCAG 2.2).
- Process failures [K]: a11y left to QA at the end; components that are inaccessible by default so every team repeats the bug; disabled buttons with tooltips (Primer [V-repo]); fixed cookie banners hiding focus (GOV.UK/WCAG 2.4.11 [V-repo]); toasts that screen readers never announce (Primer's own toast caveat [V-repo]).
- **Fix at the system level:** Primer and GOV.UK gate components on a11y review [V-repo].

## C.8 Over-reliance on trends

- Covered in F-web-design-2026 §2 ("AI slop" tells).
- Process framing [K]: choosing a visual style before knowing the users and the content. Trend styles (glass, low-contrast grey text, ultra-thin fonts) often fail contrast and legibility.
- **Rule:** the style must pass contrast and legibility checks with real content, and every decorative choice needs a reason.

## C.9 Dark patterns and the backlash

- Covered in B-ux-principles §4.2.
- Regulatory evidence:
  - the EDPB cookie taskforce (A.27) [V-search];
  - Apple's rejection of "unnecessarily difficult" account deletion (A.30) [V-web];
  - the Snap and Sonos cases show that user backlash is also a business risk [V-search].
- Rule: **choices must be as easy to decline as to accept**, and cancel or delete must be as easy as sign-up [K; the principle behind the rules above].

## C.10 Don Norman: the conceptual toolkit (The Design of Everyday Things)

- **Gulf of execution** ("How do I do this?") and **gulf of evaluation** ("Did it work? What state is it in?"). The terms come from Hutchins, Hollan and Norman (1986) [V-search], https://www.nngroup.com/articles/two-ux-gulfs-evaluation-execution/.
  - Signifiers, clear labels and good mapping bridge execution.
  - Feedback and visible system status bridge evaluation.
- **Principles** [K; from DOET 1988, revised 2013, widely summarized, e.g. https://www.nngroup.com/articles/ux-signifiers/]:
  - **Affordance:** a relationship between object and person, meaning what actions are possible.
  - **Signifier:** a perceivable cue that shows where and how to act. In UI you design *signifiers*: button shapes, underlines, handles, placeholder text.
  - **Mapping:** the relationship between a control and its effect. A toggle sits next to what it toggles; a slider's direction matches the value.
  - **Feedback:** immediate and informative, and not excessive (A.0.2, A.0.5).
  - **Constraints:** prevent errors (limit the date range, disable impossible options *with* a reason).
  - **Conceptual model:** the user's mental model of how the system works. The UI must project a consistent one: "Remove from list" vs "Delete everywhere" (Carbon's remove vs delete [V-repo]).
- **Diagnostic use:** for any failed task in a test, ask which gulf failed.
  - Couldn't find or start the action: execution. Fix signifiers, labels or placement.
  - Didn't know if it worked: evaluation. Fix feedback or state display.

## C.11 Kathy Sierra: make users awesome

- The goal is not a great product but **great users**: "don't make a better camera, make a better photographer". Word of mouth comes from *user* awesomeness, not app awesomeness. Help users climb the expertise curve fast [V-search], https://mtlynch.io/book-reports/badass/ and https://www.goodreads.com/book/show/24737268-badass (O'Reilly, 2015).
- **Implications for screens** [K]:
  - empty states and onboarding teach the *domain* skill, not the buttons;
  - make progress visible;
  - remove cognitive-resource drains (unnecessary choices, confusing settings, which is why Polaris limits "New" badges);
  - docs and help sit in context;
  - measure users' success outcomes.

## C.12 Consolidated pre-ship checklist (process and screen)

**Before designing**
- [ ] Who are the users, what is their task, and what is success? Is there evidence (research, support tickets, analytics), not a HiPPO?
- [ ] Real content collected, including the worst cases (C.3).
- [ ] Existing patterns and components checked first (DS/registry). Is anything new justified (Primer flowchart)?

**While designing**
- [ ] Happy path **plus** every state in A.31.
- [ ] Norman check: each action has a clear signifier, each result has visible feedback, controls map to effects, and constraints prevent errors.
- [ ] Copy: specific verbs, errors say what happened and how to fix it (Polaris/GOV.UK), no jargon, no blame, no "oops".
- [ ] Accessibility designed in: headings, focus order, labels, contrast, target size, reduced motion.
- [ ] No dark patterns: equal accept/reject, online cancel and delete, no pre-ticked consent, no confirmshaming.

**Before shipping**
- [ ] Usability test with ~5 users per round (qualitative), fix, and retest [V-search].
- [ ] For a redesign of an existing flow: a feature-parity list signed off, a11y parity, a staged rollout, a rollback plan, and existing-user task-success metrics (C.1).
- [ ] Metrics defined: outcome plus guardrail, not vanity (C.6). Expect most ideas not to move the metric, and plan to iterate (Kohavi [V-search]).
- [ ] Design and code in sync: built from DS components; Code Connect / DESIGN.md updated; no new hard-coded tokens.
- [ ] New UI announced proportionally (Polaris/Primer limits), with an expiry on badges.

---

## Source index (quick list)

- Primer UI patterns, all [V-repo, MIT]: https://primer.style/ui-patterns/saving · /notification-messaging · /degraded-experiences · /empty-states · /loading · /feature-onboarding · /progressive-disclosure. Guides: https://primer.style/guides/component-lifecycle · /guides/contribute/adding-new-components · /guides/contribute/handling-new-patterns
- Carbon patterns [V-repo]: https://carbondesignsystem.com/patterns/search-pattern/ · /filtering/ · /dialog-pattern/ · /notification-pattern/ · /common-actions/ · /empty-states-pattern/ · /disabled-states/
- GOV.UK Design System [V-repo]: https://design-system.service.gov.uk/patterns/check-answers/ · /confirmation-pages/ · /question-pages/ · /validation/ · /page-not-found-pages/ · /problem-with-the-service-pages/ · /service-unavailable-pages/ · /complete-multiple-tasks/ · /interruption-pages/ · /create-accounts/ · /cookies-page/ · /contact-a-department-or-service-team/ · components: /cookie-banner/ · /file-upload/ · /language-navigation/
- Polaris [V-repo]: https://polaris.shopify.com/patterns/app-settings-layout · /resource-details-layout · /new-features · /common-actions · https://polaris.shopify.com/content/error-messages
- GitHub Docs [V-repo]: managing personal access tokens; inviting users / removing a member / reinstating (organizations); deleting a repository; webhooks best practices / viewing and redelivering deliveries; about notifications / configuring notifications.
- shadcn/ui [V-repo]: https://ui.shadcn.com/docs/registry · /docs/mcp · /docs/skills
- Apple [V-web]: https://developer.apple.com/support/offering-account-deletion-in-your-app/ · https://developer.apple.com/app-store/review/guidelines/ (5.1.1(v))
- Google Play [V-search]: https://support.google.com/googleplay/android-developer/answer/13327111
- Stripe [V-search]: https://stripe.com/blog/billing-customer-portal · https://docs.stripe.com/billing/subscriptions/prorations · https://docs.stripe.com/api/customer_portal/configurations/object
- EDPB cookie taskforce [V-search]: https://www.huntonprivacyblog.com/2023/01/27/edpb-publishes-report-of-outcome-of-the-cookie-banner-taskforce/
- Brad Frost, Atomic Design [V-repo, all rights reserved, paraphrase only]: https://atomicdesign.bradfrost.com/chapter-4/ · /chapter-5/
- Nathan Curtis [V-search]: https://medium.com/eightshapes-llc/team-models-for-scaling-a-design-system-2cf9d03be6a0 · https://medium.com/eightshapes-llc/a-design-system-isn-t-a-project-it-s-a-product-serving-products-74dcfffef935
- Airbnb DLS [V-search]: https://medium.com/airbnb-design/building-a-visual-language-behind-the-scenes-of-our-airbnb-design-system-224748775e4e
- Design tokens history [V-search]: https://css-tricks.com/what-are-design-tokens/
- Adoption metrics [V-search]: https://omlet.dev/blog/data-driven-design-systems-in-practice/ · https://www.productboard.com/blog/how-we-measure-adoption-of-a-design-system-at-productboard/
- Figma [V-search]: https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect · https://www.figma.com/blog/introducing-figma-mcp-server/
- Sonos [V-search]: https://www.macrumors.com/2025/01/13/sonos-ceo-steps-down-after-app-redesign/ · Snap [V-search]: https://techcrunch.com/2018/08/07/snapchat-earnings-q2-2018/
- NN/g [V-search]: https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/ · https://www.nngroup.com/articles/two-ux-gulfs-evaluation-execution/ · https://www.nngroup.com/articles/prioritization-matrices/
- Kohavi [V-search]: https://exp-platform.com/Documents/2013-06%20eMetricsOnlineControlledExperimentsNR.pdf
- Kathy Sierra [V-search]: https://mtlynch.io/book-reports/badass/

## Unverified items to check before shipping as fact ([K])

- Aza Raskin's "Never Use a Warning When You Mean Undo" (A List Apart, 2007): the URL and year.
- NN/g "Tabs, Used Right" and the signifiers article: the URLs.
- The W3C text-expansion article and its figures.
- The FTC click-to-cancel rule being vacated (July 2025), and state auto-renewal laws.
- Stripe: webhook retry window (3 days), secret key reveal and rolling behavior.
- GitHub: "last used" on tokens; returning 404 for private resources.
- Shopify's contextual save bar; Polaris moving to web components in 2025.
- The content of Curtis's "Fallacy of Federated Design Systems".
- A definition of Spool's "UX debt".
- LinkedIn's 2015 "Add Connections" settlement.
- The attribution of HiPPO to Kaushik.
- The "~20 components" heuristic.
