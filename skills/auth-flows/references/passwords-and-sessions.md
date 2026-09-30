# Passwords, Throttling, and Sessions

Implementation detail for password storage and policy, brute-force defenses, session tokens and cookies, timeouts, revocation, CSRF, redirects, and security notifications. Standards cited: NIST SP 800-63B-4 (final), OWASP ASVS 5.0.0 (requirement IDs in the form `v5.0.0-<chapter>.<section>.<req>`), OWASP cheat sheets, and the Copenhagen Book.

## Contents
1. Password policy
2. Breached-password checks and strength feedback
3. Password storage
4. Throttling, stuffing, spraying, lockout
5. Session tokens
6. Cookies
7. Timeouts
8. Revocation events
9. Remember me, device lists, step-up
10. CSRF and open redirects
11. Security notifications
12. Rules catalog

## 1. Password policy

| Rule | NIST 800-63B-4 | ASVS 5.0 |
|---|---|---|
| Minimum length | SHALL ≥ 15 when single-factor; SHALL ≥ 8 when only part of MFA | 6.2.1: ≥ 8, 15 strongly recommended |
| Maximum length | SHOULD permit ≥ 64 | 6.2.9: ≥ 64 |
| Characters | SHOULD accept printing ASCII, space, and Unicode (each code point counts as one) | 6.2.5: any composition |
| Composition rules | SHALL NOT impose | 6.2.5 |
| Periodic rotation | SHALL NOT require; SHALL force change on evidence of compromise | 6.2.10 |
| Blocklist | SHALL check against common, expected, and compromised values; SHALL say why it was rejected | 6.2.4 (top 3000), 6.2.11 (context words), 6.2.12 (breached) |
| Hints, security questions | SHALL NOT | 6.4.2 |
| Truncation | SHALL verify the entire password | 6.2.8 |
| Paste, password managers | SHALL allow managers/autofill; SHOULD allow paste | 6.2.7 |
| Show password | SHOULD offer | 6.2.6 |
| Consecutive failures | SHALL limit to ≤ 100 per account | 6.3.1 |

Defaults to implement:
- Min 15 unless MFA is mandatory for every account (then ≥ 8). Max 128 is a safe cap for Argon2id.
- Normalize Unicode to NFC before hashing so the same passphrase typed on different keyboards matches. (The Auth Book prefers printable ASCII only; NIST is the normative source here.)
- Never trim or alter a password silently beyond what NIST explicitly allows.
- Changing a password requires the current password or a fresh step-up.

## 2. Breached-password checks and strength feedback

- **Have I Been Pwned range API** (k-anonymity): SHA-1 the password, send the first 5 hex characters to `https://api.pwnedpasswords.com/range/{prefix}`, compare the returned suffixes locally. Or self-host the downloadable corpus. Check at sign-up, change, and reset.
- **On login with a known-breached password**: let the sign-in finish, then require a change (NIST: force change on evidence of compromise).
- **Strength meters** (e.g., zxcvbn-ts) guide; they are not the rule. Show live feedback on the real rule (length) and the blocklist result, never a checklist of "1 uppercase, 1 symbol".

## 3. Password storage

| Algorithm | OWASP minimum parameters | Notes |
|---|---|---|
| **Argon2id** (default) | m = 19 MiB, t = 2, p = 1 (equivalents: m = 46 MiB t = 1; m = 12 MiB t = 3; m = 9 MiB t = 4; m = 7 MiB t = 5) | Raise memory first as hardware allows |
| scrypt | N = 2^17, r = 8, p = 1 | Older guides list smaller N; use OWASP's |
| bcrypt | cost ≥ 10 | **72-byte input limit**: cap length or choose Argon2id; don't pre-hash with raw SHA |
| PBKDF2-HMAC-SHA-256 | 600,000 iterations | Only when FIPS-140 compliance forces it |

- Unique salt per hash (libraries do this). A pepper is optional and belongs in a secrets manager or HSM, not the database.
- Use the library's `verify()` (constant time). Rehash transparently on successful login when parameters change.
- **Hashing is a DoS vector.** Bound concurrent hashes (a queue or worker pool; in Node, off the main thread) and rate-limit every endpoint that hashes.
- For unknown users, still run a hash on login attempts so response time does not reveal existence (when you are in generic mode).

## 4. Throttling, stuffing, spraying, lockout

Attacks: **brute force** (many passwords → one account), **credential stuffing** (breached pairs → many accounts), **password spraying** (one common password → many accounts).

