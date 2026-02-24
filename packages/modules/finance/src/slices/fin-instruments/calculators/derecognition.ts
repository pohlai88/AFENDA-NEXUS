/**
 * FI-05: Derecognition calculator — IFRS 9.3.2.
 * Pure calculator — determines if a financial asset can be derecognized
 * based on transfer of risks and rewards.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export interface DerecognitionInput {
  readonly instrumentId: string;
  readonly carryingAmount: bigint;
  readonly considerationReceived: bigint;
  readonly transfersSubstantiallyAllRisks: boolean;
  readonly retainsSubstantiallyAllRisks: boolean;
  readonly retainsControl: boolean;
  readonly continuingInvolvementFairValue: bigint;
  readonly currencyCode: string;
}

export type DerecognitionOutcome = "FULL_DERECOGNITION" | "NO_DERECOGNITION" | "CONTINUING_INVOLVEMENT";

export interface DerecognitionResult {
  readonly instrumentId: string;
  readonly outcome: DerecognitionOutcome;
  readonly gainOrLoss: bigint;
  readonly isGain: boolean;
  readonly derecognizedAmount: bigint;
  readonly retainedAmount: bigint;
  readonly reason: string;
}

/**
 * IFRS 9.3.2 derecognition decision tree:
 * 1. Transfers substantially all risks → full derecognition
 * 2. Retains substantially all risks → no derecognition
 * 3. Neither → check control:
 *    a. Lost control → full derecognition
 *    b. Retains control → continuing involvement
 */
export function evaluateDerecognition(
  inputs: readonly DerecognitionInput[],
): CalculatorResult<readonly DerecognitionResult[]> {
  if (inputs.length === 0) {
    throw new Error("At least one instrument required");
  }

  const results: DerecognitionResult[] = inputs.map((input) => {
    // Transfers substantially all risks
    if (input.transfersSubstantiallyAllRisks) {
      const gainOrLoss = input.considerationReceived - input.carryingAmount;
      return {
        instrumentId: input.instrumentId,
        outcome: "FULL_DERECOGNITION" as DerecognitionOutcome,
        gainOrLoss,
        isGain: gainOrLoss > 0n,
        derecognizedAmount: input.carryingAmount,
        retainedAmount: 0n,
        reason: "Transferred substantially all risks and rewards",
      };
    }

    // Retains substantially all risks
    if (input.retainsSubstantiallyAllRisks) {
      return {
        instrumentId: input.instrumentId,
        outcome: "NO_DERECOGNITION" as DerecognitionOutcome,
        gainOrLoss: 0n,
        isGain: false,
        derecognizedAmount: 0n,
        retainedAmount: input.carryingAmount,
        reason: "Retains substantially all risks and rewards — no derecognition",
      };
    }

    // Neither transfers nor retains substantially all — check control
    if (!input.retainsControl) {
      const gainOrLoss = input.considerationReceived - input.carryingAmount;
      return {
        instrumentId: input.instrumentId,
        outcome: "FULL_DERECOGNITION" as DerecognitionOutcome,
        gainOrLoss,
        isGain: gainOrLoss > 0n,
        derecognizedAmount: input.carryingAmount,
        retainedAmount: 0n,
        reason: "Lost control — full derecognition",
      };
    }

    // Retains control — continuing involvement
    const retainedAmount = input.continuingInvolvementFairValue;
    const derecognizedAmount = input.carryingAmount - retainedAmount;
    const gainOrLoss = input.considerationReceived - derecognizedAmount;

    return {
      instrumentId: input.instrumentId,
      outcome: "CONTINUING_INVOLVEMENT" as DerecognitionOutcome,
      gainOrLoss,
      isGain: gainOrLoss > 0n,
      derecognizedAmount,
      retainedAmount,
      reason: "Retains control with continuing involvement",
    };
  });

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `Derecognition: ${results.filter((r) => r.outcome === "FULL_DERECOGNITION").length} full, ${results.filter((r) => r.outcome === "NO_DERECOGNITION").length} no, ${results.filter((r) => r.outcome === "CONTINUING_INVOLVEMENT").length} continuing`,
  };
}
