'use server';

import type { IdParam } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import type { TaxCode, TaxReturnPeriod, WHTCertificate } from '../types';
import { routes } from '@/lib/constants';

// ─── Tax Code Actions ────────────────────────────────────────────────────────

export async function createTaxCode(
  data: Omit<TaxCode, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ ok: true; data: { id: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));

  console.log('Creating tax code:', data);

  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.taxCodes);

  return { ok: true, data: { id: `tc-${Date.now()}` } };
}

export async function updateTaxCode(
  id: string,
  data: Partial<TaxCode>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Updating tax code:', id, data);

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
  await new Promise((r) => setTimeout(r, 500));

  console.log('Updating tax rate:', params);

  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.taxCodes);
  revalidatePath(routes.finance.taxCodeDetail(params.taxCodeId));

  return { ok: true };
}

export async function deactivateTaxCode(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  console.log('Deactivating tax code:', id);

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
  await new Promise((r) => setTimeout(r, 500));

  console.log('Creating tax return period:', data);

  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.taxReturns);

  return { ok: true, data: { id: `trp-${Date.now()}` } };
}

export async function fileTaxReturn(params: {
  periodId: string;
  referenceNumber: string;
  filedDate: Date;
  attachmentIds?: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));

  console.log('Filing tax return:', params);

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
  await new Promise((r) => setTimeout(r, 500));

  console.log('Recording tax payment:', params);

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
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Recalculating tax return:', periodId);

  revalidatePath(routes.finance.taxReturnDetail(periodId));

  return {
    ok: true,
    data: {
      outputTax: 125000.0,
      inputTax: 85000.0,
      netPayable: 40000.0,
    },
  };
}

// ─── WHT Certificate Actions ─────────────────────────────────────────────────

export async function createWHTCertificate(
  data: Omit<WHTCertificate, 'id' | 'certificateNumber' | 'status' | 'replacedById' | 'createdAt'>
): Promise<
  { ok: true; data: { id: string; certificateNumber: string } } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 600));

  console.log('Creating WHT certificate:', data);

  const certNumber = `WHT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.whtList);

  return {
    ok: true,
    data: {
      id: `wht-${Date.now()}`,
      certificateNumber: certNumber,
    },
  };
}

export async function issueWHTCertificate(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Issuing WHT certificate:', id);

  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.whtList);
  revalidatePath(routes.finance.whtDetail(id));

  return { ok: true };
}

export async function cancelWHTCertificate(params: {
  id: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Cancelling WHT certificate:', params);

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
  await new Promise((r) => setTimeout(r, 700));

  console.log('Replacing WHT certificate:', params);

  const certNumber = `WHT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.whtList);
  revalidatePath(routes.finance.whtDetail(params.originalId));

  return {
    ok: true,
    data: {
      id: `wht-${Date.now()}`,
      certificateNumber: certNumber,
    },
  };
}

export async function downloadWHTCertificatePDF(
  id: string
): Promise<{ ok: true; data: { url: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  console.log('Generating WHT certificate PDF:', id);

  return {
    ok: true,
    data: { url: `/api/tax/wht/${id}/pdf` },
  };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkIssueWHTCertificates(
  ids: string[]
): Promise<{ ok: true; data: { issuedCount: number } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));

  console.log('Bulk issuing WHT certificates:', ids);

  revalidatePath(routes.finance.tax);
  revalidatePath(routes.finance.whtList);

  return { ok: true, data: { issuedCount: ids.length } };
}
