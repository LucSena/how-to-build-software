# Estimation for Design — Data Size, Hot Keys, Growth Triggers, Cost

Traffic math (rps conversions, latency table, Little's law, availability) lives in `scalability` → `references/numbers.md`. This file adds the estimates a design needs about **data**: how big, how skewed, when the next step becomes necessary, and what it costs. Estimates rule designs in or out; they do not replace a load test.

## Contents
1. The estimation worksheet
2. Sizing rows, tables, and indexes
3. Working set vs RAM
4. Hot keys and skew
5. Growth trigger points
6. Pricing a design
7. Worked example
8. Rules catalog

## 1. The estimation worksheet

Fill every line; write `unknown — assume N` when there is no data and list it as an open question.

```
Users:           DAU ___  peak concurrent ___          (Estimated/Measured)
Traffic:         actions/user/day ___ → avg rps ___ → peak rps ___ (×3 if unknown)
Mix:             read:write ___ ; heaviest endpoint ___ (% of traffic)
Payloads:        avg request ___ KB, avg response ___ KB, largest ___
Data:            rows/year per main table ___ ; avg row ___ B ; indexes ___
Storage:         now ___ ; +1y ___ ; +3y ___ (incl. indexes, replicas, backups)
Skew:            largest tenant ___ % of rows / traffic ; hottest key ___ rps
Limits:          ID width, provider rate limits, connection caps, partition size caps
Cost:            monthly ___ ; per unit (tenant / 1k requests / active user) ___
Triggers:        next step ___ at ___ ; step after ___ at ___
```

## 2. Sizing rows, tables, and indexes

- **Row size** ≈ sum of column sizes + per-row overhead (tens of bytes in Postgres for the tuple header and alignment) + variable-length data. Typical widths: `bigint` 8 B, `uuid` 16 B, `timestamptz` 8 B, `boolean` 1 B, `text` ≈ length + 1–4 B, `jsonb` ≈ larger than the JSON text.
- **Indexes** each add roughly the key width plus per-entry overhead per row; a table with five indexes can spend as much space on indexes as on data. Budget 1.5–3× raw data for indexes and overhead.
- **Multiply out:** rows/year × years retained × row size, plus indexes. Add replicas (× number of copies) and backups (× retention of backup copies).
- **Large values:** blobs, PDFs, images, and long transcripts go to object storage; the row keeps a key and metadata. A 200 KB value in a hot row multiplies I/O on every read.
- **Check the width of identifiers now.** A 32-bit integer key tops out around 2.1 billion; GitHub (2021) had Actions and Pages down for hours when a foreign key hit the INT32 maximum. Default to 64-bit keys.

## 3. Working set vs RAM

- The **working set** is the data and index pages touched by hot queries in a short window — often the recent slice of time-ordered data, plus all of every hot index.
- If the working set fits in the database's memory, point reads stay in the low milliseconds. When it stops fitting, latency becomes unpredictable: Discord's original MongoDB store degraded once data and indexes no longer fit in RAM (around 100M messages in 2015).
- Estimate: hot rows × row size + hot indexes. Compare with the instance's memory; plan the next step before the working set crosses ~70% of it.
- Levers in order: drop unused indexes, archive cold rows, partition by time so hot data is compact, bigger instance, then split data across databases.

## 4. Hot keys and skew

Ask for the largest thing, not the average:

| Question | Why it matters |
|---|---|
| Largest tenant's share of rows and traffic? | Tenant-sharded designs break when one tenant outgrows a shard (Slack's large enterprise workspaces) |
| Most-read single key (channel, product, celebrity)? | Many concurrent readers of one partition → hot partition (Discord) |
| Most-written single row (global counter, inventory item, rate-limit bucket)? | Row locks serialize writers; throughput caps at one row's lock rate |
| Largest single partition over time? | Unbounded partitions (all messages of a channel forever) grow until they fail; bucket by time |
| Burstiness (launch, marketing email, top of the hour)? | Peaks can exceed 10× average for minutes; cron jobs synchronize load |

Mitigations to name in the design: bucketing (entity + time window), request coalescing in a data-access layer, slotted counters, per-tenant rate limits, moving whales to their own cell or shard.

## 5. Growth trigger points

Write the next steps as thresholds, so the design can say "not yet":

