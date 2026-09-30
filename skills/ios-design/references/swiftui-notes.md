# SwiftUI Implementation Notes (iOS 17–27)

Practical defaults for turning an iOS design into SwiftUI, as of 2026-09 (Xcode 27, iOS 27 SDK). App-level architecture (layers, offline sync, DI) lives in `mobile-architecture`; this file covers the view layer.

## Contents
- State and data flow
- Navigation
- Presentation
- Typography, color, and adaptivity in code
- Forms and keyboard
- Accessibility modifiers
- Haptics and motion
- iOS 27 API changes worth adopting
- Previews and verification
- Cross-platform equivalents
- Sources

## State and data flow

| Need | Default | Notes |
|---|---|---|
| Screen state / view model | `@Observable` class (Observation, iOS 17+) owned with `@State` | In iOS 27, `@State` is a macro and initializes stored classes lazily, once per view lifetime. |
| Pass a model for editing | `@Bindable var model` | Replaces `@ObservedObject` for `@Observable` types. |
| App-wide dependency | `.environment(store)` + `@Environment(Store.self)` | Keep it small: session, services, settings. |
| Local UI state | `@State` private value types | Text field drafts, expanded flags. |
| Persist per scene | `@SceneStorage` | Selected tab, scroll anchor, draft IDs. |
| User defaults | `@AppStorage` | Small preferences only; never secrets (use Keychain). |
| Async work tied to a view | `.task(id:)` | Cancels automatically when the view disappears or `id` changes. |

- Mark UI types `@MainActor`; keep models `Sendable` under Swift 6 strict concurrency.
- Views are cheap and re-evaluated often: no network calls or heavy work in `body`; derive values in the model.
- Lists of identifiable data: stable `id`s (database IDs, not array indices or `UUID()` created in `body`).

## Navigation

```swift
enum Route: Hashable { case item(Item.ID), settings }

struct RootView: View {
    @State private var path: [Route] = []
    var body: some View {
        NavigationStack(path: $path) {
            HomeView()
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .item(let id): ItemView(id: id)
                    case .settings: SettingsView()
                    }
                }
        }
        .onOpenURL { url in path = Route.path(for: url) }   // deep links build the stack
    }
}
```

- One `NavigationStack` per tab; tabs via `TabView { Tab(...) { ... } }`.
- `NavigationSplitView` for regular width; it collapses on compact width.
- Programmatic paths make deep links, state restoration, and "pop to root on tab re-tap" trivial.

## Presentation

```swift
.sheet(item: $editingItem) { item in
    EditItemView(item: item)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .interactiveDismissDisabled(hasUnsavedChanges)   // then confirm via confirmationDialog
}
.fullScreenCover(isPresented: $showCamera) { CameraView() }
.confirmationDialog("Delete this photo?", isPresented: $confirmDelete, titleVisibility: .visible) {
    Button("Delete Photo", role: .destructive) { delete() }
}
```

- Prefer item-driven presentation (`sheet(item:)`); in iOS 27 alerts and confirmation dialogs also support item binding.
- Don't set `.presentationBackground(...)` on iOS 26+ unless you truly need an opaque sheet; it removes the glass.
- `interactiveDismissDisabled` must be paired with a visible Cancel and a discard confirmation.

## Typography, color, and adaptivity in code

```swift
@Environment(\.dynamicTypeSize) private var typeSize
@ScaledMetric(relativeTo: .body) private var iconSize = 22.0

var body: some View {
    let layout = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading)) : AnyLayout(HStackLayout())
    layout {
        Image(systemName: "bell").font(.body).frame(width: iconSize)
        Text(title).font(.headline)
        Text(detail).font(.subheadline).foregroundStyle(.secondary)
    }
}
```

- Fonts: `.font(.body)` etc.; custom: `.font(.custom("Brand-Regular", size: 17, relativeTo: .body))`.
- Colors: `.foregroundStyle(.primary/.secondary/.tertiary)`, `Color(.systemBackground)`, asset-catalog colors with light/dark/high-contrast variants; `.tint(.accent)` once at the root.
- Size class: `@Environment(\.horizontalSizeClass)`; `ViewThatFits` for "try wide, fall back to narrow" layouts.
- Safe areas: `.safeAreaInset(edge: .bottom) { ActionBar() }` for pinned bars so content scrolls above them.

## Forms and keyboard

```swift
TextField("Email", text: $email)
    .keyboardType(.emailAddress)
    .textContentType(.emailAddress)
    .textInputAutocapitalization(.never)
    .autocorrectionDisabled()
    .submitLabel(.next)
    .focused($focus, equals: .email)
    .onSubmit { focus = .password }

SecureField("Password", text: $password).textContentType(.newPassword).submitLabel(.go)
TextField("Code", text: $code).textContentType(.oneTimeCode).keyboardType(.numberPad)
```

