---
name: project-bootstrap
description: Use when starting a new project, repository, service, or app, or when an existing repo is missing basic engineering standards. Covers the walking skeleton and tracer bullets, deploying on day one, CI before features, the tiered day-one repository checklist (README, license, .editorconfig, formatter, linter, strict types, pre-commit hooks, secret scanning, CI, branch protection, Conventional Commits, CODEOWNERS, validated env, .env.example, error tracking, logging, health checks), one-command setup with standard task names, AGENTS.md, the first ADR, design doc vs RFC vs ADR, trunk-based development, small PRs, Definition of Done, SemVer vs CalVer, and changelogs. Also use when the user says "scaffold a new app", "set up the repo", "bootstrap this", or "our repo has no CI". Not for choosing the stack (use tech-stack-selection), folder structure (use codebase-organization), or pipeline, environment, and secrets depth (use deployment-and-infrastructure, environments-and-config).
license: MIT
metadata:
  version: "1.0.1"
  category: engineering
  related: "tech-stack-selection codebase-organization software-architecture environments-and-config deployment-and-infrastructure testing-strategy"
---

# Project Bootstrap

A project's first week decides how painful the next two years are. Standards added on day one cost minutes; the same standards retrofitted onto 50,000 lines cost weeks and a pile of "fix lint" commits. This skill gets a repo to a deployed, tested, automatically checked walking skeleton before any feature work, adds each standard at the moment it starts paying off, and stops there, so day one does not turn into a month of gold-plating.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

The stack should already be chosen. If it is not, run `tech-stack-selection` first. In an existing repo, audit what is already there (see Workflow step 1) and add only what is missing. Do not re-scaffold.

## Core principles

1. **Deploy a walking skeleton before writing features.** Integration, deployment, and configuration problems show up on day one, while they are cheap to fix. Gall's law: a complex system that works evolved from a simple system that worked.
2. **Put CI in the first pull request.** Microsoft's engineering playbook sets up the pipeline "before any service code is written for customers". A pipeline added later starts out red on a backlog of violations.
3. **Automate every standard a machine can check.** Formatters, linters, and type checkers settle style debates for good, so human review can focus on design.
4. **Use one command per task, and have CI call the same one.** If `check` passes locally, CI passes. Setup takes one command, not a wiki page.
5. **Keep main releasable and merge small changes every day.** DORA's research links short-lived branches and small batches to higher delivery performance.
6. **Use boring defaults and the official scaffold.** Every deviation from the framework's generator is a decision someone has to explain later. Record deviations in an ADR.
7. **Add each standard in its tier.** Some items belong on day one, some before the first real user, and some before the first teammate. Doing all of them up front delays the skeleton, and skipping them leaves gaps that get retrofitted in production.

## Workflow

- [ ] **1. Audit or frame.** Existing repo: list which checklist items exist (look at manifests, lockfiles, CI workflows, hooks config, `.editorconfig`, `README`, `AGENTS.md`, `docs/adr/`). New repo: write 5 lines covering users, first slice, non-goals, constraints, and a success metric.
- [ ] **2. Scaffold with the official generator** (for example `create-next-app`, `rails new`, `django-admin startproject` or a maintained cookiecutter, `uv init`, `go mod init`, Spring Initializr, `dotnet new`). Commit it untouched so later diffs are readable.
- [ ] **3. Add the Tier 1 (day 1) items** from the checklist below in the first one or two PRs. Gate: `check` passes locally.
- [ ] **4. Add CI** that runs install from the lockfile → format check → lint → typecheck → tests → build. Protect `main`. Gate: CI goes green, stays under 10 minutes, and a deliberately failing PR is blocked.
- [ ] **5. Build the walking skeleton**: one screen or endpoint → one real call through the stack → one DB write and read → deployed by CI to a real URL, with `/healthz` and one end-to-end smoke test. Gate: a merge to `main` deploys with no manual steps.
- [ ] **6. Write AGENTS.md and ADR-0001** (and ADR-0002 for the stack if it is not the team default). Gate: a fresh clone reaches a running app using only README + AGENTS.md.
- [ ] **7. Before the first real user**: add the Tier 2 items (error tracking, uptime, backups, migrations workflow, dependency bot).
- [ ] **8. Before the first teammate or outside contributor**: add the Tier 3 items (CODEOWNERS, CONTRIBUTING, PR template, review rules).
- [ ] **9. Iterate in vertical slices**: one feature end to end per small PR, with unfinished work behind a flag. Re-check against Gotchas.

