# Injection, XSS, SSRF, and File Uploads

Patterns for the places where untrusted data meets an interpreter, a browser, the network, or the file system. Each section: the rule, the code, the traps.

## Contents
1. Input validation at boundaries
2. SQL injection
3. Other interpreters: shell, templates, NoSQL, logs, headers
4. XSS and output encoding
5. Rendering user Markdown and rich text
6. SSRF
7. File uploads
8. Deserialization and parsers
9. Rules catalog

## 1. Input validation at boundaries

Trust boundaries: HTTP handlers, server actions, GraphQL resolvers, queue consumers, webhooks, file parsers, third-party API responses, and LLM tool-call arguments. At each one:

```ts
const CreateInvoice = z.object({
  customerId: z.string().uuid(),
  currency: z.enum(["EUR", "USD", "GBP"]),                 // enumerated input: exact match
  lines: z.array(z.object({
    description: z.string().min(1).max(500),
    quantityMilli: z.number().int().positive().max(1_000_000_000),
    unitPriceCents: z.number().int().nonnegative().max(100_000_000),
  })).min(1).max(200),                                     // cap arrays
  dueDate: z.string().date(),
}).strict();                                               // reject unknown fields

const input = CreateInvoice.parse(await req.json());       // plus a body-size limit at the server/proxy
if (new Date(input.dueDate) < today()) throw badRequest("dueDate must be in the future"); // semantic check
```

- Allowlist formats; denylisting characters like `'` or `<script>` fails.
- Normalize Unicode (NFC) before comparing or checking uniqueness; watch homoglyphs in usernames and slugs.
- Anchor regexes and avoid nested quantifiers (ReDoS); run user-supplied patterns only on a linear-time engine such as RE2.
- Validate **third-party and LLM output** the same way — it is untrusted input (API10:2023, Unsafe Consumption of APIs).
- Validation narrows input; it never replaces parameterization or output encoding.

## 2. SQL injection

**Rule.** Prepared statements / parameterized queries everywhere. OWASP strongly discourages escaping as a defense.

```ts
// Avoid: string building
await db.query(`SELECT * FROM users WHERE email = '${email}'`);
// Do: parameters
await db.query("SELECT * FROM users WHERE email = $1", [email]);
```

```python
# Avoid
cur.execute(f"SELECT * FROM users WHERE email = '{email}'")
# Do
cur.execute("SELECT * FROM users WHERE email = %s", (email,))
```

**ORM raw-query traps.** Every ORM and query builder has an escape hatch for raw SQL, and several offer both a safe tagged/parameterized form and an "unsafe" string form. The vulnerability is always the same: the SQL string is built with interpolation, concatenation, `format`, or f-strings. In review, search for raw-query calls (names containing `raw`, `unsafe`, `execute`, `query`, `text`, `sql`) and check that user data arrives only as bound parameters.

**Identifiers can't be parameterized.** Table and column names, `ORDER BY` columns, and `ASC`/`DESC` come from an allowlist map:

```ts
const SORTABLE = { created: "created_at", name: "name", total: "total_cents" } as const;
const column = SORTABLE[params.sort as keyof typeof SORTABLE] ?? "created_at";
const dir = params.dir === "asc" ? "ASC" : "DESC";
```

- `LIKE` patterns: escape `%` and `_` in user input if they should be literal, and still bind as a parameter.
- Stored procedures that concatenate strings internally (`EXECUTE`, `exec()`) are injectable too.
- **Least privilege**: the app's database role has no DDL, no superuser, no `BYPASSRLS`; read-only replicas get read-only roles; migrations run under a separate role.

## 3. Other interpreters: shell, templates, NoSQL, logs, headers

- **OS commands**: avoid the shell. Node `execFile("convert", [input, output])`, Python `subprocess.run(["convert", src, dst], check=True)` (no `shell=True`), Go `exec.Command("convert", src, dst)`. Validate arguments that start with `-` (option injection) or pass `--` before positional arguments. Prefer a library over shelling out.
- **Server-side templates**: never compile user input *as* a template; pass it as data with autoescaping on.
- **NoSQL**: schema validation rejects objects where strings are expected (`{"$gt": ""}`, `{"$where": …}`).
- **LDAP / XPath**: use the library's escaping plus allowlists.
- **Logs**: strip CR/LF and delimiters from logged values (log injection, CWE-117); structured JSON logging handles most of it. Logging libraries must never evaluate content (Log4Shell).
- **Headers and redirects**: never build `Location` or other headers from raw input; redirect targets come from an allowlist or are relative paths validated with a URL parser.
- **Code evaluation**: `eval`, `new Function`, `setTimeout("string")`, Python `eval/exec`, `pickle.loads` on untrusted data — none of them, ever, on user or model output.

