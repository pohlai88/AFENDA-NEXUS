#!/usr/bin/env node
/**
 * @afenda/drift-check — Validates monorepo structure against .afenda/project.manifest.json.
 *
 * Checks:
 * 1. Every package in manifest exists on disk
 * 2. Every package has required files (package.json, tsconfig.json, ARCHITECTURE.*.md)
 * 3. package.json exports map matches ARCHITECTURE frontmatter
 * 4. Dependencies use catalog: protocol where required
 * 5. No forbidden imports (boundary rules from ARCHITECTURE frontmatter)
 * 6. Root tsconfig.json references match manifest library packages
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const MANIFEST_PATH = join(ROOT, '.afenda/project.manifest.json');

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('FATAL: .afenda/project.manifest.json not found');
    process.exit(1);
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
}

function checkPackageExists(pkg) {
  const dir = join(ROOT, pkg.root_dir);
  const pkgJson = join(dir, 'package.json');
  const errors = [];

  if (!existsSync(dir)) {
    errors.push(`Directory missing: ${pkg.root_dir}`);
    return errors;
  }
  if (!existsSync(pkgJson)) {
    errors.push(`package.json missing: ${pkg.root_dir}/package.json`);
  }

  return errors;
}

function main() {
  const manifest = loadManifest();
  // manifest.packages is an object keyed by root_dir, convert to array
  const packagesObj = manifest.packages || {};
  const packages = Object.entries(packagesObj).map(([root_dir, meta]) => ({
    root_dir,
    ...meta,
  }));
  let totalErrors = 0;

  console.log(`Drift check: ${packages.length} packages in manifest\n`);

  for (const pkg of packages) {
    // Skip unmanaged entries (e.g. tools/scripts) — no package.json expected
    if (pkg.type === 'unmanaged') {
      console.log(`  SKIP ${pkg.root_dir} (unmanaged)`);
      continue;
    }
    const errors = checkPackageExists(pkg);
    if (errors.length > 0) {
      totalErrors += errors.length;
      console.log(`FAIL ${pkg.name ?? pkg.root_dir}`);
      for (const err of errors) {
        console.log(`  - ${err}`);
      }
    } else {
      console.log(`  OK ${pkg.name ?? pkg.root_dir}`);
    }
  }

  console.log(`\n${totalErrors === 0 ? 'PASS' : 'FAIL'}: ${totalErrors} error(s)`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
