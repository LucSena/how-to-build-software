# AI-slop catalog (as of 2026-09)

A tell is a **default reached for when the axis was free**. It is not a banned technique. Every item below is legitimate when the brief or the subject earns it. The question is always: *"Is this the most probable output for this category, or a choice made for this brief?"*

The fingerprint moves quickly. In 2024 the tells were purple gradients and Inter. By 2026 the second-order tells (cream + serif + terracotta, Geist, eyebrows) are just as recognizable. Re-date this file whenever you update it, and keep teaching the test, not only the list.

## Contents

1. Why slop happens
2. First-order tells (2023–2025 fingerprint)
3. Second-order tells (2026 fingerprint)
4. Build-quality tells
5. Copy and content tells
6. Detection hints (grep/CSS signatures)
7. De-slop swaps

---

## 1. Why slop happens

- **Distributional convergence.** Models sample from the center of their training data, and safe choices that offend no one dominate web code.
- **Template inheritance.** Years of starter kits used `bg-indigo-500` and `from-indigo-500 to-purple-600`, so models learned that "buttons are indigo". Tailwind's creator publicly apologized for that default in 2025.
- **Feedback loops.** AI-built sites re-enter the training data, so a trend spreads in weeks.
- **Root cause: a missing decision.** Nothing told the model to decide. The fix is a written direction and tokens (see `design-systems`), not a longer ban list.

## 2. First-order tells (2023–2025 fingerprint)

**Color and surface**
- Purple/indigo/violet gradients on heroes and CTAs, and any accent in OKLCH hue ≈ 250–320 by default.
- Gradient text on headings or metrics.
- Radial glow or spotlight haze behind the hero; floating blurred orbs and mesh blobs.
- Colored glow shadows on dark UI ("cyberpunk by reflex").
- Decorative glassmorphism: frosted cards over a gradient.
- Gray text on colored backgrounds.
- A timid rainbow palette with no dominant color.
- A dark mode nobody asked for, or a random dark section in the middle of a light page.

**Typography**
- Inter, Roboto, Arial, Open Sans, Lato, Montserrat, Poppins, or `system-ui` as the *display* or brand voice.
- A flat scale (adjacent steps less than 1.25× apart) with no display/body distinction.
- A full-sentence headline blown up to display size and wrapping to 4–6 lines.
- Tracking crushed past about −0.04em on display type.

**Layout and components**
- The page skeleton is *only* this: centered hero (pill chip → giant headline → subhead → two buttons) → logo strip → 3 feature cards (icon tile + heading + two lines) → testimonials → 3-tier pricing → CTA → 4-column footer.
- Identical same-size card grids as the only device. Cards nested in cards.
- An icon in a rounded square above every heading.
- The side-tab accent: a 3–4px colored `border-left` on rounded cards, callouts, or alerts.
- A gray 1px border *and* a wide diffuse shadow on the same card.
- `rounded-2xl` or larger on everything, one radius regardless of size.
- The same soft `rgba(0,0,0,.1)` shadow under every card.
- Emoji as icons; the unmodified default icon set defining the look.
- Pulsing "live" dots on things that are not changing; fake blinking carets; marquees.
- Scroll cues ("Scroll to explore", bouncing chevron) and custom cursors.

**Motion**
- The same fade-and-rise entrance on every section; hover lift on every card.
- Bounce or elastic easing; image zoom on hover by default.
- Idle loops (float, breathe, shimmer) used to suggest "life".

## 3. Second-order tells (2026 fingerprint)

These appear once a model has been told "no purple, no Inter".

