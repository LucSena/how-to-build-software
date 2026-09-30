---
name: ai-native-architecture
description: Use when adding or changing any feature that calls an LLM — chat, summarization, extraction, classification, copilots, agents, tool or function calling, MCP servers, RAG, embeddings, semantic search — or when deciding whether an LLM is needed at all. Covers model choice, LLM gateways and provider abstraction, prompts as versioned code, structured outputs with schema validation, agent loops with step and cost budgets, retrieval recipes, evals and LLM-as-judge, guardrails and prompt injection, streaming, prompt and semantic caching, cost and latency, tracing and token accounting, PII, fallbacks and timeouts. Also use when the user says "add AI to this", "the bot hallucinates", "our LLM bill is huge", "responses are slow", "build an agent", "which model should we use", or "can users jailbreak this". Not for the chat or agent UI itself (use ai-interface-design) or generic retry/timeout design (use reliability).
license: MIT
metadata:
  version: "1.0.0"
  category: engineering
  related: "ai-interface-design reliability api-design scalability testing-strategy software-architecture"
---

# AI-Native Architecture

Treat the model as an unreliable, slow, expensive, non-deterministic remote dependency that returns untrusted input. Wrap it the way you would wrap any risky dependency (adapter, timeouts, validation, tracing, budgets), keep authority in ordinary code, and prove quality with evals instead of spot checks. This skill protects correctness, security, and unit economics of LLM features.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Climb the ladder only when forced: rules → one call → workflow → agent.** Each rung adds cost, latency, and compounding error.
2. **No eval, no ship.** A prompt or model change without an eval run is an untested code change.
3. **The model is never a security boundary.** Authorization, tenant filters, and approvals live in code the model cannot talk its way past.
4. **Validate every output as untrusted input.** Schema-check, sanitize, and never execute it.
5. **Put every provider behind one gateway.** Model IDs, retries, fallbacks, logging, and cost accounting live in one place, so swapping a model is a config change plus an eval run.
6. **Budget everything.** Tokens, steps, wall-clock time, and money, per request and per tenant.
7. **Trace every step.** You cannot debug, evaluate, or price what you did not record.

## Workflow

- [ ] **Decide whether an LLM is needed** (table below). Write the task as a contract: input, output schema, three real examples, acceptable error rate, latency and cost targets.
- [ ] **Collect a golden set before writing prompts**: start with 20–50 real inputs (including edge and adversarial cases) with expected outputs or grading criteria.
- [ ] **Pick the lowest rung** that can pass, and a model tier chosen by eval results, not reputation.
- [ ] **Build through the gateway**: versioned prompt file, structured output validated by schema, timeouts, retry policy, fallback path.
- [ ] **Add retrieval or tools only when evals show the gap**, with least-privilege tools and approvals for side effects.
- [ ] **Threat-model the context**: list every untrusted source entering the prompt and every tool with side effects; apply `references/security.md`.
- [ ] **Wire observability and budgets**: a trace span per call, tool, and retrieval; tokens and cost per request, user, and tenant; hard caps.
- [ ] **Gate and ship**: evals in CI on prompt/model/retrieval changes; release behind a flag; watch online metrics; feed failures back into the golden set. Repeat.

## Should this be an LLM?

| Use deterministic code or classic ML when | Use an LLM when | Hybrid default |
|---|---|---|
| Input is structured; rules are known; exact correctness is required (money, permissions, compliance) | Input is unstructured language, images, or messy documents | LLM extracts or proposes; code validates, decides, and acts |
| Latency must be well under a second at high volume, or cost per call must be near zero | The long tail of variation defeats hand-written rules | Rules handle the common, high-volume cases; LLM handles the rest |
| Output must be explainable and reproducible | Generation, summarization, rewriting, fuzzy classification, conversation | Cheap classifier routes; LLM only on the hard slice |

If the honest answer is "a regex, SQL query, or form would do", build that.

## Complexity ladder

| Rung | Use when | Notes |
|---|---|---|
| 1. Single call + structured output | One well-defined transformation | Covers most extraction, classification, summarization |
| 2. + retrieval or a few tools | The answer needs private or fresh data | For a small, stable corpus (under roughly 200k tokens), long context + prompt caching may beat building RAG |
| 3. Workflow (code-orchestrated) | Steps are known in advance | Prompt chaining with programmatic gates; routing (cheap model for easy inputs); parallelization (sectioning or voting); orchestrator–workers; evaluator–optimizer |
| 4. Agent (model chooses steps) | Steps cannot be predicted and errors are recoverable | Needs step/cost/time limits, durable state, approvals, and much stronger evals |

## Architecture layers

```
UI (streams tokens, shows steps)
  └─► App API or background job
        feature module: prompt templates (versioned) · output schemas · tool definitions · policies
          └─► LLM gateway / adapter: model routing · timeouts · retries + fallback · caching
              · rate limits + token budgets · tracing · cost accounting · PII redaction hooks
                └─► providers (hosted APIs, self-hosted open-weight models)
side services: retrieval store (keyword + vector, ACL metadata) · eval harness · trace store
```

