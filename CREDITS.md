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
| [uphiago/recon-skills](https://github.com/uphiago/recon-skills) | MIT | Section contract enforced by validator, Observed/Inferred/Not-checked evidence discipline, no template duplication |
| [emilkowalski/skill](https://github.com/emilkowalski/skill) · [Sonner](https://github.com/emilkowalski/sonner) · [Vaul](https://github.com/emilkowalski/vaul) | — | Animation frequency rule, easing curves and durations, gesture and spring lessons |
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

## Mobile

- Apple HIG (Liquid Glass, iOS 26–27), SwiftUI documentation, App Store Review Guidelines
- Material 3 Expressive, Jetpack Compose, Android architecture guide, [Now in Android](https://github.com/android/nowinandroid)
- React Native, Expo, Flutter, and Kotlin Multiplatform documentation and release notes
- [conorluddy/LiquidGlassReference](https://github.com/conorluddy/LiquidGlassReference)
