---
name: dependency-management
description: Use when adding, choosing, auditing, updating, or removing a package or library, or before running npm/pnpm/yarn/bun/pip/uv/go/cargo install. Covers standard-library-first, a should-I-add-this checklist with hard stops, buy/borrow/build defaults, native replacements for common npm packages, verifying a package really exists (typosquatting, AI-hallucinated names), wrapping third-party code, lockfiles and pinning for apps vs libraries, updates with release-age cooldowns (npm, pnpm, Yarn, Bun, pip, Renovate, Dependabot), install-script risk, provenance, SBOMs, licenses (MIT, Apache, GPL, AGPL, source-available), dependency budgets, bundle cost, and supply-chain incidents from left-pad to the 2026 axios compromise. Also use when the user says "is there a library for this?", "just npm install X", "update all deps", "why is node_modules so big?", or "is this package safe?". Not for choosing a framework, database, or hosted vendor (use tech-stack-selection) or app-wide security (use application-security).
license: MIT
metadata:
  version: "1.0.1"
  category: engineering
  related: "application-security lessons-from-failures tech-stack-selection deployment-and-infrastructure code-review web-platform"
---

# Dependency Management

A dependency is code you now own but did not write, maintained by people you don't know, and reachable by attackers through their accounts. Russ Cox put it plainly: adding one outsources design, testing, debugging, and maintenance to strangers on the internet. Rob Pike's proverb gives the default: a little copying is better than a little dependency. This skill makes you reach for the platform and a few tested lines first, borrow mature libraries for genuinely hard problems, verify every package before it touches the machine, and keep what you install reproducible, current, and contained.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

Also read the manifest, the lockfile, the package-manager config (`.npmrc`, `pnpm-workspace.yaml`, `.yarnrc.yml`, `bunfig.toml`, `pip.conf`/`uv.toml`), and any dependency policy (`docs/dependencies.md`, an ADR, `DEPENDENCY_POLICY.md`).

## Core principles

1. **Climb the ladder and say where you stopped:** existing code → installed dependency → platform API → a few tested lines → a new package. Most needs stop before the last rung.
2. **Zero dependencies for trivial problems, mature libraries for hard ones.** Avoiding packages never justifies hand-rolled crypto, auth, sanitizers, or standard-format parsers (OpenSSF: rewritten code "will almost certainly have bugs").
3. **Verify the package exists and is the real one before installing.** In one study, about 20% of package names suggested by code-generating models did not exist; attackers register them.
4. **Ask before adding a runtime dependency** to an existing project, unless the user named that exact library. Some cases are hard stops (below).
5. **One library per job.** One HTTP client, one date library, one validation library, one test runner.
6. **Reproducible installs:** commit the lockfile, install from it read-only in CI, never ship a manifest change without its lockfile change.
7. **Cool down non-security updates; ship security fixes fast.** Most malicious releases are caught within days.
8. **Install scripts are off unless allow-listed.** Recent npm worms ran in `preinstall`/`postinstall`.
9. **Contain vendors behind narrow adapters; don't wrap frameworks.**

## Workflow

- [ ] **Need check.** Is the capability required by the task? Grep the repo for an existing helper and the manifest for an installed library that already does it.
- [ ] **Platform check.** Look up the native API (table below, full list in `references/native-replacements.md`). For web APIs, check Baseline/browser support against the project's targets.
- [ ] **Trivial check.** If it is under roughly 50 lines with no security or standards depth, write it with edge-case tests (negative numbers, empty input, Unicode, `NaN`).
- [ ] **Evaluate** a candidate with the checklist below. Record the signals you checked.
- [ ] **Verify identity** (registry + linked repo) before any install command.
- [ ] **Ask** if any hard stop applies or it is a new runtime dependency the user didn't name.
- [ ] **Install** with the project's package manager, scripts disabled, lockfile updated; build-only tools as dev dependencies.
- [ ] **Inspect the lockfile diff:** count added packages, look for install scripts, git/tarball URLs, and unexpected new transitive packages.
- [ ] **Contain** vendor SDKs behind an adapter in your own domain terms.
- [ ] **Remove** anything your change made unused, in the same PR.
- [ ] **Report** in the Output format.

## Should I add this dependency?

Default thresholds below are this skill's recommended defaults, synthesized from Russ Cox and the OpenSSF Concise Guide; they are not an industry standard. Adjust them in the project's dependency policy.

