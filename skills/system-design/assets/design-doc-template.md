# <Title> — Design Doc

Status: Draft | In review | Approved | Implemented | Superseded by <link>
Authors: …   Reviewers: …   Last updated: YYYY-MM-DD
Mini version (medium changes): fill sections 1–4, 6.2, 7, and 10; mark the rest "n/a — <reason>".

## 1. Context and scope
What exists today (one diagram or three bullets). Why change now (incident, growth metric, product need, cost).
Current numbers, labeled Measured: QPS, table sizes, error rates, cost.

## 2. Goals
- G1 … (measurable: "p99 of GET /feed < 200 ms at 3× current peak")
- G2 …

## 3. Non-goals
- NG1 … (things a reasonable reader might assume are in scope but are not)

## 4. Requirements
### 4.1 Functional
- FR1 …
### 4.2 Non-functional / SLOs
| Operation | Latency (p50/p99) | Availability | Consistency / staleness | Durability (RPO) | Notes |
|---|---|---|---|---|---|
### 4.3 Data
Retention per table · PII categories and where they live · residency · deletion deadline and path · audit/history needs.
(Legal obligations to be confirmed by counsel; this document is not legal advice.)
### 4.4 Cost ceiling
Monthly and per unit (per tenant / per 1k requests / per active user).

## 5. Estimates
Users, average and peak QPS, read:write, payload sizes, storage now / +1y / +3y (with indexes and replicas),
largest tenant or hottest key and its share. Label each Estimated or Measured.
Growth trigger points: "next step X at metric M = T".

## 6. Design
### 6.1 Overview diagram
C4 container level (Mermaid). Label edges with protocol and sync/async.
### 6.2 Data model
Entities, keys, constraints, owning module per table, partition/shard key (if any), indexes for the top access patterns.
### 6.3 Access patterns and invariants
| ID | Access pattern | Frequency | Latency need | Served by |
| ID | Invariant | Enforced by (constraint / transaction / eventual + reconciliation) |
### 6.4 APIs and events
Shapes, idempotency, pagination, errors, event names and schema versions.
### 6.5 Key flows
Sequence diagrams for the 2–3 most important operations, each with at least two failure paths.
### 6.6 Deep dive: <riskiest component>

## 7. Alternatives considered
| Option | Pros | Cons | Why not chosen |
|---|---|---|---|
| Do nothing / smallest change | | | |
| Boring off-the-shelf (managed service / existing DB feature) | | | |
| <chosen design> | | | — |

Key decisions in trade-off form:
- We choose X over Y because R matters more than P here. This costs C. Revisit if M crosses T.

## 8. Cross-cutting concerns
- Security and authorization (who can do what; tenant isolation)
- Privacy and PII (minimization, retention, erasure path)
- Observability (SLIs, dashboards, alerts, traces)
- Cost (unit cost, biggest line items)
- Accessibility and i18n (if user-facing)
- Compliance

## 9. Failure modes
| Component | Failure | Detection | Mitigation | Blast radius |
|---|---|---|---|---|
Hard limits (ID widths, quotas, rate limits, connection caps) and percent-to-limit alerts.

## 10. Rollout and migration plan
| Phase | Change | Flag / cohort | Verification (metric, threshold, duration) | Rollback | Owner | Date |
|---|---|---|---|---|---|---|
Backup restore-tested before destructive phases. Cleanup (contract) phase with a date.
Success metrics · abort criteria · who is informed.

## 11. Operations
Owner team and on-call · dashboards · alerts tied to SLOs · runbook for the top three failure modes · cost estimate.

## 12. Open questions
- Q1 … (owner, due date)

## 13. Decision log
- YYYY-MM-DD — decision — link to ADR
