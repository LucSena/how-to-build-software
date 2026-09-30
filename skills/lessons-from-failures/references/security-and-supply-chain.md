# Security and Supply-Chain Incidents — Cases and Rules

Compact cases where trust in code, packages, build systems, or sessions failed. Each: **What happened**, **Why**, **Rule**, **Source**. For how to vet and pin a dependency day to day use `dependency-management`; for secure coding defaults use `application-security`. This file is the "why" behind those rules.

## Contents
1. Registry and dependency failures
2. Build, CI, and maintainer compromise
3. Breaches from unpatched software, SSRF, and stolen sessions
4. The rules these cases teach

---

## 1. Registry and dependency failures

### left-pad (Mar 2016)
**What happened.** After a naming dispute, a maintainer unpublished all his npm packages. `left-pad`, about 11 lines, was a transitive dependency of widely used build tooling, and builds broke worldwide until npm restored it and changed its unpublish policy.
**Rule.** The registry is a runtime dependency of your build: commit lockfiles, build from a cache or mirror, and inline trivial helpers instead of adding a package.
**Source.** https://blog.npmjs.org/post/141577284765/kik-left-pad-and-npm

### colors.js and faker.js (Jan 2022)
**What happened.** The maintainer deliberately published a `colors` version that printed garbage in an infinite loop and wiped `faker` in protest. Projects using caret ranges picked it up automatically.
**Rule.** Install exactly what the lockfile says (`npm ci`, `pnpm install --frozen-lockfile`); never float versions in CI.
**Source.** https://snyk.io/blog/open-source-npm-packages-colors-faker/

### event-stream (Nov 2018) and eslint-scope (Jul 2018)
**What happened.** event-stream: the original maintainer handed publish rights to a stranger, who added a dependency carrying an encrypted payload aimed at a bitcoin wallet's build. eslint-scope: an attacker reused a maintainer's leaked password to get an npm token and published a version that stole installers' npm tokens.
**Rule.** A maintainer handoff is a trust transfer you cannot see; prefer fewer, well-maintained dependencies and watch for publisher or provenance changes.
**Sources.** https://snyk.io/blog/a-post-mortem-of-the-malicious-event-stream-backdoor/ ; https://eslint.org/blog/2018/07/postmortem-for-malicious-package-publishes

### Dependency confusion (Feb 2021)
**What happened.** A researcher published public packages named like companies' internal packages; build tools that preferred the higher public version installed them inside major companies.
**Rule.** Use scoped or namespaced internal packages and pin the registry per scope.
**Source.** https://medium.com/@alex.birsan/dependency-confusion-4a5d60fec610

### Hallucinated packages ("slopsquatting", USENIX Security 2025)
**What happened.** Across about 2.23 million code samples from 16 LLMs, 19.7% referenced at least one package that does not exist, with 205,474 unique invented names. Many hallucinations repeat across runs, so attackers can register them in advance.
**Rule.** Before adding a package an AI suggested, confirm it exists, is the intended project (publisher, repository link, age, download history), and is needed at all.
**Source.** https://www.usenix.org/system/files/usenixsecurity25-spracklen.pdf

## 2. Build, CI, and maintainer compromise

### SolarWinds SUNBURST (discovered Dec 2020)
**What happened.** Attackers compromised the vendor's build system and injected a backdoor into signed Orion updates that thousands of customers installed.
**Rule.** A signature proves who built an artifact, not what was built. Harden build systems, aim for reproducible builds, and record provenance (SLSA).
**Source.** https://www.cisa.gov/news-events/directives/ed-21-01-mitigate-solarwinds-orion-code-compromise

### Codecov Bash Uploader (2021)
**What happened.** A leaked credential let an attacker modify the uploader script that CI pipelines downloaded and ran, sending their environment variables (secrets) to the attacker. A customer noticed because the script's checksum no longer matched.
**Rule.** Never `curl | bash` in CI without checksum or signature verification; expose secrets only to the steps that need them.
**Source.** https://about.codecov.io/security-update/

### xz-utils backdoor, CVE-2024-3094 (Mar 2024)
**What happened.** Over about two years, a persona gained maintainer trust on a project with a single overworked maintainer, then planted a backdoor in liblzma that, on some distributions, let the holder of a specific key execute code through OpenSSH. The payload hid in build machinery and "test" files. An engineer found it while chasing about 500 ms of extra SSH login latency, before it reached most stable distributions.
**Rule.** Build from source that matches the repository; treat binary test fixtures as potential payloads; performance anomalies are security signals; a burned-out sole maintainer is a supply-chain risk.
**Source.** https://en.wikipedia.org/wiki/XZ_Utils_backdoor ; discovery post (login time 0.299 s → 0.807 s): https://www.openwall.com/lists/oss-security/2024/03/29/4

### polyfill.io (Jun 2024)
**What happened.** The domain and repository were sold; the CDN then served malicious redirects to more than 100,000 sites that embedded the script.
**Rule.** Self-host third-party browser scripts, or pin them with Subresource Integrity. Never hot-link a script from a domain you do not control.
**Source.** https://www.bleepingcomputer.com/news/security/polyfillio-javascript-supply-chain-attack-impacts-over-100k-sites/

### tj-actions/changed-files, CVE-2025-30066 (Mar 2025)
**What happened.** An attacker obtained a bot token, likely via another compromised action, and re-pointed the action's version tags to a malicious commit that printed runner secrets into public workflow logs.
**Rule.** Pin third-party CI actions to a full commit SHA, not a tag; set workflow `permissions:` to least privilege; give secrets only to steps that need them.
**Sources.** https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction ; https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066

