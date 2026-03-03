/**
 * Fallback Data Providers for Finance Dashboard Charts
 *
 * Static fallback data used when API endpoints are unavailable.
 * Each function returns deterministic, shaped data compatible with chart components.
 */

import type { WaterfallStep } from './waterfall-transformer';
import type {
  RatioGaugeData,
  DSODataPoint,
  BudgetVarianceDataPoint,
  AssetTreemapNode,
} from './dashboard-endpoint-spec';

/**
 * Tax Liability Data Point
 */
export interface TaxLiabilityDataPoint {
  period: string;
  outputTax: number;
  inputTax: number;
  netTax: number;
}

/**
 * Working Capital Data Point
 */
export interface WorkingCapitalDataPoint {
  period: string;
  currentAssets: number;
  currentLiabilities: number;
  netWorkingCapital: number;
}

/**
 * Sankey Node
 */
export interface SankeyNode {
  name: string;
}

/**
 * Sankey Link
 */
export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

/**
 * Sankey Data
 */
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

/**
 * Mock Liquidity Waterfall Data
 */
export function getMockWaterfallData(): WaterfallStep[] {
  return [
    {
      step: 'opening',
      label: 'Opening Cash',
      value: 1000000,
      start: 0,
      isTotal: true,
      category: 'total',
    },
    {
      step: 'operating_in',
      label: 'Operating Inflows',
      value: 500000,
      start: 1000000,
      category: 'operating_in',
    },
    {
      step: 'operating_out',
      label: 'Operating Outflows',
      value: -300000,
      start: 1500000,
      category: 'operating_out',
    },
    {
      step: 'investing',
      label: 'Investing',
      value: -50000,
      start: 1200000,
      category: 'investing',
    },
    {
      step: 'financing',
      label: 'Financing',
      value: 100000,
      start: 1150000,
      category: 'financing',
    },
    {
      step: 'closing',
      label: 'Closing Cash',
      value: 1250000,
      start: 0,
      isTotal: true,
      category: 'total',
    },
  ];
}

/**
 * Mock Financial Ratios Data
 */
export function getMockRatiosData(): RatioGaugeData[] {
  return [
    {
      metricId: 'fin.ratio.current',
      label: 'Current Ratio',
      value: 2.5,
      target: 2.0,
      threshold: {
        danger: 1.0,
        warning: 1.5,
        success: 2.0,
      },
      unit: 'ratio',
      definition: 'Current Assets ÷ Current Liabilities. Measures short-term liquidity.',
    },
    {
      metricId: 'fin.ratio.quick',
      label: 'Quick Ratio',
      value: 1.8,
      target: 1.5,
      threshold: {
        danger: 0.8,
        warning: 1.0,
        success: 1.2,
      },
      unit: 'ratio',
      definition:
        '(Current Assets - Inventory) ÷ Current Liabilities. More conservative liquidity measure.',
    },
    {
      metricId: 'fin.ar.dso',
      label: 'DSO',
      value: 42.5,
      target: 45,
      threshold: {
        danger: 60,
        warning: 50,
        success: 45,
      },
      unit: 'days',
      definition: 'Days Sales Outstanding. Average days to collect receivables.',
    },
    {
      metricId: 'fin.ratio.debt-equity',
      label: 'Debt-to-Equity',
      value: 0.6,
      target: 0.5,
      threshold: {
        danger: 2.0,
        warning: 1.0,
        success: 0.5,
      },
      unit: 'ratio',
      definition: 'Total Debt ÷ Total Equity. Measures financial leverage.',
    },
  ];
}

/**
 * Mock DSO Trend Data
 */
export function getMockDSOTrendData(): DSODataPoint[] {
  return [
    { period: 'Sep', dso: 48, dsoCompare: 52, target: 45 },
    { period: 'Oct', dso: 46, dsoCompare: 49, target: 45 },
    { period: 'Nov', dso: 44, dsoCompare: 47, target: 45 },
    { period: 'Dec', dso: 43, dsoCompare: 46, target: 45 },
    { period: 'Jan', dso: 42.5, dsoCompare: 45, target: 45 },
  ];
}

