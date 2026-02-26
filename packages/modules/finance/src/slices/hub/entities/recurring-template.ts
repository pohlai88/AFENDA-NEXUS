import type { CompanyId, LedgerId, Money } from '@afenda/core';

export type RecurringFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface RecurringTemplateLine {
  readonly accountCode: string;
  readonly debit: Money;
  readonly credit: Money;
  readonly description?: string;
}

export interface RecurringTemplate {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly ledgerId: LedgerId;
  readonly description: string;
  readonly lines: readonly RecurringTemplateLine[];
  readonly frequency: RecurringFrequency;
  readonly nextRunDate: Date;
  readonly isActive: boolean;
  readonly createdAt: Date;
}
