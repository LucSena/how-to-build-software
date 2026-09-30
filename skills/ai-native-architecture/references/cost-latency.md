# Cost and latency

How to estimate, measure, and reduce what LLM features cost and how long they take. Prices and model rankings change within months: read current provider pricing when estimating, and date any figure you write down.

## Contents

1. Unit economics
2. Latency anatomy
3. Levers
4. Prompt caching
5. Response and semantic caching
6. Routing and cascades
7. Budgets and limits
8. Measuring

## 1. Unit economics

Estimate cost per **task** (what the user experiences), not per call:

```
cost_per_task = Σ over calls in the task of
    uncached_input_tokens × input_price
  + cached_input_tokens   × cached_input_price
  + cache_write_tokens    × cache_write_price   (if the provider charges for writes)
  + output_tokens         × output_price
  (+ embedding, reranking, and tool/API costs)
```

Worked example with **made-up round prices** to show the arithmetic (not real rates): input $1.00, cached input $0.10, output $5.00 per million tokens. A support answer with 6,000 input tokens (5,000 of them cached) and 400 output tokens costs 1,000 × $1/M + 5,000 × $0.10/M + 400 × $5/M = $0.001 + $0.0005 + $0.002 = $0.0035. At 200 answers per user per month that is $0.70 per user per month; compare it with revenue per user. If the margin fails at current real prices, fix the design (fewer tokens, smaller model, caching) before launch.

Agents multiply everything: each step re-sends the growing context. A 10-step run can cost far more than 10× a single call unless the context is compacted and cached.

## 2. Latency anatomy

```
total ≈ queueing + time to first token (TTFT) + output_tokens ÷ output_speed + retrieval + tool calls
```

- Typical hosted TTFT is roughly 0.3–2 s; full responses take seconds to minutes. Output length usually dominates total time, so capping output is the most direct latency lever.
- Perceived latency is what matters in UI: stream tokens, show steps, and render the first useful piece early (see `ai-interface-design`).
- Sequential steps add up: a three-call chain at 2 s each is 6 s. Parallelize independent calls and tool executions.

## 3. Levers

| Lever | Cuts cost | Cuts latency | Risk / cost of using it |
|---|---|---|---|
| Smaller model for easy traffic (routing/cascade) | High | High | Quality drop on misrouted inputs; needs evals per route |
| Prompt caching of stable prefix | High on repeated prefixes | Medium (lower TTFT) | Requires strict prompt ordering; write premium on some providers |
| Fewer, better retrieved chunks (rerank) | Medium | Medium | Recall loss if k is too low; measure recall@k |
| Cap output length; ask for concise formats | Medium | High | Truncated answers; detect the length finish reason |
| Batch APIs for offline work | High (commonly about half price) | None (hours of delay) | Only for non-interactive jobs |
| Exact-match response cache | High on repeats | High | Staleness; key must include prompt and model versions |
| Semantic cache | Variable | High | Wrong answers on near-miss matches; tenant leaks if mis-keyed |
| Parallel tool calls and sections | None | High | More concurrent load; rate limits |
| Precompute / prefetch (summaries at ingest, speculative calls) | Shifts cost | High | Wasted work on unused results |
| Compact agent context (summarize old steps) | High for long runs | Medium | Lost detail; keep key facts in structured state |
| Self-hosted open-weight model | Depends on volume | Depends | Operations, GPUs, quality gap; only at sustained high volume or for data control |

## 4. Prompt caching

Provider-side prompt caching reuses the processed prefix of a prompt. Rules that hold across providers:
- **Byte-identical prefix**: a single differing byte (a timestamp, reordered JSON keys, a changed tool list) invalidates the cache from that point on.
- **Order by stability**: tools and system instructions → long reference documents → few-shot examples → conversation history → the new user message. Per-request data goes last.
- **Serialize deterministically**: sort tool definitions and JSON keys; do not inject dates or request IDs into the system prompt.
- **Same model**: caches are scoped to a model; switching models mid-conversation starts cold.
- **Minimum length and lifetime**: prefixes below a provider-specific minimum are not cached, and entries expire after a short idle time unless extended. Check the provider's docs.
- **Write cost**: some providers charge a premium to write an entry. Caching a prefix that is never reused is a surcharge; verify hit rates from the usage fields in responses.

## 5. Response and semantic caching

- **Exact-match cache**: key = hash(normalized input, prompt version, model version, relevant parameters, tenant, locale). Use it for deterministic tasks such as extraction and classification of repeated documents.
- **Semantic cache** (embedding similarity on the question): only for non-personalized, slowly changing answers, such as public FAQs.
  - Key by tenant, locale, and permission scope; never share across tenants.
  - Set a similarity threshold from labeled pairs and measure the false-hit rate; "cancel my order" and "cancel my subscription" are close in embedding space.
  - Short TTL and invalidation when the source content changes.
  - Do not cache answers that depend on the user's data, time, or account state.

## 6. Routing and cascades

- **Router**: a cheap classifier (rules, small model, or embeddings) sends each request to the smallest model that passes evals for that input type.
- **Cascade**: try the small model; if validation fails or confidence is low, escalate to a larger one. Works when failure is detectable (schema errors, failed checks, abstentions).
- Evaluate each route separately; track the share of traffic per route and its cost.

## 7. Budgets and limits

- Per request: max input size, max output tokens, max steps, wall-clock timeout.
- Per user and tenant: token or cost budgets per day or month, alerts at thresholds, and a clear UI state when a limit is reached.
- Rate limits by tokens or cost, not only by request count; separate limits for expensive endpoints.
- A kill switch per AI feature to disable it or fall back to a cheaper mode during incidents or cost spikes.

## 8. Measuring

Record per call: model and version, prompt version, input/cached/output tokens, cost, TTFT, total latency, finish reason, cache hit, retries. Aggregate per feature, tenant, and user; watch p50/p95 latency and cost per task over time. Re-run the numbers whenever a model, prompt, or retrieval setting changes. OpenTelemetry GenAI semantic conventions (`gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, and related) were still in Development status as of 2026-09; pin the version you adopt.

## Sources

- Anthropic prompt caching documentation: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- Anthropic, "Building Effective Agents" (routing, parallelization): https://www.anthropic.com/engineering/building-effective-agents
- LLM gateway architecture reference (2026): https://www.digitalapplied.com/blog/llm-gateway-architecture-2026-engineering-reference
- LLM application architecture guide (2026): https://mlflow.org/articles/llm-application-architecture-a-2026-engineers-guide/
- OpenTelemetry GenAI observability (2026): https://opentelemetry.io/blog/2026/genai-observability/
- OWASP Top 10 for LLM Applications 2025, LLM10 Unbounded Consumption: https://genai.owasp.org/llm-top-10/
