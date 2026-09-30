# Lightweight Threat Modeling and Security Testing

A threat model an agent or a small team can do in 10–15 minutes per feature, written into the PR or design doc, plus the automated checks that keep the result true.

## Contents
1. The four questions
2. Agent-sized recipe
3. STRIDE prompts with examples
4. Abuse and misuse cases
5. Template
6. Worked example: "import contacts from a URL"
7. Security testing in CI
8. When to go deeper

## 1. The four questions

From the Threat Modeling Manifesto (building on Adam Shostack's work):
1. **What are we working on?** A data-flow sketch.
2. **What can go wrong?** Threats found with STRIDE and the OWASP Top 10.
3. **What are we going to do about it?** Mitigate, eliminate, transfer, or accept — each with an owner.
4. **Did we do a good enough job?** Tests exist, reviewers agree, accepted risks are written down.

## 2. Agent-sized recipe

1. **Draw the flow** in text: actors → entry points → trust boundaries → data stores → third parties. Mark where data crosses from less trusted to more trusted.
2. **For each entry point**, run the six STRIDE prompts (section 3) and the OWASP Top 10:2025 list.
3. **For each credible threat**, write one mitigation, where it is enforced, and the test that proves it (authorization tests first).
4. **Record accepted risks** with a reason and a revisit trigger ("when we add public sharing").
5. **Revisit** when the feature's entry points, data, or trust boundaries change.

For cloud-native systems, include IAM roles, managed services, and the shared-responsibility line (what the provider secures vs what you configure).

## 3. STRIDE prompts with examples

| Threat | Property violated | Ask | Typical app example |
|---|---|---|---|
| **S**poofing | Authentication | Can someone act as another user or service? | Stolen session token; social login linked by unverified email; unsigned webhook; OTP relayed by a phishing page |
| **T**ampering | Integrity | Can someone change data they shouldn't? | Mass assignment of `role`; client-sent price; replayed request; editable hidden fields |
| **R**epudiation | Accountability | Could someone deny an action we can't prove? | No audit log of admin actions; logs writable by the app user |
| **I**nformation disclosure | Confidentiality | Can data leak to the wrong party? | IDOR; verbose errors; tokens in URLs or logs; account enumeration; cached personalized pages |
| **D**enial of service | Availability | Can someone exhaust a resource or lock users out? | Lockout abuse; unbounded password hashing; SMS or email pumping; huge uploads; ReDoS; expensive GraphQL queries |
| **E**levation of privilege | Authorization | Can someone gain rights they don't have? | Missing function-level check on an admin API; middleware-only authorization; JWT algorithm confusion; SSRF to cloud metadata |

## 4. Abuse and misuse cases

Write them next to user stories and turn them into tests:
- "As an attacker, I change the invoice ID in the URL to read another company's invoice." → cross-tenant test.
- "As a bot, I sign up 10,000 accounts to abuse the free tier." → rate limits, bot challenge, email verification.
- "As a user, I apply the same coupon twice in parallel requests." → transaction plus unique constraint.
- "As an attacker, I put `http://169.254.169.254/` in the webhook URL." → SSRF guard test.
- "As a malicious document, I tell the AI assistant to email the user's files to me." → tool scoping and confirmation test.

## 5. Template

```markdown
## Security (threat model)
**Feature:** <one line> · **Data:** <classes: personal, financial, credentials…> · **ASVS target:** L2
**Flow:** <actor> → <entry point> → <service> → <store/third party>   (trust boundaries marked ‖)
| # | Entry point | STRIDE | Threat | Mitigation (where enforced) | Test |
|---|---|---|---|---|---|
| 1 | POST /imports | I, E | SSRF to internal network | URL guard in fetchRemote(); IMDSv2 | ssrf.spec: private IPs, redirects, rebinding |
| 2 | GET /imports/:id | I | Cross-tenant read | tenant-scoped query in ImportRepo | authz.spec: tenant B → 404 |
**Accepted risks:** <risk — reason — revisit when>
**Not checked:** <what this review did not cover>
```

## 6. Worked example: "import contacts from a URL"

Flow: user (browser) → `POST /imports {url}` ‖ app server → fetch URL ‖ internet → parse CSV → write contacts (tenant DB) → email summary.

| STRIDE | Threat | Mitigation | Test |
|---|---|---|---|
| E / I | URL points to `169.254.169.254` or `localhost:6379` | SSRF guard (scheme, DNS check on all records, pinned IP, no redirects), IMDSv2, egress proxy | Private, loopback, IPv6-mapped, redirect-to-private, DNS rebinding |
| D | 5 GB file or slow drip | Timeout, size cap, streaming parser, per-tenant rate limit, background job | Oversized and slow responses rejected |
| T | CSV formula injection when contacts are exported to spreadsheets later | Prefix cells starting with `=`, `+`, `-`, `@` on export | Export test with formula payloads |
| I | Import job reads another tenant's list | Job carries tenant ID from session at enqueue; repository requires tenant | Job test with mismatched tenant |
| S | Webhook "import finished" spoofed by a third party | Internal only; no public callback | — |
| R | Who imported 50,000 contacts? | Audit log: user, tenant, URL host, row count | Audit entry asserted |

Accepted: CSV content itself may contain spam addresses — rate-limited downstream email sending covers it.

## 7. Security testing in CI

| Check | What it catches | Default tooling (examples) | Gate |
|---|---|---|---|
| Authorization tests | IDOR/BOLA, missing function-level checks, tenant leaks | Your test framework; parameterized per route × principal | Required for every new route |
| SAST | Injection sinks, dangerous APIs, framework misuse | Semgrep, CodeQL | Block new high-severity findings; triage the rest |
| Software composition analysis | Known-vulnerable dependencies | Dependabot or Renovate plus an advisory scanner (npm audit, OSV-Scanner, or equivalent) | Block known-exploited or critical in reachable code; others on a patch SLA |
| Secret scanning | Keys and tokens in commits | A pre-commit hook (gitleaks or similar) + push protection on the Git host | Block the push; rotate anything that ever landed |
| Container / IaC scanning | Vulnerable base images, public buckets, open security groups | Image scanners, IaC linters | Block critical; see `deployment-and-infrastructure` |
| DAST | Missing headers, reflected XSS, misconfiguration on the running app | OWASP ZAP baseline scan against a preview environment | Review before release |
| Header and cookie assertions | Regressions in CSP, HSTS, cookie flags | A small test hitting the preview URL | Block on regression |
| Dependency review | New packages, install scripts, typosquats, hallucinated names | Dependency-review on PRs; `dependency-management` checklist | Human approval for new direct dependencies |

Rules:
- New findings block; old findings get a dated backlog, not a permanent exception.
- Patch known-exploited vulnerabilities in days. Equifax (2017) had months between the Struts fix and the breach.
- Keep an SBOM per release so "are we affected by CVE-X?" is a query, not a week of grepping (Log4Shell).
- Scanners are a floor: they miss most authorization bugs, which is why the authorization tests come first.

## 8. When to go deeper

Bring in a security specialist or a full threat-modeling session (data-flow diagrams, attack trees, external penetration test) when: handling payments, health, or government data; building auth or crypto yourself; exposing a public API or plugin system; running user-supplied code; adding autonomous AI agents with write access; or before an enterprise security review (SOC 2, ISO 27001) — and target ASVS L3 where the business demands it.

## Sources

- OWASP Threat Modeling Cheat Sheet (four questions, STRIDE): https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
- Threat Modeling Manifesto: https://www.threatmodelingmanifesto.org/
- Adam Shostack, *Threat Modeling: Designing for Security* (Wiley, 2014)
- OWASP Top 10:2025 A06 Insecure Design: https://owasp.org/Top10/2025/
- OWASP ZAP: https://www.zaproxy.org/
- Semgrep: https://semgrep.dev/ · CodeQL: https://codeql.github.com/
- OSV-Scanner: https://github.com/google/osv-scanner · gitleaks: https://github.com/gitleaks/gitleaks
- Equifax (GAO-18-559): https://www.gao.gov/products/gao-18-559
