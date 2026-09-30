# Tokens in the W3C DTCG format (2025.10)

The Design Tokens Community Group published its **first stable version, 2025.10, on 2025-10-28**. It has three modules: **Format**, **Color**, and **Resolver**. It is a Community Group report rather than a W3C Recommendation, but it is vendor-backed and intended for production use.

## Contents

1. Files and structure
2. Token properties
3. Types (with examples)
4. Groups, aliases, and references
5. Modes with the resolver
6. Recommended file layout
7. Tooling notes

---

## 1. Files and structure

- JSON, with the media type `application/design-tokens+json` and the extension `.tokens` or `.tokens.json`.
- Schema: `"$schema": "https://www.designtokens.org/schemas/2025.10/format.json"`.
- A **token** is any object with a `$value`. A **group** is any object without one. Keys beginning with `$` are reserved.

## 2. Token properties

| Property | Required | Notes |
|---|---|---|
| `$value` | Yes | A literal value, or an alias like `"{color.orange.9}"` |
| `$type` | Effectively yes | Can be set on a group and is inherited by its children |
| `$description` | No | Say what the token is for (it shows in tooling) |
| `$deprecated` | No | `true`, or a string explaining the replacement |
| `$extensions` | No | Vendor data under reverse-domain keys (`"com.figma": {…}`) |

## 3. Types (with examples)

**Primitive types**

```json
{
  "color": {
    "$type": "color",
    "orange": {
      "9": { "$value": { "colorSpace": "oklch", "components": [0.62, 0.17, 40], "alpha": 1, "hex": "#dc6a31" } }
    }
  },
  "space":   { "$type": "dimension", "4": { "$value": { "value": 16, "unit": "px" } } },
  "font":    {
    "family": { "$type": "fontFamily", "body": { "$value": ["Source Sans 3", "system-ui", "sans-serif"] } },
    "weight": { "$type": "fontWeight", "semibold": { "$value": 600 } }
  },
  "duration": { "$type": "duration", "fast": { "$value": { "value": 150, "unit": "ms" } } },
  "easing":   { "$type": "cubicBezier", "out": { "$value": [0.23, 1, 0.32, 1] } },
  "opacity":  { "$type": "number", "disabled": { "$value": 0.5 } }
}
```

- `color` is an object: `colorSpace`, `components` (with `"none"` allowed), optional `alpha`, and an optional 6-digit `hex` fallback. Supported spaces include `srgb`, `srgb-linear`, `hsl`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `xyz-d65`, and `xyz-d50`.
- `dimension` is an object with `value` and `unit` (`px` or `rem`).
- `duration` is an object with `value` and `unit` (`ms` or `s`).

**Composite types:** `strokeStyle`, `border`, `transition`, `shadow`, `gradient`, `typography`.

```json
{
  "shadow": {
    "raised": {
      "$type": "shadow",
      "$value": [
        { "color": { "colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0.06 },
          "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 1, "unit": "px" },
          "blur": { "value": 2, "unit": "px" }, "spread": { "value": 0, "unit": "px" } },
        { "color": { "colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0.08 },
          "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 8, "unit": "px" },
          "blur": { "value": 16, "unit": "px" }, "spread": { "value": -4, "unit": "px" } }
      ]
    }
  },
  "type": {
    "heading-1": {
      "$type": "typography",
      "$value": {
        "fontFamily": "{font.family.display}",
        "fontSize": { "value": 40, "unit": "px" },
        "fontWeight": 600,
        "letterSpacing": { "value": -0.4, "unit": "px" },
        "lineHeight": 1.15
      }
    }
  },
  "motion": {
    "enter": {
      "$type": "transition",
      "$value": { "duration": "{duration.fast}", "delay": { "value": 0, "unit": "ms" }, "timingFunction": "{easing.out}" }
    }
  }
}
```

- `shadow` can be an array, which is how layered shadows are expressed. Each layer can set `inset`.
- `typography.lineHeight` is a number, interpreted as a multiplier of `fontSize`.

## 4. Groups, aliases, and references

- **Aliases:** `"$value": "{color.orange.9}"` points to another token's value. Circular references are errors.
- **JSON Pointer `$ref`:** `{ "$ref": "#/color/orange/9/$value" }` can reference *part* of a value, such as one property of a typography composite. Tools must support it.
- **`$extends`** on a group inherits another group's tokens. Use it for brand variants that override a few values.
- **Group `$type`** is inherited, so set it once per category.

Semantic tier example:

