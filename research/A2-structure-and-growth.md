# A2 — Skill structure, packaging, repo organization, and conversion/UX content

Research notes for a new open-source Agent Skills repo on software architecture, clean code, scalability, 2026 web design, and 2026 mobile design (iOS/Android).

Sources analyzed (local clones under `scratchpad/refs/`):
- `anthropics_skills` (README, template, `skills/skill-creator`, `skills/frontend-design`, `.claude-plugin/marketplace.json`, `scripts/quick_validate.py`)
- `agentskills_spec`, cloned from `github.com/agentskills/agentskills`. This is the official spec source for agentskills.io: `docs/specification.mdx`, `docs/skill-creation/*.mdx`, `docs/client-implementation/adding-skills-support.mdx`, and `skills-ref/` (the validator).
- `vercel_skills`, cloned from `github.com/vercel-labs/skills`, the `npx skills` CLI
- `coreyhaines31_marketingskills` (v2.11.1)
- `uphiago_recon-skills` (structure and conventions only)
- `heliocosta-dev_revenue-centric-design` (v1.3.0)
- `heygen-com_hyperframes` (packaging only)
- Claude Code docs fetched live: `code.claude.com/docs/en/skills`, `/plugin-marketplaces`, `/plugins/marketplace-reference`, `/plugins/manifest-reference`

---

## 1. Official SKILL.md specification (agentskills.io)

`anthropics/skills/spec/agent-skills-spec.md` now contains a single line: "The spec is now located at <https://agentskills.io/specification>". That page is built from `agentskills/agentskills/docs/specification.mdx`. Everything below is quoted from that file unless another source is named.

### 1.1 Directory structure (verbatim)

```
skill-name/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
└── ...               # Any additional files or directories
```

"The `SKILL.md` file must contain YAML frontmatter followed by Markdown content."

### 1.2 Frontmatter fields (verbatim table)

| Field | Required | Constraints |
|---|---|---|
| `name` | Yes | Max 64 characters. Lowercase letters, numbers, and hyphens only. Must not start or end with a hyphen. |
| `description` | Yes | Max 1024 characters. Non-empty. Describes what the skill does and when to use it. |
| `license` | No | License name or reference to a bundled license file. |
| `compatibility` | No | Max 500 characters. Indicates environment requirements (intended product, system packages, network access, etc.). |
| `metadata` | No | Arbitrary key-value mapping for additional metadata (a map from string keys to string values). |
| `allowed-tools` | No | Space-separated string of pre-approved tools the skill may use. (Experimental) |

The spec's example with optional fields:
```yaml
---
name: pdf-processing
description: Extract PDF text, fill forms, merge files. Use when handling PDFs.
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---
```

**`name` rules (verbatim):**
- Must be 1-64 characters
- May only contain unicode lowercase alphanumeric characters (`a-z`, `0-9`) and hyphens (`-`)
- Must not start or end with a hyphen (`-`)
- Must not contain consecutive hyphens (`--`)
- **Must match the parent directory name**

**`description` rules (verbatim):**
- Must be 1-1024 characters
- Should describe both what the skill does and when to use it
- Should include specific keywords that help agents identify relevant tasks

The spec gives a good and a poor example:
- Good: `Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.`
- Poor: `Helps with PDFs.`

**`compatibility`:** "Most skills do not need the `compatibility` field." Examples: `Designed for Claude Code (or similar products)`, `Requires git, docker, jq, and access to the internet`.

**`metadata`:** "We recommend making your key names reasonably unique to avoid accidental conflicts." Values are strings, so quote versions: `version: "1.0"`.

**Stricter validators.** Anthropic's `skill-creator/scripts/quick_validate.py` enforces these rules:
- `ALLOWED_PROPERTIES = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'}`. Any other top-level key fails.
- The description may not contain `<` or `>`.
- Name must match `^[a-z0-9-]+$`, may not start or end with `-`, may not contain `--`, and is at most 64 characters.
- Description is at most 1024 characters. Compatibility is at most 500 characters.

Claude Code docs say the same thing. claude.ai uploads, the Skills API, and `package_skill.py` accept only `name`, `description`, `license`, `compatibility`, `metadata`, and `allowed-tools`.

**Consequence:** put custom keys (`version`, `category`, `tags`, `related`) under `metadata:`, never at the top level. recon-skills puts `version`, `category`, `tags`, and `platforms` at the top level, so those skills would fail Anthropic's validator.

### 1.3 Body content

"There are no format restrictions. Write whatever helps agents perform the task effectively. Recommended sections: Step-by-step instructions; Examples of inputs and outputs; Common edge cases. Note that the agent will load this entire file once it's decided to activate a skill. Consider splitting longer `SKILL.md` content into referenced files."

### 1.4 Optional directories (verbatim essentials)

- `scripts/`: "Contains executable code that agents can run. Scripts should: Be self-contained or clearly document dependencies; Include helpful error messages; Handle edge cases gracefully."
- `references/`: "`REFERENCE.md` - Detailed technical reference; `FORMS.md` - Form templates or structured data formats; Domain-specific files (`finance.md`, `legal.md`, etc.). Keep individual reference files focused. Agents load these on demand, so smaller files mean less use of context."
- `assets/`: "Templates (document templates, configuration templates); Images (diagrams, examples); Data files (lookup tables, schemas)."

### 1.5 Progressive disclosure (verbatim)

1. **Metadata** (~100 tokens): The `name` and `description` fields are loaded at startup for all skills
2. **Instructions** (< 5000 tokens recommended): The full `SKILL.md` body is loaded when the skill is activated
3. **Resources** (as needed): Files (e.g. those in `scripts/`, `references/`, or `assets/`) are loaded only when required

"Keep your main `SKILL.md` under 500 lines. Move detailed reference material to separate files."

**File references:** "use relative paths from the skill root … Keep file references one level deep from `SKILL.md`. Avoid deeply nested reference chains."

**Validation:** `skills-ref validate ./my-skill`. The `skills-ref` tool lives in `agentskills/agentskills/skills-ref`.

### 1.6 Best-practice guidance (agentskills.io `best-practices.mdx`, quoted)

- **Start from real expertise:** "relying solely on the LLM's general training knowledge … The result is vague, generic procedures ('handle errors appropriately,' 'follow best practices for authentication')". Instead, extract skills from real tasks, runbooks, code-review comments, incident reports, and version-control history.
- **Add what the agent lacks, omit what it knows:** "Ask yourself about each piece of content: 'Would the agent get this wrong without this instruction?' If the answer is no, cut it." This is the most important rule for us. Generic "SOLID principles" prose is low value. Concrete decisions, thresholds, defaults, and gotchas are high value.
- **Design coherent units:** "Skills scoped too narrowly force multiple skills to load for a single task … Skills scoped too broadly become hard to activate precisely."
- **Aim for moderate detail:** "Concise, stepwise guidance with a working example tends to outperform exhaustive documentation."
- **Progressive disclosure with triggers:** "'Read `references/api-errors.md` if the API returns a non-200 status code' is more useful than a generic 'see references/ for details.'"
- **Match specificity to fragility:** give the agent freedom where many approaches are valid (explain *why*), and be prescriptive where operations are fragile.
- **Provide defaults, not menus:** "pick a default and mention alternatives briefly rather than presenting them as equal options."
- **Favor procedures over declarations:** teach "*how to approach* a class of problems, not *what to produce* for a specific instance."
- **Patterns:** Gotchas sections ("The highest-value content in many skills"), output-format templates, checklists for multi-step workflows (`- [ ] Step 1 …`), validation loops (do → validate → fix → repeat), plan-validate-execute, and bundled reusable scripts.
- "Keep gotchas in `SKILL.md` where the agent reads them before encountering the situation."

### 1.7 Description writing (agentskills.io `optimizing-descriptions.mdx` and Anthropic skill-creator)

