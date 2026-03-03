---
package: "@afenda/drift-check"
root_dir: "tools/drift-check"
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
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["node:"]
  forbidden_imports: []
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/drift-check

## Purpose

Architecture governance tooling. Implements the `arch-guard.mjs` CLI that
validates every managed package against its `ARCHITECTURE.*.md` frontmatter —
checking file structure, dependency boundaries, import rules, and more.
