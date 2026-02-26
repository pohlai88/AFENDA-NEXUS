import { describe, it, expect } from 'vitest';
import {
  computeDepreciation,
  computeBatchDepreciation,
} from '../slices/fixed-assets/calculators/depreciation.js';
import { splitAssetComponents } from '../slices/fixed-assets/calculators/component-accounting.js';
import { computeRevaluation } from '../slices/fixed-assets/calculators/revaluation.js';
import { computeImpairment } from '../slices/fixed-assets/calculators/impairment.js';
import { computeDisposal } from '../slices/fixed-assets/calculators/disposal.js';

// ─── FA-02: Depreciation ───────────────────────────────────────────────────

describe('computeDepreciation', () => {
  it('straight-line: equal monthly depreciation', () => {
    const result = computeDepreciation({
      assetId: 'a1',
      acquisitionCost: 120000n,
      residualValue: 0n,
      usefulLifeMonths: 120,
      depreciationMethod: 'STRAIGHT_LINE',
      accumulatedDepreciation: 0n,
      periodMonths: 1,
    });
    expect(result.depreciationAmount).toBe(1000n); // 120,000 / 120
    expect(result.newAccumulatedDepreciation).toBe(1000n);
    expect(result.newNetBookValue).toBe(119000n);
    expect(result.isFullyDepreciated).toBe(false);
  });

  it('straight-line: caps at residual value', () => {
    const result = computeDepreciation({
      assetId: 'a1',
      acquisitionCost: 120000n,
      residualValue: 20000n,
      usefulLifeMonths: 120,
      depreciationMethod: 'STRAIGHT_LINE',
      accumulatedDepreciation: 99500n, // NBV = 20,500
      periodMonths: 1,
    });
    // Monthly depr = (120,000 - 20,000) / 120 = 833
    // But max = NBV - residual = 20,500 - 20,000 = 500
    expect(result.depreciationAmount).toBe(500n);
    expect(result.isFullyDepreciated).toBe(true);
  });

  it('declining-balance: applies rate to current NBV', () => {
    const result = computeDepreciation({
      assetId: 'a1',
      acquisitionCost: 100000n,
      residualValue: 10000n,
      usefulLifeMonths: 60,
      depreciationMethod: 'DECLINING_BALANCE',
      accumulatedDepreciation: 0n,
      periodMonths: 12,
      decliningRateBps: 2000, // 20%
    });
    // Annual depr = 100,000 * 20% = 20,000
    expect(result.depreciationAmount).toBe(20000n);
    expect(result.newNetBookValue).toBe(80000n);
  });

  it('units-of-production: proportional to units used', () => {
    const result = computeDepreciation({
      assetId: 'a1',
      acquisitionCost: 500000n,
      residualValue: 50000n,
      usefulLifeMonths: 60,
      depreciationMethod: 'UNITS_OF_PRODUCTION',
      accumulatedDepreciation: 0n,
      periodMonths: 1,
      totalEstimatedUnits: 10000,
      unitsThisPeriod: 500,
    });
    // (500,000 - 50,000) * 500 / 10,000 = 22,500
    expect(result.depreciationAmount).toBe(22500n);
  });

  it('returns zero when already fully depreciated', () => {
    const result = computeDepreciation({
      assetId: 'a1',
      acquisitionCost: 100000n,
      residualValue: 10000n,
      usefulLifeMonths: 60,
      depreciationMethod: 'STRAIGHT_LINE',
      accumulatedDepreciation: 90000n, // NBV = residual
      periodMonths: 1,
    });
    expect(result.depreciationAmount).toBe(0n);
    expect(result.isFullyDepreciated).toBe(true);
  });
});

describe('computeBatchDepreciation', () => {
  it('processes multiple assets', () => {
    const results = computeBatchDepreciation([
      {
        assetId: 'a1',
        acquisitionCost: 120000n,
        residualValue: 0n,
        usefulLifeMonths: 120,
        depreciationMethod: 'STRAIGHT_LINE',
        accumulatedDepreciation: 0n,
        periodMonths: 1,
      },
      {
        assetId: 'a2',
        acquisitionCost: 60000n,
        residualValue: 0n,
        usefulLifeMonths: 60,
        depreciationMethod: 'STRAIGHT_LINE',
        accumulatedDepreciation: 0n,
        periodMonths: 1,
      },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0]!.depreciationAmount).toBe(1000n);
    expect(results[1]!.depreciationAmount).toBe(1000n);
  });
});

// ─── FA-04: Component Accounting ───────────────────────────────────────────

