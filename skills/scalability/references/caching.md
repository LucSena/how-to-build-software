# Caching — Patterns, Invalidation, Failure Modes

A cache trades consistency for latency and load. Add one only for measured hot reads that tolerate a stated staleness, and design its invalidation and failure behavior before its hit path.

## Contents
1. Where to cache (layers)
2. Write/read patterns
3. Keys
4. Invalidation
5. Failure modes and protection
6. HTTP and CDN rules
7. Operating a cache
8. Rules catalog

## 1. Where to cache (layers)

Closest to the user first, because each earlier layer removes all later work:

1. **Browser** — `Cache-Control`, `ETag`/`If-None-Match`.
2. **CDN / edge** — static assets, public pages, cacheable API GETs.
3. **Reverse proxy** — shared responses near the app.
4. **In-process** — small LRU per instance for immutable or very hot reference data (feature config, currency tables). Not shared: instances disagree until TTL.
5. **Distributed cache** (Redis, Valkey, Memcached) — shared across instances.
6. **Database** — buffer cache, materialized views, denormalized read tables.

## 2. Write/read patterns

| Pattern | How | Use when | Pitfall |
|---|---|---|---|
| **Cache-aside** (default) | App reads cache; on miss loads DB and sets with TTL | Read-heavy data | Stale data after writes; stampede on hot miss |
| Read-through | Cache library loads on miss | Same, centralized loader | Library coupling |
| Write-through | Write DB and cache synchronously | Read-after-write consistency matters | Write latency; caches data nobody reads |
| Write-behind | Write cache; flush to DB asynchronously | Counters, metrics, non-critical aggregates | Data loss on cache failure — never for money or orders |
| Write-around | Write DB only; cache fills on read | Write-once, read-rarely data | First reads miss |
| Refresh-ahead / stale-while-revalidate | Serve stale, refresh in background | Hot keys; HTTP responses | Staleness bound must be acceptable |

Cache-aside sketch:

```ts
async function getProduct(id: string): Promise<Product> {
  const key = `product:${id}:v1`;
  const hit = await cache.get(key);
  if (hit) return JSON.parse(hit);
  const product = await singleFlight(key, () => db.products.findById(id)); // coalesce concurrent misses
  await cache.set(key, JSON.stringify(product), { ttlSeconds: jitter(300, 0.15) });
  return product;
}
```

## 3. Keys

- Include **every input that changes the value**: entity ID, tenant, locale, currency, role or permission set, feature-flag variant, API version, schema version.
- **Never cache authorized or per-user data under a key that lacks the user or tenant.** One user's data served to another is a security incident.
- Namespace keys (`svc:entity:id:version`) so you can find and purge them; include a schema version so deploys that change the shape do not read old blobs.
- Keep keys bounded in number; caching unbounded query permutations (free-text search, arbitrary filters) mostly produces misses and evictions.

## 4. Invalidation

Default: **TTL + delete on write, after commit**.

