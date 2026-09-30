# Performance and Data Review Checklist

Review for the problems that are cheap to prevent in a diff and expensive to find in production. Flag with evidence: "Observed: query inside loop at `orders.ts:88`" beats "might be slow". For capacity planning and caching architecture, use `scalability`; for timeouts, retries, and rollout safety, use `reliability`.

## Contents
1. Queries and data access
2. Migrations
3. Outbound calls and background work
4. Memory and algorithmic cost
5. Caching
6. Frontend and mobile
7. How to confirm a suspicion

## 1. Queries and data access

- [ ] **No N+1** [Major]: no DB or HTTP call inside a loop over a collection (including `.map(async …)` and lazy ORM relations accessed in templates/serializers). Fix: eager load (`include`, `joinedload`/`selectinload`, `select_related`/`prefetch_related`), batch by IDs (`WHERE id = ANY($1)`), or a DataLoader for GraphQL.
- [ ] **Bounded** [Major]: every list query has `LIMIT`; API list endpoints paginate with a default (commonly 20–50) and an enforced maximum; exports stream or run as background jobs.
- [ ] **Cursor over offset** for large or live-updating lists [Minor→Major]: `OFFSET` cost grows with depth and skips/duplicates rows when data changes.
- [ ] **Indexes for new access patterns** [Major]: columns in new `WHERE`, `JOIN`, and `ORDER BY` clauses are indexed; foreign-key columns indexed (Postgres does not index them automatically); composite index order = equality columns first, then range/sort columns.
- [ ] **Select only what's needed** on wide tables in hot paths [Minor].
- [ ] **Short transactions, no network calls inside them** [Major]: no HTTP, email, or LLM calls while holding a DB transaction or row lock.
- [ ] **Lost updates** [Major]: read-modify-write of counters/balances uses atomic updates (`SET x = x - $1 WHERE x >= $1`), row locks, or optimistic versioning.
- [ ] **Invariants in the database** [Major]: uniqueness and relationships enforced with constraints, not only application checks (which race).
- [ ] **Replica reads** [Major]: no read-then-write decisions against a lagging read replica; read-your-writes handled.
- [ ] **Connection handling** [Major]: pooled clients created once (not per request/handler invocation); connections released in `finally`; statement timeouts set.

## 2. Migrations

- [ ] **Safe on the real table size** [Blocker on large tables]: no long exclusive locks — add columns as nullable or with non-volatile defaults, create indexes concurrently where the database supports it, set a lock timeout.
- [ ] **Expand → migrate → contract** [Major]: new code works with old and new schema during deploy; destructive changes (drop/rename) happen in a later release.
- [ ] **Backfills batched** [Major]: in chunks (thousands of rows) with pauses, not one giant `UPDATE`.
- [ ] **Reversible or with a documented rollback** [Minor→Major].

## 3. Outbound calls and background work

- [ ] **Timeouts on every network call** [Major]: HTTP clients, database drivers, SDKs, LLM calls. Many defaults are infinite (Node `fetch`, Python `requests`).
- [ ] **Independent calls in parallel** [Minor]: `Promise.all` / `asyncio.gather` / task groups instead of sequential awaits — with a concurrency limit for large fan-outs.
- [ ] **Retries** [Major]: only transient errors, only idempotent operations (or with idempotency keys), capped exponential backoff with jitter, at one layer only.
- [ ] **Slow work off the request path** [Major]: emails, webhooks, image processing, exports, and long LLM tasks go to a queue/background job; the request returns promptly with a status.
- [ ] **Clients reused** [Minor]: HTTP clients with keep-alive created once, not per request.

## 4. Memory and algorithmic cost

- [ ] **No accidental quadratic work** [Major on large inputs]: nested loops over the same collection, `array.includes`/`find` inside a loop (use a `Set`/`Map`), repeated string concatenation in loops in languages where it copies.
- [ ] **Bounded growth** [Major]: caches have size limits and eviction; in-memory queues/buffers are bounded; listeners and subscriptions are removed.
- [ ] **Streaming for large data** [Major]: files, exports, and uploads processed as streams rather than read fully into memory.
- [ ] **Hot paths measured** [Minor]: performance-motivated complexity comes with a benchmark or profile; conversely, "clean" abstractions in a measured hot loop are justified.

## 5. Caching

- [ ] **Justified** [Minor]: caching added for a measured cost; it introduces staleness — the PR states the acceptable staleness.
- [ ] **Keys include every input that changes the value** [Blocker if it leaks data]: tenant, user/permissions, locale, feature variant. Never cache per-user data under a shared key.
- [ ] **Invalidation defined** [Major]: TTL plus invalidation on write (after commit), or versioned keys.
- [ ] **Stampede protection** for hot keys [Minor→Major]: TTL jitter, request coalescing.

## 6. Frontend and mobile

- [ ] **Data fetching** [Major]: no fetch waterfalls (parallelize, fetch on the server where applicable); no fetching in effects without cancellation; server data cached by a data library.
- [ ] **Large lists virtualized** [Minor→Major] (hundreds+ rows).
- [ ] **Bundle impact** [Minor→Major]: new dependencies checked for size; heavy, rarely used code split and lazy-loaded; no whole-library imports for one function.
- [ ] **Images** [Minor]: sized, compressed, modern formats, lazy-loaded below the fold, explicit dimensions to prevent layout shift.
- [ ] **Re-render hot spots** [Minor]: context values changing on every render, large components re-rendering on keystrokes; memoize after profiling (see `design-patterns` frontend reference).
- [ ] **Mobile** [Minor→Major]: work off the main thread; paging for lists; no polling where push or background refresh fits; network calls batched for battery.
- [ ] Core Web Vitals targets (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75) — see `web-platform` for measurement.

## 7. How to confirm a suspicion

| Suspicion | Confirm with |
|---|---|
| N+1 | Enable ORM/SQL query logging in a test and count queries; add a query-count assertion (e.g., Django `assertNumQueries`) |
| Missing index / slow query | `EXPLAIN (ANALYZE, BUFFERS)` on realistic data; look for sequential scans on large tables and row-estimate mismatches |
| Migration lock risk | Check table size and the lock taken by the DDL in the database docs; test on a production-sized copy |
| Memory growth | Heap snapshot or memory profiler across repeated operations |
| Slow endpoint | Trace spans or a profile; p95/p99 latency, not averages |
| Bundle growth | Bundle analyzer output before/after |

If you can't run any of these, mark the finding **Inferred** and state which check would confirm it.

## Sources

- PostgreSQL docs, indexes and `EXPLAIN`: https://www.postgresql.org/docs/current/indexes.html ; https://www.postgresql.org/docs/current/using-explain.html
- Use The Index, Luke (SQL indexing and pagination): https://use-the-index-luke.com/
- AWS Architecture Blog, "Exponential Backoff and Jitter": https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
- ByteByteGo system-design-101 (caching pitfalls, pagination): https://github.com/ByteByteGoHq/system-design-101
- donnemartin/system-design-primer: https://github.com/donnemartin/system-design-primer
- web.dev Core Web Vitals: https://web.dev/articles/vitals
- react.dev, "You Might Not Need an Effect": https://react.dev/learn/you-might-not-need-an-effect
