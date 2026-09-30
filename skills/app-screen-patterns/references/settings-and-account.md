# Settings and account screens

Settings pages, profile and account, the danger zone, account deletion (App Store and Google Play rules), data export, and language/region switching. The shared rules (save model, disabled vs read-only vs hidden, destructive ladder) are in `SKILL.md`; this file applies them.

## Contents

1. Settings page layout
2. Profile, account, preferences, privacy
3. Changing email, password, and other sensitive fields
4. Danger zone
5. Account deletion (App Store and Google Play)
6. Data export ("Download your data")
7. Language and region

---

## 1. Settings page layout

**Purpose.** Let people find a setting fast, understand what it affects, change it safely, and know it stuck.

**Anatomy.**
- **Settings navigation** (left sub-nav on desktop, a list screen on mobile) split by scope: **Personal / Account** (profile, notifications, security, appearance) and **Workspace / Organization** (general, members, roles, billing, integrations, API keys, security and SSO, audit log). Label the scope in the nav and the page header so nobody changes the whole workspace thinking it's just them.
- **Content column** with a readable max width for forms (about 640–720px). Each section is a card or block.
- Polaris's app settings layout: on desktop a **left column** with the section title and a one-line description (only if it helps), and a **right column** with the controls grouped in cards; on phones the two stack (title, then card).
- **Danger zone** last, visually separated (section 4).
- Every section and tab has its own URL (`/settings/members`, `/settings/billing#invoices`) so support, emails, and onboarding can link directly.

**Rules.**
- Pick the save model per section from the table in `SKILL.md`: toggle-only sections auto-save with an inline "Saved"; sections with text fields get one explicit "Save changes" button per form.
- **Dirty state.** When a form differs from what's saved, show it (a sticky "Unsaved changes · Discard · Save" bar is a common implementation), and guard navigation away (`beforeunload` plus an in-app route guard). Keep Save enabled.
- **Say what each setting does**, in the description or a preview. A setting whose effect is invisible gets a sentence and, where useful, a "Learn more" link.
- **Settings the user can't change** are read-only with who can: "Only owners can change this." Settings they must never see are hidden. Plan-gated settings stay visible with the plan and a path: "SAML SSO is available on Business. Compare plans."
- **Settings search** (large products) searches labels *and* descriptions, and a no-match result links to docs.
- On mobile, follow the platform's settings conventions (grouped lists, native switches); see `ios-design` / `android-design`.

