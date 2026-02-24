/**
 * CA-05: Standard costing variance analysis calculator.
 * Computes material price variance, material usage variance,
 * labor rate variance, labor efficiency variance, and overhead variances.
 * Pure calculator — no DB, no side effects.
 */

export interface StandardCostInput {
  readonly productId: string;
  readonly unitsProduced: bigint;
  readonly material: {
    readonly standardPricePerUnit: bigint;
    readonly standardQtyPerUnit: bigint;
    readonly actualPricePerUnit: bigint;
    readonly actualQtyUsed: bigint;
  };
  readonly labor: {
    readonly standardRatePerHour: bigint;
    readonly standardHoursPerUnit: bigint;
    readonly actualRatePerHour: bigint;
    readonly actualHoursWorked: bigint;
  };
  readonly overhead: {
    readonly standardRatePerUnit: bigint;
    readonly actualOverhead: bigint;
  };
  readonly currencyCode: string;
}

export interface VarianceLine {
  readonly varianceType: string;
  readonly amount: bigint;
  readonly favorable: boolean;
}

export interface StandardCostVarianceResult {
  readonly productId: string;
  readonly variances: readonly VarianceLine[];
  readonly totalVariance: bigint;
  readonly totalFavorable: boolean;
  readonly currencyCode: string;
}

/**
 * Compute standard cost variances for a production run.
 */
export function computeStandardCostVariance(input: StandardCostInput): StandardCostVarianceResult {
  if (input.unitsProduced <= 0n) throw new Error("Units produced must be positive");

  const variances: VarianceLine[] = [];

  // Material Price Variance = (Actual Price - Standard Price) × Actual Qty
  const mpv = (input.material.actualPricePerUnit - input.material.standardPricePerUnit) * input.material.actualQtyUsed;
  variances.push({
    varianceType: "MATERIAL_PRICE",
    amount: mpv < 0n ? -mpv : mpv,
    favorable: mpv <= 0n,
  });

  // Material Usage Variance = (Actual Qty - Standard Qty × Units) × Standard Price
  const standardQtyAllowed = input.material.standardQtyPerUnit * input.unitsProduced;
  const muv = (input.material.actualQtyUsed - standardQtyAllowed) * input.material.standardPricePerUnit;
  variances.push({
    varianceType: "MATERIAL_USAGE",
    amount: muv < 0n ? -muv : muv,
    favorable: muv <= 0n,
  });

  // Labor Rate Variance = (Actual Rate - Standard Rate) × Actual Hours
  const lrv = (input.labor.actualRatePerHour - input.labor.standardRatePerHour) * input.labor.actualHoursWorked;
  variances.push({
    varianceType: "LABOR_RATE",
    amount: lrv < 0n ? -lrv : lrv,
    favorable: lrv <= 0n,
  });

  // Labor Efficiency Variance = (Actual Hours - Standard Hours × Units) × Standard Rate
  const standardHoursAllowed = input.labor.standardHoursPerUnit * input.unitsProduced;
  const lev = (input.labor.actualHoursWorked - standardHoursAllowed) * input.labor.standardRatePerHour;
  variances.push({
    varianceType: "LABOR_EFFICIENCY",
    amount: lev < 0n ? -lev : lev,
    favorable: lev <= 0n,
  });

  // Overhead Variance = Actual Overhead - (Standard Rate × Units)
  const appliedOverhead = input.overhead.standardRatePerUnit * input.unitsProduced;
  const ov = input.overhead.actualOverhead - appliedOverhead;
  variances.push({
    varianceType: "OVERHEAD",
    amount: ov < 0n ? -ov : ov,
    favorable: ov <= 0n,
  });

  // Total variance (unfavorable = positive, favorable = negative)
  const totalVariance = mpv + muv + lrv + lev + ov;

  return {
    productId: input.productId,
    variances,
    totalVariance: totalVariance < 0n ? -totalVariance : totalVariance,
    totalFavorable: totalVariance <= 0n,
    currencyCode: input.currencyCode,
  };
}
