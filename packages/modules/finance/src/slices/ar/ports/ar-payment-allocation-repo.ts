import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { ArPaymentAllocation, AllocationItem } from '../entities/ar-payment-allocation.js';

export interface CreatePaymentAllocationInput {
  readonly tenantId: string;
  readonly customerId: string;
  readonly paymentDate: Date;
  readonly paymentRef: string;
  readonly totalAmount: bigint;
  readonly currencyCode: string;
}

export interface AddAllocationItemInput {
  readonly invoiceId: string;
  readonly allocatedAmount: bigint;
}

export interface IArPaymentAllocationRepo {
  create(input: CreatePaymentAllocationInput): Promise<Result<ArPaymentAllocation>>;
  findById(id: string): Promise<Result<ArPaymentAllocation>>;
  findByCustomer(
    customerId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<ArPaymentAllocation>>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<ArPaymentAllocation>>;
  addItem(allocationId: string, item: AddAllocationItemInput): Promise<Result<AllocationItem>>;
}
