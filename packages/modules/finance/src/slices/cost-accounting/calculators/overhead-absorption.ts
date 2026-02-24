/**
 * CA-06: Overhead absorption rate calculator.
 * Computes predetermined overhead rates and applies them to cost objects.
 * Pure calculator — no DB, no side effects.
 */

export type AbsorptionBasis = "DIRECT_LABOR_HOURS" | "MACHINE_HOURS" | "DIRECT_LABOR_COST" | "UNITS_PRODUCED";

export interface OverheadBudget {
  readonly costCenterId: string;
  readonly budgetedOverhead: bigint;
  readonly budgetedBasisQuantity: bigint;
  readonly absorptionBasis: AbsorptionBasis;
  readonly currencyCode: string;
}

export interface ActualProduction {
  readonly costCenterId: string;
  readonly actualBasisQuantity: bigint;
  readonly actualOverhead: bigint;
}

export interface OverheadAbsorptionInput {
  readonly budgets: readonly OverheadBudget[];
  readonly actuals: readonly ActualProduction[];
}

export interface OverheadAbsorptionLine {
  readonly costCenterId: string;
  readonly predeterminedRate: bigint;
  readonly absorptionBasis: AbsorptionBasis;
  readonly appliedOverhead: bigint;
  readonly actualOverhead: bigint;
  readonly overUnderAbsorbed: bigint;
  readonly isOverAbsorbed: boolean;
  readonly currencyCode: string;
}

export interface OverheadAbsorptionResult {
  readonly lines: readonly OverheadAbsorptionLine[];
  readonly totalApplied: bigint;
  readonly totalActual: bigint;
  readonly netOverUnder: bigint;
  readonly isNetOverAbsorbed: boolean;
}

/**
 * Compute overhead absorption rates and over/under absorption.
 */
export function computeOverheadAbsorption(input: OverheadAbsorptionInput): OverheadAbsorptionResult {
  if (input.budgets.length === 0) throw new Error("At least one overhead budget is required");

  const lines: OverheadAbsorptionLine[] = [];
  let totalApplied = 0n;
  let totalActual = 0n;

  for (const budget of input.budgets) {
    const actual = input.actuals.find((a) => a.costCenterId === budget.costCenterId);
    if (!actual) continue;

    // Predetermined rate = budgeted overhead / budgeted basis qty (scaled by 10000 for precision)
    const predeterminedRate = budget.budgetedBasisQuantity > 0n
      ? (budget.budgetedOverhead * 10000n) / budget.budgetedBasisQuantity
      : 0n;

    // Applied overhead = predetermined rate × actual basis qty / 10000
    const appliedOverhead = (predeterminedRate * actual.actualBasisQuantity) / 10000n;

    const overUnder = appliedOverhead - actual.actualOverhead;

    lines.push({
      costCenterId: budget.costCenterId,
      predeterminedRate,
      absorptionBasis: budget.absorptionBasis,
      appliedOverhead,
      actualOverhead: actual.actualOverhead,
      overUnderAbsorbed: overUnder < 0n ? -overUnder : overUnder,
      isOverAbsorbed: overUnder > 0n,
      currencyCode: budget.currencyCode,
    });

    totalApplied += appliedOverhead;
    totalActual += actual.actualOverhead;
  }

  const netOverUnder = totalApplied - totalActual;

  return {
    lines,
    totalApplied,
    totalActual,
    netOverUnder: netOverUnder < 0n ? -netOverUnder : netOverUnder,
    isNetOverAbsorbed: netOverUnder > 0n,
  };
}
