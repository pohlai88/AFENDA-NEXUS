import { createApiClient } from '@/lib/api-client';
import type { ApiResult } from '@/lib/types';
import type {
  FixedAsset,
  AssetCategory,
  DepreciationScheduleEntry,
  DepreciationRun,
  AssetSummary,
  DisposalRequest,
} from '../types';

type RequestCtx = { tenantId: string; userId: string; token: string };

// ─── Posting Preview Types ───────────────────────────────────────────────────

export interface PostingPreviewLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  description: string;
}

export interface PostingPreviewResult {
  ledgerName: string;
  periodName: string;
  currency: string;
  lines: PostingPreviewLine[];
  warnings: string[];
}

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getAssetCategories(
  ctx: RequestCtx
): Promise<{ ok: true; data: AssetCategory[] } | { ok: false; error: string }> {
  const client = createApiClient(ctx);
  const result = await client.get<AssetCategory[]>('/fixed-assets/categories');
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function getFixedAssets(
  ctx: RequestCtx,
  params?: {
    categoryId?: string;
    status?: string;
    search?: string;
    page?: number;
    perPage?: number;
  }
): Promise<
  | {
      ok: true;
      data: FixedAsset[];
      pagination: { page: number; perPage: number; total: number; totalPages: number };
    }
  | { ok: false; error: string }
> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.categoryId) query.categoryId = params.categoryId;
  if (params?.status) query.status = params.status;
  if (params?.search) query.search = params.search;
  if (params?.page) query.page = String(params.page);
  if (params?.perPage) query.perPage = String(params.perPage);

  const result = await client.get<{
    items: FixedAsset[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }>('/fixed-assets', query);

  if (!result.ok) return { ok: false, error: result.error.message };

  const { items, total, page, perPage, totalPages } = result.value;
  return {
    ok: true,
    data: items,
    pagination: { page, perPage, total, totalPages },
  };
}

export async function getFixedAssetById(
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: FixedAsset } | { ok: false; error: string }> {
  const client = createApiClient(ctx);
  const result = await client.get<FixedAsset>(`/fixed-assets/${id}`);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function getDepreciationSchedule(
  ctx: RequestCtx,
  assetId: string
): Promise<{ ok: true; data: DepreciationScheduleEntry[] } | { ok: false; error: string }> {
  const client = createApiClient(ctx);
  const result = await client.get<DepreciationScheduleEntry[]>(
    `/fixed-assets/${assetId}/depreciation-schedule`
  );
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function getDepreciationRuns(
  ctx: RequestCtx,
  params?: {
    status?: string;
    year?: number;
  }
): Promise<{ ok: true; data: DepreciationRun[] } | { ok: false; error: string }> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.year) query.year = String(params.year);

  const result = await client.get<DepreciationRun[]>('/fixed-assets/depreciation-runs', query);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function getAssetSummary(
  ctx: RequestCtx
): Promise<{ ok: true; data: AssetSummary } | { ok: false; error: string }> {
  const client = createApiClient(ctx);
  const result = await client.get<AssetSummary>('/fixed-assets/summary');
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function getDisposalRequests(
  ctx: RequestCtx,
  params?: {
    status?: string;
  }
): Promise<{ ok: true; data: DisposalRequest[] } | { ok: false; error: string }> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;

  const result = await client.get<DisposalRequest[]>('/fixed-assets/disposal-requests', query);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

// ─── Preview Query ───────────────────────────────────────────────────────────

export async function previewDepreciationPosting(
  ctx: RequestCtx,
  body: { periodStart: string; periodEnd: string }
): Promise<ApiResult<PostingPreviewResult>> {
  const client = createApiClient(ctx);
  return client.post<PostingPreviewResult>('/fixed-assets/depreciation-run/preview', body);
}