| Step | Example trigger (tune to your system) |
|---|---|
| Add an index / fix query | A top query in `pg_stat_statements` exceeds its latency budget |
| Read replica | Primary CPU sustained > 60% with read-heavy mix, after query fixes |
| Bigger instance | CPU or memory sustained > 60–70% after query fixes |
| Time partitioning | A single append-only table grows past what vacuum and index maintenance handle comfortably, or retention deletes become heavy |
| Move a table group to its own database | One domain dominates load or size and has few joins with others (Figma's vertical partitioning) |
| Shard | Write rate or data size exceeds one primary after all of the above |

Record the current value next to each trigger and add an alert at roughly 50% and 80% of the threshold.

## 6. Pricing a design

- Compute **unit cost** (per tenant, per 1k requests, per active user) for the main path, not just the monthly total.
- Include what diagrams hide: data transfer between zones/regions and stages, per-request orchestration fees, NAT and egress, log ingestion, managed-service per-operation pricing.
- Prime Video's monitoring pipeline was dominated by per-state-transition orchestration charges and frame hand-off through object storage; moving the stages into one process cut infrastructure cost by over 90%.
- For stable, predictable workloads at large spend, compare 3–5 year total cost of owned or colocated hardware (including people) with cloud. 37signals reported its cloud bill falling from about $3.2M to about $1.3M a year after moving compute out (as of 2024-10). Elasticity is worth paying for only if you use it.

## 7. Worked example

A B2B note-taking app, blocks stored in Postgres.

- 50k DAU × 200 block writes/day = 10M writes/day ≈ 116 writes/s average, ~350/s peak (Estimated).
- Reads 10:1 → ~1,200/s average, ~3,500/s peak.
- Block row ≈ 60 B fixed + ~400 B content ≈ 0.5 KB; 3 indexes ≈ +0.3 KB → ~0.8 KB/row.
- Rows: 10M/day, ~40% are edits of existing rows → ~6M new rows/day ≈ 2.2B/year → ~1.8 TB/year incl. indexes.
- Largest workspace: 4% of rows (Measured from beta).
- Conclusion: year 1 fits one large Postgres primary with replicas; working set (recent blocks + indexes) must be watched; trigger for splitting by workspace at ~5 TB or sustained write saturation. Choose `workspace_id` as the leading key of every index now, so sharding by workspace stays possible.

## 8. Rules catalog

### Estimate the largest tenant, not just the total
**Rule.** Every estimate includes the biggest tenant, key, or partition and its share.
**Apply when.** Any multi-tenant or social/collaborative design.
**Do / Avoid.** Do: "largest tenant 15% of events; per-tenant concurrency cap." Avoid: "2M events/day spread evenly".
**Why.** Hot partitions and noisy neighbors come from skew; totals hide them (Discord, Slack).

### Write trigger points instead of building ahead
**Rule.** For each future scaling step, write the metric and threshold that triggers it and alert before it.
**Apply when.** The design is tempted to include sharding, a cache, or a new store "for later".
**Do / Avoid.** Do: "shard by workspace at 5 TB or sustained write saturation; alert at 50%/80%." Avoid: sharding on day one "to be safe".
**Why.** Premature distribution is a one-way door with permanent cost; a written threshold keeps the option without paying for it.

### Use 64-bit identifiers by default
**Rule.** Primary and foreign keys are 64-bit unless there is a written reason.
**Apply when.** Creating any table that can grow.
**Do / Avoid.** Do: `bigint GENERATED ALWAYS AS IDENTITY` or UUIDv7. Avoid: `serial`/`int` keys on event or token tables.
**Why.** Widening a key column on a large table is a long, risky migration; the ceiling arrives suddenly.

## Sources

- Discord, "How Discord Stores Trillions of Messages": https://discord.com/blog/how-discord-stores-trillions-of-messages
- Slack, "Scaling Datastores at Slack with Vitess": https://slack.engineering/scaling-datastores-at-slack-with-vitess/
- Figma, "The growing pains of database architecture": https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/
- GitHub availability report, May 2021: https://github.blog/news-insights/company-news/github-availability-report-may-2021/
- Prime Video Tech, monitoring service: https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90
- The Register on 37signals cloud exit (Oct 2024): https://www.theregister.com/2024/10/21/37signals_aws_savings/
- System Design Primer (latency numbers, estimation): https://github.com/donnemartin/system-design-primer
