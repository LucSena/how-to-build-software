# Icon libraries (as of 2026-09)

Counts are approximate and change often. For usage rules (sizes, stroke, alignment, states, accessibility), see `design-foundations`.

## 1. General-purpose icon sets

| Name | URL | What it is | License / install | When to use |
|---|---|---|---|---|
| Lucide [V] | https://lucide.dev | A fork of Feather. **v1.0 (June 2026)** removed all brand icons (use Simple Icons), dropped the UMD build, cut `lucide-react` by 32.3%, added context providers for global defaults, and now sets `aria-hidden` on icons by default, so an icon-only button needs its own `aria-label`. 1,857 icons on a 24px grid with a 2px stroke (v1.48, 2026-09). shadcn's default set | ISC · `npm i lucide-react` (props `size`, `strokeWidth`, `absoluteStrokeWidth`) | Default for shadcn/Tailwind apps; neutral and consistent. Restyle the stroke if it defines the whole look |
| Phosphor [V] | https://phosphoricons.com | 9,072 icons in total: about 1,500 glyphs × **6 weights** (thin, light, regular, bold, fill, duotone), as of 2026-09 | MIT · `npm i @phosphor-icons/react` | When the icon weight must track varied type weights, or you need filled active states from the same family |
| Tabler Icons [V] | https://tabler.io/icons | **6,220** icons (5,166 outline + 1,054 filled), 24px grid, 2px stroke; v3.48.0 (2026-09-22) | MIT · `npm i @tabler/icons-react` | The largest free consistent outline set; dashboards needing unusual metaphors |
| Remix Icon [V] | https://remixicon.com | 3,229 icons in 20 categories (v4.9.1, 2026-09), each in **Line and Fill** on a 24px grid. **Remix Icon License v1.0** (replaced Apache-2.0 in Jan 2026): free for personal and commercial use and attribution optional, but you may not sell the icons as a standalone pack, make them the main value of a commercial product, or use them as a logo | `npm i remixicon` or `@remixicon/react` | Paired line/fill states (tab bars, toggles); neutral "system" look |
| Hugeicons [V] | https://hugeicons.com | Free: 6,000+ Stroke Rounded icons. Pro: 60,000+ icons in 10 styles (Stroke, Solid, Twotone, Duotone, Bulk across Rounded, Standard, and Sharp), from $99/year (2026-09) | Free tier MIT-style; Pro needs a license · `npm i @hugeicons/react @hugeicons/core-free-icons` · React Native package available | Huge coverage and several styles from one family |
| Iconsax [V] | https://iconsax.io | The official Vuesax library: 7,000+ free icons and 44,000+ premium ones (50,000+ in total, 6 styles × 2 finishes, 24×24 grid), animated icons and icon fonts in Pro; React, Vue, Svelte, and Flutter packages; Figma plugin (2026-09) | Free + Pro (subscription or lifetime) | Soft, rounded consumer aesthetic (common in fintech and mobile) |
| Iconly [V] | https://iconly.pro | 40,000+ icons in 6 styles (Light, Outline, Bold, Two-tone, Duotone, Bulk) across flat, animated, and **3D** types, in a web app and Figma (2026-09) | Free tier of 2,500+ icons; Pro $99/year or $189 lifetime (2026-09) | Consumer mobile UI with the Iconly look; 3D icon art for marketing |
| Nucleo [V] | https://nucleoapp.com | Premium set of 44,282 icons (Core 19,128; UI 16,520 at 12/18px; Sharp; Pixel; Micro Bold at 20px) plus Glass, Credit Card, Flag, and Isometric sets, with a web app and a Mac/Windows app exporting SVG, sprites, icon fonts, JSX, and Vue | Commercial, one-time payment with lifetime updates: All Icons bundle $149 for 1 seat (list $405), single families $69–99 (2026-09) | Pro-grade coverage with small-size (micro) variants and a desktop icon manager |
| Isocons [V] | https://isocons.app | **Isometric** icons you customize (orientation, fill, edge, stroke, color, light/dark), with SVG export and a Figma plugin (v2.1) | **CC BY 4.0**: free, including commercially, but attribution is required | Feature grids and marketing illustration, not UI chrome |
| Simple Icons | https://simpleicons.org | Brand logos as SVG | CC0 (brand trademarks still apply) | Logos of real integrations and partners only. Never fake customer logos |

