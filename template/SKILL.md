---
name: skill-name
description: Use when the user wants to ... Covers ..., ..., and .... Also use when the user says "..." or "...". Not for ...; use other-skill.
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "project-context"
---

# Skill Title

One short paragraph: the stance this skill takes and the outcome it protects.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Imperative principle.** One line on why it matters.
2. **Imperative principle.** One line on why it matters.

## Workflow

- [ ] Step one — and how to verify it.
- [ ] Step two — and how to verify it.
- [ ] Validate: re-check against Gotchas; fix and repeat until clean.

## Domain section

Default: X. Use Y only when Z.

| Situation | Default | Why |
|---|---|---|
| ... | ... | ... |

## Gotchas

- The specific mistake an agent will make here, and the correction.

## Output format

The exact shape of the result.

## References

| File | Read when |
|---|---|
| `references/topic.md` | a specific trigger |

## Related skills

- `project-context` — when the project has no context file yet.
