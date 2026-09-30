# Supply-Chain Security for Dependencies

Use this file to harden installs and CI, set up provenance or SBOMs, review a suspicious lockfile diff, or respond to a compromised package. Configuration flags are as of 2026-09; verify them against current package-manager docs before copying. For the full narrative of each incident, see `lessons-from-failures` (`references/security-and-supply-chain.md`).

## Contents
1. Attack vectors and the control for each
2. Incident timeline
3. How registries and tools responded (2025–2026)
4. Reference install configs
5. CI hygiene
6. Provenance, trusted publishing, SBOMs, Scorecard
7. Agents and installs
8. Responding to a compromised package

## 1. Attack vectors and the control for each

| Vector | How it works | Primary control |
|---|---|---|
| Typosquatting | Near-miss names (`crossenv` for `cross-env`), case variants | Verify name against official docs and the registry; stop on near-misses |
| Slopsquatting | Attackers register names that AI assistants hallucinate | Never install a name you haven't verified; never "try a similar name" |
| Dependency confusion | A public package with your internal package's name and a higher version wins resolution | Scoped names; registry config that maps your scope to the private registry |
| Account takeover | Phished or leaked maintainer credentials publish a malicious version | Cooldowns; lockfiles; publishers use phishing-resistant 2FA and trusted publishing |
| Malicious handover | Maintainer transfers the package to a stranger | Watch maintainer changes and new transitive dependencies |
| Protestware / sabotage | A legitimate maintainer ships destructive code | Lockfiles, exact pins for build tools, cooldowns |
| Install scripts | `preinstall`/`postinstall` run arbitrary code at install time | Scripts off by default; allow-list |
| Tag repointing (CI actions) | A mutable tag is moved to a malicious commit | Pin to full commit SHAs |
| Script CDN takeover | A third-party script domain changes hands | Self-host, or pin with Subresource Integrity |
| Tampered release artifacts | Release tarball differs from repository source | Build from source that matches the repository |
| Lockfile injection | A PR edits `resolved` URLs to point at attacker hosts | `lockfile-lint` in CI; review lockfile diffs |

## 2. Incident timeline

| Date | Incident | Vector | Lesson |
|---|---|---|---|
| 2016-03 | left-pad unpublished | Maintainer removal | Trivial dependencies are still dependencies; the registry is part of your build |
| 2018-07 | eslint-scope malicious publish | Reused password → stolen npm token | Token hygiene, 2FA |
| 2018-11 | event-stream / flatmap-stream | Handover to a stranger who added a targeted wallet backdoor | Maintainer change is an invisible trust transfer |
| 2021-02 | Dependency confusion (Alex Birsan) | Public packages matching internal names | Scope and registry pinning |
| 2021-12 | Log4Shell (CVE-2021-44228) | Vulnerable transitive library evaluated lookups in logged data | SBOM so "are we affected?" takes minutes; patch fast |
| 2022-01 | colors / faker | Maintainer sabotage pulled in by caret ranges | Lockfiles and `npm ci` |
| 2024-03 | xz-utils backdoor (CVE-2024-3094) | Years of social engineering; payload only in release tarballs | Build from repository source; maintainer burnout is a security risk |
| 2024-06 | polyfill.io | Script CDN domain sold, then served malicious JS to 100,000+ sites (reported) | Self-host or SRI |
| 2025-03 | tj-actions/changed-files (CVE-2025-30066) | Tags repointed to a commit that printed CI secrets to logs; hash-pinned users were reported unaffected | Pin actions to SHAs; least-privilege tokens |
| 2025-08 | Nx "s1ngularity" | Malicious `postinstall` used local AI coding CLIs to search for secrets | Scripts off; agents never run untrusted installs with broad permissions |
| 2025-09 | chalk, debug, and 16 other packages | Maintainer phished via a look-alike domain (live TOTP captured); malicious versions live for about two hours | Cooldowns; phishing-resistant 2FA for publishers |
| 2025-09 and 2025-11 | Shai-Hulud worm, then "2.0" | Install scripts (including `preinstall`) stole tokens and republished victims' packages; hundreds of packages affected | Disable all lifecycle scripts; short-lived tokens; trusted publishing |
| 2026-03 | axios 1.14.1 / 0.30.4 | Hijacked maintainer account; the only change was a new dependency (pre-seeded with a clean version to build history) whose `postinstall` dropped a remote-access trojan | Review new transitive dependencies; cooldowns; scripts off; "has history" is not proof of trust |

