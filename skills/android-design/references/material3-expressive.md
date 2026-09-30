# Material 3 Expressive — Tokens and Components

Material 3 Expressive (M3E) was announced at Google I/O in May 2025 and shipped with Android 16 QPR1 (Sept 2025). It extends M3 with emphasized typography, a larger shape library with morphing, spring-based motion, and new components. Values here come from the androidx Compose Material3 token source (androidx-main, Sept 2026) unless noted. Status as of 2026-09: Compose Material3 1.5.0 is in beta on androidx-main; most Expressive components live there and many still require `@OptIn(ExperimentalMaterial3ExpressiveApi::class)`.

## Contents
- When to be expressive
- Color roles and pairing
- Typography
- Shape
- Motion
- Components catalog
- Migration from baseline M3
- Sources

## When to be expressive

| App type | Motion scheme | Shape use | Type emphasis |
|---|---|---|---|
| Consumer / media / social / lifestyle | `MotionScheme.expressive()` | Larger radii on hero surfaces; `MaterialShapes` for avatars, image crops, loading | Emphasized display/headline for hero moments |
| Productivity / finance / enterprise / dense data | `MotionScheme.standard()` | Baseline scale (4–28 dp); shape changes on press/selection only | Emphasized only for key numbers or states |
| Any | — | Never morph shapes on scroll-heavy repeated items | Never emphasize every heading |

Rule: expressive elements should point at the most important thing on the screen; if everything is emphasized, nothing is.

## Color roles and pairing

Use only intended pairs so contrast holds under dynamic color and high contrast:

| Fill | Content on it |
|---|---|
| primary / primaryContainer | onPrimary / onPrimaryContainer |
| secondary / secondaryContainer | onSecondary / onSecondaryContainer |
| tertiary / tertiaryContainer | onTertiary / onTertiaryContainer |
| error / errorContainer | onError / onErrorContainer |
| surface, surfaceContainer{Lowest, Low, (default), High, Highest} | onSurface, onSurfaceVariant |
| inverseSurface | inverseOnSurface, inversePrimary |

- Primary: FAB, high-emphasis buttons, active states. Secondary: tonal buttons, filter chips, selection. Tertiary: contrasting accents.
- Surface containers express depth (pane backgrounds, cards, navigation areas) instead of shadows; surfaceDim/surfaceBright keep their relative brightness in both themes.
- "Fixed" roles (primaryFixed, …) stay the same in light and dark — use for elements that must not flip.
- Dynamic color: `dynamicLightColorScheme(context)` / `dynamicDarkColorScheme(context)` on API 31+; fallback brand schemes from Material Theme Builder; harmonize off-palette brand colors toward primary rather than dropping them in raw.
- User contrast levels: standard, medium, high — ship contrast variants of your fallback schemes.

## Typography

Baseline + emphasized roles (sp; tracking in sp):

| Role | Size | Line height | Weight | Tracking | Emphasized weight |
|---|---|---|---|---|---|
| displayLarge | 57 | 64 | 400 | −0.25 | 500 |
| displayMedium | 45 | 52 | 400 | 0 | 500 |
| displaySmall | 36 | 44 | 400 | 0 | 500 |
| headlineLarge | 32 | 40 | 400 | 0 | 500 |
| headlineMedium | 28 | 36 | 400 | 0 | 500 |
| headlineSmall | 24 | 32 | 400 | 0 | 500 |
| titleLarge | 22 | 28 | 400 | 0 | 500 |
| titleMedium | 16 | 24 | 500 | 0.15 | 700 |
| titleSmall | 14 | 20 | 500 | 0.1 | 700 |
| bodyLarge | 16 | 24 | 400 | 0.5 | 500 |
| bodyMedium | 14 | 20 | 400 | 0.25 | 500 |
| bodySmall | 12 | 16 | 400 | 0.4 | 500 |
| labelLarge | 14 | 20 | 500 | 0.1 | 700 |
| labelMedium | 12 | 16 | 500 | 0.5 | 700 |
| labelSmall | 11 | 16 | 500 | 0.5 | 700 |

Emphasized styles are exposed as `displayLargeEmphasized`, `titleMediumEmphasized`, etc.

