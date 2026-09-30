# Keys and Constraints

How to choose identifiers, how to encode invariants as database constraints, how to represent enumerations, and how to name things. PostgreSQL syntax; MySQL and SQLite notes where behavior differs.

## Contents
1. Primary key decision
2. UUIDv7 in practice
3. Exposing IDs
4. NOT NULL and three-valued logic
5. CHECK
6. UNIQUE (scoped, case-insensitive, partial, NULL handling)
7. Foreign keys and ON DELETE
8. Exclusion and temporal constraints
9. Deferrable constraints and cross-row invariants
10. Enums, lookup tables, and CHECK lists
11. Types to prefer and avoid
12. Naming conventions
13. Rules catalog

## 1. Primary key decision

| Question | If yes | If no |
|---|---|---|
| Must IDs be created outside the database (offline clients, multi-region writers, event-sourced aggregates, client-side optimistic creation)? | UUIDv7 as the PK | Continue |
| Will the ID appear in URLs, APIs, exports, or support tickets? | Add a UUIDv7 `public_id` (two-ID model) | `bigint` identity alone |
| Many independent writers need compact 64-bit sortable IDs at very high rates? | Snowflake-style IDs (plan worker-ID assignment) | Identity or UUIDv7 |
| Small, stable, standardized reference data (ISO 4217 currencies, ISO 3166 countries)? | Natural key (`code char(3)`) | Surrogate key |

Defaults and reasons:
- `bigint GENERATED ALWAYS AS IDENTITY`, not `serial` — the Postgres wiki "Don't Do This" page recommends identity columns; `ALWAYS` stops accidental manual IDs.
- 64-bit from day one. Widening an `int` key on a big table is a long rewrite across every referencing FK (GitHub, May 2021, hit the INT32 maximum on a foreign key and had hours of Actions/Pages outage).
- MySQL/InnoDB clusters rows by primary key, so random keys (UUIDv4) hurt inserts more there than in Postgres heap tables; use time-ordered IDs or auto-increment.
- Snowflake-style IDs in JSON: send as strings. JavaScript numbers lose integer precision above 2^53.

## 2. UUIDv7 in practice

- RFC 9562 (May 2024) replaced RFC 4122 and defines UUID versions 6, 7, and 8. UUIDv7 starts with a Unix-epoch millisecond timestamp, so values sort roughly by creation time and insert near the end of a B-tree.
- **PostgreSQL 18** (released September 2025) has a built-in `uuidv7()` and `uuid_extract_timestamp()` works for v7 (as of 2026-09). On older versions, generate in the application with a maintained library or use an extension.
- Store as the native `uuid` type (16 bytes), never as text (36+ bytes, slower comparisons). Same for ULIDs: convert to `uuid`/binary.
- The embedded timestamp reveals creation time to anyone who sees the ID. Acceptable for most public resources; not for identifiers where creation time is sensitive.
- Clock skew between generators makes ordering approximate across machines; never use ID order as proof of causal order across writers.

## 3. Exposing IDs

- Sequential IDs in URLs leak business volume (competitors estimate orders per day) and make enumeration trivial.
- Non-sequential IDs reduce that leak, but **authorization on every object access** is the security control (OWASP API1: Broken Object Level Authorization). An unguessable ID is not permission.
- Capability URLs (password reset, email verification, invites, share links) need long random secrets from a CSPRNG, stored hashed, with expiry — not UUIDv7, whose time prefix reduces the unguessable part.

## 4. NOT NULL and three-valued logic

- NOT NULL by default. Allow NULL only when "unknown" or "not applicable" is a real state, and document which.
- NULL breaks intuition: `x = NULL` is never true; `NOT IN (subquery)` returns zero rows if the subquery yields any NULL (use `NOT EXISTS`); `count(col)` skips NULLs; unique constraints treat NULLs as distinct by default.
- Prefer explicit states over NULL overloading: `cancelled_at timestamptz` NULL means "not cancelled" — fine; but a `discount_minor` that is NULL for "no discount" is better as `NOT NULL DEFAULT 0`.

## 5. CHECK

