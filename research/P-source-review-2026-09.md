# P. Source review against the originals (2026-09-30)

Second pass over the sources the owner uses, done with full web access and a real browser (Chrome driven by Playwright), unlike the first-pass notes A–O. Every entry here was read on the live page on 2026-09-30. Tag `[P]` = read on the primary page in this pass.

Each entry: **what it teaches**, **what the skills said**, **gap or correction**, **action taken**.

## Contents

1. Design references
2. Icon libraries
3. DESIGN.md and design-generation tools
4. Other references
5. Repositories
6. Link check of every URL cited in `skills/`
7. Claim verification log (secondary / memory / unverified claims)
8. Deepening sources (engineering and design systems)

---

## 1. Design references

### Emil Kowalski, "You don't need animations" — https://emilkowal.ski/ui/you-dont-need-animations [P]
- Teaches: every animation needs a purpose; **frequency of use** decides whether to animate (Raycast opens hundreds of times a day, with no animation); **never animate keyboard-initiated actions**; UI animations "should generally stay under 300ms"; a 180ms dropdown feels more responsive than 400ms; tooltips: delay the first one, then open adjacent tooltips instantly with no animation; a faster spinner raises perceived speed; delight only for rarely seen moments (Sonner's feedback morph).
- Skills: `motion-design` and `interaction-design` already cite the article for the keyboard rule and frequency rule.
- Checked `motion-design` against the article and against Emil's `skills/review-animations/STANDARDS.md` (curves `0.23,1,0.32,1`, `0.77,0,0.175,1`, `0.32,0.72,0,1`; durations; frequency table): already consistent. Fixed the repo URL (`emilkowalski/skill` → `emilkowalski/skills`), whose license is **MIT**, not "not stated".

### Laws of UX — https://lawsofux.com [P]
- Teaches: 30 laws with one page each (count on 2026-09-30: Aesthetic-Usability, Choice Overload, Chunking, Cognitive Bias, Cognitive Load, Doherty, Fitts, Flow, Goal-Gradient, Hick, Jakob, Common Region, Proximity, Prägnanz, Similarity, Uniform Connectedness, Mental Model, Miller, Occam, Paradox of the Active User, Pareto, Parkinson, Peak-End, Postel, Selective Attention, Serial Position, Tesler, Von Restorff, Working Memory, Zeigarnik).
- Skills: "about 30" — correct. Doherty "<400ms" matches the site.

### NN/g, 10 Usability Heuristics — https://www.nngroup.com/articles/ten-usability-heuristics/ [P]
- Published 1994-04-24, last reviewed 2024-01-30; names and descriptions were updated by Kate Moran and Feifei Liu.
- Skills use the current names. No correction needed.

### Rams — https://www.rams.ai [P]
- Teaches: a design-review engine for agents and PRs. **348 rules across 9 categories** (e.g. Accessibility 33, Color 27, Typography 43 …), a 0–100 score, and fixes returned as patches. Four delivery modes: a free Skill (`/rams`), an MCP server, a GitHub App, and a CI Action that can fail the pipeline on critical findings. Examples of rules: two filled CTAs of equal weight, hard-coded hex that bypasses tokens, `transition: all`, animations without `prefers-reduced-motion`, sub-44px targets.
- Skills said "about 300+ rules in 9 categories". Corrected to 348 (as of 2026-09) plus the four delivery modes.

### Impeccable — https://impeccable.style, /slop, /designing, /docs/detector [P]
- Teaches: an agent design skill by Paul Bakaus with a **detector of 61 rules plus 6 design-review patterns** (catalog of 67 on /slop), grouped into Your design system (4), Visual details (8), Typography (11), Color & contrast (7), Layout & space (12), Motion (6), Copy (5), Imagery (4), General quality (10). It runs as `npx impeccable detect src/` or against a URL, and as a Chrome extension. It uses `PRODUCT.md` (register, platform, users, principles) and `DESIGN.md`, and flags fonts, colors, sizes and radii that fall outside DESIGN.md.
- Rules missing from `design-taste/references/slop-catalog.md`: monotonous spacing (equal gaps everywhere), unbalanced opening columns, text covered by another element, hand-coded "rough SVG" mascots, placeholder-style illustrations (shapes made of circles and blocks), images under near-opaque overlays, justified body text, all-caps body text, cramped padding, modal abuse (settings crammed into a scrolling dialog), and cream/beige as a reflex palette. Added, with the counts and the URL.

### Taste Skill — https://tasteskill.dev/docs [P]
- Teaches: v2 (experimental, install name `design-taste-frontend`) reads the brief first (Section 0), maps briefs that name a real design system (Material, Fluent, Carbon, Polaris, Atlassian, Primer, GOV.UK, USWDS …) to the official package, uses dual-mode dark by default with off-black and off-white, applies a complete em-dash ban, gives redesigns an audit-first protocol with greenfield, preserve and overhaul modes, and never changes URLs, nav labels or form field names silently. It ends with a hard pre-flight check. Variants: gpt-tasteskill, redesign-skill, soft-skill, minimalist-skill, brutalist-skill, output-skill, stitch-skill, image-to-code-skill.
- Gap: the "brief names a real design system → use its official package" rule was not in `design-taste`. Added.

### Design with Intent — https://designwithintent.ai [P]
- Teaches: 17 skills in 7 categories (research, strategy, flows, content, accessibility, ethics, measurement), plus an anti-pattern catalog of 57+ patterns in 10 categories with severities, including AI-specific dark patterns such as "anthropomorphic manipulation". By Ghaida. **License: CC0 1.0 (public domain)**. Install: `npx skills add ghaida/intent --all`.
- Skills said "License unverified". Corrected.

### transitions.dev — https://transitions.dev [P]
- Teaches: by Jakub Antalik. **43+ transitions** as of 2026-09 (Essential, AI Agents, Effects, Texts, Pro), plus a **Transitions Agent** (`npx transitions-agent`) that scores motion 0–100 locally with no AI, maps each finding to a recipe (e.g. `transition: all` → name the properties, hard-coded `0.3s` → a duration token, a missing `prefers-reduced-motion` guard), and a GitHub Action that can block merges below a minimum score.
- Skills said "about 18 CSS transitions". Corrected.

### Other design references, one line each [P]
- **Humane by Design**: 7 principles (Resilient, Empowering, Finite, Inclusive, Intentional, Respectful, Transparent). The skills are correct.
- **principles.design**: 236 examples and 1,661 principles (2026-09-30). "Hundreds" is correct.
- **growth.design**: "106 Cognitive Biases & Principles" and comic case studies (Duolingo, Trello, Loom, Blinkist trial paywall, LinkedIn notification opt-in …). "100+" is correct.
- **Baymard ecommerce design examples**: 18,000+ full-page examples across **74 page types**, 2012–2026, annotated with 18,000+ UX "violations" and "adherences".
- **Web Field Manual (design)**: Jon Yablonski's link directory (accessibility, animation, color …). A reading list, correct as described.
- **Design Engineer Tools**: James Warner's list. Correct.
- **Bencho**: interactive UI blocks by Lorenzo Cabra, organised by gesture (hover, press, drag, slide, swipe, type, select), with a community of about 3,000 members.
- **floguo notes**: Flo Guo (formerly Vercel Design Engineering, now founding design engineer at Paradigm). "Material understanding beats tool proficiency." Correct.
- **DesEngs**: a design-engineering resource directory with a "Minimum" gallery of minimal sites and a DSGNRS list. Correct.
- **UI Skills**: `npx ui-skills` CLI and MCP; catalog includes `ui-skills-root`, `improve-ui`, Anthropic `frontend-design`, Emil Kowalski `improve-animations`, `better-ui` (Jakub Krehel), shadcn `improve`.
- **coss.com/ui**: component library on **Base UI**, "Built for developers and AI", 510 "particles" (examples).
- **ReUI**: 1,149 shadcn/ui-based components, 22 in-house (Data Grid, Kanban, Filters, Event Calendar, Gantt, File Upload …), shown inside dashboard layouts.
- **snapcn**: 94 Remotion video components (43 MIT, 51 Pro) plus an MCP server. It is a video library, not a web UI kit.
- **ObsidianUI**: React/Tailwind motion components by Atharv. Its homepage testimonials are placeholder names, so treat it as inspiration, not a dependency.
- **drawably**: hand-drawn UI controls regenerated on every mount (`npm i drawably`, MIT, v0.4.2 as of 2026-09): 25 pieces, 12 hands each, 6 inks.
- **Beautiful UI (beautifului.dev)**: AI-native primitives by Turbo: loading, thinking traces, streaming text with inline sources, approval card, tool chips, task rows, prompt bar, diff table.
- **dqnamo**: JP's studio site and "The Kitchen" (playing cards, receipt printer, dynamic button).
- **Inspora, Godly, Refero, Page Flows, Appshots, ScreensDesign**: galleries (visual analysis for the site redesign lives with the site proposal).

## 2. Icon libraries [P]

| Library | Page says (2026-09-30) | Skill said | Action |
|---|---|---|---|
| Lucide (lucide.dev, /guide/version-1) | v1.48.0, 1,857 icons, ISC; v1 removed brand icons and UMD, `lucide-react` −32.3%, context providers, **`aria-hidden` by default** | "1,600–1,850", no aria-hidden note | Updated; added the icon-only-button `aria-label` consequence |
| Phosphor | "Download all (9,072)" | "1,250+ × 6 weights" | Corrected to 9,072 in total (about 1,500 × 6) |
| Tabler | 6,220 icons (5,166 outline), v3.48.0 | same | Confirmed |
| Remix Icon | v4.9.1; 20 categories summing to 3,229; License v1.0: free commercial use, attribution optional, **no selling as a pack, not the main value of a product, not as a logo** | "3,200+"; license without the prohibitions | Added the prohibitions |
| Hugeicons | Free 6,000+ Stroke Rounded; Pro 60,000+, 10 styles, $99/yr | same minus price | Added styles and dated price |
| Iconsax | 7,000+ free, 44,000+ premium, 50,000+ total, 6 styles × 2 finishes | "6–7k free, 34k premium" | Corrected |
| Iconly (iconly.pro) | 40,000+ icons, 6 styles, flat/animated/3D; free 2,500+; $99/yr or $189 lifetime | "31,000–40,000", another URL | Corrected |
| Nucleo | 44,282 icons; bundle $149 (list $405); families $69–99 | "about 44,000", "8 styles" | Corrected with per-family counts |
| Isocons | v2.1, **CC BY 4.0 (attribution required)** | "Free" | Corrected |
| lucide-animated | 467 icons (llms.txt), MIT, agent skill and MCP server; ports: Svelte, Vue, Angular, Flutter | "350+", "ports for Hugeicons, Tabler, Phosphor" (not in the repo) | Corrected; removed the unsupported ports |
| itshover | 186+ icons, motion/react, **Apache-2.0** | "open source" | Added the license |
| Moving Icons | 500+ Lucide icons for Svelte 5, MIT, `@jis3r/icons` | same | Confirmed |
| Morphicons | closed-form rotation (2D Procrustes), springs, about 6 KB; React, Vue, Svelte, React Native, Astro | "6.5 KB gzipped", "Iconoir, Hugeicons", "Web Components, vanilla" | Rewritten to match the page |

## 3. DESIGN.md and design-generation tools [P]

- **google-labs-code/design.md**: spec `version: alpha`; CLI `lint` (spec, token references, WCAG contrast), `diff`, `export` (css-tailwind, json-tailwind, dtcg), `spec`. New gotcha: on Windows/PowerShell the `.md` in the binary name collides with the Markdown file association, so run `npx -p @google/design.md designmd lint DESIGN.md`.
- **Refero Styles**: "2,000+ AI-readable design systems". Confirmed.
- **getdesign.md**: now a catalog of **550+** site DESIGN.md files (skill said 70+). Corrected.
- **designmd.supply**: open source, built on Context.dev. Confirmed.
- **designmd.me**: URL → DESIGN.md + HTML preview + Figma import; credit-based ("4 credits / spec", no card to start). Added.
- **HyperDesign (design-md.hyperbrowser.ai)**: needs the user's own Hyperbrowser API key, stored in the browser. Added.
- **Open Design (nexu-io/open-design, Apache-2.0)**: desktop app; "21 coding agents, 152 design systems, BYOK". Added the counts.
- **Aura**: prompt → landing pages, templates, a DESIGN.md page. Confirmed.
- **Neuform**: "prompt-to-production design workflow" (web, mobile, and a design system from one prompt). Upgraded from [P] to [V].
- **TypeUI (bergside/typeui)**: MIT (in LICENSE.md; GitHub shows NOASSERTION only because of the file name); MCP server, plugins, CLI `npx typeui.sh list|pull|generate`; the site lists 94 design skills and 449 UI prompts, and the README shows 67 registry styles. Corrected from "License Other (check)".

## 4. Other references [P]

- **How Complex Systems Fail** (Cook): 18 points; copyright 1998–2000. Skills correct.
- **YC Requests for Startups**: "Multiplayer AI" is in **Fall 2026**; "Dynamic Software Interfaces" and "Software for Agents" are in **Summer 2026** (checked by switching the batch tabs). Skills correct.

## 5. Repositories [P]

| Repo | License | Notes | Action |
|---|---|---|---|
| heygen-com/hyperframes | Apache-2.0 | Active (pushed 2026-09-30) | Credit unchanged |
| Leonxlnx/taste-skill | MIT | v2 experimental is the default install | `design-resources` and `design-taste` updated (a brief naming a real design system → its official package) |
| uphiago/recon-skills | MIT | 146 offensive-security skills (auth, chains, infra, meta, recon, redteam); its STYLE.md requires When to Use / Prerequisites / How to Run / Procedure / Pitfalls / Verification | **No skill used it.** New `application-security/references/external-exposure.md` turns its recon checks into defensive rules, each confirmed in vendor docs (Supabase RLS, Spring Boot Actuator defaults, Next.js `remotePatterns` and source maps, MDN on subdomain takeover) |
| heliocosta-dev/revenue-centric-design | Source-available: attribution to Richard (@richardrx), **no gambling or betting use**, terms carried in derivatives | 7-word shingle comparison against every skill file: the only overlaps are its URL and install command | Nothing to remove; still linked, not copied |
| coreyhaines31/marketingskills | MIT | 50 skills (counted in `skills/`) | "About 50" is correct |

## 6. Link check of every URL cited in `skills/`

1,430 unique URLs were requested over HTTP, and the 117 failures were re-checked in real Chrome. Most failures were bot protection (w3.org, developer.android.com, socket.dev, ACM, OUP) or example and template URLs. The truly broken links, all fixed:

- `import-linter.readthedocs.io/.../contract_types.html` → `/contract_types/`
- Sentry, "Transaction ID wraparound in Postgres" → `blog.sentry.io/transaction-id-wraparound-in-postgres/`
- Travis CI 2016 and 2018 postmortems (deleted) → Wayback Machine copies
- Jay Kreps, "The Log" (LinkedIn moved it) → Wayback copy
- arlobelshee.com and misko.hevery.com (domains gone) → Wayback copies
- SiliconANGLE article on the CockroachDB license → corrected slug
- Wikipedia "Palm_Beach_County_butterfly_ballot" (no such article) → the APSR paper itself (Wand et al., Dec 2001; read in the PDF: "more than 2,000 Democratic voters") plus the article on the 2000 Florida election
- dev.to, "$47,000 agent loop" (post deleted; no first-hand account exists) → claim removed from `lessons-from-failures` with a note not to quote it; the DN42 case was corrected from the first-hand post ($6,531.30, five `m8g.12xlarge` instances)
- backgrounds.supply (timed out repeatedly) → figures removed, entry marked "re-check before recommending"

## 7. Claim verification: method, results, corrections

**Method.** A real browser downloaded the rendered text of every cited URL (1,416 fetched, 1,364 readable; PDFs converted with `pdftotext`; the rest were bot walls or dead). A script then took each line in `skills/` that states a fact (a year with a reporting verb, a percentage, a thousands or decimal number, a version, or a quote) and looked for each token first in the sources on that line or its "Source" line, then in the file's sources, then in the skill's sources.

**Results.** 3,119 factual lines. 1,727 had every token found in a cited source. Of the rest, most are the skill's own defaults and examples (type-scale ratios, sample prices, sample UI copy), which need no source. A stricter filter (lines with a reporting word and a large, decimal, or percentage number; attributed quotes; numbers missing from the line's own source) left about 200 lines, which were reviewed by hand against the sources.

