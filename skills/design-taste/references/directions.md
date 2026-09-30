# Visual directions: full presets

Each direction below is a bundle of observable values you can check in the built UI. They are starting points, not a style guide. The brief's content decides the details. Blend at most two, and say which one dominates.

Every preset lists:
- **Fits:** the subjects and surfaces it suits.
- **Values:** type, color, shape, density, and motion.
- **Signature moves:** options for the one memorable thing.
- **Done badly:** the failure modes that make it read as a template.

## Contents

1. Editorial
2. Technical / precise
3. Soft / consumer
4. Brutalist / raw
5. Luxury / quiet
6. Playful / expressive
7. Institutional / civic
8. Blending and choosing

---

## 1. Editorial

**Fits.** Publications, research labs, long-form brands, essays, reports, docs-as-marketing, and nonprofits with a story. Read and Persuade modes.

**Values**
- Type: a display face with real character (a high-contrast serif, or a grotesk with strong proportions) for headlines. Pair it with a text face built for reading, serif or humanist sans. Ratio 1.333–1.5. Article body 18–20px, line-height 1.6–1.75, measure 60–70ch.
- Color: Restrained. A paper-like neutral base and an ink text color, both tinted from one hue. One accent reserved for links and the primary action.
- Shape: radius 0–4px. Rules (1px) separate content where print would use them.
- Density: low to medium. Section spacing 96–160px on desktop. Asymmetric columns, for example text on 7 of 12 columns with notes or figures in the margin.
- Motion: almost none. No entrance animations on text. Page transitions and image reveals only.

**Signature moves.** Scale contrast between a very large headline and calm body text. Pull quotes set as display type. Real photography with consistent cropping. Marginalia and footnotes as a layout device.

**Done badly.** The cream `#F4F1EA` + italic serif + terracotta cluster. Hairlines on every block. Justified text without hyphenation. Drop caps and ornaments on a SaaS page. An italic serif headline because "creative brief = serif".

---

## 2. Technical / precise

**Fits.** Developer tools, infrastructure, analytics, fintech back-offices, and pro creative tools. Operate mode first, and its Persuade pages.

**Values**
- Type: a grotesk or neo-grotesk UI face. A mono only where the content is code, IDs, or measurements. Ratio 1.125–1.2 in the app, 1.25–1.333 on marketing. In-app body 14–15px (16px on marketing and content). `tabular-nums` on every number that changes or aligns.
- Color: Restrained. Neutrals tinted toward the brand hue at chroma 0.005–0.015. One accent at ≤ 10% of the surface, spent on primary actions and selection. Status colors are semantic and always paired with an icon or text.
- Shape: controls 4–8px, cards and popovers 8–12px. 1px hairlines at 8–12% alpha of the foreground.
- Density: high. 4px base grid. Controls 32–36px tall on desktop. Table rows 32–40px.
- Motion: 100–200ms for state changes only. Nothing on keyboard-triggered actions. Optimistic updates carry the sense of speed more than animation does.
- Dark mode: common, but choose it from the use scene. Express elevation with surface lightness, not shadows.

**Signature moves.** A live product artefact as the hero: a real terminal session, a real query result, a real graph. A keyboard-first flow shown in motion. Crafted microstates: hover as a small lightness step, crisp focus rings.

**Done badly.** A decorative blueprint-grid background with crosshair marks. Mono small caps on every label as a costume. Near-black with an acid-green accent. A div-drawn fake terminal. A glow behind the hero.

---

## 3. Soft / consumer

**Fits.** Consumer apps, health and wellbeing, personal finance, lifestyle, and family products. Operate on mobile, Persuade on the web.

**Values**
- Type: a rounded or humanist sans with open apertures. Ratio 1.2–1.25. Body 16–17px (17pt on iOS). Weights 400/600.
- Color: Committed. One brand hue carries 30–60% of the key surfaces (hero, primary cards, tab highlights). Categories use tinted pastels paired with a darker same-hue text (for example a pale green background with a deep green label). Tinted neutrals only.
- Shape: cards 12–20px, pill buttons allowed, and nested radii obey `inner = outer − padding`. Soft two-layer shadows at low alpha, or tonal surfaces.
- Density: low. Card padding 16–24px. Touch targets 44–48px. One primary action per screen.
- Motion: springs on direct manipulation (drag, sheets, toggles). A critically damped spring or a small bounce (about 0.1–0.2) for "alive" moments. Standard transitions 200–300ms.

**Signature moves.** One committed brand color that owns the product. Warm custom illustration in one consistent style. A delightful completion moment, used once per flow.

**Done badly.** Glassmorphism cards over gradient blobs. `rounded-2xl` plus the same shadow on everything. Emoji as icons. A generic pastel rainbow with no dominant hue. Confetti on every save.

---

## 4. Brutalist / raw

**Fits.** Culture and music, art and design portfolios, indie products, manifestos, and developer art. Experience and Persuade modes. Rarely right for Operate.

**Values**
- Type: a heavy grotesk, a mono, or a deliberate system stack. Extreme scale contrast (ratio ≥ 1.5). Display line-height 0.85–0.95. Uppercase allowed for display, never for body.
- Color: Drenched, or two inks + one signal color. Pure `#000`/`#fff` allowed because they are a choice here. The signal color is used on one element type only.
- Shape: radius 0. Visible structure: 2–4px borders, raw grids, exposed alignment.
- Density: variable and intentional. Collisions and overlaps on desktop only, removed on mobile.
- Motion: none, or instant and stepped (`steps()`). No soft easing flourishes.
- Accessibility still applies: contrast, focus rings, and reading order are not optional in this style.

