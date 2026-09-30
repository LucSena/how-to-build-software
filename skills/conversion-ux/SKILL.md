---
name: conversion-ux
description: Use when building or improving the screens that turn visitors into users and users into customers — landing pages and heroes, CTAs, social proof, signup and login forms, onboarding and activation, empty states for new accounts, pricing pages, paywalls and upgrade prompts, trials, checkout, and cancellation flows — and when planning A/B tests for them. Covers awareness-level messaging, field costs, time-to-value, checklists, plan tables, Baymard checkout findings, easy-cancel legal requirements, sample sizes, and a hard ethics floor against dark patterns. Also use when the user says "nobody signs up", "improve conversion", "my landing page isn't working", "people drop off in onboarding", "design our pricing page", "add a paywall", "reduce checkout abandonment", or "build a cancel flow", even for one section. For visual direction use design-taste; for general form mechanics use interaction-design; for the psychology and dark-pattern law in depth use ux-principles.
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "ux-principles interaction-design design-taste web-platform design-foundations"
---

# Conversion UX

Conversion is what happens when a person who already has a need finds, quickly and without doubt, that this product meets it. The job is to remove friction and uncertainty from that path: say clearly what it is and for whom, prove it with real evidence, ask for as little as possible, deliver value before asking for commitment, and make every exit honest. Tricks may lift a metric for a quarter; they also raise refunds, churn, chargebacks, and legal risk, and they are off the table here.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Get four facts before designing: **who the buyer is** (role, trigger that brings them, what they tried before), **their awareness level** (below), **the one conversion goal** of this page or flow, and **the traffic source** (ad, search, referral, in-product). If there is real customer language (reviews, support tickets, sales calls), use it; do not invent it.

## The ethics floor (non-negotiable)

Never build these, regardless of the metric: confirmshaming; hidden or drip pricing; pre-ticked consent or add-ons; fake scarcity, countdowns, or activity; fabricated testimonials, logos, ratings, or metrics; forced registration where the task does not need an account; nagging without a real "no"; cancellation harder than signup; free trials that silently convert without clear upfront terms and a reminder.

Legal backstops as of 2026-09 (not legal advice): EU DSA Art. 25 bans manipulative interface design on online platforms; California's Automatic Renewal Law (AB 2863, July 2025) requires online, at-will cancellation and clear renewal terms before billing; the US FTC enforces subscription and cancellation traps under ROSCA and Section 5 (its 2024 click-to-cancel rule was vacated in July 2025 and rulemaking restarted in 2026) and bans fake reviews (2024 rule); pre-ticked boxes are not GDPR consent. Details: `ux-principles` → `references/humane-design.md`.

The test: **would this still work if the user fully understood it?** If not, remove it.

## Core principles

1. **Clarity beats cleverness.** A visitor must know what it is, who it is for, and what to do next within about 5 seconds.
2. **Match the message to awareness.** Unaware visitors need the problem named; ready buyers need the price and the risk removed.
3. **Proof sized to the promise.** Every claim that matters has specific, real, verifiable evidence near it.
4. **Every field and step costs completions.** Ask only what this step needs; defer, infer, or drop the rest.
5. **Value before commitment.** Let people experience the product before signup, card, or upgrade whenever the product allows.
6. **Honest defaults and easy exits.** Defaults you would defend to the user; cancel as easily as signup.
7. **Measure activation and retention, not clicks.** Signups that never activate are cost, not conversion.

## Workflow

- [ ] **Frame**: buyer, trigger, awareness level, goal metric, traffic source, current baseline numbers if any.
- [ ] **Diagnose in order** (fix the earliest failing layer first): audience fit → message clarity (5-second test) → proof → friction (fields, steps, speed, mobile) → visual hierarchy. Polishing the button comes last.
- [ ] **Map the funnel**: every step from first visit to activation, with drop-off per step if data exists; pick the steepest drop.
- [ ] **Design the change** using the section rules below; write real copy in customer language.
- [ ] **Ethics pass**: check every mechanic against the ethics floor; replace failures with the honest alternative.
- [ ] **Performance and mobile pass**: LCP ≤ 2.5 s on mobile, tap targets, forms on a real phone.
- [ ] **Decide how to validate**: A/B test only with enough traffic for the sample size (table below); otherwise usability tests, 5-second tests, and before/after with care.

## Landing pages and heroes

