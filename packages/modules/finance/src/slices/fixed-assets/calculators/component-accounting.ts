/**
 * FA-04: Component accounting.
 * Splits an asset into separately depreciable components (IAS 16).
 * Pure calculator — no DB, no side effects.
 * Uses raw bigint for amounts (minor units).
 */

import type { DepreciationMethod } from "../entities/asset.js";

export interface ComponentSplit {
  readonly name: string;
  readonly costPortion: bigint;
  readonly residualValue: bigint;
  readonly usefulLifeMonths: number;
  readonly depreciationMethod: DepreciationMethod;
}

export interface ComponentSplitInput {
  readonly assetId: string;
  readonly totalCost: bigint;
  readonly components: readonly ComponentSplit[];
}

export interface ComponentSplitResult {
  readonly assetId: string;
  readonly isValid: boolean;
  readonly totalAllocated: bigint;
  readonly unallocated: bigint;
  readonly components: readonly ComponentSplit[];
  readonly errors: readonly string[];
}

/**
 * Validate and compute component split for an asset.
 * Total component costs must equal the asset's total cost.
 */
export function splitAssetComponents(input: ComponentSplitInput): ComponentSplitResult {
  const errors: string[] = [];
  let totalAllocated = 0n;

  for (const comp of input.components) {
    totalAllocated += comp.costPortion;
    if (comp.costPortion <= 0n) {
      errors.push(`Component "${comp.name}" has non-positive cost`);
    }
    if (comp.residualValue < 0n) {
      errors.push(`Component "${comp.name}" has negative residual value`);
    }
    if (comp.residualValue > comp.costPortion) {
      errors.push(`Component "${comp.name}" residual exceeds cost`);
    }
    if (comp.usefulLifeMonths <= 0) {
      errors.push(`Component "${comp.name}" has non-positive useful life`);
    }
  }

  const unallocated = input.totalCost - totalAllocated;
  if (unallocated !== 0n) {
    errors.push(`Unallocated amount: ${unallocated}. Components must sum to total cost.`);
  }

  return {
    assetId: input.assetId,
    isValid: errors.length === 0,
    totalAllocated,
    unallocated,
    components: input.components,
    errors,
  };
}
