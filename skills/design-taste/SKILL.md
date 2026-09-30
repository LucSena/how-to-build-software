---
name: design-taste
description: Use when choosing or judging the visual direction of any UI (a new landing page, app screen, portfolio, marketing site, or a redesign) and whenever the output risks looking generic or AI-generated. Covers grounding the design in its subject, surface modes, named visual directions with concrete values (editorial, technical, soft consumer, brutalist, luxury quiet, playful, institutional), color strategy, typeface selection, a dated anti-AI-slop catalog, one signature move and restraint, redesigning existing UIs, and screenshot self-critique. Also use when the user only says "make it look better", "less generic", "it looks like every AI site", "give it personality", "deslop", "make it premium", or "redesign this". Not for exact type, spacing, and color numbers (use design-foundations), tokens or DESIGN.md (use design-systems), or scored audits (use design-review).
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "design-foundations design-systems design-review design-resources motion-design conversion-ux"
---

# Design Taste

Generic, not ugly, is the failure mode now. Left alone, a model produces the statistical median of the web: a sans set in Inter, an indigo gradient, a centered hero over three icon cards, `rounded-2xl` on everything, and a fade-up on every section. Told to avoid that, it drifts to the next median: cream, an italic serif, and a terracotta accent. This skill forces a decision before any code is written. You ground the design in its subject, commit to a direction with observable values, compare the plan against the default you would have produced anyway, then build and critique with screenshots. The outcome it protects is a UI that belongs to its subject: swap in a competitor's logo and it should no longer fit.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also look for `DESIGN.md`, token files, a Tailwind `@theme` block, or an existing component library. If one exists, the direction has already been chosen. Your job is to extend it, not to invent a new one.

## Core principles

1. **Decide before you draw.** Write the direction plan before any markup. The median shows up wherever nothing was decided.
2. **Derive choices from the subject, not the category.** The subject's materials, vernacular, users, and use scene produce distinctive choices. "Fintech = blue" and "dev tool = dark + mono" are category defaults.
3. **The brief's own words win.** If the user names a look, even one from the slop list, build it well. Use your own freedom only on the axes the brief leaves open.
4. **Spend boldness in one place.** Pick one signature move and keep everything around it quiet. Before shipping, remove one accessory.
5. **Structure encodes information.** Numbers, eyebrows, borders, dividers, and mono labels appear only when they carry a real sequence, category, or data.
6. **Real content, or clearly labeled placeholders.** Never fabricate testimonials, logos, metrics, or reviews. Fake specifics are both a slop tell and a lie.
7. **Verify with your eyes, in bounded rounds.** Screenshot, critique, and fix in one batch. Stop after two rounds.

## Workflow

- [ ] **Read what exists**: the context file, DESIGN.md, tokens, and current screens. If a system exists, skip to "Build" and follow it, using `design-foundations` for the details.
- [ ] **State the Design Read** in one line: `Reading this as: <surface> for <audience> whose job is <job>; direction <X> because <subject reason>.` Ask **at most one** question, and only when the read is genuinely ambiguous (for example an unknown brand for a public launch). Otherwise proceed and list your assumptions.
- [ ] **Name the surface mode** (table below) and write one use-scene sentence: who uses it, where, and in what light. That sentence decides light or dark. The category never does.
- [ ] **Choose a direction** (preset table below), a color strategy, and **one signature move**. You may blend two presets, but one must dominate.
- [ ] **Write the token plan**: 4–6 named colors (OKLCH + hex, each with a role), typefaces and their roles, scale ratio, radius set, density, motion budget, and a layout concept as ASCII wireframes with the alignment stated. Add 2–4 principles specific to this brief.
- [ ] **Run the default check.** In 3 lines, write what you would have produced for a similar prompt by reflex, then compare it with your plan. Revise every part that matches, and say what changed and why. Then scan `references/slop-catalog.md`.
- [ ] **Build** to the `design-foundations` floor with real content. For placeholders, use plausible values and tell the user which ones are placeholders.
- [ ] **Self-critique** with the protocol below. Fix everything in one batch, re-check once, then stop.
- [ ] **Persist** the direction in DESIGN.md (see `design-systems`) so the next session extends it instead of starting over.

