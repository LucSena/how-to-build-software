# State management

Where each kind of state lives, which tool owns it, and the code shapes that avoid the usual bugs. Examples use React and TypeScript; the ownership rules apply equally to Vue, Svelte, and Solid.

## Contents

1. Ownership rules (catalog)
2. Server state: queries, mutations, optimistic updates
3. URL state
4. Forms with one shared schema
5. Client state: local, shared, machines
6. Choosing a library

## 1. Ownership rules

### Give server data to a cache, not a store
**Rule.** Data that lives in a database is read through RSC/loaders or a query cache (TanStack Query, SWR, Apollo/urql for GraphQL), never copied into Redux, Zustand, or Context.
**Apply when.** Any list, record, or profile fetched from an API.
**Do / Avoid.** Do: `useQuery({ queryKey: ["invoice", id], queryFn })`. Avoid: `useEffect(() => fetch(...).then(setInvoices))` plus `store.setInvoices(...)`.
**Why.** Two sources of truth drift; the cache already handles dedupe, staleness, refetch on focus, and invalidation.

### Put shareable view state in the URL
**Rule.** Filters, sort, search, tab, page, and the selected item live in search or route params, parsed with a schema.
**Apply when.** A user would expect Back, refresh, or a copied link to restore the view.
**Do / Avoid.** Do: `/invoices?status=overdue&page=2`. Avoid: `const [status, setStatus] = useState("all")` on a list page.
**Why.** The URL is the only state the browser persists, shares, and navigates for free (recognition over recall; deep links).

### Derive instead of synchronizing
**Rule.** Compute values from existing state during render; do not store them.
**Apply when.** Totals, filtered/sorted lists, "is valid", "has changes".
**Do / Avoid.** Do: `const visible = todos.filter(matches(query))`. Avoid: `useEffect(() => setVisible(todos.filter(...)), [todos, query])`.
**Why.** Mirrored state renders twice and goes stale on the render in between ("You Might Not Need an Effect", react.dev). With React Compiler enabled, expensive derivations are memoized automatically.

### Colocate, then lift only when shared
**Rule.** Start state in the component that uses it; lift to the nearest common parent when a second consumer appears; reach for a store only when prop passing spans many layers or updates are frequent.
**Apply when.** Adding any `useState`.
**Do / Avoid.** Do: dialog `open` inside the dialog trigger component. Avoid: `ui.dialogs.invoiceEditOpen` in a global store.
**Why.** Global state widens the blast radius of every change and re-renders unrelated trees.

### Model multi-step flows as explicit states
**Rule.** Use a discriminated union with a reducer, or a statechart library (XState), for flows with three or more states and guarded transitions.
**Apply when.** Checkout, upload, onboarding wizard, payment, connection status.
**Do / Avoid.** Do: `{ status: "uploading", progress } | { status: "failed", error }`. Avoid: `isLoading`, `isError`, `isDone` booleans that can all be true.
**Why.** Impossible states become unrepresentable, so the UI cannot show a spinner and an error at once.

## 2. Server state

```ts
// Query keys are hierarchical: invalidating ["invoices"] refreshes every invoice list.
const invoiceKeys = {
  all: ["invoices"] as const,
  list: (filters: Filters) => ["invoices", "list", filters] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
};

// Optimistic update with rollback (TanStack Query v5 shape).
const markPaid = useMutation({
  mutationFn: (id: string) => api.markPaid(id),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: invoiceKeys.detail(id) });
    const previous = queryClient.getQueryData<Invoice>(invoiceKeys.detail(id));
    queryClient.setQueryData<Invoice>(invoiceKeys.detail(id), (old) =>
      old ? { ...old, status: "paid" } : old,
    );
    return { previous };
  },
  onError: (_err, id, ctx) => {
    queryClient.setQueryData(invoiceKeys.detail(id), ctx?.previous); // roll back
    toast.error("Couldn't mark as paid. Try again.");
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
});
```

