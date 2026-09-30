# Webhooks — Producing and Consuming Safely

Webhooks are HTTP callbacks that deliver events to URLs your customers control. Delivery is unreliable by nature: endpoints go down, requests are duplicated, events arrive out of order, and attackers can forge requests. Default to the Standard Webhooks specification so both sides can use existing libraries.

## Contents
1. Standard Webhooks at a glance
2. Event payload design
3. Producer rules
4. Consumer rules
5. Signature verification example
6. Testing and tooling
7. Rules catalog

## 1. Standard Webhooks at a glance

Headers on every delivery:

| Header | Content |
|---|---|
| `webhook-id` | Unique message ID, identical across retries of the same message — the dedupe key |
| `webhook-timestamp` | Unix seconds when the attempt was sent |
| `webhook-signature` | Space-delimited list of `v1,<base64 HMAC-SHA256>` signatures (several during secret rotation) |

Signed content: `{webhook-id}.{webhook-timestamp}.{raw body}` using the endpoint's secret (the spec's secrets are base64 with a `whsec_` prefix). Asymmetric signatures (`v1a`, ed25519) are also defined for cases where consumers should not hold a shared secret.

The spec is used by a growing list of providers, and it ships reference libraries in several languages — prefer them over hand-rolled verification.

## 2. Event payload design

```json
{
  "type": "invoice.paid",
  "timestamp": "2026-09-30T12:04:11Z",
  "data": { "id": "inv_8f2k", "object": "invoice", "status": "paid", "amountMinor": 4900, "currency": "EUR" }
}
```

- Event types are namespaced, past-tense facts: `invoice.paid`, `subscription.canceled`.
- **Thin vs fat events**: thin events carry IDs and the consumer fetches current state via the API (always fresh, needs API access); fat events carry a snapshot (fewer calls, may be stale when processed). Default: include the resource snapshot plus its `id`, and tell consumers to fetch fresh state when ordering matters.
- Version event schemas the same way as the API (additive changes only; new type or version for breaking ones).
- Keep payloads small (tens of KB); link to large data.
- Never include secrets; minimize personal data.

## 3. Producer rules

- **At-least-once delivery** from a durable queue or outbox — never fire-and-forget from the request handler.
- **Retries** with exponential backoff and jitter over an extended schedule (for example, spanning hours to a few days); treat 2xx as success, anything else or a timeout as failure; honor 410 as "endpoint gone — disable".
- **Timeouts** per attempt (a few seconds, e.g., 5–15 s); consumers are told to respond quickly.
- **Per-endpoint isolation**: separate queues or concurrency limits so one slow customer endpoint cannot delay others (bulkhead); circuit-break and eventually disable endpoints after sustained failure, and notify the owner.
- **Delivery log and replay**: store attempts (status, latency, response snippet) and give customers a UI/API to inspect and resend.
- **SSRF protection** (OWASP API7) when calling customer URLs: allow only `https`; resolve DNS and block private, loopback, link-local, and cloud metadata addresses (e.g., 169.254.169.254) — and re-check after resolution to prevent DNS rebinding; do not follow redirects (or re-validate each hop); send from dedicated egress IPs customers can allow-list.
- **Secret management**: one secret per endpoint; support rotation with overlapping validity (send signatures for both secrets during rotation).
- **Ordering** is not guaranteed; include timestamps and resource versions so consumers can discard stale events.

## 4. Consumer rules

1. **Verify the signature over the raw request body** (bytes as received) with a constant-time comparison. Parsing and re-serializing JSON changes bytes and breaks verification.
2. **Reject stale timestamps** outside a tolerance (about 5 minutes) to prevent replay.
3. **Deduplicate** by `webhook-id` (unique constraint in a processed-events table), because retries and duplicates are normal.
4. **Acknowledge fast**: persist the event (or enqueue it) and return 2xx within a few seconds; do the work asynchronously.
5. **Handle out-of-order delivery**: compare resource versions or timestamps; when in doubt, fetch the current resource from the provider's API.
6. **Idempotent processing** end to end; downstream side effects carry idempotency keys.
7. **Do not trust the payload for authorization-sensitive decisions** without verification; for high-value events (payments), confirm by fetching from the provider's API.
8. Monitor webhook failures and processing lag; alert when a provider stops sending (absence of expected events).

