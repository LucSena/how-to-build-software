# Platform Decision

Where to run it: PaaS, managed containers, containers on VMs, serverless, managed Kubernetes, or edge. Includes the questions to ask, Kubernetes essentials and failure patterns, VM deploys with Kamal, serverless and edge trade-offs, and cost basics. Provider facts are as of 2026-09; check current pricing and status before quoting.

## Contents
1. Decision questions
2. Platform comparison
3. Kubernetes: when, and what bites
4. Resources, probes, DNS
5. Containers on VMs (Kamal and friends)
6. Serverless and edge
7. Cost basics
8. Rules catalog

## 1. Decision questions

Ask in order; stop at the first platform that satisfies all of them.

1. **Who operates it?** Is there a platform or SRE owner? No → PaaS or managed containers.
2. **Traffic shape?** Spiky or idle → scale-to-zero (serverless, managed containers). Steady → containers on VMs or reserved capacity.
3. **State and connections?** WebSockets, long jobs, many DB connections → avoid pure FaaS or add a pooler/proxy.
4. **Compliance, residency, networking?** Private links, VPC peering, fixed egress IPs, data residency → a major cloud or a PaaS that offers them.
5. **Cost at 10× and team cost?** For small teams, people cost more than machines.
6. **Lock-in tolerance?** OCI containers, the Postgres wire protocol, S3-compatible storage, OpenTelemetry, and IaC in the repo keep exits open.
7. **What does the organization already run well?** Operational familiarity beats theoretical fit.

## 2. Platform comparison

| Option | Examples | Ops burden | Scaling | Cost profile | Best for | Avoid when |
|---|---|---|---|---|---|---|
| PaaS | Render, Railway, Fly.io, Vercel/Netlify (web), Azure App Service, Google App Engine | Lowest | Automatic or simple | Higher unit price, low fixed | Startups, small teams, most CRUD SaaS; previews built in | Exotic networking, GPUs, strict compliance or residency not offered |
| Managed containers | Cloud Run, ECS Fargate, App Runner, Azure Container Apps | Low | Request/CPU based; some scale to zero | Pay per use | Containerized services without a platform team | Host-level control; very large numbers of long-lived connections |
| Containers on VMs | Kamal, Docker Compose on a VM, Nomad | Medium (OS patching, backups) | Manual or scripted | Cheapest at steady load, especially bare metal | Predictable traffic, cost-sensitive, few services | Spiky global traffic, many teams |
| Managed Kubernetes | EKS, GKE, AKS | High (upgrades, add-ons, networking, policies) | Very flexible | Cluster overhead plus people | Many services and teams, platform team, operators, custom scheduling, multi-tenant isolation, portability | A handful of services and no one to own the platform |
| Functions (FaaS) | AWS Lambda, Cloud Functions, Azure Functions | Low | Per request, to zero | Great for spiky/low volume; can exceed containers at sustained load | Glue, event handlers, webhooks, scheduled tasks, spiky APIs | Long-running, cold-start-sensitive, connection-heavy workloads |
| Edge functions | Cloudflare Workers, Vercel/Netlify Edge, Deno Deploy | Low | Global | Per request | Auth checks, redirects, personalization, cached reads near users | Node-only libraries, long CPU, data far from the edge |

Status note (as of 2026-09): in February 2026 Salesforce announced Heroku would move to a "sustaining engineering" model (no new features); check its current status before choosing it for a new project.

## 3. Kubernetes: when, and what bites

**Choose it when** a platform owner exists and at least one of these is true:
- Many services across several teams need one deploy/runtime contract.
- You need operators, custom scheduling, GPU scheduling, or multi-tenant isolation that managed options lack.
- Portability across clouds or on-prem is a real requirement.
- The organization already runs Kubernetes well.

Kelsey Hightower's framing — Kubernetes is a platform for building platforms — is the test: if you are not building a platform, you probably want one someone else built. The Twelve-Factor community's "Narrow Conduits" post argues orchestration YAML is the wrong interface between application developers and the platform; keep app code independent of it.

