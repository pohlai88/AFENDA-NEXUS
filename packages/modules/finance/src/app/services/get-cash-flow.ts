import type { Result } from "@afenda/core";
import { ok } from "@afenda/core";
import type { CashFlowStatement } from "../../domain/index.js";
import { classifyCashFlow } from "../../domain/index.js";
import type { ClassifiableRow } from "../../domain/calculators/report-classifier.js";
import type { IGlBalanceRepo } from "../ports/gl-balance-repo.js";
import type { ILedgerRepo } from "../ports/ledger-repo.js";
import type { FinanceContext } from "../../domain/finance-context.js";

export interface GetCashFlowInput {
  readonly ledgerId: string;
  readonly fromPeriodId: string;
  readonly toPeriodId: string;
}

/**
 * @see FC-08 — Cash flow statement: indirect method (IAS 7)
 *
 * Classifies GL balance movements by account.type instead of charAt(0) prefix.
 * Uses the pure classifyCashFlow calculator for testability and audit trail.
 *
 * Classification:
 *   REVENUE + EXPENSE → Operating activities
 *   ASSET (excl. cash accounts) → Investing activities (sign inverted)
 *   LIABILITY + EQUITY → Financing activities
 */
export async function getCashFlow(
  input: GetCashFlowInput,
  deps: {
    balanceRepo: IGlBalanceRepo;
    ledgerRepo: ILedgerRepo;
  },
  _ctx?: FinanceContext,
): Promise<Result<CashFlowStatement>> {
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

  const { result } = classifyCashFlow(rows, currency, ["1000"]);

  return ok({
    ledgerId: ledgerResult.value.id as never,
    fromPeriodId: input.fromPeriodId,
    toPeriodId: input.toPeriodId,
    operatingActivities: result.operatingActivities,
    investingActivities: result.investingActivities,
    financingActivities: result.financingActivities,
    netCashFlow: result.netCashFlow,
  });
}