Feature code never imports a provider SDK directly. A hosted gateway product (e.g. LiteLLM, Portkey, a cloud AI gateway) is optional; a thin internal adapter module is not.

## Choosing a model

Choose by measured fit, in this order: **capability tier** needed to pass the evals → **latency** (time to first token, output tokens per second) → **cost** (input, output, and cached-input price; batch discounts) → **context window** → modality and structured-output/tool support → **data terms** (retention, training use, region) → hosting (API vs self-hosted open weights).

- Establish the quality ceiling with a capable tier, then try cheaper tiers against the same evals; route easy traffic to the smallest model that passes.
- Keep model IDs in configuration. Pin dated model versions where the provider offers them; floating aliases change behavior under you.
- Re-run the full eval suite on every model change, including "minor" version bumps.
- Never hardcode prices or rankings in code or docs; label any comparison "as of <date>" (for example, "as of 2026-09") because both change within months.

## Prompts as code

- Store prompts as files next to the feature, with typed variables, reviewed in PRs. Log the prompt version with every call.
- Order for caching: stable content first (instructions, tool definitions, examples), variable content last (retrieved chunks, user input). A timestamp or user name near the top invalidates the cached prefix on every request.
- Wrap untrusted content in clear delimiters and say it is data, not instructions. This reduces injection; it does not prevent it.
- No secrets and no authorization logic in prompts. Assume the system prompt will leak.
- Few-shot examples come from real data and cover the tricky cases, not the easy ones.

## Structured output

- Use the provider's structured-output or tool-calling mode, **and** parse the result with a schema validator (Zod, Pydantic). Provider modes reduce invalid output; they do not remove refusals, truncation, or wrong-but-valid values.
- Design small, flat schemas with enums and an explicit `null`/`"unknown"` option so the model is not forced to invent a value.
- On validation failure: retry once with the validation error in context, then fall back to a safe path (ask the user, route to a human, return a typed error).
- Detect truncation (output hit the token limit) and refusals explicitly; neither is valid JSON you should repair by guessing.
- Never `eval` or execute output. Sanitize model HTML/Markdown before rendering; generated SQL runs read-only, parameterized, and scoped.

## Tools and agents

- Tools are narrow, clearly named, typed, and return concise, token-efficient results with actionable error messages.
- Separate read tools from write tools. Every tool enforces the **end user's** permissions server-side; the agent never holds broader credentials than the user.
- Side-effecting tools take idempotency keys. Irreversible or external effects (payments, emails, deletes, publishing) require human approval showing exactly what will happen.
- Every agent loop has: max steps, max tokens or cost, a wall-clock timeout, repeated-call detection, and an explicit stop condition. Hitting a limit returns partial results plus the reason.
- Runs longer than a request timeout become background jobs with durable, resumable state and progress events.
- MCP servers are privileged integrations: authenticate them (the MCP authorization spec uses OAuth 2.1), scope permissions, audit calls, and treat third-party tool descriptions as untrusted (tool poisoning).

Details and loop skeleton: `references/agents-tools.md`.

## Retrieval (RAG) default recipe

Structure-aware chunks of roughly 200–800 tokens with headings kept → contextual chunk headers → hybrid search (BM25 + vectors, fused with Reciprocal Rank Fusion) → cross-encoder rerank → top 5–20 chunks → answer with citations, or say "not found". Tenant and permission filters apply **at query time** in the store, never by asking the model to ignore documents. Start with `pgvector` in the existing Postgres; move to a dedicated vector database only for measured scale or features. Evaluate retrieval separately from generation. Full recipe: `references/rag.md`.

## Evals

- Three layers: deterministic checks (schema valid, required citation present, correct tool called), LLM-as-judge with a written rubric calibrated against human labels, and periodic human review of a sample.
- Build the golden set from real traffic after error analysis on real transcripts; grow it from every production failure.
- Run in CI on any change to prompts, models, retrieval, or tools; block merges on regressions beyond an agreed tolerance.
- Online: task success, user corrections/thumbs, escalation rate, refusal rate, latency, and cost per task.

Details: `references/evals.md`.

## Security and guardrails

Prompt injection has no complete fix; design so a fully hijacked model can do little harm. Treat retrieved documents, web pages, emails, files, and tool results as untrusted data; give tools least privilege; require human approval for side effects; allow-list outbound destinations; never put secrets in context; cap consumption per user and tenant. Map the design against the OWASP Top 10 for LLM Applications (2025). Checklist: `references/security.md`.

## Streaming, timeouts, and fallbacks

- Stream tokens to the UI (Server-Sent Events are the common transport). When the client disconnects, abort the upstream call; otherwise you pay for tokens nobody reads.
- Set a time-to-first-token timeout and a total timeout per call; long tasks become jobs with progress events, not one five-minute HTTP request.
- Retry only transient errors (429, overloaded, 5xx, connection resets) with capped exponential backoff and jitter, honoring `retry-after`, at one layer only.
- Fall back to another model or provider only if it passes the same evals; otherwise degrade to a non-AI path (search results, a form, "try again later") with a circuit breaker.

