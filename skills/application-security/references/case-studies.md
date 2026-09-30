# Security Case Studies

Short, real incidents and the engineering rule each one teaches. Figures come from the cited postmortems, government reports, advisories, or widely reported coverage; re-check a number before quoting it in something public.

## Contents
1. Equifax (2017) — unpatched framework
2. Capital One (2019) — SSRF to cloud metadata
3. Log4Shell (2021) — a logger that evaluated input
4. LastPass (2022) — production reachable from a home computer
5. CircleCI (2022–2023) — stolen session cookie beat 2FA
6. Okta support system (2023) — session tokens in HAR files
7. Next.js middleware bypass, CVE-2025-29927 (2025)
8. React Server Components RCE, CVE-2025-55182 (2025)
9. polyfill.io (2024) — hot-linked third-party script
10. tj-actions/changed-files (2025) — mutable CI tags
11. chalk/debug (2025) — TOTP phished in real time
12. Prompt injection with real impact (2025)
13. The pattern

## 1. Equifax (2017) — unpatched framework

**What happened.** Apache Struts CVE-2017-5638 was disclosed and fixed on 7 March 2017. Equifax's dispute portal was not patched; attackers were inside from about mid-May to the end of July and took data on about 147 million people. A traffic-inspection device had an expired certificate (for roughly 19 months), so the exfiltration went unseen. Patch notification relied on an email list, and a scan missed the vulnerable app.
**Rule.** Keep an SBOM so "are we affected?" is a query; patch known-exploited vulnerabilities in days; monitor your monitoring (certificate expiry on security tools).
**Source.** GAO-18-559: https://www.gao.gov/products/gao-18-559

## 2. Capital One (2019) — SSRF to cloud metadata

**What happened.** A misconfigured web application firewall allowed server-side request forgery to the EC2 instance metadata service (IMDSv1), which returned credentials for an over-privileged IAM role. The attacker used them to list and copy S3 buckets: about 100 million US and 6 million Canadian records. Regulators fined the bank $80M. AWS released IMDSv2 (session-token based, SSRF-resistant) later that year.
**Rule.** Guard every server-side fetch of a user-influenced URL (resolve, block private and metadata ranges, pin the IP, no blind redirects); require IMDSv2; give roles least privilege so one leaked credential cannot read everything.
**Source.** https://www.capitalone.com/digital/facts2019/

## 3. Log4Shell (2021) — a logger that evaluated input

**What happened.** Log4j 2's message lookup evaluated `${jndi:ldap://…}` inside logged strings, so logging a User-Agent header or a chat message led to remote code execution. The behavior had been on by default for years. Most organizations needed days just to learn where Log4j was in their transitive dependencies.
**Rule.** Logging, templating, and config systems must never interpret data. Know your transitive dependencies (SBOM).
**Source.** https://logging.apache.org/log4j/2.x/security.html

## 4. LastPass (2022) — production reachable from a home computer

**What happened.** After a first breach of a development environment, the attacker targeted a DevOps engineer's home computer through a vulnerable third-party media server, captured the master password with a keylogger, and reached cloud backups containing customers' encrypted vaults.
**Rule.** Access to production data and backups from personal devices is a production risk: require managed devices, phishing-resistant MFA, and short-lived, scoped credentials for backup access.
**Source.** LastPass incident disclosures (2022–2023), summarized in `lessons-from-failures`.

## 5. CircleCI (2022–2023) — stolen session cookie beat 2FA

**What happened.** Malware on an engineer's laptop stole a 2FA-backed SSO session cookie. The attacker used it to reach production and exfiltrate customer secrets and encryption keys; every customer was told to rotate all secrets stored in CircleCI.
**Rule.** MFA protects the login, not the session that follows. Keep privileged sessions short and re-authenticated, watch for session reuse from new devices (and track device-bound session work such as DBSC), and design secret storage so everything can be rotated quickly.
**Source.** https://circleci.com/blog/jan-4-2023-incident-report/

## 6. Okta support system (2023) — session tokens in HAR files

**What happened.** An employee had saved a service-account credential to a personal Google profile on a work laptop. With it, an attacker downloaded customer-uploaded HAR files (browser network recordings) from the support system; the files contained live session tokens, which were used to hijack sessions at several customers. Okta later said the attacker also downloaded names and emails of all support-system users.
**Rule.** Scrub cookies, `Authorization` headers, and tokens from HAR files, logs, crash dumps, and support uploads at ingestion. Service accounts don't get interactive human logins. Keep work credentials out of personal profiles.
**Sources.** https://www.bleepingcomputer.com/news/security/okta-says-its-support-system-was-breached-using-stolen-credentials/ · https://thehackernews.com/2023/11/oktas-recent-customer-support-data.html

## 7. Next.js middleware bypass, CVE-2025-29927 (2025)

**What happened.** Next.js used an internal `x-middleware-subrequest` header to prevent middleware recursion. Sending that header from outside made the framework skip middleware entirely — including authorization implemented there. Rated critical; fixed in 15.2.3, 14.2.25, 13.5.9, and 12.3.5.
**Rule.** Middleware and edge checks are a convenience layer. Authorize in the route handler, server action, or data-access layer, next to the data.
**Source.** https://github.com/advisories/GHSA-f82v-jwr5-mffw

