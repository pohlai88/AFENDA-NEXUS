#!/usr/bin/env node
/**
 * gate:response-type-sot — CI gate that enforces API response wrapper types
 * (ApiResult<T>, PaginatedResponse<T>, CommandReceipt, ApiError) are defined
 * in a single canonical location and not duplicated across features.
 *
 * Rationale: If the API changes its response envelope shape (e.g. adding a
 * `meta` field to PaginatedResponse), every frontend consumer must pick up
 * the change. Local re-definitions mask drift.
 *
 * Checks:
 *   RST-01: ApiResult, PaginatedResponse, CommandReceipt, ApiError must only
 *           be defined in apps/web/src/lib/types.ts (canonical source).
 *   RST-02: No feature query file may re-declare these wrapper types locally.
 *   RST-03: All query files must import from '@/lib/types', not define inline.
 *
 * Usage: node tools/scripts/gate-response-type-sot.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');
const CANONICAL_FILE = join(WEB_SRC, 'lib', 'types.ts');

// Wrapper type names that must only be defined in the canonical file
const WRAPPER_TYPES = [
  'ApiResult',
  'ApiError',
  'PaginatedResponse',
  'CommandReceipt',
];

function findFiles(dir, pattern, results = []) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.next') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) findFiles(full, pattern, results);
      else if (pattern.test(entry)) results.push(full);
    }
  } catch {
    /* dir doesn't exist */
  }
  return results;
}

function rel(fp) {
  return relative(ROOT, fp).replace(/\\/g, '/');
}

// ── Scan for duplicate wrapper type definitions ─────────────────────────────

const allTsFiles = findFiles(WEB_SRC, /\.tsx?$/).filter((f) => {
  const norm = f.replace(/\\/g, '/');
  return (
    !norm.includes('.test.') &&
    !norm.includes('__tests__') &&
    !norm.includes('.next')
  );
});

const canonicalRel = rel(CANONICAL_FILE);
const violations = [];

for (const fp of allTsFiles) {
  const r = rel(fp);
  // Skip the canonical file itself
  if (r === canonicalRel) continue;

  const content = readFileSync(fp, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const typeName of WRAPPER_TYPES) {
      // Match: export interface ApiResult / export type ApiResult / interface ApiResult
      const re = new RegExp(
        `^\\s*(?:export\\s+)?(?:interface|type)\\s+${typeName}\\b`,
      );
      if (re.test(line)) {
        violations.push({
          file: r,
          line: i + 1,
          type: typeName,
          issue: `Duplicate definition of '${typeName}' — must import from '@/lib/types'`,
        });
      }
    }
  }
}

// ── Verify canonical file has all expected types ────────────────────────────

let canonicalContent;
try {
  canonicalContent = readFileSync(CANONICAL_FILE, 'utf-8');
} catch {
  console.error(`❌ gate:response-type-sot — Canonical file missing: ${canonicalRel}`);
  process.exit(1);
}

const missingCanonical = [];
for (const typeName of WRAPPER_TYPES) {
  const re = new RegExp(`export\\s+(?:interface|type)\\s+${typeName}\\b`);
  if (!re.test(canonicalContent)) {
    missingCanonical.push(typeName);
  }
}

// ── Output ──────────────────────────────────────────────────────────────────

const hasErrors = violations.length > 0 || missingCanonical.length > 0;

if (hasErrors) {
  console.error('❌ gate:response-type-sot FAILED\n');

  if (missingCanonical.length > 0) {
    console.error('  Missing from canonical source (apps/web/src/lib/types.ts):');
    for (const t of missingCanonical) {
      console.error(`    - ${t}`);
    }
    console.error();
  }

  if (violations.length > 0) {
    console.error('  Duplicate wrapper type definitions found:\n');
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}`);
      console.error(`    ${v.issue}`);
      console.error();
    }
  }

  console.error(
    `${violations.length} duplicate(s), ${missingCanonical.length} missing from canonical source.`,
  );
  console.error(
    'Fix: Remove local definitions and import from \'@/lib/types\' instead.',
  );
  process.exit(1);
} else {
  console.log('✅ gate:response-type-sot PASSED');
  console.log(
    `   ${WRAPPER_TYPES.length} wrapper type(s) validated — single source of truth in ${canonicalRel}.`,
  );
  console.log(`   Scanned ${allTsFiles.length} TypeScript files for duplicates.`);
}
