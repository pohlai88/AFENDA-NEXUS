#!/usr/bin/env node
/**
 * gen:table <name> — Scaffold a Drizzle table + migration + RLS policy stub.
 *
 * Creates: schema definition, migration file, RLS policy, typed repository stub.
 *
 * Usage: pnpm gen:table invoice
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const name = process.argv[2];
if (!name) {
  console.error("Usage: pnpm gen:table <name>");
  process.exit(1);
}

const root = process.cwd();
const snakeCase = name.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
const camelCase = name.replace(/([-_][a-z])/g, (g) => g[1].toUpperCase());
const PascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);

// Schema file in packages/db/src/schema/
const schemaDir = join(root, "packages", "db", "src", "schema");
mkdirSync(schemaDir, { recursive: true });

const schemaFile = join(schemaDir, `${snakeCase}.ts`);
if (existsSync(schemaFile)) {
  console.error(`Schema file already exists: ${schemaFile}`);
  process.exit(1);
}

writeFileSync(
  schemaFile,
  `import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const ${camelCase} = pgTable(
  "${snakeCase}",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    // TODO: Add columns for ${name}
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

// RLS Policy — tenant isolation
// ALTER TABLE ${snakeCase} ENABLE ROW LEVEL SECURITY;
// ALTER TABLE ${snakeCase} FORCE ROW LEVEL SECURITY;
// CREATE POLICY tenant_isolation ON ${snakeCase}
//   USING (tenant_id = current_setting('app.tenant_id')::uuid);
`,
);

console.log(`Created schema: ${schemaFile}`);

// Migration stub
const timestamp_ = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
const migrationDir = join(root, "packages", "db", "migrations");
mkdirSync(migrationDir, { recursive: true });

const migrationFile = join(migrationDir, `${timestamp_}_create_${snakeCase}.sql`);
writeFileSync(
  migrationFile,
  `-- Migration: create ${snakeCase}
CREATE TABLE IF NOT EXISTS ${snakeCase} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  -- TODO: Add columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE ${snakeCase} ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${snakeCase} FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON ${snakeCase}
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Index
CREATE INDEX idx_${snakeCase}_tenant ON ${snakeCase}(tenant_id);
`,
);

console.log(`Created migration: ${migrationFile}`);

// Repository stub
console.log(`\nNext steps:`);
console.log(`  1. Add columns to ${schemaFile}`);
console.log(`  2. Create repository in the relevant module's infra/repositories/`);
console.log(`  3. Export via the module's public.ts`);
console.log(`  4. Run: pnpm db:migrate`);

console.log(`\n✅ Table ${snakeCase} scaffolded.`);
