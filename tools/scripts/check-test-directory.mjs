#!/usr/bin/env node
/**
 * CI Gate: Enforce __tests__ directory convention
 *
 * All *.test.ts and *.spec.ts files MUST reside inside a __tests__ directory.
 * No exceptions. This prevents directory drift where test files scatter
 * alongside source files and pollute the production tree.
 *
 * Usage:
 *   node tools/scripts/check-test-directory.mjs [--fail]
 *
 * Options:
 *   --fail  Exit with code 1 if violations found (default in CI)
 */

import { readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const SCAN_DIRS = ['packages/modules/finance/src'];

const TEST_PATTERN = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
const TESTS_DIR = '__tests__';

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      yield* walk(full);
    } else if (entry.isFile() && TEST_PATTERN.test(entry.name)) {
      yield full;
    }
  }
}

async function main() {
  const shouldFail = process.argv.includes('--fail') || process.env.CI === 'true';
  const violations = [];

  for (const scanDir of SCAN_DIRS) {
    const absDir = join(ROOT, scanDir);
    try {
      await stat(absDir);
    } catch {
      console.warn(`⚠ Scan directory not found: ${scanDir}`);
      continue;
    }

    for await (const file of walk(absDir)) {
      const rel = relative(ROOT, file);
      const parts = rel.split(sep);
      // Check that at least one parent directory is __tests__
      if (!parts.includes(TESTS_DIR)) {
        violations.push(rel);
      }
    }
  }

  if (violations.length === 0) {
    console.log('✅ All test files are inside __tests__ directories.');
    process.exit(0);
  }

  console.error(`\n❌ Found ${violations.length} test file(s) outside __tests__ directories:\n`);
  for (const v of violations) {
    console.error(`  • ${v}`);
  }
  console.error('\n→ Move these files into the nearest __tests__/ directory.\n');

  process.exit(shouldFail ? 1 : 0);
}

main();
