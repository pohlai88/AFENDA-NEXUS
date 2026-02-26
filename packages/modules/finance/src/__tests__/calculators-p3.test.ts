import { describe, it, expect } from 'vitest';
import { computeEliminations } from '../slices/ic/calculators/ic-elimination.js';
import { translateTrialBalance } from '../slices/fx/calculators/fx-translation.js';
import {
  resolveCloseReadiness,
  sequenceMultiCompanyClose,
} from '../slices/reporting/calculators/close-checklist.js';
import type { IntercompanyBalance } from '../slices/ic/calculators/ic-elimination.js';
import type {
  TrialBalanceEntry,
  TranslationRates,
} from '../slices/fx/calculators/fx-translation.js';
import type {
  CloseTask,
  MultiCompanyCloseOrder,
} from '../slices/reporting/calculators/close-checklist.js';

// ── IC Elimination ──────────────────────────────────────────────────

describe('computeEliminations', () => {
  it('produces paired debit+credit entries for each IC balance', () => {
    const balances: IntercompanyBalance[] = [
      {
        fromCompanyId: 'c1',
        toCompanyId: 'c2',
        accountId: 'a1',
        amountMinor: 5000n,
        currency: 'USD',
      },
    ];
    const result = computeEliminations(balances);
    expect(result.result).toHaveLength(2);
    expect(result.result[0].side).toBe('debit');
    expect(result.result[1].side).toBe('credit');
    expect(result.result[0].amountMinor).toBe(5000n);
    expect(result.result[1].amountMinor).toBe(5000n);
  });

  it('handles multiple IC balances', () => {
    const balances: IntercompanyBalance[] = [
      {
        fromCompanyId: 'c1',
        toCompanyId: 'c2',
        accountId: 'a1',
        amountMinor: 5000n,
        currency: 'USD',
      },
      {
        fromCompanyId: 'c2',
        toCompanyId: 'c3',
        accountId: 'a2',
        amountMinor: 3000n,
        currency: 'USD',
      },
    ];
    const result = computeEliminations(balances);
    expect(result.result).toHaveLength(4);
    expect(result.explanation).toContain('2 pairs');
  });

  it('returns empty for no balances', () => {
    const result = computeEliminations([]);
    expect(result.result).toHaveLength(0);
    expect(result.explanation).toContain('No IC balances');
  });

  it('throws on negative amount', () => {
    const balances: IntercompanyBalance[] = [
      {
        fromCompanyId: 'c1',
        toCompanyId: 'c2',
        accountId: 'a1',
        amountMinor: -1n,
        currency: 'USD',
      },
    ];
    expect(() => computeEliminations(balances)).toThrow('non-negative');
  });

  it('throws on same-company balance', () => {
    const balances: IntercompanyBalance[] = [
      {
        fromCompanyId: 'c1',
        toCompanyId: 'c1',
        accountId: 'a1',
        amountMinor: 1000n,
        currency: 'USD',
      },
    ];
    expect(() => computeEliminations(balances)).toThrow('same company');
  });
});

// ── FX Translation ──────────────────────────────────────────────────

