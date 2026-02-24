/**
 * Lease modification entity — tracks remeasurements and changes to lease terms.
 */

export type ModificationType = "TERM_EXTENSION" | "TERM_REDUCTION" | "PAYMENT_CHANGE" | "SCOPE_CHANGE" | "RATE_CHANGE";

export interface LeaseModification {
  readonly id: string;
  readonly tenantId: string;
  readonly leaseContractId: string;
  readonly modificationDate: Date;
  readonly modificationType: ModificationType;
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
  readonly createdAt: Date;
}
