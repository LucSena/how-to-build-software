# CI/CD

Pipeline design, speed, build-once promotion, GitHub Actions hardening, OIDC to the cloud, migrations as a step, and the observability wiring that makes deploys measurable. Dated facts are as of 2026-09.

## Contents
1. Principles
2. Stages in detail
3. Keeping CI fast
4. Build once, promote by digest
5. Trunk-based development and branch protection
6. GitHub Actions hardening
7. OIDC federation and trust policies
8. Artifact integrity: SBOM, provenance, attestations
9. Migrations in the pipeline
10. Release wiring and DORA events
11. Review checklist for pipeline changes
12. Rules catalog

## 1. Principles

- Pipelines live in the repo and are reviewed like code; a single command builds the system locally and in CI (Microsoft playbook).
- CI/CD exists before customer features — the playbook asks for it in "Sprint 0".
- Main is always releasable. A red main is stop-the-line: fix it or revert within minutes (DORA continuous integration guidance).
- Every job has a timeout; every deploy has a health gate; every release has a unique immutable ID.

## 2. Stages in detail

| Stage | Contents | Notes |
|---|---|---|
| Setup | Checkout with `persist-credentials: false`; toolchain from `.nvmrc`/`mise.toml`; `npm ci` / `pnpm install --frozen-lockfile` / `uv sync --locked` / `pip install --require-hashes` | Lockfile drift fails here |
| Static | Formatter check, linter, typecheck, config schema check, hadolint, workflow linter, `terraform fmt -check` + `validate` | Cheapest failures first |
| Security | Secret scan, dependency audit (OSV-based scanner, `npm audit`, Dependabot alerts), SAST (CodeQL, Semgrep) | Parallel with tests |
| Unit tests | Sharded by timing data | — |
| Build | Build image once; tag with git SHA; push; output the **digest**; generate SBOM and provenance | Cache layers (`cache-from`/`cache-to`) |
| Image scan | Trivy, Grype, or Docker Scout on the built image; block criticals | The playbook: images failing scans should never reach a production-accessible registry |
| Integration / e2e | Testcontainers or Compose services, or a preview deploy | Contract tests between services |
| Staging / preview | Deploy the same digest; run migrations step; smoke tests | Smoke includes "prod not pointing at a UAT database" (playbook) |
| Production | Canary or rolling with automated analysis; environment protection rules | Record deploy events |

## 3. Keeping CI fast

