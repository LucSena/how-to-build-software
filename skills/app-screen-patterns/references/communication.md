# Communication screens

Notification center and preferences, feature announcements ("New" badges, what's new, changelog), comments and mentions, activity feed vs audit log, and help and support entry points. Where the notification bell sits in the app shell is `dashboard-design`; push-permission timing on mobile is `mobile-design`; first-run tours and setup checklists are `onboarding-design`.

## Contents

1. Notification center (inbox)
2. Notification preferences
3. Feature announcements and "New" badges
4. What's new and the changelog page
5. Comments and mentions
6. Activity feed
7. Audit log
8. Help and support

---

## 1. Notification center (inbox)

**Purpose.** A place to catch up on what needs the user's attention, then get back to work.

**Anatomy.** Bell with an unread count (cap the display, for example "9+") → panel or page with filters (Unread / All, or by reason), "Mark all as read", a link to preferences. Each item: actor avatar, **what happened** ("Maya requested your review"), the object (linked), time (relative, absolute on hover), and the **reason** it was sent.

**Rules.**
- **Show the reason** for each item and let users filter by it. GitHub labels each inbox item with a reason such as mention, review requested, assigned, or subscribed, and supports filtering like `reason:review-requested`.
- **Triage actions** in the row: mark done (removes from inbox but keeps it findable), read/unread, save for later, unsubscribe from this thread. GitHub keeps unsaved inbox items for 3 months and saved ones indefinitely; state your own retention.
- **Every item links to its object** and opens it in context (scrolled to the comment).
- **Group bursts** ("Maya and 3 others commented on Q3 plan").
- List in chronological order; group by source or urgency only if it helps (Carbon).
- **Don't re-send** the same notification when it was ignored (Carbon).
- Incoming items may also show as a toast only when the user is active and the item is time-sensitive.
- The bell is for things about the user's work. Product news and marketing do **not** go in it; "What's new" has its own entry point (section 4).

**States.** Empty: "You're all caught up" (no illustration needed) · loading · error (keep the last loaded list, say it may be out of date) · paused ("Notifications are paused until 9:00").

**Anti-patterns.** A badge count that never clears; items without a link; the bell used for promotions; no way to unsubscribe from a noisy thread.

**Source.** GitHub Docs "About notifications"; Carbon notification pattern (notification panel best practices; Carbon notes the panel still needs research before it becomes a component).

---

## 2. Notification preferences

**Purpose.** Let people choose what reaches them and where, without an all-or-nothing switch.

**Anatomy — the matrix.** Rows are **event types**, grouped (Mentions and replies · Assigned to me · Activity on things I follow · Billing · Security · Product news). Columns are **channels** (In-app, Email, Push, Slack or other integrations). Each cell is a checkbox or toggle.

**Rules.**
- Toggle cells auto-save with inline feedback (save model in `SKILL.md`). A matrix of checkboxes that needs Save is acceptable only if it's one form with one Save.
- **Defaults come from participation**: things you authored, were assigned, were mentioned in, or commented on. Following everything else is opt-in (GitHub's model: participating vs watching).
- **Per-object overrides** on the object itself: Watch / Participating only / Ignore / Custom (GitHub offers this per repository).
- **Security and required billing notices** can be locked on for owners: show them read-only with the reason ("Required for account security").
- **Marketing email is a separate, opt-in setting**, never pre-ticked; many regions require that.
- **Digest**: batch low-urgency items into a daily or weekly email with a chosen send time and time zone.
- **Quiet hours / pause** for push, with a visible "paused" state.
- Every email has a one-click unsubscribe for its category that **doesn't require signing in**, and a link to the full preferences.

**Anti-patterns.** One global on/off; unsubscribe links behind login; channel settings scattered across pages; asking for push permission on first launch without context (see `mobile-design`).

**Source.** GitHub Docs "About notifications" and "Configuring notifications"; Carbon notification pattern.

---

## 3. Feature announcements and "New" badges

**Purpose.** Help people discover genuinely new capabilities without turning the UI into a billboard.

**Polaris rule: highlight with a "New" badge or pip only if the feature meets all three:**
1. the company wants adoption because it has high business value;
2. it creates **new, outsized value** (not an improved way of doing something existing);
3. it is **worth interrupting** the user's current workflow for.

**Badge behavior (Polaris).** Informational badge placed to the right of the label. It **disappears when the user clicks the element, or 5 days after first seen, or after 3 sessions**. Pips (dots) mark new *items* such as unread notifications, not new features. The two harms Polaris names are inconsistency (every team highlights differently) and visual clutter.

**In-product announcements (Primer feature onboarding).**
- Place the message next to where the feature **permanently lives**, sized to its importance.
- Don't derail or trap the user: an obvious dismiss, and any "Learn more" opens without losing their work.
- **Campaign limits**: define the trigger (system or user), a maximum number of days, and a maximum number of impressions per user; respect dismissal.
- **No more than 2 alerts at a time** on a page; check what else is launching on the same page.
- Teaching bubbles: one at a time, about 160 characters, dismissed with a clear "Got it"; never point at hidden elements or at features the user can't act on right now.

**Anti-patterns.** "New" badges that never expire; five teams' announcements on one page; a modal "What's new" on every login; announcements for features the user's plan doesn't include (unless labeled as an upgrade).

**Source.** Polaris "New features"; Primer "Feature onboarding".

---

## 4. What's new and the changelog page

**Anatomy.**
- **In-app entry point** in the help or account menu: "What's new", with an unread dot that clears when opened. A panel lists recent entries and links to the full changelog.
- **Changelog page**: reverse-chronological entries, each with date, title (the benefit, not the ticket name), one short paragraph on what changed and why it helps, a screenshot or short clip, availability ("Available on Pro and Business"), and a docs link. Subscribe via RSS or email.

**Rules.**
- Write for users, not for the team: "Filter invoices by status" beats "INV-2231 status filter".
- Say what changed for existing behavior, not only what's new: moved settings, renamed menus, and removed features get their own entries with "where it went".
- For changes to established flows, give notice before the change, keep old URLs redirecting, keep shortcuts working, and consider a temporary "switch back". Redesigns that remove features existing users rely on are a known way to lose trust (see `lessons-from-failures`).
- Date entries in absolute dates ("12 Sep 2026").

---

## 5. Comments and mentions

**Anatomy.** Composer (Write / Preview tabs or WYSIWYG, with the supported formatting stated), attach and paste-to-upload, Submit button right-aligned below the text area. Thread list with author, relative time, "edited" marker, reactions, row menu (Edit, Copy link, Delete).

**Rules.**
- **Drafts survive** navigation and reloads (store locally per object); warn before discarding a non-empty draft.
- **@mentions** open a popover of people who **have access**. If the user mentions someone without access, say so and offer to share: "Sam can't see this project. Invite Sam?" Mentions notify according to the recipient's preferences.
- Threading: one level of replies is enough for most products; review contexts add "Resolve thread".
- Edited comments show "edited" (with history where accountability matters). Deleting a comment that has replies leaves a placeholder ("Comment deleted").
- Reactions reduce "+1" replies.
- A successful edit needs no success message; returning to the updated comment is the feedback (Primer).
- Keyboard: Cmd/Ctrl+Enter submits; Esc cancels an edit (with confirm if changed).

**Anti-patterns.** Losing the draft on navigation; mentioning people who then hit a permission wall; editing without an "edited" marker in contexts that need an audit trail.

**Source.** Primer saving and notification messaging.

---

## 6. Activity feed

**Purpose.** A human-readable story of what happened to an object or workspace, for collaboration.

**Rules.**
- Sentence rows: actor, verb, object, time ("Ana moved Task 12 to Done · 2h ago").
- **Group bursts** ("Ana made 5 changes to Q3 plan") with expand.
- Link every object; show relative time with absolute time on hover or focus.
- Filter by type (comments, status changes, files) on busy objects.
- Use "Load more" instead of infinite scroll when the page has a footer or the user needs to reach content below.
- Show system and integration actors distinctly ("GitHub integration linked PR #42").

The activity feed is **not** the audit log: it may summarize, group, and omit; the audit log may not.

---

## 7. Audit log

**Purpose.** A complete, immutable record of security- and admin-relevant events for owners and compliance.

**Anatomy.** Admin-only page (GitHub restricts its organization audit log to owners). Filters: actor, action, target, date range, IP. Table rows:

| Column | Content |
|---|---|
| Time | Absolute, with time zone (relative on hover) |
| Actor | User, API token, integration, or system; with IP and location if collected |
| Action | Machine-readable name (`member.remove`, `billing.plan_change`) plus a readable label |
| Target | The object affected, linked if it still exists |
| Details | Old → new values, request ID |

**Rules.**
- **State the retention period** on the page ("Events are kept for 180 days"; GitHub's org audit log covers the last 180 days).
- **Export** (CSV/JSON) and, for enterprise, **streaming** to a SIEM.
- Entries are never editable or deletable from the UI.
- Log reads of sensitive data (exports, key reveals) as well as writes.
- Record API-token and integration actions with the token or app name, not just "system".
- Don't log secrets or full personal data in details; see `application-security`.

**Anti-patterns.** Using the activity feed as an audit log; relative-only timestamps; actions attributed to "Unknown"; no export.

**Source.** GitHub Docs "Reviewing the audit log for your organization".

---

## 8. Help and support

**Anatomy — in-app help menu ("?").** Search docs, keyboard shortcuts, what's new, contact support, status page, community. Contextual "Learn more" links sit next to complex settings, opening without losing the user's work.

**Rules (GOV.UK "Contact a department or service team", adapted).**
- Order contact channels by what users need, and keep the **same order everywhere**.
- Give **opening hours** (with exceptions) and **how long a response takes**, per channel and per plan.
- Explain any cost; list social channels last and warn against posting personal information publicly.
- When help is secondary on a page, tuck long contact details into a disclosure.

**Support form.** Pre-fill context: account or workspace ID, current page, browser/app version, and the **error reference** from the last error the user saw; let them attach a screenshot. Confirmation says what happens next and when ("We'll reply by email within 1 business day").

**Error pages** include "Contact support" with the error reference prefilled (see `system-pages.md`).

**Anti-patterns.** A chatbot with no route to a human for account or billing problems; contact info that differs by page; no response-time expectation.

**Source.** GOV.UK Design System "Contact a department or service team".

---

## Sources

- GitHub Docs, About notifications: https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications
- GitHub Docs, Configuring notifications: https://docs.github.com/en/subscriptions-and-notifications/get-started/configuring-notifications
- Carbon, Notifications pattern (notification panel): https://carbondesignsystem.com/patterns/notification-pattern/
- Polaris, New features: https://polaris.shopify.com/patterns/new-features
- Primer, Feature onboarding: https://primer.style/ui-patterns/feature-onboarding
- Primer, Saving and Notification messaging: https://primer.style/ui-patterns/saving · https://primer.style/ui-patterns/notification-messaging
- GitHub Docs, Reviewing the audit log for your organization: https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/reviewing-the-audit-log-for-your-organization
- GOV.UK Design System, Contact a department or service team: https://design-system.service.gov.uk/patterns/contact-a-department-or-service-team/
