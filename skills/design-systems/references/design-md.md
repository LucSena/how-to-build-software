# Authoring DESIGN.md

DESIGN.md is a plain-text design system that people and coding agents both read. Google introduced it in Stitch and open-sourced the spec and CLI at `google-labs-code/design.md` (Apache-2.0, spec version `alpha`, CLI `@google/design.md`). Several third-party sites use the same name for different formats. Always target the Google spec and validate with its CLI.

## 1. Anatomy

1. **Optional YAML front matter** holding the tokens. The first line is exactly `---` and the block closes with a line of exactly `---`.
2. **A Markdown body** of `##` sections holding the rationale. An optional `#` title is allowed and is not parsed as a section.

The tokens are normative. The prose explains how to apply them and may refer to them inline (`**Paper** {colors.paper} is the canvas…`).

### Front matter schema

```yaml
version: alpha            # optional
name: <string>
description: <string>     # optional
omitted:                  # optional; silences missing-section lint with a reason
  - section: rounded
    reason: "Flat, square system by design"
colors:      { <name>: <CSS color> }                 # hex recommended; oklch() etc. accepted
typography:  { <name>: { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, fontFeature, fontVariation } }
rounded:     { <level>: <dimension px|em|rem> }
spacing:     { <level>: <dimension | number> }
components:  { <component>: { backgroundColor, textColor, typography, rounded, padding, size, height, width } }
```

- `lineHeight` is best unitless (`1.5`). `fontWeight` is a number.
- References take the form `"{colors.primary}"`. Outside `components` they must point to a primitive value; inside `components`, composite references such as `"{typography.label-md}"` are allowed.
- Variants are sibling keys: `button-primary`, `button-primary-hover`, `button-primary-active`, `button-primary-disabled`.
- Unknown component properties (for example `borderColor`) are accepted with a warning. Unknown color, typography, and spacing names are accepted.
- Recommended, non-normative names:
  - colors: `primary`, `secondary`, `tertiary`, `neutral`, `surface`, `on-surface`, `error`
  - typography: `headline-display`, `headline-lg/md`, `body-lg/md/sm`, `label-lg/md/sm`
  - rounded: `none`, `sm`, `md`, `lg`, `xl`, `full`

### Sections, in order

Sections may be omitted, but those present **must appear in this order**. Unknown sections (for example `## Iconography`, `## Motion`) are preserved. A duplicate heading is an error and the file is rejected.

| # | Heading (alias) | Content | Token group |
|---|---|---|---|
| 1 | **Overview** ("Brand & Style") | Personality, audience, and the emotional response. The fallback guide when no rule applies. Lead with a *specific reference* | none |
| 2 | **Colors** | Palettes with roles; `primary` is required | `colors` |
| 3 | **Typography** | Levels and roles (display/headline/body/label/caption × sizes); most systems have 9–15 levels | `typography` |
| 4 | **Layout** ("Layout & Spacing") | Grid model, margins, safe areas, spacing scale | `spacing` |
| 5 | **Elevation & Depth** ("Elevation") | Shadows, or how hierarchy is shown without them (tonal layers, borders) | none |
| 6 | **Shapes** | Shape language and corner radii | `rounded` |
| 7 | **Components** | Buttons, chips, lists, tooltips, checkboxes, radios, inputs, plus domain components | `components` |
| 8 | **Do's and Don'ts** | Short, intentional guardrails | none |

Motion, iconography, and z-index have no token group. Describe them in prose in an extra section placed after Components, or keep them in the DTCG source.

## 2. Writing the prose

- **A specific reference beats adjectives.** "A 1970s graduate lecture handout from an old university" names a point. "Modern, clean, trustworthy, premium" names a region, and the model fills it with the median. The reference also implies the negative constraints (a handout does not glow).
- **Each sentence must change an implementation decision.** Cut mood-only sentences.
- **State roles and limits**: "Vermilion appears only in diagrams and chart annotations, never on text." Limits are what keep a system distinctive.
- **Name rules** when useful ("The One Voice Rule: the accent marks one action per screen").
- **Do's and Don'ts:** about 5–10 items, each concrete and checkable. A long list means the Overview was too vague.
- Include the accessibility floor explicitly (WCAG 2.2 AA contrast, focus visibility) so generated components inherit it.

