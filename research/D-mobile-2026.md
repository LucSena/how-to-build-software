# D — Mobile Design & Mobile Architecture (iOS + Android + cross-platform), state as of 2026-09-30

Research notes for an Agent Skills repo (SKILL.md files). Concrete values, API names, sources.

**Confidence legend**
- **[OFFICIAL]**: read directly from an official page or source file during this session (developer.apple.com HIG JSON, developer.android.com, androidx source on GitHub, reactnative.dev blog source, the expo/expo repo, nowinandroid repo).
- **[SEARCH]**: from web-search result summaries (secondary sources such as MacRumors, 9to5Mac, JetBrains blog, Medium). Probably right, but check before stating it as fact.
- **[K]**: from background knowledge (training data up to about mid-2026) and not re-verified this session. Treat as "verify before publishing".
- **[UNCERTAIN]**: conflicting or thin evidence.

---

## 0. Timeline snapshot (what is "current" on 2026-09-30)

| Platform / tool | Current state | Confidence |
|---|---|---|
| iOS | **iOS 27** released **Sept 14, 2026** (WWDC26 on June 8, 2026; betas from June 9). iOS 26 (Liquid Glass) came out Sept 2025. | [SEARCH] (MacRumors, AppleInsider) |
| Xcode | **Xcode 27** (RC or GM). From **April 28, 2026**, uploads must use Xcode 26 / iOS 26 SDK. From **April 2027**, uploads must use the iOS 27 SDK and target iOS 15+. | [SEARCH] |
| Liquid Glass opt-out | `UIDesignRequiresCompatibility` (Info.plist) worked with Xcode 26. It is **ignored when you build with the iOS 27 SDK**, so Liquid Glass is effectively mandatory by April 2027. | [SEARCH] (multiple sources agree) |
| New Apple hardware | The HIG has a new page, **"Designing for iPhone Duo"** (change log: *Sept 9, 2026, New page*). It covers a two-display iPhone with a centre hinge, an inner and an outer display, "reserved regions", and **vertical toolbars/tab bars on the side**. | [OFFICIAL] page exists. Device specs not verified. |
| HIG Design principles | The page was rewritten June 8, 2026 around 8 principles: **Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight**. | [OFFICIAL] |
| Android | **Android 17 (API 37)** stable since **June 2026**. Android 16 (API 36) stable June 2025. | [SEARCH]+[OFFICIAL] behaviour-change pages |
| Google Play target API | From **Aug 31, 2026**, new apps and updates must **target API 36** (Wear OS / Automotive: 35; TV / XR: 34). Extensions were available to Nov 1, 2026. Existing apps need target 35+ to stay visible to new users on newer OS versions. | [SEARCH] |
| Material | **Material 3 Expressive** announced at I/O in May 2025 and rolled out with Android 16 QPR1 (Sept 2025). On androidx-main, Compose Material3 is **1.5.0-beta01**. `MaterialExpressiveTheme` is no longer marked experimental there, but about 27 `ExperimentalMaterial3ExpressiveApi` references remain. Material3 Adaptive is 1.4.0-alpha03 and Navigation3 1.3.0-alpha02 on main. | [OFFICIAL] androidx `libraryversions.toml` |
| React Native | **0.87** (Aug 11, 2026) is the latest stable. 0.88 is at RC (0.88.0-rc.3 is in the Expo main branch). The repo moved to the `react` GitHub org under the **React Foundation** (announced with 0.86). | [OFFICIAL] RN blog source |
| Expo | **SDK 57** (June 30, 2026; RN 0.86, React 19.2) is the latest stable. **SDK 58** is in progress or beta on `main` (RN 0.88.0-rc.3, React 19.3.0, expo-router ~58.0.x). | [SEARCH]+[OFFICIAL] expo repo |
| Flutter | **3.44** / Dart 3.12 (Google I/O, May 2026). Skia is removed on Android 10+, so Impeller/Vulkan is the only renderer there. Material and Cupertino are being split into `material_ui` / `cupertino_ui` packages. | [SEARCH] |
| Kotlin Multiplatform | Kotlin **2.4.0** (June 2026; Swift Export is Alpha). **Compose Multiplatform 1.12.0** (Aug 2026). iOS has been stable since CMP 1.8 (May 2025). Compose Hot Reload is 1.0 stable (Jan 2026, bundled from CMP 1.10). | [SEARCH] (JetBrains blog titles) |

---

## 1. iOS — Liquid Glass (iOS 26) and iOS 27 refinements

### 1.1 What Liquid Glass is
- Introduced at WWDC25 (June 9, 2025) for iOS/iPadOS/macOS Tahoe/watchOS/tvOS/visionOS 26. It is Apple's biggest visual change since iOS 7. [SEARCH/LiquidGlassReference]
- It is a translucent "meta-material" that **lenses** (bends and concentrates light, as opposed to scattering it like the old blur). It has specular highlights that respond to device motion, adaptive shadows, and interactive behaviours (it scales, bounces, shimmers and lights up at the touch point).
- **Core rule: Liquid Glass belongs only to the navigation/control layer that floats above content.** Never use it in the content layer (lists, tables, cards, media). HIG: *"Don't use Liquid Glass in the content layer… Use Liquid Glass effects sparingly."* [OFFICIAL HIG Materials]
- Layering model:
  1. content (no glass)
  2. navigation/controls (glass)
  3. vibrant fills and symbols on the glass
- Never stack glass on glass.
- Variants: `.regular` (the default; adapts to any background), `.clear` (more transparent; **only over visually rich media**, and needs a dimming layer and bold, bright foreground content), `.identity` (no effect; use it for conditional toggling).
- Small elements such as bars flip between a light and dark look depending on the content behind them. Large elements such as sidebars and menus adapt but don't flip.
- Concentricity: controls nest inside window and device corners. There are three shape types:
  - **fixed**: constant radius
  - **capsule**: radius = height / 2
  - **concentric**: radius = parent radius − padding (`.rect(cornerRadius: .containerConcentric)` / `ConcentricRectangle`).
  [OFFICIAL WWDC25 "Get to know the new design system" summary]
- The **scroll edge effect** replaces opaque bar backgrounds. Content blurs and fades under floating bars. Styles are soft and hard (`.scrollEdgeEffectStyle(.hard, for: .top)`). HIG: prefer the automatic style, use it only where content scrolls behind floating UI, and apply one per view. [OFFICIAL HIG Scroll views]
- Colour on glass: tint only to convey meaning (the primary action, status), never as decoration. Avoid tab, toolbar or button label colours that are similar to colourful content behind them. Prefer monochrome bars. [OFFICIAL HIG Color / Tab bars / Toolbars]

### 1.2 Accessibility and user controls for glass
- The system adapts glass automatically:
  - **Reduce Transparency** makes it frostier and more opaque.
  - **Increase Contrast** gives stark colours and borders.
  - **Reduce Motion** tones down elastic and morph effects.
- **iOS 26.1** added a user toggle (Settings → Display & Brightness → Liquid Glass: Clear / **Tinted**). [SEARCH/LiquidGlassReference]
- **iOS 27** replaces this with a **transparency slider** that goes from "ultra clear" to "fully tinted". Other iOS 27 changes:
  - glass diffuses complex content more ("more uniform refraction and improved contrast")
  - a **darkened edge** around glass elements
  - **brighter specular highlights**
  - a **uniform toolbar across the top when content scrolls under floating bars**
  - **sidebars extend to the full window edge**, with refraction continuing beneath them
  - **sidebar icons keep their colour**
  [SEARCH: MacRumors 2026-06-10, TechCrunch 2026-06-08, Neowin]
- There is a claim that in iOS 27 SwiftUI defaults `scrollEdgeEffectStyle` to `.hard`, with `.soft` restoring the iOS 26 look. [UNCERTAIN: single search summary]
- Developer rule: don't bypass these adaptations with custom opacity. Test all four modes (Reduce Transparency, Increase Contrast, Reduce Motion, Tinted/slider extremes), plus VoiceOver and the largest Dynamic Type sizes.
- The glass look can be read from `@Environment(\.accessibilityReduceTransparency)`, `\.accessibilityReduceMotion` and `\.colorSchemeContrast`. Fall back with `.glassEffect(reduceTransparency ? .identity : .regular)` only if a custom control truly needs it.

### 1.3 SwiftUI Liquid Glass APIs (iOS 26+) [SEARCH/LiquidGlassReference, cross-checked with WWDC25 session names]
```swift
// Core
.glassEffect()                                   // .regular in .capsule by default
.glassEffect(.regular.tint(.blue).interactive(), in: .rect(cornerRadius: 16), isEnabled: true)
Glass.regular / .clear / .identity;  .tint(Color)  .interactive()   // interactive() is iOS-only
GlassEffectContainer(spacing: 40) { ... }   // shared sampling region; elements within `spacing` blend and morph
.glassEffectID("id", in: namespace)          // morphing between states (needs a container + animation)
.glassEffectUnion(id: "group", namespace: ns) // merge distant elements into one glass shape
.glassEffectTransition(.matchedGeometry | .materialize | .identity)
// Buttons
.buttonStyle(.glass)           // secondary / translucent
.buttonStyle(.glassProminent)  // primary / opaque tinted
.controlSize(.mini | .small | .regular | .large | .extraLarge)   // .extraLarge is new in 26
.buttonBorderShape(.capsule | .circle | .roundedRectangle(radius:))
// Toolbars
ToolbarSpacer(.fixed, spacing: 20) / ToolbarSpacer(.flexible)
.sharedBackgroundVisibility(.hidden)     // take an item out of the shared glass group
ToolbarItem(placement: .confirmationAction) // automatically gets the prominent glass style
.badge(n)
// Tab bars
Tab("Search", systemImage: "magnifyingglass", value: .search, role: .search) { ... }   // search tab at the trailing end
.tabBarMinimizeBehavior(.onScrollDown | .automatic | .never)
.tabViewBottomAccessory { NowPlayingView() }   // accessory, e.g. a mini-player
@Environment(\.tabViewBottomAccessoryPlacement)  // .expanded / .collapsed (inline)
.tabViewStyle(.sidebarAdaptable)                 // iPad tab bar ↔ sidebar
// Search
.searchable(text:) ; .searchToolbarBehavior(.minimized) ; DefaultToolbarItem(kind: .search, placement: .bottomBar)
// Sheets & transitions
.presentationDetents([.medium, .large])   // partial detents give an inset glass sheet
.matchedTransitionSource(id:in:) + .navigationTransition(.zoom(sourceID:in:))  // sheet morphs out of its button
// Layout
.backgroundExtensionEffect()  // mirror or blur content under a sidebar or inspector
.scrollEdgeEffectStyle(.soft | .hard, for: .top)
```
- UIKit equivalents: `UIGlassEffect(glass: .regular, isInteractive: true)` in a `UIVisualEffectView`, `UIGlassContainerEffect`, and `UIButton.Configuration.glass()` / `.prominentGlass()` [K]. Also `UITabBarController.MinimizeBehavior`, `UIBarButtonItem.hidesSharedBackground`, and `UIBarButtonItem.VisibilityPriority` (named in the iPhone Duo HIG). [OFFICIAL names in HIG]
- Performance: one `GlassEffectContainer` for grouped glass (glass cannot sample glass), glass allowed to rest in steady states, no continuous animations. Profile on older devices (iPhone 11–13). There are anecdotal reports of higher battery drain on iOS 26. [SEARCH/LiquidGlassReference — anecdotal]
- Remove custom bar backgrounds and `.presentationBackground(...)` so the system glass shows through. Custom opaque bar backgrounds are the #1 "didn't adopt the new design" smell.

