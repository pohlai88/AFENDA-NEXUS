'use server';

import { revalidatePath } from 'next/cache';
import { routes } from '@/lib/constants';
import { getRequestContext } from '@/lib/auth';
import {
  createPolicyCmd,
  createBenchmarkCmd,
  recordAdjustmentCmd,
} from '../queries/transfer-pricing.queries';

export async function createPolicyAction(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await createPolicyCmd(ctx, input);
  if (!result.ok) return result;
  revalidatePath(routes.finance.transferPricing);
  return { ok: true, id: result.value.id };
}

export async function uploadBenchmarkAction(
  policyId: string,
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await createBenchmarkCmd(ctx, policyId, input);
  if (!result.ok) return result;
  revalidatePath(routes.finance.transferPricingDetail(policyId));
  return { ok: true, id: result.value.id };
}

export async function recordAdjustmentAction(
  policyId: string,
  amount: number,
  reason: string,
): Promise<{ ok: true; journalId: string } | { ok: false; error: { message: string } }> {
  const ctx = await getRequestContext();
  const result = await recordAdjustmentCmd(ctx, policyId, amount, reason);
  if (!result.ok) return result;
  revalidatePath(routes.finance.transferPricingDetail(policyId));
  return { ok: true, journalId: result.value.journalId };
}
