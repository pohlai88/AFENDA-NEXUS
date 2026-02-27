#!/usr/bin/env node
/**
 * gate:contract-response-drift — CI gate that detects locally-defined API
 * response types in frontend query files that should instead be defined in
 * @afenda/contracts and imported.
 *
 * Rationale: @afenda/contracts already covers *input* schemas (create, update,
 * query). This gate enforces that *response/output* view-model types are also
 * centralised in contracts so that API shape changes are caught at compile time
 * across the entire stack.
 *
 * Checks:
 *   CRD-01: Every `export interface` in *.queries.ts files is tracked.
 *           If no matching `*Schema` or `*ResponseSchema` export exists in
 *           @afenda/contracts, the gate flags it.
 *   CRD-02: Allows explicit opt-out via `// @gate-allow-local-type: <reason>`.
 *
 * Usage: node tools/scripts/gate-contract-response-drift.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const WEB_FEATURES = join(ROOT, 'apps', 'web', 'src', 'features');
const CONTRACTS_FILE = join(ROOT, 'packages', 'contracts', 'src', 'index.ts');

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Extract exported type names from contracts ──────────────────────────────

function extractContractExports(content) {
  const exports = new Set();
  // Match: export const FooSchema, export type Foo, export interface Foo
  const re = /export\s+(?:const|type|interface)\s+(\w+)/g;
  let m;
  while ((m = re.exec(content))) {
    exports.add(m[1]);
  }
  return exports;
}

// ── Extract locally-defined response interfaces from query files ────────────

function extractLocalTypes(content) {
  const types = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^export\s+(?:interface|type)\s+(\w+)/);
    if (match) {
      // Check for opt-out comment on previous line
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const optedOut = prevLine.includes('@gate-allow-local-type');
      types.push({ name: match[1], line: i + 1, optedOut });
    }
  }
  return types;
}

// ── Main ────────────────────────────────────────────────────────────────────

let contractsContent;
try {
  contractsContent = readFileSync(CONTRACTS_FILE, 'utf-8');
} catch {
  console.error(`❌ gate:contract-response-drift — Cannot read ${rel(CONTRACTS_FILE)}`);
  process.exit(1);
}

const contractExports = extractContractExports(contractsContent);

const queryFiles = findFiles(WEB_FEATURES, /\.queries\.ts$/);

if (queryFiles.length === 0) {
  console.log('✅ gate:contract-response-drift PASSED (no query files found)');
  process.exit(0);
}

const violations = [];
const exemptions = [];
let totalTypes = 0;

for (const fp of queryFiles) {
  const content = readFileSync(fp, 'utf-8');
  const localTypes = extractLocalTypes(content);
  totalTypes += localTypes.length;
  const r = rel(fp);

  for (const lt of localTypes) {
    if (lt.optedOut) {
      exemptions.push({ file: r, type: lt.name, line: lt.line });
      continue;
    }

    // Check if a corresponding schema or type exists in contracts.
    // We look for: FooSchema, FooResponseSchema, or an exact match of the type name.
    const baseName = lt.name;
    const hasContract =
      contractExports.has(baseName) ||
      contractExports.has(`${baseName}Schema`) ||
      contractExports.has(`${baseName}ResponseSchema`);

    if (!hasContract) {
      violations.push({
        file: r,
        type: lt.name,
        line: lt.line,
        suggestion: `Add \`export const ${baseName}Schema = z.object({...})\` to @afenda/contracts`,
      });
    }
  }
}

// ── Output ──────────────────────────────────────────────────────────────────

if (violations.length > 0) {
  console.error('❌ gate:contract-response-drift FAILED\n');
  console.error(
    '   Response types defined locally in query files without a corresponding',
  );
  console.error(
    '   Zod schema in @afenda/contracts. This allows frontend/API type drift.\n',
  );

  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    Type: ${v.type}`);
    console.error(`    Fix:  ${v.suggestion}`);
    console.error();
  }

  console.error(
    `${violations.length} local type(s) in ${queryFiles.length} query file(s) without contract coverage.`,
  );
  console.error(
    `Total: ${totalTypes} types scanned, ${exemptions.length} explicitly exempted.`,
  );
  console.error(
    '\nTo exempt a type, add `// @gate-allow-local-type: <reason>` on the line before the export.',
  );
  process.exit(1);
} else {
  console.log('✅ gate:contract-response-drift PASSED');
  console.log(
    `   ${totalTypes} response type(s) in ${queryFiles.length} query file(s) — all covered by @afenda/contracts.`,
  );
  if (exemptions.length > 0) {
    console.log(`   ${exemptions.length} type(s) explicitly exempted.`);
  }
}
