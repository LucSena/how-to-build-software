# Design docs, RFCs, and ADRs — when to write which, and how

Writing forces the trade-offs into the open while changing course is still cheap. The failure modes on either side: no document at all for a one-way-door decision, and a ten-page document for a two-way-door tweak. This file picks the right artifact and shows what each must contain. ADR file conventions and C4 diagrams are in `software-architecture` (`references/adr-c4.md`). The end-to-end system-design method (requirements → estimates → API → data → deep dives) is in `system-design`.

## Contents
1. Choosing the artifact
2. Design docs
3. Trade studies (choosing between options)
4. RFCs and RFDs
5. ADRs for a new project
6. Review and status
7. Rules catalog

## 1. Choosing the artifact

| Signal | Artifact |
|---|---|
| Local, reversible, follows an existing pattern | PR description only |
| One decision that is costly to reverse (framework, datastore, auth approach, API style, hosting, tenancy model) | ADR |
| Multi-week work, a new service/datastore/external dependency, a public API or data-model change, touches auth/payments/PII, crosses team boundaries, or more than ~1 week of human effort | Design doc, producing one or more ADRs |
| Choosing among 2–3 concrete options with uncertain facts | Trade study (often a section of the design doc) |
| Change needs consensus across an org or community, with a tracked status | RFC / RFD |

Skip the design doc when the solution is obvious and there are no meaningful trade-offs: write the code and a good PR description. A design doc that could have been a PR description delays the work and teaches people to skim design docs.

## 2. Design docs

Malte Ubl's "Design Docs at Google" describes them as relatively informal documents, written before coding, that capture the high-level implementation strategy and key design decisions, **with emphasis on the trade-offs** considered. The benefits he lists: design problems found early while change is cheap, consensus, cross-cutting concerns considered, senior engineers' knowledge scaled, and organizational memory. Gergely Orosz reports the same at Uber and Skype: plain boxes-and-arrows diagrams and clear prose, with an RFC-like template, rather than formal notation.

