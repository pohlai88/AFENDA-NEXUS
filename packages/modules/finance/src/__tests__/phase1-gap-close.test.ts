import { describe, it, expect } from 'vitest';
import { reconcileSupplierStatement } from '../slices/ap/calculators/supplier-statement-recon.js';
import type {
  SupplierStatementLine,
  ApLedgerEntry,
} from '../slices/ap/calculators/supplier-statement-recon.js';
import { matchIcReceivables } from '../slices/ar/calculators/ic-receivable-matching.js';
import type { IcReceivable, IcPayable } from '../slices/ar/calculators/ic-receivable-matching.js';
import {
  computeInvoiceDiscounting,
  computeBatchDiscounting,
} from '../slices/ar/calculators/invoice-discounting.js';
import {
  computeRevenueRecognition,
  computeBatchRevenueRecognition,
} from '../slices/ar/calculators/revenue-recognition-hook.js';

// ─── AP-05: Supplier Statement Reconciliation ──────────────────────────────

describe('reconcileSupplierStatement', () => {
  const asOf = new Date('2025-04-15');

  it('matches statement lines to ledger entries by amount + date', () => {
    const statements: SupplierStatementLine[] = [
      {
        lineRef: 'SL-1',
        date: new Date('2025-03-01'),
        description: 'Invoice 001',
        amount: 50000n,
        currencyCode: 'USD',
      },
    ];
    const ledger: ApLedgerEntry[] = [
      {
        invoiceId: 'inv-1',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date('2025-03-01'),
        amount: 50000n,
        currencyCode: 'USD',
        supplierRef: 'SL-1',
      },
    ];

    const result = reconcileSupplierStatement('sup-1', asOf, statements, ledger);
    expect(result.matchedCount).toBe(1);
    expect(result.statementOnlyCount).toBe(0);
    expect(result.ledgerOnlyCount).toBe(0);
    expect(result.difference).toBe(0n);
  });

  it('identifies statement-only lines', () => {
    const statements: SupplierStatementLine[] = [
      {
        lineRef: 'SL-1',
        date: new Date('2025-03-01'),
        description: 'Unknown charge',
        amount: 10000n,
        currencyCode: 'USD',
      },
    ];
    const result = reconcileSupplierStatement('sup-1', asOf, statements, []);
    expect(result.statementOnlyCount).toBe(1);
    expect(result.matchedCount).toBe(0);
  });

  it('identifies ledger-only entries', () => {
    const ledger: ApLedgerEntry[] = [
      {
        invoiceId: 'inv-1',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date('2025-03-01'),
        amount: 50000n,
        currencyCode: 'USD',
        supplierRef: null,
      },
    ];
    const result = reconcileSupplierStatement('sup-1', asOf, [], ledger);
    expect(result.ledgerOnlyCount).toBe(1);
    expect(result.matchedCount).toBe(0);
  });

  it('does not match when amounts differ', () => {
    const statements: SupplierStatementLine[] = [
      {
        lineRef: 'SL-1',
        date: new Date('2025-03-01'),
        description: 'Invoice 001',
        amount: 50000n,
        currencyCode: 'USD',
      },
    ];
    const ledger: ApLedgerEntry[] = [
      {
        invoiceId: 'inv-1',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date('2025-03-01'),
        amount: 49999n,
        currencyCode: 'USD',
        supplierRef: null,
      },
    ];
    const result = reconcileSupplierStatement('sup-1', asOf, statements, ledger);
    expect(result.matchedCount).toBe(0);
    expect(result.statementOnlyCount).toBe(1);
    expect(result.ledgerOnlyCount).toBe(1);
  });

  it('does not match when date exceeds tolerance', () => {
    const statements: SupplierStatementLine[] = [
      {
        lineRef: 'SL-1',
        date: new Date('2025-03-10'),
        description: 'Invoice 001',
        amount: 50000n,
        currencyCode: 'USD',
      },
    ];
    const ledger: ApLedgerEntry[] = [
      {
        invoiceId: 'inv-1',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date('2025-03-01'),
        amount: 50000n,
        currencyCode: 'USD',
        supplierRef: null,
      },
    ];
    const result = reconcileSupplierStatement('sup-1', asOf, statements, ledger, 3);
    expect(result.matchedCount).toBe(0);
  });

  it('computes correct totals and difference', () => {
    const statements: SupplierStatementLine[] = [
      {
        lineRef: 'SL-1',
        date: new Date('2025-03-01'),
        description: 'A',
        amount: 30000n,
        currencyCode: 'USD',
      },
      {
        lineRef: 'SL-2',
        date: new Date('2025-03-05'),
        description: 'B',
        amount: 20000n,
        currencyCode: 'USD',
      },
    ];
    const ledger: ApLedgerEntry[] = [
      {
        invoiceId: 'inv-1',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date('2025-03-01'),
        amount: 30000n,
        currencyCode: 'USD',
        supplierRef: null,
      },
    ];
    const result = reconcileSupplierStatement('sup-1', asOf, statements, ledger);
    expect(result.statementTotal).toBe(50000n);
    expect(result.ledgerTotal).toBe(30000n);
    expect(result.difference).toBe(20000n);
  });
});

