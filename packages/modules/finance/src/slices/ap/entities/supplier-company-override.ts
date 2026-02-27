import type { PaymentMethodType } from './supplier';

export interface SupplierCompanyOverride {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly companyId: string;
  readonly defaultPaymentTermsId: string | null;
  readonly defaultPaymentMethod: PaymentMethodType | null;
  readonly defaultCurrencyId: string | null;
  readonly tolerancePercent: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
