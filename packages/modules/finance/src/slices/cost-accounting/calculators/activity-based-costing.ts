/**
 * CA-04: Activity-based costing (ABC) calculator.
 * Assigns overhead costs to products/services based on activities that drive costs.
 * Pure calculator — no DB, no side effects.
 */

export interface Activity {
  readonly activityId: string;
  readonly name: string;
  readonly totalCost: bigint;
  readonly totalDriverQuantity: bigint;
}

export interface CostObject {
  readonly objectId: string;
  readonly name: string;
  readonly activityConsumption: readonly ActivityConsumption[];
}

export interface ActivityConsumption {
  readonly activityId: string;
  readonly driverQuantity: bigint;
}

export interface AbcInput {
  readonly activities: readonly Activity[];
  readonly costObjects: readonly CostObject[];
  readonly currencyCode: string;
}

export interface AbcLine {
  readonly costObjectId: string;
  readonly activityId: string;
  readonly activityRate: bigint;
  readonly driverQuantity: bigint;
  readonly allocatedCost: bigint;
}

export interface AbcResult {
  readonly lines: readonly AbcLine[];
  readonly costObjectTotals: readonly { objectId: string; totalCost: bigint }[];
  readonly totalAllocated: bigint;
  readonly currencyCode: string;
}

/**
 * Compute activity-based costing allocation.
 */
export function computeActivityBasedCosting(input: AbcInput): AbcResult {
  if (input.activities.length === 0) throw new Error('At least one activity is required');
  if (input.costObjects.length === 0) throw new Error('At least one cost object is required');

  // Compute activity rates (cost per driver unit, in minor units × 10000 for precision)
  const activityRates = new Map<string, bigint>();
  for (const activity of input.activities) {
    if (activity.totalDriverQuantity <= 0n) {
      activityRates.set(activity.activityId, 0n);
    } else {
      activityRates.set(
        activity.activityId,
        (activity.totalCost * 10000n) / activity.totalDriverQuantity
      );
    }
  }

  const lines: AbcLine[] = [];
  const objectTotals = new Map<string, bigint>();
  let totalAllocated = 0n;

  for (const obj of input.costObjects) {
    let objTotal = 0n;

    for (const consumption of obj.activityConsumption) {
      const rate = activityRates.get(consumption.activityId) ?? 0n;
      if (rate <= 0n || consumption.driverQuantity <= 0n) continue;

      const allocatedCost = (rate * consumption.driverQuantity) / 10000n;

      lines.push({
        costObjectId: obj.objectId,
        activityId: consumption.activityId,
        activityRate: rate,
        driverQuantity: consumption.driverQuantity,
        allocatedCost,
      });

      objTotal += allocatedCost;
    }

    objectTotals.set(obj.objectId, objTotal);
    totalAllocated += objTotal;
  }

  return {
    lines,
    costObjectTotals: Array.from(objectTotals.entries()).map(([objectId, totalCost]) => ({
      objectId,
      totalCost,
    })),
    totalAllocated,
    currencyCode: input.currencyCode,
  };
}
