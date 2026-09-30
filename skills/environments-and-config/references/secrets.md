# Secrets

Where secrets live, how they reach the workload, how to rotate them without downtime, how to catch leaks, and what to do when one leaks. CI-side details (OIDC trust policies, workflow hardening) live in `deployment-and-infrastructure`; this file covers the secret itself.

## Contents
1. Preference ladder
2. Injection methods
3. Kubernetes and GitOps
4. Per-environment separation
5. Rotation without downtime
6. Detection and prevention
7. CI/CD secrets and the 2025 supply-chain lessons
8. Leaked-secret runbook
9. Rules catalog

## 1. Preference ladder

| Rung | Mechanism | Notes |
|---|---|---|
| 1 | **Workload identity** — the compute has a cloud identity (IAM role for a task/pod/function, GCP Workload Identity, Azure Managed Identity); CI uses **OIDC federation** | No secret exists to leak or rotate. The Microsoft playbook calls managed identities "the recommended choice": not on developer machines, not in source control, no rotation |
| 2 | **Dynamic secrets** — a broker (e.g., Vault/OpenBao database engine) issues per-consumer, short-lived credentials | OWASP: a dynamic secret is invalidated when its consumer goes away |
| 3 | **Secret manager reference** — AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, Vault/OpenBao, Doppler, Infisical, 1Password | Fetched at start (SDK or agent) or mounted as files by the platform |
| 4 | **CI/CD platform secrets** — GitHub/GitLab secrets, scoped to protected environments | OWASP CI/CD guidance: no "big" secrets there; know who can read them; forks must not get them |
| 5 | **Plain env var injected by the platform** | Common on PaaS; lowest rung |

**Never:** git (private repos too — the Microsoft playbook assumes any repo may go public), Docker `ARG`/`ENV`/`COPY` into layers, client bundles or public env prefixes, URLs and query strings, logs, error messages and crash dumps, tickets and chat, unencrypted IaC state (state files can contain sensitive values — store state encrypted with restricted access).

## 2. Injection methods

OWASP's Secrets Management Cheat Sheet (§5.1) compares them:

| Method | Pros | Cons |
|---|---|---|
| Mounted files (tmpfs volume placed by the orchestrator) | Not visible in process listings or env dumps; can update in place for hot rotation if the app re-reads | App must read files; never bake them into the image |
| In-memory fetch from the secret store (SDK, sidecar, agent) | No copy on disk; supports dynamic secrets | Startup dependency on the store; cache and retry carefully |
| Environment variables | Universal, easy | Readable by the whole process tree, can land in logs and dumps; **do not change on rotation** without a restart. OWASP: "not recommended unless the other methods are not possible" |

Mitigations when env vars are the only option: never log the environment or config values; do not pass the full environment to child processes; disable or scrub debug endpoints and crash dumps; keep the high-value secrets on a higher rung.

## 3. Kubernetes and GitOps

- Default: reference an external vault through **External Secrets Operator** or the **Secrets Store CSI driver**. The Microsoft playbook's GitOps guidance: referencing secrets in an external key vault is the recommended approach, easier to rotate and more scalable.
- Mounted secret volumes update in place; env vars from `secretKeyRef` need a pod restart (tools such as Stakater Reloader automate the restart).
- If secrets must live in git (disconnected or pure-GitOps setups): **SOPS** (values encrypted with KMS or age; Flux supports it natively) or **Sealed Secrets** (cluster-held key; awkward across many clusters). Never plain `Secret` manifests in git — base64 is not encryption.
- Docker Compose: use `secrets:` (mounted files) rather than `environment:` for sensitive values.

## 4. Per-environment separation

- Every environment has its own secrets. A credential that works in both staging and prod is a prod credential stored with staging-level protection.
- Separate cloud accounts or projects per environment (see `environment-matrix.md`) mean even a misrouted secret cannot reach prod resources.
- Sandbox and test-mode credentials for third parties (payment test keys, email sandbox) in every non-prod environment; cross-field validation in the config module rejects a live key outside production.

## 5. Rotation without downtime

OWASP lifecycle: create → rotate → revoke → expire. Expire secrets where possible. Human passwords follow NIST: rotate on evidence of compromise, not on a calendar.

Zero-downtime rotation always overlaps two valid credentials (the Microsoft playbook calls this blue/green secret rotation):

1. **Create v2** while v1 stays valid (providers with two key slots support this natively).
2. **Roll consumers to v2** — restart, or let mounted-file consumers reload.
3. **Verify** from the provider's audit or access logs that nothing uses v1 any more. Do not skip this.
4. **Revoke v1.**

For keys you verify with (JWT signing, webhook secrets, cookie signing), accept both current and previous keys during the window (JWT `kid`, a list of webhook secrets), sign only with the current one.

Case — Cloudflare R2, 21 Mar 2025: during a credential rotation, the new credentials were deployed to the default environment instead of production because the `--env production` flag was omitted; the old credentials were then removed, and R2 authentication failed. Rules: tooling must require an explicit target environment; step 3 (verify the new credential is actually in use) is mandatory.

## 6. Detection and prevention

Three layers, because each one is bypassed sometimes:

