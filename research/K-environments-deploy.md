# K. Environments, Configuration, Secrets, Deployment, CI/CD, Containers, IaC & Orchestration — Research Notes (as of 2026-09)

Purpose: raw material for Agent Skills that teach coding agents to (A) handle environments, config and secrets correctly and (B) build, ship and run software safely (CI/CD, containers, IaC, runtime platforms, job/workflow orchestration).
Builds on `E-architecture.md` (§3.12 12-factor summary, §4.6 queues, §4.7 idempotency, §4.14 flags/progressive delivery, §4.15 expand/contract, §4.17 cost). This file goes deeper and does not repeat those.

Conventions: every claim has a source. **[UNVERIFIED]** = from memory or from a low-authority secondary source; verify before putting a number/API name in a skill. **[OPINION]** = synthesis/judgment, fine for a skill if phrased as guidance. Local clones referenced as `refs7/<repo>/…` (in scratchpad) with their upstream URL.

---

## 0. Key takeaways (for skill authors)

1. **Separate four kinds of "settings"**: code-level wiring (in code), deploy config (env/files per deploy), secrets (secret manager / workload identity), feature flags (runtime flag service). Agents conflate them constantly.
2. **Validate config at startup, typed, fail fast**, in one module; nothing else reads `process.env`/`os.environ` directly.
3. **Prefer no secret at all** (workload identity, OIDC federation, managed identity) > short-lived dynamic secret > secret manager reference > CI secret store > long-lived env var. OWASP explicitly says env vars for secrets are "not recommended unless the other methods are not possible".
4. **Build once, promote the same immutable artifact (by digest) through every environment**; only config differs.
5. **Staging cannot prove production safety**; use progressive delivery + observability in prod, and keep staging for integration/smoke/migrations rehearsal.
6. **Supply chain is the 2025–26 frontline**: tj-actions (Mar 2025), Shai-Hulud npm worm (Sep & Nov 2025). Pin actions by full SHA, least-privilege `GITHUB_TOKEN`, no `pull_request_target` + untrusted checkout, OIDC instead of cloud keys, scan secrets.
7. **Default to the simplest runtime that meets requirements** (PaaS / managed containers / a VM with Kamal or Compose) — Kubernetes only with a platform team or a concrete need.
8. **Config changes cause outages as often as code**: roll them out progressively too (Cloudflare Nov/Dec 2025, many entries in Dan Luu's config-errors list).
9. **Anything scheduled or queued runs at-least-once**: idempotent jobs, overlap protection, explicit time zones.
10. **Every deploy must be observable**: release version in logs/errors/traces, deploy markers, per-version error rates driving automated rollback.

---

# PART A — ENVIRONMENTS, CONFIGURATION & SECRETS

## A1. Taxonomy: what kind of setting is this?

| Kind | Examples | Varies per deploy? | Changes at runtime? | Where it lives | Who can read |
|---|---|---|---|---|---|
| Code wiring / internal config | routes, DI wiring, retry policy defaults, schema | No | No (needs deploy) | Code (reviewed) | Anyone with repo access |
| Deploy config (non-secret) | `DATABASE_HOST`, `LOG_LEVEL`, public base URL, region, pool size, OTel endpoint | Yes | Usually restart | Env vars / mounted config file / platform config, generated from IaC | Operators, the app |
| Secrets | DB password, API keys, signing keys, OAuth client secret, webhook secret | Yes (must differ per env) | Rotated (ideally hot reload) | Secret manager, or eliminated via workload identity | Only the workload + break-glass |
| Feature flags | release toggles, kill switches, experiments, entitlements | Per env *and* per user/segment | Yes, seconds | Flag service (OpenFeature provider) | Product/eng; evaluated server-side for security |
| Build-time public config | `NEXT_PUBLIC_*`, `VITE_*`, mobile app config | Baked into bundle | No | Build env; **ends up public** | Everyone (shipped to browsers) |

Sources: 12-factor config definition incl. the exclusion of "internal application config" (`refs5/heroku_12factor/content/en/config.md`, https://12factor.net/config); flag types in E-architecture §4.14; t3-env server/client split (https://env.t3.gg/docs/introduction).

Rules [OPINION, grounded in the above]:
- Litmus test from 12-factor: "whether the codebase could be made open source at any moment, without compromising any credentials" (https://12factor.net/config). Microsoft's playbook: "assume any repo we work on may go public at any time" (`refs7/microsoft_code-with-engineering-playbook/docs/CI-CD/dev-sec-ops/secrets-management/README.md`).
- Anything with a client prefix (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`, `EXPO_PUBLIC_`) is **public**. Never put a secret there. t3-env enforces the prefix at type level and runtime (https://env.t3.gg/docs/core).
- Do not use flags as a secret store or config as a flag system (flags need per-request targeting, audit and fast change; config needs validation and review).
- Don't key behavior on "environment name" (`if env == "staging"`). 12-factor: env vars are "granular controls, each fully orthogonal", "never grouped together as environments" because grouping causes a "combinatorial explosion" (`joes-staging`) (https://12factor.net/config). Use specific settings (`EMAIL_TRANSPORT=smtp|log`, `PAYMENTS_MODE=sandbox|live`). An `APP_ENV` label for telemetry is fine; branching on it is the smell.
- `NODE_ENV=production` is a *runtime-optimization* flag for frameworks (nodebestpractices 5.15, `refs7/goldbergyoni_nodebestpractices/sections/production/setnodeenv.md`) — not your deployment-environment name. Staging should run with `NODE_ENV=production`.

## A2. The Twelve-Factor App in 2024–26: what still holds, what is being revised

Timeline (sources: `refs5/heroku_12factor/blog/*.md`, https://12factor.net/blog):
- 2011: Heroku (Adam Wiggins) publishes the manifesto.
- 2024-11-12: "Twelve-Factor App Methodology is now Open Source" (Yehuda Katz) — community repo https://github.com/twelve-factor/twelve-factor, announced at KubeCon NA 2024.
- 2024-12 update lists proposals: **new factor for Workload Identity** (issue #9), **Config factor to allow mounted volumes** (issue #4), **Logs factor expanded to telemetry** (issue #3) (https://12factor.net/blog/december-monthly-updates).
- 2025-02 "Evolving Twelve-Factor" (Brian Hammons): OpenTelemetry integration, security & identity factor proposal, "platform provides infrastructure abstraction, security controls, deployment automation and observability by default".
- "Narrow Conduits" post (Vish Abrams, 2024-11): container orchestration YAML "is actually the wrong interface" between app devs and platform; the contract should be how platform info (reachability, identity, config) gets into app code.
- Repo state (cloned, last commit 2025-07-09, `refs7/twelve-factor_new/content/config.md`): config factor restructured into principles ("strictly separates config from code", "stores config in environment variables", "treats env vars as granular controls, never grouped by environment") + examples. UPDATE_FAQ: "separating the principles from the examples", focus first on "stateless request-based apps".

What an agent should take from this [OPINION]:
- Still holds: config/code separation; one codebase many deploys; build/release/run separation (release = build + config, immutable, uniquely IDed); disposability (fast start, graceful SIGTERM); stateless processes; backing services as attached resources; logs as event streams; admin tasks as one-off processes in the same release; dev/prod parity.
- Being modernized: (1) **secrets via env vars** → prefer identity-based access and mounted files; (2) **config via files mounted by the platform** is acceptable (ConfigMaps/Secrets volumes); (3) **logs → telemetry** (OTel traces/metrics/logs); (4) **identity** as a first-class factor.
- OWASP Secrets Management Cheat Sheet §5.1: env vars "are generally accessible to all processes and may be included in logs or system dumps. Using environment variables is therefore not recommended unless the other methods are not possible" (`refs7/OWASP_CheatSheetSeries/cheatsheets/Secrets_Management_Cheat_Sheet.md`, https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html). Realistic middle ground: env vars for secrets are common on PaaS; mitigate by never logging env, not passing env to child processes unnecessarily, redacting crash dumps, and moving high-value secrets to identity or a manager.

## A3. Typed configuration validated at startup (fail fast)

Principle: parse, don't read. One module builds an immutable, typed config object at process start; if anything is missing/invalid, **crash immediately with a clear message listing every bad key** (without printing values). Rationale (Microsoft playbook "Configuration Validation"): "we can avoid running the application just to find it fails… saves time on having to deploy & run, wait and then realize something is wrong" (`refs7/microsoft_code-with-engineering-playbook/docs/CI-CD/continuous-integration.md`). Config file validation via JSON Schema is recommended there too.

Crash-at-start matters for deploy safety: in a rolling/canary deploy, a pod that fails readiness never receives traffic, so the rollout halts instead of serving errors. [OPINION; mechanism per Kubernetes readiness semantics]

### Library notes
- **t3-env** (TS; https://env.t3.gg, `refs7/t3-oss_t3-env/docs`): `createEnv({ server, client, clientPrefix, runtimeEnv, emptyStringAsUndefined, skipValidation, onValidationError })`. Supports any Standard Schema validator (Zod, Valibot, ArkType…). Server vars accessed on the client throw a descriptive error (Proxy). Next.js: `runtimeEnv` must list keys explicitly because Next only bundles explicitly accessed `process.env.X`; for Next ≥13.4.4 `experimental__runtimeEnv` needs only client vars. Recommended: import the env file in `next.config.ts` to **validate at build time**. Warning in docs: defining client and server schemas in one file ships the *schema* (variable names) to the client — split into `env/server.ts` / `env/client.ts` if names are sensitive. Recipe warning: "Zod's default primitives coercion should not be used for booleans, since every string gets coerced to true"; use `z.stringbool()` (Zod v4) or explicit transform. `emptyStringAsUndefined: true` so `FOO=` in `.env` counts as missing.
- **Plain Zod**: t3-env docs list drawbacks of the naïve `z.object(...).parse(process.env)` + global type augmentation: transforms/defaults make types lie because `process.env` isn't mutated; framework tree-shaking of env; client-side validation failures. Solution: export the parsed object, never use raw `process.env` elsewhere.
- **envalid** (Node; https://github.com/af/envalid): `cleanEnv(process.env, { PORT: port({ default: 3000 }), DATABASE_URL: url(), NODE_ENV: str({ choices: [...] }) })` returns an immutable object; by default logs and **exits** (Node) on missing/invalid vars. Has `devDefault` for dev-only defaults [UNVERIFIED — check README before citing].
- **pydantic-settings** (Python; https://docs.pydantic.dev/latest/concepts/pydantic_settings/): `class Settings(BaseSettings)` with `model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", secrets_dir="/run/secrets")`; `SecretStr` hides values in repr/logs; validation errors raise at instantiation (instantiate at import/startup). Note: `extra='forbid'` does not check every name in `os.environ` (per search summary of docs) [UNVERIFIED detail].
- Others to mention [UNVERIFIED names — verify]: Go `github.com/caarlos0/env`, `kelseyhightower/envconfig`; Rust `envy`/`figment`; Java/Spring `@ConfigurationProperties` + `@Validated`; .NET Options pattern with `ValidateOnStart()`.

### Rules for skills
1. One config module; the rest of the code imports typed values. Lint rule / grep check: no `process.env.` outside `env.ts` (ESLint `n/no-process-env` exists [UNVERIFIED]).
2. Required in all envs unless there is a *safe* default. **Never give secrets or security-relevant settings a default** (e.g., `JWT_SECRET ?? "dev-secret"` ships to prod). Defaults are fine for `PORT`, `LOG_LEVEL`.
3. Parse types: ints with bounds, URLs, enums (`LOG_LEVEL`), durations with units, booleans via explicit string set, comma lists → arrays.
4. Cross-field validation: e.g. `PAYMENTS_MODE=live` requires `STRIPE_KEY` starting `sk_live_`; production must not point at a sandbox host (playbook: smoke test should "verify that your application is pointing to the correct configuration (e.g. production pointing to a UAT Database)", `refs7/.../CI-CD/continuous-delivery.md`).
5. Error message: list each invalid key + reason; never echo values.
6. Validate in CI too (build-time validation for frontend public vars; a `config:check` script against each env's non-secret config).
7. Commit a **`.env.example`** with every key, comments, and fake values; keep it in sync (CI check that schema keys == `.env.example` keys [OPINION]). `.env`, `.env.local`, `.env.*.local` in `.gitignore` and `.dockerignore`.
8. Log a **config fingerprint** at startup (names + non-secret values + hash of secrets), plus release version — speeds up "which config is prod actually running?" [OPINION].

## A4. Environment matrix — what differs and what must not

Typical environments: **local** (developer machine), **CI** (ephemeral test env), **preview** (per-PR, ephemeral), **dev/integration** (shared, optional), **staging/pre-prod** (prod-like), **production** (possibly multiple regions/cells). Microsoft playbook "Criteria for a Production-Like Environment": same OS, same software, sized/configured the same, mirrors networking topology, load tests after release (`refs7/.../CI-CD/continuous-delivery.md`).

| Dimension | Local | CI | Preview (per PR) | Staging | Production |
|---|---|---|---|---|---|
| Artifact | built locally / hot reload | built once per commit | **same image** as would ship | **same digest** as prod will get | **same digest** |
| Data | seed/fixtures | fixtures, fresh DB per run | seed or **anonymized** branch | anonymized/synthetic, prod-sized for perf tests | real |
| Secrets | dev-only keys, sandbox accounts | none or OIDC test role | preview-scoped, low value | staging-only, never prod | prod only, identity-based |
| Cloud account/project | none or sandbox | CI account | nonprod account | nonprod (or separate staging) account | **separate prod account** |
| External integrations | fakes/sandboxes (Stripe test mode, mail catcher) | fakes | sandboxes | sandboxes / partner test envs | live |
| Email/SMS/push | captured (Mailpit etc.) | captured | captured or allowlist | allowlist only | live |
| Feature flags | all on/overrides | both paths tested | per-PR overrides | mirror prod targeting | real targeting |
| Scale | 1 | 1 | minimal, scale-to-zero | small but same topology (≥2 replicas, same LB/ingress type) | real |
| Observability | local logs | test reports | same SDK, env tag `preview` | full, separate env tag | full, alerts page humans |
| Access | dev | pipeline | PR author, reviewers | eng, read-mostly | break-glass, audited |
| Lifetime | — | minutes | until PR closes (+TTL) | permanent | permanent |

**Must NOT differ** (drift here produces "works in staging" bugs) [OPINION, grounded in 12-factor dev/prod parity + playbook criteria]:
- The build artifact (digest), language runtime version, OS/base image, CPU architecture (or test both if multi-arch).
- Backing service *type and major version* (Postgres 17 everywhere, not SQLite locally — 12-factor: "resist the urge to use different backing services between development and production" (https://12factor.net/dev-prod-parity)).
- DB schema & migration tooling; the migration is applied the same way (pipeline step), not by hand.
- Config **schema** (same keys; only values differ).
- IaC modules (same modules, different variables), network topology type (private DB, TLS termination point, proxies).
- Time zone of servers (UTC) and locale defaults.

12-factor dev/prod parity: three gaps — **time** (deploy hours not weeks), **personnel** (authors deploy and watch), **tools** (same stack) (https://12factor.net/dev-prod-parity).

## A5. Secrets management

### A5.1 Hierarchy of preference [OPINION, grounded in OWASP + GitHub + playbook]
1. **No secret: workload identity** — cloud IAM roles for compute (AWS IAM roles for tasks/pods, GCP Workload Identity, Azure Managed Identity). Playbook: managed identities "are not required on developers machines or checked into source control, and they don't need to be rotated… the recommended choice" (`refs7/.../secrets-management/secrets_rotation.md`). CI → cloud via **OIDC federation** (A6).
2. **Dynamic, short-lived secrets** generated per consumer (Vault/OpenBao database secrets engine etc.). OWASP §3.5 "Rotation vs Dynamic Creation": a dynamic secret "is invalidated when the consumer no longer lives".
3. **Secret manager reference** (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, Vault/OpenBao, Doppler, Infisical, 1Password Secrets Automation) — fetched at startup or mounted by platform/operator.
4. **CI/CD platform secrets** (GitHub/GitLab secrets) — OWASP §3.2.1: no "big secret" there (short-lived, small blast radius), know who can view, log/alert on extraction, rotate, "forking should not leak", document.
5. **Plain env var injected by the platform** — acceptable baseline on PaaS; lowest tier.
Never: in git (even private), in Docker `ARG`/`ENV`, in image layers, in client bundles, in logs/URLs/error messages, in Terraform state unencrypted (state stores values in plaintext [UNVERIFIED wording; widely documented]).

### A5.2 Injection methods (OWASP §5.1)
- **Mounted files** (tmpfs/volume mounted by orchestrator; never baked into image) — supports hot rotation if the app re-reads.
- **Fetch from secret store in-memory** (SDK or sidecar/agent).
- **Env vars** — easy, but leak via `/proc`, crash dumps, child processes, debug endpoints; and **don't update on rotation** (K8s `secretKeyRef` env vars need a pod restart; mounted secrets update in place; tools like Stakater Reloader trigger restarts) (`refs7/.../gitops/secret-management/secret-rotation-in-pods.md`).
- Kubernetes: prefer External Secrets Operator or Secrets Store CSI driver referencing an external vault over committing encrypted secrets; playbook TLDR: "Referencing secrets in an external key vault is the recommended approach. It is easier to orchestrate secret rotation and more scalable". If you must keep secrets in git (GitOps, disconnected): SOPS (KMS/age-encrypted values, Flux native support) or Bitnami Sealed Secrets (cluster-held key; doesn't scale multi-cluster) (`refs7/.../gitops/secret-management/README.md`).

### A5.3 Lifecycle & rotation
- OWASP lifecycle: creation → rotation → revocation → expiration; secrets should expire where possible; "User credentials are excluded from regular rotation" per NIST (rotate on compromise only).
- **Zero-downtime rotation = two valid credentials overlap** ("Blue/Green secret rotation": start instances with the new secret before revoking the old — playbook `secrets_rotation.md`). Pattern: (1) create secret v2 (both valid); (2) roll consumers to v2; (3) verify no v1 use (audit logs); (4) revoke v1. Providers with two key slots (Azure storage keys, many API providers) support this natively. Apps should accept *both* current and previous signing keys for verification (JWT `kid`, webhook secrets) [OPINION].
- Real incident: **Cloudflare R2, 2025-03-21** — during credential rotation the team "accidentally deployed new storage credentials to the default environment instead of production by omitting the `--env production` flag", then removed old credentials → R2 gateway auth failures (Dan Luu post-mortems list → https://blog.cloudflare.com/cloudflare-incident-march-21-2025/). Lessons: env targeting must be explicit & required (no implicit default env in tooling), verify the new credential is *in use* before revoking the old.

### A5.4 Detection & prevention
- Layered scanning: **pre-commit** (gitleaks — fast, blocks before history) → **CI** (TruffleHog with verification of live credentials, `--results=verified`) → **platform** (GitHub secret scanning + push protection; partner auto-revocation) (secondary sources: https://appsecsanta.com/secret-scanning-tools/gitleaks-vs-trufflehog [low-authority; figures like "150+ vs 800+ detectors" UNVERIFIED]). Playbook: scanning "should be run as part of a developer's workflow (e.g. via a git pre-commit hook), however, to protect against developer error, credential scanning must also be enforced as part of the continuous integration process" (`credential_scanning.md`); also scan full history once; avoid `git add .`. Other tools: detect-secrets (Yelp), git-secrets (AWS Labs).
- `.dockerignore` must exclude `.env`, `.aws`, `.npmrc`, `.git` (nodebestpractices 8.4).
- GitHub Actions: "Never use structured data as a secret" (JSON blobs break redaction); register derived values with `::add-mask::`; redaction is not guaranteed — rotate if a secret hits logs (GitHub docs Secure use reference, `refs7/github_docs/content/actions/reference/security/secure-use.md`, https://docs.github.com/en/actions/reference/security/secure-use).

### A5.5 Leaked-secret runbook (OWASP §9.2 + playbook)
1. **Revoke/rotate first** — assume compromised the moment it was pushed (even to a feature branch; it is in history and possibly mirrored/forked). Playbook: "If a key or secret made it into the code base, rotate the key/secret".
2. Check access logs for use of the leaked credential during the exposure window.
3. Remove from code & history if needed (history rewrite breaks links/forks — OWASP notes consequences) and from logs/CI logs (delete run logs).
4. Record who had access, when used, when last rotated (OWASP §9.2 logging).
5. Add a detector rule/pre-commit hook so it doesn't recur.

### A5.6 2025 supply-chain incidents relevant to secrets (why CI secrets must be short-lived)
- **tj-actions/changed-files (CVE-2025-30066, 2025-03-14)**: attacker used a compromised bot PAT to **move existing version tags** to malicious code that dumped Runner.Worker memory and printed secrets to logs; ~23,000 repos used the action; only workflows pinned to full commit SHAs were unaffected (CISA alert https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction; Wiz https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066).
- **Shai-Hulud npm worm (2025-09-15; "2.0" 2025-11-21..23)**: malicious package versions with install scripts harvested developer & CI secrets (npm tokens, GitHub PATs, AWS/GCP/Azure creds) — used TruffleHog itself to find them — exfiltrated to public GitHub repos and self-propagated by publishing with stolen npm tokens; v2 compromised 700+ packages and created 25k+ repos (Wiz https://www.wiz.io/blog/shai-hulud-npm-supply-chain-attack, https://www.wiz.io/blog/shai-hulud-2-0-ongoing-supply-chain-attack; Unit 42 https://unit42.paloaltonetworks.com/npm-supply-chain-attack/). Lessons: no long-lived publish/cloud tokens on dev machines or CI; npm trusted publishing/OIDC [UNVERIFIED feature name]; lockfiles + `npm ci`; consider disabling install scripts in CI (`--ignore-scripts`) where feasible [OPINION]; dependency cooldown before adopting fresh versions [OPINION].

## A6. OIDC federation from CI to cloud (no long-lived keys)

Mechanism (GitHub docs "OpenID Connect", `refs7/github_docs/content/actions/concepts/security/openid-connect.md`): configure trust in the cloud for specific workflows → each job can request a JWT from GitHub's OIDC provider (claims: `sub`, `aud`, `repository`, `ref`, `environment`, `sha`, `job_workflow_ref`…) → cloud validates claims → issues **short-lived credentials valid only for the job**. Benefits listed: no cloud secrets, granular authZ in the cloud, automatic expiry.

AWS specifics (`refs7/github_docs/.../oidc-in-aws.md`, https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws):
- Provider URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com` for `aws-actions/configure-aws-credentials`.
- IAM recommends always evaluating `token.actions.githubusercontent.com:sub` in the trust policy. **Scope to an environment** for deploy roles: `repo:ORG/REPO:environment:prod` — then only jobs that declare `environment: prod` (which can require reviewers/branch policies) can assume the prod role.
- Avoid `StringLike` `repo:org/repo:*` for privileged roles (any branch/PR could assume it) [OPINION; docs show it as a permissive example].
- **New (as of 2026-07)**: "For repositories created after July 15, 2026, or that have opted in to immutable subject claims, the `sub` claim includes immutable owner and repository IDs" e.g. `repo:octo-org@123456/octo-repo@456789:ref:refs/heads/main` — trust policies must match the format (protects against repo rename/re-registration hijack) (same doc).
- Workflow needs `permissions: id-token: write` (+ `contents: read` for checkout).
- Equivalent guides exist for Azure, GCP (Workload Identity Federation), HashiCorp Vault, PyPI, JFrog, Octopus (same docs folder).

## A7. Isolation: separate accounts/projects per environment

- AWS whitepaper "Organizing Your AWS Environment Using Multiple Accounts": separate production from non-production workloads; "assign a single or small set of related workloads to each production account"; OU structure with workload-oriented OUs containing Prod and NonProd (https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html; https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/design-principles-for-your-multi-account-strategy.html; nonprod OU https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/ou-structure-for-non-production-environments.html). Example naming `widget-prod`, `widget-nonprod`.
- Why [OPINION]: account = hard blast-radius, IAM, quota and billing boundary; a staging bug/script with staging creds physically cannot touch prod data; cost attribution per env is free.
- GCP equivalent: separate projects per env under folders; Azure: separate subscriptions/management groups [UNVERIFIED as official wording; standard practice].
- Developers: read-only in prod consoles; changes via IaC pipeline (playbook "Developer Read-Only Access to Cloud Resources", "Azure Portal should provide a read-only view", `continuous-integration.md`). CircleCI incident 2025-04-04: "An IAM-role gap permitted out-of-band changes to AWS WAF outside of CircleCI's Terraform pipeline; an operator performing what they believed were read-only investigation actions modified WAF" → blocked legitimate traffic (https://discuss.circleci.com/t/post-incident-report-april-4-2025-circleci-ui-loading-build-triggering-issues/53208, via Dan Luu list).

## A8. Preview / ephemeral environments (per PR)

What: every PR gets a full-stack deploy with its own URL (Vercel, Netlify, Render, Fly, Railway, Heroku Review Apps, or DIY on k8s namespaces) and ideally its **own database branch**.
- Neon: copy-on-write branches make "a database for every preview" cheap; Vercel integration creates a branch per preview deployment (e.g. `preview-pr-142`) and injects `DATABASE_URL` (https://neon.com/branching/branch-per-preview, https://neon.com/docs/guides/vercel-managed-integration). Caveat: a branch of prod **contains prod PII** → use **anonymized branches** (Neon applies PostgreSQL Anonymizer static-masking rules at branch creation) (https://neon.com/docs/workflows/data-anonymization) or branch from a seeded/anonymized parent, never raw prod.
- Checklist [OPINION]:
  - Deterministic URL per PR; post it on the PR.
  - Isolated data (branch/schema/namespace), run migrations on it — previews double as migration tests.
  - Secrets: preview-scoped, low-value, sandbox integrations only. Fork PRs don't receive secrets on GitHub (`pull_request` from forks is read-only, no secrets — GitHub docs compromised-runners) → previews for fork PRs need a maintainer-approved path, never `pull_request_target` + checkout of fork code (see B4).
  - Third-party callbacks: OAuth redirect URIs, webhooks, CORS origins need wildcard/proxy strategy; don't widen prod OAuth apps to `*.vercel.app` [OPINION].
  - Seed data + test accounts created automatically.
  - Access control (previews are often public URLs; protect with platform auth/password) — search engines indexing previews: add `noindex` [OPINION].
  - **TTL + teardown on PR close**, and a janitor for orphans (idle envs are a top cost leak — E §4.17).
  - Same observability SDK, tagged `environment=preview`, `pr=<n>`; sampling low.

## A9. Staging: what it is for, and its limits

- Charity Majors (Honeycomb): "Testing in production is a superpower. It's our inability to acknowledge that we're doing it, and then invest in the tooling and training to do it safely, that's killing us" (Increment; quoted via https://thenewstack.io/honeycombs-charity-majors-go-ahead-test-in-production/). Staging catches "known-unknowns"; distributed systems are "hostile to being cloned"; mirroring prod in staging is "a fool's errand" (https://www.honeycomb.io/blog/i-test-in-prod, https://www.honeycomb.io/blog/yes-i-test-in-production-and-so-do-you) [quotes via secondary summaries — verify exact wording before quoting].
- What staging is still good for [OPINION]: integration with real (sandbox) third parties, migration rehearsal on prod-sized anonymized data, load/capacity tests, smoke tests of the exact artifact, config validation for new keys, UAT/demo sign-off (playbook "The First Deployment… production-like environment (UAT)"), and infra changes (IaC plan/apply rehearsal).
- Staging pitfalls: drift (manual changes, different sizes/versions), stale data, shared & always broken (queue of teams), false confidence, secrets reused from prod, staging calling prod services. Mitigations: IaC-only changes, same modules, auto-reset data, short-lived previews for feature testing, staging treated as a pipeline stage not a place.
- Safe testing in prod toolkit: feature flags & dark launches; canaries with automated analysis; synthetic monitoring; test tenants/accounts flagged in data; shadow traffic; kill switches (E §4.14; Google SRE Workbook "Canarying Releases" https://sre.google/workbook/canarying-releases/ [known source, not re-read here]).

## A10. Seed, fixture & anonymized data

- Fixtures (tests): small, deterministic, checked into repo (playbook: "Any mocked dataset(s) used for unit and end-to-end integration tests should be checked into the mainline repository", `continuous-integration.md`). Build with factories, not prod dumps.
- Seeds (local/preview): idempotent seed script (`upsert`), realistic volumes for UI (pagination), includes edge cases (unicode names, long strings, RTL, time zones, empty states), known test logins documented in README.
- **Never copy raw prod PII to lower envs** (GDPR/CCPA; lower envs have weaker access control). Options: synthetic generation; static masking (PostgreSQL Anonymizer: faking, partial masking, noise, generalization, pseudonymization — https://postgresql-anonymizer.readthedocs.io [UNVERIFIED URL] / Neon docs above); subsetting with referential integrity; tokenization. Masking must be deterministic where joins/uniqueness matter (pseudonymize emails consistently).
- Keep masking rules in code, reviewed; fail the pipeline if a new PII column lacks a rule [OPINION].

## A11. Local development: one command to a working app

Goals (playbook CI doc "Automated Local Environment Setup", "Document Local Setup", "A single command should have the capability of building the system", "No IDE Dependencies"): new dev from clone to running app + tests in one documented command; same toolchain versions as CI.

Building blocks:
- **Docker Compose for backing services** (DB, cache, queue, mail catcher, S3-compatible store). Use `depends_on: condition: service_healthy` + `healthcheck` — Compose otherwise only waits for containers to be *running*, not *ready* (https://docs.docker.com/compose/how-tos/startup-order/). Use override files (`compose.override.yaml`, `-f compose.yaml -f compose.production.yaml`) (https://docs.docker.com/compose/how-tos/production/). Know env precedence & interpolation (https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/). Compose `secrets:` for sensitive values instead of env (https://docs.docker.com/compose/how-tos/use-secrets/).
- **Tool version managers**: `mise` ("Dev tools, env vars, and tasks in one CLI", https://github.com/jdx/mise) / asdf; `.tool-versions`/`mise.toml` pins Node/Python/Terraform versions used locally *and in CI*. **devbox** (Nix-based, https://github.com/jetify-com/devbox) / Nix flakes for full reproducibility.
- **Dev Containers** (`.devcontainer/devcontainer.json`, open spec https://containers.dev / https://github.com/devcontainers/spec): consistent toolchain, faster onboarding; playbook guide `refs7/.../developer-experience/devcontainers-getting-started.md`; the same dev container can run CI steps (`recipes/reusing-devcontainers-within-a-pipeline.md`).
- **Fakes for remote services** (playbook "Fake Services Inner Dev Loop"): contract-based fakes (json-server, WireMock, Prism/OpenAPI mocks) when upstream isn't ready.
- Task runner entrypoints: `make dev`, `make test`, `make lint` or `just`/`mise tasks`/npm scripts — identical names in CI.
- Local HTTPS/cookies/OAuth: use `localhost` exceptions or mkcert [OPINION].

## A12. Config changes are deploys: drift, review, progressive rollout

Evidence: Dan Luu's post-mortems list has a whole "Config Errors" section (https://github.com/danluu/post-mortems#config-errors). Recent:
- **Cloudflare 2025-11-18**: a database permissions change caused a generated feature file to exceed the size limit of the consuming software; the file propagated network-wide → global outage (https://blog.cloudflare.com/18-november-2025-outage/).
- **Cloudflare 2025-12-05**: a config change "propagated globally without a gradual rollout", triggered a Lua exception → HTTP 500s (https://blog.cloudflare.com/5-december-2025-outage/).
- **GitHub Aug 2024**: config change to databases broke health-check responses → read endpoint marked unhealthy (https://github.blog/news-insights/company-news/github-availability-report-august-2024/).
- **Heroku**: "An incorrect deployment process caused new config variables not to be used when the code required them" (https://blog.heroku.com/how-i-broke-git-push-heroku-main).
Rules [OPINION from the above]:
1. Config (including generated data files, flags, WAF rules, routing tables) goes through version control, review, validation (schema + size/limit checks on *consumer* limits), and **staged rollout** with health gates — same as code.
2. Consumers must reject bad config and keep last-known-good rather than crash (fail-static for runtime-reloaded config; fail-fast only at process start where the rollout gate protects you).
3. Deploy ordering: add new config keys **before** code that requires them; remove keys **after** code stops reading them (expand/contract for config).
4. **Drift detection**: scheduled `terraform plan -refresh-only`/`tofu plan` to detect out-of-band changes (B9); read-only consoles.

## A13. Environment-specific bugs checklist

- **Time zones**: run servers/containers in UTC; store timestamps as UTC (`timestamptz`); convert at the edge; cron/schedules need an explicit zone (Kubernetes CronJob `.spec.timeZone`, stable since v1.27; `CRON_TZ`/`TZ` inside `.spec.schedule` is *not supported* and fails validation — https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/). DST: local-time jobs at 02:30 may run twice or never on transition days [OPINION; classic cron behavior].
- **Locale**: number/date formatting and sorting differ (`LANG`, ICU data in slim/alpine images — Node full-icu is default in recent versions [UNVERIFIED]); never parse user-formatted numbers with default locale.
- **Case-sensitive filesystems** (macOS dev default case-insensitive vs Linux prod) → import path bugs.
- **CPU architecture**: Apple Silicon (arm64) dev vs amd64 prod; build multi-platform images or pin `--platform` (https://docs.docker.com/build/building/multi-platform/).
- **Resource limits**: container memory limit vs runtime heap (Node: set `--max-old-space-size` a bit below the container limit — nodebestpractices 8.7); CPU count detection in containers.
- **Network**: DNS search domains in k8s (`ndots:5`, B12); IPv6-only environments; egress allowlists; proxies; TLS trust stores in minimal images (need CA certificates).
- **Clock skew** in JWT validation (`nbf`/`exp` leeway).
- **Line endings / shell** in scripts (`#!/bin/sh` on Alpine/BusyBox vs bash).
- **Multi-region**: region-specific endpoints, data residency (data must not leave region), per-region secrets/keys, config keyed by region not by if-statements, deploy regions sequentially (region = canary unit) [OPINION].

---

# PART B — DEPLOYMENT, CI/CD, CONTAINERS, IaC, ORCHESTRATION

## B1. DORA metrics (2024–2025)

- DORA now uses **five** software delivery performance metrics (2025 report "State of AI-assisted Software Development"): **Throughput** = change lead time, deployment frequency, failed deployment recovery time; **Instability** = change fail rate, **deployment rework rate** (https://dora.dev/insights/dora-2025-year-in-review/; RedMonk summary https://redmonk.com/rstephens/2025/12/18/dora2025/; report PDF https://services.google.com/fh/files/misc/2025_state_of_ai_assisted_software_development.pdf).
- Rework rate was introduced in the **2024** report: unplanned deployments performed to address user-facing bugs; with change fail rate forms the "stability" factor; time-to-restore reconsidered as throughput (https://getdx.com/blog/2024-dora-report/, https://cloud.google.com/devops/state-of-devops).
- 2024 findings: AI adoption correlated with an estimated **−1.5% throughput and −7.2% stability per 25% increase in AI adoption** [the −7.2% figure is from memory — UNVERIFIED; −1.5% throughput confirmed by search summary]; internal developer platforms: individuals +8% productivity, teams +10% performance, but with throughput/stability downsides (search summaries of the 2024 report).
- 2025 findings: AI adoption now positively related to throughput and product performance **but still increases instability** (rework, failed deployments) — "AI amplifies" existing strengths/weaknesses; 2025 introduced a DORA AI Capabilities Model and team archetypes [UNVERIFIED details] (https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report).
- Skill implications [OPINION]: agents increase change volume → invest in small batches, fast CI, automated tests, progressive delivery, fast rollback; measure the five metrics from pipeline/deploy events, not surveys; metrics are for learning, not team targets (Goodhart).

## B2. CI/CD pipeline design

### B2.1 Canonical stages (per commit/PR, then on main)

| # | Stage | Contents | Fails fast on | Time budget [OPINION] |
|---|---|---|---|---|
| 1 | Setup | checkout (no persisted creds), toolchain from pinned versions (`mise`/`.nvmrc`), dependency install from lockfile (`npm ci`, `pip install --require-hashes`/`uv sync --locked`) with cache | lockfile drift | <1 min cached |
| 2 | Static | format check, lint, typecheck, config/schema validation, Dockerfile lint (hadolint), workflow lint (actionlint/zizmor [UNVERIFIED tool maturity]), IaC fmt/validate | style/type errors | 1–2 min |
| 3 | Security (fast) | secret scan (gitleaks/TruffleHog), dependency audit (osv-scanner/npm audit/Dependabot), SAST (CodeQL/Semgrep) | leaked creds, critical vulns | parallel |
| 4 | Unit tests | sharded, parallel | failures | 2–5 min |
| 5 | Build artifact | build once: container image tagged with git SHA, pushed to registry; record **digest**; SBOM + provenance attestation | build errors | 2–5 min w/ cache |
| 6 | Image scan | Trivy/Grype/Docker Scout on the built image (OS + language deps); block criticals (playbook: images failing scanning "should never be pushed to your production-accessible container registry") | criticals | 1 min |
| 7 | Integration / contract / e2e | against ephemeral services (Compose/Testcontainers) or preview env | failures | 5–10 min, parallel |
| 8 | Deploy preview/staging | same digest; migrations step; smoke tests; config pointing check | smoke fail | — |
| 9 | Deploy prod | progressive (canary/rolling) with automated analysis; release markers | SLO regression → auto rollback | — |
| 10 | Post-deploy | verify, notify, record DORA events | — | — |

Sources: playbook CI principles (build in git, single-command build, lint/test/security in build, IaC in CI, config validation, "Keep the build fast", "Consider adding max timeout limits") `refs7/.../CI-CD/continuous-integration.md`; container scanning `dev-sec-ops/dependency-and-container-scanning.md`; nodebestpractices 8.12 "scan the final image… as the last step before deployment"; Martin Fowler "Continuous Integration" (ten-minute build guideline from XP) https://martinfowler.com/articles/continuousIntegration.html [known source; re-verify wording].

### B2.2 Fast CI tactics
- Aim for PR feedback **under ~10 minutes** (Fowler/XP "ten-minute build") [widely cited guideline].
- Cache dependencies (keyed on lockfile hash) and Docker layers (BuildKit cache mounts `RUN --mount=type=cache`, registry/GHA cache backends `--cache-to/--cache-from`) (https://docs.docker.com/build/cache/optimize/).
- Order Dockerfile layers from least to most frequently changing (copy manifests → install → copy source) (Docker docs; nodebestpractices 8.8).
- Run independent jobs in parallel; shard tests by timing data; run only affected packages in monorepos (Nx/Turborepo/Bazel affected graphs) [OPINION].
- Put slow suites (full e2e, load) on merge queue / main / nightly, but never *only* nightly for critical paths [OPINION].
- Timeouts on every job (`timeout-minutes`) and fail fast on flaky infra; quarantine flaky tests with an owner and deadline.
- `concurrency:` groups cancel superseded PR runs (GitHub Actions) [known feature].

### B2.3 Build once, promote everywhere
- Build/release/run separation (12-factor V): build = immutable artifact; release = artifact + env config with a unique ID; run = execute release. Every release has a unique ID and "cannot be mutated once created" (https://12factor.net/build-release-run).
- Promote **by digest** (`image@sha256:…`), not by rebuilding per env or re-tagging `latest`. Tags are mutable (Docker docs "Pin base image versions") (https://docs.docker.com/build/building/best-practices/#pin-base-image-versions); nodebestpractices 8.9 "Using a digest guarantees that every instance of the service is running exactly the same code".
- Playbook "Application Release and Environment Promotion": deploy "the deployable build artifact created from your commit stage… across all cloud environments"; promotion "should also include the environment's configuration state (e.g. new env settings, feature flags)".
- Frontend exception: bundlers inline public env at build time → either build per env (accept it, but from same commit) or use runtime config (`/config.json` fetched at boot, or server-injected `window.__ENV`) to keep one artifact [OPINION].
- Version identity: `git SHA` (+ semver for libraries); embed as `APP_VERSION`/OCI label `org.opencontainers.image.revision`; expose at `/version` or in health output.

### B2.4 Trunk-based development + continuous deployment
- Short-lived branches (<1–2 days), small PRs, main always releasable; incomplete features behind flags; deploy on merge (continuous deployment) or on demand (continuous delivery). DORA research consistently associates trunk-based development with higher delivery performance (https://dora.dev/capabilities/trunk-based-development/ [known page; not re-read]).
- Microsoft playbook: CI/CD pipeline in "Sprint 0", before service code (`continuous-integration.md`); release strategy should define environments, approvals, config management, DR, rollback (`continuous-delivery.md`, citing Humble & Farley *Continuous Delivery*).
- Branch protection: required checks, required review, CODEOWNERS on `.github/workflows/` (GitHub secure-use doc: "Using CODEOWNERS to monitor changes"), merge queue for busy repos, no direct pushes to main, signed commits optional.

## B3. GitHub Actions security (2025–26 state)

Primary source: GitHub "Secure use reference" (`refs7/github_docs/content/actions/reference/security/secure-use.md`), "Securely using pull_request_target", OIDC docs; OWASP CI/CD Security Cheat Sheet (OWASP Top 10 CI/CD risks CICD-SEC-1..10).

### Checklist
1. **Pin every third-party action to a full-length commit SHA** — GitHub: "currently the only way to use an action as an immutable release". Add a trailing `# vX.Y.Z` comment; let **Dependabot** (`package-ecosystem: github-actions`) or Renovate bump SHAs. Since **2025-08-15**, org/repo "allowed actions" policy can **require SHA pinning** and **block** specific actions/versions; unpinned workflows fail (https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions/). Motivation: tj-actions tag-moving attack (A5.6). Also pin reusable workflows and Docker actions (`docker://image@sha256:…`).
2. **Least-privilege `GITHUB_TOKEN`**: set workflow-level `permissions: {}` or `contents: read` and grant per job (`id-token: write` only for deploy jobs, `packages: write` only for publish). GitHub: "set the default permission for the GITHUB_TOKEN to read access only for repository contents". Org setting: default read-only; disallow Actions creating/approving PRs.
3. **Untrusted input → script injection**: never interpolate `${{ github.event.* }}` (PR title, branch name, issue body, commit message) directly in `run:`; pass through `env:` and quote (`"$TITLE"`), or use an action with inputs (GitHub secure-use doc example).
4. **`pull_request_target` and `workflow_run`** run with base-repo secrets and write token. Never check out and execute fork code in them ("pwn request": `ref: ${{ github.event.pull_request.head.sha }}` then `make test`). Prefer `pull_request`; split privileged steps into a `workflow_run` workflow that treats artifacts as untrusted. As of 2026: `actions/checkout` refuses fork PR head refs under `pull_request_target` unless `allow-unsafe-pr-checkout: true`; GitHub added a **default policy blocking `pull_request_target` in public repos**, in evaluate mode, **enforced from 2026-11-02** for affected repos; `pull_request_target` gets **read-only cache access** to reduce cache poisoning (`refs7/github_docs/content/actions/reference/security/securely-using-pull_request_target.md`, https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target).
5. **OIDC for cloud** (A6); deploy jobs bound to **Environments** with required reviewers/branch rules; environment secrets gated by approval ("Consider requiring review for access to secrets").
6. **Secrets hygiene**: individual secrets (no JSON blobs), `::add-mask::` for derived tokens, audit logs for secret changes (`org.update_actions_secret`), rotate, remove unused.
7. **Runners**: GitHub-hosted are ephemeral clean VMs; self-hosted "should almost never be used for public repositories"; use ephemeral **just-in-time runners**, runner groups, no sensitive creds/metadata-service access on runner hosts.
8. **Supply-chain visibility**: dependency graph includes workflow actions; OpenSSF **Scorecard** action flags dangerous workflows/unpinned deps; CodeQL scans workflows for vulnerable patterns.
9. **Artifact integrity**: GitHub **artifact attestations** (Sigstore) give **SLSA v1.0 Build Level 2**; higher assurance by building in a vetted reusable workflow; "Generating attestations alone doesn't provide any security benefit, the attestations must be verified" (`gh attestation verify`, admission controller) (`refs7/github_docs/content/actions/concepts/security/artifact-attestations.md`). Sign releases/images people run; don't sign every test build.
10. `actions/checkout` with `persist-credentials: false` unless later steps push [OPINION; recommended by zizmor/Scorecard — UNVERIFIED attribution].
11. Scheduled workflows: run only on default branch, can be delayed at high load ("High load times include the start of every hour… some queued jobs may be dropped") and auto-disabled after 60 days of inactivity in public repos (`refs7/raw/github_docs…events-that-trigger-workflows.md`, reusable `schedule-delay.md`). Don't rely on Actions `schedule` for business-critical jobs.

OWASP CI/CD cheat sheet additions (`refs7/OWASP_CheatSheetSeries/cheatsheets/CI_CD_Security_Cheat_Sheet.md`): isolate build nodes; review CI config like code; "Require manual approval and review before triggering production deployment" (or automated equivalents); avoid `--privileged` Docker in pipelines; MFA; inventory; logging & monitoring of pipeline activity. OWASP Top 10 CI/CD Risks: insufficient flow control, inadequate IAM, dependency chain abuse, poisoned pipeline execution, insufficient pipeline-based access controls, insufficient credential hygiene, insecure system config, ungoverned third-party services, improper artifact integrity validation, insufficient logging.

### Example: CI + build-once + OIDC deploy (GitHub Actions)
Placeholders `<SHA>` must be replaced by real full-length commit SHAs looked up at authoring time — **never let an agent invent SHAs**.

```yaml
name: ci-cd
on:
  pull_request:
  push:
    branches: [main]

permissions: {}                      # nothing by default; grant per job

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  test:
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@<SHA> # v5.x
        with:
          persist-credentials: false
      - uses: actions/setup-node@<SHA> # v5.x
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint && npm run typecheck
      - run: npm test -- --shard=${{ strategy.job-index }}   # or a matrix for sharding

  build:
    needs: test
    if: github.event_name == 'push'
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    permissions:
      contents: read
      id-token: write          # OIDC to cloud registry + attestations
      attestations: write
    outputs:
      digest: ${{ steps.push.outputs.digest }}
    steps:
      - uses: actions/checkout@<SHA> # v5.x
        with: { persist-credentials: false }
      - uses: aws-actions/configure-aws-credentials@<SHA> # v5.x
        with:
          role-to-assume: arn:aws:iam::111111111111:role/ci-image-push   # nonprod/shared-services account
          aws-region: eu-west-1
      - uses: aws-actions/amazon-ecr-login@<SHA> # v2.x
        id: ecr
      - uses: docker/setup-buildx-action@<SHA> # v3.x
      - uses: docker/build-push-action@<SHA> # v6.x
        id: push
        with:
          push: true
          tags: ${{ steps.ecr.outputs.registry }}/app:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true
      - uses: actions/attest-build-provenance@<SHA> # v3.x
        with:
          subject-name: ${{ steps.ecr.outputs.registry }}/app
          subject-digest: ${{ steps.push.outputs.digest }}
          push-to-registry: true

  deploy-staging:
    needs: build
    runs-on: ubuntu-24.04
    environment: staging
    permissions: { contents: read, id-token: write }
    steps:
      - uses: aws-actions/configure-aws-credentials@<SHA>
        with:
          role-to-assume: arn:aws:iam::222222222222:role/deploy-staging   # trust: sub = repo:org/app:environment:staging
          aws-region: eu-west-1
      - run: ./scripts/migrate.sh   && ./scripts/deploy.sh "app@${{ needs.build.outputs.digest }}"
      - run: ./scripts/smoke.sh https://staging.example.com

  deploy-prod:
    needs: [build, deploy-staging]
    runs-on: ubuntu-24.04
    environment: production        # required reviewers / wait timer / branch policy
    permissions: { contents: read, id-token: write }
    steps:
      - uses: aws-actions/configure-aws-credentials@<SHA>
        with:
          role-to-assume: arn:aws:iam::333333333333:role/deploy-prod      # separate prod account
          aws-region: eu-west-1
      - run: ./scripts/migrate.sh   && ./scripts/deploy.sh "app@${{ needs.build.outputs.digest }}" --strategy canary
```

AWS trust policy for the prod role (GitHub OIDC doc pattern):
```json
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::333333333333:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:my-org/app:environment:production"
    }
  }
}
```
(For repos using immutable subject claims — default for repos created after 2026-07-15 — `sub` looks like `repo:my-org@<ownerId>/app@<repoId>:environment:production`.)

## B4. Containers

### B4.1 Dockerfile checklist (with sources)
| Rule | Why | Source |
|---|---|---|
| Multi-stage build; runtime stage copies only artifacts | smaller, fewer vulns, no build tools/secrets | Docker best practices https://docs.docker.com/build/building/best-practices/ ; nodebestpractices 8.1 |
| Minimal, trusted base (Docker Official/Verified, slim/alpine/distroless/hardened) | attack surface; playbook: remove shells, curl/wget/netcat, compilers from prod images | Docker docs; playbook `dependency-and-container-scanning.md` |
| Hardened images: **Docker Hardened Images free under Apache-2.0 since Dec 2025** (1,000+ images, Debian/Alpine based, SBOM, SLSA Build L3 provenance); Chainguard (Wolfi, distroless); Google distroless; Red Hat Hardened Images free from May 2026 | near-zero CVE baselines | https://www.docker.com/blog/docker-hardened-images-for-every-developer/ ; https://devclass.com/2025/12/18/docker-hardened-images-now-free-devs-give-cautious-welcome/ ; RH claim via search summary [UNVERIFIED] |
| Pin base by version **and digest**; automate bumps with Dependabot `package-ecosystem: docker` | tags are mutable; audit trail; still get fixes via PRs | Docker docs "Pin base image versions" |
| Rebuild often (`--pull`) | pick up security patches | Docker docs "Rebuild your images often" |
| Never `latest` | non-deterministic | nodebestpractices 8.9; hadolint DL3007 |
| `.dockerignore` (`.git`, `.env*`, `node_modules`, `.aws`, `.npmrc`, build output) | secrets leak + slow context | nodebestpractices 8.4; Docker docs |
| Order layers: dependency manifests → install → source; cache mounts for package managers | fast rebuilds | Docker cache docs; nodebestpractices 8.8 |
| No secrets in `ARG`/`ENV`/layers; use `RUN --mount=type=secret` / `--mount=type=ssh` | "Build arguments and environment variables are inappropriate for passing secrets… they persist in the final image" | https://docs.docker.com/build/building/secrets/ ; nodebestpractices 8.11 |
| Run as **non-root** with explicit UID/GID; don't install sudo | privilege; "Consider an explicit UID/GID" | Docker docs USER; hadolint DL3002; OWASP Docker rule #2 |
| Drop capabilities, `no-new-privileges`, read-only root FS, resource limits (runtime settings) | container escape blast radius | OWASP Docker Security Cheat Sheet rules #3, #4, #7, #8 |
| Never mount the Docker socket into containers | root on host | OWASP Docker rule #1 |
| Exec-form `CMD ["node","server.js"]` / ENTRYPOINT; app is PID 1 or use `tini`/`--init`; avoid `npm start` wrappers | signals (SIGTERM) reach the app | nodebestpractices 8.2, graceful-shutdown.md; hadolint DL3025 |
| One concern per container ("Decouple applications"); let orchestrator restart/replicate (no PM2/cluster inside) | scaling & restarts visible to platform | Docker docs; nodebestpractices 8.3 |
| Memory limit at runtime + language heap tuned below it | OOM behaviour, GC | nodebestpractices 8.7 |
| Production deps only (`npm ci --omit=dev`), clean package caches | size, attack surface (eslint-scope malicious dev dep example) | nodebestpractices 8.5, 8.13 |
| `COPY` not `ADD`; pin apt/apk/pip versions; `SHELL ["/bin/bash","-o","pipefail","-c"]` for pipes; clean apt lists | reproducibility | hadolint DL3020, DL3008/DL3018/DL3013, DL4006, DL3009 (https://github.com/hadolint/hadolint) |
| Lint with hadolint; scan image (Trivy/Grype/Scout) in CI; SBOM + provenance | catch mistakes; OS-level CVEs (OpenSSL etc.) | nodebestpractices 8.12, 8.15 |
| `HEALTHCHECK` for Compose/Swarm; for k8s use probes instead | readiness | Docker reference [known]; B12 |
| Multi-platform (`linux/amd64,linux/arm64`) when devs/prod differ | arch bugs | https://docs.docker.com/build/building/multi-platform/ |
| OCI labels: source, revision (git SHA), version | traceability | OCI image spec annotations [known] |

### B4.2 Example: Node.js service
```dockerfile
# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:<digest>    # pin tag + digest; Dependabot bumps it

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci

FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
# node images ship a non-root 'node' user (uid 1000)
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 8080
ARG GIT_SHA
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV APP_VERSION=$GIT_SHA
CMD ["node", "--max-old-space-size=384", "dist/server.js"]   # exec form: node is PID 1 and receives SIGTERM
```
Build: `docker build --secret id=npmrc,src=$HOME/.npmrc --build-arg GIT_SHA=$(git rev-parse HEAD) .` (GIT_SHA is not secret, so ARG is fine). Heap flag should be derived from the container memory limit (nodebestpractices 8.7) — here assumes 512 MiB.

### B4.3 Example: Python service (uv) [OPINION on tool choice]
```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.13-slim@sha256:<digest> AS build
COPY --from=ghcr.io/astral-sh/uv:<version>@sha256:<digest> /uv /bin/uv
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-dev --no-install-project
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-dev

FROM python:3.13-slim@sha256:<digest>
RUN groupadd --system --gid 10001 app && useradd --system --uid 10001 --gid app --no-log-init app
WORKDIR /app
COPY --from=build --chown=app:app /app /app
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
USER 10001
CMD ["gunicorn", "app.wsgi:application", "--bind", "0.0.0.0:8080", "--graceful-timeout", "25"]
```
(uv env vars/flags [UNVERIFIED — check uv Docker guide https://docs.astral.sh/uv/guides/integration/docker/].)

### B4.4 Graceful shutdown (any runtime)
Sequence (nodebestpractices 8.6; RisingStack; K8s docs): on SIGTERM → mark not-ready (readiness 503) → stop accepting new connections → finish in-flight requests with a deadline → close keep-alive connections → stop job consumers (stop fetching, finish or release leases) → flush telemetry → close DB pools → exit 0. Must finish before the platform's grace period (K8s default `terminationGracePeriodSeconds` 30 s — then SIGKILL).

```ts
const server = app.listen(env.PORT);
let shuttingDown = false;
app.get("/readyz", (_req, res) => res.status(shuttingDown ? 503 : 200).end());

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down");
  const hardStop = setTimeout(() => process.exit(1), 25_000).unref(); // < grace period
  server.close();                    // stop accepting; in-flight continue
  server.closeIdleConnections?.();   // Node >= 18.2
  await worker?.close();             // stop pulling jobs, let current finish
  await telemetry.shutdown();        // flush spans/metrics
  await db.end();
  clearTimeout(hardStop);
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
```

## B5. Deployment strategies

| Strategy | How | Needs | Rollback | Use when | Watch out |
|---|---|---|---|---|---|
| Recreate | stop old, start new | nothing | redeploy old | dev/internal, singleton workers that must not overlap | downtime |
| Rolling | replace instances in batches (`maxSurge`/`maxUnavailable`) | readiness probes, N/N+1 compatibility | roll back = another rolling deploy | default for stateless services (K8s native rolling updates — playbook) | mixed versions live simultaneously; slow rollback |
| Blue/green | full parallel env, switch router | 2× capacity, shared/replicated data | switch back (fast) | risky releases, need instant rollback; Azure slot swap is a PaaS form (playbook) | DB is shared → schema must serve both; warm-up; cost |
| Canary | small % of traffic/instances to new version, observe, expand (e.g. 1→5→25→100) | traffic splitting, per-version metrics, automated analysis | shift traffic back | most prod services at scale | small samples → noisy metrics; sticky sessions; long-running version skew (playbook: "limit the number of versions of your application running parallel") |
| Progressive delivery (automated canary) | controller advances steps, queries metrics (Prometheus/Datadog), aborts automatically | Argo Rollouts / Flagger / cloud-native equivalents (AWS CodeDeploy, Cloud Run traffic splits) | automatic | when you have good SLIs | analysis quality = safety |
| Rings | internal → early adopters → everyone | cohorting | stop ring | products with internal dogfood | — |
| Feature flags / dark launch | deploy code off; release by flag | flag service | flip flag (seconds) | decouple deploy from release; trunk-based | flag debt; test both paths |
| Shadow/mirroring | copy prod traffic to new version, discard responses | traffic mirroring, idempotent/side-effect-free handling | n/a | rewrites, perf validation | double side effects — must stub writes |

Sources: playbook `continuous-delivery.md` (rolling, blue/green, canary, rings, warm-up, zero downtime, slot swap); Argo Rollouts: Rollout CRD + AnalysisTemplate/AnalysisRun querying metrics, automatic abort to stable ReplicaSet (https://argoproj.github.io/argo-rollouts/ [known]; tutorial summaries https://www.infracloud.io/blogs/progressive-delivery-argo-rollouts-canary-analysis/); Google SRE workbook canarying (https://sre.google/workbook/canarying-releases/); E-architecture §4.14.

Rules [OPINION]:
- Deploy ≠ release. Ship dark, release with flags, measure.
- Every deploy has health gates: readiness, smoke test, error-rate/latency comparison of new vs old version, then automatic promotion or rollback.
- **Warm-up** before traffic: caches, connection pools, JIT (playbook "Live Release Warm Up"; "Application warm up should be a quantified measurement").
- Deploy windows: avoid Friday-evening big bangs *because* rollback staffing is thin, not as a substitute for safe deploys.
- Knight Capital (2012): inconsistent deployment across servers (one of eight servers kept old code) + reused feature flag bit → $460M loss (https://dougseven.com/2014/04/17/knightmare-a-devops-cautionary-tale/, via Dan Luu list). Lessons: automated, verified deploys to all targets; never repurpose flags; kill switch.

## B6. Rollback vs roll-forward

| Situation | Prefer | Why |
|---|---|---|
| Stateless code regression, previous artifact compatible with current schema/data | **Rollback** (redeploy previous digest / flip traffic / flip flag) | fastest restore; no new code under pressure |
| Feature behind flag | **Flag off** | seconds, no deploy |
| Change included irreversible data migration / new data written in new format | **Roll forward** with a fix (or compensating migration) | old code can't read new data |
| Fix is trivial and pipeline is fast (<15 min) and rollback is risky | Roll forward | — |
| Security fix | Roll forward | rolling back reintroduces vuln |
Rules: every release must be rollback-able *by construction* (expand/contract migrations — E §4.15; N-1 compatible message/event schemas; config keys added before use); rehearse rollback; back up before destructive migrations (playbook: "All data files and databases should be backed up prior to each release"); keep previous N images in registry (retention policy). "Rolling back releases can get tricky, especially when database record/object changes occur" (playbook). [OPINION synthesized]

## B7. Database migrations in the pipeline (mechanics; schema-safety rules are in E §4.15)

- Run migrations as a **separate pipeline step / one-off job** (12-factor XII admin processes: "run against a release, using the same codebase and config") before the new app version receives traffic — not in every replica's startup (N replicas racing; startup timeouts; failure leaves half-deployed). If the framework runs migrations on boot, guard with an advisory lock and a single leader [OPINION; widely practiced].
- Order: expand migration → deploy app (reads/writes both) → backfill job → contract migration in a *later* release.
- Migration job uses its own DB role with DDL rights; app role has DML only [OPINION].
- CI: apply migrations from scratch on an empty DB *and* upgrade from the previous release's schema; lint with squawk/strong_migrations; preview DB branches exercise migrations per PR (A8).
- Set `lock_timeout`/`statement_timeout`; long backfills are throttled jobs, not migrations (E §4.15).
- Record migration version in release metadata; make the deploy fail if migration fails; never auto-rollback DDL blindly.

## B8. Infrastructure as Code

### B8.1 Landscape & licensing (as of 2026-09)
- **Terraform**: HashiCorp relicensed from MPL 2.0 to **BUSL 1.1 on 2023-08-10**. OpenTF manifesto 2023-08-15; fork announced 2023-08-25; accepted into the **Linux Foundation as OpenTofu on 2023-09-20**, MPL 2.0 (https://en.wikipedia.org/wiki/OpenTofu, https://opentofu.org/manifesto/). IBM completed its HashiCorp acquisition **2025-02-27** (~$6.4B) (https://en.wikipedia.org/wiki/Terraform_(software)).
- **OpenTofu** divergence: native **client-side state & plan encryption since 1.7** (AES-GCM, keys from passphrase/KMS) — Terraform relies on backend encryption only (https://www.env0.com/blog/opentofu-v1-7-enhanced-security-with-file-state-encryption; https://opentofu.org/docs/language/state/encryption/ [known URL]). Other OpenTofu features (early variable evaluation in backends/module sources, provider `for_each`) [UNVERIFIED version numbers].
- **Pulumi** (general-purpose languages; state in Pulumi Cloud or self-managed backends), **AWS CDK** (synthesizes CloudFormation), **CDKTF** [status UNVERIFIED — reportedly deprecated], **Crossplane** (k8s control-plane IaC), cloud-native (CloudFormation, Bicep).

| Tool | Choose when | Trade-offs |
|---|---|---|
| Terraform / OpenTofu (HCL) | multi-cloud/SaaS providers, large ecosystem, declarative reviewable plans; OpenTofu if license/open governance or state encryption matters | HCL limits abstraction; state management is on you |
| Pulumi | team wants TS/Python/Go, loops/abstractions, testing in real languages | more power = more ways to be clever; plans less uniform to review |
| AWS CDK / Bicep | single-cloud shops deep in AWS/Azure | lock-in; CloudFormation speed/limits |
| Crossplane | platform teams exposing infra as k8s APIs | needs k8s + operator expertise |
| PaaS config files (`fly.toml`, `render.yaml`, `vercel.json`) | small apps on a PaaS | limited scope; still version them |
[OPINION table]

### B8.2 Practices
- **Everything as code**: resources, IAM/role assignments, secrets *containers* (not values), app settings, alerts/monitors, dashboards (playbook "Infrastructure as Code" list incl. "Availability Alerting / Monitoring Rules"; observability-as-code doc `refs7/.../observability/observability-as-code.md`).
- **Operations by pull request**: plan in CI on PR, post plan as comment, human review of plan, apply from CI only after merge (playbook "IAC CI Workflow… The infrastructure execution plan candidate… reviewed by a cloud administrator as a gate check prior to the deployment stage"; "Azure Portal should provide a read-only view"; "Developer accounts… read-only access"). Apply the **saved plan file** that was reviewed (`terraform plan -out` → `apply planfile`) [known CLI behavior].
- **Remote state with locking**, encryption at rest, versioning, restricted access (state contains secrets in plaintext). S3 backend: `use_lockfile = true` (native S3 lock via conditional writes; added 1.10, GA in 1.11 where `dynamodb_table` is **deprecated**) (https://developer.hashicorp.com/terraform/language/backend/s3 [known]; AWS Prescriptive Guidance https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/backend.html).
- **One state per environment per component** (blast radius, plan speed): e.g. `live/prod/network`, `live/prod/app`, `live/staging/app` reusing the same modules with different vars. Prefer directory/stack separation over `terraform workspace` for env isolation (different accounts/creds) [OPINION; common guidance].
- **Modules**: per logical component; standard files `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, `backend.tf`, `data.tf`; README generated by `terraform-docs`; examples/ and tests/ folders; variable/output descriptions; mark `sensitive` (playbook `recipes/terraform/terraform-structure-guidelines.md`). Pin provider and module versions; commit `.terraform.lock.hcl`.
- **Testing**: `fmt -check`, `validate`, static policy/security scan (Checkov, Trivy config (tfsec merged into Trivy), OPA/Conftest) [tool names known; tfsec→Trivy UNVERIFIED], native `terraform test`/`tofu test` [UNVERIFIED version], Terratest for integration; test properties that "can break the functionality" (network/access policies, permissions), secrets presence in vault, cost/location/tier (playbook).
- **Drift detection**: scheduled `plan -refresh-only -detailed-exitcode` (exit 2 = changes) and alert; reconcile by either importing the change into code or re-applying (https://developer.hashicorp.com/terraform/tutorials/state/resource-drift). CircleCI 2025-04 incident = out-of-band change outside Terraform (A7).
- **Immutability**: replace rather than mutate servers (OWASP IaC cheat sheet "Immutability of infrastructure… If a change… is required, then a whole new set of infrastructure is provisioned").
- `prevent_destroy` lifecycle on stateful resources (DBs, buckets), deletion protection flags, backups verified [OPINION].
- CI identity for IaC: OIDC role per env; plan role read-only, apply role write — separate [OPINION].
- Naming/tagging conventions: env, service, owner, cost-center tags on everything (cost allocation) (playbook `share-common-variables-naming-conventions.md`; E §4.17).

Example backend (Terraform ≥1.11):
```hcl
terraform {
  required_version = ">= 1.11"
  backend "s3" {
    bucket       = "acme-tfstate-prod"        # in the prod account, versioning + SSE-KMS + block public access
    key          = "app/terraform.tfstate"
    region       = "eu-west-1"
    use_lockfile = true                       # native S3 locking; dynamodb_table is deprecated
    encrypt      = true
  }
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }   # [UNVERIFIED current major]
  }
}
```

## B9. GitOps (Argo CD, Flux)

- Definition (playbook quoting GitLab): "an operational framework that takes DevOps best practices… version control, collaboration, compliance, and CI/CD, and applies them to infrastructure automation"; git as source of truth, **pull-based** reconciliation by an in-cluster agent, audit trail via commits, no direct environment access (`refs7/.../CI-CD/gitops/deploying-with-gitops.md`). CNCF tools: Flux v2, Argo CD, Rancher Fleet.
- Pattern: app repo CI builds image → updates image digest in an **environment/config repo** (PR or bot commit; Argo CD Image Updater / Flux image automation) → controller syncs. Promotion = PR from staging overlay to prod overlay (Kustomize/Helm values).
- Pros: drift auto-corrected, easy rollback (git revert), cluster credentials never leave the cluster. Cons: another control plane, secret handling needs ESO/SOPS (A5.2), harder for non-k8s targets, reconciliation loops can fight manual hotfixes (that's the point) [OPINION].
- Use when you run Kubernetes with multiple clusters/envs; skip for a single PaaS app.

## B10. Choosing a runtime platform

| Option | Examples | Ops burden | Scaling | Cost profile | Best for | Avoid when |
|---|---|---|---|---|---|---|
| PaaS | Heroku, Render, Railway, Fly.io, Vercel/Netlify (web), App Service, Google App Engine | lowest | automatic/simple | higher unit price, low fixed | startups, small teams, most CRUD SaaS, previews built in | exotic networking, GPUs, strict compliance/residency not offered |
| Managed containers (serverless containers) | Cloud Run, AWS App Runner/ECS Fargate, Azure Container Apps | low | request/CPU-based, scale-to-zero (some) | pay per use; good middle | containerized services without a platform team | long-lived connections at huge scale, host-level control |
| Containers on VMs | Kamal, Docker Compose on a VM, Nomad | medium (OS patching, backups) | manual/scripted | cheapest at steady load (esp. bare metal) | predictable traffic, cost-sensitive, few services | spiky global traffic, many teams |
| Managed Kubernetes | EKS, GKE, AKS | high (upgrades, addons, networking, policies) | very flexible | cluster overhead + people | many services/teams, platform team exists, need operators, custom scheduling, multi-tenant isolation, portability | <~10 services, no platform/SRE capacity |
| Functions (FaaS) | AWS Lambda, Cloud Functions, Azure Functions | low | per request, to zero | great for spiky/low volume; can exceed containers at sustained load | glue, event handlers, webhooks, cron, spiky APIs | long-running, latency-critical with cold starts, heavy DB connection needs |
| Edge functions | Cloudflare Workers, Vercel/Netlify Edge, Deno Deploy | low | global | per request | auth/redirects/personalization at edge, latency-sensitive reads with edge data | Node-only libs, long CPU, DB far away (latency back to origin region) |

Sources: small-team k8s guidance from secondary articles (Encore https://encore.dev/articles/do-you-need-kubernetes; others) — heuristics like "fewer than 10 services, fewer than 5 backend developers, no platform team → k8s unnecessary" are **[OPINION from low-authority sources]**; 12-factor "Narrow Conduits" argues orchestration YAML is the wrong app/platform interface; Kelsey Hightower "Kubernetes is a platform for building platforms" (quoted in 12factor.net blog "Evolving Twelve-Factor"); 37signals runs HEY/Basecamp with Kamal, no Kubernetes control plane (https://kamal-deploy.org/).

Decision questions for an agent [OPINION]:
1. How many services/teams? Is there a platform/SRE owner? (No → PaaS/managed containers.)
2. Traffic shape: spiky/idle (serverless/scale-to-zero) vs steady (VMs/containers, reserved capacity).
3. Statefulness & connections (websockets, long jobs, DB connection limits → avoid pure FaaS or add a pooler/proxy).
4. Compliance/residency/networking requirements (VPC peering, private links, egress IPs).
5. Cost at 10× scale and team cost (people > machines for small teams).
6. Lock-in tolerance: containers + 12-factor keep migration paths open.
7. What does the existing org already run well? (Operational familiarity beats theoretical fit.)

## B11. Kubernetes: essentials and recurring failure patterns

### B11.1 Failure stories (k8s.af, compiled by Henning Jacobs) — patterns
Source: `refs7/hjacobs_kubernetes-failure-stories/site/index.html` (repo moved to https://codeberg.org/hjacobs/kubernetes-failure-stories; site https://k8s.af).
| Pattern | Stories |
|---|---|
| **DNS**: CoreDNS OOMKilled, `ndots:5` query amplification, musl/Alpine resolver quirks | Zalando "Total DNS outage" (CoreDNS, OOMKill, ndots:5, HTTP retries); Toyota Connected "A Perfect DNS Storm" (ndots:5, Alpine musl); ThredUP (DNS errors) |
| **CPU throttling** from CFS limits | Zalando talks; Civis Analytics |
| **OOM / no resource limits / node pressure** | NU.nl (SystemOOM, no limits); Nordstrom (OOM, eviction thresholds); Universe (Job consumed node resources) |
| **Scheduling/affinity** | Moonlight: all pods scheduled to same failing host (no anti-affinity) → 100% traffic loss |
| **Cluster upgrades** | Loveholidays GKE upgrade: 2-hour maintenance lasted 7 h, ingress loss |
| **Load balancer/ingress config** | Skyscanner templating line in HAProxy ingress; DevOps Hof `externalTrafficPolicy` + node drain = total ingress outage; ELB dynamic IPs (Turnitin, SaleMove, Nordstrom) |
| **Control plane / etcd** | Monzo (etcd, Linkerd, services without endpoints); NRE Labs; Oath/Yahoo (namespace deletion, cert refresh) |
| **Probes** | NRE Labs, ThredUP livenessProbe issues |
| **CronJobs** | Zalando (CronJob storms) |

### B11.2 Resource requests/limits
- Kubernetes docs: CPU limits are enforced by **throttling** (hard ceiling even if node idle); memory limits by **OOM kill** (https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/, `refs7/raw/…manage-resources-containers.md`).
- Common guidance: always set CPU **request** and memory **request = limit**; omit CPU limit for latency-sensitive services unless in shared/multi-tenant clusters (then monitor throttling `container_cpu_cfs_throttled_*`) (Datadog https://www.datadoghq.com/blog/kubernetes-cpu-requests-limits/; Eric Khun "make your services faster by removing CPU limits"). **[Contested: some orgs keep limits for fairness — present as trade-off.]**
- Runtime awareness: set language heap/thread pools from limits (Node `--max-old-space-size`, JVM container support `-XX:MaxRAMPercentage`, Go `GOMAXPROCS`/`GOMEMLIMIT` [UNVERIFIED defaults per Go version]).
- Right-size from observed usage (VPA recommendations, metrics), not guesses; requests drive scheduling & cost.

### B11.3 Probes & shutdown
- **Readiness** = can take traffic now (dependency-light); **liveness** = process is wedged → restart (never check dependencies in liveness, or a DB blip restarts everything); **startup** probe for slow boots [OPINION; standard guidance].
- Termination race: endpoint removal and SIGTERM happen **concurrently**, so pods can get new requests after SIGTERM → deploy-time 502s. Fix: `preStop` sleep (a few seconds) so load balancers/kube-proxy drop the pod first; the grace period covers preStop + app shutdown: `terminationGracePeriodSeconds ≥ preStop + drain + buffer` (https://devopscube.com/kubernetes-pod-graceful-shutdown/, secondary). Kubernetes lifecycle hooks now include a native **`sleep` action** executed by the kubelet (no shell needed in distroless images) (`refs7/raw/kubernetes_website…container-lifecycle-hooks.md`; GA version [UNVERIFIED — believed 1.30 beta / later GA]).
- PodDisruptionBudgets for voluntary disruptions (node drains, upgrades); topology spread / anti-affinity so replicas don't share a node/zone (Moonlight story).

### B11.4 DNS `ndots:5`
- Default pod resolv.conf has `ndots:5` + cluster search domains, so `api.stripe.com` (2 dots) is first tried as `api.stripe.com.<ns>.svc.cluster.local` etc. → up to 4+ extra queries per lookup (×2 for A/AAAA) → latency and CoreDNS load (secondary: https://www.michal-drozd.com/en/blog/kubernetes-dns-caching-ndots/). Fixes: FQDN with trailing dot for external hosts, `dnsConfig.options: [{name: ndots, value: "2"}]`, NodeLocal DNSCache, client-side DNS caching/connection reuse.

### B11.5 Example Deployment fragment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: api, labels: { app: api } }
spec:
  replicas: 3
  strategy: { type: RollingUpdate, rollingUpdate: { maxSurge: 25%, maxUnavailable: 0 } }
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      terminationGracePeriodSeconds: 40
      topologySpreadConstraints:
        - { maxSkew: 1, topologyKey: topology.kubernetes.io/zone, whenUnsatisfiable: ScheduleAnyway, labelSelector: { matchLabels: { app: api } } }
      securityContext: { runAsNonRoot: true, runAsUser: 10001, seccompProfile: { type: RuntimeDefault } }
      dnsConfig: { options: [ { name: ndots, value: "2" } ] }
      containers:
        - name: api
          image: registry.example.com/api@sha256:<digest>        # deploy by digest
          ports: [ { containerPort: 8080 } ]
          env:
            - { name: APP_VERSION, value: "<git-sha>" }
          envFrom: [ { configMapRef: { name: api-config } } ]      # non-secret config
          volumeMounts: [ { name: secrets, mountPath: /run/secrets, readOnly: true } ]  # from ESO/CSI
          resources:
            requests: { cpu: 250m, memory: 512Mi }
            limits:   { memory: 512Mi }                           # no CPU limit (see B11.2 trade-off)
          readinessProbe: { httpGet: { path: /readyz, port: 8080 }, periodSeconds: 5 }
          livenessProbe:  { httpGet: { path: /livez,  port: 8080 }, periodSeconds: 10, failureThreshold: 3 }
          startupProbe:   { httpGet: { path: /livez,  port: 8080 }, failureThreshold: 30, periodSeconds: 2 }
          lifecycle: { preStop: { sleep: { seconds: 5 } } }
          securityContext: { allowPrivilegeEscalation: false, readOnlyRootFilesystem: true, capabilities: { drop: ["ALL"] } }
      volumes: [ { name: secrets, secret: { secretName: api-secrets } } ]
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: api }
spec: { minAvailable: 2, selector: { matchLabels: { app: api } } }
```

## B12. Simple VM deploys: Kamal & friends

- **Kamal** (37signals; formerly MRSK): deploys Docker containers to any servers over SSH; Kamal 2 uses its own **kamal-proxy** (replaced Traefik) for zero-downtime switching, TLS via Let's Encrypt; during deploy the proxy polls the healthcheck path (default `/up`) about once per second and switches traffic only after success (https://kamal-deploy.org/docs/configuration/proxy/, `refs7/raw/basecamp_kamal-site…proxy.md`; secondary https://ramnode.com/guides/kamal).
- 37signals cloud exit: compute left AWS in 2023; S3 exit in 2025 to ~18 PB Pure Storage (~$1.5M hardware), expected savings ~$1.3M/yr on storage, five-year savings estimate raised from $7M to >$10M; AWS waived ~$250k egress (https://www.datacenterdynamics.com/en/news/37signals-begins-exiting-aws-storage-service/, https://www.theregister.com/2024/10/21/37signals_aws_savings/, https://www.heise.de/en/news/Away-from-AWS-37signals-saves-1-3-million-dollars-a-year-with-its-own-storage-10380140.html). Use as evidence that steady, large workloads can be cheaper owned — not as a default recommendation for startups [OPINION].
- VM deploy checklist [OPINION]: immutable images + health-gated switch; at least 2 hosts behind LB for zero downtime; OS patching automation (unattended-upgrades) and reboots; backups & restore drills; secrets via env files outside the repo (Kamal `.kamal/secrets` pulling from a password manager [UNVERIFIED feature detail]); log shipping; firewall (Docker bypasses UFW rules — OWASP Docker rule #5a); monitoring of disk space (image pruning).

## B13. Serverless & edge trade-offs

- **Cold starts**: first request after scale-up pays init; mitigate with smaller bundles (esbuild/tree-shaking), lazy imports, SnapStart (Java/Python/.NET [UNVERIFIED runtime list]), provisioned concurrency / min instances.
- **Cost change (AWS Lambda, 2025-08-01)**: INIT phase now billed like invocation duration for ZIP managed runtimes (previously free; already billed for container images/custom runtimes/provisioned concurrency); AWS says most users see minimal impact (cold starts <1% of invocations) (https://aws.amazon.com/blogs/compute/aws-lambda-standardizes-billing-for-init-phase/ [URL UNVERIFIED]; summaries https://www.cloudyali.io/blogs/aws-lambda-cold-starts-now-cost-money-august-2025-billing-changes-explained).
- **Limits** (timeouts, payload sizes, ephemeral disk, concurrency quotas) — check per provider; design long work as queued steps/durable workflows (B14).
- **DB connections**: many concurrent function instances exhaust Postgres connections → use a pooler (PgBouncer/RDS Proxy/serverless drivers over HTTP) [OPINION; well known].
- **Cost cliff**: per-request pricing is great for spiky/low traffic; at sustained high utilization containers/VMs usually cheaper (Prime Video case in E §4.17).
- **Edge**: runtime subset (Web APIs, not full Node), CPU/time limits, data locality — edge compute far from the primary DB can be *slower* (multiple round trips to origin region) unless data is replicated/cached at edge [OPINION; see E §7.3].
- Observability: cold-start flag in traces, per-function concurrency/throttle alarms, DLQs on async invocations.

## B14. Scheduled jobs, background queues, durable workflows

### B14.1 Cron pitfalls & rules
| Pitfall | Mitigation | Source |
|---|---|---|
| Overlap: slow run still going when next fires | `concurrencyPolicy: Forbid` (K8s) / distributed lock (DB advisory lock, Redis lock with TTL) / queue with uniqueness key | K8s CronJob docs (default is `Allow`) |
| Duplicate runs (at-least-once scheduling; multiple app replicas each running in-process cron) | **Jobs must be idempotent**; single scheduler (leader election or external scheduler); dedupe key per scheduled slot | K8s docs: "the Jobs that you define should be idempotent"; can run "at least once" |
| Missed runs (controller/app down) | decide catch-up policy explicitly; `startingDeadlineSeconds`; >100 missed schedules → K8s stops scheduling that CronJob; make jobs process "everything since last successful watermark" not "the last hour" | K8s CronJob docs |
| Time zone / DST | explicit `.spec.timeZone` (stable 1.27); schedule in UTC unless business-local time matters; test DST transitions | K8s docs |
| Silent failure | heartbeat/dead-man's-switch monitoring (alert if job didn't *succeed* by time X), record last success timestamp | [OPINION; e.g. Healthchecks.io/Cronitor pattern] |
| Thundering herd at :00 | jitter/offset minutes; GitHub Actions `schedule` delays at top of hour and may drop jobs | GitHub docs schedule note |
| Long jobs killed by deploys | make jobs resumable/chunked; checkpoint progress; handle SIGTERM | [OPINION] |
| Hidden cron on one server | schedule in code/IaC, visible, owned | [OPINION] |

### B14.2 Background job queues (complements E §4.6)
- **Postgres-backed** (no extra infra, **transactional enqueue** with the business write): Rails 8 default **Solid Queue** (uses `FOR UPDATE SKIP LOCKED`; MySQL 8+/MariaDB 10.6+/PostgreSQL 9.5+; SQLite without it) (https://github.com/rails/solid_queue); **pg-boss** (Node; SKIP LOCKED, cron, retries/backoff, DLQ, transactional send via ORM adapters) (https://timgit.github.io/pg-boss); **Graphile Worker** (Node; LISTEN/NOTIFY low latency, enqueue in same transaction) (https://worker.graphile.org/docs); Oban (Elixir), River (Go) [known].
- **Redis-backed**: BullMQ (Node), Sidekiq (Ruby), Celery/RQ (Python) — Celery default `acks_late=False` means a crash mid-task loses the task unless configured [UNVERIFIED default — check Celery docs]; configure Redis persistence (AOF) & `maxmemory-policy noeviction` for queues [OPINION].
- Rules (in addition to E §4.6): job args = IDs + version; idempotency key per job; max attempts + exponential backoff with jitter; DLQ + replay tooling; per-queue concurrency limits protect downstreams; separate queues by latency class (critical vs bulk); unique jobs for "sync user X" debouncing; visibility of queue depth *and* oldest-job age; shutdown drains workers (B4.4).

### B14.3 Durable execution: when a queue is not enough
- Definition: write the workflow as ordinary code; the engine persists each step's result (event history/journal) and, after crash/deploy, **replays** the orchestration code feeding recorded results so it resumes where it left off (Temporal https://docs.temporal.io/evaluate/understanding-temporal, https://docs.temporal.io/workflow-execution).
- Temporal: **workflow code must be deterministic** (no direct time/random/IO — use SDK APIs); side effects live in **activities**, which are **at-least-once** → activities must be idempotent; retries/timeouts configured per activity; versioning/patching needed when changing workflow code with in-flight executions (https://docs.temporal.io). Temporal also offers "Standalone Activities" as a job-queue replacement (https://docs.temporal.io/evaluate/features/job-queue) [feature status UNVERIFIED].
- Inngest: "durable functions replace queues, state management, and scheduling"; functions composed of `step.run` steps that are retried individually, can run "for months", with flow control (concurrency per key, throttling, debouncing, rate limiting, priority) (https://github.com/inngest/inngest).
- Restate: durable execution with journaled steps, "exactly-once" service-to-service communication, durable promises/timers (https://github.com/restatedev/restate).
- Others: AWS Step Functions (state machine JSON/ASL; Standard vs Express [UNVERIFIED specifics]), Cloudflare Workflows, DBOS (Postgres-backed library), Azure Durable Functions [known names].

| Need | Use |
|---|---|
| Fire-and-forget single task (send email, resize image) | job queue |
| Periodic task | scheduler → enqueue job (don't do work inside the scheduler) |
| Multi-step process with compensations (order: reserve stock → charge → ship; refund on failure) = **saga** | durable execution (or hand-rolled state machine table + outbox if small) |
| Waits for humans/external events for hours–weeks (approvals, KYC, trial expiry) | durable execution (durable timers/signals) |
| Fan-out/fan-in with aggregation | durable execution or queue + counter table |
| AI agent loops with tool calls needing resumability | durable execution (Temporal/Inngest/Restate market this) |
| Data pipelines/ETL with lineage, backfills, partitions | data orchestrator (Airflow: task DAGs; Dagster: asset-oriented) — [brief; Dagster "software-defined assets" framing UNVERIFIED in this pass] |
Rules: every external side effect idempotent (idempotency keys to payment APIs); compensation steps for sagas are themselves idempotent and retryable; store workflow IDs derived from business keys (dedupe starts: one workflow per `order_id`); don't put large payloads in workflow history; plan code versioning for long-running workflows [OPINION + Temporal docs].

## B15. Observability wiring in the deploy pipeline

- **Release identity everywhere**: same version string (git SHA) in build metadata, container label, `APP_VERSION` env, OTel resource attribute `service.version` and deployment env attribute (`deployment.environment.name` in current OTel semconv [UNVERIFIED exact key/version]), error tracker `release`, log fields (E §4.13 for logging basics).
- **Error tracking releases**: Sentry releases associate errors with a release/deploy, enable regression detection ("resolved in next release"), suspect commits via SCM integration, and **source map / debug symbol upload** at build time (don't serve source maps publicly) (https://docs.sentry.io/product/releases/ [known], https://docs.sentry.io/guides/integrate-frontend/configure-scms/; Sentry release GitHub Action https://github.com/marketplace/actions/sentry-release).
- **Deploy markers**: annotate dashboards with deploys, config changes, flag flips (Honeycomb markers https://docs.honeycomb.io/configure/environments/manage-markers; Grafana annotations; Datadog deployment tracking [known]). Flag changes are deploys too (A12).
- **Per-version health**: dashboards/alerts sliced by `service.version` — canary analysis compares new vs baseline error rate, latency, saturation, and business KPIs.
- **Smoke tests & synthetic checks** after every deploy; verify the deployed version via `/version`.
- **DORA from events**: emit deploy start/finish/rollback events (GitHub Deployments API/environments) to compute deployment frequency, lead time, change fail rate, recovery time, rework rate (B1).
- Log/trace privacy: never log secrets/config values (playbook `observability/logs-privacy.md`).

## B16. Cost awareness in environments & deploys (complements E §4.17)

- Tag every resource with `env`, `service`, `owner`, `cost-center`; budgets + anomaly alerts per account/env (separate accounts give per-env bills for free — A7).
- Non-prod: scale-to-zero or schedule shutdown nights/weekends; TTL on previews; smaller DB tiers but same engine/version; delete orphaned volumes/snapshots/load balancers/IPs [OPINION].
- Egress & NAT: cross-AZ/region transfer and NAT gateway processing are silent cost drivers (E §4.17); 37signals' S3 exit involved a ~$250k egress bill (waived) — egress cost is a lock-in mechanism (B12 sources).
- CI cost: cache aggressively, cancel superseded runs, right-size runners, avoid running full e2e on every push to every branch.
- Serverless: INIT billing change (B13); watch concurrency × duration at sustained load.
- Kubernetes: requests drive node count → right-size requests; cluster autoscaler + bin packing; idle namespaces.
- Observability cost: log volume, high-cardinality metrics, trace sampling per env (lower in preview/staging).

---

# PART C — TEMPLATES & SNIPPETS

## C1. Env schema — TypeScript (t3-env + Zod v4)
```ts
// src/env.ts — the ONLY file that reads process.env
import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  server: {
    APP_ENV: z.enum(["local", "test", "preview", "staging", "production"]), // label for telemetry, not for branching
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    DATABASE_URL: z.url(),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    SESSION_SECRET: z.string().min(32),               // no default, ever
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
    PAYMENTS_MODE: z.enum(["sandbox", "live"]),
    ENABLE_SIGNUPS: z.stringbool().default(true),     // not z.coerce.boolean() — "false" would be true
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
  },
  clientPrefix: "PUBLIC_",
  client: {
    PUBLIC_API_BASE_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

// cross-field invariants that a schema per key can't express
if (env.PAYMENTS_MODE === "live" && !env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
  throw new Error("PAYMENTS_MODE=live requires a live Stripe key");
}
if (env.APP_ENV !== "production" && env.PAYMENTS_MODE === "live") {
  throw new Error("Only production may use live payments");
}
```
(`z.url()`/`z.stringbool()` are Zod v4 APIs per t3-env docs; `@t3-oss/env-core` API per https://env.t3.gg/docs/core.)

## C2. Env schema — Python (pydantic-settings)
```python
# app/settings.py
from typing import Literal
from pydantic import AnyUrl, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", secrets_dir="/run/secrets", frozen=True)

    env: Literal["local", "test", "preview", "staging", "production"]
    port: int = Field(8080, ge=1, le=65535)
    log_level: Literal["debug", "info", "warning", "error"] = "info"
    database_url: AnyUrl
    session_secret: SecretStr = Field(min_length=32)   # no default
    payments_mode: Literal["sandbox", "live"]

    @model_validator(mode="after")
    def live_only_in_prod(self):
        if self.payments_mode == "live" and self.env != "production":
            raise ValueError("live payments only in production")
        return self

settings = Settings()  # instantiate at import → process fails fast on bad config
```
(`secrets_dir` reads one file per field, matching Docker/K8s mounted secrets [per pydantic-settings docs; verify `env_prefix` interaction with secrets files — known issue threads #30/#508].)

## C3. `.env.example`
```dotenv
# Copy to .env (git-ignored). Every key here must exist in src/env.ts and vice versa (checked in CI).
APP_ENV=local
PORT=8080
LOG_LEVEL=debug
DATABASE_URL=postgres://app:app@localhost:5432/app      # from compose.yaml
DB_POOL_MAX=5
SESSION_SECRET=change-me-to-32+-random-chars-for-local-only
STRIPE_SECRET_KEY=sk_test_xxx                           # Stripe TEST key only
PAYMENTS_MODE=sandbox
ENABLE_SIGNUPS=true
PUBLIC_API_BASE_URL=http://localhost:8080
```

## C4. `compose.yaml` for local backing services
```yaml
services:
  db:
    image: postgres:17@sha256:<digest>          # same major as prod
    environment: { POSTGRES_USER: app, POSTGRES_PASSWORD: app, POSTGRES_DB: app, TZ: UTC }
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      retries: 10
  mail:
    image: axllent/mailpit:<version>            # catches all outgoing mail locally
    ports: ["8025:8025", "1025:1025"]
  app:
    build: .
    env_file: .env
    depends_on:
      db: { condition: service_healthy }        # wait for ready, not just started
    ports: ["8080:8080"]
    profiles: ["full"]                           # `docker compose --profile full up` runs app in a container too
volumes: { pgdata: {} }
```

## C5. `.dockerignore`
```
.git
.github
.env
.env.*
!.env.example
**/node_modules
dist
coverage
*.log
.aws
.npmrc
.terraform
Dockerfile*
compose*.yaml
```

## C6. Dependabot for actions & base images
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: github-actions   # bumps pinned SHAs + version comments
    directory: /
    schedule: { interval: weekly }
  - package-ecosystem: docker           # bumps FROM tags + digests
    directory: /
    schedule: { interval: weekly }
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
```
(Dependabot supports a `cooldown` option to delay adopting brand-new versions [UNVERIFIED — added 2025?].)

## C7. Kubernetes CronJob with safe defaults
```yaml
apiVersion: batch/v1
kind: CronJob
metadata: { name: nightly-billing }
spec:
  schedule: "17 2 * * *"            # off the top of the hour
  timeZone: "Etc/UTC"               # explicit (stable since v1.27)
  concurrencyPolicy: Forbid         # default is Allow → overlaps
  startingDeadlineSeconds: 600      # skip if it can't start within 10 min (catch up via watermark instead)
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  jobTemplate:
    spec:
      backoffLimit: 2
      activeDeadlineSeconds: 3600
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: job
              image: registry.example.com/app@sha256:<digest>   # same release as the web app
              args: ["node", "dist/jobs/billing.js"]            # idempotent, processes since last watermark
```

---

# PART D — CHECKLISTS & AGENT GUARDRAILS

## D1. New service / new environment checklist
- [ ] Config schema module; startup validation; `.env.example`; no defaults for secrets.
- [ ] Secrets in a manager or eliminated via workload identity; nothing secret in repo, image, client bundle, logs.
- [ ] Separate cloud account/project for prod; nonprod isolated; CI uses OIDC roles scoped per environment.
- [ ] Same artifact promoted by digest; version visible at `/version` and in telemetry.
- [ ] IaC for all resources incl. alerts/dashboards; remote state with locking; plan-in-PR, apply-from-CI; drift check scheduled.
- [ ] Backing services same type/major version in every env; local via Compose with healthchecks.
- [ ] Health endpoints (readiness vs liveness) and graceful SIGTERM shutdown within grace period.
- [ ] Deployment strategy chosen (rolling/canary/blue-green) with automated health gates and a tested rollback.
- [ ] Migrations run as a pipeline step; expand/contract; backups before destructive changes.
- [ ] Preview envs per PR with isolated/anonymized data and TTL teardown (if applicable).
- [ ] Error tracking with releases + source maps; deploy markers; per-version dashboards; alerts on SLOs.
- [ ] Scheduled jobs idempotent, non-overlapping, explicit TZ, dead-man's-switch monitoring.
- [ ] Tags for cost allocation; budgets and anomaly alerts; non-prod scale-down.
- [ ] Runbook: deploy, rollback, rotate a secret, restore from backup.

## D2. PR review checklist for pipeline/infra changes
**Workflow files**: third-party actions SHA-pinned (with version comment) · `permissions:` minimal per job · no `${{ github.event.* }}` inline in `run:` · no `pull_request_target`/`workflow_run` executing PR code · secrets only in jobs that need them, via environments · `id-token: write` only on deploy jobs · timeouts set · CODEOWNERS approval.
**Dockerfile**: pinned base (tag+digest) · multi-stage · non-root USER with explicit UID · exec-form CMD · no secrets in ARG/ENV/COPY · `.dockerignore` covers `.env`, `.git` · hadolint clean · image scanned.
**IaC**: plan attached and reviewed · no destroy/replace of stateful resources unexpected · IAM least privilege (no `*:*`) · encryption/public-access settings · tags · provider/module versions pinned · sensitive outputs marked.
**K8s manifests**: image by digest · requests set (memory limit) · probes correct (liveness not dependent on DB) · preStop/grace period · securityContext (non-root, drop caps, read-only FS) · PDB & spread · no secrets in plain manifests.
**Config change**: validated against schema · staged rollout · consumer limits (size/count) respected · rollback = revert commit.

## D3. Leaked secret runbook (short)
1) Revoke/rotate immediately → 2) check usage logs for the exposure window → 3) purge from logs/CI logs/history as appropriate → 4) notify per incident policy → 5) add detector/pre-commit rule → 6) postmortem: why was a long-lived secret reachable? (OWASP §9.2; playbook secrets README.)