## Surface modes

Choose the mode per surface, not per product. A dev tool's landing page is Persuade; its settings page is Operate.

| Mode | The job | Type ratio | Density | Motion budget |
|---|---|---|---|---|
| **Persuade** (landing, pricing, launch) | Make one idea land in 5 seconds | 1.25–1.5, fluid display | Low–medium | One orchestrated moment, plus feedback |
| **Operate** (app UI, dashboards, admin) | Repeat tasks fast, all day | 1.125–1.2, fixed rem | Medium–high | State changes only, 100–250ms, none on keyboard actions |
| **Read** (docs, articles, help) | Sustained comprehension | 1.2–1.333 | Low | Almost none |
| **Experience** (portfolio, campaign, game) | Be remembered | Any, with intent | Varies | Can be authored, but must be skippable and respect reduced motion |

## Visual directions (presets)

These are starting points with observable values. They are not moods. Full specs, signature moves, and what each looks like when done badly are in `references/directions.md`.

| Direction | Type | Color strategy | Radius | Density | Motion |
|---|---|---|---|---|---|
| **Editorial** | Display serif or high-contrast face + readable text face; ratio 1.333–1.5; measure 60–70ch | Restrained: paper + ink + one link/accent hue | 0–4px | Low; sections 96–160px apart | Almost none; no text entrances |
| **Technical / precise** | Grotesk UI sans + mono only for real code/data; ratio 1.125–1.2; tabular numerals | Restrained: tinted neutrals (C ≤ 0.015) + one accent at ≤ 10% of the surface | 4–8px controls, 8–12px cards | High; 4px grid; 32–36px controls | 100–200ms state only |
| **Soft / consumer** | Rounded or humanist sans; ratio 1.2–1.25; body 16–17px | Committed: brand hue on 30–60% of key surfaces; tinted pastels for categories | 12–20px cards; pills allowed | Low; 44–48px targets | Springs on direct manipulation; 200–300ms |
| **Brutalist / raw** | Heavy grotesk or mono; ratio ≥ 1.5; display line-height 0.85–0.95 | Drenched or 2 inks + 1 signal; pure black/white allowed by choice | 0 | Visible structure; 2–4px borders | None, or instant/stepped |
| **Luxury / quiet** | Refined serif or light sans at large sizes; ratio 1.333–1.618; ≤ 2 weights | Near-monochrome; photography carries the color | 0–2px | Very low; 128px+ sections | Slow fades 400–700ms, one reveal |
| **Playful / expressive** | Characterful display + plain body; ratio 1.25–1.5 | Full palette: 3–4 named saturated roles, contrast-checked | 16–28px, mixed on purpose | Medium | Visible overshoot on rare moments only |
| **Institutional / civic** | Highly legible sans; body 16–19px; ratio 1.2 | Restrained; aim for AAA body contrast; one action color | 0–4px | Medium; generous targets | Near zero |

If the product already runs on an official system (GOV.UK Frontend, USWDS, Material, Fluent, Carbon, Polaris, Primer), use that system's package instead of imitating it.

## Color strategy

Pick the strategy before any hex values.

| Strategy | Accent share | Use when |
|---|---|---|
| **Restrained** | Neutrals + 1 accent at ≤ 10% | Default for Operate and Read, and for most B2B |
| **Committed** | One saturated hue on 30–60% of the surface | Consumer brands and launches that need recall |
| **Full palette** | 3–4 named roles | Playful, education, and illustration-led products |
| **Drenched** | The surface *is* the color | Campaigns, brutalist or experience pages; one section of a Persuade page |

The hue comes from product meaning. By 2026 the OKLCH band from about 250 to 320 (indigo to violet) is the AI default for accents, so pick it only when the brand already owns it. Color commits at page scale: fields that own regions, not accents sprinkled everywhere.

