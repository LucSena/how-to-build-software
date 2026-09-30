# C. Resource Catalog: 2026 web/mobile design, design engineering, AI-design tooling

Research date: 2026-09-30. Written for an AI agent that needs to know what each resource is and when to use it.

## Verification legend and method

- **[V-repo]**: verified by cloning the public GitHub repo and reading the source, README or LICENSE. This is the strongest level.
- **[V-web]**: verified through several web-search results, such as the site's own title and snippet, npm, GitHub or press. The site itself could not be fetched because WebFetch and curl are blocked.
- **[partial]**: the site exists and its purpose is known, but details such as pricing, license or stack were not confirmed.
- **[unverified]**: not confirmed. Treat as a lead only.
- **[MISMATCH]**: the resource is not what the task list implied. The correct identity is given.

Repos cloned into `$SCRATCH/refs3/`: `web-interface-guidelines` (vercel-labs), `design.md` (google-labs-code), `interfaces` (raunofreiberg), `emilkowalski_skills`, `emilkowalski_sonner`, `emilkowalski_vaul`, `pbakaus_impeccable`, `Leonxlnx_taste-skill`, `ibelick_ui-skills`, `remvze_desengs`, `snapcndev_snapcn`, `cosscom_coss`.

---

## 1. Component libraries and UI kits

### 1.1 Decision summary for agents

- **App primitives (accessibility, focus, keyboard)**:
  - Use **Base UI** for new work. It has been shadcn/ui's default since July 2026.
  - Use **Radix** if the project already uses it.
  - Never hand-roll dialogs, menus or comboboxes. Never mix primitive systems in one interaction surface (ui-skills `baseline-ui`).
- **Styled, owned components**: use **shadcn/ui** (you copy the source into your repo). Add registries on top:
  - **coss ui**: Base UI-native, Cal.com's system.
  - **ReUI**: data grids, filters, charts, kanban.
  - **ObsidianUI**: motion-heavy marketing blocks.
  - **Beautiful UI**: AI-agent interface pieces.
  - **snapcn**: Remotion product-demo video.
- **Node and graph editors**: use **React Flow (@xyflow/react)**.
- **Toasts and drawers**: **Sonner** is still the de-facto toast. **Vaul** is used under shadcn's Drawer, but its repo is marked **unmaintained** (see 1.2).

### 1.2 Table

| Name | URL | What it is | Stack / license / install | When to use |
|---|---|---|---|---|
| **shadcn/ui** [V-web] | ui.shadcn.com | Not a dependency. A CLI plus registry that copies component source into your project. It also hosts a registry ecosystem (`@namespace/item`). **2026 timeline:** Dec 2025, `npx shadcn create` lets you pick Radix or Base UI. Jan 2026, full Base UI docs. Feb 2026, every block in both Radix and Base UI variants. Mar 2026, **CLI v4** adds `init --base`. **Jul 2026, Base UI is the default.** **Sep 2026, components import `cn` from the new `cn` package**, a drop-in for `twMerge(clsx())`. Migrate with `pnpm dlx shadcn@latest migrate cn`. | React, Tailwind v4, Base UI (default) or Radix. MIT. `npx shadcn@latest init` then `npx shadcn@latest add button`. Third-party registries: `npx shadcn@latest add @coss/card`. | The default starting point for any React/Tailwind product UI. Use it when you want to own and edit the component code. |
| **Base UI** [V-web] | base-ui.com | Unstyled, accessible React primitives from the MUI / Radix / Floating UI creators. v1.0 shipped Dec 2025 with 35 components, about 37 by 2026. **v1.8.0 released 2026-09-04**, adding a `createItems` API for Combobox. Exposes CSS variables such as `--transform-origin` for origin-aware popovers. | React. MIT. No CSS, 5 dependencies. `npm i @base-ui/react` (package name per 2026 docs; confirm in project). | Primitives for new projects: Combobox, multi-select, Menu, Popover, Dialog. Emil's `pick-ui-library` names it the only pick for "unstyled, accessible UI components". |
| **Radix Primitives** [V-web] | radix-ui.com | The original unstyled primitives, **maintained by WorkOS**. Still maintained (last release Jul 2026, a Dialog ARIA fix), but slower on complex components such as Combobox and multi-select. `@radix-ui/react-slot` gets about 131M weekly downloads because of shadcn. | React. MIT. `npm i radix-ui` or per-package `@radix-ui/react-*`. | Existing Radix/shadcn projects. Don't migrate for its own sake. Pick Base UI for new work that needs Combobox. |
| **coss ui** [V-repo] | coss.com/ui | "coss.com/ui is the official Cal.com Design System". It evolved from **Origin UI** after Cal.com acquired it. Built on **Base UI from the ground up** (not ported from Radix). Layered tiers: *primitives* (Base UI), then *particles* (pre-assembled auth forms, tables, date pickers), and so on. | React, Tailwind, Base UI. **The `apps/ui` and `apps/origin` directories are MIT. The monorepo default is AGPL-3.0** (LICENSING.md). Install: `npx shadcn@latest add @coss/<component>`, for example `@coss/card`, `@coss/menu`, `@coss/accordion`. | A polished, Base UI-native shadcn-style kit. Good for SaaS/scheduling-grade product UI and for "particles" (ready composites). Copy from `apps/ui` (MIT), not other AGPL parts. |
| **ReUI** [V-repo meta, V-web] | reui.io | By Keenthemes. A "design-forward shadcn kit… 1000+ free patterns". A first-class shadcn registry that works with **both Base UI and Radix**. Strong in data UI: data grid with 34 layouts (DnD rows and columns, infinite scroll, sub-tables, TanStack Table), 12 filter components (TanStack + Zod + **nuqs URL state**), 25 Recharts+Motion charts, kanban, and 61 button / 31 input / 18 card / 20 alert variants. | React, Next.js, Tailwind, TanStack Table, Recharts, Motion. Open source (license not read; GitHub keenthemes/reui). Install via the shadcn registry. | Admin dashboards and data-dense apps: tables, filters, kanban, charts. |
| **ObsidianUI** [V-web, license V-repo meta] | obsidianui.dev | A library of 30–35+ **motion-heavy** components, blocks, landing pages and templates, such as a fluid cursor, 3D book flip and magnetic image trail. Most animations use Motion; some use GSAP, canvas or Three.js. It has an MCP setup and developer API. | React, Next.js, Tailwind, Motion/GSAP/Three. **MIT** (GitHub Atharvsinh-codez/ObsidianUI). `npx shadcn@latest add "https://www.obsidianui.dev/r/{component}.json"`. | Marketing/landing pages and portfolio "wow" moments. Not for dense app UI. |
| **snapcn** [V-repo] | snapcn.dev | A **shadcn registry of Remotion components** for product-demo *videos*: 43 components covering streaming AI answers, terminals, device frames, captions and full scenes. Components theme off your existing shadcn tokens (`SnapCnTheme`). A browser video editor exports MP4. | React, **Remotion 4**. **MIT** code, with a Free and a Pro tier. `npx shadcn@latest add @snapcn/text-reveal`, which writes files to `components/snap-cn/`. | Launch videos, changelog clips and demo reels that match your app's design system. |
| **Beautiful UI** [V-web] | beautifului.dev | "Crafted primitives for AI-native interfaces" by the TurboProduct design studio. Copy-paste components for agents: thinking states, streaming text, human-in-the-loop approval cards, tool chips, task rows, prompt bars, diff tables, flowcharts and agent screens. | React/Tailwind implied (copy-paste). License unverified. | Chat/agent UIs: tool-call visualization, approvals, reasoning display. |
| **UI Skills** [V-repo] | ui-skills.com | Not a component kit. It is a **catalog/registry of agent skills for design engineers** by ibelick (Julien Thibeaut). It has a CLI and an **MCP server** (`https://www.ui-skills.com/mcp`, tools `list_skills` and `get_skill`) and a "Playbook" of distilled lessons. Built-in skills: `baseline-ui`, `create-design-md`, `fixing-accessibility`, `fixing-metadata`, `fixing-motion-performance`, `improve-ui`. It also indexes third-party skills such as transitions.dev. | MIT. `npx ui-skills start`, `npx ui-skills list --category motion`, `npx ui-skills get baseline-ui`. | To give an agent opinionated UI constraints ("deslop" pass) or to discover design skills. `baseline-ui` rules are quoted in section 5. |
| **React Flow / xyflow** [V-web] | reactflow.dev | A library for node-based UIs: flow editors, pipelines, workflow builders and diagram tools. v12 is the `@xyflow/react` package (12.11.x in 2026). A Svelte Flow sibling exists. | React (and Svelte). **MIT**. Optional paid **React Flow Pro** for pro examples/templates and support. `npm install @xyflow/react`. | AI agent workflow builders, automation canvases, data pipelines, mind maps. Don't build custom canvas graph editors. |
| **atlas.attio.com** [MISMATCH, V-web] | atlas.attio.com | **Not a design system.** It is **"GTM Atlas by Attio"**, a free, ungated guide to modern AI go-to-market: lead capture, qualification, outbound, retention, plus a tools "Stack" directory. It was written with operators from Lovable, Vercel, Framer and others. Historically (2022 Dribbble) "Attio Atlas" was Attio's help center. Attio has an internal design library, but it is not public at this URL. | Content site. Free. | Cite as an **example of a beautifully crafted long-form editorial/content site**, or for GTM content. Don't treat it as a component source. |

