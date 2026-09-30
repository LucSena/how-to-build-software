# Developer surfaces

API keys and personal access tokens, webhook settings and delivery logs, and the integrations directory and connection settings. API design itself (auth schemes, webhook payloads, signatures, idempotency) is in `api-design`; secret storage and key hashing are in `application-security`.

## Contents

1. API keys and tokens
2. Webhooks settings
3. Integrations directory and connections

---

## 1. API keys and tokens

**Purpose.** Let developers create credentials with the least access they need, copy them once, and manage them safely afterwards.

**List page anatomy.** Placed under settings where users expect access control ("API keys", "Developer settings"). Table: **name**, key **prefix and last characters** (never the full secret), scopes or access level, environment (test / live), created by, created at, **last used**, **expires**, status (Active, Expiring soon, Expired, Revoked), row menu (Edit, Roll, Revoke). Primary action: **Create key**. Service keys (not tied to a person) are separate from personal tokens where the product supports both.

**Create flow** — collect, in this order (Carbon's API key pattern ordering, extended):
1. **Name** (required; "What's this key for?") so it's recognizable later.
2. **Access**: read and write / read only / custom, then the **resources** it can reach. Default to the narrowest useful access; group permissions by area with read/write/admin levels.
3. **Expiration** with a **default** (GitHub's fine-grained tokens default to 30 days and allow 1–366 days or no expiration, subject to an organization maximum-lifetime policy). Warn when "No expiration" is chosen.
4. Environment (test / live), if the product has both.

A multi-step dialog with a progress indicator avoids scrolling when there are many options (Carbon).

**Reveal step.**
- Show the secret **once**, in a monospace read-only field with a **Copy** button (and optionally a download as JSON or .txt).
- Say plainly whether it can be retrieved later. If not: "Copy this key now. You won't be able to see it again." (GitHub shows a token only once.)
- Close with a "Done" or "I've copied the key" button; avoid dismissing on outside click or Esc before the user has seen the warning.
- After closing, the list shows only the prefix and last characters.

**Row actions.**
- **Edit** changes name and access, never the secret itself (Carbon).
- **Roll / Regenerate** issues a new secret; where the product supports it, keep the old one valid for a short, chosen overlap so deployments can switch.
- **Revoke** is immediate and irreversible: confirm dialog naming the key and the impact ("Apps using 'CI deploy' will stop working immediately").

**Rules.**
- **Recognizable prefixes** (for example `sk_live_`, `ghp_`, `github_pat_` style) help secret scanners detect leaked keys; design the key format with `api-design` / `application-security`.
- Email the owner when a key is created, and before it expires.
- Show "Expiring in 5 days" in the list and a banner on the keys page when any key is close to expiry.
- **Last used** lets admins revoke unused keys safely; show it.
- Pre-filled creation links (GitHub supports URLs that preset name, expiration, and permissions for fine-grained tokens) are a good way for docs to hand out least-privilege templates.
- Org-level policy (maximum lifetime, required approval for org access) shows in the create flow as read-only limits.

**States.** Empty ("Create an API key to use the REST API. Read the docs") · key created (reveal) · expiring soon · expired · revoked (kept in the list, greyed, with the revoke date) · no permission (hidden create button, explanation).

**Anti-patterns.** Showing the full key again later; keys without names; all-or-nothing scopes; no expiration by default; no last-used date; only personal keys, so automation breaks when someone leaves.

**Copy.** "Key created. Copy it now — for your security, we won't show it again." · "Revoke 'CI deploy'? Anything using this key will stop working immediately. Revoke key"

**Source.** GitHub Docs "Managing your personal access tokens"; Carbon community "Generate an API key".

---

## 2. Webhooks settings

**Purpose.** Let integrators subscribe to events, secure the endpoint, and debug deliveries without contacting support.

**Create / edit form.**
- Payload **URL** (require HTTPS; warn on `http://`).
- Content type.
- **Secret** (generate a high-entropy value; after saving, show it as "set" with Rotate — never display it again).
- **SSL/TLS verification** on by default; turning it off shows a warning.
- **Events**: "Just the main event" / "Everything" / "Let me select" — nudge toward the **minimum set** the receiver needs.
- **Active** toggle.

**Recent deliveries panel.** List: status (success/failure with HTTP code), event type, timestamp, duration, delivery ID. Expand a row to see request headers and payload and the response status, headers, and body. Actions: **Redeliver** (GitHub keeps the same delivery ID header on redelivery, so receivers can de-duplicate), and **Send test event**.

**Rules (from GitHub's webhook best practices, turned into UI prompts).**
- Subscribe to the minimum events.
- Use a webhook secret to verify deliveries; never put credentials in the URL.
- Use HTTPS and leave certificate verification on.
- Publish the sender IP ranges for allow-listing (GitHub exposes them via an API endpoint).
- Receivers must respond with a 2XX quickly (GitHub gives 10 seconds on github.com) and process asynchronously via a queue; say the timeout in the UI and docs.
- Check the event type and action before processing.
- **Redeliver** missed deliveries after downtime. Say whether your product retries automatically and for how long; GitHub, for example, does not retry failed deliveries automatically and lets you redeliver within a limited window.
- After repeated failures, consider disabling the endpoint and emailing the owner, with a clear "Disabled after N failures · Re-enable" state.

**States.** No endpoints (empty state with docs link) · healthy · failing (banner with the last error and a link to deliveries) · disabled · no permission (only admins can view payloads, which may contain sensitive data).

**Anti-patterns.** No delivery log; secrets shown in plain text after creation; "Everything" preselected; no test event; silent auto-disable.

**Source.** GitHub Docs "Best practices for using webhooks", "Redelivering webhooks", "Viewing webhook deliveries".

---

## 3. Integrations directory and connections

**Directory.** Search, categories, and Installed / Available filters. Each card: logo, name, one-line value ("Get deploy alerts in Slack"), publisher, verified badge if you verify publishers, and pricing if not free.

**Detail page.** What it does, screenshots, **permissions requested — listed in plain words before install**, data it reads and writes, pricing, support link, privacy policy, and publisher.

**Install flow.** OAuth consent (showing the scopes) → configuration (choose channels, projects, mapping) → success with the next step ("Send a test message"). Installing on behalf of a workspace needs an admin; members see "Request install".

**Installed integration settings.**
- **Connection status** (Connected, Needs attention, Disconnected), last sync time, recent errors with detail.
- **Reconnect** when a token expires or is revoked; show an actionable banner where the integration's output appears: "Reconnect Slack to resume deploy alerts. Reconnect".
- Configuration editable with the product's normal save model.
- **Uninstall / Disconnect** in a danger area: say what happens to synced data and to automations that depend on it ("3 automations use this integration and will stop"), then confirm.

**Anti-patterns.** Permissions revealed only on the third-party consent screen; silent sync failures; uninstall that leaves orphaned automations; integrations installable by any member without admin visibility.

**Source.** Synthesized from common SaaS practice and the shared rules in `SKILL.md` (degraded states, permissions, destructive ladder); OAuth consent specifics in `auth-flows` and `api-design`.

---

## Sources

- GitHub Docs, Managing your personal access tokens: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- Carbon community pattern, Generate an API key: https://carbondesignsystem.com/community/patterns/generate-an-api-key/
- GitHub Docs, Best practices for using webhooks: https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks
- GitHub Docs, Redelivering webhooks: https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/redelivering-webhooks
- GitHub Docs, Viewing webhook deliveries: https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/viewing-webhook-deliveries
