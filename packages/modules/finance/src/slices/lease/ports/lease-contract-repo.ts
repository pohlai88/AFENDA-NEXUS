import type { LeaseContract } from "../entities/lease-contract.js";

export interface CreateLeaseContractInput {
  readonly companyId: string;
  readonly leaseNumber: string;
  readonly description: string;
  readonly lesseeOrLessor: LeaseContract["lesseeOrLessor"];
  readonly leaseType: LeaseContract["leaseType"];
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
}

export interface ILeaseContractRepo {
  findById(id: string): Promise<LeaseContract | null>;
  findByCompany(companyId: string): Promise<readonly LeaseContract[]>;
  findAll(): Promise<readonly LeaseContract[]>;
  create(tenantId: string, input: CreateLeaseContractInput): Promise<LeaseContract>;
  updateStatus(id: string, status: LeaseContract["status"]): Promise<LeaseContract>;
}
