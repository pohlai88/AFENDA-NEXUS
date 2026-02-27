/**
 * @generated — do not edit manually
 * Generator validation tests — 3 layers: smoke, pattern assertions, checklist assertions.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSpec, validateSpec } from '../src/spec.mjs';
import { generateChecklist } from '../src/checklist.mjs';
import {
  toKebab,
  toPascal,
  toCamel,
  toScreamingSnake,
  toSnake,
  safeWrite,
  nextMigrationFilename,
  patchAnchoredRegion,
} from '../src/utils.mjs';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

const TEST_SPEC = {
  module: 'finance',
  slice: 'ar',
  entity: {
    name: 'ArCustomer',
    table: 'ar_customer',
    idBrand: 'ArCustomerId',
    statuses: ['ACTIVE', 'ON_HOLD', 'INACTIVE'],
    moneyFields: ['creditLimit'],
    refs: [{ field: 'companyId', brand: 'CompanyId', entity: 'Company' }],
    extraFields: [],
  },
  commands: [
    { name: 'create', service: 'createArCustomer', route: 'POST /ar/customers', idempotent: false },
    { name: 'suspend', service: 'suspendArCustomer', route: 'POST /ar/customers/:id/suspend', idempotent: true },
  ],
  frontend: {
    routeGroup: '/finance/receivables/customers',
    featureKey: 'ar-customer',
    featureDir: 'receivables',
  },
  contracts: true,
  migration: true,
};

// ─── Layer 1: Naming Utilities ───────────────────────────────────────────────

describe('Naming utilities', () => {
  it('toKebab converts PascalCase', () => {
    expect(toKebab('ArInvoice')).toBe('ar-invoice');
    expect(toKebab('ApPaymentRun')).toBe('ap-payment-run');
    expect(toKebab('GLBalance')).toBe('gl-balance');
  });

  it('toPascal converts kebab-case', () => {
    expect(toPascal('ar-invoice')).toBe('ArInvoice');
    expect(toPascal('ap-payment-run')).toBe('ApPaymentRun');
  });

  it('toCamel converts PascalCase', () => {
    expect(toCamel('ArInvoice')).toBe('arInvoice');
    expect(toCamel('ap-payment-run')).toBe('apPaymentRun');
  });

  it('toScreamingSnake converts PascalCase', () => {
    expect(toScreamingSnake('ArInvoice')).toBe('AR_INVOICE');
    expect(toScreamingSnake('ApPaymentRun')).toBe('AP_PAYMENT_RUN');
  });

  it('toSnake converts PascalCase', () => {
    expect(toSnake('ArInvoice')).toBe('ar_invoice');
    expect(toSnake('ArCustomer')).toBe('ar_customer');
  });
});

// ─── Layer 1: Spec Validation ────────────────────────────────────────────────

describe('Spec validation', () => {
  it('validates a correct spec with no errors', () => {
    const errors = validateSpec(TEST_SPEC);
    expect(errors).toEqual([]);
  });

  it('rejects missing module', () => {
    const errors = validateSpec({ ...TEST_SPEC, module: '' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('module');
  });

  it('rejects invalid entity name (not PascalCase)', () => {
    const errors = validateSpec({
      ...TEST_SPEC,
      entity: { ...TEST_SPEC.entity, name: 'arCustomer' },
    });
    expect(errors.some((e) => e.includes('PascalCase'))).toBe(true);
  });

  it('rejects empty statuses', () => {
    const errors = validateSpec({
      ...TEST_SPEC,
      entity: { ...TEST_SPEC.entity, statuses: [] },
    });
    expect(errors.some((e) => e.includes('statuses'))).toBe(true);
  });

  it('rejects invalid status format', () => {
    const errors = validateSpec({
      ...TEST_SPEC,
      entity: { ...TEST_SPEC.entity, statuses: ['active'] },
    });
    expect(errors.some((e) => e.includes('SCREAMING_SNAKE'))).toBe(true);
  });

  it('validates commands with missing fields', () => {
    const errors = validateSpec({
      ...TEST_SPEC,
      commands: [{ name: 'post' }],
    });
    expect(errors.some((e) => e.includes('service'))).toBe(true);
    expect(errors.some((e) => e.includes('route'))).toBe(true);
  });
});

// ─── Layer 1: Spec Builder ───────────────────────────────────────────────────

describe('Spec builder', () => {
  it('builds spec from CLI args', () => {
    const spec = buildSpec({
      module: 'finance',
      slice: 'ar',
      entity: 'ArCustomer',
      statuses: 'ACTIVE,ON_HOLD,INACTIVE',
      moneyFields: 'creditLimit',
      commands: 'suspend:suspendArCustomer',
      frontend: true,
      featureDir: 'receivables',
    });

    expect(spec.module).toBe('finance');
    expect(spec.slice).toBe('ar');
    expect(spec.entity.name).toBe('ArCustomer');
    expect(spec.entity.table).toBe('ar_customer');
    expect(spec.entity.idBrand).toBe('ArCustomerId');
    expect(spec.entity.statuses).toEqual(['ACTIVE', 'ON_HOLD', 'INACTIVE']);
    expect(spec.entity.moneyFields).toEqual(['creditLimit']);
    expect(spec.commands).toHaveLength(1);
    expect(spec.commands[0].name).toBe('suspend');
    expect(spec.commands[0].idempotent).toBe(false);
    expect(spec.frontend.routeGroup).toBe('/finance/receivables/ar-customers');
    expect(spec.contracts).toBe(true);
    expect(spec.migration).toBe(true);
  });

  it('auto-detects idempotent commands', () => {
    const spec = buildSpec({
      module: 'finance',
      slice: 'ar',
      entity: 'ArInvoice',
      commands: 'post:postArInvoice,reverse:reverseArInvoice,approve:approveArInvoice',
    });

    const post = spec.commands.find((c) => c.name === 'post');
    const reverse = spec.commands.find((c) => c.name === 'reverse');
    const approve = spec.commands.find((c) => c.name === 'approve');

    expect(post.idempotent).toBe(true);
    expect(reverse.idempotent).toBe(true);
    expect(approve.idempotent).toBe(false);
  });
});

// ─── Layer 1: Safe Write ─────────────────────────────────────────────────────

describe('safeWrite', () => {
  let tmpDir;

  beforeAll(() => {
    tmpDir = join(tmpdir(), `afenda-gen-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates new file with @generated header', () => {
    const path = join(tmpDir, 'new-file.ts');
    const result = safeWrite(path, 'const x = 1;');
    expect(result.action).toBe('created');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('// @generated');
    expect(content).toContain('const x = 1;');
  });

  it('overwrites file with @generated header', () => {
    const path = join(tmpDir, 'overwrite.ts');
    safeWrite(path, 'const x = 1;');
    const result = safeWrite(path, 'const x = 2;');
    expect(result.action).toBe('overwritten');
    expect(readFileSync(path, 'utf-8')).toContain('const x = 2;');
  });

  it('skips file without @generated header', () => {
    const path = join(tmpDir, 'manual.ts');
    writeFileSync(path, 'const manual = true;\n');
    const result = safeWrite(path, 'const x = 1;');
    expect(result.action).toBe('skipped');
    expect(readFileSync(path, 'utf-8')).toContain('manual');
  });

  it('overwrites with --force', () => {
    const path = join(tmpDir, 'forced.ts');
    writeFileSync(path, 'const manual = true;\n');
    const result = safeWrite(path, 'const x = 1;', { force: true });
    expect(result.action).toBe('overwritten');
  });

  it('normalises newlines to LF', () => {
    const path = join(tmpDir, 'crlf.ts');
    safeWrite(path, 'line1\r\nline2\r\n');
    const content = readFileSync(path, 'utf-8');
    expect(content).not.toContain('\r\n');
    expect(content).toContain('line1\nline2\n');
  });

  it('adds SQL header for .sql files', () => {
    const path = join(tmpDir, 'test.sql');
    safeWrite(path, 'SELECT 1;');
    expect(readFileSync(path, 'utf-8')).toContain('-- @generated');
  });
});

// ─── Layer 1: Migration Naming ───────────────────────────────────────────────

describe('nextMigrationFilename', () => {
  let tmpDir;

  beforeAll(() => {
    tmpDir = join(tmpdir(), `afenda-migration-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(join(tmpDir, '0000_baseline.sql'), '');
    writeFileSync(join(tmpDir, '0001_auth.sql'), '');
    writeFileSync(join(tmpDir, '0011_approval.sql'), '');
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns next sequential number with timestamp', () => {
    const filename = nextMigrationFilename(tmpDir, 'ar_customer');
    expect(filename).toMatch(/^0012_ar_customer__\d{8}\.sql$/);
  });
});

// ─── Layer 1: Anchored Region Patching ───────────────────────────────────────

describe('patchAnchoredRegion', () => {
  let tmpDir;

  beforeAll(() => {
    tmpDir = join(tmpdir(), `afenda-patch-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('inserts content into anchored region', () => {
    const path = join(tmpDir, 'events.ts');
    writeFileSync(
      path,
      `const X = {\n  A: 'A',\n  // @afenda-gen:events:start\n  // @afenda-gen:events:end\n} as const;\n`,
    );
    const result = patchAnchoredRegion(path, 'events', `NEW_EVENT: 'NEW_EVENT',`);
    expect(result.patched).toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain("NEW_EVENT: 'NEW_EVENT',");
  });

  it('skips duplicate insertion', () => {
    const path = join(tmpDir, 'events2.ts');
    writeFileSync(
      path,
      `const X = {\n  // @afenda-gen:events:start\n  FOO: 'FOO',\n  // @afenda-gen:events:end\n};\n`,
    );
    const result = patchAnchoredRegion(path, 'events', `FOO: 'FOO',`);
    expect(result.patched).toBe(false);
    expect(result.reason).toContain('Already present');
  });

  it('returns error for missing region', () => {
    const path = join(tmpDir, 'no-region.ts');
    writeFileSync(path, 'const x = 1;\n');
    const result = patchAnchoredRegion(path, 'events', 'stuff');
    expect(result.patched).toBe(false);
    expect(result.reason).toContain('not found');
  });
});

// ─── Layer 2: Checklist Generation ───────────────────────────────────────────

describe('Checklist generation', () => {
  it('generates checklist with all A-J categories', () => {
    const { md, json, todos } = generateChecklist(TEST_SPEC);

    // All 10 categories present in markdown
    for (const cat of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
      expect(md).toContain(`## ${cat}.`);
    }

    // JSON has todos array
    expect(json.todos.length).toBeGreaterThan(0);
    expect(json.featureKey).toBe('finance/ar/ar-customer');
    expect(json.specHash).toBeTruthy();

    // Has idempotency items for the idempotent command
    const idempotencyTodos = todos.filter((t) => t.category === 'Idempotency');
    expect(idempotencyTodos.length).toBeGreaterThan(0);

    // Has service logic items for each command
    const serviceTodos = todos.filter((t) => t.category === 'ServiceDomainLogic');
    expect(serviceTodos.length).toBeGreaterThan(0);
  });

  it('includes severity levels', () => {
    const { todos } = generateChecklist(TEST_SPEC);
    const severities = new Set(todos.map((t) => t.severity));
    expect(severities.has('CRITICAL')).toBe(true);
    expect(severities.has('HIGH')).toBe(true);
  });

  it('includes file references for service TODOs', () => {
    const { todos } = generateChecklist(TEST_SPEC);
    const serviceTodo = todos.find(
      (t) => t.category === 'ServiceDomainLogic' && t.files.length > 0,
    );
    expect(serviceTodo).toBeTruthy();
    expect(serviceTodo.files[0]).toContain('services/');
  });

  it('markdown uses structured TODO format', () => {
    const { md } = generateChecklist(TEST_SPEC);
    // Check for [SEVERITY|ID] format
    expect(md).toMatch(/\[CRITICAL\|[A-Z]\d+\]/);
    expect(md).toMatch(/\[HIGH\|[A-Z]\d+\]/);
  });
});

// ─── Layer 2: Deterministic Output ───────────────────────────────────────────

describe('Deterministic output', () => {
  it('same spec produces same checklist structure', () => {
    const result1 = generateChecklist(TEST_SPEC);
    const result2 = generateChecklist(TEST_SPEC);

    expect(result1.todos.length).toBe(result2.todos.length);
    expect(result1.json.specHash).toBe(result2.json.specHash);

    // Same categories
    const cats1 = result1.todos.map((t) => t.category).sort();
    const cats2 = result2.todos.map((t) => t.category).sort();
    expect(cats1).toEqual(cats2);
  });
});
