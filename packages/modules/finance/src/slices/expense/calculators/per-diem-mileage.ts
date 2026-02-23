/**
 * EM-02: Per-diem / mileage rate calculator.
 * Computes reimbursable amounts based on rate tables.
 * Pure calculator — no DB, no side effects.
 * Mileage rates in basis points (CIG-02 compliant).
 */

export interface PerDiemInput {
  readonly days: number;
  readonly dailyRate: bigint;
  readonly currencyCode: string;
}

export interface MileageInput {
  readonly distanceKm: number;
  /** Rate per km in basis points (e.g., 5000 = 0.50 per km) */
  readonly ratePerKmBps: number;
  readonly currencyCode: string;
}

export interface PerDiemResult {
  readonly days: number;
  readonly dailyRate: bigint;
  readonly totalAmount: bigint;
  readonly currencyCode: string;
}

export interface MileageResult {
  readonly distanceKm: number;
  readonly ratePerKmBps: number;
  readonly totalAmount: bigint;
  readonly currencyCode: string;
}

export function computePerDiem(input: PerDiemInput): PerDiemResult {
  return {
    days: input.days,
    dailyRate: input.dailyRate,
    totalAmount: input.dailyRate * BigInt(input.days),
    currencyCode: input.currencyCode,
  };
}

export function computeMileage(input: MileageInput): MileageResult {
  // totalAmount = distanceKm * ratePerKmBps / 10000
  const totalAmount = (BigInt(input.distanceKm) * BigInt(input.ratePerKmBps)) / 10000n;
  return {
    distanceKm: input.distanceKm,
    ratePerKmBps: input.ratePerKmBps,
    totalAmount,
    currencyCode: input.currencyCode,
  };
}
