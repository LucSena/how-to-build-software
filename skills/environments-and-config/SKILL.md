---
name: environments-and-config
description: Use when setting up or fixing environments, configuration, or secrets — local, CI, preview, staging, and production; env vars and .env files; typed config validated at startup (Zod, t3-env, envalid, pydantic-settings); config vs secrets vs feature flags vs public build-time vars (NEXT_PUBLIC_, VITE_); secret managers, workload identity, and OIDC; secret scanning, rotation, and leaked keys; per-environment cloud accounts; preview environments and database branching; staging limits and testing in production; seed and anonymized data; one-command local dev (Docker Compose, dev containers, mise, devbox); config drift; environment-specific bugs (time zones, locale, CPU architecture). Also use when the user says "works on my machine", "works in staging but not prod", "where do I put this API key?", "add an env var", "I committed a secret", or "set up .env". Not for pipelines, Dockerfiles, deploy strategies, or hosting choice (use deployment-and-infrastructure), day-one repo scaffolding (use project-bootstrap), or app-level security (use application-security).
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "deployment-and-infrastructure project-bootstrap application-security reliability data-modeling"
---

# Environments and Config

Most "it works on my machine" bugs, many outages, and most leaked credentials come from the same place: settings that were put in the wrong home, read from everywhere, never validated, and allowed to drift between environments. This skill decides where each setting lives, makes the app refuse to start with bad config, keeps secrets out of reach, and keeps every environment running the same artifact with only config values changed.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Classify every setting before placing it.** Code wiring, deploy config, secrets, feature flags, and public build-time vars have different homes, owners, and change speeds; agents conflate them constantly.
2. **Parse config once, typed, at startup — and crash on anything invalid.** A missing key found at the first request has already written half a transaction; a pod that fails at boot never gets traffic.
3. **Prefer no secret at all.** Workload identity and OIDC federation beat any stored secret; a stored secret beats an env var; nothing beats git.
4. **Environments differ in config values only.** Same artifact digest, same runtime, same backing-service type and major version, same config schema; drift between them is where "works in staging" bugs live.
5. **Isolate production by account, not by naming convention.** A staging script holding staging credentials must be physically unable to touch production.
6. **A config change is a deploy.** Review it, validate it against the consumer's limits, and roll it out in stages — config pushes cause global outages as often as code does.
7. **Never move real personal data down.** Lower environments get synthetic or anonymized data, because they have weaker access control by design.

## Workflow

- [ ] **Inventory.** List every setting the change touches; label each with one of the five kinds (table below). Check: no secret has a client prefix, no flag is stored as config.
- [ ] **Schema first.** Add or update the key in the single config module (typed, bounded, no default for secrets), in `.env.example`, and in each environment's config source — in the same change.
- [ ] **Secrets.** Choose the highest available rung of the preference ladder; never write a real secret value anywhere, including tests, docs, and examples.
- [ ] **Parity check.** Walk the "must not differ" list for every environment the change reaches; fix drift in IaC, not in a console.
- [ ] **Data.** If an environment needs data, use seeds, factories, or anonymized branches — never a raw production copy.
- [ ] **Rollout order.** New keys land in every environment before the code that requires them; removed keys go only after the code stops reading them.
- [ ] **Verify.** App boots with the example config; boot fails with a clear message when a required key is missing; secret scan passes; startup log shows keys and version but no secret values. Fix and repeat.

## The five kinds of setting

| Kind | Examples | Lives in | Changes | Who can read |
|---|---|---|---|---|
| Code wiring | routes, DI wiring, retry policy defaults, schemas | Code, reviewed | Deploy | Anyone with the repo |
| Deploy config (non-secret) | `DATABASE_HOST`, `LOG_LEVEL`, base URL, pool size, region, OTel endpoint | Env vars or platform-mounted files, generated from IaC | Restart | Operators, the app |
| Secrets | DB password, API keys, signing keys, OAuth client secret, webhook secret | Secret manager — or eliminated by workload identity | Rotated | The workload only, plus break-glass |
| Feature flags | release toggles, kill switches, experiments, entitlements | Flag service (OpenFeature provider) | Seconds, per user/segment | Product and engineering; security-relevant flags evaluated server-side |
| Public build-time vars | `NEXT_PUBLIC_*`, `VITE_*`, `PUBLIC_*`, `EXPO_PUBLIC_*`, mobile app config | Build environment; baked into the bundle | Rebuild | **Everyone** — shipped to browsers and devices |

