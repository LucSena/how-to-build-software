---
name: how-to-build-software
description: Use when starting or planning any non-trivial software work — a new app, feature, screen, service, refactor, redesign, or review — to pick which engineering, design, and mobile skills apply and in what order. Routes intents like "build me a SaaS", "design this screen", "make it scale", "clean up this code", "review my app", or "ship an iOS/Android app" to the right skills, and sets the universal quality bar every deliverable must clear. Use it first whenever a task spans more than one discipline, even if the user does not mention skills.
license: MIT
metadata:
  version: "1.0.0"
  category: meta
  related: "project-context software-architecture design-taste mobile-design code-review design-review"
---

# How to Build Software

This is the entry point. It does not teach a discipline itself; it decides which skills to load, in which order, and holds every task to one quality bar. Good software comes from a small number of correct decisions made early (boundaries, data model, visual direction, platform conventions) and a large number of small details done consistently. This skill protects both.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Understand the job before choosing the shape.** Name the user, the job they hire the software for, and the one outcome that matters; every later choice is judged against it.
2. **Make the reversible/irreversible split explicit.** Spend thinking on one-way doors (data model, public API, platform choice, brand direction); move fast on two-way doors.
3. **Choose boring technology by default.** Each novel dependency spends a limited "innovation budget"; spend it only where it differentiates the product.
4. **Simplest design that meets today's measured need, with a seam for tomorrow.** No speculative microservices, plugin systems, or abstractions for a second use case that does not exist.
5. **Design is part of engineering, not a coat of paint.** Visual direction, states, and copy are decided before the component tree, not after.
6. **Follow the platform.** Web, iOS, and Android each have conventions users already know; fight them only with a reason you can state.
7. **Quality is verified, not asserted.** Every deliverable ends with a check: tests, validator, screenshot review, or audit against the relevant skill's Gotchas.

## Workflow

- [ ] Read project context (or draft it with `project-context` for anything multi-day).
- [ ] Classify the request with the routing table below; list the 2–5 skills that apply.
- [ ] Load skills in **decision order**: product/UX → architecture → design direction → implementation → review.
- [ ] State the plan in a few lines: skills used, key decisions, what will be verified.
- [ ] Build in thin vertical slices (one working path end-to-end before breadth).
- [ ] Verify against the quality bar and each loaded skill's Gotchas; fix and repeat.

## Routing table

| The user wants to… | Load, in order |
|---|---|
| Start a new product or app | `project-context` → `software-architecture` → `frontend-architecture` or `mobile-architecture` → `design-taste` → `design-foundations` → `design-systems` |
| Build or change a web screen/page | `design-taste` → `design-foundations` → `interaction-design` → `accessibility` → `web-platform` |
| Build a landing page, signup, onboarding, pricing, checkout | `conversion-ux` → `design-taste` → `design-foundations` → `web-platform` |
| Build a dashboard, table, admin, or data-heavy view | `data-dense-ui` → `interaction-design` → `design-foundations` |
| Build a chat, copilot, or agent interface | `ai-interface-design` → `interaction-design` → `ai-native-architecture` |
| Add animation or polish interactions | `motion-design` → `interaction-design` |
| Create or clean up a design system, tokens, DESIGN.md | `design-systems` → `design-foundations` |
| Pick icons, component libraries, inspiration | `design-resources` |
| Review or critique a UI | `design-review` (it pulls in `ux-principles`, `accessibility`) |
| Design an iPhone/iPad app | `mobile-design` → `ios-design` → `mobile-architecture` |
| Design an Android app | `mobile-design` → `android-design` → `mobile-architecture` |
| Choose native vs React Native/Flutter/KMP | `mobile-architecture` |
| Structure a codebase, define modules/boundaries | `software-architecture` → `design-patterns` |
| Clean up, refactor, or name things better | `clean-code` → `design-patterns` → `testing-strategy` |
| Make it handle more load / data | `scalability` → `reliability` |
| Make it stop breaking in production | `reliability` → `testing-strategy` |
| Design an HTTP/GraphQL/gRPC API or webhooks | `api-design` |
| Decide what and how to test | `testing-strategy` |
| Build an LLM feature, RAG, or agent | `ai-native-architecture` → `ai-interface-design` |
| Review code or a PR | `code-review` |
| Understand why users struggle | `ux-principles` → `design-review` |

When two rows match, take the union and keep decision order.

## The universal quality bar

Every deliverable clears all of these before it is called done:

**Engineering**
- Runs, builds, and passes its tests; new behavior has at least one test at the cheapest level that catches regressions.
- No unbounded work: every query paginates or limits, every network call has a timeout, every retry has backoff and a cap.
- Errors are handled where they can be acted on, and surfaced with context otherwise — never swallowed.
- No secrets in code, logs, or client bundles; untrusted input is validated at the boundary.
- Names describe domain intent; no file grows into a god-module without a reason written down.

**Design**
- Every interactive element has hover (pointer devices), focus-visible, active, disabled, and loading states; every data view has loading, empty, error, and partial states.
- WCAG 2.2 AA: text contrast ≥ 4.5:1 (3:1 for large text and UI parts), keyboard reachable, visible focus, targets ≥ 24×24 CSS px (44pt iOS, 48dp Android).
- Responsive from 360px wide to large desktop; respects safe areas on mobile.
- `prefers-reduced-motion` respected; no animation longer than needed to explain a change.
- Real, specific copy — no lorem ipsum, invented metrics, or fake testimonials.
- It does not look like a default template (see `design-taste`).

**Mobile**
- Uses the platform's navigation, back behavior, typography, and system components unless there is a stated reason not to.
- Works offline or degrades clearly; asks for permissions in context, after showing value.

## Gotchas

- **Skipping straight to code.** For anything bigger than a small fix, write the 5-line plan first; the routing table exists because order matters (a data model chosen after the UI is built gets bent to fit the UI).
- **Loading every skill.** More context is not better. Load the 2–5 that match; read their `references/` only when a trigger in the skill says so.
- **Treating the router's quality bar as optional for "prototypes".** Prototypes become products. Accessibility, error states, and timeouts are cheap on day one and expensive on day ninety.
- **Architecture astronautics.** A solo developer or small team almost never needs microservices, event sourcing, or Kubernetes on day one. Default to a modular monolith and a managed database.
- **Design by accumulation.** Adding gradients, shadows, and animations does not create quality. Hierarchy, spacing, typography, and restraint do.
- **Inventing platform conventions.** A custom tab bar or back gesture on iOS/Android almost always feels broken. Check `ios-design` / `android-design` first.

## Output format

When routing, reply with a short plan before doing the work:

```
Plan
- Goal: <one sentence: user, job, outcome>
- Skills: <skill> (why), <skill> (why), ...
- Key decisions: <one-way doors and the default chosen>
- Verification: <tests / audits / screenshots that will prove it>
```

Then execute, and end with a short **Done / Verified / Not checked** summary.

## Related skills

- `project-context` — capture stack, platforms, scale, and design system once so every skill reuses it.
- `code-review` — the engineering exit gate.
- `design-review` — the design exit gate.
