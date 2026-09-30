---
name: ios-design
description: Use when designing or building an iPhone or iPad app UI, in SwiftUI, UIKit, or a cross-platform stack targeting iOS, or when adopting or reviewing the iOS 26/27 Liquid Glass design. Covers Liquid Glass rules and SwiftUI glass APIs, iOS 27 changes, tab bars, toolbars, navigation stacks and split views, sheets and detents, search placement, Dynamic Type and SF Pro, SF Symbols, semantic colors and materials, layout with safe areas and size classes, app icons (Icon Composer; light, dark, clear, tinted), haptics, VoiceOver and accessibility settings, iPad multitasking, iPhone Duo, and App Store Review pitfalls (Sign in with Apple, account deletion, purpose strings, subscriptions, minimum functionality). Also use when the user says "make it feel like a real iOS app", "update for iOS 26", "adopt Liquid Glass", "our app got rejected", or "why does our tab bar look old". For cross-platform mobile UX (permissions, onboarding, forms, offline) use mobile-design; for Android use android-design.
license: MIT
metadata:
  version: "1.0.0"
  category: mobile
  related: "mobile-design android-design mobile-architecture accessibility motion-design"
---

# iOS Design

Great iOS apps look like they were built by Apple's neighbors: system navigation, Dynamic Type, SF Symbols, semantic colors, and — since iOS 26 — Liquid Glass on the controls that float above content. This skill encodes the Human Interface Guidelines and SwiftUI APIs as of 2026-09 (iOS 27 shipped 2026-09-14; the HIG was rewritten in June 2026), so you adopt the platform instead of re-painting it. It protects platform trust, accessibility, and a clean App Review.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also confirm: minimum iOS version (Liquid Glass APIs need iOS 26+; provide fallbacks below that), UI framework (SwiftUI, UIKit, React Native/Expo, Flutter, CMP), and whether iPad is supported (App Review 2.4.1 expects iPhone apps to run on iPad).

## Core principles

1. **Use system components first.** Standard tab bars, toolbars, sheets, and controls adopt Liquid Glass, accessibility settings, and new devices automatically; custom ones age the day a new iOS ships.
2. **Glass is for the control layer, never the content.** Liquid Glass floats navigation and controls above content; cards, rows, and media stay in the content layer.
3. **Let content lead.** Remove custom bar backgrounds and decorative tints; the app's personality comes from content, layout, and a single accent color.
4. **Every text style scales.** Dynamic Type text styles only; layouts reflow up to AX5 (body 53 pt).
5. **Lay out by size class and safe area, never by device.** iPad windows, iPhone Duo displays, and Split View make "device type" meaningless.
6. **Respect accessibility settings as design inputs.** Reduce Transparency, Increase Contrast, Reduce Motion, Bold Text, and the Liquid Glass transparency preference change how glass and motion look; test them.
7. **Design for App Review from day one.** Login, account deletion, purpose strings, payments, and minimum functionality are design decisions, not submission chores.

## Workflow

- [ ] **Inventory navigation**: tabs (≤ 5 on iPhone), stacks, sheets, search placement, iPad sidebar. Check: tabs navigate only; no hamburger.
- [ ] **Strip custom chrome**: remove custom bar backgrounds, `presentationBackground`, hand-rolled blur, and tint on every control. Check: bars show system glass; a scroll edge effect separates controls from content.
- [ ] **Apply Liquid Glass only where custom controls float over content**, grouped in a `GlassEffectContainer`. Check against the rules below.
- [ ] **Typography**: map every text to a Dynamic Type style; custom fonts scale via `UIFontMetrics` / `relativeTo:`.
- [ ] **Color**: semantic system colors + one accent; verify light, dark, and Increase Contrast.
- [ ] **Icons**: SF Symbols for UI; app icon built in Icon Composer with all appearances.
- [ ] **Accessibility pass**: VoiceOver labels and order, AX5 text, Reduce Transparency/Motion, Increase Contrast, 44 pt targets.
- [ ] **Adaptivity**: iPad regular width (sidebar/split view), window resizing, landscape, iPhone Duo if targeted.
- [ ] **App Review pre-check** with `references/app-review.md`.
- [ ] **Validate** on simulators at extreme sizes (smallest and largest device, AX5) and on a real device for glass, haptics, and performance; fix and repeat.

## Liquid Glass (iOS 26+) and iOS 27 changes

