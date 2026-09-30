# Containers

Dockerfile rules with their reasons, base-image choice, a Python example to complement the Node template in `assets/Dockerfile`, graceful shutdown, and runtime hardening. Placeholders `<digest>` and `<version>` must be filled from the registry — never invented.

## Contents
1. Dockerfile rules
2. Base images (as of 2026-09)
3. Python example
4. Build commands and multi-platform
5. Graceful shutdown
6. Health endpoints
7. Runtime hardening
8. Review checklist
9. Rules catalog

## 1. Dockerfile rules

| Rule | Why | Source |
|---|---|---|
| Multi-stage; the runtime stage copies only built artifacts and production dependencies | Smaller image, fewer CVEs, no compilers or build secrets | Docker best practices; Node.js Best Practices 8.1 |
| Minimal, trusted base (official/verified, slim, distroless, hardened) | Attack surface; the Microsoft playbook suggests removing shells, curl/wget, netcat, and compilers from production images | Docker docs; playbook container scanning |
| Pin base by version **and** digest; bump with Dependabot (`package-ecosystem: docker`) | Tags are mutable; audit trail; patches arrive as PRs | Docker "Pin base image versions" |
| Rebuild often with `--pull` | Pick up patched base layers | Docker "Rebuild your images often" |
| Never `latest` | Non-deterministic builds | Node.js Best Practices 8.9; hadolint DL3007 |
| `.dockerignore` for `.git`, `.env*`, `node_modules`, `.aws`, `.npmrc`, build output | Secret leaks and slow contexts | Node.js Best Practices 8.4 |
| Copy dependency manifests → install → copy source; cache mounts for package managers | Layer reuse | Docker cache docs; Node.js Best Practices 8.8 |
| No secrets in `ARG`, `ENV`, or copied files; use `RUN --mount=type=secret` or `--mount=type=ssh` | Docker: build arguments and environment variables are inappropriate for secrets because they persist in the final image | Docker build secrets |
| Non-root `USER` with explicit UID/GID; no sudo | Privilege | Docker USER guidance; hadolint DL3002; OWASP Docker rule 2 |
| Exec-form `CMD`/`ENTRYPOINT`; app is PID 1 or behind `tini`/`--init`; no `npm start` wrapper | SIGTERM reaches the app | Node.js Best Practices 8.2; hadolint DL3025 |
| One concern per container; no PM2/cluster managers inside | The orchestrator handles restarts and replicas | Docker "Decouple applications"; Node.js Best Practices 8.3 |
| Memory limit at runtime; language heap set below it | Controlled GC instead of OOM kills | Node.js Best Practices 8.7 |
| Production dependencies only; clean package caches | Size and attack surface | Node.js Best Practices 8.5, 8.13 |
| `COPY` not `ADD`; pin OS package versions; `SHELL ["/bin/bash","-o","pipefail","-c"]` when piping; clean apt lists | Reproducibility | hadolint DL3020, DL3008, DL4006, DL3009 |
| `HEALTHCHECK` for Compose/Swarm; Kubernetes ignores it and uses probes | Readiness-gated traffic | Docker reference |
| OCI labels: source, revision (git SHA), version | Traceability from running container to commit | OCI image annotations |
| hadolint in CI; scan the final image; SBOM and provenance | Mistakes and OS-level CVEs | Node.js Best Practices 8.12, 8.15 |

## 2. Base images (as of 2026-09)

| Option | Use when |
|---|---|
| Official `-slim` (Debian-based) | Default: glibc compatibility, a shell for debugging, small enough |
| Distroless (e.g., Google distroless) | Production images where you do not need a shell; debug with ephemeral debug containers |
| Hardened images: Docker Hardened Images (free under Apache-2.0 since December 2025, with SBOMs and provenance), Chainguard (Wolfi-based) | You want near-zero CVE baselines and signed provenance without maintaining your own |
| Alpine | Size matters and you have tested musl behavior (DNS resolution and native modules differ from glibc) |
| Full images (`node:22`, `python:3.13`) | Build stages only |

Whatever you choose: pin tag and digest, and let a bot open update PRs.

## 3. Python example

pip with a hashed lock file; a virtual environment copied into a slim runtime. If you use uv or Poetry, follow that tool's Docker guide for the build stage and keep the same runtime stage.

```dockerfile
# syntax=docker/dockerfile:1
ARG PY_IMAGE=python:3.13-slim@sha256:<digest>

FROM ${PY_IMAGE} AS build
WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY requirements.lock ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --require-hashes -r requirements.lock
COPY src/ ./src/

FROM ${PY_IMAGE} AS runtime
RUN groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --no-log-init app
WORKDIR /app
COPY --from=build /opt/venv /opt/venv
COPY --from=build --chown=app:app /app/src ./src
ENV PATH="/opt/venv/bin:$PATH" PYTHONUNBUFFERED=1
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV APP_VERSION=$GIT_SHA
USER 10001
EXPOSE 8080
# Exec form: gunicorn is PID 1 and receives SIGTERM; graceful timeout below the platform grace period
CMD ["gunicorn", "src.app.wsgi:application", "--bind", "0.0.0.0:8080", "--graceful-timeout", "25"]
```

## 4. Build commands and multi-platform

```bash
docker build \
  --secret id=npmrc,src="$HOME/.npmrc" \
  --build-arg GIT_SHA="$(git rev-parse HEAD)" \
  --pull -t registry.example.com/app:"$(git rev-parse HEAD)" .
```
- `GIT_SHA` is not secret, so a build arg is fine; the npm token is a secret mount and never lands in a layer.
- Mixed architectures (arm64 laptops, amd64 servers): `docker buildx build --platform linux/amd64,linux/arm64 …`, or build only the production architecture in CI and test it there.

