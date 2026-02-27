/**
 * @generated — do not edit manually
 * Migration generator.
 *
 * Produces:
 * - SQL migration file in packages/db/drizzle/ with RLS, tenant index, uuid_generate_v7()
 * - Numeric prefix + timestamp suffix for branch-collision safety
 * - Drizzle schema file in packages/db/src/schema/
 */
import { join } from 'node:path';
import { resolveRoot, safeWrite, toKebab, toSnake, toCamel, toPascal, nextMigrationFilename } from '../utils.mjs';
import { loadSpec, buildSpec } from '../spec.mjs';

/**
 * Generate migration + Drizzle schema from spec.
 * @param {object} spec  Validated feature spec
 * @param {object} [options]
 * @returns {Array<{ path: string, action: string }>}
 */
export function generate(spec, options = {}) {
  const root = resolveRoot();
  const { entity } = spec;
  const results = [];

  // SQL migration
  const migrationsDir = join(root, 'packages', 'db', 'drizzle');
  const migrationName = toSnake(entity.table);
  const migrationFilename = nextMigrationFilename(migrationsDir, migrationName);
  const migrationPath = join(migrationsDir, migrationFilename);
  const sqlContent = buildSqlContent(entity);
  results.push(safeWrite(migrationPath, sqlContent, { force: options.force }));

  // Drizzle schema
  const schemaDir = join(root, 'packages', 'db', 'src', 'schema');
  const schemaPath = join(schemaDir, `erp-${toKebab(entity.name)}.ts`);
  const schemaContent = buildDrizzleSchema(entity);
  results.push(safeWrite(schemaPath, schemaContent, { force: options.force }));

  return results;
}

function buildSqlContent(entity) {
  const { table, statuses, moneyFields = [], refs = [] } = entity;
  const lines = [];

  // Status enum
  const enumName = `${table}_status`;
  lines.push(`-- Create status enum`);
  lines.push(`CREATE TYPE erp.${enumName} AS ENUM (`);
  lines.push(statuses.map((s) => `  '${s}'`).join(',\n'));
  lines.push(`);`);
  lines.push('');

  // Table
  lines.push(`-- Create table`);
  lines.push(`CREATE TABLE erp.${table} (`);
  lines.push(`  id          uuid PRIMARY KEY DEFAULT uuid_generate_v7(),`);
  lines.push(`  tenant_id   uuid NOT NULL REFERENCES platform.tenants(id),`);

  // Ref columns
  for (const ref of refs) {
    const colName = toSnake(ref.field);
    lines.push(`  ${colName.padEnd(12)}uuid NOT NULL,`);
  }

  // Money columns (bigint for minor units — CIG-02)
  for (const field of moneyFields) {
    const colName = toSnake(field);
    lines.push(`  ${colName.padEnd(12)}bigint NOT NULL DEFAULT 0,`);
  }

  // Currency code (if money fields exist)
  if (moneyFields.length > 0) {
    lines.push(`  currency_code varchar(3) NOT NULL,`);
  }

  lines.push(`  status        erp.${enumName} NOT NULL DEFAULT '${statuses[0]}',`);
  lines.push(`  description   text,`);
  lines.push(`  created_at    timestamptz NOT NULL DEFAULT now(),`);
  lines.push(`  updated_at    timestamptz NOT NULL DEFAULT now()`);
  lines.push(`);`);
  lines.push('');

  // Indexes
  lines.push(`-- Indexes`);
  lines.push(`CREATE INDEX idx_${table}_tenant ON erp.${table}(tenant_id);`);
  lines.push(`CREATE INDEX idx_${table}_status ON erp.${table}(tenant_id, status);`);
  lines.push(`CREATE INDEX idx_${table}_created ON erp.${table}(tenant_id, created_at DESC, id DESC);`);
  for (const ref of refs) {
    const colName = toSnake(ref.field);
    lines.push(`CREATE INDEX idx_${table}_${colName} ON erp.${table}(${colName});`);
  }
  lines.push('');

  // RLS
  lines.push(`-- Row Level Security`);
  lines.push(`ALTER TABLE erp.${table} ENABLE ROW LEVEL SECURITY;`);
  lines.push('');
  lines.push(`CREATE POLICY tenant_isolation ON erp.${table}`);
  lines.push(`  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);`);
  lines.push('');

  // DOMAIN-TODOs
  lines.push(`-- DOMAIN-TODO[HIGH|H1|DataIntegrity]: Add unique constraints for natural keys`);
  lines.push(`-- DOMAIN-TODO[MEDIUM|H3|DataIntegrity]: Add CHECK constraints for business invariants`);

  return lines.join('\n');
}

function buildDrizzleSchema(entity) {
  const { name, table, statuses, moneyFields = [], refs = [] } = entity;
  const lines = [];
  const camelTable = toCamel(table);
  const enumName = `${camelTable}StatusEnum`;

  lines.push(`import { sql } from 'drizzle-orm';`);
  lines.push(`import { index, text, uuid, varchar } from 'drizzle-orm/pg-core';`);
  lines.push(`import { erpSchema } from './_schemas';`);
  lines.push(`import { pkId, tenantCol, timestamps${moneyFields.length > 0 ? ', moneyBigint' : ''} } from './_common';`);
  lines.push('');

  // Status enum
  lines.push(`export const ${enumName} = erpSchema.enum('${table}_status', [`);
  lines.push(`  ${statuses.map((s) => `'${s}'`).join(', ')},`);
  lines.push(`]);`);
  lines.push('');

  // Table
  lines.push(`export const ${camelTable} = erpSchema.table('${table}', {`);
  lines.push(`  ...pkId(),`);
  lines.push(`  ...tenantCol(),`);

  for (const ref of refs) {
    const colName = toSnake(ref.field);
    lines.push(`  ${ref.field}: uuid('${colName}').notNull(),`);
  }

  for (const field of moneyFields) {
    const colName = toSnake(field);
    lines.push(`  ${field}: moneyBigint('${colName}').notNull().default(0n),`);
  }

  if (moneyFields.length > 0) {
    lines.push(`  currencyCode: varchar('currency_code', { length: 3 }).notNull(),`);
  }

  lines.push(`  status: ${enumName}('status').notNull().default('${statuses[0]}'),`);
  lines.push(`  description: text('description'),`);
  lines.push(`  ...timestamps(),`);
  lines.push(`}, (t) => [`);
  lines.push(`  index('idx_${table}_tenant').on(t.tenantId),`);
  lines.push(`  index('idx_${table}_status').on(t.tenantId, t.status),`);
  lines.push(`  index('idx_${table}_created').on(t.tenantId, t.createdAt, t.id),`);
  lines.push(`]);`);
  lines.push('');

  return lines.join('\n');
}

/**
 * CLI entry point.
 */
export async function run(args) {
  let spec;
  if (args.spec) {
    spec = loadSpec(args.spec);
  } else {
    spec = buildSpec(args);
  }
  const results = generate(spec, { force: args.force });
  for (const r of results) {
    if (r.action === 'skipped') {
      console.log(`⚠️  Skipped ${r.path} (no @generated header, use --force)`);
    } else {
      console.log(`✅ ${r.action}: ${r.path}`);
    }
  }
}
