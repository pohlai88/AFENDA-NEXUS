import type { Result } from "@afenda/core";
import { ok } from "@afenda/core";
import type { IncomeStatement } from "../../../domain/index.js";
import { classifyIncomeStatement } from "../../../domain/index.js";
import type { ClassifiableRow } from "../../reporting/calculators/report-classifier.js";
import type { IGlBalanceRepo } from "../../../slices/gl/ports/gl-balance-repo.js";
import type { ILedgerRepo } from "../../../slices/gl/ports/ledger-repo.js";
import type { FinanceContext } from "../../../shared/finance-context.js";

export interface GetIncomeStatementInput {
  readonly ledgerId: string;
  readonly fromPeriodId: string;
  readonly toPeriodId: string;
}

/**
 * @see FC-07 — Income statement: by nature or by function
 *
 * Classifies trial balance rows by account.type instead of charAt(0) prefix.
 * Uses the pure classifyIncomeStatement calculator for testability and audit trail.
 */
export async function getIncomeStatement(
  input: GetIncomeStatementInput,
  deps: {
    balanceRepo: IGlBalanceRepo;
    ledgerRepo: ILedgerRepo;
  },
  _ctx?: FinanceContext,
): Promise<Result<IncomeStatement>> {
  const ledgerResult = await deps.ledgerRepo.findById(input.ledgerId);
  if (!ledgerResult.ok) return ledgerResult;
  const currency = ledgerResult.value.baseCurrency;

  const trialResult = await deps.balanceRepo.getTrialBalance(input.ledgerId, input.toPeriodId);
  if (!trialResult.ok) return trialResult as Result<never>;

  const rows: ClassifiableRow[] = trialResult.value.rows.map((row) => ({
    accountCode: row.accountCode,
    accountName: row.accountName,
    accountType: row.accountType,
    netBalance: row.debitTotal.amount - row.creditTotal.amount,
  }));

  const { result } = classifyIncomeStatement(rows, currency);

  return ok({
    ledgerId: ledgerResult.value.id as never,
    fromPeriodId: input.fromPeriodId,
    toPeriodId: input.toPeriodId,
    revenue: result.revenue,
    expenses: result.expenses,
    netIncome: result.netIncome,
  });
}
