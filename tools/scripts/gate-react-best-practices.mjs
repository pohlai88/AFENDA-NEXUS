#!/usr/bin/env node
/**
 * gate:react-best-practices — CI gate enforcing React/Next.js performance patterns
 * from .agents/skills/vercel-react-best-practices
 *
 *   RBP-01: Server actions must authenticate (server-auth-actions)
 *   RBP-02: Sequential awaits — use Promise.all for independent ops (async-parallel)
 *   RBP-03: Use .toSorted() not .sort() for immutability (js-tosorted-immutable)
 *   RBP-04: Use ternary for numeric conditionals, not && (rendering-conditional-render)
 *
 * Reference: .agents/skills/vercel-react-best-practices/SKILL.md
 *
 * Usage: node tools/scripts/gate-react-best-practices.mjs [--warn] [--strict]
 *   --warn   Report violations but exit 0
 *   --strict RBP-02 and RBP-04 also fail (default: advisory)
 *
 * Auto-fix RBP-04: node tools/scripts/fix-rbp-04.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const ROOT = process.cwd();
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');
const SKILL_REF = '.agents/skills/vercel-react-best-practices';

const isWarn = process.argv.includes('--warn');
// --strict: RBP-02 and RBP-04 also fail (default: advisory only, report but pass)
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
  } catch { /* dir doesn't exist */ }
  return results;
}

function rel(fp) {
  return relative(ROOT, fp).replace(/\\/g, '/');
}

const failures = [];

// ─── RBP-01: Server actions must authenticate ──────────────────────────────────
// server-auth-actions: Server Actions are public endpoints; must verify auth inside.
// Reference: rules/server-auth-actions.md

const useServerFiles = findFiles(WEB_SRC, /\.(ts|tsx)$/).filter((f) => {
  const c = readFileSync(f, 'utf-8');
  return c.includes("'use server'") || c.includes('"use server"');
});

const AUTH_PATTERNS = [
  /getRequestContext/,
  /requireAuth/,
  /\bauth\./,
  /verifySession/,
  /cookies\s*\(\s*\)/, // cookie-based session (e.g. tenant-actions)
];

const RBP01_ALLOW = [
  'rbp-allow:no-auth',
  'gate:react-best-practices allow',
];

// Queries receive ctx from caller; actions in page.tsx delegate to feature actions
const RBP01_SKIP_PATHS = [
  /\/queries\//,           // query files take ctx from caller
  /\.queries\.ts/,          // e.g. deferred-tax.queries.ts
  /\/new\/page\.tsx$/,      // inline actions delegate to createX from feature
];

for (const fp of useServerFiles) {
  const r = rel(fp);
  if (RBP01_SKIP_PATHS.some((p) => p.test(r))) continue;
  const content = readFileSync(fp, 'utf-8');

  if (RBP01_ALLOW.some((a) => content.includes(a))) continue;

  const hasAuth = AUTH_PATTERNS.some((p) => p.test(content));
  if (!hasAuth) {
    failures.push({
      gate: 'RBP-01',
      file: r,
      line: 1,
      issue:
        "Server action without auth — add getRequestContext/requireAuth. See " +
        `${SKILL_REF}/rules/server-auth-actions.md`,
    });
  }
}

// ─── RBP-02: Sequential awaits (async-parallel) ────────────────────────────────
// Flag consecutive awaits that could be Promise.all(); skip ctx/session fetches.
// Reference: rules/async-parallel.md

const asyncFiles = findFiles(WEB_SRC, /\.(tsx?)$/).filter(
  (f) => !f.includes('.test.') && !f.includes('node_modules')
);

