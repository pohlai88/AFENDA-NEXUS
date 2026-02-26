'use server';

import { revalidatePath } from 'next/cache';
import type { HedgeType, EffectivenessResult } from '../types';

interface DesignateHedgeInput { name: string; hedgeType: HedgeType; hedgedItemId: string; hedgingInstrumentId: string; hedgeRatio: number; hedgedRisk: string; designationDate: Date; }

export async function designateHedgeRelationship(input: DesignateHedgeInput): Promise<{ ok: true; relationshipId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] designateHedgeRelationship:', input);
  revalidatePath('/finance/hedging');
  return { ok: true, relationshipId: 'hedge-new-' + Date.now() };
}

export async function runEffectivenessTest(relationshipId: string, periodEnd: Date, method: string): Promise<{ ok: true; result: EffectivenessResult; ineffectiveness: number; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] runEffectivenessTest:', relationshipId, periodEnd, method);
  revalidatePath('/finance/hedging');
  return { ok: true, result: 'effective', ineffectiveness: 2500, journalId: 'je-eff-' + Date.now() };
}

export async function discontinueHedge(relationshipId: string, reason: string): Promise<{ ok: true; journalId?: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] discontinueHedge:', relationshipId, reason);
  revalidatePath('/finance/hedging');
  return { ok: true, journalId: 'je-disc-' + Date.now() };
}

export async function recycleCashFlowReserve(relationshipId: string, amount: number): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] recycleCashFlowReserve:', relationshipId, amount);
  revalidatePath('/finance/hedging');
  return { ok: true, journalId: 'je-recycle-' + Date.now() };
}
