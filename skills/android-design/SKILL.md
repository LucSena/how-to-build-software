---
name: android-design
description: Use when designing or building an Android phone, tablet, foldable, or ChromeOS app UI (Compose, Views, or cross-platform), or adopting Material 3 Expressive. Covers M3 Expressive (type, shape, MaterialShapes, spring motion, button groups, split buttons, FAB menus, floating toolbars, flexible navigation bar and rail), dynamic color and roles, edge-to-edge and window insets, predictive back, window size classes and canonical layouts (list-detail, supporting pane, feed), Navigation 3, Android 16/17 resizability rules, 48 dp targets, Roboto Flex and brand fonts, TalkBack and 200% font scale, and Google Play policy pitfalls (target API 36, permissions, account deletion, subscriptions). Also use when the user says "make it look like a modern Android app", "content goes under the status bar", "back gesture is broken", or "make it work on tablets". For cross-platform mobile UX use mobile-design; for iOS use ios-design; for app architecture use mobile-architecture.
license: MIT
metadata:
  version: "1.0.0"
  category: mobile
  related: "mobile-design ios-design mobile-architecture accessibility motion-design"
---

# Android Design

A modern Android app draws edge to edge, animates back with predictive back, adapts from a folded phone to a desktop window, takes its colors from the user's wallpaper, and speaks Material 3 — now Material 3 Expressive, with springier motion, bolder type, and a richer shape library. This skill encodes Material 3 Expressive values from the androidx source and the Android 16/17 platform rules as of 2026-09, so you build with the platform instead of patching around it. It protects platform fidelity, accessibility, and Play compliance.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also confirm: `minSdk` and `targetSdk` (Play requires target API 36 for new apps and updates since 2026-08-31), UI toolkit (Compose, Views/MDC, React Native, Flutter, CMP), Compose Material3 version (most Expressive APIs need the 1.5 line; see `references/compose-notes.md`), and form factors (tablets, foldables, ChromeOS/desktop windowing).

## Core principles

1. **Draw edge to edge and handle insets.** Enforced when targeting API 35+, no opt-out at API 36; content that ignores insets hides under bars and gestures.
2. **Never fight system back.** Predictive back is on by default for apps targeting API 36; handle back only for real in-app state.
3. **Adapt by window size class, not device.** Android ignores orientation and resize locks on large screens when targeting API 36+ (no opt-out at 37).
4. **Theme with roles, not hex codes.** Color roles, type roles, and shape tokens make dynamic color, dark theme, and contrast settings work for free.
5. **Expressive with purpose.** Use Expressive shape, type emphasis, and springs to highlight key moments, not everywhere; utilitarian apps can stay on the standard motion scheme.
6. **48 dp targets, `sp` text, TalkBack-first semantics.** Accessibility settings (font scale to 200%, remove animations, high contrast) are part of the design.
7. **One primary action per screen.** A single FAB (or floating toolbar) for the screen's main action; everything else in app bars, menus, or sheets.

## Workflow

- [ ] **Confirm targets and toolkit** (targetSdk, Material3 version, form factors). Check: targetSdk ≥ 36 for Play submissions.
- [ ] **Set the theme**: `MaterialTheme`/`MaterialExpressiveTheme` with light + dark schemes, dynamic color on Android 12+ with a brand fallback, typography and shapes mapped to roles.
- [ ] **Enable edge-to-edge**: `enableEdgeToEdge()`, `adjustResize`, insets on every screen. Check: nothing under status bar, nav bar, cutout, or keyboard; last list item clears the nav bar.
- [ ] **Navigation**: `NavigationSuiteScaffold` (bar on compact, rail on medium+), Navigation 3 back stack, predictive back support. Check: back works from every screen and never shows "exit?" dialogs.
- [ ] **Adaptive layout**: canonical layout per screen (list-detail, supporting pane, feed); test compact, medium, expanded, and a resized desktop window.
- [ ] **Components**: pick M3/M3E components (table below); one FAB; snackbars for transient feedback; dialogs only for interrupting decisions.
- [ ] **Accessibility pass**: TalkBack labels and grouping, 48 dp targets, font scale 200%, contrast in light/dark, remove-animations setting.
- [ ] **Play pre-check** with `references/play-policy.md`.
- [ ] **Validate** on emulator matrix (phone, foldable, tablet, desktop window) and a real device with gesture navigation and 3-button navigation; fix and repeat.

