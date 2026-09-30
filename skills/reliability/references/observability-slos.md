# Observability and SLOs — OpenTelemetry, Logs, Metrics, Traces, Alerting

Observability answers "what is happening to users right now, and why?" without shipping new code. SLOs turn that into decisions: when to page, when to slow down, when to invest in reliability.

## Contents
1. Signals and what each is for
2. OpenTelemetry setup
3. Structured logging
4. Metrics: RED, USE, golden signals
5. Tracing and propagation
6. SLIs and SLOs
7. Error budgets and policy
8. Burn-rate alerting
9. Dashboards and runbooks
10. Rules catalog

## 1. Signals and what each is for

| Signal | Answers | Cost profile |
|---|---|---|
| Metrics | "How much, how fast, how often?" — alertable aggregates | Cheap per event; cost grows with label cardinality |
| Traces | "Where did the time go for this request across services?" | Moderate; sample |
| Logs | "What exactly happened in this event?" — details and errors | Grows with volume; set levels and retention |
| Profiles | "Which code burns CPU/memory?" | Emerging as a fourth signal in OpenTelemetry |

Correlate them: logs carry `trace_id`; metrics can carry exemplars linking to traces.

## 2. OpenTelemetry setup

- Use the OpenTelemetry SDK for your language with **auto-instrumentation** for HTTP servers/clients, DB drivers, queues, and frameworks; add manual spans for business operations.
- Export with **OTLP** to a Collector (or directly to the backend). The Collector handles batching, sampling, redaction, and routing, and lets you switch vendors without code changes.
- Set resource attributes on every service: `service.name`, `service.version`, `deployment.environment`.
- Follow the semantic conventions for attribute names (`http.request.method`, `http.response.status_code`, `db.system`, …) so dashboards work across services.
- Tracing and metrics APIs are stable; logs are bridged from existing logging libraries. The GenAI semantic conventions (`gen_ai.*`) were still in development status as of 2026 — use them for LLM calls, but pin the semconv version.

Node sketch:

```ts
// instrumentation.ts — loaded before the app
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

new NodeSDK({
  serviceName: 'billing-api',
  traceExporter: new OTLPTraceExporter(), // endpoint from OTEL_EXPORTER_OTLP_ENDPOINT
  instrumentations: [getNodeAutoInstrumentations()],
}).start();
```

Configuration via standard environment variables (`OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_TRACES_SAMPLER`) keeps it portable.

## 3. Structured logging

Fields on every line:

```json
{"ts":"2026-09-30T12:04:11.382Z","level":"error","msg":"payment capture failed",
 "service":"billing-api","trace_id":"4bf92f3577b34da6a3ce929d0e0e4736","span_id":"00f067aa0ba902b7",
 "request_id":"req_81kd","tenant_id":"t_42","user":"u_hash_9c1","error.type":"ProviderTimeout",
 "provider":"psp","attempt":2,"duration_ms":1203}
```

Rules:
- JSON to stdout; the platform ships it.
- Levels mean something: `error` = needs attention, `warn` = unexpected but handled, `info` = business events and lifecycle, `debug` = off in production or sampled.
- Log once, where the error is handled, with context — not at every layer it passes through.
- **Never log**: passwords, tokens, API keys, session cookies, full card numbers, secrets, raw personal data (use IDs or hashes). Redact in the logger and again in the Collector.
- Escape or structure user-controlled values (log injection, CWE-117): put them in fields, not concatenated into the message.
- Set retention by value: short for debug/info, longer for audit logs (which belong in a separate, append-only store).

## 4. Metrics: RED, USE, golden signals

- **RED** for every service endpoint and every dependency call: Rate, Errors, Duration.
- **USE** for every resource (CPU, memory, disk, connection pools, queues, thread pools): Utilization, Saturation, Errors.
- **Four golden signals** (Google SRE): latency, traffic, errors, saturation.
- Latency as **histograms**; alert and report on p95/p99; separate latency of successful and failed requests (fast errors can make latency look better).
- **Cardinality budget**: labels have small, bounded value sets (route template `/orders/{id}`, status class, tenant tier, region). Never user ID, raw URL, email, request ID, or error message text.
- Business metrics too: orders placed, signups completed, jobs processed — they detect failures that return 200.

## 5. Tracing and propagation

- Propagate W3C Trace Context (`traceparent`, `tracestate`) on every outgoing HTTP/gRPC call — auto-instrumentation does this.
- **Across queues**: inject trace context into message headers at publish; extract at consume and link or parent the consumer span. Otherwise traces stop at the broker.
- A span per external call with attributes (DB statement *shape*, not values; HTTP route; queue name; model name and token counts for LLMs).
- Sampling: head-based (e.g., 1–10%) for volume; tail-based in the Collector to keep all errors and slow traces. Always keep traces for requests that errored.
- Do not put payloads or personal data in span attributes.

## 6. SLIs and SLOs

**SLI** = good events ÷ valid events.

| Journey | SLI (good event) | Measured at |
|---|---|---|
| API availability | Non-5xx responses ÷ all valid requests (exclude 4xx caused by clients) | Load balancer / gateway |
| Latency | Requests completed under 300 ms ÷ all valid requests | Load balancer / gateway |
| Checkout | Checkouts completed without server error in < 3 s ÷ checkout attempts | Application event |
| Async pipeline | Jobs finished within 5 min of enqueue ÷ jobs enqueued | Queue metrics |
| Data freshness | Minutes where the replica/search index lag < 60 s ÷ all minutes | Lag metric |