Typeface choice (as of 2026-09):
- Default: Roboto (system) or **Roboto Flex** (variable: weight, width, optical size, grade) for a Material-native look.
- **Google Sans Flex** is available on Google Fonts and powers Google's own M3E apps; use it only if its license fits your distribution and you want a Google-like voice — it makes an app look like a Google app.
- Brand fonts: map to roles (display/headline can be the brand face; body/label stay highly legible), include all weights you use, and keep `sp` so font scaling applies.
- Android 16 deprecates/disables the `elegantTextHeight` opt-out for apps targeting API 36; verify tall-script languages (Arabic, Thai, Devanagari…) don't clip.

## Shape

| Token | Radius | Typical use |
|---|---|---|
| none | 0 | Full-bleed images, edge panes |
| extraSmall | 4 dp | Small chips, snackbars, text field top corners |
| small | 8 dp | Chips, menus |
| medium | 12 dp | Cards, small FABs |
| large | 16 dp | FAB, navigation drawer/rail items, sheets' inner surfaces |
| **largeIncreased** | **20 dp** | Emphasized cards, pressed-state morphs |
| extraLarge | 28 dp | Dialogs, bottom sheets (top corners), large FAB |
| **extraLargeIncreased** | **32 dp** | Hero cards |
| **extraExtraLarge** | **48 dp** | Large hero containers |
| full | pill / circle | Buttons (round), badges, toggles |

`MaterialShapes` provides 35 `RoundedPolygon` shapes (from `androidx.graphics.shapes`, morphable with `Morph`): Circle, Square, Slanted, Arch, Fan, Arrow, SemiCircle, Oval, Pill, Triangle, Diamond, ClamShell, Pentagon, Gem, Sunny, VerySunny, Cookie4/6/7/9/12Sided, Ghostish, Clover4Leaf, Clover8Leaf, Burst, SoftBurst, Boom, SoftBoom, Flower, Puffy, PuffyDiamond, PixelCircle, PixelTriangle, Bun, Heart.

Use them for avatars, image masks, selected-state indicators, and loading — one or two per screen at most, never on body text containers or form fields.

## Motion

Spring tokens (damping ratio / stiffness):

| Token | Expressive | Standard |
|---|---|---|
| fastSpatial | 0.6 / 800 | 0.9 / 1400 |
| defaultSpatial | 0.8 / 380 | 0.9 / 700 |
| slowSpatial | 0.8 / 200 | 0.9 / 300 |
| fastEffects | 1.0 / 3800 | 1.0 / 3800 |
| defaultEffects | 1.0 / 1600 | 1.0 / 1600 |
| slowEffects | 1.0 / 800 | 1.0 / 800 |

- **Spatial** = position, size, rotation, shape (may overshoot). **Effects** = color, opacity (critically damped, no overshoot).
- **Fast** for small components (switches, buttons, chips), **default** for mid-size (sheets, cards expanding), **slow** for full-screen transitions.
- Compose: `MaterialTheme.motionScheme.fastSpatialSpec<Float>()`, `defaultEffectsSpec<Color>()`, etc.
- Legacy duration/easing tokens remain for non-spring cases: durations short1–4 = 50/100/150/200 ms, medium1–4 = 250–400 ms, long1–4 = 450–600 ms, extraLong1–4 = 700–1000 ms; easing emphasized `(0.2, 0, 0, 1)`, emphasizedDecelerate `(0.05, 0.7, 0.1, 1)`, emphasizedAccelerate `(0.3, 0, 0.8, 0.15)`, standard `(0.2, 0, 0, 1)`.
- Transition patterns: container transform (card → detail), shared axis (sibling steps), fade through (unrelated destinations), predictive back previews.
- Respect "Remove animations": when the animator duration scale is 0, springs must resolve instantly and nothing should depend on animation callbacks.

## Components catalog

