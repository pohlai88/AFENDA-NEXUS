/**
 * IA-01: Recognition criteria check for intangible assets (IAS 38).
 * Pure calculator — determines if expenditure meets IAS 38 recognition criteria
 * and applies R&D phase gate for internally generated intangibles.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type ExpenditurePhase = 'RESEARCH' | 'DEVELOPMENT' | 'ACQUISITION';

export interface RecognitionInput {
  readonly assetId: string;
  readonly expenditurePhase: ExpenditurePhase;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly isIdentifiable: boolean;
  readonly hasControl: boolean;
  readonly hasFutureEconomicBenefit: boolean;
  readonly isTechnicallyFeasible: boolean;
  readonly hasIntentionToComplete: boolean;
  readonly hasAbilityToUseOrSell: boolean;
  readonly canMeasureReliably: boolean;
  readonly hasAdequateResources: boolean;
}

export interface RecognitionResult {
  readonly assetId: string;
  readonly canCapitalize: boolean;
  readonly expenseImmediately: boolean;
  readonly capitalizeAmount: bigint;
  readonly expenseAmount: bigint;
  readonly failedCriteria: readonly string[];
  readonly phase: ExpenditurePhase;
}

/**
 * IAS 38 recognition criteria:
 * - Identifiable (separable or arises from contractual/legal rights)
 * - Entity has control
 * - Future economic benefit is probable
 * For internally generated: must be in development phase + 6 additional criteria
 * Research phase expenditure is ALWAYS expensed.
 */
export function checkRecognition(
  inputs: readonly RecognitionInput[]
): CalculatorResult<readonly RecognitionResult[]> {
  if (inputs.length === 0) {
    throw new Error('At least one expenditure item required');
  }

  const results: RecognitionResult[] = inputs.map((input) => {
    const failedCriteria: string[] = [];

    // Research phase — always expense
    if (input.expenditurePhase === 'RESEARCH') {
      return {
        assetId: input.assetId,
        canCapitalize: false,
        expenseImmediately: true,
        capitalizeAmount: 0n,
        expenseAmount: input.amount,
        failedCriteria: ['Research phase — must expense per IAS 38.54'],
        phase: input.expenditurePhase,
      };
    }

    // General recognition criteria (IAS 38.21)
    if (!input.isIdentifiable) failedCriteria.push('Not identifiable');
    if (!input.hasControl) failedCriteria.push('No control');
    if (!input.hasFutureEconomicBenefit) failedCriteria.push('No future economic benefit');
    if (!input.canMeasureReliably) failedCriteria.push('Cannot measure cost reliably');

    // Development phase additional criteria (IAS 38.57)
    if (input.expenditurePhase === 'DEVELOPMENT') {
      if (!input.isTechnicallyFeasible) failedCriteria.push('Not technically feasible');
      if (!input.hasIntentionToComplete) failedCriteria.push('No intention to complete');
      if (!input.hasAbilityToUseOrSell) failedCriteria.push('No ability to use or sell');
      if (!input.hasAdequateResources) failedCriteria.push('Inadequate resources');
    }

    const canCapitalize = failedCriteria.length === 0;

    return {
      assetId: input.assetId,
      canCapitalize,
      expenseImmediately: !canCapitalize,
      capitalizeAmount: canCapitalize ? input.amount : 0n,
      expenseAmount: canCapitalize ? 0n : input.amount,
      failedCriteria,
      phase: input.expenditurePhase,
    };
  });

  const capitalized = results.filter((r) => r.canCapitalize).length;

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `Recognition: ${capitalized}/${inputs.length} items meet capitalization criteria`,
  };
}
