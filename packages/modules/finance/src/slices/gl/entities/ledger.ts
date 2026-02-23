import type { CompanyId } from "@afenda/core";

export interface Ledger {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly name: string;
  readonly baseCurrency: string;
  readonly fiscalYearStart: number;
  readonly isDefault: boolean;
  readonly createdAt: Date;
}
