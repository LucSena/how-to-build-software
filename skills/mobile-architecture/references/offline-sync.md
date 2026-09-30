# Offline-First Data and Sync

How to make a mobile app usable without a reliable network: local source of truth, write strategies, sync, conflicts, and the UX that makes it legible. Terminology follows Android's offline-first guide; the patterns apply to every stack.

## Contents
- Principles
- Read path
- Write strategies
- Synchronization
- Conflict resolution
- Schema and bookkeeping
- Background execution per platform
- Offline UX contract
- Libraries and services (as of 2026-09)
- Testing sync
- Sources

## Principles

1. The **local data source is canonical**: it is the only thing higher layers read.
2. The **network data source is the actual state**; local is a replica that may lag or lead.
3. **Repositories own reconciliation**; UI and domain never call the network directly.
4. Minimum bar for "offline-first": **reads work offline**. Offline writes are a product decision.
5. Fetch conscious of battery and data: constraints (unmetered, charging) for heavy sync; respect Low Data Mode / metered networks.

## Read path

- UI observes a stream from the DB (`Flow`, `AsyncSequence`, SwiftData `@Query`, live queries in RN/Flutter); network results are written into the DB, which re-emits.
- Local read errors should be near-impossible; catch and map them to an error state rather than crashing.
- Network read failures don't surface as screen errors when cached data exists — they become sync status ("Couldn't refresh · showing data from 10:42").
- Paged remote lists: page through the network into the DB and render from the DB (Android Paging `RemoteMediator` is this pattern).
- Separate models per source: network DTO → local entity → domain/UI model, converted inside the data layer.

## Write strategies

| Strategy | Behavior | Use for | UX |
|---|---|---|---|
| **Online-only** | Send to network; update local on success; fail otherwise | Payments, transfers, bookings, anything that must be confirmed in real time | Disable or clearly mark the action when offline; show the failure |
| **Queued** | Put the write in a durable queue; drain with exponential backoff when online | Analytics, logs, non-essential telemetry | Invisible to the user |
| **Lazy (write-local-then-sync)** | Write to the DB immediately (pending), queue the network write, reconcile later | User-created content: notes, tasks, drafts, likes, settings | Instant UI; pending indicator; conflict handling |

Lazy-write mechanics:
- Each pending mutation has a client-generated ID (UUID/ULID) and an **idempotency key** so retries never duplicate server effects.
- Store mutations in an outbox table (operation, entity ID, payload, attempt count, last error, created_at); process in order per entity.
- Classify failures: transient (network, 5xx, 429) → retry with backoff and jitter; permanent (400/403/409 validation) → stop, mark the item failed, surface a fix-it UI, and roll back optimistic state if needed.
- Temporary client IDs must map to server IDs after sync (keep both or use client-generated IDs the server accepts).

## Synchronization

| Approach | How | Pros | Cons | Default for |
|---|---|---|---|---|
| **Pull-based** | Fetch when a screen needs data (navigation-driven) | Simple; fetch only what's viewed | Stale/empty caches after long offline periods; refetches unchanged data | Feeds, search, rarely-revisited content |
| **Push-based** | Baseline sync at start; the server signals staleness (e.g. FCM/APNs data push); the app fetches changed data | Works offline indefinitely; minimal data | Needs server change tracking and versioning; write concerns during sync | User-owned data (profile, library, tasks) |
| **Hybrid** | Pull for high-churn data, push for user data | Balanced | Two mechanisms | Most real apps |

Incremental sync: request changes since a server-issued **change token / cursor** (preferred) or `updated_since` timestamp from the server clock (never the device clock); include tombstones for deletions; paginate large deltas.

Sync triggers: app start and foreground (debounced), after local writes, on push "tickle", periodic background work (platform-scheduled), connectivity regained. Never a tight polling loop.

## Conflict resolution

| Policy | How | Use when |
|---|---|---|
| **Last write wins (LWW)** | Writes carry timestamps (or versions); the server keeps the newest | Single-user data edited on few devices; low stakes — the common mobile default |
| **Server-authoritative + reject** | Client sends expected version; server returns 409 on mismatch; client refetches and asks the user or retries | Money, inventory, booking slots, anything with invariants |
| **Field-level merge** | Merge non-overlapping field changes; LWW or ask per conflicting field | Forms and profiles edited on multiple devices |
| **Operational transform / CRDT** | Merge concurrent edits automatically | True multi-user real-time collaboration (docs, whiteboards); adopt a proven library/service, don't hand-roll |

