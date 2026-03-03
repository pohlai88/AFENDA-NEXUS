---
package: "@afenda/typescript-config"
root_dir: "packages/typescript-config"
type: config
layer: null
composite: false
entrypoints: []
public_api: null
exports_map:
  "./base.json": "./base.json"
  "./library.json": "./library.json"
  "./nextjs.json": "./nextjs.json"
  "./fastify.json": "./fastify.json"
dependency_kinds:
  allowed_runtime: []
  allowed_dev: []
  allowed_peer: []
enforced_structure:
  required_files: ["package.json", "base.json", "library.json", "nextjs.json", "fastify.json"]
  required_directories: []
boundary_rules:
  allowed_import_prefixes: []
  forbidden_imports: []
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/typescript-config

## Purpose
Shared TypeScript compiler options for the AFENDA-NEXUS monorepo. No runtime code.

## Configs
- **base.json** — Strict shared settings (all packages extend this)
- **library.json** — Library packages: composite:true, declaration:true
- **nextjs.json** — Next.js apps: composite:false, JSX preserve, DOM libs
- **fastify.json** — Fastify apps: composite:false, incremental:true
