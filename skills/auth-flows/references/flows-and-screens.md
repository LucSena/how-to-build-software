# Flows, Screens, and Markup

Flow diagrams, screen layouts, and copy-paste markup for web sign-in and sign-up. Every flow here assumes the defaults in `SKILL.md`: identifier-first entry, email codes over links, passkeys offered after sign-in, opaque server sessions.

## Contents
1. Flow: unified sign-in / sign-up ("Continue")
2. Flow: passkey autofill sign-in (conditional UI)
3. Flow: email code (sign-up and passwordless sign-in)
4. Flow: password reset
5. Flow: MFA challenge and step-up
6. Flow: change email
7. Screen layouts
8. HTML
9. Conditional UI JavaScript
10. Screen states checklist

## 1. Flow: unified sign-in / sign-up

```
GET /sign-in
  ├─ page load: start passkey conditional UI (section 2)
  └─ user submits identifier (email) → POST /auth/continue
        │  (bot challenge only if risk signals or recent failures)
        ▼
  lookup(email, normalized)
    ├─ account exists
    │    ├─ org domain enforces SSO ──→ 302 to the org's IdP (OIDC/SAML) ──→ callback → session
    │    ├─ has password ─────────────→ Step 2: password (email shown read-only + "Change")
    │    │                                  └─ links: "Forgot password?" · "Email me a code instead"
    │    ├─ social-only ──────────────→ Step 2: "This account uses Google." [Continue with Google]
    │    └─ passwordless ─────────────→ send code → Step 2: code
    └─ no account
         ├─ email domain has verified SSO connection → IdP → JIT-provision → session
         └─ send code → Step 2: code → verify → create account → session
                                                    └─ Step 3: offer passkey (skippable)
                                                    └─ then onboarding (not auth's job)
```

- The identifier stays in server state (a short-lived pre-auth session), not a hidden field the client can change between steps.
- "Change" on step 2 returns to step 1 with the field prefilled and focused.
- Generic-mode variant (sensitive products): step 1 always leads to "We sent a code to ada@…" and the email itself branches ("Sign in with this code" / "You don't have an account yet — this code creates one"). Nothing on screen reveals existence.

## 2. Flow: passkey autofill sign-in (conditional UI)

```
page load
  if PublicKeyCredential.isConditionalMediationAvailable():
      GET /webauthn/options  → { challenge (≥16 random bytes, stored server-side, short TTL, single use), rpId, userVerification: "preferred" }
      navigator.credentials.get({ mediation: "conditional", publicKey })   ← pending, no UI yet
user focuses the email field
  browser autofill shows saved passkeys next to saved emails
    ├─ user picks a passkey → OS verifies (face/fingerprint/PIN) → promise resolves
    │      POST /webauthn/verify → server checks challenge, origin, rpIdHash, UP/UV flags, signature
    │      → rotate pre-auth session into a real session → redirect to ?next (validated) or home
    └─ user types an email instead → normal Continue flow (section 1); the pending get() is aborted
```

- Keep an explicit **"Sign in with a passkey"** button as well, for users who dismiss autofill or use a cross-device (QR) passkey.
- If the server receives an unknown credential ID (a deleted passkey), tell the credential manager through the WebAuthn Signal API where supported, and show "That passkey isn't linked to an account anymore. Use another way to sign in."

## 3. Flow: email code

```
POST /auth/continue (new or passwordless)
  → generate code: 8 digits (or 6–8 chars from an unambiguous alphabet), CSPRNG
  → store hash + user/email binding + expiry (≤ 10 min for sign-in) + attempt counter
  → enqueue email (async, so response time does not reveal anything)
Step 2 screen: one code field, autofocus, "Sent to ada@example.com · Change"
  POST /auth/verify-code
    ├─ ok → consume atomically (delete in the same transaction) → session
    ├─ wrong → count attempt; after ~5 wrong tries invalidate the code: "Request a new code"
    └─ expired → "That code has expired. [Send a new code]"
Resend: available after 30 s; issues a NEW code (old one invalid); per-address and per-IP send limits
```

## 4. Flow: password reset

