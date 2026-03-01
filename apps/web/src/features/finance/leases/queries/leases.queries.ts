import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type {
  LeaseContract,
  ROUAsset,
  LeaseScheduleEntry,
  LeaseModification,
  LeaseSummary,
} from '../types';

type RequestCtx = { tenantId: string; userId: string; token: string };

// ─── Query Functions ─────────────────────────────────────────────────────────

export const getLeases = cache(async (
  ctx: RequestCtx,
  params?: {
    status?: string;
    assetClass?: string;
    leaseType?: string;
    search?: string;
  }
): Promise<{ ok: true; data: LeaseContract[] } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.assetClass) query.assetClass = params.assetClass;
  if (params?.leaseType) query.leaseType = params.leaseType;
  if (params?.search) query.search = params.search;

  const result = await client.get<LeaseContract[]>('/leases', query);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getLeaseById = cache(async (
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: LeaseContract } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const result = await client.get<LeaseContract>(`/leases/${id}`);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getROUAssets = cache(async (
  ctx: RequestCtx,
  params?: {
    assetClass?: string;
  }
): Promise<{ ok: true; data: ROUAsset[] } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.assetClass) query.assetClass = params.assetClass;

  const result = await client.get<ROUAsset[]>('/leases/rou-assets', query);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getLeaseSchedule = cache(async (
  ctx: RequestCtx,
  leaseId: string
): Promise<{ ok: true; data: LeaseScheduleEntry[] } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const result = await client.get<LeaseScheduleEntry[]>(`/leases/${leaseId}/schedule`);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getLeaseModifications = cache(async (
  ctx: RequestCtx,
  leaseId: string
): Promise<{ ok: true; data: LeaseModification[] } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const result = await client.get<LeaseModification[]>(`/leases/${leaseId}/modifications`);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getLeaseSummary = cache(async (
  ctx: RequestCtx
): Promise<{ ok: true; data: LeaseSummary } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const result = await client.get<LeaseSummary>('/leases/summary');
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});