**Notes:**
- **Sonner** (sonner.emilkowal.ski) [V-repo] is an opinionated React toast. MIT, v2.0.8. Install with `npm install sonner`, add `<Toaster />`, then call `toast()`. There is also an agent skill: `npx skills add https://github.com/emilkowalski/skills --skill ask-sonner`. Use it for all toasts. Don't hand-build toasts.
- **Vaul** (vaul.emilkowal.ski) [V-repo] is a React drawer (bottom sheet) built on Radix Dialog. MIT, v1.1.2. The **README says: "This repo is unmaintained… not in the near future."** The last commit was Oct 2025. It is still used by shadcn's Drawer. Treat it as stable-but-frozen, and prefer a Base UI-based drawer if one is available in your kit.

---

## 2. Design engineering and AI-design tooling (DESIGN.md ecosystem)

### 2.1 Agent design skills (install into Claude Code, Cursor, Codex and others)

| Name | URL | What it is | Stack / license / install | When to use |
|---|---|---|---|---|
| **Impeccable** [V-repo] | impeccable.style | By Paul Bakaus (Renaissance Geek, a16z-backed). "1 skill, 24 commands, live browser iteration, and **61 deterministic detector rules** for AI-generated frontend design." It started from Anthropic's `frontend-design` skill. `/impeccable init` writes **PRODUCT.md** (audience, purpose, constraints, voice). `/impeccable document` generates a root **DESIGN.md** from code. The commands are `craft`, `init`, `document`, `extract`, `shape`, `critique`, `audit`, `polish`, `bolder`, `quieter`, `distill`, `harden`, `onboard`, `animate`, `colorize`, `typeset`, `layout`, `delight`, `overdrive`, `clarify`, `adapt`, `optimize`, `live` and `generate`. `pin <cmd>` creates shortcuts. It ships a CLI and browser extension that run detectors with no LLM. | Apache-2.0. `npx impeccable install`, then `/impeccable init`. | Full design workflow for agents: critique, audit, polish. Deterministic anti-slop lint. Its **anti-patterns**: overused fonts (Arial, Inter, system), gray text on colored backgrounds, pure black/gray (always tint), cards nested in cards, and bounce/elastic easing. |
| **Taste Skill** [V-repo] | tasteskill.dev | "The Anti-Slop Frontend Framework for AI Agents" by Leonxlnx, about 28.5K stars. Several SKILL.md files. The default `design-taste-frontend` (v2, experimental) reads the brief and tunes three dials: **VARIANCE / MOTION / DENSITY**. It includes a hard em-dash ban, GSAP skeletons and a redesign-audit. Variants: `gpt-taste`, `image-to-code`, `redesign-existing-projects`, `high-end-visual-design` (soft), `minimalist-ui`, `industrial-brutalist-ui`, `stitch-design-taste` (Stitch/DESIGN.md export) and `full-output-enforcement`. Image-generation skills: `imagegen-frontend-web`, `imagegen-frontend-mobile`, `brandkit`. | MIT. `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`. | Greenfield marketing sites needing a strong art direction. Use a style-specific variant once the direction is chosen. Use the redesign skill for existing code. |
| **Emil Kowalski skills** [V-repo] | github.com/emilkowalski/skills | 42K stars. Skills: `emil-design-eng` (main: animation plus design), `animate`, `animate-expo` (RN/Expo), `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `apple-design` (WWDC principles for web), `write-swift`, `pick-ui-library`, `prototype` (multi-variant switcher), `mobile-native` (web app that feels native) and `ask-sonner`. | License not stated in README. `npx skills@latest add emilkowalski/skills`. | Motion decisions (easing, duration, springs), reviews in a Before/After/Why table, library selection, and making mobile web feel native. The rules are quoted in section 5. |
| **Vercel web-interface-guidelines** [V-repo] | github.com/vercel-labs/web-interface-guidelines | A living list of interface rules plus `AGENTS.md` (MUST/SHOULD/NEVER) and `command.md` (review command with anti-patterns). **All rules are extracted in section 5.** | MIT (2025). Skill: `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines`. | Code review of any web UI. Put AGENTS.md in the repo so generation follows it. |
| **Design with Intent** [V-web] | designwithintent.ai | A "UX strategy system for AI tools" with **17 skills** covering research, strategy, flows, content, accessibility, ethics and measurement. Its philosophy is to start with intended outcomes. Works with Cursor, Claude Code and Codex CLI, and is available as a Claude Code plugin. | License unverified. Install via the plugin marketplace (details unverified). | Upstream UX work before pixels: research plans, flows, content and measurement. |
| **TypeUI** [V-web, repo meta] | typeui.sh | By Bergside. An open-source CLI that manages **design-skill files (DESIGN.md-style)** for agents. It has a registry of 50+ styles such as Basic, Essential, Editorial, Application, Creative and Contemporary. A skill controls type scale, colors, surfaces, spacing/density, component patterns, a11y, writing tone and do/don't rules. Bergside also makes a **design-md Chrome extension**. | GitHub bergside/typeui, about 2K stars. License "Other" (check it). `npx typeui.sh pull <style>` (e.g. `modern`) and a `generate` command. | Quickly give a project a coherent visual direction as a file the agent follows. |
| **transitions.dev** [V-web] | transitions.dev | By Jakub Antalik. About 18 production-ready **CSS transitions**: dropdown, modal, panel reveal, number pop-in, text/icon swap, success check, error shake, shimmer, sliding tabs, accordion, plus-to-menu morph and more. Each has a live tuning playground. Snippets use `:root` custom properties, `t-*` classes and a `prefers-reduced-motion` guard. It also ships a "Transitions.dev Skill" (listed on ui-skills.com). | CSS. Copy-paste plus a skill. | Standard micro-interactions without a JS animation library. |

### 2.2 DESIGN.md generators and libraries

| Name | URL | What it is | Notes / when to use |
|---|---|---|---|
| **google-labs-code/design.md** [V-repo] | github.com/google-labs-code/design.md | **The official spec plus CLI** (`@google/design.md` v0.4.0, spec version `alpha`, Apache-2.0). Commands: `lint`, `diff`, `export`, `spec`. | The source of truth. Always validate generated DESIGN.md with `npx @google/design.md lint DESIGN.md`. See section 6. |
| **Refero Styles** [V-web] | styles.refero.design | A library of **2,000+ DESIGN.md files** extracted from top product sites. You can search by brand, mood, color, type or URL. **Free in beta.** Available via Refero MCP. | Pick a real-world reference style for an agent ("make it feel like X") without scraping. |
| **getdesign.md** [V-web] | getdesign.md | A collection of 70+ brand DESIGN.md files (Vercel, Stripe, Linear, Notion, Apple, Anthropic and others). Related to VoltAgent/awesome-design-md. Has a request form. | Drop-in brand-flavored DESIGN.md. Remember that copying a brand's look is inspiration, not a license to impersonate. |
| **designmd.supply** [V-web] | designmd.supply | An open-source Next.js app (context-dot-dev/designmd-supply, by @mynameisyahia, May 2026). You give it a domain and it returns a **Google-spec DESIGN.md** with the canonical 8 sections. It uses the Context.dev Styleguide, Brand, Screenshot and Markdown APIs. | Self-hostable URL-to-DESIGN.md. Pre-generated guides for google.com, apple.com, github.com, figma.com and others. |
| **designmd.me** [V-web] | designmd.me | "DesignMD": you paste a URL and it generates DESIGN.md with tokens, typography and components, plus a live HTML preview and **one-click Figma import** (variables, styles, a design board). | URL to DESIGN.md with a Figma round-trip. Pricing unverified. |
| **HyperDesign** (design-md.hyperbrowser.ai) [V-web] | design-md.hyperbrowser.ai | A Next.js app by Hyperbrowser. It screenshots and scrapes a URL, then **Claude Opus 4.7** analyzes it into a DESIGN.md with YAML front matter plus a preview. Source is in hyperbrowser-app-examples/hyperdesign. | URL to DESIGN.md via vision. Good for sites with obfuscated CSS. |
| **Open Design** [V-web] | open-design.ai | By nexu-io. An **Apache-2.0, local-first, BYOK "open-source alternative to Claude Design"** that drives your existing coding agent CLI (it auto-detects 13+, including Claude Code, Codex, Cursor and Gemini CLI). It makes prototypes, landing pages, dashboards, slides, images and video, exported as HTML/PDF/PPTX/MP4. It has 259+ skills and 142+ design systems. About 57K stars. | Local design-artifact generation with your own agent and keys. |
| **Aura** [V-web] | aura.build | A commercial AI web design builder. Prompt to HTML/CSS/JS/Tailwind, Design Mode visual editing, @-referencing templates/components, HTML and Figma export, and a CMS on Pro. It has 5,000+ templates, 2,800+ components and a **DESIGN.md generator and templates page** (`/design-systems`). | Fast landing pages and visual exploration with export to code or Figma. Paid Pro tier. |
| **Neuform** [partial] | neuform.ai | Prompt to AI HTML landing pages, remixable templates and "reusable DESIGN.md files for agent-ready design systems". | Landing page exploration and DESIGN.md seeding. Details unverified. |

### 2.3 Directories, portfolios and references for design engineers

| Name | URL | What it is | When to use |
|---|---|---|---|
| **DesEngs** [V-repo] | desengs.com | By MAZE (remvze). MIT, an Astro site. A curated directory of tools, articles, videos, communities, design engineers (Rauno, Emil and others) and a "Minimum" gallery of minimal personal sites (e.g. dqnamo.com). About 107 resources. | Finding tools and people to study. Minimal-website inspiration. |
| **Designeer** [V-web] | designeer.xyz | Launched 2026. A curated hub: about 120 component/motion libraries, 64 building tools (editors, coding agents, deploy), 61 utilities, visuals, and designers to follow. "Vetted for craft, not just popularity." | Picking a component or motion library. Discovering MCP servers and agents. |
| **Design Engineer Tools** [V-web] | designengineer.tools | By James Warner. A curated list covering inspiration (Awwwards, Mobbin), AI code (Claude Code, Cline, Cursor, v0), components (shadcn/ui, Motion Primitives), web utilities (easing editors, SVGOMG, RegExr), desktop utilities (Raycast, Warp) and video/capture (DaVinci, OBS, LosslessCut). | A tooling checklist for a design-engineering workstation. |
| **floguo notes / Design Engineering** [V-web, partial] | floguo.com/notes/design-engineering | By Flo Guo (ex-Vercel Design Engineering, now founding design engineer at Paradigm). A living doc covering what the role is, guidelines and agent skills (it links web interface guidelines and UI Skills), tools, pattern libraries and essays. Key lines: **"material understanding beats tool proficiency"**, and design engineers **think in the final medium, "where code and pixels become one malleable material."** | Onboarding reading on the role. Principles in section 5. |
| **dqnamo** [V-web] | dqnamo.com | Portfolio of JP (dqnamo), who does design engineering at "The Interface Company of London". It includes "The Kitchen", a set of playful component and interaction experiments (e.g. "Receipt Printer"), and is featured in DesEngs' minimal-site gallery. | Interaction-experiment inspiration and the minimal portfolio pattern. |
| **Bencho** [partial] | bencho.dev | "UI interactive blocks": a library of live, tweakable interactive blocks you can take into projects. Stack and license unverified. | Interactive block ideas. Verify the stack before use. |
| **Drawably** [V-web] | drawably.dev | A **hand-drawn UI controls** library. Each mount generates a fresh pen sketch, and hovering re-sketches it. Native controls stay in the DOM with `aria-hidden` SVG sketches around them, so a11y and forms still work. About 9 KB gzipped JS plus 3 KB CSS, zero dependencies, with React wrappers. It includes button, checkbox, radio, toggle, input, select, card, badge, tabs, tooltip, alert, steps, underline/highlight/circle/arrow annotations and more. | MIT. `npm i drawably`. Use for playful, sketchy or whiteboard aesthetics, education and indie products. |
| **Inspora** [V-web] | inspora.design | A curated archive of recent visual design posts pulled from X/Twitter (web, branding, product, motion, 3D, print). Updated hourly, free, with creator attribution and a source link. | Fresh trend scanning for visual and motion ideas. |
| **driver.rybicki.ai** [MISMATCH, V-web] | driver.rybicki.ai | **Not a design tool.** "Racing Driver Simulator": an unofficial text-based racing-career browser game (karting to the top in about 20 min, open dice rolls, a shareable career card, v1.9.5) by rybicki.ai (Bartosz Rybicki). | Only as an **example** of a polished single-tab web game / shareable-card UX. Why it was on the list is unverified. |
| **ui.sh** [unverified] | ui.sh | Could not verify. The web search budget ran out, curl is blocked, and there were no GitHub hits. Don't confuse it with **typeui.sh** (verified above). | Ask the user or verify manually before citing. |
| **interfaces.rauno.me** [V-repo] | interfaces.rauno.me | Rauno Freiberg's original **"Web Interface Guidelines"** (GitHub raunofreiberg/interfaces, last updated Jun 2023). It was the ancestor of Vercel's list. **All rules are extracted in section 5.** | Interaction/typography/motion checklist. The Vercel version supersedes it but has fewer typography rules. |

---

## 3. Icons

### 3.1 Icon libraries

| Name | URL | What it is | Stack / license / install | When to use |
|---|---|---|---|---|
| **Lucide** [V-web] | lucide.dev | Fork of Feather. **v1.0 released June 2026**. It **removed all brand icons** (use Simple Icons for logos), dropped UMD, and cut lucide-react by about 32%. It added context providers for global defaults in React/Vue/Svelte/Solid, better a11y defaults and shadow-DOM support. About 1,600–1,850 icons on a 24px grid with a **2px stroke** by default. shadcn's default icon set. | **ISC**. `npm i lucide-react`. Set props `size`, `strokeWidth`, `absoluteStrokeWidth`. | Default for shadcn/Tailwind apps. Neutral and consistent. |
| **Phosphor** [V-web] | phosphoricons.com | About 1,250+ base icons × **6 weights**: thin, light, regular, bold, fill, duotone. | MIT. `npm install @phosphor-icons/react`. | When you need weight variety, e.g. matching thin display type or filled active states. Also good duotone illustrations. |
| **Tabler Icons** [V-web] | tabler.io/icons | **6,220** icons: 5,166 outline plus 1,054 filled. 24×24 grid, 2px stroke. v3.48.0 released 2026-09-22. | MIT. `npm i @tabler/icons-react`. | Largest free, consistent outline set. Good for dashboards needing obscure metaphors. |
| **Remix Icon** [V-web] | remixicon.com | 3,200+ icons, each in **Line and Fill** styles on a 24×24 grid. A new **Remix Icon License v1.0 (Jan 2026)**: royalty-free commercial use, attribution appreciated but not required. Note: this is not Apache-2.0 anymore. | `npm i remixicon` or `@remixicon/react`. | Paired line/fill states (tab bars, toggles). Neutral "system" look. |
| **Hugeicons** [V-web] | hugeicons.com | Free: **6,000+ Stroke Rounded**. Pro: **60,000+ icons in 10 styles**, including Bulk, Duotone and Twotone multicolor. | Free MIT-style. Pro requires a license. `npm i @hugeicons/react @hugeicons/core-free-icons`, rendered with `<HugeiconsIcon icon={…} />`. RN package available. | Very large coverage, with multiple styles from one family. |
| **Iconsax** [V-web] | iconsax.io | Official Vuesax icon library. About 6,000–7,000 **free** icons (unlimited commercial use, no attribution) and 34,000+ premium, plus 1,000+ animated icons (Pro). Figma plugin. "Creator AI" generates on-style icons. | npm web component. Pro is a subscription or lifetime license. | Soft/rounded consumer-app aesthetic (popular in fintech and mobile). |
| **Iconly Pro** [V-web] | web.iconly.pro | About 31,000–40,000 flat icons plus animations and **customizable 3D icons**, in a web app and Figma. Free tier plus a Pro subscription. The free Figma "Iconly v3" is widely used. | Commercial. | Mobile/consumer UI with the Iconly look, and 3D icon hero art. |
| **Nucleo** [V-web] | nucleoapp.com | Premium set of **44,282 icons across 8 styles**: Core, UI, Sharp, Pixel, Micro Bold, Glass, Credit Card, Isometric. It has a macOS/Windows app that exports SVG, symbols, icon fonts, JSX and Vue. All Icons Bundle is **$149** (one-time); single sets are $69–99. | Commercial license. | Pro-grade coverage with small-size (micro) optimized variants, and a desktop icon manager. |
| **Isocons** [V-web] | isocons.app | **Isometric** icons you customize by orientation, fill/edge/sharp/rounded/stroke and color, with light/dark adaptation. SVG export and a Figma plugin. Free (out of beta). | Free. | Feature grids and marketing illustrations. Not UI chrome. |
| **SF Symbols 7** [V-web] | developer.apple.com/sf-symbols | Apple's system symbols, **6,900+**, aligned with San Francisco. New in 7 (WWDC25): **Draw On / Draw Off** animations (handwritten-stroke motion), **Variable Draw** (progress/strength), **gradient rendering**, and improved Magic Replace. Rendering modes: monochrome, hierarchical, palette, multicolor. | Apple platforms only, under the Apple license. **Do not use SF Symbols on web or Android.** `Image(systemName:)` in SwiftUI. | Native iOS/macOS/visionOS apps. Match the symbol weight and scale to adjacent text. |
| **Material Symbols** [V-web] | fonts.google.com/icons | Google's variable icon font in Outlined, Rounded and Sharp. 4 axes: **FILL** 0–1, **wght** 100–700, **GRAD** −25–200, **opsz** 20–48 (default 24). | Apache-2.0. Google Fonts CSS, `@material-symbols/font-400` or SVG. | Material/Android and cross-platform apps. Use FILL 0→1 for selected state, GRAD −25 for light-on-dark, opsz matched to the rendered size. |

### 3.2 Animated and morphing icons

| Name | URL | What it is | Install | When |
|---|---|---|---|---|
| **lucide-animated** [V-web] | lucide-animated.com | 350+ Lucide icons animated with Motion, as React components that animate on hover. MIT. Ports exist for Hugeicons, Tabler and Phosphor. | `npx shadcn@latest add "https://lucide-animated.com/r/{icon-name}.json"`, which writes `components/icons/<name>.tsx` and adds `motion`. | Micro-delight in a Lucide-based shadcn app. |
| **itshover** [V-web] | itshover.com/icons | 186+ "icons that move with intent", designed motion-first (not animation bolted on) with motion/react. Editable components, shadcn CLI compatible. Open source. | shadcn CLI or copy. | Interaction-triggered icon feedback in nav and CTAs. |
| **Moving Icons** [V-web] | movingicons.dev | 500+ animated Lucide icons **for Svelte 5**. Zero deps, tree-shakeable, MIT. By jis3r. | `npm i @jis3r/icons`, or the shadcn-svelte registry. | Svelte/SvelteKit projects. |
| **Morphicons** [V-web] | morphicons.com | Morphing between any two **stroke icons** (Lucide, Tabler, Heroicons, Iconoir, Hugeicons…) on the shared 24×24 grid with spring physics. 6.5 KB gzipped, zero deps. Rotation emerges from 2D Procrustes plus polar interpolation. Works with React, Vue, Svelte, React Native, Web Components and vanilla. | GitHub guillermolg00/morphicons. | State-change icons such as play→pause, menu→close, copy→check. |

### 3.3 Icon-usage rules for agents

1. **One family per product.** Mixing Lucide and Phosphor in one surface breaks stroke, corner and terminal consistency. Use a second set only for brand logos (Simple Icons), which Lucide v1 no longer ships.
2. **Consistent stroke width.** Keep one stroke (Lucide/Tabler default is 2px at 24px). When scaling icons down to 16px, use `absoluteStrokeWidth` in Lucide or pick a size-optimized variant (Nucleo Micro, Material `opsz`). This keeps the rendered stroke visually equal across sizes instead of thinning.
3. **Standard sizes on the spacing grid:**
   - 16px for dense/inline text.
   - 20px for default UI buttons and inputs.
   - 24px for nav, tab bars and toolbars.
   - 32–48px for empty states and feature tiles.
   - Keep the icon box square (`size-*` in Tailwind).
4. **Match text weight and size.** Icon optical height ≈ cap height of adjacent text. Vercel: "a thin-stroke icon may need a bolder stroke next to medium-weight text" (Balance contrast in lockups). With SF Symbols, match the symbol weight to the font weight and use text-style scales. Material Symbols: match `wght` to the font weight and `opsz` to the pixel size.
5. **Optical alignment.** Geometric centering often looks wrong. Nudge by ±1px, e.g. play triangles right, and icons beside text to align with x-height/cap-height rather than the line box ("Adjust ±1px when perception beats geometry", Vercel). In a button, icon-side padding is often slightly smaller than text-side padding.
6. **Filled vs outline encodes state.** Outline for rest, filled for selected/active (tab bars): Remix Line/Fill, Material FILL axis, Phosphor regular/fill. Don't mix fill styles for peers in the same state.
7. **Hit targets ≠ glyph size.** The glyph can be 16–20px, but the target must be ≥24px on desktop and ≥44px on mobile (Vercel).
8. **Accessibility.** Icon-only buttons need `aria-label`. Decorative icons get `aria-hidden="true"`. Never rely on the icon alone for status ("Icons have labels", "Redundant status cues").
9. **Color.** Icons inherit `currentColor`. Tint on colored backgrounds (hue consistency). On hover/active, raise the contrast.
10. **Animate sparingly.** Animated icons suit rare or feedback moments (copy→check, success). Don't animate icons the user triggers 100+ times per day (Emil's frequency rule). Honor `prefers-reduced-motion`.
11. **Platform-native on native.** Use SF Symbols on Apple platforms and Material Symbols on Android. Never ship SF Symbols in web or Android builds (license).

---

## 4. Inspiration and reference galleries

| Name | URL | What it is | Pricing | When to use |
|---|---|---|---|---|
| **Mobbin** [V-web] | mobbin.com | The largest real-app reference library: **621,500+ screens and 142,200+ flows** (iOS, Android, web). **Mobbin MCP** (launched May 2026) connects agents to the library and is included in all paid plans. | Pro $10/mo (annual). Team $16/member/mo. Free plan has no flows and no MCP. | Researching how shipped apps solve a pattern (onboarding, paywall, settings). The agent can query it via MCP. |
| **Refero** [V-web] | refero.design | Design research for humans and AI: 142,000+ screens (74K web, 67K iOS), 12,000+ flows, 400+ apps. Figma plugin. **Refero MCP** gives up to 8,000 calls per user per month on paid plans. Refero Styles (DESIGN.md) is described in section 2.2. Also has `referodesign/refero_skill`, a research-first design skill. | Free (~3% of the library). Pro $10/mo (annual $120). Team $12/seat/mo. Lifetime available. Business $0.001/request ($2K minimum). | Web plus iOS references with an agent MCP. A cheaper Mobbin alternative with a web-app focus. |
| **Page Flows** [V-web] | pageflows.com | **Recorded video user flows**: 4,000+ recordings, 79,000+ screens, emails and UI elements. | $8.25/mo (yearly, $99). Quarterly $39. Team from $199/yr for 3–10 users. 3-day trial. | Studying end-to-end flows as video (onboarding, checkout, cancellation) and lifecycle emails. |
| **Gummble** [V-web] | gummble.com | 300,000+ screenshots, 21,000+ flows, 1,500+ iOS/Android/web apps. Has an **MCP** for searching screens, flows, patterns and microcopy. Positioned as a cheap Mobbin alternative. | Free browse tier. Paid about $9.99/mo. | Budget pattern research with agent access. |
| **ScreensDesign** [V-web] | screensdesign.com | An iOS app "UI/UX intelligence" library: 1,500+ top apps (about 40 new per week), with video flow previews and **revenue/install/conversion metrics**. Onboarding and **paywall** focus. It also has an AI screen generator seeded from 2,715+ top-grossing subscription apps, and an App Store screenshots section. | Paid (tiers unverified). | Subscription-app onboarding, paywalls and App Store screenshots backed by revenue data. |
| **Appshots** [V-web] | appshots.design | Curated mobile (iOS/Android) screenshot gallery: about 70K+ screenshots, 1,000+ flows, 400+ apps. | Pricing unverified. | Quick mobile visual research. |
| **Collect UI** [V-web] | collectui.com | Daily hand-picked UI shots from Dribbble (Daily UI archive and beyond), filterable by element (search field, cart, profile). Links to the designers. | Free. | Component-level visual ideas. Be aware these are Dribbble concepts, not shipped products. |
| **Godly** [V-web] | godly.website (the task list's "godly.design" resolves to this) | "Astronomically good web design inspiration". 1,000+ hand-picked sites, shown as **motion/interaction videos** and fullscreen shots. Filters by style (e.g. interactive). | Free. | Marketing and landing sites with motion. Award-grade visual direction. |
| **Deck Gallery** [partial] | deck.gallery | "Deck.Gallery®": curated pitch decks, slides, keynotes and brand guidelines, slide by slide. Sells deck templates (Big Deck, Tech Deck) via Lemon Squeezy. | Free browse. Templates paid. | Pitch deck and presentation design. |
| **Animos** [V-web] | animos.app | **Not a gallery.** It is a browser-based tool that turns designs into motion showcases: 30+ templates, 4K MP4/WebM export, in under 1 minute. Launched July 2026. Freemium. | Freemium. | Portfolio reels and product shots (pair with snapcn for code-based demo video). |
| **transitions.dev** | see 2.1 | Motion snippet reference. | Free. | Motion patterns. |
| **Backgrounds Supply** [V-web] | backgrounds.supply | 1,167 handcrafted gradient and AI backgrounds in 24 collections, at 6K resolution, with the **Midjourney prompts included**. | One-time purchase. Commercial license. | Hero backgrounds, slides, social. Use sparingly: purple gradients are a known AI-slop tell (ui-skills: "NEVER use purple or multicolor gradients"). |
| **Revyl** [MISMATCH, V-web] | revyl.com | **Not a gallery.** A YC F24 mobile development and **AI testing** platform: natural-language tests on cloud devices for iOS/Android, Expo, RN, Flutter and native, plus CI and AI-tool integration. Has a CLI (RevylAI/revyl-cli). | Commercial. | Mobile QA/E2E testing of the app you designed. Belongs in a testing catalog. |
| **Inspora** | see 2.3 | Hourly X-sourced visual archive. | Free. | Trend scanning. |

**Gallery selection rules:**
- For a *pattern that must work* (onboarding, checkout, settings), use shipped-product libraries: Mobbin, Refero, Page Flows, Gummble, ScreensDesign.
- For *visual direction*, use Godly, Inspora or Collect UI.
- For *agent workflows*, prefer the MCP-enabled ones (Mobbin, Refero, Gummble), or DESIGN.md libraries such as Refero Styles.

---

## 5. Design engineering principles (quoted rules)

### 5.1 Vercel Web Interface Guidelines: complete extraction (README.md, MIT, 2025; repo last updated 2026-08-17)

**Interactions**
- **Keyboard works everywhere.** "All flows are keyboard-operable & follow the WAI-ARIA Authoring Patterns."
- **Clear focus.** "Every focusable element shows a visible, unobscured focus ring. Prefer `:focus-visible` over `:focus`… Set `:focus-within` for grouped controls. Sticky headers, footers, banners, & overlays never cover the focused element."
- **Manage focus.** Use focus traps, and move and return focus per WAI-ARIA patterns.
- **Match visual & hit targets.** "if the visual target is < 24px, expand its hit target to ≥ 24px. On mobile, the minimum size is 44px."
- **Mobile input size.** "`<input>` font size is ≥ 16px on mobile to prevent iOS Safari auto-zoom." (The README also offers a `maximum-scale=1` viewport alternative, but AGENTS.md says NEVER disable zoom. Follow AGENTS.md.)
- **Respect zoom.** Never disable browser zoom.
- **Hydration-safe inputs.** No lost focus or value after hydration.
- **Don't block paste.**
- **Loading buttons.** "Show a loading indicator & keep the original label."
- **Minimum loading-state duration.** "add a short show-delay (~150–300 ms) & a minimum visible time (~300–500 ms) to avoid flicker." React `<Suspense>` does this.
- **URL as state.** Persist state in the URL (e.g. nuqs).
- **Optimistic updates.** Reconcile on the response. On failure, show an error and roll back or offer Undo.
- **Ellipsis for further input & loading states.** "Rename…", "Loading…", "Saving…", "Generating…".
- **Confirm destructive actions.** Confirm, or give Undo with a safe window.
- **Prevent double-tap zoom on controls.** Use `touch-action: manipulation`.
- **Tap highlight follows design.** Set `-webkit-tap-highlight-color`.
- **Design forgiving interactions.** Generous hit targets, clear affordances, prediction cones.
- **Tooltip timing.** "Delay the first tooltip in a group; subsequent peers have no delay."
- **Overscroll behavior.** Use `overscroll-behavior: contain` in modals and drawers.
- **Scroll positions persist.** Back/Forward restores scroll.
- **Autofocus for speed.** On desktop with a single primary input. Rarely on mobile.
- **No dead zones.** "If part of a control looks interactive, it should be interactive."
- **Deep-link everything.** "Filters, tabs, pagination, expanded panels, anytime `useState` is used."
- **Clean drag interactions.** Disable text selection and apply `inert` while dragging.
- **Gestures have alternatives.** Every drag, swipe, pinch or path gesture also works via tap/click and keyboard unless the gesture is essential (WCAG 2.2).
- **Links are links.** Use `<a>`/`<Link>`, never `<button>`/`<div>`, for navigation.
- **Announce async updates.** Use polite `aria-live` for toasts and inline validation.
- **Locale-aware keyboard shortcuts.** Support non-QWERTY layouts and show platform symbols.

**Animations**
- **Honor `prefers-reduced-motion`** with a reduced variant.
- **Implementation preference:** "CSS > Web Animations API > JavaScript libraries".
- **Compositor-friendly:** animate `transform` and `opacity`. Avoid `width`, `height`, `top` and `left`.
- **Necessity check:** animate "only… when it clarifies cause & effect or when it adds deliberate delight."
- **Easing fits the subject.**
- **Interruptible.**
- **Input-driven.** No autoplay except muted, non-essential loops. Motion longer than 5s needs pause, stop or hide.
- **Correct transform origin.** "Anchor motion to where it 'physically' starts."
- **Never `transition: all`.**
- **Cross-browser SVG transforms.** Transform `<g>` wrappers with `transform-box: fill-box; transform-origin: center`.

**Layout**
- **Optical alignment.** ±1px.
- **Deliberate alignment.** "No accidental positioning."
- **Balance contrast in lockups.** Icon weight vs text weight.
- **Responsive coverage.** Test mobile, laptop and ultra-wide (zoom to 50%).
- **Respect safe areas.** Use `env(safe-area-inset-*)`.
- **No excessive scrollbars.** Test with macOS "Show scroll bars: Always".
- **Let the browser size things.** Use flex/grid/intrinsic sizing, not JS measuring.

**Content**
- **Inline help first.** Tooltips are the last resort.
- **Stable skeletons.** They mirror the final content exactly.
- **Accurate page titles.**
- **No dead ends.**
- **All states designed.** "Empty, sparse, dense, & error states."
- **Typographic quotes.** Use curly quotes.
- **Avoid widows/orphans.**
- **Tabular numbers for comparisons.** Use `font-variant-numeric: tabular-nums`.
- **Redundant status cues.** Not color alone.
- **Icons have labels.**
- **Don't ship the schema.** Accessible names exist even if visible labels are omitted.
- **Use the ellipsis character.** Write `…`.
- **Anchored headings.** Set `scroll-margin-top`.
- **Resilient to user-generated content.** Handle short, average and very long content.
- **Locale-aware formats.**
- **Prefer language settings over location.** Use `Accept-Language` and `navigator.languages`, never IP/GPS.
- **Shield verbatim content from translation.** Use `translate="no"`.
- **Accessible content.** Use `aria-label` and `aria-hidden`, and check the accessibility tree.
- **Icon-only buttons are named.**
- **Semantics before ARIA.**
- **Headings & skip link.**
- **Accessible media.** Captions, transcripts, keyboard-operable controls.
- **Brand resources from the logo.** Right-clicking the nav logo shows brand assets.
- **Non-breaking spaces for glued terms.** `10&nbsp;MB`, `⌘&nbsp;+&nbsp;K`, and `&#x2060;` for no space.

