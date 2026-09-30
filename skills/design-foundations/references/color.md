# Color

How to build palettes that stay consistent, accessible, and themeable.

## Contents

1. OKLCH primer
2. Generating a ramp
3. The 12-step scale and its roles
4. Semantic roles and mapping
5. Deriving states in CSS
6. Contrast: what is normative
7. Dark mode recipe
8. Data visualization color
9. High contrast and forced colors
10. Checks

---

## 1. OKLCH primer

`oklch(L C H / alpha)`:
- **L** (lightness) runs 0–1.
- **C** (chroma) runs from 0 to about 0.37 in sRGB and about 0.4 in Display P3.
- **H** (hue) runs 0–360.

OKLCH is perceptually uniform. Equal L looks equally light across hues, so lightening and darkening are predictable, gradients have no grey dead zones, and wide-gamut colors are reachable. All evergreen browsers support it.

Hue landmarks: red about 20 · orange about 40 · yellow about 90 · green about 140 · teal about 195 · blue about 220–250 · purple about 300–320. The band from about 250 to 320 (indigo/violet) is the reflex AI accent. Use it only when the brand owns it.

High chroma clips out of sRGB at some hues, teal and cyan especially. Check colors in a picker (for example oklch.com), and keep a hex fallback in tokens for tools that need one.

## 2. Generating a ramp

1. Choose the brand hue H and a peak chroma C (accents usually 0.10–0.20).
2. Set L stops. A 12-step light-theme example: `0.985, 0.96, 0.925, 0.89, 0.85, 0.80, 0.73, 0.64, 0.56, 0.50, 0.43, 0.25`. Step 9 (about 0.56) is the solid brand color. Adjust it so the brand hex lands there.
3. Taper chroma toward both ends so tints are not washed out and shades are not muddy. Multiply the peak C by about `0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1, 1, 0.95, 0.8, 0.5`.
4. Optionally drift hue a few degrees. Yellows and oranges turn olive when dark, so shift darks toward warmer hues. Very light blues can shift slightly cooler.
5. Gamut-map to sRGB (reduce C until it fits) and record a hex fallback per step.
6. **Neutrals:** use the same H at C about 0.005–0.02 (tinted toward the brand). Use one gray family per product.
7. **Dark ramp:** build separately (section 7). Do not invert the light ramp.
8. Verify every text/surface pair you will actually use (section 6).

```js
// Emits a 12-step OKLCH ramp as CSS custom properties (no gamut mapping; check in a picker)
const L = [0.985,0.96,0.925,0.89,0.85,0.80,0.73,0.64,0.56,0.50,0.43,0.25];
const k = [0.1,0.2,0.35,0.5,0.65,0.8,0.9,1,1,0.95,0.8,0.5];
const ramp = (name, h, c) => L.map((l, i) =>
  `--${name}-${i + 1}: oklch(${l} ${(c * k[i]).toFixed(3)} ${h});`).join("\n");
console.log(ramp("brand", 40, 0.17), "\n", ramp("gray", 40, 0.012));
```

**Algorithmic themes.** Linear's redesign defines a whole theme from three inputs (base color, accent color, and contrast) and derives more than 100 variables in a perceptual space. A contrast input also yields high-contrast themes for free. Use this pattern when you need user themes or many brands.

## 3. The 12-step scale and its roles

Radix Colors' role-based scale is the best-documented model. Map your ramp to it:

| Step | Role |
|---|---|
| 1 | App background |
| 2 | Subtle background (cards, sidebars, striped rows, code blocks) |
| 3 | Component background (normal) |
| 4 | Component background (hover) |
| 5 | Component background (pressed or selected) |
| 6 | Subtle borders and separators (non-interactive) |
| 7 | Interactive component borders |
| 8 | Strong borders and focus rings |
| 9 | Solid backgrounds (the highest-chroma "brand" step) |
| 10 | Solid background hover |
| 11 | Low-contrast text |
| 12 | High-contrast text |

Radix designs steps 11 and 12 to reach about APCA Lc 60 and Lc 90 against step 2 of the same scale. Keep an alpha variant of each scale for overlays on colored or image backgrounds.

