# App Store Review — Design Pitfalls

The App Review Guidelines rules that change what you design, with the fix for each. Based on the guidelines "Last Updated June 8, 2026" and Apple's Upcoming Requirements page (checked 2026-09). Guidelines change several times a year — re-check the live page before a submission; this is a design checklist, not legal advice.

## Contents
- Submission requirements (dates)
- Rules catalog
- Payments and subscriptions
- Pre-submission checklist
- Sources

## Submission requirements (dates)

| Requirement | Since |
|---|---|
| Uploads built with Xcode 26+ and the iOS/iPadOS 26 SDK | 2026-04-28 |
| iOS/iPadOS apps must target iOS 13 or later | 2026-09-09 |
| Updated age-rating questionnaire answers | 2026-01-31 |
| Privacy manifest "approved reasons" for listed APIs (including third-party SDKs) | 2024-05-01 |

Expect the next SDK bump (iOS 27 SDK) in spring 2027; the `UIDesignRequiresCompatibility` Liquid Glass opt-out is ignored once you build with it.

## Rules catalog

### Be more than a repackaged website — 4.2 Minimum Functionality
**Rule.** Deliver app-like value: native navigation, offline behavior, device capabilities, or features beyond the website.
**Apply when.** WebView-based apps, content catalogs, link collections, template-generated apps.
**Do / Avoid.** Do: native tab bar and stacks, cached content, widgets/notifications that add real value. Avoid: a WebView of the mobile site (4.2.2 "web clippings… collection of links"); template/app-generator submissions on behalf of clients (4.2.6).
**Why.** Push, location, or sharing alone don't make an app; reviewers reject "repackaged website" experiences.

### Don't ship spam or duplicates — 4.3
**Rule.** One app per product; variants (cities, teams, schools) inside one app, not separate bundle IDs; no low-effort clones of saturated categories.
**Why.** Tightened in June 2026; repeated submissions risk the developer account.

### Offer Sign in with Apple (or equivalent) next to social login — 4.8
**Rule.** If a third-party or social login (Google, Facebook, X, LinkedIn, Amazon, WeChat…) sets up or authenticates the primary account, also offer an equivalent login that limits data to name and email, lets users hide their email, and doesn't collect interactions for ads without consent.
**Apply when.** Designing the sign-in screen.
**Do / Avoid.** Do: Sign in with Apple at equal prominence with other providers, using the system button. Avoid: burying it below the fold or restyling it.
**Why.** Not required only when you use exclusively your own account system (or specific marketplace cases).

### Don't force login; do support deletion — 5.1.1(v)
**Rule.** Apps without significant account-based features must work without login. If the app supports account creation, users must be able to initiate account deletion **in the app**.
**Apply when.** Onboarding, settings.
**Do / Avoid.** Do: Settings → Account → Delete Account, with a clear explanation of what happens and any confirmation step. Avoid: "email us to delete", a link only to a website form with no in-app entry point.
**Why.** Frequent rejection reason; also a humane-design baseline.

### Never require system features to use the app — 5.1.2(i)
**Rule.** Don't make push notifications, location, or tracking a condition for using features or receiving rewards.
**Do / Avoid.** Avoid: "Enable notifications to continue"; "Allow tracking to unlock a discount".
**Why.** Explicitly prohibited; also true for incentives on permission prompts.

### Get explicit consent before sharing data with third parties, including AI — 5.1.2(i)
**Rule.** Disclose where personal data goes — including third-party AI services — and get explicit permission before sending it.
**Apply when.** Features that send user content to an external LLM or analytics provider.
**Do / Avoid.** Do: a clear consent step naming the provider category and data sent, with an off switch. Avoid: silently sending photos or messages to a cloud model.
**Why.** Named explicitly in the 2026 guidelines.

### Minimize data access; prefer pickers — 5.1.1(iii)
**Rule.** Request only data relevant to core functionality; use out-of-process pickers and share sheets instead of full Photos/Contacts access.
**Why.** Reviewers challenge broad access; pickers also avoid prompts entirely.

### Write specific purpose strings — 5.1.1
**Rule.** Every `NS…UsageDescription` says what the data is used for, with an example; permission prompts appear in context.
**Do / Avoid.** Do: "Photos you choose are attached to your expense report." Avoid: "We need access to your photos."
**Why.** Vague strings are a common rejection; the HIG also limits pre-permission screens to one "Continue"/"Next" button with no way to skip the alert.

### Tracking requires App Tracking Transparency — 5.1.2(i)
**Rule.** Show the ATT system prompt before any tracking; pre-prompt screens must not mislead (no fake alerts, no incentives, no arrows).
**Why.** Misleading custom screens before system alerts lead to rejection (HIG Privacy).

### Push must be optional and not marketing by default — 4.5.4
**Rule.** The app works without push; promotional pushes require explicit opt-in via consent language in the app and an in-app opt-out; no sensitive personal data in pushes.

### Screenshots show the app in use — 2.3.3
**Rule.** App Store screenshots show real functionality, not only title art, a login page, or a splash screen. No references to other mobile platforms in metadata (2.3.10).

