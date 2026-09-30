# Measuring onboarding

How to find the activation event, instrument the path, read the results, and quote benchmarks honestly.

## Contents
- Finding the activation event
- The core metrics
- Event naming conventions
- Tracking-plan template
- Reading the funnel
- Cohorts, experiments, and guardrails
- Qualitative loop
- Benchmarks (with attribution)

---

## Finding the activation event

Activation = the earliest measurable action (with a count and a window) that best separates users who stay from users who leave. Format: `<action> ≥ N within T days of sign-up`.

1. **List candidate actions** that plausibly deliver value: created the core object, connected data, invited a teammate, received the first result, repeated the core action.
2. **Define retained** for your product (for example, active in week 4 for B2B, day 30 for consumer).
3. **For each candidate and threshold**, compare retention of users who did it within T days against users who did not. Prefer the candidate with the largest separation that is **reachable early** (a day-1 action beats a day-20 action).
4. **Check coverage**: an action only 2% of users reach cannot be the main lever; one 95% reach separates nothing.
5. **Treat it as a correlation** until an experiment that moves the action also moves retention.
6. **Write it down** with its setup, aha, and habit moments, and review it when the product or audience changes.

No data yet? Pick the hypothesis from the blueprint for your product shape, say it is a hypothesis, and revisit after the first few hundred sign-ups.

Classic public examples of activation-style thresholds: Facebook's "7 friends in 10 days" (a setup threshold whose aha is an interesting feed; Reforge's framing) and Slack's message-volume threshold for teams.

## The core metrics

| Metric | Definition | Notes |
|---|---|---|
| Activation rate | Sign-ups reaching the activation event within T / all sign-ups in the cohort | The headline metric |
| Time to activate | Median and p75 time from sign-up to activation | Not the mean; long tails distort it |
| Steps to activate | Screens/actions on the happy path | Should fall over time |
| Step conversion | Share of users moving from each step to the next | Where to work |
| Retention | D1/D7/D30 (consumer, mobile) or W1/W4/W8 (B2B) by sign-up cohort | The outcome activation predicts |
| Onboarding completion | Finished the checklist/tour | Diagnostic only, never a goal |
| Invitee activation | Invited users who take their own first action | Team products |
| TTFC | Seconds from key creation to first successful call | Developer products |

Always segment by sign-up source, platform, plan, and (B2B) creator vs invitee. A blended average hides the broken segment.

## Event naming conventions

- **`object_action`, snake_case, past tense**: `project_created`, `invite_sent`, `first_request_received`. One convention across web, mobile, and backend.
- **Variants are properties, not names**: `template_selected{template: "sprint"}`, not `sprint_template_selected`.
- **One family for onboarding steps**: `onboarding_step_viewed{step}`, `onboarding_step_completed{step}`, `onboarding_step_skipped{step}`, `onboarding_dismissed{step}`. Steps get stable IDs (`goal_question`, `connect_source`), not positions, so reordering does not break history.
- **Standard properties on every event**: `user_id`, `account_id` (B2B), `platform`, `app_version`, `signup_cohort_week` (or derive it), and `is_sample` on anything that can touch sample data.
- **Server-side for truth**: fire activation-critical events (object created, payment, first request) from the backend; client events are lost to ad blockers and killed apps.
- **An explicit `aha_reached` / `activated` event** computed once, so every dashboard uses the same definition.
- **No PII in event names or free-text properties**; IDs only.

## Tracking-plan template

```
Activation: <action ≥ N within T days>        Retained means: <…>
| Step id          | Event                         | Properties                  | Source  |
|------------------|-------------------------------|-----------------------------|---------|
| signup           | signup_completed              | method, source              | server  |
| goal_question    | onboarding_question_answered  | question, answer            | client  |
| template         | template_selected             | template                    | client  |
| first_object     | project_created               | is_sample=false             | server  |
| aha              | aha_reached                   | ms_since_signup             | server  |
| invite           | invite_sent                   | count, channel              | server  |
| invitee          | invitee_activated             | inviter_id                  | server  |
| checklist        | checklist_item_completed      | item                        | client  |
Dashboards: funnel by step · activation rate by weekly cohort · time-to-activate p50/p75 · retention curves
```