## 4. Semantic roles and mapping

Components consume roles, never ramp steps directly.

| Role | Light (step) | Dark (step of dark ramp) | Notes |
|---|---|---|---|
| `bg` | gray 1 | gray 1 | Page |
| `bg-subtle` | gray 2 | gray 2 | Sidebars, wells |
| `surface` | white or gray 1 | gray 2–3 | Cards |
| `surface-raised` | white | gray 3–4 | Popovers, menus |
| `overlay` | black / 40–60% | black / 60–70% | Scrims |
| `fg` | gray 12 | gray 12 | Primary text |
| `fg-muted` | gray 11 | gray 11 | Secondary text |
| `fg-subtle` | gray 10–11 | gray 10–11 | Tertiary text and placeholders. Placeholders still need 4.5:1, so step 11 is the safe default |
| `border` | gray 6 | gray 6 | Hairlines |
| `border-strong` | gray 7–8 | gray 7–8 | Inputs |
| `ring` | brand 8 | brand 8 | Focus indicator; ≥ 3:1 against adjacent colors |
| `accent` | brand 9 | brand 9 (lighter, less chroma) | Primary action |
| `accent-hover` | brand 10 | brand 10 | |
| `accent-fg` | white or brand 1 | brand 1 or black | Whichever passes 4.5:1 on `accent` |
| `accent-subtle` | brand 3 | brand 3 | Selected rows, badges |
| `success`/`warning`/`danger`/`info` | status 9 / 11 / 3 | same in dark ramps | Each with `-fg` (text), `-subtle` (bg), `-border` |

A shadcn-style alternative pairs every surface token with a `-foreground` token (`primary` / `primary-foreground`, `card` / `card-foreground`). It works well with component libraries (see `design-systems`).

Guidelines:
- One accent per view. Secondary actions are neutral.
- Keep brand color for links and actions and keep headings neutral. Do not spend the primary action color on decoration.
- Proportion heuristic: about 60% neutral, 30% secondary or brand surfaces, 10% accent. A Committed strategy deliberately breaks this with brand at 30–60%.
- Text on a colored surface uses the same hue, darker or lighter. Never neutral grey on color.
- Prefer explicit colors over stacks of translucent overlays; contrast then does not depend on what lies underneath.

## 5. Deriving states in CSS

```css
:root {
  --accent: oklch(0.62 0.17 40);
  --accent-hover: oklch(from var(--accent) calc(l - 0.05) c h);
  --accent-subtle: oklch(from var(--accent) 0.95 calc(c * 0.25) h);
  --accent-a20: oklch(from var(--accent) l c h / 20%);
  --border: oklch(from var(--fg) l c h / 12%);
}
```

- Relative color syntax (`oklch(from …)`) and `color-mix(in oklch, …)` are well supported. Check `web-platform` for current Baseline status.
- `contrast-color(var(--bg))` returns black or white. It is newly available (2026), so keep a fallback token.
- Hover is a small lightness step (±0.03–0.05 L) or a move from step 3 to step 4, not a hue change. Interactive states should increase contrast, not reduce it.

## 6. Contrast: what is normative

**WCAG 2.2 AA is the compliance bar** in 2026. ADA, Section 508, and the European Accessibility Act all reference WCAG 2.x.

| Content | Minimum |
|---|---|
| Normal text (including placeholders and text inside controls) | 4.5:1 |
| Large text: ≥ 24px regular, or ≥ 18.66px bold | 3:1 |
| Non-text: control boundaries, icons that convey meaning, focus indicators, chart marks needed to understand the data (SC 1.4.11) | 3:1 against adjacent colors |
| Disabled controls and pure decoration | Exempt, but disabled text should still be legible |
| AAA (civic, long-form, low-vision audiences) | 7:1 normal / 4.5:1 large |

**APCA** is a perceptual contrast model that is better for dark themes and thin or small type. It is *not* in WCAG 3 as of 2026-09; the WCAG 3 contrast method is still undecided. Use it only as a second check after passing WCAG 2. Commonly cited APCA guidance puts body text at roughly Lc 75 or higher, other content text around Lc 60, large headlines around Lc 45, and non-text elements around Lc 15 at minimum. Treat these as guidance, not compliance. APCA values depend on polarity: light-on-dark and dark-on-light give different results.