```
"Forgot password?" → /reset  (email prefilled from step 1 if known)
  POST /reset
    → same response, status, and timing whether or not the account exists
    → enqueue email with link https://app.example.com/reset/<token>   (base URL from config, never Host header)
       token ≥112 bits, store SHA-256 hash, expires ~1 h, single use, bound to user + email
    → per-account and per-IP send limits; the account itself is NOT changed or locked
Screen: "If an account exists for ada@example.com, we've sent a reset link…" [Resend] · [Use a different email]

GET /reset/<token>            (Referrer-Policy: no-referrer; token NOT consumed on GET)
  ├─ invalid/expired → "This link has expired or was already used. [Send a new link]"
  ├─ MFA enabled → require second factor or recovery code FIRST
  └─ new-password form (autocomplete="new-password", same rules and blocklist as sign-up)
POST /reset/<token>
  → atomically consume token → hash + store password → mark email verified
  → revoke ALL sessions, remembered-device tokens, and refresh tokens
  → email "Your password was changed" (no secrets; "Not you? Secure your account")
  → sign in this device only if MFA was passed or the flow is bound to the same pre-auth session;
    otherwise go to sign-in with the email prefilled
```

## 5. Flow: MFA challenge and step-up

```
primary factor OK → if MFA enrolled (and device not remembered):
   Challenge screen: default factor first (passkey > TOTP > SMS)
     links: "Use a passkey or security key" · "Use a recovery code" · "Can't use any of these?"
     ├─ ok → rotate session → continue
     ├─ fail → throttle per account; after repeated failures notify the user (password is likely stolen)
     └─ "Can't use any of these?" → recovery flow (recovery code, second passkey, support with identity checks)

Step-up (sudo mode) before: change email/password/MFA/passkeys, view API keys, delete account, payouts
   session.lastVerifiedAt older than ~10–15 min?
     → modal/page "Confirm it's you" → passkey, or password, or MFA code
     → bind the verification to THIS action (short-lived action token), then perform it
```

## 6. Flow: change email

```
Settings → Email → [Change]
  → step-up re-auth
  → enter new email → store as PENDING (current email keeps working)
  → code or link to the NEW address; notification to the OLD address with "This wasn't me" (freezes the change)
  → on verification: swap, invalidate outstanding reset/verification tokens for the old address,
    rotate session, notify both addresses
```

## 7. Screen layouts

Widths below are for a 360–420px column; on desktop, center a ~400px card with the product logo above. No carousel, marketing panel, or promotions inside the form column; a split layout with a product visual on wide screens is fine if the form stays first in reading order.

