# Landing pages

## Contents
- Diagnose before redesigning
- Hero patterns
- Copy formulas by awareness level
- Section patterns
- Proof: types and placement
- Page types
- Performance and mobile
- Landing-page test ideas
- Audit checklist

---

## Diagnose before redesigning

Work down this cascade and stop at the first layer that fails; fixing a lower layer while a higher one is broken wastes effort.

1. **Audience fit**: is the traffic the right buyer? Check source, keyword, and ad promise. A perfect page cannot convert the wrong audience.
2. **Message clarity**: run a 5-second test with 5–10 target users: "What is it? Who is it for? What would you do next?" If fewer than most answer correctly, rewrite the hero.
3. **Proof**: is there enough credible, specific evidence for the size of the promise and the awareness stage?
4. **Friction**: fields, steps, load time, broken mobile layout, surprise requirements (card, call).
5. **Visual hierarchy**: can a scanner find the primary CTA and the key message?

Also watch 5–10 session recordings of visitors who left, and read support tickets and sales-call notes for the real objections and vocabulary. Do not copy a competitor's page: its conversion comes from research you cannot see.

## Hero patterns

| Pattern | When | Notes |
|---|---|---|
| **Split hero**: copy left, product right | Default for SaaS and tools | Real screenshot or short muted loop; crop to the part that shows the outcome |
| **Product-first**: large interactive demo or UI below a short headline | Product is visual or self-explanatory (design tools, editors) | Keep the headline and CTA above the demo |
| **Outcome-first**: big result statement, proof metric, CTA | Strong, verifiable results | The number must be real and attributable |
| **Problem-first**: names the pain | Unaware or problem-aware traffic | Move to the solution within the first scroll |
| **Developer-first**: headline plus install command or code snippet | Dev tools, APIs | `npm i` or `npx` one-liner, link to docs as secondary CTA |

Hero anatomy: headline (≤ ~10 words) · subhead (audience + mechanism, 1–2 lines) · primary CTA · secondary CTA (lighter) · risk-reducer line · proof element · product visual.

## Copy formulas by awareness level

| Stage | Headline pattern | Example |
|---|---|---|
| Unaware | Name the symptom in their words | "Still chasing clients for signatures over email?" |
| Problem-aware | Cost or consequence of the problem | "Unsigned contracts delay revenue by weeks" |
| Solution-aware | Your approach vs. alternatives | "Contracts that sign themselves, not another PDF tool" |
| Product-aware | Differentiator + proof | "Why 2,000 agencies moved from DocuSign" (only if true) |
| Most aware | Offer + risk removal | "Send your first contract in 5 minutes. Free for 14 days." |

General formulas (use customer language, keep it specific):
- "Get [outcome] without [pain]."
- "[Outcome] in [timeframe] for [audience]."
- "The [category] for [specific audience] who [specific situation]."

Replace vague words: "powerful", "seamless", "all-in-one", "next-gen", "supercharge", "unlock" → a concrete capability or result.

## Section patterns

- **Proof strip** directly under the hero: recognizable logos (with permission) or a rating with source and count.
- **Problem / why now**: 2–3 sentences or bullets in the customer's words; optional before/after.
- **How it works**: 3 steps only if the product truly works in 3 steps.
- **Benefits with product visuals**: one benefit per section, headline states the benefit, visual shows the feature delivering it; ≤ 3 such sections, alternating layout or a bento grid with unequal cells.
- **Deeper proof**: one case study with a named customer, a number, and a timeframe.
- **Objections**: security and compliance (B2B), integrations, migration effort, support, data ownership.
- **Pricing**: visible prices or a clear link; at least a starting price.
- **FAQ**: the top 5–8 real objections, answered plainly (billing, cancellation, data, setup time).
- **Final CTA**: restate the outcome and the risk-reducer.
- **Footer**: docs, changelog, status, security, contact, legal. A living changelog is itself proof of momentum.

## Proof: types and placement

