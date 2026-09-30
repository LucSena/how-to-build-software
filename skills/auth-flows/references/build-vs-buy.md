# Build vs Buy, Library Defaults, and Federation

Choosing a provider or library, auditing its defaults, and adding social login and enterprise SSO safely. Product names are examples as of 2026-09; compare current features and pricing yourself (watch per-user and per-SSO-connection pricing, which is often where lock-in bites).

## Contents
1. Decision table
2. What a modern auth stack offers (checklist)
3. Questions before you commit
4. Library-default audit (example: Better Auth)
5. Rolling your own: the minimum spec
6. Social login and OIDC
7. Account linking
8. Enterprise SSO: SAML, OIDC, SCIM, domain discovery
9. Rules catalog

## 1. Decision table

| Situation | Choose | Examples (as of 2026-09) | Why |
|---|---|---|---|
| Auth is not the product; small team; standard flows | Framework built-in auth or a maintained library in your stack | Django auth, Rails 8 authentication generator, Laravel, ASP.NET Identity, Better Auth, Auth.js | Users stay in your database; no per-user fees; well-trodden code |
| You want hosted UI, MFA, and social with minimal code | Hosted identity provider | Clerk, Auth0, WorkOS AuthKit, Supabase Auth, Firebase Auth, Amazon Cognito | Fastest path; the vendor carries patching and abuse handling |
| B2B selling to enterprises (SAML/OIDC SSO, SCIM, org roles) | Provider or library with first-class orgs, SSO, and SCIM | WorkOS, Auth0/Okta, Clerk organizations, Better Auth `sso` + `scim` plugins, Keycloak | SAML is XML-signature heavy and easy to get wrong |
| Data residency, very large user counts, lock-in or cost concerns | Self-hosted IdP or library storing users in your database | Keycloak, Better Auth | You own users and hashes and can migrate |
| Learning, or a flow no product supports | Build on the spec with vetted primitives | Copenhagen Book / OWASP as spec; Argon2id, WebAuthn server, OIDC client libraries | Session + password + OAuth is small enough to own if you follow the spec |

Signals from the field: OWASP's Top 10:2025 notes that standardized authentication frameworks appear to be reducing authentication failures. Lucia's author deprecated the library in March 2025 and turned it into a learning resource with a copy-paste session implementation — a sign that the core is small, but only when done exactly to spec. Do not start new projects on Lucia.

## 2. What a modern auth stack offers (checklist)

