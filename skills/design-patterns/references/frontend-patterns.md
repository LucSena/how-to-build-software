# Frontend Patterns (React-first, portable ideas)

Examples use React because it dominates, but the ideas map to Vue composables, Svelte runes, SwiftUI, and Jetpack Compose. Follow the project's existing state library and component conventions first. For rendering strategy, routing, and folder structure, see `frontend-architecture`.

## Contents
1. Component API: composition over configuration
2. Compound components
3. Headless components
4. Custom hooks
5. Derive, don't sync (effects)
6. Where state lives
7. State machines for flows
8. Server and client components
9. Memoization and the React Compiler
10. Legacy patterns and what replaced them

## 1. Component API: composition over configuration

**Rule.** Let callers compose children and slots instead of adding a prop for every variation.
**Apply when.** A component has grown past ~7–10 props, or boolean props combine (`showHeader`, `compact`, `withIcon`, `iconLeft`).
**Do / Avoid.** Do: `<Card><Card.Header>…</Card.Header><Card.Body>…</Card.Body></Card>` or `<Dialog title={<h2>…</h2>} footer={<Actions/>}>`. Avoid: `<Card showHeader headerIcon="x" headerAlign="left" bodyPadding="sm" …/>`.
**Why.** Each boolean doubles the state space; composition moves variation to the caller, where it's visible.

Variants that are genuinely design-system choices (`variant="primary" | "secondary"`, `size="sm" | "md"`) are fine as enum props — see `design-systems`.

## 2. Compound components

**Rule.** For components with coordinated parts (tabs, menus, accordions, selects), expose parts that share state through context.
**Apply when.** Callers need to arrange, style, or omit parts while behavior stays coordinated.
**Do / Avoid.** Do:
```tsx
<Tabs defaultValue="billing">
  <Tabs.List><Tabs.Trigger value="billing">Billing</Tabs.Trigger></Tabs.List>
  <Tabs.Panel value="billing"><BillingForm/></Tabs.Panel>
</Tabs>
```
Avoid: `<Tabs items={[{ label, content, disabled, icon, badge }]} />` that grows a new field per request.
**Why.** Parts stay independently composable; the parent owns the shared state once.
**When not.** Simple, fixed-layout components — a single component with a few props is clearer.

## 3. Headless components

**Rule.** Use headless primitives for behavior and accessibility; apply your design system's styling on top.
**Apply when.** Menus, dialogs, comboboxes, popovers, tabs, tooltips, date pickers, data tables.
**Do / Avoid.** Do: build on Radix, React Aria, Ark UI, Headless UI, or TanStack Table (whichever the project uses). Avoid: hand-rolling focus traps, roving tabindex, and ARIA for a combobox.
**Why.** Keyboard, focus, and screen-reader behavior is where hand-built widgets fail; see `accessibility`.

## 4. Custom hooks

**Rule.** Extract reusable stateful logic into `useX` hooks, one concern each, returning a small API.
**Apply when.** The same state + effect logic appears in ≥ 2 components, or a component's logic obscures its markup.
**Do / Avoid.** Do: `useDebouncedValue(value, 300)`, `useOnlineStatus()`. Avoid: `useEverything()` returning 15 values; hooks that fetch server data by hand when a data library is available.
**Why.** Hooks are the unit of reuse for behavior; small ones compose.

## 5. Derive, don't sync (effects)

**Rule.** Compute derived values during render; use effects only to synchronize with systems outside React (subscriptions, DOM APIs, non-React widgets, analytics on mount).
**Apply when.** Tempted to write `useEffect(() => setX(f(y)), [y])`.
**Do / Avoid.** Do: `const visible = items.filter(matches(query))`. Reset state on identity change with a `key` prop. Handle user-caused updates in event handlers. Avoid: syncing props into state; chains of effects setting state; fetching in an effect without cancellation (race conditions when inputs change quickly).
**Why.** Extra state causes extra renders and stale or inconsistent UI ("You Might Not Need an Effect", react.dev).

## 6. Where state lives

