# Repository conventions — branching, PRs, ownership, commits, versions

Conventions that stop a repo from rotting once more than one person or agent works in it. Set them once, write them in CONTRIBUTING.md or AGENTS.md, and enforce them with settings rather than reminders.

## Contents
1. Trunk-based development
2. Pull requests: size, shape, template
3. Branch protection and merge strategy
4. CODEOWNERS
5. Conventional Commits
6. Versioning: SemVer, CalVer, deploy IDs
7. Changelogs and release automation
8. Definition of Done (team version)
9. Rules catalog

## 1. Trunk-based development

DORA's trunk-based development capability, based on State of DevOps data, found higher delivery and operational performance in teams that:

- have **three or fewer active branches** in the repository,
- **merge branches to trunk at least once a day**,
- have **no code freezes and no integration phases**.

Branches "typically last no more than a few hours". DORA's listed pitfalls: heavyweight multi-approver review, asynchronous review that leaves PRs waiting, and not running tests before committing. Its listed fixes: small batches, prompt review, comprehensive automated tests, and branch protection that requires passing tests.

How to keep branches short:

| Situation | Technique |
|---|---|
| Feature takes a week | Merge daily behind a feature flag that defaults to off; delete the flag after launch |
| Replacing an implementation | Branch by abstraction: add an interface, build the new version behind it, switch it on with a flag, delete the old one |
| Schema change | Expand/contract across several PRs: add, dual-write, backfill, switch reads, remove |
| Risky refactor | A separate PR with no behavior change that lands before the feature PR |

**Gitflow** (a long-lived `develop` branch, plus release and hotfix branches) exists for software that ships and supports several versions on a schedule. For continuously deployed services, trunk-based development plus flags is the evidence-backed default. Mobile apps still use trunk-based development for code, and cut short-lived release branches for store submissions.

## 2. Pull requests: size, shape, template

Google's code review guide ("Small CLs"):

- "The right size for a CL is **one self-contained change**." It includes its related tests and leaves the system working.
- "100 lines is usually a reasonable size for a CL, and 1000 lines is usually too large." 200 lines spread over 50 files is usually too large too.
- Reviewers may reject a change solely for being too large. "Reviewers rarely complain about getting CLs that are too small."
- Exceptions: whole-file deletions and trusted automated refactors.

Ways to split (Google; MS playbook): stack small PRs, split by layer (schema → backend → UI), split by feature slice, separate refactors from behavior changes, and hide unfinished work behind flags.

`.github/pull_request_template.md`:

```markdown
## What and why
<!-- One or two sentences. Link the issue. -->

## How to verify
<!-- Commands run, screenshots for UI, test names. -->

## Checklist
- [ ] `check` passes locally
- [ ] Tests added/updated (regression test for bug fixes)
- [ ] New env vars added to schema + .env.example + docs
- [ ] Migrations reversible or expand/contract
- [ ] Docs / ADR / CHANGELOG updated if behavior or a decision changed
```

## 3. Branch protection and merge strategy

Settings for `main` (GitHub terms; GitLab and others have equivalents):

| Setting | Solo | Team |
|---|---|---|
| Require a pull request before merging | Yes (agents too) | Yes |
| Required status checks (`check`, secret scan) | Yes | Yes |
| Require branch up to date / merge queue | Optional | Merge queue once PRs routinely conflict |
| Required approvals | 0 | ≥ 1; code-owner review for owned paths |
| Block force pushes and deletion | Yes | Yes |
| Dismiss stale approvals on new commits | — | Yes for sensitive paths |

