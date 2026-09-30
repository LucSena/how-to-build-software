# Postmortem Rules — Defenses the Big Outages Taught

Rules that public postmortems keep repeating and that the rest of this skill does not already spell out. Each rule names the incidents behind it; the full case write-ups (what happened, why, source) live in the `lessons-from-failures` skill.

## Contents
1. Stage config, flag, and data pushes like code
2. Keep serving on last-known-good config
3. Test the error-handling paths and the emergency levers
4. Prove restores at the scale of a mass mistake
5. Break circular dependencies — including the status page
6. Plan the recovery, not just the fix (metastable failures)
7. Find hidden hard limits before they find you
8. Bound what one action can do
9. Treat capacity knobs as changes

---

### Stage config, flag, and data pushes like code
**Rule.** Config files, feature-flag flips, WAF or routing rules, policy records, generated data files, and OS package updates go through the same rings as binaries: one cell or host, a small percentage, one region, then global, with bake time and automatic halt on health regression.
**Apply when.** Anything changes production behavior without a code deploy — especially through a system that propagates "instantly".
**Do / Avoid.** Do: roll a new rules file to one POP, watch error rate and CPU for 10 minutes, then widen. Avoid: a config system whose only mode is global in seconds.
**Why.** Change is the main outage trigger, and config skips code's safety net: Cloudflare 2019 (WAF regex, global in seconds), CrowdStrike 2024 (content update to all sensors at once), Google Cloud 2025 (policy data replicated globally), Azure Front Door 2025 (invalid config bypassed a broken validation gate — validation alone is not enough).

### Keep serving on last-known-good config
**Rule.** Code that loads config or data at runtime validates schema, size, and cardinality; on invalid input it keeps the previous version, emits an alert, and never panics or throws uncaught. Decide per component whether failure opens or closes, and write it down.
**Apply when.** Any runtime reload of config, feature files, rules, ML features, allow-lists, or routing tables — including files your own pipelines generate.
**Do / Avoid.** Do: `if !valid(newFile) { metrics.inc("config_rejected"); keep(current) }`. Avoid: `unwrap()` or an uncaught exception on a parse or size-limit error.
**Why.** Cloudflare Nov 2025: an internally generated file doubled in size, exceeded a preallocated limit, and the proxy crashed on it everywhere. Internally generated data is still input (fail static).

### Test the error-handling paths and the emergency levers
**Rule.** Every error branch, kill switch, fallback, and rollback path has an automated test. No empty catch, no TODO in handlers, no process-wide abort for a local recoverable error. New code paths in critical services sit behind a flag that defaults off, and the off path is tested.
**Apply when.** Writing or reviewing error handling, adding a kill switch or fallback, or adding a new path to a critical service.
**Do / Avoid.** Do: fault-injection tests that make the dependency fail and assert the degraded behavior; a CI job that flips each kill switch. Avoid: a `catch (e) {}` or a kill switch first used during an incident.
**Why.** Yuan et al. (OSDI 2014): 92% of catastrophic failures in the systems studied came from mishandled, explicitly signaled errors, and most would have been caught by simple tests. Cloudflare Dec 2025: a never-exercised killswitch path returned 500s for about 28% of HTTP traffic. Google Cloud 2025: an unflagged path with no error handling crashed on blank fields.

### Prove restores at the scale of a mass mistake
**Rule.** Beyond routine restore drills (see `safe-change.md`), rehearse restoring *many* tenants or objects at once, alert when backup jobs fail **or stop running**, test that the alert reaches a human, and keep one copy outside the blast radius (other account or provider, other credentials, not the same volume or IaC state).
**Apply when.** Setting RPO/RTO, reviewing backup jobs, or granting any tool or agent delete rights.
**Do / Avoid.** Do: a quarterly drill restoring 100 tenants in parallel, timed against RTO. Avoid: backups whose failure emails go to an unmonitored or filtered address.
**Why.** GitLab 2017: backups had failed silently and the failure emails were rejected. Atlassian 2022: 883 sites deleted; restores built for one site took up to 14 days. UniSuper 2024 and PocketOS 2026: survival depended on whether a copy lived outside the deleted scope.

### Break circular dependencies — including the status page
**Rule.** List what you need in order to detect, communicate, and fix an outage — monitoring, alerting, paging, status page, incident chat, CI images, DNS, identity, secrets — and host each outside the failure domain it watches. Keep a break-glass access path that does not depend on production network or identity.
**Apply when.** Designing observability, choosing where to host the status page or incident tooling, or reviewing a platform migration.
**Do / Avoid.** Do: status page on an independent provider; monitoring cluster not registered in the service discovery it monitors. Avoid: a status page served by the platform it reports on.
**Why.** AWS S3 2017 (status dashboard depended on S3), Facebook 2021 (internal tools needed the network that was down), Roblox 2021 (monitoring ran on the failed Consul), Heroku 2025 (status page on the affected infrastructure), incident.io 2025 (builds pulled images from a registry hosted on the failing cloud).

