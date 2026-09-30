# A1: Design-focused skill repositories, research notes

Scope: the design skill repos cloned under `scratchpad/refs/`:

- **taste**: `Leonxlnx_taste-skill`, all 13 skills plus README and CHANGELOG
- **impeccable**: `pbakaus_impeccable`: `.claude/skills/impeccable/SKILL.md` + 38 reference files, the detector rule registry (`crates/foundation/src/registry.rs`, `constants.rs`), README and agent definitions
- **ui-skills**: `ibelick_ui-skills`, 7 skills plus the "playbook" dataset in `src/data/playbook.ts`
- **anthropic**: `anthropics_skills`: frontend-design, theme-factory, canvas-design, brand-guidelines, web-artifacts-builder
- **hyperframes**: `heygen-com_hyperframes`: motion-doctrine, hyperframes-animation (SKILL, techniques, easing adapter, rules), motion-graphics

## Source tags used below

| Tag | File |
|---|---|
| TS2 | taste `skills/taste-skill/SKILL.md` (v2, install name `design-taste-frontend`) |
| TS1 | taste `skills/taste-skill-v1/SKILL.md` |
| RD | taste `redesign-skill` |
| SOFT | taste `soft-skill` (`high-end-visual-design`) |
| MIN | taste `minimalist-skill` (`minimalist-ui`) |
| BRUT | taste `brutalist-skill` (`industrial-brutalist-ui`) |
| GPT | taste `gpt-tasteskill` (`gpt-taste`) |
| STITCH | taste `stitch-skill` (+ `DESIGN.md`) |
| OUT | taste `output-skill` (`full-output-enforcement`) |
| IGM / IGW / I2C | taste `imagegen-frontend-mobile` / `imagegen-frontend-web` / `image-to-code-skill` |
| IMP | impeccable `SKILL.md`. `IMP:x` = `reference/x.md` |
| IMP:DET | impeccable detector registry (61 deterministic rules) |
| UIS:base / a11y / motion / meta / improve / dmd | ui-skills `baseline-ui`, `fixing-accessibility`, `fixing-motion-performance`, `fixing-metadata`, `improve-ui`, `create-design-md` |
| UIS:PB | ui-skills playbook entries (`src/data/playbook.ts`) |
| AN:FD / TF / CD / BG / WAB | anthropic frontend-design, theme-factory, canvas-design, brand-guidelines, web-artifacts-builder |
| HF:MD | hyperframes `motion-doctrine` |
| HF:EASE | hyperframes `adapters/gsap-easing-and-stagger.md` |
| HF:R | hyperframes `rules-index.md` + `rules/*` |
| HF:BLUR | hyperframes `references/motion-blur.md` |

---

## 1. Per-repo analysis

### 1.1 taste-skill (Leonxlnx): "The Anti-Slop Frontend Framework"

**Structure.** 13 separate, self-contained `skills/<folder>/SKILL.md` files. None has a `references/` folder; each is one monolithic file. taste-skill v2 is 87 KB and 1,206 lines, with appendices of install commands and doc links inline. The only extra file is `stitch-skill/DESIGN.md`, a sample output. The repo also has a `research/laziness/` folder: notes on why LLMs truncate output, which backs `output-skill`. It holds no scripts for the skills. The only scripts are for README assets.

**How skills are split.** Two ways:
1. **By job**: implementation (taste v2, redesign, image-to-code, output-enforcement) vs image-generation-only (imagegen-web, imagegen-mobile, brandkit).
2. **By aesthetic**: soft (premium/agency), minimalist (Notion/Linear editorial), brutalist (Swiss/terminal), gpt-taste (stricter GSAP variant for GPT/Codex), stitch (Google Stitch DESIGN.md generator).

v1 is kept under a separate install name for backward compatibility. The README has a "Which one should I use?" routing section.

**Frontmatter.** Only `name` + `description`. The install name (`name:`) differs from the folder name, e.g. folder `taste-skill` → `design-taste-frontend`, `soft-skill` → `high-end-visual-design`.

**Descriptions.** Mostly marketing-flavoured, e.g. "Teaches the AI to design like a high-end agency…", "Elite UX/UI & Advanced GSAP Motion Engineer…". TS2 is the best: "Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction…". Few explicit "Use when…" trigger phrases. imagegen-web packs a hard rule into the description itself ("CRITICAL OUTPUT RULE — generate ONE separate horizontal image FOR EVERY section").

**Dials.** This is the signature mechanism. TS1/TS2/STITCH use three 1–10 dials: `DESIGN_VARIANCE` (symmetry → artsy chaos), `MOTION_INTENSITY` (static → cinematic), `VISUAL_DENSITY` (gallery → cockpit). Baseline is **8/6/4**. TS2 adds:
- a signal→dial inference table ("minimalist/calm/Linear-style" → 5-6 / 3-4 / 2-3; "trust-first/public-sector" → 3-4 / 2-3 / 4-5)
- use-case presets (Public-sector service 3/2/5; Agency landing 9/8/3; Developer portfolio 6/5/4)
- per-band definitions, e.g. MOTION 4-7 = `transition: all 0.3s cubic-bezier(0.16,1,0.3,1)`; DENSITY 8-10 = no cards, 1px lines, `font-mono` for all numbers

STITCH adds a 4th dial, `Creativity`. IGM has ~19 dials (ART_DIRECTION, PLATFORM_AWARENESS, FLOW_VARIETY, TEXTURE_STRENGTH, MIN_TEXT_SIZE_DISCIPLINE…), which is dial inflation.

**Checklists.** Every implementation skill ends with a "Pre-Flight Check" or "Pre-output checklist". TS2 §14 has ~60 checkboxes, several of them mechanical. Example: "count instances of `uppercase tracking`… If count > ceil(sectionCount / 3), the output fails."

**Other mechanisms.**
- TS2 §0 "Brief inference": a one-line "Design Read" stated before any code ("Reading this as: <page kind> for <audience>, with a <vibe> language, leaning toward <design system>"), plus the rule to ask **exactly one** clarifying question only when the read genuinely diverges.
- TS2 §2 "Brief → Design System map": use the official package (Fluent, Material Web, Carbon, Polaris, Atlaskit, Primer, govuk-frontend, USWDS, Bootstrap, Radix Themes, shadcn); "One system per project"; honesty labels for aesthetics like "Apple Liquid Glass" (approximation only, with a CSS skeleton and a `prefers-reduced-transparency` fallback).
- TS2 §12 "Block Library contract": a schema for future per-block files, with frontmatter `dial_compatibility`, `when_to_use`, `not_for`, `stack`. It is still empty.
- TS2 §13 "Out of scope": dashboards, data tables, wizards, native mobile, realtime collab.
- GPT: "Python-driven true randomization" (simulate `random.choice()` seeded by prompt length) plus a mandatory `<design_plan>` block.
- OUT: bans `// ...`, "for brevity" and similar, and prescribes a `[PAUSED — X of Y complete…]` protocol.

**Assessment.** Very concrete and heavy on values. The anti-slop lists are the richest in the set and clearly come from repeated production testing (e.g. "the #1 violated rule", "second-most-recurring AI-tell"). Weaknesses:
- Monolithic files with no progressive disclosure.
- Inconsistent across siblings (see §5).
- Stack-locked to React/Next/Tailwind v4/Motion/GSAP.
- Many rules are marketing-landing-specific and wrong for product UI. TS2 admits this in §13.
- "Persona" framing ("$150k agency", "Vanguard_UI_Architect").

### 1.2 impeccable (pbakaus): 1 skill, 24 commands, 61 detector rules

**Structure.** A single skill, `impeccable` (v4.4.0). SKILL.md is ~12 KB and acts as a **router**: setup, core principles, the 4 "modes", and a Commands table mapping each sub-command to `reference/<cmd>.md`. There are 38 reference files. Native variants exist: `audit.native.md`, `adapt.native.md`, `ios.md`, `android.md`. There are also `degraded/*.md` fallbacks for harnesses without subagents.

`scripts/impeccable` is a launcher for a Rust binary. Verbs include:
- `context`, `signals`, `detect --json [--scope type|layout]`
- `concept-seed`, `serve-question`, `build-phase`, `comp-spec`, `font-match`, `comp-diff`
- `critique-storage`, `surface-brief`, `embed-prompt`, `generate-image`, `pin`

It ships 4 subagents (`.claude/agents/impeccable-{finish-reviewer,documenter,asset-producer,manual-edit-applier}.md`) and a PostToolUse **design-detector hook** that runs the detector after UI file edits. The whole package is mirrored into about 15 harness folders (`.cursor`, `.github`, `.qoder`, `.vibe`…).

**Frontmatter.** Richest in the set:
- `name`, `description`
- `version: 4.4.0`, `user-invocable: true`, `license: Apache 2.0`
- `argument-hint: "[shape · audit|critique · animate|bolder|… ] [target]"`

**Description.** Very long and trigger-oriented: "Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, landing pages, dashboards, product UI… Not for backend-only or non-UI tasks." It enumerates verbs and surfaces for trigger matching and ends with a negative trigger.

**Commands (by category):**
- Build: shape, init, document, extract (craft is a deprecated alias)
- Evaluate: critique, audit
- Refine: polish, bolder, quieter, distill, harden, onboard
- Enhance: animate, colorize, typeset, layout, delight, overdrive
- Fix: clarify, adapt, optimize
- Iterate: live, generate
- Also: `hooks`, `doctor`, `pin`

With no argument it presents a context-aware menu driven by `impeccable signals` and **never auto-runs**.

**Key conceptual devices:**
- **Visitor modes**: Persuade (landing, pricing), Operate (app UI, dashboards), Read (docs), Experience (portfolio). The mode is chosen *per surface*, not per product: "A tool's landing page is still Persuade; a fashion house's documentation is still Read."
- **Persistent context files**:
  - `PRODUCT.md`: product truth (users, purpose, positioning, platform `web|ios|android|adaptive`, stack, evidence on hand, brand commitments). No visual decisions.
  - `DESIGN.md`: visual system, following Google's DESIGN.md spec: YAML tokens + 8 canonical sections.
  - Per-surface "surface brief" holding a 6-block **Direction contract**: THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH.
- **Anti-convergence dice**: `concept-seed` "deals" directions so every run doesn't converge on the category default. A "standing exit" always offers the category standard played straight.
- **Comp-led vs code-led build.** With image generation, three comps are made and approved; then the build runs as a gated state machine. Gates: comps → spec (measured regions) → plates (raster assets) → hero (≥72% diff match) → sections → motion → responsive.
- **Bounded verification.** "Build fully, inspect once with a batched round (desktop and mobile together)… fix everything in one batch, confirm with at most one more round, and stop polishing." Two rounds is the ceiling. The final review is delegated to a *fresh* subagent with no forked history, returning one of four dispositions: `recapture | rebuild | fix | ship`.
- **Craft floor** (`craft-floor.md`): loaded immediately before *any* UI edit. It has a Verify list and a Refuse list. Best single file in the set.
- **Scoring.** critique uses Nielsen's 10 heuristics at 0–4 each (/40, with `n/a` renormalization for Persuade/Experience), a cognitive-load checklist and 5 personas. audit uses 5 dimensions at 0–4 (/20). P0–P3 severity. Critique snapshots persist to `.impeccable/critique/` so `polish` can inherit the backlog and close it.
- **Live-mode signature params**: each command exposes a CSS variable knob. typeset: `--p-scale` 0.85–1.3; layout: `--p-density` 0.6–1.4; colorize: `--p-color-amount` 0–1. This is the "dial" idea turned into runtime CSS vars.

