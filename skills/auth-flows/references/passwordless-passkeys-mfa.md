# Passwordless, Passkeys, and MFA

Email codes vs magic links, passkey registration and sign-in, passkey management, MFA factors, TOTP, recovery codes, remembered devices, and step-up. Status as of 2026-09.

## Contents
1. Email code vs magic link
2. Email code parameters
3. Scanner-safe magic links
4. Passkeys: concepts
5. Passkeys: UX rules
6. Passkeys: server options and verification
7. MFA factors
8. TOTP
9. Recovery codes
10. MFA policy, remembered devices, failures
11. Rules catalog

## 1. Email code vs magic link

| | Email code (default) | Magic link |
|---|---|---|
| Read mail on phone, sign in on laptop | Works | Opens the session on the wrong device |
| Corporate link scanners (Safe Links-style gateways) | Unaffected | Can pre-fetch and consume single-use links; users see "link expired" |
| Mobile | `autocomplete="one-time-code"` and paste | Needs Universal Links / App Links to open the app |
| Spam filtering | Plain code emails filter less | Link-heavy mail filters more |
| WCAG 3.3.8 | Transcription is a cognitive test; autofill and paste make it pass | Clicking is not a cognitive test |
| Phishing | A fake site can relay a code in real time | Links can be proxied too, but are harder to hand over |

Default to codes. The Auth Book author prefers codes over single-use links for these reasons.

**Email is not a strong factor.** NIST 800-63B-4 forbids email for out-of-band authentication (address-verification and recovery codes are excluded), and ASVS L3 forbids email as a factor. Email-code sign-in is fine for ordinary consumer apps; regulated or AAL2+ contexts need a second factor or a passkey.

## 2. Email code parameters

| Parameter | Default |
|---|---|
| Format | 8 digits, or 6–8 characters from an alphabet without look-alikes (no 0/O, 1/I/l); ~40 bits of entropy is the Auth Book's floor |
| Generation | CSPRNG only |
| Lifetime | ≤ 10 minutes for sign-in codes (ASVS out-of-band limit); ≤ 1 hour for email-verification codes |
| Attempts | Invalidate a code after a few wrong tries (libraries commonly use 3–5); per-account limiter on the verify endpoint |
| Storage | Hash of the code, bound to one user + one address + a pre-auth session |
| Consumption | Atomic (delete in the same transaction that creates the session) |
| Resend | New code each time, old code invalid; 30 s cooldown in the UI; per-address and per-IP send limits |
| Concurrency | Don't cap outstanding codes per account so tightly that an attacker can block the owner |

