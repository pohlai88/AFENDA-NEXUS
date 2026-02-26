import type { Result } from '@afenda/core';
import type { TrialBalance } from '../entities/gl-balance.js';
import type { IGlBalanceRepo } from '../../../slices/gl/ports/gl-balance-repo.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

export interface GetTrialBalanceInput {
  readonly ledgerId: string;
  readonly year: string;
  readonly period?: number;
}

export async function getTrialBalance(
  input: GetTrialBalanceInput,
  deps: { balanceRepo: IGlBalanceRepo },
  _ctx?: FinanceContext
): Promise<Result<TrialBalance>> {
  return deps.balanceRepo.getTrialBalance(input.ledgerId, input.year, input.period);
}
