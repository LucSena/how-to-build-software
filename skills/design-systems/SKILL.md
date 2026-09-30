---
name: design-systems
description: Use when creating, cleaning up, or extending a design system. That includes design tokens, theming (light/dark, brands, density, high contrast), component APIs and variants, a DESIGN.md file, a component library, or syncing tokens to iOS and Android. Covers the W3C DTCG 2025.10 token format and resolver, primitive → semantic → component tiers and naming, Tailwind v4 @theme, shadcn-style semantic color pairs, CSS variable theming, component variant and prop rules, authoring and linting DESIGN.md (Google spec), the component and required-state checklist, Style Dictionary-style multi-platform pipelines, and versioning and governance. Also use when the user only says "set up tokens", "our colors are all over the place", "add dark mode properly", "write a DESIGN.md", "make a component library", or "keep web and app styles in sync". Not for choosing the visual direction (use design-taste) or deciding the values themselves (use design-foundations).
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "design-foundations design-taste frontend-architecture accessibility ios-design android-design"
---

# Design Systems

A design system is a set of decisions made once and enforced everywhere: tokens for values, components for behavior, and documentation that says why. It fails in three ways. Raw values leak into components, so a rebrand touches 400 files. There are so many tiers and variants that nobody knows which token to use. Or the documentation says one thing and the code does another. This skill sets up the smallest system that removes those failures and grows with the product. It keeps one source of truth, generates everything else from it, and makes the system readable to people and to agents through DESIGN.md.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Then find what already exists: `DESIGN.md`, `*.tokens.json`, a Tailwind `@theme` block, `:root` variables, a Figma variables export, a component library, Storybook. **Extend what exists. Never start a parallel system.**

## Core principles

1. **One source of truth, everything else generated.** Hand-maintained duplicates drift within weeks.
2. **Components consume semantic tokens only.** Primitives never appear in component code. That rule is what makes theming a single remap.
3. **Name by role, not by value.** Use `color.danger.fg`, not `red-600`. Use `radius.control`, not `radius-6`. Values change; roles don't.
4. **Few tiers, few tokens.** Primitive → semantic is mandatory. Add component tokens only where a component truly diverges.
5. **Themes remap the semantic tier.** Light, dark, brand, density, and contrast are modes over the same names, never forks.
6. **Every component ships every state.** Default, hover, focus-visible, active, disabled, loading, error, and empty where relevant, plus RTL and both themes.
7. **The system is a product.** Version it, keep a changelog, deprecate before deleting, and measure adoption.

## Workflow

- [ ] **Audit**: list every color, size, radius, shadow, font, and z-index value in the code, and count the duplicates and near-duplicates. List components and their variants. Output: an inventory table and a merge plan (for example "23 greys → 12-step neutral ramp").
- [ ] **Decide the source of truth** (table below) and the file layout.
- [ ] **Primitives**: ramps, spacing, type, radius, shadows, durations, and easings, with values from `design-foundations`.
- [ ] **Semantic tier**: role names mapped to primitives for each mode (light and dark at minimum). Check contrast for every text/surface pair.
- [ ] **Wire it up**: CSS variables and Tailwind `@theme` (web), generated platform files (native). Replace raw values in components. A lint rule blocks new raw hex or px values.
- [ ] **Components**: apply the API rules below. Check each one against `references/component-checklist.md`.
- [ ] **Document**: write or update `DESIGN.md` (Google spec order) from `assets/DESIGN.template.md`. Validate with `npx @google/design.md lint DESIGN.md`.
- [ ] **Govern**: add a version, a changelog, a deprecation policy, and visual regression on the component catalog.
- [ ] **Verify**: switch themes and nothing breaks; `grep` finds no raw colors in components; lint passes; the visual diff shows only intended changes.

## Source of truth

| Situation | Source of truth | Generated from it |
|---|---|---|
| Web only, one app, Tailwind | CSS file with `:root` variables + `@theme inline` | DESIGN.md front matter (or check it with `design.md diff`) |
| Web + iOS/Android, or several apps and brands | DTCG `*.tokens.json` + a resolver file for modes | CSS, Tailwind theme, Swift, Kotlin/Compose, DESIGN.md tokens |
| Design team works in Figma variables | DTCG JSON exported from Figma and committed to the repo; the repo is canonical | Everything else |
| Bootstrapping from an existing DESIGN.md | DESIGN.md → `npx @google/design.md export --format dtcg` once, then DTCG | CSS, native |

DESIGN.md is always present as the **agent-readable summary and rationale**. Its front matter covers only colors, typography, rounded, spacing, and components, so it cannot be the only source of truth for shadows, motion, breakpoints, or z-index.

## Token tiers and naming

| Tier | Example | Rules |
|---|---|---|
| **Primitive** (reference, global) | `color.orange.9`, `gray.1…12`, `space.4 = 16px`, `radius.2`, `duration.200` | Raw scales with no meaning. Never used directly by components |
| **Semantic** (system, alias) | `color.bg`, `color.fg.muted`, `color.accent`, `color.border.subtle`, `color.danger.fg`, `space.inset.card`, `radius.control`, `motion.duration.fast` | Intent. Themes remap this tier only |
| **Component** (optional) | `button.primary.bg → {color.accent}`, `input.border.focus` | Only where a component diverges from the semantic default. Keep it to a handful |