| Component | Compose API | Specs and rules |
|---|---|---|
| Buttons (XS/S/M/L/XL) | `Button`, `FilledTonalButton`, `OutlinedButton`, `TextButton`, `ElevatedButton` with size defaults | Heights 32 / 40 / 56 / 96 / 136 dp; icons 20 / 20 / 24 / 32 / 40 dp; round or square; press morphs corners. One filled button per area. |
| Icon buttons | `IconButton`, `FilledIconButton`, toggle variants | 40 dp visual, 48 dp touch target; width variants (narrow/default/wide). |
| Button group | `ButtonGroup` (connected) | Replaces segmented buttons for single/multi-select; selection morphs shape. |
| Split button | `SplitButtonLayout` | Primary action + menu of related variants. |
| FAB | `FloatingActionButton`, `MediumFloatingActionButton`, `LargeFloatingActionButton`, `ExtendedFloatingActionButton` | 56 / 80 / 96 dp; icons 24 / 28 / 32 dp; one per screen; hides/extends on scroll as appropriate. |
| FAB menu | `FloatingActionButtonMenu` + `ToggleFloatingActionButton` | Opens a short list of related actions from the FAB. |
| Floating toolbar | `HorizontalFloatingToolbar`, `VerticalFloatingToolbar` | 64 dp, 16 dp from edges, fully rounded; can pair with a FAB; for contextual actions on the current page. |
| Bottom app bar | `FlexibleBottomAppBar` | Prefer the floating/docked toolbar for new designs. |
| Navigation bar | `ShortNavigationBar` + `ShortNavigationBarItem` (M3E flexible), `NavigationBar` (baseline) | 3–5 destinations; flexible bar is 64 dp (baseline 80 dp) and supports horizontal items on medium width. |
| Navigation rail | `WideNavigationRail`, `ModalWideNavigationRail`, `WideNavigationRailItem` | Collapsed ~96 dp (narrow 80 dp); expanded 220–360 dp; replaces the navigation drawer. |
| Top app bars | `TopAppBar`, `CenterAlignedTopAppBar`, `MediumFlexibleTopAppBar`, `LargeFlexibleTopAppBar`, `TwoRowsTopAppBar` | Title start-aligned by default; subtitles supported in flexible bars; scroll behaviors collapse/pin. |
| Loading | `LoadingIndicator`, `ContainedLoadingIndicator`; wavy `LinearProgressIndicator`/`CircularProgressIndicator` | Morphing-shape indicator for short indeterminate waits; determinate progress when you know the fraction. |
| Search | `SearchBar`, `ExpandedFullScreenSearchBar`, docked variants | In or replacing the top app bar. |
| Dialogs | `AlertDialog`, full-screen dialog | 28 dp corners; title start-aligned; confirm button rightmost; dismiss on scrim tap only for non-destructive. |
| Sheets | `ModalBottomSheet`, standard bottom sheet | Drag handle; choices and secondary actions; not for long forms. |
| Snackbar | `SnackbarHost` in `Scaffold` | One line (two max), ≤ 1 action, above FAB/nav bar; never for critical errors. |
| Carousels | `HorizontalMultiBrowseCarousel`, `HorizontalUncontainedCarousel` | Browsing visual items; keep a visible next item. |
| Menus | `DropdownMenu`, exposed dropdown | M3E menus gained shape/color options (late-2025 update). |

## Migration from baseline M3

1. Upgrade Compose Material3 to the 1.5 line (or the version your BOM provides) and add `@OptIn(ExperimentalMaterial3ExpressiveApi::class)` only in a design-system module.
2. Wrap the app in `MaterialExpressiveTheme(colorScheme = …, motionScheme = MotionScheme.expressive(), shapes = …, typography = …)`, passing light/dark and dynamic schemes explicitly.
3. Replace segmented buttons with `ButtonGroup`; baseline navigation bar with `ShortNavigationBar`; drawer with `WideNavigationRail` on medium+ and the navigation bar on compact.
4. Replace hand-written `tween()` specs in shared components with motion scheme specs.
5. Re-run screenshot tests in light/dark, dynamic color on/off, and 200% font scale.

Views/MDC-Android also ships M3 Expressive styles (Material Components 1.13+ line); Flutter support is partial and moving to the `material_ui` package.

## Sources

- androidx Compose Material3 source (androidx-main, Sept 2026): `tokens/TypeScaleTokens.kt`, `ShapeTokens.kt`, `MotionTokens.kt`, `StandardMotionTokens.kt`, `ExpressiveMotionTokens.kt`, button/FAB/navigation/floating-toolbar tokens, `MaterialShapes.kt`, `MaterialTheme.kt`, `MotionScheme.kt` — https://github.com/androidx/androidx/tree/androidx-main/compose/material3
- Material Design 3 — M3 Expressive: https://m3.material.io/blog/building-with-m3-expressive , motion physics: https://m3.material.io/blog/m3-expressive-motion-theming , components: https://m3.material.io/components
- Compose Material 3 releases: https://developer.android.com/jetpack/androidx/releases/compose-material3
- Android 16 behavior changes (elegantTextHeight): https://developer.android.com/about/versions/16/behavior-changes-16
- Material skill repos consulted for component status mapping: material-design-skill and material-3-skill (community mirrors of m3.material.io)
- Google Fonts: Roboto Flex, Google Sans Flex — https://fonts.google.com
