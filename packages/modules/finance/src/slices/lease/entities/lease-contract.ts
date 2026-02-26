/**
 * Lease contract entity — IFRS 16 lease master data.
 */

export type LeaseType = 'FINANCE' | 'OPERATING';
export type LeaseStatus = 'DRAFT' | 'ACTIVE' | 'MODIFIED' | 'TERMINATED' | 'EXPIRED';
export type LesseeOrLessor = 'LESSEE' | 'LESSOR';

export interface LeaseContract {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly leaseNumber: string;
  readonly description: string;
  readonly lesseeOrLessor: LesseeOrLessor;
  readonly leaseType: LeaseType;
  readonly status: LeaseStatus;
  readonly counterpartyId: string;
  readonly counterpartyName: string;
  readonly assetDescription: string;
  readonly commencementDate: Date;
  readonly endDate: Date;
  readonly leaseTermMonths: number;
  readonly currencyCode: string;
  readonly monthlyPayment: bigint;
  readonly annualEscalationBps: number;
  readonly discountRateBps: number;
  readonly rouAssetAmount: bigint;
  readonly leaseLiabilityAmount: bigint;
  readonly isShortTerm: boolean;
  readonly isLowValue: boolean;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
