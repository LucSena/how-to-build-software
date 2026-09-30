# Outages — Real Postmortems Turned into Rules

Compact cases from public postmortems. Each: **What happened**, **Why** (contributing factors), **Rule**, **Source**. Pattern numbers refer to the ten patterns in `SKILL.md`. Facts are from the vendors' own postmortems unless noted; numbers the research could not verify are left out.

## Contents
- Deletions and backups: 1 GitLab 2017 · 2 Atlassian 2022 · 3 UniSuper 2024 · 4 Tests and cleanup jobs that hit production
- Tools with unbounded reach: 5 AWS S3 2017 · 6 Facebook 2021
- Config and data pushed globally: 7 Cloudflare 2019 · 8 Cloudflare Nov 2025 · 9 Cloudflare Dec 2025 · 10 Google Cloud Jun 2025 · 11 CrowdStrike 2024 · 12 Azure Front Door 2025 · 13 Fastly 2021 · 14 AWS Seoul DNS
- Races, failover, recovery storms: 15 AWS us-east-1 Oct 2025 · 16 GitHub 2018 · 17 Slack 2021 · 18 Roblox 2021
- Dead code and deploys: 19 Knight Capital 2012 · 20 CircleCI 2021 rollback
- Unreviewed changes: 21 Datadog 2023 and Heroku 2025 · 22 GitHub 2026 cache TTL
- Hidden limits and time: 23 INT32 and XID wraparound · 24 Certificates, leap days, leap seconds · 25 Shell variables and one-character bugs
- Where to find more

---

## Deletions and backups

### 1. GitLab.com database deletion (31 Jan 2017) — patterns 5, 10
**What happened.** Replication lag under spam load led an engineer, late at night, to wipe a secondary's data directory; minutes later, in a terminal connected to the primary, the same command deleted the production data. Restore came from a staging snapshot about six hours old; roughly 18 hours of downtime and about six hours of data changes lost (Git repositories were not affected).
**Why.** pg_dump backups had been failing silently because of a PostgreSQL version mismatch, and the failure emails were rejected by DMARC; disk snapshots were not enabled for the database servers; similar host names; a single tired operator at night.
**Rule.** Before any destructive data command, print the host, environment, and database, and confirm when the backup was last restored. Alert when backups fail *or stop running*, and test that the alert arrives.
**Source.** https://about.gitlab.com/2017/02/10/postmortem-of-database-outage-of-january-31/

### 2. Atlassian deletes 883 customer sites (5 Apr 2022) — patterns 5, 10
**What happened.** A script meant to delete a deprecated app was given site IDs instead of app IDs; the deletion API accepted both and deleted whatever it received. 883 sites (775 customers) were deleted in 23 minutes; restoring them took up to 14 days. Customer contact data was also deleted, which slowed communication.
**Why.** A communication gap between teams; an API accepting two identifier types; peer review checked the endpoint but not the IDs; restore tooling built for one site, not hundreds.
**Rule.** Destructive APIs accept one identifier type, soft-delete by default, and have a dry-run that lists resolved targets. Test disaster recovery at the scale of a mass mistake, not only one record.
**Source.** https://www.atlassian.com/engineering/post-incident-review-april-2022-outage

### 3. UniSuper private cloud deleted by a legacy default (May 2024) — patterns 5, 6
**What happened.** A Google Cloud VMware Engine private cloud for an Australian pension fund was provisioned with a legacy option that set a fixed term with automatic deletion. At the end of the term the private cloud, including its geographic redundancy, was deleted. Recovery took about two weeks and relied on backups held with another provider.
**Why.** An unset lifecycle parameter defaulted to delete; every in-provider copy shared one control plane.
**Rule.** Set lifecycle, expiry, TTL, and auto-delete parameters explicitly in IaC and flag any that can delete. Keep one backup outside the provider's control.
**Source.** https://cloud.google.com/blog/products/infrastructure/details-of-google-cloud-gcve-incident