**Assessment.** Deepest and most mature: process, evaluation rubrics, native platforms, hardening, i18n, performance, copy. Weaknesses:
- Heavy coupling to its own binary and tooling. Many references are mostly tool protocol; new-work.md is 56 KB, mostly orchestration.
- Dense, legalistic prose.
- Some rules are its own opinion stated as law ("eyebrow is a ban, not a default: no brief earns it back").
- The web reference parts (adapt/optimize/harden) are generic, older-style checklists: "Mobile 320–767px", "hamburger menu", "3G".

### 1.3 ui-skills (ibelick): small, sharp, rule-list skills plus a registry

**Structure.** 7 skills; only `improve-ui` has a `references/` file (`plan-template.md`). The rest of the repo is an Astro site, a CLI (`npx ui-skills get <slug>`), an MCP server, `.well-known/agent-skills` discovery and a curated **playbook** of 47 one-line lessons aggregated from other skills (emil-design-eng, apple-design, better-ui…). `ui-skills-root` is a routing skill: "Prefer 1 skill. Use 2 only when the task needs two clear angles… Never use more than 3."

**Frontmatter.** `name`, `description`, sometimes `license`, `version`, `metadata: {author, version}`.

**Descriptions.** Crisp and trigger-oriented. Examples:
- baseline-ui: "Quickly deslop UI code by fixing spacing, hierarchy, typography, and small layout issues. Use when the interface needs a fast cleanup or polish pass."
- fixing-motion-performance: "Audit and fix animation performance issues including layout thrashing… Use when animations stutter, transitions jank…"

This is the model to copy.

**Format.** Invocation contract: `/skill` = apply constraints for the conversation; `/skill <file>` = review and output "violations (quote the exact line/snippet) / why it matters (1 short sentence) / a concrete fix". Rules use RFC-style **MUST / SHOULD / NEVER** keywords. The fixing-* skills have a **priority table** (priority / category / impact) and a "tool boundaries" category: don't migrate libraries, minimal diffs.

**improve-ui** is a rigorous read-only auditor with a 3-proof gate for each finding:
1. **Contract**: a cited binding design decision
2. **Runtime**: proven to reach the surface
3. **Correction**: exactly one deterministic change

It has a falsification pass, stops at 3 findings, and writes plans only to `design-plans/` for another agent to execute.

**create-design-md**: evidence pipeline `role → value → source → scope → recurrence → confidence`. Repo mode vs URL mode. It validates with `npx @google/design.md lint` and `export --format css-tailwind|json-tailwind|dtcg`. It forbids inventing tokens.

**Assessment.** Best rule-writing style: terse, testable, prioritized, with explicit tool boundaries. Weaknesses:
- baseline-ui is extremely conservative and Tailwind-specific ("NEVER add animation unless explicitly requested", "NEVER modify letter-spacing", "NEVER introduce custom easing curves").
- No mobile-native coverage.
- No aesthetics guidance beyond "don't".

### 1.4 anthropic skills

- **frontend-design** (9 KB, the canonical one). Persona: studio design lead, distinctive POV. Its content:
  - Ground the design in the subject matter.
  - The hero opens with "the most characteristic thing in the subject's world".
  - One or two type families.
  - A **calibration list of 5 AI clusters** (quoted in §3).
  - A **two-pass process**: token plan (4–6 named hex values, type roles, ASCII wireframe layout, principles) → review against the brief → build → self-critique with screenshots.
  - "Spend your boldness in one place"; the Chanel "remove one accessory" rule.
  - A strong UX-writing section.
  - Frontmatter is only `name/description/license`. Description: "Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one…"
- **theme-factory**: 10 preset themes (`themes/*.md`: 4 hex colors + header/body fonts + "best used for") plus a PDF showcase. Workflow: show showcase → ask → wait for choice → apply. Can generate a custom theme. Weak (DejaVu Sans fonts) but a useful pattern: **named preset themes as data files**.
- **canvas-design**: two-step "design philosophy (.md manifesto, 4–6 paragraphs) → express on canvas (.png/.pdf)". "90% visual, 10% text", "nothing overlaps, nothing falls off the page", a final refinement pass ("avoid adding more graphics; refine what exists"). Bundles ~40 OFL fonts in `canvas-fonts/`.
- **brand-guidelines**: Anthropic brand tokens: `#141413`, `#faf9f5`, `#b0aea5`, `#e8e6dc`; accents `#d97757`, `#6a9bcc`, `#788c5d`; Poppins headings / Lora body. Not reusable except as a pattern: **brand = token file + application rules**.
- **web-artifacts-builder**: scripts `init-artifact.sh` / `bundle-artifact.sh` (React 18 + Vite + Tailwind 3.4 + shadcn + Parcel → single HTML). One design line: "avoid… excessive centered layouts, purple gradients, uniform rounded corners, and Inter font."

### 1.5 hyperframes (HeyGen): motion doctrine for video compositions

**Structure.**
- `motion-doctrine`: gateway skill, `metadata.internal: true`, with `references/seam-gate.md` and scripts `seam-stamp.mjs` / `seam-gate.mjs`, a build gate that numerically verifies each scene seam.
- `hyperframes-animation`: SKILL router + `rules-index.md`, 48 atomic `rules/*.md`, `blueprints-index.md` + 22 blueprints, `transitions/`, `techniques.md`, 12 runtime `adapters/` (GSAP, Lottie, Three, WAAPI, CSS, TypeGPU…) and `scripts/animation-map.mjs` (audits choreography).
- `motion-graphics`: a phased multi-subagent pipeline (director → builder → verify → approve → render) with a `shot-plan.json` IR.

**Descriptions.** Keyword-stuffed, with bracketed tag lists: "[continuity, direction, vector, momentum, seam…]". "GATEWAY — load FIRST…". "These rules SUPERSEDE generic / upstream motion guidance."

**Transferable motion principles** (video-first, but many apply to UI; see §2.6):
- The vector law and carriers
- Causal motion
- The ban on idle wobble
- Stillness before climax
- Timing intents
- The spring-ease table
- Motion-blur restraint
- The index/rule/blueprint layering: atomic rules → composite blueprints → adapters

### 1.6 Structural comparison

| | taste | impeccable | ui-skills | anthropic FD | hyperframes |
|---|---|---|---|---|---|
| Skills | 13 monolithic | 1 router + 38 refs | 7 small | 1 file | 3, deep refs |
| Progressive disclosure | none | strong | minimal | none | strong (indexes) |
| Frontmatter extras | none | version, user-invocable, argument-hint, license | license, version, metadata | license | metadata.internal |
| Trigger phrasing | weak | strong ("Use when…", "Not for…") | strong ("Use when…") | medium | keyword tags |
| Parameters | 3 dials (1–10) | modes + live CSS-var params | none | none | ledger/timing params |
| Checklists | huge pre-flight | Verify/Refuse, rubrics | MUST/NEVER lists | quality floor | Seam Gate |
| Scripts | none | Rust CLI, detector, hook | CLI/MCP registry | bundlers | gate verifiers |
| Evaluation | self-check | heuristic scores, P0–P3, fresh reviewer | 3-proof findings | self-critique | numeric gate |
| Mobile native | image-gen only | ios.md, android.md, native audit | none | none | none |

---

## 2. Distilled rule catalog (deduplicated, categorized)

Notation: rules are paraphrased or quoted, followed by their sources. Where sources disagree, both values are listed; §5 resolves them.

### 2.1 Typography

**Font choice**
- Don't default to the monoculture faces. Lists differ by source:
  - IMP:DET `OVERUSED_FONTS`: Inter, Roboto, Open Sans, Lato, Montserrat, Arial, Helvetica, Fraunces, Instrument Sans, Instrument Serif, Geist / Geist Sans / Geist Mono, Mona Sans, Plus Jakarta Sans, Space Grotesk, Recoleta. Brand faces are allowed on their own domains, e.g. Geist on vercel.com.
  - IMP:new-work "training-data defaults" for Persuade/Experience: Fraunces, Playfair Display, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk, Space Mono, IBM Plex, Inter-as-display, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans.
  - TS2: Inter "discouraged as default" (fine for neutral/Linear/public-sector). TS2 bans Fraunces and Instrument Serif as default serifs and recommends Geist, Outfit, Cabinet Grotesk, Satoshi.
  - SOFT bans Inter, Roboto, Arial, Open Sans, Helvetica. MIN bans Inter, Roboto, Open Sans. STITCH bans Inter and recommends Fraunces/Instrument Serif. AN:WAB avoid Inter.
- Operate/Read surfaces may use system stacks and workhorse UI faces. Persuade/Experience want faces with a point of view (IMP). A subject association is never a reason ("books wanting a serif… tech wanting a mono") (IMP:new-work).
- Serif is "very discouraged as default"; only with an explicit brand/editorial reason. Never on dashboards (TS2, TS1, STITCH).
- Rotate serif choices across projects; TS2 gives a 20-face pool (PP Editorial New, GT Sectra, Tiempos, Canela, Domaine…).
- Use one family or two; if two, make them clearly distinct (AN:FD). Operate UIs: "one family is often right" (IMP:operate). Limit to one family, 3–4 sizes and 2–3 weights when distilling (IMP:distill).
- A system display face (Impact, Arial Black, the platform sans) must not be the display voice of an own-world page. Self-host a real face (IMP:craft-floor).
- Emphasis inside a headline uses italic or bold of the *same* family, never a random serif word (TS2). AN:FD instead lists "accenting a single word in italic/bold/color" as an AI tell. Contradiction, see §5.

**Scale and hierarchy**
- Default display `text-4xl md:text-6xl tracking-tighter leading-none` (TS2/TS1). Most heroes `text-4xl md:text-5xl lg:text-6xl`; `text-6xl md:text-7xl` only for 3–5-word headlines (TS2).
- Display max **6rem**; tracking floor **−0.04em** (IMP:craft-floor). The detector flags "extreme negative tracking".
- Flat hierarchy is when heading/body steps are **<1.25×** (IMP:DET `flat-type-hierarchy`). Product UI scale ratio **1.125–1.2** with a **fixed rem scale, not fluid clamp** (IMP:operate). Marketing display may be fluid via `clamp()` (IMP:typeset, STITCH `clamp(2.25rem, 5vw, 3.75rem)`, BRUT `clamp(4rem, 10vw, 15rem)`).
- Don't let hierarchy rest on size alone: combine size, weight, space, tone (IMP:typeset). "Control hierarchy with weight + color, not raw scale" (TS2 "NO oversized H1s"). IMP:DET `oversized-h1` flags a full-sentence headline at display size.
- Use Medium 500 and SemiBold 600, not just 400/700 (RD).
- Set a type scale per *The Elements of Typographic Style* (AN:FD).

