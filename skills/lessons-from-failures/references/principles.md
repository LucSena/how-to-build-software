# Principles — Why Systems, Projects, and Designs Fail

The ideas behind the rules in this skill, each with the case it explains and the rule it produces. Use them to explain a failure, to write the analysis section of a postmortem, or to argue for a guardrail.

## Contents
1. Resilience engineering and human error: Cook, Dekker, Allspaw, Vaughan, Google SRE
2. Distributed-systems failure research: Yuan et al., metastable failures, gray failure, cascading failure
3. AWS Builders' Library lessons
4. Laws and heuristics: Hyrum, Gall, Chesterton, Conway, Brooks, Postel, fallacies of distributed computing
5. Technology choice and scope: boring technology, worse is better, rewrites

---

## 1. Resilience engineering and human error

### Richard Cook, "How Complex Systems Fail" (1998)
Eighteen short observations from medicine that describe production software well. The ones that change behavior most: failure needs several contributing faults lining up; latent faults are always present; systems always run partly broken; there is no single root cause; hindsight bias makes practitioners look careless; operators are both producers of failure and its main defense; every change creates new ways to fail. The full list with an engineering rule per point is in `reliability` (`references/complex-systems.md`); do not restate all 18 in a postmortem — cite the two or three that explain the incident.
Source: https://how.complexsystems.fail/

### Sidney Dekker, *The Field Guide to Understanding 'Human Error'*
The "old view" treats human error as the cause of failure; the "new view" treats it as a symptom of trouble deeper in the system. Investigators ask why an action **made sense to the person at the time** (local rationality), avoid counterfactuals ("they should have…"), and look for goal conflicts such as speed versus safety.
*Use it:* in a postmortem, replace "the engineer failed to check the host" with "the prompt looked identical on both hosts, and nothing in the tool showed which one was primary".

### John Allspaw, "Blameless PostMortems and a Just Culture" (Etsy, 2012)
If engineers are punished for giving detailed accounts of their mistakes, they stop giving them, and the organization loses the information it needs to prevent the next one. A just culture balances safety and accountability: people are accountable for giving the account, not blamed for the outcome. Allspaw's critique of the regulator's account of Knight Capital shows how counterfactual language ("should have", "failed to") hides the real conditions.
Sources: https://www.etsy.com/codeascraft/blameless-postmortems ; https://www.kitchensoap.com/2013/10/29/counterfactuals-knight-capital/

### Diane Vaughan, normalization of deviance (*The Challenger Launch Decision*, 1996)
O-ring erosion was seen on earlier shuttle flights; each time it did not cause disaster it was re-labeled acceptable risk, until Challenger. Software equivalents: flaky tests re-run until green, alerts muted because "that one always fires", warnings ignored because "it has been like that for months", operators trained to press "proceed" (Therac-25). Feynman's appendix to the Rogers Commission report makes the related point that reality must take precedence over public relations.
*Use it:* in reviews and postmortems, list accepted anomalies explicitly; each one is a latent fault.
Source: https://www.refsmmat.com/files/reflections.pdf

### Google SRE on postmortems and on twenty years of lessons
Postmortem culture: write one for defined triggers (user-visible downtime, data loss, on-call intervention, long resolution, monitoring failure), keep it blameless, give every action item an owner and priority, and share widely. The twenty-years essay adds: canary all changes, including "safe" config; know your big red button before a risky change; test recovery mechanisms before the emergency; keep communication channels that do not depend on your own stack; scale the risk of a mitigation to the severity of the outage; unit tests are not enough.
Sources: https://sre.google/sre-book/postmortem-culture/ ; https://sre.google/workbook/postmortem-culture/ ; https://sre.google/resources/practices-and-processes/twenty-years-of-sre-lessons-learned/

## 2. Distributed-systems failure research

### Yuan et al., "Simple Testing Can Prevent Most Critical Failures" (OSDI 2014)
A study of 198 user-reported failures in Cassandra, HBase, HDFS, Hadoop MapReduce, and Redis. 92% of catastrophic failures came from incorrect handling of non-fatal errors the code had explicitly signaled; in 58% of the catastrophic cases, simple testing of the error-handling code would have found the bug. Most reproduced with three or fewer nodes. Typical culprits: handlers that ignore the error, handlers that abort the whole system on an overly general exception, and handlers still containing TODO or FIXME.
*Rules:* no empty catch; no process-wide abort for a local, recoverable error; no TODO in handlers; a test for every error branch (fault injection where needed); review error handling as the most important code in the diff.
Sources: https://www.usenix.org/conference/osdi14/technical-sessions/presentation/yuan ; https://blog.acolyer.org/2016/10/06/simple-testing-can-prevent-most-critical-failures/

