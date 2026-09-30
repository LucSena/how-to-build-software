# Environment Matrix

The set of environments, what may differ between them, how to isolate them, and how to use previews, staging, and production testing well. Includes data handling for lower environments and the config-change cases that motivate these rules.

## Contents
1. The environments and why each exists
2. Full matrix
3. What must not differ
4. Isolation: accounts, access, secrets
5. Preview environments and database branching
6. Staging: what it is for, and its limits
7. Testing in production safely
8. Seed, fixture, and anonymized data
9. Config changes are deploys
10. Debugging "works in X, not in Y"
11. Cases

## 1. The environments and why each exists

| Environment | Purpose | Skip when |
|---|---|---|
| Local | Fast inner loop; one command to running app | Never |
| CI | Ephemeral, reproducible verification per commit | Never |
| Preview (per PR) | Review the real change in a real deploy; test migrations per PR | Very small projects, or where previews are impractical (heavy data platforms) |
| Shared dev/integration | Integration of many services owned by different teams | Usually — previews replace it for most products |
| Staging (pre-prod) | Rehearse the exact artifact, migrations, and infra changes against prod-like topology | Very early products shipping behind flags straight to prod, with previews and good rollback |
| Production | Real users; may be several regions or cells | — |

Default for a small product: local, CI, previews, production — add staging when you need migration rehearsal, load tests, or partner sandbox integration that previews cannot provide.

## 2. Full matrix

| Dimension | Local | CI | Preview | Staging | Production |
|---|---|---|---|---|---|
| Artifact | local build, hot reload | built once per commit | same image as would ship | same digest prod will get | same digest |
| Data | seeds | fixtures, fresh DB per run | seeds or anonymized branch | anonymized or synthetic, prod-sized for perf tests | real |
| Secrets | dev-only, sandbox | none or OIDC test role | preview-scoped, low value | staging-only | prod-only, identity-based |
| Cloud account/project | none or sandbox | CI | nonprod | nonprod or dedicated | separate prod account |
| External integrations | fakes, sandboxes | fakes | sandboxes | sandboxes, partner test envs | live |
| Email/SMS/push | captured locally | captured | captured or allowlist | allowlisted recipients only | live |
| Feature flags | local overrides | both paths tested | per-PR overrides | mirrors prod targeting | real targeting |
| Scale | 1 | 1 | minimal, scale-to-zero | small but same topology (≥2 replicas, same load-balancer type) | real |
| Observability | local logs | test reports | same SDK, `environment=preview`, low sampling | full, own env tag | full; alerts page humans |
| Access | the developer | the pipeline | PR author, reviewers | engineers, mostly read | break-glass, audited |
| Lifetime | — | minutes | until PR closes, plus TTL | permanent | permanent |

The Microsoft playbook's criteria for a production-like environment: same OS and software, sized and configured the same way, mirrored network topology, and load tests after release.

## 3. What must not differ

Drift in any of these produces bugs that only appear in one place:

- Build artifact digest; language runtime version; base image; CPU architecture (or test both).
- Backing-service **type and major version** — 12-factor dev/prod parity: resist using different backing services in development and production (no SQLite locally with Postgres in prod, no in-memory queue locally with SQS in prod unless a contract test covers it).
- Schema and migration tooling; migrations applied by the pipeline in every environment.
- Config **schema** (same keys everywhere; only values differ).
- IaC modules (same modules, different variables) and network shape (private database, TLS termination point, proxies, egress rules).
- Server time zone (UTC) and default locale.

12-factor names three gaps to keep small: **time** (deploy in hours, not weeks), **personnel** (the people who write code deploy and watch it), **tools** (the same stack everywhere).

## 4. Isolation: accounts, access, secrets

- **Separate accounts/projects.** The AWS whitepaper "Organizing Your AWS Environment Using Multiple Accounts" separates production from non-production workloads and groups related workloads per production account (e.g., `widget-prod`, `widget-nonprod`). Use the equivalent project (GCP) or subscription (Azure) boundary elsewhere. The account boundary gives hard IAM, quota, billing, and blast-radius separation; a staging script with staging credentials cannot touch prod data.
- **Humans read-only in production consoles.** The Microsoft playbook recommends developer read-only access to cloud resources and changes through the pipeline. Break-glass access is time-boxed and audited.
- **CI roles per environment.** Deploy jobs assume an environment-scoped role via OIDC; plan roles are read-only, apply roles write.
- **Secrets per environment**, never shared (see `secrets.md`).
- **Tags on everything** (`env`, `service`, `owner`, `cost-center`); separate accounts give per-environment bills for free.

