export type SupplierStatus = 'ACTIVE' | 'ON_HOLD' | 'INACTIVE';

export type PaymentMethodType = 'BANK_TRANSFER' | 'CHECK' | 'WIRE' | 'SEPA' | 'LOCAL_TRANSFER';

export interface Supplier {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly code: string;
  readonly name: string;
  readonly taxId: string | null;
  readonly currencyCode: string;
  readonly defaultPaymentTermsId: string | null;
  readonly defaultPaymentMethod: PaymentMethodType | null;
  readonly whtRateId: string | null;
  readonly remittanceEmail: string | null;
  readonly status: SupplierStatus;
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
  readonly isActive: boolean;
}

export interface SupplierBankAccount {
  readonly id: string;
  readonly supplierId: string;
  readonly bankName: string;
  readonly accountName: string;
  readonly accountNumber: string;
  readonly iban: string | null;
  readonly swiftBic: string | null;
  readonly localBankCode: string | null;
  readonly currencyCode: string;
  readonly isPrimary: boolean;
  readonly isActive: boolean;
}
