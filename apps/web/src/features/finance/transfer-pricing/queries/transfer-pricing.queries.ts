'use server';

import type { TransferPricingPolicy, BenchmarkStudy, TransferPricingSummary } from '../types';

const mockPolicies: TransferPricingPolicy[] = [
  { id: 'tp-1', policyNumber: 'TP-2024-001', name: 'IC Services - Management Fees', description: 'Management and administrative services charges', transactionType: 'services', pricingMethod: 'cost_plus', status: 'active', entities: ['ent-parent', 'ent-1', 'ent-2'], entityNames: ['Parent Corp', 'US Operations', 'European Operations'], armLengthRange: { min: 5, max: 10 }, targetMargin: 7.5, currency: 'USD', effectiveFrom: new Date('2024-01-01'), effectiveTo: null, lastReviewDate: new Date('2025-12-15'), nextReviewDate: new Date('2026-12-15'), documentationId: 'doc-tp-1', createdAt: new Date('2024-01-01'), updatedAt: new Date('2025-12-15') },
  { id: 'tp-2', policyNumber: 'TP-2024-002', name: 'IC Goods - Finished Products', description: 'Inter-company sales of finished products', transactionType: 'goods', pricingMethod: 'tnmm', status: 'active', entities: ['ent-1', 'ent-2'], entityNames: ['US Operations', 'European Operations'], armLengthRange: { min: 2, max: 5 }, targetMargin: 3.5, currency: 'USD', effectiveFrom: new Date('2024-01-01'), effectiveTo: null, lastReviewDate: new Date('2025-12-15'), nextReviewDate: new Date('2026-12-15'), documentationId: 'doc-tp-2', createdAt: new Date('2024-01-01'), updatedAt: new Date('2025-12-15') },
];

const mockBenchmarks: BenchmarkStudy[] = [
  { id: 'bm-1', studyNumber: 'BM-2025-001', policyId: 'tp-1', fiscalYear: 2025, transactionType: 'services', pricingMethod: 'cost_plus', comparableSetSize: 25, lowerQuartile: 5.2, median: 7.8, upperQuartile: 9.5, interquartileRange: { min: 5.2, max: 9.5 }, actualResult: 7.5, isWithinRange: true, studyProvider: 'External Consultant', studyDate: new Date('2025-11-30'), documentationId: 'doc-bm-1' },
];

export async function getTransferPricingPolicies(params?: { status?: string; transactionType?: string }): Promise<{ ok: true; data: TransferPricingPolicy[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  let filtered = [...mockPolicies];
  if (params?.status) filtered = filtered.filter((p) => p.status === params.status);
  if (params?.transactionType) filtered = filtered.filter((p) => p.transactionType === params.transactionType);
  return { ok: true, data: filtered };
}

export async function getBenchmarkStudies(policyId?: string): Promise<{ ok: true; data: BenchmarkStudy[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));
  const filtered = policyId ? mockBenchmarks.filter((b) => b.policyId === policyId) : mockBenchmarks;
  return { ok: true, data: filtered };
}

export async function getTransferPricingSummary(): Promise<{ ok: true; data: TransferPricingSummary } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));
  return { ok: true, data: { totalPolicies: 8, activePolicies: 6, policiesForReview: 2, transactionsYTD: 450, adjustmentsYTD: 125000, complianceRate: 98.5 } };
}