## 4. XSS and output encoding

**Rule.** Let the framework escape; know and audit its escape hatches.

| Framework | Escapes by default | Escape hatches to audit |
|---|---|---|
| React / JSX | Text and attribute values | `dangerouslySetInnerHTML`; `href`/`src` with `javascript:` or `data:` URLs (not fully blocked); refs writing `innerHTML` |
| Vue | Template interpolation | `v-html`; dynamic `href` |
| Angular | Templates (with built-in sanitization) | `bypassSecurityTrust*` |
| Svelte | Interpolation | `{@html}` |
| Server templates | When autoescape is on | "safe"/raw filters; autoescape disabled |
| DOM APIs | — | `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval` |

- Text goes in with `textContent` / `createTextNode`, never `innerHTML`.
- **URLs from users**: parse with `new URL()` and allow only `http:`, `https:`, `mailto:` before putting them in `href` or `src`.
- **HTML you must render** (CMS, email templates, rich text): sanitize with DOMPurify (or your stack's maintained equivalent) using a restrictive allowlist, keep the sanitizer patched, and sanitize at render time.
- JSON embedded in HTML (`<script>window.__DATA__=…`) must be serialized with `<`, `>`, `&`, U+2028, and U+2029 escaped; frameworks' data-serialization helpers do this.
- **Serving user files**: `Content-Disposition: attachment` for risky types, `X-Content-Type-Options: nosniff`, and ideally a separate, cookieless domain for user content.
- **CSP** is the backstop that contains what escaping misses (`headers-cors-csp.md`); **Trusted Types** (`require-trusted-types-for 'script'`, Chromium) makes DOM sinks reject plain strings.

## 5. Rendering user Markdown and rich text

1. Parse Markdown with raw HTML disabled if you don't need it.
2. Render to HTML, then **sanitize** the HTML (allowlist of tags and attributes).
3. Rewrite links: allowed schemes only; `rel="noopener noreferrer"` and `target` handling for external links; consider `rel="nofollow ugc"` for SEO spam.
4. Images from user content: proxy them or restrict to your storage domain; in **LLM output**, don't auto-load remote images — a model tricked by prompt injection can exfiltrate data through image URLs.

## 6. SSRF

**Features that create SSRF**: import from URL, link previews and unfurling, user-configured webhooks, avatar-by-URL, PDF/HTML renderers (headless browsers fetch `<img>` and `<iframe>`), OIDC discovery with user-supplied issuers, XML parsers with external entities, and **LLM tools that browse or fetch**.

**Case 1: known destinations** (a partner API, your own services) → allowlist exact hosts; compare against the parsed URL, not string prefixes.

**Case 2: arbitrary external URLs** → all of:
1. Parse with a strict URL parser; allow only `http` and `https`; allow only the ports you need.
2. Resolve DNS yourself; reject if **any** A/AAAA record is private, loopback, link-local, unspecified, carrier-grade NAT, or reserved: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `0.0.0.0/8`, `100.64.0.0/10`, `::1`, `fc00::/7`, `fe80::/10`, and IPv4-mapped IPv6 forms of all of these. Use a maintained IP-range library rather than hand-written checks.
3. **Connect to the vetted IP** (pin it) so a second DNS answer cannot switch to an internal address (DNS rebinding).
4. **No redirects**, or re-run the full check on every hop.
5. Timeouts, a response size cap, and no echo of raw responses for blind fetches.
6. Route through an **egress proxy** that enforces the same rules, and block metadata addresses at the host firewall.
7. Cloud metadata: `169.254.169.254` and names like `metadata.google.internal`; on AWS **require IMDSv2** (session-token based) and disable IMDSv1; give instance roles least privilege.

```ts
// Node sketch: validate every resolved address inside the socket's own lookup, so the
// connection uses exactly the addresses that passed the check.
import dns from "node:dns";
import { isPublicUnicastAddress } from "./ip-ranges"; // wraps a maintained IP-range library

function guardedLookup(hostname, options, callback) {
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return callback(err);
    const bad = addresses.find(a => !isPublicUnicastAddress(a.address));
    if (bad) return callback(new Error("blocked destination"));
    const first = addresses[0];
    options.all ? callback(null, addresses) : callback(null, first.address, first.family);
  });
}
// Pass `lookup: guardedLookup` to http(s).request / your HTTP client's agent,
// set redirect: "manual" (or re-validate each Location), a timeout, and a max body size.
```

**Capital One (2019)**: a misconfigured WAF allowed SSRF to the EC2 metadata service (IMDSv1), which returned credentials for an over-privileged role used to copy S3 data on about 100M US and 6M Canadian customers. Every layer above — URL checks, IMDSv2, least-privilege roles — would have broken the chain.

**Webhooks you receive** prove their origin with an HMAC signature or secret token; details in `api-design`.

## 7. File uploads

Pipeline:
1. **Authorize** the upload (who, which tenant, which object) and protect it against CSRF.
2. **Limit size** at the proxy and in the app; for archives and images, also limit decompressed size and pixel count (decompression bombs).
3. **Allowlist extensions** the business needs; verify the real type from magic bytes or by parsing, never from the `Content-Type` header or the extension alone.
4. **Rename** to a server-generated ID; keep the original name only as sanitized display metadata (length and character limits).
5. **Store outside the web root**: a private bucket or a separate storage domain; serve through an authorized handler or short-lived signed URLs.
6. **Scan** (antivirus, sandbox) before marking the file available; use content disarm and reconstruction for PDF and Office files in high-risk contexts.
7. **Re-encode images** server-side to strip metadata (GPS) and neutralize polyglots.
8. **Serve safely**: `Content-Disposition: attachment` for anything that isn't a displayable image, `X-Content-Type-Options: nosniff`, a restrictive CSP (`sandbox`) on the user-content domain.

**Direct-to-bucket presigned uploads**: constrain key prefix (tenant and object), content type, and size in the signed policy; mark the object "pending" until an async scan and type check pass; never trust the client's claim that the upload succeeded.

Parsers (image, PDF, XML, archive libraries) are attack surface: keep them patched and disable XML external entities.

## 8. Deserialization and parsers

- Accept JSON (or Protobuf) validated by a schema; never native object deserialization (`pickle`, Java serialization, PHP `unserialize`, YAML loaders that construct arbitrary objects) on untrusted data.
- Data that must round-trip through the client (state, cursors) is signed (HMAC) or encrypted with authentication, and checked on return.
- XML: disable DTDs and external entities.

## 9. Rules catalog

### Bind values, allowlist identifiers
**Rule.** User data reaches SQL only as bound parameters; identifiers come from a fixed map.
**Apply when.** Any query, including raw-SQL escape hatches in ORMs.
**Do / Avoid.** Do `query("… WHERE id = $1", [id])` and `SORTABLE[param]`. Avoid template strings and f-strings in SQL.
**Why.** Parameters are never parsed as SQL; strings are.

### Sanitize HTML you render, every time
**Rule.** HTML from users, CMSs, or models passes a maintained sanitizer before rendering.
**Apply when.** `dangerouslySetInnerHTML`, `v-html`, `{@html}`, `innerHTML`, email templates.
**Do / Avoid.** Do `DOMPurify.sanitize(html)` with an allowlist. Avoid "it's our own CMS, it's trusted".
**Why.** Stored XSS runs with the viewer's session; the author of the content may not be who you think.

### Pin the vetted address for outbound fetches
**Rule.** Resolve, check every address, connect to the checked address, and don't follow redirects blindly.
**Apply when.** Any server-side request to a URL influenced by users, tenants, or models.
**Do / Avoid.** Do a guarded DNS lookup in the HTTP agent. Avoid checking the hostname string and then letting the client resolve it again.
**Why.** DNS rebinding and redirects turn a validated URL into a request to `169.254.169.254`.

## Sources

- OWASP Input Validation Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- OWASP SQL Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- OWASP Cross Site Scripting Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- OWASP Server-Side Request Forgery Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP LLM Prompt Injection Prevention Cheat Sheet (Markdown/image exfiltration): https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html
- OWASP ASVS 5.0.0 V1, V2, V5: https://github.com/OWASP/ASVS/tree/master/5.0/en
- DOMPurify: https://github.com/cure53/DOMPurify
- Capital One 2019 incident: https://www.capitalone.com/digital/facts2019/
- AWS IMDSv2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html
- Log4Shell: https://logging.apache.org/log4j/2.x/security.html
