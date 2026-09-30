# AI design tools and the DESIGN.md ecosystem (as of 2026-09)

Verification marks: **[V]** verified · **[P]** partially verified. This space moves monthly, so re-check versions and pricing before recommending a paid tool.

## 1. Agent design skills and rule sets

| Name | URL | What it is | License / install | When to use |
|---|---|---|---|---|
| Impeccable [V] | https://impeccable.style | By Paul Bakaus: one skill with about 24 commands (shape, critique, audit, polish, typeset, layout, colorize, animate, harden, adapt, …), live browser iteration, and **61 deterministic detector rules** for AI-generated frontend tells, plus a CLI and browser extension that run the detectors without an LLM. It writes `PRODUCT.md` (init) and a root `DESIGN.md` (document) | Apache-2.0 · `npx impeccable install` | A full critique → fix → polish loop, and deterministic anti-slop linting |
| Taste Skill [V] | https://tasteskill.dev | By Leonxlnx: "The Anti-Slop Frontend Framework for AI Agents". The default install is **v2 (experimental)**: it reads the brief first, maps briefs that name a real design system (Material, Carbon, Polaris, Primer, GOV.UK…) to the official package, defaults to dual light/dark themes, bans em dashes, and ends with a hard pre-flight checklist; v1 stays available as `design-taste-frontend-v1`. Variants: soft/premium, minimalist, industrial-brutalist, redesign-existing-projects, image-to-code, Stitch/DESIGN.md export, output enforcement, and image-generation skills | MIT · `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"` | Greenfield marketing sites needing strong art direction; style-specific variants once a direction is chosen |
| UI Skills [V] | https://ui-skills.com | By ibelick: a catalog and registry of agent skills for design engineers, with a CLI and an **MCP server** (`https://www.ui-skills.com/mcp`). Built-in skills: `baseline-ui`, `create-design-md`, `fixing-accessibility`, `fixing-metadata`, `fixing-motion-performance`, `improve-ui`. Also a "Playbook" of distilled lessons | MIT · `npx ui-skills list`, `npx ui-skills get baseline-ui` | A quick deslop pass, evidence-gated DESIGN.md creation, or discovering more skills |
| Emil Kowalski skills [V] | https://github.com/emilkowalski/skills | Design-engineering and animation skills: `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `animation-vocabulary`, `apple-design`, `pick-ui-library`, `prototype`, `mobile-native`, `ask-sonner` | MIT · `npx skills@latest add emilkowalski/skills` | Motion decisions (easing, duration, springs, frequency), library picks, making mobile web feel native |
| Vercel Web Interface Guidelines [V] | https://github.com/vercel-labs/web-interface-guidelines | A living list of interface rules (interactions, animation, layout, content, forms, performance, design) plus `AGENTS.md` in MUST/SHOULD/NEVER form | MIT · review skill: `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines` | Reviewing any web UI; put AGENTS.md in the repo so generated code follows it |
| Anthropic frontend-design [V] | https://github.com/anthropics/skills/tree/main/skills/frontend-design | Anthropic's skill for distinctive visual design: grounding in the subject, a two-pass plan, a calibration list of 2026 AI clusters, restraint | Apache-2.0 | The canonical short version of the plan → review → build → critique loop |
| Design with Intent [P] | https://designwithintent.ai | A "UX strategy system for AI tools" with 17 skills covering research, strategy, flows, content, accessibility, ethics, and measurement; outcome-first, plus a catalog of 57+ anti-patterns in 10 categories (including AI-specific dark patterns such as anthropomorphic manipulation). By Ghaida | CC0-1.0 · `npx skills add ghaida/intent --all` or the Claude Code plugin marketplace | Upstream UX work (research plans, flows, content, metrics) before pixels |
| TypeUI [V] | https://typeui.sh | By Bergside (the Flowbite team): an MCP server, plugins, and a CLI that give agents **design skill files** in DESIGN.md or SKILL.md form. The site lists 94 design skills and 449 UI prompts (2026-09); the README shows 67 registry styles (Agentic, Bento, Brutalism, Corporate…) | MIT (LICENSE.md) · `npx typeui.sh list`, `npx typeui.sh pull <slug>`, `npx typeui.sh generate` | Giving a project a coherent starting direction as a file the agent follows |
| transitions.dev [V] | https://transitions.dev | By Jakub Antalik: a library of 43+ CSS transitions, a skill, and **Transitions Agent** (`npx transitions-agent`), which scores a codebase's motion 0–100 locally with no AI and maps each finding to a fix recipe (`transition: all`, hard-coded durations, missing reduced-motion guard); a GitHub Action can fail PRs below a minimum score | Library free + Pro | Standard micro-interactions and a motion gate in CI |
| HyperFrames [V] | https://github.com/heygen-com/hyperframes | HeyGen's framework and skills for HTML-authored video: a motion doctrine, animation rules and blueprints, runtime adapters, and a render pipeline | Apache-2.0 | Product videos and motion graphics authored as code |
| marketingskills [V] | https://github.com/coreyhaines31/marketingskills | By Corey Haines: about 50 marketing and growth skills (CRO, signup, onboarding, paywalls, pricing, copywriting, SEO…) sharing one product-marketing context file | MIT | Conversion and copy work alongside `conversion-ux` |
| revenue-centric-design [V] | https://github.com/heliocosta-dev/revenue-centric-design | A single-skill repo of revenue-focused design principles with 12 themed references | **Source-available with a field-of-use restriction** (no gambling/casino use; the license must be carried in derivatives) · `npx skills add heliocosta-dev/revenue-centric-design` | A companion skill; link to it, don't copy its text |

