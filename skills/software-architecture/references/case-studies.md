# Architecture Case Studies

Eight published cases about structure: monolith vs services, where boundaries go, how many deployables a team can carry, and what cost does to architecture. Each is compact — what happened, the numbers the source reports, the lesson, and the rule it teaches. Before citing one, check that its constraints (team size, load shape, budget) resemble yours; the lesson transfers, the exact design often does not.

Database scaling and sharding cases (Discord, Figma, Notion, Slack, GitHub) are in `scalability` → `references/case-studies.md`; the cross-cutting library for design docs is in `system-design` → `references/case-studies.md`.

## Contents
- Summary table
- 1 Shopify — modular monolith and pods
- 2 Segment — 140+ services back to one
- 3 Amazon Prime Video — serverless pipeline to one process
- 4 Uber — domain-oriented microservice architecture
- 5 Airbnb — monolith → services → macroservices
- 6 Stack Overflow — the efficient monolith
- 7 WhatsApp — runtime matched to workload, tiny team
- 8 37signals — cost as an architectural driver
- Rules these cases support

## Summary table

| Case | Move | Driver | Lesson in one line |
|---|---|---|---|
| Shopify | Stayed a modular monolith; added tenant cells (pods) | Many developers in one codebase; blast radius | Enforce module boundaries with tooling; isolate tenants in cells |
| Segment | Microservices → one service | Operational overhead of 140+ services | Split by real scaling/ownership differences, not per entity |
| Prime Video | Distributed serverless → one process | Cost and a hard scaling limit | Price orchestration and data hand-offs before distributing |
| Uber | Grouped ~2,200 microservices into domains | Cognitive load and blast radius | At huge service counts, add domains, layers, and gateways |
| Airbnb | Monolith → services → micro + macro services | Deploy contention, then service sprawl | Services fix ownership; plan for aggregation later |
| Stack Overflow | Kept a monolith on few servers | Performance per server | Measure before distributing |
| WhatsApp | Erlang/BEAM, minimal features | Millions of long-lived connections | Match runtime to workload; control scope |
| 37signals | Cloud → owned hardware | Steady workload, high bill | Elasticity is worth paying for only if used |

## 1. Shopify — modular monolith and pods
- **What happened.** Shopify's core is a large Rails **modular monolith**: code is split into components that own their data and expose public interfaces, and boundaries are checked by tooling (Packwerk) rather than convention. To limit blast radius and scale data, shops are assigned to **pods** — each pod an isolated MySQL shard with its own supporting datastores — while stateless application tiers scale normally; shops can be moved between pods without downtime.
- **Numbers.** 100+ pods, as reported.
- **Lesson.** A single codebase with enforced internal boundaries keeps most of the benefits people seek from microservices; cells add fault isolation without splitting the code.
- **Rule.** *Default to a modular monolith with boundaries enforced in CI; when tenants must be isolated at scale, partition them into cells behind a thin router instead of splitting the codebase.*
- **Sources.** https://shopify.engineering/e-commerce-at-scale-inside-shopifys-tech-stack · https://kovyrin.net/2024/06/16/interview-inside-shopify-monolith/ · https://github.com/Shopify/packwerk

## 2. Segment — "Goodbye Microservices" (2018)
- **What happened.** Segment created one service and one queue per destination integration. The count grew past 140; shared libraries drifted to different versions in different services; a large share of a small engineering team's time went to keeping the system alive. They merged all destinations into a single service in one repository, and built a traffic recorder to make its tests fast and deterministic.
- **Trade-off acknowledged.** Less fault isolation between destinations in exchange for velocity.
- **Lesson.** Services split along a data dimension (one per integration or entity) multiply operational cost without buying independent teams or scaling.
- **Rule.** *Split services only along real differences in scaling, ownership, or failure isolation; when services share one team and one release cadence, merge them.*
- **Source.** https://segment.com/blog/goodbye-microservices/

## 3. Amazon Prime Video — serverless pipeline to one process (2023)
- **What happened.** A stream-quality monitoring service was built from AWS Step Functions and Lambda, handing video frames between stages through S3. It hit a hard scaling limit at about 5% of expected load, and per-state-transition charges were high. The team moved every stage into a single process on ECS, passing data in memory, and scaled by running more copies.
- **Numbers.** Over 90% lower infrastructure cost.
- **Nuance.** One team's service, not a company-wide retreat from microservices; Adrian Cockcroft summarized it as "serverless first, not serverless only".
- **Lesson.** Distribution has a per-hop cost in money and latency that dominates for high-frequency, data-heavy pipelines.
- **Rule.** *Before choosing a distributed or serverless design, estimate orchestration and inter-stage transfer cost at target load; co-locate stages that exchange large data often.*
- **Sources.** https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90 · https://adrianco.medium.com/so-many-bad-takes-what-is-there-to-learn-from-the-prime-video-microservices-to-monolith-story-4bd0970423d4

## 4. Uber — Domain-Oriented Microservice Architecture (2020)
- **What happened.** With roughly 2,200 critical microservices, understanding and changing the system had become hard. Uber grouped services into **domains** (collections of related services), arranged domains in **layers** (lower layers more general, upper layers more product-specific, which limits the blast radius of dependencies), gave each domain a single **gateway** as its entry point, and added extension points so other teams can add behavior without changing a domain's core.
- **Lesson.** At very large service counts, the unit of design becomes the domain, not the service — which is the same boundary a modular monolith draws from the start.
- **Rule.** *If you already run hundreds of services, group them into domains with one gateway each and layered dependencies; if you don't, a modular monolith gives you domain boundaries without the service count.*
- **Source.** https://www.uber.com/us/en/blog/microservice-architecture/