## 2. Native platform symbols

| Name | URL | What it is | Rules |
|---|---|---|---|
| SF Symbols 7 [V] | https://developer.apple.com/sf-symbols/ | Apple's library of over 7,000 symbols aligned with San Francisco (2026-09). Version 7 (WWDC25) added Draw On/Off animations, Variable Draw, gradient rendering, and improved Magic Replace. Rendering modes: monochrome, hierarchical, palette, multicolor | Apple platforms only (**license forbids web and Android use**). `Image(systemName:)`. Match weight and scale to the adjacent text style |
| Material Symbols [V] | https://fonts.google.com/icons | Google's variable icon font in Outlined, Rounded, and Sharp, with 4 axes: FILL 0–1, wght 100–700, GRAD −25–200, opsz 20–48 | Apache-2.0. Use FILL 0→1 for the selected state, GRAD −25 for light-on-dark, and opsz matched to the rendered size |

## 3. Animated and morphing icons

| Name | URL | What it is | Install | When |
|---|---|---|---|---|
| lucide-animated [V] | https://lucide-animated.com | 467 Lucide icons animated with Motion as React components (2026-09). MIT. Ships `llms.txt`, an agent skill, and an MCP server (`/mcp`). Community ports: Svelte (Moving Icons), Vue, Angular, Flutter | `npx shadcn@latest add "https://lucide-animated.com/r/{icon-name}.json"` (kebab-case names; adds `motion` on the first install) | Micro-delight in a Lucide-based shadcn app |
| itshover [V] | https://itshover.com/icons | 186+ icons designed motion-first with motion/react; editable components, shadcn CLI compatible; Apache-2.0 | shadcn CLI or copy | Interaction feedback in navigation and CTAs |
| Moving Icons [V] | https://movingicons.dev | 500+ animated Lucide icons **for Svelte 5**; zero dependencies, tree-shakeable, MIT (by jis3r) | `npm i @jis3r/icons` or the shadcn-svelte registry | Svelte/SvelteKit projects |
| Morphicons [V] | https://morphicons.com | Morphs between any two **stroke icons** on a shared 24px grid (Lucide, Tabler, Heroicons, or any stroke set). It solves the best rotation in closed form (2D Procrustes), so congruent pairs rotate and others morph, with interruptible springs. About 6 KB, zero dependencies; React, Vue, Svelte, React Native, Astro, or a web component | `npm install morphicons` | State changes: play↔pause, menu↔close, copy→check |

Animated icons are for rare or feedback moments. Icons the user triggers many times a day should not animate, and every animation needs a reduced-motion fallback.

## 4. Choosing

1. **Native app?** Use SF Symbols or Material Symbols, and stop.
2. **Already have a set?** Keep it. Draw missing glyphs in its style rather than mixing sets.
3. **Match the typography:** thin or light type → Phosphor light/thin or a 1.5px stroke; medium or semibold UI → a 2px stroke (Lucide, Tabler).
4. **Match the radius:** rounded terminals for soft UIs (Hugeicons Stroke Rounded, Iconsax), sharp for precise or brutalist UIs (Nucleo Sharp).
5. **Need selected states?** Pick a set with Line/Fill pairs (Remix, Phosphor, Material Symbols).
6. **Need coverage?** Tabler (free) or Hugeicons/Nucleo (paid).

## Sources

- Lucide v1 release notes: https://lucide.dev ; Phosphor: https://phosphoricons.com ; Tabler releases: https://github.com/tabler/tabler-icons
- Remix Icon License: https://remixicon.com ; Hugeicons: https://hugeicons.com ; Iconsax: https://iconsax.io ; Iconly: https://iconly.pro ; Nucleo: https://nucleoapp.com ; Isocons: https://isocons.app
- SF Symbols: https://developer.apple.com/sf-symbols/ ; Material Symbols: https://fonts.google.com/icons
- lucide-animated: https://lucide-animated.com ; itshover: https://itshover.com/icons ; Moving Icons: https://movingicons.dev ; Morphicons: https://github.com/guillermolg00/morphicons
- Emil Kowalski (animation frequency rule): https://github.com/emilkowalski/skills