**Forms**
- **Enter submits** (the last control if there are many). **Textarea:** ⌘/⌃+Enter submits.
- **Labels everywhere.** **Label activation** focuses the control.
- **Submission rule.** "Keep submit enabled until submission starts; then disable during the in-flight request, show a spinner, & include an idempotency key."
- **Don't block typing.** Validate after.
- **Don't pre-disable submit.**
- **No dead zones on controls.** Checkbox/radio and label share one hit target.
- **Error placement.** Errors go next to fields. Focus the first error on submit.
- **Autocomplete & names.**
- **Spellcheck selectively.**
- **Correct types & input modes.**
- **Placeholders signal emptiness.** They end with `…` and show an example value, e.g. `+1 (123) 456-7890`, `sk-012345679…`.
- **Unsaved changes.** Warn before leaving.
- **Password managers & 2FA.** Allow pasting codes.
- **Don't trigger password managers for non-auth fields.** Use `autocomplete="off"`, or `one-time-code` for OTP.
- **Text replacements & expansions.** Trim trailing whitespace.
- **Windows `<select>` background.** Set `background-color` and `color` explicitly.

**Performance**
- **Device/browser matrix.** iOS Low Power Mode and macOS Safari.
- **Measure reliably.** Disable extensions.
- **Track re-renders.** React DevTools, React Scan.
- **Throttle when profiling.**
- **Minimize layout work.** Batch reads and writes.
- **Network latency budgets.** "`POST/PATCH/DELETE` complete in <500ms."
- **Keystroke cost.** Prefer uncontrolled inputs.
- **Large lists.** Virtualize (virtua, `content-visibility: auto`). command.md sets the threshold at >50 items.
- **Preload wisely.** Only above-the-fold images.
- **No image-caused CLS.** Use explicit dimensions.
- **Preconnect to origins.**
- **Preload fonts.**
- **Subset fonts.** Use `unicode-range` and limit variable axes.
- **Don't use the main thread for expensive work.** Use Web Workers.
- **Video over animated GIF.** Use `<video autoplay muted loop playsinline>`.
- **Safari video-as-image.** An H.264 MP4 in `<picture>`, gated by `prefers-reduced-motion`.

