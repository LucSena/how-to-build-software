# H. Starting a project right, choosing a stack, organizing and scaling a codebase — research notes (as of 2026-09)

Purpose: raw material for skills that teach AI coding agents (A) day-one project standards, (B) tech stack selection, (C) codebase organization and growth. Builds on `E-architecture.md` (architecture styles, modular monolith rules, FSD, monorepo basics, ADRs, C4, 12-factor, fitness functions): those are **not** repeated here except where a new source or concrete template adds something.

Conventions in this file:
- Every claim carries a source. "(primary)" = read in the original doc/repo during this session. "(secondary)" = seen via search-result summaries or third-party write-ups, not the original. "(memory — verify)" = from background knowledge, not re-checked in this session; do not ship as a hard fact without verification.
- "Agent rule" = proposed imperative wording for a SKILL.md.
- Web access was limited (WebFetch blocked; search budget exhausted mid-session). Primary reads came from cloned repos and raw GitHub files listed in §13.

---

## 0. Executive summary (the 20 rules that matter most)

1. **Build a walking skeleton first**: the thinnest end-to-end slice that is automatically built, tested and deployed, before real features. (Cockburn; Freeman & Pryce GOOS; Pragmatic Programmer "tracer bullets" — §1.1)
2. **CI before feature code.** Microsoft's ISE playbook: set up the pipeline "before any service code is written for customers", in "Sprint 0". (§1.3)
3. **One command to build, test, run.** "A single command should have the capability of building the system" locally and in CI; F5 contract / time-to-first-E2E-result. (§1.5)
4. **Main is always shippable; protect it; merge through PRs with required checks.** (§1.4)
5. **Trunk-based development with short-lived branches**: DORA — ≤3 active branches, merge to trunk at least daily, no code freezes. (§1.6)
6. **Small changes**: Google — ~100 lines is usually reasonable, ~1000 usually too large; one self-contained change per PR. (§1.6)
7. **Validate config at startup, fail fast; secrets never in git** (.env ignored, `.env.example` committed, secret scanning). (§1.7)
8. **Formatter + linter + strict type checking + pre-commit hooks from day one.** ThoughtWorks Radar Vol. 33 (Nov 2025) moved pre-commit hooks to Adopt. (§1.4, §2)
9. **Write it down before building big things**: design doc / RFC for anything cross-cutting, costly to reverse, or multi-week; ADR for each one-way-door decision. (§1.8)
10. **Write an AGENTS.md** (plus CLAUDE.md symlink if needed) with the exact commands and conventions. Radar Vol. 33: AGENTS.md in Trial; "curated shared instructions for software teams" in Adopt. (§1.9)
11. **Choose boring technology**; spend at most ~3 "innovation tokens", and only on your competitive edge. (McKinley — §3.1)
12. **Default stack choice is driven by team skill and the deployment target, not benchmarks.** Decision table in §4.
13. **Just use Postgres** unless a specific access pattern demands otherwise; SQLite is a legitimate production choice for single-node apps. (§5)
14. **Buy, don't build, generic subdomains**: auth, payments, email, error tracking, feature flags, search (at first). (§6)
15. **Prefer typed, popular languages** — also for AI-assisted coding: 94% of compile errors in LLM-generated code were type-check failures in one PLDI 2025 study; TypeScript became #1 on GitHub in Aug 2025. (§3.4, §4)
16. **Organize by feature/domain, not by technical layer**; the top-level folders should "scream" the domain. (§8)
17. **Each module has a small public surface; enforce boundaries with tools in CI** (dependency-cruiser, eslint-plugin-boundaries, import-linter, Go `internal/`, ArchUnit/Spring Modulith, Packwerk). (§9)
18. **Avoid barrel files in app code**; import directly or via package `exports`. Atlassian cut Jira frontend build times ~75% by removing them. (§9.3)
19. **Don't split until it hurts, and split along ownership seams**: module → package → service. Conway's law and team cognitive load decide boundaries. (§10)
20. **Use the ecosystem's official/idiomatic layout** (e.g., go.dev "Organizing a Go module", not `golang-standards/project-layout`). Concrete templates in §11.

---

## 1. (A) Starting a project right

### 1.1 Walking skeleton / tracer bullet / Gall's law

