# React Server Components and Server Actions

Mental model, boundary rules, the data-access layer, Server Action security, the React2Shell lesson, streaming, and a review checklist. Framework-specific names (Next.js `revalidateTag`, `notFound`) are examples; other RSC frameworks have equivalents.

## Contents

1. Mental model
2. Boundary rules
3. Data-access layer (DAL)
4. Server Actions: the security checklist
5. The React2Shell lesson and patch policy
6. Fetching and streaming
7. Caching and revalidation
8. Review checklist

## 1. Mental model

- **Server Components** run only on the server. Their rendered output is sent to the client; their code, imports, and secrets are not. They can be `async` and read data directly.
- **Client Components** (files starting with `"use client"`) run on the server for the first HTML and then hydrate in the browser. Everything they import is shipped.
- **Server Functions / Actions** (`"use server"`) are functions the client can call. Under the hood each is an HTTP endpoint reachable by anyone who can send a request, whether or not your UI renders the button.
- Layering in an RSC app: thin route files → Server Components (read through the DAL, which authorizes) → Client Components (interactivity only) → Server Actions (mutations: validate, authorize, write, revalidate).

## 2. Boundary rules

### Put `"use client"` at the leaves
**Rule.** Mark only the smallest interactive component as a client component and pass server-rendered content into it as `children`.
**Apply when.** Adding state, effects, event handlers, or browser APIs.
**Do / Avoid.** Do: a server `ProductPage` rendering `<AddToCartButton id={id} />`. Avoid: `"use client"` at the top of `ProductPage` because one button needs `onClick`.
**Why.** The directive marks a boundary: that module and everything it imports become client code and ship to the browser.

### Pass only serializable, minimal props across the boundary
**Rule.** Props from server to client components must be serializable (primitives, plain objects, arrays, `Date`, `Map`, `Set`, promises, JSX, Server Function references) and should contain only fields the UI renders.
**Apply when.** Any server → client prop.
**Do / Avoid.** Do: `<Profile user={{ name, avatarUrl }} />`. Avoid: `<Profile user={userRow} />` where the row includes `passwordHash` and `stripeCustomerId`.
**Why.** Props are embedded in the page payload; anything passed is readable in the browser. Functions and class instances cannot be serialized and fail at runtime.

