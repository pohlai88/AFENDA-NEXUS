/**
 * Finance Dashboard API Route
 * 
 * Unified endpoint for all finance dashboard data with caching and performance optimization.
 * 
 * GET /api/finance/dashboard
 * 
 * Query Parameters:
 * - tenantId: string (required)
 * - companyId: string (optional)
 * - from: string (ISO date, required)
 * - to: string (ISO date, required)
 * - grain: 'day' | 'week' | 'month' | 'quarter' | 'year' (required)
 * - compare: 'none' | 'priorPeriod' | 'priorYear' | 'budget' (required)
 * - widgets: string[] (optional, comma-separated)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// ─── Type Definitions ────────────────────────────────────────────────────────

interface DashboardRequest {
  tenantId: string;
  companyId?: string;
  range: { from: string; to: string };
  grain: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compare: 'none' | 'priorPeriod' | 'priorYear' | 'budget';
  widgets?: string[];
}

interface DashboardResponse {
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
  };
  comparison?: {
    period: 'priorPeriod' | 'priorYear' | 'budget';
    kpis: Record<string, number>;
  };
}

interface RatioGaugeData {
  metricId: string;
  label: string;
  value: number;
  target?: number;
  threshold: { danger: number; warning: number; success: number };
  unit: 'ratio' | 'percent' | 'days';
  definition: string;
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
  variancePercent: number;
  polarity: 'favorable' | 'unfavorable';
}

interface AssetTreemapNode {
  name: string;
  value: number;
  category?: string;
  location?: string;
  book?: string;
  children?: AssetTreemapNode[];
}

interface WaterfallStep {
  label: string;
  value: number;
  type: 'positive' | 'negative' | 'total' | 'neutral';
  period: string;
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

interface DashboardQuerystring {
  tenantId: string;
  companyId?: string;
  from: string;
  to: string;
  grain: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compare: 'none' | 'priorPeriod' | 'priorYear' | 'budget';
  widgets?: string;
}

// ─── Request Schema ──────────────────────────────────────────────────────────

const dashboardQuerySchema = {
  type: 'object',
  properties: {
    tenantId: { type: 'string', minLength: 1 },
    companyId: { type: 'string' },
    from: { type: 'string', format: 'date-time' },
    to: { type: 'string', format: 'date-time' },
    grain: { type: 'string', enum: ['day', 'week', 'month', 'quarter', 'year'] },
    compare: { type: 'string', enum: ['none', 'priorPeriod', 'priorYear', 'budget'] },
    widgets: { type: 'string' },
  },
  required: ['tenantId', 'from', 'to', 'grain', 'compare'],
} as const;

// ─── Cache Configuration ─────────────────────────────────────────────────────

const CACHE_TTL = 300; // 5 minutes
const CACHE_KEY_PREFIX = 'fin-dash';

function generateCacheKey(params: DashboardRequest): string {
  const { tenantId, companyId = 'default', range, grain, compare } = params;
  return `${CACHE_KEY_PREFIX}:${tenantId}:${companyId}:${range.from}_${range.to}:${grain}:${compare}`;
}

// ─── Mock Data Fetchers (TODO: Replace with real DB queries) ────────────────

/**
 * Fetch KPI metrics
 * TODO: Replace with actual DB queries using METRIC_REGISTRY
 */
async function fetchKPIs(_params: DashboardRequest): Promise<Record<string, number>> {
  // Simulate DB query delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    'cash-on-hand': 12500000,
    'total-receivables': 8750000,
    'total-payables': 6200000,
    'working-capital': 15800000,
    'current-ratio': 1.85,
    'quick-ratio': 1.42,
    'dso': 38,
  };
}

/**
 * Fetch Liquidity Waterfall data
 */
async function fetchLiquidityWaterfall(params: DashboardRequest): Promise<WaterfallStep[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  return [
    { label: 'Beginning Cash', value: 10000000, type: 'total', period: params.range.from },
    { label: 'Operating Cash Flow', value: 2500000, type: 'positive', period: params.range.from },
    { label: 'Investing Activities', value: -800000, type: 'negative', period: params.range.from },
    { label: 'Financing Activities', value: 800000, type: 'positive', period: params.range.from },
    { label: 'FX Revaluation', value: 0, type: 'neutral', period: params.range.from },
    { label: 'Ending Cash', value: 12500000, type: 'total', period: params.range.to },
  ];
}

/**
 * Fetch Financial Ratios data
 */
async function fetchFinancialRatios(_params: DashboardRequest): Promise<RatioGaugeData[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  return [
    {
      metricId: 'current-ratio',
      label: 'Current Ratio',
      value: 1.85,
      target: 2.0,
      threshold: { danger: 1.0, warning: 1.5, success: 2.0 },
      unit: 'ratio',
      definition: 'Current Assets / Current Liabilities',
    },
    {
      metricId: 'quick-ratio',
      label: 'Quick Ratio',
      value: 1.42,
      target: 1.5,
      threshold: { danger: 0.8, warning: 1.2, success: 1.5 },
      unit: 'ratio',
      definition: '(Current Assets - Inventory) / Current Liabilities',
    },
    {
      metricId: 'debt-to-equity',
      label: 'Debt-to-Equity',
      value: 0.65,
      target: 0.5,
      threshold: { danger: 1.5, warning: 1.0, success: 0.5 },
      unit: 'ratio',
      definition: 'Total Debt / Total Equity',
    },
    {
      metricId: 'dso',
      label: 'DSO',
      value: 38,
      target: 30,
      threshold: { danger: 60, warning: 45, success: 30 },
      unit: 'days',
      definition: '(Accounts Receivable / Revenue) × Days',
    },
  ];
}

