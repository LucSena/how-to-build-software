# Mobile onboarding (iOS and Android)

First launch on a phone: what to show, in which order, and when to ask for an account, permissions, notifications, and money. Permission API mechanics, purpose strings, and notification channels live in `mobile-design`; this file is about sequencing the first run.

## Contents
- The default order
- Launch and welcome
- Account timing
- Permissions: timing and priming
- Notification opt-in
- Paywall timing in subscription apps
- Resumability and re-entry
- Checklist

---

## The default order

```
Launch (mirrors first screen)
 → Welcome: outcome + real content preview · "I already have an account"
 → 0–3 goal questions (each changes the first session)
 → Quick win: first session / first result, no account needed if possible
 → Save progress: account (Apple / Google / passkey first)
 → [Subscription apps] paywall, closable, terms visible
 → Contextual permission, when a feature needs it
 → Notification opt-in, once there is something to remind about
 → Habit: home opens on "Continue"
```

Both platform guides put value first. Apple: onboarding should be fast, fun, and optional, and ideally the app is understandable without it. Android: split what must happen before using the app from what can happen while using it, and typically show the value before asking for permissions or an account.

Some growth playbooks list the mobile sequence as "permissions → quick win → push → habit". Follow the platforms instead: quick win first, permissions in context.

## Launch and welcome

- **Launch instantly.** The iOS launch screen is nearly identical to the first screen: no text (it cannot be localized), no logo unless the first screen has one, no ads (HIG Launching).
- A brief splash, if any, belongs at the start of onboarding, not in the launch screen.
- **Bundle enough content** that nobody waits for a download before the first interaction (HIG Onboarding).
- **One welcome screen** with a real content preview beats a feature carousel; if a walkthrough exists, "Skip" and "Log in" stay visible on every screen (Android).
- **No license or terms text** in the flow beyond a one-line link (HIG).
- On tablets and landscape, cap the width of buttons and inputs instead of stretching them across the screen (Android).

## Account timing

