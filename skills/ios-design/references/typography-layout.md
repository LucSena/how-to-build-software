# iOS Typography and Layout Reference

Values from Apple's Human Interface Guidelines (Typography, Layout, Accessibility, Designing for iPhone Duo), as of 2026-09. Where a value is typical rather than specified, it is marked "typical — read from the system".

## Contents
- Dynamic Type sizes (all categories)
- Text rules
- Minimum sizes and contrast
- Size classes
- Device logical sizes
- Margins, safe areas, readable width
- iPad windows and multitasking
- iPhone Duo
- Widgets and Live Activities quick numbers
- Sources

## Dynamic Type sizes (pt), iOS / iPadOS

Default category is **Large**. Weights: Large Title, Titles, Body, Callout, Subhead, Footnote, Captions are Regular; Headline is Semibold. Emphasized variants: Titles 1–2 and Large Title go Bold, the rest Semibold.

| Style | xS | S | M | **L (default)** | xL | xxL | xxxL | AX1 | AX2 | AX3 | AX4 | AX5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Large Title | 31 | 32 | 33 | **34** | 36 | 38 | 40 | 44 | 48 | 52 | 56 | 60 |
| Title 1 | 25 | 26 | 27 | **28** | 30 | 32 | 34 | 38 | 43 | 48 | 53 | 58 |
| Title 2 | 19 | 20 | 21 | **22** | 24 | 26 | 28 | 34 | 39 | 44 | 50 | 56 |
| Title 3 | 17 | 18 | 19 | **20** | 22 | 24 | 26 | 31 | 37 | 43 | 49 | 55 |
| Headline | 14 | 15 | 16 | **17** | 19 | 21 | 23 | 28 | 33 | 40 | 47 | 53 |
| Body | 14 | 15 | 16 | **17** | 19 | 21 | 23 | 28 | 33 | 40 | 47 | 53 |
| Callout | 13 | 14 | 15 | **16** | 18 | 20 | 22 | 26 | 32 | 38 | 44 | 51 |
| Subhead | 12 | 13 | 14 | **15** | 17 | 19 | 21 | 25 | 30 | 36 | 42 | 49 |
| Footnote | 12 | 12 | 12 | **13** | 15 | 17 | 19 | 23 | 27 | 33 | 38 | 44 |
| Caption 1 | 11 | 11 | 11 | **12** | 14 | 16 | 18 | 22 | 26 | 32 | 37 | 43 |
| Caption 2 | 11 | 11 | 11 | **11** | 13 | 15 | 17 | 20 | 24 | 29 | 34 | 40 |

Default leading (Large): Large Title 41, Title 1 34, Title 2 28, Title 3 25, Headline/Body 22, Callout 21, Subhead 20, Footnote 18, Caption 1 16, Caption 2 13.

Design implication: at AX5, Body is ~3.1× default. Horizontal rows (icon + title + value + chevron) must stack vertically; multi-column text reduces columns; primary elements stay near the top.

## Text rules

- Use text styles, not point sizes: `.font(.body)`, `.font(.title2.weight(.semibold))`; UIKit `UIFont.preferredFont(forTextStyle:)` with `adjustsFontForContentSizeCategory = true`.
- Don't embed SF fonts; use `Font.Design.default`, `.rounded`, `.serif` (New York), `.monospaced` (SF Mono).
- SF uses dynamic optical sizes and size-specific tracking automatically; only mockups need manual tracking.
- Custom fonts: `Font.custom("Brand", size: 17, relativeTo: .body)` or `UIFontMetrics(forTextStyle:).scaledFont(for:)`; also honor Bold Text (`legibilityWeight == .bold`).
- Scale non-text dimensions with `@ScaledMetric` (icon sizes, row padding).
- Avoid truncation in scrolling content; set `lineLimit(nil)` / `numberOfLines = 0`, and offer a detail view when text must truncate.
- For three or more lines, avoid tight leading even in constrained rows.

## Minimum sizes and contrast

| Item | iOS / iPadOS value |
|---|---|
| Default body text | 17 pt |
| Minimum text | 11 pt |
| Default control / hit target | 44×44 pt |
| Absolute minimum control | 28×28 pt |
| Padding around bezeled controls | ~12 pt |
| Padding around bezel-less controls | ~24 pt |
| Contrast, text ≤ 17 pt | ≥ 4.5:1 |
| Contrast, text ≥ 18 pt or bold | ≥ 3:1 |
| Text enlargement support | ≥ 200% (Dynamic Type covers far more) |

## Size classes

| Context | Width | Height |
|---|---|---|
| iPhone portrait | Compact | Regular |
| iPhone landscape (most models) | Compact | Compact |
| Large iPhones landscape (Plus/Max class) | Regular | Compact |
| iPad full screen, either orientation | Regular | Regular |
| iPad narrow window / Slide Over / narrow split | Compact | Regular |
| iPhone Duo outer display | Compact | — |
| iPhone Duo inner display | Regular | — |