### Keep server-only code unimportable from the client
**Rule.** Start DAL, auth, and integration modules with `import "server-only"`; keep secrets in non-public environment variables.
**Apply when.** Any module that touches the database, secrets, or internal services.
**Do / Avoid.** Do: `server/dal/*.ts` with the `server-only` import. Avoid: a shared `lib/db.ts` imported by both a server page and a client hook.
**Why.** The build fails loudly instead of silently bundling a secret or DB driver. Variables with public prefixes (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`) are inlined into client JS.

## 3. Data-access layer (DAL)

```ts
// server/dal/invoices.ts
import "server-only";
import { cache } from "react";

export const getViewer = cache(async () => {          // deduped within one request
  const session = await readSession();
  return session ? users.findById(session.userId) : null;
});

export async function getInvoice(id: string): Promise<InvoiceDTO | null> {
  const viewer = await getViewer();
  if (!viewer) throw new UnauthorizedError();
  const row = await db.invoice.findFirst({ where: { id, orgId: viewer.orgId } }); // scoped query
  return row ? toInvoiceDTO(row) : null;              // DTO, never the raw row
}
```

- Every read is scoped to the viewer (tenant, ownership, role) inside the DAL, so a component cannot forget to check.
- Return DTOs with explicit fields. React's experimental taint APIs, where enabled, add a second guard against passing specific objects or values to the client.
- React's `cache()` memoizes per request only. It is not a cross-request cache and is safe for per-user data.

## 4. Server Actions: the security checklist

```ts
"use server";
const DeletePostInput = z.object({ postId: z.string().uuid() });

export async function deletePost(input: unknown) {
  const viewer = await requireViewer();                        // 1. authenticate
  const { postId } = DeletePostInput.parse(input);             // 2. validate the shape
  const post = await postsDal.findById(postId);
  if (!post || post.authorId !== viewer.id) throw new ForbiddenError(); // 3. authorize this object
  await postsDal.softDelete(postId);                           // 4. act (idempotent where possible)
  revalidateTag(`post:${postId}`);                             // 5. refresh caches
  return { ok: true as const };                                // 6. minimal result
}
```

MUST for every action:
- [ ] Authenticates inside the action. Page-level or middleware checks do not protect the endpoint.
- [ ] Validates every argument with a schema. TypeScript types do not exist at runtime.
- [ ] Authorizes the specific object (ownership, tenant, role), not just "is logged in".
- [ ] Ignores client-supplied identity (`userId`, `orgId`, `role` in form data); derives it from the session.
- [ ] Returns a minimal result; no raw rows, stack traces, or internal messages.
- [ ] Is rate-limited when expensive (LLM calls, email, exports) or abusable (login, invites).
- [ ] Uses an idempotency key for payments and other non-repeatable effects.
- [ ] Does not capture secrets in inline actions' closures. Captured values round-trip through the client; frameworks may encrypt them, but do not rely on that.

Expected failures (validation, conflict, not allowed) return typed results the form can render; unexpected faults throw and are logged with a trace ID.

## 5. The React2Shell lesson and patch policy

CVE-2025-55182 ("React2Shell", CVSS 10.0) was a pre-authentication remote code execution caused by unsafe deserialization in the RSC "Flight" protocol that carries Server Function calls. Fixed versions of the `react-server-dom-*` packages are 19.0.1, 19.1.2, and 19.2.1 or later; frameworks that bundle RSC shipped their own patched releases. It was added to CISA's Known Exploited Vulnerabilities catalog in December 2025.

What it teaches:
- **The framework's protocol is attack surface.** A perfectly written action could not prevent it. Only upgrading could.
- **Patch fast.** Enable automated dependency updates (Dependabot, Renovate) with security updates fast-tracked; treat critical framework advisories as incidents, measured in days.
- **Know what is deployed.** Check the resolved version of transitive packages (`npm ls react-server-dom-webpack`, or the equivalent for your package manager and bundler) and verify the deployed build, not only the lockfile.
- **WAF rules are a stopgap**, not a fix.

## 6. Fetching and streaming

```tsx
async function InvoicePage({ id }: { id: string }) {
  // Start independent work together; await only what the shell needs.
  const [invoice, customer] = await Promise.all([getInvoice(id), getCustomerForInvoice(id)]);
  if (!invoice) notFound();
  const activity = getActivity(id); // not awaited: streams in below

  return (
    <>
      <InvoiceHeader invoice={invoice} customer={customer} />
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityList activity={activity} /> {/* awaits it (server) or reads it with use() (client) */}
      </Suspense>
    </>
  );
}
```

- Sibling async Server Components fetch in parallel; a parent awaiting before rendering children serializes them.
- Place Suspense boundaries at regions with independent latency, with skeletons matching the final layout.
- Once streaming starts, the HTTP status is already sent. Decide not-found and redirects before the first `await` that can stream, or handle them in the route's loading/error conventions.
- Errors thrown inside a streamed region are caught by the nearest error boundary; give independent regions their own.

## 7. Caching and revalidation

- Treat cache design as part of the data model: tag data by entity (`invoice:123`, `org:9:invoices`) and revalidate those tags in the action that mutates them.
- Per-user data must be rendered dynamically or cached privately, never in a shared static or fetch cache.
- Framework caching defaults have changed across major versions. Read the installed version's documentation before assuming what is cached.

## 8. Review checklist

- [ ] `"use client"` only on interactive leaves; no client directive on pages or layouts without reason.
- [ ] No server → client prop contains a raw DB row, secret, token, or internal ID the UI does not need.
- [ ] DAL files import `server-only`; queries are scoped to the viewer.
- [ ] Every Server Action passes the §4 checklist.
- [ ] No sequential awaits of independent data; Suspense boundaries at region level.
- [ ] Cache tags revalidated on mutation; no per-user data in shared caches.
- [ ] React, `react-server-dom-*`, and the framework are on patched versions; automated security updates enabled.

## Sources

- Next.js, "How to Think About Security in Next.js": https://nextjs.org/blog/security-nextjs-server-components-actions
- React docs, `"use client"` and serializable types: https://react.dev/reference/rsc/use-client ; `"use server"`: https://react.dev/reference/rsc/use-server ; `cache`: https://react.dev/reference/react/cache
- Microsoft Security, "Defending against CVE-2025-55182 (React2Shell)": https://www.microsoft.com/en-us/security/blog/2025/12/15/defending-against-the-cve-2025-55182-react2shell-vulnerability-in-react-server-components/
- Vercel React2Shell bulletin: https://vercel.com/kb/bulletin/react2shell
- OWASP API Security Top 10 (2023), API1 Broken Object Level Authorization: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