**Design**
- **Layered shadows.** "Mimic ambient + direct light with at least two layers."
- **Crisp borders.** "Combine borders & shadows; semi-transparent borders improve edge clarity."
- **Nested radii.** "Child radius ≤ parent radius & concentric."
- **Hue consistency.** Tint borders, shadows and text toward the background hue.
- **Accessible charts.** Use color-blind-safe palettes.
- **Minimum contrast.** "Prefer APCA over WCAG 2."
- **Interactions increase contrast.** Hover, active and focus are stronger than the rest state.
- **Browser UI matches your background.** Set `<meta name="theme-color">`.
- **Set the appropriate color-scheme.** Use `color-scheme: dark` on `<html>`.
- **Text anti-aliasing & transforms.** Animate a wrapper, not the text node. Use `translateZ(0)` / `will-change` if needed.
- **Avoid gradient banding.** Use background images instead of CSS mask fades to dark.

**Vercel-specific copywriting (not universal)**
- Active voice ("Install the CLI").
- Title Case (Chicago) for headings and buttons in product. Sentence case on marketing pages.
- Clear and concise.
- `&` over "and".
- Action-oriented.
- Consistent nouns.
- Second person.
- Consistent placeholders (`YOUR_API_TOKEN_HERE`, `0123456789`).
- Numerals for counts ("8 deployments").
- Currency with 0 or 2 decimals, never mixed.
- A space between number and unit (`10 MB`, as `10&nbsp;MB`).
- Positive language ("Something went wrong—try again or contact support").
- Error messages "guide the exit", e.g. "Your API key is incorrect or expired. Generate a new key in your account settings."
- Specific labels ("Save API Key", not "Continue").

