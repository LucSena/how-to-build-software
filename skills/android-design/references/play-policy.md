# Google Play Policy Pitfalls for Designers and Developers

Play requirements that change what you design or build. Target API dates and Android behavior changes were checked on developer.android.com (2026-09); broader policy summaries reflect the Play Policy Center as generally understood in 2026 — Play policies change often, so re-check the Policy Center before a release. This is a design checklist, not legal advice.

## Contents
- Target API and platform deadlines
- Rules catalog
- Sensitive permissions quick table
- Quality signals (Android vitals)
- Pre-release checklist
- Sources

## Target API and platform deadlines

| Requirement | Value |
|---|---|
| New apps and updates (phone/tablet) | Must target **API 36 (Android 16)** since **2026-08-31**; extension available to **2026-11-01** |
| Wear OS and Android Automotive OS | API 35+ |
| Android TV and Android XR | API 34+ |
| Existing apps | Must target API 35+ to stay available to new users on devices running newer Android versions |
| Exceptions | Permanently private apps for internal distribution only |

What targeting API 36 turns on (design-relevant): edge-to-edge with no opt-out; predictive back by default (`onBackPressed` not called); orientation/resizability locks ignored on ≥ 600 dp displays (opt-out available until you target 37); `elegantTextHeight` opt-out disabled.

What targeting API 37 (Android 17) adds: large-screen opt-out removed; `ACCESS_LOCAL_NETWORK` runtime permission for LAN access (or use system device pickers); standard OTP SMS delayed ~3 hours for most apps; certificate transparency on by default; per-app Keystore key limits; widget RemoteViews bitmap memory cap.

## Rules catalog

### Target the required API before the deadline
**Rule.** Plan the targetSdk bump as design work: edge-to-edge, predictive back, and large-screen changes are visible to users.
**Apply when.** Each yearly Play deadline (late August).
**Do / Avoid.** Do: bump targetSdk early in a branch, run the adaptive testing matrix, fix insets and back handling. Avoid: requesting an extension every year; opt-out flags as a permanent fix.
**Why.** Updates are blocked after the deadline; opt-outs disappear one API level later.

### Request sensitive permissions only with a declared core use
**Rule.** Restricted permissions (SMS, call log, background location, all-files access, broad photo/video access, exact alarms, package visibility) need a core-feature justification and a Play Console declaration; most apps should use a picker or narrower API instead.
**Apply when.** Any permission beyond camera/mic/location-in-use/notifications.
**Do / Avoid.** Do: Photo Picker instead of `READ_MEDIA_IMAGES`; SMS Retriever instead of `READ_SMS`; Contacts Picker (Android 17) instead of `READ_CONTACTS`; system device pickers instead of `ACCESS_LOCAL_NETWORK`. Avoid: requesting background location "for analytics".
**Why.** Undeclared or unjustified sensitive permissions are a leading cause of rejections and removals; least privilege also improves grant rates.

### Show a prominent disclosure before collecting sensitive data
**Rule.** When the app collects personal or sensitive data in a way users might not expect (e.g. background location, contacts upload), show an in-app disclosure describing the data and its use, followed by a consent action, before the runtime permission.
**Apply when.** Background location, contacts or SMS processing, accessibility-service use, installed-apps inventory.
**Do / Avoid.** Do: a dedicated screen in normal app flow, with plain language and an explicit consent button. Avoid: burying it in the privacy policy or terms.
**Why.** Play's user-data policy requires it; it is also the humane default.

### Keep the Data safety section truthful
**Rule.** The Data safety form lists all data collected and shared, including by SDKs, with purposes and whether it is encrypted in transit and deletable.
**Apply when.** Every release that adds an SDK, analytics event, or data field.
**Why.** Mismatches between declared and observed behavior lead to enforcement; users read it before installing.

