# Choosing a Mobile Stack

A decision guide for native vs React Native/Expo vs Flutter vs Kotlin Multiplatform/Compose Multiplatform. Versions are **as of 2026-09** and move quickly — check release notes before quoting them.

## Contents
- Decision questions
- Scoring matrix
- Current state of each stack (2026-09)
- Stack-specific architecture notes
- Brownfield and migration paths
- ADR template
- Sources

## Decision questions

Answer these first; they decide most cases:

1. **What does the team already ship well?** Swift/Kotlin, TypeScript/React, Dart, or Kotlin-only? Retraining costs months.
2. **How much of the app is OS integration?** Widgets, Live Activities/Live Updates, App Intents/Shortcuts, extensions, background execution, Bluetooth, NFC, HealthKit/Health Connect, CarPlay/Android Auto, watch apps. The more, the stronger the case for native (or KMP with native UI).
3. **How platform-native must the UI feel?** Liquid Glass bars, M3 Expressive, predictive back, system sheets — native and RN with native primitives get these; Flutter and CMP need extra work.
4. **How custom is the visual design?** Fully branded, animation-heavy, pixel-identical across platforms favors Flutter.
5. **What must be shared?** Business logic only (KMP), UI too (RN, Flutter, CMP), or with a web app (RN/React, Flutter web, KMP for logic)?
6. **How fast must you ship fixes?** OTA JavaScript updates (RN/Expo) shorten fix time for JS-only bugs, within store rules.
7. **Performance and accessibility targets** — can you verify them in the framework (profilers, screen reader behavior) before committing?

## Scoring matrix

Score 1 (poor) to 3 (strong) for your situation; weight by importance.

| Criterion | Native | KMP + native UI | Compose MP | RN + Expo | Flutter |
|---|---|---|---|---|---|
| Platform look & feel out of the box | 3 | 3 | 2 | 2–3 (with native tabs/stack) | 1–2 |
| New OS features on day one | 3 | 3 | 2 | 2 (native module or Expo package) | 1–2 |
| Code sharing across iOS/Android | 1 | 2 (logic) | 3 | 3 | 3 |
| Sharing with web | 1 | 2 (logic) | 1–2 | 3 (React) | 2 |
| Custom branded UI consistency | 2 | 2 | 3 | 2 | 3 |
| Iteration speed / hot reload | 2 | 2 | 3 (Compose Hot Reload) | 3 | 3 |
| OTA fixes | 1 | 1 | 1 | 3 | 1–2 (third-party tools only) |
| Performance ceiling | 3 | 3 | 2–3 | 2–3 | 2–3 |
| Hiring pool | 2 | 2 | 1–2 | 3 | 2 |
| Accessibility with least effort | 3 | 3 | 2 | 2 | 2 |

Default recommendations:
- **Small team, React/web background, content or commerce app** → React Native + Expo.
- **Android-first Kotlin team, needs native iOS feel** → KMP for data/domain, SwiftUI + Compose UI.
- **Kotlin team, internal/enterprise or brand-uniform app** → Compose Multiplatform.
- **Brand-heavy, custom-drawn, multi-target (mobile + desktop + embedded)** → Flutter.
- **OS-integration-heavy, flagship platform quality, separate iOS/Android devs** → Native.

## Current state of each stack (2026-09)

### Native
- iOS 27 / Xcode 27 (iOS 27 released 2026-09-14); SwiftUI with Observation, Swift 6 strict concurrency; Liquid Glass mandatory once you build with the iOS 27 SDK.
- Android 17 (API 37) stable since June 2026; Play requires target API 36 since 2026-08-31; Compose + Material3 (1.5 line for M3 Expressive), Navigation 3.

### React Native + Expo
- React Native **0.87** (2026-08-11) latest stable: strict TypeScript API by default (deep imports become type errors), faster Metro source maps, experimental Swift Package Manager support, Node ≥ 22.13. 0.88 in release candidates.
- New Architecture only since 0.82 (Fabric renderer, TurboModules via Codegen, JSI, bridgeless); Hermes V1 default since 0.84; 0.85 added a shared animation backend; 0.86 fixed Android edge-to-edge issues. The project now lives under the React Foundation.
- Expo **SDK 57** (2026-06-30, RN 0.86) latest stable; SDK 58 in development (RN 0.88 RC, `expo-router/native-tabs` stable, default app directory `src/app/`).
- Native-feel tooling: Expo Router native tabs (real system tab bar: Liquid Glass on iOS 26+, Material on Android), native stack, `@expo/ui` (SwiftUI and Compose components), `expo-glass-effect`, `expo-symbols`, `expo-widgets`, `expo-app-intents`.
- Defaults: FlashList for long lists, Reanimated 4 / worklets for gesture-driven animation, `react-native-safe-area-context`, `react-native-keyboard-controller`, EAS Build/Update.

