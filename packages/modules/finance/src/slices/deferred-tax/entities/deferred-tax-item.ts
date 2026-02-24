/**
 * DT-00: Deferred tax item entity — IAS 12.
 * Persisted record of a temporary difference and its deferred tax effect.
 */

export interface DeferredTaxItem {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly itemName: string;
  readonly origin: string;
  readonly carryingAmount: bigint;
  readonly taxBase: bigint;
  readonly temporaryDifference: bigint;
  readonly taxRateBps: number;
  readonly deferredTaxAsset: bigint;
  readonly deferredTaxLiability: bigint;
  readonly isRecognized: boolean;
  readonly currencyCode: string;
  readonly periodId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