Always decide explicitly and document it; "whatever the last HTTP call did" is a policy too, just an accidental one. Surface unresolvable conflicts to the user with both versions when data matters.

## Schema and bookkeeping

- Per entity: `id`, `server_version` or `updated_at` (server), `sync_state` (synced / pending / failed), `deleted` flag for tombstones until confirmed.
- Outbox table for pending mutations (see above); sync metadata table for cursors per collection.
- Migrations: versioned, tested on real old databases; never drop user data on schema change; keep old app versions' data readable after upgrade.
- Encrypt sensitive local data at rest where required (platform file protection on iOS; encrypted storage on Android for secrets; full-DB encryption only when the threat model needs it).
- Logout: wipe user data, cancel sync work, clear outbox (or warn about unsynced changes first).

## Background execution per platform

| Platform | Mechanism | Notes |
|---|---|---|
| Android | **WorkManager** (unique periodic + one-time work, network constraint, exponential backoff) | Survives process death and reboot; expedited work only for short user-visible tasks; foreground service (declared type) for long user-visible transfers |
| iOS | `BGAppRefreshTask` (short refresh), `BGProcessingTask` (longer, often charging/idle), `BGContinuedProcessingTask` (iOS 26+, continue a user-started task with system progress UI), background `URLSession` for uploads/downloads | System decides timing; budget is small and unpredictable; silent pushes are throttled |
| React Native / Expo | `expo-background-task` / native modules delegating to the above | Keep JS work short; heavy sync in native where possible |
| Flutter | `workmanager` plugin / platform channels | Same OS limits apply |
| KMP | Shared sync logic in `commonMain`; platform schedulers call it | One implementation, two schedulers |

Design for **eventual** sync: never promise exact timing; sync on foreground as the reliable path.

## Offline UX contract

- Launch shows cached content immediately; skeletons only when the cache is empty.
- A non-blocking offline banner or status line; no modal "No internet" dialogs.
- Pending items show a pending badge; failed items show an actionable error ("Couldn't sync · Retry / Edit").
- "Last updated" timestamps on data that goes stale (prices, balances, schedules).
- Actions that require the network (online-only writes) are disabled with an explanation, or allowed and queued with clear state — never silently dropped.
- Pull-to-refresh triggers a sync and reports the result without clearing the screen.

## Libraries and services (as of 2026-09)

| Stack | Local store | Sync helpers |
|---|---|---|
| Android | Room, DataStore | WorkManager, Paging `RemoteMediator` |
| iOS | SwiftData, Core Data (+ CloudKit mirroring for iCloud-only apps), GRDB | BackgroundTasks, background `URLSession` |
| KMP | SQLDelight, Room (KMP) | Ktor + shared sync engine |
| React Native | expo-sqlite, WatermelonDB | TanStack Query persistence for server-state caching; commercial sync engines exist (evaluate lock-in) |
| Flutter | drift, sqflite | workmanager plugin |

Sync-engine services (Postgres-to-SQLite replication, CRDT backends) can remove a lot of custom code; evaluate them on conflict semantics, auth/row-level rules, offline duration, pricing, and exit path.

## Testing sync

- Unit-test the repository with fake local and remote sources and a controllable clock: offline read, write while offline, reconnect, retry with backoff, permanent failure, conflict (409), duplicate delivery (idempotency).
- Property-style tests for merge functions (commutative/idempotent where claimed).
- Integration tests against a real local DB (in-memory Room/SQLite).
- Manual: airplane mode mid-write, kill the app with pending writes, two devices editing the same record, very long offline period, slow 3G profile.

## Sources

- Android — Build an offline-first app: https://developer.android.com/topic/architecture/data-layer/offline-first
- Android — WorkManager: https://developer.android.com/develop/background-work/background-tasks/persistent
- Now in Android sync implementation (`SyncWorker`, `Synchronizer`): https://github.com/android/nowinandroid
- Apple — BackgroundTasks (`BGTaskScheduler`, `BGContinuedProcessingTask`): https://developer.apple.com/documentation/backgroundtasks
- Apple — Downloading files in the background (`URLSession` background configuration): https://developer.apple.com/documentation/foundation/downloading-files-in-the-background
- Expo BackgroundTask: https://docs.expo.dev/versions/latest/sdk/background-task/