- Delete (don't update) the key after the database transaction commits. Updating the cache from the writer races with concurrent writers.
- **The delete-after-commit race**: a reader misses, reads the old row, a writer commits and deletes, then the reader sets the old value. Mitigations, cheapest first: short TTL so staleness is bounded; versioned keys (bump `version` on write, key includes it); a delayed second delete a few hundred ms later; change-data-capture–driven invalidation from the database log.
- Group invalidation: tag keys (CDN surrogate keys, cache tags in frameworks) so one write can purge all dependent entries.
- If you cannot state the maximum staleness and who is affected, you are not ready to cache that data.

## 5. Failure modes and protection

| Failure | What happens | Protection |
|---|---|---|
| Mass expiry (thundering herd) | Many keys set together expire together; DB spikes | TTL jitter ±10–20% |
| Hot-key expiry (cache breakdown) | One popular key expires; thousands of concurrent misses hit DB | Single-flight/request coalescing or a short lock; early probabilistic refresh; no-expiry + background refresh for the hottest keys |
| Cache penetration | Requests for keys that do not exist always miss | Cache negative results briefly; Bloom filter for large keyspaces; validate IDs first |
| Cache down | Every request goes to DB at once | Concurrency limit or circuit breaker on the DB fallback; serve degraded response; replicated cache |
| Cold start after deploy/flush | Empty cache under full load | Warm critical keys; roll out gradually |
| Memory pressure | Evictions of useful keys; latency | Memory limit + eviction policy (`allkeys-lru` or `allkeys-lfu` for pure caches); smaller values; compress |

## 6. HTTP and CDN rules

- Static assets with content-hashed filenames: `Cache-Control: public, max-age=31536000, immutable`.
- HTML and API responses: short TTL or `s-maxage` for the CDN plus `stale-while-revalidate`; `no-store` for personalized or sensitive responses.
- Set `Vary` correctly (`Accept-Encoding`, `Accept-Language` if localized); avoid `Vary: Cookie`, which fragments the cache.
- Use `ETag` + `If-None-Match` → `304 Not Modified` for conditional GETs.
- Purge by surrogate key/tag on content change instead of waiting for TTL.
- Keep DB-bound logic near the database; the edge is for cacheable or stateless work (redirects, auth-token checks, A/B bucketing).

## 7. Operating a cache

- Metrics: hit ratio (question any cache under ~80%), latency, evictions, memory, connection count, key count.
- Alerts: hit ratio drop, eviction spike, latency spike, cache unavailable.
- Security: authentication enabled, not exposed publicly, TLS in transit when crossing networks; never store secrets unencrypted.
- Treat the cache as disposable: the system must be correct (if slower) with an empty cache.

## 8. Rules catalog

### Fix the query before caching it
**Rule.** Cache only after the underlying query is indexed and bounded.
**Apply when.** An endpoint is slow and someone proposes caching.
**Do / Avoid.** Do: add the missing `(tenant_id, created_at)` index, then consider caching. Avoid: wrapping a 2-second seq scan in Redis.
**Why.** Misses, cold starts, and invalidations still hit the slow path; the cache hides the problem until it hurts most.

### Delete after commit, never before
**Rule.** Invalidate cache entries after the database transaction commits, with a TTL as the safety net.
**Apply when.** Any write to cached data.
**Do / Avoid.** Do: `await tx.commit(); await cache.del(key)`. Avoid: `cache.del(key); await tx.commit()`.
**Why.** Deleting before commit lets a concurrent reader re-cache the old value, which then lives until TTL.

### Coalesce misses on hot keys
**Rule.** Allow only one loader per key at a time; others wait for its result.
**Apply when.** A key is read by many concurrent requests.
**Do / Avoid.** Do: single-flight or a short `SET NX` lock with a fallback to stale. Avoid: 5,000 identical DB queries when the homepage key expires.
**Why.** Without coalescing, expiry turns cache load into database load instantly (thundering herd).

### Key by everything that changes the answer
**Rule.** Include tenant, user or role, locale, and version in the cache key for any non-public data.
**Apply when.** Caching anything personalized or permissioned.
**Do / Avoid.** Do: `dash:{tenantId}:{role}:{locale}:v3`. Avoid: `dashboard:summary`.
**Why.** A shared key for authorized data leaks one user's data to another.

## Sources

- ByteByteGo, system-design-101 (caching strategies, cache failure modes): https://github.com/ByteByteGoHq/system-design-101
- donnemartin/system-design-primer (cache patterns): https://github.com/donnemartin/system-design-primer
- RFC 9111 HTTP Caching: https://www.rfc-editor.org/rfc/rfc9111.html
- RFC 5861 stale-while-revalidate: https://www.rfc-editor.org/rfc/rfc5861.html
- Redis eviction policies: https://redis.io/docs/latest/develop/reference/eviction/
- Vattani et al., Optimal Probabilistic Cache Stampede Prevention (XFetch), VLDB 2015: https://www.vldb.org/pvldb/vol8/p886-vattani.pdf
