# Liquid Glass — Rules, APIs, and Fallbacks

Liquid Glass (iOS/iPadOS 26+, refined in iOS 27) is a translucent material that bends and concentrates light from the content beneath it, with highlights, shadows, and touch-responsive behavior. It forms the **functional layer** — navigation and controls floating above content. API names below were checked against Apple's developer documentation (2026-09).

## Contents
- Layer model
- Rules catalog
- SwiftUI API map
- Toolbars, tab bars, sheets
- Accessibility and user settings
- Performance
- UIKit and cross-platform equivalents
- Fallbacks for iOS 18 and earlier
- Sources

## Layer model

| Layer | What lives there | Material |
|---|---|---|
| 1. Content | Lists, cards, media, text, app backgrounds | None, or standard materials (ultra-thin / thin / regular / thick) for separation |
| 2. Controls & navigation | Tab bars, toolbars, sidebars, floating buttons, sheets at partial detents, menus, popovers | Liquid Glass |
| 3. On-glass content | Symbols, labels, fills | Vibrant system colors and symbols |

Small glass elements (bars, buttons) flip between light and dark looks based on what's behind them; large ones (sidebars, menus) adapt without flipping.

## Rules catalog

### Keep glass out of the content layer
**Rule.** Apply Liquid Glass only to controls and navigation that float above content.
**Apply when.** Any custom view you are tempted to make "glassy".
**Do / Avoid.** Do: a floating map-controls cluster in a `GlassEffectContainer`. Avoid: glass product cards, glass list rows, glass text blocks.
**Why.** Apple HIG Materials: glass in the content layer creates a confusing hierarchy; its job is to separate controls from content.

### Let system components carry the glass
**Rule.** Prefer standard `TabView`, `.toolbar`, `NavigationStack`, `.sheet`, `Menu`, and standard buttons; remove custom backgrounds so the system glass shows.
**Apply when.** Updating an existing app for iOS 26+.
**Do / Avoid.** Do: delete `.toolbarBackground(Color.brand)`, custom `UINavigationBarAppearance` backgrounds, and `.presentationBackground(...)`. Avoid: rebuilding a tab bar with an `HStack` + blur.
**Why.** System components adapt automatically to iOS 27 refinements, accessibility settings, the transparency preference, iPad, and iPhone Duo.

### Use glass sparingly on custom controls
**Rule.** Limit custom glass to the few most important functional elements.
**Apply when.** Custom floating controls, overlays on media or maps.
**Why.** Glass draws attention to the content under it; many glass elements compete with the content they are meant to serve.

### Never stack glass on glass
**Rule.** Don't place a glass element on top of another glass surface; group adjacent glass in one `GlassEffectContainer`.
**Apply when.** Buttons inside a glass panel, toolbars inside sheets.
**Do / Avoid.** Do: plain symbols/labels on a glass panel. Avoid: a `.glassEffect()` button inside a `.glassEffect()` card.
**Why.** Glass cannot sample other glass; stacked glass looks muddy and costs GPU time.