1. **Warm editorial cluster:** a cream background near `#F4F1EA`, a high-contrast serif display (often italic), and a terracotta or clay accent near `#D97757` with espresso-brown text. `#D97757` is Anthropic's own Claude accent, so on a user's brief it reads as a tell.
2. **Acid on black:** a near-black background with a single acid-green, lime, or vermilion accent and glowing edges.
3. **Broadsheet:** hairline rules everywhere, zero radius, dense newspaper columns, and roman-numeral or `No. 04` markers.
4. **SaaS-card kit, refreshed:** the same identical rounded cards, now with a subtle gradient wash and a 1px inner highlight.
5. **Template chrome:**
   - A tracked all-caps eyebrow above every heading (`FEATURES`, `HOW IT WORKS`).
   - Numbered section labels on content that is not a sequence (`01 / 02 / 03`, `001 · Capabilities`).
   - Meta strings joined with middle dots (`Design · Build · Ship`).
   - `WORD — fragment` labels built with a spaced em dash.
   - A monospace face for small "technical" labels on non-technical content.
   - `→` appended to every link and button.
   - A single word in the headline accented in italic, bold, or color.
6. **Reflex "alternative" fonts:** Geist, Space Grotesk, Instrument Sans/Serif, Fraunces, Plus Jakarta Sans, and DM Sans picked without a reason (see `fonts.md`).
7. **The hero metric:** a big number, a small label, three supporting stats, and a gradient accent.
8. **Decorative blueprint grid:** visible grid lines, crosshair corner marks, and mono labels, where the product has nothing to do with measurement or canvases.
9. **Performative craft copy:** "Quietly trusted by", "Field notes", "From the bench", "Currently building", and mock-humble micro-sentences under eyebrows.
10. **Split header:** a big headline on the left with a small explainer floating top-right, repeated on every section.

## 4. Build-quality tells

These are not a matter of taste. They are simply broken.
- Content stuck at `opacity: 0` until a scroll-reveal script runs. If the script fails, the page is blank.
- Headings with as much space below them as above, so they float away from their content.
- Less than 8px padding inside bordered containers; body text touching the viewport edge.
- Only resting states designed: no hover, focus-visible, active, disabled, loading, empty, or error.
- Font-weight changes on hover or selection, which cause layout shift.
- Popovers clipped by `overflow: hidden`; cards flush against one edge of a horizontal scroller.
- Unintended horizontal scroll on mobile, "fixed" with `overflow-x: hidden` on `<main>`. That hides the bug and breaks `position: sticky`.
- `h-screen` / `100vh` heroes that jump on mobile (use `dvh`/`svh`).
- `z-index: 9999` spam instead of a documented z-scale.

## 5. Copy and content tells

- Buzzwords: elevate, seamless, unleash, supercharge, empower, streamline, next-gen, world-class, enterprise-grade, cutting-edge, game-changer, "unlock your potential", "Build the future of X".
- Aphoristic cadence repeated across sections: "Not a feature. A platform." / "X. No Y."
- "X theater" framing ("security theater").
- Generic names and brands: John Doe, Jane Smith, Sarah Chen, Acme, Nexus, Flowbit, NovaCore.
- Fake-precise or fake-perfect numbers: `99.99%`, `10,000+ teams`, `4.9★` with no source. "Organic-looking" invented numbers (`47.2%`) are still fabrication.
- CTAs that say nothing: "Get Started", "Learn More", "Submit". Duplicate intents ("Get in touch" next to "Let's talk").
- The same message repeated in the label, sublabel, helper text, and tooltip.
- Em-dash saturation in body copy. Treat it as advisory: ranges and real parentheticals are fine. It becomes a tell at roughly one per sentence.
- "Oops!" errors and exclamation marks on success messages.

**The honesty rule:** demo data may be realistic, but it must be labeled synthetic to the user. Commercial claims (prices, customer names, benchmarks, testimonials, ratings, logos) are never invented.

## 6. Detection hints (grep/CSS signatures)

Use these on source or built CSS to find candidates quickly. Every hit needs a human judgment: is it earned?

