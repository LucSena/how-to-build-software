# Choosing typefaces

Type carries most of a page's personality, and it is where generated UIs converge fastest. This file gives a method, a **dated** list of overused defaults, and pools of alternatives by role. The pools are not rankings. Any face used by reflex on every project becomes the next monoculture: Geist went from "the recommended alternative" to "overused" in about a year.

## 1. Selection method

1. **Write the brief in type terms.** List 3–5 personality adjectives, one "never", the surface mode (Persuade, Operate, Read, Experience), the languages and scripts needed, and the smallest size the face must work at.
2. **Pick a class per role** from the subject's world:

   | Class | Carries | Typical fit |
   |---|---|---|
   | Serif (text) | authority, continuity, reading comfort | long-form, law, finance, research, editorial |
   | Serif (display, high contrast) | drama, fashion, confidence | headlines for premium or editorial brands |
   | Grotesk / neo-grotesk | neutrality, precision | product UI, tools, infrastructure |
   | Geometric sans | clarity, modernity, friendliness at large sizes | consumer brands, display |
   | Humanist sans | warmth, legibility at small sizes | health, education, civic, consumer UI |
   | Slab | sturdiness, mechanical honesty | industrial, automotive, editorial accents |
   | Mono | code, data, measurement | code blocks, IDs, tabular technical data |
   | Display / decorative / hand-made | voice, play | one role only: headlines or a logo moment |

   A subject association alone is never a reason. "Books want a serif" and "tech wants a mono" are category defaults. The adjectives decide.
3. **Draft three candidates per role** from different sources (see the pools in section 3). At least one should come from outside Google Fonts' top results.
4. **Evaluate each candidate against the criteria in section 4** using the real headline and a real paragraph. Check the numerals, italic, bold, and punctuation. Check the smallest size you will use.
5. **Pair.** Use one family or two. If two, make them clearly distinct in structure (serif + sans, or grotesk + humanist); two similar grotesks create typographic mud. Keep one quiet when the other is expressive. A shared trait, such as x-height, era, or proportion, helps them sit together.
6. **Decide weights.** Two or three per screen. UI text below 400 is hard to read. Medium headings usually look best at 500–600. Variable fonts let you pick 450 or 550.
7. **Record** the faces, roles, weights, and the one-line reason in DESIGN.md.

## 2. Overused defaults (as of 2026-09)

"Overused" means these are what a model reaches for when nothing was decided. Each is a good typeface. Use one when the brief, the brand, or the platform earns it, and write down why.

| Group | Faces | Acceptable when |
|---|---|---|
| First-wave defaults | Inter (as display/brand voice), Roboto, Arial/Helvetica, Open Sans, Lato, Montserrat, Poppins, `system-ui` as display | Inter or a system stack as the **body/UI workhorse** in a dense product, when identity comes from elsewhere; Roboto on Android-native surfaces |
| Second-wave "alternatives" | Geist / Geist Mono, Space Grotesk, Instrument Sans, Plus Jakarta Sans, DM Sans, Outfit, Mona Sans; rising: Satoshi, Cabinet Grotesk, Manrope | The brand already uses it (Geist on Vercel properties), or it is picked from candidates for a stated reason |
| Reflex serifs | Fraunces, Instrument Serif, Playfair Display, Newsreader, Cormorant, Lora, DM Serif, Recoleta (especially italic display heroes) | Editorial subjects where the specific face's character matches the adjectives. Rotate across projects and avoid the italic hero default |
| Costume monos | Space Mono, JetBrains Mono, IBM Plex Mono used for small "technical" labels | Real code, IDs, hashes, and measurements |

Refresh this table when you update the catalog. Faces move into it as they saturate generated output.

## 3. Alternative pools by role

Pools mix free and paid faces. Verify licensing for web, app, and any logo use before shipping. Free sources are Google Fonts (OFL) and Fontshare (ITF Free Font License, commercial use allowed; check current terms).

**UI workhorse sans** (body and controls in product UI)
- Free: IBM Plex Sans, Public Sans, Source Sans 3, Figtree, Hanken Grotesk, Schibsted Grotesk, Red Hat Text, General Sans, Switzer.
- Paid: Söhne, Suisse Int'l, ABC Diatype, GT America, Neue Montreal.
- A system stack is valid for dense tools when the choice is deliberate and stated.