### 1.4 WWDC26 / iOS 27 developer changes [OFFICIAL developer.apple.com/wwdc26/guides/swiftui + /ios/whats-new]
- **Toolbars**: `visibilityPriority` (keep key groups visible as the window shrinks), `toolbarOverflowMenu` (always place low-priority items in overflow), `topBarPinnedTrailing` (pin a critical action such as Share to the trailing edge), and `toolbarMinimizeBehavior` (collapse the navigation bar on scroll).
- **Reorderable containers** in any container, not just `List` (List, LazyVGrid, custom Layouts). Reordering comes to watchOS. `swipeActionsContainer()` enables swipe actions in `ScrollView`/`LazyVStack`/grids.
- **Alerts and confirmation dialogs** support item binding, like sheets.
- **`@State` is now a macro**, so classes in `@State` are initialised lazily, once per view lifetime. `ViewBuilder` is exposed as **`ContentBuilder`**, which speeds up builds.
- **`AsyncImage` respects HTTP cache headers by default**, and there is an `asyncImageURLSession` modifier.
- Document API: `ReadableDocument` / `WritableDocument` (async and incremental), `DocumentCreationSource`, and `NewDocumentButton`.
- **Xcode 27 ships agent "skills"** for SwiftUI adoption (relevant precedent for this repo). Android has the same idea: the Android CLI has `android skills add edge-to-edge`. [OFFICIAL, both]
- Platform items: "refreshed materials, refined typography, and updated tab and navigation bars". **App Intents**: entity schemas feed the Spotlight semantic index for Siri, intent schemas mean no phrases are needed, the **View Annotations API** maps on-screen views to entities, and there is an **App Intents Testing framework**. Also **Foundation Models** (any LLM provider through a Language Model protocol; multimodal), **Core AI** (bring your own on-device models), and an **Evaluations** framework.
- App icons in iOS 27 are "sharper and more detailed", with **multiple distinct Liquid Glass layers inside the icon**. Edge highlights sit at top and bottom and **no longer shift with device motion**. Icon Composer adds multi-layer glass, refraction annotations and an interactive preview. [SEARCH MacRumors 2026-06-16]

---

## 2. iOS HIG essentials (numbers)

### 2.1 Touch targets and spacing [OFFICIAL HIG Accessibility]
| Platform | Default control size | Minimum control size |
|---|---|---|
| iOS / iPadOS | **44×44 pt** | **28×28 pt** |
| macOS | 28×28 pt | 20×20 pt |
| tvOS | 66×66 pt | 56×56 pt |
| visionOS | 60×60 pt | 28×28 pt |
| watchOS | 44×44 pt | 28×28 pt |
- Padding: about **12 pt** around bezelled elements and about **24 pt** around elements without a bezel.
- visionOS: button centres at least 60 pt apart. Button sizes are 28 / 32 / 44 / 52 / 64 pt (mini to extra large).

### 2.2 Typography [OFFICIAL HIG Typography]
- The system fonts are SF Pro (text and display optical sizes are automatic), SF Pro Rounded, New York, SF Compact (watch) and SF Mono.
- **Default body is 17 pt and the minimum is 11 pt** on iOS/iPadOS. Other platforms: macOS 13/10, tvOS 29/23, visionOS 17/12, watchOS 16/12.
- Support enlarging text by **at least 200%** (140% on watchOS). [OFFICIAL HIG Accessibility]
- **iOS Dynamic Type — Large (default)**:

| Style | Weight | Size pt | Leading pt | Emphasized |
|---|---|---|---|---|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subhead | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

- The full size range covers 7 standard sizes (xSmall to xxxLarge) and 5 accessibility sizes (AX1–AX5):
  - xSmall body is 14 pt.
  - AX1 body is 28 pt (Large Title 44).
  - **AX5 body is 53 pt** (Large Title 60, Caption 2 40).
- So a layout must survive a body text **about 3.1× larger than default**. Use `.font(.body)` or `UIFont.preferredFont(forTextStyle:)` together with `adjustsFontForContentSizeCategory`, and `@ScaledMetric` for spacing. Switch HStack to VStack at accessibility sizes with `dynamicTypeSize.isAccessibilitySize`.
- SF Pro tracking varies by size: 17 pt → −0.43 pt, 12 pt → 0, 28 pt → +0.38. The system applies it automatically. Custom fonts need `UIFontMetrics`.

### 2.3 Colour contrast [OFFICIAL HIG Accessibility]
- Text up to 17 pt needs **4.5:1**. Text 18 pt and up, or any bold text, needs **3:1** (this mirrors WCAG AA).
- Prefer semantic system colours (`label`, `secondaryLabel`, `systemBackground`, `separator`, …). They adapt to dark mode and Increase Contrast.
- Don't hard-code system colour values, and don't convey information with colour alone.

### 2.4 Layout, safe areas and size classes [OFFICIAL HIG Layout; K for margins]
- Base layout on **size classes** (compact/regular width × height), not on device model or orientation. Keep functionality the same when the size class changes.
- Test the smallest and largest layouts first, including localisations and text sizes.
- Always respect **safe areas** (Dynamic Island, home indicator, bars) and **layout margins**. System margins are **16 pt on compact width and 20 pt on regular width** [SEARCH/K]. `readableContentGuide` limits line length.
- Current iPhone logical sizes [OFFICIAL, from a HIG mirror capture of the spec table]:

| Device | Points |
|---|---|
| iPhone 17 Pro Max / 16 Pro Max | 440×956 @3x |
| iPhone Air | 420×912 |
| iPhone 17 / 17 Pro / 16 Pro | 402×874 |
| iPhone 16 | 393×852 |
| iPhone 16e | 390×844 |
| smallest still-supported (SE 2/3) | 375×667 |
| iPad mini | 744×1133 |
| iPad Pro 13" | 1032×1376 |

- Typical safe-area insets on Face ID iPhones in portrait are about 59–62 pt at the top and **34 pt at the bottom** (home indicator). [K] Never hard-code these; read them from the safe area.
- **iPhone Duo (new, Sept 2026)** [OFFICIAL HIG]:
  - Outer display (wide and short) uses compact width. Inner display uses regular width.
  - **Toolbars, tab bars, the status bar and the Dynamic Island move to the side (vertical axis)**, except on the inner display in portrait.
  - Reserved regions: the outer camera (always present), the inner camera (only while active), and the fold region (when partially folded).
  - New **arrangement views** (split and overlay) sit inside navigation containers.
  - In grids, prefer an **even number of columns** so content divides cleanly at the fold.
  - Toolbar overflow runs bottom to top. Set a visibility priority to control the order.
  - Don't override the default bar placement.

### 2.5 Navigation (iOS 26/27) [OFFICIAL HIG Tab bars, Toolbars, Search fields, Sheets, Sidebars]
- **Tab bar** (iPhone): floats at the bottom on Liquid Glass.
  - It is for **navigation, not actions**. Use a toolbar for actions.
  - Keep it visible across sections. Only a modal may cover it.
  - Avoid overflow into a "More" tab. Don't hide or disable tabs; show an empty state instead.
  - Use single-word labels and SF Symbols. Use badges only for critical info.
  - Keep tab labels a different colour from colourful content.
  - It can **minimize on scroll**. With a **bottom accessory** (such as the Music mini-player), minimizing moves the accessory inline.
  - A **dedicated search tab sits at the trailing end**.
  - Practical cap: about 5 tabs on iPhone. [K; the HIG says "use the appropriate number… fewer is easier"]
- **Search placement** (June 2026 HIG):
  - (a) **Search as a tab**. The *standard tab* style gives a landing page with suggestions, for discovery (Apple TV). The *button appearance* style focuses the field and opens the keyboard immediately, for a quick lookup, and returns people to their previous tab.
  - (b) **Search in a toolbar**. Prefer the bottom if there is room (Settings, Mail, Notes). Use the top only when bottom content must not be covered (Wallet).
  - (c) **Inline field** for local filtering. Put it above the list and pin it on scroll.
- **Toolbars**:
  - Prefer symbols over text. **Don't place a text button next to a symbol button**, because together they read as one control.
  - Use at most about **3 groups**.
  - Use **one** `.prominent` primary action (Done/Submit), on the **trailing side**.
  - Use the standard Back/Close symbols without text.
  - Keep titles **under 15 characters**, and don't title a window with the app name.
  - Large titles collapse into a standard title on scroll.
- **Sheets**:
  - Partial-height sheets are **inset, with Liquid Glass and rounded bottom corners that nest in the display curve**. At the large detent they become opaque and attach to the screen edges.
  - Detents are `.medium` (about half height) and `.large`; custom heights are possible.
  - Include a grabber and support swipe-to-dismiss. If there are unsaved changes, confirm with an action sheet.
  - **One sheet at a time.**
  - For single-view sheets, **Cancel is leading and Done is trailing** (March 2026 update). Never show Cancel, Done and Back together.
  - Use full-screen covers for long or complex flows.
- **Sidebars** (iPad): float on glass, can extend content beneath (`backgroundExtensionEffect`), show at most **2 levels** of hierarchy, and can be hidden. The `sidebarAdaptable` tab style toggles between tab bar and sidebar.
- **Modality**: use modals only for focused, self-contained tasks, and always give an obvious exit.

