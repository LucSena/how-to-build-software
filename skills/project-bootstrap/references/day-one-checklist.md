# Day-one checklist — full table, commands, and starter configs

Generate the Tier 1 items in the first PRs. List every skipped item as a TODO in the README "Production readiness" section. Versions of tools are deliberately not pinned here: pin whatever is current when you scaffold, and let the dependency bot move them.

## Contents
1. The full checklist
2. Toolchain pins and lockfile installs
3. `.editorconfig`
4. Strict type checking
5. Pre-commit hooks
6. Validated config module
7. Task runner front door
8. Minimal CI workflow
9. Health, logging, error tracking, backups
10. Rules catalog

## 1. The full checklist

| # | Item | Tier | Done when | Source |
|---|---|---|---|---|
| 1 | `README.md` | 1 | Says what it is, quickstart in ≤ 5 commands, how to test, how to deploy, where docs live; quickstart tested from a fresh clone | MS playbook "Creating a New Repository" |
| 2 | `LICENSE` | 1 (public) | Chosen deliberately: MIT/Apache-2.0 permissive; AGPL if network copyleft is intended; private repos state "proprietary" | MS playbook; Russ Cox's minimal Go repo starts with LICENSE |
| 3 | `.gitignore` + `.env.example` | 1 | `.env` ignored; `.env.example` has every key with placeholder values and a comment each | T3 env docs; Sairyss |
| 4 | `.editorconfig` | 1 | Indent, `lf`, final newline, UTF-8 | thoughtbot guides |
| 5 | Pinned toolchain | 1 | Local and CI read the same version file | Node BP 4.4 "Ensure Node version is unified" |
| 6 | Committed lockfile | 1 | CI installs in frozen/locked mode | Node BP 5.4, 5.19 |
| 7 | Formatter | 1 | Format-on-save configured; CI runs format **check** | bulletproof-react; FastAPI BP "Use ruff" |
| 8 | Linter | 1 | Runs in hook (staged files) and CI (whole repo); zero warnings on main | Node BP 3.1 |
| 9 | Strict type checking | 1 | Strict mode on; typecheck in CI | T3 axiom "Typesafety isn't optional" |
| 10 | Import alias (TS) | 1 | `@/*` → `src/*` | bulletproof-react |
| 11 | Pre-commit hooks | 1 | Format + lint staged files + secret scan; runs in seconds | Radar Vol. 33 (Nov 2025): Adopt |
| 12 | Secret scanning | 1 | Hook and CI (gitleaks, detect-secrets, or GitHub push protection) | MS playbook: "assume any repo … may go public at any time" |
| 13 | CI | 1 | install → format check → lint → typecheck → test → build; required check; < 10 min | MS playbook CI; DORA CI |
| 14 | Branch protection | 1 | PR required, checks required, no force-push to `main` | MS playbook |
| 15 | Merge strategy | 1 | Written in CONTRIBUTING or README (default squash) | MS "Merge Strategies" |
| 16 | Commit convention | 1 | Conventional Commits; optionally lint PR titles | conventionalcommits.org |
| 17 | Validated config | 1 | One module reads env, validates at startup, crashes listing missing keys | Node BP 1.4; T3 env |
| 18 | One-command setup/run | 1–3 days | `setup`, `dev`, `check` work from a fresh clone | MS DevEx "F5 contract"; Sairyss |
| 19 | Test runner + tests | 1–3 days | One unit test, one end-to-end smoke test of the skeleton | MS "First week" |
| 20 | Health endpoints | Before first deploy | `/healthz` (process alive), `/readyz` (dependencies reachable) | Node BP 5.7 |
| 21 | Structured logs | Before first deploy | JSON to stdout, request ID, release version | Node BP 5.14, 5.18 |
| 22 | Error tracking + uptime | Before real users | Errors grouped by release; alert on new issues; external uptime check | thoughtbot production checklist |
| 23 | Migrations + backups | Before real data | Migration tool with naming convention; automated backups, **restore tested** | FastAPI BP; thoughtbot |
| 24 | Dependency bot + audit | Week 1 | Renovate or Dependabot; audit in CI | Node BP 5.13, 6.7 |
| 25 | `CODEOWNERS` | Before 2nd team or ~5 contributors | Every top-level module has one owning team | GitHub docs |
| 26 | ADRs | Week 1 | `docs/adr/0001-record-architecture-decisions.md` + stack ADR if non-default | MS playbook ships ADR 0001 |
| 27 | `AGENTS.md` | 1 | Commands, map, conventions, boundaries, DoD | agents.md |
| 28 | `CONTRIBUTING.md` | Outside contributors | Branching, review, release process | MS playbook |
| 29 | `CHANGELOG.md` + version scheme | First release to others | Keep a Changelog format | keepachangelog.com |
| 30 | Definition of Done | Week 1 | Written in CONTRIBUTING or AGENTS.md | MS "Definition of Done" |

