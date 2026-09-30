# Permissions, Notifications, and Onboarding

Flows, copy, and platform rules for asking people for access and getting them to first value. As of 2026-09 (iOS 26–27, Android 16–17). These are also ethics rules: nothing here may trick, pressure, or nag.

## Contents
- Permission request rules (catalog)
- Permission planning table
- Platform mechanics
- Notification opt-in
- Onboarding and accounts
- Copy patterns
- Sources

## Permission request rules

### Ask at the moment of need
**Rule.** Trigger the system prompt from the feature that needs it (tap "Scan" → camera prompt), not at launch or in an onboarding sequence.
**Apply when.** Any runtime permission: camera, microphone, location, contacts, calendar, photos (full library), Bluetooth/nearby devices, local network, notifications, tracking.
**Do / Avoid.** Do: request location when the user taps "Find stores near me". Avoid: five prompts in a row on first launch.
**Why.** Context answers "why does this app want that?" before the user has to guess; launch prompts are denied at high rates and a denial is costly to reverse. Exception: the app literally cannot function without it (a navigation app needs location), and even then explain first.

### Prefer permission-free system pickers
**Rule.** Use the system photo picker, contacts picker, document picker, location button, and share sheet instead of broad access.
**Apply when.** The feature needs a few user-chosen items, not continuous access.
**Do / Avoid.** Do: `PhotosPicker` (iOS) / Android Photo Picker to attach an image; Android 17's Contacts Picker instead of `READ_CONTACTS`; system device pickers instead of `ACCESS_LOCAL_NETWORK`. Avoid: requesting full photo-library access to upload one avatar.
**Why.** No prompt means no denial; least privilege also reduces review and data-safety scrutiny.

### iOS: pre-permission screens have one button
**Rule.** If you show a custom screen before an iOS system permission alert, it has exactly one button, labelled "Continue" or "Next", which opens the system alert. No close, cancel, "Not now", or skip that avoids the alert (unless legally required consent needs another action).
**Apply when.** Any custom explainer before camera, microphone, location, contacts, calendar, tracking, and similar protected-resource alerts on Apple platforms.
**Do / Avoid.** Do: a short screen "Scan receipts in one tap — the camera reads totals so you don't type them" + [Continue]. Avoid: [Allow camera] / [Maybe later]; incentives ("Allow to get 100 coins"); images of a fake alert or arrows pointing at "Allow".
**Why.** Apple's HIG treats extra buttons and "Allow"-titled buttons as manipulation; misleading pre-alert screens lead to App Store rejection. The user's real choice happens in the system alert.

### Android: show a rationale when the system says so
**Rule.** Call `shouldShowRequestPermissionRationale()`; when true, explain the benefit and what happens without it before requesting again. A rationale may include "Not now".
**Apply when.** Any Android runtime permission, including `POST_NOTIFICATIONS` on Android 13+.
**Do / Avoid.** Do: an inline card "Turn on delivery alerts to know when your driver arrives" with [Turn on] [Not now]. Avoid: re-requesting on every screen; asking again after the user chose "Don't allow" twice.
**Why.** After repeated denials Android stops showing the dialog; further calls fail silently, so the only path left is app settings.

### Make "denied" a designed state
**Rule.** When access is denied, keep the rest of the app working, say what is limited, and offer a settings deep link at the moment the user retries the feature.
**Apply when.** Every permission in the plan.
**Do / Avoid.** Do: an empty state in the camera tab — "Camera access is off. Turn it on in Settings to scan receipts." [Open Settings] (iOS `UIApplication.openSettingsURLString`; Android `Settings.ACTION_APPLICATION_DETAILS_SETTINGS`). Avoid: a blocking modal on every launch; hiding the feature entirely.
**Why.** Respecting "no" preserves trust (humane design); a contextual path back converts users who change their mind.

### Request the smallest scope
**Rule.** Ask for when-in-use before always location; accept approximate location where it is enough; ask for limited photo access or a picker before full library.
**Apply when.** Location, photos, health data (granular on Android 16+), background access.
**Do / Avoid.** Do: upgrade to background location only when the user enables a geofenced reminder. Avoid: requesting "always" on first use.
**Why.** Both platforms show broader scopes with stronger warnings and reviewers scrutinize them.

### Write purpose strings that name the benefit and the data
**Rule.** One plain sentence: what the app does with the data, with a concrete example.
**Apply when.** iOS `NS…UsageDescription` strings (required; App Review 5.1.1) and Android rationale UI.
**Do / Avoid.** Do: "Your location is used to show pickup points within 2 km." Avoid: "This app needs your location to function properly."
**Why.** Vague strings get rejected on iOS and denied by users everywhere.

## Permission planning table

Fill this in before designing screens:

| Permission | Feature that triggers it | Moment asked | Pre-prompt? (iOS: one "Continue" button) | Denied fallback | Settings re-entry point |
|---|---|---|---|---|---|
| Camera | Scan receipt | Tap "Scan" | Optional explainer | Manual entry form | Camera tab empty state |
| Notifications | Order updates | After first order placed | Inline card | Order status in app + email | Settings → Notifications |
| Location (when in use) | Nearby stores | Tap "Near me" | None (context is obvious) | Search by city/ZIP | Store finder header |

