#!/usr/bin/env node
/**
 * pnpm audit:ais — AIS benchmark audit with evidence levels.
 *
 * Checks all 41 AIS items from ais.finance.md against the codebase.
 * Each item is scored with an evidence level (L1-L5).
 *
 * Usage:
 *   node tools/scripts/audit-ais.mjs           # human-readable output
 *   node tools/scripts/audit-ais.mjs --json    # JSON output (evidence schema v1.0)
 *   pnpm audit:ais
 *   pnpm audit:ais -- --json
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const FIN = 'packages/modules/finance/src';
const FINANCE = join(ROOT, FIN);
const DB_DRIZZLE = join(ROOT, 'packages/db/drizzle');
const TESTS = join(FINANCE, '__tests__');
const JSON_MODE = process.argv.includes('--json');
const VERSION = '2.1.0';

// ─── Slice-based path resolution ────────────────────────────────────────────
// The finance module uses slices/ + shared/ instead of domain/ + app/ + infra/.
// This map lets every check() resolve the OLD path to the ACTUAL path.
const PATH_MAP = {
  // entities
  'domain/entities/journal.ts': 'slices/gl/entities/journal.ts',
  'domain/entities/account.ts': 'slices/gl/entities/account.ts',
  'domain/entities/ledger.ts': 'slices/gl/entities/ledger.ts',
  'domain/entities/fiscal-period.ts': 'slices/gl/entities/fiscal-period.ts',
  'domain/entities/gl-balance.ts': 'slices/gl/entities/gl-balance.ts',
  'domain/entities/fx-rate.ts': 'slices/fx/entities/fx-rate.ts',
  'domain/entities/intercompany.ts': 'slices/ic/entities/intercompany.ts',
  // calculators
  'domain/calculators/journal-balance.ts': 'slices/gl/calculators/journal-balance.ts',
  'domain/calculators/trial-balance.ts': 'slices/gl/calculators/trial-balance.ts',
  'domain/calculators/coa-hierarchy.ts': 'slices/gl/calculators/coa-hierarchy.ts',
  'domain/calculators/report-classifier.ts': 'slices/reporting/calculators/report-classifier.ts',
  'domain/calculators/fx-convert.ts': 'slices/fx/calculators/fx-convert.ts',
  'domain/calculators/fx-triangulation.ts': 'slices/fx/calculators/fx-triangulation.ts',
  'domain/calculators/fx-translation.ts': 'slices/fx/calculators/fx-translation.ts',
  'domain/calculators/ic-elimination.ts': 'slices/ic/calculators/ic-elimination.ts',
  'domain/calculators/derivation-engine.ts': 'slices/hub/calculators/derivation-engine.ts',
  'domain/calculators/cash-flow-indirect.ts': 'slices/reporting/calculators/cash-flow-indirect.ts',
  'domain/calculators/comparative-report.ts': 'slices/reporting/calculators/comparative-report.ts',
  'domain/calculators/comparative-reports.ts': 'slices/reporting/calculators/comparative-report.ts',
  // events
  'domain/events.ts': 'shared/events.ts',
  'domain/index.ts': 'shared/events.ts',
  // services
  'app/services/post-journal.ts': 'slices/gl/services/post-journal.ts',
  'app/services/create-journal.ts': 'slices/gl/services/create-journal.ts',
  'app/services/reverse-journal.ts': 'slices/gl/services/reverse-journal.ts',
  'app/services/void-journal.ts': 'slices/gl/services/void-journal.ts',
  'app/services/close-period.ts': 'slices/gl/services/close-period.ts',
  'app/services/lock-period.ts': 'slices/gl/services/lock-period.ts',
  'app/services/reopen-period.ts': 'slices/gl/services/reopen-period.ts',
  'app/services/get-balance-sheet.ts': 'slices/reporting/services/get-balance-sheet.ts',
  'app/services/get-income-statement.ts': 'slices/reporting/services/get-income-statement.ts',
  'app/services/get-cash-flow.ts': 'slices/reporting/services/get-cash-flow.ts',
  'app/services/get-budget-variance.ts': 'slices/hub/services/get-budget-variance.ts',
  'app/services/recognize-revenue.ts': 'slices/hub/services/recognize-revenue.ts',
  'app/services/process-recurring-journals.ts': 'slices/gl/services/process-recurring-journals.ts',
  'app/services/create-ic-transaction.ts': 'slices/ic/services/create-ic-transaction.ts',
  // ports
  'app/ports/journal-repo.ts': 'slices/gl/ports/journal-repo.ts',
  'app/ports/account-repo.ts': 'slices/gl/ports/account-repo.ts',
  'app/ports/ledger-repo.ts': 'slices/gl/ports/ledger-repo.ts',
  'app/ports/fiscal-period-repo.ts': 'slices/gl/ports/fiscal-period-repo.ts',
  'app/ports/balance-repo.ts': 'slices/gl/ports/balance-repo.ts',
  'app/ports/journal-audit-repo.ts': 'slices/gl/ports/journal-audit-repo.ts',
  'app/ports/period-audit-repo.ts': 'slices/gl/ports/period-audit-repo.ts',
  'app/ports/fx-rate-repo.ts': 'slices/fx/ports/fx-rate-repo.ts',
  'app/ports/ic-repo.ts': 'slices/ic/ports/ic-repo.ts',
  'app/ports/ic-settlement-repo.ts': 'slices/ic/ports/ic-settlement-repo.ts',
  'app/ports/budget-repo.ts': 'slices/hub/ports/budget-repo.ts',
  'app/ports/classification-rule-repo.ts': 'slices/hub/ports/classification-rule-repo.ts',
  'app/ports/revenue-contract-repo.ts': 'slices/hub/ports/revenue-contract-repo.ts',
  'app/ports/recurring-template-repo.ts': 'slices/hub/ports/recurring-template-repo.ts',
  'app/ports/idempotency-store.ts': 'shared/ports/idempotency-store.ts',
  'app/ports/outbox-writer.ts': 'shared/ports/outbox-writer.ts',
  'app/ports/authorization.ts': 'shared/ports/authorization.ts',
  // infra / routes
  'infra/routes/report-routes.ts': 'slices/reporting/routes/report-routes.ts',
  'infra/routes/tenant-guard.ts': 'shared/routes/tenant-guard.ts',
  'infra/authorization/default-authorization-policy.ts':
    'shared/authorization/default-authorization-policy.ts',
  'infra/routes/authorization-guard.ts': 'shared/routes/authorization-guard.ts',
  'infra/routes/rate-limit-guard.ts': 'shared/routes/rate-limit-guard.ts',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fileContains(filePath, pattern) {
  const abs =
    filePath.startsWith('/') || filePath.includes(':\\') ? filePath : join(ROOT, filePath);
  if (!existsSync(abs)) return false;
  try {
    return readFileSync(abs, 'utf-8').includes(pattern);
  } catch {
    return false;
  }
}

function dirContains(dirPath, pattern) {
  const abs = dirPath.startsWith('/') || dirPath.includes(':\\') ? dirPath : join(ROOT, dirPath);
  if (!existsSync(abs)) return false;
  try {
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const full = join(abs, entry.name);
      if (entry.isDirectory()) {
        if (dirContains(full, pattern)) return true;
      } else if (entry.isFile() && /\.(ts|sql)$/.test(entry.name)) {
        if (fileContains(full, pattern)) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/** Resolve a finance-relative path — tries original, then slice-mapped alternative */
