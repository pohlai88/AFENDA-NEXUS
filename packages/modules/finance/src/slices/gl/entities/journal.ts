import type { CompanyId, LedgerId, Money } from '@afenda/core';

export interface JournalLine {
  readonly accountId: string;
  readonly accountCode: string;
  readonly debit: Money;
  readonly credit: Money;
  readonly description?: string;
  readonly currencyCode?: string;
  readonly baseCurrencyDebit?: Money;
  readonly baseCurrencyCredit?: Money;
}

export interface Journal {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly ledgerId: LedgerId;
  readonly fiscalPeriodId: string;
  readonly description: string;
  readonly date: Date;
  readonly status: 'DRAFT' | 'PENDING_APPROVAL' | 'POSTED' | 'REVERSED' | 'VOIDED';
  readonly lines: readonly JournalLine[];
  readonly reversalOfId?: string;
  readonly reversedById?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