// ─── AR-08: IC Receivable Matching ─────────────────────────────────────────

describe('matchIcReceivables', () => {
  it('matches receivables to payables by counterparty + currency', () => {
    const receivables: IcReceivable[] = [
      {
        invoiceId: 'ar-1',
        customerId: 'c1',
        counterpartyCompanyId: 'co-B',
        amount: 100000n,
        currencyCode: 'USD',
        invoiceDate: new Date('2025-03-01'),
      },
    ];
    const payables: IcPayable[] = [
      {
        invoiceId: 'ap-1',
        supplierId: 's1',
        counterpartyCompanyId: 'co-B',
        amount: 100000n,
        currencyCode: 'USD',
        invoiceDate: new Date('2025-03-01'),
      },
    ];
    const result = matchIcReceivables(receivables, payables);
    expect(result.matchedCount).toBe(1);
    expect(result.unmatchedReceivables).toBe(0);
    expect(result.unmatchedPayables).toBe(0);
    expect(result.netExposure).toBe(0n);
  });

  it('detects amount mismatches', () => {
    const receivables: IcReceivable[] = [
      {
        invoiceId: 'ar-1',
        customerId: 'c1',
        counterpartyCompanyId: 'co-B',
        amount: 100000n,
        currencyCode: 'USD',
        invoiceDate: new Date('2025-03-01'),
      },
    ];
    const payables: IcPayable[] = [
      {
        invoiceId: 'ap-1',
        supplierId: 's1',
        counterpartyCompanyId: 'co-B',
        amount: 90000n,
        currencyCode: 'USD',
        invoiceDate: new Date('2025-03-01'),
      },
    ];
    const result = matchIcReceivables(receivables, payables);
    expect(result.matches[0]!.status).toBe('AMOUNT_MISMATCH');
    expect(result.matches[0]!.difference).toBe(10000n);
  });

  it('identifies unmatched receivables and payables', () => {
    const receivables: IcReceivable[] = [
      {
        invoiceId: 'ar-1',
        customerId: 'c1',
        counterpartyCompanyId: 'co-B',
        amount: 50000n,
        currencyCode: 'USD',
        invoiceDate: new Date('2025-03-01'),
      },
    ];
    const payables: IcPayable[] = [
      {
        invoiceId: 'ap-1',
        supplierId: 's1',
        counterpartyCompanyId: 'co-C',
        amount: 30000n,
        currencyCode: 'USD',
        invoiceDate: new Date('2025-03-01'),
      },
    ];
    const result = matchIcReceivables(receivables, payables);
    expect(result.unmatchedReceivables).toBe(1);
    expect(result.unmatchedPayables).toBe(1);
    expect(result.netExposure).toBe(20000n);
  });

  it('does not match different currencies', () => {
    const receivables: IcReceivable[] = [
      {
        invoiceId: 'ar-1',
        customerId: 'c1',
        counterpartyCompanyId: 'co-B',
        amount: 100000n,
        currencyCode: 'USD',
        invoiceDate: new Date('2025-03-01'),
      },
    ];
    const payables: IcPayable[] = [
      {
        invoiceId: 'ap-1',
        supplierId: 's1',
        counterpartyCompanyId: 'co-B',
        amount: 100000n,
        currencyCode: 'EUR',
        invoiceDate: new Date('2025-03-01'),
      },
    ];
    const result = matchIcReceivables(receivables, payables);
    expect(result.matchedCount).toBe(0);
  });
});

// ─── AR-09: Invoice Discounting / Factoring ────────────────────────────────

