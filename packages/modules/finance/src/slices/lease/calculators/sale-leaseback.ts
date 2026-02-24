/**
 * LA-05: Sale-and-leaseback calculator.
 * Determines gain/loss on sale and ROU asset measurement per IFRS 16.
 * Pure calculator — no DB, no side effects.
 */

export interface SaleLeasebackInput {
  readonly assetCarryingAmount: bigint;
  readonly salePrice: bigint;
  readonly fairValue: bigint;
  readonly leaseLiability: bigint;
  readonly rouAsset: bigint;
  readonly currencyCode: string;
}

export interface SaleLeasebackResult {
  readonly isAtFairValue: boolean;
  readonly gainOnSale: bigint;
  readonly lossOnSale: bigint;
  readonly retainedRightPortion: bigint;
  readonly adjustedRouAsset: bigint;
  readonly adjustedGainLoss: bigint;
  readonly currencyCode: string;
}

export function computeSaleLeaseback(input: SaleLeasebackInput): SaleLeasebackResult {
  const isAtFairValue = input.salePrice === input.fairValue;

  const totalGainLoss = input.salePrice - input.assetCarryingAmount;
  const gainOnSale = totalGainLoss > 0n ? totalGainLoss : 0n;
  const lossOnSale = totalGainLoss < 0n ? -totalGainLoss : 0n;

  // Portion of gain/loss retained = leaseLiability / fairValue
  const retainedRightPortion = input.fairValue > 0n
    ? (input.leaseLiability * 10000n) / input.fairValue
    : 0n;

  // Adjusted gain/loss = total * (1 - retained portion)
  const transferredPortion = 10000n - retainedRightPortion;
  const adjustedGainLoss = (totalGainLoss * transferredPortion) / 10000n;

  // ROU asset = carrying amount * (retained portion / 10000)
  const adjustedRouAsset = (input.assetCarryingAmount * retainedRightPortion) / 10000n;

  return {
    isAtFairValue,
    gainOnSale,
    lossOnSale,
    retainedRightPortion,
    adjustedRouAsset,
    adjustedGainLoss,
    currencyCode: input.currencyCode,
  };
}
