#!/usr/bin/env node
/**
 * gate:schema-conventions — Lint Drizzle schema files for ERP conventions.
 *
 * Catches drift at schema-authoring time (before migrations are generated).
 * Scans all *.ts files in packages/db/src/schema/ and enforces:
 *
 *   SC-01  Every table call must end with .enableRLS()
 *   SC-02  Every table (except platform non-tenant tables) must spread tenantCol()
 *   SC-03  FK uuid columns must have .references(() => target.id, ...)
 *   SC-04  Self-referencing .references() must use AnyPgColumn return type
 *   SC-05  Money columns must use moneyBigint() helper (no raw bigint for money)
 *   SC-06  Every table must spread pkId() (UUIDv7 primary key)
 *   SC-07  Every table must spread timestamps() (created_at / updated_at)
 *   SC-08  Relations file must export a *Relations for every exported table
 *
 * Exit codes:
 *   0 — all conventions met
 *   1 — violations found (blocks CI)
 *
 * Usage:
 *   node tools/scripts/gate-schema-conventions.mjs
 *   pnpm gate:schema-conventions
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = process.cwd();
const SCHEMA_DIR = join(ROOT, 'packages', 'db', 'src', 'schema');

// ── Configuration ───────────────────────────────────────────────────────────

/** Tables that are intentionally exempt from tenantCol() requirement */
const TENANT_COL_EXEMPT = new Set([
  'tenant',         // IS the tenant entity
  'user_preference', // keyed by userId PK
  'system_config',   // global config
  'admin_user',      // super-admin (no tenant scope)
  'admin_action_log', // super-admin audit (has targetTenantId, not tenantCol)
]);

/** Files that are not table definitions (skip table-level checks) */
const SKIP_FILES = new Set([
  '_common.ts',
  '_enums.ts',
  '_schemas.ts',
  'index.ts',
  'relations.ts',
]);

