---
name: api-design
description: Use when designing, changing, or reviewing an API contract — REST/HTTP JSON endpoints, GraphQL schemas, gRPC/Protobuf services, tRPC routers, server actions exposed to clients, or webhooks. Covers REST vs GraphQL vs gRPC vs tRPC, resource naming, HTTP methods and status codes, RFC 9457 problem-details errors, cursor pagination, filtering and sorting, versioning, deprecation/Sunset headers, backward compatibility, Idempotency-Key, ETags and optimistic concurrency, long-running operations, rate-limit headers, webhook signing and delivery, authentication and authorization (OAuth 2.1, PKCE, passkeys, token storage, BFF), OWASP API Security Top 10 (BOLA first), and OpenAPI-first workflows. Also use when the user says "add an endpoint", "what status code should this return?", "how do I paginate this?", "is this a breaking change?", "send webhooks to customers", or "secure this API". Not for internal module interfaces (use software-architecture) or retry/timeout behavior of clients (use reliability).
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "software-architecture reliability scalability frontend-architecture testing-strategy"
---

# API Design

A published API is a one-way door: once clients depend on it, every mistake becomes a compatibility constraint. This skill favors boring, consistent, evolvable contracts — REST + OpenAPI for anything public, one error format, one pagination style, additive change only — with security that assumes every caller is hostile and every ID is guessable. The outcome it protects: clients can integrate once, retry safely, and keep working as the API evolves.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Follow the API's existing conventions.** Naming case, error shape, pagination, and versioning already in use win over this skill's defaults; inconsistency is worse than a suboptimal convention.
2. **Contract first for anything others consume.** Write the OpenAPI/SDL/`.proto` before the handler, lint it, and generate types and clients from it.
3. **Consistency beats cleverness.** One naming style, one error format, one pagination style, one date format, one ID format across every endpoint.
4. **Design for evolution.** Additive changes only within a version; clients ignore unknown fields; enums are open.
5. **Authorize every object, every time.** Authentication says who; each handler must still check that this caller may touch this specific object.
6. **Bound everything.** Page size, payload size, query complexity, rate, and spend all have limits.
7. **Make retries safe.** Every operation is idempotent by method semantics or by an idempotency key.

## Workflow

- [ ] **Read existing APIs** in the codebase (routes, OpenAPI files, error helpers, pagination helpers, auth middleware). Gate: you can state the current conventions or confirm there are none.
- [ ] **Pick the style** with the table below; default REST + OpenAPI 3.1 for public or cross-team APIs.
- [ ] **Model resources** from the domain (nouns, relationships, lifecycle states), not from database tables.
- [ ] **Write the contract**: paths, methods, request/response schemas, errors, pagination, auth scopes, rate limits. Lint it (Spectral/Redocly; `buf lint` for Protobuf).
- [ ] **Check compatibility** against the previous contract (oasdiff or equivalent for OpenAPI, `buf breaking`, GraphQL schema diff). Gate: no breaking change without a new version and a deprecation plan.
- [ ] **Security pass** with the OWASP API Top 10 rules below; add tests for unauthorized and cross-tenant access.
- [ ] **Implement** handlers from the contract; validate input with a schema at the boundary; map outputs through explicit response DTOs.
- [ ] **Validate** against Gotchas; fix and repeat.

## Choose the style

| Style | Default for | Avoid when |
|---|---|---|
| **REST/HTTP + JSON, OpenAPI** | **Public and partner APIs, webhooks, simple CRUD, cacheable reads** | Many client types need very different shapes of deeply nested data |
| GraphQL | Many clients with different data needs over a rich graph; BFF or federation across teams | Public APIs needing HTTP caching and simple rate limiting; small CRUD apps |
| tRPC (or typed server functions) | Full-stack TypeScript monorepo, your own clients only | Public, partner, or non-TypeScript consumers |
| gRPC (Protobuf over HTTP/2) | Internal service-to-service, low latency, streaming, polyglot | Browsers without a proxy layer (gRPC-Web/Connect); public APIs |
| Server Actions / server functions | Mutations from your own React/Next app | Anything external — and remember they are public HTTP endpoints |
| Webhooks / events | Notifying other systems of changes | Request/response needs |

