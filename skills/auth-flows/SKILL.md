---
name: auth-flows
description: Use when building, fixing, or reviewing login, sign-in, sign-up, registration, or account-security screens and the code behind them - email and password, email codes (OTP), magic links, social login (Google, Apple, Microsoft), enterprise SSO (SAML, OIDC), passkeys, MFA and 2FA, recovery codes, password reset, account recovery, email verification, sessions and cookies, remember me, sign out everywhere, and mobile auth. Covers build vs buy, the identifier-first Continue flow, NIST 800-63B-4 password rules, autocomplete markup, enumeration-safe errors, throttling vs lockout, session timeouts and revocation, step-up re-authentication, WCAG 3.3.8, Sign in with Apple rules, and a copy library. Also use when the user says "add auth", "make a login page", "design the sign-up screen", "add Google login", or "users get locked out". For app-wide authorization, injection, and headers use application-security; for API tokens and OAuth for third parties use api-design; for signup conversion framing use conversion-ux.
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "application-security interaction-design accessibility api-design conversion-ux mobile-design"
---

# Auth Flows

Sign-in and sign-up are the only screens every user must pass, and the only screens every attacker targets. Treat UX, copy, and security as one design problem: the flow that is easiest for a real person (one "Continue" field, autofill, passkeys, codes instead of links, helpful errors) is usually also the one that resists phishing, stuffing, and takeover — as long as the invisible parts (throttling, session handling, recovery) are done right. This skill gives the defaults for both halves and the trade-offs where they pull apart.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also establish: **audience** (consumer, B2B, enterprise with SSO), **platforms** (web, iOS, Android), **what an account protects** (low value, personal data, money, sensitive membership), and **what auth already exists** (provider, library, hand-rolled). These four facts decide every table below.

## Core principles

1. **Don't build auth primitives.** Use a maintained provider or library and audit its defaults; hand-rolled hashing, JWT parsing, TOTP, or WebAuthn parsing is where breaches start.
2. **One entry, no fork.** A single "Continue" identifier step beats separate Sign in / Sign up tabs; wrong-tab choices create duplicate accounts and dead ends.
3. **Offer a phishing-resistant path.** Passkeys everywhere you can; NIST 800-63B-4 requires at least one phishing-resistant option at AAL2.
4. **Recovery is part of login.** An account is only as strong as its weakest way back in; never weaker than sign-in, never security questions.
5. **Throttle, don't lock out.** Hard lockouts hand attackers a denial-of-service button; slow guessing down and keep an alternate path open.
6. **Sessions are server state.** Opaque tokens in `HttpOnly` cookies, rotated on login, revocable at once, revoked after a password reset.
7. **Helpful errors, deliberate disclosure.** Say what happened and what to do next; decide once how much account existence you reveal and apply it everywhere.
8. **Never block autofill, paste, or password managers.** It fails WCAG 3.3.8 and pushes users toward weak, reused passwords.

## Workflow

- [ ] **Decide build vs buy** with the table below; if something exists, list its defaults and compare them with this skill (see `references/build-vs-buy.md`).
- [ ] **Choose methods** per audience and platform (methods table); write down the enumeration stance and the session timeouts.
- [ ] **Draw the flows** before code: sign-in/sign-up, reset, verification, MFA challenge, step-up, recovery. Gate: every box has an error, a throttled, and a "use another way" exit.
- [ ] **Build screens** with the exact markup in `references/flows-and-screens.md` and copy from `references/copy-library.md`.
- [ ] **Implement the invisible parts**: hashing, throttling, token storage, cookie flags, CSRF, redirect allowlist, session revocation, notifications.
- [ ] **Test**: password manager saves and fills; paste works; OTP autofill works on iOS and Android; screen reader announces errors; throttling triggers and recovers; reset revokes other sessions; second browser shows sessions revoked.
- [ ] **Validate** against Gotchas; fix and repeat.

## Build vs buy

| Situation | Default |
|---|---|
| Auth is not the product, small team | A hosted identity provider or a maintained library with your framework (framework built-ins, Better Auth, Auth.js, Django/Rails/Laravel auth) |
| Enterprise customers need SAML/OIDC SSO and SCIM | A provider or library with SSO + SCIM support; never hand-roll SAML signature validation |
| Data residency, very large user counts, or lock-in concerns | Self-hosted library or IdP storing users in your database, so you own the password hashes |
| Learning or an unusual flow | Own it only with the Copenhagen Book / OWASP cheat sheets as spec, and still use vetted primitives (Argon2id, WebAuthn server, OIDC client libraries) |

