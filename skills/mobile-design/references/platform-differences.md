# iOS vs Android — Platform Differences

As of 2026-09: iOS/iPadOS 26–27 (Liquid Glass) and Android 16–17 with Material 3 / Material 3 Expressive. Use this table when porting a design or deciding where two platform builds should intentionally differ. Rule of thumb: share content, information architecture, brand color, and copy; let chrome, navigation, dialogs, pickers, and system surfaces follow each platform.

## Contents
- Convention table
- What to share vs. what to split
- Cross-platform framework notes
- Sources

## Convention table

| Concern | iOS / iPadOS | Android |
|---|---|---|
| **Back navigation** | Leading-edge swipe-back plus a Back chevron at top-leading (symbol only, no "Back" text on iOS 26+). Modals dismiss by swipe-down or Cancel/Close. No system back button. | System back (gesture from either side edge, or 3-button nav) with predictive back animations. The top app bar Up arrow is optional. Never block back. |
| **Primary navigation** | Floating Liquid Glass tab bar at the bottom (practical max ~5 tabs); a dedicated search tab can sit at the trailing end. iPad: tab bar near the top that can convert to a sidebar. | Navigation bar at the bottom (3–5 destinations) on compact width; navigation rail on medium and wider. The expanded rail supersedes the navigation drawer in M3 Expressive. |
| **Top bar** | Navigation bar with a large title that collapses to an inline centered title on scroll; grouped glass buttons. | Top app bar: small (title start-aligned), center-aligned, or medium/large flexible; collapses on scroll. |
| **Primary action** | A prominent toolbar item on the trailing side (`.glassProminent` / confirmation action). No FAB convention. | FAB (56 / 80 / 96 dp) or FAB menu, bottom-trailing; or a floating toolbar. |
| **Typography** | SF Pro through Dynamic Type text styles; Body 17 pt; 11 pt minimum. | Roboto / Roboto Flex or a brand font mapped to the M3 type scale; Body Large 16 sp; `sp` units; non-linear scaling up to 200%. |
| **Units and targets** | Points; 44×44 pt default target. | dp/sp; 48×48 dp minimum target, ≥ 8 dp apart. |
| **Alerts / dialogs** | Centered alert, preferred action bold, destructive in red. Choices go in an action sheet / confirmation dialog (a popover on iPad). | M3 dialog with 28 dp corners, start-aligned title, text buttons bottom-trailing with confirm rightmost. Choices go in a modal bottom sheet or menu. |
| **Button order in dialogs and sheets** | Cancel leading, confirm trailing. In a single-view sheet: Cancel top-leading, Done top-trailing. | Dismiss then confirm, both trailing-aligned (confirm on the right). |
| **Date / time pickers** | Inline calendar, compact date picker popover, or wheels. | Material `DatePicker` (calendar or text input), `TimePicker` (dial or input), `DateRangePicker`. |
| **Share** | System share sheet (`ShareLink` / `UIActivityViewController`). | Android Sharesheet (`Intent.ACTION_SEND` + `Intent.createChooser`). Never a custom share UI on either. |
| **Menus** | Pull-down menus from buttons; context menus on long-press with previews. | Dropdown / exposed dropdown menus; long-press opens contextual actions or selection mode. |
| **Transient feedback** | No system toast. Inline status, occasional banner, haptics. | Snackbar at the bottom, above the FAB and navigation bar, optionally with one action. |
| **Lists** | Inset-grouped lists, trailing swipe actions (destructive on the far trailing side), disclosure chevrons. | Full-bleed one/two/three-line list items; swipe less common; checkbox selection mode. |
| **Search** | Search tab, bottom toolbar search field, or `.searchable` in the navigation bar; inline field for filtering a list. | `SearchBar` in or replacing the top app bar, expanding to full-screen search. |
| **Segmented choice** | Segmented control (`Picker` with `.segmented`). | Connected button group (M3 Expressive) or filter chips. |
| **Switch** | `Toggle` (system green or app tint). | M3 `Switch`, optionally with a thumb icon. |
| **Settings** | Inset-grouped form; deep-link to the Settings app for permissions. | Preference screens; notification channels per category; deep-link to app details settings. |
| **Haptics** | Rich Taptic Engine patterns (notification, impact, selection). | `HapticFeedbackConstants` via `performHapticFeedback`; quality varies by device, so keep them subtle. |
| **Icons** | SF Symbols (weights match text weight, scale with Dynamic Type). | Material Symbols (variable fill, weight, grade, optical size). |
| **App icon** | Layered 1024×1024 icon authored in Icon Composer; default, dark, clear, and tinted appearances. | Adaptive icon (108×108 dp canvas, content inside the central safe zone) with a monochrome layer for themed icons. |
| **Live / glanceable info** | Widgets, Live Activities and the Dynamic Island, Controls. | Glance widgets, Live Updates (progress-style notifications, status chips), Quick Settings tiles. |
| **Edge-to-edge** | Always; lay out against safe areas. | Enforced for apps targeting API 35+; the opt-out is ignored when targeting API 36+. Handle `WindowInsets`. |
| **Tablet layout** | Size classes; sidebar / split view; free-form windows on iPadOS 26+. | Window size classes (compact / medium / expanded / large / extra-large); canonical list-detail and supporting-pane layouts. |

## What to share vs. what to split

| Share across platforms | Split per platform |
|---|---|
| Information architecture and destination names | Navigation container (tab bar vs nav bar/rail), back behavior |
| Brand color as an accent / seed color | Surface colors (iOS semantic colors vs M3 color roles, dynamic color) |
| Copy, tone, illustrations | Typeface for UI text (SF Pro vs Roboto/brand), type scale |
| Data, business rules, validation | Dialogs, pickers, menus, share, toasts vs snackbars |
| Iconography *meaning* | Icon set (SF Symbols vs Material Symbols) |
| Motion *intent* (what moves and why) | Motion system (SwiftUI springs vs M3 motion scheme) |

A brand font is fine for display moments (headlines, marketing screens) on both platforms. Keep the system font for dense UI text unless the brand font supports the full weight range, the scripts you ship, and text scaling.

## Cross-platform framework notes

- **React Native / Expo:** use native navigation primitives (native stack, `expo-router/native-tabs` — stable in SDK 58, `unstable-native-tabs` in SDK 54–57) so you get Liquid Glass tab bars on iOS, Material bars on Android, system back, and gestures. JS-drawn tab bars lose all of that.
- **Flutter:** draws its own widgets, so Liquid Glass and M3 Expressive fidelity depend on package updates; Cupertino widgets do not become Liquid Glass automatically. Budget for platform-adaptive widgets or native platform views for bars.
- **Compose Multiplatform:** renders Material-style UI on iOS by default. For an iOS-native feel, keep a SwiftUI shell (tab bar, navigation) and share screens, or wrap native views for bars; check scroll physics, text selection, and VoiceOver per release.

## Sources

- Apple Human Interface Guidelines — Tab bars, Toolbars, Sheets, Search fields, Sidebars, Materials, App icons, Layout (developer.apple.com/design/human-interface-guidelines, pages updated through Sept 2026)
- Material Design 3 — Navigation, Dialogs, Snackbar, Button groups (https://m3.material.io)
- Android Developers — Edge-to-edge (https://developer.android.com/develop/ui/compose/system/setup-e2e), Predictive back (https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture), Window size classes (https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes), Android 16 behavior changes (https://developer.android.com/about/versions/16/behavior-changes-16)
- Expo Router native tabs docs (https://docs.expo.dev/router/advanced/native-tabs/)
- Flutter 3.44 release notes (https://flutter.dev/blog/whats-new-in-flutter-3-44)
