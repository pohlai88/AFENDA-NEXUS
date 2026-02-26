#!/usr/bin/env node
/**
 * pnpm audit:sox — SOX ITGC compliance audit (12 controls, WARN mode).
 *
 * Checks IT General Controls against the codebase for SOX readiness.
 * Default mode: WARN (advisory, exit 0). Use --fail to exit 1 on failures.
 *
 * Usage:
 *   node tools/scripts/audit-sox.mjs           # human-readable, WARN mode
 *   node tools/scripts/audit-sox.mjs --json    # JSON output (evidence schema v1.0)
 *   node tools/scripts/audit-sox.mjs --fail    # exit 1 on any FAIL
 *   pnpm audit:sox
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const JSON_MODE = process.argv.includes('--json');
const FAIL_MODE = process.argv.includes('--fail');
const VERSION = '1.1.0';

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
      } else if (entry.isFile() && /\.(ts|js|sql|mjs|json|yaml|yml)$/.test(entry.name)) {
        if (fileContains(full, pattern)) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Slice-based path resolution ────────────────────────────────────────────
const FIN = 'packages/modules/finance/src';
const DB = 'packages/db';
const FINANCE_ABS = join(ROOT, FIN);
const PATH_MAP = {
  'app/ports/journal-audit-repo.ts': 'slices/gl/ports/journal-audit-repo.ts',
  'app/ports/period-audit-repo.ts': 'slices/gl/ports/period-audit-repo.ts',
  'app/ports/idempotency-store.ts': 'shared/ports/idempotency-store.ts',
  'app/ports/outbox-writer.ts': 'shared/ports/outbox-writer.ts',
  'app/ports/authorization.ts': 'shared/ports/authorization.ts',
  'app/services/post-journal.ts': 'slices/gl/services/post-journal.ts',
  'app/services/void-journal.ts': 'slices/gl/services/void-journal.ts',
  'domain/calculators/journal-balance.ts': 'slices/gl/calculators/journal-balance.ts',
  'domain/events.ts': 'shared/events.ts',
  'domain/index.ts': 'shared/events.ts',
  'infra/routes/tenant-guard.ts': 'shared/routes/tenant-guard.ts',
  'infra/authorization/default-authorization-policy.ts':
    'shared/authorization/default-authorization-policy.ts',
  'infra/routes/authorization-guard.ts': 'shared/routes/authorization-guard.ts',
  'infra/routes/rate-limit-guard.ts': 'shared/routes/rate-limit-guard.ts',
};

function resolveFin(relPath) {
  const original = join(FINANCE_ABS, relPath);
  if (existsSync(original)) return original;
  const mapped = PATH_MAP[relPath];
  if (mapped) {
    const alt = join(FINANCE_ABS, mapped);
    if (existsSync(alt)) return alt;
  }
  return original;
}

function fe(p) {
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

function countFiles(dirPath, ext) {
  const abs = join(ROOT, dirPath);
  if (!existsSync(abs)) return 0;
  let count = 0;
  try {
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (entry.isDirectory()) count += countFiles(join(dirPath, entry.name), ext);
      else if (entry.isFile() && entry.name.endsWith(ext)) count++;
    }
  } catch {
    /* ignore */
  }
  return count;
}

// ─── SOX ITGC Controls ──────────────────────────────────────────────────────
// AC: Access Controls
// CM: Change Management
// OPS: IT Operations
// DI: Data Integrity

