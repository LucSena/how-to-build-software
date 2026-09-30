# Authorization: Models, Enforcement, Tenant Isolation, Tests

How to decide who may do what, where to enforce it so it cannot be skipped, and how to prove it works. Broken access control has been OWASP's #1 risk since 2021 and remains #1 in 2025.

## Contents
1. Three layers of checks
2. Where to enforce
3. The central policy function
4. Choosing a model: RBAC, ABAC, ReBAC
5. Tenant isolation
6. IDOR/BOLA patterns
7. Mass assignment and field-level rules
8. Jobs, webhooks, and AI agents
9. Response codes and logging
10. Test matrix
11. Rules catalog

## 1. Three layers of checks

| Layer | Question | ASVS 5.0 | Typical bug |
|---|---|---|---|
| Function | May this user call this action at all? | 8.2.1 | Admin endpoint reachable by any signed-in user |
| Data (object) | May this user act on **this** record? | 8.2.2 | IDOR/BOLA: change the ID in the URL, get someone else's invoice |
| Field (property) | May this user read or write **this field**? | 8.2.3 | Client sets `role: "admin"`; response leaks `passwordHash` |

All three are server-side (8.3.1). Client checks only shape the UI.

## 2. Where to enforce

```
request → edge/middleware (convenience: redirect anonymous users, coarse gates)
        → handler / server action / resolver (authenticate; function-level check)
        → service / data-access layer (object- and field-level check; tenant-scoped query)  ← the check that counts
        → database (row-level security as defense in depth)
```

- **Never rely on middleware alone.** CVE-2025-29927 (critical, 2025) let a request carrying the internal `x-middleware-subrequest` header skip Next.js middleware entirely; apps whose only authorization lived there were exposed. Fixed in 15.2.3, 14.2.25, 13.5.9, 12.3.5. Upgrading fixed that bug; re-checking in the data layer fixes the class.
- **Every entry point checks itself**: REST handlers, server actions and server functions, GraphQL resolvers (per field for sensitive data), RPC procedures, WebSocket messages, queue consumers, cron jobs, and file-serving routes.
- **Global deny**: register a middleware or filter that rejects any route without an explicit policy annotation, so a new route cannot forget.
- **Static files and object storage** are data too: private buckets, short-lived signed URLs issued after an authorization check.

## 3. The central policy function

```ts
// policy.ts — the only place that knows the rules
type Action = "document:read" | "document:update" | "document:delete" | "member:invite";

export function can(user: SessionUser, action: Action, resource?: { orgId: string; ownerId?: string; status?: string }): boolean {
  if (!resource || resource.orgId !== user.orgId) return false;          // tenant boundary first
  const role = user.role;                                                // role within this org
  switch (action) {
    case "document:read":   return true;                                 // any member of the org
    case "document:update": return role === "admin" || resource.ownerId === user.id;
    case "document:delete": return role === "admin";
    case "member:invite":   return role === "admin" || role === "manager";
    default:                return false;                                // deny by default
  }
}

export function authorize(user: SessionUser, action: Action, resource?: Parameters<typeof can>[2]) {
  if (!can(user, action, resource)) throw new ForbiddenError(action);    // fail closed
}
```

- Handlers call `authorize(...)`; nothing else inspects roles directly. Grep for `role ===` outside the policy module in review.
- The same `can()` feeds the UI (hide or disable actions) so UI and server never disagree.
- Unit-test the policy exhaustively (it is a pure function); integration-test that handlers call it.

## 4. Choosing a model: RBAC, ABAC, ReBAC

| Model | Decision based on | Good for | Weak at | Tools (examples) |
|---|---|---|---|---|
| **RBAC** (per tenant) + ownership | Role within an org, plus "is owner" | Admin/editor/viewer SaaS; most products | Per-object sharing; many role variants ("role explosion") | Framework guards, central policy module, auth-library org roles |
| **ABAC** | Attributes of subject, resource, action, environment | "Owner, or same department and status is draft, during business hours" | Policy sprawl without tooling | Cedar (RBAC + ABAC language), OPA/Rego, Cerbos |
| **ReBAC** (Zanzibar-style) | A relationship graph: user → editor of → folder → parent of → doc | Sharing, nested folders or orgs, "list everything I can see" | A separate tuple store to keep in sync with your database | OpenFGA, SpiceDB |