**Extra rules found only in `command.md` / `AGENTS.md`:**
- `text-wrap: balance` / `text-pretty` on headings.
- Flex children need `min-w-0` for truncation.
- Text containers use `truncate` / `line-clamp-*` / `break-words`.
- Below-fold images use `loading="lazy"`. Critical images use `fetchpriority="high"`.
- No layout reads in render (`getBoundingClientRect`, `offsetHeight`…).
- Fonts: `<link rel="preload" as="font">` with `font-display: swap`.
- Use `Intl.DateTimeFormat` and `Intl.NumberFormat`, never hardcoded formats.
- Inputs with `value` need `onChange`, or use `defaultValue`.
- Guard date rendering against hydration mismatch. Use `suppressHydrationWarning` only where needed.
- Buttons and links need a `hover:` state.
- Muted decorative loops stop under reduced motion.
- **Anti-patterns to flag:**
  - `user-scalable=no` / `maximum-scale=1`
  - `onPaste` + `preventDefault`
  - `transition: all`
  - `outline-none` without a focus-visible replacement
  - `onClick` navigation without `<a>`
  - clickable `<div>`/`<span>`
  - images without dimensions
  - big `.map()` without virtualization
  - inputs without labels
  - icon buttons without `aria-label`
  - hardcoded date/number formats
  - unjustified `autoFocus`
  - GIFs where video would do
  - gesture-only actions
