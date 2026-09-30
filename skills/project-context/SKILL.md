---
name: project-context
description: Use when setting up a project for agent work, or when any other skill needs facts about the product, users, stack, platforms, scale targets, architecture style, design system, brand, or constraints and none are written down. Creates and maintains .agents/project-context.md — a single versioned file every skill in this collection reads first — by auto-drafting from the codebase and asking only for what the code cannot reveal. Also use when the user says "remember our stack", "set up context", "onboard yourself to this repo", or when the context file is stale.
license: MIT
metadata:
  version: "1.0.0"
  category: meta
  related: "how-to-build-software"
---

# Project Context

Every skill in this collection makes better decisions when it knows the product, the users, the stack, the platforms, the scale, and the design system. Asking the same questions in every task wastes the user's time and produces inconsistent answers. This skill writes those facts once to `.agents/project-context.md` and keeps them current.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

When running this skill itself: if the file exists, you are **updating** it (see Workflow step 6), not rewriting it.

## Core principles

1. **Draft from evidence, ask for the rest.** The codebase answers stack, structure, and tokens; only humans can answer users, goals, and constraints. Never ask what a file already says.
2. **Facts, not aspirations.** Record what is true now ("Postgres 16 on a single primary") separately from targets ("p95 < 300 ms at 200 RPS").
3. **Short beats complete.** A 150-line file that is read beats a 900-line file that is skimmed. Link to deeper docs instead of copying them.
4. **Versioned and dated.** Stale context is worse than none; every update bumps the version and adds a changelog line.

## Workflow

- [ ] **Scan the repository** (read-only): README, `package.json`/lockfiles, `pyproject.toml`, `go.mod`, `Cargo.toml`, `build.gradle(.kts)`, `Podfile`/`Package.swift`, `app.json`/`app.config.*` (Expo), `pubspec.yaml`, framework configs (`next.config.*`, `vite.config.*`, `tailwind.config.*` or `@theme` blocks), `DESIGN.md`, token files, `docker-compose*`, IaC (`terraform/`, `pulumi/`), CI workflows, `ios/`, `android/`, `docs/adr/`.
- [ ] **Draft every section** of the template below from what you found. Mark each inferred line with `(inferred)`.
- [ ] **Ask only the gaps**, in one batch of at most 6 questions, highest-leverage first: users and their core job; the one metric that matters; scale targets; platforms and minimum OS; brand/visual direction; hard constraints (compliance, budget, deadlines).
- [ ] **Write** `.agents/project-context.md`. Create the `.agents/` folder if needed. If the project already uses `.claude/`, you may also symlink `.claude/project-context.md` to it.
- [ ] **Show a 5-line summary** of what was recorded and what is still unknown.
- [ ] **On update**: edit only the sections that changed, bump the version, add a changelog entry naming the sections and the reason.

## Template

```markdown
# Project Context
**Version:** 1 · **Last updated:** YYYY-MM-DD

## Product
- What it is (one sentence):
- Primary users and the job they hire it for:
- The one metric that matters now:
- Stage: idea / MVP / early traction / scaling / mature

## Platforms
- Web: yes/no — browsers/devices that matter
- iOS: yes/no — minimum iOS version, iPad?
- Android: yes/no — minimum API level, tablets/foldables?
- Other: desktop, watch, CLI, API-only

## Stack
- Languages and frameworks (with versions):
- Data stores:
- Hosting/runtime (serverless, containers, edge):
- Key third-party services (auth, payments, email, analytics, LLM providers):
- Package manager, monorepo tool, CI:

## Architecture
- Style (modular monolith, services, serverless functions, local-first…):
- Main modules/bounded contexts and who owns them:
- Integration style (REST, GraphQL, tRPC, gRPC, events):
- ADRs: link to docs/adr/ if present

## Scale and reliability
- Current load (users, RPS, data size) and 12-month target:
- Latency/availability targets (SLOs):
- Regions, data residency:

## Design system
- Source of truth (DESIGN.md, Figma, token files, component library):
- Fonts, color strategy, radius/density, icon set:
- Brand voice (3 adjectives + 1 "never"):
- Accessibility target (default WCAG 2.2 AA):
- Visual references the team likes:

## Constraints
- Compliance (GDPR, HIPAA, SOC 2, PCI, LGPD…):
- Budget/cost ceilings:
- Team size and skills:
- Deadlines:

## Conventions
- Code style, testing approach, branch/commit conventions, anything agents keep getting wrong:

## Glossary
- Domain terms and their exact meaning:

## Changelog
- vN (YYYY-MM-DD): sections touched — reason
```

## Gotchas

- **Asking before scanning.** Users hate answering "what framework do you use?" when `package.json` says it. Scan first.
- **Recording secrets.** Never copy API keys, connection strings, or internal hostnames into the file; it gets committed. Record the *service name* only.
- **Inferring scale from nothing.** If there is no data, write `unknown` — do not guess "10k users". Downstream skills treat numbers here as real.
- **Writing a design system from scratch here.** This file points to the design source of truth; `design-systems` creates it.
- **Overwriting user edits.** On update, merge. Never regenerate the whole file.
- **Monorepos.** Record each app's platform/stack separately under Platforms/Stack rather than averaging them.

## Output format

1. The file `.agents/project-context.md` following the template.
2. A reply: `Recorded: …` (3–5 bullets) · `Unknown: …` (the questions that remain) · `Next: …` (the skill the user most likely needs next).

## Related skills

- `how-to-build-software` — once context exists, route the actual task.
- `design-systems` — when the Design system section is empty or contradictory.
- `software-architecture` — when the Architecture section reveals no clear boundaries.
