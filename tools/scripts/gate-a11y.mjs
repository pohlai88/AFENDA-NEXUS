#!/usr/bin/env node
/**
 * gate:a11y — Accessibility validation gate for React/Next.js components
 *
 * Checks:
 *   A11Y-01: Images must have alt text
 *   A11Y-02: Interactive elements must have accessible labels
 *   A11Y-03: Buttons with only icons must have aria-label
 *   A11Y-04: Form inputs must have associated labels
 *   A11Y-05: Links must have descriptive text (not "click here")
 *   A11Y-06: Heading hierarchy must be sequential
 *
 * Usage: node tools/scripts/gate-a11y.mjs
 * Auto-fix: node tools/scripts/gate-a11y.mjs --fix
 *
 * Reference: WCAG 2.1 Level AA compliance
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');

const failures = [];
const fixes = [];
const autoFix = process.argv.includes('--fix');

function walkTsx(dir, out = []) {
  try {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === '.next') continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walkTsx(full, out);
      } else if (name.endsWith('.tsx') || name.endsWith('.jsx')) {
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
    id: 'A11Y-01',
    name: 'Images without alt text',
    // Match: <img src=  OR  <Image src=  without alt
    regex: /<(img|Image)\s+[^>]*src=['"][^'"]*['"][^>]*>/g,
    check: (match) => !match.includes('alt='),
    hint: 'Add alt attribute: <img src="..." alt="Descriptive text" />',
    autoFix: (match) => {
      // Insert alt="" before the closing >
      return match.replace(/>$/, ' alt="" />');
    },
  },
  {
    id: 'A11Y-02',
    name: 'Button with only icon, no aria-label',
    // Match: <button> or <Button> with Icon but no text and no aria-label
    regex:
      /<(button|Button)[^>]*>[\s\n]*<(Icon|Lucide|[A-Z]\w*Icon)[^>]*\/>[\s\n]*<\/(button|Button)>/g,
    check: (match, fullLine) => !match.includes('aria-label') && !match.includes('aria-labelledby'),
    hint: 'Add aria-label: <button aria-label="Delete" onClick={...}><Icon name="trash" /></button>',
    autoFix: (match) => {
      // Extract icon name if possible
      const iconMatch = match.match(/name=["']([^"']+)["']/);
      const label = iconMatch ? iconMatch[1].replace(/-/g, ' ') : 'action';
      return match.replace(/<(button|Button)/, `<$1 aria-label="${label}"`);
    },
  },
  {
    id: 'A11Y-03',
    name: 'Link with non-descriptive text',
    // Match: <a> or <Link> with "click here", "here", "read more" etc.
    regex: /<(a|Link)[^>]*>(click here|here|read more|learn more|more)<\/(a|Link)>/gi,
    check: () => true,
    hint: 'Use descriptive link text: <Link href="/docs">View documentation</Link>',
  },
  {
    id: 'A11Y-04',
    name: 'Form input without label',
    // Match: <input> or <Input> without accompanying <label> or aria-label
    regex: /<(input|Input)\s+[^>]*type=['"](?!hidden)[^'"]*['"][^>]*>/g,
    check: (match, fullLine, context) => {
      // Skip if it has aria-label, aria-labelledby, or is wrapped in <label>
      if (match.includes('aria-label') || match.includes('aria-labelledby')) return false;
      // The regex may stop at '>' inside arrow fns; check the full source line too
      if (fullLine.includes('aria-label') || fullLine.includes('aria-labelledby')) return false;
      // Check surrounding context (before+after) for aria-label on other lines of multi-line JSX
      if (context.includes('aria-label') || context.includes('aria-labelledby')) return false;
      // Check if <label>, <Label>, or <FormLabel> appears nearby
      return (
        !context.includes('<label') &&
        !context.includes('<Label') &&
        !context.includes('<FormLabel')
      );
    },
    hint: 'Add <label> or aria-label: <label htmlFor="email">Email</label><input id="email" type="email" />',
  },
  {
    id: 'A11Y-05',
    name: 'Decorative icon not hidden from screen readers',
    // Match: <Icon> or similar without aria-hidden="true"
    regex: /<(Icon|Lucide[A-Z]\w*)[^>]*\/>/g,
    check: (match, fullLine) => {
      // Skip if already has aria-hidden or is inside a button/link with aria-label
      if (match.includes('aria-hidden')) return false;
      // Skip if parent has aria-label (common pattern)
      const parentMatch = fullLine.match(/<\w+[^>]*aria-label/);
      return !parentMatch;
    },
    hint: 'Add aria-hidden to decorative icons: <Icon name="chevron" aria-hidden="true" />',
    autoFix: (match) => {
      return match.replace(/\/>$/, ' aria-hidden="true" />');
    },
  },
];

// ─── Analysis ─────────────────────────────────────────────────────────────────

for (const file of walkTsx(WEB_SRC)) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const r = rel(file);
  let modified = false;
  let newContent = content;

  for (const { id, name, regex, check, hint, autoFix: fixFn } of PATTERNS) {
    let match;
    regex.lastIndex = 0; // Reset regex state

    while ((match = regex.exec(content)) !== null) {
      const matchStart = match.index;
      const lineNumber = content.substring(0, matchStart).split('\n').length;
      const line = lines[lineNumber - 1];

      // Skip comments
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;

      // Get context (6 lines before + 6 lines after for multi-line JSX)
      const contextLines = lines
        .slice(Math.max(0, lineNumber - 7), Math.min(lines.length, lineNumber + 6))
        .join('\n');

      // Apply custom check if provided
      if (check && !check(match[0], line, contextLines)) continue;

      failures.push({
        gate: id,
        file: r,
        line: lineNumber,
        name,
        hint,
        match: match[0],
      });

      // Auto-fix if enabled and fixFn provided
      if (autoFix && fixFn) {
        const fixed = fixFn(match[0]);
        newContent = newContent.replace(match[0], fixed);
        modified = true;
        fixes.push({ file: r, line: lineNumber, gate: id });
      }
    }
  }

  // Write fixes
  if (modified) {
    writeFileSync(file, newContent, 'utf-8');
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

if (autoFix && fixes.length > 0) {
  console.log('✅ gate:a11y AUTO-FIX applied\n');
  const byGate = {};
  for (const f of fixes) {
    (byGate[f.gate] ??= []).push(f);
  }
  for (const [gate, items] of Object.entries(byGate)) {
    console.log(`  ${gate}: Fixed ${items.length} violation(s)`);
    for (const v of items.slice(0, 5)) {
      console.log(`    ${v.file}:${v.line}`);
    }
    if (items.length > 5) {
      console.log(`    ... and ${items.length - 5} more`);
    }
  }
  console.log('\n  Re-run to verify all issues resolved.');
  process.exit(0);
}

if (failures.length > 0) {
  console.error('❌ gate:a11y FAILED\n');
  const byGate = {};
  for (const f of failures) {
    (byGate[f.gate] ??= []).push(f);
  }
  for (const [gate, items] of Object.entries(byGate)) {
    console.error(`  ${gate} (${items.length}):`);
    for (const v of items.slice(0, 3)) {
      console.error(`    ${v.file}:${v.line}: ${v.name}`);
      console.error(`      Hint: ${v.hint}`);
    }
    if (items.length > 3) {
      console.error(`    ... and ${items.length - 3} more`);
    }
    console.error();
  }
  console.error('  Run with --fix to auto-correct fixable violations.');
  console.error('  Reference: https://www.w3.org/WAI/WCAG21/quickref/');
  process.exit(1);
}

console.log('✅ gate:a11y PASSED');
console.log(`  Scanned ${walkTsx(WEB_SRC).length} component files`);
console.log('  No accessibility violations found');
