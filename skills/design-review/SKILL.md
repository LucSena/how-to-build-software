---
name: design-review
description: Use when asked to review, audit, critique, or QA a user interface — a web page, web app screen, component, design mockup, screenshot, or iOS/Android app — before release or after a build. Covers Nielsen heuristic scoring, accessibility, visual quality and AI-slop checks, interaction states, performance and implementation issues, design-system consistency, P0–P3 severity, evidence rules, and the review report. Also use when the user says "what do you think of this design?", "roast my landing page", "why does this feel off?", "is this ready to ship?", "UX audit", or shares a screenshot asking for feedback. Not for reviewing code correctness or PRs; use code-review. For deep WCAG work use accessibility; for choosing a new visual direction use design-taste.
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "ux-principles accessibility design-taste interaction-design design-systems web-platform"
---

# Design Review

A design review is only useful if another person can act on it without asking what you meant. This skill runs the same passes in the same order every time, scores usability honestly, separates what you saw from what you guessed, and gives every finding a severity and exactly one fix. It favors a short list of verified, high-impact findings over a long list of opinions.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also read `DESIGN.md` (or the token files / component library) if present: consistency findings are judged against the project's own system, not your taste. Identify the **surface mode** — Persuade (landing, pricing), Operate (app UI, dashboards), Read (docs, articles), or Experience (portfolio, campaign) — because it changes what "good" means.

## Core principles

1. **Evidence or it did not happen.** Report only what you can point to: a code line, a screenshot region, a measured value. Everything else is labeled Inferred or goes under Not checked.
2. **One finding, one fix.** Each finding names a single, specific change; "consider improving hierarchy" is not a fix.
3. **Severity is about users, not taste.** P0 blocks a task; polish preferences are P3 at most.
4. **Score honestly.** A 4 means genuinely excellent; most real interfaces land between 20 and 32 of 40.
5. **Same order every time.** Usability → accessibility → visual → states → performance/tech → consistency; later passes do not rewrite earlier scores.
6. **Bounded iteration.** Fix in batches, re-check at most twice, then get fresh eyes; endless polishing hides that the concept may be wrong.
7. **Say what works.** Name the 2–3 strengths to keep so fixes don't destroy them.

## Workflow

- [ ] **1. Gather.** Define scope (screens, flows, the primary task per screen). Collect evidence: running UI, screenshots, source files, DESIGN.md/tokens. Web: capture **1440 px desktop and 390 px mobile**, check the first viewport at 1280–1600 px, dark mode if supported, 200% zoom. Native: simulator/emulator screenshots at phone and tablet sizes, light/dark, largest text size. If you cannot run it, say so; the review becomes code- or image-based and every runtime claim is Inferred.
- [ ] **2. Heuristic pass.** Walk the primary task. Score Nielsen's 10 heuristics 0–4 with one key issue each (`references/scoring-rubric.md`). Mark `n/a` only when a heuristic cannot apply (e.g., 7 and 10 on a landing page) and renormalize the total.
- [ ] **3. Accessibility pass.** Keyboard walk, focus visibility and order, names/labels, contrast (text 4.5:1, UI 3:1, both themes), targets (24 px minimum, 44 pt / 48 dp on touch), reduced motion, zoom/reflow. Use `accessibility` for depth.
- [ ] **4. Visual and taste pass.** Hierarchy (squint test), typography, spacing rhythm, color strategy, alignment, imagery, copy quality, and the **slop check** below.
- [ ] **5. Interaction-states pass.** Every control: default, hover (pointer only), focus-visible, active, disabled, loading. Every data view: loading, empty, error, partial, ideal. Long/short/missing content, offline, permissions.
- [ ] **6. Performance and implementation pass.** Layout shift, slow LCP element, janky motion, unsized media, hard-coded values instead of tokens, broken responsive branches, console errors.
- [ ] **7. Consistency pass.** Compare against DESIGN.md, tokens, shared components, and neighboring screens; classify drift (missing token / one-off implementation / conceptual mismatch / local defect).
- [ ] **8. Rate and cut.** Assign P0–P3, merge duplicates (one root cause = one finding), drop unsupported candidates, keep the P3 list short.
- [ ] **9. Report** in the Output format. If asked to fix, run the fix loop below.

## Review depth

Default: **Standard**. Pick the depth from what the user gave you and what is at stake, and state it in the report header.

| Depth | When | Passes | Output |
|---|---|---|---|
| Quick critique | A single screenshot or mockup, "what do you think?" | Heuristic scores (rendered-evidence ones only; others `n/a` or Not checked), visual/slop, obvious a11y (contrast, targets, labels visible) | Verdict, scores, top 3–5 findings |
| Standard | A screen or flow with code or a running build | All seven passes at the captured viewports | Full report |
| Pre-release | Launch gate, a redesign, or a regulated product | Standard + screen reader pass, both themes, native devices/tablets, real content and edge cases, fresh-eyes disposition | Full report + disposition |

