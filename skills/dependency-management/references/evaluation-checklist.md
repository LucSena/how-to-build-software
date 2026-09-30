# Evaluating a Dependency

Use this file to vet a specific package in depth, compare two candidates, or decide whether a project is abandoned. It combines Russ Cox's "Our Software Dependency Problem" (2019) with the OpenSSF "Concise Guide for Evaluating Open Source Software". Thresholds marked *default* are this collection's proposals, not standards.

## Contents
1. Before evaluating: do you need it?
2. Russ Cox: inspect, then contain
3. OpenSSF concise guide, condensed
4. Commands per ecosystem
5. Health and abandonment signals
6. Measuring the real cost
7. Comparing candidates and recording the decision

## 1. Before evaluating: do you need it?

- Is the capability actually required by the task, or is it a nice-to-have?
- Does the codebase already do it? Grep for helpers and check the manifest for an installed library that covers it.
- Does the platform do it? (`native-replacements.md`)
- Is it trivial? *Default:* under about 50 lines, no security or standards depth → write it, with edge-case tests.

Only continue if all four answers point to a new package.

## 2. Russ Cox: inspect, then contain

**Inspect before adopting:**

| Question | What to look at |
|---|---|
| Design | Clear docs; an API that fits your use without contortions |
| Code quality | Skim the source. Is it careful? Are errors handled? |
| Testing | Does it have tests, and do they pass when you run them? |
| Debugging | How are bug reports handled? Is the tracker responsive? |
| Maintenance | Recent commits, active maintainers, a history of fixing things |
| Usage | Real reverse dependencies, not just download counts |
| Security | Past vulnerabilities and how fast they were fixed; does it parse untrusted input; is it fuzzed? |
| Licensing | Compatible with how you ship |
| Its dependencies | Every transitive dependency inherits all of these questions |

**Then contain it:**
- **Test** it in your context, including its own test suite.
- **Abstract** it behind your own narrow interface if it touches business logic or might be swapped.
- **Isolate** risky code (a separate process, reduced permissions, a sandbox) when it handles untrusted input.
- **Avoid** it if you need only a small part: write that part, or copy it with its license notice.
- **Upgrade** on a schedule; most bugs are fixed upstream.
- **Watch** for new vulnerabilities and maintenance changes.

## 3. OpenSSF concise guide, condensed

| Area | Check |
|---|---|
| Necessity | "Every new dependency increases the attack surface." Is it really needed? |
| Authenticity | The official source, not a fork or typosquat: name, project site link, fork relationship, creation date, popularity. If a similar name is more popular, suspect typosquatting |
| Maintenance | Significant activity in the last 12 months; a release in the last 12 months; more than one maintainer, ideally from different organizations; not 0.x/alpha/beta unless you accept instability |
| Security practices | OpenSSF Best Practices badge; OpenSSF Scorecard and deps.dev results; branch protection; CI tests; timely security fixes; no important unfixed vulnerabilities; its own dependencies current |
| Usability and security | The API is easy to use securely (for example, parameterized queries); secure defaults ("if not, avoid it"); security guidance; a vulnerability-reporting route; a stated breaking-change policy |
| Adoption and licensing | Clear OSI license consistent with your use; significant adoption; suitability ("avoid hype-driven development") |
| Practical testing | Try it in an isolated environment; watch for network calls or file access it should not make; check it doesn't add unnecessary production dependencies |
| Code evaluation | Look for many TODOs; read install scripts for exfiltration (reading `~/.ssh`, env vars) and obfuscated or encoded executed values; look at the most recent commits, because attackers add recent code |

## 4. Commands per ecosystem

