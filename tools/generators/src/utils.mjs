#!/usr/bin/env node
/**
 * @generated — do not edit manually
 * Shared utilities for @afenda/generators.
 *
 * Naming conventions, file I/O, anchored-region patching, formatting.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

// ─── Naming Conventions ──────────────────────────────────────────────────────

/** PascalCase → kebab-case: "ArInvoice" → "ar-invoice" */
export function toKebab(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/** kebab-case or PascalCase → PascalCase */
export function toPascal(str) {
  return str
    .replace(/(^|[-_])([a-z])/g, (_, _sep, ch) => ch.toUpperCase())
    .replace(/[-_]/g, '');
}

/** PascalCase or kebab-case → camelCase */
export function toCamel(str) {
  const pascal = toPascal(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/** PascalCase → SCREAMING_SNAKE_CASE: "ArInvoice" → "AR_INVOICE" */
export function toScreamingSnake(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toUpperCase();
}

/** PascalCase → snake_case: "ArInvoice" → "ar_invoice" */
export function toSnake(str) {
  return toScreamingSnake(str).toLowerCase();
}

/** PascalCase → Title Case: "ArInvoice" → "AR Invoice" */
export function toTitleCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

// ─── File I/O ────────────────────────────────────────────────────────────────

const GENERATED_HEADER_TS = '// @generated — do not edit manually\n';
const GENERATED_HEADER_SQL = '-- @generated — do not edit manually\n';
const GENERATED_HEADER_JSON = '"_generated": true';

/**
 * Resolve the monorepo root by walking up from cwd looking for pnpm-workspace.yaml.
 */
export function resolveRoot(from = process.cwd()) {
  let dir = resolve(from);
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('Could not find monorepo root (pnpm-workspace.yaml)');
}

/**
 * Read and parse a JSON file. Returns parsed object.
 */
export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

/**
 * Deterministic, safe file writer.
 *
 * Rules:
 * - Normalises to LF newlines
 * - Prepends @generated header for .ts/.tsx/.mjs files
 * - If file exists WITHOUT @generated header → refuses (unless force=true)
 * - If file exists WITH @generated header → overwrites
 * - Creates parent directories as needed
 *
 * @param {string} filePath  Absolute path
 * @param {string} content   File content (raw, before header)
 * @param {{ force?: boolean, header?: string }} options
 * @returns {{ action: 'created'|'overwritten'|'skipped', path: string }}
 */
export function safeWrite(filePath, content, options = {}) {
  const { force = false } = options;

  // Choose header based on extension
  let header = '';
  if (filePath.endsWith('.sql')) {
    header = GENERATED_HEADER_SQL;
  } else if (filePath.endsWith('.json')) {
    header = ''; // JSON doesn't support comments; we track via _generated key
  } else if (
    filePath.endsWith('.ts') ||
    filePath.endsWith('.tsx') ||
    filePath.endsWith('.mjs') ||
    filePath.endsWith('.js')
  ) {
    header = GENERATED_HEADER_TS;
  }

  // Normalise newlines to LF
  let finalContent = (header + content).replace(/\r\n/g, '\n');
  // Ensure trailing newline
  if (!finalContent.endsWith('\n')) finalContent += '\n';

  // Check existing file
  if (existsSync(filePath)) {
    const existing = readFileSync(filePath, 'utf-8');
    const hasGeneratedMarker =
      existing.includes('// @generated') ||
      existing.includes('-- @generated') ||
      existing.includes('"_generated": true');

    if (!hasGeneratedMarker && !force) {
      return { action: 'skipped', path: filePath };
    }
    // Safe to overwrite
    writeFileSync(filePath, finalContent, 'utf-8');
    return { action: 'overwritten', path: filePath };
  }

  // New file — create parent dirs and write
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, finalContent, 'utf-8');
  return { action: 'created', path: filePath };
}

// ─── Migration Numbering ─────────────────────────────────────────────────────

/**
 * Scan a migrations directory for NNNN_*.sql files and return the next number.
 * Adds a timestamp suffix for branch-collision safety.
 *
 * @param {string} migrationsDir  Absolute path to migrations directory
 * @param {string} name           Migration name (kebab-case)
 * @returns {string} Full filename like "0013_ar_customer__20260227.sql"
 */
export function nextMigrationFilename(migrationsDir, name) {
  let maxNum = -1;
  if (existsSync(migrationsDir)) {
    for (const f of readdirSync(migrationsDir)) {
      const match = f.match(/^(\d{4})_/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  const nextNum = String(maxNum + 1).padStart(4, '0');
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${nextNum}_${name}__${today}.sql`;
}

// ─── Anchored Region Patching ────────────────────────────────────────────────

/**
 * Insert content into an anchored region within a file.
 *
 * Regions are delimited by:
 *   // @afenda-gen:{regionName}:start
 *   // @afenda-gen:{regionName}:end
 *
 * New content is inserted before the :end marker. Duplicates (by exact line)
 * are skipped.
 *
 * @param {string} filePath    Absolute path to file
 * @param {string} regionName  Region identifier (e.g. 'routes', 'events')
 * @param {string} insertion   Line(s) to insert
 * @returns {{ patched: boolean, reason?: string }}
 */
export function patchAnchoredRegion(filePath, regionName, insertion) {
  if (!existsSync(filePath)) {
    return { patched: false, reason: `File not found: ${filePath}` };
  }

  const content = readFileSync(filePath, 'utf-8');
  const startMarker = `// @afenda-gen:${regionName}:start`;
  const endMarker = `// @afenda-gen:${regionName}:end`;

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    return { patched: false, reason: `Anchored region '${regionName}' not found in ${filePath}` };
  }

  // Check if insertion already present (exact line match)
  const regionContent = content.slice(startIdx, endIdx);
  const trimmedInsertion = insertion.trim();
  if (regionContent.includes(trimmedInsertion)) {
    return { patched: false, reason: 'Already present' };
  }

  // Insert before end marker
  const before = content.slice(0, endIdx);
  const after = content.slice(endIdx);

  // Ensure insertion ends with newline and proper indentation
  const insertionLine = trimmedInsertion.endsWith('\n') ? trimmedInsertion : trimmedInsertion + '\n';
  const indent = '  '; // Match typical 2-space indent in registry objects

  const newContent = before + indent + insertionLine + after;
  writeFileSync(filePath, newContent.replace(/\r\n/g, '\n'), 'utf-8');
  return { patched: true };
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Run prettier on a list of files. Silently skips if prettier not found.
 * @param {string[]} filePaths  Absolute paths to format
 * @param {string} root         Monorepo root
 */
export function runFormatter(filePaths, root) {
  if (filePaths.length === 0) return;

  // Filter to only existing files
  const existing = filePaths.filter((f) => existsSync(f));
  if (existing.length === 0) return;

  try {
    const files = existing.map((f) => `"${f}"`).join(' ');
    execSync(`npx prettier --write ${files}`, {
      cwd: root,
      stdio: 'ignore',
      timeout: 30_000,
    });
  } catch {
    // Prettier not available or failed — non-fatal
  }
}

// ─── Printing Helpers ────────────────────────────────────────────────────────

/**
 * Print a coloured summary of generator results.
 * @param {{ created: string[], overwritten: string[], skipped: string[], patched: string[] }} results
 */
export function printSummary(results) {
  const { created = [], overwritten = [], skipped = [], patched = [] } = results;

  if (created.length > 0) {
    console.log(`\n✅ Created ${created.length} files:`);
    for (const f of created) console.log(`   ${f}`);
  }
  if (overwritten.length > 0) {
    console.log(`\n♻️  Overwritten ${overwritten.length} files:`);
    for (const f of overwritten) console.log(`   ${f}`);
  }
  if (patched.length > 0) {
    console.log(`\n🔧 Patched ${patched.length} files:`);
    for (const f of patched) console.log(`   ${f}`);
  }
  if (skipped.length > 0) {
    console.log(`\n⚠️  Skipped ${skipped.length} files (no @generated header, use --force):`);
    for (const f of skipped) console.log(`   ${f}`);
  }
}
