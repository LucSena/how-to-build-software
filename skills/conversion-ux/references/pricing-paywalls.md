# Pricing pages, paywalls, and cancel flows

## Contents
- Pricing page structure
- Plan table rules
- Billing period, currency, and tax
- Anchoring and decoys, honestly
- Trials and renewal terms
- Upgrade prompts and paywalls
- Usage limits
- Cancel flows
- Pricing and paywall test ideas

---

## Pricing page structure

Top to bottom: headline naming the value ("Simple pricing that grows with your team") → billing toggle → plan cards (3 by default) → "All plans include…" strip → full comparison table → enterprise/contact block → FAQ (billing, trials, cancellation, refunds, data, security) → final CTA → proof near decision points (logos, rating, a short testimonial about value for money).

## Plan table rules

### Default to three plans with one recommended
**Rule.** Show 3 plans (2–4 acceptable), highlight one as recommended, and preselect it where a selection exists.
**Apply when.** Self-serve SaaS and subscriptions.
**Do / Avoid.** Do: Starter / Team (recommended) / Business, plus "Enterprise: contact us". Avoid: 6 plans with overlapping features, or a "recommended" badge on the plan that is only best for you.
**Why.** Choice overload slows and weakens decisions; a clearly labelled default helps most people choose, as long as it really fits most people.

### Compare on one value axis customers understand
**Rule.** Plans differ primarily along one metric the customer already thinks in (seats, projects, contacts, usage), then features.
**Apply when.** Designing tiers and plan cards.
**Do / Avoid.** Do: "Up to 10 users · 50 GB · Priority support". Avoid: mixing "10k tokens" on one plan with "priority queue" on another so plans cannot be compared.
**Why.** Recognition over recall: users compare aligned rows instantly; mismatched axes force mental math.

### Write "for whom" on each plan
**Rule.** Each plan has a one-line audience description.
**Apply when.** Every plan card.
**Do / Avoid.** Do: "For freelancers sending a few invoices a month". Avoid: bare plan names.
**Why.** Answers "which plan is right for me?", the most common pricing-page question.

More table rules:
- Card anatomy: name · for-whom line · price (large, tabular numerals) with period and unit ("€12 per user / month, billed annually") · primary CTA · 3–5 key inclusions ("Everything in Starter, plus…").
- Comparison table: sticky plan header while scrolling, same row order in every column, most-valued features first, checkmarks with text alternatives, tooltips for jargon, grouped sections.
- Do the math: show totals where the unit price hides the real cost ("5 users = €60/month").
- Enterprise: list what is included (SSO, SLAs, invoicing, security review) rather than only "Contact us".
- Use the same CTA label pattern across plans ("Start free trial" / "Start free trial" / "Contact sales"), with the recommended plan's button visually primary.

## Billing period, currency, and tax

- Default the toggle to the period most customers pick; if annual is the default, show the annual total next to the per-month equivalent ("€10/month, €120 billed yearly").
- State savings honestly ("Save 17%" or "2 months free", computed from actual prices).
- Localize currency where you actually charge in it; do not show converted prices you will not charge.
- Say whether prices include VAT/sales tax; B2C in the EU generally expects tax-inclusive prices.
- Per-seat pricing explains how seats are counted and billed when added or removed.

## Anchoring and decoys, honestly

