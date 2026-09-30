# App shell and navigation

The persistent frame of a product: sidebar, header, search and command palette, account menu, notifications, and how they adapt from phone to wide desktop. The shell is used thousands of times a day, so it favors stability, speed, and keyboard access over decoration.

## Contents
- Anatomy
- Choosing the navigation model
- Sidebar
- Workspace switcher and environment
- Header and page header
- Breadcrumbs
- Command palette (⌘K) and search
- Account menu, help, and what's new
- Notifications entry
- Settings entry
- Responsive shell
- Density and keyboard
- Accessibility
- Reference implementations (as of 2026-09)
- Checklist

---

## Anatomy

```
┌───────────────┬────────────────────────────────────────────────────────────────┐
│ [Acme ▾]      │ ☰  Projects › Website relaunch › Settings    ⌘K Search  🔔  (?) │ ← global header
│ workspace sw. │────────────────────────────────────────────────────────────────│
│ ⌘K  Search    │  Page title                               [Secondary] [Primary] │ ← page header
│ ⌂  Home       │  Tabs: Overview | Activity | Settings                          │
│ ✓  My issues 3│                                                                │
│───────────────│  content: fluid for tables and dashboards,                     │
│ WORKSPACE     │  max width ~640–720 px for forms, ~65ch for prose               │
│ ▣ Projects    │                                                                │
│ ◷ Cycles      │                                          ┌ inspector 320–400 ┐ │
│ ▤ Insights    │                                          │ (optional, right) │ │
│───────────────│                                          └───────────────────┘ │
│ FAVORITES     │                                                                │
│ ★ Q3 roadmap  │                                                                │
│───────────────│                                                                │
│ + Invite      │                                                                │
│ ⚙ Settings    │                                                                │
│ (SM) Sam ▾    │ ← account menu                                                 │
└───────────────┴────────────────────────────────────────────────────────────────┘
```

## Choosing the navigation model

| Situation | Default | Why |
|---|---|---|
| 5+ top-level areas, or an IA that will grow (SaaS, admin, CMS) | Left vertical sidebar | Scales to long, growing lists and scans top-down (NN/g) at the cost of horizontal space |
| ≤ 5–7 flat peer sections with short labels | Top navigation | Saves width; fine for content products and small tools |
| Daily-use app where users learn the icons | Sidebar collapsible to an icon rail | Acceptable compromise with tooltips and one-click expand; icon-only strains memory for occasional users (NN/g) |
| Desktop, any size | Never a hamburger-only menu | Hidden navigation reduces discoverability (NN/g) |
| Consumer app on phones | Bottom tab bar with 3–5 destinations (`mobile-design`) | Thumb reach; drawer hides destinations |
| Peer views of one object | Tabs in the page header | Same object, different lens |
| Depth ≥ 3 levels or drill paths | Breadcrumbs | Shows where you are |
| Focused subtask | Sheet or drawer | Keeps context |
| Blocking decision | Modal; never modal on modal | Interrupts only when needed |

## Sidebar

**Order** (top to bottom): workspace switcher → search/⌘K → personal items (Home, Inbox, My work) → workspace sections → favorites/pinned → footer (invite, settings, help, account).

**Rules**
- 5–9 top-level items. Group with short labels only when the grouping is real (Workspace, Favorites); collapse long groups.
- Badges show **actionable** counts ("3" unread assigned to me), never totals ("1,204 projects").
- Active item: visible background plus `aria-current="page"`; keep the label weight the same in both states so text does not shift.
- Favorites and pins are user-controlled and reorderable; "Recent" is optional.
- Nested items: one level of submenu at most in the sidebar; deeper hierarchies belong in the page (tabs, tree, breadcrumbs).
- Secondary actions on items (⋯, +) appear on hover **and** focus, with a keyboard-reachable equivalent.
- Loading: skeleton items with stable height, never a spinner that collapses the sidebar.
- No animation on routine open/close beyond a short, reduced-motion-aware slide; this control is used many times a day.

**Widths**

| State | Width | Notes |
|---|---|---|
| Expanded | 240–280 px (shadcn default 16rem = 256 px) | Labels never truncate the top-level items |
| Icon rail | 48–64 px (shadcn default 3rem) | Tooltips on every icon; easy expand |
| Mobile drawer | ~288 px (shadcn default 18rem) | Opens over content below 768 px |
| Right inspector | 320–400 px | Optional detail panel on wide screens |

**Collapse behavior**
- Toggle from a header button, a rail handle, and ⌘/Ctrl+B.
- Persist the state per user where the server can read it (a cookie), so the first render is correct and nothing flashes or shifts.
- `offcanvas` (slides away completely) suits focus-heavy apps; `icon` (collapses to a rail) suits frequent navigation.

## Workspace switcher and environment

