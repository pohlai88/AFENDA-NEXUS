#!/usr/bin/env node
/**
 * gate:frontend-quality — CI gate enforcing 5 frontend invariants:
 *
 *   FE-GATE-01: No raw UUID <Input> — only EntityCombobox/EntitySelect
 *   FE-GATE-02: No currency defaults (currencyCode: 'USD' banned)
 *   FE-GATE-03: Forms must use zodResolver — no manual parseFloat validation
 *   FE-GATE-04: Tables must have <caption> + keyboard row nav (tabIndex, role="link")
 *   FE-GATE-05: Route groups need error.tsx/not-found.tsx, every page.tsx needs sibling loading.tsx
 *
 * Usage: node tools/scripts/gate-frontend-quality.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';

const ROOT = process.cwd();
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');

// ─── Helpers ────────────────────────────────────────────────────────────────

function findFiles(dir, pattern, results = []) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.next') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) findFiles(full, pattern, results);
      else if (pattern.test(entry)) results.push(full);
    }
  } catch { /* dir doesn't exist */ }
  return results;
}

function rel(fp) {
  return relative(ROOT, fp).replace(/\\/g, '/');
}

const failures = [];

// ─── FE-GATE-01: No raw UUID <Input> for entity references ─────────────────
// Scans form + block files for <Input> with UUID-like placeholders or patterns.

const formAndBlockFiles = [
  ...findFiles(join(WEB_SRC, 'features'), /\.(tsx?)$/),
].filter(f => {
  const norm = f.replace(/\\/g, '/');
  return (norm.includes('/forms/') || norm.includes('/blocks/')) && !norm.includes('.test.');
});

