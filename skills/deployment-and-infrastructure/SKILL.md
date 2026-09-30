---
name: deployment-and-infrastructure
description: Use when shipping software to production or changing how it runs — CI/CD pipelines and GitHub Actions workflows, Dockerfiles and container images, build-once promotion by digest, deployment strategies (rolling, blue/green, canary, progressive delivery, feature flags), rollback vs roll-forward, migrations as a pipeline step, infrastructure as code (Terraform, OpenTofu, Pulumi), state and drift, GitOps (Argo CD, Flux), choosing where to run it (PaaS, containers on a VM with Kamal, serverless, managed Kubernetes, edge), Kubernetes probes, resources, and graceful shutdown, cron jobs, background workers, durable workflows (Temporal, Inngest, Restate), release markers, DORA metrics, and infrastructure cost. Also use when the user says "deploy this", "set up CI", "write a Dockerfile", "do we need Kubernetes?", "add a cron job", "deploys cause 502s", or "pin our actions". Not for env config, secrets storage, or local dev setup (use environments-and-config), resilience patterns and SLOs (use reliability), or picking a database or queue (use data-infrastructure).
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "environments-and-config reliability data-infrastructure application-security project-bootstrap dependency-management"
---

# Deployment and Infrastructure

Change is the trigger for most outages — Google's SRE book attributes roughly 70% of outages to changes in a live system — so the way software is built, promoted, and run is itself a product that needs design. This skill builds one immutable artifact, promotes it through environments by digest, releases it progressively with automated health gates and a known rollback, keeps the pipeline itself from becoming the attack path, and picks the simplest runtime that meets the real requirements.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Build once, promote the same digest.** Only config differs between environments; a rebuild per environment is an untested artifact.
2. **Deploy is not release.** Ship code dark, release it by flag or traffic shift, and gate every step on health signals from production.
3. **Every release is rollback-able by construction.** Backward-compatible migrations, config added before code, previous artifacts retained — decided before merging, not during the incident.
4. **Choose the simplest runtime that meets measured needs.** PaaS or managed containers first; Kubernetes when a trigger below is true and someone owns the platform.
5. **The pipeline is production.** It holds the keys to everything: pin dependencies by SHA, grant least privilege, use OIDC instead of stored keys, never run untrusted code with secrets.
6. **Infrastructure changes only through reviewed code.** Consoles are read-only; drift is detected on a schedule.
7. **Anything scheduled or queued runs at least once.** Jobs are idempotent, non-overlapping, time-zone explicit, and monitored for success, not just failure.
8. **Every deploy is observable.** The release version is in every log line, error, and trace, and a deploy marker lands on the dashboards.

## Workflow

- [ ] **Pick the runtime** with the platform table (or confirm the existing one). Check: can you name the trigger that justifies anything beyond PaaS/managed containers?
- [ ] **Container and artifact.** Dockerfile per the rules table; image tagged by git SHA, recorded by digest, scanned, attested.
- [ ] **Pipeline.** Stages with time budgets; PR feedback under ~10 minutes; hardening checklist applied. Check: every third-party action pinned to a full SHA **looked up**, not invented.
- [ ] **Deploy strategy** chosen per service with health gates, a rollback path, and migrations as a separate step.
- [ ] **Infrastructure as code** for every resource, remote state with locking, plan reviewed in the PR, apply from CI only.
- [ ] **Jobs.** Cron and workers per the jobs rules; durable execution only for multi-step, long-running processes.
- [ ] **Observability wiring.** Version everywhere, deploy markers, per-version error rate, smoke test that verifies the deployed version and environment wiring.
- [ ] **Validate** against the Gotchas and the hardening checklist; run linters (Dockerfile, workflow, IaC); fix and repeat.

## Measure delivery: DORA's five metrics

| Group | Metric | Meaning |
|---|---|---|
| Throughput | Change lead time | Commit to running in production |
| Throughput | Deployment frequency | How often production deploys happen |
| Throughput | Failed deployment recovery time | Time to recover from a deploy that failed |
| Instability | Change fail rate | Share of deploys needing immediate intervention |
| Instability | Deployment rework rate | Unplanned deploys made to fix user-facing bugs (added in 2024) |

