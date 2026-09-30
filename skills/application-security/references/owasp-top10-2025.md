# OWASP Top 10:2025 and ASVS 5.0 as Engineering Rules

The current OWASP Top 10 (the 2025 edition) mapped to concrete rules, code checks, and tests, plus how to use ASVS 5.0.0 as a requirements list. Status as of 2026-09. Paraphrased from OWASP (CC BY-SA 4.0); read the originals for full text.

## Contents
1. What changed from 2021
2. A01 Broken Access Control
3. A02 Security Misconfiguration
4. A03 Software Supply Chain Failures
5. A04 Cryptographic Failures
6. A05 Injection
7. A06 Insecure Design
8. A07 Authentication Failures
9. A08 Software or Data Integrity Failures
10. A09 Security Logging and Alerting Failures
11. A10 Mishandling of Exceptional Conditions
12. ASVS 5.0.0: levels, chapters, how to use it

## 1. What changed from 2021

- Built from data on over 2.8 million applications; eight categories come from the data and two were promoted by a community survey.
- **A01 Broken Access Control** stays #1 (on average 3.73% of tested apps had one of its 40 CWEs) and now **absorbs SSRF**.
- **A02 Security Misconfiguration** rose from #5.
- **A03 Software Supply Chain Failures** is new: it widens 2021's "Vulnerable and Outdated Components" to dependencies, build systems, and distribution.
- **A05 Injection** includes XSS (frequent, usually lower impact) and SQL injection (rarer, high impact).
- **A07** is renamed "Authentication Failures"; standardized auth frameworks appear to be helping.
- **A09** is renamed to stress **alerting**: great logging without alerting is of little value.
- **A10 Mishandling of Exceptional Conditions** is new: improper error handling, failing open, logic errors under abnormal conditions.

Don't quote the 2021 list in new work. The OWASP **API** Security Top 10 is still the 2023 edition (see `api-design`).

## 2. A01 Broken Access Control

**Rules**
- Deny by default for everything except public resources.
- Implement access control once (central policy) and reuse it; minimize CORS.
- Enforce record ownership in the model: users cannot create, read, update, or delete arbitrary records.
- Enforce business limits (e.g., max seats, per-plan quotas) in the domain model, not the UI.
- No directory listing; no `.git`, backups, or metadata files in the web root.
- Invalidate server sessions on logout; keep stateless tokens short-lived.
- Rate-limit API and controller access to blunt automated tooling.
- SSRF controls on every server-side fetch of a user-influenced URL.

**Code smells to grep for**: queries by `id` without an owner or tenant condition; `role ===` checks scattered in handlers; admin routes guarded only in the router or UI; `orgId`/`tenantId` read from the request body or headers; outbound HTTP calls with URLs from user data.

**Tests**: two users and two tenants, each attempting the other's objects on every verb and export; unauthenticated calls to every route; a lower role calling admin functions; field-level writes (`role`, `ownerId`) by a non-admin. Details: `authorization.md`.

## 3. A02 Security Misconfiguration

**Rules**
- Repeatable hardening: every environment built from the same config, with different credentials per environment.
- Minimal platform: remove unused features, frameworks, sample apps, and default accounts.
- Security headers on all responses (`headers-cors-csp.md`).
- Central error handling that intercepts verbose errors before they reach clients.
- Review cloud storage permissions (private buckets by default).
- Automate verification of config in every environment; if not automated, check at least yearly.
- Prefer identity federation and short-lived platform credentials over static keys in code, config, or pipelines.

**Checks**: stack traces or framework debug pages reachable in production; `X-Powered-By` and version banners; public buckets; admin consoles exposed to the internet; permissive CORS; default credentials.

## 4. A03 Software Supply Chain Failures

**Rules** (policy detail lives in `dependency-management`; CI hardening in `deployment-and-infrastructure`)
- Generate and manage an SBOM; track transitive dependencies.
- Remove unused dependencies and features.
- Continuously monitor advisories (CVE/NVD, OSV) with software composition analysis.
- Obtain components from official sources; prefer signed packages and provenance.
- Choose versions deliberately; watch for unmaintained components.
- Staged rollouts of updates so a compromised vendor release does not hit everything at once.
- Harden the repository (branch protection, no secrets, MFA), developer workstations, CI/CD (least privilege, environment-scoped secrets), and artifacts (provenance, signing, promote the same artifact between environments).

