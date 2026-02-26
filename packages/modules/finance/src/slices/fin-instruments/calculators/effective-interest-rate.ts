/**
 * FI-02: Effective Interest Rate (EIR) method — IFRS 9.
 * Pure calculator — computes interest income/expense using EIR
 * and amortizes premiums/discounts over the life of the instrument.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface EirInput {
  readonly instrumentId: string;
  readonly carryingAmount: bigint;
  readonly effectiveInterestRateBps: number;
  readonly periodMonths: number;
  readonly cashReceived: bigint;
  readonly currencyCode: string;
}

export interface EirResult {
  readonly instrumentId: string;
  readonly interestIncome: bigint;
  readonly premiumDiscountAmortization: bigint;
  readonly newCarryingAmount: bigint;
}

/**
 * EIR method: Interest = carrying amount × EIR × period/12
 * Premium/discount amortization = Interest income - cash received
 */
export function computeEir(inputs: readonly EirInput[]): CalculatorResult<readonly EirResult[]> {
  if (inputs.length === 0) {
    throw new Error('At least one instrument required');
  }

  const results: EirResult[] = inputs.map((input) => {
    const annualInterest = (input.carryingAmount * BigInt(input.effectiveInterestRateBps)) / 10000n;
    const interestIncome = (annualInterest * BigInt(input.periodMonths)) / 12n;
    const premiumDiscountAmortization = interestIncome - input.cashReceived;
    const newCarryingAmount = input.carryingAmount + premiumDiscountAmortization;

    return {
      instrumentId: input.instrumentId,
      interestIncome,
      premiumDiscountAmortization,
      newCarryingAmount,
    };
  });

  const totalInterest = results.reduce((s, r) => s + r.interestIncome, 0n);

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `EIR: ${results.length} instruments, total interest=${totalInterest}`,
  };
}