Rules: never branch on device idiom or orientation for layout; consider every combination; keep functionality identical and reveal more of it in regular width (tab bar → sidebar, overflow items → visible toolbar items).

## Device logical sizes (points)

| Device | Portrait size |
|---|---|
| iPhone 17 Pro Max / 16 Pro Max | 440×956 |
| iPhone Air | 420×912 |
| iPhone 17 / 17 Pro / 16 Pro | 402×874 |
| iPhone 16 | 393×852 |
| iPhone 16e | 390×844 |
| iPhone SE (2nd/3rd gen), smallest still common | 375×667 |
| iPad mini | 744×1133 |
| iPad Pro 13" | 1032×1376 |

Test the smallest (375 pt wide) and the largest, then a resized iPad window. Don't encode these numbers in layout logic.

## Margins, safe areas, readable width

- Use system layout margins (typical — read from the system: 16 pt at compact width, 20 pt at regular width); in SwiftUI default `padding()` and list insets follow the system.
- Safe-area insets differ per device (Dynamic Island vs notch vs Home button; ~34 pt bottom home-indicator inset on Face ID iPhones is typical). Always read them: `safeAreaInset(edge:)`, `.ignoresSafeArea()` only for backgrounds.
- Cap text measure with the readable content guide (`readableContentGuide`) or a max width around 600–700 pt for body text on iPad.
- Extend full-bleed backgrounds under bars, sidebars, and inspectors (`backgroundExtensionEffect()`), but keep interactive content inside the safe area.
- Avoid putting controls at the very bottom of iPad windows in free-form windowing, where the window edge may sit off-screen.

## iPad windows and multitasking

- Any screen may appear at any width from compact to full; resizing is continuous in iPadOS 26+ windowing.
- `.tabViewStyle(.sidebarAdaptable)` lets people switch the tab bar into a sidebar; use `NavigationSplitView` when you want a sidebar without that option. Sidebars show at most two levels of hierarchy.
- Support pointer (hover effects), keyboard shortcuts and menu-bar commands, context menus, drag and drop, and multiple windows/scenes where documents or conversations benefit.
- State restoration per scene (`@SceneStorage`) so resizing and relaunch keep place.

## iPhone Duo (HIG page added 2026-09-09)

- Two displays: a wide, short **outer** display (compact width) and a larger **inner** display (regular width); partial folding creates a fold region.
- On the outer display — and on the inner display in landscape — **tab bars, toolbars, the status bar, and the Dynamic Island sit on the side (vertical axis)**. Standard components do this automatically; don't override default bar placement.
- **Reserved regions:** outer camera (always), inner camera (only while active), and fold region (partially folded). Use `ReservedRegion` to keep key elements clear when the system doesn't move them.
- Toolbar order on the vertical axis: navigation (Back/Close) at the top, then prominent actions (Done). Items overflow bottom-to-top by default; set `ToolbarItemVisibilityPriority` (SwiftUI) / `UIBarButtonItemVisibilityPriority` (UIKit). Use the system overflow menu (`ToolbarOverflowMenu`) instead of your own ellipsis menu.
- Give every toolbar item both a title and a symbol (titles appear in overflow). Prefer symbols; text buttons stay horizontal.
- Grids: prefer an even number of columns so content splits cleanly at the fold. Avoid dramatic re-layouts while folding.
- Arrangement views (split / overlay) lay out content; keep navigation containers outside them.

## Widgets and Live Activities quick numbers

| Item | Value |
|---|---|
| Widget content margin (most widgets) | 16 pt |
| iPhone widget sizes | from small ~158×158 pt up to large ~338×354 pt, device-dependent |
| Live Activity max duration | 8 hours; update only on content change; end when the task ends |
| Live Activity Lock Screen margin | 14 pt |
| Dynamic Island corner radius | 44 pt |

## Sources

- Apple HIG Typography (Dynamic Type specifications): https://developer.apple.com/design/human-interface-guidelines/typography
- Apple HIG Layout (updated 2026-09-09): https://developer.apple.com/design/human-interface-guidelines/layout
- Apple HIG Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple HIG Designing for iPhone Duo (new 2026-09-09): https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo
- Apple HIG Sidebars, Widgets, Live Activities: https://developer.apple.com/design/human-interface-guidelines/sidebars , https://developer.apple.com/design/human-interface-guidelines/widgets , https://developer.apple.com/design/human-interface-guidelines/live-activities
- Device point sizes: HIG layout specifications as captured in https://github.com/y-128/Apple-HIG-Design (commit 2026-09-17)
