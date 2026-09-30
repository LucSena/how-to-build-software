# Component libraries and UI kits (as of 2026-09)

Verification marks: **[V]** verified from the public repo or several sources · **[P]** partially verified (purpose known, some details such as license or stack not confirmed).

## 1. Primitives (behavior + accessibility, unstyled)

| Name | URL | What it is | Stack / license | When to use |
|---|---|---|---|---|
| Base UI [V] | https://base-ui.com | Unstyled, accessible React primitives from members of the MUI, Radix, and Floating UI teams. v1.0 shipped Dec 2025 with about 35 components, and v1.8.0 (2026-09-04) added a `createItems` API for Combobox. Exposes CSS variables such as `--transform-origin` for origin-aware popovers | React · MIT · `@base-ui/react` (new package name since v1.0) | Default primitives for new React work: Combobox, multi-select, Menu, Popover, Dialog |
| Radix Primitives [V] | https://www.radix-ui.com | The original unstyled primitives, maintained by WorkOS. Still maintained, but slower on complex widgets (Combobox, multi-select) | React · MIT · `radix-ui` or `@radix-ui/react-*` | Existing Radix/shadcn projects; don't migrate just for the sake of it |
| React Aria [V] | https://react-spectrum.adobe.com/react-aria/ | Adobe's hooks and components with deep accessibility and internationalization | React · Apache-2.0 | Complex a11y needs (date pickers, drag and drop, i18n) |
| Native HTML | n/a | `<dialog>`, `popover`, `<details>`, `commandfor`, anchor positioning | Browser | Simple overlays and disclosures before any library (see `web-platform`) |

## 2. Styled, owned components and registries

| Name | URL | What it is | Stack / license / install | When to use |
|---|---|---|---|---|
| shadcn/ui [V] | https://ui.shadcn.com | Not a dependency: a CLI plus registry that copies component source into your repo. Timeline: `shadcn create` lets you pick Radix or Base UI (Dec 2025); CLI v4 with `init --base` (Mar 2026); **Base UI is the default** (Jul 2026); components import `cn` from the new `cn` package (Sep 2026; migrate with `pnpm dlx shadcn@latest migrate cn`) | React + Tailwind v4 · MIT · `npx shadcn@latest init`, `npx shadcn@latest add button`, third-party `npx shadcn@latest add @ns/item` | Default starting point for React/Tailwind product UI. Retheme it (see `design-systems`) |
| coss ui [V] | https://coss.com/ui | "The official Cal.com Design System". It evolved from Origin UI and is built on Base UI from the ground up, in tiers of primitives and "particles" (pre-assembled composites such as auth forms, tables, and date pickers) | React, Tailwind, Base UI · **`apps/ui` and `apps/origin` are MIT; the monorepo default is AGPL-3.0** · `npx shadcn@latest add @coss/<component>` | Polished SaaS or scheduling-grade UI; ready composites |
| ReUI [V] | https://reui.io | By Keenthemes. A shadcn registry of 1,149 free components (22 built in-house: Data Grid, Kanban, Filters, Event Calendar, Gantt, File Upload…) for Base UI and Radix, shown inside realistic dashboard layouts (2026-09). Data-UI strengths: a data grid (about 34 layouts, drag-and-drop rows and columns, infinite scroll, sub-tables, built on TanStack Table), filters (TanStack + Zod + nuqs URL state), Recharts + Motion charts, kanban | React, Next.js, Tailwind · MIT · shadcn registry | Admin dashboards and data-dense apps |
| ObsidianUI [V] | https://obsidianui.dev | 30–35+ motion-heavy components, blocks, and templates (fluid cursor, 3D book flip, magnetic image trail). Mostly Motion, some GSAP, canvas, or Three.js. Has an MCP setup | React, Next.js, Tailwind · MIT · `npx shadcn@latest add "https://www.obsidianui.dev/r/{component}.json"` | Marketing and portfolio "wow" moments; not for dense app UI. Use one per page |
| Beautiful UI [P] | https://beautifului.dev | "Crafted primitives for AI-native interfaces" by the TurboProduct studio: thinking states, streaming text, human-in-the-loop approval cards, tool chips, task rows, prompt bars, diff tables | React/Tailwind implied · license unverified | Chat, copilot, and agent UIs (pair with `ai-interface-design`) |
| snapcn [V] | https://snapcn.dev | A shadcn registry of **Remotion** components for product-demo videos: 43 components (streaming AI answers, terminals, device frames, captions, scenes) themed from your shadcn tokens, plus a browser editor with MP4 export | React, Remotion 4 · MIT code with Free/Pro tiers · `npx shadcn@latest add @snapcn/text-reveal` | Launch videos, changelog clips, demo reels matching your UI |
| Drawably [V] | https://drawably.dev | Hand-drawn UI controls: each mount generates a fresh pen sketch around a native control, with the SVG hidden from assistive tech, so forms and a11y keep working. About 9 KB JS + 3 KB CSS gzipped, zero dependencies, React wrappers | JS/React · MIT · `npm i drawably` | Playful, sketchy, whiteboard, or education aesthetics |
| Bencho [P] | https://bencho.dev | A library of live, tweakable interactive UI blocks | Stack and license unverified | Interactive block ideas; verify before depending on it |