Rules that follow from the table:
- The 12-factor litmus test: could the repo be made public right now without leaking a credential? Microsoft's engineering playbook says to assume any repo may go public at any time.
- A client-prefixed variable is public, full stop. If the client "needs" a secret, move the call server-side.
- Do not branch on the environment name (`if env == "staging"`). Use specific, orthogonal settings (`EMAIL_TRANSPORT=smtp|log`, `PAYMENTS_MODE=sandbox|live`); 12-factor warns that grouping settings into named environments explodes combinatorially. An `APP_ENV` label for telemetry is fine; branching on it is the smell.
- `NODE_ENV=production` is a framework optimization switch, not your environment name. Staging runs with `NODE_ENV=production` too.
- Flags are not a secret store, and config is not a flag system: flags need targeting, audit, and fast change; config needs validation and review.

## Typed config, validated at startup

Default: one module (`src/env.ts`, `app/settings.py`, `config/env.go`) builds an immutable, typed object at process start. Nothing else reads `process.env` or `os.environ`. TypeScript: t3-env (any Standard Schema validator, e.g., Zod) or envalid; Python: pydantic-settings. Full examples in `references/config-schema-examples.md`.

- **Required unless a default is safe.** `PORT` and `LOG_LEVEL` may have defaults. Secrets and security-relevant settings **never** do — `JWT_SECRET ?? "dev-secret"` ships to production eventually.
- **Parse, don't just read.** Integers with bounds, URLs, enums, durations with units, comma lists into arrays. Booleans from an explicit string set: coercing with `Boolean("false")` or Zod's `z.coerce.boolean()` yields `true` (t3-env docs warn about this; use `z.stringbool()` in Zod v4).
- **Treat empty as missing** (`FOO=` in a `.env` file is not a value).
- **Cross-field invariants** in code after parsing: `PAYMENTS_MODE=live` requires a live key; only production may use live payments; production must not point at a sandbox host.
- **Error message lists every bad key and why — never the value.**
- **Validate in CI too:** build-time validation for frontend public vars; a check that schema keys and `.env.example` keys match.
- **Log a config fingerprint at startup:** key names, non-secret values, a hash of each secret, and the release version. "Which config is prod actually running?" becomes a log search.

Why crash at startup: Node.js Best Practices describes the alternative — the app boots, serves requests, persists half the data, and only then hits the missing key, leaving a dirty state. In a rolling or canary deploy, a replica that fails readiness never receives traffic, so the rollout halts instead of serving errors.

## Environment matrix

| | Local | CI | Preview (per PR) | Staging | Production |
|---|---|---|---|---|---|
| Artifact | local build | built once per commit | same image that would ship | same digest prod will get | same digest |
| Data | seeds | fixtures, fresh DB per run | seeds or anonymized branch | anonymized or synthetic, prod-sized for perf tests | real |
| Secrets | dev-only, sandbox | none, or OIDC test role | preview-scoped, low value | staging-only, never prod's | prod-only, identity-based |
| Cloud account | none or sandbox | CI | nonprod | nonprod or own | **separate prod account** |
| Integrations, email/SMS | sandboxes, mail catcher | fakes | sandboxes, captured mail | sandboxes, allowlisted recipients | live |

**Must not differ** anywhere: build artifact, language runtime version, base image and CPU architecture (or test both), backing-service type and major version (12-factor: resist using SQLite locally when prod runs Postgres), schema and migration tooling (applied by the pipeline, not by hand), config **schema** (same keys, different values), IaC modules (same modules, different variables), network shape (private DB, TLS termination point), server time zone (UTC). Full matrix, access, lifetime, and observability rows in `references/environment-matrix.md`.

