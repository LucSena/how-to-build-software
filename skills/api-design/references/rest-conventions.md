# REST Conventions — Resources, Methods, Status Codes, Conditional Requests, Operations

Defaults for HTTP/JSON APIs. When the codebase already has conventions, follow them and note deviations instead of mixing styles.

## Contents
1. Contract-first workflow (OpenAPI)
2. Resource modeling and URLs
3. Methods
4. Status codes
5. Request and response bodies
6. Conditional requests and optimistic concurrency
7. Idempotency-Key protocol
8. Long-running operations
9. Bulk operations and field selection
10. Headers checklist
11. Backend-for-frontend
12. Rules catalog

## 1. Contract-first workflow (OpenAPI)

1. Write or change the OpenAPI 3.1 document first (`openapi/` or next to the service).
2. Lint it in CI (Spectral or Redocly rulesets: naming, required descriptions, error schema, pagination parameters).
3. Diff against the last released version for breaking changes (e.g., oasdiff) and fail CI on unapproved breaks.
4. Generate server types/validators and client SDKs from it; do not hand-write both sides.
5. Review the contract in the PR before implementation; it is the part clients will live with.

Code-first frameworks that emit OpenAPI (FastAPI, NestJS, Hono + Zod OpenAPI, Spring) are fine when the emitted document is committed, linted, and diffed the same way.

## 2. Resource modeling and URLs

- Model the domain's nouns and their lifecycle, not database tables. An `Invoice` resource may span several tables; a join table rarely deserves its own resource.
- Collections plural: `/v1/customers`, item: `/v1/customers/{customerId}`.
- Sub-resources for true containment only: `/v1/invoices/{invoiceId}/line-items`. Beyond two levels, promote: `/v1/payments?invoiceId=inv_1`.
- Custom actions for state transitions that are not plain updates: `POST /v1/invoices/{id}:void` or `POST /v1/invoices/{id}/void`. Prefer modeling the transition as a state change when it carries no extra semantics (`PATCH {"status": "archived"}` is fine for simple cases).
- Singleton sub-resources for one-per-parent data: `/v1/accounts/{id}/settings`.
- Lowercase, hyphenated path segments; no trailing slashes; no file extensions.
- Query parameters for filtering, sorting, pagination, and field selection — not for identity.

## 3. Methods

| Method | Safe | Idempotent | Notes |
|---|---|---|---|
| GET | Yes | Yes | Never changes state; cacheable |
| HEAD | Yes | Yes | Headers only |
| POST | No | No — make it retry-safe with `Idempotency-Key` | Create in a collection, or a custom action |
| PUT | No | Yes | Replace the whole resource; may create at a client-chosen ID |
| PATCH | No | Not inherently | Partial update; JSON Merge Patch (RFC 7396, `application/merge-patch+json`) as default; JSON Patch (RFC 6902) when you need array operations |
| DELETE | No | Yes | Deleting twice has the same effect |

JSON Merge Patch caveat: `null` means "remove this field", so you cannot set a field to `null` through it — document fields where that matters.

## 4. Status codes

| Code | When |
|---|---|
| 200 OK | Successful GET, PUT/PATCH returning the resource, or an action returning a result |
| 201 Created | Resource created; include `Location` and usually the resource |
| 202 Accepted | Work accepted for asynchronous processing; include an operation URL |
| 204 No Content | Success with no body (DELETE, some PUT/PATCH) |
| 304 Not Modified | Conditional GET matched |
| 400 Bad Request | Malformed JSON, wrong types, unparseable parameters |
| 401 Unauthorized | Missing/invalid credentials; send `WWW-Authenticate` |
| 403 Forbidden | Authenticated, not permitted — when revealing existence is acceptable |
| 404 Not Found | Missing, or exists but the caller may not know it does |
| 405 Method Not Allowed | Send `Allow` |
| 409 Conflict | State conflict, duplicate unique value, idempotency key still in progress |
| 410 Gone | Resource or endpoint permanently removed (e.g., after sunset) |
| 412 Precondition Failed | `If-Match`/`If-Unmodified-Since` failed |
| 413 Content Too Large | Payload over the limit |
| 415 Unsupported Media Type | Wrong `Content-Type` |
| 422 Unprocessable Content | Valid syntax, fails validation or business rules |
| 428 Precondition Required | You require `If-Match` and the client omitted it |
| 429 Too Many Requests | Rate limited; `Retry-After` |
| 500 Internal Server Error | Unexpected fault — log with trace ID; generic body |
| 502 / 504 | Upstream failed / timed out |
| 503 Service Unavailable | Overloaded or in maintenance; `Retry-After` |

