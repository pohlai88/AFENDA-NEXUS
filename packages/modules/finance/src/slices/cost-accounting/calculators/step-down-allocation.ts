/**
 * CA-02: Step-down allocation calculator.
 * Allocates service department costs sequentially — once a department is allocated,
 * it does not receive further allocations. Order matters.
 * Pure calculator — no DB, no side effects.
 */

export interface StepDownPool {
  readonly costCenterId: string;
  readonly totalCost: bigint;
  readonly sequenceOrder: number;
}

export interface StepDownDriverRow {
  readonly fromCostCenterId: string;
  readonly toCostCenterId: string;
  readonly driverQuantity: bigint;
}

export interface StepDownInput {
  readonly pools: readonly StepDownPool[];
  readonly driverRows: readonly StepDownDriverRow[];
  readonly currencyCode: string;
}

export interface StepDownLine {
  readonly fromCostCenterId: string;
  readonly toCostCenterId: string;
  readonly amount: bigint;
  readonly step: number;
}

export interface StepDownResult {
  readonly lines: readonly StepDownLine[];
  readonly totalAllocated: bigint;
  readonly steps: number;
  readonly currencyCode: string;
}

/**
 * Perform step-down allocation in sequence order.
 */
export function computeStepDownAllocation(input: StepDownInput): StepDownResult {
  if (input.pools.length === 0) throw new Error("At least one allocation pool is required");

  const sorted = [...input.pools].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const allocated = new Set<string>();
  const balances = new Map<string, bigint>();

  for (const pool of sorted) {
    balances.set(pool.costCenterId, pool.totalCost);
  }

  const lines: StepDownLine[] = [];
  let totalAllocated = 0n;
  let step = 0;

  for (const pool of sorted) {
    step++;
    const balance = balances.get(pool.costCenterId) ?? 0n;
    if (balance <= 0n) {
      allocated.add(pool.costCenterId);
      continue;
    }

    // Find driver rows from this pool to non-allocated targets
    const eligibleRows = input.driverRows.filter(
      (r) => r.fromCostCenterId === pool.costCenterId && !allocated.has(r.toCostCenterId),
    );

    const totalDriverQty = eligibleRows.reduce((sum, r) => sum + r.driverQuantity, 0n);
    if (totalDriverQty <= 0n) {
      allocated.add(pool.costCenterId);
      continue;
    }

    let stepAllocated = 0n;
    for (let i = 0; i < eligibleRows.length; i++) {
      const row = eligibleRows[i]!;
      if (row.driverQuantity <= 0n) continue;

      let amount: bigint;
      if (i === eligibleRows.length - 1) {
        amount = balance - stepAllocated;
      } else {
        amount = (balance * row.driverQuantity) / totalDriverQty;
      }

      if (amount <= 0n) continue;

      lines.push({
        fromCostCenterId: pool.costCenterId,
        toCostCenterId: row.toCostCenterId,
        amount,
        step,
      });

      // Accumulate into target balance
      const targetBal = balances.get(row.toCostCenterId) ?? 0n;
      balances.set(row.toCostCenterId, targetBal + amount);

      stepAllocated += amount;
    }

    totalAllocated += stepAllocated;
    balances.set(pool.costCenterId, 0n);
    allocated.add(pool.costCenterId);
  }

  return {
    lines,
    totalAllocated,
    steps: step,
    currencyCode: input.currencyCode,
  };
}
