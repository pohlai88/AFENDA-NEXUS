import { describe, it, expect } from 'vitest';
import {
  restateForHyperinflation,
  type HyperinflationInput,
} from '../hyperinflation-restatement.js';

const baseInput: HyperinflationInput = {
  entityId: 'entity-ar',
  entityName: 'Acme Argentina SA',
  localCurrency: 'ARS',
  reportingCurrency: 'USD',
  currentPriceIndex: 200_000n, // Current CPI (×10000)
  isHyperinflationaryEconomy: true,
  cumulativeInflationBps: 150_000n, // 1500% cumulative 3yr
  priceIndices: [
    { periodId: '2023-Q1', periodLabel: 'Q1 2023', indexValue: 50_000n },
    { periodId: '2024-Q1', periodLabel: 'Q1 2024', indexValue: 100_000n },
    { periodId: '2025-Q1', periodLabel: 'Q1 2025', indexValue: 200_000n },
  ],
  lineItems: [
    {
      accountCode: '1500',
      accountName: 'Property, Plant & Equipment',
      classification: 'NON_MONETARY',
      historicalAmount: 1_000_000n,
      originPeriodId: '2023-Q1',
    },
    {
      accountCode: '1000',
      accountName: 'Cash and Equivalents',
      classification: 'MONETARY',
      historicalAmount: 500_000n,
      originPeriodId: '2025-Q1',
    },
    {
      accountCode: '2000',
      accountName: 'Inventory',
      classification: 'NON_MONETARY',
      historicalAmount: 300_000n,
      originPeriodId: '2024-Q1',
    },
  ],
};

describe('restateForHyperinflation', () => {
  it('restates non-monetary items using price index ratio', () => {
    const { result } = restateForHyperinflation(baseInput);

    // PPE: 1,000,000 × (200,000 / 50,000) = 4,000,000
    const ppe = result.restatedItems.find((i) => i.accountCode === '1500');
    expect(ppe?.restatedAmount).toBe(4_000_000n);
    expect(ppe?.gainLossOnRestatement).toBe(3_000_000n);
  });

  it('does not restate monetary items', () => {
    const { result } = restateForHyperinflation(baseInput);

    const cash = result.restatedItems.find((i) => i.accountCode === '1000');
    expect(cash?.restatedAmount).toBe(500_000n);
    expect(cash?.gainLossOnRestatement).toBe(0n);
    expect(cash?.conversionFactor).toBe(10000n);
  });

  it('computes total gain/loss on restatement', () => {
    const { result } = restateForHyperinflation(baseInput);

    // PPE gain: 3,000,000; Inventory: 300,000 × (200,000/100,000) = 600,000 → gain 300,000
    expect(result.totalGainLoss).toBe(3_300_000n);
  });

  it('counts monetary and non-monetary items', () => {
    const { result } = restateForHyperinflation(baseInput);

    expect(result.monetaryItemCount).toBe(1);
    expect(result.nonMonetaryItemCount).toBe(2);
  });

  it('computes net monetary gain/loss', () => {
    const { result } = restateForHyperinflation(baseInput);

    // Cash: 500,000 monetary. Origin index 200,000, current 200,000
    // Would-be-restated = 500,000 × 200,000 / 200,000 = 500,000
    // Monetary loss = 500,000 - 500,000 = 0 (same period)
    expect(result.netMonetaryGainLoss).toBe(0n);
  });

  it('skips restatement for non-hyperinflationary economy', () => {
    const { result } = restateForHyperinflation({
      ...baseInput,
      isHyperinflationaryEconomy: false,
    });

    expect(result.isHyperinflationaryEconomy).toBe(false);
    expect(result.totalGainLoss).toBe(0n);
    // All items should be unchanged
    for (const item of result.restatedItems) {
      expect(item.restatedAmount).toBe(item.historicalAmount);
    }
  });

  it('throws on empty line items', () => {
    expect(() =>
      restateForHyperinflation({
        ...baseInput,
        lineItems: [],
      })
    ).toThrow('At least one line item');
  });

  it('handles missing price index gracefully', () => {
    const { result } = restateForHyperinflation({
      ...baseInput,
      lineItems: [
        {
          accountCode: '1500',
          accountName: 'PPE',
          classification: 'NON_MONETARY',
          historicalAmount: 1_000_000n,
          originPeriodId: 'UNKNOWN_PERIOD',
        },
      ],
    });

    // Missing index → no conversion, factor stays 10000
    const item = result.restatedItems[0]!;
    expect(item.conversionFactor).toBe(10000n);
    expect(item.restatedAmount).toBe(1_000_000n);
  });

  it('provides audit explanation for hyperinflationary economy', () => {
    const calc = restateForHyperinflation(baseInput);

    expect(calc.explanation).toContain('Hyperinflation (IAS 29)');
    expect(calc.explanation).toContain('Acme Argentina');
    expect(calc.explanation).toContain('non-monetary items restated');
  });

  it('provides audit explanation for non-hyperinflationary economy', () => {
    const calc = restateForHyperinflation({
      ...baseInput,
      isHyperinflationaryEconomy: false,
    });

    expect(calc.explanation).toContain('NOT a hyperinflationary economy');
  });

  it('computes totals correctly', () => {
    const { result } = restateForHyperinflation(baseInput);

    expect(result.totalHistoricalAmount).toBe(1_800_000n);
    // PPE: 4,000,000 + Cash: 500,000 + Inventory: 600,000 = 5,100,000
    expect(result.totalRestatedAmount).toBe(5_100_000n);
  });
});
