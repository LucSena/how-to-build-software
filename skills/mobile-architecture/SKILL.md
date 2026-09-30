---
name: mobile-architecture
description: Use when choosing a mobile stack or structuring or shipping a mobile app. Covers native (SwiftUI, Compose) vs React Native/Expo vs Flutter vs Kotlin/Compose Multiplatform, app architecture (UDF, MVVM, UI/domain/data layers, @Observable, StateFlow), modularization, offline-first sync and conflict resolution, networking (timeouts, retries, pagination), performance budgets (startup, frame time, memory, size), deep links (Universal Links, App Links), push infrastructure, background work, security (Keychain, Keystore, secrets, certificate pinning), releases (phased rollout, OTA updates and store rules, feature flags, forced update), testing, and crash/ANR monitoring. Also use when the user says "Flutter or React Native?", "how should I structure my app", "make it work offline", "app is slow to start", "deep links don't open the app", or "how do we ship hotfixes". For screen-level UX use mobile-design; for platform visuals use ios-design or android-design; for backend APIs use api-design.
license: MIT
metadata:
  version: "1.0.1"
  category: mobile
  related: "mobile-design ios-design android-design software-architecture testing-strategy reliability"
---

# Mobile Architecture

Mobile apps run on devices you don't control, over networks that drop, through stores that gate every binary, for users who uninstall after one slow launch. The architecture that survives this is boring and explicit: a local database as the source of truth, unidirectional data flow, background sync with backoff, measured performance budgets, and releases you can halt. This skill picks the stack, shapes the layers, and sets the operational defaults (as of 2026-09) so the app is fast, works offline, and can be fixed quickly without breaking store rules.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also establish: team skills (Swift/Kotlin/TypeScript/Dart), platforms and minimum OS, how much of the app is OS integration (widgets, Live Activities, background, BLE, camera), offline needs, and release cadence.

## Core principles

1. **Choose the stack by team and OS-integration depth, not by hype.** The wrong stack costs a rewrite; the right one is usually the one your team already ships well.
2. **The local database is the source of truth.** UI observes local data; the network only writes into it. This gives instant launches, offline support, and one code path.
3. **Unidirectional data flow: state down, events up.** One immutable UI state per screen makes bugs reproducible and screens testable.
4. **Every network call has a timeout, bounded retries with backoff and jitter, and idempotency for writes.** Mobile networks fail constantly; unbounded work drains batteries and servers.
5. **Budget performance and measure it on mid-tier devices.** Startup, frame time, memory, and size regress silently unless a number guards them.
6. **Nothing secret ships in the binary.** Anything in the app can be extracted; secrets live on the server.
7. **Every release can be halted, and every feature can be turned off.** Staged rollouts, remote flags, and a minimum-version gate turn incidents into non-events.

## Workflow

- [ ] **Decide the stack** with the decision table (full matrix in `references/cross-platform-decision.md`); record it as an ADR.
- [ ] **Define layers and modules**: UI → (domain) → data; feature modules depend on core, never on each other's internals.
- [ ] **Model data offline-first**: local schema, sync strategy (pull/push/hybrid), write queue, conflict policy.
- [ ] **Define the network contract**: timeouts, retry policy, pagination, error model, auth refresh (with `api-design`).
- [ ] **Set budgets** (startup, frame, memory, size) and wire measurement into CI or release gates.
- [ ] **Plan platform integration**: deep links, push, background work, widgets, permissions.
- [ ] **Security pass**: secrets, token storage, transport, pinning decision, logging hygiene.
- [ ] **Release plan**: CI build/sign, staged rollout, OTA policy, feature flags, forced-update gate, crash/ANR alerts.
- [ ] **Validate** against Gotchas; fix and repeat.

## Choosing the stack

