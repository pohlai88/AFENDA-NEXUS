#!/usr/bin/env node
/**
 * CI Gate: Verify Drizzle schema ↔ migration consistency.
 *
 * Runs `drizzle-kit generate` in dry-run mode — if it produces a new migration
 * file, the developer forgot to run `pnpm db:generate` after a schema change.
 *
 * Usage:
 *   node tools/scripts/db-check-ci.mjs
 *   pnpm db:ci          # from monorepo root
 *
 * Exit codes:
 *   0 — schema and migrations are in sync
 *   1 — pending schema changes detected (developer must run pnpm db:generate)
 */
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const DB_PKG = resolve(import.meta.dirname, '../../packages/db');
const DRIZZLE_DIR = resolve(DB_PKG, 'drizzle');

// Snapshot current migration files
const before = new Set(readdirSync(DRIZZLE_DIR).filter((f) => f.endsWith('.sql')));

// 1. drizzle-kit check — validates snapshot consistency
console.log('> drizzle-kit check (snapshot consistency)...');
try {
  execSync('npx drizzle-kit check --config=drizzle.config.ts', {
    cwd: DB_PKG,
    stdio: 'pipe',
  });
  console.log('  [PASS] Snapshots consistent');
} catch (e) {
  console.error('  [FAIL] Snapshot inconsistency detected');
  console.error(e.stderr?.toString() || e.message);
  process.exit(1);
}

// 2. drizzle-kit generate — should produce no new files if schema is in sync
console.log('> drizzle-kit generate --name=ci_check (dry run)...');
try {
  const output = execSync('npx drizzle-kit generate --config=drizzle.config.ts --name=ci_check', {
    cwd: DB_PKG,
    stdio: 'pipe',
  }).toString();

  // Check if a new SQL file was created
  const after = new Set(readdirSync(DRIZZLE_DIR).filter((f) => f.endsWith('.sql')));
  const newFiles = [...after].filter((f) => !before.has(f));

  if (newFiles.length > 0) {
    // Clean up the generated file — this is a CI check, not a real generate
    const { unlinkSync } = await import('node:fs');
    const metaDir = resolve(DRIZZLE_DIR, 'meta');
    for (const f of newFiles) {
      unlinkSync(resolve(DRIZZLE_DIR, f));
      // Delete only the snapshot for this migration (e.g. 0017_ci_check.sql → 0017_snapshot.json)
      const match = f.match(/^(\d+)_/);
      if (match) {
        const idx = match[1];
        const snapshotFile = `${idx}_snapshot.json`;
        try {
          unlinkSync(resolve(metaDir, snapshotFile));
        } catch {
          /* ignore */
        }
      }
    }

    console.error('  [FAIL] Schema has pending changes not captured in migrations:');
    for (const f of newFiles) console.error(`     - ${f}`);
    console.error('');
    console.error('  Fix: run `pnpm --filter @afenda/db db:generate` and commit the result.');
    process.exit(1);
  }

  if (output.includes('No schema changes')) {
    console.log('  [PASS] No pending schema changes');
  } else {
    console.log('  [PASS] Schema and migrations in sync');
  }
} catch (e) {
  const msg = e.stderr?.toString() || e.stdout?.toString() || e.message;
  if (msg.includes('No schema changes')) {
    console.log('  [PASS] No pending schema changes');
  } else {
    console.error('  [FAIL] drizzle-kit generate failed:');
    console.error(msg);
    process.exit(1);
  }
}

console.log('\n[PASS] DB CI gate passed -- schema <-> migrations in sync');
