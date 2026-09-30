# Mobile Anti-Patterns

The mistakes that make an app feel broken, foreign, or hostile, with the fix for each. Use as a review checklist. Severity guide: **P0** blocks store approval, accessibility, or a core task; **P1** breaks platform expectations most users notice; **P2** polish users feel but can work around; **P3** nit.

## Contents
- Navigation and structure
- Layout and input
- Visual and platform fidelity
- Permissions, onboarding, notifications
- States and feedback
- Motion and performance
- Quick review checklist
- Sources

## Navigation and structure

### Don't ship a website in a wrapper (P0–P1)
**Rule.** Build native navigation and controls; don't wrap a responsive site in a WebView with web chrome.
**Apply when.** A "just wrap the web app" plan, or a hybrid shell.
**Do / Avoid.** Do: native tab bar, native stack, system back; embed web content only for content pages. Avoid: hamburger header, hover affordances, in-page back links, web-styled form controls.
**Why.** Users detect it immediately (Jakob's law), and App Review 4.2 rejects apps that are not "beyond a repackaged website"; 4.2.6 rejects template/app-generator output.

### Don't hide primary navigation behind a hamburger (P1)
**Rule.** 3–5 top-level destinations go in a visible bottom tab bar (iOS) / navigation bar (Android compact) or rail (Android medium+).
**Apply when.** An app has more than one top-level area.
**Do / Avoid.** Do: Home, Search, Library, Profile as tabs. Avoid: a drawer holding the main sections on a phone.
**Why.** Out of sight lowers discovery and use of those sections (NN/g); iOS has no drawer convention; M3 Expressive moves away from the drawer toward the expanded rail.

### Don't break or fake system back (P0–P1)
**Rule.** Use the platform navigation containers so iOS edge-swipe and Android system back/predictive back just work. Handle back only for real in-app state (close a sheet, discard unsaved edits with confirmation).
**Apply when.** Custom navigators, full-screen custom transitions, root screens.
**Do / Avoid.** Do: `NavigationStack` on iOS; Navigation 3 / `OnBackPressedDispatcher` on Android. Avoid: hiding the back button, a custom chevron that ignores the swipe, an "Exit app?" dialog on Android back.
**Why.** For apps targeting Android 16 (API 36), `onBackPressed()` is no longer called and predictive back animations are on; interceptors break. Muscle memory for back is the strongest mobile convention.

### Don't use tabs for actions, and don't hide tabs (P1)
**Rule.** Tabs navigate between sections; they stay the same set in every state.
**Apply when.** A "+" or "Post" tab, or tabs that appear after login or with a feature flag.
**Do / Avoid.** Do: creation in a toolbar button (iOS) or FAB (Android); an explanatory empty state in a tab with no content. Avoid: a center "compose" tab that opens a modal; tabs that disappear.
**Why.** HIG: tab bars are for navigation, not actions; unstable tab sets make the app feel unpredictable.

### Don't stack modals (P1)
**Rule.** One sheet at a time; long or multi-step flows use a full-screen modal or a pushed flow.
**Apply when.** A sheet opens another sheet, or a sheet contains a long wizard.
**Do / Avoid.** Do: close sheet A before presenting B. Avoid: sheet on sheet on sheet with no clear way back.
**Why.** Users lose their place; dismiss gestures become ambiguous.

## Layout and input

### Don't ship undersized touch targets (P0–P1)
**Rule.** 44×44 pt on iOS, 48×48 dp on Android, at least 8 dp/pt between adjacent targets.
**Apply when.** Icon-only buttons, inline links, close buttons, steppers, chips.
**Do / Avoid.** Do: a 24 pt glyph inside a 44 pt hit area. Avoid: a 24×24 close "X" in a corner beside another control.
**Why.** Fitts's law; motor-impaired users and anyone walking or one-handed miss small targets.

### Don't ignore safe areas and insets (P0–P1)
**Rule.** Lay out against safe areas (iOS) and window insets (Android: system bars, display cutout, IME); pad the last list item above bars.
**Apply when.** Full-bleed screens, bottom buttons, custom headers, landscape, edge-to-edge on Android 15+.
**Do / Avoid.** Do: `safeAreaInset` / `safeDrawingPadding()` / `react-native-safe-area-context`. Avoid: hard-coded 20/44/47 pt status-bar heights; a "Buy" button under the home indicator or gesture bar.
**Why.** Edge-to-edge is enforced for Android apps targeting API 35+ and cannot be opted out of at API 36; iOS devices vary in top inset.

### Don't let the keyboard cover inputs (P0)
**Rule.** The focused field and the submit button stay visible while the keyboard is open.
**Apply when.** Any form, chat composer, search field near the bottom.
**Do / Avoid.** Do: keyboard-aware layout (`adjustResize` + `imePadding()`, iOS keyboard layout guide, `react-native-keyboard-controller`). Avoid: a fixed bottom CTA hidden under the keyboard.
**Why.** Users can't see what they type or can't submit.

### Don't use fixed font sizes or text in images (P0–P1)
**Rule.** Use Dynamic Type text styles (iOS) and `sp` with the M3 type scale (Android); layouts reflow at the largest sizes.
**Apply when.** Any text.
**Do / Avoid.** Do: stack horizontal rows vertically at accessibility sizes. Avoid: `.font(.system(size: 15))` everywhere; truncating titles at AX sizes; text baked into images.
**Why.** Many users run larger text; iOS AX5 body is about 3× default and Android scales up to 200%.

### Don't lock orientation or stretch the phone layout on tablets (P1)
**Rule.** Adapt by window size class: list-detail, sidebar/rail, capped text width.
**Apply when.** iPad, Android tablets, foldables, desktop windowing, split screen.
**Do / Avoid.** Do: two panes at expanded width. Avoid: a 1,200 dp-wide single column; portrait-only lock on tablets.
**Why.** Android ignores orientation/resizability locks on ≥ 600 dp displays for apps targeting API 36 (opt-out removed at 37); pillarboxed or stretched UI looks abandoned.

## Visual and platform fidelity

### Don't port one platform's chrome to the other (P1)
**Rule.** Share content and brand; let navigation, dialogs, pickers, and system surfaces follow each platform.
**Apply when.** Single-codebase apps, designs made for one platform first.
**Do / Avoid.** Avoid: FAB on iOS; iOS chevron + "Back" text on Android; centered iOS-style titles on Android top bars; iOS toggles on Android; a custom share sheet on either.
**Why.** "An iOS app wearing Android's skin" feels untrustworthy to fluent users of each platform.

### Don't misuse Liquid Glass (P1–P2)
**Rule.** Glass lives only on the navigation/control layer; system components adopt it automatically.
**Apply when.** iOS 26+ design, custom bars, cards.
**Do / Avoid.** Avoid: glass cards and list rows, glass on glass, tinting every control, opaque custom bar backgrounds that block the system glass, clear glass over plain backgrounds. See `ios-design`.
**Why.** Apple HIG: don't use Liquid Glass in the content layer; use it sparingly.

### Don't rely on color alone, low contrast, or no dark mode (P0–P1)
**Rule.** Semantic colors, 4.5:1 text contrast (3:1 large text and UI parts), status with icon + text, and both appearances tested.
**Apply when.** Status badges, validation, charts, custom palettes.
**Why.** Color-blind users and bright sunlight; dark mode is a system setting users expect honored.

## Permissions, onboarding, notifications

### Don't ambush with permissions (P0–P1)
**Rule.** Just-in-time, one at a time, with context; iOS pre-prompts have a single "Continue"/"Next" button.
**Avoid.** Several prompts at launch; a notification prompt before any value; fake alert imagery; iOS pre-prompts with "Maybe later". See `permissions-onboarding.md`.
**Why.** Denial rates and App Review rejections.

### Don't force an account before value (P0)
**Rule.** Let people try the app first; support in-app account deletion if you support sign-up.
**Why.** Apple 5.1.1(v); Google Play account-deletion requirement; conversion.

### Don't use long intro carousels or logo splash screens (P2)
**Rule.** Launch into content; teach in context; any intro is skippable and shown once.
**Why.** Users skip them; iOS HIG says launch screens carry no logos, text, or ads.

### Don't over-notify (P1)
**Rule.** Notifications for events the user cares about; marketing only with explicit opt-in; categories users can mute; Time Sensitive and Live Activities/Live Updates only for truly time-bound, user-initiated tasks.
**Why.** App Review 4.5.4; users disable all notifications after a few irrelevant ones; Android Live Updates exclude ads and promos.

## States and feedback

### Don't use toasts or snackbars for critical errors (P1)
**Rule.** Critical errors stay on screen next to their cause until resolved; transient confirmations can be snackbars.
**Why.** Auto-dismissing messages are missed and fail users with cognitive or motor impairments.

### Don't show spinner-only loading (P2)
**Rule.** Cached content first, skeletons shaped like content, spinners only for short unknown waits after ~300 ms.
**Why.** Perceived performance; offline-first apps have data to show immediately.

### Don't block the app when offline (P1)
**Rule.** Quiet offline banner, readable cache, queued writes with a visible pending state.
**Why.** Mobile connectivity is intermittent; a blocking "No connection" modal makes cached data useless.

## Motion and performance

### Don't ship janky or excessive animation (P1–P2)
**Rule.** Animate to explain a change; interruptible springs; honor Reduce Motion (iOS) and "Remove animations" (Android); no continuous glass or layout-thrashing animation; RN animations on the UI thread (Reanimated/worklets).
**Why.** Frames must fit 16.7 ms (60 Hz) or 8.3 ms (120 Hz); vestibular disorders.

### Don't hide features behind gestures only (P1)
**Rule.** Every gesture has a visible control or menu alternative, and no gesture claims a system edge.
**Why.** Discoverability; WCAG 2.5.1 / 2.5.7; iOS back swipe and Android back gestures live on the edges.

## Quick review checklist

- [ ] Native navigation containers; system back works everywhere; no hamburger as primary nav
- [ ] Targets ≥ 44 pt / 48 dp; safe areas and insets respected; keyboard never covers input
- [ ] Largest text size and dark mode tested; no color-only status
- [ ] No cross-platform chrome leakage (FAB on iOS, iOS chevrons on Android, custom share sheet)
- [ ] Permissions just-in-time; iOS pre-prompt single "Continue"; denied states designed
- [ ] No forced sign-up before value; in-app account deletion exists
- [ ] Offline, loading, empty, error states designed; no toast-only critical errors
- [ ] Tablet/foldable layouts restructure; no orientation locks
- [ ] Reduce Motion / Remove animations honored; no gesture-only features

## Sources

- Apple HIG — Materials, Tab bars, Sheets, Privacy, Launching, Onboarding, Accessibility: https://developer.apple.com/design/human-interface-guidelines
- Apple App Review Guidelines (June 8, 2026): 4.2, 4.5.4, 5.1.1 — https://developer.apple.com/app-store/review/guidelines/
- Android 16 behavior changes (predictive back, edge-to-edge opt-out removal): https://developer.android.com/about/versions/16/behavior-changes-16
- Android 17 behavior changes (large-screen resizability): https://developer.android.com/about/versions/17/behavior-changes-17
- Android Live Updates guidance: https://developer.android.com/develop/ui/views/notifications/live-update
- NN/g — Hamburger menus and hidden navigation: https://www.nngroup.com/articles/hamburger-menus/
- WCAG 2.2 (2.5.1 Pointer Gestures, 2.5.7 Dragging Movements, 2.5.8 Target Size): https://www.w3.org/TR/WCAG22/
- impeccable (Apache-2.0) native iOS/Android references, for the "ported from a website" / "wearing the other platform's skin" review framing
