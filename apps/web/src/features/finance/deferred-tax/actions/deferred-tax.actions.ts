'use server';

import { revalidatePath } from 'next/cache';
import type { DeferredTaxType, OriginType } from '../types';

interface CreateDTItemInput { description: string; type: DeferredTaxType; originType: OriginType; bookBasis: number; taxBasis: number; taxRate: number; jurisdiction: string; glAccountId: string; }

export async function createDeferredTaxItem(input: CreateDTItemInput): Promise<{ ok: true; itemId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createDeferredTaxItem:', input);
  revalidatePath('/finance/deferred-tax');
  return { ok: true, itemId: 'dt-new-' + Date.now() };
}

export async function recalculateDeferredTax(periodEnd: Date): Promise<{ ok: true; itemsProcessed: number; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 700));
  console.log('[Action] recalculateDeferredTax:', periodEnd);
  revalidatePath('/finance/deferred-tax');
  return { ok: true, itemsProcessed: 25, journalId: 'je-dt-' + Date.now() };
}

export async function applyRateChange(newRate: number, effectiveDate: Date): Promise<{ ok: true; journalId: string; impact: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] applyRateChange:', newRate, effectiveDate);
  revalidatePath('/finance/deferred-tax');
  return { ok: true, journalId: 'je-rate-' + Date.now(), impact: -45000 };
}

export async function assessValuationAllowance(dtaItemIds: string[], allowanceAmount: number): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] assessValuationAllowance:', dtaItemIds, allowanceAmount);
  revalidatePath('/finance/deferred-tax');
  return { ok: true, journalId: 'je-va-' + Date.now() };
}