**Hero checklist**
- Headline (≤ ~10 words) says what it does and for whom, in the customer's words, with a concrete outcome: "Close your books in 2 days, not 10" beats "The future of finance".
- Subhead (1–2 lines) names the audience and the mechanism (how it delivers the outcome).
- One primary CTA with an outcome verb, plus at most one secondary (demo, pricing, docs).
- A risk-reducer line under the CTA answering the top objection: "Free for 14 days. No card required." (only if true).
- A real product visual: screenshot, short muted loop, or interactive demo; never abstract blobs or stock people standing in for the product.
- Proof visible without scrolling far: recognizable customer logos, a rating with review count, or one specific result.

**Default page order**: hero → proof strip → problem / why now → how it works (only if truly a few steps) → key benefits with real product visuals (≤ 3 feature sections) → deeper proof (case study with numbers) → objections (security, integrations, migration) → pricing or a clear pricing link → FAQ answering the top objections → final CTA → substantive footer.

- **Message match**: a page reached from an ad or email repeats that promise in the headline and removes unrelated navigation.
- **Repeat the CTA** at natural decision points (after proof, after pricing, at the end), always the same label and destination.
- **Speed is conversion**: in a web.dev case study, Vodafone improved LCP by 31% and saw 8% more sales. Keep the hero image in initial HTML with high fetch priority, no client-rendered hero.
- **Mobile first**: most top-of-funnel traffic is mobile; single column, a sticky bottom CTA on long pages, forms of ≤ 3–5 fields.

## Awareness-level messaging

After Eugene Schwartz's five stages of awareness (*Breakthrough Advertising*, 1966):

| Visitor is… | Lead with | Hero angle | Proof that works |
|---|---|---|---|
| Unaware of the problem | The symptom they recognize | "Still reconciling invoices by hand every month?" | Diagnostic, checklist, relatable scenario |
| Problem-aware | The cost of the problem | "Manual reconciliation costs finance teams days each close" | Numbers, before/after |
| Solution-aware | How your approach differs | "Reconciliation that matches transactions automatically" | Honest comparison of approaches |
| Product-aware | Why you, specifically | "Why teams switch from X" | Case studies, demo, reviews |
| Most aware | The offer and the risk removal | "Start today. Import your data in 10 minutes." | Guarantee, trial terms, pricing clarity |

Most home pages serve a mix; lead for the dominant traffic and let sections serve the rest. Details and copy patterns: `references/landing-pages.md`.

## CTA rules

- **Verb + outcome**, ≤ ~4 words: "Start free trial", "Get the report", "Book a demo". Never "Submit", "Learn more" as the primary, or "Click here".
- **Answer three questions** near the button: what happens on click, how long it takes, what it costs or commits.
- **One visually dominant CTA per view**; secondary actions are visibly lighter. Two primaries means no primary.
- **Stage-appropriate commitment**: "See how it works" for early awareness, "Start free" for ready visitors, "Complete purchase" at checkout.
- **Same label, same destination** everywhere on the page.
- **Decline options are neutral** ("No thanks"), never shaming.

## Social proof: real only

- Specific beats generic: "Cut month-end close from 10 days to 3 (Finance lead, 40-person agency)" beats "Great product!".
- Attribute fully: name, role, company, photo, used with permission; link to the case study or review platform where possible.
- Ratings show the count and the source ("4.6 from 1,283 reviews on G2"); purchase likelihood peaks below a perfect 5.0, which reads as too good to be true (Spiegel Research Center, 2017), so never curate reviews to look flawless.
- Precise numbers ("2,317 teams") read as more credible than round ones, but only when they are true and current.
- Place proof next to the claim or the CTA it supports; put security and compliance proof near signup and payment.
- **Never fabricate** testimonials, logos, counts, or ratings. In mockups and demos, use obviously labeled placeholders ("[Customer quote]") and tell the user they must be replaced with real ones.

## Signup and forms

- **Field cost**: every extra field loses some people. Start from email (or social/passkey) plus password or magic link; defer name, company, role, phone, and use case to onboarding or infer them (company from email domain). Treat field-count benchmarks as directional; measure your own field-level drop-off.
- **Social and passwordless**: offer the providers your audience uses (Google, Microsoft, Apple for consumer; SSO for enterprise B2B) and passkeys; on iOS, apps offering third-party login must also offer a privacy-focused option (App Store Review Guideline 4.8), usually Sign in with Apple.
- **No confirm-email or confirm-password fields**; show/hide password, requirements shown upfront, paste allowed.
- **Qualification**: long forms are justified only for high-touch sales (demo requests), and even then 5–8 fields is the ceiling.
- **Errors** that route: "This email already has an account. Sign in?" with the link.
- **Verification**: let users continue into the product and verify later when risk allows; say where the email went, offer resend and change-email.
- Form mechanics (labels, validation timing, autocomplete): `interaction-design`. Signup specifics: `references/signup-onboarding.md`.

