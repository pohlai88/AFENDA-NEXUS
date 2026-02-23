import type { IFxRateRepo } from "./fx-rate-repo.js";
import type { IFxRateApprovalRepo } from "./fx-rate-approval-repo.js";

export interface FxDeps {
  readonly fxRateRepo: IFxRateRepo;
  readonly fxRateApprovalRepo: IFxRateApprovalRepo;
}