### 2.6 SF Symbols 7 [SEARCH WWDC25 session 337]
- **Draw On / Draw Off** animations imitate a handwritten stroke.
- **Variable Draw** shows progress or strength along a path.
- **Gradients** are rendered from a single colour.
- **Magic Replace** is enhanced to recognise matching enclosures.
- Hundreds of new symbols, and custom-symbol animation authoring in the SF Symbols app. The library is about 6,900+ symbols [K].
- Use symbols in tab bars and toolbars. They scale with Dynamic Type and weight.
- Whether SF Symbols 8 shipped at WWDC26 was **not verified**. [UNCERTAIN]

### 2.7 App icons [OFFICIAL HIG App icons, updated June 8, 2026]
- iOS, iPadOS and macOS share a **1024×1024 px** square, **layered** canvas. The system masks it to the rounded rectangle. (watchOS 1088×1088 circle; visionOS 1024×1024 3D circle; tvOS 800×480 parallax.)
- **Six appearances**: Default (light), Dark, Clear light, Clear dark, Tinted light, Tinted dark.
- Author the icon in **Icon Composer**, which produces a `.icon` file that Xcode 26+ consumes.
- Rules:
  - Use foreground layers with **crisp edges**, and vary layer opacity for depth.
  - Use vector layers (SVG/PDF); use PNG for raster and mesh gradients.
  - Use solid or gradient backgrounds built in Icon Composer.
  - **Don't bake in** highlights, shadows, bevels, blurs or glows; the system adds them.
  - Keep the core features identical across appearances.
  - Include text only if it is essential. Prefer illustrations to photos. No replicas of UI or Apple hardware.
  - Keep content centred to survive masking.
  - Alternate icons are allowed.

### 2.8 Haptics [OFFICIAL HIG Playing haptics; K for APIs]
- Standard patterns:
  - **Notification**: success / warning / error.
  - **Impact**: light / medium / heavy / rigid / soft.
  - **Selection**: value changes.
- Use the patterns only for their documented meanings and keep them consistent. Treat them as complementary feedback: short haptics for discrete events, never overused, and always optional.
- APIs: SwiftUI `.sensoryFeedback(.success, trigger: value)` (iOS 17+; also `.impact(weight:intensity:)`, `.selection`, `.increase`/`.decrease`) [K]. UIKit `UIImpactFeedbackGenerator`, `UINotificationFeedbackGenerator`, `UISelectionFeedbackGenerator`. Core Haptics for custom patterns.
- Android equivalent: `HapticFeedbackConstants` (`CONFIRM`, `REJECT`, `CLOCK_TICK`, `LONG_PRESS`, `GESTURE_START/END`, `SEGMENT_TICK`…) through `View.performHapticFeedback`, or `LocalHapticFeedback` in Compose. [K]

### 2.9 Gestures [OFFICIAL HIG Gestures]
- The standard gestures (tap, swipe, drag, touch-and-hold, double-tap, pinch, rotate) must behave the way people expect.
- Add custom gestures only when necessary, and always as **shortcuts that supplement visible controls**, not as the only path.
- **Never conflict with system edge gestures**: the iOS back swipe from the leading edge, home and app switching from the bottom, and Notification/Control Center from the top.
- System shortcuts to leave alone: three-finger swipe = undo/redo, three-finger pinch = copy/paste, shake = undo.
- Accessibility: offer on-screen alternatives to every gesture (for example, a Delete button in addition to swipe-to-delete).

### 2.10 Accessibility checklist (iOS)
- **VoiceOver**: labels, traits, values, hints; group with `.accessibilityElement(children: .combine)`; custom actions for swipe actions; correct reading order; `.accessibilityHidden` for decoration.
- Dynamic Type up to AX5. Voice Control labels (`.accessibilityInputLabels`). Full Keyboard Access. Switch Control.
- **Reduce Motion**: replace slides, zooms and parallax with cross-fades (`@Environment(\.accessibilityReduceMotion)`).
- Reduce Transparency. **Increase Contrast** (`colorSchemeContrast == .increased`). Dim Flashing Lights for video. No time-limited UI. Assistive Access support.
- Contrast ratios as in §2.3. Never rely on colour alone.

### 2.11 Launch, onboarding, permissions, notifications [OFFICIAL HIG]
- **Launch screen**: nearly identical to the first screen. No text, no logo, no advertising. Its only job is perceived speed. Restore previous state on relaunch.
- **Onboarding**: teach through interaction. Prefer contextual tips to up-front tours. Keep it brief, skippable and not repeated. Don't show licences. Postpone setup and use good defaults. Ask for ratings or purchases only after the user is engaged.
- **Permissions**:
  - Request only when the feature needs it, in context. Not at launch, unless the app can't work without it.
  - The purpose string must say what the data is used for, with an example (App Review 5.1.1).
  - **Pre-permission ("priming") screens are allowed but constrained**: **one button only**, labelled "Continue" or "Next" (never "Allow"), and it must open the system alert. **No close or cancel option that skips the alert.** No incentives, no fake alert images, no annotating the screen behind the alert (ATT rules; violations get rejected). This differs from the common web or Android "Not now" soft-ask pattern, so the skill must flag it.
- **Notifications**:
  - Interruption levels: Passive, Active, **Time Sensitive** (breaks through Focus), **Critical** (also overrides the mute switch; needs an entitlement).
  - Never use Time Sensitive for marketing. Marketing push needs explicit opt-in plus an in-app opt-out (App Review 4.5.4). Push must not be required for the app to work.
  - Offer **provisional authorization** (`.provisional`, quiet delivery with no prompt) as a low-friction start [K].
  - Provide an in-app notification settings screen.

### 2.12 Widgets, Live Activities, App Intents [OFFICIAL HIG]
- **Widget margins are 16 pt for most widgets.** iPhone widget sizes range from **small 158×158 up to large 338×354 pt**; the extremes depend on the device.
- **Live Activities**: for tasks with a defined start and end, **no longer than 8 hours**. Update only when content changes. Use alerts sparingly. End immediately when the task ends.
  - Lock Screen margin is **14 pt**. The Dynamic Island corner radius is **44 pt**. The minimal presentation must still be recognisable.
  - Also appear in StandBy, on the Mac menu bar and in CarPlay (Dec 2025 update).
- **App Intents / App Shortcuts** expose actions to Siri, Spotlight, the Action button, Shortcuts and widgets. In iOS 27, Siri uses entity and intent schemas plus View Annotations (§1.4).
- Android counterparts: **Live Updates** (Android 16+, `Notification.ProgressStyle`, status chips; Android 17 adds semantic colours) must be **ongoing, user-initiated and time-sensitive**. Good fits are navigation, calls, rideshare and delivery. **Not** ads, promos, chat or upcoming events. [OFFICIAL]. Widgets use Jetpack **Glance**. Android 17 enforces a **RemoteViews bitmap memory cap of 1.5 × screen W × H × 4 bytes** and crashes the process if it is exceeded. [SEARCH/OFFICIAL heading "Memory limit widget"]

### 2.13 App Store Review — UX pitfalls [OFFICIAL guidelines page, "Last Updated: June 8, 2026"]
- **4.2 Minimum Functionality**: *"elevate it beyond a repackaged website"*. Web clippings or link collections (4.2.2) and apps built from templates or app-generator services (4.2.6) are rejected. Push, location or sharing alone don't make an app. So a **web-in-a-wrapper** app is a real rejection risk.
- **4.1 Copycats**, and **4.3 Spam** (tightened in June 2026 for low-value and duplicate apps). [SEARCH MacRumors 2026-06-09]
- **4.8 Login Services**: if you use third-party or social login for the primary account, you must also offer an equivalent private option (such as Sign in with Apple) that limits data to name and email, allows a private email and does no ad tracking.
- **5.1.1(v)**: if the app isn't account-based, don't force login. **If the app supports account creation it must support in-app account deletion** (a button in the app, not a mailto).
- 5.1.1(i): explicit consent before sharing data with third parties, **including third-party AI**.
- **2.3.3**: screenshots must show the app in use, not a splash or login screen.
- 2.3.10: no references to other mobile platforms.
- 2.5.1: public APIs only.
- 2.4.1: iPhone apps should run on iPad.
- 3.1.2(x) and related: don't force ratings or reviews to unlock features.
- **4.5.4**: push must not be required, and marketing push needs opt-in.
- Most common 2026 rejections (per a secondary source): broken support URL (1.5), missing or inaccurate privacy policy (5.1.1), App Privacy label mismatch, crashes and incomplete builds (2.1). [SEARCH]

---

## 3. Android — Material 3 Expressive, Android 16/17, adaptive layouts

### 3.1 Material 3 Expressive (M3E)
- Announced at **Google I/O, May 2025**. It is the M3 update behind Android 16 QPR1 and the Pixel UI (Sept 2025). Google cites research with about 46 studies and 18k participants, and reports that users found key UI elements up to about 4× faster. [K/SEARCH — verify the figures]
- Pillars: richer colour, **emphasized typography**, a **shape library with morphing**, **spring-based motion physics**, and new or updated components.
- **New components (I/O 2025)**: **button groups** (the connected button group replaces segmented buttons, and selection morphs the shape), **split button**, **FAB menu**, **loading indicator** (a morphing-shape spinner), and **toolbars** (docked and floating). [SEARCH]
- Updated components include flexible navigation bar, navigation rail (collapsed and expanded), app bars (flexible medium/large, with subtitles), icon buttons, FAB sizes, progress indicators (wavy), sliders, menus (Nov 2025 redesign) and carousels.
- **The navigation drawer is deprecated in favour of the expanded navigation rail** [SEARCH, from a Material skill repo that mirrors m3.material.io; verify].
- **Compose API names** [OFFICIAL androidx source]:
  - `MaterialExpressiveTheme(colorScheme, motionScheme, shapes, typography)`, `expressiveLightColorScheme()`, `MotionScheme.expressive()` / `MotionScheme.standard()`
  - `ButtonGroup`, `SplitButtonLayout`, `FloatingActionButtonMenu` + `ToggleFloatingActionButton`, `LoadingIndicator` / `ContainedLoadingIndicator`
  - `HorizontalFloatingToolbar` / `VerticalFloatingToolbar`, `FlexibleBottomAppBar`
  - `ShortNavigationBar` / `ShortNavigationBarItem`, `WideNavigationRail` / `ModalWideNavigationRail` / `WideNavigationRailItem`
  - `MediumFlexibleTopAppBar`, `LargeFlexibleTopAppBar`, `TwoRowsTopAppBar`
- **Component sizes** [OFFICIAL Compose tokens]:

