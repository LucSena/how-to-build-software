# Growth stages, splitting, and ownership

A codebase's structure should match the number of people changing it. Structure for a future org chart is overhead today. Structure that lags the org produces merge conflicts, fear of change, and teams blocking each other. This file gives the signals for each step and the ownership model that goes with it.

## Contents
1. Stages in detail
2. Signals it is time for the next stage
3. The splitting ladder: folder → module → package → service
4. Conway's law and Team Topologies
5. Ownership in practice
6. Cases
7. Rules catalog

## 1. Stages in detail

### Stage 0 — solo or prototype (1–2 people)
- **Structure**: the framework's default layout. One app, one database, a few feature folders once there are more than two or three features.
- **Enforce**: formatter, linter, strict types, CI (`project-bootstrap`).
- **Don't**: modules with public APIs, monorepo tooling, packages, CODEOWNERS. None of them pay off yet.

### Stage 1 — one team (3–8 people)
- **Structure**: feature folders inside one app; a `shared/` with a documented, linted one-way dependency rule; co-located tests.
- **Enforce**: no cycles; no cross-feature internal imports; `shared` never imports features.
- **Practices**: PR review, trunk-based development, Definition of Done, ADRs for one-way doors.

### Stage 2 — several teams (2–5 teams)
- **Structure**: a **modular monolith**. Modules map to bounded contexts, each with a public API, its own tables (ideally its own schema), and its own tests. If there are several deployables (web, API, worker, mobile), use a monorepo with `apps/` and `packages/`.
- **Enforce**: boundary rules as CI fitness functions; per-module test suites; affected-only builds with caching (Turborepo, Nx, Bazel, Gradle).
- **Ownership**: CODEOWNERS per module, one owning team each; shared packages owned by a platform or enabling team.

### Stage 3 — many teams on independent cadences (5+ teams)
- **Structure**: the modular monolith stays the default. Extract a service only where a module has a concrete trigger (below). A platform team provides paved-road templates.
- **Enforce**: contract tests between services, service templates with observability built in, an internal developer portal or service catalog.

## 2. Signals it is time for the next stage

| Signal | Suggests |
|---|---|
| Merge conflicts in the same files across unrelated work | Split the folder into modules; separate ownership |
| "I'm afraid to change X because I don't know what uses it" | A public API for X plus an import rule |
| One test suite takes so long that people stop running it | Per-module suites; affected-only CI |
| Two teams must coordinate every release | Module ownership; consider independent deployables only if coordination persists after that |
| Files in two modules usually change in the same commits | The boundary is mis-cut. Merge them or move the shared concept |
| New hires take weeks to find where things live | The top level doesn't name the domain; restructure by feature |

Measure change coupling from history: count how often files from module A and module B change in the same commit over the last few months. A high ratio means the modules are really one.

## 3. The splitting ladder: folder → module → package → service

| Step | Trigger (any one) | Cost you take on |
|---|---|---|
| Folder → module (public API + rule) | Feature > ~15–20 files; separate vocabulary; a second developer working in it daily | A little indirection |
| Module → package (own manifest, build, tests) | A second deployable needs it; independent build/test caching pays off; separate owner | Versioning inside the workspace, build config |
| Package/module → service | Independent scaling profile; deploy cadence owned by another team; fault or compliance isolation; different runtime | Network failure modes, distributed data, on-call, observability, contract versioning |

Never split for size alone. Never extract a service from a module whose boundary isn't already enforced in-process, or you get a distributed monolith: lockstep deploys, a shared database, and call chains more than 2–3 hops deep. The extraction procedure (strangler fig, own schema, seams, gradual traffic shift) is covered in `software-architecture`.

Merging back is also a legitimate move. When two services always change and deploy together, fold them into one.

## 4. Conway's law and Team Topologies

