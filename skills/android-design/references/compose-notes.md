# Jetpack Compose Implementation Notes

View-layer defaults for building Android designs in Compose, as of 2026-09. App architecture (layers, repositories, offline sync, modularization) lives in `mobile-architecture`.

## Contents
- Library versions (check before pinning)
- Theme setup
- Edge-to-edge and insets
- Back handling
- Navigation 3
- State and lifecycle
- Forms, keyboard, autofill
- Semantics (TalkBack)
- Haptics
- Performance
- Previews and screenshot tests
- Cross-platform notes
- Sources

## Library versions (check before pinning)

| Library | State as of 2026-09 | Note |
|---|---|---|
| Compose Material3 | 1.5.0 in beta on androidx-main; most M3 Expressive APIs are here, many still `@ExperimentalMaterial3ExpressiveApi` | Stable 1.4.0 lacks most Expressive components; expect 1.5.0 stable late 2026 / early 2027 |
| Material3 Adaptive | 1.4 alpha line on main | `currentWindowAdaptiveInfo`, pane scaffolds, Navigation 3 scene strategies |
| Navigation 3 | 1.0 stable (used by Now in Android); newer alphas on main | Recommended for new Compose apps |
| Kotlin / Compose compiler | Kotlin 2.x; strong skipping on by default | Use the Compose compiler Gradle plugin |

Always read the Jetpack release notes for the exact versions your BOM resolves; keep experimental opt-ins inside a design-system module.

## Theme setup

```kotlin
@Composable
fun AppTheme(darkTheme: Boolean = isSystemInDarkTheme(), dynamicColor: Boolean = true, content: @Composable () -> Unit) {
    val context = LocalContext.current
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        darkTheme -> BrandDarkColors
        else -> BrandLightColors
    }
    MaterialExpressiveTheme(          // or MaterialTheme(...) if you stay on baseline M3
        colorScheme = colorScheme,    // always pass it: the expressive default is a light scheme
        motionScheme = MotionScheme.expressive(),   // MotionScheme.standard() for utilitarian apps
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}
```

- Read roles from `MaterialTheme.colorScheme`, `.typography`, `.shapes`, `.motionScheme`; never hard-code hex values or `sp` sizes inside components.
- Brand fonts: `FontFamily(Font(R.font.brand_regular, FontWeight.Normal), ...)` mapped into `Typography(displayLarge = …)`; keep `sp`.

## Edge-to-edge and insets

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()                 // before super/setContent
    super.onCreate(savedInstanceState)
    setContent { AppTheme { App() } }
}
// Manifest: android:windowSoftInputMode="adjustResize"
```

| Situation | Handling |
|---|---|
| Screen built on M3 `Scaffold` | Top bar / nav bar consume insets; apply `innerPadding` to content |
| Custom full-screen content | `Modifier.safeDrawingPadding()` or `windowInsetsPadding(WindowInsets.safeDrawing)` |
| Lists behind the nav bar | `LazyColumn(contentPadding = WindowInsets.navigationBars.asPaddingValues())` (plus your own padding) |
| Keyboard | `Modifier.imePadding()` on the scroll container or bottom bar |
| Cutouts in landscape | `WindowInsets.displayCutout` |
| Desktop windowing | `WindowInsets.captionBar` (included in `systemBars`) |
| Swipeable controls near edges | Keep them out of `WindowInsets.systemGestures` / `safeGestures` |

Don't consume insets twice (padding from `Scaffold` plus `safeDrawingPadding` inside doubles the gap).

## Back handling

```kotlin
// Simple: close an in-app surface
BackHandler(enabled = isSearchOpen) { closeSearch() }

// Predictive: animate with the gesture
PredictiveBackHandler(enabled = isSheetOpen) { progress: Flow<BackEventCompat> ->
    try {
        progress.collect { event -> sheetOffset = event.progress }   // 0f..1f
        closeSheet()                                                 // committed
    } catch (e: CancellationException) {
        resetSheet()                                                 // user cancelled
        throw e
    }
}
```

- `onBackPressed()` and `KEYCODE_BACK` are not delivered to apps targeting API 36 on Android 16+. Views apps use `onBackPressedDispatcher.addCallback(owner, callback)` with `isEnabled` tied to state.
- Newer: `androidx.navigationevent` provides `NavigationBackHandler`/`NavigationEventHandler` used by Navigation 3; prefer what your navigation library integrates with.
- Temporary opt-out while migrating: `android:enableOnBackInvokedCallback="false"` — plan to remove it.

## Navigation 3

```kotlin
@Serializable data object Home : NavKey
@Serializable data class Detail(val id: String) : NavKey

