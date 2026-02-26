import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';
import type { ComparativeBalanceSheet } from '../entities/financial-reports.js';
import { classifyBalanceSheet } from '../calculators/report-classifier.js';
import { buildComparativeSection } from '../../reporting/calculators/comparative-report.js';
import type { ClassifiableRow } from '../../reporting/calculators/report-classifier.js';
import type { IGlBalanceRepo } from '../../../shared/ports/gl-read-ports.js';
import type { ILedgerRepo } from '../../../shared/ports/gl-read-ports.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

export interface GetComparativeBalanceSheetInput {
  readonly ledgerId: string;
  readonly currentPeriodId: string;
  readonly priorPeriodId: string;
}

/**
 * @see FR-05 — Comparative period support
 *
 * Returns a side-by-side balance sheet comparing current and prior periods.
 * Each section (assets, liabilities, equity) includes per-account variance.
 */
export async function getComparativeBalanceSheet(
  input: GetComparativeBalanceSheetInput,
  deps: {
    balanceRepo: IGlBalanceRepo;
    ledgerRepo: ILedgerRepo;
  },
  _ctx?: FinanceContext
): Promise<Result<ComparativeBalanceSheet>> {
  const ledgerResult = await deps.ledgerRepo.findById(input.ledgerId);
  if (!ledgerResult.ok) return ledgerResult;
  const currency = ledgerResult.value.baseCurrency;

  // Fetch both periods in parallel
  const [currentTrialResult, priorTrialResult] = await Promise.all([
    deps.balanceRepo.getTrialBalance(input.ledgerId, input.currentPeriodId),
    deps.balanceRepo.getTrialBalance(input.ledgerId, input.priorPeriodId),
  ]);
  if (!currentTrialResult.ok) return currentTrialResult as Result<never>;
  if (!priorTrialResult.ok) return priorTrialResult as Result<never>;

  const toRows = (trial: typeof currentTrialResult.value): ClassifiableRow[] =>
    trial.rows.map((row) => ({
      accountCode: row.accountCode,
      accountName: row.accountName,
      accountType: row.accountType,
      netBalance: row.debitTotal.amount - row.creditTotal.amount,
    }));

  const { result: currentBS } = classifyBalanceSheet(toRows(currentTrialResult.value), currency);
  const { result: priorBS } = classifyBalanceSheet(toRows(priorTrialResult.value), currency);

  const assets = buildComparativeSection({
    current: currentBS.assets,
    prior: priorBS.assets,
    currency,
  }).result;
  const liabilities = buildComparativeSection({
    current: currentBS.liabilities,
    prior: priorBS.liabilities,
    currency,
  }).result;
  const equity = buildComparativeSection({
    current: currentBS.equity,
    prior: priorBS.equity,
    currency,
  }).result;

  return ok({
    ledgerId: ledgerResult.value.id as never,
    currentPeriodId: input.currentPeriodId,
    priorPeriodId: input.priorPeriodId,
    assets,
    liabilities,
    equity,
    isBalanced: currentBS.isBalanced,
  });
}