## The walking skeleton

| Term | What it is | Keep it? |
|---|---|---|
| Walking skeleton (Cockburn; Freeman & Pryce) | The thinnest real slice that is automatically **built, deployed, and tested end to end**, linking the main components | Yes. It is production code and grows into the product |
| Tracer bullet (Hunt & Thomas) | Same idea from the coding side: a thin, complete path through all layers, with tests and error handling | Yes |
| Prototype / spike | Throwaway code that answers one question | No. Keep it on a `spike/` branch or folder and never merge it as-is |

Minimum skeleton for a web product: a route or screen → an API call → a DB write and read → deployed to a preview or staging URL by CI, plus `/healthz` (liveness) and `/readyz` (readiness, checks the DB) and one end-to-end smoke test. For a CLI or library, it is a published build artifact (for example a release binary or a package build) produced by CI from `main`, plus one test that runs it.

When the user asks for "an app with features A–F", build A end to end, deploy it, then add B. Do not scaffold every layer for every feature up front.

## Day-one checklist (tiers)

Full table with per-ecosystem commands, config snippets, and a CI example: `references/day-one-checklist.md`.

| Tier | Items |
|---|---|
| **1. Day 1** (first PRs) | `README.md` (what, quickstart in ≤ 5 commands, test, deploy) · `LICENSE` (public repos: choose it deliberately) · `.gitignore` with `.env` ignored · `.env.example` · `.editorconfig` · pinned toolchain (`.nvmrc`/`packageManager`, `.python-version`, `go.mod` toolchain, `rust-toolchain.toml`, or `mise.toml`) · committed lockfile, CI installs from it · formatter · linter · **strict** type checking · pre-commit hooks (fast checks only) · secret scanning (hook + CI) · validated config module · task runner with standard names · CI with required checks · branch protection on `main` · Conventional Commits · test runner with one real test · `AGENTS.md` · `docs/adr/0001-record-architecture-decisions.md` |
| **2. Before the first real user** | Health checks · structured JSON logs to stdout with a request ID · error tracking with release tagging · uptime check · DB migrations tool and naming convention · automated, **restore-tested** backups · dependency update bot and vulnerability audit · preview or staging deploys · Definition of Done written down |
| **3. Before the first teammate or outside contributor** | `CODEOWNERS` (by team, per module) · required reviews · PR template · `CONTRIBUTING.md` · merge strategy written down · `CHANGELOG.md` and a versioning scheme once anything is released to others |

Anything you skip still goes into a README "Production readiness" section as an open TODO. A silently missing item looks the same as a finished one.

### Tool defaults (as of 2026-09)

| Ecosystem | Format | Lint | Types (strict) | Hooks |
|---|---|---|---|---|
| TypeScript/JS | Prettier or Biome | ESLint + typescript-eslint, or Biome | `tsc --noEmit` with `"strict": true`, `noUncheckedIndexedAccess` | husky + lint-staged, or lefthook |
| Python | Ruff format | Ruff | pyright or mypy in strict mode | `pre-commit` framework |
| Go | gofmt | `go vet` + staticcheck or golangci-lint | compiler | lefthook or `pre-commit` |
| Rust | rustfmt | clippy (`-D warnings` in CI) | compiler | lefthook or `pre-commit` |
| Kotlin/Java | ktlint or Spotless | detekt (Kotlin), Error Prone or SpotBugs (Java) | compiler; Kotlin null safety | Gradle task + hook |
| C#/.NET | `dotnet format` | Roslyn analyzers, warnings as errors | `<Nullable>enable</Nullable>` | `pre-commit` framework |

Pre-commit hooks run in seconds: format and lint on staged files plus a secret scan. Tests belong in CI. ThoughtWorks Technology Radar Vol. 33 (Nov 2025) placed pre-commit hooks in *Adopt*.

## One command per task

Use the ecosystem's native runner first (`package.json` scripts, `uv run`, Gradle tasks, `cargo`, `go` + a small Makefile). Add a `justfile` or `Makefile` only as a thin polyglot front door. Use these names everywhere:

