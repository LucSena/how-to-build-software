# AGENTS.md — what to put in it, what to leave out

`AGENTS.md` (agents.md) is "a simple, open format for guiding coding agents": a README written for agents, in a predictable place. ThoughtWorks Technology Radar Vol. 33 (Nov 2025) placed AGENTS.md in *Trial* and "curated shared instructions for software teams" in *Adopt*. Vol. 34 (Apr 2026) did not repeat the AGENTS.md blip and put "context engineering" in *Adopt*. The file is only as useful as it is **short, exact, and current**. An agent follows a stale command just as faithfully as a correct one.

## Contents
1. Where it lives
2. What to include
3. What to leave out
4. Monorepos
5. Keeping it current
6. Rules catalog

## 1. Where it lives

- `AGENTS.md` at the repo root is the canonical file.
- Tools that read another filename (for example `CLAUDE.md`) get a **symlink** to `AGENTS.md`, not a copy. Two copies drift apart within weeks. This repository does exactly that.
- Product and design facts (users, scale, platforms, brand) belong in `.agents/project-context.md` (see `project-context`). AGENTS.md holds *how to work in this repo*, and links to the context file.

## 2. What to include

In this order, highest value first:

1. **Purpose and map** (≤ 10 lines): what the repo is, the top-level folders and what goes where, and the architecture style in one sentence.
2. **Exact commands**, copy-pasteable: setup, dev, test (all tests, and **one test by name**), lint, typecheck, build, `check`, migrate, seed. The agents.md sample includes the single-test command for a reason: agents run it after every edit.
3. **Conventions a linter cannot enforce**: where a new feature goes, the error-handling pattern, the logging pattern, how to add an env var (schema + `.env.example` + docs), how to add a migration, naming rules for services and files.
4. **Boundaries**: what never to touch (generated code, vendored folders, lockfiles by hand), and what requires human approval (new dependencies, migrations on production data, public API changes, CI workflow changes, deleting data).
5. **Definition of Done** and PR/commit conventions: "`check` must pass", "add or update tests for the code you change", Conventional Commits in PR titles.
6. **Pointers**: ADR folder, design docs, project context, deeper docs. Link to them; do not paste them.

Real-world pattern: zhanymkanov/fastapi-best-practices ships an AGENTS.md "machine-readable companion" with a **minimum-versions compatibility matrix**, Do/Don't blocks, and an anti-pattern table. A versions table stops agents from writing code for APIs older than the ones the project uses.

## 3. What to leave out

| Leave out | Because |
|---|---|
| Generic advice ("write clean code", "follow best practices") | It changes nothing about agent behavior and costs context on every task |
| Rules a formatter or linter already enforces | The tool enforces them; restating them invites contradictions when configs change |
| Long architecture essays | Link to ADRs and design docs instead |
| Secrets, internal hostnames, customer names | The file is committed and often read by third-party tools |
| Aspirations ("we plan to migrate to X") | Agents treat them as current; put plans in ADRs with a status |
| Duplicated README content | Link to the README section |

Size heuristic: under ~150 lines. If it grows past that, move detail into linked docs, or into per-package files in a monorepo.

## 4. Monorepos

- The root file holds repo-wide rules: toolchain, task runner (`turbo run …`, `nx …`), dependency direction (`apps → packages`), commit conventions, and the approval list.
- Each app or package with its own commands or conventions gets a short `AGENTS.md` next to its manifest: how to run its tests alone, its framework's quirks, and its owner.
- Tools differ in how they combine nested files. Write each nested file so it is correct when read on its own, and never contradict the root file. Say "in addition to the root rules" rather than restating them.

## 5. Keeping it current

- Update AGENTS.md in the **same PR** that changes a command, a folder convention, or a boundary. Put it in the Definition of Done.
- Test it: in a fresh clone or container, follow only AGENTS.md + README and reach a passing `check`. Fix every step that needed tribal knowledge.
- When an agent repeats the same mistake twice, add one line that prevents it. When a line no longer prevents anything, delete it.

## 6. Rules catalog

### Give agents the single-test command
**Rule.** List the exact command to run one test file and one test by name, not just "run the tests".
**Apply when.** Writing the commands section.
**Do / Avoid.** Do: `pnpm vitest run src/billing/invoice.test.ts -t "prorates seats"`. Avoid: only `pnpm test` in a repo whose suite takes eight minutes.
**Why.** Agents iterate in tight loops. A full suite on every edit is slow enough that they skip verification or time out.

### State what needs human approval
**Rule.** List the actions an agent must not take without asking: adding dependencies, destructive migrations, CI workflow changes, public API changes, deleting data.
**Apply when.** Any repo where agents can open PRs or run commands.
**Do / Avoid.** Do: "Ask before adding a runtime dependency; justify it with the dependency-management checklist." Avoid: silence, which agents read as permission.
**Why.** One-way doors need a human decision, and the file is the only place an agent reliably looks before acting.

### One file, symlinked, never copied
**Rule.** Keep instructions in `AGENTS.md` and symlink tool-specific names to it.
**Apply when.** A tool expects `CLAUDE.md` or another filename.
**Do / Avoid.** Do: `ln -s AGENTS.md CLAUDE.md`. Avoid: separate files maintained by hand for each tool.
**Why.** Copies drift, and agents then follow whichever stale copy their tool reads.

## Sources

- AGENTS.md (openai/agents.md README and site): https://agents.md · https://github.com/openai/agents.md
- ThoughtWorks Technology Radar Vol. 33 (Nov 2025): https://www.thoughtworks.com/radar
- FastAPI Best Practices, AGENTS.md: https://github.com/zhanymkanov/fastapi-best-practices/blob/master/AGENTS.md
- Microsoft Code-With Engineering Playbook, Developer Experience (onboarding, F5 contract): https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/developer-experience
