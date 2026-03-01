import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type {
  TaxCode,
  TaxRateHistory,
  TaxReturnPeriod,
  WHTCertificate,
  TaxSummary,
} from '../types';

type RequestCtx = { tenantId: string; userId: string; token: string };

// ─── Query Functions ─────────────────────────────────────────────────────────

export const getTaxCodes = cache(async (
  ctx: RequestCtx,
  params?: { taxType?: string; status?: string; search?: string }
): Promise<{ ok: true; data: TaxCode[] } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const qp = new URLSearchParams();
  if (params?.taxType) qp.set('taxType', params.taxType);
  if (params?.status) qp.set('status', params.status);
  if (params?.search) qp.set('search', params.search);
  const qs = qp.toString();
  const res = await api.get(`/tax/codes${qs ? `?${qs}` : ''}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxCode[] };
});

export const getTaxCodeById = cache(async (
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: TaxCode } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get(`/tax/codes/${id}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxCode };
});

export const getTaxRateHistory = cache(async (
  ctx: RequestCtx,
  taxCodeId: string
): Promise<{ ok: true; data: TaxRateHistory[] } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get(`/tax/rates?taxCodeId=${taxCodeId}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxRateHistory[] };
});

export const getTaxReturnPeriods = cache(async (
  ctx: RequestCtx,
  params?: { taxType?: string; status?: string; year?: number }
): Promise<{ ok: true; data: TaxReturnPeriod[] } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const qp = new URLSearchParams();
  if (params?.taxType) qp.set('taxType', params.taxType);
  if (params?.status) qp.set('status', params.status);
  if (params?.year) qp.set('year', String(params.year));
  const qs = qp.toString();
  const res = await api.get(`/tax/returns${qs ? `?${qs}` : ''}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxReturnPeriod[] };
});

export const getTaxReturnPeriodById = cache(async (
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: TaxReturnPeriod } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get(`/tax/returns/${id}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxReturnPeriod };
});

export const getWHTCertificates = cache(async (
  ctx: RequestCtx,
  params?: { type?: string; status?: string; search?: string; periodFrom?: Date; periodTo?: Date }
): Promise<{ ok: true; data: WHTCertificate[] } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const qp = new URLSearchParams();
  if (params?.type) qp.set('type', params.type);
  if (params?.status) qp.set('status', params.status);
  if (params?.search) qp.set('search', params.search);
  if (params?.periodFrom) qp.set('periodFrom', params.periodFrom.toISOString());
  if (params?.periodTo) qp.set('periodTo', params.periodTo.toISOString());
  const qs = qp.toString();
  const res = await api.get(`/tax/wht-certificates${qs ? `?${qs}` : ''}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as WHTCertificate[] };
});

export const getWHTCertificateById = cache(async (
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: WHTCertificate } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get(`/tax/wht-certificates/${id}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as WHTCertificate };
});

export const getTaxSummary = cache(async (
  ctx: RequestCtx
): Promise<{ ok: true; data: TaxSummary } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get('/tax/summary');
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxSummary };
});
