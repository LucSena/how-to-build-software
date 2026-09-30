---
name: design-foundations
description: Use when setting or fixing the visual fundamentals of any UI, such as type sizes, line length, spacing, grids, color palettes, contrast, dark mode, shadows, border radius, icon sizing, imagery, or responsive breakpoints. Covers modular type scales and fluid clamp() type, measure and line-height, a 4px spacing scale, 12-column and app-shell grids, OKLCH palette generation with 12-step scales, semantic color roles, WCAG 2.2 contrast (APCA as a secondary check), dark-mode rules, elevation and layered shadows, the nested-radius rule, icon usage rules, image rules, and content-first breakpoints with container queries. Also use when the user only says "the spacing feels off", "text is hard to read", "colors clash", "dark mode looks wrong", "it looks cramped", or "make it responsive". Not for choosing an aesthetic direction (use design-taste), token files or DESIGN.md (use design-systems), or CSS feature support (use web-platform).
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "design-taste design-systems accessibility web-platform data-dense-ui mobile-design"
---

# Design Foundations

Hierarchy, rhythm, and legibility come from a small set of numbers applied consistently: a type scale, a spacing scale, a color ramp with roles, a radius set, and an elevation model. Most UIs that "feel off" have no system: sizes chosen by eye, gaps that vary by 2px, grey text on colored backgrounds, one radius on everything. This skill gives defaults with numbers, the rule for when to deviate, and the checks that prove the result. It does not choose the aesthetic. `design-taste` does that, and this skill executes it precisely.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

If a DESIGN.md or token file exists, its values win over the defaults here. Use this skill to fill gaps and to check the existing values against the floors below.

## Core principles

1. **Scale, not guesses.** Every size, gap, radius, and shadow comes from a defined scale. Arbitrary values are how "almost aligned" happens.
2. **Hierarchy uses several signals.** Combine size, weight, color, and space. Size alone makes pages loud, and color alone fails for color-blind users.
3. **Space expresses relationships.** Keep related things close and separate groups generously (Gestalt proximity). One uniform gap everywhere erases structure.
4. **Color is roles, not swatches.** Components use semantic tokens (`fg`, `surface`, `accent`, `danger`); themes remap the roles.
5. **Contrast is a floor, not a style.** WCAG 2.2 AA in every theme and every state, checked rather than eyeballed.
6. **Dark mode is designed, not inverted.** Build a sibling palette, show elevation with lighter surfaces, and desaturate accents.
7. **Content decides breakpoints.** Add a breakpoint where the content breaks, not at device widths. Components respond to their container.
8. **Consistency beats local optimization.** One icon family, one gray family, one radius scale, one shadow model per product.

## Workflow

- [ ] **Inventory** what exists: fonts, sizes, colors, spacing values, radii, and shadows in use. Count the distinct values. More than about 8 font sizes or about 12 spacing values means there is no system.
- [ ] **Set the type scale**: base size, ratio for the surface mode, 6–8 steps, line-heights, measure, and weights.
- [ ] **Set the spacing scale and grid**: 4px base, relationship tiers, container widths, and the page and app grid.
- [ ] **Build the palette**: a brand ramp and a neutral ramp in OKLCH, mapped to semantic roles for light and dark.
- [ ] **Set depth and shape**: elevation levels, a shadow recipe, a radius set, borders, and focus rings.
- [ ] **Define icon and image rules**: the family, sizes, stroke, and image ratios and treatment.
- [ ] **Make it responsive**: page shell breakpoints driven by content, and container queries for components.
- [ ] **Verify**: check contrast for every text/surface pair in both themes and all states; view at 320–390px, 768, 1024, and 1440+, and at 200% zoom; run the squint test for hierarchy. Fix and repeat.

## Typography defaults