## 3. Specialized libraries (React)

| Need | Pick | URL | Notes |
|---|---|---|---|
| Node/graph editors, workflow builders | React Flow / xyflow [V] | https://reactflow.dev | `@xyflow/react` v12, MIT; optional paid Pro examples; Svelte Flow sibling. Don't hand-build canvas graph editors |
| Toasts | Sonner [V] | https://sonner.emilkowal.ski | MIT, v2.x. `npm install sonner`, add `<Toaster />`, call `toast()` |
| Drawer / bottom sheet | Vaul [V] | https://vaul.emilkowal.ski | MIT, built on Radix Dialog; **README says unmaintained** (last commit Oct 2025). Prefer a Base UI-based drawer in new code |
| Command palette | cmdk | https://cmdk.paco.me | Composable ⌘K menu; underlies shadcn's Command |
| Animation | Motion | https://motion.dev | Springs, layout and exit animations. Plain CSS transitions suffice for simple hovers and fades |
| Animated numbers | NumberFlow | https://number-flow.barvian.me | Transitions for changing numeric values |
| Drag and drop | dnd kit | https://dndkit.com | Accessible drag and drop with keyboard sensors |
| Tables and virtualization | TanStack Table / Virtual | https://tanstack.com | Headless tables and list virtualization |
| OTP input | input-otp | https://github.com/guilhermerodz/input-otp | One-time-code input that supports paste and autofill |

Emil Kowalski's `pick-ui-library` skill makes similar picks: Base UI (primitives), cmdk, Sonner, input-otp, Motion, NumberFlow, dnd kit, Virtuoso (virtualization), Recharts, and next-themes.

## 4. Vetting checklist

- [ ] Stack fits: framework, styling approach, SSR/RSC compatibility.
- [ ] License is compatible with the product (watch for AGPL, "Other", and commercial tiers).
- [ ] Maintained: a release within the last 6 months, open issues triaged, no "unmaintained" notice.
- [ ] Built on accessible primitives; keyboard and screen-reader behavior verified in a quick test.
- [ ] Styling uses your tokens or CSS variables, or can be retokened without forking everything.
- [ ] Bundle cost is acceptable (check the import cost; tree-shaking works).
- [ ] Doesn't introduce a second primitive system into the same surface.

## Sources

- shadcn/ui docs and changelog: https://ui.shadcn.com/docs/changelog
- Base UI releases: https://base-ui.com ; Radix: https://www.radix-ui.com
- coss monorepo LICENSING.md: https://github.com/cosscom/coss
- ReUI: https://github.com/keenthemes/reui
- ObsidianUI: https://github.com/Atharvsinh-codez/ObsidianUI
- snapcn: https://github.com/snapcndev/snapcn
- Sonner and Vaul repositories: https://github.com/emilkowalski/sonner ; https://github.com/emilkowalski/vaul
- Emil Kowalski skills (`pick-ui-library`): https://github.com/emilkowalski/skills
- ui-skills `baseline-ui` (prefer Base UI; don't mix primitive systems): https://github.com/ibelick/ui-skills
