---
package: "@afenda/drift-check"
root_dir: "tools/drift-check"
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

# @afenda/drift-check

## Purpose
Monorepo structure validation tools. Validates packages against the manifest and ARCHITECTURE.md governance specs.

## Scripts
- `index.mjs` — Manifest-driven structure validator
- `arch-guard.mjs` — Per-package ARCHITECTURE.md governance enforcer (E1-E15, see docs/ARCHITECTURE-SPEC.md)
- `unused-exports.mjs` — Advisory scanner for unused public API exports across the monorepo

## arch-guard Checks (15)
| Check | What it validates |
|-------|-------------------|
| E1-E5 | Structure: ARCHITECTURE.md exists, fields match, required files/dirs |
| E6-E7 | Dependencies: runtime/dev deps ⊆ allowlist |
| E8-E10 | Imports: forbidden imports, path exceptions, cross-layer |
| E11-E12 | Config: composite flag, exports_map |
| E13 | Circular package dependencies (global DFS) |
| E14 | Public API surface stability (export count) |
| E15 | Port-implementation parity (every I*Repo has a Drizzle* impl) |
