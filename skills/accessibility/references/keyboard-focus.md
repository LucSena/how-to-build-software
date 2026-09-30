# Keyboard and Focus Management

Code-level recipes for focus rings, skip links, modal focus, roving tabindex, SPA navigation, and keyboard shortcuts.

## Contents
- Focus ring token
- Skip link
- Sticky UI and 2.4.11
- Modal focus with native dialog
- Hand-rolled focus trap (only if you must)
- Roving tabindex
- aria-activedescendant
- Focus after removal and SPA navigation
- inert
- Keyboard shortcuts
- Rules

## Focus ring token

```css
:root {
  --focus-ring-color: oklch(0.55 0.2 250);  /* ≥ 3:1 against every surface it appears on */
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
}
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
/* Two-tone ring for components that sit on unpredictable backgrounds (photos, brand colors) */
.on-media:focus-visible {
  outline: 2px solid white;
  box-shadow: 0 0 0 4px black;
}
```

- `:focus-visible` shows the ring for keyboard focus and hides it after mouse clicks on buttons; text inputs still show it on click, which is correct.
- `outline` follows `border-radius` in all current engines (Safari since 16.4) and remains visible in Windows forced-colors mode. A `box-shadow`-only ring vanishes in forced colors; if you must use one, add `outline: 2px solid transparent` so forced colors paints a ring.
- Grouped controls (a search field with an attached button): use `:focus-within` on the wrapper.
- Aim for WCAG 2.4.13 (AAA) as the spec: at least a 2 px perimeter with 3:1 change contrast.

## Skip link

```html
<a class="skip-link" href="#main">Skip to main content</a>
…
<main id="main" tabindex="-1">…</main>
```
```css
.skip-link { position: absolute; left: 1rem; top: -100px; }
.skip-link:focus { top: 1rem; z-index: 1000; }
```
It must be the first focusable element and become visible on focus. `tabindex="-1"` on `<main>` makes the jump move focus reliably in all browsers.

## Sticky UI and 2.4.11

```css
html { scroll-padding-top: var(--header-height); scroll-padding-bottom: var(--footer-bar-height, 0); }
[id] { scroll-margin-top: var(--header-height); } /* anchored headings */
```
Cookie banners, chat launchers, and bottom action bars must not fully cover focused elements; dock them so content scrolls clear of them, or make them dismissible and non-overlapping.

## Modal focus with native dialog

```html
<button id="open-settings" commandfor="settings" command="show-modal">Settings</button>
<dialog id="settings" aria-labelledby="settings-title">
  <h2 id="settings-title">Settings</h2>
  …
  <button commandfor="settings" command="close">Close</button>
</dialog>
```
`showModal()` (or the invoker command, Baseline newly available 2025-12) puts the dialog in the top layer, makes the rest of the page inert, closes on Escape, and returns focus to the previously focused element on close in current browsers. Verify focus return in your target browsers; if a framework re-renders the trigger, restore focus explicitly:

```js
const trigger = document.activeElement;
dialog.showModal();
dialog.addEventListener("close", () => trigger?.focus(), { once: true });
```

Set initial focus deliberately with `autofocus` on the right element inside the dialog.

## Hand-rolled focus trap (only if you must)

If you cannot use `<dialog>` or a primitive:
1. On open, save `document.activeElement`, set `inert` on every sibling of the overlay's root (or on the app root), move focus inside.
2. On Escape, close.
3. On close, remove `inert`, restore focus to the saved element.

Using `inert` on the background is more robust than intercepting Tab on the first/last element, because it also blocks screen-reader virtual cursors and pointer clicks.

## Roving tabindex

For toolbars, tab lists, radio-like groups, menus, listboxes, and grids: one Tab stop, arrows move inside.

```js
function onKeyDown(e, items, index) {
  const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  let next = index;
  if (e.key in keys) next = (index + keys[e.key] + items.length) % items.length;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = items.length - 1;
  else return;
  e.preventDefault();
  items[index].tabIndex = -1;
  items[next].tabIndex = 0;
  items[next].focus();
}
```

- Exactly one item has `tabindex="0"` at any time; it is the last active item when the user tabs back in.
- Use only the arrow axis that matches the orientation (set `aria-orientation` for vertical toolbars/tab lists); in RTL, Left/Right are mirrored.

## aria-activedescendant

Use when focus must stay on one element (a combobox input) while a highlight moves through options: set `aria-activedescendant="option-id"` on the focused element and style the referenced option. The referenced element must have an `id` and be inside the element controlled by the focused one.

## Focus after removal and SPA navigation

- **Deleted item**: move focus to the next item; if none, the previous; if none, the list container or its heading (with `tabindex="-1"`).
- **Closed popover/menu**: return focus to its trigger.
- **Inline edit saved**: return focus to the edit button or the row.
- **SPA route change**:
  ```js
  router.afterEach(() => {
    document.title = `${page.title} · App`;
    const h1 = document.querySelector("main h1");
    h1?.setAttribute("tabindex", "-1");
    h1?.focus({ preventScroll: false });
  });
  ```
  Some teams instead announce the new title via a polite live region and leave focus on a stable element; either way, the user must learn the page changed. Restore scroll position on back/forward.

## inert

`inert` (widely available) removes a subtree from focus order, pointer events, and the accessibility tree. Use it for background content behind custom overlays, off-screen slides and drawers, and content during a drag. Do not use `aria-hidden` for this: it hides from screen readers but leaves elements focusable.

## Keyboard shortcuts

- Single-character shortcuts (no modifier) must be disable-able, remappable, or active only when the relevant component has focus (2.1.4). Never fire them while focus is in a text field.
- Show shortcuts in tooltips and menus; never make a shortcut the only way to do something.
- Respect platform modifiers (⌘ on macOS, Ctrl elsewhere) and non-QWERTY layouts (match on `event.key`, not `event.code`, for character shortcuts).
- Escape closes the topmost layer only.
- Do not override browser/screen-reader keys (Tab, arrow keys in page content, Ctrl+L, screen-reader modifier combos).

## Rules

### Never rely on positive tabindex
**Rule.** Use `tabindex="0"` (make focusable in DOM order) and `"-1"` (programmatic focus only); never `1` or higher.
**Apply when.** Something is "in the wrong tab order".
**Do / Avoid.** Do reorder the DOM to match the visual order. Avoid `tabindex="3"` on a search box.
**Why.** Positive values jump ahead of every natural stop on the page and create an order no one can maintain (2.4.3).

### Return focus to where the user came from
**Rule.** When an overlay closes or content disappears, place focus on the trigger or the nearest logical successor.
**Apply when.** Closing dialogs, menus, popovers, drawers; deleting items.
**Do / Avoid.** Do restore focus to the "Edit" button after saving. Avoid letting focus fall to `<body>`.
**Why.** Focus on `<body>` sends keyboard and screen-reader users back to the top of the page (lost context, working-memory cost).

## Sources

- WebKit, "WebKit Features in Safari 16.4" (outline follows border-radius): https://webkit.org/blog/13966/webkit-features-in-safari-16-4/
- WAI-ARIA Authoring Practices, keyboard interface and focus management: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
- WCAG 2.2 Understanding 2.4.7, 2.4.11, 2.4.13, 2.1.4: https://www.w3.org/WAI/WCAG22/Understanding/
- Vercel Web Interface Guidelines (focus, keyboard): https://github.com/vercel-labs/web-interface-guidelines
- GoogleChrome modern-web-guidance (invoker commands, dialog, popover Baseline data): https://github.com/GoogleChrome/modern-web-guidance
- MDN `:focus-visible`, `inert`, `<dialog>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
