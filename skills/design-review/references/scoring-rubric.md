# Scoring Rubric

How to score Nielsen's 10 usability heuristics consistently, plus the cognitive-load checklist, persona walkthroughs, and severity calibration used by the design review.

## Contents
- How to score
- The 10 heuristics with anchors
- Rating bands and n/a handling
- Cognitive-load checklist
- Personas
- Severity calibration
- Specificity verdict

## How to score

1. Walk the **primary task** of each screen end to end first (sign up, create, search, pay), then secondary tasks.
2. For each heuristic, collect the evidence that raises or lowers it, then pick the anchor that best matches. Write the single most important issue in the "Key issue" column.
3. Score what exists, not what was intended. A missing state scores as missing.
4. When unsure between two numbers, choose the lower one and state why in the key issue.
5. Scores are per surface; average across screens only when they share a flow, and name the weakest screen.

## The 10 heuristics with anchors

Anchors for every heuristic: **0** absent or actively misleading · **1** rare/major gaps · **2** partial, notable gaps · **3** good, minor gaps · **4** excellent, consistent everywhere.

### 1. Visibility of system status
Check: pressed/loading states, save/submit/delete confirmation, progress in multi-step flows and long jobs, current location (active nav, breadcrumbs, step indicator), validation feedback, sync/offline status.
- 4: every action acknowledged within ~100 ms and resolved visibly; long work shows determinate progress.
- 2: some async actions silent; location unclear on deeper pages.
- 0: users cannot tell whether anything happened.

### 2. Match between system and the real world
Check: user vocabulary (no enum names, DB fields, raw error codes), familiar icons, natural ordering (fields in the order people think), real-world units and formats for the locale.
- 4: copy reads like the user's own language throughout.
- 2: jargon in settings or errors; odd field order.
- 0: internal system language dominates.

### 3. User control and freedom
Check: Undo for reversible actions, Cancel on long operations, Escape/close on every overlay, working Back (URL-driven state), easy exit from flows and onboarding, draft preservation.
- 4: every step reversible or escapable; destructive actions offer undo.
- 2: some dead ends; modals without Escape; Back breaks state.
- 0: users get trapped or lose work.

### 4. Consistency and standards
Check: one term per concept, one style per role (buttons, links, destructive actions), platform conventions (logo home link, back gestures, standard icons), internal consistency with the design system.
- 4: patterns, terms, and components consistent across the product and aligned with platform norms.
- 2: several competing button styles or terms ("Remove" vs "Delete").
- 0: every screen invents its own patterns.

### 5. Error prevention
Check: constraints (pickers, disabled invalid options, masks), smart defaults, inline validation at the right time, confirmation only for irreversible actions, prevention of double submission, clear requirements before input.
- 4: common slips are impossible; risky actions are guarded proportionally.
- 2: validation only on submit; destructive actions unguarded or over-guarded.
- 0: easy to make costly mistakes.

### 6. Recognition rather than recall
Check: persistent visible labels (no placeholder-only), visible options instead of hidden gestures, recent items and autocomplete, context carried across steps (order summary visible), no copying codes between screens.
- 4: users never need to remember information between screens.
- 2: some hidden navigation or disappearing labels.
- 0: the interface depends on memory.

### 7. Flexibility and efficiency of use
Check: keyboard shortcuts and a command palette for frequent actions, bulk actions, saved filters, sensible defaults, deep links, fast paths for experts that do not burden novices.
- 4: experts can move fast; novices are not burdened.
- 2: one path only, many clicks for frequent tasks.
- 0: repetitive tasks require repetitive manual work.
- Often `n/a` on landing pages, campaigns, and portfolios.

### 8. Aesthetic and minimalist design
Check: one primary action per view, clear hierarchy (squint test), no competing emphasis, no decoration that competes with content, restrained color, appropriate density for the mode.
- 4: the eye lands on the right thing first; nothing extraneous.
- 2: several elements compete; decoration adds noise.
- 0: cluttered; no discernible priority.

### 9. Help users recognize, diagnose, and recover from errors
Check: error messages in plain language that say what happened and how to fix it, placed next to the source, not by color alone, input preserved, retry/alternative offered, error ID secondary for support.
- 4: every error explains and offers a way forward.
- 2: generic "Something went wrong" or codes in some paths.
- 0: errors are silent, blame the user, or wipe input.

### 10. Help and documentation
Check: contextual help at complex fields, empty states that teach, searchable docs linked from where users get stuck, help placed consistently (WCAG 3.2.6).
- 4: help is contextual and rarely needed.
- 2: help exists but is hard to find or generic.
- 0: no help where users obviously need it.
- Often `n/a` on landing pages and campaigns.

