import { describe, it, expect } from 'vitest';
import { computeEps } from '../eps-calculator.js';

describe('computeEps', () => {
  it('computes basic EPS correctly', () => {
    // Net profit 1,000,000, no pref dividends, 100,000 shares
    // Basic EPS = 1,000,000 / 100,000 = 10.0000 → 100000 basis points
    const { result } = computeEps({
      netProfit: 1_000_000n,
      preferenceDividends: 0n,
      weightedAverageShares: 100_000n,
    });

    expect(result.basicEps).toBe(100000n); // 10.0000 in basis points
    expect(result.dilutedEps).toBe(100000n);
    expect(result.isDilutive).toBe(false);
    expect(result.earningsForBasic).toBe(1_000_000n);
  });

  it('deducts preference dividends from basic EPS', () => {
    // Net profit 1,000,000, pref dividends 200,000, 100,000 shares
    // Basic EPS = (1,000,000 - 200,000) / 100,000 = 8.0000 → 80000
    const { result } = computeEps({
      netProfit: 1_000_000n,
      preferenceDividends: 200_000n,
      weightedAverageShares: 100_000n,
    });

    expect(result.basicEps).toBe(80000n);
    expect(result.earningsForBasic).toBe(800_000n);
  });

  it('includes dilutive instruments that decrease EPS', () => {
    // Basic: (1,000,000 - 0) / 100,000 = 10.0000
    // Options: 20,000 shares, 0 earnings adj → incremental EPS = 0
    // Including: 1,000,000 / 120,000 = 8.3333 → dilutive
    const { result } = computeEps({
      netProfit: 1_000_000n,
      preferenceDividends: 0n,
      weightedAverageShares: 100_000n,
      dilutivePotentialShares: [
        {
          name: 'Stock Options',
          potentialShares: 20_000n,
          earningsAdjustment: 0n,
        },
      ],
    });

    expect(result.basicEps).toBe(100000n);
    expect(result.dilutedEps).toBe(83333n); // 1,000,000 * 10000 / 120,000
    expect(result.isDilutive).toBe(true);
    expect(result.sharesForDiluted).toBe(120_000n);
    expect(result.dilutiveBreakdown).toHaveLength(1);
    expect(result.dilutiveBreakdown[0]!.isDilutive).toBe(true);
  });

  it('excludes anti-dilutive instruments', () => {
    // Basic: (500,000 - 0) / 100,000 = 5.0000 → 50000
    // Convertible bond: 10,000 shares, 80,000 earnings adj
    // Incremental EPS = 80,000 / 10,000 = 8.0000 → 80000 > basic → anti-dilutive
    const { result } = computeEps({
      netProfit: 500_000n,
      preferenceDividends: 0n,
      weightedAverageShares: 100_000n,
      dilutivePotentialShares: [
        {
          name: 'Convertible Bond',
          potentialShares: 10_000n,
          earningsAdjustment: 80_000n,
        },
      ],
    });

    expect(result.basicEps).toBe(50000n);
    // Anti-dilutive instrument excluded, diluted = basic
    expect(result.dilutedEps).toBe(50000n);
    expect(result.isDilutive).toBe(false);
    expect(result.dilutiveBreakdown[0]!.isDilutive).toBe(false);
    expect(result.sharesForDiluted).toBe(100_000n);
  });

  it('ranks instruments by incremental EPS (most dilutive first)', () => {
    // Basic: 1,000,000 / 100,000 = 10.0000
    // Instrument A: 10,000 shares, 50,000 earnings → incremental = 5.0000
    // Instrument B: 20,000 shares, 0 earnings → incremental = 0.0000
    // B should be included first (more dilutive), then A
    const { result } = computeEps({
      netProfit: 1_000_000n,
      preferenceDividends: 0n,
      weightedAverageShares: 100_000n,
      dilutivePotentialShares: [
        {
          name: 'Convertible A',
          potentialShares: 10_000n,
          earningsAdjustment: 50_000n,
        },
        {
          name: 'Options B',
          potentialShares: 20_000n,
          earningsAdjustment: 0n,
        },
      ],
    });

    // Both should be dilutive
    expect(result.dilutiveBreakdown).toHaveLength(2);
    // Options B (incremental 0) ranked first
    expect(result.dilutiveBreakdown[0]!.name).toBe('Options B');
    expect(result.dilutiveBreakdown[1]!.name).toBe('Convertible A');
    // Diluted: (1,000,000 + 0 + 50,000) / (100,000 + 20,000 + 10,000) = 1,050,000 / 130,000 = 8.0769
    expect(result.dilutedEps).toBe(80769n);
    expect(result.isDilutive).toBe(true);
  });

  it('handles mixed dilutive and anti-dilutive instruments', () => {
    // Basic: 400,000 / 100,000 = 4.0000 → 40000
    // Options: 20,000 shares, 0 adj → incremental = 0 → dilutive
    // Convertible: 5,000 shares, 30,000 adj → incremental = 6.0 → anti-dilutive
    const { result } = computeEps({
      netProfit: 400_000n,
      preferenceDividends: 0n,
      weightedAverageShares: 100_000n,
      dilutivePotentialShares: [
        {
          name: 'Options',
          potentialShares: 20_000n,
          earningsAdjustment: 0n,
        },
        {
          name: 'Convertible',
          potentialShares: 5_000n,
          earningsAdjustment: 30_000n,
        },
      ],
    });

    expect(result.basicEps).toBe(40000n);
    // After Options: 400,000 / 120,000 = 3.3333 → dilutive
    // After Convertible test: (400,000 + 30,000) / (120,000 + 5,000) = 430,000/125,000 = 3.44 → anti-dilutive (> 3.3333)
    expect(result.dilutiveBreakdown.find((d) => d.name === 'Options')!.isDilutive).toBe(true);
    expect(result.dilutiveBreakdown.find((d) => d.name === 'Convertible')!.isDilutive).toBe(false);
    // Diluted only includes Options
    expect(result.sharesForDiluted).toBe(120_000n);
    expect(result.dilutedEps).toBe(33333n);
  });

  it('handles no dilutive instruments', () => {
    const { result } = computeEps({
      netProfit: 500_000n,
      preferenceDividends: 50_000n,
      weightedAverageShares: 100_000n,
    });

    expect(result.basicEps).toBe(45000n);
    expect(result.dilutedEps).toBe(45000n);
    expect(result.isDilutive).toBe(false);
    expect(result.dilutiveBreakdown).toHaveLength(0);
  });

  it('handles loss scenario (negative EPS)', () => {
    // Loss: -200,000, pref div: 50,000, shares: 100,000
    // Basic EPS = (-200,000 - 50,000) / 100,000 = -2.5 → -25000
    const { result } = computeEps({
      netProfit: -200_000n,
      preferenceDividends: 50_000n,
      weightedAverageShares: 100_000n,
    });

    expect(result.basicEps).toBe(-25000n);
    expect(result.earningsForBasic).toBe(-250_000n);
  });

  it('throws on zero shares', () => {
    expect(() =>
      computeEps({
        netProfit: 100_000n,
        preferenceDividends: 0n,
        weightedAverageShares: 0n,
      })
    ).toThrow('Weighted average shares must be positive');
  });

  it('provides audit explanation', () => {
    const calc = computeEps({
      netProfit: 1_000_000n,
      preferenceDividends: 0n,
      weightedAverageShares: 100_000n,
      dilutivePotentialShares: [
        { name: 'Options', potentialShares: 20_000n, earningsAdjustment: 0n },
      ],
    });

    expect(calc.explanation).toContain('EPS:');
    expect(calc.explanation).toContain('basis points');
    expect(calc.inputs.instrumentCount).toBe(1);
  });
});
