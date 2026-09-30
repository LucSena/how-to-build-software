# Update Policy, Lockfiles, and Pinning

Use this file to set up Renovate or Dependabot, configure release-age cooldowns, choose pinning per ecosystem, review an update PR, or plan a major upgrade. Tool options are as of 2026-09; check current docs before copying config.

## Contents
1. The policy in one table
2. Cooldowns per tool
3. Bot configuration examples
4. Lockfiles and pinning per ecosystem
5. Reviewing an update PR
6. Major upgrades
7. Housekeeping cadence

## 1. The policy in one table

| Update kind | Default | Why |
|---|---|---|
| Security fix for a known vulnerability | Apply within days; bypass the cooldown for that package after verifying the fix release (provenance, changelog, diff) | OpenSSF: quickly update vulnerable dependencies |
| Patch/minor, dev dependency | Weekly, grouped, cooldown 3–7 days, automerge on green CI | Low risk, high volume |
| Patch/minor, runtime dependency | Weekly, grouped by ecosystem or family, cooldown 3–7 days, human merge (automerge only with strong test coverage) | Behavior can change in minors |
| Major | Human review with changelog and migration notes; one major per PR | Breaking changes by definition |
| Lockfile maintenance (refresh transitive versions) | Weekly or monthly | Keeps transitive deps from rotting; review the diff |
| Staleness bound | No dependency more than one major behind | Old versions make urgent security upgrades hard (OpenSSF) |

Cooldown rationale: OpenSSF recommends about 3 days for updates without known vulnerabilities, noting cooldowns counter the vast majority of malicious releases; William Woodruff found 8 of 10 prominent supply-chain attacks had windows under a week and argues for 7 days; the chalk/debug versions in 2025 were live for about two hours. Pick 3–7 days; longer (lirantal's template uses 30) trades freshness for safety.

## 2. Cooldowns per tool

| Tool | Setting | Unit | Since |
|---|---|---|---|
| npm | `min-release-age` in `.npmrc` | days | 11.10 |
| pnpm | `minimumReleaseAge` (+ `minimumReleaseAgeExclude`) in `pnpm-workspace.yaml` | minutes | 10.16; pnpm 11 reported to default to 1440 (one day) |
| Yarn | `npmMinimalAgeGate` (+ `npmPreapprovedPackages`) in `.yarnrc.yml` | duration string (`"3d"`) | 4.10 |
| Bun | `minimumReleaseAge` (+ `minimumReleaseAgeExcludes`) under `[install]` in `bunfig.toml` | seconds | 1.3 |
| pip | Dependency cooldowns reported in pip 26.1 (2026-05) — check `pip install --help` for the option name | — | 26.1 |
| uv | `exclude-newer` (a cutoff date; check whether your version accepts relative durations) | timestamp | — |
| Renovate | `minimumReleaseAge`, or the `security:minimumReleaseAgeNpm` preset (3 days; also `…Pypi`, `…Crate`) | duration string | — |
| Dependabot | `cooldown` with `default-days`, `semver-major-days`, `semver-minor-days`, `semver-patch-days` | days | — |
| Snyk | Built-in: upgrade PRs skip versions younger than 21 days | — | — |

Renovate caveat: its `minimumReleaseAge` is not enforced for lockfile maintenance, replacement, pin, bump, lockfile-update, or rollback updates. Pair it with a package-manager-level cooldown so installs are protected too.

## 3. Bot configuration examples

Renovate (`renovate.json`):
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:best-practices"],
  "minimumReleaseAge": "3 days",
  "schedule": ["before 6am on monday"],
  "packageRules": [
    { "matchDepTypes": ["devDependencies"], "matchUpdateTypes": ["patch", "minor"], "automerge": true },
    { "matchPackageNames": ["@types/**"], "groupName": "type definitions" },
    { "matchUpdateTypes": ["major"], "dependencyDashboardApproval": true }
  ]
}
```
`config:best-practices` extends `config:recommended` and adds digest pinning for Docker images and GitHub Actions, dev-dependency pinning, abandoned-package flags, the npm release-age preset, and weekly lockfile maintenance. Use `config:js-app` (pin everything except peer dependencies) for applications and `config:js-lib` (pin only dev dependencies) for published libraries.

Dependabot (`.github/dependabot.yml`):
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    cooldown:
      default-days: 5
      semver-major-days: 14
    groups:
      dev-tooling:
        dependency-type: development
        update-types: [minor, patch]
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```
Confirm in the bot's docs how it treats security updates relative to the cooldown; security fixes should not wait.

## 4. Lockfiles and pinning per ecosystem

**Rules that hold everywhere:** commit the lockfile; install from it read-only in CI; change manifest and lockfile in the same commit; regenerate the whole lockfile only intentionally, never as a side effect.