- **Account after value** whenever the core experience does not need identity; frame it as saving progress. Apple's App Review rejects forced login for apps whose features are not account-based.
- **Up-front account** is right only when content cannot be previewed without it (Android's "welcome placement"), and it carries a higher risk of losing people before they see the app; soften it with a preview of real content.
- Offer platform sign-in and passkeys before email and password; if you offer third-party social login on iOS, also offer a privacy-focused option (usually Sign in with Apple). Screens and security: `auth-flows`.
- Migrate anonymous progress into the new account; losing Day 1 at sign-up is the worst possible first impression.

## Permissions: timing and priming

**Rule:** request a permission when the user first uses the feature that needs it, with the reason in the moment. Ask during onboarding only if the app cannot function at all without it, and then explain why (HIG Onboarding; Android: permission priming at the moment of need, not a bulk request at start).

| Platform | Priming screen rules | After denial |
|---|---|---|
| iOS | Optional custom screen before the system alert. **One button only**, titled "Continue" or "Next" (never "Allow"), which opens the system alert. No close, skip, or "Maybe later" that avoids the alert; no incentives; no fake alert images (Apple HIG privacy; App Review). | The system alert is shown once; afterwards explain the limited feature and deep-link to Settings. |
| Android | Show a rationale when `shouldShowRequestPermissionRationale()` is true; the rationale may offer "Not now". | After repeated denials the system stops showing the dialog; explain and link to the app's settings. |

- **Prefer permission-free alternatives**: system photo, document, and contact pickers need no permission.
- **Location**: ask for while-in-use first; upgrade to always later only if a feature needs it.
- **Never request a permission you cannot explain** in one sentence tied to a visible feature (Android).
- **Denied is a normal state**: the feature shows what it would do and how to enable it, and the rest of the app works.

Permission plan table for each feature (fill it before designing screens):

```
permission | feature that needs it | moment asked | priming copy | denied fallback
camera     | scan receipt          | tap "Scan"   | "Scan receipts instead of typing them" | manual entry + Settings link
```

## Notification opt-in

- **Ask when there is something to be reminded of**: after the first session ("Remind you at 9 pm for tomorrow's session?"), after an order ("Notify me when it ships"), never at first launch.
- **Android 13+**: notifications need the `POST_NOTIFICATIONS` runtime permission and are off by default for newly installed apps; request in context. Create channels per category.
- **iOS**: consider provisional authorization (quiet delivery without a prompt) as a low-friction start; marketing pushes need explicit opt-in and an in-app opt-out.
- The user picks the reminder time; changing it is one tap in settings.

## Paywall timing in subscription apps

- **B2B and most web products**: no paywall before the first win; upgrade prompts at a real limit or moment of value (`conversion-ux`).
- **Consumer subscription apps** often place a paywall inside onboarding, after the goal questions and a taste of value. The data behind this, as reported by RevenueCat (a subscription-infrastructure vendor): 82% of trials start on install day (State of Subscription Apps 2025), and 55% of 3-day-trial cancellations happen on day 0 (2026 report). Most of the decision happens in the first session.
- **Reconcile with Apple's guidance** ("prefer letting people experience the app before prompting for purchases") by showing value first: a personalized plan preview, a first session, or a demo of the result.
- **Non-negotiables**: a visible close or "Continue with free" (not delayed, not low-contrast); price, period, and what happens when the trial ends stated before the purchase button; a reminder before the trial converts where required; restore-purchases reachable. Paywall anatomy and trial rules: `conversion-ux`.
- **Decide placement by experiment**, watching refunds, trial-to-paid, and D30 retention as guardrails, not just trial starts.

## Resumability and re-entry

- **Cache onboarding progress** so an app kill or phone call resumes at the same step; say what happens to progress if the user skips (Android).
- **Never re-show** a skipped tutorial on later launches; put it in Help or Settings (HIG).
- **Restore state** on relaunch: same screen, scroll position, drafts (HIG Launching).
- **Deep links during onboarding** (an invite link, a shared item) land on the linked content after the minimum sign-in, not at the start of a generic flow.

## Checklist

- [ ] Launch screen mirrors the first screen; no logo splash or text.
- [ ] Welcome shows real content; "I already have an account" always visible.
- [ ] Every walkthrough has persistent Skip and Log in; progress indicator maps to real steps.
- [ ] First value happens before the account where the product allows it.
- [ ] No permission before the feature that needs it; iOS priming screens have one "Continue" button.
- [ ] Notification ask after value, with a user-chosen time.
- [ ] Paywall (if any) closable, terms visible, tested with retention guardrails.
- [ ] Progress survives app kill; tutorial never re-shown; available in Help.
- [ ] Denied permissions degrade gracefully with a Settings link.
- [ ] Inputs and buttons capped in width on tablets and landscape.

## Sources

- Apple HIG, Onboarding: https://developer.apple.com/design/human-interface-guidelines/onboarding
- Apple HIG, Launching: https://developer.apple.com/design/human-interface-guidelines/launching
- Apple HIG, Privacy — requesting permission: https://developer.apple.com/design/human-interface-guidelines/privacy
- Apple App Store Review Guidelines (5.1.1 data collection and account-based features; 4.8 login services; 4.5.4 push): https://developer.apple.com/app-store/review/guidelines/
- Android Developers, Authentication & Onboarding (updated 2026-05-19): https://developer.android.com/design/ui/mobile/guides/patterns/onboarding
- Android Developers, notification runtime permission: https://developer.android.com/develop/ui/compose/notifications/notification-permission
- RevenueCat, State of Subscription Apps 2025 and 2026 (vendor data): https://www.revenuecat.com/state-of-subscription-apps-2025 ; https://www.revenuecat.com/state-of-subscription-apps
- marketingskills `onboarding` skill (MIT; mobile pattern listed and deliberately reordered here): https://github.com/coreyhaines31/marketingskills
