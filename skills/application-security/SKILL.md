---
name: application-security
description: Use when writing, reviewing, or hardening any server or web code that handles users, tenants, input, files, URLs, or secrets - authorization and permissions (RBAC, ABAC, ReBAC), IDOR/BOLA and tenant isolation, mass assignment, input validation, SQL and command injection, XSS and Content Security Policy, SSRF, CSRF, file uploads, security headers and CORS, secrets, security logging and alerting, fail-closed error handling, and threat modeling. Maps OWASP Top 10:2025 and ASVS 5.0 to concrete coding rules, with a secure-by-default checklist and real incident cases (Equifax, Capital One, Okta, Next.js middleware bypass). Also use when the user says "is this secure?", "add permissions", "users can see other users' data", "add roles", "set up CSP", "pen test found…", or "harden this app", even for one endpoint. For login, sign-up, MFA, and session UX use auth-flows; for API contracts and OAuth for third parties use api-design; for dependency and supply-chain policy use dependency-management.
license: MIT
metadata:
  version: "1.1.0"
  category: engineering
  related: "auth-flows api-design dependency-management environments-and-config code-review ai-native-architecture"
---

# Application Security

Most breaches are not clever. They are a missing ownership check, a string-built query, a URL fetcher that can reach the cloud metadata service, a secret in a log, a patch applied months late. This skill makes the secure choice the default one while code is being written: deny by default, check authorization on every request next to the data, treat every input as hostile at its boundary, encode on output, keep secrets out of reach, log and alert on what matters, and fail closed. The outcome it protects: one bug or one stolen credential does not become a breach.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also note: **tenancy model** (single-tenant, multi-tenant, per-org), **data sensitivity** (personal, financial, health), **compliance** (SOC 2, PCI, HIPAA, GDPR), and **where authorization lives today** (middleware, controllers, a policy module, nowhere).

## Core principles

1. **Deny by default.** Every route, object, and field is forbidden until a rule explicitly allows it; frameworks' defaults can change under you.
2. **Authorize every request, server-side, at the object.** Middleware and UI checks are conveniences; the check that counts sits next to the data access.
3. **Validate at the boundary, encode at the output.** Schemas with allowlists on the way in; context-aware encoding on the way out. Validation alone never stops injection.
4. **Keep data out of interpreters.** Parameterize SQL, pass argument arrays to processes, never evaluate user input as code, templates, or markup.
5. **Least privilege everywhere.** Users, service accounts, database roles, cloud roles, CI tokens, and AI tools get only what the task needs.
6. **Secrets never in code, logs, URLs, or client bundles.** Store them in a manager, scope them, rotate them.
7. **Fail closed.** An exception, timeout, or missing policy means "deny" and a generic message, never a skipped check.
8. **Every limit is explicit.** Body size, page size, upload size, rate, timeout, and quota — unlimited is a vulnerability.
9. **Log security events and alert on them.** Logging that nobody watches does not detect anything.
10. **Your framework and dependencies are attack surface.** Watch advisories and patch known-exploited issues in days.

## Workflow

- [ ] **Model the feature** (10–15 minutes, in the PR or design doc): actors, entry points, trust boundaries, data stores, third parties; run STRIDE over each entry point (`references/threat-modeling.md`).
- [ ] **Authorization first**: write the rule for each action ("who may do what to which object and fields") and where it is enforced; add the cross-user and cross-tenant tests before the handler.
- [ ] **Boundaries**: schema for every input (HTTP, queue, webhook, file, LLM tool call) with unknown fields rejected and sizes capped; explicit output DTOs.
- [ ] **Interpreters and sinks**: parameterized queries, no shell, safe HTML rendering, URL fetches through the SSRF guard.
- [ ] **Platform controls**: headers, CSP, CORS, cookies, CSRF, upload handling per the baseline below.
- [ ] **Secrets and logs**: no secret in code or logs; security events logged with context, alerts defined.
- [ ] **Verify**: run the checklist below; run SAST, dependency, and secret scans; fix, re-run until clean. Record accepted risks.

## Secure-by-default checklist (agents run this on every feature)