## 5. Graceful shutdown

Sequence on SIGTERM, all within the platform's grace period (Kubernetes `terminationGracePeriodSeconds`, default 30 s, then SIGKILL):

1. Mark not-ready (readiness returns 503).
2. Stop accepting new connections; let in-flight requests finish with a deadline.
3. Close idle keep-alive connections.
4. Stop job consumers: stop fetching, finish or release leases.
5. Flush telemetry.
6. Close database pools.
7. Exit 0 (or 1 if the hard deadline fires).

```ts
const server = app.listen(env.PORT);
let shuttingDown = false;
app.get("/readyz", (_req, res) => res.status(shuttingDown ? 503 : 200).end());
app.get("/livez", (_req, res) => res.status(200).end());   // process is alive; no dependency checks

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down");
  const hardStop = setTimeout(() => process.exit(1), 25_000).unref(); // below the grace period
  server.close();                     // stop accepting; in-flight requests continue
  server.closeIdleConnections?.();    // Node >= 18.2
  await worker?.close();              // stop pulling jobs; let current ones finish
  await telemetry.shutdown();         // flush spans and metrics
  await db.end();
  clearTimeout(hardStop);
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
```

On Kubernetes, endpoint removal and SIGTERM happen concurrently, so a pod can still receive new requests after SIGTERM. Add a short `preStop` sleep so load balancers drop the pod first, and size `terminationGracePeriodSeconds ≥ preStop + drain + buffer` (see `assets/k8s-deployment.yaml`).

## 6. Health endpoints

| Endpoint | Answers | Checks | Failing means |
|---|---|---|---|
| `/livez` (liveness) | Is the process wedged? | Nothing external | Restart the container |
| `/readyz` (readiness) | Can it take traffic now? | Warm-up done, not shutting down; optionally critical local dependencies | Remove from load balancing |
| Startup probe | Has a slow boot finished? | Same as liveness, generous threshold | Keeps liveness from killing a slow start |

Never check the database in liveness: a database blip would restart every replica at once, turning a brief dependency problem into a full outage.

## 7. Runtime hardening

From the OWASP Docker Security Cheat Sheet and Kubernetes `securityContext`:
- Run as non-root (`runAsNonRoot: true`, explicit UID); `allowPrivilegeEscalation: false`; drop all capabilities and add back only what is needed.
- Read-only root filesystem; writable `emptyDir` or tmpfs only where needed.
- `seccompProfile: RuntimeDefault`.
- Never mount the Docker socket into a container — it is root on the host.
- Never run `--privileged` containers in CI pipelines unless isolated on dedicated, ephemeral hosts.
- Resource limits on every container (memory at minimum).
- On a plain VM: Docker-published ports bypass host firewalls such as UFW — bind to `127.0.0.1` behind a proxy or configure the firewall accordingly.

## 8. Review checklist

- [ ] Base pinned by tag and digest (real digest, or a placeholder flagged to the user).
- [ ] Multi-stage; runtime stage has no build tools or dev dependencies.
- [ ] Non-root `USER` with explicit UID.
- [ ] Exec-form `CMD`; SIGTERM handled; shutdown finishes within the grace period.
- [ ] No secrets in `ARG`/`ENV`/`COPY`; secret mounts for private registries.
- [ ] `.dockerignore` covers `.env*`, `.git`, credentials files.
- [ ] hadolint clean; image scanned; SBOM and provenance produced.
- [ ] Revision label and `APP_VERSION` set from the git SHA.

## 9. Rules catalog

### Make the app PID 1 or use an init
**Rule.** Start the app with exec-form `CMD` so it receives signals directly, or use `tini`/`--init`.
**Apply when.** Every container image.
**Do / Avoid.** Do `CMD ["node","dist/server.js"]`. Avoid `CMD npm start` or shell-form `CMD node dist/server.js`.
**Why.** Shell and npm wrappers do not forward SIGTERM; the platform waits out the grace period and SIGKILLs, dropping in-flight requests.

### Keep secrets out of image layers
**Rule.** Pass build-time credentials only through BuildKit secret or SSH mounts.
**Apply when.** Private registries, private Git dependencies, licensed packages.
**Do / Avoid.** Do `RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci`. Avoid `ARG NPM_TOKEN` or `COPY .npmrc`.
**Why.** Every layer and build argument is retrievable from the image history by anyone who can pull it.

## Sources

- Docker docs: Building best practices, Build secrets, Multi-stage builds, Cache optimization, Multi-platform builds — https://docs.docker.com/build/building/best-practices/ , https://docs.docker.com/build/building/secrets/ , https://docs.docker.com/build/building/multi-stage/ , https://docs.docker.com/build/cache/optimize/ , https://docs.docker.com/build/building/multi-platform/
- Node.js Best Practices, Docker section (8.1–8.15) and graceful shutdown — https://github.com/goldbergyoni/nodebestpractices
- hadolint rules — https://github.com/hadolint/hadolint
- OWASP Docker Security Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
- Microsoft Code-With Engineering Playbook, dependency and container scanning — https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/CI-CD/dev-sec-ops
- Docker Hardened Images announcement — https://www.docker.com/blog/docker-hardened-images-for-every-developer/
- Kubernetes: container lifecycle hooks; resource management — https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/ , https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