Layout rules that hold across design systems (IBM Carbon's login pattern states them explicitly):
- **Put the path most users take first.** In consumer apps where most people pick Google or Apple, provider buttons can lead (as in the sketch below). In B2B, or when email or SSO is the main path, put the email field and its Continue button first and the alternatives below. Never place alternative-login buttons *between* the field and its primary button.
- **Keep every auth action inside the form region.** In a split layout, "Create account", "Use SSO", and help links belong in the form column; Carbon reports from testing that users do not look for them in the marketing side and miss them there.
- **Keep the geometry stable between steps.** When the password (or code) step replaces the identifier step, keep the same width, margins, and button position so nothing jumps.
- **After an inactivity sign-out, return to the page the user was on** once they sign in again (a validated, same-origin `returnTo`). After a voluntary sign-out, confirm it and land on the sign-in page.
- **On a server-side error, keep the identifier, clear the password, and move focus to the error summary or the first field to fix.** Use the same wording for "no such account" and "wrong password" in generic mode.
- **Use landmarks** so keyboard and screen-reader users can jump straight to the form, especially in split layouts.
- **Email field (GOV.UK pattern):** wide enough to show about 30 characters, `maxlength="254"`, `type="email"`, `spellcheck="false"`, `autocomplete="email"` (or `username` on sign-in). Don't make people type it twice; echo it back ("We sent a code to ada@…") with a way to change it, and warn, without blocking, on likely domain typos such as `hotmail.con`.

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ [logo]                          │   │ ← Back                          │
│ Sign in or create an account    │   │ Enter your password             │
│                                 │   │ ada@example.com · Change        │
│ [ G  Continue with Google     ] │   │                                 │
│ [   Continue with Apple      ] │   │ Password                        │
│ ─────────── or ───────────      │   │ [•••••••••••••••••••]  [Show]   │
│ Email                           │   │                                 │
│ [ada@example.com            ]   │   │ [ Sign in                     ] │
│ ↑ passkey autofill appears here │   │ Forgot password?                │
│ [ Continue                    ] │   │ Email me a code instead         │
│ Sign in with a passkey          │   │                                 │
│ By continuing you agree to the  │   └─────────────────────────────────┘
│ Terms and Privacy Policy.       │
└─────────────────────────────────┘

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ ← Back                          │   │ Check your email                │
│ Check your email for a code     │   │ If an account exists for        │
│ Sent to ada@example.com · Change│   │ ada@example.com, we've sent a   │
│                                 │   │ reset link. It expires in 1 h.  │
│ Code                            │   │ Not there? Check spam.          │
│ [ 1234 5678                 ]   │   │ [ Resend link ] (in 30 s)       │
│ Expires in 10 minutes.          │   │ Use a different email           │
│ [ Continue                    ] │   └─────────────────────────────────┘
│ Resend code (in 28 s)           │
└─────────────────────────────────┘

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ Two-step verification           │   │ Sign in faster next time        │
│ Enter the 6-digit code from     │   │ Create a passkey to sign in     │
│ your authenticator app.         │   │ with your face, fingerprint, or │
│ [ ______ ]                      │   │ screen lock. Anyone who can     │
│ [ ] Don't ask again on this     │   │ unlock this device can use it.  │
│     device for 30 days          │   │ [ Create a passkey            ] │
│ [ Verify                      ] │   │ Not now                         │
│ Use a passkey or security key   │   └─────────────────────────────────┘
│ Use a recovery code             │
│ Can't use any of these?         │
└─────────────────────────────────┘

Security settings
┌──────────────────────────────────────────────────────────┐
│ Passkeys        iCloud Keychain · added 2 Sep · used today   [Rename] [Remove] │
│                 [ Add a passkey ]                                             │
│ Password        Last changed 12 Mar          [Change]                          │
│ Two-step        Authenticator app · on       [Manage] · Recovery codes: 8 left │
│ Where you're signed in                                                          │
│   Chrome on macOS · Lisbon, PT · Active now · This device                      │
│   Safari on iPhone · Porto, PT · 2 days ago              [Sign out]            │
│   [ Sign out of all other devices ]                                             │
└──────────────────────────────────────────────────────────┘
```

Layout rules:
- Provider buttons: same width and height, same verb ("Continue with …"), consistent order; last-used method first or badged.
- Primary button full width on mobile; secondary actions are text links below, never a second filled button.
- Step 2 always shows the identifier with "Change"; never make users retype it.
- Legal line under the primary button, not a required checkbox unless counsel requires one.

## 8. HTML

```html
<!-- Step 1: identifier (also hosts passkey autofill) -->
<form method="post" action="/auth/continue" novalidate>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" inputmode="email"
         autocomplete="username webauthn" autocapitalize="none" spellcheck="false"
         required maxlength="254" aria-describedby="email-error">
  <p id="email-error" role="alert" hidden></p>
  <button type="submit">Continue</button>
  <button type="button" id="passkey-button">Sign in with a passkey</button>
</form>

<!-- Sign-in password step -->
<form method="post" action="/auth/password">
  <input type="email" name="username" autocomplete="username" value="ada@example.com" readonly>
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required>
  <button type="button" aria-controls="password" aria-pressed="false">Show</button>
  <button type="submit">Sign in</button>
</form>

<!-- Sign-up / reset: new password -->
<form method="post" action="/auth/set-password">
  <input type="email" name="username" autocomplete="username" value="ada@example.com" readonly hidden>
  <label for="new-password">Create a password</label>
  <input id="new-password" name="password" type="password" autocomplete="new-password"
         minlength="15" maxlength="128" required aria-describedby="pw-hint pw-error">
  <button type="button" aria-controls="new-password" aria-pressed="false">Show</button>
  <p id="pw-hint">At least 15 characters. A few random words work well, or let your password manager create one.</p>
  <p id="pw-error" role="alert" hidden></p>
  <button type="submit">Create account</button>
</form>

<!-- One-time code: ONE field -->
<form method="post" action="/auth/verify-code">
  <label for="code">Code</label>
  <input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
         pattern="[0-9 ]*" maxlength="9" required aria-describedby="code-hint">
  <p id="code-hint">Sent to ada@example.com. Expires in 10 minutes.</p>
  <button type="submit">Continue</button>
</form>
```

Notes:
- `webauthn` is valid only as the last autocomplete token, after `username` or `current-password`.
- The username field in password forms lets password managers save the right account; `readonly` keeps it visible, `hidden` is fine on sign-up.
- Strip spaces from codes server-side, so "1234 5678" pasted from an email works.
- `novalidate` plus your own inline errors avoids native bubbles that screen readers announce poorly; keep server validation authoritative either way.
- The show toggle flips `type` between `password` and `text`, updates `aria-pressed`, and keeps focus and caret; it never clears the value.

## 9. Conditional UI JavaScript

```js
// Run on the sign-in page load. Uses the browser WebAuthn API directly; a helper library
// (e.g., SimpleWebAuthn browser) can replace the base64url plumbing.
async function startPasskeyAutofill() {
  if (!window.PublicKeyCredential?.isConditionalMediationAvailable) return;
  if (!(await PublicKeyCredential.isConditionalMediationAvailable())) return;

  const options = await fetch("/webauthn/options", { method: "POST" }).then(r => r.json());
  const abort = new AbortController();
  window.passkeyAbort = abort; // abort if the user clicks the explicit passkey button instead

  try {
    const cred = await navigator.credentials.get({
      mediation: "conditional",
      signal: abort.signal,
      publicKey: {
        challenge: b64urlToBytes(options.challenge),
        rpId: options.rpId,
        userVerification: "preferred",
        allowCredentials: [], // empty: discoverable credentials only
      },
    });
    const res = await fetch("/webauthn/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializeAssertion(cred)),
    });
    if (res.ok) location.assign((await res.json()).redirectTo); // server-validated path
    else showError("That passkey didn't work. Try again or use another way to sign in.");
  } catch (err) {
    if (err.name !== "AbortError") console.warn("passkey autofill ended", err.name);
  }
}
```

Server side, the verify endpoint checks: type `webauthn.get`, challenge matches and is deleted, origin equals your origin, rpIdHash matches, user-present flag set, user-verified flag set if your policy requires it, signature valid against the stored public key. Use a WebAuthn server library; do not parse CBOR/COSE yourself.

## 10. Screen states checklist

Every auth screen has: default · field error (inline, announced, focus moved) · submitting (button disabled with spinner, label kept) · throttled (wait time + alternative path) · network error (retry without losing input) · success (where the user lands). Add for code screens: expired · resend cooldown. For passkeys: cancelled ("Passkey sign-in was cancelled. Try again or use another way") · not supported (hide passkey UI, no error).

## Sources

- GOV.UK Design System, Email addresses and Passwords patterns: https://design-system.service.gov.uk/patterns/email-addresses/ ; https://design-system.service.gov.uk/patterns/passwords/
- IBM Carbon, Login pattern (progressive/identifier-first login, error handling, alternate-login placement, split-screen testing): https://carbondesignsystem.com/patterns/login-pattern/
- The Copenhagen Book (MIT) — email verification, password reset, WebAuthn, open redirect: https://thecopenhagenbook.com/ · https://github.com/pilcrowonpaper/copenhagen
- The Auth Book by the same author (ideas only, no license) — email codes, passkeys, sessions: https://auth.pilcrowonpaper.com/
- passkeys.dev — bootstrapping (identifier-first, conditional UI), re-authentication, terms: https://passkeys.dev/docs/use-cases/bootstrapping/ · https://passkeys.dev/docs/use-cases/reauth/
- OWASP Forgot Password and Authentication Cheat Sheets: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html · https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- WHATWG HTML autofill tokens: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
- WCAG 2.2 Understanding SC 3.3.8: https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html
- Magic links consumed by link scanners: https://github.com/supabase/auth/issues/1214 · https://github.com/supabase/auth/issues/368
- Apple App Review Guidelines 5.1.1(v): https://developer.apple.com/app-store/review/guidelines/