### Plan the recovery, not just the fix (metastable failures)
**Rule.** Design how the system comes back: jittered backoff on retries, reconnects, and restarts; retry budgets; admission control that lets load in gradually; caches that warm before taking full traffic; load shedding that favors finishing admitted work. Know that recovery load is often lower than the load that triggered the failure.
**Apply when.** Any dependency outage plan, startup path, cache design, or client SDK retry policy.
**Do / Avoid.** Do: ramp traffic 10% → 25% → 50% after an outage while caches fill. Avoid: every task restarting at once with immediate reconnects.
**Why.** Metastable failures (Bronson et al. 2021; Huang et al. OSDI 2022): a sustaining effect, usually retries, keeps the system down after the trigger is gone. AWS Oct 2025: DNS fixed in about 2.5 hours, full recovery about 14.5 hours. Google Cloud 2025: restarts without jitter overloaded the database.

### Find hidden hard limits before they find you
**Rule.** Use 64-bit primary and foreign keys by default. Alert on percent-to-limit at 50% and 80% for sequences, Postgres transaction-ID age, disk, quotas, file-size caps, and preallocated buffers. Monitor certificate, token, and domain expiry at least 30 days ahead with automated renewal. Test date code on 29 Feb, DST changes, and 2038-01-19. List hard limits in the design doc.
**Apply when.** Creating tables, sizing buffers, adding a quota-bound dependency, or handling certificates and time.
**Do / Avoid.** Do: `bigint` IDs and an XID-age alert. Avoid: `int` IDs on a table that grows with usage.
**Why.** GitHub 2021 (INT32 key; 9 h 48 m of failures), Sentry 2015 and Mandrill 2019 (XID wraparound), Instapaper 2017 (2 TB file limit), Mozilla 2019 (expired certificate), Azure 2012 (leap-day math).

### Bound what one action can do
**Rule.** Tools and APIs that remove capacity or delete data have dry runs that print resolved targets, per-run caps, rate limits, minimum-capacity floors, and accept one kind of identifier. Deletes are soft by default. Automated self-removal never withdraws the last healthy instances. Irreversible mass actions need a second person.
**Apply when.** Writing ops tooling, admin endpoints, cleanup jobs, bulk scripts, or health-driven automation.
**Do / Avoid.** Do: `remove-hosts --dry-run` showing 3 hosts, refusing below the subsystem minimum. Avoid: a "remove N" command that silently accepts any N.
**Why.** AWS S3 2017 (a typo removed far more servers than intended; the tool now removes capacity slowly and enforces minimums), Atlassian 2022 (a delete API accepted site IDs as well as app IDs), Facebook 2021 (self-withdrawal had no floor). The fix for "human error" is a bounded blast radius, not more care.

### Treat capacity knobs as changes
**Rule.** Changes to cache TTLs, timeouts, pool sizes, autoscaling policies, and rate limits get a written load estimate and a gradual rollout, and never go out just before a weekend or peak. Scale in more slowly than you scale out, with a floor, and not on CPU alone.
**Apply when.** Tuning any setting that changes how much work reaches a dependency.
**Do / Avoid.** Do: "TTL 12 h → 2 h means up to 6× more refills on the auth DB; roll to 10% Tuesday morning". Avoid: a Saturday TTL tweak with no estimate.
**Why.** GitHub 2026 (a weekend TTL cut overwhelmed the auth database at Monday peak), Slack 2021 (autoscaling removed servers because CPU looked low while requests were stuck).

## Sources

- Google SRE, changes as the main outage trigger: https://sre.google/sre-book/introduction/
- Yuan et al., OSDI 2014: https://www.usenix.org/conference/osdi14/technical-sessions/presentation/yuan
- Metastable failures: https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s11-bronson.pdf ; https://www.usenix.org/system/files/osdi22-huang-lexiang.pdf
- AWS Builders' Library (static stability, avoiding fallback, safe deployments): https://aws.amazon.com/builders-library/
- Cloudflare 2019: https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/ ; Nov 2025: https://blog.cloudflare.com/18-november-2025-outage/ ; Dec 2025: https://www.thousandeyes.com/blog/cloudflare-outage-analysis-december-5-2025
- CrowdStrike RCA: https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf
- Google Cloud Jun 2025: https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW
- AWS S3 2017: https://aws.amazon.com/message/41926/ ; AWS Oct 2025: https://aws.amazon.com/message/101925/
- GitLab 2017: https://about.gitlab.com/2017/02/10/postmortem-of-database-outage-of-january-31/
- Atlassian 2022: https://www.atlassian.com/engineering/post-incident-review-april-2022-outage
- Facebook 2021: https://engineering.fb.com/2021/10/05/networking-traffic/outage-details/
- Roblox 2021: https://blog.roblox.com/2022/01/roblox-return-to-service-10-28-10-31-2021/
- Heroku 2025: https://www.heroku.com/blog/summary-of-june-10-outage/
- GitHub INT32 2021: https://github.blog/news-insights/company-news/github-availability-report-may-2021/ ; GitHub 2026: https://github.blog/news-insights/company-news/addressing-githubs-recent-availability-issues-2/
- Slack 2021: https://slack.engineering/slacks-outage-on-january-4th-2021/