- Top-left, showing the current workspace name and avatar with a chevron so it reads as a switcher (Linear, Notion, Vercel, Slack all place it here).
- Lists workspaces with avatars, shortcuts for the first few (Plausible uses 1–9 to switch pinned sites), "Create workspace" at the bottom, and "Join workspace" when invitations are pending.
- Switching keeps the user on the equivalent page if it exists, otherwise Home.
- **Environment must be unmistakable**: test mode, staging, or impersonation shows a persistent badge or colored banner (Stripe's test-mode indicator is the reference pattern). Never rely on a subtle color shift alone.

## Header and page header

- **Global header** (about 48–56 px, sticky): sidebar toggle, breadcrumb or page title, search/⌘K trigger, notifications, help. Store its height in a token (`--header-height`) so sticky offsets stay consistent.
- **Page header**: title, short description if needed, secondary and primary actions on the right, tabs below. Primary page actions live here, not in the global header.
- One primary action per page; others are secondary or in an overflow menu.

## Breadcrumbs

- Show **hierarchy, not history**; each crumb is a link except the last (the current page, `aria-current="page"`).
- Wrap in `<nav aria-label="Breadcrumb">` with an ordered list.
- On narrow screens, collapse middle crumbs into a "…" menu; keep the first and last two.
- For analytical drill paths, the breadcrumb shows applied drill filters (`Revenue › Plan: Pro › Country: BR`) and each crumb removes the filters after it.

## Command palette (⌘K) and search

1. **Available everywhere**, same shortcut on every page, plus a visible trigger in the sidebar or header (discoverability).
2. **Platform-correct hint**: ⌘K on macOS, Ctrl+K on Windows and Linux; detect and render accordingly.
3. **Grouped and ranked**: when empty, show recent items and suggested actions; results grouped as Navigation, Actions, Recent, Help; commands for the current object first.
4. **Teaches shortcuts**: every command shows its shortcut, so the palette trains faster paths (Superhuman's principle).
5. **Nested pages for multi-step commands**: "Change status" → list of statuses; Backspace on an empty query goes back (Linear).
6. **Fuzzy matching and synonyms**: "delete" finds "Archive", "dark" finds "Theme".
7. **Complements visible navigation**, never replaces it.
8. **No open/close animation** or a very short one; it is used many times a day.

Accessibility: a dialog with focus trapped; input as `role="combobox"` controlling a `listbox`, `aria-activedescendant` for the highlighted option; result count announced politely; Esc closes and returns focus to the trigger (WAI-ARIA APG combobox pattern).

**Search vs palette**: global search finds content (records, docs, people) and can appear as a group inside the palette; large datasets still need a dedicated results page with filters and a shareable URL. `/` focuses the page's search field.

## Account menu, help, and what's new

**Account menu** (sidebar footer or top-right avatar), in this order:
1. Name and email (and current workspace/role).
2. Profile, preferences (theme, density, language).
3. Keyboard shortcuts (also on `?`).
4. What's new (unread dot) and Help/docs.
5. Switch account.
6. Sign out, last and separated.

**Help menu**: docs, keyboard shortcuts, contact support, status page, changelog. Keep help in the same place on every page (WCAG 3.2.6 Consistent Help).

## Notifications entry

- Bell in the header with an unread count capped at "9+".
- Panel with Unread / All (or Inbox / Mentions / All) and "Mark all as read".
- Each item: actor, action, object, relative time (absolute on hover), and a direct link; group bursts ("Maya and 3 others commented on 'Q3 roadmap'").
- Link to per-type preferences (in-app, email, push) in Settings.
- No marketing in the bell; product news goes to "What's new".
- Full notifications center and preferences screen: `app-screen-patterns`.

## Settings entry

- Reached from the sidebar footer (⚙ Settings) and the account menu.
- Split **personal** (profile, notifications, security, appearance) from **workspace** (general, members, roles, billing, integrations, API keys, SSO, audit log, danger zone).
- Every settings page has its own URL (`/settings/members`) so support and emails can deep-link.
- Plan-gated settings stay visible with the gate explained ("SAML SSO is on the Business plan · Compare plans").
- Settings layouts and destructive confirmations: `app-screen-patterns`.

## Responsive shell

| Viewport | Sidebar | Inspector | Header |
|---|---|---|---|
| ≥ 1280 px | Expanded (240–280 px) | Docked on the right if used | Full |
| 768–1279 px | Icon rail with tooltips, or offcanvas | Overlay sheet | Full; search may collapse to an icon |
| < 768 px | Drawer/sheet opened from a header button (shadcn switches to a Sheet below 768 px) | Full-screen sheet | Compact: menu, title, search icon, avatar |
| Consumer mobile app | Bottom tab bar, 3–5 destinations | — | Platform navigation bar |

- Keep the **same IA** at every size; nothing is dropped on mobile, only moved (drawer, "More").
- Use `100dvh`/`100svh` (or `min-h-svh`) for full-height shells so mobile browser chrome does not cause jumps.
- The drawer closes on navigation, traps focus while open, and returns focus to the trigger.
- Respect safe areas on notched devices (`env(safe-area-inset-*)`).
- Prefer container queries inside content so cards adapt to the space left by the sidebar, not the viewport.

## Density and keyboard

- **Density**: comfortable and compact modes for data-heavy apps (row heights ~32 / 40 / 48–56 px per `data-dense-ui`); one density per view; the setting lives in the account menu preferences.

| Shortcut | Action | Source |
|---|---|---|
| ⌘K / Ctrl+K | Command palette | Common convention |
| ⌘B / Ctrl+B | Toggle sidebar | shadcn Sidebar default |
| `/` | Focus search | Plausible and many apps |
| `?` | Shortcut sheet | Common convention |
| `G` then a letter | Go to a section (Linear/GitHub style) | Common convention |
| Esc | Close the top layer; clear filters when nothing is open | Plausible clears filters with Esc |

- Never override browser or OS shortcuts people rely on (⌘L, ⌘T, ⌘W, ⌘R).
- Single-key shortcuts must not fire while typing in inputs, and must be remappable or disableable (WCAG 2.1.4 Character Key Shortcuts).
- Show shortcuts in tooltips and in the palette.

## Accessibility

- Landmarks: `header`, `nav` (sidebar, with an `aria-label`), `main`, and a skip link to main content as the first focusable element.
- `aria-current="page"` on the active nav item and the last breadcrumb.
- Collapsed icon rail: every icon button has an accessible name; tooltips appear on focus as well as hover.
- Focus order: skip link → sidebar → header → main (or header before sidebar; pick one and keep it consistent).
- The sidebar toggle exposes `aria-expanded`; the mobile drawer is a modal dialog while open.
- Targets ≥ 24×24 CSS px (WCAG 2.5.8), larger on touch.

## Reference implementations (as of 2026-09)

**shadcn/ui Sidebar** (MIT, React):
- Parts: `SidebarProvider` (state) → `Sidebar` → `SidebarHeader` (sticky; branding or workspace switcher) → `SidebarContent` (scrolls; `SidebarGroup` with optional label and action) → `SidebarMenu` / `SidebarMenuItem` / `SidebarMenuButton` / `SidebarMenuAction` / `SidebarMenuBadge` / `SidebarMenuSub` / `SidebarMenuSkeleton` → `SidebarFooter` (sticky; user menu, settings) → `SidebarRail` (resize/toggle handle). Content goes in `SidebarInset`; `SidebarTrigger` toggles.
- Options: `variant` = `sidebar` | `floating` | `inset`; `collapsible` = `offcanvas` | `icon` | `none`.
- Defaults: width 16rem, mobile width 18rem, icon width 3rem, ⌘/Ctrl+B toggle, open state in a `sidebar_state` cookie (7 days) so server rendering matches, mobile breakpoint 768 px (renders in a `Sheet` below it).
- Blocks: grouped, collapsible, and nested sidebars, collapse-to-icons, inset with secondary nav, file tree, right and left+right sidebars, sticky site header, and **dashboard-01** (sidebar + sticky header + KPI cards + interactive area chart + data table).
- The palette in shadcn (`Command`) is built on the `cmdk` library.

Check the current docs before copying props; component APIs change between releases. Outside React, the same anatomy maps to a layout component with a persisted collapse flag, a drawer primitive, and a combobox-based palette.

## Checklist

- [ ] Sidebar for 5+ areas; top nav only for small flat IAs; no desktop hamburger.
- [ ] Workspace switcher top-left; environment (test/staging/impersonation) unmistakable.
- [ ] ⌘K palette everywhere: grouped, shows shortcuts, platform-correct hint, accessible combobox.
- [ ] Breadcrumbs for depth; title and primary action in the page header.
- [ ] Notifications actionable only, preferences linked; "What's new" in help/account menu.
- [ ] Account menu with preferences, shortcuts, what's new, help, sign out last.
- [ ] Settings split personal vs workspace, deep-linkable.
- [ ] Responsive: rail at tablet, drawer on phone, same IA; state persisted without flash.
- [ ] Landmarks, skip link, `aria-current`, focus management in drawer and palette.

## Sources

- NN/g, Left-Side Vertical Navigation on Desktop: https://www.nngroup.com/articles/vertical-nav/
- NN/g, Hamburger Menus on Desktop: https://www.nngroup.com/articles/find-navigation-desktop-not-hamburger/
- NN/g, Icon Usability: https://www.nngroup.com/articles/icon-usability/
- shadcn/ui Sidebar docs and source (MIT): https://ui.shadcn.com/docs/components/sidebar ; https://github.com/shadcn-ui/ui
- Superhuman, How to build a remarkable command palette: https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/
- Command palette design guide: https://www.setproduct.com/blog/command-palette-ui-design-guide
- WAI-ARIA Authoring Practices, Combobox and Breadcrumb patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- WCAG 2.2 (2.1.4 Character Key Shortcuts, 2.5.8 Target Size, 3.2.6 Consistent Help): https://www.w3.org/TR/WCAG22/
- Plausible docs, keyboard shortcuts: https://github.com/plausible/docs
- Stripe sandboxes and test mode: https://stripe.dev/blog/avoiding-test-mode-tangles-with-stripe-sandboxes