Lucia was deprecated in March 2025 and is now a learning resource; do not start new projects on it. Whatever you adopt, **its defaults are not this skill's defaults** — e.g., Better Auth does not revoke other sessions on password reset unless configured, and its sign-up cannot both sign users in immediately and hide whether an email is registered. Audit table: `references/build-vs-buy.md`.

## Choose sign-in methods

| Method | Phishing-resistant | Default use | Watch out for |
|---|---|---|---|
| **Passkeys** (WebAuthn, discoverable, with conditional UI) | Yes | Offer to everyone, after first sign-in; autofill on the sign-in page | Recovery becomes the attack surface; always keep a fallback |
| **Email one-time code** | No | Default passwordless method and email verification | Only as safe as the inbox; not an authentication factor for regulated/AAL2+ contexts |
| **Magic link** | No | Only for desktop, same-device audiences | Corporate link scanners pre-fetch and consume single-use links; device mismatch |
| **Email + password** | No | When users expect it; pair with passkey upsell and optional MFA | Credential stuffing; requires the full password rules below |
| **Social** (Google, Apple, Microsoft) | Depends on provider | Consumer: Google + Apple; B2B: Google + Microsoft | Account linking by unverified email = takeover; iOS rule 4.8 |
| **Enterprise SSO** (SAML/OIDC) | Depends on IdP | B2B with admin-managed identity; discover by email domain | Domain claims need verification; SSO-enforced orgs must lose other paths |
| **SMS code** | No | Last-resort fallback only | NIST classes it "restricted": SIM swap, number porting, toll fraud |

Default stack for a new product: **identifier-first "Continue" → email code for new and passwordless users → passkey offered after sign-in → social buttons for the audience → SSO for B2B**. Add passwords when users or integrations expect them. Prefer email codes over magic links; if you must ship links, make the GET page show a button that POSTs, so scanners cannot consume them. Details: `references/passwordless-passkeys-mfa.md`.

## The default flow: one "Continue" screen

```
[Continue with Google] [Continue with Apple]      ← audience-appropriate providers, equal size
──────────── or ────────────
Email [_______________]  (autocomplete="username webauthn" → passkey autofill)
[Continue]
        │
        ├─ passkey chosen in autofill ──────────→ verify → signed in
        ├─ known, has password ────────────────→ password step (email read-only, "Change")
        ├─ known, social-only ─────────────────→ "This account uses Google. [Continue with Google]"
        ├─ email domain has SSO ───────────────→ redirect to the org's IdP
        └─ new (or passwordless) ──────────────→ email code → verify → account created → offer passkey
```

- **Show the last method used** ("You last signed in with Google") to prevent duplicate accounts.
- **Deferred accounts** (guest first, account at the moment of value) beat an upfront wall when the product can work without one; Apple 5.1.1(v) forbids forced login for apps without significant account-based features.
- **Sign-up asks for one identifier and one credential.** Name, role, company, and phone move to onboarding or come from the social provider. No confirm-email field; a show-password toggle instead of confirm-password.
- **Consent**: one line near the button ("By continuing, you agree to the Terms and Privacy Policy") with links; marketing opt-in is a separate, unticked checkbox.

Full diagrams (passkey autofill, reset, MFA, step-up, change email), ASCII screen layouts, and HTML: `references/flows-and-screens.md`.

## Markup that makes autofill work

| Field | Attributes |
|---|---|
| Identifier | `type="email" autocomplete="username webauthn" autocapitalize="none" spellcheck="false"` |
| New password | `type="password" autocomplete="new-password" minlength="15"` + show/hide `<button aria-pressed>` + a hidden or read-only `autocomplete="username"` field in the same form |
| Current password | `type="password" autocomplete="current-password"` |
| One-time code | **one** input, `inputmode="numeric" autocomplete="one-time-code"` — never six separate boxes that break paste |

`webauthn` must be the last token. Visible labels, not placeholders. Inputs at 16px or larger so iOS does not zoom.

## Email verification timing