- **Walking skeleton** (Alistair Cockburn): "a tiny implementation of the system that performs a small end-to-end function. It need not use the final architecture, but it should link together the main architectural components. The architecture and the functionality can then evolve in parallel." (secondary: https://www.henricodolfing.ch/en/start-your-project-with-a-walking-skeleton/ ; also 97 Things Every Software Architect Should Know, ch. 60 "Start with a Walking Skeleton", https://www.oreilly.com/library/view/97-things-every/9780596800611/ch60.html)
- Freeman & Pryce, *Growing Object-Oriented Software, Guided by Tests* (2009): walking skeleton = "an implementation of the thinnest possible slice of real functionality that we can automatically **build, deploy, and test end-to-end**", with "just enough of the automation, the major components, and communication mechanisms to allow us to start working on the first feature". (secondary, same search results)
- **Tracer bullets** (Hunt & Thomas, *The Pragmatic Programmer*): a thin end-to-end path through all major components that is **kept** — production-quality (validation, tests, docs), lean but complete. **Prototypes are disposable**; tracer code is not. (secondary: https://www.barbarianmeetscoding.com/notes/books/pragmatic-programmer/tracer-bullets/ ; https://builtin.com/software-engineering-perspectives/what-are-tracer-bullets)
- **Gall's law** (John Gall, *Systemantics*, 1975): "A complex system that works is invariably found to have evolved from a simple system that worked. A complex system designed from scratch never works and cannot be patched up to make it work. You have to start over with a working simple system." (primary: dwmkerr/hacker-laws README, https://github.com/dwmkerr/hacker-laws#galls-law)

Agent rules:
- For a new project, the **first deliverable is a deployed "hello" slice**: one route/screen → one API call → one DB read/write → deployed to a real (staging) URL by CI, with one automated end-to-end test. No feature work until this is green.
- Label throwaway spikes as prototypes (separate branch/folder, `spike/`), never merge them as-is. Tracer/skeleton code is production code: tests, typing, error handling.
- When asked to "build X with features A–F", build A end-to-end first, deploy, then iterate. Do not scaffold all layers for all features up front.

### 1.2 Simplicity doctrine (YAGNI, grug, boring)

- **YAGNI** (Ron Jeffries, XP): "Always implement things when you actually need them, never when you just foresee that you need them." (primary: hacker-laws, https://github.com/dwmkerr/hacker-laws#yagni)
- **Grug Brained Developer** (Carson Gross, https://grugbrain.dev): "complexity *very, very* bad"; the best weapon against complexity is the word "no"; don't factor an application too early — wait for the shape of the system to emerge, then find good "cut points" with narrow interfaces that trap complexity "like a demon in a crystal". (secondary summary of the essay; phrasing of quoted fragments matches the essay as widely cited)
- thoughtbot general guide: "Don't write code that guesses at future functionality."; "Keep the code simple."; "Don't duplicate the functionality of a built-in library." (primary: thoughtbot/guides `general/README.md`)
- "Cognitive load is what matters" (zakirullin, https://minds.md/zakirullin/cognitive): "A well-crafted monolith with truly isolated modules is often much more flexible than a bunch of microservices"; "Familiarity is not the same as simplicity"; "The more mental models there are to learn, the longer it takes for a new developer to deliver value." (primary via charlax/professional-programming notes)
- Gergely Orosz, "Software Architecture is Overrated, Clear and Simple Design is Underrated" (https://blog.pragmaticengineer.com/software-architecture-is-overrated/): at Uber and Skype, designs were done with plain boxes-and-arrows diagrams and written docs, not UML/4+1/C4; start from the business problem, brainstorm, write in clear language, discuss trade-offs and alternatives; Uber used an RFC-like process with templates. (secondary)
- "Build the right thing, then build the thing right" — verification vs validation (Barry Boehm's phrasing "Are we building the right product?" vs "Are we building the product right?"). (memory — verify; Boehm 1979/1981)

Agent rules:
- Before adding a dependency, layer, abstraction, or service, state the concrete present need in one sentence. If the need is speculative, don't add it; leave a seam (a function boundary) instead.
- Prefer the framework's defaults and conventions over custom architecture for the first version.

### 1.3 Deploy on day one, CI before features

- Microsoft Code-With Engineering Playbook, *Continuous Integration*: "We encourage engineering teams to make an upfront investment during Sprint 0 … to establish an automated and repeatable pipeline which continuously integrates code and releases system executable(s) to target cloud environments." and "We encourage teams to implement the CI/CD pipelines **before any service code is written for customers**." (primary: `docs/CI-CD/continuous-integration.md`)
- Same doc: build definitions live in the repo; "A single command should have the capability of building the system" (locally and in CI); "No IDE dependencies"; code style asserted in CI from a single config file; add credential scanning / static analysis early; "Keep the build fast … Consider adding max timeout limits"; mocked datasets for tests checked into the repo. (primary)
- Playbook *Branching & CI/CD*: "The integration (main) branch should be continuously shippable and stable — at any point we should be able to deploy a build from `main` to production"; deploy release candidates automatically to a non-production env; automate release and rollback; infra via IaC (Terraform, Bicep, Pulumi). (primary: `docs/agile-development/branching-and-cicd.md`)
- DORA *Continuous integration*: build/test feedback in a few minutes, "upper limit of about 10 minutes"; if the build breaks and can't be fixed in a few minutes, revert the change that broke it. (primary: dora-team/dora.dev `hugo/content/capabilities/continuous-integration/index.md`)
- "Production Oriented Development" (Paul Osman, https://paulosman.me/2019/12/30/production-oriented-development.html): code in production is the only code that matters; buy almost always beats build; make deploys easy; boring technology is great; non-production environments have diminishing returns. (primary via charlax notes)

Agent rules:
- In the first PR of a new repo, include the CI workflow (install → format check → lint → typecheck → test → build). Target < 10 minutes.
- Set up a preview/staging deploy for every PR or merge to main as soon as the skeleton exists (PaaS preview environments make this near-free).
- A red main is a stop-the-line event: fix or revert.

### 1.4 Day-one repository checklist (consolidated)

Sources: MS playbook *Creating a New Repository*, *Engineering Fundamentals Checklist*, *The First Week of an ISE Project* (primary); T3 env docs (primary); bulletproof-react *Project Standards* (primary); Node best practices §1.4, §4.4, §5.4, §5.19 (primary); Sairyss backend best practices (primary); Radar Vol. 33 (secondary). "Tier" says when it's needed.

| # | Item | Tier | Notes / source |
|---|---|---|---|
| 1 | `README.md`: what it is, quickstart (≤5 commands), how to test, how to deploy, where docs live | Day 1 | MS: README, LICENSE, CONTRIBUTING in default branch for public repos |
| 2 | `LICENSE` (public repos; pick deliberately — MIT/Apache-2.0 permissive, AGPL for network copyleft) | Day 1 | MS playbook; Russ Cox's minimal "standard" Go repo starts with LICENSE (§11.6) |
| 3 | `.gitignore` for the stack + `.env` ignored; `.env.example` committed with dummy values | Day 1 | T3 env docs; Sairyss |
| 4 | `.editorconfig` (indent, EOL `\n`, final newline, charset) | Day 1 | thoughtbot: Unix line endings, no trailing spaces (primary) |
| 5 | Pinned toolchain: `.nvmrc`/`.node-version`, `packageManager`/`devEngines`, `.python-version`+`uv.lock`, `go.mod` `go`/`toolchain`, `rust-toolchain.toml`, `mise.toml`/`.tool-versions` | Day 1 | Node BP 4.4 "Ensure Node version is unified", 5.17 LTS; thoughtbot repo itself ships `mise.toml` |
| 6 | Lockfile committed; CI installs from lockfile (`npm ci`, `pnpm install --frozen-lockfile`, `uv sync --locked`) | Day 1 | Node BP 5.4 "Lock dependencies", 5.19 "Install your packages with npm ci" |
| 7 | Formatter (Prettier/Biome, Ruff format, gofmt, rustfmt, ktlint/Spotless, `dotnet format`) + format-on-save | Day 1 | bulletproof-react; FastAPI BP "Use ruff" |
| 8 | Linter with a sane preset (ESLint+typescript-eslint or Biome, Ruff, staticcheck/golangci-lint, clippy, detekt) | Day 1 | Node BP 3.1; golang-standards README recommends staticcheck (golint deprecated) |
| 9 | Type checking in strict mode (`"strict": true` + `noUncheckedIndexedAccess`; mypy/pyright strict; Kotlin/Swift/Go/Rust native) | Day 1 | T3 axiom "Typesafety isn't optional"; bulletproof-react |
| 10 | Absolute import alias (`@/*` → `src/*`) | Day 1 (TS) | bulletproof-react |
| 11 | Pre-commit hooks (husky+lint-staged, lefthook, `pre-commit` framework) running format+lint (fast checks only) | Day 1 | Radar Vol. 33: pre-commit hooks → **Adopt**; bulletproof-react (Husky); thoughtbot repo uses `lefthook.yml` |
| 12 | Secret scanning (gitleaks / GitHub push protection / detect-secrets) in hook and CI | Day 1 | MS playbook credential scanning; "assume any repo … may go public at any time" |
| 13 | CI: install → format check → lint → typecheck → unit tests → build; required status checks | Day 1 | MS CI doc; DORA |
| 14 | Branch protection on `main`: PR required, checks required, ≥1 review (teams), no force push | Day 1 | MS: "The default target branch is locked. Merges are done through PRs." |
| 15 | Merge strategy agreed (squash-merge for linear history is the common default) | Day 1 | MS *Merge Strategies*; thoughtbot git guide (rebase workflow, squash trivial commits) |
| 16 | Commit convention (Conventional Commits) + PR template | Day 1 | MS *Pull Requests*; conventionalcommits.org |
| 17 | Config module that validates env vars at startup/build (zod/t3-env, pydantic-settings, envconfig, Spring `@ConfigurationProperties` + validation) | Day 1 | Node BP 1.4 (fail fast; otherwise app starts and corrupts state); T3 env |
| 18 | One-command setup and run: `make dev` / `just dev` / `pnpm dev`, `docker compose up` for backing services; seed script | Day 1–3 | Sairyss "Make application easy to setup"; MS DevEx F5 contract |
| 19 | Test runner + one real test + one e2e/smoke test of the skeleton | Day 1–3 | MS Day 1 "Decide on test frameworks" |
| 20 | Health endpoint (`/healthz` liveness, `/readyz` readiness) | Before first deploy | Node BP 5.7 "maintenance endpoint"; IETF draft health check format (https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-06) |
| 21 | Structured logging to stdout with request/correlation id | Before first deploy | Node BP 5.14, 5.18; MS observability checklist |
| 22 | Error tracking (Sentry or equivalent) + uptime check | Before real users | thoughtbot production checklist ("Are we tracking errors?", "monitoring performance and uptime?") |
| 23 | DB migrations tool + naming conventions; backups on | Before real data | FastAPI BP (Alembic, naming conventions); thoughtbot ("Are we backing up our production database?") |
| 24 | Dependency update bot (Renovate/Dependabot) + vulnerability audit | Week 1 | Node BP 5.13, 6.7 |
| 25 | `CODEOWNERS` | When >1 team or >~5 contributors | GitHub feature; ownership per module (§10.4) |
| 26 | `docs/adr/0001-record-architecture-decisions.md` + ADR for stack choice | Week 1 | MS playbook ships `decision-log/doc/adr/0001-record-architecture-decisions.md` |
| 27 | `AGENTS.md` (+ `CLAUDE.md` symlink) with commands, structure, conventions | Day 1 | agents.md; Radar Vol. 33 (§1.9) |
| 28 | `CONTRIBUTING.md` (branching, review, release) | When accepting outside contributions | MS playbook |
| 29 | `CHANGELOG.md` + versioning scheme | First release | Keep a Changelog; SemVer/CalVer (§1.10) |
| 30 | Definition of Done written down | Week 1 | MS DoD (§1.6) |

Agent rule: when scaffolding, generate items 1–19 and 27 in the first commit(s); list the rest as TODOs in the README "Production readiness" section rather than silently skipping them.

### 1.5 Developer experience: one-command setup, dev containers, task runners, seed data

- MS playbook *Developer Experience*: the essential tasks are **Build, Test, Start, Debug**; measures are **Time to First E2E Result ("F5 contract")** and **Time to First Commit**. F5 contract = clone → configure (e.g., `.env`) → press F5. "Standardize the way tests are run for each component… how each component is started and stopped locally"; solution-level tasks so steps don't multiply by number of components; make tasks cross-platform; onboarding guide; new members file defects against missing docs. (primary: `docs/developer-experience/README.md`)
- MS CI doc: "There should be a central automated manifest / process that streamlines the installation and setup of any software dependencies… Dev Containers can really help standardize the local developer experience." (primary)
- Dev Container spec (https://containers.dev, repo devcontainers/spec): `.devcontainer/devcontainer.json` describes a containerized dev environment usable by VS Code, GitHub Codespaces, JetBrains, CLI. (primary: README)
- Sairyss: "Setting up project after downloading it should be as easy as launching one or few commands in terminal" — package.json scripts, docker-compose for DB + admin tools, Makefile, seeding and migrations. Seeding: use factories/faker for dev data. (primary)
- Node BP 4.5: "Avoid global test fixtures and seeds, add data per-test" (seed data is for dev/demo, tests create their own). (primary)
- `just` (casey/just): "a handy way to save and run project-specific commands"; recipes in a `justfile`, avoids Make's `.PHONY`/tab idiosyncrasies. (primary: README)

Canonical task names (agent rule: use the ecosystem's native runner first — `package.json` scripts, `uv run`/`pyproject` tasks, `go` + Makefile, Gradle tasks, `cargo` — and add a thin `Makefile`/`justfile` only for polyglot repos):

```
setup     # install toolchain + deps, copy .env.example → .env if missing, start services, migrate, seed
dev       # run app(s) with hot reload + backing services (docker compose)
test      # unit + integration
e2e       # end-to-end against local stack
lint      # lint + format check
fmt       # auto-format
typecheck
build
db:migrate / db:seed / db:reset
check     # everything CI runs, in the same order (lint, typecheck, test, build)
```
Rule: **CI calls the same task names** (`make check` / `pnpm check`) so local == CI.

### 1.6 Source control workflow: trunk-based, small PRs, Definition of Done

- **DORA trunk-based development** (primary: dora.dev capabilities, https://dora.dev/capabilities/trunk-based-development/): teams achieve higher delivery and operational performance if they (1) have **three or fewer active branches**, (2) **merge branches to trunk at least once a day**, (3) **don't have code freezes or integration phases** (analysis of 2016 & 2017 State of DevOps data). Branches "typically last no more than a few hours". Pitfalls: heavy multi-approval review, asynchronous review that lets merges languish, not running tests before committing. Improvements: small batches, synchronous/prioritized review, comprehensive automated tests, protect branches so merges require passing tests.
- **Gitflow** (long-lived `develop`, release branches): fits software with multiple supported versions shipped on a schedule (e.g., installed/mobile apps with store review); for continuously deployed web services, trunk-based + feature flags is the evidence-backed default. (DORA above; Gitflow's author Vincent Driessen added a 2020 note that it is not a fit for continuously delivered web apps — memory — verify: https://nvie.com/posts/a-successful-git-branching-model/)
- MS playbook recommends: "Prefer trunk-based development where possible for new projects"; short-lived feature branches; tag releases from the integration branch. (primary)
- **Small CLs** (Google eng-practices, primary: https://google.github.io/eng-practices/review/developer/small-cls.html): small changes are reviewed faster and more thoroughly, less likely to introduce bugs, less wasted work, easier to merge/roll back. "The right size for a CL is **one self-contained change**", includes related tests, keeps the system working; "100 lines is usually a reasonable size for a CL, and 1000 lines is usually too large"; 200 lines across 50 files is usually too large; reviewers may reject a CL solely for size; "Reviewers rarely complain about getting CLs that are too small." Large CLs are OK for file deletions or trusted automated refactors.
- MS *Pull Requests*: one goal per PR ("single responsibility" for the PR), must not break the build, include tests; strategies to keep PRs small: split into self-contained valuable parts, hide unfinished work behind feature flags, split by layer. (primary)
- **Definition of Done** (MS, primary): acceptance criteria met; refactoring complete; builds with no errors; unit tests written and pass; existing tests pass; sufficient diagnostics/telemetry logged; code review complete; UX review (if applicable); documentation updated; merged into default branch; signed off by product owner.

Agent Definition of Done (adapted for skills):
```
[ ] Acceptance criteria demonstrably met (test or manual check described)
[ ] Format, lint, typecheck, tests all pass locally with the same command CI runs
[ ] New behavior has tests; bug fixes have a regression test
[ ] Errors handled and logged with context; no secrets or PII in logs
[ ] Config/env changes added to schema + .env.example + docs
[ ] Migrations are reversible (or expand/contract) and named descriptively
[ ] Docs/README/ADR/CHANGELOG updated if behavior, setup, or a decision changed
[ ] Diff is one self-contained change (~≤400 lines excluding generated/lockfiles; split otherwise)
```
(the 400-line figure is a heuristic, not a sourced threshold; Google's guidance is "~100 reasonable, ~1000 too large")

### 1.7 Config and secrets

- 12-factor *Config* (primary: heroku/12factor `content/en/config.md`): config = everything that varies between deploys; strict separation of config from code; "A litmus test … is whether the codebase could be made open source at any moment, without compromising any credentials." Env vars are granular, orthogonal controls — not grouped into named "environments" (avoid combinatorial `joes-staging` explosion). Internal app wiring (routes, DI) is not "config".
- Node BP 1.4 (primary): config should (a) read from file AND env, (b) keep secrets out of committed code, (c) be hierarchical, (d) typed, (e) **validated to fail fast**, (f) have defaults. "Otherwise: Consider a mandatory environment variable that wasn't provided. The app starts successfully and serves requests, some information is already persisted to DB. Then, it's realized that without this mandatory key the request can't complete, leaving the app in a dirty state."
- T3 env (primary): validate server and client env vars with zod at runtime **and build time**; accessing a server var from the client throws; **don't commit `.env`**, only `.env.example` (they explicitly disagree with committing `.env` + `.env.local` as some frameworks suggest).
- Django Styleguide (primary): `config/env.py` exposes a single `env` object; integration settings live in `config/settings/<integration>.py`, gated by `USE_<INTEGRATION>` defaulting to False, then **fail if required settings are missing** when enabled; everything imported into `base.py`, "nothing that's only included in `production.py`" — production differences come from env vars.
- MS *Secrets Management* (primary): "assume any repo we work on may go public at any time"; keep secrets in ignored files locally and in the platform's secret store in prod; separate secrets per environment; a secret pushed even to an unmerged branch is in history — **rotate it**; don't log secrets, don't put them in URLs.
- Node BP 8.4/8.11: `.dockerignore` to prevent leaking secrets; no secrets in build args. (primary)

Agent rules: (1) One typed config module is the only place that reads `process.env`/`os.environ`; (2) validate on boot and crash with a clear message listing missing keys; (3) every new var is added to the schema, `.env.example`, and deployment docs in the same PR; (4) never print config values in logs; (5) if a secret is ever committed, tell the user to rotate it — rewriting history is not enough.

### 1.8 Design docs, RFCs, ADRs before big work

**When to write what** (synthesis):
| Artifact | Use when | Size | Lifecycle |
|---|---|---|---|
| Nothing (PR description) | Change is local, reversible, follows existing patterns | — | — |
| ADR | One significant, costly-to-reverse decision (datastore, framework, auth approach, public API style) | 1 page | Immutable; superseded, not edited (see E §3.9) |
| Design doc (Google-style) / feature design review (MS) | Multi-week work, new component, cross-team impact, security/privacy/data changes | 2–10 pages (mini docs 1–3 pages) | Reviewed before coding; updated when design changes |
| RFC/RFD | Org- or community-wide changes, anything needing broad consensus | varies | Numbered, stateful process |

- **Design Docs at Google** (Malte Ubl, https://www.industrialempathy.com/posts/design-docs-at-google/): relatively informal documents written before coding that capture the high-level implementation strategy and key design decisions "with emphasis on the trade-offs". Benefits: early identification of design issues while change is cheap; consensus; cross-cutting concerns considered; scaling senior engineers' knowledge; organizational memory. Typical sections: **context and scope; goals and non-goals; the actual design (system-context diagram, APIs, data storage, code/pseudo-code sparingly, degree of constraint); alternatives considered; cross-cutting concerns (security, privacy, observability)**. (secondary for benefits; section list from memory — verify.) Also (memory — verify): if the solution is obvious and there are no real trade-offs, skip the doc and write the code.
- **Rust RFC process** (primary: rust-lang/rfcs README and `0000-template.md`): needed for "substantial" changes; not needed for refactors ("changing shape does not change meaning"), objective improvements, or changes only visible to developers. Template sections: **Summary, Motivation, Guide-level explanation, Reference-level explanation, Drawbacks, Rationale and alternatives, Prior art, Unresolved questions, Future possibilities.** "A hastily-proposed RFC can hurt its chances of acceptance" — lay groundwork first.
- **Kubernetes KEP template** (primary: kubernetes/enhancements `keps/NNNN-kep-template/README.md`): Summary; Motivation (Goals, **Non-Goals**); Proposal (user stories, risks & mitigations); Design details (test plan, graduation criteria alpha/beta/GA, upgrade/downgrade, version skew); **Production Readiness Review** (how to enable/disable, can it be rolled back, what metrics inform rollback, monitoring, SLOs). Good model for "operational" sections most design docs forget.
- **Oxide RFD 1 "Requests for Discussion"** (https://rfd.shared.oxide.computer/rfd/0001 ; https://oxide.computer/blog/rfd-1-requests-for-discussion): states **prediscussion → ideation → discussion → published → committed** (or **abandoned**); RFDs are both a venue for timely discussion of rough ideas and a permanent repository; iterated on in a branch, discussed as a PR, commented on after publication. (secondary)
- **Uber**: RFC-like process with templates (Orosz, secondary). Trade-off discussion is the core.
- MS playbook *Feature/Story Design Review* template (primary): Overview/problem statement (with assumptions); Goals/In-scope; **Non-goals/Out-of-scope**; Proposed design (diagrams); Technology; Non-functional requirements (performance, scalability, latency, availability, RTO/RPO, data size/growth, usage pattern, cost constraints); Dependencies; Risks & mitigation (security, privacy, secrets); Open questions. *Trade study* template: narrow scope, **evaluate 2–3 options**, design experiments to collect evidence fast, finish within a sprint; evaluation criteria can be binary, categorical, or numeric; results table. Design reviews measured by "cost of change" — decisions front-loaded when cheap; if no quorum, the person with most context decides — "Disagree and commit!" (primary)
- HN comment quoted in charlax: "Writing a couple of pages of design docs … might take a few days of work, but can save weeks or more of wasted implementation time." (primary via charlax; anecdotal)

Agent design-doc template (merge of the above, for skills):
```
# <Title> — design doc (status: draft | in review | accepted | superseded)
Context & problem (why now; link issue) · Goals · Non-goals
Proposed design (diagram; data model; API/contract; key flows)
Alternatives considered (2–3, with why-not)
Cross-cutting: security & privacy · observability · performance/scale numbers · cost · migration/rollout & rollback
Risks & open questions · Decision/ADR links
```
Agent rule: produce a design doc (not code) first when the change adds a new service/datastore/external dependency, changes a public API or data model irreversibly, touches auth/payments/PII, or is estimated > ~1 week of human work.

### 1.9 Conventions docs for agents (AGENTS.md / CLAUDE.md)

- **AGENTS.md** (primary: openai/agents.md README, https://agents.md): "a simple, open format for guiding coding agents … a README for agents: a dedicated, predictable place to provide context and instructions". Sample sections: dev environment tips, testing instructions (exact commands, how to run one test, "fix any test or type errors until the whole suite is green", "add or update tests for the code you change"), PR instructions (title format; run lint and test before committing).
- **ThoughtWorks Technology Radar Vol. 33 (Nov 2025)**: **AGENTS.md → Trial**; **"Curated shared instructions for software teams" → Adopt**; **Pre-commit hooks → Adopt**; Claude Code → Trial; MCP → Trial; Pydantic → Adopt. (secondary: https://www.thoughtworks.com/content/dam/thoughtworks/documents/radar/2025/11/tr_technology_radar_vol_33_en.pdf and search summary)
- Real-world example: zhanymkanov/fastapi-best-practices ships an `AGENTS.md` "machine-readable companion" with a **compatibility matrix of minimum versions**, Do/Don't blocks, anti-patterns and a quick-reference table (primary). This repo itself uses `AGENTS.md` with `CLAUDE.md` symlinked.

What an AGENTS.md should contain (agent rule, synthesized):
1. One-paragraph purpose and architecture map (top-level folders and what goes where).
2. Exact commands: setup, dev, test (all + single test), lint, typecheck, build, migrate, seed.
3. Conventions that a linter can't enforce: naming, where new features go, error handling pattern, logging, how to add an env var, how to add a migration.
4. Boundaries: what not to touch (generated code, vendored dirs), what requires human approval (migrations on prod data, dependency additions, public API changes).
5. Definition of Done and PR/commit conventions.
6. Keep it short and current; link to deeper docs instead of pasting them. Nested AGENTS.md per package in monorepos (closest file wins — per agents.md site; memory — verify).

### 1.10 Versioning and changelogs

- **SemVer 2.0.0** (primary: semver/semver `semver.md`): MAJOR for incompatible API changes, MINOR for backward-compatible functionality, PATCH for backward-compatible fixes. Must declare a public API; released versions are immutable; **0.y.z is initial development — anything may change**; 1.0.0 defines the public API; pre-release `-alpha.1`, build metadata `+sha`.
- **CalVer** (https://calver.org): date-based schemes like `YYYY.MM.MICRO` (e.g., Ubuntu `24.04`, pip `24.2`); suited to projects on a release cadence where "breaking" is ill-defined or ubiquitous (apps, OS distros, large platforms). (memory — verify examples)
- Hynek, "Semantic Versioning Will Not Save You" (https://hynek.me/articles/semver-will-not-save-you/): every change can break someone (cf. Hyrum's law); SemVer is a promise of intent, not a guarantee → pin + test upgrades. (link primary via charlax; summary memory — verify)
- **Hyrum's law**: "With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviours of your system will be depended on by somebody." (primary: hacker-laws)
- **Conventional Commits 1.0.0** (primary): `<type>[optional scope]: <description>`, body, footers; `fix:` ↔ PATCH, `feat:` ↔ MINOR, `BREAKING CHANGE:` footer or `!` ↔ MAJOR; other types (`build, chore, ci, docs, style, refactor, perf, test`) from Angular convention via commitlint config-conventional.
- **Keep a Changelog 1.1.0** (primary): changelogs are for humans; an entry for every version; group by type — **Added, Changed, Deprecated, Removed, Fixed, Security**; latest first; `Unreleased` section on top; linkable versions; ISO dates.
- MS *Component Versioning*: version each component independently; generate versions in CI from git history (GitVersion) using commit conventions. (primary)

Decision: **Libraries/SDKs/APIs consumed by others → SemVer** (+ Conventional Commits + automated release tooling such as release-please/changesets/semantic-release). **Deployed apps/services → no user-facing SemVer needed**; use git SHA / build number for deploys, optionally CalVer for human-facing releases (mobile apps need store version numbers). **Monorepos with published packages → per-package SemVer via Changesets** (memory — verify tooling).

---

## 2. (A) Consolidated "project start" sequence for agents (ready to paste)

```
Phase 0 — Frame (before code)
  1. Write 5 lines: users, core job-to-be-done, first slice, non-goals, constraints (team skills, deploy target, budget, compliance).
  2. Pick the stack with the §4 decision table; record ADR-0001 (stack) and ADR-0002 (hosting/DB) only if non-default.
Phase 1 — Skeleton (day 1)
  3. Scaffold with the ecosystem's official generator (create-next-app/create-t3-app, `rails new`, `django-admin startproject` or cookiecutter, `uv init`, `go mod init`, Spring Initializr, `dotnet new`).
  4. Add: README, LICENSE, .gitignore, .editorconfig, toolchain pin, lockfile, formatter, linter, strict typecheck, pre-commit hooks, .env.example + validated config module, AGENTS.md.
  5. CI: install → fmt check → lint → typecheck → test → build (<10 min). Protect main.
  6. Walking skeleton: 1 page → 1 endpoint → 1 table → deployed to staging/preview URL by CI; 1 smoke/e2e test; /healthz.
Phase 2 — Make it operable (before real users)
  7. Error tracking, structured logs with request id, uptime check, DB backups, migrations workflow, dependency bot, secret scanning.
Phase 3 — Iterate
  8. Feature-by-feature vertical slices in small PRs on trunk; feature flags for incomplete work; design doc for anything big.
```

---

## 3. (B) Stack selection — principles and evidence

### 3.1 Choose boring technology / innovation tokens

- Dan McKinley, "Choose Boring Technology" (2015, https://mcfunley.com/choose-boring-technology ; talk version https://boringtechnology.club/):
  - "Every company gets about **three innovation tokens**" — spend them however you like, but the supply is fixed for a long while; each new technology with a substantial learning curve spends one. (secondary summaries; consistent across sources)
  - "Boring should not be conflated with bad"; the value of boring tech is that its **capabilities and failure modes are well understood** (known unknowns vs unknown unknowns). Examples of boring: MySQL, Postgres, PHP, Python (and memcached, cron). (secondary)
  - "Best tool for the job" is myopic: the best tool occupies the "least worst" position across as many problems as possible, because every added technology adds operational overhead for the whole org. (primary via daryllxd notes, https://github.com/daryllxd/lifelong-learning)
  - Process: "Consider how you would solve your immediate problem **without adding anything new**." "**Write down exactly what it is about the current stack that makes solving the problem prohibitively expensive and difficult.**" (primary via notes)
  - (memory — verify) Long-term cost of keeping a system running dwarfs build-time convenience; adding a technology's cost is roughly multiplicative, not additive.
- Charity Majors, "Choose Boring Technology Culture" (2023, https://charity.wtf/2023/05/01/choose-boring-technology-culture/): extends it to a culture where the default is the paved path and new tech needs justification. (secondary)
- T3 axiom **"Bleed responsibly"**: use riskier tech in the less risky parts — "we wouldn't bet on risky new database tech (SQL is great!). But we happily bet on tRPC since it's just functions that are trivial to move off." (primary: create-t3-app docs)
- T3 axiom **"Solve problems"**: add only what solves a specific problem in the core stack. (primary)
- thoughtbot keeps a **standard default stack per company** "to avoid decision fatigue at the beginning of each project", deviating only to evaluate something new or when the default is inappropriate; stacks are layered so one layer can be swapped without losing the others' decisions. Their core (as published): server-rendered HTML where possible, React+TypeScript for client components, avoid SPAs for the web, Rails, Heroku, TDD, PR review, CI, staging, **Postgres for most data**, React Native for cross-platform app-store apps, Kotlin for native Android. (primary: thoughtbot/guides `tech-stack/README.md`; note Heroku default predates 2026 news in §7)

Agent rules:
- Default to the most boring option that satisfies the requirements; list any "innovation token" spend explicitly with its payoff.
- Before adding a new datastore/queue/language, write the "why can't the current stack do this" paragraph (ADR).
- Reversibility test: bet on new tech only where the blast radius and exit cost are small (T3 "bleed responsibly").

### 3.2 Decision criteria (weighted checklist)

Synthesized from MS trade-study template (primary), McKinley (secondary), Node BP "Consider all the consequences when choosing the main framework" (primary: framework choice "determines strategic factors like development style and how likely the team is to hit a wall"; "framework popularity is a supreme consideration"), T3 axioms (primary).

| Criterion | Question | Weight guidance |
|---|---|---|
| Team skill | What do the people who will maintain it already know well? | Highest for small teams — skill beats theoretical fit |
| Deployment target | Browser, iOS/Android, server, edge, embedded, desktop, data/ML notebook? | Often decisive (Swift/Kotlin for native, JS/TS for web UI, Python for ML) |
| Ecosystem maturity | Libraries for your domain (auth, payments, ORM, queues, PDFs, ML)? Docs, StackOverflow answers, AI training data? | High |
| Hiring & community | Can you hire/contract for it in your market? Is the community growing? | High for companies; see survey data §3.3 |
| Type safety | Static types or strong gradual typing available and idiomatic? | High (maintainability + AI output quality, §3.4) |
| Performance needs | Stated in numbers (p95 latency, rps, memory, cold start)? | Only decisive with a measured requirement; most CRUD apps are I/O-bound |
| Operational model | Can you run it? (single binary vs VM runtime vs serverless constraints) | Medium–high |
| Longevity | Age, governance (foundation vs single vendor), release/LTS policy, backwards-compat track record | Medium–high |
| License | OSI license? Source-available relicensing risk (e.g., SSPL/BSL changes)? | Gate for DBs/infra |
| Lock-in / exit cost | Proprietary APIs? Standard protocols (SQL, S3 API, OCI images, OpenTelemetry)? | Medium; prefer standards at data layer |
| Cost | Licensing, hosting, people | Medium |
| Security/compliance | FIPS/HIPAA/SOC2/data residency support | Gate when applicable |

Rule of thumb: **evaluate 2–3 options, run a short spike to collect evidence, record the decision** (MS trade-study template: "Designs should be completed within a sprint", "Narrow evaluation to 2 to 3 solutions", "Design experiments to collect evidence as fast as possible").

### 3.3 Popularity/adoption evidence (as of 2026-09)

- **GitHub Octoverse 2025** (Oct 2025, https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/): in **August 2025 TypeScript became the most used language on GitHub by contributor count**, overtaking Python (by ~42k contributors) and JavaScript; TypeScript +1M contributors (+66% YoY), Python +850k (+48%), JavaScript +427k (+~25%). GitHub attributes the shift partly to typed languages making agent-assisted coding more reliable. Python remains dominant in AI/data science. (secondary summaries of primary; numbers consistent across InfoWorld/VS Magazine)
- **Stack Overflow Developer Survey 2025** (https://survey.stackoverflow.co/2025/technology ; ~49k respondents, 177 countries): JavaScript ~66% usage; Python ~58% (+7 pts YoY, the largest jump); TypeScript ~44%; **PostgreSQL most used database among professional developers (55.6%)**, and most admired and most desired database (third year running since 2023); **Rust most admired language (72%)** for the ninth-ish consecutive year, followed by Gleam, Elixir, Zig. (secondary — figures from summaries; verify exact numbers on the survey page before quoting)
- **JetBrains State of Developer Ecosystem 2025** (https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/ ; 24,534 respondents, 194 countries, Apr–Jun 2025): TypeScript is the biggest grower; Rust, Go, Kotlin growing steadily; "Language Promise Index" top three: **TypeScript, Rust, Go**; JavaScript, PHP, SQL at a "maturity plateau"; languages developers most want to adopt: Go (11%), Rust (10%), Python (7%), Kotlin (6%), TypeScript (6%). (secondary)
- Caution for skills: popularity ≠ fitness; use these numbers only to support "ecosystem/hiring" criteria and to argue against niche picks for teams without the skills.

### 3.4 Typed languages and AI-assisted coding

- Mündler et al., "Type-Constrained Code Generation with Language Models" (PLDI 2025, https://arxiv.org/abs/2504.09246 ; https://dl.acm.org/doi/10.1145/3729274): in their evaluation, **on average 94% of compilation errors in LLM-generated code were type-check failures**, only ~6% syntactic; constraining generation with the type system reduced compile errors substantially. (secondary summary; figure cited by GitHub's blog)
- GitHub blog, "Why AI is pushing developers toward typed languages" (https://github.blog/ai-and-ml/llms/why-ai-is-pushing-developers-toward-typed-languages/): types act as a shared contract/safety net between developers and AI tools. (secondary)
- Gao, Bird, Barr, "To Type or Not to Type" (ICSE 2017): static type systems (TypeScript/Flow) would have detected ~15% of public bugs in sampled JS projects. (memory — verify; Node BP 1.6 cites "~20%" from the same paper, https://earlbarr.com/publications/typestudy.pdf). Node BP's balancing advice: use TS "sparingly, mostly with simple types, and utilize advanced features only when a real need arises" — types catch a meaningful minority of bugs; tests catch the rest. (primary)
- Implication for agents: **prefer statically typed (or strictly gradually typed) mainstream languages; turn on strict modes; make the typechecker part of the agent's inner loop** (run `tsc --noEmit`, `mypy`/`pyright`, `go vet`, `cargo check` after each edit). Popular languages also have more training data (inference — not a sourced measurement).

---

## 4. (B) Language & framework profiles and default picks (2026)

Heuristics below are synthesized; framework facts are from primary docs where noted, otherwise general knowledge (treat as "(memory — verify)" for version-specific details).

### 4.1 Default pick by product type (decision table)

| Product | Default (boring) pick | Good alternatives | Pick alternative when |
|---|---|---|---|
| Content/marketing site, docs, blog | Astro (static/islands) or the CMS the team knows | Next.js static export, Hugo | Heavy interactivity → Next.js/SvelteKit |
| Full-stack web app/SaaS, TS team | Next.js (App Router) + TypeScript + Postgres (Drizzle/Prisma) — T3-style | React Router v7 (framework mode, ex-Remix), SvelteKit, Nuxt | Team prefers Vue/Svelte; want less framework magic |
| Full-stack web app, Ruby/PHP/Python team, CRUD-heavy | Rails / Laravel / Django (server-rendered + Hotwire/Livewire/HTMX) | — | Rich client-side interactivity dominates |
| JSON/HTTP API service, TS team | Fastify, Hono (esp. edge/serverless), or NestJS for large OOP teams | Express (legacy) | Node BP: Nest for OOP/Java-experienced teams and big monoliths; Fastify for reasonably sized components (primary) |
| API service, Python team | FastAPI (async, typed, Pydantic) or Django + DRF/Django Ninja (batteries, admin) | Litestar | Need admin/ORM/auth out of box → Django |
| High-concurrency network service, infra tooling, CLIs | Go | Rust, Java 21+ virtual threads, Kotlin | Go: simple deploy (static binary), fast compile, easy hiring for infra |
| Latency/memory-critical, systems, WASM, embedded | Rust | C++, Zig (niche) | Only with Rust skills or a hard perf/safety requirement |
| Enterprise backend, large teams, long-lived | Java/Kotlin + Spring Boot, or C# + ASP.NET Core | Quarkus/Micronaut | Existing JVM/.NET org skills; compliance ecosystems |
| Realtime, massive concurrency, soft-realtime chat/presence | Elixir + Phoenix (LiveView) | Go | Team has/will learn BEAM; Elixir admired 66% on SO 2025 (secondary) |
| iOS/Android native | Swift + SwiftUI; Kotlin + Jetpack Compose | — | See repo's `mobile-architecture` skill |
| Cross-platform mobile | React Native (Expo) for TS/web teams; Flutter for Dart/pixel-perfect custom UI | Kotlin Multiplatform (shared logic, native UI) | thoughtbot default: React Native for cross-platform app-store apps (primary) |
| Data/ML pipelines, AI services | Python (uv, Pydantic, FastAPI for serving) | TS for AI app layer (Vercel AI SDK etc.) | Python dominates AI/data per Octoverse 2025 (secondary) |
| Internal tools / admin | Framework admin (Django admin, Rails, Laravel Filament) or a low-code tool | Retool-like SaaS | Buy when not core |

### 4.2 Language profiles (one-liners for skills)

- **TypeScript**: default for web front-end and a strong default for full-stack web/API when one language across client and server reduces context switching; largest package ecosystem; #1 on GitHub (Octoverse 2025). Watch-outs: npm supply-chain risk (see repo's security notes), runtime ≠ types (validate at edges with zod/valibot), strict mode mandatory.
- **Python**: default for data/ML/AI and scripting; Django/FastAPI for web. Use `uv` for env+lock, Ruff for lint+format (FastAPI BP: Ruff "replaces black, autoflake, isort"), mypy/pyright for types, Pydantic v2 for validation (Pydantic → Adopt in Radar Vol. 33). Watch-outs: CPU-bound concurrency (GIL; free-threaded builds are experimental/opt-in — memory — verify status), packaging history.
- **Go**: small static binaries, fast builds, simple concurrency, stable compat promise (Go 1 compatibility); great for network services, CLIs, infra. Keep layouts simple (§11.6).
- **Rust**: most admired; choose for performance/safety-critical components, WASM, CLIs; higher learning curve and slower iteration for CRUD. Spend an innovation token unless the team knows it.
- **Java/Kotlin (JVM)**: enterprise default; Spring Boot ecosystem; Kotlin for Android and increasingly server; Spring Modulith for modular monoliths (primary docs).
- **C#/.NET**: enterprise/game (Unity)/Windows; ASP.NET Core fast and cross-platform; modular monolith examples common in .NET community (mehdihadeli list).
- **Swift**: Apple platforms; server-side Swift is niche.
- **Elixir**: BEAM concurrency/fault tolerance, Phoenix LiveView; small hiring pool.
- **Ruby**: Rails still the fastest path to a CRUD SaaS for Ruby teams; Rails 8 (2024) made SQLite production-viable by default with Solid Queue/Cache/Cable (secondary, §5.2).
- **PHP**: Laravel is highly productive; boring in McKinley's sense.

### 4.3 "Same language front and back?"

Pros: shared types/validation schemas end-to-end (tRPC/zod — T3 "Typesafety isn't optional", primary), one toolchain, easier staffing and code movement, fewer context switches for agents. Cons: forces JS runtime on server work that might fit Go/Python better; couples deploy cycles if in one app; server-side JS ecosystem churn. Rule: **share contracts, not necessarily runtimes** — if back end is not TS, generate TS clients from OpenAPI/GraphQL/protobuf so type safety crosses the boundary.

### 4.4 Rendering/UI default (pointer)

thoughtbot: "Use server-rendered HTML when possible… Avoid building single-page applications for the web." (primary). Detailed rendering choices live in the repo's `frontend-architecture` skill; don't duplicate.

---

## 5. (B) Database choice

### 5.1 Default: PostgreSQL

- Evidence of default status: SO 2025 — most used (55.6% professional), most admired, most desired DB (secondary). thoughtbot: "Use Postgres to store most data." (primary). T3: "SQL is great!" (primary). McKinley lists Postgres as canonical boring tech (secondary).
- "Just use Postgres" essays: Ethan McCue (2024, https://mccue.dev/pages/8-16-24-just-use-postgres); Tiger Data "It's 2026, Just Use Postgres" (https://www.tigerdata.com/blog/its-2026-just-use-postgres). Argument (memory — verify details): Postgres covers relational data plus JSONB documents, full-text search, queues (`SELECT … FOR UPDATE SKIP LOCKED`), pub/sub (`LISTEN/NOTIFY`), vectors (pgvector), geospatial (PostGIS), time-series extensions — defer adding Redis/Kafka/Elasticsearch/Mongo until a measured need. (links primary via mehdihadeli list; content partly memory)
- Useful operational references: "Postgres: Don't Do This" wiki (https://wiki.postgresql.org/wiki/Don't_Do_This); FastAPI BP DB naming conventions: `lower_case_snake`, singular table names, module-prefixed tables (`payment_account`), `_at` for datetimes, `_date` for dates, explicit index/constraint naming convention; migrations static, reversible, descriptively named `YYYY-MM-DD_slug`. (primary)

### 5.2 SQLite in production

- Rails 8 (2024) made SQLite production-viable by default, with **Solid Queue** (DB-backed jobs; replaces Redis+Sidekiq), **Solid Cache**, **Solid Cable**; Solid Queue uses `FOR UPDATE SKIP LOCKED` on MySQL/Postgres; SQLite lacks it, so suited to lower job volumes. (secondary: https://github.com/rails/solid_queue ; AppSignal; Saeloun)
- **Litestream** (primary: benbjohnson/litestream README): "a standalone disaster recovery tool for SQLite. It runs as a background process and safely replicates changes incrementally to another file or S3", via the SQLite API only.
- Counterpoint: André Arko, "Rails on SQLite: exciting new ways to cause outages" (2025, https://andre.arko.net/2025/09/11/rails-on-sqlite-exciting-new-ways-to-cause-outages/) — operational pitfalls (single-writer, deploys with volumes, multiple processes/containers). (title/secondary; details memory — verify)
- SQLite's own guidance "Appropriate Uses For SQLite" (https://www.sqlite.org/whentouse.html): fine for most low-to-medium traffic websites; client/server DB preferred when many hosts need to write over a network, very high write concurrency, or very large datasets. (memory — verify wording)

Choose SQLite when: single server/VM with a persistent volume, modest write concurrency, want zero-ops; embedded/desktop/mobile/local-first; per-tenant DBs. Avoid when: horizontal scaling of app servers against one DB, serverless without a SQLite-over-network service, heavy concurrent writes.

### 5.3 When NoSQL / specialized stores

| Store | Choose when (concrete trigger) | Default instead |
|---|---|---|
| Redis/Valkey | Measured need for sub-ms cache, rate limiting, ephemeral locks, large pub/sub fan-out | Postgres + in-process cache first; Rails 8 Solid Cache shows DB-backed cache is viable |
| DynamoDB / Cassandra / ScyllaDB | Known, stable access patterns at very high scale, single-digit-ms at any scale, serverless-native ops; willing to model per access pattern (single-table design) | Postgres (flexible queries while product is evolving) |
| MongoDB/document DB | Truly schemaless, document-shaped aggregates with little cross-document querying, team expertise | Postgres JSONB |
| Elasticsearch/OpenSearch/Meilisearch/Typesense | Relevance-tuned search, facets, typo tolerance beyond Postgres FTS | Postgres FTS / trigram |
| ClickHouse / columnar | Analytics over billions of events; ClickHouse → Adopt in Radar Vol. 33 (secondary) | Postgres + rollups for small analytics |
| Kafka / Redpanda | Durable high-throughput event streams, replay, many consumers | Postgres outbox + job queue; SQS/Pub/Sub |
| Vector DB | Vector count/latency beyond pgvector comfort | pgvector |

Agent rule: a second datastore requires an ADR naming the query/throughput that Postgres (or the existing DB) can't meet. (McKinley "write down exactly what makes it prohibitively expensive" — primary via notes)

---

## 6. (B) Buy vs build (auth, payments, email, etc.)

- "Build vs. Buy" (entropicthoughts, https://entropicthoughts.com/build-vs-buy): buy as much as possible because an organisation has limited capacity for expertise; don't become experts in things that aren't a competitive advantage. (primary via charlax)
- "Platform Engineering: Build vs Buy" (https://kanenarraway.com/posts/platform-engineering-build-vs-buy/): skepticism toward "we can build it cheaper" — maintenance cost is badly forecast. (primary via charlax)
- Billing: "The 14 pains of building your own billing system" (https://arnon.dk/the-14-pains-of-billing/); "The 4 biggest problems with homemade billing systems" (Lago). (primary via charlax)
- DDD generic subdomains (auth, payments, email) → buy/use SaaS/libs (E-architecture §3.6).
- T3: NextAuth.js chosen to "bring in the complexity of security without the hassle of having to build it yourself" (primary). The repo also cloned better-auth and pilcrowonpaper/copenhagen (auth guide) — see those notes for auth specifics.
- thoughtbot production guides cover transactional email, payment processing, error tracking, log collection, performance monitoring, SSL, DNS as bought services (primary: `production/*.md`).

| Capability | Default: buy/adopt | Build only if |
|---|---|---|
| Authentication (passwords, OAuth, passkeys, MFA, sessions) | Framework auth (Django/Rails/Laravel/ASP.NET Identity/Spring Security), OSS library (Better Auth, Auth.js), or IdP SaaS | Auth is the product; strict data-residency with no suitable vendor |
| Authorization | Library (policy objects, CASL, Oso/OpenFGA/Cedar for complex ReBAC) | Simple role checks → a few functions |
| Payments/billing/tax | Stripe/Paddle/Lemon Squeezy/Adyen; merchant-of-record for global tax | Never build card handling (PCI) |
| Transactional email | Postmark/SES/Resend/SendGrid | — |
| Error tracking, APM, logs | Sentry, OpenTelemetry → vendor or Grafana stack | — |
| Feature flags | OpenFeature + vendor/OSS (Unleash, Flagsmith) | ≤5 static flags → env/config |
| Search | Postgres FTS → Meilisearch/Typesense/Algolia | — |
| File storage | S3-compatible object storage + CDN | — |
| Background jobs | Framework queue (Solid Queue, Celery/RQ/Dramatiq, BullMQ, River for Go/Postgres) | — |

(vendor names are examples, not endorsements; verify current status/pricing before recommending)

---

## 7. (B) Hosting and deployment target

- thoughtbot hosting rationale (primary): a PaaS acts as "our outsourced operations team", uses conventions for solved problems (web/app servers), offers review apps and pipelines; static assets via CDN; uploads to S3; IaC (Terraform) for AWS/Kubernetes when needed; stronger security/compliance (SOC2, NIST, healthcare, finance) needs more than a common PaaS.
- thoughtbot production checklist (primary): concurrent web server; long-running work in background jobs; **≥2 redundant web and worker processes**; SSL; API on a separate subdomain (`api.example.com`) for future flexibility; config in env; documented deploy script; remote log collection; production-grade DB plan; **DB backups**; performance and uptime monitoring; error tracking. (Their "deploys done manually at a scheduled time" item conflicts with continuous deployment practice — omit in skills.)
- **Heroku status (2026)**: in Feb 2026 Salesforce announced Heroku moving to a **"sustaining engineering" model** — no new features, no new Enterprise contracts for new customers; existing customers continue. (secondary: InfoWorld https://www.infoworld.com/article/4129430/salesforce-may-be-prepping-to-phase-out-heroku.html ; multiple vendor blogs) → Agent rule: don't recommend Heroku for new projects without flagging this.
- Node BP production (primary): delegate TLS/gzip to a reverse proxy/platform (5.3); be stateless (5.12); log to stdout (5.18); zero-downtime atomic deploys (5.16); graceful shutdown on SIGTERM (8.6); pin image tags, small base images, multi-stage builds, non-root user (8.x, 6.13).

Hosting decision table (heuristic; pricing/product facts change — verify before quoting):
| Situation | Default |
|---|---|
| Next.js/SvelteKit/Astro front-end, small team | Framework-native PaaS (e.g., Vercel/Netlify/Cloudflare Pages) with preview deploys |
| Containerized web app + Postgres + worker, small team | Container PaaS (e.g., Render, Railway, Fly.io, Google Cloud Run, AWS App Runner/ECS Fargate) + managed Postgres |
| Single-node app with SQLite | One VM/volume (e.g., Fly.io volume, Hetzner/DigitalOcean VM) + Litestream to object storage; Kamal or Docker Compose deploys |
| Spiky/low traffic, event glue | Serverless functions (Lambda, Cloud Functions, Workers) with pooled/HTTP DB drivers |
| Enterprise, compliance, many services | Major cloud (AWS/GCP/Azure) with IaC (Terraform/OpenTofu, Pulumi, Bicep), managed Kubernetes only with a platform team |

Serverless trade-offs (E-architecture §3.2 covers the style; key reminders): cold starts, execution time limits, DB connection storms (use proxies/HTTP drivers), local-dev parity, per-request cost at steady high load, vendor lock-in via triggers/IAM. Keep business logic framework-agnostic so you can move between function and container hosting (Node BP 1.2 "keep the web layer within its boundaries" — primary).

Lock-in guardrails: standard containers (OCI), standard DB (Postgres wire protocol), S3-compatible storage, OpenTelemetry for telemetry, IaC in repo, secrets in platform store, DNS you control.

---

## 8. (C) Organizing a codebase: principles

### 8.1 Package by feature/domain, not by layer

- Node BP 1.1 (primary): "The root of a system should contain folders or repositories that represent reasonably sized business modules. Each component represents a product domain (i.e., bounded context)… has its own API, logic, and logical database." Otherwise: "module-a controller might call module-b service" — no modularity borders; devs fear breaking things; deploys become slower and riskier. **Bad**: top-level `controllers/ services/ models/`. **Good**: `apps/orders/{api,domain,data-access}`, `apps/users`, `libraries/logger`.
- **Screaming Architecture** (Robert C. Martin, 2011, https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html): "When you look at the top level directory structure… do they scream: Health Care System, or Accounting System…? Or do they scream: Rails, or Spring/Hibernate, or ASP?" (primary quote via Node BP)
- Philipp Hauer, "Package by Feature" (2020, https://phauer.com/2020/package-by-feature/): package-by-layer forces jumping across packages to understand one feature; package-by-feature gives discoverability, self-contained packages, simpler code, testability, and enables package-private encapsulation. (secondary)
- Simon Brown, "package by component" (Clean Architecture "The Missing Chapter"; https://simonbrown.je/modular-monolith/): "package by layer is a bad approach", but pure package-by-feature is not his answer either — group a component's business logic + persistence behind one public interface, with the web layer separate; use the compiler (access modifiers) to enforce it. (secondary)
- FastAPI BP (primary): organizing "by file type (e.g., crud, routers, models) … works well for microservices or smaller projects. However, this approach didn't scale well for our monolith with many domains and modules." Structure inspired by Netflix Dispatch: one package per domain.
- **Vertical slice** (Jimmy Bogard) — covered in E-architecture §3.2.
- **Co-location** (Kent C. Dodds, "Colocation", https://kentcdodds.com/blog/colocation): "Place code as close to where it's relevant as possible"; things that change together should be located together (tests, styles, stories next to components). (memory — verify wording). Next.js docs: files can be "safely colocated inside route segments in the `app` directory without accidentally being routable"; the "simplest takeaway is to choose a strategy that works for you and your team and be consistent". (primary: vercel/next.js docs `02-project-structure.mdx`)

Agent rules:
- New code goes into the feature/domain folder it belongs to; create a new feature folder rather than adding to a technical-layer folder.
- Keep tests next to code (`x.test.ts` beside `x.ts`) or in a mirrored `tests/<module>/` tree (Python/Django convention: "match the structure of our modules with the structure of their respective tests" — Django Styleguide, primary). Pick one; be consistent.
- Within a feature, sub-folders by technical role are fine (`components/ api/ hooks/`) — bulletproof-react: "You don't need all of these folders for every feature." (primary)

### 8.2 Layers inside a module (keep it thin)

- Node BP 1.2 (primary): 3 tiers per component — **entry-points** (api controllers, message-queue consumers, jobs — adapt payload, validate, call domain, return), **domain** (flows, services, DTOs, logic; protocol-agnostic plain objects), **data-access** (DB calls, repository pattern). "Why not MVC or clean architecture? The 3-tier pattern strikes a great balance… Clean architecture… price tag is unproportionally higher." Anti-pattern: passing `req`/`res` into domain functions.
- Django Styleguide (primary): business logic lives in **services** (writes; function `<entity>_<action>`, keyword-only args, type-annotated) and **selectors** (reads); **not** in views/APIs, serializers/forms, model `save`, custom managers, or signals ("signals… will lead you to a very bad place very quickly" when used for domain structure). Core vs interface: "The way your app should behave… should not be related to the way you interface with it".
- FastAPI BP (primary): per-domain `router.py, schemas.py, models.py, service.py, dependencies.py, config.py, constants.py, exceptions.py, utils.py`; cross-domain imports use explicit module names: `from src.auth import constants as auth_constants`.

### 8.3 The `utils/`, `common/`, `shared/` problem

- Node BP 1.3 (primary): put genuinely reusable, generic modules in `libraries/<name>/` each as a package with its own `package.json` and explicit `exports` — "Clients of a module might import and get coupled to internal functionality" otherwise.
- bulletproof-react (primary): shared `components/ hooks/ lib/ types/ utils/` exist, but **unidirectional flow shared → features → app**; features must not import each other; enforced by ESLint `import/no-restricted-paths`.
- E-architecture §3.8: avoid `packages/common` junk drawers; don't create a package until ≥2 consumers.
- Go convention: package names describe what they provide; avoid `util`, `common`, `misc` ("Package names" Go blog, https://go.dev/blog/package-names — memory — verify exact phrasing; linked from golang-standards README).
- thoughtbot naming: avoid type words in names; name classes after domain concepts rather than patterns. (primary)

Agent rules: (1) No new top-level `utils`/`helpers`/`common` file for domain logic; name the concept (`money.ts`, `slugify.ts`, `date-range.ts`). (2) A helper used by one feature lives in that feature. (3) Promote to shared only at the second real consumer (rule of three is fine too). (4) Shared code must not import feature code.

### 8.4 Naming and size heuristics

- Folder/file naming: pick one case convention and enforce it (bulletproof-react: kebab-case files and folders via `eslint-plugin-check-file`, primary). Ecosystem norms: TS/JS kebab-case files (React components sometimes PascalCase — be consistent); Python `snake_case` modules; Go short lowercase single-word packages; Java/Kotlin lowercase reversed-domain packages, PascalCase classes; Rust `snake_case` modules.
- Django naming for services: `<entity>_<action>` for greppability (primary).
- Size heuristics (not hard rules; used as review triggers): file > ~300–500 lines or function > ~40–60 lines or > 3–4 nesting levels → consider splitting (common lint defaults: ESLint `max-lines` default 300 — memory — verify; `max-lines-per-function` default 50 — memory — verify). Folder with > ~15–20 files at one level → consider sub-grouping by feature. Treat these as smells, not limits (Ousterhout's "deep modules" in E-architecture §1.9 argues against over-splitting).

---

## 9. (C) Module boundaries and enforcement

### 9.1 Public API per module

- Every module/feature/package exposes a deliberate public surface; everything else is private.
  - TS monorepo packages: `package.json` `exports` map (Turborepo: use `exports` for explicit entrypoints; "Avoid accessing files across package boundaries… If you ever find yourself writing `../` to get from one package to another" rethink; internal packages namespaced `@repo/*` or `@acme/*`; no root `tsconfig.json`, packages extend a shared config package; no nested packages `apps/a/b`). (primary: vercel/turborepo docs `structuring-a-repository.mdx`)
  - Go: `internal/` directories are **compiler-enforced** private ("other packages can't import it unless they share a common ancestor"). (primary: golang-standards README + go.dev layout doc)
  - Java: package-private visibility; Spring Modulith treats each direct sub-package of the main application package as an application module; types in the module's base package are its API, sub-packages (e.g., `order.internal`) are internal; `ApplicationModules.of(Application.class).verify()` fails on violations and cycles; named interfaces and nested modules (1.3+) supported. (primary: spring-modulith `fundamentals.adoc`)
  - Kotlin: `internal` visibility per Gradle module.
  - Rust: `pub(crate)`, crate boundaries in a Cargo workspace.
  - Python: convention `_private` modules + import-linter contracts.
  - Ruby: Packwerk packages with `package.yml` (§9.4).
  - .NET: separate projects + `internal` + `InternalsVisibleTo` for tests.

### 9.2 Enforcement tools (fitness functions in CI)

| Ecosystem | Tool | What it enforces | Source |
|---|---|---|---|
| JS/TS | dependency-cruiser | Custom rules over the import graph (forbidden paths, no cycles, no orphans, no dev-deps in prod code); graphs | primary: sverweij/dependency-cruiser README (`npx dependency-cruiser --init`) |
| JS/TS | eslint-plugin-boundaries | Classify files into architectural "elements" and define allowed element→element dependencies; real-time editor feedback; works with monorepos | primary: javierbrea/eslint-plugin-boundaries README |
| JS/TS | `import/no-restricted-paths` (eslint-plugin-import) | Zone rules: no cross-feature imports; shared ↛ features ↛ app | primary: bulletproof-react |
| JS/TS monorepo | Nx `@nx/enforce-module-boundaries` | Tag-based `depConstraints` (e.g., `type:feature` may depend on `type:ui`, `scope:shared`) | memory — verify (Nx docs) |
| FSD | Steiger | FSD layer/slice rules | E-architecture §3.7 |
| Python | import-linter | "Impose constraints on the imports between your Python modules" — contract types include layers, forbidden, independence; also a browser UI for exploring architecture | primary: README (contract types from memory — verify) |
| Go | compiler (`internal/`), `go vet`, depguard (golangci-lint) | Private packages; banned imports | primary (internal); depguard memory — verify |
| JVM | ArchUnit; Spring Modulith; Konsist (Kotlin) | Package/layer rules as unit tests; module verification | primary: ArchUnit README, Spring Modulith docs |
| Ruby | Packwerk | Package dependency violations (privacy checks were removed later — see §9.4) | primary README + secondary retrospective |
| .NET | NetArchTest / ArchUnitNET | Layer rules as tests | memory — verify |

Agent rules: add a boundary check to CI as soon as there are ≥3 features/modules; start with "no cycles" and "no cross-feature internal imports"; allow violations only via an explicit, commented allowlist/baseline that shrinks over time.

### 9.3 Barrel files (index re-exports)

- **Vite performance guide** (primary: vitejs/vite `docs/guide/performance.md`): "Avoid Barrel Files" — importing one API through a barrel forces fetching/transforming every file in it (and running side effects), slowing page loads in dev; import individual modules directly (issue #8237).
- **bulletproof-react** (primary): "In the past, it was recommended to use barrel files to export all the files from a feature. However, it can cause issues for Vite to do tree shaking and can lead to performance issues. Therefore, it is recommended to import the files directly."
- **Turborepo** (primary): use `exports` subpaths (`@repo/math/add`) to avoid barrel files, which are "difficult for compilers and bundlers to handle"; links Vercel's "How we optimized package imports in Next.js" (Next.js `optimizePackageImports`).
- **Atlassian** (secondary: https://www.atlassian.com/blog/atlassian-engineering/faster-builds-when-removing-barrel-files): removing barrel files from the Jira front-end (thousands of packages, 90k+ files) gave **~75% faster builds**, faster TS highlighting (>30%), unit tests and CI.
- Tension: FSD and modular-monolith practice want a single public API per slice (`index.ts`). Resolution for skills: **a small, explicit public-API file per module is fine if it re-exports a handful of named symbols (no `export *`) and the module is not a hot path in the bundle**; for large shared libraries prefer `exports` subpaths; never create nested barrels-of-barrels; never barrel in `shared/ui` with hundreds of components.

### 9.4 Lessons from Shopify (Packwerk) and modular monoliths

- Shopify's Packwerk (primary README): Ruby gem "to enforce boundaries and modularize Rails applications": combine files into packages, define package-level constant visibility, help existing codebases become more modular "without obstructing development". Quote: "I know who you are and because of that I know what you do. This knowledge is a dependency that raises the cost of change." (Sandi Metz)
- "A Packwerk Retrospective" (Shopify, https://shopify.engineering/a-packwerk-retrospective ; originally Rails at Scale blog): privacy checks (public constants in `app/public`) broke Rails conventions and caused confusion (a folder denoting privacy rather than architecture; duplicated controller/job directories); (memory — verify) privacy checks were extracted from core Packwerk, and the authors concluded that static boundary checks alone don't make code modular — dependency violations piled up as "todo" files and the real work is designing better boundaries and load order. (secondary + memory)
- Kamil Grzybek, modular-monolith-with-ddd (primary README): each module has its own interface used by the API; **each module has its own data in a separate schema — shared data not allowed**; own composition root; modules integrate asynchronously via events; architecture unit tests enforce rules; decision log kept.
- Lesson for skills: **tools catch regressions, design creates boundaries.** Start with a modular folder structure and one or two rules; don't bulk-import thousands of violations into a baseline and call it modular.

---

## 10. (C) Growing the codebase with the team

### 10.1 Conway's law, team topologies, cognitive load

- Conway's law: system boundaries mirror the organization's communication structure (primary: hacker-laws).
- **Team Topologies** (Skelton & Pais, 2019): team cognitive load is the primary constraint; teams ~5–9 people (Dunbar-inspired limits of ~5/15 trust relationships); four team types — stream-aligned, platform, enabling, complicated-subsystem; three interaction modes (collaboration, X-as-a-service, facilitating); **Inverse Conway Maneuver** — shape teams to get the architecture you want. (secondary: https://teamtopologies.com ; book notes https://danlebrero.com/2021/01/20/team-topologies-summary/)
- Brooks' law: adding people to a late project makes it later (primary: hacker-laws).

### 10.2 Growth stages (heuristic playbook)

| Stage | People | Structure | Practices to add |
|---|---|---|---|
| 0 Solo/prototype | 1–2 | Framework default layout; single app; single DB | Skeleton, CI, formatter/linter/types, AGENTS.md |
| 1 Small team | 3–8 (one team) | Feature folders inside one app; `shared/` with import rules; tests co-located | PR reviews, trunk-based, DoD, ADRs, boundary lint (no cross-feature imports) |
| 2 Several teams | 2–5 teams | **Modular monolith**: modules = bounded contexts with public API + own tables/schema; monorepo `apps/` + `packages/` if multiple deployables (web, api, worker, mobile) | CODEOWNERS per module, module-level test suites, affected-only CI with caching (Turborepo/Nx/Bazel/Gradle), dependency rules as fitness functions |
| 3 Many teams | 5+ teams, independent cadences | Extract services only where a module needs independent scaling/deploy/ownership/runtime (E-architecture §3.3); platform team; paved-road templates | Contract tests, service templates, internal developer portal |

Signals to split a **folder → module**: a feature > ~15–20 files, or two sub-areas with separate vocabularies. **Module → package**: second consumer (another app) or need for independent build/test caching. **Package → service**: different scaling profile, deploy cadence owned by another team, fault isolation or compliance boundary, different runtime — never "because it's big". (synthesis of E-architecture §3.3 and sources there)

### 10.3 Monorepo vs polyrepo

- Google (Potvin & Levenberg, "Why Google Stores Billions of Lines of Code in a Single Repository", CACM 59(7), 2016, https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/): benefits — unified versioning (one source of truth), extensive code sharing and reuse, simplified dependency management, **atomic changes** and large-scale refactoring, cross-team collaboration, flexible ownership, code visibility. Scale (Jan 2015): ~1 billion files, ~35 million commits, tens of thousands of developers — required custom tooling (Piper, CitC) and trunk-based development. Costs named in the paper (memory — verify): tooling investment, codebase complexity and unnecessary dependencies, effort in code health.
- monorepo.tools (Nx team, https://monorepo.tools): monorepo ≠ monolith; needs tooling for affected builds, caching, ownership, boundaries. (link primary via charlax/mehdihadeli)
- Node BP 1.1: component isolation "does not necessarily demand physical separation and can be achieved using a Monorepo or with a multi-repo". (primary)

| Choose monorepo when | Choose polyrepo when |
|---|---|
| Multiple deployables share code/types (web + API + mobile + worker) | Truly independent products/teams with no shared code |
| You want atomic cross-cutting changes and one CI | Different access-control needs (open-source part vs private) |
| One org owns all parts; tooling (pnpm/uv/Gradle workspaces + Turborepo/Nx/Bazel) acceptable | Very different toolchains and release processes that don't benefit from shared tooling |

Monorepo rules (add to E-architecture §3.8): `apps/*` for deployables, `packages/*` for libraries and tooling (Turborepo recommendation, primary); every package has its own manifest and explicit `exports`; no nested packages; shared configs as packages (`@repo/tsconfig`, `@repo/eslint-config`); dependency direction apps → packages only; per-package README and CODEOWNERS; root `package.json` only orchestrates (`turbo run build/dev/lint`).

### 10.4 Code ownership

- GitHub `CODEOWNERS` auto-requests reviewers per path; combine with branch protection "require review from code owners" (GitHub docs — memory — verify setting name).
- Google monorepo: "flexible code ownership" via OWNERS files per directory (CACM paper — secondary).
- Rule: ownership by team, not individual; every top-level module has exactly one owning team; shared packages owned by a platform/enabling team.

---

## 11. (C) Concrete folder templates per stack

All templates are **starting points**; the framework's official conventions win where they conflict. Grow into them — don't scaffold empty folders.

### 11.1 Next.js (App Router) product app

Next.js is "unopinionated about how you organize and colocate your project files"; three documented strategies: (1) project files outside `app/` (app = routing only), (2) top-level folders inside `app/`, (3) split by feature or route. Private folders `_folder` opt out of routing; route groups `(group)` organize without affecting URLs and enable multiple root layouts. (primary: Next.js docs)

Recommended (strategy 1 + features), aligned with T3 (`src/env`, `src/server` for server-only code — primary) and bulletproof-react features:
```
.
├── src/
│   ├── app/                      # routing only: layout.tsx, page.tsx, loading/error.tsx, route.ts
│   │   ├── (marketing)/          # route group: public pages, own layout
│   │   ├── (app)/                # route group: authenticated app
│   │   │   └── projects/[id]/page.tsx   # thin: parse params → call feature → render feature components
│   │   └── api/                  # route handlers (webhooks, public API) — thin
│   ├── features/
│   │   └── projects/
│   │       ├── components/       # feature UI (server + client components)
│   │       ├── server/           # queries, mutations, Server Actions ("use server"), authz checks — import "server-only"
│   │       ├── schemas.ts        # zod schemas shared by form + action
│   │       └── projects.test.ts
│   ├── components/ui/            # design-system primitives (no feature imports)
│   ├── server/                   # cross-feature server infra: db client, auth, email, jobs
│   │   ├── db/{index.ts,schema.ts}
│   │   └── auth.ts
│   ├── lib/                      # framework-agnostic helpers with real names (money.ts, dates.ts)
│   └── env.ts                    # validated env (t3-env/zod)
├── drizzle/ or prisma/           # migrations
├── public/
├── e2e/                          # Playwright
└── .env.example, next.config.ts, tsconfig.json (strict, "@/*"), eslint config, AGENTS.md
```
Import rules: `app → features → (components/ui, server, lib)`; features don't import each other's internals (compose in `app/`); `server/` and `features/*/server` never imported by client components (use `server-only`).

### 11.2 React SPA (Vite) — bulletproof-react (primary)

```
src/
├── app/              # routes/, app.tsx, provider.tsx, router.tsx
├── assets/
├── components/       # shared components
├── config/           # global config, exported env
├── features/<name>/  # api/ assets/ components/ hooks/ stores/ types/ utils/ — only what's needed
├── hooks/            # shared hooks
├── lib/              # preconfigured libraries (api client, query client)
├── stores/           # global state
├── testing/          # test utils, mocks (MSW)
├── types/
└── utils/
```
Rules (primary): no cross-feature imports (compose at app level); unidirectional shared → features → app; import files directly (no barrels); absolute imports `@/*`; kebab-case files/folders enforced; ESLint + Prettier + TypeScript + Husky. For larger apps with many teams, consider FSD (E-architecture §3.7).

### 11.3 Node/TypeScript API (Fastify/Hono/Express) — Node BP components + layers (primary)

Single service:
```
src/
├── modules/                       # business components (bounded contexts)
│   └── orders/
│       ├── entry-points/
│       │   ├── http/orders.routes.ts      # validate (zod/TypeBox) → call domain → map response
│       │   └── queue/order-events.consumer.ts
│       ├── domain/                        # services/use cases, entities, errors — no HTTP/DB imports
│       ├── data-access/                   # repositories/queries (Drizzle/Kysely/Prisma)
│       ├── orders.public.ts               # the module's public API for other modules (small, explicit)
│       └── orders.test.ts                 # component tests through the API (Node BP 4.1)
├── libraries/                     # generic: logger, config, http-client, errors
├── config.ts                      # validated env
├── app.ts                         # build the app (no listen) — testable (Node BP "separate Express app and server")
└── server.ts                      # listen, graceful shutdown on SIGTERM
migrations/  test/  Dockerfile  .env.example
```
(Node BP "separate Express 'app' and 'server'": the English README item was removed/merged in the current version; only translated files `separateexpress.<lang>.md` remain in the repo — treat as older guidance, still widely used for testability.) NestJS: use Nest modules per bounded context with the same inward dependency rule.

### 11.4 Python FastAPI — Netflix Dispatch-inspired (primary: zhanymkanov)

```
fastapi-project/
├── alembic/                       # migrations: YYYY-MM-DD_slug.py, static & reversible
├── src/
│   ├── auth/ {router,schemas,models,dependencies,config,constants,exceptions,service,utils}.py
│   ├── posts/ …same shape…
│   ├── aws/ {client,schemas,config,constants,exceptions,utils}.py   # external integration as its own package
│   ├── config.py  models.py  exceptions.py  pagination.py  database.py
│   └── main.py                    # create FastAPI app, include routers
├── tests/{auth,posts,aws}/        # async client (httpx ASGITransport) from day 0; dependency_overrides for fakes
├── pyproject.toml + uv.lock       # (repo shows requirements/{base,dev,prod}.txt; uv/pyproject is the 2026 equivalent — inference)
└── .env (ignored), .env.example, logging.ini, alembic.ini
```
Rules (primary): domain packages, not file-type folders; cross-package imports with explicit module names; DB naming conventions + explicit constraint naming; SQL-first (let the DB do joins/aggregation), Pydantic second; Ruff for lint+format; AGENTS.md compat matrix: Python ≥3.11, FastAPI ≥0.115 (`Annotated[..., Depends()]`), Pydantic ≥2.7, SQLAlchemy 2.0 async, PyJWT not python-jose.

### 11.5 Django — HackSoft Styleguide (primary)

```
project/
├── config/
│   ├── django/{base,local,production,test}.py   # nothing production-only that isn't env-driven
│   ├── settings/{celery,cors,sentry,sessions}.py
│   ├── env.py                                    # env = environ.Env()
│   ├── urls.py  wsgi.py  asgi.py
├── <project_name>/
│   ├── users/
│   │   ├── models.py  apis.py  urls.py
│   │   ├── services.py   # writes: user_create(*, email: str, ...) -> User
│   │   ├── selectors.py  # reads: user_list(*, fetched_by: User)
│   │   └── tests/{services/test_user_create.py, selectors/...}
│   ├── common/          # BaseModel etc.
│   └── core/ or integrations/
├── manage.py  pyproject.toml
```
Start from a cookiecutter (HackSoft Styleguide-Example or cookiecutter-django) — "Having the proper structure from the start pays off." (primary)

### 11.6 Go service — official go.dev layout (primary) vs golang-standards

Official "Organizing a Go module" (https://go.dev/doc/modules/layout): basic package = code in root; basic command = `main.go` in root; supporting packages go in `internal/` ("since other projects cannot import code from our internal directory, we're free to refactor its API"); **server project**:
```
project-root/
├── go.mod
├── cmd/
│   ├── api-server/main.go         # small main: wire config, deps, start
│   └── worker/main.go
├── internal/
│   ├── orders/                    # domain packages named for what they provide
│   ├── users/
│   ├── platform/{postgres,httpserver,config}   # adapters/infra (naming is a choice, not official)
└── … non-Go dirs: migrations/, deploy/, web/, docs/
```
"In case the server repository grows packages that become useful for sharing with other projects, it's best to split these off to separate modules."

Controversy: `golang-standards/project-layout` says itself it is "NOT an official standard defined by the core Go dev team" and is "overkill" for PoCs ("a single main.go file and go.mod is more than enough") (primary). Russ Cox (Go tech lead) opened issue #117 (Apr 2021) "this is not a standard Go project layout": most Go packages don't use `pkg/`; the layout is "very complex"; the minimal standard is "Put a LICENSE file in your root, Put a go.mod file in your root, Put Go code in your repo, in the root or organized into a directory tree as you see fit." (secondary: https://github.com/golang-standards/project-layout/issues/117). Agent rule: **no `pkg/`, no `src/`, no empty scaffolding in Go; use `cmd/` + `internal/` only when needed.** Lint with staticcheck/golangci-lint (golint deprecated — primary).

### 11.7 Kotlin/Java Spring Boot — Spring Modulith style (primary docs)

```
src/main/kotlin/com/acme/shop/
├── ShopApplication.kt             # main package
├── order/                         # application module; top-level public types = module API
│   ├── OrderManagement.kt         # public service/facade
│   ├── OrderPlaced.kt             # public domain event
│   └── internal/                  # internal — other modules must not reference
│       ├── OrderRepository.kt
│       └── OrderEntity.kt
├── inventory/
│   ├── InventoryManagement.kt
│   └── internal/…
└── shared/ (only truly shared kernel types)
src/test/kotlin/…/ModularityTests.kt   # ApplicationModules.of(ShopApplication::class.java).verify()
```
Modules interact via public APIs or application events; verification fails on cycles and internal access. For multi-module Gradle builds (when build times or ownership demand), promote modules to Gradle subprojects with `internal` visibility. ArchUnit for extra layer rules (primary README).

### 11.8 Monorepo (TS-centric, polyglot-ready)

```
.
├── apps/
│   ├── web/            # Next.js
│   ├── api/            # Fastify/Hono or a Python/Go service (own toolchain)
│   ├── worker/
│   └── mobile/         # Expo
├── packages/
│   ├── ui/             # design system (exports subpaths, no barrel-of-everything)
│   ├── db/             # schema + client + migrations (single owner)
│   ├── api-contract/   # OpenAPI/zod/tRPC types shared by web/mobile/api
│   ├── config-typescript/  config-eslint/
│   └── <domain>/       # only when ≥2 apps need the same domain logic
├── tooling/ or scripts/
├── docs/adr/
├── pnpm-workspace.yaml  turbo.json  package.json (private, orchestration only)
├── .github/CODEOWNERS  .github/workflows/
└── AGENTS.md (+ apps/*/AGENTS.md for app-specific commands)
```
(Turborepo conventions primary; nested AGENTS.md per package — agents.md, memory — verify.)

### 11.9 Rails (brief)

Rails conventions (`app/models`, `app/controllers`, …) are layer-first by design; for large apps, group by domain with Packwerk packs (`packs/<domain>/app/...`) or Rails engines; keep conventions over custom structure (Packwerk retrospective lesson). thoughtbot Suspenders as the starting generator. (primary: thoughtbot tech-stack; Packwerk)

---

## 12. Agent checklists (paste-ready)

### 12.1 "New project" checklist
```
[ ] 5-line brief: users, first slice, non-goals, constraints, success metric
[ ] Stack chosen via decision table; ADR only for non-default choices; ≤3 innovation tokens, named
[ ] Official scaffold; README, LICENSE, .gitignore, .editorconfig, toolchain pin, lockfile
[ ] Formatter, linter, strict typecheck, pre-commit hooks, secret scanning
[ ] Validated config module + .env.example; no secrets in git
[ ] Tasks: setup/dev/test/lint/typecheck/build/check; CI runs `check` (<10 min); main protected
[ ] Walking skeleton deployed to a real URL by CI with 1 e2e test and /healthz
[ ] AGENTS.md with commands, structure map, conventions, DoD
[ ] Before users: error tracking, structured logs, uptime, backups, migrations, dependency bot
```

### 12.2 "Choose a stack" checklist
```
[ ] Deployment target(s) identified (web/mobile/server/edge/data)
[ ] Team's strongest language/framework listed; default to it unless a hard requirement rules it out
[ ] Requirements with numbers (latency, throughput, data size, compliance) — or explicitly "none yet"
[ ] 2–3 candidates max; compare on the criteria table; spike if uncertain
[ ] Postgres (or SQLite for single-node) unless a named access pattern demands otherwise
[ ] Auth, payments, email, error tracking, flags: bought/adopted, not built
[ ] Hosting: PaaS/container platform by default; note lock-in exits (OCI, Postgres, S3 API, OTel)
[ ] Check longevity/licensing (foundation vs single vendor, relicensing history, platform status e.g. Heroku 2026)
[ ] Decision recorded (ADR) with rejected options and "revisit when" trigger
```

### 12.3 "Where does this code go?" checklist
```
[ ] Which feature/domain does it serve? → that module's folder
[ ] Is it entry-point (HTTP/queue/cron/UI route), domain logic, or data access? → that sub-layer
[ ] Used by ≥2 features today? If not, keep it local
[ ] If shared: generic (no domain words) → shared/lib; domain-shared → owning module's public API
[ ] Does the import direction respect the rules (app → features → shared; no feature → feature internals; no cycles)?
[ ] Named for what it is (no utils/helpers/common/misc)
[ ] Tests next to it (or mirrored path)
```

### 12.4 Red flags to call out in reviews
- Top-level `controllers/ services/ models/` in a multi-domain app (package-by-layer) — suggest feature modules.
- `utils.ts` > 200 lines or imported by everything.
- Deep relative imports across modules (`../../../other-feature/internal/x`) or `../` across package boundaries (Turborepo).
- `export *` barrels in shared UI or feature roots on hot paths.
- Go `pkg/` + empty `api/ build/ deployments/ …` scaffolding in a small service.
- Business logic in Django views/serializers/signals or in Express route handlers receiving `req`/`res`.
- Env vars read ad hoc across the codebase; missing `.env.example`; `.env` committed.
- Long-lived feature branches (>1–2 days), PRs >1000 lines, CI >10–15 min, red main tolerated.
- New datastore/queue/language without an ADR.

---

## 13. Sources

Primary (read this session; repos cloned under `refs7/` or raw files under `raw/`):
- Microsoft Code-With Engineering Playbook — https://github.com/microsoft/code-with-engineering-playbook (docs: engineering-fundamentals-checklist.md, the-first-week-of-an-ise-project.md, CI-CD/continuous-integration.md, agile-development/branching-and-cicd.md, agile-development/team-agreements/definition-of-done.md, code-reviews/pull-requests.md, developer-experience/README.md, source-control/{README,merge-strategies,component-versioning}.md, CI-CD/dev-sec-ops/secrets-management/README.md, design/design-reviews/{README.md, recipes/templates/feature-story-design-review.md, trade-studies/template.md})
- create-t3-app docs — https://github.com/t3-oss/create-t3-app (www/src/pages/en: introduction.mdx (T3 axioms), why.md, folder-structure-app.mdx, usage/env-variables.mdx, other-recs.md); https://env.t3.gg
- bulletproof-react — https://github.com/alan2207/bulletproof-react (docs/project-structure.md, docs/project-standards.md)
- FastAPI Best Practices — https://github.com/zhanymkanov/fastapi-best-practices (README.md, AGENTS.md)
- HackSoft Django Styleguide — https://github.com/HackSoftware/Django-Styleguide
- Node.js Best Practices — https://github.com/goldbergyoni/nodebestpractices (README §1–8; sections/projectstructre/{breakintcomponents,createlayers,choose-framework,configguide,wraputilities}.md)
- golang-standards/project-layout README — https://github.com/golang-standards/project-layout
- Go "Organizing a Go module" — https://go.dev/doc/modules/layout (golang/website `_content/doc/modules/layout.md`)
- thoughtbot guides — https://github.com/thoughtbot/guides (general, git, tech-stack, production/{production-checklist,hosting}.md, software_processes)
- hacker-laws — https://github.com/dwmkerr/hacker-laws (Gall, Conway, Hyrum, YAGNI, Brooks)
- charlax/professional-programming — https://github.com/charlax/professional-programming (buy vs build, production-oriented development, cognitive load, design-doc notes)
- Sairyss backend-best-practices — https://github.com/Sairyss/backend-best-practices (configuration, seeding, standardization, easy setup)
- mehdihadeli awesome-software-architecture (link index: modular monolith, just use Postgres, SemVer/CalVer, Conventional Commits, Keep a Changelog)
- Google eng-practices "Small CLs" — https://google.github.io/eng-practices/review/developer/small-cls.html
- DORA capabilities — https://dora.dev/capabilities/trunk-based-development/ , /continuous-integration/ , /working-in-small-batches/ (dora-team/dora.dev repo)
- SemVer 2.0.0 — https://semver.org ; Conventional Commits 1.0.0 — https://www.conventionalcommits.org/en/v1.0.0/ ; Keep a Changelog 1.1.0 — https://keepachangelog.com/en/1.1.0/
- Rust RFCs README + template — https://github.com/rust-lang/rfcs ; Kubernetes KEP template — https://github.com/kubernetes/enhancements/tree/master/keps/NNNN-kep-template
- 12-factor Config & Dev/prod parity — https://12factor.net/config
- AGENTS.md — https://agents.md (openai/agents.md README)
- Dev Container spec — https://containers.dev (devcontainers/spec)
- just — https://github.com/casey/just
- Packwerk — https://github.com/Shopify/packwerk ; dependency-cruiser — https://github.com/sverweij/dependency-cruiser ; eslint-plugin-boundaries — https://github.com/javierbrea/eslint-plugin-boundaries ; import-linter — https://github.com/seddonym/import-linter ; ArchUnit — https://github.com/TNG/ArchUnit ; Spring Modulith fundamentals — https://docs.spring.io/spring-modulith/reference/fundamentals.html
- Next.js "Project structure and organization" — https://nextjs.org/docs/app/getting-started/project-structure
- Turborepo "Structuring a repository" — https://turborepo.com/docs/crafting-your-repository/structuring-a-repository
- Vite performance guide "Avoid Barrel Files" — https://vite.dev/guide/performance
- Litestream — https://github.com/benbjohnson/litestream
- Kamil Grzybek modular-monolith-with-ddd — https://github.com/kgrzybek/modular-monolith-with-ddd

Secondary (search summaries / third-party write-ups; verify before quoting numbers):
- GitHub Octoverse 2025 — https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/ ; InfoWorld https://www.infoworld.com/article/4080454/typescript-rises-to-the-top-on-github.html
- Stack Overflow Developer Survey 2025 — https://survey.stackoverflow.co/2025/technology
- JetBrains State of Developer Ecosystem 2025 — https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/
- ThoughtWorks Technology Radar Vol. 33 (Nov 2025) — https://www.thoughtworks.com/content/dam/thoughtworks/documents/radar/2025/11/tr_technology_radar_vol_33_en.pdf
- Mündler et al., Type-Constrained Code Generation (PLDI 2025) — https://arxiv.org/abs/2504.09246 ; GitHub blog — https://github.blog/ai-and-ml/llms/why-ai-is-pushing-developers-toward-typed-languages/
- Dan McKinley, Choose Boring Technology — https://mcfunley.com/choose-boring-technology ; https://boringtechnology.club ; Charity Majors — https://charity.wtf/2023/05/01/choose-boring-technology-culture/
- The Grug Brained Developer — https://grugbrain.dev
- Walking skeleton — https://www.henricodolfing.ch/en/start-your-project-with-a-walking-skeleton/ ; 97 Things ch. 60
- Tracer bullets — https://www.barbarianmeetscoding.com/notes/books/pragmatic-programmer/tracer-bullets/
- Design Docs at Google — https://www.industrialempathy.com/posts/design-docs-at-google/
- Oxide RFD 1 — https://rfd.shared.oxide.computer/rfd/0001 ; https://oxide.computer/blog/rfd-1-requests-for-discussion
- Orosz, Software Architecture is Overrated — https://blog.pragmaticengineer.com/software-architecture-is-overrated/
- Atlassian barrel files — https://www.atlassian.com/blog/atlassian-engineering/faster-builds-when-removing-barrel-files
- Russ Cox issue #117 — https://github.com/golang-standards/project-layout/issues/117
- Package by feature — https://phauer.com/2020/package-by-feature/ ; Simon Brown — https://simonbrown.je/modular-monolith/
- Team Topologies — https://teamtopologies.com ; https://danlebrero.com/2021/01/20/team-topologies-summary/
- Google monorepo (CACM 2016) — https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/
- Shopify Packwerk retrospective — https://shopify.engineering/a-packwerk-retrospective
- Heroku sustaining engineering (Feb 2026) — https://www.infoworld.com/article/4129430/salesforce-may-be-prepping-to-phase-out-heroku.html
- Rails 8 SQLite / Solid Queue — https://github.com/rails/solid_queue ; https://andre.arko.net/2025/09/11/rails-on-sqlite-exciting-new-ways-to-cause-outages/

Unverified items to check before shipping in a skill (marked "memory — verify" above): Google design-doc section list and length guidance; Driessen's 2020 Gitflow note; CalVer examples; Hynek essay summary; "To Type or Not to Type" 15% figure; Python free-threading status; Kent C. Dodds colocation wording; SQLite "Appropriate Uses" wording; Arko's specific SQLite pitfalls; Packwerk privacy-check extraction details; Nx `enforce-module-boundaries` config; import-linter contract names; depguard; NetArchTest; CODEOWNERS branch-protection setting name; ESLint `max-lines` defaults; nested AGENTS.md precedence; Changesets for monorepo versioning; McKinley "multiplicative cost" phrasing; Boehm verification/validation phrasing.
