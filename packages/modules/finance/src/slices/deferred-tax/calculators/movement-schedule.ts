/**
 * DT-04: Deferred tax movement schedule — IAS 12.
 * Pure calculator — produces a reconciliation of deferred tax balance
 * movements between periods for disclosure.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type MovementType =
  | 'OPENING_BALANCE'
  | 'RECOGNIZED_IN_PNL'
  | 'RECOGNIZED_IN_OCI'
  | 'RATE_CHANGE'
  | 'ACQUISITION'
  | 'DISPOSAL'
  | 'FX_TRANSLATION'
  | 'CLOSING_BALANCE';

export interface MovementInput {
  readonly category: string;
  readonly openingBalance: bigint;
  readonly recognizedInPnl: bigint;
  readonly recognizedInOci: bigint;
  readonly rateChangeImpact: bigint;
  readonly acquisitions: bigint;
  readonly disposals: bigint;
  readonly fxTranslation: bigint;
  readonly currencyCode: string;
}

export interface MovementRow {
  readonly category: string;
  readonly openingBalance: bigint;
  readonly recognizedInPnl: bigint;
  readonly recognizedInOci: bigint;
  readonly rateChangeImpact: bigint;
  readonly acquisitions: bigint;
  readonly disposals: bigint;
  readonly fxTranslation: bigint;
  readonly closingBalance: bigint;
  readonly totalMovement: bigint;
}

export interface MovementScheduleResult {
  readonly rows: readonly MovementRow[];
  readonly totalOpening: bigint;
  readonly totalClosing: bigint;
  readonly totalPnlCharge: bigint;
}

/**
 * Closing = Opening + P&L + OCI + rate change + acquisitions - disposals + FX
 */
export function computeMovementSchedule(
  inputs: readonly MovementInput[]
): CalculatorResult<MovementScheduleResult> {
  if (inputs.length === 0) {
    throw new Error('At least one category required');
  }

  let totalOpening = 0n;
  let totalClosing = 0n;
  let totalPnlCharge = 0n;

  const rows: MovementRow[] = inputs.map((input) => {
    const totalMovement =
      input.recognizedInPnl +
      input.recognizedInOci +
      input.rateChangeImpact +
      input.acquisitions -
      input.disposals +
      input.fxTranslation;

    const closingBalance = input.openingBalance + totalMovement;

    totalOpening += input.openingBalance;
    totalClosing += closingBalance;
    totalPnlCharge += input.recognizedInPnl;

    return {
      category: input.category,
      openingBalance: input.openingBalance,
      recognizedInPnl: input.recognizedInPnl,
      recognizedInOci: input.recognizedInOci,
      rateChangeImpact: input.rateChangeImpact,
      acquisitions: input.acquisitions,
      disposals: input.disposals,
      fxTranslation: input.fxTranslation,
      closingBalance,
      totalMovement,
    };
  });

  return {
    result: { rows, totalOpening, totalClosing, totalPnlCharge },
    inputs: { count: inputs.length },
    explanation: `Movement schedule: ${rows.length} categories, opening=${totalOpening}, closing=${totalClosing}, P&L charge=${totalPnlCharge}`,
  };
}
