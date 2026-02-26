import type { Result } from '@afenda/core';
import type { TrialBalance } from '../entities/gl-balance.js';

export interface BalanceUpsertLine {
  readonly accountId: string;
  readonly debit: bigint;
  readonly credit: bigint;
}

export interface IGlBalanceRepo {
  getTrialBalance(ledgerId: string, year: string, period?: number): Promise<Result<TrialBalance>>;

  upsertForJournal(input: {
    tenantId: string;
    ledgerId: string;
    fiscalYear: string;
    fiscalPeriod: number;
    lines: readonly BalanceUpsertLine[];
  }): Promise<void>;
}
