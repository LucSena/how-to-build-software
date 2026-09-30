# Skill Style Contract

Every skill in this repository follows the same contract so agents can load, route, and trust them consistently. `scripts/validate_skills.py` enforces the mechanical parts; reviewers enforce the rest.

The one test that governs every sentence: **"Would the agent get this wrong without this instruction?"** If not, cut it. Generic advice ("follow best practices", "write clean code") is noise. Concrete defaults, thresholds, decision tables, and gotchas are signal.

## Layout

```
skills/<name>/
├── SKILL.md            # required — the procedure and the defaults (≤ 500 lines, target 150–350)
├── references/         # optional — deep material loaded on demand (one topic per file)
│   └── <topic>.md
├── scripts/            # optional — deterministic helpers (self-contained, documented)
├── assets/             # optional — templates, examples
└── evals/evals.json    # required — 3+ realistic prompts with objective assertions
```

Skills stay flat under `skills/`. Categories live in `metadata.category`, the README, and the plugin groupings — never as folders.

## Frontmatter

Only spec keys at the top level (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`). Everything else goes under `metadata` as string values.

```yaml
---
name: kebab-case-name            # 1–64 chars, a-z 0-9 -, matches folder name
description: Use when ... Covers ... Also use when the user says "...". Not for ...; use other-skill.
license: MIT
metadata:
  version: "1.0.0"
  category: engineering          # meta | engineering | design | mobile
  related: "skill-a skill-b"     # space-separated skill names that exist in this repo
---
```

**Description formula** (≤ 1024 chars, no `<` or `>`, key use case in the first ~200 chars):

1. `Use when …` — the user intent, phrased the way users actually talk.
2. What it covers — the concrete sub-topics (these are the keywords routing depends on).
3. Casual triggers — "even if the user only says 'make it look better' / 'this is slow'".
4. Scope boundary — "For X use `other-skill`."

Descriptions should be slightly pushy: agents under-trigger skills far more often than they over-trigger.

## SKILL.md body — required sections, in order

```markdown
# Title

One short paragraph: the stance this skill takes and the outcome it protects.

## Before you start
(The shared context block — copy verbatim, see below.)

## Core principles
Numbered, ordered by impact. Each principle is one bold imperative line plus one line of *why*.

## Workflow
A `- [ ]` checklist of steps with validation gates (do → check → fix → repeat).

## <Domain sections>
The actual rules: defaults, numbers, decision tables. Prefer "Default: X. Use Y only when Z." over menus.

## Gotchas
The mistakes an agent will make without this skill. Highest-value section. Be specific.

## Output format
The exact shape of what the skill produces (a review, a plan, a file, a diff summary).

## References
| File | Read when |
|---|---|
| `references/x.md` | a specific trigger, not "for more details" |

## Related skills
- `skill-name` — when to go there next (only real next steps).
```

`## References` may be omitted when a skill has no reference files.

### Shared context block (verbatim)

```markdown
## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.
```

## Reference files

- One topic per file, one level deep (`references/x.md`, never `references/a/b.md`).
- ≤ 400 lines; add a table of contents when over 300.
- Rule catalogs use this entry shape (60–120 words each):

```markdown
### <Imperative rule title>
**Rule.** What to do, stated once.
**Apply when.** The trigger condition.
**Do / Avoid.** Concrete example of each.
**Why.** The mechanism (name it: Hick's law, Little's law, Liskov, back-pressure …).
```

- Value tables (type scales, durations, latency numbers) are fine as plain tables.
- End each reference file with a `## Sources` list of the primary sources used.

## Voice

- Imperative, second person, present tense. Short paragraphs.
- Explain *why* instead of shouting. Reserve **MUST/NEVER** for things that break accessibility, security, data integrity, or platform review.
- Give a default, then name the alternative and its trigger. Don't present five equal options.
- Tool-neutral where it matters: name libraries as examples, and pass the swap test — the rule should still read fairly if the tool were swapped for a competitor.
- In reviews, separate **Observed** (seen in code/UI) from **Inferred** (likely) from **Not checked**.
- No Claude-Code-only syntax in skills (`` !`cmd` ``, `$ARGUMENTS`, `context: fork`) — they must work in any agent.

## Ethics floor

Design and conversion skills never recommend dark patterns: confirmshaming, hidden or drip pricing, obstructed cancellation, fake scarcity or countdowns, pre-ticked consent, nagging without a real "no", or engagement traps that work against the user's own goals. Persuasion means removing friction and uncertainty from something the user already wants.

## Evals

`evals/evals.json`:

```json
{
  "skill_name": "name",
  "evals": [
    {
      "id": 1,
      "prompt": "A realistic user request",
      "expected_output": "What a good result looks like",
      "files": [],
      "expectations": ["Objective, checkable assertion", "..."]
    }
  ]
}
```

At least 3 evals per skill; at least one should be a near-miss that tests the skill's boundary.

## Versioning

- Per skill: `metadata.version` — bump on every shipped change.
- Repository: `x.y.z` — x = restructure/breaking, y = new skill, z = content updates. Recorded in `CHANGELOG.md` and the marketplace manifest.