```sql
ALTER TABLE products
  ADD CONSTRAINT products_price_nonneg_chk CHECK (price_minor >= 0),
  ADD CONSTRAINT products_sku_format_chk   CHECK (sku ~ '^[A-Z0-9-]{3,32}$'),
  ADD CONSTRAINT products_name_len_chk     CHECK (length(name) BETWEEN 1 AND 200);

-- State-dependent columns
ALTER TABLE orders ADD CONSTRAINT orders_shipped_consistency_chk
  CHECK ((status = 'shipped') = (shipped_at IS NOT NULL));

-- Exactly one of several columns
ALTER TABLE payments ADD CONSTRAINT payments_one_method_chk
  CHECK (num_nonnulls(card_id, bank_account_id, wallet_id) = 1);
```

CHECK sees only the current row. Rules across rows or tables need a transaction, an exclusion constraint, or a trigger.

## 6. UNIQUE

```sql
-- Business key scoped to tenant, case-insensitive
CREATE UNIQUE INDEX users_tenant_email_uniq ON users (tenant_id, lower(email));

-- Only among live rows (soft delete)
CREATE UNIQUE INDEX projects_tenant_slug_live_uniq ON projects (tenant_id, slug) WHERE deleted_at IS NULL;

-- At most one active subscription per account
CREATE UNIQUE INDEX subscriptions_one_active_uniq ON subscriptions (account_id) WHERE status = 'active';

-- NULLs should collide (e.g., sibling names including the root level)
CREATE TABLE folders (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id bigint REFERENCES folders(id),
  name      text NOT NULL,
  UNIQUE NULLS NOT DISTINCT (parent_id, name)      -- PostgreSQL 15+
);
```

Handle the violation (SQLSTATE `23505`) as a domain error (409 Conflict), not a 500. `citext` (a Postgres extension) is an alternative to `lower()` indexes; either way, compare case-insensitively everywhere the value is looked up.

## 7. Foreign keys and ON DELETE

| Relationship | ON DELETE | Example |
|---|---|---|
| Independent entities | `RESTRICT` / `NO ACTION` (default) | `orders.customer_id` — do not delete customers with orders |
| Composition (child meaningless without parent) | `CASCADE` | `order_lines.order_id` |
| Optional link | `SET NULL` | `tasks.assignee_id` when a user leaves |

- Index every referencing column in Postgres; it is not automatic (MySQL/InnoDB creates one).
- Cascades on large trees can delete millions of rows in one transaction — prefer an explicit, batched deletion job for tenant or account deletion.
- Across services or databases there are no FKs; store the ID, and add a reconciliation check for orphans.
- SQLite: `PRAGMA foreign_keys = ON;` on every connection, or FKs are not enforced.

