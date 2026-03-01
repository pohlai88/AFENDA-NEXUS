import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';
import type {
  IntangibleAsset,
  IntangibleCategory,
  AmortizationScheduleEntry,
  ImpairmentTest,
  IntangibleSummary,
} from '../types';

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

type RequestCtx = { tenantId: string; userId: string; token: string };

export async function getIntangibleCategories(ctx: RequestCtx): Promise<
  { ok: true; data: IntangibleCategory[] } | { ok: false; error: string }
> {
  const client = createApiClient(ctx);
  const result = await client.get<IntangibleCategory[]>('/intangible-assets/categories');
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function getIntangibleAssets(ctx: RequestCtx, params?: {
  categoryId?: string;
  intangibleType?: string;
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<
  | {
      ok: true;
      data: IntangibleAsset[];
      pagination: { page: number; perPage: number; total: number; totalPages: number };
    }
  | { ok: false; error: string }
> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.categoryId) query.categoryId = params.categoryId;
  if (params?.intangibleType) query.intangibleType = params.intangibleType;
  if (params?.status) query.status = params.status;
  if (params?.search) query.search = params.search;
  if (params?.page) query.page = String(params.page);
  if (params?.perPage) query.perPage = String(params.perPage);

  const result = await client.get<{ data: IntangibleAsset[] }>('/intangible-assets', query);
  if (!result.ok) return { ok: false, error: result.error.message };

  const data = result.value.data;
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;
  const total = data.length;
  const totalPages = Math.ceil(total / perPage);

  return {
    ok: true,
    data,
    pagination: { page, perPage, total, totalPages },
  };
}

export async function getIntangibleAssetById(
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: IntangibleAsset } | { ok: false; error: string }> {
  const client = createApiClient(ctx);
  const result = await client.get<IntangibleAsset>(`/intangible-assets/${id}`);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function getAmortizationSchedule(
  ctx: RequestCtx,
  assetId: string
): Promise<{ ok: true; data: AmortizationScheduleEntry[] } | { ok: false; error: string }> {
  const client = createApiClient(ctx);
  const result = await client.get<AmortizationScheduleEntry[]>(
    `/intangible-assets/${assetId}/amortization-schedule`
  );
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function getImpairmentTests(
  ctx: RequestCtx,
  assetId: string
): Promise<{ ok: true; data: ImpairmentTest[] } | { ok: false; error: string }> {
  const client = createApiClient(ctx);
  const result = await client.get<ImpairmentTest[]>(
    `/intangible-assets/${assetId}/impairment-tests`
  );
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

export async function getIntangibleSummary(ctx: RequestCtx): Promise<
  { ok: true; data: IntangibleSummary } | { ok: false; error: string }
> {
  const client = createApiClient(ctx);
  const result = await client.get<IntangibleSummary>('/intangible-assets/summary');
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

// ─── Preview Query ───────────────────────────────────────────────────────────

export async function previewAmortizationPosting(
  ctx: RequestCtx,
  body: { periodStart: string; periodEnd: string }
): Promise<ApiResult<PostingPreviewResult>> {
  const client = createApiClient(ctx);
  return client.post<PostingPreviewResult>('/intangible-assets/amortization/preview', body);
}
