import { describe, it, expect } from 'vitest';
import {
  enforceExpensePolicy,
  type PolicyCheckLine,
} from '../slices/expense/calculators/policy-enforcement.js';
import { computePerDiem, computeMileage } from '../slices/expense/calculators/per-diem-mileage.js';
import type { ExpensePolicy } from '../slices/expense/entities/expense-policy.js';

const now = new Date('2025-06-15');

function makePolicy(overrides: Partial<ExpensePolicy> = {}): ExpensePolicy {
  return {
    id: 'pol-1',
    tenantId: 't-1',
    companyId: 'co-1',
    name: 'Default Travel Policy',
    category: 'TRAVEL',
    maxAmountPerItem: 50000n,
    maxAmountPerClaim: 200000n,
    currencyCode: 'USD',
    requiresReceipt: true,
    requiresApproval: true,
    perDiemRate: 10000n,
    mileageRateBps: 5000,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── EM-03: Policy Enforcement ─────────────────────────────────────────────

describe('enforceExpensePolicy', () => {
  it('passes compliant lines', () => {
    const lines: PolicyCheckLine[] = [
      {
        lineNumber: 1,
        category: 'TRAVEL',
        amount: 30000n,
        currencyCode: 'USD',
        hasReceipt: true,
        description: 'Flight',
      },
    ];
    const policies = [makePolicy()];
    const result = enforceExpensePolicy(lines, policies, 'USD');
    expect(result.isCompliant).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.totalAmount).toBe(30000n);
  });

  it('flags amount exceeding per-item limit', () => {
    const lines: PolicyCheckLine[] = [
      {
        lineNumber: 1,
        category: 'TRAVEL',
        amount: 60000n,
        currencyCode: 'USD',
        hasReceipt: true,
        description: 'Expensive flight',
      },
    ];
    const policies = [makePolicy()];
    const result = enforceExpensePolicy(lines, policies, 'USD');
    expect(result.isCompliant).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]!.rule).toBe('MAX_AMOUNT_PER_ITEM');
  });

  it('flags missing receipt when required', () => {
    const lines: PolicyCheckLine[] = [
      {
        lineNumber: 1,
        category: 'TRAVEL',
        amount: 20000n,
        currencyCode: 'USD',
        hasReceipt: false,
        description: 'Taxi',
      },
    ];
    const policies = [makePolicy()];
    const result = enforceExpensePolicy(lines, policies, 'USD');
    expect(result.isCompliant).toBe(false);
    expect(result.violations[0]!.rule).toBe('RECEIPT_REQUIRED');
  });

  it('flags claim total exceeding limit', () => {
    const lines: PolicyCheckLine[] = [
      {
        lineNumber: 1,
        category: 'TRAVEL',
        amount: 50000n,
        currencyCode: 'USD',
        hasReceipt: true,
        description: 'Flight 1',
      },
      {
        lineNumber: 2,
        category: 'TRAVEL',
        amount: 50000n,
        currencyCode: 'USD',
        hasReceipt: true,
        description: 'Flight 2',
      },
      {
        lineNumber: 3,
        category: 'TRAVEL',
        amount: 50000n,
        currencyCode: 'USD',
        hasReceipt: true,
        description: 'Flight 3',
      },
      {
        lineNumber: 4,
        category: 'TRAVEL',
        amount: 50000n,
        currencyCode: 'USD',
        hasReceipt: true,
        description: 'Flight 4',
      },
      {
        lineNumber: 5,
        category: 'TRAVEL',
        amount: 50000n,
        currencyCode: 'USD',
        hasReceipt: true,
        description: 'Flight 5',
      },
    ];
    const policies = [makePolicy()];
    const result = enforceExpensePolicy(lines, policies, 'USD');
    expect(result.claimLimitExceeded).toBe(true);
    expect(result.totalAmount).toBe(250000n);
  });

  it('skips categories without policy', () => {
    const lines: PolicyCheckLine[] = [
      {
        lineNumber: 1,
        category: 'ENTERTAINMENT',
        amount: 999999n,
        currencyCode: 'USD',
        hasReceipt: false,
        description: 'Party',
      },
    ];
    const policies = [makePolicy({ category: 'TRAVEL' })];
    const result = enforceExpensePolicy(lines, policies, 'USD');
    // No ENTERTAINMENT policy, so no violations from policy check
    expect(result.violations.filter((v) => v.lineNumber === 1)).toHaveLength(0);
  });

  it('handles empty lines', () => {
    const result = enforceExpensePolicy([], [makePolicy()], 'USD');
    expect(result.isCompliant).toBe(true);
    expect(result.totalAmount).toBe(0n);
  });
});

// ─── EM-02: Per-Diem / Mileage ─────────────────────────────────────────────

describe('computePerDiem', () => {
  it('computes per-diem for given days', () => {
    const result = computePerDiem({ days: 5, dailyRate: 10000n, currencyCode: 'USD' });
    expect(result.totalAmount).toBe(50000n);
    expect(result.days).toBe(5);
  });

  it('handles zero days', () => {
    const result = computePerDiem({ days: 0, dailyRate: 10000n, currencyCode: 'USD' });
    expect(result.totalAmount).toBe(0n);
  });

  it('handles single day', () => {
    const result = computePerDiem({ days: 1, dailyRate: 15000n, currencyCode: 'EUR' });
    expect(result.totalAmount).toBe(15000n);
    expect(result.currencyCode).toBe('EUR');
  });
});

describe('computeMileage', () => {
  it('computes mileage reimbursement', () => {
    // 100 km * 5000 bps / 10000 = 50
    const result = computeMileage({ distanceKm: 100, ratePerKmBps: 5000, currencyCode: 'USD' });
    expect(result.totalAmount).toBe(50n);
  });

  it('handles large distances', () => {
    // 1000 km * 6500 bps / 10000 = 650
    const result = computeMileage({ distanceKm: 1000, ratePerKmBps: 6500, currencyCode: 'USD' });
    expect(result.totalAmount).toBe(650n);
  });

  it('handles zero distance', () => {
    const result = computeMileage({ distanceKm: 0, ratePerKmBps: 5000, currencyCode: 'USD' });
    expect(result.totalAmount).toBe(0n);
  });
});
