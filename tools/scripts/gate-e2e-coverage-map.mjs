#!/usr/bin/env node
/**
 * gate:e2e-coverage-map — CI gate that cross-references route page.tsx files
 * against E2E Playwright specs to ensure every major route has at least one
 * end-to-end test.
 *
 * Rationale: New pages can ship without E2E coverage, meaning entire user
 * flows go unverified. This gate builds a coverage matrix and fails when
 * any top-level route group has zero E2E specs navigating to it.
 *
 * Checks:
 *   E2E-MAP-01: Every route group under (supplier-portal)/portal/* has E2E.
 *   E2E-MAP-02: Every route group under (shell)/finance/* has E2E.
 *   E2E-MAP-03: Pages with `// @e2e-exempt: <reason>` are skipped.
 *
 * Usage: node tools/scripts/gate-e2e-coverage-map.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const WEB_APP = join(ROOT, 'apps', 'web', 'src', 'app');
const E2E_TESTS = join(ROOT, 'apps', 'e2e', 'tests');

function findFiles(dir, pattern, results = []) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.next') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) findFiles(full, pattern, results);
      else if (pattern.test(entry)) results.push(full);
    }
  } catch {
    /* dir doesn't exist */
  }
  return results;
}

function rel(fp) {
  return relative(ROOT, fp).replace(/\\/g, '/');
}

// ── Collect top-level route groups ──────────────────────────────────────────
// We scan for page.tsx files and extract the route path from the directory
// structure, then group by the first segment after the route group name.

function extractRoutePath(pageFile) {
  const r = rel(pageFile);
  // e.g. apps/web/src/app/(supplier-portal)/portal/disputes/page.tsx
  //   → /portal/disputes
  // e.g. apps/web/src/app/(shell)/finance/journals/page.tsx
  //   → /finance/journals
  const match = r.match(/apps\/web\/src\/app\/\([^)]+\)\/(.+)\/page\.tsx$/);
  if (!match) return null;

  const routeSegments = match[1].replace(/\\/g, '/');
  return '/' + routeSegments;
}

function getRouteGroup(routePath) {
  // /portal/disputes → portal
  // /portal/disputes/new → portal
  // /finance/journals → finance
  // /finance/journals/[id] → finance
  const segments = routePath.split('/').filter(Boolean);
  return segments[0] || null;
}

function getTopLevelRoute(routePath) {
  // /portal/disputes/new → /portal/disputes
  // /finance/journals/[id] → /finance/journals
  const segments = routePath.split('/').filter(Boolean);
  if (segments.length >= 2) {
    return '/' + segments.slice(0, 2).join('/');
  }
  return routePath;
}

// ── Collect E2E test URL patterns ───────────────────────────────────────────