## 8. Exclusion and temporal constraints

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE room_bookings (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id bigint NOT NULL REFERENCES rooms(id),
  during  tstzrange NOT NULL CHECK (NOT isempty(during)),
  EXCLUDE USING gist (room_id WITH =, during WITH &&)
);
-- Price validity periods that must not overlap per product
CREATE TABLE prices (
  product_id  bigint NOT NULL REFERENCES products(id),
  valid       daterange NOT NULL,
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  EXCLUDE USING gist (product_id WITH =, valid WITH &&)
);
```

Use half-open ranges (`[start, end)`, the default for range constructors) so adjacent periods do not overlap. Recent Postgres releases are adding SQL-standard temporal keys (`WITHOUT OVERLAPS`); check your version's documentation before relying on them — `EXCLUDE` works on every supported version.

## 9. Deferrable constraints and cross-row invariants

- `DEFERRABLE INITIALLY DEFERRED` checks a constraint at commit instead of per statement — useful for swapping unique positions (`position` in an ordered list) or inserting mutually referencing rows.
- Cross-row sums (a transfer's legs sum to zero) are enforced in the posting function inside one transaction, optionally backed by a deferred constraint trigger, and always checked by a reconciliation job.
- Prefer conditional updates for counters with limits: `UPDATE stock SET qty = qty - 1 WHERE sku = $1 AND qty > 0` and check the affected-row count.

## 10. Enums, lookup tables, and CHECK lists

| Option | Add value | Remove/rename | Metadata | Recommended when |
|---|---|---|---|---|
| `text` + `CHECK (x IN (…))` | Replace the constraint (`NOT VALID` + `VALIDATE`) | Easy | No | Code-owned state machines |
| Postgres `ENUM` | `ALTER TYPE … ADD VALUE` (cheap) | No `DROP VALUE`; requires a type swap | No | Stable sets, storage matters |
| Lookup table + FK | `INSERT` | Soft-retire with `is_active` | Labels, ordering, i18n | Data-owned categories managed by admins or users |
| Integer codes, app-only | Code deploy | Dangerous reuse | No | Never |

Keep state transitions in code (or a transitions table), but keep the set of legal values in the database.

## 11. Types to prefer and avoid (Postgres)

| Prefer | Avoid | Why |
|---|---|---|
| `text` (+ CHECK length) | `varchar(n)` with arbitrary n, `char(n)` for variable data | Same storage; limits change; `char(n)` pads |
| `timestamptz` | `timestamp` for instants | Instants need a zone-independent value |
| `bigint` / `numeric` for money | `float`, `real`, `double precision`, `money` | Binary floats cannot represent 0.1; `money` depends on locale settings |
| `bigint GENERATED ALWAYS AS IDENTITY` | `serial` | Identity is the SQL-standard, permission-friendly form |
| `jsonb` | `json` (unless you need exact text preservation) | `jsonb` is indexable and faster to query |
| `uuid` | UUIDs as `text` | 16 bytes vs 36+, faster comparisons |

## 12. Naming conventions

| Item | Convention |
|---|---|
| Identifiers | `snake_case`, lowercase, unquoted (Postgres folds unquoted names to lowercase; quoted mixed case must be quoted forever) |
| Tables | Plural or singular — one choice per codebase, enforced |
| Primary key | `id`; public identifier `public_id` |
| Foreign key | `<referenced_singular>_id` (`customer_id`) |
| Instants / dates | `<verb>_at` (`created_at`, `paid_at`) / `<noun>_on` or `_date` |
| Booleans | `is_`/`has_` — but prefer a timestamp when "when" matters (`verified_at`) |
| Money / units | `<name>_minor` + `currency`; suffix units: `_ms`, `_bytes`, `_kg` |
| Constraints / indexes | `<table>_<columns>_<type>`: `_pkey`, `_fk`, `_uniq`, `_chk`, `_idx`, `_excl` |
| Avoid | Reserved words (`user`, `order`, `group`), abbreviations, type prefixes (`tbl_`, `str_`) |

Named constraints produce readable errors and migrations; auto-generated names differ between environments.

## 13. Rules catalog

### Let the constraint decide, then map the error
**Rule.** Enforce uniqueness and existence with constraints and translate violations into domain errors.
**Apply when.** Any "must be unique" or "must exist" rule.
**Do / Avoid.** Do: insert and catch `23505` → 409 "email already registered". Avoid: `SELECT` to check, then `INSERT`.
**Why.** Check-then-act races under concurrency (two requests both see "not found"); only the database sees every writer.

### Keep internal and public identifiers separate
**Rule.** Join on compact internal keys; expose non-sequential public IDs; authorize every access.
**Apply when.** Any table whose rows appear in URLs or APIs.
**Do / Avoid.** Do: `id bigint` + `public_id uuid DEFAULT uuidv7()`. Avoid: `/invoices/1042` with no ownership check.
**Why.** Sequential IDs leak volume and invite enumeration; BOLA is prevented by authorization, not obscurity.

### Choose ON DELETE per relationship
**Rule.** Default to RESTRICT; cascade only for composition; batch large deletions in jobs.
**Apply when.** Declaring any foreign key.
**Do / Avoid.** Do: `order_lines … ON DELETE CASCADE`, `orders.customer_id … RESTRICT`. Avoid: `CASCADE` on everything because the ORM generator did.
**Why.** A cascade from a top-level row can silently delete huge subtrees in one long transaction.

## Sources

- PostgreSQL wiki, "Don't Do This": https://wiki.postgresql.org/wiki/Don't_Do_This
- PostgreSQL docs, UUID functions (`uuidv7`): https://www.postgresql.org/docs/current/functions-uuid.html
- PostgreSQL docs, constraints: https://www.postgresql.org/docs/current/ddl-constraints.html
- RFC 9562, Universally Unique IDentifiers: https://www.rfc-editor.org/rfc/rfc9562
- ULID specification: https://github.com/ulid/spec
- Snowflake ID: https://en.wikipedia.org/wiki/Snowflake_ID
- GitHub availability report, May 2021: https://github.blog/news-insights/company-news/github-availability-report-may-2021/
- OWASP API Security Top 10 (2023), API1 BOLA: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
- ByteByteGo system-design-101, ID generator guides: https://github.com/ByteByteGoHq/system-design-101
- SQLite foreign key support: https://www.sqlite.org/foreignkeys.html