Never present a Quick critique as if it were an audit: its Not checked list is long, and it says so.

## Evidence rules

- **Observed**: you saw it in the running UI or screenshot, or read it in source that you verified reaches the screen. Cite `file:line` with the quoted snippet, or describe the screen region ("pricing card 2, CTA below the fold at 390 px").
- **Inferred**: likely from code or partial evidence, not seen in runtime (e.g., "no `:focus-visible` style found in `Button.css`; focus ring likely invisible").
- **Not checked**: in scope but not verified (no screen reader available, dark mode not rendered, Android not run). List these explicitly; silence reads as a pass.
- Before reporting, try to **falsify each finding**: re-open the source, check for an override, a deliberate exception in DESIGN.md, or a variant that already handles it. Delete findings that do not survive.
- Hierarchy, clarity, and "feel" findings need rendered evidence (screenshot or live UI); from code alone they are Inferred at best.
- Never invent metrics ("this will raise conversion 20%"); state the mechanism instead.

## Scoring

Nielsen's heuristics, each 0–4 (0 = absent/broken, 1 = major gaps, 2 = partial, 3 = good with minor gaps, 4 = excellent):

1 Visibility of system status · 2 Match with the real world · 3 User control and freedom · 4 Consistency and standards · 5 Error prevention · 6 Recognition rather than recall · 7 Flexibility and efficiency · 8 Aesthetic and minimalist design · 9 Help users recover from errors · 10 Help and documentation

| Total (/40) | Percentage | Rating |
|---|---|---|
| 36–40 | 90%+ | Excellent — polish only |
| 28–35 | 70%+ | Good — fix weak areas |
| 20–27 | 50%+ | Acceptable — significant work before users are happy |
| 12–19 | 30%+ | Poor — core experience broken |
| 0–11 | < 30% | Critical — redesign |

With `n/a` heuristics, print the real maximum (e.g., 24/32) and read the band from the percentage. Criteria per heuristic, cognitive-load checklist, and personas: `references/scoring-rubric.md`.

## Severity

| Level | Meaning | Examples |
|---|---|---|
| **P0 Blocking** | Prevents task completion for some users, loses data, or misleads | Submit unreachable by keyboard; form wipes input on error; price shown differs from charged price; content invisible without JS |
| **P1 Major** | Significant difficulty, WCAG AA failure, or broken trust | Body text at 3:1 contrast; no error message on failure; primary CTA below the fold on mobile; layout breaks at 390 px |
| **P2 Minor** | Annoyance with a workaround; inconsistency | Missing hover state; inconsistent button styles; 400 ms ease-in transitions; vague empty state |
| **P3 Polish** | Nice to fix; no real user impact | Optical alignment of an icon; slightly loose letter-spacing |

Tiebreak: "Would a user contact support or abandon because of this?" If yes, it is at least P1. Not everything can be P0; if more than a few findings are P0, re-check your calibration.

## Slop check (as of 2026-09)

Generic, default-looking output is a finding when the surface is meant to represent a brand (Persuade/Experience) or when defaults hurt usability. Flag a pattern when it appears **by reflex rather than by decision**; any of these can be right for a specific brief. Full list: `references/audit-checklists.md`.

- Purple/indigo-to-blue gradients, gradient text, glow blobs, decorative glassmorphism.
- The same fonts every generator picks (Inter, Geist, Space Grotesk, Instrument Serif, Fraunces…) used as the brand voice without a reason; one flat type scale.
- Centered hero → three identical icon cards → testimonials → pricing → CTA as the whole page; nested cards; one large radius on everything; thick colored left border on cards.
- Tracked uppercase eyebrow above every heading; `01 / 02 / 03` markers on non-sequential content; "→" on every link.
- Fade-and-rise on every section, hover lift on every card, bounce easing, pulsing dots.
- Emoji as icons; fake product screenshots built from divs.
- Fabricated testimonials, logos, or metrics; lorem ipsum; buzzwords ("seamless", "supercharge", "unlock"); "Get started" / "Submit" CTAs.
- Second-order defaults: cream background + serif + terracotta; near-black + single acid-green accent; hairline broadsheet layout with zero radius — when chosen by reflex.

Test: *could someone guess this design from the product category alone?* If yes, the visual layer needs a decision (route to `design-taste`).

## Fix loop

When asked to fix what the review found:

1. Fix in one batch, highest severity first: broken tasks and inaccessible paths → missing states → hierarchy/responsive/system drift → visual and motion → cleanup.
2. Re-capture the same evidence set (same viewports, themes, flows) and re-check only the affected findings plus regressions.
3. Allow **at most two** fix-and-verify rounds. Then stop polishing and request a **fresh-eyes review**: a new reviewer (another agent or subagent with no conversation history, or a human) given only the evidence set and the original goals. It returns one disposition: `ship`, `fix` (named remaining issues), `rebuild` (concept problem), or `recapture` (evidence was insufficient).
4. If after two rounds the same P0/P1 issues recur, the problem is structural; say so and recommend a redesign of that part instead of another polish pass.

