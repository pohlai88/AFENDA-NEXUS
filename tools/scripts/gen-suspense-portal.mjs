#!/usr/bin/env node
/**
 * Add <Suspense> wrappers to supplier-portal pages that have multiple early returns.
 * Strategy: wrap only the LAST return statement's JSX in Suspense.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const listFile = join(tmpdir(), 'missing-suspense-utf8.txt');
const files = readFileSync(listFile, 'utf8').trim().split(/\r?\n/).map(d => d.trim()).filter(Boolean);

const BASE = 'apps/web/src';
let patched = 0;

for (const file of files) {
  const fp = join(BASE, file);
  if (!existsSync(fp)) continue;

  let content = readFileSync(fp, 'utf8');

  // Skip client components or already-fixed
  if (content.trimStart().startsWith("'use client'") || content.trimStart().startsWith('"use client"')) continue;
  if (/<Suspense/.test(content)) continue;
  const awaitCount = (content.match(/\bawait\s/g) || []).length;
  if (awaitCount < 2) continue;

  // Add Suspense import
  if (!content.includes('Suspense')) {
    if (content.includes("from 'react'")) {
      content = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*'react'/,
        (m, imports) => imports.includes('Suspense') ? m : `import { Suspense, ${imports.trim()} } from 'react'`
      );
    } else {
      const lines = content.split('\n');
      let idx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) { idx = i; break; }
      }
      lines.splice(idx, 0, "import { Suspense } from 'react';");
      content = lines.join('\n');
    }
  }

  // Add LoadingSkeleton import
  if (!content.includes('LoadingSkeleton')) {
    const lines = content.split('\n');
    let lastImport = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) lastImport = i;
    }
    lines.splice(lastImport + 1, 0, "import { LoadingSkeleton } from '@/components/erp/loading-skeleton';");
    content = lines.join('\n');
  }

  // Find ALL return ( positions
  const returnPattern = /\breturn\s*\(/g;
  const returns = [];
  let m;
  while ((m = returnPattern.exec(content)) !== null) {
    returns.push(m.index);
  }

  if (returns.length === 0) continue;

  // Wrap the LAST return's JSX
  const lastReturnIdx = returns[returns.length - 1];
  const afterLastReturn = content.slice(lastReturnIdx);

  // Find the opening ( after return
  const openParen = afterLastReturn.indexOf('(');
  if (openParen === -1) continue;

  // Find matching closing ) by counting parens
  let depth = 0;
  let closeIdx = -1;
  for (let i = openParen; i < afterLastReturn.length; i++) {
    if (afterLastReturn[i] === '(') depth++;
    if (afterLastReturn[i] === ')') {
      depth--;
      if (depth === 0) { closeIdx = i; break; }
    }
  }

  if (closeIdx === -1) continue;

  // Extract the JSX content between ( and )
  const jsxContent = afterLastReturn.slice(openParen + 1, closeIdx).trim();

  // Replace with Suspense-wrapped version
  const wrapped = `(\n    <Suspense fallback={<LoadingSkeleton />}>\n    ${jsxContent}\n    </Suspense>\n  )`;
  const newAfter = afterLastReturn.slice(0, openParen) + wrapped + afterLastReturn.slice(closeIdx + 1);
  content = content.slice(0, lastReturnIdx) + newAfter;

  writeFileSync(fp, content, 'utf8');
  patched++;
}

console.log(`Patched ${patched} portal pages`);
