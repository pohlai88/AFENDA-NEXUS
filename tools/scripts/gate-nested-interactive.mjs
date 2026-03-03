#!/usr/bin/env node
/**
 * gate:nested-interactive — Static scan for nested interactive HTML patterns.
 *
 * Fails on:
 *   - <a> nested inside <a> (or <Link> inside <Link>)
 *   - <button> nested inside <a>/<Link> (unless using asChild pattern correctly)
 *   - <a>/<Link> nested inside <button>
 *
 * These patterns cause HTML spec violations and hydration errors:
 *   "In HTML, <a> cannot be a descendant of <a>"
 *
 * Usage:  node tools/scripts/gate-nested-interactive.mjs
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

// ─── Nesting tracker ──────────────────────────────────────────────────────────

const INTERACTIVE_OPEN = /<(a|Link|button|Button)\b/;
const INTERACTIVE_CLOSE = /<\/(a|Link|button|Button)\s*>/;
const SELF_CLOSE = /\/>\s*$/;

for (const file of walkTsx(WEB_SRC)) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const r = rel(file);
  const stack = []; // track open interactive elements: { tag, line }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comment-only lines
    if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
    // Skip lines inside JSX comments
    if (/^\s*\{\/\*/.test(line)) continue;

    // Check for opening interactive tags
    const openMatch = line.match(INTERACTIVE_OPEN);
    if (openMatch) {
      const tag = openMatch[1];

      // If we're already inside an interactive element, this is a violation
      // UNLESS the outer element uses asChild (Radix pattern)
      if (stack.length > 0) {
        const parent = stack[stack.length - 1];

        // Allow <Link> inside <Button asChild> or <Button asChild> wrapping <Link>
        // (Radix UI asChild merges the child into the slot — no nesting occurs)
        if (parent.hasAsChild) continue;

        // Check if current tag has asChild — not a violation until we see its children
        const hasAsChild = line.includes('asChild');
        if (hasAsChild) {
          stack.push({ tag, line: i + 1, hasAsChild: true });
          continue;
        }

        // Genuine nesting violation
        const parentTag = parent.tag === 'Link' ? '<Link>' : `<${parent.tag}>`;
        const childTag = tag === 'Link' ? '<Link>' : `<${tag}>`;
        failures.push({
          gate: 'NESTED-01',
          file: r,
          line: i + 1,
          name: 'Nested interactive element',
          hint: `${childTag} inside ${parentTag} (opened at line ${parent.line}) — nested interactive elements violate HTML spec`,
        });
        continue;
      }

      // Track opening tag (only if it's not self-closing on this line)
      const isSelfClosing = SELF_CLOSE.test(line);
      // For multi-line tags, look ahead for self-closing
      let selfClose = isSelfClosing;
      if (!selfClose) {
        // Check next few lines for the closing of this opening tag
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (SELF_CLOSE.test(lines[j])) {
            selfClose = true;
            break;
          }
          if (lines[j].includes('>')) break;
        }
      }

      // Only push non-self-closing tags onto the stack
      if (!selfClose || !isSelfClosing) {
        // Check for asChild on the opening line AND subsequent attribute lines
        let hasAsChild = line.includes('asChild');
        if (!hasAsChild) {
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            const attrLine = lines[j];
            if (attrLine.includes('asChild')) {
              hasAsChild = true;
              break;
            }
            // Stop at the closing of the opening tag
            if (attrLine.includes('>')) break;
          }
        }
        stack.push({ tag, line: i + 1, hasAsChild });
      }
    }

    // Check for closing interactive tags
    const closeMatch = line.match(INTERACTIVE_CLOSE);
    if (closeMatch) {
      const tag = closeMatch[1];
      // Pop the matching tag from the stack
      for (let s = stack.length - 1; s >= 0; s--) {
        if (stack[s].tag === tag) {
          stack.splice(s, 1);
          break;
        }
      }
    }
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

if (failures.length === 0) {
  console.log('✅ gate:nested-interactive PASSED');
  console.log('   No nested interactive elements (<a> inside <a>, <button> inside <Link>, etc.).');
  process.exit(0);
} else {
  console.error(`❌ gate:nested-interactive FAILED`);
  for (const f of failures) {
    console.error(`  ${f.file}:${f.line}: ${f.hint}`);
  }
  console.error(`${failures.length} total violation(s).`);
  process.exit(1);
}