Layered defaults:
1. **Per-account limiter** on every secret-verifying endpoint (password, email code, TOTP, recovery code). The Auth Book suggests a token bucket per user (about 5 capacity, 1 refill per minute), which caps an attacker near half a million guesses a year without ever locking the user out. NIST allows rising waits and requires disabling that authenticator after at most 100 consecutive failures.
2. **Per-IP / per-subnet limits** (IPv6 per /64) for stuffing and spraying. Get the client IP only from your trusted proxy hop; a spoofable `X-Forwarded-For` makes every limit useless. Keep counters in Redis or the database when running more than one instance.
3. **No hard lockout.** Keep email-code sign-in and reset working while the password path is throttled; never lock or change an account because a reset was requested.
4. **Known devices** (a signed device cookie set after a successful sign-in) can bypass per-account throttles so that an attack on an account does not block its owner (OWASP device-cookie approach).
5. **Bot challenge escalation**: none first; a managed challenge after a few failures or on risk signals; always an accessible path.
6. **Breached-credential detection** at login (section 2) and **MFA**, which OWASP calls by far the best defense against these attacks.
7. **Notify** on a correct password followed by failed MFA; don't email on every wrong password (notification fatigue).
8. **Uniform responses** in generic mode: same body, status code, and timing across failure reasons. `429 Too Many Requests` + `Retry-After` for throttling.

## 5. Session tokens

| | Opaque server session (default) | Stateless JWT session |
|---|---|---|
| Logout, "sign out everywhere", bans, reset | Immediate: delete the row | Needs a denylist — then it is stateful anyway |
| Permission changes take effect | Immediately | At token expiry |
| Footguns | Few | `alg: none`, key confusion, `kid`/`jku` trust, audience confusion |
| Cost | One indexed lookup (cacheable) | None |

- Generate ≥ 128 bits from a CSPRNG (ASVS 7.2.3). Store **SHA-256(token)** in the database, so a database leak does not yield live sessions. A fast hash is fine for high-entropy tokens.
- **New session ID** on sign-in, on re-authentication, and on privilege change; destroy the pre-auth session (fixation).
- Signed "cookie cache" layers (e.g., Better Auth `cookieCache`) trade revocation latency for fewer lookups: a revoked session keeps working until the cache expires. Keep it short and bypass it for sensitive operations.
- Use JWTs for short-lived API access tokens and service-to-service calls, validating `iss`, `aud`, `exp`, `nbf`, and an algorithm allowlist (see `api-design`).
- **Watch**: Device Bound Session Credentials (DBSC), a W3C proposal to bind browser sessions to a device key so stolen cookies stop working elsewhere. Check current browser support before relying on it.

## 6. Cookies

```
Set-Cookie: __Host-session=<token>; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000
```

- `__Host-` forces `Secure`, `Path=/`, and no `Domain`, blocking subdomain cookie injection (ASVS 3.3.3). Use `__Secure-` only when the cookie must span subdomains.
- `SameSite=Lax` is the default. `Strict` suits admin-only or high-security apps (users arriving from an email link appear signed out). SameSite is defense in depth, not CSRF protection by itself.
- Browsers cap cookie lifetime (Chrome: 400 days); re-set the cookie as a sliding session extends.
- No session or refresh token in `localStorage`, `sessionStorage`, or JS-readable cookies. HttpOnly prevents exfiltration; XSS can still act as the user, so CSP still matters (`application-security`).
- `Cache-Control: no-store` on authenticated responses.

## 7. Timeouts

| Context | Idle timeout | Absolute timeout |
|---|---|---|
| Consumer app (content, social, shopping), NIST AAL1 | Optional; sliding window (e.g., 30 days, extended when used in the last half) | SHOULD ≤ 30 days at AAL1; consumer apps often choose longer with sliding renewal |
| NIST AAL2 (MFA; most B2B SaaS) | SHOULD ≤ 1 hour | SHOULD ≤ 24 hours |
| NIST AAL3 | SHOULD ≤ 15 minutes | SHALL ≤ 12 hours |
| OWASP guidance for high-value apps | 2–5 minutes | 4–8 hours for office-day apps |

- Enforce on the server. Warn about 2 minutes before idle expiry with "Stay signed in"; save drafts.
- At AAL2, after idle expiry but before the absolute limit, re-authentication with just the password or a biometric plus the existing session secret is allowed.
- Refresh sliding expiry at most hourly or daily to avoid a database write per request.
- Write the chosen values down (ASVS 7.1.1) — they are product decisions, not constants buried in config.

## 8. Revocation events

| Event | Default |
|---|---|
| Password **reset** (forgot flow) | Revoke all sessions, remembered-device cookies, and refresh tokens. Library default may differ — Better Auth needs `revokeSessionsOnPasswordReset: true` |
| Password **change** (knows the old one) | Offer "Sign out of other devices", pre-checked |
| Email verified, role or permission gained | Rotate the current session ID |
| MFA added or removed, passkey removed | Offer to sign out other sessions |
| Account disabled, deleted, or deprovisioned via SCIM | Terminate all sessions |
| Logout | Delete the server-side session and clear the cookie |
| Admin action | Admins can terminate a user's sessions |

## 9. Remember me, device lists, step-up