## 5. Preview environments and database branching

What: every PR deploys the full stack to its own URL (Vercel, Netlify, Render, Fly.io, Railway, Heroku review apps, or Kubernetes namespaces) with its own data.

Database per preview:
- Copy-on-write database branches (e.g., Neon) make a database per preview cheap; platform integrations create a branch per preview deployment and inject its `DATABASE_URL`.
- A branch of production **contains production PII**. Use anonymized branches (Neon can apply PostgreSQL Anonymizer static-masking rules at branch creation) or branch from a seeded, anonymized parent.
- Run migrations on the branch: every PR becomes a migration test.

Checklist:
- [ ] Deterministic URL per PR, posted on the PR.
- [ ] Isolated data (branch, schema, or namespace), migrations applied, seeds and test accounts created automatically.
- [ ] Preview-scoped, low-value secrets; sandbox integrations only.
- [ ] Fork PRs: GitHub does not pass secrets to `pull_request` workflows from forks. Previews for forks need a maintainer-approved path — never `pull_request_target` plus checkout of the fork's code.
- [ ] Third-party callbacks (OAuth redirect URIs, webhooks, CORS origins) solved with a proxy or a dedicated preview OAuth app; do not widen the production OAuth app to wildcard preview domains.
- [ ] Access protection (platform auth or password) and `noindex`.
- [ ] TTL, teardown on PR close, and a janitor for orphans — idle environments are a top cost leak.
- [ ] Same observability SDK, tagged `environment=preview` and `pr=<n>`, low sampling.

## 6. Staging: what it is for, and its limits

Good for:
- Integration with real third-party sandboxes and partner test environments.
- Migration rehearsal on production-sized, anonymized data (timing, locks).
- Load and capacity tests.
- Smoke tests of the exact digest before prod; validation that new config keys exist.
- IaC plan/apply rehearsal for infrastructure changes.
- UAT or demo sign-off where a process requires it.

Pitfalls and fixes:

| Pitfall | Fix |
|---|---|
| Drift (manual changes, different sizes, versions) | IaC-only changes, same modules, drift detection |
| Stale or unrealistic data | Scheduled reset from anonymized snapshot |
| Shared and always broken; teams queue for it | Previews for feature testing; staging as a pipeline stage |
| Secrets reused from prod | Per-environment secrets, separate account |
| Staging calling production services | Network separation; config validation rejects prod hosts outside prod |
| False confidence | Progressive delivery and production signals decide, not staging |

## 7. Testing in production safely

Charity Majors (Honeycomb) argues that every team already tests in production; the choice is whether to acknowledge it and build the tooling to do it safely, because distributed systems cannot be faithfully cloned into staging. The toolkit (mechanics in `reliability`):

- Feature flags and dark launches — deploy code off, release by flag, test with internal users first.
- Canaries with automated analysis — compare the new version's error rate and latency to the baseline and roll back automatically.
- Synthetic monitoring — scripted user journeys against production.
- Test tenants and accounts flagged in the data, excluded from billing and analytics.
- Shadow traffic for rewrites — mirror requests, discard responses, stub writes.
- Kill switches for risky features, tested in CI.

## 8. Seed, fixture, and anonymized data

| Data | Where | Rules |
|---|---|---|
| Test fixtures | Repo; per test | Small, deterministic, built by factories; each test creates what it needs (Node.js Best Practices advises against global seeds in tests) |
| Seeds | Local, preview | Idempotent (upserts); realistic volumes for pagination; edge cases (Unicode and very long names, RTL text, many time zones, empty states); test logins documented |
| Anonymized snapshots | Staging, previews | Masked at extraction, never raw; deterministic pseudonymization where joins or uniqueness matter |
| Synthetic data | Load tests, demos | Generated to match distributions, labeled as synthetic |

Never copy raw production PII to lower environments: they have weaker access control, and regulations such as GDPR and CCPA still apply. Masking techniques: faking, partial masking, noise, generalization, pseudonymization, subsetting with referential integrity, tokenization. Keep masking rules in code, reviewed; fail the pipeline when a new column tagged as PII has no rule.

