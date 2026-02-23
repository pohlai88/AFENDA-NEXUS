/**
 * Tax return period entity — tracks tax filing periods and aggregated amounts.
 */

export type TaxReturnStatus = "DRAFT" | "CALCULATED" | "FILED" | "AMENDED";

export interface TaxReturnPeriod {
  readonly id: string;
  readonly tenantId: string;
  readonly taxType: string;
  readonly jurisdictionCode: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly outputTax: bigint;
  readonly inputTax: bigint;
  readonly netPayable: bigint;
  readonly currencyCode: string;
  readonly status: TaxReturnStatus;
  readonly filedAt: Date | null;
  readonly filedBy: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