describe('translateTrialBalance', () => {
  const rates: TranslationRates = {
    closingRate: 1.5,
    averageRate: 1.4,
    historicalRate: 1.2,
  };

  it('uses closing rate for assets', () => {
    const entries: TrialBalanceEntry[] = [
      { accountId: 'a1', accountType: 'ASSET', amountMinor: 10000n, sourceCurrency: 'MYR' },
    ];
    const result = translateTrialBalance(entries, rates, 'USD');
    expect(result.result.entries[0].rateType).toBe('closing');
    expect(result.result.entries[0].rateUsed).toBe(1.5);
    expect(result.result.entries[0].translatedMinor).toBe(15000n);
  });

  it('uses closing rate for liabilities', () => {
    const entries: TrialBalanceEntry[] = [
      { accountId: 'l1', accountType: 'LIABILITY', amountMinor: 8000n, sourceCurrency: 'MYR' },
    ];
    const result = translateTrialBalance(entries, rates, 'USD');
    expect(result.result.entries[0].rateType).toBe('closing');
    expect(result.result.entries[0].translatedMinor).toBe(12000n);
  });

  it('uses average rate for revenue', () => {
    const entries: TrialBalanceEntry[] = [
      { accountId: 'r1', accountType: 'REVENUE', amountMinor: 20000n, sourceCurrency: 'MYR' },
    ];
    const result = translateTrialBalance(entries, rates, 'USD');
    expect(result.result.entries[0].rateType).toBe('average');
    expect(result.result.entries[0].rateUsed).toBe(1.4);
    expect(result.result.entries[0].translatedMinor).toBe(28000n);
  });

  it('uses average rate for expenses', () => {
    const entries: TrialBalanceEntry[] = [
      { accountId: 'e1', accountType: 'EXPENSE', amountMinor: 15000n, sourceCurrency: 'MYR' },
    ];
    const result = translateTrialBalance(entries, rates, 'USD');
    expect(result.result.entries[0].rateType).toBe('average');
    expect(result.result.entries[0].translatedMinor).toBe(21000n);
  });

  it('uses historical rate for equity', () => {
    const entries: TrialBalanceEntry[] = [
      { accountId: 'eq1', accountType: 'EQUITY', amountMinor: 50000n, sourceCurrency: 'MYR' },
    ];
    const result = translateTrialBalance(entries, rates, 'USD');
    expect(result.result.entries[0].rateType).toBe('historical');
    expect(result.result.entries[0].rateUsed).toBe(1.2);
    expect(result.result.entries[0].translatedMinor).toBe(60000n);
  });

  it('skips conversion for same currency', () => {
    const entries: TrialBalanceEntry[] = [
      { accountId: 'a1', accountType: 'ASSET', amountMinor: 10000n, sourceCurrency: 'USD' },
    ];
    const result = translateTrialBalance(entries, rates, 'USD');
    expect(result.result.entries[0].rateType).toBe('none');
    expect(result.result.entries[0].translatedMinor).toBe(10000n);
  });

  it('computes CTA as sum of translation differences', () => {
    const entries: TrialBalanceEntry[] = [
      { accountId: 'a1', accountType: 'ASSET', amountMinor: 10000n, sourceCurrency: 'MYR' },
      { accountId: 'r1', accountType: 'REVENUE', amountMinor: 5000n, sourceCurrency: 'MYR' },
    ];
    const result = translateTrialBalance(entries, rates, 'USD');
    // Asset: 10000 → 15000, diff = 5000
    // Revenue: 5000 → 7000, diff = 2000
    // CTA = 5000 + 2000 = 7000
    expect(result.result.ctaAmountMinor).toBe(7000n);
  });

  it('throws on non-positive rates', () => {
    const entries: TrialBalanceEntry[] = [
      { accountId: 'a1', accountType: 'ASSET', amountMinor: 10000n, sourceCurrency: 'MYR' },
    ];
    expect(() =>
      translateTrialBalance(
        entries,
        { closingRate: 0, averageRate: 1.4, historicalRate: 1.2 },
        'USD'
      )
    ).toThrow('positive');
  });
});

// ── Close Checklist ─────────────────────────────────────────────────

