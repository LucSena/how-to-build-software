# Onboarding patterns

One entry per pattern, in the STYLE.md rule shape. Use the fewest patterns that get the user to the activation event; each one added is another thing to read.

## Contents
- Welcome screen
- Empty state that onboards
- Sample data and demo workspaces
- Templates
- Personalization question
- Setup wizard
- Checklist
- Contextual hints (pull revelations)
- Product tour
- Try before account (delayed sign-up)
- Progressive profiling
- Success moment
- Lifecycle email and push
- Stalled users
- Human concierge
- Choosing a combination

---

### Welcome screen: one screen, one promise, one action
**Rule.** At most one welcome screen that states the outcome the user will reach and how long it takes, with one primary action.
**Apply when.** The first screen after sign-up or first launch.
**Do / Avoid.** Do: "Let's get your first invoice out — about 3 minutes" [Start]. Avoid: a four-slide feature carousel, a founder video that autoplays with sound, "Welcome to Acme!" with no next step.
**Why.** NN/g's test of deck-of-cards tutorials (70 users, 4 apps) found they did not improve task performance and made the app look harder than it was.

### Empty state that onboards
**Rule.** Every collection's first-use empty state says what will appear here, why it helps, and offers one primary action plus an alternative path (template, import, sample).
**Apply when.** Lists, boards, dashboards, inboxes, search with no content yet.
**Do / Avoid.** Do: "No projects yet. A project groups the work for one goal, like a launch. [Create project] or Import from Jira." Avoid: a blank table, "No data", or eight equal buttons.
**Why.** NN/g's empty-state guidelines: communicate status, teach in context, and provide direct pathways. Paradox of the active user: people act before they read.

Distinguish the empty kinds; each needs its own copy:

| Kind | Copy shape | Action |
|---|---|---|
| First use | What goes here + why | Create / template / import |
| Cleared by the user | "All done" | Next useful thing |
| No results (search/filter) | Echo the query or filters | Clear filters, fix spelling |
| No permission | Who can grant access | Request access |

### Sample data and demo workspaces
**Rule.** When value is invisible without data, pre-populate a clearly labeled example that demonstrates good practice, removable in one click and replaced as soon as real data arrives.
**Apply when.** Analytics, CRM, project management, monitoring, finance.
**Do / Avoid.** Do: a board named "Example: Website relaunch" with a persistent "Sample data · Remove" bar (Linear pre-populates a demo workspace). Avoid: sample rows mixed into real data, sample revenue that looks real, sample actions counted in activation.
**Why.** Showing the destination motivates the setup work; labeling protects trust and metrics.

### Templates: 3–6, matched to intent
**Rule.** Offer a short list of templates matched to the declared goal, with "Start blank" always available.
**Apply when.** Blank-canvas products: docs, whiteboards, sites, dashboards, automations, AI workflows.
**Do / Avoid.** Do: after "What will you use it for? → Sprint planning", show 4 sprint templates first. Avoid: a gallery of 200 on day one.
**Why.** Hick's law: choice time grows with options. Notion asks what the user needs and shows a small matched set; PostHog ships dashboard templates.

### Personalization question: only if it branches
**Rule.** Ask 1–3 intent questions, one per screen, each of which changes what the user sees next (template, checklist, first screen, copy).
**Apply when.** The product serves several distinct jobs or roles.
**Do / Avoid.** Do: "What brings you here?" with 4–6 large options plus "Something else", echoed later ("Your sleep plan is ready"). Avoid: company size, "How did you hear about us?", or role questions whose answers only feed a CRM.
**Why.** Declaring intent is useful friction (it personalizes the path and creates commitment); collecting data the path ignores is administrative friction.

### Setup wizard: prerequisites only
**Rule.** Use a stepper only for steps without which the product cannot work at all; everything optional goes after the first value.
**Apply when.** Install a tracking snippet, connect a data source, verify a domain, pair a device.
**Do / Avoid.** Do: a real stepper ("Step 2 of 3"), Back that keeps input, resumable after closing, a "Do this later" where the product can still show something. Avoid: preferences, theme, avatar, or notification settings inside the wizard; an illustration that changes per step as the only progress signal (Android guidance).
**Why.** Every mandatory step before value costs completions; visible progress sets expectations.

### Checklist
**Rule.** 3–5 items (7 at most), each a real action that leads toward activation, ordered quick-win first, linking directly to the action, dismissible, and gone when complete.
**Apply when.** Self-serve products with several setup steps.
**Do / Avoid.** Do: "✓ Create workspace ✓ Pick a template ○ Add your first real project [Add]". Count steps already done at sign-up (honest endowed progress; Nunes and Drèze, 2006). Avoid: "Watch the tour" items, fake steps to inflate progress, a checklist that cannot be hidden.
**Why.** Visible progress motivates (goal-gradient). Completion is low in practice (Userpilot reports an average of 19.2% and a median of 10.1% across 188 companies), so never hide an essential step only in the checklist.

### Contextual hints (pull revelations)
**Rule.** Show help when the user reaches the feature it explains, one hint at a time, dismissible, never repeated after dismissal.
**Apply when.** Non-obvious features, gestures, shortcuts, power features.
**Do / Avoid.** Do: a hint next to the filter bar the first time the user opens a long list ("Press F to filter"). Avoid: a chain of tooltips on first load pointing at every nav item.
**Why.** NN/g distinguishes push revelations (out of context, quickly forgotten) from pull revelations (tied to the current goal). Apple recommends context-specific tips (TipKit) over one up-front flow.

