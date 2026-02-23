/**
 * Depreciation schedule entity — tracks periodic depreciation entries for an asset.
 */

export interface DepreciationScheduleEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly assetId: string;
  readonly componentId: string | null;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly depreciationAmount: bigint;
  readonly accumulatedDepreciation: bigint;
  readonly netBookValue: bigint;
  readonly currencyCode: string;
  readonly journalId: string | null;
  readonly isPosted: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
