import { describe, it, expect } from 'vitest';
import { money, ok, err, AppError } from '@afenda/core';
import type { ApInvoice } from '../slices/ap/entities/ap-invoice.js';
import type { PaymentTerms } from '../slices/ap/entities/payment-terms.js';
import type { PaymentRun } from '../slices/ap/entities/payment-run.js';
import type { ApHold } from '../slices/ap/entities/ap-hold.js';
import {
  computePaymentProposal,
  type ProposableInvoice,
  type ProposableSupplier,
} from '../slices/ap/calculators/payment-proposal.js';
import { partialMatch, type MatchLine } from '../slices/ap/calculators/partial-match.js';
import { computeWhtReport, type WhtReportEntry } from '../slices/ap/calculators/wht-report.js';
import {
  resolveMatchTolerance,
  type MatchTolerance,
} from '../slices/ap/entities/match-tolerance.js';
import { computeApPeriodCloseChecklist } from '../slices/ap/services/ap-period-close-checklist.js';
import { getPaymentRunReport } from '../slices/ap/services/get-payment-run-report.js';
import { getInvoiceAuditTimeline } from '../slices/ap/services/get-invoice-audit-timeline.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeTerms(overrides?: Partial<PaymentTerms>): PaymentTerms {
  return {
    id: 'pt-1',
    tenantId: 't-1',
    code: 'NET30',
    name: 'Net 30',
    netDays: 30,
    discountPercent: 0,
    discountDays: 0,
    isActive: true,
    ...overrides,
  };
}

function makeProposableInvoice(overrides: Partial<ProposableInvoice> = {}): ProposableInvoice {
  return {
    id: 'inv-1',
    supplierId: 's-1',
    invoiceNumber: 'INV-001',
    invoiceDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-14'),
    totalAmount: 10000n,
    paidAmount: 0n,
    currencyCode: 'USD',
    paymentTermsId: null,
    ...overrides,
  };
}

function makeMatchLine(overrides: Partial<MatchLine> = {}): MatchLine {
  return {
    lineId: 'line-1',
    lineNumber: 1,
    description: 'Widget',
    quantity: 10,
    unitPrice: 100n,
    amount: 1000n,
    ...overrides,
  };
}