| Setting | Default | Deviate when |
|---|---|---|
| Base (body) | 16px web; iOS Body 17pt; Android bodyLarge 16sp | Dense pro tools: 13–14px in-app is acceptable. Long-form reading: 18–20px |
| Scale ratio | Product UI 1.2 · docs 1.25 · marketing 1.333 · expressive 1.5+ | Data-dense views: 1.125 |
| Number of sizes | 6–8 total | Never more than about 10 |
| Line-height | Body 1.5–1.7 · subheads 1.25–1.35 · headlines 1.05–1.2 (tighter as they grow) | Serif and light-on-dark text get slightly more. Floor 1.3 for body |
| Measure | 45–75ch; `max-width: 65ch` for prose | Tables and code can run wider. Never centre long text |
| Weights | 2–3 per screen; body ≥ 400; medium headings 500–600 | Display can go heavier or lighter by direction |
| Tracking | Display −0.01 to −0.02em (never past −0.04em) · body 0 · small text +0.01–0.02em · all-caps labels +0.05–0.1em | Never track body text |
| Minimums | Captions 12px · interactive text 14px · inputs ≥ 16px on mobile (iOS zooms below that) | none |

Fluid display type uses `clamp(min-rem, rem + vw, max-rem)`. Always include a rem term, and keep max ≤ 2.5× min so zoom still works. Keep body text fixed. Use `text-wrap: balance` for headings, `text-wrap: pretty` for paragraphs, and `font-variant-numeric: tabular-nums` for numbers that align or change. The formula, worked scales, and platform tables are in `references/typography.md`.

## Spacing and layout defaults

- **Base unit 4px.** Scale: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.
- **Relationship tiers:** inside a group 4–8 · between related groups 16–24 · between sections 32–48 in apps, 64–128 in marketing (96–160 for expressive desktop pages).
- **Headings bind down:** space above a heading is about 2× the space below it.
- **Container padding** ≥ 8px, typically 12–24px for cards. Body text never touches the viewport edge (16px minimum on mobile, 24–32px preferred).
- **Grid:** 12 columns on desktop (gutter 24–32px, max content 1200–1440px), 8 on tablet, 4 on mobile (margins 16–20px). App shell: sidebar 240–280px (collapsed 56–64px), fluid content, optional 320–400px inspector.
- **Control heights:** 32 / 36 / 40px (dense / default / large) on desktop; touch targets ≥ 44px (iOS 44pt, Android 48dp); WCAG AA minimum 24×24 CSS px.
- Use CSS Grid and `gap` for layout, not margin hacks or `calc(33% - 1rem)` widths. Use `min-h-dvh`/`svh`, not `100vh`, on mobile.

Details, grid recipes, and the responsive procedure are in `references/layout-spacing.md`.

## Color and contrast defaults

- **Author in OKLCH**, with a hex fallback where tooling needs one. Build a 12-step ramp per hue with roles for each step (backgrounds 1–2, component states 3–5, borders 6–8, solid 9–10, text 11–12).
- **Neutrals** use the brand hue at chroma 0.005–0.02, never a pure grey that mixes warm and cool. Use one gray family per product.
- **Accent:** one per view, from product meaning. Hue about 250–320 is the current AI default, so use it only when the brand owns it. Hover and active states are small lightness steps (±0.03–0.05 L) of the same hue.
- **Text on color** uses the surface hue, darker or lighter. Never neutral grey on a colored surface.
- **Minimum semantic set:** `bg`, `bg-subtle`, `surface`, `surface-raised`, `overlay`, `fg`, `fg-muted`, `fg-subtle`, `border`, `border-strong`, `ring`, `accent`, `accent-hover`, `accent-fg`, `accent-subtle`, plus `success`/`warning`/`danger`/`info`, each with `-fg` and `-subtle`.
- **Status is never color alone.** Pair it with an icon and a text label.

| Contrast (WCAG 2.2 AA, normative) | Ratio |
|---|---|
| Body text, placeholders, text in controls | ≥ 4.5:1 |
| Large text (≥ 24px, or ≥ 18.66px bold) | ≥ 3:1 |
| UI component boundaries, icons, focus indicators, chart marks | ≥ 3:1 against adjacent colors |
| AAA target for long-form and civic content | 7:1 body / 4.5:1 large |

Use APCA only as a secondary perceptual check, especially for dark themes and thin fonts, where WCAG 2 ratios misjudge pairs. It is not part of any normative standard as of 2026-09. Palette generation, the dark-mode recipe, and data-viz color are in `references/color.md`.

