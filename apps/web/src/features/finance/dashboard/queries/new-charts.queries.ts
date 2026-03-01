/**
 * Server-side data fetchers for new dashboard charts
 */

import { cache } from 'react';
import { 
  mockTaxLiabilityData, 
  mockWorkingCapitalData, 
  mockCashFlowSankeyData,
  type TaxLiabilityDataPoint,
  type WorkingCapitalDataPoint,
  type SankeyData
} from '@/lib/finance/mock-dashboard-data';

export const getTaxLiabilityData = cache(async (): Promise<TaxLiabilityDataPoint[]> => {
  // TODO: Replace with real API call
  return mockTaxLiabilityData();
});

export const getWorkingCapitalData = cache(async (): Promise<WorkingCapitalDataPoint[]> => {
  // TODO: Replace with real API call
  return mockWorkingCapitalData();
});

export const getCashFlowSankeyData = cache(async (): Promise<SankeyData> => {
  // TODO: Replace with real API call
  return mockCashFlowSankeyData();
});