| Task | Does |
|---|---|
| `setup` | Install toolchain and dependencies, copy `.env.example` → `.env` if missing, start backing services, migrate, seed |
| `dev` | Run the app with hot reload and backing services (for example `docker compose up` for the DB) |
| `test` | Unit + integration tests |
| `e2e` | End-to-end tests against the local stack |
| `lint` / `fmt` / `typecheck` / `build` | As named |
| `check` | **Everything CI runs, in the same order.** CI calls this exact task |
| `db:migrate` / `db:seed` / `db:reset` | Database lifecycle; seed data is for dev and demos, while tests create their own data |

## Source control workflow

- **Trunk-based development.** DORA: three or fewer active branches, merge to trunk at least once a day, no code freezes or integration phases. Branches live hours, not weeks. Hide unfinished work behind feature flags instead of keeping long-lived branches.
- **Small PRs.** Google's review guide: "100 lines is usually a reasonable size for a CL, and 1000 lines is usually too large". A PR is one self-contained change with its tests. Reviewers may reject a PR for size alone. Exceptions: deletions and automated refactors.
- **A red main stops the line.** DORA's CI guidance: if a breaking change cannot be fixed within minutes, revert it.
- **Squash-merge by default** for a linear history. Use **Conventional Commits** (`feat:`, `fix:`, `feat!:` / `BREAKING CHANGE:`) in the squash title so changelogs and version bumps can be generated.
- **Gitflow** (a long-lived `develop` plus release branches) fits only software that ships several supported versions on a schedule, such as store-reviewed apps with release trains. It is not a default for continuously deployed services.

Branch protection settings, PR template, CODEOWNERS, merge strategies, and versioning details: `references/repo-conventions.md`.

## Definition of Done (agent version)

- [ ] Acceptance criteria shown to be met, by a test or a described manual check.
- [ ] `check` passes locally: format, lint, typecheck, tests, build.
- [ ] New behavior has tests; each bug fix has a regression test.
- [ ] Errors are handled and logged with context; no secrets or PII in logs.
- [ ] Each new env var is in the config schema, `.env.example`, and deploy docs in the same PR.
- [ ] Migrations are reversible or follow expand/contract.
- [ ] README, AGENTS.md, ADR, and CHANGELOG are updated if setup, behavior, or a decision changed.
- [ ] The diff is one self-contained change. Split it if review would be hard (Google: ~100 lines is reasonable, ~1000 is too large).

## Write it down: PR description, ADR, design doc, or RFC

| Artifact | Use when | Size |
|---|---|---|
| PR description | Local, reversible change that follows existing patterns | A few lines |
| **ADR** | One costly-to-reverse decision: framework, datastore, auth approach, API style, hosting | One page. Immutable: supersede it, don't edit it |
| **Design doc** | Multi-week work, a new service or datastore, cross-team impact, security/privacy/data-model changes, or more than ~1 week of human effort | 2–10 pages; a mini doc of 1–3 pages is fine |
| **RFC / RFD** | Org-wide or community-wide changes that need broad consensus and a tracked status | Numbered, with a stated process |

Rule: write a design doc (not code) first when the change adds a service, datastore, or external dependency, changes a public API or the data model irreversibly, or touches auth, payments, or PII. If the solution is obvious and there are no real trade-offs, skip the doc. Templates: `assets/adr-template.md`, `assets/design-doc-template.md`. When to use which and how to review them: `references/design-docs-and-adrs.md`. The full system-design method lives in `system-design`.

## Versioning and changelogs

| Artifact | Scheme |
|---|---|
| Library, SDK, CLI, or public API consumed by others | **SemVer 2.0.0**: MAJOR breaks, MINOR adds, PATCH fixes. `0.y.z` means "anything may change", so publish `1.0.0` once the public API is stable |
| Deployed web app or service | No user-facing version needed. Identify deploys by git SHA or build number, and expose it at `/version` or in health output |
| Product with dated releases (apps, distributions, platforms) | **CalVer** (e.g. `YYYY.MM.MICRO`) when "breaking" is ill-defined; mobile store builds still need their own build numbers |

Changelog: follow **Keep a Changelog 1.1.0**. It is written for humans, keeps an `Unreleased` section on top, groups entries by Added / Changed / Deprecated / Removed / Fixed / Security, lists the latest version first, and uses ISO dates. Automate the version bump from Conventional Commits (release-please, semantic-release, or Changesets in JS monorepos), but review the generated text.

## AGENTS.md