| Model | Use when |
|---|---|
| **Verify first** (code before the account exists) | Default. Passwordless products, and anywhere email is the recovery channel |
| **Let in, verify later** (banner; gate sensitive actions until verified) | Low-risk consumer apps with password sign-up where time-to-value dominates |
| **Block until a link is clicked** | Avoid for new builds: link friction plus scanner pre-fetch |

Codes and tokens: CSPRNG, single-use, bound to one user and one address, hashed at rest, built from a configured base URL (never the `Host` header), pages carrying tokens send `Referrer-Policy: no-referrer`. A completed password reset also proves the inbox, so mark the email verified.

## Errors and account enumeration

| Product | Stance |
|---|---|
| Most B2B SaaS, marketplaces, social apps (membership is not secret) | **Specific, helpful errors** ("No account for ada@example.com — create one?", "Incorrect password. Forgot it?") plus strong throttling and bot challenges |
| Health, dating, finance, legal, adult, anything where *being a member* is sensitive | **Generic everywhere**: same message, status, and timing for login, sign-up, and reset; sign-up always answers "Check your email", and the email tells an existing user to sign in instead |

The trade-off is structural: **an instant session after sign-up reveals that the email was new**, and an identifier-first step reveals existence at step two. If you need secrecy, always send a code and branch inside the email. Whatever you choose, apply it to login, sign-up, and reset alike — one leaky endpoint undoes the other two.

## Passwords (only if you have them)

- **Length is the rule**: at least **15 characters** when the password is the only factor, at least **8** when MFA is mandatory (NIST 800-63B-4). Allow at least **64**. Accept spaces and Unicode (normalize to NFC before hashing).
- **No composition rules, no forced rotation, no hints, no security questions.** Force a change only on evidence of compromise.
- **Blocklist**: reject common, context-specific (product name, email), and breached passwords (Have I Been Pwned k-anonymity range API or its downloadable corpus), and say why.
- **Allow paste and password managers; offer show password.** A strength meter is guidance, not a gate.
- **Hash with Argon2id** (OWASP minimum m=19 MiB, t=2, p=1). bcrypt only with a 72-byte input cap enforced. Rehash on login when parameters rise. Hashing is CPU- and memory-heavy: limit concurrency so login floods cannot take the server down.
- Changing a password requires the current one (or fresh re-auth).

## Throttling, bots, and lockout

- **Per-account throttle** on every endpoint that verifies a secret (password, code, TOTP): a token bucket (e.g., 5 attempts, refilling 1 per minute) or rising delays; NIST caps consecutive failures at 100 before disabling that authenticator.
- **Per-IP / subnet limits** (IPv6 per /64) against spraying and stuffing, with the real client IP taken only from your trusted proxy hop.
- **Never a permanent lockout.** While the password path is throttled, "email me a code" and reset still work. Never lock or change an account because someone requested a reset.
- **Bot challenges escalate**: none at first, then a managed challenge (Turnstile, hCaptcha, reCAPTCHA) after failures or risk signals, on sign-up, sign-in, reset, and every code-sending endpoint. Every endpoint that sends email or SMS is rate-limited.
- Respond `429` with `Retry-After`; copy offers a way forward ("Wait 5 minutes or get a sign-in code by email").

## Sessions

```
Set-Cookie: __Host-session=<opaque token>; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000
```

- **Default: opaque, server-side sessions.** Token ≥128 bits from a CSPRNG; store only its SHA-256 hash. JWTs are for short-lived API or service tokens, not browser sessions — they cannot be revoked without rebuilding the session store.
- **Never** put session or refresh tokens in `localStorage`/`sessionStorage`; one XSS exfiltrates them all. SPAs use a backend-for-frontend with this cookie.
- **Rotate** the session ID on login, privilege change, and re-authentication.
- **Timeouts** (NIST 800-63B-4): consumer AAL1 sliding up to ~30 days; **AAL2 (MFA, most B2B): idle ≤ 1 h, absolute ≤ 24 h**; AAL3: idle ≤ 15 min, absolute ≤ 12 h. Enforce server-side; warn before idle expiry and keep the user's draft.
- **Revocation**: password **reset** → revoke all sessions, remembered devices, and refresh tokens. Password **change** → offer "Sign out of other devices", pre-checked. Logout invalidates server-side. Disabled or deleted account → all sessions end.
- **Device list** in security settings: device, browser, approximate location, last active, "This device", sign out per session and "Sign out of all other sessions".
- **Step-up (sudo mode)**: fresh re-authentication (≤ ~10–15 min old) before changing email, password, MFA, or passkeys, viewing API keys, deleting the account, or moving money.