- **Conway's law**: organizations design systems that mirror their own communication structure. You can't fight it. Choose the team structure you want the architecture to have (the *inverse Conway maneuver*, from Team Topologies).
- **Team Topologies** (Skelton and Pais, 2019): team cognitive load is the primary constraint on what a team can own. Teams of roughly 5–9 people. Four team types: *stream-aligned* (owns a flow of change end to end, and is the default), *platform* (internal products that reduce others' load), *enabling* (coaches, temporarily), and *complicated-subsystem* (deep specialist component). Three interaction modes: *collaboration* (temporary, high-bandwidth), *X-as-a-service* (clear API), and *facilitating*.
- Consequence for code: a stream-aligned team should be able to change its modules without waiting on another team's review for routine work. If it can't, either the boundary or the team split is wrong.
- **Brooks's law**: adding people to a late project makes it later. Restructuring the codebase to "fit more people" mid-crisis rarely helps. Do it between pushes.
- "Cognitive load is what matters" (zakirullin): a well-crafted monolith with truly isolated modules is often more flexible than many microservices. Familiarity is not the same as simplicity.

## 5. Ownership in practice

- One owning **team** per top-level module or package (never an individual, never "everyone"), recorded in `CODEOWNERS` and backed by branch protection requiring code-owner review.
- Owners define the module's public API, review changes to it, and own its on-call alerts and dependency updates.
- Shared packages (`ui`, `db`, `config-*`) belong to a platform or enabling team with a published contribution path. Consumers can open PRs, and owners review promptly.
- Google's monorepo uses per-directory OWNERS files: anyone can propose a change anywhere, and owners approve it. That makes cross-team fixes possible without giving up accountability.
- Write the ownership map in `AGENTS.md` or the README so agents know who must review what.

## 6. Cases

| Case | What happened | Lesson |
|---|---|---|
| Shopify, Packwerk and its retrospective | Built Packwerk to modularize a very large Rails monolith. Later wrote that "todo" violation files piled up and that privacy rules conflicted with Rails conventions; privacy checks moved to an extension | Tools record violations; boundaries come from design work. Work with framework conventions |
| Segment, "Goodbye Microservices" (2018) | Split delivery into 140+ per-destination services and repos; shared-library versions drifted, each change had to be deployed many times, and a few engineers spent most of their time keeping things running. It merged them back into one service, and productivity recovered | Services without matching team boundaries add coordination cost without autonomy; split only on real triggers |
| Amazon Prime Video monitoring (2023) | Consolidated a distributed serverless pipeline into a single process and reported about a 90% infrastructure cost reduction | Distribution is a cost to justify, not a default |
| Google monorepo (CACM 2016) | One repository with unified versioning, atomic cross-project changes, and large-scale refactoring, backed by heavy tooling investment and trunk-based development | Monorepos scale when you invest in tooling and ownership |
| Atlassian Jira front end | Removing barrel files reportedly cut build times by about 75% | Small structural habits compound at scale |
| FastAPI Best Practices authors | File-type folders "didn't scale well for our monolith with many domains"; moved to one package per domain | Package by feature once there is more than one domain |

## 7. Rules catalog

### Add structure one stage at a time
**Rule.** Adopt the next stage's structure only when its signals appear, and write down which signal triggered it.
**Apply when.** Proposing modules, packages, monorepo tooling, or services.
**Do / Avoid.** Do: "Two teams now edit billing daily → billing becomes a module with an owner and a boundary rule." Avoid: Nx, 12 packages, and CODEOWNERS for a two-person startup.
**Why.** Every structural layer adds indirection and process. Paid for before it is needed, it slows the stage you are actually in.

### Cut modules where change coupling is low
**Rule.** Draw module boundaries so that most changes stay inside one module. Verify with commit history.
**Apply when.** Designing or revising module boundaries.
**Do / Avoid.** Do: merge `pricing` into `billing` when 80% of commits touch both. Avoid: boundaries by technical layer or by database table.
**Why.** A boundary crossed by most changes adds cost without adding independence. Cohesion is measured by what changes together.

### Give each module exactly one owning team
**Rule.** Record one owning team per top-level module in CODEOWNERS. Unowned or multi-owned modules get an owner before new work starts.
**Apply when.** A second team starts working in the codebase.
**Do / Avoid.** Do: `/apps/api/src/billing/ @acme/billing`. Avoid: a `shared/` module everyone changes and nobody owns.
**Why.** Conway's law: without ownership lines, boundaries follow whoever touched the code last, and they erode.

## Sources

- Team Topologies (Skelton and Pais): https://teamtopologies.com · summary: https://danlebrero.com/2021/01/20/team-topologies-summary/
- hacker-laws — Conway's law, Brooks's law, Gall's law: https://github.com/dwmkerr/hacker-laws
- zakirullin, "Cognitive load is what matters": https://minds.md/zakirullin/cognitive
- Potvin and Levenberg, "Why Google Stores Billions of Lines of Code in a Single Repository" (CACM 59(7), 2016): https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/
- Shopify, "A Packwerk Retrospective": https://shopify.engineering/a-packwerk-retrospective · Packwerk: https://github.com/Shopify/packwerk
- Segment (Alexandra Noonan), "Goodbye Microservices": https://www.twilio.com/en-us/blog/developers/best-practices/goodbye-microservices
- Amazon Prime Video tech blog (2023), monitoring service consolidation: https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90
- Atlassian, "Faster builds when removing barrel files": https://www.atlassian.com/blog/atlassian-engineering/faster-builds-when-removing-barrel-files
- FastAPI Best Practices: https://github.com/zhanymkanov/fastapi-best-practices
- Node.js Best Practices §1.1 (structure by components): https://github.com/goldbergyoni/nodebestpractices
