import type { Result } from '@afenda/core';
import type { FxRateApproval } from '../../fx/entities/fx-rate-approval.js';

export interface IFxRateApprovalRepo {
  submit(rateId: string, submittedBy: string): Promise<Result<FxRateApproval>>;
  approve(rateId: string, reviewedBy: string): Promise<Result<FxRateApproval>>;
  reject(rateId: string, reviewedBy: string, reason: string): Promise<Result<FxRateApproval>>;
  findByRateId(rateId: string): Promise<Result<FxRateApproval>>;
}