### Ship complete builds — 2.1
**Rule.** Final content (no placeholders), working URLs, a demo account or built-in demo mode for login-gated apps, the backend running during review, and in-app purchases visible and functional.

### Keep contact information valid — 1.5
**Rule.** A working Support URL with an easy way to contact you; a privacy policy link in App Store Connect and inside the app (5.1.1(i)).

### Run on iPad — 2.4.1
**Rule.** iPhone apps should run on iPad whenever possible; test iPad layouts, windows, and pointer input.

### Public APIs and no downloaded features — 2.5.1, 2.5.2
**Rule.** Use only public APIs; don't download code that introduces or changes features. Over-the-air updates of interpreted code (e.g. React Native JavaScript) are tolerated only when they don't change the app's primary purpose, create a storefront, or bypass OS security (Apple Developer Program License Agreement 3.3.1(B)); ship new features through review.

## Payments and subscriptions

| Topic | Rule (guideline) | Design implication |
|---|---|---|
| Unlocking digital features/content | In-app purchase required (3.1.1); no license keys, QR codes, or crypto to unlock | Paywall uses StoreKit products; include Restore Purchases |
| Links to other purchase methods | Allowed with entitlements in specific storefronts (3.1.1(a)); **United States storefront** apps may include buttons/links to other purchase methods without the entitlement | Check storefront-specific rules before adding "Buy on web" buttons |
| Reader apps | May link to account creation/management with the External Link Account Entitlement (3.1.3(a)) | Magazines, books, audio, music, video only |
| Physical goods / real-world services | Must *not* use IAP (3.1.3(e)) | Apple Pay or card entry |
| Person-to-person real-time services | May use other methods (3.1.3(d)) | One-to-few/one-to-many must use IAP |
| Auto-renewable subscriptions | Ongoing value; period ≥ 7 days; works across all the user's devices (3.1.2(a)) | Don't subscribe-gate one-off features |
| Subscription information | Before asking to subscribe, clearly describe what the user gets for the price (3.1.2(c)) | Paywall states price, period, what's included, trial length and what it converts to |
| Upgrades/downgrades | Seamless; users can't accidentally subscribe to multiple variants (3.1.2(b)) | One subscription group per product |
| No extra tasks | Users get what they paid for without posting on social media, uploading contacts, etc. (3.1.2(a)) | — |
| Moving to subscriptions | Don't take away functionality existing users already paid for (3.1.2(a)) | Grandfather prior purchasers |
| Scams | Bait-and-switch or misleading subscription flows are removed (3.1.2(a)) | No hidden close buttons, fake "free" labels, or pre-selected yearly plans with unclear pricing |
| Free trial (non-subscription) | Clearly state duration, what stops working, and downstream charges before the trial (3.1.1) | — |
| Loot boxes | Disclose odds before purchase (3.1.1) | — |
| Ratings | Don't require ratings/reviews to unlock features | Use the system review prompt after a success moment |

Ethics floor (applies beyond review): the close/decline control on a paywall is visible and neutral; cancellation instructions are easy to find; no fake countdowns or scarcity.

## Pre-submission checklist

- [ ] Native navigation; app is useful beyond a website (4.2)
- [ ] Sign in with Apple (or equivalent) offered if any social login exists (4.8)
- [ ] Usable without login where features allow; in-app account deletion (5.1.1(v))
- [ ] Every permission requested in context with a specific purpose string; no feature gated on push/location/tracking (5.1.1, 5.1.2)
- [ ] Third-party (incl. AI) data sharing disclosed with explicit consent (5.1.2(i))
- [ ] App Privacy "nutrition label" matches actual collection, including SDKs; privacy manifest present
- [ ] Paywall states price, period, contents, trial terms; Restore Purchases present (3.1.1, 3.1.2)
- [ ] Marketing push opt-in + in-app opt-out (4.5.4)
- [ ] Demo account/demo mode, working Support URL and privacy policy (2.1, 1.5)
- [ ] Screenshots show the app in use; no other platforms mentioned (2.3.3, 2.3.10)
- [ ] Runs on iPad; built with the required SDK; targets iOS 13+ (2.4.1, upcoming requirements)

## Sources

- App Review Guidelines (Last Updated June 8, 2026): https://developer.apple.com/app-store/review/guidelines/
- Apple Upcoming Requirements: https://developer.apple.com/news/upcoming-requirements/
- Apple Developer Program License Agreement, 3.3.1(B) Executable Code (as excerpted in Expo's FAQ): https://developer.apple.com/support/terms/apple-developer-program-license-agreement , https://docs.expo.dev/faq/
- Apple HIG Privacy (pre-alert screens): https://developer.apple.com/design/human-interface-guidelines/privacy
- `UIDesignRequiresCompatibility` documentation: https://developer.apple.com/documentation/bundleresources/information-property-list/uidesignrequirescompatibility
- MacRumors on the June 2026 guideline changes (secondary): https://www.macrumors.com/2026/06/09/app-store-guidelines-low-quality-apps/
