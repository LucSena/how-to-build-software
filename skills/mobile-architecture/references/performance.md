# Mobile Performance Budgets and Fixes

Budgets, measurement, and the fixes that matter most for startup, smoothness, memory, size, and battery. Official thresholds are marked as such; the rest is industry practice. As of 2026-09.

## Contents
- Budgets
- Measure first
- Startup
- Rendering and scrolling
- Memory
- App size
- Network and battery
- Cross-platform specifics
- CI and release gates
- Sources

## Budgets

| Metric | Budget | Source |
|---|---|---|
| Frame time | 16.67 ms @ 60 Hz; 8.33 ms @ 120 Hz (ProMotion, most flagship Androids) | Arithmetic; Android: render frames in under 16 ms |
| Frozen frame | Any frame > 700 ms is a defect | Android official |
| Scroll smoothness | < 1% slow frames in key lists | Industry practice |
| Cold start (TTID / first frame) | < 1 s on a mid-tier device; > 2 s is a release blocker | Industry practice |
| Full display (TTFD) | < 2 s to usable content (cached) | Industry practice |
| iOS launch | Apple's launch guidance has long aimed at roughly 400 ms to first frame; the watchdog kills launches that hang | Apple WWDC guidance |
| Tap → feedback | < 100 ms visual response | Doherty/response-time research |
| Crash rate (Play, overall / per phone model) | < 1.09% / < 8% user-perceived | Android vitals bad-behavior threshold |
| ANR rate (Play, overall / per phone model) | < 0.47% / < 8% user-perceived | Android vitals |
| Partial wake locks | < 5% excessive | Android vitals |
| Memory (Play, apps, foreground) | Below 2.00 GB (4 GB devices), 2.25 GB (6–8 GB), 3.25 GB (12 GB), 4.25 GB (16 GB); background thresholds roughly half | Android vitals memory thresholds (anonymous RSS + swap) |

Exceeding Play's bad-behavior thresholds can reduce store visibility and show a warning on the listing; Play evaluates the last 28 days.

## Measure first

- Always measure **release builds** (R8/optimized, no debugger) on a **mid-tier physical device**; debug builds of Compose, SwiftUI, and RN are misleading.
- Android: Macrobenchmark (startup, scroll, frame timing), Baseline Profile generator, JankStats in production, Perfetto/System Trace, Android Studio profilers, Play Console vitals.
- iOS: Instruments (App Launch, Time Profiler, Hitches/Animation Hitches, Allocations, Leaks), `XCTApplicationLaunchMetric` and `XCTOSSignpostMetric` in XCTest, MetricKit payloads in production, Xcode Organizer (launch, hangs, disk writes).
- Cross-platform: framework profilers (React Native DevTools / Hermes profiler, Flutter DevTools) plus the native tools above.

## Startup

Android:
- Measure TTID (logcat "Displayed") and TTFD (`reportFullyDrawn()` / `ReportDrawnWhen` in Compose after cached content renders).
- Ship **Baseline Profiles and Startup Profiles** (Now in Android does); run Macrobenchmark in CI.
- Use the `SplashScreen` API (Android 12+); no second custom splash activity.
- Defer initialization: lazy DI, App Startup library for ordered init, move SDK init (analytics, ads, remote config) after first frame or to background threads.
- No disk/network/JSON on the main thread; prefetch in parallel.
- R8 full mode, remove unused dependencies.

iOS:
- Reduce work before first frame: fewer dynamic frameworks (prefer static linking/mergeable libraries), no heavy `+load`/static initializers, lazy singletons.
- Render cached content first; kick off network after the first frame.
- Defer SDK initialization; avoid synchronous Keychain/disk reads on launch path where possible.
- Restore state quickly (`@SceneStorage`), don't rebuild the world.

Both: show real cached UI fast rather than a longer splash; perceived speed beats raw speed.

## Rendering and scrolling

Android (Compose):
- Stable keys + `contentType` in lazy lists; immutable UI models; check Compose compiler reports for unstable classes.
- `derivedStateOf` for fast-changing inputs; defer reads with lambda modifiers (`offset {}`, `graphicsLayer {}`, `drawBehind {}`); avoid backwards writes.
- Avoid nested scrolling containers of the same orientation; avoid measuring unbounded content.
- Images: request the display size (Coil size resolution), cache, avoid bitmaps decoded at full resolution.
- Android 17 ships a lock-free MessageQueue that reduces missed frames — but don't count on platform wins for your own main-thread work.