## 2. Toolchain pins and lockfile installs

| Ecosystem | Pin | CI install (fails on lockfile drift) |
|---|---|---|
| Node | `.nvmrc` or `.node-version`; `packageManager` field in `package.json` | `npm ci` · `pnpm install --frozen-lockfile` · `yarn install --immutable` |
| Python | `.python-version`; `requires-python` in `pyproject.toml` | `uv sync --locked` |
| Go | `go` and `toolchain` lines in `go.mod` | `go mod download` (checked against `go.sum`) |
| Rust | `rust-toolchain.toml` | `cargo build --locked` |
| .NET | `global.json` | `dotnet restore --locked-mode` (with `packages.lock.json`) |
| Polyglot | `mise.toml` or `.tool-versions` | `mise install` then the per-language command |

## 3. `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.{py,cs,java,kt}]
indent_size = 4

[{*.go,Makefile}]
indent_style = tab

[*.md]
trim_trailing_whitespace = false
```

## 4. Strict type checking

- **TypeScript** (`tsconfig.json`): `"strict": true`, `"noUncheckedIndexedAccess": true`, path alias `"paths": { "@/*": ["./src/*"] }`. CI: `tsc --noEmit`. Validate data at runtime edges (zod, valibot) because types vanish at runtime.
- **Python** (`pyproject.toml`): `[tool.pyright] typeCheckingMode = "strict"` or `[tool.mypy] strict = true`. New code fully annotated; `# type: ignore[code]` only with a reason.
- **C#**: `<Nullable>enable</Nullable>` and `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.
- **Go / Rust / Kotlin / Swift**: the compiler is the type checker; add `go vet` + staticcheck, `cargo clippy -- -D warnings`, detekt.

Make the typechecker part of the agent's inner loop: run it after every edit, not only in CI.

## 5. Pre-commit hooks

Fast checks only: format, lint staged files, secret scan. Tests run in CI.

`lefthook.yml` (any language):

```yaml
pre-commit:
  parallel: true
  commands:
    format:
      glob: "*.{ts,tsx,js,json,md}"
      run: npx prettier --check {staged_files}
    lint:
      glob: "*.{ts,tsx}"
      run: npx eslint {staged_files}
    # add a secret-scan command here: gitleaks documents a staged-changes scan
    # (its CLI changed in v8.19, so copy the current command from its README)
```

`.pre-commit-config.yaml` (Python-centric or polyglot; pin `rev` to current release tags and let `pre-commit autoupdate` move them):

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: <current tag>
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/gitleaks/gitleaks
    rev: <current tag>
    hooks:
      - id: gitleaks
```

JS repos often use husky + lint-staged instead. Pick one hook manager per repo.

## 6. Validated config module

One module reads the environment. Everything else imports from it. It validates at startup and fails with every problem listed. Typed config, the config vs secrets vs flags split, and per-environment rules are covered in depth in `environments-and-config`.

TypeScript (zod; t3-env wraps this pattern and also validates at build time and blocks server vars from client bundles):

```ts
// src/env.ts
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  SENTRY_DSN: z.string().url().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const keys = parsed.error.issues.map((i) => i.path.join("."));
  console.error(`Invalid or missing environment variables: ${keys.join(", ")}`);
  process.exit(1);
}
export const env = parsed.data;
```

Python (pydantic-settings):

```python
# app/config.py
from pydantic import PostgresDsn, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: PostgresDsn
    secret_key: SecretStr          # never printed in repr or logs
    debug: bool = False

settings = Settings()  # raises ValidationError naming every missing or invalid field
```

Rules: never log config values; every new key goes into the schema, `.env.example`, and deploy docs in the same PR; production-only differences come from env values, not from code branches (Django Styleguide: nothing that exists only in `production.py`).

## 7. Task runner front door

Native runner first. For polyglot repos, a thin `justfile` (or `Makefile`) that delegates:

```just
default: check

setup:
    cp -n .env.example .env || true
    pnpm install --frozen-lockfile
    uv sync --locked
    docker compose up -d --wait db
    uv run alembic upgrade head

dev:
    docker compose up -d --wait db
    pnpm dev

test:
    pnpm test
    uv run pytest

check:
    pnpm check
    uv run ruff format --check . && uv run ruff check . && uv run pyright && uv run pytest
```

`docker compose up --wait` waits for health checks. Without them, Compose only waits for containers to start, not to be ready. A dev container (`.devcontainer/devcontainer.json`, containers.dev spec) is worth adding when setup involves more than one language or system packages.

## 8. Minimal CI workflow

GitHub Actions example. Pin third-party actions to a full commit SHA with a version comment, because tags are mutable (supply-chain hardening, caching, build-once-promote, and OIDC deploys are covered in `deployment-and-infrastructure`).

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<full-commit-sha> # vX.Y.Z
        with:
          persist-credentials: false
      - uses: actions/setup-node@<full-commit-sha> # vX.Y.Z
        with:
          node-version-file: .nvmrc
      - run: npm ci
      - run: npm run check   # the same task developers run locally
```