- **Review output format:** grouped by file, `file:line - finding`, terse, "✓ pass" for clean files, no preamble.

### 5.2 Rauno Freiberg: interfaces.rauno.me "Web Interface Guidelines" (repo raunofreiberg/interfaces)

Rules unique to or stronger than the Vercel list:

**Interactivity**
- Wrap inputs in `<form>` so Enter submits.
- Input prefix/suffix icons are "absolutely positioned on top of the text input with padding, not next to it, and trigger focus on the input".
- "Toggles should immediately take effect, not require confirmation."
- "Buttons should be disabled after submission to avoid duplicate network requests."
- "Interactive elements should disable `user-select` for inner content."
- "Decorative elements (glows, gradients) should disable `pointer-events`."
- List items have "no dead areas between each element, instead, increase their `padding`."

**Typography**
- `-webkit-font-smoothing: antialiased` and `text-rendering: optimizeLegibility`.
- Subset fonts.
- "Font weight should not change on hover or selected state to prevent layout shift."
- "Font weights below 400 should not be used."
- "Medium sized headings generally look best with a font weight between 500-600."
- Fluid `clamp(48px, 5vw, 72px)`.
- Tabular nums in tables and timers.
- `-webkit-text-size-adjust: 100%`.

**Motion**
- "Switching themes should not trigger transitions and animations on elements" (next-themes handles this).
- "Animation duration should not be more than 200ms for interactions to feel immediate."
- "Animation values should be proportional to the trigger size": don't scale a dialog from 0→1, fade from about 0.8. Buttons press to about 0.96/0.9, not 0.8.
- "Actions that are frequent and low in novelty should avoid extraneous animations": right-click menu, list add/delete, trivial hovers. (The macOS context menu animates only on exit.)
- Pause looping animations off-screen.
- `scroll-behavior: smooth` with an offset for anchors.

**Touch**
- Use `@media (hover: hover)` so hover doesn't flash on tap.
- Inputs ≥16px.
- No autofocus on touch.
- `muted playsinline` for iOS autoplay.
- Disable `touch-action` for custom pan/zoom.
- Remove the iOS tap highlight "but always replace it with an appropriate alternative".

**Optimizations**
- Large `blur()` / `backdrop-filter` is slow.
- Scaling/blurring filled rectangles bands; use radial gradients.
- Use `translateZ(0)` sparingly.
- Toggle `will-change` only during the animation.
- Too many autoplaying iOS videos choke the device; unmount off-screen ones.
- Bypass React renders with refs for real-time values.
- Adapt to device and network capability.

**Accessibility**
- "Disabled buttons should not have tooltips."
- "Box shadow should be used for focus rings, not outline which won't respect radius" (a 2023 note: Safari 16.4+ fixes outline radius).
- Lists are navigable with ↑/↓ and deletable with ⌘⌫.
- "dropdown menus should trigger on `mousedown`, not `click`."
- An SVG favicon that respects `prefers-color-scheme`.
- Hover tooltips contain no interactive content.
- Use `<img>` for images.
- HTML illustrations get an `aria-label`.
- "Gradient text should unset the gradient on `::selection`."
- Nested menus use a prediction cone.

**Design**
- Optimistic updates with rollback.
- Auth redirects happen server-side before client load.
- Style `::selection`.
- "Display feedback relative to its trigger": an inline checkmark on copy, not a notification. Highlight the erroring inputs.
- "Empty states should prompt to create a new item, with optional templates."

**"Invisible Details of Interaction Design"** (rauno.me/craft/interaction-design) [**unverified**: the page could not be fetched, so this is summarized from memory; verify before quoting]. The essay argues that great interactions borrow from the physical world:
- **Metaphors and spatial consistency**: things exit where they entered, like the Dynamic Island.
- **Kinetic physics**: momentum and velocity carry into a release, and gestures project where they will land.
- **Interruptibility**: an animation can be redirected mid-flight.
- **Frequency vs novelty**: frequent actions get less motion.
- **Fidgetability**: satisfying interactions people play with.
- **Responsive gestures that commit on intent**, not on the end of a threshold.
- **Implicit input**: the system infers context.
- **Ergonomics / Fitts's law**: targets near the pointer, infinite edges.
- **Scroll landmarks.**

