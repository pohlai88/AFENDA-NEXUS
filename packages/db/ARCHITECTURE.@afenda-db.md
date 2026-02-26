---
package: "@afenda/db"
root_dir: "packages/db"
type: library
layer: infrastructure
composite: true
entrypoints: ["src/index.ts"]
public_api: null
exports_map:
  ".": { source: "./src/index.ts", import: "./dist/index.js", types: "./dist/index.d.ts", default: "./src/index.ts" }
dependency_kinds:
  allowed_runtime: ["drizzle-orm", "postgres", "@neondatabase/api-client"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "@types/node", "drizzle-kit", "tsup", "tsx", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "src/client.ts", "src/session.ts", "src/migrate.ts", "src/types.ts", "src/prepared.ts", "src/seed.ts", "src/schema/index.ts", "src/schema/_common.ts", "src/schema/_enums.ts", "src/schema/_schemas.ts", "src/schema/platform.ts", "src/schema/erp.ts", "src/schema/audit.ts", "src/schema/outbox-table.ts", "src/schema/outbox.ts", "src/schema/relations.ts", "drizzle.config.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src", "src/schema", "drizzle"]
boundary_rules:
  allowed_import_prefixes: ["./", "drizzle-orm", "postgres"]
  forbidden_imports: ["@afenda/platform", "@afenda/modules", "@afenda/finance", "fastify", "next", "pino"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/db

## Purpose
Drizzle schema, migrations, RLS policies, DbSession, tenant context. The ONLY package that touches Drizzle/SQL directly. Neon-optimized (v4): pg_uuidv7 DB-native IDs, protocol-level prepared statements on pooled, SET LOCAL tenant context.

## Layer Rules
- Never imports `@afenda/platform` — logger/config injected by apps via `createDbSession({ db, logger? })`
- Never imports `@afenda/modules/*` — modules import db, not the other way
- No cross-module DB joins (per PROJECT.md §7)

## Exports
- `createPooledClient()`, `createDirectClient()` — Neon pooled/direct connection factories
- `createDbSession()`, `DbSession` — database session with tenant context (SET LOCAL)
- `createPreparedQueries()` — hot-path prepared statements (safe on pooled + direct)
- `schema/*` — Drizzle table definitions (platform, erp, audit schemas)
- `migrate()` — migration runner (direct connection only)
- `seed()` — development seed data
- Inferred types: `Tenant`, `Company`, `GlJournal`, `GlJournalLine`, etc.
