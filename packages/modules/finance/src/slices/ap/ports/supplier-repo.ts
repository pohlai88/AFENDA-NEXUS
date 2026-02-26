import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type {
  Supplier,
  SupplierStatus,
  PaymentMethodType,
  SupplierSite,
  SupplierBankAccount,
} from '../entities/supplier.js';

export interface CreateSupplierInput {
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
}

export interface UpdateSupplierInput {
  readonly name?: string;
  readonly taxId?: string | null;
  readonly currencyCode?: string;
  readonly defaultPaymentTermsId?: string | null;
  readonly defaultPaymentMethod?: PaymentMethodType | null;
  readonly whtRateId?: string | null;
  readonly remittanceEmail?: string | null;
  readonly status?: SupplierStatus;
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
}

export interface CreateSupplierBankAccountInput {
  readonly supplierId: string;
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

  addSite(input: CreateSupplierSiteInput): Promise<Result<SupplierSite>>;
  addBankAccount(input: CreateSupplierBankAccountInput): Promise<Result<SupplierBankAccount>>;
}
