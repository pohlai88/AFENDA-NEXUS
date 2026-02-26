'use server';

import { revalidatePath } from 'next/cache';
import type { FixedAsset, AssetDisposalType, DisposalRequest } from '../types';

// ─── Asset CRUD Actions ──────────────────────────────────────────────────────

export async function createFixedAsset(
  data: Omit<FixedAsset, 'id' | 'assetNumber' | 'accumulatedDepreciation' | 'netBookValue' | 'lastDepreciationDate' | 'disposalDate' | 'disposalType' | 'disposalProceeds' | 'disposalGainLoss' | 'attachmentCount' | 'createdAt' | 'updatedAt'>
): Promise<{ ok: true; data: { id: string; assetNumber: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));

  console.log('Creating fixed asset:', data);

  const assetNumber = `FA-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  revalidatePath('/finance/fixed-assets');

  return {
    ok: true,
    data: { id: `asset-${Date.now()}`, assetNumber },
  };
}

export async function updateFixedAsset(
  id: string,
  data: Partial<FixedAsset>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Updating fixed asset:', id, data);

  revalidatePath('/finance/fixed-assets');
  revalidatePath(`/finance/fixed-assets/${id}`);

  return { ok: true };
}

// ─── Depreciation Actions ────────────────────────────────────────────────────

export async function calculateDepreciation(params: {
  periodStart: Date;
  periodEnd: Date;
  assetIds?: string[];
}): Promise<{
  ok: true;
  data: { runId: string; assetCount: number; totalDepreciation: number };
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 1500));

  console.log('Calculating depreciation:', params);

  revalidatePath('/finance/fixed-assets/depreciation');

  return {
    ok: true,
    data: {
      runId: `run-${Date.now()}`,
      assetCount: params.assetIds?.length ?? 45,
      totalDepreciation: 28500.0,
    },
  };
}

export async function postDepreciationRun(
  runId: string
): Promise<{ ok: true; data: { journalId: string; journalNumber: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Posting depreciation run:', runId);

  revalidatePath('/finance/fixed-assets');
  revalidatePath('/finance/fixed-assets/depreciation');
  revalidatePath('/finance/general-ledger/journals');

  return {
    ok: true,
    data: {
      journalId: `jnl-${Date.now()}`,
      journalNumber: `JE-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    },
  };
}

export async function cancelDepreciationRun(
  runId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Cancelling depreciation run:', runId);

  revalidatePath('/finance/fixed-assets/depreciation');

  return { ok: true };
}

// ─── Disposal Actions ────────────────────────────────────────────────────────

export async function createDisposalRequest(data: {
  assetId: string;
  disposalType: AssetDisposalType;
  expectedProceeds: number;
  reason: string;
}): Promise<{ ok: true; data: { requestId: string; requestNumber: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));

  console.log('Creating disposal request:', data);

  const requestNumber = `DR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  revalidatePath('/finance/fixed-assets');
  revalidatePath('/finance/fixed-assets/disposals');

  return {
    ok: true,
    data: {
      requestId: `disp-${Date.now()}`,
      requestNumber,
    },
  };
}

export async function approveDisposalRequest(
  requestId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Approving disposal request:', requestId);

  revalidatePath('/finance/fixed-assets');
  revalidatePath('/finance/fixed-assets/disposals');
  revalidatePath('/finance/approvals');

  return { ok: true };
}

export async function rejectDisposalRequest(params: {
  requestId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Rejecting disposal request:', params);

  revalidatePath('/finance/fixed-assets/disposals');

  return { ok: true };
}

export async function completeDisposal(params: {
  requestId: string;
  actualProceeds: number;
  disposalDate: Date;
}): Promise<{
  ok: true;
  data: { gainLoss: number; journalId: string };
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));

  console.log('Completing disposal:', params);

  revalidatePath('/finance/fixed-assets');
  revalidatePath('/finance/fixed-assets/disposals');
  revalidatePath('/finance/general-ledger/journals');

  return {
    ok: true,
    data: {
      gainLoss: params.actualProceeds - 5000,
      journalId: `jnl-${Date.now()}`,
    },
  };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkUpdateLocation(params: {
  assetIds: string[];
  location: string;
}): Promise<{ ok: true; data: { updatedCount: number } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));

  console.log('Bulk updating location:', params);

  revalidatePath('/finance/fixed-assets');

  return { ok: true, data: { updatedCount: params.assetIds.length } };
}

export async function bulkTransferDepartment(params: {
  assetIds: string[];
  department: string;
  responsiblePerson: string;
}): Promise<{ ok: true; data: { transferredCount: number } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));

  console.log('Bulk transferring department:', params);

  revalidatePath('/finance/fixed-assets');

  return { ok: true, data: { transferredCount: params.assetIds.length } };
}