## Material 3 Expressive essentials

**Type scale (sp).** Default typeface: Roboto / Roboto Flex, or a brand font mapped to roles. M3E adds an emphasized (heavier) variant of each role.

| Role | Size / line height | Weight (emphasized) |
|---|---|---|
| Display L / M / S | 57/64 · 45/52 · 36/44 | 400 (500) |
| Headline L / M / S | 32/40 · 28/36 · 24/32 | 400 (500) |
| Title L / M / S | 22/28 · 16/24 · 14/20 | 400 / 500 / 500 (500 / 700 / 700) |
| Body L / M / S | 16/24 · 14/20 · 12/16 | 400 (500) |
| Label L / M / S | 14/20 · 12/16 · 11/16 | 500 (700) |

**Shape scale (corner radius).** None 0 · ExtraSmall 4 · Small 8 · Medium 12 · Large 16 · **LargeIncreased 20** · ExtraLarge 28 · **ExtraLargeIncreased 32** · **ExtraExtraLarge 48** · Full (pill). Bold = new in M3E. `MaterialShapes` adds 35 morphable shapes (Cookie, Clover, Sunny, Pill, Burst…) for avatars, image crops, loading indicators, and playful emphasis — sparingly.

**Motion.** Springs replace easing + duration. Spatial springs (position, size, shape) may overshoot; effects springs (color, opacity) never do.

| Scheme | Spatial damping / stiffness (fast · default · slow) | Effects damping / stiffness (fast · default · slow) |
|---|---|---|
| Expressive | 0.6/800 · 0.8/380 · 0.8/200 | 1.0/3800 · 1.0/1600 · 1.0/800 |
| Standard | 0.9/1400 · 0.9/700 · 0.9/300 | 1.0/3800 · 1.0/1600 · 1.0/800 |

Default: `MotionScheme.expressive()` for consumer apps with hero moments; `MotionScheme.standard()` for utilitarian and productivity apps. Use `MaterialTheme.motionScheme.defaultSpatialSpec()` etc. instead of hand-tuned curves.

**Component picks.**

| Need | Default component | Notes |
|---|---|---|
| Top-level nav, compact | Navigation bar (`ShortNavigationBar` in M3E; 3–5 items) | 64 dp flexible bar in M3E (classic bar 80 dp) |
| Top-level nav, medium+ | Navigation rail (`WideNavigationRail`; collapsed ~96 dp, expanded 220–360 dp) | Expanded rail supersedes the navigation drawer |
| Screen's main action | FAB (56 dp; Medium 80; Large 96) or `FloatingActionButtonMenu` for a few closely related create actions | One per screen, bottom-trailing |
| Contextual action set | Floating toolbar (`HorizontalFloatingToolbar`, 64 dp, 16 dp from edges) or docked toolbar | M3E's preferred home for a bottom action set; flexible bottom app bar for legacy layouts |
| Segmented choice | Connected `ButtonGroup` | Replaces segmented buttons |
| Primary + variants | `SplitButton` | e.g. Send / schedule send |
| Buttons | XS/S/M/L/XL heights 32/40/56/96/136 dp; round or square | Pressed state morphs corner radius |
| Indeterminate loading | `LoadingIndicator` (morphing shapes), wavy progress for determinate | Only for waits > ~300 ms |
| Header | Top app bar small / center-aligned / `MediumFlexibleTopAppBar` / `LargeFlexibleTopAppBar` (subtitle support) | Collapses on scroll |
| Transient feedback | Snackbar (above FAB and nav bar) | Never for critical errors |
| Interrupting decision | Dialog (28 dp corners; confirm rightmost) | Choices → bottom sheet or menu |

Details, tokens, and usage rules: `references/material3-expressive.md`.

## Color