If 6-digit codes are required for familiarity, keep strict per-code attempt caps and send limits (Better Auth's email-OTP defaults: 6 digits, 5 minutes, 3 attempts).

## 3. Scanner-safe magic links

If you ship links anyway:
1. The link's GET renders a page with a **"Sign in" button that POSTs**; only the POST consumes the token. Scanners fetch pages but generally don't submit forms.
2. Put a code in the same email as a fallback.
3. Bind the flow to the browser that requested it (pre-auth cookie). Opened elsewhere → ask "Were you signing in on Chrome on Windows?" or show the code to type on the original device.
4. Token ≥ 112 bits, hashed at rest, single use, short expiry (Better Auth defaults to 5 minutes and stores tokens plain unless `storeToken: "hashed"`).
5. `Referrer-Policy: no-referrer` on the landing page; link base URL from config.

## 4. Passkeys: concepts

- A passkey is a discoverable WebAuthn credential with user verification (biometric or device PIN). **Synced** passkeys live in a platform or third-party password manager and follow the user across devices; **device-bound** passkeys live on a security key.
- They are **phishing-resistant**: the credential is bound to your domain (RP ID) and the browser will not use it on a look-alike site.
- NIST 800-63B-4 explicitly covers syncable authenticators. Synced passkeys give up strict "one device" possession but remain far stronger than passwords; demanding extra MFA on top of a passkey sign-in adds friction for little gain.
- Platform support: iOS/iPadOS 16+ and Android 9+; Android 14 added third-party passkey providers. iOS 26 adds passkey-backed account creation (`ASAuthorizationAccountCreationProvider`) and `ASCredentialUpdater`, the native counterpart of the WebAuthn Signal API.

## 5. Passkeys: UX rules

1. **Offer creation after sign-in, not as a gate**: right after sign-up, after a password or code sign-in, and after a cross-device (QR) sign-in (`authenticatorAttachment === "cross-platform"` → "Use this device next time?"). Check `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` before offering a local passkey.
2. **Conditional UI on the sign-in page**: `autocomplete="username webauthn"` and `mediation: "conditional"` on load, plus an explicit "Sign in with a passkey" button.
3. **Automatic upgrades**: after a password autofill sign-in, some browser + OS + password manager combinations can create a passkey silently ("conditional create"). Feature-detect with `PublicKeyCredential.getClientCapabilities()` (`conditionalCreate`), and treat it as a bonus, not the plan.
4. **Disclose** that anyone who can unlock this device can use the passkey.
5. **Management**: allow several passkeys per account (the Auth Book suggests at least 5, ideally 10); auto-name from the provider (AAGUID → "iCloud Keychain", "Google Password Manager") and allow renaming; show created and last-used dates; require step-up to add or remove; notify on changes.
6. **`excludeCredentials`** with the user's existing credential IDs, so the same manager does not create duplicates.
7. **Keep managers in sync** via the WebAuthn Signal API where supported (unknown credential after deletion, current accepted credentials, updated username/display name). Feature-detect; it is progressive enhancement.
8. **`userVerification: "preferred"`** for sign-in to avoid repeated OS password prompts on desktops without biometrics; enforce the UV flag server-side if your policy requires it.
9. **`attestation: "none"`** for consumer apps; other values add consent prompts and lower completion.
10. **Several domains or ccTLDs**: prefer one auth domain with federation; Related Origin Requests (`/.well-known/webauthn`) exist for the rest. Native apps associate via Associated Domains (iOS) or Digital Asset Links (Android).
11. **Always keep a fallback** (email code, password + MFA, recovery). Recovery is now the weakest link, so make it strong.

## 6. Passkeys: server options and verification

```js
// Registration options (user is signed in and freshly verified)
{
  rp: { id: "example.com", name: "Example" },
  user: { id: /* random 32 bytes, stable per user, never the email */, name: "ada@example.com", displayName: "Ada Lovelace" },
  challenge: /* ≥16 random bytes, single use, stored server-side, short TTL */,
  pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], // ES256, RS256
  excludeCredentials: /* existing credential IDs */,
  authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  attestation: "none",
  extensions: { credProps: true }
}
```

Verification checklist (registration and sign-in): `clientDataJSON.type` is `webauthn.create` / `webauthn.get` · challenge matches and is deleted · origin is exactly your origin · rpIdHash = SHA-256(rpId) · user-present flag set · user-verified flag set if required · algorithm allowed · signature valid. Store credential ID, public key, sign count, transports, and backup flags. When a security key is used as a **second factor**, check that the credential belongs to the already-identified user — skipping this lets any registered key pass anyone's 2FA. Use a maintained WebAuthn server library for all of this.

## 7. MFA factors

| Factor | Strength | Default use |
|---|---|---|
| Passkey / security key | Phishing-resistant | Preferred second factor and preferred primary |
| TOTP authenticator app | Good, but phishable by real-time relay | Default opt-in 2FA where passkeys are not yet used |
| Push approval | Phishable; fatigue attacks | Only with number matching and push rate limits |
| SMS / voice code | NIST "restricted": SIM swap, porting, interception | Fallback only, with a pre-validated number, stronger options offered, and the risk explained; avoid for financial or sensitive-data apps |
| Email code | Not a second factor if email can also reset the password | Verification and recovery, not MFA |
| Recovery codes | Backup | Always issued with MFA |

The 2025 chalk/debug npm compromise began with a phishing email that captured a maintainer's password **and a live TOTP code** — the practical argument for passkeys over TOTP for high-value accounts (admins, maintainers, finance).

## 8. TOTP

- Secret: 160 bits from a CSPRNG per user, encrypted at rest (envelope encryption with a KMS key).
- Enrollment: QR code of an `otpauth://totp/Issuer:account?secret=BASE32&issuer=Issuer&digits=6&period=30` URI **and** the base32 secret as selectable text (screen readers, desktop apps). Enable only after the user enters a valid current code. Generating a new QR invalidates the old secret.
- Verification: 6 digits, 30-second period, small clock-skew tolerance, server time only, each code accepted once.
- Throttle per account (Copenhagen suggests blocking for 15–60 minutes after about 5 consecutive failures); never log codes.

## 9. Recovery codes

- Issue at MFA setup as a set of single-use codes, each with ≥ 40 bits of entropy (e.g., 10 hex characters), hashed with a password hash (ASVS requires that for secrets under 112 bits).
- Show once with **Copy**, **Download**, and **Print**; ask the user to confirm they saved them. "Save these somewhere safe, like your password manager."
- Regenerating (after step-up) invalidates the previous set. Notify the user whenever a code is used; show how many remain in security settings.

## 10. MFA policy, remembered devices, failures

- Require MFA for admins and privileged roles. Offer it to everyone; nudge after sign-in for accounts that hold money or sensitive data.
- **Every sign-in path enforces the same policy** — web, mobile, API, legacy, SSO fallback. No undocumented path skips MFA, and a passkey-enabled account cannot be downgraded to SMS by an attacker choosing "use another way".
- **Password reset with MFA** requires the second factor or a recovery code before the new-password form.
- **Remember this device**: separate signed HttpOnly cookie bound to user and device with an expiry; revoke on reset, MFA change, and sign-out-everywhere; list in settings.
- **Correct password, failed MFA**: offer other factors and recovery, and notify the user (time, device, location) suggesting a password change.
- Changing or removing a factor requires re-auth with an existing factor and sends a notification; high-value accounts may add a delay before removal takes effect.

## 11. Rules catalog

### Default to email codes, not magic links
**Rule.** Use a one-time code for passwordless sign-in and email verification.
**Apply when.** Any email-based authentication step.
**Do / Avoid.** Do send "Your code is 4829 1736" with a single autofill-friendly field. Avoid a link whose GET signs the user in.
**Why.** Link scanners consume single-use links, and links break cross-device sign-in.

### Offer passkeys after success, not before
**Rule.** Ask users to create a passkey right after a successful sign-in or sign-up.
**Apply when.** The device supports a user-verifying platform authenticator.
**Do / Avoid.** Do show a one-screen offer with "Not now". Avoid requiring a passkey to finish sign-up.
**Why.** At that moment the user is verified and motivated; a gate adds a failure point to the most important funnel.

### Bind second-factor credentials to the user
**Rule.** When verifying a WebAuthn assertion as 2FA, confirm the credential belongs to the user who passed the first factor.
**Apply when.** Non-discoverable security keys or passkeys used as a second factor.
**Do / Avoid.** Do look up the credential by ID and compare its user ID. Avoid accepting any valid assertion.
**Why.** Otherwise an attacker's own registered key satisfies anyone's second factor.

## Sources

- passkeys.dev (bootstrapping, re-authentication, terms, iOS and Android references, related origins): https://passkeys.dev/docs/
- NIST SP 800-63B-4 (restricted authenticators, email out-of-band ban, syncable authenticators): https://pages.nist.gov/800-63-4/sp800-63b.html
- OWASP Multifactor Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
- OWASP ASVS 5.0.0 V6 (6.5 general authenticator requirements, 6.6 out-of-band): https://github.com/OWASP/ASVS/tree/master/5.0/en
- The Copenhagen Book (MIT) — MFA, WebAuthn, email verification: https://thecopenhagenbook.com/
- The Auth Book (ideas only) — authentication methods, email codes, passkeys: https://auth.pilcrowonpaper.com/
- Better Auth plugin docs (magic-link, email-otp, passkey, two-factor defaults): https://github.com/better-auth/better-auth/tree/main/docs/content/docs/plugins
- Magic links vs link scanners: https://github.com/supabase/auth/issues/1214
- Apple AuthenticationServices: https://developer.apple.com/documentation/authenticationservices/asauthorizationaccountcreationprovider · https://developer.apple.com/documentation/authenticationservices/ascredentialupdater
- chalk/debug npm phishing (live TOTP captured): https://www.stepsecurity.io/blog/20-popular-npm-packages-compromised-chalk-debug-strip-ansi-color-convert-wrap-ansi
