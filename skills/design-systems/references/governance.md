# Governance, versioning, and adoption

A design system without governance becomes a component graveyard. This file keeps it small, current, and trusted.

## 1. Versioning (semver)

| Change | Level | Required |
|---|---|---|
| Remove or rename a token, component, prop, or variant | **Major** | A deprecation period first; a migration note; a codemod if the change is mechanical |
| Change a component's default behavior or DOM structure that consumers target | **Major** | Migration note |
| Add a token, component, prop, or variant | **Minor** | Changelog entry, docs, catalog story |
| Change a primitive value; fix a bug; improve accessibility without an API change | **Patch** | Changelog entry |
| Change a widely used semantic value (for example `accent`, `radius-card`, the body size) | Minor or patch, **but treated as visible** | Changelog entry with before/after, visual diff reviewed, product owners notified |

- Version tokens and components together (one package or lockstep versions) unless they have different consumers.
- Keep a `CHANGELOG.md` with newest entries first. Each entry names what changed, why, and what consumers must do.
- Publish a **support policy**: which versions get fixes, and how long a deprecated API remains available (default: one major version).

## 2. Deprecation

1. Mark it: `$deprecated: "Use color.accent; removed in 3.0"` in DTCG, a JSDoc `@deprecated` on props, and a dev-only console warning.
2. Alias the old name to the new one so nothing breaks.
3. Announce it in the changelog and to the owning teams.
4. Measure the remaining usage (grep or an analytics script).
5. Remove it in the next major version, with a codemod where possible.

## 3. Contribution model

- **The system moves slower than product teams, and that is intended.** Products can build local components. Promote a component to the system when **three or more** teams or surfaces need it, or when it encodes an accessibility pattern that should not be re-implemented.
- A proposal template covers: the problem, existing alternatives, the API sketch, states, accessibility, cross-platform impact, and an owner.
- The quality bar before merge: every state in the matrix, both themes, RTL, keyboard, docs, a catalog story, and visual regression.
- Keep a **decision log** (lightweight ADRs) for choices like "we don't ship a floating label" or "toasts never hold critical errors", so the argument happens only once.
- Credit contributors in the changelog.

## 4. Documentation

- Getting started: install, theme setup, and how to use tokens (with a do/don't example of semantic vs primitive usage).
- Principles: 3–5 principles that take positions with trade-offs ("Clarity over density", "Native over custom on mobile"). A principle nobody could disagree with is not a principle.
- Per component: purpose, anatomy, props, states, accessibility, content guidelines, and examples (see `component-checklist.md`).
- Token reference, generated from the source, listing each token's value per mode and its description.
- A browser and OS support policy.
- DESIGN.md at the repo root, so agents read the same system that people do.

## 5. Adoption and health metrics

| Metric | How to measure | Signal |
|---|---|---|
| Component coverage | The share of UI imports that come from the system vs local copies | Rising means adoption |
| Raw-value drift | Count of hex, px, or arbitrary classes in product code (lint report) | Should trend to zero |
| Detached or forked components | Copies of system components modified locally | A high count means the API is missing something |
| Accessibility defects | Issues traced to system components | Should be near zero; fix these first |
| Time to adopt a release | Days until consumers upgrade | Long lags mean upgrades hurt; add codemods |
| Request SLA | Time from request to decision | Predictability builds trust |

## 6. Team process

- A named owner (or a rotation) for support requests and reviews.
- A predictable release cadence (for example every two weeks for minor and patch releases, with majors announced a quarter ahead).
- A roadmap time-boxed to what the team can actually support.
- Support channels per platform, issue and feature templates, and office hours for larger organizations.

## 7. Agent-specific governance

- Put `DESIGN.md` and the token files where agents look first (the repo root, and `.agents/project-context.md` pointing to them).
- Add a lint rule or pre-commit check that fails on raw values in component folders. Agents follow a failing check more reliably than prose.
- In code review of AI-generated UI, check that the code used existing components and tokens rather than recreating them (see `code-review`).

## Sources

- Design System Checklist, Maintenance section (documentation, release cycle, contribution, analytics, SLA): https://www.designsystemchecklist.com/
- Semantic Versioning 2.0.0: https://semver.org
- DTCG `$deprecated`: https://www.designtokens.org/tr/2025.10/format/
- principles.design (writing principles that take positions): https://principles.design/
