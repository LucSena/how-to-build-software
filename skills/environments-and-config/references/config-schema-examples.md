# Config Schema Examples

Typed configuration that is parsed once at startup and fails fast. Library APIs below are as of 2026-09; check the library's docs before relying on a detail.

## Contents
1. Shape of a good config module
2. TypeScript: t3-env with Zod v4
3. TypeScript: why plain `z.parse(process.env)` is not enough
4. Node without a framework: envalid
5. Python: pydantic-settings
6. Other languages
7. `.env.example`
8. CI checks
9. Frontend: one artifact, many environments
10. Rules catalog

## 1. Shape of a good config module

- One file owns reading the environment; it exports an immutable, typed object.
- Every key has a type, bounds, and either "required" or a *safe* default. Secrets never have defaults.
- Empty strings count as missing.
- Cross-field invariants are checked after per-key parsing.
- On failure: list every invalid key with the reason, never the value, and exit non-zero.
- On success: log a fingerprint (key names, non-secret values, secret hashes, release version).
- A lint rule or CI grep forbids direct environment access anywhere else.

## 2. TypeScript: t3-env with Zod v4

t3-env (`@t3-oss/env-core`, plus framework packages such as `@t3-oss/env-nextjs`) validates server and client variables separately, enforces a client prefix, and throws a descriptive error if server-only variables are read on the client. It accepts any Standard Schema validator (Zod, Valibot, ArkType).

```ts
// src/env.ts — the ONLY file that reads process.env
import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  server: {
    APP_ENV: z.enum(["local", "test", "preview", "staging", "production"]), // telemetry label, not for branching
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    DATABASE_URL: z.url(),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    SESSION_SECRET: z.string().min(32),               // no default, ever
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
    PAYMENTS_MODE: z.enum(["sandbox", "live"]),
    ENABLE_SIGNUPS: z.stringbool().default(true),     // NOT z.coerce.boolean(): "false" would become true
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
  },
  clientPrefix: "PUBLIC_",
  client: {
    PUBLIC_API_BASE_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,                        // FOO= counts as missing
});

// Invariants a per-key schema cannot express
if (env.PAYMENTS_MODE === "live" && !env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
  throw new Error("PAYMENTS_MODE=live requires a live Stripe key");
}
if (env.APP_ENV !== "production" && env.PAYMENTS_MODE === "live") {
  throw new Error("Only production may use live payments");
}
```

Framework notes (from the t3-env docs):
- **Next.js** only inlines `process.env.X` that it can see statically, so `runtimeEnv` must list the keys explicitly (newer Next versions let you list only client keys via `experimental__runtimeEnv`). Import the env file in `next.config.ts` so validation also runs at **build time**.
- Defining client and server schemas in one file ships the **schema** (variable names) to the client bundle. If names are sensitive, split into `env/server.ts` and `env/client.ts`.
- `skipValidation` exists for special builds (e.g., linting in Docker without secrets). Never set it in a deployed runtime.

## 3. TypeScript: why plain `z.parse(process.env)` is not enough

The naive pattern — `const env = z.object({...}).parse(process.env)` plus a global type augmentation of `process.env` — has problems the t3-env docs list:
- Transforms and defaults apply to the parsed object, not to `process.env`, so code that still reads `process.env.PORT` gets the raw string while the types claim a number.
- Frameworks tree-shake or inline env access differently on server and client.
- Client-side validation failures surface as confusing runtime errors.

If you do not use t3-env, still export the parsed object and forbid `process.env` elsewhere.

## 4. Node without a framework: envalid

```ts
import { cleanEnv, str, port, url } from "envalid";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "test", "production"] }),
  PORT: port({ default: 8080 }),
  DATABASE_URL: url(),
  SESSION_SECRET: str(),                              // required; no default
  LOG_LEVEL: str({ choices: ["debug", "info", "warn", "error"], default: "info" }),
});
```

`cleanEnv` returns an immutable object and, by default, reports all invalid keys and exits. `devDefault` supplies a value only when `NODE_ENV` is set and is not `production` — acceptable for things like a local mail host, never for secrets.

## 5. Python: pydantic-settings

```python
# app/settings.py
from typing import Literal
from pydantic import AnyUrl, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",              # local convenience; real envs inject variables or files
        secrets_dir="/run/secrets",   # one file per field, as Docker/Kubernetes mount them
        frozen=True,
    )

    env: Literal["local", "test", "preview", "staging", "production"]
    port: int = Field(8080, ge=1, le=65535)
    log_level: Literal["debug", "info", "warning", "error"] = "info"
    database_url: AnyUrl
    session_secret: SecretStr = Field(min_length=32)   # no default; hidden in repr and logs
    payments_mode: Literal["sandbox", "live"]

    @model_validator(mode="after")
    def live_only_in_prod(self):
        if self.payments_mode == "live" and self.env != "production":
            raise ValueError("live payments only in production")
        return self

settings = Settings()  # instantiate at import → the process fails at startup on bad config
```

