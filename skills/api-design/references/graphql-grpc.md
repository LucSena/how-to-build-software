# GraphQL, gRPC, and tRPC — Design Rules

When the style table points away from REST, these rules keep the alternative safe and evolvable.

## Contents
1. Choosing among them
2. GraphQL schema design
3. GraphQL performance and security
4. gRPC and Protobuf
5. tRPC and typed server functions
6. Rules catalog

## 1. Choosing among them

| Need | Pick |
|---|---|
| Public or partner API, HTTP caching, simplest integration | REST + OpenAPI |
| Many client apps with different data needs over a connected graph; federating several teams' data | GraphQL |
| Internal, low-latency, polyglot service calls; streaming; strict contracts | gRPC (Connect if browsers must call it) |
| Your own TypeScript frontend and backend in one repo | tRPC or framework server functions |

You can mix: a GraphQL or tRPC layer for your own frontend, REST for partners, gRPC internally.

## 2. GraphQL schema design

- **Design the schema from client use cases**, not database tables. Types are domain nouns; fields are what screens need.
- **Nullability**: make fields nullable when they can fail independently (a resolver error nulls that field, not the whole response); make IDs and truly guaranteed fields non-null.
- **Global object identification**: opaque `ID!` values; a `node(id:)` query if you use Relay-style clients.
- **Pagination**: Relay-style connections (`edges { node cursor }`, `pageInfo { hasNextPage endCursor }`) with `first`/`after`; enforce a maximum `first`.
- **Mutations**: one per use case (`sendInvoice`, not `updateInvoice` with a status field); single input object argument (`input: SendInvoiceInput!`); return a payload type with the changed object plus a `userErrors` list for expected business errors (`[{ field, code, message }]`). Reserve top-level `errors` for unexpected failures.
- **Evolution**: no versions; add fields and types freely; mark old fields `@deprecated(reason: "Use totalAmount")`; track field usage before removing anything; never change a field's type or nullability in place.
- **Enums** are open in practice; clients must tolerate unknown values.
- **Naming**: `camelCase` fields, `PascalCase` types, `SCREAMING_SNAKE_CASE` enum values.

## 3. GraphQL performance and security

