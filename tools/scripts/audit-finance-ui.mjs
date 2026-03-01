#!/usr/bin/env node
/**
 * pnpm audit:finance — Finance UI truth-map audit (FIN-UI-01 gate).
 *
 * Walks the finance route tree, feature directories, DB schema, and
 * module barrel to produce a comprehensive relationship map and detect:
 *
 *  - Stub reports (setTimeout / hardcoded data) — FORBIDDEN
 *  - Empty / hollow directories — FORBIDDEN
 *  - Inline pages > 80 LOC — FORBIDDEN (unless allow-listed)
 *  - Actions that exist with no form UI — WARN
 *  - DB tables with no UI coverage — WARN
 *  - API route registrars with no matching page — WARN
 *
 * Usage:
 *   node tools/scripts/audit-finance-ui.mjs             # human-readable
 *   node tools/scripts/audit-finance-ui.mjs --json       # JSON (evidence schema v1.0)
 *   node tools/scripts/audit-finance-ui.mjs --fail       # exit 1 on any FAIL
 *   pnpm audit:finance
 *
 * @module FIN-UI-01
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative, basename, dirname } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const JSON_MODE = process.argv.includes('--json');
const FAIL_MODE = process.argv.includes('--fail');
const VERSION = '1.0.0';

// ─── Paths ───────────────────────────────────────────────────────────────────

const FINANCE_ROUTES = join(ROOT, 'apps/web/src/app/(shell)/(erp)/finance');
const PORTAL_ROUTES = join(ROOT, 'apps/web/src/app/(supplier-portal)/portal');
const FINANCE_FEATURES = join(ROOT, 'apps/web/src/features/finance');
const ERP_COMPONENTS = join(ROOT, 'apps/web/src/components/erp');
const DB_SCHEMA = join(ROOT, 'packages/db/src/schema/erp.ts');
const MODULE_BARREL = join(ROOT, 'packages/modules/finance/src/public.ts');

// ─── Allow-lists ─────────────────────────────────────────────────────────────

/** Pages explicitly allowed to exceed 80 LOC (legacy, being refactored). */
const PAGE_LOC_ALLOWLIST = new Set([
  // Large pages with legitimate complexity (AP invoice detail, etc.)
  'payables/page.tsx',
  'payables/[id]/page.tsx',
  'payables/[id]/pay/page.tsx',
  'payables/payment-runs/page.tsx',
  'payables/payment-runs/[id]/page.tsx',
  'payables/payment-runs/[id]/items/page.tsx',
  'payables/payment-runs/[id]/rejection/page.tsx',
  'payables/payment-runs/[id]/remittance/page.tsx',
  'payables/payment-runs/new/page.tsx',
  'payables/suppliers/page.tsx',
  'payables/suppliers/[id]/page.tsx',
  'payables/suppliers/new/page.tsx',
  'payables/holds/page.tsx',
  'payables/reconciliation/page.tsx',
  'payables/import/page.tsx',
  'payables/close-checklist/page.tsx',
  'payables/debit-memos/new/page.tsx',
  'payables/credit-memos/new/page.tsx',
  'payables/new/page.tsx',
  'receivables/page.tsx',
  'receivables/[id]/page.tsx',
  'receivables/[id]/allocate/page.tsx',
  'receivables/new/page.tsx',
  'journals/page.tsx',
  'journals/[id]/page.tsx',
  'journals/new/page.tsx',
  'banking/page.tsx',
  'banking/import/page.tsx',
  'banking/reconcile/[id]/page.tsx',
  'fixed-assets/page.tsx',
  'fixed-assets/[id]/page.tsx',
  'fixed-assets/depreciation/page.tsx',
  'expenses/page.tsx',
  'expenses/new/page.tsx',
  'projects/page.tsx',
  'projects/[id]/page.tsx',
  'projects/[id]/billing/page.tsx',
  'accounts/page.tsx',
  'accounts/[id]/page.tsx',
  'accounts/new/page.tsx',
  'recurring/page.tsx',
  'recurring/[id]/page.tsx',
  'recurring/new/page.tsx',
  'intercompany/page.tsx',
  'intercompany/[id]/page.tsx',
  'intercompany/new/page.tsx',
  'ledgers/page.tsx',
  'ledgers/[id]/page.tsx',
  'ledgers/new/page.tsx',
  'approvals/page.tsx',
  'page.tsx', // finance dashboard
  // Reports with inherent complexity (inline ReportSectionTable)
  'reports/page.tsx',
  'reports/balance-sheet/page.tsx',
  'reports/income-statement/page.tsx',
  'reports/cash-flow/page.tsx',
  'reports/budget-variance/page.tsx',
  'reports/ic-aging/page.tsx',
  'reports/wht/page.tsx',
  'reports/trial-balance/page.tsx',
  // Domain list pages with inline tables (to be extracted in Phase 3)
  'tax/page.tsx',
  'periods/page.tsx',
  'cost-centers/page.tsx',
  'credit/page.tsx',
  'fx-rates/page.tsx',
  'intangibles/page.tsx',
  'leases/page.tsx',
  'treasury/page.tsx',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fileContains(filePath, pattern) {
  const abs = filePath.startsWith('/') || filePath.includes(':\\') ? filePath : join(ROOT, filePath);
  if (!existsSync(abs)) return false;
  try {
    return readFileSync(abs, 'utf-8').includes(pattern);
  } catch {
    return false;
  }
}

function fileContainsRegex(filePath, regex) {
  const abs = filePath.startsWith('/') || filePath.includes(':\\') ? filePath : join(ROOT, filePath);
  if (!existsSync(abs)) return false;
  try {
    return regex.test(readFileSync(abs, 'utf-8'));
  } catch {
    return false;
  }
}

function countLines(filePath) {
  try {
    return readFileSync(filePath, 'utf-8').split('\n').length;
  } catch {
    return 0;
  }
}

function isDirEmpty(dirPath) {
  if (!existsSync(dirPath)) return true;
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    // Filter out .gitkeep
    const real = entries.filter((e) => e.name !== '.gitkeep');
    if (real.length === 0) return true;
    // Check if all child dirs are also empty
    return real.every(
      (e) => e.isDirectory() && isDirEmpty(join(dirPath, e.name))
    );
  } catch {
    return true;
  }
}

function walkFiles(dirPath, filter = () => true) {
  const results = [];
  if (!existsSync(dirPath)) return results;
  try {
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      const full = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkFiles(full, filter));
      } else if (entry.isFile() && filter(entry.name, full)) {
        results.push(full);
      }
    }
  } catch { /* ignore */ }
  return results;
}

