#!/usr/bin/env node
/**
 * Batch-add `export const metadata` to page.tsx files that are missing it.
 * Derives the title from the route path.
 *
 * Usage: node tools/scripts/gen-metadata-exports.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const listFile = join(tmpdir(), 'missing-metadata-utf8.txt');
if (!existsSync(listFile)) {
  console.error('Run web-drift-check first to generate the list.');
  process.exit(1);
}

const files = readFileSync(listFile, 'utf8')
  .trim()
  .split(/\r?\n/)
  .map((d) => d.trim())
  .filter(Boolean);

const BASE = 'apps/web/src';

function deriveTitle(filePath) {
  // e.g. app/(shell)/finance/payables/holds/page.tsx => Payables Holds
  const cleaned = filePath
    .replace(/^app\/\(shell\)\//, '')
    .replace(/^app\/\(auth\)\//, '')
    .replace(/^app\/\(supplier-portal\)\//, '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\[([^\]]+)\]/g, ''); // Remove dynamic segments

  const parts = cleaned
    .split('/')
    .filter(Boolean)
    .filter((p) => p !== 'finance'); // Drop common prefix

  if (parts.length === 0) return 'Finance';

  return parts
    .map((p) =>
      p
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    )
    .join(' — ');
}

let patched = 0;
for (const file of files) {
  const fp = join(BASE, file);
  if (!existsSync(fp)) continue;

  const content = readFileSync(fp, 'utf8');
  if (content.includes('export const metadata') || content.includes('generateMetadata')) {
    continue;
  }

  const title = deriveTitle(file);
  const metaLine = `export const metadata = { title: '${title}' };\n`;

  // Insert after imports block — find first blank line after imports
  const lines = content.split('\n');
  let insertIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' && i > 0 && (lines[i - 1].trim().startsWith('import ') || lines[i - 1].trim().endsWith("';"))) {
      insertIdx = i;
      break;
    }
  }

  if (insertIdx === -1) {
    // Fallback: insert after all import lines
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith('import ')) {
        insertIdx = i + 1;
        break;
      }
    }
  }

  if (insertIdx === -1) {
    console.warn(`  Skipping ${file} — could not find import block.`);
    continue;
  }

  lines.splice(insertIdx, 0, '', metaLine.trimEnd());
  writeFileSync(fp, lines.join('\n'), 'utf8');
  patched++;
}

console.log(`Patched ${patched} page.tsx files with metadata out of ${files.length} missing.`);
