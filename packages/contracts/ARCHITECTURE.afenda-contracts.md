---
package: "@afenda/contracts"
root_dir: "packages/contracts"
type: library
layer: contracts
composite: true
entrypoints: ["src/index.ts"]
public_api: null
exports_map:
  ".": { source: "./src/index.ts", import: "./dist/index.js", types: "./dist/index.d.ts", default: "./src/index.ts" }
dependency_kinds:
  allowed_runtime: ["@afenda/core", "zod"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "tsup", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "zod"]
  forbidden_imports: ["drizzle-orm", "fastify", "next", "pino", "postgres", "@afenda/db", "@afenda/platform"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/contracts

## Purpose
Zod DTOs shared between frontend and backend. Pure schema definitions — no DB, no HTTP handlers.

## Layer Rules
- Only imports: `@afenda/core`, `zod`
- OpenAPI generation lives in `tools/generators`, not here

## Exports
- `PaginationSchema`, `IdParamSchema` — common request schemas
- `JournalStatusSchema`, `CreateJournalSchema`, `PostJournalSchema` — finance DTOs
