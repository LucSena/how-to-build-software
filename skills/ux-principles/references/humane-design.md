# Humane design, dark patterns, and the legal floor

Use this whenever a feature touches consent, data, notifications, subscriptions, cancellation, feeds, social interaction, or any persuasion mechanic. The test for every pattern: **would it still work if the user fully understood it?** If not, it is a dark pattern.

## Contents
- Humane by Design: 7 principles with patterns
- Dark pattern catalog (never build)
- Positive friction: when to slow users down
- Notifications and permissions
- Legal landscape (as of 2026-09)

---

## Humane by Design: 7 principles

| Principle | Means | Ship this |
|---|---|---|
| **Transparent** | Clear about intentions, honest in actions, free of dark patterns | Privacy copy at the point of collection ("We use your phone number only for sign-in codes"); data export; account deletion reachable in Settings in a few steps; one-click unsubscribe |
| **Resilient** | Protects the most vulnerable; anticipates abuse | Block, mute, report, and visibility controls on day one of any social or UGC feature; threat-model stalking (location), harassment (DMs), and impersonation |
| **Empowering** | Augments people's abilities without dictating their rhythm; value to people over revenue | User control over defaults, notification cadence, data, and algorithmic feeds (e.g. a chronological option) |
| **Finite** | Bounds the experience; prioritizes meaningful content | "You're all caught up" markers; "Load more" instead of endless auto-refill; no autoplay-next by default |
| **Inclusive** | Draws on the full range of human diversity | Single "Full name" field; optional and non-binary gender; no assumptions about family, address, or name structure; WCAG 2.2 AA; RTL support |
| **Intentional** | Uses friction to prevent abuse and support healthier habits | Speed bumps before irreversible or viral actions; privacy-protective defaults |
| **Respectful** | Prioritizes people's time, attention, and well-being | Notifications matched to urgency and configurable per category and channel; quiet hours; digests for non-urgent items |

---

## Dark pattern catalog (never build)

### Do not confirmshame
**Rule.** Decline options use neutral language.
**Apply when.** Any opt-out, dismiss, or "no" choice: popups, upsells, cancel flows, newsletter prompts.
**Do / Avoid.** Do: "No thanks". Avoid: "No, I prefer paying full price", "I don't care about my security".
**Why.** Guilt framing pressures a decision the user already made; regulators list it as manipulative design (DSA Recital 67 covers interfaces that pressure choices).

### Do not preselect consent or add-ons
**Rule.** Consent, marketing, and paid add-on checkboxes default to unchecked; "Reject all" is as prominent and as easy as "Accept all".
**Apply when.** Cookie banners, signup forms, checkout extras (insurance, donations, subscriptions).
**Do / Avoid.** Do: two equal buttons, "Accept all" and "Reject all", plus "Customize". Avoid: a bright "Accept" and a grey "Manage settings" link, or a pre-ticked newsletter box.
**Why.** Default bias turns preselection into decisions users never made; pre-ticked boxes are not valid GDPR consent (CJEU, Planet49, 2019).

### Do not hide or drip costs
**Rule.** Show the all-in price (taxes where known, fees, shipping) as early as possible, and never add charges at the last step.
**Apply when.** Product pages, carts, booking flows, subscription signups, "free" trials that convert to paid.
**Do / Avoid.** Do: "€49/month, billed annually (€588). Renews automatically; cancel anytime in Settings." Avoid: a "service fee" first shown on the payment step.
**Why.** Unexpected extra costs are the top reason for checkout abandonment in Baymard's surveys, and drip pricing is a regulatory target in the US and EU.

### Do not obstruct cancellation (roach motel)
**Rule.** If users can sign up online, they can cancel online, from an obvious place, in roughly as many steps as signup.
**Apply when.** Subscriptions, memberships, free trials with auto-renewal, account deletion.
**Do / Avoid.** Do: Settings → Billing → "Cancel subscription" → optional one-question survey → confirm, with one save offer at most, shown next to a prominent cancel button. Avoid: "call us to cancel", chat-only cancellation, repeated "are you sure?" screens, hiding the button below the fold of a retention page.
**Why.** California's Automatic Renewal Law (AB 2863) requires online, at-will cancellation; the FTC pursues cancellation obstacles under ROSCA; DSA Recital 67 names cancellation harder than signup.

