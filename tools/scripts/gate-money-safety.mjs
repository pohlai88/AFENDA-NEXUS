#!/usr/bin/env node
/**
 * gate:money-safety — CI gate that prevents raw BigInt(Math.round(x * 100))
 * in route files. All currency conversions must use toMinorUnits() from @afenda/core.
 *
 * Allowed exceptions (non-currency math):
 *   - FX rate scaling (1e10, PRECISION_SCALE)
 *   - Percentage calculations in calculators
 *   - Test files
 *
 * Usage: node tools/scripts/gate-money-safety.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SLICES_DIR = join(ROOT, 'packages', 'modules', 'finance', 'src', 'slices');

const FORBIDDEN = /BigInt\(\s*Math\.round\([^)]*\*\s*100\s*\)\s*\)/g;

function findFiles(dir, pattern, results = []) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) findFiles(full, pattern, results);
      else if (pattern.test(entry)) results.push(full);
    }
  } catch { /* dir doesn't exist */ }
  return results;
}

const failures = [];

// Check route files — zero tolerance
const routeFiles = findFiles(SLICES_DIR, /-routes\.ts$/);
for (const fp of routeFiles) {
  const content = readFileSync(fp, 'utf-8');
  const rel = relative(ROOT, fp).replace(/\\/g, '/');
  const matches = content.match(FORBIDDEN);
  if (matches) {
    failures.push({ file: rel, count: matches.length, issue: 'Raw BigInt(Math.round(x * 100)) — use toMinorUnits() from @afenda/core' });
  }
}

// Check service files — zero tolerance
const serviceFiles = findFiles(SLICES_DIR, /\.ts$/);
const svcFiles = serviceFiles.filter(f => {
  const norm = f.replace(/\\/g, '/');
  return norm.includes('/services/') && !norm.includes('.test.');
});
for (const fp of svcFiles) {
  const content = readFileSync(fp, 'utf-8');
  const rel = relative(ROOT, fp).replace(/\\/g, '/');
  const matches = content.match(FORBIDDEN);
  if (matches) {
    failures.push({ file: rel, count: matches.length, issue: 'Raw BigInt(Math.round(x * 100)) in service — use toMinorUnits()' });
  }
}

if (failures.length > 0) {
  console.error('❌ gate:money-safety FAILED\n');
  for (const v of failures) {
    console.error(`  ${v.file}: ${v.count}x ${v.issue}`);
  }
  console.error(`\n${failures.length} file(s) with raw *100 conversions.`);
  console.error('Fix: import { toMinorUnits } from "@afenda/core" and use toMinorUnits(amount, currencyCode).');
  process.exit(1);
} else {
  console.log('✅ gate:money-safety PASSED');
  console.log(`   Checked ${routeFiles.length} route files + ${svcFiles.length} service files — no raw *100 conversions.`);
}
