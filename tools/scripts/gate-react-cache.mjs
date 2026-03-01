#!/usr/bin/env node
/**
 * gate:react-cache — Enforce React cache() on server data fetchers
 *
 * RBP-CACHE: Server-side data fetchers performing multiple API calls or
 * database queries should use React cache() for automatic request deduplication.
 *
 * Pattern detection:
 *   1. Server-only files (*.server.ts) with async exports lacking cache()
 *   2. Functions with Promise.all/allSettled lacking cache()
 *   3. Data fetchers in established paths (build-*, resolve-*, fetch-*)
 *
 * Reference: .agents/skills/vercel-react-best-practices/rules/server-cache-react.md
 *
 * Usage: node tools/scripts/gate-react-cache.mjs [--warn] [--strict]
 *   --warn   Report violations but exit 0
 *   --strict All violations fail (default: advisory only)
 *
 * Escape hatch: Add comment to file:
 *   // rbp-allow:no-cache — [reason why cache is not needed]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');
const SKILL_REF = '.agents/skills/vercel-react-best-practices/rules/server-cache-react.md';

const isWarn = process.argv.includes('--warn');
const isStrict = process.argv.includes('--strict');

// ─── Helpers ────────────────────────────────────────────────────────────────

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

const failures = [];

// Allow list: files can opt-out with comment
const CACHE_ALLOW = ['rbp-allow:no-cache', 'gate:react-cache allow'];

// ─── Pattern A: Server-only files (*.server.ts) ─────────────────────────────
// Files named *.server.ts are server-only and likely contain data fetchers.
// Check for async function exports without cache().

const serverFiles = findFiles(WEB_SRC, /\.server\.tsx?$/);

for (const fp of serverFiles) {
  const r = rel(fp);
  const content = readFileSync(fp, 'utf-8');

  // Skip if file has allow directive
  if (CACHE_ALLOW.some((a) => content.includes(a))) continue;

  // Skip if file already imports cache
  if (content.includes("from 'react'") && content.includes('cache')) continue;
  if (content.includes('import { cache }')) continue;

  // Detect async function exports that should be cached
  const asyncExportPatterns = [
    // export async function fetchX
    /export\s+async\s+function\s+(fetch|resolve|build|get)\w+/,
    // export const fetchX = async
    /export\s+const\s+(fetch|resolve|build|get)\w+\s*=\s*async/,
  ];

  for (const pattern of asyncExportPatterns) {
    const match = content.match(pattern);
    if (match) {
      // Check if this export has Promise.all/allSettled (strong signal for caching)
      const hasPromiseAll = /Promise\.(all|allSettled)\(/.test(content);
      
      failures.push({
        gate: 'RBP-CACHE',
        file: r,
        line: content.substring(0, match.index).split('\n').length,
        funcName: match[1],
        severity: hasPromiseAll ? 'error' : 'warn',
        issue: `Server data fetcher '${match[0]}' should use React cache() for request memoization. See ${SKILL_REF}`,
      });
      break; // One report per file
    }
  }
}

// ─── Pattern B: Data fetchers in specific paths ─────────────────────────────
// Files in specific paths (build-*, resolve-*, fetch-*) are data fetchers.

const dataFetcherPaths = [
  /\/build-.*\.tsx?$/,
  /\/resolve-.*\.tsx?$/,
  /\/fetch-.*\.tsx?$/,
];

const dataFetcherFiles = findFiles(WEB_SRC, /\.tsx?$/).filter((f) =>
  dataFetcherPaths.some((p) => p.test(f))
);

for (const fp of dataFetcherFiles) {
  const r = rel(fp);
  const content = readFileSync(fp, 'utf-8');

  // Skip if file has allow directive
  if (CACHE_ALLOW.some((a) => content.includes(a))) continue;

  // Skip if file already imports cache
  if (content.includes("from 'react'") && content.includes('cache')) continue;
  if (content.includes('import { cache }')) continue;

  // Detect async exports
  const asyncExportPattern = /export\s+(async\s+function|const)\s+\w+/;
  const match = content.match(asyncExportPattern);
  
  if (match) {
    failures.push({
      gate: 'RBP-CACHE',
      file: r,
      line: content.substring(0, match.index).split('\n').length,
      severity: 'error',
      issue: `Data fetcher file should use React cache() for exported async functions. See ${SKILL_REF}`,
    });
  }
}

// ─── Pattern C: Functions with Promise.all/allSettled ───────────────────────
// Functions using Promise.all/allSettled are performing parallel operations
// and are prime candidates for caching.

const libFiles = findFiles(join(WEB_SRC, 'lib'), /\.tsx?$/).filter(
  (f) => !f.includes('.test.') && !f.includes('node_modules')
);

for (const fp of libFiles) {
  const r = rel(fp);
  const content = readFileSync(fp, 'utf-8');

  // Skip if file has allow directive
  if (CACHE_ALLOW.some((a) => content.includes(a))) continue;

  // Skip if already server file (covered in Pattern A)
  if (fp.endsWith('.server.ts') || fp.endsWith('.server.tsx')) continue;

  // Skip if file already imports cache
  if (content.includes("from 'react'") && content.includes('cache')) continue;
  if (content.includes('import { cache }')) continue;

  // Check for Promise.all/allSettled in async exports
  const hasPromiseAll = /Promise\.(all|allSettled)\(/.test(content);
  if (!hasPromiseAll) continue;

  // Check if there's an async function export
  const asyncExportMatch = content.match(
    /export\s+(async\s+function|const)\s+(fetch|resolve|build|get)\w+/
  );

  if (asyncExportMatch) {
    failures.push({
      gate: 'RBP-CACHE',
      file: r,
      line: content.substring(0, asyncExportMatch.index).split('\n').length,
      severity: 'warn',
      issue: `Function with Promise.all/allSettled should use React cache(). See ${SKILL_REF}`,
    });
  }
}

// ─── Deduplication ──────────────────────────────────────────────────────────
// Remove duplicate violations for the same file

const seen = new Set();
const deduped = failures.filter((f) => {
  const key = `${f.file}:${f.line}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// ─── Report ─────────────────────────────────────────────────────────────────

if (deduped.length > 0) {
  console.error('❌ gate:react-cache FAILED\n');
  console.error(`   Reference: ${SKILL_REF}\n`);

  const errors = deduped.filter((f) => f.severity === 'error');
  const warnings = deduped.filter((f) => f.severity === 'warn');

  if (errors.length > 0) {
    console.error(`  RBP-CACHE Errors (${errors.length}):`);
    for (const v of errors) {
      console.error(`    ${v.file}:${v.line}: ${v.issue}`);
    }
    console.error('');
  }

  if (warnings.length > 0) {
    console.error(`  RBP-CACHE Warnings (${warnings.length}):`);
    for (const v of warnings) {
      console.error(`    ${v.file}:${v.line}: ${v.issue}`);
    }
    console.error('');
  }

  console.error(`${deduped.length} total violation(s).`);
  
  if (warnings.length > 0 && !isStrict) {
    console.error(`  (Warnings are advisory; run with --strict to fail on them)`);
  }

  const shouldFail = isWarn ? false : errors.length > 0 || (isStrict && warnings.length > 0);
  process.exit(shouldFail ? 1 : 0);
} else {
  console.log('✅ gate:react-cache PASSED');
  console.log(`   Reference: ${SKILL_REF}`);
  console.log('   ✓ Server data fetchers use React cache()');
  console.log('   ✓ Functions with Promise.all/allSettled are cached');
  console.log('   ✓ Data fetcher files follow caching pattern');
}
