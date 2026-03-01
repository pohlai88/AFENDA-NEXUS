#!/usr/bin/env node
/**
 * Batch-generate error.tsx boundaries for route segments that are missing them.
 * Uses the same pattern as apps/web/src/app/(shell)/finance/error.tsx.
 *
 * Usage: node tools/scripts/gen-error-boundaries.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const listFile = join(tmpdir(), 'missing-error-dirs-utf8.txt');
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
  return pascal + 'Error';
}

function template(name) {
  return [
    "'use client';",
    '',
    "import { useEffect } from 'react';",
    "import { ErrorDisplay } from '@/components/erp/error-boundary';",
    "import { reportError } from '@/lib/error-reporting';",
    '',
    `export default function ${name}({`,
    '  error,',
    '  reset,',
    '}: {',
    '  error: Error & { digest?: string };',
    '  reset: () => void;',
    '}) {',
    '  useEffect(() => {',
    `    reportError(error, { component: '${name}' });`,
    '  }, [error]);',
    '',
    '  return (',
    '    <main className="flex min-h-[50vh] flex-col items-center justify-center px-4">',
    '      <ErrorDisplay error={error} reset={reset} showHomeLink showBackLink />',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
}

let created = 0;
for (const dir of dirs) {
  const fp = join(BASE, dir, 'error.tsx');
  if (!existsSync(fp)) {
    const name = toComponentName(dir);
    writeFileSync(fp, template(name), 'utf8');
    created++;
  }
}

console.log(`Created ${created} error.tsx files out of ${dirs.length} missing.`);
