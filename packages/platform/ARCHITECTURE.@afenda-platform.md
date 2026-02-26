---
package: "@afenda/platform"
root_dir: "packages/platform"
type: library
layer: platform
composite: true
entrypoints: ["src/index.ts"]
public_api: null
exports_map:
  ".": { source: "./src/index.ts", import: "./dist/index.js", types: "./dist/index.d.ts", default: "./src/index.ts" }
dependency_kinds:
  allowed_runtime: ["@afenda/core", "pino", "zod", "dotenv", "find-up", "jose"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "@types/node", "pino-pretty", "tsup", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "pino", "zod", "node:async_hooks"]
  forbidden_imports: ["drizzle-orm", "fastify", "next", "postgres", "@afenda/db", "@afenda/modules", "@afenda/finance"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/platform

## Purpose
Config, structured logging, feature flags, env validation. Cross-cutting infrastructure — no domain logic.

## Exports
- `createLogger()`, `Logger`, `CreateLoggerOptions` — structured JSON logging (pino) with service name, mixin-based context injection
- `runWithContext()`, `getContext()`, `RequestContext` — AsyncLocalStorage helpers for automatic correlationId/tenantId/userId injection into every log line
- `loadConfig()`, `AppConfig` — 12-factor env validation (zod)
- `featureFlags()`, `FeatureFlags` — simple feature flag service