**Measure, leading, tracking**
- Body measure: 65–75ch (IMP:craft-floor), 45–75ch (IMP:typeset), 60–75 characters (UIS:PB), `max-w-[65ch]` (TS2), under 80 characters (AN:FD). The detector flags lines >~80ch. Tables at 120ch+ are fine (IMP:operate).
- Body line-height 1.5–1.7; the detector flags <1.3 (IMP:DET `tight-leading`). MIN 1.6, STITCH 1.65. Headings ~1.1 (UIS:PB, STITCH, MIN). Brutalist display 0.85–0.95 (BRUT).
- Italic descender clearance: display italics with y/g/j/p/q need `leading-[1.1]` minimum plus `pb-1` (TS2).
- Serif body gets slightly more line-height than sans and may run slightly longer lines (AN:FD).
- Light text on dark surfaces: slightly more line-height, a touch more tracking and one step more weight (IMP:typeset).
- Tune line height inversely with measure: wider lines need more leading (IMP:typeset).
- Wide tracking (>0.05em) only on short uppercase labels (IMP:DET `wide-tracking`). Negative tracking on large display, positive on small caps (RD, UIS:PB). UIS:base: "NEVER modify letter-spacing unless explicitly requested."
- `text-wrap: balance` for headings and `pretty` for body (UIS:base, RD). Fix orphans (RD).
- `font-variant-numeric: tabular-nums` for data (UIS:base, RD, HF counters). DENSITY >7 → mono for all numbers (TS1/TS2/STITCH).
- No justified text without hyphenation (IMP:DET). No all-caps body (IMP:DET). Sentence case for labels, not all caps (UIS:PB, AN:FD). Sentence case not Title Case (RD).
- Paragraph rhythm: spacing *or* first-line indent, not both (IMP:typeset).

**Size floors**
- Web body **16px / 1rem** floor. 14px only for genuinely secondary text. iOS Safari force-zooms focused inputs under 16px (IMP:harden, IMP:typeset, IMP:adapt).
- Detector: body <12px = "tiny text"; functional UI text <11px = failure (IMP:DET).
- STITCH: body never below 14px, minimum 1rem.
- iOS: 11pt floor, Body 17pt, Dynamic Type text styles only (IMP:ios). Android: Material type roles, `sp` units only (IMP:android).

**Delivery**
- Self-host or use `next/font`; `font-display: swap`; never link Google Fonts via `<link>` in production (TS2).
- Subset (`unicode-range`), preload critical fonts, limit weights (IMP:optimize).
- Metric-compatible fallbacks; no invisible text or disruptive reflow (IMP:typeset).

### 2.2 Color

- **Pick a strategy before colors** (IMP:new-work):
  - Restrained: neutrals + 1 accent; the default for Operate/Read.
  - Committed: one saturated color carries **30–60%** of the surface.
  - Full palette: 3–4 named roles.
  - Drenched: the surface *is* the color.
  - Color commits at page scale: fields owning regions, not scattered accents.
- Max 1 accent, saturation **<80%** (TS1/TS2/STITCH/RD). One accent per view; secondary actions neutral (UIS:base, UIS:PB). Accent at ≤10% of a screen ("One Voice Rule" example, IMP:document). The quieter pass uses a 10% rule and desaturates to **70–85%** (IMP:quieter).
- Color consistency lock: one accent across the whole page (TS2). One gray family: never mix warm and cool grays (TS2, RD, STITCH).
- Build **roles, not swatches**: canvas/elevated surfaces, primary/secondary text, action/focus/selection, borders, success/warning/error/info, data scales (IMP:colorize). Semantic tokens remap per theme (IMP:colorize, TS2 §8.A).
- Use **OKLCH** for new web palettes. Reduce chroma near white and black. Prefer explicit colors over chains of translucent overlays, so contrast isn't context-dependent (IMP:colorize).
- **Gray on color is banned.** On colored surfaces, derive secondary text from the surface hue or use near-white (IMP:craft-floor, IMP:DET `gray-on-color`, IMP:quieter).
- Tinted neutrals: "Don't use pure black/gray (always tint)" (IMP README). IMP:colorize softens this: "Neutral gray is valid when it serves the world." No `#000000` (TS1/TS2/STITCH/SOFT/BRUT); off-black such as `#0a0a0a`, `#121212`, zinc-950 (RD). TS2 §8: no pure `#000` *and* no pure `#fff`. Contradiction: AN:FD lists "tinted near-black (#0B0B0B, #111) standing in for black" as an AI tell.
- Hue comes from product meaning, never from a default category association (IMP:colorize). Light vs dark is never a category default: write one sentence of physical use scene (who, where, under what light) and let it decide (IMP:new-work, IMP:craft-floor).
- Keep brand color for links and actions; keep headings neutral (UIS:PB).
- Primary action color is not spent on decoration (IMP:colorize).
- Palettes:
  - TS2 premium-consumer alternatives: Cold Luxury, Forest, Black & Tan, Cobalt + Cream, Terracotta + Slate, Olive + Brick + Paper, monochrome + single pop.
  - STITCH accents: Emerald `#10B981`, Electric Blue `#3B82F6`, Deep Rose `#E11D48`, Amber `#F59E0B`; neutrals Canvas `#F9FAFB`, Charcoal `#18181B`, Steel `#71717A`.
  - MIN pastels: Pale Red `#FDEBEC`/`#9F2F2D`, Pale Blue `#E1F3FE`/`#1F6C9F`, Pale Green `#EDF3EC`/`#346538`, Pale Yellow `#FBF3DB`/`#956400`; text `#111111`/`#2F3437`, muted `#787774`, border `#EAEAEA`.
  - BRUT: paper `#F4F4F0`, ink `#050505`, hazard red `#E61919`, optional terminal green `#4AF626` for one element only.
- Plan: describe the base palette as **4–6 named hex values** (AN:FD). Each color gets Descriptive Name + Hex + Functional Role (STITCH, IMP:document).
- Data viz: encode with lightness, chroma, shape, label or pattern; never color alone (IMP:colorize).

### 2.3 Spacing, layout and composition

- **Spacing scale**: documented, with a **4-unit base** that gives middle steps an 8-only scale misses (IMP:layout). One spacing scale, no arbitrary gaps (IMP:distill).
- **Rhythm**: tight groups, generous separation; **more space above a heading than below it** (IMP:craft-floor, IMP:DET `heading-rhythm`). The detector flags "monotonous spacing" (same value everywhere).
- Group by proximity first, before adding containers or dividers (IMP:layout, UIS:PB). Shadows show depth; borders show structure (UIS:PB).
- **Squint test**: with detail blurred you can still identify primary, secondary and major groups in order (IMP:layout).
- Optical corrections come after rendering: icons in buttons and play glyphs need 1–2px nudges (RD, IMP:layout, UIS:PB).
- Section padding:
  - TS2 VISUAL_DENSITY bands: 1–3 → `py-32…py-48`; 4–7 → `py-16…py-24`.
  - SOFT: `py-24…py-40`, "double your standard padding". GPT: `py-32 md:py-48`. MIN: `py-24/py-32`. STITCH mobile section gaps `clamp(3rem, 8vw, 6rem)`.
  - Bottom padding often needs to be optically larger than top (RD).
- Containers `max-w-[1400px] mx-auto` or `max-w-7xl` (TS2); 1200–1440px (RD). Horizontal padding 1rem mobile, 2rem tablet, 4rem desktop (STITCH). Body text never touches the viewport edge: ≥16px, ideally 24–32px padding (IMP:DET).
- **CSS Grid over flex-percentage math** (`w-[calc(33%-1rem)]` banned) (TS1/TS2/STITCH/RD). Use `gap` for sibling rhythm (IMP:layout). Container queries for components that appear in several contexts (IMP:layout, IMP:adapt).
- `min-h-[100dvh]`, never `h-screen` / `100vh` (TS1/TS2/STITCH/SOFT/RD); UIS:base: `h-dvh`.
- **Cards only when elevation communicates hierarchy**; otherwise use `border-t`, `divide-y` or space (TS1/TS2/STITCH, IMP:distill). **Never nest cards** (IMP:craft-floor, IMP:DET, I2C "anti-nested-box", IGM "clean layout"). DENSITY >7 → no card containers (TS).
- **Concentric radius**: inner = outer − padding (UIS:PB, SOFT `rounded-[calc(2rem-0.375rem)]`). One radius system per page; mixed only if documented (TS2 "Shape Consistency Lock"). RD: "Vary the radius: tighter on inner elements, softer on containers."
- Pin card CTAs to the bottom; align shared elements (titles, prices, feature-list start) across side-by-side cards (RD).
- Overlays escape containers: use `<dialog>`, the popover API, `position: fixed` or a portal, not absolute positioning inside `overflow:hidden` (IMP:operate, IMP:DET `clipped-overflow-container`).
- Z-index: a fixed documented scale, no `z-50`/`9999` spam (TS1/TS2/SOFT/RD/UIS:base).
- Horizontal scrollers: show **16–32px** of the next item (peek) (UIS:PB); fade edges with `mask-image` (UIS:PB). Keep a consistent inset on both sides (IMP:DET `edge-flush-cards`).
- Controls: about **12px** between neighbouring bordered controls (UIS:PB). Full-width buttons stay inside page margins (UIS:PB).
- Landing-page composition (TS2, marketing only):
  - Hero fits the first viewport: headline ≤2 lines, subtext ≤**20 words** and ≤4 lines, CTA visible; hero top padding ≤`pt-24`; ≤4 text elements.
  - Nav on one line at desktop, height **64–72px** (max 80).
  - ≥4 layout families across 8 sections; no layout family twice.
  - Zigzag cap: at most 2 consecutive image/text splits.
  - Bento has exactly N cells for N items. GPT: `grid-flow-dense`, 3–5 cards.
  - Logo wall below the hero, logos only.
  - Default section content: headline ≤8 words + sub ≤25 words + one visual or CTA.
  - >5 list items → a different component (2-col groups, cards, tabs, scroll-snap pills, carousel, marquee).
  - Quotes ≤3 lines.
  - One theme per page: no mid-page light/dark flips.
- AN:FD: plan layout with **ASCII wireframes** and state alignment (left / center / justified) explicitly.
- IMP:new-work: "Pace the scroll like a studio": vary density, scale, image, motion and quiet inside one grammar; a dense passage earns a quiet one; end on a real close. "The first viewport is a thesis, not a header"; memory test: "what would they describe an hour later?"

### 2.4 Hierarchy and cognitive load (IMP:critique)

- ≤**4** items per chunk; ≤**4** visible options per decision point (5–7 pushing it, 8+ overloaded). 1 primary action, 1–2 secondary, the rest in a menu. Top-level nav ≤**5** items.
- One primary element, 2–3 secondary, everything else muted ("visual noise floor" fix).
- 8-item cognitive-load checklist: single focus, chunking, grouping, visual hierarchy, one thing at a time, minimal choices, working memory, progressive disclosure. 0–1 failures low, 2–3 moderate, 4+ critical.
- 8 named violations: Wall of Options, Memory Bridge, Hidden Navigation, Jargon Barrier, Visual Noise Floor, Inconsistent Pattern, Multi-Task Demand, Context Switch.
- "Spend your boldness in one place… remove one accessory" (AN:FD). "Commit, then clarify… If every element got louder, the section got flatter" (IMP:bolder). "Skeleton test": strip the copy; the structure alone should still communicate (IMP:bolder).

### 2.5 Components

- Every interactive component: default, hover, focus, active, disabled, loading, error (+ success) (IMP:operate, IMP:polish, IMP:craft-floor).
- Use accessible primitives (Base UI, React Aria, Radix) for anything with keyboard or focus behaviour; don't hand-roll focus management; never mix primitive systems in one surface (UIS:base). One design system per project; never ship shadcn in its default state (TS2).
- Buttons:
  - Press feedback `scale(0.98)` / `translateY(1px)` (TS, RD, MIN). UIS:PB: scale ≈**0.96**.
  - CTA labels ≤3 words and no wrap at desktop (TS2); one label per intent across the page (TS2).
  - Not always "one filled + one ghost"; use text links and tertiary styles (RD).
  - MIN: solid `#111`, radius 4–6px, no shadow. SOFT: pill with a "button-in-button" trailing icon circle.