**SLO** = SLI target over a rolling window, typically 28 or 30 days: "99.9% of checkout requests succeed within 3 s over 30 days".

Choosing targets:
- Start from what users notice and what the business needs, not from current performance.
- Critical journeys only; 3–5 SLOs per service is plenty.
- An SLO cannot exceed the availability of hard dependencies unless you degrade gracefully around them.
- Publish internal SLOs tighter than any external SLA.

## 7. Error budgets and policy

| SLO | Error budget per 30 days |
|---|---|
| 99% | 7.2 h |
| 99.5% | 3.6 h |
| 99.9% | 43.2 min |
| 99.95% | 21.6 min |
| 99.99% | 4.3 min |

Error budget policy (agree on it before you need it):
- Budget remaining → ship normally; spend budget on experiments and velocity.
- Budget exhausted in the window → freeze risky launches; the team prioritizes reliability fixes from postmortems until the budget recovers.
- A single incident consuming a large share (e.g., > 20%) → mandatory postmortem with tracked action items.

## 8. Burn-rate alerting

Burn rate = how fast the budget is being consumed relative to the SLO (1× = exactly exhausting the budget over the window).

Multi-window, multi-burn-rate alerts for a 30-day SLO (Google SRE Workbook):

| Action | Burn rate | Long window | Short window | Budget spent when it fires |
|---|---|---|---|---|
| Page | 14.4 | 1 h | 5 min | 2% |
| Page | 6 | 6 h | 30 min | 5% |
| Ticket | 1 | 3 d | 6 h | 10% |

Alert condition = error rate over the long window > burn rate × (1 − SLO) **and** the same over the short window. The long window gives significance; the short window resets the alert quickly once fixed.

Prometheus-style expression for the first row (99.9% SLO):

```
(
  sum(rate(http_requests_total{job="api",code=~"5.."}[1h])) / sum(rate(http_requests_total{job="api"}[1h]))
) > (14.4 * 0.001)
and
(
  sum(rate(http_requests_total{job="api",code=~"5.."}[5m])) / sum(rate(http_requests_total{job="api"}[5m]))
) > (14.4 * 0.001)
```

Low-traffic services: burn rates are noisy with few requests; use longer windows, synthetic probes to generate steady traffic, or alert on absolute failure counts.

Beyond SLO alerts, page only for imminent, user-affecting conditions (certificate expiring within days, disk nearly full with a fast fill rate, queue age past promise). Everything else is a ticket or a dashboard.

## 9. Dashboards and runbooks

- One dashboard per service, top to bottom: SLOs and budget → RED per endpoint → dependencies (RED + breaker state) → resources (USE) → deploy markers.
- Every alert links to a runbook: what the alert means, how to confirm impact, first mitigations (rollback, flag off, scale, shed), escalation contacts, and relevant dashboards.
- Review alerts monthly: delete ones nobody acted on; tune ones that fired late.

## 10. Rules catalog

### Alert on SLO burn, not on causes
**Rule.** Page on multi-window burn-rate alerts for user-facing SLOs; keep cause metrics (CPU, memory) for dashboards and tickets.
**Apply when.** Creating or reviewing alerts.
**Do / Avoid.** Do: page when checkout errors burn budget at 14.4× over 1 h and 5 min. Avoid: paging at CPU > 80%.
**Why.** High CPU without user impact wakes people for nothing; user impact without high CPU goes unnoticed.

### Bound metric label cardinality
**Rule.** Metric labels take values from small, fixed sets.
**Apply when.** Adding any metric or label.
**Do / Avoid.** Do: `route="/orders/{id}"`, `tier="pro"`. Avoid: `user_id`, `url="/orders/8812"`.
**Why.** Each unique label combination is a separate time series; unbounded labels explode storage, cost, and query time.

### Propagate trace context through queues
**Rule.** Inject `traceparent` into message headers on publish and extract it on consume.
**Apply when.** Any async hop (queue, stream, outbox, webhook out).
**Do / Avoid.** Do: publish with `headers.traceparent`. Avoid: consumers starting fresh root spans.
**Why.** Without propagation, traces end at the broker and async failures cannot be tied to the request that caused them.

### Keep secrets and personal data out of telemetry
**Rule.** Redact at the source and again in the Collector; log IDs, not personal data.
**Apply when.** Adding logs, span attributes, or error reports.
**Do / Avoid.** Do: `user: "u_hash_9c1"`. Avoid: logging request bodies or `Authorization` headers.
**Why.** Telemetry is widely accessible, long-retained, and copied to vendors; leaks there are breaches.

## Sources

- OpenTelemetry documentation: https://opentelemetry.io/docs/
- OpenTelemetry GenAI observability (2026): https://opentelemetry.io/blog/2026/genai-observability/
- W3C Trace Context: https://www.w3.org/TR/trace-context/
- Google SRE Book, Monitoring Distributed Systems (golden signals): https://sre.google/sre-book/monitoring-distributed-systems/
- Google SRE Book, Service Level Objectives: https://sre.google/sre-book/service-level-objectives/
- Google SRE Workbook, Alerting on SLOs: https://sre.google/workbook/alerting-on-slos/
- Google SRE Workbook, Error Budget Policy: https://sre.google/workbook/error-budget-policy/
- Tom Wilkie, The RED Method; Brendan Gregg, The USE Method: https://www.brendangregg.com/usemethod.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
