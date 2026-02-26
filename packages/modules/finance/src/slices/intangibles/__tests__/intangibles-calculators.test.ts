import { describe, it, expect } from 'vitest';
import { checkRecognition } from '../calculators/recognition.js';
import { computeAmortization } from '../calculators/amortization.js';
import { classifySoftwareCosts } from '../calculators/software-capitalization.js';

// ── Recognition ──────────────────────────────────────────────────────────────

describe('checkRecognition', () => {
  const baseInput = {
    assetId: 'ia-1',
    amount: 100000n,
    currencyCode: 'USD',
    isIdentifiable: true,
    hasControl: true,
    hasFutureEconomicBenefit: true,
    isTechnicallyFeasible: true,
    hasIntentionToComplete: true,
    hasAbilityToUseOrSell: true,
    canMeasureReliably: true,
    hasAdequateResources: true,
  };

  it('expenses research phase expenditure', () => {
    const result = checkRecognition([{ ...baseInput, expenditurePhase: 'RESEARCH' }]);
    expect(result.result[0]!.canCapitalize).toBe(false);
    expect(result.result[0]!.expenseAmount).toBe(100000n);
  });

  it('capitalizes development phase when all criteria met', () => {
    const result = checkRecognition([{ ...baseInput, expenditurePhase: 'DEVELOPMENT' }]);
    expect(result.result[0]!.canCapitalize).toBe(true);
    expect(result.result[0]!.capitalizeAmount).toBe(100000n);
  });

  it('rejects development if not technically feasible', () => {
    const result = checkRecognition([
      { ...baseInput, expenditurePhase: 'DEVELOPMENT', isTechnicallyFeasible: false },
    ]);
    expect(result.result[0]!.canCapitalize).toBe(false);
    expect(result.result[0]!.failedCriteria).toContain('Not technically feasible');
  });

  it('capitalizes acquired intangibles meeting general criteria', () => {
    const result = checkRecognition([{ ...baseInput, expenditurePhase: 'ACQUISITION' }]);
    expect(result.result[0]!.canCapitalize).toBe(true);
  });

  it('rejects if not identifiable', () => {
    const result = checkRecognition([
      { ...baseInput, expenditurePhase: 'ACQUISITION', isIdentifiable: false },
    ]);
    expect(result.result[0]!.canCapitalize).toBe(false);
    expect(result.result[0]!.failedCriteria).toContain('Not identifiable');
  });

  it('throws on empty input', () => {
    expect(() => checkRecognition([])).toThrow('At least one');
  });
});

// ── Amortization ─────────────────────────────────────────────────────────────

describe('computeAmortization', () => {
  it('computes straight-line amortization for finite life', () => {
    const result = computeAmortization([
      {
        assetId: 'ia-1',
        usefulLifeType: 'FINITE',
        acquisitionCost: 120000n,
        residualValue: 0n,
        usefulLifeMonths: 60,
        amortizationMethod: 'STRAIGHT_LINE',
        accumulatedAmortization: 0n,
        periodMonths: 12,
      },
    ]);
    // 120000 * 12 / 60 = 24000
    expect(result.result[0]!.amortizationAmount).toBe(24000n);
    expect(result.result[0]!.newNetBookValue).toBe(96000n);
    expect(result.result[0]!.requiresImpairmentTest).toBe(false);
  });

  it('returns zero for indefinite-life and flags impairment test', () => {
    const result = computeAmortization([
      {
        assetId: 'ia-2',
        usefulLifeType: 'INDEFINITE',
        acquisitionCost: 500000n,
        residualValue: 0n,
        usefulLifeMonths: null,
        amortizationMethod: null,
        accumulatedAmortization: 0n,
        periodMonths: 12,
      },
    ]);
    expect(result.result[0]!.amortizationAmount).toBe(0n);
    expect(result.result[0]!.requiresImpairmentTest).toBe(true);
    expect(result.result[0]!.newNetBookValue).toBe(500000n);
  });

  it('caps amortization at residual value', () => {
    const result = computeAmortization([
      {
        assetId: 'ia-3',
        usefulLifeType: 'FINITE',
        acquisitionCost: 100000n,
        residualValue: 10000n,
        usefulLifeMonths: 12,
        amortizationMethod: 'STRAIGHT_LINE',
        accumulatedAmortization: 85000n,
        periodMonths: 12,
      },
    ]);
    // Max amort = (100000 - 85000) - 10000 = 5000
    expect(result.result[0]!.amortizationAmount).toBe(5000n);
    expect(result.result[0]!.isFullyAmortized).toBe(true);
  });

  it('throws on empty input', () => {
    expect(() => computeAmortization([])).toThrow('At least one');
  });
});

// ── Software Capitalization ──────────────────────────────────────────────────

describe('classifySoftwareCosts', () => {
  it('capitalizes application development if feasible', () => {
    const result = classifySoftwareCosts([
      {
        projectId: 'sw-1',
        phase: 'APPLICATION_DEVELOPMENT',
        amount: 50000n,
        currencyCode: 'USD',
        costType: 'INTERNAL_LABOR',
        isTechnicallyFeasible: true,
      },
    ]);
    expect(result.result[0]!.capitalizeAmount).toBe(50000n);
  });

  it('expenses preliminary phase costs', () => {
    const result = classifySoftwareCosts([
      {
        projectId: 'sw-1',
        phase: 'PRELIMINARY',
        amount: 20000n,
        currencyCode: 'USD',
        costType: 'EXTERNAL_SERVICES',
        isTechnicallyFeasible: true,
      },
    ]);
    expect(result.result[0]!.expenseAmount).toBe(20000n);
    expect(result.result[0]!.capitalizeAmount).toBe(0n);
  });

  it('always expenses hosting costs regardless of phase', () => {
    const result = classifySoftwareCosts([
      {
        projectId: 'sw-1',
        phase: 'APPLICATION_DEVELOPMENT',
        amount: 10000n,
        currencyCode: 'USD',
        costType: 'HOSTING',
        isTechnicallyFeasible: true,
      },
    ]);
    expect(result.result[0]!.expenseAmount).toBe(10000n);
  });

  it('throws on empty input', () => {
    expect(() => classifySoftwareCosts([])).toThrow('At least one');
  });
});
