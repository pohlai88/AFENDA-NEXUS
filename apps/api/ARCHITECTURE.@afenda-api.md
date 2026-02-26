---
package: "@afenda/api"
root_dir: "apps/api"
type: app
layer: deployment
composite: false
entrypoints: ["src/index.ts"]
public_api: null
exports_map: null
dependency_kinds:
  allowed_runtime: ["@afenda/core", "@afenda/contracts", "@afenda/authz", "@afenda/db", "@afenda/platform", "@afenda/finance", "fastify", "zod", "@fastify/multipart", "@opentelemetry/auto-instrumentations-node", "@opentelemetry/exporter-trace-otlp-proto", "@opentelemetry/resources", "@opentelemetry/sdk-node", "@opentelemetry/semantic-conventions", "ioredis"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "@types/node", "tsup", "tsx", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/", "fastify", "zod"]
  forbidden_imports: ["next", "react"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/api

## Purpose
Fastify REST API server. Composes modules, registers routes, starts HTTP server.

## Not a library
This is a leaf app — it is NOT consumed by other packages and does NOT appear in root `tsconfig.json` references.

## Implementation

### Startup Sequence
1. `loadConfig()` — validates env vars via Zod
2. `createPooledClient()` — Neon PgBouncer pooled connection
3. `createDbSession()` — tenant-scoped transaction wrapper
4. `createFinanceRuntime(session)` — composition root wiring all 13 finance repos
5. Register Fastify plugins (order matters):
   - `registerErrorHandler` — global error serialization
   - `registerBigIntSerializer` — BigInt JSON support
   - `tenantContextPlugin` — extracts `x-tenant-id`, `x-user-id`, `x-correlation-id`; wraps request in `runWithContext()` (AsyncLocalStorage)
   - `requestLoggingPlugin` — structured request/response logging with duration_ms
   - `authPlugin` — HMAC-SHA256 JWT verification (dev: trusts headers)
6. Register routes: health (2), finance (33) = **35 HTTP endpoints**
7. `app.listen()` on `PORT_API`

### Middleware Pipeline
1. **onRequest** (`tenantContextPlugin`) — generates/extracts `x-correlation-id`, establishes `AsyncLocalStorage` scope via `runWithContext()`
2. **onRequest** (`requestLoggingPlugin`) — logs `request started` with method, url, correlationId
3. **preHandler** (`tenantContextPlugin`) — validates `x-tenant-id` (required), `x-user-id` (required for writes); enriches ALS context with `tenantId`/`userId`
4. **preHandler** (`authPlugin`) — verifies JWT in production, trusts headers in dev
5. **Route handler** — all downstream `logger.info()` calls automatically include `correlation_id`, `tenant_id`, `user_id`
6. **onSend** (`tenantContextPlugin`) — echoes `x-correlation-id` response header
7. **onResponse** (`requestLoggingPlugin`) — logs `request completed` with statusCode, duration_ms

### Routes Registered
- **Health**: `GET /health` (liveness), `GET /health/ready` (DB connectivity via `createHealthCheck`)
- **Finance** (33 endpoints): journals (7), accounts (2), periods (6), balance (1), IC transactions (2), IC agreements (2), ledgers (2), FX rates (1), recurring templates (2), budgets (4), reports (4)

### Key Design Decisions
- `apps/api` never imports `drizzle-orm` directly — DB access is via `@afenda/db` utilities
- Health check uses `createHealthCheck(db)` from `@afenda/db` (returns `() => Promise<void>`)
- All finance routes receive `FinanceRuntime` — routes never touch DB directly
- Every log line automatically includes `correlation_id`, `tenant_id`, `user_id` via AsyncLocalStorage mixin — zero manual threading
- `x-correlation-id` header is propagated (or generated) and echoed back for distributed tracing