Common healthy mix: REST for public, tRPC/GraphQL/server functions for your own frontend, gRPC or events internally. GraphQL and gRPC specifics: `references/graphql-grpc.md`.

## Resources and URLs

- Plural nouns, lowercase, hyphenated: `/v1/invoices`, `/v1/invoices/{invoiceId}/line-items`. Max ~2 levels of nesting; beyond that, promote the child to a top-level resource with a filter.
- Actions that are not CRUD: `POST /v1/invoices/{id}:send` (Google AIP custom method style) or `POST /v1/invoices/{id}/send` — pick one style per API.
- IDs are opaque strings (prefixed IDs like `inv_8f2k` help debugging); never expose sequential integers where enumeration matters.
- JSON field names in one case — `camelCase` is the common default; `snake_case` is fine if consistent.
- Timestamps in RFC 3339 UTC (`2026-09-30T12:04:11Z`); durations and intervals in explicit units (`timeoutSeconds`).
- Money as integer minor units plus currency (`{"amountMinor": 4900, "currency": "EUR"}`) or a decimal string — never a float.
- Enums as strings; document that new values may be added and clients must handle unknown ones.

## Methods and status codes

| Method | Semantics | Success |
|---|---|---|
| GET | Safe, cacheable, no side effects | 200; 304 with `If-None-Match` |
| POST | Create or non-idempotent action — make retry-safe with `Idempotency-Key` | 201 + `Location`; 202 for async; 200 for actions returning a result |
| PUT | Full replace (or create at a client-chosen ID); idempotent | 200 or 204; 201 if created |
| PATCH | Partial update — JSON Merge Patch (RFC 7396) by default | 200 or 204 |
| DELETE | Remove; idempotent | 204 (repeat → 204 or 404, documented) |

| Error | Use for |
|---|---|
| 400 | Malformed syntax or unparseable body |
| 401 | Missing or invalid authentication (with `WWW-Authenticate`) |
| 403 | Authenticated but not allowed — use 404 instead when existence itself is secret |
| 404 | Not found (or not visible to this caller) |
| 409 | State conflict: version mismatch, duplicate, idempotency key in progress |
| 412 | `If-Match` precondition failed |
| 413 / 415 | Payload too large / unsupported media type |
| 422 | Well-formed but semantically invalid (validation, business rule) |
| 429 | Rate limited, with `Retry-After` |
| 500 / 502 / 503 / 504 | Server fault / bad upstream / unavailable (+ `Retry-After`) / upstream timeout |

Full conventions (conditional requests, long-running operations, bulk, field selection): `references/rest-conventions.md`.

## Errors: RFC 9457 problem details

Every error response uses `application/problem+json`:

```json
{
  "type": "https://api.example.com/problems/insufficient-funds",
  "title": "Insufficient funds",
  "status": 422,
  "detail": "The transfer requires 50.00 EUR; the available balance is 30.00 EUR.",
  "instance": "/v1/transfers/tr_abc123",
  "code": "insufficient_funds",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "errors": [{ "pointer": "/amount", "detail": "exceeds available balance" }]
}
```

Clients branch on `type` or `code`, never on `detail` text. Never leak stack traces, SQL, or internal hostnames; always include a trace ID. RFC 9457 obsoletes RFC 7807 and is wire-compatible with it.

## Pagination, filtering, sorting

- **Default: cursor pagination** — `GET /v1/invoices?limit=20&cursor=…` → `{ "data": [...], "nextCursor": "…" | null }`. Cursors are opaque (encoded sort key + ID), the order is deterministic with a unique tiebreaker, and the server fetches `limit + 1` to know if there is more.
- Default `limit` 20–50, enforced maximum (e.g., 100); reject or clamp larger values.
- Offset/page numbers only for small, stable collections where jumping to page N matters.
- Totals are expensive — make `totalCount` optional or approximate.
- Filtering and sorting through an allow-list: `?status=open&sort=-createdAt`; each allowed filter/sort is backed by an index.

Details and SQL: `references/errors-pagination.md`.

## Evolution: compatibility, versioning, deprecation