**Access control**
- [ ] Every handler, server action, RPC, GraphQL resolver, and background job authenticates and authorizes itself — not only middleware.
- [ ] Queries are scoped by owner or tenant from the **session**, never from the request body or a header.
- [ ] Tests exist where user A (and tenant A) tries user B's objects: read, list, update, delete, export, and admin actions.
- [ ] Writes use per-operation input schemas; fields like `role`, `orgId`, `isAdmin`, `emailVerified`, `price`, `balance` cannot be set by clients.

**Input and output**
- [ ] Schemas validate type, format, range, length, and array size; unknown fields rejected; request body size capped.
- [ ] No string-built SQL, shell, or HTML; every escape hatch (`dangerouslySetInnerHTML`, `v-html`, `{@html}`, raw-query APIs, `eval`) is justified and sanitized.
- [ ] Links from user data allow only `http:`, `https:`, `mailto:` schemes.
- [ ] URL-fetching features go through the SSRF guard; uploads through the upload pipeline.

**Browser and network**
- [ ] Strict CSP (nonce + `strict-dynamic`), HSTS, `nosniff`, `frame-ancestors`, Referrer-Policy, COOP; `Cache-Control: no-store` on authenticated responses.
- [ ] CORS: exact-origin allowlist, never a reflected `Origin`, never `*` with credentials.
- [ ] Cookie-authenticated state changes have CSRF protection (Fetch Metadata + Origin fallback, or tokens).

**Operations**
- [ ] Secrets come from a secrets manager or the platform; env validated at startup; nothing secret prefixed for the client bundle.
- [ ] Security events logged (auth, authz denials, admin actions, validation failures) without tokens, passwords, or sensitive PII; alerts on spikes.
- [ ] Errors fail closed: generic message to the client, detail in logs, partial transactions rolled back.
- [ ] Lockfile committed; dependency, SAST, and secret scanning in CI; framework advisories watched.
- [ ] AI features treat model output as untrusted input and give tools least privilege.

## OWASP Top 10:2025 as coding rules

| # | Category | The rule in code |
|---|---|---|
| A01 | Broken Access Control (now includes SSRF) | Deny by default; object- and field-level checks in the data layer; tenant-scoped queries; SSRF guard on outbound URLs |
| A02 | Security Misconfiguration | Hardened, identical config across environments (different credentials); headers; no default accounts, debug endpoints, or directory listings; minimal features |
| A03 | Software Supply Chain Failures (new) | Lockfiles, SBOM, dependency and advisory scanning, pinned CI actions, cooldowns for new versions → `dependency-management` |
| A04 | Cryptographic Failures | TLS everywhere with HSTS; authenticated encryption from vetted libraries; Argon2id for passwords; keys in a KMS/HSM; don't store what you don't need |
| A05 | Injection (includes XSS) | Parameterized queries; argument arrays for processes; framework auto-escaping; sanitize any HTML you must render; CSP |
| A06 | Insecure Design | Threat-model auth, access control, and business flows; misuse cases as tests; tenant isolation by design; business limits in the domain model |
| A07 | Authentication Failures | Use a maintained auth library or IdP; MFA; breached-password checks; throttling without lockout → `auth-flows` |
| A08 | Software or Data Integrity Failures | Verify signatures/provenance; no unsigned serialized data from clients; reviewed CI/CD with segregated permissions; SRI on third-party scripts |
| A09 | Security Logging & Alerting Failures | Log security events with context, protect log integrity, and **alert** — logs without alerts detect nothing |
| A10 | Mishandling of Exceptional Conditions (new) | Catch where errors occur, roll back partial work, fail closed, global handler, limits and quotas everywhere |

The OWASP API Security Top 10 is still the 2023 edition; `api-design` maps it. Per-category detail, tests, and examples: `references/owasp-top10-2025.md`.

**ASVS 5.0 target**: OWASP ASVS 5.0.0 (May 2025) has three levels. Default target **Level 2** for any app with user accounts and personal data (OWASP says most applications should aim for it); Level 1 for prototypes; Level 3 for banking-grade or high-assurance systems. Cite requirements as `v5.0.0-<chapter>.<section>.<req>` because IDs shift between versions.

## Authorization

**Where to enforce**: in the service or data-access layer, on every request, for every object. Middleware, edge functions, route guards, and hidden buttons are convenience layers only. In 2025, CVE-2025-29927 let attackers skip Next.js middleware entirely with one internal header (fixed in 15.2.3 / 14.2.25 / 13.5.9 / 12.3.5); apps that re-checked in handlers were unaffected.

