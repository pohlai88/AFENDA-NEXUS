#!/usr/bin/env node
/**
 * gate:status-types — CI gate that checks port interfaces don't use
 * bare `string` for status parameters. Status fields should use union
 * types or enums for type safety.
 *
 * Checks:
 *   - Port interface methods with `status: string` parameter
 *   - Entity definitions with `status: string` property
 *
 * Usage: node tools/scripts/gate-status-types.mjs
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

const warnings = [];

// Check port files for status: string
const allTs = findFiles(SLICES_DIR, /\.ts$/);
const portFiles = allTs.filter(f => {
  const norm = f.replace(/\\/g, '/');
  return norm.includes('/ports/') && !norm.includes('.test.');
});
const entityFiles = allTs.filter(f => {
  const norm = f.replace(/\\/g, '/');
  return norm.includes('/entities/') && !norm.includes('.test.');
});

for (const fp of [...portFiles, ...entityFiles]) {
  const content = readFileSync(fp, 'utf-8');
  const rel = relative(ROOT, fp).replace(/\\/g, '/');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Match status: string (but not status: string | ..., or part of a comment)
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    // Bare `status: string` with no union type
    if (/status\s*:\s*string\s*[;,)]/.test(line)) {
      warnings.push({ file: rel, line: idx + 1, issue: 'Bare `status: string` — consider a union type for safety' });
    }
  });
}

// Strict gate — fails CI on violations (hardened from warn-only)
if (warnings.length > 0) {
  console.error('❌ gate:status-types FAILED\n');
  for (const v of warnings) {
    console.error(`  ${v.file}:${v.line}: ${v.issue}`);
  }
  console.error(`\n${warnings.length} bare status: string found in ${portFiles.length} port + ${entityFiles.length} entity files.`);
  console.error('Fix: replace with union types like ApInvoiceStatus | ArInvoiceStatus.');
  process.exit(1);
} else {
  console.log('✅ gate:status-types PASSED');
  console.log(`   Checked ${portFiles.length} port + ${entityFiles.length} entity files — all status fields use union types.`);
}
