# Auth Copy Library

Ready-to-use copy for every authentication moment, in two modes. **Specific mode** is for products where membership is not secret (most SaaS, marketplaces, social apps). **Generic mode** is for products where being a member is itself sensitive (health, dating, finance, legal, adult); it never reveals whether an account exists. Pick one mode and use it on sign-in, sign-up, and reset alike. Replace "Example" and addresses with real values; keep verbs consistent across buttons.

## Contents
1. Tone rules and error anatomy
2. Entry and sign-in
3. Sign-up and verification
4. Codes and links
5. Password reset
6. Throttling and blocked states
7. Passkeys
8. MFA and recovery
9. Sessions and step-up
10. Social and SSO
11. Emails and notifications

## 1. Tone rules and error anatomy

- Every message answers: **what happened, why (if useful), what to do next**. Offer a path, not a dead end.
- No blame ("You entered an invalid…"), no internals ("user not found", "SQLSTATE", "401"), no jokes on errors.
- Put the error next to the field, in plain words, and keep what the user typed.
- Same verbs everywhere: "Continue" for the unified step, "Sign in" for credentials, "Create account" at the end of sign-up. Don't mix "Log in", "Login", and "Sign in" in one product.
- Show the identifier the user entered ("Sent to **ada@example.com**"), with a way to change it.
- Times are concrete: "in 5 minutes", "expires in 10 minutes", not "shortly".

## 2. Entry and sign-in

| Moment | Specific mode | Generic mode |
|---|---|---|
| Page title | "Sign in or create an account" | same |
| Primary button | "Continue" | same |
| Last-used hint | "You last signed in with Google" | same (shown only on this device) |
| Invalid email format | "Enter an email address like name@example.com." | same |
| Likely typo | "Did you mean **ada@gmail.com**?" [Use this] | same |
| No account | "There's no account for **ada@example.com**. [Create one] or [try another email]." | (never shown — the flow continues to "Check your email") |
| Wrong password | "Incorrect password. Try again or [reset it]." | "That email and password don't match. Try again or [reset your password]." |
| Empty password | "Enter your password." | same |
| Caps Lock on | "Caps Lock is on." | same |
| Signed out after idle | "You were signed out after 30 minutes of inactivity. Sign in to continue — we saved your draft." | same |

## 3. Sign-up and verification

| Moment | Copy |
|---|---|
| Password hint (before typing) | "Use at least 15 characters. A few random words work well, or let your password manager create one." |
| Too short | "Add a few more characters — at least 15." |
| Breached password | "This password has appeared in a data breach, so attackers try it first. Choose a different one." |
| Contains name/email/product | "Avoid your name, email, or 'Example' in your password — they're easy to guess." |
| Account exists (specific mode) | "**ada@example.com** already has an account. [Sign in] or [reset your password]." |
| Sign-up submitted (generic mode) | "Check your email. We sent a message to **ada@example.com** with the next step." |
| Legal line | "By continuing, you agree to the [Terms] and [Privacy Policy]." |
| Marketing opt-in (unticked) | "Send me product news and tips (about once a month)." |
| Verify-later banner | "Confirm your email to keep your account secure. We sent a code to **ada@example.com**. [Enter code] · [Resend]" |
| Gated action while unverified | "Confirm your email before inviting teammates. [Send code]" |
| Verified | "Email confirmed." (toast; no extra screen) |

## 4. Codes and links

| Moment | Copy |
|---|---|
| Code sent | "We sent a code to **ada@example.com**. It expires in 10 minutes." |
| Resend (cooldown) | "Resend code (in 28 s)" → "Resend code" |
| Resent | "New code sent. Use the latest email — older codes no longer work." |
| Wrong code | "That code isn't right. Check the latest email from us." |
| Too many wrong codes | "That code has been tried too many times. [Send a new code]" |
| Expired code | "That code has expired. [Send a new code]" |
| Not arriving | "Didn't get it? Check spam or promotions, or [use a different email]." |
| Magic link sent | "Check your email for a sign-in link. Open it on this device. [Send a code instead]" |
| Link landing page | "Sign in to Example as **ada@example.com**?" [Sign in] |
| Link opened on another device | "Were you signing in on Chrome on Windows? [Yes, sign in there] · [No, sign in here]" |
| Link expired/used | "This link has expired or was already used. [Send a new link]" |

## 5. Password reset

| Moment | Copy |
|---|---|
| Reset page | "Reset your password" · "Enter the email you use for Example." [Send reset link] |
| Requested (both modes) | "If an account exists for **ada@example.com**, we've sent a reset link. It expires in 1 hour. Not there? Check spam." [Resend] · [Use a different email] |
| MFA required before reset | "To protect your account, confirm it's you with your authenticator app or a recovery code." |
| New password | "Create a new password" · hint as in sign-up |
| Done | "Your password is updated and you've been signed out of other devices." |
| Link invalid | "This reset link has expired or was already used. [Send a new link]" |

## 6. Throttling and blocked states

| Moment | Copy |
|---|---|
| Throttled password | "Too many attempts. Wait 5 minutes, or [get a sign-in code by email]." |
| Throttled codes | "Too many codes requested. Try again in 10 minutes." |
| Bot challenge shown | "Quick check to keep bots out." (the challenge, plus an accessible alternative) |
| Suspended account (specific mode) | "This account is suspended. [Contact support] — include the email you sign in with." |
| Network failure | "We couldn't reach Example. Check your connection and try again." (input kept) |
| Unknown server error | "Something went wrong on our side. Try again in a moment." (log the detail, never show it) |

Never say "Your account is locked" in generic mode, and avoid hard locks altogether.

## 7. Passkeys

