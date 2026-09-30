# Evals

Evals are the test suite for non-deterministic code. They decide which model to use, whether a prompt change ships, and whether production quality is drifting.

## Contents

1. Error analysis first
2. The golden set
3. Deterministic checks
4. LLM-as-judge
5. Evals in CI
6. Online evaluation
7. Tooling

## 1. Error analysis first

Before writing any metric, read real transcripts or outputs (from a prototype, a pilot, or production), tag each failure with a short label ("wrong date format", "missed second invoice", "invented policy"), and count the labels. Build evals for the failure types that are frequent or costly. Generic metrics chosen up front ("helpfulness 1–10") measure what is easy, not what is broken.

## 2. The golden set

- **Sources**: real user inputs (anonymized), known edge cases, past production failures, adversarial and injection attempts, and inputs that should produce "I don't know" or a refusal.
- **Size**: start with 20–50 cases so the loop is fast; grow it with every production failure. Keep separate slices (by input type, language, customer segment) so a regression in one slice is visible.
- **Labels**: an expected output where one exists (extraction, classification); otherwise grading criteria per case ("mentions the 30-day window; does not promise a refund").
- **Versioning**: store the set in the repo or an eval platform with versions; record which set version each result used.
- **Privacy**: production-derived cases go through PII redaction and follow deletion requests.

## 3. Deterministic checks (cheap, run on everything)

| Check | Example |
|---|---|
| Schema valid | Output parses against the Zod/Pydantic schema |
| Exact or normalized match | Extracted invoice total equals the label |
| Required elements | Answer contains at least one valid citation ID |
| Forbidden elements | No email addresses, no competitor names, no raw HTML |
| Tool behavior | Called `search_orders` before `refund_order`; never called a write tool without approval |
| Bounds | Output under N tokens; latency under the target; cost under the budget |
| Refusal correctness | Refuses the out-of-scope set; does not refuse the in-scope set |

## 4. LLM-as-judge

Use a model to grade what code cannot (faithfulness, tone, completeness), under these rules:
- **Write a rubric of binary, specific criteria** ("Every numeric claim appears in the context: yes/no") rather than a single 1–10 score. Binary criteria are more consistent and easier to calibrate.
- **Calibrate against humans**: label a sample by hand, run the judge on the same sample, and measure agreement. Revise the rubric until agreement is high, and re-check whenever the judge model or rubric changes.
- **Give the judge what it needs**: the input, the retrieved context, the output, and the reference answer if one exists.
- **Control known biases**: in pairwise comparisons, run both orders to cancel position bias; prefer a judge model different from the model being graded; do not reward length.
- **Ask for a short justification before the verdict** so failures are debuggable.
- Judges are models too: version their prompts and keep them in the repo.

## 5. Evals in CI

- Trigger on any change to prompts, model IDs or versions, retrieval (chunking, embeddings, ranking), tool definitions, or the judge.
- Run deterministic checks on the full set and judge evals on the full set or a stable sample; report per slice.
- **Gate** on agreed thresholds (for example, no slice drops more than a set number of points and no previously passing critical case fails). Record the baseline per model version.
- Handle non-determinism: run each case more than once for noisy tasks, or compare pass rates rather than individual outputs.
- Post results to the PR (pass rate per slice, diff of failing cases) so reviewers see quality changes like code changes.

## 6. Online evaluation

- **Implicit signals**: task completion, user edits to generated output, retries/regenerations, copy or accept rate, abandonment, escalation to a human.
- **Explicit signals**: thumbs up/down with an optional reason; sample and read them weekly.
- **Operational signals**: refusal rate, schema-failure rate, tool-error rate, latency percentiles, cost per task.
- **Sampled judging**: run the offline judge on a sample of production traffic to catch drift.
- **Change safely**: ship prompt or model changes behind a flag, compare against the control on the metrics above (A/B or shadow), then roll out.
- Every confirmed production failure becomes a golden-set case.

## 7. Tooling (examples, as of 2026-09)

Eval and tracing platforms: Langfuse, Arize Phoenix, Braintrust, LangSmith, Helicone, OpenLLMetry. RAG-specific metrics: RAGAS, DeepEval, TruLens. A plain test runner with a JSONL golden set and a small judge script is a valid starting point; adopt a platform when the team needs shared dashboards and human labeling.

## Sources

- Anthropic, "Building Effective Agents" (evaluation-driven development): https://www.anthropic.com/engineering/building-effective-agents
- RAG evaluation metrics overview: https://atlan.com/know/how-to-evaluate-rag-systems-explained/
- Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (position, verbosity, self-enhancement biases): https://arxiv.org/abs/2306.05685
- Hamel Husain, "Your AI Product Needs Evals": https://hamel.dev/blog/posts/evals/
- OpenTelemetry GenAI observability (2026): https://opentelemetry.io/blog/2026/genai-observability/
