/**
 * CA-07: Profitability analysis calculator.
 * Computes profitability by product, customer, or segment.
 * Pure calculator — no DB, no side effects.
 */

export type ProfitabilityDimension = 'PRODUCT' | 'CUSTOMER' | 'SEGMENT' | 'REGION';

export interface RevenueItem {
  readonly dimensionId: string;
  readonly dimensionType: ProfitabilityDimension;
  readonly revenue: bigint;
}

export interface CostItem {
  readonly dimensionId: string;
  readonly dimensionType: ProfitabilityDimension;
  readonly directCost: bigint;
  readonly allocatedOverhead: bigint;
}

export interface ProfitabilityInput {
  readonly revenueItems: readonly RevenueItem[];
  readonly costItems: readonly CostItem[];
  readonly currencyCode: string;
}

export interface ProfitabilityLine {
  readonly dimensionId: string;
  readonly dimensionType: ProfitabilityDimension;
  readonly revenue: bigint;
  readonly directCost: bigint;
  readonly allocatedOverhead: bigint;
  readonly totalCost: bigint;
  readonly grossMargin: bigint;
  readonly netMargin: bigint;
  readonly grossMarginPct: number;
  readonly netMarginPct: number;
}

export interface ProfitabilityResult {
  readonly lines: readonly ProfitabilityLine[];
  readonly totalRevenue: bigint;
  readonly totalCost: bigint;
  readonly totalGrossMargin: bigint;
  readonly totalNetMargin: bigint;
  readonly overallGrossMarginPct: number;
  readonly overallNetMarginPct: number;
  readonly currencyCode: string;
}

/**
 * Compute profitability analysis across dimensions.
 */
export function computeProfitability(input: ProfitabilityInput): ProfitabilityResult {
  if (input.revenueItems.length === 0 && input.costItems.length === 0) {
    throw new Error('At least one revenue or cost item is required');
  }

  // Group by dimension
  const dimensions = new Map<
    string,
    {
      dimensionType: ProfitabilityDimension;
      revenue: bigint;
      directCost: bigint;
      allocatedOverhead: bigint;
    }
  >();

  for (const rev of input.revenueItems) {
    const existing = dimensions.get(rev.dimensionId) ?? {
      dimensionType: rev.dimensionType,
      revenue: 0n,
      directCost: 0n,
      allocatedOverhead: 0n,
    };
    existing.revenue += rev.revenue;
    dimensions.set(rev.dimensionId, existing);
  }

  for (const cost of input.costItems) {
    const existing = dimensions.get(cost.dimensionId) ?? {
      dimensionType: cost.dimensionType,
      revenue: 0n,
      directCost: 0n,
      allocatedOverhead: 0n,
    };
    existing.directCost += cost.directCost;
    existing.allocatedOverhead += cost.allocatedOverhead;
    dimensions.set(cost.dimensionId, existing);
  }

  const lines: ProfitabilityLine[] = [];
  let totalRevenue = 0n;
  let totalDirectCost = 0n;
  let totalOverhead = 0n;

  for (const [dimensionId, data] of dimensions) {
    const totalCost = data.directCost + data.allocatedOverhead;
    const grossMargin = data.revenue - data.directCost;
    const netMargin = data.revenue - totalCost;

    const grossMarginPct =
      data.revenue > 0n ? Number((grossMargin * 10000n) / data.revenue) / 100 : 0;
    const netMarginPct = data.revenue > 0n ? Number((netMargin * 10000n) / data.revenue) / 100 : 0;

    lines.push({
      dimensionId,
      dimensionType: data.dimensionType,
      revenue: data.revenue,
      directCost: data.directCost,
      allocatedOverhead: data.allocatedOverhead,
      totalCost,
      grossMargin,
      netMargin,
      grossMarginPct,
      netMarginPct,
    });

    totalRevenue += data.revenue;
    totalDirectCost += data.directCost;
    totalOverhead += data.allocatedOverhead;
  }

  const totalCost = totalDirectCost + totalOverhead;
  const totalGrossMargin = totalRevenue - totalDirectCost;
  const totalNetMargin = totalRevenue - totalCost;

  return {
    lines,
    totalRevenue,
    totalCost,
    totalGrossMargin,
    totalNetMargin,
    overallGrossMarginPct:
      totalRevenue > 0n ? Number((totalGrossMargin * 10000n) / totalRevenue) / 100 : 0,
    overallNetMarginPct:
      totalRevenue > 0n ? Number((totalNetMargin * 10000n) / totalRevenue) / 100 : 0,
    currencyCode: input.currencyCode,
  };
}