- "The description carries the entire burden of triggering."
- "**Use imperative phrasing.** Frame the description as an instruction to the agent: 'Use this skill when...' rather than 'This skill does...'"
- "**Focus on user intent, not implementation.**"
- "**Err on the side of being pushy.** Explicitly list contexts where the skill applies, including cases where the user doesn't name the domain directly."
- "**Keep it concise.** A few sentences to a short paragraph … hard limit of 1024 characters."
- Nuance: "agents typically only consult skills for tasks that require knowledge or capabilities beyond what they can handle alone." Simple one-step requests may not trigger a skill.
- Skill-creator adds: "currently Claude has a tendency to 'undertrigger' skills … please make the skill descriptions a little bit 'pushy'." It also says "All 'when to use' info goes here, not in the body."
- **Trigger evals:** about 20 queries, 8–10 should-trigger and 8–10 should-not-trigger. Negative queries should be near-misses. Run each 3 times and use a trigger-rate threshold of 0.5. Split 60% train and 40% validation to avoid overfitting.
- **Claude Code-specific limit:** "the combined `description` and `when_to_use` text is truncated at 1,536 characters in the skill listing … Put the key use case first."

### 1.8 Writing style (skill-creator, quoted)

- "Prefer using the imperative form in instructions."
- "Try to explain to the model why things are important in lieu of heavy-handed musty MUSTs … If you find yourself writing ALWAYS or NEVER in all caps, or using super rigid structures, that's a yellow flag."
- "Keep the prompt lean. Remove things that aren't pulling their weight."
- "Look for repeated work across test cases … If all 3 test cases resulted in the subagent writing a `create_docx.py` … bundle that script."
- "For large reference files (>300 lines), include a table of contents."
- Domain organization: one SKILL.md for workflow and selection, plus `references/aws.md`, `gcp.md`, and so on. "Claude reads only the relevant reference file." This maps directly to web/iOS/Android variants in our repo.
- "Principle of Lack of Surprise": no malware or misleading skills.

### 1.9 Evals format (shared by skill-creator and agentskills.io)

The file lives at `evals/evals.json` inside the skill:
```json
{
  "skill_name": "example-skill",
  "evals": [
    { "id": 1, "prompt": "User's task prompt", "expected_output": "Description of expected result",
      "files": [], "expectations": ["The output includes X"] }
  ]
}
```
marketingskills ships an `evals/evals.json` in every skill, using `assertions: []` instead of `expectations`. Example assertions from `cro`: "Checks for product-marketing.md", "Output has Quick Wins section", "Provides 2-3 headline or CTA alternatives". These are cheap and objective structure checks. We should copy the pattern.

### 1.10 Claude Code extensions (not portable)

Claude Code accepts extra frontmatter: `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `disallowed-tools`, `model`, `effort`, `context: fork`, `agent`, `background`, `hooks`, `paths` (glob-scoped auto-activation), and `shell`.

It also supports substitutions such as `$ARGUMENTS`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`, and `` !`command` `` injection.

**Do not use these in portable skills.** marketingskills' AGENTS.md says: "These patterns are **Claude Code only** and must not be added to `SKILL.md` files directly … Other agents that load skills will see the literal `` !`command` `` string."

After compaction, Claude Code re-attaches "the first 5,000 tokens of each" invoked skill, within a combined budget of 25,000 tokens. This is another reason to keep SKILL.md bodies under about 5k tokens.

Discovery locations in Claude Code:
- personal: `~/.claude/skills/<name>/SKILL.md`
- project: `.claude/skills/<name>/SKILL.md`
- nested: `<subdir>/.claude/skills/`
- enterprise: the managed settings directory
- plugin skills are namespaced as `/<plugin>:<skill>`

---

## 2. Plugin and marketplace manifests, and multi-agent installation

### 2.1 Claude Code marketplace (`.claude-plugin/marketplace.json`)

- Required fields: `name`, `owner` (with `owner.name` required), and `plugins[]`.
- Each entry needs `name` and `source`.
- The install ID is `<entry-name>@<marketplace-name>`.
- Relative sources must start with `./` and resolve from the repo root, not from `.claude-plugin/`. `..` is rejected.

**Reserved marketplace names.** These include `agent-skills`, `anthropic-agent-skills`, `claude-code-plugins`, `claude-plugins-official`, and `anthropic-plugins`. Also reserved: names imitating official ones (e.g. `claude-plugins-v2`), non-ASCII names, `npm`, `github`, `gh`, the `claudeai-*` prefix, `inline`, `builtin`, `skills-dir`, and `synced`. **We must not name our marketplace `agent-skills`.**

**Pattern A: one plugin = whole repo** (marketingskills, verbatim):
```json
{
  "name": "marketingskills",
  "owner": { "name": "Corey Haines", "url": "https://corey.co" },
  "metadata": {
    "description": "Marketing skills for AI agents — conversion optimization, copywriting, SEO, paid ads, and growth",
    "version": "2.11.1",
    "repository": "https://github.com/coreyhaines31/marketingskills"
  },
  "plugins": [
    { "name": "marketing-skills", "description": "50 marketing skills …", "source": "./" }
  ]
}
```
It is paired with `.claude-plugin/plugin.json`:
```json
{
  "name": "marketing-skills",
  "description": "Marketing skills for AI agents — …",
  "version": "2.11.1",
  "author": { "name": "Corey Haines" },
  "homepage": "https://github.com/coreyhaines31/marketingskills",
  "repository": "https://github.com/coreyhaines31/marketingskills",
  "license": "MIT",
  "skills": "./skills"
}
```
Note that the marketplace entry name (`marketing-skills`) matches the plugin.json name. Claude Code docs say "Keep the entry name and the manifest name the same".

**Pattern B: several plugins carved from one repo** (anthropics/skills, verbatim excerpt):
```json
{
  "name": "anthropic-agent-skills",
  "owner": { "name": "Keith Lazuka", "email": "klazuka@anthropic.com" },
  "metadata": { "description": "Anthropic example skills", "version": "1.0.0" },
  "plugins": [
    {
      "name": "document-skills",
      "description": "Collection of document processing suite including Excel, Word, PowerPoint, and PDF capabilities",
      "source": "./",
      "strict": false,
      "skills": ["./skills/xlsx", "./skills/docx", "./skills/pptx", "./skills/pdf"]
    },
    {
      "name": "example-skills",
      "source": "./",
      "strict": false,
      "skills": ["./skills/algorithmic-art", "./skills/brand-guidelines", "…"]
    }
  ]
}
```
How `strict` works (docs): `strict: false` plus entry `skills` works **only if there is no plugin.json at the root**, or if plugin.json declares no components. If a plugin.json exists, `strict:false` plus entry component fields gives "Conflict. The plugin fails to load". When the source is the marketplace root and the entry lists `skills`, "only those subdirectories load".

anthropics/skills has no root plugin.json, which is why Pattern B works there. hyperframes has a root `.claude-plugin/plugin.json` and still declares `skills` on its `core-skills` entry without `strict:false`. That works under the default `strict:true`, which appends the entry's component fields to plugin.json.

**Pattern B lets users install only "architecture" or only "mobile".** That fits our five domains.

**plugin.json fields:**
- Only `name` is required.
- Location: `.claude-plugin/plugin.json`. Other files stay at the plugin root.
- Optional fields: `displayName`, `version`, `description`, `author{name,email,url}`, `homepage`, `repository`, `license` (SPDX), `keywords`, `metadata`, `defaultEnabled`, `dependencies`, `skills`, `commands`, `agents`, `hooks`, `mcpServers`, and others.
- The `skills` key *adds to* the default `skills/` scan.
- Setting `version` pins users until it changes.
- A `CLAUDE.md` at the plugin root is not loaded.

Commands: `claude plugin validate ./path` (use `--strict` in CI), `/plugin marketplace add owner/repo`, and `/plugin install name@marketplace`.

### 2.2 Other agents' manifests (all from hyperframes, which ships every one)

