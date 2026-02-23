import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { PaymentRun, PaymentRunItem } from "../entities/payment-run.js";

export interface CreatePaymentRunInput {
  readonly tenantId: string;
  readonly companyId: string;
  readonly runDate: Date;
  readonly cutoffDate: Date;
  readonly currencyCode: string;
}

export interface AddPaymentRunItemInput {
  readonly invoiceId: string;
  readonly supplierId: string;
  readonly amount: bigint;
  readonly discountAmount: bigint;
  readonly netAmount: bigint;
}

export interface IApPaymentRunRepo {
  create(input: CreatePaymentRunInput): Promise<Result<PaymentRun>>;
  findById(id: string): Promise<Result<PaymentRun>>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<PaymentRun>>;
  addItem(runId: string, item: AddPaymentRunItemInput): Promise<Result<PaymentRunItem>>;
  updateStatus(id: string, status: string): Promise<Result<PaymentRun>>;
  execute(id: string, userId: string): Promise<Result<PaymentRun>>;
}