- Use **color roles**: primary/onPrimary/primaryContainer/onPrimaryContainer (same for secondary, tertiary, error), surface/onSurface/onSurfaceVariant, **surfaceContainerLowest…Highest** for tonal elevation, outline/outlineVariant, inverseSurface, scrim.
- **Dynamic color** on Android 12+ (`dynamicLightColorScheme(context)` / `dynamicDarkColorScheme(context)`), with a brand scheme (generated with Material Theme Builder) as fallback. Keep brand identity in shape, type, illustration, and a fixed brand accent only where recognition matters.
- Elevation is expressed by **surface tone**, not shadows; shadows only where objects truly float (FAB, menus).
- Always provide light and dark schemes; honor the user contrast setting (standard / medium / high) with contrast-variant schemes.
- Contrast: 4.5:1 for text, 3:1 for large text and UI parts; check on dynamic schemes from several wallpapers.

## Edge-to-edge and insets

- Call `enableEdgeToEdge()` in `onCreate` (transparent bars; translucent scrim only in 3-button mode) and set `android:windowSoftInputMode="adjustResize"`.
- Material 3 `Scaffold`, top app bars, and navigation bars apply insets automatically; apply them yourself everywhere else: `Modifier.safeDrawingPadding()`, `windowInsetsPadding(WindowInsets.systemBars)`, `imePadding()`, `WindowInsets.displayCutout`, `captionBar` for desktop windowing.
- Lists: draw content behind bars but add bottom `contentPadding` from the insets so the last item clears the navigation bar.
- Immersive media only: hide bars with `WindowInsetsControllerCompat`; keep gesture areas (`safeGestures`) free of swipeable controls.

## Predictive back and navigation

- For apps targeting API 36 on Android 16+, predictive back animations (back-to-home, cross-activity, cross-task) are on by default and **`onBackPressed()` is not called and `KEYCODE_BACK` is not dispatched**. Migrate to `OnBackPressedDispatcher` callbacks; in Compose use `BackHandler` / `PredictiveBackHandler` (or the newer `NavigationBackHandler` in androidx.navigationevent).
- Handle back only for real state: close a sheet/search/selection mode, collapse a list-detail pane, confirm discarding unsaved edits. Never "Press back again to exit" or "Exit app?".
- Navigation 3 (`androidx.navigation3`) is the recommended navigation library for Compose: you own the back stack (`rememberNavBackStack`), render it with `NavDisplay`, and declare screens with `entryProvider { }`. Single activity.
- Top-level: `NavigationSuiteScaffold` switches between navigation bar, rail, and drawer-style layouts by window size.

## Adaptive layouts

| Width class | dp | Navigation | Layout |
|---|---|---|---|
| Compact | < 600 | Navigation bar | Single pane; 16 dp margins |
| Medium | 600–839 | Navigation rail | Single pane or list-detail with one pane visible; 24 dp margins |
| Expanded | 840–1199 | Rail (collapsed or expanded) | Two panes (list-detail, supporting pane) |
| Large / Extra-large | 1200–1599 / ≥ 1600 | Expanded rail | Two or three panes; cap text width |

- Read `currentWindowAdaptiveInfo(...)`'s `windowSizeClass` and branch with `isWidthAtLeastBreakpoint(...)`; never on device type or orientation.
- Canonical layouts: **list-detail** (`ListDetailPaneScaffold`), **supporting pane** (`SupportingPaneScaffold`), **feed** (`LazyVerticalGrid(GridCells.Adaptive(minSize = 180.dp))`).
- **Android 16/17:** when targeting API 36, on displays with smallest width ≥ 600 dp the system ignores `screenOrientation`, `resizeableActivity="false"`, and aspect-ratio limits; the temporary opt-out disappears when targeting API 37. Games are exempt; phones are unaffected. Design every screen to resize.
- Foldables: keep content off the hinge (`FoldingFeature`), support tabletop posture (content top, controls bottom), and preserve state across fold/unfold with `rememberSaveable`.
- Details, breakpoints constants, and pane behavior: `references/adaptive-layouts.md`.

## Accessibility

- Targets **48×48 dp** minimum (`minimumInteractiveComponentSize()` is applied by M3 components), ≥ 8 dp apart.
- Text in **sp** only; test at **200% font scale** (Android 14+ scales large text non-linearly) and with display size increased. No fixed-height text containers.
- TalkBack: `contentDescription` on meaningful icons (null for decorative), `Modifier.semantics(mergeDescendants = true)` for rows, `Role`, `stateDescription`, custom actions for swipe gestures, heading semantics, `LiveRegion` for status changes.
- Honor "Remove animations" (animator duration scale 0): crossfade or cut instead of movement.
- Never rely on color alone; check contrast in dynamic schemes and high-contrast mode.

