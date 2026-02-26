'use server';

import { revalidatePath } from 'next/cache';
import type { ProvisionType, MovementType } from '../types';

interface CreateProvisionInput {
  name: string;
  description: string;
  type: ProvisionType;
  recognitionDate: Date;
  expectedSettlementDate?: Date;
  initialAmount: number;
  currency: string;
  discountRate?: number;
  glAccountId: string;
  costCenterId?: string;
}

export async function createProvision(input: CreateProvisionInput): Promise<{ ok: true; provisionId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createProvision:', input);
  revalidatePath('/finance/provisions');
  return { ok: true, provisionId: 'prov-new-' + Date.now() };
}

export async function recordMovement(provisionId: string, movementType: MovementType, amount: number, description: string): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] recordMovement:', provisionId, movementType, amount);
  revalidatePath('/finance/provisions');
  revalidatePath('/finance/journal');
  return { ok: true, journalId: 'je-mov-' + Date.now() };
}

export async function reverseProvision(provisionId: string, amount: number, reason: string): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] reverseProvision:', provisionId, amount, reason);
  revalidatePath('/finance/provisions');
  return { ok: true, journalId: 'je-rev-' + Date.now() };
}

export async function runUnwinding(asOfDate: Date): Promise<{ ok: true; provisionsProcessed: number; totalUnwinding: number; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] runUnwinding:', asOfDate);
  revalidatePath('/finance/provisions');
  return { ok: true, provisionsProcessed: 3, totalUnwinding: 45000, journalId: 'je-unwind-' + Date.now() };
}