- **Codex** `.codex-plugin/plugin.json`: same core fields plus `"skills": "./skills/"`, `keywords`, and an `interface` object (`displayName`, `shortDescription`, `longDescription`, `developerName`, `category`, `capabilities`, `websiteURL`, `defaultPrompt[]`, `brandColor`, `composerIcon`, `logo`).
- **Cursor** `.cursor-plugin/plugin.json`: `"$schema": "https://cursor.com/schemas/cursor-plugin/plugin.json"`, plus `name`, `displayName`, `description`, `version`, `author`, `publisher`, `homepage`, `repository`, `license`, `logo`, `category`, `keywords`, `tags`, and `"skills": "./skills/"`. A local install copies the folder to `~/.cursor/plugins/local/<name>`, and the folder must contain `plugin.json` and `skills/`.
- **Gemini CLI** `gemini-extension.json` at the repo root:
  ```json
  { "name": "hyperframes", "version": "0.8.94", "description": "…" }
  ```
  Install with `gemini extensions install https://github.com/<owner>/<repo> --auto-update`.
- **Generic** root `plugin.json` with `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`. This is an emerging cross-agent plugin schema.
- **Copilot CLI:** `copilot plugin marketplace add owner/repo` then `copilot plugin install name@marketplace`. It reads the same `.claude-plugin/marketplace.json`. VS Code: `@agentPlugins` in the Extensions view.
- hyperframes keeps every manifest's `version` in lockstep (0.8.94) and generates a `skills-manifest.json` of content hashes per skill.

### 2.3 `npx skills` (vercel-labs/skills), the de-facto cross-agent installer

```bash
npx skills add owner/repo                          # interactive picker
npx skills add owner/repo --list
npx skills add owner/repo --skill cro --skill copywriting
npx skills add owner/repo --skill '*' -a claude-code
npx skills add owner/repo --all                    # all skills, all agents, no prompts
npx skills add owner/repo -g                       # global/user scope
npx skills update [skill]  |  npx skills remove  |  npx skills init [name]
```

**Discovery inside a repo.** The CLI checks, in order:
1. the root (if it holds `SKILL.md`)
2. `skills/`, `skills/.curated/`, `skills/.experimental/`, `skills/.system/`
3. `.agents/skills/`, `.claude/skills/`, and about 50 other agent directories

"Each skill container directory is walked up to three levels deep, covering flat layouts (`skills/<name>/SKILL.md`) and catalog layouts with one or two category levels (`skills/<category>/<name>/SKILL.md`)". It also reads `.claude-plugin/marketplace.json` and `plugin.json` skill lists.

**Category subfolders work with `npx skills`.** Claude Code plugin loading expects `skills/<name>/SKILL.md` by default. Category nesting would require listing each path in `skills` arrays.

**Install targets (project / global):**

| Agent | Project dir | Global dir |
|---|---|---|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Codex | `.agents/skills/` | `~/.codex/skills/` |
| Cursor | `.agents/skills/` | `~/.cursor/skills/` |
| Gemini CLI | `.agents/skills/` | `~/.gemini/skills/` |
| GitHub Copilot | `.agents/skills/` | `~/.copilot/skills/` |
| OpenCode | `.agents/skills/` | `~/.config/opencode/skills/` |
| "Universal" | `.agents/skills/` | `~/.config/agents/skills/` |

The default method is **symlink** from each agent directory to one canonical copy. `--copy` makes independent copies instead.

`metadata.internal: true` hides a skill from normal installs (override with `INSTALL_INTERNAL_SKILLS=1`).

**Gotcha** (marketingskills README): "If you run the command from inside an agent session … the CLI runs non-interactively and may only install to the universal `.agents/skills/` directory, which Claude Code does not read. Pass the agent explicitly: `npx skills add … -a claude-code`."

The agentskills.io client guide says ".agents/skills/ paths have emerged as a widely-adopted convention for cross-client skill sharing". It also says "project-level skills override user-level skills".

### 2.4 Other install approaches observed

- Clone and copy: `cp -r repo/skills/* .agents/skills/`
- Git submodule: `git submodule add … .agents/marketingskills`
- SkillKit: `npx skillkit install owner/repo --skill …`
- Manual: `git clone … ~/.claude/skills/<name>` (revenue-centric-design, whose repo root is itself the skill)
- **Mirror directories** (hyperframes): `.claude/skills/` and `.agents/skills/` are byte-identical copies for repo-internal skills, enforced by `scripts/check-skill-mirror.mjs` in CI. Symlinks are the lighter alternative.
- **AGENTS.md as the source of truth, with `CLAUDE.md -> AGENTS.md` as a symlink** (marketingskills). One file then serves Codex, Cursor, Copilot, and Claude Code contributors.

---

## 3. Repo organization patterns observed

### 3.1 anthropics/skills
- Flat `skills/<name>/`, 19 skills, each with its own `LICENSE.txt`.
- Mixed licenses: Apache-2.0 for most skills; docx/pdf/pptx/xlsx are "source-available", all rights reserved.
- `template/SKILL.md` is minimal:
  ```yaml
  ---
  name: template-skill
  description: Replace with description of the skill and when Claude should use it.
  ---
  # Insert instructions below
  ```
- SKILL.md sizes range from 32 lines (`internal-comms`) to 603 lines (`claude-api`). Most are 70–400 lines.
- `frontend-design` (71 lines, Apache-2.0) is directly relevant to our web-design skill:
  - It names AI-default design tells to avoid: cream #F4F1EA background with a terracotta accent; near-black with acid-green; broadsheet hairlines; the "SaaS-card kit" with identical rounded cards and rgba(0,0,0,.1) shadows; ALL-CAPS eyebrows; `A · B · C` meta strings; a `→` appended to every CTA.
  - Process: two-pass (token plan of 4–6 named hex colors, type roles, ASCII wireframe layout, then review against the brief before coding).
  - "Spend your boldness in one place."
  - Quality floor: "responsive down to mobile, visible keyboard focus, reduced motion respected".
  - Microcopy: "A CTA says exactly what happens … 'Save changes,' not 'Submit.' … the button that says 'Publish' produces a toast that says 'Published.'"; "Errors don't apologize"; "An empty screen is an invitation to act."
  - Line length under 80 characters.
  - Motion: "A single orchestrated moment … lands better than scattered effects."

### 3.2 marketingskills (the most mature growth pattern)

- **Flat `skills/<name>/`, 50 skills.** Short, noun-style names (`cro`, `signup`, `onboarding`, `paywalls`, `pricing`).
  - v2.0 renamed 17 skills from verbose names (`page-cro`, `signup-flow-cro`, `pricing-strategy`) to short ones, and merged `page-cro` and `form-cro` into `cro`, with `references/form.md` as a sub-reference.
  - Renames create stale folders for users. The README keeps a rename map and an `rm -rf` cleanup command. **Lesson: pick final names before 1.0.**
- **Categories exist only in README/docs**, not on disk. Examples: "Conversion Optimization", "Content & Copy", "SEO & Discovery", "Measurement & Testing", "Retention", "Strategy & Monetization". An ASCII dependency diagram shows `product-marketing` feeding every category.
- **Auto-generated README table** between `<!-- SKILLS:START -->` and `<!-- SKILLS:END -->`, produced by `.github/scripts/sync-skills.js`. The same script rewrites marketplace.json and plugin.json from frontmatter. CI workflows: `validate-skill.yml` (runs `Flash-Brew-Digital/validate-skill@v1` on changed SKILL.md files), `sync-skills.yml`, and `release.yml`. `validate-skills-official.sh` runs `skills-ref validate` on every skill.
- **Uniform skill anatomy** (cro, signup, onboarding, paywalls, pricing, and copywriting all follow it):
  1. Frontmatter: `name`, a long "When the user wants to … Also use when the user mentions '…,' '…'" description with casual trigger phrases ("my landing page sucks", "nobody's converting"), then **scope boundaries** ("For signup/registration flows, see signup. For post-signup activation, see onboarding."), then `metadata: version: 2.0.0`.
  2. `# Title` and a role line: "You are a conversion rate optimization expert. Your goal is …"
  3. `## Initial Assessment` that checks the shared context file first, then asks 3 scoping questions.
  4. `## Core Principles` or `## … Framework`: numbered, ordered by impact ("in order of impact", "Highest Impact").
  5. Domain sections using the same Check for / Common issues / Strong patterns shape.
  6. `## Output Format`: fixed buckets (Quick Wins / High-Impact Changes / Test Ideas / Copy Alternatives), or per issue Issue → Impact → Fix → Priority.
  7. `## Experiment Ideas`, linking to `references/experiments.md`.
  8. `## Task-Specific Questions`: 5 questions.
  9. `## Related Skills`: bullets of the form `**skill-name**: when to go there`.
