import type { CompanyId, DateRange } from '@afenda/core';

export type PeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

export interface FiscalPeriod {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly name: string;
  readonly range: DateRange;
  readonly status: PeriodStatus;
}