## 3. How registries and tools responded (2025–2026)

- **npm / GitHub (announced 2025-09):** move publishing toward local publishing with required 2FA, short-lived granular tokens, and trusted publishing; deprecate legacy tokens and TOTP 2FA in favor of FIDO-based 2FA.
- **npm CLI:** `min-release-age` (days) and `allow-git` added in npm 11.10 (early 2026).
- **pnpm:** dependency build scripts off by default (10.0); `strictDepBuilds` (10.3); `minimumReleaseAge` (10.16); `trustPolicy: no-downgrade` (10.21); `allowBuilds` and `blockExoticSubdeps` (10.26). pnpm 11 was reported to default `minimumReleaseAge` to one day and `blockExoticSubdeps` to true.
- **Yarn 4.10+:** `npmMinimalAgeGate`. **Bun 1.3+:** `minimumReleaseAge`; dependency lifecycle scripts run only for `trustedDependencies`.
- **Bots:** Dependabot `cooldown`; Renovate `minimumReleaseAge` and `security:minimumReleaseAgeNpm`; Snyk upgrade PRs skip versions younger than 21 days.
- **Python:** pip 26.1 (2026-05) was reported to add dependency cooldowns and experimental lockfile support; PyPI supports trusted publishing.

## 4. Reference install configs