### 4. Tests and cleanup jobs that hit production — patterns 5, 10
**What happened.** Travis CI 2018: an environment variable pointed a test run at production and the tests truncated production tables. Travis CI 2016: an age-based cleanup job deleted stable base VM images. Keepthescore 2020: the production database was deleted by accident; the provider's daily backup restored it with about seven hours of data lost.
**Why.** Production credentials reachable from test contexts; cleanup rules that match by age instead of an explicit allow-list.
**Rule.** Test setups refuse to run when the connection string matches a production pattern. Cleanup jobs target explicit labels and never delete the currently active version.
**Sources.** https://blog.travis-ci.com/2018-04-03-incident-post-mortem ; https://blog.travis-ci.com/2016-09-30-the-day-we-deleted-our-vm-images/ ; https://keepthescore.co/blog/posts/deleting_the_production_database/

## Tools with unbounded reach

### 5. AWS S3 us-east-1 (28 Feb 2017) — patterns 6, 10
**What happened.** Following an established playbook, an engineer ran a command to remove a few servers; a mistyped input removed many more, including the index and placement subsystems. Both needed full restarts that had not been done at that scale for years. S3 in us-east-1 and services depending on it were down for about four hours. The AWS status dashboard itself depended on S3.
**Why.** The tool allowed removing capacity quickly and below safe minimums; cold restarts were never exercised at current size; the status page shared the failure domain.
**Rule.** Ops tools remove capacity slowly and refuse to go below per-subsystem floors. Rehearse cold starts. Host the status page outside your own infrastructure.
**Source.** https://aws.amazon.com/message/41926/

### 6. Facebook global backbone outage (4 Oct 2021) — patterns 6, 10
**What happened.** A maintenance command meant to assess backbone capacity disconnected all data centers; an audit tool meant to block such commands had a bug. DNS servers that lost contact with the data centers withdrew their BGP routes by design, removing Facebook, Instagram, and WhatsApp from the Internet for hours. Internal tools depended on the same network, so engineers had to go on site, where physical security slowed them.
**Why.** A safety check with a bug; self-withdrawal logic with no floor; no out-of-band access.
**Rule.** Automated self-removal never withdraws the last healthy instances or regions. Keep a break-glass path that does not depend on the production network or identity system.
**Source.** https://engineering.fb.com/2021/10/05/networking-traffic/outage-details/

## Config and data pushed globally

### 7. Cloudflare WAF regex (2 Jul 2019) — patterns 1, 2, 9
**What happened.** A new WAF managed rule contained a regex with catastrophic backtracking. It deployed worldwide within seconds, pinned CPU on every HTTP server, and caused 27 minutes of global 502s.
**Why.** A regex CPU guard had been removed during an earlier refactor; tests did not measure CPU; WAF rules were allowed to deploy globally at once; internal tools depended on Cloudflare's own services.
**Rule.** Rules and config get staged rollouts like code. Use linear-time regex engines (RE2 class) for untrusted or operator-supplied patterns. Before refactoring, list every guard and carry it over.
**Source.** https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/

### 8. Cloudflare Bot Management feature file (18 Nov 2025) — patterns 2, 4, 8
**What happened.** A database permissions change made a metadata query return duplicate rows. The generated feature file doubled, exceeded a limit the proxy preallocated for, and the proxy code panicked. Widespread 5xx followed for hours; because the file regenerated every few minutes from partially updated nodes, the network flapped between good and bad.
**Why.** Internally generated config trusted without validation; a hard limit with no graceful handling; the query relied on permissions to scope its rows; fast global propagation; no global kill switch for the feature.
**Rule.** Validate generated files like user input (schema, size, cardinality); on failure keep the last-known-good file and alert. Scope generating queries explicitly instead of relying on permissions.
**Source.** https://blog.cloudflare.com/18-november-2025-outage/

### 9. Cloudflare killswitch (5 Dec 2025) — patterns 3, 1
**What happened.** While rolling out a larger request-body buffer to protect customers from a React Server Components vulnerability, engineers disabled an internal testing tool through the global (not gradual) config system. The killswitch hit a never-exercised path in the older proxy, and a Lua nil reference produced 500s for about 28% of HTTP traffic for about 25 minutes.
**Why.** An emergency lever that had never run; urgency routed the change through the instant global path.
**Rule.** Test disable paths and kill switches in CI. An urgent change gets a smaller blast radius, not a larger one.
**Sources.** https://www.thousandeyes.com/blog/cloudflare-outage-analysis-december-5-2025 ; https://blog.pragmaticengineer.com/the-pulse-cloudflares-latest-outage/