| Check | Default pass condition | How |
|---|---|---|
| Identity | Exact name in the official registry; repo link resolves and points back to the package; not a near-miss of a more popular name | Registry page, `npm view`, PyPI JSON, `go list -m` |
| Maintenance | Release or significant activity in the last 12 months; responsive issues; ideally more than one maintainer or an org behind it | Repo, registry "time" field, issue tracker |
| Stability | 1.0+ or a documented stability policy; changelog; semver discipline | Releases page |
| Security | No unfixed high/critical advisories; security policy; OpenSSF Scorecard or deps.dev reviewed | `npm audit`, `osv-scanner`, deps.dev, Scorecard |
| Footprint | Few transitive packages; tree-shakeable ESM for front-end; acceptable install and bundle size | `npm install --dry-run`, `npm ls --all`, `pnpm why`, bundlephobia, pkg-size.dev |
| Install scripts | None, or understood and needed (native builds) | `npm view <pkg> scripts`, the lockfile's install-script flags |
| License | Compatible with how you ship (table below) | Registry metadata + LICENSE file |
| Fit | Types included (TS); API makes the secure use the easy use; secure defaults | Docs, a 10-line spike in isolation |

**Hard stops — do not add without the user's explicit approval:**
- Any package whose existence and identity you could not confirm at the exact name.
- A version newer than the project's cooldown (default: 3 days), or a package created only recently (weeks) unless that is expected.
- A package with install scripts that are not already allow-listed.
- GPL/AGPL, source-available (SSPL, BUSL, Elastic), or unlicensed code in proprietary or distributed software.
- A second library for a job an installed one already does.
- Anything a failed install "suggested" as a similarly named alternative.

Full evaluation procedure, commands, and abandonment signals: `references/evaluation-checklist.md`.

## Buy, borrow, or build

| Domain | Default | Why |
|---|---|---|
| Crypto primitives, password hashing, JWT/JOSE, TLS | **Borrow**: platform crypto (WebCrypto, `node:crypto`), libsodium, argon2/bcrypt/scrypt, a maintained JOSE library | Hand-rolled crypto is the classic security failure |
| Authentication, sessions, OAuth/OIDC, passkeys | **Buy or borrow**: identity provider or the framework's maintained auth library | Standards-heavy and attack-heavy (see `auth-flows`) |
| Payments, tax, invoicing | **Buy**: payment processor SDK or hosted checkout | PCI scope, fraud, regulation |
| Email deliverability (SPF/DKIM/DMARC, bounces) | **Buy**: transactional email provider | Reputation and infrastructure, not code |
| HTML sanitizing, Markdown with untrusted input | **Borrow**: a maintained sanitizer (DOMPurify class) + framework escaping | XSS edge cases |
| Standard formats (CSV quirks, YAML, XML, time zones, URLs, semver) | **Platform or borrow**: `URL`, `Intl`, `Temporal` where supported, stdlib `csv`/`json`/`zoneinfo` | Standards have edge cases you will miss |
| Accessible UI primitives (dialog, menu, combobox) | **Borrow**: headless accessible primitives | Focus and ARIA depth |
| Error tracking, telemetry, feature flags | **Buy/borrow**: OpenTelemetry SDKs and a hosted backend until scale argues otherwise | Undifferentiated |
| Search | **Database full-text first**; borrow or buy an engine when relevance tuning or scale demands | Avoid a new service for simple needs |
| Micro-utilities (padding, parity, `sleep`, `chunk`, `uniq`, `pick`, UUID v4) | **Build or platform** | The dependency costs more than the code |
| Core domain logic (pricing rules, scheduling, your algorithms) | **Build** | It is the product; the team must own the theory of it |

Choosing a hosted vendor or framework (not a library) is `tech-stack-selection`.

## Native first (as of 2026-09)

