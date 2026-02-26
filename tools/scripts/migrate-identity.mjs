#!/usr/bin/env node
/**
 * Mechanical migration: replace header reads with extractIdentity(req).
 *
 * Pattern 1: (req.headers as Record<string, string>)['x-tenant-id']! + ['x-user-id']!
 * Pattern 2: req.headers['x-tenant-id'] as string + req.headers['x-user-id'] as string
 *
 * Both become: const { tenantId, userId } = extractIdentity(req);
 *
 * Also adds the import for extractIdentity from @afenda/api-kit.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SLICES_DIR = join(ROOT, 'packages', 'modules', 'finance', 'src', 'slices');
const SHARED_ROUTES_DIR = join(ROOT, 'packages', 'modules', 'finance', 'src', 'shared', 'routes');

const IMPORT_LINE = `import { extractIdentity } from '@afenda/api-kit';`;

// Pattern 1: two-line cast pattern
const PATTERN1_TENANT = /const tenantId = \(req\.headers as Record<string, string>\)\['x-tenant-id'\]!;/g;
const PATTERN1_USER = /const userId = \(req\.headers as Record<string, string>\)\['x-user-id'\]!;/g;

// Pattern 2: simple cast pattern
const PATTERN2_TENANT = /const tenantId = req\.headers\['x-tenant-id'\] as string;/g;
const PATTERN2_USER = /const userId = req\.headers\['x-user-id'\] as string;/g;

function findRouteFiles(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        results.push(...findRouteFiles(full));
      } else if (entry.endsWith('-routes.ts') || entry === 'approval-routes.ts') {
        results.push(full);
      }
    }
  } catch { /* dir doesn't exist */ }
  return results;
}

let totalFiles = 0;
let totalReplacements = 0;

const files = [
  ...findRouteFiles(SLICES_DIR),
  ...findRouteFiles(SHARED_ROUTES_DIR),
];

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf-8');
  const rel = relative(ROOT, filePath);

  // Check if file has header reads
  const hasTenantHeader = content.includes("x-tenant-id") &&
    (PATTERN1_TENANT.test(content) || PATTERN2_TENANT.test(content));

  // Reset regex lastIndex
  PATTERN1_TENANT.lastIndex = 0;
  PATTERN1_USER.lastIndex = 0;
  PATTERN2_TENANT.lastIndex = 0;
  PATTERN2_USER.lastIndex = 0;

  if (!hasTenantHeader) continue;

  let replacements = 0;

  // Replace two-line patterns with single extractIdentity call
  // First replace tenant line with the combined call
  content = content.replace(PATTERN1_TENANT, () => {
    replacements++;
    return 'const { tenantId, userId } = extractIdentity(req);';
  });
  // Remove the now-redundant userId line
  content = content.replace(/\s*const userId = \(req\.headers as Record<string, string>\)\['x-user-id'\]!;\n/g, '\n');

  // Same for pattern 2
  PATTERN2_TENANT.lastIndex = 0;
  content = content.replace(PATTERN2_TENANT, () => {
    replacements++;
    return 'const { tenantId, userId } = extractIdentity(req);';
  });
  content = content.replace(/\s*const userId = req\.headers\['x-user-id'\] as string;\n/g, '\n');

  if (replacements === 0) continue;

  // Add import if not present
  if (!content.includes('extractIdentity')) {
    // This shouldn't happen since we just added it, but safety check
    continue;
  }
  if (!content.includes("from '@afenda/api-kit'")) {
    // Add import after the last existing import
    const lastImportIdx = content.lastIndexOf('\nimport ');
    if (lastImportIdx !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIdx + 1);
      content = content.slice(0, endOfLine + 1) + IMPORT_LINE + '\n' + content.slice(endOfLine + 1);
    }
  }

  writeFileSync(filePath, content, 'utf-8');
  totalFiles++;
  totalReplacements += replacements;
  console.log(`  ✓ ${rel} (${replacements} replacements)`);
}

console.log(`\nDone: ${totalFiles} files updated, ${totalReplacements} header reads replaced.`);
