import { describe, it, expect } from 'vitest';
import { identifyTemporaryDifferences } from '../calculators/temporary-differences.js';
import { computeDtaDtl } from '../calculators/dta-dtl.js';
import { computeRateChangeImpact } from '../calculators/rate-change-impact.js';
import { computeMovementSchedule } from '../calculators/movement-schedule.js';

// ── Temporary Differences ────────────────────────────────────────────────────

describe('identifyTemporaryDifferences', () => {
  it('identifies taxable difference (carrying > tax base)', () => {
    const result = identifyTemporaryDifferences([
      {
        itemId: 'dep-1',
        itemName: 'Equipment',
        origin: 'DEPRECIATION',
        carryingAmount: 100000n,
        taxBase: 80000n,
        currencyCode: 'USD',
      },
    ]);
    expect(result.result[0]!.type).toBe('TAXABLE');
    expect(result.result[0]!.difference).toBe(20000n);
    expect(result.result[0]!.absDifference).toBe(20000n);
  });

  it('identifies deductible difference (carrying < tax base)', () => {
    const result = identifyTemporaryDifferences([
      {
        itemId: 'prov-1',
        itemName: 'Provision',
        origin: 'PROVISIONS',
        carryingAmount: 50000n,
        taxBase: 70000n,
        currencyCode: 'USD',
      },
    ]);
    expect(result.result[0]!.type).toBe('DEDUCTIBLE');
    expect(result.result[0]!.absDifference).toBe(20000n);
  });

  it('throws on empty input', () => {
    expect(() => identifyTemporaryDifferences([])).toThrow('At least one');
  });
});

// ── DTA/DTL ──────────────────────────────────────────────────────────────────

describe('computeDtaDtl', () => {
  it('computes DTL from taxable difference', () => {
    const result = computeDtaDtl([
      {
        itemId: 'dep-1',
        tempDiffType: 'TAXABLE',
        origin: 'DEPRECIATION',
        absDifference: 20000n,
        taxRateBps: 2500,
        isProbableTaxableProfit: true,
        currencyCode: 'USD',
      },
    ]);
    // DTL = 20000 * 2500 / 10000 = 5000
    expect(result.result.totalDtl).toBe(5000n);
    expect(result.result.totalDta).toBe(0n);
    expect(result.result.items[0]!.deferredTaxLiability).toBe(5000n);
  });

  it('computes DTA from deductible difference when probable profit', () => {
    const result = computeDtaDtl([
      {
        itemId: 'prov-1',
        tempDiffType: 'DEDUCTIBLE',
        origin: 'PROVISIONS',
        absDifference: 30000n,
        taxRateBps: 3000,
        isProbableTaxableProfit: true,
        currencyCode: 'USD',
      },
    ]);
    // DTA = 30000 * 3000 / 10000 = 9000
    expect(result.result.totalDta).toBe(9000n);
    expect(result.result.items[0]!.isRecognized).toBe(true);
  });

  it('does not recognize DTA without probable taxable profit', () => {
    const result = computeDtaDtl([
      {
        itemId: 'loss-1',
        tempDiffType: 'DEDUCTIBLE',
        origin: 'TAX_LOSSES',
        absDifference: 100000n,
        taxRateBps: 2500,
        isProbableTaxableProfit: false,
        currencyCode: 'USD',
      },
    ]);
    expect(result.result.totalDta).toBe(0n);
    expect(result.result.items[0]!.isRecognized).toBe(false);
  });

  it('computes net deferred tax', () => {
    const result = computeDtaDtl([
      {
        itemId: 'dep-1',
        tempDiffType: 'TAXABLE',
        origin: 'DEPRECIATION',
        absDifference: 40000n,
        taxRateBps: 2500,
        isProbableTaxableProfit: true,
        currencyCode: 'USD',
      },
      {
        itemId: 'prov-1',
        tempDiffType: 'DEDUCTIBLE',
        origin: 'PROVISIONS',
        absDifference: 20000n,
        taxRateBps: 2500,
        isProbableTaxableProfit: true,
        currencyCode: 'USD',
      },
    ]);
    // DTL = 10000, DTA = 5000, net = -5000
    expect(result.result.totalDtl).toBe(10000n);
    expect(result.result.totalDta).toBe(5000n);
    expect(result.result.netDeferredTax).toBe(-5000n);
  });

  it('throws on empty input', () => {
    expect(() => computeDtaDtl([])).toThrow('At least one');
  });
});