- **Remember me** chooses between a persistent cookie (`Max-Age`) and a browser-session cookie. Never implement it as a stored password or a separate auto-login token that skips rotation.
- **"Don't ask for MFA on this device"**: a separate signed, HttpOnly device cookie bound to user + device with an expiry; revoked on password reset, MFA change, and "sign out everywhere"; listed in security settings.
- **Device list**: device and browser, approximate location from IP, last active, "This device", sign out per session, sign out all others. The Auth Book warns that a hijacker can use per-session sign-out to keep kicking the owner out, so require re-auth for it.
- **Step-up**: sensitive actions require verification ≤ ~10–15 minutes old, bound to that single action. For payments or other high-value transactions, show the amount and payee in the confirmation and bind the approval to that data server-side (OWASP Transaction Authorization).
- When relying on an OIDC IdP for recency, check `auth_time` (and `acr`/`amr` for strength); an IdP may return a fresh assertion from a long-lived IdP session without asking the user again.

## 10. CSRF and open redirects

```js
// Fetch Metadata guard for cookie-authenticated apps (policy from the OWASP CSRF cheat sheet)
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
function csrfGuard(req, res, next) {
  if (SAFE.has(req.method)) return next();
  const site = req.get("Sec-Fetch-Site");
  if (site) return site === "same-origin" || site === "none" ? next() : res.status(403).end();
  const origin = req.get("Origin");                 // fallback for clients without Fetch Metadata
  if (origin && ALLOWED_ORIGINS.has(origin)) return next();
  return res.status(403).end();                     // no signal: deny
}
```

- Never change state on GET or HEAD. Protect the **login and sign-up POSTs** too (login CSRF signs the victim into the attacker's account).
- For JSON APIs, require `Content-Type: application/json` (parsed properly) or a custom header, which forces a CORS preflight.
- For classic forms, a synchronizer token or a signed double-submit cookie bound to the session; naive double-submit is weak. Prefer the framework's built-in protection when it exists (and Go's `http.CrossOriginProtection` in Go 1.25+).
- Server actions and RPC endpoints are public POST endpoints: authenticate, authorize, and CSRF-check inside each.
- **Redirect after login**: accept only a relative path. Parse with a URL parser against your origin; reject scheme-relative (`//evil.com`), backslash (`/\evil.com`), and absolute URLs.

## 11. Security notifications

Send (email, plus push if available) for: new sign-in from a new device or location (optional for low-risk consumer apps), password changed or reset, email or phone changed (to the **old** address), MFA enabled/disabled/changed, passkey added or removed, recovery code used, correct password but failed MFA. Content: what happened, when, device/browser, approximate location, "If this was you, no action is needed", and a **Secure your account** button leading to re-auth → sign out everywhere → reset. Never include a password or a code that signs someone in. Copy: `copy-library.md`.

## 12. Rules catalog

### Revoke every session on password reset
**Rule.** A completed reset ends all sessions, remembered devices, and refresh tokens.
**Apply when.** Any forgot-password or admin-initiated reset.
**Do / Avoid.** Do delete session rows for the user in the reset transaction. Avoid trusting a library default without reading it.
**Why.** A reset often means the account was compromised; the attacker's session must not survive it.

### Throttle per account, never lock out
**Rule.** Slow guessing per account and per network; keep an alternate sign-in path open.
**Apply when.** Any endpoint that verifies a password, code, or recovery code.
**Do / Avoid.** Do use a token bucket and a code-by-email fallback. Avoid "account locked after 5 attempts, contact support".
**Why.** Lockouts convert an attacker's guesses into a denial of service against the owner.

### Store only hashes of tokens
**Rule.** Session IDs, reset tokens, verification codes, and magic-link tokens are stored hashed.
**Apply when.** Any bearer secret the server issues.
**Do / Avoid.** Do SHA-256 high-entropy tokens; Argon2id for low-entropy codes such as recovery codes. Avoid plain columns "for debugging".
**Why.** A read-only database leak (SQL injection, stolen backup) should not hand out live access.

## Sources

- NIST SP 800-63B-4 (public domain): https://pages.nist.gov/800-63-4/sp800-63b.html
- OWASP ASVS 5.0.0, V6 Authentication and V7 Session Management: https://github.com/OWASP/ASVS/tree/master/5.0/en
- OWASP cheat sheets (paraphrased, CC BY-SA 4.0): Password Storage https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html · Session Management https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html · Credential Stuffing https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html · CSRF https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html · JWT https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html · Transaction Authorization https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html
- The Copenhagen Book (MIT) — sessions, server-side tokens, password authentication, CSRF, open redirect: https://thecopenhagenbook.com/
- The Auth Book (ideas only) — sessions, throttling, passwords: https://auth.pilcrowonpaper.com/
- Have I Been Pwned Pwned Passwords API: https://haveibeenpwned.com/API/v3#PwnedPasswords
- zxcvbn-ts: https://github.com/zxcvbn-ts/zxcvbn
- Better Auth docs (MIT) — session management, rate limit, email-password defaults: https://github.com/better-auth/better-auth/tree/main/docs/content/docs
- DBSC explainer: https://github.com/w3c/webappsec-dbsc
