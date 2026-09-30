# L — Authentication Flows (UX + Implementation) and Application Security by Default

Research notes compiled 2026-09-30 for the Agent Skills repo. Scope: (A) login, sign-up, reset, MFA, passkeys, sessions, social/SSO, and mobile auth; (B) security by default: authorization, OWASP Top 10:2025, ASVS 5.0, input/output handling, headers, SSRF, uploads, secrets, logging, threat modeling.

## 0. Method, confidence and legend

**Primary sources read in full or in part this session (local clones or official pages):**

- **The Copenhagen Book** (pilcrowonpaper/copenhagen, MIT, all 13 pages). The README says the project is **archived** and replaced by **auth.pilcrowonpaper.com** ("the Auth Book", by the same author). I read the key topics of the successor too. The successor repo has no LICENSE file, so use its **ideas only, with credit**, and do not copy its text. <https://github.com/pilcrowonpaper/copenhagen>, <https://github.com/pilcrowonpaper/auth.pilcrowonpaper.com>
- **Lucia** was deprecated in March 2025 and is now a learning resource with a single-file session implementation. <https://github.com/lucia-auth/lucia> (README)
- **OWASP Cheat Sheet Series** (CC BY-SA 4.0): Authentication, Password Storage, Session Management, Forgot Password, MFA, Credential Stuffing, Authorization, CSRF, XSS, CSP, HTTP Headers, SQLi, Input Validation, SSRF, Mass Assignment, IDOR, OAuth2, JWT, Logging, File Upload, Threat Modeling, Transaction Authorization, Email Validation, LLM Prompt Injection. <https://cheatsheetseries.owasp.org/>
- **OWASP Top 10:2025** (repo OWASP/Top10, `2025/docs/en`). <https://owasp.org/Top10/2025/>
- **OWASP ASVS 5.0.0** ("Version 5.0.0, May 2025", CC BY-SA 4.0), chapters V3, V6, V7, V8, V9, V10. <https://github.com/OWASP/ASVS/tree/master/5.0/en>
- **NIST SP 800-63-4 / 800-63B-4** (final; HTML mirror repo usnistgov/800-63-4, last commit Aug 2025). <https://pages.nist.gov/800-63-4/sp800-63b.html>
- **passkeys.dev** (W3C/FIDO community site): bootstrapping, reauth, iOS/Android references, terms. <https://passkeys.dev/docs/>
- **Better Auth docs** (modern TypeScript auth library; used to see what a 2026 stack offers and what its defaults are). <https://github.com/better-auth/better-auth/tree/main/docs/content/docs>
- **Apple**: App Review Guidelines 4.8 and 5.1.1(v); HIG "Sign in with Apple" and "Managing accounts"; AuthenticationServices API pages. <https://developer.apple.com/app-store/review/guidelines/>
- **Android**: Credential Manager, Sign in with Google via Credential Manager, Restore Credentials. <https://developer.android.com/identity/sign-in/credential-manager>
- **WCAG 2.2 Understanding 3.3.8** (w3c/wcag repo). <https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html>
- **WHATWG HTML autofill tokens** (source grep). <https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill>
- **GitHub Advisory Database**: CVE-2025-29927 (Next.js middleware authz bypass) and CVE-2025-55182 (React Server Components RCE).
- **DBSC explainer** (w3c/webappsec-dbsc), **supabase/auth issues** (magic links broken by link scanners), and the READMEs of the authorization engines.

**Web search was unavailable.** The session-wide search budget was already spent. Facts that could not be checked against a primary source are marked **[U] = unverified**, from memory, re-check before shipping. Everything else is marked or implied **[V] = verified this session** against the source cited.

**Existing notes this builds on:** E-architecture §5.8–5.9 (API security, OAuth 2.1 draft, BFF, passkeys at a high level); A2 §4.4 (sign-up conversion rules: field counts, social auth prominence, post-submit verification UX); B-ux-principles (forms, labels, recognition over recall). These notes do not repeat those rules. They add the auth-specific layer.

---

# PART A — AUTHENTICATION FLOWS

## A0. First decision: build vs buy, and which methods

### A0.1 Build vs buy decision table

| Situation | Recommendation | Why |
|---|---|---|
| B2C/B2B SaaS, auth is not the product, small team | **Use a library or hosted IdP**. Libraries: Better Auth, Auth.js, framework built-ins (Django, Rails 8 auth generator, Laravel, ASP.NET Identity). Hosted: Clerk, Auth0, WorkOS AuthKit, Supabase Auth, Firebase Auth, Cognito, Keycloak (self-hosted). | OWASP Top 10:2025 notes that "increased use of standardized frameworks for authentication appears to be having beneficial effects" on A07 occurrences [V, Top10 intro]. |
| Enterprise customers need SAML/OIDC SSO + SCIM | Hosted B2B IdP (WorkOS, Auth0/Okta, Clerk orgs, Better Auth `sso` + `scim` plugins, Keycloak) | SAML is XML-signature-heavy and easy to get wrong. ASVS 6.8.2–6.8.3 require signature validation and single-use assertions [V]. |
| Data residency, cost at huge MAU, or lock-in concerns | **Self-hosted library** (Better Auth, Keycloak, Ory, Zitadel [U for Ory/Zitadel features]) storing users in *your* DB | You own the users table and can migrate password hashes. Hosted IdPs may not export hashes [U, varies by vendor]. |
| Learning, or a very custom flow | Roll your own **only** with Copenhagen/Auth Book + OWASP as the spec, and still use vetted primitives: Argon2id library, WebAuthn server library (SimpleWebAuthn, py_webauthn, webauthn4j), OIDC client library | Lucia's author deprecated the library and published a copy-paste session implementation plus a book, a signal that "session + password + OAuth" is small enough to own if you follow the spec [V, Lucia README]. |

**Rules for agents:**

- Never hand-roll crypto primitives: hashing, JWT parsing, TOTP HMAC, WebAuthn CBOR/COSE parsing. Use maintained libraries.
- Check the library's *defaults* against this document. For example, Better Auth does **not** revoke other sessions on password reset unless `revokeSessionsOnPasswordReset: true` is set [V, better-auth email-password.mdx].
- Pricing and MAU tiers change often. Do not hard-code them in skills. Say "compare current pricing; watch per-MAU and SSO-connection pricing, which is often the lock-in lever" [U].

### A0.2 What a modern auth stack offers (Better Auth plugin list as a 2026 feature checklist) [V]

Email & password; ~35 social providers; `magic-link`; `email-otp`; `passkey`; `two-factor` (TOTP, OTP, backup codes); `phone-number`; `username`; `anonymous` (guest → upgrade); `one-tap` (Google); `organization` (multi-tenant teams, roles, invites); `sso` (OIDC/SAML); `scim`; `admin` (ban, impersonate); `multi-session`; `api-key`; `jwt`; `bearer`; `oauth-provider` (be an IdP); `device-authorization` (TV/CLI device flow); `captcha` (Turnstile, reCAPTCHA, hCaptcha, CaptchaFox); `have-i-been-pwned`; `last-login-method` ("Last signed in with Google" hint); `siwe`; `mcp`/`agent-auth`. Source: <https://github.com/better-auth/better-auth/tree/main/docs/content/docs/plugins>

The `last-login-method` pattern is worth copying into UX guidance. Showing "You last signed in with Google" cuts duplicate-account creation when users forget which method they used. That effect is plausible, but no measured figure was found [U].

### A0.3 Choosing authentication methods

| Method | Phishing-resistant | Friction | Main risk | Use when |
|---|---|---|---|---|
| Passkey (WebAuthn discoverable + UV) | **Yes** (origin-bound) | Lowest once set up | Recovery flow becomes the attack surface | Default to offer everywhere. NIST: "Verifiers SHALL offer at least one phishing-resistant authentication option at AAL2" [V, 800-63B-4 §2.2] |
| Password + TOTP/passkey 2FA | Partly (only if 2nd factor is WebAuthn) | Medium | Password reuse; TOTP relay phishing | Existing products; enterprise |
| Password only | No | Low with a password manager | Credential stuffing | Low-value sites only. NIST requires **≥15 chars** when single-factor [V] |
| Email OTP code | No | Medium (context switch to inbox) | Only as secure as the mailbox; code relay phishing | Passwordless consumer apps; cross-device |
| Magic link | No | Medium | Link scanners consume single-use links; device mismatch | Desktop-first, same-device audiences |
| SMS OTP | No | Medium | SIM swap, SS7, SMS pumping fraud | Last-resort fallback. NIST classes PSTN as **restricted** [V] |
| Social / OIDC | Depends on IdP | Lowest for users with an IdP session | IdP account takeover; account-linking bugs | B2C (Google/Apple); B2B (Google/Microsoft + SAML/OIDC SSO) |

Auth Book stance [V, authentication_methods]:

- Choose the method your threat model needs from day one. Adopting a stronger method up front is easier than bolting on bot detection and heuristics later.
- If email alone can reset the password, then "password + email code" as 2FA adds little. Require a second factor *during* password reset.

---

## A1. Sign-up flow

### A1.1 Layout patterns

**Pattern 1: Unified "Continue" (identifier-first), the recommended default for 2026.**

```
┌──────────────────────────────────────────┐
│  Sign in or create an account            │
│  [ Continue with Google ]                │
│  [  Continue with Apple ]   (iOS: required equivalent, see A11.4)
│  ─────────────── or ───────────────      │
│  Email  [____________________________]   │  autocomplete="username webauthn"
│  [ Continue ]                            │
│  By continuing you agree to the Terms and Privacy Policy.   (links; see A1.5)
└──────────────────────────────────────────┘
         │ submit email
         ▼
   server: does account exist? (see A4.3 on enumeration)
     ├─ exists, has passkey  → trigger WebAuthn get() (or conditional UI already fired)
     ├─ exists, password     → "Enter your password" step (email shown read-only + "Change")
     ├─ exists, SSO domain   → redirect to IdP (home realm discovery, A11.6)
     ├─ exists, social-only  → "You signed up with Google. Continue with Google"
     └─ new                  → send email OTP → verify → create account → offer passkey
```

- Why: it removes the "Sign in vs Sign up" confusion. Users who pick the wrong tab create duplicates or hit "account already exists" errors.
- passkeys.dev's bootstrapping flow is identifier-first ("Start off by asking the user for their account identifier") [V].
- Trade-off: it reveals whether an account exists. See A4.3 for mitigations and when that is acceptable.

**Pattern 2: Social-first.** Big provider buttons on top, "Continue with email" collapsed below.

- Best for consumer mobile apps where most users have Google or Apple sessions.
- Apple HIG: the Sign in with Apple button must be "no smaller than other sign-in buttons" and must not require scrolling to see [V].

**Pattern 3: Email-first with inline password (classic).**

- Email + password on one screen, plus a "Sign up" link. Acceptable for password-centric products.
- Put fields in one column. Never add a "confirm email" field (A2 §4.4).
- OWASP Forgot-Password says to confirm the *new password* by entering it twice on reset [V]. On sign-up, prefer a show-password toggle over a confirm field. That is a UX judgement consistent with NIST's "SHOULD offer an option to display the password" [V].

**Pattern 4: Deferred account (guest-first).**

- Let the user use the product, then create the account at the moment of value.
- Apple HIG: "Delay sign-in as long as possible", and in commerce "wait until after people make a purchase before asking them to create an account" [V].
- Apple Guideline 5.1.1(v): "If your app doesn't include significant account-based features, let people use it without a login" [V].
- Implementation: anonymous/guest session, then link or upgrade (Better Auth `anonymous` plugin) [V].

### A1.2 Minimal fields

- **Required:** identifier (email) and one credential (passkey, OTP, or password). That's all.
- Name, role, company, and phone go to onboarding. Social login usually supplies the name.
- Sign in with Apple HIG: don't ask for a password after SIWA, and don't ask for a personal email when the user chose a private relay address [V].
- For legally required data (age, region), say it is required and why (Apple HIG) [V].

### A1.3 Exact HTML (web)

```html
<!-- Step 1: identifier -->
<form method="post" action="/auth/continue">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" inputmode="email"
         autocomplete="username webauthn" autocapitalize="none" spellcheck="false"
         required maxlength="254">
  <button type="submit">Continue</button>
</form>

<!-- Sign-up password step (if using passwords) -->
<label for="new-password">Create a password</label>
<input id="new-password" name="password" type="password"
       autocomplete="new-password" minlength="15" maxlength="128"
       aria-describedby="pw-hint" required>
<button type="button" aria-controls="new-password" aria-pressed="false">Show</button>
<p id="pw-hint">At least 15 characters. Long passphrases work well. A password manager can generate one for you.</p>
<!-- Keep a hidden/readonly username field in the same form so managers save the right account: -->
<input type="email" name="username" autocomplete="username" value="ada@example.com" readonly hidden>

<!-- Sign-in password step -->
<input id="password" name="password" type="password" autocomplete="current-password" required>

<!-- OTP step -->
<label for="code">Enter the 6-digit code we sent to ada@example.com</label>
<input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
       pattern="[0-9]*" maxlength="8">
```

- Tokens `username`, `new-password`, `current-password`, `one-time-code`, `email` and `webauthn` are all defined in the WHATWG autofill spec. `webauthn` is only valid as the last token, after `username` or `current-password` [V, whatwg/html source]. passkeys.dev uses `autocomplete="username webauthn"` [V].
- Use **one** OTP input, not six boxes. WCAG 3.3.8 Understanding shows split digit inputs where pasting fills only the first box as a failure example [V]. If you must use segmented boxes, handle paste across all of them.
- `/.well-known/change-password` redirecting to your change-password page lets password managers deep-link there. This is a W3C "Well-Known URL for Changing Passwords" draft [U].
- For the SMS Web OTP API, append `@example.com #123456` as the last line of the SMS to bind the code to the origin [U].