## 5. Signature verification example

TypeScript (Node), manual version to show the mechanics — prefer the official Standard Webhooks library in production:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyWebhook(rawBody: Buffer, headers: Record<string, string>, secret: string): boolean {
  const id = headers['webhook-id'];
  const ts = headers['webhook-timestamp'];
  const sigHeader = headers['webhook-signature'];
  if (!id || !ts || !sigHeader) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;           // replay window

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${ts}.`).update(rawBody).digest();

  return sigHeader.split(' ').some((entry) => {
    const [version, sig] = entry.split(',');
    if (version !== 'v1' || !sig) return false;
    const given = Buffer.from(sig, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected); // constant time
  });
}
```

Framework note: configure the route to receive the raw body (e.g., `express.raw({ type: 'application/json' })`, `await request.arrayBuffer()` in fetch-style handlers) before any JSON parser runs.

## 6. Testing and tooling

- Producer: contract tests for payload schemas; integration tests that verify signatures with the reference library; chaos tests for endpoint timeouts and 5xx.
- Consumer: tests for invalid signature, stale timestamp, duplicate ID, out-of-order events, and unknown event types (ignore and 2xx, do not fail).
- Local development: tunnel tools or the provider's CLI to forward events; never disable signature checks outside tests.
- Document webhooks with AsyncAPI or OpenAPI 3.1 `webhooks` so consumers can generate types.

## 7. Rules catalog

### Verify signatures on the raw body
**Rule.** Compute the HMAC over the exact received bytes and compare in constant time.
**Apply when.** Receiving any signed webhook.
**Do / Avoid.** Do: capture the raw buffer before parsing. Avoid: `JSON.stringify(req.body)` and comparing with `===`.
**Why.** Re-serialization changes bytes (spacing, key order, unicode escapes), and non-constant-time comparison leaks timing information.

### Deduplicate by message ID
**Rule.** Store processed `webhook-id`s under a unique constraint and skip repeats.
**Apply when.** Processing any webhook.
**Do / Avoid.** Do: `INSERT … ON CONFLICT DO NOTHING` then process only if inserted. Avoid: assuming each event arrives once.
**Why.** At-least-once delivery means retries after timeouts produce duplicates even when you succeeded.

### Acknowledge first, process later
**Rule.** Persist or enqueue the event and return 2xx within seconds; process asynchronously.
**Apply when.** Webhook handlers that do meaningful work.
**Do / Avoid.** Do: enqueue a job keyed by `webhook-id`. Avoid: calling three APIs and sending an email before responding.
**Why.** Slow handlers time out at the producer, which retries, multiplying load and duplicates.

### Block internal addresses when sending
**Rule.** Validate destination URLs after DNS resolution and refuse private, loopback, link-local, and metadata ranges; do not follow redirects blindly.
**Apply when.** Producing webhooks or any feature that fetches user-supplied URLs.
**Do / Avoid.** Do: resolve, check the IP against deny ranges, connect to that IP. Avoid: `fetch(customerUrl)` from inside your VPC.
**Why.** SSRF lets attackers reach internal services and cloud credentials through your servers.

## Sources

- Standard Webhooks specification: https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md
- Standard Webhooks site and libraries: https://www.standardwebhooks.com/
- OWASP API Security Top 10 2023, API7 SSRF: https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/
- OWASP SSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- OpenAPI 3.1 `webhooks` object: https://spec.openapis.org/oas/v3.1.0#oasWebhooks
- AsyncAPI: https://www.asyncapi.com/
