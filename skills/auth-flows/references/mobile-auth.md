# Mobile Authentication (iOS, Android, cross-platform)

How sign-in works in native and cross-platform apps: OAuth through the system browser, native credential APIs, Apple's login rules, token storage, biometrics, and account deletion. Status as of 2026-09; platform APIs move each year, so check current docs for exact signatures.

## Contents
1. Principles
2. OAuth, social, and SSO in apps
3. Native credential APIs
4. Apple rules: 4.8 login services and 5.1.1(v)
5. Sign-in buttons
6. Tokens on device
7. Biometrics: unlock, not authentication
8. Screens and flow on mobile
9. Rules catalog

## 1. Principles

- The app is a **public client**: anything in the binary (client secrets, API keys) is readable. The server authorizes; the app only carries tokens.
- Use the platform's credential surfaces (autofill, passkeys, system sign-in sheets) before custom UI. They are faster, phishing-resistant, and already trusted by users.
- Delay sign-in until it is needed. Apple's HIG recommends letting people use the app first; Guideline 5.1.1(v) forbids forcing login when the app has no significant account-based features.

## 2. OAuth, social, and SSO in apps

- **System browser only.** iOS: `ASWebAuthenticationSession` (shares Safari state, supports passkeys). Android: Custom Tabs, or Auth Tab (`AuthTabIntent`, Chrome 137+, `androidx.browser` 1.9.0+) which falls back to Custom Tabs.
- **Never an embedded WebView** for a third-party IdP: the host app can read everything typed into it, users cannot see the real URL, passkeys work there only for the app's own linked domain, and Android WebView lacks direct WebAuthn.
- **Authorization code + PKCE** (`S256`), with `state` checked for presence and equality. No client secret in the app; no implicit or password grants. RFC 8252 (OAuth 2.0 for Native Apps) is the reference best practice.
- Register redirect URIs exactly; validate them on the authorization server.
- Your own backend should exchange the IdP result for **your** session or tokens; don't let the app call your API with a Google or Apple token as if it were your session.
- **Deep links** that carry codes or tokens (email codes, magic links) must open the app via Universal Links / App Links, so another app cannot claim them.

## 3. Native credential APIs

**Android — Credential Manager (Jetpack)** is the recommended API for passkeys, saved passwords, Sign in with Google, and digital credentials in one bottom sheet.
- Sign in with Google via Credential Manager: an automatic bottom sheet (dismissible; hidden when the device has no Google accounts) **plus** a persistent "Sign in with Google" button to restart the flow after dismissal.
- **Restore Credentials**: a restore key backed up with the device lets the user be signed in automatically after moving to a new phone; pair it with passkeys.
- Link the app and website with Digital Asset Links so passwords and passkeys are shared.

**iOS — AuthenticationServices**:
- Passkeys (platform public-key credential provider), Sign in with Apple, and password autofill via Associated Domains (`webcredentials:`), so web and app share credentials.
- iOS 26: passkey-backed **account creation** (`ASAuthorizationAccountCreationProvider`) and `ASCredentialUpdater` to tell password managers about renamed accounts, removed passkeys, or passwords that are no longer needed.
- Apple HIG, Managing accounts: if you don't use Sign in with Apple, prefer passkeys; name buttons after the method ("Sign In with Face ID"), don't mention Face ID on devices without it, don't add an in-app biometrics toggle (it's a system setting), and don't call your credential a "passcode".

**Cross-platform (React Native / Expo, Flutter, KMP)**: use wrappers over these same system APIs (system-browser auth sessions, platform passkey and credential APIs, platform secure storage). Avoid libraries that implement login inside a WebView or store tokens in plain key-value storage.

## 4. Apple rules: 4.8 login services and 5.1.1(v)

**Guideline 4.8.** An app that uses a third-party or social login service (Google, Facebook, X, LinkedIn, Amazon, WeChat, and similar) to set up or authenticate the **primary account** must also offer an equivalent login service that:
1. limits data collection to the user's name and email address;
2. lets users keep their email address private from you;
3. does not collect interactions with your app for advertising without consent.

Sign in with Apple meets these. Exceptions include apps that use only your company's own account system, education/enterprise/business apps that require existing organizational accounts, government or industry-backed citizen ID systems, and clients for a specific third-party service where users sign in to that service directly (e.g., a mail or social client). Read the current guideline text before submission.

**Guideline 5.1.1(v).**
- Don't require login for apps without significant account-based features.
- If the app supports account creation, it must let users **start account deletion inside the app** — deletion, not just deactivation. If deletion completes on the web, link directly to that page. Explain any subscription billing that continues (billing is managed by Apple).
- With Sign in with Apple, revoke the user's tokens when the account is deleted.

**Sign in with Apple data handling (HIG)**: don't ask for a password after the user chose Sign in with Apple; don't ask for a personal email if they chose a private relay address; offer account linking in settings, because relay addresses won't match an existing email account.

## 5. Sign-in buttons