| Kind of state | Default home | Avoid |
|---|---|---|
| Server data (lists, entities) | Data-fetching cache: TanStack Query, SWR, RTK Query, Apollo/urql — or server components | Copying server data into a global client store |
| Shareable view state (filters, sort, page, selected tab) | URL search params | Local state that is lost on refresh/share |
| Form state | Form library (React Hook Form, TanStack Form) or native form + server action | Hand-wiring 20 `useState`s |
| Local UI state (open/closed, hover, input draft) | `useState` in the component that owns it | Global store |
| Cross-cutting client state (theme, auth session, cart) | Context or a small store (Zustand, Jotai) | Redux-scale machinery for three values |

**Colocate** state, styles, and tests with the component that uses them; lift state only when a second consumer appears. Context is for low-frequency values; frequently changing values in context re-render every consumer — use a store with selectors instead.

## 7. State machines for flows

**Rule.** Model multi-step or multi-status UI (checkout, upload, onboarding wizard, auth, payment) as a finite state machine.
**Apply when.** ≥ 3 states with guarded transitions, or bugs from contradictory booleans (`isSubmitting && isError`).
**Do / Avoid.** Do: a `useReducer` with a discriminated-union state and event type; XState (or similar) for nested/parallel states, timers, or when a visual chart helps. Avoid: `isLoading`, `isError`, `isSuccess`, `isRetrying` as separate booleans.
**Why.** Impossible states become unrepresentable, and every state has an explicit UI (loading, empty, error, partial — see `interaction-design`).
**When not.** A toggle or a single request — a data library's status already models it.

## 8. Server and client components

Applies to React Server Components frameworks (Next.js App Router and others).

- **Server by default.** Mark `"use client"` only at interactive leaves (inputs, menus, charts with interaction). Pass serializable props across the boundary.
- **Fetch where the data is used**, in server components, and start independent requests in parallel (`Promise.all`); stream slow parts with `<Suspense>` to avoid waterfalls.
- **Never pass secrets or raw DB rows to client components** — everything passed is serialized to the browser. Map to DTOs in a server-only data-access layer (`import "server-only"`).
- **Server actions/functions are public HTTP endpoints.** Each one authenticates, authorizes (ownership), and validates input with a schema. Never trust hidden form fields or client-side checks.
- **Keep the framework patched.** The RSC protocol is attack surface (CVE-2025-55182, "React2Shell", was a critical pre-auth RCE in React Server Components' deserialization, fixed in patched react-server-dom packages in Dec 2025).

## 9. Memoization and the React Compiler

- Where the React Compiler (stable since v1.0, October 2025) is enabled, it memoizes automatically. Don't add `useMemo`, `useCallback`, or `React.memo` by reflex.
- Without the compiler, memoize after profiling shows a problem: expensive computations, or stable identities for props of memoized children.
- Premature memoization adds dependency-array bugs and noise.

## 10. Legacy patterns and what replaced them

| Pattern | Status | Use instead |
|---|---|---|
| Container/presentational split by folder | Superseded | Hooks for logic; colocate |
| Higher-order components (HOCs) | Legacy; still in some libraries | Custom hooks |
| Render props | Occasional (headless libraries, virtualization) | Hooks or compound components |
| Class components with lifecycle methods | Legacy | Function components + hooks; keep class error boundaries or use a small library |
| Global Redux store for everything | Overkill for most apps | Data-fetching cache + small client store |
| Prop drilling through 4+ levels | Smell | Composition (pass elements), context, or colocated state |

## Sources

- react.dev, "You Might Not Need an Effect": https://react.dev/learn/you-might-not-need-an-effect
- react.dev, "Choosing the State Structure": https://react.dev/learn/choosing-the-state-structure
- React Compiler v1.0 announcement: https://react.dev/blog/2025/10/07/react-compiler-1
- Next.js security guide for server components and actions: https://nextjs.org/blog/security-nextjs-server-components-actions
- React2Shell (CVE-2025-55182): https://vercel.com/kb/bulletin/react2shell ; https://www.microsoft.com/en-us/security/blog/2025/12/15/defending-against-the-cve-2025-55182-react2shell-vulnerability-in-react-server-components/
- Radix Primitives: https://www.radix-ui.com/primitives ; React Aria: https://react-spectrum.adobe.com/react-aria/
- TanStack Query: https://tanstack.com/query/latest ; XState: https://stately.ai/docs/xstate
- Kent C. Dodds, compound components: https://kentcdodds.com/blog/compound-components-with-react-hooks
