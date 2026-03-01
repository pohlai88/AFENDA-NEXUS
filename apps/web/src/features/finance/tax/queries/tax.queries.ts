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

export async function getTaxCodes(
  ctx: RequestCtx,
  params?: { taxType?: string; status?: string; search?: string }
): Promise<{ ok: true; data: TaxCode[] } | { ok: false; error: string }> {
  const api = createApiClient(ctx);
  const qp = new URLSearchParams();
  if (params?.taxType) qp.set('taxType', params.taxType);
  if (params?.status) qp.set('status', params.status);
  if (params?.search) qp.set('search', params.search);
  const qs = qp.toString();
  const res = await api.get(`/tax/codes${qs ? `?${qs}` : ''}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxCode[] };
}

export async function getTaxCodeById(
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: TaxCode } | { ok: false; error: string }> {
  const api = createApiClient(ctx);
  const res = await api.get(`/tax/codes/${id}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxCode };
}

export async function getTaxRateHistory(
  ctx: RequestCtx,
  taxCodeId: string
): Promise<{ ok: true; data: TaxRateHistory[] } | { ok: false; error: string }> {
  const api = createApiClient(ctx);
  const res = await api.get(`/tax/rates?taxCodeId=${taxCodeId}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxRateHistory[] };
}

export async function getTaxReturnPeriods(
  ctx: RequestCtx,
  params?: { taxType?: string; status?: string; year?: number }
): Promise<{ ok: true; data: TaxReturnPeriod[] } | { ok: false; error: string }> {
  const api = createApiClient(ctx);
  const qp = new URLSearchParams();
  if (params?.taxType) qp.set('taxType', params.taxType);
  if (params?.status) qp.set('status', params.status);
  if (params?.year) qp.set('year', String(params.year));
  const qs = qp.toString();
  const res = await api.get(`/tax/returns${qs ? `?${qs}` : ''}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxReturnPeriod[] };
}

export async function getTaxReturnPeriodById(
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: TaxReturnPeriod } | { ok: false; error: string }> {
  const api = createApiClient(ctx);
  const res = await api.get(`/tax/returns/${id}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxReturnPeriod };
}

export async function getWHTCertificates(
  ctx: RequestCtx,
  params?: { type?: string; status?: string; search?: string; periodFrom?: Date; periodTo?: Date }
): Promise<{ ok: true; data: WHTCertificate[] } | { ok: false; error: string }> {
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
}

export async function getWHTCertificateById(
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: WHTCertificate } | { ok: false; error: string }> {
  const api = createApiClient(ctx);
  const res = await api.get(`/tax/wht-certificates/${id}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as WHTCertificate };
}

export async function getTaxSummary(
  ctx: RequestCtx
): Promise<{ ok: true; data: TaxSummary } | { ok: false; error: string }> {
  const api = createApiClient(ctx);
  const res = await api.get('/tax/summary');
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as TaxSummary };
}
