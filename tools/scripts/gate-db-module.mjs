#!/usr/bin/env node
/**
 * gate:db-module — CI gate that checks DB module integrity.
 *
 * Aggregates ALL migration files to determine whether every table has:
 *   1. ENABLE ROW LEVEL SECURITY  (in any migration)
 *   2. At least one CREATE POLICY  (in any migration, referencing the table)
 *
 * Auth tables (platform.auth_*) are intentionally excluded — they are managed
 * by the auth provider and do not use tenant-scoped RLS.
 *
 * Usage: node tools/scripts/gate-db-module.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, 'packages', 'db', 'drizzle');
const CUSTOM_DIR = join(MIGRATIONS_DIR, 'custom');

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise quoted table name → schema.table (lowercase, no quotes) */
function normTable(raw) {
  return raw.replace(/"/g, '').toLowerCase();
}

/** Tables intentionally excluded from RLS checks */
const EXCLUDED_PATTERNS = [
  /^platform\.auth_/,       // auth provider tables — no tenant_id column
  /^platform\.rate_limit$/,
];
function isExcluded(table) {
  return EXCLUDED_PATTERNS.some((re) => re.test(table));
}

// ── Scan all migrations (including drizzle/custom/) ─────────────────────────

function collectSqlFiles(dir) {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.sql') && !f.startsWith('_'))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

const migrationPaths = [
  ...collectSqlFiles(MIGRATIONS_DIR),
  ...collectSqlFiles(CUSTOM_DIR),
].sort();

const migrationFiles = migrationPaths.map((p) => p.split(/[\\/]/).pop());

/** Set of all tables created across all migrations */
const allTables = new Set();
/** Set of tables that have ENABLE ROW LEVEL SECURITY somewhere */
const rlsEnabled = new Set();
/** Set of tables that have at least one CREATE POLICY somewhere */
const policyCreated = new Set();

for (const filePath of migrationPaths) {
  const content = readFileSync(filePath, 'utf-8');

  // Collect CREATE TABLE
  const createRe = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?("[^"]+"\."[^"]+"|\S+)/gi;
  for (const m of content.matchAll(createRe)) {
    allTables.add(normTable(m[1]));
  }

  // Collect ALTER TABLE ... ENABLE ROW LEVEL SECURITY
  const rlsRe = /ALTER TABLE\s+("[^"]+"\."[^"]+"|\S+)\s+ENABLE ROW LEVEL SECURITY/gi;
  for (const m of content.matchAll(rlsRe)) {
    rlsEnabled.add(normTable(m[1]));
  }

  // Collect CREATE POLICY ... ON <table>
  const policyRe = /CREATE POLICY\s+\S+\s+ON\s+("[^"]+"\."[^"]+"|\S+)/gi;
  for (const m of content.matchAll(policyRe)) {
    policyCreated.add(normTable(m[1]));
  }
}

// ── Evaluate ────────────────────────────────────────────────────────────────

const violations = [];

for (const table of allTables) {
  if (isExcluded(table)) continue;

  if (!rlsEnabled.has(table)) {
    violations.push({ table, issue: 'Missing ENABLE ROW LEVEL SECURITY (across all migrations)' });
  }
  if (!policyCreated.has(table)) {
    violations.push({ table, issue: 'Missing CREATE POLICY (across all migrations)' });
  }
}

if (violations.length > 0) {
  console.error('❌ gate:db-module FAILED\n');
  for (const v of violations) {
    console.error(`  ${v.table}: ${v.issue}`);
  }
  console.error(`\n${violations.length} violation(s) across ${allTables.size} tables, ${migrationFiles.length} migrations.`);
  console.error(`Fix: add ENABLE ROW LEVEL SECURITY + CREATE POLICY for each tenant table.`);
  console.error(`Excluded: ${EXCLUDED_PATTERNS.map((r) => r.source).join(', ')}`);
  process.exit(1);
} else {
  console.log('✅ gate:db-module PASSED');
  console.log(`   Checked ${allTables.size} tables across ${migrationFiles.length} migration files.`);
  console.log(`   RLS enabled: ${rlsEnabled.size} | Policies created: ${policyCreated.size} | Excluded: ${EXCLUDED_PATTERNS.length} patterns`);
}