for (const fp of asyncFiles) {
  const content = readFileSync(fp, 'utf-8');
  if (content.includes('Promise.all')) continue;

  const lines = content.split('\n');
  const r = rel(fp);

  for (let i = 0; i < lines.length - 1; i++) {
    const curr = lines[i];
    const next = lines[i + 1];
    if (!/\bawait\s+/.test(curr) || !/\bawait\s+/.test(next)) continue;
    if (curr.includes('Promise.all') || next.includes('Promise.all')) continue;
    if (curr.trim().endsWith(',') || next.trim().startsWith(')')) continue;

    // Skip when first await is getRequestContext/requireAuth/getServerSession — second typically uses result
    if (/const\s+(ctx|session)\s*=\s*await\s+(getRequestContext|requireAuth|getServerSession)/.test(curr)) continue;
    if (/await\s+(getRequestContext|requireAuth|getServerSession)\s*\(/.test(curr)) continue;

    failures.push({
      gate: 'RBP-02',
      file: r,
      line: i + 2,
      issue:
        'Consecutive awaits — use Promise.all() for independent ops. See ' +
        `${SKILL_REF}/rules/async-parallel.md`,
    });
    break; // One report per file
  }
}

// ─── RBP-03: Use .toSorted() not .sort() ─────────────────────────────────────
// js-tosorted-immutable: .sort() mutates; use .toSorted() for React state.
// Reference: rules/js-tosorted-immutable.md

for (const fp of asyncFiles) {
  const content = readFileSync(fp, 'utf-8');
  const lines = content.split('\n');
  const r = rel(fp);

  lines.forEach((line, idx) => {
    // Match .sort( but not .toSorted( and not in comments
    if (/\.sort\s*\(/.test(line) && !/\.toSorted\s*\(/.test(line) && !/^\s*\/\//.test(line.trim())) {
      failures.push({
        gate: 'RBP-03',
        file: r,
        line: idx + 1,
        issue:
          'Use .toSorted() instead of .sort() for immutability. See ' +
          `${SKILL_REF}/rules/js-tosorted-immutable.md`,
      });
    }
  });
}

// ─── RBP-04: Use ternary for numeric conditionals ─────────────────────────────
// rendering-conditional-render: {count && <X>} renders 0 when count=0; use ternary.
// Reference: rules/rendering-conditional-render.md

const jsxFiles = findFiles(WEB_SRC, /\.tsx$/).filter((f) => !f.includes('.test.'));

for (const fp of jsxFiles) {
  const content = readFileSync(fp, 'utf-8');
  const lines = content.split('\n');
  const r = rel(fp);

  lines.forEach((line, idx) => {
    // { something && < or { count && < — when left side can be numeric
    if (/\{\s*\w+\s+&&\s+</.test(line) && !/\?\s*</.test(line)) {
      // Exclude already-correct: count > 0 ?, etc.
      if (/>\s*0\s*\?/.test(line) || /length\s*>\s*0/.test(line)) return;
      failures.push({
        gate: 'RBP-04',
        file: r,
        line: idx + 1,
        issue:
          'Use ternary for conditionals when left side can be 0/NaN. See ' +
          `${SKILL_REF}/rules/rendering-conditional-render.md`,
      });
    }
  });
}

// Dedupe RBP-04 (same line can match multiple times in multiline)
const seen = new Set();
const rbp04Deduped = failures.filter((f) => {
  if (f.gate !== 'RBP-04') return true;
  const key = `${f.file}:${f.line}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
failures.length = 0;
failures.push(...rbp04Deduped.filter((f) => f.gate !== 'RBP-04'));
const rbp04Only = rbp04Deduped.filter((f) => f.gate === 'RBP-04');
failures.push(...rbp04Only);

// ─── Report ─────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error('❌ gate:react-best-practices FAILED\n');
  console.error(`   Reference: ${SKILL_REF}/SKILL.md\n`);

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
  const critical = failures.filter((f) => f.gate === 'RBP-01');
  const advisory = failures.filter((f) => f.gate === 'RBP-02' || f.gate === 'RBP-03' || f.gate === 'RBP-04');
  const hasCritical = critical.length > 0;
  const hasAdvisory = advisory.length > 0;
  const shouldFail = isWarn ? false : hasCritical || (isStrict && hasAdvisory);
  if (advisory.length > 0 && !isStrict) {
    console.error(`  (RBP-02/RBP-03/RBP-04 are advisory; run with --strict to fail on them)`);
  }
  process.exit(shouldFail ? 1 : 0);
} else {
  console.log('✅ gate:react-best-practices PASSED');
  console.log(`   Reference: ${SKILL_REF}/SKILL.md`);
  console.log('   RBP-01: Server actions have auth');
  console.log('   RBP-02: No sequential awaits (use Promise.all)');
  console.log('   RBP-03: Using .toSorted() not .sort()');
  console.log('   RBP-04: Ternary for numeric conditionals');
}
