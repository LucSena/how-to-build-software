# AGENTS.md

<One paragraph: what this repo is, its architecture style (e.g. "modular monolith, one deployable"), and where product context lives (`.agents/project-context.md`).>

## Map

```
src/app/          routing only (thin)
src/features/<x>/ one folder per feature: components, server, schemas, tests
src/server/       cross-feature server infrastructure (db, auth, email)
docs/adr/         architecture decision records
```

## Commands

- Setup: `<setup>`
- Dev server: `<dev>`
- Everything CI runs: `<check>` — must pass before any commit
- All tests: `<test>` · one file: `<cmd path>` · one test: `<cmd -t "name">`
- Typecheck: `<typecheck>` · Lint/format: `<lint>` / `<fmt>`
- New migration: `<cmd name>` · Apply: `<migrate>` · Seed: `<seed>`

## Conventions

- New feature code goes in `src/features/<feature>/`; features never import each other's internals.
- Env vars: add to `<config module>` schema + `.env.example` + deploy docs in the same PR. Never read `process.env` elsewhere.
- Errors: <pattern, e.g. "throw domain errors from services; map to HTTP in route handlers">.
- Logging: <logger import>; structured fields; never log secrets or PII.
- Tests next to code as `*.test.ts`; bug fixes include a regression test.
- Versions in use (do not write code for older APIs): <framework X.Y, ORM X.Y, language X.Y>.

## Boundaries — ask a human first

- Adding a runtime dependency.
- Migrations that drop or rewrite data; anything touching production data.
- Changes to `.github/workflows/`, auth, billing, or public API contracts.
- Never edit: generated files (`<paths>`), lockfiles by hand, vendored code.

## Definition of Done

- `<check>` passes; new behavior tested; docs/ADR/CHANGELOG updated when setup, behavior, or a decision changed.
- PR title uses Conventional Commits (`feat(scope): …`); one self-contained change per PR.
