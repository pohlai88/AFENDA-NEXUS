/**
 * GAP-G4: Multilateral IC Netting calculator.
 * Pure calculator — computes optimal settlement amounts for groups
 * with 3+ entities using netting center logic to minimize
 * cross-border payments and FX exposure.
 *
 * All monetary values are bigint (minor units).
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface IcNettingPosition {
  readonly entityId: string;
  readonly entityName: string;
  /** Total amount this entity owes to other group entities. */
  readonly totalPayable: bigint;
  /** Total amount other group entities owe to this entity. */
  readonly totalReceivable: bigint;
  readonly currencyCode: string;
}

export interface IcNettingPair {
  readonly fromEntityId: string;
  readonly toEntityId: string;
  readonly grossAmount: bigint;
  readonly currencyCode: string;
}

export interface IcNettingInput {
  readonly nettingDate: string;
  readonly currencyCode: string;
  /** All bilateral IC balances in the group. */
  readonly pairs: readonly IcNettingPair[];
}

export interface NettedSettlement {
  readonly entityId: string;
  readonly entityName: string;
  readonly netPosition: bigint;
  /** Positive = entity receives from netting center. Negative = entity pays to netting center. */
  readonly settlementDirection: 'PAY' | 'RECEIVE' | 'ZERO';
  readonly settlementAmount: bigint;
}

export interface IcNettingResult {
  readonly nettingDate: string;
  readonly currencyCode: string;
  readonly settlements: readonly NettedSettlement[];
  readonly totalGrossPayments: bigint;
  readonly totalNetPayments: bigint;
  readonly paymentReduction: bigint;
  /** Percentage reduction in payments (×10000 basis points). */
  readonly reductionPctBps: bigint;
  readonly entityCount: number;
  readonly grossPairCount: number;
  readonly netPaymentCount: number;
}

function safeDiv(num: bigint, den: bigint, scale = 10000n): bigint {
  if (den === 0n) return 0n;
  return (num * scale) / den;
}

/**
 * Computes multilateral netting settlement via netting center model.
 *
 * Algorithm:
 * 1. Aggregate all bilateral positions to compute each entity's net position.
 * 2. Entities with net payable pay the netting center.
 * 3. Entities with net receivable receive from the netting center.
 * 4. This reduces N×(N-1) bilateral payments to at most N payments.
 */
export function computeMultilateralNetting(
  input: IcNettingInput
): CalculatorResult<IcNettingResult> {
  if (input.pairs.length === 0) {
    throw new Error('At least one IC pair required for netting');
  }

  // Build entity map with net positions
  const entityMap = new Map<string, { payable: bigint; receivable: bigint }>();

  for (const pair of input.pairs) {
    // fromEntity pays toEntity
    const from = entityMap.get(pair.fromEntityId) ?? { payable: 0n, receivable: 0n };
    from.payable += pair.grossAmount;
    entityMap.set(pair.fromEntityId, from);

    const to = entityMap.get(pair.toEntityId) ?? { payable: 0n, receivable: 0n };
    to.receivable += pair.grossAmount;
    entityMap.set(pair.toEntityId, to);
  }

  // Compute settlements
  const settlements: NettedSettlement[] = [];
  let totalGross = 0n;
  let totalNet = 0n;

  for (const pair of input.pairs) {
    totalGross += pair.grossAmount;
  }

  for (const [entityId, position] of entityMap) {
    const netPosition = position.receivable - position.payable;
    let settlementDirection: 'PAY' | 'RECEIVE' | 'ZERO';
    let settlementAmount: bigint;

    if (netPosition < 0n) {
      settlementDirection = 'PAY';
      settlementAmount = -netPosition;
      totalNet += settlementAmount;
    } else if (netPosition > 0n) {
      settlementDirection = 'RECEIVE';
      settlementAmount = netPosition;
    } else {
      settlementDirection = 'ZERO';
      settlementAmount = 0n;
    }

    settlements.push({
      entityId,
      entityName: entityId, // Caller can enrich with actual names
      netPosition,
      settlementDirection,
      settlementAmount,
    });
  }

  const paymentReduction = totalGross - totalNet;
  const reductionPctBps = safeDiv(paymentReduction, totalGross);
  const netPaymentCount = settlements.filter((s) => s.settlementDirection !== 'ZERO').length;

  return {
    result: {
      nettingDate: input.nettingDate,
      currencyCode: input.currencyCode,
      settlements,
      totalGrossPayments: totalGross,
      totalNetPayments: totalNet,
      paymentReduction,
      reductionPctBps,
      entityCount: entityMap.size,
      grossPairCount: input.pairs.length,
      netPaymentCount,
    },
    inputs: {
      nettingDate: input.nettingDate,
      pairCount: input.pairs.length,
      entityCount: entityMap.size,
    },
    explanation:
      `Multilateral netting: ${entityMap.size} entities, ${input.pairs.length} gross pairs → ` +
      `${netPaymentCount} net payments, gross=${totalGross}, net=${totalNet}, ` +
      `reduction=${paymentReduction} (${Number(reductionPctBps) / 100}%)`,
  };
}
