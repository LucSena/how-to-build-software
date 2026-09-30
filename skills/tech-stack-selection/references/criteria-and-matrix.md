# Criteria and decision matrix

How to compare 2–3 stack options so the decision rests on evidence and survives the next quarter's hype. Adapted from the Microsoft engineering playbook's trade-study template, Dan McKinley's "Choose Boring Technology", the T3 axioms, and Node.js Best Practices' advice on choosing a framework.

## Contents
1. Gates before scoring
2. Scoring anchors (1–5)
3. Weight profiles by context
4. Worked example (illustrative)
5. Innovation-token accounting
6. License and longevity checks
7. Designing the spike
8. Changing an existing stack
9. Rules catalog

## 1. Gates before scoring

A failed gate removes the option. It cannot be outweighed by points elsewhere.

| Gate | Fails when |
|---|---|
| Deployment target | It cannot run where the product must run (browser, iOS/Android, edge runtime, customer's on-prem, GPU) |
| License | Its terms restrict how you use it (source-available terms that bar offering it as a service when you are a SaaS; copyleft that conflicts with distribution plans), or your org policy forbids it |
| Compliance and residency | No path to the required certifications, data residency, FIPS, or audit logging |
| Existing commitments | It contradicts a binding platform decision (e.g. an enterprise-wide cloud contract) and nobody with authority has agreed to an exception |

## 2. Scoring anchors (1–5)

| Criterion | 1 | 3 | 5 |
|---|---|---|---|
| Team skill | Nobody has used it | One person has shipped with it | Most of the team has operated it in production |
| Ecosystem maturity | Missing core libraries for your domain | Libraries exist, some unmaintained | Mature, maintained libraries for every need you listed |
| Operational fit | Needs skills or infrastructure you lack | Manageable with learning | Team already deploys, monitors, and debugs it |
| Type safety | Dynamic, types bolted on or rare | Gradual typing, partially adopted | Static or strict typing idiomatic across the ecosystem |
| AI-assistance quality | Niche, little public code, weak types | Popular or typed, not both | Popular *and* typed; generated code checkable by the compiler |
| Hiring and community | Tiny pool in your market | Moderate | Large and stable or growing |
| Longevity | Young, single maintainer or vendor, breaking churn | Established, vendor-governed | Foundation-governed or long compatibility record, LTS policy |
| Lock-in and exit cost | Proprietary APIs and data formats | Partial standards | Standard protocols end to end |
| Performance | Misses the stated number | Meets it with tuning | Meets it with headroom |
| Cost | Expensive licenses or hosting at 10× | Moderate | Cheap at 10× |

Score from evidence: repos shipped, a spike result, a load-test number. When a score is a guess, write "(guess)" next to it.

## 3. Weight profiles by context

| Criterion | Solo / early startup | Scale-up (several teams) | Enterprise / regulated |
|---|---|---|---|
| Team skill | 3 | 2 | 2 |
| Ecosystem maturity | 3 | 3 | 3 |
| Operational fit | 3 | 2 | 3 |
| Type safety | 2 | 3 | 3 |
| AI-assistance quality | 2 | 2 | 1 |
| Hiring and community | 1 | 3 | 3 |
| Longevity | 1 | 2 | 3 |
| Lock-in and exit cost | 1 | 2 | 3 |
| Performance (only with numbers) | 1 | 2 | 2 |
| Cost | 2 | 2 | 1 |

Weighted score = Σ(weight × score). Treat a difference under ~10% as a tie. Break ties on team skill, then on reversibility.

## 4. Worked example (illustrative)

Context: a 3-person team, two strong in Python/Django and one in TypeScript, building a B2B SaaS with forms, reports, and an admin area. No numeric performance requirement yet. The solo/early-startup weights apply.

| Criterion (weight) | Django + HTMX | Next.js + TS + Postgres | Rails + Hotwire |
|---|---|---|---|
| Team skill (3) | 5 | 3 | 1 |
| Ecosystem (3) | 5 | 5 | 5 |
| Operational fit (3) | 4 | 4 | 2 |
| Type safety (2) | 3 | 5 | 2 |
| AI-assistance (2) | 4 | 5 | 3 |
| Hiring (1) | 4 | 5 | 3 |
| Longevity (1) | 5 | 4 | 5 |
| Lock-in (1) | 5 | 4 | 5 |
| Performance (1) | 4 | 4 | 4 |
| Cost (2) | 4 | 4 | 4 |
| **Weighted total** | **82** | **81** | **59** |

The first two options are within 10%, which counts as a tie. Break the tie on team skill: Django, with pyright in strict mode to close the type-safety gap. Revisit when a rich client-side editor becomes the core of the product. These scores illustrate the method and are not a verdict on the frameworks.

## 5. Innovation-token accounting

McKinley: every company gets roughly three innovation tokens, and each technology with a real learning curve or unknown failure modes spends one. Count before committing:

```
Innovation tokens (budget ≈ 3)
1. <component> — why it's worth it: <differentiating payoff> — exit if it fails: <plan>
2. …
Boring (no token): Postgres, the team's main language and framework, managed PaaS, S3-compatible storage
```

Process questions from McKinley's essay:
- How would you solve the immediate problem **without adding anything new**?
- Write down **exactly what makes solving it with the current stack prohibitively expensive or difficult**. If you cannot, you do not need the new technology.
- "Best tool for the job" is myopic. The best tool is the one that is least bad across as many of your problems as possible, because every added technology adds operating overhead for everyone.

T3's "bleed responsibly": take risks in thin, easily replaced layers (an RPC layer, a UI library) and never in the layer that holds your data.

## 6. License and longevity checks

- **License at adoption and at every major upgrade.** Examples of relicensing: Terraform moved from MPL 2.0 to BUSL 1.1 in August 2023, and OpenTofu was forked under the Linux Foundation. Redis moved to source-available licenses (RSALv2/SSPLv1) in March 2024, the Linux Foundation launched the BSD-licensed Valkey fork, and Redis 8 (2025) added AGPLv3 as an option. Prefer foundation-governed or permissively licensed cores when you self-host.
- **Governance**: a foundation or multi-vendor project outlives any single company's strategy. Single-vendor open source can change terms.
- **Platform status**: hosting products can go into maintenance mode (Heroku's reported move to "sustaining engineering" in February 2026). Check the vendor's announcements before choosing a platform.
- **Release policy**: LTS windows, deprecation notice periods, and how past major upgrades went (read the migration guides of the last two majors).
- **Bus factor**: count active maintainers and releases in the last 12 months. The dependency-evaluation checklist is in `dependency-management`.

## 7. Designing the spike

From the MS trade-study template: narrow to 2–3 options, "design experiments to collect evidence as fast as possible", and finish within a sprint.

- Spike the **riskiest unknown**, not the easy part: the hardest integration (SSO, payment webhooks, a legacy DB), a load test on realistic data volume, a cold-start measurement on the target host, or a deploy through the real pipeline.
- Define the pass/fail threshold **before** running it ("p95 < 200 ms at 100 rps on 5M rows").
- Throw the spike away. It answers a question and is not the first sprint of the product.
- Record the numbers in the ADR.

## 8. Changing an existing stack

- Default: **keep the current stack**. Switching costs include the rewrite, the relearning, the bugs a rewrite reintroduces, and a feature freeze.
- Valid triggers: a measured requirement the current stack cannot meet after reasonable optimization, an ecosystem that is dying or unmaintained, a license change that blocks your use, or a hiring market that has evaporated.
- Change incrementally: strangle one component behind a stable interface, measure, then continue. Big-bang rewrites fail more often than incremental migrations (see `lessons-from-failures`).

## 9. Rules catalog

### Score only against stated requirements
**Rule.** Weight performance at 1 unless a numeric requirement exists. With one, weight it 3 and test it in a spike.
**Apply when.** Someone argues for a stack on speed.
**Do / Avoid.** Do: "p95 < 150 ms at 300 rps. Spike shows Django at 90 ms with caching, so it passes." Avoid: citing a hello-world benchmark table.
**Why.** Most product backends spend their time waiting on the database and the network. Language speed rarely changes user-perceived latency, while team speed always changes delivery.

### Treat unfamiliar technology as a spent token
**Rule.** Every component the team has not operated in production counts against a budget of about three.
**Apply when.** A proposal includes a new language, database, broker, or platform.
**Do / Avoid.** Do: spend a token on a vector search engine if retrieval quality *is* the product. Avoid: a new language, a new database, and Kubernetes in one MVP.
**Why.** McKinley: unknown failure modes, not unknown features, cause outages and slow delivery. Operating cost compounds with each added technology.

### Make every stack ADR falsifiable
**Rule.** Each stack decision records a measurable "revisit when" trigger.
**Apply when.** Writing the ADR.
**Do / Avoid.** Do: "Revisit when sustained writes exceed 2k/s or a second team needs independent deploys." Avoid: "Revisit if it doesn't scale."
**Why.** Without a trigger, the decision is either never revisited or is relitigated every time someone reads a blog post.

## Sources

- Dan McKinley, "Choose Boring Technology": https://mcfunley.com/choose-boring-technology · https://boringtechnology.club
- Charity Majors, "Choose Boring Technology Culture": https://charity.wtf/2023/05/01/choose-boring-technology-culture/
- create-t3-app, "T3 axioms" (bleed responsibly, solve problems, typesafety isn't optional): https://create.t3.gg/en/introduction
- Microsoft Code-With Engineering Playbook, trade-study template: https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/design/design-reviews/trade-studies
- Node.js Best Practices, choosing a framework: https://github.com/goldbergyoni/nodebestpractices
- Mündler et al., "Type-Constrained Code Generation with Language Models" (PLDI 2025): https://arxiv.org/abs/2504.09246
- OpenTofu (Terraform relicensing, fork): https://opentofu.org/manifesto/
- Valkey (Redis fork): https://github.com/valkey-io/valkey · Redis 8 AGPL option: https://lwn.net/Articles/1019686/
- Heroku sustaining-engineering report (InfoWorld, Feb 2026): https://www.infoworld.com/article/4129430/salesforce-may-be-prepping-to-phase-out-heroku.html