/**
 * Fetch DSO Trend data
 */
async function fetchDSOTrend(_params: DashboardRequest): Promise<DSODataPoint[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month) => ({
    period: month,
    dso: 35 + Math.random() * 10,
    dsoCompare: 40 + Math.random() * 8,
    target: 30,
  }));
}

/**
 * Fetch Budget Variance data
 */
async function fetchBudgetVariance(_params: DashboardRequest): Promise<BudgetVarianceDataPoint[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const categories = ['Salaries', 'Marketing', 'Operations', 'R&D', 'Admin'];
  return categories.map((category) => {
    const budget = 100000 + Math.random() * 50000;
    const actual = budget * (0.85 + Math.random() * 0.3);
    const variance = actual - budget;
    const variancePercent = (variance / budget) * 100;

    return {
      category,
      actual,
      budget,
      variance,
      variancePercent,
      polarity: variance < 0 ? ('favorable' as const) : ('unfavorable' as const),
    };
  });
}

/**
 * Fetch Asset Portfolio (Treemap) data
 */
async function fetchAssetPortfolio(_params: DashboardRequest): Promise<AssetTreemapNode[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  return [
    {
      name: 'Real Estate',
      value: 5000000,
      category: 'Property',
      children: [
        { name: 'Office HQ', value: 3000000, category: 'Property', location: 'NYC' },
        { name: 'Warehouse', value: 2000000, category: 'Property', location: 'NJ' },
      ],
    },
    {
      name: 'Equipment',
      value: 3000000,
      category: 'Machinery',
      children: [
        { name: 'Manufacturing', value: 2000000, category: 'Machinery', location: 'Factory A' },
        { name: 'IT Infrastructure', value: 1000000, category: 'Technology', location: 'HQ' },
      ],
    },
    {
      name: 'Vehicles',
      value: 1500000,
      category: 'Fleet',
      children: [
        { name: 'Delivery Trucks', value: 1000000, category: 'Fleet', location: 'Warehouse' },
        { name: 'Company Cars', value: 500000, category: 'Fleet', location: 'HQ' },
      ],
    },
  ];
}

/**
 * Fetch Tax Liability data
 */
async function fetchTaxLiability(_params: DashboardRequest): Promise<TaxLiabilityDataPoint[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month) => ({
    period: month,
    outputTax: 50000 + Math.random() * 20000,
    inputTax: 30000 + Math.random() * 15000,
    netTax: 15000 + Math.random() * 8000,
  }));
}

/**
 * Fetch Working Capital data
 */
async function fetchWorkingCapital(_params: DashboardRequest): Promise<WorkingCapitalDataPoint[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));

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

// ─── Route Handler ───────────────────────────────────────────────────────────

export function registerFinanceDashboardRoutes(app: FastifyInstance) {
  app.get<{ Querystring: DashboardQuerystring }>(
    '/api/finance/dashboard',
    {
      schema: {
        querystring: dashboardQuerySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              meta: { type: 'object' },
              kpis: { type: 'object' },
              charts: { type: 'object' },
            },
          },
        },
        tags: ['finance', 'dashboard'],
        summary: 'Get unified finance dashboard data',
      },
    },
    async (request: FastifyRequest<{ Querystring: DashboardQuerystring }>, reply: FastifyReply) => {
      const query = request.query;
      const params: DashboardRequest = {
        tenantId: query.tenantId,
        companyId: query.companyId,
        range: { from: query.from, to: query.to },
        grain: query.grain,
        compare: query.compare,
        widgets: query.widgets?.split(',').filter(Boolean),
      };

      const cacheKey = generateCacheKey(params);

      try {
        // TODO: Check Redis cache
        // const cached = await redis.get(cacheKey);
        // if (cached) {
        //   return reply.send({ ...JSON.parse(cached), meta: { ...meta, freshness: 'fresh' } });
        // }

        // Fetch all data in parallel for performance
        const [
          kpis,
          liquidityWaterfall,
          financialRatios,
          dsoTrend,
          budgetVariance,
          assetPortfolio,
          taxLiability,
          workingCapital,
        ] = await Promise.all([
          fetchKPIs(params),
          fetchLiquidityWaterfall(params),
          fetchFinancialRatios(params),
          fetchDSOTrend(params),
          fetchBudgetVariance(params),
          fetchAssetPortfolio(params),
          fetchTaxLiability(params),
          fetchWorkingCapital(params),
        ]);

        const response: DashboardResponse = {
          meta: {
            generatedAt: new Date().toISOString(),
            cacheKey,
            ttl: CACHE_TTL,
            freshness: 'fresh',
          },
          kpis,
          charts: {
            'liquidity-waterfall': liquidityWaterfall,
            'financial-ratios': financialRatios,
            'dso-trend': dsoTrend,
            'budget-variance': budgetVariance,
            'asset-portfolio': assetPortfolio,
            'tax-liability': taxLiability,
            'working-capital': workingCapital,
          },
        };

        // TODO: Cache response in Redis
        // await redis.set(cacheKey, JSON.stringify(response), { ex: CACHE_TTL });

        return reply.send(response);
      } catch (error) {
        request.log.error({ error }, '[finance-dashboard] Error fetching dashboard data');
        return reply.status(500).send({
          error: 'Failed to fetch dashboard data',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );
}
