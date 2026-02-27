#!/usr/bin/env node
/**
 * CI Gate: Kernel Invariants (G-KRN-01 through G-KRN-05)
 *
 * Checks:
 * G-KRN-01: All /settings/** routes use requireOrgRole() or auth guard
 * G-KRN-02: All /admin/** routes use requirePlatformAdmin / requireAdmin
 * G-KRN-03: TenantSettingsSchema + UserPreferencesSchema exported from contracts
 * G-KRN-04: buildInitialTenantContext (kernel context) used in shell layout
 * G-KRN-05: No direct reads of x-tenant-id / x-org-id in route handlers (legacy marker required)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
let failures = 0;

function fail(gate, message) {
  console.error(`  ❌ ${gate}: ${message}`);
  failures++;
}

function pass(gate, message) {
  console.log(`  ✅ ${gate}: ${message}`);
}

function walkFiles(dir, ext) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
          results.push(...walkFiles(full, ext));
        } else if (stat.isFile() && full.endsWith(ext)) {
          results.push(full);
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results;
}

console.log('\n🔒 Kernel Invariant Gates\n');

// ─── G-KRN-01: Settings routes use auth guards ──────────────────────────────
console.log('G-KRN-01: Settings routes use auth guards');
{
  const settingsDir = join(ROOT, 'apps/web/src/app/(shell)/settings');
  const pages = walkFiles(settingsDir, 'page.tsx');
  let checked = 0;
  for (const page of pages) {
    const content = readFileSync(page, 'utf-8');
    const rel = relative(ROOT, page);
    // Server pages should call getRequestContext, requireAuth, or requireOrgRole
    const hasGuard = /requireAuth|getRequestContext|requireOrgRole/.test(content);
    if (!hasGuard) {
      // Client-only pages that fetch via API are OK (API has its own guards)
      const fetchesApi = /createApiClient|api\.get|api\.post|api\.patch/.test(content);
      if (!fetchesApi) {
        fail('G-KRN-01', `${rel} — no auth guard or API call found`);
      }
    }
    checked++;
  }
  if (failures === 0) pass('G-KRN-01', `${checked} settings pages checked`);
}

// ─── G-KRN-02: Admin routes use requirePlatformAdmin / requireAdmin ─────────
console.log('G-KRN-02: Admin routes use platform admin guard');
{
  const adminRouteFile = join(ROOT, 'apps/api/src/routes/kernel-admin.ts');
  try {
    const content = readFileSync(adminRouteFile, 'utf-8');
    const hasGuard = /requireAdmin|requirePlatformAdmin/.test(content);
    if (!hasGuard) {
      fail('G-KRN-02', 'kernel-admin.ts missing requireAdmin/requirePlatformAdmin guard');
    } else {
      // Check that preHandler is used on routes
      const routeCount = (content.match(/preHandler.*requireAdmin/g) || []).length;
      if (routeCount < 3) {
        fail('G-KRN-02', `Only ${routeCount} routes use requireAdmin preHandler (expected ≥3)`);
      } else {
        pass('G-KRN-02', `${routeCount} admin routes guarded`);
      }
    }
  } catch {
    fail('G-KRN-02', 'kernel-admin.ts not found');
  }
}

// ─── G-KRN-03: Kernel schemas exported from contracts ───────────────────────
console.log('G-KRN-03: Kernel schemas exported from contracts');
{
  const contractsIndex = join(ROOT, 'packages/contracts/src/index.ts');
  const kernelIndex = join(ROOT, 'packages/contracts/src/kernel/index.ts');
  try {
    const mainContent = readFileSync(contractsIndex, 'utf-8');
    const kernelContent = readFileSync(kernelIndex, 'utf-8');

    const checks = [
      ['TenantSettingsSchema', kernelContent],
      ['UserPreferencesSchema', kernelContent],
      ['SystemConfigValueSchema', kernelContent],
      ['KernelEventType', kernelContent],
      ["kernel/index", mainContent],
    ];

    let passed = 0;
    for (const [name, content] of checks) {
      if (!content.includes(name)) {
        fail('G-KRN-03', `${name} not found in contracts`);
      } else {
        passed++;
      }
    }
    if (passed === checks.length) pass('G-KRN-03', `${passed} kernel exports verified`);
  } catch (e) {
    fail('G-KRN-03', `Cannot read contracts: ${e.message}`);
  }
}

// ─── G-KRN-04: Kernel context used in shell layout ─────────────────────────
console.log('G-KRN-04: Kernel context used in shell layout');
{
  const shellLayout = join(ROOT, 'apps/web/src/app/(shell)/layout.tsx');
  try {
    const content = readFileSync(shellLayout, 'utf-8');
    const hasKernelContext = /buildInitialTenantContext|buildKernelContext|getKernelContext/.test(content);
    if (!hasKernelContext) {
      fail('G-KRN-04', 'Shell layout does not use kernel/tenant context builder');
    } else {
      pass('G-KRN-04', 'Shell layout uses kernel context builder');
    }
  } catch {
    fail('G-KRN-04', 'Shell layout not found');
  }
}

// ─── G-KRN-05: No direct x-tenant-id / x-org-id reads in route handlers ────
console.log('G-KRN-05: No unguarded identity header reads in routes');
{
  const routeFiles = walkFiles(join(ROOT, 'apps/api/src/routes'), '.ts');
  let violations = 0;
  for (const file of routeFiles) {
    const content = readFileSync(file, 'utf-8');
    const rel = relative(ROOT, file);
    // Check for direct header reads of x-tenant-id or x-org-id in route files
    // (middleware reads are OK, but route handlers should use req.authUser)
    const headerReads = content.match(/headers?\[['"]x-tenant-id['"]\]|headers?\.get\(['"]x-tenant-id['"]\)|headers?\[['"]x-org-id['"]\]/g);
    if (headerReads) {
      fail('G-KRN-05', `${rel} — direct x-tenant-id/x-org-id header read (use req.authUser)`);
      violations++;
    }
  }
  if (violations === 0) pass('G-KRN-05', `${routeFiles.length} route files clean`);
}

// Also check the web api-client for legacy marker
{
  const apiClient = join(ROOT, 'apps/web/src/lib/api-client.ts');
  try {
    const content = readFileSync(apiClient, 'utf-8');
    if (content.includes('x-tenant-id') && !content.includes('LEGACY')) {
      fail('G-KRN-05', 'api-client.ts sets x-tenant-id without LEGACY marker');
    }
  } catch { /* skip */ }
}

// ─── Summary ────────────────────────────────────────────────────────────────
console.log('');
if (failures > 0) {
  console.error(`\n💥 ${failures} kernel invariant violation(s) found.\n`);
  process.exit(1);
} else {
  console.log('\n✅ All kernel invariant gates passed.\n');
}
