/**
 * CO-06: Equity method calculator (IAS 28 — Associates & Joint Ventures).
 * Pure calculator — computes the investor's share of associate profit/loss,
 * OCI, impairment, and upstream/downstream transaction eliminations.
 *
 * Used when effective ownership is 20–50% (significant influence).
 * All monetary values are bigint (minor units), percentages in basis points.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface EquityMethodInput {
  readonly associateEntityId: string;
  /** Investor's ownership in basis points (e.g., 3000 = 30%). */
  readonly ownershipPctBps: number;
  /** Original cost of investment (at acquisition date). */
  readonly investmentCostAtAcquisition: bigint;
  /** Carrying amount of the investment at the start of the period. */
  readonly openingCarryingAmount: bigint;
  /** Associate's profit or loss for the period. */
  readonly associateProfitOrLoss: bigint;
  /** Associate's other comprehensive income for the period. */
  readonly associateOci: bigint;
  /** Dividends received from the associate during the period. */
  readonly dividendsReceived: bigint;
  /** Impairment loss recognized on the investment (positive = loss). */
  readonly impairmentLoss: bigint;
  /** Unrealized profit on upstream transactions (associate → investor). */
  readonly upstreamUnrealizedProfit: bigint;
  /** Unrealized profit on downstream transactions (investor → associate). */
  readonly downstreamUnrealizedProfit: bigint;
  readonly currencyCode: string;
}

export interface EquityMethodResult {
  readonly associateEntityId: string;
  readonly ownershipPctBps: number;
  /** Investor's share of associate P&L. */
  readonly shareOfProfitOrLoss: bigint;
  /** Investor's share of associate OCI. */
  readonly shareOfOci: bigint;
  /** Dividends reduce carrying amount (not recognized as income under equity method). */
  readonly dividendsReceived: bigint;
  /** Impairment loss recognized. */
  readonly impairmentLoss: bigint;
  /** Upstream elimination (investor's share of unrealized profit). */
  readonly upstreamElimination: bigint;
  /** Downstream elimination (investor's share of unrealized profit). */
  readonly downstreamElimination: bigint;
  /** Total adjustment to carrying amount for the period. */
  readonly periodAdjustment: bigint;
  /** Closing carrying amount of the investment. */
  readonly closingCarryingAmount: bigint;
  /** True if carrying amount has been reduced to zero (further losses not recognized). */
  readonly reducedToZero: boolean;
  readonly currencyCode: string;
}

/**
 * Computes equity method adjustments per IAS 28.
 *
 * Carrying amount movement:
 *   Opening carrying amount
 * + Share of P&L (ownership % × associate P&L)
 * + Share of OCI (ownership % × associate OCI)
 * − Dividends received
 * − Impairment loss
 * − Upstream elimination (ownership % × unrealized profit)
 * − Downstream elimination (ownership % × unrealized profit)
 * = Closing carrying amount
 *
 * Per IAS 28.38, the carrying amount cannot go below zero.
 * Excess losses are not recognized unless the investor has a legal/constructive
 * obligation (not modeled here — would need additional input).
 */
export function computeEquityMethod(
  inputs: readonly EquityMethodInput[]
): CalculatorResult<readonly EquityMethodResult[]> {
  if (inputs.length === 0) {
    throw new Error('At least one associate required for equity method computation');
  }

  const results: EquityMethodResult[] = [];

  for (const input of inputs) {
    if (input.ownershipPctBps < 0 || input.ownershipPctBps > 10000) {
      throw new Error(
        `Invalid ownership BPS ${input.ownershipPctBps} for ${input.associateEntityId}`
      );
    }

    const pctBig = BigInt(input.ownershipPctBps);

    const shareOfProfitOrLoss = (input.associateProfitOrLoss * pctBig) / 10000n;
    const shareOfOci = (input.associateOci * pctBig) / 10000n;
    const upstreamElimination = (input.upstreamUnrealizedProfit * pctBig) / 10000n;
    const downstreamElimination = (input.downstreamUnrealizedProfit * pctBig) / 10000n;

    const periodAdjustment =
      shareOfProfitOrLoss +
      shareOfOci -
      input.dividendsReceived -
      input.impairmentLoss -
      upstreamElimination -
      downstreamElimination;

    let closingCarryingAmount = input.openingCarryingAmount + periodAdjustment;
    let reducedToZero = false;

    // IAS 28.38: carrying amount cannot go below zero
    if (closingCarryingAmount < 0n) {
      closingCarryingAmount = 0n;
      reducedToZero = true;
    }

    results.push({
      associateEntityId: input.associateEntityId,
      ownershipPctBps: input.ownershipPctBps,
      shareOfProfitOrLoss,
      shareOfOci,
      dividendsReceived: input.dividendsReceived,
      impairmentLoss: input.impairmentLoss,
      upstreamElimination,
      downstreamElimination,
      periodAdjustment,
      closingCarryingAmount,
      reducedToZero,
      currencyCode: input.currencyCode,
    });
  }

  return {
    result: results,
    inputs: { associateCount: inputs.length },
    explanation: `Equity method: ${results.length} associates, ${results.filter((r) => r.reducedToZero).length} reduced to zero`,
  };
}
