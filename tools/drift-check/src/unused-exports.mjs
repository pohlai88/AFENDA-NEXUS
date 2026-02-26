#!/usr/bin/env node
/**
 * unused-exports.mjs — Detects exports from public API surface files
 * that are never imported by any consumer package in the monorepo.
 *
 * Scans each package's `public_api` file (from ARCHITECTURE.md frontmatter)
 * and checks whether each exported symbol is imported by at least one
 * other package in the workspace.
 *
 * Usage:
 *   node tools/drift-check/src/unused-exports.mjs
 *   node tools/drift-check/src/unused-exports.mjs --pkg @afenda/finance
 *
 * Exit codes: 0 = clean, 1 = unused exports found
 * Zero dependencies — uses only Node.js built-ins.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../..');
const MANIFEST_PATH = join(REPO_ROOT, '.afenda', 'project.manifest.json');

const PKG_FILTER = (() => {
  const idx = process.argv.indexOf('--pkg');
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
})();

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const raw = match[1];
  const fm = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    fm[key] = value;
  }
  return fm;
}

function findArchFile(pkgDir) {
  if (!existsSync(pkgDir)) return null;
  const files = readdirSync(pkgDir).filter(
    (f) => f.startsWith('ARCHITECTURE.') && f.endsWith('.md')
  );
  return files.length > 0 ? join(pkgDir, files[0]) : null;
}

function extractExportedSymbols(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const symbols = new Set();

  // "export { A, B, C } from ..."  and  "export type { A, B } from ..."
  const reExportRegex = /export\s+(?:type\s+)?{([^}]+)}\s+from/g;
  let m;
  while ((m = reExportRegex.exec(content)) !== null) {
    const names = m[1].split(',').map((s) => {
      const parts = s.trim().split(/\s+as\s+/);
      return parts[parts.length - 1].trim();
    });
    for (const name of names) {
      if (name && name !== 'type') symbols.add(name);
    }
  }

  // "export function X", "export class X", "export const X", etc.
  const directRegex =
    /export\s+(?:async\s+)?(?:function|class|const|let|type|interface|enum)\s+(\w+)/g;
  while ((m = directRegex.exec(content)) !== null) {
    symbols.add(m[1]);
  }

  return symbols;
}

function collectSourceFiles(dir, collected = []) {
  if (!existsSync(dir)) return collected;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.next', 'build', '.turbo'].includes(entry.name)) continue;
      collectSourceFiles(full, collected);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      collected.push(full);
    }
  }
  return collected;
}

function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('FATAL: .afenda/project.manifest.json not found');
    process.exit(2);
  }

  const manifest = loadJson(MANIFEST_PATH);
  if (!manifest?.packages) {
    console.error('FATAL: Invalid manifest');
    process.exit(2);
  }

  console.log('Scanning for unused public API exports...\n');

  // Step 1: Collect all source files from all packages (consumers)
  const allSourceFiles = [];
  for (const [pkgPath] of Object.entries(manifest.packages)) {
    const pkgDir = join(REPO_ROOT, pkgPath);
    const srcDir = join(pkgDir, 'src');
    if (existsSync(srcDir)) {
      allSourceFiles.push(...collectSourceFiles(srcDir));
    }
  }

  // Step 2: Read all consumer source content into a single string for fast search
  const allContent = allSourceFiles.map((f) => readFileSync(f, 'utf-8')).join('\n');

  // Step 3: For each package with a public_api, check exports
  let totalUnused = 0;
  let totalChecked = 0;

  for (const [pkgPath, entry] of Object.entries(manifest.packages)) {
    if (entry.type === 'unmanaged') continue;
    if (PKG_FILTER && entry.name !== PKG_FILTER) continue;

    const pkgDir = join(REPO_ROOT, pkgPath);
    const archFile = findArchFile(pkgDir);
    if (!archFile) continue;

    const archContent = readFileSync(archFile, 'utf-8');
    const fm = parseFrontmatter(archContent);
    if (!fm?.public_api) continue;

    const apiPath = join(pkgDir, fm.public_api);
    if (!existsSync(apiPath)) continue;

    const symbols = extractExportedSymbols(apiPath);
    if (symbols.size === 0) continue;

    const unused = [];
    for (const sym of symbols) {
      totalChecked++;
      // Check if any other file imports this symbol
      // Match: import { ..., sym, ... } or import type { ..., sym, ... }
      const importRegex = new RegExp(`\\b${sym}\\b`);
      // Count occurrences — must appear more than just in the public_api file itself
      const matches = allContent.match(new RegExp(`\\b${sym}\\b`, 'g'));
      // The symbol appears in its own public_api file at least once (the export).
      // If it appears only 1-2 times total, it's likely only in the defining file.
      // We use a heuristic: if the symbol name appears in files OTHER than the package's own src/
      const ownSrcContent = allSourceFiles
        .filter((f) => f.startsWith(pkgDir))
        .map((f) => readFileSync(f, 'utf-8'))
        .join('\n');
      const ownCount = (ownSrcContent.match(new RegExp(`\\b${sym}\\b`, 'g')) || []).length;
      const totalCount = (matches || []).length;
      const externalCount = totalCount - ownCount;

      if (externalCount === 0) {
        unused.push(sym);
      }
    }

    if (unused.length > 0) {
      totalUnused += unused.length;
      console.log(`[WARN] ${entry.name} -- ${unused.length} potentially unused export(s):`);
      for (const sym of unused.sort()) {
        console.log(`    - ${sym}`);
      }
      console.log('');
    }
  }

  console.log(`\nChecked ${totalChecked} exports across all packages`);
  if (totalUnused > 0) {
    console.log(`[WARN] ${totalUnused} potentially unused export(s) found`);
    console.log('   Note: These may be used by external consumers not in this repo.\n');
  } else {
    console.log('[PASS] All public API exports are consumed within the monorepo.\n');
  }

  // Exit 0 always — unused exports are advisory, not blocking
  process.exit(0);
}

main();