/** Columns that look like FK ids but are NOT foreign keys */
const FK_EXEMPT_COLUMNS = new Set([
  'postedBy',        // could be a user id but stored as plain uuid
  'managerId',       // same
  'metadata',
  'stateCode',
  'cityCode',
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function readSchemaFiles() {
  return readdirSync(SCHEMA_DIR)
    .filter((f) => f.endsWith('.ts') && !SKIP_FILES.has(f))
    .map((f) => ({
      name: f,
      path: join(SCHEMA_DIR, f),
      content: readFileSync(join(SCHEMA_DIR, f), 'utf-8'),
    }));
}

// ── Checks ──────────────────────────────────────────────────────────────────

const violations = [];
const warnings = [];

function fail(file, rule, message) {
  violations.push({ file, rule, message });
}
function warn(file, rule, message) {
  warnings.push({ file, rule, message });
}

const schemaFiles = readSchemaFiles();

// Track all exported table names (for relations check)
const allTableExports = new Set();
let totalTables = 0;

for (const { name, content } of schemaFiles) {
  // Find all table definitions: export const xxx = schema.table(
  const tableDefRe = /export const (\w+)\s*=\s*\w+(?:Schema)?\.table\(\s*['"](\w+)['"]/g;
  let match;
  const tables = [];

  while ((match = tableDefRe.exec(content)) !== null) {
    tables.push({
      exportName: match[1],
      tableName: match[2],
      offset: match.index,
    });
  }

  totalTables += tables.length;

  for (const table of tables) {
    allTableExports.add(table.exportName);

    // Find the full table definition (from export const to .enableRLS() or next export const)
    const nextTableIdx = tables.findIndex((t) => t.offset > table.offset);
    const endOffset = nextTableIdx >= 0 ? tables[nextTableIdx].offset : content.length;
    const tableDef = content.slice(table.offset, endOffset);

    // SC-01: Must end with .enableRLS()
    if (!tableDef.includes('.enableRLS()')) {
      fail(name, 'SC-01', `Table "${table.exportName}" missing .enableRLS()`);
    }

    // SC-02: Must spread tenantCol() (unless exempt)
    if (!TENANT_COL_EXEMPT.has(table.tableName)) {
      if (!tableDef.includes('tenantCol()') && !tableDef.includes("tenantId: uuid('tenant_id')")) {
        fail(name, 'SC-02', `Table "${table.exportName}" missing tenantCol() spread`);
      }
    }

    // SC-06: Must spread pkId()
    if (!tableDef.includes('pkId()') && !tableDef.includes("id: uuid('id')")) {
      // Allow tables with composite PKs (primaryKey() in callback)
      if (!tableDef.includes('primaryKey(')) {
        warn(name, 'SC-06', `Table "${table.exportName}" may be missing pkId() spread`);
      }
    }

    // SC-07: Must spread timestamps()
    if (!tableDef.includes('timestamps()') && !tableDef.includes("created_at")) {
      warn(name, 'SC-07', `Table "${table.exportName}" may be missing timestamps() spread`);
    }

    // SC-03: FK-like uuid columns should have .references()
    // Match: somethingId: uuid('something_id')   (but NOT .references())
    const fkCandidateRe = /(\w+Id)\s*:\s*uuid\(['"](\w+_id)['"]\)(?!.*\.references)/gm;
    let fkMatch;
    while ((fkMatch = fkCandidateRe.exec(tableDef)) !== null) {
      const colName = fkMatch[1];
      // Skip known non-FK columns and the id/tenantId columns
      if (colName === 'tenantId' || colName === 'companyId' || FK_EXEMPT_COLUMNS.has(colName)) continue;
      // Check if this column has .references() on the same or next line
      const lineStart = tableDef.lastIndexOf('\n', fkMatch.index) + 1;
      const lineEnd = tableDef.indexOf('\n', fkMatch.index + fkMatch[0].length);
      const nextLine = tableDef.indexOf('\n', lineEnd + 1);
      const context = tableDef.slice(lineStart, nextLine > 0 ? nextLine : undefined);
      if (!context.includes('.references(')) {
        warn(name, 'SC-03', `Table "${table.exportName}" column "${colName}" looks like a FK but has no .references()`);
      }
    }

    // SC-04: Self-referencing .references() must use AnyPgColumn
    // Match: .references(() => sameName.id  where sameName == table.exportName
    const selfRefRe = new RegExp(`\\.references\\(\\(\\)\\s*=>\\s*${table.exportName}\\.`, 'g');
    if (selfRefRe.test(tableDef)) {
      // Check if AnyPgColumn is used
      if (!tableDef.includes('AnyPgColumn')) {
        fail(name, 'SC-04', `Table "${table.exportName}" has self-referencing FK without AnyPgColumn return type`);
      }
    }
  }

  // SC-05: Check for raw bigint money patterns (should use moneyBigint())
  // Match: bigint('something_amount' or bigint('total' etc. without moneyBigint
  const rawBigintRe = /bigint\(\s*['"](\w*(amount|total|balance|price|cost|fee|credit|debit|payment|prepayment|allocated|outstanding|overdue|limit|exposure|value|depreciation|residual|carrying|liability|interest|principal|variance|budget)\w*)['"]/gi;
  let bigintMatch;
  while ((bigintMatch = rawBigintRe.exec(content)) !== null) {
    // Check if this is inside a moneyBigint() call
    const before = content.slice(Math.max(0, bigintMatch.index - 20), bigintMatch.index);
    if (!before.includes('moneyBigint')) {
      warn(name, 'SC-05', `Raw bigint("${bigintMatch[1]}") found — use moneyBigint("${bigintMatch[1]}") for money columns`);
    }
  }
}

// SC-08: Relations file must have a *Relations export for every table
const relationsFile = readFileSync(join(SCHEMA_DIR, 'relations.ts'), 'utf-8');
const relationsExportRe = /export const (\w+)Relations\s*=/g;
const definedRelations = new Set();
let relMatch;
while ((relMatch = relationsExportRe.exec(relationsFile)) !== null) {
  definedRelations.add(relMatch[1]);
}

for (const tableName of allTableExports) {
  // Convert table export name to expected relations name
  // e.g. "glJournals" → "glJournals" (relations name = table export name)
  if (!definedRelations.has(tableName)) {
    warn('relations.ts', 'SC-08', `Missing relations() definition for table "${tableName}"`);
  }
}

// ── Report ──────────────────────────────────────────────────────────────────

console.log(`\nScanned ${schemaFiles.length} schema files, ${totalTables} tables.\n`);

if (warnings.length > 0) {
  console.log(`⚠  ${warnings.length} warning(s):`);
  for (const w of warnings) {
    console.log(`  [${w.rule}] ${w.file}: ${w.message}`);
  }
  console.log();
}

if (violations.length > 0) {
  console.error(`❌ gate:schema-conventions FAILED — ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}: ${v.message}`);
  }
  console.error(`\nRules:`);
  console.error(`  SC-01: Every table must call .enableRLS()`);
  console.error(`  SC-02: Every tenant table must spread tenantCol()`);
  console.error(`  SC-03: FK uuid columns should have .references()`);
  console.error(`  SC-04: Self-referencing FKs must use AnyPgColumn return type`);
  console.error(`  SC-05: Money columns must use moneyBigint() helper`);
  console.error(`  SC-06: Every table should spread pkId()`);
  console.error(`  SC-07: Every table should spread timestamps()`);
  console.error(`  SC-08: Every table needs a relations() definition in relations.ts`);
  process.exit(1);
} else {
  console.log(`✅ gate:schema-conventions PASSED`);
  console.log(`   ${totalTables} tables, ${definedRelations.size} relations, 0 violations, ${warnings.length} warnings`);
}