Notes:
- `SecretStr` keeps the value out of `repr` and logs; call `.get_secret_value()` only at the point of use.
- Check how `env_prefix` interacts with file names in `secrets_dir` for your version before relying on it.
- Django: the HackSoft Django Styleguide pattern keeps one `config/env.py`, gates each integration behind a `USE_<INTEGRATION>` setting defaulting to off, and fails when an enabled integration lacks its required settings. Production differences come from environment values, not from a `production.py`-only block.

## 6. Other languages

Go, JVM (Spring Boot configuration properties with validation), .NET (options with startup validation), and Rust all have equivalent "bind environment into a typed struct, validate, fail at start" libraries. Apply the same rules: one module, typed struct, no secret defaults, validate before serving, never print values.

## 7. `.env.example`

```dotenv
# Copy to .env (git-ignored). Every key here exists in src/env.ts and vice versa (CI checks this).
APP_ENV=local
PORT=8080
LOG_LEVEL=debug
DATABASE_URL=postgres://app:app@localhost:5432/app      # matches compose.yaml
DB_POOL_MAX=5
SESSION_SECRET=local-only-change-me-at-least-32-characters
STRIPE_SECRET_KEY=sk_test_replace_me                    # Stripe TEST key only
PAYMENTS_MODE=sandbox
ENABLE_SIGNUPS=true
PUBLIC_API_BASE_URL=http://localhost:8080
```

- Values are obviously fake or local-only. Never paste a real key "temporarily".
- `.gitignore`: `.env`, `.env.local`, `.env.*.local`. Do not commit `.env` even if a framework template suggests it (t3-env's docs take the same position).
- `.dockerignore`: `.env*` with `!.env.example`.

## 8. CI checks

- **Key sync:** a script compares the schema's keys to `.env.example` keys and fails on any difference.
- **No direct env access:** grep or lint for `process.env` / `os.environ` outside the config module.
- **Per-environment config check:** for each environment's non-secret config (from IaC or platform files), run the schema in "validate only" mode so a missing key fails the PR, not the deploy.
- **Build-time validation** for frontend public variables.
- **Secret scan** (see `secrets.md`).

## 9. Frontend: one artifact, many environments

Bundlers inline public variables at build time, which breaks "build once, promote everywhere". Options:

| Option | Use when |
|---|---|
| Runtime config: fetch `/config.json` at boot or inject `window.__ENV` from the server | You want one artifact promoted through all environments (default for containers) |
| Build per environment from the same commit | Static hosting with platform-managed builds (previews built by the platform); accept it, but pin the commit |

Either way, public config contains only public values.

## 10. Rules catalog

### Crash at startup on invalid config
**Rule.** Parse and validate all config before binding a port or consuming a queue; exit non-zero listing every bad key.
**Apply when.** Any service, worker, CLI, or serverless handler.
**Do / Avoid.** Do fail with `Invalid config: DATABASE_URL (not a URL), SESSION_SECRET (missing)`. Avoid lazy `getConfig("X")` calls deep in request handlers.
**Why.** Fail-fast turns a runtime data-corrupting failure into a deploy-time readiness failure that the rollout gate stops.

### Give secrets no default
**Rule.** Secret and security-relevant keys are required in every environment, with no fallback.
**Apply when.** Signing keys, passwords, API keys, auth toggles, CORS origins, TLS verification switches.
**Do / Avoid.** Do provide local values via `.env` copied from `.env.example`. Avoid `process.env.JWT_SECRET || "dev"`.
**Why.** Defaults are silent; the one environment where the variable is missing is usually production.

### Parse booleans from an explicit set
**Rule.** Accept only `true/false` (optionally `1/0`, `yes/no`) and reject anything else.
**Apply when.** Any boolean from an env var or query string.
**Do / Avoid.** Do use `z.stringbool()` or a transform. Avoid `Boolean(value)` and `z.coerce.boolean()`.
**Why.** Every non-empty string, including `"false"`, is truthy in JavaScript.

## Sources

- T3 Env docs — https://env.t3.gg/docs/introduction , https://env.t3.gg/docs/core , recipes page (boolean coercion warning) — repo https://github.com/t3-oss/t3-env
- envalid README — https://github.com/af/envalid
- pydantic-settings — https://docs.pydantic.dev/latest/concepts/pydantic_settings/
- Node.js Best Practices §1.4 (config: typed, validated, fail fast) — https://github.com/goldbergyoni/nodebestpractices
- Microsoft Code-With Engineering Playbook, Continuous Integration (configuration validation) — https://github.com/microsoft/code-with-engineering-playbook/blob/main/docs/CI-CD/continuous-integration.md
- HackSoft Django Styleguide (settings and env) — https://github.com/HackSoftware/Django-Styleguide
- The Twelve-Factor App, Config — https://12factor.net/config
