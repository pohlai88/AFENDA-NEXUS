import type { Result } from '@afenda/core';
import { money, ok } from '@afenda/core';
import type { EquityStatementReport } from '../entities/financial-reports.js';
import { computeEquityStatement, type EquityMovement } from '../calculators/equity-statement.js';
import type { ILedgerRepo } from '../../../shared/ports/gl-read-ports.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

export interface GetEquityStatementInput {
  readonly ledgerId: string;
  readonly periodId: string;
  readonly movements: readonly EquityMovement[];
}

/**
 * @see SR-01 — Statement of changes in equity (IAS 1 §106)
 *
 * Accepts equity movement data and delegates to the pure computeEquityStatement
 * calculator. Wraps bigint results into Money with the ledger's base currency.
 */
export async function getEquityStatement(
  input: GetEquityStatementInput,
  deps: {
    ledgerRepo: ILedgerRepo;
  },
  _ctx?: FinanceContext
): Promise<Result<EquityStatementReport>> {
  const ledgerResult = await deps.ledgerRepo.findById(input.ledgerId);
  if (!ledgerResult.ok) return ledgerResult;
  const currency = ledgerResult.value.baseCurrency;

  const { result } = computeEquityStatement(input.movements);

  const rows = result.rows.map((row) => ({
    component: row.component,
    openingBalance: money(row.openingBalance, currency),
    closingBalance: money(row.closingBalance, currency),
    totalMovements: money(row.totalMovements, currency),
    movements: {
      profitOrLoss: money(row.movements.profitOrLoss, currency),
      oci: money(row.movements.oci, currency),
      dividends: money(row.movements.dividends, currency),
      sharesIssued: money(row.movements.sharesIssued, currency),
      sharesRepurchased: money(row.movements.sharesRepurchased, currency),
      transfers: money(row.movements.transfers, currency),
      other: money(row.movements.other, currency),
    },
  }));

  return ok({
    ledgerId: ledgerResult.value.id as never,
    periodId: input.periodId,
    rows,
    totalOpeningEquity: money(result.totalOpeningEquity, currency),
    totalClosingEquity: money(result.totalClosingEquity, currency),
    totalComprehensiveIncome: money(result.totalComprehensiveIncome, currency),
  });
}
