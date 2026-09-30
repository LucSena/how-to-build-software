# Agents, tools, and workflows

Choosing between a workflow and an agent, designing tools, bounding the loop, making runs durable, and integrating MCP safely.

## Contents

1. Workflow or agent?
2. Workflow patterns
3. Tool design rules
4. The bounded agent loop
5. Durable execution and idempotency
6. Context engineering
7. MCP and multi-agent systems

## 1. Workflow or agent?

- **Workflow**: LLM calls and tools orchestrated through code paths you wrote. Predictable, testable, cheaper.
- **Agent**: the LLM decides its own next step and which tools to call, in a loop, until done.

Use an agent only when the steps cannot be predicted in advance, the task is valuable enough to absorb extra cost and latency, and mistakes are recoverable or gated by approval. Everything else is a workflow. When in doubt, write the workflow and let the model choose among a few branches (routing), not everything.

## 2. Workflow patterns

| Pattern | Shape | Use when |
|---|---|---|
| Prompt chaining | Step A → programmatic check → step B | A task splits cleanly into fixed stages (outline → check → draft) |
| Routing | Classifier sends input to a specialized prompt or model | Distinct input types; send easy ones to a cheap model |
| Parallelization: sectioning | Independent subtasks run concurrently, results merged | Subtasks do not depend on each other (check policy + extract fields) |
| Parallelization: voting | Same task run several times, results aggregated | Higher confidence needed on a judgment (moderation, risky classification) |
| Orchestrator–workers | A model plans subtasks at runtime; workers execute; the orchestrator merges | Subtasks cannot be listed in advance (multi-file code change, research) |
| Evaluator–optimizer | Generator drafts, evaluator critiques against criteria, loop | Clear evaluation criteria and measurable gains from iteration (translation, constrained writing) |

## 3. Tool design rules

### Make each tool narrow and obvious
**Rule.** One tool does one job, with a verb-first name, a description that says when to use it, and typed parameters with descriptions.
**Apply when.** Defining any tool or function schema.
**Do / Avoid.** Do: `search_invoices(customer_id, status, limit)`. Avoid: `database(query: string)`.
**Why.** The model selects tools from names and descriptions; vague or overlapping tools cause wrong calls and wasted steps.

### Return concise, structured results with actionable errors
**Rule.** Return only the fields the model needs, paginated or truncated with a note; errors say what went wrong and how to retry.
**Apply when.** Any tool whose output could be large (search, file reads, logs).
**Do / Avoid.** Do: `{"error": "customer_id not found; call search_customers first"}`. Avoid: a 40 KB raw JSON dump or a stack trace.
**Why.** Every returned token costs money and context; clear errors let the model self-correct instead of looping.

### Enforce the user's permissions inside the tool
**Rule.** The tool receives the end user's identity from the server session and applies the same authorization as the app's API.
**Apply when.** Every tool that reads or writes user or tenant data.
**Do / Avoid.** Do: `listDocuments(ctx.user, filters)` scoped by tenant and ACL. Avoid: a tool backed by an admin service account "because the prompt says to stay in scope".
**Why.** The model is not an authorization boundary; prompt injection can make it request anything its tools allow (excessive agency).

### Separate reads from writes and gate side effects
**Rule.** Read tools run freely; write tools are distinct, take idempotency keys, and irreversible or external effects require explicit human approval.
**Apply when.** Tools that send, pay, delete, publish, change permissions, or call third parties.
**Do / Avoid.** Do: `draft_email` (auto) + `send_email` (approval shows recipients and body). Avoid: one `email(action="draft"|"send")` tool that auto-sends.
**Why.** Approval turns a hijacked or mistaken plan into a visible proposal instead of an incident.

## 4. The bounded agent loop