Use this to compare candidates (feature list drawn from Better Auth's plugins; hosted providers offer similar sets):

- Email + password; email verification; password reset
- Social providers (Google, Apple, Microsoft, GitHub…)
- Email OTP, magic link, phone number (SMS)
- Passkeys (WebAuthn)
- Two-factor: TOTP, backup codes, OTP
- Anonymous / guest sessions upgradeable to accounts
- Organizations: teams, roles, invitations
- Enterprise SSO (OIDC, SAML) and SCIM provisioning
- Admin: ban, impersonate (audited), session revocation
- Multi-session (switch accounts), device list
- API keys, JWT/bearer for APIs, acting as an OAuth provider
- Device authorization flow (TVs, CLIs)
- Bot protection hooks (Turnstile, hCaptcha, reCAPTCHA); breached-password check
- "Last login method" hint
- Rate limiting with shared storage for multi-instance deploys

## 3. Questions before you commit

1. Can you **export users and password hashes** (and in which algorithm)? If not, leaving means forced resets or a lazy migration on next sign-in.
2. Where do users live — your database or theirs? What happens to sessions during a vendor outage?
3. Are sessions **revocable server-side**, and how fast (cookie caches, JWT lifetimes)?
4. Can you set password rules to NIST 800-63B-4 (15-character minimum when single-factor, no composition rules, breached check)?
5. Can you choose the **enumeration stance** consistently across sign-in, sign-up, and reset?
6. Are passkeys, conditional UI, and TOTP + recovery codes supported? Is SMS optional?
7. Does it support your mobile apps with system-browser OAuth + PKCE and native passkeys?
8. Can you customize every screen and email (copy, branding, language, accessibility)?
9. Are rate limits configurable, and do they work behind your proxy (trusted client-IP header)?
10. What are the SSO, SCIM, and MFA prices at your 12-month user count?

## 4. Library-default audit (example: Better Auth)

Every library ships defaults that differ from this skill. Check these for whatever you adopt; the Better Auth values below were verified against its docs.

| Check | Better Auth default | Set to |
|---|---|---|
| Revoke other sessions on password reset | **Off** | `revokeSessionsOnPasswordReset: true` |
| Minimum password length | 8 (max 128) | 15 unless MFA is enforced for everyone |
| Sign-up enumeration protection | Only when `requireEmailVerification: true` or `autoSignIn: false` — you cannot have instant sign-in after sign-up *and* hide that an email is registered | Choose deliberately per the enumeration table in `SKILL.md` |
| Magic-link token storage | Plain | `storeToken: "hashed"` |
| Session cookie cache | Off; when on, revoked sessions keep working until the cache expires | Keep short; bypass for sensitive operations |
| Rate limiting | Disabled in development; global 100 requests / 60 s; sign-in and 2FA verify 3 requests / 10 s | Shared storage (Redis or DB) in multi-instance deploys; test in a production-like mode |
| Client IP for limits | From forwarding headers | Configure the trusted proxy chain or limits are spoofable |
| Fresh-session window for sensitive actions | `freshAge` 1 day | Shorten (e.g., 10–15 minutes) for email, password, MFA, and deletion changes |
| Session lifetime | 7 days, refreshed daily | Match your timeout table (AAL2 for B2B: idle 1 h, absolute 24 h) |

## 5. Rolling your own: the minimum spec

If you build, you still use libraries for primitives, and you implement at least:
- Opaque sessions (≥ 128-bit tokens, hashed at rest, `__Host-` HttpOnly cookie, rotation, idle/absolute timeouts, revocation).
- Argon2id password hashing with bounded concurrency; breached-password check; NIST length rules.
- Email codes (hashed, single-use, ≤ 10 min, attempt caps); reset tokens (≥ 112 bits, hashed, ~1 h).
- Per-account and per-IP throttling with shared storage; bot-challenge escalation.
- CSRF (Fetch Metadata + Origin fallback, or tokens) on every state-changing request including login.
- Redirect allowlisting; base URL from config for all emailed links.
- OIDC client with `state`, PKCE, and full ID-token validation; users keyed by `(issuer, subject)`.
- Security notifications, audit logging without secrets, and tests for each flow.

The Copenhagen Book (MIT, archived) and its successor, the Auth Book, describe each of these precisely; use them with the OWASP cheat sheets as your spec.

## 6. Social login and OIDC

- Authorization Code + **PKCE** for every client; never implicit or password grants.
- **`state`**: ≥ 112 bits, in an `HttpOnly; Secure; SameSite=Lax; Path=/` cookie with a short lifetime (~10 minutes). Check that it is **present** and matches — forgetting the presence check is a classic bug.
- PKCE verifier 43–128 characters; `code_challenge_method=S256`.
- Validate the ID token: signature via the provider's JWKS, `iss`, `aud`, `exp`; use `nonce` where the flow calls for it.
- **Identify users by `(issuer, subject)`**, never by email alone. Namespace provider IDs so one IdP's user cannot collide with another's.
- Request minimal scopes (usually `openid email profile`).
- **Google**: use the official Sign in with Google components (web and Android Credential Manager) or follow Google's current branding guidance. Show One Tap-style prompts only on sign-in or landing pages and respect dismissals.
- **Apple on iOS**: Guideline 4.8 and button rules are in `mobile-auth.md`. On the web, Sign in with Apple is optional but useful for audiences with many Apple users.
- **Microsoft**: expected by B2B audiences on Microsoft 365.

## 7. Account linking

Account linking is one of the most common sources of account takeover.

- **Auto-link** a social identity to an existing account by email **only** when the provider asserts the email is verified and documents that claim (libraries often call these "trusted providers").
- Otherwise: "An account for ada@example.com already exists. Sign in with your password once to connect Google." Link after the user proves control of the existing account.
- Apple private relay addresses will not match existing emails; offer manual linking from security settings.
- Show linked providers in settings with "Disconnect" — but never let the user remove their last sign-in method.
- Unlinking or linking requires step-up and sends a notification.

## 8. Enterprise SSO: SAML, OIDC, SCIM, domain discovery

- **Home realm discovery** via identifier-first sign-in: map the email domain to the organization's connection and redirect to its IdP. Require **domain verification** (e.g., a DNS TXT record) before an org can claim a domain, and never allow claims on public email domains.
- Keep an explicit **"Sign in with SSO"** link (organization slug or work email) for users whose email domain doesn't match.
- **SSO enforcement** per org: when on, password, social, and email-code sign-in are disabled for that org's users; SSO is the only path (no side door around the IdP's MFA). Plan a break-glass admin path with strong MFA.
- **JIT provisioning** on first SSO sign-in, **SCIM** for updates and deprovisioning; on SCIM deactivation, terminate the user's sessions immediately.
- **SAML**: use a maintained library; validate signatures on the response or assertion, reject unsigned ones, check audience, recipient, and time conditions, and process each assertion once (replay protection).
- **Session coordination**: your session can outlive the IdP's. When recency matters (step-up, admin actions), ask the IdP to re-authenticate the user and check `auth_time` in the result.
- Admin UX: a self-serve SSO setup page with metadata upload or URL, a test-connection button, and clear error messages naming the failing field.

