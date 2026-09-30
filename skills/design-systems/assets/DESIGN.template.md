---
version: alpha
name: <Product name>
description: <One sentence: what the product is and who it is for>
colors:
  primary: "#______"          # the single action color
  on-primary: "#______"       # text/icons on primary (≥ 4.5:1)
  neutral: "#______"          # page background
  surface: "#______"          # cards/panels
  on-surface: "#______"       # primary text (≥ 4.5:1 on neutral and surface)
  on-surface-muted: "#______" # secondary text (≥ 4.5:1)
  border: "#______"
  error: "#______"
  on-error: "#______"
typography:
  headline-display: { fontFamily: <Display face>, fontSize: 56px, fontWeight: 600, lineHeight: 1.05, letterSpacing: -0.02em }
  headline-lg:      { fontFamily: <Display face>, fontSize: 40px, fontWeight: 600, lineHeight: 1.15, letterSpacing: -0.01em }
  headline-md:      { fontFamily: <Display face>, fontSize: 28px, fontWeight: 600, lineHeight: 1.25 }
  body-lg:          { fontFamily: <Text face>, fontSize: 18px, fontWeight: 400, lineHeight: 1.6 }
  body-md:          { fontFamily: <Text face>, fontSize: 16px, fontWeight: 400, lineHeight: 1.55 }
  body-sm:          { fontFamily: <Text face>, fontSize: 14px, fontWeight: 400, lineHeight: 1.5 }
  label-md:         { fontFamily: <Text face>, fontSize: 14px, fontWeight: 500, lineHeight: 1.2 }
  label-sm:         { fontFamily: <Text face>, fontSize: 12px, fontWeight: 500, lineHeight: 1.3 }
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  section: 96px
  gutter: 24px
  margin: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 40px
  button-primary-hover:
    backgroundColor: "#______"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 40px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    height: 40px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 24px
---

# <Product name> Design System

## Overview

<One specific reference, not adjectives. Example: "A field notebook used by a botanist: dense, practical, annotated in one ink, with color reserved for specimens.">

- Audience and use scene: <who, where, what light, how often>.
- Surface modes: <Persuade / Operate / Read / Experience, and which surfaces are which>.
- Signature move: <the one memorable thing>.
- When a rule below does not cover a case, choose the quieter option.

## Colors

<Strategy: Restrained / Committed / Full palette / Drenched, and the share of the accent.>

- **<Descriptive name> ({colors.primary}):** <role and limits — e.g. only the single most important action per screen>.
- **<Name> ({colors.neutral}):** <role>.
- **<Name> ({colors.on-surface}):** <role>.
- Dark theme: <how roles change — surfaces lighter per elevation, accent lighter and less saturated>.
- Status colors are always paired with an icon and text.

## Typography

- **Display/headlines:** <face> — <why it fits the reference>.
- **Body and UI:** <face> — <why>.
- Scale ratio <r>; body measure ≤ 65ch; weights used: <list, max 3>.
- Numbers in tables and prices use tabular figures.

## Layout

- Grid: <12 columns, 1280px max, 24px gutters; 4 columns, 16px margins on mobile>.
- Spacing is a 4px-based scale; related items 8–16px apart, groups 24–32px, sections {spacing.section}.
- Breakpoints are content-driven: <list>. Components use container queries.

## Elevation & Depth

<Shadow model with levels, or "Depth through tonal layers, not shadows". Dark mode shows elevation with lighter surfaces.>

## Shapes

<Radius language — e.g. "4px on controls, 16px on cards and sheets; nested radii follow inner = outer − padding; no pills except tags.">

## Components

- **Buttons:** primary / secondary / ghost / destructive; sizes 32/40/48px; states: hover, focus-visible (2px ring, 2px offset), active, disabled, loading (width unchanged).
- **Inputs:** label above, helper below, error text + icon (never color alone); 16px text on mobile.
- **Cards:** only for real objects; never nested.
- <Domain components>.

## Motion

<Durations (feedback 100–150ms, state 150–250ms, overlays 250–400ms), easing (ease-out for enter), what never animates (keyboard actions), reduced-motion behavior.>

## Do's and Don'ts

- Do use {colors.primary} for one action per screen.
- Do keep text contrast at WCAG 2.2 AA or better in both themes.
- Don't <a specific default this system rejects — e.g. gradient text, eyebrow labels above headings>.
- Don't mix <x> and <y> in one view.
- <5–10 items total, each checkable.>
