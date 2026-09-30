# Onboarding blueprints

Five starting designs, one per product shape. Each gives: activation metric → flow → screen sketch → copy → events → failure modes. Adapt the nouns; keep the order of asks (value before account, permissions, invites, and payment) unless you have data that says otherwise.

## Contents
- B2B SaaS (team product, self-serve) + the invited teammate
- B2C mobile app (consumer, possibly subscription)
- Developer tool / API
- Two-sided marketplace
- AI product (chat, agent, generative tool)
- Event naming used here

---

## 1. B2B SaaS (web, self-serve, team product)

**Activation (template):** workspace has ≥ 1 real `<core object>` AND ≥ 1 teammate active within 7 days. Collaboration products (Slack, Figma) treat teammate invites as a key activation event, so a solo-only metric undercounts churn risk.

**Flow**
1. **Sign up**: SSO first (Google, Microsoft, passkey), email as fallback. Email only (plus password if not SSO). Screens and security: `auth-flows`.
2. **Create or join**: if a workspace already exists for the email domain, offer "Join Acme" first; this prevents duplicate workspaces. Offer domain auto-join when creating ("Anyone with an @acme.com email can join"), as Linear does.
3. **One personalization question**: "What are you planning first?" with 4–6 options + "Something else". The answer picks the template and the checklist.
4. **Land in the product, not in settings**: a template or sample project labeled "Example", one highlighted primary action.
5. **First real core action** with inline guidance (create the first real project).
6. **Success moment**: show the outcome (rendered roadmap, shareable link, first chart), briefly celebrated.
7. **Invite after step 6**, framed around the object: "Share 'Q3 roadmap' with your team". Bulk email entry, copyable invite link, visible "Skip for now".
8. **Checklist** (3–5 items, dismissible) for remaining setup: connect an integration, invite, notification preferences, desktop/mobile app.
9. **Lifecycle emails keyed to state**: welcome (immediate), stalled at step X (after about 24 h and 72 h), teammate joined, first-week summary.
10. **Admin setup later**: SAML SSO, SCIM, roles, billing, and audit log live in Settings; surface a "Set up for your team" card to admins once the team has a few members.

**First landing (desktop)**
```
┌──────────────┬───────────────────────────────────────────────────────┐
│ Acme ▾       │  Let's get your first roadmap live                    │
│──────────────│  ┌─────────────────────────────────────────────────┐  │
│ ⌘K Search    │  │ Getting started               2 of 5 · Hide ✕   │  │
│ Home         │  │ ✓ Create workspace                              │  │
│ Projects     │  │ ✓ Pick a template                               │  │
│ Example ▸    │  │ ○ Add your first real project   [Add project]   │  │
│              │  │ ○ Invite a teammate                             │  │
│              │  │ ○ Connect GitHub                                │  │
│              │  └─────────────────────────────────────────────────┘  │
│──────────────│  [ Example: "Website relaunch" board ]                │
│ Invite team  │  This is sample data · Remove sample data             │
│ Sam ▾        │                                                       │
└──────────────┴───────────────────────────────────────────────────────┘
```
The first two items are already done (they happened at sign-up), which is honest endowed progress, not fake progress.

**Copy**
- Headline: "Let's get your first roadmap live" (outcome), not "Welcome to Acme Roadmaps!".
- Question: "What are you planning first?" → Product roadmap · Sprint planning · Bug tracking · Something else.
- Invite: "Roadmaps work better with the people who ship them." Primary "Send invites" · secondary "Copy invite link" · tertiary "Skip for now".
- Empty projects list: "No projects yet. A project groups the work for one goal, like a launch." [Create project] [Import from Jira]

**Events:** `signup_completed{method}`, `workspace_created` / `workspace_joined{via: domain|invite}`, `onboarding_question_answered{question, answer}`, `template_selected{template}`, `project_created{is_sample:false}`, `aha_reached`, `invite_sent{count}`, `invitee_activated`, `checklist_item_completed{item}`, `checklist_dismissed{items_done}`.

### The invited teammate (second user)

