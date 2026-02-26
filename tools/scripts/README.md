# tools/scripts

Ad-hoc scripts for the AFENDA-NEXUS monorepo.

Place one-off migration scripts, data fixes, and utility scripts here. These are
**not** published packages — just standalone `.mjs` files.

## Convention

- Name files descriptively: `2026-02-22-backfill-tenant-ids.mjs`
- Scripts run via `node tools/scripts/<name>.mjs`
- No build step required — use plain `.mjs` with ESM imports

## CI Scripts

| Script           | Invoked via   | Purpose                                                                 |
| ---------------- | ------------- | ---------------------------------------------------------------------- |
| `db-check-ci.mjs` | `pnpm db:ci` | Drizzle schema ↔ migration consistency: `drizzle-kit check` + generate dry-run. Fails if schema changes lack migrations. On failure, cleans up generated files and the matching snapshot only (preserves other snapshots). |
