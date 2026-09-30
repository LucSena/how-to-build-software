---
name: ux-principles
description: Use when deciding how a screen, flow, or feature should work for people, or when explaining why users struggle with it. Covers the Laws of UX turned into concrete UI decisions (Hick, Fitts, Jakob, Miller, Tesler, Doherty, peak-end, goal-gradient, Gestalt), Nielsen's 10 usability heuristics with checks, cognitive load and progressive disclosure, mental models, response-time limits, humane design, a dark-pattern "never build" list with legal references (FTC/ROSCA, California click-to-cancel, EU DSA Art. 25), and lightweight research (5-second tests, 5-user usability tests). Also use when the user says "is this confusing?", "too many options", "users don't get it", "simplify this flow", "why do people drop off here", or asks whether a growth tactic is a dark pattern. For states, forms, and microcopy use interaction-design; for a scored audit use design-review; for landing and pricing pages use conversion-ux.
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "interaction-design design-review conversion-ux accessibility data-dense-ui"
---

# UX Principles

People do not read interfaces; they scan, guess from what they already know, and give up when the guess fails. This skill turns the durable findings of cognitive psychology and usability research into decisions: how many options to show, what to hide, where to put the primary action, how fast feedback must arrive, and which "growth" patterns are off the table. The outcome it protects is a user who finishes their task without having to think about the interface, and who never gets tricked into something they did not want.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Name the user, the task, and the context of use (device, frequency, expertise) before applying any law. The same rule points in opposite directions for a first-time visitor and an expert who uses the screen 100 times a day.

## Core principles