## D4. Deploy safety checklist (per release)
- [ ] CI green on the exact commit; image digest recorded; attestations/scans passed.
- [ ] Migrations backward compatible with the running version (N and N+1 coexist).
- [ ] New config keys present in all target envs *before* deploy; flags default off.
- [ ] Canary/rolling with automated analysis; rollback path known (previous digest).
- [ ] Deploy marker + release created in error tracker; dashboards filtered by version.
- [ ] Smoke test verifies correct env wiring (e.g. prod not pointing at staging DB).
- [ ] Post-deploy watch window; DORA events recorded.

## D5. Failure modes of AI coding agents in this domain → rule for skills [OPINION, informed by sources above]

| Agent failure | Rule |
|---|---|
| Hardcodes API keys / writes real-looking secrets into code, tests, README, `.env` committed | Never write secret values; use `.env.example` placeholders; ensure `.env` git-ignored; suggest secret manager; run a secret scan before finishing |
| Adds fallback defaults for secrets (`?? "dev-secret"`) | Secrets are required with no default; crash if missing |
| Reads `process.env.X` all over the codebase | Central typed config module; import from it |
| Puts server secret in `NEXT_PUBLIC_`/`VITE_` var to "make it work" on the client | Client-prefixed vars are public; move the call server-side |
| Branches on `NODE_ENV`/`APP_ENV` to change behavior | Introduce specific settings/flags |
| Uses `latest` / unpinned base images and actions by tag (`@v4`) | Pin by digest / full SHA with version comment; add Dependabot; never invent SHAs or digests — look them up or leave explicit placeholders |
| `permissions: write-all` or omits permissions in workflows | Explicit minimal permissions per job |
| Uses `pull_request_target` to get secrets for fork PR tests | Use `pull_request`; split privileged work; never execute PR code with secrets |
| Stores AWS access keys as GitHub secrets | OIDC federation with environment-scoped trust |
| Runs container as root, `npm start` as CMD, no SIGTERM handling | Non-root user, exec-form CMD, graceful shutdown handler |
| Runs DB migrations on app startup in every replica | Separate migration step/job; expand/contract |
| Proposes Kubernetes/Helm/service mesh for a small app | Apply B10 decision questions; default to PaaS/managed containers/Kamal |
| Copies prod DB into staging/preview "for realism" | Anonymized/synthetic data only |
| Adds cron inside web process (every replica runs it) | Single scheduler + idempotent jobs + locks |
| Treats staging pass as proof of safety | Progressive delivery + observability in prod |
| "Fixes" a failing deploy by editing resources in the cloud console | Change IaC; console is read-only; detect drift |
| Retries non-idempotent side effects (charge, email) in workflows | Idempotency keys; at-least-once assumption |
| Logs full config/env at startup for debugging | Log keys + non-secret values + hashes only |
| Leaves preview/test infra running | TTL/teardown; tags; budgets |
| Deploys by rebuilding per environment | Build once, promote digest |

