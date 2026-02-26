#!/usr/bin/env node
/**
 * Audit Evidence Export CLI
 *
 * Exports audit log entries from the database as JSON for compliance review.
 *
 * Usage:
 *   node tools/scripts/export-audit-evidence.mjs --tenant-id <uuid> [--from <date>] [--to <date>] [--output <file>]
 *   pnpm audit:export -- --tenant-id <uuid>
 *
 * Requires DATABASE_URL_DIRECT in environment (or .env at monorepo root).
 *
 * Examples:
 *   node tools/scripts/export-audit-evidence.mjs --tenant-id 019c87ba-1c31-7ad5-b237-7b19e9ce19e4
 *   node tools/scripts/export-audit-evidence.mjs --tenant-id 019c87ba-1c31-7ad5-b237-7b19e9ce19e4 --from 2025-01-01 --to 2025-12-31 --output evidence.json
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postgres from 'postgres';

// ─── Parse args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const tenantId = getArg('tenant-id');
const fromDate = getArg('from');
const toDate = getArg('to');
const output = getArg('output');

if (!tenantId) {
  console.error('Error: --tenant-id <uuid> is required');
  console.error(
    'Usage: node tools/scripts/export-audit-evidence.mjs --tenant-id <uuid> [--from <date>] [--to <date>] [--output <file>]'
  );
  process.exit(1);
}

// ─── Load .env ──────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, '../..');
try {
  const dotenv = await import('dotenv');
  dotenv.config({ path: resolve(ROOT, '.env') });
} catch {
  // dotenv not available — rely on env vars being set
}

const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: DATABASE_URL_DIRECT or DATABASE_URL must be set');
  process.exit(1);
}

// ─── Query ──────────────────────────────────────────────────────────────────

const sql = postgres(connectionString, { ssl: 'require' });

try {
  let query = `
    SELECT id, tenant_id, user_id, action, table_name, record_id, old_data, new_data, created_at
    FROM audit.audit_logs
    WHERE tenant_id = $1
  `;
  const params = [tenantId];
  let paramIdx = 2;

  if (fromDate) {
    query += ` AND created_at >= $${paramIdx}`;
    params.push(fromDate);
    paramIdx++;
  }
  if (toDate) {
    query += ` AND created_at <= $${paramIdx}::date + interval '1 day'`;
    params.push(toDate);
    paramIdx++;
  }

  query += ` ORDER BY created_at ASC`;

  const rows = await sql.unsafe(query, params);

  const evidence = {
    exportedAt: new Date().toISOString(),
    tenantId,
    dateRange: { from: fromDate ?? 'all', to: toDate ?? 'all' },
    totalRecords: rows.length,
    records: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      action: r.action,
      tableName: r.table_name,
      recordId: r.record_id,
      oldData: r.old_data,
      newData: r.new_data,
      createdAt: r.created_at,
    })),
  };

  const json = JSON.stringify(evidence, null, 2);

  if (output) {
    writeFileSync(output, json, 'utf-8');
    console.log(`Exported ${rows.length} audit records to ${output}`);
  } else {
    console.log(json);
  }
} catch (err) {
  console.error('Query failed:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