| Component | Size |
|---|---|
| Buttons XS / S / M / L / XL | height 32 / 40 / 56 / 96 / 136 dp; icon 20 / 20 / 24 / 32 / 40 dp; round (full) or square shape; the pressed state morphs to a smaller corner |
| FAB / Medium FAB / Large FAB | 56 / **80** / 96 dp (icons 24 / 28 / 32) |
| Navigation bar | 64 dp (new "flexible/short"); the old tall bar is 80 dp |
| Navigation rail | collapsed 96 dp wide (narrow 80); expanded 220–360 dp |
| Floating toolbar | 64 dp tall, 16 dp external padding, full-rounded |

- **Stability**: the M3E APIs lived in the 1.4.0-alpha track, then 1.5.0-alpha. Stable 1.4.0 (released 2025) did **not** include most expressive APIs. On androidx-main, material3 is **1.5.0-beta01** and `MaterialExpressiveTheme` is no longer `@ExperimentalMaterial3ExpressiveApi` (about 27 experimental references remain). **Expect material3 1.5.0 stable around late 2026 or early 2027.** [OFFICIAL source + SEARCH]
- MDC-Android (Views) has M3E too (1.13+ [K]). Flutter M3E is partial and tracked in flutter#168813; it moves to the `material_ui` package.

### 3.2 Material type scale [OFFICIAL Compose TypeScaleTokens]
The default typeface is Roboto (and Roboto Flex); Google Sans Flex is used in Google apps [K]. All values are in sp.

| Role | Size | Line height | Weight | Tracking | Emphasized weight |
|---|---|---|---|---|---|
| Display L | 57 | 64 | 400 | −0.25 (token −0.2) | 500 |
| Display M | 45 | 52 | 400 | 0 | 500 |
| Display S | 36 | 44 | 400 | 0 | 500 |
| Headline L | 32 | 40 | 400 | 0 | 500 |
| Headline M | 28 | 36 | 400 | 0 | 500 |
| Headline S | 24 | 32 | 400 | 0 | 500 |
| Title L | 22 | 28 | 400 | 0 | 500 |
| Title M | 16 | 24 | 500 | 0.15 (0.2) | 700 |
| Title S | 14 | 20 | 500 | 0.1 | 700 |
| Body L | 16 | 24 | 400 | 0.5 | 500 |
| Body M | 14 | 20 | 400 | 0.25 (0.2) | 500 |
| Body S | 12 | 16 | 400 | 0.4 | 500 |
| Label L | 14 | 20 | 500 | 0.1 | 700 |
| Label M | 12 | 16 | 500 | 0.5 | 700 |
| Label S | 11 | 16 | 500 | 0.5 | 700 |

- That is 15 baseline plus 15 emphasized styles (M3E adds `displayLargeEmphasized`, …). Always use **sp** so the user's font scale applies. Android 14+ scales fonts non-linearly up to **200%**, so test at 200%. [K]

### 3.3 Shape scale [OFFICIAL Compose ShapeTokens]
- Corner radii:

| Token | Radius |
|---|---|
| None | 0 |
| ExtraSmall | 4 dp |
| Small | 8 |
| Medium | 12 |
| Large | 16 |
| **LargeIncreased** | **20** |
| ExtraLarge | 28 |
| **ExtraLargeIncreased** | **32** |
| **ExtraExtraLarge** | **48** |
| Full | pill / circle |

  The **bold** tokens are new in M3E.
- **`MaterialShapes`: 35 expressive shapes** [OFFICIAL]: Circle, Square, Slanted, Arch, Fan, Arrow, SemiCircle, Oval, Pill, Triangle, Diamond, ClamShell, Pentagon, Gem, Sunny, VerySunny, Cookie4/6/7/9/12Sided, Ghostish, Clover4Leaf, Clover8Leaf, Burst, SoftBurst, Boom, SoftBoom, Flower, Puffy, PuffyDiamond, PixelCircle, PixelTriangle, Bun, Heart.
- They are `RoundedPolygon`s from `androidx.graphics.shapes`, so they can morph (`Morph`). Use them for avatars, image crops, loading indicators and playful emphasis, **sparingly**.

### 3.4 Motion [OFFICIAL Compose Standard/ExpressiveMotionTokens + MotionTokens]
- M3E replaces easing and duration pairs with **springs** (damping ratio + stiffness).
  - **Spatial** springs (position, size, shape) may overshoot.
  - **Effects** springs (colour, opacity) are critically damped (damping 1.0).
  - Fast, default and slow values are tuned per form factor.

| Scheme / token | Spatial damping / stiffness | Effects damping / stiffness |
|---|---|---|
| Expressive fast | 0.6 / 800 | 1.0 / 3800 |
| Expressive default | 0.8 / 380 | 1.0 / 1600 |
| Expressive slow | 0.8 / 200 | 1.0 / 800 |
| Standard fast | 0.9 / 1400 | 1.0 / 3800 |
| Standard default | 0.9 / 700 | 1.0 / 1600 |
| Standard slow | 0.9 / 300 | 1.0 / 800 |

- Compose usage: `MaterialTheme.motionScheme.defaultSpatialSpec<Float>()`, `fastSpatialSpec()`, `slowEffectsSpec()`, …
  - Use **Expressive** for hero moments and **Standard** for utilitarian apps.
  - Respect the "Remove animations" setting (`Settings.Global.ANIMATOR_DURATION_SCALE` = 0).
- Legacy tokens (still valid for non-spring cases):
  - Durations: short1–4 = 50/100/150/200 ms; medium1–4 = 250/300/350/400; long1–4 = 450/500/550/600; extraLong1–4 = 700/800/900/1000.
  - Easing: emphasized (0.2, 0, 0, 1); emphasizedDecelerate (0.05, 0.7, 0.1, 1); emphasizedAccelerate (0.3, 0, 0.8, 0.15); standard (0.2, 0, 0, 1); standardDecelerate (0, 0, 0, 1); standardAccelerate (0.3, 0, 1, 1).
- iOS parallel: SwiftUI's default animation is a spring. Use `.smooth`, `.snappy` and `.bouncy` (iOS 17+), and `withAnimation(.bouncy)` for glass morphs. [K]

### 3.5 Colour and dynamic colour [K + OFFICIAL API names]
- M3 colour roles are tonal (HCT colour space):
  - primary / onPrimary / primaryContainer / onPrimaryContainer, the same for secondary, tertiary and error
  - surface, onSurface, onSurfaceVariant
  - **surfaceContainerLowest / Low / (default) / High / Highest** for elevation-by-tone
  - surfaceBright / surfaceDim, outline / outlineVariant, inverseSurface, inversePrimary, scrim
  - M3E adds more "fixed" roles.
- **Dynamic colour** (Android 12+ / API 31): `dynamicLightColorScheme(context)` / `dynamicDarkColorScheme(context)`, with a brand scheme as fallback. Contrast levels are standard, medium and high (Android 14+ user contrast setting). Build schemes with Material Theme Builder.
- Elevation is expressed with tonal surface containers rather than shadows. The levels are 0 / 1 / 3 / 6 / 8 / 12 dp. [K]

### 3.6 Touch targets
- The **minimum is 48×48 dp**, whatever the visual size. [OFFICIAL a11y doc + Compose `minimumInteractiveComponentSize()`, which reserves 48 dp]. Keep targets at least 8 dp apart [K].
- Compose `IconButton` is 40 dp visually and 48 dp for touch.

### 3.7 Android 15 / 16 / 17 platform changes that affect design
- **Edge-to-edge** [OFFICIAL]:
  - Enforced for target SDK 35 (Android 15) on 15+ devices.
  - **Target 36 (Android 16) removes the opt-out**: `windowOptOutEdgeToEdgeEnforcement` is deprecated and ignored.
  - Setup:
    1. Call `enableEdgeToEdge()` in `onCreate`. It gives transparent bars, plus a translucent scrim in 3-button navigation mode.
    2. Set `android:windowSoftInputMode="adjustResize"` for IME insets.
    3. Handle insets with `WindowInsets.systemBars`, `displayCutout`, `ime`, `safeDrawing`, `safeGestures`, `captionBar` (desktop windowing), using `Modifier.windowInsetsPadding` / `safeDrawingPadding()`, or Scaffold `contentWindowInsets`. Material3 components (TopAppBar, NavigationBar, Scaffold) handle insets by default.
  - Immersive mode: `WindowInsetsControllerCompat.hide(systemBars())`.
  - Common bugs: FAB or bottom buttons under the gesture bar, lists that don't pad the last item above the nav bar, and text fields hidden by the keyboard.
- **Predictive back** [OFFICIAL]:
  - Android 13 had a developer option. Android 14 added in-app custom animations. Android 15 turned the system animations on (developer option removed).
  - **For target 36 on Android 16+, back-to-home, cross-task and cross-activity animations are on by default. `onBackPressed()` is not called and `KEYCODE_BACK` is not dispatched.**
  - Migrate to `OnBackPressedDispatcher` + `OnBackPressedCallback` (AndroidX Activity 1.6+). In Compose use `BackHandler` / `PredictiveBackHandler { progress: Flow<BackEventCompat> -> }`.
  - Temporary opt-out: `android:enableOnBackInvokedCallback="false"`.
  - Design implication: **never intercept back just to show a "Are you sure you want to exit?" dialog**. Handle back only for real in-app state such as closing a sheet, or discarding unsaved edits with confirmation.
- **Large screens** [OFFICIAL]:
  - **Target 36**: on displays with **smallest width ≥ 600 dp**, `screenOrientation`, `resizeableActivity=false`, `min/maxAspectRatio` and `setRequestedOrientation()` are ignored. Apps fill the window with no pillarboxing. A temporary opt-out exists (a manifest property [K: `PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`]).
  - **Target 37 (Android 17) removes the opt-out.** Games are exempt, and phones (<600 dp) are not affected.
  - Android 17 also sends config changes to running activities through `onConfigurationChanged`. Opt in with `android:recreateOnConfigChanges` if you need a recreate. [SEARCH]
- Other Android 17 items [OFFICIAL headings]:
  - **Handoff** API (continue an activity on another Android device)
  - **Android Contacts Picker** (a privacy-preserving alternative to `READ_CONTACTS`)
  - **`ACCESS_LOCAL_NETWORK` permission** for target 37 (in the NEARBY_DEVICES group; prefer the system device pickers)
  - Live Update semantic colours
  - background audio hardening
  - app memory limits by RAM tier
  - lock-free MessageQueue (fewer missed frames)
  - OTP SMS protection
  - ECH on by default
