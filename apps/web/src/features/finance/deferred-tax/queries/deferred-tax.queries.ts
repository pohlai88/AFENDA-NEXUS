'use server';

import type { DeferredTaxItem, DeferredTaxSummary } from '../types';

const mockItems: DeferredTaxItem[] = [
  {
    id: 'dt-1',
    itemNumber: 'DT-2024-001',
    description: 'Depreciation - Equipment',
    type: 'dtl',
    originType: 'fixed_assets',
    status: 'active',
    bookBasis: 500000,
    taxBasis: 650000,
    temporaryDifference: -150000,
    taxRate: 25,
    deferredTaxAmount: -37500,
    currency: 'USD',
    jurisdiction: 'US',
    originatingPeriod: '2024-Q1',
    expectedReversalPeriod: '2028',
    sourceId: 'asset-1',
    sourceType: 'FixedAsset',
    glAccountId: 'gl-2850',
    glAccountCode: '2850',
    createdAt: new Date('2024-03-31'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'dt-2',
    itemNumber: 'DT-2024-002',
    description: 'Warranty Provision',
    type: 'dta',
    originType: 'provisions',
    status: 'active',
    bookBasis: 380000,
    taxBasis: 0,
    temporaryDifference: 380000,
    taxRate: 25,
    deferredTaxAmount: 95000,
    currency: 'USD',
    jurisdiction: 'US',
    originatingPeriod: '2024-Q1',
    expectedReversalPeriod: '2027',
    sourceId: 'prov-1',
    sourceType: 'Provision',
    glAccountId: 'gl-1850',
    glAccountCode: '1850',
    createdAt: new Date('2024-03-31'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'dt-3',
    itemNumber: 'DT-2025-001',
    description: 'Lease Liability - HQ',
    type: 'dta',
    originType: 'leases',
    status: 'active',
    bookBasis: 4470000,
    taxBasis: 0,
    temporaryDifference: 4470000,
    taxRate: 25,
    deferredTaxAmount: 1117500,
    currency: 'USD',
    jurisdiction: 'US',
    originatingPeriod: '2024-Q1',
    expectedReversalPeriod: '2029',
    sourceId: 'lease-1',
    sourceType: 'Lease',
    glAccountId: 'gl-1851',
    glAccountCode: '1851',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'dt-4',
    itemNumber: 'DT-2025-002',
    description: 'ROU Asset - HQ',
    type: 'dtl',
    originType: 'leases',
    status: 'active',
    bookBasis: 4156250,
    taxBasis: 0,
    temporaryDifference: -4156250,
    taxRate: 25,
    deferredTaxAmount: -1039063,
    currency: 'USD',
    jurisdiction: 'US',
    originatingPeriod: '2024-Q1',
    expectedReversalPeriod: '2029',
    sourceId: 'lease-1',
    sourceType: 'Lease',
    glAccountId: 'gl-2851',
    glAccountCode: '2851',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2026-02-20'),
  },
];

export async function getDeferredTaxItems(params?: {
  type?: string;
  originType?: string;
  status?: string;
}): Promise<{ ok: true; data: DeferredTaxItem[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  let filtered = [...mockItems];
  if (params?.type) filtered = filtered.filter((i) => i.type === params.type);
  if (params?.originType) filtered = filtered.filter((i) => i.originType === params.originType);
  if (params?.status) filtered = filtered.filter((i) => i.status === params.status);
  return { ok: true, data: filtered };
}

export async function getDeferredTaxSummary(): Promise<
  { ok: true; data: DeferredTaxSummary } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 250));
  return {
    ok: true,
    data: {
      totalDTA: 1350000,
      totalDTL: 1250000,
      netPosition: 100000,
      dtaByOrigin: {
        fixed_assets: 0,
        intangibles: 0,
        provisions: 95000,
        leases: 1117500,
        revenue_recognition: 0,
        share_compensation: 85000,
        losses: 52500,
        credits: 0,
        other: 0,
      },
      dtlByOrigin: {
        fixed_assets: 175000,
        intangibles: 35000,
        provisions: 0,
        leases: 1039063,
        revenue_recognition: 0,
        share_compensation: 0,
        losses: 0,
        credits: 0,
        other: 0,
      },
      valuationAllowance: 25000,
      movementYTD: 45000,
    },
  };
}
