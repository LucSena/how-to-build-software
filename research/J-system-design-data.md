# J. System Design as a Practical Method + Real Case Studies + Data Modeling / Schema Design

Research notes for Agent Skills (researched 2026-09). Scope: (A) the *method* of system design and a library of real engineering-blog case studies; (B) data modeling / database schema design with SQL. Scalability patterns, caching, queues, consistency models, rate limiting, API design, outbox/saga basics and back-of-envelope formulas are already in `E-architecture.md` (§4, §5) and are **not** repeated here — only cross-referenced.

Legend: **[V]** = confirmed via web search summary or local reference repo during this session. **[U]** = from memory / secondary source, not re-verified this session — check before putting a number into a skill. Where a claim has no marker it is a design recommendation (opinion), not a fact.

Local references used: `refs7/karanpratapsingh_system-design` (method steps), `refs5/ByteByteGoHq_system-design-101/data/guides/*` (case summaries: Discord, Figma, Prime Video, Airbnb, Stack Overflow, Shopify payments, ID generators), `refs7/kdeldycke_awesome-falsehood` (falsehood links).

---

## PART A — System design as a practical method

### A.0 What the method is for

System design is the act of turning a vague goal into a set of explicit decisions about data, interfaces, components and failure behaviour, *with the trade-offs written down*. The interview format (requirements → estimation → data model → API → high-level → deep dive → bottlenecks; `karanpratapsingh_system-design` README "System Design Interviews" [V]) is a decent skeleton, but real-world design differs in three ways agents must internalize:

1. **The existing system is the starting point.** Almost every case study below is a *migration* (Discord, Figma, Notion, Slack, GitHub, Stripe, Uber, Segment, Prime Video). The design problem is usually "how do we get from here to there without downtime", not green-field.
2. **The interviewer's "expected" answer is often wrong for real constraints.** ByteByteGo's Stack Overflow guide makes the point explicitly: the interview answer is microservices + sharding + CQRS; reality was a monolith on ~9 on-prem web servers [V: `system-design-101/.../how-will-you-design-the-stack-overflow-website.md`; Nick Craver 2016].
3. **Scale numbers must be measured or estimated, not assumed.** Most products never need sharding; the ones that did (Figma, Notion) postponed it with vertical scaling and vertical partitioning for years.

### A.1 The practical method (agent checklist)

Step order matters: data model and access patterns come before boxes-and-arrows.

| # | Step | Output artifact | Questions the agent must answer | Failure mode if skipped |
|---|------|-----------------|--------------------------------|-------------------------|
| 1 | **Problem & context** | 3–5 sentence problem statement; who is affected; what exists today | What triggers this work? What breaks if we do nothing? What exists already (code, data, contracts)? | Solving the wrong problem; rewriting what exists |
| 2 | **Functional requirements** | Numbered list of user-visible behaviours + explicit **non-goals** | What must a user be able to do? What is explicitly out of scope? | Scope creep; gold-plating |
| 3 | **Non-functional requirements / SLOs** | Table: latency p50/p99, availability SLO, durability, consistency needs per operation, RPO/RTO, compliance (PII, residency), cost ceiling | Which operations need strong consistency (money, inventory, auth)? What is the acceptable staleness elsewhere? | Over-engineering everything to the strictest level, or under-engineering money paths |
| 4 | **Estimation** | Users, QPS (avg & peak), read:write ratio, data size & growth per year, hot-key skew | See `E-architecture.md` §4.1 for formulas | Premature sharding, or a design that dies at 5% of expected load (Prime Video [V]) |
| 5 | **Access patterns & invariants** | List of queries/commands with frequency; list of invariants that must never be violated | What are the top 5 reads and writes? What must always be true (balance ≥ 0, one active subscription per account)? | Schema that can't answer the main query cheaply; invariants enforced only in app code |
| 6 | **Data model** | Entities, keys, relationships, constraints, ownership (which service/module owns which table), partition key if any | See Part B | Hot partitions (Discord [V]); cross-shard joins everywhere |
| 7 | **API sketch** | Endpoints/commands/events with request/response shapes, idempotency, pagination | See `E-architecture.md` §5 | Chatty APIs; non-idempotent writes |
| 8 | **High-level design** | One diagram (C4 container level): clients, edge, services/modules, datastores, queues, third parties | What is the *simplest* topology that meets steps 2–5? | Distributed monolith; unnecessary components |
| 9 | **Deep dives** | 2–4 riskiest components examined in detail | Where is the uncertainty/risk highest? Go there, not to the comfortable parts | Hand-waving the hard part |
| 10 | **Bottlenecks & failure modes** | Table: component → failure → detection → mitigation → blast radius | Single points of failure? What happens when the DB is at 100% CPU, a dependency times out, a region fails? | Outages discovered in production |
| 11 | **Trade-offs & alternatives** | "Alternatives considered" with why-not for each | Would a boring alternative work? What does this design make harder later? | Decisions nobody can later explain |
| 12 | **Rollout / migration plan** | Phases, feature flags, dual-write/shadow-read plan, backfill plan, rollback at each phase, success metrics | How do we ship it incrementally and back out? | Big-bang cutovers |
| 13 | **Operations** | Dashboards, alerts tied to SLOs, runbooks, on-call ownership, cost estimate | Who gets paged? How do we know it works? | Unowned systems |

Agent rule: **write steps 1–5 before drawing any architecture**. If the agent cannot state the top access patterns and the invariants, it is not ready to choose a database or a topology.

### A.2 Requirements and SLOs — concrete guidance

