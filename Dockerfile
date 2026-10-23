# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build && pnpm build:seed

# Migration runner needs drizzle-orm + postgres outside the traced standalone bundle.
FROM base AS migrator
RUN mkdir /m && cd /m && npm init -y >/dev/null && npm i --omit=dev drizzle-orm@0 postgres@3 >/dev/null

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 UPLOAD_DIR=/app/uploads
RUN addgroup -S app && adduser -S app -G app && mkdir -p /app/uploads && chown app:app /app/uploads
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/drizzle ./drizzle
COPY --from=build --chown=app:app /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=build --chown=app:app /app/src/db/url.mjs ./src/db/url.mjs
# Self-contained bundle: fills an empty database with starter content and the reading list.
COPY --from=build --chown=app:app /app/scripts/seed.bundle.mjs ./scripts/seed.bundle.mjs
# One-off: docker compose exec -e CONTENTFUL_SPACE_ID=… -e CONTENTFUL_ACCESS_TOKEN=… app node scripts/import-contentful.bundle.mjs
COPY --from=build --chown=app:app /app/scripts/import-contentful.bundle.mjs ./scripts/import-contentful.bundle.mjs
# ESM ignores NODE_PATH, so the migrator's deps sit next to the script.
COPY --from=migrator /m/node_modules ./scripts/node_modules
USER app
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.mjs && node scripts/seed.bundle.mjs && node server.js"]
