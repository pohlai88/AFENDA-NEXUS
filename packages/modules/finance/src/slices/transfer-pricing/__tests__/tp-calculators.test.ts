import { describe, it, expect } from 'vitest';
import { validateTpMethod } from '../calculators/tp-methods.js';
import { computeCbcr } from '../calculators/cbcr.js';
import { testThinCapitalization } from '../calculators/thin-capitalization.js';

// ── TP Methods ───────────────────────────────────────────────────────────────

describe('validateTpMethod', () => {
  it('validates cost-plus within range', () => {
    const result = validateTpMethod([
      {
        transactionId: 'tp-1',
        method: 'COST_PLUS',
        transactionPrice: 120000n,
        currencyCode: 'USD',
        benchmarkLowBps: 1500,
        benchmarkMedianBps: 2000,
        benchmarkHighBps: 2500,
        costBase: 100000n,
      },
    ]);
    // margin = (120000-100000)/100000 = 20% = 2000 bps → within [1500,2500]
    expect(result.result[0]!.isWithinRange).toBe(true);
    expect(result.result[0]!.computedMarginBps).toBe(2000);
  });

  it('detects cost-plus outside range', () => {
    const result = validateTpMethod([
      {
        transactionId: 'tp-2',
        method: 'COST_PLUS',
        transactionPrice: 150000n,
        currencyCode: 'USD',
        benchmarkLowBps: 1500,
        benchmarkMedianBps: 2000,
        benchmarkHighBps: 2500,
        costBase: 100000n,
      },
    ]);
    // margin = 50% = 5000 bps → outside [1500,2500]
    expect(result.result[0]!.isWithinRange).toBe(false);
    expect(result.result[0]!.computedMarginBps).toBe(5000);
  });

  it('handles zero cost base', () => {
    const result = validateTpMethod([
      {
        transactionId: 'tp-3',
        method: 'COST_PLUS',
        transactionPrice: 100000n,
        currencyCode: 'USD',
        benchmarkLowBps: 1500,
        benchmarkMedianBps: 2000,
        benchmarkHighBps: 2500,
        costBase: 0n,
      },
    ]);
    expect(result.result[0]!.isWithinRange).toBe(false);
    expect(result.result[0]!.reason).toContain('zero');
  });

  it('throws on empty input', () => {
    expect(() => validateTpMethod([])).toThrow('At least one');
  });
});

// ── CbCR ─────────────────────────────────────────────────────────────────────

describe('computeCbcr', () => {
  it('aggregates by jurisdiction', () => {
    const result = computeCbcr([
      {
        entityId: 'e1',
        entityName: 'US Co',
        taxJurisdiction: 'US',
        revenue: 500000n,
        relatedPartyRevenue: 100000n,
        unrelatedPartyRevenue: 400000n,
        profitBeforeTax: 80000n,
        incomeTaxPaid: 20000n,
        incomeTaxAccrued: 22000n,
        statedCapital: 200000n,
        accumulatedEarnings: 300000n,
        numberOfEmployees: 50,
        tangibleAssets: 1000000n,
        currencyCode: 'USD',
      },
      {
        entityId: 'e2',
        entityName: 'US Sub',
        taxJurisdiction: 'US',
        revenue: 200000n,
        relatedPartyRevenue: 50000n,
        unrelatedPartyRevenue: 150000n,
        profitBeforeTax: 30000n,
        incomeTaxPaid: 8000n,
        incomeTaxAccrued: 9000n,
        statedCapital: 100000n,
        accumulatedEarnings: 120000n,
        numberOfEmployees: 20,
        tangibleAssets: 400000n,
        currencyCode: 'USD',
      },
      {
        entityId: 'e3',
        entityName: 'UK Co',
        taxJurisdiction: 'UK',
        revenue: 300000n,
        relatedPartyRevenue: 80000n,
        unrelatedPartyRevenue: 220000n,
        profitBeforeTax: 50000n,
        incomeTaxPaid: 10000n,
        incomeTaxAccrued: 12000n,
        statedCapital: 150000n,
        accumulatedEarnings: 180000n,
        numberOfEmployees: 30,
        tangibleAssets: 600000n,
        currencyCode: 'GBP',
      },
    ]);

    expect(result.result.totalJurisdictions).toBe(2);
    expect(result.result.totalEntities).toBe(3);

    const us = result.result.jurisdictions.find((j) => j.jurisdiction === 'US')!;
    expect(us.entities).toHaveLength(2);
    expect(us.totalRevenue).toBe(700000n);
    expect(us.numberOfEmployees).toBe(70);

    const uk = result.result.jurisdictions.find((j) => j.jurisdiction === 'UK')!;
    expect(uk.entities).toHaveLength(1);
    expect(uk.totalRevenue).toBe(300000n);
  });

  it('throws on empty input', () => {
    expect(() => computeCbcr([])).toThrow('At least one');
  });
});

// ── Thin Capitalization ──────────────────────────────────────────────────────

describe('testThinCapitalization', () => {
  it('passes when within limits', () => {
    const result = testThinCapitalization([
      {
        entityId: 'e1',
        entityName: 'Main Co',
        totalDebt: 500000n,
        relatedPartyDebt: 200000n,
        totalEquity: 400000n,
        interestExpense: 30000n,
        ebitda: 200000n,
        debtEquityLimitBps: 15000,
        interestEbitdaLimitBps: 3000,
        currencyCode: 'USD',
      },
    ]);
    // D/E = 200000/400000 = 5000 bps < 15000 → OK
    // Interest/EBITDA = 30000/200000 = 1500 bps < 3000 → OK
    expect(result.result[0]!.exceedsDebtEquityLimit).toBe(false);
    expect(result.result[0]!.exceedsInterestLimit).toBe(false);
    expect(result.result[0]!.disallowedInterest).toBe(0n);
  });

  it('detects excess debt above D/E limit', () => {
    const result = testThinCapitalization([
      {
        entityId: 'e2',
        entityName: 'Overleveraged Co',
        totalDebt: 1000000n,
        relatedPartyDebt: 800000n,
        totalEquity: 200000n,
        interestExpense: 80000n,
        ebitda: 150000n,
        debtEquityLimitBps: 20000,
        interestEbitdaLimitBps: 3000,
        currencyCode: 'USD',
      },
    ]);
    // D/E = 800000/200000 = 40000 bps > 20000 → exceeded
    expect(result.result[0]!.exceedsDebtEquityLimit).toBe(true);
    expect(result.result[0]!.debtEquityRatioBps).toBe(40000);
    // Permitted = 200000 * 20000/10000 = 400000; excess = 800000-400000 = 400000
    expect(result.result[0]!.excessDebt).toBe(400000n);
    // Disallowed = 80000 * 400000 / 800000 = 40000
    expect(result.result[0]!.disallowedInterest).toBe(40000n);
  });

  it('handles zero equity', () => {
    const result = testThinCapitalization([
      {
        entityId: 'e3',
        entityName: 'No Equity Co',
        totalDebt: 500000n,
        relatedPartyDebt: 300000n,
        totalEquity: 0n,
        interestExpense: 40000n,
        ebitda: 100000n,
        debtEquityLimitBps: 20000,
        interestEbitdaLimitBps: 3000,
        currencyCode: 'USD',
      },
    ]);
    expect(result.result[0]!.debtEquityRatioBps).toBe(99999);
    expect(result.result[0]!.exceedsDebtEquityLimit).toBe(true);
  });

  it('throws on empty input', () => {
    expect(() => testThinCapitalization([])).toThrow('At least one');
  });
});
