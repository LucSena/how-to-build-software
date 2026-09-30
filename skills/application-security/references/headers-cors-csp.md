# Security Headers, CSP, CORS, Cookies

Baseline response headers, a strict Content Security Policy and how to roll it out, CORS without foot-guns, cookie attributes, Subresource Integrity, and caching of sensitive responses. Status as of 2026-09.

## Contents
1. Baseline headers
2. Strict CSP with nonces
3. CSP rollout
4. Framework notes
5. CORS
6. Cookies
7. Third-party scripts and SRI
8. Caching sensitive responses
9. Verification
10. Rules catalog

## 1. Baseline headers

```
Strict-Transport-Security: max-age=63072000; includeSubDomains
Content-Security-Policy: (section 2)
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
Cache-Control: no-store                  (authenticated and sensitive responses only)
Content-Type: text/html; charset=utf-8
```

| Header | Why | Notes |
|---|---|---|
| HSTS | Forces HTTPS, blocks downgrade | ASVS asks for at least a year and `includeSubDomains` at L2. `preload` is effectively irreversible — add it deliberately once every subdomain is HTTPS |
| `X-Content-Type-Options: nosniff` | Stops MIME sniffing of user content into scripts | On every response |
| Referrer-Policy | Keeps paths and query strings (tokens) out of other sites' logs | `no-referrer` on pages whose URLs carry tokens (reset, magic link) |
| COOP `same-origin` | Isolates your window from cross-origin openers | Use `same-origin-allow-popups` if you rely on OAuth or payment popups |
| CORP `same-site` | Stops other sites embedding your resources | Relax per public asset path |
| Permissions-Policy | Disables powerful features you don't use | List only features you use, scoped to origins |
| `X-Frame-Options: DENY` | Legacy clickjacking defense | `frame-ancestors` in CSP is the real control; keep XFO for old browsers |
| `X-XSS-Protection` | Legacy auditor | Set to `0` or omit; never enable it |
| COEP `require-corp` | Cross-origin isolation (SharedArrayBuffer) | Only if you need it — it breaks third-party embeds |

Remove `X-Powered-By`, `Server` version strings, and framework banners.

## 2. Strict CSP with nonces

```
Content-Security-Policy:
  script-src 'nonce-{RANDOM}' 'strict-dynamic' https: 'unsafe-inline';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  form-action 'self';
  report-to csp
Reporting-Endpoints: csp="https://example.com/csp-reports"
```

- `{RANDOM}`: at least 128 bits from a CSPRNG, **fresh per response**, added only to script tags your templates render.
- `'strict-dynamic'` lets scripts you trusted with the nonce load their own dependencies; it makes host allowlists unnecessary.
- `https:` and `'unsafe-inline'` are ignored by browsers that support nonces and `strict-dynamic`; they exist only as fallbacks for very old browsers. Never ship `'unsafe-inline'` without a nonce.
- Static sites without per-response rendering use hashes: `script-src 'sha256-…' 'strict-dynamic'`.
- `object-src 'none'` and `base-uri 'none'` are ASVS's minimum; `frame-ancestors` belongs on every response.
- **Never** add nonces to all `<script>` tags in middleware or a post-processing step — an injected script would receive a valid nonce too.
- Inline event handlers (`onclick="…"`) and `javascript:` URLs are blocked by a strict policy; move them to scripts.
- **Trusted Types** (`require-trusted-types-for 'script'`, Chromium) makes DOM sinks such as `innerHTML` reject plain strings; adopt after CSP is stable.

**Style CSP** is lower priority; `style-src 'self' 'nonce-…'` is ideal, but many component libraries inject styles. Don't delay the script policy for it.

## 3. CSP rollout

1. Ship the strict policy as `Content-Security-Policy-Report-Only`, next to whatever is enforced today.
2. Collect reports for one to two weeks (a reporting endpoint or a hosted collector); fix legitimate violations (inline scripts, third-party loaders without nonces).
3. Enforce it; keep reporting on.
4. Re-run with each new third-party tag: marketing scripts are the usual regression source. Load them through your nonce-bearing loader or a tag manager configured for nonces.

## 4. Framework notes

- **Full-stack frameworks** (Next.js, SvelteKit, Nuxt, Remix, Rails, Django): most support generating a per-request nonce and passing it to their script tags; check your framework's current CSP guide. A nonce requires dynamic rendering — statically cached HTML cannot carry a per-response nonce, so use hashes for static pages.
- **SPAs served as static files**: hash-based CSP for the bootstrap script, `strict-dynamic` for what it loads.
- **Reverse proxy / CDN**: set static headers (HSTS, nosniff, COOP) at the edge; the per-response CSP nonce must come from the app.

