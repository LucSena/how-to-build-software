# Modeling Beyond One Relational Database

How to model data in key-value, wide-column, and document stores; how to store event-sourced data; how to shape analytics data downstream of OLTP; and how to configure SQLite schemas for production. **Which** product to choose (Postgres vs DynamoDB vs Cassandra vs a warehouse) is decided in `data-infrastructure`; this file assumes the choice is made and covers the schema.

## Contents
1. Decision rule
2. DynamoDB single-table design
3. When not to use single-table design
4. Cassandra / ScyllaDB modeling
5. Document stores
6. Event sourcing storage
7. OLTP vs OLAP: analytics downstream via CDC
8. Analytics modeling: star schemas and history
9. SQLite in production: schema and settings
10. Rules catalog

## 1. Decision rule

Default to a relational model. Model for a key-value or wide-column store only when the access patterns are **few, known, and stable**, and at a scale or latency profile where a relational database has been shown to struggle — and plan from day one how analytics and ad-hoc questions will be answered (usually CDC into a warehouse), because the store itself will not answer them.

## 2. DynamoDB single-table design

Method (Rick Houlihan's re:Invent talks; Alex DeBrie, *The DynamoDB Book* and his single-table guide):

1. Write the complete list of access patterns first — entity, filter, sort, frequency.
2. Design the partition key (PK) and sort key (SK) so each pattern is one `GetItem` or `Query`. Put items that are read together under the same PK (an **item collection**): a "pre-joined" parent with its children.
3. Use generic key names with typed prefixes so many entity types share one table.
4. Add global secondary indexes (GSIs) for inverse relationships and alternate lookups; overload them (`GSI1PK`, `GSI1SK`) across entity types.
5. Keep items small; large blobs go to object storage with a pointer.

```
PK                SK                          Attributes
CUSTOMER#123      PROFILE                     name, email
CUSTOMER#123      ORDER#2026-09-30#8421       status, total_minor, currency
ORDER#8421        LINE#001                    sku, quantity, unit_price_minor
ORDER#8421        LINE#002                    …
GSI1: GSI1PK = ORDER#8421, GSI1SK = CUSTOMER#123   → "who placed order 8421"
```

- Query "customer 123's orders in September": `PK = CUSTOMER#123 AND begins_with(SK, 'ORDER#2026-09')`.
- Time-sortable IDs or ISO dates in sort keys give chronological ranges for free.
- Uniqueness across attributes (e.g., unique email) needs a separate marker item written in the same transaction (`PK = EMAIL#a@b.com`).
- Hot partitions: spread high-write keys (e.g., add a shard suffix) and avoid one partition key for all writes of a busy entity.

## 3. When not to use single-table design

DeBrie's own list of downsides: a steep learning curve, **inflexibility when new access patterns appear** (often requiring a backfill over the whole table), and difficulty exporting for analytics. He advises it is often not worth it when developer flexibility matters more than per-request efficiency (for example, GraphQL-driven apps). AWS publishes guidance on single-table vs multi-table design as well.

Use multi-table (or a relational database) when access patterns still change weekly, when many teams query the same data differently, or when the product depends on ad-hoc filtering and reporting.

## 4. Cassandra / ScyllaDB modeling

- **One table per query.** Denormalize by duplicating data into each query's table; there are no joins.
- **Partition key** decides placement and must bound partition size: Discord's messages table uses `(channel_id, bucket)` where the bucket is a fixed time window, so a busy channel does not grow one partition forever.
- **Clustering key** gives the sort order within a partition (Discord: time-sortable message ID).
- Hot partitions come from many readers or writers on one key (a huge channel); mitigate with bucketing and request coalescing in a data-access layer.
- Deletes create tombstones that slow reads until compaction; model TTLs and deletion patterns deliberately.

## 5. Document stores

Documents fit when the aggregate is read and written as a unit, the shape varies per record, and relationships are mostly containment (an order with embedded lines). They fit poorly for many-to-many relationships and invariants that span documents.

- Embed data that is always read with the parent and bounded in size; reference data that is shared, large, or unbounded (comments on a popular post).
- Validate documents with the store's schema validation or at the application boundary; store a schema version field.
- Plan indexes from access patterns exactly as in relational design.
- Discord's early MongoDB problem was the working set outgrowing RAM around 100M messages — a capacity issue, not a document-model issue; estimate working set whatever the store.

## 6. Event sourcing storage

```sql
CREATE TABLE events (
  stream_id   uuid        NOT NULL,
  version     integer     NOT NULL CHECK (version > 0),
  type        text        NOT NULL,              -- 'InvoiceIssued'
  data        jsonb       NOT NULL,              -- includes schema version
  metadata    jsonb       NOT NULL DEFAULT '{}', -- actor, causation/correlation IDs
  occurred_at timestamptz NOT NULL DEFAULT now(),
  global_seq  bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  PRIMARY KEY (stream_id, version)               -- append with expected version; unique violation = conflict
);
```

- **Optimistic concurrency** comes from the primary key: append `version = expected + 1`; a unique violation means another writer won.
- **Projections** (read models) are derived and rebuildable from events; version them and support full replay.
- **Event evolution**: events are immutable; handle old shapes by upcasting on read or by versioned event types.
- **Snapshots** for long streams, stored separately and treated as a cache.
- **Global ordering subtlety**: identity values can commit out of order across concurrent transactions, so subscribers reading "all events after `global_seq` N" must tolerate gaps and late arrivals (e.g., re-read a short window).
- **PII vs immutability**: keep personal data out of events (reference by ID) or encrypt it per subject and delete the key to erase (crypto-shredding). Erasure obligations need counsel; not legal advice.
- Use event sourcing only where history *is* the requirement (ledgers, audit-heavy workflows); otherwise state tables + an outbox give events without the cost (see `software-architecture`).

## 7. OLTP vs OLAP: analytics downstream via CDC

- The OLTP schema stays normalized and constraint-heavy; analytics shapes are built downstream.
- Progression: read replica for light reporting → change data capture (CDC) or batch ELT into a columnar warehouse or lakehouse when queries scan millions of rows.
- Notion's documented pipeline: Postgres → Debezium CDC → Kafka → Apache Hudi on S3, processed with Spark; blocks had grown to 200B+ rows, and Notion reported over $1M in net savings in 2022 and freshness improving from days to minutes or hours.
- **CDC risk**: a stalled logical replication slot makes the primary retain WAL until its disk fills; cap retained WAL (Postgres 13+ `max_slot_wal_keep_size`), alert on slot lag, and remove abandoned slots.
- **Data contracts**: CDC topics and warehouse tables are a public interface. Schema changes in OLTP (renames, type changes, drops) must consider downstream consumers — use the same expand/contract discipline, and announce breaking changes.
- **PII downstream**: pseudonymize user IDs and drop unneeded personal columns in the pipeline so the warehouse needs less erasure work.

## 8. Analytics modeling: star schemas and history

- **Fact tables** hold events or measurements at a declared grain ("one row per order line"), with foreign keys to dimensions and numeric measures.
- **Dimension tables** hold descriptive attributes (customer, product, date) and are denormalized for easy filtering.
- **Slowly changing dimensions**: type 1 overwrites (no history); type 2 adds a new row per change with `valid_from`/`valid_to`/`is_current` so facts join to the attribute values true at the time.
- Declare the grain before adding columns; mixed grains double-count.
- Keep money in minor units + currency in facts; convert currencies with a dated FX-rate dimension, not at load time with today's rate.

## 9. SQLite in production: schema and settings

Whether SQLite is the right store is a `data-infrastructure` decision (single node, per-tenant files, edge, embedded). If it is:

```sql
PRAGMA journal_mode = WAL;        -- readers do not block the writer
PRAGMA busy_timeout = 5000;       -- wait for the write lock instead of failing immediately
PRAGMA synchronous = NORMAL;      -- common pairing with WAL
PRAGMA foreign_keys = ON;         -- OFF by default, per connection

CREATE TABLE notes (
  id         INTEGER PRIMARY KEY,           -- rowid alias
  public_id  BLOB NOT NULL UNIQUE,          -- 16-byte UUIDv7 generated in the app
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL                  -- ISO 8601 UTC; or INTEGER Unix ms
) STRICT;                                   -- enforce declared types (SQLite 3.37+)
```

- Without `STRICT`, SQLite accepts any value type in any column; use `STRICT` tables plus CHECK constraints.
- SQLite has no native timestamp or decimal types: store instants as ISO 8601 UTC text or integer milliseconds consistently, money as integer minor units.
- One writer at a time: keep write transactions short; `BEGIN IMMEDIATE` for read-then-write transactions avoids upgrade deadlocks.
- Continuous off-host backup (for example Litestream streaming the WAL to object storage) is mandatory; test restores.
- Per-tenant or per-entity SQLite files (one database per tenant, or per object as in Cloudflare Durable Objects) turn "hot row" and "noisy neighbor" problems into many small single-writer databases — but migrations must run across every file.

## 10. Rules catalog

### Enumerate access patterns before designing keys
**Rule.** For key-value and wide-column stores, write every access pattern first and design PK/SK/GSIs so each is a single query.
**Apply when.** Modeling for DynamoDB, Cassandra, ScyllaDB, or similar.
**Do / Avoid.** Do: a table of patterns → key conditions. Avoid: porting relational tables one-to-one and scanning.
**Why.** These stores serve only the queries their keys were designed for; scans and client-side joins do not scale.

### Bound every partition
**Rule.** Partition keys include a bucket (time window, shard suffix) when an entity can grow without limit.
**Apply when.** Chat messages, events, logs, feeds, IoT readings.
**Do / Avoid.** Do: `(channel_id, bucket)`. Avoid: `channel_id` alone for a channel that may receive millions of messages.
**Why.** Unbounded partitions become hot and oversized, and cannot be split by the database (Discord).

### Build analytics from a change stream
**Rule.** Feed warehouses from CDC or ELT, not from queries against the primary, and treat the stream as a contract.
**Apply when.** Reports scan large ranges, or several teams need the data.
**Do / Avoid.** Do: Postgres → CDC → warehouse with pseudonymized IDs. Avoid: nightly `SELECT *` exports from the primary.
**Why.** Analytic scans compete with transactional traffic; a change stream decouples them (Notion).

## Sources

- Alex DeBrie, "The What, Why, and When of Single-Table Design with DynamoDB": https://www.alexdebrie.com/posts/dynamodb-single-table/
- AWS Database Blog, single-table vs multi-table design in DynamoDB: https://aws.amazon.com/blogs/database/single-table-vs-multi-table-design-in-amazon-dynamodb/
- Discord, "How Discord Stores Trillions of Messages": https://discord.com/blog/how-discord-stores-trillions-of-messages
- Notion, "Building and scaling Notion's data lake": https://www.notion.com/blog/building-and-scaling-notions-data-lake
- Debezium replication slot issues: https://streamkap.com/resources-and-guides/debezium-replication-slot-issues
- Cloudflare, "Zero-latency SQLite storage in every Durable Object": https://blog.cloudflare.com/sqlite-in-durable-objects/
- SQLite, STRICT tables: https://www.sqlite.org/stricttables.html
- SQLite, write-ahead logging: https://www.sqlite.org/wal.html
- Litestream: https://github.com/benbjohnson/litestream
- Simon Willison on Litestream v0.5 (Oct 2025): https://simonwillison.net/2025/Oct/3/litestream/
