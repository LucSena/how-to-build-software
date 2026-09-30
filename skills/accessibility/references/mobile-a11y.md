# Mobile Accessibility

Native and cross-platform accessibility essentials. Platform-specific design depth lives in `ios-design` and `android-design`; this file covers what every mobile screen must do for assistive technology and user settings.

## Contents
- Principles
- Labels, roles, states
- Grouping and reading order
- Actions instead of gestures
- Text scaling
- Targets
- System settings to honor
- Announcements and focus
- Cross-platform frameworks
- Test checklist

## Principles

1. **System components first.** UIKit/SwiftUI and Material/Compose controls ship with correct traits, focus behavior, and scaling. Custom controls must re-create all of it.
2. **Every meaningful element is one sensible stop** for VoiceOver/TalkBack, with a short label, the right role, and its current state.
3. **Nothing depends on a gesture alone.** Swipe actions, long-press menus, and drag have visible or rotor/menu equivalents.
4. **Layouts grow with the user's text size**, up to the largest accessibility sizes.

## Labels, roles, states

| Concept | SwiftUI / UIKit | Jetpack Compose |
|---|---|---|
| Label | `.accessibilityLabel("Delete draft")` / `accessibilityLabel` | `contentDescription` on `Icon`/`Image`; `Modifier.semantics { contentDescription = … }` |
| Role / trait | `.accessibilityAddTraits(.isButton)` / `accessibilityTraits` | `Modifier.semantics { role = Role.Button }`, or `Modifier.clickable(role = Role.Button)` |
| Value / state | `.accessibilityValue("3 of 5")` | `stateDescription`, `toggleableState`, `selected` |
| Hint (optional) | `.accessibilityHint("Double-tap to edit")` | `onClick(label = "edit")` custom action label |
| Hide decoration | `.accessibilityHidden(true)` | `contentDescription = null` for decorative images; `Modifier.clearAndSetSemantics {}` |

Label rules:
- Describe purpose, not appearance ("Search", not "Magnifying glass").
- Do not include the role in the label ("Play", not "Play button"); the role is announced separately.
- Keep the visible text in the label so Voice Control users can say what they see.
- Localize labels like any other string.

## Grouping and reading order

- Combine a card's parts (title, subtitle, price) into one element so users do not swipe through five fragments: SwiftUI `.accessibilityElement(children: .combine)`; Compose `Modifier.semantics(mergeDescendants = true)`.
- Keep interactive children separately focusable, or expose them as custom actions on the combined element.
- Reading order follows layout; fix it structurally first. When it cannot, SwiftUI `.accessibilitySortPriority`, Compose `isTraversalGroup` + `traversalIndex`.
- Mark section titles as headings (SwiftUI `.accessibilityAddTraits(.isHeader)`; Compose `Modifier.semantics { heading() }`) so rotor/heading navigation works.

## Actions instead of gestures

- Swipe-to-delete, swipe-to-archive, long-press menus: also expose as accessibility custom actions (SwiftUI `.accessibilityAction(named:)`; Compose `customActions`) and as visible UI somewhere (an Edit mode, an overflow menu).
- Drag to reorder: add "Move up/Move down" actions (WCAG 2.5.7).
- Custom sliders and steppers: support increment/decrement (SwiftUI `.accessibilityAdjustableAction`; Compose `setProgress`/`progressBarRangeInfo` semantics).
- Never require multi-finger or path gestures without an alternative.

## Text scaling

- iOS: use Dynamic Type text styles (`.body`, `.headline`, `UIFont.preferredFont(forTextStyle:)`); custom fonts through `UIFontMetrics` / `.font(.custom(_:size:relativeTo:))`. Test up to the accessibility sizes (AX1–AX5).
- Android: `sp` for text, never `dp`; test font scale 1.3 and 2.0 (Android 14+ uses non-linear scaling for large text).
- Layout must adapt: stack horizontal rows vertically at large sizes (SwiftUI `ViewThatFits` or checking `dynamicTypeSize.isAccessibilitySize`), allow multi-line labels, avoid fixed heights, scroll rather than clip.
- Never cap or disable text scaling to "protect the design".

