# <Title> — design doc

- **Status:** draft | in review | accepted | superseded by <link>
- **Author(s):** <names> · **Reviewers:** <names, due date>
- **Issue / epic:** <link> · **Last updated:** YYYY-MM-DD

## 1. Context and problem

Why this, why now. Link data (support tickets, metrics, incidents). One paragraph.

## 2. Goals

- Measurable outcomes ("p95 invoice render < 300 ms", "customers can export all invoices").

## 3. Non-goals

- What this deliberately does not do (and why), so reviewers do not re-open it.

## 4. Proposed design

- System-context diagram (boxes and arrows; C4 level 1–2 in Mermaid is fine).
- Data model changes (tables, keys, ownership, migration shape).
- API / contract changes (endpoints, events, payloads, errors).
- Key flows (numbered steps for the happy path and the main failure path).

## 5. Alternatives considered

| Alternative | Why not |
|---|---|
| Do nothing | |
| <Option B> | |
| <Option C> | |

## 6. Non-functional requirements

| Attribute | Target | How verified |
|---|---|---|
| Latency (p95) | | |
| Throughput / data size + growth | | |
| Availability, RTO/RPO | | |
| Cost ceiling | | |

## 7. Cross-cutting concerns

- Security and privacy (authz checks, PII, secrets, threat notes)
- Observability (logs, metrics, traces, alerts)
- Accessibility and UX (for user-facing work)

## 8. Rollout and rollback

- Flags, migration order (expand → migrate → contract), phased rollout.
- How to disable it; which metric triggers rollback; can data be rolled back?

## 9. Risks and open questions

- <risk> → <mitigation>
- <question> → <owner, due date>

## 10. Decisions

- ADR-NNNN <title> (link)
