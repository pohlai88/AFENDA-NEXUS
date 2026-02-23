/**
 * Asset component entity — represents a separately depreciable component of an asset.
 * Supports component accounting (IAS 16).
 */

import type { DepreciationMethod } from "./asset.js";

export interface AssetComponent {
  readonly id: string;
  readonly tenantId: string;
  readonly assetId: string;
  readonly name: string;
  readonly cost: bigint;
  readonly residualValue: bigint;
  readonly usefulLifeMonths: number;
  readonly depreciationMethod: DepreciationMethod;
  readonly accumulatedDepreciation: bigint;
  readonly netBookValue: bigint;
  readonly currencyCode: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
