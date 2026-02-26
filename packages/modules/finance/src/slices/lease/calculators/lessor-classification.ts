/**
 * LA-06: Lessor accounting classification calculator.
 * Determines whether a lease is a finance lease or operating lease from the lessor's perspective.
 * Pure calculator — no DB, no side effects.
 */

export interface LessorClassificationInput {
  readonly leaseTermMonths: number;
  readonly assetEconomicLifeMonths: number;
  readonly pvOfLeasePayments: bigint;
  readonly fairValueOfAsset: bigint;
  readonly transfersOwnership: boolean;
  readonly hasBargainPurchaseOption: boolean;
  readonly isSpecializedAsset: boolean;
}

export type LessorLeaseType = 'FINANCE' | 'OPERATING';

export interface LessorClassificationResult {
  readonly classification: LessorLeaseType;
  readonly reasons: readonly string[];
  readonly majorPartOfEconomicLife: boolean;
  readonly substantiallyAllFairValue: boolean;
}

/** IFRS 16 thresholds for lessor classification */
const MAJOR_PART_THRESHOLD = 75; // 75% of economic life
const SUBSTANTIALLY_ALL_THRESHOLD = 90; // 90% of fair value

export function classifyLessorLease(input: LessorClassificationInput): LessorClassificationResult {
  const reasons: string[] = [];

  const majorPartOfEconomicLife =
    input.assetEconomicLifeMonths > 0 &&
    (input.leaseTermMonths / input.assetEconomicLifeMonths) * 100 >= MAJOR_PART_THRESHOLD;

  const substantiallyAllFairValue =
    input.fairValueOfAsset > 0n &&
    (input.pvOfLeasePayments * 100n) / input.fairValueOfAsset >=
      BigInt(SUBSTANTIALLY_ALL_THRESHOLD);

  let isFinanceLease = false;

  if (input.transfersOwnership) {
    reasons.push('Ownership transfers to lessee at end of lease term');
    isFinanceLease = true;
  }
  if (input.hasBargainPurchaseOption) {
    reasons.push('Lessee has bargain purchase option');
    isFinanceLease = true;
  }
  if (majorPartOfEconomicLife) {
    reasons.push('Lease term is for major part of economic life of asset');
    isFinanceLease = true;
  }
  if (substantiallyAllFairValue) {
    reasons.push('PV of lease payments amounts to substantially all of fair value');
    isFinanceLease = true;
  }
  if (input.isSpecializedAsset) {
    reasons.push('Asset is specialized with no alternative use without major modification');
    isFinanceLease = true;
  }

  if (!isFinanceLease) {
    reasons.push('No finance lease indicators met — classified as operating lease');
  }

  return {
    classification: isFinanceLease ? 'FINANCE' : 'OPERATING',
    reasons,
    majorPartOfEconomicLife,
    substantiallyAllFairValue,
  };
}