## Onboarding and activation

- **Define activation empirically**: the earliest action that separates retained users from churned ones (e.g. "created a project and invited a teammate"). Optimize the path to it, not tour completion.
- **Shorten time to value**: list every step between signup and activation; each is guilty until proven necessary. Move setup after the first win when possible.
- **Declare, don't administer**: a short "What do you want to do first?" question that personalizes the path is worth keeping; data collection that does not change the path is not.
- **First screen = one action**: never a blank dashboard. Use an empty state with one primary action, a template, or clearly labeled sample data.
- **Checklists**: 3–7 items ordered by value, quick win first, progress visible, dismissible, and gone when done. A step completed at signup can count as done (endowed progress; Nunes and Drèze, 2006).
- **Tours**: ≤ 3–5 steps, skippable, never repeated for returning users; prefer contextual hints triggered by behavior.
- **Permissions and notifications**: ask in context after value, with a pre-prompt explaining the benefit; never on first launch.
- **Celebrate the real activation moment** (peak-end rule), briefly, and show the next step.
- **Measure**: activation rate, time to activation, and D1/D7/D30 retention by cohort and signup source.

## Pricing pages and paywalls

- **3 tiers by default** (2–4 fine); highlight one "recommended" or "most popular" tier (only if true) and preselect it.
- **Show prices.** "Contact sales" is for the enterprise tier only. State currency, billing period, what "per seat" means, and whether tax is included.
- **Monthly/annual toggle**: default to the option most customers choose; show the annual total and the real saving ("€588/year, 2 months free"), not only the per-month equivalent.
- **Compare on one value axis** that customers understand (seats, projects, usage), then a full feature table with rows aligned across tiers; the most-valued features first.
- **Answer "which plan is right for me?"** with one-line "For…" descriptions per tier and an FAQ covering billing, trials, cancellation, refunds, and data.
- **Trials**: state length, what happens at the end, whether a card is required, and send a reminder before charging. Choose card-upfront or not by audience and fraud risk, not by headline conversion rate alone.
- **Paywalls and upgrade prompts** appear at the moment of value or at a real limit, never mid-task or during onboarding. Anatomy: what the user tried to do → what upgrading unlocks → price → CTA → **an escape hatch** ("Not now" / "Continue on Free") of real visibility. Cool down for days after a dismissal. Users can always see and export their own data, even over the limit.
- Details: `references/pricing-paywalls.md`.

## Checkout

Baymard's research puts average documented cart abandonment around 70%, and finds large sites can gain on the order of 35% conversion from checkout design fixes alone. Defaults:

- **Total cost early**: shipping, taxes, and fees visible in the cart (estimated if needed); no new charges at the last step.
- **Guest checkout** as a prominent option; offer account creation after purchase ("Save your details? Add a password").
- **Fewer fields**: Baymard's benchmark average is ~11 form fields while ~7–8 is achievable; billing = shipping by default; one "Full name" field; "Address line 2" and coupon code behind links; city/region from postcode where reliable.
- **Express wallets** (Apple Pay, Google Pay, Shop Pay, PayPal where relevant) above the form.
- **Card fields**: auto-format in groups, detect brand, numeric keyboard, physical-card order; visually enclose payment fields and put security reassurance there.
- **Delivery as dates** ("Arrives Thu 8 Oct") and a clear returns policy near the order summary.
- **Order summary visible** through every step; progress indicator; remove site navigation but keep help and returns info.
- **Errors keep all data**, point to the field, and explain the fix; payment declines suggest another method.
- Details: `references/checkout.md`.

## Cancel flows

- Reachable from account/billing settings in about as many steps as signup; online, at any time, no phone call or chat required.
- Optional, skippable one-question survey ("What's the main reason?") with free text.
- **At most one** relevant alternative (pause, downgrade, discount), shown alongside a prominent "Cancel subscription" button, never instead of it.
- Confirmation states the end date, what happens to data (export link), and whether any refund applies; send a confirmation email.
- Neutral tone; no guilt, no "Are you sure?" chains, no dark-styled cancel links.

## Experiments

- **Compute sample size before starting.** Per variant, at 95% confidence and 80% power (two-sided):