---

# PART E — SOURCES

## Local clones (scratchpad `refs7/`, `refs5/`)
- Microsoft Code-With Engineering Playbook — https://github.com/microsoft/code-with-engineering-playbook : `docs/CI-CD/continuous-integration.md`, `continuous-delivery.md`, `dev-sec-ops/secrets-management/{README,secrets_rotation,credential_scanning}.md`, `dev-sec-ops/dependency-and-container-scanning.md`, `gitops/deploying-with-gitops.md`, `gitops/secret-management/{README,secret-rotation-in-pods}.md`, `recipes/terraform/terraform-structure-guidelines.md`, `developer-experience/{devcontainers-getting-started,fake-services-inner-loop}.md`.
- Node.js Best Practices (Goldberg et al.) — https://github.com/goldbergyoni/nodebestpractices : §5.15–5.19, §8.1–8.15 (Docker, credited to Bret Fisher), `sections/docker/*.md`.
- T3 Env — https://github.com/t3-oss/t3-env, docs https://env.t3.gg
- Twelve-Factor (original + 2024 open-source revival) — https://github.com/heroku/12factor , https://github.com/twelve-factor/twelve-factor , https://12factor.net/blog
- GitHub Docs (sparse) — https://github.com/github/docs : `content/actions/reference/security/{secure-use,securely-using-pull_request_target,oidc}.md`, `content/actions/concepts/security/{openid-connect,compromised-runners,artifact-attestations}.md`, `how-tos/secure-your-work/security-harden-deployments/oidc-in-aws.md`, `reference/workflows-and-actions/events-that-trigger-workflows.md`.
- Docker Docs (sparse) — https://github.com/docker/docs : `content/manuals/build/building/{best-practices,secrets,multi-stage}.md`, `build/cache/optimize.md`, `compose/how-tos/{startup-order,production,environment-variables/best-practices}.md`.
- hadolint rules — https://github.com/hadolint/hadolint
- OWASP Cheat Sheet Series — Secrets Management, CI/CD Security, Docker Security, Infrastructure as Code Security (https://cheatsheetseries.owasp.org).
- Kubernetes Failure Stories (Henning Jacobs) — https://k8s.af (source moved to Codeberg).
- Dan Luu post-mortems — https://github.com/danluu/post-mortems (Config Errors section).
- Kubernetes docs (raw) — container lifecycle hooks, CronJobs, resource management (https://kubernetes.io/docs/…).
- READMEs: mise, devbox, dev containers spec, Inngest, Restate, envalid, Kamal proxy docs.

## Web (searched 2026-09)
- DORA: https://dora.dev/insights/dora-2025-year-in-review/ ; https://redmonk.com/rstephens/2025/12/18/dora2025/ ; https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report ; https://getdx.com/blog/2024-dora-report/ ; https://cloud.google.com/devops/state-of-devops
- tj-actions: https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction ; https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066
- SHA pinning policy: https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions/
- Shai-Hulud: https://www.wiz.io/blog/shai-hulud-npm-supply-chain-attack ; https://www.wiz.io/blog/shai-hulud-2-0-ongoing-supply-chain-attack ; https://unit42.paloaltonetworks.com/npm-supply-chain-attack/
- OpenTofu/Terraform: https://en.wikipedia.org/wiki/OpenTofu ; https://opentofu.org/manifesto/ ; https://www.env0.com/blog/opentofu-v1-7-enhanced-security-with-file-state-encryption ; https://developer.hashicorp.com/terraform/tutorials/state/resource-drift ; https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/backend.html
- AWS multi-account: https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html
- Testing in production: https://www.honeycomb.io/blog/i-test-in-prod ; https://thenewstack.io/honeycombs-charity-majors-go-ahead-test-in-production/
- Kamal/37signals: https://kamal-deploy.org/ ; https://www.theregister.com/2024/10/21/37signals_aws_savings/ ; https://www.datacenterdynamics.com/en/news/37signals-begins-exiting-aws-storage-service/
- Temporal: https://docs.temporal.io/evaluate/understanding-temporal ; https://docs.temporal.io/workflow-execution
- Neon: https://neon.com/branching/branch-per-preview ; https://neon.com/docs/workflows/data-anonymization
- Secret scanning comparisons (low authority): https://appsecsanta.com/secret-scanning-tools/gitleaks-vs-trufflehog
- K8s CPU limits: https://www.datadoghq.com/blog/kubernetes-cpu-requests-limits/ ; graceful shutdown: https://devopscube.com/kubernetes-pod-graceful-shutdown/ ; ndots: https://www.michal-drozd.com/en/blog/kubernetes-dns-caching-ndots/
- Lambda INIT billing: https://www.cloudyali.io/blogs/aws-lambda-cold-starts-now-cost-money-august-2025-billing-changes-explained
- Solid Queue: https://github.com/rails/solid_queue ; pg-boss https://timgit.github.io/pg-boss ; Graphile Worker https://worker.graphile.org/docs
- pydantic-settings: https://docs.pydantic.dev/latest/concepts/pydantic_settings/ ; envalid https://github.com/af/envalid
- Hardened images: https://www.docker.com/blog/docker-hardened-images-for-every-developer/ ; https://devclass.com/2025/12/18/docker-hardened-images-now-free-devs-give-cautious-welcome/
- Argo Rollouts analysis: https://www.infracloud.io/blogs/progressive-delivery-argo-rollouts-canary-analysis/
- Sentry releases/suspect commits: https://docs.sentry.io/guides/integrate-frontend/configure-scms/ ; Honeycomb markers https://docs.honeycomb.io/configure/environments/manage-markers
- Kubernetes-for-small-teams heuristics (low authority): https://encore.dev/articles/do-you-need-kubernetes

## Known-but-not-re-read in this pass (cite carefully)
Martin Fowler "Continuous Integration" (https://martinfowler.com/articles/continuousIntegration.html); Humble & Farley *Continuous Delivery* (2010); Google SRE Workbook "Canarying Releases"; DORA capability pages (trunk-based development, continuous delivery); Pete Hodgson "Feature Toggles" (martinfowler.com); Knight Capital write-up (dougseven.com).

## Suggested skill mapping
- `environments-and-config` (A1–A4, A11–A13, C1–C4): config taxonomy, typed validation, env matrix, local dev, config-change safety, env bugs.
- `secrets-management` (A5–A7, D3): hierarchy, injection, rotation, scanning, OIDC, account isolation — or fold into a security skill's references.
- `ci-cd-pipelines` (B1–B3, B7, C6, D2, D4): stages, speed, build-once, GitHub Actions hardening, migrations step, DORA.
- `containers` (B4, C5): Dockerfile rules/examples, graceful shutdown.
- `deployment-strategies` (B5–B6, B15): strategies, rollback vs roll-forward, observability wiring.
- `infrastructure-as-code` (B8–B9): Terraform/OpenTofu/Pulumi, state, drift, GitOps.
- `runtime-platforms` (B10–B13, B16): decision table, k8s essentials & failure patterns, Kamal/VMs, serverless/edge, cost.
- `jobs-and-workflows` (B14, C7): cron, queues, durable execution, sagas.
Router: the agent-guardrail table D5 can be split across the relevant skills' "Common mistakes" sections.
