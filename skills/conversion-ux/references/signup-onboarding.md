# Signup and onboarding

> **Scope note (conversion-ux 1.1.0).** This file keeps the conversion view of signup and early activation. For the full onboarding and activation design — activation metrics, setup/aha/habit moments, pattern selection, blueprints per product type (B2B SaaS, B2C mobile, developer tools, marketplaces, AI products), invited-teammate flows, permission timing, measurement, and re-onboarding — use the `onboarding-design` skill. For sign-up and login mechanics, passkeys, SSO, verification, and account recovery, use `auth-flows`. Where the two overlap, those skills are the source of truth.

## Contents
- Signup: fields and methods
- Signup: flow and errors
- Verification
- Defining activation
- Minimum path to value
- First-run patterns
- Checklists, tours, and hints
- Choosing onboarding patterns
- Trials and activation models
- Stalled users
- Metrics

---

## Signup: fields and methods

### Ask only what this step needs
**Rule.** Signup collects the minimum to create an account; everything else is deferred, inferred, or dropped.
**Apply when.** Any account creation, waitlist, or lead form.
**Do / Avoid.** Do: email → password or magic link (or social/passkey). Avoid: name, company, company size, role, phone, and "how did you hear about us" on the first screen.
**Why.** Each field adds effort and a reason to leave (Hick's law, activation energy); qualification belongs in onboarding or product behavior. Demo-request forms for high-touch sales are the exception (5–8 fields).

### Offer the fastest sign-in your users already have
**Rule.** Offer the identity providers your audience uses, plus passkeys, above the email form.
**Apply when.** Consumer apps (Google, Apple), B2B (Google, Microsoft, SAML/OIDC SSO for larger customers), developer tools (GitHub).
**Do / Avoid.** Do: "Continue with Google" and "Continue with email" as clear options. Avoid: 8 provider buttons. On iOS, if you offer third-party social login you must also offer a privacy-focused equivalent (App Store Review Guideline 4.8).
**Why.** Social login and passkeys remove password creation, the most error-prone signup step.

Field rules:
- Email: single field, no confirmation field, typo suggestions for common domains, `autocomplete="email"`.
- Password: show/hide, requirements visible before typing and ticked live, allow paste and managers, prefer length over composition rules; consider passwordless.
- Name: one "Full name" field, only if needed now.
- Phone: defer; if required, say why and format as typed with a country picker.
- Company: infer from email domain and let users confirm.
- Terms: a line of text ("By continuing you agree to…") rather than a checkbox, unless the law requires explicit acceptance; marketing consent is a separate, unchecked checkbox.

## Signup: flow and errors

- Put signup on its own clean page or in a focused modal from the landing page; no navigation competing with it.
- Multi-step only when needed (more than ~3–4 fields): start easy, show progress, save progress, allow Back.
- Errors route users: "This email already has an account. [Sign in] or [reset password]".
- Mobile: single column, 44 px+ targets, correct keyboards, the CTA visible above the keyboard.
- After submit: land in the product (or the first onboarding step), not on a "check your email" dead end, whenever risk allows.

## Verification

- Prefer verifying later: let users start, then gate only the actions that need verified email (sending invites, publishing).
- When required upfront: say where the email went ("We sent a link to maya@acme.com"), offer resend with a visible cooldown, change-email, and a hint to check spam; use `autocomplete="one-time-code"` for codes and accept paste.
- Magic links open in the same browser/device context when possible; if not, offer a code alternative.

## Defining activation

- Activation is the earliest user action that predicts retention. Find it by comparing retained and churned cohorts: what did retained users do in their first days that churned users did not?
- Typical shapes: created the core object + used it once (sent the first invoice), connected a data source + saw the first result, invited a teammate (collaboration products).
- Write it as one sentence with a time window: "Activated = sent at least one invoice within 7 days of signup."
- Replace vanity metrics: signups → activation rate; tour completion → time to activation; session length → D7/D30 retention.

## Minimum path to value

1. List every step from signup to activation, including screens, fields, waits, emails, and required setup.
2. Mark each step: **essential** (the product cannot work without it), **declares intent** (personalizes the path), or **administrative** (collects data the path does not use).
3. Remove administrative steps; defer non-essential setup until after the first value; keep short intent questions that change what the user sees next.
4. Reorder so the first value arrives as early as possible (sample data, templates, or a default configuration before full setup).
5. Measure drop-off per step and fix the steepest drop first, not the first step.

## First-run patterns

| Pattern | Use when | Rules |
|---|---|---|
| Empty state with one action | Simple products, users know what to do | Explain what goes here, one primary action, optional template |
| Templates / starter content | Blank-canvas products (docs, boards, sites) | 3–6 relevant templates; "Start blank" always available |
| Sample data | Value is only visible with data (analytics, CRM) | Clearly labeled "Sample data", one click to clear, replaced as soon as real data arrives |
| Guided setup (wizard) | Product cannot work without configuration (integrations) | Few steps, progress shown, skippable where possible, resumes where left |
| Intent question | Different goals need different paths | One screen, 3–5 choices, changes the next screen |
| Import | Users are switching from a tool | Import early from the incumbent tool or CSV with preview |

Never land a new user on a blank dashboard full of zeros.

## Checklists, tours, and hints

- **Checklist**: 3–7 items ordered by value, first item a quick win, progress visible, items link directly to the action, dismissible, and removed when complete. Marking a step already completed at signup as done uses the endowed-progress effect (in Nunes and Drèze's 2006 study, a loyalty card with 2 of 10 stamps pre-filled was completed far more often than an equivalent 8-stamp card starting empty). Never add fake steps to make progress look closer.
- **Product tour**: optional, 3 steps or fewer (5 at most), skippable, never repeated for returning users; prefer contextual hints (`onboarding-design`).
- **Contextual hints**: triggered by behavior (first time opening a feature), one at a time, dismissible, not repeated after dismissal.
- **Onboarding video**: short, optional; welcomes and shows the outcome rather than teaching every control.
- **Celebrate activation** once, briefly (a clear success state and the next step); no confetti on trivial actions.

## Choosing onboarding patterns

| User knowledge | Product complexity | Default combination |
|---|---|---|
| New to the category | High | Intent question + guided setup + checklist + sample data |
| New to the category | Low | Welcome screen with one action + empty state |
| Knows the category (switching) | High | Import + checklist + contextual hints |
| Knows the category | Low | Straight into the product with a good empty state; get out of the way |

## Trials and activation models

| Model | Fits when | Watch for |
|---|---|---|
| Freemium | Low marginal cost, viral or network effects, long evaluation | Free tier must hook, not fully satisfy; clear upgrade triggers |
| Free trial, no card | Value is quick to show; top-of-funnel volume matters | Lower trial-to-paid rate; nurture during trial |
| Free trial, card upfront | High-intent buyers, fraud or cost risk | Fewer trials; **must** state terms upfront and remind before charging (auto-renewal laws) |
| Reverse trial (full features, then drops to free) | Premium features are the hook | Clear communication of what changes and when |
| Demo / sales-assisted | Complex, expensive, multi-stakeholder | Scheduling friction; offer a sandbox too |

Trial length follows time to value and usage frequency, not a default "14 days". Tie reminders to value received ("You sent 12 invoices this trial") and say exactly what happens at the end.

## Stalled users

- Define stalled (e.g. no activation event 3 days after signup).
- Re-engage with one specific next step (email or in-app "Pick up where you left off"), addressing the likely blocker.
- Offer human help for high-value accounts.
- Emails reinforce in-product actions and link straight into the step; they do not duplicate the tour.
- Respect unsubscribes and notification settings; nudges are not nags.

## Metrics

| Metric | Definition |
|---|---|
| Signup completion rate | Started signup → account created, per field and step |
| Activation rate | Accounts reaching the activation event within the window |
| Time to activation | Median time from signup to activation |
| Step drop-off | Share lost at each onboarding step |
| D1 / D7 / D30 retention | Returning and active users by signup cohort |
| Trial-to-paid | Paid conversions / trials started, by source and cohort |

Segment by source, device, and plan; a blended average hides the step that is broken for mobile or paid traffic.

## Sources

- Joseph C. Nunes and Xavier Drèze, "The Endowed Progress Effect", *Journal of Consumer Research* 32(4), 2006: https://doi.org/10.1086/500480
- growth.design case studies (Duolingo gradual engagement, Trello learn-by-doing): https://growth.design/case-studies
- NN/g, "Designing Empty States in Complex Applications": https://www.nngroup.com/articles/empty-state-interface-design/
- Laws of UX, "Paradox of the Active User" and "Goal-Gradient Effect": https://lawsofux.com/paradox-of-the-active-user/ ; https://lawsofux.com/goal-gradient-effect/
- Apple App Store Review Guidelines 4.8 Login Services: https://developer.apple.com/app-store/review/guidelines/#login-services
- WCAG 2.2 SC 3.3.8 Accessible Authentication: https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html
- marketingskills `signup` and `onboarding` skills (MIT; field rules, minimum path to value, checklist guidance): https://github.com/coreyhaines31/marketingskills
