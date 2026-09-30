# Time, Money, and People — Modeling the Real World

These three domains produce the most expensive schema bugs, because the real world does not match programmers' assumptions. Each section gives the rule, the SQL, and the failure it prevents. The "falsehoods" essays linked in Sources are worth reading once.

## Contents
1. Money and currencies
2. Ledgers
3. Instants, dates, durations
4. Future local events and time zones
5. Names
6. Addresses
7. Emails
8. Phone numbers
9. Gender and relationships
10. PII inventory, retention, and erasure
11. Rules catalog

## 1. Money and currencies

- **Never binary floating point** (`float`, `double`, `real`, JavaScript `number` for arithmetic): 0.1 has no exact binary representation, and errors accumulate.
- **Amount and currency travel together**, always: a bare `price` column is ambiguous the day you add a second currency.
- Two sound representations:

| Representation | Use when | Notes |
|---|---|---|
| `bigint amount_minor` + `currency` | Payments, balances, prices shown to customers | Payment APIs such as Stripe's express amounts in the smallest currency unit |
| `numeric(p, s)` + `currency` | Accounting, tax, FX rates, unit prices below the minor unit | Choose scale for the domain (e.g., `numeric(19,4)`); round explicitly at defined points |

- **The minor-unit exponent varies by currency** (0 for JPY, 2 for USD/EUR, 3 for a few such as KWD/BHD). Keep it in a table; never hard-code `/ 100`.
- **Avoid the Postgres `money` type** — output depends on the `lc_monetary` setting and it has fixed fractional precision (Postgres wiki "Don't Do This").
- **Snapshot** the price, tax, currency, and discount onto order lines and invoices; they are historical facts, not copies.
- Real failures from confusing major and minor units: an Etsy postage bug charged about 100× too much, and a Google Ads incident created "$25,000 of funny money" (both collected in awesome-falsehood).

```sql
CREATE TABLE currencies (
  code       char(3) PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),   -- ISO 4217
  minor_unit smallint NOT NULL CHECK (minor_unit BETWEEN 0 AND 4)
);
CREATE TABLE order_lines (
  order_id         bigint  NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  line_no          int     NOT NULL,
  sku              text    NOT NULL,
  quantity         int     NOT NULL CHECK (quantity > 0),
  unit_price_minor bigint  NOT NULL CHECK (unit_price_minor >= 0),    -- snapshot at purchase
  currency         char(3) NOT NULL REFERENCES currencies(code),
  PRIMARY KEY (order_id, line_no)
);
```

Format for display with the locale and currency at the edge (`Intl.NumberFormat`, ICU), never by string concatenation.

## 2. Ledgers

- **Double-entry, append-only**: every transfer writes balanced legs that sum to zero per currency; balances are derived (or cached and reconciled).
- **Corrections are new reversing entries**, never `UPDATE` or `DELETE`. Enforce with permissions.
- Every entry carries a `transfer_id`, the actor, and a reason; admin and support corrections go through the same path (no hidden fix-up access).

```sql
CREATE TABLE ledger_entries (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transfer_id  uuid    NOT NULL,
  account_id   bigint  NOT NULL REFERENCES accounts(id),
  currency     char(3) NOT NULL REFERENCES currencies(code),
  amount_minor bigint  NOT NULL CHECK (amount_minor <> 0),      -- + credit, - debit
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ledger_entries_account_idx ON ledger_entries (account_id, created_at);
REVOKE UPDATE, DELETE ON ledger_entries FROM app_role;
-- "legs sum to zero per transfer and currency" is enforced in the posting function (one transaction)
-- and verified by a scheduled reconciliation query.
```

## 3. Instants, dates, durations

| Kind | Type | Example column |
|---|---|---|
| Something happened (instant) | `timestamptz` | `created_at`, `paid_at` |
| Calendar date, no time | `date` | `birth_date`, `due_on`, `period_start` |
| Wall-clock time of a future local event | `timestamp` (without zone) + IANA zone | `starts_local` + `tz` |
| Duration | `interval`, or integer with unit suffix | `trial_length interval`, `timeout_ms int` |

