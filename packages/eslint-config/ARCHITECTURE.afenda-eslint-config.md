---
package: "@afenda/eslint-config"
root_dir: "packages/eslint-config"
type: config
layer: null
composite: false
entrypoints: []
public_api: null
exports_map: {}
dependency_kinds:
  allowed_runtime: []
  allowed_dev: ["eslint", "eslint-plugin-react", "eslint-plugin-react-hooks", "typescript-eslint"]
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

# @afenda/eslint-config

## Purpose

Shared ESLint flat configuration for all packages and apps in the monorepo.
Provides consistent linting rules including React and TypeScript-ESLint plugins.