- Destructive actions: `AlertDialog` (UIS:base) and confirmation (UIS:PB), but prefer **undo over confirmation when recovery is safe**; name the action on both message and button, never Yes/No/OK (IMP:clarify).
- Modals are rarely the first choice: inline editing, slide-overs, progressive disclosure first (IMP:operate, IMP:craft-floor, RD).
- Loading: **structural skeletons matching the final layout**, not spinners (TS, STITCH, UIS:base, IMP:operate).
- Empty states: one clear next action (UIS:base). Structure: What will be here / Why it matters / How to get started / visual interest / contextual help. Types: first-use, user-cleared, no-results, no-permission, error (IMP:onboard).
- Forms: label above, helper optional, error below, `gap-2` (TS); never placeholder-as-label (TS, IMP:clarify, UIS:PB); no floating labels (STITCH); never block paste (UIS:base); errors next to the action (UIS:base).
- Tooltips: nearby tooltips show faster after the first opens (UIS:PB).
- Icon-only buttons need `aria-label` (UIS:base, UIS:a11y).
- Android: one FAB = one primary action, never stacked; snackbars for transient feedback; dialogs only for interrupting decisions (IMP:android).
- iOS: platform controls (Switch, segmented control, pickers, action sheets, context menus, swipe actions); grouped/inset lists for settings (IMP:ios).
- Glass: beyond `backdrop-blur`, add a 1px inner border `border-white/10` + `shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]` and a `prefers-reduced-transparency` solid fallback (TS2). Blur only on fixed/sticky elements, never on scrolling content (SOFT, TS2).

### 2.6 Motion and animation

**Purpose**
- Every animation must communicate one of: hierarchy/attention, storytelling/sequence, feedback, state change/continuity. "It looked cool" is invalid (TS2, IMP:animate, AN:FD).
- **One authored/orchestrated moment** beats scattered effects. "Fade-and-slide-up entrances on each section and hover transitions on every card are the generic default" (AN:FD, IMP:craft-floor, IMP:animate).
- Operate surfaces: motion conveys state only; **150–250ms**; no orchestrated page-load sequences (IMP:operate). Animate first-load entrances but keep repeated actions (tab switches) instant (UIS:PB).
- Motion removal test: removing an animation should lose meaning, not just decoration (IMP:animate, IMP:overdrive).

**Durations** (IMP:animate)

| Duration | Use |
|---|---|
| 100–150 ms | immediate feedback |
| 150–300 ms | routine state change |
| 300–500 ms | layout, overlay, view transition |
| 500–800 ms | deliberately authored focal entrance |

- Other duration values:
  - UIS:base: never exceed **200ms** for interaction feedback.
  - RD: 200–300ms for interactive elements.
  - HF:MD: single entry ≤~800ms; total stagger ≤**500ms**; exit ≈**75%** of entry.
  - HF:EASE default `duration 0.6, power3.out`.
  - SOFT: 700–800ms+ entries.
  - MIN: 600ms scroll entry, 200ms hover.
- **Exit faster than entry** (IMP:animate, HF:MD); matching enter/exit animations so a surface feels connected (UIS:PB).
- Stagger: ~**60–100ms** per item (TS2 `i*0.06`; TS1/STITCH 100ms; MIN 80ms; UIS:PB hero stagger ~100ms on first load only). Cap total delay (IMP:animate). HF: `items × stagger ≤ ~0.5s`. Don't reinterpret every scrolled section as a staggered list (IMP:animate).

**Easing**
- Default arrival: **`cubic-bezier(0.16, 1, 0.3, 1)`** (expo-out-like), cited by TS1/TS2/MIN and IMP:animate. SOFT: `cubic-bezier(0.32, 0.72, 0, 1)`. IMP:quieter: ease-out-quart. IMP:DET: "exponential easing (ease-out-quart/quint/expo)". HF house default `power3.out`.
- `ease-out` for entrances; `ease-in` feels slow when something opens (UIS:PB). `.out` entrances, `.in` exits, `.inOut` symmetric moves (HF:EASE).
- **No bounce or elastic by reflex** (IMP:DET `bounce-easing`, IMP:animate, IMP:quieter, HF:MD). HF: `back.out(1.4–1.7)` overshoot tolerable only in an explicitly playful register; N ≤2.
- Use `ease-out` instead of springs for toggles and toasts because springs can wobble (UIS:PB).
- Springs:
  - TS1/TS2/STITCH: Motion `type:"spring", stiffness:100, damping:20` as the default.
  - HF:EASE (best spec): the "iOS feel" is a damped spring's velocity curve, not a bounce. `dampingFraction` 1.0 = critically damped, no overshoot (default); 0.80–0.85 = iOS system register, ~1–1.5% overshoot, "felt not seen"; 0.60–0.70 playful, 5–10%; <0.55 never.
  - `response` 0.25–0.35s for chips/small UI, 0.35–0.5s standard, 0.5–0.7s weighted hero.
  - Overshooting curves go on transforms only, never on opacity or color.
- Never start an entrance from scale 0; start near **0.95** (UIS:PB). HF uses scale 0→1 for video pops; not UI-appropriate.
- Popovers animate from their trigger, with transform-origin at the trigger (UIS:PB). Menus close with a short fade and don't fly off-screen (UIS:PB). Label/icon changes cross-fade with opacity + scale + a short blur (UIS:PB).
- Similar elements share one ease + duration; never a unique pair per element (HF:MD).

**Choreography principles** (HF:MD, transferable)
- **Causal motion**: each move is launched by the last (click → squash → release → flight → impact → reveal); effects start *on* the causing frame.
- **Reactions scale with implied mass**: big elements rebound slower, small ones snap.
- **Stillness before climax**: **0.3–0.75s** pause between the action and its result.
- **No idle wobble**: breathe, float and glow-pulse loops read as "waiting". Also IMP:DET `pulsing-dot`, `blinking-cursor`, `marquee`.
- **Vector law** for transitions: same axis, same direction, matched speed, cut mid-motion. Pick one dominant direction and reserve others for meaning. This maps to view transitions and navigation push/pop.
- Motion blur only on snapping beats (slam, whip, spin), 1–3 per composition. Never on text meant to be read (HF:BLUR).
- Nudge curve for group repositioning: `power3.in` ramp (~10% distance / 20% time) → linear burst (~65% / 18%) → `power4.out` tail (~25% / 62%); tail ≥3× ramp (HF:R).

**Implementation and performance**
- Animate `transform` and `opacity` (all sources). Avoid layout properties: width, height, top, left, margin, padding. Use FLIP or `grid-template-rows` for height (IMP:DET `layout-transition`, UIS:motion).
- IMP explicitly widens the palette: blur, backdrop-filter, clip-path, mask and shadow are allowed when bounded and smooth (IMP:craft-floor, IMP:animate, IMP:optimize). UIS:motion: paint animation only on small isolated elements. Keep blur animation **≤8px**, one-shot only. Never animate blur or backdrop-filter on large surfaces. Use a solid modal backdrop instead of blur (UIS:PB).
- Never drive animation from scroll events or `scrollY`. Use CSS scroll/view timelines (`animation-timeline: view()`), IntersectionObserver, Motion `useScroll` or GSAP ScrollTrigger (TS2, SOFT, MIN, UIS:motion). Never `useState` for continuous values; use motion values (TS1/TS2).
- `will-change` only during active animation (UIS:base, UIS:motion, IMP:audit, TS2).
- Pause loops off-screen or hidden (UIS:base, IMP:animate).
- Content visible by default: failed scripts must not hide the page. IMP:DET `content-hidden-at-rest` is the "failed-reveal signature". Entrances animate from an already-visible default (IMP:craft-floor).
- Don't mix animation systems in one component tree: GSAP/Three vs Motion (TS); multiple layout-measuring systems (UIS:motion). Prefer CSS transitions (interruptible) for interactive open/close (UIS:PB).
- View Transitions for navigation-level changes, not interaction-heavy UI (UIS:motion). IMP:overdrive: View Transitions same-document in all browsers, cross-document not in Firefox; `@starting-style`; `@property`; scroll-driven animations with `@supports` fallback.
- Reduced motion: every web animation needs a `prefers-reduced-motion` path. "Reduced motion means fewer and gentler animations, not disabling all motion"; keep opacity and state feedback; flag a global `0.01ms` kill (IMP:animate, IMP:audit). TS2: mandatory above MOTION 3; loops, parallax, scroll-hijack and magnetic effects collapse to static. UIS:base: only "SHOULD respect". iOS Reduce Motion → crossfade instead of parallax or slides; Android "Remove animations" → crossfade or instant cut (IMP:ios/android).
- Marquee at most once per page (TS2) vs banned as an auto-scrolling tell (IMP:DET).

### 2.7 Interaction states and feedback

- Full cycle: loading, empty, error, success (TS, IMP:polish).
- Visibility of system status: confirm save/submit/delete; progress for multi-step flows; show the current location with active nav state and breadcrumbs (IMP:critique H1, RD "no indication of current page").
- Prevent double submission (disable while loading), optimistic updates with rollback, race handling (IMP:harden).
- Interrupted gestures on custom sliders and drag surfaces: handle `pointercancel`, `lostpointercapture`, release outside and `blur`; set `touch-action`; the next drag must still work (IMP:harden, IMP:audit, IMP:adapt).
- Hover is never required for function; use `@media (hover:hover)` and `(pointer:coarse)` (IMP:adapt). Hover-only interactions need keyboard equivalents (UIS:a11y).
- Nothing links to `#` (dead links); use `scroll-behavior: smooth` for anchors (RD).
- No `window.alert()` (RD).

### 2.8 Accessibility

- Contrast (WCAG AA): body/placeholder **4.5:1**, large text (18px+ / 14px bold+) **3:1**, controls, icons and focus indicators **3:1** (IMP:colorize, IMP:craft-floor, TS2). AAA 7:1 (IMP:audit). TS2 aims for AAA on body/hero in dark mode. Check hover, disabled, overlay and text-on-image states in both themes, and simulate color-vision deficiencies (IMP:colorize).
- Priority order (UIS:a11y): accessible names → keyboard access → focus & dialogs → semantics → forms/errors → announcements → contrast/states → media/motion.
- Specific rules (UIS:a11y):
  - no `tabindex > 0`
  - Escape closes overlays
  - dialogs trap focus, set initial focus and restore it to the trigger on close
  - native elements before ARIA
  - errors linked via `aria-describedby` + `aria-invalid`
  - `aria-live` for critical errors, `aria-busy` for loading
  - `aria-expanded` / `aria-controls` on disclosures
  - toasts are never the only channel for critical info
  - disabled submit explains why
  - decorative icons `aria-hidden`
  - no "click here" links
- `:focus-visible` rings (UIS:PB); never remove outlines without a replacement.
- Skip link, semantic landmarks, no skipped heading levels (RD, IMP:DET `skipped-heading`, UIS:a11y).
- Status never by color alone (UIS:PB, IMP:colorize, critique persona "Sam").
- Zoom to **200%**; text scaling; Windows high-contrast mode (IMP:harden).
- Touch targets: **44×44** CSS px / pt (TS/STITCH/IMP:audit/UIS:PB/iOS); Android **48×48dp** with ≥8dp spacing (IMP:android).
- Autoplay: no sound without consent; captions for speech (UIS:a11y, IMP:delight).

### 2.9 Responsive and adaptive (web)

