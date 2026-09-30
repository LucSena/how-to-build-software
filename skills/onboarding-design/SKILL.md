---
name: onboarding-design
description: Use when designing, building, or fixing what a new user experiences between sign-up and real value — first run, activation, aha moment, time-to-value, empty accounts, welcome screens, setup wizards, onboarding checklists, product tours, tooltips, personalization questions, sample data and templates, team invites and the invited teammate's first run, mobile first launch and permission timing, paywall placement in onboarding, lifecycle nudges, re-onboarding, and feature announcements. Covers activation metrics (action, count, window), setup/aha/habit moments, pattern selection, blueprints for B2B SaaS, B2C mobile, developer tools/APIs, marketplaces, and AI products, measurement and event naming. Also use when the user says "users sign up but never come back", "add an onboarding tour", "our dashboard is empty for new users", "activation is low", "what should the first screen be", or "announce this new feature", even for one screen. For sign-up and login forms use auth-flows; for pricing pages and paywall design use conversion-ux; for iOS/Android permission mechanics use mobile-design.
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "conversion-ux auth-flows interaction-design ux-principles mobile-design dashboard-design"
---

# Onboarding Design

Onboarding is not a tour. It is the shortest honest path from sign-up to the user's first real result, and then to a habit. The best onboarding is a product that is usable without it (NN/g, Apple HIG); what remains is removing steps, filling empty screens with a way forward, and asking for things (account, data, permissions, money) only after the user has seen why. This skill starts from a measurable activation event and designs backwards from it, so the work is judged by retention, not by how many people clicked "Next".

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Then establish four facts: **the product shape** (B2B team product, B2C/mobile, developer tool/API, marketplace, AI product), **the core action** that delivers value, **whether value is visible without the user's own data**, and **whether value needs other people** (teammates, a counterparty). If retention data exists, get it; if not, say the activation event is a hypothesis.

## Core principles

1. **Define activation before designing screens.** Without `action ≥ N within T days`, every onboarding change is judged by taste.
2. **Reach a real result in the first session.** Slow users abandon first, so time-to-value is the lever that moves activation most.
3. **Teach by doing, in context (pull), not by telling up front (push).** NN/g found swipe-through tutorials did not improve task performance; people retain what they do.
4. **Ask for everything at the last responsible moment.** Account after value where possible, permissions when the feature needs them, details when they change something, payment after a win.
5. **Never a dead end.** Every empty screen explains itself and offers one action, a template, or labeled sample data.
6. **Every step is guilty until proven essential.** Each question must change what the user sees next; otherwise cut it.
7. **Skippable, resumable, never repeated.** Respect the user's time and intent; onboarding that traps people is a dark pattern.

## Workflow

- [ ] **Write the activation event** in the format below, plus setup, aha, and habit moments. Check: it names an action, a count, and a window, and it excludes sample-data actions.
- [ ] **Inventory the current path** from sign-up to activation (screens, fields, waits, emails, permissions). Watch 5 real session recordings if they exist; each divergence from the intended path is a finding.
- [ ] **Mark each step** essential / declares intent / administrative. Delete administrative steps; defer non-essential setup until after the aha moment.
- [ ] **Pick patterns** with the selection table; pick the blueprint for the product shape (`references/blueprints.md`).
- [ ] **Design every first-run surface**: welcome, empty states, checklist, first success, invite, permission asks, paywall (if any), return visit. Write real copy in outcome language.
- [ ] **Instrument** one event per step plus activation, with `is_sample` flags (`references/measurement.md`).
- [ ] **Validate**: walk the flow as a new user and as an invited teammate, on the smallest target device, skipping every optional step. Check against Anti-patterns and Gotchas; fix and repeat.

## Activation first

Format: **`<core action> ≥ N times within T days of sign-up`** — the earliest measurable behavior that best separates retained from churned users. Start with a hypothesis, then confirm it against cohorts (method in `references/measurement.md`).

| Moment | Meaning | Example (team roadmap tool) |
|---|---|---|
| Setup | Must-have actions before value is possible | Workspace created, one real project created |
| Aha | First experience of the core value | Sees the roadmap rendered and shares its link |
| Habit | The core action repeated enough to stick | Updates items in ≥ 3 of the first 14 days |

(Setup/aha/habit framing: Reforge.)