@Composable
fun AppNav() {
    val backStack = rememberNavBackStack(Home)
    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryProvider = entryProvider {
            entry<Home> { HomeScreen(onOpen = { id -> backStack.add(Detail(id)) }) }
            entry<Detail> { key -> DetailScreen(key.id) }
        },
    )
}
```

- You own the back stack (a snapshot-state list of keys); deep links construct the stack directly (e.g. `[Home, Detail(id)]`) so back leads somewhere sensible.
- One back stack per top-level destination for tab-like navigation; switching tabs swaps stacks, re-selecting the current tab pops to its root.
- ViewModels scoped to entries via the lifecycle-viewmodel-navigation3 integration; adaptive list-detail via `ListDetailSceneStrategy`.
- Single activity; Compose for new screens.

## State and lifecycle

- Screen-level `ViewModel` exposes `val uiState: StateFlow<UiState>` (sealed interface of immutable data classes); collect with `collectAsStateWithLifecycle()`.
- Stateless composables take `(state, onEvent…)`; hoist state to the lowest common owner.
- `rememberSaveable` for UI state that must survive configuration change and process death (text drafts, selected tab, scroll).
- Lifecycle-aware effects: `LifecycleStartEffect`, `LifecycleResumeEffect`; `LaunchedEffect(key)` for work tied to composition.
- One-off events (navigate, show snackbar) are modeled as state the UI consumes and acknowledges, not as fire-and-forget channels from the ViewModel.

## Forms, keyboard, autofill

```kotlin
OutlinedTextField(
    value = email, onValueChange = onEmail,
    label = { Text("Email") },
    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next, autoCorrectEnabled = false),
    keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
    isError = emailError != null,
    supportingText = { emailError?.let { Text(it) } },
    modifier = Modifier.semantics { contentType = ContentType.EmailAddress },   // autofill
)
```

- Autofill content types include `ContentType.Username`, `EmailAddress`, `NewPassword`, `SmsOtpCode`; passkeys and saved passwords via Credential Manager.
- OTP: SMS Retriever or SMS User Consent API; Android 17 delays standard OTP SMS about 3 hours for apps targeting API 37.
- Labels stay visible (use `label`, not placeholder-only); errors in `supportingText` and announced.

## Semantics (TalkBack)

| Need | API |
|---|---|
| Label an icon button | `Icon(..., contentDescription = "Delete")`; decorative: `contentDescription = null` |
| Merge a row | `Modifier.semantics(mergeDescendants = true) {}` or `clickable` on the row |
| Custom actions for swipe | `Modifier.semantics { customActions = listOf(CustomAccessibilityAction("Archive") { archive(); true }) }` |
| Headings | `Modifier.semantics { heading() }` |
| State | `stateDescription`, `toggleableState`, `selected` |
| Live updates | `Modifier.semantics { liveRegion = LiveRegionMode.Polite }` |
| Role | `Modifier.clickable(role = Role.Button)` / `Role.Switch` |
| Traversal | `isTraversalGroup`, `traversalIndex` |

Touch targets: M3 components apply `minimumInteractiveComponentSize()` (48 dp); custom clickables add it or size ≥ 48 dp.

## Haptics

- Compose: `LocalHapticFeedback.current.performHapticFeedback(HapticFeedbackType.Confirm)` (types include `Confirm`, `Reject`, `SegmentTick`, `TextHandleMove`, `LongPress`, `ToggleOn/Off`, `GestureThresholdActivate` in recent Compose versions).
- Views: `view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)`.
- Many M3 components already emit appropriate haptics; don't double them.

## Performance

- Stable keys and `contentType` in lazy lists: `items(list, key = { it.id }, contentType = { it.type })`.
- `remember` expensive computations; `derivedStateOf` for values derived from fast-changing state (scroll position → "show FAB").
- Defer state reads to layout/draw: `Modifier.offset { }`, `graphicsLayer { }`, `drawBehind { }` instead of reading animated values in composition.
- Never write state you just read in the same composition (backwards writes cause infinite recomposition).
- Immutable UI models (`data class` with `val`s, immutable collections); check compiler reports for unstable parameters.
- Release builds with R8; Baseline Profiles + Startup Profiles; measure with Macrobenchmark and JankStats; debug builds are not representative.
- Images: sized requests and caching (Coil); avoid decoding full-resolution bitmaps in lists.

## Previews and screenshot tests

- `@PreviewLightDark`, `@PreviewFontScale`, `@PreviewScreenSizes` (or custom multipreview annotations) on key screens.
- Screenshot tests with Compose Preview Screenshot Testing or Roborazzi for compact/medium/expanded, light/dark, 200% font.
- UI tests with `createComposeRule`, asserting semantics (which also checks accessibility labels).

## Cross-platform notes

- **React Native / Expo:** use `expo-router/native-tabs` (Material bar on Android) and native stacks; RN 0.86 fixed several edge-to-edge issues (`KeyboardAvoidingView` on 15+, `StatusBar` with modals); use `react-native-safe-area-context` everywhere and test Android 15+ edge-to-edge.
- **Flutter:** Material widgets are moving to the `material_ui` package; M3 Expressive support is partial — budget for custom components; use `SafeArea` and `MediaQuery.viewPaddingOf` for insets and `PopScope` for predictive back.
- **Compose Multiplatform:** shared Material UI; Navigation 3 is available on non-Android targets since CMP 1.10.

## Sources

- Edge-to-edge setup: https://developer.android.com/develop/ui/compose/system/setup-e2e
- Predictive back: https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture ; androidx.activity.compose reference (`BackHandler`, `PredictiveBackHandler`): https://developer.android.com/reference/kotlin/androidx/activity/compose/package-summary
- Navigation 3 reference (`NavDisplay`, `rememberNavBackStack`, `entryProvider`): https://developer.android.com/reference/kotlin/androidx/navigation3/runtime/package-summary , https://developer.android.com/reference/kotlin/androidx/navigation3/ui/package-summary
- Architecture recommendations: https://developer.android.com/topic/architecture/recommendations
- Compose performance best practices: https://developer.android.com/develop/ui/compose/performance/bestpractices
- Compose autofill `ContentType` and `HapticFeedbackType` references: https://developer.android.com/reference/kotlin/androidx/compose/ui/autofill/ContentType , https://developer.android.com/reference/kotlin/androidx/compose/ui/hapticfeedback/HapticFeedbackType
- Accessibility touch targets: https://developer.android.com/guide/topics/ui/accessibility/apps
- androidx `MaterialTheme.kt` (MaterialExpressiveTheme defaults) and `libraryversions.toml`: https://github.com/androidx/androidx
- React Native 0.86 release notes: https://reactnative.dev/blog/2026/06/11/react-native-0.86
- Now in Android: https://github.com/android/nowinandroid
