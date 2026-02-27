import type { Result } from '@afenda/core';
import type { SupplierCompanyOverride } from '../entities/supplier-company-override.js';
import type { PaymentMethodType } from '../entities/supplier.js';

export interface UpsertCompanyOverrideInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly companyId: string;
  readonly defaultPaymentTermsId: string | null;
  readonly defaultPaymentMethod: PaymentMethodType | null;
  readonly defaultCurrencyId: string | null;
  readonly tolerancePercent: string | null;
  readonly isActive: boolean;
}

export interface ISupplierCompanyOverrideRepo {
  upsert(input: UpsertCompanyOverrideInput): Promise<Result<SupplierCompanyOverride>>;
  findBySupplierId(supplierId: string): Promise<readonly SupplierCompanyOverride[]>;
  findBySupplierAndCompany(
    supplierId: string,
    companyId: string
  ): Promise<SupplierCompanyOverride | null>;
}