### Nx "s1ngularity" (Aug 2025)
**What happened.** Malicious Nx versions published with a stolen token ran a `postinstall` script that collected credentials and, for the first time at scale, invoked locally installed AI coding CLIs with permission-skipping flags to hunt for secrets. Results were pushed to public repositories in victims' own accounts; GitGuardian counted 2,349 distinct secrets across 1,346 such repositories.
**Rule.** Disable install scripts by default and allow-list the few that need them. AI agents on developer machines are now an attack tool as well as a target: do not leave them in auto-approve modes.
**Sources.** https://nx.dev/blog/s1ngularity-postmortem ; GitGuardian's count: https://blog.gitguardian.com/the-nx-s1ngularity-attack-inside-the-credential-leak/

### chalk/debug hijack (Sep 2025) and Shai-Hulud (Sep and Nov 2025)
**What happened.** A maintainer was phished by a fake "2FA reset" email that captured a live TOTP code; malicious versions of 18 packages with more than 2 billion combined weekly downloads (Aikido, which first reported it) were published and pulled within hours. Weeks later, Shai-Hulud became the first self-propagating npm worm: it stole tokens during install and used each victim's npm token to publish infected versions of their packages; its second wave reached hundreds of packages and tens of thousands of GitHub repositories. The pattern continued into 2026 (a hijacked axios maintainer account, Mar 2026).
**Rule.** Maintainers use phishing-resistant 2FA (passkeys) and trusted publishing with provenance. Consumers set an install cooldown (a few days) and `ignore-scripts=true`, and watch for packages that suddenly lose provenance.
**Sources.** https://www.stepsecurity.io/blog/20-popular-npm-packages-compromised-chalk-debug-strip-ansi-color-convert-wrap-ansi ; https://www.aikido.dev/blog/npm-debug-and-chalk-packages-compromised ; https://unit42.paloaltonetworks.com/npm-supply-chain-attack/ ; https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/ ; https://github.com/lirantal/npm-security-best-practices

## 3. Breaches from unpatched software, SSRF, and stolen sessions

### Equifax (2017)
**What happened.** An Apache Struts vulnerability was patched upstream in March; Equifax's dispute portal was not patched, and attackers took data on about 147 million people over the following months. An expired certificate on a traffic-inspection device meant the exfiltration went unseen.
**Rule.** Keep an SBOM so "are we affected?" takes minutes; patch known-exploited vulnerabilities in days; monitor the expiry of certificates on security tooling too.
**Source.** https://www.gao.gov/products/gao-18-559 ; FTC settlement page (147 million people): https://www.ftc.gov/enforcement/refunds/equifax-data-breach-settlement

### Capital One (2019)
**What happened.** A misconfigured WAF allowed server-side request forgery to the cloud instance metadata service, which returned credentials for an over-privileged role; those were used to copy storage buckets holding about 100 million US and 6 million Canadian records. A regulator fined the bank $80M.
**Rule.** Block link-local and metadata addresses for outbound fetches of user-supplied URLs; require session-token metadata access (IMDSv2); give roles least privilege.
**Source.** https://www.capitalone.com/digital/facts2019/

### Log4Shell, CVE-2021-44228 (Dec 2021)
**What happened.** Log4j 2 evaluated `${jndi:...}` lookups inside logged strings, so any logged user input (a User-Agent header, a chat message) could trigger remote code execution. Most organizations needed days just to learn where they used it.
**Rule.** Logging and templating never interpret data. Know your transitive dependencies (SBOM).
**Source.** https://logging.apache.org/log4j/2.x/security.html

### CircleCI (Dec 2022–Jan 2023) and Okta support system (Oct 2023)
**What happened.** CircleCI: malware on an engineer's laptop stole a 2FA-backed SSO session cookie, which reached production and customer secrets; every customer was told to rotate secrets. Okta: a service-account credential saved in an employee's personal browser profile let an attacker download customer-uploaded HAR files containing live session tokens and hijack sessions at several customers.
**Rule.** Keep production sessions short-lived and device-bound; design secret storage so everything can be rotated; scrub cookies and auth headers from HAR files, logs, and support uploads at ingestion; keep production access off personal devices and accounts.
**Sources.** https://circleci.com/blog/jan-4-2023-incident-report/ ; https://www.bleepingcomputer.com/news/security/okta-says-its-support-system-was-breached-using-stolen-credentials/

## 4. The rules these cases teach

- [ ] New package: exists, is the intended one, needed at all (stdlib or ten lines first).
- [ ] Lockfile committed; CI installs frozen; exact pins for anything that runs at build time.
- [ ] Install cooldown of a few days; install scripts off by default.
- [ ] CI actions pinned to SHAs; least-privilege `permissions:`; secrets scoped per step; no unverified `curl | bash`.
- [ ] Third-party browser scripts self-hosted or pinned with SRI.
- [ ] Internal packages scoped, with the registry pinned per scope.
- [ ] SBOM available; known-exploited vulnerabilities patched in days.
- [ ] Outbound URL fetches block metadata and private ranges; cloud roles least-privilege.
- [ ] Logs, HAR files, and crash dumps scrubbed of secrets at ingestion; loggers never evaluate input.
- [ ] Sessions short-lived; every secret rotatable; no production access from personal devices.
- [ ] Maintainers: passkeys and trusted publishing.

## Sources

Case URLs are inline above. Additional: npm defenses as of 2026-09 (cooldowns, `ignore-scripts`, trust policies): https://github.com/lirantal/npm-security-best-practices ; SLSA provenance: https://slsa.dev/
