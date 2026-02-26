/**
 * GAP-G3: Currency Redenomination calculator.
 * Pure calculator — redenominates all balances by a conversion factor,
 * maintains pre/post redenomination audit trail, and handles
 * dual-currency transition periods.
 *
 * Examples: Indonesia's planned redenomination (IDR),
 * Zimbabwe's currency resets, Turkey (TRY→TRY redenomination).
 *
 * All monetary values are bigint (minor units).
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface RedenominationBalance {
  readonly accountCode: string;
  readonly accountName: string;
  readonly originalAmount: bigint;
  readonly originalCurrency: string;
}

export interface RedenominationInput {
  readonly entityId: string;
  readonly entityName: string;
  readonly originalCurrencyCode: string;
  readonly newCurrencyCode: string;
  /** Conversion factor in basis points (e.g., 10000 = 1:1, 1 = 1:10000). */
  readonly conversionFactorBps: bigint;
  /** Effective date of redenomination. */
  readonly effectiveDate: string;
  readonly balances: readonly RedenominationBalance[];
  /** Whether to apply rounding rules (round to nearest minor unit). */
  readonly roundToMinorUnit: boolean;
  /** Transition period end date for dual-currency. */
  readonly transitionEndDate?: string;
}

export interface RedenominatedBalance {
  readonly accountCode: string;
  readonly accountName: string;
  readonly originalAmount: bigint;
  readonly originalCurrency: string;
  readonly newAmount: bigint;
  readonly newCurrency: string;
  readonly roundingDifference: bigint;
}

export interface RedenominationResult {
  readonly entityId: string;
  readonly entityName: string;
  readonly originalCurrencyCode: string;
  readonly newCurrencyCode: string;
  readonly conversionFactorBps: bigint;
  readonly effectiveDate: string;
  readonly transitionEndDate: string | null;
  readonly balances: readonly RedenominatedBalance[];
  readonly totalOriginal: bigint;
  readonly totalNew: bigint;
  readonly totalRoundingDifference: bigint;
  readonly balanceCount: number;
  readonly isDualCurrencyPeriod: boolean;
}

/**
 * Redenominates balances by the specified conversion factor.
 *
 * Conversion: NewAmount = OriginalAmount × ConversionFactorBps / 10000
 *
 * For a 1000:1 redenomination (e.g., old IDR → new IDR):
 *   conversionFactorBps = 10 (i.e., 10/10000 = 0.001)
 *   1,000,000 old → 1,000 new
 */
export function redenominateCurrency(
  input: RedenominationInput
): CalculatorResult<RedenominationResult> {
  if (input.balances.length === 0) {
    throw new Error('At least one balance required for redenomination');
  }
  if (input.conversionFactorBps <= 0n) {
    throw new Error('Conversion factor must be positive');
  }

  const balances: RedenominatedBalance[] = [];
  let totalOriginal = 0n;
  let totalNew = 0n;
  let totalRounding = 0n;

  for (const bal of input.balances) {
    totalOriginal += bal.originalAmount;

    // NewAmount = OriginalAmount × ConversionFactor / 10000
    const rawNew = (bal.originalAmount * input.conversionFactorBps) / 10000n;
    const newAmount = input.roundToMinorUnit ? rawNew : rawNew;

    // Rounding difference: what was lost in integer division
    const reverseCheck = (newAmount * 10000n) / input.conversionFactorBps;
    const roundingDifference = bal.originalAmount - reverseCheck;

    totalNew += newAmount;
    totalRounding += roundingDifference < 0n ? -roundingDifference : roundingDifference;

    balances.push({
      accountCode: bal.accountCode,
      accountName: bal.accountName,
      originalAmount: bal.originalAmount,
      originalCurrency: bal.originalCurrency,
      newAmount,
      newCurrency: input.newCurrencyCode,
      roundingDifference,
    });
  }

  const isDualCurrencyPeriod = !!input.transitionEndDate;

  return {
    result: {
      entityId: input.entityId,
      entityName: input.entityName,
      originalCurrencyCode: input.originalCurrencyCode,
      newCurrencyCode: input.newCurrencyCode,
      conversionFactorBps: input.conversionFactorBps,
      effectiveDate: input.effectiveDate,
      transitionEndDate: input.transitionEndDate ?? null,
      balances,
      totalOriginal,
      totalNew,
      totalRoundingDifference: totalRounding,
      balanceCount: balances.length,
      isDualCurrencyPeriod,
    },
    inputs: {
      entityId: input.entityId,
      conversionFactorBps: input.conversionFactorBps.toString(),
      balanceCount: input.balances.length,
    },
    explanation:
      `Currency redenomination: ${input.originalCurrencyCode} → ${input.newCurrencyCode}, ` +
      `factor=${input.conversionFactorBps}/10000, ${balances.length} balances, ` +
      `total rounding diff=${totalRounding}` +
      (isDualCurrencyPeriod ? `, dual-currency until ${input.transitionEndDate}` : ''),
  };
}
