---
package: "@afenda/storage"
root_dir: "packages/storage"
type: library
layer: infrastructure
composite: true
entrypoints: ["src/index.ts"]
public_api: null
exports_map:
  ".": { source: "./src/index.ts", import: "./dist/index.js", types: "./dist/index.d.ts", default: "./src/index.ts" }
dependency_kinds:
  allowed_runtime: ["@afenda/core", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner", "file-type", "zod"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "@types/node", "tsup", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "node:", "@aws-sdk/", "@afenda/core"]
  forbidden_imports: ["drizzle-orm", "fastify", "next", "pino", "postgres", "@afenda/db", "@afenda/platform", "@afenda/contracts", "@afenda/authz"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/storage

## Purpose
S3-compatible object storage abstraction — presigned uploads/downloads, file-type detection, and storage port definitions. Infrastructure layer, depends only on `@afenda/core` for domain primitives.

## Layer Rules
- No framework dependencies (no `next`, `fastify`, `drizzle`).
- All AWS SDK usage is encapsulated behind port interfaces.
- Consumers import from `@afenda/storage` — never from `@aws-sdk/*` directly.
