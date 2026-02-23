---
package: "@afenda/authz"
root_dir: "packages/authz"
type: library
layer: authorization
composite: true
entrypoints: ["src/index.ts"]
public_api: null
exports_map:
  ".": { source: "./src/index.ts", import: "./dist/index.js", types: "./dist/index.d.ts", default: "./src/index.ts" }
dependency_kinds:
  allowed_runtime: ["@afenda/core"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "tsup", "typescript"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core"]
  forbidden_imports: ["drizzle-orm", "fastify", "next", "pino", "postgres", "@afenda/db", "@afenda/platform"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/authz

## Purpose
Policies, roles, permission evaluation. Pure authorization logic — no DB (infra adapters load policies).

## Exports
- `can()`, `assertCan()` — permission checks
- `Permission`, `Role`, `PolicyContext` — authorization types
- `Action`, `Resource` — permission primitives