Start from these, then adjust the cooldown to your policy (OpenSSF suggests about 3 days; lirantal's template uses 30).

`.npmrc` (npm 11.10+):
```ini
ignore-scripts=true   # dependency lifecycle scripts off; also skips your own "prepare" — run needed scripts explicitly
allow-git=none        # reject git-sourced dependencies
min-release-age=3     # days
```

`pnpm-workspace.yaml` (pnpm 10.26+ / 11):
```yaml
minimumReleaseAge: 4320        # minutes (3 days)
minimumReleaseAgeExclude: []   # add a package only for an urgent, verified security fix
trustPolicy: no-downgrade      # refuse versions whose publish trust evidence regressed
allowBuilds:                   # explicit allow-list for dependency build scripts
  esbuild: true
strictDepBuilds: true          # fail on unreviewed build scripts
blockExoticSubdeps: true       # transitive deps may not come from git or raw tarball URLs
```

`bunfig.toml`:
```toml
[install]
minimumReleaseAge = 259200  # seconds (3 days)
```

`.yarnrc.yml`:
```yaml
npmMinimalAgeGate: "3d"
```

## 5. CI hygiene

- Install read-only from the lockfile: `npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`, `bun install --frozen-lockfile`, `deno install --frozen`, `uv sync --locked`. Never `npm install`, `npm update`, or `npx <unpinned>` in CI.
- Pin third-party GitHub Actions to a full 40-character commit SHA with a version comment (`uses: owner/action@<sha> # v4.2.0`); Renovate's `helpers:pinGitHubActionDigests` keeps them current.
- Set `permissions:` to the minimum (`contents: read` by default) and grant write scopes per job.
- Give secrets only to the steps that need them; never run untrusted PR code with secrets available.
- Validate lockfiles: `lockfile-lint` to ensure `resolved` URLs point only to your registry over HTTPS.
- Pin container base images by digest for reproducible builds (Renovate `docker:pinDigests`).

## 6. Provenance, trusted publishing, SBOMs, Scorecard

- **Trusted publishing (OIDC):** publish from CI with short-lived credentials instead of long-lived tokens; npm generates provenance automatically. Manual provenance: `npm publish --provenance` from a supported cloud CI runner. Consumers check signatures with `npm audit signatures`; pnpm's `trustPolicy: no-downgrade` refuses a version whose trust level dropped (for example, provenance present before, absent now).
- **Sigstore / cosign** for signing containers and other artifacts; **SLSA** levels describe build integrity.
- **SBOM:** generate and keep one per release in SPDX or CycloneDX format (tools such as `syft`, `cdxgen`, `npm sbom`, or your platform's dependency-graph export) so "are we affected by CVE-X?" is a query, not a week of grepping. The EU Cyber Resilience Act raises the bar for SBOMs and vulnerability handling for products sold in the EU.
- **OpenSSF Scorecard:** checks repositories for branch protection, pinned dependencies, token permissions, dangerous workflows, CI tests, fuzzing, and signed releases. Use it on candidates and on your own repo.
- **Vendoring:** survives registry outages and makes diffs reviewable, but updates are manual and easy to miss. If you vendor, you must issue your own advisory when you update a vendored component for a vulnerability (OpenSSF). Don't keep long-lived downstream forks; upstream your changes.

## 7. Agents and installs

- Verify the package name and identity before any install command (SKILL.md protocol).
- Run installs of unfamiliar packages with scripts disabled, in a container or devcontainer without `~/.ssh`, cloud credentials, or `.env` secrets.
- Don't run package-manager commands with auto-approval flags or broad tool permissions on a developer machine; the Nx payload specifically looked for AI CLIs it could run with permissive flags.
- Never paste secrets into install commands or print them in CI logs.
- Report every dependency change, including lockfile-only changes, in the summary.

## 8. Responding to a compromised package

- [ ] Identify affected versions from the advisory; search every lockfile (all branches, all repos) for them.
- [ ] Determine exposure: was the version installed anywhere (developer machines, CI, build servers, production images) and did its install scripts run?
- [ ] If scripts ran: treat that environment's credentials as stolen — rotate npm/GitHub/cloud tokens, SSH keys, and secrets available there; check for new GitHub Actions runners, workflows, or repositories created under your accounts.
- [ ] Pin to the last known-good version (or remove), regenerate the lockfile, and redeploy from clean builds.
- [ ] Add the package to cooldown exclusions only after the fixed release is verified (provenance, changelog, diff).
- [ ] Write a short blameless postmortem: how it got in, what detected it, which control would have blocked it.

## Sources

- OpenSSF, "Concise Guide for Developing More Secure Software" (cooldown item): https://best.openssf.org/Concise-Guide-for-Developing-More-Secure-Software
- OpenSSF, npm best practices guide: https://github.com/ossf/package-manager-best-practices/blob/main/published/npm.md
- OpenSSF, "Vendored Dependencies Guide": https://best.openssf.org/Vendored-Dependencies-Guide
- Liran Tal, npm security best practices: https://github.com/lirantal/npm-security-best-practices
- GitHub, "Our plan for a more secure npm supply chain" (2025-09): https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/
- pnpm 11 release notes: https://pnpm.io/blog/releases/11.0
- William Woodruff, "We should all be using dependency cooldowns" (2025): https://blog.yossarian.net/2025/11/21/We-should-all-be-using-dependency-cooldowns
- left-pad: https://blog.npmjs.org/post/141577284765/kik-left-pad-and-npm
- eslint-scope postmortem: https://eslint.org/blog/2018/07/postmortem-for-malicious-package-publishes/
- event-stream: https://snyk.io/blog/a-post-mortem-of-the-malicious-event-stream-backdoor/
- Dependency confusion: https://medium.com/@alex.birsan/dependency-confusion-4a5d60fec610
- Log4j security page: https://logging.apache.org/log4j/2.x/security.html
- colors/faker: https://snyk.io/blog/open-source-npm-packages-colors-faker/
- xz-utils: https://en.wikipedia.org/wiki/XZ_Utils_backdoor
- polyfill.io: https://sansec.io/research/polyfill-supply-chain-attack
- tj-actions: https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction · https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066
- Nx s1ngularity: https://nx.dev/blog/s1ngularity-postmortem
- chalk/debug: https://www.stepsecurity.io/blog/20-popular-npm-packages-compromised-chalk-debug-strip-ansi-color-convert-wrap-ansi
- Shai-Hulud: https://unit42.paloaltonetworks.com/npm-supply-chain-attack/ · https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/
- axios 2026: https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/ · https://cloud.google.com/blog/topics/threat-intelligence/north-korea-threat-actor-targets-axios-npm-package
- pip 26.1 cooldowns (InfoQ): https://www.infoq.com/news/2026/05/pip-261-dependency-cooldowns/
