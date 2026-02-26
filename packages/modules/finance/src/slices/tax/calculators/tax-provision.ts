/**
 * TX-08: Tax provision calculation.
 * Computes current and deferred tax provision for financial reporting.
 * Pure calculator — no DB, no side effects.
 *
 * All rates are integer basis points — no float arithmetic on money.
 * Uses raw bigint for amounts (minor units).
 */

export interface TaxProvisionInput {
  readonly pretaxIncome: bigint;
  readonly permanentDifferences: bigint;
  readonly temporaryDifferencesChange: bigint;
  /** Statutory tax rate in basis points (e.g. 2500 = 25.00%). */
  readonly statutoryRateBps: number;
  readonly taxCredits: bigint;
  readonly priorYearAdjustment: bigint;
  readonly currencyCode: string;
}

export interface TaxProvisionResult {
  readonly taxableIncome: bigint;
  readonly currentTaxExpense: bigint;
  readonly deferredTaxExpense: bigint;
  readonly totalTaxExpense: bigint;
  readonly effectiveRateBps: number;
  readonly taxCreditsApplied: bigint;
}

/**
 * Compute tax provision.
 *
 * taxableIncome = pretaxIncome + permanentDifferences
 * currentTax = taxableIncome * rate - credits + priorYearAdj
 * deferredTax = temporaryDifferencesChange * rate
 * totalTax = currentTax + deferredTax
 */
export function computeTaxProvision(input: TaxProvisionInput): TaxProvisionResult {
  const taxableIncome = input.pretaxIncome + input.permanentDifferences;

  const grossCurrentTax = (taxableIncome * BigInt(input.statutoryRateBps)) / 10000n;
  const currentTaxExpense = grossCurrentTax - input.taxCredits + input.priorYearAdjustment;

  const deferredTaxExpense =
    (input.temporaryDifferencesChange * BigInt(input.statutoryRateBps)) / 10000n;

  const totalTaxExpense = currentTaxExpense + deferredTaxExpense;

  // Effective rate in bps: (totalTax / pretaxIncome) * 10000
  const effectiveRateBps =
    input.pretaxIncome !== 0n ? Number((totalTaxExpense * 10000n) / input.pretaxIncome) : 0;

  return {
    taxableIncome,
    currentTaxExpense,
    deferredTaxExpense,
    totalTaxExpense,
    effectiveRateBps,
    taxCreditsApplied: input.taxCredits,
  };
}
