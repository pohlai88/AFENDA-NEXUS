/**
 * Dashboard Data Hook
 * 
 * Client-side hook for fetching unified dashboard data from the API.
 * Uses TanStack Query for caching, revalidation, and optimistic updates.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ChartParams } from '@/components/charts';

// ─── Types (matching API response) ──────────────────────────────────────────

interface DashboardRequest {
  tenantId: string;
  companyId?: string;
  range: { from: string; to: string };
  grain: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compare: 'none' | 'priorPeriod' | 'priorYear' | 'budget';
  widgets?: string[];
}

interface WaterfallStep {
  step: string;
  label: string;
  value: number;
  start: number;
  isTotal?: boolean;
  category?: string;
}

interface RatioGaugeData {
  name: string;
  value: number;
  target?: number;
  min?: number;
  max?: number;
  unit?: string;
}

interface DSODataPoint {
  period: string;
  dso: number;
  dsoCompare?: number;
  target?: number;
}

interface BudgetVarianceDataPoint {
  category: string;
  actual: number;
  budget: number;
  variance: number;
  variancePct: number;
}

interface AssetTreemapNode {
  name: string;
  value: number;
  children?: AssetTreemapNode[];
}

interface TaxLiabilityDataPoint {
  period: string;
  outputTax: number;
  inputTax: number;
  netTax: number;
}

interface WorkingCapitalDataPoint {
  period: string;
  currentAssets: number;
  currentLiabilities: number;
  netWorkingCapital: number;
}

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface DashboardResponse {
  meta: {
    generatedAt: string;
    cacheKey: string;
    ttl: number;
    freshness: 'fresh' | 'stale';
  };
  kpis: Record<string, number>;
  charts: {
    'liquidity-waterfall'?: WaterfallStep[];
    'financial-ratios'?: RatioGaugeData[];
    'dso-trend'?: DSODataPoint[];
    'budget-variance'?: BudgetVarianceDataPoint[];
    'asset-portfolio'?: AssetTreemapNode[];
    'tax-liability'?: TaxLiabilityDataPoint[];
    'working-capital'?: WorkingCapitalDataPoint[];
    'cash-flow-sankey'?: SankeyData;
  };
  comparison?: {
    period: 'priorPeriod' | 'priorYear' | 'budget';
    kpis: Record<string, number>;
  };
}

// ─── Hook Options ────────────────────────────────────────────────────────────

interface UseDashboardDataOptions extends Omit<DashboardRequest, 'range' | 'grain' | 'compare'> {
  range: ChartParams['range'];
  grain: ChartParams['grain'];
  compare: ChartParams['compare'];
  enabled?: boolean;
  refetchInterval?: number;
}

// ─── Cache Configuration ─────────────────────────────────────────────────────

const STALE_TIME = 60 * 1000; // 1 minute
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Main Hook ───────────────────────────────────────────────────────────────

export function useDashboardData(
  options: UseDashboardDataOptions
): UseQueryResult<DashboardResponse, Error> {
  const {
    tenantId,
    companyId,
    range,
    grain,
    compare,
    widgets,
    enabled = true,
    refetchInterval,
  } = options;

  return useQuery({
    queryKey: [
      'finance-dashboard',
      {
        tenantId,
        companyId,
        range,
        grain,
        compare,
        widgets,
      },
    ],
    queryFn: async () => {
      const url = new URL('/api/finance/dashboard', window.location.origin);
      
      // Add query parameters
      url.searchParams.set('tenantId', tenantId);
      if (companyId) url.searchParams.set('companyId', companyId);
      url.searchParams.set('from', range.from);
      url.searchParams.set('to', range.to);
      url.searchParams.set('grain', grain);
      url.searchParams.set('compare', compare);
      if (widgets && widgets.length > 0) {
        url.searchParams.set('widgets', widgets.join(','));
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.error || 'Failed to fetch dashboard data');
      }

      return response.json() as Promise<DashboardResponse>;
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TTL * 2, // Keep in cache for twice the TTL
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval,
    retry: 2,
  });
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Extract chart data from dashboard response
 */
export function getChartData<T = unknown>(
  response: DashboardResponse | undefined,
  chartId: keyof DashboardResponse['charts']
): T[] {
  if (!response) return [];
  const data = response.charts[chartId];
  return (Array.isArray(data) ? data : []) as T[];
}

/**
 * Extract KPI value from dashboard response
 */
export function getKPIValue(
  response: DashboardResponse | undefined,
  kpiId: string
): number | undefined {
  if (!response) return undefined;
  return response.kpis[kpiId];
}

/**
 * Check if data is stale (needs refresh)
 */
export function isDataStale(response: DashboardResponse | undefined): boolean {
  if (!response) return true;
  return response.meta.freshness === 'stale';
}

/**
 * Get comparison data for a KPI
 */
export function getKPIComparison(
  response: DashboardResponse | undefined,
  kpiId: string
): { current: number; previous?: number; change?: number; changePct?: number } | undefined {
  if (!response) return undefined;
  
  const current = response.kpis[kpiId];
  if (current === undefined) return undefined;

  const previous = response.comparison?.kpis[kpiId];
  if (previous === undefined) {
    return { current };
  }

  const change = current - previous;
  const changePct = previous !== 0 ? (change / previous) * 100 : 0;

  return { current, previous, change, changePct };
}
