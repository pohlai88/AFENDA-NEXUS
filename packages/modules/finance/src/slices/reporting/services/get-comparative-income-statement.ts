import type { Result } from "@afenda/core";
import { money, ok } from "@afenda/core";
import type { ComparativeIncomeStatement } from "../../../domain/index.js";
import { classifyIncomeStatement } from "../../../domain/index.js";
import { buildComparativeSection } from "../../reporting/calculators/comparative-report.js";
import type { ClassifiableRow } from "../../reporting/calculators/report-classifier.js";
import type { IGlBalanceRepo } from "../../../slices/gl/ports/gl-balance-repo.js";
import type { ILedgerRepo } from "../../../slices/gl/ports/ledger-repo.js";
import type { FinanceContext } from "../../../shared/finance-context.js";

export interface GetComparativeIncomeStatementInput {
  readonly ledgerId: string;
  readonly currentFromPeriodId: string;
  readonly currentToPeriodId: string;
  readonly priorFromPeriodId: string;
  readonly priorToPeriodId: string;
}

/**
 * @see FR-05 — Comparative period support
 *
 * Returns a side-by-side income statement comparing current and prior periods.
 * Revenue and expense sections include per-account variance.
 */
export async function getComparativeIncomeStatement(
  input: GetComparativeIncomeStatementInput,
  deps: {
    balanceRepo: IGlBalanceRepo;
    ledgerRepo: ILedgerRepo;
  },
  _ctx?: FinanceContext,
): Promise<Result<ComparativeIncomeStatement>> {
  const ledgerResult = await deps.ledgerRepo.findById(input.ledgerId);
  if (!ledgerResult.ok) return ledgerResult;
  const currency = ledgerResult.value.baseCurrency;

  // Fetch both periods in parallel
  const [currentTrialResult, priorTrialResult] = await Promise.all([
    deps.balanceRepo.getTrialBalance(input.ledgerId, input.currentToPeriodId),
    deps.balanceRepo.getTrialBalance(input.ledgerId, input.priorToPeriodId),
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

  const { result: currentIS } = classifyIncomeStatement(toRows(currentTrialResult.value), currency);
  const { result: priorIS } = classifyIncomeStatement(toRows(priorTrialResult.value), currency);

  const revenue = buildComparativeSection({ current: currentIS.revenue, prior: priorIS.revenue, currency }).result;
  const expenses = buildComparativeSection({ current: currentIS.expenses, prior: priorIS.expenses, currency }).result;

  const netIncomeVarianceAmount = currentIS.netIncome.amount - priorIS.netIncome.amount;

  return ok({
    ledgerId: ledgerResult.value.id as never,
    currentFromPeriodId: input.currentFromPeriodId,
    currentToPeriodId: input.currentToPeriodId,
    priorFromPeriodId: input.priorFromPeriodId,
    priorToPeriodId: input.priorToPeriodId,
    revenue,
    expenses,
    currentNetIncome: currentIS.netIncome,
    priorNetIncome: priorIS.netIncome,
    netIncomeVariance: money(netIncomeVarianceAmount, currency),
  });
}