- A higher tier makes the middle tier look reasonable (anchoring), and an option that is clearly dominated can steer choice (decoy effect, e.g. Ariely's print-plus-web example). Use these only with plans that are genuinely useful to someone and honestly priced.
- Order plans consistently (low → high, left → right) so users are not tricked by position.
- Never show crossed-out "was" prices that were never charged, or permanent "limited-time" discounts.
- Do not A/B test prices on low traffic; use willingness-to-pay research (for example Van Westendorp surveys or customer interviews) instead.

## Trials and renewal terms

- On the plan card and at checkout, state: trial length, whether a card is needed, the price after the trial, the renewal period, and how to cancel.
- Before the first charge, notify the user (days before for monthly, longer for annual) with the amount, date, and a cancel link.
- Free-to-paid conversions count as automatic renewals under laws such as California's ARL: clear disclosure before billing info, affirmative consent, and online cancellation.
- Trial-ending messages summarize value received ("12 invoices sent, €8,400 collected") and say exactly what happens if they do nothing.

## Upgrade prompts and paywalls

**Triggers, in order of acceptability**
1. The user tries a paid feature → feature gate.
2. The user hits a real usage limit → limit prompt.
3. Trial is ending → trial-end screen and email.
4. Time-based reminders → rarely, easy to dismiss.

**Never** during onboarding before the first value, in the middle of a task, or on app launch every session.

**Paywall anatomy**
- Headline naming what they tried to do: "Export to PDF is on Pro".
- What upgrading unlocks, shown (preview, before/after), not only told.
- Plan comparison with the current plan marked.
- Price with period; annual option.
- Primary CTA ("Upgrade to Pro").
- **Escape hatch** as a real button: "Not now", "Continue on Free", or an alternative ("Delete a project to stay on Free").
- Optional short proof.

**Frequency and respect**
- Cap prompts per session; after a dismissal, cool down for days, not minutes.
- Never hide the close button, delay its appearance, or style it to be missed.
- After upgrade: immediate access, confirmation and receipt, and a pointer to the unlocked feature.
- Users can always view and export their own data, even when over a limit or after downgrade.

## Usage limits

- Show usage before the limit ("8 of 10 projects") in context and in settings; warn at a threshold (e.g. 80%).
- At the limit, block only new additions, never access to existing work; explain the options (upgrade, archive, delete).
- For metered billing, show current period usage and projected cost; alert before overages; offer hard caps.

## Cancel flows

**Structure**

```
Settings → Billing → [Cancel subscription]
  → (optional, skippable) "What's the main reason?" radio list + free text
  → (optional, at most one) relevant alternative shown next to a prominent [Cancel subscription] button
       reason "too expensive" → downgrade or discount
       reason "not using it now" → pause 1–3 months
       reason "missing feature" → workaround or roadmap note
  → Confirmation: access ends on <date>, data kept until <date>, [Export data], refund policy
  → Confirmation email with the same facts
```

**Rules**
- Cancel online, at any time, from an obvious place, in roughly the same effort as signup; no phone call, chat, or email required.
- One save offer at most, never replacing the cancel button; no multi-page mazes.
- Neutral copy: "Cancel subscription" / "Keep subscription"; no guilt ("Your team will be disappointed").
- Pause and downgrade are options, not obstacles.
- Win-back later only with consent to marketing email.

## Pricing and paywall test ideas

- Plan count (3 vs 4), which plan is highlighted, plan order.
- Annual vs monthly as default (measure refunds and churn, not only conversion).
- Showing the annual total vs per-month equivalent.
- Feature-gate copy and preview style.
- Trial length and card requirement (evaluate on paid conversion and retention, not trial starts).
- Value-summary content on trial-ending screens.

## Sources

- Laws of UX, "Choice Overload" and "Hick's Law": https://lawsofux.com/choice-overload/ ; https://lawsofux.com/hicks-law/
- Dan Ariely, *Predictably Irrational* (2008), decoy effect (The Economist subscription example).
- California AB 2863 (automatic renewal, online cancellation): https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240AB2863
- FTC, Negative Option Rule page and enforcement under ROSCA: https://www.ftc.gov/legal-library/browse/rules/negative-option-rule
- EU Digital Services Act Art. 25 and Recital 67: https://eur-lex.europa.eu/eli/reg/2022/2065/oj
- marketingskills `pricing`, `paywalls`, and `churn-prevention` skills (MIT; paywall anatomy, trigger points, cancel-flow structure): https://github.com/coreyhaines31/marketingskills
