# Security Review Checklist

A reviewer's checklist, not a threat model. Default severity for a confirmed miss is shown in brackets. It complements automated tools (SAST, dependency scanning, secret scanning), which catch different things. Mapped to OWASP Top 10 and OWASP API Security Top 10 (2023) where relevant.

## Contents
1. Authorization and authentication
2. Input handling and injection
3. Output, XSS, and data exposure
4. Secrets and sensitive data
5. Server-side requests, files, and deserialization
6. Browser security: CSRF, CORS, cookies, headers
7. Cryptography and passwords
8. Dependencies and supply chain
9. Resource consumption and abuse
10. LLM features
11. Mobile clients

## 1. Authorization and authentication

- [ ] **Object-level authorization (API1 / BOLA)** [Blocker]: every handler, resolver, server action, or job that takes an ID loads the object scoped to the caller (`WHERE id = $1 AND tenant_id = $2`) or checks ownership explicitly. Look for `findById(req.params.id)` with no owner check.
- [ ] **Function-level authorization (API5)** [Blocker]: admin and privileged operations check roles server-side; hiding a button is not authorization. Deny by default.
- [ ] **Property-level authorization (API3)** [Major]: writes accept an explicit allow-list of fields (no mass assignment: `update(req.body)`, `Model(**payload)`); users can't set `role`, `ownerId`, `price`, `isVerified`.
- [ ] **Multi-tenant isolation** [Blocker]: tenant ID comes from the authenticated session, never from the request body; caches and search indexes are keyed by tenant.
- [ ] **Authentication** [Blocker]: uses a vetted library or identity provider; no hand-rolled JWT parsing. Tokens validated for signature, `iss`, `aud`, `exp`/`nbf`; `alg: none` rejected; algorithms pinned.
- [ ] **Sessions** [Major]: session rotated on login and privilege change; logout and password change revoke sessions/refresh tokens.
- [ ] **Browser token storage** [Major]: prefer `HttpOnly; Secure; SameSite` cookies (backend-for-frontend) over tokens in `localStorage`.
- [ ] **Tests exist** for cross-user and cross-tenant access being denied [Major if missing on new endpoints].

## 2. Input handling and injection

- [ ] **Parse at the boundary** [Major]: request bodies, query params, headers, webhooks, queue messages, files, and third-party responses parsed with a schema before use.
- [ ] **SQL/NoSQL injection** [Blocker]: parameterized queries or the ORM's query builder only. Watch template literals in raw queries, dynamic `ORDER BY`/column names (allow-list them), and `$where`/operator injection in MongoDB-style queries.
- [ ] **Command injection** [Blocker]: no shell with user input; pass argument arrays (`execFile`, `subprocess.run([...])` without `shell=True`).
- [ ] **Path traversal** [Blocker]: user input never forms file paths directly; resolve and verify the path stays inside an allowed directory; use generated file names.
- [ ] **Template/expression injection** [Blocker]: no user input rendered as a template or evaluated (`eval`, `Function`, `pickle`, server-side template strings).
- [ ] **Log injection (CWE-117)** [Minor→Major]: structured logging; newlines and control characters in user input can't forge log entries.
- [ ] **Regex DoS** [Minor]: no user-controlled regexes; no catastrophic backtracking patterns on untrusted input.

## 3. Output, XSS, and data exposure

- [ ] **XSS** [Blocker]: framework escaping used; no `dangerouslySetInnerHTML`, `innerHTML`, `v-html`, `{@html}`, or `bypassSecurityTrust*` with untrusted data unless sanitized with a maintained sanitizer. Watch URLs from users in `href` (`javascript:`).
- [ ] **Excessive data exposure (API3)** [Major]: responses use explicit output DTOs/serializers; no raw ORM entities, password hashes, internal flags, or other users' emails.
- [ ] **Server components** [Major]: no secrets or full DB rows passed as props to client components; data access in a server-only layer.
- [ ] **Error responses** [Major]: no stack traces, SQL, hostnames, or internal messages; stable error shape with a trace ID.
- [ ] **Enumeration** [Minor]: 404 instead of 403 where existence itself is sensitive; uniform responses on login/reset flows.

## 4. Secrets and sensitive data

