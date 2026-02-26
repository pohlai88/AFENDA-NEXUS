import { describe, it, expect } from 'vitest';
import { deriveCashFlowIndirect } from '../slices/reporting/calculators/cash-flow-indirect.js';
import { triangulateRate, auditRateSources } from '../slices/fx/calculators/fx-triangulation.js';
import { computeAccruals } from '../slices/hub/calculators/accrual-engine.js';
import type { TrialBalanceMovement } from '../slices/reporting/calculators/cash-flow-indirect.js';
import type { RateEntry } from '../slices/fx/calculators/fx-triangulation.js';
import type { AccrualSchedule } from '../slices/hub/calculators/accrual-engine.js';

// ── Cash Flow Indirect ──────────────────────────────────────────────

describe('deriveCashFlowIndirect', () => {
  const baseMovements: TrialBalanceMovement[] = [
    {
      accountId: 'cash',
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'ASSET',
      accountSubType: 'cash',
      openingBalanceMinor: 50000n,
      closingBalanceMinor: 65000n,
      currency: 'USD',
    },
    {
      accountId: 'ar',
      accountCode: '1100',
      accountName: 'Accounts Receivable',
      accountType: 'ASSET',
      accountSubType: 'receivable',
      openingBalanceMinor: 20000n,
      closingBalanceMinor: 25000n,
      currency: 'USD',
    },
    {
      accountId: 'inv',
      accountCode: '1200',
      accountName: 'Inventory',
      accountType: 'ASSET',
      accountSubType: 'inventory',
      openingBalanceMinor: 30000n,
      closingBalanceMinor: 28000n,
      currency: 'USD',
    },
    {
      accountId: 'equip',
      accountCode: '1500',
      accountName: 'Equipment',
      accountType: 'ASSET',
      accountSubType: 'fixed_asset',
      openingBalanceMinor: 100000n,
      closingBalanceMinor: 120000n,
      currency: 'USD',
    },
    {
      accountId: 'ap',
      accountCode: '2000',
      accountName: 'Accounts Payable',
      accountType: 'LIABILITY',
      accountSubType: 'payable',
      openingBalanceMinor: 15000n,
      closingBalanceMinor: 18000n,
      currency: 'USD',
    },
    {
      accountId: 'debt',
      accountCode: '2500',
      accountName: 'Long Term Debt',
      accountType: 'LIABILITY',
      accountSubType: 'long_term_debt',
      openingBalanceMinor: 50000n,
      closingBalanceMinor: 40000n,
      currency: 'USD',
    },
    {
      accountId: 'rev',
      accountCode: '4000',
      accountName: 'Revenue',
      accountType: 'REVENUE',
      accountSubType: 'revenue',
      openingBalanceMinor: 0n,
      closingBalanceMinor: 80000n,
      currency: 'USD',
    },
    {
      accountId: 'cogs',
      accountCode: '5000',
      accountName: 'Cost of Sales',
      accountType: 'EXPENSE',
      accountSubType: 'cost_of_sales',
      openingBalanceMinor: 0n,
      closingBalanceMinor: 40000n,
      currency: 'USD',
    },
    {
      accountId: 'depr',
      accountCode: '6100',
      accountName: 'Depreciation',
      accountType: 'EXPENSE',
      accountSubType: 'depreciation',
      openingBalanceMinor: 0n,
      closingBalanceMinor: 10000n,
      currency: 'USD',
    },
    {
      accountId: 'opex',
      accountCode: '6000',
      accountName: 'Operating Expenses',
      accountType: 'EXPENSE',
      accountSubType: 'operating_expense',
      openingBalanceMinor: 0n,
      closingBalanceMinor: 15000n,
      currency: 'USD',
    },
  ];

  it('computes net income from P&L accounts', () => {
    const result = deriveCashFlowIndirect(baseMovements);
    // Revenue: 80000, COGS: -40000, Depreciation: -10000, OpEx: -15000
    // Net income = 80000 - 40000 - 10000 - 15000 = 15000
    expect(result.result.netIncome).toBe(15000n);
  });

  it('adds back non-cash items (depreciation)', () => {
    const result = deriveCashFlowIndirect(baseMovements);
    expect(result.result.nonCashAdjustments.totalMinor).toBe(10000n);
  });

  it('computes working capital changes', () => {
    const result = deriveCashFlowIndirect(baseMovements);
    // AR increase: -(25000-20000) = -5000 (outflow)
    // Inventory decrease: -(28000-30000) = +2000 (inflow)
    // AP increase: 18000-15000 = +3000 (inflow)
    // Total WC change = -5000 + 2000 + 3000 = 0
    expect(result.result.workingCapitalChanges.totalMinor).toBe(0n);
  });

  it('computes operating cash flow', () => {
    const result = deriveCashFlowIndirect(baseMovements);
    // Net income (15000) + non-cash (10000) + WC changes (0) = 25000
    expect(result.result.operatingCashFlow).toBe(25000n);
  });

  it('computes investing activities', () => {
    const result = deriveCashFlowIndirect(baseMovements);
    // Equipment increase: -(120000-100000) = -20000 (outflow)
    expect(result.result.investingActivities.totalMinor).toBe(-20000n);
  });

  it('computes financing activities', () => {
    const result = deriveCashFlowIndirect(baseMovements);
    // Debt decrease: 40000-50000 = -10000 (outflow)
    expect(result.result.financingActivities.totalMinor).toBe(-10000n);
  });

  it('computes net cash flow', () => {
    const result = deriveCashFlowIndirect(baseMovements);
    // Operating (25000) + Investing (-20000) + Financing (-10000) = -5000
    expect(result.result.netCashFlow).toBe(-5000n);
  });

  it('reports opening and closing cash', () => {
    const result = deriveCashFlowIndirect(baseMovements);
    expect(result.result.openingCash).toBe(50000n);
    expect(result.result.closingCash).toBe(65000n);
  });

  it('throws on empty movements', () => {
    expect(() => deriveCashFlowIndirect([])).toThrow('At least one');
  });
});

