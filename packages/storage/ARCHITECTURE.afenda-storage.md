---
package: "@afenda/storage"
root_dir: "packages/storage"
type: library
layer: infrastructure
composite: false
entrypoints: ["src/index.ts"]
public_api: null
exports_map:
  ".": { source: "./src/index.ts", import: "./dist/index.js", types: "./dist/index.d.ts", default: "./src/index.ts" }
dependency_kinds:
  allowed_runtime: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner", "file-type", "zod"]
  allowed_dev: ["@types/node", "tsup", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner", "file-type", "zod", "node:"]
  forbidden_imports: ["@afenda/db", "@afenda/finance", "next", "fastify"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/storage

## Purpose

Object storage abstraction layer (Cloudflare R2/S3-compatible). Provides
`IObjectStore` port interface and concrete `R2ObjectStore` implementation
for document upload, retrieval, presigned URLs, and deletion.