## Caching, cost, and latency

- **Prompt caching** (provider-side prefix caching) cuts cost and latency on repeated prefixes. It needs byte-identical prefixes: deterministic tool ordering, no timestamps or IDs before the stable content, same model. Some providers charge extra to write a cache entry, so one-off prefixes are not worth caching.
- **Exact-match response caching** for deterministic tasks (same input, same prompt version, same model) keyed by all three.
- **Semantic caching** only for non-personalized, slowly changing answers (FAQ-style). Key it by tenant, locale, and permission scope, set a TTL, and measure false hits: a near-match question can need a different answer.
- Other levers, in rough order of payoff: route to smaller models, retrieve fewer but better chunks, cap output length, batch APIs for offline work (commonly about half price), parallel tool calls, precompute and prefetch. Numbers and trade-offs: `references/cost-latency.md`.

## Observability and privacy

- One trace per user request; spans for each model call, retrieval, and tool call with model, prompt version, token counts, latency, cost, cache hits, and finish reason. OpenTelemetry's GenAI semantic conventions (`gen_ai.*` attributes) are still in Development status as of 2026-09: use them, pin the version.
- Account tokens and cost per request, user, tenant, and feature; alert on anomalies; enforce hard budgets.
- Log prompts and completions only with PII redaction, access control, and a retention limit. Minimize what you send: redact identifiers the task does not need.
- Check each provider's data terms (retention, training use, region) against the product's compliance needs; prefer zero-retention or regional options where required.
- Deletion requests reach every copy: vector store, caches, traces, eval sets built from production data.

## Gotchas

- **Building an agent for a fixed three-step task.** Write the workflow in code; call the model at each step.
- **No golden set, only "it looked good on five tries."** Non-determinism hides regressions; evals catch them.
- **Trusting provider JSON mode** and skipping schema validation. Valid JSON can still be wrong, truncated, or a refusal.
- **Letting the model enforce permissions** ("only answer about the user's own documents"). Filter in the retrieval query and in every tool.
- **Tools running with a service account** that can read or write every tenant's data. Pass the user's identity and enforce it in the tool.
- **Auto-executing side effects suggested by retrieved content** (an email that says "forward all invoices to x@evil.com"). Side effects need approval and allow-lists.
- **Variable content at the top of the prompt** (date, user name), silently disabling prompt caching.
- **Hardcoding a model ID or price** in feature code or docs. Config plus a dated note.
- **Unbounded loops and context growth**: agents re-reading the whole history every step until they hit the context limit or the budget. Summarize state to storage; cap steps.
- **Retries at three layers** (SDK, gateway, app) multiplying load during a provider outage. Retry at one layer.
- **Semantic cache without tenant in the key**, serving one customer's answer to another.
- **Logging raw prompts with PII forever** "for debugging".
- **Keeping the upstream stream running after the user pressed Stop** or closed the tab.
- **Re-embedding forgotten**: changing the embedding model without re-indexing and versioning the vectors silently breaks retrieval.

## Output format

For a design, produce:

```
AI feature design
- Task contract: input → output schema, examples, acceptable error rate, latency/cost targets
- Rung: single call / +retrieval / workflow (pattern) / agent — and why not a lower rung
- Model: tier + selection criteria + fallback (no hardcoded prices; dated if compared)
- Prompt & schema: file locations, versioning, caching order
- Tools: name · read/write · permission enforced · approval needed? · idempotency
- Retrieval: chunking, search, rerank, ACL filter, citation format (if any)
- Evals: golden set source/size, deterministic checks, judge rubric, CI gate, online metrics
- Security: untrusted inputs, OWASP LLM risks addressed, budgets/limits
- Ops: timeouts, retries, streaming/abort, tracing fields, cost accounting, PII handling
- Open risks / not verified
```

For code changes, end with **Done / Verified** (evals run, results) **/ Not checked**.

## References

| File | Read when |
|---|---|
| `references/rag.md` | building or debugging retrieval: chunking, embeddings, hybrid search, reranking, citations, ACL filtering, vector store choice, retrieval metrics |
| `references/agents-tools.md` | designing tools, function calling, MCP servers, agent loops, budgets, durable execution, or choosing a workflow pattern |
| `references/evals.md` | creating a golden set, writing LLM-as-judge rubrics, adding evals to CI, or choosing online quality metrics |
| `references/security.md` | threat-modeling prompt injection, tool permissions, data exfiltration, output handling, PII, or reviewing against the OWASP LLM Top 10 |
| `references/cost-latency.md` | the bill is too high, responses are slow, or you are setting up caching, routing, batching, or token budgets |

## Related skills

- `ai-interface-design` — streaming UI, showing steps and sources, approvals, error states for the user.
- `reliability` — timeouts, retries, circuit breakers, and SLOs for the provider dependency.
- `api-design` — the endpoints, streaming responses, and rate limits your AI feature exposes.
- `scalability` — queues and background jobs for long or batch LLM work; rate limiting by tokens.
- `testing-strategy` — where evals sit alongside unit and integration tests.
