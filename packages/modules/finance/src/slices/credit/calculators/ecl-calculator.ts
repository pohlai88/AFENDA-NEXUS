/**
 * CM-06: Expected Credit Loss (ECL) calculator.
 * Computes IFRS 9 simplified ECL based on aging buckets and loss rates.
 * Pure calculator — no DB, no side effects.
 * Loss rates in basis points (CIG-02 compliant).
 */

export interface AgingBucket {
  readonly label: string;
  readonly amount: bigint;
  /** Loss rate in basis points (e.g., 100 = 1%) */
  readonly lossRateBps: number;
}

export interface EclInput {
  readonly customerId: string;
  readonly buckets: readonly AgingBucket[];
  readonly currencyCode: string;
}

export interface EclBucketResult {
  readonly label: string;
  readonly grossAmount: bigint;
  readonly lossRateBps: number;
  readonly eclAmount: bigint;
}

export interface EclResult {
  readonly customerId: string;
  readonly totalGross: bigint;
  readonly totalEcl: bigint;
  readonly netCarryingAmount: bigint;
  readonly weightedLossRateBps: number;
  readonly buckets: readonly EclBucketResult[];
  readonly currencyCode: string;
}

/**
 * Compute expected credit loss using simplified approach (IFRS 9).
 */
export function computeEcl(input: EclInput): EclResult {
  let totalGross = 0n;
  let totalEcl = 0n;
  const bucketResults: EclBucketResult[] = [];

  for (const bucket of input.buckets) {
    const eclAmount = (bucket.amount * BigInt(bucket.lossRateBps)) / 10000n;
    totalGross += bucket.amount;
    totalEcl += eclAmount;
    bucketResults.push({
      label: bucket.label,
      grossAmount: bucket.amount,
      lossRateBps: bucket.lossRateBps,
      eclAmount,
    });
  }

  const weightedLossRateBps = totalGross > 0n
    ? Number((totalEcl * 10000n) / totalGross)
    : 0;

  return {
    customerId: input.customerId,
    totalGross,
    totalEcl,
    netCarryingAmount: totalGross - totalEcl,
    weightedLossRateBps,
    buckets: bucketResults,
    currencyCode: input.currencyCode,
  };
}
