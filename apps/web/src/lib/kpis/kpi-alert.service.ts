/**
 * KPI Alert Service — threshold-based notifications.
 *
 * Checks catalog alertConfig against resolved values and triggers
 * notifications when thresholds are breached.
 * Stub implementation: logs to console. Wire to email/push when ready.
 */

import type { KPICatalogEntry } from './kpi-catalog';
import type { KPIResolverResult } from './kpi-registry.server';

export interface KpiAlertCheckResult {
  triggered: boolean;
  kpiId: string;
  threshold: number;
  operator: string;
  value: number;
  formattedValue: string;
}

function evaluateThreshold(
  value: number,
  threshold: number,
  operator: 'gt' | 'gte' | 'lt' | 'lte',
): boolean {
  switch (operator) {
    case 'gt':
      return value > threshold;
    case 'gte':
      return value >= threshold;
    case 'lt':
      return value < threshold;
    case 'lte':
      return value <= threshold;
    default:
      return false;
  }
}

/**
 * Check if a KPI's resolved value breaches its alertConfig threshold.
 */
export function checkKpiAlert(
  catalog: KPICatalogEntry,
  data: KPIResolverResult,
): KpiAlertCheckResult | null {
  const config = catalog.alertConfig;
  if (!config) return null;

  const raw = parseFloat(data.value);
  if (Number.isNaN(raw)) return null;

  const triggered = evaluateThreshold(raw, config.threshold, config.operator);
  if (!triggered) return null;

  return {
    triggered: true,
    kpiId: catalog.id,
    threshold: config.threshold,
    operator: config.operator,
    value: raw,
    formattedValue: data.formattedValue,
  };
}

/**
 * Process alert check and dispatch notifications.
 * Stub: logs to console. Replace with email/push integration.
 */
export async function processKpiAlerts(
  entries: Array<{ catalog: KPICatalogEntry; data: KPIResolverResult }>,
): Promise<KpiAlertCheckResult[]> {
  const results: KpiAlertCheckResult[] = [];

  for (const { catalog, data } of entries) {
    const result = checkKpiAlert(catalog, data);
    if (result) {
      results.push(result);
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[KPI Alert] ${catalog.id} breached threshold: ${result.formattedValue} ${result.operator} ${result.threshold}`,
        );
      }
    }
  }

  return results;
}