Check every state (rest, hover, focus, selected, disabled, placeholder), both themes, text on images, and text on gradients at their worst point.

## 7. Dark mode recipe

| Element | Value (OKLCH) |
|---|---|
| Base surface | L 0.13–0.18, brand-tinted C about 0.005–0.015 |
| Raised surface per level | +0.03–0.04 L (base 0.16 → card 0.20 → popover 0.24) |
| Primary text | L 0.93–0.97 |
| Secondary / disabled text | Dedicated tokens (for example L 0.75 / 0.55), checked for contrast |
| Accent | Same H, raise L, lower C (for example 0.62 0.17 → 0.72 0.13) |
| Borders | Lighter than the surface: `oklch(1 0 0 / 8–12%)`; inputs about 15% |
| Shadows | Only for truly floating layers; elevation is carried by surface lightness |

- Pure `#000` causes halation around text and OLED smearing, and leaves no room for elevation. A deliberate pure black is fine in some directions (brutalist, OLED media apps) when tokenized and checked.
- Keep hierarchy parity: what stands out in light mode stands out in dark mode.
- Mechanics: `color-scheme: light dark` on `:root` (not `body`), a `theme-color` meta per scheme, and `light-dark()` or theme selectors for tokens. Disable transitions during the switch. Respect the system preference and persist the user's override.
- Light text on dark looks thinner and tighter. Add a little line-height and tracking, and check thin weights carefully.

## 8. Data visualization color

- **Categorical:** hold L and C roughly equal and rotate H across 5–8 hues. Order the colors so adjacent series differ in lightness too (about 20% or more luminance gap). After about 8 categories, group the rest into "Other" or use labels.
- **Sequential:** one hue ramping in L (light = low, dark = high on light backgrounds).
- **Diverging:** two hues meeting at a neutral midpoint that represents a meaningful zero or average.
- **Never color alone.** Use direct labels, patterns, or shapes. Test with protanopia, deuteranopia, and tritanopia simulation and in grayscale.
- **Dark mode:** desaturate chart colors by about 15%, and keep gridlines at 5–10% white.
- Keep status colors (red/green) for status. Don't reuse them as categorical series.

## 9. High contrast and forced colors

- `@media (prefers-contrast: more)`: strengthen borders (for example step 6 → 8), raise `fg-muted` to `fg`, and thicken focus rings.
- `@media (forced-colors: active)`: the OS replaces your colors. Use system colors (`CanvasText`, `LinkText`, `Highlight`), and never rely on background color or box-shadow alone for meaning or focus. Outlines survive; box-shadows do not.

## 10. Checks

- [ ] Every text/surface pair in both themes and all states meets the table in section 6.
- [ ] Focus ring ≥ 3:1 against both the component and the page background.
- [ ] No neutral grey text on colored surfaces.
- [ ] One accent per view; status colors paired with an icon and text.
- [ ] A grayscale screenshot still shows the hierarchy.
- [ ] Chart palette passes color-vision-deficiency simulation.

## Sources

- Radix Colors, understanding the scale: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Evil Martians, "OKLCH in CSS": https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl ; picker https://oklch.com
- Linear, "How we redesigned the Linear UI": https://linear.app/now/how-we-redesigned-the-linear-ui
- shadcn/ui theming: https://ui.shadcn.com/docs/theming
- WCAG 2.2: https://www.w3.org/TR/WCAG22/ ; WCAG 3 draft status: https://www.w3.org/WAI/news/2026-09-10/wcag3/
- Adrian Roselli, "WCAG3 Contrast as of April 2026": https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html
- Vercel Web Interface Guidelines (hue consistency, interactions increase contrast, accessible charts): https://github.com/vercel-labs/web-interface-guidelines
- GoogleChrome modern-web-guidance (dark mode, `light-dark()`, `contrast-color()`): https://github.com/GoogleChrome/modern-web-guidance
- samber/cc-skills color-oklch and dark-mode references: https://github.com/samber/cc-skills
