# How Complex Systems Fail — Cook's 18 Points as Engineering Rules

Richard I. Cook's short paper "How Complex Systems Fail" (1998, revised 2000) was written about medicine and other high-risk work, and it describes production software at scale remarkably well. Titles below are Cook's; explanations and rules are paraphrased and adapted for software teams.

## Contents
1. The 18 points, each with a rule
2. What this means for agents changing code
3. Using the points in a postmortem

## 1. The 18 points, each with a rule

| # | Cook's observation | Engineering rule |
|---|---|---|
| 1 | **Complex systems are intrinsically hazardous systems.** The hazards are part of what the system is. | Design for failure as the normal case: every dependency gets a timeout, a failure mode, and a user-visible fallback. |
| 2 | **Complex systems are heavily and successfully defended against failure.** Layers of technical, human, and organizational defenses. | Defense in depth: validation at every boundary, timeouts, retries with backoff, circuit breakers, rate limits, backups, reviews. Never remove a layer because "the other one catches it". |
| 3 | **Catastrophe requires multiple failures — single point failures are not enough.** Small faults must line up. | Remove single points of failure, and treat near misses (an alert that almost fired, a retry storm that self-healed) as data worth a short write-up. |
| 4 | **Complex systems contain changing mixtures of failures latent within them.** Not all can be removed, and they change as the system does. | Hunt latent faults continuously: untested backups, unmonitored queues, expiring certificates, stale runbooks, unused-but-reachable endpoints, dependency audits. |
| 5 | **Complex systems run in degraded mode.** Always partly broken, kept working by redundancy and people. | Build explicit degraded modes (stale cache, read-only, hidden non-critical features, queued writes) and show degraded states honestly in the UI. |
| 6 | **Catastrophe is always just around the corner.** The potential cannot be designed away. | Keep rollback, kill switches, runbooks, and on-call ready at all times, not only during launches. |
| 7 | **Post-accident attribution to a "root cause" is fundamentally wrong.** Failures have multiple contributors. | Postmortems list contributing factors; ban "root cause: human error". |
| 8 | **Hindsight biases post-accident assessments of human performance.** Knowing the outcome makes the path look obvious. | Blameless postmortems reconstruct what responders knew and saw at the time, including the signals that were misleading. |
| 9 | **Human operators have dual roles: as producers and as defenders against failure.** | Tooling serves both roles: safe defaults, dry-run modes, previews and confirmation for destructive operations, undo where possible. |
| 10 | **All practitioner actions are gambles.** Every action is taken under uncertainty. | Make risk visible at decision time: deploy tooling shows blast radius, canary status, and the rollback path before the button is pressed. |
| 11 | **Actions at the sharp end resolve all ambiguity.** Operators settle production-vs-safety trade-offs in the moment. | Write the policy down ahead of time ("rollback first, debug later"; "anyone may declare an incident"; "anyone may flip a kill switch"). |
| 12 | **Human practitioners are the adaptable element of complex systems.** | Give operators observability and manual overrides; never automate away the human's ability to intervene on critical paths. |
| 13 | **Human expertise in complex systems is constantly changing.** People join, leave, and technology shifts. | Invest in runbooks, onboarding, and practice on realistic (sandboxed) failures; knowledge that lives in one head is a latent fault. |
| 14 | **Change introduces new forms of failure.** Even fixes create new, rarer failure modes. | Small, incremental, reversible changes: feature flags, canaries, expand/contract migrations. Treat every change — code, config, flag, infrastructure — as a risk. |
| 15 | **Views of "cause" limit the effectiveness of defenses against future events.** Remedies aimed at "human error" add rules and complexity. | Prefer systemic fixes that make the wrong thing hard and the right thing easy (guardrails, automation, safer defaults) over "be more careful" policies. |
| 16 | **Safety is a characteristic of systems and not of their components.** It emerges from interactions. | Test end to end and reason about interactions (retries × timeouts × autoscaling), not only unit correctness. |
| 17 | **People continuously create safety.** Failure-free operation comes from routine adjustments. | Study normal work as well as incidents: what do people do every week to keep things running? Automate or document it before they leave. |
| 18 | **Failure-free operations require experience with failure.** | Run game days, chaos experiments within guardrails, restore drills, and incident simulations; share near-miss reports. |

## 2. What this means for agents changing code

An AI agent is a very fast source of change (point 14), and change is where new failures come from. Derived rules:

- **Prefer small diffs.** One concern per change; separate refactors from behavior changes.
- **Never disable a defense to make something work**: tests, type checks, lint rules, alerts, rate limits, validation, timeouts, authorization checks (point 2). If one blocks you, fix the cause or ask.
- **Add observability with every new dependency or code path**: a span, RED metrics, useful error logs (point 12).
- **Ship behind a flag** when behavior changes for users, and describe the rollback path in the PR (points 6, 14).
- **Document operational procedures** for any new component: how to tell it is healthy, how to restart it, how to turn it off (point 13).
- **State what was not verified.** Unknowns are latent faults; name them so humans can decide (point 4).

## 3. Using the points in a postmortem

- Reconstruct the timeline from the responders' point of view (8).
- List every contributing factor, including defenses that worked partially (2, 3, 7).
- Identify the latent conditions that were present before the trigger (4).
- Ask what policy ambiguity responders had to resolve in the moment (11) and write the policy down.
- Choose action items that change the system (15), and record what normal work kept the incident from being worse (17).

## Sources

- Richard I. Cook, How Complex Systems Fail: https://how.complexsystems.fail/ ; PDF: https://www.adaptivecapacitylabs.com/HowComplexSystemsFail.pdf
- Adrian Colyer, summary in The Morning Paper: https://blog.acolyer.org/2016/02/10/how-complex-systems-fail/
- Google SRE Book, Postmortem Culture: https://sre.google/sre-book/postmortem-culture/