- **Apple**: titles "Sign in with Apple", "Sign up with Apple", or "Continue with Apple"; black, white, or white with outline; minimum 140×30 pt with margins of at least a tenth of the button height; custom buttons use only Apple-provided logo artwork and are checked in App Review; **no smaller than other sign-in buttons** and visible without scrolling.
- **Google**: use the official Sign in with Google button (or Credential Manager's) or follow Google's current branding guidelines; don't recolor the logo.
- All providers: same size, same verb, consistent order; put the platform's own provider first (Apple on iOS, Google on Android) unless the last-used method should lead.

## 6. Tokens on device

- Store session or refresh tokens only in the **iOS Keychain** (an accessibility class that keeps the item on this device, not in backups to other devices) or **Android Keystore-backed** encrypted storage. Never in `UserDefaults`, plain `SharedPreferences`, AsyncStorage, files, or logs.
- **Access tokens short** (5–15 minutes). **Refresh tokens rotate on every use with reuse detection**: if an old refresh token is replayed, revoke the whole token family. Refresh tokens have an absolute expiry and the user can revoke them (device list).
- Public clients need sender-constrained refresh tokens (DPoP) or rotation (ASVS 10.4.5).
- For high-assurance sessions NIST says bearer secrets should not survive app restarts; consumer apps usually persist a refresh token and gate it behind a local biometric unlock instead.
- Third-party API keys never ship in the app; proxy through your backend. Device attestation (App Attest, Play Integrity) reduces abuse but is not authentication.

## 7. Biometrics: unlock, not authentication

| Pattern | Verdict |
|---|---|
| `if (biometricOK) { api.setAuthenticated(true) }` | **Broken.** A client-side boolean; bypassed on rooted or jailbroken devices or with instrumentation |
| Refresh token (or a signing key) stored in Keychain/Keystore with access control that requires biometric or device-credential authentication; the OS releases it only after a successful check | **Correct** local unlock of a real server credential |
| Passkey sign-in (biometric or PIN verified by the OS, server verifies a signature) | **Best**: possession + user verification, checked cryptographically by the server |

- Biometrics prove someone who can unlock the device is present; your server only trusts what it can verify.
- Fall back to the device passcode or your normal sign-in when biometrics fail or change; don't lock users out.
- ASVS L3 allows biometrics only as a secondary factor together with something the user has or knows.

## 8. Screens and flow on mobile

```
Launch → (value first where possible)
  Sign-in sheet or screen
   ├─ [Continue with Apple] / [Continue with Google]   ← system sheets (AuthenticationServices / Credential Manager)
   ├─ passkey via system sheet (auto-shown when the app has an associated domain and saved passkeys)
   └─ [Continue with email] → email field (keyboard type email, autofill) → code field (one-time-code autofill)
  → signed in → offer passkey (if not used) → onboarding
Return visits: biometric unlock of the stored refresh token → refresh → home
```

- Email field: email keyboard, no autocapitalize or autocorrect, content type set for username autofill (iOS `textContentType`, Android autofill hints), return key "Continue".
- Code field: one field with the platform one-time-code content type so codes from Messages/Mail can autofill; paste always works.
- Keep the primary button above the keyboard; don't let the keyboard cover the error message.
- Show which method the user signed in with last; support "Sign out" in settings, plus the device list and account deletion (5.1.1(v)).

## 9. Rules catalog

### Use the system browser for third-party sign-in
**Rule.** Run OAuth and SSO in `ASWebAuthenticationSession` or Custom Tabs / Auth Tab.
**Apply when.** Any IdP page that is not your own native UI.
**Do / Avoid.** Do use the platform auth session with PKCE. Avoid loading the IdP in a WebView "to keep users in the app".
**Why.** WebViews expose credentials to the host app, hide the address bar, and break passkeys and existing IdP sessions.

### Gate stored credentials with biometrics, never flags
**Rule.** Biometric success must release a secret from secure hardware, not set a variable.
**Apply when.** "Unlock with Face ID / fingerprint" features.
**Do / Avoid.** Do store the refresh token behind biometric access control. Avoid calling the API as "authenticated" after a local callback.
**Why.** Only a secret the server verifies proves anything; a boolean can be patched.

### Offer an equivalent private login on iOS
**Rule.** If iOS users can sign in with Google, Facebook, or similar for their main account, also offer Sign in with Apple (or another login meeting Guideline 4.8).
**Apply when.** Any iOS app with third-party login for the primary account, outside the listed exceptions.
**Do / Avoid.** Do show Apple's button at equal size. Avoid hiding it below the fold.
**Why.** App Review rejects apps that miss it, and the HIG sets the button rules.

## Sources

- Apple App Review Guidelines 4.8 and 5.1.1(v): https://developer.apple.com/app-store/review/guidelines/
- Apple HIG, Sign in with Apple: https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
- Apple HIG, Managing accounts: https://developer.apple.com/design/human-interface-guidelines/managing-accounts
- `ASWebAuthenticationSession`: https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession
- `ASAuthorizationAccountCreationProvider`: https://developer.apple.com/documentation/authenticationservices/asauthorizationaccountcreationprovider
- `ASCredentialUpdater`: https://developer.apple.com/documentation/authenticationservices/ascredentialupdater
- Android Credential Manager: https://developer.android.com/identity/sign-in/credential-manager
- Sign in with Google via Credential Manager: https://developer.android.com/identity/sign-in/credential-manager-siwg
- Restore Credentials: https://developer.android.com/identity/sign-in/restore-credentials
- passkeys.dev iOS and Android references: https://passkeys.dev/docs/reference/ios/ · https://passkeys.dev/docs/reference/android/
- OWASP ASVS 5.0.0 V10 OAuth and OIDC (refresh token rules): https://github.com/OWASP/ASVS/tree/master/5.0/en
- NIST SP 800-63B-4 (session bindings, biometrics): https://pages.nist.gov/800-63-4/sp800-63b.html
- RFC 8252, OAuth 2.0 for Native Apps: https://www.rfc-editor.org/rfc/rfc8252