## 9. Rules catalog

### Audit library defaults on day one
**Rule.** Write down every security-relevant default of the auth library and change the ones that differ from policy.
**Apply when.** Adopting or upgrading any auth provider or library.
**Do / Avoid.** Do record "revokeSessionsOnPasswordReset: false → true" in the PR. Avoid assuming the library's choices are safe for your product.
**Why.** Defaults optimize for demos and backward compatibility, not for your threat model.

### Key federated users by issuer and subject
**Rule.** Store `(issuer, subject)` as the identity; email is an attribute.
**Apply when.** Any social or SSO sign-in.
**Do / Avoid.** Do look up by `(iss, sub)` first. Avoid `findUserByEmail(idToken.email)` as the sign-in lookup.
**Why.** Emails change, get recycled, and can be asserted unverified; subjects are stable per issuer.

### Verify domains before routing SSO
**Rule.** An organization can route an email domain to its IdP only after proving it owns that domain.
**Apply when.** Home realm discovery or SSO enforcement by domain.
**Do / Avoid.** Do require a DNS TXT record. Avoid accepting a domain typed into an admin form.
**Why.** An unverified claim lets one tenant capture another company's (or gmail.com's) sign-ins.

## Sources

- The Copenhagen Book (MIT) — OAuth, sessions, overall spec: https://thecopenhagenbook.com/ · https://github.com/pilcrowonpaper/copenhagen
- The Auth Book (ideas only): https://auth.pilcrowonpaper.com/
- Lucia deprecation notice: https://github.com/lucia-auth/lucia
- Better Auth docs (MIT) — plugins, email-password, session management, rate limit: https://github.com/better-auth/better-auth/tree/main/docs/content/docs
- OWASP Top 10:2025 introduction (standardized auth frameworks): https://owasp.org/Top10/2025/
- OWASP ASVS 5.0.0 V6 (6.8 identity providers) and V10 (OAuth and OIDC): https://github.com/OWASP/ASVS/tree/master/5.0/en
- OWASP OAuth 2.0 and SAML Security Cheat Sheets: https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html · https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html
- RFC 9700, OAuth 2.0 Security Best Current Practice: https://www.rfc-editor.org/rfc/rfc9700
- Apple HIG, Sign in with Apple (account linking): https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
