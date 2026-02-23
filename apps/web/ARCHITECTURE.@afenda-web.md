---
package: "@afenda/web"
root_dir: "apps/web"
type: app
layer: deployment
composite: false
entrypoints: ["src/app/layout.tsx"]
public_api: null
exports_map: null
dependency_kinds:
  allowed_runtime: ["@afenda/core", "@afenda/contracts", "next", "react", "react-dom", "tailwindcss"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "@types/react", "@types/react-dom", "typescript"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/app/layout.tsx", "src/app/page.tsx", "package.json", "tsconfig.json"]
  required_directories: ["src/app"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "@afenda/contracts", "next", "react", "tailwindcss"]
  forbidden_imports: ["fastify", "drizzle-orm", "postgres", "pino", "@afenda/db", "@afenda/platform"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/web

## Purpose
Next.js 16 frontend. Server Components + Tailwind v4. Consumes `@afenda/contracts` for type-safe API calls.

## Not a library
Leaf app — NOT consumed by other packages, NOT in root `tsconfig.json` references.