- [ ] **No secrets in code, tests, fixtures, or committed config** [Blocker]. A committed secret must be rotated, not just deleted.
- [ ] **No secrets in client bundles** [Blocker]: public env prefixes (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`, `REACT_APP_`) never carry secrets; mobile apps contain no server secrets.
- [ ] **No secrets or PII in logs, traces, analytics, or error trackers** [Major]: tokens, passwords, full card numbers, raw personal data.
- [ ] **`.env` files ignored** by git; secrets loaded from env or a secret manager and validated at startup [Major].
- [ ] **Sensitive data at rest** [Major]: fields with regulated data (health, payment, government IDs) encrypted or tokenized per project policy; retention/deletion considered.

## 5. Server-side requests, files, and deserialization

- [ ] **SSRF (API7)** [Blocker]: requests to user-supplied URLs (webhooks, image fetchers, link previews, imports) use an allow-list or block private, loopback, and link-local ranges (including cloud metadata `169.254.169.254`), re-check after DNS resolution, and don't follow redirects to internal hosts.
- [ ] **File uploads** [Major]: size limits, content-type sniffing (not trusting the extension), stored outside the web root or in object storage with generated names, served with safe `Content-Type` and `Content-Disposition`; image processing libraries patched.
- [ ] **Insecure deserialization** [Blocker]: no `pickle`, Java native serialization, or YAML full loaders on untrusted data; use JSON with a schema.
- [ ] **Webhooks received** [Major]: signature verified over the raw body with constant-time comparison; timestamp tolerance to prevent replay; deduplicated by event ID.

## 6. Browser security: CSRF, CORS, cookies, headers

- [ ] **CSRF** [Major]: cookie-authenticated state-changing requests protected (SameSite cookies plus CSRF tokens or framework protection); no state changes on GET.
- [ ] **CORS** [Major]: explicit origin allow-list; never `*` together with credentials; don't reflect arbitrary `Origin`.
- [ ] **Cookies** [Major]: `Secure`, `HttpOnly` for session cookies, appropriate `SameSite`.
- [ ] **Headers** [Minor]: Content-Security-Policy where feasible, `X-Content-Type-Options: nosniff`, frame protections, HSTS on HTTPS sites.
- [ ] **Open redirects** [Major]: redirect targets from input are allow-listed or relative-only.

## 7. Cryptography and passwords

- [ ] **Password hashing** [Blocker]: Argon2id, bcrypt, or scrypt via a maintained library; never plain SHA-*/MD5.
- [ ] **No custom crypto** [Blocker]: use platform/library primitives; authenticated encryption (AES-GCM, ChaCha20-Poly1305); random values from a CSPRNG (`crypto.randomUUID`, `secrets`, `SecureRandom`).
- [ ] **Constant-time comparison** for signatures and tokens [Major].
- [ ] **TLS verification never disabled** (`verify=False`, `rejectUnauthorized: false`, trust-all managers) [Blocker].

## 8. Dependencies and supply chain

- [ ] **New packages exist and are canonical** [Blocker if hallucinated/typosquatted]: registry page, repository, publisher, downloads, recent releases, license.
- [ ] **Lockfile updated and committed**; versions pinned; no unexpected transitive jumps [Major].
- [ ] **Known vulnerabilities** checked with the ecosystem's audit tool or scanner [Major for high/critical].
- [ ] **Framework patches current** where the framework itself is attack surface (e.g., React Server Components had a critical pre-auth RCE, CVE-2025-55182, fixed Dec 2025) [Blocker if an affected version ships].
- [ ] **Install scripts and CI**: no new `postinstall` scripts from unknown packages; CI secrets not exposed to untrusted pull requests [Major].

## 9. Resource consumption and abuse

- [ ] **Rate limits** on authentication, signup, password reset, OTP, and expensive endpoints (search, export, LLM calls) [Major].
- [ ] **Limits (API4)** on page size, payload size, upload size, query complexity/depth (GraphQL), execution time, and paid-resource spend (SMS, email, LLM tokens) [Major].
- [ ] **Business-flow abuse (API6)**: purchase, referral, coupon, and signup flows resistant to automation where abuse is plausible [Minor→Major].

## 10. LLM features

- [ ] **Model output is untrusted input** [Blocker]: parsed and validated with a schema; never executed (`eval`, shell, SQL) or rendered as raw HTML.
- [ ] **Prompt injection** [Major]: retrieved documents, web pages, emails, and tool results treated as data; tools least-privileged; irreversible or external actions (payments, emails, deletes) require confirmation.
- [ ] **Authorization in tools** [Blocker]: tools enforce the end user's permissions; the model is not an authorization boundary; retrieval filters by tenant/ACL at query time.
- [ ] **No secrets in prompts or tool descriptions** [Major]; token and cost budgets per user/tenant [Major].
See `ai-native-architecture` for the full treatment.

## 11. Mobile clients

- [ ] No API secrets embedded in the app; the backend enforces all authorization [Blocker].
- [ ] Tokens stored in the Keychain / Android Keystore-backed storage, not plain preferences [Major].
- [ ] Deep links and intents validate parameters and don't trigger privileged actions without confirmation [Major].
- [ ] No sensitive data in logs, screenshots in the app switcher (where required), or clipboard [Minor→Major].

## Sources

- OWASP Top 10 (web): https://owasp.org/www-project-top-ten/
- OWASP API Security Top 10 (2023): https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP Cheat Sheet Series (SSRF, XSS, CSRF, password storage, file upload): https://cheatsheetseries.owasp.org/
- OWASP Top 10 for LLM Applications (2025): https://genai.owasp.org/llm-top-10/
- OWASP MASVS (mobile): https://mas.owasp.org/MASVS/
- Veracode 2025 GenAI Code Security Report: https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/
- Standard Webhooks specification: https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md
- React2Shell (CVE-2025-55182) advisory: https://vercel.com/kb/bulletin/react2shell
- Next.js security guide: https://nextjs.org/blog/security-nextjs-server-components-actions
