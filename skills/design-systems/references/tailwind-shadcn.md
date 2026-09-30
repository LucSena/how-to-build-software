# Tailwind CSS v4 and shadcn/ui wiring

How to connect a token system to Tailwind v4 (current 4.3, May 2026) and to shadcn/ui's theme conventions. Stack-specific, so skip this file if the project doesn't use them.

## 1. Tailwind v4: CSS-first configuration

Configuration lives in CSS. There is no `tailwind.config.js` unless you add one for legacy reasons.

```css
@import "tailwindcss";

@theme {
  --font-display: "Your Display", ui-serif, serif;
  --font-sans: "Your Text", ui-sans-serif, system-ui, sans-serif;
  --text-display: 3.5rem;
  --text-display--line-height: 1.05;
  --color-brand-9: oklch(0.62 0.17 40);
  --radius-control: 6px;
  --radius-card: 12px;
  --ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);
  --breakpoint-3xl: 120rem;
}
```

- **Theme variables generate utilities**, keyed by namespace:
  - color and type: `--color-*` → `bg-*`/`text-*`/`border-*`; `--font-*`; `--text-*` (plus `--text-*--line-height`); `--font-weight-*`; `--tracking-*`; `--leading-*`
  - layout: `--breakpoint-*`; `--container-*`; `--spacing` (base multiplier) or `--spacing-*`
  - surface: `--radius-*`; `--shadow-*`; `--inset-shadow-*`; `--drop-shadow-*`; `--blur-*`; `--perspective-*`; `--aspect-*`
  - motion: `--ease-*`; `--animate-*` (with `@keyframes` inside `@theme`)
- **`:root` vs `@theme`:** put variables that should *not* create utilities in `:root`, and those that should in `@theme`.
- **`@theme inline`** is for theme variables whose values reference other variables (`--color-background: var(--background)`). Without `inline`, the `var()` resolves where the theme variable is defined, and can fall back unexpectedly in nested themes.
- **`@theme static`** emits every variable. By default only the variables that are used are emitted.
- **Reset the defaults** for a fully custom system: `--color-*: initial;` clears the default palette, and `--*: initial;` clears everything. This is a strong anti-default move: agents can then only use your tokens.
- Opacity modifiers (`bg-brand-9/50`) compile to `color-mix()`, so tokens can use any color space. The default palette is OKLCH. v4.3 added the `mauve`, `olive`, `mist`, and `taupe` neutrals.
- Dark mode variant: `@custom-variant dark (&:is(.dark *));` or `(&:where([data-theme=dark], [data-theme=dark] *))`.
- Spacing: `--spacing: 0.25rem` means `p-6` = 1.5rem. Keep the base at 4px unless the system says otherwise.

## 2. Semantic layer in Tailwind

Components should use semantic utilities (`bg-surface`, `text-fg-muted`, `border-border`), not palette utilities (`bg-zinc-100`).

```css
:root {
  --bg: var(--gray-1);          --fg: var(--gray-12);
  --surface: oklch(1 0 0);      --fg-muted: var(--gray-11);
  --accent: var(--orange-9);    --accent-fg: oklch(1 0 0);
  --border: oklch(from var(--fg) l c h / 12%);
}
.dark {
  --bg: var(--gray-dark-1);     --fg: var(--gray-dark-12);
  --surface: var(--gray-dark-2);--fg-muted: var(--gray-dark-11);
  --accent: var(--orange-dark-9); --accent-fg: var(--gray-dark-1);
  --border: oklch(1 0 0 / 10%);
}
@theme inline {
  --color-bg: var(--bg);           --color-fg: var(--fg);
  --color-surface: var(--surface); --color-fg-muted: var(--fg-muted);
  --color-accent: var(--accent);   --color-accent-fg: var(--accent-fg);
  --color-border: var(--border);
}
```

Enforce it with a lint rule or a code-review check: raw palette classes (`bg-(red|blue|zinc|…)-\d+`), arbitrary colors (`bg-[#…]`), and arbitrary spacing (`p-[13px]`) are not allowed in component files.

