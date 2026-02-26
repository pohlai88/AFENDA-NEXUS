'use server';

import type { CreateDTItemInput } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import { routes } from '@/lib/constants';

export async function createDeferredTaxItem(
  input: CreateDTItemInput
): Promise<{ ok: true; itemId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createDeferredTaxItem:', input);
  revalidatePath(routes.finance.deferredTax);
  return { ok: true, itemId: 'dt-new-' + Date.now() };
}

export async function recalculateDeferredTax(
  periodEnd: Date
): Promise<{ ok: true; itemsProcessed: number; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 700));
  console.log('[Action] recalculateDeferredTax:', periodEnd);
  revalidatePath(routes.finance.deferredTax);
  return { ok: true, itemsProcessed: 25, journalId: 'je-dt-' + Date.now() };
}

export async function applyRateChange(
  newRate: number,
  effectiveDate: Date
): Promise<{ ok: true; journalId: string; impact: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] applyRateChange:', newRate, effectiveDate);
  revalidatePath(routes.finance.deferredTax);
  return { ok: true, journalId: 'je-rate-' + Date.now(), impact: -45000 };
}

export async function assessValuationAllowance(
  dtaItemIds: string[],
  allowanceAmount: number
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] assessValuationAllowance:', dtaItemIds, allowanceAmount);
  revalidatePath(routes.finance.deferredTax);
  return { ok: true, journalId: 'je-va-' + Date.now() };
}
