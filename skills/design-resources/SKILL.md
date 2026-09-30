---
name: design-resources
description: Use when picking or recommending design and UI resources, such as a component library, shadcn registry, icon set, animated icons, font source, inspiration gallery, motion snippets, AI design skill, DESIGN.md generator or library, design-engineering reading, or UX research sites. Covers a verified 2026 catalog with what each resource actually is, its stack, license notes, and when to use it (Base UI, Radix, shadcn/ui, coss ui, ReUI, ObsidianUI, Beautiful UI, React Flow, Lucide, Phosphor, Remix Icon, Hugeicons, Mobbin, Refero, Godly, Impeccable, Taste Skill, ui-skills, Refero Styles, getdesign.md, Laws of UX, NN/g, Baymard and more), plus a method for choosing between them. Also use when the user asks "which icon library should I use", "where can I find inspiration for X", "is there a component for Y", "what tools help agents design better", or pastes a design-tool URL and asks what it is. Not for deciding visual direction (use design-taste) or building a design system (use design-systems).
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "design-taste design-systems design-foundations motion-design ux-principles"
---

# Design Resources

A curated, verified catalog of what to use and where to look, plus the method for choosing. The value is in accuracy. Several popular URLs are not what their names suggest, licenses changed in 2026, and some beloved libraries are frozen. Every entry here says what the resource actually is, what stack it needs, and when to reach for it. Anything that could not be verified is marked. Prefer fewer, better tools: one primitive layer, one icon family, one motion approach.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Check what the project already uses (`package.json`, `components.json`, the icon imports, the font files). The best resource is usually the one already installed.

## Core principles

1. **Installed beats new.** Extend the current library before adding a second one, since every dependency costs bundle size, upgrades, and consistency.
2. **One per category.** One primitive system, one icon family, one toast, one motion library per surface.
3. **Accessibility is inherited.** Choose libraries built on accessible primitives. You cannot patch a11y into a div-based dropdown later.
4. **License before install.** MIT, ISC, and Apache-2.0 are straightforward. AGPL, "Other", and commercial terms need a decision before code lands.
5. **Maintained or frozen, know which.** Check the last release and the README before depending on something.
6. **References are for patterns, not pixels.** Study how shipped products solve a flow. Never copy a brand's identity.

## Workflow

- [ ] **Name the need precisely.** Is it a primitive (behavior), a styled component, a block or template, an asset (icons, fonts, backgrounds), a reference (patterns, visuals), an agent tool, or reading?
- [ ] **Check what exists** in the project, and whether the platform covers it natively (`<dialog>`, popover, `<details>`, SF Symbols, Material components).
- [ ] **Shortlist 1–3** from the top picks below or from the reference tables.
- [ ] **Vet each one:** stack fit, license, maintenance, accessibility base, token compatibility (does it use your CSS variables?), bundle and dependencies, and lock-in (copy-in source vs a runtime dependency).
- [ ] **Recommend one**, with the runner-up and the reason, then name the install step and the first integration check.
- [ ] **Verify before citing** any URL you haven't checked this session. Say "unverified" rather than guessing.

## Top picks (as of 2026-09)