| Instead of | Use | Notes |
|---|---|---|
| `node-fetch`, `cross-fetch`, `axios` for simple calls | global `fetch` + `AbortSignal.timeout()` | Node 18+; always set a timeout |
| `uuid` (v4) | `crypto.randomUUID()` | Node and browsers; v7 still needs a library or a few lines |
| `dotenv` | `node --env-file=.env`, `process.loadEnvFile()` | Node 20.6+ / 20.12+; `--env-file-if-exists` 22.9+ |
| `rimraf`, `mkdirp` | `fs.rm(p, { recursive: true, force: true })`, `fs.mkdir(p, { recursive: true })` | Long available |
| `glob`, `fast-glob` | `fs.glob` | Node 22+ |
| `chalk`, `colors` | `util.styleText` | Node 20+; hex colors from 26.1 |
| `minimist`, simple `yargs` | `util.parseArgs` | Node 18.3+ / 16.17+ |
| `deep-equal`, `lodash.clonedeep` | `util.isDeepStrictEqual`, `structuredClone` | — |
| `lodash` helpers | `Object.groupBy`, `toSorted`, `findLast`, `at`, `flat`, `Set` methods | Or a modern tree-shakeable utility library if many are needed |
| `nodemon`, simple `jest`/`mocha` setups | `node --watch`, `node:test` + `node:assert` | For libraries and small services |
| `moment` | `Intl.DateTimeFormat`; `Temporal` where supported; else a small date library | `Temporal` is not in every browser yet — feature-detect or polyfill |
| `requests` for trivial scripts, `python-dateutil` for zones, `toml` | `urllib.request`, `zoneinfo` (3.9+), `tomllib` (3.11+) | Keep `httpx`/`requests` for real HTTP work |
| Go routers for basic routing, `logrus`/`zap` for simple logging | `net/http` method + pattern routing (1.22+), `log/slog` (1.21+) | — |

The e18e `module-replacements` project maintains the JS mappings, and ESLint plugins built on it (`eslint-plugin-depend`, `@e18e/eslint-plugin`) flag replaceable packages automatically.

**Inlined code must be tested.** e18e's own one-line replacement for `is-odd` is `(n % 2) === 1`, which returns `false` for `-3` because `-3 % 2 === -1`. The naive fix `n % 2 !== 0` then returns `true` for `NaN` and `1.5`. Write `Number.isInteger(n) && n % 2 !== 0` and the edge-case test that proves it.

## Verifying a package is real

Agents are the main source of hallucinated package names, and "slopsquatting" means attackers pre-register them. Spracklen et al. (USENIX Security 2025) found 19.7% of 2.23 million generated package references pointed at packages that did not exist (5.2% for the commercial models tested, 21.7% for open-source ones). Before any install:

1. Get the name from an authoritative source: the project's official docs or repository README, not memory.
2. Query the registry: `npm view <name> name repository.url time.created maintainers dist-tags`, `https://pypi.org/pypi/<name>/json`, `go list -m -versions <module>`. Check that the repo URL matches, the creation date is not suspiciously recent, and downloads are plausible.
3. If the name is close to a more popular package (`crossenv` vs `cross-env`, case variants, extra hyphens), stop and ask.
4. If the registry says it doesn't exist, **tell the user**. Never install a similarly named substitute.
5. Install with scripts disabled and read the lockfile diff.

## Wrapping third-party code

| Wrap (adapter in your domain terms) | Don't wrap |
|---|---|
| SaaS SDKs: payments, email/SMS, LLM providers, analytics, storage, search, flags | Frameworks you build *in* (React, Rails, Django, Spring, SwiftUI, Compose) |
| Libraries with churny APIs used across many call sites (date, HTTP with auth/retry policy) | Language-level utilities and the standard library |
| Anything you must fake in tests or may swap | A library used in exactly one place — that call site already is the adapter |

A good adapter: your types in and out, vendor errors translated into your error taxonomy, timeouts/retries/idempotency keys set once, config injected, one integration test against the sandbox plus a fake that passes the same contract test. **Narrow** the interface; a 1:1 mirror of the vendor API is a shallow module. An adapter does not make migration free: document behavioral assumptions (ordering, consistency, rate limits) in its interface comment.

## Lockfiles, ranges, reproducible installs

| Concern | Application / service | Library (published) |
|---|---|---|
| Lockfile | Commit it; deploy from it | Commit it for local dev; it is not published to consumers |
| Runtime dependency ranges | Exact pins or lockfile-controlled | Ranges (`^x.y.z`) so consumers can dedupe and patch |
| Dev dependencies | Pinned | Pinned |
| CI install | Read-only: `npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`, `bun install --frozen-lockfile`, `uv sync --locked`, `pip install --require-hashes -r requirements.txt` | Same, plus (OpenSSF npm guide) a job that ignores the lockfile to test the latest versions in your range, with least-privilege CI |
| Standalone CLI | May publish `npm-shrinkwrap.json` and take responsibility for the whole tree | — |

Never run `npm install`, `npm update`, or `npx <unpinned>` in CI; they don't treat the lockfile as read-only. Go's `go.sum` and minimal version selection give reproducibility without a separate lockfile. Details and other ecosystems: `references/update-policy.md`.

## Updates and cooldowns