| Choose | When | Watch out for |
|---|---|---|
| **Native (SwiftUI + Jetpack Compose)** | Platform-flagship feel (Liquid Glass, M3 Expressive, predictive back), heavy OS integration (widgets, Live Activities/Updates, App Intents, watch, CarPlay), media/camera/AR performance, separate iOS and Android skills available | Two codebases; keep business rules in sync (or share them with KMP) |
| **Kotlin Multiplatform + native UI** | One tested data/sync/business layer, native UI per platform; Android-first Kotlin teams; brownfield adoption module by module | iOS devs consume Kotlin APIs (Swift Export is Alpha as of Kotlin 2.4); build tooling complexity |
| **Compose Multiplatform** | A Kotlin team wants shared UI too and accepts Material-leaning visuals on iOS or invests in per-platform theming | iOS-native feel (glass tab bars, scroll physics, text selection, VoiceOver) needs checking per release; wrap native views for bars |
| **React Native + Expo** | React/TypeScript team, fast iteration, OTA updates for JS, shared web knowledge | Use native navigation (`expo-router/native-tabs`, native stack) and New Architecture libraries; native modules for deep OS features |
| **Flutter** | Pixel-identical custom brand UI across mobile, web, desktop, embedded; animation-heavy design systems; Dart team | Draws its own UI: Liquid Glass and M3 Expressive fidelity lag; accessibility and platform conventions need deliberate work |
| **Web app / PWA wrapper** | Rarely for store distribution | App Store 4.2 minimum-functionality risk; no native navigation or gestures |

Red flags for any cross-platform choice: the app is mostly OS integrations (extensions, background execution, Bluetooth, widgets), or it has strict accessibility or performance targets you cannot verify in that framework. Versions and details: `references/cross-platform-decision.md`.

## App architecture

Default (both platforms, following the Android architecture guide and Now in Android; iOS equivalent in parentheses):

| Layer | Responsibility | Android | iOS |
|---|---|---|---|
| UI | Render state, send events | Compose + screen-level `ViewModel` exposing `StateFlow<UiState>` | SwiftUI + `@Observable` model owned by the view (`@State`) |
| Domain (optional) | Reusable business logic combining repositories | Use cases with a single `invoke` | Plain structs/actors |
| Data | Single public API to data; sync | Repositories over Room/DataStore + network data sources | Repositories over SwiftData/Core Data/GRDB + `URLSession` |

Rules:
- UI state is one immutable value per screen (a sealed Loading/Success/Error hierarchy or a struct with explicit flags); ViewModels transform flows/streams into it.
- Events flow down as method calls; one-off effects (navigate, snackbar) are state the UI consumes, not fire-and-forget channels.
- Repositories are the only way to data, even with one source; reads are streams (`Flow`, `AsyncSequence`, `@Query`), writes are suspend/async functions.
- ViewModels don't hold `Context`/`UIView`; no `AndroidViewModel`. UI-thread types are `@MainActor` on iOS (Swift 6 strict concurrency).
- DI: Hilt/Koin/Metro (Android/KMP), initializer injection or a small container (iOS). Avoid service locators in views.
- Modularize by feature when the team or build time demands it: `:feature:x:api` (navigation keys) / `:feature:x:impl`, `:core:*` (data, database, network, designsystem, model); features never depend on another feature's impl. iOS: Swift packages per feature and core.

Full patterns, code shapes, and TCA/Redux notes: `references/app-architecture.md`.

## Offline-first and sync (summary)

