# Team and billing screens

Members, invites, roles, ownership transfer, seats, and the billing area: plan, usage, payment method, invoices, upgrades, downgrades, proration, failed payments, and trial or plan-limit banners. Pricing pages, paywalls, checkout, and the cancel flow's persuasion ethics live in `conversion-ux`; this file covers the in-app management screens.

## Contents

1. Members list
2. Invites
3. Roles and permissions
4. Removing members, ownership transfer, last owner
5. Billing overview (plan, usage, payment, invoices)
6. Upgrade, downgrade, proration
7. Cancel and resume
8. Failed payments (dunning)
9. Trial and plan-limit banners

---

## 1. Members list

**Purpose.** Show who has access, with what role, and let admins change it safely.

**Anatomy.** Page header "Members" with an **Invite members** primary button and a seat summary ("7 of 10 seats used"). Search by name or email, filter by role and status. Table columns: avatar + name, email, role, status (Active, Invited, Expired, Deactivated), last active, row menu (Change role, Resend invite, Remove). Pending invitations in a tab or section of their own.

**Rules.**
- Role changes happen in the row (a select that opens a small confirm when the change removes access or grants Owner).
- **IdP/SCIM-managed members** can't be removed or edited in the app: show them read-only with "Managed by Okta" and explain where to change it.
- Bulk select supports role change and remove, with a count and per-row permission checks (see `data-flows.md`).
- Members without admin rights see the list but not the actions (hidden, not disabled).

**States.** Empty (just you): "Invite your team" with Invite and Copy invite link · seat limit reached (inline upsell for admins) · no permission (list visible, actions hidden) · IdP-managed.

**Anti-patterns.** No status column (nobody knows who never accepted); no way to find a member in a 300-person org; removal as an unlabeled trash icon.

---

## 2. Invites

**Purpose.** Get the right people in with the right role, without surprise charges.

**Anatomy (invite dialog or page).** Email field that accepts several addresses (paste a list; comma, space, or newline separated), role picker with descriptions, optional message, seat and cost summary, **Send invites**. Optional "Copy invite link" with its expiry and a Reset link control; optional domain auto-join setting ("Anyone with an @acme.com email can join as Member").

**Rules.**
- **Invites expire.** GitHub's organization invitations expire after 7 days and can be retried or cancelled, one by one or in bulk. Show the expiry on each pending invite and offer **Resend** and **Revoke**.
- **Seats before sending.** With per-seat billing an unused seat must exist (GitHub requires one before inviting or reinstating). Show "3 of 10 seats used" in the dialog; when seats run out, offer "Add seats" with the price, instead of failing after the fact. Never add a paid seat silently on acceptance.
- Validate addresses inline; report per-address results after sending ("5 sent · 1 already a member · 1 bounced").
- Warn when inviting outside the company domain if the org restricts it.
- The invite email names the inviter, the workspace, the role, and the expiry.

**States.** Pending · expired (Resend) · failed or bounced · accepted · revoked.

**Copy.** "Invite sent to maya@acme.com. The invite expires on 7 Oct." · "You're out of seats. Add 2 seats for $24/month to invite these people."

**Anti-patterns.** Invites that never expire; no resend; charging per invite silently; importing contacts or inviting people on the user's behalf without an explicit per-recipient confirmation.

**Source.** GitHub Docs, "Inviting users to join your organization".

---

## 3. Roles and permissions

**Rules.**
- The role picker shows **a one-line description of each role** ("Admin: manage members and billing. Member: create and edit projects. Viewer: read only"). Link to a full permission matrix.
- Keep the default role the least privileged one that lets a new member do useful work.
- Show the effective role and where it comes from when roles are inherited (team, group, or IdP).
- Custom roles (enterprise): name, description, permissions grouped by area with read/write/admin, and a preview of "who has this role".

**Anti-patterns.** Role names with no explanation; Owner as the default invite role; permission errors that don't say which role is needed.

---

## 4. Removing members, ownership transfer, last owner

**Removing a member** — confirm dialog that states consequences. GitHub's documented effects are a good model of what to say: the person loses access to private resources (and their private forks), invitations they sent are cancelled, the **paid seat is not automatically freed** (say so if your billing works that way), and their membership can be reinstated within a retention window (GitHub keeps it for 3 months). Reinstating within the window restores previous access.
- Offer an offboarding checklist for admins (reassign their open work, rotate shared credentials, transfer owned resources).
- Copy: "Remove Maya Chen from Acme? She'll lose access to 12 projects immediately. Her seat stays on your plan until you reduce seats in Billing."

**Ownership transfer** — danger zone action. The new owner must be an existing member; the current owner re-authenticates and types the workspace name; the new owner accepts (or is notified); both get an email. State what the old owner becomes (Admin by default).

**Never allow zero owners.** Block the last owner from leaving, being demoted, or being removed, and say what to do: "You're the only owner. Make someone else an owner before leaving."

**Source.** GitHub Docs, "Removing a member from your organization" and "Reinstating a former member of your organization".

---

## 5. Billing overview (plan, usage, payment, invoices)

**Purpose.** Answer, on one page: what am I paying, what am I using, when is the next charge, and how do I change it.

