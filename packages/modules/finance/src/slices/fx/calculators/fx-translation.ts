/**
 * @see FX-01 — FX rate types: spot, average, closing, budget, hedge
 * @see CONSOL-02 — Foreign subsidiary translation (IAS 21)
 * @see CONSOL-03 — CTA (Cumulative Translation Adjustment) computation
 *
 * Pure calculator — no I/O, no side effects.
 * Translates a trial balance from source currency to target (group) currency
 * using the correct rate per account type:
 *   - Assets/Liabilities → closing rate
 *   - Revenue/Expenses → average rate
 *   - Equity → historical rate
 */
import type { AccountType } from "../../../shared/types.js";
import type { CalculatorResult } from "../../../shared/types.js";

const PRECISION_SCALE = 10_000_000_000n;

export interface TranslationRates {
  readonly closingRate: number;
  readonly averageRate: number;
  readonly historicalRate: number;
}

export interface TrialBalanceEntry {
  readonly accountId: string;
  readonly accountType: AccountType;
  readonly amountMinor: bigint;
  readonly sourceCurrency: string;
}

export interface TranslatedEntry {
  readonly accountId: string;
  readonly originalMinor: bigint;
  readonly translatedMinor: bigint;
  readonly sourceCurrency: string;
  readonly targetCurrency: string;
  readonly rateUsed: number;
  readonly rateType: "closing" | "average" | "historical" | "none";
}

export interface TranslationResult {
  readonly entries: readonly TranslatedEntry[];
  readonly ctaAmountMinor: bigint;
  readonly targetCurrency: string;
}

function selectRate(
  accountType: AccountType,
  rates: TranslationRates,
): { rate: number; rateType: TranslatedEntry["rateType"] } {
  switch (accountType) {
    case "ASSET":
    case "LIABILITY":
      return { rate: rates.closingRate, rateType: "closing" };
    case "REVENUE":
    case "EXPENSE":
      return { rate: rates.averageRate, rateType: "average" };
    case "EQUITY":
      return { rate: rates.historicalRate, rateType: "historical" };
  }
}

function applyRate(amount: bigint, rate: number): bigint {
  // eslint-disable-next-line no-restricted-syntax -- CIG-02 exception: float-to-BigInt bridge
  const rateScaled = BigInt(Math.round(rate * Number(PRECISION_SCALE)));
  const halfScale = PRECISION_SCALE / 2n;
  return (amount * rateScaled + halfScale) / PRECISION_SCALE;
}

/**
 * Translates a trial balance from source to target currency.
 * Returns translated entries and the CTA (sum of translation differences).
 */
export function translateTrialBalance(
  entries: readonly TrialBalanceEntry[],
  rates: TranslationRates,
  targetCurrency: string,
): CalculatorResult<TranslationResult> {
  if (rates.closingRate <= 0 || rates.averageRate <= 0 || rates.historicalRate <= 0) {
    throw new Error("All translation rates must be positive");
  }

  const translated: TranslatedEntry[] = entries.map((entry) => {
    if (entry.sourceCurrency === targetCurrency) {
      return {
        accountId: entry.accountId,
        originalMinor: entry.amountMinor,
        translatedMinor: entry.amountMinor,
        sourceCurrency: entry.sourceCurrency,
        targetCurrency,
        rateUsed: 1,
        rateType: "none" as const,
      };
    }

    const { rate, rateType } = selectRate(entry.accountType, rates);
    const translatedMinor = applyRate(entry.amountMinor, rate);

    return {
      accountId: entry.accountId,
      originalMinor: entry.amountMinor,
      translatedMinor,
      sourceCurrency: entry.sourceCurrency,
      targetCurrency,
      rateUsed: rate,
      rateType,
    };
  });

  const ctaAmountMinor = translated.reduce(
    (sum, e) => sum + (e.translatedMinor - e.originalMinor),
    0n,
  );

  return {
    result: { entries: translated, ctaAmountMinor, targetCurrency },
    inputs: { entryCount: entries.length, targetCurrency, rates },
    explanation: `Translated ${entries.length} entries to ${targetCurrency}, CTA=${ctaAmountMinor}`,
  };
}