describe('computeInvoiceDiscounting', () => {
  it('computes discount charge and net proceeds', () => {
    const result = computeInvoiceDiscounting({
      invoiceId: 'inv-1',
      customerId: 'c1',
      faceValue: 1000000n, // $10,000.00
      currencyCode: 'USD',
      dueDate: new Date('2025-06-01'),
      factoringDate: new Date('2025-03-01'),
      discountRateBps: 250, // 2.50%
      holdbackBps: 1000, // 10.00%
    });

    expect(result.daysToMaturity).toBe(92);
    expect(result.discountCharge).toBeGreaterThan(0n);
    expect(result.holdbackAmount).toBe(100000n); // 10% of 1,000,000
    expect(result.netProceeds).toBeLessThan(result.faceValue);
    expect(result.netProceeds).toBe(
      result.faceValue - result.discountCharge - result.holdbackAmount
    );
  });

  it('returns zero discount for same-day factoring', () => {
    const result = computeInvoiceDiscounting({
      invoiceId: 'inv-1',
      customerId: 'c1',
      faceValue: 1000000n,
      currencyCode: 'USD',
      dueDate: new Date('2025-03-01'),
      factoringDate: new Date('2025-03-01'),
      discountRateBps: 250,
      holdbackBps: 1000,
    });

    expect(result.daysToMaturity).toBe(0);
    expect(result.discountCharge).toBe(0n);
  });

  it('handles past-due invoices (negative days clamped to 0)', () => {
    const result = computeInvoiceDiscounting({
      invoiceId: 'inv-1',
      customerId: 'c1',
      faceValue: 1000000n,
      currencyCode: 'USD',
      dueDate: new Date('2025-01-01'),
      factoringDate: new Date('2025-03-01'),
      discountRateBps: 250,
      holdbackBps: 1000,
    });

    expect(result.daysToMaturity).toBe(0);
    expect(result.discountCharge).toBe(0n);
  });

  it('computeBatchDiscounting handles multiple invoices', () => {
    const results = computeBatchDiscounting([
      {
        invoiceId: 'a',
        customerId: 'c1',
        faceValue: 500000n,
        currencyCode: 'USD',
        dueDate: new Date('2025-06-01'),
        factoringDate: new Date('2025-03-01'),
        discountRateBps: 300,
        holdbackBps: 500,
      },
      {
        invoiceId: 'b',
        customerId: 'c1',
        faceValue: 300000n,
        currencyCode: 'USD',
        dueDate: new Date('2025-07-01'),
        factoringDate: new Date('2025-03-01'),
        discountRateBps: 200,
        holdbackBps: 800,
      },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0]!.invoiceId).toBe('a');
    expect(results[1]!.invoiceId).toBe('b');
  });
});

// ─── AR-10: Revenue Recognition Integration ────────────────────────────────

describe('computeRevenueRecognition', () => {
  it('recognizes POINT_IN_TIME when obligations met + delivered', () => {
    const result = computeRevenueRecognition({
      invoiceId: 'inv-1',
      customerId: 'c1',
      totalAmount: 500000n,
      currencyCode: 'USD',
      invoiceDate: new Date('2025-03-01'),
      deliveryDate: new Date('2025-03-15'),
      contractId: 'ct-1',
      performanceObligationsMet: true,
    });

    expect(result.method).toBe('POINT_IN_TIME');
    expect(result.recognizedAmount).toBe(500000n);
    expect(result.deferredAmount).toBe(0n);
    expect(result.schedule).toHaveLength(1);
    expect(result.schedule[0]!.cumulativePercent).toBe(100);
  });

  it('defers OVER_TIME when contract exists but no delivery', () => {
    const result = computeRevenueRecognition({
      invoiceId: 'inv-1',
      customerId: 'c1',
      totalAmount: 500000n,
      currencyCode: 'USD',
      invoiceDate: new Date('2025-03-01'),
      deliveryDate: null,
      contractId: 'ct-1',
      performanceObligationsMet: false,
    });

    expect(result.method).toBe('OVER_TIME');
    expect(result.recognizedAmount).toBe(0n);
    expect(result.deferredAmount).toBe(500000n);
  });

  it('fully defers when no delivery and no obligations', () => {
    const result = computeRevenueRecognition({
      invoiceId: 'inv-1',
      customerId: 'c1',
      totalAmount: 500000n,
      currencyCode: 'USD',
      invoiceDate: new Date('2025-03-01'),
      deliveryDate: null,
      contractId: null,
      performanceObligationsMet: false,
    });

    expect(result.method).toBe('DEFERRED');
    expect(result.recognizedAmount).toBe(0n);
    expect(result.deferredAmount).toBe(500000n);
    expect(result.schedule).toHaveLength(0);
  });

  it('computeBatchRevenueRecognition handles multiple invoices', () => {
    const results = computeBatchRevenueRecognition([
      {
        invoiceId: 'a',
        customerId: 'c1',
        totalAmount: 100000n,
        currencyCode: 'USD',
        invoiceDate: new Date('2025-03-01'),
        deliveryDate: new Date('2025-03-15'),
        contractId: null,
        performanceObligationsMet: true,
      },
      {
        invoiceId: 'b',
        customerId: 'c1',
        totalAmount: 200000n,
        currencyCode: 'USD',
        invoiceDate: new Date('2025-03-01'),
        deliveryDate: null,
        contractId: null,
        performanceObligationsMet: false,
      },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0]!.method).toBe('POINT_IN_TIME');
    expect(results[1]!.method).toBe('DEFERRED');
  });
});
