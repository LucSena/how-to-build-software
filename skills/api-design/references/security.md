# API Security — Authentication, Tokens, Passkeys, Authorization, OWASP API Top 10

Status as of 2026-09. Security specifics move; verify versions of standards and libraries before relying on details.

## Contents
1. Authentication defaults
2. OAuth 2.1 and token handling
3. Where tokens live
4. Passkeys, passwords, MFA
5. Authorization
6. Service-to-service and agents
7. OWASP API Security Top 10 (2023) in depth
8. Web-layer basics for APIs
9. Rules catalog

## 1. Authentication defaults

| Client | Default |
|---|---|
| Your web app (browser) | Session cookie from a BFF or your server (`HttpOnly; Secure; SameSite=Lax`); the OAuth/OIDC flow runs server-side |
| Your mobile app | OAuth 2.1 authorization code + PKCE via the system browser; tokens in Keychain/Keystore |
| Third-party developers | OAuth 2.1 with scopes (user-delegated) or API keys scoped per environment (server-to-server) |
| Internal services | Workload identity / mTLS / client credentials |
| Webhooks from you | HMAC signatures (see `webhooks.md`) |

Use an identity provider (hosted or self-hosted) or a well-maintained auth library. Identity is rarely your differentiator and is easy to get subtly wrong.

## 2. OAuth 2.1 and token handling

OAuth 2.1 (`draft-ietf-oauth-v2-1`) is still an Internet-Draft as of 2026-09. It consolidates current best practice from the OAuth 2.0 Security Best Current Practice (RFC 9700, January 2025):

- Authorization code flow with **PKCE for all clients**, including confidential ones.
- **Implicit** and **resource owner password credentials** grants removed.
- Redirect URIs matched exactly.
- Bearer tokens never sent in query strings.
- Refresh tokens for public clients are sender-constrained or rotated on every use.

Token rules:
- Access tokens short-lived (5–15 min). Refresh tokens rotated with reuse detection (reuse of an old refresh token revokes the family).
- Validate JWTs fully: signature with an allow-listed algorithm (reject `none`, do not let the token header choose), `iss`, `aud`, `exp`, `nbf`, and required scopes. Fetch keys from the issuer's JWKS with caching.
- Prefer opaque tokens + introspection when you need instant revocation; JWTs cannot be revoked before expiry without a deny-list.
- Revoke sessions and refresh tokens on logout, password change, and suspected compromise.
- Sender-constrained tokens (DPoP, RFC 9449; mTLS, RFC 8705) for high-value APIs where token theft is a real threat.
- Scopes describe capabilities (`invoices:read`, `invoices:write`), not endpoints; keep them coarse enough to be understandable.

## 3. Where tokens live

| Location | Verdict |
|---|---|
| `HttpOnly; Secure; SameSite` cookie holding a server session (BFF) | **Default for browsers** — script cannot read it |
| In memory in a SPA (short-lived access token), refresh via BFF/cookie | Acceptable when a BFF is not possible |
| `localStorage` / `sessionStorage` | Avoid — any XSS can exfiltrate tokens |
| URL query string or fragment | Never — logged and leaked via referrers |
| Mobile secure storage (Keychain, Android Keystore-backed storage) | Default for native apps |
| Source code, client bundles, public env vars | Never — secrets in `NEXT_PUBLIC_*`/`VITE_*` variables ship to every user |

Cookie-based auth needs CSRF defenses: `SameSite=Lax` or `Strict`, plus anti-CSRF tokens or origin checks for state-changing requests.

## 4. Passkeys, passwords, MFA

- **Passkeys (WebAuthn/FIDO2)** are phishing-resistant because the credential is bound to the site's origin. NIST SP 800-63-4 (final, July 2025) recognizes syncable passkeys. Roll out as an additional sign-in option, prompt users to add one after a successful sign-in, then promote it to the default.
- **Account recovery** becomes the weakest link — protect it with the same strength as sign-in (another passkey, verified email plus a second factor, support-assisted recovery with checks).
- **Passwords**, if you keep them (NIST 800-63B-4): length over composition rules (minimum 8, 15+ recommended when the password is the only factor); allow paste and password managers; check against breached-password lists; no forced periodic rotation; no security questions.
- **Hashing**: Argon2id (OWASP minimum: 19 MiB memory, 2 iterations, parallelism 1) or bcrypt (cost ≥ 10) or scrypt. Never plain SHA-family or MD5.
- **MFA**: passkeys, TOTP, or push with number matching; SMS codes are the weakest option.
- Rate-limit and monitor sign-in, sign-up, password reset, and MFA endpoints (credential stuffing, enumeration); give identical responses for "unknown user" and "wrong password".