| Tell | Signature to search |
|---|---|
| Indigo/violet gradient | `from-(indigo\|violet\|purple)-`, `linear-gradient\(.*(#6366f1\|#8b5cf6\|#7c3aed)`, `oklch\([^)]*\s(2[5-9]\d\|3[01]\d)\)` |
| Gradient text | `bg-clip-text`, `background-clip:\s*text` with `text-transparent` |
| Side-tab accent | `border-l-(2\|4\|8)` with a color on a rounded element; `border-left:\s*[3-9]px solid` |
| Uniform big radius | `rounded-(2xl\|3xl)` on more than about 70% of containers |
| Same shadow everywhere | one `shadow-*` class or `0 .* rgba\(0,\s*0,\s*0,\s*0?\.1\)` repeated across card components |
| Eyebrow above headings | `uppercase` + `tracking-(widest\|wider)` + `text-xs` directly before `h1`/`h2`, count per page |
| Numbered sections | `>0[1-9]<`, `01 /`, `No\. 0` in section headers |
| Emoji icons | emoji code points inside buttons, nav, or headings |
| Arrow suffix | `→</` or `&rarr;` at the end of most link labels |
| Glow | `shadow-\[0_0_`, `box-shadow:\s*0 0 \d+px` with a saturated color, `blur-3xl` on absolutely positioned blobs |
| Fade-up everywhere | the same `initial={{ opacity: 0, y: ` or `.reveal` class on every section |
| Hidden at rest | `opacity-0` / `opacity: 0` on content without a no-JS fallback |
| Reflex fonts | `Inter\b`, `Geist`, `Space Grotesk`, `Instrument`, `Fraunces`, `Plus Jakarta` in font stacks. Check whether they are justified |
| Fake proof | `John Doe\|Jane Smith\|Acme\|Lorem ipsum\|99\.9`, testimonials with no source in the brief |

## 7. De-slop swaps

| Tell | Swap for |
|---|---|
| Inter as the brand voice | A display face chosen for the brief, with a legible body face; or one characterful family with a real scale |
| Indigo gradient | One owned hue from product meaning, used at ≤ 10% on tinted neutrals, or committed at page scale |
| 3 icon cards | One real product artefact (a screenshot, live demo, code sample, or data viz), or an unequal bento where each cell shows something real |
| Border + diffuse shadow cards | Separation by surface lightness *or* a crisp hairline, not both; or no card, just spacing and a divider |
| `rounded-2xl` everywhere | A 2–3 step radius scale tied to size, with nested radii (`inner = outer − padding`) |
| Emoji icons | One icon family, one stroke width, corners matched to the UI radius |
| Fade-up everywhere | One page-load or reveal moment, plus motion that answers user actions |
| Eyebrow on every section | Delete it and let the heading speak. Keep an eyebrow only where it states a real category or breadcrumb |
| Hero metric triptych | A single sourced proof point in context, or real product output |
| "Get Started" | The outcome verb: "Create your first project", "Start free trial" |
| Cream + serif + terracotta | Ask what the subject's real materials and colors are, and derive from those |

## Sources

- Anthropic `frontend-design` skill (the five 2026 clusters, "visual structure is information", writing rules): https://github.com/anthropics/skills/tree/main/skills/frontend-design ; blog https://claude.com/blog/improving-frontend-design-through-skills
- Impeccable detector rules and craft floor (side-tab, icon-tile stack, overused fonts, hidden-at-rest, glow rules): https://github.com/pbakaus/impeccable
- Taste Skill (anti-slop lists, copy self-audit, content realism): https://github.com/Leonxlnx/taste-skill
- ui-skills `baseline-ui` (gradient and glow rules): https://github.com/ibelick/ui-skills
- samber/cc-skills `frontend-design-deslop` slop checklist: https://github.com/samber/cc-skills
- Adam Wathan on `bg-indigo-500` (Aug 2025): https://x.com/adamwathan/status/1953510802159219096
- Secondary write-ups used for cross-checking: https://www.925studios.co/blog/ai-slop-design-tells ; https://smoothui.dev/blog/ai-design-slop