function getSubDirs(dirPath) {
  if (!existsSync(dirPath)) return [];
  try {
    return readdirSync(dirPath, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
}

function rel(absPath) {
  return relative(ROOT, absPath).replace(/\\/g, '/');
}

// ─── Check builders ─────────────────────────────────────────────────────────

const checks = [];

function pass(id, description, evidence = []) {
  checks.push({ id, description, status: 'PASS', confidence: 100, evidence });
}

function fail(id, description, evidence = []) {
  checks.push({ id, description, status: 'FAIL', confidence: 100, evidence });
}

function warn(id, description, evidence = []) {
  checks.push({ id, description, status: 'WARN', confidence: 100, evidence });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK GROUP 1: Stub Reports (FORBIDDEN)
// ═══════════════════════════════════════════════════════════════════════════════

const reportsDir = join(FINANCE_ROUTES, 'reports');
const reportSubDirs = getSubDirs(reportsDir);
let stubReportCount = 0;

for (const reportName of reportSubDirs) {
  const pagePath = join(reportsDir, reportName, 'page.tsx');
  if (!existsSync(pagePath)) continue;

  const isStub =
    fileContains(pagePath, 'setTimeout') ||
    fileContainsRegex(pagePath, /await\s+new\s+Promise\(\s*\(?\s*r(?:esolve)?\s*\)?\s*=>\s*setTimeout/) ||
    (fileContainsRegex(pagePath, /(?:const|let)\s+\w+\s*(?::\s*\w[\w<>,\s|[\]]*\s*)?=\s*\[/) &&
      !fileContains(pagePath, 'createApiClient') &&
      !fileContains(pagePath, 'getRequestContext') &&
      !fileContains(pagePath, 'queries'));

  if (isStub) {
    stubReportCount++;
    fail(
      `FIN-RPT-${String(stubReportCount).padStart(2, '0')}`,
      `Stub report: reports/${reportName} uses mock data`,
      [rel(pagePath), 'Contains setTimeout or hardcoded arrays without API query']
    );
  } else {
    pass(
      `FIN-RPT-${String(reportSubDirs.indexOf(reportName) + 1).padStart(2, '0')}`,
      `Report reports/${reportName} uses real queries`,
      [rel(pagePath)]
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK GROUP 2: Empty / Hollow Directories (FORBIDDEN)
// ═══════════════════════════════════════════════════════════════════════════════

const featureSubDomains = getSubDirs(FINANCE_FEATURES);
let hollowCount = 0;

for (const domain of featureSubDomains) {
  const domainPath = join(FINANCE_FEATURES, domain);
  if (isDirEmpty(domainPath)) {
    hollowCount++;
    fail(
      `FIN-HOLLOW-${String(hollowCount).padStart(2, '0')}`,
      `Hollow feature directory: features/finance/${domain}/`,
      [rel(domainPath), 'All subdirectories are empty']
    );
  }
}

// Check for empty blocks/ or actions/ dirs within feature domains
let emptySubCount = 0;
for (const domain of featureSubDomains) {
  for (const subDir of ['blocks', 'actions', 'forms']) {
    const subPath = join(FINANCE_FEATURES, domain, subDir);
    if (existsSync(subPath) && isDirEmpty(subPath)) {
      emptySubCount++;
      fail(
        `FIN-EMPTY-${String(emptySubCount).padStart(2, '0')}`,
        `Empty ${subDir}/ in features/finance/${domain}/`,
        [rel(subPath), `Directory exists but contains no files`]
      );
    }
  }
}

// Check for empty route scaffolds
const routeSubDirs = walkFiles(FINANCE_ROUTES, (name) => name === 'page.tsx');
let emptyRouteCount = 0;
for (const pagePath of routeSubDirs) {
  const dir = dirname(pagePath);
  const dirEntries = readdirSync(dir).filter((f) => f !== '.gitkeep');
  if (dirEntries.length === 0) {
    emptyRouteCount++;
    fail(
      `FIN-ROUTE-EMPTY-${String(emptyRouteCount).padStart(2, '0')}`,
      `Empty route scaffold: ${rel(dir)}`,
      [rel(dir)]
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK GROUP 3: Inline Pages > 80 LOC (FORBIDDEN unless allow-listed)
// ═══════════════════════════════════════════════════════════════════════════════

const allPages = walkFiles(FINANCE_ROUTES, (name) => name === 'page.tsx');
let inlineCount = 0;

for (const pagePath of allPages) {
  const loc = countLines(pagePath);
  if (loc <= 80) continue;

  // Compute the relative key for allow-list
  const relPath = relative(FINANCE_ROUTES, pagePath).replace(/\\/g, '/');
  if (PAGE_LOC_ALLOWLIST.has(relPath)) continue;

  inlineCount++;
  const sev = loc > 150 ? fail : warn;
  sev(
    `FIN-INLINE-${String(inlineCount).padStart(2, '0')}`,
    `Inline page > 80 LOC: ${relPath} (${loc} lines)`,
    [rel(pagePath), `${loc} lines — extract to blocks/`]
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK GROUP 4: Feature Completeness Score
// ═══════════════════════════════════════════════════════════════════════════════

const completenessResults = {};

for (const domain of featureSubDomains) {
  const domainPath = join(FINANCE_FEATURES, domain);
  const hasQueries = !isDirEmpty(join(domainPath, 'queries'));
  const hasActions = !isDirEmpty(join(domainPath, 'actions'));
  const hasBlocks = !isDirEmpty(join(domainPath, 'blocks'));
  const hasForms = !isDirEmpty(join(domainPath, 'forms'));

  // Check for matching route
  const hasRoute = existsSync(join(FINANCE_ROUTES, domain, 'page.tsx'));
  const hasDetailRoute =
    walkFiles(join(FINANCE_ROUTES, domain), (n) => n === 'page.tsx').length > 1;
  const hasNewRoute = existsSync(join(FINANCE_ROUTES, domain, 'new', 'page.tsx'));

  let score;
  if (hasQueries && hasActions && hasBlocks && (hasForms || hasDetailRoute)) {
    score = 'complete';
  } else if (hasQueries && (hasBlocks || hasActions)) {
    score = 'read_only';
  } else if (isDirEmpty(domainPath)) {
    score = 'stub';
  } else {
    score = 'partial';
  }

  completenessResults[domain] = {
    score,
    hasQueries,
    hasActions,
    hasBlocks,
    hasForms,
    hasRoute,
    hasDetailRoute,
    hasNewRoute,
  };

  const evidence = [
    `queries: ${hasQueries}`,
    `actions: ${hasActions}`,
    `blocks: ${hasBlocks}`,
    `forms: ${hasForms}`,
    `route: ${hasRoute}`,
    `detail: ${hasDetailRoute}`,
    `new: ${hasNewRoute}`,
  ];

  if (score === 'stub') {
    fail(`FIN-SCORE-${domain}`, `Feature "${domain}" is a stub`, evidence);
  } else if (score === 'partial') {
    warn(`FIN-SCORE-${domain}`, `Feature "${domain}" is partial (${evidence.filter((e) => e.endsWith('true')).length}/7)`, evidence);
  } else {
    pass(`FIN-SCORE-${domain}`, `Feature "${domain}" is ${score}`, evidence);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK GROUP 5: DB Table Coverage (ADVISORY)
// ═══════════════════════════════════════════════════════════════════════════════

if (existsSync(DB_SCHEMA)) {
  const schemaContent = readFileSync(DB_SCHEMA, 'utf-8');
  const tableRegex = /export\s+const\s+(\w+)\s*=\s*erpSchema\.table\(/g;
  const tables = [];
  let match;
  while ((match = tableRegex.exec(schemaContent)) !== null) {
    tables.push(match[1]);
  }

  // Known mappings: table variable name → feature domain that consumes it via API
  // Tables accessed through createApiClient don't have their Drizzle names in
  // frontend code, so we maintain an explicit mapping here.
  const knownTableMappings = {
    // periods / fiscal
    fiscalYears: 'periods',
    fiscalPeriods: 'periods',
    // journals / GL
    glJournals: 'journals',
    glJournalLines: 'journals',
    glBalances: 'journals',
    // intercompany
    counterparties: 'intercompany',
    icAgreements: 'intercompany',
    icTransactionLegs: 'intercompany',
    icSettlements: 'intercompany',
    icSettlementLines: 'intercompany',
    // recurring
    recurringTemplates: 'recurring',
    // budgets
    budgetEntries: 'budgets',
    // revenue-recognition
    revenueContracts: 'revenue-recognition',
    recognitionMilestones: 'revenue-recognition',
    // settings
    classificationRuleSets: 'settings',
    classificationRules: 'settings',
    matchTolerances: 'settings',
    paymentTermsTemplates: 'settings',
    paymentTermsLines: 'settings',
    mappingRules: 'settings',
    mappingRuleVersions: 'settings',
    accountingEvents: 'accounts',
    // payables (AP, suppliers)
    apInvoices: 'payables',
    apInvoiceLines: 'payables',
    apHolds: 'payables',
    apPaymentRuns: 'payables',
    apPaymentRunItems: 'payables',
    apPrepayments: 'payables',
    apPrepaymentApplications: 'payables',
    supplierSites: 'payables',
    supplierBankAccounts: 'payables',
    supplierUsers: 'payables',
    supplierDocuments: 'payables',
    supplierDisputes: 'payables',
    supplierNotificationPrefs: 'payables',
    supplierComplianceItems: 'payables',
    supplierAccountGroupConfigs: 'payables',
    supplierCompanyOverrides: 'payables',
    supplierBlocks: 'payables',
    supplierBlockHistory: 'payables',
    supplierBlacklists: 'payables',
    supplierTaxRegistrations: 'payables',
    supplierLegalDocuments: 'payables',
    supplierDocRequirements: 'payables',
    supplierEvalTemplates: 'payables',
    supplierEvalCriteria: 'payables',
    supplierEvaluations: 'payables',
    supplierEvalScores: 'payables',
    supplierRiskIndicators: 'payables',
    supplierDiversities: 'payables',
    supplierContacts: 'payables',
    supplierDuplicateSuspects: 'payables',
    ocrJobs: 'payables',
    // receivables (AR, dunning)
    arInvoices: 'receivables',
    arInvoiceLines: 'receivables',
    arPaymentAllocations: 'receivables',
    arAllocationItems: 'receivables',
    dunningRuns: 'receivables',
    dunningLetters: 'receivables',
    // tax
    taxRates: 'tax',
    taxReturnPeriods: 'tax',
    whtCertificates: 'tax',
    // fixed-assets
    depreciationSchedules: 'fixed-assets',
    assetMovements: 'fixed-assets',
    assetComponents: 'fixed-assets',
    // banking
    bankStatementLines: 'banking',
    bankMatches: 'banking',
    bankReconciliations: 'banking',
    // expenses
    expenseClaims: 'expenses',
    expenseClaimLines: 'expenses',
    expensePolicies: 'expenses',
    // projects
    projectCostLines: 'projects',
    projectBillings: 'projects',
    // leases
    leaseContracts: 'leases',
    leaseSchedules: 'leases',
    // provisions
    provisionMovements: 'provisions',
    // cost-accounting
    costDriverValues: 'cost-accounting',
    costAllocationRuns: 'cost-accounting',
    costAllocationLines: 'cost-accounting',
    // consolidation
    groupEntities: 'consolidation',
    ownershipRecords: 'consolidation',
    // intangibles
    intangibleAssets: 'intangibles',
    // instruments
    financialInstruments: 'instruments',
    fairValueMeasurements: 'instruments',
    // hedging
    hedgeRelationships: 'hedging',
    hedgeEffectivenessTests: 'hedging',
    // deferred-tax
    deferredTaxItems: 'deferred-tax',
    // transfer-pricing
    tpPolicies: 'transfer-pricing',
    tpBenchmarks: 'transfer-pricing',
    // treasury
    cashForecasts: 'treasury',
  };

  // Check which tables have at least one reference in features/
  const featureFiles = walkFiles(FINANCE_FEATURES, (name) =>
    /\.(ts|tsx)$/.test(name)
  );
  const featureContent = featureFiles
    .map((f) => {
      try { return readFileSync(f, 'utf-8'); } catch { return ''; }
    })
    .join('\n');

  let uncoveredCount = 0;
  for (const table of tables) {
    // Table is covered if referenced in feature code OR explicitly mapped
    if (!featureContent.includes(table) && !knownTableMappings[table]) {
      uncoveredCount++;
      if (uncoveredCount <= 20) {
        // Cap advisory warnings
        warn(
          `FIN-DB-${String(uncoveredCount).padStart(2, '0')}`,
          `DB table "${table}" has no frontend feature reference`,
          [rel(DB_SCHEMA)]
        );
      }
    }
  }
  if (uncoveredCount > 0) {
    warn('FIN-DB-SUMMARY', `${uncoveredCount} DB tables with no frontend feature reference`, [
      `${tables.length} total tables, ${tables.length - uncoveredCount} referenced`,
    ]);
  } else {
    pass('FIN-DB-COVERAGE', `All ${tables.length} DB tables mapped to frontend features`, [
      `${Object.keys(knownTableMappings).length} via knownTableMappings, rest via code reference`,
    ]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK GROUP 6: Route Registrar ↔ Page Cross-Reference (ADVISORY)
// ═══════════════════════════════════════════════════════════════════════════════

if (existsSync(MODULE_BARREL)) {
  const barrelContent = readFileSync(MODULE_BARREL, 'utf-8');
  const registrarRegex = /export\s+.*?(register\w+Routes)/g;
  const registrars = [];
  let m;
  while ((m = registrarRegex.exec(barrelContent)) !== null) {
    registrars.push(m[1]);
  }

  // Also try re-export pattern: export { registerXxxRoutes } from ...
  const reExportRegex = /register(\w+)Routes/g;
  const allRegistrarNames = new Set();
  let rm;
  while ((rm = reExportRegex.exec(barrelContent)) !== null) {
    allRegistrarNames.add(rm[0]);
  }

  // Simple heuristic: convert registerFooBarRoutes → search for /finance/foo-bar/ route
  const routeDirNames = new Set(getSubDirs(FINANCE_ROUTES));
  // Also check portal routes
  const portalDirNames = new Set(getSubDirs(PORTAL_ROUTES));

  let unmatchedCount = 0;
  for (const registrar of allRegistrarNames) {
    // Convert "registerApInvoiceRoutes" → "ap-invoice" → check various route segments
    const stripped = registrar.replace(/^register/, '').replace(/Routes$/, '');
    const kebab = stripped
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();

    // Check common route mappings
    const segments = [
      kebab,
      kebab.replace(/^ap-/, ''),
      kebab.replace(/^ar-/, ''),
      kebab.replace(/-report(ing)?$/, ''),
    ];

    const found = segments.some(
      (s) => routeDirNames.has(s) || portalDirNames.has(s)
    );

    // Also check if the registrar maps to a known route
    const knownMappings = {
      registerApInvoiceRoutes: 'payables',
      registerApPaymentRunRoutes: 'payables',
      registerApAgingRoutes: 'reports',
      registerApHoldRoutes: 'payables',
      registerApSupplierReconRoutes: 'payables',
      registerApReportingRoutes: 'reports',
      registerSupplierRoutes: 'payables',
      registerSupplierMdmRoutes: 'payables',
      registerSupplierPortalRoutes: 'payables',
      registerArInvoiceRoutes: 'receivables',
      registerArPaymentRoutes: 'receivables',
      registerArAgingRoutes: 'reports',
      registerArDunningRoutes: 'receivables',
      registerTaxCodeRoutes: 'tax',
      registerTaxRateRoutes: 'tax',
      registerTaxReturnRoutes: 'tax',
      registerWhtCertificateRoutes: 'tax',
      registerAssetRoutes: 'fixed-assets',
      registerBankRoutes: 'banking',
      registerFinInstrumentRoutes: 'instruments',
      registerApCaptureRoutes: 'payables',
      registerExpenseRoutes: 'expenses',
      registerProjectRoutes: 'projects',
      registerLeaseRoutes: 'leases',
      registerProvisionRoutes: 'provisions',
      registerHedgeRoutes: 'hedging',
      registerIntangibleRoutes: 'intangibles',
      registerApprovalRoutes: 'approvals',
    };

    const knownMatch = knownMappings[registrar];
    const hasMatch = found || (knownMatch && routeDirNames.has(knownMatch));

    if (!hasMatch) {
      unmatchedCount++;
      warn(
        `FIN-API-${String(unmatchedCount).padStart(2, '0')}`,
        `API route "${registrar}" has no matching frontend page`,
        [rel(MODULE_BARREL)]
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK GROUP 7: Actions Without Form UI (ADVISORY)
// ═══════════════════════════════════════════════════════════════════════════════

for (const domain of featureSubDomains) {
  const actionsDir = join(FINANCE_FEATURES, domain, 'actions');
  if (!existsSync(actionsDir) || isDirEmpty(actionsDir)) continue;

  const actionFiles = walkFiles(actionsDir, (name) => /\.ts$/.test(name));
  const hasCreateAction = actionFiles.some((f) =>
    fileContainsRegex(f, /(?:create|add|new|upsert)\w*Action/i)
  );
  const hasUpdateAction = actionFiles.some((f) =>
    fileContainsRegex(f, /(?:update|edit)\w*Action/i)
  );

  const formsDir = join(FINANCE_FEATURES, domain, 'forms');
  const hasForms = existsSync(formsDir) && !isDirEmpty(formsDir);
  const hasNewRoute = existsSync(join(FINANCE_ROUTES, domain, 'new', 'page.tsx'));

  if ((hasCreateAction || hasUpdateAction) && !hasForms && !hasNewRoute) {
    warn(
      `FIN-FORM-${domain}`,
      `Feature "${domain}" has create/update actions but no form UI`,
      [
        `create action: ${hasCreateAction}`,
        `update action: ${hasUpdateAction}`,
        `forms dir: ${hasForms}`,
        `new route: ${hasNewRoute}`,
      ]
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK GROUP 8: API Path Validation (FORBIDDEN — frontend/backend path mismatch)
// ═══════════════════════════════════════════════════════════════════════════════

/** Known wrong paths that frontend must NOT use. Key = wrong path, value = correct backend path. */
const KNOWN_API_PATH_MISMATCHES = {
  '/ap/close-checklist': '/ap/period-close-checklist',
};

const payablesQueryFiles = walkFiles(join(FINANCE_FEATURES, 'payables'), (name) =>
  /\.(ts|tsx)$/.test(name)
);

let apiPathMismatchCount = 0;
for (const filePath of payablesQueryFiles) {
  const content = readFileSync(filePath, 'utf-8');
  for (const [wrongPath, correctPath] of Object.entries(KNOWN_API_PATH_MISMATCHES)) {
    if (content.includes(wrongPath)) {
      apiPathMismatchCount++;
      fail(
        `FIN-API-PATH-${String(apiPathMismatchCount).padStart(2, '0')}`,
        `API path mismatch: frontend uses "${wrongPath}" but backend expects "${correctPath}"`,
        [rel(filePath), `Replace "${wrongPath}" with "${correctPath}"`]
      );
    }
  }
}

if (apiPathMismatchCount === 0) {
  pass('FIN-API-PATH', 'All AP query paths match backend routes', [
    'Checked payables queries/actions against known mismatches',
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Output
// ═══════════════════════════════════════════════════════════════════════════════

const summary = {
  pass: checks.filter((c) => c.status === 'PASS').length,
  fail: checks.filter((c) => c.status === 'FAIL').length,
  warn: checks.filter((c) => c.status === 'WARN').length,
  total: checks.length,
};

if (JSON_MODE) {
  const report = {
    toolId: 'FIN-UI',
    schemaVersion: '1.0',
    version: VERSION,
    timestamp: new Date().toISOString(),
    summary,
    completeness: completenessResults,
    checks,
  };
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`\n  FIN-UI Audit v${VERSION}\n`);
  console.log(`  ${'ID'.padEnd(20)} ${'Description'.padEnd(58)} Status`);
  console.log('  ' + '\u2500'.repeat(90));

  for (const c of checks) {
    const icon =
      c.status === 'PASS' ? '\u2705' : c.status === 'WARN' ? '\u26A0\uFE0F ' : '\u274C';
    console.log(`  ${c.id.padEnd(20)} ${c.description.slice(0, 58).padEnd(58)} ${icon} ${c.status}`);
  }

  console.log('\n  ' + '\u2500'.repeat(90));
  console.log(
    `  Total: ${summary.pass}/${summary.total} pass, ${summary.fail} fail, ${summary.warn} warn`
  );

  if (summary.fail > 0) {
    console.log(`\n  \u274C ${summary.fail} FORBIDDEN state(s) detected.`);
    if (FAIL_MODE) {
      console.log('  Exiting with code 1 (--fail mode).\n');
    }
  }
  console.log();
}

if (FAIL_MODE && summary.fail > 0) {
  process.exit(1);
}