// ── FX Triangulation ────────────────────────────────────────────────

describe('triangulateRate', () => {
  const rates: RateEntry[] = [
    { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, rateDate: '2025-12-31', source: 'ECB' },
    { fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79, rateDate: '2025-12-31', source: 'ECB' },
    { fromCurrency: 'USD', toCurrency: 'MYR', rate: 4.47, rateDate: '2025-12-31', source: 'BNM' },
  ];

  it('returns 1.0 for same currency', () => {
    const result = triangulateRate('USD', 'USD', rates);
    expect(result.result.rate.rate).toBe(1.0);
    expect(result.result.rate.method).toBe('direct');
  });

  it('finds direct rate', () => {
    const result = triangulateRate('USD', 'EUR', rates);
    expect(result.result.rate.rate).toBe(0.92);
    expect(result.result.rate.method).toBe('direct');
    expect(result.result.confidence).toBe('high');
  });

  it('computes inverse rate', () => {
    const result = triangulateRate('EUR', 'USD', rates);
    expect(result.result.rate.method).toBe('inverse');
    expect(result.result.confidence).toBe('medium');
    expect(result.result.rate.rate).toBeCloseTo(1 / 0.92, 5);
  });

  it('triangulates via base currency', () => {
    const result = triangulateRate('EUR', 'MYR', rates, 'USD');
    expect(result.result.rate.method).toBe('triangulated');
    expect(result.result.confidence).toBe('low');
    expect(result.result.rate.baseCurrency).toBe('USD');
    // EUR→USD (1/0.92) × USD→MYR (4.47) ≈ 4.8587
    expect(result.result.rate.rate).toBeCloseTo(4.47 / 0.92, 2);
  });

  it('throws when no path exists', () => {
    expect(() => triangulateRate('JPY', 'CHF', rates)).toThrow('No rate path');
  });
});

describe('auditRateSources', () => {
  it('reports clean for valid rates', () => {
    const rates: RateEntry[] = [
      { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, rateDate: '2025-12-30', source: 'ECB' },
    ];
    const result = auditRateSources(rates, '2025-12-31');
    expect(result.result.isClean).toBe(true);
    expect(result.result.issues).toHaveLength(0);
  });

  it('detects stale rates', () => {
    const rates: RateEntry[] = [
      { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, rateDate: '2025-12-01', source: 'ECB' },
    ];
    const result = auditRateSources(rates, '2025-12-31', 7);
    expect(result.result.isClean).toBe(false);
    expect(result.result.issues[0].issue).toBe('stale');
  });

  it('detects zero rates', () => {
    const rates: RateEntry[] = [
      { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0, rateDate: '2025-12-31', source: 'ECB' },
    ];
    const result = auditRateSources(rates, '2025-12-31');
    expect(result.result.issues[0].issue).toBe('zero_rate');
  });

  it('detects negative rates', () => {
    const rates: RateEntry[] = [
      { fromCurrency: 'USD', toCurrency: 'EUR', rate: -0.5, rateDate: '2025-12-31', source: 'ECB' },
    ];
    const result = auditRateSources(rates, '2025-12-31');
    expect(result.result.issues[0].issue).toBe('negative_rate');
  });

  it('detects duplicate pairs', () => {
    const rates: RateEntry[] = [
      { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, rateDate: '2025-12-31', source: 'ECB' },
      {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.93,
        rateDate: '2025-12-31',
        source: 'Reuters',
      },
    ];
    const result = auditRateSources(rates, '2025-12-31');
    expect(result.result.issues.some((i) => i.issue === 'duplicate')).toBe(true);
  });
});

// ── Accrual Engine ──────────────────────────────────────────────────