### Offer account deletion in the app and on the web
**Rule.** If users can create an account in your app, they must be able to request deletion of the account and associated data from within the app and via a web link you provide in Play Console.
**Apply when.** Any app with sign-up.
**Do / Avoid.** Do: Settings → Account → Delete account, plus a web page for users who uninstalled. Avoid: "contact support"; deactivation labelled as deletion.
**Why.** Play requirement (and Apple's 5.1.1(v)); trust.

### Use Play Billing for digital goods; make subscriptions honest
**Rule.** Digital goods and subscriptions consumed in the app use Google Play Billing (except where regional alternative/user-choice billing programs apply); physical goods and real-world services use other payment methods. Subscription offers state price, billing period, trial length and what it converts to, and how to cancel.
**Apply when.** Paywalls, upgrade prompts, trials.
**Do / Avoid.** Do: show the renewal price as prominently as the trial; link to Play's subscription management for cancellation. Avoid: hidden close buttons, pre-selected most-expensive plans with unclear pricing, fake discounts or countdowns.
**Why.** Play's subscriptions and payments policies target misleading offers; the ethics floor forbids them regardless.

### Don't download executable code
**Rule.** Updates to native code (dex, JAR, `.so`) come only through Play. Interpreted code (JavaScript in React Native, WebView content) may be updated over the air, but it must not enable policy violations.
**Apply when.** OTA update systems (Expo EAS Update, CodePush-style tools), plugin systems.
**Why.** Device and Network Abuse policy; see `mobile-architecture` for OTA release rules.

### Declare foreground service types and use background work correctly
**Rule.** Foreground services declare a type matching their real use (location, media playback, data sync…) and show a visible notification; deferrable work uses WorkManager instead.
**Apply when.** Uploads, music, navigation, sync.
**Why.** Undeclared or mismatched foreground service use is rejected; background limits kill misbehaving work.

### Notifications: ask in context, categorize, don't spam
**Rule.** Request `POST_NOTIFICATIONS` (Android 13+) in context; create notification channels per category; Live Updates (Android 16+ progress-style notifications) only for ongoing, user-initiated, time-sensitive tasks (navigation, rides, deliveries, calls) — never ads, promos, chat, or upcoming events.
**Why.** Users mute noisy apps; Live Updates have explicit eligibility rules.

### Families and ads
**Rule.** Apps targeting children follow the Families policy (certified ad SDKs, no precise location, restricted data collection); ads never mimic system UI or appear where they block core use.
**Why.** High-enforcement areas.

## Sensitive permissions quick table

| Permission / capability | Prefer instead | If truly needed |
|---|---|---|
| `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` | Photo Picker (no permission) | Only for apps whose core purpose needs broad media access; declaration |
| `READ_SMS` / `RECEIVE_SMS` | SMS Retriever / SMS User Consent | Default SMS handler or approved exception; declaration |
| `READ_CALL_LOG` | — | Default dialer/assistant; declaration |
| `ACCESS_BACKGROUND_LOCATION` | Foreground location while in use; geofencing APIs | Prominent disclosure + declaration + video demo of the feature |
| `MANAGE_EXTERNAL_STORAGE` | Storage Access Framework, MediaStore | File managers, backup, antivirus; declaration |
| `QUERY_ALL_PACKAGES` | `<queries>` for specific packages/intents | Declaration of core need |
| `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` | WorkManager, inexact alarms | Alarm clock / calendar core use |
| `READ_CONTACTS` | Contacts Picker (Android 17) | Core social/communication features, prominent disclosure |
| `ACCESS_LOCAL_NETWORK` (target 37) | System device pickers (companion device, media route) | Smart-home / casting apps |

## Quality signals (Android vitals)

| Metric | Bad-behavior threshold (overall / per phone model) |
|---|---|
| User-perceived crash rate | 1.09% / 8% |
| User-perceived ANR rate | 0.47% / 8% |
| Excessive partial wake locks | 5% |

Exceeding them can reduce the app's visibility on Play and show warnings to users. Track them per release in Play Console and fail staged rollouts that regress them (see `mobile-architecture` release guidance).

## Pre-release checklist

- [ ] targetSdk meets the current deadline (36 since 2026-08-31); tested edge-to-edge, predictive back, large-screen resizing
- [ ] Every sensitive permission has a core use, a declaration, and a picker alternative considered
- [ ] Prominent disclosure before unexpected sensitive-data collection
- [ ] Data safety form matches the build (including SDKs); privacy policy linked in-app and in Play Console
- [ ] In-app and web account deletion
- [ ] Paywall shows price, period, trial terms, and cancellation path; Play Billing for digital goods
- [ ] Notification channels; `POST_NOTIFICATIONS` requested in context; Live Updates only for eligible tasks
- [ ] Foreground service types declared; background work in WorkManager
- [ ] No native code downloaded outside Play; OTA limited to interpreted code within policy
- [ ] Crash and ANR rates below vitals thresholds in pre-launch and staged rollout

## Sources

- Meet Google Play's target API level requirement (last updated 2026-09-16): https://developer.android.com/google/play/requirements/target-sdk
- Android 16 behavior changes: https://developer.android.com/about/versions/16/behavior-changes-16
- Android 17 behavior changes (apps targeting 37 / all apps): https://developer.android.com/about/versions/17/behavior-changes-17 , https://developer.android.com/about/versions/17/behavior-changes-all
- Android vitals: https://developer.android.com/google/play/vitals
- Live Updates guidance: https://developer.android.com/develop/ui/views/notifications/live-update
- Notification runtime permission: https://developer.android.com/develop/ui/compose/notifications/notification-permission
- Google Play Policy Center (user data, permissions, payments, subscriptions, device and network abuse, families): https://play.google/developer-content-policy/
- Google Play Device and Network Abuse policy excerpt on interpreted code (as quoted in Expo's FAQ): https://docs.expo.dev/faq/
