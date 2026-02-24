/**
 * PR-01: Provision recognition criteria check (IAS 37).
 * Determines if a provision should be recognized based on three criteria.
 * Pure calculator — no DB, no side effects.
 */

export interface RecognitionCriteriaInput {
  readonly hasPresentObligation: boolean;
  readonly isProbableOutflow: boolean;
  readonly canReliablyEstimate: boolean;
  readonly estimatedAmount: bigint;
  readonly description: string;
}

export interface RecognitionCriteriaResult {
  readonly shouldRecognize: boolean;
  readonly isContingentLiability: boolean;
  readonly reasons: readonly string[];
}

export function checkRecognitionCriteria(input: RecognitionCriteriaInput): RecognitionCriteriaResult {
  const reasons: string[] = [];

  if (!input.hasPresentObligation) {
    reasons.push("No present obligation exists — no provision or contingent liability");
    return { shouldRecognize: false, isContingentLiability: false, reasons };
  }

  if (!input.isProbableOutflow) {
    reasons.push("Outflow not probable — disclose as contingent liability unless remote");
    return { shouldRecognize: false, isContingentLiability: true, reasons };
  }

  if (!input.canReliablyEstimate) {
    reasons.push("Cannot reliably estimate — disclose as contingent liability");
    return { shouldRecognize: false, isContingentLiability: true, reasons };
  }

  if (input.estimatedAmount <= 0n) {
    reasons.push("Estimated amount must be positive");
    return { shouldRecognize: false, isContingentLiability: false, reasons };
  }

  reasons.push("All IAS 37 recognition criteria met — recognize provision");
  return { shouldRecognize: true, isContingentLiability: false, reasons };
}