- Naming pattern: `category.property.variant.state` (for example `color.bg.surface.hover`). In CSS this becomes kebab-case: `--color-bg-surface-hover`.
- Cover more than color: typography composites, spacing, sizing (control heights 32/36/40/44), radius, border width, shadow/elevation, z-index layers (base, dropdown, sticky, overlay, modal, toast, tooltip), durations, easings, breakpoints, and opacity.
- Status roles come as sets: `success|warning|danger|info` × `fg`, `bg` (subtle), `border`, `solid`.
- Record *why* with `$description`, and mark retirement with `$deprecated` (a string that names the replacement).

## Formats in one screen

DTCG 2025.10 (stable since 2025-10-28): `$value`, `$type`, `$description`, `$deprecated`, and `$extensions`. Dimensions and colors are **objects**. Aliases use curly braces.

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/format.json",
  "color": {
    "$type": "color",
    "orange": { "9": { "$value": { "colorSpace": "oklch", "components": [0.62, 0.17, 40], "hex": "#dc6a31" } } },
    "accent": { "$value": "{color.orange.9}", "$description": "Primary action background" }
  },
  "space": { "$type": "dimension", "4": { "$value": { "value": 16, "unit": "px" } } }
}
```

CSS theming with semantic variables (web):

```css
@layer tokens {
  :root {
    color-scheme: light dark;
    --color-bg: light-dark(var(--gray-1), var(--gray-dark-1));
    --color-fg: light-dark(var(--gray-12), var(--gray-dark-12));
    --color-accent: light-dark(var(--orange-9), var(--orange-dark-9));
    --radius-control: 6px; --radius-card: 12px;
  }
  [data-theme="light"] { color-scheme: light; }
  [data-theme="dark"]  { color-scheme: dark; }
}
```

Tailwind v4 exposes tokens as utilities through `@theme` (use `@theme inline` when values reference other variables). shadcn uses `background`/`foreground` pairs. Full formats, the resolver for modes, and the Tailwind/shadcn wiring are in `references/tokens-dtcg.md` and `references/tailwind-shadcn.md`.

## Theming and modes

- **Modes** are axes: `theme` (light/dark), `contrast` (standard/high), `brand`, `density` (compact/comfortable), and optionally `motion` (full/reduced). Each mode swaps semantic values only.
- In DTCG, express modes with a **resolver** document: `sets` for the base files, `modifiers` with `contexts` per mode, and `resolutionOrder`. The number of outputs is the product of all contexts. Keep the axes few.
- On the web, set the mode with an attribute on `<html>` (`data-theme`, `data-density`), and use `light-dark()` for color pairs. Respect `prefers-color-scheme`, persist the user's override, and disable transitions while switching.
- Density changes spacing and control-height tokens, never font size below the floors.
- A high-contrast mode raises `fg-muted` → `fg`, strengthens borders one or two steps, and thickens focus rings.

## Component API rules

- **Variants express intent**, such as `variant: primary | secondary | ghost | destructive`. **Size** is a separate axis (`sm | md | lg`). State is not a variant: `disabled`, `loading`, `invalid`, and `selected` are booleans, and hover and focus live in CSS.
- **Props are named by purpose**: `tone="danger"`, not `color="red"`. Don't expose raw style props (`bgColor`, `borderRadius`).
- **Compose rather than configure**: slots and subcomponents (`Card`, `Card.Header`, `Card.Footer`), or a render or `asChild` prop for polymorphism. More than about 10 styling props means the component should be split.
- **Keep native semantics**: forward refs, spread native attributes, `type="button"` by default, links as `<a>`. Build overlays, menus, comboboxes, and dialogs on accessible primitives (Base UI, React Aria, Radix). Don't mix primitive systems within one surface.
- **Controlled and uncontrolled**: `value`/`defaultValue`/`onValueChange` (or the platform's equivalent).
- **Layout belongs to the parent**: components carry no outer margin. Accept `className`/`style` for placement, not for restyling internals.
- **Loading keeps size**: the spinner replaces or accompanies the label without changing the width. Use `aria-disabled` when the control must stay focusable.
- Implement variants with a variant helper (for example `cva` or `tailwind-variants`) that maps to tokens, never to raw values.

The full component list with the states each must ship is in `references/component-checklist.md`.

## DESIGN.md

The file sits at the repo root and follows Google's DESIGN.md spec (alpha): YAML front matter tokens followed by `##` sections **in this order**: Overview → Colors → Typography → Layout → Elevation & Depth → Shapes → Components → Do's and Don'ts. Rules:
- The tokens are normative, and the prose explains how to apply them. **A specific reference beats adjectives.** "A 1970s university lecture handout" describes a point; "modern, clean, premium" describes a region.
- `colors.primary` must exist. Component variants are sibling keys (`button-primary`, `button-primary-hover`). References look like `"{colors.primary}"`.
- In repo mode, invent no tokens. Every value traces to code, and accidental repetition is not design intent. Each sentence should change an implementation decision.
- Keep Do's and Don'ts short and intentional (5–10).
- Validate with `npx @google/design.md lint DESIGN.md` (broken refs, missing primary, WCAG contrast of component pairs, section order). Export with `export --format css-tailwind | dtcg`.

