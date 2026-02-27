import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type {
  Supplier,
  SupplierStatus,
  SupplierOnboardingStatus,
  SupplierAccountGroup,
  SupplierCategory,
  PaymentMethodType,
  SupplierSite,
  SupplierBankAccount,
} from '../entities/supplier.js';

export interface CreateSupplierInput {
  readonly tenantId: string;
  readonly companyId: string;
  readonly code: string;
  readonly name: string;
  readonly tradingName?: string | null;
  readonly registrationNumber?: string | null;
  readonly countryOfIncorporation?: string | null;
  readonly legalForm?: string | null;
  readonly taxId: string | null;
  readonly currencyCode: string;
  readonly defaultPaymentTermsId: string | null;
  readonly defaultPaymentMethod: PaymentMethodType | null;
  readonly whtRateId: string | null;
  readonly remittanceEmail: string | null;
  readonly accountGroup?: SupplierAccountGroup;
  readonly category?: SupplierCategory;
  readonly industryCode?: string | null;
  readonly industryDescription?: string | null;
  readonly parentSupplierId?: string | null;
  readonly isGroupHeader?: boolean;
}

export interface UpdateSupplierInput {
  readonly name?: string;
  readonly tradingName?: string | null;
  readonly registrationNumber?: string | null;
  readonly countryOfIncorporation?: string | null;
  readonly legalForm?: string | null;
  readonly taxId?: string | null;
  readonly currencyCode?: string;
  readonly defaultPaymentTermsId?: string | null;
  readonly defaultPaymentMethod?: PaymentMethodType | null;
  readonly whtRateId?: string | null;
  readonly remittanceEmail?: string | null;
  readonly status?: SupplierStatus;
  readonly onboardingStatus?: SupplierOnboardingStatus;
  readonly accountGroup?: SupplierAccountGroup;
  readonly category?: SupplierCategory;
  readonly industryCode?: string | null;
  readonly industryDescription?: string | null;
  readonly parentSupplierId?: string | null;
  readonly isGroupHeader?: boolean;
}

export interface CreateSupplierSiteInput {
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
  readonly isPaySite?: boolean;
  readonly isPurchasingSite?: boolean;
  readonly isRemitTo?: boolean;
  readonly contactName?: string | null;
  readonly contactEmail?: string | null;
  readonly contactPhone?: string | null;
}

export interface CreateSupplierBankAccountInput {
  readonly supplierId: string;
  readonly siteId?: string | null;
  readonly bankName: string;
  readonly accountName: string;
  readonly accountNumber: string;
  readonly iban: string | null;
  readonly swiftBic: string | null;
  readonly localBankCode: string | null;
  readonly currencyCode: string;
  readonly isPrimary: boolean;
}

export interface ISupplierRepo {
  create(input: CreateSupplierInput): Promise<Result<Supplier>>;
  findById(id: string): Promise<Result<Supplier>>;
  findByCode(code: string): Promise<Result<Supplier>>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<Supplier>>;
  findByStatus(
    status: SupplierStatus,
    params?: PaginationParams
  ): Promise<PaginatedResult<Supplier>>;
  update(id: string, input: UpdateSupplierInput): Promise<Result<Supplier>>;

  findByUserId(userId: string): Promise<Result<Supplier>>;

  findByTaxId(tenantId: string, taxId: string): Promise<Supplier | null>;
  findByNameNormalized(tenantId: string, normalizedName: string): Promise<Supplier | null>;

  findChildren(
    parentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Supplier>>;
  findGroupHeaders(params?: PaginationParams): Promise<PaginatedResult<Supplier>>;

  addSite(input: CreateSupplierSiteInput): Promise<Result<SupplierSite>>;
  addBankAccount(input: CreateSupplierBankAccountInput): Promise<Result<SupplierBankAccount>>;
}