**Signature moves.** Type as architecture: headlines that fill the viewport width. One raw, honest material, such as a document, a scan, or source code.

**Done badly.** A hard `4px 4px 0` offset shadow and thick borders pasted onto an ordinary SaaS layout (neobrutalism as costume). Unreadable contrast. Broken keyboard navigation excused as "style".

---

## 5. Luxury / quiet

**Fits.** Premium goods, hospitality, private banking, architecture, and high-end services. Persuade and Experience modes.

**Values**
- Type: a refined serif or a light, well-drawn sans at large display sizes. Ratio 1.333–1.618. No more than 2 weights. Wide tracking (+0.05–0.1em) only on short uppercase labels that carry information.
- Color: near-monochrome. The accent almost never appears; photography carries the color. Body text contrast still ≥ 4.5:1. "Quiet" never means low-contrast grey text.
- Shape: radius 0–2px. No shadows, or one very soft shadow.
- Density: very low. Sections 128px+ apart. Few elements per viewport and generous image crops.
- Motion: slow fades and image reveals of 400–700ms, with one orchestrated moment. No bounce, no parallax stacks.

**Signature moves.** One decisive, art-directed photograph per section. Typography at a scale that feels architectural. Silence: a viewport with a single sentence in it.

**Done badly.** Gold gradients, cream + serif + brass accent, tiny grey text at 12px, and autoplay video with sound.

---

## 6. Playful / expressive

**Fits.** Kids and education, games, creative tools, communities, and consumer products whose brand is fun. Experience and Persuade modes, and consumer Operate.

**Values**
- Type: a characterful display face (rounded, variable width, or hand-made) paired with a plain, highly legible body face. Ratio 1.25–1.5.
- Color: Full palette. 3–4 named saturated roles, each with a job (action, highlight, category, celebration). Check every text pair for contrast. Saturated yellow and cyan backgrounds usually need dark text.
- Shape: large radii (16–28px) mixed on purpose with custom shapes and illustration. Nested radius rules still hold.
- Density: medium.
- Motion: visible overshoot (spring bounce around 0.2–0.35) on rare moments such as completion or rewards. Frequent actions stay fast. Honor reduced motion by swapping movement for fades.

**Signature moves.** A mascot or custom illustration system. Kinetic type on a single moment. Sound or haptics tied to success, opt-in.

**Done badly.** Corporate Memphis figures, confetti everywhere, emoji as the icon system, and five competing bright colors with no hierarchy.

---

## 7. Institutional / civic

**Fits.** Government, healthcare, insurance, banking core flows, and B2B trust surfaces. Operate and Read modes.

**Values**
- Type: a highly legible sans, such as a public-sector face or a system stack. Body 16–19px. Ratio 1.2. Sentence case everywhere.
- Color: Restrained. Aim for AAA (7:1) on body text. One action color and semantic status colors.
- Shape: radius 0–4px. Visible, high-contrast focus rings.
- Density: medium, with generous targets (44px+). Single-column forms.
- Motion: near zero.
- If an official design system exists for the jurisdiction or sector (GOV.UK Frontend, USWDS), use its package and patterns.

**Signature moves.** Clarity itself: plain-language headings that answer the user's question, and a step-by-step flow with a visible progress indicator.

**Done badly.** Stock photos of smiling people, a hero carousel, and a marketing tone on a service page.

---

## 8. Blending and choosing

| Brief signal | Start from | Common blend |
|---|---|---|
| "calm", "focused", "pro tool", keyboard users | Technical | + Editorial for docs and marketing |
| "trust", "public", "regulated", older users | Institutional | + Soft for consumer health |
| "premium", "craft", "heritage" | Luxury or Editorial | Luxury dominant for goods, Editorial dominant for ideas |
| "friendly", "for everyone", mobile-first | Soft | + Playful for one celebration moment |
| "bold", "manifesto", "culture", portfolio | Brutalist or Playful | + Editorial for readable long text |
| "data", "dashboard", "ops" | Technical | Never Luxury: density matters more than air |

Rules for blending:
- One direction owns type and color. The other contributes one element, such as a layout device or a motion moment.
- Keep one radius scale and one gray family across the blend.
- If the brief pins a direction ("make it brutalist"), follow it exactly and use the "Done badly" list as your guardrail.

## Sources

- Anthropic `frontend-design` skill (subject grounding, AI clusters, two-pass plan, restraint): https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Impeccable (visitor modes, color strategies, craft floor): https://github.com/pbakaus/impeccable
- Taste Skill (brief inference, style variants: soft, minimalist, brutalist): https://github.com/Leonxlnx/taste-skill
- Emil Kowalski skills (springs, frequency rule): https://github.com/emilkowalski/skills
- samber/cc-skills `frontend-design-deslop` (typography classes and registers): https://github.com/samber/cc-skills
- Linear UI redesign notes (theme from base, accent, contrast): https://linear.app/now/how-we-redesigned-the-linear-ui
- GOV.UK Design System: https://design-system.service.gov.uk/ ; USWDS: https://designsystem.digital.gov/
