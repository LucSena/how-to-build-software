# Fonts: sources, foundries, and tools (as of 2026-09)

Where to find typefaces and how to check them. How to *choose* a face for a brief, and the dated list of overused defaults, live in `design-taste` (`references/fonts.md` there).

## 1. Free sources

| Source | URL | License | Notes |
|---|---|---|---|
| Google Fonts | https://fonts.google.com | Mostly SIL OFL (free for commercial use; can be self-hosted) | The largest free library. Its most popular faces are the most overused, so browse beyond the top results. Self-host rather than hot-linking in production |
| Fontshare | https://www.fontshare.com | ITF Free Font License (commercial use allowed; read the terms) | Distinctive free faces from Indian Type Foundry: Satoshi, General Sans, Cabinet Grotesk, Clash Display, Switzer, Boska, Sentient, and more. Has a "Pairs" section |
| Fontsource | https://fontsource.org | Follows each font's license | npm packages for self-hosting open-source fonts (`@fontsource-variable/<name>`) |
| Vercel Geist | https://vercel.com/font | OFL | Geist Sans and Geist Mono. Excellent, but overused as a reflex choice in 2026 |
| Atkinson Hyperlegible | https://fonts.google.com | OFL | Designed for low-vision readers (Braille Institute); the "Next" family extends it |
| Lexend | https://fonts.google.com | OFL | Designed for reading proficiency, with variable width |
| Material Symbols / Roboto Flex | https://fonts.google.com | OFL / Apache-2.0 | Android-aligned UI and icons |

## 2. Paid foundries (a distinctive voice)

A licensed display face is one of the fastest ways off the default. Check web, app, and logo licensing per project.

| Foundry | URL | Known for |
|---|---|---|
| Pangram Pangram | https://pangrampangram.com | Neue Montreal, Editorial New, Neue Machina; affordable trial licensing |
| Grilli Type | https://www.grillitype.com | GT America, GT Walsheim, GT Sectra, GT Alpina |
| Commercial Type | https://commercialtype.com | Graphik, Lyon, Canela, Druk |
| Klim Type Foundry | https://klim.co.nz | Söhne, Tiempos, Signifier, Domaine |
| Dinamo | https://abcdinamo.com | ABC Diatype, ABC Monument Grotesk, ABC Favorit |
| Displaay | https://displaay.net | Contemporary grotesks and display faces |
| Typotheque | https://www.typotheque.com | Multi-script families (including non-Latin) |

## 3. Type tools

| Tool | URL | Use |
|---|---|---|
| Type Scale | https://typescale.com | Preview modular scales with your font |
| Utopia | https://utopia.fyi | Generate fluid type and space `clamp()` scales |
| Wakamai Fondue | https://wakamaifondue.com | Inspect a font file's OpenType features, axes, and character coverage |
| OKLCH picker | https://oklch.com | Check colors for type contrast and gamut |

## 4. Before shipping a font

- [ ] License covers web (and app, and logo if used); the client holds its own license where needed.
- [ ] Character coverage for every language you ship (Latin Extended, Cyrillic, Greek, Vietnamese; CJK or Arabic fallbacks).
- [ ] Variable WOFF2, subset to the scripts you need, with the 1–2 critical faces preloaded.
- [ ] `font-display: swap` and a metric-matched fallback (`size-adjust`, or `font-size-adjust: from-font`) to limit layout shift.
- [ ] Tabular and lining figures available if the product shows data.
- [ ] Total font transfer about 100 KB or less for most sites.

## Sources

- samber/cc-skills typography reference (Fontshare and Google picks, foundries, licensing notes): https://github.com/samber/cc-skills
- Vercel Web Interface Guidelines (subset and preload fonts): https://github.com/vercel-labs/web-interface-guidelines
- Google Fonts: https://fonts.google.com ; Fontshare: https://www.fontshare.com ; Geist: https://vercel.com/font
- Foundry sites as listed above