| Product shape | Activation event (template) | Time-to-value measured as |
|---|---|---|
| B2B team product | ≥ 1 real core object AND ≥ 1 teammate active within 7 days | Sign-up → first real object shared |
| B2C mobile | Completed the first core session on day 0 AND returned on ≥ 2 of days 1–7 | Install → first session completed |
| Developer tool / API | First successful authenticated call or deploy within 24 h | Time to first call (TTFC) / first deploy |
| Marketplace | Supply: first listing live AND first sale; demand: first transaction | Sign-up → listing live / first purchase |
| AI product | Used an AI output in real work (copied, inserted, exported, sent) in the first session | Sign-up → first accepted output |

Rules:
- Solo-only activation undercounts churn risk in team products; include a collaboration event when value needs others.
- "Sent a prompt", "completed the tour", and "visited 5 pages" are not activation; they are activity.
- Write outcome copy, not feature copy: "Send your first invoice and get paid faster", not "Welcome to the Invoices module" (Samuel Hulick: people buy better versions of themselves).

## Choosing patterns

```
Is value visible without the user's own data?
├─ yes (content, games, AI chat, templates) → product-first: drop them in, contextual hints
└─ no  (analytics, CRM, monitoring, payments)
   ├─ can it be faked safely? → labeled sample data / demo workspace + "Connect your data"
   └─ no → setup wizard for prerequisites ONLY, then empty states with one action each
Does value need other people?
└─ yes → invite AFTER the first solo win, framed around the object just created, skippable
Does it work without an account?
└─ yes → let them try first; ask to create an account to save or continue
```

| Pattern | Default use | Limits |
|---|---|---|
| Empty state (explain + one CTA + template/import) | Every list, board, dashboard on first use | Never "No data" alone |
| Sample data / demo workspace | Value invisible until data exists | Labeled "Sample", removable in one click, excluded from metrics |
| Templates | Blank-canvas products (docs, design, dashboards, AI) | 3–6 matched to the declared goal; "Start blank" always available |
| Personalization question | Several distinct jobs or roles | 1–3 questions, each branches the flow, "Something else" option |
| Setup wizard / stepper | Mandatory prerequisites (install snippet, connect source, verify domain) | Prerequisites only; progress shown; resumable |
| Checklist | Self-serve product with several setup steps | 3–5 items (7 max), real actions, quick win first, dismissible, gone when done |
| Contextual hint (pull) | A non-obvious feature, shown when the user reaches it | One at a time, dismissible, never re-shown |
| Product tour | A genuinely novel interaction model | ≤ 3 steps, user-startable, skippable, never repeated |
| Try before account (delayed sign-up) | Value can be shown without identity | Ask when saving, sharing, or continuing |
| Progressive profiling | Details you need later (company size, phone, avatar) | Ask when the answer is used, one at a time |
| Lifecycle email/push | Stalled users, next-step nudges | Triggered by state, one next step, respects opt-outs |
| Human concierge | High-value B2B accounts, early marketplace supply | Offered, never forced |

Details, copy, and do/avoid examples for each: `references/patterns.md`.

## Blueprints

Pick the one matching the product shape; full flows with ASCII sketches, copy, and event names are in `references/blueprints.md`.

| Blueprint | Shape of the first run | The trap to avoid |
|---|---|---|
| B2B SaaS | SSO sign-up → join existing workspace or create → 1 question → land in a template/sample → first real object → success → invite → checklist | Invitees dropped into the creator's welcome flow; duplicate workspaces for the same domain |
| B2C mobile | Instant launch → value-first welcome → 1–3 goal questions → first session before account → "Save your progress" → (paywall, closable) → reminder soft-ask → home with "Continue" | Permission prompts and account wall before any value |
| Developer tool / API | Docs readable without sign-up → keys injected into snippets → sandbox by default → "listening for your first request" → success in dashboard → go-live checklist | Gating docs; making developers copy keys between tabs |
| Marketplace | Supply first: staged seller checklist, drafts autosaved, verification before first payout; demand browses without an account | KYC before the first draft; account wall before browsing |
| AI product | Starter prompts or a scoped first task tied to role → first output → "use it" action → honest limits → progressive capability disclosure | Blank prompt box; activation measured as "sent a prompt" |

