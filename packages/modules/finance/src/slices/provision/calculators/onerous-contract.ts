/**
 * PR-04: Onerous contract / restructuring provision calculator.
 * Determines if a contract is onerous and computes the provision amount.
 * Pure calculator — no DB, no side effects.
 */

export interface OnerousContractInput {
  readonly contractId: string;
  readonly expectedCosts: bigint;
  readonly expectedBenefits: bigint;
  readonly unavoidableCosts: bigint;
  readonly currencyCode: string;
}

export interface OnerousContractResult {
  readonly isOnerous: boolean;
  readonly provisionAmount: bigint;
  readonly netDeficit: bigint;
  readonly currencyCode: string;
}

export function computeOnerousContract(input: OnerousContractInput): OnerousContractResult {
  const netDeficit = input.expectedCosts - input.expectedBenefits;
  const isOnerous = netDeficit > 0n;

  // Provision = lower of (cost to fulfil, penalty to exit) = unavoidable costs
  // If unavoidable costs < net deficit, use unavoidable costs
  const provisionAmount = isOnerous
    ? input.unavoidableCosts < netDeficit
      ? input.unavoidableCosts
      : netDeficit
    : 0n;

  return { isOnerous, provisionAmount, netDeficit, currencyCode: input.currencyCode };
}