DORA's 2025 report found AI adoption now correlates with higher throughput but still with more instability. Agents raise change volume, so small batches, fast CI, progressive delivery, and quick rollback matter more, not less. Compute the metrics from deploy events, not surveys, and use them to learn, not as team targets.

## Pipeline stages and time budgets

| # | Stage | Contents | Target |
|---|---|---|---|
| 1 | Setup | Checkout without persisted credentials; toolchain from pinned versions; install from lockfile with cache | < 1 min cached |
| 2 | Static | Format, lint, typecheck, config validation, Dockerfile lint (hadolint), workflow lint, IaC fmt/validate | 1–2 min |
| 3 | Security (parallel) | Secret scan, dependency audit, SAST | parallel |
| 4 | Unit tests | Sharded and parallel | 2–5 min |
| 5 | Build | One image tagged with git SHA, pushed; record **digest**; SBOM and provenance | 2–5 min cached |
| 6 | Image scan | Block critical vulnerabilities before a prod-reachable registry | ~1 min |
| 7 | Integration / e2e | Ephemeral services or preview environment | 5–10 min, parallel |
| 8 | Staging / preview | Same digest; migrations step; smoke tests including "points at the right backends" | — |
| 9 | Production | Progressive rollout with automated analysis; release marker | — |
| 10 | Post-deploy | Verify version, notify, record DORA events | — |

DORA's continuous-integration guidance puts the upper limit for build-and-test feedback at about 10 minutes. Stay there with dependency and layer caching, parallel jobs, affected-only builds in monorepos, `concurrency` groups that cancel superseded PR runs, and a `timeout-minutes` on every job. Slow suites may move to the merge queue or main, never *only* to nightly for critical paths. Day-one CI for a new repo is in `project-bootstrap`.

## Build once, promote by digest

- 12-factor build/release/run: a release is an immutable build plus config with a unique ID.
- Promote `image@sha256:…`, never `:latest` or a re-pushed tag — tags are mutable.
- Promotion carries the environment's config state too (new keys, flag defaults).
- Version identity: git SHA in the OCI label `org.opencontainers.image.revision`, in `APP_VERSION`, at `/version`, and in telemetry.
- Frontend exception: bundlers inline public env at build time. Prefer runtime config (see `environments-and-config`); otherwise build per environment from the same commit.

## CI security checklist (GitHub Actions, as of 2026-09)

