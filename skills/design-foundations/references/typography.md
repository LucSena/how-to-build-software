# Typography

Numbers and recipes for type systems. Choosing the typeface is covered by `design-taste`; this file is about setting it.

## Contents

1. Modular scales
2. Worked scales
3. Role hierarchy (web starting values)
4. Fluid type with clamp()
5. Line-height and measure
6. Tracking, weight, and case
7. Numerals and typographic details
8. Wrapping and overflow
9. Platform type systems
10. Accessibility floors

---

## 1. Modular scales

Pick one ratio per surface mode, state it, and derive every size from the base. Keep 6–8 sizes in total.

| Ratio | Value | Use |
|---|---|---|
| Minor second | 1.067 | Very dense data UIs |
| Major second | 1.125 | Functional app UI, dashboards |
| Minor third | 1.2 | Balanced product UI (default for apps) |
| Major third | 1.25 | General UI, docs |
| Perfect fourth | 1.333 | Marketing, editorial |
| Augmented fourth / Perfect fifth | 1.414 / 1.5 | Expressive landing pages |
| Golden | 1.618 | Display-heavy, premium |

Large screens tolerate bigger ratios. A fluid system can use 1.2 on mobile and 1.333 on desktop for the display steps while body stays fixed.

Keep the browser default root of 16px. Setting the root to 62.5% breaks user font-size preferences and every third-party component.

## 2. Worked scales

Values are rounded to whole pixels, and a rem value is px ÷ 16.

| Step | 1.2 (product) | 1.25 (docs/general) | 1.333 (marketing) |
|---|---|---|---|
| −2 | 11 | 10 → use 12 | 9 → use 12 |
| −1 | 13 | 13 | 12 |
| 0 (body) | 16 | 16 | 16 |
| +1 | 19 | 20 | 21 |
| +2 | 23 | 25 | 28 |
| +3 | 28 | 31 | 38 |
| +4 | 33 | 39 | 51 |
| +5 | 40 | 49 | 67 |
| +6 | 48 | 61 | 90 |

Clamp small steps to the floors (12px captions). Round to values that sit on a 4px line-height grid where practical, but do not distort the ratio to hit it.

Tailwind v4 default text sizes, for reference (px size / line-height): xs 12/16, sm 14/20, base 16/24, lg 18/28, xl 20/28, 2xl 24/32, 3xl 30/36, 4xl 36/40, 5xl 48/1, 6xl 60/1. This scale does not follow a single ratio. Replace it with your own through `@theme` when the direction calls for it.

## 3. Role hierarchy (web starting values)

| Role | Size | Line-height | Tracking | Notes |
|---|---|---|---|---|
| Display | 48–72px (fluid) | 1.05–1.15 | −0.02em | Marketing only; ≤ 2 lines; max about 6rem |
| H1 | 36–48px | 1.15–1.2 | −0.01em | One per page |
| H2 | 28–36px | 1.25 | 0 | |
| H3 | 22–28px | 1.3 | 0 | |
| H4 | 18–22px | 1.35 | 0 | |
| Body large / lead | 18–20px | 1.6 | 0 | Intro paragraphs, articles |
| Body | 16px | 1.5–1.7 | 0 | |
| Small | 14px | 1.5 | 0 | Secondary text, dense UI body |
| Caption | 12px | 1.4 | +0.02em | Metadata, footnotes |
| Label (UI) | 12–14px | 1–1.3 | 0 (+0.05–0.1em only if uppercase) | Uppercase only when it encodes a category |

Product UI compresses this: page title 20–24px, section title 16–18px semibold, body 14px, meta 12–13px. Hierarchy comes from weight and color more than size.

## 4. Fluid type with clamp()

Use fluid sizing for display and heading steps, not body text.

```
font-size: clamp(MIN_rem, INTERCEPT_rem + SLOPE_vw, MAX_rem);

SLOPE_vw     = (MAX_px − MIN_px) / (VW_max − VW_min) × 100
INTERCEPT_px = MIN_px − (SLOPE_vw / 100) × VW_min
INTERCEPT_rem = INTERCEPT_px / 16
```

Worked example: 32px at a 360px viewport growing to 64px at 1280px.
- SLOPE = (64 − 32) / (1280 − 360) × 100 = 3.478vw
- INTERCEPT = 32 − 0.03478 × 360 = 19.48px = 1.217rem
- Result: `font-size: clamp(2rem, 1.217rem + 3.478vw, 4rem);`

Rules:
- Min and max in **rem**, so user font-size preferences apply.
- The preferred value must include a rem term. Pure `vw` does not grow with zoom and fails WCAG 1.4.4 (Resize Text).
- Keep **max ≤ 2.5 × min**, so that 200% zoom still enlarges the text meaningfully.
- For type inside components, use container units (`cqi`) so the heading scales with its card, not the viewport.

## 5. Line-height and measure

| Text | Line-height |
|---|---|
| Display / headlines | 1.05–1.2 (tighter as size grows) |
| Subheads | 1.25–1.35 |
| UI body (14–16px) | 1.4–1.5 |
| Reading body | 1.5–1.7 |
| Long-form articles | 1.6–1.8 |
| CJK text | about 1.7–1.8 |

