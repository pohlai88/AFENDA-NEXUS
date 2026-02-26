import { describe, it, expect } from 'vitest';
import { assessGoingConcern, type GoingConcernInput } from '../going-concern.js';

const healthyInput: GoingConcernInput = {
  projectedCashFlow12m: 500_000n,
  debtMaturingWithin12m: 200_000n,
  cashAndEquivalents: 300_000n,
  undrawnFacilities: 100_000n,
  currentAssets: 800_000n,
  currentLiabilities: 400_000n,
  netProfitLoss: 150_000n,
  accumulatedLosses: 0n,
  totalEquity: 600_000n,
  totalAssets: 1_200_000n,
};

describe('assessGoingConcern', () => {
  it('returns NO_MATERIAL_UNCERTAINTY for healthy company', () => {
    const { result } = assessGoingConcern(healthyInput);

    expect(result.conclusion).toBe('NO_MATERIAL_UNCERTAINTY');
    expect(result.riskScore).toBeLessThan(26);
    expect(result.cashFlowAdequacy.isAdequate).toBe(true);
    expect(result.workingCapitalPosition.isPositive).toBe(true);
    expect(result.covenantSummary.breachedCount).toBe(0);
  });

  it('detects net current liability position', () => {
    const { result } = assessGoingConcern({
      ...healthyInput,
      currentAssets: 200_000n,
      currentLiabilities: 500_000n,
    });

    const indicator = result.indicators.find((i) =>
      i.description.includes('working capital deficit')
    );
    expect(indicator).toBeDefined();
    expect(indicator!.severity).toBe('HIGH');
    expect(result.workingCapitalPosition.isPositive).toBe(false);
  });

  it('detects operating loss', () => {
    const { result } = assessGoingConcern({
      ...healthyInput,
      netProfitLoss: -50_000n,
    });

    const indicator = result.indicators.find((i) => i.description.includes('Net loss'));
    expect(indicator).toBeDefined();
    expect(indicator!.severity).toBe('MEDIUM');
  });

  it('detects accumulated losses exceeding equity', () => {
    const { result } = assessGoingConcern({
      ...healthyInput,
      accumulatedLosses: 700_000n,
      totalEquity: 600_000n,
    });

    const indicator = result.indicators.find((i) => i.description.includes('negative net worth'));
    expect(indicator).toBeDefined();
    expect(indicator!.severity).toBe('HIGH');
  });

  it('detects cash flow inadequacy', () => {
    const { result } = assessGoingConcern({
      ...healthyInput,
      projectedCashFlow12m: -100_000n,
      cashAndEquivalents: 50_000n,
      undrawnFacilities: 0n,
      debtMaturingWithin12m: 500_000n,
    });

    expect(result.cashFlowAdequacy.isAdequate).toBe(false);
    const indicator = result.indicators.find((i) =>
      i.description.includes('Insufficient liquidity')
    );
    expect(indicator).toBeDefined();
    expect(indicator!.severity).toBe('HIGH');
  });

  it('detects tight liquidity coverage (<1.2x)', () => {
    const { result } = assessGoingConcern({
      ...healthyInput,
      projectedCashFlow12m: 50_000n,
      cashAndEquivalents: 100_000n,
      undrawnFacilities: 50_000n,
      debtMaturingWithin12m: 180_000n,
    });

    // Total liquidity: 200k, debt: 180k → coverage ~1.11x
    expect(result.cashFlowAdequacy.isAdequate).toBe(true);
    const indicator = result.indicators.find((i) => i.description.includes('below 1.2x'));
    expect(indicator).toBeDefined();
  });

  it('detects negative equity', () => {
    const { result } = assessGoingConcern({
      ...healthyInput,
      totalEquity: -100_000n,
    });

    const indicator = result.indicators.find((i) =>
      i.description.includes('Negative total equity')
    );
    expect(indicator).toBeDefined();
    expect(indicator!.severity).toBe('HIGH');
  });

  it('handles covenant breaches', () => {
    const { result } = assessGoingConcern({
      ...healthyInput,
      covenantBreaches: [
        { covenantName: 'D/E Ratio', isBreached: true, waiverObtained: false },
        { covenantName: 'DSCR', isBreached: true, waiverObtained: true },
        { covenantName: 'Current Ratio', isBreached: false, waiverObtained: false },
      ],
    });

    expect(result.covenantSummary.totalCovenants).toBe(3);
    expect(result.covenantSummary.breachedCount).toBe(2);
    expect(result.covenantSummary.waivedCount).toBe(1);
    expect(result.covenantSummary.unresolved).toBe(1);

    const indicator = result.indicators.find((i) => i.description.includes('unresolved covenant'));
    expect(indicator).toBeDefined();
  });

  it('handles subsequent events', () => {
    const { result } = assessGoingConcern({
      ...healthyInput,
      subsequentEvents: [
        { description: 'Loss of major customer', impactSeverity: 'HIGH' },
        { description: 'Minor regulatory fine', impactSeverity: 'LOW' },
      ],
    });

    const highEvent = result.indicators.find((i) =>
      i.description.includes('Loss of major customer')
    );
    expect(highEvent).toBeDefined();
    expect(highEvent!.severity).toBe('HIGH');
  });

  it('returns MATERIAL_UNCERTAINTY_EXISTS for moderate risk', () => {
    // Combine several medium indicators to push score above 51
    const { result } = assessGoingConcern({
      ...healthyInput,
      currentAssets: 200_000n,
      currentLiabilities: 500_000n, // +15
      netProfitLoss: -50_000n, // +10
      accumulatedLosses: 700_000n,
      totalEquity: 600_000n, // +20
      // +10 for tight liquidity
      projectedCashFlow12m: 50_000n,
      cashAndEquivalents: 100_000n,
      undrawnFacilities: 50_000n,
      debtMaturingWithin12m: 180_000n,
    });

    expect(result.conclusion).toBe('MATERIAL_UNCERTAINTY_EXISTS');
    expect(result.riskScore).toBeGreaterThanOrEqual(51);
    expect(result.riskScore).toBeLessThan(76);
  });

  it('returns GOING_CONCERN_DOUBT for severe risk', () => {
    const { result } = assessGoingConcern({
      ...healthyInput,
      currentAssets: 100_000n,
      currentLiabilities: 500_000n, // +15
      netProfitLoss: -200_000n, // +10
      accumulatedLosses: 800_000n,
      totalEquity: -100_000n, // +20 (negative equity) + +20 (acc losses > equity)
      projectedCashFlow12m: -300_000n,
      cashAndEquivalents: 50_000n,
      undrawnFacilities: 0n,
      debtMaturingWithin12m: 600_000n, // +25 (inadequate)
      covenantBreaches: [
        { covenantName: 'D/E', isBreached: true, waiverObtained: false }, // +15
      ],
    });

    expect(result.conclusion).toBe('GOING_CONCERN_DOUBT');
    expect(result.riskScore).toBeGreaterThanOrEqual(76);
  });

  it('caps risk score at 100', () => {
    const { result } = assessGoingConcern({
      ...healthyInput,
      currentAssets: 10_000n,
      currentLiabilities: 500_000n,
      netProfitLoss: -500_000n,
      accumulatedLosses: 2_000_000n,
      totalEquity: -500_000n,
      projectedCashFlow12m: -1_000_000n,
      cashAndEquivalents: 5_000n,
      undrawnFacilities: 0n,
      debtMaturingWithin12m: 2_000_000n,
      covenantBreaches: [
        { covenantName: 'A', isBreached: true, waiverObtained: false },
        { covenantName: 'B', isBreached: true, waiverObtained: false },
        { covenantName: 'C', isBreached: true, waiverObtained: false },
      ],
      subsequentEvents: [{ description: 'Fraud discovered', impactSeverity: 'HIGH' }],
    });

    expect(result.riskScore).toBe(100);
  });

  it('provides audit explanation', () => {
    const calc = assessGoingConcern(healthyInput);
    expect(calc.explanation).toContain('Going concern');
    expect(calc.explanation).toContain('risk score');
    expect(calc.explanation).toContain('liquidity headroom');
    expect(calc.explanation).toContain('NWC=');
  });
});