1. **Design for the task, not the data model.** Screens, labels, and order follow what the user is trying to get done; exposing tables, enums, and internal states is the most common UX failure in engineer-built UI.
2. **Follow conventions unless you can name the gain.** Users spend most of their time in other products (Jakob's law); every novel pattern costs learning time you must justify.
3. **Cut extraneous load before adding help.** Remove, merge, default, and defer first; tooltips and tours are what you add when you failed to simplify.
4. **One primary action per view.** A single visually dominant next step beats a row of equals (Hick, Von Restorff).
5. **The system carries the memory, not the user.** Keep context visible across steps; recognition beats recall.
6. **Respond within human time limits.** Acknowledge input in ≤ 100 ms, show a result or progress within ~400 ms–1 s, and let the user leave anything over 10 s.
7. **Persuade only toward what the user already wants.** If a pattern works only because the user misunderstands it, do not build it.

## Workflow

- [ ] **Frame**: write one line each for user, task, frequency (first-time / occasional / daily-expert), device, and the success signal.
- [ ] **Map the flow**: list every step and decision from entry to done. Mark each step as *declares intent*, *provides data*, or *waits*. Remove or default every step you cannot defend.
- [ ] **Apply the decision table** below to each screen: count options per decision point, identify the primary action, check grouping and placement.
- [ ] **Run the 10 heuristics** (table below) against the flow, including error, empty, and slow paths, not just the happy path.
- [ ] **Check response times** for every action against the limits table; decide optimistic vs. pending vs. background.
- [ ] **Ethics pass**: check every persuasion or retention mechanic against the "never build" list. Remove anything that fails.
- [ ] **Validate with people**: pick the cheapest research method from the table that answers the open question; fix and repeat.

## Laws of UX as decisions

Default rules for the laws that change UI decisions most often. The full set of 30 with misuse notes is in `references/laws-of-ux.md`.

| Law | What to do in the UI |
|---|---|
| **Hick's law** (decision time grows with number and complexity of choices) | One primary CTA per view; ≤ 4 visible options per decision point where possible; put the recommended option first or badge it; move rare actions into an overflow menu. Do not strip labels to "simplify". |
| **Choice overload** | 3 (max 4) pricing tiers with one highlighted; long lists get search and filters; comparisons align the same attribute row by row. |
| **Fitts's law** (time to hit a target depends on size and distance) | Primary actions large and near the user's focus or thumb; hit areas ≥ 24×24 CSS px (WCAG 2.5.8), 44×44 pt iOS, 48×48 dp Android; expand hit areas with padding, not bigger visuals; keep destructive actions away from frequent ones. |
| **Jakob's law** | Logo top-left links home, search at top, account/cart top-right, labels above inputs, bottom tab bar on mobile apps, standard icons. For a big redesign, offer a temporary "switch back". |
| **Mental model** | Name things in the user's words ("Invoices", not `billing_documents`); a board behaves like other boards, a table sorts and filters like a spreadsheet. |
| **Miller's law / working memory** | Chunk (phone `555 123 4567`, card numbers in 4s, forms in titled sections). Never cap navigation at "7 items" by rule; never ask users to remember a value from a previous screen. |
| **Tesler's law** (irreducible complexity must live somewhere) | Move it into the system: infer city from postcode, card brand from number, timezone from the browser; parse flexible input instead of demanding formats. |
| **Postel's law** | Accept spaces, dashes, and parentheses in phone and card numbers, any case in emails, several date formats; normalize server-side and display one canonical format. |
| **Doherty threshold** (< 400 ms keeps people in flow) | Pressed state within 100 ms; result, optimistic update, or skeleton within 400 ms. |
| **Proximity / common region** | Gap inside a group clearly smaller than gap between groups (e.g. 4–8 px label→input, 16–24 px between fields, 32–48 px between sections); helper and error text sit closer to their own field than to the next. Group with one container level, rarely two. |
| **Similarity** | Same function, same look (all links one style, all destructive buttons one variant); never style non-interactive text like a link. |
| **Von Restorff** (the different item is remembered) | Exactly one accent-colored primary action per view; mark distinction with shape, icon, or text as well as color. |
| **Serial position** | Most important nav items first and last; key table columns leftmost, row actions rightmost. |
| **Goal-gradient / Zeigarnik** | "Step 2 of 4" and progress bars in multi-step flows; checklists that show what is left. Never invent fake incomplete tasks to nag. |
| **Peak-end rule** | Invest in the success moment and the last step (clear confirmation plus next step); never end a flow on a dead end; make error recovery graceful because bad moments are remembered longest. |
| **Paradox of the active user** | Put guidance in the product (empty states, inline hints, sample data); never gate first use behind a mandatory tour. |
| **Aesthetic-usability effect** | Polish matters, but test task completion; "looks great" feedback hides usability failures. |

## Nielsen's 10 heuristics, as checks

| # | Heuristic | Check (fails if "no") |
|---|---|---|
| 1 | Visibility of system status | Every async action has pending, success, and error states; the current location is shown (active nav, breadcrumb, step indicator); save state is visible ("Saved 2 s ago"). |
| 2 | Match with the real world | No error codes, enum names, or DB field names in copy; fields and steps ordered as the user thinks about them. |
| 3 | User control and freedom | Every overlay closes with Esc and a visible close; Back works (URL-driven state); reversible actions offer Undo; long operations can be cancelled. |
| 4 | Consistency and standards | One term per concept ("Delete" everywhere, not "Remove" elsewhere); design-system components only; platform conventions (back gesture, shortcuts) respected. |
| 5 | Error prevention | Constraints and good defaults (pickers, disabled impossible options, formats parsed not enforced); destructive irreversible actions confirmed with specific verbs. |
| 6 | Recognition rather than recall | Labels always visible (never placeholder-only); recent items, autocomplete, and previews offered; summary stays visible across steps. |
| 7 | Flexibility and efficiency | Shortcuts, bulk actions, saved views, and a command palette exist for frequent tasks, but nothing requires them. |
| 8 | Aesthetic and minimalist design | Every element on screen serves this task; secondary info is de-emphasized or disclosed on demand. |
| 9 | Recognize, diagnose, recover from errors | Errors say what happened and how to fix it, next to the cause, in plain language, with input preserved. |
| 10 | Help and documentation | Help is contextual (inline hint, "?" next to the hard field, docs linked from errors) and sits in the same place on every page (WCAG 3.2.6). |

Procedure, severity scale (0–4), and violations typical of complex apps are in `references/heuristics.md`.

## Cognitive load and progressive disclosure

- **Separate intrinsic from extraneous load.** Intrinsic load is the task itself (choosing a plan). Extraneous load is what the design adds (decoration, duplicate info, jargon, unclear grouping). Only extraneous load is yours to remove, and removing it comes first.
- **Budget per view:** 1 primary action, 1–2 secondary, the rest in a menu. ≤ 4 options per decision point is a good target; 8+ means split, filter, or default.
- **Progressive disclosure:** show the few options most people need; put advanced ones behind a visible, labelled control ("Advanced settings"), never behind an unlabeled icon. Anything most users need goes on the first layer. Stop at 2 levels; a third level means the information architecture is wrong.
- **Staged disclosure** (wizard) is different: use it when everyone must pass every step in order and later steps depend on earlier answers. Show step count and allow Back without data loss.
- **Smart defaults** are the cheapest simplification: preselect the option most people choose, if it is also safe and honest for them.
- **Hidden navigation costs discoverability.** NN/g found hiding primary navigation behind a menu icon measurably reduced discoverability and increased task time. With ≤ 5 top destinations, show them (tab bar or visible nav); otherwise expose the top few and collapse the rest.

## Response-time limits

| Delay | What the user perceives | What to show |
|---|---|---|
| ≤ 100 ms | Instant; direct manipulation | The result itself. Pressed/active state on every control. |
| ≤ 400 ms (Doherty) | Still in flow | Result, optimistic update, or nothing extra. |
| ~1 s | Noticed, flow of thought intact | Delay spinners/skeletons ~150–300 ms so fast responses never flash one; once shown keep it ≥ ~300–500 ms. |
| 1–10 s | Attention starts to wander | Skeleton for region/page loads; spinner or "Saving…" for single components. |
| > 10 s | Attention lost; user wants to do something else | Determinate progress with an estimate, a way to cancel, the option to background the job, and a notification on completion. |

Source limits: Nielsen's 0.1 / 1 / 10 s and the Doherty threshold (400 ms). Loading-pattern details live in `interaction-design`.

## Humane design and the "never build" list

Humane by Design's principles, compressed: be **transparent** (say what data you collect and why; make deletion and unsubscribe easy), **resilient** (block, mute, report, and visibility controls ship with any social feature), **empowering** (users control defaults, cadence, and data), **finite** (natural stopping points, "You're all caught up", "Load more" over endless feeds), **inclusive** (flexible names, optional gender, accessibility, RTL), **intentional** (use friction to prevent harm, e.g. a speed bump before sharing unread links), and **respectful** (notifications match urgency and are configurable per category).

**Never build** these, whatever the metric pressure:

| Pattern | Honest alternative |
|---|---|
| Confirmshaming ("No thanks, I hate saving money") | Neutral decline: "No thanks". |
| Pre-ticked consent or marketing boxes | Unchecked by default; "Reject all" as prominent as "Accept all". |
| Hidden or drip pricing (fees revealed at the last step) | All-in price as early as possible. |
| Roach motel (easy to join, hard to leave) | Cancel online, in about as many steps as signup, from an obvious place in account settings. |
| Forced registration to buy or try | Guest checkout; account creation after value. |
| Fake urgency, scarcity, or activity ("3 people viewing" that is not true) | Show only real, data-backed stock, deadlines, and activity. |
| Fake or cherry-picked-into-lies social proof | Real, attributed, verifiable testimonials and numbers. |
| Nagging without a real "no" | "Not now" respected for days, plus "Don't ask again". |
| Sneak into basket / silent add-ons | Only what the user chose; optional add-ons unchecked. |
| Disguised ads, trick wording, double negatives, decline styled as a faint link | Plain wording; equal weight for accept and decline on consent. |
| Engagement traps (autoplay-next, infinite feed without stopping cues, streak guilt) | User-controlled autoplay, end-of-feed markers, gentle reminders the user opted into. |

Legal backstops (as of 2026-09; not legal advice): **EU Digital Services Act Art. 25** bans online-platform interfaces that deceive, manipulate, or materially impair free and informed decisions (Recital 67 names repeated prompts, cancellation harder than signup, and hard-to-change defaults). **US FTC** enforces subscription traps under Section 5 and ROSCA; its 2024 "click-to-cancel" Negative Option Rule was vacated by the 8th Circuit in July 2025 and the FTC reopened rulemaking in 2026. **California's Automatic Renewal Law (AB 2863, in force July 2025)** requires online cancellation as easy as signup. Pre-ticked boxes do not count as GDPR consent. Details and sources: `references/humane-design.md`.

## Lightweight research

Default: test with real people before arguing about opinions. Pick the cheapest method that answers the question.

| Question | Method | Size and effort |
|---|---|---|
| "Is it clear what this is and who it's for?" | **5-second test**: show the screen 5 s, ask what it is, who it's for, what to do next. | 5–10 people from the target audience, minutes each. |
| "Can people complete the task?" | **Moderated usability test** with think-aloud on 3–5 realistic tasks; do not help or lead. | ~5 users per round finds most major problems (NN/g); iterate in rounds instead of one big study. |
| "Where would they click first?" | **First-click test** on a static screen. | 15–30 people; the first click strongly predicts task success. |
| "Do the labels and grouping match their model?" | **Card sort** (open for new IA) or **tree test** (validate an existing IA without visuals). | 15–30 participants, unmoderated tools are fine. |
| "Why do users drop off at step N?" | Funnel analytics plus 5–10 **session replays** of drop-offs; then interview. | Hours. Compare the real path with the intended one. |
| "Does this change move the metric?" | **A/B test**, only with a pre-computed sample size (see `conversion-ux`). | Needs traffic; with low volume, 5 good interviews beat an underpowered test. |

Write tasks as goals ("You need to invite a teammate"), not instructions ("Click Invite"). Record what people do, not what they say they would do.

## Gotchas

- **Treating Miller's 7±2 as a hard limit.** It is about working memory, not menu length. Chunk and label; do not truncate a useful nav to 7 items by rule.
- **"Simplifying" by removing labels.** Icon-only toolbars and hidden menus raise load; Hick's law is about decisions, not pixels.
- **Applying a law out of context.** Fitts favors big targets, but a big "Delete" next to "Save" is a disaster; frequency and consequence decide placement.
- **Checking only the happy path.** Heuristics 1, 3, 5, and 9 are mostly about slow, failed, empty, and mistaken paths. Walk them explicitly.
- **Confirm dialogs everywhere.** Overused confirmations train reflexive clicking; prefer Undo for anything reversible.
- **Using biases as levers against users.** Scarcity, social proof, defaults, and loss framing are fine when true and in the user's interest; the same mechanisms become dark patterns when fabricated or when they hide the exit.
- **Designing for the "rational" user.** People skim, misread, and get interrupted; design for distracted, one-handed, first-time use unless the context says otherwise.
- **Letting polish substitute for testing.** Attractive prototypes get kind feedback (aesthetic-usability effect); measure task success instead.
- **Citing a law without a decision.** "Per Hick's law" is noise unless followed by the specific change (e.g. "move 5 of 8 actions into More").

## Output format

For a design decision or UX assessment, produce:

```
Context: <user · task · frequency · device>
Findings (ordered by impact)
1. <Observed problem> — <principle/heuristic> — Severity <0–4> — Fix: <specific change>
...
Ethics check: <pass | patterns removed and replacements>
Open questions → research: <question> → <method, participants>
```

Separate **Observed** (seen in the UI or code), **Inferred** (likely, not verified), and **Not checked**.

## References

| File | Read when |
|---|---|
| `references/laws-of-ux.md` | You need a law not in the table above, or you are unsure whether a law applies or is being misused. |
| `references/heuristics.md` | Running a heuristic evaluation, scoring severity, or reviewing a complex/expert application. |
| `references/humane-design.md` | A feature touches consent, notifications, subscriptions, cancellation, feeds, social features, or any persuasion mechanic; or someone asks "is this a dark pattern?" |

## Related skills

- `interaction-design` — turning these principles into states, forms, feedback, overlays, and copy.
- `design-review` — a full scored audit of an existing UI (it uses these heuristics).
- `conversion-ux` — landing pages, signup, onboarding, pricing, and checkout within the ethics floor.
- `accessibility` — WCAG 2.2 AA implementation details behind many of these checks.
- `data-dense-ui` — applying load and hierarchy rules to dashboards and tables.