### Flutter
- Flutter **3.44** / Dart 3.12 (May 2026). Impeller is the renderer; on Android 10+ Skia has been removed (no shader-compilation jank).
- Material and Cupertino libraries are being moved out of the SDK into `material_ui` and `cupertino_ui` packages (in-SDK versions code-frozen). Whether their 1.0 releases have shipped by 2026-09 is unverified — check pub.dev.
- Draws its own UI: Cupertino widgets do not become Liquid Glass automatically; M3 Expressive support is partial. Use platform views or packages for native bars if fidelity matters.

### Kotlin Multiplatform / Compose Multiplatform
- Kotlin **2.4.0** (June 2026): Swift Export in Alpha (idiomatic Swift APIs instead of Objective-C headers); faster Kotlin/Native builds.
- Compose Multiplatform **1.12** (Aug 2026); iOS stable since 1.8 (May 2025); 1.10 brought common previews, Navigation 3 on non-Android targets, and bundled Compose Hot Reload.
- Typical shared stack: Ktor, kotlinx.serialization, coroutines/Flow, SQLDelight or Room (KMP), DataStore, Koin or Metro for DI.
- CMP renders Material-style UI on iOS by default; for iOS-native feel keep a SwiftUI shell or wrap UIKit/SwiftUI views; verify VoiceOver, text selection, and scroll physics.

## Stack-specific architecture notes

| Topic | Native | KMP + native UI | Compose MP | RN + Expo | Flutter |
|---|---|---|---|---|---|
| UI state | ViewModel + StateFlow / `@Observable` | Shared ViewModel-like state holders exposed as Flow → wrapped for SwiftUI | Shared ViewModel (Jetpack lifecycle KMP) | React state + server-state cache (TanStack Query) + a small client store | Riverpod or Bloc |
| Navigation | Navigation 3 / `NavigationStack` | Native per platform | Navigation 3 | Expo Router (file-based, typed routes, deep links built in) | go_router |
| Local DB | Room / SwiftData, GRDB | SQLDelight / Room KMP | SQLDelight / Room KMP | expo-sqlite, WatermelonDB, sync services | drift, sqflite |
| Background | WorkManager / BGTaskScheduler | Platform schedulers calling shared code | same | expo-background-task + native | workmanager plugin + native |
| Testing | JUnit/XCTest, Compose UI/XCUITest | Shared unit tests in commonTest | commonTest + UI tests | Jest + React Native Testing Library, Maestro/Detox | flutter_test, integration_test, golden tests |

## Brownfield and migration paths

- **Native → KMP:** start with one pure-logic module (validation, formatting, models), then the data layer (network + DB + sync); keep UI native.
- **Native → RN:** embed RN screens in the native app for new features (brownfield), keep native shells for navigation; or full rewrite only with a strong reason.
- **RN legacy architecture → New Architecture:** mandatory since 0.82; audit libraries for New Architecture support first, replace unmaintained ones.
- **Flutter → native pieces:** platform views for maps, video, or native bars; method channels/Pigeon for platform APIs.
- Avoid big-bang rewrites; migrate screen by screen behind feature flags.

## ADR template

```
# ADR-00X: Mobile stack
Status: accepted | Date: YYYY-MM-DD
Context: team skills, platforms/min OS, OS integrations needed, UI fidelity goal, sharing goal, release cadence
Decision: <stack>
Alternatives considered: <stack> — rejected because …
Consequences: what gets easier, what gets harder (e.g. widgets need native modules), revisit trigger
```

## Sources

- React Native release notes: 0.85 https://reactnative.dev/blog/2026/04/07/react-native-0.85 , 0.86 https://reactnative.dev/blog/2026/06/11/react-native-0.86 , 0.87 https://reactnative.dev/blog/2026/08/11/react-native-0.87
- Expo changelogs (SDK 55–57): https://expo.dev/changelog ; Expo Router native tabs: https://docs.expo.dev/router/advanced/native-tabs/
- Flutter 3.44: https://flutter.dev/blog/whats-new-in-flutter-3-44 ; material_ui / cupertino_ui migration: https://docs.flutter.dev/release/breaking-changes/material-ui-and-cupertino-ui
- JetBrains: Compose Multiplatform 1.12 https://blog.jetbrains.com/kotlin/2026/08/compose-multiplatform-1-12-0/ , 1.10 https://blog.jetbrains.com/kotlin/2026/01/compose-multiplatform-1-10-0/ , Kotlin 2.4.0 https://blog.jetbrains.com/kotlin/2026/06/kotlin-2-4-0-released/
- Android 17 release: https://android-developers.googleblog.com/2026/06/Android-17.html ; Play target API requirement: https://developer.android.com/google/play/requirements/target-sdk
- Apple: What's new in iOS 27 https://developer.apple.com/ios/whats-new/ ; App Review 4.2: https://developer.apple.com/app-store/review/guidelines/