## Platform mechanics

| Topic | iOS | Android |
|---|---|---|
| How many times can you ask | The system alert appears once per permission; afterwards only Settings can change it | Can re-ask; after repeated denials the dialog is suppressed |
| Pre-prompt | Allowed; one button ("Continue"/"Next"), must lead to the alert | Rationale UI allowed; may include "Not now" |
| Deep link to settings | `UIApplication.openSettingsURLString` | `Settings.ACTION_APPLICATION_DETAILS_SETTINGS` (per-app), `ACTION_APP_NOTIFICATION_SETTINGS` |
| Photos | `PhotosPicker` needs no permission; limited library access exists | Photo Picker needs no permission |
| Contacts | `ContactAccessButton` / limited access (iOS 18+) | Contacts Picker (Android 17) |
| Local network | Local network privacy prompt | `ACCESS_LOCAL_NETWORK` required when targeting API 37 (or use system device pickers) |
| Tracking | App Tracking Transparency alert required before tracking | No ATT equivalent; Play data-safety disclosure |

## Notification opt-in

- **Moment:** after an action that makes the value obvious — "Notify me when it ships", "Remind me before the event", first message sent. Never on first launch.
- **iOS:** consider provisional authorization (quiet delivery to Notification Center, no prompt); the user later keeps or turns off notifications from the notification itself. Use interruption levels honestly: Passive, Active, Time Sensitive (breaks through Focus, only for truly time-bound events), Critical (entitlement required; safety only). Never use Time Sensitive for marketing.
- **Android:** `POST_NOTIFICATIONS` is a runtime permission on Android 13+; notifications are off for new installs until granted. Create notification channels by category (Orders, Messages, Promotions) so users can mute one kind without losing all.
- **Marketing:** explicit opt-in with clear consent language, plus an in-app way to opt out (App Review 4.5.4). Push must never be required for the app to work.
- **Content:** no sensitive personal data in notification text; generic text for hidden previews ("New message"); no duplicate notifications for the same event; no notifications that only say "open the app".
- **Behavior:** every notification deep-links to the relevant screen with a sensible back stack; badges count unread notifications only; offer an in-app notification settings screen with per-category toggles and quiet hours for high-volume apps.

## Onboarding and accounts

- **Value first.** Browse, try, or preview before sign-up whenever the product allows. Apple: if the app has no significant account-based features, it must be usable without login (5.1.1(v)).
- **Sign-in options.** Default order: passkeys and platform sign-in (Sign in with Apple; Google via Android Credential Manager), then email magic link or password. On iOS, third-party/social login for the primary account requires also offering an equivalent login that limits data to name and email, allows a private email, and does no ad tracking (4.8) — Sign in with Apple satisfies this.
- **Account deletion.** If users can create an account in the app, they must be able to start deletion in the app (Apple 5.1.1(v)); Google Play also requires an in-app and web deletion path. A mailto link is not enough.
- **First run.** One focal point, one clear next action. No three-slide carousel of benefits; show the product instead. Any intro is skippable and never repeats.
- **Progressive setup.** Defaults first; ask for preferences, profile details, and permissions when a feature needs them. Don't ask for data you can derive (country from locale, name from the sign-in provider).
- **Rating prompts.** Use the system in-app review API after a success moment; never gate features behind a rating and never pre-filter happy users to the store.
- **Launch screen.** Mirrors the first screen's layout (iOS HIG: no text, logo splash, or ads); Android 12+ uses the system `SplashScreen` API — keep it short and don't add a second custom splash.

## Copy patterns

| Situation | Good | Avoid |
|---|---|---|
| Pre-permission (iOS) | "Scan receipts in one tap. Next, iOS will ask for camera access." [Continue] | "Allow camera?" [Allow] [Later] |
| Rationale (Android) | "Get alerts when your driver is 5 minutes away." [Turn on] [Not now] | "Notifications are required." |
| Denied state | "Location is off, so we can't sort by distance. Search by city instead, or turn it on in Settings." | "Permission denied." |
| Notification opt-in | "Want a heads-up when your order ships?" [Notify me] | "Enable notifications to get the best experience!" |

Opt-out buttons use neutral wording ("Not now"), never confirmshaming ("No, I don't care about my orders").

## Sources

- Apple HIG — Privacy (pre-alert screens), Notifications, Onboarding, Launching, Managing accounts: https://developer.apple.com/design/human-interface-guidelines/privacy , https://developer.apple.com/design/human-interface-guidelines/notifications
- Apple App Review Guidelines (updated June 8, 2026): 4.5.4, 4.8, 5.1.1 — https://developer.apple.com/app-store/review/guidelines/
- Android — Request runtime permissions: https://developer.android.com/training/permissions/requesting ; Notification runtime permission: https://developer.android.com/develop/ui/compose/notifications/notification-permission
- Android 17 behavior changes (local network permission, SMS OTP protection): https://developer.android.com/about/versions/17/behavior-changes-17 ; Android 17 features (Contacts Picker): https://developer.android.com/about/versions/17/features
- Humane by Design — Respectful, Transparent: https://humanebydesign.com/principles
- Deceptive patterns taxonomy (nagging, confirmshaming): https://www.deceptive.design