## 8. React Server Components RCE, CVE-2025-55182 (2025)

**What happened.** A critical pre-authentication remote code execution in the React Server Components protocol ("React2Shell") affected `react-server-dom-*` packages 19.0.0–19.2.0; fixed in 19.0.1, 19.1.2, and 19.2.1, with frameworks shipping patched releases. Apps were vulnerable even when their own code was correct.
**Rule.** Framework server layers are attack surface. Subscribe to your framework's advisories, and have a path to ship a dependency patch to production within a day.
**Source.** https://github.com/advisories/GHSA-fv66-9v8q-g76r (details in `frontend-architecture`)

## 9. polyfill.io (2024) — hot-linked third-party script

**What happened.** The polyfill.io domain and project were sold; from June 2024 the CDN served malicious, mobile-targeted redirects to more than 100,000 sites that embedded it directly.
**Rule.** Self-host third-party scripts or pin them with Subresource Integrity. Never hot-link executable code from a domain you don't control.
**Source.** https://sansec.io/research/polyfill-supply-chain-attack

## 10. tj-actions/changed-files (2025) — mutable CI tags

**What happened.** An attacker obtained a bot token and re-pointed the action's version tags to a malicious commit that dumped runner memory, printing CI secrets into public workflow logs. Over 23,000 repositories used the action; workflows pinned to a commit SHA were not affected.
**Rule.** Pin CI actions to full commit SHAs, set least-privilege workflow permissions, and don't expose secrets to steps that don't need them. Details: `deployment-and-infrastructure`, `dependency-management`.
**Source.** https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction

## 11. chalk/debug (2025) — TOTP phished in real time

**What happened.** A maintainer received a fake "2FA reset" email from a look-alike npm domain; the phishing page captured the username, password, and a live TOTP code. The attacker published malicious versions of 18 popular packages (about 2.6 billion weekly downloads combined) that hijacked crypto-wallet transactions in browsers; they were pulled within hours.
**Rule.** TOTP can be relayed; use phishing-resistant MFA (passkeys, security keys) for high-value accounts — admins, maintainers, finance — and apply install cooldowns for new dependency versions.
**Source.** https://www.stepsecurity.io/blog/20-popular-npm-packages-compromised-chalk-debug-strip-ansi-color-convert-wrap-ansi

## 12. Prompt injection with real impact (2025)

**What happened.** EchoLeak (CVE-2025-32711): one crafted email caused Microsoft 365 Copilot to pull internal data and exfiltrate it through a URL or image, with no user click. The GitHub MCP server case: a malicious public issue instructed an agent holding a broad token to read private repositories and leak them in a public pull request.
**Rule.** Treat model output as untrusted; don't auto-load remote images or links from it; give agents the user's narrowest scope (one repo, read-only where possible); require confirmation for actions that send data out. An agent with private data, untrusted content, and an outbound channel can be steered into exfiltration — remove one of the three. Details: `ai-native-architecture`.
**Sources.** https://arxiv.org/abs/2509.10540 · https://invariantlabs.ai/blog/mcp-github-vulnerability

## 13. The pattern

| Root cause | Cases | Default that prevents it |
|---|---|---|
| Known vulnerability left unpatched | Equifax, Log4Shell, React2Shell | SBOM, advisory alerts, fast patch path |
| Server fetches attacker-chosen URL | Capital One | SSRF guard, IMDSv2, least-privilege roles |
| Authorization in a skippable layer | Next.js middleware | Checks next to the data |
| Session or secret outlives its context | CircleCI, Okta, LastPass | Short sessions, scrubbing, managed devices, rotatable secrets |
| Trusting code you don't control at runtime | polyfill.io, tj-actions, chalk/debug | SRI or self-hosting, SHA pinning, phishing-resistant MFA, cooldowns |
| Model output treated as instructions or trusted content | EchoLeak, GitHub MCP | Least-privilege tools, confirmation, output sanitization |

## Sources

- GAO-18-559 (Equifax): https://www.gao.gov/products/gao-18-559
- Capital One: https://www.capitalone.com/digital/facts2019/
- Apache Log4j security: https://logging.apache.org/log4j/2.x/security.html
- CircleCI incident report: https://circleci.com/blog/jan-4-2023-incident-report/
- Okta support system breach coverage: https://www.bleepingcomputer.com/news/security/okta-says-its-support-system-was-breached-using-stolen-credentials/ · https://thehackernews.com/2023/11/oktas-recent-customer-support-data.html
- GHSA-f82v-jwr5-mffw (CVE-2025-29927): https://github.com/advisories/GHSA-f82v-jwr5-mffw
- GHSA-fv66-9v8q-g76r (CVE-2025-55182): https://github.com/advisories/GHSA-fv66-9v8q-g76r
- polyfill.io: https://sansec.io/research/polyfill-supply-chain-attack
- tj-actions (CISA): https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction
- chalk/debug: https://www.stepsecurity.io/blog/20-popular-npm-packages-compromised-chalk-debug-strip-ansi-color-convert-wrap-ansi
- EchoLeak: https://arxiv.org/abs/2509.10540 · GitHub MCP: https://invariantlabs.ai/blog/mcp-github-vulnerability