### 10. Google Cloud Service Control (12 Jun 2025) — patterns 2, 3, 7
**What happened.** A quota-policy feature rolled out weeks earlier without a feature flag or proper error handling. A policy change with blank fields replicated globally in seconds and triggered a null-pointer crash loop in every region. The fix ("red button") was out within about 40 minutes, but one large region took up to 2 h 40 m because restarting tasks without randomized backoff overloaded the database. Cloudflare Workers KV depended on Google Cloud storage, so Cloudflare Access logins and other services failed too. Google's status page was affected.
**Why.** An unflagged code path; blank fields not handled; global replication of data; no jitter on restart.
**Rule.** New paths in critical services sit behind a flag defaulting off. Globally replicated data is a global deploy: propagate it incrementally. Every retry and restart loop gets jittered backoff. Your provider's dependencies are yours.
**Sources.** https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW ; https://blog.cloudflare.com/cloudflare-service-outage-june-12-2025/

### 11. CrowdStrike Channel File 291 (19 Jul 2024) — patterns 2, 3
**What happened.** A content update for the kernel-mode Windows sensor crashed about 8.5 million machines into boot loops. The update was reverted in 78 minutes, but many machines needed hands-on recovery.
**Why.** A template type defined 21 input fields while the sensor supplied 20; earlier instances used wildcards so the mismatch stayed latent; the content validator had a bug; content was pushed to all sensors at once rather than staged like code, and customers could not delay it.
**Rule.** Producer and consumer of a schema share one definition or a contract test (field count, types). Content and config follow the same ring deployment as binaries. Parsers in privileged code bounds-check.
**Source.** https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf

### 12. Azure Front Door (29 Oct 2025) — pattern 2
**What happened.** An inadvertent tenant configuration change put Front Door nodes into an invalid state; Microsoft 365, the Azure portal, and many customer sites had errors for more than eight hours. A software defect let the invalid config bypass the validations that should have blocked it.
**Why.** The validation gate was itself broken; propagation was not halted by health signals quickly enough.
**Rule.** Validation is not enough: config pipelines need validation plus staged propagation plus automatic halt and rollback on health regression.
**Source.** https://www.thousandeyes.com/blog/microsoft-azure-front-door-outage-analysis-october-29-2025

### 13. Fastly (8 Jun 2021) — patterns 2, 3
**What happened.** A bug introduced by a deploy on 12 May was triggered on 8 Jun by one customer's valid config change; 85% of the network returned errors. Detection took about a minute; most services recovered within the hour.
**Why.** A latent bug waiting for a rare but valid input; one tenant's config could affect all tenants.
**Rule.** Isolate tenants (cells, bulkheads). Fuzz or property-test config parsers across the valid input space, not only examples.
**Source.** https://www.fastly.com/blog/summary-of-june-8-outage

### 14. AWS Seoul EC2 DNS resolver — patterns 2, 10
**What happened.** A config change removed the "minimum healthy hosts" setting; the system fell back to a very low default and in-VPC DNS failed for about 84 minutes.
**Rule.** Validate config semantically (missing safety values are errors, not defaults) and throttle host removal.
**Source.** https://aws.amazon.com/message/74876-2/

## Races, failover, recovery storms

### 15. AWS us-east-1 DynamoDB DNS race (19–20 Oct 2025) — patterns 6, 7
**What happened.** Two redundant DNS automation workers raced: a delayed one applied a stale plan after a newer one had cleaned it up, leaving DynamoDB's regional endpoint with an empty DNS record. DNS was fixed after about 2.5 hours, but EC2's lease manager then fell into "congestive collapse", load balancer health checks flapped, and full recovery took about 14.5 hours. Downstream, LaunchDarkly's recovery path fell back to cold caches that SDK retries overwhelmed, and incident.io's deploys stalled on a builder image pulled from Docker Hub, which runs on AWS.
**Why.** Check-then-act between redundant writers with no version fencing; recovery load exceeding normal load.
**Rule.** Concurrent updaters of shared state use conditional writes (compare-and-set, version columns, fencing tokens); cleanup never deletes the active version. Plan the recovery ramp: throttling, jitter, admission control, gradual cache warm-up.
**Sources.** https://aws.amazon.com/message/101925/ ; https://incident.io/blog/service-disruption-october-20th-2025

