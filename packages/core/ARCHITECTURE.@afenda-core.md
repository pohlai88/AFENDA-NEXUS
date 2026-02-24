---
package: "@afenda/core"
root_dir: "packages/core"
type: library
layer: domain-primitives
composite: true
entrypoints: ["src/index.ts"]
public_api: null
exports_map:
  ".": { source: "./src/index.ts", import: "./dist/index.js", types: "./dist/index.d.ts", default: "./src/index.ts" }
dependency_kinds:
  allowed_runtime: []
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "tsup", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./"]
  forbidden_imports: ["drizzle-orm", "fastify", "next", "pino", "postgres", "@afenda/db", "@afenda/platform", "@afenda/contracts", "@afenda/authz"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/core

## Purpose
IDs, money, time, Result<T,E>, branded types, domain errors. The innermost layer — zero external dependencies.

## Layer Rules
- Zero external framework imports
- No DB, no HTTP, no side effects
- No imports from any other @afenda package

## Exports
- `Result<T, E>`, `ok()`, `err()` — typed error handling
- `TenantId`, `CompanyId`, `UserId`, `LedgerId` — branded ID types
- `Money`, `money()` — financial primitives
- `DateRange`, `dateRange()` — date utilities
- `AppError`, `NotFoundError`, `ValidationError`, `AuthorizationError` — error hierarchy