const controls = [
  // ── AC: Access Controls ────────────────────────────────────────────────────
  {
    id: 'AC-01',
    category: 'Access Controls',
    desc: 'Row-level security on all tenant tables',
    check() {
      const hasRls = dirContains(join(ROOT, DB, 'drizzle'), 'ENABLE ROW LEVEL SECURITY');
      const hasPolicy = dirContains(join(ROOT, DB, 'drizzle'), 'CREATE POLICY');
      const evidence = [];
      if (hasRls) evidence.push('DB migrations: ENABLE ROW LEVEL SECURITY');
      if (hasPolicy) evidence.push('DB migrations: CREATE POLICY statements');
      return { pass: hasRls && hasPolicy, evidence, confidence: hasRls && hasPolicy ? 90 : 30 };
    },
  },
  {
    id: 'AC-02',
    category: 'Access Controls',
    desc: 'Tenant scope enforcement in application layer',
    check() {
      const hasSession = fe(`${DB}/src/session.ts`);
      const hasGuard = fe(`${FIN}/infra/routes/tenant-guard.ts`);
      const hasSetLocal = fc(`${DB}/src/session.ts`, 'set_config');
      const evidence = [];
      if (hasSession) evidence.push('db/session.ts: tenant session management');
      if (hasGuard) evidence.push('finance: tenant-guard.ts preHandler');
      if (hasSetLocal) evidence.push('db/session.ts: SET LOCAL via set_config()');
      return { pass: hasSession && hasSetLocal, evidence, confidence: hasGuard ? 95 : 70 };
    },
  },
  {
    id: 'AC-03',
    category: 'Access Controls',
    desc: 'Authorization policy with separation of duties',
    check() {
      const hasPort = fe(`${FIN}/app/ports/authorization.ts`);
      const hasImpl = fe(`${FIN}/infra/authorization/default-authorization-policy.ts`);
      const hasGuard = fe(`${FIN}/infra/routes/authorization-guard.ts`);
      const evidence = [];
      if (hasPort) evidence.push('authorization.ts: IAuthorizationPolicy port');
      if (hasImpl) evidence.push('default-authorization-policy.ts implementation');
      if (hasGuard) evidence.push('authorization-guard.ts: requirePermission/requireSoD');
      return { pass: hasPort && hasGuard, evidence, confidence: hasImpl ? 85 : 60 };
    },
  },
  {
    id: 'AC-04',
    category: 'Access Controls',
    desc: 'Rate limiting per tenant',
    check() {
      const hasGuard = fe(`${FIN}/infra/routes/rate-limit-guard.ts`);
      const evidence = [];
      if (hasGuard) evidence.push('rate-limit-guard.ts: per-tenant sliding window');
      return { pass: hasGuard, evidence, confidence: hasGuard ? 80 : 0 };
    },
  },

  // ── CM: Change Management ──────────────────────────────────────────────────
  {
    id: 'CM-01',
    category: 'Change Management',
    desc: 'Database migrations versioned and tracked',
    check() {
      const migrationCount = countFiles(`${DB}/drizzle`, '.sql');
      const hasConfig = fe(`${DB}/drizzle.config.ts`);
      const evidence = [];
      if (migrationCount > 0) evidence.push(`${migrationCount} SQL migration files in drizzle/`);
      if (hasConfig) evidence.push('drizzle.config.ts: migration configuration');
      return {
        pass: migrationCount >= 1 && hasConfig,
        evidence,
        confidence: migrationCount >= 3 ? 90 : 70,
      };
    },
  },
  {
    id: 'CM-02',
    category: 'Change Management',
    desc: 'Architecture drift detection',
    check() {
      const hasGuard = fe('tools/drift-check/src/arch-guard.mjs');
      const hasScript = fc('package.json', 'arch:guard');
      const evidence = [];
      if (hasGuard) evidence.push('arch-guard.mjs: automated architecture checks');
      if (hasScript) evidence.push('package.json: arch:guard script defined');
      return { pass: hasGuard && hasScript, evidence, confidence: 90 };
    },
  },
  {
    id: 'CM-03',
    category: 'Change Management',
    desc: 'Input validation on all API endpoints',
    check() {
      const hasSchemas = fc('packages/contracts/src/index.ts', 'Schema');
      const hasZod = fc('packages/contracts/package.json', 'zod');
      const evidence = [];
      if (hasSchemas) evidence.push('@afenda/contracts: Zod validation schemas');
      if (hasZod) evidence.push('@afenda/contracts: zod dependency');
      return { pass: hasSchemas && hasZod, evidence, confidence: 85 };
    },
  },

  // ── OPS: IT Operations ─────────────────────────────────────────────────────
  {
    id: 'OPS-01',
    category: 'IT Operations',
    desc: 'Structured audit logging with correlation IDs',
    check() {
      const hasAuditPort = fe(`${FIN}/app/ports/journal-audit-repo.ts`);
      const hasPeriodAudit = fe(`${FIN}/app/ports/period-audit-repo.ts`);
      const hasCorrelation = fc(`${FIN}/app/services/post-journal.ts`, 'correlationId');
      const evidence = [];
      if (hasAuditPort) evidence.push('journal-audit-repo.ts: structured audit logging');
      if (hasPeriodAudit) evidence.push('period-audit-repo.ts: period lifecycle audit');
      if (hasCorrelation) evidence.push('post-journal.ts: correlationId propagation');
      return {
        pass: hasAuditPort && hasCorrelation,
        evidence,
        confidence: hasPeriodAudit ? 90 : 70,
      };
    },
  },
  {
    id: 'OPS-02',
    category: 'IT Operations',
    desc: 'Outbox pattern for reliable event delivery',
    check() {
      const hasPort = fe(`${FIN}/app/ports/outbox-writer.ts`);
      const hasWorker = fe('apps/worker/src/index.ts');
      const hasEventTypes =
        fc(`${FIN}/domain/events.ts`, 'FinanceEventType') ||
        fc(`${FIN}/domain/index.ts`, 'FinanceEventType');
      const evidence = [];
      if (hasPort) evidence.push('outbox-writer.ts: transactional outbox port');
      if (hasWorker) evidence.push('apps/worker: outbox drainer process');
      if (hasEventTypes) evidence.push('domain: FinanceEventType registry');
      return { pass: hasPort && hasWorker, evidence, confidence: hasEventTypes ? 90 : 70 };
    },
  },
  {
    id: 'OPS-03',
    category: 'IT Operations',
    desc: 'Idempotency controls for command processing',
    check() {
      const hasPort = fe(`${FIN}/app/ports/idempotency-store.ts`);
      const hasDb = dirContains(join(ROOT, DB, 'drizzle'), 'idempotency');
      const hasSchema = fe(`${DB}/src/schema/idempotency-store.ts`);
      const evidence = [];
      if (hasPort) evidence.push('idempotency-store.ts: claim-or-get pattern');
      if (hasDb) evidence.push('DB: idempotency_store table migration');
      if (hasSchema) evidence.push('Drizzle schema: idempotency_store');
      return {
        pass: hasPort && (hasDb || hasSchema),
        evidence,
        confidence: hasDb && hasSchema ? 95 : 70,
      };
    },
  },

  // ── DI: Data Integrity ─────────────────────────────────────────────────────
  {
    id: 'DI-01',
    category: 'Data Integrity',
    desc: 'Double-entry balancing enforced at posting boundary',
    check() {
      const hasCalc = fe(`${FIN}/domain/calculators/journal-balance.ts`);
      const hasService = fc(`${FIN}/app/services/post-journal.ts`, 'validateJournalBalance');
      const hasPropTest = fe(`${FIN}/__tests__/invariants-pure.property.test.ts`);
      const evidence = [];
      if (hasCalc) evidence.push('journal-balance.ts: pure balance calculator');
      if (hasService) evidence.push('post-journal.ts: balance validation at commit');
      if (hasPropTest) evidence.push('invariants-pure.property.test.ts: randomized balance tests');
      return { pass: hasCalc && hasService, evidence, confidence: hasPropTest ? 98 : 80 };
    },
  },
  {
    id: 'DI-02',
    category: 'Data Integrity',
    desc: 'Immutability of posted financial facts',
    check() {
      const hasDbTrigger = dirContains(join(ROOT, DB, 'drizzle'), 'trg_journal_before_post');
      const hasVoidCheck = fc(`${FIN}/app/services/void-journal.ts`, 'POSTED');
      const hasPropTest = fe(`${FIN}/__tests__/invariants-db.property.test.ts`);
      const evidence = [];
      if (hasDbTrigger) evidence.push('DB trigger: trg_journal_before_post (prevents mutation)');
      if (hasVoidCheck) evidence.push('void-journal.ts: rejects void of posted journals');
      if (hasPropTest) evidence.push('invariants-db.property.test.ts: immutability property tests');
      return { pass: hasVoidCheck, evidence, confidence: hasDbTrigger && hasPropTest ? 95 : 70 };
    },
  },
];