function makeApInvoice(
  overrides: Partial<ApInvoice> & {
    totalAmount: ApInvoice['totalAmount'];
    paidAmount: ApInvoice['paidAmount'];
  }
): ApInvoice {
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
    status: 'POSTED',
    description: null,
    poRef: null,
    receiptRef: null,
    paymentTermsId: null,
    journalId: null,
    lines: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── W3-1: Payment Proposal Calculator ────────────────────────────────────

describe('computePaymentProposal', () => {
  const suppliers = new Map<string, ProposableSupplier>([
    [
      's-1',
      {
        id: 's-1',
        name: 'Supplier A',
        currencyCode: 'USD',
        defaultPaymentMethod: 'BANK_TRANSFER',
        primaryBankAccountId: 'bank-1',
      },
    ],
    [
      's-2',
      {
        id: 's-2',
        name: 'Supplier B',
        currencyCode: 'USD',
        defaultPaymentMethod: 'WIRE',
        primaryBankAccountId: 'bank-2',
      },
    ],
  ]);
  const paymentTerms = new Map<string, PaymentTerms>([
    ['pt-disc', makeTerms({ id: 'pt-disc', discountPercent: 2, discountDays: 10 })],
  ]);

  it('selects invoices due before cutoff', () => {
    const invoices = [
      makeProposableInvoice({ id: 'i1', dueDate: new Date('2025-02-14') }),
      makeProposableInvoice({ id: 'i2', dueDate: new Date('2025-03-15') }),
    ];

    const proposal = computePaymentProposal({
      invoices,
      suppliers,
      paymentTerms,
      paymentDate: new Date('2025-02-14'),
      cutoffDate: new Date('2025-02-28'),
    });

    expect(proposal.summary.totalInvoices).toBe(1);
    expect(proposal.groups).toHaveLength(1);
    expect(proposal.groups[0]!.items[0]!.invoiceId).toBe('i1');
  });

  it('excludes fully paid invoices', () => {
    const invoices = [makeProposableInvoice({ id: 'i1', totalAmount: 10000n, paidAmount: 10000n })];

    const proposal = computePaymentProposal({
      invoices,
      suppliers,
      paymentTerms,
      paymentDate: new Date('2025-02-14'),
      cutoffDate: new Date('2025-02-28'),
    });

    expect(proposal.summary.totalInvoices).toBe(0);
  });

  it('groups by supplier + method + bank + currency', () => {
    const invoices = [
      makeProposableInvoice({ id: 'i1', supplierId: 's-1', dueDate: new Date('2025-02-10') }),
      makeProposableInvoice({ id: 'i2', supplierId: 's-1', dueDate: new Date('2025-02-12') }),
      makeProposableInvoice({ id: 'i3', supplierId: 's-2', dueDate: new Date('2025-02-13') }),
    ];

    const proposal = computePaymentProposal({
      invoices,
      suppliers,
      paymentTerms,
      paymentDate: new Date('2025-02-14'),
      cutoffDate: new Date('2025-02-28'),
    });

    expect(proposal.summary.totalGroups).toBe(2);
    const s1Group = proposal.groups.find((g) => g.supplierId === 's-1');
    expect(s1Group!.items).toHaveLength(2);
    expect(s1Group!.paymentMethod).toBe('BANK_TRANSFER');
  });

  it('applies supplier filter', () => {
    const invoices = [
      makeProposableInvoice({ id: 'i1', supplierId: 's-1', dueDate: new Date('2025-02-10') }),
      makeProposableInvoice({ id: 'i2', supplierId: 's-2', dueDate: new Date('2025-02-10') }),
    ];

    const proposal = computePaymentProposal({
      invoices,
      suppliers,
      paymentTerms,
      paymentDate: new Date('2025-02-14'),
      cutoffDate: new Date('2025-02-28'),
      supplierFilter: ['s-1'],
    });

    expect(proposal.summary.totalInvoices).toBe(1);
    expect(proposal.groups[0]!.supplierId).toBe('s-1');
  });

  it('includes discount opportunities when enabled', () => {
    const invoices = [
      makeProposableInvoice({
        id: 'i1',
        invoiceDate: new Date('2025-02-01'),
        dueDate: new Date('2025-03-03'),
        paymentTermsId: 'pt-disc',
      }),
    ];

    const proposal = computePaymentProposal({
      invoices,
      suppliers,
      paymentTerms,
      paymentDate: new Date('2025-02-08'),
      cutoffDate: new Date('2025-02-15'),
      includeDiscountOpportunities: true,
    });

    expect(proposal.summary.totalInvoices).toBe(1);
    expect(proposal.groups[0]!.items[0]!.selectionReason).toBe('DISCOUNT_OPPORTUNITY');
    expect(proposal.summary.discountOpportunityCount).toBe(1);
  });

  it('is deterministic — same inputs produce same output', () => {
    const invoices = [
      makeProposableInvoice({ id: 'i2', supplierId: 's-2', dueDate: new Date('2025-02-10') }),
      makeProposableInvoice({ id: 'i1', supplierId: 's-1', dueDate: new Date('2025-02-12') }),
    ];

    const p1 = computePaymentProposal({
      invoices,
      suppliers,
      paymentTerms,
      paymentDate: new Date('2025-02-14'),
      cutoffDate: new Date('2025-02-28'),
    });
    const p2 = computePaymentProposal({
      invoices: [...invoices].reverse(),
      suppliers,
      paymentTerms,
      paymentDate: new Date('2025-02-14'),
      cutoffDate: new Date('2025-02-28'),
    });

    expect(p1.groups.map((g) => g.groupKey)).toEqual(p2.groups.map((g) => g.groupKey));
    expect(p1.summary.totalNet).toEqual(p2.summary.totalNet);
  });

  it('computes outstanding as totalAmount - paidAmount', () => {
    const invoices = [
      makeProposableInvoice({
        id: 'i1',
        totalAmount: 10000n,
        paidAmount: 3000n,
        dueDate: new Date('2025-02-10'),
      }),
    ];

    const proposal = computePaymentProposal({
      invoices,
      suppliers,
      paymentTerms,
      paymentDate: new Date('2025-02-14'),
      cutoffDate: new Date('2025-02-28'),
    });

    expect(proposal.groups[0]!.items[0]!.outstandingAmount).toBe(7000n);
    expect(proposal.summary.totalGross).toBe(7000n);
  });
});

// ─── W3-7: Partial Match Calculator ──────────────────────────────────────

describe('partialMatch', () => {
  it('returns FULLY_MATCHED when all lines match exactly', () => {
    const po = [
      makeMatchLine({ lineNumber: 1, amount: 1000n }),
      makeMatchLine({ lineNumber: 2, amount: 2000n }),
    ];
    const receipt = [
      makeMatchLine({ lineNumber: 1, amount: 1000n }),
      makeMatchLine({ lineNumber: 2, amount: 2000n }),
    ];
    const invoice = [
      makeMatchLine({ lineNumber: 1, amount: 1000n }),
      makeMatchLine({ lineNumber: 2, amount: 2000n }),
    ];

    const result = partialMatch({
      poLines: po,
      receiptLines: receipt,
      invoiceLines: invoice,
      toleranceBps: 100,
    });

    expect(result.overallStatus).toBe('FULLY_MATCHED');
    expect(result.matchedCount).toBe(2);
    expect(result.totalVariance).toBe(0n);
  });

  it('returns PARTIALLY_MATCHED when some lines match', () => {
    const po = [
      makeMatchLine({ lineNumber: 1, amount: 1000n }),
      makeMatchLine({ lineNumber: 2, amount: 2000n }),
    ];
    const receipt = [
      makeMatchLine({ lineNumber: 1, amount: 1000n }),
      makeMatchLine({ lineNumber: 2, amount: 2000n }),
    ];
    const invoice = [
      makeMatchLine({ lineNumber: 1, amount: 1000n }),
      makeMatchLine({ lineNumber: 2, amount: 5000n }),
    ];

    const result = partialMatch({
      poLines: po,
      receiptLines: receipt,
      invoiceLines: invoice,
      toleranceBps: 100,
    });

    expect(result.overallStatus).toBe('PARTIALLY_MATCHED');
    expect(result.matchedCount).toBe(1);
    expect(result.mismatchCount).toBe(1);
  });

  it('detects QUANTITY_MISMATCH per line', () => {
    const po = [makeMatchLine({ lineNumber: 1, quantity: 10, amount: 1000n })];
    const receipt = [makeMatchLine({ lineNumber: 1, quantity: 8, amount: 800n })];
    const invoice = [makeMatchLine({ lineNumber: 1, amount: 800n })];

    const result = partialMatch({
      poLines: po,
      receiptLines: receipt,
      invoiceLines: invoice,
      toleranceBps: 100,
    });

    expect(result.lines[0]!.status).toBe('QUANTITY_MISMATCH');
  });

  it('detects WITHIN_TOLERANCE for small variance', () => {
    const po = [makeMatchLine({ lineNumber: 1, amount: 10000n })];
    const receipt = [makeMatchLine({ lineNumber: 1, amount: 10000n })];
    const invoice = [makeMatchLine({ lineNumber: 1, amount: 10050n })];

    const result = partialMatch({
      poLines: po,
      receiptLines: receipt,
      invoiceLines: invoice,
      toleranceBps: 100,
    });

    expect(result.lines[0]!.status).toBe('WITHIN_TOLERANCE');
    expect(result.toleranceCount).toBe(1);
  });

  it('handles UNMATCHED_INVOICE for invoice-only lines', () => {
    const po: MatchLine[] = [];
    const receipt: MatchLine[] = [];
    const invoice = [makeMatchLine({ lineNumber: 3, amount: 5000n })];

    const result = partialMatch({
      poLines: po,
      receiptLines: receipt,
      invoiceLines: invoice,
      toleranceBps: 100,
    });

    expect(result.lines[0]!.status).toBe('UNMATCHED_INVOICE');
    expect(result.unmatchedCount).toBe(1);
  });

  it('handles UNMATCHED_PO for PO-only lines', () => {
    const po = [makeMatchLine({ lineNumber: 5, amount: 3000n })];
    const receipt: MatchLine[] = [];
    const invoice: MatchLine[] = [];

    const result = partialMatch({
      poLines: po,
      receiptLines: receipt,
      invoiceLines: invoice,
      toleranceBps: 100,
    });

    expect(result.lines[0]!.status).toBe('UNMATCHED_PO');
  });

  it('returns correct totals', () => {
    const po = [
      makeMatchLine({ lineNumber: 1, amount: 1000n }),
      makeMatchLine({ lineNumber: 2, amount: 2000n }),
    ];
    const receipt = [
      makeMatchLine({ lineNumber: 1, amount: 1000n }),
      makeMatchLine({ lineNumber: 2, amount: 2000n }),
    ];
    const invoice = [
      makeMatchLine({ lineNumber: 1, amount: 1000n }),
      makeMatchLine({ lineNumber: 2, amount: 2100n }),
    ];

    const result = partialMatch({
      poLines: po,
      receiptLines: receipt,
      invoiceLines: invoice,
      toleranceBps: 100,
    });

    expect(result.totalPoAmount).toBe(3000n);
    expect(result.totalReceiptAmount).toBe(3000n);
    expect(result.totalInvoiceAmount).toBe(3100n);
    expect(result.totalVariance).toBe(100n);
  });
});

// ─── W3-5: WHT Report Calculator ─────────────────────────────────────────

describe('computeWhtReport', () => {
  it('aggregates by supplier and income type', () => {
    const entries: WhtReportEntry[] = [
      {
        supplierId: 's-1',
        supplierName: 'A',
        incomeType: 'SERVICE',
        countryCode: 'TH',
        payeeType: 'NON_RESIDENT',
        grossAmount: 100000n,
        whtAmount: 15000n,
        netPayable: 85000n,
        effectiveRate: 15,
        paymentRunId: 'pr-1',
        paymentDate: new Date('2025-02-01'),
      },
      {
        supplierId: 's-1',
        supplierName: 'A',
        incomeType: 'SERVICE',
        countryCode: 'TH',
        payeeType: 'NON_RESIDENT',
        grossAmount: 50000n,
        whtAmount: 7500n,
        netPayable: 42500n,
        effectiveRate: 15,
        paymentRunId: 'pr-2',
        paymentDate: new Date('2025-02-15'),
      },
      {
        supplierId: 's-2',
        supplierName: 'B',
        incomeType: 'ROYALTY',
        countryCode: 'SG',
        payeeType: 'NON_RESIDENT',
        grossAmount: 200000n,
        whtAmount: 20000n,
        netPayable: 180000n,
        effectiveRate: 10,
        paymentRunId: 'pr-1',
        paymentDate: new Date('2025-02-01'),
      },
    ];

    const report = computeWhtReport(entries, {
      from: new Date('2025-02-01'),
      to: new Date('2025-02-28'),
    });

    expect(report.rows).toHaveLength(2);
    const aRow = report.rows.find((r) => r.supplierId === 's-1')!;
    expect(aRow.transactionCount).toBe(2);
    expect(aRow.totalGross).toBe(150000n);
    expect(aRow.totalWht).toBe(22500n);
    expect(report.totals.transactionCount).toBe(3);
    expect(report.totals.totalWht).toBe(42500n);
  });

  it('returns empty for no entries', () => {
    const report = computeWhtReport([], {
      from: new Date('2025-01-01'),
      to: new Date('2025-01-31'),
    });
    expect(report.rows).toHaveLength(0);
    expect(report.totals.transactionCount).toBe(0);
  });
});

// ─── W3-8: Match Tolerance Resolution ─────────────────────────────────────

describe('resolveMatchTolerance', () => {
  const orgRule: MatchTolerance = {
    id: 'mt-org',
    tenantId: 't-1',
    scope: 'ORG',
    scopeEntityId: null,
    companyId: null,
    toleranceBps: 200,
    quantityTolerancePercent: 5,
    autoHold: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const companyRule: MatchTolerance = {
    id: 'mt-co',
    tenantId: 't-1',
    scope: 'COMPANY',
    scopeEntityId: 'c-1',
    companyId: 'c-1',
    toleranceBps: 100,
    quantityTolerancePercent: 3,
    autoHold: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const siteRule: MatchTolerance = {
    id: 'mt-site',
    tenantId: 't-1',
    scope: 'SITE',
    scopeEntityId: 'site-1',
    companyId: 'c-1',
    toleranceBps: 50,
    quantityTolerancePercent: 1,
    autoHold: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('returns site-level rule when site matches', () => {
    const result = resolveMatchTolerance([orgRule, companyRule, siteRule], {
      companyId: 'c-1',
      siteId: 'site-1',
    });
    expect(result!.id).toBe('mt-site');
    expect(result!.toleranceBps).toBe(50);
  });

  it('falls back to company-level when no site match', () => {
    const result = resolveMatchTolerance([orgRule, companyRule, siteRule], {
      companyId: 'c-1',
      siteId: 'site-99',
    });
    expect(result!.id).toBe('mt-co');
  });

  it('falls back to org-level when no company match', () => {
    const result = resolveMatchTolerance([orgRule, companyRule, siteRule], { companyId: 'c-99' });
    expect(result!.id).toBe('mt-org');
  });

  it('returns null when no active rules', () => {
    const inactive: MatchTolerance = { ...orgRule, isActive: false };
    const result = resolveMatchTolerance([inactive], {});
    expect(result).toBeNull();
  });

  it('skips inactive rules in hierarchy', () => {
    const inactiveSite: MatchTolerance = { ...siteRule, isActive: false };
    const result = resolveMatchTolerance([orgRule, companyRule, inactiveSite], {
      companyId: 'c-1',
      siteId: 'site-1',
    });
    expect(result!.id).toBe('mt-co');
  });
});

// ─── W3-2: AP Period Close Checklist ──────────────────────────────────────

describe('computeApPeriodCloseChecklist', () => {
  const makeHold = (overrides: Partial<ApHold> = {}): ApHold => ({
    id: 'h-1',
    tenantId: 't-1',
    invoiceId: 'inv-1',
    holdType: 'MANUAL',
    holdReason: 'Test',
    holdDate: new Date(),
    releaseDate: null,
    releasedBy: null,
    releaseReason: null,
    status: 'ACTIVE',
    createdBy: 'u-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  it('returns canClose=true when no blocking exceptions', async () => {
    const result = await computeApPeriodCloseChecklist(
      { tenantId: 't-1', userId: 'u-1' },
      {
        apInvoiceRepo: {
          findByStatus: async () => ({ data: [], total: 0 }),
        } as any,
        apHoldRepo: {
          findAll: async () => ({ data: [], total: 0 }),
        } as any,
        apPaymentRunRepo: {
          findAll: async () => ({ data: [], total: 0 }),
        } as any,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.canClose).toBe(true);
      expect(result.value.summary.totalBlockingCount).toBe(0);
    }
  });

  it('blocks close when active holds exist', async () => {
    const result = await computeApPeriodCloseChecklist(
      { tenantId: 't-1', userId: 'u-1' },
      {
        apInvoiceRepo: {
          findByStatus: async () => ({ data: [], total: 0 }),
        } as any,
        apHoldRepo: {
          findAll: async () => ({ data: [makeHold()], total: 1 }),
        } as any,
        apPaymentRunRepo: {
          findAll: async () => ({ data: [], total: 0 }),
        } as any,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.canClose).toBe(false);
      expect(result.value.summary.openHoldCount).toBe(1);
    }
  });

  it('blocks close when approved invoices not posted', async () => {
    const inv = makeApInvoice({
      status: 'APPROVED',
      totalAmount: money(10000n, 'USD'),
      paidAmount: money(0n, 'USD'),
    });

    const result = await computeApPeriodCloseChecklist(
      { tenantId: 't-1', userId: 'u-1' },
      {
        apInvoiceRepo: {
          findByStatus: async (status: string) =>
            status === 'APPROVED' ? { data: [inv], total: 1 } : { data: [], total: 0 },
        } as any,
        apHoldRepo: {
          findAll: async () => ({ data: [], total: 0 }),
        } as any,
        apPaymentRunRepo: {
          findAll: async () => ({ data: [], total: 0 }),
        } as any,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.canClose).toBe(false);
      expect(result.value.summary.unmatchedInvoiceCount).toBe(1);
    }
  });
});

// ─── W3-3: Payment Run Report ─────────────────────────────────────────────

describe('getPaymentRunReport', () => {
  it('generates per-supplier breakdown', async () => {
    const run: PaymentRun = {
      id: 'pr-1',
      tenantId: 't-1',
      companyId: 'c-1',
      runNumber: 'PR-001',
      runDate: new Date('2025-02-14'),
      cutoffDate: new Date('2025-02-28'),
      currencyCode: 'USD',
      totalAmount: money(30000n, 'USD'),
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
          supplierId: 's-1',
          amount: money(5000n, 'USD'),
          discountAmount: money(0n, 'USD'),
          netAmount: money(5000n, 'USD'),
          journalId: null,
        },
        {
          id: 'item-3',
          paymentRunId: 'pr-1',
          invoiceId: 'inv-3',
          supplierId: 's-2',
          amount: money(15000n, 'USD'),
          discountAmount: money(300n, 'USD'),
          netAmount: money(14700n, 'USD'),
          journalId: null,
        },
      ],
    };

    const result = await getPaymentRunReport(
      { tenantId: 't-1', paymentRunId: 'pr-1' },
      { apPaymentRunRepo: { findById: async () => ok(run) } as any }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.suppliers).toHaveLength(2);
      expect(result.value.summary.supplierCount).toBe(2);
      expect(result.value.summary.itemCount).toBe(3);
      const s1 = result.value.suppliers.find((s) => s.supplierId === 's-1')!;
      expect(s1.itemCount).toBe(2);
      expect(s1.totalGross).toBe(15000n);
    }
  });

  it('propagates not found error', async () => {
    const result = await getPaymentRunReport(
      { tenantId: 't-1', paymentRunId: 'pr-999' },
      {
        apPaymentRunRepo: {
          findById: async () => err(new AppError('NOT_FOUND', 'not found')),
        } as any,
      }
    );

    expect(result.ok).toBe(false);
  });
});

// ─── W3-6: Invoice Audit Timeline ────────────────────────────────────────

describe('getInvoiceAuditTimeline', () => {
  it('filters outbox events by invoice ID', async () => {
    const inv = makeApInvoice({
      id: 'inv-target',
      totalAmount: money(10000n, 'USD'),
      paidAmount: money(0n, 'USD'),
    });

    const entries = [
      {
        id: 'e-1',
        eventType: 'AP_INVOICE_APPROVED',
        createdAt: new Date('2025-02-01'),
        payload: { invoiceId: 'inv-target', userId: 'u-1' },
      },
      {
        id: 'e-2',
        eventType: 'AP_INVOICE_POSTED',
        createdAt: new Date('2025-02-02'),
        payload: { invoiceId: 'inv-target', journalId: 'j-1' },
      },
      {
        id: 'e-3',
        eventType: 'AP_INVOICE_APPROVED',
        createdAt: new Date('2025-02-01'),
        payload: { invoiceId: 'inv-other' },
      },
      {
        id: 'e-4',
        eventType: 'JOURNAL_POSTED',
        createdAt: new Date('2025-02-02'),
        payload: { journalId: 'j-1' },
      },
    ];

    const result = await getInvoiceAuditTimeline(
      { tenantId: 't-1', invoiceId: 'inv-target' },
      {
        apInvoiceRepo: { findById: async () => ok(inv) } as any,
        outboxWriter: { write: async () => {}, findRecent: async () => entries } as any,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.eventCount).toBe(2);
      expect(result.value.events[0]!.eventType).toBe('AP_INVOICE_APPROVED');
      expect(result.value.events[1]!.eventType).toBe('AP_INVOICE_POSTED');
    }
  });

  it('returns empty timeline when outbox has no findRecent', async () => {
    const inv = makeApInvoice({
      id: 'inv-1',
      totalAmount: money(10000n, 'USD'),
      paidAmount: money(0n, 'USD'),
    });

    const result = await getInvoiceAuditTimeline(
      { tenantId: 't-1', invoiceId: 'inv-1' },
      {
        apInvoiceRepo: { findById: async () => ok(inv) } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.eventCount).toBe(0);
    }
  });

  it('returns error when invoice not found', async () => {
    const result = await getInvoiceAuditTimeline(
      { tenantId: 't-1', invoiceId: 'inv-999' },
      {
        apInvoiceRepo: { findById: async () => err(new AppError('NOT_FOUND', 'not found')) } as any,
        outboxWriter: { write: async () => {} } as any,
      }
    );

    expect(result.ok).toBe(false);
  });
});
