import type { LeaseModification } from '../entities/lease-modification.js';

export interface CreateLeaseModificationInput {
  readonly leaseContractId: string;
  readonly modificationDate: Date;
  readonly modificationType: LeaseModification['modificationType'];
  readonly description: string;
  readonly previousLeaseTermMonths: number;
  readonly newLeaseTermMonths: number;
  readonly previousMonthlyPayment: bigint;
  readonly newMonthlyPayment: bigint;
  readonly previousDiscountRateBps: number;
  readonly newDiscountRateBps: number;
  readonly liabilityAdjustment: bigint;
  readonly rouAssetAdjustment: bigint;
  readonly gainLossOnModification: bigint;
  readonly currencyCode: string;
  readonly modifiedBy: string;
}

export interface ILeaseModificationRepo {
  findByLease(leaseContractId: string): Promise<readonly LeaseModification[]>;
  create(tenantId: string, input: CreateLeaseModificationInput): Promise<LeaseModification>;
}
