# Errors, Pagination, Filtering, Versioning, and Compatibility

The parts of an API contract that clients code against most heavily — and that are hardest to change later.

## Contents
1. Problem details (RFC 9457)
2. Validation errors
3. Error catalog
4. Cursor pagination
5. Filtering and sorting
6. Versioning strategies
7. Deprecation and sunset
8. Compatibility rules
9. Rules catalog

## 1. Problem details (RFC 9457)

Media type: `application/problem+json`. Standard members:

| Member | Meaning |
|---|---|
| `type` | URI identifying the problem type; stable; ideally resolves to documentation. Defaults to `about:blank` (then `title` should match the HTTP status phrase) |
| `title` | Short, human-readable summary; same for every occurrence of the type |
| `status` | HTTP status code (duplicated for convenience) |
| `detail` | Explanation of *this* occurrence; for humans, never parsed |
| `instance` | URI identifying this occurrence |

Add extension members as needed — common ones: `code` (stable machine-readable string), `traceId`, `errors` (array for field-level issues), `retryAfterSeconds`. RFC 9457 obsoletes RFC 7807 and remains wire-compatible; it also adds a registry for common problem types and guidance for reporting multiple problems.

Implementation sketch (TypeScript):

```ts
export class Problem extends Error {
  constructor(readonly status: number, readonly type: string, readonly title: string,
              readonly detail?: string, readonly ext: Record<string, unknown> = {}) { super(title); }
}

export function toResponse(err: unknown, traceId: string): Response {
  const p = err instanceof Problem
    ? err
    : new Problem(500, 'about:blank', 'Internal Server Error'); // never leak internals
  return new Response(JSON.stringify({
    type: p.type, title: p.title, status: p.status, detail: p.detail, traceId, ...p.ext,
  }), { status: p.status, headers: { 'content-type': 'application/problem+json' } });
}
```

## 2. Validation errors

One response lists every field problem so clients can show them together:

```json
{
  "type": "https://api.example.com/problems/validation",
  "title": "Request validation failed",
  "status": 422,
  "code": "validation_failed",
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "errors": [
    { "pointer": "/email", "code": "invalid_format", "detail": "Must be a valid email address." },
    { "pointer": "/items/2/quantity", "code": "out_of_range", "detail": "Must be between 1 and 99." }
  ]
}
```

- `pointer` is a JSON Pointer into the request body; use `parameter` for query parameters and `header` for headers.
- Per-field `code` values are stable and documented so clients can localize messages.

## 3. Error catalog

Maintain a documented list of problem types with status, meaning, and whether retrying can help:

| Type / code | Status | Retry? |
|---|---|---|
| `validation_failed` | 422 (or 400 per your convention) | No — fix the request |
| `unauthenticated` | 401 | After re-authenticating |
| `forbidden` | 403 | No |
| `not_found` | 404 | No |
| `conflict` / `version_mismatch` | 409 / 412 | After re-reading the resource |
| `idempotency_key_in_use` | 409 | Yes, later |
| `idempotency_key_reused` | 422 | No — new key or same body |
| `rate_limited` | 429 | Yes, after `Retry-After` |
| `internal_error` | 500 | Idempotent operations only |
| `service_unavailable` | 503 | Yes, after `Retry-After` |

Never include stack traces, SQL, internal hostnames, or dependency names in `detail`.

## 4. Cursor pagination

Request: `GET /v1/tickets?limit=20&cursor=eyJjIjoiMjAyNi0wOS0zMFQxMjowNDoxMVoiLCJpIjoidGtfOTEifQ`

Response:

```json
{
  "data": [ { "id": "tk_92", "createdAt": "2026-09-30T12:03:58Z", "title": "…" } ],
  "nextCursor": "eyJjIjoiMjAyNi0wOS0zMFQxMjowMzo1OFoiLCJpIjoidGtfOTIifQ"
}
```

Rules:
- The cursor encodes the sort key values plus the unique ID of the last item (base64 JSON is fine; sign or encrypt it if clients must not tamper with it or see the values).
- Deterministic order with a unique tiebreaker: `ORDER BY created_at DESC, id DESC`.
- Query with a row-value comparison and `LIMIT limit + 1`; if you got the extra row, there is a next page.
- `nextCursor: null` means the end. Optionally `prevCursor` for bidirectional paging.
- A cursor is valid only with the same filters and sort; reject mismatches with 400.
- `limit` default 20–50, maximum enforced (e.g., 100).
- Alternatively return `Link: <…?cursor=…>; rel="next"` — pick one style for the whole API.
- `totalCount` only on request and only if cheap; otherwise `hasMore` or an estimate.

SQL and indexing: see `scalability` → `references/databases.md`.

**Offset pagination** (`?offset=40&limit=20` or `?page=3&pageSize=20`): acceptable for small, slowly changing collections where users need page numbers. Costs grow with offset, and inserts shift rows between pages (duplicates or skips).

## 5. Filtering and sorting

- Simple equality filters as query parameters: `?status=open&assigneeId=u_1`.
- Ranges with explicit suffixes or bracket syntax — choose one: `?createdAfter=…&createdBefore=…` or `?createdAt[gte]=…`.
- Multiple values: `?status=open,pending` (document it).
- Sorting: `?sort=-createdAt,title` (minus = descending).
- **Allow-list** filterable and sortable fields; reject others with 400. Each allowed combination needs a supporting index.
- Free-text search gets its own parameter (`?q=`) and its own rate limit.
- For complex query needs, consider a dedicated search endpoint (`POST /v1/tickets:search` with a JSON body) rather than an ad-hoc query language in URLs.