Often forgotten, and often the majority of users in a team product.

```
Email: "Maya invited you to 'Q3 roadmap' in Acme"   [Open roadmap]
  → Sign in / SSO (email pre-filled, domain SSO if configured)
  → Name + avatar (one screen, skippable avatar)
  → Lands ON 'Q3 roadmap' with a one-line hint: "Maya shared this with you. Comment or add an item."
     Avatars of who else is here · no personalization survey · no workspace checklist
```
- Name the inviter and the object in the email subject and body.
- If the invitee's email domain differs from the workspace, say which workspace they are joining.
- Expired invite: explain, and offer "Ask Maya for a new invite" (one click sends the request).
- Event: `invite_accepted{inviter_id}` → `invitee_activated` (their own first action on a shared object).

**Failure modes:** duplicate workspaces per domain; invitees shown the creator's onboarding; checklist that never disappears; admin-only setup (SSO, billing) pushed on every new user.

---

## 2. B2C mobile app (consumer, possibly subscription)

**Activation (template):** completed the first core session on day 0 AND returned on ≥ 2 of days 1–7.

**Flow**
1. **Launch instantly**; the launch screen mirrors the first screen (no logo splash, no text) per Apple HIG Launching.
2. **Value-first welcome** (one screen): outcome headline, a preview of real content, "Get started", and an always-visible "I already have an account" (Android onboarding guidance).
3. **Goal question** (1–3 screens, one question each, large tappable options): "What brings you here?" The answer personalizes the first session and later copy.
4. **First session before account** (Duolingo's "gradual engagement"): a lesson, a short meditation, a first workout, a generated plan preview.
5. **Soft account prompt** framed as saving progress: Sign in with Apple / Google / passkey first, email last.
6. **Paywall (subscription apps only)**: references the declared goal, visible close or "Continue free", clear trial terms. Placement decided by experiment (`mobile-onboarding.md`).
7. **Reminder soft-ask → system notification prompt** only once there is something to remind about.
8. **Home** opens on "Continue" (the next session) first.

**Screen stack**
```
[Launch = first-screen skeleton]
  → [Welcome: outcome + real preview | Get started · I have an account]
  → [Q1: What brings you here? (5 big options)] → [Q2: experience level] (optional)
  → [First session: interactive, 1–3 min]
  → [Result: "Day 1 done" + what tomorrow holds]
  → [Save your progress: Apple | Google | Email · Not now]
  → [Paywall? subscription apps only; closable; terms visible]
  → [Reminder soft-ask: "Remind you at 9 pm?" → system prompt]
  → [Home: "Continue" card first]
```

**Copy**
- Welcome: "Sleep better in two weeks" + "Get started" / "I already have an account".
- Goal: "What brings you here?" → Sleep better · Feel less stressed · Focus · Manage anxiety · Just exploring (Headspace asks a similar question).
- Save: "Save your progress so you don't lose Day 1."
- Reminder: "Want a reminder for tomorrow's session? Pick a time." [Set reminder] [Not now] (on iOS, this soft-ask is an in-app choice about reminders; the priming screen right before the system alert must follow the single-button rule).

**Events:** `app_first_opened`, `onboarding_step_viewed{step}`, `goal_selected{goal}`, `first_session_started`, `first_session_completed{duration_s}`, `account_created{method}`, `paywall_viewed{placement}`, `trial_started`, `paywall_closed`, `notification_prompt_shown{context}`, `notification_permission_result{granted}`, `session_completed{day_index}`.

**Failure modes:** four-slide carousel before the app; notification and tracking prompts at launch; account wall before the first session; progress lost when the app is killed mid-flow; tutorial replayed on every launch.

---

## 3. Developer tool / API

**Activation (template):** first successful authenticated API call (or deploy) within 24 h of sign-up; then ≥ 1 call from a non-sandbox environment within 14 days as the production/habit signal. **TTV metric:** time to first call (TTFC) or time to first deploy.

**Principles**
- **Docs are public.** Developers evaluate by reading; never gate docs or pricing behind sign-up.
- **Keys in the code.** When a developer is signed in, inject their own test keys into code samples so snippets run on paste (Stripe's docs do this; logged-out samples use a placeholder test key).
- **Sandbox by default.** Test mode or sandboxes so experiments are safe; make the environment unmistakable (a persistent "Test mode" badge).
- **Template-to-live in one flow.** Vercel can clone a template into a new Git repo and deploy it; marketplace integrations (for example Supabase) inject environment variables, so the first deploy works before any manual config.
- **Snippets in the developer's language** (cURL, JS, Python, Go…); remember the choice across pages.
- **Show success in the product** the moment the first request lands, and link to its log entry.
- **CLI parity**: `login` → `init` → `deploy` mirrors the web flow; the CLI prints the dashboard URL of what it created.

**Get-started page**
```
┌ Get started ─────────────────────────────────────────────── Test mode ● ┐
│ 1  Install          npm i @acme/sdk                          [Copy]     │
│ 2  Authenticate     export ACME_KEY=sk_test_••••4f2a  [Copy] [Reveal]   │
│ 3  Send a request   ┌ cURL │ Node │ Python │ Go ┐                        │
│                     │ const acme = new Acme(process.env.ACME_KEY)│[Copy]│
│                     │ await acme.messages.send({ to: "you@…" })  │      │
│ 4  Waiting for your first request…  ◌ listening                         │
│    ✓ Received 200 · POST /v1/messages · 142 ms  → View in logs          │
│ Next: Add a webhook · Go-live checklist · Invite a teammate             │
└─────────────────────────────────────────────────────────────────────────┘
```

**Copy**
- "Send your first message in a few minutes." (Avoid promising a number of seconds you have not measured.)
- Listening state: "We're listening for your first request. Run the snippet above."
- After about 60 s with nothing: "Nothing yet? Check that ACME_KEY is set in this shell, or see common errors." with a link to troubleshooting.
- Error received: show the actual status and error body with the fix ("401: this key belongs to another project. Use the key above.").

**Events:** `api_key_created{env}`, `snippet_copied{lang, step}`, `first_request_received{status}`, `first_success_request`, `ttfc_seconds` (property on the success event), `first_live_request`.

**Failure modes:** docs behind a login; keys shown once in a modal and then lost; sandbox and live data mixed; success visible only in logs the user has not found.

---

## 4. Two-sided marketplace

**Activation (one per side):** supply = first listing published AND first booking/sale within N days; demand = first transaction completed.

**Principles**
- **Supply first.** Buyers do not come without inventory, and supply is usually slower and costlier to onboard (Sharetribe's marketplace guidance; Airbnb's early city-by-city supply work).
- **Stage seller onboarding**: sign-up → first listing → verification/payouts → first sale, with a checklist and status per stage.
- **Autosave drafts**; listings are long forms. Allow "Publish later" and show a preview as buyers will see it.
- **Verification (KYC, payouts) at the last responsible moment**: require payout details before the first payout, not before the first draft (compatible with progressive onboarding in payment platforms such as Stripe Connect).
- **Buyers browse without an account**; ask at booking, checkout, or "Save".
- **Concierge early supply**: help with photos, create first listings manually, offer guarantees.

**Seller checklist**
```
Your shop is 60% ready
✓ Account   ✓ Shop name & photo   ● First listing (draft saved)   [Continue]
○ Payout details — needed before your first payout
○ Share your shop link
```

**Copy**
- "Your listing is saved as a draft. Publish it when you're ready — buyers will see this preview."
- "Add payout details before your first sale is paid out. It takes about 5 minutes and you'll need your bank details." (State the real time only if measured.)

**Events:** `seller_signed_up`, `listing_draft_saved{completeness}`, `listing_published`, `payout_details_added`, `first_order_received`, `buyer_first_search`, `buyer_account_created{trigger: checkout|save}`, `first_purchase_completed`.

**Failure modes:** identity verification before any listing; buyers forced to sign up to browse; drafts lost on navigation; no preview of the buyer view.

Do not ship playbook numbers such as "recruit N sellers at 0% commission for M months"; none have a primary source.

---

## 5. AI product (chat, agent, generative tool)

**Problem:** an empty prompt box signals unlimited capability and zero direction (the "blank prompt" problem).

**Activation (template):** the user accepted or used an AI output in real work (copied, inserted, exported, merged, sent) within the first session. "Sent a prompt" is activity, not activation. Returning for a second session is the habit signal.

**Patterns**
- **Starter prompts or suggestion chips** tailored to the declared role or the current context. PostHog's empty dashboard offers AI starter prompts that open the assistant pre-filled and build the insights.
- **Scoped first task over open chat**: a form, a mode, or a narrow feature makes the capability legible for new users.
- **Generated starting point**: produce a first draft from a short intent so the user starts as an editor, not an author.
- **Honest limits up front**: what it cannot do, where data goes, how to verify; show sources inline.
- **One worked example**, inputs → output visible, then "Try it with your own file".
- **Connect data early only if** the first useful answer depends on it; otherwise start with public or sample context.
- **Progressive capability disclosure**: surface agents, automations, and integrations after the first accepted output with "You can also…" hints.
- **Cost and latency**: show progress on long runs, allow cancel, explain credits before they run out.

**Empty state inside a product**
```
What do you want to do with your sales data?
[ Summarise last week's pipeline ] [ Find deals at risk ] [ Draft a follow-up email ]
[ Ask anything…                                                          ↵ ]
Uses: your CRM (read-only) · Can't: send emails without your approval · Learn more
```

**Events:** `ai_starter_prompt_clicked{prompt_id}`, `ai_request_sent{source: starter|typed}`, `ai_output_shown{latency_ms}`, `ai_output_accepted{action: copy|insert|export|send}`, `ai_output_rejected{reason}`, `ai_capability_discovered{feature}`.

**Failure modes:** blank chat as the first screen; demos that promise more than the model does; activation counted as prompts sent; credits exhausted mid-task without warning. UI details for chat, streaming, and approvals: `ai-interface-design`.

---

## Event naming used here

`object_action` in snake_case and past tense; variants go in properties, never in the name. Every event carries `user_id`, `account_id` (B2B), `platform`, and `is_sample` where relevant. Full conventions and a tracking-plan template: `measurement.md`.

## Sources

- Apple HIG, Onboarding and Launching: https://developer.apple.com/design/human-interface-guidelines/onboarding ; https://developer.apple.com/design/human-interface-guidelines/launching
- Android Developers, Authentication & Onboarding (updated 2026-05-19): https://developer.android.com/design/ui/mobile/guides/patterns/onboarding
- Reforge, setup and aha moments: https://www.reforge.com/guides/define-your-setup-moment
- Slack invites as activation: https://www.appcues.com/blog/slack-user-onboarding-experience
- Linear onboarding (demo workspace, domain join): https://www.candu.ai/blog/linear-onboarding-teardown ; https://supademo.com/user-flow-examples/linear
- Duolingo gradual engagement: https://growth.design/case-studies/duolingo-user-retention
- Headspace onboarding teardown: https://tearthemdown.substack.com/p/headspace
- Stripe docs and sandboxes: https://docs.stripe.com/api ; https://stripe.dev/blog/avoiding-test-mode-tangles-with-stripe-sandboxes
- Vercel for GitHub; Supabase Vercel integration: https://vercel.com/docs/git/vercel-for-github ; https://supabase.com/partners/integrations/vercel
- Sharetribe, onboarding initial marketplace supply: https://www.sharetribe.com/academy/onboard-initial-marketplace-supply/
- Blank-prompt problem and AI onboarding: https://productled.com/blog/ai-onboarding
- PostHog dashboards docs (AI starter prompts, templates): https://github.com/PostHog/posthog.com/blob/master/contents/docs/product-analytics/dashboards.mdx
- marketingskills `onboarding` skill (MIT; activation examples, email triggers): https://github.com/coreyhaines31/marketingskills