**Corrected after the manual review** (beyond sections 1–6):
- Hawaii alert prompt: "Are you sure **that** you want to send this Alert?" (FCC report, verbatim); the prompt was identical for tests and live alerts and did not show the message.
- Nx "s1ngularity": 2,349 secrets is GitGuardian's count, not the Nx postmortem's; now attributed.
- npm chalk/debug (Sep 2025): the first report (Aikido) says "more than 2 billion" weekly downloads; "2.6 billion" came from later write-ups. Corrected.
- Sonos: "a profound mistake" is Tom Conrad's phrase (Spence's successor), now attributed.
- Kotlin 2.4.0: released 2026-07-14 per the docs (the skill said June); Swift export is Alpha; "faster Kotlin/Native builds" became "lower memory when linking release builds", which is what the docs say.
- Compose Multiplatform 1.10 and 1.12 features restated from the release posts.
- Gunnar Morling misattribution: "a definitive no-go … for architectural reasons rather than performance" is Conduktor's wording; Morling's own argument (log semantics, consumer groups, failover, MVCC bloat under queue load) is now summarized separately.
- ClickBench: the README now also runs a supplementary concurrent-QPS test; "no concurrency" was softened to what the README says.
- Graphile Worker: "optimal conditions" is not in its docs; replaced with the numbers from its performance statement.
- Liquid Glass `.clear`: Apple's WWDC25 "Meet Liquid Glass" requires a dimming layer but gives **no percentage**; the "35%" came from third-party libraries and was removed.
- Slopsquatting (USENIX Security 2025): 19.7% of 2.23M generated package references were hallucinated, **5.2% for commercial models and 21.7% for open-source ones**, a split that is now stated.
- Gallery counts: Mobbin 323,900 flows (not 142,200); Appshots 120,000+ screens (not 70,000); ScreensDesign 2,730 apps with session recordings and revenue signals; Refero no longer publishes counts; Page Flows prices; Godly redescribed; Designeer marked [P] (bot wall).
- pnpm `minimumReleaseAge`: added in 10.16.0, default 1440 minutes since v11 (the docs confirm what was "reported").
- SF Symbols: "over 7,000" (was 6,900+). Base UI package `@base-ui/react` confirmed. ReUI: 1,149 components, MIT.
- Userpilot checklist benchmark (19.2% average, 10.1% median, 188 companies): the live URL now redirects to a generic article; the source points to the archived report.
- Equifax (GAO: at least 145.5 million; FTC: 147 million), CrowdStrike (Microsoft: 8.5 million devices), xz (login 0.299 s → 0.807 s in the discovery post), tj-actions (StepSecurity: over 23,000 repositories), Yuan et al. (92% / 58% in the paper): sources added where the cited page did not carry the number.
- ThoughtWorks Radar: AGENTS.md was Trial in Vol. 33 and is not on Vol. 34 (Apr 2026), where "context engineering" is Adopt. Noted.