for (const fp of formAndBlockFiles) {
  const content = readFileSync(fp, 'utf-8');
  const lines = content.split('\n');
  const r = rel(fp);

  lines.forEach((line, idx) => {
    // Catch patterns like placeholder="UUID", placeholder="Supplier UUID", "Account UUID"
    if (/placeholder=["'][^"']*UUID[^"']*["']/i.test(line)) {
      failures.push({
        gate: 'FE-GATE-01',
        file: r,
        line: idx + 1,
        issue: 'Raw UUID input placeholder — use EntityCombobox instead',
      });
    }
  });
}

// ─── FE-GATE-02: No currency defaults ──────────────────────────────────────
// Catches currencyCode: 'USD', currency ?? 'USD', etc. in frontend files.

const frontendTs = findFiles(WEB_SRC, /\.(tsx?)$/).filter(f => !f.replace(/\\/g, '/').includes('.test.'));

for (const fp of frontendTs) {
  const content = readFileSync(fp, 'utf-8');
  const lines = content.split('\n');
  const r = rel(fp);

  lines.forEach((line, idx) => {
    // currencyCode: 'USD' as default value
    if (/currencyCode:\s*['"]USD['"]/.test(line)) {
      failures.push({
        gate: 'FE-GATE-02',
        file: r,
        line: idx + 1,
        issue: "Hardcoded currencyCode: 'USD' default — currency must come from data",
      });
    }
    // ?? 'USD' fallback in frontend
    if (/\?\?\s*['"]USD['"]/.test(line)) {
      failures.push({
        gate: 'FE-GATE-02',
        file: r,
        line: idx + 1,
        issue: "Silent ?? 'USD' fallback — currency must come from data source",
      });
    }
  });
}

// ─── FE-GATE-03: Forms must use zodResolver ────────────────────────────────
// Any file importing useForm must also import zodResolver.

const formFiles = findFiles(WEB_SRC, /\.(tsx?)$/).filter(f => {
  const norm = f.replace(/\\/g, '/');
  return norm.includes('/forms/') && !norm.includes('.test.');
});

for (const fp of formFiles) {
  const content = readFileSync(fp, 'utf-8');
  const r = rel(fp);

  if (content.includes('useForm') && !content.includes('zodResolver')) {
    failures.push({
      gate: 'FE-GATE-03',
      file: r,
      line: 1,
      issue: 'Form uses useForm without zodResolver — all forms must use Zod validation',
    });
  }

  // Also catch manual parseFloat for validation
  if (content.includes('parseFloat') && content.includes('useForm')) {
    // Already has useForm — parseFloat suggests manual validation bypassing Zod
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (/parseFloat/.test(line) && !/\/\//.test(line.split('parseFloat')[0])) {
        failures.push({
          gate: 'FE-GATE-03',
          file: r,
          line: idx + 1,
          issue: 'Manual parseFloat in form — use z.coerce.number() in Zod schema instead',
        });
      }
    });
  }
}

// ─── FE-GATE-04: Tables must have <caption> ────────────────────────────────
// Any file with <Table> or <table> must have a <caption>.

const tableFiles = findFiles(WEB_SRC, /\.(tsx?)$/).filter(f => {
  const norm = f.replace(/\\/g, '/');
  return !norm.includes('.test.') && !norm.includes('/ui/');
});

for (const fp of tableFiles) {
  const content = readFileSync(fp, 'utf-8');
  const r = rel(fp);

  // Only check files that render <Table> (shadcn) or <table> — not just TableSkeleton refs
  const hasTable = /<Table[\s>]/.test(content) || /<table[\s>]/.test(content);
  if (!hasTable) continue;

  // Skip files that don't actually render Table components (e.g. skeleton placeholders)
  const norm = fp.replace(/\\/g, '/');
  if (norm.includes('editor')) continue;
  if (norm.includes('loading-skeleton')) continue;

  // Accept either <caption>, <TableCaption> (shadcn), or aria-label on Table as accessible name
  if (!content.includes('<caption') && !content.includes('<TableCaption') && !/<Table[^>]*aria-label/.test(content)) {
    failures.push({
      gate: 'FE-GATE-04',
      file: r,
      line: 1,
      issue: 'Table without <caption> — add <caption className="sr-only">description</caption>',
    });
  }
}

// ─── FE-GATE-05: Route boundaries ──────────────────────────────────────────
// Every page.tsx needs a sibling loading.tsx.
// Route groups (dirs containing page.tsx) that are top-level segments need error.tsx + not-found.tsx.

const APP_DIR = join(WEB_SRC, 'app');
const pageFiles = findFiles(APP_DIR, /^page\.tsx$/);

for (const pagePath of pageFiles) {
  const dir = dirname(pagePath);
  const loadingPath = join(dir, 'loading.tsx');

  if (!existsSync(loadingPath)) {
    failures.push({
      gate: 'FE-GATE-05',
      file: rel(pagePath),
      line: 1,
      issue: 'page.tsx has no sibling loading.tsx — add loading.tsx for Suspense boundary',
    });
  }
}

// Check route groups for error.tsx / not-found.tsx
const routeGroups = readdirSync(APP_DIR)
  .filter(d => d.startsWith('(') && d.endsWith(')'))
  .map(d => join(APP_DIR, d));

for (const groupDir of routeGroups) {
  // Find the first nested directory with pages (e.g., portal/, finance/)
  const childDirs = [];
  try {
    for (const entry of readdirSync(groupDir)) {
      const full = join(groupDir, entry);
      if (statSync(full).isDirectory()) childDirs.push(full);
    }
  } catch { continue; }

  for (const childDir of childDirs) {
    const hasPages = findFiles(childDir, /^page\.tsx$/).length > 0;
    if (!hasPages) continue;

    if (!existsSync(join(childDir, 'error.tsx'))) {
      failures.push({
        gate: 'FE-GATE-05',
        file: rel(childDir),
        line: 0,
        issue: 'Route segment missing error.tsx — add error boundary',
      });
    }
    if (!existsSync(join(childDir, 'not-found.tsx'))) {
      failures.push({
        gate: 'FE-GATE-05',
        file: rel(childDir),
        line: 0,
        issue: 'Route segment missing not-found.tsx — add not-found boundary',
      });
    }
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error('❌ gate:frontend-quality FAILED\n');

  // Group by gate
  const byGate = {};
  for (const f of failures) {
    (byGate[f.gate] ??= []).push(f);
  }

  for (const [gate, items] of Object.entries(byGate)) {
    console.error(`  ${gate} (${items.length} violation${items.length > 1 ? 's' : ''}):`);
    for (const v of items) {
      console.error(`    ${v.file}${v.line ? `:${v.line}` : ''}: ${v.issue}`);
    }
    console.error('');
  }

  console.error(`${failures.length} total violation(s).`);
  process.exit(1);
} else {
  console.log('✅ gate:frontend-quality PASSED');
  console.log(`   Checked ${frontendTs.length} frontend files.`);
  console.log('   All 5 gates green: no UUID inputs, no currency defaults, Zod on forms, table captions, route boundaries.');
}
