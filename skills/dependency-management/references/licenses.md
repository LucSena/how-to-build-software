# Licenses for Dependencies and Copied Code

Use this file when a dependency or copied snippet has a copyleft, source-available, or missing license, or when you need a license policy or checker. **This is engineering guidance, not legal advice.** When distribution, revenue, or a customer contract depends on the answer, the user should ask their legal team; your job is to surface the question early, not to settle it.

## Contents
1. License families and what they ask of you
2. How you ship changes the answer
3. Copying code
4. Relicensing risk
5. A license policy and automated checks

## 1. License families and what they ask of you

| Family | Examples | Main obligation | Agent default |
|---|---|---|---|
| Permissive | MIT, BSD-2-Clause, BSD-3-Clause, ISC | Keep the copyright and license notice | OK |
| Permissive with patent terms | Apache-2.0 | Keep notices and the NOTICE file; state changes to modified files; includes an explicit patent grant | OK |
| Weak copyleft | MPL-2.0 (per file), LGPL-2.1/3.0 (per library), EPL-2.0 | Changes to the covered files or library must be shared under the same license; combining with your code is generally allowed | OK with care; ask before static linking or bundling LGPL code into proprietary mobile or desktop binaries |
| Strong copyleft | GPL-2.0, GPL-3.0 | Distributing a combined work requires releasing it under the GPL | Ask before adding to proprietary software that is distributed (apps, on-prem, SDKs) |
| Network copyleft | AGPL-3.0 | Also triggered when users interact with the software over a network (SaaS) | Ask; many companies ban it outright |
| Source-available / non-OSI | SSPL, BUSL, Elastic License 2.0, "Commons Clause" add-ons | Use restrictions (offering it as a service, production use, competing products) | Ask |
| Public-domain style | CC0, Unlicense, 0BSD | None or minimal | OK |
| Content licenses | CC BY, CC BY-SA | Attribution (and share-alike for BY-SA); not designed for code | OK for docs and data with attribution; avoid for code |
| No license | Repository without a LICENSE file | All rights reserved by default | Don't depend on it or copy from it; ask the author to add a license |

The OpenSSF evaluation guide asks for exactly this: every component should have a clear license, ideally a widely used OSI-approved one, and projects that won't state their license are less likely to follow other good practices.

## 2. How you ship changes the answer

| Distribution model | Permissive | LGPL/MPL | GPL | AGPL | Source-available |
|---|---|---|---|---|---|
| Internal tool, never distributed | OK | OK | Usually OK | Check (network use by staff can count) | Check terms |
| SaaS (users interact over the network) | OK | OK | Usually OK (no distribution) | Ask — network use triggers it | Check "as a service" clauses |
| Distributed binary (mobile app, desktop, CLI, on-prem) | OK + notices | Care with static linking/bundling | Ask | Ask | Ask |
| Published library others depend on | OK | OK | Forces consumers' choices — avoid | Avoid | Avoid |

Other points agents miss:
- **Apache-2.0 and GPL-2.0-only** are generally considered incompatible (the FSF treats Apache-2.0 as compatible with GPLv3). Flag the combination.
- **Dev-only tools** (linters, test runners, build tools) that are not shipped rarely create obligations for your product; code generators that copy their own source into your output can.
- **Mobile apps bundle everything.** Front-end and mobile builds distribute every runtime dependency to users, so notices must ship with the app (an "Open-source licenses" screen or file).
- **Dual-licensed** packages (for example, GPL or commercial) require choosing and complying with one of the licenses.

## 3. Copying code

- Rob Pike's "a little copying is better than a little dependency" still carries the license. Copy only from permissively licensed or public-domain sources unless the project's license is compatible.
- Keep the original copyright and license notice in the file header or in a `THIRD_PARTY_NOTICES` file, with a link to the source.
- Snippets from Q&A sites and blogs have their own terms (Stack Overflow content is CC BY-SA); for anything beyond a trivial idiom, write your own version instead.
- Code from a repository with no license cannot legally be copied.
- Attribution files exist for exactly this; in this skill collection, `CREDITS.md` plays that role.

## 4. Relicensing risk

Popular infrastructure projects have moved from open-source licenses to source-available ones, which then prompted community forks. Examples (as of 2026-09): Elasticsearch (2021, later adding AGPL as an option), HashiCorp Terraform and other products (BUSL, 2023; the OpenTofu fork), and Redis (2024; the Valkey fork, with Redis later adding AGPL as an option). Lessons:
- Record the license of each major infrastructure dependency and re-check it at major upgrades; a new major can arrive under a new license.
- Prefer projects governed by a foundation or with many independent contributors when the dependency is central and long-lived.
- Keep the version you are on (and its license) until a deliberate decision to move.

## 5. A license policy and automated checks

A short policy in the repository (dependency policy file or ADR) should state:
- **Allowed without review:** MIT, BSD-2/3, ISC, Apache-2.0, 0BSD, CC0, Unlicense.
- **Allowed with review:** MPL-2.0, LGPL, EPL, CC BY for non-code assets.
- **Requires approval:** GPL, AGPL, SSPL, BUSL, Elastic License, any custom or non-OSI license.
- **Forbidden:** no license; licenses that conflict with how you ship.
- How notices are shipped (NOTICE file, in-app licenses screen, SBOM license fields).

Automate it:
- License checkers per ecosystem, for example `license-checker` (npm), `pip-licenses` (Python), `go-licenses` (Go), `cargo-deny` (Rust), ScanCode for source trees, or a software composition analysis service.
- Run the check in CI against the allow-list, and fail the build on unknown or forbidden licenses.
- Include license fields in the SBOM (SPDX or CycloneDX) generated per release.

## Sources

- choosealicense.com (license summaries): https://choosealicense.com/licenses/
- Open Source Initiative, approved licenses: https://opensource.org/licenses
- GNU, "Why the Affero GPL": https://www.gnu.org/licenses/why-affero-gpl.html · GNU license compatibility list: https://www.gnu.org/licenses/license-list.html
- OpenSSF, "Concise Guide for Evaluating Open Source Software" (license checks): https://best.openssf.org/Concise-Guide-for-Evaluating-Open-Source-Software
- Rob Pike, Go Proverbs: https://go-proverbs.github.io
- SPDX: https://spdx.dev · CycloneDX: https://cyclonedx.org
