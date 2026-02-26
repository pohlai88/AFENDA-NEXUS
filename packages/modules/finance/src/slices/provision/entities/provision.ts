/**
 * Provision entity — IAS 37 provision master data.
 */

export type ProvisionType =
  | 'WARRANTY'
  | 'RESTRUCTURING'
  | 'ONEROUS_CONTRACT'
  | 'DECOMMISSIONING'
  | 'LEGAL'
  | 'OTHER';
export type ProvisionStatus = 'ACTIVE' | 'PARTIALLY_UTILISED' | 'FULLY_UTILISED' | 'REVERSED';

export interface Provision {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly provisionNumber: string;
  readonly description: string;
  readonly provisionType: ProvisionType;
  readonly status: ProvisionStatus;
  readonly recognitionDate: Date;
  readonly expectedSettlementDate: Date | null;
  readonly initialAmount: bigint;
  readonly currentAmount: bigint;
  readonly discountRateBps: number;
  readonly currencyCode: string;
  readonly glAccountId: string | null;
  readonly isContingentLiability: boolean;
  readonly contingentLiabilityNote: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
