#!/usr/bin/env node
/**
 * gate:currency-safety — CI gate that prevents:
 *   1. Hardcoded 'USD' in money() calls inside repo files
 *   2. Silent ?? 'USD' fallbacks in repo files
 *
 * Currency must always flow from the data source (DB row or input parameter).
 *
 * Usage: node tools/scripts/gate-currency-safety.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SLICES_DIR = join(ROOT, 'packages', 'modules', 'finance', 'src', 'slices');

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

// Only check repo files (where currency resolution happens)
const allTs = findFiles(SLICES_DIR, /\.ts$/);
const repoFiles = allTs.filter(f => {
  const norm = f.replace(/\\/g, '/');
  return norm.includes('/repos/') && !norm.includes('.test.');
});

for (const fp of repoFiles) {
  const content = readFileSync(fp, 'utf-8');
  const rel = relative(ROOT, fp).replace(/\\/g, '/');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check for money(xxx, 'USD') — hardcoded currency in money() calls
    if (/money\([^,]+,\s*['"]USD['"]\)/.test(line)) {
      failures.push({ file: rel, line: idx + 1, issue: `Hardcoded 'USD' in money() call` });
    }

    // Check for ?? 'USD' fallback
    if (/\?\?\s*['"]USD['"]/.test(line)) {
      failures.push({ file: rel, line: idx + 1, issue: `Silent ?? 'USD' fallback — currency must come from data source` });
    }
  });
}

if (failures.length > 0) {
  console.error('❌ gate:currency-safety FAILED\n');
  for (const v of failures) {
    console.error(`  ${v.file}:${v.line}: ${v.issue}`);
  }
  console.error(`\n${failures.length} violation(s) in ${repoFiles.length} repo files.`);
  console.error('Fix: pass currencyCode from the DB row or input — never hardcode USD.');
  process.exit(1);
} else {
  console.log('✅ gate:currency-safety PASSED');
  console.log(`   Checked ${repoFiles.length} repo files — no hardcoded USD or silent fallbacks.`);
}
