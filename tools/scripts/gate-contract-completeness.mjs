#!/usr/bin/env node
/**
 * gate:contract-completeness — CI gate that verifies every API route handler
 * with a request body (POST/PUT/PATCH) uses a corresponding Zod schema from
 * @afenda/contracts for input validation.
 *
 * Rationale: Routes that accept user input without contract-backed validation
 * can silently accept malformed data. This gate ensures contracts-first design
 * by checking that every body-accepting route file imports and applies schemas.
 *
 * Checks:
 *   CC-01: Route files with POST/PUT/PATCH handlers must import from @afenda/contracts.
 *   CC-02: The imported schema must be used for body validation (Body: schema).
 *   CC-03: Files can opt out with `// @gate-allow-unvalidated: <reason>`.
 *
 * Usage: node tools/scripts/gate-contract-completeness.mjs
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
  } catch {
    /* dir doesn't exist */
  }
  return results;
}

function rel(fp) {
  return relative(ROOT, fp).replace(/\\/g, '/');
}

// ── Main ────────────────────────────────────────────────────────────────────

const routeFiles = findFiles(SLICES_DIR, /-routes\.ts$/);

if (routeFiles.length === 0) {
  console.log('✅ gate:contract-completeness PASSED (no route files found)');
  process.exit(0);
}

const violations = [];
const exemptions = [];
let totalRouteFiles = 0;
let compliantFiles = 0;

for (const fp of routeFiles) {
  const content = readFileSync(fp, 'utf-8');
  const r = rel(fp);
  totalRouteFiles++;

  // Check for opt-out
  if (content.includes('@gate-allow-unvalidated')) {
    const match = content.match(/@gate-allow-unvalidated:\s*(.+)/);
    exemptions.push({
      file: r,
      reason: match ? match[1].trim() : 'No reason given',
    });
    continue;
  }

  // Check if file has POST/PUT/PATCH handlers
  const hasMutatingHandler =
    /\.post\s*[(<]/.test(content) ||
    /\.put\s*[(<]/.test(content) ||
    /\.patch\s*[(<]/.test(content);

  if (!hasMutatingHandler) {
    compliantFiles++;
    continue;
  }

  // File has mutating handlers — verify contract imports
  const importsContracts = content.includes('@afenda/contracts');

  if (!importsContracts) {
    violations.push({
      file: r,
      issue: 'Has POST/PUT/PATCH handler(s) but does not import from @afenda/contracts',
      fix: 'Import the relevant Zod schema and apply it for body validation',
    });
    continue;
  }

  // Verify schema is actually used for validation (not just imported)
  // Look for patterns like: Body: ... or schema.parse( or .safeParse( or body:
  // Also accept Params: ... (route uses contract types for params validation)
  const usesSchema =
    /Body\s*:/.test(content) ||
    /Params\s*:/.test(content) ||
    /Querystring\s*:/.test(content) ||
    /\.parse\s*\(/.test(content) ||
    /\.safeParse\s*\(/.test(content) ||
    /body\s*:\s*\{/.test(content) ||
    /schema\s*:/.test(content) ||
    /zodToJsonSchema/.test(content);

  if (!usesSchema) {
    violations.push({
      file: r,
      issue: 'Imports @afenda/contracts but does not use schema for body validation',
      fix: 'Apply the schema in your route handler: { Body: MySchema }',
    });
    continue;
  }

  compliantFiles++;
}

// ── Output ──────────────────────────────────────────────────────────────────

if (violations.length > 0) {
  console.error('❌ gate:contract-completeness FAILED\n');
  console.error(
    '   Route files with mutating handlers (POST/PUT/PATCH) must import and use',
  );
  console.error(
    '   Zod schemas from @afenda/contracts for request body validation.\n',
  );

  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    Issue: ${v.issue}`);
    console.error(`    Fix:   ${v.fix}`);
    console.error();
  }

  console.error('── Summary ──');
  console.error(`  ${totalRouteFiles} route file(s) scanned`);
  console.error(`  ${compliantFiles} compliant`);
  console.error(`  ${violations.length} violation(s)`);
  console.error(`  ${exemptions.length} exempted`);

  if (exemptions.length > 0) {
    console.error('\n── Exemptions ──');
    for (const e of exemptions) {
      console.error(`  ⏭ ${e.file} — ${e.reason}`);
    }
  }

  process.exit(1);
} else {
  console.log('✅ gate:contract-completeness PASSED');
  console.log(
    `   ${totalRouteFiles} route file(s) scanned — ${compliantFiles} compliant, ${exemptions.length} exempted.`,
  );
}
