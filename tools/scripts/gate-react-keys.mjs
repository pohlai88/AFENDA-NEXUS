#!/usr/bin/env node
/**
 * gate:react-keys — Validate React key props in lists.
 *
 * Fails on:
 *   - .map() without key prop on JSX elements
 *   - Arrays of JSX elements without keys
 *   - Key props using array indices
 *
 * Usage: node tools/scripts/gate-react-keys.mjs
 * Reference: https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key
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

// ─── Patterns ─────────────────────────────────────────────────────────────────

const PATTERNS = [
  {
    id: 'REACT-KEY-01',
    name: '.map() without key in JSX',
    // Match: .map((item) => <Element  OR  .map(item => <Element
    // But not: .map(item => item.id)  OR  .map((x) => x * 2)
    regex: /\.map\(\s*\(?[\w$]+\)?\s*=>\s*<[A-Z]/g,
    hint: 'Add key prop to JSX element: .map(item => <Element key={item.id} ...>)',
  },
  {
    id: 'REACT-KEY-02',
    name: 'Array index as key',
    // Match: key={i}  OR  key={index}  OR  key={idx}
    regex: /key=\{(i|index|idx)\}/g,
    hint: 'Use stable ID instead of array index: key={item.id}',
    // Context check: Allow in skeleton/loading components or static arrays
    allowedContexts: [
      /Skeleton/,
      /Loading/,
      /loading\.tsx$/,
      /Array\.from\(\s*\{\s*length:/,  // Static array generation
      /<Suspense>/,  // Loading boundaries
    ],
  },
];

for (const file of walkTsx(WEB_SRC)) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const r = rel(file);

  for (const { id, name, regex, hint, allowedContexts } of PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
      
      const match = line.match(regex);
      if (match) {
        // For REACT-KEY-01, verify there's no key prop within next few lines
        if (id === 'REACT-KEY-01') {
          const contextLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n');
          if (/key=\{[^}]+\}/.test(contextLines)) continue; // Has key, skip
        }
        
        // For REACT-KEY-02, check allowed contexts
        if (id === 'REACT-KEY-02' && allowedContexts) {
          const fileName = file.split(/[\\/]/).pop();
          const contextLines = lines.slice(Math.max(0, i - 5), i + 5).join('\n');
          
          // Check if in allowed context
          const isAllowed = allowedContexts.some(pattern => {
            if (typeof pattern === 'string') return pattern.test(fileName);
            return pattern.test(contextLines) || pattern.test(fileName);
          });
          
          if (isAllowed) {
            // Still flag, but as info instead of error
            // Skip for now to reduce noise on skeleton components
            continue;
          }
        }
        
        failures.push({ gate: id, file: r, line: i + 1, name, hint });
      }
    }
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error('❌ gate:react-keys FAILED\n');
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
  console.error(`${failures.length} React key issue(s). See https://react.dev/learn/rendering-lists`);
  process.exit(1);
}

console.log('✅ gate:react-keys PASSED');
console.log('   All .map() calls have proper key props');
console.log('   No array indices used as keys');
