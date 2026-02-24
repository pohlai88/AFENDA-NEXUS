import type { LeaseSchedule } from "../entities/lease-schedule.js";

export interface CreateLeaseScheduleInput {
  readonly leaseContractId: string;
  readonly periodNumber: number;
  readonly paymentDate: Date;
  readonly paymentAmount: bigint;
  readonly principalPortion: bigint;
  readonly interestPortion: bigint;
  readonly openingLiability: bigint;
  readonly closingLiability: bigint;
  readonly rouDepreciation: bigint;
  readonly currencyCode: string;
}

export interface ILeaseScheduleRepo {
  findByLease(leaseContractId: string): Promise<readonly LeaseSchedule[]>;
  createBatch(tenantId: string, lines: readonly CreateLeaseScheduleInput[]): Promise<readonly LeaseSchedule[]>;
  deleteByLease(leaseContractId: string): Promise<void>;
}