**Why it matters now**: tj-actions/changed-files (March 2025) had its tags re-pointed to a commit that dumped CI secrets into logs — SHA-pinned users were unaffected. The chalk/debug compromise (September 2025) and the Shai-Hulud worm showed maintainer phishing and install scripts spreading malware through popular npm packages.

## 5. A04 Cryptographic Failures

**Rules**
- Classify data; don't store sensitive data you don't need (data not retained cannot be stolen).
- Encrypt in transit with TLS 1.2+ (prefer 1.3) and HSTS; no plaintext protocols for sensitive data.
- Encrypt sensitive data at rest; keep the most sensitive keys in a KMS or HSM; use envelope encryption for columns such as TOTP secrets and third-party OAuth refresh tokens.
- Use vetted library implementations and **authenticated encryption** (AES-GCM, ChaCha20-Poly1305); never ECB, never home-made constructions.
- Passwords: Argon2id (or scrypt, PBKDF2 where mandated); see `auth-flows`.
- Cryptographic randomness from the platform CSPRNG for tokens, IDs used as secrets, nonces, and salts — never `Math.random()`.
- Disable caching of sensitive responses (CDN, browser, app caches).
- Plan for post-quantum migration for long-lived high-risk data (OWASP points to ENISA guidance targeting 2030).

## 6. A05 Injection

**Rules**
- Keep data separate from commands: parameterized APIs, ORMs used through their parameterized interfaces, argument arrays for processes.
- Stored procedures can still be injectable if they concatenate strings internally.
- Identifiers (table, column, sort order) cannot be parameterized: map them from an allowlist.
- Positive (allowlist) input validation reduces risk but is not a complete defense.
- For XSS: framework auto-escaping, sanitization for HTML you must render, strict CSP as the backstop.

Patterns and code: `injection-xss-ssrf.md`.

## 7. A06 Insecure Design

**Rules**
- Threat-model the critical parts: authentication, access control, business logic, key flows (`threat-modeling.md`).
- Maintain paved-road components (auth, uploads, outbound HTTP, file serving) so teams don't re-solve them.
- Write security requirements into user stories and misuse cases into tests.
- Plausibility checks at every tier (a negative quantity, a 10,000-seat order from a free account).
- Segregate tenants by design through every tier.

**Business-logic examples to test**: coupon stacking, race conditions on balance or inventory (use transactions and constraints), skipping a step in a multi-step flow, replaying a one-time action, changing the price client-side.

## 8. A07 Authentication Failures

**Rules** (implementation in `auth-flows`)
- MFA where possible; encourage password managers.
- No default credentials anywhere.
- Weak- and breached-password checks at creation and change; NIST length rules; no forced rotation without evidence of compromise.
- Consistent responses on registration, recovery, and API paths if you protect against enumeration.
- Limit or delay failed attempts without creating a denial of service; log failures and alert on stuffing.
- Server-side session manager: new high-entropy ID after login, not in the URL, secure cookie, invalidated on logout and after idle and absolute timeouts.
- Prefer a hardened, well-tested auth system over building one.
- Validate JWT `aud`, `iss`, and scopes for their intended use.

## 9. A08 Software or Data Integrity Failures

**Rules**
- Verify signatures or provenance for software and data you consume; consume dependencies only from trusted registries (internal vetted mirror for higher-risk profiles).
- Review process for code and configuration changes; segregated, access-controlled CI/CD.
- Never deserialize untrusted data without integrity checks (signatures) — prefer plain JSON with schemas over native object serialization formats.
- Subresource Integrity for third-party scripts and styles, or self-host them.
- Auto-update channels must verify signatures (SolarWinds showed that a signature proves who built an artifact, not what went into it — add build provenance).

## 10. A09 Security Logging and Alerting Failures

