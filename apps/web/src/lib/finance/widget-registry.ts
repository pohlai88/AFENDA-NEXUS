/**
 * Finance Dashboard Widget Registry
 * 
 * Defines all available charts and diagrams for the bento grid with their metadata
 */

import type { WidgetSpec } from '@/components/charts';
import { LiquidityWaterfallChart } from '@/features/finance/dashboard/blocks/liquidity-waterfall-chart';
import { FinancialRatiosChart } from '@/features/finance/dashboard/blocks/financial-ratios-chart';
import { DSOTrendChart } from '@/features/finance/dashboard/blocks/dso-trend-chart';
import { BudgetVarianceChart } from '@/features/finance/dashboard/blocks/budget-variance-chart';
import { AssetTreemapChart } from '@/features/finance/dashboard/blocks/asset-treemap-chart';
import { TaxLiabilityChart } from '@/features/finance/dashboard/blocks/tax-liability-chart';
import { WorkingCapitalChart } from '@/features/finance/dashboard/blocks/working-capital-chart';
import { CashFlowSankeyChart } from '@/features/finance/dashboard/blocks/cash-flow-sankey-chart';

/**
 * Widget Registry - All available dashboard widgets
 */
export const FINANCE_WIDGET_REGISTRY: Record<string, WidgetSpec> = {
  'liquidity-waterfall': {
    meta: {
      id: 'liquidity-waterfall',
      title: 'Liquidity Waterfall',
      description: 'Cash flow movements from opening to closing balance with actual/forecast toggle',
      minW: 2,
      minH: 2,
      defaultW: 3,
      defaultH: 2,
      drilldown: { kind: 'report', reportId: 'cashflow' },
    },
    component: LiquidityWaterfallChart,
  },

  'financial-ratios': {
    meta: {
      id: 'financial-ratios',
      title: 'Financial Ratios',
      description: 'Key ratios with target thresholds and zone coloring',
      minW: 4,
      minH: 2,
      defaultW: 4,
      defaultH: 2,
    },
    component: FinancialRatiosChart,
  },

  'dso-trend': {
    meta: {
      id: 'dso-trend',
      title: 'DSO Trend',
      description: 'Days Sales Outstanding with period comparison',
      minW: 2,
      minH: 1,
      defaultW: 2,
      defaultH: 1,
      drilldown: { kind: 'report', reportId: 'ar-aging' },
    },
    component: DSOTrendChart,
  },

  'budget-variance': {
    meta: {
      id: 'budget-variance',
      title: 'Budget Variance',
      description: 'Actual vs budget with polarity-aware favorable/unfavorable indicators',
      minW: 2,
      minH: 2,
      defaultW: 2,
      defaultH: 2,
      drilldown: { kind: 'report', reportId: 'trial-balance' },
    },
    component: BudgetVarianceChart,
  },

  'asset-portfolio': {
    meta: {
      id: 'asset-portfolio',
      title: 'Asset Portfolio',
      description: 'Treemap visualization grouped by category, location, or book',
      minW: 2,
      minH: 2,
      defaultW: 2,
      defaultH: 2,
      drilldown: { kind: 'list', entity: 'asset' },
    },
    component: AssetTreemapChart,
  },

  'tax-liability': {
    meta: {
      id: 'tax-liability',
      title: 'Tax Liability',
      description: 'Output tax, input tax, and net position over time',
      minW: 2,
      minH: 2,
      defaultW: 2,
      defaultH: 2,
      drilldown: { kind: 'report', reportId: 'trial-balance' },
    },
    component: TaxLiabilityChart,
  },

  'working-capital': {
    meta: {
      id: 'working-capital',
      title: 'Working Capital',
      description: 'Current assets vs liabilities with net WC trend',
      minW: 2,
      minH: 2,
      defaultW: 2,
      defaultH: 2,
      drilldown: { kind: 'report', reportId: 'balance-sheet' },
    },
    component: WorkingCapitalChart,
  },

  'cash-flow-sankey': {
    meta: {
      id: 'cash-flow-sankey',
      title: 'Cash Flow Sankey',
      description: 'Cash flow visualization across operating, investing, and financing activities',
      minW: 4,
      minH: 2,
      defaultW: 4,
      defaultH: 2,
      drilldown: { kind: 'report', reportId: 'cashflow' },
    },
    component: CashFlowSankeyChart,
  },
};

/**
 * Default dashboard layout for finance
 */
export const DEFAULT_FINANCE_LAYOUT = [
  { i: 'liquidity-waterfall', x: 0, y: 0, w: 3, h: 2 },
  { i: 'financial-ratios', x: 3, y: 0, w: 4, h: 2 },
  { i: 'dso-trend', x: 0, y: 2, w: 2, h: 1 },
  { i: 'budget-variance', x: 2, y: 2, w: 2, h: 2 },
  { i: 'asset-portfolio', x: 4, y: 2, w: 2, h: 2 },
  { i: 'tax-liability', x: 0, y: 4, w: 2, h: 2 },
  { i: 'working-capital', x: 2, y: 4, w: 2, h: 2 },
  { i: 'cash-flow-sankey', x: 0, y: 6, w: 4, h: 2 },
];

/**
 * Get widget specification by ID
 */
export function getWidgetSpec(widgetId: string): WidgetSpec | undefined {
  return FINANCE_WIDGET_REGISTRY[widgetId];
}

/**
 * Get all available widgets
 */
export function getAllWidgets(): WidgetSpec[] {
  return Object.values(FINANCE_WIDGET_REGISTRY);
}

/**
 * Validate layout against widget constraints
 */
export function validateLayout(layout: Array<{ i: string; w: number; h: number }>): boolean {
  return layout.every((item) => {
    const spec = FINANCE_WIDGET_REGISTRY[item.i];
    if (!spec) return false;
    return item.w >= spec.meta.minW && item.h >= spec.meta.minH;
  });
}
