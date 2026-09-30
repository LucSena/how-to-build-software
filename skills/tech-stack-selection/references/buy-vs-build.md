# Buy vs build

An organization has limited capacity for expertise. Spend it on the part of the product customers pay for, and rent the rest. In DDD terms, *generic subdomains* (identity, payments, email, observability) are bought, *supporting* ones are built simply, and the *core* domain gets your best engineering (`software-architecture`). Vendor names below are examples, not endorsements. Check current status, pricing, and terms before recommending one.

## Contents
1. Decision rule
2. Capability table
3. Vendor evaluation checklist
4. Wrapping a vendor
5. Why "we'll just build it" goes wrong
6. Rules catalog

## 1. Decision rule

Buy (or adopt a mature library) unless **at least one** of these is true and written down in an ADR:

- The capability **is** your product or a real differentiator customers choose you for.
- No vendor meets a hard constraint (data residency, air-gapped deployment, a regulatory requirement), after you actually checked.
- The cost at a realistic 12–24-month volume is prohibitive *and* the in-house cost estimate includes maintenance, on-call, security patching, and compliance work.
- The need is truly tiny (≤ 5 static feature flags, one cron email) and a few lines of code cover it for good.

"We can build it cheaper" is the most common and least reliable argument. Maintenance cost is consistently under-forecast (Kane Narraway, "Platform Engineering: Build vs Buy").

## 2. Capability table

| Capability | Default | Build only if | Exit plan |
|---|---|---|---|
| **Authentication** (passwords, OAuth/social, passkeys, MFA, sessions, SSO) | The framework's built-in auth (Django, Rails 8 generator, Laravel, ASP.NET Identity, Spring Security), a maintained library (e.g. Better Auth, Auth.js), or a hosted IdP (e.g. Clerk, Auth0, WorkOS, Supabase Auth, Cognito, Keycloak self-hosted) | Identity is the product | Own the user table and IDs in your DB; export password hashes where the vendor allows it. UX and security: `auth-flows` |
| **Enterprise SSO / SCIM** | A B2B IdP or an auth library's SSO plugin | Never hand-roll SAML | Standard protocols (SAML, OIDC, SCIM) |
| **Authorization** | Plain functions or policy objects for simple roles; a library or engine (e.g. CASL, Oso, OpenFGA, Cedar) for relationship-based rules | — | Keep policy checks behind one module (`application-security`) |
| **Payments, subscriptions, tax** | Stripe, Paddle, Adyen; a merchant of record when you sell globally and don't want to own sales-tax/VAT compliance | **Never** handle raw card data (PCI scope) | Store your own customer/plan mapping; keep webhook handlers idempotent |
| **Transactional email** | Postmark, Amazon SES, Resend, SendGrid | — | Templates in your repo; send through one interface |
| **Search** | Postgres full-text + trigram → Meilisearch / Typesense / Algolia → OpenSearch/Elasticsearch at scale | Search relevance is the product | The index is derived data: keep a rebuild job (`data-infrastructure`) |
| **Product analytics** | A hosted or self-hostable product-analytics tool (e.g. PostHog, Amplitude, Mixpanel); privacy-first web analytics (e.g. Plausible) for marketing sites | A data team runs a warehouse and event pipeline | Send events through one tracking module with a typed event catalog |
| **Feature flags** | OpenFeature API + a provider (e.g. LaunchDarkly, Unleash, Flagsmith) | ≤ 5 static flags → env config | OpenFeature makes providers swappable |
| **Error tracking, APM, logs** | Sentry (or equivalent); OpenTelemetry SDKs exporting to a vendor or the Grafana stack | — | OpenTelemetry keeps instrumentation vendor-neutral |
| **File storage and media** | S3-compatible object storage + CDN; an image/video pipeline service when you transform media | — | S3 API is the de facto standard |
| **Background jobs, scheduling** | The framework's queue (Solid Queue, Celery/RQ/Dramatiq, BullMQ, River, graphile-worker, pg-boss) | — | Jobs idempotent; payloads versioned (`deployment-and-infrastructure`) |
| **Notifications (push, SMS)** | Platform push services via a provider; an SMS API | — | One notification module; per-user preferences in your DB |
| **Internal admin** | The framework's admin or an internal-tool builder | The admin *is* a product surface | — |

## 3. Vendor evaluation checklist

