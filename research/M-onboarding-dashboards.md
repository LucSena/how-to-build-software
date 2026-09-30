# M — Onboarding, dashboards, and app shell / navigation (research notes)

Researched 2026-09-30. Scope: (A) user onboarding for web SaaS, mobile apps, B2B teams, developer tools, marketplaces and AI products; (B) dashboard design and app shell / navigation patterns.

**Builds on (do not duplicate):** A2 §4.5 (activation, Minimum Path to Value, checklists, trial design) and §4.7 (dashboard KPIs); B-ux-principles §3.3 (NN/g empty states, 5 UI states) and growth.design cases (Duolingo, Trello); F-web-design §3.11–3.12 (tables, dashboards, density) and app-shell grid values; D-mobile §2.11, §7.1 (HIG permissions, pre-permission rules).

**Source-quality legend**

| Tag | Meaning |
|---|---|
| **[P]** | Primary: read directly (Apple HIG JSON, Android developer page, shadcn/ui repo, Tremor repo, Plausible docs repo, PostHog docs repo, marketingskills repo) |
| **[S]** | Secondary: seen via web-search summaries of the named page; the claim matches the page title and known content, but the full text was not read |
| **[V]** | Vendor data (tool vendor with a commercial interest: Userpilot, Chameleon, Pendo, RevenueCat, Appcues). Directionally useful, cite "as reported by" |
| **[U]** | Unverified: plausible and widely repeated, but no primary source was found. Do not ship as a number; ship as a heuristic or drop |
| **[K]** | Knowledge / synthesis by the researcher (well-established practice, no single source); fine for rules, not for figures |

Licensing: HIG and Android pages are paraphrased only. marketingskills is MIT (credit in CREDITS.md). shadcn/ui is MIT, Tremor (tremor-npm) is Apache-2.0. Plausible docs repo and PostHog docs: paraphrase + link only. NN/g, Reforge, Lenny's Newsletter, Stephen Few and Tufte: ideas with credit, no copied text.

---

# PART A — ONBOARDING

## A1. Definitions an agent must use precisely

- **Onboarding** is not a tour; it is the path from signup to the user's first real success, then to a habit. Samuel Hulick (UserOnboard): "People don't buy products; they buy better versions of themselves." He frames onboarding as moving users from A to B *in their lives*, not in the app; the iPod was sold as "1,000 songs in your pocket", not "1GB MP3 player" [S: https://www.fastcompany.com/3025484/why-people-dont-buy-products-they-buy-better-versions-of-themselves ; https://www.intercom.com/blog/podcasts/podcast-samuel-hulick-onboarding/].
  - **Rule:** every onboarding screen's copy is written in terms of the user's outcome ("Send your first invoice and get paid faster"), never the feature ("Invoices module").
- **Reforge's three moments** [S: https://www.reforge.com/guides/define-your-setup-moment ; https://www.reforge.com/c/retention-series-eg/activation/aha-moment]:
  1. **Setup moment**: the user has done the must-have actions needed to experience the core value (connect data, create a project, install the SDK).
  2. **Aha moment**: the user experiences the core value for the first time (sees their first report, receives their first reply, deploys their first site).
  3. **Habit moment**: the user repeats the core action enough times in an initial window to be in the habit loop.
  - Reforge's own framing: activation = taking a user from signup to a habit around the core value; Facebook's "7 friends in 10 days" is the classic *setup* threshold whose *aha* is an interesting feed [S].
- **Activation metric**: the earliest measurable action (with a count and a time window) that best separates retained from churned users. Format: `<action> ≥ N times within T days of signup`. Examples in A2 §4.5 (Slack 2,000 messages; Facebook 7 friends / 10 days).
  - marketingskills examples by product type [P, MIT: marketingskills/skills/onboarding/SKILL.md]: project management = create first project + add a team member; analytics = install tracking + see first report; design tool = create first design + export/share; marketplace = complete first transaction.
