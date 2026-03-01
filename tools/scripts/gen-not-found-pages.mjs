#!/usr/bin/env node
/**
 * Batch-generate not-found.tsx for top-level route modules that are missing them.
 * Uses the same pattern as apps/web/src/app/(shell)/finance/not-found.tsx.
 *
 * Usage: node tools/scripts/gen-not-found-pages.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const listFile = join(tmpdir(), 'missing-notfound-utf8.txt');
if (!existsSync(listFile)) {
  console.error('Run web-drift-check first to generate the list.');
  process.exit(1);
}

const dirs = readFileSync(listFile, 'utf8')
  .trim()
  .split(/\r?\n/)
  .map((d) => d.trim())
  .filter(Boolean);

const BASE = 'apps/web/src';

function toComponentName(dir) {
  const cleaned = dir
    .replace(/^app\/\(shell\)\//, '')
    .replace(/^app\/\(auth\)\//, '')
    .replace(/^app\/\(supplier-portal\)\//, '')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\/$/, '');
  const parts = cleaned.split('/');
  const pascal = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '');
  return pascal + 'NotFound';
}

function friendlyLabel(dir) {
  const cleaned = dir
    .replace(/^app\/\(shell\)\//, '')
    .replace(/^app\/\(auth\)\//, '')
    .replace(/^app\/\(supplier-portal\)\//, '')
    .replace(/\/$/, '');
  const last = cleaned.split('/').pop() || cleaned;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
}

function template(name, label) {
  return [
    "import Link from 'next/link';",
    "import { Button } from '@/components/ui/button';",
    "import { FileQuestion } from 'lucide-react';",
    '',
    `export default function ${name}() {`,
    '  return (',
    '    <main className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">',
    '      <FileQuestion className="h-12 w-12 text-muted-foreground" />',
    '      <h2 className="mt-4 text-lg font-semibold">Page Not Found</h2>',
    '      <p className="mt-1 max-w-sm text-sm text-muted-foreground">',
    `        The ${label.toLowerCase()} page you&apos;re looking for doesn&apos;t exist or has been moved.`,
    '      </p>',
    '      <Button asChild className="mt-6">',
    '        <Link href="/">Back to Home</Link>',
    '      </Button>',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
}

let created = 0;
for (const dir of dirs) {
  const fp = join(BASE, dir, 'not-found.tsx');
  if (!existsSync(fp)) {
    const name = toComponentName(dir);
    const label = friendlyLabel(dir);
    writeFileSync(fp, template(name, label), 'utf8');
    created++;
  }
}

console.log(`Created ${created} not-found.tsx files out of ${dirs.length} missing.`);
