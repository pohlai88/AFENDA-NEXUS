import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { PaymentRun, PaymentRunItem, PaymentRunStatus } from '../entities/payment-run.js';

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

export interface DiscountSumResult {
  readonly totalDiscount: bigint;
  readonly currencyCode: string;
}

export interface IApPaymentRunRepo {
  create(input: CreatePaymentRunInput): Promise<Result<PaymentRun>>;
  findById(id: string): Promise<Result<PaymentRun>>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<PaymentRun>>;
  addItem(runId: string, item: AddPaymentRunItemInput): Promise<Result<PaymentRunItem>>;
  updateStatus(id: string, status: PaymentRunStatus): Promise<Result<PaymentRun>>;
  execute(id: string, userId: string): Promise<Result<PaymentRun>>;
  /** Sum of discount amounts from executed runs since cutoff (for KPI). */
  getDiscountSumExecutedSince(cutoff: Date): Promise<Result<DiscountSumResult>>;
}
