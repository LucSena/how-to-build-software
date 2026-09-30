# Numbers for Back-of-Envelope Estimation

Orders of magnitude, not benchmarks. Use them to rule designs in or out; confirm with a load test before committing money or a one-way door.

## Contents
1. Latency numbers
2. Application-level numbers
3. Time and size conversions
4. Availability math
5. Queueing laws
6. Estimation template
7. Worked example

## 1. Latency numbers

The classic table (Jeff Dean / Peter Norvig, as reproduced in the System Design Primer). Modern NVMe and networks are faster for some rows; the ratios still guide design.

| Operation | Time |
|---|---|
| L1 cache reference | 0.5 ns |
| Branch mispredict | 5 ns |
| L2 cache reference | 7 ns |
| Mutex lock/unlock | 25 ns |
| Main memory reference | 100 ns |
| Compress 1 KB (Snappy) | 10 µs |
| Send 1 KB over 1 Gbps network | 10 µs |
| Read 4 KB randomly from SSD | 150 µs (modern NVMe: tens of µs) |
| Read 1 MB sequentially from memory | 250 µs |
| Round trip within a datacenter | 500 µs |
| Read 1 MB sequentially from SSD | 1 ms (NVMe: a fraction of that) |
| HDD seek | 10 ms |
| Read 1 MB over 1 Gbps network | 10 ms |
| Read 1 MB sequentially from HDD | 30 ms |
| Packet California → Netherlands → California | 150 ms |

Takeaways: memory is ~1,000× faster than a network round trip; a cross-continent round trip is ~150 ms, so a serial caller manages only 6–7 of them per second; within a datacenter, ~2,000 serial round trips per second.

## 2. Application-level numbers

Typical ranges; measure your own.

| Operation | Typical |
|---|---|
| Redis/Memcached GET, same zone | 0.2–1 ms |
| Postgres indexed point lookup (warm) | 0.1–1 ms server time; 1–3 ms incl. network |
| Cross-zone round trip | ~0.5–2 ms |
| Cross-region round trip (US east ↔ west) | ~60–80 ms |
| New TLS connection | +1 RTT with TLS 1.3 (0-RTT on resumption) |
| LLM API time to first token | ~0.3–2 s; full responses take seconds to minutes |
| Human perception | < 100 ms feels instant; < 1 s keeps flow; > 10 s loses attention |

## 3. Time and size conversions

| Unit | Value |
|---|---|
| 2^10 / 2^20 / 2^30 / 2^40 | ≈ thousand (KB) / million (MB) / billion (GB) / trillion (TB) |
| Seconds per day | 86,400 ≈ 10^5 |
| Seconds per month (30 d) | ≈ 2.6 × 10^6 |
| 1M requests/day | ≈ 12 rps |
| 10M/day | ≈ 116 rps |
| 100M/day | ≈ 1,160 rps |
| 1B/day | ≈ 11,600 rps |
| Peak / average | 2–10× (default 3×) |

## 4. Availability math

| Availability | Downtime per 30 days | Per year |
|---|---|---|
| 99% | 7.2 h | 3.65 d |
| 99.5% | 3.6 h | 1.83 d |
| 99.9% | 43.2 min | 8.76 h |
| 99.95% | 21.6 min | 4.38 h |
| 99.99% | 4.32 min | 52.6 min |
| 99.999% | 25.9 s | 5.26 min |

- **Serial dependencies multiply**: three 99.9% dependencies on the critical path → 0.999³ ≈ 99.7%.
- **Redundant components**: availability = 1 − (1 − a)^n, assuming independent failures (they rarely are fully independent — shared network, deploys, config).
- A service cannot be more available than its hard dependencies unless it degrades gracefully without them.

## 5. Queueing laws

- **Little's law**: L = λ × W. Items in the system = arrival rate × time each spends in it. 500 rps × 0.2 s = 100 concurrent requests. Queue with 50 jobs/s arriving and 4 s processing → 200 jobs in progress → need ≥ 200 worker slots or the backlog grows.
- **Utilization**: in a simple queue, waiting time grows roughly with ρ/(1 − ρ). At 50% utilization waits ≈ 1× service time; at 90%, ≈ 9×; at 99%, ≈ 99×. Plan sustained utilization of critical resources at ≤ 60–70%.
- **Amdahl's law**: speedup from parallelism is capped by the serial fraction; 10% serial work → at most 10× speedup, however many machines.
- **Universal Scalability Law** (Gunther): contention and coherency costs can make throughput *fall* as you add nodes; if adding instances made things worse, look for a shared lock, hot row, or chatty coordination.

## 6. Estimation template

Fill in, label each value **Measured** or **Estimated**:

```
Users:          DAU = ____ ; peak concurrent users = ____
Traffic:        requests/user/day = ____ → avg rps = DAU × req / 86,400 = ____
                peak rps = avg × ____ (default 3) = ____
Mix:            read:write = ____ ; heaviest endpoint = ____ (share ____ %)
Payload:        avg request ____ KB ; response ____ KB
Bandwidth:      peak rps × response size = ____ MB/s
Storage:        new rows/day × row size × (1.5–3 for indexes) × replicas = ____ GB/day → ____ TB/year
Hot set:        data touched daily ≈ ____ (often ~20% serves ~80% of reads) → cache memory ____
Concurrency:    peak rps × p95 latency (s) = ____ in flight → pool/worker sizing
Instances:      peak rps ÷ measured per-instance capacity = ____ ; + N+1 (or N+2) headroom
DB:             write rps ____ ; connections needed ____ vs (cores × 2 + 1) per primary
Cost:           instances + DB + storage + egress + third-party per month = ____ ; per active user ____
```

Per-instance capacity comes from a load test of the real endpoint, not from framework benchmarks.

## 7. Worked example

A B2B SaaS expects 50,000 DAU in 12 months, ~200 requests per user per day, read:write 9:1, p95 target 300 ms.

- Average rps: 50,000 × 200 / 86,400 ≈ 116 rps. Peak (3×) ≈ 350 rps; ~35 writes/s at peak.
- Concurrency: 350 × 0.3 s ≈ 105 in flight worst case (most requests are faster).
- One mid-sized Postgres primary handles this easily if queries are indexed; a pooler with ~20–40 server connections suffices for an 8–16 core DB.
- Two or three app instances behind a load balancer give N+1 headroom.
- Conclusion: no cache, replica, broker, or sharding required at this scale — spend the effort on indexes, bounded queries, and observability. Revisit if a single endpoint dominates or data exceeds a few hundred GB in one table.

## Sources

- donnemartin/system-design-primer (latency numbers, powers of two, availability): https://github.com/donnemartin/system-design-primer
- Jeff Dean, Numbers everyone should know (via the primer); Peter Norvig, Teach Yourself Programming in Ten Years: https://norvig.com/21-days.html
- Little's law: https://en.wikipedia.org/wiki/Little%27s_law
- Neil Gunther, Universal Scalability Law: https://www.perfdynamics.com/Manifesto/USLscalability.html
- Jakob Nielsen, Response Times: The 3 Important Limits: https://www.nngroup.com/articles/response-times-3-important-limits/
- Google SRE Book (availability and dependencies): https://sre.google/sre-book/availability-table/
