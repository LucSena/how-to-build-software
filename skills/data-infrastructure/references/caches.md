# Caches: whether to add one, and which

Deciding if a cache is justified, which layer and engine to use, and how to size and configure it. Cache *mechanics* — cache-aside, invalidation after commit, versioned keys, stampede protection, CDN rules — live in `scalability` (`references/caching.md` there). Dated facts are as of 2026-09.

## Do you need a cache at all?

Most "the database is slow" problems are a missing index, an N+1 loop, an unbounded result set, or no connection pooling. A warm, indexed Postgres point lookup costs well under a millisecond of server time; a network hop to a cache is not free either. Fix the query first (`EXPLAIN (ANALYZE, BUFFERS)`, `pg_stat_statements`).

A cache is a **consistency liability** and a **second failure mode**: stale reads, invalidation bugs, cold-start stampedes after a flush or deploy, and a thundering herd onto the database if the cache dies.

Add one only when all four hold:
1. The same expensive result is read many times between changes (high read:write ratio for that key).
2. The data tolerates a stated staleness (write it down: "product prices may be 60 s stale").
3. You estimated the working set and expected hit rate (a cache below ~80–90% hit rate usually is not paying for itself).
4. You have a TTL and invalidation story, and the system still works (degraded) with an empty cache.

## Layers: use the cheapest one that works

| Layer | Examples | Best for | Invalidation |
|---|---|---|---|
| Browser / HTTP | `Cache-Control`, `ETag`, `stale-while-revalidate` | Hashed static assets, public GETs | Versioned URLs; short max-age + revalidate |
| CDN / edge | Cloudflare, Fastly, CloudFront, platform edge caches | Public pages, images, GETs identical for many users | Surrogate keys / tag purge, TTL |
| Reverse proxy | Nginx or Varnish micro-caching | Shielding the origin from bursts | TTL of 1–10 s |
| In-process | Caffeine (JVM), `lru-cache` (Node), ristretto/otter (Go), `functools.lru_cache`/`cachetools` (Python) | Hot config, flags, small reference data, per-instance memoization | TTL; pub/sub broadcast to evict; accept per-instance divergence |
| Distributed | Valkey/Redis, Memcached, managed (ElastiCache, Memorystore, Upstash, Momento) | Shared computed results, sessions, rate limits across instances | TTL + delete after commit, or CDC-driven eviction |
| Database-backed | Solid Cache (Rails, disk-backed in the SQL database) | Large fragment caches where disk is cheaper than RAM | TTL / FIFO eviction |
| Inside the database | Buffer cache, materialized views, summary tables | Aggregates refreshed on a schedule | `REFRESH MATERIALIZED VIEW CONCURRENTLY` |

Two tiers (in-process L1 + distributed L2) are common for very hot keys; keep L1 TTLs short.

## Choosing an engine (as of 2026-09)

| Option | Pick when | Watch out |
|---|---|---|
| **Valkey** — default distributed cache | You want Redis data structures (hashes, sorted sets, streams, pub/sub, Lua) under a BSD license with Linux Foundation governance; any Redis client works over the same protocol | "Drop-in" holds for the Redis 7.2 feature set; features added in Redis 7.4/8 may be missing |
| **Redis 8 / Redis Cloud** | You want Redis Ltd.'s integrated JSON, search, time-series, probabilistic, and vector-set features, or its enterprise active-active replication | Self-hosting under AGPLv3, RSALv2, or SSPLv1; some corporate policies reject AGPL |
| **Memcached** | Pure GET/SET of blobs, multi-threaded, simplest semantics, very large fleets | No persistence, no replication, no rich types |
| **Dragonfly** | Single-node vertical scale with a Redis/Memcached-compatible API | BSL 1.1: free to self-host, not to offer as a managed service |
| **Serverless managed** (Upstash, Momento, ElastiCache Serverless) | Serverless/edge functions with low or spiky traffic; zero cache operations | Per-request pricing at high QPS; latency from distant regions; proprietary APIs (Momento) |
| **Solid Cache / DB-backed** | Rails apps; large caches where disk beats RAM. 37signals reported 10 TB with 60-day retention at Basecamp, with P95 render times roughly halved | Slower per hit than RAM; fine for fragment caching |
| **In-process only** | One or few instances, small hot data | Memory per instance; divergence across instances |

