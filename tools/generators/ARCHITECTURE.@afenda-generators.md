---
package: "@afenda/generators"
root_dir: "tools/generators"
type: tool
layer: tool
composite: false
entrypoints: ["src/index.mjs"]
public_api: null
exports_map: null
dependency_kinds:
  allowed_runtime: []
  allowed_dev: []
  allowed_peer: []
enforced_structure:
  required_files: ["package.json", "src/index.mjs"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["node:"]
  forbidden_imports: []
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/generators

## Purpose
Scaffolding generators for the AFENDA-NEXUS monorepo. Creates modules, tables, endpoints, and outbox events with correct structure and governance files.

## Scripts
- `gen:module <name>` — New domain module with domain/app/infra layers
- `gen:table <name>` — Drizzle table + migration + RLS policy stub
- `gen:endpoint <module> <verb> <path>` — REST handler stub
- `gen:outbox-event <event>` — Outbox payload type + worker handler stub