- Mobile-first `min-width` queries; content-driven breakpoints; "three breakpoints usually suffice (640, 768, 1024)" (IMP:adapt). TS2: Tailwind `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`.
- Every multi-column layout declares its `<768px` fallback explicitly: single column, `w-full`, `px-4`, `py-8`. Remove rotations and overlaps on mobile because they cause touch conflicts (TS, SOFT).
- Test widths: 375, 390, 768, 1024, 1440 (STITCH). IMP captures `desktop.png` at **1440** and `mobile.png` at **390**, and checks first-viewport robustness at **1280–1600**, not just the comp size. Add the user's actual viewport when known.
- Safe areas: `viewport-fit=cover` + `env(safe-area-inset-*)`, e.g. `padding-bottom: max(1rem, env(safe-area-inset-bottom))` (IMP:adapt, UIS:base).
- Detect input, not screen: `pointer: fine/coarse`, `hover: hover/none` (IMP:adapt).
- Responsive images: `srcset` + `sizes`; `<picture>` for art direction; `aspect-ratio` to prevent CLS (IMP:adapt, UIS:PB).
- Tables become cards on mobile (`data-label`); `<details>` for progressive disclosure (IMP:adapt).
- Same information architecture across breakpoints; never hide core functionality on mobile (IMP:adapt).
- No horizontal scroll on mobile. GPT wraps the page in `overflow-x-hidden`, which is a smell: it masks bugs.
- Thumb zone: primary actions in the bottom half on mobile (critique persona "Casey").
- Email: 600px, single column, inline CSS, table layout. Print: remove nav, show URLs (IMP:adapt).

### 2.10 Mobile native (iOS/Android), mainly IMP:ios, android, adapt.native, audit.native

- **Slop test**: "Would a fluent iPhone user trust this app, or pause at off-spec controls?" The tell is "ported from a website". On Android the tell is "an iOS app wearing Android's skin".
- iOS:
  - Safe-area insets: nothing under the notch, Dynamic Island or home indicator.
  - Tab bar for 2–5 sections, never actions. Navigation stack for hierarchy; sheets for self-contained tasks.
  - **Never disable edge-swipe back.** Large titles collapse on scroll.
  - Dynamic Type text styles; SF Pro for the UI, brand face only in display moments.
  - Semantic system colors (label, secondaryLabel, systemBackground, separator, tint); one tint color.
  - System materials, no hand-rolled glass. SF Symbols only.
  - Sheet vs full-screen cover chosen deliberately; honor swipe-to-dismiss.
  - System push/sheet transitions. 44×44pt targets.
- Android:
  - M3 navigation bar with 3–5 destinations on compact width; rail or drawer on expanded. Never ship the phone bottom bar untouched on a tablet.
  - Predictive Back always works. Edge-to-edge with window insets (status bar, nav bar, cutout, IME).
  - Top app bar + a single FAB. Material type roles in `sp`.
  - Color roles (primary, on-primary, surface, surface-variant, secondary-container, outline, error). Dynamic Color on Android 12+ with a static fallback. Tonal elevation.
  - Material motion: container transform, shared axis, fade-through. 48dp targets with 8dp gaps.
- Adaptation:
  - "Restructure, don't stretch." Use size classes / window size classes, never device-model checks.
  - Master-detail on tablets. Multi-window is a size, not an edge case.
  - Foldables: posture and hinge. Don't lock orientation to dodge a layout bug.
  - Translation table: tab bar ↔ nav bar/rail; action sheet ↔ bottom sheet; SF Symbols ↔ Material Symbols; Dynamic Type ↔ sp; semantic colors ↔ color roles; push/sheet ↔ container transform/shared axis.
- Verify: `xcrun simctl io booted screenshot`, `xcrun simctl ui booted appearance dark`, a large Dynamic Type check; `adb exec-out screencap -p`, `adb shell cmd uimode night yes`, `adb shell settings put system font_scale 1.3`. Simulators give breadth; hardware is needed for gestures and performance.
- Native audit dimensions: Accessibility (VoiceOver/TalkBack), Performance (startup, virtualized lists such as FlatList/LazyColumn, 60/120Hz jank, recomposition), Appearance & Theming, **Platform Conformance** (critical), Adaptivity.
- From IGM (image-gen, but valid UX):
  - One primary focal point on the first screen; 1–3 short lines for the main statement; one clear next action.
  - No "website hero inside a phone frame". No box-in-box-in-box.
  - Onboarding: not 3 identical slides; no early rating prompts.
  - Don't mix iOS and Android patterns. "Readable beats clever. Readable beats dense."

### 2.11 Copy and UX writing

- Controls name their action: "Save changes", not "Submit". An action keeps its name through the flow: "Publish" button → "Published" toast (AN:FD, IMP:clarify, IMP:craft-floor).
- Errors state what failed, why (when known) and how to recover. Plain language, no codes as the primary message, not apologetic, never vague. Don't wipe the form (IMP:clarify, IMP:critique H9, AN:FD). Examples: "Email is missing @", not "Invalid input" (IMP:critique). "Connection failed. Please try again.", not "Oops!" (RD).
- No exclamation marks in success messages; active voice; sentence case (RD, AN:FD).
- Name things by what users understand ("notifications", not "webhook config") (AN:FD).
- Say each idea once; a heading that explains the state means the intro adds something new or goes (IMP:clarify). "Cut every sentence in half, then do it again" (IMP:distill).
- Loading text names the real operation; never invent progress (IMP:clarify, IMP:delight).
- i18n: complete translatable messages, not concatenated fragments; ICU plurals (`t('items', {count})`); budget **30–40%** expansion (German); logical CSS properties (`margin-inline-start`); `Intl.DateTimeFormat` / `NumberFormat` (IMP:harden, IMP:clarify).
- Tone: warmth is fine, but no jokes around loss, money, privacy or blocked work (IMP:clarify, IMP:delight).
- Copy self-audit: re-read every visible string; flag broken grammar, unclear referents, "cute-but-wrong wordplay" and "LLM trying to sound thoughtful". Replace with plain functional sentences; "AI-generated cute copy is worse than boring copy" (TS2).
- Content realism: no John Doe, Acme or Lorem ipsum; no fake-perfect numbers (`99.99%`); invented precise specs must be labeled mock (TS2, RD). IMP: author demonstration data at full fidelity **and label it synthetic**; commercial claims (prices, customers, benchmarks) are never invented.
- One copy register per page (TS2).

### 2.12 Imagery, illustration and assets

- Real imagery beats text-plus-gradient-blob heroes. Priority (TS2): image generation tool → real/stock (`picsum.photos/seed/{descriptive}/{w}/{h}`) → labeled placeholder slots plus an explicit list for the user. IMP: search for the subject's physical object, not the category; "one decisive photo beats five mediocre ones"; verify stock URLs resolve.
- No div-based fake screenshots or dashboards (TS2 "#1 LLM-design Tell"). No shape-assembled SVG illustrations at hero scale (IMP:DET). No many-vertex `clip-path` organic shapes; derive an alpha matte (IMP:DET, craft-floor). No rasters buried under near-opaque washes (IMP:DET `buried-raster`). No broken `<img>` (IMP:DET).
- Logo walls: real SVG logos (Simple Icons, devicon), both themes, no category labels under logos (TS2).
- Image hover scale/rotate is a tell (IMP:DET `image-hover-transform`) vs GPT: "every clickable card and image must react… `group-hover:scale-105`". Contradiction.
- Thin neutral outline on images, not a tinted ring (UIS:PB).
- Grain/noise only on a fixed `pointer-events-none` overlay, never on scrolling containers (TS, SOFT, MIN).
- Provenance: embed the generation prompt or origin in each shipped raster (IMP:new-work `embed-prompt`).
- Formats: WebP/AVIF, 80–85% quality, lazy-load below the fold, **never lazy-load above the fold** (IMP:optimize). Hero via `next/image priority` or preload (TS2).

### 2.13 Icons

- One family per project and one stroke weight (TS2, RD, IMP:craft-floor). Standardize `strokeWidth` at 1.5 or 2 (TS). Match stroke to text: **2px beside semibold, 1.5px beside regular** (UIS:PB). Outline icons by default, filled for the active state (UIS:PB).
- Libraries: TS2 prefers Phosphor, HugeIcons, Radix, Tabler and discourages Lucide. RD: Phosphor, Heroicons. MIN bans Lucide, Feather and standard Heroicons and uses Phosphor Bold/Fill or Radix. SOFT: Phosphor Light / Remix Line.
- Never hand-roll SVG icon paths (TS2) vs IMP allows "authored SVG" in one consistent stroke. Never emoji or Unicode glyphs as icons (IMP:craft-floor, TS emoji policy).
- Avoid cliché metaphors: rocket for launch, shield for security (RD).
- Native: SF Symbols / Material Symbols only (IMP:ios/android).
- Icon tile above heading (small rounded square) = the universal AI feature card (IMP:DET `icon-tile-stack`).

### 2.14 Dark mode

- Design both modes from the start for consumer pages; respect `prefers-color-scheme`; add a manual toggle when a mode would lose brand expression (TS2 §6.C/§8). IMP: light or dark is chosen from the use scene, not the category.
- Don't mechanically invert: design surface elevation and contrast explicitly per theme (IMP:colorize). Android: tonal elevation. Hierarchy parity: what pops in light pops in dark (TS2).
- One token strategy: Tailwind `dark:` or CSS variables (`--surface`, `--surface-elevated`, `--text-primary`, `--accent`) swapped under `[data-theme=dark]` / media (TS2).
- Theme lock per page (TS2). Test both modes (TS2, IMP:ios/android).
- Light text on dark: more leading, tracking and weight (IMP:typeset).
- Colored glow shadows on dark = AI tell (IMP:DET `dark-glow`, `radial-halo`, `radial-spotlight-glow`).
- Theme the "browser surfaces" too: `::selection`, `caret-color`, scrollbars, focus rings, `text-underline-offset`, tabular numerals (IMP:craft-floor: "the cheapest signal that a page was built rather than assembled").

### 2.15 Performance

- Core Web Vitals: **LCP <2.5s, INP <200ms, CLS <0.1** (TS2, IMP:optimize; INP replaced FID in March 2024).
- Measure before and after; optimize the biggest bottleneck; test on low-end Android and throttled networks (IMP:optimize).
- Batch DOM reads before writes (FLIP); `content-visibility: auto`; CSS `contain`; virtualize long lists (TanStack Virtual); code-split; dynamic imports (IMP:optimize, UIS:motion).
- No `useEffect` for render logic (UIS:base). Isolate motion in `'use client'` leaf components; memoize perpetual animations (TS).
- 60fps target; simplify below 50fps; lazy-init WebGL/WASM near the viewport; pause off-screen rendering; WebGPU → WebGL2 → CSS fallbacks (IMP:overdrive).
- Debounce search at 300ms, throttle scroll at 100ms (IMP:harden).

### 2.16 Hardening, edge cases and i18n (IMP:harden)

- Test with extreme inputs: 100+ character names, empty values, emoji, RTL, CJK, millions/billions, 1000+ items, 50+ options.
- Handle errors: offline, timeout, 400/401/403/404/429/500. Each has a specific UI: 401 → redirect to login, 429 → rate-limit message, and so on.
- Text overflow recipes: `truncate`, `line-clamp`, `overflow-wrap: break-word; hyphens:auto`, `min-width: 0` on flex/grid children.
- Permission states (view/edit/read-only with an explanation). One failing component must not block the whole UI.

