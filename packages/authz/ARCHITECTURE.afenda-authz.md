---
package: "@afenda/authz"
root_dir: "packages/authz"
type: library
layer: authorization
composite: true
entrypoints: ["src/index.ts", "src/auth.ts", "src/permissions.ts"]
public_api: null
exports_map:
  ".": { source: "./src/index.ts", import: "./dist/index.js", types: "./dist/index.d.ts", default: "./src/index.ts" }
  "./auth": { source: "./src/auth.ts", import: "./dist/auth.js", types: "./dist/auth.d.ts", default: "./src/auth.ts" }
  "./permissions": { source: "./src/permissions.ts", import: "./dist/permissions.js", types: "./dist/permissions.d.ts", default: "./src/permissions.ts" }
dependency_kinds:
  allowed_runtime: ["@afenda/core", "@afenda/db", "better-auth", "@better-auth/passkey", "@simplewebauthn/server", "drizzle-orm", "resend"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "@better-auth/cli", "@types/node", "tsup", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "@afenda/db", "better-auth", "@better-auth/passkey", "@simplewebauthn/server", "drizzle-orm", "resend"]
  forbidden_imports: ["fastify", "next", "pino", "postgres", "@afenda/platform"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/authz

## Purpose
Policies, roles, permission evaluation. Pure authorization logic — no DB (infra adapters load policies).

## Exports
- `can()`, `assertCan()` — permission checks
- `Permission`, `Role`, `PolicyContext` — authorization types
- `Action`, `Resource` — permission primitives
