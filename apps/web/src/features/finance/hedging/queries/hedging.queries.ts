'use server';

import type { HedgeRelationship, EffectivenessTest, HedgingSummary } from '../types';

const mockRelationships: HedgeRelationship[] = [
  {
    id: 'hedge-1',
    relationshipNumber: 'HR-2025-001',
    name: 'USD/EUR Cash Flow Hedge',
    description: 'Hedge of forecasted EUR sales revenue',
    hedgeType: 'cash_flow',
    status: 'active',
    hedgedItemId: 'item-1',
    hedgedItemDescription: 'Forecasted EUR Sales Q2 2026',
    hedgingInstrumentId: 'inst-fwd-1',
    hedgingInstrumentDescription: 'EUR Forward Contract 06/2026',
    hedgeRatio: 1.0,
    designationDate: new Date('2025-09-01'),
    terminationDate: null,
    currency: 'USD',
    hedgedRisk: 'FX Risk - USD/EUR',
    lastEffectivenessTest: new Date('2026-01-31'),
    effectivenessResult: 'effective',
    ineffectivenessAmount: 2500,
    cashFlowReserve: 45000,
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'hedge-2',
    relationshipNumber: 'HR-2025-002',
    name: 'Interest Rate Swap',
    description: 'Fair value hedge of fixed rate debt',
    hedgeType: 'fair_value',
    status: 'active',
    hedgedItemId: 'item-2',
    hedgedItemDescription: 'Fixed Rate Term Loan',
    hedgingInstrumentId: 'inst-swap-1',
    hedgingInstrumentDescription: 'IRS Pay Float Receive Fixed',
    hedgeRatio: 1.0,
    designationDate: new Date('2025-06-01'),
    terminationDate: null,
    currency: 'USD',
    hedgedRisk: 'Interest Rate Risk',
    lastEffectivenessTest: new Date('2026-01-31'),
    effectivenessResult: 'effective',
    ineffectivenessAmount: 1200,
    cashFlowReserve: 0,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2026-02-15'),
  },
];

export async function getHedgeRelationships(params?: {
  status?: string;
  hedgeType?: string;
}): Promise<{ ok: true; data: HedgeRelationship[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  let filtered = [...mockRelationships];
  if (params?.status) filtered = filtered.filter((h) => h.status === params.status);
  if (params?.hedgeType) filtered = filtered.filter((h) => h.hedgeType === params.hedgeType);
  return { ok: true, data: filtered };
}

export async function getHedgeRelationshipById(
  id: string
): Promise<
  { ok: true; data: HedgeRelationship; tests: EffectivenessTest[] } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 200));
  const rel = mockRelationships.find((h) => h.id === id);
  if (!rel) return { ok: false, error: 'Hedge relationship not found' };
  return { ok: true, data: rel, tests: [] };
}

export async function getHedgingSummary(): Promise<
  { ok: true; data: HedgingSummary } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 250));
  return {
    ok: true,
    data: {
      totalRelationships: 8,
      activeRelationships: 6,
      cashFlowReserveBalance: 185000,
      totalIneffectiveness: 8500,
      upcomingTests: 3,
      ineffectiveRelationships: 0,
    },
  };
}