| Need | Default | Alternative and trigger |
|---|---|---|
| Accessible React primitives | **Base UI** (shadcn's default since July 2026) | **Radix** if the project already uses it; **React Aria** for maximum a11y coverage and i18n |
| Styled components you own | **shadcn/ui** (copies source into your repo; registries via `npx shadcn@latest add @ns/item`) | **coss ui** for a polished Base UI-native kit (use its MIT `apps/ui` code) |
| Data-dense UI (grids, filters, kanban) | **ReUI** registry | TanStack Table + your own components |
| Marketing motion blocks | **ObsidianUI** (MIT; Motion/GSAP/Three) | Build one authored moment yourself (see `motion-design`) |
| Agent and chat UI pieces | **Beautiful UI** (license unverified) | Your own components following `ai-interface-design` |
| Node and graph editors | **React Flow** (`@xyflow/react`, MIT) | Svelte Flow for Svelte |
| Toasts | **Sonner** (MIT) | Platform-native on mobile |
| Drawers / bottom sheets | Your kit's Base UI-based drawer | **Vaul** is stable but its README marks it unmaintained |
| Product demo videos | **snapcn** (Remotion registry themed by your shadcn tokens) | **HyperFrames** (HeyGen, Apache-2.0) for HTML-authored video compositions |
| Hand-drawn / sketchy UI | **Drawably** (MIT, zero dependencies, native controls kept for a11y) | none |
| Icons (web, neutral) | **Lucide** (ISC; v1.0 in June 2026, brand icons removed) | **Phosphor** (6 weights), **Tabler** (6,000+ outline/filled), **Remix Icon** (Line/Fill pairs), **Hugeicons** (6,000+ free, 10 styles in Pro) |
| Icons (native) | **SF Symbols** on Apple platforms, **Material Symbols** on Android | Never ship SF Symbols on web or Android (license) |
| Animated icons | **lucide-animated** (shadcn registry), **itshover** | **Morphicons** for state morphs; **Moving Icons** for Svelte |
| Pattern research (shipped apps) | **Mobbin** (largest; MCP on paid plans) or **Refero** (web + iOS; MCP) | **Page Flows** (video flows, emails), **Gummble** (budget, MCP), **ScreensDesign** (iOS paywalls with revenue data) |
| Visual direction | **Godly** (motion-heavy sites), **Inspora** (hourly X-sourced posts) | **Collect UI** (Dribbble concepts, not shipped), **Deck Gallery** (pitch decks) |
| Motion snippets | **transitions.dev** (CSS, with reduced-motion guards) | Emil Kowalski's articles and skills for decisions |
| Agent design skills | **Impeccable** (commands + 61 deterministic detectors) | **Taste Skill** (art direction for marketing pages), **ui-skills** (small rule skills + registry), **Vercel web-interface-guidelines** (review) |
| Automated design review | **Rams** (rams.ai: a review engine for agents and PRs, not a principles site) | Impeccable's detector CLI |
| DESIGN.md spec and lint | **google-labs-code/design.md** (`npx @google/design.md lint`) | none. Always validate against it |
| DESIGN.md references | **Refero Styles** (2,000+ extracted systems) | **getdesign.md** (70+ brands), **TypeUI** (50+ styles via CLI) |
| Fonts | **Google Fonts**, **Fontshare** (free) | Paid foundries for a distinctive voice (see `references/fonts.md`) |
| UX principles | **Laws of UX**, **NN/g heuristics** | **Baymard** for checkout and forms; **growth.design** for psychology case studies |

## Choosing within a category

- **Component source:** use platform primitives first, then the existing library, then a copy-in registry, then a new runtime dependency. Copy-in (shadcn-style) means you own the code and the upgrades. A runtime dependency means someone else's release schedule.
- **Icons:** pick by stroke and weight fit with your typography and radius, not by count. Weights (Phosphor) help when type weights vary. Line/Fill pairs (Remix, Material FILL) help with selected states. Coverage (Tabler, Hugeicons) helps dense admin UIs.
- **Galleries:** for a pattern that must *work* (onboarding, checkout, settings), use shipped-product libraries. For *visual direction*, use curated showcases. For *agent workflows*, prefer those with an MCP server (Mobbin, Refero, Gummble) or DESIGN.md libraries.
- **Agent skills:** load one design skill per concern. Stacking several opinionated skills produces contradictory rules. This collection's `design-taste` plus `design-review` cover most needs; add a third-party skill for a specific capability (detectors, video, CRO).

## Gotchas

- **Names that mislead** (verified 2026-09):
  - `atlas.attio.com` is Attio's GTM Atlas, a go-to-market guide, not a design system.
  - `driver.rybicki.ai` is a text-based racing-career browser game.
  - `revyl.com` is an AI mobile-testing platform, not a gallery.
  - `animos.app` is a design-to-motion-video tool, not an inspiration site.
  - `rams.ai` is an automated design-review engine, not Dieter Rams' principles.
  - `godly.design` resolves to **godly.website**.
  - `typeui.sh` is verified; `ui.sh` is not, so don't confuse them.
- **coss ui licensing:** the `apps/ui` and `apps/origin` code is MIT, but the monorepo default is AGPL-3.0. Copy only from the MIT parts, or get a license decision.
- **Remix Icon changed license** (Remix Icon License v1.0, Jan 2026). It is no longer Apache-2.0. Commercial use is allowed; read the terms.
- **Lucide v1 removed brand icons.** Use Simple Icons for logos, and only for real partners or integrations.
- **Vaul is unmaintained** per its README. It still works under shadcn's Drawer, but don't build new abstractions on it.
- **Base UI's npm package name**: confirm it against the current docs before installing (it was `@base-ui/react` in 2026 docs).
- **Brand DESIGN.md files** (getdesign.md, Refero Styles) are references. Shipping another company's palette and type on your product is impersonation-adjacent and still generic.
- **Backgrounds and gradient packs** (for example backgrounds.supply) push toward the purple-gradient slop look. Use them sparingly and only when the direction calls for it.
- **Dribbble-sourced galleries** (Collect UI) show concepts that never shipped. Validate the pattern against shipped products.
- **revenue-centric-design** has a source-available license with a field-of-use restriction. Link to it as a companion. Don't copy its text into MIT/Apache work.
- **Counts, prices, and versions drift.** The numbers in the reference tables are approximate as of 2026-09. Re-check them before quoting to a user who will pay.

## Output format

When recommending, reply with:

```
Need: <precise need>
Recommendation: <name> — <URL> — <why it fits this project (stack, license, a11y, tokens)>
Runner-up: <name> — <when you would pick it instead>
Install/first step: <command or action>
Check after install: <e.g. uses your CSS variables, keyboard works, bundle delta>
Caveats: <license, maintenance, unverified details>
```

For "what is this URL?", answer with what it actually is, whether it fits the user's goal, and a better-fitting alternative if it doesn't.

## References

| File | Read when |
|---|---|
| `references/components.md` | Choosing primitives, a styled kit, a shadcn registry, specialized React libraries, or checking a library's license or maintenance |
| `references/icons.md` | Choosing an icon set or animated icons, or checking icon licenses, counts, and styles |
| `references/inspiration.md` | Looking for pattern references, visual direction, motion or background resources, or identifying a gallery-like URL |
| `references/ai-design-tools.md` | Picking agent design skills, review engines, DESIGN.md generators and libraries, or AI site builders |
| `references/fonts.md` | Finding typefaces, foundries, and type tools (for how to *choose* a face, see `design-taste`) |
| `references/learning.md` | Pointing someone to UX principles, research, design-engineering reading, or design-system checklists |

## Related skills

- `design-taste` — decide the direction before picking resources that encode one.
- `design-systems` — integrate a chosen library into tokens and DESIGN.md.
- `design-foundations` — icon sizing and usage rules after picking a set.
- `motion-design` — decide whether and how to animate before adding a motion library.
- `ux-principles` — apply the principles behind the learning resources.