### Metastable failures (Bronson et al., HotOS 2021; Huang et al., OSDI 2022)
A trigger pushes a system into a bad state, and a **sustaining effect** keeps it there after the trigger is gone. The most common sustaining effect is retries (work amplification); others are cold caches after a restart and garbage-collection thrashing. Huang et al. found 22 such incidents across 11 organizations. Escaping takes strong action: shed load, drop retries, or reduce load below the *recovery* threshold, which is lower than the load that triggered the failure.
*Cases:* AWS Oct 2025 (EC2 lease manager "congestive collapse"), Google Cloud Jun 2025 (restart herd), LaunchDarkly Oct 2025 (SDK retries against a cold fallback path).
*Rules:* retry budgets; circuit breakers; jittered backoff on retries, reconnects, and restarts; load shedding that favors finishing admitted work; gradual cache warm-up; admission control during recovery.
Sources: https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s11-bronson.pdf ; https://www.usenix.org/system/files/osdi22-huang-lexiang.pdf

### Gray failure (Huang et al., Microsoft, HotOS 2017)
**Differential observability**: the failure detector sees a component as healthy while its clients see it failing (slow disks, packet loss, partial crashes). Many major cloud incidents started as gray failures that limped along.
*Case:* Slack Jan 2021 — autoscaling saw low CPU while requests were stuck on a degraded network, and removed servers.
*Rules:* readiness checks exercise the real dependency path, separate from a shallow liveness check; monitor from the client's side (synthetic probes, client error rates); sometimes a component that limps should be made to fail cleanly.
Source: https://www.microsoft.com/en-us/research/wp-content/uploads/2017/06/paper-1.pdf

### Cascading failures (Google SRE book)
Cascades come from overload, resource exhaustion, retry amplification, and slow startup. Mitigations: load shedding, graceful degradation, deadlines, and retry budgets. Implementation lives in `reliability`.
Source: https://sre.google/sre-book/addressing-cascading-failures/

## 3. AWS Builders' Library lessons

- **Static stability.** The data plane keeps working on its last-known state when the control plane is down; pre-provision so losing a zone needs no control-plane action. Counter-examples: Slack 2021 and AWS 2025, where recovery needed control-plane work under stress. https://aws.amazon.com/builders-library/static-stability-using-availability-zones/
- **Avoid fallback.** Fallback paths are rarely exercised, so they hide latent bugs and often add load to a stressed system. Make the primary path more reliable, or exercise the fallback all the time. https://aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/
- **Rollback safety.** Change formats in two phases: first deploy a reader that understands both, then the writer (CircleCI 2021 is the counter-example). https://aws.amazon.com/builders-library/ensuring-rollback-safety-during-deployments/
- **Safe, hands-off deployments.** Waves: one box, one zone, one region, then more; bake time; automatic rollback on alarms; never all regions at once. https://aws.amazon.com/builders-library/automating-safe-hands-off-deployments/
- **Constant work.** A system that does the same work regardless of load or change rate (for example, pushing the full config every N seconds) has no rare mode to surprise you. https://aws.amazon.com/builders-library/reliability-and-constant-work/
- **Queue backlogs.** During recovery, consider serving newest work first or dropping stale work, and keep per-tenant fairness. https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/

## 4. Laws and heuristics

- **Hyrum's law.** With enough users, every observable behavior of an API is depended on by somebody. *Rule:* treat ordering, timing, error text, and field presence as potentially breaking; ship changes behind versioning or flags with deprecation notice. https://www.hyrumslaw.com/
- **Gall's law.** A complex system that works evolved from a simple system that worked; one designed from scratch never works and cannot be patched into working. Explains NPfIT and HealthCare.gov.
- **Chesterton's fence.** Do not remove something until you know why it is there. Cloudflare 2019 removed a regex CPU guard; Knight left dead code standing but reused its switch. *Rule:* check `git log -S`, blame, and issues before deleting a guard; if the reason is unknown, keep it or remove it behind a flag.
- **Conway's law.** Systems mirror the communication structure of the organization that builds them. Services without matching team boundaries buy coordination cost without autonomy; the Atlassian deletion began with a communication gap between teams.
- **Brooks's law and the second-system effect.** See `project-failures.md`.
- **Postel's law, with a caution.** Being liberal in what you accept creates ambiguity that attackers and bad data exploit. Be strict and validate at the boundary — including for internally generated data (Cloudflare Nov 2025).
- **Fallacies of distributed computing.** The network is not reliable, latency is not zero, bandwidth is not infinite, topology changes. GitHub 2018 (partition and latency) and Slack 2021 (bandwidth) are textbook cases.
- **Kernighan's law.** Debugging is twice as hard as writing the code, so code written at the limit of your cleverness cannot be debugged.
Source for the laws: https://github.com/dwmkerr/hacker-laws

## 5. Technology choice and scope

- **Choose boring technology (Dan McKinley, 2015).** Each organization has a few "innovation tokens"; boring technology has known failure modes, new technology has unknown ones, and the real cost of a technology is operating it. Roblox 2021 (a new streaming feature in core service discovery under extreme load) shows the cost. https://mcfunley.com/choose-boring-technology
- **Worse is better (Richard Gabriel).** Implementation simplicity spreads and improves in place; ship the simple thing that works and let use drive the next step — but "worse" never means unsafe. https://www.dreamsongs.com/WorseIsBetter.html
- **Things you should never do (Spolsky, 2000).** Rewriting from scratch throws away the knowledge encoded in old code. See `project-failures.md`.

## Sources

All sources are inline above. Laws summarized from https://github.com/dwmkerr/hacker-laws (CC BY-SA 4.0; facts only, wording original).