- **N+1 is the default failure mode**: resolvers run per object. Batch with DataLoader (or your framework's equivalent) per request; check query counts in tests.
- **Limit query cost**: maximum depth, maximum breadth, and a cost/complexity budget per operation; reject over-budget queries before execution.
- **Persisted queries (trusted documents)** for first-party clients: the server accepts only pre-registered operation hashes in production. This blocks arbitrary expensive queries and shrinks requests.
- **Authorization per field and per object** in resolvers or a shared policy layer — GraphQL makes it easy to reach sensitive fields through unexpected paths (OWASP API1 and API3).
- **Introspection**: disable or restrict in production for private APIs.
- **Rate limit by cost**, not by request count — one GraphQL request can be as expensive as hundreds of REST calls.
- **Caching**: HTTP caching is harder (POST, one endpoint). Use GET for persisted queries where possible, response caching keyed by operation + variables + user, and normalized client caches.
- **Errors**: include a stable `extensions.code` on errors; never leak stack traces.
- **Federation** (multiple subgraphs composed into one graph) only when several teams own different parts of the graph; it adds a gateway and composition checks to run.

## 4. gRPC and Protobuf

- **Package per major version**: `package acme.billing.v1;`. Breaking changes → `v2` package, run both.
- **Field rules**: never change a field's number or type; never reuse a deleted field's number or name — mark them `reserved`. Adding fields is safe; clients ignore unknown fields.
- **Enums**: first value `*_UNSPECIFIED = 0`; handle unknown values.
- **Request/response messages per RPC** (`GetInvoiceRequest`, `GetInvoiceResponse`) even when small, so they can grow independently.
- **Resource-oriented methods** (Google AIP style): `GetInvoice`, `ListInvoices` (with `page_size`, `page_token`, `next_page_token`), `CreateInvoice`, `UpdateInvoice` (with a `FieldMask`), `DeleteInvoice`, plus custom methods for actions.
- **Deadlines on every call**; servers check cancellation and propagate remaining deadline to downstream calls.
- **Status codes**: use canonical codes deliberately — `INVALID_ARGUMENT`, `NOT_FOUND`, `ALREADY_EXISTS`, `PERMISSION_DENIED`, `UNAUTHENTICATED`, `FAILED_PRECONDITION`, `RESOURCE_EXHAUSTED`, `UNAVAILABLE` (retryable), `DEADLINE_EXCEEDED`. Attach structured details (the `google.rpc` error details) for field violations.
- **Retries** via client retry policy/service config only for idempotent methods and retryable codes (typically `UNAVAILABLE`).
- **Tooling**: `buf lint` and `buf breaking` in CI; generate clients; keep `.proto` files in one shared, versioned location.
- **Browsers**: gRPC is not browser-native; use Connect or gRPC-Web through a proxy, or put a REST/GraphQL layer in front.
- **Load balancing**: HTTP/2 multiplexes many calls on one connection; use request-level (L7) load balancing or client-side balancing, otherwise one backend gets all traffic from a client.

## 5. tRPC and typed server functions

- Use only for clients you own and deploy together with the server (same monorepo, same release train).
- Every procedure validates input with a schema (Zod, Valibot) and performs authentication and authorization inside — procedures and server actions are ordinary public HTTP endpoints underneath.
- Keep procedures thin: call the application layer; do not put business logic or raw DB access in router files.
- Return DTOs, never ORM objects (their fields leak to the client bundle and network).
- Organize routers by domain module, mirroring the backend's module boundaries.
- When a third party or a non-TypeScript client needs access, expose a REST/OpenAPI surface instead of opening the tRPC router.
- Mobile apps that ship through app stores run old versions for months: treat their procedures as a versioned public API (additive changes only), or route them through REST.

## 6. Rules catalog

### Batch GraphQL resolvers
**Rule.** Resolve related objects through per-request DataLoaders.
**Apply when.** Any resolver that loads by ID or foreign key.
**Do / Avoid.** Do: `ctx.loaders.customer.load(order.customerId)`. Avoid: `db.customer.findById` inside the `Order.customer` resolver.
**Why.** Each list item otherwise triggers its own query (N+1), turning one request into hundreds of queries.

### Cap GraphQL query cost before execution
**Rule.** Enforce depth, breadth, and cost limits, and use persisted queries for first-party clients.
**Apply when.** Any GraphQL endpoint reachable from the internet.
**Do / Avoid.** Do: reject operations above a cost budget of N. Avoid: allowing arbitrarily nested `friends { friends { friends … } }`.
**Why.** A single crafted query can exhaust the backend (OWASP API4).

### Reserve deleted Protobuf fields
**Rule.** When removing a field, mark its number and name `reserved`.
**Apply when.** Editing any `.proto` message.
**Do / Avoid.** Do: `reserved 4; reserved "legacy_total";`. Avoid: reusing field 4 for a new meaning.
**Why.** Old clients still send and read field 4; reuse silently corrupts data across versions.

### Authorize inside every server function
**Rule.** tRPC procedures and server actions authenticate, authorize, and validate their own input.
**Apply when.** Writing any typed RPC or server action.
**Do / Avoid.** Do: `protectedProcedure.input(schema).mutation(({ ctx, input }) => invoices.send(ctx.user, input.id))` with an ownership check. Avoid: trusting that only your UI calls it.
**Why.** They are reachable over HTTP by anyone; the type system does not enforce access control.

## Sources

- GraphQL specification and best practices: https://graphql.org/learn/best-practices/
- GraphQL Cursor Connections Specification (Relay): https://relay.dev/graphql/connections.htm
- DataLoader: https://github.com/graphql/dataloader
- OWASP GraphQL Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
- Protocol Buffers, updating a message type and reserved fields: https://protobuf.dev/programming-guides/proto3/
- Google API Improvement Proposals (standard methods, pagination, errors): https://google.aip.dev/
- gRPC status codes: https://grpc.io/docs/guides/status-codes/ ; deadlines: https://grpc.io/docs/guides/deadlines/
- Buf documentation: https://buf.build/docs/
- Connect RPC: https://connectrpc.com/
- tRPC documentation: https://trpc.io/docs
- API style comparison (WunderGraph): https://wundergraph.com/blog/graphql-vs-federation-vs-trpc-vs-rest-vs-grpc-vs-asyncapi-vs-webhooks