## 5. CORS

CORS **relaxes** the same-origin policy. It never protects anything. No CORS headers is the safest default.

| Situation | Policy |
|---|---|
| Browser app and API on the same origin | No CORS headers at all |
| Your SPA on `app.example.com` calling `api.example.com` with cookies | Exact allowlist `https://app.example.com`, `Access-Control-Allow-Credentials: true`, `Vary: Origin` |
| Public, read-only, non-sensitive data | `Access-Control-Allow-Origin: *` **without** credentials |
| Third-party developers | Tokens in headers (no cookies), exact allowlist per registered app, or `*` without credentials for truly public endpoints |

Never:
- reflect the request's `Origin` into `Access-Control-Allow-Origin` (any site can then read responses);
- combine `*` with credentials;
- match origins with substring or loose regex (`example.com.evil.net`, `evil-example.com`);
- allowlist `null` (sandboxed iframes and `file:` pages send it).

A permissive credentialed CORS policy also defeats CSRF tokens, because the attacker's page can read the token.

## 6. Cookies

```
Set-Cookie: __Host-session=…; Path=/; Secure; HttpOnly; SameSite=Lax
```

- `__Host-` prefix for session cookies (requires `Secure`, `Path=/`, no `Domain`); `__Secure-` only when the cookie must span subdomains.
- `HttpOnly` on anything a script doesn't need; `Secure` always.
- `SameSite=Lax` default; `Strict` for admin-only apps; `None` only for deliberate cross-site embeds (then CSRF protection is mandatory).
- Keep cookies small and few; never store secrets or personal data in client-readable cookies.
- Session and auth cookie details: `auth-flows`.

## 7. Third-party scripts and SRI

- Every third-party script runs with full access to your page and your users' sessions. Prefer self-hosting pinned copies.
- CDN scripts get Subresource Integrity: `<script src="…" integrity="sha384-…" crossorigin="anonymous">`.
- **polyfill.io (2024)**: the domain changed owners and began serving malicious redirects to more than 100,000 sites that hot-linked it. Self-hosted or SRI-pinned copies were unaffected.
- Review tag managers as code: whoever can publish a tag can run JavaScript on your checkout page.

## 8. Caching sensitive responses

- `Cache-Control: no-store` on authenticated pages and API responses with personal data. `no-cache` only forces revalidation — it does not prevent storage.
- CDNs: never cache responses that vary by cookie or `Authorization` unless the cache key includes the user; add `Vary` correctly or bypass the cache. A cached personalized page served to the next visitor is a data breach.
- Clear sensitive data on logout client-side as well (service worker caches, IndexedDB).

## 9. Verification

- Automated test in CI against a preview deployment: assert HSTS, CSP (nonce present and different across two requests), nosniff, `frame-ancestors`, cookie flags, and absence of `X-Powered-By`.
- Watch CSP reports as a signal: a burst of violations from one page can be an injection attempt.
- Re-check after framework upgrades and CDN or proxy changes — headers silently disappear there.

## 10. Rules catalog

### Nonce per response, never per page type
**Rule.** Generate a new CSP nonce for every response and add it only to scripts your templates render.
**Apply when.** Any server-rendered HTML with a nonce-based CSP.
**Do / Avoid.** Do create the nonce in request context and pass it to the renderer. Avoid a constant nonce or middleware that stamps every `<script>`.
**Why.** A predictable or blanket nonce authorizes injected scripts too.

### Allowlist origins exactly
**Rule.** CORS allows a fixed set of full origins, compared exactly.
**Apply when.** Any API called from a browser on another origin.
**Do / Avoid.** Do `ALLOWED.has(origin)` with `Vary: Origin`. Avoid `res.set("Access-Control-Allow-Origin", req.headers.origin)`.
**Why.** Reflection plus credentials lets any website read your users' data.

## Sources

- OWASP HTTP Headers Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
- OWASP Content Security Policy Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- web.dev, Mitigate XSS with a strict CSP: https://web.dev/articles/strict-csp
- OWASP ASVS 5.0.0 V3 Web Frontend Security (3.3 cookies, 3.4 headers, 3.6 SRI): https://github.com/OWASP/ASVS/tree/master/5.0/en
- MDN, Cross-Origin Resource Sharing: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- The Copenhagen Book (MIT), CSRF and CORS interaction: https://thecopenhagenbook.com/csrf
- polyfill.io supply-chain attack: https://sansec.io/research/polyfill-supply-chain-attack