describe('resolveCloseReadiness', () => {
  it('reports ready when all tasks completed', () => {
    const tasks: CloseTask[] = [
      { id: 't1', name: 'Reconcile bank', status: 'completed', dependsOn: [], companyId: 'c1' },
      {
        id: 't2',
        name: 'Post adjustments',
        status: 'completed',
        dependsOn: ['t1'],
        companyId: 'c1',
      },
    ];
    const result = resolveCloseReadiness(tasks);
    expect(result.result.ready).toBe(true);
    expect(result.result.completedCount).toBe(2);
    expect(result.result.pendingCount).toBe(0);
  });

  it('identifies blocked tasks', () => {
    const tasks: CloseTask[] = [
      { id: 't1', name: 'Reconcile bank', status: 'pending', dependsOn: [], companyId: 'c1' },
      { id: 't2', name: 'Post adjustments', status: 'pending', dependsOn: ['t1'], companyId: 'c1' },
    ];
    const result = resolveCloseReadiness(tasks);
    expect(result.result.ready).toBe(false);
    expect(result.result.blockedCount).toBe(1);
    expect(result.result.blockedTasks[0].taskName).toBe('Post adjustments');
    expect(result.result.blockedTasks[0].blockedBy).toEqual(['t1']);
  });

  it('identifies next actionable tasks', () => {
    const tasks: CloseTask[] = [
      { id: 't1', name: 'Reconcile bank', status: 'pending', dependsOn: [], companyId: 'c1' },
      { id: 't2', name: 'Post adjustments', status: 'pending', dependsOn: ['t1'], companyId: 'c1' },
    ];
    const result = resolveCloseReadiness(tasks);
    expect(result.result.nextTasks).toHaveLength(1);
    expect(result.result.nextTasks[0].id).toBe('t1');
  });

  it('treats skipped tasks as completed for dependency resolution', () => {
    const tasks: CloseTask[] = [
      { id: 't1', name: 'Optional step', status: 'skipped', dependsOn: [], companyId: 'c1' },
      { id: 't2', name: 'Next step', status: 'pending', dependsOn: ['t1'], companyId: 'c1' },
    ];
    const result = resolveCloseReadiness(tasks);
    // t2 should be actionable since t1 is skipped
    expect(result.result.nextTasks).toHaveLength(1);
    expect(result.result.nextTasks[0].id).toBe('t2');
  });
});

describe('sequenceMultiCompanyClose', () => {
  it('sorts subsidiaries before parent', () => {
    const companies: MultiCompanyCloseOrder[] = [
      { companyId: 'parent', companyName: 'HQ', order: 0, dependsOnCompanies: ['sub1', 'sub2'] },
      { companyId: 'sub1', companyName: 'Sub 1', order: 0, dependsOnCompanies: [] },
      { companyId: 'sub2', companyName: 'Sub 2', order: 0, dependsOnCompanies: [] },
    ];
    const result = sequenceMultiCompanyClose(companies);
    const parentIdx = result.result.indexOf('parent');
    const sub1Idx = result.result.indexOf('sub1');
    const sub2Idx = result.result.indexOf('sub2');
    expect(sub1Idx).toBeLessThan(parentIdx);
    expect(sub2Idx).toBeLessThan(parentIdx);
  });

  it('handles chain dependencies', () => {
    const companies: MultiCompanyCloseOrder[] = [
      { companyId: 'c1', companyName: 'Level 1', order: 0, dependsOnCompanies: [] },
      { companyId: 'c2', companyName: 'Level 2', order: 0, dependsOnCompanies: ['c1'] },
      { companyId: 'c3', companyName: 'Level 3', order: 0, dependsOnCompanies: ['c2'] },
    ];
    const result = sequenceMultiCompanyClose(companies);
    expect(result.result).toEqual(['c1', 'c2', 'c3']);
  });

  it('throws on circular dependency', () => {
    const companies: MultiCompanyCloseOrder[] = [
      { companyId: 'c1', companyName: 'A', order: 0, dependsOnCompanies: ['c2'] },
      { companyId: 'c2', companyName: 'B', order: 0, dependsOnCompanies: ['c1'] },
    ];
    expect(() => sequenceMultiCompanyClose(companies)).toThrow('Circular dependency');
  });

  it('handles single company', () => {
    const companies: MultiCompanyCloseOrder[] = [
      { companyId: 'c1', companyName: 'Solo', order: 0, dependsOnCompanies: [] },
    ];
    const result = sequenceMultiCompanyClose(companies);
    expect(result.result).toEqual(['c1']);
  });
});