**Non-breaking** (allowed within a version): adding endpoints, optional request fields, response fields, enum values (if documented as open), optional headers.

**Breaking** (needs a new version): removing or renaming fields or endpoints; changing types, formats, or meaning; making an optional request field required; tightening validation; changing default behavior, error codes, or pagination; changing auth requirements.

- **Default versioning: a major version in the URL** (`/v1/`), bumped only for breaking changes. Date-based versions pinned per account (Stripe-style `Stripe-Version`, Azure `api-version`) suit large public APIs with a transformation layer. GraphQL evolves one schema with `@deprecated`; Protobuf never reuses field numbers.
- **Deprecation**: announce; send `Deprecation` (RFC 9745) and `Sunset` (RFC 8594) headers with a `Link` to migration docs; measure who still calls it; keep old major versions alive for a published period (commonly 6–12 months or more for public APIs).
- Run a breaking-change diff in CI on every contract change.

## Idempotency, concurrency, long-running operations

- **Idempotency-Key** on POST (and PATCH where retried): the client sends a unique key (UUID) per logical operation. The server stores `(principal, key, request fingerprint, status, response)` with a unique constraint; a repeat with the same fingerprint returns the stored response; a repeat while in progress → 409; the same key with a different body → 422; keys expire after ~24 h. The header is an IETF draft, widely used (Stripe popularized it).
- **Optimistic concurrency**: return `ETag`; require `If-Match` on PUT/PATCH/DELETE of contended resources → 412 on mismatch.
- **Long-running operations**: `202 Accepted` + `Location` (or `Operation-Location`) of an operation resource with `status` (`notStarted | running | succeeded | failed | canceled`) and `Retry-After` for polling; offer a webhook for completion.

## Rate limits