**Checked and confirmed** (sample): NN/g heuristics dates; Laws of UX (30 laws); Emil Kowalski's curves and durations; Ousterhout–Martin debate claims (5–10× comments, "err on the side of decomposition", bundling vs TDD, second edition); Hickey's table (transcript); Discord, Notion, Shopify, Slack numbers; AWS Oct 2025 timings (DNS restored 2:25 AM, end 2:20 PM PDT); React2Shell patched versions; App Review Guidelines date (June 8, 2026); Android 14 non-linear font scaling to 200%; Safari 16.4 outline following border-radius; Nathan Curtis, "The Fallacy of Federated Design Systems" (Sep 2024); Mike Acton's "where there is one, there are many"; thoughtbot's "outsourced operations team"; the Microsoft playbook's "the recommended choice".

**Limits.** API identifiers (`util.parseArgs`, `scheduler.yield()`, `z.stringbool()` …) were not exhaustively checked: 989 of them do not appear literally in the cited pages, because a page about a topic rarely lists every API name. A random sample of 45, inspected by hand, contained no invented names; a full check against each API reference is still open. The 52 sources behind bot walls (ACM, OUP, some w3.org pages) could not be machine-read. They were left in place, since the pages exist.

## 8. Deepening: primary sources read and what they added

| Source (read 2026-09-30) | Added to |
|---|---|
| Amazon Builders' Library, "Caching challenges and strategies" | `scalability/references/caching.md`: load-test with the cache off; no full-rate fallback when the cache dies; soft and hard TTL; cache format as persisted data; fleet-proportional load of in-process caches |
| Stripe, "Scaling your API with rate limiters" | `scalability/references/distributed-patterns.md`: Stripe's four limiters; reserve capacity for critical calls; dark launch, fail open, kill switch; shed and restore slowly |
| Amazon Builders' Library, "Using load shedding to avoid overload" | same file: goodput vs throughput, test past the point of failure, cheap rejection |
| Netflix, "Performance Under Load" | same file: the gradient formula and the √limit queue default |
| Stripe, "Designing robust and predictable APIs with idempotency"; Amazon, "Making retries safe with idempotent APIs" | `api-design/references/rest-conventions.md`: SDK-generated keys reused on retry, late-arriving retries, caller key vs parameter hash |
| Discord, "Why Discord is switching from Go to Rust" (2020); go.dev GC guide | `tech-stack-selection/references/criteria-and-matrix.md`: worked example of a valid language switch, plus the later `GOMEMLIMIT` |
| Notion, "The Great Re-shard" (2023) | `scalability/references/case-studies.md`: 32 → 96 hosts, PgBouncer sharded first, deferred index builds, dark reads, reverse replication |
| Shopify, "Deconstructing the Monolith" (2019) | `codebase-organization/references/growth-stages.md`: reorganize by domain before extracting; Wedge boundary scoring |
| Slack, "Slack's incident on 2-22-22" | `lessons-from-failures/references/outages.md`, case 17b: a metastable failure from a scatter query behind a cache |
| Dan Luu, "Lessons learned from reading postmortems" | `lessons-from-failures/references/principles.md`: config over code, the "ops smell", Jim Gray's 42% |
| IBM Carbon, Login pattern; GOV.UK Email addresses and Passwords | `auth-flows/references/flows-and-screens.md`: preferred path first, auth actions inside the form region, stable geometry, return after an inactivity sign-out, email-field rules |
| GitHub Primer, Loading and Empty states; IBM Carbon, Empty states | `interaction-design/references/states-and-feedback.md`: Primer's timing bands, empty-state copy and error-state rules |
| IBM Carbon, Dashboards | `dashboard-design/SKILL.md` gotchas: one color per series, mirrored filters |