function resolveFin(relPath) {
  // relPath is relative to FIN, e.g. 'domain/entities/journal.ts'
  const original = join(FINANCE, relPath);
  if (existsSync(original)) return original;
  const mapped = PATH_MAP[relPath];
  if (mapped) {
    const alt = join(FINANCE, mapped);
    if (existsSync(alt)) return alt;
  }
  return original; // return original even if missing (callers check existence)
}

function fe(p) {
  // If it starts with FIN prefix, use resolveFin
  if (p.startsWith(FIN + '/')) {
    const rel = p.slice(FIN.length + 1);
    return existsSync(resolveFin(rel));
  }
  return existsSync(join(ROOT, p));
}
function fc(p, pat) {
  if (p.startsWith(FIN + '/')) {
    const rel = p.slice(FIN.length + 1);
    return fileContains(resolveFin(rel), pat);
  }
  return fileContains(join(ROOT, p), pat);
}
function te(name) {
  // Search in top-level __tests__ first, then recursively in all __tests__ dirs
  if (existsSync(join(TESTS, name))) return true;
  return findTestFile(FINANCE, name);
}

/** Recursively find a test file by name in any __tests__ directory */
function findTestFile(dir, name) {
  if (!existsSync(dir)) return false;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        if (entry.name === '__tests__') {
          if (existsSync(join(dir, entry.name, name))) return true;
        }
        if (findTestFile(join(dir, entry.name), name)) return true;
      }
    }
  } catch {
    /* ignore */
  }
  return false;
}

// ─── Evidence Level Helpers ──────────────────────────────────────────────────
// L1: Structure (files/exports present)
// L2: Static semantics (types/unions/ports present)
// L3: Test evidence (unit/integration test exists)
// L4: DB invariant (constraint/trigger + integration test)
// L5: Runtime evidence (worker/outbox flow, migration history)