Pick 400 vs 422 once for the whole API and document it (common split: 400 = can't parse, 422 = parsed but invalid).

## 5. Request and response bodies

- Validate every request with a schema at the boundary (Zod/Valibot, Pydantic, JSON Schema, Bean Validation); reject unknown fields on input for write endpoints, or ignore them explicitly — decide once.
- Response bodies come from explicit response DTOs/serializers, never raw ORM entities.
- Single resource: the object itself (`{ "id": …, … }`). Collections: `{ "data": [...], "nextCursor": … }`. Avoid bare top-level arrays — you cannot add metadata later without breaking clients.
- `null` vs absent: define it. Common rule: absent = not applicable/not requested; `null` = known to be empty.
- Include `createdAt`/`updatedAt` on mutable resources; include `version` or `etag` when clients update concurrently.
- Max request size enforced at the edge and in the app (e.g., 1 MB JSON by default; uploads via pre-signed URLs to object storage).

## 6. Conditional requests and optimistic concurrency

- Return a strong `ETag` for resources (hash or version number).
- Reads: client sends `If-None-Match: "<etag>"` → `304 Not Modified` when unchanged.
- Writes: client sends `If-Match: "<etag>"` on PUT/PATCH/DELETE → `412 Precondition Failed` if the resource changed. Require it (`428`) on resources where lost updates are costly.
- Map to the database with a `version` column: `UPDATE … WHERE id = $1 AND version = $2`.

## 7. Idempotency-Key protocol

For POST (and PATCH) operations with side effects — payments, orders, sends, provisioning:

1. Client generates a unique key (UUID v4) per logical operation and reuses it on every retry of that operation.
2. Server, before doing work, inserts `(principal_id, key, request_fingerprint, status='in_progress', created_at)` under a unique constraint on `(principal_id, key)`.
3. If the insert conflicts:
   - existing record completed and fingerprint matches → return the stored status code and body;
   - still in progress → `409 Conflict` (client retries later);
   - fingerprint differs → `422` — the key was reused for a different request.
4. Perform the operation; store the response in the same transaction as the side effect where possible; mark completed.
5. Expire records after a retention window (Stripe uses 24 hours).
6. Pass derived keys to downstream providers (`{key}:charge`) so their side effects are also deduplicated.

Keys are scoped per principal/tenant; never derive them from timestamps. The header is an IETF draft (`draft-ietf-httpapi-idempotency-key-header`); Azure uses the OASIS `Repeatability-Request-ID` / `Repeatability-First-Sent` headers for the same purpose.

## 8. Long-running operations

```
POST /v1/reports            → 202 Accepted
Operation-Location: https://api.example.com/v1/operations/op_71x
Retry-After: 5

GET /v1/operations/op_71x   → 200
{ "id": "op_71x", "status": "running", "createdAt": "…", "percentComplete": 40 }

GET /v1/operations/op_71x   → 200
{ "id": "op_71x", "status": "succeeded", "result": { "reportId": "rep_9" } }
```

- Status values: `notStarted`, `running`, `succeeded`, `failed`, `canceled`; `error` uses the problem-details shape on failure.
- Include `Retry-After` while not terminal; offer a completion webhook to avoid polling.
- Support cancellation (`POST /v1/operations/{id}:cancel`) when work is expensive.
- The initiating POST takes an `Idempotency-Key` so retries do not start duplicate jobs.

## 9. Bulk operations and field selection

- Bulk endpoints (`POST /v1/contacts:batchCreate`) prevent chatty clients; cap batch size (e.g., 100–1,000), return per-item results with individual errors, and decide atomic vs partial success explicitly.
- Sparse fieldsets (`?fields=id,name,status`) or expansions (`?expand=customer`) for heavy resources — allow-list the fields and cap expansion depth.

## 10. Headers checklist

| Header | Direction | Purpose |
|---|---|---|
| `Authorization` | Request | Bearer token (never in query strings) |
| `Idempotency-Key` | Request | Retry-safe POST |
| `If-Match` / `If-None-Match` | Request | Concurrency / caching |
| `traceparent` | Both | W3C trace context |
| `X-Request-Id` (or similar) | Both | Correlation ID echoed in responses and errors |
| `Location` / `Operation-Location` | Response | Created resource / operation monitor |
| `ETag` | Response | Version for caching and concurrency |
| `Retry-After` | Response | 429, 503, and pending operations |
| `Deprecation` / `Sunset` / `Link` | Response | Lifecycle of deprecated endpoints |
| `Cache-Control` | Response | `no-store` for personal/sensitive data; explicit caching for public GETs |

## 11. Backend-for-frontend

A BFF is a thin server owned by the frontend team that tailors APIs for one client (web, mobile) and holds its tokens.
- Use it to keep OAuth tokens off the browser, aggregate several backend calls into one screen-shaped response, and adapt backend changes without shipping clients.
- Keep domain logic out of it; it composes and translates.
- One BFF per client type if their needs differ; do not let it become a second monolith.

## 12. Rules catalog

### Return real status codes
**Rule.** Signal outcomes with HTTP status codes and a problem-details body, never `200` with an error payload.
**Apply when.** Any error path.
**Do / Avoid.** Do: `422` with `application/problem+json`. Avoid: `200 {"success": false}`.
**Why.** Clients, proxies, caches, retries, and monitoring all branch on status codes; a hidden error defeats every one of them.

### Wrap collections in an object
**Rule.** Return `{ "data": [...], … }` for collections.
**Apply when.** Any list endpoint.
**Do / Avoid.** Do: `{ "data": [...], "nextCursor": null }`. Avoid: a bare JSON array.
**Why.** You will need pagination and metadata; adding them to a bare array is a breaking change.

### Require If-Match on contended writes
**Rule.** Issue ETags and require `If-Match` for updates where concurrent edits happen.
**Apply when.** Resources edited by several users or systems.
**Do / Avoid.** Do: `412` when the ETag is stale. Avoid: last-write-wins silently discarding a colleague's changes.
**Why.** Optimistic concurrency prevents lost updates without locks.

## Sources

- RFC 9110 HTTP Semantics: https://www.rfc-editor.org/rfc/rfc9110.html
- RFC 7396 JSON Merge Patch: https://www.rfc-editor.org/rfc/rfc7396.html ; RFC 6902 JSON Patch: https://www.rfc-editor.org/rfc/rfc6902.html
- Microsoft Azure REST API Guidelines (idempotency, repeatability headers, long-running operations, conditional requests): https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md
- Google API Improvement Proposals (resource names, custom methods): https://google.aip.dev/
- IETF Idempotency-Key header draft: https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header
- Stripe API, Idempotent requests: https://docs.stripe.com/api/idempotent_requests
- OASIS Repeatable Requests 1.0: https://docs.oasis-open.org/odata/repeatable-requests/v1.0/repeatable-requests-v1.0.html
- OpenAPI Specification 3.1: https://spec.openapis.org/oas/v3.1.0
- ByteByteGo, system-design-101 (API design guides): https://github.com/ByteByteGoHq/system-design-101
