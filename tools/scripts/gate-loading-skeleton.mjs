#!/usr/bin/env node
/**
 * gate:loading-skeleton — CI gate enforcing loading page conventions:
 *
 *   LS-GATE-01: loading.tsx must import from '@/components/erp/loading-skeleton'
 *               or use PageHeader composites — no raw Skeleton-only files.
 *   LS-GATE-02: loading.tsx must have role="status" (directly or via LoadingSkeleton).
 *   LS-GATE-03: loading.tsx must have an sr-only "Loading" label
 *               (directly or via LoadingSkeleton variant).
 *   LS-GATE-04: No inline duplication — Skeleton count must stay below threshold
 *               (max 15 <Skeleton … /> elements per loading file).
 *   LS-GATE-05: loading.tsx must default-export a function component.
 *
 * Usage: node tools/scripts/gate-loading-skeleton.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const APP_DIR = join(ROOT, 'apps', 'web', 'src', 'app');

// ─── Helpers ────────────────────────────────────────────────────────────────

function findFiles(dir, pattern, results = []) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.next') continue;
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

// ─── Root loading.tsx is a global spinner — exempt from most rules ──────────
const EXEMPT_FILES = new Set([
  'apps/web/src/app/loading.tsx', // global spinner — intentionally minimal
]);

// Files that compose PageHeader + shared skeleton sub-components inline.
// These are allowed higher Skeleton counts because they assemble custom layouts
// from shared building blocks (CardsSkeleton, TableSkeleton, etc.).
const COMPOSITE_ALLOWLIST = new Set([
  'apps/web/src/app/(shell)/finance/loading.tsx',
  'apps/web/src/app/(shell)/loading.tsx',
  'apps/web/src/app/(shell)/finance/approvals/loading.tsx',
  'apps/web/src/app/(shell)/finance/intangibles/loading.tsx',
  'apps/web/src/app/(shell)/finance/tax/loading.tsx',
  'apps/web/src/app/(shell)/finance/fixed-assets/loading.tsx',
  'apps/web/src/app/(shell)/crm/loading.tsx',
  'apps/web/src/app/(shell)/hrm/loading.tsx',
  'apps/web/src/app/(shell)/boardroom/loading.tsx',
]);

const SHARED_IMPORT = '@/components/erp/loading-skeleton';
const MAX_INLINE_SKELETONS = 15; // composite pages get 25

const failures = [];

const loadingFiles = findFiles(APP_DIR, /^loading\.tsx$/);

for (const fp of loadingFiles) {
  const r = rel(fp);
  if (EXEMPT_FILES.has(r)) continue;

  const content = readFileSync(fp, 'utf-8');

  // ── LS-GATE-05: must default-export ─────────────────────────────────────
  if (!/export\s+default\s+function/.test(content)) {
    failures.push({
      gate: 'LS-GATE-05',
      file: r,
      line: 1,
      issue: 'loading.tsx must use `export default function` (named default export)',
    });
  }

  const importsShared = content.includes(SHARED_IMPORT);

  // ── LS-GATE-01: must use shared skeleton import ─────────────────────────
  // Allow files that compose with PageHeader + shared sub-components
  const usesPageHeader = content.includes('@/components/erp/page-header');
  if (!importsShared && !usesPageHeader) {
    failures.push({
      gate: 'LS-GATE-01',
      file: r,
      line: 1,
      issue: `loading.tsx does not import from '${SHARED_IMPORT}' — use LoadingSkeleton or named variant`,
    });
  }

  // ── LS-GATE-02: must have role="status" + aria-busy + aria-live ──────────
  // Shared components include these internally, so importing them is sufficient.
  if (!importsShared && !content.includes('role="status"')) {
    failures.push({
      gate: 'LS-GATE-02',
      file: r,
      line: 1,
      issue: 'loading.tsx missing role="status" — required for screen-reader live region',
    });
  }
  if (!importsShared && !content.includes('aria-busy')) {
    failures.push({
      gate: 'LS-GATE-02',
      file: r,
      line: 1,
      issue: 'loading.tsx missing aria-busy="true" — tells assistive tech the region is loading',
    });
  }
  if (!importsShared && !content.includes('aria-live')) {
    failures.push({
      gate: 'LS-GATE-02',
      file: r,
      line: 1,
      issue: 'loading.tsx missing aria-live="polite" — announces updates gently to screen readers',
    });
  }

  // ── LS-GATE-03: must have sr-only loading label ─────────────────────────
  // Shared components include <span className="sr-only">Loading…</span> internally.
  if (!importsShared && !content.includes('sr-only')) {
    failures.push({
      gate: 'LS-GATE-03',
      file: r,
      line: 1,
      issue: 'loading.tsx missing sr-only loading label — add <span className="sr-only">Loading…</span>',
    });
  }

  // ── LS-GATE-04: inline skeleton count threshold ─────────────────────────
  const skeletonCount = (content.match(/<Skeleton[\s/]/g) || []).length;
  const threshold = COMPOSITE_ALLOWLIST.has(r) ? 25 : MAX_INLINE_SKELETONS;

  if (skeletonCount > threshold) {
    failures.push({
      gate: 'LS-GATE-04',
      file: r,
      line: 1,
      issue: `${skeletonCount} inline <Skeleton /> elements (max ${threshold}) — extract to LoadingSkeleton variant`,
    });
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error('❌ gate:loading-skeleton FAILED\n');

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
  console.log('✅ gate:loading-skeleton PASSED');
  console.log(`   Checked ${loadingFiles.length} loading.tsx files.`);
  console.log(
    '   All 5 gates green: shared imports, role="status", sr-only labels, no inline bloat, named exports.'
  );
}