**Stacking rule:** load one opinionated design skill per concern. Two art-direction skills (for example Taste Skill + another direction skill) will contradict each other on fonts, eyebrows, and motion.

## 2. Automated review engines

| Name | URL | What it is | When to use |
|---|---|---|---|
| Rams [V] | https://www.rams.ai | A design-review engine for agents and PRs: **348 rules in 9 categories** (e.g. Accessibility 33, Color 27, Typography 43; 2026-09), including a category for AI anti-patterns. Four ways to run it: a free `/rams` skill, an MCP server, a GitHub App that comments on every PR, and a CI Action that fails the pipeline on critical findings. Each finding has a severity, the affected area, and a patch, and each change gets a 0–100 score. It reviews React, Vue, Svelte, CSS, and SwiftUI | Continuous design QA on pull requests |
| Impeccable detectors [V] | https://impeccable.style | 61 deterministic rules plus 6 judgment patterns (catalog at https://impeccable.style/slop): overused fonts, side-tab borders, gradient text, hidden-at-rest content, and checks against your own DESIGN.md (fonts, colors, sizes, radii outside the system). Run `npx impeccable detect src/` or `npx impeccable detect <url>`, the Chrome extension, or a hook | Fast, LLM-free slop linting |

## 3. DESIGN.md: spec, libraries, and generators

