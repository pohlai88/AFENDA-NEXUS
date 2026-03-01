import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// --- Context type ------------------------------------------------------------

type Ctx = { tenantId: string; userId: string; token: string };

// --- View Models -------------------------------------------------------------

export interface InstrumentView {
  id: string;
  instrumentNumber: string;
  name: string;
  description: string;
  type: string;
  category: string;
  status: string;
  issuer: string;
  currency: string;
  faceValue: number;
  carryingAmount: number;
  fairValue: number;
  fairValueLevel: string;
  unrealizedGainLoss: number;
  accruedInterest: number;
  interestRate: number | null;
  maturityDate: string | null;
  acquisitionDate: string;
  acquisitionCost: number;
  lastValuationDate: string;
  ecl: number;
  eclStage: number;
  glAccountId: string;
  glAccountCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface FairValueMeasurementView {
  id: string;
  instrumentId: string;
  measurementDate: string;
  fairValue: number;
  fairValueLevel: string;
  valuationMethod: string;
  unrealizedGainLoss: number;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  createdAt: string;
}

export interface InstrumentSummaryView {
  totalInstruments: number;
  totalCarryingAmount: number;
  totalFairValue: number;
  unrealizedGainLoss: number;
  ecl: number;
  byCategory: Record<string, number>;
}

// --- Queries -----------------------------------------------------------------

export const getInstruments = cache(async (
  ctx: Ctx,
  params?: { category?: string; type?: string; status?: string },
): Promise<ApiResult<{ data: InstrumentView[] }>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.category) query.classification = params.category;
  if (params?.type) query.type = params.type;
  if (params?.status) query.status = params.status;
  return client.get<{ data: InstrumentView[] }>('/fin-instruments', query);
});

export const getInstrumentById = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<InstrumentView>> => {
  const client = createApiClient(ctx);
  return client.get<InstrumentView>(`/fin-instruments/${id}`);
});

export const getInstrumentFairValues = cache(async (
  ctx: Ctx,
  instrumentId: string,
): Promise<ApiResult<{ data: FairValueMeasurementView[] }>> => {
  const client = createApiClient(ctx);
  return client.get<{ data: FairValueMeasurementView[] }>(`/fin-instruments/${instrumentId}/fair-values`);
});

export const getInstrumentSummary = cache(async (
  ctx: Ctx,
): Promise<ApiResult<InstrumentSummaryView>> => {
  const client = createApiClient(ctx);
  return client.get<InstrumentSummaryView>('/fin-instruments/summary');
});

// --- Commands ----------------------------------------------------------------

export async function createInstrument(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/fin-instruments', body);
}

export async function recordFairValue(
  ctx: Ctx,
  instrumentId: string,
  body: { fairValue: number; level: string; valuationMethod: string },
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/fin-instruments/${instrumentId}/fair-values`, body);
}

export async function calculateECL(
  ctx: Ctx,
  instrumentId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/fin-instruments/${instrumentId}/ecl`, {});
}

export async function disposeInstrument(
  ctx: Ctx,
  instrumentId: string,
  body: { salePrice: number; saleDate: string },
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/fin-instruments/${instrumentId}/dispose`, body);
}