- Use unitless line-height values so they scale with font size.
- Wider lines need more leading. Serif body and light-on-dark text need slightly more.
- **Measure:** 45–75 characters, about 66 ideal. Use `max-width: 65ch` for prose. Serif text can run slightly longer. Tables and code may exceed it.
- Never centre paragraphs longer than about 3 lines. Never justify without hyphenation (`hyphens: auto` plus a correct `lang` attribute).
- Paragraph rhythm: use either spacing between paragraphs (about 0.75–1em) *or* a first-line indent, never both.
- WCAG 1.4.12: layouts must survive user overrides of line-height 1.5, paragraph spacing 2em, letter-spacing 0.12em, and word-spacing 0.16em. Avoid fixed heights on text containers.

## 6. Tracking, weight, and case

- Tracking: display −0.01 to −0.02em, never tighter than about −0.04em (letters collide). Body 0. Small text +0.01–0.02em. Uppercase labels +0.05–0.1em.
- Weights: 2–3 per screen. Avoid weights below 400 for UI text at small sizes. Medium-sized headings usually look best at 500–600. Variable fonts allow in-between weights (450, 550).
- Light text on dark backgrounds looks bolder and tighter. Add a touch of line-height and tracking, or step the weight down, and check it visually.
- Never change font-weight on hover or selection; it causes layout shift. Change color, background, or underline instead.
- Use sentence case for headings, buttons, and labels by default. Keep all-caps for short labels that encode a category, never for body text.
- For emphasis inside a heading, use the same family's weight. A single italic or colored word is a known generated-page tell.

## 7. Numerals and typographic details

- `font-variant-numeric: tabular-nums` for tables, prices, timers, counters, and any number that changes in place. Use lining figures in UI and oldstyle only in editorial prose if the face has them.
- Right-align numeric columns and keep the decimals consistent.
- Use real characters: curly quotes (" " ' '), the ellipsis (…), en dash for ranges (9–5), the multiplication sign (×), and the minus sign (−) in data.
- Glue numbers to units with a non-breaking space (`10&nbsp;MB`, `⌘&nbsp;K`).
- Style `::selection` from the palette. It is one of the cheapest signs of a finished product.

## 8. Wrapping and overflow

- `text-wrap: balance` on headings (browsers limit it to a few lines; do not apply it globally).
- `text-wrap: pretty` on paragraphs to avoid orphans. Support is limited, but it degrades harmlessly.
- Flex and grid children that truncate need `min-width: 0`. Use `overflow-wrap: anywhere` or `break-word` for user content, and `line-clamp` for previews.
- Test with long German words, long names, emoji, and RTL text. Budget 30–40% text expansion for translations.

## 9. Platform type systems

Use the platform's roles on native surfaces rather than a web scale. Details belong to `ios-design` and `android-design`.

**iOS Dynamic Type (default "Large" size, pt)**

| Style | Size | Style | Size |
|---|---|---|---|
| Large Title | 34 | Body | 17 |
| Title 1 | 28 | Callout | 16 |
| Title 2 | 22 | Subheadline | 15 |
| Title 3 | 20 | Footnote | 13 |
| Headline | 17 (semibold) | Caption 1 / 2 | 12 / 11 |

Always use text styles so the sizes scale with the user's setting, and test at the largest accessibility sizes.

**Material 3 type roles (sp)**

| Role | L / M / S |
|---|---|
| Display | 57 / 45 / 36 |
| Headline | 32 / 28 / 24 |
| Title | 22 / 16 / 14 |
| Body | 16 / 14 / 12 |
| Label | 14 / 12 / 11 |

Use `sp` so text follows the system font scale, and test at 1.3× and above.

## 10. Accessibility floors

- Body text ≥ 16px on the web for content surfaces. 14px is for secondary text or dense tools. Captions ≥ 12px. Nothing functional below 11px.
- Inputs ≥ 16px on mobile, or iOS Safari zooms on focus. Never disable zoom to work around this.
- Contrast: 4.5:1 for text, 3:1 for large text (see `color.md`).
- Readability-oriented faces (Atkinson Hyperlegible, Lexend) help low-vision and dyslexic readers, but size, spacing, and contrast matter more than the face.

## Sources

- Bringhurst-style modular scales and web hierarchy (via samber/cc-skills typography reference): https://github.com/samber/cc-skills
- Tailwind CSS v4 theme defaults: https://tailwindcss.com/docs/theme
- Fluid scaling guidance (rem term, max ≤ 2.5× min): https://github.com/GoogleChrome/modern-web-guidance
- WCAG 2.2 (1.4.4 Resize Text, 1.4.12 Text Spacing): https://www.w3.org/TR/WCAG22/
- Vercel Web Interface Guidelines (tabular numbers, ellipsis, non-breaking spaces, input size): https://github.com/vercel-labs/web-interface-guidelines
- Rauno Freiberg, Web Interface Guidelines (no weight change on hover, heading weights): https://interfaces.rauno.me
- Anthropic `frontend-design` (measure under 80 characters, serif line-height): https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Apple HIG Typography: https://developer.apple.com/design/human-interface-guidelines/typography
- Material 3 type scale: https://m3.material.io/styles/typography/type-scale-tokens