- **Shared context file pattern.** The `product-marketing` skill creates `.agents/product-marketing.md`, with fallbacks `.claude/product-marketing.md` and the legacy `product-marketing-context.md`. Every other skill opens with:
  > **Check for product marketing context first:** If `.agents/product-marketing.md` exists (or `.claude/product-marketing.md` …), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.
  - The context doc has 12 sections: product overview, audience, personas, pains, competition, differentiation, objections/anti-personas, JTBD four forces, verbatim customer language, brand voice, proof points, and goals.
  - It carries a `**Document version:** vN`, `**Last updated:**`, and a newest-first `## Changelog` ("A good entry names the sections touched and the reason").
  - It offers "Auto-draft from codebase (recommended)" (read README, landing pages, package.json) or a conversational interview.
  - **This is the single best pattern to copy.** Our equivalent is a `project-context` skill that writes `.agents/project-context.md` (stack, platforms, scale targets, architecture style, design system/tokens, brand, a11y level, constraints). All other skills read it first.
- **Versioning (AGENTS.md):** repo release `x.y.z`, where x = restructure or breaking, y = new skill added, z = updates to existing skills. Per-skill `metadata.version` is mirrored in `VERSIONS.md`, and every shipped change must bump it. AGENTS.md also instructs agents to check `VERSIONS.md` on GitHub once per session and show a non-blocking update notice. That is clever but involves network fetches, so treat it as optional.
- **Contributor rules:**
  - Conventional Commits; branches `feature/skill-name`, `fix/…`, `docs/…`.
  - PR checklist: name matches dir; description 1–1024 characters with trigger phrases; SKILL.md under 500 lines; no secrets.
  - PR templates: `new-skill.md`, `skill-update.md`, `documentation.md`. Issue template: `skill-request.yml`.
- **Style (AGENTS.md):** "Use H2 for main sections, H3 for subsections … Short paragraphs (2-4 sentences max) … Second person … Clarity over cleverness; Specific over vague; Active voice; One idea per section." Description formula: "1. What the skill does 2. When to use it (trigger phrases) 3. Related skills for scope boundaries."
- **Tool-neutrality rubric (CONTRIBUTING):** "Options, not one answer … No forced endorsement … The swap test: If you swapped your tool for a competitor, the section should still read as fair." This applies directly to us when naming frameworks, libraries, or cloud vendors.
- **Weakness:** some skills approach 455 lines (`marketing-psychology`, `popups`) with inline encyclopedic lists. Those would be better as references.

### 3.3 recon-skills (structure only)
- **Category directories on disk:** `auth/`, `chains/`, `infra/`, `meta/`, `recon/`, `redteam/`, each holding `<skill>/SKILL.md`. About 145 skills. `npx skills` supports one category level; Claude Code plugins would need explicit paths.
- **Mandatory section contract** (`STYLE.md`, enforced by `scripts/validate_skills.py`): `## When to Use`, `## Prerequisites`, `## How to Run`, `## Procedure`, `## Pitfalls`, `## Verification`. Missing sections are **warnings** for legacy skills and **errors** for new ones. This is a good incremental-migration trick.
- The validator also checks duplicate names, broken `related_skills` references, and forbidden runtime-coupling regexes (no private paths or framework names). The CI runs it plus `git diff --check`.
- **Meta/router skills:** `meta/recon-playbook` and `bb-methodology` are entry points. The README has a "High-Signal Entry Points" table (skill → purpose).
- **Evidence discipline:** "State observations separately from inference: Observed / Inferred / Confirmed / Not tested". Verification must describe "semantic evidence", not just a status code. This transfers well to architecture reviews: separate observed code facts from inferred risks.
- **"No Template Duplication":** "If two skills differ only by a sector name, platform name … collapse them into one parameterized skill" (25 skills collapsed into 1 with a YAML database). This is relevant for iOS vs Android: prefer one `mobile-design` skill with `references/ios.md` and `references/android.md`.
- **Root docs:** `SOUL.md` (operating principles), `STYLE.md` (quality bar), `AGENTS.md` (contributor guide), `CHANGELOG.md`.
- **Weaknesses:**
  - Some SKILL.md files run to 1,600–1,700 lines, far over the 500-line guidance.
  - The description rule "<=60 chars" contradicts the pushy-description guidance.
  - Non-spec top-level frontmatter keys.
  - Shouty ALL-CAPS headings ("KILL FAST RULES").

### 3.4 revenue-centric-design (single-skill repo)
- The repo root is the skill: `SKILL.md`, `references/` (12 themed files, 23–183 lines each), `assets/` (images cited by principles), `updater/` (Python pipeline plus `prompts/distill.md` that turns new source posts into principles), `CHANGELOG.md`, and `LICENSE`.
- The SKILL.md (82 lines) is a **router**: a short "spine" of 9 principles, then a table "When the question is about… → Open [reference]". It is a textbook example of progressive disclosure.
- **Fixed entry schema** in every reference:
  ```
  ## <short imperative principle title>
  **Principle.** … **Apply when.** … **The move.** … **Evidence.** … **Visual.** … **Voice.** … **Source.** [@author · YYYY-MM-DD](url)
  ```
  "Keep each entry ~60–110 words." "Preserve the **named mechanism** … that naming is the value." The schema makes content scannable, citable, and machine-appendable. Our skills should use a similar **Rule → Apply when → Do → Why/Evidence → Source** shape.
- **Usage boundary section** in SKILL.md: a hard refusal for gambling/casino products, required by the source author.
- **LICENSE is source-available with a field-of-use restriction.** Terms: "retain clear attribution to Richard (@richardrx)"; "NO GAMBLING / BETTING / CASINO USE … MUST be preserved in any copy or derivative"; "Any copy or derivative work must include this license in full". **We cannot merge its text into an MIT/Apache repo without carrying that license.** See section 5.7.

### 3.5 hyperframes (packaging only)
- `skills/` holds about 21 published skills. `/hyperframes` is a mandatory **router** skill ("Read first … Capability map … intent router"), and domain skills are prefixed `hyperframes-*`.
- The README separates "Router", "Creation workflows", and domain skills in tables with "Use when" columns.
- Repo-internal skills live in `.claude/skills/` and `.agents/skills/` (mirrored) and are flagged `metadata.internal: true` so installers skip them.
- One version string across 5 manifests. A "core set" is installed by default, and other workflows install on demand.

### 3.6 What works best (synthesis)

1. **Flat `skills/<name>/` on disk; categories in README and marketplace plugin groupings.** This gives maximum compatibility: Claude Code plugins, `npx skills`, the `.agents/skills` convention, and claude.ai upload all work.
2. **One router/entry skill** plus focused domain skills (hyperframes, RCD). **One shared context file** written by a setup skill (marketingskills).
3. **Uniform section contract** enforced by a validator, with warnings first and errors later (recon-skills). **Standard output format** per skill (marketingskills).
4. **Explicit `Related skills` / scope boundaries** in both the description and the body. Only add a cross-reference when it is a real next step (recon-skills: "References may be directional").
5. **Generated README tables and manifests** from frontmatter, so nothing drifts.
6. **Per-skill `evals/evals.json`** with objective assertions.
7. **Fixed entry schema** for rule catalogs in `references/` (RCD).

---

## 4. Distilled product-design content (conversion, onboarding, signup, pricing UX, psychology)

This section keeps rules that belong in *product/UX design* skills, such as our web-design and mobile-design skills and possibly a `product-ux-conversion` skill. Pure marketing (ads, SEO, cold email) is excluded.

