'use server';

import { revalidatePath } from 'next/cache';
import type { EntityType, ConsolidationMethod } from '../types';

interface AddEntityInput { entityCode: string; name: string; country: string; currency: string; entityType: EntityType; consolidationMethod: ConsolidationMethod; parentId: string; ownershipPercent: number; votingRightsPercent: number; acquisitionDate: Date; }

export async function addGroupEntity(input: AddEntityInput): Promise<{ ok: true; entityId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] addGroupEntity:', input);
  revalidatePath('/finance/consolidation');
  return { ok: true, entityId: 'ent-new-' + Date.now() };
}

export async function runConsolidation(periodEnd: Date): Promise<{ ok: true; journalEntries: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 1000));
  console.log('[Action] runConsolidation:', periodEnd);
  revalidatePath('/finance/consolidation');
  return { ok: true, journalEntries: 45 };
}

export async function recordImpairment(goodwillId: string, amount: number, reason: string): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] recordImpairment:', goodwillId, amount, reason);
  revalidatePath('/finance/consolidation');
  return { ok: true, journalId: 'je-imp-' + Date.now() };
}

export async function translateForeignSubsidiary(entityId: string, fxRate: number, periodEnd: Date): Promise<{ ok: true; ctaAmount: number; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] translateForeignSubsidiary:', entityId, fxRate, periodEnd);
  revalidatePath('/finance/consolidation');
  return { ok: true, ctaAmount: -25000, journalId: 'je-cta-' + Date.now() };
}