- **Automate** with Renovate or Dependabot; group related updates (`@types/*`, a monorepo's packages, lint tooling); weekly schedule for non-security updates.
- **Cooldown 3–7 days** for non-security updates. OpenSSF suggests about 3 days; William Woodruff's analysis found 8 of 10 prominent supply-chain attacks had windows under a week.
- **Security fixes skip the queue** — exclude that package from the cooldown, after checking the fix release's provenance and changelog.
- **Automerge** only patch/minor dev-dependency updates with green CI. Majors get human review with changelog notes.
- **Policy:** no dependency more than one major version behind; old versions make urgent security upgrades hard.

Config reference (as of 2026-09; verify against current docs): npm `min-release-age` (days, npm 11.10+); pnpm `minimumReleaseAge` (minutes, 10.16+; reported to default to 1 day in pnpm 11); Yarn `npmMinimalAgeGate` (4.10+); Bun `minimumReleaseAge` (seconds, 1.3+); Dependabot `cooldown`; Renovate `minimumReleaseAge` or the `security:minimumReleaseAgeNpm` preset (3 days). Snippets and pip/uv options: `references/update-policy.md`.

## Install scripts and CI hygiene

- npm: `ignore-scripts=true` in `.npmrc` (then run needed scripts explicitly). pnpm 10+ blocks dependency build scripts by default; allow-list with `allowBuilds` and fail on unreviewed ones with `strictDepBuilds: true`. Bun runs only `trustedDependencies` scripts.
- Allow-list only known native-build packages (esbuild, sharp, and similar) and only with the user's approval.
- Pin GitHub Actions and other CI actions to a full commit SHA with a version comment; set `permissions:` to least privilege; give secrets only to steps that need them.
- Self-host third-party browser scripts or pin them with Subresource Integrity.
- Run installs of unfamiliar packages in a container or devcontainer without access to `~/.ssh`, cloud credentials, or `.env` files. The Nx "s1ngularity" payload (2025) went looking for local AI coding CLIs to help it hunt for secrets.

Provenance, trusted publishing, SBOMs, and reference configs: `references/supply-chain.md`.

## Licenses (not legal advice)

| Family | Examples | Default |
|---|---|---|
| Permissive | MIT, BSD-2/3, ISC, Apache-2.0 | OK; keep notices (and Apache NOTICE files) |
| Weak copyleft | MPL-2.0, LGPL | OK with care; ask before static linking or bundling into proprietary mobile apps |
| Strong copyleft | GPL-2.0, GPL-3.0 | Ask before adding to proprietary distributed software |
| Network copyleft | AGPL-3.0 | Ask; triggered by users interacting over a network, and many companies ban it |
| Source-available | SSPL, BUSL, Elastic License, Commons Clause | Ask; usage restrictions apply |
| No license | Repo without a LICENSE | Don't copy or depend: all rights reserved by default |

Copied snippets carry their license too: keep the notice. Details and tooling: `references/licenses.md`.

## Dependency budget

Write a short policy (in `docs/dependencies.md` or an ADR; Envoy's `DEPENDENCY_POLICY.md` is a public example) covering: allowed licenses, cooldown days, who approves new runtime dependencies, the one-library-per-job list, the install-script allow-list, and front-end bundle budgets per route (enforced with `size-limit` or bundler budgets).

Suggested defaults (proposals, tune per project): flag in review any single addition that brings more than about 10 transitive packages or any install script; libraries aim for zero runtime dependencies and peer-depend on frameworks; track direct runtime deps, total packages, and packages with install scripts over time, and alert on step increases in the lockfile diff.

## What incidents teach

| Incident | What happened | Defense it teaches |
|---|---|---|
| left-pad (2016) | An 11-line package was unpublished; builds broke worldwide | Inline trivial code; lockfiles; registry caches |
| event-stream (2018) | Maintainer handed the package to a stranger, who added a targeted backdoor | Watch maintainer changes and new transitive deps |
| Dependency confusion (2021) | Public packages with internal names and higher versions got installed | Scoped names; pin scopes to the private registry |
| Log4Shell (2021-12) | A logging library evaluated lookups in logged strings | Know your transitive tree (SBOM); patch fast |
| colors/faker (2022) | Maintainer sabotaged his own packages; caret ranges pulled it in | Lockfiles, `npm ci`, cooldowns |
| xz-utils (2024) | Multi-year social engineering; payload only in release tarballs | Build from source that matches the repo |
| polyfill.io (2024) | CDN domain changed hands and served malicious JS | Self-host scripts or use SRI |
| tj-actions/changed-files (2025) | Tags repointed to a commit that dumped CI secrets into logs | Pin actions to SHAs; least-privilege tokens |
| chalk/debug (2025) | Maintainer phished (TOTP captured); 18 packages trojaned for about two hours | Cooldowns; phishing-resistant 2FA for publishers |
| Shai-Hulud worms (2025) | Install scripts stole tokens and republished victims' packages | Scripts off; short-lived tokens; trusted publishing |
| axios (2026-03) | Hijacked account; the only change was a new dependency whose postinstall dropped a RAT | Review new transitive deps in lockfile diffs; cooldowns; scripts off |

Full write-ups: the `lessons-from-failures` skill (its security and supply-chain reference).

## Removing and pruning

- [ ] Find candidates: `knip` (JS/TS unused dependencies, files, exports), `go mod tidy`, `deptry` for Python, and the native-replacement lint plugins.
- [ ] For each candidate, grep for dynamic imports, config-file references (Babel/ESLint/PostCSS plugins), CLI use in scripts, and type-only use before deleting.
- [ ] Replace with the platform API or inlined code plus tests; remove the package and regenerate the lockfile.
- [ ] Run the full test suite and a production build; compare bundle size before and after for front-end code.
- [ ] One removal per commit when the replacement changes code, so a regression is easy to bisect.

## Gotchas

- **Installing from memory.** Package names in your training data may be wrong, renamed, or squatted. Verify every name against the registry and official docs first.
- **"Trying another name" after a failed install.** That is exactly how slopsquatting works. Stop and report.
- **`npm install <pkg>` to add a one-liner helper** (`is-number`, `left-pad`, `uuid` for v4). Use the platform or write it with tests.
- **A second library for the same job** (adding `dayjs` next to `date-fns`, `axios` next to `ky`). Use the installed one.
- **Hand-rolling the hard things** in the name of fewer dependencies: JWT verification, password hashing, HTML sanitizing, CSV parsing with quotes.
- **Manifest changed, lockfile not** — or the lockfile regenerated from scratch, silently upgrading everything. Commit both together; regenerate only intentionally.
- **Blind `npm update` / `npm-check-updates -u`** across the tree. Update deliberately, with cooldown, changelogs for majors, and the full test suite.
- **Ignoring the lockfile diff.** New transitive packages, install scripts, or git/tarball URLs in a "patch" update are the signals attackers leave.
- **Leaving install scripts enabled** in dev containers and CI "because the build needs one". Allow-list that one package.
- **Wrapping React or Django in an adapter.** Wrap vendors, not the framework you build in.
- **Copying code without its license notice.** Little copying still carries the license.
- **Treating "last commit 3 years ago" as abandoned.** A small, finished, zero-dependency library with no open advisories can be fine; judge risk surface, not recency alone.

## Output format

For every change that touches dependencies, include:

```
Dependencies
- Added: <name>@<version> (<runtime|dev>) — why native/own code wasn't enough; signals checked: <registry+repo verified, last release, maintainers, advisories, license, transitive count, install scripts>
- Removed: <name> — replaced by <platform API / inlined code + test>
- Updated: <name> <from> → <to> — <security fix | routine>; changelog notes for majors
- Lockfile: <packages added/removed; any install scripts or non-registry URLs>
Needs approval: <hard stops hit, if any>
```

For an audit, list findings as `package → issue (unused / replaceable / unmaintained / advisory / license / install script) → action`, ordered by risk.

## References

| File | Read when |
|---|---|
| `references/evaluation-checklist.md` | Vetting a specific package in depth, comparing two candidates, or judging whether a project is abandoned |
| `references/native-replacements.md` | Replacing a package with a Node, web, Python, or Go built-in, or checking whether a native API is supported widely enough |
| `references/supply-chain.md` | Hardening installs and CI, configuring provenance or SBOMs, reviewing a suspicious lockfile diff, or responding to a compromised package |
| `references/update-policy.md` | Setting up Renovate/Dependabot, configuring cooldowns, choosing pinning per ecosystem, or planning a major upgrade |
| `references/licenses.md` | A dependency or copied snippet has a copyleft, source-available, or missing license, or you need a license policy or checker |

## Related skills

- `application-security` — for vulnerabilities in your own code and secrets handling around dependencies.
- `lessons-from-failures` — full supply-chain incident write-ups before a risky dependency or CI change.
- `tech-stack-selection` — choosing frameworks, databases, and hosted vendors rather than libraries.
- `deployment-and-infrastructure` — CI pipelines, pinned actions, container base images.
- `code-review` — to review a PR that adds or updates dependencies.
- `web-platform` — bundle budgets and Baseline status for native web APIs.
