'use server';

import { revalidatePath } from 'next/cache';
import { routes } from '@/lib/constants';
import { getRequestContext } from '@/lib/auth';
import {
  createDeferredTaxItemCmd,
  recalculateDeferredTaxCmd,
  applyRateChangeCmd,
  assessValuationAllowanceCmd,
} from '../queries/deferred-tax.queries';

export async function createDeferredTaxItemAction(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await createDeferredTaxItemCmd(ctx, input);
  if (!result.ok) return result;
  revalidatePath(routes.finance.deferredTax);
  return { ok: true, id: result.value.id };
}

export async function recalculateDeferredTaxAction(
  periodEnd: string,
): Promise<{ ok: true; itemsProcessed: number; journalId: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await recalculateDeferredTaxCmd(ctx, periodEnd);
  if (!result.ok) return result;
  revalidatePath(routes.finance.deferredTax);
  return { ok: true, itemsProcessed: result.value.itemsProcessed, journalId: result.value.journalId };
}

export async function applyRateChangeAction(
  newRate: number,
  effectiveDate: string,
): Promise<{ ok: true; journalId: string; impact: number } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await applyRateChangeCmd(ctx, newRate, effectiveDate);
  if (!result.ok) return result;
  revalidatePath(routes.finance.deferredTax);
  return { ok: true, journalId: result.value.journalId, impact: result.value.impact };
}

export async function assessValuationAllowanceAction(
  dtaItemIds: string[],
  allowanceAmount: number,
): Promise<{ ok: true; journalId: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await assessValuationAllowanceCmd(ctx, dtaItemIds, allowanceAmount);
  if (!result.ok) return result;
  revalidatePath(routes.finance.deferredTax);
  return { ok: true, journalId: result.value.journalId };
}
