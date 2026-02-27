export type SupplierStatus = 'ACTIVE' | 'ON_HOLD' | 'INACTIVE' | 'BLOCKED' | 'BLACKLISTED';

export type SupplierOnboardingStatus =
  | 'PROSPECT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'INACTIVE';

export type SupplierAccountGroup =
  | 'TRADE'
  | 'INTERCOMPANY'
  | 'ONE_TIME'
  | 'EMPLOYEE'
  | 'GOVERNMENT'
  | 'SUBCONTRACTOR';

export type SupplierCategory =
  | 'GOODS'
  | 'SERVICES'
  | 'SUBCONTRACTOR'
  | 'ONE_TIME'
  | 'INTERCOMPANY'
  | 'GOVERNMENT'
  | 'EMPLOYEE';

export type PaymentMethodType = 'BANK_TRANSFER' | 'CHECK' | 'WIRE' | 'SEPA' | 'LOCAL_TRANSFER';

export interface Supplier {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly code: string;
  readonly name: string;
  readonly tradingName: string | null;
  readonly registrationNumber: string | null;
  readonly countryOfIncorporation: string | null;
  readonly legalForm: string | null;
  readonly taxId: string | null;
  readonly currencyCode: string;
  readonly defaultPaymentTermsId: string | null;
  readonly defaultPaymentMethod: PaymentMethodType | null;
  readonly whtRateId: string | null;
  readonly remittanceEmail: string | null;
  readonly status: SupplierStatus;
  readonly onboardingStatus: SupplierOnboardingStatus;
  readonly accountGroup: SupplierAccountGroup;
  readonly category: SupplierCategory;
  readonly industryCode: string | null;
  readonly industryDescription: string | null;
  readonly parentSupplierId: string | null;
  readonly isGroupHeader: boolean;
  readonly sites: readonly SupplierSite[];
  readonly bankAccounts: readonly SupplierBankAccount[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SupplierSite {
  readonly id: string;
  readonly supplierId: string;
  readonly siteCode: string;
  readonly name: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly region: string | null;
  readonly postalCode: string | null;
  readonly countryCode: string;
  readonly isPrimary: boolean;
  readonly isPaySite: boolean;
  readonly isPurchasingSite: boolean;
  readonly isRemitTo: boolean;
  readonly contactName: string | null;
  readonly contactEmail: string | null;
  readonly contactPhone: string | null;
  readonly isActive: boolean;
}

export interface SupplierBankAccount {
  readonly id: string;
  readonly supplierId: string;
  readonly siteId: string | null;
  readonly bankName: string;
  readonly accountName: string;
  readonly accountNumber: string;
  readonly iban: string | null;
  readonly swiftBic: string | null;
  readonly localBankCode: string | null;
  readonly currencyCode: string;
  readonly isPrimary: boolean;
  readonly isVerified: boolean;
  readonly verifiedBy: string | null;
  readonly verifiedAt: Date | null;
  readonly verificationMethod: string | null;
  readonly isActive: boolean;
}
