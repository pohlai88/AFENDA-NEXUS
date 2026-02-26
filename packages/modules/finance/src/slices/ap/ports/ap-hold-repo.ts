import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { ApHold, ApHoldType, ApHoldStatus } from '../entities/ap-hold.js';

export interface CreateApHoldInput {
  readonly tenantId: string;
  readonly invoiceId: string;
  readonly holdType: ApHoldType;
  readonly holdReason: string;
  readonly createdBy: string;
}

export interface ReleaseApHoldInput {
  readonly releasedBy: string;
  readonly releaseReason: string;
}

export interface IApHoldRepo {
  create(input: CreateApHoldInput): Promise<Result<ApHold>>;
  findById(id: string): Promise<Result<ApHold>>;
  findByInvoice(invoiceId: string): Promise<ApHold[]>;
  findActiveByInvoice(invoiceId: string): Promise<ApHold[]>;
  findAll(
    params?: PaginationParams & {
      status?: ApHoldStatus;
      holdType?: ApHoldType;
      supplierId?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<PaginatedResult<ApHold>>;
  release(id: string, input: ReleaseApHoldInput): Promise<Result<ApHold>>;
  hasActiveHolds(invoiceId: string): Promise<boolean>;
}