## 6. Versioning strategies

| Strategy | Example | Choose when |
|---|---|---|
| **URL major version** | `/v1/…` | **Default.** Explicit, cache-friendly, easy to route and test |
| Header / media type | `Accept: application/vnd.acme.v2+json` | Clean URLs matter more than debuggability |
| Date-based, per-account pinning | `Stripe-Version: 2024-06-20`, Azure `api-version=2024-05-01` | Large public APIs evolving frequently with a translation layer per version |
| Schema evolution | GraphQL `@deprecated` | GraphQL — no versions, additive only |
| Package versions | Protobuf `package acme.billing.v1;` | gRPC — never reuse field numbers; `buf breaking` in CI |

Bump the major version only for breaking changes. Run old and new versions side by side, ideally with the old one implemented as an adapter over the new one.

## 7. Deprecation and sunset

1. Announce in changelog, docs, and email to registered developers.
2. Send headers on deprecated endpoints or versions:

```
Deprecation: @1767225600
Sunset: Wed, 30 Jun 2027 23:59:59 GMT
Link: <https://api.example.com/docs/migrate-to-v2>; rel="deprecation"; type="text/html"
```

   `Deprecation` (RFC 9745) carries the date deprecation took effect as a structured-field timestamp; `Sunset` (RFC 8594) is the HTTP-date after which it may stop working.
3. Measure usage of deprecated endpoints per client; contact heavy users directly.
4. Keep public major versions alive for a published period (commonly 6–12 months or more).
5. After sunset, return `410 Gone` with a problem-details body pointing to the migration guide.

## 8. Compatibility rules

**Safe (non-breaking)**
- Add an endpoint, an optional request field, an optional query parameter, a response field, a response header.
- Add an enum value — only if the enum was documented as open and clients were told to handle unknown values.
- Relax validation (accept more).

**Breaking**
- Remove or rename an endpoint, field, parameter, or enum value.
- Change a field's type, format, units, or meaning; change nullability to allow `null` where clients assumed a value.
- Make an optional request field required; add a required parameter; tighten validation.
- Change default values, sort order, pagination style, error codes, or status codes.
- Change authentication or required scopes.

**Client obligations** (document them): ignore unknown fields; handle unknown enum values; follow `Location`/`Link` URLs rather than constructing them; honor `Retry-After`.

Automate: oasdiff (OpenAPI), `buf breaking` (Protobuf), GraphQL schema diff tools — required CI checks on contract changes.

## 9. Rules catalog

### Give every error a stable machine-readable type
**Rule.** Every error has a documented `type` URI and/or `code` that clients can branch on.
**Apply when.** Adding any error path.
**Do / Avoid.** Do: `"code": "card_declined"`. Avoid: clients matching `detail.includes("declined")`.
**Why.** Human-readable text changes with wording and localization; codes are a contract.

### Default to cursor pagination with a max limit
**Rule.** Collections use opaque cursors, deterministic ordering with a unique tiebreaker, and an enforced maximum page size.
**Apply when.** Any list endpoint over data that can grow.
**Do / Avoid.** Do: `?limit=20&cursor=…` → `nextCursor`. Avoid: `?page=5000` scanning and discarding 100k rows.
**Why.** Keyset pagination is stable under concurrent inserts and costs O(log n) per page with an index.

### Treat enums as open
**Rule.** Document that new enum values may appear and require clients to handle unknown values.
**Apply when.** Defining any enum in a response.
**Do / Avoid.** Do: clients map unknown `status` values to a generic state. Avoid: exhaustive client switches that crash on a new value.
**Why.** Otherwise every new state becomes a breaking change.

### Diff the contract in CI
**Rule.** Every contract change runs an automated breaking-change check against the last release.
**Apply when.** Editing OpenAPI, GraphQL SDL, or `.proto` files.
**Do / Avoid.** Do: oasdiff/`buf breaking` as a required check. Avoid: relying on reviewers to spot a renamed field.
**Why.** Breaking changes are easy to miss by eye and expensive once clients depend on them.

## Sources

- RFC 9457 Problem Details for HTTP APIs: https://www.rfc-editor.org/rfc/rfc9457.html
- RFC 6901 JSON Pointer: https://www.rfc-editor.org/rfc/rfc6901.html
- RFC 9745 The Deprecation HTTP Response Header Field: https://www.rfc-editor.org/rfc/rfc9745.html
- RFC 8594 The Sunset HTTP Header Field: https://www.rfc-editor.org/rfc/rfc8594.html
- RFC 8288 Web Linking: https://www.rfc-editor.org/rfc/rfc8288.html
- Microsoft Azure REST API Guidelines and Versioning Guidelines: https://github.com/microsoft/api-guidelines/tree/vNext/azure
- Stripe API versioning: https://docs.stripe.com/api/versioning
- Buf breaking change detection: https://buf.build/docs/breaking/
- ByteByteGo, system-design-101 (pagination): https://github.com/ByteByteGoHq/system-design-101
