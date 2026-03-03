---
package: "@afenda/typescript-config"
root_dir: "packages/typescript-config"
type: config
layer: null
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
  allowed_import_prefixes: []
  forbidden_imports: []
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/typescript-config

## Purpose

Shared TypeScript `tsconfig.json` base configurations extended by all packages
and apps. Provides strict type-checking settings, path aliases, and project
references configuration.
