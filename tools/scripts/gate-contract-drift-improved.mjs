#!/usr/bin/env node
/**
 * gate:contract-drift-improved — Enhanced contract completeness check
 * 
 * Improvements over original:
 *   - Distinguishes input schemas (required) from response DTOs (optional)
 *   - Scans Next.js route handlers in addition to backend routes
 *   - Better false positive reduction
 * 
 * Usage: node tools/scripts/gate-contract-drift-improved.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SLICES_DIR = join(ROOT, 'packages', 'modules', 'finance', 'src', 'slices');
const WEB_ROUTES_DIR = join(ROOT, 'apps', 'web', 'src', 'app');

function findFiles(dir, pattern, results = []) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.next') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) findFiles(full, pattern, results);
      else if (pattern.test(entry)) results.push(full);
    }
  } catch {}
  return results;
}

function rel(fp) {
  return relative(ROOT, fp).replace(/\\/g, '/');
}

const routeFiles = [
  ...findFiles(SLICES_DIR, /-routes\.ts$/),
  ...findFiles(WEB_ROUTES_DIR, /route\.ts$/),
];

if (routeFiles.length === 0) {
  console.log('✅ gate:contract-drift-improved PASSED (no route files found)');
  process.exit(0);
}

const violations = [];
const exemptions = [];
const info = [];
let totalRouteFiles = 0;
let compliantFiles = 0;

for (const fp of routeFiles) {
  const content = readFileSync(fp, 'utf-8');
  const r = rel(fp);
  totalRouteFiles++;

  if (content.includes('@gate-allow-unvalidated')) {
    const match = content.match(/@gate-allow-unvalidated:\s*(.+)/);
    exemptions.push({
      file: r,
      reason: match ? match[1].trim() : 'No reason given',
    });
    continue;
  }

  const hasMutatingHandler =
    /\.post\s*[(<]/.test(content) ||
    /\.put\s*[(<]/.test(content) ||
    /\.patch\s*[(<]/.test(content) ||
    /export\s+async\s+function\s+(POST|PUT|PATCH)/.test(content);

  if (!hasMutatingHandler) {
    compliantFiles++;
    continue;
  }

  const importsContracts = content.includes('@afenda/contracts');

  if (!importsContracts) {
    violations.push({
      file: r,
      issue: 'Has POST/PUT/PATCH handler(s) but does not import from @afenda/contracts',
      fix: 'Import the relevant Zod schema and apply it for body validation',
    });
    continue;
  }

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
    // Check if imports are only for response types
    const importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]@afenda\/contracts['"]/);
    if (importMatch) {
      const imports = importMatch[1].split(',').map(i => i.trim());
      const responseOnlyPattern = /(Response|Query|List|Detail)$/;
      const allResponseTypes = imports.every(imp => 
        responseOnlyPattern.test(imp) || imp.startsWith('type ')
      );
      
      if (allResponseTypes) {
        info.push({ file: r, note: 'Response types only (OK)' });
        compliantFiles++;
        continue;
      }
    }
    
    violations.push({
      file: r,
      issue: 'Imports @afenda/contracts but does not use schema for body validation',
      fix: 'Apply the schema: { Body: MySchema }',
    });
    continue;
  }

  compliantFiles++;
}

if (violations.length > 0) {
  console.error('❌ gate:contract-drift-improved FAILED\n');
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    Issue: ${v.issue}`);
    console.error(`    Fix:   ${v.fix}\n`);
  }
  console.error(`  ${violations.length} violation(s), ${compliantFiles} compliant, ${exemptions.length} exempted`);
  process.exit(1);
}

console.log('✅ gate:contract-drift-improved PASSED');
console.log(`  ${compliantFiles}/${totalRouteFiles} compliant, ${exemptions.length} exempted`);
if (info.length > 0) console.log(`  ${info.length} file(s) with response types only`);
