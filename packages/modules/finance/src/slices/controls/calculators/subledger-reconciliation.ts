/**
 * @see IC-05 — Reconciliation controls: sub-ledger totals must equal GL control account
 *
 * Pure calculator — no I/O, no side effects.
 * Compares sub-ledger balances (AP, AR, FA, etc.) against their GL control accounts
 * and flags any discrepancies.
 */

export type SubledgerType =
  | "AP"
  | "AR"
  | "FIXED_ASSETS"
  | "INTANGIBLES"
  | "INVENTORY"
  | "PAYROLL"
  | "INTERCOMPANY"
  | "BANK"
  | "TAX";

export interface SubledgerBalanceInput {
  readonly subledgerType: SubledgerType;
  readonly controlAccountCode: string;
  readonly glControlBalance: bigint;
  readonly subledgerTotal: bigint;
  readonly currencyCode: string;
  readonly periodId: string;
}

export interface ReconciliationResult {
  readonly subledgerType: SubledgerType;
  readonly controlAccountCode: string;
  readonly glControlBalance: bigint;
  readonly subledgerTotal: bigint;
  readonly difference: bigint;
  readonly isReconciled: boolean;
  readonly currencyCode: string;
  readonly periodId: string;
}

export interface ReconciliationSummary {
  readonly results: readonly ReconciliationResult[];
  readonly totalChecked: number;
  readonly totalReconciled: number;
  readonly totalUnreconciled: number;
  readonly unreconciledItems: readonly ReconciliationResult[];
}

export function reconcileSubledgers(
  inputs: readonly SubledgerBalanceInput[],
): { result: ReconciliationSummary; explanation: string } {
  if (inputs.length === 0) {
    throw new Error("At least one sub-ledger balance is required");
  }

  const results: ReconciliationResult[] = inputs.map((input) => {
    const difference = input.glControlBalance - input.subledgerTotal;
    return {
      subledgerType: input.subledgerType,
      controlAccountCode: input.controlAccountCode,
      glControlBalance: input.glControlBalance,
      subledgerTotal: input.subledgerTotal,
      difference,
      isReconciled: difference === 0n,
      currencyCode: input.currencyCode,
      periodId: input.periodId,
    };
  });

  const reconciled = results.filter((r) => r.isReconciled);
  const unreconciled = results.filter((r) => !r.isReconciled);

  return {
    result: {
      results,
      totalChecked: results.length,
      totalReconciled: reconciled.length,
      totalUnreconciled: unreconciled.length,
      unreconciledItems: unreconciled,
    },
    explanation: unreconciled.length === 0
      ? `All ${results.length} sub-ledger(s) reconciled to GL`
      : `${unreconciled.length}/${results.length} sub-ledger(s) unreconciled: ${unreconciled.map((u) => `${u.subledgerType} (diff ${u.difference})`).join(", ")}`,
  };
}