**Scope every query by the principal** — a miss is a 404:

```ts
// Avoid: fetch by id across all tenants, then (maybe) check
const doc = await db.document.findUnique({ where: { id } });

// Do: the query itself cannot return another tenant's row
const doc = await db.document.findFirst({ where: { id, orgId: session.orgId } });
if (!doc) throw notFound();
authorize(session.user, "document:update", doc); // one central policy function for role/field rules
```

- One central `can(user, action, resource)` (or policy engine) called everywhere; no ad-hoc `if (user.role === "admin")` sprinkled through handlers.
- Tenant ID from the session, never from the body, path, or a header. Add Postgres row-level security as defense in depth for multi-tenant data.
- Unguessable IDs (UUIDv4/v7) are defense in depth, never the control.
- Prefer "me"-scoped endpoints (`/me/invoices`) over `?userId=`.
- Background jobs, webhooks, and AI agents act with the **originating user's permissions**, not a superuser service account (confused deputy).
- Return 404 rather than 403 when the existence of the object is itself sensitive.

| Model | Choose when | Tools (examples) |
|---|---|---|
| **RBAC per tenant + ownership checks** (default) | Admin/editor/viewer roles per organization; most SaaS | Framework guards, a central policy module, auth library organization roles |
| **ABAC / policy engine** | Rules multiply: attributes of user, resource, environment ("owner, or same department and status is draft") | Cedar, OPA/Rego, Cerbos |
| **ReBAC (Zanzibar-style)** | Sharing, nested folders or orgs, "list everything user X can see" is central | OpenFGA, SpiceDB |

Start with the default; centralizing the decision early is cheap, retrofitting it is expensive. The legacy Oso open-source library is deprecated; don't adopt it for new work. Details, mass assignment per stack, and the test matrix: `references/authorization.md`.

## Input validation and output encoding

- Validate **syntax** (type, format) and **semantics** (start before end, amount in range) at every trust boundary: HTTP handlers, queue consumers, webhooks, file parsers, LLM tool calls.
- **Allowlist**, don't denylist. Reject unknown fields (Zod `.strict()`, Pydantic `extra="forbid"`). Cap lengths, array sizes, numbers, and body size.
- Normalize Unicode (NFC) before comparing; anchor regexes and avoid catastrophic backtracking (use a linear-time engine for user-supplied patterns).
- Client-side validation is UX; the server's is the control.
- Encode for the output context (HTML body, attribute, URL, JS, CSS). Frameworks do HTML escaping for you — until you use an escape hatch.

## Injection, XSS, SSRF, uploads (short rules)