Authoring procedure and lint rules: `references/design-md.md`. Template: `assets/DESIGN.template.md`.

## Multi-platform and governance (summary)

- Pipeline: DTCG JSON → a build tool that reads DTCG (Style Dictionary v4+, Terrazzo) → CSS/Tailwind, Swift, Kotlin/Compose, and Android resources. Unit transforms turn px into pt, dp, and sp. Colors convert from OKLCH to sRGB or P3 hex for native. Native **type maps to platform text styles** (Dynamic Type, Material roles) rather than copying web sizes. Details: `references/multi-platform.md`.
- Versioning: semver for the token and component packages. A rename or removal is **major**, a new token or component is **minor**, and a value tweak is **patch**, but a visible change to a widely used semantic value gets a changelog entry and a visual diff whatever its level. Deprecate with `$deprecated` and alias for one major version before deleting. Details: `references/governance.md`.

## Gotchas

- **Components using primitives** (`bg-orange-500`, `--gray-12`). Dark mode then needs per-component overrides. Route everything through semantic roles.
- **Tokens named by value** (`--blue`, `--spacing-16px`). The first rebrand turns `--blue` orange. Name by role.
- **Token explosion.** 600 component tokens that each alias one semantic token add maintenance and help nobody. Start with primitives plus about 40–80 semantic tokens.
- **Old DTCG draft syntax.** Before 2025.10, dimensions and colors were strings (`"16px"`, `"#fff"`). 2025.10 uses objects. Check that your build tool's version supports what you write.
- **Tailwind v4 `@theme` referencing variables without `inline`.** `var()` resolves at the definition site and can fall back unexpectedly. Use `@theme inline` for aliases.
- **Shipping shadcn defaults.** The achromatic default theme *is* the recognizable "shadcn look". Set `--primary`, `--radius`, fonts, and chart colors from the direction.
- **DESIGN.md out of sync with code**, or written as aspirations. Generate or diff its tokens from the source of truth, and lint it in CI.
- **Brand DESIGN.md copied from a gallery.** It is useful as a reference, but copying another company's system is impersonation-adjacent and still generic. Take the principles, not the palette.
- **Dark mode as a second palette of raw values** instead of a mode of the same semantic names.
- **Missing non-color tokens.** Hard-coded z-indexes, durations, and breakpoints drift first.
- **Variants for one-offs.** `variant="homepage-hero-blue"` belongs in the page, not in the system.
- **Web type sizes forced onto native.** iOS and Android users expect Dynamic Type and `sp` scaling. Map to platform roles.
- **Breaking changes without notice.** Renaming a token in a patch release breaks consumers silently. Follow the deprecation policy.

## Output format

For setup or cleanup work, deliver:

```
Inventory: <n> colors → <m>; <n> font sizes → <m>; radii <…>; shadows <…> (merge plan)
Source of truth: <file(s)>; generated: <outputs>
Tiers: primitives <count>, semantic <count>, component <count> (list any component tokens with reason)
Modes: <theme/contrast/brand/density> via <mechanism>
Components: <list> with state coverage (✓/✗ per state)
DESIGN.md: written/updated; lint result <pass / findings>
Governance: version <x.y.z>, changelog entry, deprecations
Verified: theme switch, no raw values in components (grep), visual diff · Not checked: <…>
```

## References

| File | Read when |
|---|---|
| `references/tokens-dtcg.md` | Writing token JSON, choosing types, aliasing, composite tokens (shadow, typography), or modeling modes with the resolver |
| `references/tailwind-shadcn.md` | Wiring tokens into Tailwind v4 `@theme`, customizing shadcn/ui themes, or adding a new semantic color |
| `references/design-md.md` | Creating, extracting, updating, or linting a DESIGN.md |
| `references/component-checklist.md` | Building or reviewing components and their required states, anatomy, and API |
| `references/multi-platform.md` | Generating tokens for iOS, Android, or Flutter, or setting up a token build pipeline and CI |
| `references/governance.md` | Versioning, deprecating, contributing to, documenting, or measuring adoption of the system |
| `assets/DESIGN.template.md` | Starting a new DESIGN.md |

## Related skills

- `design-foundations` — the values themselves (scales, ramps, contrast, elevation).
- `design-taste` — the direction the tokens encode; do it first for a new product.
- `frontend-architecture` — where the component library lives in the repo or monorepo, and how it is consumed.
- `accessibility` — deeper keyboard, ARIA, and screen-reader requirements for components.
- `ios-design` / `android-design` — native theming (Liquid Glass materials, dynamic color, type roles).