### Choose the variant by background
**Rule.** `.regular` by default; `.clear` only over visually rich media with bold, bright foreground content and a dimming layer under it (Apple's WWDC25 "Meet Liquid Glass" requires one but gives no percentage; for small elements, dim locally so the media keeps its vibrancy); `.identity` to disable conditionally.
**Apply when.** Custom glass over photos, video, maps, or plain surfaces.
**Why.** `.clear` is highly translucent; over plain or busy text backgrounds it loses legibility.

### Tint only to mean something
**Rule.** Tint one primary action or a status; keep other glass controls monochrome.
**Apply when.** Toolbars, floating buttons, tab bars over colorful content.
**Do / Avoid.** Do: `.buttonStyle(.glassProminent)` on "Done". Avoid: every toolbar button in brand blue; tab labels the same hue as the content behind.
**Why.** HIG Color/Toolbars: tinted glass signals the primary action; decoration dilutes it.

### Use the scroll edge effect instead of bar backgrounds
**Rule.** Let content scroll under floating bars and rely on the automatic scroll edge effect; set `.scrollEdgeEffectStyle(.hard, for:)` only where controls need stronger separation (e.g. dense text under a pinned header), one style per view.
**Why.** Opaque bars remove the depth cue that defines the design; the edge effect keeps legibility.

### Make shapes concentric
**Rule.** Custom controls inside bars or sheets use capsule or concentric corners (`ConcentricRectangle`, or `.rect(corners:)` with `.concentric(minimum:)` corners, plus `containerShape(_:)` on the container) so radii nest in their container and the device corners.
**Why.** Mismatched radii are the most visible "custom control" tell next to system components.

### Separate text buttons from symbol buttons
**Rule.** In toolbars, don't put a text-labeled button directly beside a symbol button; separate with a fixed spacer or group.
**Why.** HIG Toolbars: they read as a single combined control.

## SwiftUI API map (iOS 26+)

```swift
// Core
.glassEffect()                                       // .regular in a capsule
.glassEffect(.regular.tint(.orange).interactive(), in: .rect(cornerRadius: 16))
Glass.regular / .clear / .identity                   // variants; .tint(_:), .interactive(_:)

// Grouping and morphing
GlassEffectContainer(spacing: 24) { ... }            // shared sampling; nearby shapes blend
.glassEffectID("id", in: namespace)                  // morph between states (animate the change)
.glassEffectUnion(id: "group", namespace: namespace) // merge separated elements into one shape
.glassEffectTransition(.matchedGeometry)             // or .materialize, .identity

// Buttons
.buttonStyle(.glass)                                 // secondary
.buttonStyle(.glassProminent)                        // primary, tinted
.controlSize(.extraLarge)                            // new size in 26
.buttonBorderShape(.capsule / .circle / .roundedRectangle(radius:))

// Layout helpers
.backgroundExtensionEffect()                         // mirror/blur content under sidebars, inspectors
.scrollEdgeEffectStyle(.soft / .hard, for: .top)
ConcentricRectangle()
```

Morphing checklist: all participating views inside one `GlassEffectContainer`, each with a `glassEffectID` in a shared `@Namespace`, and the state change wrapped in `withAnimation` (a spring such as `.bouncy` or `.smooth`). Respect Reduce Motion by using a simpler transition.

## Toolbars, tab bars, sheets

```swift
.toolbar {
    ToolbarItem(placement: .cancellationAction) { Button("Cancel", systemImage: "xmark") { } }
    ToolbarItem(placement: .confirmationAction) { Button("Done", systemImage: "checkmark") { } } // prominent glass
    ToolbarSpacer(.fixed, spacing: 20)
    ToolbarItem { Button("Profile", systemImage: "person.circle") { } }
        .sharedBackgroundVisibility(.hidden)           // ToolbarContent modifier: item leaves the shared glass group
}

TabView {
    Tab("Home", systemImage: "house") { HomeView() }
    Tab("Search", systemImage: "magnifyingglass", role: .search) { NavigationStack { SearchView() } }
}
.tabBarMinimizeBehavior(.onScrollDown)                 // .automatic, .never
.tabViewBottomAccessory { NowPlayingBar() }            // e.g. a mini-player
// @Environment(\.tabViewBottomAccessoryPlacement): .expanded or .inline (when the tab bar minimizes)
.tabViewStyle(.sidebarAdaptable)                       // iPad: tab bar ↔ sidebar

.searchToolbarBehavior(.minimized)
DefaultToolbarItem(kind: .search, placement: .bottomBar)

.sheet(isPresented: $show) { Editor().presentationDetents([.medium, .large]) }
// Partial detents render as an inset glass sheet; .large becomes opaque and edge-attached.
.matchedTransitionSource(id: "compose", in: ns)        // on the source button
.navigationTransition(.zoom(sourceID: "compose", in: ns)) // on the presented view: sheet grows from the button
```

iOS 27 additions (WWDC26 SwiftUI guide): `visibilityPriority(_:)` (a `ToolbarContent` modifier) for toolbar groups, `ToolbarOverflowMenu`, `topBarPinnedTrailing` placement, `toolbarMinimizeBehavior`. On iPhone Duo, use `ToolbarItemVisibilityPriority` to control what overflows first.

## Accessibility and user settings

| Setting | What system glass does | Your job |
|---|---|---|
| Reduce Transparency | Frostier, more opaque | Don't force custom opacity; custom glass can switch to `.identity` via `@Environment(\.accessibilityReduceTransparency)` |
| Increase Contrast | Stark colors and borders | Use semantic colors; check `colorSchemeContrast == .increased` for custom drawing |
| Reduce Motion | Tones down elastic/morph effects | Replace morphs, zooms, and parallax with fades (`accessibilityReduceMotion`) |
| Liquid Glass look (26.1: Clear/Tinted; 27: transparency range) | Changes translucency app-wide | Test at both extremes; never rely on content being visible through a bar |

Also test VoiceOver order around floating controls and AX5 text inside glass buttons (labels must grow, not clip).

## Performance

- One `GlassEffectContainer` per cluster; avoid many independent glass views.
- Let glass rest: no continuous animations on glass, no glass inside rapidly scrolling cells.
- Profile scrolling and transitions with Instruments on an older supported device (e.g. a 3–4-year-old iPhone); community reports note higher GPU/battery load on iOS 26, so measure instead of assuming.

## UIKit and cross-platform equivalents

| Need | UIKit | React Native / Expo | Flutter | Compose Multiplatform |
|---|---|---|---|---|
| Glass view | `UIVisualEffectView(effect: UIGlassEffect(...))`, `UIGlassContainerEffect` | `expo-glass-effect` `GlassView` (iOS 26+, falls back to a plain view; don't animate its opacity to 0) | No native glass; custom shaders or native platform views | Wrap a native SwiftUI/UIKit view |
| Glass buttons | `UIButton.Configuration.glass()` / `.prominentGlass()` | `@expo/ui` SwiftUI components | — | Native interop |
| Tab bar | `UITabBarController` (`MinimizeBehavior`) | `expo-router/native-tabs` (SDK 58+; `unstable-native-tabs` in 54–57) | Cupertino widgets do not become glass automatically | Native SwiftUI shell recommended |
| Remove item glass | `UIBarButtonItem.hidesSharedBackground` | — | — | — |

## Fallbacks for iOS 18 and earlier

```swift
extension View {
    @ViewBuilder func floatingControlBackground() -> some View {
        if #available(iOS 26, *) {
            self.glassEffect(.regular.interactive(), in: .capsule)
        } else {
            self.background(.regularMaterial, in: .capsule)   // standard material, no faux glass gradients
        }
    }
}
```

Use standard materials as the fallback; don't simulate glass with gradients and strokes. `UIDesignRequiresCompatibility` (Info.plist) temporarily keeps the pre-26 look when building with Xcode 26, but the system ignores it for apps built with the iOS 27 SDK.

## Sources

- Apple HIG — Materials, Color, Toolbars, Tab bars, Scroll views, Sheets (developer.apple.com/design/human-interface-guidelines; June 2026 revision)
- Apple developer documentation: `glassEffect(_:in:)`, `Glass`, `GlassEffectContainer`, `glassEffectID(_:in:)`, `glassEffectUnion(id:namespace:)`, `ToolbarSpacer`, `tabBarMinimizeBehavior(_:)`, `tabViewBottomAccessory`, `TabViewBottomAccessoryPlacement`, `backgroundExtensionEffect()`, `scrollEdgeEffectStyle(_:for:)`, `ConcentricRectangle`, `UIGlassEffect`, `UIButton.Configuration.glass()`, `UIDesignRequiresCompatibility` — https://developer.apple.com/documentation/swiftui
- WWDC25 sessions: "Meet Liquid Glass", "Get to know the new design system", "Build a SwiftUI app with the new design" — https://developer.apple.com/videos/wwdc2025/ · "Meet Liquid Glass" (Regular vs Clear, the three conditions for Clear, dimming): https://developer.apple.com/videos/play/wwdc2025/219/
- WWDC26 SwiftUI guide (toolbar APIs): https://developer.apple.com/wwdc26/guides/swiftui/
- iOS 27 Liquid Glass changes (secondary reporting): https://www.macrumors.com/2026/06/10/how-liquid-glass-is-changing-in-ios-27/
- Community reference: https://github.com/conorluddy/LiquidGlassReference
- Expo glass effect and native tabs docs: https://docs.expo.dev/versions/latest/sdk/glass-effect/ , https://docs.expo.dev/router/advanced/native-tabs/
