/**
 * SB-03: Churn & MRR calculator.
 * Computes Monthly Recurring Revenue metrics: new MRR, expansion MRR,
 * contraction MRR, churn MRR, net new MRR, and churn rate.
 * Pure calculator — no DB, no side effects.
 */

import type { CalculatorResult } from '../../../shared/types.js';

export type MrrEventType = 'NEW' | 'EXPANSION' | 'CONTRACTION' | 'CHURN' | 'REACTIVATION';

export interface MrrEvent {
  readonly subscriptionId: string;
  readonly eventType: MrrEventType;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly eventDate: string;
}

export interface ChurnMrrInput {
  readonly events: readonly MrrEvent[];
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly openingMrr: bigint;
  readonly currencyCode: string;
}

export interface ChurnMrrResult {
  readonly openingMrr: bigint;
  readonly newMrr: bigint;
  readonly expansionMrr: bigint;
  readonly contractionMrr: bigint;
  readonly churnMrr: bigint;
  readonly reactivationMrr: bigint;
  readonly netNewMrr: bigint;
  readonly closingMrr: bigint;
  readonly grossChurnRateBps: number;
  readonly netChurnRateBps: number;
  readonly eventCount: number;
  readonly currencyCode: string;
}

/**
 * Compute MRR movement and churn metrics for a period.
 */
export function computeChurnMrr(input: ChurnMrrInput): CalculatorResult<ChurnMrrResult> {
  if (input.openingMrr < 0n) throw new Error('Opening MRR cannot be negative');

  let newMrr = 0n;
  let expansionMrr = 0n;
  let contractionMrr = 0n;
  let churnMrr = 0n;
  let reactivationMrr = 0n;

  for (const event of input.events) {
    switch (event.eventType) {
      case 'NEW':
        newMrr += event.amount;
        break;
      case 'EXPANSION':
        expansionMrr += event.amount;
        break;
      case 'CONTRACTION':
        contractionMrr += event.amount;
        break;
      case 'CHURN':
        churnMrr += event.amount;
        break;
      case 'REACTIVATION':
        reactivationMrr += event.amount;
        break;
    }
  }

  const netNewMrr = newMrr + expansionMrr + reactivationMrr - contractionMrr - churnMrr;
  const closingMrr = input.openingMrr + netNewMrr;

  // Churn rates in basis points (100 bps = 1%)
  const grossChurnRateBps =
    input.openingMrr > 0n ? Number((churnMrr * 10000n) / input.openingMrr) : 0;
  const netChurnRateBps =
    input.openingMrr > 0n
      ? Number(
          ((churnMrr + contractionMrr - expansionMrr - reactivationMrr) * 10000n) / input.openingMrr
        )
      : 0;

  return {
    result: {
      openingMrr: input.openingMrr,
      newMrr,
      expansionMrr,
      contractionMrr,
      churnMrr,
      reactivationMrr,
      netNewMrr,
      closingMrr,
      grossChurnRateBps,
      netChurnRateBps,
      eventCount: input.events.length,
      currencyCode: input.currencyCode,
    },
    inputs: { openingMrr: input.openingMrr.toString(), eventCount: input.events.length },
    explanation: `MRR: opening=${input.openingMrr}, net new=${netNewMrr}, closing=${closingMrr}, gross churn=${grossChurnRateBps}bps`,
  };
}
