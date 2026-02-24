/**
 * SB-02: Usage metering calculator.
 * Computes charges based on metered usage with tiered pricing,
 * overage charges, and included allowances.
 * Pure calculator — no DB, no side effects.
 */

import type { CalculatorResult } from "../../../shared/types.js";

export interface UsageTier {
  readonly fromUnits: bigint;
  readonly toUnits: bigint | null;
  readonly pricePerUnit: bigint;
}

export interface UsageMeterInput {
  readonly subscriptionId: string;
  readonly metricName: string;
  readonly usageQuantity: bigint;
  readonly includedAllowance: bigint;
  readonly tiers: readonly UsageTier[];
  readonly currencyCode: string;
}

export interface UsageTierBreakdown {
  readonly tierIndex: number;
  readonly fromUnits: bigint;
  readonly toUnits: bigint;
  readonly unitsInTier: bigint;
  readonly pricePerUnit: bigint;
  readonly tierCharge: bigint;
}

export interface UsageMeterResult {
  readonly subscriptionId: string;
  readonly metricName: string;
  readonly totalUsage: bigint;
  readonly billableUsage: bigint;
  readonly includedAllowance: bigint;
  readonly tierBreakdown: readonly UsageTierBreakdown[];
  readonly totalCharge: bigint;
  readonly currencyCode: string;
}

/**
 * Compute usage-based charges with tiered pricing.
 */
export function computeUsageCharge(
  input: UsageMeterInput,
): CalculatorResult<UsageMeterResult> {
  if (input.tiers.length === 0) throw new Error("At least one pricing tier is required");
  if (input.usageQuantity < 0n) throw new Error("Usage quantity cannot be negative");

  const billableUsage = input.usageQuantity > input.includedAllowance
    ? input.usageQuantity - input.includedAllowance
    : 0n;

  const tierBreakdown: UsageTierBreakdown[] = [];
  let totalCharge = 0n;
  let remainingUnits = billableUsage;

  for (let i = 0; i < input.tiers.length && remainingUnits > 0n; i++) {
    const tier = input.tiers[i]!;
    const tierCapacity = tier.toUnits !== null
      ? tier.toUnits - tier.fromUnits
      : remainingUnits;

    const unitsInTier = remainingUnits < tierCapacity ? remainingUnits : tierCapacity;
    const tierCharge = unitsInTier * tier.pricePerUnit;

    tierBreakdown.push({
      tierIndex: i,
      fromUnits: tier.fromUnits,
      toUnits: tier.toUnits ?? tier.fromUnits + unitsInTier,
      unitsInTier,
      pricePerUnit: tier.pricePerUnit,
      tierCharge,
    });

    totalCharge += tierCharge;
    remainingUnits -= unitsInTier;
  }

  return {
    result: {
      subscriptionId: input.subscriptionId,
      metricName: input.metricName,
      totalUsage: input.usageQuantity,
      billableUsage,
      includedAllowance: input.includedAllowance,
      tierBreakdown,
      totalCharge,
      currencyCode: input.currencyCode,
    },
    inputs: { usageQuantity: input.usageQuantity.toString(), tierCount: input.tiers.length },
    explanation: `Usage metering: ${input.metricName}, billable=${billableUsage}, charge=${totalCharge}`,
  };
}
