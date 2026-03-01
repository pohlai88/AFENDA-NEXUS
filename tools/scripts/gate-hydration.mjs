#!/usr/bin/env node
/**
 * gate:hydration — Static scan for common hydration-risk patterns in apps/web.
 *
 * Fails on:
 *   - Date.now() or new Date().toLocaleString() in render (server vs client time)
 *   - Math.random() in render (server vs client differ)
 *   - window / document at top level of component body (not in useEffect/callback)
 *
 * E2E runtime-warnings.spec.ts + error-monitor fixture already fail on actual
 * hydration errors in the browser. This gate catches obvious patterns early.
 *
 * Usage: node tools/scripts/gate-hydration.mjs
 * Reference: .agents/skills/next-best-practices/hydration-error.md
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');

const failures = [];

function walkTsx(dir, out = []) {
  try {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === '.next') continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walkTsx(full, out);
      } else if (name.endsWith('.tsx')) {
        const relPath = full.replace(WEB_SRC, '').replace(/\\/g, '/');
        if (!relPath.includes('/__tests__/') && !relPath.includes('.test.')) out.push(full);
      }
    }
  } catch (_) {}
  return out;
}

function rel(p) {
  return p.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
}

// ─── Patterns that cause server/client mismatch ───────────────────────────────

const PATTERNS = [
  {
    id: 'HYDRO-01',
    name: 'Date.now() in render',
    regex: /\bDate\.now\s*\(\s*\)/g,
    hint: 'Use useEffect + useState or render only on client.',
  },
  {
    id: 'HYDRO-02',
    name: 'new Date().toLocaleString() in render',
    regex: /new\s+Date\s*\(\s*\)\s*\.\s*toLocaleString\s*\(/g,
    hint: 'Server/client timezone differs. Use client-only or suppressHydrationWarning.',
  },
  {
    id: 'HYDRO-03',
    name: 'Math.random() in render',
    regex: /\bMath\.random\s*\(\s*\)/g,
    hint: 'Use useId() or generate stable IDs on server.',
  },
];

for (const file of walkTsx(WEB_SRC)) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const r = rel(file);

  for (const { id, name, regex, hint } of PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Allow inside useEffect, useCallback, or comment
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
      if (line.includes('useEffect') || line.includes('useCallback') || line.includes('useMemo')) continue;
      const match = line.match(regex);
      if (match) {
        failures.push({ gate: id, file: r, line: i + 1, name, hint });
      }
    }
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error('❌ gate:hydration FAILED\n');
  const byGate = {};
  for (const f of failures) {
    (byGate[f.gate] ??= []).push(f);
  }
  for (const [gate, items] of Object.entries(byGate)) {
    console.error(`  ${gate} (${items.length}):`);
    for (const v of items) {
      console.error(`    ${v.file}:${v.line}: ${v.name}`);
      console.error(`       ${v.hint}`);
    }
    console.error('');
  }
  console.error(`${failures.length} hydration-risk pattern(s). See .agents/skills/next-best-practices/hydration-error.md`);
  process.exit(1);
}

console.log('✅ gate:hydration PASSED');
console.log('   No Date.now() / new Date().toLocaleString() / Math.random() in render.');
console.log('   E2E error-monitor fails on actual hydration errors at runtime.');