## 3. Procedure

**Repository mode (documenting an existing product)**
1. Collect evidence: tokens, CSS variables, Tailwind theme, component source, and rendered pages.
2. For each candidate value, record role → value → source → scope → recurrence → confidence. **Invent nothing.** Accidental repetition (a one-off `#333`) is not design intent. List inconsistencies separately as findings.
3. Write the front matter from the evidence and the sections in order.
4. Lint, fix, and export once to prove the tokens round-trip.

**URL mode (reconstructing a reference site)**
- Inspect the rendered DOM and computed styles at desktop and mobile widths. Screenshots alone cannot establish exact values. Mark the result "reconstructed", not normative.
- Use it as inspiration for principles. Do not ship another company's identity as your product's.

**Seed mode (new product)**
1. Run the `design-taste` workflow to get the direction plan.
2. Fill `assets/DESIGN.template.md` from the plan, taking values from `design-foundations`.
3. Lint, then generate CSS or DTCG from it, or write the DTCG source and generate DESIGN.md's tokens from that.

**Updating**
- Never silently overwrite an existing DESIGN.md. Diff first (`npx @google/design.md diff DESIGN.md DESIGN-next.md`), then show the changes and the reasons.
- Bump the version or changelog when tokens change, and keep DESIGN.md in sync with the source of truth (CI check).

## 4. CLI

```bash
npx @google/design.md lint DESIGN.md                    # JSON findings; exit 1 on errors
npx @google/design.md diff DESIGN.md DESIGN-v2.md       # token changes; exit 1 on regression
npx @google/design.md export --format css-tailwind DESIGN.md > theme.css   # Tailwind v4 @theme
npx @google/design.md export --format json-tailwind DESIGN.md              # Tailwind v3 theme.extend
npx @google/design.md export --format dtcg DESIGN.md > tokens.json         # W3C DTCG
npx @google/design.md spec --rules                      # print the spec/rules for prompting
```

Lint rules:

| Rule | Severity | Catches |
|---|---|---|
| `broken-ref` | error | References that don't resolve |
| `missing-primary` | warning | Colors without `primary` |
| `contrast-ratio` | warning | Component background/text pairs below WCAG AA 4.5:1 |
| `orphaned-tokens` | warning | Colors never referenced by a component |
| `missing-typography` | warning | Colors defined but no typography |
| `section-order` | warning | Sections out of canonical order |
| `unknown-key` | warning | Typos such as `colours:` |
| `token-like-ignored` | warning | Token-like values under an unknown key |
| `missing-sections` | info | Spacing or rounded absent while other tokens exist |
| `token-summary` | info | Token counts |
| `omitted-rules` | info | Invalid or redundant `omitted` entries |

## 5. Ecosystem notes (as of 2026-09)

- Libraries of DESIGN.md files for real brands exist (Refero Styles, getdesign.md, awesome-design-md), as do URL-to-DESIGN.md generators (designmd.supply, designmd.me, HyperDesign). They are useful for studying how a system is described. See `design-resources`.
- Some tools split product truth (audience, purpose, voice) into a separate `PRODUCT.md`. In this collection, that role belongs to `.agents/project-context.md`.
- Some generators number or rename sections ("## 1. Overview: …"). Run `lint` and fix the section order.

## Sources

- DESIGN.md spec, philosophy, and CLI: https://github.com/google-labs-code/design.md (docs/spec.md, PHILOSOPHY.md, README)
- Stitch DESIGN.md announcement: https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/
- ui-skills `create-design-md` (evidence pipeline, repo vs URL mode, invent no tokens): https://github.com/ibelick/ui-skills
- Impeccable `document` reference (named rules, never silently overwrite): https://github.com/pbakaus/impeccable