- **Time to value (TTV)**: elapsed time from signup to the aha moment. Improving TTV almost always improves activation rate because slow users abandon first [S: https://www.lennysnewsletter.com/p/what-is-a-good-activation-rate summary via prodpad glossary].

### A1.1 Benchmarks (use with care)

| Metric | Figure | Source | Tag |
|---|---|---|---|
| Activation rate, all products | average 34%, median 25% | Lenny Rachitsky + Yuriy Timen survey, 500+ products, Oct 2022 | [S] https://www.lennysnewsletter.com/p/what-is-a-good-activation-rate |
| Activation rate, SaaS only | average 36%, median 30% | same | [S] |
| Median time to activation milestone | ~10 days (mode 7) | same survey, as summarised by third parties | [S/U] |
| Activation rate average (Userpilot) | 30–37%; top quartile 40%+ | already in A2 §4.5 | [V] |
| Onboarding checklist completion | average 19.2%, median 10.1% (188 companies) | Userpilot benchmark | [V] https://userpilot.com/blog/onboarding-checklist-completion-rate-benchmarks/ |
| Checklist completion by segment | FinTech/Insurance 24.5% (highest), MarTech 12.5% (lowest); sales-led 22.1% vs product-led 19% | same | [V] |
| Product tour completion | 3-step tours ~72%; 7-step tours ~16%; progress indicators add ~12%; user-triggered tours beat blanket/delayed triggers by ~2–3× | Chameleon benchmark reports (2019 report origin; figures re-cited in 2025 material) | [V] https://www.chameleon.io/benchmark-report-2023 ; https://www.chameleon.io/assets/chameleon-product-tour-benchmarks-report-2019.pdf |
| Features rarely/never used | 80% of features in the average product (615 subscriptions) | Pendo 2019 Feature Adoption Report | [V] https://www.pendo.io/resources/the-2019-feature-adoption-report/ |
| Subscription apps: trials started on day 0 | 82% (2025 report); ~89% in another cut | RevenueCat State of Subscription Apps 2025 | [V] https://www.revenuecat.com/state-of-subscription-apps-2025 |
| 3-day-trial cancellations on day 0 | 55% | RevenueCat SOSA 2026 | [V] https://www.revenuecat.com/state-of-subscription-apps |
| Trial start rate | P90 20.3% vs median 6.2% | RevenueCat SOSA | [V] |
| Hard paywall vs freemium conversion | median ~10.7% vs ~2.1% (download → paid) | RevenueCat SOSA, as summarised | [V] metric definition not verified; cite as "as reported" |
| Moving paywall before onboarding | +50% relative more users *see* the paywall (one case) | RevenueCat blog case, via search summary | [U] https://www.revenuecat.com/blog/growth/fix-onboarding-funnels |
| Duolingo delayed signup | +20% DAU from delaying signup | Appcues article, secondary | [U] https://www.appcues.com/blog/the-10-best-user-onboarding-experiences |
| Developer time-to-first-call | best-in-class < 2 min; most APIs 3–8 min | a copywriting agency's benchmark | [U] https://www.youngcopy.com/insights/how-fast-is-your-api-onboarding-benchmark-your-first-call-time-in-five-minutes |
| SaaS week-1 return | ~37% of users return one week later, 15% by week 8 (median SaaS) | Mixpanel data post (older, Hackernoon) | [U] https://medium.com/hackernoon/what-billions-of-user-events-taught-us-about-saas-products-fdf45a7b1fbc |

**Rule for the skill:** benchmarks are for sanity-checking, not goals. The only activation target that matters is "better than last cohort". Never tell users "a good activation rate is X%" without the "as reported by <vendor>, <year>" qualifier.

## A2. Principles (what the research agrees on)

1. **The best onboarding is a usable product.** NN/g's recommendation is to avoid building app onboarding whenever possible and spend the effort on making the UI more usable [S: https://www.nngroup.com/articles/mobile-app-onboarding/ ; https://www.nngroup.com/videos/onboarding-skip-it-when-possible/]. Apple: "Ideally, people can understand your app or game simply by experiencing it, but if onboarding is necessary, design a flow that's fast, fun, and optional" [P: HIG Onboarding].
2. **Deck-of-cards tutorials don't work.** NN/g tested 70 users on 4 mobile apps with deck-of-cards tutorials (swipeable instruction screens on first launch): tutorials did **not** improve task performance, made the interface look more complicated than it was, and strained memory [S: https://www.nngroup.com/articles/mobile-tutorials/].
3. **Pull beats push.** NN/g: intrusive launch tutorials and change-lists are *push revelations*: help shown out of context, unrelated to the user's current goal, quickly forgotten and often ignored. *Pull revelations* are contextual help that appears when the user engages with the related feature (e.g. a hint next to the filter button when the user starts filtering) [S: https://www.nngroup.com/articles/onboarding-tutorials/].
4. **Teach by doing.** HIG: people retain more when they perform the task than when they view instructions; offer interactive onboarding where people "safely test an action" [P]. Trello teaches with a board whose cards are the tutorial; Slack makes you send a message first (B-ux §growth.design; A2 §4.5).
5. **Straight line + bumpers (Wes Bush, "Bowling Alley")** [S: https://productled.com/blog/user-onboarding-framework ; https://www.productboard.com/blog/a-battle-tested-product-onboarding-framework-from-wes-bush/]:
   - **Straight-line onboarding**: strip every step that is not needed to reach the first result; reorder the rest.
   - **Product bumpers** (in-app): welcome message, checklist, progress bar, contextual tooltips, empty states.
   - **Conversational bumpers** (out of app): lifecycle emails, push, and personal outreach that pull stalled users back to the next step.
6. **Delay everything that isn't needed yet.** HIG: postpone non-essential setup and customisation, ship reasonable defaults; don't show licence text in onboarding; prefer letting people experience the app before asking for ratings or purchases [P]. Android: split what must happen *before* using the app from what can happen *while* using it; "typically you will need to show the value of the app before asking for device permissions or to create an account. Always follow the value proposition with the action" (paraphrase) [P: https://developer.android.com/design/ui/mobile/guides/patterns/onboarding].
7. **Collect only critical information.** Android lists this as a top-level takeaway; minimum fields upfront, but don't overcorrect to "one input per screen" [P].
8. **Show progress with real progress components.** Android: steppers, pagers, progress indicators; *don't* use decorative illustrations that change per step as the only progress signal [P]. Chameleon data: progress indicators add ~12% tour completion [V].
9. **Skippable, resumable, never repeated.** HIG: if a tutorial is skippable, don't show it again on later launches, and keep it findable in Help/Settings [P]. Android: a clear, persistent "Skip" / "Log in" option on walkthroughs; allow skip-and-resume by caching progress, and say what happens to progress [P].
10. **Declared intent is good friction.** A short "what brings you here" question personalises the path (A2 §4.5: declarative vs administrative friction). Examples: Notion asks what you need and how you work, then shows ~5 templates matched to the answer [S: https://www.candu.ai/blog/how-notion-crafts-a-personalized-onboarding-experience-6-lessons-to-guide-new-users]; Headspace asks "What brings you to Headspace?" (sleep better, less stressed, more focused, manage anxiety, just checking it out), plus experience level and preferred time [S: https://tearthemdown.substack.com/p/headspace]; subscription apps then echo the stated goal in the paywall headline [S].
    - **Rule:** each personalisation question must change what the user sees next. If an answer doesn't branch the flow, delete the question (it's administrative friction dressed as personalisation).
11. **Value before the account wall.** Duolingo runs the first lesson before asking for an account ("gradual engagement": postpone registration until the user must register to progress) [S: growth.design; Appcues]. Android describes the trade-off explicitly: an upfront "welcome placement" is right when content can't be previewed without an account, but carries higher risk of losing users before they experience the app; contextual/just-in-time onboarding lets you preview content to entice signup [P].
12. **Permissions in context.** HIG: if the app can't function without a permission, request it in onboarding with the reason; otherwise request when the user first touches the feature [P]. Android: "permission priming" at the moment of need, not bulk requests at start; don't request permissions you can't explain [P]. iOS pre-permission screen rules (one "Continue" button, no skip) are in D-mobile §2.11.
    - **Conflict to flag:** marketingskills lists the mobile pattern as "Permissions → Quick win → Push setup → Habit loop" [P, MIT]. Both platform guides say quick win first, permission when needed. **Our skill should follow the platforms: Quick win → contextual permission → push opt-in after value → habit.**
13. **One goal per session, celebrate the result** (A2 §4.5). Android: "exceptional onboarding creates a sense of accomplishment and has a distinct personality" [P].
14. **Use encouraging, assistive copy**, especially for errors during signup/recovery; non-modal feedback (snackbars/toasts) for minor confirmations [P: Android].
15. **Support tickets are onboarding bugs** (A2 §4.5).

## A3. Pattern catalogue (when to use which)

| Pattern | Use when | Don't | Source |
|---|---|---|---|
| **Welcome screen / modal** (1 screen) | Set expectations: "In 3 minutes you'll have X". One primary CTA. | Multi-slide carousels of features | [K]; NN/g deck-of-cards [S] |
| **Personalisation survey** (1–3 questions) | Several distinct jobs-to-be-done or roles | Questions whose answers change nothing | Notion, Headspace [S] |
| **Setup wizard / stepper** | Mandatory prerequisites (connect data source, install snippet, verify domain) | Wrapping optional preferences in the wizard | Android steppers [P] |
| **Checklist** (3–7 items) | Self-serve B2B with several setup steps | Checklist of feature tours; undismissable checklists | marketingskills [P]; Userpilot completion 19% avg [V] |
| **Empty state with one CTA** | Every collection/list/dashboard on first use | Blank tables; "No data" alone | NN/g [S, in B-ux §3.3] |
| **Sample data / demo workspace** | Value is invisible until data exists (analytics, PM, CRM) | Mixing sample data with real data without a label and a one-click "remove sample data" | Linear pre-populates a demo workspace [S: https://www.candu.ai/blog/linear-onboarding-teardown] |
| **Templates** | Blank-canvas products (docs, design, dashboards, AI) | 200 templates on day one; offer 3–6 matched to the declared goal | Notion 5 templates [S]; PostHog dashboard templates [P] |
| **Contextual tooltip / hint (pull)** | Non-obvious feature, shown when the user reaches it | Tooltip chains on first load | NN/g [S]; HIG TipKit [P] |
| **Product tour** (≤3–5 steps) | Genuinely novel interaction model | Tours that explain obvious UI; re-showing tours | Chameleon [V]; marketingskills [P] |
| **Interactive tutorial / "do it now"** | Games, creative tools, keyboard-first tools | Tutorials the user can't skip | HIG [P] |
| **Progress / endowed progress** | Multi-step setup | Fake progress | A2 §4.5 |
| **Lifecycle email/push** | Stalled users, next-step nudges | Emails that duplicate the in-app checklist verbatim | marketingskills [P] |
| **Human concierge** | High-ACV B2B, marketplace supply | — | Wes Bush [S]; Sharetribe [S] |

### A3.1 Choosing by product (RCD matrix is in A2 §4.5; this adds product shape)

```
Is value visible without the user's own data?
├── yes (content app, game, AI chat, templates) → product-first: drop user in, contextual hints
└── no  (analytics, CRM, monitoring, payments)
    ├── can we fake it safely? → sample data / demo workspace + "connect your data" CTA
    └── no → setup wizard for prerequisites only, then empty states with one CTA each
Is the product multiplayer (value needs teammates)?
└── yes → invite step placed AFTER the first solo win, framed as collaboration, easy to skip
```

## A4. Anti-patterns (each with the fix)

| Anti-pattern | Why it fails | Fix | Source |
|---|---|---|---|
| Forced multi-step tour on first load | Push revelation; forgotten; delays value | Contextual pull hints; ≤3-step optional tour | NN/g [S] |
| Feature carousel (deck of cards) before the app | No improvement in task performance; makes app look complex | Preview real content; one welcome screen | NN/g [S]; Android [P] |
| Account wall before any value | Loses users before they see the product | Let users try (Duolingo lesson, Figma/Canva editor, sandbox), ask to save | Android [P]; growth.design [S] |
| Asking for everything upfront (company size, phone, role, avatar, timezone) | Administrative friction; abandonment | Minimum fields; progressive profiling later | Android [P] |
| Notification / tracking / location prompt on first launch | No context → denial, and iOS won't ask twice | Ask at the moment of need, after value | HIG [P]; Android [P] |
| Blank dashboard / empty table | Dead end | Empty state + sample data + one CTA | NN/g [S]; marketingskills [P] |
| Tour re-shown every login | Annoys, trains dismissal | Persist "seen" per user, per feature; put it in Help | HIG [P] |
| Personalisation questions that change nothing | Friction without benefit, breaks trust | Branch on every answer or delete it | [K] |
| Checklist full of "take the tour" items | Measures nothing | Checklist items = real setup actions that lead to aha | [K] |
| Paywall before any micro-win (freemium/trial SaaS) | No value to anchor price | Paywall at a limit/moment of value (A2 §4.6) | A2 |
| Upgrade/pricing nag inside the setup flow | Interrupts the straight line | Show plan limits passively; upsell after activation | A2 §4.6 |
| Measuring tour completion as success | Vanity metric | Activation rate, TTV, D7 retention | A2 §4.5 |
| Splash/launch screen used for branding or ads | Slows launch | Launch screen mirrors first screen, no text, no logo | HIG Launching [P] |
| Large downloads before first use | Delays first interaction | Ship enough content in the bundle | HIG [P] |

Nuance on subscription mobile apps: RevenueCat data shows most trials start on install day and most 3-day-trial cancellations happen on day 0, so B2C subscription apps commonly show a paywall **inside** onboarding, after a personalisation sequence [V]. This is compatible with HIG "experience before purchase" only if the user has seen or felt some value first (a demo, a personalised plan preview, a first session) and the paywall has a clear close/continue path. The skill should present this as a deliberate business trade-off, not a default.

## A5. Blueprints

Every blueprint lists: activation metric → flow (numbered) → screens with copy → instrumentation → failure modes.

### A5.1 B2B SaaS (web, self-serve, team product)

**Activation metric (template):** "Workspace has ≥1 real `<core object>` created AND ≥1 teammate active within 7 days." Solo-only activation undercounts churn risk in team products (Slack, Figma treat teammate invites as a key activation event [S: https://www.appcues.com/blog/slack-user-onboarding-experience ; https://userpilot.com/blog/slack-onboarding/]).

**Flow**
1. **Sign up**: SSO first (Google / Microsoft / passkey), email fallback. Fields: email only (+ password if not SSO). Domain auto-join: "People at acme.com can join this workspace" (Linear offers domain auto-join at workspace creation [S: https://supademo.com/user-flow-examples/linear]).
2. **Create or join workspace**: if a workspace for the email domain exists, offer "Join Acme" first (prevents duplicate workspaces, a classic B2B mess).
3. **One personalisation question** (role or job): "What will you use <Product> for first?" 4–6 options + "Something else". Answer picks the template and checklist.
4. **Land in the product, not in settings**: a pre-filled template or sample project labelled "Example"; a single highlighted primary action.
5. **First real core action** (create the first real object) with inline guidance.
6. **Success moment**: show the outcome (preview, shared link, first chart) with a short celebration.
7. **Invite teammates** *after* step 6, framed around the object just created: "Share 'Q3 roadmap' with your team". Accept emails in bulk; show a copyable invite link; "Skip for now" is visible.
8. **Checklist** (3–5 items, dismissible) for remaining setup: connect integration, invite, set up notifications, install desktop/mobile app.
9. **Lifecycle emails** keyed to checklist state (not the calendar): welcome (immediate), stalled at step X (24h, 72h), teammate joined, first-week summary [P: marketingskills email triggers].
10. **Admin/deep setup later**: SSO/SAML, SCIM, billing, roles, audit logs live in Settings; surface them in a "Set up for your team" card only for admins once the team has ≥3 members [K].

**Invitee (second user) onboarding** — often forgotten:
- The invite email names the inviter and the object ("Maya invited you to 'Q3 roadmap'").
- Accepting lands the invitee **on that object**, not on a generic welcome.
- Skip the personalisation survey for invitees (the workspace is already configured); ask only name/avatar.
- Show "who else is here" (avatars) — social proof that the space is alive [K].

**Screen sketch — first landing (desktop)**
```
┌──────────────┬───────────────────────────────────────────────────────┐
│ Acme ▾       │  Welcome, Sam — let's get your first roadmap live     │
│──────────────│  ┌─────────────────────────────────────────────────┐  │
│ ⌘K Search    │  │ Getting started              2 of 5 · Hide ✕    │  │
│ Home         │  │ ✓ Create workspace                              │  │
│ Projects     │  │ ✓ Pick a template                               │  │
│ Example ▸    │  │ ○ Add your first real project   [Add project]   │  │
│              │  │ ○ Invite a teammate                             │  │
│              │  │ ○ Connect GitHub                                │  │
│              │  └─────────────────────────────────────────────────┘  │
│──────────────│  [ Example: "Website relaunch" board — sample data ]  │
│ Invite team  │  This is sample data · Remove sample data             │
│ Sam ▾        │                                                       │
└──────────────┴───────────────────────────────────────────────────────┘
```

**Copy examples**
- Welcome headline: "Let's get your first roadmap live" (outcome), not "Welcome to Acme Roadmaps!".
- Personalisation: "What are you planning first?" → Product roadmap / Sprint planning / Bug tracking / Something else.
- Invite: "Roadmaps work better with your team. Invite the people who'll ship this." CTA "Send invites"; secondary "Copy invite link"; tertiary "Skip for now".
- Empty projects list: "No projects yet. Projects group the work for one goal, like a launch. [Create project] or [Import from Jira]".

**Instrumentation (event names)**: `signup_completed`, `workspace_created|joined`, `onboarding_question_answered{answer}`, `template_selected`, `core_object_created{is_sample:false}`, `aha_reached`, `invite_sent{count}`, `invitee_activated`, `checklist_item_completed{item}`, `checklist_dismissed`. Report the funnel per step and per signup source.

### A5.2 B2C mobile app (consumer, possibly subscription)

**Activation metric (template):** "Completed first `<core session>` on day 0 AND returned on ≥2 of days 1–7."

**Flow**
1. **Launch** instantly; launch screen mirrors the first screen (no logo splash) [P: HIG Launching].
2. **Value-first welcome** (1 screen): outcome headline + real content preview + "Get started". "I already have an account" link always visible [P: Android].
3. **Goal question** (1–3 screens max, one question each, big tappable options): "What brings you here?" Answers personalise the first session.
4. **First session / quick win before account** (Duolingo pattern): a lesson, a short meditation, a first workout, a generated plan preview.
5. **Soft account prompt** framed as saving progress: "Save your progress" with Sign in with Apple / Google / passkey; email last.
6. **(Subscription apps)** paywall that references the declared goal ("Sleep better in 2 weeks: your plan is ready"), with visible close / "Continue with free" and clear trial terms. Decide placement by experiment; RevenueCat data says day 0 matters [V].
7. **Notification permission** only after the user has something to be reminded of: "Want a reminder at 9pm for tomorrow's session?" (soft ask) → system prompt. On iOS, respect pre-permission rules (D-mobile §2.11).
8. **Habit loop**: next-day reminder at the time they chose; streak or progress; home screen shows "Continue" first.

**Screen stack sketch**
```
[Launch = first-screen skeleton]
  → [Welcome: outcome + real preview | Get started · I have an account]
  → [Q1: What brings you here? (5 big options)] → [Q2: experience level] (optional)
  → [First session: interactive, 1–3 min]
  → [Result/celebration: "Day 1 done"]
  → [Save your progress: Apple | Google | Email]
  → [Paywall? (subscription apps only; closable)]
  → [Reminder soft-ask → system notification prompt]
  → [Home: "Continue" card first]
```

**Mobile checklist**
- [ ] Progress indicator on multi-screen flows (stepper / dots that actually map to steps) [P: Android]
- [ ] Every walkthrough has persistent Skip and Log in [P: Android]
- [ ] Progress survives app kill (resume where left) [P: Android; HIG restore state]
- [ ] No permission requested before the feature that needs it [P]
- [ ] No licence/terms text in the flow beyond a one-line link [P: HIG]
- [ ] Tutorial never re-shown; available in Settings/Help [P: HIG]
- [ ] Passkeys / platform SSO offered; recovery path visible [P: Android]
- [ ] Buttons and inputs don't stretch full-width on tablets/landscape; cap width [P: Android]

### A5.3 Developer tool / API

**Activation metric (template):** "First successful authenticated API call (or deploy) within 24 h of signup", then "≥1 call from a non-sandbox environment within 14 days" for habit/production.
**TTV metric:** time-to-first-call (TTFC) or time-to-first-deploy.

**Principles**
- **Keys in the code.** When signed in, Stripe's docs inject the user's own test API keys into code samples, so snippets run on paste; logged-out examples carry a sample test key [S: https://apidog.com/blog/stripe-docs/ ; https://docs.stripe.com/api].
- **Sandbox by default**: test mode / sandboxes so developers can experiment without risk [S: https://stripe.dev/blog/avoiding-test-mode-tangles-with-stripe-sandboxes].
- **Template-to-live in one flow**: Vercel can fork a starter template into a new GitHub repo, build and deploy it from the dashboard; marketplace integrations (e.g. Supabase) inject environment variables automatically, so the first deploy works without manual config [S: https://vercel.com/docs/git/vercel-for-github ; https://supabase.com/partners/integrations/vercel].
- **Copy-paste snippets in the user's language** (tabs: cURL, JS, Python, Go…), with the language choice remembered.
- **Show success in the dashboard** as soon as the first request lands: "We received your first event 🎉" is the aha for SDK products (the Stripe "first charge graph" idea in A2 §4.5). Poll or stream until it arrives, with a troubleshooting link after ~60 s [K].
- **CLI parity**: `tool login` → `tool init` → `tool deploy` must mirror the web flow; the CLI prints the dashboard URL of what it created [K].
- **Don't gate docs behind signup.** Developers evaluate by reading docs first [K].

**Screen sketch — "Get started" page for an API product**
```
┌ Get started ─────────────────────────────────────────────── Test mode ● ┐
│ 1  Install          npm i @acme/sdk                        [Copy]       │
│ 2  Authenticate     export ACME_KEY=sk_test_••••4f2a       [Copy] [Reveal]
│ 3  Send a request   ┌ cURL │ Node │ Python │ Go ┐                        │
│                     │ const acme = new Acme(process.env.ACME_KEY)│[Copy]│
│                     │ await acme.messages.send({ to: "you@…" })  │      │
│ 4  Waiting for your first request…  ◌   (listening)                    │
│    ✓ Received 200 · POST /v1/messages · 142 ms  → View in logs          │
│ Next: Add a webhook · Go live checklist · Invite teammate               │
└─────────────────────────────────────────────────────────────────────────┘
```

**Copy examples**: "Send your first message in under 2 minutes"; "We're listening for your first request. Run the snippet above."; after 60 s: "Nothing yet? Check that ACME_KEY is set, or see common errors."

**Instrumentation**: `api_key_created`, `snippet_copied{lang}`, `first_request_received{status}`, `first_success_request`, `ttfc_seconds`, `first_live_request`.

### A5.4 Two-sided marketplace

**Activation metrics (one per side):**
- Supply: "first listing published AND first booking/sale within N days".
- Demand: "first transaction completed" (marketingskills [P]).

**Principles**
- **Supply first.** Guests won't come without inventory; hosts won't list without demand. Supply is harder, costlier and slower to onboard, and is usually the bottleneck [S: https://www.sharetribe.com/academy/onboard-initial-marketplace-supply/ ; https://fasterthannormal.co/intersections/airbnb-two-sided-trust].
- **Progressive seller onboarding** broken into stages (signup → verification/KYC → first listing → first sale) with a checklist and status indicators [S: https://www.journeyh.io/blog/marketplace-onboarding-marketplace-seller].
- **Draft-save everything**: listings are long forms; autosave, allow "publish later", show a preview of the listing as buyers will see it [K].
- **Verification (KYC/payouts) at the last responsible moment**: let sellers build the listing first, require payout details before the first payout, not before the first draft [K; compatible with Stripe Connect-style progressive onboarding].
- **Demand side browses without an account**; ask for an account at booking/checkout or "save/favourite" [K].
- **Concierge early supply**: photography help, manual listing creation, guarantees (Airbnb's early city-by-city supply work) [S].
- Unverified playbook numbers (e.g. "25–50 sellers, 0% commission for 6 months") are **[U]**; don't ship them.

**Seller checklist sketch**
```
Your shop is 60% ready
✓ Account     ✓ Shop name & photo     ● First listing (draft saved)  [Continue]
○ Payout details (needed before your first payout)   ○ Share your shop link
```

### A5.5 AI product (chat, agent, generative tool)

**Problem:** a blank prompt box signals infinite capability and zero direction ("blank canvas / blank prompt problem") [S: https://medium.com/design-bootcamp/the-blank-prompt-problem-why-ai-products-are-failing-their-first-session-5e74bcb00b09 ; https://productled.com/blog/ai-onboarding].

**Activation metric (template):** "User accepted/used an AI output in their real work (copied, inserted, exported, merged, sent) within the first session", not "sent a prompt". A second-session return is the habit signal.

**Patterns**
- **Starter prompts / suggestion chips** tailored to the declared role or to the current context (e.g. PostHog's blank dashboard empty state offers AI starter prompts such as landing-page performance and weekly marketing health; clicking one opens the AI panel with a pre-filled request that builds the insights) [P: PostHog docs dashboards.mdx].
- **Structured first run over open chat** for new users: forms, modes or scoped features make capabilities legible (search summaries attribute to NN/g the finding that narrower AI features are easier for new users to understand) [S/U — verify before citing NN/g].
- **Generated starting point**: generate a first draft from a short intent (Gamma-style) so the user starts as an editor, not an author [S].
- **Teach limits honestly**: say what it can't do, where data goes, and how to verify ("Answers can be wrong; check sources"). Show sources/citations inline [K].
- **Show, then let them tweak**: one worked example with visible inputs → output, then "Try with your own file".
- **Bring your context**: connect a data source/file/repo early *only if* the first useful answer depends on it; otherwise start with public/sample context [K].
- **Progressive capability disclosure**: surface advanced tools (agents, automations, integrations) after the first accepted output, via contextual "You can also…" hints [K].
- **Cost/latency expectations**: show progress for long runs (F-web §progress bars), allow cancel, and explain credits before they run out, not after [K].

**Empty state sketch (AI assistant inside a product)**
```
What do you want to do with your sales data?
[ Summarise last week's pipeline ] [ Find deals at risk ] [ Draft a follow-up email ]
[ Ask anything…                                                          ↵ ]
Uses: your CRM (read-only) · Can't: send emails without your approval · Learn more
```

## A6. Measuring onboarding

- **Funnel per step** (marketingskills example: signup 100% → step1 80% → step2 60% → activation 40% → retained 25%); fix the biggest drop, not the first [P, MIT; A2 §4.5].
- **Core metrics**: activation rate, time to activate (median and p75, not mean), steps to activation, activation by cohort and signup source, D1/D7/D30 retention (mobile) or W1/W4/W8 retention (B2B), onboarding completion only as a diagnostic [P: marketingskills].
- **Cohort, don't average**: compare weekly signup cohorts before/after each onboarding change; hold out a control where volume allows [K].
- **Qualitative loop**: watch 5 session replays of users who dropped at the worst step; one-question exit survey on skip ("What were you hoping to do?") [A2 §4.5].
- **Guardrails**: activation gains that come with lower D30 retention or lower paid conversion mean you pulled forward low-intent users [K].
- **Event hygiene**: flag sample-data actions (`is_sample: true`) so they never count as activation [K].

## A7. Re-onboarding, returning users and feature adoption

- **Restore state** on return (HIG Launching: restore previous state, scroll position, windows) [P].
- **Returning after a long gap** (e.g. >30 days): "Welcome back — here's what changed" *once*, with a "pick up where you left off" card; don't replay first-run onboarding [K; marketingskills "return experience" experiments P].
- **New features — tier the announcement** [S: https://www.featurebase.app/blog/new-feature-announcement]:
  - Major capability: in-app modal (once) + email + changelog + blog.
  - Normal feature: badge/"New" dot on the nav item, inline banner on the page it affects, changelog entry.
  - Small improvement: changelog only. Treating every update as a launch trains users to ignore announcements.
  - Interrupt only when the change would confuse users who stumble on it (e.g. moved navigation).
- NN/g classes launch-time "what's new" lists as push revelations [S]; prefer inline "New" hints on the affected control (pull).
- **"New" badges expire** (e.g. after first use or 14–30 days) [K].
- **Changelog placement**: a "What's new" item in the help/account menu with an unread dot; release notes per version, changelog as the running log [S].
- **Feature adoption measurement**: % of active accounts using the feature within 30 days of exposure; Pendo reports 80% of features rarely/never used, so measure before building more [V].
- **Role changes** (a viewer becomes an admin): trigger a mini-onboarding for the new capabilities [K].

## A8. Onboarding checklist for the skill (agent self-check)

- [ ] Activation event defined as `action ≥ N within T days`, tied to retention.
- [ ] Setup, aha and habit moments named for this product.
- [ ] Straight-line path mapped; every step justified ("guilty until proven essential").
- [ ] User reaches a real result in the first session; account wall placed after first value where possible.
- [ ] ≤3 personalisation questions, each branching the experience.
- [ ] Every empty state has explanation + preview/sample + one primary CTA.
- [ ] Sample data clearly labelled and removable in one click.
- [ ] Contextual (pull) hints instead of launch tours; any tour ≤3–5 steps, skippable, never repeated.
- [ ] Permissions requested in context with a reason; notifications after value.
- [ ] Team products: invite after the first solo win; invitee lands on the shared object.
- [ ] Progress shown with real progress components; flows resumable.
- [ ] Lifecycle emails triggered by state, not the calendar alone.
- [ ] Funnel events instrumented per step; sample-data actions excluded.
- [ ] Returning-user and new-feature announcements designed, tiered, and expiring.

---

# PART B — DASHBOARDS

## B1. What a dashboard is (and isn't)

- **Stephen Few's definition** (Information Dashboard Design, 2006): "a visual display of the most important information needed to achieve one or more objectives; consolidated and arranged on a single screen so the information can be monitored at a glance" [S: widely quoted; https://www.uxmatters.com/mt/archives/2007/04/book-review-information-dashboard-design.php]. Three load-bearing words: **most important** (curation), **single screen** (no scrolling for the monitoring layer), **at a glance** (preattentive reading).
- **NN/g (Page Laubheimer, 2017)**: dashboards are collections of visualisations in a single-page view that give at-a-glance information users can act on quickly; they should use **length and 2-D position** (the most accurately perceived encodings) for quantities, and colour/shape/grouping for categories; the article distinguishes **operational** from **analytical** dashboards and covers preattentive processing and linear vs area-based graphs [S: https://www.nngroup.com/articles/dashboards-preattentive/].
- **Types** (industry usage; the operational/analytical split is NN/g's, "strategic" is common BI vocabulary) [S: https://www.idashboards.com/operational-analytical-and-strategic-the-three-types-of-dashboards/ ; https://www.klipfolio.com/blog/starter-guide-to-dashboards]:

| Type | Question | User | Refresh | Design emphasis |
|---|---|---|---|---|
| **Operational** | "Is anything wrong right now? What needs action?" | on-call, support, ops, sellers | seconds–minutes | alerts, status, thresholds, queues; big state indicators; links to act |
| **Analytical** | "Why did it change? Which segment?" | analysts, PMs, marketers | on demand | filters, breakdowns, comparison, drill-down; denser |
| **Strategic / executive** | "Are we on track?" | leadership | daily–monthly | few KPIs vs target, trends over long ranges, little interaction |
| **Home / overview (in a product)** | "What's new for me, what do I do next?" | every user | on load | 3–5 KPIs + tasks + recent activity; action-oriented |
| **Admin panel** | "Manage records and settings" | admins, internal staff | on demand | tables, search, bulk actions; it is CRUD, not a dashboard |

- **Dashboards vs reports** [K, consistent with Few]: a dashboard *monitors* (fixed questions, glanceable, current); a report *explains* (narrative, scrollable, point-in-time, exportable); an exploration tool *answers new questions* (query builder, notebook). PostHog makes the same split: dashboards track common metrics over time; notebooks are for ad hoc analysis [P: PostHog dashboards.mdx]. **Rule:** don't put exploration controls on a monitoring dashboard; link to them.

## B2. Foundational principles (with sources)

1. **Shneiderman's Visual Information-Seeking Mantra** (1996): "Overview first, zoom and filter, then details-on-demand"; the paper adds relate, history and extract as further tasks [S: https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf].
   - Dashboard translation: KPI row + trend (overview) → date range, filters, segment click (zoom/filter) → tooltip, row expansion, drill-down page (details) → "compare periods" (relate) → URL-persisted state and back button (history) → CSV/export/share (extract).
2. **Few's 13 common pitfalls** [S: https://www.perceptualedge.com/articles/Whitepapers/Common_Pitfalls.pdf]: exceeding a single screen; inadequate context for the data; excessive detail or precision; choosing a deficient measure; inappropriate display media; meaningless variety; poorly designed display media; encoding quantitative data inaccurately; arranging data poorly; highlighting important data ineffectively (or not at all); cluttering with useless decoration; misusing/overusing colour; an unattractive display. (Search summary listed 10 of them; the remaining items are from the same paper as commonly cited — verify exact wording before quoting.)
3. **Gauges and meters are inefficient**: they show too little in too much space with decoration; Few designed the **bullet graph** to replace them (one primary measure as a bar, a target marker, and 2–5 qualitative range bands in greyscale) [S: https://en.wikipedia.org/wiki/Bullet_graph].
4. **Tufte**: maximise the **data-ink ratio** (share of ink that encodes data; erase non-data and redundant data ink) [S: https://jtr13.github.io/cc19/tuftes-principles-of-data-ink.html]; **sparklines** are "data-intense, design-simple, word-sized graphics" with no frames or tick marks [S: https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/]; **small multiples** (same chart repeated per segment on shared axes) beat one overloaded chart with many series [S].
5. **Context turns numbers into information**: every KPI needs a comparison (previous period, target, same period last year) and a direction-of-good cue. Few's "inadequate context" pitfall [S]; Stripe's home shows the comparison under each number [S: https://www.925studios.co/blog/stripe-dashboard-design-breakdown — design-agency breakdown, treat as secondary].
6. **Don't show more precision than the decision needs** (Few: excessive detail or precision) [S]. `$1,234,567.89` → `$1.23M` on a card; exact value in the tooltip/table.
7. **Start from questions and decisions**, not available data (F-web §3.12; A2 §4.7: "What do I do now?").

## B3. Choosing KPIs

- **Actionable vs vanity** (Eric Ries' term; see A2 §4.5 table). A metric belongs on a dashboard only if a change in it would change what someone does this week [K].
- **Test each tile** with four questions [K]:
  1. Who looks at this, and how often?
  2. What decision does it inform? (If none → remove or move to a report.)
  3. What is "good"? (target, threshold, or comparison baseline)
  4. What do they click next? (drill-down or action link)
- **Limit**: 3–5 headline KPIs (F-web §3.12). One North Star metric may be visually dominant.
- **Pair metrics** to avoid gaming: volume with quality (signups + activation rate; tickets closed + CSAT; deploys + change-failure rate) [K].
- **Ratios over raw counts** when population size varies (conversion rate, error rate per 1k requests) [K].
- **Leading + lagging**: pair an outcome (MRR) with a leading indicator (trials started, activation rate) [K].
- **Define every metric** in a tooltip or "ⓘ" (definition, formula, source, freshness); Plausible links each metric to a metric-definitions page [P: plausible docs metrics-definitions.md, guided-tour.md].
- KPI shortlists by product type are in A2 §4.7.

## B4. Layout

### B4.1 Rules
- **Reading order = priority order**: most important top-left (F/Z scanning in LTR; mirror for RTL) [A2 §4.7; F-web §3.12].
- **Three bands** (Shneiderman in space): KPI row → primary trend chart (full width) → breakdowns (2–3 columns of ranked lists/tables) → detail table [K; matches shadcn dashboard-01 and Plausible].
- **Grid of cards on a 12-column grid**; equal-height cards per row; consistent internal padding (16–24px); container queries so a card reflows by its own width, not the viewport (shadcn cards use `@container/card` and the main area uses `@container/main` with 1 → 2 → 4 KPI columns) [P: shadcn `section-cards.tsx`, `page.tsx`].
- **Group by business question** (acquisition, activation, revenue), not by chart type [A2 §4.7].
- **One global time range and filter bar** (top right or top of content), applying to every tile; tiles that ignore it must say so. PostHog: tile-level overrides take precedence and the card shows a warning/indicator ("Ignores dashboard filters") [P: PostHog dashboards.mdx].
- **Consistent units and ranges**: same time range, same currency, same timezone across tiles; label timezone once ("All times UTC−3") [K].
- **Incomplete periods are marked**: Plausible draws a dotted line for the current, incomplete day/week/month [P: plausible guided-tour.md]. Otherwise "today" looks like a crash.
- **Mobile**: tiles stack to one column in desktop order (PostHog does exactly this; layout editing only on wide viewports) [P]. On phones, show the KPI row + one chart + "View details"; don't shrink a 4-column dashboard.

### B4.2 ASCII — product home dashboard (SaaS)
```
┌─ Home ─────────────────────────────── [Last 30 days ▾] [vs previous ▾] [Filter] ┐
│ ┌ MRR ─────────┐ ┌ Active accounts ┐ ┌ Activation rate ┐ ┌ Churned MRR ────┐   │
│ │ $48.2k       │ │ 1,284           │ │ 31.4%           │ │ $1.9k           │   │
│ │ ▲ 6.1% vs    │ │ ▲ 3.2%          │ │ ▼ 2.3 pts       │ │ ▲ 18% (bad)     │   │
│ │ prev 30d  ⌇⌇ │ │            ⌇⌇⌇  │ │ target 35%  ▭▭▮ │ │ 3 accounts →    │   │
│ └──────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│ ┌ MRR trend ── this period ─ previous (dashed) ──────────────────────────────┐ │
│ │     ___/‾‾‾\___/‾‾‾‾‾‾‾\__/‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\___/‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾┈┈ (today)│ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│ ┌ Needs attention ──────────┐ ┌ Top plans ──────────┐ ┌ Recent activity ─────┐│
│ │ ● 3 failed payments  [Fix]│ │ Pro      ████████ 62│ │ Acme upgraded · 2m   ││
│ │ ● 2 trials end tomorrow   │ │ Team     █████    31│ │ Beta Co invited 4 ·1h││
│ │ ● 1 dispute  [Respond]    │ │ Starter  ██        7│ │ …          View all →││
│ └───────────────────────────┘ └─────────────────────┘ └──────────────────────┘│
│ ┌ Accounts (table: name · plan · MRR · health · last seen)  [Export]         ┐ │
└──────────────────────────────────────────────────────────────────────────────────┘
```
Notes: "▲ 18% (bad)" — direction colour follows *meaning* (churn up = red), not arrow direction; always pair colour with an arrow/sign and text.

### B4.3 ASCII — operational dashboard (status wall)
```
┌ Payments — live ● updated 12s ago ─────────────────────── [Pause] [Last 1h ▾] ┐
│ Status: ● Degraded — card auth latency p95 1.8s (SLO 1.0s)   [Open incident]   │
│ ┌ Success rate ─┐ ┌ p95 latency ─┐ ┌ Error rate ──┐ ┌ Queue depth ─┐           │
│ │ 97.2% ▼0.9pt │ │ 1.8s ▲ SLO!  │ │ 0.8% ▲       │ │ 214 ▲        │           │
│ │ ▭▭▭▭▭▭▭▮▭ tgt│ │ ⌇⌇⌇⌇⌇⌇⌇⌇⌇▲  │ │ ⌇⌇⌇⌇⌇⌇⌇⌇▲    │ │ ⌇⌇⌇⌇⌇⌇⌇▲     │           │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
│ Small multiples: latency by region  [us-east ⌇⌇⌇] [eu-west ⌇⌇⌇▲] [ap-south ⌇⌇]  │
│ Recent errors (table, newest first, click → trace)                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### B4.4 ASCII — analytics (Plausible-style single page)
```
[site ▾]  [Filter +]  source = Newsletter ✕                [Last 28 days ▾] [Compare ▾]
Unique visitors | Visits | Pageviews | Views/visit | Bounce rate | Visit duration  ← click = chart metric
[ big line chart, comparison as second line, dotted current period ]
┌ Top sources ── Channels | Sources | Campaigns ┐ ┌ Top pages ── Top | Entry | Exit ┐
│ ranked bar list, click row = filter  [⤢]      │ │ ranked bar list  [⤢]            │
┌ Locations ── Map | Countries | Regions ───────┐ ┌ Devices ── Browser | OS | Size ─┐
┌ Goals | Properties | Funnels | Explore ───────────────────────────────────────────┐
```
Source: Plausible docs guided tour — top graph with clickable metrics, date picker top right, click any report row to filter, expand icon per section for the full list, sort by metric headers, site switcher at top left [P].

## B5. Chart selection (dashboard subset)

| Question | Use | Avoid | Why |
|---|---|---|---|
| Change over time | Line (area only for a single series or a part-to-whole total) | Bar for >~30 points; 3D | Position on a common scale is most accurate (NN/g preattentive article) [S] |
| Compare categories | Horizontal bar, sorted; **ranked bar list** (label + value + bar) | Pie with >4–5 slices; donut as KPI decoration | Length beats angle/area [S: NN/g] |
| Part-to-whole (few parts) | Stacked bar (100%), single horizontal "category bar" | Pie with similar-sized slices | [K]; Tremor ships `CategoryBar` [P] |
| Actual vs target | **Bullet graph**, progress bar with target marker | Gauge / speedometer | Few [S] |
| KPI trend in a card | Sparkline (no axes) + delta | Full chart per KPI card | Tufte [S] |
| Many segments' trends | Small multiples with shared y-axis | 10-line spaghetti chart | Tufte [S] |
| Distribution | Histogram, box plot | Average only | [K] |
| Funnel | Horizontal bars with step conversion % | Trapezoid "funnel" graphics | [K]; Tremor `FunnelChart` [P] |
| Uptime / status history | Tracker (row of coloured blocks) with text | Colour-only status | Tremor `Tracker` [P] |
| Correlation | Scatter | Dual-axis line charts | [K] (F-web §3.12) |
| Exact lookups | Table | Chart with every label | [K] |

**Tremor component vocabulary** (Apache-2.0, tremorlabs/tremor-npm) [P]: charts `AreaChart, BarChart, LineChart, DonutChart, ScatterChart, FunnelChart`; spark `SparkAreaChart, SparkBarChart, SparkLineChart`; vis `BarList, CategoryBar, DeltaBar, MarkerBar, ProgressBar, ProgressCircle, Tracker`; text `Metric, Title, Subtitle, Legend, Callout`; icons `BadgeDelta`; inputs `DateRangePicker, DatePicker, MultiSelect, SearchSelect, Tabs`. Useful as a naming checklist of dashboard primitives even if not used.
**shadcn charts** wrap Recharts; `accessibilityLayer` prop adds keyboard access and screen-reader support [P: shadcn chart.mdx].

## B6. Numbers and formatting

- **Tabular numerals** (`font-variant-numeric: tabular-nums`) for all figures in cards and tables (shadcn KPI titles use `tabular-nums`) [P]; right-align numbers in tables (F-web checklist).
- **Compact notation on cards**, full precision in tooltip/table: `Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 })` → "48.2K" [K: ECMA-402 standard API].
- **Percent vs percentage points**: a rate going 33.7% → 31.4% is "−2.3 pts", not "−6.8%"; label which you mean [K].
- **Deltas**: sign + arrow + colour + comparison label ("▲ 6.1% vs previous 30 days"). Colour by *good/bad*, not up/down (Tremor `BadgeDelta` takes `deltaType` = increase / moderateIncrease / unchanged / moderateDecrease / decrease plus an `isIncreasePositive` prop, default `true`, that flips the colour mapping for "up is bad" metrics like churn or latency) [P: tremor-npm src/components/icon-elements/BadgeDelta, src/lib/utils.tsx].
- **Division by zero / tiny bases**: show "—" or "new" instead of "+∞%" or "+900%" from 1 → 10 [K].
- **Currency and locale**: format with the account's currency and locale; don't mix currencies in a sum without conversion note [K].
- **Units in labels**, not in every value ("Latency (ms)") [K].
- **Time**: relative for freshness ("updated 12s ago"), absolute on hover; state the timezone [K].
- **Rounding consistency**: same decimals across a row of KPI cards [K].

## B7. States per widget (never a blank tile)

Each tile is its own mini-app with independent states (extends the 5 UI states in B-ux §3.3):

| State | Tile shows | Notes |
|---|---|---|
| **Loading** | Skeleton matching the final chart shape and size | Load tiles independently; never block the page on the slowest query [K]; skeletons must match final layout (F-web) |
| **Empty – not set up** | What this tile will show + CTA ("Install the snippet to see visitors") + optional sample preview | onboarding surface (Part A) |
| **Empty – no data in range** | "No signups in the last 7 days" + "Try last 30 days" | distinguish from broken |
| **Empty – filtered out** | "No results for source = Newsletter" + "Clear filter" | |
| **Partial** | Data + banner "Stripe sync 60% complete" or "Data delayed ~2h" | |
| **Stale** | Last-updated time turns amber past SLA | operational dashboards |
| **Error** | Tile-level error with retry; the rest of the page still works | never a page-level crash for one query |
| **Permission-limited** | "Ask an admin for access to revenue" | role-based dashboards |
| **Ideal** | Chart + delta + definition tooltip + drill link | |

## B8. Time ranges, comparison and filters

- **Presets first, custom last**: Today, Yesterday, Last 7 / 28 / 30 / 91 days, Month to date, Last month, Year to date, Last 12 months, All time, Custom (Plausible's preset list, each with a single-key shortcut) [P: plausible keyboard-shortcuts.md]. shadcn's dashboard example uses a 7d / 30d / 90d toggle group on desktop and a select on narrow widths [P: `chart-area-interactive.tsx`].
- **Prev/next period arrows** (← →) to step through periods [P: Plausible].
- **Comparison modes**: previous period, year over year, custom; **match day of week** to avoid weekday/weekend skew [P: plausible compare-stats.md]. Comparison shows up in KPI cards (% change with arrows), the main chart (second line), tables (hover) and funnels [P].
- **Complete vs incomplete periods**: default to ranges that exclude the current partial day, or mark it (Plausible excludes the current day except in "to date" and "all time" ranges) [P].
- **Filters as chips** with "is / is not / contains", clearable individually and all at once (Esc clears all in Plausible) [P].
- **Click-to-filter**: clicking a row in any breakdown filters the whole dashboard (Plausible) — the cheapest drill-down there is [P].
- **URL is the state**: date range, comparison, filters and segment in query params so views are shareable and the back button works (PostHog persists folder filters as `?folder=`) [P; K].
- **Saved views / segments** for repeated filter combinations [P: Plausible segments; PostHog].
- **Annotations** for deploys, campaigns, outages on time-series charts so changes have context (Plausible supports chart annotations) [P].
- **Interval control** (minute/hour/day/week/month) constrained by range (Plausible: "Today" → minute/hour; wider ranges → day/week/month) [P].

## B9. Drill-down and details on demand

- Levels: KPI card → filtered trend → breakdown list → record table → single record [K; Shneiderman].
- Every KPI card is a link to its detail view with the same filters applied [K].
- **Expand in place** for long lists (Plausible's expand icon opens the full list with extra metrics and sortable columns) [P].
- **Tooltips**: value, comparison value, % change and the exact date/bucket (Plausible shows both periods and % change on hover) [P].
- **Breadcrumb of the drill path** (`Revenue › Plan: Pro › Country: BR`) with each crumb clickable [K].
- **Action next to the insight**: "3 failed payments → Retry" (A2 §4.7: fix action beside the red number).

## B10. Real-time vs refresh

- **Match refresh to decision speed**: operational = live/near-live; analytical = on load + manual refresh; strategic = daily snapshot [K].
- Plausible's realtime view: "current visitors" = last 5 minutes; pageview graph for last 30 min, updated every 30 s without manual refresh [P: plausible guided-tour.md, realtime-dashboard.md].
- Always show **"Updated Xs ago"** and a manual refresh; show a **Pause** on live views so numbers don't move while someone reads them [K].
- Animate value changes subtly or not at all; never re-layout on update (no CLS) [K; F-web].
- Batch updates (e.g. every 10–30 s) instead of per-event re-renders; throttle when the tab is hidden (`document.visibilityState`) [K].
- Announce only important changes to assistive tech (polite live region for status changes, not every tick) [K; WCAG 4.1.3 in F-web].

## B11. Customisation, roles and "which dashboard is this?"

- **Defaults beat customisation**: most users never change defaults, so ship an opinionated default per role; customisation is for power users [S/U: https://www.925studios.co/blog/saas-dashboard-design-examples-2026 — agency blog; the "42% engagement lift" figure seen in search is **unverified**, don't use].
- Why user-built dashboards fail [K]: blank-canvas problem; tiles with inconsistent ranges; nobody owns them; they rot as metrics change; they sprawl (50 dashboards named "Copy of…").
- **Mitigations**: start from **templates** (PostHog ships built-in templates, team/org-scoped templates and "save as template") [P]; AI starter prompts in the empty dashboard [P: PostHog]; folders and owners; "last viewed" to archive unused ones [K]; one reused insight on many dashboards rather than copies (PostHog: insights can appear on multiple dashboards) [P].
- **Customisation ladder** (cheapest first) [K]: choose date range → pin/favourite → reorder/hide tiles → pick from a tile library → full builder. Stripe's home lets users pick from a library of chart widgets rather than build from scratch [S: https://support.stripe.com/questions/dashboard-home-charts-overview — search summary says 35+ widgets; unverified count].
- **Role-based dashboards**: different default home per role (seller vs admin vs finance); hide what a role can't act on; show permission-limited state rather than silently missing tiles [K].
- **Home vs analytics vs admin**: Home = personal + actionable ("your tasks, what changed, next step"); Analytics = shared exploration with filters; Admin = tables + bulk actions + audit log. Don't make the home page an analytics wall [K].

## B12. Performance architecture

- **One query per tile, loaded in parallel**, each with its own loading/error state; never a single mega-query that fails the page [K].
- **Stream the page**: render shell + KPI skeletons immediately; KPI row first (smallest queries), charts next, tables last [K].
- **Pre-aggregate** (rollup tables / materialised views by day/hour and main dimensions); query raw events only for drill-down [K].
- **Cache by (query, filters, range, tenant)** with TTL tied to the data's freshness SLA; show the cache time ("Updated 3 min ago") and allow forced refresh (rate-limited) [K].
- **Limit cardinality**: top-N + "Other" for breakdowns; paginate tables server-side [K].
- **Downsample time series** to what the chart can show (≈ one point per 2–4 horizontal pixels) [K].
- **Timeouts per tile** with partial results rather than spinner-forever [K].
- **Multi-tenant safety**: every tile query scoped by tenant ID server-side; never trust a client-supplied tenant in filters [K].
- **Exports** run as background jobs for large ranges, with a notification when ready [K].

## B13. Chart accessibility

- Charts are **complex images**: provide a short text alternative (what the chart is) *and* a long description / data table with the essential information [S: https://www.w3.org/WAI/tutorials/images/complex/].
- Offer a **"View as table"** toggle per chart; it doubles as the export source [K; W3C approach].
- Put the takeaway in the tile title or subtitle ("Signups up 12% since launch"), so the insight exists in text [K].
- **Don't rely on colour**: direct labels, patterns/markers, arrows + signs for deltas; colour-blind-safe palette; 3:1 contrast for chart marks against background (WCAG 1.4.11, F-web) [K].
- **Keyboard**: focusable data points or a focusable table; tooltips reachable by focus, dismissible with Esc (WCAG 1.4.13) [K]; shadcn/Recharts `accessibilityLayer` adds keyboard + screen-reader support [P].
- **Motion**: respect `prefers-reduced-motion` for chart animations [K].
- **Status colours** (red/amber/green) always paired with text ("Degraded") [K].
- Use the repo's `dataviz` guidance for palette/tokens (a dataviz skill exists in this environment; do not duplicate — reference).

## B14. Case studies (what to copy)

| Product | What to copy | Source |
|---|---|---|
| **Plausible** | One page, no sub-menus, all stats filterable by clicking; clickable top metrics switch the main chart; comparison modes with day-of-week matching; dotted incomplete period; single-key shortcuts for ranges; realtime at 30 s refresh; expand-in-place lists | [P: plausible/docs repo guided-tour.md, compare-stats.md, keyboard-shortcuts.md] |
| **Stripe Dashboard home** | Few money numbers with period comparison right under each, sparklines, widget library instead of blank builder; actionable items (disputes, failed payments) surfaced | [S: support.stripe.com dashboard-home-charts; 925studios breakdown (secondary)] |
| **PostHog** | Templates (official/team/org), AI starter prompts in empty dashboards, global date/filters with explicit tile overrides + visible indicators, insights reused across dashboards, single-column stacking on small screens, URL-persisted filters | [P: PostHog/posthog.com dashboards.mdx] |
| **Linear** | Pre-populated demo workspace modelling good practice; ⌘K taught during onboarding as the primary interaction model; keyboard-first | [S: https://www.candu.ai/blog/linear-onboarding-teardown ; https://supademo.com/user-flow-examples/linear] |
| **shadcn/ui dashboard-01** | Reference composition: sidebar + sticky site header + KPI cards (value, delta badge, one-line interpretation "Acquisition needs attention") + interactive area chart with 7d/30d/90d + data table | [P: shadcn apps/v4 examples/dashboard] |
| **Vercel / Supabase** | Template → repo → deploy → env vars injected: first success before configuration | [S: vercel docs] |

Note the shadcn KPI card pattern worth copying verbatim as structure (MIT): label (`CardDescription`) → value (`CardTitle`, tabular-nums) → delta badge (`CardAction`) → footer line with interpretation + context ("Down 20% this period" / "Acquisition needs attention") [P].

## B15. Dashboard anti-patterns

| Anti-pattern | Fix | Source |
|---|---|---|
| **Wall of charts** (every metric we can compute) | 3–5 KPIs; move the rest to reports/exploration | Few pitfall "exceeding a single screen" [S] |
| **Vanity metrics** (total signups all-time, page views) | Rates, cohorts, activation; pair volume with quality | A2 §4.5; [K] |
| **Numbers without context** | Comparison + target + definition | Few [S] |
| **Gauges, speedometers, 3D, gradients** | Bullet graphs, bars, sparklines | Few [S] |
| **Pie/donut abuse** (many slices, multiple pies to compare) | Sorted bar / bar list | NN/g preattentive [S] |
| **Rainbow categorical colours, red/green only** | Neutral base + one highlight colour; CB-safe palette | Few "misusing colour" [S]; [K] |
| **Meaningless variety** (a different chart type per tile "for interest") | Same chart type for same kind of question | Few [S] |
| **Dual y-axes** | Two aligned charts or indexed values | [K] |
| **Mixed time ranges / timezones across tiles** | One global range; per-tile override visibly flagged | PostHog [P] |
| **False precision** (`31.4159%`) | Round to decision precision | Few [S] |
| **Page blocked by slowest query** | Per-tile loading/error | [K] |
| **Blank dashboard for new users** | Sample data/template/starter prompts | Part A |
| **Customisable-only dashboard (no defaults)** | Opinionated role default + templates | [K] |
| **Auto-refresh that moves content while reading** | "Updated Xs ago", pause, no layout shift | [K] |

## B16. Dashboard checklist (agent self-check)

- [ ] Dashboard type named (operational / analytical / strategic / home / admin) and the one question it answers written in the header or spec.
- [ ] 3–5 KPIs, each with comparison, target or threshold, definition tooltip, and a drill link.
- [ ] Layout: KPI row → main trend → breakdowns → table; priority top-left; groups by question.
- [ ] One global date range + comparison + filters, persisted in the URL; per-tile overrides flagged.
- [ ] Incomplete current period marked or excluded.
- [ ] Chart types chosen by question (B5); no gauges/3D/pies >5 slices/dual axes.
- [ ] Numbers: tabular figures, compact on cards, exact in tooltip, pts vs %, colour by meaning with sign + arrow.
- [ ] Every tile has loading, empty (3 kinds), partial, stale, error and permission states.
- [ ] Tiles load independently; queries pre-aggregated and cached with visible freshness.
- [ ] Accessible: text takeaway, table view, keyboard, not colour-only, reduced motion.
- [ ] Mobile: single-column stack in priority order; KPI + one chart first.
- [ ] Defaults per role; templates before blank builder.

---

# PART C — APP SHELL AND NAVIGATION (2026)

## C1. Shell anatomy

```
┌───────────────┬────────────────────────────────────────────────────────────────┐
│ [Acme ▾]      │ ☰  Projects › Website relaunch › Settings     ⌘K Search  🔔  (?)│  ← header: trigger, breadcrumb,
│ workspace sw. │────────────────────────────────────────────────────────────────│    search/⌘K, notifications, help
│ ⌘K  Search    │  Page title                                   [Secondary] [Primary]
│ ⌂  Home       │  Tabs: Overview | Activity | Settings                          │
│ ✓  My issues 3│                                                                │
│───────────────│  content (fluid; max width for prose/forms; full for tables)   │
│ WORKSPACE     │                                                                │
│ ▣ Projects    │                                                                │
│ ◷ Cycles      │                                                                │
│ ▤ Insights    │                                                                │
│───────────────│                                                                │
│ FAVORITES     │                                                                │
│ ★ Q3 roadmap  │                                                                │
│───────────────│                                                                │
│ + Invite      │                                                                │
│ ⚙ Settings    │                                                                │
│ (SM) Sam ▾    │  ← account menu: profile, theme, shortcuts, what's new, sign out
└───────────────┴────────────────────────────────────────────────────────────────┘
```

**shadcn/ui Sidebar as reference implementation** [P: shadcn apps/v4 content/docs/components/radix/sidebar.mdx; registry/bases/*/ui/sidebar.tsx]:
- Parts: `SidebarProvider` (state/context) → `Sidebar` → `SidebarHeader` (sticky; "branding, titles, or workspace switchers") → `SidebarContent` (scrollable; contains `SidebarGroup`s with optional label/action) → `SidebarMenu`/`SidebarMenuItem`/`SidebarMenuButton`/`SidebarMenuAction`/`SidebarMenuBadge`/`SidebarMenuSub`/`SidebarMenuSkeleton` → `SidebarFooter` (sticky; "user menus, settings, or actions") → `SidebarRail` (resize/toggle handle); main content in `SidebarInset`; `SidebarTrigger` toggles.
- `variant`: `sidebar` | `floating` | `inset`. `collapsible`: `offcanvas` (slides away) | `icon` (collapses to icons) | `none`.
- Defaults: width `16rem`, mobile width `18rem`, icon-collapsed width `3rem`; keyboard toggle **⌘B / Ctrl+B**; open state persisted in a `sidebar_state` cookie for 7 days (so SSR renders the right state without flash); mobile breakpoint 768px, below which the sidebar renders in a `Sheet` (drawer) [P].
- Blocks library (MIT) covers: grouped sections, collapsible sections, submenus, floating, collapsible submenus, submenus as dropdowns, collapse-to-icons, inset with secondary nav, collapsible nested sidebars, sidebar in popover/dialog, file tree, calendar, right sidebar, left+right sidebars, sticky site header; plus `dashboard-01` ("A dashboard with sidebar, charts and data table") [P: registry/new-york-v4/blocks/_registry.ts].

## C2. Navigation choice

- **Left vertical nav** scales to broad/growing IAs and suits complex apps, admin and content-management products; it costs horizontal space [S: https://www.nngroup.com/articles/vertical-nav/].
- **Icon-only collapsed sidebars** are a compromise acceptable for daily-use apps where users learn icons; not for occasionally used sites; icon-only strains memory, so always provide tooltips and an easy expand [S: NN/g vertical-nav; https://www.nngroup.com/articles/icon-usability/].
- **Top nav** fits ≤5–7 peer sections with short labels and marketing-like or content products [K; F-web: sidebar for ≥5 top-level areas].
- **Hamburger on desktop** hides navigation and reduces discoverability [S: https://www.nngroup.com/articles/find-navigation-desktop-not-hamburger/].
- **Tabs** for peer views of one object; **breadcrumbs** for depth (≥3 levels) and for drill paths; **sheets/drawers** for focused subtasks; **modals** only for blocking decisions (F-web §app UI).

**Sidebar content rules** [K unless noted]:
- Order: workspace switcher → search/⌘K → personal items (Home, Inbox, My work) → workspace sections → favourites/pinned → footer (invite, settings, help, account).
- 5–9 top-level items; group with small uppercase labels; collapse long groups; show counts/badges only when actionable ("3" unread), not totals.
- Active item: visible background + `aria-current="page"`; keep label text weight stable to avoid shift.
- Favourites/pins are user-controlled; recent items optional.
- **Workspace/org switcher** at top-left (Linear, Notion, Vercel, Slack pattern; shadcn documents the header as the place for workspace switchers [P]); shows current workspace name + avatar, keyboard shortcuts for switching (Plausible uses 1–9 to switch pinned sites [P]), "Create workspace" at the bottom.
- Make the switcher obviously a switcher (chevron); show environment clearly (Test mode / Staging banner) — Stripe's test-mode indicator is the canonical example [S: stripe.dev sandboxes blog].

## C3. Command palette (⌘K) and search

- Principles [S: https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/ ; https://www.setproduct.com/blog/command-palette-ui-design-guide]:
  1. **Available everywhere** with the same shortcut (Superhuman's rule #1).
  2. **Teaches shortcuts**: each command shows its keyboard shortcut so users learn it for next time (Superhuman).
  3. **Complements, never replaces, visible navigation** — palette is the fast path; menus remain for discovery.
  4. **Grouped, ranked, scoped**: groups (Navigation, Actions, Recent, Help), recents first when empty, context-aware commands for the current object first.
  5. **Nested pages** for multi-step commands ("Change status" → list of statuses, Backspace goes back; Linear) [S].
  6. **Fuzzy matching + synonyms** ("delete" finds "Archive"; "dark" finds "Theme") [K].
  7. **Platform-correct hint**: ⌘K on macOS, Ctrl+K elsewhere; never hard-code ⌘ for Windows users [S].
- Linear teaches ⌘K during onboarding as the model for how the product works [S: candu teardown].
- **Accessibility**: dialog with focus trapped, combobox + listbox semantics (`role="combobox"`, `aria-activedescendant`), results announced, Esc closes and returns focus [K; WAI-ARIA APG combobox pattern].
- **Search vs palette**: global search finds *content* (records, docs) and can live in the palette as a group; for large data, a dedicated search results page with filters is still needed [K].
- Implementation references: `cmdk` (used by shadcn `Command`) [K]; PostHog documents its own ⌘K [S: https://posthog.com/docs/cmd-k].

## C4. Header, breadcrumbs, notifications, account menu, help

- **Header** (≈48–56px): sidebar trigger, breadcrumb/page title, search/⌘K, notifications, help; primary page actions belong in the page header, not the global header [K]. shadcn dashboard example sets a `--header-height` and sticky site header block [P].
- **Breadcrumbs**: show hierarchy, not history; last crumb is the current page (not a link); truncate middle crumbs with "…" menu on narrow screens [K].
- **Notifications centre** [K]:
  - Bell with unread count (cap "9+"), panel with tabs *Inbox / Mentions / All* or *Unread / All*; "Mark all as read".
  - Each item: actor, action, object, time, and a direct link; group bursts ("Maya and 3 others commented").
  - Per-type preferences (in-app / email / push) in Settings, linked from the panel.
  - Don't use the bell for marketing; "What's new" goes in the help menu (A7).
- **Account menu** (bottom-left in sidebar or top-right avatar): name/email, profile, preferences (theme, density, language), keyboard shortcuts, what's new, help/docs, switch account, sign out (last, separated) [K; shadcn footer = "user menus" P].
- **Help menu**: docs, shortcuts (often `?`), contact support, status page, changelog [K].

## C5. Settings layout

- Two-level: **Account/Personal** (profile, notifications, security, appearance) vs **Workspace/Organisation** (general, members, roles, billing, integrations, API keys, security/SSO, audit log, danger zone) [K; common across Linear/Vercel/Stripe-style products].
- Layout: settings sidebar (or left sub-nav) + content column with max width ~640–720px for forms; sections as cards with a title, description, controls and a per-section Save (or autosave with confirmation toast) [K].
- **Danger zone** last, red-outlined, typed confirmation for destructive actions (type the workspace name) [K].
- Deep links for every settings page (`/settings/members`) so support and onboarding emails can link directly [K].
- Show plan/permission gates inline ("SAML SSO is on the Business plan — Compare plans") rather than hiding the page [K; A2 §4.6].

## C6. Responsive shell

- ≥1280px: expanded sidebar (240–280px, F-web) + optional right inspector (320–400px).
- 768–1279px: sidebar collapsed to icons with tooltips, or offcanvas; inspector as overlay sheet [K].
- <768px: sidebar in a drawer/sheet opened by a header button (shadcn switches to `Sheet` under 768px) [P]; for consumer-grade mobile use, a bottom tab bar with 3–5 destinations is better than a drawer (D-mobile) [K].
- Keep the same IA across breakpoints; don't drop sections on mobile — reachable via drawer or "More" [K].
- Persist collapse state per user (shadcn: cookie) and restore it without flash (SSR reads cookie) [P].
- Use `100dvh`/`svh` for full-height shells to avoid mobile browser chrome jumps (shadcn uses `min-h-svh`) [P].

## C7. Density and keyboard

- Offer **comfortable / compact** density for data-heavy apps (F-web §3.11 row heights 32/40/48–56px) [K].
- Keyboard map: `⌘K` palette, `⌘B` sidebar (shadcn default) [P], `/` focus search (Plausible uses `/` for search [P]), `?` shortcut sheet, `G then X` go-to sequences (Linear/GitHub style) [K], `Esc` clears filters/closes (Plausible) [P].
- Never override browser/OS shortcuts users rely on (⌘L, ⌘T, ⌘W) [K].
- Shortcuts shown in tooltips and in the palette (teaching) [S: Superhuman].

## C8. App shell checklist

- [ ] Sidebar for ≥5 areas; top nav only for small flat IAs; no desktop hamburger.
- [ ] Workspace switcher top-left; environment (test/staging) unmistakable.
- [ ] ⌘K palette available everywhere, grouped, shows shortcuts, platform-correct hint, accessible combobox.
- [ ] Breadcrumbs for depth; page title + primary action in page header.
- [ ] Notifications with actionable items only; preferences linked.
- [ ] Account menu with theme/density/shortcuts/what's new/sign out.
- [ ] Settings split personal vs workspace; deep-linkable; danger zone last.
- [ ] Responsive: icons at tablet, drawer on phone; state persisted without flash.
- [ ] Active nav state with `aria-current`; skip link to main content; landmarks (`nav`, `main`, `header`).

---

# PART D — Suggested skill mapping

- **`product-onboarding`** (new skill or a large reference in the UX/product skill): A1–A8. References: `blueprints.md` (A5), `patterns-and-anti-patterns.md` (A3–A4), `measurement.md` (A6), `feature-adoption.md` (A7). Evals: "design onboarding for a B2B analytics tool", "our mobile app asks for notifications on first launch — fix", "developer API getting-started page", "AI assistant first run".
- **`dashboard-design`**: B1–B16 + references `layouts.md` (ASCII sketches), `chart-selection.md`, `widget-states.md`, `performance.md`. Link to the environment's `dataviz` guidance for palette only.
- **`app-shell-navigation`** (or a reference inside the web-design skill): C1–C8, using shadcn Sidebar + dashboard-01 as the default React reference.
- Router: onboarding ↔ empty states ↔ signup/forms (A2 §4.4) ↔ pricing/paywall (A2 §4.6) ↔ mobile permissions (D-mobile).

# PART E — Open items / to verify before shipping figures

1. Chameleon tour completion figures: confirm in the current report (72% 3-step; 16% 7-step) — the 2019 PDF is the origin.
2. RevenueCat hard-paywall vs freemium metric definition (download → paid within what window?).
3. Duolingo "+20% DAU from delayed signup" — find a Duolingo primary (talk/blog) or drop.
4. NN/g claim that "narrower AI features are easier for new users" — find the NN/g article or drop attribution.
5. Few's 13 pitfalls — read the PDF for exact list wording before quoting.
6. Stripe "35+ widgets" count — unverified.
7. Lenny's median time-to-activation (10 days / mode 7) — seen only in summaries.

# Sources (by section)

**Onboarding**
- Apple HIG Onboarding [P]: https://developer.apple.com/design/human-interface-guidelines/onboarding (JSON: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/onboarding.json)
- Apple HIG Launching [P]: https://developer.apple.com/design/human-interface-guidelines/launching
- Android — Authentication & Onboarding (last updated 2026-05-19) [P]: https://developer.android.com/design/ui/mobile/guides/patterns/onboarding
- NN/g Mobile-App Onboarding [S]: https://www.nngroup.com/articles/mobile-app-onboarding/
- NN/g Mobile Tutorials (deck-of-cards study) [S]: https://www.nngroup.com/articles/mobile-tutorials/
- NN/g Onboarding Tutorials vs. Contextual Help [S]: https://www.nngroup.com/articles/onboarding-tutorials/
- NN/g Onboarding: Skip it When Possible [S]: https://www.nngroup.com/videos/onboarding-skip-it-when-possible/
- Reforge setup moment / aha moment [S]: https://www.reforge.com/guides/define-your-setup-moment ; https://www.reforge.com/c/retention-series-eg/activation/aha-moment
- Lenny Rachitsky, What is a good activation rate [S]: https://www.lennysnewsletter.com/p/what-is-a-good-activation-rate
- Samuel Hulick [S]: https://www.fastcompany.com/3025484/why-people-dont-buy-products-they-buy-better-versions-of-themselves ; https://www.intercom.com/blog/podcasts/podcast-samuel-hulick-onboarding/
- Wes Bush bowling alley [S]: https://productled.com/blog/user-onboarding-framework ; https://www.productboard.com/blog/a-battle-tested-product-onboarding-framework-from-wes-bush/
- Userpilot checklist benchmark [V]: https://userpilot.com/blog/onboarding-checklist-completion-rate-benchmarks/
- Chameleon benchmarks [V]: https://www.chameleon.io/benchmark-report-2023 ; https://www.chameleon.io/assets/chameleon-product-tour-benchmarks-report-2019.pdf
- Pendo 2019 Feature Adoption Report [V]: https://www.pendo.io/resources/the-2019-feature-adoption-report/
- RevenueCat SOSA 2025/2026 [V]: https://www.revenuecat.com/state-of-subscription-apps-2025 ; https://www.revenuecat.com/state-of-subscription-apps
- Duolingo [S]: https://growth.design/case-studies/duolingo-user-retention ; https://goodux.appcues.com/blog/duolingo-user-onboarding
- Notion personalisation [S]: https://www.candu.ai/blog/how-notion-crafts-a-personalized-onboarding-experience-6-lessons-to-guide-new-users
- Headspace [S]: https://tearthemdown.substack.com/p/headspace
- Slack / Figma invites [S]: https://www.appcues.com/blog/slack-user-onboarding-experience ; https://userpilot.com/blog/slack-onboarding/
- Linear [S]: https://www.candu.ai/blog/linear-onboarding-teardown ; https://supademo.com/user-flow-examples/linear
- Stripe docs keys-in-snippets, sandboxes [S]: https://apidog.com/blog/stripe-docs/ ; https://stripe.dev/blog/avoiding-test-mode-tangles-with-stripe-sandboxes
- Vercel / Supabase [S]: https://vercel.com/docs/git/vercel-for-github ; https://supabase.com/partners/integrations/vercel
- Marketplace [S]: https://www.sharetribe.com/academy/onboard-initial-marketplace-supply/ ; https://www.journeyh.io/blog/marketplace-onboarding-marketplace-seller
- AI blank-prompt problem [S]: https://medium.com/design-bootcamp/the-blank-prompt-problem-why-ai-products-are-failing-their-first-session-5e74bcb00b09 ; https://productled.com/blog/ai-onboarding
- Feature announcements [S]: https://www.featurebase.app/blog/new-feature-announcement
- marketingskills onboarding (MIT) [P]: $SCRATCH/refs/coreyhaines31_marketingskills/skills/onboarding/

**Dashboards**
- Stephen Few, Common Pitfalls in Dashboard Design [S]: https://www.perceptualedge.com/articles/Whitepapers/Common_Pitfalls.pdf ; Why Most Dashboards Fail: https://www.perceptualedge.com/articles/misc/WhyMostDashboardsFail.pdf
- Bullet graph [S]: https://en.wikipedia.org/wiki/Bullet_graph
- Tufte sparklines [S]: https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/ ; data-ink: https://jtr13.github.io/cc19/tuftes-principles-of-data-ink.html
- Shneiderman 1996 [S]: https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf
- NN/g Dashboards: Making Charts and Graphs Easier to Understand (2017) [S]: https://www.nngroup.com/articles/dashboards-preattentive/
- Dashboard types [S]: https://www.idashboards.com/operational-analytical-and-strategic-the-three-types-of-dashboards/
- W3C WAI complex images [S]: https://www.w3.org/WAI/tutorials/images/complex/
- Plausible docs repo [P]: https://github.com/plausible/docs (docs/guided-tour.md, compare-stats.md, keyboard-shortcuts.md, realtime-dashboard.md)
- PostHog dashboards docs [P]: https://github.com/PostHog/posthog.com/blob/master/contents/docs/product-analytics/dashboards.mdx
- Stripe dashboard home [S]: https://support.stripe.com/questions/dashboard-home-charts-overview ; https://www.925studios.co/blog/stripe-dashboard-design-breakdown (secondary)
- Tremor (Apache-2.0) [P]: https://github.com/tremorlabs/tremor-npm
- shadcn/ui dashboard-01, chart accessibilityLayer (MIT) [P]: https://github.com/shadcn-ui/ui (apps/v4)

**App shell**
- shadcn/ui Sidebar docs + source [P]: https://ui.shadcn.com/docs/components/sidebar ; repo apps/v4/registry/bases/*/ui/sidebar.tsx
- NN/g Left-side vertical navigation [S]: https://www.nngroup.com/articles/vertical-nav/ ; hamburger on desktop: https://www.nngroup.com/articles/find-navigation-desktop-not-hamburger/ ; icon usability: https://www.nngroup.com/articles/icon-usability/
- Superhuman command palette [S]: https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/
- Command palette teardowns [S]: https://www.setproduct.com/blog/command-palette-ui-design-guide
- PostHog ⌘K [S]: https://posthog.com/docs/cmd-k