**Recurring failure patterns** (Henning Jacobs' Kubernetes Failure Stories, k8s.af):

| Pattern | Examples from the collection | Defense |
|---|---|---|
| DNS | Zalando's total DNS outage (CoreDNS OOMKilled, `ndots:5` amplification, retries); Toyota Connected "perfect DNS storm" (ndots plus Alpine/musl) | Lower `ndots`, FQDNs with trailing dot, NodeLocal DNSCache, sized CoreDNS, capped retries |
| CPU throttling | Talks from Zalando and others on CFS quota throttling | Omit CPU limits on latency-sensitive services, or watch throttling metrics |
| OOM and node pressure | Missing limits, eviction thresholds, one job consuming a node | Memory request = limit; right-size from usage |
| Scheduling | All replicas scheduled to one failing host | Topology spread or anti-affinity; PodDisruptionBudgets |
| Cluster upgrades | A planned 2-hour upgrade that took 7 hours with ingress loss | Rehearse upgrades; surge capacity; blue/green clusters for big jumps |
| Ingress/load balancer config | A templating line in an ingress config; `externalTrafficPolicy` plus node drain | Review ingress changes as risky config; stage them |
| Probes | Liveness probes causing restart loops | Liveness checks only the process |
| CronJobs | CronJob storms | `concurrencyPolicy: Forbid`, deadlines, history limits |

## 4. Resources, probes, DNS

**Requests and limits** (Kubernetes docs): CPU limits are enforced by **throttling** — a hard ceiling even when the node is idle; memory limits by **OOM kill**.
- Always set CPU and memory **requests** (they drive scheduling and cost).
- Memory: request = limit, and set the runtime heap below it (Node `--max-old-space-size`, JVM `-XX:MaxRAMPercentage`).
- CPU limit: a genuine trade-off. Many teams omit it for latency-sensitive services to avoid throttling; shared multi-tenant clusters often keep limits for fairness. If you keep limits, alert on throttling (`container_cpu_cfs_throttled_*`).
- Right-size from observed usage (VPA recommendations, metrics), not guesses.

**Probes.** Readiness = can take traffic now; liveness = process is wedged; startup probe for slow boots. Liveness never checks dependencies.

**Shutdown race.** Endpoint removal and SIGTERM happen at the same time, so pods can receive requests after SIGTERM, causing deploy-time 502s. Add a `preStop` sleep of a few seconds (the native `sleep` lifecycle action runs in the kubelet, so distroless images without a shell work; on clusters without it, an `exec` sleep needs a shell). `terminationGracePeriodSeconds ≥ preStop + drain + buffer`.

**Availability.** `maxUnavailable: 0` rolling updates, a PodDisruptionBudget, and topology spread across zones.

**DNS `ndots:5`.** The default pod resolver tries cluster search domains first for any name with fewer than five dots, so `api.stripe.com` becomes several failed lookups (times two for A and AAAA) before the real one. Fixes: `dnsConfig.options: [{ name: ndots, value: "2" }]`, a trailing dot on external FQDNs, NodeLocal DNSCache, and connection reuse.

## 5. Containers on VMs (Kamal and friends)

- **Kamal** (from 37signals) deploys Docker containers to any servers over SSH. Kamal 2 uses its own kamal-proxy for zero-downtime switches and Let's Encrypt TLS; during a deploy the proxy polls the health path (default `/up`) and switches traffic only after the new container passes.
- 37signals runs its products this way on owned hardware, without Kubernetes.
- VM checklist: immutable images with health-gated switch; at least two hosts behind a load balancer for zero downtime; automated OS patching and reboots; backups with restore drills; secrets from a manager, not files in the repo; log shipping; host firewall that accounts for Docker-published ports bypassing UFW (OWASP Docker cheat sheet); disk monitoring and image pruning.

## 6. Serverless and edge

- **Cold starts.** Shrink bundles, lazy-load heavy modules, use provisioned concurrency or minimum instances for latency-critical paths.
- **Billing change (as of 2025-08-01).** AWS now bills Lambda's INIT phase for ZIP-packaged managed runtimes like invocation duration (it was already billed for container images, custom runtimes, and provisioned concurrency); AWS expects minimal impact for most users because cold starts are a small share of invocations. Heavy initialization is now a direct cost.
- **Limits.** Timeouts, payload sizes, ephemeral disk, concurrency quotas — check per provider and design long work as queued steps or durable workflows.
- **Database connections.** Many concurrent instances exhaust Postgres connections; use a pooler (PgBouncer, RDS Proxy) or an HTTP-based serverless driver.
- **Cost cliff.** Per-request pricing wins for spiky or low traffic; at sustained high utilization, containers or VMs usually cost less.
- **Edge.** A subset of runtime APIs (Web APIs, not full Node), CPU/time limits, and data locality: edge compute far from the primary database can be *slower* because every query crosses to the origin region, unless data is replicated or cached at the edge.
- **Observability.** Flag cold starts in traces; alarm on per-function concurrency and throttles; dead-letter queues on async invocations.

## 7. Cost basics

- Treat unit cost (per request, tenant, active user) as a non-functional requirement.
- Tag every resource with `env`, `service`, `owner`, `cost-center`; set budgets and anomaly alerts per account; separate accounts per environment make per-environment bills free.
- Silent drivers: internet egress, cross-AZ and cross-region transfer, NAT gateway processing, always-on non-prod and preview environments, orphaned volumes, snapshots, load balancers and IPs, log ingestion and high-cardinality metrics, trace sampling set too high in non-prod.
- Non-prod: scale to zero or schedule off-hours shutdown; smaller database tiers with the same engine and version; TTLs on previews.
- CI: cache aggressively, cancel superseded runs, right-size runners, avoid full e2e on every push to every branch.
- Kubernetes: requests drive node count; cluster autoscaler plus bin packing; clean up idle namespaces.
- **Owning hardware can win at steady scale.** 37signals left AWS compute in 2023 and moved about 18 PB off S3 to its own storage in 2025, expecting about $1.3M a year in savings and raising its five-year savings estimate above $10M; AWS waived roughly $250k of egress fees for the exit. Two lessons: egress pricing is a lock-in lever, and the calculation only works for large, predictable workloads with an ops team — not as a startup default.

## 8. Rules catalog

### Name the trigger before choosing Kubernetes
**Rule.** Recommend Kubernetes only when a listed trigger is true and a platform owner exists; otherwise choose PaaS, managed containers, or Kamal.
**Apply when.** Any "where should this run?" or "set up k8s/Helm" request.
**Do / Avoid.** Do state "Cloud Run: 3 services, no platform team, spiky traffic". Avoid Helm charts and a service mesh for a single web app and worker.
**Why.** Kubernetes shifts upgrade, networking, and policy work onto the team; the failure-story collection is mostly self-inflicted platform complexity.

### Set memory request equal to limit
**Rule.** Every container gets a memory request equal to its limit and a runtime heap below it.
**Apply when.** Any Kubernetes workload.
**Do / Avoid.** Do `requests.memory: 512Mi`, `limits.memory: 512Mi`, Node heap about 384 MiB. Avoid unset requests or heaps that exceed the limit.
**Why.** Memory is not compressible; over-committed nodes evict or OOM-kill unpredictably, and a heap larger than the limit converts GC pressure into kills.

### Delay shutdown until traffic stops
**Rule.** Add a `preStop` sleep and size the grace period to cover it plus draining.
**Apply when.** Any Kubernetes service behind a load balancer or Service.
**Do / Avoid.** Do `preStop: sleep 5s`, grace period 40 s, app drain within 25 s. Avoid relying on the app's SIGTERM handler alone.
**Why.** Endpoint removal propagates concurrently with SIGTERM; without a delay, the pod receives requests after it starts closing.

## Sources

- Kubernetes Failure Stories (Henning Jacobs) — https://k8s.af (source moved to https://codeberg.org/hjacobs/kubernetes-failure-stories)
- Kubernetes docs: resource management; container lifecycle hooks; CronJobs — https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ , https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/ , https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/
- Datadog on CPU requests and limits — https://www.datadoghq.com/blog/kubernetes-cpu-requests-limits/
- Kubernetes graceful shutdown (secondary) — https://devopscube.com/kubernetes-pod-graceful-shutdown/
- ndots and DNS caching (secondary) — https://www.michal-drozd.com/en/blog/kubernetes-dns-caching-ndots/
- Kamal proxy docs — https://kamal-deploy.org/docs/configuration/proxy/
- 37signals cloud exit — https://www.theregister.com/2024/10/21/37signals_aws_savings/ , https://www.datacenterdynamics.com/en/news/37signals-begins-exiting-aws-storage-service/ , https://www.heise.de/en/news/Away-from-AWS-37signals-saves-1-3-million-dollars-a-year-with-its-own-storage-10380140.html
- Lambda INIT billing change (summary) — https://www.cloudyali.io/blogs/aws-lambda-cold-starts-now-cost-money-august-2025-billing-changes-explained
- Twelve-Factor blog: Evolving Twelve-Factor; Narrow Conduits — https://12factor.net/blog
- Heroku status (secondary) — https://www.infoworld.com/article/4129430/salesforce-may-be-prepping-to-phase-out-heroku.html
- OWASP Docker Security Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
