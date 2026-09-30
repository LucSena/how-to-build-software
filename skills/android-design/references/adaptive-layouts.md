# Android Adaptive Layouts

Designing one app that works on phones, foldables, tablets, ChromeOS, desktop windowing, and connected displays. As of 2026-09 (Android 16/17, Compose Material3 Adaptive 1.x, Navigation 3).

## Contents
- Window size classes
- Navigation by width
- Canonical layouts
- Android 16/17 resizability and orientation rules
- Foldables and postures
- Desktop windowing, keyboard, mouse
- Margins and spacing
- Testing matrix
- Sources

## Window size classes

Width classes (dp) — branch on these, never on device type or orientation:

| Class | Width | Share of devices (official) | Examples |
|---|---|---|---|
| Compact | < 600 | 99.96% of phones in portrait | Phones portrait, narrow split screen |
| Medium | 600–839 | 93.73% of tablets in portrait; most unfolded inner displays in portrait | Tablet portrait, foldable open |
| Expanded | 840–1199 | 97.22% of tablets in landscape | Tablet landscape, large unfolded landscape |
| Large | 1200–1599 | — | Large tablets, desktop windows |
| Extra-large | ≥ 1600 | — | Desktop, connected displays |

Height classes: Compact < 480 (99.78% of phones in landscape), Medium 480–899, Expanded ≥ 900.

Constants: `WindowSizeClass.WIDTH_DP_MEDIUM_LOWER_BOUND` (600), `WIDTH_DP_EXPANDED_LOWER_BOUND` (840), `WIDTH_DP_LARGE_LOWER_BOUND` (1200), `WIDTH_DP_EXTRA_LARGE_LOWER_BOUND` (1600), `HEIGHT_DP_MEDIUM_LOWER_BOUND` (480), `HEIGHT_DP_EXPANDED_LOWER_BOUND` (900).

```kotlin
@Composable
fun MyApp(
    windowSizeClass: WindowSizeClass =
        currentWindowAdaptiveInfo(supportLargeAndXLargeWidth = true).windowSizeClass
) {
    val twoPane = windowSizeClass.isWidthAtLeastBreakpoint(WindowSizeClass.WIDTH_DP_EXPANDED_LOWER_BOUND)
    val showTopBar = windowSizeClass.isHeightAtLeastBreakpoint(WindowSizeClass.HEIGHT_DP_MEDIUM_LOWER_BOUND)
    // pass booleans down as state
}
```

Design order recommended by Android: optimize for expanded first (most room for change), then decide what medium needs, then confirm compact.

## Navigation by width

| Width | Default navigation | Notes |
|---|---|---|
| Compact | Navigation bar (3–5 destinations) | Flexible/short bar in M3E |
| Medium | Navigation rail (collapsed) | Flexible nav bar with horizontal items is also acceptable |
| Expanded+ | Navigation rail, collapsed or expanded (expanded can be persistent) | Expanded rail replaces the navigation drawer |

Use `NavigationSuiteScaffold` to switch automatically; override the layout type only with a reason. Keep the same destinations and order at every size.

## Canonical layouts

### List-detail
- **Expanded:** list and detail side by side; selecting an item updates the detail pane.
- **Medium/compact:** show list *or* detail; selecting shows detail; back returns to the list.
- **Resizing:** expanded → narrower keeps the detail visible and hides the list; detail-only → expanded shows both with the item selected; list-only → expanded shows list + placeholder detail.
- Compose: `ListDetailPaneScaffold` + `rememberListDetailPaneScaffoldNavigator()`; with Navigation 3, the adaptive `ListDetailSceneStrategy`. Hoist selection and window size class so all panes render consistently; add a `BackHandler` only for the single-pane detail case.
- Fits: messaging, email, contacts, settings, file browsers.

### Supporting pane
- Primary content takes about two-thirds; a secondary pane shows related context (comments, properties, related items).
- On compact, the supporting content moves below, into a bottom sheet, or behind an action.
- Compose: `SupportingPaneScaffold` + `rememberSupportingPaneScaffoldNavigator()`.

### Feed
- Grid of equivalent items; column count adapts to width.
- Compose: `LazyVerticalGrid(columns = GridCells.Adaptive(minSize = 180.dp))`; full-width headers with `GridItemSpan(maxLineSpan)`; emphasize items by span, not by random sizes.
- On compact, a grid collapses to a single column automatically.