- Android 16 other: "elegant text height" font APIs are deprecated/disabled; health permissions are granular. [OFFICIAL headings]
- **Notification permission (Android 13+, `POST_NOTIFICATIONS`)** [OFFICIAL]:
  - Newly installed apps are off by default.
  - Wait and request in context, after the user has seen the value.
  - After the user **denies twice, the system won't show the dialog again** (Android 11+ rule [K]). Deep-link to Settings instead.
  - Use `shouldShowRequestPermissionRationale()` to show your rationale UI.
  - Media sessions and self-managed calls are exempt.

### 3.8 Adaptive layouts [OFFICIAL developer.android.com + androidx WindowSizeClass source]
- **Width classes**:

| Class | Width | Typical devices |
|---|---|---|
| Compact | < 600 dp | 99.96% of phones in portrait |
| Medium | 600–839 | 93.73% of tablets in portrait, unfolded foldables in portrait |
| Expanded | 840–1199 | 97.22% of tablets in landscape |
| **Large** | **1200–1599** | large tablets |
| **Extra-large** | **≥ 1600** | desktop and connected displays |

- **Height classes**:

| Class | Height | Typical devices |
|---|---|---|
| Compact | < 480 dp | 99.78% of phones in landscape |
| Medium | 480–899 | |
| Expanded | ≥ 900 | |

- Constants: `WindowSizeClass.WIDTH_DP_MEDIUM_LOWER_BOUND` = 600, `…EXPANDED…` = 840, `…LARGE…` = 1200, `…EXTRA_LARGE…` = 1600, `HEIGHT_DP_MEDIUM_LOWER_BOUND` = 480, `HEIGHT_DP_EXPANDED_LOWER_BOUND` = 900. `BREAKPOINTS_V1` covers the first three widths; `BREAKPOINTS_V2` adds L and XL.
- Compose: `currentWindowAdaptiveInfo(supportLargeAndXLargeWidth = true).windowSizeClass`, then `isWidthAtLeastBreakpoint(...)` / `isHeightAtLeastBreakpoint(...)`. **Don't branch on device type or orientation.**
- Navigation by width [K/M3]:

| Width | Navigation |
|---|---|
| compact | **navigation bar** (3–5 destinations) |
| medium | **navigation rail** (the flexible nav bar with horizontal items is also allowed) |
| expanded and up | rail (collapsed or expanded) or a permanent expanded rail |

  `NavigationSuiteScaffold` switches automatically, and Now in Android uses it.
- **Canonical layouts**:
  - **List-detail**: one pane on compact and medium, two panes on expanded. On compact, back from the detail returns to the list. Use `ListDetailPaneScaffold` + `rememberListDetailPaneScaffoldNavigator()`.
  - **Supporting pane**: primary content plus secondary context. Use `SupportingPaneScaffold`.
  - **Feed**: a grid of cards, `LazyVerticalGrid(GridCells.Adaptive(minSize))`.
- Margins and spacers [K/M3]: compact 16 dp margin; medium and expanded 24 dp margin with a 24 dp pane spacer. The grid is 4 dp and 8 dp.
- Foldables: use `WindowInfoTracker` / `FoldingFeature` (hinge bounds, `isSeparating`, tabletop and book postures). Keep content off the hinge. Tabletop mode puts content on top and controls below.

### 3.9 Jetpack Compose best practices [OFFICIAL perf page + K]
- Performance:
  - `remember` expensive calculations.
  - Give **stable keys** to lazy lists (`items(list, key = { it.id })`) and use `contentType`.
  - Use `derivedStateOf` for state derived from rapidly changing state.
  - **Defer state reads** with lambda modifiers (`Modifier.offset { }`, `graphicsLayer { }`, `drawBehind`).
  - **Avoid backwards writes** (writing state after reading it in the same composition).
- Stability: use immutable UI models and Kotlin 2.x **strong skipping** (on by default since Compose compiler 2.0 [K]). Check with the Compose compiler reports.
- Build and ship: release builds with R8, **Baseline Profiles** plus Startup Profiles (often about 20–30% faster startup and less jank [K]), and Macrobenchmark in CI (Now in Android does this).
- State: hoist state, use stateless composables with `(state, onEvent)` parameters, and `rememberSaveable` for UI state across configuration and process death. Collect flows with `collectAsStateWithLifecycle()`. Use `LifecycleStartEffect` / `LifecycleResumeEffect` rather than overriding Activity callbacks.
- Navigation: **Navigation 3** (`androidx.navigation3`) is now the recommendation ("Use a single-activity application… use Navigation 3", Android architecture recommendations). The developer owns the back stack (`rememberNavBackStack`), renders it with `NavDisplay(entries…)` and defines screens with `entryProvider { }`. Now in Android has migrated to it.
- Previews and testing: `@Preview` with multiple devices, font scales and dark mode. Screenshot tests (Roborazzi or Compose Preview Screenshot Testing). Compose UI tests.

### 3.10 Now in Android / official architecture guide [OFFICIAL NiA docs + architecture recommendations page]
- **Layers**: UI (Compose + ViewModel) → **Domain** (optional use cases) → **Data** (repositories + data sources).
  - "Higher layers react to changes in lower layers. Events flow down. Data flows up." Everything is Kotlin `Flow`.
  - NiA notes that the official architecture is **not "Clean Architecture"**.
- **Data layer**:
  - Repositories are the only public API to data, **even with a single data source**. Each repository has its own models.
  - Reads are **streams**, never snapshots.
  - **The local DB is the source of truth** (Room, plus Proto DataStore for preferences).
  - Writes are suspend functions.
  - Sync reconciles remote data into local storage, and the UI observes local storage. Sync runs in **WorkManager with exponential backoff** (`SyncWorker`, `Synchronizer` interface, `OfflineFirstNewsRepository.syncWith`).
- **Domain layer**: use cases have a single `operator fun invoke`. They combine and transform repository flows (for example `GetUserNewsResourcesUseCase` combines news with user data). "Recommended in big apps". NiA has no event use cases; the UI calls repositories directly for writes.
- **UI layer**:
  - UI state is a **sealed interface of immutable data classes** (`Loading` / `Success` / …), produced only by transforming flows.
  - The ViewModel exposes a single **`StateFlow<UiState>` named `uiState`**, built with `.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), Loading)`.
  - The UI collects it with **`collectAsStateWithLifecycle()`**.
  - User events are method calls on the ViewModel, passed down as lambdas.
- **"Strongly recommended" list**:
  - a clear data layer and UI layer
  - expose data through repositories (no direct data-source access from the UI or ViewModel)
  - coroutines and flows everywhere
  - UDF
  - AAC ViewModels at **screen level only** (plain state holders for reusable components)
  - lifecycle-aware collection
  - **don't send one-off events from the ViewModel to the UI**; model them as state and consume them
  - single activity plus Navigation 3
  - Compose for new apps
  - ViewModels independent of Android lifecycle types (no Context or Activity)
  - no `AndroidViewModel` ("Recommended")
  - DI with Hilt (NiA)
- **Offline-first** [OFFICIAL offline-first guide]:
  - The local data source is canonical.
  - Read errors: local reads should not fail. Network errors surface as sync status.
  - **Write strategies**: online-only, **queued** (persist the write and send it with WorkManager when online), **lazy** (write locally, sync later).
  - **Sync**: pull-based, push-based (server sends an FCM tickle, then the app pulls) or hybrid.
  - **Conflict resolution**: last-write-wins with timestamps by default. Use version vectors or CRDT only if you need them [K].
  - Show "last synced" time and pending-write badges. Make optimistic UI updates, with rollback on permanent failure.
- **Modularization (NiA)**:
  - `:app` holds NavHost/NavDisplay, `TopLevelDestination` and the app state.
  - `:feature:X:api` holds navigation keys; `:feature:X:impl` holds everything else. `impl` may depend on other features' `api` only, never on another `impl`.
  - `:core:*`: data, database, datastore, network, model (pure JVM), ui, designsystem (`NiaTheme`, `NiaButton`, `NiaIcons`), domain, common, testing, notifications, navigation.
  - Misc: `sync`, `benchmark`, `app-nia-catalog`.
  - Core modules never depend on feature or app modules. Gradle convention plugins live in `build-logic`. Module graphs are auto-generated.
  - NiA versions (Sept 2026): AGP 9.3.2, Kotlin 2.3.0, Compose BOM 2025.09.01 (lagging), Navigation3 1.0.0, Hilt 2.59, Room + Proto DataStore, Retrofit + kotlinx.serialization, Coil, Macrobenchmark + Baseline Profiles, Roborazzi screenshot tests.
- **iOS equivalent architecture** (for the skill) [K]:
  - SwiftUI + `@Observable` view models (Observation framework, iOS 17+) or TCA.
  - Repositories/services with async/await and `AsyncSequence`.
  - SwiftData / Core Data / GRDB as the local source of truth.
  - `BGTaskScheduler` (`BGAppRefreshTask` / `BGProcessingTask`, plus the iOS 26 `BGContinuedProcessingTask` [K]) for sync.
  - Swift Package–based modularization (feature packages + core packages).
  - Swift 6 strict concurrency (`@MainActor` UI, `Sendable` models).

---

## 4. Cross-platform stacks (Sept 2026)

### 4.1 React Native + Expo [OFFICIAL RN blog sources, expo repo; SEARCH for dates]
- **New Architecture**:
  - **Fabric** is the concurrent C++ renderer.
  - **TurboModules** are lazy, type-safe native modules generated by **Codegen**.
  - **JSI** gives direct JS↔C++ calls with no JSON bridge. **Bridgeless** mode removes the legacy bridge.
- Timeline:
  - Bridgeless became default in 0.74 [K] and New Arch default in 0.76 (Oct 2024) [K].
  - **0.82 (Oct 2025) is New-Architecture-only.** You can't opt out, and legacy classes started being removed.
  - 0.83 (Dec 2025): React 19.2, no breaking changes.
  - **0.84 (Feb 2026): Hermes V1 is the default**, precompiled iOS binaries are the default, more legacy code is removed, Node 22 minimum.
  - **0.85 (Apr 7, 2026)**: a new **Shared Animation Backend** (with Software Mansion) that can animate layout props on the native driver; Jest preset moved to its own package; multiple CDP connections in DevTools; Metro HTTPS.
  - **0.86 (June 11, 2026)**: Android **edge-to-edge fixes** (`measureInWindow`, `KeyboardAvoidingView` on 15+, `Dimensions`, `StatusBar` with Modal, nav-bar contrast); moved to the `react` org under the React Foundation; no breaking changes.
  - **0.87 (Aug 11, 2026)**: **Strict TypeScript API by default** (types generated from source; deep imports like `react-native/Libraries/*` become type errors), Metro source maps 2× faster with half the memory, **experimental Swift Package Manager** (`npx react-native spm`) instead of CocoaPods, AGP 9, Node ≥ 22.13.