### 16. GitHub split-brain after a 43-second partition (21 Oct 2018) — patterns 5, 7
**What happened.** Network maintenance cut the East Coast hub off for 43 seconds; automation failed MySQL primaries over to the West Coast before some writes had replicated. The two sides diverged. GitHub chose data integrity over availability, paused webhooks and Pages, and restored from backups; the site was degraded for just over 24 hours, and restoring multiple terabytes took hours despite daily backup testing.
**Why.** Automatic cross-region failover with asynchronous replication; restore time at full size never measured against the need.
**Rule.** No automatic cross-region primary failover for asynchronously replicated databases without fencing and an agreed write-loss budget. Measure restore time at production size.
**Source.** https://blog.github.com/2018-10-30-oct21-post-incident-analysis/

### 17. Slack (4 Jan 2021) — patterns 6, 7
**What happened.** On the first workday after the holidays, AWS Transit Gateways did not scale fast enough and dropped packets. Health checks then replaced instances, autoscaling *removed* web servers because CPU looked low while requests were stuck on the network, and an emergency scale-up failed on an open-files limit and a quota, over the same degraded network.
**Why.** Automation that assumed healthy networking (gray failure); scale-in on a single metric; an untested emergency provisioning path.
**Rule.** Scale in more slowly than you scale out, with a floor, never on CPU alone. Load-test the provisioning path itself.
**Source.** https://slack.engineering/slacks-outage-on-january-4th-2021/

### 18. Roblox 73-hour outage (28–31 Oct 2021) — patterns 1, 6
**What happened.** Consul, used for service discovery, health, and locking, became unhealthy and took scheduling and secrets with it. Contributing causes were a relatively new Consul streaming feature under very high load and a pathological BoltDB freelist behavior. The monitoring stack ran on the same Consul, so the team was partly blind.
**Rule.** Enable new features in core infrastructure gradually with a documented off switch. Monitoring must not depend on what it monitors.
**Source.** https://blog.roblox.com/2022/01/roblox-return-to-service-10-28-10-31-2021/

## Dead code and deploys

### 19. Knight Capital (1 Aug 2012) — patterns 9, 10
**What happened.** New trading code reused a flag that once activated long-unused "Power Peg" code, still present and callable. A manual deploy missed one of eight servers; on that server the flag triggered the old code, which sent millions of orders in about 45 minutes and lost over $460M.
**Why.** Dead code left in production; a flag's meaning reused; manual, unverified deploys; no automated kill switch or risk limit. (Allspaw cautions against the hindsight in the regulator's account.)
**Rule.** Never reuse a flag, enum value, protobuf field number, or column; retire the old one (`reserved`). Delete dead code. Verify after deploy that every instance runs the expected version.
**Sources.** https://www.sec.gov/files/litigation/admin/2013/34-70694.pdf ; https://www.kitchensoap.com/2013/10/29/counterfactuals-knight-capital/

### 20. CircleCI rollback that did not roll back (8 Nov 2021) — pattern 1
**What happened.** A deploy changed a database field's type. Rolling back left rows written between the deploys unreadable to the old code, so the rollback did not restore service.
**Rule.** Every change states whether rollback is data-compatible. Deploy readers that understand both formats before the writer changes format (expand/contract).
**Source.** https://discuss.circleci.com/t/incident-report-november-8-2021-jobs-stuck-in-a-not-running-state/41890

## Unreviewed changes

### 21. Automatic OS updates flush Kubernetes routes: Datadog 2023, Heroku 2025 — patterns 1, 6
**What happened.** Datadog (8 Mar 2023): an automatic systemd security update through a legacy channel restarted `systemd-networkd`, which deleted routes managed by the CNI; tens of thousands of nodes dropped offline in every region at once because all regions shared one update window. Heroku (10 Jun 2025): the same failure class, from an Ubuntu update that should have been disabled; some customers were down up to 24 hours, and Heroku's status page and internal tools ran on the affected infrastructure.
**Rule.** Disable unattended upgrades on production images; roll OS updates through the normal pipeline in rings; never share an update window across regions. Read other companies' postmortems.
**Sources.** https://www.datadoghq.com/blog/2023-03-08-multiregion-infrastructure-connectivity-issue/ ; https://www.heroku.com/blog/summary-of-june-10-outage/