## Choosing typefaces

1. Write 3–5 personality adjectives from the brief, plus one "never".
2. Pick a class for each role (display, body, optional mono) from the subject's world, never from a stereotype like "books want a serif".
3. Draft 3 candidates per role from different foundries or sources. Reject any that sits on the dated overused-defaults list in `references/fonts.md`, unless the brief or brand earns it.
4. Test the candidates with the real headline and a real paragraph at display and body sizes. Check legibility at 14px, the numerals, and the italic.
5. Use one family or two. If two, make them clearly distinct; two near-identical grotesks read as mud.
6. Record the choice and the reason in DESIGN.md. Across projects, rotate: every "alternative" list turns into the next monoculture.

Operate surfaces may use a system stack or a workhorse UI face on purpose. That counts as a choice when it is stated and the rest of the system carries the identity.

## Signature move

Choose exactly one and name it in the plan:

- A type treatment: extreme scale contrast, variable-width display, or a set headline that works as the image.
- A color field: one drenched section, or a committed brand color that owns the page.
- A layout device: an asymmetric editorial grid, or an unequal bento where each cell holds a real product artefact.
- The subject's own artefact as the hero: a live demo, a real photo, a real data visualization, a code sample.
- One orchestrated motion moment, such as a page-load sequence or a scroll-told explanation of the mechanism.
- A material or texture grounded in the subject: grain, print registration, paper.

Everything else supports it quietly. If two elements compete for "the memorable thing", demote one.

## The anti-slop test

For every visible decision ask: **"Is this the most probable output for this category, or a choice made for this brief?"** Then run two more tests:

- **Swap test:** replace the logo with a competitor's. If the page still fits, it has no point of view.
- **Memory test:** what would a visitor describe an hour later? If the answer is "a clean SaaS page", revise the signature move.

The highest-frequency tells as of 2026-09 (the full dated catalog with detection hints is in `references/slop-catalog.md`):

- **First-order:** indigo/violet gradients and gradient text; Inter or Roboto as the display voice; centered hero → logo strip → 3 icon cards → testimonials → pricing as the whole page; identical cards with the same `rgba(0,0,0,.1)` shadow; a thick colored left border on cards; emoji as icons; glow blobs and decorative glass; a fade-up on every section.
- **Second-order** (what models do after hearing "no purple, no Inter"): cream background + high-contrast serif + terracotta accent; near-black + a single acid-green or vermilion accent; broadsheet hairlines with zero radius everywhere; Geist, Space Grotesk, or Instrument Serif by reflex; a tracked all-caps eyebrow above every heading; `A · B · C` meta strings; `→` on every link; mono small labels as costume; one italic or colored word in the headline; the big-number-plus-gradient "hero metric".

Each of these is legitimate when the brief earns it. The tell is reaching for it when the axis was free.

## Redesigning an existing UI

First decide the mode. **Refine** keeps the current look and improves it. **Overhaul** replaces it. Never split the difference by polishing a look you are about to discard. Audit before you touch anything: brand tokens, information architecture, content, patterns to keep, accessibility wins, the SEO baseline, and analytics events. Never silently change URLs, nav labels, form field names or order, the logo, or legal copy. Apply the levers in order: typography → spacing → color → states → motion → hero recomposition → block replacement. The first four give most of the value at a fraction of the risk. The full procedure is in `references/redesign.md`.

## Self-critique protocol

1. **Capture** desktop at 1440px and mobile at 390px, plus dark mode if it exists and a view at 200% zoom. Use Playwright or the browser tool if you have one. If you cannot render, review the code and report "Not checked visually".
2. **Squint test:** blur your eyes or the image. The primary element, the secondary elements, and the major groups should still read in order.
3. **Slop scan** against `references/slop-catalog.md`, then the swap and memory tests.
4. **Restraint pass:** remove one accessory, whether a decoration, a label, a border, or an animation, that the page does not need.
5. **Floor check:** contrast, focus-visible, states, reduced motion, and real copy (see `design-foundations`).
6. **Fix everything in one batch.** Confirm with at most one more round, then stop and report what remains.

