/**
 * AP Remaining Gaps — B2, B3, F2, K4, Idempotency Sweep
 *
 * B2:  Triage queue (INCOMPLETE status + assignment)
 * B3:  OCR/automation pipeline
 * F2:  WHT line classification
 * K4:  Tamper-resistant logging (SHA-256 hash chain)
 * Idempotency: Guards on 6 services
 */
import { describe, it, expect } from 'vitest';
import { ok, err, NotFoundError, money, companyId, ledgerId } from '@afenda/core';
import type { ApInvoice, ApInvoiceLine } from '../slices/ap/entities/ap-invoice.js';
import type { IApInvoiceRepo, CreateApInvoiceInput } from '../slices/ap/ports/ap-invoice-repo.js';
import type { IOutboxWriter, OutboxEvent } from '../shared/ports/outbox-writer.js';
import type {
  IIdempotencyStore,
  IdempotencyClaimInput,
  IdempotencyResult,
} from '../shared/ports/idempotency-store.js';

import {
  markInvoiceIncomplete,
  assignTriageInvoice,
  resolveTriageInvoice,
  listTriageQueue,
  type ITriageAssignmentRepo,
  type TriageAssignment,
} from '../slices/ap/services/ap-triage-queue.js';
// B3 OCR tests moved to ap-ocr-pipeline.test.ts (two-boundary rewrite)
import {
  computeContentHash,
  verifyOutboxChain,
  TamperResistantOutboxWriter,
  type HashedOutboxEntry,
  type IHashedOutboxStore,
} from '../shared/services/tamper-resistant-outbox.js';
import { approveApInvoice } from '../slices/ap/services/approve-ap-invoice.js';
import { cancelApInvoice } from '../slices/ap/services/cancel-ap-invoice.js';
import { createCreditMemo } from '../slices/ap/services/create-credit-memo.js';
import { batchInvoiceImport } from '../slices/ap/services/batch-invoice-import.js';
import { applyPrepayment } from '../slices/ap/services/apply-prepayment.js';
import { processBankRejection } from '../slices/ap/services/process-bank-rejection.js';

// ─── Fixed IDs ──────────────────────────────────────────────────────────────

const TENANT_ID = 't1';
const USER_ID = 'u1';
const COMPANY_ID = '00000000-0000-4000-8000-000000000030';
const LEDGER_ID = '00000000-0000-4000-8000-000000000040';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeApInvoiceLine(overrides: Partial<ApInvoiceLine> = {}): ApInvoiceLine {
  return {
    id: 'line-1',
    invoiceId: 'inv-1',
    lineNumber: 1,
    accountId: 'acc-1',
    description: 'Test line',
    quantity: 1,
    unitPrice: money(10000n, 'USD'),
    amount: money(10000n, 'USD'),
    taxAmount: money(0n, 'USD'),
    whtIncomeType: null,
    ...overrides,
  };
}