### Beyond canonical
- Cap reading width (roughly 600–840 dp for text columns) instead of stretching; center or add a supporting pane.
- Dialogs become larger centered dialogs, not full-screen, on expanded widths; bottom sheets may become side sheets.
- Use extra room to reveal more (toolbar actions out of overflow), never to change what the app can do.

## Android 16/17 resizability and orientation rules

| Target API | Behavior on displays with smallest width ≥ 600 dp |
|---|---|
| ≤ 35 | Manifest orientation/resizability/aspect-ratio restrictions honored (letterboxing possible) |
| 36 (Android 16) | `screenOrientation`, `resizeableActivity="false"`, `minAspectRatio`/`maxAspectRatio`, and `setRequestedOrientation()` are **ignored**; app fills the window. A temporary opt-out exists. |
| 37 (Android 17) | Same, and the opt-out is **removed** |

- Exempt: games. Unaffected: phones (< 600 dp smallest width).
- Consequences: handle configuration changes without losing state (`rememberSaveable`, ViewModel, `SavedStateHandle`); camera previews must handle rotation; landscape and portrait layouts must both work on tablets.
- Android 17 also delivers some configuration changes to running activities rather than recreating them — don't assume recreation to reset UI; test rotation/resize with state in progress.

## Foldables and postures

- Get fold info from `WindowInfoTracker` / `FoldingFeature` (in Compose, `currentWindowAdaptiveInfo().windowPosture` and hinge bounds).
- **Book posture** (vertical hinge, half-open): two panes split at the hinge.
- **Tabletop posture** (horizontal hinge, half-open): content (video, camera preview) on the top half, controls on the bottom half.
- Keep text and touch targets out of the hinge area when `isSeparating` is true.
- Preserve state and scroll position across fold/unfold (screen continuity).
- Test on the Android Emulator foldable profiles and resizable emulator.

## Desktop windowing, keyboard, mouse

- Apps in desktop windowing get a caption bar; include `WindowInsets.captionBar` (part of `systemBars`) in insets handling, even in immersive mode.
- Support free-form resizing to any size, including very small windows; never assume a minimum width.
- Keyboard: focus order, visible focus indicators, `Tab`/arrow navigation, common shortcuts (Ctrl+F, Ctrl+N, Ctrl+Z, Esc to dismiss), Enter to submit.
- Mouse/trackpad: hover states, right-click context menus, scroll wheel, drag and drop between apps (`dragAndDropSource`/`dragAndDropTarget`).
- Stylus where relevant (drawing, annotation, handwriting input).
- Android 17 adds a Handoff API for continuing an activity on another Android device — keep task state serializable if you adopt it.

## Margins and spacing

| Width | Margin | Pane spacer |
|---|---|---|
| Compact | 16 dp | — |
| Medium | 24 dp | 24 dp |
| Expanded and up | 24 dp | 24 dp |

Spacing grid: 4 dp base, 8 dp for most layout spacing. (Margins are Material guidance; verify against your design system.)

## Testing matrix

| Configuration | How |
|---|---|
| Phone portrait/landscape | Emulator or device, gesture nav and 3-button nav |
| Foldable folded/unfolded, tabletop | Foldable emulator profile |
| Tablet portrait/landscape | Tablet emulator (medium and expanded) |
| Split screen 50/50 and 1/3 | Multi-window on tablet |
| Desktop window, resized small | Resizable emulator / desktop windowing |
| Font scale 200%, display size large | `adb shell settings put system font_scale 2.0` |
| Dark theme | `adb shell cmd uimode night yes` |

Screenshot-test key screens at compact/medium/expanded with Compose Preview Screenshot Testing or Roborazzi.

## Sources

- Use window size classes: https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
- Canonical layouts: https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts
- androidx `window-core` `WindowSizeClass.kt` (breakpoint constants): https://github.com/androidx/androidx/tree/androidx-main/window/window-core
- Android 17 behavior changes (large-screen opt-out removal): https://developer.android.com/about/versions/17/behavior-changes-17
- Prepare for resizability and orientation changes in Android 17: https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17
- Edge-to-edge setup (caption bar, desktop windowing): https://developer.android.com/develop/ui/compose/system/setup-e2e
- Android 17 features (Handoff): https://developer.android.com/about/versions/17/features
- Compose Material3 Adaptive reference (`currentWindowAdaptiveInfo`, `ListDetailSceneStrategy`): https://developer.android.com/reference/kotlin/androidx/compose/material3/adaptive/package-summary
- Now in Android (NavigationSuiteScaffold, list-detail with Navigation 3): https://github.com/android/nowinandroid