## Gotchas

- **Replacing one default with the next.** Swapping Inter for Geist or Space Grotesk, or purple for cream + terracotta, is not a decision. Run the default check on the *new* plan too.
- **Blanket bans instead of judgment.** Nothing in the catalog is illegal. A serif is right for a law firm's editorial site, and near-black is right when it is tokenized and chosen for the use scene. Justify the choice in one line.
- **Eyebrows, numbered markers, and mono labels as decoration.** Use `01 / 02 / 03` only for a real sequence. Use an eyebrow only for a real category the heading does not already show. Never put one on every section.
- **Dark mode picked by category.** "It's a dev tool, so dark" is a reflex. Write the use-scene sentence.
- **Premium by accumulation.** Gradients, glass, glows, and more animation make a page louder, not better. Premium reads as considered states, tight type, and leaving things out.
- **Fabricated proof.** Invented "10,000+ teams", "99.9% uptime", testimonials from "Sarah Chen, CEO", and fake logo walls. Use labeled placeholders and list them for the user.
- **Div-drawn fake product UI.** A hand-built fake dashboard or terminal in the hero reads as slop. Use a real screenshot, a real component in demo mode, or a labeled image slot.
- **Motion everywhere.** Fade-up on every section and hover lift on every card is the default. Use one authored moment. Keyboard actions and actions repeated 100 times a day get no animation (see `motion-design`).
- **Landing-page rules applied to product UI.** Huge display type, 160px sections, and scroll choreography inside an app hurt repeat use. Check the surface mode.
- **Imitating a famous brand.** "Make it look like Linear/Stripe" should give you principles (restraint, one owned accent, crafted states), never their exact palette, logo-like marks, or copy.
- **Persuasion by deception.** Fake countdowns, invented scarcity ("3 people viewing"), confirmshaming opt-outs, and a visually buried "reject" button are dark patterns, not bold design. Never build them. Persuade by removing friction and uncertainty (see `conversion-ux`).
- **Unbounded polishing.** Endless screenshot loops burn time and drift the design. Two rounds, then ship and list the leftovers.

## Output format

Before building, show the plan:

```
Design Read: <surface> for <audience>; job: <job>; mode: <Persuade|Operate|Read|Experience>
Use scene: <who, where, light> → <light|dark|both>
Direction: <preset (+ secondary)> — because <subject reason>
Signature move: <one thing>
Color (<strategy>): <Name> oklch(...) / #hex — role; … (4–6)
Type: display <face> · body <face> · mono <face or none> · ratio <r> · weights <n>
Shape/density/motion: radius <set> · spacing base <n> · motion <budget>
Layout: <one sentence> + ASCII wireframe(s), alignment <left|center|mixed>
Principles: 2–4 brief-specific rules
Default check: reflex version was <…>; changed <…> because <…>
Placeholders: <list of anything not real>
```

After building, end with **Done / Verified (screenshots, checks) / Not checked / Placeholders to replace**.

## References

| File | Read when |
|---|---|
| `references/directions.md` | Choosing or blending a direction, or you need the full values, signature moves, and failure modes for one |
| `references/slop-catalog.md` | Running the default check, the self-critique slop scan, or reviewing someone else's UI for AI tells |
| `references/fonts.md` | Picking typefaces, checking a font against the dated overused list, or finding alternatives by role |
| `references/redesign.md` | Changing the look of an existing product, page, or app rather than starting fresh |

## Related skills

- `design-foundations` — once the direction is set, for exact type scales, spacing, color ramps, contrast, and elevation.
- `design-systems` — to turn the plan into tokens and a DESIGN.md that persists.
- `motion-design` — when the signature move is motion, or to set the motion budget.
- `conversion-ux` — when the surface is a landing, pricing, signup, or checkout page.
- `design-review` — to score and audit the finished UI.
- `design-resources` — for fonts, icon sets, component libraries, and inspiration galleries.
