import { describe, it, expect } from 'vitest';
import { reconcilePettyCash, type PettyCashInput } from '../petty-cash.js';

const baseInput: PettyCashInput = {
  fundName: 'Office Petty Cash',
  authorizedFloat: 5_000n,
  openingBalance: 5_000n,
  vouchers: [
    {
      voucherId: 'V-001',
      date: '2025-12-01',
      description: 'Office supplies',
      amount: 150n,
      category: 'OFFICE_SUPPLIES',
      approvedBy: 'manager-1',
      receiptAttached: true,
    },
    {
      voucherId: 'V-002',
      date: '2025-12-05',
      description: 'Staff lunch',
      amount: 250n,
      category: 'MEALS',
      approvedBy: 'manager-1',
      receiptAttached: true,
    },
    {
      voucherId: 'V-003',
      date: '2025-12-10',
      description: 'Taxi fare',
      amount: 80n,
      category: 'TRANSPORT',
      approvedBy: 'manager-1',
      receiptAttached: false,
    },
  ],
  currencyCode: 'MYR',
};

describe('reconcilePettyCash', () => {
  it('computes total disbursements and balance', () => {
    const { result } = reconcilePettyCash(baseInput);

    expect(result.totalDisbursements).toBe(480n);
    expect(result.calculatedBalance).toBe(4_520n);
  });

  it('computes replenishment required', () => {
    const { result } = reconcilePettyCash(baseInput);

    expect(result.replenishmentRequired).toBe(480n);
  });

  it('identifies vouchers without receipts', () => {
    const { result } = reconcilePettyCash(baseInput);

    expect(result.vouchersWithoutReceipts).toBe(1);
  });

  it('computes category breakdown', () => {
    const { result } = reconcilePettyCash(baseInput);

    expect(result.categoryBreakdown).toHaveLength(3);
    const office = result.categoryBreakdown.find((c) => c.category === 'OFFICE_SUPPLIES');
    expect(office?.totalAmount).toBe(150n);
    expect(office?.voucherCount).toBe(1);
  });

  it('detects shortage when physical count is less', () => {
    const { result } = reconcilePettyCash({
      ...baseInput,
      cashCount: [{ denomination: 'RM10', quantity: 400, valuePerUnit: 1n }],
    });

    // Calculated balance: 4520, physical count: 400, no IOUs
    expect(result.physicalCount).toBe(400n);
    expect(result.shortage).toBe(4_120n);
    expect(result.isReconciled).toBe(false);
  });

  it('detects overage when physical count is more', () => {
    const { result } = reconcilePettyCash({
      ...baseInput,
      cashCount: [{ denomination: 'RM10', quantity: 500, valuePerUnit: 10n }],
    });

    // Calculated balance: 4520, physical count: 5000
    expect(result.physicalCount).toBe(5_000n);
    expect(result.overage).toBe(480n);
  });

  it('is reconciled when physical count matches', () => {
    const { result } = reconcilePettyCash({
      ...baseInput,
      cashCount: [{ denomination: 'RM10', quantity: 452, valuePerUnit: 10n }],
    });

    // Calculated balance: 4520, physical count: 4520
    expect(result.physicalCount).toBe(4_520n);
    expect(result.isReconciled).toBe(true);
    expect(result.shortage).toBe(0n);
    expect(result.overage).toBe(0n);
  });

  it('accounts for IOUs in reconciliation', () => {
    const { result } = reconcilePettyCash({
      ...baseInput,
      cashCount: [{ denomination: 'RM10', quantity: 402, valuePerUnit: 10n }],
      iousOutstanding: 500n,
    });

    // Calculated: 4520, IOUs: 500, Accounted: 4520 - 500 = 4020
    // Physical: 4020, diff = 4020 - 4020 = 0
    expect(result.physicalCount).toBe(4_020n);
    expect(result.isReconciled).toBe(true);
  });

  it('handles zero vouchers', () => {
    const { result } = reconcilePettyCash({
      ...baseInput,
      vouchers: [],
    });

    expect(result.totalDisbursements).toBe(0n);
    expect(result.calculatedBalance).toBe(5_000n);
    expect(result.replenishmentRequired).toBe(0n);
  });

  it('returns no replenishment when balance exceeds float', () => {
    const { result } = reconcilePettyCash({
      ...baseInput,
      openingBalance: 6_000n,
      vouchers: [],
    });

    expect(result.replenishmentRequired).toBe(0n);
  });

  it('provides audit explanation', () => {
    const calc = reconcilePettyCash(baseInput);

    expect(calc.explanation).toContain('Petty cash');
    expect(calc.explanation).toContain('Office Petty Cash');
    expect(calc.explanation).toContain('replenishment');
  });
});
