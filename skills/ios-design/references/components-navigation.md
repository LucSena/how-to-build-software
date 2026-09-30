# iOS Components and Navigation

Component-level rules from the Apple HIG (June 2026 revision and later updates), as of 2026-09. Use with the SwiftUI names in `swiftui-notes.md`.

## Contents
- Tab bars
- Search
- Toolbars and navigation bars
- Navigation stacks and split views
- Sheets and other modals
- Alerts, action sheets, menus
- Lists, forms, and controls
- Notifications, widgets, Live Activities
- Sources

## Tab bars

- **Purpose:** switch between top-level sections while each keeps its own navigation state. Navigation only — actions go in a toolbar.
- **Visibility:** visible in every section; only a modal may cover it. It floats on Liquid Glass at the bottom of iPhone; on iPad it sits near the top and can convert to a sidebar (`sidebarAdaptable`).
- **Count:** as few as the hierarchy needs; on iPhone keep to about 5 so nothing overflows into a "More" tab. If users customize tabs (iPad), start with 5 or fewer defaults.
- **Stability:** never hide or disable tabs; an empty section explains why it is empty.
- **Labels and icons:** single-word labels, SF Symbols (filled variants), monochrome when content is colorful. Badges (red, count or "!") only for critical new information.
- **Minimize on scroll:** `tabBarMinimizeBehavior(.onScrollDown)` shrinks the bar while reading; tapping a tab or scrolling to top restores it.
- **Bottom accessory:** `tabViewBottomAccessory` for persistent, app-wide status such as a mini-player; it moves inline when the bar minimizes (`tabViewBottomAccessoryPlacement` is `.expanded` or `.inline`). Don't put navigation or ads there.
- **Search tab:** a tab with the search role sits at the trailing end.
- **Behaviors people expect:** tapping the active tab pops to the root, then scrolls to top.

## Search

| Placement | Use when | Example apps |
|---|---|---|
| Search tab, **standard** style | Search is for discovery; show a landing page with suggestions and categories | TV, Music |
| Search tab, **button** appearance | Quick lookup; focus the field and show the keyboard immediately, return to the previous tab on exit | Utility apps |
| Bottom toolbar field | Search is a priority and there's room at the bottom (alone or with a few controls) | Settings, Mail, Notes |
| Top toolbar field | Bottom content must stay uncovered or there's no bottom toolbar | Wallet |
| Inline field above a list | Filtering the content of one view; pin to the top toolbar on scroll | Library filters |
| Trailing side of toolbar (iPad/split view) | Searching across columns while keeping selection visible | Mail, Notes |

Search behavior: start searching as people type; show recents/suggestions before typing; most relevant results first; scope bars for clearly defined categories (default to the broadest scope); tokens for common filters.

## Toolbars and navigation bars

- **Title:** a useful title under ~15 characters; never the app name. Large titles collapse into an inline title on scroll (`.navigationBarTitleDisplayMode(.large)` on top-level screens, `.inline` on detail screens).
- **Items:** prefer SF Symbols without borders; text only for actions symbols can't express (Edit). Use the standard Back and Close symbols with no "Back"/"Close" text.
- **Groups:** group by function and frequency; aim for no more than three groups. Keep navigation and critical actions (Done, Close, Save) in distinct familiar positions.
- **Text vs symbols:** never place a text-labeled button directly next to a symbol button; add fixed space.
- **Primary action:** exactly one, styled prominent, on the trailing side (`.confirmationAction`).
- **Overflow:** decide which items move into overflow as width shrinks; use the system overflow/More menu rather than a custom ellipsis menu. iOS 27: `visibilityPriority`, `ToolbarOverflowMenu`, `topBarPinnedTrailing`.
- **Backgrounds:** avoid custom toolbar backgrounds and tinted controls; use the content and a scroll edge effect instead.
- **Bottom toolbar vs top:** frequent actions on iPhone belong in a bottom toolbar when there is no tab bar conflict; a toolbar and a tab bar can coexist on iPad at the top.

## Navigation stacks and split views

- `NavigationStack` for hierarchy on iPhone. The leading-edge swipe back must work on every pushed screen; never replace the back button with a custom one that breaks it.
- Typed navigation paths (`NavigationPath` / `[Route]`) make deep links and state restoration possible.
- `NavigationSplitView` for two- or three-column layouts on iPad and in regular width; it collapses to a stack in compact width automatically.
- Sidebars: at most two levels of hierarchy; let people hide the sidebar; extend content under it with `backgroundExtensionEffect()`; in iOS 27 sidebar icons keep their color.
- Keep the same destinations across size classes: an iPhone tab = an iPad sidebar item.

