import type { Result } from '@afenda/core';
import { ok, err, AppError, money } from '@afenda/core';
import type { BudgetVarianceReport, BudgetVarianceRow } from '../entities/budget.js';
import type { IBudgetRepo } from '../../../slices/hub/ports/budget-repo.js';
import type { IGlBalanceRepo } from '../../../shared/ports/gl-read-ports.js';
import type { IAccountRepo } from '../../../shared/ports/gl-read-ports.js';
import type { ILedgerRepo } from '../../../shared/ports/gl-read-ports.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

export interface GetBudgetVarianceInput {
  readonly ledgerId: string;
  readonly periodId: string;
}

export async function getBudgetVariance(
  input: GetBudgetVarianceInput,
  deps: {
    budgetRepo: IBudgetRepo;
    balanceRepo: IGlBalanceRepo;
    accountRepo: IAccountRepo;
    ledgerRepo: ILedgerRepo;
  },
  _ctx?: FinanceContext
): Promise<Result<BudgetVarianceReport>> {
  // Load ledger to get base currency
  const ledgerResult = await deps.ledgerRepo.findById(input.ledgerId);
  if (!ledgerResult.ok) return ledgerResult;
  const currency = ledgerResult.value.baseCurrency;

  // Load budget entries for this ledger+period
  const budgetResult = await deps.budgetRepo.findByLedgerAndPeriod(input.ledgerId, input.periodId, {
    page: 1,
    limit: 1000,
  });

  if (budgetResult.data.length === 0) {
    return err(new AppError('NO_BUDGET_DATA', 'No budget entries found for this ledger/period'));
  }

  // Load trial balance for the same ledger+period
  const trialResult = await deps.balanceRepo.getTrialBalance(input.ledgerId, input.periodId);
  if (!trialResult.ok) return trialResult as Result<never>;

  // Build a map of accountCode → actual net balance from trial balance
  const actualMap = new Map<string, bigint>();
  for (const row of trialResult.value.rows) {
    const net = row.debitTotal.amount - row.creditTotal.amount;
    actualMap.set(row.accountCode, net);
  }

  // Build variance rows
  const rows: BudgetVarianceRow[] = [];
  let totalBudget = 0n;
  let totalActual = 0n;

  for (const entry of budgetResult.data) {
    const actual = actualMap.get(entry.accountCode) ?? 0n;
    const budget = entry.budgetAmount.amount;
    const variance = budget - actual;

    rows.push({
      accountCode: entry.accountCode,
      accountName: entry.accountCode,
      budgetAmount: money(budget, currency),
      actualAmount: money(actual, currency),
      variance: money(variance, currency),
    });

    totalBudget += budget;
    totalActual += actual;
  }

  return ok({
    ledgerId: ledgerResult.value.id as never,
    periodId: input.periodId,
    rows,
    totalBudget: money(totalBudget, currency),
    totalActual: money(totalActual, currency),
    totalVariance: money(totalBudget - totalActual, currency),
  });
}
