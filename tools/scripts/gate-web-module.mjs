#!/usr/bin/env node
/**
 * gate:web-module — CI gate that enforces ALL frontend conventions.
 *
 * Two-phase gate:
 *   Phase 1 — Runs web-drift-check.mjs (W01–W20) for comprehensive
 *             architecture enforcement. Fails if any violation is found.
 *   Phase 2 — Module-specific structural checks:
 *             - Every page.tsx under (shell)/finance/ has a sibling loading.tsx
 *             - Feature modules import from @afenda/contracts
 *             - constants.ts has finance routes
 *
 * Exit codes: 0 = pass, 1 = violations found, 2 = fatal error
 *
 * Usage: node tools/scripts/gate-web-module.mjs
 */
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const SHELL_FINANCE = join(ROOT, 'apps', 'web', 'src', 'app', '(shell)', 'finance');
const FEATURES_DIR = join(ROOT, 'apps', 'web', 'src', 'features', 'finance');
const CONSTANTS_FILE = join(ROOT, 'apps', 'web', 'src', 'lib', 'constants.ts');

const violations = [];
const advisories = [];

console.log('+--------------------------------------------------------------+');
console.log('|  gate:web-module — Frontend CI Gate                          |');
console.log('+--------------------------------------------------------------+\n');

// ─── Phase 1: Run web-drift-check.mjs (W01–W19) ─────────────────────────────
// This is the comprehensive check. It exits 1 on failure.

let driftPassed = true;

try {
  const driftScript = join(__dirname, 'web-drift-check.mjs');
  execSync(`node "${driftScript}"`, { cwd: ROOT, stdio: 'inherit' });
  console.log('\n  ✅ Phase 1 — web-drift-check (W01–W20) PASSED\n');
} catch {
  driftPassed = false;
  console.error('\n  ❌ Phase 1 — web-drift-check (W01–W20) FAILED\n');
}

// ─── Phase 2: Module-specific structural checks ─────────────────────────────

// Check G1: every route directory under (shell)/finance/ has page.tsx + loading.tsx
function checkShellRoutes(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith('_') || entry === 'node_modules') continue;

    const hasPage = existsSync(join(full, 'page.tsx'));
    const hasLoading = existsSync(join(full, 'loading.tsx'));
    const rel = relative(ROOT, full).replace(/\\/g, '/');

    if (hasPage && !hasLoading) {
      violations.push({ file: rel, issue: 'page.tsx exists but missing sibling loading.tsx' });
    }

    // Recurse into subdirectories
    checkShellRoutes(full);
  }
}

checkShellRoutes(SHELL_FINANCE);

// Check G2: feature modules import from @afenda/contracts
const CONTRACT_SUBDIRS = ['blocks', 'actions', 'forms', 'queries'];

function checkFeatureContracts(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry === 'node_modules') continue;

    // Check all code sub-directories for @afenda/contracts usage
    let hasContractImport = false;
    let hasCodeFiles = false;

    for (const sub of CONTRACT_SUBDIRS) {
      const subDir = join(full, sub);
      if (!existsSync(subDir) || !statSync(subDir).isDirectory()) continue;
      const files = readdirSync(subDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));
      if (files.length > 0) hasCodeFiles = true;
      if (files.some((f) => readFileSync(join(subDir, f), 'utf-8').includes('@afenda/contracts'))) {
        hasContractImport = true;
        break;
      }
    }

    if (hasCodeFiles && !hasContractImport) {
      const rel = relative(ROOT, full).replace(/\\/g, '/');
      advisories.push({ file: rel, issue: 'Feature module has no @afenda/contracts usage' });
    }
  }
}

checkFeatureContracts(FEATURES_DIR);

// Check G3: constants.ts exists and has finance routes
if (existsSync(CONSTANTS_FILE)) {
  const content = readFileSync(CONSTANTS_FILE, 'utf-8');
  if (!content.includes('finance')) {
    violations.push({ file: 'apps/web/src/lib/constants.ts', issue: 'No finance routes in constants' });
  }
} else {
  violations.push({ file: 'apps/web/src/lib/constants.ts', issue: 'File missing' });
}

// ─── Results ─────────────────────────────────────────────────────────────────

if (violations.length > 0) {
  console.error('  ❌ Phase 2 — Module structure checks FAILED\n');
  for (const v of violations) {
    console.error(`    ${v.file}: ${v.issue}`);
  }
  console.error(`\n  ${violations.length} structural violation(s).\n`);
} else {
  console.log('  ✅ Phase 2 — Module structure checks PASSED');
}

if (advisories.length > 0) {
  console.log(`\n  ℹ️  ${advisories.length} advisory(s) — progressive migration:`);
  for (const a of advisories) {
    console.log(`    ${a.file}: ${a.issue}`);
  }
}

// ─── Final Verdict ───────────────────────────────────────────────────────────

const failed = !driftPassed || violations.length > 0;

console.log('\n' + '='.repeat(62));
if (failed) {
  console.error('❌ gate:web-module FAILED — fix all violations above.');
  process.exit(1);
} else {
  console.log('✅ gate:web-module PASSED');
}
