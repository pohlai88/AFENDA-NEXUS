'use server';

import { revalidatePath } from 'next/cache';
import type { IntangibleAsset, ImpairmentTestResult } from '../types';

// ─── Asset CRUD Actions ──────────────────────────────────────────────────────

export async function createIntangibleAsset(
  data: Omit<IntangibleAsset, 'id' | 'assetNumber' | 'accumulatedAmortization' | 'carryingAmount' | 'impairmentLoss' | 'lastAmortizationDate' | 'lastImpairmentTestDate' | 'nextImpairmentTestDate' | 'attachmentCount' | 'createdAt' | 'updatedAt'>
): Promise<{ ok: true; data: { id: string; assetNumber: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));

  console.log('Creating intangible asset:', data);

  const assetNumber = `IA-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  revalidatePath('/finance/intangibles');

  return {
    ok: true,
    data: { id: `int-${Date.now()}`, assetNumber },
  };
}

export async function updateIntangibleAsset(
  id: string,
  data: Partial<IntangibleAsset>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Updating intangible asset:', id, data);

  revalidatePath('/finance/intangibles');
  revalidatePath(`/finance/intangibles/${id}`);

  return { ok: true };
}

// ─── Amortization Actions ────────────────────────────────────────────────────

export async function calculateAmortization(params: {
  periodStart: Date;
  periodEnd: Date;
  assetIds?: string[];
}): Promise<{
  ok: true;
  data: { runId: string; assetCount: number; totalAmortization: number };
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 1500));

  console.log('Calculating amortization:', params);

  revalidatePath('/finance/intangibles');

  return {
    ok: true,
    data: {
      runId: `amort-run-${Date.now()}`,
      assetCount: params.assetIds?.length ?? 22,
      totalAmortization: 18500.0,
    },
  };
}

export async function postAmortizationRun(
  runId: string
): Promise<{ ok: true; data: { journalId: string; journalNumber: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Posting amortization run:', runId);

  revalidatePath('/finance/intangibles');
  revalidatePath('/finance/general-ledger/journals');

  return {
    ok: true,
    data: {
      journalId: `jnl-${Date.now()}`,
      journalNumber: `JE-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    },
  };
}

// ─── Impairment Actions ──────────────────────────────────────────────────────

export async function recordImpairmentTest(params: {
  assetId: string;
  testDate: Date;
  recoverableAmount: number;
  methodology: string;
  assumptions: string;
}): Promise<{
  ok: true;
  data: {
    testId: string;
    result: ImpairmentTestResult;
    impairmentLoss: number;
    journalId: string | null;
  };
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));

  console.log('Recording impairment test:', params);

  revalidatePath('/finance/intangibles');
  revalidatePath(`/finance/intangibles/${params.assetId}`);

  return {
    ok: true,
    data: {
      testId: `imp-${Date.now()}`,
      result: 'no_impairment',
      impairmentLoss: 0,
      journalId: null,
    },
  };
}

export async function reverseImpairment(params: {
  assetId: string;
  reversalAmount: number;
  reversalDate: Date;
  reason: string;
}): Promise<{ ok: true; data: { journalId: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));

  console.log('Reversing impairment:', params);

  revalidatePath('/finance/intangibles');
  revalidatePath(`/finance/intangibles/${params.assetId}`);
  revalidatePath('/finance/general-ledger/journals');

  return {
    ok: true,
    data: { journalId: `jnl-${Date.now()}` },
  };
}

// ─── Disposal Actions ────────────────────────────────────────────────────────

export async function disposeIntangibleAsset(params: {
  assetId: string;
  disposalDate: Date;
  disposalProceeds: number;
  reason: string;
}): Promise<{
  ok: true;
  data: { gainLoss: number; journalId: string };
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 700));

  console.log('Disposing intangible asset:', params);

  revalidatePath('/finance/intangibles');
  revalidatePath(`/finance/intangibles/${params.assetId}`);
  revalidatePath('/finance/general-ledger/journals');

  return {
    ok: true,
    data: {
      gainLoss: params.disposalProceeds - 15000,
      journalId: `jnl-${Date.now()}`,
    },
  };
}

export async function writeOffIntangibleAsset(params: {
  assetId: string;
  writeOffDate: Date;
  reason: string;
}): Promise<{ ok: true; data: { journalId: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));

  console.log('Writing off intangible asset:', params);

  revalidatePath('/finance/intangibles');
  revalidatePath(`/finance/intangibles/${params.assetId}`);
  revalidatePath('/finance/general-ledger/journals');

  return {
    ok: true,
    data: { journalId: `jnl-${Date.now()}` },
  };
}
