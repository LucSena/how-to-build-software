# Local Development

Goal: a new developer (or an agent in a fresh container) goes from `git clone` to a running app with green tests with one documented command, using the same toolchain versions and task names as CI. The day-one repository checklist lives in `project-bootstrap`; this file is the environment part of it.

## Contents
1. Targets and measures
2. Toolchain pinning
3. Backing services with Docker Compose
4. Dev containers
5. Task names and the setup script
6. Fakes, sandboxes, and mail catchers
7. Local HTTPS, cookies, and OAuth
8. Platform differences that bite
9. Rules catalog

## 1. Targets and measures

The Microsoft playbook's developer-experience guidance names four essential tasks — **build, test, start, debug** — and two measures: **time to first end-to-end result** ("F5 contract": clone → configure → run) and **time to first commit**. Its CI guidance adds: "A single command should have the capability of building the system", and no IDE dependencies.

Targets:
- Clone to running: one command after installing a container runtime and a version manager.
- Everything CI runs is runnable locally by the same name (`make check`, `pnpm check`).
- New team members file defects against missing setup docs; fix the script, not the wiki.

## 2. Toolchain pinning

Pin runtime and tool versions once, in a file read by both developers and CI:

| Option | Scope | Use when |
|---|---|---|
| Ecosystem file (`.nvmrc`/`.node-version`, `packageManager` in `package.json`, `.python-version` with `uv.lock`, `go.mod` toolchain, `rust-toolchain.toml`) | One language | Single-language repo; CI setup actions read these files |
| `mise` (`mise.toml`) or asdf (`.tool-versions`) | Many tools (Node, Python, Terraform, …), plus env vars and tasks in mise's case | Polyglot repos; default for most teams |
| devbox or Nix flakes | OS-level packages, fully reproducible | You need exact system libraries or reproducibility beyond language runtimes |
| Dev container | Whole toolchain in a container | Complex native dependencies, Windows-heavy teams, cloud dev environments |

CI must read the same file (`node-version-file: .nvmrc`, `mise install`), otherwise local and CI drift.

## 3. Backing services with Docker Compose

Run the database, cache, queue, object store, and mail catcher in Compose; run the app natively for fast reloads (or in Compose under a profile).

```yaml
# compose.yaml — local backing services
services:
  db:
    image: postgres:17@sha256:<digest>          # same major version as production; pin by digest
    environment: { POSTGRES_USER: app, POSTGRES_PASSWORD: app, POSTGRES_DB: app, TZ: UTC }
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      retries: 10
  mail:
    image: axllent/mailpit:<version>            # catches all outgoing mail; web UI on 8025
    ports: ["8025:8025", "1025:1025"]
  app:
    build: .
    env_file: .env
    depends_on:
      db: { condition: service_healthy }        # wait for ready, not just started
    ports: ["8080:8080"]
    profiles: ["full"]                           # `docker compose --profile full up` also runs the app
volumes: { pgdata: {} }
```

Rules:
- **Health checks plus `condition: service_healthy`.** Compose's default ordering waits for containers to start, not to be ready (Docker docs, "Control startup order").
- **Same engine and major version as production.** Add the same extensions (e.g., `pgvector`) the production database has.
- **Override files** (`compose.override.yaml`, or `-f compose.yaml -f compose.ci.yaml`) for per-context differences instead of copies.
- **Know variable precedence and interpolation** (Docker docs): CLI and shell values override `.env`; `$$` escapes a literal `$` for the container.
- **Sensitive values** use Compose `secrets:` (mounted files), not `environment:`, when they are real secrets; local throwaway passwords like the one above are fine.
- **Never pin `latest`.** Placeholders such as `<digest>` must be filled with a real value looked up from the registry — never invented.

## 4. Dev containers

`.devcontainer/devcontainer.json` (open spec at containers.dev) describes a containerized development environment that VS Code, GitHub Codespaces, JetBrains IDEs, and the dev container CLI can open. Benefits: identical toolchain for everyone, faster onboarding, and the same container can run CI steps (the Microsoft playbook has a recipe for reusing dev containers in pipelines). Costs: file-system performance on some hosts, container-in-container complexity, and one more thing to maintain. Default: version manager plus Compose; add a dev container when native dependencies or onboarding time justify it.

## 5. Task names and the setup script

Use the ecosystem's native runner first (`package.json` scripts, `uv run`, Makefile for Go, Gradle, `cargo`); add a thin `Makefile` or `justfile` only in polyglot repos. Canonical names:

```
setup        # install toolchain + deps, copy .env.example → .env if missing, start services, migrate, seed
dev          # run the app with hot reload; backing services via compose
test         # unit + integration
e2e          # end-to-end against the local stack
lint / fmt / typecheck / build
db:migrate / db:seed / db:reset
check        # exactly what CI runs, in the same order
```