- **Expo**:
  - SDK 54 (Sept 2025; RN 0.81) was the last SDK with Legacy Architecture support.
  - **SDK 55** (early 2026; RN 0.83): New Arch always on; the `newArchEnabled` flag was removed.
  - **SDK 56** (May 21, 2026; RN 0.85): Hermes V1. It had a memory regression with Reanimated/worklets, fixed in 57.
  - **SDK 57** (June 30, 2026; RN 0.86): current stable.
  - **SDK 58** (on main: RN 0.88-rc, React 19.3, expo-router 58): **`expo-router/native-tabs` becomes stable** (it was `expo-router/unstable-native-tabs` in SDK 54–57). The default app directory is now `src/app/`.
- **Expo Router v6+** (from SDK 54):
  - File-based routing on React Navigation, with typed routes, deep links built in, API routes and server middleware.
  - **NativeTabs** renders the *real* system tab bar: Liquid Glass on iOS 26+, the classic bar on ≤18, Material 3 on Android. You get scroll-to-top, pop-to-root, SF Symbols (`sf="house.fill"`) and Material icons (`md="home"`).
    ```tsx
    <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="house.fill" md="home"/></NativeTabs.Trigger>
    ```
  - Other features: link previews, context menus, zoom transitions, stack toolbars, native modals.
- **Expo native-UI packages** (SDK 58 docs):
  - `expo-glass-effect` (`GlassView`, iOS 26+ only; falls back to `View`; never animate `opacity` to 0, use its `animate` prop)
  - `@expo/ui` (real SwiftUI and Jetpack Compose components)
  - `expo-symbols` (SF Symbols)
  - `expo-widgets` and `expo-app-intents` (new)
  - `expo-navigation-bar`, `expo-system-ui`, `react-native-safe-area-context`, `expo-haptics`, `react-native-keyboard-controller`, `expo-live-photo`, `expo-mesh-gradient`, `expo-age-range`, `expo-app-integrity`
- RN guidance for the skill:
  - Use native navigation primitives (react-native-screens, NativeTabs, native stack) rather than JS-drawn tab bars. Otherwise you lose Liquid Glass, predictive back and system gestures.
  - Always use safe-area-context. Test edge-to-edge on Android 15+.
  - Use FlashList for long lists and Reanimated 4 / worklets for gesture-driven animation.
  - Use Hermes V1. Use EAS Build/Update, with OTA only for JS and asset changes that follow store rules.

### 4.2 Flutter [SEARCH]
- **Impeller**:
  - Default on iOS since 3.10 [K]; default on both platforms in 3.41 (Feb 2026), with a Skia fallback still available.
  - **3.44 (May 2026, Dart 3.12): Skia is removed on Android 10+, so Impeller/Vulkan is the only renderer**, with no opt-out. Older Android keeps a fallback [UNCERTAIN on details].
  - The result is no shader-compilation jank.
- **Material/Cupertino decoupling**: the in-SDK libraries were code-frozen in 3.44 and are moving to the **`material_ui`** and **`cupertino_ui`** pub packages (1.0 was planned with Flutter 3.47 [UNCERTAIN whether shipped by 2026-09-30]). Built-in imports show deprecation warnings.
- Design implication: Flutter draws its own UI, so **Liquid Glass and M3E fidelity depend on package updates**. The Cupertino widgets don't automatically become Liquid Glass. Budget custom work, or use platform views for native bars. It is a good fit for brand-heavy custom UI, games or a single codebase with 6 targets.

### 4.3 Kotlin Multiplatform / Compose Multiplatform [SEARCH]
- **KMP**: share business, data and domain logic (Ktor, SQLDelight or Room KMP, kotlinx.serialization/coroutines, Koin/Metro DI). The UI can stay native (SwiftUI + Compose), or be shared with **Compose Multiplatform**.
- CMP versions:
  - **iOS stable since CMP 1.8 (May 2025)**.
  - 1.10 (Jan 2026): common `@Preview`, **Navigation 3 on non-Android targets**, bundled **Compose Hot Reload 1.0**.
  - 1.11 (May 2026): experimental native UIView-based text input on iOS, new UI testing.
  - **1.12 (Aug 2026)**: MCP server for AI agents in Hot Reload.
- Kotlin 2.4.0 (June 2026): **Swift Export Alpha** (idiomatic Swift API instead of the ObjC header), SPM import of ObjC-compatible deps; Kotlin/Native builds about 25% faster using under half the RAM.
- Design caveat: CMP on iOS renders Material-style UI by default. For iOS-native feel, wrap native UIKit/SwiftUI views (`UIKitView`) for tab bars and navigation, or keep a native SwiftUI shell. Check iOS scroll physics, text selection and VoiceOver support per version.

### 4.4 Native vs cross-platform decision guide
| Choose… | When |
|---|---|
| **Native (SwiftUI + Compose)** | Platform-flagship feel (Liquid Glass, M3E, predictive back, widgets, Live Activities, App Intents, watch, CarPlay, visionOS) matters. Heavy use of new OS APIs on day one. Performance-critical media, AR, camera. Separate iOS and Android teams exist. |
| **KMP (+ native UI)** | You want one tested business, data and sync layer but native UI on each platform. You are an Android-first Kotlin team. Brownfield adoption module by module. |
| **Compose Multiplatform** | A Kotlin team wants shared UI too and accepts Material-leaning visuals on iOS (or does per-platform theming). |
| **React Native + Expo** | A web/React team, fast iteration, OTA updates, a big JS ecosystem. Native-feel is achievable with NativeTabs, native stacks and @expo/ui. |
| **Flutter** | Pixel-identical custom brand UI on many targets (mobile, web, desktop, embedded), a Dart team, animation-heavy custom design systems. Accept lagging native-look fidelity. |
| **PWA / web wrapper** | Rarely for App Store distribution: 4.2 Minimum Functionality risk, and no native navigation or gestures. |

- Red flags for cross-platform: the app is mostly OS integrations (widgets, intents, extensions, background tasks, BLE), or strict accessibility or performance targets that you can't verify on the framework.

---

## 5. Platform-convention differences table (for "don't make iOS look like Android" rules)

| Concern | iOS / iPadOS (26–27) | Android (16–17, M3/M3E) |
|---|---|---|
| **Back navigation** | Leading-edge **swipe-back** plus a Back chevron (symbol only, no "Back" text in iOS 26 toolbars) at top-leading. Modals: swipe down or Cancel/Close. There is no system back button. | **System back** (gesture from either edge, or 3-button nav) with **predictive back** animations. The top-app-bar Up arrow is optional. Never block back. |
| **Primary navigation** | **Floating Liquid Glass tab bar at the bottom** (about 5 tabs max). A search tab at the trailing end. On iPad it adapts to a sidebar. On iPhone Duo it moves to the side. | **Navigation bar** at the bottom (3–5) on compact; **navigation rail** on medium+; the drawer is deprecated in favour of the expanded rail. `NavigationSuiteScaffold`. |
| **Top bar** | Navigation bar with a **large title** that collapses on scroll. Glass buttons grouped. Title centred when inline. | Top app bar: small (title left-aligned), center-aligned, medium/large flexible, collapsing on scroll. |
| **Primary action** | `.glassProminent` or a prominent toolbar item, trailing. **No FAB convention.** | **FAB** (56/80/96 dp) or FAB menu, bottom-trailing. Floating toolbar. |
| **Typography** | SF Pro, Dynamic Type text styles (Body 17 pt), 11 pt minimum. | Roboto / Roboto Flex (or a brand font), M3 type scale (Body L 16 sp), sp units, non-linear scaling to 200%. |
| **Units / touch target** | points; **44×44 pt** (28 minimum). | dp/sp; **48×48 dp**. |
| **Dialogs / alerts** | `UIAlertController` alert: centred title, stacked or side-by-side buttons, the preferred action bold. Destructive actions are red. Choices go in an **action sheet / confirmationDialog** (a popover on iPad). | M3 dialog: 28 dp corner, left-aligned title, text buttons **bottom-trailing (confirm on the right)**. Choices go in a **modal bottom sheet** or menu. |
| **Button order** | Cancel leading, confirm trailing (in alerts and sheets). | Dismiss left, confirm right (both trailing-aligned). |
| **Date/time pickers** | Inline calendar / compact `DatePicker` popover / wheels (`UIDatePicker` styles). | Material `DatePicker` (calendar or modal input), `TimePicker` (clock dial or input), `DateRangePicker`. |
| **Share** | `ShareLink` / `UIActivityViewController` share sheet (medium detent). | Android Sharesheet via `Intent.ACTION_SEND` + `Intent.createChooser`. Don't build a custom share UI. |
| **Menus** | Pull-down menus from buttons, **context menus on long-press** with previews, glass menus. | Dropdown/exposed menus (M3E redesigned menus with shape and colour), long-press gives contextual actions or selection mode. |
| **Toasts / feedback** | No system toast. Use inline status, HUD-style banners sparingly, haptics. | **Snackbar** (optionally with an action) at the bottom, above the FAB and nav bar. |
| **Lists** | Inset-grouped lists, **swipe actions** (trailing destructive), disclosure chevrons. | Full-bleed list items (one, two or three lines), with swipe used less. Checkbox selection mode. |
| **Search** | Search tab, bottom toolbar field, or `.searchable` in the nav bar. | Search bar / `SearchBar` + `ExpandedFullScreenSearchBar`, often in the top app bar. |
| **Segmented choice** | `Picker(.segmented)` / segmented control. | Connected button group (M3E; replaces segmented buttons) or chips. |
| **Switch** | `Toggle` (green or accent colour). | M3 `Switch` with an optional thumb icon. |
| **Settings** | Inset-grouped Form. Deep-link to the system Settings app for app permissions. | Preference screens, per-app settings, notification channels. |
| **Haptics** | Rich Taptic patterns, `.sensoryFeedback`. | `performHapticFeedback` constants; vary by device quality. |
| **Icons** | SF Symbols 7 (weights that match text). | Material Symbols (variable: fill, weight, grade, optical size). |
| **App icon** | Layered Liquid Glass icon, 6 appearances, Icon Composer. | **Adaptive icon** 108×108 dp with a 72 dp safe zone, a **monochrome layer for themed icons** (required for Android 13+ theming) [K]. |
| **Status / live info** | Live Activities + Dynamic Island, widgets, Controls. | Live Updates (ProgressStyle, status chips), Glance widgets, Quick Settings tiles. |
| **Edge-to-edge** | Always. Use safe areas. | Enforced (target 35+; opt-out removed at 36). Use WindowInsets. |

