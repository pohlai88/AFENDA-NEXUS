import { describe, it, expect } from 'vitest';
import { computeEquityMethod, type EquityMethodInput } from '../calculators/equity-method.js';

const baseInput: EquityMethodInput = {
  associateEntityId: 'assoc-a',
  ownershipPctBps: 3000, // 30%
  investmentCostAtAcquisition: 300_000n,
  openingCarryingAmount: 300_000n,
  associateProfitOrLoss: 200_000n,
  associateOci: 0n,
  dividendsReceived: 0n,
  impairmentLoss: 0n,
  upstreamUnrealizedProfit: 0n,
  downstreamUnrealizedProfit: 0n,
  currencyCode: 'USD',
};

describe('computeEquityMethod', () => {
  it('computes share of associate profit', () => {
    const { result } = computeEquityMethod([baseInput]);
    const r = result[0]!;

    // 30% of 200,000 = 60,000
    expect(r.shareOfProfitOrLoss).toBe(60_000n);
    expect(r.closingCarryingAmount).toBe(360_000n); // 300k + 60k
    expect(r.periodAdjustment).toBe(60_000n);
    expect(r.reducedToZero).toBe(false);
  });

  it('computes share of associate loss', () => {
    const { result } = computeEquityMethod([{ ...baseInput, associateProfitOrLoss: -100_000n }]);
    const r = result[0]!;

    // 30% of -100,000 = -30,000
    expect(r.shareOfProfitOrLoss).toBe(-30_000n);
    expect(r.closingCarryingAmount).toBe(270_000n); // 300k - 30k
  });

  it('computes share of OCI', () => {
    const { result } = computeEquityMethod([{ ...baseInput, associateOci: 50_000n }]);
    const r = result[0]!;

    // 30% of 50,000 = 15,000
    expect(r.shareOfOci).toBe(15_000n);
    expect(r.closingCarryingAmount).toBe(375_000n); // 300k + 60k P&L + 15k OCI
  });

  it('reduces carrying amount by dividends received', () => {
    const { result } = computeEquityMethod([{ ...baseInput, dividendsReceived: 20_000n }]);
    const r = result[0]!;

    // 300k + 60k P&L - 20k dividends = 340k
    expect(r.dividendsReceived).toBe(20_000n);
    expect(r.closingCarryingAmount).toBe(340_000n);
  });

  it('applies impairment loss', () => {
    const { result } = computeEquityMethod([{ ...baseInput, impairmentLoss: 50_000n }]);
    const r = result[0]!;

    // 300k + 60k P&L - 50k impairment = 310k
    expect(r.impairmentLoss).toBe(50_000n);
    expect(r.closingCarryingAmount).toBe(310_000n);
  });

  it('eliminates upstream unrealized profit', () => {
    const { result } = computeEquityMethod([{ ...baseInput, upstreamUnrealizedProfit: 40_000n }]);
    const r = result[0]!;

    // Upstream elimination: 30% of 40,000 = 12,000
    expect(r.upstreamElimination).toBe(12_000n);
    // 300k + 60k P&L - 12k elimination = 348k
    expect(r.closingCarryingAmount).toBe(348_000n);
  });

  it('eliminates downstream unrealized profit', () => {
    const { result } = computeEquityMethod([{ ...baseInput, downstreamUnrealizedProfit: 30_000n }]);
    const r = result[0]!;

    // Downstream elimination: 30% of 30,000 = 9,000
    expect(r.downstreamElimination).toBe(9_000n);
    // 300k + 60k P&L - 9k elimination = 351k
    expect(r.closingCarryingAmount).toBe(351_000n);
  });

  it('caps carrying amount at zero per IAS 28.38', () => {
    const { result } = computeEquityMethod([
      {
        ...baseInput,
        openingCarryingAmount: 50_000n,
        associateProfitOrLoss: -500_000n, // 30% = -150,000 → would go to -100k
      },
    ]);
    const r = result[0]!;

    expect(r.shareOfProfitOrLoss).toBe(-150_000n);
    expect(r.closingCarryingAmount).toBe(0n);
    expect(r.reducedToZero).toBe(true);
  });

  it('handles multiple associates', () => {
    const { result } = computeEquityMethod([
      baseInput,
      {
        ...baseInput,
        associateEntityId: 'assoc-b',
        ownershipPctBps: 2500, // 25%
        openingCarryingAmount: 250_000n,
        associateProfitOrLoss: 100_000n,
      },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]!.associateEntityId).toBe('assoc-a');
    expect(result[1]!.associateEntityId).toBe('assoc-b');
    // 25% of 100,000 = 25,000
    expect(result[1]!.shareOfProfitOrLoss).toBe(25_000n);
    expect(result[1]!.closingCarryingAmount).toBe(275_000n);
  });

  it('handles combined adjustments', () => {
    const { result } = computeEquityMethod([
      {
        ...baseInput,
        associateProfitOrLoss: 200_000n, // share: 60k
        associateOci: 20_000n, // share: 6k
        dividendsReceived: 15_000n, // -15k
        impairmentLoss: 10_000n, // -10k
        upstreamUnrealizedProfit: 10_000n, // elimination: 3k
        downstreamUnrealizedProfit: 5_000n, // elimination: 1.5k → 1k (truncated)
      },
    ]);
    const r = result[0]!;

    expect(r.shareOfProfitOrLoss).toBe(60_000n);
    expect(r.shareOfOci).toBe(6_000n);
    expect(r.upstreamElimination).toBe(3_000n);
    expect(r.downstreamElimination).toBe(1_500n);
    // Period adjustment: 60k + 6k - 15k - 10k - 3k - 1.5k = 36.5k → 36500
    expect(r.periodAdjustment).toBe(36_500n);
    expect(r.closingCarryingAmount).toBe(336_500n);
  });

  it('throws on invalid ownership BPS', () => {
    expect(() => computeEquityMethod([{ ...baseInput, ownershipPctBps: 11000 }])).toThrow(
      'Invalid ownership BPS'
    );
  });

  it('throws on empty input', () => {
    expect(() => computeEquityMethod([])).toThrow('At least one associate required');
  });

  it('provides audit explanation', () => {
    const calc = computeEquityMethod([baseInput]);
    expect(calc.explanation).toContain('Equity method');
    expect(calc.explanation).toContain('1 associates');
    expect(calc.inputs.associateCount).toBe(1);
  });
});