**Invited teammate (every team product):** the invite names the inviter and the object ("Maya invited you to 'Q3 roadmap'"); accepting lands on that object, not a generic welcome; skip the personalization survey (the workspace is already set up); ask only name and avatar; show who else is here.

## Permissions and paywall timing

- **Order on mobile: quick win → contextual permission → notification opt-in after value → habit.** Both Apple and Android guidance put value first; request a permission at launch only if the app cannot function without it, and say why (HIG Onboarding; Android onboarding guidance).
- **iOS priming screen:** if you show a custom screen before the system alert, it has **one button** ("Continue"/"Next", never "Allow") that opens the alert, with no close or skip that avoids it (Apple HIG privacy). The Android rationale may offer "Not now"; after repeated denials Android stops showing the dialog, so link to Settings instead.
- **Notifications:** ask when there is something to be reminded of ("Remind you at 9 pm for tomorrow's session?"), never on first launch.
- **B2B/web products:** no paywall or upgrade nag before the first win; upgrade prompts appear at a real limit or moment of value (`conversion-ux`).
- **Subscription mobile apps:** RevenueCat reports most trials start on install day (82% in its 2025 report) and 55% of 3-day-trial cancellations happen on day 0 (2026 report), so many apps show a paywall inside onboarding after personalization. Treat that as a deliberate, tested trade-off, not a default: show value first (a personalized plan preview or first session), keep a visible close/"Continue free", state trial terms, and remind before charging.

Platform details: `references/mobile-onboarding.md` and `mobile-design`.

## Anti-patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Forced multi-step tour on first load | Push help, forgotten, delays value (NN/g) | Contextual hints; optional tour ≤ 3 steps |
| Feature carousel before the app | Did not improve task performance in NN/g testing; makes the app look complex | One welcome screen or a preview of real content |
| Account wall before any value | Loses people before they see the product (Android guidance) | Let them try; ask to save progress |
| Asking company size, role, phone, avatar up front | Administrative friction | Minimum fields; progressive profiling later |
| Permission or notification prompt at launch | Denied without context; hard to recover | Ask at the moment of need, after value |
| Blank dashboard or empty table | Dead end | Empty state + sample/template + one CTA |
| Tour re-shown every login | Trains dismissal | Persist "seen" per user and per feature; keep it in Help |
| Questions whose answers change nothing | Friction dressed as personalization | Branch on every answer or delete it |
| Checklist of "watch the tour" items | Measures nothing | Items are real setup actions that lead to the aha |
| Paywall or upgrade nag inside setup (B2B) | Interrupts the straight line; no value to anchor price | Upgrade after activation, at a limit |
| Invite step before the first solo win | Nothing to invite people to | Invite framed around the object just created |
| Logo splash or ad as launch screen | Slows launch (HIG Launching) | Launch screen mirrors the first screen |
| Tour completion as the success metric | Vanity metric | Activation rate, time-to-activate, D7/W4 retention |

## Measurement

- **Funnel per step** from sign-up to activation; fix the steepest drop, not the first step.
- **Core metrics:** activation rate, time-to-activate (median and p75, not mean), D1/D7/D30 retention (consumer/mobile) or W1/W4/W8 (B2B), all by weekly sign-up cohort and source. Onboarding completion is a diagnostic only.
- **Events:** `object_action` in snake_case, past tense (`project_created`, `invite_sent`), with properties for variants (`{source, step, is_sample}`); one `onboarding_step_viewed/completed/skipped` family with a `step` property rather than one event name per screen.
- **Guardrails:** an activation gain with lower D30 retention or paid conversion pulled forward low-intent users.
- **Benchmarks are for sanity checks only.** Lenny Rachitsky's 2022 survey of 500+ products reported average activation 34% (median 25%); the only target that matters is beating the last cohort.

Tracking-plan template, activation discovery, and more benchmarks with attribution: `references/measurement.md`.

## Returning users and feature announcements

- **Restore state** on return (HIG Launching): same screen, scroll position, drafts.
- **After a long gap** (for example 30+ days): one "Welcome back — here's what changed" card and "Pick up where you left off"; never replay first-run onboarding.
- **Tier announcements:** major capability → one in-app modal + email + changelog; normal feature → "New" dot on the nav item and an inline banner where it applies; small improvement → changelog only. Interrupt only when a change would confuse someone who stumbles on it (moved navigation).
- **"New" badges expire** after first use or 14–30 days. Put "What's new" in the help or account menu with an unread dot.
- **Role changes** (viewer → admin) get a short mini-onboarding for the new capabilities.
- Measure adoption as % of active accounts using the feature within 30 days of exposure; Pendo's 2019 report (a vendor) found most features rarely or never used, so measure before building more.