## 5. Airbnb — monolith → services → micro + macro services
- **What happened.** Airbnb ran a Rails monolith ("Monorail") from 2008 to about 2017; ownership became confusing and deploys contended. From 2017 to 2020 it moved to services organized in tiers (data services, derived data, middle tier, presentation). From 2020 it moved to a hybrid of micro- and "macroservices", unifying APIs because hundreds of services had become hard for people to manage.
- **Lesson.** Services fixed ownership and deploy contention, then created a new problem — service sprawl — that needed aggregation.
- **Rule.** *Extract services to fix measured ownership or deploy contention, and plan from the start for aggregation (gateways, macroservices) as the count grows.*
- **Source.** https://www.infoq.com/presentations/airbnb-culture-soa/

## 6. Stack Overflow — the efficient monolith (2016)
- **What happened.** Stack Overflow ran as a .NET monolith on-premises: nine primary web servers, four SQL Servers in two clusters, Redis, Elasticsearch, and a custom tag engine, with heavy caching and attention to query and allocation performance.
- **Lesson.** The "interview answer" (microservices, sharding, CQRS) was not what one of the web's busiest sites needed; efficient code on strong hardware was.
- **Rule.** *Measure before distributing; optimize queries, caching, and allocations before adding tiers or services.*
- **Source.** https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/

## 7. WhatsApp — runtime matched to workload (2014)
- **What happened.** At its acquisition in February 2014, WhatsApp served about 450M active users with about 32 engineers. It was built on Erlang/BEAM, whose lightweight processes suit millions of long-lived connections; in 2012 it reported around 2M concurrent TCP connections on a single server. Scope stayed deliberately small.
- **Lesson.** Choosing a runtime for the dominant workload shape, plus ruthless scope control, let a tiny team run very large scale — the opposite of adding components.
- **Rule.** *Match the runtime and architecture to the workload's shape (connections, CPU, I/O) and keep scope minimal; a small team should run few moving parts.*
- **Sources.** https://highscalability.com/the-whatsapp-architecture-facebook-bought-for-19-billion/ · https://sequoiacap.com/article/four-numbers-that-explain

## 8. 37signals — cost as an architectural driver (2022–2025)
- **What happened.** 37signals (Basecamp, HEY) moved its steady, predictable workloads from AWS to owned hardware, then planned to leave S3 for owned storage.
- **Numbers (as of 2024-10).** Cloud spend fell from about $3.2M/year to about $1.3M/year, the remainder mostly S3 (~10 PB); the company projected more than $10M saved over five years.
- **Lesson.** Hosting model is an architecture decision with a price; elasticity is valuable only when the load is elastic.
- **Rule.** *For steady workloads at significant spend, compare 3–5 year total cost (hardware, people, contracts) before assuming cloud or serverless; record the decision in an ADR with the numbers.*
- **Source.** https://www.theregister.com/2024/10/21/37signals_aws_savings/

## Rules these cases support

1. Modular monolith first; enforce boundaries with tools (Shopify, Stack Overflow).
2. Service count is a cost paid in operations, versioning, and cognition (Segment, Uber, Airbnb).
3. Every network hop has a price; estimate it before distributing (Prime Video).
4. Isolate blast radius with cells before splitting code (Shopify).
5. Match runtime to workload and keep scope small (WhatsApp).
6. Cost belongs in the architecture drivers and the ADR (Prime Video, 37signals).

## Sources

- Shopify Engineering, "E-Commerce at Scale: Inside Shopify's Tech Stack": https://shopify.engineering/e-commerce-at-scale-inside-shopifys-tech-stack
- Oleksiy Kovyrin, "Inside Shopify's Modular Monolith" (2024): https://kovyrin.net/2024/06/16/interview-inside-shopify-monolith/
- Packwerk: https://github.com/Shopify/packwerk
- Alexandra Noonan, "Goodbye Microservices" (Segment, 2018): https://segment.com/blog/goodbye-microservices/
- Marcin Kolny, Prime Video monitoring service (2023): https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90
- Adrian Cockcroft on the Prime Video story: https://adrianco.medium.com/so-many-bad-takes-what-is-there-to-learn-from-the-prime-video-microservices-to-monolith-story-4bd0970423d4
- Uber Engineering, "Introducing Domain-Oriented Microservice Architecture" (2020): https://www.uber.com/us/en/blog/microservice-architecture/
- Jessica Tai, "The Human Side of Airbnb's Microservice Architecture" (InfoQ): https://www.infoq.com/presentations/airbnb-culture-soa/
- Nick Craver, "Stack Overflow: The Architecture – 2016 Edition": https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/
- High Scalability, "The WhatsApp Architecture Facebook Bought For $19 Billion": https://highscalability.com/the-whatsapp-architecture-facebook-bought-for-19-billion/
- Sequoia, "Four numbers that explain why Facebook acquired WhatsApp": https://sequoiacap.com/article/four-numbers-that-explain
- The Register on 37signals' cloud exit (Oct 2024): https://www.theregister.com/2024/10/21/37signals_aws_savings/
- ByteByteGo system-design-101 case summaries: https://github.com/ByteByteGoHq/system-design-101
