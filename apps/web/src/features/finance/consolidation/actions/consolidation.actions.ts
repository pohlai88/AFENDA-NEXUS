'use server';

import { revalidatePath } from 'next/cache';
import { routes } from '@/lib/constants';
import { getRequestContext } from '@/lib/auth';
import {
  addGroupEntityCmd,
  runConsolidationCmd,
  recordImpairmentCmd,
  translateForeignSubCmd,
} from '../queries/consolidation.queries';

export async function addGroupEntityAction(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await addGroupEntityCmd(ctx, input);
  if (!result.ok) return result;
  revalidatePath(routes.finance.consolidation);
  return { ok: true, id: result.value.id };
}

export async function runConsolidationAction(
  input: unknown,
): Promise<{ ok: true; journalEntries: number } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await runConsolidationCmd(ctx, input);
  if (!result.ok) return result;
  revalidatePath(routes.finance.consolidation);
  return { ok: true, journalEntries: result.value.journalEntries };
}

export async function recordImpairmentAction(
  goodwillId: string,
  amount: number,
  reason: string,
): Promise<{ ok: true; journalId: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await recordImpairmentCmd(ctx, goodwillId, amount, reason);
  if (!result.ok) return result;
  revalidatePath(routes.finance.consolidation);
  return { ok: true, journalId: result.value.journalId };
}

export async function translateForeignSubAction(
  entityId: string,
  fxRate: number,
  periodEnd: string,
): Promise<{ ok: true; ctaAmount: number; journalId: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await translateForeignSubCmd(ctx, entityId, fxRate, periodEnd);
  if (!result.ok) return result;
  revalidatePath(routes.finance.consolidation);
  return { ok: true, ctaAmount: result.value.ctaAmount, journalId: result.value.journalId };
}
