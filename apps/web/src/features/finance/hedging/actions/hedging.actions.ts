'use server';

import { revalidatePath } from 'next/cache';
import { routes } from '@/lib/constants';
import { getRequestContext } from '@/lib/auth';
import {
  designateHedgeCmd,
  runEffectivenessTestCmd,
  discontinueHedgeCmd,
  recycleCashFlowReserveCmd,
} from '../queries/hedging.queries';

export async function designateHedgeAction(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await designateHedgeCmd(ctx, input);
  if (!result.ok) return result;
  revalidatePath(routes.finance.hedges);
  return { ok: true, id: result.value.id };
}

export async function runEffectivenessTestAction(
  relationshipId: string,
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await runEffectivenessTestCmd(ctx, relationshipId, input);
  if (!result.ok) return result;
  revalidatePath(routes.finance.hedgeDetail(relationshipId));
  return { ok: true, id: result.value.id };
}

export async function discontinueHedgeAction(
  relationshipId: string,
  reason: string,
): Promise<{ ok: true; journalId: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await discontinueHedgeCmd(ctx, relationshipId, reason);
  if (!result.ok) return result;
  revalidatePath(routes.finance.hedges);
  return { ok: true, journalId: result.value.journalId };
}

export async function recycleCashFlowReserveAction(
  relationshipId: string,
  amount: number,
): Promise<{ ok: true; journalId: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await recycleCashFlowReserveCmd(ctx, relationshipId, amount);
  if (!result.ok) return result;
  revalidatePath(routes.finance.hedgeDetail(relationshipId));
  return { ok: true, journalId: result.value.journalId };
}