## Secrets

Preference ladder, best first:

| Rung | Mechanism | Use when |
|---|---|---|
| 1 | **No secret**: workload identity (cloud IAM role for the compute, managed identity) and OIDC federation from CI to cloud | Default on any major cloud; nothing to leak or rotate |
| 2 | Dynamic, short-lived credentials issued per consumer (e.g., a Vault/OpenBao database engine) | High-value databases, many consumers |
| 3 | Secret manager reference (AWS/GCP/Azure secret managers, Vault/OpenBao, Doppler, Infisical, 1Password), fetched at start or mounted as files | Third-party API keys and anything identity cannot replace |
| 4 | CI/CD platform secrets, scoped to protected environments | Deploy-time values; small blast radius, short-lived |
| 5 | Plain env var injected by the platform | Acceptable baseline on a PaaS; lowest rung |

The OWASP Secrets Management Cheat Sheet says env vars "are generally accessible to all processes and may be included in logs or system dumps" and are "not recommended unless the other methods are not possible". On a PaaS where env vars are the only option: never log the environment, do not pass it to child processes that do not need it, scrub crash dumps, and move high-value secrets up the ladder first.

- **Never** in git (private repos included), Docker `ARG`/`ENV` or image layers, client bundles, URLs, logs, error messages, or unencrypted IaC state.
- **Commit `.env.example`** (every key, comments, obviously fake values); git-ignore `.env`, `.env.local`, `.env.*.local`; exclude them in `.dockerignore`.
- **Scan in three layers:** pre-commit hook (e.g., gitleaks) → CI scan that also checks the full history (e.g., TruffleHog, which can verify whether a found credential is live) → platform push protection (e.g., GitHub secret scanning). The hook is a convenience that people skip; CI and push protection are the enforcement.
- **Rotate with overlap, never with a gap:** (1) create v2 while v1 stays valid; (2) roll every consumer to v2; (3) confirm from audit logs that nothing still uses v1; (4) revoke v1. Verifiers (JWT `kid`, webhook signatures) accept both current and previous keys during the window.
- **Leaked secret:** revoke or rotate first, then investigate. Details and the full runbook in `references/secrets.md`.

## Isolation per environment

- One cloud account (AWS), project (GCP), or subscription (Azure) per environment class at minimum: prod separate from nonprod. The AWS multi-account whitepaper recommends separating production from non-production workloads; the account boundary gives you IAM, quota, billing, and blast-radius separation for free.
- Humans are read-only in production consoles; changes go through IaC and the pipeline. CI assumes a separate, environment-scoped OIDC role per environment (`deployment-and-infrastructure` shows the trust policy).
- Secrets are per environment. A staging secret that also works in prod is a prod secret stored in a less protected place.

## Preview environments and database branching

