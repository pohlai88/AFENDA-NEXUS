/**
 * Unified Dashboard API Endpoint Specification
 * 
 * This specification defines the contract for the /api/finance/dashboard endpoint
 * that will serve all dashboard data in a single fetch with caching.
 * 
 * **Implementation Location**: apps/api (separate API service)
 */

import type { ChartParams, TimeGrain, CompareMode } from '@/components/charts';
import type { WaterfallStep } from './waterfall-transformer';

/**
 * Dashboard API Request Parameters
 */
export interface DashboardRequest extends ChartParams {
  tenantId: string;
  companyId?: string;
  widgets?: string[];  // Optional: request specific widgets only
}

/**
 * Dashboard API Response
 */
export interface DashboardResponse {
  meta: {
    generatedAt: string;         // ISO timestamp
    cacheKey: string;             // Cache identifier
    ttl: number;                  // Time-to-live in seconds
    freshness: 'fresh' | 'stale'; // Data freshness indicator
  };
  
  /** Hero KPIs (top-level metrics) */
  kpis: Record<string, number>;
  
  /** Chart data by widget ID */
  charts: {
    'liquidity-waterfall'?: WaterfallStep[];
    'financial-ratios'?: RatioGaugeData[];
    'dso-trend'?: DSODataPoint[];
    'budget-variance'?: BudgetVarianceDataPoint[];
    'asset-portfolio'?: AssetTreemapNode[];
  };
  
  /** Comparison data (when compare mode is enabled) */
  comparison?: {
    period: 'priorPeriod' | 'priorYear' | 'budget';
    kpis: Record<string, number>;
  };
}

/**
 * Ratio Gauge Data Point
 */
export interface RatioGaugeData {
  metricId: string;
  label: string;
  value: number;
  target?: number;
  threshold: {
    danger: number;
    warning: number;
    success: number;
  };
  unit: 'ratio' | 'percent' | 'days';
  definition: string;
}

/**
 * DSO Trend Data Point
 */
export interface DSODataPoint {
  period: string;
  dso: number;
  dsoCompare?: number;
  target?: number;
}

/**
 * Budget Variance Data Point
 */
export interface BudgetVarianceDataPoint {
  category: string;
  actual: number;
  budget: number;
  variance: number;
  variancePercent: number;
  polarity: 'favorable' | 'unfavorable';
}

/**
 * Asset Treemap Node
 */
export interface AssetTreemapNode {
  name: string;
  value: number;
  category?: string;
  location?: string;
  book?: string;
  children?: AssetTreemapNode[];
}

/**
 * Dashboard Endpoint Configuration
 */
export const DASHBOARD_ENDPOINT_SPEC = {
  /**
   * API Endpoint
   */
  path: '/api/finance/dashboard',
  method: 'GET' as const,
  
  /**
   * Caching Strategy
   */
  caching: {
    /**
     * Cache TTL in seconds
     * - 5min (300s) for real-time dashboards
     * - 15min (900s) for standard dashboards
     * - 1hour (3600s) for static dashboards
     */
    ttl: 300,
    
    /**
     * Cache key pattern
     * Format: fin-dash:{tenantId}:{companyId}:{range}:{grain}:{compare}
     */
    keyPattern: 'fin-dash:{tenantId}:{companyId}:{from}_{to}:{grain}:{compare}',
    
    /**
     * Stale-while-revalidate
     * Serve stale data while refreshing in background
     */
    strategy: 'stale-while-revalidate' as const,
    
    /**
     * Cache invalidation triggers
     * - Manual refresh button
     * - Transaction posted
     * - Period close
     */
    invalidateOn: [
      'manual_refresh',
      'transaction_posted',
      'period_closed',
    ] as const,
  },
  
  /**
   * Performance Targets
   */
  performance: {
    /**
     * Target response time (ms)
     * - Cache hit: <100ms
     * - Cache miss: <2000ms
     */
    targetResponseTime: {
      cacheHit: 100,
      cacheMiss: 2000,
    },
    
    /**
     * Concurrent query limit
     * Maximum parallel DB queries
     */
    maxConcurrentQueries: 5,
    
    /**
     * Query timeout (ms)
     */
    queryTimeout: 5000,
  },
  
  /**
   * Rate Limiting
   */
  rateLimit: {
    /**
     * Requests per minute per tenant
     */
    rpm: 60,
    
    /**
     * Burst allowance
     */
    burst: 10,
  },
};

/**
 * Generate cache key for dashboard request
 */
export function generateCacheKey(req: DashboardRequest): string {
  const { tenantId, companyId = 'default', range, grain, compare } = req;
  return `fin-dash:${tenantId}:${companyId}:${range.from}_${range.to}:${grain}:${compare}`;
}

/**
 * Parse cache key back to request parameters
 */
export function parseCacheKey(key: string): Partial<DashboardRequest> | null {
  const pattern = /^fin-dash:([^:]+):([^:]+):([^_]+)_([^:]+):([^:]+):(.+)$/;
  const match = key.match(pattern);
  
  if (!match) return null;
  
  const [, tenantId, companyId, from, to, grain, compare] = match;
  
  return {
    tenantId,
    companyId: companyId === 'default' ? undefined : companyId,
    range: { from: from || '', to: to || '' },
    grain: grain as TimeGrain,
    compare: compare as CompareMode,
  };
}

/**
 * Example API Implementation (Pseudo-code)
 * 
 * ```typescript
 * // apps/api/src/routes/finance/dashboard.ts
 * 
 * export async function GET(request: Request) {
 *   const params = parseQueryParams<DashboardRequest>(request);
 *   const cacheKey = generateCacheKey(params);
 *   
 *   // Check cache
 *   const cached = await redis.get(cacheKey);
 *   if (cached) {
 *     return json({ ...cached, meta: { ...cached.meta, freshness: 'fresh' } });
 *   }
 *   
 *   // Fetch data (parallel queries)
 *   const [kpis, charts] = await Promise.all([
 *     fetchKPIs(params),
 *     fetchCharts(params),
 *   ]);
 *   
 *   const response: DashboardResponse = {
 *     meta: {
 *       generatedAt: new Date().toISOString(),
 *       cacheKey,
 *       ttl: DASHBOARD_ENDPOINT_SPEC.caching.ttl,
 *       freshness: 'fresh',
 *     },
 *     kpis,
 *     charts,
 *   };
 *   
 *   // Cache response
 *   await redis.set(cacheKey, response, { ex: DASHBOARD_ENDPOINT_SPEC.caching.ttl });
 *   
 *   return json(response);
 * }
 * ```
 */

/**
 * Client-side hook for fetching dashboard data
 * 
 * ```typescript
 * // apps/web/src/hooks/use-dashboard-data.ts
 * 
 * export function useDashboardData(params: ChartParams) {
 *   return useQuery({
 *     queryKey: ['finance-dashboard', params],
 *     queryFn: async () => {
 *       const url = new URL(DASHBOARD_ENDPOINT_SPEC.path, window.location.origin);
 *       url.searchParams.set('from', params.range.from);
 *       url.searchParams.set('to', params.range.to);
 *       url.searchParams.set('grain', params.grain);
 *       url.searchParams.set('compare', params.compare);
 *       
 *       const response = await fetch(url);
 *       if (!response.ok) throw new Error('Failed to fetch dashboard data');
 *       
 *       return response.json() as Promise<DashboardResponse>;
 *     },
 *     staleTime: DASHBOARD_ENDPOINT_SPEC.caching.ttl * 1000,
 *     gcTime: DASHBOARD_ENDPOINT_SPEC.caching.ttl * 2 * 1000,
 *   });
 * }
 * ```
 */
