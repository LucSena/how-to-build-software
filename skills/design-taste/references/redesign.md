# Redesigning an existing UI

A redesign fails in two ways. It breaks what users and search engines depended on, or it spends effort polishing a look that is about to be thrown away. This procedure prevents both.

## 1. Pick the mode, once

| Mode | What changes | Use when |
|---|---|---|
| **Refine** | Typography, spacing, color tuning, states, and motion inside the current identity | The brand is fine and the execution is weak; there are active users; the deadline is short |
| **Overhaul** | Direction, layout system, and components | The identity is generic or wrong for the audience; a repositioning or rebrand; the design system cannot be extended |

If the request is ambiguous ("make it look better"), default to **Refine** and ask once whether a full overhaul is wanted. Never mix them. Polishing a look you are about to replace is wasted work, and half-replacing it produces two design languages on one page.

## 2. Audit before touching anything

Record these in a short audit block. This is your baseline and your "do not break" list.

- **Stack and styling method:** framework, CSS approach (Tailwind, CSS modules, CSS-in-JS), component library, token source.
- **Brand assets:** logo, brand colors, fonts, and any official guidelines. These are constraints, not suggestions.
- **Information architecture:** routes and slugs, nav labels and order, anchor IDs, and page titles.
- **Content blocks:** what each section says and which parts are real proof (customer names, numbers with sources).
- **Patterns to keep or retire:** what works (accessibility wins, keyboard shortcuts, fast flows) and what reads as a template (see `slop-catalog.md`).
- **SEO baseline:** titles, meta descriptions, H1s, canonical URLs, structured data, and indexed URLs. Lost SEO is the most common silent redesign regression.
- **Analytics:** event names, element IDs, and form field names that tracking or tests depend on.
- **Current screenshots** at 1440px and 390px, light and dark. These become the "before" in the report.

## 3. Never change silently

Changing any of these needs an explicit mention and, for most of them, user approval:
- URLs and slugs (if they must change, add redirects)
- Nav labels and order
- Form field names, order, and validation rules
- Logo and brand marks
- Legal copy, pricing, and plan names
- Analytics event names and IDs that tests or tracking rely on
- Keyboard shortcuts and other learned behaviors

## 4. Apply levers in order

Work from the highest value per unit of risk down. The first four levers usually give most of the improvement with little structural risk.

| # | Lever | Typical changes |
|---|---|---|
| 1 | **Typography** | Swap a reflex font for a chosen one; set a real scale ratio; fix measure, line-height, and heading weights; add `tabular-nums` and `text-wrap: balance` |
| 2 | **Spacing and rhythm** | Adopt a 4px-based scale; group tightly and separate generously; give headings more space above than below; fix container padding |
| 3 | **Color** | Tint neutrals; reduce to one accent; remove decorative gradients and glows; fix gray-on-color; tokenize everything |
| 4 | **States** | Add hover, focus-visible, active, disabled, loading, empty, and error states where they are missing |
| 5 | **Motion** | Remove scattered entrances and hover lifts; keep feedback motion; add one authored moment if the mode allows it |
| 6 | **Hero recomposition** | Replace the generic hero with the subject's own artefact and specific copy |
| 7 | **Block replacement** | Replace identical card grids, fake metrics, and template sections with components that fit the content |

In Refine mode, stop after lever 5 unless a block is broken. In Overhaul mode, set the new direction first (the design-taste workflow), then apply all levers against it.

## 5. Fix priority when time is short

1. Anything broken: layout bugs, overflow, unreadable contrast, missing focus.
2. Missing states in core flows.
3. The font swap and type scale.
4. Palette cleanup.
5. Layout and spacing drift.
6. Generic components.
7. Polish: optical alignment, browser surfaces (selection color, caret, scrollbars, focus rings).

## 6. Working rules

- Work with the existing stack. Don't migrate the CSS framework or the component library as part of a visual redesign unless that was asked for.
- Make small, reviewable changes, one lever per commit or diff where possible.
- Check dependencies before adding one. A font or icon swap often needs no new package.
- Keep behavior identical: same routes, same data, same validation. A visual diff should not change what the product does.
- Preserve accessibility wins, and never regress contrast, focus order, or labels.
- Update DESIGN.md and the tokens as you go, so the refinement persists (see `design-systems`).

## 7. Report

```
Mode: Refine | Overhaul
Audit: stack, brand constraints, IA/SEO baseline captured (link or list)
Changed: per lever, what and why (before → after)
Preserved: URLs, nav, forms, analytics IDs, legal copy (confirm each)
Needs approval: anything from the "never change silently" list
Screenshots: before/after at 1440 and 390 (and dark)
Not checked: …
```

## Sources

- Taste Skill `redesign-existing-projects` and v2 §11 (modes, audit-first, preservation rules, levers, SEO baseline): https://github.com/Leonxlnx/taste-skill
- Impeccable ("Refinement preserves; redesign replaces", polish triage order): https://github.com/pbakaus/impeccable
- Vercel Web Interface Guidelines (states, content resilience): https://github.com/vercel-labs/web-interface-guidelines
