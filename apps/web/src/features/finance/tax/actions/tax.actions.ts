'use server';

import type { IdParam } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import type { TaxCode, TaxReturnPeriod, WHTCertificate } from '../types';
import { routes } from '@/lib/constants';
import { createApiClient } from '@/lib/api-client';
import { getRequestContext } from '@/lib/auth';

// ─── Tax Code Actions ────────────────────────────────────────────────────────

export async function createTaxCode(
  data: Omit<TaxCode, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ ok: true; data: { id: string } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post('/tax/codes', data);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.taxCodes);
  return { ok: true, data: res.value as { id: string } };
}

export async function updateTaxCode(
  id: string,
  data: Partial<TaxCode>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.patch(`/tax/codes/${id}`, data);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.taxCodes);
  revalidatePath(routes.finance.taxCodeDetail(id));
  return { ok: true };
}

export async function updateTaxRate(params: {
  taxCodeId: IdParam['id'];
  newRate: number;
  effectiveFrom: Date;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post('/tax/rates', params);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.taxCodes);
  revalidatePath(routes.finance.taxCodeDetail(params.taxCodeId));
  return { ok: true };
}

export async function deactivateTaxCode(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.patch(`/tax/codes/${id}`, { status: 'inactive' });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.taxCodes);
  return { ok: true };
}

// ─── Tax Return Period Actions ───────────────────────────────────────────────

export async function createTaxReturnPeriod(
  data: Omit<
    TaxReturnPeriod,
    'id' | 'filedDate' | 'filedBy' | 'paidDate' | 'referenceNumber' | 'attachmentCount'
  >
): Promise<{ ok: true; data: { id: string } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post('/tax/returns', data);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.taxReturns);
  return { ok: true, data: res.value as { id: string } };
}

export async function fileTaxReturn(params: {
  periodId: string;
  referenceNumber: string;
  filedDate: Date;
  attachmentIds?: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/tax/returns/${params.periodId}/file`, params);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.taxReturns);
  revalidatePath(routes.finance.taxReturnDetail(params.periodId));
  return { ok: true };
}

export async function recordTaxPayment(params: {
  periodId: string;
  paidDate: Date;
  amount: number;
  paymentReference?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/tax/returns/${params.periodId}/payment`, params);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.taxReturns);
  revalidatePath(routes.finance.taxReturnDetail(params.periodId));
  return { ok: true };
}

export async function recalculateTaxReturn(
  periodId: string
): Promise<
  | { ok: true; data: { outputTax: number; inputTax: number; netPayable: number } }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/tax/returns/${periodId}/recalculate`, {});
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.taxReturnDetail(periodId));
  return { ok: true, data: res.value as { outputTax: number; inputTax: number; netPayable: number } };
}

// ─── WHT Certificate Actions ─────────────────────────────────────────────────

export async function createWHTCertificate(
  data: Omit<WHTCertificate, 'id' | 'certificateNumber' | 'status' | 'replacedById' | 'createdAt'>
): Promise<
  { ok: true; data: { id: string; certificateNumber: string } } | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post('/tax/wht-certificates', data);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.whtList);
  return { ok: true, data: res.value as { id: string; certificateNumber: string } };
}

export async function issueWHTCertificate(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/tax/wht-certificates/${id}/issue`, {});
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.whtList);
  revalidatePath(routes.finance.whtDetail(id));
  return { ok: true };
}

export async function cancelWHTCertificate(params: {
  id: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/tax/wht-certificates/${params.id}/cancel`, { reason: params.reason });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.whtList);
  revalidatePath(routes.finance.whtDetail(params.id));
  return { ok: true };
}

export async function replaceWHTCertificate(params: {
  originalId: string;
  newData: Omit<
    WHTCertificate,
    'id' | 'certificateNumber' | 'status' | 'replacedById' | 'createdAt'
  >;
}): Promise<
  { ok: true; data: { id: string; certificateNumber: string } } | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/tax/wht-certificates/${params.originalId}/replace`, params.newData);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.whtList);
  revalidatePath(routes.finance.whtDetail(params.originalId));
  return { ok: true, data: res.value as { id: string; certificateNumber: string } };
}

export async function downloadWHTCertificatePDF(
  id: string
): Promise<{ ok: true; data: { url: string } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.get(`/tax/wht-certificates/${id}/pdf`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as { url: string } };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkIssueWHTCertificates(
  ids: string[]
): Promise<{ ok: true; data: { issuedCount: number } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post('/tax/wht-certificates/bulk/issue', { ids });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.whtList);
  return { ok: true, data: res.value as { issuedCount: number } };
}