## 5. Authorization

- **Deny by default**; every endpoint declares its required permission.
- **Object-level checks in the service**, not only at the gateway: load the object scoped by the caller's tenant/ownership (`WHERE id = $1 AND tenant_id = $2`) so an unauthorized ID simply is not found → 404.
- **Property-level checks**: which fields may this caller read and write? Enforce with separate input/output schemas per role when they differ.
- **Model**: start with RBAC (roles → permissions); add attributes (ABAC) or relationships (ReBAC, Zanzibar-style: OpenFGA, SpiceDB) when sharing and hierarchies appear; policy engines (Cedar, OPA/Rego, Oso) help centralize rules.
- **Audit** authorization decisions for sensitive actions (admin changes, data exports, permission grants).
- **Test** every endpoint with: no auth (401), wrong role (403/404), other user's object (404), other tenant's object (404).

## 6. Service-to-service and agents

- Workload identity (SPIFFE/SPIRE, cloud IAM roles), mTLS inside the mesh, or OAuth client credentials with short-lived tokens.
- No long-lived shared API keys committed to code or copied between services; use a secret manager with rotation.
- Propagate the end user's identity (token exchange or signed context) when downstream services must authorize on their behalf — do not let an internal service trust a plain `X-User-Id` header from the network.
- AI agents and MCP servers: the MCP authorization spec uses OAuth 2.1 with PKCE and protected-resource metadata (RFC 9728). Scope agent tools narrowly and enforce per-user authorization inside each tool — the model is never an authorization boundary.

## 7. OWASP API Security Top 10 (2023) in depth

### API1 — Broken Object Level Authorization (BOLA)
**Rule.** Every handler that accepts an object ID verifies the caller may access that specific object.
**Apply when.** Any path, query, or body parameter that identifies a resource.
**Do / Avoid.** Do: `invoiceRepo.findForTenant(id, ctx.tenantId)` → 404 if null. Avoid: `invoiceRepo.findById(id)` after only checking the user is logged in.
**Why.** IDs are guessable or leak; authentication alone lets any user read any object. This is the most common and most damaging API flaw.

### API2 — Broken Authentication
**Rule.** Use vetted identity components, validate tokens strictly, and protect credential endpoints with rate limits.
**Apply when.** Sign-in, token validation, password reset, MFA.
**Do / Avoid.** Do: library JWT validation with pinned algorithms and `aud` checks. Avoid: decoding JWTs without verifying, or accepting `alg: none`.
**Why.** Authentication flaws give attackers other users' identities wholesale.

### API3 — Broken Object Property Level Authorization
**Rule.** Allow-list writable fields on input and readable fields on output per role.
**Apply when.** Any create/update endpoint and any response serializer.
**Do / Avoid.** Do: `UpdateProfileInput = { displayName, avatarUrl }`. Avoid: `user.update(req.body)` letting clients set `isAdmin`.
**Why.** Mass assignment and over-exposure leak or escalate through fields nobody meant to expose.

### API4 — Unrestricted Resource Consumption
**Rule.** Limit request rate, payload and upload sizes, page sizes, query complexity, execution time, and spend on paid resources (SMS, email, LLM tokens).
**Apply when.** Every public endpoint; especially expensive ones.
**Do / Avoid.** Do: per-tenant token budget on an AI endpoint. Avoid: letting one client trigger thousands of SMS messages.
**Why.** Unbounded consumption causes outages and surprise bills.

### API5 — Broken Function Level Authorization
**Rule.** Check roles server-side for every privileged function; deny by default.
**Apply when.** Admin, support, billing, and internal endpoints.
**Do / Avoid.** Do: `requirePermission('users:impersonate')` in the handler. Avoid: relying on the admin UI being hidden.
**Why.** Attackers call endpoints directly; UI visibility is not access control.

### API6 — Unrestricted Access to Sensitive Business Flows
**Rule.** Protect flows that are harmful when automated (signup bonuses, ticket purchases, referrals, reservations) with quotas, device signals, or challenges.
**Apply when.** Any flow with monetary value or scarce inventory.
**Do / Avoid.** Do: per-account and per-device purchase limits on limited stock. Avoid: an open endpoint bots can loop.
**Why.** The API works as designed, but at machine speed it breaks the business.

