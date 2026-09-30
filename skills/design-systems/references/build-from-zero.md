# Building a design system from zero (or rescuing one nobody uses)

How much system a product needs, how to find what already exists, the order of work, how components mature, how contributions and teams work, how to measure adoption, how to keep design and code in sync, and why systems die. Token formats, Tailwind wiring, DESIGN.md, and semver rules live in the other references; this file is the process around them.

## Contents

1. Decide the tier first
2. Interface inventory (UI walk and code scan)
3. Order of work: tokens → core components → patterns → docs
4. Component lifecycle (Primer's milestones)
5. Contribution model and team models
6. Measuring adoption
7. Design–code sync (Figma, tokens, Code Connect, MCP, registries)
8. Failure modes and case lessons
9. Checklist

---

## 1. Decide the tier first

Most products don't need a "design system team". They need consistent tokens, a component library they own, and a written set of rules. Pick the lowest tier that removes today's pain; move up only when the signals below appear.

| Tier | What it is | Enough when |
|---|---|---|
| **0 — Adopt** | An existing system as-is (shadcn/ui defaults, Radix Themes, Polaris for Shopify apps, Primer for GitHub apps) | Prototypes, internal tools, one small team, or apps that live inside a host platform |
| **1 — Own the basics** | `DESIGN.md` + semantic tokens + a copied component library (shadcn/ui or similar) with a few product-specific compositions | **Most startups and single-product teams**: one codebase, a handful of people touching UI |
| **2 — Shared patterns** | Tier 1 + a documented **pattern layer** (settings page, table with filters, empty states, destructive confirm — see `app-screen-patterns`) published as reusable blocks, e.g. a private shadcn registry | Several apps or repos that must look and behave the same, or agents generating UI across repos |
| **3 — System as a product** | Its own versioned package(s), docs site, Figma library linked to code, lifecycle labels, contribution process, adoption metrics, and named owners | Several product teams or platforms (web + iOS + Android) with a consistency mandate |

The team-size boundaries above are judgment calls, not published thresholds.

**Signals to move up a tier.**
- The inventory finds duplicates (Brad Frost's audit of one airline homepage turned up dozens of distinct button styles; his point is that anyone can see why that's a problem).
- Different teams rebuild the same pattern (a second modal, a third toast).
- The same accessibility bug recurs in the same kind of widget.
- A rebrand or dark mode would take months.
- Figma and production visibly disagree.
- Agents keep inventing new UI because nothing reusable is discoverable.

**Timing.** Frost's advice is that the best time to start is now; a redesign or replatform is the easiest vehicle, but you don't need to wait for one.

---

## 2. Interface inventory (UI walk and code scan)

The inventory creates the evidence and the shared vocabulary. Do both halves.

**UI walk (paraphrasing Frost's interface audit, Atomic Design ch. 4).**
1. **Gather people from every discipline** — design, front-end, back-end, content, product, QA. Everyone should feel the inconsistency, and they'll need shared names later.
2. **Agree on one capture format** (a shared slide deck or board) so results can be merged.
3. **Screenshot one example of each unique pattern**, not every instance. Split categories between people: global elements, navigation, buttons, forms, headings, lists, cards/blocks, images and media, icons, interactive components, third-party widgets, **messaging** (alerts, toasts, errors — the hardest, because they only appear after an action), colors, and motion (screen recordings). Include the neglected corners: error pages, help, legal pages, emails, settings.
4. **Timebox** the capture (Frost suggests 30–90 minutes for a first pass).
5. **Present by category** (5–10 minutes each), discuss why each variant exists, and surface **naming disagreements** — "utility bar" vs "admin nav" is the conversation you need.
6. **Regroup** into one master document: keep, merge, or remove each variant; settle names; plan the move to a living library. Show it to stakeholders — non-designers immediately understand why many near-identical buttons are a cost.

**Code scan (agent-executable).**
- Count unique raw values: hex/rgb/oklch colors, font sizes, spacing, radii, shadows, z-indexes, durations (grep plus a small script).
- Find near-duplicate components by name (`Button`, `Btn`, `PrimaryButton`, `CTA`) and by behavior (every modal, toast, dropdown, date picker implementation).
- Count component and prop usage with `react-scanner` (or a framework equivalent).
- List every empty, error, and loading state implementation.

**Output.** A table: pattern · variants found · locations · decision (keep / merge into X / delete) · proposed name. This feeds the Workflow's audit step in `SKILL.md`.

---

## 3. Order of work: tokens → core components → patterns → docs

**1. Tokens (foundations).** Color primitives, then semantic roles (bg, fg, border, accent, and status success/warning/danger/info), type scale, spacing, radius, elevation, motion, breakpoints, z-index. Name semantic tokens by purpose so theming is a remap (details: `tokens-dtcg.md`). The idea is old and proven: the Salesforce Lightning Design System team (with Jina Anne) popularized "design tokens" around 2014 and built Theo to emit one stored value into each platform's format.

**2. Core components.** Start with what the product's screens actually use, found in the inventory. A typical SaaS starting set:
- Actions: Button (primary, secondary, tertiary, danger; loading), IconButton, Link, Menu.
- Inputs: TextField, Textarea, Select/Combobox, Checkbox, Radio, Switch, DatePicker, FileUpload, SearchField.
- Feedback: InlineMessage/Alert, Banner, Toast, Badge/Status, Progress/Spinner, Skeleton, EmptyState, Tooltip.
- Containers: Card, Dialog (with a confirm/danger variant), Sheet/Drawer, Popover, Tabs, Accordion/Disclosure.
- Navigation: sidebar NavList, Breadcrumbs, Pagination, PageHeader (title, status, actions).
- Data: Table with batch actions, List, DescriptionList, Avatar.

designsystemchecklist.com lists a comparable core set of components with their requirements; the claim that "about 20 components cover most screens" is a rule of thumb, not a measured figure. Each component meets the bar in `component-checklist.md` before others depend on it.

**3. Patterns.** Compositions plus behavior rules: save model, message placement, empty and error states, destructive tiers, filters, forms and validation, degraded states. Primer, Carbon, Polaris, and GOV.UK all publish patterns separately from components; copy that split. A pattern page covers: when to use and when not, anatomy, rules with do/don't, states, content and copy, accessibility, related components, and **known gaps or research** (GOV.UK pages end with what still needs research). For agents, each pattern should also exist as code — a registry block (`registry:block`) or template — so "build the settings page" composes the approved pattern. `app-screen-patterns` is a ready source of pattern rules.

**4. Docs.** Per component: purpose, anatomy, variants, states, do/don't with examples, content guidelines, accessibility (keyboard map, ARIA, common misuses), props, related components, status and changelog. Plus machine-readable docs for agents: `DESIGN.md`, `components.json` and a registry, and an MCP server where your tools support one (section 7).

Don't wait for all four to be "done". Ship tokens and the first components into a real screen, then iterate; Frost's point that design is finalized in the browser, not the static comp, applies to the system itself.

---

## 4. Component lifecycle (Primer's milestones)

Label every component with a status. Primer's criteria are a good default because they're concrete and each milestone must be fully met before moving on:

| Status | Criteria (paraphrased from Primer) |
|---|---|
| **Experimental** | Proof of concept or work in progress; use only after talking to the maintainers |
| **Alpha** | No external or app-specific dependencies; **no hard-coded values** — works in every color mode and theme through functional tokens; responsive with touch-friendly targets; usage examples documented; unit tests on critical paths; **visual regression** on default and interactive states; interaction tests; **zero axe violations and a manual accessibility review** |
| **Beta** | Used in production in several places (Primer expects 3+ instances for its Rails components, 1+ for React); usage docs and a sandbox (Storybook); design review done; SSR-compatible; no performance regressions |
| **Stable** | **No breaking API changes for at least a month**; complete docs including accessibility and common misuses; Figma component available; **lint rules or codemods exist that prevent use of the alternatives** |
| **Deprecated** | Docs name the replacement; consumers get a **warning** when they use it |
| **Removed** | Removal date announced **at least a month** ahead; manual and automated migration paths available for at least a month |

Primer's month is a minimum; larger organizations often give a quarter or more. Versioning and deprecation mechanics: `governance.md`.

---

## 5. Contribution model and team models

**Contribution path (Primer's decision flow, generalized).**
1. The system has it and it fits → use it.
2. The system has it but it doesn't fit → propose a change to the system first. If rejected, build a variant in product code **under a new name** (never reuse a system component's name for something different).
3. The system doesn't have it, but product code has something similar → use that.
4. Otherwise → build it generic enough for other teams, owned by your team, in a shared location. Truly one-off needs get a one-off, not a system component.

**Promotion ("upstreaming") criteria** — Primer's maintainers ask: is it used by several teams; does it solve a design, engineering, or accessibility problem well; any negative effects (performance); does it fit an existing family; is the maintenance cost worth it. **Not ready to share** when it was rushed with known issues, is too specific to one team, or is too complex for others' use cases.

**Primer's on-ramp for a candidate component**: (1) exists and is discoverable — name, description, at least one story; (2) passes a design checklist; (3) documented — stories for every feature plus minimum docs; (4) accessible — axe plus review; (5) ready to upstream. Primer describes itself as having a deliberately high bar and asks teams to come **early**, because the system can't produce quality components at the last minute.

**Team models (Nathan Curtis, EightShapes).**
| Model | Shape | Risk |
|---|---|---|
| **Solitary** | One product team's system, offered to others | Serves its own team first; others feel ruled by it |
| **Centralized** | A dedicated team builds and distributes the system | Can drift from product reality; becomes a bottleneck |
| **Federated** | Designers and engineers from several product teams decide together | Without dedicated core owners, work stalls — Curtis later wrote "The Fallacy of Federated Design Systems"; read it before choosing this model |

Default for tier 3: a small dedicated core team plus a contribution path for product teams. Curtis's framing — a design system is **a product serving products**, with a roadmap, backlog, funding, and support, not a one-off project — is the single most useful mindset shift.

**Frost's path to official status (Atomic Design ch. 5, paraphrased).** Make a thing (a pilot on a real project), show that it's useful (time saved, allies across disciplines), then make it official (people, budget, governance, roadmap). "System first" adds friendly friction: a fix found in one app is made in the system so every product gets it. A library that no longer matches production is obsolete.

---

## 6. Measuring adoption

**Coverage metrics.**
- **Technical**: share of UI component imports that come from the system vs local components.
- **Visual**: share of rendered UI built from system components.
- **Render-based**: share of component renders that come from the system.

**Tools.** `react-scanner` (open source) counts component and prop usage across a codebase but doesn't compute coverage percentages by itself; **Omlet** (commercial) tracks component usage and trends per project. Productboard and Mews have published how they built their adoption metrics; both are good templates.

**Health signals** (pair with `governance.md` §5): raw color and spacing values in product code (should fall), usage of deprecated components (should reach zero by the removal date), time to build a standard screen, accessibility bugs traced to components, contributions from product teams, and designer and developer satisfaction.

**Caution.** Adoption alone can mislead — a team can import every component and still ship an inconsistent product. Report adoption next to outcomes: consistency, speed, and quality.

---

## 7. Design–code sync (Figma, tokens, Code Connect, MCP, registries)

**Pick one source of truth for tokens** (see the table in `SKILL.md`). Either tokens live in code (DTCG JSON in git) and are pushed to Figma variables, or Figma variables are exported to DTCG JSON and committed; never allow unreviewed two-way edits. A build tool (Style Dictionary, Terrazzo) generates CSS variables, the Tailwind `@theme`, and native outputs; CI checks contrast and shows diffs.

**Figma Code Connect** links published Figma components to real code components, so Dev Mode shows your actual component snippets instead of generated CSS. It has a CLI and an in-Figma setup that can connect to GitHub; the mapping view shows which components are linked and which are missing. Use one name for each component across Figma, code, and docs.

**Figma MCP server** (launched 2025 as the Dev Mode MCP server) gives coding agents the components, variables, and styles of a selection. When a Figma variable has code syntax set, the server returns that token name, and Code Connect mappings flow into it — so an agent writes `bg-accent`, not `#dc6a31`.

**shadcn registry and tooling (as of 2026-09).** A registry (`registry.json`) distributes your components, blocks (`registry:block`), pages, hooks, config, and rules to any project with the shadcn CLI. The shadcn MCP server (`npx shadcn@latest mcp init --client <client>`) lets assistants browse, search, and install items from registries declared in `components.json`. That makes tier 2 cheap: publish approved patterns as registry blocks and agents install them instead of inventing UI. Details: `tailwind-shadcn.md`.

**Figma-only systems die.** If the library exists only in Figma and every team reimplements it in code, drift is guaranteed. The system must ship as code.

---

## 8. Failure modes and case lessons

**Why design systems fail** (patterns reported across industry write-ups):
| Failure | Fix |
|---|---|
| **Built in isolation** and handed down; seen as a restriction | Extract from existing product patterns (the inventory) and build with product teams |
| **Too rigid or too configurable** | Composition (slots, children) over dozens of props; a documented escape hatch (build a variant under a new name) |
| **Treated as a project**, launched and abandoned; library drifts from production | Run it as a product with owners, roadmap, and releases |
| **Central team becomes a bottleneck** | A contribution on-ramp; accept local components until they prove themselves |
| **Value invisible**, so nobody adopts | Measure and publish time saved, accessibility wins, consistency |
| **Figma-only or docs-only** | Ship coded components; link them to Figma |
| **No deprecation discipline**; old and new coexist forever | Lifecycle labels, warnings, codemods, removal dates |

**Case lessons.**
- **Airbnb Design Language System (2016).** Karri Saarinen described the goal as making work both better (a cohesive experience) and faster (a shared language), with the system treated as an evolving ecosystem rather than static rules; a small group of designers and engineers kept decisions fast. Lesson: small core team, shared language, living system.
- **Salesforce Lightning.** Popularized design tokens and built Theo to generate platform formats from one source. Lesson: one source of truth, generated outputs — the foundation of every multi-platform system since.
- **GitHub Primer.** Explicit lifecycle from Experimental to Removed, a deliberately high bar, a contribution on-ramp, and lint rules and codemods as a Stable requirement. Lesson: maturity must be visible, and tooling (not memos) prevents drift.
- **IBM Carbon.** Open source, with pattern pages that cite references, invite feedback, and are candid about gaps (the notification panel is documented as still needing design iteration and testing before it becomes a component). Lesson: publishing what is unknown builds trust and prevents premature standardization.
- **Shopify Polaris.** Patterns map directly to page layouts (index, details, settings), and governance extends to small things — strict criteria and expiry for "New" badges to prevent clutter and inconsistency. Lesson: govern the patterns, not just the components.
- **GOV.UK Design System.** Every pattern has a research section and a public backlog issue, and patterns are contributed from other departments. Lesson: evidence and open contribution keep a system credible across many teams.

**On Atomic Design.** Frost presents atoms → molecules → organisms → templates → pages as a mental model, not a linear process. Many teams use plainer names (components, patterns, templates); pick whatever vocabulary the inventory settled on.

---

## 9. Checklist

- [ ] Tier chosen and written down (don't build tier 3 for one app).
- [ ] Inventory done: UI walk plus code scan; duplicates and names recorded with keep/merge/delete decisions.
- [ ] Tokens (DTCG or CSS source) and `DESIGN.md` written; semantic names; light and dark.
- [ ] Core components owned (copied or wrapped), token-only, every state, axe-clean plus a manual accessibility check.
- [ ] Patterns documented for the screens the product actually has, and published as blocks or templates.
- [ ] Docs with do/don't and a catalog (Storybook or similar) with visual regression.
- [ ] Lint rules: no raw hex or px outside tokens; no imports of deprecated components.
- [ ] Lifecycle status per component; changelog; semver; codemods for breaking changes.
- [ ] Contribution path published (decision flow plus on-ramp criteria).
- [ ] Adoption metrics set up and paired with outcome metrics.
- [ ] Design–code link: Code Connect mappings, or code declared the single source of truth.
- [ ] Owners named; roadmap and backlog exist.

---

## Sources

- Brad Frost, *Atomic Design*, ch. 4 "The Atomic Workflow" and ch. 5 "Maintaining Design Systems" (paraphrased; the book is all rights reserved): https://atomicdesign.bradfrost.com/chapter-4/ · https://atomicdesign.bradfrost.com/chapter-5/
- Primer, Component lifecycle: https://primer.style/guides/component-lifecycle
- Primer, Handling new patterns: https://primer.style/guides/contribute/handling-new-patterns · Adding new components: https://primer.style/guides/contribute/adding-new-components
- Nathan Curtis, "Team Models for Scaling a Design System": https://medium.com/eightshapes-llc/team-models-for-scaling-a-design-system-2cf9d03be6a0
- Nathan Curtis, "A Design System isn't a Project. It's a Product, Serving Products": https://medium.com/eightshapes-llc/a-design-system-isn-t-a-project-it-s-a-product-serving-products-74dcfffef935
- Nathan Curtis, "The Fallacy of Federated Design Systems": https://medium.com/@nathanacurtis/the-fallacy-of-federated-design-systems-23b9a9a05542
- Karri Saarinen, "Building a Visual Language" (Airbnb DLS): https://medium.com/airbnb-design/building-a-visual-language-behind-the-scenes-of-our-airbnb-design-system-224748775e4e
- CSS-Tricks, "What Are Design Tokens?" (Salesforce, Jina Anne, Theo): https://css-tricks.com/what-are-design-tokens/
- Omlet, data-driven design systems: https://omlet.dev/blog/data-driven-design-systems-in-practice/ · Productboard, measuring adoption: https://www.productboard.com/blog/how-we-measure-adoption-of-a-design-system-at-productboard/ · Mews, adoption metric: https://developers.mews.com/design-system-adoption-metric-building/
- "Design System 'Adoption' is a Red Herring": https://medium.com/@disco_lu/design-system-adoption-is-a-red-herring-6c6b5a504f43
- Figma, Code Connect: https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect · Figma MCP server: https://www.figma.com/blog/introducing-figma-mcp-server/ · https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/
- shadcn/ui, Registry: https://ui.shadcn.com/docs/registry · MCP server: https://ui.shadcn.com/docs/mcp
- Carbon, Notifications pattern (notification panel status): https://carbondesignsystem.com/patterns/notification-pattern/
- Polaris, New features: https://polaris.shopify.com/patterns/new-features
- GOV.UK Design System, patterns (research sections, contributions): https://design-system.service.gov.uk/patterns/
- Design System Checklist: https://www.designsystemchecklist.com/
- Failure-mode write-ups: https://www.netguru.com/blog/design-system-adoption-pitfalls · https://www.knapsack.cloud/blog/why-design-systems-fail · https://rangle.io/blog/why-your-first-design-system-will-fail