// ── Rate Change Impact ───────────────────────────────────────────────────────

describe('computeRateChangeImpact', () => {
  it('computes P&L impact from rate increase', () => {
    const result = computeRateChangeImpact([
      {
        itemId: 'dep-1',
        temporaryDifference: 50000n,
        oldTaxRateBps: 2500,
        newTaxRateBps: 2800,
        isRecognizedInOci: false,
        currencyCode: 'USD',
      },
    ]);
    // Old = 50000*2500/10000=12500; New = 50000*2800/10000=14000; adj = 1500
    expect(result.result.items[0]!.adjustmentAmount).toBe(1500n);
    expect(result.result.totalPnlImpact).toBe(1500n);
    expect(result.result.totalOciImpact).toBe(0n);
  });

  it('routes to OCI when original was in OCI', () => {
    const result = computeRateChangeImpact([
      {
        itemId: 'hedge-1',
        temporaryDifference: 30000n,
        oldTaxRateBps: 2000,
        newTaxRateBps: 2500,
        isRecognizedInOci: true,
        currencyCode: 'USD',
      },
    ]);
    // adj = 30000*(2500-2000)/10000 = 1500
    expect(result.result.totalOciImpact).toBe(1500n);
    expect(result.result.totalPnlImpact).toBe(0n);
  });

  it('throws on empty input', () => {
    expect(() => computeRateChangeImpact([])).toThrow('At least one');
  });
});

// ── Movement Schedule ────────────────────────────────────────────────────────

describe('computeMovementSchedule', () => {
  it('computes closing balance and total P&L charge', () => {
    const result = computeMovementSchedule([
      {
        category: 'Depreciation',
        openingBalance: 10000n,
        recognizedInPnl: 2000n,
        recognizedInOci: 0n,
        rateChangeImpact: 500n,
        acquisitions: 1000n,
        disposals: 300n,
        fxTranslation: -200n,
        currencyCode: 'USD',
      },
    ]);
    // closing = 10000 + 2000 + 0 + 500 + 1000 - 300 + (-200) = 13000
    expect(result.result.rows[0]!.closingBalance).toBe(13000n);
    expect(result.result.totalPnlCharge).toBe(2000n);
    expect(result.result.totalOpening).toBe(10000n);
    expect(result.result.totalClosing).toBe(13000n);
  });

  it('handles multiple categories', () => {
    const result = computeMovementSchedule([
      {
        category: 'Depreciation',
        openingBalance: 10000n,
        recognizedInPnl: 1000n,
        recognizedInOci: 0n,
        rateChangeImpact: 0n,
        acquisitions: 0n,
        disposals: 0n,
        fxTranslation: 0n,
        currencyCode: 'USD',
      },
      {
        category: 'Provisions',
        openingBalance: -5000n,
        recognizedInPnl: -2000n,
        recognizedInOci: 0n,
        rateChangeImpact: 0n,
        acquisitions: 0n,
        disposals: 0n,
        fxTranslation: 0n,
        currencyCode: 'USD',
      },
    ]);
    expect(result.result.rows).toHaveLength(2);
    expect(result.result.totalOpening).toBe(5000n);
    expect(result.result.totalClosing).toBe(4000n);
    expect(result.result.totalPnlCharge).toBe(-1000n);
  });

  it('throws on empty input', () => {
    expect(() => computeMovementSchedule([])).toThrow('At least one');
  });
});