### A1.4 Email verification timing (decision table)

| Model | How | Pros | Cons | Use when |
|---|---|---|---|---|
| **Verify-first (OTP before account exists)** | Email → 6–8 char code → account created | No unverified accounts; the email is proven; doubles as login (passwordless) | One extra step before value | Passwordless products; anywhere email is the recovery channel |
| **Let in, verify later** | Create account, session starts, banner "Verify your email", gate sensitive actions | Fastest time-to-value (A2 §4.4 "consider delaying verification") | Squatting: someone can register another person's email. Unverified accounts pile up | Low-risk consumer apps with password sign-up |
| **Block until verified (link)** | Account created but unusable until link clicked | Simple | Link friction; scanners can pre-consume links | Legacy; avoid for new builds |

Implementation rules [V unless marked]:

- If emails must be unique, verification is a must. Password reset should also mark the email verified, since reset proves inbox control (Copenhagen).
- Codes: **≥8 digits numeric or ≥6 alphanumeric**. Avoid mixed case and ambiguous characters (0/O, 1/I). Use a CSPRNG. Single-use. Valid 15 minutes to 24 hours. Throttle about **10 attempts/hour/user**. Issue a new code on each resend (Copenhagen). The Auth Book's newer guidance: **≥40 bits** of entropy (8 chars from a 32-symbol alphabet), expiry ≤1 h, token bucket 5 capacity refilling 1/min, hash the code with Argon2id-light, bind it to a pre-auth session [V].
- Bind each code/token to **one user + one email address**, so an email change invalidates it.
- Invalidate all sessions when the email becomes verified, and re-issue one for the current device (Copenhagen) [V].
- Put `Referrer-Policy: strict-origin` (or `no-referrer`) on any page whose URL carries a token [V, Copenhagen; OWASP says `noreferrer`].
- Build email links from a **configured base URL, never the `Host` header**. Host-header injection can point reset links at an attacker's domain [V, OWASP Forgot Password].
- **Email normalization differs between sources, so pick one and document it:**
  - OWASP Email Validation: lowercase the **domain**; only fold the local part if you fully own that behavior [V].
  - Copenhagen: lowercase the whole address [V].
  - Auth Book: never silently modify input. Reject disallowed characters instead [V].
  - Recommended default: store as typed. Compare on lowercased domain + case-insensitive local part via a normalized unique index. Never strip `+tags` silently.
- Validation: don't regex-validate RFC 5322. Check for one `@`, a non-empty local part, and a domain with a dot. Cap at 254–255 chars. Beware ReDoS [V, Copenhagen/OWASP].
- **Disposable email** blocking: use a maintained list such as <https://github.com/disposable-email-domains/disposable-email-domains> [U, repo not opened]. Treat it as fraud scoring, not a hard wall, for most products. OWASP: "Maintain a list of known disposable domains if appropriate" [V].

### A1.5 Consent and legal

- Use **no pre-ticked** consent boxes for marketing. For terms of service, a clear line such as "By continuing, you agree to our Terms and Privacy Policy" next to the primary button is common. Whether an explicit checkbox is needed depends on jurisdiction [U, check GDPR/ePrivacy counsel]. GDPR consent must be an unambiguous affirmative act (Recital 32 / CJEU *Planet49*, 2019, on pre-ticked boxes) [U, not fetched].
- Marketing opt-in is a separate, unchecked checkbox.
- iOS: if the app supports account creation, it **must offer in-app account deletion** (Guideline 5.1.1(v)). HIG adds:
  - deletion, not just deactivation;
  - an easy-to-find link if deletion is web-only;
  - revoke SIWA tokens on deletion;
  - explain subscription billing [V].

### A1.6 Bot protection at sign-up

- Use invisible or managed challenges: Cloudflare Turnstile, hCaptcha, reCAPTCHA v3/Enterprise. Apply them to sign-up, password sign-in, reset, and OTP-send endpoints. Better Auth's captcha plugin covers the email & password endpoints by default [V].
- **Escalate:** no challenge at first, then a challenge after N failures or on a risk signal. OWASP: "more user-friendly to only require a CAPTCHA be solved after a small number of failed login attempts" [V].
- CAPTCHA is defense-in-depth, not prevention. Solver farms exist (OWASP) [V].
- Accessibility: WCAG 3.3.8 treats transcription CAPTCHAs, including audio ones you must transcribe, as cognitive function tests. An alternative path is required [V].
- **SMS pumping / toll fraud:** if sign-up sends SMS, rate-limit per number/prefix/IP and block premium-rate country prefixes you don't serve [U, vendor docs].

---

## A2. Passwords (if you have them)

### A2.1 Policy: NIST SP 800-63B-4 (final) [V, quoted from the §3.1.1.2 normative text]

| Rule | NIST 800-63B-4 | OWASP ASVS 5.0 |
|---|---|---|
| Minimum length | **SHALL ≥15** when the password is single-factor. **SHALL ≥8** when used only as part of MFA | 6.2.1: ≥8, "15 strongly recommended" (L1) |
| Maximum length | SHOULD permit **≥64** | 6.2.9: ≥64 (L2) |
| Characters | SHOULD accept all printing ASCII + space. SHOULD accept Unicode, where each code point counts as one character | 6.2.5: any composition |
| Composition rules | **SHALL NOT** impose (no "1 upper, 1 digit, 1 symbol") | 6.2.5 |
| Periodic rotation | **SHALL NOT** require. SHALL force a change on evidence of compromise | 6.2.10 (L2) |
| Blocklist | SHALL check the whole password against common/expected/compromised lists. SHALL tell the user why it was rejected. SHALL offer guidance | 6.2.4 top-3000 list (L1); 6.2.12 breached set (L2); 6.2.11 context words such as the product name (L2) |
| Hints / security questions | SHALL NOT store hints available to unauthenticated users. SHALL NOT prompt for KBA | 6.4.2 no hints/secret questions (L1) |
| Truncation | SHALL verify the entire password | 6.2.8 verify exactly as received (L1) |
| Password managers / paste | SHALL allow managers and autofill. SHOULD allow paste | 6.2.7 (L1) |
| Show password | SHOULD offer a display option | 6.2.6 masked by default, reveal allowed |
| Mistyping allowances | MAY trim leading/trailing whitespace or accept a different case for the first character, if min length still holds | — |
| Throttling | SHALL limit consecutive failures on one account to **≤100** | 6.3.1 |