### 2.17 Metadata and SEO (UIS:meta, RD)

- One metadata source per page; no duplicate title/description/canonical/robots.
- `og:url` = canonical; absolute OG image URLs; `twitter:card = summary_large_image`.
- `noindex` for staging and previews. `html lang`.
- JSON-LD only when it reflects rendered content; never invent ratings or prices.
- Favicon, apple-touch-icon, intentional `theme-color`. Custom 404 page, legal links, cookie consent where required (RD).

---

## 3. "AI slop" anti-pattern catalog (deduplicated)

Hard-banned means no brief earns it back; most others are "defaults, not bans; the brief can earn them".

### 3.1 Palette and surface

1. **Purple/violet/blue AI gradients; cyan-on-dark; neon accents** (TS1 "Lila ban", TS2, STITCH, RD, IGW, IGM, I2C, UIS:base "NEVER use purple or multicolor gradients", AN:WAB, IMP:DET `ai-color-palette`).
2. **Warm cream/beige + serif + terracotta/brass/oxblood + espresso text.** TS2 lists banned hexes:
   - Backgrounds: `#f5f1ea #f7f5f1 #fbf8f1 #efeae0 #ece6db #faf7f1 #e8dfcb`
   - Accents: `#b08947 #b6553a #9a2436 #9c6e2a #bc7c3a #7d5621`
   - Text: `#1a1714 #1a1814 #1b1814`
   Also AN:FD cluster 1 (`#F4F1EA` + `#D97757`), IMP:DET `cream-palette`, and IMP:new-work "your measured rendition prior" (cream, serif-italic, lamplight for warm/book/child subjects).
3. **Near-black + single acid-green/vermilion/neon accent with glowing edges** (AN:FD cluster 2, IMP:new-work).
4. **Glow effects**: colored zero-offset halo shadows, colored blurred shadows on dark, radial-gradient halos and "spotlight" glows behind heroes (IMP:DET `dark-glow`, `radial-halo`, `radial-spotlight-glow`; TS "NO neon/outer glows"; UIS:base "NEVER use glow effects as primary affordances"; UIS:PB no glow on primary buttons).
5. **Gradient text** on headings and metrics (IMP:DET, craft-floor; TS "no excessive gradient text"; IGW).
6. **Gradients as decoration in general** (UIS:base "NEVER use gradients unless explicitly requested"; MIN; AN:FD cluster 4 "gradient washes"). TS2 is more permissive: brand-appropriate gradients in bento cells.
7. **Glassmorphism as decoration** (IMP:craft-floor, IGM "random glass cards", IGW "stacked without reason", TS2 "generic glassmorphism on everything").
8. **Pure `#000`** (TS, RD, STITCH, SOFT, MIN, BRUT) vs **tinted near-black `#0B0B0B/#111`** as a tell (AN:FD cluster 5). Treat both as "default not decision".
9. **Gray text on colored backgrounds** (IMP:DET, README).
10. **Decorative grid-line backgrounds** (IMP:DET `codex-grid-background`), **repeating-gradient stripes** (`repeating-stripes-gradient`), crosshair/hairline decoration (TS2).
11. **Hairline border + wide diffuse shadow together** (IMP:DET `gpt-thin-border-wide-shadow`); **the same soft grey `rgba(0,0,0,.1)` shadow under every card** (AN:FD cluster 4); generic pure-black shadows (TS, RD, SOFT, MIN: shadows `<0.05` opacity).
12. **Hard offset shadows `4px 4px 0`** outside a genuinely neobrutalist world (IMP:craft-floor).
13. **Mid-page theme flips**: a random dark section in a light page (TS2, RD).

### 3.2 Typography

14. **Inter / Roboto / Arial / system defaults**, and the newer wave: Geist, Instrument Sans/Serif, Fraunces, Space Grotesk, Plus Jakarta, Mona Sans, Recoleta (see §2.1; IMP:DET `overused-font`).
15. **Italic serif display headline** as the hero (Fraunces, Recoleta, Playfair, Newsreader italic) (IMP:DET `italic-serif-display`); `<br>`-broken italic headlines (TS2); "creative brief = serif" (TS2).
16. **Eyebrows / kickers**: tiny uppercase tracked labels above headings, and hero pill chips.
    - Banned outright by IMP:craft-floor and IMP:DET `kicker-above-heading`, `hero-eyebrow-chip`.
    - AN:FD cluster 5 ("tracked-out ALL-CAPS eyebrow label above every heading").
    - TS2 caps them at max 1 per 3 sections and calls them "the #1 violated rule".
    - SOFT *prescribes* them. Contradiction.
17. **Numbered section labels** `01 / 02 / 03`, `00 / INDEX`, `001 · Capabilities` (IMP:DET `numbered-section-labels`, TS2, GPT "SECTION 01 / QUESTION 05", AN:FD unless genuinely a sequence). Also "Stage 1 / Step 1 / Phase 01" labels (TS2).
18. **All-caps labels everywhere** (AN:FD, RD, IGW "lazy all-caps").
19. **Single accent word** in italic, bold or color in a headline (AN:FD).
20. **Middle-dot meta strings** `A · B · C` (AN:FD, TS2 "max 1 per line"); **`WORD — fragment` labels** with a spaced em dash (AN:FD).
21. **Monospace as a costume** for "technical" small labels (IMP:craft-floor, AN:FD cluster 5).
22. **`→` appended to every link/button** (AN:FD).
23. **Oversized full-sentence H1s**; 4–6-line wrapped hero headings from narrow containers (IMP:DET, TS2, GPT).
24. **Flat type hierarchy (<1.25×)**, crushed tracking, tiny text <12px, wide-tracked body, justified text, all-caps body, tight leading (IMP:DET quality rules).
25. **Em-dash**: TS2 bans it completely ("#1 visual Tell"; also en-dash as a separator). IMP:DET is advisory only on saturation (≥8 em-dashes at ~1 per 500 chars). AN:FD flags only the `WORD — fragment` label pattern.

### 3.3 Layout and components

