/**
 * EM-05: Foreign currency reimbursement calculator.
 * Converts expense claim amounts from foreign currency to base currency for reimbursement.
 * Pure calculator — no DB, no side effects.
 */

export interface FxReimbursementInput {
  readonly claimId: string;
  readonly foreignAmount: bigint;
  readonly foreignCurrencyCode: string;
  readonly baseCurrencyCode: string;
  /** Exchange rate in basis points (e.g., 45000 = 4.5000) */
  readonly exchangeRateBps: number;
}

export interface FxReimbursementResult {
  readonly claimId: string;
  readonly foreignAmount: bigint;
  readonly foreignCurrencyCode: string;
  readonly baseCurrencyAmount: bigint;
  readonly baseCurrencyCode: string;
  readonly exchangeRateBps: number;
  readonly fxGainLoss: bigint;
}

export function computeFxReimbursement(
  input: FxReimbursementInput,
  originalBaseCurrencyAmount: bigint
): FxReimbursementResult {
  const baseCurrencyAmount = (input.foreignAmount * BigInt(input.exchangeRateBps)) / 10000n;
  const fxGainLoss = baseCurrencyAmount - originalBaseCurrencyAmount;

  return {
    claimId: input.claimId,
    foreignAmount: input.foreignAmount,
    foreignCurrencyCode: input.foreignCurrencyCode,
    baseCurrencyAmount,
    baseCurrencyCode: input.baseCurrencyCode,
    exchangeRateBps: input.exchangeRateBps,
    fxGainLoss,
  };
}