`AGENTS.md` is an open format, "a README for agents". It holds the exact commands and the conventions a linter cannot enforce. If a tool reads `CLAUDE.md`, symlink that file to `AGENTS.md` so there is one source of truth. Keep it short (a working heuristic: under ~150 lines) and link out to deeper docs. What to include and what to leave out: `references/agents-md.md`. Starter: `assets/agents-md-template.md`.

## Gotchas

- **Big-bang setup.** Spending the first week on Kubernetes manifests, a design system, and six environments before anything is deployed. Ship the skeleton first; add Tier 2 and Tier 3 items when their trigger arrives.
- **Gold-plating the scaffold.** Empty `domain/ application/ infrastructure/` folders, a plugin system, or a `packages/` directory with one app. Scaffold what the first slice needs (see `codebase-organization`).
- **Starting with microservices.** A new product or a single team starts as one deployable, a modular monolith. Splitting comes later and needs a named trigger (see `software-architecture`).
- **"We'll add CI later."** Later means after 400 lint errors and a flaky suite. CI goes in the first PR, even if it only runs `check` on a hello-world.
- **Non-strict types "for now".** Turning on `strict` later means fixing thousands of errors at once. Start strict, and loosen per line with a comment explaining why.
- **Tests in the pre-commit hook.** Slow hooks get bypassed with `--no-verify`. Keep hooks to seconds and run the full suite in CI.
- **Committing `.env`, or real values in `.env.example`.** Only placeholders are committed. A secret pushed even to an unmerged branch is in history: rotate it, because rewriting history is not enough.
- **Reading `process.env` / `os.environ` all over the code.** Use one typed config module, validated at startup, that crashes with a list of the missing keys. Without it, the app boots, serves requests, and fails halfway through a write.
- **Scaffolding with a generator you then fight.** Pick the official generator for the chosen stack and accept its conventions. Custom layouts are a decision that needs an ADR.
- **Long-lived feature branches.** A branch older than 1–2 days turns into a merge project. Merge behind a flag instead.
- **A README that lies.** Test the quickstart from a fresh clone (a dev container or a clean checkout). A broken quickstart costs every new person an afternoon.
- **Manual deploy steps.** If the skeleton needs an SSH session to deploy, it is not a walking skeleton. Deploys run from CI.

## Output format

When bootstrapping, reply with:

```
Bootstrap plan — <project>
Brief: <users · first slice · non-goals · constraints>
Stack: <from tech-stack-selection or project context>
Tier 1 (this PR): <items, grouped: repo files · quality gates · CI · config · docs>
Walking skeleton: <route → API → DB → deploy target → smoke test>
Tier 2 (before first user): <items, as TODOs in README "Production readiness">
Tier 3 (before first teammate): <items>
Decisions recorded: ADR-0001 <title>, ADR-0002 <title>
Verify: <commands run and their result: setup, check, CI run URL, deployed URL>
```

For an audit of an existing repo: a table of `Item | Present? | Evidence (file) | Action`, then the PR plan in tier order.

## References

| File | Read when |
|---|---|
| `references/day-one-checklist.md` | Generating the actual files: per-ecosystem commands, `.editorconfig`, hooks config, config validation, CI workflow, health/logging defaults |
| `references/repo-conventions.md` | Setting branch protection, PR template, CODEOWNERS, merge strategy, commit convention, versioning, or release automation |
| `references/design-docs-and-adrs.md` | Deciding whether a change needs an ADR, a design doc, or an RFC; writing or reviewing one |
| `references/agents-md.md` | Writing or pruning AGENTS.md / CLAUDE.md, or setting it up in a monorepo |
| `assets/adr-template.md` | Writing ADR-0001 or any decision record |
| `assets/design-doc-template.md` | Writing a design doc before multi-week or one-way-door work |
| `assets/readme-template.md` | Creating or fixing the project README |
| `assets/agents-md-template.md` | Creating AGENTS.md from scratch |

## Related skills

- `tech-stack-selection` — before bootstrapping, when language, framework, database, or hosting is still open.
- `codebase-organization` — the folder layout for the skeleton and how it grows.
- `environments-and-config` — typed config, secrets, preview and staging environments, and local dev setup in depth.
- `deployment-and-infrastructure` — CI/CD pipeline design, CI security (pinned actions, OIDC), containers, and hosting.
- `software-architecture` — module boundaries and ADR/C4 conventions once the skeleton exists.
- `testing-strategy` — what the first tests and the smoke test should cover.