26. **Three equal feature cards** / identical icon + heading + text card grids as the page structure (TS1/TS2/STITCH/RD; IMP:craft-floor "cards are the lazy container"; AN:FD cluster 4 "SaaS-card kit").
27. **Icon tile stacked above heading** (IMP:DET).
28. **Nested cards / box-in-box-in-box / giant rounded wrapper sections** (IMP, I2C, IGM).
29. **Hero-metric template**: big number + small label + supporting stats + gradient accent (IMP:craft-floor, AN:FD, IGW "three identical stat columns (99% satisfaction…)").
30. **Centered hero over dark mesh** (TS2 anti-default; TS1 banned centered heroes when VARIANCE >4; IGW "endless centered sections"; AN:WAB "excessive centered layouts").
31. **Uniform radius on everything** (AN:FD, AN:WAB, RD).
32. **Side-tab accent border** (thick colored `border-left` >1px on cards, callouts, alerts), "the most recognizable tell" (IMP:DET `side-tab`, `border-accent-on-rounded`; craft-floor).
33. **Zigzag left/right image-text repetition**; same layout family repeated (TS2, IGW, I2C).
34. **Split-header**: big headline left + small explainer floating top-right (TS2).
35. **Bento with empty cells**; white-on-white text-only bento (TS2, GPT).
36. **Sparklines, progress rings and soft rounded rectangles standing in for content**; scoring bars with filled grey tracks (IMP:craft-floor, TS2).
37. **Modals for everything** (IMP, RD); accordion FAQ, 3-card testimonial carousel with dots, 3-tower pricing, sun/moon toggle, 4-column footer link farm, pill "New/Beta" badges, avatar circles only (RD's list of generic component patterns).
38. **Div-based fake product UI** (fake terminal, task list or dashboard); fake version footers `v0.6.2-rc.1`, "last sync 4s ago" (TS2).
39. **Decorative status dots** and pulsing dots (TS2, IMP:DET `pulsing-dot`); decorative blinking cursor (IMP:DET).
40. **Hero clutter**: version/BETA labels, trust micro-strips, pricing teasers, tagline under CTAs, stamp icons, pill tags, raw stats; decoration strip `BRAND. MOTION. SPATIAL.` at the hero bottom (TS2, GPT).
41. **Scroll cues** ("Scroll to explore", bouncing chevrons) (TS2, STITCH).
42. **Locale/time/weather strips** ("LIS 14:23 · 18°C"), photo-credit captions as decoration, pills overlaid on images, vertical rotated text (TS2).
43. **Border-t + border-b on every row** of long spec tables (TS2).
44. **Custom mouse cursors** (TS, STITCH).
45. **Floating blobs, orbs and mesh gradients everywhere** (IGW, IGM, I2C) vs SOFT prescribing "glowing purple/emerald orbs". Contradiction.

### 3.4 Motion

46. **Bounce/elastic easing** (IMP:DET, HF:MD "#1 instant turn-off", IMP:quieter).
47. **Identical fade-and-rise entrance on every section; hover lift on every card** (AN:FD, IMP:craft-floor, IMP:animate).
48. **Idle loops**: float, breathe, pulse, shimmer as "life" (HF:MD, IMP:DET `pulsing-dot`) vs TS1/STITCH "every card must have an infinite loop". Contradiction; TS2 walks this back ("Not every card needs an infinite loop").
49. **Auto-scrolling marquees** (IMP:DET) / more than one per page (TS2).
50. **Image hover zoom** (IMP:DET) vs GPT mandating it.
51. **Layout-property animation**; `window.addEventListener('scroll')` (all sources).
52. **Content hidden at rest** behind reveal scripts (IMP:DET).
53. **Linear or default `ease-in-out`** (SOFT) vs UIS:base "NEVER introduce custom easing curves".

### 3.5 Copy and content

54. **Buzzwords**: Elevate, Seamless, Unleash, Next-Gen, Revolutionize, Game-changer, Delve, Tapestry, "In the world of…" (TS, RD, MIN, STITCH, IGW, IGM, I2C); streamline, empower, supercharge, world-class, enterprise-grade, cutting-edge (IMP:DET `marketing-buzzword`); "unlock your potential", "transform your day" (IGM).
55. **Aphoristic cadence**: "X. No Y." / "Not a feature. A platform." in 3+ sections (IMP:DET `aphoristic-cadence`). **"Theater" framing** ("security theater") (IMP:DET `theater-slop-phrase`).
56. **Performative craftsman labels**: "Quietly trusted by", "From the field", "Field notes", "Currently on the bench", mock-humble lines, micro-meta sentences under eyebrows (TS2).
57. **Generic names and brands**: John Doe, Jane Smith, Sarah Chan, Acme, Nexus, SmartFlow, Cloudly, NovaCore, Flowbit, Quantix, VeloPay (TS, IGM, I2C, IGW).
58. **Fake-perfect or fake-precise numbers** (`99.99%`, `50%`, `1234567`, invented specs `5.8 mm`) (TS, RD). TS suggests "organic" numbers such as `47.2%`, which is itself fabrication; IMP's "label synthetic" is better (§5).
59. **Duplicate CTA intent** ("Get in touch" + "Let's talk") (TS2); repeated container text (IMP:DET).
60. **Lorem ipsum, identical blog dates, same avatar reused, "Oops!" errors, exclamation marks on success** (RD).
61. **Emoji in UI** (TS1 hard ban; TS2 discouraged; MIN; GPT; IMP "emoji standing in for an icon system").
62. **Pseudo-enterprise jargon labels**: "00 orchestration layer", runtime markers, fake system markers (I2C, IGM).

### 3.6 Code smells that read as slop

63. Div soup, inline styles mixed with classes, hardcoded pixel widths, `z-9999`, commented-out code, import hallucinations, missing meta, `alt="image"` (RD). Placeholder comments such as `// ...` or `// rest of code` (OUT).

---

## 4. Prescribed workflows and processes

### 4.1 Greenfield / new surface

- **TS2**:
  1. Brief inference with a one-line Design Read (ask ≤1 question).
  2. Set dials (inference table/presets).
  3. Brief → design-system map (official package, or honest aesthetic).
  4. Build with the default stack.
  5. Run the ~60-item Pre-Flight.
- **AN:FD** (lightweight, strong):
  1. Identify subject, audience and primary job (propose them if absent).
  2. Plan: 4–6 named hex values, type roles, ASCII wireframe layout concepts with alignment, principles.
  3. Review the plan against the brief: "if any part reads like the generic default you would produce for any similar page… revise, say what you changed and why".
  4. Build.
  5. Self-critique with screenshots; the "remove one accessory" pass. Keep notes of what you tried.
- **IMP** (heavyweight):
  1. `context` (PRODUCT.md / DESIGN.md) → init if PRODUCT.md is missing.
  2. new-work §1: decide what's already true (redesign / established / incomplete / none).
  3. §2: 2–3 targeted questions by mode.
  4. §3: amount of invention. Extend = inherit. New surface in an established world = 5–7 structures, dealt 3. New world = mechanism sentence → 7 cultural artifacts spanning ≥3 material families → directions → dice roll + challengers → present with the "standing exit".
  5. §4: commit (color strategy, faces, calibration self-check).
  6. §5: Direction contract (THESIS / OWN-WORLD / STORY / FIRST VIEWPORT / FORM / FINISH) in the surface brief.
  7. §6: build comp-led (gated phases) or code-led.
  8. §7: one batched screenshot round → fix batch → one confirm round → detector → fresh-context finish reviewer → disposition → documenter writes DESIGN.md.
- **IMP:shape**: discovery interview (2–3 questions per round, 1–2 rounds) → resolve direction → write a brief (job/audience, outcome/proof, direction, scope, states/ranges, interaction/layout, constraints) → confirm and **stop, no code**.
- **HF:motion-graphics**: init → plan (search or not; category) → source assets → design around assets → build reuse-first → verify (lint/check/snapshots) → approve → render. Asset-first: "decide the asset strategy and source real material *before* designing the shot."
- **canvas-design**: philosophy manifesto → deduce a subtle conceptual reference → canvas → a refinement pass that removes rather than adds.
- **GPT**: `<design_plan>` with simulated RNG, AIDA check (Nav, Attention hero, Interest bento, Desire GSAP, Action footer), hero math, bento density proof, label sweep.

### 4.2 Redesign / existing projects

- **RD**:
  1. Scan (framework, styling method).
  2. Diagnose with the audit list (typography, color, layout, states, content, components, icons, code quality, strategic omissions).
  3. Fix in priority order: font swap → palette cleanup → hover/active states → layout/spacing → replace generic components → loading/empty/error states → polish type scale.
  Rules: work with the existing stack, don't break functionality, check dependencies, small reviewable changes.
- **TS2 §11**:
  1. Detect the mode (Greenfield / Preserve / Overhaul; ask once if ambiguous).
  2. Audit before touching: brand tokens, IA, content blocks, patterns to preserve or retire, a dial reading of the existing site, the SEO baseline ("SEO migration is the #1 redesign risk").
  3. Preservation rules: IA, slugs, anchor IDs, nav labels, copy voice, a11y wins, analytics events.
  4. Levers in order: typography → spacing → color → motion → hero recomposition → block replacement. "Targeted evolution (Levers 1-4) ~70% of value at ~40% of risk."
  5. Never change silently: URLs, nav labels, form field names/order, logo, legal copy.
- **IMP**: "Refinement preserves; redesign replaces… Never split the difference into polish on the discarded look."

### 4.3 Evaluate → fix → polish loop (IMP)

- `critique`:
  - Two isolated subagents: A = design review (specificity verdict, Nielsen 0–4 ×10, cognitive load, emotional journey, personas); B = detector + browser overlay.
  - Synthesize both, noting agreement and false positives.
  - Report: specificity verdict, health score, what works, 3–5 P0–P3 priority issues with suggested command, persona red flags, questions.
  - Persist a snapshot and the trend line; ask 2–4 targeted questions **last**.
- `audit`: 5 technical dimensions (a11y, perf, theming, responsive, implementation integrity) → /20 score → P0–P3 findings → command mapping → end with `polish`. Documents only; no fixes.
- Then the targeted commands (typeset, layout, colorize, animate, clarify, harden, adapt, optimize, distill, quieter, bolder, delight, onboard). Each follows the same shape:
  1. Visitor-mode note.
  2. **Two isolated assessments** (judgement first, then the mechanical `detect --scope`) so the detector doesn't anchor judgement.
  3. State the thesis/system.
  4. Apply.
  5. Verify each item with rendered or source evidence ("Do not substitute a bare 'yes'").
  6. Hand off to `polish`.
- `polish`: establish the system; classify drift (missing token / one-off / conceptual mismatch / local defect); triage order (broken tasks → missing states → flow/hierarchy/responsive drift → visual/motion → code cleanup); walk the path with mouse, keyboard and touch; close the critique snapshot.

### 4.4 Audit-only, handoff-based (UIS:improve)

1. Select one surface.
2. Reconstruct the local system (Design language block).
3. Prove findings (contract, runtime, correction).
4. Vet by trying to falsify each finding.
5. Report ≤3 findings in a table plus "Improve first".
6. Ask which to plan.
7. Write self-contained plans (template: evidence chain, design decision, reuse, changes with Change/Preserve/Verify, scope inherit/verify/exclude, validation, stop conditions, doc updates).

This read-only discipline is a strong pattern for a "design reviewer" skill.

### 4.5 DESIGN.md creation (three variants)

- **STITCH**: evocative "Visual Theme & Atmosphere" + colors (Name + Hex + Role) + typography + components + layout + motion + anti-patterns. Opinionated; bakes taste rules in.
- **IMP:document**: Google DESIGN.md spec. YAML frontmatter tokens (`colors`, `typography{fontFamily,fontSize,fontWeight,lineHeight,letterSpacing}`, `rounded`, `spacing`, `components` with ≤8 props, `{path.to.token}` refs) + 8 sections in order: Overview (Creative North Star), Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts. Supports "Named Rules" ("The One Voice Rule…"). Scan mode vs seed mode; never silently overwrite; a sidecar `.impeccable/design.json` for shadows and motion.
- **UIS:dmd**: evidence-gated version of the same spec. Repo vs URL mode; invent no tokens; each prose sentence must change an implementation choice; validate with `npx @google/design.md lint` + `export`; include a Don't only if a source states an explicit prohibition.

### 4.6 Motion build gate (HF:MD)

Vector ledger (`ledger.json`) → stamp seams → sustained-motion route per phase (staged reveals / camera with intent / sequenced UI life / animated sequences / cursor-led action) → carriers and causes → build → verify with `seam-gate.mjs` (exit 0). "Pause at any second — something meaningful must be mid-flight." Edits re-open the gate.

---

## 5. Disagreements, weak rules and critical assessment

### 5.1 Direct contradictions

| Topic | Position A | Position B | Our resolution |
|---|---|---|---|
| Geist | TS/STITCH/GPT *recommend* Geist, Satoshi, Outfit, Cabinet Grotesk | IMP:DET lists Geist as overused; IMP:new-work lists Outfit | Font blocklists go stale fast; each "alternative" becomes the next monoculture. Teach the *method* (choose from the subject's world, justify, rotate) and keep a small, dated "currently saturated" list. |
| Fraunces / Instrument Serif | STITCH recommends them | TS2 bans them as LLM favorites; IMP:DET flags them | Same as above; STITCH is outdated relative to TS2. |
| Eyebrows | SOFT mandates pill eyebrows above H1/H2 | TS2 max 1 per 3 sections; IMP bans outright; AN:FD calls them a tell | Default: none. Allow one when it carries real information (breadcrumb, category that isn't already obvious). IMP's absolute ban is too strong for docs, blogs, taxonomy. |
| Perpetual motion | TS1/STITCH: every card has an infinite loop | HF:MD bans idle wobble; IMP:DET flags pulsing dots and marquees; TS2 reverses itself | Loops only for truly live data; pause off-screen; reduced-motion off. |
| Animation by default | UIS:base "NEVER add animation unless explicitly requested" | TS2 "motion claimed, motion shown"; SOFT "elements never appear statically" | Depends on mode: Operate → feedback/state motion only; Persuade → one authored moment. Neither extreme. |
| Easing | UIS:base "NEVER introduce custom easing curves"; UIS:PB "ease-out not springs for toggles" | SOFT bans default `ease-in-out` and requires custom beziers; TS springs everywhere | Ship 3–4 named motion tokens (e.g. `--ease-out-expo: cubic-bezier(0.16,1,0.3,1)`, standard durations) plus a critically damped spring for drags and gestures. |
| Letter-spacing | UIS:base never touch tracking | TS `tracking-tighter` display; IMP floor −0.04em | Tighten display optically (−0.01 to −0.04em), widen small caps; never body. |
| Interaction feedback duration | UIS:base ≤200ms | RD 200–300ms; IMP 100–150ms immediate, 150–300 state | Feedback 100–200ms; state change ≤300ms. |
| Near-black | TS/RD: use off-black `#0a0a0a`/`#111` instead of `#000` | AN:FD: `#0B0B0B/#111` is itself a tell | The real rule: black is a *choice*; derive dark neutrals from the palette hue. |
| Image hover zoom | GPT mandatory `group-hover:scale-105` | IMP:DET tell | Default off; only where it signals clickability in a gallery. |
| Emphasis word | TS2: italic/bold same family is "the right move" | AN:FD: single-word accent is a tell | Rare; only when semantic. |
| Radius | TS2: one radius system; RD: vary radius inner vs outer | UIS:PB concentric formula | Compatible: one *scale*, concentric nesting. |
| Centered hero | TS1 banned at VARIANCE >4 | TS2 allows for editorial/manifesto; GPT "Cinematic Center (Highly Preferred)" | Centering is a tool; judge by content. |
| Cards | RD "no border + shadow cards" | MIN "cards must have exactly `1px solid #EAEAEA`" | Aesthetic-specific; not universal rules. |
| Em-dash | TS2 zero tolerance | IMP advisory on saturation only | Advisory in UI copy. A total ban is overfitting to 2025-era LLM cadence; legitimate typography uses en-dashes for ranges. |
| Serif | TS2: serif very discouraged, sans display default | MIN: serif for hero headings; AN:FD: choose from subject | Choose from the subject world; no blanket rule. |
| Fake data | TS: use "organic messy" numbers (`47.2%`) | IMP: label demo data synthetic, never invent claims | IMP is right: TS's advice hides fabrication. |

### 5.2 Weak or outdated rules

- **Lucide "discouraged"** (TS2, MIN, RD): taste-based and churns quickly. Better: one family, consistent stroke, matched to type weight.
- **"NEVER hand-roll SVG icons"** (TS2) conflicts with brand-specific icon needs; IMP's "authored SVG in one consistent stroke" is better.
- **IMP:adapt** has older generic advice: "Mobile: 320–767px", "hamburger menu", "3G", "Bottom navigation for mobile" on the web. The native references are much better than the web adapt guide.
- **TS1 "Python RNG"** (GPT) is theater. The model can't run RNG by simulating it. IMP's real `concept-seed` script is the working version.
- **Dials as 1–10 integers**: coarse and model-interpreted. They lack observable definitions for most values. TS2's inference table and presets help; IMP's live CSS-var params (`--p-density` 0.6–1.4) are *measurable*. IGM's 19 dials are noise.
- **"$150k agency" persona prompts** (SOFT, GPT, canvas-design's "museum masterpiece… user ALREADY said it isn't perfect enough"): manipulative framing with little effect on quality compared with concrete rules.
- **Stack lock-in**: TS mandates Tailwind v4 + Motion + Next RSC; UIS:base mandates Tailwind + `cn` + Base UI; AN:WAB Tailwind 3.4.1. Our repo must be stack-agnostic, with stack-specific appendices.
- **Picsum placeholders**: fine for prototypes, but real products need real assets. Picsum images are random, not subject-matched, which undermines "imagery from the subject's world".
- **"Organic, messy" fake numbers** (TS): see 5.1.
- **`overflow-x-hidden` on `<main>`** (GPT): hides the real overflow bug and breaks `position: sticky`.
- **theme-factory**: DejaVu Sans fonts and 4-color themes without contrast or role mapping are low quality; only the pattern is worth reusing.
- **UIS:base "SHOULD respect prefers-reduced-motion"** is too weak; it must be a MUST.
- **Contrast**: every source uses WCAG 2 ratios. None mentions APCA or WCAG 3 drafts, or the fact that WCAG 2 ratios misjudge dark-mode pairs. Worth a note, keeping WCAG 2.2 AA as the compliance floor. None cites WCAG 2.2's new criteria (2.4.11 Focus Not Obscured, 2.5.8 Target Size minimum 24×24 CSS px, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication). The 44px guidance goes beyond AA; 24px is the AA minimum.
- **Liquid Glass**: TS2 treats it only as a web approximation. None covers iOS 26 Liquid Glass adoption guidance in native apps (materials in bars and controls, avoid stacking glass on glass, content-first) or Android's Material 3 Expressive (2025).
- **Detector-driven taste** (IMP): 61 rules are great for mechanical checks, but "slop" rules ossify. The rule list shows how quickly consensus shifts: Geist moved from recommended to overused within a year.

### 5.3 What is excellent and should be kept

- IMP craft-floor (Verify / Refuse), including the "browser surfaces" insight (selection, caret, scrollbar, focus ring, underline offset, tabular numerals).
- IMP visitor modes (Persuade / Operate / Read / Experience), chosen per surface.
- IMP color strategies (Restrained / Committed / Full / Drenched) and "pick dark/light from the physical use scene".
- IMP bounded verification (two rounds max; fresh-context reviewer; disposition vocabulary).
- IMP critique rubric (Nielsen 0–4, cognitive load ≤4, personas, P0–P3) and audit /20.
- IMP ios.md / android.md / adapt.native translation table.
- AN:FD five AI clusters, the two-pass plan → self-review → build process, and "spend boldness in one place".
- TS2 brief inference, design-system map with honesty rule, redesign protocol ("what never changes silently"), landing-page composition rules, copy self-audit.
- UIS rule format (MUST/SHOULD/NEVER + priority table + "quote the line / why / fix" review output + tool boundaries) and the improve-ui 3-proof gate.
- HF spring table (dampingFraction/response), causal motion, stillness before climax, no idle wobble, timing intents, blur restraint.

---

## 6. Recommendations for our repository

### 6.1 Structure and format

1. **Router + references, not monoliths.** Model on IMP and hyperframes: a short SKILL.md (<~300 lines) with a routing table, and `references/*.md` loaded on demand. Keep each reference single-purpose (typography, color, motion…) and under ~10 KB.
2. **Frontmatter**: `name`, a **trigger-rich description** ("Use when… Covers… Not for…") in the ui-skills/impeccable style, `license`, `metadata.version`. Optionally `argument-hint` for sub-commands.
3. **Rule syntax**: MUST / SHOULD / NEVER bullets with a priority table and a numeric value wherever one exists. Each rule gets a one-line rationale and ideally a detection hint (CSS signature or regex) so it can become a lint check later.
4. **Review output contract** for every audit skill: `violation (quoted line) → why (1 sentence) → fix`, P0–P3 severity, and a score table.
5. **Context files**: adopt `PRODUCT.md` (product truth) + `DESIGN.md` (Google spec: YAML tokens + 8 sections) with evidence-gated generation (UIS:dmd rules), plus validation via `npx @google/design.md lint`.
6. **Parameters**: replace the 1–10 dials with *mode* (Persuade/Operate/Read/Experience) + *color strategy* + *density*, *motion* and *expression* levels, each with **observable definitions** (spacing multipliers, allowed motion types, duration ceilings), and expose them as CSS custom properties (`--density`, `--motion-scale`).
7. **Stack-agnostic core, stack appendices**: plain CSS / tokens first, then appendices for Tailwind v4, React/Motion, SwiftUI, Jetpack Compose, Flutter, React Native.

### 6.2 Proposed design skill set (design half of the repo)

- `design-foundations`: tokens, spacing scale (4px base), type scale (1.125–1.25 for product, larger for marketing), color roles in OKLCH, radius/elevation, dark mode, the "browser surfaces" craft floor.
- `web-design-2026`: modern CSS (container queries, `:has()`, `@starting-style`, view transitions, scroll-driven animations, `text-wrap: balance/pretty`, `dvh/svh/lvh`, `color-mix()`, `light-dark()`, relative color syntax, anchor positioning, popover API, `<dialog>`, `field-sizing`, `interpolate-size`), with a baseline-support note per feature. None of the refs cover `light-dark()`, anchor positioning or `interpolate-size`, which are gaps.
- `mobile-design-ios`: HIG, iOS 26 Liquid Glass adoption, Dynamic Type sizes table (Body 17pt, Caption 12pt, Large Title 34pt), SF Symbols rendering modes, sheets and detents, haptics (UIImpactFeedbackGenerator usage rules, which no ref covers), widgets and Live Activities, App Intents surfaces.
- `mobile-design-android`: Material 3 / M3 Expressive, window size classes (compact <600dp, medium 600–840, expanded ≥840), predictive back, edge-to-edge (mandatory on target SDK 35+), dynamic color, type scale roles, haptic constants.
- `cross-platform-mobile`: React Native / Flutter / KMP; the translation table; when to go platform-adaptive vs brand-uniform.
- `motion-design`: purpose taxonomy, duration table, easing tokens, spring table (HF), causal/continuity principles, reduced-motion strategy (reduce, don't kill), performance rules (UIS:motion), per-platform motion (UIKit/SwiftUI springs, Compose `spring()`, Material motion tokens).
- `ux-writing`: IMP:clarify + AN:FD writing section + i18n rules.
- `accessibility`: WCAG 2.2 AA (including 2.5.8 24px target minimum, focus not obscured, accessible authentication), platform a11y (VoiceOver/TalkBack labels, traits, rotor), plus an APCA note.
- `design-review` / `ui-audit`: Nielsen scoring + cognitive load + personas + P0–P3 + audit /20, with the improve-ui proof gate for code-level findings and bounded rounds.
- `anti-slop`: the deduplicated catalog from §3, presented as **"defaults, not decisions"** with a **dated** saturated-font/palette list and a self-check ("could someone guess this aesthetic from the category alone?"). Include AN:FD's five clusters and a small portable lint (regex/CSS signatures) inspired by IMP:DET.
- `redesign`: TS2 §11 protocol (modes, audit-first, preserve list, levers, what never changes silently) + RD fix priority + the SEO baseline.
- `design-md`: DESIGN.md creation and maintenance (merge IMP:document and UIS:dmd).

### 6.3 Gaps none of the refs cover (our differentiators)

1. **Architecture ↔ design linkage**: design tokens as code (W3C DTCG format, Style Dictionary), token pipelines to web, iOS and Android, component API design, design-system versioning, Storybook/visual regression, how UI state machines map to the loading/empty/error states. No design repo connects to software architecture.
2. **Native mobile beyond conformance**: haptics, gestures (thresholds, velocity), keyboard avoidance, offline-first UI states, push notification UX, permission-priming patterns, app-store screenshot design, widgets, deep links, platform settings (Increase Contrast, Bold Text, Reduce Transparency).
3. **Data-dense product UI**: tables, filters, dashboards. TS explicitly punts, IMP:operate is thin, and dashboards are where most real software lives. Cover table density, column alignment (numbers right-aligned, tabular), sticky headers, and data-viz color with CVD-safe palettes.
4. **Forms at depth**: validation timing (on blur vs on submit), autocomplete tokens (`autocomplete="one-time-code"`, `email`, `street-address`), `inputmode`, `enterkeyhint`, passkeys and accessible authentication, multi-step wizards.
5. **AI-product UI patterns (2026)**: streaming text, tool-call progress, citations, uncertainty display, stop/regenerate controls, and "agent is working" status without fake theater. Relevant to IMP's "blinking cursor" and "pulsing dot" rules: show *real* progress.
6. **Internationalization of layout**: RTL mirroring rules (icons that do and don't flip), CJK line breaking (`word-break: auto-phrase`), locale-aware number formatting in tables.
7. **Performance budgets per platform**: JS KB budgets, image budgets, font budgets, mobile startup targets (cold start), 120Hz ProMotion considerations.
8. **Verification tooling that is portable**: Playwright screenshot recipes (1440/390 plus dark mode plus 200% zoom), axe-core, Lighthouse CI, simulator and emulator capture commands (from IMP), and a small anti-slop grep script. All stack-agnostic, with no proprietary binary.
9. **Evidence discipline**: adopt IMP's "label synthetic demo data; never invent claims" and UIS's "no finding without contract + runtime + correction" as cross-cutting rules.
10. **Dated content**: every saturated-trend list carries an "as of 2026-Q3" stamp and a refresh process, because slop lists age quickly (the Geist example shows it).

### 6.4 Canonical values to adopt (starting defaults, with sources)

- Spacing: 4px base; scale 4/8/12/16/24/32/48/64/96/128.
- Type: body 16px (web) / 17pt (iOS) / 16sp (Android Body Large); line-height 1.5–1.6 body, 1.1–1.2 headings; measure 60–75ch; display tracking −0.01 to −0.04em; product ratio 1.2, marketing 1.25–1.333 with a `clamp()` display.
- Contrast: 4.5 / 3 / 3 (text / large / non-text); target sizes 24px AA minimum, 44pt iOS, 48dp Android, 44px recommended on the web.
- Motion: 100–150ms feedback, 150–300ms state, 300–500ms overlays/navigation, ≤800ms authored entrance; exit ≈ 70–75% of entry; stagger 50–100ms, total ≤500ms; ease-out `cubic-bezier(0.16,1,0.3,1)` for arrivals, `cubic-bezier(0.7,0,0.84,0)`-style ease-in for exits; spring ζ=1 (UI default) or 0.8–0.85 (iOS feel), response 0.3–0.5s; blur animation ≤8px; no bounce/elastic by default.
- Color: 1 accent; accent ≤10% of the surface in Restrained, 30–60% in Committed; OKLCH ramps; semantic tokens; dark themes designed, not inverted.
- CWV: LCP <2.5s, INP <200ms, CLS <0.1.
- Cognitive load: ≤4 options per decision point, ≤5 top-level nav items, 1 primary action per view.
