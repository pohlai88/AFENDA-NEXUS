#!/usr/bin/env node
/**
 * fix-rbp-04 — Auto-fix RBP-04: {x && <X>} → {x ? <X> : null}
 * Prevents rendering 0/NaN when x is falsy.
 * Reference: .agents/skills/vercel-react-best-practices/rules/rendering-conditional-render.md
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');

function findFiles(dir, pattern, results = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.next') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) findFiles(full, pattern, results);
    else if (pattern.test(entry)) results.push(full);
  }
  return results;
}

function fixLine(line) {
  // Match { word && < ... } — exclude already-fixed (has ?)
  if (!/\{\s*\w+\s+&&\s+</.test(line) || /\?\s*</.test(line)) return line;
  if (/>\s*0\s*\?/.test(line) || /length\s*>\s*0/.test(line)) return line;

  // Replace "word &&" with "word ?"
  let fixed = line.replace(/\{\s*(\w+)\s+&&\s+/, '{ $1 ? ');
  // Add : null before the closing } of the expression (last } on line)
  fixed = fixed.replace(/\}\s*$/, ' : null}');
  return fixed;
}

const jsxFiles = findFiles(WEB_SRC, /\.tsx$/).filter((f) => !f.includes('.test.'));
let totalFixed = 0;

for (const fp of jsxFiles) {
  const content = readFileSync(fp, 'utf-8');
  const lines = content.split('\n');
  const fixedLines = lines.map(fixLine);
  if (fixedLines.some((l, i) => l !== lines[i])) {
    writeFileSync(fp, fixedLines.join('\n'), 'utf-8');
    const count = fixedLines.filter((l, i) => l !== lines[i]).length;
    totalFixed += count;
    console.log(relative(ROOT, fp).replace(/\\/g, '/') + ` (${count} fix${count > 1 ? 'es' : ''})`);
  }
}

console.log(`\nFixed ${totalFixed} RBP-04 violation(s).`);