## Ethics

The ethics floor from STYLE.md applies. In onboarding specifically:
- Every tour, survey, and checklist is skippable and dismissible; skipping never blocks the product.
- No fake progress, fake "setting up your account" delays, or fake scarcity in welcome offers.
- No confirmshaming on invite, notification, or trial screens ("No thanks, I like missing deadlines").
- Never send invites from an uploaded address book without the user picking each recipient.
- Marketing consent is separate and unchecked; notification reminders use the time the user chose and are easy to change.
- Sample data is labeled; demo numbers are never presented as real results.

## Gotchas

- **Designing screens before the activation event.** Write `action ≥ N within T days` first; then every screen answers "does this get them there faster?"
- **Counting sample-data actions as activation.** Flag `is_sample: true` and exclude it, or the metric lies.
- **One flow for creators and invitees.** Invitees need to land on the shared object with no setup questions.
- **Porting the Android "Not now" soft-ask to iOS.** Apple allows a single "Continue" button on a priming screen.
- **Adding a tour to fix a confusing UI.** Fix the UI; a tour is a symptom (NN/g: skip onboarding when possible).
- **Quoting benchmarks as goals.** Vendor figures (Userpilot, Chameleon, Pendo, RevenueCat) are directional and must carry "as reported by <vendor>, <year>".
- **Personalization questions that do not branch.** If two answers produce the same next screen, delete the question.
- **Lifecycle emails on a calendar only.** Trigger them from state ("stalled at step 3 for 24 h"), and link straight into that step.
- **Undismissable checklists.** They become banner blindness and annoy activated users; hide on completion or dismissal.
- **Collecting billing or KYC before the first draft** in marketplaces and platforms; require it before the first payout or live use.

## Output format

```
Product shape: <…> · Core action: <…> · Value visible without own data: yes/no · Needs others: yes/no
Activation: <action ≥ N within T days> · Setup: <…> · Aha: <…> · Habit: <…> · TTV target: <…>
Path (numbered): 1. <screen — purpose — primary CTA — copy> …
Removed/deferred steps: <step — why>
First-run surfaces: welcome · empty states · checklist items · success moment · invite · permission asks · paywall (if any)
Invitee path: <…>
Events: <event{props}> … · Funnel: <steps> · Guardrails: <metrics>
Returning users / announcements: <…>
Ethics check: pass / <items changed>
```

For audits: findings as **Fix now / High impact / Test ideas**, each marked Observed / Inferred / Not checked.

## References

| File | Read when |
|---|---|
| `references/blueprints.md` | Designing a full first run for a B2B SaaS, B2C mobile app, developer tool/API, marketplace, or AI product, including the invited teammate; you need ASCII sketches, copy, and event names. |
| `references/patterns.md` | Implementing a specific pattern: welcome screen, empty state, sample data, templates, checklist, tour, hint, personalization, delayed sign-up, progressive profiling, lifecycle email, celebration. |
| `references/measurement.md` | Defining or validating the activation event, writing a tracking plan, naming events, building the funnel, reading cohorts, or quoting a benchmark. |
| `references/mobile-onboarding.md` | Designing first launch on iOS/Android: launch screen, welcome, account timing, permission and notification asks, paywall placement in subscription apps. |
| `references/case-studies.md` | Persuading a team, or looking for a real example of a pattern (Duolingo, Trello, Slack, Linear, Notion, Headspace, Stripe, Vercel, PostHog, NN/g studies). |

## Related skills

- `auth-flows` — the sign-up, login, SSO, passkey, and verification screens that precede onboarding.
- `conversion-ux` — pricing pages, paywall anatomy, trials, and upgrade prompts after activation.
- `interaction-design` — empty, loading, and error states, microcopy, and toasts used in every first-run screen.
- `mobile-design` — permission priming mechanics, notification channels, and platform differences.
- `dashboard-design` — the home dashboard new users land on and its empty/not-set-up widget states.
- `ux-principles` — dark-pattern law, cognitive load, and lightweight usability testing of the flow.