### Do not force registration
**Rule.** Let people try, buy, or read before creating an account when the task does not require one.
**Apply when.** E-commerce checkout, trying a tool, reading content, using a calculator or free tool.
**Do / Avoid.** Do: guest checkout, then "Save your details for next time? Just add a password" on the confirmation page. Avoid: an account wall before the cart.
**Why.** Forced account creation is a leading cause of abandonment (Baymard), and delaying signup until after value is shown improves activation.

### Do not fake urgency, scarcity, or activity
**Rule.** Show countdowns, stock levels, and "others are viewing" only when true and generated from real data.
**Apply when.** Sales, booking, pricing pages, checkout.
**Do / Avoid.** Do: "Sale ends Sunday 23:59 CET" when it truly ends then; "2 rooms left at this price" from inventory. Avoid: timers that reset on reload, random "12 people are looking at this".
**Why.** Fabricated scarcity is deception, not persuasion; regulators treat false urgency claims as unfair commercial practices.

### Do not fabricate social proof
**Rule.** Testimonials, ratings, logos, and usage numbers are real, attributable, and current.
**Apply when.** Landing pages, pricing, app stores, marketplaces.
**Do / Avoid.** Do: named quote with role and company, used with permission; review counts from the actual platform. Avoid: invented quotes, stock-photo "customers", logos of companies that are not customers.
**Why.** Fake reviews are illegal in many markets (the FTC's 2024 rule on fake reviews and testimonials) and destroy trust when found. Demo content must be labeled as placeholder.

### Do not nag without a real "no"
**Rule.** Every repeated prompt (rating, notifications, upgrade, feature promo) has "Not now" that is respected for days, and "Don't ask again".
**Apply when.** Permission prompts, upsells, surveys, app-rating prompts.
**Do / Avoid.** Do: ask once in context, wait at least days after a dismissal, cap per session. Avoid: showing the same modal every launch.
**Why.** Repeatedly asking to reconsider a settled choice is named in DSA Recital 67; nagging burns the goodwill later prompts depend on.

### Do not disguise or trick
**Rule.** Ads look like ads; buttons say what they do; no double negatives; decline options are not styled as faint links.
**Apply when.** Consent, settings toggles, email preference centers, download pages.
**Do / Avoid.** Do: "Email me product updates" (checkbox, unchecked). Avoid: "Uncheck this box if you prefer not to not receive updates"; a big "Download" button that is an ad.
**Why.** The pattern works only through misunderstanding, which is the definition of deceptive design.

### Do not build engagement traps
**Rule.** Do not design loops that work against the user's own goals: autoplay-next without a setting, feeds without stopping points, streak mechanics that punish breaks, variable-reward pull-to-refresh as a slot machine.
**Apply when.** Feeds, media, social, games, habit and learning apps.
**Do / Avoid.** Do: end-of-feed markers, user-controlled autoplay, streak freezes, reminders the user sets. Avoid: infinite auto-refill with no pause point, guilt notifications ("Your streak is dying!").
**Why.** Humane design's "finite" principle; addictive design is an active EU regulatory topic (the proposed Digital Fairness Act).

### Do not "privacy-zucker"
**Rule.** Privacy-protective defaults; ask for data only when needed, and explain why at the point of collection.
**Apply when.** Onboarding, profile setup, contact import, location, analytics consent.
**Do / Avoid.** Do: location "While using the app" asked when the user taps "Find nearby". Avoid: importing all contacts by default, public-by-default profiles.
**Why.** Consent obtained by confusion is not informed consent (GDPR), and users who feel tricked leave.

---

## Positive friction: when to slow users down

Friction is not always bad. Add a deliberate speed bump when an action is irreversible, affects others, or is likely to be regretted:

| Situation | Speed bump |
|---|---|
| Deleting a project, repository, or account | Type the name to confirm; state exactly what is lost; offer export first |
| Sending to many people (bulk email, broadcast) | Preview with recipient count and a sample; "Send test to me" |
| Sharing a link the user did not open | "You haven't opened this article. Read before sharing?" with Share anyway |
| Posting something with sensitive info detected | Inline warning before posting |
| Large payment or transfer | Summary screen with amount, recipient, and fees; confirm |

Speed bumps protect users; they are not a license to add friction to cancellation, unsubscribe, or privacy choices.

---

## Notifications and permissions

- **Ask in context, after value.** Request a permission when the user starts the action that needs it, with a short pre-prompt explaining the benefit. Never on first launch.
- **Match delivery to urgency.** Security and transactional events may push; social and marketing default to in-app or digest.
- **Per-category controls** (what, which channel, when); quiet hours respect time zones.
- **Marketing is opt-in.** Transactional messages must not be used to carry marketing the user declined.
- **Denied is a valid answer.** The product keeps working with a clear path to enable it later in Settings.

---

## Legal landscape (as of 2026-09, not legal advice)

| Jurisdiction | Rule | What it means for UI |
|---|---|---|
| EU | **Digital Services Act, Art. 25** (applies to online platforms since 17 Feb 2024) | Interfaces must not deceive, manipulate, or materially distort users' free and informed decisions. Recital 67 examples: giving more prominence to one choice, repeatedly asking to reconsider a choice already made, making cancellation harder than signup, defaults that are hard to change. |
| EU | **GDPR consent** (Art. 4(11), Art. 7); CJEU *Planet49* (C-673/17, 2019) | Consent must be freely given, specific, informed, unambiguous; pre-ticked boxes are not consent. Regulators expect refusing to be as easy as accepting. |
| EU | **Digital Fairness Act** (Commission proposal expected in 2026) | Expected to target addictive design, subscription traps, and cancellation symmetry. Design to "cancel as easily as you subscribed" now. |
| US (federal) | **FTC Act Section 5** and **ROSCA** | Negative-option (auto-renew) offers need clear disclosure of terms before billing info, express informed consent, and a simple cancellation mechanism. The FTC's 2024 "click-to-cancel" Negative Option Rule was vacated by the 8th Circuit on 8 July 2025 on procedural grounds; the FTC reopened rulemaking in 2026 and keeps enforcing the same principles case by case. |
| US (federal) | **FTC rule on fake reviews and testimonials** (2024) | Fabricated or AI-generated fake reviews and undisclosed insider reviews are prohibited. |
| US (California) | **Automatic Renewal Law as amended by AB 2863** (in force 1 July 2025) | If signup is online, cancellation must be available online, at will, via a prominent link or button, without obstructive steps. A save offer may be shown only alongside a prominent cancel option. Covers free-to-paid conversions. |
| App stores | Apple App Store Review Guidelines (3.1.2 subscriptions) and Google Play subscription policy | Subscription terms, price, and renewal must be clear before purchase; cancellation paths follow platform rules. |

When in doubt, design to the strictest rule you ship into; symmetric, honest flows satisfy all of them.

## Sources

- Humane by Design (Jon Yablonski), principles: https://humanebydesign.com/principles and https://humanebydesign.com/garden/embrace-friction
- Deceptive design pattern taxonomy (Harry Brignull): https://www.deceptive.design/types
- EU Digital Services Act, Regulation (EU) 2022/2065, Art. 25 and Recital 67: https://eur-lex.europa.eu/eli/reg/2022/2065/oj
- CJEU, Planet49 (C-673/17): https://curia.europa.eu/juris/liste.jsf?num=C-673/17
- European Parliament Legislative Train, Digital Fairness Act: https://www.europarl.europa.eu/legislative-train/theme-protecting-our-democracy-upholding-our-values/file-digital-fairness-act
- FTC, Negative Option Rule page: https://www.ftc.gov/legal-library/browse/rules/negative-option-rule
- Sidley, "U.S. FTC Click-to-Cancel Rule Struck Down" (July 2025): https://www.sidley.com/en/insights/newsupdates/2025/07/us-ftc-click-to-cancel-rule-struck-down
- Sidley, "FTC Signals Renewed Interest in Click-to-Cancel Rulemaking" (Feb 2026): https://www.sidley.com/en/insights/newsupdates/2026/02/us-ftc-signals-renewed-interest-in-click-to-cancel-rulemaking
- California AB 2863 bill text: https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240AB2863
- FTC, final rule banning fake reviews and testimonials (Aug 2024): https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials
- Baymard Institute, cart abandonment reasons: https://baymard.com/lists/cart-abandonment-rate