- `timestamptz` stores a UTC instant and converts on input/output using the session `TimeZone`; it does **not** remember the original zone. Store the zone separately when you need it.
- Set the database and app session time zone to UTC so logs and ad-hoc queries are unambiguous.
- A date stored as "midnight UTC" shows as the previous day for users west of UTC. Use `date`.
- MySQL's `DATETIME` and `TIMESTAMP` have different zone semantics; store UTC and be explicit in the driver configuration.

## 4. Future local events and time zones

Storing only UTC for a future local event breaks when a government changes DST or offset rules before the event (Jon Skeet, "Storing UTC is not a silver bullet"). Store what the user meant:

```sql
CREATE TABLE events (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title        text NOT NULL,
  starts_local timestamp NOT NULL,          -- wall-clock time the user chose
  tz           text NOT NULL,               -- IANA zone, e.g. 'Europe/Berlin'
  starts_at    timestamptz NOT NULL         -- derived cache for querying and sorting
);
-- Not a GENERATED column: generated expressions must be immutable, and zone rules (tzdata) change.
-- Compute starts_at in the app on write; after a tzdata update, recompute future rows:
UPDATE events SET starts_at = starts_local AT TIME ZONE tz
WHERE starts_at > now() AND starts_at <> (starts_local AT TIME ZONE tz);
```

- **User time zone**: store the IANA ID (`America/Sao_Paulo`), never a fixed offset (`-03:00`, which ignores DST changes) or an abbreviation (`EST`/`CST` are ambiguous).
- **Recurring events** ("every Tuesday 19:30 local"): store the rule (e.g., RFC 5545 RRULE) + local time + zone; expand occurrences in the zone, then convert.
- Validate zone names against the tz database the runtime uses.
- Ambiguous and non-existent local times (DST fall-back and spring-forward) need a rule: pick the earlier instant, or ask the user.

## 5. Names

- One `full_name text NOT NULL` (plus optional `display_name` or `sort_name`) works for a global audience; split first/last fields only when a regulation or integration requires them, and never require both.
- Accept any Unicode characters, spaces, apostrophes, hyphens, and single-word names; do not uppercase or "fix" capitalization.
- Names change (marriage, transition, legal change): update them everywhere by referencing the person by ID, not by name.
- Patrick McKenzie's "Falsehoods Programmers Believe About Names" and the W3C "Personal names around the world" explain why.

## 6. Addresses

- Store `country_code char(2)` (ISO 3166-1) plus free-form address lines, and add structured fields (postal code, region, locality) only where you compute on them (tax, shipping zones).
- Postal codes and regions are not universal; do not require them for every country; do not validate with one regex.
- Validate or autocomplete with an address provider when accuracy matters; keep the user's raw input.
- Snapshot the shipping and billing address onto the order or invoice.

## 7. Emails

- Store as entered; enforce uniqueness on `lower(email)` (scoped by tenant where relevant) or use `citext`.
- The local part is technically case-sensitive, but providers almost always treat it as case-insensitive; dedupe on the lowercase form.
- Validate by sending a verification message, not with a strict regex; track `verified_at`.
- An email is a contact method, not an identity: people change addresses; keep the account keyed by ID.

```sql
CREATE UNIQUE INDEX users_tenant_email_uniq ON users (tenant_id, lower(email));
```

## 8. Phone numbers

- Store the normalized E.164 string (`+14155552671`) plus the raw input and, if useful, the region the user selected.
- Parse and validate with libphonenumber (or a port); do not use numeric types (leading zeros, `+`, extensions).
- Numbers are recycled by carriers; re-verify before using a phone number for account recovery.

## 9. Gender and relationships

- Collect gender only if needed; when needed, allow self-description and "prefer not to say" rather than a binary enum, unless a regulation dictates the values.
- Model relationships (marriage, guardianship, household) as rows in a relationship table, not as fixed columns on the person — relationships change and can be plural.

## 10. PII inventory, retention, and erasure

Design so you can answer "where is this person's data, how long do we keep it, and how do we delete it?". Privacy laws such as the GDPR (erasure, data minimization, storage limitation) set obligations here; have counsel confirm specifics — this is not legal advice.