## Dark mode rules

- Base surface is near-black, about L 0.13–0.18 in OKLCH, tinted with the brand hue. Pure `#000` smears on OLED and leaves no room for elevation.
- **Elevation is lighter surfaces:** about +0.03–0.04 L per level (base about 0.16, card about 0.20, popover about 0.24). Use real shadows only on floating layers.
- Text is off-white (L about 0.93–0.97). Secondary and disabled text are dedicated tokens, not opacity guesses.
- Accents in dark mode: raise L, lower C, keep H. Borders are *lighter* than the surface (for example `oklch(1 0 0 / 10%)`).
- Set `color-scheme` on `:root` and the `theme-color` meta. Disable transitions during a theme swap. Re-check contrast for every pair. Hierarchy should match the light theme: what stands out in light stands out in dark.

## Depth, shape, and borders

- **Elevation levels:** 0 page · 1 raised (a hairline *or* an xs shadow) · 2 dropdown/popover (sm–md shadow + border) · 3 modal (lg–xl shadow + scrim) · 4 toast/drag.
- **Shadows** have at least two layers (ambient + direct), all offsets positive from one light source, low alpha, and a tint of the surface hue. Do not combine a gray hairline with a wide diffuse shadow unless the hairline is the shadow's own `0 0 0 1px` ring.
- **Radius:** 2–3 values tied to size, for example 4–6px for inputs and chips, 8–12px for cards and popovers, 16–24px for sheets and large media, and full for pills and avatars. Keep small cards at or under about 16px.
- **Nested radius:** `inner = max(0, outer − padding)`. A child's radius is never larger than its parent's.
- **Borders:** 1px at 8–14% alpha of the foreground adapts to any surface.
- **Focus ring:** `outline: 2px solid var(--ring); outline-offset: 2px` on `:focus-visible`. Outlines follow border-radius and survive forced-colors mode.

Recipes are in `references/depth-shape.md`.

## Icons and imagery

- **One icon family, one stroke width** (commonly 1.5 or 2px on a 24px grid). Corners match the UI radius. Sizes: 16px inline/dense · 20px buttons and inputs · 24px nav and toolbars · 32–48px empty states.
- Keep icon optical height about equal to the cap height of the adjacent text, and nudge ±1px for optical centering. Outline icons for rest, filled for selected or active.
- Hit target ≠ glyph size: pad to ≥ 24px (44px on touch). Icon-only buttons need an accessible name. Decorative icons are hidden from assistive tech.
- **Imagery shows the subject's real world:** product screenshots, real photos, real output. Use one decisive image instead of five mediocre ones. Fix aspect ratios per slot, use one color treatment, set `width`/`height` or `aspect-ratio`, use AVIF/WebP, and never lazy-load the LCP image.
- Text over images needs a scrim or a solid panel that holds 4.5:1 over the worst part of the image.

Full rules, including SF Symbols and Material Symbols, are in `references/iconography-imagery.md`.

## Responsive strategy

- **Mobile-first, content-first.** Start at 360px. Widen until the layout breaks, then add a breakpoint there. Most sites need 2–4. Framework defaults (640/768/1024/1280/1536) are fine as named steps, not as targets.
- **Container queries for components** (cards, media objects, table-to-list switches). **Media queries for the page shell** (nav pattern, columns, sidebar).
- **Restructure, don't stretch.** Change layout at breakpoints (sidebar → drawer, table → stacked rows, multi-column → one column) and keep the same information and functions on every size.
- Detect input capability with `@media (hover: hover)` and `(pointer: coarse)`, not screen width. Respect `env(safe-area-inset-*)`.
- **Must pass:** no horizontal scroll at 320 CSS px (WCAG 1.4.10 Reflow), usable at 200% zoom, and text survives WCAG 1.4.12 spacing overrides.

## Hierarchy checks

