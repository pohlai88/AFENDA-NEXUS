/**
 * Lease schedule entity — individual payment/amortization line for a lease.
 */

export interface LeaseSchedule {
  readonly id: string;
  readonly tenantId: string;
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
  readonly createdAt: Date;
}
