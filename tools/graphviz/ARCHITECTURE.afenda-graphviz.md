---
package: "@afenda/graphviz"
root_dir: "tools/graphviz"
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

# @afenda/graphviz

## Purpose

Dependency graph visualization tools for the monorepo. Generates Graphviz DOT
files and rendered SVGs showing package-level dependency relationships,
import cycles, and layer violations.