| Type | Strongest for | Place |
|---|---|---|
| Customer logos | Product-aware B2B visitors | Under the hero |
| Specific testimonial (name, role, company, photo, result) | All stages | Next to the claim it supports |
| Case study with numbers | Solution- and product-aware | Mid-page, linked to full story |
| Review-platform rating with count | Product-aware, consumer | Near CTA and pricing |
| Usage numbers ("2,317 teams") | Early stages, social validation | Hero or proof strip |
| Security/compliance badges (SOC 2, ISO 27001, GDPR) | B2B, payment steps | Near signup, pricing, and checkout |
| Guarantee (refund, cancel anytime) | Most aware | Under the CTA |
| Live demo / sandbox | Skeptical technical buyers | Hero or secondary CTA |

All proof must be real, current, and used with permission. In prototypes, use bracketed placeholders ("[Customer logo]", "[Quote from a real customer]") and tell the user to replace them.

## Page types

| Page | Goal | Specific rules |
|---|---|---|
| Home page | Route mixed visitors | Serve both "ready to buy" (CTA, pricing) and "researching" (how it works, proof); navigation stays |
| Paid-traffic landing page | One conversion | Message match with the ad; remove site navigation; single CTA repeated |
| Feature page | Show one capability | Feature → benefit → proof → CTA; link to docs |
| Comparison / alternative page | Win switchers | Honest comparison table; acknowledge where the competitor is better; migration help |
| Pricing page | Choose a plan | See `pricing-paywalls.md` |
| Waitlist / pre-launch | Collect intent | Email only; say what they get and when; no fake "spots left" |

## Performance and mobile

- Marketing LCP ≤ 2.5 s at p75 on mobile (aim lower); hero image in HTML with `fetchpriority="high"` and dimensions; no lazy-loading above the fold; hero never client-rendered.
- Replace autoplaying hero video with a poster image plus a muted, short, compressed loop; respect `prefers-reduced-motion` and data-saver.
- Mobile: single column, 16 px+ body text, sticky bottom CTA on long pages, tap targets ≥ 44 px, forms tested on a real phone.
- Third-party scripts (chat, analytics, A/B tools) are the most common LCP and INP regressions; load them after interaction or idle.

## Landing-page test ideas

Test big levers first; small cosmetic tests rarely reach significance on normal traffic.

- Headline angle (outcome vs. problem vs. differentiator) matched to the traffic's awareness.
- Product visual: static screenshot vs. short loop vs. interactive demo.
- CTA offer: trial vs. demo vs. freemium signup; risk-reducer line present vs. absent.
- Proof type and position (logos vs. case-study metric in hero).
- Page length: short vs. long with objection handling (long often wins for complex or expensive products).
- Pricing visibility on the landing page.
- Form length on the landing page (email only vs. email + name).

## Audit checklist

- [ ] 5-second test passes (what, who, next step).
- [ ] Headline specific, in customer language, ≤ ~10 words; subhead names audience and mechanism.
- [ ] One primary CTA per view with outcome verb; repeated consistently.
- [ ] Risk-reducer near CTA, true.
- [ ] Real product visual in the hero.
- [ ] Proof real, specific, attributed, placed near claims and CTAs.
- [ ] Top objections answered (FAQ, security, pricing clarity).
- [ ] No dark patterns (fake urgency, shaming declines, hidden costs).
- [ ] LCP ≤ 2.5 s on mobile; no layout shift from hero media.
- [ ] Message matches each major traffic source.

## Sources

- Eugene M. Schwartz, *Breakthrough Advertising* (1966), five stages of awareness.
- web.dev case study, Vodafone (LCP and sales): https://web.dev/case-studies/vodafone
- web.dev, Core Web Vitals thresholds: https://web.dev/articles/vitals
- marketingskills `cro` skill (MIT; CRO analysis order, page-type rules): https://github.com/coreyhaines31/marketingskills/tree/main/skills/cro
- Anthropic `frontend-design` skill (Apache-2.0; specific copy over generic claims): https://github.com/anthropics/skills/tree/main/skills/frontend-design
