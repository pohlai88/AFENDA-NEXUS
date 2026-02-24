/**
 * CA-03: Reciprocal allocation calculator.
 * Uses simultaneous equations (iterative method) to handle mutual service
 * department allocations. Pure calculator — no DB, no side effects.
 */

export interface ReciprocalPool {
  readonly costCenterId: string;
  readonly directCost: bigint;
}

export interface ReciprocalDriverRow {
  readonly fromCostCenterId: string;
  readonly toCostCenterId: string;
  readonly percentage: number; // 0-100
}

export interface ReciprocalInput {
  readonly pools: readonly ReciprocalPool[];
  readonly driverRows: readonly ReciprocalDriverRow[];
  readonly currencyCode: string;
  readonly maxIterations?: number;
  readonly convergenceThreshold?: bigint;
}

export interface ReciprocalLine {
  readonly fromCostCenterId: string;
  readonly toCostCenterId: string;
  readonly amount: bigint;
}

export interface ReciprocalResult {
  readonly lines: readonly ReciprocalLine[];
  readonly totalAllocated: bigint;
  readonly iterations: number;
  readonly converged: boolean;
  readonly currencyCode: string;
}

/**
 * Perform reciprocal allocation using iterative method.
 * Converges when the change between iterations falls below threshold.
 */
export function computeReciprocalAllocation(input: ReciprocalInput): ReciprocalResult {
  if (input.pools.length === 0) throw new Error("At least one allocation pool is required");

  const maxIter = input.maxIterations ?? 50;
  const threshold = input.convergenceThreshold ?? 1n; // 1 minor unit

  const ids = input.pools.map((p) => p.costCenterId);
  const directCosts = new Map<string, bigint>();
  for (const pool of input.pools) {
    directCosts.set(pool.costCenterId, pool.directCost);
  }

  // Build percentage matrix (scaled by 10000 for fixed-point: 50% = 5000)
  const pctMatrix = new Map<string, Map<string, bigint>>();
  for (const row of input.driverRows) {
    if (!pctMatrix.has(row.fromCostCenterId)) {
      pctMatrix.set(row.fromCostCenterId, new Map());
    }
    // percentage is 0-100, scale to 0-10000 for basis-point precision
    pctMatrix.get(row.fromCostCenterId)!.set(row.toCostCenterId, BigInt(row.percentage) * 100n);
  }

  // Iterative solve: totalCost[i] = directCost[i] + Σ(pct[j→i] * totalCost[j])
  let totals = new Map<string, bigint>();
  for (const id of ids) {
    totals.set(id, directCosts.get(id) ?? 0n);
  }

  let converged = false;
  let iterations = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    iterations++;
    const newTotals = new Map<string, bigint>();
    let maxDelta = 0n;

    for (const id of ids) {
      let received = 0n;
      for (const otherId of ids) {
        if (otherId === id) continue;
        const pctScaled = pctMatrix.get(otherId)?.get(id) ?? 0n;
        if (pctScaled > 0n) {
          const otherTotal = totals.get(otherId) ?? 0n;
          received += (otherTotal * pctScaled) / 10000n;
        }
      }
      const newTotal = (directCosts.get(id) ?? 0n) + received;
      newTotals.set(id, newTotal);

      const delta = newTotal - (totals.get(id) ?? 0n);
      const absDelta = delta < 0n ? -delta : delta;
      if (absDelta > maxDelta) maxDelta = absDelta;
    }

    totals = newTotals;

    if (maxDelta <= threshold) {
      converged = true;
      break;
    }
  }

  // Generate allocation lines from converged totals
  const lines: ReciprocalLine[] = [];
  let totalAllocated = 0n;

  for (const fromId of ids) {
    const fromTotal = totals.get(fromId) ?? 0n;
    const targets = pctMatrix.get(fromId);
    if (!targets) continue;

    for (const [toId, pctScaled] of targets) {
      if (pctScaled <= 0n) continue;
      const amount = (fromTotal * pctScaled) / 10000n;
      if (amount <= 0n) continue;

      lines.push({
        fromCostCenterId: fromId,
        toCostCenterId: toId,
        amount,
      });
      totalAllocated += amount;
    }
  }

  return {
    lines,
    totalAllocated,
    iterations,
    converged,
    currencyCode: input.currencyCode,
  };
}
