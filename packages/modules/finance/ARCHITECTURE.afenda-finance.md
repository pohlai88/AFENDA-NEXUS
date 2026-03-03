---
package: "@afenda/finance"
root_dir: "packages/modules/finance"
type: library
layer: module
composite: true
entrypoints: ["src/public.ts", "src/infra.ts"]
public_api: "src/public.ts"
exports_map:
  ".": { source: "./src/public.ts", import: "./dist/public.js", types: "./dist/public.d.ts", default: "./src/public.ts" }
  "./infra": { source: "./src/infra.ts", import: "./dist/infra.js", types: "./dist/infra.d.ts", default: "./src/infra.ts" }
dependency_kinds:
  allowed_runtime: ["drizzle-orm", "fastify", "zod"]
  allowed_dev: ["fast-check", "tsup", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/public.ts", "package.json", "tsconfig.json"]
  required_directories: ["src", "src/shared", "src/slices"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "@afenda/db", "@afenda/platform", "@afenda/contracts", "@afenda/authz", "drizzle-orm", "fastify", "zod", "node:"]
  forbidden_imports: ["next", "@afenda/web"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/finance

## Purpose

Core finance domain module implementing AP, AR, GL, supplier portal, and related
business logic across vertical slices. Exports public API via `src/index.ts` and
infrastructure implementations via `src/infra.ts`.

## Slice Architecture

```
src/
  shared/         # Events, types, utils shared across slices
  slices/
    ap/           # Accounts Payable
    ar/           # Accounts Receivable
    gl/           # General Ledger
    portal/       # Supplier Portal domain
```
