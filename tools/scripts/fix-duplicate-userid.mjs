#!/usr/bin/env node
/**
 * Fix duplicate userId declarations left by migrate-identity.mjs.
 *
 * Pattern to remove:
 *   const { tenantId, userId } = extractIdentity(req);
 *   const userId = (req.headers['x-user-id'] as string) ?? 'system';
 *
 * Should become:
 *   const { tenantId, userId } = extractIdentity(req);
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

function findRouteFiles(dir, results = []) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) findRouteFiles(full, results);
      else if (entry.endsWith('-routes.ts') || entry === 'approval-routes.ts') results.push(full);
    }
  } catch { /* dir doesn't exist */ }
  return results;
}

const files = [
  ...findRouteFiles(join(ROOT, 'packages', 'modules', 'finance', 'src', 'slices')),
  ...findRouteFiles(join(ROOT, 'packages', 'modules', 'finance', 'src', 'shared', 'routes')),
];

let totalFiles = 0;
let totalFixes = 0;

for (const fp of files) {
  let content = readFileSync(fp, 'utf-8');
  const rel = relative(ROOT, fp);
  let fixes = 0;

  // Remove lines that are duplicate userId declarations after extractIdentity
  // Pattern: any line containing "const userId = (req.headers['x-user-id']" or "const userId = req.headers['x-user-id']"
  const lines = content.split('\n');
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // Check if this is a duplicate userId header read
    if (
      (trimmed.startsWith("const userId = (req.headers") && trimmed.includes("x-user-id")) ||
      (trimmed.startsWith("const userId = req.headers['x-user-id']") || trimmed.startsWith('const userId = req.headers["x-user-id"]'))
    ) {
      // Verify the previous non-empty line has extractIdentity
      let prevIdx = i - 1;
      while (prevIdx >= 0 && newLines[newLines.length - 1 - (i - 1 - prevIdx)]?.trim() === '') prevIdx--;
      const prevLine = newLines[newLines.length - 1] || '';
      if (prevLine.includes('extractIdentity(req)')) {
        fixes++;
        continue; // skip this duplicate line
      }
    }
    newLines.push(line);
  }

  if (fixes > 0) {
    writeFileSync(fp, newLines.join('\n'), 'utf-8');
    totalFiles++;
    totalFixes += fixes;
    console.log(`  ✓ ${rel} (${fixes} duplicate userId lines removed)`);
  }
}

console.log(`\nDone: ${totalFiles} files fixed, ${totalFixes} duplicate lines removed.`);