Return `429` with `Retry-After`. Advertise quotas with rate-limit headers: the IETF `RateLimit-Policy` / `RateLimit` fields are still a draft in 2026 (syntax has changed between drafts), so many APIs send the de facto `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. Pick one, document it, and limit expensive endpoints by cost. Algorithms: `scalability`.

## Webhooks

Default: follow the **Standard Webhooks** spec. Producer signs `webhook-id.webhook-timestamp.body` with HMAC-SHA256 and sends `webhook-id`, `webhook-timestamp`, `webhook-signature`; retries with exponential backoff over hours to days; disables endpoints after sustained failure; guards against SSRF when calling customer URLs. Consumer verifies the signature over the raw body with a constant-time comparison, rejects timestamps outside ~5 minutes, dedupes by `webhook-id`, returns 2xx fast, and processes asynchronously. Details: `references/webhooks.md`.

## Authentication and authorization

- **Use an identity provider or a vetted library**; do not build login, token issuance, or JWT parsing by hand unless identity is your product.
- **OAuth 2.1** (still an IETF draft as of 2026-09; it consolidates the OAuth 2.0 Security BCP, RFC 9700): authorization code + **PKCE for every client**; no implicit or password grants; exact redirect URI matching; no tokens in query strings; refresh tokens rotated or sender-constrained (DPoP, mTLS) for public clients.
- **Browser apps: backend-for-frontend (BFF)** — tokens stay on the server; the browser gets an `HttpOnly; Secure; SameSite=Lax` (or `Strict`) session cookie. Never store tokens in `localStorage`. Cookie auth needs CSRF protection.
- **Mobile**: authorization code + PKCE via the system browser; tokens in Keychain/Keystore.
- **Access tokens** short-lived (5–15 min); refresh-token rotation with reuse detection; revoke on logout and password change. Validate `iss`, `aud`, `exp`, `nbf`, and pin allowed algorithms.
- **Passkeys (WebAuthn)**: phishing-resistant; offer alongside existing sign-in, then promote; keep account recovery as strong as sign-in.
- **Service-to-service**: workload identity, mTLS, or OAuth client credentials — no long-lived shared keys in code.
- **Authorization** lives in the service at the resource level, deny by default; centralize policy (RBAC → ABAC/ReBAC as needed).

Details, password rules, and OWASP entries: `references/security.md`.

## OWASP API Security Top 10 (2023) as rules

| Risk | Rule |
|---|---|
| **API1 Broken Object Level Authorization (BOLA)** | Every handler taking an ID checks the caller may access *that* object; scope queries by owner/tenant; test cross-user access |
| API2 Broken Authentication | Vetted IdP/libraries; rate-limit and lock out credential attacks; strict token validation |
| API3 Broken Object Property Level Authorization | Allow-listed input DTOs (no mass assignment); explicit output DTOs (never serialize ORM entities) |
| API4 Unrestricted Resource Consumption | Limits on rate, page size, payload, uploads, query cost, timeouts, and paid-resource spend |
| API5 Broken Function Level Authorization | Deny by default; server-side role checks on admin functions; hidden UI is not a control |
| API6 Unrestricted Access to Sensitive Business Flows | Anti-automation on signup, purchase, referral, and reservation flows |
| API7 Server-Side Request Forgery | Allow-list outbound hosts; block private and metadata IP ranges; no redirects to internal |
| API8 Security Misconfiguration | TLS everywhere, CORS allow-list (never `*` with credentials), security headers, no verbose errors |
| API9 Improper Inventory Management | Document every endpoint and version; retire old versions; no forgotten debug or staging APIs |
| API10 Unsafe Consumption of APIs | Validate and bound data from third-party APIs and LLMs like user input; timeouts; TLS verification |

## Gotchas

- **Missing object-level authorization.** Authenticated ≠ authorized. `GET /invoices/{id}` must check the invoice belongs to the caller's tenant; return 404 otherwise.
- **`update(req.body)`** — mass assignment lets clients set `role`, `tenantId`, or `price`. Use allow-listed input schemas.
- **Returning ORM entities** leaks internal and sensitive fields. Map to response DTOs.
- **Unbounded lists** — every collection endpoint paginates with an enforced max.
- **Error text as contract** — clients parse `detail`; give stable `type`/`code` instead.
- **"Small" breaking changes**: renaming a field, tightening validation, or making a field required breaks clients. Diff contracts in CI.
- **POST without idempotency** on payments, orders, or messages — client retries create duplicates.
- **Verbs in URLs for CRUD** (`/getInvoices`, `/createUser`) — use methods on resources.
- **200 with `{"error": …}`** — use real status codes; caches, clients, and monitoring depend on them.
- **Webhook signature over parsed JSON** — re-serialization changes bytes; verify the raw body.
- **Tokens in `localStorage` or URLs** — exfiltrated by XSS and logs. BFF with HttpOnly cookies for browsers.
- **Server actions/functions assumed private** — they are public endpoints; authenticate, authorize, and validate inside each one.

## Output format

For a new or changed API, deliver:

1. The contract (OpenAPI 3.1 YAML, GraphQL SDL, or `.proto`) — or a precise diff of it.
2. An endpoint table:

```
| Method | Path | Auth (scope/role) | Request | Success | Errors | Idempotent? | Paginated? | Rate limit |
```

3. Compatibility verdict: `Non-breaking` or `Breaking → v2 + deprecation plan`.
4. Security notes: object-level authorization rule per endpoint; limits.
5. Tests to add: happy path, validation, unauthorized, cross-tenant/other-user access, idempotent retry, pagination boundaries.

For reviews, list findings as **Observed / Inferred / Not checked**, highest risk first.

## References

| File | Read when |
|---|---|
| `references/rest-conventions.md` | naming resources, choosing methods/status codes, conditional requests, long-running or bulk operations, OpenAPI workflow |
| `references/errors-pagination.md` | designing error payloads, cursor pagination, filtering/sorting, versioning and deprecation headers, or compatibility checks |
| `references/webhooks.md` | sending or receiving webhooks |
| `references/security.md` | authentication, token storage, passkeys, authorization models, or an OWASP API security review |
| `references/graphql-grpc.md` | designing a GraphQL schema, gRPC/Protobuf service, or tRPC router |

## Related skills

- `software-architecture` — which module or service owns the API; BFF placement.
- `reliability` — client-side timeouts, retries, and circuit breakers for API consumers.
- `scalability` — rate-limiting algorithms, caching, and database-backed pagination performance.
- `frontend-architecture` — data fetching and server-action patterns in the client app.
- `testing-strategy` — contract tests and API integration tests.
