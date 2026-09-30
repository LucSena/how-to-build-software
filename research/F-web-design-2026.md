# F: Web design, frontend UI quality and design systems in 2026: research notes

Compiled 2026-09-30 for an open-source Agent Skills repo (SKILL.md, English).
Method: WebSearch (the session's search budget ran out partway through, so later sections lean on cloned primary sources) plus shallow git clones in `scratchpad/refs6/`:
- `vercel-labs/web-interface-guidelines` (README + AGENTS.md)
- `design-tokens/community-group` (DTCG 2025.10 technical reports: format, color, resolver)
- `google-labs-code/design.md` (DESIGN.md spec, alpha, last commit 2026-07-27)
- `anthropics/skills` + `anthropics/claude-code` (`frontend-design` SKILL.md, the current version)
- `samber/cc-skills` (`frontend-design-deslop`: slop checklist, typography, OKLCH, dark mode, motion, components references)
- `GoogleChrome/modern-web-guidance` (last commit 2026-09-28; per-feature Baseline dates, which are the most reliable status data here)
- `shadcn-ui/ui` (v4 theming docs), `tailwindlabs/tailwindcss.com` (v4 theme docs; v4.3 blog dated 2026-05-08), `radix-ui/website` (Radix Colors scale docs), `w3c/wcag` (2.2 SC text), `GoogleChrome/web-vitals` README (thresholds)

Confidence tags: **[P]** = checked against a primary source or the spec text in a clone. **[S]** = secondary source (blog or search summary). **[K]** = established practitioner knowledge that I didn't re-verify this session. Skill authors should re-verify anything marked [S] or [K] before stating it as fact.

---

## 0. TL;DR for skill authors

1. **Generic is the failure mode now, not ugly.** The model tends to output the statistical median: Inter, indigo/purple gradients, a centered hero with three icon cards, rounded-2xl everywhere, the same soft grey shadow, emoji icons, and fade-up animations on every section. A skill has to force a *decision* before any code gets written: a brief, then tokens, then a review against defaults, then the build. Anthropic's current `frontend-design` skill does exactly this with two passes.
2. **The second-order slop has moved.** Cream (#F4F1EA) plus a serif display plus a terracotta accent (#D97757), near-black with an acid-green accent, broadsheet hairlines with zero radius, Geist / Space Grotesk / Instrument Serif, tracked ALL-CAPS eyebrows, "A · B · C" meta strings, and "→" on every link are all now tells too [P: anthropics/skills frontend-design].
3. **Numbers still matter.** Body text 16px, line-height 1.5–1.7, measure 45–75ch (66 ideal), a 4px base unit, type ratio 1.2–1.25 for UI and 1.333 or more for marketing, targets ≥24px (44px on touch), text contrast 4.5:1 and non-text 3:1, LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at p75.
4. **Tokens:** the DTCG format reached its **first stable version, 2025.10**, on 2025-10-28 [P]. Use primitive → semantic → component tiers. In Tailwind v4, tokens live in CSS `@theme` (and `@theme inline` for references). shadcn uses `background`/`foreground` pairs in OKLCH. For agent-readable design systems, **DESIGN.md** (Google Stitch, alpha, Apache-2.0) has YAML tokens plus prose [P].
5. **Platform, 2026:** Baseline now covers container queries, `:has()`, cascade layers, subgrid, same-document View Transitions (2025-10-14), popover (2025-01-27), `@starting-style`, `light-dark()`, relative colors, `contrast-color()` (2026-04-10), `field-sizing` (2026-06-16), container style queries (2026-05-19), and `sibling-index()` (2026-08-18) [P]. Anchor positioning shipped in all engines by Firefox 147 (Jan 2026) [S]. Scroll-driven animations are still missing from Firefox stable. Cross-document View Transitions, `interpolate-size`, and customizable `<select>` are still limited.

---

## 1. 2026 taste: what separates premium product UI

### 1.1 The "Linear / Vercel / Stripe / Raycast / Attio / Arc" family: what it actually is

Pulled from several 2026 analyses [S: studiomaydit.com, mantlr.com, stackademic "one color decision"] plus direct observation [K]:

- **Every visible element shows a decision.** Premium reads as *considered*: typography, microstates, motion, empty states, hairlines, focus rings, and loading states are all designed. Crowding is the amateur tell. Confidence shows as leaving things out.
- **A near-greyscale base with one owned accent.** Linear owns purple, Raycast owns red-orange, Cursor owns cyan. Everything else (charts, avatars, text) stays in restrained neutrals, and that restraint is what lets the accent read as the brand. The 60/30/10 rule is a useful heuristic (60 neutral, 30 brand/secondary, 10 accent).
- **Dark-first for dev tools, done with lightness steps** (see 1.8). Marketing pages often ship light and dark with the same token set.
- **Speed is part of the aesthetic.** Linear's motion is sub-200ms and only communicates something. Optimistic UI, instant navigation, keyboard-first flows (Cmd/Ctrl-K palettes, single-key shortcuts), and URL-as-state are part of the "feel".
- **Type is the brand.** Vercel commissioned Geist, Stripe uses custom Söhne-style grotesks, Linear uses Inter Display plus custom tuning. Tabular numerals, `ss`/`cv` stylistic sets, and tuned tracking at display sizes all count.
- **Crafted microstates.** Hover is a small lightness step, not a colour change. `:active` scales to about 0.97–0.98. Focus rings are crisp and offset. Tooltips delay only the first one in a group, and the rest open with no delay [P: Vercel guidelines].
- **Hairline borders plus layered shadows.** Semi-transparent 1px borders (e.g. `oklch(1 0 0 / 8%)` on dark) combine with two or more shadow layers (ambient + direct). Hue-tinted borders and shadows on coloured surfaces [P: Vercel guidelines "Design" section].
- **Linear's theme engine** [S: linear.app/now "How we redesigned the Linear UI (part II)"]: they moved from HSL to **LCH**, and instead of 98 hand-set variables per theme a theme is defined by **3 inputs: base colour, accent colour, contrast**. More than 100 variables are derived in LCH. The contrast variable auto-generates high-contrast accessibility themes. This is the canonical "algorithmic palette" pattern to teach.
- **The Vercel "blueprint grid" aesthetic** [S: setproduct.com]: visible 1px grid lines, crosshair corner marks, monospace labels, black/white plus one accent. By 2026 this is widely imitated. The cc-skills checklist flags a "decorative grid-line background unless it supports a canvas, map, or measurement task" as a tell.

### 1.2 Typography choices in 2026

**The variable-font baseline** [K/S]: ship one variable WOFF2 per family, and limit axes and subset to the scripts you need [P: Vercel "Subset fonts"]. Useful axes: `wght`, `wdth`, `opsz` (optical size auto-adjusts details for size), `slnt`/`ital`. Use any weight (e.g. 450 or 550), not only 400/500/700.

**UI sans landscape:**
- **Inter** (Rasmus Andersson; v4 includes an `opsz` axis that folds in "Inter Display") [K]. It's excellent, and for exactly that reason it's the #1 slop tell when used as the *brand/display* voice. It's fine as a body or UI workhorse when you deliberately choose it.
- **Geist / Geist Mono** (Vercel + Basement Studio, 2023, OFL). Swiss-inspired and tuned for density, influenced by Inter, Univers, SF, Suisse, and ABC Diatype [S: maxibestof]. It's now itself a convergence tell ("Space Grotesk, Geist, Instrument Serif chosen by reflex") [P: cc-skills slop checklist; S: 925studios].
- Common alternatives cited for 2026: Mona Sans / Hubot Sans (GitHub), Figtree, Manrope, DM Sans, Plus Jakarta Sans, IBM Plex Sans, Public Sans, Söhne (paid), Suisse (paid), ABC Diatype (paid), Neue Montreal (Pangram Pangram).
- **Distinctive free sources** [P: cc-skills typography.md]: Fontshare (Clash Display, Satoshi, General Sans, Cabinet Grotesk, Switzer, Boska, Sentient); Google Fonts (Fraunces, Newsreader, Bricolage Grotesque, Crimson Pro, Source Serif 4, IBM Plex, JetBrains Mono). Paid foundries (Pangram Pangram, Grilli Type, Commercial Type, Klim, Dinamo, Displaay, Typotheque) are "one of the fastest ways off the default."

**Serif revival** [S: creativebloq, fontfabric, envato]: expressive, high-contrast serifs are "the mark of confidence" in editorial, brand, *and* product contexts, including serif display over sans body. Watch out: "big italic serif display headline as the default startup-hero move" and "cream + high-contrast serif + terracotta" are now tells in their own right [P: anthropics frontend-design; cc-skills]. So a serif should be *earned by subject matter* (editorial, finance, heritage, luxury, research).

**Pairing rules** [P: cc-skills typography; P: anthropics frontend-design]:
- One family or two. If two, make them *clearly distinct* (contrast, not conflict). Two near-identical grotesks = "typographic mud".
- Keep one face quiet when the other is expressive. A shared trait (x-height, era, proportion) helps.
- A mono can pair with anything for technical accents, but "a monospace face for small data labels" is on Anthropic's tell list, so use it only when the data is genuinely technical.
- ≤2 weights per screen is a good default (DESIGN.md spec example: "Don't use more than two font weights on a single screen").
- Tracking: display −0.01 to −0.02em (no tighter than about −0.02 to −0.03em or letterforms collide), body 0, small text +0.01 to +0.02em, all-caps labels +0.05 to +0.1em.
- Anthropic's list of the commonest typographic tells: accenting one word in a headline (italic, bold, or colour), all-caps labels, and unnecessary eyebrow labels above content.

**Kinetic type** [S: envato, b12, medium]: in 2026, type shifts weight, stretches on scroll, and reacts on hover. The shift is toward *restraint*, "purposeful motion". Implement with variable-font axis transitions (`font-variation-settings` or `font-weight` transitions), scroll-driven animations (progressive enhancement), and `@media (prefers-reduced-motion: reduce)` fallbacks. Prefer animating a wrapper to avoid text anti-aliasing artefacts [P: Vercel].

### 1.3 Layout: bento, editorial, asymmetric

- **Bento grids** are the signature layout of the mid-2020s. One report claims about 67% of top Product Hunt SaaS sites use some bento-style layout [S: b12/theplusaddons, so treat the number as indicative]. That ubiquity is why "identical same-sized card grid as the only device" is a tell. A good bento has **unequal cells encoding importance**, a real product artefact in each cell (live UI, not icons), consistent gutters (16–24px), and nested radius obeyed.
- **Implementation:** CSS Grid with `grid-template-areas` or spans, and subgrid for aligned inner content. Container queries let each tile adapt to its own size.
- **Alternatives that read as "chosen":** editorial columns with a real typographic scale, asymmetric split heroes (copy left, live product right), scroll-told narratives (scrollytelling), full-bleed product screenshots, and long-form docs-as-marketing.
- Anthropic: "Visual structure is information." Outlines, borders, numbering, eyebrows, and dividers must encode information. Use 01/02/03 only when the content is actually a sequence.

### 1.4 Colour: restrained, perceptual, wide-gamut

- Author in **OKLCH** (`oklch(L C H)`: L 0–1, C 0 to about 0.37 in sRGB and about 0.4 in P3, H 0–360). It's perceptually uniform, so equal-L colours look equally light, you get predictable darken/lighten, no grey dead zones in gradients, and P3 access [S: evilmartians "OKLCH in CSS"; P: cc-skills color-oklch].
- Hue landmarks [P: cc-skills]: red ~20, orange ~40, yellow ~90, green ~140, teal ~195, blue ~220–250, purple ~300–320. **The indigo/violet band (H ≈ 250–320) is the AI default.** Avoid it for accents unless the brief asks for it.
- High chroma clips on sRGB at some hues (teal especially). Verify at oklch.com and ship a hex fallback or rely on the browser's gamut mapping.
- **Neutrals:** never pure #000/#FFF for large surfaces. Tint neutrals very slightly toward the brand hue (C ≈ 0.005–0.02). On coloured backgrounds, text should be the same hue, darker and desaturated, not grey [P: Vercel "Hue consistency"; P: cc-skills].
- Tailwind v4's default palette is OKLCH. v4.3 (May 2026) added `mauve`, `olive`, `mist`, `taupe` neutrals [P: tailwindcss.com blog]. shadcn base colours: Neutral, Stone, Zinc, Mauve, Olive, Mist, Taupe [P: shadcn theming.mdx].

### 1.5 Glass, depth, grain, 3D

- **Glass:** Apple's **Liquid Glass** (WWDC June 2025, iOS/macOS 26) re-legitimised translucency [K]. The web lesson is to use glass **to solve layering** (floating toolbars over content, sheets over maps), not as decoration. Glassmorphism on cards over a gradient blob is a top-10 slop tell [P: cc-skills "No decorative glassmorphism"]. Rules: `backdrop-filter: blur(12–24px) saturate(1.2–1.8)`, an opaque-enough tint (about 60–80% alpha) so text keeps 4.5:1 over *any* content beneath, a 1px inner highlight border, and a solid fallback via `@supports not (backdrop-filter: blur(1px))`. It's expensive on low-end GPUs, so avoid large animated blurred areas. Respect `prefers-reduced-transparency` where supported (limited support) [K].
- **Grain/noise** [S: fireart, envato]: "as AI visuals get technically flawless, designers push the other way: grain, film scratches, imperfect physical details." Keep it cheap. A tiny tiled PNG/AVIF or an SVG `feTurbulence` at 3–8% opacity with `mix-blend-mode: overlay|soft-light` and `pointer-events: none`. Grain also hides gradient banding. Pattern:
  ```css
  .grain::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.06;mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
  ```
  Masks (`mask-image` with a repeating texture) make the *content itself* look weathered [P: modern-web-guidance visually-texture-content].
- **3D** (Three.js/R3F, Spline, WebGL shaders): justify it with the product (hardware, spatial, data). Budget it: lazy-init after LCP, a poster image fallback, pause offscreen (IntersectionObserver), cap DPR at 2, honour reduced motion, and never make it the LCP element. Anthropic: "a single orchestrated moment lands better than scattered effects."

### 1.6 Motion

[P: cc-skills motion.md (citing Emil Kowalski, Rauno Freiberg, Josh Comeau, Material, Carbon); P: Vercel guidelines]
- Durations: micro feedback 100–150ms; menus/popovers/fades 150–250ms; sheets/drawers/modals 250–500ms (about 500ms with an iOS curve for drawers). Most UI stays **under 300ms**.
- Easing: **ease-out for enter** and most UI; ease-in only for elements leaving entirely; ease-in-out for on-screen movement; linear only for spinners and progress. Browser keywords are weak, so use authored curves:
  ```css
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-sheet: cubic-bezier(0.32, 0.72, 0, 1); /* iOS-like drawer (Vaul) */
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  /* Material standard (0.4,0,0.2,1); M3 emphasized (0.2,0,0,1); Carbon standard (0.2,0,0.38,0.9) */
  ```
- Springs for direct manipulation (drag, sheets). CSS `linear()` can approximate springs (Baseline widely available since 2023-12) [P].
- Stagger 20–50ms per item only where a sequence means something.
- Animate only `transform` and `opacity`. **Never `transition: all`** [P: Vercel]. Make animations interruptible. Popovers scale from their trigger (`transform-origin`), never from `scale(0)`.
- Don't animate high-frequency or keyboard-initiated actions (a command palette opening 100×/day).
- Tells: identical fade-in-up on 4+ sections, bounce/elastic easing, image scale on hover by default, decorative pulses, marquees, fake blinking carets.
- Reduced motion: swap movement for a fade and shorten durations. Don't blunt-zero everything globally, because that can break JS springs [P: cc-skills; P: modern-web-guidance entry/exit].
- Autoplaying motion longer than 5s needs pause/stop/hide (WCAG 2.2.2) [P: Vercel].

### 1.7 AI-native interfaces (chat, streaming, agents, generative UI)

[S: copilotkit "Developer's Guide to Generative UI 2026", eleken, fuselab, setproduct AI chat anatomy; K for implementation details]

**Taxonomy of generative UI (2026):**
1. *Static generative UI*: pre-built components, and the agent decides when to show them and with what data (tool call → React component).
2. *Declarative generative UI*: the agent emits a constrained spec, e.g. Google's **A2UI** (JSONL-based widget spec), rendered from an allow-list of components.
3. *Open-ended*: the agent writes UI code (artifacts/canvas). Production systems in 2025–26 lean toward **constrained/declarative** output for safety and consistency.
- **AG-UI protocol** standardises the agent→UI event stream: run lifecycle events, message streaming events (partial text), tool-call events, and state deltas [S].

**Streaming chat patterns** [K unless noted]:
- Target first token in under about 800ms [S]. Show an immediate "thinking" affordance within 100ms (NN/g's 0.1s instant-response limit).
- Render tokens as they arrive, buffered per animation frame. Smooth reveal is fine, but don't fake typing slower than the model.
- **Handle incomplete markdown** mid-stream (unclosed code fences, tables, links) without layout thrash. Reserve space for code blocks and avoid reflowing the whole transcript per token.
- Auto-scroll **only if the user is pinned to the bottom**. Show a "Jump to latest" button when they scroll up. Use `overflow-anchor` and scroll anchoring. `content-visibility: auto` on old messages for long threads.
- Controls: **Stop** (replaces Send while streaming), Retry/Regenerate, Edit last prompt, Copy (inline check feedback, not a toast), branch/versions.
- Composer: Enter sends and Shift+Enter adds a newline (or ⌘/Ctrl+Enter in multi-line contexts [P: Vercel "Textarea behavior"]). **IME-safe**: don't submit while `event.isComposing` [P: modern-web-guidance ime-safe-enter-submit]. Use `field-sizing: content` for an auto-growing textarea (Baseline 2026-06-16) [P]. Support paste, drop, and file attachments with visible chips.
- Accessibility: don't live-announce every token. Use `aria-busy` on the message while streaming and a polite announcement on completion. Give each message a heading or landmark for navigation.

**Agent UIs:**
- **Show the plan as a stepper/checklist, not as chat messages.** "Chat hides the plan" [S: fuselab]. Patterns that survive testing: *plan-and-execute*, *confidence signalling*, *progressive delegation* [S].
- Tool calls are visible but collapsible ("Searched 12 files", expandable with inputs and outputs). Long-running tasks show a progress and elapsed-time indicator, are backgroundable, and notify on completion.
- **Human-in-the-loop approvals** for destructive or external actions: show exactly what will happen (diff, recipients, amount), with Approve / Edit / Deny, and remember scoped permissions.
- Citations and sources inline, provenance for generated content, clear "AI-generated" labelling where it matters, cost/latency/model disclosure for pro users.
- Split view: conversation on one side, artifact/canvas/document on the other. The artifact is the product and chat is the steering wheel.
- Empty state: suggested prompts grounded in the user's data, not generic "Ask me anything" chips.
- Error states: rate limits, context-length overflow, tool failure, partial results. Always offer a recovery path.

### 1.8 Dark mode done right

[P: cc-skills dark-mode.md; P: modern-web-guidance dark-mode; P: shadcn; P: Vercel]
- **Not an inversion.** Author a sibling palette through the same semantic tokens.
- Base surface is near-black, about L 0.13–0.18 in OKLCH (Material's #121212 ≈ 7% luminance is the classic reference), tinted slightly toward the brand hue. Pure black causes halation and OLED smear, and it leaves no room for elevation.
- **Elevation = lighter surfaces** (about +0.03–0.04 L per level: base ~0.16, card ~0.20, popover ~0.24). Material's overlay model runs white at 5% up to 16%. Real shadows only for genuinely floating layers.
- Text is off-white (L ~0.93–0.97, or white at 87%/60%/38% for primary/secondary/disabled).
- Accents get lighter and less saturated (raise L, lower C, keep H). Borders are *lighter* than the surface (shadcn dark: `--border: oklch(1 0 0 / 10%)`, `--input: oklch(1 0 0 / 15%)`).
- Charts: desaturate about 15%, keep ≥20% luminance gap between adjacent series, gridlines at 5–10% white.
- Mechanics: `<meta name="color-scheme" content="light dark">` plus `:root{color-scheme: light dark}` (on root, not body) prevents a white flash and themes scrollbars and form controls. `light-dark()` tokens. Set `<meta name="theme-color">`. Explicitly set `background-color` and `color` on native `<select>` (Windows dark bug). Respect the system preference and persist the override. **Disable transitions during theme swap.**

---

## 2. "AI slop": the complete tell catalogue and how to avoid it

### 2.1 Why it happens

- **Distributional convergence** [P/S: Anthropic "Improving frontend design through Skills" blog; anthropics frontend-design SKILL.md]: models sample from the high-probability centre of their training data. Safe choices that "offend no one" dominate web code, so the output is Inter, purple-on-white gradients, and three-card grids.
- **The Tailwind indigo effect** [S: Adam Wathan tweet, Aug 2025, 1M+ views, x.com/adamwathan/status/1953510802159219096]: Wathan formally apologised for making every Tailwind UI button `bg-indigo-500` five years earlier. Thousands of templates copied `bg-indigo-500`, `text-indigo-600`, and `from-indigo-500 to-purple-600`, so models learned that "buttons are indigo."
- **Feedback loop / model collapse**: AI-generated sites re-enter training data, so trends propagate in weeks [S: prg.sh, communeify].
- **The root cause is a missing decision.** "The model reaches for the statistical average because nothing told it to decide" [S: smoothui.dev]. The highest-leverage fix is a written design system (tokens + rules) the agent must follow [S: braingrid, vibecodekit].

### 2.2 First-order tells (2023–2025 fingerprint)

**Colour**
- Purple→blue or indigo→violet gradients (hero backgrounds, CTAs, accents); any accent in OKLCH H ≈ 250–320 by default.
- **Gradient text** on headings or big metrics.
- Rainbow / many-hue palettes with an even, timid spread instead of one dominant colour plus a sharp accent.
- Radial "glow"/spotlight haze behind sections; floating blurred orbs/blobs.
- Glowing coloured box-shadows on dark mode ("cyberpunk by reflex").
- Grey text on coloured backgrounds.
- Dark mode "you never asked for".

**Typography**
- Inter (or Roboto, Arial, Open Sans, Lato, Montserrat, Poppins, system-ui) as the *primary/display* voice.
- A single family for everything with no display/body distinction. Flat scale (adjacent steps indistinguishable).
- Full-sentence headline blown up to display size.
- Destructively tight tracking on display type.

**Layout / structure**
- Centred hero (pill/eyebrow chip → giant headline → subhead → two buttons) → logo strip → **3 feature cards (icon tile + heading + two lines)** → testimonials → pricing → CTA → footer. The "hero + 3 cards + testimonials + pricing + CTA" skeleton as the *only* structure.
- Identical same-size card grids (3 or 6 cards) as the only device. **Nested cards** (cards in cards in cards).
- Everything centred in one max-width container.
- **Hero metric triptych**: big number, small label, three supporting stats, gradient accent ("used everywhere and trusted nowhere").
- 01 / 02 / 03 numbered markers on non-sequential content.

**Visual detail**
- **The side-tab accent border**: a 3–4px coloured left border on a rounded card or blockquote. The single most recognisable tell [P: cc-skills; S: 925studios].
- A grey 1px border on every card *and* a wide diffuse shadow on the same element (commit to one).
- `rounded-2xl` (16px) or larger on everything, one radius regardless of hierarchy; pill radii on cards.
- The same soft grey shadow `rgba(0,0,0,.1)` under every card.
- Decorative glassmorphism; decorative grid-line backgrounds; repeating gradient stripes.
- **Emoji as icons** (in nav, feature cards, headings). Oversized icons scaled beyond their design size. The unmodified default Lucide set defining the look.
- Pulsing status badges that aren't changing, fake blinking carets, marquees.
- Hand-coded SVG mascots or "scene illustrations" standing in for real art. Stock people pointing at laptops, corporate-Memphis figures, glossy isometric tech illustration, raw default-Midjourney renders.

**Motion**
- Fade-and-slide-up entrance on every section; hover transitions on every card; bounce/elastic easing; image scale on hover.

**Content / copy**
- Lorem ipsum or obviously generic placeholder content; **fake testimonials** (made-up names, stock headshots, "Jane D., CEO"); invented logos/metrics ("10,000+ teams", "99.9% uptime") with no source.
- Buzzwords: "supercharge", "unleash", "seamless", "world-class", "enterprise-grade", "Build the future of X", "Not a feature. A platform." aphoristic cadence, "X theater" [P: cc-skills].
- Em-dash overuse; the same message repeated in label, sublabel, helper text, and tooltip.
- "Get Started" / "Learn More" / "Submit" CTAs instead of outcome verbs.

### 2.3 Second-order tells (what 2026 models do *after* being told "no purple, no Inter")

From Anthropic's current `frontend-design` SKILL.md, verbatim in substance [P]:
1. Warm cream background (near **#F4F1EA**), high-contrast serif display, terracotta/clay accent (near **#D97757**, Anthropic's own Claude accent, so a tell on a user's brief).
2. Near-black background with a single bright **acid-green or vermilion** accent.
3. **Broadsheet** layout: hairline rules, zero border radius, dense newspaper columns.
4. The **SaaS-card kit**: identical rounded cards, one radius on everything, the same `rgba(0,0,0,.1)` shadow, gradient washes.
5. **Template chrome**: tracked-out ALL-CAPS eyebrow above every heading; meta strings joined with middle dots ("A · B · C"); "WORD — fragment" labels with spaced em dash; tinted near-black (#0B0B0B, #111) standing in for black; monospace for small data labels; "→" appended to link and button text.

Plus [P: cc-skills; S: 925studios]: **Space Grotesk, Geist, Instrument Serif** chosen by reflex; big italic serif hero headline; accenting a single word in a headline (italic/colour); the "big number + small label + gradient accent" hero.

> Anthropic's framing: "All traits are legitimate for some briefs, but they are defaults rather than choices... Where the brief pins down a visual direction, follow it exactly... Where it leaves an axis free, don't spend that freedom on one of these defaults."
> The underlying test (cc-skills): **"Is this the most probable output, or a committed choice?"** The fingerprint shifts over time, so skills should teach the test, not just the list.

### 2.4 Build-quality tells (not taste, just broken)

[P: cc-skills "Layout defects" + "Build correctness"; P: Vercel]
- Content stuck at `opacity: 0` waiting on a scroll-reveal handler (ship visible by default and enhance).
- Scroller/carousel cards flush against one edge; text occluded by sticky bars; clipped popovers inside `overflow:hidden`; unintended horizontal scroll.
- Headings with equal or more space below than above (they must bind to their own content).
- Less than 8px padding inside bordered containers; body text touching the viewport edge.
- Only resting states designed (no hover/focus/active/disabled/loading/empty/error).
- Font-weight change on hover or selection (layout shift).
- Uncaught JS errors on load.

### 2.5 How to avoid it: process patterns for skills

1. **Ground in the subject** [P: Anthropic]: identify the concrete subject, audience, and primary job. "The subject's industry, materials, and vernacular are where distinctive visual choices come from." Use the brief's real content throughout.
2. **Plan pass before code**: a compact token system with **4–6 named hex/OKLCH colours**, typefaces and roles, a layout concept (one-sentence prose plus ASCII wireframes, including alignment), and 2–4 principles.
3. **Review the plan against defaults**: "work through a similar prompt to see if you arrive somewhere similar". Revise anything generic and say what changed.
4. **Spend boldness in one place**: one signature move (a type treatment, a colour, a layout device, one orchestrated motion moment). Keep everything else quiet. Chanel's rule: remove one accessory.
5. **Quality floor without announcing it**: responsive to 320px, visible focus, reduced motion, contrast, harmonious palette.
6. **Self-critique with screenshots** when the environment allows ("a picture is worth 1000 tokens").
7. **Persist decisions** in a `DESIGN.md` so later sessions don't re-originate a theme (see §4.6).
8. Concrete de-slop swaps:
   - Inter everywhere → a deliberate display face (distinct) + a legible body face; or one characterful family used with a real scale.
   - Indigo gradient → one owned hue outside 250–320, used at 10%, on a tinted-neutral base.
   - Three icon cards → one real product artefact (screenshot, live demo, code sample, data viz), or an asymmetric bento with unequal cells.
   - Grey-border-plus-shadow cards → borderless cards separated by surface lightness *or* a crisp hairline, not both.
   - rounded-2xl everywhere → a 2–3-step radius scale tied to component size, nested radius obeyed.
   - Emoji icons → one icon family with one grid, stroke, and corner radius matching the UI radius.
   - Fade-up everywhere → a single page-load choreography plus motion that answers user actions.
   - "Get started" → "Create your first project"; "Submit" → "Save changes"; the same verb in button and toast ("Publish" → "Published") [P: Anthropic].
9. **Copy is design**: user-perspective names ("notifications", not "webhook config"), active voice, sentence case, errors that say what happened and how to fix it (no apologising, never vague), empty states as invitations to act [P: Anthropic; P: Vercel copy rules].

### 2.6 Existing anti-slop skills and tools (prior art)

- `anthropics/skills/frontend-design` (also shipped as a Claude Code plugin). The canonical one; rewritten in 2026 with the calibration list above.
- `samber/cc-skills/frontend-design-deslop`: DESIGN.md-driven, 20 reference files, 0–10 slop self-audit checklist (reproduced in structure in §2.2–2.4).
- `vercel-labs/web-interface-guidelines` + `vercel-labs/agent-skills` `web-design-guidelines` review skill (`npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines`).
- "Hallmark" (open-source anti-slop design skill), "UI/UX Pro Max", solodesign slop linter, sailop [S].
- `GoogleChrome/modern-web-guidance` skill (platform-feature guides with Baseline status and MANDATORY/DO/DON'T phrasing, a good style reference for SKILL.md writing).

---

## 3. Foundations with numbers

### 3.1 Type scale

Modular ratios [P: cc-skills typography.md, after Bringhurst]:

| Ratio | Value | Use |
|---|---|---|
| Minor second | 1.067 | dense data UIs |
| Major second | 1.125 | functional app UI |
| Minor third | 1.2 | balanced app/content |
| Major third | 1.25 | general UI, docs |
| Perfect fourth | 1.333 | marketing, editorial |
| Augmented fourth / Perfect fifth | 1.414 / 1.5 | expressive landing pages |
| Golden | 1.618 | display-heavy, premium |

- Base 16px (browser default; don't set the root to 62.5%). Use **6–8 sizes** in total. Larger screens tolerate bigger ratios, so a fluid scale can use 1.2 on mobile and 1.333 on desktop.
- Tailwind v4 defaults [P]: xs 12/16, sm 14/20, base 16/24, lg 18/28, xl 20/28, 2xl 24/32, 3xl 30/36, 4xl 36/40, 5xl 48/1, 6xl 60/1 (px size / line-height). Tracking tokens run from −0.05em to +0.1em. Leading: tight 1.25, snug 1.375, normal 1.5, relaxed 1.625.
- Starting hierarchy for web [P: cc-skills]: Display 48–72px / LH 1.1–1.2 / −0.02em; H1 36–48 / 1.2; H2 28–36 / 1.25; H3 22–28 / 1.3; H4 18–22 / 1.35; body-lg 18–20 / 1.6; body 16 / 1.5–1.7; small 14 / 1.5; caption 12 / 1.4 (+0.02em). The absolute floor is 11–12px for captions, 14px or more for interactive text, and ≥16px for inputs on mobile (iOS zoom) [P: Vercel].
- **Fluid type**: `font-size: clamp(min-rem, preferred vw/cqi + rem, max-rem)`. Use rem for min and max so zoom still works. Include a rem term in the preferred value (e.g. `clamp(2rem, 1.2rem + 3vw, 4rem)`); pure-`vw` values fail WCAG 1.4.4 resize. **Keep max ≤ 2.5× min** so 200% zoom still enlarges text [P: modern-web-guidance fluid-scaling]. Use container units (`cqi`) for component-level type.
- **Line height** [P/K]: headlines 1.05–1.25 (tighter as size grows), subheads 1.25–1.35, body 1.5–1.7, long-form 1.6–1.8. Serif body gets slightly more [P: Anthropic]. The floor is 1.3. WCAG 1.4.12 requires layouts to survive user overrides of line-height 1.5, paragraph spacing 2em, letter-spacing 0.12em, and word-spacing 0.16em.
- **Measure**: 45–75 characters, 66 ideal; `max-width: 65ch` (or 60–70ch) for prose. Anthropic says "default to <80 characters." Never centre long-form text, and never fully justify without hyphenation.
- **Text wrapping**: `text-wrap: balance` for headings (≤6 lines in Chromium, ≤10 in Firefox; it's expensive, so don't apply it globally). `text-wrap: pretty` for paragraphs, which prevents orphans (limited: Chrome 117+, Safari 26; a harmless no-op elsewhere) [P].
- Numbers: `font-variant-numeric: tabular-nums` for any column or changing figure [P: Vercel]. Use `…` rather than `...`, curly quotes, and non-breaking spaces between numbers and units (`10&nbsp;MB`) [P: Vercel].

### 3.2 Spacing and grid

- **Base unit 4px** with an 8px rhythm. Suggested scale: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128. Tailwind v4 uses `--spacing: 0.25rem` and generates any multiple (`p-7` = 1.75rem) [P].
- **Relationship-driven spacing** (Gestalt proximity): tight within groups (4–8), medium between related groups (16–24), generous between sections (64–128 on marketing, 32–48 in apps). "Spacing varies by relationship... not one uniform value everywhere." Start generous, then tighten [P: cc-skills].
- A heading gets more space above it than below it (about 2:1).
- Padding inside bordered or coloured containers ≥8px, typically 12–24px for cards. Buttons are commonly 32/36/40px tall on desktop (dense/default/large) and ≥44px on touch.
- **Grids:** 12-column for marketing (desktop gutter 24–32px, margins 24–80px, max content width about 1200–1440px); 4 columns on mobile with 16–20px margins. App shells use a sidebar (240–280px, collapsible to 56–64px), fluid content, and optional 320–400px inspectors. Prose inside the grid stays capped at about 65ch.
- Tailwind v4 breakpoints [P]: sm 40rem (640), md 48rem (768), lg 64rem (1024), xl 80rem (1280), 2xl 96rem (1536). Prefer **container queries** for components and media queries for page shells.
- Respect safe areas: `padding: env(safe-area-inset-*)` [P: Vercel]. Use `dvh`/`svh` units for mobile full-height (Baseline widely available since 2022-12) [P].
- Optical alignment beats geometric alignment: ±1px nudges for icons, play triangles, and quotes [P: Vercel].

### 3.3 Colour systems, palette generation and contrast

**Scale structure: Radix's 12 steps** [P: radix-ui/website docs] (the best-documented role-based scale):
- 1–2: app background and subtle backgrounds (cards, sidebars, code blocks, striped rows).
- 3 / 4 / 5: component background normal / hover / pressed-or-selected.
- 6 / 7 / 8: border subtle (non-interactive) / interactive / strong + **focus rings**.
- 9: solid background (highest chroma, the "brand" step). 10: solid hover.
- 11: low-contrast text. 12: high-contrast text. **Steps 11 and 12 are guaranteed APCA Lc 60 and Lc 90 on step 2 of the same scale.**
- Pairs with an alpha variant of each scale for overlays on coloured backgrounds.

**Generating a palette in OKLCH** (algorithm to teach) [K + S: evilmartians; P: cc-skills]:
1. Pick the brand hue H and a target chroma C (0.10–0.20 for accents).
2. Define L stops, e.g. `[0.98, 0.95, 0.90, 0.85, 0.78, 0.70, 0.62, 0.55, 0.48, 0.40, 0.32, 0.24]` (light theme).
3. Taper chroma at both extremes (e.g. C × [0.1, 0.2, 0.35, 0.5, 0.7, 0.85, 1, 1, 0.95, 0.85, 0.7, 0.55]) so tints aren't washed out and shades aren't muddy.
4. Optionally shift hue a few degrees toward warmer in darks and cooler in lights for yellows and oranges (hue drift), because yellow at low L turns olive.
5. Gamut-map to sRGB (clip chroma) and emit a hex fallback.
6. Neutrals use the same H at C ≈ 0.005–0.02.
7. Verify text and surface pairs against WCAG 2 (normative) and optionally APCA.
- CSS can do the derivation live with **relative colour syntax** (Baseline since 2024-09) [P]:
  ```css
  --accent: oklch(0.62 0.17 40);
  --accent-hover: oklch(from var(--accent) calc(l - 0.05) c h);
  --accent-subtle: oklch(from var(--accent) 0.95 calc(c * 0.25) h);
  --accent-a20: oklch(from var(--accent) l c h / 20%);
  /* or */ color-mix(in oklch, var(--accent) 20%, transparent);
  ```
- `contrast-color(var(--bg))` returns black or white for max contrast (Baseline 2026-04-10). Use it for foregrounds only [P].

**Contrast: what's normative in 2026**
- **WCAG 2.2 AA is still the legal bar.** ADA, Section 508, and the European Accessibility Act (enforced from 28 June 2025) all reference WCAG 2.x [S: webability, abilitynet]. The numbers: text 4.5:1; large text (≥24px, or ≥18.66px bold) 3:1; **non-text UI components and graphics 3:1** (1.4.11); AAA is 7:1 / 4.5:1.
- **APCA is *not* in WCAG 3.** It was marked exploratory, pulled from the July 2023 draft, and "the contrast algorithm used in WCAG 3 is yet to be determined" [S: Adrian Roselli, "WCAG3 Contrast as of April 2026"]. The latest WCAG 3 Working Draft is dated 2026-09-10 [S: w3.org/WAI/news/2026-09-10/wcag3]. CR is expected about Q4 2027 at the earliest, and final no earlier than 2028 (Roselli suggests about 2030).
- **Practical stance for skills:** *pass WCAG 2 ratios (required); use APCA as a secondary perceptual check*, especially for dark mode and thin fonts, where WCAG 2 is known to mis-rate pairs. Vercel's guideline "Prefer APCA over WCAG 2" is a taste choice, not compliance. APCA "Bronze simple" guide values [K]: Lc 90 preferred for body text; **Lc 75 minimum for body columns**; Lc 60 for other content text; Lc 45 for large/bold headlines (≈36px normal or 24px bold); Lc 30 absolute minimum for spot text and placeholders; Lc 15 minimum for non-text (dividers). APCA polarity matters: light-on-dark and dark-on-light give different values.
- Never convey meaning by colour alone. Pair status colour with an icon and a text label [P: Vercel "Redundant status cues"]. Test in grayscale and with protanopia/deuteranopia/tritanopia simulation.
- Interactions increase contrast: hover, active, and focus are *more* contrasty than rest [P: Vercel].

**Semantic colour tokens** (minimum viable set):
`bg`, `bg-subtle`, `surface` (card), `surface-raised` (popover), `overlay` (scrim), `fg`, `fg-muted`, `fg-subtle`/placeholder, `border`, `border-strong`, `input`, `ring`, `accent`, `accent-hover`, `accent-fg`, `accent-subtle`, `success|warning|danger|info` (each with `-fg`, `-subtle`, `-border`), `selection`, `chart-1..n`. shadcn's convention: each surface token pairs with `-foreground` [P].

### 3.4 Elevation, shadows, radius, borders

**Elevation scale** (light theme): 0 flat (page), 1 raised (cards: hairline *or* xs shadow), 2 overlay (dropdowns, popovers: sm–md shadow + border), 3 modal (lg–xl shadow + scrim), 4 toast/drag (xl). In dark mode, express elevation mainly by surface lightness (§1.8).

**Layered shadows** [P: Vercel "Layered shadows: mimic ambient + direct light with at least two layers"; "Crisp borders: combine borders & shadows; semi-transparent borders improve edge clarity"]. Tailwind v4 defaults for reference [P]:
```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```
A more "crafted" pattern [K, Josh Comeau-style]: a consistent light source (all y-offsets positive and proportional), 3–5 layers with doubling offset and blur, low alpha, and shadow colour **tinted to the background hue** rather than neutral black:
```css
--shadow-color: 220 40% 20%; /* hue of the surface beneath */
--elev-2: 0 0 0 1px hsl(var(--shadow-color) / .06),
          0 1px 1px hsl(var(--shadow-color) / .06),
          0 2px 4px -1px hsl(var(--shadow-color) / .08),
          0 8px 16px -4px hsl(var(--shadow-color) / .10);
```
Rules: shadows use transparent dark, never opaque grey. Don't combine a hairline *and* a wide diffuse shadow unless the hairline is the crisp-edge layer of the shadow itself (the `0 0 0 1px` ring above). Don't animate `box-shadow`; animate the opacity of a pseudo-element that carries the bigger shadow.

**Radius system**
- Keep 2–3 values tied to size and hierarchy (e.g. 4–6px for inputs, chips, and small buttons; 8–12px for cards and popovers; 16–24px for sheets and large media; full for pills and avatars). Hard ceiling of about 16px on small cards; 24px+ on cards reads as "blob" [P: cc-skills]. shadcn derives the whole scale from one `--radius: 0.625rem` (sm ×0.6, md ×0.8, lg ×1, xl ×1.4, 2xl ×1.8, ...) [P].
- **Nested (concentric) radius rule: `outer = inner + padding`** (so `inner = max(0, outer − padding)`). The child radius is ≤ the parent radius [P: Vercel "Nested radii: child radius ≤ parent radius & concentric so curves align"]. In CSS: `.card{--r:16px;--p:8px;border-radius:var(--r);padding:var(--p)} .card>img{border-radius:max(0px,calc(var(--r) - var(--p)))}`.
- Match icon corner style to UI radius (sharp icons in a soft UI clash).
- `corner-shape: squircle` (superellipse) is arriving in Chromium (2025–26) but has limited availability; progressive enhancement only [K].

**Borders**: 1px hairlines at low alpha of the foreground (`oklch(from var(--fg) l c h / 10–14%)`) adapt to any surface. On dark, borders are lighter than the surface. For crispness on HiDPI, prefer `box-shadow: 0 0 0 1px` or `outline` for rings.

### 3.5 Focus rings

- Use `:focus-visible` (not `:focus`) so pointer users don't see rings. Use `:focus-within` for grouped controls [P: Vercel].
- A good default: `outline: 2px solid var(--ring); outline-offset: 2px;`. **Outlines now follow `border-radius` in all engines (Safari 16.4+) and stay visible in Windows forced-colors mode, whereas `box-shadow` rings are removed there.** If you use a box-shadow ring, keep a transparent outline as a forced-colors fallback: `outline: 2px solid transparent`. (cc-skills recommends box-shadow for radius-following; that advice is outdated for 2026 [K].)
- WCAG 2.4.13 Focus Appearance (AAA) gives a good target even at AA: the indicator area is ≥ a 2px perimeter and has ≥3:1 change contrast between focused and unfocused states [P: WCAG 2.2 SC text]. Non-text contrast 3:1 against adjacent colours (1.4.11).
- **2.4.11 Focus Not Obscured (AA)**: a focused element must not be *entirely* hidden by sticky headers, footers, or cookie banners. Use `scroll-padding-top` or `scroll-margin` equal to the sticky header height [P: WCAG; P: Vercel].
- Two-tone rings (`outline` + an inner `box-shadow` in the surface colour) work on any background.

### 3.6 Interaction states: the matrix every component must specify

`default · hover · active/pressed · focus-visible · disabled · loading · selected/checked · invalid/error · read-only · dragging` [P: cc-skills components]
- **Hover** is a small lightness shift (about ±0.03–0.05 L) or a subtle background (Radix step 3→4). Gate hover styles behind `@media (hover: hover)` so touch devices don't get sticky hovers.
- **Active**: `scale: 0.97–0.98` or a darker fill, 100ms or less. **No layout shift**, so don't change font-weight or border-width on state change (use inset box-shadow or reserve the border).
- **Disabled**: reduced contrast (about 40–50% opacity or dedicated tokens), `cursor: not-allowed`, and ideally an explanation elsewhere. **Don't pre-disable submit buttons**; let people submit and show validation instead [P: Vercel]. Disabled buttons shouldn't carry tooltips (they're unfocusable). Consider `aria-disabled="true"` to keep them focusable.
- **Loading buttons**: keep the original label and add a spinner. Disable only while in flight. Use an idempotency key. Use "Saving…" with an ellipsis [P: Vercel].
- **Selected** state is distinct from focus.
- Buttons are ranked by *importance* (one primary per view: filled; secondary: outline/tonal; tertiary: text), not coloured by meaning. A destructive red button appears only when destruction is the primary action (the confirm dialog) [P: cc-skills].
- Make hit areas generous: expand small visuals with a pseudo-element to at least 24×24 CSS px (WCAG 2.5.8 AA; exceptions for spacing, inline text, equivalent controls, UA controls, essential), and 44×44 on touch [P: WCAG SC; P: Vercel]. Checkbox and label share one hit target. `touch-action: manipulation`.

### 3.7 Loading: skeletons vs spinners, timing

- NN/g response-time limits [K]: **0.1s** feels instant (no indicator); **1s** keeps flow (subtle indicator OK); **10s** is the attention limit (show a determinate progress bar with an estimate and allow backgrounding).
- **Skeletons** for page- or region-level content loads with a known layout (they must mirror the final layout exactly to avoid CLS [P: Vercel "Stable skeletons"]). **Spinners** for short, indeterminate, single-component waits (button, small panel). **Progress bars** for anything over about 10s or measurable (uploads, exports, agent runs).
- **Anti-flicker** [P: Vercel]: add a **show-delay of about 150–300ms** before any spinner or skeleton, and once shown keep it visible for **at least about 300–500ms**. React `<Suspense>` + transitions do this.
- Shimmer: subtle, slow (about 1.5–2s cycle), disabled under reduced motion (static blocks).
- Stream content progressively (HTML streaming / RSC / Suspense boundaries) rather than blocking the whole page.
- Use `aria-busy="true"` on the region that's loading, and announce completion politely only when meaningful.

### 3.8 Empty, error, and edge states

- Design **empty (first-use), empty (filtered: no results), sparse, dense, error, offline, permission-denied, and loading** states for every view [P: Vercel "All states designed"].
- A first-use empty state explains what the thing is, **leads with a verb/CTA**, and offers a template, sample data, or import. "An empty screen is an invitation to act" [P: Anthropic].
- No-results states echo the query, suggest fixes (clear filters, check spelling), and provide a way out.
- Error messages: say what happened, why if useful, and how to fix it. Offer a primary recovery action. Don't blame or apologise. Keep user input. Show an error code or ID for support. Example: "Your API key is incorrect or expired. Generate a new key in account settings." instead of "Invalid API key" [P: Vercel]. "No dead ends: every screen offers a next step" [P: Vercel].
- Resilient to user content: short, average, very long, RTL, emoji, and missing images or avatars (fallback initials).

### 3.9 Optimistic UI, toasts, undo, confirmation

- **Optimistic updates** when success is likely (toggles, reorder, rename, like, send). Reconcile on response. On failure, roll back and show an error with retry. Network budget: POST/PATCH/DELETE complete in **<500ms** [P: Vercel].
- **Confirm destructive actions or provide Undo** with a safe window [P: Vercel]. Prefer Undo for reversible actions (archive, move) and typed or explicit confirmation for irreversible, high-blast-radius actions (delete project: type the name).
- **Toasts** are for background or cross-surface events (saved, synced, copied elsewhere, job finished). Give feedback *where the action happened* when possible (an inline checkmark on a copy button) [P: cc-skills].
  - Duration: about 4–6s (Sonner's default is 4000ms [K]). Add about 1s per extra 10–15 words. Pause on hover and focus. Errors that need action must **not** live only in an auto-dismissing toast (WCAG 2.2.1 Timing Adjustable).
  - Placement is consistent (bottom-right on desktop or top-centre; bottom on mobile above the nav). Stack with a max of about 3 visible and collapse the rest.
  - `role="status"` / `aria-live="polite"` for info, `role="alert"` only for urgent messages. Toast actions ("Undo") must be keyboard reachable (e.g. an F6/hotkey or a focusable region).
- Persistent notifications can use `popover="manual"` in the top layer [P: modern-web-guidance persistent-toast].

### 3.10 Forms

[P: Vercel Forms section; P: modern-web-guidance forms; P: cc-skills; K: Baymard/Wroblewski research]
- **Visible labels always** (placeholder-as-label fails). Top-aligned labels are fastest to scan. Use a single-column layout. Group related fields with `<fieldset>`/`<legend>`. Mark optional fields rather than required ones when most fields are required (or the reverse, consistently).
- Placeholders show an *example* value ending with an ellipsis ("sk-012345…"), never instructions.
- Put hints *above* the input so autocomplete popovers don't cover them, wired with `aria-describedby` [P: modern-web-guidance].
- **Validation timing**: don't show errors while the user is still typing a field for the first time. Validate on **blur** or on **submit** ("reward early, punish late": clear an error as soon as the input becomes valid, but only show a new error after the user leaves the field). CSS has this built in with **`:user-invalid` / `:user-valid`** (Baseline widely available since 2023-11) [P].
- On submit, show errors inline next to each field, **focus the first invalid field**, and for long forms add an error summary at the top with links. Use `aria-invalid` and `aria-errormessage`/`aria-describedby`, and announce with polite live regions [P].
- **Don't block typing** (accept anything, then explain). **Don't block paste.** Trim trailing whitespace from text replacements. Keep submit enabled until the request starts [P: Vercel].
- Correct `type`, `inputmode`, `autocomplete` tokens (`email`, `one-time-code`, `street-address`, `cc-number`...), `enterkeyhint`, and `spellcheck="false"` for codes and emails. Enter submits single-field forms. In textareas, ⌘/Ctrl+Enter submits [P: Vercel].
- Warn before leaving with unsaved changes. Support password managers and pasting OTPs (WCAG 3.3.8 Accessible Authentication: no cognitive tests without an alternative, allow paste and autofill) [P: WCAG]. **3.3.7 Redundant Entry (A)**: don't ask for the same information twice in a flow; auto-populate or offer selection [P: WCAG].
- Auto-growing textareas and inputs: `field-sizing: content` (Baseline 2026-06-16) [P]. Customisable `<select>` via `appearance: base-select` (Chrome 135+, Safari 27; limited) [P].

### 3.11 Tables and data-dense UI

- **Alignment**: text left, **numbers right**, `tabular-nums`, consistent decimals and units in the header ("Amount (USD)"), and dates in a consistent locale-aware format [P: cc-skills; P: Vercel].
- **Density tokens**: row height about 32px (compact) / 40px (default) / 48–56px (comfortable), with cell padding 8–16px horizontally. Pick one density per view, and optionally let users toggle it.
- Light horizontal separators or zebra striping at high density, not full grid borders.
- **Sticky header**, pinned first (identifier) column on horizontal scroll, totals or summary row, sortable columns with the current sort indicated (`aria-sort`), resizable columns in pro tools.
- Row actions visible or revealed on hover *with* a keyboard-accessible equivalent (a kebab menu). Bulk selection with a sticky action bar showing the count.
- Truncate with an ellipsis plus a full-value tooltip or expand. Never truncate numbers or IDs silently. Use a monospace or tabular font for IDs and hashes.
- Filters in the URL (deep-linkable) [P: Vercel "URL as state", nuqs]. Virtualise large lists (TanStack Virtual, virtua) or use `content-visibility: auto` [P: Vercel].
- Responsive tables: horizontal scroll inside a focusable, labelled region, or card/stacked rows on narrow containers via container queries [P: modern-web-guidance responsive-table].

### 3.12 Dashboards

[K + S: 925studios dashboard examples]
- Start from **the questions users ask**, not the available data. One primary question per dashboard.
- Layout: KPIs top-left (F-pattern), 3–5 headline KPIs at most, each with **comparison context** (vs previous period, target, sparkline). Then trend charts, then breakdown tables. A global date range and filters sit top-right and persist in the URL.
- KPI tiles: value in large tabular numerals, label, delta with a direction icon *and* colour (never colour alone), and period. Avoid the gradient "hero metric triptych" look.
- Charts: default to line (trends), bar (comparisons), stacked only when part-to-whole matters, and tables for exact values. Avoid pie or donut charts with more than 4–5 slices, 3D, and dual axes. Direct labels beat legends. Use a colour-blind-safe categorical palette (equal L and C, hue rotated in OKLCH). Keep gridlines faint.
- Handle loading per tile (skeletons), empty periods, partial data ("data delayed"), and time zone display.
- Density: an app-like 1.125–1.2 type ratio, 12–14px table text is acceptable, 8px spacing rhythm.

---

## 4. Design tokens

### 4.1 W3C DTCG format: stable 2025.10

- **Status** [P: repo + w3.org/community/design-tokens/2025/10/28]: the Design Tokens Community Group announced the **first stable version, 2025.10, on 2025-10-28**. The final CG report is at `w3c.github.io/cg-reports/design-tokens/CG-FINAL-format-20251028/`, and the stable URL is `designtokens.org/tr/2025.10/format/`. It has three modules: **Format**, **Color**, and **Resolver**. It's a Community Group report (not a W3C Recommendation), but it's vendor-backed and "production-ready". The headline features are theming and multi-brand (via Resolver), modern colour (Display P3, OKLCH, CSS Color 4 spaces), inheritance and aliases, and cross-platform generation.
- **File**: JSON, media type `application/design-tokens+json`, extensions `.tokens` or `.tokens.json`. Schema: `"$schema": "https://www.designtokens.org/schemas/2025.10/format.json"`.
- **Token properties**: `$value` (required), `$type`, `$description`, `$deprecated` (bool or string), `$extensions` (vendor data, reverse-domain keys). `$type` can be set on a group and is inherited.
- **Groups**: nested objects. **`$extends`** on a group inherits another group's tokens (sugar for JSON Schema `$ref`). "Root tokens in groups" are supported.
- **Aliases**: curly-brace `"{color.brand.500}"` (token references), plus **JSON Pointer `$ref`** (`"#/color/brand/500/$value"`), which must be supported and enables *property-level* references (a single colour component or dimension value). Circular references are an error.
- **Primitive types**: `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`.
  - `dimension` is an **object**: `{"value": 0.5, "unit": "rem"}` (units `px` | `rem`).
  - `duration`: `{"value": 200, "unit": "ms"}` (ms | s).
  - `color` is an **object**: `{"colorSpace": "oklch", "components": [0.62, 0.17, 40], "alpha": 1, "hex": "#e0703a"}`. Supported spaces: `srgb, srgb-linear, hsl, hwb, lab, lch, oklab, oklch, display-p3, a98-rgb, prophoto-rgb, rec2020, xyz-d65, xyz-d50`. Components may be `"none"`. `hex` is an optional 6-digit fallback.
- **Composite types**: `strokeStyle`, `border`, `transition`, `shadow` (single or **array for layered shadows**, with an `inset` flag), `gradient`, `typography`.
- **Resolver module (2025.10)**: a resolver document has `version: "2025.10"`, `sets` (ordered sources merged last-wins, each a `$ref` to a token file or inline tokens), `modifiers` (with a `contexts` map, e.g. `theme: {light: [...], dark: [...]}`, `density`, `brand`, `contrast`, `motion`), and `resolutionOrder`. This is the standard answer to **light/dark, multi-brand, and high-contrast without combinatorial explosion**.

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/format.json",
  "color": {
    "$type": "color",
    "orange": {
      "500": { "$value": { "colorSpace": "oklch", "components": [0.62, 0.17, 40], "hex": "#dc6a31" } }
    },
    "accent": { "$value": "{color.orange.500}", "$description": "Primary action background" }
  },
  "space": {
    "$type": "dimension",
    "4": { "$value": { "value": 16, "unit": "px" } }
  },
  "shadow": {
    "raised": { "$type": "shadow", "$value": [
      { "color": { "colorSpace": "srgb", "components": [0,0,0], "alpha": 0.06 }, "offsetX": {"value":0,"unit":"px"}, "offsetY": {"value":1,"unit":"px"}, "blur": {"value":2,"unit":"px"}, "spread": {"value":0,"unit":"px"} },
      { "color": { "colorSpace": "srgb", "components": [0,0,0], "alpha": 0.08 }, "offsetX": {"value":0,"unit":"px"}, "offsetY": {"value":8,"unit":"px"}, "blur": {"value":16,"unit":"px"}, "spread": {"value":-4,"unit":"px"} }
    ]}
  }
}
```
- **Tooling** [K]: Style Dictionary v4+ reads DTCG (`$value`/`$type`). Terrazzo (formerly Cobalt UI), Tokens Studio, and Specify all support it. Figma Variables can export via plugins. Note that the 2025.10 object forms of `dimension` and `color` differ from older draft string forms (`"16px"`, `"#fff"`), so check tool versions.

### 4.2 Token tiers

1. **Primitive / reference / global**: raw scales with no meaning (`orange.500`, `gray.1..12`, `space.4 = 16px`, `radius.2`, `duration.200`). Never used directly by components.
2. **Semantic / system / alias**: *intent* (`color.bg`, `color.fg.muted`, `color.accent`, `color.border.subtle`, `color.danger.fg`, `space.inset.card`, `radius.control`, `motion.duration.fast`). **Themes (light, dark, brand, high-contrast) remap this tier only.**
3. **Component**: optional, scoped overrides (`button.primary.bg → {color.accent}`, `button.primary.bg.hover`). Add these only when a component genuinely diverges; too many component tokens become maintenance debt.
- Naming: `category.property.variant.state` (e.g. `color.bg.surface.hover`). Use kebab-case in CSS (`--color-bg-surface-hover`). Name by role, not value (`--color-danger`, not `--red`).
- Include non-colour tokens: typography composites, spacing, sizing (control heights 32/36/40/44), radius, border width, shadow/elevation, z-index layers (base, dropdown, sticky, overlay, modal, toast, tooltip), motion durations and easings, breakpoints, and opacity.

### 4.3 CSS custom properties, `@property`, and theming

```css
@layer tokens, base, components, utilities;
@layer tokens {
  :root {
    color-scheme: light dark;
    /* primitives */
    --orange-500: oklch(0.62 0.17 40);
    --gray-1: oklch(0.99 0.003 60);  --gray-12: oklch(0.22 0.01 60);
    /* semantic, light + dark in one declaration */
    --color-bg: light-dark(var(--gray-1), oklch(0.16 0.008 60));
    --color-fg: light-dark(var(--gray-12), oklch(0.95 0.005 60));
    --color-accent: light-dark(var(--orange-500), oklch(0.72 0.13 40));
    --color-accent-fg: contrast-color(var(--color-accent)); /* Baseline 2026-04; add fallback */
    --radius-control: 6px; --radius-card: 12px;
    --duration-fast: 150ms; --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  }
  [data-theme="light"] { color-scheme: light; }
  [data-theme="dark"]  { color-scheme: dark; }
}
```
- `light-dark()` (Baseline 2024-05) follows the *computed* `color-scheme`, so a `[data-theme]` toggle just sets `color-scheme` [P: modern-web-guidance]. Component-scoped schemes also work (a dark card inside a light page: `.card{color-scheme: dark}`).
- **`@property`** (registered custom properties, Baseline 2024-07) enables typed tokens that can be animated (e.g. gradient angle, colour stops) and are validated [P].
- **Container style queries** (Baseline 2026-05-19) enable token-reactive components: `@container style(--variant: compact) { ... }` [P].
- Cascade layers (Baseline 2022-03) give order: `tokens → reset → base → components → utilities → overrides` [P].

### 4.4 Tailwind CSS v4 (current 4.3, May 2026)

[P: tailwindcss.com docs + blog]
- **CSS-first config**: `@import "tailwindcss";` then `@theme { ... }`. Theme variables are CSS variables that also **generate utilities**, keyed by namespace: `--color-*`, `--font-*`, `--text-*` (+ `--text-*--line-height`), `--font-weight-*`, `--tracking-*`, `--leading-*`, `--breakpoint-*`, `--container-*`, `--spacing` / `--spacing-*`, `--radius-*`, `--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*`, `--blur-*`, `--perspective-*`, `--aspect-*`, `--ease-*`, `--animate-*` (+ `@keyframes` inside `@theme`), and `--zoom-*`.
- Use `:root` for variables that *shouldn't* create utilities, and `@theme` for those that should.
- **`@theme inline`** is for tokens that reference other variables (e.g. shadcn mapping `--color-background: var(--background)`). Without `inline`, `var()` resolves where defined and can fall back unexpectedly.
- **`@theme static`** always emits every variable (by default only used ones are emitted).
- Reset a namespace with `--color-*: initial;` or everything with `--*: initial;` for a fully custom design system (the anti-default move for slop).
- Opacity modifiers (`bg-primary/50`) compile to `color-mix()`, so tokens can be in any colour space. The default palette is OKLCH.
- Dark mode via `@custom-variant dark (&:is(.dark *));` or `[data-theme=dark]`.
- v4.3 added: `mauve/olive/mist/taupe` palettes, a webpack plugin, more logical-property utilities, `font-features-*`, scrollbar utilities, `@container-size`, `zoom-*`, `tab-*`, and stacked `@variant`.

### 4.5 shadcn/ui token convention (the de facto React standard)

[P: shadcn apps/v4 theming.mdx]
- Semantic **surface/foreground pairs**: `background/foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent` (hover/focus surfaces, *not* brand accent), `destructive`, `border`, `input`, `ring`, `chart-1..5`, `sidebar-*`, and `radius`. Values are defined in `:root` and `.dark` and exposed via `@theme inline`.
- The default neutral theme is achromatic OKLCH (`--primary: oklch(0.205 0 0)` in light and `oklch(0.922 0 0)` in dark). That achromatic default *is* the "shadcn look". Customise `--primary`, `--radius`, fonts, and chart colours to escape it (`shadcn/create` generates presets).
- To add a token, define `--warning`/`--warning-foreground` in `:root` and `.dark`, then `@theme inline { --color-warning: var(--warning); }`.

### 4.6 DESIGN.md: agent-readable design systems

[P: google-labs-code/design.md, docs/spec.md, version "alpha", Apache-2.0; S: blog.google Stitch announcement]
- One file at the repo root: **YAML front matter tokens + markdown rationale**. Tokens are normative and prose explains how to apply them. Token model is "inspired by" DTCG, using `{path.to.token}` references.
- Schema: `version`, `name`, `description`, `omitted`, `colors` (any CSS colour string; hex recommended), `typography` (fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, fontFeature, fontVariation), `rounded`, `spacing`, and `components` (component → {backgroundColor, textColor, typography, rounded, padding, size, height, width}, with variants as sibling keys like `button-primary-hover`).
- **Section order** (`##`): Overview (Brand & Style) → Colors → Typography → Layout → Elevation & Depth → Shapes → Components → Do's and Don'ts. Unknown sections are preserved; duplicate sections are an error.
- CLI: `npx @google/design.md lint DESIGN.md` (11 rules: `broken-ref`, `missing-primary`, **`contrast-ratio`** (component bg/text below WCAG AA 4.5:1), `orphaned-tokens`, `missing-typography`, `section-order`, `unknown-key`, ...), `diff`, `export --format css-tailwind | json-tailwind | dtcg`.
- For our skills: **read DESIGN.md first if it exists, honour its tokens, and extend it rather than re-originating a theme**. If it's absent, run discovery, then write one [P: cc-skills design-md.md lifecycle]. The community has DESIGN.md benchmarks of real brands (e.g. voltagent/awesome-design-md, designmd.cc). Those are useful references, but impersonating a brand's system for a different product is its own kind of genericness.

---

## 5. Modern CSS and the web platform in 2026

Baseline dates come from GoogleChrome/modern-web-guidance (which embeds web-features data, repo as of 2026-09-28) [P] unless marked otherwise. "Newly available" = in all core browsers. "Widely available" = 30 months after that.

| Feature | Status (2026-09) | Notes / snippet |
|---|---|---|
| Container size queries + units (`cqi`) | Widely (2023-02-14) | `container-type: inline-size; @container (width > 40rem){}` |
| Container **style** queries | **Newly (2026-05-19)** | `@container style(--tone: inverted){}`; Interop 2026 |
| Container scroll-state queries | Limited (Chrome 133+) | `@container scroll-state(stuck: top)`, for stuck headers and snapped items |
| Anchor-position container queries | Limited (Chrome 143+) | style an arrow when a popover flips |
| `:has()` | Widely (2023-12-19) | parent/sibling state styling: `form:has(:user-invalid) .submit{}` |
| Cascade layers | Widely (2022-03-14) | `@layer reset, tokens, components, utilities;` |
| Subgrid | Widely (2023-09-15) | aligned card internals across a row |
| View Transitions (same-document) | **Newly (2025-10-14)** | `document.startViewTransition(update)`; `view-transition-name`; `view-transition-class` also 2025-10-14 |
| `:active-view-transition` | Newly (2026-01-13) | style the doc during a transition |
| Cross-document VT `@view-transition{navigation:auto}` | **Limited**: Chrome/Edge 126+, Safari 18.2+; Firefox not yet (Interop 2026) | progressive enhancement for MPAs; pair with `pagereveal`/`pageswap` |
| Scroll-driven animations (`animation-timeline: scroll()/view()`) | **Limited**: Chrome 115+, Safari 26; Firefox behind flag through at least v152 (Jun 2026) [S] | Interop 2026 focus. Wrap in `@supports (animation-timeline: view())` + reduced motion |
| Anchor positioning (`anchor-name`, `position-anchor`, `position-area`, `anchor()`, `position-try`) | Shipped in all engines: Chrome 125 (2024), Safari 26 (Sep 2025), **Firefox 147 (Jan 13 2026)** [S]. web-features status data was noisy in the clone, so feature-detect | Interop 2026 focus. `position-try-fallbacks: flip-block, flip-inline` |
| Popover API | **Newly (2025-01-27)** | `popover` / `popovertarget`; top layer, light dismiss |
| `popover="hint"` + `interestfor` (hover/focus tooltips) | Limited: `interestfor` Chrome 142+; `hint` Chrome 151, Firefox 153 | declarative tooltips with implicit ARIA |
| Invoker commands (`commandfor`/`command`) | Newly (2025-12-12) | `<button commandfor="dlg" command="show-modal">`, no JS for dialogs |
| `<dialog>` | Widely | modal focus trap + `::backdrop`; `closedby="any"` (newer) |
| `@starting-style` + `transition-behavior: allow-discrete` | Newly (2024-08-06) | enter/exit animations from `display:none`, popovers, dialogs |
| `text-wrap: balance` | Newly (2024-05-13) | headings only |
| `text-wrap: pretty` | Limited (Chrome 117+, Safari 26) | paragraphs; harmless elsewhere |
| `color-mix()` | Widely [K] (Baseline 2023) | `color-mix(in oklch, var(--accent) 15%, transparent)` |
| `oklch()`/`oklab()` | Widely [K] (Baseline 2023) | author all colours in OKLCH |
| Relative colour syntax | Newly (2024-09-16) | `oklch(from var(--c) calc(l - .05) c h)` |
| `light-dark()` | Newly (2024-05-13) | needs `color-scheme` |
| `contrast-color()` | **Newly (2026-04-10)** | black/white foreground for a dynamic bg |
| `field-sizing: content` | **Newly (2026-06-16)** | auto-growing textarea/input/select |
| `interpolate-size: allow-keywords` / `calc-size()` | Limited (Chrome 129+) | animate to `height:auto`; progressive enhancement |
| Customisable `<select>` (`appearance: base-select`, `::picker(select)`, `<selectedcontent>`) | Limited (Chrome 135+, Safari 27) | branded selects with native a11y |
| `sibling-index()` / `sibling-count()` | **Newly (2026-08-18)** | stagger delays in pure CSS: `transition-delay: calc(sibling-index() * 30ms)` |
| Advanced `attr()` (typed) | Limited (Chrome 133+, Firefox 155) | Interop 2026 |
| `@property` | Newly (2024-07-09) | animatable typed tokens |
| `linear()` easing | Widely (2023-12-11) | spring approximations |
| Individual transforms (`translate`, `scale`, `rotate`) | Widely | compose without clobbering |
| `font-size-adjust: from-font` | Newly (2024-07-25) | stable fallback font metrics (less CLS) |
| `content-visibility: auto` | Newly (2025-09-15) | skip rendering offscreen sections |
| `scrollbar-color` / `scrollbar-width` / `scrollbar-gutter` | Newly (2024-12 / 2025-12) | themed scrollbars; `scrollbar-gutter: stable` prevents shift |
| `inert` | Widely (2023-04-11) | disable background while a modal or drag is active |
| `:user-valid` / `:user-invalid` | Widely (2023-11-02) | validation after interaction |
| Navigation API | Newly (2026-01-13) | SPA routing primitives |
| Custom highlights (`::highlight()`) | Newly (2026-03-24) | search-hit highlighting without DOM wrappers |
| `dvh`/`svh`/`lvh` | Widely (2022-12-05) | mobile viewport heights |
| `shape()` / `corner-shape` | Limited / emerging (Interop 2026 includes `shape()`) | responsive clip paths; squircles |

**Interop 2026 focus areas** [S: webkit.org, web.dev, hacks.mozilla.org, Feb 2026]: anchor positioning, advanced `attr()`, container style queries, `contrast-color()`, CSS zoom, custom highlights, dialog & popover additions, fetch uploads & ranges, IndexedDB `getAllRecords()`, JSPI for Wasm, media pseudo-classes, Navigation API, scoped custom element registries, **scroll-driven animations**, scroll snap, `shape()`, **View Transitions** (including cross-document), web compat, WebRTC, WebTransport. Investigations: accessibility testing, JPEG XL, mobile testing, WebVTT.

**Guidance for skills**
- Use the "Baseline newly available" features freely with a graceful fallback, and "limited" features only as progressive enhancement behind `@supports` or feature detection.
- Prefer platform primitives over JS libraries: popover/dialog/invokers instead of custom modals, anchor positioning instead of Floating UI (keep a polyfill or fallback position for older browsers), View Transitions instead of animation libraries for route changes, `:has()` instead of JS state classes, and `field-sizing` instead of autosize libs.
- View Transitions: give shared elements unique `view-transition-name`s, keep durations about 200–300ms, honour reduced motion (`@media (prefers-reduced-motion){::view-transition-group(*){animation:none}}`), and don't block interaction.

Snippets:
```css
/* Popover menu anchored to its button, animated in and out */
.menu-btn { anchor-name: --menu; }
.menu[popover] {
  position-anchor: --menu; position-area: block-end span-inline-end; margin-top: 4px;
  position-try-fallbacks: flip-block, flip-inline;
  opacity: 1; scale: 1; transform-origin: top left;
  transition: opacity .15s var(--ease-out), scale .15s var(--ease-out), display .15s allow-discrete, overlay .15s allow-discrete;
}
.menu[popover]:not(:popover-open) { opacity: 0; scale: .96; }
@starting-style { .menu[popover]:popover-open { opacity: 0; scale: .96; } }

/* Scroll-driven reveal, enhancement only */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal { animation: reveal linear both; animation-timeline: view(); animation-range: entry 0% cover 30%; }
    @keyframes reveal { from { opacity: 0; translate: 0 24px; } }
  }
}

/* Cross-document page transitions (Chromium, Safari) */
@view-transition { navigation: auto; }
```
```html
<button popovertarget="m" class="menu-btn">Options</button>
<div id="m" popover class="menu">…</div>
<button commandfor="confirm" command="show-modal">Delete…</button>
<dialog id="confirm" closedby="any">…</dialog>
```

---

## 6. Performance and quality

### 6.1 Core Web Vitals (unchanged thresholds, p75 of page loads, mobile and desktop separately)

[P: GoogleChrome/web-vitals README: `LCPThresholds [2500, 4000]`, `INPThresholds [200, 500]`, `CLSThresholds [0.1, 0.25]`; P: web.dev]

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |

- **Misinformation alert:** several 2026 SEO blogs claim "LCP was tightened to 2.0s in the March 2026 core update" [S]. The official web-vitals library and web.dev still use 2.5s. Don't propagate the 2.0s claim, though aiming for about 2.0s gives useful headroom.
- INP replaced FID in March 2024. Supporting metrics: TTFB (≤0.8s good), FCP (≤1.8s).
- **LCP**: put the LCP image in the initial HTML as `<img>` with `fetchpriority="high"`, explicit `width`/`height`, and never `loading="lazy"`. Preload only if it's CSS or JS-discovered. Lazy-load below-the-fold. Don't client-render the hero. Inline critical CSS. `preconnect` to critical origins [P: modern-web-guidance performance; P: Vercel].
- **INP**: break long tasks (>50ms), yield with `scheduler.yield()` (fallback to `setTimeout`), update UI first and compute after, debounce input handlers, move heavy work to workers, avoid layout thrash, and keep controlled-input loops cheap [P].
- **CLS**: dimensions on media, skeletons that match final layout, `font-size-adjust`/`size-adjust` fallback metrics, no content injected above existing content, `scrollbar-gutter: stable`, animate transforms not layout.

### 6.2 Images and media

- Formats: **AVIF** first (Baseline 2024; best compression), **WebP** fallback, JPEG/PNG legacy. SVG for icons and illustrations. **JPEG XL** is supported in Safari and is an Interop 2026 *investigation* area; don't depend on it [S/K].
- `srcset` + `sizes` (or `<picture>`); serve at 1×/2× DPR (cap at 2). `decoding="async"` for non-LCP. Use an image CDN for on-the-fly resizing.
- Video over GIF: `<video autoplay muted loop playsinline>` with a poster, pause under reduced motion. Safari can play MP4 in `<picture>` [P: Vercel].
- Decorative images via CSS `image-set()`; hidden from assistive tech.

### 6.3 Fonts

- Self-host WOFF2 variable fonts. Subset via `unicode-range` and limit axes. **Preload only the 1–2 critical faces** (`<link rel="preload" as="font" type="font/woff2" crossorigin>`) [P: Vercel].
- `font-display: swap` for brand text (FOUT beats FOIT); `optional` for the fastest non-critical text.
- Metric-matched fallbacks: `@font-face{ src: local("Arial"); size-adjust; ascent-override; descent-override; line-gap-override }` (Next.js `next/font` and Fontaine automate this), or `font-size-adjust: from-font` [P].
- Budget: about ≤100KB total font transfer for most sites; 2 families, variable.

### 6.4 JS and CSS budgets [K, heuristics]

- Content and marketing pages: aim for ≤ about 150–200KB compressed JS on the critical path (ideally near zero via SSG/RSC/islands). Apps: ≤ about 300–400KB for the initial route, with the rest code-split per route. CSS ≤ about 50–100KB compressed. Measure on a mid-range Android with 4× CPU throttle and slow 4G [P: Vercel "Throttle when profiling"; "Test iOS Low Power Mode & macOS Safari"].
- Third-party scripts (analytics, chat widgets, A/B tools) are the usual INP and LCP killers. Load them after interaction or idle, use facades for embeds, and batch analytics beacons.
- Virtualise long lists; use `content-visibility: auto` for long pages.
- Speculation Rules / prerender for likely next navigations (Chromium) [K].

### 6.5 Accessibility: WCAG 2.2 AA is the bar

WCAG 2.2 (Recommendation, Oct 2023) added 9 SC and removed 4.1.1 Parsing [P: w3c/wcag sc/22]:

| SC | Level | Requirement (paraphrased from spec) |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | **AA** | focused component not *entirely* hidden by author content (sticky headers, banners) |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA | no part hidden |
| 2.4.13 Focus Appearance | AAA | indicator ≥ area of 2px perimeter, ≥3:1 focused-vs-unfocused contrast |
| 2.5.7 Dragging Movements | **AA** | any drag operation achievable with a single pointer without dragging (e.g. buttons, menus "Move to…") |
| 2.5.8 Target Size (Minimum) | **AA** | ≥24×24 CSS px, or spacing so 24px circles don't overlap; exceptions for equivalent, inline, UA control, essential |
| 3.2.6 Consistent Help | A | help mechanisms in the same relative order across pages |
| 3.3.7 Redundant Entry | A | don't make users re-enter info in the same process |
| 3.3.8 Accessible Authentication (Minimum) | **AA** | no cognitive function test (passwords from memory, puzzles) unless there's an alternative or mechanism (paste, password managers, passkeys); object recognition allowed |
| 3.3.9 Accessible Authentication (Enhanced) | AAA | no object-recognition or personal-content exceptions |

Frequently failed pre-2.2 criteria worth encoding in skills: 1.1.1 alt text; 1.3.1 semantics (headings, lists, labels, tables); 1.4.3 text contrast 4.5:1; **1.4.10 Reflow at 320 CSS px** (no 2-D scroll); 1.4.11 non-text contrast 3:1; 1.4.12 text spacing; **1.4.13 Content on hover/focus** (dismissible with Esc, hoverable, persistent); 2.1.1 keyboard; 2.4.3 focus order; 2.4.7 focus visible; 2.2.2 pause/stop/hide; 4.1.2 name/role/value; 4.1.3 status messages (live regions).

Practical rules [P: Vercel]: semantics before ARIA; a skip link; hierarchical headings; icon-only buttons get `aria-label`; decorative images get `alt=""`/`aria-hidden`; links are `<a>` (never `div`/`button` for navigation); modals trap and return focus (native `<dialog>` does this); async updates announced via polite live regions; never disable zoom. EAA enforcement began 2025-06-28 (EN 301 549 → WCAG 2.1 AA today, with 2.2 expected in the next EN revision [K]).

**Motion preferences**
```css
@media (prefers-reduced-motion: reduce) {
  /* swap movement for fades, shorten, stop autoplay/parallax/scroll-linked motion */
  .hero-anim { animation: none; }
  ::view-transition-group(*) { animation-duration: 0s; }
}
```
Don't nuke all transitions globally (it breaks state feedback and JS springs). Keep opacity crossfades ≤200ms. Also consider `prefers-contrast: more` (thicker borders, stronger text tokens), `forced-colors: active` (use system colours; don't rely on box-shadow or backgrounds for meaning), and `prefers-reduced-transparency` (solid fallback for glass; limited support) [K].

### 6.6 Internationalisation and RTL

[P: Vercel Content section; K]
- Use **logical properties** everywhere (`margin-inline-start`, `padding-block`, `inset-inline-end`, `border-start-start-radius`, `text-align: start`). Tailwind v4.3 extended logical utilities [P]. `dir="rtl"` on `<html>` and `dir="auto"` for user-generated content. Mirror directional icons (arrows, chevrons, progress) but not logos, media controls, or clocks. Use `:dir(rtl)` for exceptions.
- **Text expansion**: allow 30–40% growth for German, Finnish, and Russian (up to 200–300% for very short strings); never fixed-width buttons. CJK needs larger line-height (about 1.7–1.8) and no letter-spacing, and doesn't have italics. Thai, Arabic, and Devanagari need font fallbacks with correct shaping and larger x-heights.
- Format with `Intl.*` (`NumberFormat`, `DateTimeFormat`, `RelativeTimeFormat`, `ListFormat`, `PluralRules`, `DurationFormat` (Baseline newly available)). Detect language via `Accept-Language`/`navigator.languages`, **not IP** [P: Vercel].
- `translate="no"` on brand names, code, and identifiers [P: Vercel]. `lang` attributes on mixed-language passages. Locale-aware keyboard shortcuts (non-QWERTY) [P: Vercel].
- Icons with embedded text and concatenated strings don't localise; use ICU message format.

---

## 7. Landing / marketing site vs product app UI

### 7.1 Marketing pages that convert in 2026

[S: userpilot, flowout, orbix, genesysgrowth, designrevision; K]
- **The 5-second test**: the hero answers *what it is, who it's for, and why it's better*, with a **specific** outcome ("Close your books in 2 days, not 10") rather than "Build the future of X". A concrete number beats a generic claim. Sentence case headlines, ≤ about 8–10 words, with a subhead of 1–2 lines that names the mechanism.
- **Show the product in the hero**: a real screenshot, short muted loop, or interactive demo (a split hero with copy on the left and product on the right is the conversion default). Abstract art, blobs, or 3D orbs are slop. One primary CTA (outcome verb: "Start free trial", "Create your first project") plus one secondary (demo, docs, pricing).
- **Tiered social proof, mapped to objections**: a recognisable logo strip under the hero; specific testimonials with **real name, photo, title, company, and a measurable result**; third-party review badges (G2, Capterra, Product Hunt) near CTAs (claimed +15–22% conversion [S], indicative only). **Never fabricate testimonials or logos.**
- A typical order that works: Hero → logos → problem/benefit (the "why now") → how it works (3 steps *only if it really is 3 steps*) → feature deep-dives with real product visuals (bento *with unequal cells* or alternating rows) → proof (case study with numbers) → integrations → security/compliance (B2B) → **visible pricing** (at least one tier; no "contact sales" wall to start) → objection-answering FAQ → final CTA → substantive footer (docs, changelog, status, careers).
- 2026 differentiators: **the changelog and docs as marketing** (Linear, Vercel, Raycast ship visible weekly progress); live interactive demos instead of videos; developer-first proof (code snippets, `npx` one-liners, open-source repos, benchmarks); personalised or segmented pages for multi-stakeholder B2B; fast pages (marketing LCP ≤2s is a conversion lever).
- Typography and scale: bigger ratio (1.333–1.5), fluid display type, generous section spacing (96–160px desktop), editorial rhythm, one signature visual idea carried throughout.
- Motion: one orchestrated hero moment, scroll-linked storytelling only where it explains the product, and everything readable with motion off.
- Mobile first: about 60%+ of top-of-funnel traffic is mobile. A sticky bottom CTA on long mobile pages. Forms ≤3–5 fields for lead capture. Work-email validation is gentle.

### 7.2 Product (app) UI

- Optimise for **repeat use, speed, and density**, not first impressions. Type ratio 1.125–1.2, body 13–14px acceptable in dense tools (16px for content-heavy or consumer apps), 32–36px controls, 8px rhythm.
- **Keyboard-first**: command palette (⌘K), single-key shortcuts with discoverable hints (tooltips show the shortcut), full focus management, and Esc closes the topmost layer.
- **URL is state** (filters, tabs, selection, pagination). Back/forward and scroll restoration work. Deep-link everything [P: Vercel].
- **Optimistic, instant, and local-first** where possible. Skeletons per region. Never a full-page spinner after first load.
- Navigation: a sidebar for ≥5 top-level areas, with breadcrumbs or a title bar for depth; tabs for peer views; sheets or drawers for focused subtasks; modals only for blocking decisions [P: cc-skills]. Never modal-on-modal.
- Settings: grouped, searchable, and saving instantly for toggles; explicit Save only for batched forms. Show "Saved" feedback inline.
- Onboarding: empty states that teach; sample data; progressive disclosure; checklists that disappear when done.
- Consistency beats novelty: the same verb for an action everywhere, one icon per concept, and consistent placement (WCAG 3.2.6 consistent help) [P: Anthropic writing rules; P: WCAG].
- Visual register: calm neutrals, the accent reserved for primary actions and selection, status colours semantic and always paired with text or icon. Charts follow the same tokens.

---

## 8. Checklists to seed SKILL.md files

**Pre-build (design plan)**
- [ ] Subject, audience, and primary job stated; real content gathered.
- [ ] 4–6 named colours (OKLCH + hex), accent hue outside 250–320 unless the brief demands it; neutrals tinted.
- [ ] Type: display + body roles (or one family, deliberately), a stated scale ratio, weights (≤2–3), and measure.
- [ ] Layout concept with ASCII wireframe and alignment rule; one signature move named.
- [ ] Plan compared against the default output for a similar prompt; generic parts revised.
- [ ] DESIGN.md written or updated; tokens in DTCG or `@theme`.

**Build**
- [ ] Semantic tokens only in components; light and dark via `light-dark()` or theme selectors; `color-scheme` set.
- [ ] Every component: hover, active, focus-visible, disabled, loading, error, empty.
- [ ] Focus ring 2px + offset, 3:1, not obscured by sticky UI.
- [ ] Targets ≥24px (44px on touch); drag has a click alternative.
- [ ] Text contrast ≥4.5:1 (3:1 large), UI ≥3:1, in both themes.
- [ ] Body 16px, line-height 1.5–1.7, measure ≤75ch, `text-wrap: balance` on headings.
- [ ] Nested radius = outer − padding; layered shadows *or* hairlines per surface.
- [ ] Motion ≤300ms, ease-out, transform/opacity only, reduced-motion variant, no `transition: all`.
- [ ] Forms: labels, autocomplete, `:user-invalid` timing, focus first error, never block paste.
- [ ] Tables: numbers right-aligned, `tabular-nums`, sticky header.
- [ ] LCP image prioritised, fonts preloaded and subset, media dimensioned, INP-safe handlers.
- [ ] Logical properties; `Intl` formatting; tested with long strings and RTL.

**Slop audit (fail = regenerate that part)**
- [ ] No purple/indigo gradient, gradient text, glow blobs, or decorative glass.
- [ ] No Inter/Geist/Space Grotesk/Instrument Serif *by reflex*; no single-word headline accent; no ALL-CAPS eyebrow on every section.
- [ ] Not hero + 3 icon cards + testimonials + pricing + CTA as the only structure; no identical card grids; no nested cards; no side-stripe cards.
- [ ] No emoji icons; one coherent icon set.
- [ ] No fake testimonials, logos, or metrics; no lorem; no buzzwords; specific CTAs.
- [ ] No cream + serif + terracotta, acid-green-on-black, or broadsheet by reflex.
- [ ] Not identical fade-up on every section.
- [ ] A single identifiable signature move exists.

---

## 9. Open questions and things to verify before publishing skills

- Anchor positioning's Baseline label: search sources say Baseline Newly available in Jan 2026 (Firefox 147), but the modern-web-guidance data printed an odd "Safari 27 only" line in some guides (probably a web-features re-scoping to include newer sub-features). Recommend `@supports (anchor-name: --a)` detection plus the polyfill (`@oddbird/css-anchor-positioning`) or a sensible default position.
- Scroll-driven animations in Firefox stable: expected in 2026 via Interop but not confirmed as of June 2026 (Firefox 152).
- `text-wrap: pretty` in Firefox and `interpolate-size` in Safari/Firefox: check before claiming Baseline.
- APCA values are guidance only; keep WCAG 2 as the compliance gate.
- The DESIGN.md spec is "alpha"; the schema may change.
- Numbers from marketing blogs (67% bento, +15–22% from badges) are indicative, not research-grade.

---

## 10. Sources

**Primary (cloned or spec text, in `scratchpad/refs6/`)**
- Vercel Web Interface Guidelines: https://github.com/vercel-labs/web-interface-guidelines (README.md, AGENTS.md)
- DTCG technical reports 2025.10 (format, color, resolver): https://github.com/design-tokens/community-group ; https://www.designtokens.org/tr/2025.10/format/ ; announcement https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/ ; final report https://w3c.github.io/cg-reports/design-tokens/CG-FINAL-format-20251028/
- DESIGN.md spec (Google Labs / Stitch): https://github.com/google-labs-code/design.md (docs/spec.md, README) ; https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/
- Anthropic frontend-design skill: https://github.com/anthropics/skills/tree/main/skills/frontend-design ; blog https://claude.com/blog/improving-frontend-design-through-skills
- samber/cc-skills frontend-design-deslop (slop-checklist, typography, color-oklch, dark-mode, motion, components, design-md): https://github.com/samber/cc-skills
- GoogleChrome modern-web-guidance (Baseline data and platform guides): https://github.com/GoogleChrome/modern-web-guidance
- shadcn/ui theming (v4): https://ui.shadcn.com/docs/theming (repo apps/v4/content/docs/(root)/theming.mdx)
- Tailwind CSS v4 theme docs and v4.3 release: https://tailwindcss.com/docs/theme ; repo tailwindlabs/tailwindcss.com src/blog/tailwindcss-v4-3
- Radix Colors, understanding the scale: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- WCAG 2.2 SC text: https://github.com/w3c/wcag (guidelines/sc/22)
- web-vitals thresholds: https://github.com/GoogleChrome/web-vitals (README "Rating Thresholds")

**Secondary (search results, 2025–2026)**
- AI slop: https://smoothui.dev/blog/ai-design-slop ; https://www.925studios.co/blog/ai-slop-design-tells ; https://www.925studios.co/blog/ai-slop-web-design-guide ; https://dev.to/james_anderson_h/the-purple-gradient-problem-why-ai-ui-all-looks-alike-and-how-to-fix-it-3j65 ; https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p ; https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website ; https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it ; https://vibecodekit.dev/ai-slop-design ; https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c ; https://solodesign.cc/blog/ai-design-slop-the-tells/ ; https://www.braingrid.ai/blog/design-system-optimized-for-ai-coding ; Adam Wathan: https://x.com/adamwathan/status/1953510802159219096 ; Hallmark: https://dev.to/rams901/hallmark-stop-ai-generated-ui-slop-in-one-command-in-2026-3p9n
- Premium UI: https://studiomaydit.com/blog/linear-vercel-raycast-aesthetic ; https://mantlr.com/blog/stripe-linear-vercel-premium-ui ; https://www.setproduct.com/blog/complete-guide-to-blueprint-grid-design ; Linear redesign: https://linear.app/now/how-we-redesigned-the-linear-ui
- Trends: https://fireart.studio/blog/the-best-web-design-trends/ ; https://elements.envato.com/learn/web-design-trends ; https://www.creativebloq.com/design/fonts-typography/breaking-rules-and-bringing-joy-top-typography-trends-for-2026 ; https://www.fontfabric.com/blog/10-design-trends-shaping-the-visual-typographic-landscape-in-2026/ ; https://www.b12.io/resource-center/website-design/web-design-guide-bento-grids-and-kinetic-typography/
- Fonts: https://maxibestof.one/typefaces/geist ; https://www.npmjs.com/package/geist
- OKLCH: https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl ; https://oklch.com
- Generative and agent UI: https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026 ; https://www.eleken.co/blog-posts/generative-ui ; https://fuselabcreative.com/ui-design-for-ai-agents/ ; https://www.setproduct.com/blog/ai-chat-interface-ui-design ; https://github.com/narrowin/awesome-generative-ui
- Platform: Interop 2026 https://webkit.org/blog/17818/announcing-interop-2026/ , https://web.dev/blog/interop-2026 , https://hacks.mozilla.org/2026/02/launching-interop-2026/ ; anchor positioning https://www.oddbird.net/2025/10/13/anchor-position-area-update/ , https://www.refontelearning.com/blog/css-anchor-positioning-reaches-baseline ; scroll-driven https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations/ ; VT https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available , https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
- Accessibility: WCAG 3 draft news https://www.w3.org/WAI/news/2026-09-10/wcag3/ ; Adrian Roselli http://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html ; https://yatil.net/blog/wcag-3-is-not-ready-yet ; WCAG 2.2 https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2/
- CWV: https://web.dev/articles/vitals ; https://web.dev/articles/defining-core-web-vitals-thresholds
- Landing pages: https://userpilot.com/blog/saas-landing-pages/ ; https://www.flowout.com/blog/saas-landing-page-design ; https://www.orbix.studio/blogs/saas-website-best-practices ; https://genesysgrowth.com/blog/designing-b2b-saas-landing-pages