Sections (merged from the MS playbook's feature design review template, the Kubernetes KEP template, and common industry practice; the full template is in `assets/design-doc-template.md`):

1. **Context and problem**: why now, with links to the issue and data.
2. **Goals and non-goals.** Non-goals are the most skipped section and the one that saves the most arguments.
3. **Proposed design**: a system-context diagram, the data model, the API or contract, and the key flows.
4. **Alternatives considered**: 2–3 options, each with the reason it was not chosen, including "do nothing".
5. **Non-functional requirements with numbers**: latency, throughput, data size and growth, availability, RTO/RPO, and cost ceiling (MS template).
6. **Cross-cutting concerns**: security and privacy, observability, and accessibility for UI.
7. **Rollout and rollback**: flags, migration order, how to turn it off, and which metric triggers rollback. The KEP template's "Production Readiness Review" section is a good model for the operational questions most docs forget.
8. **Risks and open questions.**
9. **Decisions**: links to the ADRs this doc produces.

Length: 2–10 pages; a "mini design doc" of 1–3 pages is right for most feature-sized work. Keep code sparse: pseudo-code only where the algorithm *is* the decision.

## 3. Trade studies (choosing between options)

The MS playbook's trade-study template exists to stop open-ended evaluation:

- Narrow the evaluation to **2–3 options**.
- **Design experiments to collect evidence as fast as possible** (a spike, a benchmark on your own data shape, a prototype of the hardest part).
- Finish within a sprint.
- Evaluation criteria can be binary (must-haves), categorical, or numeric. Put the results in a table.
- If the group cannot reach consensus, the person with the most context decides, and everyone else "disagrees and commits".

Output: a results table plus a recommendation, recorded as an ADR. Stack decisions use the weighted matrix in `tech-stack-selection`.

## 4. RFCs and RFDs

Use a numbered, stateful process when many people must agree and the history of the decision matters.

- **Rust RFCs**: required for "substantial" changes, and not for refactors, objective improvements, or developer-only changes. Template sections: Summary, Motivation, Guide-level explanation, Reference-level explanation, Drawbacks, Rationale and alternatives, Prior art, Unresolved questions, Future possibilities. The Rust process also warns that a hastily proposed RFC can hurt its own chances, so lay groundwork first.
- **Kubernetes KEPs**: Summary; Motivation (Goals, **Non-Goals**); Proposal (user stories, risks and mitigations); Design details (test plan, graduation criteria, upgrade/downgrade, version skew); **Production Readiness Review** (how to enable and disable it, whether it can be rolled back, which metrics inform rollback, SLOs).
- **Oxide RFDs** ("Requests for Discussion"): a document moves through prediscussion → ideation → discussion → published → committed (or abandoned). It is both a venue for early rough ideas and a permanent record, iterated on a branch and discussed as a PR.

For a startup or a single team, a design doc plus ADRs covers the same ground. Adopt an RFC process when decisions regularly span teams and people keep asking "where was this decided?".

## 5. ADRs for a new project

Write these in the first week:

| ADR | Content |
|---|---|
| `0001-record-architecture-decisions.md` | We will record significant, costly-to-reverse decisions as ADRs in `docs/adr/`; format; immutability; who accepts them |
| `0002-<stack>.md` | Language, framework, database, hosting: chosen option, rejected options, why, "revisit when" trigger (skip it if the stack is the team's written default) |
| Later, as they happen | Auth approach, tenancy model, API style, monorepo tooling, each new datastore or broker |

Conventions (shared with `software-architecture`): numbered files `NNNN-imperative-title.md`, status `proposed → accepted | rejected → deprecated | superseded by NNNN`, one screen long, never edited after acceptance except for the status line. An agent that proposes a one-way-door change drafts the ADR with status `proposed` and asks the user to accept it. Template: `assets/adr-template.md`.

A Y-statement makes a good first line: *In the context of <situation>, facing <concern>, we decided for <option> and against <alternatives>, to achieve <quality>, accepting <downside>.*

## 6. Review and status

- Put the design doc up for review as a PR (or in a shared doc) with named reviewers and a date. Silence is not approval.
- Record the outcome in the doc's status line and in ADRs. Link the doc from the epic or issue.
- Update the doc when the design changes during implementation, or mark it superseded. A stale design doc misleads more than a missing one.
- Measure design reviews by the cost of change (MS playbook): front-load the decisions that are expensive to change later, and defer the cheap ones.

## 7. Rules catalog

### Write the doc before the code for one-way doors
**Rule.** For a new service, datastore, external dependency, irreversible API or data-model change, or anything touching auth/payments/PII, produce a design doc or ADR before implementation.
**Apply when.** The change matches one of those triggers or exceeds ~1 week of human work.
**Do / Avoid.** Do: a 2-page doc with alternatives and rollback, reviewed, then code. Avoid: a 3,000-line PR that makes the decision implicitly.
**Why.** Changing a design on paper costs hours; after implementation it costs weeks. An anecdote often quoted (via charlax/professional-programming) says a couple of pages written over a few days can save weeks of wasted implementation.

### Always include non-goals and alternatives
**Rule.** A design doc without non-goals and at least two rejected alternatives is not ready for review.
**Apply when.** Reviewing or drafting any design doc.
**Do / Avoid.** Do: "Non-goal: multi-currency in v1", "Rejected: separate search cluster — Postgres FTS meets p95 < 200 ms on 2M rows". Avoid: a doc that only describes the chosen design.
**Why.** Trade-offs are the reason the document exists (Ubl). Non-goals keep scope creep from reaching the implementation.

### Supersede ADRs, never rewrite them
**Rule.** Once accepted, an ADR only changes its status line. A new decision gets a new ADR that links the old one.
**Apply when.** A past decision is reversed or refined.
**Do / Avoid.** Do: `0014-move-jobs-to-dedicated-queue.md`, superseding 0007. Avoid: editing 0007 so it reads as if the team always chose the new option.
**Why.** The value of ADRs is the history of *why*. Rewriting it erases the context that explains the current code.

## Sources

- Malte Ubl, "Design Docs at Google": https://www.industrialempathy.com/posts/design-docs-at-google/
- Gergely Orosz, "Software Architecture is Overrated, Clear and Simple Design is Underrated": https://blog.pragmaticengineer.com/software-architecture-is-overrated/
- Microsoft Code-With Engineering Playbook — design reviews, feature/story design review template, trade-study template, decision log/ADRs: https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/design
- Rust RFCs README and template: https://github.com/rust-lang/rfcs
- Kubernetes KEP template: https://github.com/kubernetes/enhancements/tree/master/keps/NNNN-kep-template
- Oxide RFD 1, "Requests for Discussion": https://rfd.shared.oxide.computer/rfd/0001
- Michael Nygard, "Documenting Architecture Decisions" (ADR format): https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- charlax/professional-programming (design-doc notes): https://github.com/charlax/professional-programming