## Targets

- iOS: at least 44×44 pt hit area.
- Android: at least 48×48 dp with ≥ 8 dp between targets (Compose enforces minimum interactive size on Material components).
- Enlarge the hit area, not the icon (`contentShape`, padding, `Modifier.minimumInteractiveComponentSize()`).
- Keep destructive targets away from frequent ones.

## System settings to honor

| Setting | iOS | Android | Expected behavior |
|---|---|---|---|
| Reduce motion / Remove animations | Reduce Motion (`accessibilityReduceMotion`) | Remove animations (animator duration scale 0) | Replace slides/parallax/zoom with crossfades or instant changes |
| Reduce transparency | Reduce Transparency | — | Solid surfaces instead of materials/blur |
| Increase contrast | Increase Contrast (`colorSchemeContrast`) | High-contrast text; Material contrast levels | Stronger text and borders; use system/semantic colors |
| Bold text | Bold Text (`legibilityWeight`) | Bold text | System fonts adapt; custom fonts should too |
| Dark mode | Appearance | Dark theme | Designed dark palette, contrast re-checked |
| Differentiate without color | Differentiate Without Color | — | Add shapes/icons to color-coded status |

## Announcements and focus

- Announce async results: iOS `AccessibilityNotification.Announcement("Saved").post()` (SwiftUI) or `UIAccessibility.post(notification: .announcement, argument:)`; Android live regions (`Modifier.semantics { liveRegion = LiveRegionMode.Polite }`).
- After a screen change or modal presentation, move accessibility focus to the new content's title (iOS `.accessibilityFocused` / `.screenChanged` notification; Android: focus request on the new pane's heading, `paneTitle` semantics for panes).
- Do not steal focus for non-critical updates.

## Cross-platform frameworks

- **React Native**: `accessibilityLabel`/`aria-label`, `accessibilityRole`/`role`, `accessibilityState`, `accessible` to group, `accessibilityActions` + `onAccessibilityAction` for custom actions, `AccessibilityInfo.announceForAccessibility`, `AccessibilityInfo.isReduceMotionEnabled`. `Pressable` needs `hitSlop` for small icons.
- **Flutter**: `Semantics(label:, button: true, …)`, `MergeSemantics`, `ExcludeSemantics`, `SemanticsService.announce`, `MediaQuery.textScalerOf(context)` for scaling, `MediaQuery.disableAnimationsOf(context)` for reduced motion.
- **Web in a WebView / PWA**: all web rules apply; also never disable pinch zoom.

## Test checklist

- [ ] VoiceOver and TalkBack swipe through each screen: every stop has a sensible label, role, state; no unlabeled buttons; decorative images silent.
- [ ] Headings navigable via rotor/reading controls.
- [ ] Every gesture-only action reachable via custom actions or visible UI.
- [ ] Largest text size: nothing critical truncated or overlapping; screens scroll.
- [ ] Reduce Motion / Remove animations: no large movement.
- [ ] Contrast checked in light and dark, including Increase Contrast.
- [ ] Targets meet 44 pt / 48 dp.
- [ ] Automated: Xcode Accessibility Inspector audit; Android Accessibility Scanner; Espresso `AccessibilityChecks` or Compose semantics tests in CI.

## Sources

- Apple HIG, Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple Developer, SwiftUI accessibility modifiers: https://developer.apple.com/documentation/swiftui/view-accessibility
- Android Developers, Compose accessibility and semantics: https://developer.android.com/develop/ui/compose/accessibility
- Material Design 3, accessibility and touch targets: https://m3.material.io/foundations/designing/structure
- React Native accessibility: https://reactnative.dev/docs/accessibility
- Flutter accessibility: https://docs.flutter.dev/ui/accessibility-and-internationalization/accessibility
- Emil Kowalski `apple-design` (reduce motion/transparency/contrast signals): https://github.com/emilkowalski/skills