Rules (Apple HIG Materials, Color, Tab bars, Toolbars):
- **Never in the content layer.** Use standard materials (ultra-thin, thin, regular, thick) for content-layer separation. Exception: transient interactive controls like sliders and toggles take on glass while being touched.
- **Use sparingly on custom controls**; system components already have it. Limit to the most important functional elements.
- **Never glass on glass.** Glass cannot sample other glass; group nearby glass elements in one `GlassEffectContainer`.
- **Variants:** `.regular` (default; adapts to any background, use when text is significant); `.clear` only over visually rich media (photos, video), with bold bright foreground and a dimming layer (~35% dark) when the media is bright; `.identity` to turn the effect off conditionally.
- **Tint only for meaning** (the primary action, a status), not decoration. Prefer monochrome bars when content is colorful; don't color bar labels like the content behind them.
- **Controls float; content scrolls under.** Replace opaque bar backgrounds with the system scroll edge effect (automatic by default; `.scrollEdgeEffectStyle(.hard, for: .top)` only where needed, one style per view).
- **Concentric shapes:** nest control corners inside their container and device corners (`ConcentricRectangle`, capsule, or fixed radii).
- **Primary action:** one prominent (`.glassProminent` / `.confirmationAction`) item, on the trailing side.

iOS 27 (shipped 2026-09-14) refinements — adopt through system components, no code needed for most:
- Glass diffuses busy content more for legibility, with a darkened edge and brighter highlights; a uniform top toolbar appears when content scrolls under floating bars; sidebars extend to the window edge with refraction beneath; sidebar icons keep their color.
- Users get a Liquid Glass **transparency control** (iOS 26.1 added Clear/Tinted; iOS 27 turns it into a range). Never assume glass looks "clear"; test both extremes.
- New SwiftUI toolbar APIs (named in Apple's WWDC26 guide): `visibilityPriority` to keep key groups visible as space shrinks, `ToolbarOverflowMenu` to park low-priority items, `topBarPinnedTrailing` to pin an action such as Share, and `toolbarMinimizeBehavior` to collapse the navigation bar on scroll.
- App icons gain multiple glass layers inside the icon, with edge highlights that no longer shift with device motion.
- **Compatibility opt-out ends:** the `UIDesignRequiresCompatibility` Info.plist key is ignored when you build with the iOS 27 SDK. Apple moves the minimum upload SDK forward each spring (Xcode 26 / iOS 26 SDK has been required since 2026-04-28), so expect the iOS 27 SDK — and with it mandatory Liquid Glass — to become required in 2027. Plan full adoption now.

APIs, performance, and fallbacks: `references/liquid-glass.md`.

## Layout

- Respect **safe areas** (Dynamic Island, home indicator, bars) and **layout margins**; read them from the system, never hard-code inset values.
- Decide layout by **size class** (compact/regular width × height). Keep functionality identical across size classes; show more of it in regular width (tab bar → sidebar, overflow → visible).
- Test the smallest (iPhone SE-class, 375×667 pt) and largest layouts first, with the longest localization and AX5 text.
- Cap reading width with the readable content guide; don't stretch paragraphs across an iPad.
- Extend full-screen background content under bars and sidebars (`backgroundExtensionEffect()` for content under a sidebar/inspector).
- Device sizes, margins, iPad and iPhone Duo details: `references/typography-layout.md`.

## Typography

- Use **SF Pro through Dynamic Type text styles** (`.font(.body)`, `.headline`…). The system applies optical sizing and tracking; don't embed SF fonts.
- Default body is **17 pt**; minimum text is **11 pt**.

| Style | Size / leading (pt, default "Large") | Weight |
|---|---|---|
| Large Title | 34 / 41 | Regular |
| Title 1 / 2 / 3 | 28/34 · 22/28 · 20/25 | Regular |
| Headline | 17 / 22 | Semibold |
| Body | 17 / 22 | Regular |
| Callout / Subhead | 16/21 · 15/20 | Regular |
| Footnote | 13 / 18 | Regular |
| Caption 1 / 2 | 12/16 · 11/13 | Regular |

- Layouts must survive **AX5**: Body 53 pt, Large Title 60 pt. Switch `HStack` to `VStack` when `dynamicTypeSize.isAccessibilitySize`; scale spacing with `@ScaledMetric`; don't truncate in scrollable areas.
- Custom brand fonts: display moments only unless the font covers all weights and scripts; scale with `Font.custom(_:size:relativeTo:)` / `UIFontMetrics`, and support Bold Text.
- Full size table (xSmall–AX5): `references/typography-layout.md`.

## SF Symbols, color, and materials

- **SF Symbols** for all interface icons: they match text weight, scale with Dynamic Type, and adapt in bars. Prefer filled variants in tab bars. Use the standard Back and Close symbols without text labels. Symbol animations (e.g. SF Symbols 7 Draw On/Off, Variable Draw) are for meaningful state changes only.
- **Semantic colors** (`label`, `secondaryLabel`, `systemBackground`, `secondarySystemBackground`, `separator`, `tint`): automatic dark mode and Increase Contrast. Never hard-code system color values or convey meaning with color alone.
- **One accent color** (app tint) for interactive elements and the primary action.
- Contrast: text up to 17 pt needs 4.5:1; 18 pt+ or bold text needs 3:1.
- Dark mode follows the system; no in-app appearance switch without a strong reason.

## Navigation and presentation

| Need | Default | Notes |
|---|---|---|
| 2–5 top-level sections | `TabView` tab bar (floats on glass at the bottom) | Navigation only; always visible except under modals; never hide or disable tabs; single-word labels + SF Symbols; badges only for critical info. |
| Search across the app | Search **tab** at the trailing end (`Tab(role: .search)`) | Standard style = landing page with suggestions; button style = jumps straight into the field. |
| Search within a view | `.searchable` — bottom toolbar placement when there's room; top only when bottom content must stay uncovered | Inline field above a list for filtering local content. |
| Hierarchy | `NavigationStack` | Large title collapses on scroll; standard Back symbol; edge-swipe back must work. |
| iPad / regular width | `.tabViewStyle(.sidebarAdaptable)` or `NavigationSplitView` | Sidebar ≤ 2 levels; keep the tab set consistent with iPhone. |
| Focused task | Sheet (`.sheet` + `.presentationDetents`) | Partial detents float inset on glass; one sheet at a time; grabber for resizable sheets; swipe to dismiss with confirm if unsaved. |
| Long/complex task, media, camera | Full-screen cover | Always an obvious exit. |
| Choice among actions | `confirmationDialog` (action sheet; popover on iPad) | Destructive option red; Cancel separate. |
| Critical info needing acknowledgement | Alert | Short title; preferred action bold; ≤ 2–3 buttons. |

Toolbars: symbols over text; ≤ 3 groups; don't put a text button right next to a symbol button (they read as one); titles under 15 characters and never the app name; one prominent action, trailing. In a single-view sheet, Cancel is top-leading and Done top-trailing; never show Cancel, Done, and Back together.

Component details, tab bar minimize/accessory, sheets, search variants: `references/components-navigation.md`.

## App icons

- One **1024×1024 px layered** design authored in **Icon Composer** (`.icon` file, Xcode 26+); the system masks, highlights, and shadows it.
- Provide the **default, dark, clear, and tinted** appearances (light and dark variants of clear and tinted) with the same core features in each.
- Foreground layers with crisp edges, vector (SVG/PDF) where possible; solid or gradient backgrounds from Icon Composer.
- Don't bake in highlights, shadows, bevels, blurs, or glows; don't use photos, UI screenshots, Apple hardware, or unnecessary words; keep content centered.

## Haptics

- Use system semantics: **notification** (success/warning/error), **impact** (light/medium/heavy/soft/rigid for collisions and snaps), **selection** (value ticks in pickers).
- SwiftUI: `.sensoryFeedback(.success, trigger: value)` (also `.selection`, `.impact(...)`, `.increase`/`.decrease`). UIKit: `UINotificationFeedbackGenerator`, `UIImpactFeedbackGenerator`, `UISelectionFeedbackGenerator`. Core Haptics only for custom patterns (games, instruments).
- Standard controls (toggles, pickers, pull-to-refresh) already play haptics; don't double them. Never haptic on scroll or every tap.

## Accessibility

- **VoiceOver:** meaningful labels, values, and traits; combine row content (`.accessibilityElement(children: .combine)`); custom actions for swipe actions; hide decoration; logical reading order; announce state changes.
- **Dynamic Type to AX5**, Bold Text, and Voice Control input labels (`.accessibilityInputLabels`).
- **Reduce Motion** → replace slides/zooms/parallax with fades (`@Environment(\.accessibilityReduceMotion)`); **Reduce Transparency** and **Increase Contrast** (`colorSchemeContrast`) are handled for system glass — don't override them with custom opacity. If a custom glass control must adapt, switch to `.identity` under Reduce Transparency.
- Targets **44×44 pt** by default (28 pt absolute minimum for dense secondary controls); ~12 pt padding around bezeled controls.
- Every gesture has a visible alternative; no time-limited UI; Full Keyboard Access and Switch Control reach every control.

## iPad, multitasking, and iPhone Duo

- iPad: resizable windows are normal — design every screen to work from compact to full width; support pointer hover, keyboard shortcuts (menu commands), context menus, and drag and drop.
- **iPhone Duo** (HIG page added 2026-09-09): two displays; on the outer display (and the inner one in landscape) tab bars and toolbars move to a **vertical side position** automatically. Use size classes and safe areas, keep functionality identical across displays, prefer even grid column counts at the fold, use `ReservedRegion` for content that must avoid the fold or cameras, assign `ToolbarItemVisibilityPriority`, and don't override default bar placement. Hardware specs beyond the HIG page are not covered here.

## Gotchas

- **Custom opaque bar backgrounds** (or `.toolbarBackground` colors, `presentationBackground`) hide the system glass — the #1 "didn't adopt iOS 26" tell. Remove them.
- **Glass on content:** glass cards, glass list rows, glass over glass, `.clear` glass on a plain background. Content uses standard materials or plain surfaces.
- **Tinting every glass control** or coloring tab labels like the content. One prominent tinted action per toolbar.
- **Relying on `UIDesignRequiresCompatibility`** to postpone Liquid Glass: ignored once you build with the iOS 27 SDK.
- **Text + symbol toolbar buttons side by side**, or a "Back" text label; use standard symbols and separate text-labeled buttons.
- **Tab bar as an action bar** (a "+" tab), hidden/disabled tabs, or more than 5 tabs producing a More tab.
- **Fixed font sizes** (`.system(size:)` everywhere) and layouts that truncate at AX sizes.
- **Hand-rolled blur** (`UIBlurEffect` stacks) imitating glass: it won't adapt to accessibility settings or the transparency control.
- **iOS pre-permission screens with "Not now"**: Apple allows one "Continue"/"Next" button only (see `mobile-design`).
- **Continuous glass animations** and many separate glass views without a container: GPU and battery cost; let glass rest.
- **FAB, Material snackbars, or Android dialogs** in the iOS build of a cross-platform app.
- **Sheets for navigation or sheet-on-sheet**; missing Cancel paired with Done.
- **Launch screen with a logo or text**: the HIG wants a launch screen that looks like the first screen.

## Output format

For a design or implementation plan:

```
iOS target: <min iOS>, devices <iPhone / iPad / iPhone Duo>, framework <SwiftUI/UIKit/RN/...>
Navigation: <tabs, search placement, stacks, sheets/detents, iPad sidebar>
Liquid Glass: <system components used; custom glass elements + container; tint policy>
Type & color: <text style mapping; accent color; custom fonts and scaling>
Icons: <SF Symbols used; app icon appearances status>
Accessibility: <VoiceOver, AX5 behavior, Reduce Motion/Transparency, contrast>
App Review risks: <items from app-review.md and their mitigations>
Verified / Not checked
```

For a review: findings P0–P3, each with Observed / Inferred / Not checked and the HIG page or guideline number.

## References

| File | Read when |
|---|---|
| `references/liquid-glass.md` | building or reviewing custom glass controls, morphing, toolbar/tab glass behavior, performance, or pre-iOS 26 fallbacks |
| `references/typography-layout.md` | you need the full Dynamic Type table, device point sizes, margins, size-class combinations, or iPhone Duo layout details |
| `references/components-navigation.md` | designing tab bars, toolbars, search, sheets, alerts, menus, lists, or sidebars in detail |
| `references/swiftui-notes.md` | writing SwiftUI code: state, navigation, sheets, accessibility modifiers, haptics, iOS 27 API changes, UIKit/RN/Flutter equivalents |
| `references/app-review.md` | preparing a submission, handling a rejection, or designing login, payments, subscriptions, account deletion, or permission strings |

## Related skills

- `mobile-design` — permissions, onboarding, forms, offline states, and iOS vs Android differences.
- `android-design` — the Android counterpart when shipping both platforms.
- `mobile-architecture` — SwiftUI app architecture, offline sync, deep links, push, performance, and releases.
- `accessibility` — full VoiceOver testing procedure and WCAG mapping.
- `motion-design` — springs, choreography, and Reduce Motion strategy.
