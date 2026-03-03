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
  allowed_runtime: ["dotenv", "find-up", "jose", "pino", "zod"]
  allowed_dev: ["@types/node", "pino-pretty", "tsup", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "dotenv", "find-up", "jose", "pino", "zod", "node:"]
  forbidden_imports: ["@afenda/db", "@afenda/finance", "next", "fastify"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/platform

## Purpose

Cross-cutting platform utilities: structured logging (Pino), environment configuration,
JWT helpers (jose), and shared infrastructure primitives used by all apps and modules.
