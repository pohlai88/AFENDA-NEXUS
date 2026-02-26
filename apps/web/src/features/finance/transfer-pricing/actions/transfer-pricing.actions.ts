'use server';

import { revalidatePath } from 'next/cache';
import type { TransactionType, PricingMethod } from '../types';

interface CreatePolicyInput { name: string; transactionType: TransactionType; pricingMethod: PricingMethod; entities: string[]; armLengthRange: { min: number; max: number }; targetMargin: number; effectiveFrom: Date; }

export async function createTransferPricingPolicy(input: CreatePolicyInput): Promise<{ ok: true; policyId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createTransferPricingPolicy:', input);
  revalidatePath('/finance/transfer-pricing');
  return { ok: true, policyId: 'tp-new-' + Date.now() };
}

export async function uploadBenchmarkStudy(policyId: string, fiscalYear: number, studyData: { lq: number; median: number; uq: number; actualResult: number }): Promise<{ ok: true; studyId: string; isCompliant: boolean } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] uploadBenchmarkStudy:', policyId, fiscalYear, studyData);
  revalidatePath('/finance/transfer-pricing');
  const isCompliant = studyData.actualResult >= studyData.lq && studyData.actualResult <= studyData.uq;
  return { ok: true, studyId: 'bm-new-' + Date.now(), isCompliant };
}

export async function recordAdjustment(policyId: string, amount: number, reason: string): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] recordAdjustment:', policyId, amount, reason);
  revalidatePath('/finance/transfer-pricing');
  return { ok: true, journalId: 'je-tp-' + Date.now() };
}
