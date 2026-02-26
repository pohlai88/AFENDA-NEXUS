#!/usr/bin/env node
/**
 * gate:api-module — CI gate that checks API module conventions.
 *
 * - Every route file imports requirePermission from authorization-guard
 * - Every route file imports from @afenda/contracts
 * - Identity SoT is delegated to gate:identity-sot (not duplicated here)
 *
 * Usage: node tools/scripts/gate-api-module.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SLICES_DIR = join(ROOT, 'packages', 'modules', 'finance', 'src', 'slices');

function findRouteFiles(dir, results = []) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) findRouteFiles(full, results);
      else if (entry.endsWith('-routes.ts')) results.push(full);
    }
  } catch { /* dir doesn't exist */ }
  return results;
}

const failures = [];
const files = findRouteFiles(SLICES_DIR);

for (const fp of files) {
  const content = readFileSync(fp, 'utf-8');
  const rel = relative(ROOT, fp).replace(/\\/g, '/');

  // HARD FAIL: requirePermission guard
  if (!content.includes('requirePermission')) {
    failures.push({ file: rel, issue: 'Missing requirePermission guard' });
  }

  // HARD FAIL: extractIdentity usage
  if (!content.includes('extractIdentity')) {
    failures.push({ file: rel, issue: 'Missing extractIdentity(req) — uses headers directly?' });
  }

  // HARD FAIL: @afenda/contracts import (Zod schema validation)
  if (!content.includes('@afenda/contracts')) {
    failures.push({ file: rel, issue: 'Missing @afenda/contracts import (Zod schema validation)' });
  }

  // HARD FAIL: must not import directly from drizzle-orm (layer violation)
  if (content.includes("from 'drizzle-orm") || content.includes('from "drizzle-orm')) {
    failures.push({ file: rel, issue: 'Route imports drizzle-orm directly — layer violation (use repo ports)' });
  }
}

if (failures.length > 0) {
  console.error('❌ gate:api-module FAILED\n');
  for (const v of failures) {
    console.error(`  ${v.file}: ${v.issue}`);
  }
  console.error(`\n${failures.length} violation(s) in ${files.length} route files.`);
  console.error('Fix: ensure every route file has requirePermission, extractIdentity, @afenda/contracts, and no direct DB imports.');
  process.exit(1);
} else {
  console.log('✅ gate:api-module PASSED');
  console.log(`   Checked ${files.length} route files — 4 checks each (permission guard, identity SoT, contracts, layer boundary).`);
}
