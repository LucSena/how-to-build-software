# <Project name>

<One sentence: what it is and who it is for.>

<Optional: one screenshot or a C4 level-1 diagram.>

## Quickstart

Requirements: <toolchain version file, e.g. `.nvmrc` / `.python-version` / `mise.toml`>, Docker.

```bash
git clone <url> && cd <repo>
<setup command>        # installs deps, creates .env from .env.example, starts services, migrates, seeds
<dev command>          # http://localhost:<port>
```

## Common tasks

| Task | Command |
|---|---|
| Run all checks (what CI runs) | `<check>` |
| Run tests / one test | `<test>` / `<single test example>` |
| Lint / format / typecheck | `<lint>` / `<fmt>` / `<typecheck>` |
| Create a migration / migrate | `<cmd>` / `<cmd>` |

## Configuration

All settings are environment variables validated at startup in `<path to config module>`. See `.env.example` for every key with a description. Secrets come from <secret store> in deployed environments, never from the repo.

## Project layout

```
<top-level folders, one line each>
```

More: `AGENTS.md` (conventions for contributors and agents), `docs/adr/` (decisions).

## Deployment

<How a merge to main reaches production; environments and URLs; how to roll back.>

## Production readiness

- [x] CI: format, lint, typecheck, test, build
- [x] Health checks (`/healthz`, `/readyz`)
- [ ] Error tracking
- [ ] Uptime monitoring
- [ ] Automated backups, restore tested on <date>
- [ ] Dependency update bot

## License

<License name> — see `LICENSE`.