| Moment | Copy |
|---|---|
| Offer after sign-in | "Sign in faster next time" · "Create a passkey to sign in with your face, fingerprint, or screen lock — no password to remember." [Create a passkey] · [Not now] |
| Device disclosure | "Anyone who can unlock this device will be able to use this passkey." |
| After cross-device sign-in | "Use this device next time? You won't need your phone to sign in here." [Create a passkey] · [Not now] |
| Created | "Passkey saved to iCloud Keychain. You can manage passkeys in Settings → Security." |
| Cancelled | "Passkey sign-in was cancelled. [Try again] or [use another way]." |
| Unknown passkey | "That passkey isn't linked to an account anymore. Use another way to sign in." |
| Remove (confirm) | "Remove the 'Pixel 9' passkey? You won't be able to sign in with it anymore." [Remove passkey] · [Cancel] |

## 8. MFA and recovery

| Moment | Copy |
|---|---|
| Setup intro | "Add a second step to protect your account. Even if someone gets your password, they can't sign in without your phone or security key." |
| TOTP enroll | "Scan this code with your authenticator app, or enter this key: **JBSW Y3DP EHPK 3PXP**. Then enter the 6-digit code it shows." |
| Challenge | "Enter the 6-digit code from your authenticator app." · [Use a passkey or security key] · [Use a recovery code] · [Can't use any of these?] |
| Wrong TOTP | "That code didn't work. Codes change every 30 seconds — enter the current one." |
| Recovery codes | "Save these codes somewhere safe, like your password manager. Each code works once. You'll need one if you lose your phone." [Copy] [Download] [Print] · [I've saved my codes] |
| Recovery code used | "Recovery code accepted. You have 7 left. [Set up a new device]" |
| Can't use any factor | "We'll help you get back in. This takes longer because we need to confirm it's really you." [Start account recovery] |
| SMS risk note | "Text messages are less secure than an authenticator app or passkey. Use them only as a backup." |

## 9. Sessions and step-up

| Moment | Copy |
|---|---|
| Step-up | "For your security, confirm it's you to change your email." [Continue with passkey] · [Use password] |
| Idle warning | "You'll be signed out in 2 minutes because of inactivity." [Stay signed in] |
| Sign out others | "Sign out of all other devices? You'll stay signed in here." [Sign out others] |
| Session list item | "Safari on iPhone · Porto, Portugal · Active 2 days ago" [Sign out] |
| This device | "Chrome on macOS · This device" |
| Password change | "Sign out of other devices" (checkbox, pre-checked) |

## 10. Social and SSO

| Moment | Copy |
|---|---|
| Buttons | "Continue with Google" · "Continue with Apple" · "Continue with Microsoft" |
| Social-only account | "This account uses Sign in with Google." [Continue with Google] |
| Link existing account | "An account for **ada@example.com** already exists. Sign in with your password once to connect Google." |
| SSO required | "example.com uses single sign-on." [Continue with Okta] |
| SSO link for personal emails | "Sign in with SSO" → "Enter your work email or organization ID." |
| SSO error | "Your organization's sign-in didn't complete. Try again, or ask your IT admin to check your access to Example." |
| Deprovisioned | "Your organization removed your access to Example. Contact your admin if this is a mistake." |

## 11. Emails and notifications

**Sign-in code**
> Subject: Your Example sign-in code: 4829 1736
> Enter this code to sign in: **4829 1736**. It expires in 10 minutes.
> If you didn't try to sign in, you can ignore this email — no one can get in without this code.

**Generic-mode sign-up to an existing address**
> Subject: Sign in to Example
> Someone (hopefully you) tried to create an Example account with this email. You already have one. [Sign in] · [Reset your password]
> If this wasn't you, you can ignore this email.

**Password reset**
> Subject: Reset your Example password
> We got a request to reset the password for **ada@example.com**. [Reset password] — this link expires in 1 hour and works once.
> Didn't ask for this? Ignore this email; your password won't change.

**Password changed**
> Subject: Your Example password was changed
> Your password was changed on 30 Sep 2026 at 14:02 UTC from Chrome on Windows near Lisbon, Portugal. We signed out your other devices.
> Not you? [Secure your account] — we'll help you reset your password and review your devices.

**New sign-in**
> Subject: New sign-in to your Example account
> Chrome on Windows · near Lisbon, Portugal · 30 Sep 2026, 14:02 UTC
> If this was you, you can ignore this email. If not, [secure your account] — we'll sign out all devices and help you reset your password.

**Email change (to the old address)**
> Subject: Your Example email is changing
> We received a request to change your account email to **a***@newmail.com**. If this was you, no action is needed.
> Not you? [This wasn't me] — we'll stop the change and help you secure your account.

**MFA or passkey changed**
> Subject: Two-step verification was turned off
> Two-step verification was turned off for your Example account on 30 Sep 2026 at 14:02 UTC. Not you? [Secure your account]

Email rules: no passwords, no codes in "security alert" emails, links built from the configured base URL, a plain-text part, sender name that matches the product, and no tracking redirects on security links (they break scanners' trust and leak tokens).

## Sources

- OWASP Authentication and Forgot Password Cheat Sheets (generic-message guidance, paraphrased): https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html · https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- The Copenhagen Book (MIT) — when specific errors are acceptable: https://thecopenhagenbook.com/
- passkeys.dev — passkey upsell and cross-device prompts (reworded): https://passkeys.dev/docs/use-cases/bootstrapping/
- NIST SP 800-63B-4 — telling users why a password was rejected: https://pages.nist.gov/800-63-4/sp800-63b.html
- Better Auth `last-login-method` plugin (the "last signed in with" pattern): https://github.com/better-auth/better-auth/tree/main/docs/content/docs/plugins