## CSRF and redirects

- No state change on GET. `SameSite=Lax` plus a **Fetch Metadata** check (`Sec-Fetch-Site` must be `same-origin`, or `none` for typed navigation) with an **Origin** fallback on every unsafe method — or the framework's CSRF token. The login form needs it too (login CSRF).
- `?next=` / `redirect_to` accept only relative paths on your origin, parsed with a URL parser; reject `//evil.com` and `/\evil.com`.

## MFA and recovery

- **Factors, best first**: passkey or security key → TOTP app → SMS (restricted fallback, with the risk explained). Email is not a second factor when email alone can also reset the password.
- **Every login path enforces MFA** (web, mobile, API, legacy endpoints), and none can downgrade from a passkey to a weaker factor.
- **Recovery codes** at enrollment: shown once, copy/download/print, each single-use, hashed with a password hash; regenerating invalidates the old set.
- **Password reset with MFA on** requires the second factor (or a recovery code) *before* the new-password form.
- **Correct password + failed MFA** → notify the user; that is the signal of a stolen password.
- Admins may start a reset, never set or know a user's password. Support-assisted recovery needs identity checks as strong as enrollment.

## Mobile

- Third-party sign-in opens the **system browser**: `ASWebAuthenticationSession` on iOS, Custom Tabs (or Auth Tab) on Android — **never an embedded WebView**, which lets the app read credentials and breaks passkeys. Authorization code + PKCE, no client secret in the app.
- Native credential APIs: **AuthenticationServices** (passkeys, Sign in with Apple, password autofill via associated domains) and Android **Credential Manager** (passkeys, passwords, Sign in with Google in one sheet; Restore Credentials on new devices).
- **iOS App Review 4.8**: an app using a third-party or social login for the primary account must also offer an equivalent login service that limits data to name and email, lets users hide their email, and does no ad tracking without consent — usually Sign in with Apple. Apple's button must be no smaller than the others. **5.1.1(v)**: account creation requires in-app account deletion.
- Tokens live in **Keychain / Keystore-backed storage**, never plain preferences or AsyncStorage. **Biometrics unlock a stored credential locally; they never authenticate to your server by themselves** — a client-side "biometric OK" boolean is trivially bypassed.

Details: `references/mobile-auth.md`.

## Accessibility (WCAG 2.2 SC 3.3.8, AA)

Remembering a password or transcribing a code is a cognitive function test; it passes only when autofill and paste work. So: correct `autocomplete` tokens, paste never blocked, one OTP field, and at least one test-free path (passkey, social, or link). CAPTCHAs that ask users to transcribe text or audio do not count as the alternative. Errors are announced (`aria-live`/`aria-describedby`) and focus moves to the first one; the show-password toggle is a real `<button>` with `aria-pressed` that never clears the field.

## Copy essentials

| Moment | Copy |
|---|---|
| Entry | "Sign in or create an account" · [Continue] |
| Code sent | "We sent a code to **ada@example.com**. It expires in 10 minutes." [Resend code] (after 30 s) · [Use a different email] |
| Wrong password (specific mode) | "Incorrect password. Try again or reset it." |
| Wrong credentials (generic mode) | "That email and password don't match. Try again or reset your password." |
| Throttled | "Too many attempts. Wait 5 minutes, or get a sign-in code by email." |
| Reset requested | "If an account exists for **ada@example.com**, we've sent a reset link. It expires in 1 hour." |
| Reset done | "Your password is updated and you've been signed out of other devices." |
| Step-up | "For your security, confirm it's you to change your email." |

Never blame ("You entered an invalid…"), never expose internals, and keep the same verbs on buttons across the flow. Full library, emails, and notifications: `references/copy-library.md`.

## Gotchas

