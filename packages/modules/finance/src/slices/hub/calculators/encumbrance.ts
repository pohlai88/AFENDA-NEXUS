/**
 * BG-02: Encumbrance calculator.
 * Tracks committed but not-yet-spent budget amounts (purchase orders,
 * contracts) to prevent over-commitment of budget.
 * Pure calculator — no DB, no side effects.
 */

import type { CalculatorResult } from "../../../shared/types.js";

export interface EncumbranceItem {
  readonly documentId: string;
  readonly documentType: "PURCHASE_ORDER" | "CONTRACT" | "REQUISITION";
  readonly accountCode: string;
  readonly encumberedAmount: bigint;
  readonly liquidatedAmount: bigint;
}

export interface BudgetLine {
  readonly accountCode: string;
  readonly budgetAmount: bigint;
  readonly actualSpent: bigint;
}

export interface EncumbranceInput {
  readonly encumbrances: readonly EncumbranceItem[];
  readonly budgetLines: readonly BudgetLine[];
  readonly currencyCode: string;
}

export interface EncumbranceAccountSummary {
  readonly accountCode: string;
  readonly budgetAmount: bigint;
  readonly actualSpent: bigint;
  readonly encumbered: bigint;
  readonly liquidated: bigint;
  readonly openEncumbrance: bigint;
  readonly availableBudget: bigint;
  readonly isOverCommitted: boolean;
}

export interface EncumbranceResult {
  readonly accounts: readonly EncumbranceAccountSummary[];
  readonly totalBudget: bigint;
  readonly totalActual: bigint;
  readonly totalEncumbered: bigint;
  readonly totalAvailable: bigint;
  readonly overCommittedCount: number;
  readonly currencyCode: string;
}

/**
 * Compute encumbrance status for each budget account.
 */
export function computeEncumbrance(
  input: EncumbranceInput,
): CalculatorResult<EncumbranceResult> {
  if (input.budgetLines.length === 0) throw new Error("At least one budget line is required");

  // Aggregate encumbrances by account
  const encByAccount = new Map<string, { encumbered: bigint; liquidated: bigint }>();
  for (const enc of input.encumbrances) {
    const existing = encByAccount.get(enc.accountCode) ?? { encumbered: 0n, liquidated: 0n };
    existing.encumbered += enc.encumberedAmount;
    existing.liquidated += enc.liquidatedAmount;
    encByAccount.set(enc.accountCode, existing);
  }

  const accounts: EncumbranceAccountSummary[] = [];
  let totalBudget = 0n;
  let totalActual = 0n;
  let totalEncumbered = 0n;
  let totalAvailable = 0n;
  let overCommittedCount = 0;

  for (const bl of input.budgetLines) {
    const enc = encByAccount.get(bl.accountCode) ?? { encumbered: 0n, liquidated: 0n };
    const openEncumbrance = enc.encumbered - enc.liquidated;
    const availableBudget = bl.budgetAmount - bl.actualSpent - openEncumbrance;
    const isOverCommitted = availableBudget < 0n;

    accounts.push({
      accountCode: bl.accountCode,
      budgetAmount: bl.budgetAmount,
      actualSpent: bl.actualSpent,
      encumbered: enc.encumbered,
      liquidated: enc.liquidated,
      openEncumbrance,
      availableBudget,
      isOverCommitted,
    });

    totalBudget += bl.budgetAmount;
    totalActual += bl.actualSpent;
    totalEncumbered += openEncumbrance;
    totalAvailable += availableBudget;
    if (isOverCommitted) overCommittedCount++;
  }

  return {
    result: {
      accounts,
      totalBudget,
      totalActual,
      totalEncumbered,
      totalAvailable,
      overCommittedCount,
      currencyCode: input.currencyCode,
    },
    inputs: { budgetLineCount: input.budgetLines.length, encumbranceCount: input.encumbrances.length },
    explanation: `Encumbrance: ${accounts.length} accounts, ${overCommittedCount} over-committed, available=${totalAvailable}`,
  };
}