Sources: [RCD] revenue-centric-design, © Richard @richardrx, source-available with restrictions. [MS] marketingskills, MIT. [FD] anthropics frontend-design, Apache-2.0.

Numbers are as cited by the sources. They should be re-verified before we quote them as fact.

**Ethics filter applied.** Some RCD material advocates engineering compulsive-use loops, maximizing exit costs so users feel trapped, and similar lock-in tactics. That material is intentionally **excluded**. Our repo should frame persuasion as *reducing friction and uncertainty for the user's own goal*. It should explicitly ban dark patterns: confirmshaming, hidden costs, obstruction of cancellation, fake scarcity, pre-checked consent, and nagging. It should align with the EU DSA/DMA, FTC "click-to-cancel", and the Apple and Google store guidelines.

### 4.1 RCD "spine": 9 principles (Richard's framework, paraphrased)
1. **Neutrality is omission.** An interface that doesn't direct attention hurts conversion. Give the primary action clear visual priority.
2. **Who talks to everyone convinces no one.** Define the ICP (ideal customer profile) by buying criteria (trigger, pain, prior attempts, proof needed), not demographics.
3. **Value first, ask later.** Proof arrives before the ask (signup, card, upgrade).
4. **Your promise is the size of your proof.**
5. **Same competes on price, different on category.** Differentiate in mechanism, narrative, or experience.
6. **The default is the decision you made for the user.** Initial state defines mass behavior, so choose defaults that are ethically defensible.
7. **Retention is built, not requested.** Show users the value they've accumulated.
8. **Expansion is born of usage.** Offer the upgrade at the moment a limit is reached, never as an interruption.
9. **Price is a filter.** Pricing decides who enters, stays, and expands.

Also from RCD, **design leverage by stage:**

| Stage | Focus |
|---|---|
| MVP | Shorten the path to value |
| Survival | Activation |
| Traction | Conversion |
| PMF | Depth, second "aha", expansion |
| Scale | Design system |

Mnemonic: "Shorten → Activate → Convert → Expand → Systematize". This maps nicely onto an architecture-maturity model.

### 4.2 Landing page and hero rules
- **5-second test** (RCD, MS): show the hero to someone from the ICP for 5 seconds. They must be able to answer *what is it, is it for me, why now*.
- Hero must contain:
  - a headline saying what it does, in customer language
  - a subhead naming the ICP and a concrete result
  - real product visual proof (a screenshot, not stock art)
  - a specific CTA
  - immediate social proof above the fold
