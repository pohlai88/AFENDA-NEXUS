/**
 * CA-01: Direct allocation calculator.
 * Allocates costs from service cost centers directly to production cost centers
 * based on driver quantities. Pure calculator — no DB, no side effects.
 */

export interface DirectAllocationPool {
  readonly sourceCostCenterId: string;
  readonly totalCost: bigint;
}

export interface DirectAllocationTarget {
  readonly costCenterId: string;
  readonly driverQuantity: bigint;
}

export interface DirectAllocationInput {
  readonly pools: readonly DirectAllocationPool[];
  readonly targets: readonly DirectAllocationTarget[];
  readonly driverId: string;
  readonly currencyCode: string;
}

export interface DirectAllocationLine {
  readonly fromCostCenterId: string;
  readonly toCostCenterId: string;
  readonly amount: bigint;
  readonly driverQuantity: bigint;
  readonly allocationRate: bigint;
}

export interface DirectAllocationResult {
  readonly lines: readonly DirectAllocationLine[];
  readonly totalAllocated: bigint;
  readonly unallocated: bigint;
  readonly driverId: string;
  readonly currencyCode: string;
}

/**
 * Allocate costs directly from source pools to targets proportionally by driver quantity.
 */
export function computeDirectAllocation(input: DirectAllocationInput): DirectAllocationResult {
  if (input.pools.length === 0) throw new Error("At least one allocation pool is required");
  if (input.targets.length === 0) throw new Error("At least one allocation target is required");

  const totalDriverQty = input.targets.reduce((sum, t) => sum + t.driverQuantity, 0n);
  if (totalDriverQty <= 0n) throw new Error("Total driver quantity must be positive");

  const lines: DirectAllocationLine[] = [];
  let totalAllocated = 0n;

  for (const pool of input.pools) {
    if (pool.totalCost <= 0n) continue;

    let poolAllocated = 0n;
    const sortedTargets = [...input.targets].sort((a, b) =>
      a.driverQuantity > b.driverQuantity ? -1 : 1,
    );

    for (let i = 0; i < sortedTargets.length; i++) {
      const target = sortedTargets[i]!;
      if (target.driverQuantity <= 0n) continue;

      let amount: bigint;
      if (i === sortedTargets.length - 1) {
        // Last target gets the remainder to avoid rounding loss
        amount = pool.totalCost - poolAllocated;
      } else {
        amount = (pool.totalCost * target.driverQuantity) / totalDriverQty;
      }

      if (amount <= 0n) continue;

      const allocationRate = totalDriverQty > 0n
        ? (pool.totalCost * 10000n) / totalDriverQty
        : 0n;

      lines.push({
        fromCostCenterId: pool.sourceCostCenterId,
        toCostCenterId: target.costCenterId,
        amount,
        driverQuantity: target.driverQuantity,
        allocationRate,
      });

      poolAllocated += amount;
    }

    totalAllocated += poolAllocated;
  }

  const totalPoolCost = input.pools.reduce((sum, p) => sum + p.totalCost, 0n);

  return {
    lines,
    totalAllocated,
    unallocated: totalPoolCost - totalAllocated,
    driverId: input.driverId,
    currencyCode: input.currencyCode,
  };
}