## Sheets and other modals

- **When:** a focused, self-contained task or a short piece of supplementary content; not for navigating the app.
- **One at a time.** If a sheet leads to another, dismiss the first before presenting the second.
- **Detents:** `.medium` (about half) and `.large`; custom heights allowed. Partial detents float inset on glass with rounded bottom corners; `.large` becomes opaque and edge-attached. Include the medium detent when progressive disclosure helps (share sheet); use large only for compose/editing (Mail, Messages).
- **Grabber** on resizable sheets (also lets VoiceOver users resize).
- **Dismiss:** swipe down; if there are unsaved changes, confirm with an action sheet.
- **Buttons:** single-view sheet → Cancel top-leading, Done top-trailing. Always pair Done with Cancel (or Back in multi-step flows). Never show Cancel, Done, and Back together.
- **Nonmodal sheets** (iOS/iPadOS) for tools that affect the parent while it stays interactive (e.g. text formatting).
- **Full-screen cover** for long or immersive tasks (camera, photo editing, multistep flows), always with an obvious exit.
- **iPad:** prefer page or form sheet styles; popovers for small contextual choices.
- **Zoom transition:** a sheet or pushed view can grow out of its source control (`matchedTransitionSource` + `.navigationTransition(.zoom(...))`).

## Alerts, action sheets, menus

- **Alert:** only for critical information needing acknowledgement or a consequential decision. Short title, optional message, 1–3 buttons; the preferred action is bold; destructive actions are red; Cancel is never the destructive one. Don't use alerts for errors that can be shown inline or for notifications.
- **Action sheet / `confirmationDialog`:** choices related to an action the person initiated (e.g. "Delete Photo" confirmation, "Save / Discard"); presented as a popover from the source on iPad.
- **Menus:** pull-down menus from toolbar buttons for related actions; context menus on long-press with a preview for items. Every context-menu action is also reachable another way.
- **Destructive actions:** prefer undo over confirmation when the action is reversible.

## Lists, forms, and controls

- Settings-like content: inset-grouped `Form`/`List` with section headers and footers for explanation.
- Swipe actions: trailing for destructive (full swipe = primary destructive action), leading for status (read/unread, pin). Always also reachable via context menu or edit mode.
- Disclosure chevrons signal navigation; don't use them on rows that toggle or open sheets.
- Controls: `Toggle` for on/off (never a checkbox look), segmented `Picker` for 2–5 exclusive views/filters, `DatePicker` compact/inline/wheel styles, `Stepper` for small increments, `Slider` for continuous values.
- Empty states: explain and offer the next action; don't disable tabs.

## Notifications, widgets, Live Activities

- **Notifications:** concise, specific, no sensitive data, no duplicates for the same event, no "open the app" instructions; generic placeholder text for hidden previews; actions that complete tasks without opening the app; badges only for unread counts.
- **Interruption levels:** Passive, Active (default), Time Sensitive (breaks through Focus — only for events that need attention now), Critical (entitlement; health/safety).
- **Widgets:** glanceable, updated content with a 16 pt margin for most sizes; deep-link taps to the relevant screen; support tinted and clear appearances; interactive widgets use App Intents buttons/toggles.
- **Live Activities:** for tasks with a clear start and end, up to 8 hours; update only on real changes; end promptly; the minimal Dynamic Island presentation must remain recognizable.
- **App Intents / App Shortcuts** expose key actions to Siri, Spotlight, the Action button, Shortcuts, widgets, and Controls; iOS 27 adds entity/intent schemas and View Annotations for Siri.

## Sources

- Apple HIG — Tab bars (2026-06-08), Search fields (2026-06-08), Toolbars, Sidebars, Sheets (2026-03-24), Scroll views, Alerts, Action sheets, Menus, Lists and tables, Notifications, Widgets, Live Activities: https://developer.apple.com/design/human-interface-guidelines
- Apple developer documentation — `TabView`, `Tab`, `TabViewBottomAccessoryPlacement`, `NavigationStack`, `NavigationSplitView`, `presentationDetents(_:)`, `confirmationDialog`: https://developer.apple.com/documentation/swiftui
- What's new in iOS 27 / WWDC26 SwiftUI guide: https://developer.apple.com/ios/whats-new/ , https://developer.apple.com/wwdc26/guides/swiftui/
