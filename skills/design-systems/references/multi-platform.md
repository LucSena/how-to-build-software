# Multi-platform token pipeline

One token source, generated outputs for web, iOS, Android (and Flutter or React Native if used). The goal: a change to `color.accent` ships everywhere from one pull request, and each platform still feels native.

## 1. Pipeline shape

```
tokens/*.tokens.json  (DTCG 2025.10, source of truth)
tokens.resolver.json  (modes: theme, contrast, brand, density)
        │
        ▼  build tool that reads DTCG (Style Dictionary v4+, Terrazzo, or a small custom script)
        │   transforms: resolve aliases → per-mode sets → unit + color conversion → naming per platform
        ▼
web/      tokens.css (:root + [data-theme]) · theme.css (@theme inline) · tokens.ts (typed names)
ios/      Tokens.swift (Color/Font/CGFloat extensions) or an asset catalog with Any/Dark appearances
android/  Tokens.kt (Compose ColorScheme, Dp, TextUnit) or res/values + values-night XML
flutter/  tokens.dart (ThemeData / ThemeExtension)
docs/     DESIGN.md front matter (generated or diff-checked), token reference page
```

Build-tool format names vary between versions (for example Style Dictionary's CSS variables, Swift, Compose, and Android resource formats). Check your version's documentation, and pin the version in the lockfile.

## 2. Transform rules

| Concern | Web | iOS | Android |
|---|---|---|---|
| Naming | `--color-bg-surface` | `Color.bgSurface` / `Tokens.Color.bgSurface` | `BgSurface` / `R.color.bg_surface` |
| Length units | `rem` for type, `px` or `rem` for space | `pt` (1px at 1× = 1pt) | `dp` for size and space, `sp` for text |
| Color | `oklch()` + hex fallback | sRGB or Display P3 components; dynamic light/dark via asset catalog or a trait-based color | ARGB hex; light/dark via `values-night` or Compose `lightColorScheme`/`darkColorScheme` |
| Typography | Font stacks + scale | Map to Dynamic Type text styles (Body, Headline…) with the brand face via `relativeTo:` scaling | Map to Material type roles (bodyLarge, titleMedium…) in `sp` |
| Motion | `cubic-bezier()` + ms | Map durations; prefer system springs for sheets and navigation | Map to Material motion tokens where they exist |
| Radius | `px` | `pt`, continuous corners are the system default | `dp`, via the Material shape scale |
| Shadows | Layered `box-shadow` | Rarely 1:1; use system materials or a simple shadow | Tonal elevation in M3; shadow only where Material uses it |

Rules:
- **Keep names platform-agnostic at the source.** Transforms produce each platform's naming style.
- **Convert colors deterministically** from OKLCH to sRGB (or P3 on Apple platforms) at build time, with gamut mapping, and commit the generated hex values for review.
- **Don't copy web type sizes to native.** Native type must scale with the user's text-size setting. Map roles, and let the platform scale.
- **Use platform semantics where they are stronger.** On iOS, map `fg`/`bg` to system semantic colors when the brand allows it, so that Increase Contrast and dark mode behave natively. On Android 12+, decide whether dynamic color overrides the brand palette (and keep a static fallback scheme).
- **Every mode resolves on every platform.** If dark or high-contrast exists on the web, native gets it too, or the omission is documented.

## 3. Example outputs (sketch)

```css
/* web/tokens.css (generated) */
:root { --color-accent: oklch(0.62 0.17 40); --radius-control: 6px; }
[data-theme="dark"] { --color-accent: oklch(0.72 0.13 40); }
```

```swift
// ios/Tokens.swift (generated)
import SwiftUI
extension Color {
    static let accent = Color("Accent")   // asset catalog: Any + Dark appearances
}
enum Radius { static let control: CGFloat = 6 }
```

```kotlin
// android/Tokens.kt (generated)
val LightColors = lightColorScheme(primary = Color(0xFFDC6A31), onPrimary = Color(0xFFFFFFFF))
val DarkColors  = darkColorScheme(primary = Color(0xFFF08A55), onPrimary = Color(0xFF1A1310))
object Radius { val control = 6.dp }
```

The hex values above are illustrative. Generate the real ones from the source.

## 4. CI

- On every change to `tokens/`: build all platforms, fail on unresolved aliases or on modes with mismatched names, and run the contrast checks for the declared text/surface pairs.
- Publish versioned packages (npm for web, a Swift package, a Maven or Gradle artifact) or commit the generated files. Pick one approach and document it.
- Visual regression on the web component catalog. Snapshot tests on native (SwiftUI previews or Compose screenshot tests) for key components in light and dark.
- A drift check: fail if components contain raw color or size literals (lint rule or grep).

## 5. When not to build a pipeline

A single web app with one theme does not need a build step. A CSS file of variables plus DESIGN.md is enough. Add the DTCG source and the pipeline when a second platform, a second brand, or a design-tool sync appears.

## Sources

- DTCG 2025.10 Format and Resolver: https://www.designtokens.org/tr/2025.10/format/ ; https://github.com/design-tokens/community-group
- Style Dictionary: https://styledictionary.com ; Terrazzo: https://terrazzo.app
- Apple HIG Color and Typography (semantic colors, Dynamic Type): https://developer.apple.com/design/human-interface-guidelines/color ; https://developer.apple.com/design/human-interface-guidelines/typography
- Material 3 color roles, type scale, and dynamic color: https://m3.material.io/styles/color/roles ; https://m3.material.io/styles/typography/type-scale-tokens