Target: PR feedback in under ~10 minutes (DORA's CI guidance gives about 10 minutes as the upper limit).
- Cache dependencies keyed on the lockfile hash; cache Docker layers (BuildKit cache mounts, registry or GitHub Actions cache backends).
- Order Dockerfile layers from least to most frequently changing.
- Run independent jobs in parallel; shard tests; in monorepos build and test only affected packages (Nx, Turborepo, Bazel affected graphs).
- `concurrency:` groups with `cancel-in-progress` for PRs so superseded runs stop.
- `timeout-minutes` on every job; fail fast on infrastructure flakiness; quarantine flaky tests with an owner and a deadline.
- Slow suites (full e2e, load) run on the merge queue, on main, or nightly — but critical paths are never covered *only* nightly.

## 4. Build once, promote by digest

- 12-factor: **build** makes an artifact, **release** combines it with config and gets a unique, immutable ID, **run** executes it.
- Promote `registry/app@sha256:<digest>` through preview → staging → production. Never rebuild per environment and never promote a mutable tag; Node.js Best Practices: a digest guarantees every instance runs exactly the same code.
- The Microsoft playbook: promotion also includes each environment's configuration state (new settings, flag defaults).
- Keep the previous N images (registry retention policy) so rollback is a redeploy.
- Frontend bundles with inlined public env: prefer runtime config for a single artifact; otherwise build per environment from the same commit and record it.

## 5. Trunk-based development and branch protection

- Short-lived branches (hours to a day or two), small PRs, main always releasable, incomplete work behind flags. DORA associates trunk-based development with higher delivery performance.
- Branch protection: required checks, required review, no direct pushes, merge queue for busy repos, CODEOWNERS on `.github/workflows/` and infra directories.

## 6. GitHub Actions hardening

Primary sources: GitHub "Secure use reference", "Securely using pull_request_target", OIDC docs; OWASP CI/CD Security Cheat Sheet.

**Pinning.**
- Pin every third-party action, reusable workflow, and `docker://` action to a full-length commit SHA (or digest) with a trailing version comment. GitHub: the only way to use an action as an immutable release.
- Since 2025-08-15 the "allowed actions" policy (org or repo) can require SHA pinning and block specific actions or versions; unpinned workflows then fail.
- Dependabot (`package-ecosystem: github-actions`) or Renovate updates the SHA and the comment together.
- **Never invent SHAs.** Resolve them from the action's tagged release (`git ls-remote https://github.com/<owner>/<action> refs/tags/<tag>` — for annotated tags use the peeled `^{}` commit) or leave `<SHA>` and report it as a TODO.

**Token permissions.**
```yaml
permissions: {}            # workflow level: nothing
jobs:
  test:
    permissions: { contents: read }
  deploy:
    permissions: { contents: read, id-token: write }
```
Org setting: default `GITHUB_TOKEN` to read-only and disallow Actions from creating or approving PRs.

**Script injection.** Untrusted fields (PR title and body, branch names, commit messages, issue text) interpolated into `run:` become shell code.
```yaml
# Avoid
- run: echo "${{ github.event.pull_request.title }}"
# Do
- env: { TITLE: "${{ github.event.pull_request.title }}" }
  run: echo "$TITLE"
```

**`pull_request_target` and `workflow_run`.** Both run in the base repository's context with secrets and a write-capable token. A "pwn request" checks out the fork's head SHA and runs its build scripts with those secrets. Rules:
- Use `pull_request` for building and testing PR code (fork runs get no secrets and a read-only token by design).
- If privileged follow-up is needed (commenting, labeling), use a separate workflow that treats artifacts from the unprivileged run as untrusted data, never code.
- As of 2026-09: `actions/checkout` refuses to check out fork PR head refs under `pull_request_target` unless an explicit unsafe opt-in input is set; GitHub introduced a default policy that blocks `pull_request_target` in public repositories, currently in evaluate mode and **enforced from 2026-11-02** for affected repositories; `pull_request_target` runs get read-only cache access to reduce cache poisoning.

**Secrets.** Individual secrets rather than one JSON blob (redaction matches exact strings); `::add-mask::` for derived values; environment secrets gated by required reviewers; audit logs for secret changes; remove unused secrets; rotate anything that reaches a log.

**Runners.** GitHub-hosted runners are fresh VMs per job. Self-hosted runners should almost never serve public repositories; use ephemeral just-in-time runners, runner groups, and no access to cloud metadata credentials from runner hosts.

**Visibility.** The dependency graph includes actions; OpenSSF Scorecard flags dangerous workflows and unpinned dependencies; CodeQL scans workflow files for injection patterns.

**Scheduled workflows.** Run only on the default branch, can be delayed at high load (the start of every hour is busy) and queued jobs may be dropped; in public repos they are disabled after 60 days without activity. Use a real scheduler for business-critical jobs.

OWASP's Top 10 CI/CD risks to keep in mind: insufficient flow control, inadequate identity and access management, dependency chain abuse, poisoned pipeline execution, insufficient pipeline-based access controls, insufficient credential hygiene, insecure system configuration, ungoverned third-party services, improper artifact integrity validation, insufficient logging and visibility.

## 7. OIDC federation and trust policies

Mechanism: the job requests a signed JWT from GitHub's OIDC provider (claims include `sub`, `aud`, `repository`, `ref`, `environment`, `sha`, `job_workflow_ref`); the cloud validates the claims against a trust policy and issues credentials valid only for that job. No cloud secret is stored anywhere.

AWS trust policy for a production deploy role (in the separate production account):
```json
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::<prod-account-id>:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:my-org/app:environment:production"
    }
  }
}
```

- Always constrain `sub`. Scope deploy roles to an **environment**: only jobs declaring `environment: production` (which can require reviewers and branch rules) can assume the role.
- Avoid `StringLike` with `repo:my-org/app:*` for privileged roles — any branch or PR workflow could assume them.
- **Immutable subject claims (as of 2026-09):** for repositories created after 2026-07-15, or that opted in, `sub` includes immutable owner and repository IDs, e.g. `repo:my-org@<ownerId>/app@<repoId>:environment:production`. This protects against rename or re-registration hijacks; trust policies must match the new format.
- Separate roles: image-push role (shared services or nonprod account), per-environment deploy roles, read-only IaC plan role, write IaC apply role.
- The same pattern exists for GCP (Workload Identity Federation), Azure, HashiCorp Vault, and package registries.

## 8. Artifact integrity: SBOM, provenance, attestations

- Generate an SBOM and build provenance at build time (BuildKit `sbom`/`provenance` options, or a dedicated action).
- GitHub artifact attestations (Sigstore) give SLSA v1.0 Build Level 2; building inside a vetted reusable workflow raises assurance further.
- GitHub's docs are explicit: generating attestations alone provides no security benefit — **verify** them (`gh attestation verify`, or an admission controller that rejects unverified images).
- Sign what people or clusters run (release images, published packages), not every test build.

## 9. Migrations in the pipeline

- One-off job per release, same image and config (12-factor admin processes), before the new version receives traffic. Not in every replica's startup: replicas race, startups time out, and a failure leaves a half-deployed release. If a framework insists on boot-time migration, wrap it in a database advisory lock.
- Order across releases: expand migration → deploy code that handles both shapes → backfill job → contract migration in a later release. Full steps: `reliability` and `data-modeling`.
- Migration role has DDL rights; the application role has DML only.
- CI applies migrations from an empty database **and** from the previous release's schema; a migration linter (e.g., squawk, strong_migrations) blocks dangerous DDL; preview database branches exercise each PR's migrations.
- `lock_timeout` and `statement_timeout` on DDL; backfills are throttled jobs.
- The deploy fails if the migration fails; never auto-roll-back DDL blindly. Back up before destructive changes — the Microsoft playbook asks for data backups before each release.

## 10. Release wiring and DORA events

- Version (git SHA) in: OCI label `org.opencontainers.image.revision`, `APP_VERSION`, `/version` endpoint, OpenTelemetry `service.version`, error-tracker `release`, and log fields. Tag telemetry with the deployment environment (check the current OpenTelemetry semantic conventions for the exact attribute name).
- Error tracker releases (e.g., Sentry) link errors to a release, detect regressions, suggest suspect commits via SCM integration, and need source maps or debug symbols uploaded at build time.
- Deploy markers (Honeycomb markers, Grafana annotations, Datadog deployment tracking) for deploys, config changes, and flag flips.
- Emit deploy start/finish/rollback events (e.g., GitHub Deployments and environments) and derive DORA's five metrics: change lead time, deployment frequency, failed deployment recovery time, change fail rate, deployment rework rate.
- Never log secrets or config values while doing any of this.

## 11. Review checklist for pipeline changes

- [ ] Third-party actions pinned to full SHAs with version comments; no invented SHAs.
- [ ] `permissions:` minimal per job; `id-token: write` only on jobs that need OIDC.
- [ ] No `${{ github.event.* }}` inline in `run:`.
- [ ] No `pull_request_target`/`workflow_run` executing PR code.
- [ ] Deploy jobs bound to protected environments; secrets only where needed.
- [ ] `timeout-minutes` on every job; `concurrency` for PRs.
- [ ] Image built once and promoted by digest; scanned; attested (and verified where it runs).
- [ ] Migrations as a separate step; smoke test verifies version and wiring.
- [ ] CODEOWNERS covers workflow files.

## 12. Rules catalog

### Pin actions to a full commit SHA
**Rule.** Reference third-party actions as `owner/action@<40-char SHA> # vX.Y.Z` and let a bot update them.
**Apply when.** Every `uses:` outside your own repository.
**Do / Avoid.** Do `actions/checkout@<SHA> # v5.0.0` with the SHA looked up from the tag. Avoid `@v5`, `@main`, or a SHA you did not verify.
**Why.** Tags and branches are mutable; the tj-actions attack moved tags to malicious code and only SHA-pinned consumers were safe.

### Scope OIDC trust to an environment
**Rule.** Cloud roles trust a specific repository **and** environment in the `sub` claim.
**Apply when.** Any role that can deploy or read production data.
**Do / Avoid.** Do `repo:org/app:environment:production` with environment protection rules. Avoid `repo:org/app:*`.
**Why.** Without it, any branch or PR workflow in the repo can assume the production role.

### Promote the digest, never rebuild
**Rule.** Build the image once per commit and deploy the recorded digest everywhere.
**Apply when.** Any multi-environment pipeline.
**Do / Avoid.** Do pass `needs.build.outputs.digest` to every deploy job. Avoid `docker build` inside deploy jobs or promoting `:staging` → `:prod` tags.
**Why.** A rebuild can pull different dependencies or base layers; what you tested is not what you ship.

## Sources

- GitHub Docs: Secure use reference; Securely using pull_request_target; OpenID Connect; Configuring OIDC in AWS; Artifact attestations; Events that trigger workflows — https://docs.github.com/en/actions/reference/security/secure-use , https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target , https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
- GitHub changelog, 2025-08-15, SHA pinning and blocking policy — https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions/
- CISA alert, tj-actions/changed-files — https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction
- OWASP CI/CD Security Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html
- Microsoft Code-With Engineering Playbook, Continuous Integration, Continuous Delivery, dependency and container scanning — https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/CI-CD
- DORA: 2025 year in review; continuous integration and trunk-based development capabilities — https://dora.dev/insights/dora-2025-year-in-review/ , https://dora.dev/capabilities/continuous-integration/ , https://dora.dev/capabilities/trunk-based-development/
- The Twelve-Factor App, Build/release/run and Admin processes — https://12factor.net/build-release-run , https://12factor.net/admin-processes
- Docker build cache optimization — https://docs.docker.com/build/cache/optimize/
- Node.js Best Practices §8.9 (digests), §8.12 (scan images) — https://github.com/goldbergyoni/nodebestpractices
- Sentry releases — https://docs.sentry.io/product/releases/ ; Honeycomb markers — https://docs.honeycomb.io/configure/environments/manage-markers
