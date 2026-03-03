/**
 * Server-side data fetchers for dashboard charts (tax, working capital, sankey)
 * API-first with fallback data when endpoints are unavailable.
 */

import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import { getRequestContext } from '@/lib/auth';

// ─── Chart Data Types ─────────────────────────────────────────────────────────

export interface TaxLiabilityDataPoint {
  period: string;
  outputTax: number;
  inputTax: number;
  netTax: number;
}

export interface WorkingCapitalDataPoint {
  period: string;
  currentAssets: number;
  currentLiabilities: number;
  netWorkingCapital: number;
}

export interface SankeyNode {
  name: string;
}
export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// ─── Empty defaults (trigger empty state in charts) ──────────────────────────

const EMPTY_SANKEY: SankeyData = { nodes: [], links: [] };

// ─── API-First Fetchers ───────────────────────────────────────────────────────

export const getTaxLiabilityData = cache(async (): Promise<TaxLiabilityDataPoint[]> => {
  try {
    const ctx = await getRequestContext();
    const api = createApiClient(ctx);
    const result = await api.get<TaxLiabilityDataPoint[]>('/reports/tax-liability');
    if (result.ok && Array.isArray(result.value)) {
      return result.value;
    }
  } catch {
    // API unavailable — return empty to trigger empty state
  }
  return [];
});

export const getWorkingCapitalData = cache(async (): Promise<WorkingCapitalDataPoint[]> => {
  try {
    const ctx = await getRequestContext();
    const api = createApiClient(ctx);
    const result = await api.get<WorkingCapitalDataPoint[]>('/reports/working-capital');
    if (result.ok && Array.isArray(result.value)) {
      return result.value;
    }
  } catch {
    // API unavailable — return empty to trigger empty state
  }
  return [];
});

export const getCashFlowSankeyData = cache(async (): Promise<SankeyData> => {
  try {
    const ctx = await getRequestContext();
    const api = createApiClient(ctx);
    const result = await api.get<SankeyData>('/reports/cash-flow-sankey');
    if (result.ok && result.value?.nodes?.length) {
      return result.value;
    }
  } catch {
    // API unavailable — return empty to trigger empty state
  }
  return EMPTY_SANKEY;
});