## Play policy pitfalls (summary)

- **Target API:** since 2026-08-31, new apps and updates must target **API 36** (Wear OS/Automotive 35; TV/XR 34); extensions available until 2026-11-01. Existing apps below API 35 stop being offered to new users on newer Android versions.
- **Permissions:** request in context with rationale; prefer the Photo Picker, Contacts Picker (Android 17), and system device pickers over broad permissions; sensitive permissions (SMS, call log, background location, all-files access, broad photo/video access) require policy declarations.
- **Accounts:** in-app and web account-deletion paths when accounts can be created; Data safety form must match actual data collection.
- **Subscriptions and billing:** Play Billing for digital goods (regional alternative-billing programs aside); clear offer terms before purchase; easy cancellation.
- Full checklist: `references/play-policy.md`.

## Gotchas

- **`MaterialExpressiveTheme` without a color scheme defaults to a light expressive scheme** — pass your light/dark (and dynamic) scheme explicitly or dark theme silently breaks.
- **Assuming stable Expressive APIs**: many M3E components are still `@ExperimentalMaterial3ExpressiveApi` or only in the Material3 1.5 alpha/beta line; pin versions and isolate opt-ins.
- **Content under system bars** after targeting API 35/36: FABs under the gesture bar, last list item hidden, text fields behind the keyboard. Handle insets per screen.
- **Overriding `onBackPressed`** or intercepting back to show "Exit app?": ignored or broken with predictive back on API 36.
- **Locking orientation** or `resizeableActivity=false` to avoid tablet work: ignored on ≥ 600 dp at API 36, no opt-out at 37.
- **Navigation drawer as primary navigation** on phones; use the navigation bar (compact) and rail (medium+).
- **Multiple FABs**, or a FAB for a secondary action.
- **Hard-coded colors** (`Color(0xFF6200EE)`) in components instead of roles; dark theme and dynamic color break.
- **Dimensions in dp for text** or fixed-height buttons that clip at 200% font scale.
- **iOS patterns on Android**: centered titles with back chevron + "Back" text, iOS switches, action sheets instead of bottom sheets, a custom share sheet.
- **Expressive everywhere**: morphing shapes on every card and bouncy springs on every list item. Reserve emphasis for hero moments and key actions.
- **Reading SMS for OTPs**: Android 17 delays standard OTP SMS ~3 hours for apps targeting API 37; use SMS Retriever / User Consent APIs or autofill.

## Output format

```
Targets: minSdk <x>, targetSdk <≥36>, Compose Material3 <version>, form factors <phone/foldable/tablet/desktop>
Theme: color (dynamic + fallback, light/dark, contrast), type roles/fonts, shapes, motion scheme (expressive|standard)
Navigation: suite (bar/rail), Navigation 3 back stack, predictive back handling points
Layouts: per screen canonical layout at compact / medium / expanded
Insets: edge-to-edge handling per screen (bars, IME, cutout)
Components: key M3/M3E components chosen and why
Accessibility: TalkBack semantics, 200% font scale behavior, targets, contrast
Play risks: items from play-policy.md and mitigations
Verified / Not checked
```

For a review: P0–P3 findings with Observed / Inferred / Not checked, each citing the Material or Android guidance.

## References

| File | Read when |
|---|---|
| `references/material3-expressive.md` | choosing or theming M3E components, type emphasis, shapes, motion springs, or migrating from M2/M3 baseline |
| `references/adaptive-layouts.md` | building tablet, foldable, desktop-window, or multi-pane layouts, or handling Android 16/17 resizability rules |
| `references/compose-notes.md` | writing Compose code: theming setup, insets, predictive back, Navigation 3, performance, semantics, library versions |
| `references/play-policy.md` | preparing a Play release, bumping targetSdk, requesting sensitive permissions, or designing billing, subscriptions, or account deletion |

## Related skills

- `mobile-design` — permissions, onboarding, forms, offline states, and the iOS vs Android differences table.
- `ios-design` — the iOS counterpart when shipping both platforms.
- `mobile-architecture` — Now in Android-style layers, offline-first sync, WorkManager, performance budgets, releases.
- `accessibility` — TalkBack testing procedure and WCAG mapping.
- `motion-design` — when and how much to animate; spring intuition.