- **Inventory**: tag PII columns in the schema or a data catalog: `COMMENT ON COLUMN users.email IS 'pii:contact';`.
- **Isolate**: keep PII in a few tables keyed by user; elsewhere reference the user by ID, so erasure touches few rows.
- **Retention per table**: keep forever / N days / until account deletion; enforce with a scheduled purge job. For time-series data, partition by time so retention is `DETACH`/`DROP PARTITION` instead of huge `DELETE`s.
- **Erasure workflow**: a `deletion_requests` table with a state machine that fans out to every copy — primary DB, search index, warehouse, caches, logs, object storage, and third-party processors — and records completion evidence.
- **Backups**: a common approach is to let backups age out within a documented window rather than editing them; confirm with counsel.
- **Analytics**: pseudonymize (keyed hash of the user ID) so warehouse data needs less erasure work.
- **Logs**: do not log PII by default; redact in structured logging.
- **Append-only stores** (event sourcing, ledgers, audit logs): keep PII out and reference it by ID, or encrypt it per subject and delete the key to erase (crypto-shredding).

```sql
CREATE TABLE deletion_requests (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      bigint NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  due_by       timestamptz NOT NULL,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','in_progress','completed','failed')),
  completed_at timestamptz,
  evidence     jsonb NOT NULL DEFAULT '{}'      -- per-system confirmations
);
```

## 11. Rules catalog

### Store money as integers or decimals with a currency
**Rule.** Use `bigint` minor units or `numeric`, always paired with an ISO 4217 code; take the exponent from a currency table.
**Apply when.** Any price, amount, balance, fee, or tax.
**Do / Avoid.** Do: `amount_minor bigint, currency char(3)`. Avoid: `price float`, `amount / 100` for every currency.
**Why.** Binary floats misrepresent decimal fractions; exponents differ per currency (JPY has none).

### Keep the user's intent for future local times
**Rule.** Store local date-time plus IANA zone for future events; derive the instant.
**Apply when.** Meetings, bookings, reminders, store hours, recurring schedules.
**Do / Avoid.** Do: `starts_local`, `tz`, derived `starts_at`. Avoid: converting to UTC at booking time and discarding the zone.
**Why.** Time-zone rules change after the booking; only the local intent stays correct.

### Make personal data findable before you need to delete it
**Rule.** Inventory PII per column, confine it to few tables, and give each table a retention rule and purge job.
**Apply when.** Creating any table that stores personal data.
**Do / Avoid.** Do: `users` holds contact data; `orders.user_id` references it. Avoid: copying email and name into events, logs, and analytics tables.
**Why.** Erasure and breach scope are proportional to how many places the data was copied.

## Sources

- PostgreSQL wiki, "Don't Do This" (money, timestamp): https://wiki.postgresql.org/wiki/Don't_Do_This
- Jon Skeet, "Storing UTC is not a silver bullet": https://codeblog.jonskeet.uk/2019/03/27/storing-utc-is-not-a-silver-bullet/
- Shay Rojansky, storing time zones in the database: https://www.roji.org/storing-timezones-in-the-db
- Falsehoods programmers believe about time zones: https://www.creativedeletion.com/2015/01/28/falsehoods-programmers-date-time-zones.html
- IANA time zone database: https://www.iana.org/time-zones
- Patrick McKenzie, "Falsehoods Programmers Believe About Names": https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/
- W3C, "Personal names around the world": https://www.w3.org/International/questions/qa-personal-names
- Falsehoods programmers believe about addresses: https://www.mjt.me.uk/posts/falsehoods-programmers-believe-about-addresses/
- Falsehoods programmers believe about email: https://beesbuzz.biz/code/439-Falsehoods-programmers-believe-about-email
- libphonenumber falsehoods: https://github.com/google/libphonenumber/blob/master/FALSEHOODS.md
- awesome-falsehood (money incidents and more): https://github.com/kdeldycke/awesome-falsehood
- "$25,000 of funny money" (Rachel by the Bay): https://web.archive.org/web/20250326135824/http://rachelbythebay.com/w/2022/12/02/25k/
