# Generative UI

Rendering interface components from model output: when it helps, the three levels of freedom, how to render safely, and the emerging protocols. Production systems in 2025–26 lean toward constrained output (the model picks from your components) for safety, consistency, and accessibility.

## Contents

1. When to use it
2. Three levels
3. Level 1: tool call → component
4. Level 2: declarative specs
5. Level 3: model-written UI in a sandbox
6. Streaming and interaction
7. Protocols: AG-UI and A2UI
8. Quality checklist

## 1. When to use it

Use generative UI when the answer is naturally structured and the user will act on it: a comparison (table), a trend (chart), a record (card with actions), a set of choices (options to pick), or missing parameters (a small form). Keep prose for explanation and nuance. A component that just decorates text adds latency and noise.

This is the practical core of "dynamic software interfaces" (listed in Y Combinator's Summer 2026 Requests for Startups): the interface adapts to the request, but it is still made of designed, accessible, tested parts.

## 2. Three levels

| Level | What the model produces | Strengths | Risks | Default use |
|---|---|---|---|---|
| 1. Static | A tool call with data; your code maps it to a pre-built component | Full design and accessibility control; easy to test | Limited to components you built | **Default** for product UIs |
| 2. Declarative | A constrained UI spec (layout + allow-listed widgets + data) rendered by your renderer | Flexible layouts without arbitrary code | Spec validation, versioning, layout quality varies | Dashboards, forms, and cards assembled per request |
| 3. Open-ended | UI code (HTML/JS/components) | Anything is possible | Security, inconsistency, accessibility gaps | Prototyping and artifact tools only, inside a sandbox |

## 3. Level 1: tool call → component

```tsx
const registry = {
  show_invoice_table: { schema: InvoiceTableProps, Component: InvoiceTable },
  show_revenue_chart: { schema: RevenueChartProps, Component: RevenueChart },
  ask_missing_fields: { schema: MissingFieldsFormProps, Component: MissingFieldsForm },
} as const;

function RenderToolResult({ name, args }: { name: string; args: unknown }) {
  const entry = registry[name as keyof typeof registry];
  if (!entry) return <FallbackText value={args} />;          // unknown component → text
  const parsed = entry.schema.safeParse(args);
  if (!parsed.success) {
    reportRenderFailure(name, parsed.error);                  // feeds evals
    return <FallbackText value={args} />;
  }
  const { Component } = entry;
  return <Component {...parsed.data} />;
}
```

- Every component has a schema (Zod or equivalent); props are validated before render, with a text fallback.
- Data in props comes from your backend (IDs resolved server-side), not invented by the model. The model chooses *what* to show; the server supplies *the values* where accuracy matters (prices, totals, statuses).
- Components use design-system tokens and include their own loading, empty, and error states.
- Buttons in generated components trigger normal app actions with normal authorization and, for side effects, the normal approval flow.

## 4. Level 2: declarative specs

- The spec references only allow-listed widget types and a fixed set of layout primitives (stack, grid, tabs). Unknown types are dropped and logged.
- Validate the whole spec against a versioned schema; include the spec version in every message so old conversations still render after upgrades.
- Constrain layout: maximum nesting depth, maximum widgets per view, and responsive rules owned by the renderer, not the model.
- Text in specs is rendered as text (escaped), never as HTML.
- Actions in the spec are named intents (`"action": "approve_invoice", "invoiceId": "…"`) that map to your handlers; the model cannot define new behavior.

## 5. Level 3: model-written UI in a sandbox

- Render only inside a sandboxed iframe on an opaque origin: `sandbox="allow-scripts"` **without** `allow-same-origin`, so the code cannot read the parent's cookies, storage, or DOM.
- Add a restrictive Content Security Policy inside the frame (no network access except explicitly allowed hosts).
- Communicate through `postMessage` with a small, validated message schema; the parent never executes code or HTML received from the frame.
- No credentials, tokens, or user data beyond what the artifact needs are passed in.
- Label it as generated, provide "view source", and expect accessibility gaps; do not use this level for core product flows.

## 6. Streaming and interaction

- While a component's props are still streaming, show a skeleton with the component's final dimensions; render once props validate. Partial rendering of tables row by row is fine when rows validate individually.
- Reserve space so arriving components do not push the text the user is reading.
- User interactions with generated components (selecting a row, submitting a mini-form) return to the agent as **structured events** (`{ type: "row_selected", id }`), not as free text the model must re-parse.
- Keep component state in the app, synced to the agent as state updates, so a reload or reconnect restores what the user saw.

## 7. Protocols: AG-UI and A2UI

Both are emerging as of 2026-09. Adopt them behind your own adapter, pin versions, and check their maturity and ecosystem support before depending on them.

- **AG-UI** standardizes the event stream between an agent backend and a frontend: run lifecycle events, streaming text message events, tool-call events, and state snapshots/deltas. It is useful when several agent frameworks must drive one frontend, or one agent must drive several frontends.
- **A2UI** (from Google) is a declarative, JSONL-based widget specification the agent emits and the client renders from an allow-list of components: a standardized form of level 2.
- **MCP-based UI resources** and vendor SDKs (for example CopilotKit or AI SDK UI helpers) offer similar capabilities; the rules in §§3–6 apply whichever you choose.

## 8. Quality checklist

- [ ] The model chooses among allow-listed components; props are schema-validated with a text fallback.
- [ ] Values that must be exact come from the server, not from generated text.
- [ ] Components use design tokens and ship loading, empty, error, and disabled states.
- [ ] Generated actions go through normal authorization and approval flows.
- [ ] No model-generated HTML is inserted into the main document; open-ended code runs only in a sandboxed, opaque-origin iframe.
- [ ] Space is reserved while streaming; no layout jumps under the reader.
- [ ] Component choice and render failures are logged and included in evals.
- [ ] Keyboard and screen-reader behavior tested on each registered component.

## Sources

- CopilotKit, "The Developer's Guide to Generative UI in 2026": https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026
- Eleken, generative UI overview: https://www.eleken.co/blog-posts/generative-ui
- Awesome Generative UI list (A2UI, AG-UI, related projects): https://github.com/narrowin/awesome-generative-ui
- AG-UI protocol documentation: https://docs.ag-ui.com/
- MDN, iframe `sandbox` attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox
- Y Combinator Requests for Startups: https://www.ycombinator.com/rfs
