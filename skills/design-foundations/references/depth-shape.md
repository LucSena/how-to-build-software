# Depth and shape

Elevation, shadows, radius, borders, and focus rings.

## 1. Elevation model

Choose one model per theme and apply it everywhere.

| Level | Used for | Light theme | Dark theme |
|---|---|---|---|
| 0 | Page, flat content | No shadow | Base surface (L about 0.16) |
| 1 | Cards, raised panels | A hairline **or** an xs shadow | Surface +0.03–0.04 L, optional hairline |
| 2 | Dropdowns, popovers, menus | sm–md shadow + 1px border | Surface +0.07–0.08 L + border + soft shadow |
| 3 | Modals, dialogs, sheets | lg–xl shadow + scrim | Lighter surface + scrim; shadow mostly invisible |
| 4 | Toasts, dragged items | xl shadow | Lightest surface + shadow |

- Keep 3–4 shadow levels at most. More levels are indistinguishable.
- In dark themes, **the surface color carries elevation, not the shadow.**
- A dragged element rises by one level while dragging, and returns on drop.
- Flat directions (editorial, brutalist) can skip shadows entirely and show depth with tonal layers and borders. Say so in DESIGN.md's Elevation section.

## 2. Shadow recipes

**Rules**
- Use one light source: all y-offsets are positive and scale with the level.
- Use at least two layers: a tight "direct" shadow plus a wider "ambient" one.
- Keep alpha low. Tint shadows with the hue of the surface beneath instead of neutral black. On colored backgrounds, grey shadows look dirty.
- Don't combine a grey hairline with a wide diffuse shadow on the same element, unless the hairline is the shadow's own `0 0 0 1px` ring.
- Don't animate `box-shadow` (it causes repaints). Put the larger shadow on a pseudo-element and animate its opacity.
- A zero-offset colored halo is a glow, not a shadow. It reads as decoration and as an AI tell.

**Tailwind v4 defaults** (fine for neutral light UIs):
```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

**Crafted, hue-tinted layered shadows** (offsets and blur roughly double per layer):
```css
:root { --shadow-hue: 40 30% 20%; } /* hue of the surface beneath, as HSL parts */
--elev-1: 0 0 0 1px hsl(var(--shadow-hue) / 0.06),
          0 1px 2px hsl(var(--shadow-hue) / 0.06);
--elev-2: 0 0 0 1px hsl(var(--shadow-hue) / 0.06),
          0 1px 1px hsl(var(--shadow-hue) / 0.05),
          0 2px 4px -1px hsl(var(--shadow-hue) / 0.07),
          0 8px 16px -4px hsl(var(--shadow-hue) / 0.10);
--elev-3: 0 0 0 1px hsl(var(--shadow-hue) / 0.06),
          0 2px 4px hsl(var(--shadow-hue) / 0.06),
          0 8px 16px -4px hsl(var(--shadow-hue) / 0.10),
          0 24px 48px -12px hsl(var(--shadow-hue) / 0.18);
```

## 3. Radius

**Scale.** Use 2–3 values tied to component size and hierarchy, plus `full`:

| Token | Typical value | Used for |
|---|---|---|
| `radius-sm` | 4–6px | Inputs, chips, small buttons, checkboxes, tags |
| `radius-md` | 8–12px | Cards, popovers, menus, default buttons |
| `radius-lg` | 16–24px | Sheets, dialogs, large media, hero panels |
| `radius-full` | 9999px | Pills, avatars, toggles |

- Radius is part of the direction: 0–4px reads precise or editorial, 8–12px neutral product, 16px+ soft consumer. Pick it in the direction plan (see `design-taste`).
- Keep small cards at or below about 16px. At 24px+ a small card reads as a blob.
- To derive the scale from one variable (shadcn pattern): `--radius: 0.625rem`, then sm = ×0.6, md = ×0.8, lg = ×1, xl = ×1.4.
- Don't mix sharp and rounded corners in one view unless the difference is a documented rule.
- Match icon corners (sharp or rounded terminals) to the UI radius.

**Nested (concentric) radius.** When a rounded element sits inside another with padding between them:
```
inner radius = max(0, outer radius − padding)
```
```css
.card { --r: 16px; --p: 8px; border-radius: var(--r); padding: var(--p); }
.card > .media { border-radius: max(0px, calc(var(--r) - var(--p))); }
```
A child's radius is never larger than its parent's. If the padding is larger than the outer radius, the inner element can be square.

`corner-shape: squircle` (superellipse corners) is emerging in Chromium with limited support. Use it only as progressive enhancement.

## 4. Borders

- 1px hairlines at 8–14% alpha of the foreground adapt to any surface: `border-color: oklch(from var(--fg) l c h / 12%)`.
- In dark themes, borders are **lighter** than the surface (for example `oklch(1 0 0 / 10%)`).
- Use borders for structure (inputs, table rules, dividers), and shadows for depth. Pick one per element.
- Don't put a thick colored `border-left` on rounded cards or callouts. It is the most recognizable generated-UI tell. Use a background tint, an icon, or a title for status.
- State changes must not change border width, because that causes layout shift. Reserve the width with a transparent border, or use an inset `box-shadow` for the state.

## 5. Focus rings

```css
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

- Use `:focus-visible`, not `:focus`, so pointer clicks don't show rings. Use `:focus-within` for grouped controls.
- Outlines follow `border-radius` in all current engines and survive Windows forced-colors mode. Box-shadow rings are removed there. If you use a box-shadow ring, keep `outline: 2px solid transparent` as the forced-colors fallback.
- The ring needs ≥ 3:1 contrast against adjacent colors. A two-tone ring (outline plus an inner surface-colored shadow) works on any background.
- Good target: an indicator at least as large as a 2px perimeter, with ≥ 3:1 change between focused and unfocused (WCAG 2.4.13, AAA).
- Sticky UI must never fully cover the focused element (WCAG 2.4.11, AA).
- Never remove outlines without a visible replacement.

## 6. Glass and translucency

Use translucency to solve layering (a floating toolbar over content, a sheet over a map), not as decoration.
- `backdrop-filter: blur(12–24px) saturate(1.2–1.8)` over a tint opaque enough (about 60–80% alpha) that text holds 4.5:1 over *any* content beneath it.
- Add a 1px inner highlight border and a solid fallback: `@supports not (backdrop-filter: blur(1px)) { … }` and `@media (prefers-reduced-transparency: reduce)` where supported.
- Blur only fixed or sticky layers, never large scrolling areas. It is expensive on low-end GPUs.
- On iOS 26 and later, use the system Liquid Glass materials instead of hand-rolled glass (see `ios-design`).

## Sources

- Vercel Web Interface Guidelines (layered shadows, crisp borders, nested radii, hue consistency): https://github.com/vercel-labs/web-interface-guidelines
- Tailwind CSS v4 shadow defaults: https://tailwindcss.com/docs/theme
- shadcn/ui radius derivation: https://ui.shadcn.com/docs/theming
- Design System Checklist (elevation levels, surface color per level, z-index): https://www.designsystemchecklist.com/
- WCAG 2.2 (1.4.11, 2.4.11, 2.4.13): https://www.w3.org/TR/WCAG22/
- Impeccable craft floor (glow vs shadow, side-tab, glass as decoration): https://github.com/pbakaus/impeccable
- samber/cc-skills dark-mode and components references: https://github.com/samber/cc-skills