**Rules**
- Log login, access-control, and server-side validation failures with enough context (user, tenant, IP, request ID) to investigate, and retain them long enough for delayed forensics.
- Log every security control's decision, success and failure.
- Structured format your log system consumes; encode log data to prevent log injection.
- Audit trails for transactions with integrity protection (append-only tables or equivalent).
- **Alert** on suspicious behavior; write playbooks; consider honeytokens (fake credentials or records whose use triggers an alert).
- Have an incident response plan (NIST SP 800-61 or later).

**Never log**: passwords, session IDs (hash them), tokens, API keys, OTPs, reset links, connection strings, keys, card data, sensitive PII. Details in `SKILL.md` "Secrets, logging, errors".

**Log4Shell lesson**: a logging library that interprets data (`${jndi:…}` lookups) turned every logged header into remote code execution. Loggers must never evaluate input.

## 11. A10 Mishandling of Exceptional Conditions

**Rules**
- Catch errors where they occur and handle them meaningfully; don't let infrastructure deal with the unexpected.
- **Roll back** partial transactions and start over; never leave half-applied state.
- **Fail closed**: an exception in an authorization, validation, payment, or rate-limit path denies.
- Global exception handler plus centralized error handling, logging, monitoring, and alerting.
- Rate limits, quotas, and throttles everywhere — nothing should be limitless.
- Aggregate repeated identical errors as counts instead of flooding logs.
- Generic messages to clients (with a correlation ID); details only in logs.

**Code smells**: `catch (e) {}`; `catch { return true }` in guards; `if (policy === undefined) allow()`; timeouts treated as success; retries without caps; feature flags that default to "on" for security checks when the flag service is down.

## 12. ASVS 5.0.0: levels, chapters, how to use it

**Levels** (May 2025 release):
- **L1** — first layer of defense; the starting point (prototypes, low-risk apps).
- **L2** — "most applications should be striving to achieve this level"; L1 + L2 is roughly 70% of all requirements. **Default target for any app with accounts and personal data.**
- **L3** — high assurance (banking, health, critical infrastructure).

**Chapters**: V1 Encoding and Sanitization · V2 Validation and Business Logic · V3 Web Frontend Security · V4 API and Web Service · V5 File Handling · V6 Authentication · V7 Session Management · V8 Authorization · V9 Self-contained Tokens · V10 OAuth and OIDC · V11 Cryptography · V12 Secure Communication · V13 Configuration · V14 Data Protection · V15 Secure Coding and Architecture · V16 Security Logging and Error Handling · V17 WebRTC.

**How to use it**
- Pick the level in the design doc. For each feature, list the chapters it touches and check the L1/L2 requirements in them.
- Reference requirements as `v5.0.0-<chapter>.<section>.<req>` (e.g., `v5.0.0-8.2.2` for data-level authorization); IDs change between versions.
- Frequently cited L1/L2 requirements: 8.2.1 function-level, 8.2.2 data-level (IDOR/BOLA), 8.2.3 field-level authorization; 8.3.1 server-side enforcement; 8.4.1 cross-tenant controls; 3.3.x cookie attributes; 3.4.x headers; 7.2.x session token entropy and rotation; 6.2.x password rules.
- Use it as a test plan: each requirement becomes an automated test, a config check, or a documented decision.

## Sources

- OWASP Top 10:2025 (CC BY-SA 4.0): https://owasp.org/Top10/2025/ · source https://github.com/OWASP/Top10/tree/master/2025/docs/en
- OWASP ASVS 5.0.0 (CC BY-SA 4.0): https://github.com/OWASP/ASVS/tree/master/5.0/en
- OWASP API Security Top 10 2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- tj-actions/changed-files (CVE-2025-30066): https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction
- chalk/debug compromise: https://www.stepsecurity.io/blog/20-popular-npm-packages-compromised-chalk-debug-strip-ansi-color-convert-wrap-ansi
- Shai-Hulud npm worm: https://unit42.paloaltonetworks.com/npm-supply-chain-attack/
- SolarWinds (CISA ED 21-01): https://www.cisa.gov/news-events/directives/ed-21-01-mitigate-solarwinds-orion-code-compromise
- Log4Shell (Apache Log4j security page): https://logging.apache.org/log4j/2.x/security.html