| Baseline conversion | Detect +10% relative | +20% relative | +50% relative |
|---|---|---|---|
| 2% | ~80,700 | ~21,100 | ~3,800 |
| 5% | ~31,200 | ~8,200 | ~1,500 |
| 10% | ~14,800 | ~3,800 | ~700 |
| 20% | ~6,500 | ~1,700 | ~300 |

- Run whole weeks (at least one to two full business cycles); do not stop when it "looks significant" unless you use a sequential testing method designed for peeking.
- One primary metric chosen upfront, plus guardrails (refunds, churn, support tickets, downstream activation).
- Check sample ratio mismatch (the split should match what you configured) before trusting results.
- **Low traffic?** Test bigger changes, test earlier in the funnel, or use qualitative methods (5-second tests, usability tests, interviews); five good interviews beat an underpowered test. Do not A/B test prices on low volume.
- Test ideas and templates: `references/landing-pages.md` and `references/pricing-paywalls.md`.

## Gotchas

- **Polishing visuals before fixing the message.** If people cannot say what it is after 5 seconds, a new button color will not help. Diagnose in order.
- **Inventing proof.** Agents fill testimonial and logo slots with plausible fakes. Use labeled placeholders and flag them.
- **Generic headlines.** "Supercharge your workflow" says nothing; name the outcome and the audience.
- **Two primary CTAs** ("Start trial" and "Book demo" at equal weight). Pick the primary for the dominant visitor.
- **Asking for everything at signup.** Role, company size, phone, and use case belong in onboarding, if anywhere.
- **Blank first-run dashboards.** Always an empty state with one action, a template, or labeled sample data.
- **Paywall mid-task or during onboarding.** Wait for value or a real limit, and always include a visible way out.
- **Hiding the annual total or renewal terms.** Show the real amount charged and when; it is required in many jurisdictions and reduces refunds.
- **Retention "offers" that block cancellation.** One offer, beside a prominent cancel button, is the ceiling.
- **Declaring A/B winners early.** Peeking without a sequential method inflates false positives; respect the sample size.
- **Optimizing signups instead of activation.** A change that adds signups but lowers activation or raises refunds is a loss.
- **Slow landing pages.** Heavy hero videos and client-rendered heroes cost real conversions; budget LCP.

## Output format

For a page or flow, deliver the design or code plus:

```
Goal: <conversion event> · Audience: <buyer, trigger> · Awareness: <stage> · Source: <traffic>
Diagnosis (earliest failing layer first): <layer — evidence>
Changes (by expected impact): <change — why — how to measure>
Copy: <headline, subhead, CTA, risk-reducer, key microcopy>
Proof used: <real sources> · Placeholders to replace: <list>
Ethics check: pass / <mechanics removed and replacements>
Validation plan: <A/B with sample size and duration | qualitative method>
```

For audits, group findings as **Fix now** (broken or blocking), **High impact**, **Test ideas**, each with evidence (Observed / Inferred / Not checked).

## References

| File | Read when |
|---|---|
| `references/landing-pages.md` | Writing or restructuring a landing or home page: hero variants, section patterns, copy formulas per awareness level, proof placement, landing-page test ideas. |
| `references/signup-onboarding.md` | Designing signup/login, verification, first-run experience, activation metrics, checklists, empty states for new accounts, trial onboarding. |
| `references/pricing-paywalls.md` | Designing a pricing page, plan table, trial terms, upgrade prompts, usage limits, paywalls, or a cancel flow. |
| `references/checkout.md` | Building or auditing a cart or checkout: fields, payment, shipping, errors, trust, mobile checkout. |
| `references/psychology.md` | Using or reviewing a persuasion mechanism (anchoring, defaults, social proof, loss aversion, goal-gradient) and checking where honest use ends; companion skill recommendations. |

Companion skills from other repositories, for marketing work beyond product UX: **marketingskills** (https://github.com/coreyhaines31/marketingskills, MIT) covers CRO, copywriting, pricing strategy, churn, and A/B testing in depth; **revenue-centric-design** (https://github.com/heliocosta-dev/revenue-centric-design) is a principle library connecting design decisions to revenue (source-available license with use restrictions; read it before adopting).

## Related skills

- `ux-principles` — the laws, heuristics, and the full dark-pattern and legal reference.
- `interaction-design` — form mechanics, validation, states, and microcopy used in every flow here.
- `design-taste` — a distinctive visual direction so the page does not look like a template.
- `web-platform` — Core Web Vitals, image and font loading, metadata for landing pages.
- `design-foundations` — hierarchy, type, and color that make the primary action stand out.
