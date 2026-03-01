'use server';

import type { IdParam } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import type { FixedAsset, AssetDisposalType } from '../types';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { routes } from '@/lib/constants';
import {
  previewDepreciationPosting,
  type PostingPreviewResult,
} from '../queries/assets.queries';
import type { ApiResult } from '@/lib/types';

// ─── Asset CRUD Actions ──────────────────────────────────────────────────────

export async function createFixedAsset(
  data: Omit<
    FixedAsset,
    | 'id'
    | 'assetNumber'
    | 'accumulatedDepreciation'
    | 'netBookValue'
    | 'lastDepreciationDate'
    | 'disposalDate'
    | 'disposalType'
    | 'disposalProceeds'
    | 'disposalGainLoss'
    | 'attachmentCount'
    | 'createdAt'
    | 'updatedAt'
  >
): Promise<{ ok: true; data: { id: string; assetNumber: string } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ id: string; assetNumber: string }>('/fixed-assets', data);

  revalidatePath(routes.finance.fixedAssets);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function updateFixedAsset(
  id: string,
  data: Partial<FixedAsset>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.patch(`/fixed-assets/${id}`, data);

  revalidatePath(routes.finance.fixedAssets);
  revalidatePath(routes.finance.fixedAssetDetail(id));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

// ─── Depreciation Actions ────────────────────────────────────────────────────

export async function calculateDepreciation(params: {
  periodStart: Date;
  periodEnd: Date;
  assetIds?: string[];
}): Promise<
  | {
      ok: true;
      data: { runId: IdParam['id']; assetCount: number; totalDepreciation: number };
    }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{
    runId: string;
    assetCount: number;
    totalDepreciation: number;
  }>('/fixed-assets/depreciation-run', {
    periodStart: params.periodStart.toISOString(),
    periodEnd: params.periodEnd.toISOString(),
    assetIds: params.assetIds,
  });

  revalidatePath(routes.finance.depreciation);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function postDepreciationRun(
  runId: string
): Promise<
  { ok: true; data: { journalId: string; journalNumber: string } } | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ journalId: string; journalNumber: string }>(
    `/fixed-assets/depreciation-runs/${runId}/post`,
    {}
  );

  revalidatePath(routes.finance.fixedAssets);
  revalidatePath(routes.finance.depreciation);
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function cancelDepreciationRun(
  runId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post(`/fixed-assets/depreciation-runs/${runId}/cancel`, {});

  revalidatePath(routes.finance.depreciation);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function previewDepreciationRunAction(
  periodStart: string,
  periodEnd: string
): Promise<ApiResult<PostingPreviewResult>> {
  const ctx = await getRequestContext();
  return previewDepreciationPosting(ctx, { periodStart, periodEnd });
}

// ─── Disposal Actions ────────────────────────────────────────────────────────

export async function createDisposalRequest(data: {
  assetId: string;
  disposalType: AssetDisposalType;
  expectedProceeds: number;
  reason: string;
}): Promise<
  { ok: true; data: { requestId: string; requestNumber: string } } | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  // Use the confirmed backend endpoint: POST /fixed-assets/:id/dispose
  const result = await client.post<{ requestId: string; requestNumber: string }>(
    `/fixed-assets/${data.assetId}/dispose`,
    {
      disposalType: data.disposalType,
      expectedProceeds: data.expectedProceeds,
      reason: data.reason,
    }
  );

  revalidatePath(routes.finance.fixedAssets);
  revalidatePath(routes.finance.assetDisposals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function approveDisposalRequest(
  requestId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post(`/fixed-assets/disposal-requests/${requestId}/approve`, {});

  revalidatePath(routes.finance.fixedAssets);
  revalidatePath(routes.finance.assetDisposals);
  revalidatePath(routes.finance.approvals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function rejectDisposalRequest(params: {
  requestId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post(
    `/fixed-assets/disposal-requests/${params.requestId}/reject`,
    { reason: params.reason }
  );

  revalidatePath(routes.finance.assetDisposals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function completeDisposal(params: {
  requestId: string;
  actualProceeds: number;
  disposalDate: Date;
}): Promise<
  | {
      ok: true;
      data: { gainLoss: number; journalId: string };
    }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ gainLoss: number; journalId: string }>(
    `/fixed-assets/disposal-requests/${params.requestId}/complete`,
    {
      actualProceeds: params.actualProceeds,
      disposalDate: params.disposalDate.toISOString(),
    }
  );

  revalidatePath(routes.finance.fixedAssets);
  revalidatePath(routes.finance.assetDisposals);
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkUpdateLocation(params: {
  assetIds: string[];
  location: string;
}): Promise<{ ok: true; data: { updatedCount: number } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ updatedCount: number }>('/fixed-assets/bulk/update-location', {
    assetIds: params.assetIds,
    location: params.location,
  });

  revalidatePath(routes.finance.fixedAssets);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function bulkTransferDepartment(params: {
  assetIds: string[];
  department: string;
  responsiblePerson: string;
}): Promise<{ ok: true; data: { transferredCount: number } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ transferredCount: number }>(
    '/fixed-assets/bulk/transfer-department',
    {
      assetIds: params.assetIds,
      department: params.department,
      responsiblePerson: params.responsiblePerson,
    }
  );

  revalidatePath(routes.finance.fixedAssets);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}