Ladder:
1. **Start** with per-tenant RBAC + ownership checks behind one `can()` function.
2. **Move to a policy engine** (Cedar, OPA, Cerbos) when rules multiply or non-engineers must review them.
3. **Move to ReBAC** (OpenFGA, SpiceDB) when sharing hierarchies or permission-filtered listing become central.

OWASP's Authorization Cheat Sheet argues ABAC and ReBAC generally beat pure RBAC for application development (fine-grained, no role explosion, better multi-tenancy). The pragmatic reading: centralize from day one so you can switch models without touching every handler. The legacy Oso open-source library is deprecated.

**Listing with permissions**: filtering after fetching breaks pagination and leaks counts. Push the filter into the query (tenant and ownership conditions) or use the ReBAC engine's "list objects" API.

## 5. Tenant isolation

- **Resolve the tenant from the authenticated session** (or the verified subdomain mapped server-side), never from the body, query string, or a client header.
- Every tenant-owned table has a non-null `org_id`; every query includes it. A repository or data-access helper that requires the tenant argument makes forgetting a type error.
- **Row-level security** in Postgres as defense in depth:

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;           -- applies to the table owner too
CREATE POLICY tenant_isolation ON documents
  USING (org_id = current_setting('app.org_id')::uuid)
  WITH CHECK (org_id = current_setting('app.org_id')::uuid);
