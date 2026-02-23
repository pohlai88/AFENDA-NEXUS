/**
 * FA-07: Disposal (gain/loss = proceeds − NBV).
 * Pure calculator — no DB, no side effects.
 * Uses raw bigint for amounts (minor units).
 */

export interface DisposalInput {
  readonly assetId: string;
  readonly netBookValue: bigint;
  readonly disposalProceeds: bigint;
  readonly disposalCosts: bigint;
  readonly currencyCode: string;
}

export interface DisposalResult {
  readonly assetId: string;
  readonly netProceeds: bigint;
  readonly gainOrLoss: bigint;
  readonly isGain: boolean;
}

/**
 * Compute gain/loss on disposal.
 * Net proceeds = disposal proceeds - disposal costs
 * Gain/loss = net proceeds - NBV
 */
export function computeDisposal(input: DisposalInput): DisposalResult {
  const netProceeds = input.disposalProceeds - input.disposalCosts;
  const gainOrLoss = netProceeds - input.netBookValue;

  return {
    assetId: input.assetId,
    netProceeds,
    gainOrLoss,
    isGain: gainOrLoss >= 0n,
  };
}
