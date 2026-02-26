'use server';

import type { GroupEntity, GoodwillAllocation, ConsolidationSummary } from '../types';

const mockEntities: GroupEntity[] = [
  {
    id: 'ent-parent',
    entityCode: 'CORP',
    name: 'Parent Corp Holdings',
    country: 'US',
    currency: 'USD',
    entityType: 'parent',
    consolidationMethod: 'none',
    status: 'active',
    parentId: null,
    ownershipPercent: 100,
    votingRightsPercent: 100,
    acquisitionDate: null,
    divestmentDate: null,
    functionalCurrency: 'USD',
    reportingCurrency: 'USD',
    fxRate: 1,
    children: [
      {
        id: 'ent-1',
        entityCode: 'US-OP',
        name: 'US Operations Inc.',
        country: 'US',
        currency: 'USD',
        entityType: 'subsidiary',
        consolidationMethod: 'full',
        status: 'active',
        parentId: 'ent-parent',
        ownershipPercent: 100,
        votingRightsPercent: 100,
        acquisitionDate: new Date('2020-01-01'),
        divestmentDate: null,
        functionalCurrency: 'USD',
        reportingCurrency: 'USD',
        fxRate: 1,
      },
      {
        id: 'ent-2',
        entityCode: 'EU-OP',
        name: 'European Operations GmbH',
        country: 'DE',
        currency: 'EUR',
        entityType: 'subsidiary',
        consolidationMethod: 'full',
        status: 'active',
        parentId: 'ent-parent',
        ownershipPercent: 85,
        votingRightsPercent: 85,
        acquisitionDate: new Date('2022-06-15'),
        divestmentDate: null,
        functionalCurrency: 'EUR',
        reportingCurrency: 'USD',
        fxRate: 1.08,
      },
      {
        id: 'ent-3',
        entityCode: 'ASIA-JV',
        name: 'Asia Pacific JV',
        country: 'SG',
        currency: 'SGD',
        entityType: 'joint_venture',
        consolidationMethod: 'equity',
        status: 'active',
        parentId: 'ent-parent',
        ownershipPercent: 50,
        votingRightsPercent: 50,
        acquisitionDate: new Date('2023-03-01'),
        divestmentDate: null,
        functionalCurrency: 'SGD',
        reportingCurrency: 'USD',
        fxRate: 0.74,
      },
    ],
  },
];

const mockGoodwill: GoodwillAllocation[] = [
  {
    id: 'gw-1',
    entityId: 'ent-2',
    entityName: 'European Operations GmbH',
    acquisitionDate: new Date('2022-06-15'),
    initialGoodwill: 2500000,
    accumulatedImpairment: 0,
    carryingAmount: 2500000,
    cguId: 'cgu-eu',
    cguName: 'European Operations',
    lastImpairmentTest: new Date('2025-12-31'),
    currency: 'USD',
  },
];

export async function getGroupEntities(): Promise<
  { ok: true; data: GroupEntity[] } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, data: mockEntities };
}

export async function getGoodwillAllocations(): Promise<
  { ok: true; data: GoodwillAllocation[] } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 250));
  return { ok: true, data: mockGoodwill };
}

export async function getConsolidationSummary(): Promise<
  { ok: true; data: ConsolidationSummary } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 250));
  return {
    ok: true,
    data: {
      totalEntities: 8,
      subsidiaries: 5,
      associates: 1,
      jointVentures: 1,
      totalGoodwill: 3850000,
      nciEquity: 1250000,
      eliminationEntries: 45,
    },
  };
}
