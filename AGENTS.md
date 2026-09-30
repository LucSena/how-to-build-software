# AGENTS.md

Guidance for AI agents (and humans) contributing to this repository. `CLAUDE.md` is a symlink to this file.

## What this repo is

A collection of Agent Skills (`skills/<name>/SKILL.md`) about software architecture, clean code, scalability, and 2026 web and mobile design. The skills are the product; everything else supports them.

## Rules

1. **Follow [STYLE.md](STYLE.md).** It is the contract for frontmatter, required sections, reference files, voice, and evals.
2. **Keep skills flat.** `skills/<name>/` only. Categories go in `metadata.category`.
3. **Only spec keys at the top of frontmatter.** Custom fields go under `metadata` as strings.
4. **Portable skills only.** No agent-specific syntax (`` !`cmd` ``, `$ARGUMENTS`, `context: fork`) inside `SKILL.md`.
5. **Accuracy over completeness.** Do not add figures, API names, or version numbers you cannot source. Label date-sensitive facts "as of YYYY-MM".
6. **Write in your own words.** Ideas from permissive sources are fine with credit in `CREDITS.md`; do not copy text from sources with restrictive licenses.
7. **Bump versions.** Any shipped change bumps the skill's `metadata.version`; releases bump `VERSION` and get a `CHANGELOG.md` entry.

## Before committing

```bash
python3 scripts/validate_skills.py --strict   # must pass
python3 scripts/sync.py                        # regenerate README index + marketplace.json
```

## Adding a skill

1. Check the router table in `skills/how-to-build-software/SKILL.md` — does an existing skill already cover it? Prefer a new `references/` file in an existing skill over a near-duplicate skill.
2. Copy `template/` to `skills/<name>/`, write `SKILL.md`, references, and `evals/evals.json`.
3. Add the skill to the router's routing table and to `related` of the skills that should point to it.
4. Validate, sync, and add a `CHANGELOG.md` entry.

## Commits

Conventional Commits: `feat(skill-name): …`, `fix(skill-name): …`, `docs: …`, `chore: …`.