**Anatomy (one page or tabs).**
1. **Current plan**: plan name, price **with billing period**, next renewal date and amount, seats, **Change plan**.
2. **Usage meters**: per metered resource, used / limit, percent bar **with a text label** (never color alone), reset date, and what happens at the limit ("Builds pause" vs "Billed at $0.01 per extra minute").
3. **Payment method**: brand, last 4 digits, expiry, **Update**; warn before a card expires.
4. **Billing details**: legal name, address, tax ID, billing email. These print on invoices; say so.
5. **Invoices**: date, number, amount, status (Paid, Open, Failed, Refunded), PDF download.
6. **Cancel subscription**: visible (bottom of the page or plan menu), not hidden behind support.

**Rules.**
- Only billing admins see this page; other members see "Billing is managed by Maya (Owner)".
- Show whether prices include tax; format currency for the locale.
- A hosted customer portal (Stripe's lets customers update payment methods, view invoices, and upgrade, downgrade, pause, or cancel subscriptions) is a fine default for small teams; embed or link it rather than rebuilding.

**Anti-patterns.** Price without period; no next-charge date; invoices emailed only; usage visible only after overage; pre-checked paid add-ons.

---

## 6. Upgrade, downgrade, proration

**Upgrade (takes effect now).** Before confirming, show the **prorated amount due today** and the **new recurring price and date**, as Stripe's proration preview allows. Then a review step, then "Confirm and pay".
- Copy: "You'll be charged $18.40 today for the rest of this billing period, then $49/month from 1 Nov."

**Downgrade (usually at period end).** State when it happens and **what will be lost**, with numbers.
- Copy: "Your plan changes to Starter on 1 Nov. You keep Pro features until then. 3 projects over the Starter limit will become read-only."
- If data will be deleted or locked, require acknowledgment and offer export.
- Show a scheduled-change banner with "Keep Pro" until the date.

**Plan comparison in-app**: current plan marked, differences only (not 40 identical rows), no asterisk traps; annual vs monthly price shown per month *and* per year.

**Source.** Stripe prorations docs; Stripe customer portal.

---

## 7. Cancel and resume

- One clear path from billing. It may include **one** relevant alternative (pause, downgrade) shown alongside a prominent cancel button, and an **optional** reason survey (Stripe's portal can collect reasons such as too expensive, missing features, switched service, unused).
- Confirm the **end-of-access date**, what happens to data (and an export link), and any refund. Email a confirmation.
- Afterwards, show "Your subscription ends on 1 Nov · Resume subscription" until that date.
- Don't require a call or chat. Cancellation law differs by jurisdiction and has been changing; follow current local rules. Persuasion ethics: `conversion-ux`.

---

## 8. Failed payments (dunning)

- **Admins only**: a persistent banner above content: "Your last payment failed. Update your card by 12 Oct to avoid interruption. Update payment method". Include the amount and the date service changes.
- **Other members** see nothing, or a neutral note only when it affects them ("Some features are paused. Contact your admin").
- Retry automatically after the card is updated and say so ("We'll retry the payment automatically").
- Grace period, then restrict gradually (read-only before lockout); never delete data on the first failure.

**Copy.** Polaris's error guidance applies: "Couldn't process your payment. Your card ending 4242 was declined. Update your card and we'll retry automatically."

---

## 9. Trial and plan-limit banners

**Rules.**
- Show limits **near the limited thing**: "3 of 3 projects used · Upgrade for unlimited" on the projects page, not a global nag on every page.
- Approaching (about 80%): a warning with the reset date. At the limit: a blocking inline message with an upgrade path for admins and "Ask an admin to upgrade" for members.
- Trial banner: days left, what happens at the end (converts to paid or stops, and what happens to data), and the upgrade action. Dismissible per session; remind before conversion by email.
- Never hide a limit until the user hits it. Never disguise an upsell as an error, and never show one inside a destructive or stressful flow (deleting, recovering an account, a failed payment).
- Primer defines an **upsell** message state for features on a higher plan; use your system's equivalent consistently, visually distinct from warnings.

**Copy.** "Your trial ends in 5 days. After that, your workspace becomes read-only until you choose a plan. Choose a plan" · "You've used 4.1 GB of 5 GB. Storage resets on 1 Nov."

**Source.** Primer notification messaging (upsell state).

---

## Sources

- GitHub Docs, Inviting users to join your organization: https://docs.github.com/en/organizations/managing-membership-in-your-organization/inviting-users-to-join-your-organization
- GitHub Docs, Removing a member from your organization: https://docs.github.com/en/organizations/managing-membership-in-your-organization/removing-a-member-from-your-organization
- GitHub Docs, Reinstating a former member of your organization: https://docs.github.com/en/organizations/managing-membership-in-your-organization/reinstating-a-former-member-of-your-organization
- Stripe, Billing customer portal: https://stripe.com/blog/billing-customer-portal · configuration object: https://docs.stripe.com/api/customer_portal/configurations/object
- Stripe, Prorations: https://docs.stripe.com/billing/subscriptions/prorations
- Polaris, Error messages: https://polaris.shopify.com/content/error-messages
- Primer, Notification messaging: https://primer.style/ui-patterns/notification-messaging
