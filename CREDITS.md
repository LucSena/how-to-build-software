# Credits

This collection consolidates, verifies, and rewrites guidance from many sources. All text is original; ideas adapted from other works are credited here. Each skill's `references/*.md` files list the specific sources behind their rules in a `## Sources` section.

Nothing here implies endorsement by the authors below.

## Agent skill collections (ideas adapted, rewritten in our own words)

| Project | License | What we learned from it |
|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) — `frontend-design`, `skill-creator`, `claude-api` | Apache-2.0 | AI-default visual tells, plan → review-against-brief → build → critique, microcopy rules, skill-authoring practice |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT | Anti-slop rules, direction presets (replacing its numeric dials), redesign flow, pre-flight checks |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 | Surface modes, audit/critique/polish procedures, heuristic scoring and P0–P3 severity, slop detectors, native craft floor |
| [ibelick/ui-skills](https://github.com/ibelick/ui-skills) | MIT | MUST/SHOULD/NEVER rule format, evidence-cited findings, accessibility/motion/metadata fixing passes, DESIGN.md creation |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | MIT | Shared context file pattern, skill anatomy, CRO/signup/onboarding/paywall practice |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Apache-2.0 | Motion doctrine (cause-and-effect chaining, spring defaults), router-skill and multi-agent packaging |
| [uphiago/recon-skills](https://github.com/uphiago/recon-skills) | MIT | Section contract enforced by validator, Observed/Inferred/Not-checked evidence discipline, no template duplication; its external recon checks, turned into the defensive pass in `application-security/references/external-exposure.md` |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) · [Sonner](https://github.com/emilkowalski/sonner) · [Vaul](https://github.com/emilkowalski/vaul) | MIT | Animation frequency rule, easing curves and durations, gesture and spring lessons |
| [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) | MIT | Interaction, forms, focus, performance, and content rules for web UI |
| [raunofreiberg/interfaces](https://github.com/raunofreiberg/interfaces) | — | Interaction-detail guidelines |
| [samber/cc-skills](https://github.com/samber/cc-skills) | MIT | Frontend deslop practice |
| [obra/superpowers](https://github.com/obra/superpowers) | MIT | Trigger-only descriptions, TDD and review workflows |
| [rams-design/rams-plugin](https://github.com/rams-design/rams-plugin) ([rams.ai](https://rams.ai)) | — | Automated design-review checklist mapped to WCAG |
| [wondelai/skills](https://github.com/wondelai/skills), [yonatankarp/software-design-skills](https://github.com/yonatankarp/software-design-skills) | — | "When NOT to use" framing for patterns |

**Companion skill (linked, not copied):** [heliocosta-dev/revenue-centric-design](https://github.com/heliocosta-dev/revenue-centric-design) is distributed under its own source-available license, so none of its text is included here. `conversion-ux` cites the public research it builds on and recommends installing it alongside this collection.

## Specifications and standards

- [Agent Skills specification](https://agentskills.io/specification) · [vercel-labs/skills](https://github.com/vercel-labs/skills) (`npx skills`)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Design Tokens Format Module 2025.10 (W3C DTCG)](https://www.designtokens.org/) · [google-labs-code/design.md](https://github.com/google-labs-code/design.md) (DESIGN.md)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) · [Material Design 3](https://m3.material.io/) · [Android developer guides](https://developer.android.com/) · [androidx Compose Material 3 source](https://github.com/androidx/androidx)
- RFC 9457 (Problem Details), RFC 9110 (HTTP Semantics), RFC 9745 (Deprecation header), RFC 8594 (Sunset header), RFC 9700 (OAuth 2.0 Security BCP) · [Standard Webhooks](https://www.standardwebhooks.com/)
- [OWASP Top 10](https://owasp.org/Top10/), [API Security Top 10 (2023)](https://owasp.org/API-Security/), [Top 10 for LLM Applications (2025)](https://genai.owasp.org/), [MASVS](https://mas.owasp.org/)
- [OpenTelemetry](https://opentelemetry.io/) (including GenAI semantic conventions) · [web-vitals](https://github.com/GoogleChrome/web-vitals) · [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance) · [Baseline](https://web.dev/baseline)

## Design and UX references

- [Laws of UX](https://lawsofux.com) and [Humane by Design](https://humanebydesign.com) by Jon Yablonski (via [fmhall/software-laws](https://github.com/fmhall/software-laws))
- [Nielsen Norman Group](https://www.nngroup.com/articles/ten-usability-heuristics/) — heuristics, response-time limits, forms, error messages
- [Baymard Institute](https://baymard.com) — checkout and e-commerce UX research
- [Design System Checklist](https://designsystemchecklist.com) ([ardakaracizmeli/design-system-checklist](https://github.com/ardakaracizmeli/design-system-checklist))
- [growth.design](https://growth.design/case-studies) · [principles.design](https://principles.design) · [webfieldmanual.com](https://webfieldmanual.com/design.html) · [emilkowal.ski](https://emilkowal.ski)
- [How Complex Systems Fail](https://how.complexsystems.fail/) by Richard I. Cook
- [Y Combinator Requests for Startups](https://www.ycombinator.com/rfs) (context for AI-native product patterns)
- Tailwind CSS v4, shadcn/ui, Base UI, Radix Colors, Evil Martians (OKLCH) documentation
- The icon, component, inspiration, and AI-design-tool catalogs in `skills/design-resources/references/` credit each resource inline.

## Engineering literature

- Martin Fowler — *Refactoring*, bliki (MonolithFirst, StranglerFig, feature toggles with Pete Hodgson)
- John Ousterhout — *A Philosophy of Software Design* · Michael Feathers — *Working Effectively with Legacy Code* · Sandi Metz · Kent Beck
- Eric Evans, Vaughn Vernon — Domain-Driven Design, *Effective Aggregate Design* · Michael Nygard — *Release It!*, Architecture Decision Records · Simon Brown — C4 model
- Neal Ford, Rebecca Parsons, Patrick Kua — *Building Evolutionary Architectures*
- Google — *Site Reliability Engineering* and *The Site Reliability Workbook*, [eng-practices](https://github.com/google/eng-practices)
- AWS Architecture Blog — exponential backoff and jitter
- Alexis King — "Parse, don't validate" · Gary Bernhardt — functional core, imperative shell · Dan North — CUPID · Freeman & Pryce — *Growing Object-Oriented Software, Guided by Tests* · Kent C. Dodds — testing trophy
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) · [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) · [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) · [sairyss/domain-driven-hexagon](https://github.com/sairyss/domain-driven-hexagon) · [microsoft/api-guidelines](https://github.com/microsoft/api-guidelines) · [joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record) · [The Twelve-Factor App](https://12factor.net) · [ryanmcdermott/clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript) · [zedr/clean-code-python](https://github.com/zedr/clean-code-python)
- Anthropic — "Building Effective Agents", "Writing effective tools for agents", "Contextual Retrieval" · Simon Willison — the lethal trifecta · Hamel Husain — LLM evals · Zheng et al. — LLM-as-a-judge
- Research on AI-generated code quality: Veracode GenAI Code Security Report (2025), GitClear code-quality research, USENIX Security 2025 package-hallucination study, DORA 2025

## Engineering depth (0.2.0)

**Starting projects, stacks, and codebases** — [Microsoft Code-With Engineering Playbook](https://github.com/microsoft/code-with-engineering-playbook) (MIT) · [create-t3-app](https://github.com/t3-oss/create-t3-app) and [t3-env](https://github.com/t3-oss/t3-env) · [bulletproof-react](https://github.com/alan2207/bulletproof-react) · [FastAPI best practices](https://github.com/zhanymkanov/fastapi-best-practices) · [HackSoft Django Styleguide](https://github.com/HackSoftware/Django-Styleguide) · [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) (CC BY-SA 4.0 — ideas only) · [thoughtbot guides](https://github.com/thoughtbot/guides) · [go.dev module layout](https://go.dev/doc/modules/layout) · [Google eng-practices](https://google.github.io/eng-practices/) · [DORA](https://dora.dev) · SemVer, Conventional Commits, Keep a Changelog, CalVer · Rust RFCs, Kubernetes KEPs, Oxide RFDs · [agents.md](https://agents.md) · Dan McKinley, "Choose Boring Technology" · Potvin & Levenberg, "Why Google Stores Billions of Lines of Code in a Single Repository" (CACM 2016) · Shopify Packwerk, Spring Modulith, ArchUnit, dependency-cruiser, eslint-plugin-boundaries, import-linter · GitHub Octoverse 2025, Stack Overflow Developer Survey 2025, JetBrains Developer Ecosystem 2025, Thoughtworks Technology Radar.

**Object-oriented design, clean code, and dependencies** — [Artem Zakirullin, *Cognitive load is what matters*](https://github.com/zakirullin/cognitive-load) (**CC BY 4.0**; ideas adapted with attribution) · [John Ousterhout & Robert C. Martin, *A Philosophy of Software Design vs Clean Code*](https://github.com/johnousterhout/aposd-vs-clean-code) · [Casey Muratori & Robert C. Martin exchange](https://github.com/cmuratori/misc) · [e18e module-replacements](https://github.com/es-tooling/module-replacements) · [OpenSSF guides](https://github.com/ossf/wg-best-practices-os-developers) and [package-manager best practices](https://github.com/ossf/package-manager-best-practices) · [npm security best practices](https://github.com/lirantal/npm-security-best-practices) · Russ Cox, "Our Software Dependency Problem" · Rob Pike, Go Proverbs · Renovate and Dependabot documentation · Sandi Metz, Mark Seemann, Miško Hevery, Rebecca Wirfs-Brock, Craig Larman, Rich Hickey ("Simple Made Easy"), Gary Bernhardt ("Boundaries"), Kent Beck (*Tidy First?*), Dan Abramov, tef, Joel Spolsky, Kevlin Henney, Arlo Belshee, William Woodruff.

**System design, data modeling, and data infrastructure** — Malte Ubl, "Design Docs at Google" · [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) · [awesome-falsehood](https://github.com/kdeldycke/awesome-falsehood) · PostgreSQL wiki "Don't Do This" · RFC 9562 (UUIDs) · Brandur Leach (idempotency keys, soft deletion) · Alex DeBrie (DynamoDB) · Bill Karwin, *SQL Antipatterns* · pgroll, gh-ost · [postgres_for_everything](https://github.com/Olshansk/postgres_for_everything) · READMEs of pgvector, ClickBench, River, pg-boss, Graphile Worker, Solid Queue, pgmq, Litestream, LiteFS, Valkey · Gunnar Morling · PlanetScale and Recall.ai on Postgres queues · Oxide RFD 508 · engineering writing from Discord, Figma, Notion, Instagram, Pinterest, Shopify, Stripe, Slack, GitHub, Uber, Segment, Prime Video (and Adrian Cockcroft), Stack Overflow (Nick Craver), WhatsApp, 37signals, Dropbox, LinkedIn (Jay Kreps), Airbnb, Linear, and OpenAI.

**Environments, deployment, and security** — [twelve-factor](https://github.com/twelve-factor/twelve-factor) · [Kubernetes Failure Stories](https://github.com/hjacobs/kubernetes-failure-stories) · hadolint · GitHub, Docker, and Kubernetes documentation · Kamal, Temporal, Inngest, Restate, envalid · [The Copenhagen Book](https://github.com/pilcrowonpaper/copenhagen) (MIT) and The Auth Book (ideas only) · [OWASP Cheat Sheet Series](https://github.com/OWASP/CheatSheetSeries), OWASP Top 10:2025, and ASVS 5.0 (CC BY-SA 4.0 — paraphrased, no text copied) · NIST SP 800-63B-4 (public domain) · [passkeys.dev](https://github.com/passkeydeveloper/passkeys.dev) · [Better Auth docs](https://github.com/better-auth/better-auth) (MIT) · Apple App Review Guidelines, Android Credential Manager · WCAG 3.3.8, WHATWG autofill · GitHub Security Advisories GHSA-f82v-jwr5-mffw (CVE-2025-29927) and GHSA-fv66-9v8q-g76r (CVE-2025-55182) · web.dev strict CSP · Threat Modeling Manifesto, Adam Shostack.

## Postmortems and failure research (0.2.0)

Facts and links only; no text copied. [icco/postmortems](https://github.com/icco/postmortems) (GPL-3.0), [danluu/post-mortems](https://github.com/danluu/post-mortems), [awesome-tech-postmortems](https://github.com/snakescott/awesome-tech-postmortems), [vectara/awesome-agent-failures](https://github.com/vectara/awesome-agent-failures) (Apache-2.0), [hacker-laws](https://github.com/dwmkerr/hacker-laws) (CC BY-SA 4.0) · vendor postmortems from GitLab, AWS, Cloudflare, CrowdStrike, Meta, Fastly, Roblox, Slack, GitHub, Atlassian, Microsoft, Google Cloud, Datadog, Heroku, and others · the SEC order on Knight Capital · Google SRE books · AWS Builders' Library · Yuan et al., "Simple Testing Can Prevent Most Critical Failures" (OSDI 2014) · metastable and gray failure papers · Sidney Dekker, John Allspaw, Diane Vaughan, Richard Cook · FCC, FTC, HHS OIG, UK Public Accounts Committee, and US House reports · Ron Kohavi.

## Product flows (0.2.0)

[GitHub Primer](https://github.com/primer/design) (MIT) · [IBM Carbon](https://github.com/carbon-design-system/carbon-website) (Apache-2.0) · Shopify Polaris · [GOV.UK Design System](https://github.com/alphagov/govuk-design-system) (OGL v3) · shadcn/ui (MIT) · [Tremor](https://github.com/tremorlabs/tremor-npm) (Apache-2.0) · Plausible and PostHog docs · Apple HIG onboarding and Android onboarding guidance · Brad Frost, *Atomic Design* (paraphrased) · Nathan Curtis (EightShapes) · Airbnb DLS · EDPB cookie banner taskforce · Stephen Few, Edward Tufte, Ben Shneiderman · Reforge, Wes Bush, Samuel Hulick · Userpilot, Chameleon, Pendo, and RevenueCat reports (vendor figures, attributed).

## Mobile

- Apple HIG (Liquid Glass, iOS 26–27), SwiftUI documentation, App Store Review Guidelines
- Material 3 Expressive, Jetpack Compose, Android architecture guide, [Now in Android](https://github.com/android/nowinandroid)
- React Native, Expo, Flutter, and Kotlin Multiplatform documentation and release notes
- [conorluddy/LiquidGlassReference](https://github.com/conorluddy/LiquidGlassReference) · [y-128/Apple-HIG-Design](https://github.com/y-128/Apple-HIG-Design) (HIG mirror)
- impeccable (Apache-2.0) native references · emilkowalski/skill `mobile-native` · community Material 3 skill repos
- [deceptive.design](https://www.deceptive.design/) — dark-pattern taxonomy

## Engineering writing read at the source (2026-09 verification pass)

Facts and ideas, rewritten in our own words: [Amazon Builders' Library](https://aws.amazon.com/builders-library/) (caching, load shedding, idempotent APIs) · Stripe engineering blog ([rate limiters](https://stripe.com/blog/rate-limiters), [idempotency](https://stripe.com/blog/idempotency)) · [Netflix Technology Blog](https://netflixtechblog.medium.com/performance-under-load-3e6fa9a60581) · [Discord](https://discord.com/blog/why-discord-is-switching-from-go-to-rust) · [Notion](https://www.notion.com/blog/the-great-re-shard) · [Shopify Engineering](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity) · [Slack Engineering](https://slack.engineering/slacks-incident-on-2-22-22/) · [Dan Luu](https://danluu.com/postmortem-lessons/) · [IBM Carbon](https://carbondesignsystem.com/) (Apache-2.0) · [GitHub Primer](https://primer.style/) (MIT) · [GOV.UK Design System](https://design-system.service.gov.uk/) (OGL v3.0) · [Impeccable slop catalog](https://impeccable.style/slop) · [Design with Intent](https://designwithintent.ai) (CC0).
