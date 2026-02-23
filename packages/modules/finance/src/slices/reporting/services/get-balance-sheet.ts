import type { Result } from "@afenda/core";
import { ok } from "@afenda/core";
import type { BalanceSheet } from "../../../domain/index.js";
import { classifyBalanceSheet } from "../../../domain/index.js";
import type { ClassifiableRow } from "../../reporting/calculators/report-classifier.js";
import type { IGlBalanceRepo } from "../../../slices/gl/ports/gl-balance-repo.js";
import type { ILedgerRepo } from "../../../slices/gl/ports/ledger-repo.js";
import type { FinanceContext } from "../../../shared/finance-context.js";

export interface GetBalanceSheetInput {
  readonly ledgerId: string;
  readonly periodId: string;
}

/**
 * @see FC-06 — Balance sheet (IAS 1 §54 line items)
 *
 * Classifies trial balance rows by account.type instead of charAt(0) prefix.
 * Uses the pure classifyBalanceSheet calculator for testability and audit trail.
 */
export async function getBalanceSheet(
  input: GetBalanceSheetInput,
  deps: {
    balanceRepo: IGlBalanceRepo;
    ledgerRepo: ILedgerRepo;
  },
  _ctx?: FinanceContext,
): Promise<Result<BalanceSheet>> {
  const ledgerResult = await deps.ledgerRepo.findById(input.ledgerId);
  if (!ledgerResult.ok) return ledgerResult;
  const currency = ledgerResult.value.baseCurrency;

  const trialResult = await deps.balanceRepo.getTrialBalance(input.ledgerId, input.periodId);
  if (!trialResult.ok) return trialResult as Result<never>;

  const rows: ClassifiableRow[] = trialResult.value.rows.map((row) => ({
    accountCode: row.accountCode,
    accountName: row.accountName,
    accountType: row.accountType,
    netBalance: row.debitTotal.amount - row.creditTotal.amount,
  }));

  const { result } = classifyBalanceSheet(rows, currency);

  return ok({
    ledgerId: ledgerResult.value.id as never,
    periodId: input.periodId,
    assets: result.assets,
    liabilities: result.liabilities,
    equity: result.equity,
    isBalanced: result.isBalanced,
  });
}
