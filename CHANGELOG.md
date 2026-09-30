# Changelog

All notable changes to this collection. Versioning: `x.y.z` — x = restructure/breaking, y = new skill, z = content updates.

## Unreleased

- **Website rebuilt as one simple page** (per language: English, Português, Español), styled like a long blog post: a single reading column, Charis SIL for body text, Source Sans 3 for headings, Source Code Pro for code, light and dark themes. It shows what the skills are, how to install them, three real routing examples from the router table, three real gotchas, and all 45 skills with their summaries. Replaces the earlier multi-page "notebook" design.
- The site generator now has **no dependencies** (plain Node, self-hosted fonts); the Pages workflow no longer runs `npm ci`.

## 0.2.1 — 2026-09-30

Source verification against the original pages, with full web access, plus deeper engineering and design content read at the source.

- **Verified against the originals.** Every URL cited in `skills/` (1,430) was requested, and failures were re-checked in a real browser. The text of 1,390+ sources was downloaded, and each line with a number, version, date, or quote was matched against the sources its file cites. Lines that did not match were reviewed by hand and corrected or removed. Full log: `research/P-source-review-2026-09.md`.
- **Corrections (examples):** Rams now has 348 rules (not "300+"); transitions.dev has 43+ transitions and a motion-scoring agent (not "about 18"); getdesign.md has 550+ DESIGN.md files (not 70+); Kotlin 2.4.0 was released 2026-07-14 (not June); the Hawaii alert prompt is quoted exactly from the FCC report; the npm chalk/debug compromise reached "more than 2 billion" weekly downloads per the first report (not 2.6 billion); a quote attributed to Gunnar Morling was actually Conduktor's; the "35% dimming" rule for Liquid Glass is not in Apple's session and was removed; an unsourced "$47,000 agent loop" story was removed; icon library counts and licenses updated (Isocons is CC BY 4.0, Remix Icon's license has prohibitions, lucide-animated has 467 icons).
- **Broken links fixed:** import-linter, Sentry, Travis CI, "The Log", arlobelshee.com, misko.hevery.com, SiliconANGLE, the butterfly-ballot source (now the APSR paper).
- **New reference:** `application-security/references/external-exposure.md`, a pre-launch pass for what attackers check first (leaked `.env`/`.git`/source maps, metrics and actuators, BaaS tables without RLS, open sign-up, SSRF through image optimizers, dangling DNS, staging), adapted from recon-skills and confirmed in vendor docs.
- **Deepened from primary sources:** Amazon Builders' Library (caching, load shedding, idempotent retries), Stripe (rate limiters, idempotency), Netflix (adaptive concurrency limits), Discord (Go → Rust as a worked stack decision), Notion (the 2023 re-shard), Shopify (deconstructing the monolith), Slack (the 2022 metastable incident), Dan Luu (postmortem lessons), IBM Carbon (login, empty states, dashboards), GitHub Primer (loading, empty states), GOV.UK (email addresses, passwords), Impeccable's slop catalog.
- **Validator:** the nested-reference check no longer misfires on Python < 3.11, where `Path.glob("*/")` also matched files.

## 0.2.0 — 2026-09-30

Much deeper engineering, the product flows people ask for most, and a website.

- **New engineering skills (12):** `project-bootstrap`, `tech-stack-selection`, `codebase-organization`, `object-oriented-design`, `dependency-management`, `system-design`, `data-modeling`, `data-infrastructure` (choosing databases, caches, queues, search, storage), `environments-and-config`, `deployment-and-infrastructure`, `application-security`, `lessons-from-failures` (postmortems, supply-chain incidents, project and redesign failures).
- **New product-flow skills (4):** `auth-flows` (login, sign-up, passkeys, MFA, recovery, sessions), `onboarding-design`, `dashboard-design` (with app shell and navigation), `app-screen-patterns` (settings, team, billing, notifications, search, API keys, error pages).
- **Upgraded (1.1.0):** `how-to-build-software` (new routing and quality bar), `clean-code` (canonical talks and essays), `software-architecture` and `scalability` (case studies from engineering blogs), `reliability` (postmortem-derived rules), `design-systems` (building one from zero), `conversion-ux` and `data-dense-ui` (clear scope boundaries).
- **Website** in English, Portuguese, and Spanish, generated from the skills (`site/`), with a bibliography of every cited source; deployed by GitHub Pages.
- CI: workflow actions pinned to commit SHAs.

## 0.1.0 — 2026-09-30

Initial collection of 29 skills.

- **Start here:** `how-to-build-software` (router and universal quality bar), `project-context` (shared `.agents/project-context.md`).
- **Engineering (10):** `software-architecture`, `design-patterns`, `clean-code`, `scalability`, `reliability`, `api-design`, `testing-strategy`, `frontend-architecture`, `ai-native-architecture`, `code-review`.
- **Design (13):** `design-taste`, `design-foundations`, `design-systems`, `ux-principles`, `interaction-design`, `motion-design`, `accessibility`, `web-platform`, `conversion-ux`, `ai-interface-design`, `data-dense-ui`, `design-review`, `design-resources`.
- **Mobile (4):** `mobile-design`, `ios-design` (Liquid Glass, iOS 26–27), `android-design` (Material 3 Expressive, Android 16–17), `mobile-architecture`.
- Tooling: style contract (`STYLE.md`), skill template, validator, README/marketplace sync, CI workflow, Claude Code marketplace with `how-to-build-software`, `engineering-skills`, `design-skills`, and `mobile-skills` plugins.