-- per request, inside the transaction (safe with connection pools):
SET LOCAL app.org_id = '…';
```

  The application role must not be a superuser or have `BYPASSRLS`. Keep app-level scoping too: RLS catches the forgotten `WHERE`, app code gives clear errors.
- Caches, search indexes, object-storage prefixes, background jobs, analytics exports, and logs are tenant-scoped as well. Cache keys include the tenant.
- Cross-tenant admin (support staff) goes through an audited impersonation feature with a visible banner, never a shared superuser login.

## 6. IDOR/BOLA patterns

| Stack | Avoid | Do |
|---|---|---|
| Prisma / TypeScript | `findUnique({ where: { id } })` then no check | `findFirst({ where: { id, orgId: session.orgId } })`; 404 on miss |
| Rails | `Project.find(params[:id])` | `current_user.projects.find(params[:id])` |
| Django | `Invoice.objects.get(pk=pk)` | `Invoice.objects.get(pk=pk, org=request.user.org)` or a tenant-scoped manager |
| SQL | `WHERE id = $1` | `WHERE id = $1 AND org_id = $2` |

- Prefer `/me/…` endpoints that take identity from the session over `?userId=`.
- Multi-step flows keep identifiers in server state, not hidden fields the client can edit.
- Bulk endpoints check every ID in the batch, not just the first.
- Nested routes (`/orgs/:orgId/projects/:projectId`) verify that the project belongs to the org **and** the user belongs to the org.
- Unguessable IDs (UUIDv4/v7, ULIDs) slow enumeration but are defense in depth only; IDs leak through URLs, logs, emails, and referrers.

## 7. Mass assignment and field-level rules

- **Input**: one schema per operation, listing exactly the writable fields; unknown fields rejected.
  - TypeScript: Zod or Valibot object schemas with strict mode; class-validator with whitelisting and forbidding non-whitelisted properties.
  - Python: Pydantic models with `extra="forbid"`; Django forms/serializers with explicit `fields`.
  - Rails: strong parameters (`permit` only named keys).
- **Output**: explicit DTOs or serializers; never return ORM entities. Exclude password hashes, tokens, internal flags, other tenants' data, and fields the caller's role cannot read.
- **Field-level write rules** in the policy: only admins change `role`; `status` moves `draft → submitted` only through the submit action; `orgId`, `ownerId`, `createdAt`, `emailVerified`, `balance` are never client-writable.
- GraphQL: authorize per field for sensitive fields; limit query depth and cost.

## 8. Jobs, webhooks, and AI agents

- **Act as the originating user** (ASVS 8.3.3): a job enqueued by Ada runs with Ada's permissions and tenant, captured at enqueue time and re-checked at execution (permissions may have changed).
- **Webhook receivers** authenticate the sender (HMAC signature or a secret token), then authorize against the tenant the webhook is registered to.
- **AI agents and tools** get the user's scope, never a service superuser. Narrow each tool to the minimum (read-only where possible), require confirmation for consequential actions, and log every tool call with the user it acted for.
- **Permission changes apply immediately** (ASVS 8.3.2): with self-contained tokens, keep them short-lived or check a revocation list for sensitive actions.

## 9. Response codes and logging

- 401 when not authenticated; 403 when authenticated but not allowed; **404 when revealing existence is itself a leak** (another tenant's object). Be consistent per resource type.
- Error bodies never say why in detail ("you are not an admin of org X").
- Log every denial with user, tenant, action, resource type and ID, and request ID; alert on bursts (enumeration attempts).

## 10. Test matrix

For each resource, run each action as each principal:

| Principal ↓ / Action → | read | list | create | update | delete | export | admin action |
|---|---|---|---|---|---|---|---|
| Anonymous | 401 | 401 | 401 | 401 | 401 | 401 | 401 |
| Same tenant, owner | ✓ | ✓ | ✓ | ✓ | per policy | per policy | 403 |
| Same tenant, other member | per policy | ✓ | ✓ | 403 (unless shared) | 403 | per policy | 403 |
| Same tenant, admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Other tenant, admin** | **404** | **excluded** | n/a | **404** | **404** | **excluded** | **403/404** |

Also: mass-assignment attempts (`role`, `orgId`) are ignored or rejected; list endpoints never include other tenants' rows; bulk endpoints reject mixed-tenant ID sets. Generate these as parameterized tests so every new route inherits them.

## 11. Rules catalog

### Scope the query, not just the result
**Rule.** Put the tenant or owner condition inside the database query.
**Apply when.** Any lookup by an ID that came from a client.
**Do / Avoid.** Do `WHERE id = $1 AND org_id = $2`. Avoid fetching by ID and comparing afterwards in some handlers but not others.
**Why.** A condition in the query cannot be forgotten by the next handler that reuses the result.

### Enforce authorization next to the data
**Rule.** The authoritative check lives in the service or data-access layer that every entry point calls.
**Apply when.** Any framework with middleware, route guards, or edge functions.
**Do / Avoid.** Do call `authorize()` in the service. Avoid middleware-only checks.
**Why.** Middleware can be bypassed (CVE-2025-29927) or skipped by a new entry point such as a server action or job.

### Deny unknown fields
**Rule.** Input schemas list writable fields per operation and reject everything else.
**Apply when.** Create and update endpoints, server actions, GraphQL mutations.
**Do / Avoid.** Do `UpdateProfile = z.object({ name, avatarUrl }).strict()`. Avoid `db.user.update({ data: req.body })`.
**Why.** Mass assignment turns any writable model into a privilege-escalation endpoint.

## Sources

- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Insecure Direct Object Reference Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html
- OWASP Mass Assignment Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html
- OWASP ASVS 5.0.0 V8 Authorization: https://github.com/OWASP/ASVS/tree/master/5.0/en
- OWASP Top 10:2025 A01: https://owasp.org/Top10/2025/
- GHSA-f82v-jwr5-mffw (CVE-2025-29927, Next.js middleware bypass): https://github.com/advisories/GHSA-f82v-jwr5-mffw
- NIST SP 800-162 (ABAC): https://doi.org/10.6028/NIST.SP.800-162
- OpenFGA: https://github.com/openfga/openfga · SpiceDB: https://github.com/authzed/spicedb · Cerbos: https://github.com/cerbos/cerbos · Cedar: https://github.com/cedar-policy/cedar · Oso (legacy library deprecated): https://github.com/osohq/oso
- PostgreSQL row security policies: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
