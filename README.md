# How to Build Software

**Agent Skills for building software that is well-architected, clean, scalable, and designed to 2026 standards — on the web, iOS, and Android.**

One place for the rules you keep pasting into your agent: architecture and design patterns, clean code, scalability and reliability, product design that doesn't look AI-generated, and native mobile design for iOS 26–27 (Liquid Glass) and Android 16–17 (Material 3 Expressive). The skills consolidate and verify guidance from the best existing skill collections, design references, and engineering literature. [Credits](CREDITS.md) lists every source.

Skills follow the open [Agent Skills](https://agentskills.io/specification) format. They work in Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, and any agent that reads `SKILL.md`.

## Install

```bash
# Any agent — interactive picker
npx skills add LucSena/how-to-build-software

# Only some skills
npx skills add LucSena/how-to-build-software --skill design-taste --skill ios-design

# Running from inside an agent session? Name the agent explicitly
npx skills add LucSena/how-to-build-software -a claude-code
```

**Claude Code plugin marketplace**

```text
/plugin marketplace add LucSena/how-to-build-software
/plugin install how-to-build-software@how-to-build-software   # everything
/plugin install engineering-skills@how-to-build-software      # or one domain
/plugin install design-skills@how-to-build-software
/plugin install mobile-skills@how-to-build-software
```

**Manual**

```bash
git clone https://github.com/LucSena/how-to-build-software
cp -r how-to-build-software/skills/* ~/.claude/skills/     # Claude Code (user scope)
cp -r how-to-build-software/skills/* .agents/skills/       # most other agents (project scope)
```

## How it works

```
                 ┌────────────────────────┐
                 │  how-to-build-software  │  router: picks skills, sets the quality bar
                 └───────────┬────────────┘
                             │ reads
                 ┌───────────▼────────────┐
                 │    project-context     │  writes .agents/project-context.md once
                 └───────────┬────────────┘
         ┌───────────────────┼────────────────────┐
   Engineering            Design                Mobile
   architecture           taste · foundations   mobile-design
   patterns · clean code  systems · UX · motion ios-design · android-design
   scale · reliability    a11y · web · review   mobile-architecture
```

1. **Start with `how-to-build-software`.** It routes the request to the 2–5 skills that apply, in decision order: product → architecture → design → implementation → review.
2. **Capture context once with `project-context`.** Every skill reads `.agents/project-context.md` first, so you stop answering the same questions.
3. **Each skill is short and procedural.** `SKILL.md` holds the defaults, decision tables, and gotchas; deep material lives in `references/` and loads only when needed.
4. **Two exit gates:** `code-review` for engineering, `design-review` for UI.

## Skills

<!-- SKILLS:START -->
<!-- SKILLS:END -->

## Principles behind the collection

- **Signal over coverage.** Every line passes the test "would the agent get this wrong without it?" Generic advice is cut; defaults, thresholds, and gotchas stay.
- **Defaults, not menus.** Each skill picks a default and names the trigger for the alternative.
- **Boring by default.** Modular monolith, managed Postgres, platform conventions, system components. Heavier options need a stated reason.
- **Taste is a process, not a vibe.** Ground the design in the subject, plan tokens, compare against the generic default, spend boldness in one place, critique.
- **Platform-true mobile.** Liquid Glass (iOS 26+) and Material 3 Expressive are used as designed, not imitated on the wrong platform.
- **Ethics floor.** No dark patterns, fabricated data, or fake social proof — ever.
- **Dated and sourced.** Anything that ages (library versions, trendy fonts, Baseline status) is labeled with its date, and every reference file lists its sources.

## Repository layout

```
skills/<name>/SKILL.md          the skill (≤ 500 lines)
skills/<name>/references/*.md   deep material, loaded on demand
skills/<name>/evals/evals.json   test prompts with objective expectations
template/SKILL.md               starting point for new skills
scripts/validate_skills.py      spec + style contract validator
scripts/sync.py                 regenerates this README's index and the plugin manifest
STYLE.md                        the skill contract
```

## Contributing

Read [STYLE.md](STYLE.md) and [AGENTS.md](AGENTS.md), copy `template/`, then run:

```bash
python3 scripts/validate_skills.py
python3 scripts/sync.py
```

## License

[MIT](LICENSE). Adapted ideas are credited in [CREDITS.md](CREDITS.md).
