import { describe, it, expect } from 'vitest';
import { testEffectiveness } from '../calculators/effectiveness.js';
import { computeOciReserve } from '../calculators/oci-reserve.js';

// ── Effectiveness ────────────────────────────────────────────────────────────

describe('testEffectiveness', () => {
  it('passes dollar-offset within 80-125% band', () => {
    const result = testEffectiveness([
      {
        hedgeId: 'h-1',
        hedgeType: 'CASH_FLOW',
        method: 'DOLLAR_OFFSET',
        hedgingInstrumentFvChange: -95000n,
        hedgedItemFvChange: 100000n,
        currencyCode: 'USD',
      },
    ]);
    // ratio = 95000/100000 = 9500 bps → within 8000-12500
    expect(result.result[0]!.isEffective).toBe(true);
    expect(result.result[0]!.dollarOffsetRatioBps).toBe(9500);
  });

  it('fails dollar-offset outside band', () => {
    const result = testEffectiveness([
      {
        hedgeId: 'h-2',
        hedgeType: 'FAIR_VALUE',
        method: 'DOLLAR_OFFSET',
        hedgingInstrumentFvChange: -50000n,
        hedgedItemFvChange: 100000n,
        currencyCode: 'USD',
      },
    ]);
    // ratio = 50000/100000 = 5000 bps → below 8000
    expect(result.result[0]!.isEffective).toBe(false);
  });

  it('regression method with good R² and slope', () => {
    const result = testEffectiveness([
      {
        hedgeId: 'h-3',
        hedgeType: 'CASH_FLOW',
        method: 'REGRESSION',
        hedgingInstrumentFvChange: -90000n,
        hedgedItemFvChange: 100000n,
        currencyCode: 'USD',
        regressionRSquared: 0.95,
        regressionSlope: -0.92,
      },
    ]);
    expect(result.result[0]!.isEffective).toBe(true);
  });

  it('regression fails with low R²', () => {
    const result = testEffectiveness([
      {
        hedgeId: 'h-4',
        hedgeType: 'FAIR_VALUE',
        method: 'REGRESSION',
        hedgingInstrumentFvChange: -80000n,
        hedgedItemFvChange: 100000n,
        currencyCode: 'USD',
        regressionRSquared: 0.5,
        regressionSlope: -0.9,
      },
    ]);
    expect(result.result[0]!.isEffective).toBe(false);
  });

  it('handles zero hedged item change', () => {
    const result = testEffectiveness([
      {
        hedgeId: 'h-5',
        hedgeType: 'CASH_FLOW',
        method: 'DOLLAR_OFFSET',
        hedgingInstrumentFvChange: 0n,
        hedgedItemFvChange: 0n,
        currencyCode: 'USD',
      },
    ]);
    expect(result.result[0]!.isEffective).toBe(true);
  });

  it('throws on empty input', () => {
    expect(() => testEffectiveness([])).toThrow('At least one');
  });
});

// ── OCI Reserve ──────────────────────────────────────────────────────────────

describe('computeOciReserve', () => {
  it('computes closing OCI reserve balance', () => {
    const result = computeOciReserve([
      {
        hedgeId: 'h-1',
        openingOciReserve: 50000n,
        effectivePortionChange: 20000n,
        reclassifiedToPnl: 5000n,
        basisAdjustment: 3000n,
        currencyCode: 'USD',
      },
    ]);
    // closing = 50000 + 20000 - 5000 - 3000 = 62000
    expect(result.result[0]!.closingBalance).toBe(62000n);
    expect(result.result[0]!.netMovement).toBe(12000n);
  });

  it('handles negative effective portion', () => {
    const result = computeOciReserve([
      {
        hedgeId: 'h-2',
        openingOciReserve: 30000n,
        effectivePortionChange: -15000n,
        reclassifiedToPnl: 0n,
        basisAdjustment: 0n,
        currencyCode: 'USD',
      },
    ]);
    expect(result.result[0]!.closingBalance).toBe(15000n);
  });

  it('throws on empty input', () => {
    expect(() => computeOciReserve([])).toThrow('At least one');
  });
});
