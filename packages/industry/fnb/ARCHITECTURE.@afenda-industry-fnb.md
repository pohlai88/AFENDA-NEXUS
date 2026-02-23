---
package: "@afenda/industry-fnb"
root_dir: "packages/industry/fnb"
type: library
layer: industry-overlay
composite: true
entrypoints: ["src/public.ts"]
public_api: "src/public.ts"
exports_map:
  ".": { import: "./dist/public.js", types: "./dist/public.d.ts", default: "./src/public.ts" }
dependency_kinds:
  allowed_runtime: ["@afenda/core", "@afenda/finance"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "tsup", "typescript"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/public.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "@afenda/finance"]
  forbidden_imports: ["drizzle-orm", "fastify", "next", "pino", "postgres"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/industry-fnb

## Purpose
F&B industry overlay — extends inventory with batch/lot tracking + expiry date management.
