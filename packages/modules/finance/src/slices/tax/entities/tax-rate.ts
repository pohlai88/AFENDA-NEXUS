/**
 * Tax rate entity — represents a tax rate for a specific jurisdiction.
 */

export type TaxRateType = 'VAT' | 'GST' | 'SALES_TAX' | 'WHT' | 'EXCISE' | 'CUSTOM';

export interface TaxRate {
  readonly id: string;
  readonly tenantId: string;
  readonly taxCodeId: string;
  readonly name: string;
  readonly ratePercent: number;
  readonly type: TaxRateType;
  readonly jurisdictionCode: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