- **Separate Sign in / Sign up tabs.** Users pick the wrong one, hit "account already exists", or create a second account. Use one Continue step.
- **Enumeration protection on one endpoint only.** A generic login error means nothing if sign-up says "email already registered". Pick a stance; apply it to login, sign-up, and reset.
- **Composition rules and 8-character minimums on password-only accounts.** NIST requires 15 when the password is the only factor and forbids composition rules.
- **Six single-digit OTP boxes.** They break paste and autofill and fail WCAG 3.3.8. Use one field with `autocomplete="one-time-code"`.
- **Magic links consumed by email scanners.** Default to codes; if links, the GET shows a button that POSTs.
- **Hard lockout after N failures.** Anyone can lock anyone out. Throttle and keep a code or reset path working.
- **JWT in `localStorage` as the session.** No revocation, exfiltrated by any XSS. Opaque session in an `__Host-` HttpOnly cookie.
- **Reset that leaves old sessions alive.** The attacker who caused the reset stays signed in. Revoke all on reset — and check your library's default.
- **Linking a social login to an existing account by email alone.** Link only when the provider asserts a verified email, or after the user proves the existing account.
- **Keying social users by email.** Use `(issuer, subject)`; emails change and can be recycled.
- **Reset links built from the `Host` header.** Host-header injection sends reset tokens to an attacker. Use a configured base URL.
- **Unvalidated `?next=` redirects.** Login becomes a phishing launchpad.
- **Embedded WebView for Google or SSO sign-in on mobile.** Use the system browser session APIs.
- **"Biometric login" as a client-side flag.** Gate a Keychain/Keystore credential with biometrics, or use passkeys.
- **Security questions or SMS as the recovery path for an MFA account.** Recovery must be at least as strong as login.
- **CAPTCHA on every attempt.** Escalate on risk; always provide an accessible alternative.
- **Middleware-only auth checks.** Re-check the session in the handler or data layer (see `application-security`).

## Output format

For a new or reworked auth flow, deliver:

```
Decisions: provider/library · methods (by audience/platform) · enumeration stance · verification model · session timeouts (idle/absolute) · MFA policy
Flows: ASCII diagrams for sign-in/up, reset, verification, MFA/step-up, recovery
Screens: layout per step with states (default, loading, error, throttled, success) and final copy
Implementation: markup, cookie flags, token parameters, throttling limits, CSRF, redirect allowlist, revocation events, notifications
Library defaults changed: <setting: default → chosen value>
Tests: password manager + paste + OTP autofill, throttling, reset revokes sessions, enumeration consistency, screen reader
```

For an audit, list findings as **Blocker** (takeover or lockout risk, WCAG 3.3.8 failure) / **Major** / **Minor**, each marked Observed / Inferred / Not checked.

## References

| File | Read when |
|---|---|
| `references/flows-and-screens.md` | Drawing the sign-in/up, passkey autofill, reset, MFA, step-up, or change-email flows; laying out screens; writing the HTML and conditional-UI JavaScript |
| `references/passwords-and-sessions.md` | Implementing password storage, breached-password checks, throttling, session tokens, cookies, timeouts, revocation, remember-me, device lists, CSRF, or security notifications |
| `references/passwordless-passkeys-mfa.md` | Adding email codes, magic links, passkeys (registration, autofill, management), TOTP, recovery codes, remember-this-device, or step-up MFA |
| `references/mobile-auth.md` | Building sign-in in an iOS, Android, React Native, or Flutter app: system browser OAuth, native credential APIs, Sign in with Apple rules, token storage, biometrics |
| `references/copy-library.md` | Writing any auth screen, error, email, or security notification copy, in generic or specific enumeration mode |
| `references/build-vs-buy.md` | Choosing a provider or library, auditing its defaults, adding social login or enterprise SSO (OIDC, SAML, SCIM, domain discovery), or linking accounts |

## Related skills

- `application-security` — authorization, injection, XSS/CSP, headers, secrets, and the rest of secure-by-default engineering.
- `interaction-design` — general form mechanics, validation timing, and state design used on every auth screen.
- `accessibility` — WCAG 2.2 detail beyond 3.3.8 (labels, focus, announcements).
- `api-design` — OAuth 2.1 for your own API, token formats, and the OWASP API Top 10.
- `conversion-ux` — signup framing, social proof near signup, and measuring signup-to-activation.
- `onboarding-design` — what happens right after the account exists.
- `mobile-design` — keyboards, forms, and permission timing on phones; `ios-design` / `android-design` for platform specifics.