- **SQL**: prepared statements or the ORM's parameterized API. Every ORM has a raw-query escape hatch; the bug is building its string with interpolation. Identifiers (table, column, sort direction) come from an allowlist. The app's DB role has no DDL or superuser rights.
- **Processes**: no shell; pass an argument array. **Templates**: never render user input as a template. **NoSQL**: reject operator objects (`{"$gt": ""}`) through the schema. **Logs**: strip CR/LF.
- **XSS**: rely on auto-escaping; sanitize any HTML you must render with DOMPurify (or your stack's equivalent) and keep it patched; `textContent` over `innerHTML`; render user Markdown to HTML then sanitize.
- **SSRF** (import-from-URL, link previews, webhooks, avatar URLs, PDF renderers, OIDC discovery, AI browsing tools): `http(s)` only; resolve DNS yourself and reject private, loopback, link-local, and metadata addresses (`169.254.169.254`) for **every** record; connect to the vetted IP; no redirects (or re-validate each hop); timeouts and size caps; egress proxy; **enforce AWS IMDSv2**. Capital One (2019): SSRF to the metadata service yielded role credentials and about 100M customer records.
- **Uploads**: allowlist extensions, check magic bytes (not `Content-Type`), rename to a generated ID, cap size (and decompressed size), store outside the web root or in a private bucket, serve via signed URLs or a separate domain with `Content-Disposition: attachment` and `nosniff`, scan before marking available.

Full patterns and code: `references/injection-xss-ssrf.md`.

## Headers, CSP, CORS, CSRF

```
Content-Security-Policy: script-src 'nonce-{random-per-response}' 'strict-dynamic'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store            (authenticated and sensitive responses)
```

- Fresh nonce per response, passed to the templating layer; never add nonces to every script tag in middleware (injected scripts would get one too). Roll out with `Content-Security-Policy-Report-Only` first.
- HSTS `preload` is hard to undo; add it deliberately. Subresource Integrity on any third-party script, or self-host it (polyfill.io, 2024: a sold domain served malware to 100,000+ sites).
- **CORS relaxes** the same-origin policy; it never protects. No CORS headers is the safest default. Exact-origin allowlist, `Vary: Origin`, never reflect `Origin`, never `*` with credentials, never allowlist `null`.
- **CSRF** for cookie auth: `SameSite=Lax`, Fetch Metadata (`Sec-Fetch-Site`) with an Origin fallback, or framework tokens; no state change on GET. Session and login specifics: `auth-flows`.

Details: `references/headers-cors-csp.md`.

## Secrets, logging, errors

- **Secrets**: never committed (secret scanning pre-commit and on push); injected at runtime from a secrets manager or platform; scoped per service and environment; rotated, and rotation rehearsed. Prefer short-lived workload identity (OIDC from CI to cloud) over static keys. Anything prefixed for the client bundle (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`) is public. Mobile binaries are public. Setup and tooling: `environments-and-config`.
- **Log**: sign-in success/failure, throttling, MFA and credential changes, session lifecycle, authorization denials, validation failures at boundaries, admin actions, high-value transactions, config changes — as structured events with user, tenant, request ID, outcome.
- **Never log**: passwords, session IDs (log a hash), access/refresh tokens, API keys, OTPs, reset or magic-link URLs, connection strings, keys, card data, health or government IDs. Tokens in query strings land in access logs and `Referer` — keep them out of URLs. Scrub cookies and auth headers from HAR files, crash dumps, and support uploads at ingestion (Okta, 2023: session tokens in customer-uploaded HAR files were used to hijack sessions).
- **Alert** on failed-login spikes per account or IP, correct-password-then-failed-MFA, bursts of authorization denials, and new admin grants.
- **Errors fail closed**: catch at the source, roll back, return a generic message with a correlation ID, log the detail. A policy lookup that throws means deny.

## Framework server layers and AI features

- Server actions, RSC endpoints, API routes, and GraphQL resolvers are public entry points: authenticate, authorize, validate inside each. CVE-2025-55182 (December 2025) was a critical pre-auth RCE in React Server Components' protocol — correct app code did not help; only patching did. Details: `frontend-architecture`.
- LLM output is untrusted input: never into `eval`, SQL, shell, or raw HTML; sanitize rendered Markdown and block auto-loaded remote images (an exfiltration channel); URL-fetching tools get the SSRF guard; tools run with the user's permissions; consequential actions need human confirmation. Prompt injection defenses: `ai-native-architecture`.

## Security testing in CI

| Layer | Default | Gate |
|---|---|---|
| Authorization tests | Two users, two tenants, every object route and action | Required for any new route |
| SAST | Semgrep or CodeQL with the framework rule packs | Block on high-severity new findings |
| Dependencies (SCA) | Lockfile + Dependabot/Renovate + an advisory scanner (npm audit, OSV-Scanner, or equivalent) | Block on known-exploited or critical in reachable code |
| Secret scanning | Pre-commit hook (gitleaks or similar) + push protection on the host | Block the push; rotate anything that leaked |
| DAST | OWASP ZAP baseline against a preview environment | Review on release |
| Headers | Automated check of CSP, HSTS, and cookies on the deployed preview | Block on regression |

## Gotchas

- **Authorization only in middleware or the UI.** CVE-2025-29927 bypassed Next.js middleware with one header. Re-check in the handler or data layer.
- **`findById` then forget.** Fetching by ID without the tenant or owner in the `WHERE` clause is the most common IDOR. Scope the query itself.
- **Tenant ID from the request.** `orgId` in the body or `X-Org-Id` header is attacker-controlled. Take it from the session.
- **`update(req.body)`.** Mass assignment lets clients set `role`, `orgId`, or `balance`. Per-operation input schemas; explicit output DTOs.
- **Believing validation stops injection.** It narrows input; parameterization and encoding stop injection.
- **`dangerouslySetInnerHTML` with "trusted" CMS or model output.** Sanitize every time; `javascript:` URLs in `href` are not blocked by React.
- **Fetching user-supplied URLs with a plain HTTP client.** Redirects and DNS rebinding bypass naive checks; resolve, pin, and re-validate.
- **Reflecting `Origin` into `Access-Control-Allow-Origin` with credentials.** Any site can then read your users' data.
- **CSP with `'unsafe-inline'` and a long host allowlist.** It blocks almost nothing; use nonces with `strict-dynamic`.
- **Catch-all that returns success.** `catch { return true }` in an authorization or payment path fails open.
- **Secrets in logs, URLs, and error pages.** Especially tokens in query strings and stack traces returned to clients.
- **Treating unguessable IDs as access control.** They leak through URLs, logs, and referrers.
- **Service-account permissions for user-triggered jobs or agents.** Act as the user, with their scope.
- **A public key plus a table without row-level security.** With Supabase or Firebase, the anon key is public by design; only RLS or security rules protect the data. Test each table as an anonymous user and as a second signed-up user.
- **Assuming nobody finds what you did not link.** `.env`, `.git/`, source maps, `/metrics`, and `staging.` subdomains are the first things recon tools request. Run the pass in `references/external-exposure.md`.
- **"We'll patch later."** Equifax (2017): a Struts fix was available in March; attackers were in from May; about 147M people affected.

## Output format

For a feature or review, deliver:

```
Threat model: entry points · trust boundaries · top threats (STRIDE) · mitigations · accepted risks
Authorization: rule per action (who, what, which objects/fields) · enforcement point · tests added
Findings (reviews): [Blocker|Major|Minor] <issue> — <location> — Observed|Inferred|Not checked — fix — OWASP 2025 category / ASVS ID
Controls changed: headers/CSP/CORS/cookies · validation schemas · SSRF/upload guards · secrets · logging/alerts
Verification: tests and scans run, results, what was not checked
```

Blocker = exploitable now (auth bypass, IDOR, injection, SSRF to internal, secret exposure). Major = missing defense-in-depth that a single bug would turn into a breach. Minor = hardening.

## References

| File | Read when |
|---|---|
| `references/owasp-top10-2025.md` | Reviewing against OWASP Top 10:2025 or ASVS 5.0, choosing an ASVS level, or needing per-category rules, tests, and misconfiguration, crypto, integrity, logging, and error-handling detail |
| `references/authorization.md` | Designing roles and permissions, choosing RBAC/ABAC/ReBAC, enforcing tenant isolation, fixing IDOR/BOLA or mass assignment, or writing authorization tests |
| `references/injection-xss-ssrf.md` | Writing queries or raw SQL, spawning processes, rendering HTML or Markdown, fetching user-supplied URLs, accepting webhooks, or handling file uploads |
| `references/headers-cors-csp.md` | Setting security headers, rolling out CSP with nonces, configuring CORS, cookies, SRI, or caching of sensitive responses |
| `references/threat-modeling.md` | Starting a feature with security impact, writing a design doc's security section, or setting up security testing in CI |
| `references/external-exposure.md` | Before launch or after an infrastructure change: checking for leaked `.env`/`.git`/source maps, public metrics or actuators, BaaS tables without RLS, open sign-up, SSRF through image or preview fetchers, dangling DNS, and exposed staging |
| `references/case-studies.md` | Explaining why a rule matters, or checking a design against real breaches (Equifax, Capital One, LastPass, CircleCI, Okta, Log4Shell, Next.js middleware, React2Shell) |

## Related skills

- `auth-flows` — sign-in, sign-up, MFA, passkeys, password reset, sessions, and CSRF on auth forms.
- `api-design` — API contracts, OAuth 2.1 for your API, token validation, and the OWASP API Security Top 10.
- `dependency-management` — supply-chain defenses: lockfiles, cooldowns, install scripts, evaluating packages.
- `environments-and-config` — secrets managers, per-environment isolation, config validation at startup.
- `frontend-architecture` — server actions and RSC security, data-access layers in full-stack frameworks.
- `ai-native-architecture` — prompt injection, tool permissions, and guardrails for LLM features.
- `code-review` — the review procedure that applies this skill to a diff.
- `lessons-from-failures` — the wider catalog of outages and breaches behind these rules.
