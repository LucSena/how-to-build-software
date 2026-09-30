# External exposure: what an attacker checks first

Real breaches of small and mid-size apps rarely start with a clever exploit. They start with something the team published by accident: a `.env` file, a source map, a metrics endpoint, a BaaS table with no row-level security, or a subdomain still pointing at a deleted service. Attack-surface recon tooling checks these in minutes, so check them before an attacker does.

This file lists the checks in the order an external recon pass runs them, with the defensive rule for each. Run it before launch and after any infrastructure change.

## Contents
- The pre-launch exposure pass
- Rules (catalog)
- Sources

## The pre-launch exposure pass

- [ ] **Inventory.** List every domain, subdomain, and hosting provider you use, including staging, preview, and marketing sites. You cannot protect what you did not list.
- [ ] **Leak paths.** Request `/.env`, `/.env.local`, `/.git/config`, `/backup.sql`, `/docker-compose.yml`, `/debug.log`, and editor backups (`*.bak`, `*~`) on every host. Each must return 404, not 403 (a 403 confirms the file exists).
- [ ] **Client bundles.** Search the built JavaScript and any `*.map` files for keys, internal URLs, and service-account JSON.
- [ ] **Observability endpoints.** `/metrics`, `/actuator/*`, `/debug/*`, `/telescope`, and admin panels must not answer anonymous requests from the internet.
- [ ] **BaaS rules.** Using the public (anon/publishable) key, try to read and write each table and storage bucket as an anonymous user and as a freshly signed-up user.
- [ ] **Server-side fetchers.** Any endpoint that fetches a URL (image optimizers, link previews, webhooks, PDF renderers) rejects private and metadata addresses.
- [ ] **DNS.** Every CNAME points at a resource you still own.
- [ ] **Re-run on change.** Put the leak-path and bundle checks in CI against the preview deployment; they are cheap and deterministic.

## Rules

### Serve only the build output
**Rule.** The web server's document root contains only the build output. Secrets, VCS metadata, backups, and compose files never sit under it.
**Apply when.** Deploying anything that serves files from disk (nginx, Apache, PHP, static hosts, "copy the repo to the server" deploys).
**Do / Avoid.** Do deploy a built artifact into an empty directory. Avoid `git pull` into the web root, which ships `.git/` and any `.env` next to the code.
**Why.** `.env`, `.git/config`, and SQL dumps are among the first paths every leak scanner requests; one hit usually yields database credentials or the full source.

### Return 404 for everything outside the allowlist
**Rule.** Unknown paths and dotfiles return 404, identical to any other missing file.
**Apply when.** Configuring the web server, CDN, or framework router.
**Do / Avoid.** Do deny `/\.` (dotfiles) at the edge with a 404. Avoid a 403 for `/.git/`, which confirms the directory exists.
**Why.** Status-code differences are an oracle: recon tools triage hosts by which sensitive paths answer differently.

### Keep production source maps private
**Rule.** Do not publish browser source maps in production. If you need them for error tracking, upload them to the error tracker and keep them off the public host.
**Apply when.** Configuring the production build (Next.js `productionBrowserSourceMaps`, Vite `build.sourcemap`, webpack `devtool`).
**Do / Avoid.** Do leave production browser maps off (the Next.js default) or use hidden maps uploaded at build time. Avoid serving `*.js.map` next to the bundle.
**Why.** A source map reconstructs the original source: route names, feature flags, internal API paths, and any secret someone inlined.

### Treat every client bundle as public
**Rule.** Nothing in client code is secret: not a variable prefixed `NEXT_PUBLIC_`/`VITE_`, not an obfuscated string, not a key "only used by the admin page".
**Apply when.** Adding any key, token, or internal URL to frontend code or public env vars.
**Do / Avoid.** Do call third-party APIs that need a secret from the server. Avoid shipping a service-account JSON, a Supabase secret (service_role) key, or a payment secret key to the browser.
**Why.** Extracting secrets from JS bundles is a standard recon step, and a leaked service-role or cloud service-account key bypasses every access rule you wrote.

### Enable row-level security on every exposed BaaS table
**Rule.** With Supabase, enable RLS on every table in an exposed schema and write explicit policies. With Firebase, write security rules that require auth and check ownership; never ship test-mode rules.
**Apply when.** A browser or mobile client talks to the database directly with a public key.
**Do / Avoid.** Do test each table with the anon key and with a second user's session. Avoid relying on the UI to hide rows. The API is reachable without your UI.
**Why.** Supabase documents that a table in an exposed schema without RLS is readable and writable by any role with a grant on it, and its secret key role has `bypassrls`. The public key is only safe because RLS exists.

