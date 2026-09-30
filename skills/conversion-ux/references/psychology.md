# Persuasion psychology, used honestly

Behavioral mechanisms explain why some designs convert better. Each one has an honest use (it helps people act on something they already want) and a manipulative use (it works because people misunderstand or are pressured). This file maps both. If you cannot name the honest version, do not use the mechanism.

## Contents
- Diagnosing why an action does not happen
- Mechanism map: honest vs. manipulative use
- Problem → mechanism quick map
- Rules for using mechanisms
- Companion skills

---

## Diagnosing why an action does not happen

Use the Fogg Behavior Model: a behavior happens when **Motivation**, **Ability**, and a **Prompt** are present at the same moment (B = MAP).

| Missing | Symptom | Fix |
|---|---|---|
| Motivation | Users understand the step but do not care | Clarify the outcome and value; show proof; connect the step to the goal they came for |
| Ability | Users want to but find it hard or slow | Remove fields, steps, and decisions; defaults, templates, autofill, wallets, passkeys |
| Prompt | Users would, but nothing asks at the right moment | A clear CTA in context, at the moment of need, not a generic reminder |

Most conversion problems are ability problems. Fix those before trying to raise motivation.

## Mechanism map

| Mechanism | Honest use | Manipulative use (never) |
|---|---|---|
| **Hick's law / choice overload** | Fewer options, a recommended default, filters | Hiding the option users want (e.g. the cheaper plan) |
| **Fitts's law** | Big, reachable primary action | Tiny or distant decline and cancel controls |
| **Von Restorff** | One visually distinct primary action | Styling "Accept all" bright and "Reject" as grey text |
| **Default effect** | Preselect what most people choose and would endorse (recommended plan, billing = shipping) | Pre-ticked consent, marketing opt-ins, add-ons, auto-renewal buried in terms |
| **Anchoring** | Show a higher tier so the value of the middle tier is clear | Fake "was" prices, inflated reference prices |
| **Decoy effect** | Structure tiers so the best-fit plan is easy to see | Plans that exist only to trick, with no real buyer |
| **Social proof** | Real, specific, attributed testimonials and counts near the claim | Invented reviews, "3 people viewing" that is not real, bought reviews |
| **Authority** | Real certifications, expert endorsements with permission | Fake badges, implied endorsements |
| **Scarcity / urgency** | Real stock levels and real deadlines | Countdown timers that reset, perpetual "last chance" |
| **Loss aversion / framing** | Show what the user keeps or has built ("47 reports created") at upgrade or cancel | Guilt and fear copy, confirmshaming, threatening data loss that will not happen |
| **Goal-gradient / endowed progress** | Progress bars, "2 of 5 done", counting completed signup as step 1 | Adding steps after commitment, fake progress |
| **Zeigarnik effect** | A visible, dismissible setup checklist | Invented incomplete tasks to nag users back |
| **Commitment and consistency** | Start with a small, useful step (create one project) | Foot-in-the-door toward something the user did not choose |
| **Reciprocity** | Give real value first (free tool, template, free tier) | "Free" gifts with hidden obligations |
| **Peak-end rule** | Design the success moment and a clean ending | Masking a painful process with a flashy ending |
| **IKEA / endowment effect** | Let users customize early so the product feels theirs | Holding user-created data hostage at cancellation |
| **Choice-supportive bias** | Reinforce a good decision after purchase with a clear next step | Discouraging refunds users are entitled to |
| **Curse of knowledge** | Test copy with newcomers; plain language | — |
| **Activation energy** | Pre-fill, templates, one-click first action | — |

## Problem → mechanism quick map

| Problem | Look first at |
|---|---|
| Visitors do not start | Clarity (5-second test), CTA prominence (Von Restorff, Fitts), a risk-reducer line |
| Visitors cannot decide between options | Choice overload, recommended default, one comparison axis |
| Signups do not activate | Activation energy, goal-gradient checklist, time to first value |
| Users drop mid-flow | Ability (fields, steps), progress visibility, saved progress |
| Price objections | Anchoring with honest tiers, "do the math" totals, value framing, guarantees |
| Users forget to come back | Prompts at the right time, with consent; value summaries |

## Rules for using mechanisms

1. **Name the mechanism and the honest version** in the design rationale. "Default: annual billing, because most of our customers choose it and the saving is shown" is defensible; "Default: annual, it converts better" is not enough.
2. **Only true claims.** Scarcity, urgency, proof, and savings must come from real data at render time.
3. **Symmetric choices** for consent and cancellation: equal prominence and equal effort for yes and no.
4. **Measure downstream harm**: refunds, chargebacks, complaints, cancellations, and support tickets are guardrail metrics on every persuasion experiment.
5. **Apply the understanding test**: would the design still work if the user fully understood it? If not, it is a dark pattern (see `ux-principles`).

## Companion skills

For marketing work outside product UX (ads, SEO, email, positioning, pricing strategy research, churn analytics), these external skill collections go deeper:

- **marketingskills** by Corey Haines (MIT): https://github.com/coreyhaines31/marketingskills — CRO, signup, onboarding, paywalls, pricing, churn prevention, A/B testing, marketing psychology, and copywriting skills. Several of the field, onboarding, and paywall defaults in this skill are adapted from it.
- **revenue-centric-design** by Richard (@richardrx): https://github.com/heliocosta-dev/revenue-centric-design — a library of design principles tied to revenue outcomes, organized as a router plus themed references. It is source-available under a custom license with attribution and field-of-use restrictions; read the license before installing or adapting it. No text from it is included here.

When combining them with this skill, keep this collection's ethics floor: some growth tactics published elsewhere cross into lock-in or compulsive-use design, which this collection does not recommend.

## Sources

- BJ Fogg, Fogg Behavior Model: https://behaviormodel.org/
- Laws of UX (Hick, Fitts, Von Restorff, goal-gradient, Zeigarnik, peak-end): https://lawsofux.com/
- growth.design, "Psychology of Design" (cognitive biases in UX): https://growth.design/psychology
- Robert Cialdini, *Influence: The Psychology of Persuasion* (reciprocity, commitment, social proof, authority, scarcity).
- Dan Ariely, *Predictably Irrational* (2008), anchoring and decoy effect.
- Daniel Kahneman and Amos Tversky, "Prospect Theory" (1979), loss aversion: https://doi.org/10.2307/1914185
- Joseph C. Nunes and Xavier Drèze, "The Endowed Progress Effect" (2006): https://doi.org/10.1086/500480
- Deceptive design patterns catalog: https://www.deceptive.design/types
- marketingskills `marketing-psychology` skill (MIT): https://github.com/coreyhaines31/marketingskills/tree/main/skills/marketing-psychology
