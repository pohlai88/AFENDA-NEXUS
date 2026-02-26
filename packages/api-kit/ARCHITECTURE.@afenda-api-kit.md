---
package: "@afenda/api-kit"
root_dir: "packages/api-kit"
type: library
layer: infrastructure
composite: true
entrypoints: ["src/index.ts"]
public_api: null
exports_map:
  ".": { source: "./src/index.ts", import: "./dist/index.js", types: "./dist/index.d.ts", default: "./src/index.ts" }
dependency_kinds:
  allowed_runtime: ["@afenda/core", "@afenda/platform", "fastify", "zod"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "tsup", "typescript", "vitest", "@types/node"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "@afenda/platform", "fastify", "zod", "node:"]
  forbidden_imports: ["drizzle-orm", "next", "@afenda/db", "@afenda/finance"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/api-kit

## Purpose

Shared Fastify infrastructure utilities extracted from domain modules. Provides the canonical implementations for identity extraction, error handling, rate limiting, and outbox context — used by all API route handlers and enforced by CI gates.

## Exports

| Export | Purpose |
|---|---|
| `extractIdentity(req)` | Extracts `{ tenantId, userId }` from `req.authUser`. Throws 401 if missing. **The sole identity source in all route handlers.** |
| `registerErrorHandler(app)` | Global Fastify error handler — maps Zod validation errors to 400, Fastify validation errors to 400, and logs unknown errors as 500. |
| `registerBigIntSerializer(app)` | Custom JSON serializer that converts `BigInt` values to strings (required for financial precision). |
| `registerGlobalRateLimit(app, config?)` | Per-tenant sliding-window rate limiter keyed by `req.authUser.tenantId`. Default: 200 req/60s. |
| `rateLimitGuard(config?)` | Lower-level preHandler factory for custom rate-limit scopes. |
| `resetRateLimitState()` | Clears in-memory rate-limit state (test utility). |
| `mapErrorToStatus(error)` | Maps generic `AppError` codes to HTTP status codes. |
| `getOutboxMeta()` | Retrieves `{ correlationId }` from AsyncLocalStorage context for outbox row injection. |

## Layer Rules

- **May import:** `@afenda/core`, `@afenda/platform`, `fastify`, `zod`, Node.js built-ins
- **Must NOT import:** `drizzle-orm`, `@afenda/db`, `@afenda/finance`, `next`
- No domain logic — this package is pure infrastructure plumbing

## CI Gate Enforcement

- `gate:identity-sot` — ensures `extractIdentity` is the sole identity path
- `gate:api-module` — ensures all 44 route files use `extractIdentity` + `requirePermission` + `@afenda/contracts`

## Design Decisions

1. **In-memory rate limiting** with `IRateLimitStore` port — swap to Redis by implementing the interface
2. **Correlation ID propagation** via `AsyncLocalStorage` — `getOutboxMeta()` reads from ALS context set by `tenant-context.ts` middleware
3. **Moved from finance** — `registerErrorHandler` and `registerBigIntSerializer` were originally in `finance/shared/routes/fastify-plugins.ts`, extracted here so all modules share them without depending on finance