### API7 — Server-Side Request Forgery
**Rule.** Treat user-supplied URLs as hostile: allow-list schemes and hosts, block internal ranges after DNS resolution, do not follow redirects blindly.
**Apply when.** Webhooks, URL previews, imports from URL, image fetchers.
**Do / Avoid.** Do: a dedicated egress proxy with deny rules. Avoid: fetching `http://169.254.169.254/` on a user's behalf.
**Why.** SSRF turns your server into a proxy into your private network and cloud credentials.

### API8 — Security Misconfiguration
**Rule.** TLS everywhere, strict CORS allow-lists, security headers, generic error bodies, patched dependencies, and least-privilege defaults.
**Apply when.** Configuring gateways, frameworks, and deployments.
**Do / Avoid.** Do: `Access-Control-Allow-Origin` set to known origins. Avoid: `*` together with credentials, or stack traces in production responses.
**Why.** Defaults and debug settings are the easiest exploits.

### API9 — Improper Inventory Management
**Rule.** Keep an inventory of every API host, version, and endpoint; retire old versions and non-production hosts on schedule.
**Apply when.** Releasing versions, creating staging or beta endpoints.
**Do / Avoid.** Do: OpenAPI as the source of truth, gateway-enforced routes. Avoid: a forgotten `v1-legacy` host without the new authorization checks.
**Why.** Old and shadow endpoints lack current protections and are rarely monitored.

### API10 — Unsafe Consumption of APIs
**Rule.** Validate, bound, and time-limit data from third-party APIs and LLMs exactly like user input.
**Apply when.** Integrating any external API, including AI model output.
**Do / Avoid.** Do: schema-validate provider responses and cap sizes. Avoid: passing third-party HTML into your pages or SQL.
**Why.** A compromised or buggy upstream becomes an injection vector into your system.

## 8. Web-layer basics for APIs

- Parameterized queries only; never concatenate SQL, shell commands, or LDAP filters.
- Output encoding in any HTML the API renders; no untrusted HTML passthrough.
- Security headers on HTML-serving APIs (CSP, `X-Content-Type-Options: nosniff`, HSTS).
- Secrets from a secret manager or environment, validated at startup; secret scanning in CI.
- Log authentication failures and authorization denials (without secrets) and alert on spikes.

## 9. Rules catalog

### Scope every query by the caller
**Rule.** Data-access functions take the caller's tenant/user and include it in the query.
**Apply when.** Writing any repository or query used by a request handler.
**Do / Avoid.** Do: `findInvoice(ctx, id)` with `WHERE tenant_id = ctx.tenantId`. Avoid: global `findById` reachable from handlers.
**Why.** Makes BOLA the default-safe path rather than a check someone must remember.

### Keep tokens out of JavaScript's reach in browsers
**Rule.** Browser apps use a BFF with `HttpOnly` session cookies; tokens stay server-side.
**Apply when.** Building web sign-in.
**Do / Avoid.** Do: BFF exchanges the code and stores tokens server-side. Avoid: `localStorage.setItem('access_token', …)`.
**Why.** Any XSS can read storage accessible to scripts; `HttpOnly` cookies are not readable by scripts.

## Sources

- OWASP API Security Top 10 2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OAuth 2.1 draft: https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/ ; overview: https://workos.com/blog/oauth-2-1-whats-new
- RFC 9700 OAuth 2.0 Security Best Current Practice: https://www.rfc-editor.org/rfc/rfc9700.html
- RFC 9449 DPoP: https://www.rfc-editor.org/rfc/rfc9449.html ; RFC 8705 OAuth mTLS: https://www.rfc-editor.org/rfc/rfc8705.html
- RFC 9728 OAuth Protected Resource Metadata: https://www.rfc-editor.org/rfc/rfc9728.html
- IETF, OAuth 2.0 for Browser-Based Applications (BFF guidance): https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/
- NIST SP 800-63-4 / 800-63B-4: https://pages.nist.gov/800-63-4/ ; summary: https://www.strongdm.com/blog/nist-password-guidelines
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- W3C Web Authentication (passkeys): https://www.w3.org/TR/webauthn-3/
- Model Context Protocol, Authorization: https://modelcontextprotocol.io/specification/draft/basic/authorization
