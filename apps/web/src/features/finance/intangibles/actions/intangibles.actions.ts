'use server';

import type { IdParam } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import type { IntangibleAsset, ImpairmentTestResult } from '../types';
import { routes } from '@/lib/constants';
import {
  previewAmortizationPosting,
  type PostingPreviewResult,
  getIntangibleCategories,
} from '../queries/intangibles.queries';

// ─── Category Actions ────────────────────────────────────────────────────────

export async function searchCategories(
  _query: string
): Promise<
  | { ok: true; data: Array<{ id: string; label: string; hint?: string }> }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const result = await getIntangibleCategories(ctx);

  if (!result.ok) return { ok: false, error: result.error };

  return {
    ok: true,
    data: result.data.map((cat) => ({
      id: cat.id,
      label: cat.name,
      hint: cat.code,
    })),
  };
}

// ─── Asset CRUD Actions ──────────────────────────────────────────────────────

export async function createIntangibleAsset(
  data: Omit<
    IntangibleAsset,
    | 'id'
    | 'assetNumber'
    | 'accumulatedAmortization'
    | 'carryingAmount'
    | 'impairmentLoss'
    | 'lastAmortizationDate'
    | 'lastImpairmentTestDate'
    | 'nextImpairmentTestDate'
    | 'attachmentCount'
    | 'createdAt'
    | 'updatedAt'
  >
): Promise<{ ok: true; data: { id: string; assetNumber: string } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<{ id: string; assetNumber: string }>('/intangible-assets', data);

  if (!result.ok) return { ok: false, error: result.error.message };

  revalidatePath(routes.finance.intangibles);
  return { ok: true, data: result.value };
}

export async function updateIntangibleAsset(
  id: string,
  data: Partial<IntangibleAsset>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.patch<CommandReceipt>(`/intangible-assets/${id}`, data);

  if (!result.ok) return { ok: false, error: result.error.message };

  revalidatePath(routes.finance.intangibles);
  revalidatePath(routes.finance.intangibleDetail(id));
  return { ok: true };
}

// ─── Amortization Actions ────────────────────────────────────────────────────

export async function calculateAmortization(params: {
  periodStart: Date;
  periodEnd: Date;
  assetIds?: string[];
}): Promise<
  | {
      ok: true;
      data: { runId: IdParam['id']; assetCount: number; totalAmortization: number };
    }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<{
    runId: string;
    assetCount: number;
    totalAmortization: number;
  }>('/intangible-assets/amortization/calculate', params);

  if (!result.ok) return { ok: false, error: result.error.message };

  revalidatePath(routes.finance.intangibles);
  return { ok: true, data: result.value };
}

export async function postAmortizationRun(
  runId: string
): Promise<
  { ok: true; data: { journalId: string; journalNumber: string } } | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<{ journalId: string; journalNumber: string }>(
    `/intangible-assets/amortization/${runId}/post`
  );

  if (!result.ok) return { ok: false, error: result.error.message };

  revalidatePath(routes.finance.intangibles);
  revalidatePath(routes.finance.journals);
  return { ok: true, data: result.value };
}

// ─── Impairment Actions ──────────────────────────────────────────────────────

export async function recordImpairmentTest(params: {
  assetId: string;
  testDate: Date;
  recoverableAmount: number;
  methodology: string;
  assumptions: string;
}): Promise<
  | {
      ok: true;
      data: {
        testId: string;
        result: ImpairmentTestResult;
        impairmentLoss: number;
        journalId: string | null;
      };
    }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<{
    testId: string;
    result: ImpairmentTestResult;
    impairmentLoss: number;
    journalId: string | null;
  }>(`/intangible-assets/${params.assetId}/impairment-tests`, params);

  if (!result.ok) return { ok: false, error: result.error.message };

  revalidatePath(routes.finance.intangibles);
  revalidatePath(routes.finance.intangibleDetail(params.assetId));
  return { ok: true, data: result.value };
}

export async function reverseImpairment(params: {
  assetId: string;
  reversalAmount: number;
  reversalDate: Date;
  reason: string;
}): Promise<{ ok: true; data: { journalId: string } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<{ journalId: string }>(
    `/intangible-assets/${params.assetId}/impairment-reversal`,
    params
  );

  if (!result.ok) return { ok: false, error: result.error.message };

  revalidatePath(routes.finance.intangibles);
  revalidatePath(routes.finance.intangibleDetail(params.assetId));
  revalidatePath(routes.finance.journals);
  return { ok: true, data: result.value };
}

// ─── Disposal Actions ────────────────────────────────────────────────────────

export async function disposeIntangibleAsset(params: {
  assetId: string;
  disposalDate: Date;
  disposalProceeds: number;
  reason: string;
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
    `/intangible-assets/${params.assetId}/dispose`,
    params
  );

  if (!result.ok) return { ok: false, error: result.error.message };

  revalidatePath(routes.finance.intangibles);
  revalidatePath(routes.finance.intangibleDetail(params.assetId));
  revalidatePath(routes.finance.journals);
  return { ok: true, data: result.value };
}

export async function writeOffIntangibleAsset(params: {
  assetId: string;
  writeOffDate: Date;
  reason: string;
}): Promise<{ ok: true; data: { journalId: string } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<{ journalId: string }>(
    `/intangible-assets/${params.assetId}/write-off`,
    params
  );

  if (!result.ok) return { ok: false, error: result.error.message };

  revalidatePath(routes.finance.intangibles);
  revalidatePath(routes.finance.intangibleDetail(params.assetId));
  revalidatePath(routes.finance.journals);
  return { ok: true, data: result.value };
}

// ─── Preview Actions ─────────────────────────────────────────────────────────

export async function previewAmortizationRunAction(
  periodStart: string,
  periodEnd: string
): Promise<ApiResult<PostingPreviewResult>> {
  const ctx = await getRequestContext();
  return previewAmortizationPosting(ctx, { periodStart, periodEnd });
}
