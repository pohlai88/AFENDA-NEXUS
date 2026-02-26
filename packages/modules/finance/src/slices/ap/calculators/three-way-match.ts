import type { Money } from '@afenda/core';

/**
 * AP-01: 3-way match engine.
 * Compares PO → receipt → invoice to detect discrepancies.
 * Pure calculator — no DB, no side effects.
 */

export interface MatchInput {
  readonly poAmount: Money;
  readonly receiptAmount: Money;
  readonly invoiceAmount: Money;
  readonly tolerancePercent: number;
}

export type MatchResult =
  | { readonly status: 'MATCHED' }
  | {
      readonly status: 'QUANTITY_MISMATCH';
      readonly poAmount: Money;
      readonly receiptAmount: Money;
    }
  | {
      readonly status: 'PRICE_MISMATCH';
      readonly receiptAmount: Money;
      readonly invoiceAmount: Money;
    }
  | {
      readonly status: 'WITHIN_TOLERANCE';
      readonly variance: bigint;
      readonly variancePercent: number;
    }
  | {
      readonly status: 'OVER_TOLERANCE';
      readonly variance: bigint;
      readonly variancePercent: number;
    };

export function threeWayMatch(input: MatchInput): MatchResult {
  const { poAmount, receiptAmount, invoiceAmount, tolerancePercent } = input;
  const po = poAmount.amount;
  const receipt = receiptAmount.amount;
  const invoice = invoiceAmount.amount;

  // Step 1: PO vs receipt (quantity check)
  if (po !== receipt) {
    return { status: 'QUANTITY_MISMATCH', poAmount, receiptAmount };
  }

  // Step 2: Receipt vs invoice (price check)
  if (receipt === invoice) {
    return { status: 'MATCHED' };
  }

  // Step 3: Tolerance check
  const variance = invoice - receipt;
  const absVariance = variance < 0n ? -variance : variance;
  const baseAmount = receipt < 0n ? -receipt : receipt;

  if (baseAmount === 0n) {
    return { status: 'PRICE_MISMATCH', receiptAmount, invoiceAmount };
  }

  // variancePercent = (absVariance * 10000) / baseAmount gives basis points
  const varianceBps = Number((absVariance * 10000n) / baseAmount);
  const toleranceBps = tolerancePercent * 100;

  if (varianceBps <= toleranceBps) {
    return { status: 'WITHIN_TOLERANCE', variance, variancePercent: varianceBps / 100 };
  }

  return { status: 'OVER_TOLERANCE', variance, variancePercent: varianceBps / 100 };
}
