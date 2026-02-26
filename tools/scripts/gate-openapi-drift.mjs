#!/usr/bin/env node
/**
 * gate:openapi-drift — CI gate that checks OpenAPI spec hasn't drifted.
 *
 * Compares the committed docs/openapi.json against a freshly generated spec.
 * Fails if they differ — developer must regenerate and commit.
 *
 * Usage: node tools/scripts/gate-openapi-drift.mjs
 */
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const COMMITTED_SPEC = join(ROOT, 'docs', 'openapi.json');
const TMP_SPEC = join(ROOT, 'node_modules', '.cache', 'openapi-check.json');

if (!existsSync(COMMITTED_SPEC)) {
  console.warn('⚠️  gate:openapi-drift SKIPPED — docs/openapi.json does not exist yet.');
  console.warn('   Run: node tools/scripts/gen-openapi.mjs');
  process.exit(0);
}

try {
  mkdirSync(join(ROOT, 'node_modules', '.cache'), { recursive: true });
  execSync(`node tools/scripts/gen-openapi.mjs --output "${TMP_SPEC}"`, {
    cwd: ROOT,
    stdio: 'pipe',
  });
} catch (err) {
  console.error('❌ gate:openapi-drift FAILED — could not generate spec');
  console.error(err.stderr?.toString() ?? err.message);
  process.exit(1);
}

const committed = readFileSync(COMMITTED_SPEC, 'utf-8').trim();
const fresh = readFileSync(TMP_SPEC, 'utf-8').trim();

/** Count paths in an OpenAPI JSON spec */
function countPaths(specJson) {
  try {
    const spec = JSON.parse(specJson);
    return Object.keys(spec.paths ?? {}).length;
  } catch { return 0; }
}

if (committed !== fresh) {
  const committedPaths = countPaths(committed);
  const freshPaths = countPaths(fresh);
  console.error('❌ gate:openapi-drift FAILED — OpenAPI spec has drifted.');
  console.error(`   Committed: ${committedPaths} paths | Generated: ${freshPaths} paths`);
  if (freshPaths > committedPaths) {
    console.error(`   +${freshPaths - committedPaths} new path(s) not yet committed.`);
  } else if (freshPaths < committedPaths) {
    console.error(`   -${committedPaths - freshPaths} path(s) removed but committed spec not updated.`);
  }
  console.error('   Regenerate with: node tools/scripts/gen-openapi.mjs');
  console.error('   Then commit docs/openapi.json.');
  process.exit(1);
} else {
  const pathCount = countPaths(committed);
  console.log('✅ gate:openapi-drift PASSED — spec matches committed version.');
  console.log(`   ${pathCount} API paths documented.`);
}
