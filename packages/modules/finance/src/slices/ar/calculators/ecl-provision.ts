/**
 * AR-04: Expected Credit Loss (ECL) provisioning.
 * IFRS 9 simplified approach — provision matrix by aging bucket.
 * Pure calculator — no DB, no side effects.
 */

export interface EclProvisionMatrix {
  readonly current: number;
  readonly days30: number;
  readonly days60: number;
  readonly days90: number;
  readonly over90: number;
}

export interface EclBucketResult {
  readonly bucket: string;
  readonly grossAmount: bigint;
  readonly lossRate: number;
  readonly provisionAmount: bigint;
}

export interface EclResult {
  readonly buckets: readonly EclBucketResult[];
  readonly totalGross: bigint;
  readonly totalProvision: bigint;
  readonly weightedLossRate: number;
}

export interface EclInput {
  readonly current: bigint;
  readonly days30: bigint;
  readonly days60: bigint;
  readonly days90: bigint;
  readonly over90: bigint;
}

/**
 * Default IFRS 9 simplified provision matrix (percentages).
 * Override with actual historical loss rates per entity.
 */
export const DEFAULT_ECL_MATRIX: EclProvisionMatrix = {
  current: 0.5,
  days30: 2,
  days60: 5,
  days90: 15,
  over90: 50,
};

export function computeEclProvision(
  input: EclInput,
  matrix: EclProvisionMatrix = DEFAULT_ECL_MATRIX,
): EclResult {
  const buckets: EclBucketResult[] = [
    computeBucket("current", input.current, matrix.current),
    computeBucket("days30", input.days30, matrix.days30),
    computeBucket("days60", input.days60, matrix.days60),
    computeBucket("days90", input.days90, matrix.days90),
    computeBucket("over90", input.over90, matrix.over90),
  ];

  const totalGross = buckets.reduce((s, b) => s + b.grossAmount, 0n);
  const totalProvision = buckets.reduce((s, b) => s + b.provisionAmount, 0n);
  const weightedLossRate = totalGross > 0n
    ? Number((totalProvision * 10000n) / totalGross) / 100
    : 0;

  return { buckets, totalGross, totalProvision, weightedLossRate };
}

function computeBucket(bucket: string, grossAmount: bigint, lossRate: number): EclBucketResult {
  // (grossAmount * lossRate) / 100, using integer math
  // eslint-disable-next-line no-restricted-syntax -- CIG-02 bridge: lossRate float scaled to integer for BigInt fixed-point arithmetic
  const provisionAmount = (grossAmount * BigInt(Math.round(lossRate * 100))) / 10000n;
  return { bucket, grossAmount, lossRate, provisionAmount };
}