- Lead with the pain for low-awareness audiences, and with differentiation for high-awareness ones.
- **Debug order** (RCD): ICP → awareness level (Schwartz's 5 stages) → proof sufficient for that stage → only then visual design. "Paint the button" is the last step of a cascade.
- **Awareness level → angle / hero / proof:**

| Awareness level | Angle | Hero | Proof |
|---|---|---|---|
| Unaware | symptom and identity | "Still doing X this way?" | diagnostic or checklist |
| Problem-aware | cost and urgency | "If you have X, you're losing Y" | numbers, before/after |
| Solution-aware | trade-offs | "3 ways to solve X" | honest comparison |
| Product-aware | differentiation | "Why us, why now" | cases, demo |
| Most aware | final risk and friction | "Swap X for Y in Z days, no risk" | guarantees |

- **Specificity over decoration:** "Complete platform" → "Cut new-dev onboarding time 40%". "Used by X" → "We cut X's churn from 12% to 6%". The source reports 0.5% vs 3% conversion across 30 SaaS landing pages.
- **2026 LP checklist** (RCD endorsing @namyakhann):

| Area | Rules |
|---|---|
| Hero | 1 promise, 1 audience, 1 exact-action CTA, a show-don't-explain visual, a trust seal above the fold |
| Copy | Headline under 10 words; benefit before feature; customer language; one transformation; scannable in 5 seconds |
| Social proof | Logos, metrics, specific-result testimonials; no generic praise |
| Structure | Hero → Pain → Solution → Proof → CTA; at most 3 feature sections; FAQ answers the top 5 objections; CTA repeated 2–3 times |
| Technical | Under 3 s load; real mobile-first; single-scroll flow |

  Mantra: "Clarity > creativity. Result > feature. Speed > polish."
- **Performance is conversion:** a Vodafone A/B test found 31% better LCP → +8% sales. Treat Core Web Vitals as a conversion experiment. Target an "A" grade and under 3 s load.
- **Pre-verbal layer first:**
  - Contrast is relative to surroundings; 4.5:1 is a floor, not a goal.
  - Placement follows Fitts's law and the F-pattern.
  - Trust comes from a real human face, verifiable proof, fit between offer and problem, and a coherent mechanism.
  - Fix these before rewriting copy.
- **Primary action wins on contrast** (the Von Restorff effect). A ghost secondary button next to a solid primary. "If everything grabs attention, nothing does." Never hide the key action in a dropdown.
- **No outbound links** on a conversion page. Repeat the CTA; MS says "about every 1.5 sections".
- **Features pages are skimmed:** 3 crisp bullets plus an easy-to-find demo video. Deep detail serves the technical minority.
- **Social proof:**
  - Aim for a 4.2–4.5 star profile, not a perfect 5 (Northwestern study).
  - Real faces, names and roles, verifiable reviews, recognizable logos.
  - Avoid identical cards, first-name-only quotes, and generic avatars.
  - Real users and team photos beat stock models (Highrise/37signals test).
  - Use precise numbers ("526 homes") over round ones ("500+"), per Schindler & Yalch 2006.
- **Don't clone a converting page.** The invisible layer is customer research (vocabulary, objection order, chosen proof). Copying the look is cargo-cult design.
- **Judge pages by conversion and CAC, not by beauty.** Converting pages are often plain and text-heavy. Pattern: one obvious attention point, a high-contrast CTA with redundancy, a clear promise, guarantee plus proof plus a free element, and organic images by the second fold.
- **Cold-traffic honesty test:** warm-audience conversion is inflated. Evaluate on cold traffic.
- **Qualify on the page, not in the media** (to lower CAC): specific copy, visible pricing, a qualifying first question.
- **MS CRO analysis order** (highest impact first):
  1. Value-prop clarity (can a visitor understand it in 5 seconds?)
  2. Headline (outcome-focused: "Get [outcome] without [pain]")
  3. CTA placement, copy, and hierarchy ("Start Free Trial" / "Get My Report" beat "Submit" / "Learn More")
  4. Visual hierarchy and scannability
  5. Trust signals near CTAs
  6. Objection handling (FAQ, guarantees, comparisons)
  7. Friction (fields, navigation, mobile, load time)
- **MS page-type rules:**
  - Homepage: serve both "ready to buy" and "still researching".
  - Landing page: message match with the traffic source, single CTA, remove navigation.
  - Pricing page: clear comparison, recommended plan, address "which plan is right for me?".
  - Feature page: connect feature to benefit.

### 4.3 CTA and microcopy
- A CTA answers three questions: what happens on click, how long it takes, what it costs or commits. "Start free in 30s" beats "Sign up".
- **Click trigger:** one risk-reducing line under the CTA ("14 days, no card"; "Cancel anytime"). Source real objections from support tickets and reviews.
- **Stage-matched CTA verbs**, 4 words or fewer: "See how it works" → "I want this" → "Complete my purchase".
- [FD] Name actions by what users understand ("manage notifications", not "webhook config"). Keep the same verb through the flow (Publish → "Published"). Errors explain what happened and how to fix it; they neither apologize nor stay vague. Empty screens invite action. Use sentence case.
- [RCD] Put fraud-prevention microcopy at the exact risk moment ("Never share your code outside the app").
- [RCD] Strip jargon (the curse of knowledge). Plain language reads as more trustworthy, and jargon-driven confusion shows up as churn.

### 4.4 Forms, signup, and checkout
- **Every field costs something.** [MS] Rule of thumb: 3 fields is the baseline; 4–6 fields means 10–25% fewer completions; 7+ means 25–50%+ fewer. [RCD/HubSpot] 3-field forms convert over 25%; a phone field drops conversion to ~13.5% from 19%. A single case: an 8-field signup converted at 12% vs 34% for email + password.
- **Qualify by in-product behavior, not a long form.** The exception is enterprise demo forms (6–8 fields), where friction qualifies leads.
- **Perceived effort ≠ real effort.** 5 screens × 2 fields can beat 2 screens × 7 fields. Aim for "a corridor, not an interrogation room".
- **Field rules** [MS + RCD]:
  - Single email field, no confirm field. Inline validation. Typo suggestions (gmial.com → gmail.com).
  - Password: show/hide toggle, requirements shown up front and updated live, **never block paste**, a strength meter over rigid rules, consider passwordless or magic link.
  - Name: a single "Full name" field unless you need the split.
  - Phone: defer; if required, explain why, format as the user types, and use a country picker.
  - Company: infer from the email domain or autocomplete.
  - Role and use case: defer to onboarding.
  - Visible labels, not placeholder-as-label. Placeholders show examples.
  - Avoid dropdowns for fewer than about 6 options; use a button group or radios. Make long lists searchable.
  - Explain why sensitive data is needed.
  - Prefer tap or swipe over typing on mobile. Use the right keyboard type (email, tel, numeric). Support autofill.
- **Social auth:** prominent. B2C: Google, Apple (Apple is required on iOS when other social logins are offered). B2B: Google, Microsoft, SSO.
- **Multi-step:**
  - Use when more than 3–4 fields are needed.
  - Show progress; start with easy questions, harder ones after commitment.
  - Allow back navigation; save progress across refresh.
  - Progressive pattern: email → password + name → optional customization.
- **Errors:** inline, specific, with a recovery path ("Email already registered" + sign-in link). Don't clear the form. Focus the problem field.
- **Mobile signup:** tap targets of 44 px or more, single column, sticky CTA, test on real devices.
- **Post-submit:**
  - Clear confirmation and one next step.
  - If verification is needed: explain it, offer resend, mention spam folders, allow changing the email.
  - Consider delaying verification and letting users explore meanwhile.
- **Checkout** [RCD]: "~70% of drops happen" there.
  - Minimum fields. **No surprise fees**; include all costs in the displayed price.
  - Security signal near payment. Show company identity. Show product images even for digital goods.
  - Numeric keyboards. Guest checkout. Delivery time and total price shown early. A clear return policy.
  - Split complex choices into steps.
- **Cart-abandonment reasons** (Baymard, as cited):

| Reason | Share |
|---|---|
| Extra costs | 49% |
| Forced account creation | 24% |
| Slow delivery | 19% |
| Complicated checkout | 18% |
| Distrust | 17% |
| Unclear price | 17% |
| Errors | 12% |
| Returns policy | 11% |

  Use this as an audit checklist.
- **Measure** [MS]: form start rate, completion rate, field-level drop-off, time to complete, error rate per field, mobile vs desktop.

### 4.5 Onboarding and activation
- **Define activation empirically:** find the action that separates retained users from churned ones. Often it is collaborative (invite, share). Examples: Slack at 2,000 messages; Facebook at 7 friends in 10 days.
- Replace vanity metrics:

| Vanity metric | Use instead |
|---|---|
| Signups | Activation rate |
| Session time | Time to first useful action |
| Tour completion | D7 retention |

  Benchmarks as cited (Userpilot): average activation 30–37%; top quartile 40%+; under 20% signals a structural problem. Top performers reach time-to-value in under 5 minutes.
- **Minimum Path to Value** [MS]: inventory every step → remove non-essentials → rebuild in value-first order → measure. Treat every step as "guilty until proven essential". As cited, 40–60% of trial users abandon after one session and 75–80% of trial abandonment happens on day one.
- **Map the journey from session replays**, not from the founder's diagram. Compare your numbered steps with 5 real recordings; each divergence is a hypothesis.
- **Fix the biggest drop, not the first step:** define value → list steps → measure drop per step → fix the steepest → diagnose friction vs confusion vs ordering.
- **Never ship a blank dashboard:**
  - an empty state with a next-action hint
  - seed or sample data showing the destination
  - one clear action, not eight
  - a progress bar that starts partly filled (the endowed-progress effect; MS cites about +40% completion)
- **Good empty state** [MS]: explains the area, shows what it looks like with data, has a primary action, and may pre-populate examples.
- **Active over passive onboarding:** "doing > reading" (Slack makes you send a message first). Deliver the promised result before teaching mechanics. One goal per session.
- **Declarative vs administrative friction:**
  - Cut steps that only collect data.
  - Keep or add short steps where the user declares their intent. These personalize the path and create commitment. Case: time to first sale fell from 24.2 to 2.5 days after adding a ~30-second intent step.
- **Calibrate the first step:** small, achievable, with progress anchored. "Create one story today", not "Post 5×/week".
- **Celebrate the activation moment** (peak-end rule). Show motion or a rising graph, not a static confirmation (Stripe's first-charge graph).
- **Pattern selection by awareness × flow complexity** (RCD's 9 patterns: welcome modal, wizard/tour, contextual tooltips, empty state, personalization, checklist, goal-setting, sample data, use-case demos):

| Awareness | Flow complexity | Patterns |
|---|---|---|
| Low | High | Tour + checklist + personalization |
| Low | Low | Modal + empty state |
| High | High | Checklist + tooltip + empty state |
| High | Low | Modal + empty state, then get out of the way |

- **Checklists** [MS]: 3–7 items ordered by value, quick wins first, progress visible, a celebration on completion, always dismissible.
- **Tours:** at most 3–5 steps, dismissible, never repeated for returning users.
- **Onboarding video welcomes, it doesn't teach.** Keep it short, founder-made is fine.
- **Support tickets are design bugs.** Turn recurring setup questions into in-flow help.
- **Reinforce the decision** after signup or purchase (choice-supportive bias): a strong welcome with clear next steps.
- **Trial design:**
  - Tie the trial's end to value consumed, not just the calendar; never paywall before a first micro-win.
  - Trial length depends on complexity, time-to-value, usage frequency, and whether a card is on file.
  - Card-upfront trials convert at about 31% vs about 9% without a card (ChartMogul, as cited), with fewer signups. Choose by ICP, not by the headline rate.
- **Activation models** [MS]: freemium, free trial (3/7/14/30 days), paid trial, money-back guarantee, consultation. "Your market dictates your model" (Model-Market Fit). "The free experience should hook, not satisfy."
- **Onboarding stalls** [MS]: define "stalled", then re-engage by email (address blockers), in-app ("pick up where you left off"), or a human for high-value accounts. Emails should reinforce in-app actions rather than duplicate them. Progress emails ("you created 3 reports") beat generic "trial ending" emails.
- **Mobile-specific pattern** [MS]: permissions → quick win → push opt-in → habit. Ask for permissions **in context**, with a pre-permission explanation, after value is shown.

### 4.6 Pricing page and upgrade UX
- **Good-Better-Best:**
  - Three plans; 2–5 is acceptable; 6 or more creates choice overload.
  - The target plan goes in the middle and is highlighted with color, size, or a badge.
  - Price the middle closer to Good than to Best.
  - A higher tier anchors the price.
  - Keep comparisons on **one value axis** (don't mix "10k tokens" with "priority support").
  - "Do the math for the user."
- **Decoy effect** (Ariely / The Economist) and **anchoring:** don't lead with "Free" as the first number. [MS] Three tiers beat seven; recommend a "best for most" plan.
- **Feature-row order** (serial-position effect): the killer feature first, utility items in the middle, the differentiator or guarantee last, next to the CTA.
- **Tier naming changes the mix.** Aspirational names increase purchase incidence; plain names shift choice upward (Wang et al. 2024). Measure both.
- **Defaults:** preselect the recommended tier, default to annual billing, and start the seat picker at the typical count. Defaults must be defensible and never tricky checkboxes.
- **Upgrade prompts:**
  - Show at the moment of value or at a limit, never during onboarding or mid-flow.
  - Frame what the user keeps: "You created 47 reports; export needs Pro". Tie the gate to an imminent result.
  - [MS] Paywall anatomy: headline ("Unlock [Feature] to [Benefit]"), value demo/preview, comparison with the current plan marked, simple pricing with an annual toggle, social proof, a specific CTA, and **an escape hatch** ("Not now" / "Continue with Free").
  - Frequency caps; cool-down after dismissal "days, not hours".
  - After upgrade: immediate access and a tour of new features.
  - [MS] Anti-patterns: hidden close button, confusing plan selection, guilt-trip copy, blocking critical flows.
  - Trial-expiry notices at 7, 3, and 1 days, with a clear "what happens" and a summary of value received.
- **Cancel flow:**
  - Treat it as a designed screen, not a form.
  - Show concretely what will be lost.
  - Offer pause or downgrade *as options*.
  - Ask an open "What was missing?" question.
  - **Keep cancellation easy**; that is a legal requirement in many markets. The RCD line "make cancellation easy but the loss tangible" is the acceptable version.

### 4.7 Dashboards and data visualization
- A dashboard answers "What do I do now?", not "here is everything".
- **Main KPI top-left** (F-pattern), largest type for the North Star metric.
- Group by business context, not by chart type.
- Round numbers (R$10,234.56 → 10k).
- Attach meaning ("15% above monthly target").
- Put the fix action beside a red number (the "so what?" test).
- Less ink; no heavy borders or shadows.
- Personalize by role.
- Design the empty state.
- **KPI shortlists:**

| Product type | KPIs |
|---|---|
| E-commerce | CR, AOV, CAC, CLV, cart abandonment, ROAS |
| SaaS | MRR, churn, CAC, LTV, ARPU |
| Apps | DAU, MAU, retention, ARPU, rating, session metrics, CPI |

- Removing information creates room for guidance (insight cards).

### 4.8 Product-scope discipline (useful for architecture and clean-code skills too)
- **Swiss Knife Index** = features used by more than 40% of active users in 30 days ÷ total features. Below 0.3 means bloat.
  - Features used by under 10% of users must justify themselves.
  - Hide rarely used features in advanced settings rather than deleting them.
  - Pendo, as cited: about 6% of features drive usage.
- **Two-layer feature filter:**
  - Layer 1 (does it deserve to exist?): cognitive load, ICP specificity, operational cost, reinforces the core claim.
  - Layer 2 (build now?): easily rejectable vs easily implementable.
  - Scoring: (new users + new revenue + impact) ÷ effort.
- **Maturing means doing the same thing better** (smoother flows, bug fixes, attention hierarchy), not adding power-user density.
- **Leave heavily used areas alone** (users' cognitive map; status-quo bias; the Snapchat 2018 redesign backlash). Improve around them.
- **Heuristic leak audit before a redesign:** walk landing → activation, mark OK/not-OK per area, screenshot failures, and grade severity on 4 levels from cosmetic to critical. Patch the leaks rather than rebuilding.
- **Feature adoption is a design problem:** inattentional blindness. Use directional empty states and behavior-triggered introductions, and measure adoption rate.
- **AI-era:**
  - Code is commoditized; differentiate on UX, niche specificity, time-to-value, trust, and human touches (kind errors, a helpful 404, 200 ms confirmation micro-interactions).
  - Avoid the AI-generated default UI (see [FD] tells).
  - "Claude → Figma → code" loops cause drift without a design system and a single source of truth.
- **Experimentation:**
  - Compute minimum sample size before running an A/B test. Test big things. Don't stop early.
  - Without volume, 5 good interviews beat an underpowered test.
  - Don't A/B test price on low volume (ProfitWell); use willingness-to-pay research.
  - Signups are not traction; watch D1/D7 retention and activation.

### 4.9 Psychology toolkit relevant to UX (from MS marketing-psychology; use ethically and name the mechanism)

| Mechanism | UX application |
|---|---|
| Hick's Law / Paradox of Choice | Fewer options, one primary CTA, fewer fields |
| Fitts's Law | Large, close targets for primary actions |
| Von Restorff | Visually distinct primary action |
| Serial-position | Order lists and pricing rows |
| Default effect / status quo | Smart, reversible, honest defaults |
| Goal-gradient / endowed progress | Progress bars that start partly filled; "2 steps left" |
| Zeigarnik | Visible, closable open loops (profile 80% done) |
| Peak-end rule | Design the activation peak and the ending |
| IKEA / endowment | Let users build or configure early |
| Loss aversion / framing | Show what the user keeps; no manipulation |
| Anchoring / decoy | Pricing table structure |
| Social proof / authority | Specific, verifiable proof near CTAs |
| Curse of knowledge | Test with newcomers; plain language |
| Fogg B = M·A·P / EAST / COM-B | Diagnose why a step doesn't happen |
| Activation energy | Pre-fill, templates, trivial first step |
| Choice-supportive bias | Reinforce the decision after commit |
| Cognitive load | Chunking and progressive disclosure |

MS quick-reference map:
- Low conversions → Hick, Activation Energy, Fogg, Friction
- Decision paralysis → Paradox of Choice, Default, Nudge
- Onboarding → Goal-Gradient, IKEA, Commitment & Consistency
- Price objections → Anchoring, Framing, Mental Accounting

---

## 5. Recommendations for our repository

### 5.1 Name and identity
- The repo name and marketplace `name` must be kebab-case and **not** reserved. Avoid `agent-skills`, `claude-*`, `anthropic-*`, and `*-official`. Suggestion: repo `how-to-build-software`, marketplace `how-to-build-software`, plugins `hbs-<domain>` or plain domain names.
- License: **MIT or Apache-2.0** for our own content, plus `THIRD_PARTY_NOTICES.md` for anything adapted (MS is MIT; the anthropics skill-creator and frontend-design are Apache-2.0 and require NOTICE and attribution).

### 5.2 On-disk layout (flat skills, categories only in manifests and README)
```
how-to-build-software/
├── .claude-plugin/
│   └── marketplace.json          # several plugins, one per domain + an "all" plugin
├── skills/
│   ├── project-context/          # setup skill → writes .agents/project-context.md
│   ├── software-architecture/    # SKILL.md + references/{styles,ddd,adr,event-driven,...}.md
│   ├── clean-code/               # SKILL.md + references/{naming,functions,testing,refactoring,<lang>.md}
│   ├── scalability/              # SKILL.md + references/{caching,db-scaling,queues,observability,capacity}.md
│   ├── web-design/               # SKILL.md + references/{tokens,typography,layout,motion,a11y,performance,forms,landing-pages}.md
│   ├── mobile-design/            # SKILL.md + references/{ios-hig.md, android-material.md, onboarding.md, permissions.md, paywalls.md}
│   ├── product-ux-conversion/    # optional: onboarding, signup, pricing UX, dashboards (distilled §4, rewritten)
│   └── design-review/            # optional audit skill: heuristic leak audit → graded findings
├── template/SKILL.md
├── scripts/validate_skills.py    # spec + our section contract + link check + line/size limits
├── scripts/sync.mjs              # regenerate README table + manifests from frontmatter
├── AGENTS.md  (CLAUDE.md -> AGENTS.md symlink)
├── STYLE.md   CONTRIBUTING.md   CHANGELOG.md   LICENSE   THIRD_PARTY_NOTICES.md
└── .github/workflows/validate.yml   (skills-ref validate + our validator + claude plugin validate --strict)
```
- Keep skills flat so that `/plugin install`, `npx skills add`, `.agents/skills`, and claude.ai upload all work without path lists.
- Use **`references/` per platform** (web/iOS/Android, or per language) instead of separate near-duplicate skills. This follows recon-skills' "no template duplication" rule and skill-creator's "domain organization".
- Optional extra Gemini and Codex manifests (`gemini-extension.json`, `.codex-plugin/plugin.json`, `.cursor-plugin/plugin.json`) with `"skills": "./skills/"`, all versions kept in lockstep by the sync script.

### 5.3 marketplace.json sketch (Pattern B; requires no root plugin.json, or one without components)
```json
{
  "name": "how-to-build-software",
  "owner": { "name": "<maintainer>", "url": "https://github.com/<org>" },
  "description": "Agent Skills for software architecture, clean code, scalability, and 2026 web & mobile design",
  "metadata": { "version": "0.1.0" },
  "plugins": [
    { "name": "all", "source": "./", "strict": false, "description": "Every skill in the collection",
      "skills": ["./skills/project-context", "./skills/software-architecture", "./skills/clean-code",
                 "./skills/scalability", "./skills/web-design", "./skills/mobile-design"] },
    { "name": "engineering", "source": "./", "strict": false,
      "skills": ["./skills/project-context", "./skills/software-architecture", "./skills/clean-code", "./skills/scalability"] },
    { "name": "design", "source": "./", "strict": false,
      "skills": ["./skills/project-context", "./skills/web-design", "./skills/mobile-design"] }
  ]
}
```
Validate with `claude plugin validate . --strict`.

### 5.4 SKILL.md conventions (our contract)
- **Frontmatter** uses only spec keys. Extras go under `metadata`:
  ```yaml
  ---
  name: web-design
  description: Use when designing, building, or reviewing a web UI in 2026 — landing pages, app screens, design tokens, typography, layout, motion, accessibility, forms, or Core Web Vitals — even if the user only says "make this look better" or shares a screenshot. Covers distinctive (non-templated) visual direction, WCAG 2.2 AA, and conversion-aware layout. For native iOS/Android UI use mobile-design; for signup/onboarding/pricing flows see product-ux-conversion.
  license: MIT
  metadata:
    version: "1.0.0"
    category: design
    related: "mobile-design product-ux-conversion project-context"
  ---
  ```
- **Description formula:** "Use when …" + what it covers + casual trigger phrases ("even if …") + scope boundaries ("For X use Y"). Keep it under 1024 characters, with the key use case in the first ~200 characters. No `<` or `>`.
- **Body under 500 lines and about 5k tokens.** Required sections, enforced as warnings first:
  1. `## When to use` (optional; the description already covers it)
  2. `## Before you start`: read `.agents/project-context.md` if it exists, otherwise ask 3 scoping questions or offer to run `project-context`
  3. `## Core principles` (numbered, ordered by impact, each with a one-line *why*)
  4. `## Procedure` / `## Workflow`, with a checklist of `- [ ]` steps and validation gates
  5. `## Gotchas` (concrete corrections to likely model mistakes; the highest-value section)
  6. `## Output format` (a fixed template, e.g. Findings → Impact → Fix → Priority, or Quick wins / High-impact / Experiments)
  7. `## References` (a table: "Read `references/x.md` when …")
  8. `## Related skills` (directional; a real next step only)
- **Reference files:** one topic each, a table of contents if over 300 lines, one level deep. Use a **fixed rule schema** borrowed from RCD:
  ```
  ## <imperative rule title>
  **Rule.** … **Apply when.** … **Do.** … **Avoid.** … **Why / evidence.** … **Source.** [name, year](url)
  ```
  Keep each entry to 60–120 words. Name the mechanism (Hick's law, CAP theorem, Liskov, back-pressure, etc.).
- **Evidence discipline** (from recon-skills): in review outputs, separate **Observed** (in code or UI) / **Inferred** / **Recommended** / **Not checked**.
- **Style:** imperative, second person, explain *why*, few all-caps MUSTs, defaults rather than menus, no generic filler the model already knows. Apply the test "Would the agent get this wrong without this?"
- **Portability:** no `` !`cmd` ``, `$ARGUMENTS`, `context: fork`, or other Claude Code-only features in shared skills. Put those in optional `.claude/` overrides documented in AGENTS.md.
- **Evals:** each skill gets `evals/evals.json` with 3+ realistic prompts and objective assertions (e.g. "reads project-context", "output has Gotchas-driven findings", "cites WCAG 2.2 criterion"). Add a `evals/trigger-queries.json` of about 20 should/should-not queries with near-misses (e.g. "design a DB schema" is a near-miss for `software-architecture`).

### 5.5 Shared context (copy the marketingskills pattern)
- The `project-context` skill writes **`.agents/project-context.md`** and also checks `.claude/project-context.md` as a fallback. It auto-drafts from the codebase (package.json, lockfiles, framework configs, `ios/`, `android/`, design tokens, README).
- Suggested sections:
  - Product and users
  - Platforms (web / iOS / Android, minimum OS versions)
  - Stack and languages
  - Architecture style and boundaries
  - Scale targets (RPS, data volume, latency SLOs, regions)
  - Team size and deploy cadence
  - Design system (tokens, fonts, brand voice, a11y target)
  - Constraints (compliance, budget)
  - Glossary
  - Changelog (version, date, newest-first)
- Every other skill starts with the one-paragraph "check context first" block, worded identically across skills.

### 5.6 Cross-references and indexes
- The README has a generated table (`<!-- SKILLS:START/END -->`) plus an "Entry points" table and a dependency diagram (project-context → all).
- Every description ends with scope boundaries. Every body ends with `## Related skills`. The validator checks that every referenced skill name exists and every relative link resolves.
- Decide names before 1.0. If a rename happens, add a rename map to the README (Claude Code marketplace also supports a top-level `renames` object).

### 5.7 Content sourcing and licensing decisions
- **marketingskills (MIT):** it is safe to adapt the form, signup, onboarding, and paywall rules (§4.4–4.6) with a copyright notice in THIRD_PARTY_NOTICES. Rewrite them in our voice, scoped to product UX.
- **anthropics frontend-design / skill-creator (Apache-2.0):** adapt with attribution and a NOTICE. The frontend-design "AI tells" list and microcopy rules are excellent for `web-design`.
- **revenue-centric-design (custom source-available license):** its terms require attribution, carrying a no-gambling/casino restriction, and including the license in full in any derivative. **Recommendation:** do not copy its text into our MIT/Apache repo. Options:
  - (a) Link to it as a recommended companion skill (`npx skills add heliocosta-dev/revenue-centric-design`).
  - (b) Write our own rules grounded in the primary public sources it cites (Hick/Fitts, Schwartz awareness levels, Ariely's decoy, the peak-end rule, Baymard abandonment data, HubSpot form data, Core Web Vitals studies), and cite those directly.
  - (c) If any distilled text is kept, put it in an isolated folder that carries its LICENSE and attribution.

  Get a human decision on this.
- **Ethics guardrail** for all design and conversion content: add a `## Ethical boundaries` gotcha block listing banned dark patterns:
  - confirmshaming
  - hidden or drip pricing
  - hard-to-cancel flows
  - fake scarcity or countdowns
  - pre-ticked consent
  - nagging without a real "no"
  - compulsive-use / engagement-trap mechanics

  Reference the platform and legal rules (FTC negative-option rule, EU DSA Art. 25, Apple App Review 3.1.2/5.1.1, Google Play subscription policy).

### 5.8 Versioning and release (copy the marketingskills scheme)
- Repo `x.y.z`: x = restructure or breaking change, y = new skill, z = content updates. It is mirrored in `marketplace.json` `metadata.version` and in any plugin.json or extension manifests.
- Per-skill `metadata.version` is bumped on any shipped change. `CHANGELOG.md` gets one entry per release, using Conventional Commits.
- CI:
  - `skills-ref validate` for each skill
  - our validator (sections, lines ≤ 500, description length and characters, links, related names, no Claude-only syntax)
  - `claude plugin validate . --strict`, if the CLI is available in CI
  - a sync check that README and manifests are up to date

### 5.9 Install section for our README (template)
```bash
# Any agent (Claude Code, Codex, Cursor, Gemini CLI, Copilot, OpenCode…)
npx skills add <org>/how-to-build-software
npx skills add <org>/how-to-build-software --skill web-design --skill mobile-design
npx skills add <org>/how-to-build-software -a claude-code      # when run from inside an agent

# Claude Code plugin marketplace
/plugin marketplace add <org>/how-to-build-software
/plugin install engineering@how-to-build-software

# Manual
git clone https://github.com/<org>/how-to-build-software && cp -r how-to-build-software/skills/* .agents/skills/
```
