# syntax=docker/dockerfile:1
#
# Production image for a Node.js (TypeScript) HTTP service.
# Replace every <digest> with the real value from the registry (e.g. `docker buildx imagetools inspect node:22-bookworm-slim`)
# — never invent one. Let Dependabot (package-ecosystem: docker) keep tag + digest current.
#
# Build (drop the --secret line if you do not use a private registry):
#   docker build --pull \
#     --secret id=npmrc,src="$HOME/.npmrc" \
#     --build-arg GIT_SHA="$(git rev-parse HEAD)" \
#     -t registry.example.com/app:"$(git rev-parse HEAD)" .
# Copy assets/dockerignore to .dockerignore next to this file.

# Slim base pinned by tag AND digest (Dockerfiles have no inline comments, so notes go on their own lines).
# Consider a hardened or distroless image for the runtime stage.
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:<digest>

# ---- deps: install all dependencies from the lockfile (cached) ----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci

# ---- build: compile, then drop dev dependencies ----
FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime: only what runs in production ----
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Official node images ship a non-root "node" user (uid 1000). Files are owned by root and read-only to the app.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA \
      org.opencontainers.image.source="https://github.com/<org>/<repo>"
ENV APP_VERSION=$GIT_SHA

USER node
EXPOSE 8080

# Used by Docker/Compose/Swarm only; Kubernetes ignores HEALTHCHECK and uses probes (see k8s-deployment.yaml).
# Uses Node's built-in fetch, so no curl is needed in the image.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8080/livez').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# Exec form: node is PID 1 and receives SIGTERM directly (no `npm start`, no shell).
# The app must handle SIGTERM: fail readiness, drain in-flight requests, close pools, exit before the grace period.
# Heap below the container memory limit (here: 384 MiB for a 512 MiB limit).
CMD ["node", "--max-old-space-size=384", "dist/server.js"]