| Layer | Tool examples | Role |
|---|---|---|
| Pre-commit hook | gitleaks, detect-secrets, git-secrets | Stops the secret before it enters history; developers can skip it |
| CI scan | TruffleHog (can check whether a found credential is live), gitleaks | Enforcement; also scan the full history once when adopting |
| Platform | GitHub secret scanning and push protection; partner auto-revocation | Blocks pushes of known token formats; notifies providers |

The Microsoft playbook: run scanning in the developer workflow, but enforce it in CI "to protect against developer error". Also: avoid `git add .` / `git add -A` habits in repos with local `.env` files; keep `.env*` in `.gitignore` and `.dockerignore`.

GitHub Actions specifics (GitHub "Secure use" reference): never store structured data (a JSON blob) as one secret — redaction works on exact strings; register derived values with `::add-mask::`; redaction is best-effort, so rotate any secret that reaches a log.

## 7. CI/CD secrets and the 2025 supply-chain lessons

- **tj-actions/changed-files (CVE-2025-30066, March 2025):** an attacker moved existing version tags of a popular action to malicious code that dumped runner memory and printed secrets into build logs; roughly 23,000 repositories used it. Workflows pinned to full commit SHAs were unaffected. Lesson for secrets: anything a CI job can read, a compromised dependency of that job can read.
- **Shai-Hulud npm worm (September 2025; a second wave in November 2025):** malicious package versions ran install scripts that harvested npm tokens, GitHub tokens, and cloud credentials from developer machines and CI, published them, and republished themselves using stolen npm tokens; the second wave hit hundreds of packages. Lesson: no long-lived publish or cloud tokens on laptops or CI runners.
- Resulting rules: OIDC instead of stored cloud keys; short-lived, narrowly scoped tokens; secrets only in the jobs and environments that need them; lockfile installs; dependency hygiene per `dependency-management`.

## 8. Leaked-secret runbook

Assume a secret is compromised the moment it is pushed anywhere — a feature branch, a fork, a CI log, a pasted screenshot.

1. **Revoke or rotate immediately** (section 5, compressed: create new → switch consumers → revoke old). Do this before cleanup.
2. **Check usage** in the provider's access logs for the exposure window; widen the incident if there is unexplained use.
3. **Purge** from logs, CI run logs, artifacts, and — if policy requires — git history. OWASP notes history rewrites break forks and links; the rotation is what protects you, not the rewrite.
4. **Record** who had access, when it was used, when it was rotated (OWASP §9.2).
5. **Notify** according to your incident and data-protection policy.
6. **Prevent recurrence:** add a detector rule or hook; ask why a long-lived secret was reachable at all and move it up the ladder.

Case — CircleCI, Dec 2022–Jan 2023: malware on an engineer's laptop stole an SSO session, the attacker reached production and exfiltrated customer secrets, and every customer was told to rotate everything. Design so that "rotate every secret" is a routine, scripted operation.

## 9. Rules catalog

### Replace stored cloud keys with identity
**Rule.** Give compute and CI a cloud identity; delete access-key secrets.
**Apply when.** Any workload or pipeline talking to AWS, GCP, or Azure.
**Do / Avoid.** Do assume an environment-scoped role via OIDC from CI. Avoid `AWS_ACCESS_KEY_ID` stored as a repository secret.
**Why.** A credential that does not exist cannot leak, expire badly, or need rotation; blast radius shrinks to one job's lifetime.

### Overlap credentials during rotation
**Rule.** Two valid credentials exist during every rotation; revoke the old only after logs show zero use.
**Apply when.** Any planned or emergency rotation.
**Do / Avoid.** Do create → roll → verify → revoke. Avoid revoke-then-create.
**Why.** Consumers do not all switch at once (caches, pods still starting, forgotten cron jobs); the gap is an outage.

### Scan in hook, CI, and platform
**Rule.** Secret scanning runs pre-commit, in CI (full history once), and as platform push protection.
**Apply when.** Every repository, from the first commit.
**Do / Avoid.** Do fail CI on a verified live credential. Avoid relying only on a hook developers can skip.
**Why.** Defense in depth: each layer has a known bypass.

## Sources

- OWASP Secrets Management Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- OWASP CI/CD Security Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html
- Microsoft Code-With Engineering Playbook: secrets management, secrets rotation, credential scanning, GitOps secret management — https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/CI-CD
- GitHub Docs, Secure use reference — https://docs.github.com/en/actions/reference/security/secure-use
- Cloudflare R2 incident, 21 Mar 2025 — https://blog.cloudflare.com/cloudflare-incident-march-21-2025/
- CISA alert on tj-actions/changed-files — https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction
- Wiz on tj-actions — https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066
- Wiz on Shai-Hulud — https://www.wiz.io/blog/shai-hulud-npm-supply-chain-attack , https://www.wiz.io/blog/shai-hulud-2-0-ongoing-supply-chain-attack
- CircleCI security incident report — https://circleci.com/blog/jan-4-2023-incident-report/
- Docker Compose secrets — https://docs.docker.com/compose/how-tos/use-secrets/
- Node.js Best Practices §8.4, §8.11 (.dockerignore, no build-time secrets) — https://github.com/goldbergyoni/nodebestpractices