| Name | URL | What it is | Notes |
|---|---|---|---|
| google-labs-code/design.md [V] | https://github.com/google-labs-code/design.md | **The official spec and CLI** (`@google/design.md`, spec version `alpha`, Apache-2.0): `lint` (spec, broken token references, WCAG contrast), `diff`, `export` (css-tailwind, json-tailwind, dtcg), `spec` | The source of truth. Validate every generated file with `npx @google/design.md lint DESIGN.md`. **On Windows/PowerShell** the `.md` in the binary name collides with the Markdown file association; run `npx -p @google/design.md designmd lint DESIGN.md` |
| Refero Styles [V] | https://styles.refero.design | A library of **2,000+ DESIGN.md files** extracted from top product sites, searchable by brand, mood, color, type, or URL. Free in beta; available via Refero MCP | Studying how real systems are described; picking a reference style |
| getdesign.md [V] | https://getdesign.md | A catalog of 550+ website DESIGN.md files (2026-09) following Google's spec, plus paid starter kits; companion to VoltAgent's `awesome-design-md` repo (MIT) | Brand references. Using another company's look for your product is inspiration at most, never identity |
| designmd.supply [V] | https://designmd.supply | An open-source Next.js app (May 2026): enter a domain, get a Google-spec DESIGN.md with the 8 canonical sections, built on Context.dev APIs | Self-hostable URL → DESIGN.md |
| designmd.me [V] | https://designmd.me | Paste a URL to get a DESIGN.md (tokens, typography, components) with a live HTML preview and one-click Figma import (variables, styles, a board); multi-page extraction | URL → DESIGN.md with a Figma round-trip; credit-based (4 credits per spec as of 2026-09), no card to start |
| HyperDesign [V] | https://design-md.hyperbrowser.ai | A Hyperbrowser app that screenshots and scrapes a URL, then uses a vision model to write a DESIGN.md with YAML front matter and a preview; needs your own Hyperbrowser API key (kept in the browser); source in hyperbrowser-app-examples | Sites with obfuscated CSS |
| Open Design [V] | https://open-design.ai | By nexu-io: an Apache-2.0, local-first, bring-your-own-key "open-source alternative to Claude Design" that drives your existing coding-agent CLI (21 supported) to make prototypes, landing pages, dashboards, slides, images, and video (exports HTML, PDF, PPTX, MP4); ships 152 design systems (2026-09); desktop app | Local design-artifact generation with your own agent and keys |
| Aura [V] | https://aura.build | A commercial AI web design builder: prompt → HTML/CSS/JS/Tailwind, a visual Design Mode, templates and components, HTML and Figma export, and a DESIGN.md generator and templates page | Fast landing-page exploration with export to code or Figma |
| Neuform [V] | https://neuform.ai | "Prompt-to-production design workflow": one prompt → web, mobile, and a design system, with a public gallery of remixable designs | Landing-page and direction exploration |

Generated DESIGN.md files are drafts. Check the section order and contrast with `lint`, remove any values you cannot trace to the product, and replace adjective-only Overviews with a specific reference (see `design-systems`).

## 4. Choosing an AI design tool

| You want… | Use |
|---|---|
| The agent to stop producing generic UI in this repo | A DESIGN.md + this collection's `design-taste`; add Impeccable's detectors for a mechanical check |
| A critique or audit of an existing UI | `design-review`; Rams or Impeccable for automated findings |
| A starting direction fast | TypeUI styles or Refero Styles as a reference, then adapt through the `design-taste` workflow |
| A DESIGN.md from an existing site you own | ui-skills `create-design-md` (repo mode) or a URL generator, then lint |
| Prototypes outside the codebase | Open Design (local, BYOK), Aura (hosted) |
| Motion and video | transitions.dev (CSS), HyperFrames or snapcn (video) |

## Sources

- Impeccable: https://github.com/pbakaus/impeccable ; Taste Skill: https://github.com/Leonxlnx/taste-skill ; UI Skills: https://github.com/ibelick/ui-skills
- Emil Kowalski skills: https://github.com/emilkowalski/skills ; Vercel guidelines: https://github.com/vercel-labs/web-interface-guidelines ; Anthropic skills: https://github.com/anthropics/skills
- Rams plugin: https://github.com/rams-design/rams-plugin
- DESIGN.md spec and CLI: https://github.com/google-labs-code/design.md
- marketingskills: https://github.com/coreyhaines31/marketingskills ; revenue-centric-design: https://github.com/heliocosta-dev/revenue-centric-design ; HyperFrames: https://github.com/heygen-com/hyperframes
- Tool sites as listed in the tables (checked via their own pages and repositories, 2026-09)