```json
{
  "color": {
    "$type": "color",
    "bg":      { "$value": "{color.gray.1}",   "$description": "Page background" },
    "fg":      { "$value": "{color.gray.12}",  "$description": "Primary text" },
    "fg-muted":{ "$value": "{color.gray.11}",  "$description": "Secondary text, ≥ 4.5:1 on bg" },
    "accent":  { "$value": "{color.orange.9}", "$description": "Primary action background" },
    "accent-fg": { "$value": "{color.white}",  "$description": "Text on accent" },
    "danger": {
      "fg":     { "$value": "{color.red.11}" },
      "bg":     { "$value": "{color.red.3}" },
      "border": { "$value": "{color.red.7}" },
      "solid":  { "$value": "{color.red.9}" }
    },
    "brand-legacy": { "$value": "{color.orange.9}", "$deprecated": "Use color.accent; removed in 3.0" }
  }
}
```

## 5. Modes with the resolver

The Resolver module handles light/dark, high contrast, brands, and density without copying whole token trees. A resolver document (extension `.resolver.json`) contains:
- `version`: must be `"2025.10"`.
- `sets`: named, ordered lists of `sources` (`$ref` to token files, or inline tokens). Later sources win on conflict.
- `modifiers`: named axes with a `contexts` map (context name → sources) and an optional `default`. A modifier should have two or more contexts.
- `resolutionOrder`: an ordered array of references to sets and modifiers. Later entries override earlier ones.

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/resolver.json",
  "version": "2025.10",
  "sets": {
    "foundation": { "sources": [
      { "$ref": "primitives/color.tokens.json" },
      { "$ref": "primitives/size.tokens.json" },
      { "$ref": "primitives/type.tokens.json" },
      { "$ref": "primitives/motion.tokens.json" }
    ]}
  },
  "modifiers": {
    "theme": {
      "description": "Color theme",
      "contexts": {
        "light": [{ "$ref": "semantic/light.tokens.json" }],
        "dark":  [{ "$ref": "semantic/dark.tokens.json" }],
        "lightHighContrast": [{ "$ref": "semantic/light.tokens.json" }, { "$ref": "semantic/high-contrast.tokens.json" }],
        "darkHighContrast":  [{ "$ref": "semantic/dark.tokens.json" },  { "$ref": "semantic/high-contrast.tokens.json" }]
      },
      "default": "light"
    },
    "density": {
      "contexts": {
        "comfortable": [{ "$ref": "semantic/density-comfortable.tokens.json" }],
        "compact":     [{ "$ref": "semantic/density-compact.tokens.json" }]
      },
      "default": "comfortable"
    }
  },
  "resolutionOrder": [
    { "$ref": "#/sets/foundation" },
    { "$ref": "#/modifiers/theme" },
    { "$ref": "#/modifiers/density" }
  ]
}
```

An input such as `{ "theme": "dark", "density": "compact" }` produces one resolved token set. The number of possible outputs is the product of all contexts (4 × 2 = 8 here). Keep the axes few and orthogonal.

## 6. Recommended file layout

```
tokens/
  primitives/color.tokens.json     # ramps: gray, brand, status (light and dark ramps)
  primitives/size.tokens.json      # space, radius, control heights, border widths, breakpoints
  primitives/type.tokens.json      # families, weights, sizes, line-heights
  primitives/motion.tokens.json    # durations, easings
  semantic/light.tokens.json       # role → primitive (light)
  semantic/dark.tokens.json        # role → primitive (dark)
  semantic/high-contrast.tokens.json
  component/button.tokens.json     # only if needed
  tokens.resolver.json
```

- Semantic files for each mode contain **the same token names**. A missing name in one mode is a build error, not a fallback.
- Keep primitives free of meaning. If a primitive is named `danger`, it belongs in the semantic tier.

## 7. Tooling notes

- Build tools that read DTCG include Style Dictionary (v4 and later) and Terrazzo (formerly Cobalt UI). Editors and sync tools such as Tokens Studio and Specify also support it. Figma variables export to it through plugins.
- The 2025.10 object forms for `color` and `dimension` differ from older draft string forms. Check that your tool version supports them, or add a transform.
- Google's DESIGN.md CLI can export DTCG (`npx @google/design.md export --format dtcg DESIGN.md > tokens.json`), which is useful for bootstrapping.
- Lint the tokens in CI: every alias resolves, every mode has the same names, contrast pairs pass, and there are no unused primitives.

## Sources

- DTCG Format 2025.10: https://www.designtokens.org/tr/2025.10/format/ ; announcement https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- DTCG Resolver 2025.10 and repository (technical-reports/format, color, resolver): https://github.com/design-tokens/community-group
- Style Dictionary: https://styledictionary.com ; Terrazzo: https://terrazzo.app
- Google DESIGN.md CLI export: https://github.com/google-labs-code/design.md