## Rating bands and n/a handling

| Percentage of applicable maximum | Rating |
|---|---|
| ≥ 90% | Excellent |
| ≥ 70% | Good |
| ≥ 50% | Acceptable |
| ≥ 30% | Poor |
| < 30% | Critical |

With all ten scored the maximum is 40 (36–40 Excellent, 28–35 Good, 20–27 Acceptable, 12–19 Poor, 0–11 Critical). With `n/a` heuristics, print the real maximum (e.g., 24/32 = 75% = Good) and give a one-line reason for each `n/a`. Never print /40 over a partial set.

## Cognitive-load checklist

Mark each as pass/fail for the primary screen. 0–1 failures: low load; 2–3: moderate; 4+: high (a P1-level finding).

1. **Single focus**: one clear primary goal per screen.
2. **Chunking**: information grouped into small, labeled chunks (≤ ~4 items per group).
3. **Grouping**: related items visually grouped by proximity or common region.
4. **Visual hierarchy**: primary, secondary, and tertiary levels obvious at a glance.
5. **One thing at a time**: users are not asked to decide several unrelated things at once.
6. **Minimal choices**: ≤ ~4 visible options at a decision point (5–7 is pushing it, 8+ overloaded); one primary action, 1–2 secondary, the rest in a menu.
7. **Working memory**: no need to remember information from a previous screen.
8. **Progressive disclosure**: advanced options behind a visible affordance, not shown by default nor hidden without a way in.

## Personas

Pick 2–3 relevant personas and walk the primary task as each; report the specific elements that fail them, not generic descriptions.

| Persona | Walks the task by… | Typical red flags |
|---|---|---|
| **Power user** | Keyboard first, skips onboarding, wants bulk and shortcuts | No shortcuts, forced tours, slow animations, one-at-a-time workflows, confirmations on low-risk actions |
| **First-timer** | Reads everything, takes labels literally, looks for help | Icon-only navigation, jargon, unclear next step, no success confirmation |
| **Assistive-tech user** | Screen reader and keyboard only, may zoom to 200% | Unlabeled controls, invisible focus, color-only meaning, silent status changes, time limits |
| **Stress tester** | Empty, huge, and odd inputs; refresh and back mid-flow | Blank empty states, lost data on refresh, broken layouts with long text/RTL/emoji, errors exposing internals |
| **Distracted mobile user** | One thumb, interrupted, slow network | Primary actions out of thumb reach, small targets, lost progress on app switch, heavy pages |

| Surface | Personas |
|---|---|
| Landing / marketing | First-timer, Stress tester, Mobile |
| Dashboard / admin / data-heavy | Power user, Assistive-tech |
| Checkout / e-commerce | Mobile, Stress tester, First-timer |
| Onboarding | First-timer, Mobile |
| Forms / wizards | First-timer, Assistive-tech, Mobile |

Only create project-specific personas from real audience information in project context; never invent audience details.

## Severity calibration

| Question | If yes |
|---|---|
| Can some users not complete the task at all (keyboard, screen reader, a viewport, a locale)? | P0 |
| Does it lose or corrupt user data, or show misleading prices/status? | P0 |
| Is it a WCAG 2.2 AA failure on a primary flow? | P1 (P0 if it blocks the task) |
| Would a user contact support or abandon because of it? | ≥ P1 |
| Is there a workaround, and is it merely annoying or inconsistent? | P2 |
| Would only a designer notice? | P3 |

Frequency and reach raise severity: a P2 issue on every screen can be a P1 systemic finding.

## Specificity verdict

Before scoring the visual pass, answer in one or two sentences: *Does this surface feel authored for this product, or could an unrelated product use it unchanged?* Name the category-default choices (layout skeleton, fonts, palette, component kit) and any real signature element. This verdict is judged independently of automated detectors, so their output does not anchor it.

## Sources

- Jakob Nielsen, 10 Usability Heuristics for User Interface Design: https://www.nngroup.com/articles/ten-usability-heuristics/
- NN/g, Usability heuristics applied to complex applications: https://www.nngroup.com/articles/usability-heuristics-complex-applications/
- NN/g, Severity ratings for usability problems: https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/
- impeccable `critique` reference (0–4 scoring, bands, personas, cognitive-load checklist, P0–P3): https://github.com/pbakaus/impeccable
- Laws of UX (Hick's law, working memory, cognitive load): https://lawsofux.com/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