| Ecosystem | Lockfile | Notes |
|---|---|---|
| npm | `package-lock.json` (integrity hashes) | Not published with a library. `npm-shrinkwrap.json` is published — use only for standalone CLIs whose author takes responsibility for the whole tree |
| pnpm / Yarn / Bun | `pnpm-lock.yaml` / `yarn.lock` / `bun.lock` | Frozen/immutable install flags in CI |
| Python | `uv.lock`, `poetry.lock`, or `requirements.txt` compiled with hashes (`pip-compile --generate-hashes`) and installed with `pip install --require-hashes` | PEP 751 defines a standard `pylock.toml`; tool support is still arriving |
| Go | `go.sum` + the checksum database | Modules are immutable and minimal version selection makes builds reproducible without a separate lockfile; `go mod tidy` prunes |
| Rust | `Cargo.lock` | Commit for binaries; many libraries commit it too for reproducible CI |
| Swift | `Package.resolved` | Commit for apps |
| Gradle | Dependency locking + `verification-metadata.xml` | Verification checks artifact checksums/signatures |
| CocoaPods | `Podfile.lock` | Commit |

**Applications vs libraries** (OpenSSF npm guide, Renovate presets):
- Applications and services: commit the lockfile, deploy from it, pin runtime and dev dependencies.
- Libraries: declare runtime dependencies as ranges so consumers can dedupe and patch; pin dev dependencies; commit a lockfile for local reproducibility. OpenSSF additionally suggests a CI job that ignores the lockfile to test against the newest versions in your ranges, run with least privilege.

**Vendoring** (Go `vendor/`, copied sources): builds survive registry outages and diffs are reviewable, but updates are manual and advisories easy to miss. Track vendored versions in an SBOM and issue your own advisory when you update one for a vulnerability.

## 5. Reviewing an update PR

- [ ] Read the changelog or release notes; for majors, the migration guide.
- [ ] Inspect the lockfile diff: new packages (especially new transitive ones), new install scripts, `resolved` URLs outside your registry, git or tarball sources. In the 2026 axios compromise, the only visible change was one new dependency.
- [ ] Check provenance/trust did not regress (pnpm `trustPolicy`, `npm audit signatures`).
- [ ] Run the full test suite and a production build (OpenSSF: test every dependency change).
- [ ] For front-end packages, compare bundle size.
- [ ] Merge security fixes first; don't bundle them with unrelated majors.

Anti-patterns: blind `npm update` or `npx npm-check-updates -u` across the whole tree; regenerating the lockfile to "fix" a conflict; merging a red build because "it's just a dependency bump".

## 6. Major upgrades

- [ ] One major per PR (frameworks and their plugins together only when they must move in lockstep).
- [ ] Read the migration guide; run official codemods where they exist.
- [ ] Fix deprecation warnings on the current major first — they usually become the breaking changes.
- [ ] Upgrade in a branch, run the full suite, then a staging or preview deploy before production.
- [ ] For widely used runtime libraries, check whether transitive dependencies also need to move (peer-dependency conflicts).
- [ ] Record the upgrade and any behavior changes in the PR description.

## 7. Housekeeping cadence

- **Weekly:** bot PRs merged or triaged; lockfile maintenance reviewed.
- **Monthly:** `knip`/`deptry`/`go mod tidy` for unused dependencies; review the install-script allow-list; check for packages flagged as abandoned or deprecated.
- **Quarterly:** compare dependency counts and bundle budgets with the last quarter; revisit the one-library-per-job list; check that no dependency is more than one major behind.

## Sources

- OpenSSF, "Concise Guide for Developing More Secure Software": https://best.openssf.org/Concise-Guide-for-Developing-More-Secure-Software
- OpenSSF, "Simplifying Software Component Updates": https://best.openssf.org/Simplifying-Software-Component-Updates
- OpenSSF, npm best practices (lockfiles, shrinkwrap, CI): https://github.com/ossf/package-manager-best-practices/blob/main/published/npm.md
- Renovate presets (`config:best-practices`, `config:js-app`, `config:js-lib`, `security:minimumReleaseAgeNpm`): https://github.com/renovatebot/renovate/tree/main/lib/config/presets/internal · docs: https://docs.renovatebot.com/configuration-options/#minimumreleaseage
- Dependabot options (`cooldown`, `groups`): https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference
- Liran Tal, npm security best practices (cooldown configs for npm, pnpm, Yarn, Bun, Snyk): https://github.com/lirantal/npm-security-best-practices
- William Woodruff, "We should all be using dependency cooldowns" (2025): https://blog.yossarian.net/2025/11/21/We-should-all-be-using-dependency-cooldowns
- pip 26.1 (InfoQ): https://www.infoq.com/news/2026/05/pip-261-dependency-cooldowns/
- PEP 751 (lock file format): https://peps.python.org/pep-0751/
