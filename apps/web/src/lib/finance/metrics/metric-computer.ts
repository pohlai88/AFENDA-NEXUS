import type { MetricId } from './metric-id';
import { METRIC_REGISTRY } from './metric-registry';

/**
 * Context for metric computation
 */
export interface MetricContext {
  tenantId: string;
  from: string;          // ISO date
  to: string;            // ISO date
  currency?: string;     // Reporting currency
  companyId?: string;    // Optional company filter
}

/**
 * Compute a metric value
 * 
 * This is a thin wrapper - actual computation happens in the API layer
 * Frontend never computes business logic
 * 
 * @param metricId - Metric to compute
 * @param ctx - Computation context (tenant, date range, etc.)
 * @returns Promise resolving to metric value
 */
export async function computeMetric(
  metricId: MetricId,
  ctx: MetricContext
): Promise<number> {
  // Validate metric exists
  const definition = METRIC_REGISTRY[metricId];
  if (!definition) {
    throw new Error(`Unknown metric: ${metricId}`);
  }

  // Call API endpoint
  const params = new URLSearchParams({
    metricId,
    tenantId: ctx.tenantId,
    from: ctx.from,
    to: ctx.to,
    ...(ctx.currency && { currency: ctx.currency }),
    ...(ctx.companyId && { companyId: ctx.companyId }),
  });

  const response = await fetch(`/api/finance/metrics/compute?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to compute metric ${metricId}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.value;
}

/**
 * Compute multiple metrics in a single API call (batch)
 * More efficient than individual computeMetric calls
 */
export async function computeMetrics(
  metricIds: MetricId[],
  ctx: MetricContext
): Promise<Record<MetricId, number>> {
  const response = await fetch('/api/finance/metrics/compute-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metricIds,
      ...ctx,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to compute metrics: ${response.statusText}`);
  }

  const data = await response.json();
  return data.values;
}

/**
 * Format metric value for display
 */
export function formatMetricValue(
  metricId: MetricId,
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  const definition = METRIC_REGISTRY[metricId];
  if (!definition) return value.toString();

  const { unit, precision } = definition;

  switch (unit) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
        ...options,
      }).format(value);

    case 'percent':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
        ...options,
      }).format(value / 100);

    case 'ratio':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
        ...options,
      }).format(value);

    case 'days':
      return `${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
        ...options,
      }).format(value)  } days`;

    case 'count':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        ...options,
      }).format(value);

    default:
      return value.toString();
  }
}