- Reads: UI observes the local DB; a missing network never errors a read — it shows cached data plus a sync status.
- Writes: for user data, default to **write-local-then-sync** (Android's "lazy writes"): persist locally with a pending flag and an idempotency key, then push via WorkManager / BGTaskScheduler / a background task with exponential backoff; roll back optimistic UI only on permanent failure. Use **online-only** writes for real-time transactions (payments, transfers) and fire-and-forget **queued** writes for analytics and logs.
- Sync: pull on app start/foreground + periodic; push-triggered pull (a silent/data push tells the app to fetch) for freshness; incremental with server change tokens or `updated_since` cursors.
- Conflicts: pick explicitly — last-write-wins with server timestamps (default for single-owner data), field-level merge for forms, server-authoritative for money/inventory, CRDTs only for true multi-writer collaboration.
- UX: "last synced" time, pending-change indicators, non-blocking offline banner (see `mobile-design`).

Details, schemas, and libraries: `references/offline-sync.md`.

## Networking defaults

| Concern | Default |
|---|---|
| Timeouts | Connect ~10 s; per-request ~15–30 s; uploads by progress, not a flat timeout |
| Retries | Only idempotent requests (GET, PUT, DELETE, or POST with an idempotency key); exponential backoff with jitter, max 3 attempts in the foreground; longer schedules belong to background sync |
| Pagination | Cursor-based; page size 20–50; prefetch the next page before the end; never unbounded lists |
| Caching | Respect HTTP cache headers (iOS 27 `AsyncImage` does by default); image caching library with downsampling |
| Auth | Short-lived access token + refresh token; single-flight refresh (one refresh while other requests wait); tokens in Keychain/Keystore-backed storage |
| Connectivity | Don't pre-check reachability; attempt the request and handle failure; observe connectivity only to trigger sync and update the banner |
| Payloads | Compressed, versioned API; tolerate unknown fields; old app versions keep working (users don't update) |

## Performance budgets

| Metric | Budget (mid-tier device, release build) |
|---|---|
| Cold start to first useful frame | < 1 s target (industry practice); treat > 2 s as a regression to fix before release |
| Frame time | 16.7 ms at 60 Hz; 8.3 ms at 120 Hz; slow frames < 1% while scrolling; no frozen frames (> 700 ms) |
| Tap → visual response | < 100 ms (show pressed/optimistic state immediately) |
| Main-thread I/O | None (DB, disk, network, JSON parsing off the main thread) |
| Crash-free sessions | ≥ 99.5% (industry practice); stay below Play thresholds (crash 1.09%, ANR 0.47%) |
| Memory | Stay well under Play's per-RAM-tier bad-behavior thresholds (e.g. foreground 2 GB on 4 GB devices); Android 17 enforces app memory limits by RAM tier |
| Download size | Keep as small as practical; App Bundles / app thinning; assets on demand |

Tools: Android Macrobenchmark, Baseline + Startup Profiles, JankStats, `reportFullyDrawn()`; iOS Instruments (App Launch, Hitches), MetricKit, `XCTApplicationLaunchMetric`. Details: `references/performance.md`.

## Platform integration

- **Deep links:** verified HTTPS links — iOS Universal Links (`apple-app-site-association` + Associated Domains) and Android App Links (`assetlinks.json` + `autoVerify`). Custom URL schemes only as a fallback. Every link builds a sensible back stack and handles logged-out and missing-data states.
- **Push:** APNs and FCM tokens registered per device and user, refreshed on change, deleted on logout and on invalid-token responses; minimal payloads (IDs, not personal data); server-side preferences per category; deep link from every notification.
- **Background work:** Android WorkManager (constraints, backoff; expedited only for user-visible urgency; foreground services with declared types for user-visible long work). iOS `BGTaskScheduler` (`BGAppRefreshTask`, `BGProcessingTask`; `BGContinuedProcessingTask` on iOS 26+ for user-started long tasks), background `URLSession` for transfers. Silent pushes are best-effort, never guaranteed.

Details: `references/release-ops.md` (links, push, background) and `references/offline-sync.md`.

## Security defaults

- Secrets (API keys with spending power, signing keys) never ship in the app; proxy through your backend. Public identifiers (e.g. a restricted maps key) are acceptable only when locked down by bundle ID/signature on the provider side.
- Tokens in Keychain (iOS) / Android Keystore-backed encryption; never in UserDefaults, SharedPreferences, or logs.
- TLS only; Android: network security config (cleartext off), certificate transparency is on by default for apps targeting API 37.
- Certificate pinning: default **no** for most apps (rotation outages brick clients); pin public keys with a backup key and a remote kill switch only for high-risk apps (banking, health), and plan rotation.
- Attestation for abuse-sensitive endpoints: App Attest / DeviceCheck (iOS), Play Integrity (Android).
- Biometrics gate local secrets via the platform APIs; passkeys over passwords.
- Strip PII from analytics and crash reports; obfuscate release builds (R8); treat deep-link parameters as untrusted input.

## Releases and operations (summary)

- **Staged rollout by default:** Play staged rollout (percentages you control, halt anytime); App Store phased release over 7 days (pausable). Watch crash/ANR rates before widening.
- **Feature flags** for risky features, with server-side kill switches; remove flags after rollout.
- **Forced update gate:** remote minimum supported version checked at launch → blocking "Update required" screen only for security or breaking-API reasons; Play In-App Updates API (immediate/flexible) on Android; App Store link on iOS.
- **OTA updates (React Native/Expo):** JS/asset-only updates for fixes and small changes; they must not change the app's primary purpose or add features that bypass review (Apple DPLA 3.3.1(B)); Play forbids downloading native executable code. Bind updates to a runtime/native version; roll out gradually; keep rollback ready.
- **Observability:** crash reporting with symbolication (dSYMs, R8 mapping files uploaded in CI), ANR and hang tracking, MetricKit/Android vitals, structured non-PII logs, release health dashboards.

Details: `references/release-ops.md`.

## Testing pointers

- Unit-test ViewModels/models and repositories with fakes (not mocks of your own classes); test sync logic, conflict resolution, and retry policies deterministically with a fake clock.
- UI tests for critical flows (XCUITest; Compose UI tests; Maestro or Detox for cross-platform E2E); screenshot tests at default and largest text sizes, light and dark.
- Performance tests: Macrobenchmark for startup and scrolling; XCTest metrics for launch; run on physical mid-tier devices in CI or before release.
- Test matrix: oldest supported OS, newest OS, small phone, large phone, tablet/foldable, offline and flaky network (Network Link Conditioner / emulator network throttling), process death/restore.
- Full strategy: `testing-strategy`.

## Gotchas

- **Picking cross-platform to "save half the cost"** for an app that is mostly widgets, background work, and OS integrations — the native modules end up doubling the work.
- **Network-first reads** (`fetch → render`, spinner on every launch). Read from the local DB; sync in the background.
- **Retrying non-idempotent POSTs** (duplicate orders/payments). Add idempotency keys; retry only safe requests.
- **No timeouts / infinite retries**, or retries without jitter that stampede the backend after an outage.
- **API keys in the bundle or `.env` compiled into the app.** Anyone can extract them; move calls server-side.
- **Tokens in UserDefaults/SharedPreferences** or printed in logs and crash reports.
- **Certificate pinning without a backup pin or kill switch** — a certificate rotation takes every installed client offline.
- **One-off events from ViewModels via channels/SharedFlow** that get lost on rotation; model them as state.
- **Main-thread database or JSON work**, unbounded lists without stable keys, full-size images in lists → jank and ANRs.
- **Assuming users update.** Old versions live for years; APIs must stay backward compatible, and the forced-update gate must exist *before* you need it.
- **OTA-updating new features** past store review, or shipping OTA updates incompatible with the installed native runtime.
- **Custom URL schemes as the main deep-link mechanism** — hijackable and unverified; use Universal Links/App Links.
- **Relying on silent push or exact timing for background work** — both platforms throttle; design for eventual sync.
- **Releasing to 100% at once** with no crash-rate gate.

## Output format

For a stack decision or architecture plan:

```
Decision: <stack> — why (team, OS integration, UI fidelity, sharing), rejected alternatives and why
Architecture: layers, state management, DI, modules (diagram or list)
Data: local store, sync strategy, write queue, conflict policy
Network: timeouts, retry, pagination, auth refresh, error model
Budgets: startup, frame, memory, size — how measured, where enforced
Integration: deep links, push, background work
Security: secrets, token storage, pinning decision, attestation
Release: CI, staged rollout, flags, OTA policy, forced-update gate, crash/ANR alerts
Risks & open questions
```

For a review: P0–P3 findings with Observed / Inferred / Not checked.

## References

| File | Read when |
|---|---|
| `references/cross-platform-decision.md` | choosing or defending a stack, or checking current versions/status of RN/Expo, Flutter, KMP/CMP |
| `references/app-architecture.md` | structuring layers, state, navigation, DI, or modules on Android, iOS, or cross-platform |
| `references/offline-sync.md` | designing local storage, sync, write queues, conflict resolution, or offline UX states |
| `references/performance.md` | the app is slow to start, janky, memory-hungry, or too large, or you need budgets and measurement tools |
| `references/release-ops.md` | setting up releases, OTA updates, feature flags, forced updates, deep links, push, background work, or crash/ANR monitoring |

## Related skills

- `mobile-design` — screen-level UX, permissions, offline states, and platform conventions.
- `ios-design` / `android-design` — platform UI, SwiftUI/Compose view-layer specifics, store review pitfalls.
- `software-architecture` — ADRs, module boundaries, and the backend side of the system.
- `api-design` — the API contract the app consumes (pagination, idempotency keys, errors, auth).
- `reliability` — timeouts, retries, circuit breakers, feature flags, incident practice.
- `testing-strategy` — test levels, doubles, flaky tests, mobile test tooling.
