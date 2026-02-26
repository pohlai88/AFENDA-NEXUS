/**
 * IA-04: Software capitalization rules (IAS 38 + SIC-32).
 * Pure calculator — determines which software development costs
 * can be capitalized based on project phase and criteria.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type SoftwarePhase = 'PRELIMINARY' | 'APPLICATION_DEVELOPMENT' | 'POST_IMPLEMENTATION';

export interface SoftwareCostInput {
  readonly projectId: string;
  readonly phase: SoftwarePhase;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly costType:
    | 'INTERNAL_LABOR'
    | 'EXTERNAL_SERVICES'
    | 'HOSTING'
    | 'TRAINING'
    | 'DATA_CONVERSION'
    | 'OTHER';
  readonly isTechnicallyFeasible: boolean;
}

export interface SoftwareCostResult {
  readonly projectId: string;
  readonly capitalizeAmount: bigint;
  readonly expenseAmount: bigint;
  readonly phase: SoftwarePhase;
  readonly reason: string;
}

/**
 * Capitalizable phases: APPLICATION_DEVELOPMENT only (if technically feasible).
 * PRELIMINARY and POST_IMPLEMENTATION costs are always expensed.
 * Hosting and training costs are always expensed regardless of phase.
 */
export function classifySoftwareCosts(
  inputs: readonly SoftwareCostInput[]
): CalculatorResult<readonly SoftwareCostResult[]> {
  if (inputs.length === 0) {
    throw new Error('At least one software cost item required');
  }

  const results: SoftwareCostResult[] = inputs.map((input) => {
    // Always-expense cost types
    if (input.costType === 'HOSTING' || input.costType === 'TRAINING') {
      return {
        projectId: input.projectId,
        capitalizeAmount: 0n,
        expenseAmount: input.amount,
        phase: input.phase,
        reason: `${input.costType} costs are always expensed`,
      };
    }

    // Only APPLICATION_DEVELOPMENT phase can be capitalized
    if (input.phase !== 'APPLICATION_DEVELOPMENT') {
      return {
        projectId: input.projectId,
        capitalizeAmount: 0n,
        expenseAmount: input.amount,
        phase: input.phase,
        reason: `${input.phase} phase costs are expensed`,
      };
    }

    // Must be technically feasible
    if (!input.isTechnicallyFeasible) {
      return {
        projectId: input.projectId,
        capitalizeAmount: 0n,
        expenseAmount: input.amount,
        phase: input.phase,
        reason: 'Not technically feasible — expense',
      };
    }

    return {
      projectId: input.projectId,
      capitalizeAmount: input.amount,
      expenseAmount: 0n,
      phase: input.phase,
      reason: 'Meets capitalization criteria',
    };
  });

  const totalCapitalized = results.reduce((s, r) => s + r.capitalizeAmount, 0n);

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `Software costs: ${results.filter((r) => r.capitalizeAmount > 0n).length}/${inputs.length} capitalized, total=${totalCapitalized}`,
  };
}
