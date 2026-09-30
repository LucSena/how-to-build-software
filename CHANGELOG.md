# Changelog

All notable changes to this collection. Versioning: `x.y.z` — x = restructure/breaking, y = new skill, z = content updates.

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