**States.** Loading (skeleton the cards, not a page spinner) · saving (spinner in the button, stay on the page) · saved (inline, near the control) · error (keep input, message at the top of the form) · no permission (read-only) · degraded (hide the failed section's controls; never show defaults as if they were the saved values).

**Anti-patterns.**
- A Save button on every card plus a global Save.
- Toggles that silently need Save; text fields that save on blur without saying so.
- Destructive actions mixed into ordinary sections.
- Showing default values while the real settings failed to load; the user then "saves" the defaults over their real config.
- One flat page of 60 settings with no grouping or search.

**Copy.**
- Section: "Email address" · "Where we send receipts and security alerts."
- Saved: "Saved" (inline) — not a toast for every toggle.
- Read-only: "Managed by your identity provider. Contact your admin to change it."
- Plan gate: "Audit log streaming is on the Enterprise plan. Talk to sales"

**Source.** Polaris app settings layout; Primer saving pattern; Carbon disabled and read-only states.

---

## 2. Profile, account, preferences, privacy

**Purpose.** Keep public identity, sign-in security, personal preferences, and data rights apart so each is easy to find.

**Anatomy.**
| Area | Contains |
|---|---|
| **Profile** (often public) | Display name, avatar, bio, pronouns (optional), public links |
| **Account / Security** | Email, password, passkeys, connected sign-in providers, two-factor, active sessions and devices, sign out everywhere |
| **Preferences** | Language, region and formats, time zone, theme, density, notification preferences (link to the matrix) |
| **Privacy and data** | Data export, connected apps, account deletion |

**Rules.**
- **Names**: one "Full name" field, plus an optional "What should we call you?" if the product greets people. Don't force first/last split, don't reject apostrophes, hyphens, diacritics, spaces, or single names.
- **Avatar**: upload with crop, fallback to initials, remove option. The avatar is saved with the profile form (explicit save), not instantly, unless it sits outside any form.
- **Time zone** defaults from the browser or device, with an override; show the current local time next to the picker so people can check.
- Sessions list: device, browser/OS, approximate location, last active, "This device" marker, "Sign out" per session and "Sign out of all other sessions". Security implementation lives in `auth-flows`.

**States.** Unverified email (banner with Resend) · pending email change · connected provider that can't be removed because it's the only sign-in method (explain) · IdP-managed fields read-only.

**Anti-patterns.** Required first and last name; profile and security settings on one long page; "Delete account" as the first thing on the account page.

**Source.** GOV.UK names and create-accounts patterns; the "falsehoods programmers believe about names" collection.

---

## 3. Changing email, password, and other sensitive fields

**Rules.**
- **Re-authenticate** before changing email, password, two-factor, recovery methods, or deleting the account (password, passkey, or a code). Apple explicitly allows identity checks before deletion.
- **Email change**: send a verification link to the *new* address; keep the old address active until it is confirmed; notify the *old* address that a change was requested, with a way to report it. Show "Pending: new@example.com · Resend · Cancel change".
- **Password change**: current password (unless just re-authenticated), new password with visible rules, show/hide toggle; afterwards offer "Sign out of other sessions". Details in `auth-flows`.
- Confirm sensitive changes by email ("Your password was changed. If this wasn't you, secure your account").

**Copy.** "We sent a link to new@example.com. Your email won't change until you open it." · "Enter your password to continue."

**Source.** Apple account deletion guidance (re-authentication allowed); standard account-security practice (see `auth-flows` and the OWASP cheat sheets).

---

## 4. Danger zone

**Purpose.** Keep irreversible or high-impact actions available but impossible to hit by accident.

**Anatomy.** A separate, visually distinct section at the **bottom** of the relevant general settings page (danger-outlined, not a sea of red). One row per action: name, one-sentence consequence, and a danger-styled button with a specific verb. Typical actions: change visibility, transfer ownership, archive, delete.

**Rules.**
- Apply the destructive ladder: archive and visibility changes get a confirm dialog; transfer and delete get **type-to-confirm** with the resource's name, and account- or org-level deletes also re-authenticate.
- GitHub's repository deletion is the reference flow: open the Danger Zone, choose delete, read the listed effects and acknowledge them, **type the repository name**, then confirm. The warning spells out consequences (for example, deleting a private repository also deletes its forks) and says whether restore is possible.
- List dependents that cascade ("3 projects, 12 API keys, and 2 webhooks will be deleted").
- If deletion is blocked (open invoices, sole owner of a paid org, active subscription), say what to do first and link to it, instead of failing after confirmation.
- Type-to-confirm compares exactly (case-sensitive), allows paste, and enables the delete button only when the text matches.

**Copy.** Row: "Delete this workspace · Permanently deletes all projects, files, and history. This can't be undone." · Button: "Delete workspace" · Dialog title: "Delete workspace 'Acme'?"

**Anti-patterns.** Generic "Delete" buttons; danger actions scattered among normal settings; confirmation that doesn't say what is lost.

**Source.** GitHub Docs "Deleting a repository"; Carbon "Remove" pattern (high/medium/low impact deletion).

---

## 5. Account deletion (App Store and Google Play)

**Purpose.** Let people delete their account and data, in a way that passes platform review and respects privacy law.

**Apple (App Review Guideline 5.1.1(v); "Offering account deletion in your app"), requirements since June 30, 2022:**
- Apps that support account creation must let users **initiate deletion inside the app**. This includes auto-created "guest" accounts and apps that create accounts on the web.
- Make it **easy to find**, typically in account settings.
- Delete the **whole account record and associated personal data**. Offering only deactivation is insufficient. Extra options (like deactivate) may sit alongside it.
- If deletion is completed on a website, **link directly** to that page.
- Re-authentication and confirmation steps (for example a code sent to the known email or phone) are allowed; **unnecessarily difficult** flows fail review.
- Outside highly regulated industries, don't require a phone call, email, or support flow.
- Manual or slow deletion is acceptable if you **say how long it takes** and **confirm when done**.
- **User-generated content** shared with others is deleted too; if law requires keeping some data, tell users.
- Region-limited flows (only where GDPR/CCPA apply) are **not** sufficient; every user must be able to delete.
- Sign in with Apple: revoke the user's tokens with the Sign in with Apple REST API.
- In-app subscriptions: explain that billing continues through Apple until they cancel, and link to subscription management.

**Google Play (Data safety / account deletion policy):**
- Apps that allow account creation must offer deletion **in the app** and through a **web link** where users can request account and data deletion **without reinstalling the app**; the link is declared in the Play Console.
- Delete associated data; disclose any data you retain (for security, fraud prevention, or legal reasons) and why.

**Flow spec (web and mobile).**
1. Settings → Account (or Privacy) → **Delete account** (danger zone, bottom).
2. Explanation page: what is deleted, what is kept and for how long (legal retention), effect on teams (transfer ownership first; block if the user is the sole owner of a paid workspace, with a link to fix it), subscription handling, and the timeline.
3. Offer **Download your data** first (section 6).
4. Re-authenticate.
5. Type-to-confirm (the email or "DELETE").
6. Confirmation page and email: what happens next, when deletion completes, and a support contact. A grace period ("Your account will be deleted on 14 Oct. Sign in before then to cancel") is a reasonable addition as long as deletion still happens on schedule.

**States.** Blocked (sole owner, unpaid invoice) with the fix · scheduled (grace period, with Cancel deletion) · completed (email).

**Anti-patterns.** Deactivate-only; "Email support@ to delete"; deletion hidden in a help article; a retention offer with no visible way past it; deletion that leaves shared content or data in analytics tools without disclosure.

**Copy.** "Delete your account? Your profile, 3 projects, and all comments will be permanently deleted within 30 days. Invoices are kept for 7 years because tax law requires it." · Button: "Delete my account". (Replace every number with the product's real values.)

**Source.** Apple "Offering account deletion in your app" and App Review Guidelines 5.1.1(v); Google Play account deletion requirements (Play Console Help) and the Android Developers blog on designing the deletion experience.

---

## 6. Data export ("Download your data")

**Purpose.** Give people a copy of their data (portability and access rights under GDPR Articles 15 and 20) and a way out that builds trust.

**Rules.**
- Machine-readable formats (JSON and/or CSV in a ZIP), with a README describing the files.
- Built **asynchronously**; notify by email and in-app with a download link that expires, and require sign-in to download.
- Show status: "Preparing your export (started 10:42)… We'll email you when it's ready." Allow one export at a time; show the last export's date.
- Offer it inside the deletion flow and from Privacy settings.
- Workspace-level exports (admin) are separate from personal exports; say which one this is.

**Anti-patterns.** PDF-only exports; exports that silently omit attachments; download links that never expire or work without authentication.

**Source.** GDPR Art. 15 and 20 (gdpr-info.eu); Apple and Google deletion guidance (offer export before delete is common practice).

---

## 7. Language and region

**Purpose.** Let people choose the interface language and, separately, how dates, numbers, and currency appear.

**Rules.**
- List languages by their **own names** ("Deutsch", "Español", "Cymraeg"), with `lang` set on each option. **Don't use flags** for languages (a language isn't a country).
- Separate **language** from **region/formats** (date, number, first day of week) and **currency** and **time zone**.
- Default from the browser or device (`Accept-Language`, OS locale) with an easy override; remember the choice.
- **Switching must not lose entered data.**
- One consistent placement: in preferences for signed-in apps; for public multi-language pages, the same spot on every page.
- Offer a language only when the key content exists in it.
- Format with locale-aware APIs (`Intl` on the web); implementation details in `web-platform`.

**Source.** GOV.UK language navigation component (status "Trial" as of 2026-09); W3C internationalization guidance.

---

## Sources

- Polaris, App settings layout: https://polaris.shopify.com/patterns/app-settings-layout
- Primer, Saving: https://primer.style/ui-patterns/saving
- Carbon, Disabled states: https://carbondesignsystem.com/patterns/disabled-states/ · Read-only states: https://carbondesignsystem.com/patterns/read-only-states-pattern/
- Carbon, Remove (community pattern): https://carbondesignsystem.com/community/patterns/remove-pattern/
- GitHub Docs, Deleting a repository: https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository
- Apple, Offering account deletion in your app: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Apple, App Review Guidelines 5.1.1(v): https://developer.apple.com/app-store/review/guidelines/
- Google Play, Understanding Google Play's app account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
- Android Developers Blog, Designing your account deletion experience with Google Play (2024): https://android-developers.googleblog.com/2024/03/designing-your-account-deletion-experience-google-play.html
- GOV.UK Design System, Create accounts: https://design-system.service.gov.uk/patterns/create-accounts/ · Names: https://design-system.service.gov.uk/patterns/names/ · Language navigation: https://design-system.service.gov.uk/components/language-navigation/
- Awesome Falsehood (names): https://github.com/kdeldycke/awesome-falsehood
- GDPR Art. 20 (portability): https://gdpr-info.eu/art-20-gdpr/
