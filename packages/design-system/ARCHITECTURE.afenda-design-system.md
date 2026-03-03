---
package: "@afenda/design-system"
root_dir: "packages/design-system"
type: library
layer: infrastructure
composite: false
entrypoints: []
public_api: null
exports_map: {}
dependency_kinds:
  allowed_runtime: []
  allowed_dev: ["tailwindcss"]
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

# @afenda/design-system

## Purpose

Shared Tailwind CSS design tokens, theme configuration, and base styling utilities
consumed by the web app and any future UI surfaces.
