/**
 * TP-05: Thin capitalization limits calculator — OECD BEPS Action 4.
 * Pure calculator — tests whether related-party debt exceeds
 * prescribed debt/equity or interest/EBITDA ratios.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface ThinCapInput {
  readonly entityId: string;
  readonly entityName: string;
  readonly totalDebt: bigint;
  readonly relatedPartyDebt: bigint;
  readonly totalEquity: bigint;
  readonly interestExpense: bigint;
  readonly ebitda: bigint;
  readonly debtEquityLimitBps: number;
  readonly interestEbitdaLimitBps: number;
  readonly currencyCode: string;
}

export interface ThinCapResult {
  readonly entityId: string;
  readonly debtEquityRatioBps: number;
  readonly interestEbitdaRatioBps: number;
  readonly exceedsDebtEquityLimit: boolean;
  readonly exceedsInterestLimit: boolean;
  readonly disallowedInterest: bigint;
  readonly excessDebt: bigint;
  readonly reason: string;
}

/**
 * Tests thin cap limits:
 * 1. Debt/equity ratio: related-party debt / equity (in bps)
 * 2. Interest/EBITDA ratio: interest expense / EBITDA (in bps)
 * Disallowed interest = interest on excess debt above limit.
 */
export function testThinCapitalization(
  inputs: readonly ThinCapInput[]
): CalculatorResult<readonly ThinCapResult[]> {
  if (inputs.length === 0) {
    throw new Error('At least one entity required');
  }

  const results: ThinCapResult[] = inputs.map((input) => {
    // Debt/equity ratio
    const debtEquityRatioBps =
      input.totalEquity > 0n
        ? Number((input.relatedPartyDebt * 10000n) / input.totalEquity)
        : input.relatedPartyDebt > 0n
          ? 99999
          : 0;

    // Interest/EBITDA ratio
    const interestEbitdaRatioBps =
      input.ebitda > 0n
        ? Number((input.interestExpense * 10000n) / input.ebitda)
        : input.interestExpense > 0n
          ? 99999
          : 0;

    const exceedsDebtEquityLimit = debtEquityRatioBps > input.debtEquityLimitBps;
    const exceedsInterestLimit = interestEbitdaRatioBps > input.interestEbitdaLimitBps;

    // Excess debt above permitted ratio
    const permittedDebt =
      input.totalEquity > 0n ? (input.totalEquity * BigInt(input.debtEquityLimitBps)) / 10000n : 0n;
    const excessDebt =
      input.relatedPartyDebt > permittedDebt ? input.relatedPartyDebt - permittedDebt : 0n;

    // Disallowed interest: proportional to excess debt
    const disallowedInterest =
      input.relatedPartyDebt > 0n && excessDebt > 0n
        ? (input.interestExpense * excessDebt) / input.relatedPartyDebt
        : 0n;

    const reasons: string[] = [];
    if (exceedsDebtEquityLimit)
      reasons.push(`D/E ratio ${debtEquityRatioBps} bps > limit ${input.debtEquityLimitBps} bps`);
    if (exceedsInterestLimit)
      reasons.push(
        `Interest/EBITDA ${interestEbitdaRatioBps} bps > limit ${input.interestEbitdaLimitBps} bps`
      );
    if (reasons.length === 0) reasons.push('Within all limits');

    return {
      entityId: input.entityId,
      debtEquityRatioBps,
      interestEbitdaRatioBps,
      exceedsDebtEquityLimit,
      exceedsInterestLimit,
      disallowedInterest,
      excessDebt,
      reason: reasons.join('; '),
    };
  });

  const breaches = results.filter((r) => r.exceedsDebtEquityLimit || r.exceedsInterestLimit).length;

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `Thin cap: ${breaches}/${inputs.length} entities exceed limits`,
  };
}
