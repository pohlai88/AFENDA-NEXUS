/**
 * FA-06: Impairment testing (IAS 36).
 * Computes impairment loss when recoverable amount < carrying amount.
 * Pure calculator — no DB, no side effects.
 * Uses raw bigint for amounts (minor units).
 */

export interface ImpairmentInput {
  readonly assetId: string;
  readonly carryingAmount: bigint;
  readonly fairValueLessCostsOfDisposal: bigint;
  readonly valueInUse: bigint;
  readonly currencyCode: string;
}

export interface ImpairmentResult {
  readonly assetId: string;
  readonly recoverableAmount: bigint;
  readonly impairmentLoss: bigint;
  readonly isImpaired: boolean;
  readonly newCarryingAmount: bigint;
}

/**
 * Compute impairment loss per IAS 36.
 * Recoverable amount = max(fair value less costs of disposal, value in use)
 * Impairment loss = carrying amount - recoverable amount (if positive)
 */
export function computeImpairment(input: ImpairmentInput): ImpairmentResult {
  const recoverableAmount = input.fairValueLessCostsOfDisposal > input.valueInUse
    ? input.fairValueLessCostsOfDisposal
    : input.valueInUse;

  const impairmentLoss = input.carryingAmount > recoverableAmount
    ? input.carryingAmount - recoverableAmount
    : 0n;

  return {
    assetId: input.assetId,
    recoverableAmount,
    impairmentLoss,
    isImpaired: impairmentLoss > 0n,
    newCarryingAmount: input.carryingAmount - impairmentLoss,
  };
}