function extractTestUrls(specContent) {
  const urls = new Set();
  // Match page.goto('/...'), page.goto(`/...`)
  const re = /page\.goto\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let m;
  while ((m = re.exec(specContent))) {
    urls.add(m[1]);
  }
  // Match toHaveURL('/...') with string literals
  const re2 = /toHaveURL\(\s*['"`/]([^'"`]+)['"`]\s*\)/g;
  while ((m = re2.exec(specContent))) {
    let url = m[1];
    if (!url.startsWith('/')) url = '/' + url;
    urls.add(url);
  }
  // Match toHaveURL(/regex/) — extract route paths from regex patterns
  // e.g. toHaveURL(/\/finance\/journals$/) → /finance/journals
  const re3 = /toHaveURL\(\s*\/([^/]+(?:\/[^/]+)*)\//g;
  while ((m = re3.exec(specContent))) {
    // Extract the path from the regex, removing anchors and groups
    let rawPath = m[1];
    // Remove regex-specific chars: $, ^, (?...), etc.
    rawPath = rawPath
      .replace(/\\\//g, '/') // unescape forward slashes
      .replace(/\$$/g, '') // remove trailing anchor
      .replace(/^\^/g, '') // remove leading anchor
      .replace(/\(\?[^)]*\)/g, '') // remove non-capturing groups
      .replace(/\/+$/g, ''); // remove trailing slashes
    if (rawPath.startsWith('/')) {
      urls.add(rawPath);
    }
  }
  return urls;
}

// ── Route-prefix exemptions via config ───────────────────────────────────────
// apps/web/.e2e-exempt-routes — one route prefix + reason per line:
//   /(erp)/finance — E2E tests backlogged; scaffolded routes only
//   /portal — Supplier portal E2E backlogged

const EXEMPT_ROUTES_FILE = join(ROOT, 'apps', 'web', '.e2e-exempt-routes');
const prefixExemptions = [];

if (existsSync(EXEMPT_ROUTES_FILE)) {
  const lines = readFileSync(EXEMPT_ROUTES_FILE, 'utf-8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [prefix, ...rest] = line.split('—');
    const trimmedPrefix = prefix.trim();
    const reason = rest.join('—').trim() || 'exempt via .e2e-exempt-routes';
    if (trimmedPrefix.startsWith('/')) {
      prefixExemptions.push({ prefix: trimmedPrefix, reason });
    }
  }
}

function isRouteExemptByPrefix(routePath) {
  for (const { prefix, reason } of prefixExemptions) {
    if (routePath === prefix || routePath.startsWith(prefix + '/')) {
      return reason;
    }
  }
  return null;
}

// ── Main ────────────────────────────────────────────────────────────────────

// 1) Collect all page.tsx routes
const pageFiles = findFiles(WEB_APP, /^page\.tsx$/);
const routes = [];
const exemptions = [];

for (const pf of pageFiles) {
  const routePath = extractRoutePath(pf);
  if (!routePath) continue;

  // Check file-level @e2e-exempt comment
  const content = readFileSync(pf, 'utf-8');
  const exemptMatch = content.match(/@e2e-exempt:\s*(.+)/);
  if (exemptMatch) {
    exemptions.push({ route: routePath, reason: exemptMatch[1].trim() });
    continue;
  }

  // Check route-prefix exemption from config
  const prefixReason = isRouteExemptByPrefix(routePath);
  if (prefixReason) {
    exemptions.push({ route: routePath, reason: prefixReason });
    continue;
  }

  routes.push({
    path: routePath,
    file: rel(pf),
    group: getRouteGroup(routePath),
    topLevel: getTopLevelRoute(routePath),
  });
}

// 2) Collect all E2E spec URLs
const specFiles = findFiles(E2E_TESTS, /\.spec\.ts$/);
const testedUrls = new Set();
const specMap = new Map(); // url → spec file

for (const sf of specFiles) {
  const content = readFileSync(sf, 'utf-8');
  const urls = extractTestUrls(content);
  const r = rel(sf);
  for (const url of urls) {
    testedUrls.add(url);
    specMap.set(url, r);
  }
}

// 3) Build coverage matrix by top-level route
const topLevelRoutes = [...new Set(routes.map((r) => r.topLevel))].sort();
const coverage = [];

for (const tlr of topLevelRoutes) {
  // Check if any E2E spec navigates to this route or a sub-route
  const hasE2E = [...testedUrls].some((url) => url.startsWith(tlr));
  const matchingSpec = [...specMap.entries()].find(([url]) => url.startsWith(tlr));

  coverage.push({
    route: tlr,
    hasCoverage: hasE2E,
    specFile: matchingSpec ? matchingSpec[1] : null,
    group: getRouteGroup(tlr),
  });
}

const uncovered = coverage.filter((c) => !c.hasCoverage);
const covered = coverage.filter((c) => c.hasCoverage);

// ── Output ──────────────────────────────────────────────────────────────────

console.log('── E2E Coverage Matrix ──\n');

for (const c of coverage) {
  const icon = c.hasCoverage ? '✅' : '❌';
  const spec = c.specFile ? ` → ${c.specFile}` : ' → MISSING';
  console.log(`  ${icon} ${c.route.padEnd(35)} [${c.group}]${spec}`);
}

console.log();

if (exemptions.length > 0) {
  console.log('── Exemptions ──\n');
  for (const e of exemptions) {
    console.log(`  ⏭  ${e.route} — ${e.reason}`);
  }
  console.log();
}

if (uncovered.length > 0) {
  console.error('❌ gate:e2e-coverage-map FAILED\n');
  console.error(`  ${uncovered.length} top-level route(s) have no E2E test coverage:\n`);
  for (const u of uncovered) {
    console.error(`    ${u.route} [${u.group}]`);
  }
  console.error(`\n  Add Playwright specs under apps/e2e/tests/ that navigate to these routes.`);
  console.error(`  To exempt a page, add \`// @e2e-exempt: <reason>\` in its page.tsx.\n`);
  console.error(
    `── Summary: ${covered.length}/${coverage.length} routes covered, ${exemptions.length} exempted ──`
  );
  process.exit(1);
} else {
  console.log('✅ gate:e2e-coverage-map PASSED');
  console.log(`   ${covered.length}/${coverage.length} top-level routes have E2E coverage.`);
  if (exemptions.length > 0) {
    console.log(`   ${exemptions.length} route(s) explicitly exempted.`);
  }
}