// ─── Run Controls ────────────────────────────────────────────────────────────

const results = controls.map((c) => {
  const r = c.check();
  return {
    id: c.id,
    category: c.category,
    description: c.desc,
    status: r.pass ? 'PASS' : FAIL_MODE ? 'FAIL' : 'WARN',
    confidence: r.confidence,
    evidence: r.evidence,
  };
});

// ─── Output ──────────────────────────────────────────────────────────────────

if (JSON_MODE) {
  const report = {
    toolId: 'SOX',
    schemaVersion: '1.0',
    version: VERSION,
    timestamp: new Date().toISOString(),
    mode: FAIL_MODE ? 'FAIL' : 'WARN',
    summary: {
      pass: results.filter((r) => r.status === 'PASS').length,
      fail: results.filter((r) => r.status === 'FAIL').length,
      warn: results.filter((r) => r.status === 'WARN').length,
      total: results.length,
    },
    controls: results,
  };
  console.log(JSON.stringify(report, null, 2));
} else {
  const mode = FAIL_MODE ? 'FAIL' : 'WARN';
  console.log(`\n  SOX ITGC Audit v${VERSION} (${results.length} controls, mode: ${mode})\n`);
  console.log(
    `  ${'ID'.padEnd(8)} ${'Category'.padEnd(20)} ${'Description'.padEnd(48)} ${'Status'.padEnd(6)} Conf`
  );
  console.log('  ' + '\u2500'.repeat(95));

  let currentCategory = '';
  for (const r of results) {
    if (r.category !== currentCategory) {
      if (currentCategory) console.log();
      currentCategory = r.category;
    }
    const icon = r.status === 'PASS' ? '\u2705' : r.status === 'WARN' ? '\u26A0\uFE0F' : '\u274C';
    console.log(
      `  ${r.id.padEnd(8)} ${r.category.padEnd(20)} ${r.description.padEnd(48)} ${icon} ${r.status.padEnd(6)} ${r.confidence}%`
    );
  }

  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARN').length;

  console.log('\n  ' + '\u2500'.repeat(95));
  console.log(`  Total: ${pass}/${results.length} pass, ${fail} fail, ${warn} warn`);

  if (!FAIL_MODE && warn > 0) {
    console.log(
      `\n  \u26A0\uFE0F  ${warn} control(s) in WARN mode. Use --fail to promote to hard failures.`
    );
  }
  console.log();
}

const hasFailures = results.some((r) => r.status === 'FAIL');
process.exit(hasFailures ? 1 : 0);