### Product tour
**Rule.** Tours are optional, user-startable, ≤ 3 steps, skippable at every step, and never shown again once skipped or finished; keep them findable in Help.
**Apply when.** A genuinely novel interaction model (canvas, keyboard-first tool, game mechanic).
**Do / Avoid.** Do: "Take a 3-step tour" in the help menu and on the empty state. Avoid: a forced 8-step tour on first login, tours that explain obvious UI.
**Why.** As reported by Chameleon (tour benchmark data originating in its 2019 report), 3-step tours complete far more often than 7-step ones (about 72% vs 16%), and user-triggered tours outperform automatic ones.

### Try before account (delayed sign-up)
**Rule.** If the core experience does not need identity, let people use it first and ask for an account when they want to save, share, or continue.
**Apply when.** Consumer apps, editors, calculators, lessons, AI tools with a free first run.
**Do / Avoid.** Do: Duolingo runs the first lesson, then asks to create a profile to keep progress. Avoid: an account wall before any content; forgetting to migrate the anonymous work into the new account.
**Why.** Android's onboarding guidance notes an up-front account wall carries a higher risk of losing users before they experience the app. Apple rejects forced login for features that are not account-based.

### Progressive profiling
**Rule.** Ask for each additional detail at the moment it is used, one at a time, with the reason.
**Apply when.** Company size, phone, avatar, timezone, address, tax ID.
**Do / Avoid.** Do: ask for the timezone when the user schedules the first report ("So reports arrive at 9:00 your time"). Avoid: a 10-field profile form after sign-up.
**Why.** Fields asked in context have an obvious purpose, so they are answered more often and more accurately.

### Success moment
**Rule.** When the user reaches the aha moment, show the outcome itself, acknowledge it briefly, and give the next step.
**Apply when.** First published page, first report, first payment received, first deploy.
**Do / Avoid.** Do: the live chart rising with "Your first event arrived" and "Next: add a goal". Avoid: confetti on trivial actions, a static "Success!" modal that hides the result.
**Why.** Peak-end rule: people remember the high point and the end of an experience.

### Lifecycle email and push
**Rule.** Trigger messages from product state, one next step per message, deep-linked to that step, reinforcing (not duplicating) the in-app checklist.
**Apply when.** Welcome, stalled at a step, teammate joined, activation reached, first-week summary.
**Do / Avoid.** Do: "Your roadmap is ready to share — invite your team" 24 h after a stall at the invite step. Avoid: a fixed 7-email drip that ignores what the user already did.
**Why.** Wes Bush's "bowling alley": product bumpers (in-app) and conversational bumpers (out of app) both steer users back to the straight line.

### Stalled users
**Rule.** Define "stalled" explicitly (for example, no activation event 3 days after sign-up), then re-engage with the specific blocker.
**Apply when.** Any product with a measurable activation event.
**Do / Avoid.** Do: in-app "Pick up where you left off" plus one email addressing the likely blocker; human outreach for high-value accounts. Avoid: generic "We miss you" messages, ignoring unsubscribes.
**Why.** A stall usually has a concrete cause (missing data, missing teammate, confusion at one step); generic nudges do not remove it.

### Human concierge
**Rule.** Offer a human (setup call, migration help, listing creation) where account value justifies the cost.
**Apply when.** High-value B2B accounts, complex migrations, early marketplace supply.
**Do / Avoid.** Do: "Book a 20-minute setup call" on the checklist for teams above a size threshold. Avoid: forcing a sales call before trial access.
**Why.** For expensive, complex products a human removes blockers faster than any UI pattern.

---

## Choosing a combination

| User knows the category? | Product complexity | Default combination |
|---|---|---|
| No | High | Intent question + prerequisites wizard + checklist + sample data |
| No | Low | One welcome screen + good empty states |
| Yes (switching) | High | Import from the incumbent + checklist + contextual hints |
| Yes | Low | Straight into the product with good empty states; get out of the way |

Then add contextual hints for the 2–3 features that support tickets show people miss. Support tickets about setup are onboarding bugs.

## Sources

- NN/g, Mobile-App Onboarding; Mobile Tutorials (deck-of-cards study); Onboarding Tutorials vs. Contextual Help; Designing Empty States in Complex Applications: https://www.nngroup.com/articles/mobile-app-onboarding/ ; https://www.nngroup.com/articles/mobile-tutorials/ ; https://www.nngroup.com/articles/onboarding-tutorials/ ; https://www.nngroup.com/articles/empty-state-interface-design/
- Apple HIG, Onboarding: https://developer.apple.com/design/human-interface-guidelines/onboarding
- Android Developers, Authentication & Onboarding: https://developer.android.com/design/ui/mobile/guides/patterns/onboarding
- Nunes and Drèze, "The Endowed Progress Effect", Journal of Consumer Research, 2006: https://doi.org/10.1086/500480
- Laws of UX (Hick's law, goal-gradient, peak-end, paradox of the active user): https://lawsofux.com/
- Wes Bush, bowling-alley onboarding framework: https://productled.com/blog/user-onboarding-framework
- Userpilot checklist completion benchmark (vendor): https://userpilot.com/blog/onboarding-checklist-completion-rate-benchmarks/
- Chameleon product-tour benchmarks (vendor): https://www.chameleon.io/benchmark-report-2023
- Notion personalization: https://www.candu.ai/blog/how-notion-crafts-a-personalized-onboarding-experience-6-lessons-to-guide-new-users
- Linear demo workspace: https://www.candu.ai/blog/linear-onboarding-teardown
- Duolingo gradual engagement: https://growth.design/case-studies/duolingo-user-retention
- marketingskills `onboarding` skill (MIT; checklist and empty-state guidance, email triggers): https://github.com/coreyhaines31/marketingskills
