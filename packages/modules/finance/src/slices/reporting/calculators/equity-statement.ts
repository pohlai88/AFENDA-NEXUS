/**
 * SR-01: Statement of changes in equity calculator.
 * Pure calculator — computes equity movements for each component
 * (share capital, retained earnings, OCI, NCI, etc.) over a period.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export type EquityComponent =
  | "SHARE_CAPITAL"
  | "SHARE_PREMIUM"
  | "RETAINED_EARNINGS"
  | "OCI_RESERVE"
  | "TRANSLATION_RESERVE"
  | "REVALUATION_SURPLUS"
  | "HEDGING_RESERVE"
  | "TREASURY_SHARES"
  | "NCI";

export interface EquityMovement {
  readonly component: EquityComponent;
  readonly openingBalance: bigint;
  readonly profitOrLoss: bigint;
  readonly otherComprehensiveIncome: bigint;
  readonly dividendsDeclared: bigint;
  readonly sharesIssued: bigint;
  readonly sharesRepurchased: bigint;
  readonly transfersBetweenReserves: bigint;
  readonly otherMovements: bigint;
}

export interface EquityStatementRow {
  readonly component: EquityComponent;
  readonly openingBalance: bigint;
  readonly totalMovements: bigint;
  readonly closingBalance: bigint;
  readonly movements: {
    readonly profitOrLoss: bigint;
    readonly oci: bigint;
    readonly dividends: bigint;
    readonly sharesIssued: bigint;
    readonly sharesRepurchased: bigint;
    readonly transfers: bigint;
    readonly other: bigint;
  };
}

export interface EquityStatementResult {
  readonly rows: readonly EquityStatementRow[];
  readonly totalOpeningEquity: bigint;
  readonly totalClosingEquity: bigint;
  readonly totalComprehensiveIncome: bigint;
}

/**
 * Computes the statement of changes in equity from movement data.
 */
export function computeEquityStatement(
  movements: readonly EquityMovement[],
): CalculatorResult<EquityStatementResult> {
  if (movements.length === 0) {
    throw new Error("At least one equity component required");
  }

  let totalOpeningEquity = 0n;
  let totalClosingEquity = 0n;
  let totalComprehensiveIncome = 0n;

  const rows: EquityStatementRow[] = movements.map((m) => {
    const totalMovements =
      m.profitOrLoss +
      m.otherComprehensiveIncome -
      m.dividendsDeclared +
      m.sharesIssued -
      m.sharesRepurchased +
      m.transfersBetweenReserves +
      m.otherMovements;

    const closingBalance = m.openingBalance + totalMovements;

    totalOpeningEquity += m.openingBalance;
    totalClosingEquity += closingBalance;
    totalComprehensiveIncome += m.profitOrLoss + m.otherComprehensiveIncome;

    return {
      component: m.component,
      openingBalance: m.openingBalance,
      totalMovements,
      closingBalance,
      movements: {
        profitOrLoss: m.profitOrLoss,
        oci: m.otherComprehensiveIncome,
        dividends: m.dividendsDeclared,
        sharesIssued: m.sharesIssued,
        sharesRepurchased: m.sharesRepurchased,
        transfers: m.transfersBetweenReserves,
        other: m.otherMovements,
      },
    };
  });

  return {
    result: { rows, totalOpeningEquity, totalClosingEquity, totalComprehensiveIncome },
    inputs: { componentCount: movements.length },
    explanation: `Equity statement: ${rows.length} components, opening=${totalOpeningEquity}, closing=${totalClosingEquity}`,
  };
}
