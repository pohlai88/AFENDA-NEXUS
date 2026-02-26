'use server';

import type { Provision, ProvisionMovement, ProvisionSummary } from '../types';

const mockProvisions: Provision[] = [
  {
    id: 'prov-1',
    provisionNumber: 'PRV-2024-001',
    name: 'Product Warranty Reserve',
    description: 'Warranty provision for electronics product line',
    type: 'warranty',
    status: 'active',
    recognitionDate: new Date('2024-01-01'),
    expectedSettlementDate: new Date('2027-12-31'),
    initialAmount: 500000,
    currentBalance: 380000,
    currency: 'USD',
    discountRate: null,
    presentValue: null,
    isDiscounted: false,
    utilizationYTD: 85000,
    additionsYTD: 120000,
    reversalsYTD: 0,
    unwinding: 0,
    glAccountId: 'gl-2800',
    glAccountCode: '2800',
    costCenterId: 'cc-prod',
    costCenterCode: 'PROD',
    contingentLiability: false,
    contingencyNote: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'prov-2',
    provisionNumber: 'PRV-2025-001',
    name: 'Legal Settlement Reserve',
    description: 'Provision for pending litigation - Class action',
    type: 'legal',
    status: 'active',
    recognitionDate: new Date('2025-06-15'),
    expectedSettlementDate: new Date('2026-12-31'),
    initialAmount: 2500000,
    currentBalance: 2500000,
    currency: 'USD',
    discountRate: 5.0,
    presentValue: 2380952,
    isDiscounted: true,
    utilizationYTD: 0,
    additionsYTD: 0,
    reversalsYTD: 0,
    unwinding: 119048,
    glAccountId: 'gl-2810',
    glAccountCode: '2810',
    costCenterId: 'cc-legal',
    costCenterCode: 'LEGAL',
    contingentLiability: false,
    contingencyNote: null,
    createdAt: new Date('2025-06-15'),
    updatedAt: new Date('2026-02-15'),
  },
];

export async function getProvisions(params?: {
  status?: string;
  type?: string;
}): Promise<{ ok: true; data: Provision[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  let filtered = [...mockProvisions];
  if (params?.status) filtered = filtered.filter((p) => p.status === params.status);
  if (params?.type) filtered = filtered.filter((p) => p.type === params.type);
  return { ok: true, data: filtered };
}

export async function getProvisionById(id: string): Promise<{ ok: true; data: Provision } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const prov = mockProvisions.find((p) => p.id === id);
  if (!prov) return { ok: false, error: 'Provision not found' };
  return { ok: true, data: prov };
}

export async function getProvisionMovements(provisionId: string): Promise<{ ok: true; data: ProvisionMovement[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));
  const movements: ProvisionMovement[] = [
    { id: 'mov-1', provisionId, movementDate: new Date('2024-01-01'), movementType: 'initial', amount: 500000, currency: 'USD', description: 'Initial recognition', reference: null, journalEntryId: 'je-1', journalEntryNumber: 'JE-2024-0001', createdBy: 'controller@company.com', createdAt: new Date('2024-01-01') },
    { id: 'mov-2', provisionId, movementDate: new Date('2026-01-15'), movementType: 'utilization', amount: -45000, currency: 'USD', description: 'Warranty claims Q1', reference: 'WC-2026-001', journalEntryId: 'je-2', journalEntryNumber: 'JE-2026-0089', createdBy: 'controller@company.com', createdAt: new Date('2026-01-15') },
  ];
  return { ok: true, data: movements };
}

export async function getProvisionSummary(): Promise<{ ok: true; data: ProvisionSummary } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));
  return {
    ok: true,
    data: {
      totalProvisions: 8,
      activeProvisions: 6,
      totalBalance: 4850000,
      utilizationYTD: 285000,
      additionsYTD: 350000,
      reversalsYTD: 75000,
      contingentLiabilities: 3,
      provisionsToReview: 2,
    },
  };
}