The core claim: "when a feature functions exactly as someone assumes it should, they proceed without giving it a second thought" (Emil's skill paraphrases the same idea as "unseen details compound").

### 5.3 Emil Kowalski (emilkowal.ski, animations.dev; ex-Vercel, Linear): from `emilkowalski/skills` [V-repo]

- **Philosophy.**
  - "Taste is trained, not innate."
  - "Unseen details compound."
  - "Beauty is leverage."
- **Should it animate?** Decide by frequency:
  - "100+ times/day (keyboard shortcuts, command palette toggle): No animation. Ever."
  - Tens per day (hover, list navigation): "Remove or drastically reduce".
  - Occasional (modals, drawers, toasts): standard animation.
  - Rare/first-time: "Can add delight".
  - **"Never animate keyboard-initiated actions."** (Raycast has no open/close animation.)
- **Purpose required.** Valid purposes are spatial consistency, state indication, explanation, feedback, and preventing jarring changes. "If the purpose is just 'it looks cool' and the user will see it often, don't animate."
- **Easing decision tree:**
  - Enter/exit → **ease-out**.
  - Moving/morphing on screen → **ease-in-out**.
  - Hover/color → **ease**.
  - Constant motion → **linear**.
  - **"Never use ease-in for UI animations."**
  - Use custom curves: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` (iOS-like, from Ionic).
  - Sources: easing.dev, easings.co.
- **Durations:**
  - Button press 100–160ms.
  - Tooltips and small popovers 125–200ms.
  - Dropdowns and selects 150–250ms.
  - Modals and drawers 200–500ms.
  - **"UI animations should stay under 300ms."**
  - A faster spinner makes loading feel faster.
- **Springs** for drag with momentum, "alive" elements, interruptible gestures and decorative mouse-tracking.
  - Apple-style config: `{ type: "spring", duration: 0.5, bounce: 0.2 }`.
  - Keep bounce at 0.1–0.3 and avoid it in most UI.
  - Springs keep velocity when interrupted.
- **Components:**
  - Buttons get `:active { transform: scale(0.97) }` (range 0.95–0.98).
  - **"Never animate from scale(0)"**: use `scale(0.95); opacity: 0`.
  - Popovers are origin-aware (`transform-origin: var(--transform-origin)`), but **modals stay centered**.
  - Tooltips skip the delay and animation on subsequent hovers.
  - Use CSS transitions over keyframes for interruptible UI.
  - Blur masks imperfect crossfades.
  - Use `@starting-style` for enter animations.
- **Performance:**
  - Animate only transform and opacity.
  - CSS beats JS under load.
  - Use WAAPI for programmatic CSS animations.
  - Beware CSS-variable inheritance cost.
- **Accessibility:** "Reduced motion means fewer and gentler animations, not zero." Keep opacity and color, and remove movement. Put hover under `@media (hover: hover) and (pointer: fine)`.
- **Sonner principles:**
  - "Cohesion matters". Sonner is slightly slower and uses `ease` to feel elegant, so match motion to personality.
  - "Review your work the next day". Also watch in slow motion.
  - **Asymmetric timing:** "slow where the user is deciding, fast where the system is responding". Hold-to-delete takes 2s linear, and release takes 200ms ease-out.
- **Review format:** a markdown table with **Before | After | Why** columns.
- **Library picks (`pick-ui-library`):**
  - base-ui (primitives), cmdk (⌘K), Sonner (toasts), input-otp, Leva/dialkit (control panels).
  - motion (springs, layout, exit), NumberFlow (numbers), torph (animated text), Cobe (globes), Satori (OG images), shiki (highlighting).
  - Liveline (streaming charts) vs recharts (everything else).
  - dnd kit (drag and drop), Virtuoso (virtualization).
  - zustand (state), clsx and cva (styling), next-themes (theme switching).
  - "A simple hover or fade doesn't need [motion]; plain CSS transitions are the right tool."

### 5.4 UI Skills `baseline-ui` (ibelick) [V-repo]: an opinionated anti-slop baseline

- **Stack:**
  - Tailwind defaults.
  - `motion/react` for JS animation.
  - `tw-animate-css` for micro-animations.
  - `cn` for class logic.
- **Components:**
  - Use accessible primitives (Base UI, React Aria, Radix).
  - "NEVER mix primitive systems within the same interaction surface."
  - Prefer Base UI for new primitives.
  - Never rebuild keyboard/focus behavior by hand.
- **Interaction:**
  - Use `AlertDialog` for destructive actions.
  - Structural skeletons.
  - "NEVER use `h-screen`, use `h-dvh`."
  - `safe-area-inset` for fixed elements.
  - Errors next to the action.
- **Animation:**
  - "NEVER add animation unless it is explicitly requested."
  - Compositor props only.
  - `ease-out` on entrance.
  - "NEVER exceed `200ms` for interaction feedback."
  - Pause loops off-screen.
  - No custom easing unless requested. (This contrasts with Emil, who wants custom curves. Pick one per project.)
- **Typography:**
  - `text-balance` for headings and `text-pretty` for body.
  - `tabular-nums` for data.
  - "NEVER modify `letter-spacing`" unless requested.
- **Layout:**
  - A fixed z-index scale.
  - `size-*` for squares.
- **Performance:**
  - Never animate large `blur()` / `backdrop-filter`.
  - `will-change` only during animation.
  - "NEVER use `useEffect` for anything that can be expressed as render logic."
- **Design:**
  - "NEVER use gradients unless explicitly requested".
  - "NEVER use purple or multicolor gradients".
  - No glow as a primary affordance.
  - Tailwind shadow scale.
  - Empty states get "one clear next action".
  - "limit accent color usage to one per view".

### 5.5 Impeccable and Taste: common AI-slop tells to avoid

Impeccable's list of AI tells:
- "Inter for everything, purple-to-blue gradients, cards nested in cards, gray text on colored backgrounds, the rounded-square icon tile above every heading."
- Don't use pure black or gray (always tint).
- No bounce/elastic easing.

Taste Skill adds:
- A hard ban on em dashes in generated copy.
- Explicit "dials" for variance, motion and density instead of defaults.

### 5.6 floguo and Designeer (role framing)

- Flo Guo: "material understanding beats tool proficiency". Design engineers work in the final medium, "where code and pixels become one malleable material". Guidelines and agent skills (Vercel guidelines, UI Skills) are part of the modern toolkit.
- Designeer is a curation site, not a rules source. Its stated bar is "vetted for craft, not just popularity" and "tested, not just trending". No numbered principles were found [partial].

### 5.7 Synthesized principles for the skills repo (agent-ready)

1. **Accessibility is the floor, not polish.** Keyboard, focus-visible, labels, semantics before ARIA, and targets of 24px (44px on mobile).
2. **State lives in the URL.** Deep-link anything that would be in `useState` and matters on refresh or share.
3. **Every state is designed.** Empty, loading (stable skeletons, anti-flicker delays), sparse, dense, error, and long content.
4. **Motion is earned.**
   - Frequency decides: never animate keyboard or 100×/day actions.
   - Use ease-out for enter, never ease-in.
   - Keep interactions under 200–300ms.
   - Animate transform and opacity only.
   - Motion must be interruptible and origin-aware.
   - Scale from 0.9–0.95, never 0.
   - Reduced motion means gentler, not none.
5. **Feedback is local and immediate.**
   - Optimistic updates with Undo.
   - An inline check on copy.
   - Errors beside fields.
   - Loading labels end in `…`.
6. **Typography details.**
   - Tabular numbers.
   - `text-wrap: balance` / `pretty`.
   - Curly quotes and `…`.
   - `&nbsp;` for units.
   - No weight change on hover.
   - Inputs ≥16px on mobile.
7. **Surfaces.**
   - Layered shadows plus semi-transparent borders.
   - Concentric nested radii.
   - Hue-tinted neutrals.
   - APCA contrast.
   - `color-scheme` and `theme-color` set.
8. **Avoid AI tells.**
   - Default Inter everywhere.
   - Purple gradients and glows.
   - Nested cards.
   - Gray-on-color text.
   - An icon tile over every heading.
   - Gratuitous animation.
9. **Encode design intent in DESIGN.md**, and lint it. Use a specific reference, not adjectives (section 6).

---

## 6. The DESIGN.md format (Google Stitch / google-labs-code) [V-repo]

**Provenance.**
- Google introduced DESIGN.md in its AI design tool **Stitch** (about March 2026, per secondary sources).
- It open-sourced the format spec plus CLI at **github.com/google-labs-code/design.md** (Apache-2.0). The open-sourcing date is 2026-04-21 per the-decoder and Medium [V-web].
- Spec version: **`alpha`**. CLI: **`@google/design.md` v0.4.0** (repo at 2026-07-27).
- The generated spec lives at `docs/spec.md`. The source of truth is `packages/cli/src/linter/spec-config.yaml`.

### 6.1 File structure
A DESIGN.md has two layers:
1. **Optional YAML front matter** with machine-readable **design tokens**. The first line must be exactly `---` and the block must close with a line of exactly `---`.
2. **A Markdown body** of `##` sections with human-readable rationale. An optional `#` H1 is allowed for a title but is not parsed as a section.

"The tokens are the normative values; the prose provides context for how to apply them." Prose may use descriptive names ("Midnight Forest Green") that map to token names (`primary`). The token system is inspired by the **W3C Design Tokens (DTCG) format**: typed groups and `{path.to.token}` references.

### 6.2 Token schema (front matter)
```yaml
version: <string>          # optional, current "alpha"
name: <string>
description: <string>      # optional
omitted: <string[] | {section, reason?}[]>   # optional; suppresses missing-section lint
colors:
  <token-name>: <Color>
typography:
  <token-name>: <Typography>
rounded:
  <scale-level>: <Dimension>
spacing:
  <scale-level>: <Dimension | number>
components:
  <component-name>:
    <token-name>: <string | token reference>
```

**Types:**
- **Color**: any CSS color. That covers hex `#RGB`/`#RGBA`/`#RRGGBB`/`#RRGGBBAA`, named colors, `rgb()`/`rgba()`/`hsl()`/`hsla()`/`hwb()`, `oklch()`/`oklab()`/`lch()`/`lab()`, and `color-mix(in srgb, …)`. Values are converted to sRGB for WCAG checks. **Hex is the recommended default.**
- **Dimension**: a number plus a unit, only **px, em or rem**.
- **Typography**: an object with the properties `fontFamily` (string), `fontSize` (Dimension), `fontWeight` (number, quoted or bare), `lineHeight` (Dimension, or a unitless number, which is recommended), `letterSpacing` (Dimension), `fontFeature` (→ `font-feature-settings`) and `fontVariation` (→ `font-variation-settings`).
- **Token reference**: `"{colors.primary}"`. It must point to a primitive, except within `components`, where composite references such as `{typography.label-md}` are allowed.
- **Component sub-tokens (valid properties):** `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`. Unknown properties are accepted with a warning.
- **Variants** are separate keys, e.g. `button-primary`, `button-primary-hover`, `button-primary-active`.
- **Limits:** max token nesting depth 20 and max reference depth 10.

**Recommended (non-normative) token names:**
- Colors: `primary`, `secondary`, `tertiary`, `neutral`, `surface`, `on-surface`, `error`.
- Typography: `headline-display`, `headline-lg`, `headline-md`, `body-lg`, `body-md`, `body-sm`, `label-lg`, `label-md`, `label-sm`.
- Rounded: `none`, `sm`, `md`, `lg`, `xl`, `full`.
- Most systems have 9–15 typography levels.

### 6.3 Sections (all `##`, canonical order)
Sections may be omitted, but those present **must appear in this order**:

| # | Canonical | Aliases | Content | Tokens |
|---|---|---|---|---|
| 1 | **Overview** | "Brand & Style" | Holistic look and feel: brand personality, audience, emotional response (playful vs professional, dense vs spacious). The fallback guide when no rule applies. | none |
| 2 | **Colors** | none | Palettes with roles. **At least `primary` must be defined.** Convention: primary, secondary, tertiary, neutral. | `colors` |
| 3 | **Typography** | none | Levels and roles (headline/display/body/label/caption × sizes). | `typography` |
| 4 | **Layout** | "Layout & Spacing" | Grid model (fluid, fixed max-width) or margins/safe areas (e.g. Liquid Glass), plus the spacing scale. | `spacing` |
| 5 | **Elevation & Depth** | "Elevation" | Shadows (spread, blur, color). For flat designs, how hierarchy is shown instead (borders, tonal layers). | none |
| 6 | **Shapes** | none | Shape language and corner radii. | `rounded` |
| 7 | **Components** | none | Atoms: buttons (primary/secondary/tertiary, sizing, states), chips, lists, tooltips, checkboxes, radios, input fields. Add domain-specific ones. The spec calls this section "actively evolving". | `components` |
| 8 | **Do's and Don'ts** | none | Guardrails and pitfalls, e.g. "Do use the primary color only for the single most important action per screen", "Don't mix rounded and sharp corners in the same view", "Do maintain WCAG AA contrast ratios (4.5:1 for normal text)", "Don't use more than two font weights on a single screen". | none |

**Consumer behavior for unknown content:**
- An unknown section (e.g. `## Iconography`) is preserved without error.
- An unknown color or typography token name is accepted if the value is valid.
- An unknown spacing value is accepted and stored as a string.
- An unknown component property is accepted with a warning.
- A **duplicate section heading is an error and the file is rejected.**

### 6.4 CLI
```bash
npx @google/design.md lint DESIGN.md            # JSON findings; exit 1 on errors; accepts '-' for stdin
npx @google/design.md diff DESIGN.md DESIGN-v2.md   # token added/removed/modified + regression flag; exit 1 on regression
npx @google/design.md export --format css-tailwind DESIGN.md > theme.css   # Tailwind v4 @theme block
npx @google/design.md export --format json-tailwind DESIGN.md             # Tailwind v3 theme.extend ("tailwind" alias)
npx @google/design.md export --format dtcg DESIGN.md > tokens.json        # W3C DTCG
npx @google/design.md spec [--rules | --rules-only] [--format markdown|json]  # inject spec into prompts
# Windows/PowerShell: npx -p @google/design.md designmd lint DESIGN.md
```
The `css-tailwind` export uses the Tailwind v4 namespaces `--color-*`, `--font-*`, `--text-*`, `--leading-*`, `--tracking-*`, `--font-weight-*`, `--radius-*` and `--spacing-*`.

There is also a programmatic API: `import { lint } from '@google/design.md/linter'`, which returns `findings`, `summary` and `designSystem`.

**The 11 lint rules:**

| Rule | Severity | Checks |
|---|---|---|
| `broken-ref` | error | References that don't resolve |
| `missing-primary` | warning | Colors defined without `primary` |
| `contrast-ratio` | warning | Component bg/text pairs below WCAG AA 4.5:1 |
| `orphaned-tokens` | warning | Colors never referenced by a component |
| `token-summary` | info | Token counts per section |
| `missing-sections` | info | spacing/rounded absent while other tokens exist |
| `missing-typography` | warning | Colors without typography |
| `section-order` | warning | Out of canonical order |
| `unknown-key` | warning | Typos like `colours:` |
| `token-like-ignored` | warning | An unknown key holds token-like values |
| `omitted-rules` | info | Invalid or redundant `omitted` entries |

### 6.5 Philosophy (PHILOSOPHY.md), which matters for writing a good file
- **"The quality of a generated design is determined less by the precision of its values than by how clearly the intent is described."** Prose, not tokens, is the focus. "The token values serve as context and are not rendering instructions."
- **"A specific reference carries more than a list of adjectives."** Compare "A 1970s graduate lecture handout in the tradition of an old and established university" with "Modern, clean, trustworthy, premium": "Adjectives describe a region. A specific reference describes a point."
- **Negative constraints come free with a specific reference.** Keep Do's and Don'ts intentional, not a rambling list. "A strong reference and an intentional list of do's and don'ts working together is the sweet spot."
- Prose may inline token refs, e.g. "**Paper** {colors.paper} is the canvas… never pure white."

### 6.6 Minimal valid example
```markdown
---
version: alpha
name: Heritage
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#B8422E"
  neutral: "#F7F5F2"
  on-tertiary: "#FFFFFF"
typography:
  headline-lg: { fontFamily: Public Sans, fontSize: 48px, fontWeight: 600, lineHeight: 1.1, letterSpacing: -0.02em }
  body-md:     { fontFamily: Public Sans, fontSize: 16px, fontWeight: 400, lineHeight: 1.6 }
  label-md:    { fontFamily: Space Grotesk, fontSize: 12px, fontWeight: 500, lineHeight: 1, letterSpacing: 0.1em }
rounded: { sm: 4px, md: 8px, full: 9999px }
spacing: { xs: 4px, sm: 8px, md: 16px, lg: 32px, gutter: 24px }
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "#9E3826"
---
## Overview
Architectural minimalism meets journalistic gravitas: a high-end broadsheet in print.
## Colors
- **Primary (#1A1C1E):** deep ink for headlines and core text.
- **Tertiary (#B8422E):** "Boston Clay", the sole driver for interaction.
## Typography
## Layout
## Elevation & Depth
Depth via tonal layers, not shadows.
## Shapes
## Components
## Do's and Don'ts
- Do use tertiary only for the single most important action per screen.
- Don't mix rounded and sharp corners in one view.
```

### 6.7 Ecosystem variants to be aware of
- **Impeccable** splits durable product truth into **PRODUCT.md** (audience, purpose, voice) and the visual system into **DESIGN.md**. Its own DESIGN.md uses numbered, titled sections ("## 1. Overview: Neo Kinpaku", "## 7. Do and Do Not"), which deviates from the canonical names. Run `lint` to check `section-order`.
- **ui-skills `create-design-md`**:
  - Two modes. **Repository mode** is normative and uses the repo's evidence. **URL mode** is reconstructed and requires rendered DOM and computed-style inspection at desktop and mobile widths; screenshots alone can't establish exact values.
  - Evidence pipeline: `role → value → source → scope → recurrence → confidence`.
  - "Never return… a DESIGN.md draft before lint and export succeed." Don't promote accidental repetition into design intent.
- **designmd.ai / designmd.app / designmd.co** are third-party sites. note.com warns that "DESIGN.md on designmd.ai is different from the official Google…" format. **Always target the google-labs-code spec** and validate with the CLI.
- **Generators** (URL → DESIGN.md): designmd.supply, designmd.me, HyperDesign, the Bergside Chrome extension, context.dev's generator, aura.build/design-systems.
- **Libraries:** Refero Styles (2,000+), getdesign.md / awesome-design-md (70+), typeui.sh (50+ styles), Open Design (142+ systems).

---

## 7. Open items and unverified list
- **ui.sh**: not verified. Its identity is unknown.
- **Rauno's "Invisible details of interaction design"**: summarized from memory, not fetched.
- **Resources that don't fit their intended category:**
  - **atlas.attio.com** is the GTM Atlas guide.
  - **driver.rybicki.ai** is a racing game.
  - **revyl.com** is mobile AI testing.
  - **animos.app** is a motion-showcase tool.
  - Decide whether to keep them in the catalog.
- **Licenses and pricing not confirmed:**
  - Licenses: ReUI (see the repo), Beautiful UI, Bencho, Neuform, TypeUI ("Other").
  - Pricing: ScreensDesign tiers, Appshots, designmd.me.
- **Base UI's npm package name:** confirm `@base-ui/react` against current docs.
- **Icon counts** vary across sources (Lucide 1,600–1,850, Phosphor base count). The numbers given are approximate as of 2026-09.