1. **Pin every third-party action and reusable workflow to a full commit SHA** with a `# vX.Y.Z` comment; let Dependabot or Renovate bump them. GitHub calls this the only way to use an action as an immutable release. Since 2025-08-15, organization and repository policy can **require SHA pinning** and block specific actions. The tj-actions compromise (March 2025) moved version tags to malicious code; only SHA-pinned workflows were safe.
2. **Never invent a SHA or an image digest.** Look it up (the action's release page or `git ls-remote`; the registry for digests) or leave an explicit `<SHA>` / `<digest>` placeholder and tell the user. A made-up SHA fails at best and points at an attacker's fork commit at worst.
3. **Least-privilege `GITHUB_TOKEN`:** `permissions: {}` at workflow level, grant per job (`contents: read`; `id-token: write` only for deploy or attestation jobs; `packages: write` only for publish). Org default: read-only; Actions may not create or approve PRs.
4. **No untrusted input in `run:`.** Pass `${{ github.event.* }}` values (titles, branch names, bodies) through `env:` and quote them.
5. **`pull_request_target` and `workflow_run` run with secrets and a write token.** Never check out and execute PR code in them. As of 2026-09, `actions/checkout` refuses fork PR head refs under `pull_request_target` unless explicitly overridden, GitHub has a default policy blocking `pull_request_target` in public repos in evaluate mode, **enforced from 2026-11-02** for affected repos, and such runs get read-only cache access.
6. **OIDC to the cloud, no stored keys.** Trust policies match the `sub` claim to a specific environment (`repo:org/app:environment:production`), never `repo:org/app:*` for privileged roles. **Repositories created after 2026-07-15** (or opted in) get immutable subject claims containing owner and repo IDs (`repo:org@<ownerId>/app@<repoId>:…`) — trust policies must match that format.
7. **Environments with protection rules** (required reviewers, branch policies) gate production deploy jobs and their secrets.
8. **Artifact attestations** (Sigstore-based) reach SLSA v1.0 Build Level 2; they only help if something **verifies** them (`gh attestation verify`, an admission controller).
9. **Runners:** GitHub-hosted or ephemeral just-in-time self-hosted runners; self-hosted runners almost never on public repos.
10. **Review CI like code:** CODEOWNERS on `.github/workflows/`; OpenSSF Scorecard and CodeQL flag dangerous workflow patterns; `persist-credentials: false` on checkout unless a later step pushes.
11. **Do not run business-critical jobs on Actions `schedule`:** runs can be delayed or dropped at busy times (the top of the hour) and scheduled workflows in inactive public repos are disabled after 60 days.

Template: `assets/github-actions-ci-cd.yml`. Details and the AWS trust policy: `references/ci-cd.md`.

## Containers

| Rule | Why |
|---|---|
| Multi-stage build; the runtime stage copies only artifacts | No compilers, dev dependencies, or build secrets in the final image |
| Minimal trusted base: slim, distroless, or hardened (Docker Hardened Images have been free under Apache-2.0 since Dec 2025; Chainguard; Google distroless) | Smaller attack surface; near-zero CVE baselines |
| Pin base images by tag **and** digest; automate bumps (Dependabot `docker`); rebuild often | Tags are mutable; you still receive patches as reviewed PRs |
| `.dockerignore` excludes `.git`, `.env*`, `node_modules`, `.aws`, `.npmrc` | Keeps secrets and bulk out of the build context |
| Dependency manifests → install → source, with cache mounts | Fast rebuilds |
| No secrets in `ARG`/`ENV`/layers; use `RUN --mount=type=secret` | Build args and env persist in the image |
| Non-root `USER` with explicit UID; read-only root FS, dropped capabilities, `no-new-privileges` at runtime | Limits container-escape blast radius (OWASP Docker cheat sheet) |
| Exec-form `CMD ["node","server.js"]`, or an init (`tini`, `--init`); not `npm start` | SIGTERM must reach the app |
| Graceful SIGTERM: fail readiness → stop accepting → drain in-flight → stop consumers → flush telemetry → close pools → exit within the grace period (Kubernetes default 30 s) | Deploys without dropped requests |
| `HEALTHCHECK` for Compose/Swarm; probes on Kubernetes (it ignores `HEALTHCHECK`) | Readiness-gated traffic |
| Heap below the memory limit (Node `--max-old-space-size`); one process per container | OOM kills instead of GC; the orchestrator owns restarts and scaling |
| hadolint in CI; scan the final image; SBOM and provenance | Catches mistakes and OS-level CVEs |

Templates: `assets/Dockerfile`, `assets/dockerignore`, `assets/compose.yaml`. Python variant, shutdown code, and runtime hardening: `references/containers.md`.

## Deploy strategies

| Strategy | Default for | Rollback | Watch out |
|---|---|---|---|
| Rolling (`maxUnavailable: 0`) | Stateless services | Another rolling deploy (slow) | N and N+1 serve traffic together |
| Blue/green | Risky releases needing instant switch-back | Flip the router | Shared DB must serve both; 2× capacity; warm-up |
| Canary (1 → 5 → 25 → 100%) | Production services with enough traffic | Shift traffic back | Small samples are noisy; limit versions in parallel |
| Progressive delivery (automated canary: Argo Rollouts, Flagger, cloud traffic splits) | When you have good SLIs | Automatic abort | Safety equals analysis quality |
| Feature flags / dark launch | Decoupling deploy from release | Flip flag (seconds) | Flag debt; test both paths; never reuse a flag |
| Recreate | Dev, or singletons that must not overlap | Redeploy old | Downtime |

**Rollback vs roll-forward.** Default: roll back (previous digest, traffic shift, or flag off) — fastest, no new code under pressure. Roll forward when the release wrote data the old version cannot read, when it is a security fix, or when the fix is trivial and the pipeline is fast. Make rollback possible by construction: expand/contract migrations, N−1-compatible events and APIs, config before code, previous images retained. Flag mechanics, canary analysis, and expand/contract steps live in `reliability`.

**Migrations are a pipeline step**, run once per release as a one-off job before new code gets traffic (12-factor admin process) — not in every replica's startup. If a framework migrates on boot, guard it with an advisory lock. Use a DDL-capable role for migrations and a DML-only role for the app. Test migrations from empty and from the previous release's schema; lint them; set `lock_timeout`. Backfills are throttled jobs, not migrations. Schema-level rules: `data-modeling` and `reliability`.

## Infrastructure as code

- **Tooling (as of 2026-09):** HashiCorp relicensed Terraform from MPL 2.0 to BUSL 1.1 in August 2023; the community fork **OpenTofu** (MPL 2.0) joined the Linux Foundation in September 2023; IBM completed its acquisition of HashiCorp in February 2025. OpenTofu adds client-side state and plan encryption. Choose Terraform or OpenTofu for multi-cloud and SaaS providers (OpenTofu when licensing or open governance matters), Pulumi for real-language IaC, CDK/Bicep for single-cloud shops.
- **Remote state with locking**, encrypted, versioned, access-restricted — state can hold sensitive values. S3 backend: `use_lockfile = true` (native S3 locking; the DynamoDB lock table is deprecated).
- **One state per environment per component**, same modules with different variables; directory separation over workspaces when environments live in different accounts.
- **Plan in the PR, apply the reviewed plan from CI** after merge; separate read-only plan and write apply roles via OIDC.
- **No manual changes.** Scheduled drift detection (`plan -refresh-only -detailed-exitcode`); `prevent_destroy` and deletion protection on stateful resources; pinned provider and module versions with the lock file committed.
- **GitOps** (Argo CD, Flux) when you run Kubernetes across several clusters or environments: CI writes the new digest to an environment repo, the in-cluster controller reconciles, promotion is a PR. Skip it for a single PaaS app.

Details: `references/iac-gitops.md`.

## Choosing where to run it

| Platform | Default for | Avoid when |
|---|---|---|
| PaaS (Render, Railway, Fly.io, Vercel/Netlify for web, App Service) | Startups, small teams, most CRUD SaaS; previews built in | Exotic networking, GPUs, compliance or residency the PaaS does not offer |
| Managed containers (Cloud Run, ECS Fargate, Azure Container Apps) | Containerized services without a platform team | Host-level control, huge long-lived connection counts |
| Containers on VMs (Kamal, Compose on a VM) | Steady, predictable load; cost-sensitive; few services | Spiky global traffic, many teams |
| Serverless functions (Lambda, Cloud Functions, Azure Functions) | Event glue, webhooks, spiky or low-volume APIs | Long-running work, heavy DB connection needs, sustained high load |
| Managed Kubernetes (EKS, GKE, AKS) | Many services and teams with a platform team | A handful of services and no one to own upgrades, networking, and policies |
| Edge functions (Workers, Vercel/Netlify Edge, Deno Deploy) | Auth, redirects, personalization, cached reads near users | Node-only libraries, long CPU, data far from the edge |

**Kubernetes when** at least one holds *and* someone owns the platform: many services across several teams need a common deploy and runtime contract; you need operators, custom scheduling, GPUs, or multi-tenant isolation the managed options lack; portability across clouds or on-prem is a hard requirement; the organization already runs it well. Kelsey Hightower: Kubernetes is a platform for building platforms. 37signals runs its products on its own hardware with Kamal, without Kubernetes.

Kubernetes failure patterns to design against (k8s.af): DNS (`ndots:5` query amplification, CoreDNS OOM), CPU-limit throttling of latency-sensitive services, OOMKills and node pressure from missing requests or limits, all replicas on one node or zone, probe mistakes (liveness checking the database), deploy-time 502s without a `preStop` delay, CronJob storms. Template: `assets/k8s-deployment.yaml`.

Serverless trade-offs: cold starts (smaller bundles, lazy imports, provisioned concurrency or minimum instances); since 2025-08-01 AWS bills Lambda's INIT phase for ZIP-packaged managed runtimes too; connection storms against Postgres (use a pooler or HTTP driver); per-request pricing wins for spiky traffic and loses at sustained high utilization. Heroku: in February 2026 Salesforce announced a move to a "sustaining engineering" model — check its status before choosing it for a new project (as of 2026-09).

Decision questions, VM deploy checklist, and cost basics: `references/platform-decision.md`.

## Jobs and scheduling

- **Cron:** one scheduler, not every replica's in-process cron; the scheduler only **enqueues**; jobs are idempotent; overlap prevented (`concurrencyPolicy: Forbid` — the Kubernetes default is `Allow`); explicit time zone (`.spec.timeZone`); off-the-hour minutes with jitter; process "everything since the last successful watermark", not "the last hour"; dead-man's-switch alert when a job has not **succeeded** by its deadline.
- **Queue workers:** job arguments are IDs plus a version; idempotency key per job; bounded retries with exponential backoff and jitter, then a dead-letter queue with replay; per-queue concurrency limits protect downstreams; separate queues by latency class; alert on the age of the oldest job; drain on SIGTERM. Choosing the queue technology is `data-infrastructure`.
- **Durable execution** (Temporal, Inngest, Restate, and similar) when a process has multiple steps with compensations (a saga), waits hours to weeks for humans or external events, fans out and in, or is an agent loop that must resume. The engine persists each step and replays after crashes; workflow code must be deterministic and every side-effecting step idempotent. Single fire-and-forget tasks stay on a plain queue.

Details, a safe CronJob, and the decision table: `references/jobs-and-scheduling.md`. Saga design: `scalability`.

## Release markers and observability wiring

- The same version string (git SHA) in the image label, `APP_VERSION`, the OpenTelemetry `service.version` resource attribute, the error tracker's `release`, and log fields; tag telemetry with the deployment environment.
- Upload source maps and debug symbols to the error tracker at build time; do not serve source maps publicly.
- Deploy markers on dashboards for deploys, config changes, and flag flips — they are all changes.
- Dashboards and alerts sliced by version; canary analysis compares new against baseline on errors, latency, saturation, and a business KPI.
- A smoke test after every deploy checks `/version` and that production is not wired to a staging dependency.
- Emit deploy start, finish, and rollback events to compute the DORA metrics.

## Cost basics

- Tag everything with `env`, `service`, `owner`, `cost-center`; budgets and anomaly alerts per account.
- Silent drivers: egress, cross-AZ transfer, NAT gateway processing, idle non-prod environments and previews, orphaned volumes and load balancers, log volume and high-cardinality metrics.
- Non-prod scales to zero or shuts down off-hours; previews have a TTL.
- Kubernetes: requests drive node count — right-size them from observed usage.
- Owned hardware can win for steady, large workloads: 37signals moved compute off AWS in 2023 and left S3 in 2025 (about 18 PB), expecting roughly $1.3M a year in storage savings; AWS waived about $250k in egress fees for the move. Evidence that egress is a lock-in lever — not a default for startups, whose largest cost is people.

## Cases

| Case | What happened | Rule |
|---|---|---|
| Knight Capital, 2012 | A manual deploy missed one of eight servers; a repurposed flag activated dead code there; over $460M lost in about 45 minutes | Automated deploys verified for fleet-wide version consistency; never reuse a flag; delete dead code |
| tj-actions, Mar 2025 | Version tags of a popular action were moved to code that printed CI secrets into logs | Pin actions by full SHA; least-privilege tokens; short-lived credentials |
| CircleCI, Apr 2025 | An out-of-band WAF change outside Terraform blocked legitimate traffic; responders could not find it in IaC | Read-only consoles; IaC-only changes; drift detection |
| CircleCI, Nov 2021 | A deploy changed a field's type; rolling back made rows written in between unreadable, so rollback did not restore service | Decide rollback safety before shipping; expand/contract |
| GitLab, 2017 | An engineer deleted the primary DB directory; several backup mechanisms turned out not to be working | Restore-tested backups before destructive changes; verify the target host |
| Cloudflare, Dec 2025 | A killswitch pushed through a global, non-gradual config path hit an untested code path → 500s | Config and emergency levers get staged rollout; test the off path |
| Zalando (k8s.af) | CoreDNS OOMKilled under `ndots:5` query amplification plus retries → total DNS outage | Set `ndots`, cache DNS, size CoreDNS, cap retries |

## Gotchas

- **Inventing action SHAs or image digests.** Look them up or leave `<SHA>`/`<digest>` placeholders and say so.
- **Unpinned `@v4` actions, `:latest` images, `permissions: write-all`**, or no `permissions` block at all.
- **`pull_request_target` to give fork PRs secrets**, or `${{ github.event.pull_request.title }}` inline in `run:`.
- **AWS access keys stored as repository secrets.** Use OIDC with environment-scoped trust.
- **Rebuilding the image per environment** or promoting by tag.
- **Running migrations on startup in every replica**, or shipping a breaking schema change with the code in one deploy.
- **Container as root, `npm start` as CMD, no SIGTERM handling, no `preStop` delay** → dropped requests on every deploy.
- **Liveness probe that checks the database** — a DB blip restarts the whole fleet.
- **CPU limits on latency-sensitive services without watching throttling**, or no memory request at all.
- **Proposing Kubernetes, Helm, and a service mesh for a small app.** Apply the platform table and name the trigger.
- **Cron inside the web process** — every replica runs it.
- **Retrying non-idempotent side effects** (charges, emails) in jobs or workflows without idempotency keys.
- **Fixing production in the console.** Change the IaC; the next apply will undo your fix anyway.
- **Treating "the deploy succeeded" as done.** Done means the new version is healthy under real traffic and visible by version in telemetry.

## Output format

For pipeline, container, or infra work, deliver the files plus:

```
Deploy plan
- Runtime: <platform> — trigger/justification: <why not simpler>
- Artifact: <registry/image>, tagged <git SHA>, promoted by digest; scans + attestation: <yes/no>
- Pipeline: <stages> — PR feedback target <min>; actions pinned by SHA (placeholders left: <list>)
- Strategy: <rolling/canary/blue-green/flag> — health gates: <signals, thresholds>
- Rollback: <how, how fast>; migrations: <expand/contract step, separate job>
- Infra: <IaC tool>, state <backend + locking>, drift check <schedule>
- Jobs: <scheduler/queue/durable engine>, idempotency: <keys>
- Observability: version in logs/errors/traces; deploy markers; smoke test
- Not verified: <e.g., SHAs/digests to fill, cloud trust policy to apply>
```

## References

| File | Read when |
|---|---|
| `references/ci-cd.md` | designing or reviewing a pipeline, GitHub Actions hardening and OIDC trust policies, build-once promotion, migrations in the pipeline, DORA measurement, or release/observability wiring |
| `references/containers.md` | writing or reviewing a Dockerfile (Node or Python), choosing a base image, implementing graceful shutdown, or hardening container runtime settings |
| `references/platform-decision.md` | choosing or questioning the runtime (PaaS, Kamal/VMs, serverless, Kubernetes, edge), configuring Kubernetes resources/probes/DNS, or estimating infrastructure cost |
| `references/iac-gitops.md` | setting up Terraform/OpenTofu/Pulumi, state and locking, module layout, plan review, drift detection, or GitOps with Argo CD/Flux |
| `references/jobs-and-scheduling.md` | adding cron jobs, background workers, or long-running workflows, or deciding between a queue and durable execution |
| `assets/github-actions-ci-cd.yml` | starting a CI/CD workflow with OIDC, build-once, attestations, and environment-gated deploys |
| `assets/Dockerfile`, `assets/dockerignore` | starting a production container image |
| `assets/compose.yaml` | running backing services locally or in CI integration tests |
| `assets/k8s-deployment.yaml` | deploying a stateless service to Kubernetes with probes, `preStop`, resources, spread, and a PDB |

## Related skills

- `environments-and-config` — config schema, secrets storage and rotation, per-environment isolation, local dev.
- `reliability` — flags, canary analysis, expand/contract migrations, SLOs, incidents, backups.
- `data-infrastructure` — choosing the database, cache, queue, or durable-execution engine.
- `application-security` — secure defaults beyond the pipeline.
- `project-bootstrap` — day-one CI, first deploy, and repo standards.
- `dependency-management` — lockfiles, cooldowns, install-script risk, and supply-chain defenses.
