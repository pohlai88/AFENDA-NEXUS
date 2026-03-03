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
  allowed_dev: ["@types/node", "tsup", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "node:"]
  forbidden_imports: []
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/core

## Purpose

Shared domain primitives, value objects, and base types used across all modules.
No external runtime dependencies — pure TypeScript utilities only.