```ts
type Limits = { maxSteps: number; maxCostUsd: number; deadlineMs: number };

async function runAgent(task: Task, user: User, limits: Limits): Promise<AgentResult> {
  const deadline = Date.now() + limits.deadlineMs;
  const seen = new Map<string, number>(); // repeated identical tool calls
  let cost = 0;
  let messages = initialMessages(task);

  for (let step = 0; step < limits.maxSteps; step++) {
    if (Date.now() > deadline) return partial(messages, "deadline");
    const res = await llm.call({ messages, tools, signal: AbortSignal.timeout(deadline - Date.now()) });
    cost += res.costUsd;
    trace.step(step, res); // model, tokens, cost, finish reason
    if (cost > limits.maxCostUsd) return partial(messages, "budget");
    if (res.done) return final(res);

    for (const call of res.toolCalls) {
      const key = `${call.name}:${stableStringify(call.args)}`;
      if ((seen.get(key) ?? 0) >= 2) return partial(messages, "loop detected");
      seen.set(key, (seen.get(key) ?? 0) + 1);
      if (requiresApproval(call)) return awaitApproval(call, messages); // pause, persist, resume later
      messages = append(messages, await executeTool(call, user));      // validated args, user-scoped
    }
    messages = compactIfLarge(messages); // summarize old steps into state, keep recent turns
  }
  return partial(messages, "max steps");
}
```

- Validate tool arguments with the tool's schema before executing; return the validation error to the model.
- A partial result names the limit hit and what was completed, so the UI can offer "continue" or "refine".
- Set limits from evals: the step count that successful runs need, plus headroom.

## 5. Durable execution and idempotency

- Runs longer than a request timeout, or runs that wait for human approval, are background jobs with persisted state (a durable execution engine such as Temporal, Restate, DBOS, or Inngest, or a framework checkpointer such as LangGraph's).
- A crash mid-run must resume from the last completed step, not restart, or side effects run twice. Every side-effecting tool takes an idempotency key derived from the run and step (`{runId}:{step}:{tool}`).
- Emit progress events (step started, tool called, waiting for approval, done) so the UI can show real status and the run can be observed.

## 6. Context engineering

- Give the model the minimum high-signal context: task, constraints, relevant state, and tool definitions. More context is not better; irrelevant text degrades accuracy and costs tokens.
- Keep durable memory outside the context window (database rows, files, a scratchpad) and load summaries, not transcripts.
- Truncate or paginate tool outputs; let the model ask for more.
- Keep the tool list stable within a run and ordered deterministically: changing tools mid-run breaks prompt caching and confuses the model.

## 7. MCP and multi-agent systems

**MCP (Model Context Protocol)** is the standard way to expose tools and resources to agents. Treat each MCP server as a privileged integration:
- Authenticate it (the MCP authorization spec uses OAuth 2.1 with PKCE and protected-resource metadata) and grant narrow scopes.
- Pin versions of third-party servers and review updates; a server can change its tool descriptions.
- Treat tool descriptions and results from third-party servers as untrusted: a malicious description can instruct the model (tool poisoning).
- Log every call with user, tool, arguments, and result size.

**Multi-agent** setups (several agents coordinating) multiply cost and failure modes. Use them only when subtasks are genuinely parallel and independent (broad research, large codebase search) and a single agent with good tools measurably underperforms.

## Sources

- Anthropic, "Building Effective Agents": https://www.anthropic.com/engineering/building-effective-agents
- Anthropic, "Writing effective tools for agents": https://www.anthropic.com/engineering/writing-tools-for-agents
- Model Context Protocol authorization specification: https://modelcontextprotocol.io/specification/latest/basic/authorization
- OWASP Top 10 for LLM Applications 2025 (LLM06 Excessive Agency): https://genai.owasp.org/llm-top-10/
- Durable execution overview: https://www.kai-waehner.de/blog/2025/06/05/the-rise-of-the-durable-execution-engine-temporal-restate-in-an-event-driven-architecture-apache-kafka/ ; https://www.dbos.dev/blog/postgres-is-all-you-need-for-durable-execution