describe('splitAssetComponents', () => {
  it('validates components sum to total cost', () => {
    const result = splitAssetComponents({
      assetId: 'a1',
      totalCost: 100000n,
      components: [
        {
          name: 'Engine',
          costPortion: 60000n,
          residualValue: 5000n,
          usefulLifeMonths: 120,
          depreciationMethod: 'STRAIGHT_LINE',
        },
        {
          name: 'Body',
          costPortion: 40000n,
          residualValue: 2000n,
          usefulLifeMonths: 180,
          depreciationMethod: 'STRAIGHT_LINE',
        },
      ],
    });
    expect(result.isValid).toBe(true);
    expect(result.unallocated).toBe(0n);
    expect(result.errors).toHaveLength(0);
  });

  it('detects unallocated amount', () => {
    const result = splitAssetComponents({
      assetId: 'a1',
      totalCost: 100000n,
      components: [
        {
          name: 'Engine',
          costPortion: 50000n,
          residualValue: 0n,
          usefulLifeMonths: 120,
          depreciationMethod: 'STRAIGHT_LINE',
        },
      ],
    });
    expect(result.isValid).toBe(false);
    expect(result.unallocated).toBe(50000n);
  });

  it('detects residual exceeding cost', () => {
    const result = splitAssetComponents({
      assetId: 'a1',
      totalCost: 100000n,
      components: [
        {
          name: 'Engine',
          costPortion: 100000n,
          residualValue: 200000n,
          usefulLifeMonths: 120,
          depreciationMethod: 'STRAIGHT_LINE',
        },
      ],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('residual exceeds cost'))).toBe(true);
  });
});

// ─── FA-05: Revaluation ────────────────────────────────────────────────────

describe('computeRevaluation', () => {
  it('surplus → OCI', () => {
    const result = computeRevaluation({
      assetId: 'a1',
      currentNbv: 80000n,
      fairValue: 100000n,
      previousRevaluationSurplus: 0n,
      currencyCode: 'USD',
    });
    expect(result.effect).toBe('SURPLUS_TO_OCI');
    expect(result.revaluationAmount).toBe(20000n);
    expect(result.ociImpact).toBe(20000n);
    expect(result.plImpact).toBe(0n);
    expect(result.newRevaluationSurplus).toBe(20000n);
  });

  it('deficit fully offset by existing surplus', () => {
    const result = computeRevaluation({
      assetId: 'a1',
      currentNbv: 100000n,
      fairValue: 85000n,
      previousRevaluationSurplus: 20000n,
      currencyCode: 'USD',
    });
    expect(result.effect).toBe('DEFICIT_REVERSAL_FROM_OCI');
    expect(result.ociImpact).toBe(-15000n);
    expect(result.plImpact).toBe(0n);
    expect(result.newRevaluationSurplus).toBe(5000n);
  });

  it('deficit partially offset → remainder to P&L', () => {
    const result = computeRevaluation({
      assetId: 'a1',
      currentNbv: 100000n,
      fairValue: 70000n,
      previousRevaluationSurplus: 10000n,
      currencyCode: 'USD',
    });
    expect(result.effect).toBe('DEFICIT_TO_PL');
    expect(result.ociImpact).toBe(-10000n);
    expect(result.plImpact).toBe(-20000n);
    expect(result.newRevaluationSurplus).toBe(0n);
  });

  it('no change when fair value equals NBV', () => {
    const result = computeRevaluation({
      assetId: 'a1',
      currentNbv: 80000n,
      fairValue: 80000n,
      previousRevaluationSurplus: 5000n,
      currencyCode: 'USD',
    });
    expect(result.effect).toBe('NO_CHANGE');
    expect(result.revaluationAmount).toBe(0n);
  });
});

// ─── FA-06: Impairment ─────────────────────────────────────────────────────

describe('computeImpairment', () => {
  it('impairment when carrying > recoverable', () => {
    const result = computeImpairment({
      assetId: 'a1',
      carryingAmount: 100000n,
      fairValueLessCostsOfDisposal: 70000n,
      valueInUse: 75000n,
      currencyCode: 'USD',
    });
    expect(result.isImpaired).toBe(true);
    expect(result.recoverableAmount).toBe(75000n); // max(70k, 75k)
    expect(result.impairmentLoss).toBe(25000n);
    expect(result.newCarryingAmount).toBe(75000n);
  });

  it('no impairment when recoverable >= carrying', () => {
    const result = computeImpairment({
      assetId: 'a1',
      carryingAmount: 80000n,
      fairValueLessCostsOfDisposal: 90000n,
      valueInUse: 85000n,
      currencyCode: 'USD',
    });
    expect(result.isImpaired).toBe(false);
    expect(result.impairmentLoss).toBe(0n);
    expect(result.newCarryingAmount).toBe(80000n);
  });
});

// ─── FA-07: Disposal ───────────────────────────────────────────────────────

describe('computeDisposal', () => {
  it('gain on disposal', () => {
    const result = computeDisposal({
      assetId: 'a1',
      netBookValue: 50000n,
      disposalProceeds: 80000n,
      disposalCosts: 5000n,
      currencyCode: 'USD',
    });
    expect(result.isGain).toBe(true);
    expect(result.netProceeds).toBe(75000n);
    expect(result.gainOrLoss).toBe(25000n);
  });

  it('loss on disposal', () => {
    const result = computeDisposal({
      assetId: 'a1',
      netBookValue: 50000n,
      disposalProceeds: 30000n,
      disposalCosts: 5000n,
      currencyCode: 'USD',
    });
    expect(result.isGain).toBe(false);
    expect(result.netProceeds).toBe(25000n);
    expect(result.gainOrLoss).toBe(-25000n);
  });

  it('zero gain when proceeds equal NBV + costs', () => {
    const result = computeDisposal({
      assetId: 'a1',
      netBookValue: 50000n,
      disposalProceeds: 55000n,
      disposalCosts: 5000n,
      currencyCode: 'USD',
    });
    expect(result.isGain).toBe(true);
    expect(result.gainOrLoss).toBe(0n);
  });
});
