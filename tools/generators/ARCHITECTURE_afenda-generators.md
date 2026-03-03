---
package: '@afenda/generators'
root_dir: 'tools/generators'
type: tool
layer: tool
composite: false
entrypoints: ['src/index.mjs']
public_api: null
exports_map: null
dependency_kinds:
  allowed_runtime: []
  allowed_dev: []
  allowed_peer: []
enforced_structure:
  required_files: ['package.json', 'src/index.mjs']
  required_directories: ['src']
boundary_rules:
  allowed_import_prefixes: ['node:']
  forbidden_imports: []
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/generators

## Purpose

Scaffolding generators for the AFENDA-NEXUS monorepo. Creates modules, tables,
endpoints, outbox events, and frontend feature screens with correct structure
and governance files.

## Scripts — Backend

- `gen:module <name>` — New domain module with domain/app/infra layers
- `gen:table <name>` — Drizzle table + migration + RLS policy stub
- `gen:endpoint <module> <verb> <path>` — REST handler stub
- `gen:outbox-event <event>` — Outbox payload type + worker handler stub

## Scripts — Frontend (`@afenda/web`)

- `gen:screen <module> <entity>` — Full feature screen: queries + actions +
  blocks + route pages (8 files)
- `gen:form <SchemaName>` — RHF + Zod form component from `@afenda/contracts`
  schema
- `gen:table-ui <ViewModelName>` — Data table block with
  StatusBadge/MoneyCell/DateCell formatters

All frontend generators produce drift-compliant code matching
`ARCHITECTURE_afenda-web.md` patterns.
