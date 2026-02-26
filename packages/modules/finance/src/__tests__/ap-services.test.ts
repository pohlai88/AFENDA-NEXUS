import { describe, it, expect } from 'vitest';
import { postApInvoice } from '../slices/ap/services/post-ap-invoice.js';
import { executePaymentRun } from '../slices/ap/services/execute-payment-run.js';
import { createDebitMemo } from '../slices/ap/services/create-debit-memo.js';
import { getApAging } from '../slices/ap/services/get-ap-aging.js';
import { money } from '@afenda/core';
import {
  AP_IDS,
  makeApInvoice,
  makePaymentRun,
  makePaymentRunItem,
  mockApInvoiceRepo,
  mockApPaymentRunRepo,
  mockJournalRepo,
  mockOutboxWriter,
  mockDocumentNumberGenerator,
} from './helpers.js';

// ─── postApInvoice ─────────────────────────────────────────────────────────

describe('postApInvoice()', () => {
  it('posts an APPROVED invoice and creates GL journal', async () => {
    const invoice = makeApInvoice({ status: 'APPROVED' });
    const invoiceRepo = mockApInvoiceRepo(new Map([[AP_IDS.invoice, invoice]]));
    const journalRepo = mockJournalRepo();
    const outbox = mockOutboxWriter();
    const docGen = mockDocumentNumberGenerator();

    const result = await postApInvoice(
      {
        tenantId: 't1',
        userId: 'u1',
        invoiceId: AP_IDS.invoice,
        fiscalPeriodId: 'period-1',
        apAccountId: AP_IDS.apAccount,
      },
      {
        apInvoiceRepo: invoiceRepo,
        journalRepo,
        outboxWriter: outbox,
        documentNumberGenerator: docGen,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('POSTED');
      expect(result.value.journalId).toBeTruthy();
    }
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe('AP_INVOICE_POSTED');
  });

  it('rejects non-APPROVED invoice', async () => {
    const invoice = makeApInvoice({ status: 'DRAFT' });
    const invoiceRepo = mockApInvoiceRepo(new Map([[AP_IDS.invoice, invoice]]));

    const result = await postApInvoice(
      {
        tenantId: 't1',
        userId: 'u1',
        invoiceId: AP_IDS.invoice,
        fiscalPeriodId: 'period-1',
        apAccountId: AP_IDS.apAccount,
      },
      {
        apInvoiceRepo: invoiceRepo,
        journalRepo: mockJournalRepo(),
        outboxWriter: mockOutboxWriter(),
        documentNumberGenerator: mockDocumentNumberGenerator(),
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('APPROVED');
  });

  it('returns error for non-existent invoice', async () => {
    const result = await postApInvoice(
      {
        tenantId: 't1',
        userId: 'u1',
        invoiceId: 'non-existent',
        fiscalPeriodId: 'period-1',
        apAccountId: AP_IDS.apAccount,
      },
      {
        apInvoiceRepo: mockApInvoiceRepo(),
        journalRepo: mockJournalRepo(),
        outboxWriter: mockOutboxWriter(),
        documentNumberGenerator: mockDocumentNumberGenerator(),
      }
    );

    expect(result.ok).toBe(false);
  });
});

// ─── executePaymentRun ─────────────────────────────────────────────────────

describe('executePaymentRun()', () => {
  it('executes an APPROVED payment run and records payments', async () => {
    const invoice = makeApInvoice({ status: 'POSTED' });
    const invoiceRepo = mockApInvoiceRepo(new Map([[AP_IDS.invoice, invoice]]));

    const run = makePaymentRun({
      status: 'APPROVED',
      items: [makePaymentRunItem({ invoiceId: AP_IDS.invoice })],
    });
    const runRepo = mockApPaymentRunRepo(new Map([[AP_IDS.paymentRun, run]]));
    const outbox = mockOutboxWriter();

    const result = await executePaymentRun(
      { tenantId: 't1', userId: 'u1', paymentRunId: AP_IDS.paymentRun },
      { apPaymentRunRepo: runRepo, apInvoiceRepo: invoiceRepo, outboxWriter: outbox }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('EXECUTED');
      expect(result.value.executedBy).toBe('u1');
    }
    // Invoice should have payment recorded
    const updatedInvoice = invoiceRepo.invoices.get(AP_IDS.invoice);
    expect(updatedInvoice?.paidAmount.amount).toBe(10000n);
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe('AP_PAYMENT_RUN_EXECUTED');
  });

  it('rejects non-APPROVED payment run', async () => {
    const run = makePaymentRun({ status: 'DRAFT' });
    const runRepo = mockApPaymentRunRepo(new Map([[AP_IDS.paymentRun, run]]));

    const result = await executePaymentRun(
      { tenantId: 't1', userId: 'u1', paymentRunId: AP_IDS.paymentRun },
      {
        apPaymentRunRepo: runRepo,
        apInvoiceRepo: mockApInvoiceRepo(),
        outboxWriter: mockOutboxWriter(),
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('APPROVED');
  });

  it('rejects payment run with no items', async () => {
    const run = makePaymentRun({ status: 'APPROVED', items: [] });
    const runRepo = mockApPaymentRunRepo(new Map([[AP_IDS.paymentRun, run]]));

    const result = await executePaymentRun(
      { tenantId: 't1', userId: 'u1', paymentRunId: AP_IDS.paymentRun },
      {
        apPaymentRunRepo: runRepo,
        apInvoiceRepo: mockApInvoiceRepo(),
        outboxWriter: mockOutboxWriter(),
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('no items');
  });
});

// ─── createDebitMemo ───────────────────────────────────────────────────────

describe('createDebitMemo()', () => {
  it('creates a debit memo for a POSTED invoice', async () => {
    const invoice = makeApInvoice({ status: 'POSTED' });
    const invoiceRepo = mockApInvoiceRepo(new Map([[AP_IDS.invoice, invoice]]));
    const outbox = mockOutboxWriter();

    const result = await createDebitMemo(
      { tenantId: 't1', userId: 'u1', originalInvoiceId: AP_IDS.invoice, reason: 'Damaged goods' },
      { apInvoiceRepo: invoiceRepo, outboxWriter: outbox }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.invoiceNumber).toContain('DM-');
      expect(result.value.description).toContain('Damaged goods');
    }
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe('AP_DEBIT_MEMO_CREATED');
  });

  it('rejects debit memo for DRAFT invoice', async () => {
    const invoice = makeApInvoice({ status: 'DRAFT' });
    const invoiceRepo = mockApInvoiceRepo(new Map([[AP_IDS.invoice, invoice]]));

    const result = await createDebitMemo(
      { tenantId: 't1', userId: 'u1', originalInvoiceId: AP_IDS.invoice, reason: 'Test' },
      { apInvoiceRepo: invoiceRepo, outboxWriter: mockOutboxWriter() }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('DRAFT');
  });

  it('rejects debit memo for CANCELLED invoice', async () => {
    const invoice = makeApInvoice({ status: 'CANCELLED' });
    const invoiceRepo = mockApInvoiceRepo(new Map([[AP_IDS.invoice, invoice]]));

    const result = await createDebitMemo(
      { tenantId: 't1', userId: 'u1', originalInvoiceId: AP_IDS.invoice, reason: 'Test' },
      { apInvoiceRepo: invoiceRepo, outboxWriter: mockOutboxWriter() }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('CANCELLED');
  });
});

// ─── getApAging ────────────────────────────────────────────────────────────

describe('getApAging()', () => {
  it('returns aging report from unpaid invoices', async () => {
    const invoices = new Map([
      [
        AP_IDS.invoice,
        makeApInvoice({
          id: AP_IDS.invoice,
          supplierId: AP_IDS.supplier,
          status: 'POSTED',
          totalAmount: money(10000n, 'USD'),
          paidAmount: money(0n, 'USD'),
          dueDate: new Date('2025-03-01'),
        }),
      ],
      [
        AP_IDS.invoice2,
        makeApInvoice({
          id: AP_IDS.invoice2,
          supplierId: AP_IDS.supplier,
          status: 'PARTIALLY_PAID',
          totalAmount: money(20000n, 'USD'),
          paidAmount: money(5000n, 'USD'),
          dueDate: new Date('2025-01-15'),
        }),
      ],
    ]);
    const invoiceRepo = mockApInvoiceRepo(invoices);

    const result = await getApAging(
      { tenantId: 't1', asOfDate: new Date('2025-04-01') },
      { apInvoiceRepo: invoiceRepo }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rows.length).toBeGreaterThan(0);
      expect(result.value.totals.total).toBe(25000n);
    }
  });

  it('returns empty report when no unpaid invoices', async () => {
    const result = await getApAging({ tenantId: 't1' }, { apInvoiceRepo: mockApInvoiceRepo() });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rows).toHaveLength(0);
      expect(result.value.totals.total).toBe(0n);
    }
  });
});