- Split requirements into **functional**, **non-functional**, and **extended/nice-to-have** (karanpratapsingh course [V]).
- Express non-functional requirements as **SLIs/SLOs** (Google SRE book, ch. 4 "Service Level Objectives", https://sre.google/sre-book/service-level-objectives/ [U: chapter title/URL from memory]):
  - SLI = measured ratio (good events / valid events), e.g. "fraction of `POST /orders` requests returning non-5xx within 300 ms".
  - SLO = target for the SLI over a window (e.g. 99.9% over 30 days).
  - Error budget = 1 − SLO. Spend it on releases; when exhausted, slow down.
- Downtime budget arithmetic (30-day month = 43,200 min; computed, not sourced):

| SLO | Allowed bad minutes / 30 days | Per year |
|-----|------------------------------|----------|
| 99% | 432 min (7.2 h) | ~3.65 days |
| 99.5% | 216 min | ~1.8 days |
| 99.9% | 43.2 min | ~8.76 h |
| 99.95% | 21.6 min | ~4.38 h |
| 99.99% | 4.32 min | ~52.6 min |

- Consistency requirement per operation, not per system: e.g. "payment capture: linearizable + idempotent; feed rendering: ≤ 60 s stale OK; search index: ≤ 5 min stale OK".
- Always include **cost** as a non-functional requirement (Prime Video, 37signals show cost can dominate the architecture choice).
- Always include **data requirements**: retention period, PII categories, residency, deletion SLA (GDPR Art. 17 erasure requests must be handled "without undue delay" — [U: wording from memory of GDPR Art. 17(1)]).

### A.3 Estimation — only what's new here

Formulas live in `E-architecture.md` §4.1. Add these data-sizing habits:

- **Row-size estimate**: sum column sizes + per-row overhead (Postgres tuple header ~23 bytes + alignment [U]) + index sizes (each B-tree index on a bigint ≈ 20–40 bytes/row incl. overhead [U, rule of thumb]). Multiply by rows/year × years of retention. Compare with a single node's comfortable working set (RAM) and disk.
- **Hot-key estimate**: ask "what is the largest tenant / channel / celebrity?" Discord's problem was not total volume but a few huge servers creating hot partitions [V: discord.com/blog/how-discord-stores-trillions-of-messages].
- **Growth trigger points**: write down *at what number* the next step (read replica, vertical partition, horizontal shard) becomes necessary, so the design says "not yet" with a threshold rather than building it now.

### A.4 Writing a design doc (Google-style, Malte Ubl)

Source: Malte Ubl, "Design Docs at Google" (2020), https://www.industrialempathy.com/posts/design-docs-at-google/ [V]. Key points (paraphrased):

- Design docs are *relatively informal* documents written by the primary author(s) before coding, documenting the high-level implementation strategy and key decisions **with emphasis on the trade-offs considered** [V].
- Benefits: find design issues while change is cheap; build consensus; ensure cross-cutting concerns (privacy, security) are considered; scale senior engineers' knowledge; organizational memory of decisions [V].
- Typical sections [V]: **Context and scope**; **Goals and non-goals**; **The actual design** (system-context diagram, APIs, data storage, code/pseudo-code only for novel algorithms, degree of constraint); **Alternatives considered**; **Cross-cutting concerns** (security, privacy, observability).
- Length guidance [U]: longer docs ~10–20 pages for big projects; "mini design docs" of 1–3 pages for incremental changes.
- **When not to write one** [U, paraphrase]: if the doc would just be an implementation manual with no real trade-offs, skip it and write the code.
- Lifecycle [U]: create & iterate rapidly → review (lightweight or formal) → implement & update doc when reality diverges → maintain/learn later.
- Companion piece: "Design docs – A design doc", https://www.industrialempathy.com/posts/design-doc-a-design-doc/ [V: URL exists].

Related (not verified this session): Oxide "RFD" process; Uber/Pragmatic Engineer articles on RFCs; ADRs (covered in `E-architecture.md` §3.9). An ADR records *one* decision; a design doc covers a *project* and usually yields several ADRs.

#### Design-doc template (for a skill's `references/` file)

```markdown
# <Title>  — Design Doc
Status: Draft | In review | Approved | Implemented | Superseded by <link>
Authors: …   Reviewers: …   Last updated: YYYY-MM-DD

## 1. Context and scope
What exists today (1 diagram or 3 bullets). Why change now (incident, growth metric, product need).
Link to data: current QPS, table sizes, error rates, cost.

## 2. Goals
- G1 … (measurable: "p99 of GET /feed < 200 ms at 3x current peak")
## 3. Non-goals
- NG1 … (things a reasonable reader might assume are in scope but are not)

## 4. Requirements
### 4.1 Functional
### 4.2 Non-functional / SLOs (table: operation, latency, availability, consistency, durability)
### 4.3 Data: retention, PII, residency, deletion

## 5. Estimates
Users, QPS avg/peak, read:write, storage now/+1y/+3y, biggest tenant/hot key.

## 6. Design
### 6.1 Overview diagram (C4 container level)
### 6.2 Data model (tables/entities, keys, constraints, owner, partition key)
### 6.3 APIs / events (shapes, idempotency, pagination, errors)
### 6.4 Key flows (sequence for the 2–3 most important operations, incl. failure paths)
### 6.5 Deep dive: <riskiest component>

## 7. Alternatives considered
| Option | Pros | Cons | Why not chosen |
Always include "do nothing / smallest change" and "boring off-the-shelf" options.

## 8. Cross-cutting concerns
Security & authz · Privacy/PII · Observability (SLIs, dashboards, alerts) · Cost ·
Accessibility/i18n (if user-facing) · Compliance

## 9. Failure modes
| Component | Failure | Detection | Mitigation | Blast radius |

## 10. Rollout and migration plan
Phases with entry/exit criteria; flags; dual-write/shadow-read; backfill; verification;
rollback plan per phase; data cleanup (contract phase).

## 11. Open questions
## 12. Decision log (link ADRs)
```

### A.5 Trade-off articulation

Agents tend to produce "benefits" lists. Require every non-trivial choice to be stated in this form:

> "We choose **X** over **Y** because **requirement R** matters more than **property P** here. This costs us **C**. We will revisit if **metric M crosses T**."

Examples grounded in cases:
- Figma: "We choose property-level last-writer-wins with a central server over true CRDTs/OT because a central authority exists anyway and it is simpler/faster; this costs us offline-first peer-to-peer editing" [V: figma.com/blog/how-figmas-multiplayer-technology-works].
- Segment: "We choose one service for all destinations over one service per destination because operational overhead dominated; this costs us fault isolation between destinations" [V/U: segment.com/blog/goodbye-microservices].
- Prime Video: "We choose a single process over Step Functions + Lambda + S3 hand-off because the per-transition and data-transfer cost dominated; this costs independent scaling of stages" [V].

### A.6 Rollout / migration patterns (recurring across cases)

These appear in almost every case study; a skill should teach them as named patterns.

| Pattern | What it is | Seen at |
|---------|-----------|---------|
| **Dual write → shadow/dark read → switch reads → switch writes → delete old** | 4-step online migration | Stripe "Online migrations at scale" (2017) [V], Notion (2021) [V] |
| **Logical before physical** | Route queries as if partitioned while still on one DB; move data later | Figma "logical sharding" [V], GitHub "virtual partitions" + SQL linters [V] |
| **Many logical shards, few physical** | Fix a large logical shard count up front; move logical shards between hosts later without re-hashing | Notion 480 logical / 32 physical [V]; Instagram (logical shards as Postgres schemas) [V/U]; Pinterest virtual shards [V] |
| **Data-access layer / proxy first** | Put a service/proxy between app and DB before migrating the DB | Discord Rust data services [V]; Figma DBProxy [V]; Slack/GitHub Vitess [V] |
| **Comparison testing** | Run old and new paths, compare results, log mismatches | Stripe (Scientist-style comparisons) [U]; Notion dark reads [V] |
| **Blast-radius isolation cells** | Split tenants into independent stacks | Shopify pods [V]; Cloudflare Durable Objects per-entity [V] |
| **Strangler / incremental extraction** | Carve pieces out of the monolith one at a time | Airbnb Monorail → SOA [V]; Shopify componentization [V] |

---

## PART A2 — Case-study library

Format per case: **Problem → Design → Numbers → Lesson → Rule for agents**. Keep the "Rule" line as the thing a skill would actually say.

### 1. Discord — messages: MongoDB → Cassandra → ScyllaDB + Rust data services (2015–2023)
- **Sources**: "How Discord Stores Billions of Messages" (2017, originally blog.discordapp.com/how-discord-stores-billions-of-messages-7fa6ec7ee4c7) and "How Discord Stores Trillions of Messages" (2023), https://discord.com/blog/how-discord-stores-trillions-of-messages [V]; summary in `system-design-101/.../how-discord-stores-trillions-of-messages.md` [V].
- **Problem**: 2015 single MongoDB replica set; at ~100M messages (Nov 2015) data + indexes no longer fit in RAM, latency became unpredictable [V]. By 2022 Cassandra had 177 nodes, trillions of messages, unpredictable latency, expensive maintenance (compaction), GC pauses, and **hot partitions** when many users read the same channel [V].
- **Design**: Primary key `(channel_id, bucket)` as partition key with `message_id` (Snowflake, time-sortable) as clustering key; bucket = static time window so a channel's partition doesn't grow unbounded [V]. 2022–23: inserted **data services written in Rust** between API monolith and DB — they do **request coalescing** (many concurrent requests for the same row → one DB query) and consistent-hash routing by channel [V: data services layer; U: routing detail]. Moved to ScyllaDB (C++, no JVM GC).
- **Numbers**: 12 Cassandra nodes (2017) → 177 (2022) → 72 ScyllaDB nodes [V]. p99 read 40–125 ms → 15 ms; p99 write 5–70 ms → 5 ms [V: ByteByteGo guide]. Migration of trillions of messages completed in ~9 days with a custom Rust migrator [V]. ScyllaDB nodes ~9 TB each [U].
- **Lesson**: Partition key design determines hot spots; unbounded partitions are a time bomb; a thin data-access layer lets you fix concurrency problems (coalescing) and swap databases.
- **Rule**: *Choose a partition key that bounds partition size (entity + time bucket) and matches the dominant query. Put a data-access layer in front of a datastore you might replace.*

### 2. Figma — Postgres: vertical partitioning (2020–2022) then horizontal sharding (2023–24)
- **Sources**: "The growing pains of database architecture" (2023), https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/ [V]; "How Figma's databases team lived to tell the scale" (Mar 2024), https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/ [V]; pganalyze summary https://pganalyze.com/blog/5mins-postgres-figma-dbproxy-sharding-postgres [V].
- **Problem**: DB stack grew ~100x since 2020 [V]. 2020: single Postgres on AWS's largest instance (r5.12xlarge → r5.24xlarge) [V]. By late 2022 the largest tables were several TB / billions of rows; vacuum caused reliability incidents; RDS max IOPS limits [V].
- **Design**:
  1. Vertical scaling + read replicas + PgBouncer [V].
  2. **Vertical partitioning**: move groups of related tables (e.g. "Figma files", "Organizations") to their own databases [V]; ~30 s partial availability impact (~2% of requests dropped) per move [V].
  3. **Horizontal sharding** (first table shipped Sept 2023) [V]: **colos** = groups of tables sharing a shard key (UserID, FileID or OrgID) that support joins and full transactions *within one shard key* [V]; **logical sharding** first (queries routed as if sharded, still one physical DB) then **physical sharding** [V]; **DBProxy** (Go) parses SQL to AST, routes to shards, supports limited scatter-gather [V]; "shadow application readiness" analysis of live queries to find what would break [V].
- **Numbers**: ~100x growth in 4 years; 9-month effort to shard the first tables [V].
- **Lesson**: Exhaust cheap levers first (bigger box, replicas, pooling, vertical partitions); when sharding, reduce risk by separating the logical step from the physical move and by restricting the query surface (colos) so product engineers keep joins/transactions.
- **Rule**: *Before horizontal sharding, prove vertical partitioning and replicas are exhausted. When you shard, pick shard keys from access patterns, keep related tables co-located on the same key, and ship logical routing before moving data.*

### 3. Figma — multiplayer editing (2019)
- **Source**: Evan Wallace, "How Figma's multiplayer technology works" (2019), https://www.figma.com/blog/how-figmas-multiplayer-technology-works/ [V]; "Making multiplayer more reliable", https://www.figma.com/blog/making-multiplayer-more-reliable/ [V: exists].
- **Design**: Centralized, **server-authoritative**; document = tree of objects with properties; conflicts resolved per (object, property) as **last write to reach the server wins** (like an LWW register but ordering by server, no timestamps) [V]. "Inspired by" several CRDTs, not a true CRDT [V]. Clients apply edits optimistically and reconcile with server acks [U].
- **Lesson**: If you have a server anyway, you can simplify drastically compared with peer-to-peer CRDT/OT.
- **Rule**: *For real-time collaboration, start with server-ordered per-field last-writer-wins; reach for full CRDTs (Yjs/Automerge) only for text merging or true offline/peer-to-peer needs.*

### 4. Notion — sharding Postgres (2021), re-shard (2023), data lake (2024)
- **Sources**: "Herding elephants: lessons learned from sharding Postgres at Notion" (Oct 2021), https://www.notion.com/blog/sharding-postgres-at-notion [V]; "The Great Re-shard" (2023) [U: URL likely https://www.notion.com/blog/the-great-re-shard]; "Building and scaling Notion's data lake" (2024), https://www.notion.com/blog/building-and-scaling-notions-data-lake [V].
- **Design (2021)**: application-level sharding (not Citus) [V]; **480 logical shards** (Postgres schemas) across **32 physical databases** (15 each); 480 chosen because highly composite (divisible by 8, 10, 12, 15, 16, 20, 24, 32, 40, 48, 60, 80, 96…) so physical fleets can be re-balanced without re-hashing [V]; partition key = **workspace ID** (all blocks of a workspace co-located) [U: workspace_id from memory, consistent with summaries]. Migration: double-write (via audit log catch-up), backfill, **dark reads** to verify, then switch [V].
- **2023**: 32 → 96 physical machines ("zero downtime") [V/U: summary mentions 96 databases].
- **Data lake (2024)**: blocks grew from ~20B rows (early 2021) to 200B+ (2024), hundreds of TB compressed [V]; pipeline Postgres → **Debezium CDC** → Kafka → **Apache Hudi** → S3, with Spark for tree traversal/denormalization [V]; >$1M net savings in 2022 and higher later; freshness from days to minutes/hours [V].
- **Lesson**: They admitted sharding later than ideal (vacuum/transaction ID pressure) [U]. Over-provision the logical shard count; choose the tenant as shard key; move analytics off OLTP via CDC.
- **Rule**: *Shard by tenant when tenants are independent; pre-split into many logical shards; verify with dark reads before cutover; use CDC into a lake/warehouse instead of running analytics or bulk exports on the primary.*

### 5. Instagram — early architecture and sharded IDs (2011–2012)
- **Sources**: "What Powers Instagram: Hundreds of Instances, Dozens of Technologies" (2011), http://instagram-engineering.tumblr.com/post/13649370142/what-powers-instagram-hundreds-of-instances [V: URL in local refs]; highscalability write-up http://highscalability.com/blog/2011/12/6/instagram-architecture-14-million-users-terabytes-of-photos.html [V: URL]; "Sharding & IDs at Instagram", https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c [V].
- **Design**: Django + PostgreSQL + Redis + Memcached on AWS [U]; ~14M users with ~3 engineers [U: from highscalability title "14 million users" V; engineer count U]. Shards: many **logical shards as Postgres schemas** mapped to fewer physical servers [V/U]. **64-bit IDs**: 41 bits ms since custom epoch + 13 bits logical shard ID + 10 bits per-shard sequence (mod 1024) → 1024 IDs/shard/ms; generated in PL/pgSQL inside each shard [V].
- **Lesson**: IDs that embed time are sortable (`ORDER BY id` ≈ `ORDER BY created_at`, saving an index) and IDs that embed the shard make routing trivial [V].
- **Rule**: *If you must shard, generate IDs that are 64-bit, time-ordered, and encode (or map to) the shard; avoid a central ID service as a single point of failure.*

### 6. Twitter/X — Snowflake IDs (2010)
- **Source**: announced June 2010 [V: Wikipedia "Snowflake ID" https://en.wikipedia.org/wiki/Snowflake_ID]; original repo github.com/twitter-archive/snowflake [U].
- **Design**: 64-bit: 1 unused sign bit + 41-bit ms timestamp since a custom 2010 epoch + 10-bit machine ID (datacenter+worker) + 12-bit sequence (4096 IDs/ms/worker) [V]. Motivation: move off MySQL auto-increment during a storage migration; need uncoordinated, roughly time-ordered ("k-sorted") IDs [U].
- **Adopted by**: Discord (all IDs are Snowflakes [V]), many others.
- **Rule**: *Snowflake-style IDs are the right tool when you need 64-bit, sortable, uncoordinated IDs across many writers — but they require unique worker-ID assignment and tolerate little clock regression. Otherwise prefer DB identity or UUIDv7 (Part B §B.3).*

### 7. Pinterest — MySQL sharding (2012–2015)
- **Source**: Marty Weiner, "Sharding Pinterest: How we scaled our MySQL fleet" (2015), https://medium.com/pinterest-engineering/sharding-pinterest-how-we-scaled-our-mysql-fleet-3f341e96ca6f [V]; highscalability 2013 "Scaling Pinterest from 0 to 10s of billions of page views" [V: URL in local refs].
- **Design**: 64-bit ID = `(shard_id << 46) | (type_id << 36) | local_id` (16/10/36 bits) [V]. Objects (pins, boards, users) stored as **JSON blobs** in MySQL tables keyed by local auto-increment ID; relationships in **mapping tables**; no cross-shard joins; fixed number of **virtual shards** mapped to physical hosts [V]. Exact virtual shard count: 4,096 vs 8,192 conflicting in sources [U].
- **Lesson** (paraphrased from the talk/post [U]): keep it boring — MySQL + simple key lookups; don't use fancy clustering tech you don't understand; shard only when necessary.
- **Rule**: *A sharded relational store with simple key-value access patterns and application-side joins is a proven, boring path; keep the ID-to-shard mapping deterministic.*

### 8. Shopify — pods and the modular monolith
- **Sources**: Shard balancing, https://shopify.engineering/mysql-database-shard-balancing-terabyte-scale [V]; "E-Commerce at Scale: Inside Shopify's Tech Stack", https://shopify.engineering/e-commerce-at-scale-inside-shopifys-tech-stack [V]; Kovyrin interview "Inside Shopify's Modular Monolith" (2024), https://kovyrin.net/2024/06/16/interview-inside-shopify-monolith/ [V]; "Deconstructing the Monolith" (2019) https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity [U: URL]; Packwerk (boundary enforcement) https://github.com/Shopify/packwerk [U].
- **Design**: Rails **modular monolith** with components that own their data and expose public APIs [V]. **Pods**: each pod = isolated MySQL shard + its own Redis/Memcached etc.; shops assigned to pods by `shop_id`; stateless tiers scaled normally [V]. Shops moved between pods with zero downtime (Ghostferry) [V/U: tool name U]. Payments guidance: low timeouts (read 5 s, write 1 s), circuit breakers (Semian), idempotency keys (ULID), reconciliation [V: `system-design-101/.../10-principles-for-building-resilient-payment-systems-by-shopify.md`].
- **Numbers**: 100+ pods; no platform-wide outage since adopting pods (as claimed) [V].
- **Rule**: *For multi-tenant SaaS, a tenant-sharded "cell" (pod) architecture limits blast radius while keeping a single codebase. Enforce module boundaries in the monolith with tooling, not conventions.*

### 9. Stripe — idempotency keys and online migrations
- **Sources**: "Online migrations at scale" (2017), https://stripe.com/blog/online-migrations [V]; "Designing robust and predictable APIs with idempotency" (2017), https://stripe.com/blog/idempotency [U: URL]; Brandur Leach, "Implementing Stripe-like Idempotency Keys in Postgres", https://brandur.org/idempotency-keys [V].
- **Design (migrations)**: 4 steps — dual-write; change reads; change writes; delete old data [V]. Used for migrating subscriptions data (hundreds of millions of objects [U]); backfill with offline batch jobs; compare old/new results before switching reads [U].
- **Design (idempotency)**: client sends `Idempotency-Key`; server stores key + request fingerprint + response; retries return the stored response; server work divided into **atomic phases** separated by **recovery points**, so a failed request can resume from the last completed phase; foreign calls (e.g. charging a card) sit between phases [V]. Stripe keys expire after ≥24 h [U].
- **Rule**: *Every non-idempotent mutation reachable over a network gets an idempotency key persisted in the same transaction as the effect. Migrate data with dual-write → verify → switch reads → switch writes → delete.*

### 10. Slack — Vitess migration (2017–2020)
- **Source**: "Scaling Datastores at Slack with Vitess" (Dec 2020), https://slack.engineering/scaling-datastores-at-slack-with-vitess/ [V].
- **Problem**: original design sharded MySQL by workspace; large enterprise workspaces and cross-workspace features (shared channels) broke the "one workspace = one shard" assumption [U].
- **Design**: Vitess (MySQL sharding middleware from YouTube) with keyspaces and flexible sharding keys (e.g. by channel) [V/U].
- **Numbers**: migration 2017→2020, ~3 years; Vitess serving 99% of queries by late 2020; peak 2.3M QPS (2M reads, 300K writes), median 2 ms, p99 11 ms [V]. March 2020 query rate +50% in one week; hot shards split online [V].
- **Rule**: *Tenant-per-shard breaks when tenants become huge or start sharing data; choose a sharding layer that lets you re-shard online and shard different tables on different keys.*

### 11. GitHub — partitioning MySQL (2019–2021) and gh-ost
- **Sources**: "Partitioning GitHub's relational databases to handle scale" (Sept 2021), https://github.blog/2021-09-27-partitioning-githubs-relational-databases-scale/ [V]; gh-ost https://github.com/github/gh-ost [V].
- **Design**: grouped tables into **schema domains**; **virtual partitions** in the application layer before physical moves; two **SQL linters** that flag queries and transactions spanning schema domains; moved domains off the main `mysql1` cluster; Vitess for some sharded domains [V].
- **Numbers**: 50% load reduction on hosts that held the former `mysql1` data [V]. GitHub.com MySQL 8.0 upgrade (2023) covered 1,200+ hosts [U].
- **Rule**: *Before splitting a database, make boundaries enforceable in CI (lint cross-domain joins/transactions), then move data.*

### 12. Uber — Schemaless (2016) and DOMA (2020)
- **Sources**: "Designing Schemaless, Uber Engineering's Scalable Datastore Using MySQL" (Jan 2016), https://www.uber.com/us/en/blog/schemaless-part-one-mysql-datastore/ [V]; "Why Uber Engineering Switched from Postgres to MySQL" (2016), https://www.uber.com/blog/postgres-to-mysql-migration/ [V: exists]; "Evolving Schemaless into a Distributed SQL Database" (Docstore), https://www.uber.com/us/en/blog/schemaless-sql-database/ [V: exists]; "Introducing Domain-Oriented Microservice Architecture" (July 2020), https://www.uber.com/us/en/blog/microservice-architecture/ [V].
- **Schemaless**: trip data moved from a single Postgres to an append-only, sharded key-value store on MySQL; basic unit = immutable **cell** (row key, column name, ref key) holding JSON; buffered writes; **triggers** fire on cell writes (e.g., trip completed → billing) [V]. Later evolved to Docstore with SQL-ish features [V].
- **DOMA**: ~2,200 critical microservices at the time [V]; groups services into **domains** (collections of related services), **layers** (limit blast radius — lower layers are more general, upper layers more product-specific), **gateways** (single entry point per domain), **extensions** (let other teams extend a domain without modifying its core) [V/U: extensions from memory].
- **Rule**: *If you already have hundreds of microservices, reduce cognitive load by grouping them into domains with a single gateway each; if you don't, a modular monolith gets you most of the benefit with less cost.*

### 13. Segment — "Goodbye Microservices" (2018)
- **Source**: Alexandra Noonan, https://segment.com/blog/goodbye-microservices/ (also twilio.com mirror) [V].
- **Problem**: one service + queue per destination integration → 140+ services; shared libraries diverged in versions; ~3 of ~8 engineers spent most of their time keeping the system alive [V].
- **Design**: consolidated all destinations into one service ("Centrifuge" replaced per-destination queues) with a single repo; built "Traffic Recorder" to make tests fast/deterministic [V].
- **Numbers**: 140+ services → 1; library improvements 32 (2016) → 46 (2017) [V/U: 46 V, 32 U].
- **Trade-off acknowledged**: lost fault isolation; one bad destination can affect others [U].
- **Rule**: *Split services along real differences in scaling, ownership or failure isolation — not along "one per integration/entity". If services share one team and one release cadence, merge them.*

### 14. Amazon Prime Video — monitoring service to a monolith (2023)
- **Source**: Marcin Kolny, "Scaling up the Prime Video audio/video monitoring service and reducing costs by 90%" (Mar 22, 2023), https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90 [V]; Adrian Cockcroft, "So many bad takes…", https://adrianco.medium.com/so-many-bad-takes-what-is-there-to-learn-from-the-prime-video-microservices-to-monolith-story-4bd0970423d4 [V].
- **Problem**: Step Functions + Lambda pipeline (media converter → defect detector → notifications) hit a hard scaling limit at ~5% of expected load; Step Functions charged per state transition (several per second of stream); frames passed via S3 [V].
- **Design**: all components in one process (ECS), data passed in memory; horizontal scaling by running more copies [V].
- **Numbers**: >90% infrastructure cost reduction [V].
- **Nuance**: it was one team's service, not "Amazon abandoned microservices"; Cockcroft frames it as "serverless first, not serverless only" [V].
- **Rule**: *Estimate per-unit cost of orchestration and inter-stage data transfer for high-frequency pipelines before choosing a distributed/serverless design; co-locate stages that exchange large data at high frequency.*

### 15. Stack Overflow — small-server monolith
- **Sources**: Nick Craver, "Stack Overflow: The Architecture – 2016 Edition", https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/ [V]; "The Hardware – 2016 Edition" [V]; InfoQ on .NET Core migration (2020) https://www.infoq.com/news/2020/04/Stack-Overflow-New-Architecture/ [V: exists].
- **Design**: .NET monolith, on-prem; 9 primary web servers (+2 dev/meta); 4 SQL Servers (2 clusters); Redis; custom tag engine; Elasticsearch; heavy caching; very efficient code [V for web/SQL server counts]. ~200M+ HTTP requests/day, ~66M page loads/day (2016) [U].
- **Rule**: *Measure before distributing. A well-optimized monolith on a handful of powerful servers can serve a top-50 website; performance work (queries, caching, allocations) beats adding tiers.*

### 16. WhatsApp — Erlang and a tiny team (2014)
- **Sources**: Sequoia, "Four numbers that explain why Facebook acquired WhatsApp", https://sequoiacap.com/article/four-numbers-that-explain [V: exists]; highscalability "The WhatsApp Architecture Facebook Bought For $19 Billion", https://highscalability.com/the-whatsapp-architecture-facebook-bought-for-19-billion/ [V].
- **Numbers**: ~450M active users, ~32 engineers at acquisition (Feb 2014) [V]; ~2M concurrent TCP connections per FreeBSD server (2012) [V]; 50B messages/day [V: search summary; date U].
- **Design**: Erlang/OTP (lightweight processes, supervision trees, hot code loading), FreeBSD tuning, Mnesia/custom stores, minimal feature set [U: details].
- **Rule**: *Tech chosen for the dominant workload (millions of long-lived connections → Erlang/BEAM) plus ruthless scope control lets a tiny team run huge scale. Match runtime to workload shape.*

### 17. 37signals (Basecamp/HEY) — leaving the cloud (2022–2025)
- **Sources**: The Register (Oct 2024) https://www.theregister.com/2024/10/21/37signals_aws_savings/ [V]; DCD https://www.datacenterdynamics.com/en/news/37signals-claims-it-saved-almost-2m-last-year-from-cloud-repatriation/ [V]; The Register (May 2025) on storage exit [V]; DHH posts at world.hey.com/dhh [U].
- **Numbers (as of 2024-10)**: cloud bill $3.2M/yr → $1.3M/yr; remaining $1.3M was S3 (~10 PB) on a contract ending 2025; plan: dual-DC Pure Storage, 18 PB, costing about one year of S3 spend; projected >$10M saved over 5 years (earlier estimate $7M) [V].
- **Rule**: *For stable, predictable workloads at meaningful spend, compute the 3–5 year TCO of owned/colocated hardware vs cloud (including ops headcount). Elasticity is worth paying for only if you use it.*

### 18. Dropbox — Magic Pocket (2015–2016)
- **Sources**: "Scaling to exabytes and beyond", https://dropbox.tech/infrastructure/magic-pocket-infrastructure [V]; InfoQ "Magic Pocket: Dropbox's Exabyte-Scale Blob Storage System", https://www.infoq.com/articles/dropbox-magic-pocket-exabyte-storage/ [V]; Computerworld on ~500 PB moved [V].
- **Numbers**: serving user files from Magic Pocket from Feb 27, 2015; ~90% of user data (~500 PB) moved off S3 within ~2.5 years; multi-region; 99.99% availability target [V].
- **Rule**: *Building your own storage only pays off when storage *is* the product and the scale is enormous; keep an abstraction layer so backends can be swapped (Dropbox kept S3 for some regions/cases) [V/U].*

### 19. LinkedIn — Kafka and "The Log" (2010–2013)
- **Source**: Jay Kreps, "The Log: What every software engineer should know about real-time data's unifying abstraction" (Dec 2013), https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying [V].
- **Problem**: N sources × M destinations point-to-point pipelines between databases, search, Hadoop, monitoring [U].
- **Design**: an append-only, totally ordered log as the central integration point; every system subscribes [V]. Book "I Heart Logs" (2014) [V].
- **Rule**: *When many systems need the same change stream, publish it once to a durable log (CDC/Kafka) rather than building pairwise integrations; treat the log as the source of truth for derived data.*

### 20. Netflix — chaos engineering and the edge gateway
- **Sources**: "The Netflix Simian Army" (July 2011), https://netflixtechblog.com/the-netflix-simian-army-16e57fbab116 [V]; Zuul https://github.com/Netflix/zuul [U]; "Zuul 2: The Netflix Journey to Asynchronous, Non-Blocking Systems" (2016) [U]; Principles of Chaos Engineering https://principlesofchaos.org [U].
- **Design**: Chaos Monkey randomly terminates production instances to force resilience to instance loss; Simian Army extended to latency (Latency Monkey), conformity etc. [V]. Zuul = edge gateway for routing, auth, canarying, load shedding [U].
- **Rule**: *If you claim a failure is survivable, test it in production-like conditions on a schedule. Start with game days before automated fault injection.*

### 21. Airbnb — Monorail → SOA → micro+macro services
- **Sources**: Jessica Tai, "The Human Side of Airbnb's Microservice Architecture" (QCon/InfoQ), https://www.infoq.com/presentations/airbnb-culture-soa/ [V]; ByteByteGo guides [V].
- **Timeline**: Rails monolith "Monorail" 2008–2017 (confusing ownership, slow deploys) → microservices 2017–2020 with service tiers (data service, derived data, middle tier, presentation) → 2020+ "micro + macroservices" hybrid unifying APIs because hundreds of services were hard for humans to manage [V].
- **Rule**: *Migrate to services to fix ownership/deploy contention, but plan for aggregation (macroservices/gateways) as the service count grows.*

### 22. Cloudflare — Durable Objects (2020–2024)
- **Sources**: "Zero-latency SQLite storage in every Durable Object" (Sept 26, 2024), https://blog.cloudflare.com/sqlite-in-durable-objects/ [V]; docs https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/ [V].
- **Design**: each object has a globally unique ID, runs single-threaded on one machine, with co-located storage — since 2024 a private SQLite DB in the same thread; WAL streamed to object storage (batched every 16 MB or 10 s) [V]. Objects are meant to **scale out, not up** [V]: one object per chat room / document / game / user.
- **Rule**: *Model coordination-heavy state as many small single-writer actors keyed by entity; avoid a single global object/row that everyone writes.*

### 23. Linear — client sync engine
- **Sources**: Tuomas Artman talk "Unexpected benefits of going local-first" (Local-First Conf 2024), https://www.youtube.com/watch?v=VLgmjzERT08 [V: exists]; reverse-engineering write-up https://github.com/wzhudev/reverse-linear-sync-engine [V]; localfirst.fm episode 15 [V: exists].
- **Design**: client bootstraps workspace data into **IndexedDB**, keeps a normalized in-memory **object graph** (MobX observables); mutations sent as transactions; server assigns increasing sync IDs and broadcasts **delta packets** to all clients including the originator [V]. Later: partial/lazy bootstrapping for large workspaces [U].
- **Lesson**: A sync engine made UI instant, gave offline and real-time for free, and let frontend engineers build features without new endpoints [V].
- **Rule**: *For collaborative productivity apps, consider a sync-engine architecture (local store + server-ordered deltas) early — it's very hard to retrofit. For CRUD admin apps, don't.*

### Cross-case synthesis (for a skill's "principles" section)

1. **Postpone distribution; buy runway with cheap levers** (bigger instance, replicas, pooling, caching, vertical partitioning) — Figma, Notion, Stack Overflow.
2. **Add an indirection layer before changing storage** — Discord data services, Figma DBProxy, Vitess at Slack/GitHub, Dropbox abstraction.
3. **Logical first, physical second** — Figma, GitHub, Notion/Instagram/Pinterest logical shards.
4. **The tenant is usually the right partition key — until tenants share data or become huge** — Notion, Shopify, Slack.
5. **Verify migrations by comparison** (dark reads / shadow traffic) and keep rollback at every step — Stripe, Notion, Figma.
6. **Service count is a cost** — Segment, Prime Video, Uber DOMA, Airbnb macroservices.
7. **Cost is an architectural requirement** — Prime Video, 37signals, Dropbox.
8. **Time-sortable IDs are a recurring enabler** — Snowflake, Instagram, Discord, Pinterest.

---

## PART B — Data modeling and database schema design

Default database assumption for examples: PostgreSQL (16–18). MySQL/SQLite notes where they differ.

### B.1 Start from access patterns and invariants

Procedure the agent should follow before writing DDL:

1. **List entities and their lifecycles** (created by whom, mutated how, deleted when).
2. **List invariants** — "an order's total equals the sum of its lines", "an email is unique per tenant", "a room can't be double-booked", "balance never negative". Classify each: enforceable by a *constraint* (NOT NULL / CHECK / UNIQUE / FK / EXCLUDE), by a *transaction* (multi-row), or only *eventually* (cross-service).
3. **List access patterns** with frequency and latency needs: "get order with lines by id (hot)", "list a tenant's orders by created_at desc, paginated (hot)", "monthly revenue by country (analytics, not OLTP)".
4. **Design the normalized model**, then **index for the access patterns**, then (only if measured) **denormalize** specific paths.
5. **Decide ownership** (which module/service may write each table) and whether any table will need partitioning (Postgres declarative partitioning by time/tenant) or sharding.

Rule: *Constraints in the database are the last line of defense against every bug in every client, script and future service. App-level validation is for UX; DB constraints are for correctness.*

### B.2 Normalization and denormalization

- Default to **3NF**: every non-key attribute depends on the key, the whole key, and nothing but the key. It removes update anomalies (same fact stored twice, updated once).
- Denormalize **deliberately, with a mechanism to keep copies in sync**:

| Denormalization | When OK | Keep in sync by |
|---|---|---|
| Snapshot copy (e.g. `order_lines.unit_price` copied from product) | The value must be *frozen* at the time of the event (price paid, address shipped to) | Nothing — it's not a copy, it's a historical fact. Always do this for money/addresses on orders/invoices |
| Counter cache (`posts.comment_count`) | Count is read far more than written and `count(*)` is too slow | Same transaction as the child insert/delete, or async + periodic reconciliation |
| Materialized view / summary table | Aggregations for dashboards | `REFRESH MATERIALIZED VIEW CONCURRENTLY` on schedule (needs a unique index) or incremental jobs |
| Read model / projection | CQRS, search, feeds | Events/CDC; must be rebuildable from source |
| JSONB blob of child data | Child is always read/written with parent, never queried independently | Application; accept no FK/constraints inside |

Rule: *Every denormalized field needs a named source of truth and a named sync mechanism in the design doc.*

### B.3 Primary keys

#### Decision table

| Option | Size | Ordered? | Generated where | Leaks | Best for | Watch out |
|---|---|---|---|---|---|---|
| `bigint GENERATED ALWAYS AS IDENTITY` | 8 B | Yes (monotonic per sequence) | DB | Row counts / growth rate if exposed | Default for single-DB OLTP; internal FKs | Needs DB round-trip to know ID; merging DBs; enumeration if exposed |
| **UUIDv7** (RFC 9562, May 2024) | 16 B | Yes (48-bit Unix ms timestamp prefix) | Anywhere | Creation timestamp (ms) | Distributed/offline/client-generated IDs, public IDs, multi-region | 2x storage of bigint; timestamp leak; clock skew between generators |
| UUIDv4 | 16 B | No (random) | Anywhere | Nothing | Unguessable tokens (not PKs of big tables) | Random inserts across B-tree → page splits, poor cache locality, WAL bloat; especially bad as MySQL InnoDB clustered PK |
| ULID | 16 B (26-char Crockford base32 text) | Yes (48-bit ms + 80 random bits) | Anywhere | Creation time | Same niche as UUIDv7, pre-2024 | Not an IETF standard (spec: github.com/ulid/spec [U]); store as `uuid`/binary, not text. Shopify uses ULIDs for idempotency keys [V] |
| Snowflake-style 64-bit | 8 B | Roughly (k-sorted) | App workers | Time, worker ID | Very high write rates across many writers needing 64-bit | Worker-ID assignment; clock regression handling; JS numbers lose precision above 2^53 → send as strings in JSON |
| Natural key (email, ISBN, country code) | varies | — | Real world | Real data | Small, truly immutable reference data (ISO codes) | Natural keys change (emails, names, even "immutable" government IDs); cascading key updates |

Facts:
- RFC 9562 (May 2024) obsoletes RFC 4122 and defines UUID versions 6, 7, 8 [V]. UUIDv7 layout: 48-bit big-endian Unix epoch ms, version, 12 bits `rand_a`, variant, 62 bits `rand_b` [U: bit layout from memory of the RFC].
- **PostgreSQL 18** (released Sept 2025) adds built-in `uuidv7()`; it uses 12 extra bits of sub-millisecond precision to guarantee monotonicity within a backend session; `uuid_extract_timestamp()` works for v7; optional shift interval argument [V: https://www.postgresql.org/docs/current/functions-uuid.html and summaries]. Before PG18, use an extension (e.g. `pg_uuidv7`) or generate in the app [U].
- Postgres wiki "Don't Do This" advises against `serial`; use identity columns [V: https://wiki.postgresql.org/wiki/Don't_Do_This].
- MySQL/InnoDB clusters rows by PK, so random PKs hurt insert performance more than in Postgres heap tables [U: well-known, not re-verified].

Recommendation pattern (two-ID model):

```sql
CREATE TABLE customers (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- internal joins/FKs
  public_id   uuid NOT NULL DEFAULT uuidv7() UNIQUE,             -- exposed in URLs/APIs (PG18+)
  tenant_id   bigint NOT NULL REFERENCES tenants(id),
  email       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```
- Or use UUIDv7 as the single PK when IDs must be generated outside the DB (offline clients, multi-region, event-sourced aggregates). Both are defensible; pick one per system and document it.
- **"Never expose sequential IDs?"** — nuance: exposing sequential IDs leaks business volume (competitors can estimate user/order counts — ByteByteGo ID guide [V]) and eases enumeration. But **authorization, not ID opacity, is the security control** (OWASP IDOR / broken object level authorization). Rule: *use non-sequential public IDs for externally visible resources AND check authorization on every access; never rely on unguessable IDs as access control* (exception: capability URLs like password-reset tokens, which must be long random secrets, not UUIDv7).

### B.4 Constraints in the database

```sql
CREATE TABLE orders (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenants(id),
  customer_id   bigint NOT NULL REFERENCES customers(id),
  status        text   NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','paid','shipped','cancelled','refunded')),
  currency      char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  total_minor   bigint NOT NULL CHECK (total_minor >= 0),
  placed_at     timestamptz NOT NULL DEFAULT now(),
  shipped_at    timestamptz,
  CHECK (shipped_at IS NULL OR shipped_at >= placed_at),
  CHECK ((status = 'shipped') = (shipped_at IS NOT NULL))
);
CREATE INDEX ON orders (customer_id);                       -- Postgres does NOT auto-index FK columns
CREATE INDEX ON orders (tenant_id, placed_at DESC);          -- "list tenant orders newest first"
```

Rules:
- **NOT NULL by default**; make a column nullable only when "unknown/not applicable" is a real state. Three-valued logic makes NULL a source of bugs (`NOT IN` with a NULL returns no rows — Postgres wiki "Don't Do This" [V]).
- **FKs everywhere within one database**; choose `ON DELETE` deliberately: `RESTRICT` (default-ish; safest), `CASCADE` (only for true composition like order → order_lines), `SET NULL` (optional relationships).
- **Postgres does not create indexes on referencing FK columns** — add them, or deletes on the parent do sequential scans [U: well-known; not re-verified]. MySQL InnoDB creates them automatically [U].
- **UNIQUE for business uniqueness**, including scoped uniqueness: `UNIQUE (tenant_id, lower(email))` via a unique expression index.
- **CHECK for domain rules** that involve only the row.
- **EXCLUDE** for non-overlap rules (bookings):
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE room_bookings (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id bigint NOT NULL REFERENCES rooms(id),
  during  tstzrange NOT NULL,
  EXCLUDE USING gist (room_id WITH =, during WITH &&)
);
```
  PG18 also adds `WITHOUT OVERLAPS` for temporal primary keys/unique constraints and `PERIOD` in foreign keys [U: PG18 release notes — verify before shipping].
- Postgres 15+: `UNIQUE NULLS NOT DISTINCT` when NULLs should collide [U].
- In SQLite, **foreign keys are off by default** — enable with `PRAGMA foreign_keys = ON;` per connection [U: well-known SQLite behavior].
- Don't use `varchar(n)` for arbitrary limits in Postgres; `text` + `CHECK (length(x) <= n)` if a real business limit exists (same storage/perf; changing a CHECK is cheaper than altering a type) [V: wiki lists varchar(n) guidance — detail U].

### B.5 Enums vs lookup tables vs CHECK

| Option | Add value | Remove/rename | Extra metadata (label, sort, active flag) | Recommended when |
|---|---|---|---|---|
| `text` + `CHECK (x IN (...))` | Alter constraint (can use NOT VALID + VALIDATE) | Easy | No | Small, code-owned state machines (order status) |
| Postgres `ENUM` type | `ALTER TYPE ... ADD VALUE` (cheap) | Hard: no `DROP VALUE`; requires type swap | No | Stable sets; compact storage (4 B) matters |
| Lookup table + FK | `INSERT` | `UPDATE`/soft-retire | Yes | Values managed by admins/users, need labels/i18n/ordering, or referenced by reporting |
| App-only enum (int in DB) | Code deploy | Dangerous (reused ints) | No | Avoid — DB can't validate, data is unreadable in SQL |

Rule: *Never store enum values as bare integers without a DB-level constraint. Prefer text + CHECK for code-owned states; lookup tables for data-owned categories.*

### B.6 Money

Rules:
- **Never float/double** for money (binary floating point can't represent 0.1 exactly).
- Store **amount + currency code** (ISO 4217, `char(3)`) together, always.
- Choose one of:
  - **Integer minor units** (`bigint amount_minor`) — Stripe's API expresses amounts in the smallest currency unit (e.g., cents) [U: well-known Stripe API behavior]. Minor-unit exponent varies by currency: JPY 0, USD/EUR 2, KWD/BHD 3 [U: ISO 4217]. Keep the exponent in a currency table, not hard-coded "/100".
  - **`numeric(p, s)`** with enough scale for your domain (e.g., `numeric(19,4)` for accounting, more for FX rates/unit prices of fractions of a cent).
- Avoid Postgres `money` type (locale-dependent formatting via `lc_monetary`, fixed fractional precision) — listed in Postgres wiki "Don't Do This" [V].
- Real-world failures from mixing units: Etsy decimal-point postage bug (100x over-charges) and "$25,000 of funny money" at Google Ads — both from separating/confusing major and minor units [V: awesome-falsehood links: https://web.archive.org/web/20250326135824/http://rachelbythebay.com/w/2022/12/02/25k/].
- Ledgers: **double-entry, append-only** entries; balances are derived (or cached with reconciliation); corrections are new reversing entries, never UPDATEs.

```sql
CREATE TABLE currencies (
  code        char(3) PRIMARY KEY,           -- 'USD', 'JPY', 'KWD'
  minor_unit  smallint NOT NULL CHECK (minor_unit BETWEEN 0 AND 4)
);
CREATE TABLE ledger_entries (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transfer_id  uuid   NOT NULL,              -- groups the balanced legs
  account_id   bigint NOT NULL REFERENCES accounts(id),
  currency     char(3) NOT NULL REFERENCES currencies(code),
  amount_minor bigint NOT NULL CHECK (amount_minor <> 0),  -- +credit / -debit
  created_at   timestamptz NOT NULL DEFAULT now()
);
-- invariant "each transfer sums to zero per currency" is enforced in the posting transaction
-- (or a deferred constraint trigger), and checked by a reconciliation job.
REVOKE UPDATE, DELETE ON ledger_entries FROM app_role;       -- append-only by permission
```

### B.7 Time

Rules:
- **Instants** (something happened): Postgres `timestamptz` — stores a UTC instant (µs since 2000-01-01 UTC); it does *not* store the original zone [V: Postgres wiki "Don't Do This" says use timestamptz, not timestamp]. MySQL: `DATETIME`/`TIMESTAMP` semantics differ; store UTC and be explicit [U].
- **Future local events** (meeting at 09:00 in Berlin next March; recurring class every Tuesday 19:30): store **local date-time + IANA zone ID** (`'Europe/Berlin'`), and compute the UTC instant at read time or re-compute when tzdata changes. Storing only UTC breaks when governments change DST/offset rules — Jon Skeet, "Storing UTC is not a silver bullet" (2019), https://codeblog.jonskeet.uk/2019/03/27/storing-utc-is-not-a-silver-bullet/ [V]. Also Shay Rojansky, https://www.roji.org/storing-timezones-in-the-db [V: exists].
- **Dates without time** (birthdays, due dates, billing periods): `date`, not a timestamp at midnight UTC.
- **Durations**: `interval` or integer units with the unit in the column name (`timeout_ms`).
- **User's zone**: store IANA ID (`America/Sao_Paulo`), never a fixed offset (`-03:00`) or abbreviation (`EST` is ambiguous).
- Name columns by meaning: `created_at`, `paid_at`, `starts_at_local` + `starts_tz`.
- Falsehoods references (via awesome-falsehood [V]): "Falsehoods programmers believe about time" (infiniteundo), "…time zones" (creativedeletion.com), Zach Holman "UTC is enough for everyone, right?", IANA tz database https://www.iana.org/time-zones.

```sql
CREATE TABLE events (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title          text NOT NULL,
  starts_local   timestamp NOT NULL,              -- wall-clock time (intentionally WITHOUT time zone)
  tz             text NOT NULL,                   -- IANA zone, e.g. 'Europe/Berlin'
  starts_at      timestamptz NOT NULL             -- derived cache: (starts_local AT TIME ZONE tz)
);
-- Do NOT make starts_at a GENERATED column: generated expressions must be IMMUTABLE and zone
-- conversion depends on tzdata, which changes. Compute starts_at in the app when writing, and
-- re-run a job after tzdata updates:
UPDATE events SET starts_at = starts_local AT TIME ZONE tz
WHERE starts_local > now() AT TIME ZONE tz AND starts_at <> (starts_local AT TIME ZONE tz);
```

### B.8 Names, addresses, emails, phones

Rules (sources via awesome-falsehood [V]):
- **Names**: one `full_name text` (plus optional `display_name`/`sort_name`) beats `first_name`/`last_name` for global users; don't restrict characters; don't assume ASCII, a family name, or immutability — Patrick McKenzie, "Falsehoods programmers believe about names" (2010), https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/; W3C "Personal names around the world", https://www.w3.org/International/questions/qa-personal-names.
- **Addresses**: store structured fields where you need them (country code, postal code for tax/shipping) plus free-form lines; don't require state/postal code for all countries; validate with a provider, not regex — https://www.mjt.me.uk/posts/falsehoods-programmers-believe-about-addresses/.
- **Emails**: store as entered; compare case-insensitively via `lower(email)` unique index or `citext` (Postgres) [U: citext is an extension]; validate by sending a verification email, not by regex — https://beesbuzz.biz/code/439-Falsehoods-programmers-believe-about-email. Local part is technically case-sensitive but virtually all providers treat it as insensitive; dedupe on lowercase.
- **Phones**: store E.164 normalized string (`+14155552671`) plus raw input; parse with libphonenumber — https://github.com/google/libphonenumber/blob/master/FALSEHOODS.md.
- **Gender/relationships**: avoid binary enums unless legally required; see qntm "Gay marriage: the database engineering perspective" [V: link in awesome-falsehood].
- Snapshot addresses onto orders/invoices (see B.2).

```sql
CREATE UNIQUE INDEX users_email_uniq ON users (tenant_id, lower(email));
```

### B.9 Soft delete vs archive vs hard delete

Brandur Leach, "Soft Deletion Probably Isn't Worth It" (2022), https://brandur.org/soft-deletion [V]: `deleted_at` leaks into every query, weakens foreign keys, complicates data removal; in 10+ years he never used it to undelete [V]. Alternative: on delete, insert the row as JSON into a `deleted_records` table, then hard delete [V].

| Approach | Pros | Cons | Use when |
|---|---|---|---|
| Hard delete | Simple; FKs and uniqueness stay correct; GDPR-friendly | No undo | Default |
| `deleted_at` soft delete | Easy undo; row stays in place | Every query/index must filter; FKs point at "deleted" rows; unique constraints need partial indexes; PII retained | User-facing "trash/restore" feature with a retention window |
| Archive table / `deleted_records` JSON | Clean live tables; recovery possible; easy retention expiry | Restore is manual; schema drift in JSON | Audit/"oops" recovery without product-level undo |
| Status column (`archived`, `closed`) | It's a real business state | — | When "deleted" is actually a lifecycle state (closed account) |

```sql
-- If you do soft delete: uniqueness only among live rows
CREATE UNIQUE INDEX projects_slug_live_uniq ON projects (tenant_id, slug) WHERE deleted_at IS NULL;
-- and a view the app uses by default
CREATE VIEW live_projects AS SELECT * FROM projects WHERE deleted_at IS NULL;

-- Brandur-style alternative
CREATE TABLE deleted_records (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name  text NOT NULL,
  object_id   text NOT NULL,
  data        jsonb NOT NULL,
  deleted_at  timestamptz NOT NULL DEFAULT now()
);
-- purge job: DELETE FROM deleted_records WHERE deleted_at < now() - interval '90 days';
```

### B.10 Audit / history / temporal data

Options:
1. **Audit log table** (who did what when): append-only, `actor_id`, `action`, `entity_type`, `entity_id`, `diff jsonb`, `occurred_at`, `request_id`. Written in the same transaction as the change (app-level) or by trigger.
2. **History (versions) table per entity**: trigger copies OLD row into `<table>_history` with `valid_from/valid_to` (transaction time).
3. **System-versioned temporal tables** (SQL:2011) — native in MariaDB, SQL Server, Db2 [U]; not native in Postgres (use triggers or extensions such as `temporal_tables` [U]).
4. **Bitemporal**: valid time (when true in the world) + transaction time (when recorded) — needed for insurance/finance/HR "as of" questions.
5. **Event sourcing** (B.21) — history is the primary data.

```sql
CREATE TABLE prices_history (LIKE prices INCLUDING DEFAULTS,
  valid_from timestamptz NOT NULL, valid_to timestamptz NOT NULL, changed_by bigint);
CREATE FUNCTION prices_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO prices_history SELECT OLD.*, OLD.updated_at, now(), current_setting('app.user_id', true)::bigint;
  RETURN NEW;
END $$;
CREATE TRIGGER prices_audit BEFORE UPDATE OR DELETE ON prices
  FOR EACH ROW EXECUTE FUNCTION prices_audit();
```
(For DELETE the trigger must `RETURN OLD`; shown simplified.)

Rule: *Decide up front which entities need "what did it look like at time T" — adding history later cannot recover the past.*

### B.11 Multi-tenancy schema options

(Short overview is in `E-architecture.md` §4.16; this adds schema-level detail.)

| Model | Isolation | Ops cost at 10k tenants | Cross-tenant analytics | Per-tenant restore/residency | Noisy neighbour | Typical fit |
|---|---|---|---|---|---|---|
| Shared tables + `tenant_id` (pool) | Logical (RLS helps) | Lowest | Easy | Hard | Highest | B2C / SMB SaaS default |
| Schema per tenant | Medium | Migrations × N schemas; catalog bloat | Harder (UNION) | Medium | Shared DB | Tens–hundreds of tenants |
| DB per tenant (silo) | Strong | Highest (N DBs, connections) | Hard (ETL) | Easy | None | Enterprise, regulated, residency |
| Cells/pods (groups of tenants per DB cluster) | Blast-radius | Medium | Via warehouse | Move tenant between cells | Contained | Shopify-style scale [V] |

Shared-table rules:
- `tenant_id NOT NULL` on **every** tenant-owned table, first column of composite indexes and unique constraints; include `tenant_id` in FKs (composite FK) to make cross-tenant references impossible:
```sql
CREATE TABLE projects (
  tenant_id bigint NOT NULL REFERENCES tenants(id),
  id        bigint GENERATED ALWAYS AS IDENTITY,
  name      text NOT NULL,
  PRIMARY KEY (tenant_id, id)
);
CREATE TABLE tasks (
  tenant_id  bigint NOT NULL,
  id         bigint GENERATED ALWAYS AS IDENTITY,
  project_id bigint NOT NULL,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, project_id) REFERENCES projects (tenant_id, id)  -- no cross-tenant links
);
```
- **Row-Level Security** as defense in depth:
```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;            -- also applies to the table owner
CREATE POLICY tenant_isolation ON tasks
  USING (tenant_id = current_setting('app.tenant_id')::bigint)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint);
-- per request, inside the transaction (safe with transaction-mode poolers):
BEGIN; SET LOCAL app.tenant_id = '42'; ... COMMIT;
```
  Caveats [U: Postgres docs behavior]: superusers and roles with `BYPASSRLS` bypass policies; owners bypass unless `FORCE`; use `SET LOCAL` (not `SET`) with PgBouncer transaction pooling; policies add predicates → index on `tenant_id`.
- Pick the tenant as the future shard key now (Notion workspace, Shopify shop) — it keeps sharding an option.

### B.12 JSON / JSONB columns

OK when:
- Attributes are sparse/heterogeneous and rarely filtered (per-integration settings, feature flags per tenant, user preferences).
- Storing an external payload verbatim (webhook bodies, API responses) for audit/replay.
- Document-shaped data always read/written whole with its parent.

Not OK when:
- You filter, join, aggregate or constrain on the field regularly → make it a column.
- You need FKs or uniqueness inside it.
- It's really a list of child entities that are individually updated (concurrent updates rewrite the whole document; large JSONB values are TOASTed and rewritten on each update [U]).

Techniques:
```sql
ALTER TABLE integrations ADD COLUMN config jsonb NOT NULL DEFAULT '{}'
  CHECK (jsonb_typeof(config) = 'object');
CREATE INDEX ON integrations USING gin (config jsonb_path_ops);          -- containment queries @>
ALTER TABLE integrations ADD COLUMN region text
  GENERATED ALWAYS AS (config->>'region') STORED;                          -- promote a hot field
```
Validate JSON shape at the app boundary (JSON Schema / zod / pydantic) and version it (`"v": 2`).

### B.13 Polymorphic associations (anti-pattern) and alternatives

Anti-pattern (common in Rails/Laravel): `comments(commentable_type text, commentable_id bigint)` — no FK possible, orphans, type strings coupled to class names. Bill Karwin, *SQL Antipatterns* (Pragmatic Bookshelf; 2010, "Volume 1" 2nd ed. 2022) [U: edition/year].

Alternatives:
```sql
-- (a) Exclusive arc: one nullable FK per parent type + exactly-one CHECK
CREATE TABLE comments (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id    bigint REFERENCES posts(id),
  photo_id   bigint REFERENCES photos(id),
  body       text NOT NULL,
  CHECK (num_nonnulls(post_id, photo_id) = 1)
);
-- (b) Per-parent join tables: post_comments(post_id, comment_id), photo_comments(photo_id, comment_id)
-- (c) Common supertype: commentables(id) referenced by posts.id, photos.id and comments.commentable_id
```
Rule: *If a column holds a foreign key, the database must be able to enforce it.*

### B.14 EAV (entity–attribute–value) anti-pattern

`attributes(entity_id, name, value text)` loses types, NOT NULL, CHECK, FKs, and makes every query a pivot. Replace with: real columns for known attributes; JSONB for truly dynamic ones; a typed "custom fields" design (`custom_field_definitions` + `custom_field_values` with typed value columns + CHECK) when end users define fields.

### B.15 Many-to-many

```sql
CREATE TABLE project_members (
  project_id bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    bigint NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       text   NOT NULL CHECK (role IN ('viewer','editor','admin')),
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX ON project_members (user_id);   -- reverse lookup "projects of a user"
```
Rules: composite PK prevents duplicates; add a reverse index; the join table often becomes a real entity (role, timestamps) — name it after the relationship (`memberships`, `enrollments`).

### B.16 Hierarchical data

| Model | Read subtree | Move subtree | Integrity | Notes |
|---|---|---|---|---|
| Adjacency list (`parent_id`) | Recursive CTE | O(1) update | FK works | Default; fine for depth ≤ ~dozens and moderate size |
| Closure table (`ancestor, descendant, depth`) | Single indexed query | Delete+insert O(subtree × depth) | FKs work | Frequent subtree/ancestor queries (permissions, org charts) |
| Materialized path / `ltree` (Postgres ext.) | Prefix/GiST query | Rewrite paths of subtree | No FK on path | Categories, file paths; `ltree` supports `@>`/`<@` with GiST [U] |
| Nested sets | Fast reads | Expensive writes | Fragile | Mostly avoid today |

```sql
CREATE TABLE folders (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id bigint REFERENCES folders(id),
  name      text NOT NULL,
  UNIQUE NULLS NOT DISTINCT (parent_id, name)       -- PG15+: unique names among siblings incl. root
);
WITH RECURSIVE subtree AS (
  SELECT id, parent_id, name, 1 AS depth FROM folders WHERE id = $1
  UNION ALL
  SELECT f.id, f.parent_id, f.name, s.depth + 1 FROM folders f JOIN subtree s ON f.parent_id = s.id
) SELECT * FROM subtree;
```
Prevent cycles in app/trigger when moving nodes (check new parent is not a descendant).

### B.17 Counters and hot rows

Problem: `UPDATE posts SET like_count = like_count + 1 WHERE id = $1` serializes all writers on one row (row lock); a viral item or a global counter becomes a bottleneck. Same pattern as Durable Objects "don't funnel everything through one object" [V].

Options:
- **Derive**: `count(*)` over an indexed child table (fine up to moderate sizes; cache it).
- **Slotted counters**: N rows per counter, write to a random slot, sum on read [U: described by PlanetScale "The slotted counter pattern"].
- **Buffer and flush**: increment in Redis / in-memory, flush aggregated deltas periodically (accept loss window or use a log).
- **Append-only events + periodic rollup** (likes table is the truth; count is a projection).
```sql
CREATE TABLE post_like_counters (
  post_id bigint NOT NULL REFERENCES posts(id),
  slot    smallint NOT NULL CHECK (slot BETWEEN 0 AND 15),
  count   bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, slot)
);
INSERT INTO post_like_counters (post_id, slot, count) VALUES ($1, floor(random()*16)::int, 1)
ON CONFLICT (post_id, slot) DO UPDATE SET count = post_like_counters.count + 1;
SELECT sum(count) FROM post_like_counters WHERE post_id = $1;
```
Also: inventory/seat counts need correctness, not just throughput → `UPDATE stock SET qty = qty - 1 WHERE sku = $1 AND qty > 0` and check affected rows (atomic conditional decrement), or reservation rows.

### B.18 Optimistic concurrency (version column)

```sql
ALTER TABLE documents ADD COLUMN version integer NOT NULL DEFAULT 1;
UPDATE documents SET body = $2, version = version + 1, updated_at = now()
WHERE id = $1 AND version = $3;         -- $3 = version the client read
-- 0 rows affected => someone else won: return 409 Conflict / 412 Precondition Failed
```
Expose `version` (or a hash) as an HTTP `ETag`; require `If-Match` on updates. Use pessimistic `SELECT ... FOR UPDATE` only for short, high-contention critical sections inside one transaction.

### B.19 Idempotency table and outbox table

(Patterns in `E-architecture.md` §4.7 and §4.11; schemas here.)

```sql
CREATE TABLE idempotency_keys (
  tenant_id      bigint NOT NULL,
  key            text   NOT NULL,                  -- client-supplied; ULID/UUID recommended
  request_hash   bytea  NOT NULL,                  -- reject same key with different payload (422)
  locked_at      timestamptz,                      -- in-flight marker (concurrent retry => 409)
  recovery_point text   NOT NULL DEFAULT 'started',-- Brandur-style atomic phases [V]
  response_code  integer,
  response_body  jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, key)
);
-- purge: DELETE FROM idempotency_keys WHERE created_at < now() - interval '24 hours';

CREATE TABLE outbox (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate     text  NOT NULL,
  aggregate_id  text  NOT NULL,
  event_type    text  NOT NULL,
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz
);
CREATE INDEX outbox_unpublished ON outbox (id) WHERE published_at IS NULL;   -- partial index
-- relay: SELECT ... WHERE published_at IS NULL ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED
```
Consumers keep an **inbox/processed_messages(message_id PK)** table to deduplicate.

### B.20 Migrations without downtime

(Expand/contract overview is in `E-architecture.md` §4.15; this adds lock mechanics, tools and SQL.)

**Postgres lock facts** [V: https://www.postgresql.org/docs/current/explicit-locking.html via search; xata.io/blog/migrations-and-exclusive-locks]:
- Most `ALTER TABLE` forms (ADD/DROP COLUMN, ALTER TYPE, RENAME, SET NOT NULL) take **ACCESS EXCLUSIVE**, which conflicts with everything including `SELECT`.
- **The lock queue**: an ALTER waiting behind a long-running query blocks *all* subsequent queries on that table, even reads → outage even if the ALTER itself would be instant [V].
- `CREATE INDEX CONCURRENTLY`, `VALIDATE CONSTRAINT`, `ANALYZE`, `VACUUM` take **SHARE UPDATE EXCLUSIVE** (don't block reads/writes) [V].
- Always set **`lock_timeout`** (commonly < 2–3 s) and retry with backoff [V: postgres.ai blog https://postgres.ai/blog/20210923-zero-downtime-postgres-schema-migrations-lock-timeout-and-retries].

Safe/unsafe cheat sheet (Postgres ≥ 12) [U: version details from memory — verify]:

| Change | Safe? | Safe recipe |
|---|---|---|
| Add nullable column | Yes (metadata only) | `SET lock_timeout` first |
| Add column with constant DEFAULT | Yes since PG11 (no rewrite) | Volatile defaults (e.g., `random()`, `clock_timestamp()`) still rewrite |
| Add NOT NULL to existing column | Scan under ACCESS EXCLUSIVE | Add `CHECK (col IS NOT NULL) NOT VALID` → `VALIDATE` → `SET NOT NULL` (PG12+ skips scan given valid check) → drop check |
| Add FK | Locks + scans | `ADD CONSTRAINT ... NOT VALID` then `VALIDATE CONSTRAINT` |
| Add CHECK | Scan | `NOT VALID` + `VALIDATE` |
| Create index | Blocks writes | `CREATE INDEX CONCURRENTLY` (outside a transaction; on failure leaves an INVALID index to drop and retry) |
| Add UNIQUE constraint | Blocks writes | `CREATE UNIQUE INDEX CONCURRENTLY` then `ADD CONSTRAINT ... UNIQUE USING INDEX` |
| Change column type (int → bigint) | Full rewrite | New column + trigger/dual-write + batched backfill + swap (expand/contract) |
| Widen `varchar(n)` / to `text` | Metadata only | — |
| Rename column/table | Instant, but breaks running code | Expand/contract: add new, dual-write, migrate readers, drop old; or a view |
| Drop column | Instant, but breaks code still selecting it | Stop reading/writing in code first (ORM ignore list), then drop |

```sql
-- Example: add a required, FK'd column to a big table
SET lock_timeout = '2s';
ALTER TABLE orders ADD COLUMN warehouse_id bigint;                                   -- 1. expand
ALTER TABLE orders ADD CONSTRAINT orders_wh_fk
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) NOT VALID;                    -- 2. constraint, no scan
-- 3. deploy code that writes warehouse_id for new rows
-- 4. backfill in batches (keyset by id), outside a big transaction:
UPDATE orders SET warehouse_id = 1
WHERE id IN (SELECT id FROM orders WHERE warehouse_id IS NULL AND id > $last ORDER BY id LIMIT 5000);
-- repeat with sleep; watch replication lag and autovacuum
ALTER TABLE orders VALIDATE CONSTRAINT orders_wh_fk;                                  -- 5. no write block
ALTER TABLE orders ADD CONSTRAINT orders_wh_nn CHECK (warehouse_id IS NOT NULL) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_wh_nn;
ALTER TABLE orders ALTER COLUMN warehouse_id SET NOT NULL;                            -- 6. no scan (PG12+)
ALTER TABLE orders DROP CONSTRAINT orders_wh_nn;
CREATE INDEX CONCURRENTLY orders_warehouse_id_idx ON orders (warehouse_id);
```

Backfill rules: batches of ~1k–10k rows; commit per batch; throttle on replication lag; make it resumable (keyset cursor stored); idempotent; never one giant `UPDATE` on a large table (bloat, long locks, replica lag).

Tools:
| Tool | DB | Mechanism | Source |
|---|---|---|---|
| **gh-ost** | MySQL | Triggerless: copies to ghost table, tails binlog, pausable, cut-over swap | https://github.com/github/gh-ost [V] |
| pt-online-schema-change | MySQL | Triggers + shadow table | Percona Toolkit [V: comparison sources] |
| Vitess / PlanetScale online DDL | MySQL | Managed shadow-table migrations | https://planetscale.com/docs/vitess/schema-changes/online-schema-change-tools-comparison [V] |
| **pgroll** (Xata) | Postgres | Expand/contract automated; serves old+new schema versions simultaneously via **versioned views**; reversible | https://github.com/xataio/pgroll [V] |
| pg-osc | Postgres | Shadow table + triggers + swap (inspired by pt-osc) | https://github.com/shayonj/pg-osc [U] |
| strong_migrations (Rails), Squawk (linter), Django `AddIndexConcurrently` | Postgres | Static checks for dangerous DDL in CI | [U] |
| MySQL 8.0 `ALGORITHM=INSTANT` | MySQL | Instant ADD COLUMN (8.0.12+; any position 8.0.29+) | [U] |

Rule: *Every migration PR states: lock level taken, expected duration on production-size data, lock_timeout, backfill plan, and rollback. Schema changes and code changes ship in separate deploys following expand → migrate → contract.*

### B.21 Indexing strategy

Rules:
- Index for **the queries you have** (from pg_stat_statements / slow log), not for columns.
- **Composite order**: equality-filtered columns first, then the range/sort column: `(tenant_id, status, created_at DESC)` serves `WHERE tenant_id=? AND status=? ORDER BY created_at DESC LIMIT 50`. B-tree uses the **leftmost prefix**.
- **Covering** (Postgres 11+ `INCLUDE`) to enable index-only scans: `CREATE INDEX ON orders (customer_id) INCLUDE (status, total_minor);` [U: version].
- **Partial** indexes for skewed predicates: `WHERE published_at IS NULL`, `WHERE deleted_at IS NULL`, `WHERE status = 'pending'`.
- **Expression** indexes must match the query expression exactly: `lower(email)`.
- GIN for JSONB/arrays/full-text; GiST for ranges/geo/exclusion; BRIN for huge append-only time-series tables ordered physically by time.
- Every index slows writes and costs RAM; drop unused ones (`pg_stat_user_indexes.idx_scan = 0` over a representative period).
- **Keyset pagination** (`WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 50`) instead of large OFFSETs.
- Verify with `EXPLAIN (ANALYZE, BUFFERS)` on production-like data volumes; look for Seq Scan on large tables, row-estimate errors (stale stats → `ANALYZE`), sorts spilling to disk, nested loops with large outer sides.

### B.22 Naming conventions

| Item | Convention | Why |
|---|---|---|
| Identifiers | `snake_case`, lowercase, unquoted | Postgres folds unquoted identifiers to lowercase; quoted mixed-case forces quoting forever |
| Tables | Plural (`orders`) **or** singular — pick one per codebase and enforce | Consistency beats the choice; Rails/Django default to plural/app-prefixed [U] |
| PK | `id` | |
| FK | `<referenced_singular>_id` (`customer_id`) | Self-documenting joins |
| Timestamps | `<verb>_at` (`created_at`, `paid_at`) as timestamptz; dates `<noun>_on`/`_date` | Distinguish instant vs date |
| Booleans | `is_active`, `has_mfa`; prefer timestamps when "when" matters (`verified_at` over `is_verified`) | More information for free |
| Money | `<name>_minor` + `currency`, or `numeric` with `currency` | Unit is explicit |
| Units | Suffix units: `_ms`, `_bytes`, `_kg` | Prevent unit confusion |
| Constraints/indexes | `<table>_<cols>_<type>` (`orders_customer_id_fk`, `users_email_uniq`) | Readable error messages and migrations |
| Avoid | Reserved words (`user`, `order`, `group`), abbreviations, type prefixes (`tbl_`, `str_`) | |

### B.23 NoSQL modeling and when document stores fit

- **DynamoDB single-table design** (Rick Houlihan, AWS re:Invent 2018 "Advanced Design Patterns for DynamoDB" DAT401 [U]; Alex DeBrie, *The DynamoDB Book* (2020) [U] and "The What, Why, and When of Single-Table Design with DynamoDB", https://www.alexdebrie.com/posts/dynamodb-single-table/ [V]):
  - Start from a complete list of access patterns; design partition key (PK) / sort key (SK) and GSIs so each pattern is a single `Query`/`GetItem`. Pre-join related items by giving them the same PK (item collections).
  - Generic key names with typed prefixes: `PK = "CUSTOMER#123"`, `SK = "ORDER#2026-09-30#8421"`; GSI overloading for inverse relationships.
  - Downsides (DeBrie [V]): steep learning curve; **inflexible to new access patterns**; hard to export for analytics. He advises it's often not worth it for GraphQL apps or when developer flexibility matters more than per-request efficiency [V]. AWS also publishes "single-table vs multi-table design" guidance, https://aws.amazon.com/blogs/database/single-table-vs-multi-table-design-in-amazon-dynamodb/ [V: exists].

```
PK              SK                        attrs
CUSTOMER#123    PROFILE                   name, email
CUSTOMER#123    ORDER#2026-09-30#8421     status, total_minor, currency
ORDER#8421      LINE#001                  sku, qty
GSI1PK=ORDER#8421 GSI1SK=CUSTOMER#123     (inverted index for "who placed order 8421")
```
- **Cassandra/ScyllaDB**: model one table per query; partition key bounds partition size (Discord `channel_id + bucket` [V]); clustering key gives sort order; no joins, no ad-hoc queries.
- **Document stores (MongoDB etc.)** fit when: aggregate is read/written as a unit, schema varies per record, relationships are mostly containment; they fit poorly for many-to-many relations and cross-document invariants. Discord's MongoDB outgrew RAM at ~100M messages [V] — the issue was working set, not "documents".
- Decision rule: *Default to a relational database. Choose a wide-column/key-value store when access patterns are known, few, and at a scale/latency profile where a relational DB has been shown to struggle — and budget for the loss of ad-hoc querying (plan CDC to a warehouse).*

### B.24 Event sourcing — data implications

- Schema: `events(stream_id, version, type, data jsonb, metadata jsonb, occurred_at)`, `PRIMARY KEY (stream_id, version)` gives optimistic concurrency (append with expected version; unique violation = conflict).
- Projections/read models are **derived and rebuildable**; version them and support full replay.
- **Event schema evolution**: events are immutable; handle old versions via upcasting or versioned event types (Greg Young, *Versioning in an Event Sourced System*, Leanpub [U]).
- **Snapshots** for long streams.
- **PII vs immutability**: GDPR erasure conflicts with append-only logs → keep PII out of events (reference IDs) or use **crypto-shredding** (encrypt PII per subject with a per-subject key; delete the key to erase) [U: widely described pattern].
- Don't event-source everything; use it for domains where history *is* the requirement (ledgers, audit-heavy workflows). Otherwise, state tables + outbox events.

```sql
CREATE TABLE events (
  stream_id   uuid        NOT NULL,
  version     integer     NOT NULL CHECK (version > 0),
  type        text        NOT NULL,
  data        jsonb       NOT NULL,
  metadata    jsonb       NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  global_seq  bigint GENERATED ALWAYS AS IDENTITY UNIQUE,   -- for subscribers reading "all events"
  PRIMARY KEY (stream_id, version)
);
```
(Note: identity values can commit out of order across concurrent transactions; subscribers reading by `global_seq` must handle gaps — a known subtlety [U].)

### B.25 Data retention, PII and GDPR-style deletion by design

- **Data minimization** and **storage limitation** principles (GDPR Art. 5(1)(c), (e)) [U: article refs from memory]; **right to erasure** (Art. 17) [U].
- Design rules:
  - Inventory PII per column (tag in schema comments or a data catalog): `COMMENT ON COLUMN users.email IS 'pii:contact';`
  - Isolate PII in few tables keyed by user; reference by ID elsewhere so erasure touches few rows.
  - Every table has a **retention rule** (keep forever / N days / until account deletion) and a scheduled purge job; partition time-series tables by time so retention = `DROP`/`DETACH PARTITION` (cheap) instead of massive DELETEs.
  - Erasure workflow: a `deletion_requests` table with state machine, fan-out to every system (DB, search index, warehouse, caches, logs, third parties/processors), completion evidence.
  - Backups: document that backups age out within the retention window rather than editing backups (common approach) [U: legal nuance — flag for counsel].
  - Pseudonymize analytics (replace user IDs with keyed hashes) so warehouse data needs less erasure.
  - Logs: don't log PII by default (structured logging with redaction).
- Rule: *If you can't list where a user's personal data lives, you can't delete it. Model PII location and retention in the schema from day one.*

### B.26 OLTP vs OLAP separation

- Don't run heavy analytics or exports on the primary. Progression: read replica (short term) → CDC to warehouse/lakehouse (Debezium → Kafka → S3/Iceberg/Hudi/Delta or managed ELT) → columnar store (BigQuery, Snowflake, Redshift, ClickHouse; DuckDB for small/embedded). Notion's pipeline is a documented example (Debezium → Kafka → Hudi → S3; >$1M saved; freshness days → minutes/hours) [V].
- OLTP model = normalized, constraint-heavy; OLAP model = denormalized star/snowflake schemas (fact + dimension tables), slowly changing dimensions (SCD type 2 for history).
- Contract: treat CDC topics / warehouse tables as a public interface — schema changes in OLTP must consider downstream consumers (data contracts).
- Rule: *Keep OLTP schemas normalized for correctness; build analytics shapes downstream from a change stream.*

### B.27 SQLite in production

- Fit: single-server apps, read-heavy sites, edge/embedded, per-tenant DBs, tests. Single writer at a time (WAL allows concurrent readers during a write) [U: SQLite docs].
- Recommended pragmas [U: common practice]: `journal_mode=WAL`, `busy_timeout=5000`, `synchronous=NORMAL` (with WAL), `foreign_keys=ON` (off by default!), use `STRICT` tables (SQLite 3.37+) for type enforcement [U].
- **Litestream** (Ben Johnson): streams WAL to object storage for backup/PITR; **v0.5.0 (Oct 2025)** reworked architecture with multi-level compaction (30 s / 5 min / hourly levels) for fast point-in-time restore; read-replica VFS in progress [V: https://simonwillison.net/2025/Oct/3/litestream/ and https://github.com/benbjohnson/litestream/releases].
- **Turso**: libSQL (open fork of SQLite) powers production deployments; "Turso Database" (formerly "Limbo") is a from-scratch Rust rewrite with async I/O and MVCC/`BEGIN CONCURRENT`, in beta (as of 2025) [V: https://turso.tech/blog/introducing-limbo-a-complete-rewrite-of-sqlite-in-rust].
- Cloudflare Durable Objects embed SQLite per object (2024) [V]; Cloudflare D1 is SQLite-based [U].
- Rails 8 (late 2024) promotes SQLite for production with Solid Queue/Cache/Cable [U].
- Rule: *SQLite is a legitimate production choice for single-node or per-tenant/per-entity databases when you configure WAL + busy_timeout + foreign_keys and have continuous off-host backup (Litestream). Choose a client/server DB when you need multiple app servers writing to the same database.*

### B.28 Data-modeling review checklist (for a skill)

1. Access patterns and invariants listed? Each invariant mapped to a constraint or a transaction?
2. Every column NOT NULL unless justified? CHECKs for domains? UNIQUE for business keys (tenant-scoped, case-insensitive where needed)?
3. FKs declared, FK columns indexed, ON DELETE chosen deliberately?
4. PK strategy chosen and documented; public IDs non-sequential; authorization still checked?
5. Money = integer minor units or numeric + currency; no floats; snapshot prices/addresses on orders?
6. Time = timestamptz for instants; local time + IANA zone for future events; `date` for dates?
7. Soft delete justified? Partial unique indexes if used? Retention/purge defined?
8. Tenant isolation: tenant_id on all tenant tables, composite FKs, RLS as defense in depth?
9. JSONB only for sparse/opaque data; no polymorphic FKs; no EAV?
10. Hot rows/counters identified; concurrency control (version column / conditional update) on contested rows?
11. Idempotency and outbox tables for external side effects and events?
12. Migration plan: lock levels, lock_timeout, batched backfill, expand/contract, rollback?
13. Indexes match the top queries (verified with EXPLAIN ANALYZE); no redundant indexes?
14. Naming consistent (snake_case, `_id`, `_at`, units)?
15. PII inventoried; history/audit requirements decided up front; analytics served from a replica/warehouse, not the primary?

---

## Source index (URLs)

System design method
- Malte Ubl, Design Docs at Google — https://www.industrialempathy.com/posts/design-docs-at-google/ [V]
- karanpratapsingh/system-design (interview method) — local clone; https://github.com/karanpratapsingh/system-design [V]
- Google SRE book, SLO chapter — https://sre.google/sre-book/service-level-objectives/ [U]

Case studies
- Discord 2023 — https://discord.com/blog/how-discord-stores-trillions-of-messages [V]
- Discord 2017 — https://blog.discordapp.com/how-discord-stores-billions-of-messages-7fa6ec7ee4c7 [V: URL in local refs]
- Figma 2023 vertical partitioning — https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/ [V]
- Figma 2024 horizontal sharding — https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/ [V]
- Figma multiplayer — https://www.figma.com/blog/how-figmas-multiplayer-technology-works/ [V]
- Notion sharding — https://www.notion.com/blog/sharding-postgres-at-notion [V]
- Notion data lake — https://www.notion.com/blog/building-and-scaling-notions-data-lake [V]
- Instagram IDs — https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c [V]
- Snowflake ID — https://en.wikipedia.org/wiki/Snowflake_ID [V]
- Pinterest sharding — https://medium.com/pinterest-engineering/sharding-pinterest-how-we-scaled-our-mysql-fleet-3f341e96ca6f [V]
- Shopify shard balancing — https://shopify.engineering/mysql-database-shard-balancing-terabyte-scale [V]; tech stack — https://shopify.engineering/e-commerce-at-scale-inside-shopifys-tech-stack [V]; Kovyrin interview — https://kovyrin.net/2024/06/16/interview-inside-shopify-monolith/ [V]
- Stripe online migrations — https://stripe.com/blog/online-migrations [V]
- Brandur idempotency keys — https://brandur.org/idempotency-keys [V]
- Slack Vitess — https://slack.engineering/scaling-datastores-at-slack-with-vitess/ [V]
- GitHub partitioning — https://github.blog/2021-09-27-partitioning-githubs-relational-databases-scale/ [V]; gh-ost — https://github.com/github/gh-ost [V]
- Uber Schemaless — https://www.uber.com/us/en/blog/schemaless-part-one-mysql-datastore/ [V]; DOMA — https://www.uber.com/us/en/blog/microservice-architecture/ [V]
- Segment — https://segment.com/blog/goodbye-microservices/ [V]
- Prime Video — https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90 [V]; Cockcroft — https://adrianco.medium.com/so-many-bad-takes-what-is-there-to-learn-from-the-prime-video-microservices-to-monolith-story-4bd0970423d4 [V]
- Stack Overflow — https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/ [V]
- WhatsApp — https://highscalability.com/the-whatsapp-architecture-facebook-bought-for-19-billion/ [V]; https://sequoiacap.com/article/four-numbers-that-explain [V]
- 37signals — https://www.theregister.com/2024/10/21/37signals_aws_savings/ [V]; https://www.datacenterdynamics.com/en/news/37signals-claims-it-saved-almost-2m-last-year-from-cloud-repatriation/ [V]
- Dropbox — https://dropbox.tech/infrastructure/magic-pocket-infrastructure [V]; https://www.infoq.com/articles/dropbox-magic-pocket-exabyte-storage/ [V]
- LinkedIn The Log — https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying [V]
- Netflix Simian Army — https://netflixtechblog.com/the-netflix-simian-army-16e57fbab116 [V]
- Airbnb — https://www.infoq.com/presentations/airbnb-culture-soa/ [V]
- Cloudflare DO SQLite — https://blog.cloudflare.com/sqlite-in-durable-objects/ [V]
- Linear — https://www.youtube.com/watch?v=VLgmjzERT08 [V]; https://github.com/wzhudev/reverse-linear-sync-engine [V]

Data modeling
- Postgres wiki "Don't Do This" — https://wiki.postgresql.org/wiki/Don't_Do_This [V]
- Postgres UUID functions (uuidv7) — https://www.postgresql.org/docs/current/functions-uuid.html [V]
- RFC 9562 — https://www.rfc-editor.org/rfc/rfc9562 [U: URL pattern; RFC date V]
- Postgres explicit locking — https://www.postgresql.org/docs/current/explicit-locking.html [V]
- Xata lock queue — https://xata.io/blog/migrations-and-exclusive-locks [V]; pgroll — https://github.com/xataio/pgroll [V]
- postgres.ai lock_timeout — https://postgres.ai/blog/20210923-zero-downtime-postgres-schema-migrations-lock-timeout-and-retries [V]
- Brandur soft deletion — https://brandur.org/soft-deletion [V]
- Jon Skeet UTC — https://codeblog.jonskeet.uk/2019/03/27/storing-utc-is-not-a-silver-bullet/ [V]
- Alex DeBrie single-table — https://www.alexdebrie.com/posts/dynamodb-single-table/ [V]
- AWS single vs multi table — https://aws.amazon.com/blogs/database/single-table-vs-multi-table-design-in-amazon-dynamodb/ [V]
- Litestream v0.5 — https://simonwillison.net/2025/Oct/3/litestream/ [V]
- Turso/Limbo — https://turso.tech/blog/introducing-limbo-a-complete-rewrite-of-sqlite-in-rust [V]
- Falsehoods: names https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/ ; addresses https://www.mjt.me.uk/posts/falsehoods-programmers-believe-about-addresses/ ; email https://beesbuzz.biz/code/439-Falsehoods-programmers-believe-about-email ; phones https://github.com/google/libphonenumber/blob/master/FALSEHOODS.md ; time https://www.creativedeletion.com/2015/01/28/falsehoods-programmers-date-time-zones.html [V: all from local awesome-falsehood]

## Open verification items (before shipping into skills)
1. Discord: ScyllaDB per-node disk (9 TB), migration throughput; exact date of the 2023 post.
2. Notion: 2023 re-shard URL and numbers (32 → 96); workspace_id as partition key wording; whether the 2021 cutover had a short maintenance window.
3. Pinterest virtual shard count (4,096 vs 8,192).
4. Stack Overflow 2016 request/page-view numbers.
5. Postgres 18: `WITHOUT OVERLAPS`/`PERIOD` temporal constraints and NOT NULL `NOT VALID` support — confirm in release notes.
6. Stripe idempotency key 24 h expiry; Stripe idempotency blog URL.
7. GitHub MySQL 8.0 upgrade host count.
8. Slotted counter source URL (PlanetScale).
9. pg-osc repo owner; Squawk/strong_migrations URLs.
10. GDPR article numbers and backup-erasure guidance (flag as "not legal advice" in skills).
