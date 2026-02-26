'use server';

import type { FinancialInstrument, FairValueMeasurement, InstrumentSummary } from '../types';

const mockInstruments: FinancialInstrument[] = [
  {
    id: 'inst-1', instrumentNumber: 'FI-2024-001', name: 'Treasury Bonds 2028', description: 'US Treasury Bonds', type: 'debt', category: 'amortized_cost', status: 'active', issuer: 'US Treasury', currency: 'USD', faceValue: 1000000, carryingAmount: 985000, fairValue: 1015000, fairValueLevel: 'level_1', unrealizedGainLoss: 30000, accruedInterest: 12500, interestRate: 4.5, maturityDate: new Date('2028-06-30'), acquisitionDate: new Date('2024-01-15'), acquisitionCost: 980000, lastValuationDate: new Date('2026-02-20'), ecl: 0, eclStage: 1, glAccountId: 'gl-1500', glAccountCode: '1500', createdAt: new Date('2024-01-15'), updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'inst-2', instrumentNumber: 'FI-2025-001', name: 'Tech Corp Equity', description: 'Equity investment in Tech Corp', type: 'equity', category: 'fvoci', status: 'active', issuer: 'Tech Corp', currency: 'USD', faceValue: 500000, carryingAmount: 650000, fairValue: 650000, fairValueLevel: 'level_1', unrealizedGainLoss: 150000, accruedInterest: 0, interestRate: null, maturityDate: null, acquisitionDate: new Date('2025-03-10'), acquisitionCost: 500000, lastValuationDate: new Date('2026-02-20'), ecl: 0, eclStage: 1, glAccountId: 'gl-1510', glAccountCode: '1510', createdAt: new Date('2025-03-10'), updatedAt: new Date('2026-02-20'),
  },
];

export async function getInstruments(params?: { category?: string; type?: string; status?: string }): Promise<{ ok: true; data: FinancialInstrument[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  let filtered = [...mockInstruments];
  if (params?.category) filtered = filtered.filter((i) => i.category === params.category);
  if (params?.type) filtered = filtered.filter((i) => i.type === params.type);
  if (params?.status) filtered = filtered.filter((i) => i.status === params.status);
  return { ok: true, data: filtered };
}

export async function getInstrumentById(id: string): Promise<{ ok: true; data: FinancialInstrument; valuations: FairValueMeasurement[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const inst = mockInstruments.find((i) => i.id === id);
  if (!inst) return { ok: false, error: 'Instrument not found' };
  return { ok: true, data: inst, valuations: [] };
}

export async function getInstrumentSummary(): Promise<{ ok: true; data: InstrumentSummary } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));
  return {
    ok: true,
    data: {
      totalInstruments: 15,
      totalCarryingAmount: 8500000,
      totalFairValue: 8750000,
      unrealizedGainLoss: 250000,
      ecl: 45000,
      byCategory: { fvtpl: 1500000, fvoci: 2500000, amortized_cost: 4500000 },
    },
  };
}