A good `setup`:
1. Verifies prerequisites (container runtime, version manager) and prints how to install what is missing.
2. Installs pinned tool versions and dependencies from the lockfile.
3. Creates `.env` from `.env.example` **only if absent** — never overwrites.
4. Starts Compose services and waits for health.
5. Runs migrations the same way the pipeline does, then an idempotent seed.
6. Prints the URL, the test login from the seed, and the next command.

It must be idempotent: running it twice is safe.

## 6. Fakes, sandboxes, and mail catchers

| Dependency | Local default |
|---|---|
| Email | Mail catcher (e.g., Mailpit) — nothing leaves the machine |
| Payments | Provider test mode with test keys; config validation rejects live keys outside production |
| Object storage | S3-compatible container, or a dedicated dev bucket in a sandbox account |
| Upstream API that is not ready or has no sandbox | Contract-based fake from its OpenAPI spec or recorded fixtures (the Microsoft playbook's "fake services inner loop" pattern) |
| SMS/push | Log transport or provider test credentials |
| Webhooks from third parties | Provider CLI forwarding or a tunnel, with signature verification still on |

Select these through specific settings (`EMAIL_TRANSPORT=smtp|log`, `PAYMENTS_MODE=sandbox|live`), not by checking the environment name.

## 7. Local HTTPS, cookies, and OAuth

- Browsers treat `http://localhost` as a secure context for most features; prefer it over custom hostnames.
- When you need real HTTPS locally (secure cookies across subdomains, service workers on custom domains, OAuth providers that demand HTTPS), use a locally trusted CA tool such as mkcert, never disabled TLS verification in code.
- OAuth: register a separate development OAuth app with localhost redirect URIs; do not add localhost to the production app.

## 8. Platform differences that bite

- **CPU architecture:** Apple Silicon laptops are arm64; many servers are amd64. Build multi-platform images (`linux/amd64,linux/arm64`) or pin `--platform` so native modules and images match.
- **Case sensitivity:** macOS default file systems are case-insensitive; Linux is case-sensitive. An import of `./Button` for `button.tsx` works locally and fails in CI.
- **Line endings and shells:** enforce `\n` via `.editorconfig`/`.gitattributes`; scripts in minimal images run under `sh`, not `bash`.
- **Time zone:** laptops run local time; servers and containers should run UTC. Set `TZ=UTC` for tests so date bugs appear locally.
- **Memory:** a laptop has no container memory limit; production does. Reproduce OOM issues with the same limit (`docker run --memory`).

## 9. Rules catalog

### Wait for readiness, not for start
**Rule.** Every backing service in Compose has a health check, and dependents use `condition: service_healthy`.
**Apply when.** Any Compose file used for local dev or CI integration tests.
**Do / Avoid.** Do `pg_isready` checks. Avoid `sleep 10` in setup scripts.
**Why.** Containers report "started" before the service accepts connections; sleeps are both slow and flaky.

### Same engine, same major version
**Rule.** Local and CI use the same database, cache, and queue engines and major versions as production.
**Apply when.** Choosing local backing services.
**Do / Avoid.** Do Postgres 17 in Compose when prod runs Postgres 17. Avoid SQLite "for convenience" when prod is Postgres.
**Why.** 12-factor dev/prod parity: SQL dialect, locking, and constraint behavior differ; bugs appear only in prod.

### One setup command, idempotent
**Rule.** `setup` brings a fresh clone to a running, seeded app and can be re-run safely.
**Apply when.** Any repo with more than one person or agent working in it.
**Do / Avoid.** Do copy `.env.example` only if `.env` is absent. Avoid README steps that must be run by hand in order.
**Why.** Manual steps drift from reality; scripts are tested every time someone runs them.

## Sources

- Microsoft Code-With Engineering Playbook, Developer Experience (F5 contract, dev containers, fake services) and Continuous Integration — https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/developer-experience , https://github.com/microsoft/code-with-engineering-playbook/blob/main/docs/CI-CD/continuous-integration.md
- Docker docs: Control startup order; Compose in production (override files); environment variable precedence; Compose secrets; multi-platform builds — https://docs.docker.com/compose/how-tos/startup-order/ , https://docs.docker.com/compose/how-tos/production/ , https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/ , https://docs.docker.com/compose/how-tos/use-secrets/ , https://docs.docker.com/build/building/multi-platform/
- MDN, Secure contexts (localhost treated as potentially trustworthy) — https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts
- Development Containers specification — https://containers.dev , https://github.com/devcontainers/spec
- mise — https://github.com/jdx/mise
- devbox — https://github.com/jetify-com/devbox
- The Twelve-Factor App, Dev/prod parity — https://12factor.net/dev-prod-parity
- Sairyss, Backend best practices (easy project setup, seeding) — https://github.com/Sairyss/backend-best-practices