function makeApInvoice(overrides: Partial<ApInvoice> = {}): ApInvoice {
  return {
    id: 'inv-1',
    tenantId: TENANT_ID,
    companyId: companyId(COMPANY_ID),
    supplierId: 'sup-1',
    ledgerId: ledgerId(LEDGER_ID),
    invoiceNumber: 'INV-001',
    supplierRef: null,
    invoiceDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-14'),
    totalAmount: money(10000n, 'USD'),
    paidAmount: money(0n, 'USD'),
    status: 'DRAFT',
    invoiceType: 'STANDARD',
    description: 'Test invoice',
    poRef: null,
    receiptRef: null,
    paymentTermsId: null,
    journalId: null,
    originalInvoiceId: null,
    lines: [makeApInvoiceLine()],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function mockOutboxWriter(): IOutboxWriter & { events: OutboxEvent[] } {
  const events: OutboxEvent[] = [];
  return {
    events,
    async write(event: OutboxEvent) {
      events.push(event);
    },
  };
}

function mockApInvoiceRepo(invoices: ApInvoice[] = [makeApInvoice()]): IApInvoiceRepo {
  let store = [...invoices];
  return {
    async create(input: CreateApInvoiceInput) {
      const inv = makeApInvoice({
        id: `inv-${Date.now()}`,
        tenantId: input.tenantId,
        status: 'DRAFT',
      });
      store.push(inv);
      return ok(inv);
    },
    async findById(id: string) {
      const inv = store.find((i) => i.id === id);
      return inv ? ok(inv) : err(new NotFoundError('ApInvoice', id));
    },
    async findBySupplier() {
      return { data: store, total: store.length, page: 1, limit: 20 };
    },
    async findByStatus(status) {
      return {
        data: store.filter((i) => i.status === status),
        total: store.length,
        page: 1,
        limit: 20,
      };
    },
    async findAll() {
      return { data: store, total: store.length, page: 1, limit: 20 };
    },
    async findUnpaid() {
      return store.filter((i) => i.status !== 'PAID');
    },
    async updateStatus(id, status) {
      const inv = store.find((i) => i.id === id);
      if (!inv) return err(new NotFoundError('ApInvoice', id));
      const updated = { ...inv, status } as ApInvoice;
      store = store.map((i) => (i.id === id ? updated : i));
      return ok(updated);
    },
    async recordPayment() {
      return ok(makeApInvoice());
    },
    async recordPaymentWithTrace() {
      return ok({ invoice: makeApInvoice(), trace: {} as any });
    },
  };
}

function mockIdempotencyStore(alreadyClaimed = false): IIdempotencyStore & { claims: string[] } {
  const claims: string[] = [];
  return {
    claims,
    async claimOrGet(input: IdempotencyClaimInput): Promise<IdempotencyResult> {
      if (alreadyClaimed) return { claimed: false };
      claims.push(`${input.commandType}:${input.key}`);
      return { claimed: true };
    },
    async recordOutcome() { },
  };
}

function mockTriageAssignmentRepo(): ITriageAssignmentRepo & { assignments: TriageAssignment[] } {
  const assignments: TriageAssignment[] = [];
  return {
    assignments,
    async assign(input) {
      const a: TriageAssignment = {
        invoiceId: input.invoiceId,
        assignedTo: input.assignedTo,
        assignedBy: input.assignedBy,
        reason: input.reason,
        assignedAt: new Date(),
      };
      assignments.push(a);
      return a;
    },
    async findByInvoiceId(invoiceId) {
      return assignments.find((a) => a.invoiceId === invoiceId) ?? null;
    },
    async findByAssignee(_tenantId, assignedTo) {
      return assignments.filter((a) => a.assignedTo === assignedTo);
    },
    async unassign(invoiceId) {
      const idx = assignments.findIndex((a) => a.invoiceId === invoiceId);
      if (idx >= 0) assignments.splice(idx, 1);
    },
  };
}

// ─── B2: Triage Queue ───────────────────────────────────────────────────────

describe('B2: Triage Queue', () => {
  it('markInvoiceIncomplete moves DRAFT invoice to INCOMPLETE', async () => {
    const inv = makeApInvoice({ id: 'inv-1', status: 'DRAFT' });
    const outbox = mockOutboxWriter();
    const repo = mockApInvoiceRepo([inv]);

    const result = await markInvoiceIncomplete(
      { tenantId: TENANT_ID, userId: USER_ID, invoiceId: 'inv-1', reason: 'Missing PO reference' },
      { apInvoiceRepo: repo, outboxWriter: outbox }
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe('INCOMPLETE');
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe('AP_INVOICE_MARKED_INCOMPLETE');
  });

  it('rejects marking POSTED invoice as incomplete', async () => {
    const inv = makeApInvoice({ id: 'inv-1', status: 'POSTED' });
    const result = await markInvoiceIncomplete(
      { tenantId: TENANT_ID, userId: USER_ID, invoiceId: 'inv-1', reason: 'Test' },
      { apInvoiceRepo: mockApInvoiceRepo([inv]), outboxWriter: mockOutboxWriter() }
    );
    expect(result.ok).toBe(false);
  });

  it('rejects empty reason', async () => {
    const inv = makeApInvoice({ id: 'inv-1', status: 'DRAFT' });
    const result = await markInvoiceIncomplete(
      { tenantId: TENANT_ID, userId: USER_ID, invoiceId: 'inv-1', reason: '   ' },
      { apInvoiceRepo: mockApInvoiceRepo([inv]), outboxWriter: mockOutboxWriter() }
    );
    expect(result.ok).toBe(false);
  });

  it('assignTriageInvoice assigns INCOMPLETE invoice', async () => {
    const inv = makeApInvoice({ id: 'inv-1', status: 'INCOMPLETE' });
    const outbox = mockOutboxWriter();
    const triageRepo = mockTriageAssignmentRepo();

    const result = await assignTriageInvoice(
      {
        tenantId: TENANT_ID,
        userId: USER_ID,
        invoiceId: 'inv-1',
        assignTo: 'clerk-1',
        reason: 'Fix PO',
      },
      {
        apInvoiceRepo: mockApInvoiceRepo([inv]),
        triageAssignmentRepo: triageRepo,
        outboxWriter: outbox,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assignedTo).toBe('clerk-1');
    }
    expect(outbox.events[0]!.eventType).toBe('AP_TRIAGE_ASSIGNED');
    expect(triageRepo.assignments).toHaveLength(1);
  });

  it('rejects assigning non-INCOMPLETE invoice', async () => {
    const inv = makeApInvoice({ id: 'inv-1', status: 'DRAFT' });
    const result = await assignTriageInvoice(
      {
        tenantId: TENANT_ID,
        userId: USER_ID,
        invoiceId: 'inv-1',
        assignTo: 'clerk-1',
        reason: null,
      },
      {
        apInvoiceRepo: mockApInvoiceRepo([inv]),
        triageAssignmentRepo: mockTriageAssignmentRepo(),
        outboxWriter: mockOutboxWriter(),
      }
    );
    expect(result.ok).toBe(false);
  });

  it('resolveTriageInvoice moves INCOMPLETE back to DRAFT', async () => {
    const inv = makeApInvoice({ id: 'inv-1', status: 'INCOMPLETE' });
    const outbox = mockOutboxWriter();
    const triageRepo = mockTriageAssignmentRepo();
    triageRepo.assignments.push({
      invoiceId: 'inv-1',
      assignedTo: 'clerk-1',
      assignedBy: USER_ID,
      reason: null,
      assignedAt: new Date(),
    });

    const result = await resolveTriageInvoice(
      { tenantId: TENANT_ID, userId: USER_ID, invoiceId: 'inv-1', targetStatus: 'DRAFT' },
      {
        apInvoiceRepo: mockApInvoiceRepo([inv]),
        triageAssignmentRepo: triageRepo,
        outboxWriter: outbox,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe('DRAFT');
    expect(outbox.events[0]!.eventType).toBe('AP_TRIAGE_RESOLVED');
    expect(triageRepo.assignments).toHaveLength(0);
  });

  it('listTriageQueue returns INCOMPLETE invoices', async () => {
    const inv1 = makeApInvoice({ id: 'inv-1', status: 'INCOMPLETE' });
    const inv2 = makeApInvoice({ id: 'inv-2', status: 'DRAFT' });
    const repo = mockApInvoiceRepo([inv1, inv2]);

    const result = await listTriageQueue({ tenantId: TENANT_ID }, { apInvoiceRepo: repo });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });
});

// ─── B3: OCR/Automation Pipeline ────────────────────────────────────────────
// B3 tests moved to ap-ocr-pipeline.test.ts (two-boundary rewrite with
// uploadOcrInvoice, checksum idempotency, state machine, and hybrid OCR).
// See also: ap-ocr-confidence.test.ts for confidence scorer tests.

// ─── F2: WHT Line Classification ────────────────────────────────────────────

describe('F2: WHT Line Classification', () => {
  it('ApInvoiceLine supports whtIncomeType field', () => {
    const line = makeApInvoiceLine({ whtIncomeType: 'ROYALTIES' });
    expect(line.whtIncomeType).toBe('ROYALTIES');
  });

  it('ApInvoiceLine defaults whtIncomeType to null', () => {
    const line = makeApInvoiceLine();
    expect(line.whtIncomeType).toBeNull();
  });

  it('ApInvoice contains lines with whtIncomeType', () => {
    const inv = makeApInvoice({
      lines: [
        makeApInvoiceLine({ id: 'l1', whtIncomeType: 'CONSULTING' }),
        makeApInvoiceLine({ id: 'l2', whtIncomeType: null }),
        makeApInvoiceLine({ id: 'l3', whtIncomeType: 'DIVIDENDS' }),
      ],
    });
    expect(inv.lines).toHaveLength(3);
    expect(inv.lines[0]!.whtIncomeType).toBe('CONSULTING');
    expect(inv.lines[1]!.whtIncomeType).toBeNull();
    expect(inv.lines[2]!.whtIncomeType).toBe('DIVIDENDS');
  });
});

// ─── K4: Tamper-Resistant Logging ───────────────────────────────────────────

describe('K4: Tamper-Resistant Logging', () => {
  it('computeContentHash produces deterministic SHA-256 hash', () => {
    const event = { tenantId: 't1', eventType: 'TEST', payload: { key: 'value' } };
    const h1 = computeContentHash(event, null);
    const h2 = computeContentHash(event, null);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  it('hash changes when previousHash changes', () => {
    const event = { tenantId: 't1', eventType: 'TEST', payload: { key: 'value' } };
    const h1 = computeContentHash(event, null);
    const h2 = computeContentHash(event, 'abc123');
    expect(h1).not.toBe(h2);
  });

  it('hash changes when payload changes', () => {
    const e1 = { tenantId: 't1', eventType: 'TEST', payload: { key: 'value1' } };
    const e2 = { tenantId: 't1', eventType: 'TEST', payload: { key: 'value2' } };
    expect(computeContentHash(e1, null)).not.toBe(computeContentHash(e2, null));
  });

  it('verifyOutboxChain verifies intact chain', async () => {
    const h1 = computeContentHash({ tenantId: 't1', eventType: 'A', payload: { n: 1 } }, null);
    const h2 = computeContentHash({ tenantId: 't1', eventType: 'B', payload: { n: 2 } }, h1);

    const entries: HashedOutboxEntry[] = [
      {
        id: 'e1',
        eventType: 'A',
        createdAt: new Date(),
        payload: { n: 1 },
        previousHash: null,
        contentHash: h1,
      },
      {
        id: 'e2',
        eventType: 'B',
        createdAt: new Date(),
        payload: { n: 2 },
        previousHash: h1,
        contentHash: h2,
      },
    ];

    const store: IHashedOutboxStore = {
      async writeHashed() {
        return entries[0]!;
      },
      async findLatest() {
        return entries[entries.length - 1]!;
      },
      async findRange() {
        return entries;
      },
      async findAll() {
        return entries;
      },
    };

    const result = await verifyOutboxChain('t1', { hashedOutboxStore: store });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.verified).toBe(true);
      expect(result.value.totalEntries).toBe(2);
      expect(result.value.firstBrokenIndex).toBeNull();
    }
  });

  it('verifyOutboxChain detects tampered entry', async () => {
    const h1 = computeContentHash({ tenantId: 't1', eventType: 'A', payload: { n: 1 } }, null);

    const entries: HashedOutboxEntry[] = [
      {
        id: 'e1',
        eventType: 'A',
        createdAt: new Date(),
        payload: { n: 1 },
        previousHash: null,
        contentHash: h1,
      },
      {
        id: 'e2',
        eventType: 'B',
        createdAt: new Date(),
        payload: { n: 2 },
        previousHash: 'WRONG_HASH',
        contentHash: 'fake',
      },
    ];

    const store: IHashedOutboxStore = {
      async writeHashed() {
        return entries[0]!;
      },
      async findLatest() {
        return entries[entries.length - 1]!;
      },
      async findRange() {
        return entries;
      },
      async findAll() {
        return entries;
      },
    };

    const result = await verifyOutboxChain('t1', { hashedOutboxStore: store });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.verified).toBe(false);
      expect(result.value.firstBrokenIndex).toBe(1);
      expect(result.value.firstBrokenId).toBe('e2');
    }
  });

  it('verifyOutboxChain handles empty chain', async () => {
    const store: IHashedOutboxStore = {
      async writeHashed() {
        return {} as any;
      },
      async findLatest() {
        return null;
      },
      async findRange() {
        return [];
      },
      async findAll() {
        return [];
      },
    };

    const result = await verifyOutboxChain('t1', { hashedOutboxStore: store });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.verified).toBe(true);
      expect(result.value.totalEntries).toBe(0);
    }
  });

  it('TamperResistantOutboxWriter chains hashes correctly', async () => {
    const written: HashedOutboxEntry[] = [];
    const store: IHashedOutboxStore = {
      async writeHashed(event, contentHash, previousHash) {
        const entry: HashedOutboxEntry = {
          id: `e-${written.length + 1}`,
          eventType: event.eventType,
          createdAt: new Date(),
          payload: event.payload,
          previousHash,
          contentHash,
        };
        written.push(entry);
        return entry;
      },
      async findLatest(_tenantId) {
        return written[written.length - 1] ?? null;
      },
      async findRange() {
        return written;
      },
      async findAll() {
        return written;
      },
    };

    const writer = new TamperResistantOutboxWriter(store);
    await writer.write({ tenantId: 't1', eventType: 'EVT_A', payload: { x: 1 } });
    await writer.write({ tenantId: 't1', eventType: 'EVT_B', payload: { x: 2 } });

    expect(written).toHaveLength(2);
    expect(written[0]!.previousHash).toBeNull();
    expect(written[1]!.previousHash).toBe(written[0]!.contentHash);
  });
});

// ─── Idempotency Sweep ─────────────────────────────────────────────────────

describe('Idempotency Sweep', () => {
  describe('approveApInvoice', () => {
    it('blocks duplicate approval via idempotency store', async () => {
      const inv = makeApInvoice({ id: 'inv-1', status: 'DRAFT' });
      const idempotencyStore = mockIdempotencyStore(true);
      const result = await approveApInvoice(
        { tenantId: TENANT_ID, userId: USER_ID, invoiceId: 'inv-1', correlationId: 'corr-1' },
        {
          apInvoiceRepo: mockApInvoiceRepo([inv]),
          outboxWriter: mockOutboxWriter(),
          idempotencyStore,
        }
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toContain('already processed');
    });

    it('allows approval without idempotency store (backward compat)', async () => {
      const inv = makeApInvoice({ id: 'inv-1', status: 'DRAFT' });
      const result = await approveApInvoice(
        { tenantId: TENANT_ID, userId: USER_ID, invoiceId: 'inv-1' },
        { apInvoiceRepo: mockApInvoiceRepo([inv]), outboxWriter: mockOutboxWriter() }
      );
      expect(result.ok).toBe(true);
    });
  });

  describe('cancelApInvoice', () => {
    it('blocks duplicate cancellation via idempotency store', async () => {
      const inv = makeApInvoice({ id: 'inv-1', status: 'DRAFT' });
      const idempotencyStore = mockIdempotencyStore(true);
      const result = await cancelApInvoice(
        {
          tenantId: TENANT_ID,
          userId: USER_ID,
          invoiceId: 'inv-1',
          reason: 'Test',
          correlationId: 'corr-1',
        },
        {
          apInvoiceRepo: mockApInvoiceRepo([inv]),
          outboxWriter: mockOutboxWriter(),
          idempotencyStore,
        }
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toContain('already processed');
    });

    it('allows cancellation without idempotency store', async () => {
      const inv = makeApInvoice({ id: 'inv-1', status: 'DRAFT' });
      const result = await cancelApInvoice(
        { tenantId: TENANT_ID, userId: USER_ID, invoiceId: 'inv-1', reason: 'Test' },
        { apInvoiceRepo: mockApInvoiceRepo([inv]), outboxWriter: mockOutboxWriter() }
      );
      expect(result.ok).toBe(true);
    });
  });

  describe('createCreditMemo', () => {
    it('blocks duplicate credit memo via idempotency store', async () => {
      const inv = makeApInvoice({ id: 'inv-1', status: 'POSTED' });
      const idempotencyStore = mockIdempotencyStore(true);
      const result = await createCreditMemo(
        { tenantId: TENANT_ID, userId: USER_ID, originalInvoiceId: 'inv-1', reason: 'Dup test' },
        {
          apInvoiceRepo: mockApInvoiceRepo([inv]),
          outboxWriter: mockOutboxWriter(),
          idempotencyStore,
        }
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toContain('already processed');
    });
  });

  describe('batchInvoiceImport', () => {
    it('blocks duplicate batch import via idempotency store', async () => {
      const idempotencyStore = mockIdempotencyStore(true);
      const result = await batchInvoiceImport(
        {
          tenantId: TENANT_ID,
          userId: USER_ID,
          correlationId: 'batch-1',
          rows: [
            {
              companyId: COMPANY_ID,
              supplierId: 'sup-1',
              ledgerId: LEDGER_ID,
              invoiceNumber: 'INV-1',
              supplierRef: null,
              invoiceDate: '2025-01-15',
              dueDate: '2025-02-14',
              currencyCode: 'USD',
              description: null,
              poRef: null,
              receiptRef: null,
              paymentTermsId: null,
              lines: [
                {
                  accountId: 'acc-1',
                  description: null,
                  quantity: 1,
                  unitPrice: 1000n,
                  amount: 1000n,
                  taxAmount: 0n,
                },
              ],
            },
          ],
        },
        { apInvoiceRepo: mockApInvoiceRepo([]), outboxWriter: mockOutboxWriter(), idempotencyStore }
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toContain('already processed');
    });
  });

  describe('applyPrepayment', () => {
    it('blocks duplicate prepayment application via idempotency store', async () => {
      const idempotencyStore = mockIdempotencyStore(true);
      const result = await applyPrepayment(
        {
          tenantId: TENANT_ID,
          userId: USER_ID,
          prepaymentId: 'pp-1',
          targetInvoiceId: 'inv-1',
          amount: 5000n,
        },
        {
          prepaymentRepo: {
            findById: async () =>
              ok({ id: 'pp-1', status: 'OPEN', unappliedBalance: money(20000n, 'USD') } as any),
          } as any,
          apInvoiceRepo: mockApInvoiceRepo([makeApInvoice({ status: 'POSTED' })]),
          outboxWriter: mockOutboxWriter(),
          idempotencyStore,
        }
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toContain('already processed');
    });
  });

  describe('processBankRejection', () => {
    it('blocks duplicate bank rejection via idempotency store', async () => {
      const idempotencyStore = mockIdempotencyStore(true);
      const result = await processBankRejection(
        {
          tenantId: TENANT_ID,
          userId: USER_ID,
          paymentRunId: 'pr-1',
          rejectionCode: 'AC04',
          rejectionReason: 'Closed account',
        },
        {
          apPaymentRunRepo: {
            findById: async () => ok({ id: 'pr-1', status: 'EXECUTED', items: [] } as any),
          } as any,
          apInvoiceRepo: mockApInvoiceRepo([]),
          outboxWriter: mockOutboxWriter(),
          idempotencyStore,
        }
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toContain('already processed');
    });
  });
});
