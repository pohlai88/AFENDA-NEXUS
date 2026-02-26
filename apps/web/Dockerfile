# ─── Stage 1: Base ───────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ─── Stage 2: Dependencies ──────────────────────────────────────────────────
FROM base AS deps

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy all package.json files for workspace resolution
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/authz/package.json ./packages/authz/
COPY packages/db/package.json ./packages/db/
COPY packages/platform/package.json ./packages/platform/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile

# ─── Stage 3: Builder ───────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ ./packages/

# Copy all source
COPY . .

# Build workspace packages first, then the web app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo build --filter=@afenda/web...

# ─── Stage 4: Runner ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

# Next.js standalone server entrypoint
CMD ["node", "apps/web/server.js"]