## 3. shadcn/ui token convention

shadcn/ui (the CLI and registry that copies component source into your repo; Base UI has been the default primitive layer since July 2026, with Radix still supported) uses **surface/foreground pairs**. The surface token has no suffix and its text token adds `-foreground`.

| Token pair | Controls |
|---|---|
| `background` / `foreground` | Page shell and default text |
| `card` / `card-foreground` | Elevated surfaces |
| `popover` / `popover-foreground` | Floating surfaces: popovers, dropdowns, context menus |
| `primary` / `primary-foreground` | High-emphasis actions and brand surfaces |
| `secondary` / `secondary-foreground` | Lower-emphasis filled actions |
| `muted` / `muted-foreground` | Subtle surfaces; descriptions, placeholders, helper text |
| `accent` / `accent-foreground` | **Hover, focus, and active surfaces** (ghost buttons, menu highlights). This is *not* the brand accent |
| `destructive` | Destructive actions and invalid states |
| `border`, `input`, `ring` | Borders, form-control borders, focus rings |
| `chart-1` … `chart-5` | Default chart palette |
| `sidebar-*` | A sidebar-specific set of the above |
| `radius` | Base radius; the scale is derived (sm ×0.6, md ×0.8, lg ×1, xl ×1.4, 2xl ×1.8 …) |

Values live in `:root` and `.dark` and are exposed through `@theme inline { --color-primary: var(--primary); … }`. Available base colors: Neutral, Stone, Zinc, Mauve, Olive, Mist, Taupe.

**Adding a token** (for example warning):
```css
:root  { --warning: oklch(0.84 0.16 84); --warning-foreground: oklch(0.28 0.07 46); }
.dark  { --warning: oklch(0.41 0.11 46); --warning-foreground: oklch(0.99 0.02 95); }
@theme inline { --color-warning: var(--warning); --color-warning-foreground: var(--warning-foreground); }
```

**Escaping the default look.** The default neutral theme is achromatic: `--primary` is near-black in light mode and near-white in dark mode. That *is* the recognizable "shadcn look". At minimum, set these from the direction plan:
- `--primary` (and `--ring`) from the brand hue
- `--radius` from the radius decision
- the fonts (`--font-sans`, and a display face if there is one)
- `--chart-1…5` from a color-vision-safe categorical palette
- the neutral base: pick the one whose tint matches the brand, or generate your own ramp
- `shadcn/create` can generate presets for a starting point. Still review every value.

**Mapping to a 12-step ramp** (see `design-foundations` color reference): `background` = gray 1, `card` = gray 1–2 or white, `muted` = gray 3, `accent` (hover) = gray 4, `border` = gray 6, `input` = gray 7, `ring` = brand 8, `primary` = brand 9, `muted-foreground` = gray 11, `foreground` = gray 12.

**Registries.** Third-party shadcn registries (`npx shadcn@latest add @namespace/item`) install into the same token system. Check that the installed components use your semantic tokens and not hard-coded palette classes before you accept them.

## 4. Variant helpers

```ts
import { cva } from "class-variance-authority";

export const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
      },
      size: { sm: "h-8 px-3 text-sm", md: "h-9 px-4 text-sm", lg: "h-10 px-5" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);
```

- Variants map only to semantic utilities.
- Use `transition-colors` (or explicit properties), never `transition-all`.
- Merge class names with `tailwind-merge` or shadcn's `cn` helper, so a consumer's `className` for layout does not fight the variant classes.

## Sources

- Tailwind CSS v4 theme variables: https://tailwindcss.com/docs/theme ; v4.3 release notes: https://tailwindcss.com/blog
- shadcn/ui theming (token table, radius scale, adding tokens, base colors): https://ui.shadcn.com/docs/theming
- shadcn/ui changelog (Base UI default, `cn` package): https://ui.shadcn.com/docs/changelog
- class-variance-authority: https://cva.style