describe('computeAccruals', () => {
  it('computes straight-line accrual for a full period', () => {
    const schedules: AccrualSchedule[] = [
      {
        id: 's1',
        type: 'prepaid_expense',
        method: 'straight_line',
        sourceAccountId: 'prepaid',
        targetAccountId: 'expense',
        totalAmountMinor: 12000n,
        recognizedToDateMinor: 0n,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        currency: 'USD',
        description: 'Annual insurance',
      },
    ];
    const result = computeAccruals(schedules, '2025-01-01', '2025-01-31');
    expect(result.result.entries).toHaveLength(1);
    // ~30/365 of 12000 ≈ 986
    expect(result.result.entries[0].amountMinor).toBeGreaterThan(900n);
    expect(result.result.entries[0].amountMinor).toBeLessThan(1100n);
    expect(result.result.entries[0].debitAccountId).toBe('expense');
    expect(result.result.entries[0].creditAccountId).toBe('prepaid');
  });

  it('caps recognition at remaining amount', () => {
    const schedules: AccrualSchedule[] = [
      {
        id: 's1',
        type: 'accrued_revenue',
        method: 'straight_line',
        sourceAccountId: 'receivable',
        targetAccountId: 'revenue',
        totalAmountMinor: 1000n,
        recognizedToDateMinor: 990n,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        currency: 'USD',
        description: 'Service contract',
      },
    ];
    const result = computeAccruals(schedules, '2025-06-01', '2025-06-30');
    // Only 10 remaining
    expect(result.result.entries[0].amountMinor).toBeLessThanOrEqual(10n);
  });

  it('skips fully recognized schedules', () => {
    const schedules: AccrualSchedule[] = [
      {
        id: 's1',
        type: 'prepaid_expense',
        method: 'straight_line',
        sourceAccountId: 'prepaid',
        targetAccountId: 'expense',
        totalAmountMinor: 12000n,
        recognizedToDateMinor: 12000n,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        currency: 'USD',
        description: 'Fully recognized',
      },
    ];
    const result = computeAccruals(schedules, '2025-06-01', '2025-06-30');
    expect(result.result.entries).toHaveLength(0);
    expect(result.result.schedulesSkipped).toBe(1);
  });

  it('skips schedules outside period', () => {
    const schedules: AccrualSchedule[] = [
      {
        id: 's1',
        type: 'prepaid_expense',
        method: 'straight_line',
        sourceAccountId: 'prepaid',
        targetAccountId: 'expense',
        totalAmountMinor: 12000n,
        recognizedToDateMinor: 0n,
        startDate: '2025-07-01',
        endDate: '2025-12-31',
        currency: 'USD',
        description: 'Future insurance',
      },
    ];
    const result = computeAccruals(schedules, '2025-01-01', '2025-01-31');
    expect(result.result.entries).toHaveLength(0);
    expect(result.result.schedulesSkipped).toBe(1);
  });

  it('handles milestone-based accrual', () => {
    const schedules: AccrualSchedule[] = [
      {
        id: 's1',
        type: 'deferred_revenue',
        method: 'milestone',
        sourceAccountId: 'deferred',
        targetAccountId: 'revenue',
        totalAmountMinor: 100000n,
        recognizedToDateMinor: 0n,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        currency: 'USD',
        description: 'Project milestone',
        milestonePercent: 25,
      },
    ];
    const result = computeAccruals(schedules, '2025-03-01', '2025-03-31');
    expect(result.result.entries).toHaveLength(1);
    expect(result.result.entries[0].amountMinor).toBe(25000n);
    expect(result.result.entries[0].debitAccountId).toBe('deferred');
    expect(result.result.entries[0].creditAccountId).toBe('revenue');
  });

  it('handles accrued expense type', () => {
    const schedules: AccrualSchedule[] = [
      {
        id: 's1',
        type: 'accrued_expense',
        method: 'straight_line',
        sourceAccountId: 'accrued_liab',
        targetAccountId: 'expense',
        totalAmountMinor: 6000n,
        recognizedToDateMinor: 0n,
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        currency: 'USD',
        description: 'Accrued utilities',
      },
    ];
    const result = computeAccruals(schedules, '2025-01-01', '2025-01-31');
    expect(result.result.entries[0].debitAccountId).toBe('expense');
    expect(result.result.entries[0].creditAccountId).toBe('accrued_liab');
  });

  it('throws on non-positive total', () => {
    const schedules: AccrualSchedule[] = [
      {
        id: 's1',
        type: 'prepaid_expense',
        method: 'straight_line',
        sourceAccountId: 'a',
        targetAccountId: 'b',
        totalAmountMinor: 0n,
        recognizedToDateMinor: 0n,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        currency: 'USD',
        description: 'Bad',
      },
    ];
    expect(() => computeAccruals(schedules, '2025-01-01', '2025-01-31')).toThrow('non-positive');
  });
});
