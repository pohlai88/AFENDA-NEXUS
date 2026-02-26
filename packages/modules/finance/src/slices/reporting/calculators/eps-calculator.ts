/**
 * SR-06: Earnings Per Share calculator (IAS 33).
 * Pure calculator — computes basic and diluted EPS from profit,
 * preference dividends, and share data.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface EpsInput {
  /** Net profit attributable to ordinary equity holders (in minor units). */
  readonly netProfit: bigint;
  /** Preference dividends declared during the period (in minor units). */
  readonly preferenceDividends: bigint;
  /** Weighted average number of ordinary shares outstanding. */
  readonly weightedAverageShares: bigint;
  /** Dilutive potential ordinary shares (options, warrants, convertibles). */
  readonly dilutivePotentialShares?: readonly DilutiveInstrument[];
}

export interface DilutiveInstrument {
  readonly name: string;
  /** Number of potential ordinary shares from this instrument. */
  readonly potentialShares: bigint;
  /**
   * Incremental earnings adjustment (e.g., saved interest on convertible bonds,
   * net of tax). In minor units.
   */
  readonly earningsAdjustment: bigint;
}

export interface EpsResult {
  /** Basic EPS = (Profit - Pref Dividends) / Weighted Avg Shares. Basis points (x10000). */
  readonly basicEps: bigint;
  /** Diluted EPS after considering all dilutive instruments. Basis points (x10000). */
  readonly dilutedEps: bigint;
  /** True if diluted EPS < basic EPS (i.e., instruments are dilutive). */
  readonly isDilutive: boolean;
  /** Earnings available to ordinary shareholders (numerator for basic EPS). */
  readonly earningsForBasic: bigint;
  /** Adjusted earnings (numerator for diluted EPS). */
  readonly earningsForDiluted: bigint;
  /** Weighted average shares (denominator for basic EPS). */
  readonly sharesForBasic: bigint;
  /** Adjusted shares (denominator for diluted EPS). */
  readonly sharesForDiluted: bigint;
  /** Breakdown of each dilutive instrument's impact. */
  readonly dilutiveBreakdown: readonly DilutiveImpact[];
}

export interface DilutiveImpact {
  readonly name: string;
  readonly potentialShares: bigint;
  readonly earningsAdjustment: bigint;
  /** True if this instrument is dilutive (incremental EPS < basic EPS). */
  readonly isDilutive: boolean;
  /** Incremental EPS of this instrument alone (basis points x10000). */
  readonly incrementalEps: bigint;
}

/**
 * Computes basic and diluted EPS per IAS 33.
 *
 * Basic EPS = (Net Profit − Preference Dividends) / Weighted Avg Shares
 * Diluted EPS uses the if-converted / treasury stock method:
 *   - Sort dilutive instruments by incremental EPS (most dilutive first)
 *   - Include each instrument only if it decreases EPS (IAS 33.44)
 *   - Anti-dilutive instruments are excluded
 *
 * All EPS values are in basis points (x10000) to avoid floating point.
 * Divide by 10000 to get the per-share amount in major currency units.
 */
export function computeEps(input: EpsInput): CalculatorResult<EpsResult> {
  if (input.weightedAverageShares <= 0n) {
    throw new Error('Weighted average shares must be positive');
  }

  const earningsForBasic = input.netProfit - input.preferenceDividends;

  // Basic EPS in basis points (x10000)
  const basicEps = (earningsForBasic * 10000n) / input.weightedAverageShares;

  // Process dilutive instruments per IAS 33.44
  const instruments = input.dilutivePotentialShares ?? [];

  // Compute incremental EPS for each instrument to rank them
  const ranked: Array<{
    name: string;
    potentialShares: bigint;
    earningsAdjustment: bigint;
    incrementalEps: bigint;
  }> = instruments
    .filter((i) => i.potentialShares > 0n)
    .map((i) => ({
      name: i.name,
      potentialShares: i.potentialShares,
      earningsAdjustment: i.earningsAdjustment,
      incrementalEps:
        i.potentialShares > 0n ? (i.earningsAdjustment * 10000n) / i.potentialShares : 0n,
    }))
    // Sort by incremental EPS ascending (most dilutive first)
    .sort((a, b) => {
      if (a.incrementalEps < b.incrementalEps) return -1;
      if (a.incrementalEps > b.incrementalEps) return 1;
      return 0;
    });

  // Sequentially include instruments (IAS 33.44 ranking approach)
  let cumulativeEarnings = earningsForBasic;
  let cumulativeShares = input.weightedAverageShares;
  const dilutiveBreakdown: DilutiveImpact[] = [];

  for (const inst of ranked) {
    const testEarnings = cumulativeEarnings + inst.earningsAdjustment;
    const testShares = cumulativeShares + inst.potentialShares;
    const testEps = (testEarnings * 10000n) / testShares;
    const currentEps = (cumulativeEarnings * 10000n) / cumulativeShares;

    const isDilutive = testEps <= currentEps;

    dilutiveBreakdown.push({
      name: inst.name,
      potentialShares: inst.potentialShares,
      earningsAdjustment: inst.earningsAdjustment,
      isDilutive,
      incrementalEps: inst.incrementalEps,
    });

    if (isDilutive) {
      cumulativeEarnings = testEarnings;
      cumulativeShares = testShares;
    }
  }

  const dilutedEps = (cumulativeEarnings * 10000n) / cumulativeShares;

  return {
    result: {
      basicEps,
      dilutedEps,
      isDilutive: dilutedEps < basicEps,
      earningsForBasic,
      earningsForDiluted: cumulativeEarnings,
      sharesForBasic: input.weightedAverageShares,
      sharesForDiluted: cumulativeShares,
      dilutiveBreakdown,
    },
    inputs: {
      netProfit: input.netProfit.toString(),
      preferenceDividends: input.preferenceDividends.toString(),
      weightedAverageShares: input.weightedAverageShares.toString(),
      instrumentCount: instruments.length,
    },
    explanation: `EPS: basic=${basicEps} diluted=${dilutedEps} (basis points x10000), ${dilutiveBreakdown.filter((d) => d.isDilutive).length}/${instruments.length} dilutive instruments`,
  };
}
