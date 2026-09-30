# System pages and transactional patterns

Error pages (404, 500, 503/maintenance), offline, permission denied, rate limited, cookie consent, and three GOV.UK transactional patterns that translate well to SaaS: check your answers (review step), confirmation pages, and the task list hub. Most rules come from GOV.UK, whose patterns are researched with real users and published with their evidence.

## Contents

1. Page not found (404)
2. Something went wrong (500)
3. Service unavailable and maintenance (503)
4. Permission denied (403)
5. Rate limited (429) and plan limits
6. Offline and degraded
7. Cookie banner and cookies page
8. Check your answers (review before commit)
9. Confirmation pages
10. Task list hub

---

## 1. Page not found (404)

**Rules (GOV.UK).**
- Title "Page not found"; heading "Page not found" (or a plain equivalent in the product's voice).
- Short, clear content that **doesn't blame the user**: suggest checking the address, and link to a sensible place (home, search, the parent list).
- **Don't use** breadcrumbs, technical jargon ("404", "bad request"), informal or humorous words ("Oops"), or red warning text.
- Contact information only if it helps meet a need.
- Polaris's variant for app contexts: heading "The page you're looking for isn't available", body "Check the web address or try again later", button **Retry**; avoid "You must have the wrong address".
- In signed-in apps, keep the app shell (navigation) so the user isn't stranded, and include search.
- Return a real 404 status code (not a 200 with an error message).

**Copy.** "Page not found · If you typed the web address, check it is correct. If you pasted it, check you copied the whole address. Go to your projects"

---

## 2. Something went wrong (500)

**Rules (GOV.UK "There is a problem with the service" pages).**
- Heading: "Sorry, there is a problem with the service"; body: "Try again later."
- **Say what happened to their data**: "We saved your answers. They will be available for 30 days" or "We have not saved your answers. When the service is available, you will have to start again."
- Give contact details or another way to get the task done.
- Avoid vague phrases like "We are experiencing technical difficulties".
- Use one page for all unexpected errors; show it only briefly; if the problem persists, switch to the service-unavailable page.
- **Store what users entered** so they can resume after the error.
- GOV.UK tested the pattern with users, whose needs were "when will it work?" and "how can I do what I came to do?".

**App additions.** An **error reference** (request ID) as secondary text with a copy button and a "Contact support" link that pre-fills it. A **Retry** button for idempotent requests. Report the error to monitoring automatically (see `reliability`). If only part of the page failed, use the degraded rules in `SKILL.md` instead of a full error page.

---

## 3. Service unavailable and maintenance (503)

**Rules (GOV.UK).**
- Heading: "Sorry, the service is unavailable".
- Say **when it will be available**, with day, date, and time ("You will be able to use the service from 9am on Monday 19 November 2026"), or what replaced it, or where else to go.
- Avoid vague words like "maintenance" and "improvements" — say what users can and can't do.
- Keep a generic version ready for unplanned outages.

**App additions.** Announce planned maintenance ahead with a dismissible banner and email, including the time in the user's time zone. During partial outages, a banner above the navigation links to the status page. Return 503 with `Retry-After` when you know it.

---

## 4. Permission denied (403)

**Purpose.** Tell someone they're in the right place but lack access, and how to get it.

**Rules.**
- Say it plainly: "You don't have access to this project."
- Say **who can grant access** ("Project owners: Maya Chen, Sam Ortiz").
- Offer **Request access** (notifies an admin, then shows "Request sent. We'll email you when Maya responds") and **Switch account** (people are often signed into the wrong account); show which account they're signed in as.
- If the existence of the resource is itself sensitive (private repositories, other tenants' data), respond as **not found** rather than forbidden, so the page doesn't confirm it exists.
- Don't treat eligibility or permission as a validation error on a form; explain and give the next step (GOV.UK's validation guidance says the same about eligibility).

**Copy.** "You need access · You're signed in as sam@acme.com. Ask a project owner to give you access. Request access · Switch account"

---

## 5. Rate limited (429) and plan limits

**Rules.**
- Say what happened and when to try again: "Too many requests. Try again in 30 seconds." When the server sends `Retry-After`, show a countdown and retry automatically if the action is safe to repeat.
- Don't lose the user's input while they wait.
- When the limit is a **plan** limit, not abuse protection, say so and show the path: admins get "Upgrade", members get "Ask an admin" (see `team-and-billing.md`).
- For APIs, the rate-limit headers and error body design are in `api-design`.

---

## 6. Offline and degraded

**Rules.**
- A persistent, unobtrusive banner: "You're offline. Changes will sync when you reconnect." Remove it (and optionally confirm "Back online") on reconnect.
- Queue safe writes and show **pending state per item** ("Waiting to sync"); report sync conflicts explicitly.
- Disable only actions that truly need the network, and say why in text, not in a tooltip.
- Show the age of cached data ("Showing data from 10:42").
- Mobile specifics (offline-first sync, background retries) are in `mobile-design` and `mobile-architecture`.

---

## 7. Cookie banner and cookies page

**When needed.** A banner is needed only if you set **non-essential** cookies or similar storage (analytics, marketing, some functional). Under GOV.UK's guidance, "cookies" includes localStorage, sessionStorage, service workers, and other device storage. Essential-only sites need a cookies page but no banner.

**Banner rules (GOV.UK cookie banner, plus the EDPB cookie banner taskforce findings).**
- **Accept** and **Reject** buttons **of equal prominence** on the first layer, plus a link to the cookies page. Most EU data protection authorities expect a reject option on the first layer, and reject must not be made harder through colors, contrast, or placement.
- **Don't set non-essential cookies until the user accepts.**
- **No pre-ticked boxes** for optional categories; they are not valid consent.
- After a choice, show a confirmation message with a Hide button and a link to change settings. GOV.UK stores the choice for 1 year.
- **Don't make it sticky** (`position: fixed`), so it never covers focused content (WCAG 2.2 SC 2.4.11 Focus Not Obscured). Place it at the very top of the page, before the skip link.
- Works without JavaScript (a form POST), and doesn't make users lose data they were entering on the page.
- Changing your mind is as easy as the first choice: a persistent "Cookie settings" link (footer).

**Cookies page.** Group cookies by category (essential, functional, analytics, marketing); for each: name, purpose, whether set by a third party, and expiry. Offer the same accept/reject controls per category. Don't bury it in the terms.

**Anti-patterns.** "Accept all" button plus a small "Manage" link; a banner that blocks the whole page until you accept; analytics loaded before consent; reject hidden in a second layer.

---

## 8. Check your answers (review before commit)

**Use when** a transaction has several inputs, costs money, or changes access: plan upgrades, bulk imports, workspace creation, permission changes, payment setup. For very long transactions, a review at the end of each section.

**Rules (GOV.UK).**
- The page title says what to do ("Check your answers before creating the workspace"), and the page says the transaction **isn't complete until confirmed**.
- Sections with headings; show only relevant ones; questions may be rephrased as short statements.
- Each row has a **Change** link with visually hidden text naming the item ("Change *plan*"). Change returns to the pre-filled step; **Continue returns straight to the review page**, not through the rest of the flow. If the new answer triggers extra questions, ask them, then return.
- Skipped optional answers show "Not provided".
- The final button says what happens: "Confirm and pay $49", "Create workspace", "Send invitations".

---

## 9. Confirmation pages

**A confirmation page includes (GOV.UK):**
- a **reference number** if there is one;
- **what happens next and when**;
- contact details;
- links to the likely next tasks;
- a feedback link;
- a way to keep a record (email, PDF).

**Rules.** Users bookmark confirmation pages as receipts; revisiting should work or respond helpfully. Don't put links or buttons inside a colored success panel (contrast fails). SaaS uses: "Payment received", "Import complete", "Workspace created", "Account deletion scheduled".

**Copy.** "Deletion scheduled · Reference DEL-48213 · Your account and data will be deleted on 14 October 2026. We've emailed you a confirmation. Changed your mind? Sign in before then to cancel."

---

## 10. Task list hub

**Use only** for long transactions completed over several sessions, and simplify the transaction first (GOV.UK "Complete multiple tasks"). Show it at the start and at the start of each returning session.

**Rules.**
- Task names start with verbs ("Connect your domain", "Invite your team").
- **Statuses start minimal**: "Completed" / "Incomplete". Add "Not yet started" / "In progress" only if research shows people need them.
- "Cannot start yet" is grey and not a link; say why.
- "There is a problem" is the only red status.
- Completed tasks get **no** colored background, so attention goes to what's left.
- Let users mark a task complete themselves when it has optional parts.

The first-run "Set up your workspace" checklist is an onboarding pattern: see `onboarding-design` for activation-focused checklists.

---

## Sources

- GOV.UK Design System, Page not found pages: https://design-system.service.gov.uk/patterns/page-not-found-pages/
- GOV.UK Design System, There is a problem with the service pages: https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/
- GOV.UK Design System, Service unavailable pages: https://design-system.service.gov.uk/patterns/service-unavailable-pages/
- GOV.UK Design System, Recover from validation errors: https://design-system.service.gov.uk/patterns/validation/
- GOV.UK Design System, Cookie banner: https://design-system.service.gov.uk/components/cookie-banner/ · Cookies page: https://design-system.service.gov.uk/patterns/cookies-page/
- GOV.UK Design System, Check answers: https://design-system.service.gov.uk/patterns/check-answers/ · Confirmation pages: https://design-system.service.gov.uk/patterns/confirmation-pages/ · Complete multiple tasks: https://design-system.service.gov.uk/patterns/complete-multiple-tasks/
- Polaris, Error messages and 404 guidance: https://polaris.shopify.com/content/error-messages
- Primer, Degraded experiences: https://primer.style/ui-patterns/degraded-experiences
- EDPB Cookie Banner Taskforce report (January 2023), summary: https://www.huntonprivacyblog.com/2023/01/27/edpb-publishes-report-of-outcome-of-the-cookie-banner-taskforce/
- WCAG 2.2, Understanding SC 2.4.11 Focus Not Obscured (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
