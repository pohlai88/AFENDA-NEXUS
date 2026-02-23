---
package: "@afenda/eslint-config"
root_dir: "packages/eslint-config"
type: config
layer: null
composite: false
entrypoints: ["index.js"]
public_api: null
exports_map:
  ".": "./index.js"
dependency_kinds:
  allowed_runtime: []
  allowed_dev: ["eslint", "typescript-eslint"]
  allowed_peer: []
enforced_structure:
  required_files: ["package.json", "index.js"]
  required_directories: []
boundary_rules:
  allowed_import_prefixes: []
  forbidden_imports: []
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/eslint-config

## Purpose
Shared ESLint flat config for the AFENDA-NEXUS monorepo. Enforces module boundary rules from PROJECT.md §2/§7.

## Configs
- **index.js** — Base flat config with ignores, TypeScript rules, and boundary enforcement

## Rules

| Rule | Scope | What it enforces |
|------|-------|-----------------|
| `@typescript-eslint/no-unused-vars` | All `.ts`/`.tsx` | Warns on unused vars (ignores `_`-prefixed args) |
| `no-console` | All `.ts`/`.tsx` | Warns on `console.*` except `warn`/`error` |
| **CIG-04** `no-restricted-imports` | `**/routes/**`, `**/route.{ts,tsx}`, `**/app/api/**`, `**/page.{ts,tsx}` | Bans direct imports of `@afenda/db`, `drizzle-orm`, `drizzle-kit` from route/handler/page files. DB access must go through composition roots. |