Every PR gets a full-stack deploy with its own URL and, ideally, its own database branch (copy-on-write branching such as Neon's makes this cheap; platform integrations inject a per-preview `DATABASE_URL`). Checklist: deterministic URL posted on the PR; isolated data with migrations applied (previews double as migration tests); seeds and test accounts created automatically; preview-scoped low-value secrets and sandbox integrations only; access protection and `noindex`; OAuth redirects and webhooks handled by a proxy or dedicated preview app, not by widening the prod OAuth app; TTL and teardown on PR close plus a janitor for orphans; telemetry tagged `environment=preview`.

A branch of production contains production PII. Branch from an anonymized or seeded parent, or use anonymized branching (static masking rules applied at branch creation), never raw prod. Fork PRs do not receive secrets on GitHub by design — never "fix" that with `pull_request_target`.

## Staging and testing in production

Staging cannot prove production safety: real traffic, data shape, scale, and dependencies cannot be cloned faithfully — Charity Majors (Honeycomb) argues that everyone already tests in production and should invest in doing it safely. Keep staging for integration with real sandboxes, migration rehearsal on prod-sized anonymized data, load tests, smoke tests of the exact digest, validation of new config keys, and IaC plan/apply rehearsal. Make production safe to test in with flags and dark launches, canaries with automated analysis, synthetic checks, flagged test tenants, and kill switches — the mechanics live in `reliability`. Treat staging as a pipeline stage, not a place people hand-edit.

## Seed and anonymized data

- Test fixtures: small, deterministic, in the repo, built by factories. Seeds (local and preview): idempotent (upserts), realistic volume for pagination, edge cases (Unicode and very long names, RTL text, time zones, empty states), documented test logins.
- Never copy raw production PII to a lower environment. Use synthetic data, or static masking (e.g., PostgreSQL Anonymizer: faking, partial masking, noise, generalization, pseudonymization), subsetting with referential integrity, or tokenization. Pseudonymize deterministically where joins or uniqueness matter.
- Masking rules live in code and are reviewed; fail the pipeline when a new PII column has no rule. Retention and PII columns are modeled in `data-modeling`.

## Local development

Target: clone to running app and green tests with one documented command (`make setup && make dev`, `just dev`, `pnpm dev`), using the same task names CI calls. Backing services run in Docker Compose with health checks and `depends_on: condition: service_healthy` (Compose otherwise waits only for "started", not "ready"). Toolchain versions are pinned once (`mise.toml`, `.tool-versions`, devbox/Nix, or a dev container) and read by CI too. Mail goes to a local catcher; payment and other providers run in sandbox or test mode; unfinished upstreams get contract-based fakes. Details, a compose file, and the setup script shape are in `references/local-dev.md`; the day-one repo checklist lives in `project-bootstrap`.

## Config drift and config-change safety

- Config — including generated data files, flag rules, WAF rules, routing tables — goes through version control, review, schema and size validation against the **consumer's** limits, and staged rollout with health gates.
- Runtime-reloaded config fails **static**: reject the bad version, keep last-known-good, alert. Startup config fails **fast**, because the rollout gate protects you there.
- Expand/contract for config: add keys everywhere before the code that needs them; remove them after the code stops reading them.
- Detect drift on a schedule (`terraform plan -refresh-only` or `tofu plan` with `-detailed-exitcode`) and keep consoles read-only; reconcile by changing code, not by clicking.

## Environment-specific bugs

| Trap | Default |
|---|---|
| Time zones and DST | Servers in UTC; store `timestamptz`; convert at the edge; schedules carry an explicit zone (Kubernetes CronJob `.spec.timeZone`); local-time jobs near 02:00 run twice or never on DST days |
| Locale | Never parse or format user numbers/dates with the process default locale; slim images may lack locale data |
| Filesystem case | macOS default is case-insensitive, Linux is not → import-path bugs appear only in CI or prod |
| CPU architecture | Apple Silicon (arm64) laptops vs amd64 servers → build multi-platform images or pin `--platform` |
| Memory limits | Runtime heap below the container limit (Node `--max-old-space-size`); otherwise OOM kills instead of GC |
| Minimal images | Missing CA certificates, `sh` instead of `bash`, musl DNS behavior |
| Clock skew | JWT `nbf`/`exp` validation needs a small leeway |
| Cluster DNS | Kubernetes `ndots:5` multiplies external lookups (see `deployment-and-infrastructure`) |

## Twelve-factor, read in 2026

The Twelve-Factor App was open-sourced in November 2024 and the community is revising it (as of 2026-09). What still holds: strict config/code separation, one codebase with many deploys, build/release/run separation, disposability, stateless processes, backing services as attached resources, admin tasks as one-off processes, dev/prod parity (time, personnel, tools). What is being modernized: proposals to add a workload-identity factor, allow platform-mounted config files, and widen "logs" to telemetry. Read it as: config in the environment, but secrets through identity or mounted files rather than raw env vars.

## Cases

| Case | What happened | Rule |
|---|---|---|
| Cloudflare R2, Mar 2025 | During a credential rotation, new credentials were deployed to the default environment because the `--env production` flag was omitted; old credentials were then removed → R2 auth failures | Tools must require an explicit target environment (no implicit default); verify the new credential is in use before revoking the old |
| Cloudflare, Nov 2025 | A database permissions change doubled a generated feature file; the proxy's preallocated limit was exceeded and it panicked, globally | Generated config is input: validate size and shape; keep last-known-good |
| Cloudflare, Dec 2025 | A killswitch config change went out through the global (non-gradual) system and hit an untested code path → HTTP 500s | Config uses staged rollout too, including emergency levers |
| CircleCI, Apr 2025 | An IAM gap allowed an out-of-band WAF change outside Terraform during "read-only" investigation; legit traffic was blocked | Read-only consoles in prod; every change through IaC; drift detection |
| Heroku | A deployment process left new config variables unused while code already required them | Config keys land before the code that needs them; verify at boot |

## Gotchas

- **Writing real-looking secrets** into code, tests, README, or a committed `.env`. Use `.env.example` placeholders, confirm `.env` is git-ignored, and run a secret scan before finishing.
- **Fallback defaults for secrets** (`?? "changeme"`). Required, no default, crash if missing.
- **`process.env.X` scattered across the codebase.** Import from the config module; add a lint rule or CI grep that forbids direct access elsewhere.
- **Putting a server key in `NEXT_PUBLIC_`/`VITE_` "to make it work".** It is now public in every browser; rotate it and move the call server-side.
- **`z.coerce.boolean()` or `Boolean(str)` for flags from env** — `"false"` becomes `true`.
- **Branching on `NODE_ENV` or `APP_ENV`** to change behavior. Introduce a specific setting or a flag.
- **Logging the full config or `process.env` "for debugging".** Log key names, non-secret values, and hashes only.
- **Copying the prod database into staging or a preview "for realism".** Anonymized or synthetic only.
- **SQLite or an in-memory fake locally, Postgres in prod.** Same engine and major version everywhere via Compose.
- **Fixing a broken environment in the cloud console.** Change IaC; the console is read-only; the next apply or drift check will undo or reveal your fix.
- **Treating a staging pass as proof.** Ship progressively and watch production signals.
- **Rotating by revoke-then-replace.** That is a scheduled outage; overlap two valid credentials.
- **Rewriting git history as the leak fix.** The secret is already compromised; rotate first.
- **Leaving previews and test infra running.** TTL, teardown on PR close, cost tags.

## Output format

For a config or environment task, deliver the change plus this summary:

```
Settings
| Key | Kind (code/deploy/secret/flag/public) | Required | Default | Source per env |

Files changed: config module, .env.example, IaC/platform config, docs
Secrets: rung used per secret; nothing secret committed (scan: pass)
Parity: must-not-differ items checked — <list any accepted drift and why>
Rollout order: keys added before code / removed after code
Verified: boots with example config; fails clearly without <KEY>; startup log shows no secret values
Not checked: <what could not be verified locally>
```

## References

| File | Read when |
|---|---|
| `references/config-schema-examples.md` | writing or reviewing the config module (TypeScript t3-env/Zod/envalid, Python pydantic-settings), `.env.example`, the CI key-sync check, or runtime config for a single frontend artifact |
| `references/secrets.md` | choosing where a secret lives, injecting secrets on Kubernetes or GitOps, rotating without downtime, setting up scanning, or responding to a leaked key |
| `references/environment-matrix.md` | designing the set of environments, per-environment accounts, preview environments with DB branching, staging scope, seed/anonymized data, or debugging a "works in X, not in Y" difference |
| `references/local-dev.md` | making clone-to-running one command: Compose with health checks, dev containers, mise/devbox, fakes, mail catchers, local HTTPS |

## Related skills

- `deployment-and-infrastructure` — pipelines, build-once promotion, OIDC trust policies, containers, IaC, and where to run it.
- `project-bootstrap` — the day-one repo checklist that includes env validation and `.env.example`.
- `application-security` — secrets in logs, authorization, and the rest of secure-by-default engineering.
- `reliability` — feature flags, canaries, and kill switches for testing safely in production.
- `data-modeling` — PII columns, retention, and which fields anonymization must cover.