- **Squint test:** blur the screenshot. The primary element, 2–3 secondary elements, and the major groups should still read in that order.
- **One primary action per view.** Show 1–2 secondary actions and move the rest to a menu. Keep ≤ 4 visible choices per decision point (Hick's law).
- **Skeleton test:** replace the copy with grey bars. The structure alone should still communicate the page.
- **Grayscale test:** remove color. If the hierarchy collapses, it was relying on hue alone.
- **Alignment audit:** every edge lands on a grid line or on a sibling's edge. Accidental 2–3px offsets are the most common cause of "looks off". Nudge glyphs ±1px for optical balance *after* rendering.

## Gotchas

- **Too many sizes.** Ten font sizes and fifteen gaps is a lack of system. Snap values to the scale before adding new ones.
- **Hierarchy by size alone.** A giant H1 over grey body text is loud, not clear. Use weight and color steps, and tighten the scale in product UI.
- **Fluid body text or pure-`vw` type.** `font-size: 4vw` fails zoom (WCAG 1.4.4). Fluid type is for display sizes only, with rem bounds.
- **Grey text on a colored background.** Derive secondary text from the surface hue.
- **Opacity-based text colors on arbitrary backgrounds.** `text-black/60` changes contrast with every surface. Use explicit tokens and check them.
- **Inverted dark mode.** Flipping lightness makes shadows invisible, accents neon, and borders vanish. Build dark as its own ramp.
- **Contrast checked only at rest.** Hover, disabled, placeholder, selected, focus rings, and text on images all need checking, in both themes.
- **Card soup.** A border, shadow, and background on every group, plus cards inside cards. Group with space first, then a divider, and use a container only when elevation means something.
- **Headings floating between sections** because they have equal space above and below.
- **Uniform radius** on buttons, cards, modals, and avatars alike, or a child radius larger than its parent.
- **Icons from two families**, mismatched stroke weights, or emoji standing in for icons.
- **Device-width breakpoints** (375/414/768 "iPhone/iPad") instead of content breakpoints; hiding features on mobile.
- **`100vh` heroes** that jump when the mobile browser bars show or hide. Use `dvh`/`svh`.

## Output format

When defining foundations, deliver a compact spec (or update DESIGN.md or the tokens directly):

```
Type: base 16px · ratio 1.25 · sizes 12/14/16/20/25/31/39/49 · LH body 1.6, headings 1.15 · measure 65ch · weights 400/600
Spacing: 4px base · 4/8/12/16/24/32/48/64/96 · section 96 (desktop) / 64 (mobile)
Grid: 12 col, 24px gutter, 1280 max; 4 col mobile, 16px margins
Color: brand H=<h> ramp 1–12 · neutral H=<h> C 0.01 · semantic map (light | dark) · contrast table for every text/surface pair
Depth/shape: elevation 0–4 recipe · radius 6/12/20/full · border 1px @10% · focus 2px + 2px offset
Icons/imagery: <family>, stroke <n>, sizes 16/20/24 · image ratios <…>
Breakpoints: <content-driven list> · container queries on <components>
Verified: <contrast pairs checked, widths viewed, zoom> · Not checked: <…>
```

When fixing an existing UI, list each change as **Observed → Change → Why**.

## References

| File | Read when |
|---|---|
| `references/typography.md` | Building a type scale, computing clamp() values, setting line-height or measure, or mapping to iOS/Android text styles |
| `references/color.md` | Generating an OKLCH palette or 12-step ramp, mapping semantic roles, checking contrast, designing dark mode, or choosing chart colors |
| `references/layout-spacing.md` | Setting spacing and grids, building app shells, choosing breakpoints, or making layouts responsive with container queries |
| `references/depth-shape.md` | Defining elevation and shadow recipes, radius scales and nesting, borders, or focus rings |
| `references/iconography-imagery.md` | Picking icon sizes, strokes, and states, aligning icons with text, or setting rules for photos, illustrations, and AI-generated imagery |

## Related skills

- `design-taste` — choose the direction first; this skill executes it.
- `design-systems` — encode these values as tokens and in DESIGN.md.
- `accessibility` — the full WCAG 2.2 pass beyond contrast and targets.
- `web-platform` — CSS feature support (container queries, `light-dark()`, relative colors) and font loading.
- `data-dense-ui` — density, tables, and chart rules for dashboards.
- `mobile-design` — touch, safe areas, and platform type systems in depth.
