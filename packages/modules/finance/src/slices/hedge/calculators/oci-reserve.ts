/**
 * HA-03: OCI reserve tracking for cash flow hedges — IFRS 9 §6.5.11.
 * Pure calculator — tracks OCI reserve balance, reclassifications to P&L,
 * and basis adjustments.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export interface OciReserveInput {
  readonly hedgeId: string;
  readonly openingOciReserve: bigint;
  readonly effectivePortionChange: bigint;
  readonly reclassifiedToPnl: bigint;
  readonly basisAdjustment: bigint;
  readonly currencyCode: string;
}

export interface OciReserveResult {
  readonly hedgeId: string;
  readonly openingBalance: bigint;
  readonly effectivePortion: bigint;
  readonly reclassifiedToPnl: bigint;
  readonly basisAdjustment: bigint;
  readonly closingBalance: bigint;
  readonly netMovement: bigint;
}

/**
 * OCI reserve movement:
 * closing = opening + effective portion - reclassified to P&L - basis adjustment
 */
export function computeOciReserve(
  inputs: readonly OciReserveInput[],
): CalculatorResult<readonly OciReserveResult[]> {
  if (inputs.length === 0) {
    throw new Error("At least one hedge required");
  }

  const results: OciReserveResult[] = inputs.map((input) => {
    const netMovement =
      input.effectivePortionChange - input.reclassifiedToPnl - input.basisAdjustment;
    const closingBalance = input.openingOciReserve + netMovement;

    return {
      hedgeId: input.hedgeId,
      openingBalance: input.openingOciReserve,
      effectivePortion: input.effectivePortionChange,
      reclassifiedToPnl: input.reclassifiedToPnl,
      basisAdjustment: input.basisAdjustment,
      closingBalance,
      netMovement,
    };
  });

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `OCI reserve: ${results.length} hedges tracked`,
  };
}