| Ecosystem | Identity and metadata | Footprint | Advisories |
|---|---|---|---|
| npm | `npm view <pkg> name repository.url time.created maintainers dist-tags scripts` | `npm install <pkg> --dry-run --ignore-scripts`, `npm ls --all`, bundlephobia, pkg-size.dev | `npm audit`, `npm audit signatures` |
| pnpm | `pnpm view <pkg> …` (same fields) | `pnpm why <pkg>`, `pnpm list --depth Infinity` | `pnpm audit` |
| Python | `https://pypi.org/pypi/<name>/json` (project URLs, release dates), `pip index versions <name>` | `uv tree` or `pipdeptree` | `pip-audit`, `osv-scanner` |
| Go | `go list -m -versions <module>`, pkg.go.dev page | `go mod graph` | `govulncheck` (reachability-aware) |
| Rust | crates.io page, `cargo search <name>` | `cargo tree` | `cargo audit` |
| Any | deps.dev, OpenSSF Scorecard (`scorecard --repo=<url>`), Socket or Snyk package health pages | — | OSV database, GitHub advisories |

Run metadata queries **before** installing. Install unfamiliar packages with scripts disabled, in a container without credentials.

## 5. Health and abandonment signals

**Healthy:**
- A release and commits within 12 months (OpenSSF).
- More than one maintainer or an organization behind it; a `SECURITY.md`.
- Issues and PRs get responses; CI runs tests; semver is respected; changelog exists.
- Good Scorecard result; Best Practices badge.

**Warning signs:**
- Deprecated on the registry, or an archived repo.
- Last release years ago with open security issues.
- A sole maintainer who recently transferred ownership or changed the account email (the event-stream and 2026 axios patterns).
- New dependencies or install scripts appearing in a patch release.
- Obfuscated or minified code in a package that is not a build artifact.
- Registry tarball contents that don't match the repository source (the xz-utils pattern).
- A publish that lost provenance it used to have (pnpm's `trustPolicy: no-downgrade` detects this).

**Finished is not abandoned.** A small library with zero dependencies, a stable API, and no open advisories can be fine without recent commits. Judge by risk surface (untrusted input? network? install scripts?) as well as recency. Renovate's `abandonments:recommended` preset flags packages with no releases for a long time; treat a flag as a prompt to look, not a verdict.

## 6. Measuring the real cost

Hidden costs of each dependency: attack surface (including every transitive maintainer's account), update churn, install time and CI minutes, bundle size, debugging depth, license obligations, abandonment risk, and lock-in to its quirks (Hyrum's law: every observable behavior will be depended on).

Measure before and after adding:
- Package count: `npm ls --all | wc -l`, `pnpm list --depth Infinity`.
- Packages with install scripts: search the lockfile for `hasInstallScript`.
- Front-end cost: bundle analyzer (`source-map-explorer`, `vite-bundle-visualizer`, or the bundler's own report) and a `size-limit` budget per route.
- **Libraries** should minimize harder than apps, because every consumer inherits their tree (lirantal: design packages with minimal or zero dependencies using modern platform features).

## 7. Comparing candidates and recording the decision

```
Need: <capability, one sentence>
Rejected rungs: existing code <…>, platform API <…>, own code <why not: security depth / standard / size>
Candidates:
| | A | B |
| Identity verified (registry ↔ repo) | | |
| Last release / maintainers | | |
| Advisories / Scorecard | | |
| License | | |
| Direct + transitive packages added | | |
| Install scripts | | |
| Bundle impact (gzip) | | |
| API fit (secure by default, types) | | |
Decision: <A>, contained in <module/adapter>; revisit when <condition>
```

Put non-trivial decisions (a new runtime dependency in a core path, a vendor SDK) in the PR description or an ADR so the next person knows why it is there.

## Sources

- Russ Cox, "Our Software Dependency Problem" (2019): https://research.swtch.com/deps
- OpenSSF, "Concise Guide for Evaluating Open Source Software": https://best.openssf.org/Concise-Guide-for-Evaluating-Open-Source-Software
- OpenSSF, "Simplifying Software Component Updates": https://best.openssf.org/Simplifying-Software-Component-Updates
- OpenSSF Scorecard: https://github.com/ossf/scorecard · deps.dev: https://deps.dev
- Liran Tal, npm security best practices: https://github.com/lirantal/npm-security-best-practices
- Renovate presets (abandonments): https://github.com/renovatebot/renovate/tree/main/lib/config/presets/internal
- Hyrum's law: https://www.hyrumslaw.com
- Go vulnerability management (`govulncheck`): https://go.dev/doc/security/vuln/
