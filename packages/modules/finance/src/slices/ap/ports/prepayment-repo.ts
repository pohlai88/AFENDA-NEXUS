import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { ApPrepayment, PrepaymentApplication } from '../entities/prepayment.js';

export interface CreatePrepaymentInput {
  readonly tenantId: string;
  readonly invoiceId: string;
  readonly supplierId: string;
  readonly amount: bigint;
  readonly currencyCode: string;
}

export interface ApplyPrepaymentInput {
  readonly prepaymentId: string;
  readonly targetInvoiceId: string;
  readonly amount: bigint;
  readonly appliedBy: string;
}

export interface IApPrepaymentRepo {
  create(input: CreatePrepaymentInput): Promise<Result<ApPrepayment>>;
  findById(id: string): Promise<Result<ApPrepayment>>;
  findBySupplier(
    supplierId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<ApPrepayment>>;
  findOpenBySupplier(supplierId: string): Promise<ApPrepayment[]>;
  applyToInvoice(input: ApplyPrepaymentInput): Promise<Result<PrepaymentApplication>>;
  cancel(id: string): Promise<Result<ApPrepayment>>;
}
