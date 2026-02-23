import type { IAssetRepo } from "./asset-repo.js";
import type { IDepreciationScheduleRepo } from "./depreciation-schedule-repo.js";
import type { IAssetMovementRepo } from "./asset-movement-repo.js";

export interface FaDeps {
  readonly assetRepo: IAssetRepo;
  readonly depreciationScheduleRepo: IDepreciationScheduleRepo;
  readonly assetMovementRepo: IAssetMovementRepo;
}
