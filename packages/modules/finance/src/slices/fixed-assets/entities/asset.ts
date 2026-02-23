/**
 * Fixed asset entity — represents a capitalized asset in the register.
 */

export type AssetStatus = "ACTIVE" | "DISPOSED" | "FULLY_DEPRECIATED" | "IMPAIRED" | "CWIP";

export type DepreciationMethod = "STRAIGHT_LINE" | "DECLINING_BALANCE" | "UNITS_OF_PRODUCTION";

export interface Asset {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly assetNumber: string;
  readonly name: string;
  readonly description: string | null;
  readonly categoryCode: string;
  readonly acquisitionDate: Date;
  readonly acquisitionCost: bigint;
  readonly residualValue: bigint;
  readonly usefulLifeMonths: number;
  readonly depreciationMethod: DepreciationMethod;
  readonly accumulatedDepreciation: bigint;
  readonly netBookValue: bigint;
  readonly currencyCode: string;
  readonly locationCode: string | null;
  readonly costCenterId: string | null;
  readonly glAccountId: string;
  readonly depreciationAccountId: string;
  readonly accumulatedDepreciationAccountId: string;
  readonly status: AssetStatus;
  readonly disposedAt: Date | null;
  readonly disposalProceeds: bigint | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
