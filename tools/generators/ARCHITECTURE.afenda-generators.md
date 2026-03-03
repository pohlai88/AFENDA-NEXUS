---
package: "@afenda/generators"
root_dir: "tools/generators"
type: tool
layer: tool
composite: false
entrypoints: []
public_api: null
exports_map: {}
dependency_kinds:
  allowed_runtime: []
  allowed_dev: []
  allowed_peer: []
enforced_structure:
  required_files: ["package.json"]
  required_directories: []
boundary_rules:
  allowed_import_prefixes: ["node:"]
  forbidden_imports: []
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/generators

## Purpose

Code generation tooling for the monorepo. Provides scaffolding scripts for
creating new slices, event handlers, schema tables, and API route modules
following established conventions.