**Display grotesk / geometric** (headlines with character)
- Free: Bricolage Grotesque, Clash Display, Red Hat Display, Syne (sparingly: it is common in AI portfolios).
- Paid: GT Walsheim, ABC Monument Grotesk, Söhne Breit, PP Neue Machina, Migra.

**Editorial serif display**
- Free: Source Serif 4 (display optical size), Crimson Pro, Boska, Sentient, EB Garamond.
- Paid: GT Sectra, Tiempos Headline, Canela, Domaine Display, PP Editorial New, Reckless, Schnyder.

**Text serif** (long reading)
- Free: Source Serif 4, Literata, Spectral, IBM Plex Serif, Crimson Pro.
- Paid: Tiempos Text, Lyon Text, Signifier.

**Humanist / friendly**
- Free: Figtree, Nunito Sans, Lexend, Atkinson Hyperlegible Next.

**Mono** (real code and data only)
- Free: IBM Plex Mono, Fira Code, JetBrains Mono (when not used as costume), Martian Mono.
- Paid: Berkeley Mono, GT America Mono, Söhne Mono.

**Accessibility-first**
- Atkinson Hyperlegible (designed for low vision), Lexend (designed for reading proficiency), Public Sans. Pair them with generous sizes (16px+) and spacing.

**Native platforms**
- iOS: SF Pro / SF Pro Rounded / New York via Dynamic Type text styles. Put a brand face in display moments only.
- Android: Roboto Flex or the brand face through the Material type roles, in `sp`.

## 4. Evaluation criteria

| Criterion | What to check |
|---|---|
| Coverage | All weights, italics, and scripts you need now and within a year (Latin Extended, Cyrillic, Greek, Vietnamese; CJK or Arabic fallbacks) |
| Legibility | Distinct I/l/1 and O/0, open apertures at 14px and below, and a sensible x-height (appropriate, not maximal) |
| Numerals | Tabular and lining figures available (`tnum`, `lnum`) for tables and prices |
| Versatility | Works for headline, body, caption, and UI labels, or pairs cleanly with a face that does |
| Distinctiveness | Recognizably different from competitors and from the list in section 2 |
| Technical | Variable WOFF2, a sensible file size after subsetting, and good hinting on Windows |
| License | Web, app, and embedding rights, and any logo restrictions |

## 5. Pairing patterns that work

- Serif display + neutral sans body. This reliably breaks the sans-everything default, but check that it is not the cream + italic serif cluster.
- Grotesk display at tight tracking + the same family's text cut for body (one-family systems can be the most distinctive when the scale is bold).
- Humanist sans body + mono for code only (developer docs).
- Characterful display + a very plain body (playful and campaign work).

## 6. Setting the chosen face

- Display tracking −0.01 to −0.02em, never tighter than about −0.04em. Body at 0. Small text +0.01–0.02em. Short uppercase labels +0.05–0.1em.
- Italic display with descenders (g, j, p, q, y) needs line-height ≥ 1.1 and a little bottom padding so descenders are not clipped.
- Emphasis inside a headline uses weight or size from the same family. A lone italic or colored word is a tell unless the meaning needs it.
- Load it well: self-host variable WOFF2, subset it, preload only the 1–2 critical faces, use `font-display: swap`, and use metric-matched fallbacks (see `web-platform`).

## Sources

- Anthropic `frontend-design` (one or two families, clearly distinct; typographic tells): https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Impeccable detector `OVERUSED_FONTS` list and new-work "training-data defaults": https://github.com/pbakaus/impeccable
- Taste Skill font guidance and serif rotation pool: https://github.com/Leonxlnx/taste-skill
- samber/cc-skills typography reference (classes, criteria, Fontshare and Google picks, pairing rules): https://github.com/samber/cc-skills
- Rauno Freiberg, Web Interface Guidelines (weights below 400, medium headings 500–600): https://interfaces.rauno.me
- Google Fonts: https://fonts.google.com ; Fontshare: https://www.fontshare.com
- Geist: https://vercel.com/font
