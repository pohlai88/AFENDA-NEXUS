/**
 * @see FX-06 — FX gain/loss: realized vs unrealized separation
 * @see FX-07 — Reproducible FX revaluation runs with rate snapshots
 * @see FX-08 — Revaluation journal generation per account
 *
 * Pure calculator — no I/O, no side effects.
 * Computes unrealized FX gain/loss for monetary accounts denominated
 * in foreign currencies, revalued at the current closing rate.
 */
import type { AccountType } from "../../../shared/types.js";
import type { CalculatorResult } from "../../../shared/types.js";

const PRECISION_SCALE = 10_000_000_000n;

export interface MonetaryBalance {
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountType: AccountType;
  readonly originalCurrency: string;
  readonly originalMinor: bigint;
  readonly bookValueMinor: bigint;
  readonly bookCurrency: string;
}

export interface RevaluationLine {
  readonly accountId: string;
  readonly accountCode: string;
  readonly previousBookValue: bigint;
  readonly revaluedAmount: bigint;
  readonly unrealizedGainLoss: bigint;
  readonly isGain: boolean;
  readonly currency: string;
}

export interface RevaluationResult {
  readonly lines: readonly RevaluationLine[];
  readonly totalUnrealizedGain: bigint;
  readonly totalUnrealizedLoss: bigint;
  readonly netUnrealized: bigint;
  readonly currency: string;
  readonly rateDate: string;
}

function applyRate(amount: bigint, rate: number): bigint {
  // eslint-disable-next-line no-restricted-syntax -- CIG-02 exception: float-to-BigInt bridge
  const rateScaled = BigInt(Math.round(rate * Number(PRECISION_SCALE)));
  const halfScale = PRECISION_SCALE / 2n;
  return (amount * rateScaled + halfScale) / PRECISION_SCALE;
}

/**
 * Revalues monetary balances at the current closing rate.
 * Only ASSET and LIABILITY accounts with foreign currency are revalued.
 * Revenue/Expense/Equity are excluded per IAS 21.
 *
 * @param balances - Monetary account balances in foreign currency
 * @param closingRate - Current closing rate (foreign → book currency)
 * @param rateDate - ISO date string for the rate snapshot
 */
export function computeRevaluation(
  balances: readonly MonetaryBalance[],
  closingRate: number,
  rateDate: string,
): CalculatorResult<RevaluationResult> {
  if (closingRate <= 0 || !Number.isFinite(closingRate)) {
    throw new Error(`Closing rate must be finite and > 0, got ${closingRate}`);
  }

  const lines: RevaluationLine[] = [];
  let totalGain = 0n;
  let totalLoss = 0n;
  let currency = "";

  for (const bal of balances) {
    // Only revalue monetary items (assets/liabilities)
    if (bal.accountType !== "ASSET" && bal.accountType !== "LIABILITY") continue;
    // Only revalue foreign currency balances
    if (bal.originalCurrency === bal.bookCurrency) continue;

    currency = bal.bookCurrency;
    const revalued = applyRate(bal.originalMinor, closingRate);
    const diff = revalued - bal.bookValueMinor;
    const isGain = diff >= 0n;
    const absDiff = isGain ? diff : -diff;

    if (isGain) {
      totalGain += absDiff;
    } else {
      totalLoss += absDiff;
    }

    lines.push({
      accountId: bal.accountId,
      accountCode: bal.accountCode,
      previousBookValue: bal.bookValueMinor,
      revaluedAmount: revalued,
      unrealizedGainLoss: diff,
      isGain,
      currency: bal.bookCurrency,
    });
  }

  const netUnrealized = totalGain - totalLoss;

  return {
    result: {
      lines,
      totalUnrealizedGain: totalGain,
      totalUnrealizedLoss: totalLoss,
      netUnrealized,
      currency: currency || balances[0]?.bookCurrency || "USD",
      rateDate,
    },
    inputs: { balanceCount: balances.length, closingRate, rateDate },
    explanation: `Revaluation at ${rateDate}: ${lines.length} accounts, gain=${totalGain} loss=${totalLoss} net=${netUnrealized}`,
  };
}