## 9. Config changes are deploys

Dan Luu's post-mortems collection has a whole section of config errors, and recent large outages keep adding to it. Rules:

1. Config — including generated data files, feature-flag rules, WAF rules, routing tables — is version-controlled, reviewed, validated (schema, and size/count against the **consumer's** limits), and rolled out in stages with health gates, like code.
2. Consumers of runtime-reloaded config reject bad versions and keep last-known-good (fail static). Startup config fails fast.
3. Order: add new keys before the code that requires them; remove keys after code stops reading them.
4. Drift: schedule `terraform plan -refresh-only -detailed-exitcode` (exit code 2 means changes) or the OpenTofu equivalent and alert; reconcile by importing the change into code or re-applying.
5. Tools that target environments require the target explicitly — no implicit default environment.

## 10. Debugging "works in X, not in Y"

Walk this list before reading code:
1. Same digest? Check `/version` or the startup log in both.
2. Same config keys? Diff the config fingerprints logged at startup.
3. Same backing-service versions and extensions?
4. Same data shape? (Nulls, Unicode, volume, old rows written by earlier versions.)
5. Same time zone, locale, CPU architecture, filesystem case sensitivity?
6. Same network path? (Proxies, DNS search domains, egress allowlists, TLS trust store.)
7. Same resource limits? (Memory limit vs heap, CPU throttling.)
8. Same flag targeting?

## 11. Cases

| Case | What happened | Rule |
|---|---|---|
| Cloudflare R2, 21 Mar 2025 | Rotated credentials were deployed to the default environment because `--env production` was omitted; old credentials removed → R2 auth failures | Explicit, required environment targeting; verify before revoking |
| Cloudflare, 18 Nov 2025 | A database permissions change made a metadata query return duplicate rows; the generated feature file doubled, exceeded the proxy's preallocated limit, and the proxy panicked worldwide | Validate generated config against consumer limits; fail static |
| Cloudflare, 5 Dec 2025 | A killswitch change went out through the global configuration system instead of the gradual one and hit an untested code path → HTTP 500s | Staged rollout for config, emergency changes included; test the off path |
| GitHub, Aug 2024 | A database configuration change broke health-check responses and a read endpoint was marked unhealthy | Health checks are part of the config's blast radius; stage config |
| CircleCI, 4 Apr 2025 | An IAM gap let an operator's supposedly read-only investigation modify the WAF outside Terraform; legitimate traffic was blocked and responders could not find the change in IaC | Read-only consoles; all changes through IaC; drift detection |
| Heroku | A deployment process caused new config variables not to be used when the code already required them | Config before code; validate at boot |

## Sources

- The Twelve-Factor App: Config, Dev/prod parity — https://12factor.net/config , https://12factor.net/dev-prod-parity
- Microsoft Code-With Engineering Playbook, Continuous Delivery and Continuous Integration — https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/CI-CD
- AWS whitepaper, Organizing Your AWS Environment Using Multiple Accounts — https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html
- Neon: branch per preview, data anonymization — https://neon.com/branching/branch-per-preview , https://neon.com/docs/workflows/data-anonymization
- Charity Majors, testing in production — https://www.honeycomb.io/blog/i-test-in-prod
- Dan Luu, post-mortems (config errors) — https://github.com/danluu/post-mortems
- Cloudflare incidents — https://blog.cloudflare.com/cloudflare-incident-march-21-2025/ , https://blog.cloudflare.com/18-november-2025-outage/ , https://blog.cloudflare.com/5-december-2025-outage/
- GitHub availability report, Aug 2024 — https://github.blog/news-insights/company-news/github-availability-report-august-2024/
- CircleCI post-incident report, 4 Apr 2025 — https://discuss.circleci.com/t/post-incident-report-april-4-2025-circleci-ui-loading-build-triggering-issues/53208
- Heroku, "How I broke git push heroku main" — https://blog.heroku.com/how-i-broke-git-push-heroku-main
- Terraform drift tutorial — https://developer.hashicorp.com/terraform/tutorials/state/resource-drift
- Node.js Best Practices §4.5 (per-test data) — https://github.com/goldbergyoni/nodebestpractices