function computeLevel(evidence) {
  let level = 'L1';
  if (evidence.hasPort || evidence.hasType) level = 'L2';
  if (evidence.hasTest) level = 'L3';
  if (evidence.hasDbConstraint) level = 'L4';
  if (evidence.hasRuntime) level = 'L5';
  return level;
}

// ─── 41 AIS Items ────────────────────────────────────────────────────────────

const checks = [
  // ── A) Foundation Controls (INF-01 to INF-07) ──────────────────────────────
  {
    id: 'INF-01',
    desc: 'Tenant isolation',
    check() {
      const hasRls = dirContains(DB_DRIZZLE, 'ENABLE ROW LEVEL SECURITY');
      const hasTest = te('cross-tenant-isolation.test.ts');
      const hasSpoofTest = dirContains(join(ROOT, 'apps/api/src/__tests__'), 'spoof');
      const evidence = [];
      if (hasRls) evidence.push('drizzle migrations: RLS policies');
      if (hasTest) evidence.push('cross-tenant-isolation.test.ts');
      if (hasSpoofTest) evidence.push('api e2e: tenant spoofing tests');
      return {
        pass: hasRls,
        confidence: hasTest && hasSpoofTest ? 95 : hasRls ? 70 : 0,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest: hasTest || hasSpoofTest,
        hasDbConstraint: hasRls,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'INF-02',
    desc: 'Company boundary',
    check() {
      const hasEntity = fc(`${FIN}/domain/entities/journal.ts`, 'companyId');
      const hasPort = fe(`${FIN}/app/ports/ledger-repo.ts`);
      const evidence = [];
      if (hasEntity) evidence.push('journal.ts: companyId field');
      if (hasPort) evidence.push('ledger-repo.ts: company-scoped ledger');
      return {
        pass: hasEntity,
        confidence: hasEntity && hasPort ? 80 : 50,
        evidence,
        hasPort,
        hasType: hasEntity,
        hasTest: false,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'INF-03',
    desc: 'Ledger boundary',
    check() {
      const hasEntity = fc(`${FIN}/domain/entities/journal.ts`, 'ledgerId');
      const hasPort = fe(`${FIN}/app/ports/ledger-repo.ts`);
      const evidence = [];
      if (hasEntity) evidence.push('journal.ts: ledgerId field');
      if (hasPort) evidence.push('ledger-repo.ts port');
      return {
        pass: hasEntity && hasPort,
        confidence: 80,
        evidence,
        hasPort,
        hasType: hasEntity,
        hasTest: false,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'INF-04',
    desc: 'Fiscal period governance',
    check() {
      const hasGate = fc(`${FIN}/app/services/post-journal.ts`, 'period');
      const hasPort = fe(`${FIN}/app/ports/fiscal-period-repo.ts`);
      const hasTest = te('close-period.test.ts') || te('lock-period.test.ts');
      const evidence = [];
      if (hasGate) evidence.push('post-journal.ts: period validation');
      if (hasPort) evidence.push('fiscal-period-repo.ts port');
      if (hasTest) evidence.push('close-period/lock-period tests');
      return {
        pass: hasGate && hasPort,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'INF-05',
    desc: 'Idempotency & exactly-once',
    check() {
      const hasPort = fe(`${FIN}/app/ports/idempotency-store.ts`);
      const hasService = fc(`${FIN}/app/services/post-journal.ts`, 'idempotencyKey');
      const hasTest = te('idempotency.test.ts');
      const hasPropTest = te('invariants-db.property.test.ts');
      const hasDb = dirContains(DB_DRIZZLE, 'idempotency');
      const evidence = [];
      if (hasPort) evidence.push('idempotency-store.ts port');
      if (hasService) evidence.push('post-journal.ts: idempotencyKey');
      if (hasTest) evidence.push('idempotency.test.ts');
      if (hasPropTest) evidence.push('invariants-db.property.test.ts: INF-01 stable replay');
      if (hasDb) evidence.push('DB: idempotency_store table');
      return {
        pass: hasPort && hasService,
        confidence: hasTest && hasDb ? 95 : 70,
        evidence,
        hasPort,
        hasType: true,
        hasTest: hasTest || hasPropTest,
        hasDbConstraint: hasDb,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'INF-06',
    desc: 'Audit trail completeness',
    check() {
      const hasPort = fe(`${FIN}/app/ports/journal-audit-repo.ts`);
      const hasCorrelation = fc(`${FIN}/app/services/post-journal.ts`, 'correlationId');
      const hasReason = fc(`${FIN}/app/services/reverse-journal.ts`, 'reason');
      const evidence = [];
      if (hasPort) evidence.push('journal-audit-repo.ts port');
      if (hasCorrelation) evidence.push('post-journal.ts: correlationId');
      if (hasReason) evidence.push('reverse-journal.ts: reason field');
      return {
        pass: hasPort && hasCorrelation,
        confidence: hasReason ? 90 : 70,
        evidence,
        hasPort,
        hasType: true,
        hasTest: false,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'INF-07',
    desc: 'Immutability of posted facts',
    check() {
      const hasDbTrigger = dirContains(DB_DRIZZLE, 'trg_journal_before_post');
      const hasService = fc(`${FIN}/app/services/void-journal.ts`, 'POSTED');
      const hasPropTest = te('invariants-db.property.test.ts');
      const evidence = [];
      if (hasDbTrigger) evidence.push('DB trigger: trg_journal_before_post');
      if (hasService) evidence.push('void-journal.ts: POSTED status check');
      if (hasPropTest) evidence.push('invariants-db.property.test.ts: INF-02 immutability');
      return {
        pass: hasService,
        confidence: hasDbTrigger && hasPropTest ? 95 : 70,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest: hasPropTest,
        hasDbConstraint: hasDbTrigger,
        hasRuntime: false,
      };
    },
  },

  // ── B) Core GL (GL-01 to GL-12) ───────────────────────────────────────────
  {
    id: 'GL-01',
    desc: 'Chart of Accounts hierarchy',
    check() {
      const hasCalc = fe(`${FIN}/domain/calculators/coa-hierarchy.ts`);
      const hasPort = fe(`${FIN}/app/ports/account-repo.ts`);
      const evidence = [];
      if (hasCalc) evidence.push('coa-hierarchy.ts calculator');
      if (hasPort) evidence.push('account-repo.ts port');
      return {
        pass: hasCalc && hasPort,
        confidence: 80,
        evidence,
        hasPort,
        hasType: true,
        hasTest: false,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-02',
    desc: 'Journal entry creation',
    check() {
      const hasService = fe(`${FIN}/app/services/create-journal.ts`);
      const hasTest = te('create-journal.test.ts');
      const evidence = [];
      if (hasService) evidence.push('create-journal.ts service');
      if (hasTest) evidence.push('create-journal.test.ts');
      return {
        pass: hasService,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-03',
    desc: 'Double-entry balancing',
    check() {
      const hasCalc = fe(`${FIN}/domain/calculators/journal-balance.ts`);
      const hasService = fc(`${FIN}/app/services/post-journal.ts`, 'validateJournalBalance');
      const hasTest = te('calculators.test.ts');
      const hasPropTest = te('invariants-pure.property.test.ts');
      const evidence = [];
      if (hasCalc) evidence.push('journal-balance.ts calculator');
      if (hasService) evidence.push('post-journal.ts: validateJournalBalance');
      if (hasTest) evidence.push('calculators.test.ts');
      if (hasPropTest) evidence.push('invariants-pure.property.test.ts: GL-01 balanced posting');
      return {
        pass: hasCalc && hasService,
        confidence: hasPropTest ? 98 : hasTest ? 90 : 70,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest: hasTest || hasPropTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-04',
    desc: 'Minimum double-entry structure',
    check() {
      const hasCheck = fc(`${FIN}/domain/calculators/journal-balance.ts`, 'at least 2 lines');
      const hasPropTest = te('invariants-pure.property.test.ts');
      const evidence = [];
      if (hasCheck) evidence.push('journal-balance.ts: minimum 2 lines check');
      if (hasPropTest) evidence.push('invariants-pure.property.test.ts: GL-02 minimum structure');
      return {
        pass: hasCheck,
        confidence: hasPropTest ? 98 : 80,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest: hasPropTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-05',
    desc: 'Posting workflow (draft → posted)',
    check() {
      const hasService = fe(`${FIN}/app/services/post-journal.ts`);
      const hasTest = te('post-journal.test.ts');
      const hasAtomicity = te('posting-atomicity.test.ts');
      const evidence = [];
      if (hasService) evidence.push('post-journal.ts service');
      if (hasTest) evidence.push('post-journal.test.ts');
      if (hasAtomicity) evidence.push('posting-atomicity.test.ts');
      return {
        pass: hasService,
        confidence: hasTest && hasAtomicity ? 95 : hasTest ? 85 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest: hasTest || hasAtomicity,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-06',
    desc: 'Reversal (posted correction)',
    check() {
      const hasService = fe(`${FIN}/app/services/reverse-journal.ts`);
      const hasTest = te('reverse-journal.test.ts');
      const hasPropTest = te('invariants-db.property.test.ts');
      const evidence = [];
      if (hasService) evidence.push('reverse-journal.ts service');
      if (hasTest) evidence.push('reverse-journal.test.ts');
      if (hasPropTest) evidence.push('invariants-db.property.test.ts: GL-04 reversal nets to zero');
      return {
        pass: hasService,
        confidence: hasTest && hasPropTest ? 95 : hasTest ? 85 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest: hasTest || hasPropTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-07',
    desc: 'Void / cancel (draft-only)',
    check() {
      const hasService = fe(`${FIN}/app/services/void-journal.ts`);
      const hasTest = te('void-journal.test.ts');
      const evidence = [];
      if (hasService) evidence.push('void-journal.ts service');
      if (hasTest) evidence.push('void-journal.test.ts');
      return {
        pass: hasService,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-08',
    desc: 'Trial balance generation',
    check() {
      const hasCalc = fe(`${FIN}/domain/calculators/trial-balance.ts`);
      const hasTest = te('get-trial-balance.test.ts');
      const evidence = [];
      if (hasCalc) evidence.push('trial-balance.ts calculator');
      if (hasTest) evidence.push('get-trial-balance.test.ts');
      return {
        pass: hasCalc,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-09',
    desc: 'Account classification (reporting)',
    check() {
      const hasCalc = fe(`${FIN}/domain/calculators/report-classifier.ts`);
      const hasPort = fe(`${FIN}/app/ports/classification-rule-repo.ts`);
      const hasTest = te('classification-rules.test.ts');
      const evidence = [];
      if (hasCalc) evidence.push('report-classifier.ts calculator');
      if (hasPort) evidence.push('classification-rule-repo.ts port');
      if (hasTest) evidence.push('classification-rules.test.ts');
      return {
        pass: hasCalc || hasPort,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-10',
    desc: 'Period close controls',
    check() {
      const hasClose = fe(`${FIN}/app/services/close-period.ts`);
      const hasLock = fe(`${FIN}/app/services/lock-period.ts`);
      const hasReopen = fe(`${FIN}/app/services/reopen-period.ts`);
      const hasTest = te('close-period.test.ts') && te('lock-period.test.ts');
      const evidence = [];
      if (hasClose) evidence.push('close-period.ts service');
      if (hasLock) evidence.push('lock-period.ts service');
      if (hasReopen) evidence.push('reopen-period.ts service');
      if (hasTest) evidence.push('close-period/lock-period tests');
      return {
        pass: hasClose && hasLock,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-11',
    desc: 'Budget baseline + variance',
    check() {
      const hasPort = fe(`${FIN}/app/ports/budget-repo.ts`);
      const hasService = fe(`${FIN}/app/services/get-budget-variance.ts`);
      const hasTest = te('get-budget-variance.test.ts');
      const evidence = [];
      if (hasPort) evidence.push('budget-repo.ts port');
      if (hasService) evidence.push('get-budget-variance.ts service');
      if (hasTest) evidence.push('get-budget-variance.test.ts');
      return {
        pass: hasPort && hasService,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'GL-12',
    desc: 'Audit-grade lifecycle trail',
    check() {
      const hasPort = fe(`${FIN}/app/ports/journal-audit-repo.ts`);
      const hasPeriodAudit = fe(`${FIN}/app/ports/period-audit-repo.ts`);
      const hasCorrelation = fc(`${FIN}/app/services/post-journal.ts`, 'correlationId');
      const evidence = [];
      if (hasPort) evidence.push('journal-audit-repo.ts port');
      if (hasPeriodAudit) evidence.push('period-audit-repo.ts port');
      if (hasCorrelation) evidence.push('post-journal.ts: correlationId');
      return {
        pass: hasPort && hasCorrelation,
        confidence: hasPeriodAudit ? 90 : 70,
        evidence,
        hasPort,
        hasType: true,
        hasTest: false,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },

  // ── C) Foreign Exchange (FX-01 to FX-05) ──────────────────────────────────
  {
    id: 'FX-01',
    desc: 'Multi-currency line support',
    check() {
      const hasField = fc(`${FIN}/domain/entities/journal.ts`, 'currencyCode');
      const hasConvert = fe(`${FIN}/domain/calculators/fx-convert.ts`);
      const hasPropTest = te('invariants-pure.property.test.ts');
      const evidence = [];
      if (hasField) evidence.push('journal.ts: currencyCode field');
      if (hasConvert) evidence.push('fx-convert.ts calculator');
      if (hasPropTest)
        evidence.push('invariants-pure.property.test.ts: FX-01 deterministic conversion');
      return {
        pass: hasField && hasConvert,
        confidence: hasPropTest ? 95 : 80,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest: hasPropTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'FX-02',
    desc: 'Rate sourcing & effective dating',
    check() {
      const hasPort = fe(`${FIN}/app/ports/fx-rate-repo.ts`);
      const hasLookup = fc(`${FIN}/app/services/post-journal.ts`, 'fxRateRepo');
      const evidence = [];
      if (hasPort) evidence.push('fx-rate-repo.ts port');
      if (hasLookup) evidence.push('post-journal.ts: fxRateRepo lookup');
      return {
        pass: hasPort && hasLookup,
        confidence: 80,
        evidence,
        hasPort,
        hasType: true,
        hasTest: false,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'FX-03',
    desc: 'Triangulation / cross rates',
    check() {
      const hasCalc = fe(`${FIN}/domain/calculators/fx-triangulation.ts`);
      const hasTest = te('calculators-p4.test.ts');
      const evidence = [];
      if (hasCalc) evidence.push('fx-triangulation.ts calculator');
      if (hasTest) evidence.push('calculators-p4.test.ts');
      return {
        pass: hasCalc,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'FX-04',
    desc: 'Revaluation & unrealized gain/loss',
    check() {
      const hasCalc = fe(`${FIN}/domain/calculators/fx-convert.ts`);
      const hasGainLoss = fc(`${FIN}/domain/calculators/fx-convert.ts`, 'computeGainLoss');
      const evidence = [];
      if (hasCalc) evidence.push('fx-convert.ts calculator');
      if (hasGainLoss) evidence.push('fx-convert.ts: computeGainLoss');
      return {
        pass: hasGainLoss,
        confidence: 75,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest: false,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'FX-05',
    desc: 'Translation & CTA',
    check() {
      const hasCalc = fe(`${FIN}/domain/calculators/fx-translation.ts`);
      const hasTest = te('calculators-p3.test.ts');
      const evidence = [];
      if (hasCalc) evidence.push('fx-translation.ts calculator');
      if (hasTest) evidence.push('calculators-p3.test.ts');
      return {
        pass: hasCalc,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },

  // ── D) Intercompany (IC-01 to IC-04) ──────────────────────────────────────
  {
    id: 'IC-01',
    desc: 'Agreement governance',
    check() {
      const hasPort = fe(`${FIN}/app/ports/ic-repo.ts`);
      const hasTest = te('create-ic-transaction.test.ts');
      const evidence = [];
      if (hasPort) evidence.push('ic-repo.ts: IIcAgreementRepo port');
      if (hasTest) evidence.push('create-ic-transaction.test.ts');
      return {
        pass: hasPort,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'IC-02',
    desc: 'Paired entries (mirror journals)',
    check() {
      const hasService = fc(`${FIN}/app/services/create-ic-transaction.ts`, 'mirror');
      const hasTest = te('create-ic-transaction.test.ts');
      const evidence = [];
      if (hasService) evidence.push('create-ic-transaction.ts: mirror journal creation');
      if (hasTest) evidence.push('create-ic-transaction.test.ts');
      return {
        pass: hasService,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'IC-03',
    desc: 'Elimination readiness',
    check() {
      const hasCalc = fe(`${FIN}/domain/calculators/ic-elimination.ts`);
      const hasTest = te('calculators-p3.test.ts');
      const evidence = [];
      if (hasCalc) evidence.push('ic-elimination.ts calculator');
      if (hasTest) evidence.push('calculators-p3.test.ts');
      return {
        pass: hasCalc,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'IC-04',
    desc: 'Settlement tracking',
    check() {
      const hasPort = fe(`${FIN}/app/ports/ic-settlement-repo.ts`);
      const hasTest = te('settle-ic-documents.test.ts');
      const hasAging = te('ic-aging.test.ts');
      const evidence = [];
      if (hasPort) evidence.push('ic-settlement-repo.ts port');
      if (hasTest) evidence.push('settle-ic-documents.test.ts');
      if (hasAging) evidence.push('ic-aging.test.ts');
      return {
        pass: hasPort,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort,
        hasType: true,
        hasTest: hasTest || hasAging,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },

  // ── E) Accounting Hub (AH-01 to AH-04) ────────────────────────────────────
  {
    id: 'AH-01',
    desc: 'Derivation rules (subledger → GL)',
    check() {
      const hasCalc = fe(`${FIN}/domain/calculators/derivation-engine.ts`);
      const evidence = [];
      if (hasCalc) evidence.push('derivation-engine.ts calculator');
      return {
        pass: hasCalc,
        confidence: 70,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest: false,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'AH-02',
    desc: 'Allocation engine',
    check() {
      const hasCalc = fc(`${FIN}/domain/calculators/derivation-engine.ts`, 'allocateByDriver');
      const hasTest = te('calculators-p4.test.ts');
      const evidence = [];
      if (hasCalc) evidence.push('derivation-engine.ts: allocateByDriver');
      if (hasTest) evidence.push('calculators-p4.test.ts');
      return {
        pass: hasCalc,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'AH-03',
    desc: 'Accrual engine',
    check() {
      const hasService = fe(`${FIN}/app/services/recognize-revenue.ts`);
      const hasTest = te('deferred-revenue.test.ts');
      const evidence = [];
      if (hasService) evidence.push('recognize-revenue.ts service');
      if (hasTest) evidence.push('deferred-revenue.test.ts');
      return {
        pass: hasService,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'AH-04',
    desc: 'Revenue recognition schedules',
    check() {
      const hasPort = fe(`${FIN}/app/ports/revenue-contract-repo.ts`);
      const hasMilestones = fc(`${FIN}/app/ports/revenue-contract-repo.ts`, 'findMilestones');
      const hasTest = te('revenue-recognition.test.ts') || te('recognize-revenue.test.ts');
      const evidence = [];
      if (hasPort) evidence.push('revenue-contract-repo.ts port');
      if (hasMilestones) evidence.push('revenue-contract-repo.ts: findMilestones');
      if (hasTest) evidence.push('revenue-recognition/recognize-revenue tests');
      return {
        pass: hasPort && hasMilestones,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },

  // ── F) Recurring & Automated Entries (RE-01 to RE-03) ─────────────────────
  {
    id: 'RE-01',
    desc: 'Recurring journal templates',
    check() {
      const hasPort = fe(`${FIN}/app/ports/recurring-template-repo.ts`);
      const hasService = fe(`${FIN}/app/services/process-recurring-journals.ts`);
      const hasTest = te('process-recurring-journals.test.ts');
      const evidence = [];
      if (hasPort) evidence.push('recurring-template-repo.ts port');
      if (hasService) evidence.push('process-recurring-journals.ts service');
      if (hasTest) evidence.push('process-recurring-journals.test.ts');
      return {
        pass: hasPort && hasService,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'RE-02',
    desc: 'Idempotent batch execution',
    check() {
      const hasDedup = fc(`${FIN}/app/services/process-recurring-journals.ts`, 'nextRunDate');
      const hasAdvance = fc(
        `${FIN}/app/services/process-recurring-journals.ts`,
        'updateNextRunDate'
      );
      const hasTest = te('process-recurring-journals.test.ts');
      const evidence = [];
      if (hasDedup) evidence.push('process-recurring-journals.ts: nextRunDate dedup guard');
      if (hasAdvance)
        evidence.push('process-recurring-journals.ts: updateNextRunDate advances schedule');
      if (hasTest) evidence.push('process-recurring-journals.test.ts');
      return {
        pass: hasDedup && hasAdvance,
        confidence: hasTest ? 85 : 65,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'RE-03',
    desc: 'Recurring schedule audit trail',
    check() {
      const hasOutbox = fc(`${FIN}/app/services/process-recurring-journals.ts`, 'outbox');
      const hasAudit = fc(`${FIN}/app/services/process-recurring-journals.ts`, 'audit');
      const evidence = [];
      if (hasOutbox) evidence.push('process-recurring-journals.ts: outbox event');
      if (hasAudit) evidence.push('process-recurring-journals.ts: audit logging');
      return {
        pass: hasOutbox || hasAudit,
        confidence: 70,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest: false,
        hasDbConstraint: false,
        hasRuntime: hasOutbox,
      };
    },
  },

  // ── G) Financial Reporting (FR-01 to FR-06) ───────────────────────────────
  {
    id: 'FR-01',
    desc: 'Balance Sheet generation',
    check() {
      const hasService = fe(`${FIN}/app/services/get-balance-sheet.ts`);
      const hasTest = te('get-balance-sheet.test.ts');
      const evidence = [];
      if (hasService) evidence.push('get-balance-sheet.ts service');
      if (hasTest) evidence.push('get-balance-sheet.test.ts');
      return {
        pass: hasService,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'FR-02',
    desc: 'Income Statement generation',
    check() {
      const hasService = fe(`${FIN}/app/services/get-income-statement.ts`);
      const hasTest = te('get-income-statement.test.ts');
      const evidence = [];
      if (hasService) evidence.push('get-income-statement.ts service');
      if (hasTest) evidence.push('get-income-statement.test.ts');
      return {
        pass: hasService,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'FR-03',
    desc: 'Cash Flow Statement generation',
    check() {
      const hasService = fe(`${FIN}/app/services/get-cash-flow.ts`);
      const hasCalc = fe(`${FIN}/domain/calculators/cash-flow-indirect.ts`);
      const hasTest = te('get-cash-flow.test.ts');
      const evidence = [];
      if (hasService) evidence.push('get-cash-flow.ts service');
      if (hasCalc) evidence.push('cash-flow-indirect.ts calculator');
      if (hasTest) evidence.push('get-cash-flow.test.ts');
      return {
        pass: hasService || hasCalc,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'FR-04',
    desc: 'Report parameterization & scoping',
    check() {
      const hasRoutes = fe(`${FIN}/infra/routes/report-routes.ts`);
      const hasSchemas = fc('packages/contracts/src/index.ts', 'BalanceSheetQuerySchema');
      const evidence = [];
      if (hasRoutes) evidence.push('report-routes.ts: scoped report endpoints');
      if (hasSchemas) evidence.push('@afenda/contracts: report query schemas');
      return {
        pass: hasRoutes && hasSchemas,
        confidence: 85,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest: false,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'FR-05',
    desc: 'Comparative period support',
    check() {
      const hasCalc =
        fe(`${FIN}/domain/calculators/comparative-report.ts`) ||
        fe(`${FIN}/domain/calculators/comparative-reports.ts`);
      const hasTest = te('comparative-reports.test.ts') || te('comparative-report.test.ts');
      const evidence = [];
      if (hasCalc) evidence.push('comparative-report.ts calculator');
      if (hasTest) evidence.push('comparative-reports.test.ts');
      return {
        pass: hasCalc,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: false,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
  {
    id: 'FR-06',
    desc: 'Budget variance reporting',
    check() {
      const hasService = fe(`${FIN}/app/services/get-budget-variance.ts`);
      const hasAlerts = fc(`${FIN}/infra/routes/report-routes.ts`, 'variance-alerts');
      const hasTest = te('get-budget-variance.test.ts') || te('variance-alerts.test.ts');
      const evidence = [];
      if (hasService) evidence.push('get-budget-variance.ts service');
      if (hasAlerts) evidence.push('report-routes.ts: variance-alerts endpoint');
      if (hasTest) evidence.push('budget-variance/variance-alerts tests');
      return {
        pass: hasService,
        confidence: hasTest ? 90 : 70,
        evidence,
        hasPort: true,
        hasType: true,
        hasTest,
        hasDbConstraint: false,
        hasRuntime: false,
      };
    },
  },
];

// ─── Run Checks ──────────────────────────────────────────────────────────────

const results = checks.map((c) => {
  const r = c.check();
  const level = computeLevel(r);
  return {
    id: c.id,
    description: c.desc,
    status: r.pass ? 'PASS' : 'FAIL',
    evidenceLevel: level,
    confidence: r.confidence,
    evidence: r.evidence,
  };
});

// ─── Output ──────────────────────────────────────────────────────────────────

if (JSON_MODE) {
  const byLevel = {};
  for (const r of results) {
    byLevel[r.evidenceLevel] = (byLevel[r.evidenceLevel] || 0) + 1;
  }
  const report = {
    toolId: 'AIS',
    schemaVersion: '1.0',
    version: VERSION,
    timestamp: new Date().toISOString(),
    summary: {
      pass: results.filter((r) => r.status === 'PASS').length,
      fail: results.filter((r) => r.status === 'FAIL').length,
      warn: 0,
      total: results.length,
      byLevel,
    },
    checks: results,
  };
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`\n  AIS Benchmark Audit v${VERSION} (${results.length} items)\n`);
  console.log(
    `  ${'ID'.padEnd(8)} ${'Description'.padEnd(42)} ${'Status'.padEnd(6)} ${'Lvl'.padEnd(4)} Confidence`
  );
  console.log('  ' + '\u2500'.repeat(85));

  for (const r of results) {
    const icon = r.status === 'PASS' ? '\u2705' : '\u274C';
    console.log(
      `  ${r.id.padEnd(8)} ${r.description.padEnd(42)} ${icon} ${r.status.padEnd(6)} ${r.evidenceLevel.padEnd(4)} ${r.confidence}%`
    );
  }

  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;

  console.log('\n  ' + '\u2500'.repeat(85));
  console.log(`  Total: ${pass}/${results.length} pass, ${fail} fail`);

  // Evidence level distribution
  const byLevel = {};
  for (const r of results) {
    byLevel[r.evidenceLevel] = (byLevel[r.evidenceLevel] || 0) + 1;
  }
  const levelStr = Object.entries(byLevel)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('  ');
  console.log(`  Evidence levels: ${levelStr}\n`);
}

process.exit(results.some((r) => r.status === 'FAIL') ? 1 : 0);