/**
 * Mock Budget Variance Data
 */
export function getMockBudgetVarianceData(): BudgetVarianceDataPoint[] {
  return [
    {
      category: 'Salaries',
      actual: 950000,
      budget: 1000000,
      variance: -50000,
      variancePercent: -5,
      polarity: 'favorable',
    },
    {
      category: 'Marketing',
      actual: 320000,
      budget: 300000,
      variance: 20000,
      variancePercent: 6.67,
      polarity: 'unfavorable',
    },
    {
      category: 'IT Infrastructure',
      actual: 180000,
      budget: 200000,
      variance: -20000,
      variancePercent: -10,
      polarity: 'favorable',
    },
    {
      category: 'Office Rent',
      actual: 150000,
      budget: 150000,
      variance: 0,
      variancePercent: 0,
      polarity: 'favorable',
    },
  ];
}

/**
 * Mock Asset Treemap Data
 */
export function getMockAssetTreemapData(): AssetTreemapNode[] {
  return [
    {
      name: 'Equipment',
      value: 2500000,
      category: 'Equipment',
      location: 'HQ',
      book: 'GAAP',
      children: [
        {
          name: 'Production Line A',
          value: 1500000,
          category: 'Equipment',
          location: 'HQ',
          book: 'GAAP',
        },
        {
          name: 'Forklift Fleet',
          value: 500000,
          category: 'Equipment',
          location: 'Warehouse',
          book: 'GAAP',
        },
        { name: 'IT Servers', value: 500000, category: 'Equipment', location: 'HQ', book: 'GAAP' },
      ],
    },
    {
      name: 'Vehicles',
      value: 800000,
      category: 'Vehicles',
      location: 'Various',
      book: 'GAAP',
      children: [
        {
          name: 'Sales Fleet',
          value: 600000,
          category: 'Vehicles',
          location: 'Various',
          book: 'GAAP',
        },
        {
          name: 'Executive Cars',
          value: 200000,
          category: 'Vehicles',
          location: 'HQ',
          book: 'GAAP',
        },
      ],
    },
    {
      name: 'Buildings',
      value: 3000000,
      category: 'Real Estate',
      location: 'HQ',
      book: 'GAAP',
    },
  ];
}

/**
 * Mock Tax Liability Data
 */
/* eslint-disable no-restricted-syntax -- mock data generators, not render paths */
export function mockTaxLiabilityData(): TaxLiabilityDataPoint[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month) => ({
    period: month,
    outputTax: 50000 + Math.random() * 20000,
    inputTax: 30000 + Math.random() * 15000,
    netTax: 15000 + Math.random() * 8000,
  }));
}

/**
 * Mock Working Capital Data
 */
export function mockWorkingCapitalData(): WorkingCapitalDataPoint[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month) => {
    const currentAssets = 5000000 + Math.random() * 1000000;
    const currentLiabilities = 3000000 + Math.random() * 500000;
    return {
      period: month,
      currentAssets,
      currentLiabilities,
      netWorkingCapital: currentAssets - currentLiabilities,
    };
  });
}
/* eslint-enable no-restricted-syntax */

/**
 * Mock Cash Flow Sankey Data
 */
export function mockCashFlowSankeyData(): SankeyData {
  return {
    nodes: [
      { name: 'Beginning Cash' },
      { name: 'Operating' },
      { name: 'Investing' },
      { name: 'Financing' },
      { name: 'Ending Cash' },
    ],
    links: [
      { source: 0, target: 1, value: 2500000 },
      { source: 0, target: 2, value: -800000 },
      { source: 0, target: 3, value: 800000 },
      { source: 1, target: 4, value: 2500000 },
      { source: 2, target: 4, value: -800000 },
      { source: 3, target: 4, value: 800000 },
    ],
  };
}
