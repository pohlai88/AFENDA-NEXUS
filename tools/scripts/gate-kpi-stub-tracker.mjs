#!/usr/bin/env node
/**
 * gate:kpi-stub-tracker — CI gate that detects hardcoded/stub KPI resolvers
 * that return placeholder data instead of calling real APIs.
 *
 * Rationale: Every dashboard in the app renders KPI cards via resolvers in
 * kpi-registry.server.ts. If resolvers return hardcoded numbers, dashboards
 * display fake data in production. This gate forces resolvers to call real
 * endpoints or be explicitly exempted with a ticket reference.
 *
 * Checks:
 *   KPI-STUB-01: Resolvers that don't call createApiClient() are flagged.
 *   KPI-STUB-02: The 'stub.comingSoon' resolver is tracked but exempt.
 *   KPI-STUB-03: Explicit exemptions require `// @gate-allow-stub: TICKET-123`.
 *
 * Usage: node tools/scripts/gate-kpi-stub-tracker.mjs
 */
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const KPI_REGISTRY = join(
  ROOT,
  'apps',
  'web',
  'src',
  'lib',
  'kpis',
  'kpi-registry.server.ts',
);
const MODULE_DEFS = join(
  ROOT,
  'apps',
  'web',
  'src',
  'lib',
  'modules',
  'module-definitions.server.ts',
);

function rel(fp) {
  return relative(ROOT, fp).replace(/\\/g, '/');
}

// ── Parse KPI registry ─────────────────────────────────────────────────────

function parseResolvers(content) {
  const resolvers = [];
  const lines = content.split('\n');

  // Find KPI_RESOLVERS object entries like: 'fin.cash': async () => ({
  let insideResolvers = false;
  let currentResolver = null;
  let braceDepth = 0;
  let resolverBody = '';
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('KPI_RESOLVERS') && line.includes('Record<')) {
      insideResolvers = true;
      continue;
    }

    if (!insideResolvers) continue;

    // Match resolver key: 'fin.cash': async () => ({
    const keyMatch = line.match(/^\s*'([^']+)'\s*:\s*async/);
    if (keyMatch && !currentResolver) {
      currentResolver = keyMatch[1];
      resolverBody = '';
      startLine = i + 1;
      braceDepth = 0;
    }

    if (currentResolver) {
      resolverBody += line + '\n';
      braceDepth += (line.match(/\(/g) || []).length;
      braceDepth -= (line.match(/\)/g) || []).length;

      // Resolver body ends when parens balance back (at the closing }),)
      if (braceDepth <= 0 && resolverBody.includes('=>')) {
        // Check for opt-out comment above the resolver
        const prevLines = lines
          .slice(Math.max(0, startLine - 3), startLine - 1)
          .join('\n');
        const exemptMatch = prevLines.match(
          /@gate-allow-stub:\s*(\S+)/,
        );

        resolvers.push({
          id: currentResolver,
          body: resolverBody,
          line: startLine,
          hasApiCall:
            resolverBody.includes('createApiClient') ||
            resolverBody.includes('fetch('),
          isComingSoonStub: currentResolver === 'stub.comingSoon',
          exemptTicket: exemptMatch ? exemptMatch[1] : null,
        });
        currentResolver = null;
        resolverBody = '';
      }
    }
  }

  return resolvers;
}

// ── Parse module definitions for stub.comingSoon references ─────────────────

function countComingSoonRefs(content) {
  const matches = content.match(/stub\.comingSoon/g);
  return matches ? matches.length : 0;
}

// ── Main ────────────────────────────────────────────────────────────────────

let registryContent;
try {
  registryContent = readFileSync(KPI_REGISTRY, 'utf-8');
} catch {
  console.error(
    `❌ gate:kpi-stub-tracker — Cannot read ${rel(KPI_REGISTRY)}`,
  );
  process.exit(1);
}

const resolvers = parseResolvers(registryContent);
const stubResolvers = resolvers.filter(
  (r) => !r.hasApiCall && !r.isComingSoonStub && !r.exemptTicket,
);
const exemptResolvers = resolvers.filter((r) => r.exemptTicket);
const comingSoon = resolvers.filter((r) => r.isComingSoonStub);
const wiredResolvers = resolvers.filter(
  (r) => r.hasApiCall,
);

// Check module definitions
let comingSoonRefCount = 0;
try {
  const modContent = readFileSync(MODULE_DEFS, 'utf-8');
  comingSoonRefCount = countComingSoonRefs(modContent);
} catch {
  // Module definitions file is optional
}

// ── Output ──────────────────────────────────────────────────────────────────

const violations = [];

for (const r of stubResolvers) {
  violations.push({
    id: r.id,
    file: rel(KPI_REGISTRY),
    line: r.line,
    issue:
      'Returns hardcoded data without calling createApiClient()',
  });
}

if (violations.length > 0) {
  console.error('❌ gate:kpi-stub-tracker FAILED\n');
  console.error(
    '   KPI resolvers returning hardcoded placeholder data detected.',
  );
  console.error(
    '   Wire each resolver to a real API endpoint using createApiClient(ctx),',
  );
  console.error(
    '   or add `// @gate-allow-stub: TICKET-123` above the resolver.\n',
  );

  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    KPI: '${v.id}'`);
    console.error(`    Issue: ${v.issue}`);
    console.error();
  }

  console.error('── Summary ──');
  console.error(
    `  ${violations.length} stub resolver(s) without exemption (FAIL)`,
  );
  console.error(
    `  ${exemptResolvers.length} explicitly exempted (tracked)`,
  );
  console.error(
    `  ${comingSoon.length} 'stub.comingSoon' (future-module placeholder)`,
  );
  console.error(
    `  ${wiredResolvers.length} wired to real API`,
  );
  console.error(
    `  ${resolvers.length} total resolvers`,
  );

  if (exemptResolvers.length > 0) {
    console.error('\n── Exempted Stubs (tracked) ──');
    for (const r of exemptResolvers) {
      console.error(
        `  '${r.id}' — ticket: ${r.exemptTicket}`,
      );
    }
  }

  if (comingSoonRefCount > 0) {
    console.error(
      `\n  ⚠ ${comingSoonRefCount} module(s) reference stub.comingSoon in module-definitions.server.ts`,
    );
  }

  process.exit(1);
} else {
  console.log('✅ gate:kpi-stub-tracker PASSED');
  console.log(
    `   ${resolvers.length} resolver(s) scanned — ${wiredResolvers.length} wired, ${exemptResolvers.length} exempted, ${comingSoon.length} coming-soon.`,
  );

  if (comingSoonRefCount > 0) {
    console.log(
      `   ⚠ ${comingSoonRefCount} module(s) still reference stub.comingSoon (future phases).`,
    );
  }
}