iOS (SwiftUI):
- Keep `body` cheap; move work into the model; avoid formatting/sorting in `body`.
- Use `List`/`LazyVStack` for long content; stable identities; avoid `AnyView` churn and huge view hierarchies inside rows.
- Split large observable models so views observe only what they read (Observation tracks accessed properties).
- Downsample images (ImageIO thumbnails) before display; `AsyncImage` respects HTTP caching in iOS 27, but use a caching pipeline for heavy image lists.
- Liquid Glass: group glass in `GlassEffectContainer`, avoid continuous glass animations; profile on older devices.

Both: animate transform/opacity rather than layout; interruptible springs; run gesture-driven animation on the UI/render thread.

## Memory

- Leaks: Android LeakCanary in debug; Instruments Leaks/Allocations/Memory Graph on iOS. Common causes: retained Activities/Views in singletons, closures capturing `self` strongly, listeners not removed.
- Images dominate memory: decode at display size, use memory + disk caches with limits, release on memory warnings / `onTrimMemory`.
- Android 17 enforces app memory limits based on device RAM tier; sessions killed this way report `REASON_OTHER` with "MemoryLimiter:AnonSwap" in `ApplicationExitInfo` — log exit reasons.
- Avoid holding entire datasets in memory; page from the DB.

## App size

- Android: publish App Bundles (split APKs per device), R8 shrinking and resource shrinking, vector drawables, WebP/AVIF images, Play Feature Delivery for rarely used features, Play Asset Delivery for large assets.
- iOS: app thinning is automatic from the App Store; asset catalogs; strip unused architectures/resources; on-demand resources or background assets for large content; watch dependency weight (each SDK adds size and launch time).
- Track size per release in CI; set a budget (e.g. no more than +5% per release without sign-off).

## Network and battery

- Batch requests; compress payloads; cache with HTTP semantics; prefetch only what is likely to be used.
- Background work through WorkManager / BGTaskScheduler with constraints (unmetered, charging) for heavy sync.
- Avoid wake locks and polling; use push for freshness.
- Location: lowest accuracy and frequency that satisfies the feature; stop updates when not visible.

## Cross-platform specifics

| Stack | Top rules |
|---|---|
| React Native | New Architecture + Hermes (V1 default since 0.84); FlashList for long lists; Reanimated/worklets for animations and gestures off the JS thread; avoid large re-renders (memoize, split state); `expo-image` for image caching; measure with release builds |
| Flutter | Impeller renderer (no shader-compile jank on Android 10+); `ListView.builder` with `itemExtent`/`prototypeItem`; `const` constructors; avoid `saveLayer`/opacity on large subtrees; DevTools performance overlay |
| KMP / CMP | Shared code is compiled natively; watch Kotlin/Native memory and startup of large shared modules; CMP on iOS: profile scrolling and text input on real devices |

## CI and release gates

- Macrobenchmark / XCTest performance tests on every release branch; fail on regression beyond a threshold (e.g. +10% startup).
- Baseline Profile generation in CI.
- App size diff report on pull requests.
- Staged rollout halts automatically (or by on-call rule) if crash/ANR rate exceeds the prior release by a set margin.
- Production monitoring: Play vitals, MetricKit, crash reporter performance traces, release-over-release dashboards.

## Sources

- Android vitals (bad-behavior thresholds, memory tiers): https://developer.android.com/google/play/vitals
- App startup time (TTID/TTFD): https://developer.android.com/topic/performance/vitals/launch-time
- Slow rendering and frozen frames: https://developer.android.com/topic/performance/vitals/render
- Baseline Profiles and Macrobenchmark: https://developer.android.com/topic/performance/baselineprofiles/overview , https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview
- Compose performance best practices: https://developer.android.com/develop/ui/compose/performance/bestpractices
- Android 17 behavior changes (app memory limits, MessageQueue): https://developer.android.com/about/versions/17/behavior-changes-all , https://developer.android.com/about/versions/17/behavior-changes-17
- Apple — Reducing your app's launch time: https://developer.apple.com/documentation/xcode/reducing-your-app-s-launch-time ; MetricKit: https://developer.apple.com/documentation/metrickit
- WWDC19 "Optimizing App Launch": https://developer.apple.com/videos/play/wwdc2019/423/
- React Native 0.84 release (Hermes V1 default): https://reactnative.dev/blog ; Flutter 3.44: https://flutter.dev/blog/whats-new-in-flutter-3-44