- Practical default: **15-character minimum for password-only accounts**. 8 is acceptable if MFA is mandatory.
- Max 64–128 characters. Bcrypt caps at 72 bytes (see below).
- Better Auth defaults are min 8 / max 128 [V]. Raise `minPasswordLength` to 15 if MFA is not enforced.
- The Auth Book (author's opinion) suggests a min of 8–10, printable ASCII only, and rejecting leading/trailing spaces, to catch input errors [V]. This conflicts with NIST's SHOULD on Unicode. **Recommend NIST** for skills, and note the conflict. If you accept Unicode, apply **NFC normalization** before hashing (Auth Book) [V].

### A2.2 Breached-password check

- HIBP Pwned Passwords k-anonymity API: SHA-1 the password, send the first 5 hex chars to `GET https://api.pwnedpasswords.com/range/{prefix}`, and compare suffixes locally. Or self-host the downloadable corpus [V, Copenhagen/OWASP].
- Better Auth has a `have-i-been-pwned` plugin [V].
- UX copy when a password is rejected: "This password has appeared in a data breach, so it's easy for attackers to guess. Try a longer phrase or let your password manager create one."

### A2.3 Strength meter

- Use zxcvbn-ts (<https://github.com/zxcvbn-ts/zxcvbn>) [V, OWASP link] as **guidance, not a rule**.
- Show live feedback against the one real rule (length) plus the blocklist result. Don't show a checklist of composition rules.

### A2.4 Storage (hashing parameters) [V, OWASP Password Storage CS]

| Algorithm | Minimum parameters (OWASP) | Notes |
|---|---|---|
| **Argon2id** (default) | m=19 MiB (19456 KiB), t=2, p=1. Equivalent options: m=46 MiB t=1; m=12 MiB t=3; m=9 MiB t=4; m=7 MiB t=5 | Auth Book suggests m≥16 MiB, t=3, p=1, and raising memory rather than t or p [V] |
| scrypt | N=2^17 (128 MiB), r=8, p=1 (or N=2^16,p=2 …) | Copenhagen lists N=16384, r=16, which is older guidance. **Use OWASP** |
| bcrypt | cost ≥10; **72-byte input limit**. Enforce max length or pick Argon2id | Don't pre-hash with raw SHA (null-byte issues); don't DIY-pepper with HMAC (Copenhagen) |
| PBKDF2 | 600,000 iterations HMAC-SHA-256 | Only if FIPS-140 is required |

- Target under ~1 s per hash (OWASP). Upgrade the work factor transparently on the user's next login [V].
- **A salt per hash** (≥16 bytes CSPRNG). **Pepper optional**: store it in a vault/HSM, and prefer an algorithm with a native secret parameter [V].
- Compare in **constant time**. Library `verify()` functions do this.
- **Hashing is a DoS vector.** Queue or limit concurrent hashes. In Node, run off the main thread (a worker pool or a native lib that is async) [V, Auth Book/Copenhagen].
- Change password: require the **current password** (NIST/ASVS 6.2.3; OWASP) [V].

---

## A3. Passwordless email: OTP code vs magic link

| | Email OTP code | Magic link |
|---|---|---|
| Cross-device (read mail on phone, sign in on laptop) | **Works** | Breaks. Opens the session on the wrong device unless you do "approve on other device" |
| Link-scanning security gateways (Microsoft Defender Safe Links, Mimecast, etc.) | Unaffected | **Can pre-fetch and consume single-use links** (supabase/auth #1214 "Magic Links are invalidated by corporate link scanning software"; #368 "Email client previewing links expires confirmation/reset/invite tokens") [V, issue titles] |
| Mobile | `autocomplete="one-time-code"` + iOS/Android code autofill from Mail/Messages [U for Mail autofill specifics] | Deep link must open the app (Universal/App Links) |
| Phishing | Code can be relayed by a fake site (real-time phishing) | A link can also be proxied, but it is harder to trick users into moving it |
| Spam filters | Codes-only mail is less likely to be flagged (Copenhagen: "Some filters may automatically classify emails with links as spam") [V] | More filtering |
| Accessibility (WCAG 3.3.8) | Transcription = cognitive test. Mitigate with autofill and paste support | Clicking a link is not a cognitive test |

**Recommendation:** prefer **email OTP code** as the default. The Auth Book author states the same: "my preferred option compared to using single-use verification links" [V].

If you ship magic links, make them scanner-safe:

1. The GET on the link renders a confirmation page with a **"Sign in" button that POSTs**. Scanners generally don't submit forms [U, common practice]. Only the POST consumes the token.
2. Or include both a link and a code in the same email.
3. Bind the flow to the initiating browser (a pre-auth session cookie). If the link is opened elsewhere, ask "Were you trying to sign in on Chrome on Windows?" before approving, or show the code instead.

- Parameters: token ≥112 bits (Copenhagen server-side tokens; 15 random bytes base32 = 24 chars). Short expiry: Better Auth magic link defaults to **5 min** [V]; email OTP defaults to 6 digits, 5 min, **3 attempts** then invalidated [V].
- ASVS 6.5.5: out-of-band codes max lifetime **10 min** [V].
- Single-use via atomic consume (delete-on-read in one transaction) [V, Copenhagen].
- Rate-limit every endpoint that sends email. Don't cap the number of concurrent codes per account, because that becomes a lockout vector (Auth Book) [V].
- Security note: NIST 800-63B-4 says "Email SHALL NOT be used for out-of-band authentication". Confirmation codes for verifying email addresses and recovery codes are excluded from that ban [V]. ASVS 6.3.6 (L3): email not used as an authentication factor [V].
- So email-code login is fine for ordinary consumer apps, but not for AAL2+/regulated contexts without another factor.

---

## A4. Login

### A4.1 Screen anatomy (identifier-first with passkey autofill)

```
Page load:
  if PublicKeyCredential.isConditionalMediationAvailable():
      options = GET /webauthn/authentication-options   (random challenge ≥16 bytes, stored server-side)
      navigator.credentials.get({ mediation: "conditional", publicKey: {...options, userVerification: "preferred"} })
         └─ resolves only if the user picks a passkey in the autofill dropdown → POST /webauthn/verify → session
User types email → [Continue]
  → server decides next step (password | OTP | SSO redirect | social hint)
  → Step 2 shows the identifier read-only with "Not you? Change"
  → links: "Forgot password?" (on the password step), "Use a different method"
```

Sources: passkeys.dev bootstrapping (code and behavior) [V]. `userVerification: "preferred"` avoids repeated OS-password prompts on desktops without biometrics. **Validate the UV flag server-side** against your policy [V].

### A4.2 "Remember me"

- Long-lived sessions with sliding expiry are the default for consumer apps (A5.3). Remember-me then just chooses between a persistent cookie (`Max-Age`) and a browser-session cookie. Better Auth `rememberMe: false` means "signed out when the browser closes" [V].
- Don't implement remember-me as a stored password or a separate long-lived auto-login token that bypasses session rotation.
- For "remember this device" with MFA, see A9.6.

### A4.3 Error messages and account enumeration (decision table)

Positions:

- **OWASP**: generic messages everywhere (login, reset, sign-up), identical status codes, and uniform timing (always hash, even for unknown users) [V].
  - Correct: "Login failed; Invalid user ID or password."
  - Reset: "If that email address is in our database, we will send you an email to reset your password."
  - Sign-up: "A link to activate your account has been emailed to the address provided."
- **ASVS 6.3.8** requires non-enumeration only at **L3**. Error-message, status-code and timing equality are required there [V].
- **Copenhagen**: generic by default, but specific messages are "fine for websites where usernames are already public … or where knowing the validity of an email isn't important (i.e. most sites)" as long as brute-force protections exist [V].
- **Auth Book** (2025+): recommends *explicit* errors. Preventing enumeration fully is hard (timing, sign-up and reset leaks) and hurts UX. If identity privacy matters, use an opaque username instead of email [V].
- **Better Auth**: sign-up is enumeration-safe *only* when `requireEmailVerification: true` or `autoSignIn: false`. You cannot both hide existence and auto-sign-in on sign-up [V]. This is the core trade-off: **instant sign-up session ⇔ enumeration leak**.

| Product type | Recommended behavior |
|---|---|
| Social network, marketplace, B2B SaaS where users are colleagues | Specific, helpful errors: "No account for ada@example.com. Create one?" / "Incorrect password." Plus strong throttling and a bot challenge. Enumeration already leaks via profile pages and invites |
| Health, dating, adult, legal, finance, whistleblowing, anything where *membership itself* is sensitive | Fully generic login/reset/sign-up. Sign-up via "Check your email" (the email says "you already have an account, sign in here"). Uniform timing |
| Identifier-first unified flow | Existence is inherently revealed at step 2. Accept it (most products), or always send an OTP ("We sent a code to ada@…") and branch inside the email |

Copy examples:

- Generic: **"That email and password don't match. Try again or reset your password."**
- Specific: **"We couldn't find an account for ada@exmaple.com. Did you mean ada@example.com?"** (typo suggestion) · **"Incorrect password. Forgot it?"**
- Locked/throttled: **"Too many attempts. Try again in 5 minutes, or sign in with a code sent to your email."** Give a way forward. Don't say "account locked" if in generic mode.
- SSO-required: **"example.com uses single sign-on. Continue with Okta →"**
- Social-only account: **"This account uses Sign in with Google."** [Continue with Google]

### A4.4 Throttling, lockout, credential stuffing

Attack types (OWASP): **brute force** (many passwords → 1 account), **credential stuffing** (breached pairs → many accounts), **password spraying** (1 password → many accounts) [V].

Layered defaults:

1. **Per-account throttle**, not a hard lockout.
   - OWASP ties the counter to the account, not the IP. Consider exponential delays [V].
   - NIST: ≤100 consecutive failures, then disable that authenticator. Waits that rise as the limit nears (e.g. 30 s up to 1 h) are allowed [V].
   - Auth Book: token bucket (capacity 5, +1/min) per user on every password-hashing endpoint (~500k guesses/yr max). **Avoid lockouts and exponential throttling** because they let attackers lock users out. Avoid strict IP limits (shared NATs; attackers use proxy pools) [V].
   - Better Auth defaults: global 100 req/60 s. `/sign-in/email` and `/two-factor/verify`: 3 req/10 s. IPv6 limited per /64 [V].
2. **Per-IP / per-subnet / per-ASN limits** for spraying and stuffing. Copenhagen's example: block an IP for 10 min after 10 consecutive failures [V].
3. **Lockout DoS mitigation**: keep "sign in with email code" or "reset password" working while the password path is throttled (OWASP) [V]. Never lock accounts because of reset requests (OWASP Forgot Password) [V].
4. **Bot signals + CAPTCHA escalation** (A1.6). Device cookies let known devices bypass per-account throttles (OWASP "Slow Down Online Guessing Attacks with Device Cookies") [V link].
5. **Breached-credential detection**: check passwords at sign-up/change against HIBP. On login, if the password is known-breached, force a change after successful auth [V, NIST "SHALL force a change if … evidence of compromise"].
6. **MFA** is "by far the best defense". OWASP cites Microsoft's "99.9% of account compromises" figure [V as quoted by OWASP].
7. **Notify** on a correct password with failed MFA, not on single wrong passwords (OWASP Credential Stuffing: avoid notification fatigue) [V]. Show last-login time/location at login [V].
8. **Document** the controls (ASVS 6.1.1 L1) [V].

HTTP: return `429 Too Many Requests` with `Retry-After` (E-architecture §5 rate limiting). Keep the login response shape identical across failure reasons, since status codes leak too (OWASP) [V].

### A4.5 Login CSRF and open redirects

- **Login CSRF**: an attacker logs the victim into the *attacker's* account, and the victim then saves card details there. Mitigate with a pre-session CSRF token or an Origin/Sec-Fetch-Site check on the login POST. Destroy the pre-session on login (fixation) [V, OWASP CSRF].
- **`?next=` / `redirect_to`**: allow only relative paths on your own origin. Parse with a URL parser, and reject `//evil.com`, `/\evil.com` and schemes. Otherwise login becomes a phishing launchpad [V, Copenhagen open-redirect; ASVS 3.7.2].

---

## A5. Sessions

### A5.1 Opaque server-side sessions vs JWTs

| | Opaque session token (DB/Redis) | Stateless JWT session |
|---|---|---|
| Revocation (logout, "sign out everywhere", ban, password reset) | Immediate (delete row) | Needs a denylist or status list, and then it is no longer stateless (OWASP JWT CS "Not using JWTs") [V] |
| Authorization changes applied immediately (ASVS 8.3.2) | Yes | Stale claims until expiry. Needs mitigation [V] |
| Complexity / footguns | Low | `alg:none`, key confusion, `kid`/`jku` trust, audience confusion, denylist malleability (OWASP JWT CS) [V] |
| Scale | One indexed lookup per request (cacheable) | No lookup |

**Default: opaque, server-side sessions in an `HttpOnly` cookie.** Copenhagen: "The access token itself should never be used as a replacement for sessions" [V]. Use JWTs for short-lived service-to-service or API access tokens (OIDC), validating `iss`, `aud`, `exp`, `nbf`, type and algorithm allowlist (ASVS 9.1–9.2) [V].

- Cookie-cache hybrids trade revocation latency for speed. Example: Better Auth `cookieCache`, which caches session data in a signed cookie. Its docs warn "revoked sessions may remain active on other devices until the cookie cache expires". Bypass the cache for sensitive operations [V].

### A5.2 Token generation and storage

- Session IDs from a CSPRNG. OWASP minimum 64 bits of entropy, but recommends **128 bits** when generating your own. ASVS 7.2.3 requires ≥128 bits [V]. Copenhagen uses ≥112 bits (e.g., 15 random bytes → base32) [V].
- **Store a SHA-256 hash of the token** in the DB, not the token. Then a DB read (SQLi, backup leak) doesn't yield live sessions [V, Copenhagen]. A fast hash is fine because the token is high-entropy.
- New session on every login and re-authentication. Terminate the old one to prevent fixation (ASVS 7.2.4; OWASP) [V].

### A5.3 Cookie settings (copy-paste baseline)

```
Set-Cookie: __Host-session=<token>; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000
```

- `__Host-` prefix: requires `Secure`, `Path=/`, no `Domain`. Blocks subdomain cookie injection. OWASP "Recommended for session IDs"; ASVS 3.3.3 (L2). Use `__Secure-` if the cookie must be shared across subdomains (ASVS 3.3.1) [V].
- `HttpOnly` (ASVS 3.3.4) and `Secure` [V].
- `SameSite=Lax` is the default (Copenhagen, Auth Book). `Strict` drops the cookie when users arrive from external links. OWASP's example uses `Strict` for high-security apps. SameSite is **defense in depth, not a CSRF solution** (it doesn't cover same-site cross-origin subdomains) [V].
- Cookie max lifetime in Chrome is 400 days. Re-set the cookie as the session slides [V, Copenhagen].
- **Never store session or refresh tokens in `localStorage`/`sessionStorage`.** OWASP Session Management: "a single XSS vulnerability discloses every token". Use HttpOnly cookies or a BFF [V]. The Auth Book notes HttpOnly mainly stops *exfiltration* (including by malicious npm packages). XSS can still act as the user, so CSP still matters [V].
- For SPAs talking to APIs: BFF pattern (E-architecture §5.9).

### A5.4 Timeouts (decision table)

| Context | Idle timeout | Absolute timeout | Source |
|---|---|---|---|
| Consumer app (social, content, shopping) | none / sliding 30 days (extend when used within the last half of the window; refresh expiry at most hourly/daily to save writes) | optional, e.g. 400 days via cookie cap | Copenhagen, Auth Book [V]; Better Auth default 7 d, `updateAge` 1 d [V] |
| NIST AAL1 | MAY | SHOULD ≤ **30 days** | 800-63B-4 [V] |
| NIST AAL2 (MFA; most B2B SaaS, finance-lite) | SHOULD ≤ **1 hour** | SHOULD ≤ **24 hours** | [V] |
| NIST AAL3 | SHOULD ≤ **15 min** | SHALL ≤ **12 hours** | [V] |
| OWASP guidance | 2–5 min high-value; 15–30 min low-risk | 4–8 h for office-day apps | [V] |

- Enforce timeouts **server-side** (OWASP) [V].
- On idle expiry, give a warning dialog with "Stay signed in" so users don't lose work (OWASP) [V].
- AAL2 lets you reauthenticate after idle timeout with the password alone (or biometric) plus the session secret, if the overall timeout hasn't passed [V].
- Document the chosen values and any deviations from NIST (ASVS 7.1.1) [V].

### A5.5 Sudo mode / step-up (re-authentication)

- Long sessions plus fresh re-auth for sensitive actions: change email/phone/password, MFA settings, add or remove a passkey, delete account, view API keys, payouts, admin elevation (Copenhagen "sudo mode"; ASVS 7.5.1 L2; OWASP MFA "When to require") [V].
- Freshness window: Better Auth `freshAge` default 1 day, configurable (e.g., 5 min) [V]. A reasonable default is **≤10–15 minutes** for high-risk changes [U, judgement].
- Auth Book: bind each verification to a **single action**, with an action-specific short session. If the existing session is reused, a hijacker can wait for the real user to re-auth and ride it [V].
- For high-value transactions (payments), use transaction authorization (OWASP Transaction Authorization CS):
  - show the significant data (amount, payee) in the confirmation;
  - use a unique credential per transaction;
  - bind to the data server-side;
  - make it time-limited [V].
- OIDC: check `auth_time`/`acr`/`amr` when relying on an IdP for recency or strength (ASVS 6.8.4) [V].

### A5.6 Session management UI

- "Where you're signed in" list: device and browser, approximate location (country/city from IP), last active, a "This device" marker, **Sign out** per session, and **Sign out of all other sessions** (ASVS 7.5.2 L2; OWASP Session CS) [V].
- The Auth Book warns that granular per-session revocation should require identity verification. Otherwise a hijacker can keep kicking out the owner [V].
- Always show a visible logout on authenticated pages (ASVS 7.4.4) [V].
- Logout must invalidate server-side, not just clear the cookie (ASVS 7.4.1) [V].
- Disable or delete account ⇒ terminate all sessions (ASVS 7.4.2 L1) [V].
- Admins can terminate a user's sessions (ASVS 7.4.5) [V].

### A5.7 When to invalidate sessions (conflict table)

| Event | Copenhagen | OWASP / ASVS | Auth Book | Recommended default |
|---|---|---|---|---|
| Password reset (forgot) | Invalidate all | OWASP: ask the user or invalidate automatically. ASVS 7.4.3: *offer* to terminate others | Ask, don't force | **Invalidate all other sessions** after a *reset* (the user may be recovering from compromise). Better Auth: set `revokeSessionsOnPasswordReset: true` |
| Password change (knows old pw) | Invalidate all | ASVS 7.4.3 offer | Ask ("Sign out of other devices?" pre-checked) | Offer, checkbox pre-checked |
| Email verified / permissions gained | Invalidate all, re-issue current | Renew ID on privilege change (OWASP) | — | Rotate the current session ID. Others optional |
| MFA added/removed | — | ASVS 7.4.3 offer | Uncommon for passkeys | Offer |

### A5.8 Emerging: Device Bound Session Credentials (DBSC)

- A W3C/WICG proposal by Google engineers to bind sessions to a device key (TPM-backed on Chrome/Windows), with periodic browser-initiated refresh, to defeat **cookie theft by infostealer malware** [V, explainer README].
- Status and browser support as of 2026-09: [U]. Mention it as "watch", and don't require it in skills yet.

---

## A6. CSRF (for cookie-authenticated apps)

Layered baseline [V: OWASP CSRF CS, Copenhagen, Auth Book, ASVS 3.5]:

1. **Never change state on GET/HEAD** (ASVS 3.5.3).
2. **`SameSite=Lax`** session cookie.
3. **Fetch Metadata check** on unsafe methods. If `Sec-Fetch-Site` is `cross-site` → 403. Treat `same-site` as untrusted unless you trust all subdomains. Allow `same-origin`, and `none` for user-typed navigations.
   - Sec-Fetch-* has been supported in all major browsers since March 2023 (Safari 16.4+), with >98% coverage.
   - **A fallback to an Origin/Referer check is mandatory** (OWASP).
   - Go 1.25+ ships `http.CrossOriginProtection` implementing this [V].
4. For JSON APIs: require `Content-Type: application/json`. Parse the header properly, because `text/plain; application/json` is a simple request (Auth Book). Or require a custom header, which forces a CORS preflight (OWASP) [V].
5. Classic forms: a synchronizer token per session, or a **signed** double-submit cookie (HMAC bound to the session ID). Naive double-submit is discouraged (subdomain cookie injection) [V].
6. Use framework built-ins where they exist (Django, Rails, Laravel, ASP.NET, Angular, SvelteKit origin check, Better Auth `trustedOrigins`) [V/U per framework].
7. Server Actions / RPC endpoints are public POST endpoints. Authenticate and authorize **inside** each one (E-architecture §5).

```js
// Express-style Fetch-Metadata guard (adapted from OWASP CSRF CS policy)
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
function csrfGuard(req, res, next) {
  if (SAFE.has(req.method)) return next();
  const site = req.get("Sec-Fetch-Site");
  if (site) {
    if (site === "same-origin" || site === "none") return next();
    return res.status(403).end();           // cross-site or same-site
  }
  const origin = req.get("Origin") ?? originFromReferer(req.get("Referer"));
  if (origin && ALLOWED_ORIGINS.has(origin)) return next();
  return res.status(403).end();             // no signal → reject (Copenhagen: missing Origin → deny)
}
```

---

## A7. Change email / phone (account recovery channels)

- Require re-auth (password or MFA), per ASVS 7.5.1 [V].
- Store the new address as **pending** until verified. Send a **notification to the old address** with a "This wasn't me" link that locks the change and starts a review [V, OWASP Authentication CS; Copenhagen].
- OWASP's stricter variant for non-MFA users: require confirmation from **both** old and new addresses [V].
- Notify after any change to auth details (ASVS 6.3.7 L3) [V].
- Invalidate any outstanding verification or reset tokens tied to the old address (Auth Book) [V].

---

## A8. Password reset and account recovery

### A8.1 Flow

```
[Forgot password?] → /reset (email field, bot challenge if abused)
   POST → always respond: "If an account exists for ada@example.com, we've sent a link/code. Check spam too."
        → same status, same timing (enqueue email asynchronously)
        → per-account + per-IP rate limit on sends
Email → https://app.example.com/reset/<token>   (base URL from config, not Host header)
   GET page: Referrer-Policy: no-referrer; token NOT consumed on GET
        → if MFA enabled: require a second factor BEFORE the new-password form (ASVS 6.4.3; Copenhagen)
   POST new password (autocomplete="new-password"; same policy as sign-up; blocklist)
        → atomically consume token; hash & store; mark email verified
        → revoke all sessions (+ remembered-device tokens, refresh tokens)
        → send "Your password was changed" email (no password in it) with "Not you? Secure your account"
        → redirect to sign-in (OWASP) — or sign in the current device (Copenhagen/most products)
```

### A8.2 Token parameters

| Parameter | Value | Source |
|---|---|---|
| Entropy | ≥112 bits (e.g., 15–32 random bytes) | Copenhagen server-side tokens [V] |
| Storage | **SHA-256 hash** of the token in the DB | Copenhagen [V]; OWASP says store securely [V] |
| Lifetime | ~**1 hour**, 24 h max | Copenhagen [V] |
| Use | Single-use, consumed atomically on the successful POST | Copenhagen, OWASP [V] |
| Reissue | Invalidate the previous token on a new request, or reuse the still-valid one | Copenhagen [V] |
| Binding | One user + one email. Invalidate if the email changes | Copenhagen, Auth Book [V] |
| Delivery | Path segment or query + `Referrer-Policy`. HTTPS. No `Host`-derived URLs | OWASP [V] |
| Code alternative | 6–12 digit PIN via side channel. Creates a limited session that can only reset the password | OWASP [V] |

- **Don't change the account on request**: no lockout, no password invalidation until a valid token is presented (OWASP) [V].
- **Auto-login after reset:**
  - OWASP says don't, because it adds session-handling complexity.
  - Copenhagen implicitly allows it.
  - Consumer UX expects it.
  - **Recommend:** sign in the device that completed the reset *only if* the reset also passed MFA or the flow was bound to the same pre-auth session. Otherwise redirect to sign-in with the email prefilled [U, judgement].

### A8.3 Recovery rules

- **No security questions.** NIST SHALL NOT; ASVS 6.4.2 L1; OWASP says they are no longer an acceptable factor [V].
- Recovery must not be weaker than login. With MFA on, reset needs email **plus** a second factor or a recovery code (ASVS 6.4.3–6.4.4) [V].
- Admins can *initiate* a reset but must never set or know the user's password (ASVS 6.4.6) [V].
- Offer multiple recovery paths:
  - recovery codes;
  - a second passkey or security key;
  - a verified phone as a last resort;
  - a support process with identity proofing at enrollment-level strength (ASVS 6.4.4) [V].
  - OWASP: "you must ensure that a user always has a way to recover their account, even if that involves contacting the support team" [V].
- Copy: "Check your email. If an account exists for **ada@example.com**, you'll get a link to reset your password within a few minutes. [Resend] · [Use a different email]"

---

## A9. Multi-factor authentication

### A9.1 Factor comparison

| Factor | Strength | Notes |
|---|---|---|
| Passkey / security key (WebAuthn) | Phishing-resistant | Preferred. OWASP: "Prefer phishing-resistant authenticators (FIDO2/WebAuthn)" [V]. For 2FA with non-discoverable keys, **check the credential belongs to the already-identified user**, or 2FA can be bypassed [V, Copenhagen] |
| TOTP (authenticator app) | Good, but phishable (real-time relay) | Default opt-in 2FA (OWASP quick recs) [V] |
| Push with number matching | Phishable; fatigue attacks | Rate-limit pushes; require number matching (ASVS 6.6.4; OWASP) [V] |
| SMS / voice OTP | **Restricted** (NIST) | SIM swap, number porting, SS7. ASVS 6.6.1: only with a pre-validated number, stronger alternatives also offered, and users informed of the risks [V]. OWASP: don't use for PII/financial apps [V] |
| Email OTP | Not an authentication factor at NIST/ASVS L3 | [V] |
| Recovery codes | Backup only | See A9.4 |

### A9.2 TOTP implementation parameters [V: Copenhagen, RFC 6238 via Copenhagen, ASVS]

- Secret: **160 bits** from a CSPRNG, per user. Share it via an `otpauth://totp/Issuer:account?secret=BASE32&issuer=Issuer&digits=6&period=30` QR code. Show the base32 secret as text too (accessibility).
- **Confirm enrollment** by asking for a current code before enabling.
- HMAC-SHA1, 6 digits, 30 s period. Accept ±1 step for clock skew [U, common practice].
- Mark each code **used once** (ASVS 6.5.1). Server time only (ASVS 6.5.8).
- Encrypt the secret at rest (e.g., envelope encryption with a KMS key) [V, Copenhagen "can be encrypted"].
- Throttle: e.g., block 15–60 min after 5 consecutive failures (Copenhagen). NIST ≤100 total [V].
- Better Auth: `/two-factor/verify` 3 req/10 s [V].
- When a new QR is generated, invalidate the old secret [V].

### A9.3 SMS OTP (if unavoidable)

- Code valid ~5 min (Copenhagen). ASVS ≤10 min [V].
- Consider SIM-swap and porting risk signals before sending (NIST SHOULD) [V].
- Break the code up for readability: "123 456" (OWASP PINs) [V].
- Use the Web OTP / `one-time-code` autofill.

### A9.4 Recovery codes

- Issue at MFA setup: e.g., **10 codes**, each ≥40 bits with proper throttling (Copenhagen: 10 hex chars) [V; count U].
- ASVS 6.5.2: lookup secrets under 112 bits must be hashed with a **password hash** (Argon2id) and a salt [V].
- Show once, with Download / Copy / Print actions. Require the user to confirm they saved them. Allow regeneration (invalidates the old set) after re-auth [V, Copenhagen].
- Each code is single-use. Notify on use. Warn when few remain [U].

### A9.5 Step-up and when to require MFA

- At login. Also for sensitive actions: change password or email, disable MFA, elevate to admin (OWASP) [V].
- **Every login path** must enforce MFA: API login, mobile, legacy endpoints (OWASP; ASVS 6.1.3/6.3.4 "no undocumented pathways"). Prevent downgrade from phishing-resistant to weaker factors (OWASP MFA downgrade) [V].
- Require MFA for admins and privileged users (OWASP) [V].

### A9.6 "Remember this device"

- OWASP risk-based auth: e.g., require MFA only for a new device/location [V].
- Implement with a **separate, signed, HttpOnly device cookie** bound to user + device, with an expiry (e.g., 30 days) [U, duration]. Revoke on password reset, MFA change, or "sign out everywhere". List remembered devices in security settings.

### A9.7 Failed-MFA handling

After a correct password with failed MFA [V, OWASP]:

- offer another factor;
- offer MFA reset;
- **notify the user** with time, browser and location, and suggest changing the password.

Changing a factor requires re-auth with an existing factor. Send an out-of-band notification. Consider delays for high-value accounts [V].

### A9.8 MFA copy

- Setup: "Add a second step to protect your account. Even if someone gets your password, they can't sign in without your phone or security key."
- Challenge: "Enter the 6-digit code from your authenticator app." Secondary links: "Use a passkey or security key" · "Use a recovery code" · "Can't access any of these?"
- Recovery codes: "Save these codes somewhere safe, like your password manager. Each code works once. You'll need one if you lose your phone."

---

## A10. Passkeys (2025–2026)

### A10.1 Concepts [V: passkeys.dev terms; Auth Book]

- **Passkey** = a discoverable WebAuthn credential with user verification.
  - **Synced** passkeys: iCloud Keychain / Apple Passwords, Google Password Manager, third-party managers.
  - **Device-bound** passkeys: security keys.
- NIST 800-63B-4 explicitly covers **syncable authenticators** (Appendix B) [V].
- Synced passkeys lose the strict "possession" property, but they are still far stronger than passwords and phishing-resistant. The Auth Book argues there's no need to demand extra MFA on top of a passkey login [V].
- Platform notes:
  - iOS/iPadOS 16+ and Android 9+ support passkeys. Android 14 adds **third-party passkey providers** [V].
  - iOS 26 adds `ASAuthorizationAccountCreationProvider`: account creation backed by a passkey. The Apple docs abstract reads "Create a new account creation request backed by a platform public key credential, i.e. a passkey" [V].
  - iOS 26 also adds `ASCredentialUpdater`, the native equivalent of the **WebAuthn Signal API**. It tells credential managers about renamed usernames, deleted passkeys, and (once a user has moved to passkeys) passwords that can be hidden [V].

### A10.2 UX rules

1. **Offer creation after sign-in, not as a gate.**
   - Triggers: right after sign-up; after a password or OTP login; after a cross-device (QR/hybrid) login, detected by `authenticatorAttachment === "cross-platform"` [V, passkeys.dev].
   - Check `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` first [V].
   - Upsell copy (passkeys.dev sample, reworded): **"Faster, safer sign-in with passkeys. Sign in with your face, fingerprint, or screen lock. [Create a passkey] [Not now]"**.
   - Cross-device copy: **"Use this device next time? You won't need your phone to sign in here. [Yes] [Not now]"**.
   - Disclose that anyone who can unlock this device can use the passkey [V, passkeys.dev].
2. **Automatic passkey upgrades ("conditional create").**
   - After a password autofill sign-in, the browser/OS can silently create a passkey if the manager supports it.
   - Needs browser + OS + credential manager support. Feature-detect `getClientCapabilities().conditionalCreate`, which reflects only browser support [V, passkeys.dev terms].
   - Browser versions [U].
3. **Conditional UI (autofill) on the sign-in page.** `autocomplete="username webauthn"` + `mediation: "conditional"` on page load. Keep a visible "Sign in with a passkey" button as an explicit path too [V/U: button is common guidance].
4. **Naming & management.**
   - Allow several passkeys per account: Auth Book suggests allowing at least 5, ideally 10 [V].
   - Auto-name from the AAGUID / provider ("iCloud Keychain", "Google Password Manager"), and allow renaming [V].
   - Show created date, last used, and a synced/device-bound flag (backup-eligibility bits in authData) [U for UI convention].
   - Re-auth before adding or removing (Auth Book; ASVS 7.5.1) [V].
5. **Use `excludeCredentials`** with existing IDs so the user doesn't create duplicates in the same manager [V].
6. **Keep the Signal API in sync**:
   - `PublicKeyCredential.signalUnknownCredential` when the server doesn't recognize a credential ID (e.g., deleted);
   - `signalAllAcceptedCredentials` after deletions;
   - `signalCurrentUserDetails` after a username or email change.
   - Web method names are [U] (from memory). Native equivalent `ASCredentialUpdater` is [V].
7. **Fallbacks**: always keep another path (email code, password + 2FA, recovery). Recovery is the new weakest link (E-architecture).
8. **`userVerification: "preferred"`** for sign-in, to avoid desktop password loops. Enforce UV server-side if your policy requires it [V].
9. **Attestation `"none"`** (default) for consumer apps. Other values trigger consent prompts and lower completion [V, passkeys.dev].
10. **Related Origin Requests (ROR)** handle multiple ccTLDs/brands (`/.well-known/webauthn`). Prefer federation first. Native apps link via Associated Domains / Digital Asset Links [V].

### A10.3 Registration and authentication options (server-issued)

```js
// registration (after the user is signed in and freshly verified)
{
  rp: { id: "example.com", name: "Example" },
  user: { id: <random 32 bytes, stable per user, NOT email>, name: "ada@example.com", displayName: "Ada Lovelace" },
  challenge: <≥16 random bytes, single-use, stored server-side, short TTL>,
  pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], // ES256, RS256
  excludeCredentials: [...existing],
  authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  attestation: "none",
  extensions: { credProps: true }
}
```

Server verification checklist [V, Copenhagen WebAuthn]:

- `clientDataJSON.type` is `webauthn.create` or `webauthn.get`;
- the challenge matches and is deleted (single-use);
- `origin` equals the expected origin;
- the rpIdHash equals SHA-256(rpId);
- the UP flag is set; the UV flag is set if required;
- the algorithm and curve are allowed;
- store the credential ID + public key (+ sign count, transports, backup flags);
- for 2FA, the credential belongs to the user.

Use a library (SimpleWebAuthn, py_webauthn, webauthn-rs, java-webauthn-server) [U names, well known].

### A10.4 Adoption figures [U, re-verify before quoting]

- FIDO Alliance (World Passkey Day, May 2025): "more than 15 billion online accounts" can use passkeys [U].
- FIDO "Passkey Index" (Oct 2025, with Amazon, Google, Microsoft, etc.) reported higher sign-in success and faster sign-ins for passkeys vs other methods [U, exact numbers not verified].
- Microsoft made new accounts passwordless-by-default in 2025 [U].
- Skills should state direction ("passkeys are mainstream on all major platforms as of 2026"), not unverified percentages.

---

## A11. Social login, OAuth/OIDC, SSO

### A11.1 Protocol rules

- Authorization Code + **PKCE** for all clients. **Implicit** and **password (ROPC)** grants must not be used (ASVS 10.4.4; OAuth 2.1 draft; RFC 9700 BCP) [V].
- **`state`**: ≥112 bits, stored in an `HttpOnly; Secure; SameSite=Lax; Path=/` cookie (short Max-Age, e.g. 10 min). **Check that it is present *and* matches.** "A common mistake is forgetting to check whether the `state` parameter exists" [V, Copenhagen].
- PKCE: `code_verifier` 43–128 chars (≥256 bits recommended), `code_challenge = BASE64URL(SHA256(verifier))`, `code_challenge_method=S256` [V].
- Use OIDC for login. Validate the ID token's `iss`, `aud`, `exp`, and signature via JWKS. Use `nonce` for implicit-ish/front-channel flows [V, OWASP Authentication CS; nonce U].
- Exact redirect-URI matching on the AS (ASVS 10.4.1). Auth codes are single-use with ≤10 min lifetime (ASVS 10.4.2–10.4.3) [V].
- Identify users by **(issuer, sub)**, never by email alone. ASVS 6.8.1: namespace the IdP user ID with the IdP ID so a user from one IdP can't spoof another [V].

### A11.2 Account linking (a major source of account takeover)

- Only auto-link a social login to an existing account by email when the provider asserts the email is **verified**. The provider must explicitly document that field (Copenhagen) [V]. Better Auth has `trustedProviders` for automatic linking [V].
- Safer UX: "An account with ada@example.com already exists. Sign in with your password to connect Google." (link after proving control of the existing account). Apple HIG suggests offering linking when the SIWA email matches [V].
- Private relay emails (`@privaterelay.appleid.com`) won't match. Offer manual linking from settings [V, HIG].

### A11.3 Button design

- **Apple (HIG)** [V]:
  - Titles only "Sign in with Apple", "Sign up with Apple" or "Continue with Apple".
  - Black, white, or white-with-outline. Min 140×30 pt. Margin ≥1/10 of the height.
  - Custom buttons use only Apple-provided logo artwork, keep black/white colors, and are reviewed by App Review.
  - Button no smaller than other sign-in buttons.
- **Google** [U, developers.google.com not reachable]:
  - Use the official "Sign in with Google" button (GIS library) or follow the branding guidelines: standard multicolor "G" on white or dark, text "Sign in with Google" / "Sign up with Google" / "Continue with Google", no recolored logo.
- General:
  - Consistent width and order across providers.
  - Verb consistency ("Continue with …" for unified flows).
  - Put the last-used method first or badge it (Better Auth `last-login-method`) [V feature].

### A11.4 iOS rule: "Sign in with Apple" or equivalent

App Review Guideline **4.8 Login Services** (current text) [V]:

- Apps that use a third-party or social login (Facebook, Google, X, LinkedIn, Amazon, WeChat …) for the **primary account** must also offer **an equivalent login service** that:
  1. limits data collection to name + email;
  2. lets users keep their email private;
  3. doesn't collect interactions for advertising without consent.
- Sign in with Apple satisfies this. The rule no longer names SIWA exclusively (changed in 2024 [U on date]).
- **Exceptions**:
  - the app exclusively uses the company's own account system;
  - alternative app marketplaces;
  - education/enterprise/business apps requiring existing org accounts;
  - government/industry-backed e-ID;
  - clients for a specific third-party service (mail, social) where users sign in to that service directly.

Also 5.1.1(v): no forced login without significant account-based features; in-app account deletion when account creation is offered [V].

### A11.5 Google One Tap / FedCM [U]

- Google Identity Services One Tap shows an account chooser overlay. On Chrome it has migrated to the browser's **FedCM** API (third-party-cookie independent) [U].
- On Android, use **Sign in with Google via Credential Manager**. It has a bottom sheet (auto-shows, user-dismissible, excludes accounts needing re-auth, hidden if no Google accounts) **plus** a persistent "Sign in with Google" button to restart the flow [V, Android docs]. Better Auth has a `one-tap` plugin [V].
- UX: don't auto-prompt on every page. Show One Tap on landing/sign-in pages, and respect dismissals (cool-down) [U].

### A11.6 B2B SSO (SAML/OIDC) and home-realm discovery

- Identifier-first enables **home realm discovery**: map the email domain to an org connection and redirect to that IdP.
  - Require domain verification (DNS TXT) before an org can claim a domain [U, standard practice in WorkOS/Auth0].
  - Otherwise anyone could hijack routing for gmail.com-like domains.
- Offer "Sign in with SSO" as an explicit link too (for users with personal emails).
- **Enforce SSO** per org: when on, disable password/social login for that domain's users and make SSO the only path (ASVS 6.1.3/6.3.4, consistent pathways) [V principle].
- **JIT provisioning + SCIM** for deprovisioning. On SCIM deactivate, terminate sessions (ASVS 7.4.2) [V principle].
- SAML specifics: validate signatures on the assertion/response, reject unsigned, process each assertion once (replay), check audience, recipient and time conditions. Use a maintained SAML library (ASVS 6.8.2–6.8.3; OWASP SAML CS) [V].
- Session coordination with the IdP: RP session lifetime vs IdP session; re-auth when the maximum time between IdP authentications is exceeded (ASVS 7.6.1). NIST 800-63B notes the RP may get a fresh assertion from a still-live IdP session without real re-auth, so request re-auth (`prompt=login`, `max_age`) when it matters [V; parameter names U].

---

## A12. Mobile authentication

### A12.1 OAuth / social / SSO in native apps

- Use the **system browser**, never an embedded WebView, for third-party IdPs:
  - iOS: `ASWebAuthenticationSession` (iOS 12+). It shares Safari's state and supports WebAuthn/passkeys [V].
  - Android: **Custom Tabs**, or **Auth Tab** (`AuthTabIntent`, Chrome 137+, `androidx.browser:browser:1.9.0`+), which falls back to Custom Tabs [V, passkeys.dev Android].
  - Embedded WebViews give the host app full control over the page, including credentials. Passkeys there work only for the app's own linked RP ID, and Android WebView lacks direct WebAuthn [V].
  - RFC 8252 (OAuth for Native Apps) is the BCP. Google blocks OAuth in embedded webviews [U, not refetched].
- Authorization Code + PKCE, a public client (no client secret embedded in the app). Redirect via **claimed HTTPS links** (Universal Links / App Links) rather than custom schemes where possible [U, RFC 8252 details].
- iOS 4.8 equivalent-login rule applies (A11.4).

### A12.2 Native credential APIs

- **Android Credential Manager** (Jetpack) is "the recommended Jetpack API" for passkeys, passwords, Sign in with Google and digital credentials [V]:
  - unified bottom sheet;
  - WebView integration;
  - **Restore Credentials**: a restore key backed up to the cloud signs the user in automatically on a new device, especially useful alongside passkeys [V].
- **iOS AuthenticationServices**: passkeys (`ASAuthorizationPlatformPublicKeyCredentialProvider`), Sign in with Apple, password autofill (Associated Domains `webcredentials:`), `ASAuthorizationAccountCreationProvider` (iOS 26), `ASCredentialUpdater` (iOS 26) [V for the last two; the others are long-standing APIs, U on names].
- Apple HIG, Managing accounts [V]:
  - "If you don't use Sign in with Apple … prefer using a passkey".
  - Label buttons by method ("Sign In with Face ID", not "Sign In").
  - Don't reference Face ID on devices without it.
  - Don't add an in-app toggle for biometrics (it's system-level).
  - Don't call your credential a "passcode".

### A12.3 Tokens on device

- Store refresh tokens and session tokens in **Keychain** (iOS; `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` or stricter) and **Android Keystore-backed encrypted storage**. Never in `UserDefaults`/`SharedPreferences` plaintext or AsyncStorage [U, platform docs not fetched this session; widely documented].
- Access tokens short (5–15 min). Refresh tokens **rotate on every use with reuse detection**: if an old refresh token is replayed, revoke the whole family. Absolute expiry on refresh tokens (ASVS 10.4.8). Revocable by the user (ASVS 10.4.9). Public clients: sender-constrained (DPoP) or rotation (ASVS 10.4.5) [V].
- NIST: session bearer secrets SHOULD NOT persist across app restarts or reboots for high-assurance sessions [V]. Consumer apps routinely persist refresh tokens. Pair that with a biometric unlock gate.

### A12.4 Biometric *unlock* vs *authentication*

- **Local biometric unlock** (Face ID / BiometricPrompt gating access to a Keychain/Keystore item) proves the device owner is present. It does **not** authenticate to your server by itself.
- Do it properly: store the refresh token (or a key) behind a biometric-protected Keychain/Keystore entry (`SecAccessControl` with `.biometryCurrentSet`; Android `setUserAuthenticationRequired(true)` + `BiometricPrompt` with a `CryptoObject`). The server credential is then released only after a biometric check [U, API specifics].
- Anti-pattern: `if (biometricSuccess) { callApi(isAuthenticated=true) }`. That is a client-side boolean, trivially bypassed on rooted or jailbroken devices.
- Passkeys already combine device possession + biometric/PIN with server-verifiable cryptography. Prefer them over custom "biometric login" schemes.
- ASVS 6.5.7 (L3): biometrics only as a secondary factor with something you have or know [V]. NIST biometric limits: ≤5 consecutive failures (10 with PAD), then delays [V].

---

## A13. Accessibility of authentication (WCAG 2.2)

**SC 3.3.8 Accessible Authentication (Minimum), Level AA** [V, W3C Understanding doc]:

- "Don't make people solve, recall, or transcribe something to log in."
- Remembering a site password is a **cognitive function test**. It passes only if password managers and paste work, meaning the fields are correctly labeled and `autocomplete`-annotated (1.3.5 Input Purpose, 4.1.2 Name, Role, Value).
- Blocking paste or autofill **fails** the SC.
- Every step of MFA must comply. Transcribing an OTP needs a non-transcription path (paste, autofill, or a passkey/link alternative).
- Transcription CAPTCHAs, including audio-transcription ones, don't qualify as the alternative.
- At AA, object recognition and personal-content tests are allowed exceptions. The AAA 3.3.9 Enhanced version removes them [U on exact exception wording; the Understanding doc refers to "Enhanced"].
- Account recovery must also have a non-cognitive path [V].

Checklist:

- Visible labels. Errors announced (`aria-live`, `aria-describedby`). Focus moves to the first error.
- A show-password toggle as a real `<button>` with `aria-pressed`. The toggle must not clear the field.
- Don't time out an OTP entry screen without warning. Allow a resend.
- Passkeys and magic links are cognitive-test-free options. Offer at least one.

---

## A14. Security notifications (email/push)

Send for:

- new sign-in from a new device/location (optional for consumer apps; ASVS 6.3.5 L3 suspicious attempts);
- password changed or reset;
- email or phone changed (to the **old** address);
- MFA enabled, disabled or changed;
- passkey added or removed;
- recovery code used;
- correct password but failed MFA (OWASP) [V].

Content:

- what happened, when, device/browser, approximate location;
- "If this was you, no action needed";
- a **"Secure your account"** button that leads to a re-auth → sessions + password reset flow.

Never include passwords or live codes that would log someone in.

Copy example:

> **New sign-in to your Example account**
> Chrome on Windows · near Lisbon, Portugal · 30 Sep 2026, 14:02 UTC
> If this was you, you can ignore this email. If not, [secure your account] — we'll sign out all devices and help you reset your password.

---

## A15. UX copy library (auth)

| Moment | Copy |
|---|---|
| Unified entry | "Sign in or create an account" · button "Continue" |
| Sign-up password hint | "Use at least 15 characters. A passphrase like *three random words* works well." |
| Breached password | "This password appeared in a data breach, so attackers try it first. Choose a different one." |
| Wrong credentials (generic) | "That email and password don't match. Try again or reset your password." |
| Throttled | "Too many attempts. Wait 5 minutes or get a sign-in code by email." |
| OTP sent | "We sent a 6-digit code to **ada@example.com**. It expires in 10 minutes. [Resend code] (available in 30 s) · [Change email]" |
| OTP wrong | "That code isn't right. Check the latest email from us. Codes expire after 10 minutes." |
| Magic link sent | "Check your email for a sign-in link. Open it on this device. Didn't get it? Check spam or [send a code instead]." |
| Reset request | "If an account exists for **ada@example.com**, we've sent a reset link. It expires in 1 hour." |
| Reset done | "Your password is updated and you've been signed out of other devices." |
| Passkey upsell | "Sign in faster next time with a passkey — use your fingerprint, face, or screen lock instead of a password." |
| Passkey error (cancelled) | "Passkey sign-in was cancelled. [Try again] or [use another way]." |
| Step-up | "For your security, confirm it's you to change your email." |
| Session expired | "You were signed out after 30 minutes of inactivity. Sign in to continue — we saved your draft." |
| Sign out all | "Sign out of all other devices? You'll stay signed in here." |

Tone rules:

- Say what happened, why, and what to do next.
- Never blame ("You entered an invalid…").
- Never expose internals ("SQLSTATE…", "user not found in table").
- Use the same verbs across buttons ("Continue", "Sign in").

---

## A16. Library-default gotchas (verify in whatever you adopt)

| Check | Better Auth default [V] | What to set |
|---|---|---|
| Revoke sessions on password reset | **false** | `revokeSessionsOnPasswordReset: true` |
| Min password length | 8 | 15 if MFA not enforced |
| Sign-up enumeration protection | Only if `requireEmailVerification` or `autoSignIn:false` | Choose deliberately (A4.3) |
| Magic-link token storage | `"plain"` | `storeToken: "hashed"` |
| Cookie cache | off. When on, revoked sessions persist up to its `maxAge` | Keep short; `disableCookieCache` for sensitive ops |
| Rate limiting | disabled in development; 100/60 s global; sign-in 3/10 s | Use Redis/DB storage in multi-instance deployments |
| Forwarded IP header | `x-forwarded-for`, first-hop trust rules | Configure trusted proxy chain correctly or limits are spoofable |

---

# PART B — APPLICATION SECURITY BY DEFAULT

## B1. The reference frames

### B1.1 OWASP Top 10:2025 [V, OWASP/Top10 `2025/docs/en/0x00_2025-Introduction.md`]

| # | Category | What changed / note |
|---|---|---|
| A01 | **Broken Access Control** | Still #1. 3.73% of tested apps had one of its 40 CWEs. **SSRF is now rolled into A01** |
| A02 | **Security Misconfiguration** | Up from #5 in 2021. 3.00% of apps |
| A03 | **Software Supply Chain Failures** | *New*, expanding 2021's "Vulnerable and Outdated Components" to dependencies, build systems and distribution. Top community-survey concern |
| A04 | **Cryptographic Failures** | Down from #2 |
| A05 | **Injection** | Down from #3. Includes XSS (high frequency, low impact) and SQLi (low frequency, high impact) |
| A06 | **Insecure Design** | Down from #4. Threat modeling is improving |
| A07 | **Authentication Failures** | Renamed from "Identification and Authentication Failures". Standard auth frameworks are helping |
| A08 | **Software or Data Integrity Failures** | Trust boundaries, integrity of code and data artifacts |
| A09 | **Security Logging & Alerting Failures** | Renamed to stress *alerting*: "Great logging with no alerting is of minimal value" |
| A10 | **Mishandling of Exceptional Conditions** | *New*. 24 CWEs: improper error handling, failing open, logic errors under abnormal conditions |

- Data: over 2.8 million applications; 8 of the 10 categories come from data and 2 from the community survey [V].
- Release timing: finalized in late 2025 [U on exact date]. The repo was still being updated in 2026 (translations).
- **Skill implication:** the agent-facing list should read "access control (incl. SSRF), misconfiguration, supply chain, crypto, injection, insecure design, authn, integrity, logging+alerting, exceptional conditions". Don't quote the 2021 list.
- APIs: the OWASP **API** Security Top 10 is still the 2023 edition (E-architecture §5.8).

A10 prevention highlights [V]:

- catch errors where they occur;
- **fail closed**;
- roll back partial transactions;
- use a global exception handler and centralized error handling;
- rate-limit and set quotas, because "Nothing in information technology should be limitless";
- aggregate repeated identical errors.

### B1.2 OWASP ASVS 5.0.0 (May 2025) [V]

- Three levels.
  - **L1**: a first layer of defense, the starting point.
  - **L2**: "Most applications should be striving to achieve this level". L1 + L2 is ~70% of requirements.
  - **L3**: high-assurance (banking-grade).
- An early startup might target L1; an online bank "may have difficulty justifying anything less than Level 3" [V].
- Chapters: V1 Encoding & Sanitization, V2 Validation & Business Logic, V3 Web Frontend, V4 API & Web Service, V5 File Handling, V6 Authentication, V7 Session Management, V8 Authorization, V9 Self-contained Tokens, V10 OAuth & OIDC, V11 Cryptography, V12 Secure Communication, V13 Configuration, V14 Data Protection, V15 Secure Coding & Architecture, V16 Logging & Error Handling, V17 WebRTC [V].
- Cite requirements as `v5.0.0-<chapter>.<section>.<req>` (e.g., `v5.0.0-8.2.2`), because IDs change between versions [V].
- **Skill implication:** default target is **ASVS L2 for any app with user accounts and personal data**, and L1 for prototypes. Point agents to the specific requirement IDs quoted throughout these notes.

### B1.3 Principles to encode in skills

1. **Deny by default.**
2. **Check on every request, server-side, at the object level.**
3. **Validate at the boundary with schemas; encode at the output.**
4. **Parameterize everything that crosses into an interpreter** (SQL, shell, LDAP, template, HTML).
5. **Secrets never in code, logs, or client bundles.**
6. **Least privilege** for users, services, DB roles, and tokens.
7. **Fail closed** (A10).
8. **Log security events and alert on them** (A09).
9. **Every limit is explicit** (sizes, rates, timeouts, quotas).
10. **Dependencies are code you didn't review** (A03).

---

## B2. Authorization

### B2.1 Models

| Model | Decision based on | Good for | Weak at | Tools |
|---|---|---|---|---|
| **RBAC** | User's roles → permissions | Admin/editor/viewer apps; per-org roles | Object-level ("*this* doc"), multi-tenant variations, "role explosion" | Framework guards, Casbin [U], org plugins |
| **ABAC** | Attributes of subject, resource, action, environment (NIST SP 800-162) | Rules like "owner OR (same department AND status=draft) AND business hours" | Policy sprawl without tooling | **Cedar** (AWS; RBAC+ABAC language), **OPA/Rego**, **Cerbos** (YAML policies, self-hosted PDP) [V READMEs for Cedar/Cerbos] |
| **ReBAC** (Zanzibar-style) | Relationship graph (user —editor→ folder —parent→ doc) | Sharing, nested folders/orgs, Google-Docs-like permissions, "list what I can see" | Needs a separate tuple store kept in sync with the app DB | **OpenFGA** ("inspired by Google Zanzibar") [V], **SpiceDB** (Authzed) [V exists], Oso Cloud (the legacy Oso OSS library is **deprecated**) [V README] |

- OWASP Authorization CS: "ABAC and ReBAC should typically be preferred for application development" over pure RBAC. The reasons given are fine-grained logic, robustness, no role explosion, multi-tenancy, and manageability at scale [V].
- **Pragmatic ladder for agents:**
  1. Start with **RBAC scoped per tenant/org** plus **ownership checks** in code, through one central `can(user, action, resource)` function.
  2. Move to a policy engine (Cedar/Cerbos/OPA) when rules multiply.
  3. Move to ReBAC (OpenFGA/SpiceDB) when sharing hierarchies or "list all resources user X can access" becomes central.
  - Don't start with Zanzibar for a CRUD app [U judgement; consistent with E-architecture YAGNI rules, except that authz *centralization* is cheap to do early and expensive to retrofit].

### B2.2 Non-negotiable rules [V: OWASP Authorization CS, ASVS V8]

- **Deny by default**, explicitly configured. Don't rely on framework defaults, which can change (OWASP).
- **Validate permissions on every request.** Use global middleware or filters so a new route can't forget. Add per-object checks in the handler or service (ASVS 8.2.1 function-level, 8.2.2 data-level/IDOR/BOLA, **8.2.3 field-level/BOPLA**).
- **Server-side only.** Client checks are UX (ASVS 8.3.1).
- **Changes take effect immediately.** If authorization data lives in self-contained tokens, you need mitigation such as short TTLs or revocation (ASVS 8.3.2).
- **Act with the originating user's permissions**, not the service's (ASVS 8.3.3: confused deputy). This is relevant for AI agents and background jobs acting "on behalf of" users.
- **Multi-tenant:** cross-tenant controls (ASVS 8.4.1). Resolve the tenant from the authenticated session, never from the request body (E-architecture §multi-tenancy). Add Postgres RLS as defense in depth.
- **Static files and object storage** are covered too: signed, short-lived URLs; private buckets (OWASP).
- **Exit safely:** centralized failure handling, no sensitive info in errors. Return **404 instead of 403** when existence itself is sensitive [U, common practice].
- **Test it:** unit and integration tests with two users/tenants trying each other's objects on read, create, update, delete, export and admin actions (OWASP IDOR test recipe) [V].
- **Log authorization failures** and alert on spikes (A09).
- **Framework lesson (CVE-2025-29927, critical):** Next.js middleware authorization could be bypassed with the internal `x-middleware-subrequest` header. Fixed in 15.2.3 / 14.2.25 / 13.5.9 / 12.3.5 [V, GHSA-f82v-jwr5-mffw]. **Rule: middleware and edge checks are a convenience layer. Re-check auth in the route handler, server action, or data-access layer.**

### B2.3 IDOR / BOLA prevention patterns

```ts
// ❌ looks up by id across all tenants, then forgets to check
const doc = await db.document.findUnique({ where: { id: params.id } });

// ✅ scope the query by the principal (ownership/tenant) — a miss is a 404
const doc = await db.document.findFirst({
  where: { id: params.id, orgId: session.orgId },
});
if (!doc) throw notFound();
authorize(session.user, "document:update", doc); // central policy for role/field rules
```

- Rails equivalent from OWASP: `current_user.projects.find(params[:id])` instead of `Project.find(params[:id])` [V].
- Use unguessable IDs (UUIDv4/v7, ULID) as **defense in depth only**. Access control is still required even with complex identifiers (OWASP IDOR) [V].
- Prefer "me"-scoped endpoints (`GET /me/invoices`), with the identity from the session, over `?user_id=` (OWASP) [V].
- Multi-step flows: keep identifiers in server state, not hidden fields [V].

### B2.4 Mass assignment / BOPLA

- Never bind request bodies straight onto ORM models (`User.update(req.body)`). Attackers add `isAdmin: true`, `orgId`, `emailVerified`, `balance` [V, OWASP Mass Assignment].
- **Input DTO/schema allowlist per operation** (Zod/Valibot, Pydantic, class-validator with whitelist, Rails strong params, Django forms/serializers with explicit `fields`).
- **Output DTOs/serializers**: never return ORM entities. Exclude password hashes, tokens and internal flags (API3:2023) [V via E-architecture].
- Field-level write rules (ASVS 8.1.2/8.2.3): e.g., only admins may change `role`, and a status can go `draft → submitted` only through a specific action [V].

---

## B3. Input validation at the boundary

[V: OWASP Input Validation CS; ASVS V2]

- Validate **syntactically** (format/type) and **semantically** (business meaning: start < end, price in range) as early as possible, at the trust boundary. That means every HTTP handler, message consumer, webhook, file parser, and LLM-tool call.
- **Allowlists**, not denylists. Denylisting `'` or `<script>` "is a massively flawed approach". Enumerated inputs must match one offered value exactly.
- Schema per endpoint. Reject unknown fields (`.strict()` in Zod; `extra="forbid"` in Pydantic). Set explicit max lengths, array sizes, numeric ranges, and body size limits.
- Unicode: allow categories rather than ASCII-only for names. Normalize (NFC) before comparing. Beware homoglyphs in usernames [V/U].
- Regex: anchor it, avoid catastrophic backtracking (ReDoS), and prefer linear-time engines (RE2) for user-supplied patterns [V ReDoS mention].
- Client-side validation is UX only. Server validation is the control.
- **Validation is not an injection defense by itself.** Still parameterize and encode.

---

## B4. Injection

### B4.1 SQL [V, OWASP SQLi CS]

- Primary defense: **prepared statements / parameterized queries**. Next best: properly built stored procedures (no dynamic SQL inside). Use allowlists for identifiers you can't parameterize (table and column names, `ORDER BY` direction). **Escaping is "STRONGLY DISCOURAGED".**
- ORM raw-query traps to call out in skills [U, per-library names from memory]:
  - Prisma `$queryRawUnsafe` / `$executeRawUnsafe` (safe: tagged `$queryRaw\`…${x}\``);
  - Sequelize `sequelize.query` with string interpolation;
  - TypeORM `query()` with template strings;
  - Knex `raw()` without bindings;
  - SQLAlchemy `text(f"...")`;
  - Django `.raw()` / `.extra()` / `RawSQL` with f-strings;
  - ActiveRecord `where("name = '#{x}'")`;
  - GORM `Where(fmt.Sprintf(...))`;
  - Go `db.Query(fmt.Sprintf(...))`.
- Least-privilege DB roles: the app user has no DDL or superuser rights; separate read-only roles where possible [V].

### B4.2 Other interpreters

- OS commands: avoid the shell. Use argument arrays (`execFile`, `subprocess.run([...], shell=False)`). Never interpolate into `sh -c` [U, standard].
- Template injection (SSTI): never render user input *as a template*.
- NoSQL: reject operator objects (`{"$gt": ""}`) via schema validation.
- LDAP/XPath: use the library's escaping plus allowlists.
- Log injection: strip CR/LF (OWASP Logging) [V].
- Header injection: frameworks usually block CRLF. Never build a `Location` from raw input (open redirect).

---

## B5. XSS, output encoding, and CSP

### B5.1 Framework-first rules [V, OWASP XSS CS]

- Rely on framework auto-escaping (React/JSX, Vue templates, Angular, Svelte, server templates with autoescape on). Know the escape hatches:
  - React `dangerouslySetInnerHTML`: sanitize with **DOMPurify** first, and keep DOMPurify patched.
  - **`javascript:` / `data:` URLs** in `href`/`src`: React does not fully block them. Validate that the scheme is `http(s):`/`mailto:` with the URL parser.
  - Vue `v-html`; Angular `bypassSecurityTrust*`; Svelte `{@html}`.
  - Direct DOM APIs: `innerHTML`, `outerHTML`, `document.write`, `insertAdjacentHTML`, `eval`, `new Function`, `setTimeout(string)`.
- For text, use `textContent`/`createTextNode` (ASVS 3.2.2) [V].
- Markdown/rich text from users: render to HTML **then sanitize** (DOMPurify / bleach / Ammonia). Set a restrictive allowlist, and force `rel="noopener noreferrer"` on links [U, library names].
- Serving user files: `Content-Disposition: attachment` for risky types, `X-Content-Type-Options: nosniff`, and a separate sandbox domain for user content (ASVS 3.2.1, 3.5.4) [V].
- **Framework-level CVE lesson (CVE-2025-55182, critical, Dec 2025):** unauthenticated RCE in React Server Components (`react-server-dom-webpack/parcel/turbopack` 19.0.0–19.2.0; fixed in 19.0.1 / 19.1.2 / 19.2.1) [V, GHSA-fv66-9v8q-g76r]. **Rule: framework server layers are attack surface. Subscribe to advisories and patch within days (A03).**

### B5.2 Content Security Policy (strict CSP)

Nonce-based strict policy (OWASP CSP CS / web.dev strict CSP) [V]:

```
Content-Security-Policy:
  script-src 'nonce-{RANDOM_PER_RESPONSE}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  report-to csp-endpoint
```

- Generate a fresh nonce per response. It must reach the templating engine. **Never** add nonces to all script tags via middleware, because injected scripts would get them too (OWASP) [V].
- Hash-based variant for static sites: `script-src 'sha256-…' 'strict-dynamic'` [V].
- ASVS 3.4.3 minimum: a global policy with `object-src 'none'` and `base-uri 'none'`, plus nonces/hashes or an allowlist [V].
- ASVS 3.4.6: `frame-ancestors` on every response. X-Frame-Options is obsolete but harmless to add [V].
- ASVS 3.4.7 (L3): a violation-report location [V].
- Roll out with `Content-Security-Policy-Report-Only` first. You can run a strict report-only policy next to a looser enforced one [V].
- **Trusted Types** (Chromium): `require-trusted-types-for 'script'` makes DOM sinks reject strings [V].
- Next.js/SvelteKit/Nuxt have nonce support via middleware or config [U, per-framework specifics].

---

## B6. Security headers baseline

[V: OWASP HTTP Headers CS; ASVS 3.4]

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload   # ASVS: ≥1 year; includeSubDomains at L2
Content-Security-Policy: (see B5.2)
X-Content-Type-Options: nosniff                                             # ASVS 3.4.4 on all responses
Referrer-Policy: strict-origin-when-cross-origin                            # no-referrer on token-bearing pages
Cross-Origin-Opener-Policy: same-origin                                     # ASVS 3.4.8 for HTML (or same-origin-allow-popups for OAuth popups)
Cross-Origin-Resource-Policy: same-site
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY                                                       # legacy; frame-ancestors is the real control
X-XSS-Protection: 0                                                         # disable the legacy auditor
Cache-Control: no-store                                                     # on authenticated/sensitive responses
Content-Type: text/html; charset=UTF-8
```

- Remove `X-Powered-By` and version banners [V].
- COEP `require-corp` only if you need cross-origin isolation (it breaks third-party embeds) [V].
- HSTS `preload` is irreversible in practice. Do it deliberately (ASVS 3.7.4 is L3) [V].
- **SRI** on any third-party script or CSS from a CDN (ASVS 3.6.1) [V].
- Don't use `Cache-Control: no-cache` thinking it prevents storage. It only forces revalidation (OWASP) [V].

---

## B7. CORS

[V: ASVS 3.4.2; OWASP headers; Copenhagen CSRF]

- CORS **relaxes** the same-origin policy. It is not a protection mechanism. The default (no CORS headers) is the safest.
- `Access-Control-Allow-Origin` must be a fixed value or an exact match against an allowlist. **Never reflect the `Origin` header blindly.** Never combine `*` with credentials. Don't use regexes that match `evil-example.com` or `example.com.evil.com` [V principle; regex example U].
- `Access-Control-Allow-Credentials: true` only for your own first-party front-ends.
- Add `Vary: Origin` when the response varies by origin [U].
- `null` origin must not be allowlisted (sandboxed iframes and `file:` send it) [U].
- A permissive credentialed CORS policy defeats CSRF tokens, because an attacker can read the token (Copenhagen) [V].
- Public read-only APIs may use `*` **without** credentials and **with** no sensitive data (ASVS 3.4.2) [V].

---

## B8. SSRF (now part of A01)

[V: OWASP SSRF CS; Top 10:2025]

**Features that create SSRF:** "import from URL", link previews/unfurling, webhooks (user-configured callback URLs), avatar-by-URL, PDF/HTML renderers (headless Chrome fetching `<img src>`), OAuth/OIDC discovery with user-supplied issuers, XML external entities, and **LLM tools that fetch URLs**.

Case 1, known destinations → **allowlist** exact hosts/IPs. Validate with a strict parser. Compare against the parsed output.

Case 2, arbitrary external URLs (webhooks, previews):

1. Allow only the `http`/`https` schemes (no `file:`, `gopher:`, `ftp:`, `dict:`), and only ports 80/443 unless needed [V scheme; ports U].
2. Resolve DNS **yourself**. Reject if *any* A/AAAA record is private, loopback, link-local or reserved:
   - `10/8`, `172.16/12`, `192.168/16`, `127/8`, `169.254/16`, `0.0.0.0`, `100.64/10`;
   - `::1`, `fc00::/7`, `fe80::/10`;
   - IPv4-mapped IPv6.
3. **Connect to the vetted IP** (pin it) to defeat DNS rebinding / "DNS pinning" bypasses [V].
4. **Disable redirects**, or re-validate every hop [V].
5. Timeouts, response size caps, no response body echo to the user for blind fetches [U].
6. Network layer: egress through a proxy that enforces the same rules (e.g., Smokescreen [U]). Block the metadata IPs at the host firewall.
7. Cloud metadata: `169.254.169.254` (AWS/GCP/Azure), `metadata.google.internal`, `metadata.amazonaws.com`. **Enforce AWS IMDSv2** (session-token required) and disable IMDSv1 [V].
8. Webhook receivers can prove legitimacy with a shared secret or signed payloads (HMAC). OWASP's example uses a random token [V]; signature scheme [U].

---

## B9. File uploads

[V: OWASP File Upload CS; ASVS V5]

- **Allowlist extensions** needed by the business. Validate the real type by magic bytes or parsing, **not the `Content-Type` header**.
- **Rename** to a server-generated name (UUID). Limit filename length and characters if you keep the original for display.
- **Size limits** at the proxy and the app, plus decompression-bomb limits (zip, images: pixel-count limits) [V size; bombs U].
- Only authorized users may upload. Add CSRF protection.
- **Store outside the webroot / on a separate domain or bucket.** Serve through a handler or signed URLs mapping id → file.
- AV scanning / sandboxing. **CDR** (content disarm & reconstruct) for PDF/Office.
- Re-encode images (strip EXIF/GPS, kill polyglots) [U, common practice].
- Serve with `Content-Disposition: attachment` for non-images, `X-Content-Type-Options: nosniff`, and a restrictive CSP (sandbox) on the user-content domain [U/V].
- Direct-to-S3 presigned uploads: constrain content-type, size (`content-length-range` in POST policies) and key prefix. Scan asynchronously before marking the file available [U].
- Parsers (ImageMagick, PDF libs, XML) are an attack surface. Keep them patched and disable XXE [U].

---

## B10. Secrets management

[V: OWASP Secrets Management CS; E-architecture 12-factor]

- Never commit secrets. Use **secret scanning** pre-commit (gitleaks, trufflehog) and on the repo (GitHub push protection) [U tool names, E-architecture lists gitleaks].
- Runtime: a secrets manager (AWS Secrets Manager/SSM, GCP Secret Manager, Azure Key Vault, HashiCorp Vault, Doppler/Infisical [U]) injected as env vars or files. Centralize and standardize. Use access control per service. Audit access [V].
- **Rotation, revocation and expiry** are part of the lifecycle. Automate rotation where possible (e.g., DB creds rotated by a function). Prefer **dynamic, short-lived credentials** over long-lived static keys [V].
- **Workload identity** (OIDC federation from CI to cloud, IAM roles, SPIFFE) instead of static cloud keys in CI [V "Pipeline Created Secrets" section exists; specifics U].
- CI/CD: least-privilege tokens; secrets masked in logs; no secrets available to PR builds from forks [U].
- Client bundles: anything prefixed `NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_` etc. is **public**. Validate env with a schema at boot (t3-env pattern) so server-only secrets can't leak into client code [U, t3-env repo cloned in refs7 but not reread this session].
- Mobile apps: any key shipped in the binary is public. Use a backend proxy for third-party API keys, and App Attest / Play Integrity for abuse reduction [U].
- Token prefixes (e.g., `sk_live_…`) make leaked keys detectable by secret scanners. Better Auth supports prefixes for OAuth provider tokens for exactly this reason [V].
- Encryption at rest for sensitive columns (TOTP secrets, OAuth refresh tokens from providers) with envelope encryption via KMS [V/U].

---

## B11. Logging without leaking

[V: OWASP Logging CS; ASVS V16; Top 10 A09]

**Log (security events):**

- authentication success and failure;
- lockouts and throttles;
- MFA changes, password/email changes;
- session creation, renewal and destruction;
- authorization failures;
- input-validation failures at trust boundaries;
- admin actions;
- high-value transactions;
- config changes.

Use structured JSON with consistent fields: timestamp (UTC, synced clocks), event type, user id, tenant, session id **hash**, source IP, user agent, request id, outcome.

**Never log (mask, hash, or drop):**

- passwords;
- session IDs (log a hash if you need correlation);
- access and refresh tokens, API keys, OTPs, reset tokens, magic-link URLs;
- connection strings;
- encryption keys;
- payment card data;
- sensitive PII (health, government IDs);
- data above the log system's classification;
- data the user opted out of.

OWASP MFA: "OTP implementations SHOULD NOT log OTP values" [V].

**Watch URL logging:** tokens in query strings end up in access logs, analytics and Referer headers. Keep tokens in paths or bodies, and set the Referrer-Policy.

**Other rules:**

- Sanitize CR/LF and delimiters (log injection, CWE-117).
- Logs are not web-accessible.
- Logging can't be disabled for compliance events [V].
- **Alert**, not just log (A09:2025 rename). Examples:
  - spikes in failed logins per account or IP;
  - MFA failures after correct passwords;
  - authz-denied bursts;
  - new admin grants.

---

## B12. Rate limiting and abuse (security view)

Apply limits to:

- all auth endpoints (A4.4);
- every endpoint that **sends email or SMS** (Copenhagen: "strict rate limiting");
- password hashing endpoints (DoS);
- expensive searches and exports;
- file uploads;
- LLM endpoints (cost DoS).

Key limits by user, account, IP/subnet (IPv6 /64) and tenant [V Better Auth /64]. Get the client IP right behind proxies: trust only your proxy's `X-Forwarded-For` hop. Otherwise limits are trivially spoofable [V Better Auth note].

Store counters in Redis or the DB for multi-instance deploys. Return 429 + `Retry-After` (E-architecture).

---

## B13. Dependencies and supply chain (pointer)

A03:2025 is new and broad [V]. Minimum defaults [U, detailed in other notes/skills]:

- a lockfile committed; `npm ci`/`pnpm install --frozen-lockfile`;
- Dependabot/Renovate with grouped updates and a minimum release age (cool-down) for new versions;
- `npm audit`/OSV-Scanner/Snyk in CI;
- disable install scripts where possible;
- verify packages exist and are the intended ones. LLM "package hallucination" is a real vector (E-architecture cites 19.7% hallucinated suggestions in a USENIX Security 2025 study);
- SBOM generation;
- pinned GitHub Actions by SHA;
- OSSF Scorecard.

References are cloned in refs7: `lirantal_npm-security-best-practices`, `ossf_wg-best-practices-os-developers`. OWASP Software Supply Chain Security CS exists [V file present].

---

## B14. Security in AI features (pointer)

- Treat LLM output as **untrusted input**:
  - never pass it to `eval`, SQL, shell or HTML without the same controls as user input;
  - render model Markdown through a sanitizer;
  - block auto-loading of remote images in model output, a known exfiltration channel via URLs [V, OWASP LLM Prompt Injection CS "Data Exfiltration", "HTML and Markdown Injection" sections].
- **Indirect prompt injection** via retrieved documents, web pages, emails and tool results [V section].
- Defenses:
  - separate instructions from data (structured prompts);
  - output validation and monitoring;
  - **least-privilege tools**;
  - **human-in-the-loop for consequential actions**;
  - remote-content sanitization;
  - agent-specific controls [V section list].
- Authorization for agents: act with the **originating user's permissions** (ASVS 8.3.3), scope tools narrowly, and use OAuth for MCP (E-architecture §5.9).
- URL-fetch tools must get SSRF protections (B8).
- Pointers: OWASP LLM Prompt Injection Prevention CS; OWASP AI Agent Security CS; OWASP Secure Coding with AI CS (all present in the cloned repo) [V]; OWASP Top 10 for LLM Applications 2025 (LLM01 Prompt Injection) [U edition name].

---

## B15. Lightweight threat modeling

**The four questions** (Threat Modeling Manifesto, via OWASP) [V]:

1. What are we working on?
2. What can go wrong?
3. What are we going to do about it?
4. Did we do a good enough job?

The phrasing originates with Adam Shostack [U attribution detail; widely credited].

**STRIDE** as prompts for question 2 [V, OWASP table]:

| Threat | Violates | Auth/app example to check |
|---|---|---|
| **S**poofing | Authentication | Stolen session token; social login linking by unverified email; OTP relay |
| **T**ampering | Integrity | Mass assignment of `role`; client-side price; unsigned webhook |
| **R**epudiation | Accounting | No audit log of admin actions; logs editable by app user |
| **I**nformation disclosure | Confidentiality | IDOR; verbose errors; tokens in URLs/logs; enumeration |
| **D**enial of service | Availability | Account lockout abuse; unbounded password hashing; SMS pumping |
| **E**levation of privilege | Authorization | JWT `alg` confusion; missing function-level check on admin API; middleware-only authz |

**Agent-sized recipe** for any new feature (a 10–15 minute exercise, written into the PR or ADR) [U, judgement]:

1. Draw the data flow: actors → entry points → trust boundaries → data stores → third parties.
2. For each entry point, run through STRIDE and the OWASP Top 10:2025 list.
3. For each credible threat, name a mitigation, an owner, and a test (especially authorization tests).
4. Record accepted risks. Revisit when the feature changes.

For cloud-native systems, include IAM, managed services and shared-responsibility boundaries (OWASP cloud section) [V].

---

## B16. Agent checklist: "secure by default" review for any feature

**Authentication and sessions**

- [ ] Auth uses a maintained library or IdP. Its defaults are checked against A16.
- [ ] Session cookie is `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax` (or Strict). Session is rotated on login. Server-side revocation works.
- [ ] Idle and absolute timeouts are set and documented. Step-up re-auth guards sensitive changes.
- [ ] Passwords (if any) follow NIST: ≥15 chars (or ≥8 with MFA), no composition rules, blocklist/HIBP, paste allowed, Argon2id m=19MiB,t=2,p=1.
- [ ] Login, reset, OTP-send and verify endpoints are rate-limited per account and per IP. There is a CAPTCHA escalation path. There is no permanent lockout.
- [ ] The enumeration stance is chosen deliberately and applied consistently across login, sign-up and reset.
- [ ] Reset tokens are ≥112-bit, hashed, single-use, ~1 h. MFA is required on reset if enabled. Sessions are revoked on reset. A notification email is sent.
- [ ] MFA offers passkey or TOTP, and recovery codes (hashed). SMS only as a restricted fallback.
- [ ] Passkeys are offered after sign-in, with conditional UI on the sign-in page (`autocomplete="username webauthn"`).
- [ ] OAuth uses code + PKCE + `state` (presence checked). Accounts are keyed by (iss, sub). Auto-linking only happens with a verified email. Redirect targets are allowlisted.
- [ ] iOS: an equivalent login (e.g., SIWA) exists if third-party login is used. In-app account deletion exists.
- [ ] Mobile: system browser for OAuth; tokens in Keychain/Keystore; refresh rotation with reuse detection.
- [ ] WCAG 3.3.8: autofill and paste work, a single OTP input, and a non-transcription path exists.

**Authorization and data handling**

- [ ] Every handler checks authn and authz server-side, including server actions and API routes, not just middleware.
- [ ] Queries are scoped by owner/tenant. There are tests where user A tries B's objects (read, update, delete, export).
- [ ] Input is schema-validated with unknown fields rejected. Output DTOs exclude secrets.
- [ ] No string-built SQL, shell or HTML. The escape hatches (`dangerouslySetInnerHTML`, `v-html`, `$queryRawUnsafe`) are reviewed.

**Browser, network and operations**

- [ ] Strict CSP (nonce + `strict-dynamic`), HSTS, nosniff, `frame-ancestors`, Referrer-Policy and COOP are set.
- [ ] CORS uses an exact-origin allowlist, never a reflected origin, and never `*` with credentials.
- [ ] URL-fetching features have SSRF controls (scheme, DNS/IP check, pinning, no redirects, IMDSv2).
- [ ] Uploads use an allowlist and magic-byte check, get renamed, have size caps, are stored outside the webroot, and are served with `attachment`/nosniff.
- [ ] Secrets live in a manager, with no secrets in the repo, logs or client bundles. Env is validated at boot.
- [ ] Security events are logged without tokens or PII, and alerts exist for auth anomalies.
- [ ] Errors fail closed with a generic message to the client and detail in logs (A10).
- [ ] Dependencies are locked, scanned and updated. Framework advisories are watched (CVE-2025-29927 and CVE-2025-55182 lessons).
- [ ] AI features: model output is treated as untrusted, tools are least-privilege, and consequential actions have human confirmation.

---

## Appendix 1: Source conflicts and how to resolve them in skills

| Topic | Positions | Resolution for skills |
|---|---|---|
| Min password length | NIST 15 (single-factor) / 8 (MFA); ASVS 8 (15 recommended); Copenhagen 8; Auth Book 8–10; Better Auth 8 | **15 unless MFA is mandatory, then ≥8** (NIST is the normative standard) |
| Unicode in passwords | NIST SHOULD accept; Auth Book suggests printable ASCII only | Accept Unicode + NFC normalize (NIST) |
| Enumeration | OWASP generic always; ASVS only L3; Copenhagen and Auth Book: specific is OK for most | Decide by product sensitivity (A4.3 table) |
| Lockout | OWASP: account lockout with care; NIST ≤100 then disable; Auth Book: avoid lockout, token bucket | Throttle (token bucket/delays), never permanent lockout, keep an alternate sign-in path |
| Auto-login after reset | OWASP: no; common UX: yes | Yes only if MFA or same-device binding; else prefilled sign-in |
| Invalidate sessions on password change | Copenhagen: all; ASVS: offer; Auth Book: ask | Reset → revoke all; change → offer (pre-checked) |
| Email case normalization | Copenhagen: lowercase all; OWASP: lowercase domain; Auth Book: never modify | Store as typed; unique index on a normalized form; never strip `+tag` |
| SameSite | Lax (Copenhagen, Auth Book) vs Strict example (OWASP) | Lax default; Strict for high-security or admin-only apps |
| scrypt params | Copenhagen N=16384,r=16; OWASP N=2^17,r=8 | OWASP |
| Magic link vs OTP | Copenhagen lists both; Auth Book prefers codes | Code default; scanner-safe links if used |

## Appendix 2: Unverified items to re-check before shipping

1. FIDO Alliance adoption figures (15B accounts; Passkey Index Oct 2025 metrics) and Microsoft passwordless-by-default date.
2. Google Sign-In branding specifics and One Tap → FedCM migration status (developers.google.com was unreachable).
3. Date of the Apple 4.8 change from "Sign in with Apple" to "equivalent login service" (believed 2024). The current text is verified.
4. Exact OWASP Top 10:2025 publication date (late 2025).
5. WebAuthn Signal API method names on the web (`signalUnknownCredential`, `signalAllAcceptedCredentials`, `signalCurrentUserDetails`) and conditional-create browser support versions.
6. DBSC shipping status in Chrome (2026).
7. RFC 8252 specifics (claimed HTTPS redirects) and Google's embedded-webview OAuth block.
8. Keychain accessibility constants and Android Keystore / BiometricPrompt `CryptoObject` specifics.
9. ORM raw-query API names list (B4.1).
10. SMS pumping mitigation guidance (vendor docs).
11. `/.well-known/change-password` spec status; the WebOTP SMS format.
12. GDPR consent / pre-ticked boxes citation (Planet49).
13. Hosted IdP pricing and MAU tiers (deliberately omitted).

## Appendix 3: Source URLs

**Auth implementation guides**

- Copenhagen Book (MIT, archived): <https://thecopenhagenbook.com> / <https://github.com/pilcrowonpaper/copenhagen>
  - pages: sessions, server-side-tokens, password-authentication, email-verification, password-reset, csrf, mfa, oauth, webauthn, open-redirect
- Auth Book (successor): <https://auth.pilcrowonpaper.com> / <https://github.com/pilcrowonpaper/auth.pilcrowonpaper.com>
  - topics: authentication_methods, passwords, email_code_authentication, auth_sessions, csrf, browser_client_side_storage, email_addresses, passkeys
- Lucia deprecation: <https://github.com/lucia-auth/lucia> (README; announcement <https://pilcrowonpaper.com/blog/18>)

**OWASP**

- Cheat Sheets:
  - <https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html>
  - <https://cheatsheetseries.owasp.org/cheatsheets/Choosing_and_Using_Security_Questions_Cheat_Sheet.html>
- OWASP Top 10:2025: <https://owasp.org/Top10/2025/> (source <https://github.com/OWASP/Top10/tree/master/2025/docs/en>)
- OWASP ASVS 5.0.0: <https://github.com/OWASP/ASVS/tree/master/5.0/en> (V3 `0x12`, V6 `0x15`, V7 `0x16`, V8 `0x17`, V9 `0x18`, V10 `0x19`)

**Standards**

- NIST SP 800-63B-4: <https://pages.nist.gov/800-63-4/sp800-63b.html> (DOI <https://doi.org/10.6028/NIST.SP.800-63b-4>); mirror repo <https://github.com/usnistgov/800-63-4>
- WCAG 2.2 SC 3.3.8 Understanding: <https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html> (source <https://github.com/w3c/wcag/blob/main/understanding/22/accessible-authentication-minimum.html>)
- WHATWG autofill: <https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill>

**Passkeys and platforms**

- passkeys.dev:
  - <https://passkeys.dev/docs/use-cases/bootstrapping/>
  - <https://passkeys.dev/docs/use-cases/reauth/>
  - <https://passkeys.dev/docs/reference/ios/>
  - <https://passkeys.dev/docs/reference/android/>
  - <https://passkeys.dev/docs/reference/terms/>
  - <https://passkeys.dev/docs/advanced/related-origins/>
- Apple:
  - App Review Guidelines 4.8 & 5.1.1(v): <https://developer.apple.com/app-store/review/guidelines/>
  - HIG Sign in with Apple: <https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple>
  - HIG Managing accounts: <https://developer.apple.com/design/human-interface-guidelines/managing-accounts>
  - `ASAuthorizationAccountCreationProvider`: <https://developer.apple.com/documentation/authenticationservices/asauthorizationaccountcreationprovider>
  - `ASCredentialUpdater`: <https://developer.apple.com/documentation/authenticationservices/ascredentialupdater>
  - `ASWebAuthenticationSession`: <https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession>
- Android:
  - <https://developer.android.com/identity/sign-in/credential-manager>
  - <https://developer.android.com/identity/sign-in/credential-manager-siwg>
  - <https://developer.android.com/identity/sign-in/restore-credentials>

**Libraries**

- Better Auth docs: <https://github.com/better-auth/better-auth/tree/main/docs/content/docs>
  - concepts/session-management, concepts/rate-limit, authentication/email-password, plugins/magic-link, plugins/email-otp, plugins/captcha, plugins/last-login-method

**Advisories and other**

- GHSA-f82v-jwr5-mffw (CVE-2025-29927, Next.js middleware authz bypass): <https://github.com/advisories/GHSA-f82v-jwr5-mffw>
- GHSA-fv66-9v8q-g76r (CVE-2025-55182, React Server Components RCE): <https://github.com/advisories/GHSA-fv66-9v8q-g76r>
- Magic links vs link scanners:
  - <https://github.com/supabase/auth/issues/1214>
  - <https://github.com/supabase/auth/issues/368>
- DBSC explainer: <https://github.com/w3c/webappsec-dbsc>
- Authorization engines:
  - <https://github.com/openfga/openfga>
  - <https://github.com/authzed/spicedb>
  - <https://github.com/cerbos/cerbos>
  - <https://github.com/cedar-policy/cedar>
  - <https://github.com/osohq/oso> (legacy OSS library deprecated)
- HIBP Pwned Passwords API: <https://haveibeenpwned.com/API/v3#PwnedPasswords>
- zxcvbn-ts: <https://github.com/zxcvbn-ts/zxcvbn>

## Appendix 4: Licensing notes for CREDITS.md

- **Copenhagen Book**: MIT. Ideas and short paraphrases are fine with credit.
- **OWASP Cheat Sheets and ASVS**: CC BY-SA 4.0. Paraphrase in our own words and credit. Do not copy large verbatim passages, because share-alike would attach.
- **OWASP Top 10**: CC BY-SA 4.0 [V, repo LICENSE].
- **NIST SP 800-63**: US government work, public domain in the US. Short quotes are fine.
- **Auth Book** (auth.pilcrowonpaper.com): **no license file**. Ideas only, credited, and no copied text.
- **passkeys.dev**: license not checked [U]. Paraphrase only.
- **Apple and Android docs**: proprietary. Paraphrase only, and link.
- **Better Auth**: MIT [V, LICENSE.md]. Cite its defaults as facts.