Then mark `check` as a required status check on `main`. Target: under 10 minutes (DORA: feedback "in a few minutes", "upper limit of about 10 minutes"). Add a secret-scanning job (gitleaks or the platform's push protection) and a dependency audit in week one.

## 9. Health, logging, error tracking, backups

- **Health**: `/healthz` returns 200 if the process can serve (no dependency calls). `/readyz` checks the DB and critical dependencies with short timeouts. The platform uses readiness to route traffic, and liveness to restart. Include the release version in the response or at `/version`.
- **Logs**: one JSON object per line to stdout. Fields: timestamp, level, message, request/trace ID, release, environment. Use the ecosystem's structured logger (for example pino, structlog or stdlib logging with a JSON formatter, Go `log/slog`). No secrets, tokens, or raw PII.
- **Error tracking**: Sentry or an equivalent. Tag every event with release (git SHA) and environment, upload source maps for web, scrub PII, and alert on *new* issues rather than every event.
- **Uptime**: an external check on the public URL plus `/readyz`, alerting a human.
- **Backups**: automated and off-site, and **restored at least once** into a scratch database before real data arrives. A backup that has never been restored is a hope, not a backup (GitLab's 2017 outage: several backup mechanisms, none of them working when needed; see `lessons-from-failures`).
- **Migrations**: one tool, descriptive names (FastAPI BP: static, reversible, `YYYY-MM-DD_slug`), run by the deploy pipeline and never by hand in production.

## 10. Rules catalog

### Validate configuration before serving traffic
**Rule.** Parse and validate all config in one module at startup, and exit non-zero listing every missing or invalid key.
**Apply when.** Any app that reads environment variables or config files.
**Do / Avoid.** Do: `env.ts`/`config.py` imported everywhere. Avoid: `process.env.STRIPE_KEY!` scattered through handlers.
**Why.** Node Best Practices 1.4: otherwise the app starts, persists partial data, and fails mid-request when it reaches the missing key, leaving it in a dirty state. Fail-fast turns a runtime incident into a failed deploy.

### Make CI and local run the same command
**Rule.** CI runs `check` (or `make check`), not its own list of steps.
**Apply when.** Writing or editing any CI workflow.
**Do / Avoid.** Do: `run: npm run check`. Avoid: CI-only lint flags that developers never see locally.
**Why.** Drift between local and CI produces "passes on my machine" failures and slows the feedback loop DORA ties to delivery performance.

### Keep hooks fast enough that nobody skips them
**Rule.** Pre-commit runs only format, lint on staged files, and secret scan.
**Apply when.** Configuring husky, lefthook, or `pre-commit`.
**Do / Avoid.** Do: `{staged_files}`. Avoid: the full test suite or a full typecheck of a large repo in the hook.
**Why.** Slow hooks train people to use `--no-verify`, which removes the secret-scan safety net along with the slow checks.

### Rotate leaked secrets; history rewrites are not enough
**Rule.** Any secret that reached a remote, on any branch, is compromised. Rotate it first, then clean up.
**Apply when.** Secret scanning fires, or a `.env` was committed.
**Do / Avoid.** Do: revoke, reissue, deploy the new value, then purge. Avoid: force-pushing a rewritten history and moving on.
**Why.** Clones, forks, CI caches, and scanners already have the old history (MS playbook secrets management).

## Sources

- Microsoft Code-With Engineering Playbook — CI, first week, engineering fundamentals checklist, DevEx, secrets management, definition of done: https://github.com/microsoft/code-with-engineering-playbook
- DORA, Continuous integration capability: https://dora.dev/capabilities/continuous-integration/
- Node.js Best Practices (Goldberg et al.): https://github.com/goldbergyoni/nodebestpractices
- create-t3-app docs and t3-env: https://create.t3.gg · https://env.t3.gg
- bulletproof-react, Project Standards: https://github.com/alan2207/bulletproof-react/blob/master/docs/project-standards.md
- FastAPI Best Practices (zhanymkanov): https://github.com/zhanymkanov/fastapi-best-practices
- HackSoft Django Styleguide: https://github.com/HackSoftware/Django-Styleguide
- thoughtbot guides (general, production checklist): https://github.com/thoughtbot/guides
- Sairyss, Backend best practices: https://github.com/Sairyss/backend-best-practices
- gitleaks: https://github.com/gitleaks/gitleaks · pre-commit framework: https://pre-commit.com
- just: https://github.com/casey/just · Dev Container spec: https://containers.dev
- Docker Compose startup order: https://docs.docker.com/compose/how-tos/startup-order/
- GitHub Actions secure use (SHA pinning, token permissions): https://docs.github.com/en/actions/reference/security/secure-use
- ThoughtWorks Technology Radar Vol. 33 (Nov 2025): https://www.thoughtworks.com/radar
- AGENTS.md: https://agents.md