### 22. GitHub auth database and a cache TTL (Feb–Mar 2026) — patterns 1, 8
**What happened.** Two client apps had quietly grown read traffic 10×. A weekend change cut a user-settings cache TTL from 12 hours to 2; at Monday peak the extra refills and writes overwhelmed the core auth database, cascading to the site, API, Actions, and Copilot.
**Rule.** TTLs, timeouts, pool sizes, and rate limits are capacity settings: estimate the load effect, roll out gradually, and not before a weekend or peak.
**Source.** https://github.blog/news-insights/company-news/addressing-githubs-recent-availability-issues-2/

## Hidden limits and time

### 23. INT32 keys, transaction-ID wraparound, file-size caps — pattern 8
**What happened.** GitHub (May 2021): a foreign key on a tokens table hit the INT32 maximum; Actions and Pages failed for 9 h 48 m while a migration to 64-bit ran. Sentry (2015) and Mandrill (2019): Postgres transaction-ID wraparound forced protective shutdown or read-only mode for most of a day or more. Instapaper (2017): a 2 TB per-file limit in managed MySQL took the service down for many hours.
**Rule.** Use 64-bit keys by default. Alert on percent-to-limit for sequences, XID age, disk, quotas, and file sizes at 50% and 80%. List hard limits in the design doc.
**Sources.** https://github.blog/news-insights/company-news/github-availability-report-may-2021/ ; https://blog.sentry.io/2015/07/23/transaction-id-wraparound-in-postgres ; https://mailchimp.com/what-we-learned-from-the-recent-mandrill-outage/ ; https://medium.com/making-instapaper/instapaper-outage-cause-recovery-3c32a7e9cc5f

### 24. Certificates, leap days, leap seconds — pattern 8
**What happened.** Mozilla (May 2019): an expired intermediate signing certificate disabled nearly all Firefox add-ons. Azure (29 Feb 2012): certificate code computed "one year later" by incrementing the year, producing 29 Feb 2013, and the invalid date cascaded into an outage. Cloudflare DNS (1 Jan 2017): a leap second made a wall-clock duration negative, and a random-number call panicked on it.
**Rule.** Monitor certificate, token, and domain expiry at least 30 days ahead and automate renewal, including on internal and security tooling. Use monotonic clocks for durations and a tz-aware library for calendar math. Test on 29 Feb, DST transitions, and 2038-01-19.
**Sources.** https://hacks.mozilla.org/2019/07/add-ons-outage-post-mortem-result/ ; https://azure.microsoft.com/en-us/blog/summary-of-windows-azure-service-disruption-on-feb-29th-2012/ ; https://blog.cloudflare.com/how-and-why-the-leap-second-affected-cloudflare-dns/

### 25. Shell variables and one-character bugs — patterns 3, 10
**What happened.** Steam for Linux (2015): `rm -rf "$STEAMROOT/"*` ran with an empty variable and deleted users' files. AT&T (1990): a misplaced `break` in C recovery code cascaded across the long-distance switching network. AWS SimpleDB: a too-aggressive timeout made healthy nodes remove themselves and deadlocked recovery.
**Rule.** In shell: `set -euo pipefail`, quote variables, guard with `: "${DIR:?}"`, and never combine force or quiet flags with dynamically built paths. Recovery code is code: test it.
**Sources.** https://github.com/valvesoftware/steam-for-linux/issues/3671 ; http://users.csc.calpoly.edu/~jdalbey/SWE/Papers/att_collapse.html ; https://aws.amazon.com/message/65649/

## Where to find more

- Collections of public postmortems: https://github.com/danluu/post-mortems ; https://github.com/icco/postmortems ; https://github.com/snakescott/awesome-tech-postmortems
- Kubernetes failure stories (moved from k8s.af): https://codeberg.org/hjacobs/kubernetes-failure-stories — recurring themes include CPU throttling from limits, missing memory limits, cluster DNS, admission webhooks that block deploys when down, and upgrades without a rollback path.

## Sources

All case URLs are listed inline above. Case links were found through danluu/post-mortems and icco/postmortems (used for facts and links only). Google SRE on changes as the main outage trigger: https://sre.google/sre-book/introduction/
