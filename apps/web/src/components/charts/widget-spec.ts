/**
 * Chart Widget Primitives
 * Enterprise-grade chart widget contracts and types
 */

export type TimeGrain = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type CompareMode = 'none' | 'priorPeriod' | 'priorYear' | 'budget';

/**
 * Chart parameters - standardized across all chart widgets
 */
export interface ChartParams {
  range: { from: string; to: string };   // ISO dates
  grain: TimeGrain;
  compare: CompareMode;
  companyId?: string;                    // Multi-company filter
  currency?: string;                     // Reporting currency
}

/**
 * Drilldown target - where to navigate on click
 */
export type DrilldownTarget =
  | { kind: 'report'; reportId: 'cashflow' | 'ar-aging' | 'ap-aging' | 'trial-balance' | 'balance-sheet' | 'income-statement' }
  | { kind: 'list'; entity: 'invoice' | 'payment' | 'journal' | 'asset' | 'supplier' | 'customer'; preset?: string }
  | { kind: 'dashboard'; dashboardId: string };

/**
 * Widget metadata
 */
export interface WidgetMeta {
  id: string;
  title: string;
  description: string;
  minW: number;                           // Grid units (minimum width)
  minH: number;                           // Grid units (minimum height)
  defaultW: number;                       // Default width
  defaultH: number;                       // Default height
  drilldown?: DrilldownTarget;            // Where to navigate on click
}

/**
 * Widget specification - contract for all chart widgets
 */
export interface WidgetSpec<TData = unknown> {
  meta: WidgetMeta;
  component: React.ComponentType<{
    data: TData;
    params: ChartParams;
    compact?: boolean;
    gridW?: number;
    gridH?: number;
    onDrilldown?: (target: DrilldownTarget) => void;
  }>;
}
