---
package: "@afenda/db"
root_dir: "packages/db"
type: library
layer: infrastructure
composite: true
entrypoints: ["src/index.ts"]
public_api: null
exports_map:
  ".": { source: "./src/index.ts", import: "./dist/index.js", types: "./dist/index.d.ts", default: "./src/index.ts" }
dependency_kinds:
  allowed_runtime: ["@neondatabase/api-client", "drizzle-orm", "postgres"]
  allowed_dev: ["@types/node", "drizzle-kit", "drizzle-seed", "tsup", "tsx", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json"]
  required_directories: ["src", "drizzle"]
boundary_rules:
  allowed_import_prefixes: ["./", "drizzle-orm", "postgres", "node:"]
  forbidden_imports: ["@afenda/platform", "@afenda/finance"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/db

## Purpose

Drizzle ORM schema definitions, migration management, and database session utilities.
All 145 tables across `erp`, `platform`, and `audit` schemas are defined here.
Strict isolation: never imports application-layer packages.
