---
name: mobile-design
description: Use when designing, building, or reviewing any iPhone, iPad, Android phone, tablet, or foldable app screen or flow, native or cross-platform (React Native, Expo, Flutter, Compose Multiplatform). Covers thumb zones, navigation models (tab bar, navigation bar, stack, drawer, modals), gestures and discoverability, touch targets, permission priming, notification permission UX, onboarding, mobile forms and keyboards (keyboard types, autofill, one-time codes), offline and poor-network states, iOS vs Android convention differences, tablets and foldables, dark mode, and haptics. Also use when the user says "make this feel native", "our app feels like a website", "where should the nav go", "when do we ask for permissions", or "port this iOS design to Android". For iOS specifics (Liquid Glass, SwiftUI, Dynamic Type) use ios-design; for Material 3 Expressive and Compose use android-design; for stack choice and app architecture use mobile-architecture.
license: MIT
metadata:
  version: "1.0.0"
  category: mobile
  related: "ios-design android-design mobile-architecture interaction-design accessibility ux-principles"
---

# Mobile Design

A mobile app is judged in the first ten seconds by whether it behaves like the platform it runs on: the back gesture works, navigation sits under the thumb, text scales, the keyboard never covers the field, and nothing asks for access before it has earned it. This skill sets the cross-platform UX defaults that hold on both iOS and Android, and hands off to `ios-design` and `android-design` for platform specifics. It protects two things: platform trust (people already know how their phone works) and respect (permissions, notifications, and onboarding on the user's terms).

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Follow each platform's conventions; share the product, not the chrome.** People know their phone's back, tabs, dialogs, and share sheet; a "consistent brand UI" that fights them reads as broken.
2. **Put frequent actions where the thumb is.** Bottom navigation, bottom toolbars, and bottom sheets beat top-corner buttons on 6.1–6.9" screens.
3. **Make every target at least 44 pt (iOS) / 48 dp (Android).** Fitts's law; undersized hit areas are the most common mobile accessibility failure.
4. **Ask for access just in time, after value, with a real explanation.** A permission prompt at launch gets denied, and a denial is expensive to undo.
5. **Every gesture has a visible alternative, and no gesture fights a system edge.** Hidden gestures are undiscoverable and inaccessible; edge conflicts break back and home.
6. **Design offline, slow, and denied states up front.** Mobile networks drop and users deny permissions; the unhappy path is a primary path.
7. **Respect system settings.** Text size, dark mode, reduce motion, reduce transparency, and contrast settings are user choices, not edge cases.

## Workflow

- [ ] **Confirm platforms and stack** (iOS only, Android only, both; native or cross-platform) and minimum OS versions. Load `ios-design` and/or `android-design` alongside this skill.
- [ ] **Map the information architecture**: list top-level destinations (3–5 → tab bar / navigation bar), hierarchy (stack), and self-contained tasks (sheets/modals). Check: no primary destination hides behind a hamburger.
- [ ] **Place actions on a thumb map**: primary actions bottom or trailing-bottom; destructive actions away from frequent ones.
- [ ] **Design every state** for each screen: loading (skeleton or cached), empty, error, offline, partial, permission-denied. Check: none is a blank screen or a bare spinner.
- [ ] **Plan permissions and notifications** as a table: permission → triggering feature → moment asked → denied fallback. Check against the permission rules below.
- [ ] **Spec forms**: keyboard type, autofill/content type, return key, and validation moment per field.
- [ ] **Check adaptivity**: largest text size, dark mode, landscape, tablet/foldable width, split screen.
- [ ] **Validate** against Gotchas and `references/anti-patterns.md`; fix and repeat until clean. Where possible, verify on a real device (safe areas, keyboard, gestures, haptics differ from simulators).

## Thumb zones and reachability

- Default: primary navigation at the bottom (tab bar / navigation bar), primary action bottom-trailing (Android FAB) or in a bottom toolbar / trailing toolbar position (iOS).
- The top corners are the hardest reach one-handed. Put only infrequent or navigational items there (Back, Close, profile, settings).
- Keep destructive actions out of the natural thumb arc and away from the primary action; separate them by position and color, and prefer undo over confirmation.
- Bottom sheets bring secondary choices into reach; use them for pickers and short choices instead of top-anchored dropdowns.
- Don't rely on iOS Reachability or Android one-handed mode as your reachability strategy.

## Navigation models

| Structure | Default | Notes |
|---|---|---|
| 3–5 top-level peer destinations | **iOS tab bar / Android navigation bar** (bottom) | 5 is the practical maximum on phones. Single-word labels + icons. Always visible except under a modal. |
| 6+ destinations | Keep the 4–5 most used in tabs; move the rest into a screen inside a tab (e.g. "Library", "More") | iPad: a sidebar-adaptable tab bar; Android medium+ width: navigation rail. |
| Hierarchy / drill-down | **Stack** (push/pop) with system back | Never break the iOS edge-swipe or Android system back. |
| Self-contained task (compose, filter, edit) | **Sheet / modal** with an obvious exit | One sheet at a time. Long or complex flows → full-screen modal. |
| 2 destinations | Tabs are still fine; or a single home screen with a secondary screen | Don't invent a tab bar for 2 items that are really one flow. |
| Hamburger / drawer | **Avoid as primary navigation** | Hidden navigation lowers discovery and use. Material 3 Expressive favors the expanded navigation rail over the drawer. |

Rules:
- Tabs navigate; they never perform actions (no "+" compose tab). Put creation in a toolbar button or FAB.
- Never hide or disable a tab based on state; show the tab with an empty state that explains why.
- Each tab keeps its own navigation stack; re-tapping the active tab pops to root (and then scrolls to top).
- Deep links must build a sensible back stack (see `mobile-architecture`).

## Touch targets and spacing

| Platform | Minimum target | Spacing | Notes |
|---|---|---|---|
| iOS / iPadOS | **44×44 pt** (HIG default; 28×28 pt absolute minimum for dense secondary controls) | ~12 pt around bezeled controls, ~24 pt around bezel-less ones | The visible glyph can be smaller than the 44 pt hit area. |
| Android | **48×48 dp** | ≥ 8 dp between targets | Compose `IconButton` draws 40 dp but reserves 48 dp. |
| Web in a mobile browser | ≥ 44 CSS px on touch; never below 24×24 (WCAG 2.2 2.5.8) | ≥ 8 px | Expand hit areas with padding, not by enlarging the visual. |

Grow the hit area invisibly (padding, `contentShape`, `minimumInteractiveComponentSize()`), keep list rows full-width tappable, and never place two small destructive/benign targets side by side.

## Gestures and discoverability

- Standard gestures (tap, swipe, drag, long-press, pinch, double-tap) must do what people expect on that platform.
- Custom gestures are **shortcuts**, never the only path: swipe-to-delete also has an Edit/Delete button or context-menu item; long-press menus duplicate actions available elsewhere.
- **Never claim a system edge**: iOS leading-edge back swipe, bottom home/app-switch swipe, top Notification/Control Center; Android back gestures from both side edges and the bottom gesture bar. Horizontal carousels and drawers near edges are the usual offenders.
- Hint gestures through affordances (a peeking next card, a grabber on a sheet, a partially revealed row action), not through tutorials.
- Track the finger 1:1 during drags, allow interruption mid-animation, and let a flick's velocity decide the outcome.
- Accessibility: every gesture needs a single-tap alternative (WCAG 2.5.1, 2.5.7) and custom accessibility actions for screen readers.

## Permissions and notifications (summary)

Full flows and copy in `references/permissions-onboarding.md`.

- Ask **when the user triggers the feature** ("Scan receipt" → camera), not at launch, unless the app literally cannot function without it.
- Prefer permission-free system pickers: photo pickers, contact pickers, document pickers, and system share sheets need no permission.
- **iOS pre-permission screen rule (Apple HIG):** a custom screen before the system alert may have **one button only**, titled "Continue" or "Next" (never "Allow"), that opens the system alert. No "Not now", close, or skip that avoids the alert, no incentives, and no fake alert imagery. The system alert itself is the user's choice.
- **Android rationale:** when `shouldShowRequestPermissionRationale()` is true, show an explanation first; a rationale may offer "Not now". After repeated denials the system stops showing the dialog, so send people to app settings instead of asking again.
- Denied is a first-class state: show what is limited, keep the rest working, and offer a settings deep link at the moment the user tries the feature again — never nag.
- Location: ask for when-in-use first; upgrade to "always" only when a feature needs it. Accept approximate location where it is enough.
- Notifications: ask after a moment that shows value ("Notify me when my order ships"), never on first launch. iOS offers provisional (quiet) authorization; Android 13+ requires the `POST_NOTIFICATIONS` runtime permission. Marketing pushes need explicit opt-in and an in-app opt-out.

## Onboarding

- **Value before signup.** Let people use or at least see the product before creating an account; Apple rejects forced login for apps without account-based features (App Review 5.1.1(v)).
- If you support account creation, you must support **in-app account deletion** (Apple 5.1.1(v); Google Play also requires a deletion path).
- Offer platform sign-in (Sign in with Apple, Google via Credential Manager) and passkeys before email + password. On iOS, a third-party social login for the primary account requires an equivalent privacy-preserving option (App Review 4.8).
- Skip the intro carousel. Teach in context (one tip at the moment it matters), keep any intro skippable, and never repeat it.
- Launch screens show the app's first-screen shape, not a logo splash or an ad. Restore the previous state on relaunch.
- Postpone setup: sensible defaults, then ask for preferences when they become relevant. Ask for ratings only after a success moment, through the system review prompt.

## Mobile forms and keyboards

| Field | iOS (SwiftUI) | Android (Compose) | Web |
|---|---|---|---|
| Email | `.keyboardType(.emailAddress)` + `.textContentType(.emailAddress)` | `KeyboardType.Email` + autofill content type | `type="email" autocomplete="email"` |
| New password | `.textContentType(.newPassword)` | `KeyboardType.Password` + new-password content type | `autocomplete="new-password"` |
| One-time code | `.textContentType(.oneTimeCode)` | SMS Retriever / SMS User Consent API or autofill | `autocomplete="one-time-code" inputmode="numeric"` |
| Phone | `.keyboardType(.phonePad)` + `.telephoneNumber` | `KeyboardType.Phone` | `type="tel" autocomplete="tel"` |
| Number / amount | `.numberPad` / `.decimalPad` | `KeyboardType.Number` / `Decimal` | `inputmode="numeric"` / `"decimal"` |

- Set the return key per field (Next → next field, Done/Go/Search on the last) and move focus programmatically.
- Disable autocorrect and auto-capitalization for emails, usernames, codes, and URLs.
- One column, labels always visible (no placeholder-as-label), validate on blur, allow paste everywhere including OTP and password fields.
- The keyboard must never cover the focused field or the submit button: iOS keyboard layout guide / safe-area insets; Android `adjustResize` + `imePadding()`; React Native `react-native-keyboard-controller` or `KeyboardAvoidingView`.
- Prefer pickers, steppers, and segmented choices over free text for bounded inputs. Get data from the system (autofill, contacts picker, location) instead of asking.
- Android 17 delays access to standard SMS messages containing OTPs by about three hours for apps targeting API 37; use SMS Retriever / SMS User Consent or autofill, never `READ_SMS` scraping.

## Offline and poor-network states

- Default architecture: local store as source of truth, network sync in the background (details in `mobile-architecture`). The UI reads local data first, so it opens instantly.
- Offline indicator: a quiet banner or status line, never a blocking modal. Keep cached content readable and editable where safe.
- Show **pending** state on queued writes (a clock icon or "Waiting to sync") and "Last updated 5 min ago" on stale data.
- Loading: skeletons or cached content, not full-screen spinners; show progress only after ~300 ms to avoid flashes.
- Errors say what happened and what to do, with Retry. Never use a toast/snackbar as the only channel for a critical error; it disappears.
- Pull-to-refresh is a convenience, not the only way to get fresh data.

## iOS vs Android at a glance

| Concern | iOS | Android |
|---|---|---|
| Back | Leading-edge swipe + Back chevron (no "Back" text); no system back button | System back gesture/button with predictive back; never block it |
| Primary nav | Floating Liquid Glass tab bar; sidebar on iPad | Navigation bar (compact), navigation rail (medium+) |
| Primary action | Prominent toolbar button, trailing; no FAB convention | FAB bottom-trailing (or floating toolbar) |
| Dialog buttons | Cancel leading, confirm trailing; choices in an action sheet | Buttons bottom-trailing, confirm rightmost; choices in a bottom sheet or menu |
| Transient feedback | No system toast; inline status + haptic | Snackbar above nav bar/FAB |
| Type units | pt, Dynamic Type text styles (Body 17 pt) | sp, Material type scale (Body Large 16 sp) |

Full table (pickers, share, menus, lists, switches, search, icons, haptics, app icons, live info) in `references/platform-differences.md`.

## Tablets, foldables, and adaptive layouts

- Lay out by **available window size** (iOS size classes, Android window size classes), never by device model or orientation. Split screen, Slide Over, desktop windowing, and foldables all change size at runtime.
- Restructure, don't stretch: list-detail side by side at expanded widths, a sidebar or navigation rail instead of bottom tabs, capped reading width (roughly 600–840 dp/pt for text).
- Don't lock orientation to dodge layout bugs. For apps targeting Android API 36+, orientation and resizability locks are ignored on displays ≥ 600 dp wide, and the opt-out goes away at API 37.
- Keep content and controls off hinges and fold regions; keep scroll position and state across fold/unfold and resize.
- Support pointer and keyboard on tablets: hover states, keyboard shortcuts, context menus, drag and drop.

## Dark mode

- Follow the system appearance by default; don't add an in-app theme switch without a reason users asked for.
- Use semantic colors (iOS `label`, `systemBackground`; Material color roles), so dark mode and increased contrast come for free.
- Dark surfaces are elevated dark greys, not pure black (OLED media apps excepted); hierarchy that pops in light must pop in dark.
- Check contrast in both modes (4.5:1 body text, 3:1 large text and UI parts), dim bright images, and ship dark/tinted app-icon variants (iOS) and a monochrome icon layer (Android themed icons).

## Haptics basics

- Haptics confirm meaningful events: success/warning/error, a selection change in a picker, a snap or threshold during a drag. Use the system semantic patterns (iOS notification/impact/selection feedback; Android `HapticFeedbackConstants` such as `CONFIRM`, `REJECT`, `CLOCK_TICK`).
- Pair with visual feedback on the same frame; never haptic-only.
- Never haptic on every tap, scroll, or keystroke; never for marketing moments. Respect system haptic settings.

## Gotchas

- **Web-in-a-wrapper.** A WebView shell with hamburger nav, hover affordances, and no native back fails users and risks App Store 4.2 (Minimum Functionality) rejection. Use native navigation primitives even in cross-platform stacks.
- **Hamburger as primary navigation on iOS** (or on compact Android). Use a tab bar / navigation bar for the top 3–5 destinations.
- **Custom back.** A custom navigation that disables the iOS edge swipe, or an Android "Are you sure you want to exit?" back interceptor. Both break muscle memory; the Android one also fights predictive back.
- **Ignoring safe areas and insets.** Content under the Dynamic Island, buttons under the home indicator or Android gesture bar, the last list item hidden behind the nav bar, hard-coded status-bar heights.
- **Porting one platform's chrome to the other.** FAB on iOS, iOS chevron + "Back" text on Android, a custom share sheet replacing the system one, iOS toggles on Android.
- **Asking for permissions at launch**, or an iOS pre-permission screen with a "Maybe later" button (violates the HIG rule above). The Android "Not now" soft-ask pattern does not transfer to iOS.
- **Notification prompt on first launch** before any value; marketing pushes without opt-in.
- **Fixed font sizes.** Test at the largest accessibility text size (iOS AX5 body is 53 pt, about 3× the default; Android up to 200% font scale). Layouts must reflow, not truncate.
- **Toasts for errors, spinners for everything.** Critical errors need persistent inline UI; content loads need skeletons or cache.
- **Stretching the phone UI on tablets** or pillarboxing it with an orientation lock.
- **Gesture-only features** (swipe-to-archive with no button) and carousels that steal the back-swipe edge.
- **Forced account creation before value**, and no in-app account deletion.

More anti-patterns with fixes in `references/anti-patterns.md`.

## Output format

For a design or spec, deliver:

```
Platforms / stack: <iOS x+, Android API y+, native | RN | Flutter | CMP>
Navigation map: <tabs/nav bar items, stacks, modals; tablet variant>
Screen specs: per screen → layout, primary action + position, states (loading/empty/error/offline/denied)
Permissions & notifications: permission | trigger | moment | copy | denied fallback
Forms: field | keyboard | autofill/content type | return key | validation
Adaptivity checks: largest text, dark mode, tablet/foldable, landscape
Platform divergences: <where iOS and Android intentionally differ>
Verified / Not checked: <device, simulator, screen reader, etc.>
```

For a review, list findings as **P0–P3** with Observed / Inferred / Not checked, each citing the rule (e.g. "HIG pre-alert screens", "48 dp target").

## References

| File | Read when |
|---|---|
| `references/platform-differences.md` | deciding how a component or pattern should differ between iOS and Android, or porting a design across platforms |
| `references/permissions-onboarding.md` | designing a permission request, pre-permission screen, notification opt-in, sign-up/sign-in, or first-run flow |
| `references/anti-patterns.md` | reviewing a mobile app or design, or when something "feels off" or "feels like a website" |

## Related skills

- `ios-design` — Liquid Glass, SwiftUI APIs, Dynamic Type, SF Symbols, sheets, App Review pitfalls.
- `android-design` — Material 3 Expressive, Compose, edge-to-edge, predictive back, window size classes, Play policy.
- `mobile-architecture` — stack choice, offline sync, deep links, push infrastructure, performance budgets, releases.
- `interaction-design` — states, feedback, overlays, microcopy details that apply on every platform.
- `accessibility` — VoiceOver/TalkBack testing and WCAG 2.2 mapping.
- `conversion-ux` — onboarding, paywalls, and activation when the goal is conversion.
