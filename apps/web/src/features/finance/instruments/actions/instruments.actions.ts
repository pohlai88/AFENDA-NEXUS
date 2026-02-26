'use server';

import type { CreateInstrumentInput } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import type { FairValueLevel } from '../types';
import { routes } from '@/lib/constants';

export async function createInstrument(
  input: CreateInstrumentInput
): Promise<{ ok: true; instrumentId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createInstrument:', input);
  revalidatePath(routes.finance.instruments);
  return { ok: true, instrumentId: 'inst-new-' + Date.now() };
}

export async function recordFairValue(
  instrumentId: string,
  fairValue: number,
  level: FairValueLevel,
  valuationMethod: string
): Promise<{ ok: true; journalId?: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] recordFairValue:', instrumentId, fairValue, level);
  revalidatePath(routes.finance.instruments);
  return { ok: true, journalId: 'je-fv-' + Date.now() };
}

export async function calculateECL(
  instrumentId: string
): Promise<{ ok: true; ecl: number; stage: 1 | 2 | 3 } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] calculateECL:', instrumentId);
  revalidatePath(routes.finance.instruments);
  return { ok: true, ecl: 15000, stage: 1 };
}

export async function disposeInstrument(
  instrumentId: string,
  salePrice: number,
  saleDate: Date
): Promise<{ ok: true; gainLoss: number; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] disposeInstrument:', instrumentId, salePrice);
  revalidatePath(routes.finance.instruments);
  return { ok: true, gainLoss: 25000, journalId: 'je-disp-' + Date.now() };
}