---

## 6. Performance budgets

| Metric | Target | Source |
|---|---|---|
| Frame time at 60 Hz | **16.67 ms** | math / [OFFICIAL Android "under 16ms"] |
| Frame time at 120 Hz (ProMotion, most flagship Androids) | **8.33 ms** | math |
| Android frozen frame | **> 700 ms**; never acceptable | [OFFICIAL] |
| Android slow frame | > 16 ms at 60 Hz | [OFFICIAL] |
| Play vitals bad-behaviour thresholds (overall / per phone model) | **user-perceived crash rate 1.09% / 8%**; **ANR rate 0.47% / 8%**; excessive partial wake locks 5% | [OFFICIAL] |
| Play vitals "excessive" startup | cold **≥ 5 s**, warm **≥ 2 s**, hot **≥ 1.5 s** | [K, Play vitals docs; verify] |
| iOS launch | first frame in about **400 ms** or less (Apple WWDC guidance); the watchdog kills launches over about 20 s | [K] |
| Practical product budget | cold start TTID **< 1 s** on mid-tier devices; TTFD < 2 s; tap → visual response < 100 ms; animations 60/120 fps; scroll jank < 1% slow frames | [K, industry practice] |
| Android 17 | lock-free MessageQueue (fewer missed frames); app memory limits by RAM tier | [OFFICIAL] |

- Android startup tools:
  - Measure TTID ("Displayed" logcat) and TTFD (`reportFullyDrawn()`).
  - Baseline and Startup Profiles, `SplashScreen` API (Android 12+), Macrobenchmark, R8 full mode.
  - Defer init (App Startup library, lazy DI), avoid main-thread I/O.
- iOS startup tools: Instruments App Launch template, MetricKit, XCTest `XCTApplicationLaunchMetric`. Reduce dylibs and static initialisers; defer work after the first frame.
- Lists:
  - Android: stable keys, `contentType`, image sizing and caching (Coil / Kingfisher / Nuke / expo-image).
  - RN: FlashList.
  - Flutter: `ListView.builder` with an `itemExtent` or `prototypeItem`.
- App size [K]: iOS cellular download limit about 200 MB (the user can override it). Android App Bundle, dynamic feature modules, Play Asset Delivery.

---

## 7. Cross-cutting UX patterns

### 7.1 Onboarding and permission priming
- **Value first**: let people use the app, or at least see it, before sign-up if you can. Apple 5.1.1(v) forbids forcing login for non-account features.
- Keep the steps few. Offer "Continue with Apple / Google" plus passkeys (both platforms support passkeys through AuthenticationServices / Credential Manager [K]).
- Permissions are **just-in-time**, triggered by the feature. The priming screen explains the benefit.
  - **iOS**: one "Continue" button, no skip (HIG, §2.11).
  - **Android**: the rationale UI can include "Not now" [K; Android docs only require explaining the impact].
- Degrade gracefully when access is denied: show which feature is limited, with a Settings deep link (`UIApplication.openSettingsURLString` / `Settings.ACTION_APPLICATION_DETAILS_SETTINGS`).
- Location: request **when-in-use** first and upgrade to "always" later. Offer precise/approximate (iOS 14+, Android 12+).
- Photos: prefer the **system pickers**, which need no permission (`PhotosPicker` / Android Photo Picker). Android 17 adds the Contacts Picker.

### 7.2 Push notifications UX
- Ask after a meaningful event ("Notify me when my order ships"), not on first launch.
- iOS: consider provisional authorization.
- Android: create **notification channels** by category so users can tune them. On Android 13+, request `POST_NOTIFICATIONS` in context.
- Deep-link every notification to the relevant screen, with the back stack synthesised (Android `TaskStackBuilder`, or a Navigation 3 deep link that builds the back stack).
- Respect quiet hours and frequency caps. Marketing needs opt-in on both platforms (Apple 4.5.4).
- Use rich notifications (images, actions) and grouping or threads.

### 7.3 Deep links [K]
- **iOS Universal Links**: host `apple-app-site-association` at `https://domain/.well-known/`, add the Associated Domains entitlement `applinks:domain`, and handle in `onOpenURL` / `NSUserActivity`.
- **Android App Links**: host `assetlinks.json` at `/.well-known/`, use an intent filter with `android:autoVerify="true"`, and check with `adb shell pm get-app-links`.
- Custom URL schemes are a fallback only, because anyone can claim them.
- Expo Router and Navigation 3 map URLs to routes. Every deep-linked screen needs a sensible back or up path, and must handle logged-out and missing-data states.
- Deferred deep links (install, then route) need a third-party or first-party attribution service. Firebase Dynamic Links shut down in Aug 2025 [K].

