import { describe, it, expect } from 'vitest';
import { money, ok, err, AppError } from '@afenda/core';
import type { ApInvoice } from '../slices/ap/entities/ap-invoice.js';
import type { PaymentRun } from '../slices/ap/entities/payment-run.js';
import { createCreditMemo } from '../slices/ap/services/create-credit-memo.js';
import { batchInvoiceImport } from '../slices/ap/services/batch-invoice-import.js';
import { processBankRejection } from '../slices/ap/services/process-bank-rejection.js';
import { generateRemittanceAdvice } from '../slices/ap/services/generate-remittance-advice.js';
import { applyPrepayment } from '../slices/ap/services/apply-prepayment.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeApInvoice(overrides: Partial<ApInvoice> = {}): ApInvoice {
  return {
    id: 'inv-1',
    tenantId: 't-1',
    companyId: 'c-1' as ApInvoice['companyId'],
    supplierId: 's-1',
    ledgerId: 'l-1' as ApInvoice['ledgerId'],
    invoiceNumber: 'INV-001',
    supplierRef: null,
    invoiceDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-14'),
    totalAmount: money(10000n, 'USD'),
    paidAmount: money(0n, 'USD'),
    status: 'POSTED',
    invoiceType: 'STANDARD',
    description: null,
    poRef: null,
    receiptRef: null,
    paymentTermsId: null,
    journalId: null,
    originalInvoiceId: null,
    lines: [
      {
        id: 'line-1',
        invoiceId: 'inv-1',
        lineNumber: 1,
        accountId: 'acc-1',
        description: 'Widget',
        quantity: 10,
        unitPrice: money(1000n, 'USD'),
        amount: money(10000n, 'USD'),
        taxAmount: money(0n, 'USD'),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makePaymentRun(overrides: Partial<PaymentRun> = {}): PaymentRun {
  return {
    id: 'pr-1',
    tenantId: 't-1',
    companyId: 'c-1',
    runNumber: 'PR-001',
    runDate: new Date('2025-02-14'),
    cutoffDate: new Date('2025-02-28'),
    currencyCode: 'USD',
    totalAmount: money(25000n, 'USD'),
    status: 'EXECUTED',
    executedAt: new Date('2025-02-14'),
    executedBy: 'u-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'item-1',
        paymentRunId: 'pr-1',
        invoiceId: 'inv-1',
        supplierId: 's-1',
        amount: money(10000n, 'USD'),
        discountAmount: money(200n, 'USD'),
        netAmount: money(9800n, 'USD'),
        journalId: null,
      },
      {
        id: 'item-2',
        paymentRunId: 'pr-1',
        invoiceId: 'inv-2',
        supplierId: 's-2',
        amount: money(15000n, 'USD'),
        discountAmount: money(0n, 'USD'),
        netAmount: money(15000n, 'USD'),
        journalId: null,
      },
    ],
    ...overrides,
  };
}

// ─── W4-1: Credit Memo ───────────────────────────────────────────────────

describe('createCreditMemo', () => {
  it('creates credit memo from posted invoice', async () => {
    const original = makeApInvoice({ id: 'inv-orig', status: 'POSTED' });
    let createdInput: any = null;

    const result = await createCreditMemo(
      { tenantId: 't-1', userId: 'u-1', originalInvoiceId: 'inv-orig', reason: 'Overcharge' },
      {
        apInvoiceRepo: {
          findById: async () => ok(original),
          create: async (input: any) => {
            createdInput = input;
            return ok(
              makeApInvoice({
                id: 'cm-1',
                invoiceNumber: `CM-${original.invoiceNumber}`,
                invoiceType: 'CREDIT_MEMO',
              })
            );
          },
        } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(true);
    expect(createdInput.invoiceNumber).toBe('CM-INV-001');
    expect(createdInput.lines[0].amount).toBe(10000n);
  });

  it('rejects credit memo for CANCELLED invoice', async () => {
    const result = await createCreditMemo(
      { tenantId: 't-1', userId: 'u-1', originalInvoiceId: 'inv-1', reason: 'Test' },
      {
        apInvoiceRepo: {
          findById: async () => ok(makeApInvoice({ status: 'CANCELLED' })),
        } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(false);
  });

  it('rejects credit memo against another credit memo', async () => {
    const result = await createCreditMemo(
      { tenantId: 't-1', userId: 'u-1', originalInvoiceId: 'inv-1', reason: 'Test' },
      {
        apInvoiceRepo: {
          findById: async () => ok(makeApInvoice({ invoiceType: 'CREDIT_MEMO' })),
        } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(false);
  });

  it('propagates not found error', async () => {
    const result = await createCreditMemo(
      { tenantId: 't-1', userId: 'u-1', originalInvoiceId: 'inv-999', reason: 'Test' },
      {
        apInvoiceRepo: {
          findById: async () => err(new AppError('NOT_FOUND', 'not found')),
        } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(false);
  });
});

// ─── W4-2: Apply Prepayment ─────────────────────────────────────────────

describe('applyPrepayment', () => {
  it('applies prepayment against target invoice', async () => {
    const prepayment = {
      id: 'pp-1',
      tenantId: 't-1',
      invoiceId: 'pp-inv',
      supplierId: 's-1',
      totalAmount: money(20000n, 'USD'),
      appliedAmount: money(0n, 'USD'),
      unappliedBalance: money(20000n, 'USD'),
      status: 'OPEN' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      applications: [],
    };
    const invoice = makeApInvoice({ id: 'inv-target', status: 'POSTED' });

    const result = await applyPrepayment(
      {
        tenantId: 't-1',
        userId: 'u-1',
        prepaymentId: 'pp-1',
        targetInvoiceId: 'inv-target',
        amount: 5000n,
      },
      {
        prepaymentRepo: {
          findById: async () => ok(prepayment),
          applyToInvoice: async () =>
            ok({
              id: 'app-1',
              prepaymentId: 'pp-1',
              targetInvoiceId: 'inv-target',
              amount: money(5000n, 'USD'),
              appliedAt: new Date(),
              appliedBy: 'u-1',
            }),
        } as any,
        apInvoiceRepo: {
          findById: async () => ok(invoice),
          recordPayment: async () =>
            ok(makeApInvoice({ paidAmount: money(5000n, 'USD'), status: 'PARTIALLY_PAID' })),
        } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(true);
  });

  it('rejects when amount exceeds unapplied balance', async () => {
    const prepayment = {
      id: 'pp-1',
      tenantId: 't-1',
      invoiceId: 'pp-inv',
      supplierId: 's-1',
      totalAmount: money(5000n, 'USD'),
      appliedAmount: money(0n, 'USD'),
      unappliedBalance: money(5000n, 'USD'),
      status: 'OPEN' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      applications: [],
    };

    const result = await applyPrepayment(
      {
        tenantId: 't-1',
        userId: 'u-1',
        prepaymentId: 'pp-1',
        targetInvoiceId: 'inv-1',
        amount: 10000n,
      },
      {
        prepaymentRepo: { findById: async () => ok(prepayment) } as any,
        apInvoiceRepo: { findById: async () => ok(makeApInvoice()) } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(false);
  });

  it('rejects when prepayment is fully applied', async () => {
    const prepayment = {
      id: 'pp-1',
      tenantId: 't-1',
      invoiceId: 'pp-inv',
      supplierId: 's-1',
      totalAmount: money(5000n, 'USD'),
      appliedAmount: money(5000n, 'USD'),
      unappliedBalance: money(0n, 'USD'),
      status: 'FULLY_APPLIED' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      applications: [],
    };

    const result = await applyPrepayment(
      {
        tenantId: 't-1',
        userId: 'u-1',
        prepaymentId: 'pp-1',
        targetInvoiceId: 'inv-1',
        amount: 1000n,
      },
      {
        prepaymentRepo: { findById: async () => ok(prepayment) } as any,
        apInvoiceRepo: {} as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(false);
  });

  it('rejects when amount exceeds invoice outstanding', async () => {
    const prepayment = {
      id: 'pp-1',
      tenantId: 't-1',
      invoiceId: 'pp-inv',
      supplierId: 's-1',
      totalAmount: money(50000n, 'USD'),
      appliedAmount: money(0n, 'USD'),
      unappliedBalance: money(50000n, 'USD'),
      status: 'OPEN' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      applications: [],
    };
    const invoice = makeApInvoice({
      totalAmount: money(10000n, 'USD'),
      paidAmount: money(8000n, 'USD'),
    });

    const result = await applyPrepayment(
      {
        tenantId: 't-1',
        userId: 'u-1',
        prepaymentId: 'pp-1',
        targetInvoiceId: 'inv-1',
        amount: 5000n,
      },
      {
        prepaymentRepo: { findById: async () => ok(prepayment) } as any,
        apInvoiceRepo: { findById: async () => ok(invoice) } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(false);
  });
});

// ─── W4-3: Batch Invoice Import ─────────────────────────────────────────

describe('batchInvoiceImport', () => {
  it('imports valid rows and reports per-row results', async () => {
    let createCount = 0;

    const result = await batchInvoiceImport(
      {
        tenantId: 't-1',
        userId: 'u-1',
        rows: [
          {
            companyId: 'c-1',
            supplierId: 's-1',
            ledgerId: 'l-1',
            invoiceNumber: 'IMP-001',
            supplierRef: null,
            invoiceDate: '2025-02-01',
            dueDate: '2025-03-01',
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
                unitPrice: 5000n,
                amount: 5000n,
                taxAmount: 0n,
              },
            ],
          },
          {
            companyId: 'c-1',
            supplierId: 's-2',
            ledgerId: 'l-1',
            invoiceNumber: 'IMP-002',
            supplierRef: null,
            invoiceDate: '2025-02-01',
            dueDate: '2025-03-01',
            currencyCode: 'USD',
            description: null,
            poRef: null,
            receiptRef: null,
            paymentTermsId: null,
            lines: [
              {
                accountId: 'acc-2',
                description: null,
                quantity: 2,
                unitPrice: 3000n,
                amount: 6000n,
                taxAmount: 0n,
              },
            ],
          },
        ],
      },
      {
        apInvoiceRepo: {
          create: async () => {
            createCount++;
            return ok(makeApInvoice({ id: `imp-${createCount}` }));
          },
        } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.totalRows).toBe(2);
      expect(result.value.successCount).toBe(2);
      expect(result.value.errorCount).toBe(0);
      expect(result.value.results).toHaveLength(2);
      expect(result.value.results[0]!.success).toBe(true);
    }
  });

  it('reports errors per row without blocking other rows', async () => {
    let callCount = 0;

    const result = await batchInvoiceImport(
      {
        tenantId: 't-1',
        userId: 'u-1',
        rows: [
          {
            companyId: 'c-1',
            supplierId: 's-1',
            ledgerId: 'l-1',
            invoiceNumber: 'IMP-001',
            supplierRef: null,
            invoiceDate: '2025-02-01',
            dueDate: '2025-03-01',
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
                unitPrice: 5000n,
                amount: 5000n,
                taxAmount: 0n,
              },
            ],
          },
          {
            companyId: 'c-1',
            supplierId: 's-2',
            ledgerId: 'l-1',
            invoiceNumber: '',
            supplierRef: null,
            invoiceDate: '2025-02-01',
            dueDate: '2025-03-01',
            currencyCode: 'USD',
            description: null,
            poRef: null,
            receiptRef: null,
            paymentTermsId: null,
            lines: [
              {
                accountId: 'acc-2',
                description: null,
                quantity: 1,
                unitPrice: 3000n,
                amount: 3000n,
                taxAmount: 0n,
              },
            ],
          },
        ],
      },
      {
        apInvoiceRepo: {
          create: async () => {
            callCount++;
            return ok(makeApInvoice({ id: `imp-${callCount}` }));
          },
        } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.successCount).toBe(1);
      expect(result.value.errorCount).toBe(1);
      expect(result.value.results[1]!.success).toBe(false);
      expect(result.value.results[1]!.error).toContain('Missing invoice number');
    }
  });
});

// ─── W4-5: Bank Rejection ───────────────────────────────────────────────

describe('processBankRejection', () => {
  it('processes full rejection and reopens all invoices', async () => {
    const run = makePaymentRun();
    const reversedInvoices: string[] = [];

    const result = await processBankRejection(
      {
        tenantId: 't-1',
        userId: 'u-1',
        paymentRunId: 'pr-1',
        rejectionCode: 'AC04',
        rejectionReason: 'Closed account',
      },
      {
        apPaymentRunRepo: {
          findById: async () => ok(run),
          updateStatus: async () => ok({ ...run, status: 'CANCELLED' as const }),
        } as any,
        apInvoiceRepo: {
          recordPayment: async (id: string) => {
            reversedInvoices.push(id);
            return ok(makeApInvoice({ id }));
          },
        } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rejectedItemCount).toBe(2);
      expect(result.value.reopenedInvoiceIds).toEqual(['inv-1', 'inv-2']);
    }
    expect(reversedInvoices).toEqual(['inv-1', 'inv-2']);
  });

  it('processes partial rejection (specific items only)', async () => {
    const run = makePaymentRun();
    const reversedInvoices: string[] = [];

    const result = await processBankRejection(
      {
        tenantId: 't-1',
        userId: 'u-1',
        paymentRunId: 'pr-1',
        rejectionCode: 'AC04',
        rejectionReason: 'Closed account',
        rejectedItemIds: ['item-1'],
      },
      {
        apPaymentRunRepo: {
          findById: async () => ok(run),
        } as any,
        apInvoiceRepo: {
          recordPayment: async (id: string) => {
            reversedInvoices.push(id);
            return ok(makeApInvoice({ id }));
          },
        } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rejectedItemCount).toBe(1);
      expect(result.value.reopenedInvoiceIds).toEqual(['inv-1']);
    }
  });

  it('rejects when payment run is not EXECUTED', async () => {
    const run = makePaymentRun({ status: 'DRAFT' });

    const result = await processBankRejection(
      {
        tenantId: 't-1',
        userId: 'u-1',
        paymentRunId: 'pr-1',
        rejectionCode: 'AC04',
        rejectionReason: 'Test',
      },
      {
        apPaymentRunRepo: { findById: async () => ok(run) } as any,
        apInvoiceRepo: {} as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(false);
  });

  it('rejects when no matching items found', async () => {
    const run = makePaymentRun();

    const result = await processBankRejection(
      {
        tenantId: 't-1',
        userId: 'u-1',
        paymentRunId: 'pr-1',
        rejectionCode: 'AC04',
        rejectionReason: 'Test',
        rejectedItemIds: ['nonexistent-item'],
      },
      {
        apPaymentRunRepo: { findById: async () => ok(run) } as any,
        apInvoiceRepo: {} as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(false);
  });
});

// ─── W4-6: Remittance Advice ────────────────────────────────────────────

describe('generateRemittanceAdvice', () => {
  it('generates per-supplier remittance advice', async () => {
    const run = makePaymentRun();

    const result = await generateRemittanceAdvice(
      { tenantId: 't-1', userId: 'u-1', paymentRunId: 'pr-1' },
      {
        apPaymentRunRepo: { findById: async () => ok(run) } as any,
        supplierRepo: {
          findById: async (id: string) =>
            ok({ id, name: id === 's-1' ? 'Supplier A' : 'Supplier B' }),
        } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.suppliers).toHaveLength(2);
      expect(result.value.runNumber).toBe('PR-001');
      const s1 = result.value.suppliers.find((s) => s.supplierId === 's-1')!;
      expect(s1.items).toHaveLength(1);
      expect(s1.totalGross).toBe(10000n);
      expect(s1.totalNet).toBe(9800n);
    }
  });

  it('propagates not found error', async () => {
    const result = await generateRemittanceAdvice(
      { tenantId: 't-1', userId: 'u-1', paymentRunId: 'pr-999' },
      {
        apPaymentRunRepo: {
          findById: async () => err(new AppError('NOT_FOUND', 'not found')),
        } as any,
        supplierRepo: {} as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(false);
  });
});
