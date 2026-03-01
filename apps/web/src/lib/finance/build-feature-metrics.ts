// ─── Finance Feature Metrics Builder ─────────────────────────────────────────
//
// Implements the BuildFeatureMetrics adapter interface for the Finance module.
// Fetches and formats feature-scoped metrics for the Module Map (Feature Grid).
//
// Architecture:
// - Generic: Uses stable featureId keys (no domain-specific hardcoding)
// - Parallel: Fetches all summaries concurrently
// - Resilient: Returns partial results on API failures
// - Memoized: Uses React cache for request deduplication
//
// ─────────────────────────────────────────────────────────────────────────────

import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import type { RequestContext, FeatureMetricMap } from '@/lib/dashboards/module-map.types';

/**
 * Build feature-scoped metrics for the Finance module.
 *
 * Maps featureId → { primary?, secondary? } for display in FeatureCard signals.
 * Wrapped with React cache for automatic request deduplication.
 *
 * @example
 * ```ts
 * const metrics = await buildFinanceFeatureMetrics(ctx);
 * // {
 * //   ap: { primary: "$1.2M outstanding", secondary: "12 invoices overdue" },
 * //   ar: { primary: "$850K receivable" },
 * //   banking: { secondary: "3 statements to reconcile" }
 * // }
 * ```
 */
export const buildFinanceFeatureMetrics = cache(
  async (ctx: RequestContext): Promise<FeatureMetricMap> => {
    const api = createApiClient(ctx);

    // Fetch all summaries in parallel
    const [apResult, arResult, glResult, bankingResult, assetsResult] = await Promise.allSettled([
      api.get<{ totalOutstanding: number; invoiceCount: number; overdueCount: number }>(
        '/ap/summary'
      ),
      api.get<{ totalReceivable: number; invoiceCount: number; overdueCount: number }>(
        '/ar/summary'
      ),
      api.get<{ journalCount: number; unpostedCount: number }>('/gl/summary'),
      api.get<{ unreconciledCount: number; statementsToReconcile: number }>('/banking/summary'),
      api.get<{ totalValue: number; assetCount: number }>('/assets/summary'),
    ]);

    const metrics: FeatureMetricMap = {};

    // AP metrics
    if (apResult.status === 'fulfilled' && apResult.value.ok) {
      const data = apResult.value.value;
      metrics.ap = {
        primary: `${formatCurrency(data.totalOutstanding)  } outstanding`,
        secondary:
          data.overdueCount > 0
            ? `${data.overdueCount} invoices overdue`
            : `${data.invoiceCount} invoices`,
      };
    }

    // AR metrics
    if (arResult.status === 'fulfilled' && arResult.value.ok) {
      const data = arResult.value.value;
      metrics.ar = {
        primary: `${formatCurrency(data.totalReceivable)  } receivable`,
        secondary:
          data.overdueCount > 0
            ? `${data.overdueCount} invoices overdue`
            : `${data.invoiceCount} invoices`,
      };
    }

    // GL metrics
    if (glResult.status === 'fulfilled' && glResult.value.ok) {
      const data = glResult.value.value;
      metrics.gl = {
        primary: `${data.journalCount} journals`,
        secondary: data.unpostedCount > 0 ? `${data.unpostedCount} unposted` : undefined,
      };
    }

    // Banking metrics
    if (bankingResult.status === 'fulfilled' && bankingResult.value.ok) {
      const data = bankingResult.value.value;
      if (data.unreconciledCount > 0 || data.statementsToReconcile > 0) {
        metrics.banking = {
          primary: `${data.unreconciledCount} unreconciled`,
          secondary: `${data.statementsToReconcile} statements to reconcile`,
        };
      }
    }

    // Assets metrics
    if (assetsResult.status === 'fulfilled' && assetsResult.value.ok) {
      const data = assetsResult.value.value;
      metrics.assets = {
        primary: `${formatCurrency(data.totalValue)  } total value`,
        secondary: `${data.assetCount} assets`,
      };
    }

    return metrics;
  }
);