Preserve what works: polish is refinement, not a disguised redesign. Ask before changing copy claims, brand elements, URLs, or navigation labels.

## Web vs mobile specifics

- **Web**: viewports 1440 and 390 (plus the user's real one if known), keyboard-only walk, `prefers-reduced-motion`, dark mode, 200% zoom and 320 px reflow, Core Web Vitals signals (unsized images, late LCP, long tasks), hover gated to pointer devices.
- **iOS / Android**: platform conformance is critical — native navigation and back behavior (never disabled edge-swipe back; predictive back on Android), system components, safe areas/edge-to-edge, Dynamic Type / font scale, 44 pt / 48 dp targets, VoiceOver/TalkBack labels, dark mode, tablet/foldable layouts. The tell is "a website ported into an app" or "an iOS app in Android's clothes". Details in `ios-design` / `android-design`.

## Gotchas

- **Reviewing only the happy path at one desktop width.** Most real defects live in mobile widths, empty/error states, long content, and keyboard use.
- **Opinions without evidence.** "Feels cluttered" is not a finding; "the pricing page shows 11 options at the plan decision point, 3 primary-styled buttons compete (screenshot region: header right)" is.
- **Vague fixes.** "Improve contrast" → "change `--text-muted` from #9CA3AF to #6B7280 (4.8:1 on white)".
- **Score inflation.** Giving 3–4 everywhere hides the real problems; justify each score with the key issue.
- **Severity by visibility instead of impact.** An ugly icon is P3; an invisible focus ring on the checkout button is P1.
- **Duplicate findings for one root cause.** Twelve "missing hover state" rows are one systemic finding: "Button component has no hover token".
- **Treating the slop list as law.** Flag defaults chosen by reflex; don't penalize a deliberate, well-executed choice that happens to be on the list.
- **Trusting automated scores.** Lighthouse 100 or a clean axe run does not mean usable; say what the manual passes found.
- **Endless fix loops.** After two rounds, stop and get fresh eyes; repeated churn means the concept or requirements are the issue.
- **Recommending dark patterns to "improve conversion".** Confirmshaming, fake urgency, hidden costs, or pre-checked consent are never fixes.
- **Reviewing against your taste instead of the project's DESIGN.md.** Consistency is measured against their system.

## Output format

```
# Design review: <surface> · <date>
Scope: <screens/flows> · Mode: <Persuade|Operate|Read|Experience> · Platforms: <web 1440/390, iOS 26 sim…>
Evidence: <running UI | screenshots | source only> · Method notes: <tools, AT used>

## Verdict
<2–3 sentences: overall impression, biggest opportunity, ship / fix / rebuild>

## Scores
| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Save has no confirmation |
… (all 10)
| **Total** | | **27/40** | **Acceptable** |

## What works (keep)
- <specific strength and why>

## Findings
| ID | Sev | Pass | Location | Evidence (Observed/Inferred) | Fix |
|----|-----|------|----------|------------------------------|-----|
| F1 | P0 | A11y | Checkout › Pay button (`PayButton.tsx:18`) | Observed: `<div onClick>`, unreachable by Tab | Replace with `<button type="submit">` |
| F2 | P1 | States | Projects list, empty | Observed (390 px screenshot): blank area, no message | Add empty state: "No projects yet" + "Create project" button |

## Systemic patterns
- <recurring root causes, e.g. "hard-coded hex colors in 14 components; no semantic tokens">

## Not checked
- <what was out of reach and why>

## Next steps
1. <P0/P1 fixes in order>  2. <which skill to load for each: accessibility, design-taste, interaction-design…>
```

Keep Findings to the highest-impact items (typically 5–15); put minor observations in a short list after the table.

## References

| File | Read when |
|---|---|
| `references/scoring-rubric.md` | Scoring the heuristics, running the cognitive-load checklist, choosing personas, or calibrating severity |
| `references/audit-checklists.md` | Running the accessibility, visual/slop, states, performance/implementation, consistency, or native-platform passes item by item |

## Related skills

- `ux-principles` — the laws and heuristics behind the scores, for explaining *why* a finding matters.
- `accessibility` — full WCAG 2.2 AA audit when the a11y pass finds more than a few issues.
- `design-taste` — when the verdict is "generic" and the visual direction needs a decision, not polish.
- `interaction-design` — designing the missing states, errors, and feedback the review found.
- `design-systems` — when consistency findings show missing tokens or component drift.
- `web-platform` — performance and platform fixes (CWV, dark mode, RTL).
- `code-review` — for correctness review of the implementation itself.