### 7.4 Mobile forms and keyboards
- **iOS**: `.keyboardType(.emailAddress | .numberPad | .decimalPad | .phonePad | .URL)`, `.textContentType(.emailAddress | .username | .password | .newPassword | .oneTimeCode | .postalCode | .telephoneNumber)` for AutoFill and password or OTP autofill, `.submitLabel(.next | .done | .go | .search)`, `@FocusState` to move focus, `.autocorrectionDisabled()`, `.textInputAutocapitalization(.never)`.
- **Android Compose**: `KeyboardOptions(keyboardType = KeyboardType.Email | Number | Phone | Password | Uri | Decimal, imeAction = ImeAction.Next | Done | Search | Go, capitalization = …, autoCorrectEnabled = …)`, `KeyboardActions`, `Modifier.semantics { contentType = ContentType.EmailAddress }` for Autofill [K: Compose autofill API 1.8+], `imePadding()`.
- Rules:
  - Single column. Labels always visible (don't rely on the placeholder alone). Mark optional fields rather than required ones.
  - Validate inline on blur, not on every keystroke.
  - The keyboard must never cover the focused field or the submit button: iOS keyboard layout guide / `safeAreaInset`; Android `adjustResize` + `imePadding`.
  - Prefer pickers or segmented choices over free text. Never prefill passwords. Support paste and one-time-code autofill.
  - HIG: "Get information from the system whenever possible", and don't ask for data you can derive.

### 7.5 Thumb zones and ergonomics
- About 49% of people hold the phone one-handed and about 75% of interactions are thumb-driven (Hoober 2013) [K]. The top corners are the hardest to reach on 6.1–6.9" screens.
- Put frequent actions at the **bottom**: iOS 26 moved search and toolbars down and made the tab bar floating; Android uses the nav bar, FAB and bottom sheets. Keep destructive actions away from frequent-tap zones.
- iOS reachability, and the Android split keyboard and one-handed mode, exist but don't rely on them.

### 7.6 Dark mode
- Support both, following the system. **Don't add an app-level appearance toggle** unless there is a strong reason (HIG).
- Use semantic or dynamic colours. Dark surfaces should be elevated greys, not pure black, except for OLED-focused media apps.
- Dim bright images and soften white backgrounds. Check contrast in both modes, including with Increase Contrast.
- Android: `isSystemInDarkTheme()` + dynamic dark scheme. Status and nav bar icon contrast is handled by `enableEdgeToEdge` auto-styling.
- iOS app icons need dark and tinted variants (§2.7). Android themed icons need a monochrome layer.

### 7.7 Foldables and tablets
- Design by window size class, never by device. Support multi-window and resizing:
  - Android 16/17 ignore orientation locks on ≥ 600 dp.
  - iPadOS 26 has free-form windowing (resizable windows with window controls) [K].
- Use list-detail on expanded widths. Don't stretch a phone column to 1,200 dp; cap line length (`readableContentGuide`, or a max width of about 600–840 dp for text).
- Support keyboard, mouse and trackpad (hover states, shortcuts, right-click context menus) and drag-and-drop.
- Hinge and fold: avoid it (Android `FoldingFeature`; iPhone Duo reserved regions and even columns).
- Continuity across fold/unfold: keep scroll position and state (`rememberSaveable` / `SceneStorage`).

### 7.8 Offline-first and sync (cross-platform restatement)
- Local DB is the single source of truth. The UI observes the DB. The network writes into the DB.
- Queue writes with an idempotency key and retry with exponential backoff (WorkManager / BGTaskScheduler / Expo BackgroundTask).
- Show offline state unobtrusively (a banner, not a blocking dialog), with pending-changes indicators and last-synced time.
- Conflict policy is explicit: LWW, field-level merge, or CRDT.
- Options: Room / SQLDelight (KMP) / SwiftData / GRDB / expo-sqlite / WatermelonDB / PowerSync / Realm-like services [K].

---

## 8. Mobile design anti-patterns (skill "don't" list)

1. **Web-in-a-wrapper feel**: a WebView shell with web navigation, hover affordances, and no native tab bar or back gesture. Also an App Store 4.2 risk.
2. **Custom navigation that breaks system back**: overriding the iOS edge-swipe (a custom nav with no `UINavigationController` or `NavigationStack`), hiding the back button, or intercepting Android back to show "exit app?". This breaks predictive back on API 36+.
3. **Hamburger menu as primary navigation on iOS**, or on Android compact (M3E deprecates the drawer). Use a tab bar or navigation bar for 3–5 top destinations.
4. **Tiny touch targets**: below 44 pt / 48 dp, icon-only buttons with 24 pt hit areas, adjacent targets without 8–12 pt spacing.
5. **Ignoring safe areas and insets**: content under the Dynamic Island or home indicator, buttons under the Android gesture bar, keyboard covering inputs. Hard-coded status bar heights.
6. **Porting one platform's conventions to the other**: a FAB on iOS; iOS-style back chevrons and "Back" text on Android; centred Android titles styled like iOS; bottom-sheet share UIs replacing the system share sheet; iOS toggle styling on Android.
7. **Liquid Glass misuse**: glass on content cards or list rows; glass on glass; tinting every control; custom opaque backgrounds on bars that kill the glass; `.clear` glass over plain backgrounds; ignoring Reduce Transparency; text + symbol buttons packed together.
8. **Fixed font sizes**: ignoring Dynamic Type or sp scaling; truncating at AX sizes; text in images.
9. **Permission ambush**: all permission prompts at first launch; notification prompt before any value; fake alert images; iOS pre-prompts with a "skip" button (HIG violation).
10. **Blocking splash screens and long intro carousels**; launch screen with logo or ads (iOS HIG says no).
11. **Hiding or disabling tabs** based on state; tab bar used for actions (for example a "+" compose tab). Use a toolbar or FAB instead.
12. **Modal stacking**: sheet on sheet, modals for long flows, no clear dismiss.
13. **Orientation or resize locks** on tablets and foldables (ignored at target 36/37 anyway); letterboxed phone UI on tablets.
14. **Gesture-only features** with no visible alternative (accessibility); custom gestures that conflict with system edges.
15. **Janky, heavy animation**: continuous glass animations, layout-thrashing animations, no Reduce Motion fallback, JS-thread animations in RN.
16. **Colour-only status**, low contrast (below 4.5:1), no dark mode, a forced app-specific theme toggle.
17. **Toasts or snackbars for critical errors**; auto-dismissing UI with important info (a cognitive accessibility issue).
18. **Forced account creation** before value; no in-app account deletion (Apple 5.1.1(v); Google Play also requires deletion paths [K]).
19. **Spinner-only loading** for content: prefer skeletons or placeholders with cached content first (offline-first).
20. **Over-notification and marketing push** without opt-in; Time Sensitive misuse; Live Activities or Live Updates used for ads or promos.

---

## 9. Suggested skill decomposition (for the repo)
- `ios-liquid-glass-design`: §1 + §2.5 + §2.7 (APIs, do/don't, iOS 27 changes, accessibility modes).
- `ios-hig-foundations`: typography table, touch targets, layout and safe areas, colour and contrast, haptics, gestures, accessibility, iPhone Duo.
- `android-material3-expressive`: type, shape and motion tokens, component sizes, dynamic colour, M3E components and Compose names.
- `android-platform-2026`: edge-to-edge, predictive back, large-screen enforcement, Android 17 changes, notification permission, Live Updates.
- `adaptive-layouts`: window size classes, canonical layouts, foldables, iPad/iPhone Duo, NavigationSuiteScaffold, `sidebarAdaptable`.
- `mobile-architecture`: NiA layers, UDF, StateFlow `uiState`, offline-first, modularization; iOS equivalents.
- `cross-platform-selection`: RN/Expo, Flutter, KMP/CMP status and the decision matrix.
- `platform-conventions-diff`: §5 table.
- `mobile-performance-budgets`: §6.
- `mobile-ux-patterns`: onboarding, permissions, push, deep links, forms, thumb zones, dark mode (§7).
- `mobile-anti-patterns` / review checklist: §8 + App Review pitfalls §2.13.

---

## 10. Sources

**Official / primary (read this session)**
- Apple HIG (via developer.apple.com/tutorials/data JSON):
  - [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) (changed Jun 8, 2026)
  - [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) (changed Sep 9, 2026)
  - [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
  - [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
  - [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) (Mar 24, 2026)
  - [Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields) (Jun 8, 2026)
  - [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
  - [App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons) (Jun 8, 2026)
  - [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
  - [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  - [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
  - [Scroll views](https://developer.apple.com/design/human-interface-guidelines/scroll-views)
  - [Color](https://developer.apple.com/design/human-interface-guidelines/color)
  - [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
  - [Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities)
  - [Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets)
  - [Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo) (new Sep 9, 2026)
  - Design principles (Jun 8, 2026)
- HIG mirror used for patterns (haptics, onboarding, launching, notifications, gestures, keyboards, entering data, dark mode): [github.com/y-128/Apple-HIG-Design](https://github.com/y-128/Apple-HIG-Design) (commit Sep 17, 2026).
- [WWDC26 SwiftUI guide](https://developer.apple.com/wwdc26/guides/swiftui/); [What's new in iOS 27](https://developer.apple.com/ios/whats-new/)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (Last Updated June 8, 2026)
- Liquid Glass API reference: [github.com/conorluddy/LiquidGlassReference](https://github.com/conorluddy/LiquidGlassReference) (community; covers WWDC25 sessions 219/323/356)
- Android:
  - [Behavior changes 17 (targeting)](https://developer.android.com/about/versions/17/behavior-changes-17)
  - [Behavior changes 17 (all apps)](https://developer.android.com/about/versions/17/behavior-changes-all)
  - [Android 17 features](https://developer.android.com/about/versions/17/features)
  - [Behavior changes 16](https://developer.android.com/about/versions/16/behavior-changes-16)
  - [Window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)
  - [Canonical layouts](https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts)
  - [Predictive back](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)
  - [Edge-to-edge setup](https://developer.android.com/develop/ui/compose/system/setup-e2e)
  - [Architecture recommendations](https://developer.android.com/topic/architecture/recommendations)
  - [Offline-first](https://developer.android.com/topic/architecture/data-layer/offline-first)
  - [Launch time](https://developer.android.com/topic/performance/issues/launch-time)
  - [Render/jank](https://developer.android.com/topic/performance/issues/render)
  - [Play vitals](https://developer.android.com/google/play/vitals)
  - [Notification permission](https://developer.android.com/develop/ui/compose/notifications/notification-permission)
  - [Live Updates](https://developer.android.com/develop/ui/views/notifications/live-update)
  - [Compose performance best practices](https://developer.android.com/develop/ui/compose/performance/bestpractices)
  - [Accessibility touch targets](https://developer.android.com/guide/topics/ui/accessibility/apps)
  - [Runtime permissions](https://developer.android.com/training/permissions/requesting)
- androidx source (androidx-main): `compose/material3/.../tokens/{TypeScaleTokens,ShapeTokens,MotionTokens,StandardMotionTokens,ExpressiveMotionTokens,Button*Tokens,Fab*Tokens,NavigationBarTokens,NavigationRail*Tokens,FloatingToolbarTokens}.kt`, `MaterialShapes.kt`, `MaterialTheme.kt`, `MotionScheme.kt`, `InteractiveComponentSize.kt`, `window/window-core/.../WindowSizeClass.kt`, `libraryversions.toml`.
- Now in Android: [github.com/android/nowinandroid](https://github.com/android/nowinandroid) `docs/ArchitectureLearningJourney.md`, `docs/ModularizationLearningJourney.md`, `gradle/libs.versions.toml` (commit Sep 22, 2026).
- React Native blog sources (react-native-website repo): posts for 0.82, 0.84, [0.85](https://reactnative.dev/blog/2026/04/07/react-native-0.85), [0.86](https://reactnative.dev/blog/2026/06/11/react-native-0.86), [0.87](https://reactnative.dev/blog/2026/08/11/react-native-0.87).
- Expo repo (main, Sep 30, 2026): `docs/pages/router/advanced/native-tabs.mdx`, `docs/pages/versions/v58.0.0/sdk/*` (glass-effect, ui, widgets, app-intents), `packages/expo/package.json` (58.0.0, RN 0.88.0-rc.3).

**Secondary (search summaries)**
- MacRumors: [How Liquid Glass is changing in iOS 27](https://www.macrumors.com/2026/06/10/how-liquid-glass-is-changing-in-ios-27/), [iOS 27 revamps app icons](https://www.macrumors.com/2026/06/16/ios-27-revamps-app-icons/), [iOS 27 release](https://www.macrumors.com/2026/09/13/ios-27-release-date-new-features/), [App Store guidelines June 2026](https://www.macrumors.com/2026/06/09/app-store-guidelines-low-quality-apps/)
- [TechCrunch: Apple tweaking Liquid Glass](https://techcrunch.com/2026/06/08/apple-is-tweaking-its-controversial-liquid-glass-design/)
- [AppleInsider: Liquid Glass mandatory in iOS 27](https://appleinsider.com/articles/26/03/26/stop-holding-out-hope-liquid-glass-will-be-mandatory-in-ios-27)
- [Donny Wals: opting out of Liquid Glass](https://www.donnywals.com/opting-your-app-out-of-the-liquid-glass-redesign-with-xcode-26/)
- [Nil Coalescing: Liquid Glass sheets](https://nilcoalescing.com/blog/PresentingLiquidGlassSheetsInSwiftUI/)
- [WWDC25 SF Symbols 7](https://developer.apple.com/videos/play/wwdc2025/337/); [WWDC25 Icon Composer](https://developer.apple.com/videos/play/wwdc2025/361/); [WWDC25 Get to know the new design system](https://developer.apple.com/videos/play/wwdc2025/356/)
- [Android 17 is here](https://android-developers.googleblog.com/2026/06/Android-17.html); [Prepare for resizability/orientation changes in Android 17](https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17)
- [Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
- [M3 Expressive motion physics blog](https://m3.material.io/blog/m3-expressive-motion-theming); [Compose Material 3 releases](https://developer.android.com/jetpack/androidx/releases/compose-material3)
- Expo changelogs: [SDK 55](https://expo.dev/changelog/sdk-55), [SDK 56](https://expo.dev/changelog/sdk-56), [SDK 57](https://expo.dev/changelog/sdk-57); [Expo Router v6](https://expo.dev/blog/expo-router-v6)
- [What's new in Flutter 3.44](https://flutter.dev/blog/whats-new-in-flutter-3-44); [material_ui / cupertino_ui migration](https://docs.flutter.dev/release/breaking-changes/material-ui-and-cupertino-ui)
- JetBrains: [CMP 1.12.0](https://blog.jetbrains.com/kotlin/2026/08/compose-multiplatform-1-12-0/), [CMP 1.11.0](https://blog.jetbrains.com/kotlin/2026/05/compose-multiplatform-1-11-0/), [CMP 1.10.0](https://blog.jetbrains.com/kotlin/2026/01/compose-multiplatform-1-10-0/), [Kotlin 2.4.0](https://blog.jetbrains.com/kotlin/2026/06/kotlin-2-4-0-released/), [KotlinConf'26 keynote](https://blog.jetbrains.com/kotlin/2026/05/kotlinconf26-keynote-highlights/)

**Open questions / to verify before publishing**
- Whether iOS 27 SwiftUI defaults to the `.hard` scroll edge effect.
- Details of the iOS 27 transparency slider API (is there a new environment value?).
- Whether SF Symbols 8 shipped.
- iPhone Duo point dimensions and launch date (only the HIG page was seen).
- Exact Play vitals startup thresholds.
- When material3 1.5.0 goes stable.
- Whether Flutter 3.47 and `material_ui` 1.0 shipped.
- Whether Expo SDK 58 is released or still in beta.
- M3E research figures (46 studies / 18k participants / 4×).