Merge strategy default: **squash merge**. One commit per PR, with the PR title (in Conventional Commits form) as the commit message, gives a linear, revertible history. Use rebase-merge only when a team deliberately curates individual commits (thoughtbot's git guide describes that workflow). Avoid merge commits on trunk in small repos, because they add noise without adding information.

## 4. CODEOWNERS

`CODEOWNERS` requests reviews automatically by path. Combined with branch protection that requires code-owner review, it makes ownership enforceable.

```text
# .github/CODEOWNERS — last matching rule wins
*                         @acme/platform
/apps/web/                @acme/web
/apps/api/src/billing/    @acme/billing
/packages/db/             @acme/data
/.github/workflows/       @acme/platform
/docs/adr/                @acme/architects
```

Rules: own by **team**, not by individual (people leave). Every top-level module has exactly one owning team. Protect CI workflow files with an owner, because a workflow change can exfiltrate secrets. Add CODEOWNERS when a second team appears or around five regular contributors. Before that it is noise.

## 5. Conventional Commits

Format (Conventional Commits 1.0.0):

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

| Type | Means | Version effect |
|---|---|---|
| `feat` | New capability | MINOR |
| `fix` | Bug fix | PATCH |
| `feat!` / `fix!` or footer `BREAKING CHANGE: …` | Incompatible change | MAJOR |
| `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test` | Other (Angular convention, commitlint config-conventional) | None by default |

Scope names a module or package: `feat(billing): prorate seat changes`. The spec does not fix the description's style. The common Angular-derived habit is imperative mood, lowercase, and no trailing period; pick one style and lint for it. With squash merges, enforce the convention on **PR titles** (a title linter in CI) instead of on every WIP commit.

## 6. Versioning: SemVer, CalVer, deploy IDs

**SemVer 2.0.0** applies to anything others depend on through a declared public API: libraries, SDKs, CLIs, public HTTP APIs, and published packages.

- MAJOR for incompatible API changes, MINOR for backward-compatible features, PATCH for backward-compatible fixes.
- A released version is immutable: fix it with a new version, never by re-publishing the same one.
- `0.y.z` is initial development, where "anything MAY change at any time". Go to `1.0.0` once people depend on it in production.
- Pre-release `1.4.0-rc.1`; build metadata `+sha.abc123` does not affect precedence.
- Hyrum's law: with enough users, every observable behavior is depended on by somebody. SemVer states intent and does not guarantee compatibility, so consumers still pin versions and test upgrades.

**CalVer** (calver.org) uses date-based versions, for example `YYYY.MM.MICRO` or Ubuntu-style `YY.MM`. It suits products released on a cadence where "breaking" is ill-defined, such as platforms, distributions, and apps.

**Deployed services** have no consumers of a version number. Identify each build by git SHA (image tag and OCI revision label) and expose it at `/version` or in health output, error-tracking releases, and logs.

**Mobile apps** need store-facing version strings and monotonically increasing build numbers. Derive the build number from CI.

**Monorepos** that publish packages version each package independently. Tools such as Changesets (JS) record intended bumps in the PR. Unpublished internal packages use the workspace protocol and no version.

## 7. Changelogs and release automation

Keep a Changelog 1.1.0: changelogs are **for humans**. Every version gets an entry, the latest version comes first, dates use ISO format, and versions are linkable. Keep an `Unreleased` section at the top and move it into a version at release time.

```markdown
# Changelog

## [Unreleased]
### Added
- Export invoices as CSV (#231)

## [1.4.0] - 2026-09-12
### Changed
- Invoice numbers are now per-organization sequences (#219)
### Deprecated
- `GET /v1/invoices?page=` — use cursor pagination; removal in 2.0 (#220)
### Fixed
- Timezone shift in due-date reminders (#224)
### Security
- Rotate webhook signing secrets on plan change (#226)
```

Sections: Added, Changed, Deprecated, Removed, Fixed, Security. Do not dump the git log: the log is written for maintainers, and the changelog is written for the people who upgrade.

Release automation examples: release-please or semantic-release (derive the version and changelog from Conventional Commits), and Changesets (monorepos). Always read the generated notes before publishing. Deployed apps usually need no release tool at all: every merge to `main` deploys.

## 8. Definition of Done (team version)

Adapted from the MS playbook's Definition of Done: acceptance criteria met · builds with no errors · unit tests written and passing · existing tests passing · enough diagnostics and telemetry logged · code review complete · UX review if applicable · documentation updated · merged into the default branch · product owner sign-off (where that role exists). The agent version in `SKILL.md` makes each line checkable by a command or a file.

## 9. Rules catalog

### Merge to trunk at least daily
**Rule.** No branch lives longer than a working day or two. Unfinished work merges behind a flag that defaults to off.
**Apply when.** Any change expected to take more than a day.
**Do / Avoid.** Do: `if (flags.newInvoiceEditor)` around the new route, merged daily. Avoid: `feature/invoice-editor` open for three weeks.
**Why.** DORA links ≤ 3 active branches and daily merges to higher delivery performance. Integration pain grows with branch age, because conflicts and semantic drift compound.

### Reject oversized PRs by default
**Rule.** Split a PR over a few hundred changed lines (excluding lockfiles and generated code) unless it is a deletion or a mechanical refactor.
**Apply when.** Opening or reviewing a PR, including agent-generated ones.
**Do / Avoid.** Do: three stacked PRs (schema, API, UI). Avoid: a 2,000-line "add billing" PR.
**Why.** Google: ~100 lines is reasonable and ~1,000 is usually too large. Large diffs get skimmed, not reviewed, and are hard to revert.

### Own code by team, not by person
**Rule.** CODEOWNERS entries name teams, and each top-level module has exactly one owner.
**Apply when.** A second team appears or contributors exceed a handful.
**Do / Avoid.** Do: `/apps/api/src/billing/ @acme/billing`. Avoid: `* @alice`.
**Why.** Individual ownership turns vacations and departures into review outages, and unowned code decays because nobody feels responsible for it.

## Sources

- DORA, Trunk-based development: https://dora.dev/capabilities/trunk-based-development/
- DORA, Working in small batches: https://dora.dev/capabilities/working-in-small-batches/
- Google Engineering Practices, Small CLs: https://google.github.io/eng-practices/review/developer/small-cls.html
- Microsoft Code-With Engineering Playbook — branching and CI/CD, pull requests, merge strategies, component versioning, definition of done: https://github.com/microsoft/code-with-engineering-playbook
- thoughtbot git guide: https://github.com/thoughtbot/guides/tree/main/git
- Conventional Commits 1.0.0: https://www.conventionalcommits.org/en/v1.0.0/
- Semantic Versioning 2.0.0: https://semver.org
- CalVer: https://calver.org
- Keep a Changelog 1.1.0: https://keepachangelog.com/en/1.1.0/
- Hyrum's law (via hacker-laws): https://github.com/dwmkerr/hacker-laws#hyrums-law-the-law-of-implicit-interfaces
- GitHub docs, About code owners: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