- [ ] **Data export**: can you get all your data out in a documented format, including user credentials where relevant?
- [ ] **Standards**: OIDC/SAML, S3 API, OpenTelemetry, SQL, webhooks with signatures?
- [ ] **Pricing at 10×**: model today's volume and 10× it; watch per-seat, per-MAU, and overage cliffs.
- [ ] **Compliance**: SOC 2 / ISO reports, a DPA, data-residency options, and a subprocessor list if you handle personal data.
- [ ] **Reliability**: public status page, incident history, SLA, rate limits, and sandbox environments.
- [ ] **SDK quality**: typed SDKs for your languages, maintained in the last few months, no heavy transitive dependencies (`dependency-management`).
- [ ] **Security**: SSO for your team's dashboard access, audit logs, scoped API keys, key rotation.
- [ ] **Business risk**: funding, ownership changes, product-line sunsetting, license changes for self-hosted editions.
- [ ] **Fallback**: what happens to your product when the vendor is down (degraded mode, queue and retry, cached data)?

## 4. Wrapping a vendor

- Call every vendor through **one module you own** (`billing/stripe-gateway.ts`, `email/sender.py`). That module translates the vendor's model into your domain's terms (an anti-corruption layer).
- Store the vendor's IDs next to your own IDs, never *instead of* them.
- Handle webhooks idempotently (dedupe by event ID), verify signatures, and reconcile periodically instead of trusting webhooks alone.
- Put timeouts, retries with backoff, and a circuit breaker on vendor calls (`reliability`).
- Do not over-abstract. A generic "PaymentProvider" interface with one implementation is ceremony. The wrapper exists to keep vendor types out of the domain, not to pretend you could switch tomorrow.

## 5. Why "we'll just build it" goes wrong

- **Auth** looks like a login form. It is really password hashing parameters, rate limiting, enumeration-safe errors, reset tokens, email verification, MFA, passkeys, session rotation, device management, SSO, and account recovery, each with security consequences (`auth-flows`).
- **Billing** looks like "charge monthly". It is really proration, upgrades mid-cycle, dunning and retries, tax by jurisdiction, invoices, refunds, credit notes, currency, and revenue reporting. "The 14 pains of building your own billing system" (arnon.dk) catalogs these.
- **Search** looks like `LIKE '%term%'`. It is really stemming, typo tolerance, ranking, facets, highlighting, and index freshness. Start with Postgres FTS, and buy a search engine when relevance matters.
- **Feature flags** look like an `if`. They are really targeting rules, gradual rollouts, audit history, kill switches, and flag cleanup.

## 6. Rules catalog

### Never touch raw card data
**Rule.** Use the payment provider's hosted fields, checkout, or elements. Card numbers never reach your servers or logs.
**Apply when.** Any payment feature.
**Do / Avoid.** Do: a hosted checkout, or client-side tokenization with your server seeing only a token. Avoid: a custom card form posting to your API.
**Why.** Handling card data puts your whole system into PCI DSS scope. The provider has already paid that compliance cost.

### Own the identifiers, rent the capability
**Rule.** Your database owns users, organizations, and plans. Vendor IDs are foreign references stored alongside.
**Apply when.** Integrating auth, billing, analytics, or CRM vendors.
**Do / Avoid.** Do: `users.id` (yours) plus `users.auth_provider_id`. Avoid: using the vendor's user ID as your primary key across the schema.
**Why.** Migrating vendors becomes a column update instead of a rewrite of every foreign key and URL.

### Price the build honestly
**Rule.** An in-house estimate includes build + maintenance + on-call + security + compliance over 2–3 years. Compare that against the vendor at 10× volume.
**Apply when.** Someone proposes building a generic capability.
**Do / Avoid.** Do: "Build: 6 engineer-weeks + ~1 day/month upkeep + SOC 2 evidence. Buy: $X/month at 10×." Avoid: comparing the vendor's price to the build's first sprint.
**Why.** Build-vs-buy decisions fail through forgotten maintenance, not the initial build.

## Sources

- "Build vs. Buy" (entropicthoughts): https://entropicthoughts.com/build-vs-buy
- Kane Narraway, "Platform Engineering: Build vs Buy": https://kanenarraway.com/posts/platform-engineering-build-vs-buy/
- "The 14 pains of building your own billing system": https://arnon.dk/the-14-pains-of-billing/
- thoughtbot production guides (email, payments, error tracking, logging, monitoring): https://github.com/thoughtbot/guides/tree/main/production
- create-t3-app, why NextAuth.js / auth choice: https://create.t3.gg/en/why
- OpenFeature: https://openfeature.dev
- OpenTelemetry: https://opentelemetry.io
- The Copenhagen Book (auth implementation guide): https://thecopenhagenbook.com
- Better Auth: https://github.com/better-auth/better-auth