Managed Valkey (as of 2026-09): AWS offers ElastiCache for Valkey and states it is priced about 20% lower (node-based) and 33% lower (serverless) than its other ElastiCache engines, with a 100 MB serverless minimum. Google Cloud offers Memorystore for Valkey. Valkey 8 and 9 performance numbers (for example, "1M+ requests/s on one node") are the project's own claims; measure on your instance type and workload.

## Configuration defaults

**Eviction policy**
- Pure cache: `allkeys-lru`, or `allkeys-lfu` when popularity is skewed.
- Anything you cannot lose (job queues, locks, sessions without fallback): `noeviction` plus persistence. Sidekiq and BullMQ require `noeviction`; under an LRU policy eviction silently deletes jobs.
- **Separate instances by purpose**: cache (evictable, persistence optional), queue/locks (`noeviction`, AOF), sessions (by durability need). They have different failure and tuning profiles, and a full cache must never evict a job.

**TTL**
- Every key gets a TTL — the safety net for missed invalidations.
- Add ±10–20% jitter so keys written together do not expire together.
- Short TTL + serve-stale-while-refreshing for hot keys; version keys on schema change (`user:v3:{id}`); negative-cache "not found" briefly.

**Sizing and monitoring**
- Working set ≈ hot keys × average value size × per-key overhead; measure the real footprint with production-like data rather than trusting arithmetic.
- Keep memory headroom for fork-based persistence (RDB snapshot / AOF rewrite copy-on-write) and replication buffers.
- Monitor hit ratio, evictions, memory fragmentation, latency, connected clients.
- Avoid multi-megabyte values and unbounded collections; for hot keys use in-process L1 or request coalescing (Discord put a coalescing service in front of its database for exactly this).

## When not to use Redis/Valkey

- **As a durable job queue** without `noeviction`, persistence, and reliable-fetch semantics (see `queues-and-streams.md`).
- **As the primary database** for data you cannot reconstruct: the default AOF `everysec` policy can lose about a second of writes on crash, and asynchronous replication can lose acknowledged writes on failover.
- **In front of a database that is already fast enough**: you add a network hop and invalidation bugs for nothing.
- **As a pub/sub bus for durable events**: Redis Pub/Sub is fire-and-forget; offline subscribers miss messages. Use Streams, a broker, or a Postgres outbox + queue.
- **As a lock for correctness-critical mutual exclusion** without fencing tokens (Martin Kleppmann's critique of Redlock). Use database row or advisory locks, or a consensus system; Redis locks are fine for efficiency (avoiding duplicate work), not for safety.

## Sources

- Rails 8 / Solid Cache figures — https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required
- Valkey — https://github.com/valkey-io/valkey ; Valkey 8 performance (project claim) — https://valkey.io/blog/unlock-one-million-rps/ ; Valkey 8.0 announcement — https://www.linuxfoundation.org/press/valkey-8-0
- Redis 8 AGPL — https://lwn.net/Articles/1019686/
- ElastiCache features and Valkey pricing — https://aws.amazon.com/elasticache/features/ , https://www.amazonaws.cn/en/new/2024/announcing-amazon-elasticache-for-valkey/
- Memorystore for Valkey — https://cloud.google.com/blog/products/databases/memorystore-for-valkey-9-0-is-now-ga
- Redis vs Memcached — https://redis.io/compare/memcached/
- Dragonfly license — https://www.dragonflydb.io/docs/about/license
- Redis persistence — https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
- Sidekiq and eviction — https://github.com/sidekiq/sidekiq/issues/5712
- Kleppmann on distributed locking — https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html
- Discord (coalescing layer) — https://discord.com/blog/how-discord-stores-trillions-of-messages