## Reading the funnel

```
Signup → Question → Template → First real project → Aha → Invite → Activated
 100%     92%        85%         48%                  41%    22%      19%
```
- **Fix the steepest drop, not the first step** (here: template → first real project).
- **Diagnose the drop** as friction (too much work), confusion (unclear what to do), or ordering (asked too early). Session replays of 5 users who dropped there usually tell you which.
- **Watch time between steps** as well as conversion; a step everyone completes after 3 days is still a problem.

## Cohorts, experiments, and guardrails

- Compare **weekly sign-up cohorts** before and after each onboarding change; hold out a control group where volume allows (A/B sample sizes: `conversion-ux`).
- **Guardrails**: D30/W8 retention, paid conversion, support tickets, refunds. Activation that rises while these fall means you pulled forward low-intent users or made the event easier without delivering value.
- **Do not change the activation definition mid-experiment.**
- Exclude internal users, test accounts, and sample-data actions from every metric.

## Qualitative loop

- Watch 5 session recordings of users who dropped at the worst step.
- One-question survey on skip or dismissal: "What were you hoping to do?"
- Read setup-related support tickets weekly; each recurring question is a missing hint, empty state, or default.
- Five moderated usability sessions of the first run with target users find most blocking issues (`ux-principles`).

## Benchmarks (with attribution)

Benchmarks are for sanity checks, never targets. The only target is "better than last cohort".

| Metric | Figure | Source (type) |
|---|---|---|
| Activation rate, all products | average 34%, median 25% | Lenny Rachitsky and Yuriy Timen survey of 500+ products, 2022 (newsletter survey) |
| Activation rate, SaaS | average 36%, median 30% | same survey |
| Onboarding checklist completion | average 19.2%, median 10.1%, 188 companies | Userpilot (vendor) |
| Product tour completion | ~72% for 3-step vs ~16% for 7-step tours; progress indicators help | Chameleon (vendor; data originates in its 2019 report) |
| Features rarely or never used | 80% of features in the average product | Pendo 2019 Feature Adoption Report (vendor) |
| Subscription app trials started on install day | 82% | RevenueCat State of Subscription Apps 2025 (vendor) |
| 3-day-trial cancellations on day 0 | 55% | RevenueCat State of Subscription Apps 2026 (vendor) |

When citing any of these to a user, keep the "as reported by <source>, <year>" qualifier. Widely repeated figures without a primary source (for example specific DAU lifts attributed to delayed sign-up, or "best-in-class time to first call" numbers) are not listed on purpose; do not quote them.

## Sources

- Reforge, setup moment and aha moment: https://www.reforge.com/guides/define-your-setup-moment ; https://www.reforge.com/c/retention-series-eg/activation/aha-moment
- Lenny Rachitsky, "What is a good activation rate": https://www.lennysnewsletter.com/p/what-is-a-good-activation-rate
- Userpilot, onboarding checklist completion benchmarks: https://userpilot.com/blog/onboarding-checklist-completion-rate-benchmarks/
- Chameleon benchmark reports: https://www.chameleon.io/benchmark-report-2023 ; https://www.chameleon.io/assets/chameleon-product-tour-benchmarks-report-2019.pdf
- Pendo, 2019 Feature Adoption Report: https://www.pendo.io/resources/the-2019-feature-adoption-report/
- RevenueCat, State of Subscription Apps: https://www.revenuecat.com/state-of-subscription-apps-2025 ; https://www.revenuecat.com/state-of-subscription-apps
- marketingskills `onboarding` skill (MIT; funnel example, metric list, stalled-user handling): https://github.com/coreyhaines31/marketingskills