### Close open sign-up where accounts are not meant to be public
**Rule.** If only invited users should have accounts, disable public sign-up in the auth provider, not just in the UI.
**Apply when.** Internal tools, B2B apps with invite-only onboarding, or apps built on Firebase Auth or Supabase Auth.
**Do / Avoid.** Do turn off self-registration or restrict it to verified domains server-side. Avoid hiding the sign-up form while the auth API still accepts new accounts.
**Why.** Recon checks for open sign-up first: a self-created account turns "authenticated users only" rules into "anyone".

### Keep metrics and actuators off the public internet
**Rule.** Serve `/metrics`, health details, profilers, and framework admin endpoints on an internal port or network, or behind authentication.
**Apply when.** Adding Prometheus exporters, Spring Boot Actuator, Laravel Telescope, pprof, or a custom status page.
**Do / Avoid.** Do expose only a minimal `{"status":"ok"}` health check publicly. Avoid widening Spring's `management.endpoints.web.exposure.include` without securing it; by default only `health` is exposed over HTTP.
**Why.** Metric names and labels reveal your dependencies, AI models, traffic, and versions, and endpoints such as `env`, `configprops`, and `heapdump` can leak configuration or memory.

### Restrict every server-side fetcher
**Rule.** Any server feature that fetches a URL has an allowlist of hosts and rejects private, loopback, link-local, and cloud-metadata addresses after DNS resolution and on every redirect.
**Apply when.** Image optimizers, link unfurlers, webhook senders, import-from-URL, headless renderers.
**Do / Avoid.** Do set Next.js `images.remotePatterns` with explicit protocol, hostname, and pathname, and keep `dangerouslyAllowLocalIP` false. Avoid wildcard patterns: the Next.js docs note that allowed remote hosts that redirect are followed without re-checking the pattern.
**Why.** SSRF through an image or preview endpoint reaches internal services and the cloud metadata endpoint (see `injection-xss-ssrf.md`).

### Remove DNS before you remove the service
**Rule.** When decommissioning, delete the DNS record first, then the hosted resource. When provisioning, claim the resource first, then create DNS.
**Apply when.** Retiring a marketing site, preview environment, S3/Azure/Heroku/GitHub Pages target, or SaaS custom domain.
**Do / Avoid.** Do keep a domain inventory and alert on CNAMEs whose target returns the provider's "no such app" page. Avoid leaving `blog.example.com` pointing at a deleted host.
**Why.** A dangling CNAME lets anyone claim the target and serve content on your subdomain, which can read cookies scoped to the parent domain and bypass CSP allowlists (MDN, "Subdomain takeovers").

### Keep staging as protected as production
**Rule.** Staging, preview, and old versions sit behind authentication or an IP allowlist, and never hold production data or production keys.
**Apply when.** Creating preview deployments, `staging.` or `dev.` subdomains, or leaving an old version running during a migration.
**Do / Avoid.** Do protect previews with the platform's deployment protection. Avoid a public `staging.example.com` running an older, unpatched build against a copy of production.
**Why.** Staging subdomains are enumerated from certificate-transparency logs and DNS within minutes, and they usually have debug mode, verbose errors, and weaker auth.

### Authorize server functions as public endpoints
**Rule.** Treat every server action, RPC, and GraphQL mutation as a public HTTP endpoint that anyone can call directly, with any arguments.
**Apply when.** Using Next.js Server Actions, tRPC, RPC-style frameworks, or MCP tools exposed to users.
**Do / Avoid.** Do authenticate and authorize inside the function (see `authorization.md`). Avoid assuming only your UI calls it; action IDs are visible in the page.
**Why.** Recon playbooks call server actions directly by ID; if auth only happens in middleware or the component, the action runs for anyone.

## Sources

- recon-skills (uphiago, MIT): catalog of external recon checks: source-leak hunt, JS secrets extraction, Firebase/Supabase, metrics exposure, subdomain takeover, Next.js, MCP security: https://github.com/uphiago/recon-skills
- Supabase, Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Spring Boot, Actuator endpoints (default exposure, sensitive endpoints): https://docs.spring.io/spring-boot/reference/actuator/endpoints.html
- Next.js, Image component (`remotePatterns`, redirects, `dangerouslyAllowLocalIP`), docs v16.3: https://nextjs.org/docs/app/api-reference/components/image
- Next.js, `productionBrowserSourceMaps` (off by default): https://nextjs.org/docs/app/api-reference/config/next-config-js/productionBrowserSourceMaps
- MDN, Subdomain takeovers: https://developer.mozilla.org/en-US/docs/Web/Security/Subdomain_takeovers
- Firebase Security Rules: https://firebase.google.com/docs/rules
