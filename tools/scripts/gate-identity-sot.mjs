#!/usr/bin/env node
/**
 * gate:identity-sot — CI gate that enforces single identity authority.
 *
 * Fails if any .ts file outside the explicit ALLOWLIST reads
 * x-tenant-id or x-user-id headers directly.
 *
 * Usage: node tools/scripts/gate-identity-sot.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

// ─── Deterministic allowlist — ONLY these files may read identity headers ────
const ALLOWLIST = new Set([
  'apps/api/src/middleware/auth.ts',
  'apps/api/src/middleware/tenant-context.ts',
]);

// Test files are excluded from the ban
const TEST_PATTERNS = ['__tests__', '.test.', '.spec.', 'test-helpers'];

const BANNED_PATTERNS = [
  'x-tenant-id',
  'x-user-id',
];

function isTestFile(relPath) {
  return TEST_PATTERNS.some((p) => relPath.includes(p));
}

function findTsFiles(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        results.push(...findTsFiles(full));
      } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
        results.push(full);
      }
    }
  } catch { /* dir doesn't exist */ }
  return results;
}

const violations = [];

const scanDirs = [
  join(ROOT, 'packages', 'modules'),
  join(ROOT, 'packages', 'api-kit'),
  join(ROOT, 'apps', 'api', 'src'),
  join(ROOT, 'apps', 'worker', 'src'),
];

for (const dir of scanDirs) {
  const files = findTsFiles(dir);
  for (const filePath of files) {
    const rel = relative(ROOT, filePath).replace(/\\/g, '/');

    // Skip allowlisted files
    if (ALLOWLIST.has(rel)) continue;

    // Skip test files
    if (isTestFile(rel)) continue;

    const content = readFileSync(filePath, 'utf-8');
    for (const pattern of BANNED_PATTERNS) {
      if (content.includes(pattern)) {
        // Find line numbers for context
        const lines = content.split('\n');
        const lineNums = [];
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(pattern)) {
            lineNums.push(i + 1);
          }
        }
        violations.push({ file: rel, pattern, lines: lineNums });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('❌ gate:identity-sot FAILED\n');
  console.error('The following files read identity headers outside the allowlist:\n');
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    Pattern: "${v.pattern}" at line(s): ${v.lines.join(', ')}`);
  }
  console.error(`\nAllowlist (${ALLOWLIST.size} files):`);
  for (const f of ALLOWLIST) {
    console.error(`  ✓ ${f}`);
  }
  console.error('\nFix: use extractIdentity(req) from @afenda/api-kit instead of reading headers.');
  process.exit(1);
} else {
  // Count total files scanned for stats
  let totalFiles = 0;
  let skippedTests = 0;
  for (const dir of scanDirs) {
    const allFiles = findTsFiles(dir);
    totalFiles += allFiles.length;
    skippedTests += allFiles.filter((f) => isTestFile(relative(ROOT, f))).length;
  }
  console.log('✅ gate:identity-sot PASSED');
  console.log(`   Scanned ${totalFiles} files across ${scanDirs.length} directories (${skippedTests} test files excluded).`);
  console.log(`   No header reads outside allowlist.`);
  console.log(`   Allowlist: ${[...ALLOWLIST].join(', ')}`);
}
