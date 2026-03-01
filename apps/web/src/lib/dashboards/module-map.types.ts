// ─── Module Map Types ────────────────────────────────────────────────────────
//
// Type definitions for the Module Map (formerly Feature Grid) — the domain
// dashboard panel showing available features, planned features, health metrics,
// and attention items.
//
// Key contracts:
// - `FeatureMetricMap`: Maps featureId → { primary, secondary } metrics
// - `BuildFeatureMetrics`: Adapter interface for domain-specific metric fetching
// - `BuildAttentionItems`: Adapter interface for domain-specific attention items
//
// rbp-allow:no-cache — Type definitions file with example code snippets only
//
// ─────────────────────────────────────────────────────────────────────────────

import type { AttentionItem } from '@/lib/attention/attention.types';

/** Request context passed to builder functions. */
export interface RequestContext {
  userId: string;
  tenantId: string;
  token: string;
}

/**
 * Feature metrics map: featureId → { primary?, secondary? }
 *
 * Example:
 * ```ts
 * {
 *   ap: { primary: "$1.2M outstanding", secondary: "12 invoices overdue" },
 *   ar: { primary: "$850K receivable" },
 *   banking: { secondary: "3 statements to reconcile" }
 * }
 * ```
 */
export type FeatureMetricMap = Record<
  string, // featureId
  {
    primary?: string;
    secondary?: string;
  }
>;

/**
 * Adapter interface for building feature-scoped metrics.
 *
 * Each domain dashboard can provide its own implementation to fetch
 * and format metrics relevant to its features.
 *
 * Example:
 * ```ts
 * export async function buildFinanceFeatureMetrics(
 *   ctx: RequestContext
 * ): Promise<FeatureMetricMap> {
 *   const api = createApiClient(ctx);
 *   const [apSummary, arSummary] = await Promise.all([
 *     api.get('/ap/summary'),
 *     api.get('/ar/summary')
 *   ]);
 *   return {
 *     ap: {
 *       primary: apSummary.ok ? formatCurrency(apSummary.value.totalOutstanding) : undefined,
 *       secondary: apSummary.ok ? `${apSummary.value.invoiceCount} invoices` : undefined
 *     },
 *     ar: { primary: arSummary.ok ? formatCurrency(arSummary.value.totalReceivable) : undefined }
 *   };
 * }
 * ```
 */
export type BuildFeatureMetrics = (ctx: RequestContext) => Promise<FeatureMetricMap>;

/**
 * Adapter interface for building feature-scoped attention items.
 *
 * Each domain dashboard can provide its own implementation to compute
 * attention items with proper `featureId` mapping.
 *
 * Example:
 * ```ts
 * export async function buildFinanceAttentionItems(
 *   ctx: RequestContext
 * ): Promise<AttentionItem[]> {
 *   const api = createApiClient(ctx);
 *   const overduePayables = await api.get('/ap/overdue');
 *   return [
 *     {
 *       id: 'overdue-payables',
 *       featureId: 'ap',
 *       severity: 'warning',
 *       title: 'Overdue Payables',
 *       count: overduePayables.value.length,
 *       href: routes.finance.payables + '?filter=overdue',
 *       reason: `${overduePayables.value.length} AP invoices are past due date`,
 *       evidence: { overdueIds: overduePayables.value.map(p => p.id) },
 *       lastComputedAt: new Date()
 *     }
 *   ];
 * }
 * ```
 */
export type BuildAttentionItems = (ctx: RequestContext) => Promise<AttentionItem[]>;