Rules:
- Optimistic updates only where success is very likely (toggle, rename, reorder, mark done). For payments or anything with server-side rules the client cannot predict, show pending and wait.
- Configure `staleTime` deliberately; the default of refetching often suits dashboards but wastes requests for reference data.
- With RSC or loaders, reads on navigation come from the server; use the client cache for polling, infinite lists, and client-driven mutations. Do not fetch the same data both ways on one screen.
- Every fetch has an abort path: the query library passes a `signal`; forward it to `fetch`.

## 3. URL state

```ts
const FiltersSchema = z.object({
  status: z.enum(["all", "open", "overdue", "paid"]).catch("all"),
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().max(100).catch(""),
});

const [params, setParams] = useSearchParams();
const filters = FiltersSchema.parse(Object.fromEntries(params));
// Update with replace for typing, push for deliberate navigation (page change).
```

- Parse with fallbacks (`.catch`) so a hand-edited URL never crashes the page.
- Use history `replace` for keystroke-level changes (search box) and `push` for steps a user would want Back to undo.
- Typed helpers exist per router (TanStack Router search schemas, nuqs for Next.js); use the one that matches the router in use.
- Do not put secrets or large blobs in the URL; IDs and small enums only.

## 4. Forms with one shared schema

```ts
// features/invoices/schema.ts — imported by client and server
export const InvoiceInput = z.object({
  customerId: z.string().uuid(),
  amountCents: z.coerce.number().int().positive(),
  dueDate: z.coerce.date(),
});

// features/invoices/actions.ts
"use server";
export async function createInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();                                  // authenticate
  const parsed = InvoiceInput.safeParse(Object.fromEntries(formData)); // validate
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  await assertCanBillCustomer(user, parsed.data.customerId);           // authorize
  const invoice = await invoicesDal.create(user.orgId, parsed.data);
  revalidateTag(`org:${user.orgId}:invoices`);
  return { ok: true, id: invoice.id };
}

// Client component
const [state, formAction, pending] = useActionState(createInvoice, { ok: false });
```

- The same schema powers client validation (on blur, then on input once a field is in error) and server validation.
- Server errors come back as field-keyed messages and render next to fields; the form keeps the user's input.
- `pending` disables the submit button and shows progress without changing its size.
- For forms without server actions, use a form library with a schema resolver and submit to an API that validates with the same schema.

## 5. Client state

| Need | Default | Watch out |
|---|---|---|
| One component | `useState` / `useReducer` | — |
| A subtree, rarely changes (theme, locale, current user) | Context | Every consumer re-renders on change; split contexts by update frequency |
| Many components, frequent updates (editor selection, canvas, player) | Small store with selectors (Zustand, Jotai, Valtio; Pinia in Vue; stores in Svelte) | Select narrow slices; do not store server data here |
| Survives reload, per device | `localStorage` wrapped in try/catch, versioned key | Private mode and quota errors; never the only copy of user work |
| Survives devices, collaborative | Sync engine / CRDT (see rendering-strategies) | Conflict rules and permissions |

## 6. Choosing a library

1. If the codebase already has one for this kind of state, use it.
2. Server state: RSC/loaders for navigation reads; TanStack Query or SWR for client caching; GraphQL clients only when the API is GraphQL.
3. Client state: built-in hooks first; a small store only when the table above says so. Redux Toolkit remains reasonable in codebases that already use it; do not introduce it for new small apps.
4. Forms: native form + action for simple forms; a form library for complex dynamic forms (field arrays, wizards).

## Sources

- React docs, "You Might Not Need an Effect": https://react.dev/learn/you-might-not-need-an-effect
- React docs, `useActionState`: https://react.dev/reference/react/useActionState
- TanStack Query optimistic updates: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- Vercel Web Interface Guidelines (URL as state, optimistic updates): https://github.com/vercel-labs/web-interface-guidelines
- Baymard inline validation: https://baymard.com/blog/inline-form-validation
- Alexis King, "Parse, don't validate": https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