- `@FocusState` drives field order; `.scrollDismissesKeyboard(.interactively)` in long forms.
- Passkeys and Password AutoFill need Associated Domains (`webcredentials:`) plus correct `textContentType`.
- Sign in with Apple: `SignInWithAppleButton` (system styling; don't restyle).

## Accessibility modifiers

| Need | Modifier |
|---|---|
| Name / value / hint | `.accessibilityLabel`, `.accessibilityValue`, `.accessibilityHint` |
| Treat a row as one element | `.accessibilityElement(children: .combine)` |
| Hide decoration | `.accessibilityHidden(true)` |
| Swipe actions for VoiceOver | `.accessibilityActions { ... }` / `.accessibilityAction(named:)` |
| Traits | `.accessibilityAddTraits(.isHeader / .isButton / .isSelected)` |
| Voice Control names | `.accessibilityInputLabels(["Compose", "New message"])` |
| Reading order | `.accessibilitySortPriority` |
| Reduce Motion / Transparency / Contrast | `@Environment(\.accessibilityReduceMotion)`, `\.accessibilityReduceTransparency`, `\.colorSchemeContrast` |
| Announce a change | `AccessibilityNotification.Announcement("Saved").post()` |

Use `Button` for anything tappable (not `onTapGesture` on a `Text`) so traits, focus, and hit testing come for free; enlarge hit areas with `.contentShape(Rectangle())` + padding.

## Haptics and motion

```swift
.sensoryFeedback(.success, trigger: savedCount)
.sensoryFeedback(.selection, trigger: selectedFilter)
.sensoryFeedback(.impact(weight: .light), trigger: snappedIndex)
```

- Animations: SwiftUI's default is a spring; prefer `.smooth`, `.snappy`, or `.bouncy` (sparingly) over custom durations. `withAnimation` around state changes; `.animation(_:value:)` scoped to a value.
- Honor Reduce Motion: swap movement/zoom for `.opacity` transitions.
- Symbol effects: `.symbolEffect(.bounce, value:)`, `.contentTransition(.symbolEffect(.replace))` for icon state changes only.

## iOS 27 API changes worth adopting

From Apple's WWDC26 SwiftUI guide:
- **Toolbars:** `visibilityPriority(_:)`, `ToolbarOverflowMenu`, `topBarPinnedTrailing`, `toolbarMinimizeBehavior`.
- **Reordering** in any container (`List`, `LazyVGrid`, custom layouts) with one API; `swipeActionsContainer()` enables swipe actions in `ScrollView`/lazy stacks/grids.
- **Alerts and confirmation dialogs** with item binding.
- **`@State` macro** (lazy class initialization) and `ViewBuilder` exposed as `ContentBuilder` (faster builds).
- **`AsyncImage`** respects HTTP cache headers by default; `asyncImageURLSession` to customize.
- **Document API:** `ReadableDocument` / `WritableDocument`, `DocumentCreationSource`, `NewDocumentButton`.
- **Xcode 27 agent skills** for SwiftUI adoption exist; use them alongside this skill in Xcode.

Gate new APIs with `if #available(iOS 27, *)` when your deployment target is lower.

## Previews and verification

- Previews for: light/dark, `.dynamicTypeSize(.accessibility5)`, smallest and largest devices, right-to-left (`.environment(\.layoutDirection, .rightToLeft)`), and a long localization.
- Simulator commands: `xcrun simctl ui booted appearance dark`, `xcrun simctl ui booted content_size extra-extra-extra-large` (and accessibility sizes), `xcrun simctl io booted screenshot out.png`.
- Accessibility Inspector audit plus a manual VoiceOver pass on real hardware.
- Snapshot tests for key screens at default and AX sizes (see `testing-strategy`).

## Cross-platform equivalents

| SwiftUI concept | React Native / Expo | Flutter | Compose Multiplatform |
|---|---|---|---|
| Tab bar (`TabView`) | `expo-router/native-tabs` (SF Symbols via `sf=`) | `CupertinoTabScaffold` (not glass) or native platform view | SwiftUI shell + shared screens |
| `NavigationStack` | Native stack (react-native-screens) | `CupertinoPageRoute` / router with Cupertino transitions | Navigation 3 on iOS, or SwiftUI host |
| Dynamic Type | `allowFontScaling` (default on); test max scale; avoid `maxFontSizeMultiplier` below ~2 | `MediaQuery.textScalerOf`; never clamp to 1.0 | `LocalDensity.fontScale`; `sp` |
| Haptics | `expo-haptics` | `HapticFeedback` | platform `expect/actual` |
| SF Symbols | `expo-symbols` | Cupertino icons or platform view | UIKit interop |
| Glass | `expo-glass-effect`, `@expo/ui` | not native | UIKit/SwiftUI interop |

## Sources

- WWDC26 SwiftUI guide: https://developer.apple.com/wwdc26/guides/swiftui/
- Apple developer documentation (SwiftUI): `NavigationStack`, `sheet(item:onDismiss:content:)`, `sensoryFeedback(_:trigger:)`, `ScaledMetric`, `accessibilityInputLabels(_:)`, `textContentType(_:)` — https://developer.apple.com/documentation/swiftui
- Apple HIG — Accessibility, Typography, Playing haptics, Entering data: https://developer.apple.com/design/human-interface-guidelines
- Expo documentation — native tabs, symbols, haptics, glass effect: https://docs.expo.dev
