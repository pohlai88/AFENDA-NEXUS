'use server';

import type { CreateLeaseInput, CreateModificationInput } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { routes } from '@/lib/constants';

// ─── Lease Contract Actions ──────────────────────────────────────────────────

export async function createLease(
  input: CreateLeaseInput
): Promise<{ ok: true; leaseId: string; leaseNumber: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ id: string; leaseNumber: string }>('/leases', input);

  revalidatePath(routes.finance.leases);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, leaseId: result.value.id, leaseNumber: result.value.leaseNumber };
}

export async function updateLease(
  leaseId: string,
  updates: Partial<CreateLeaseInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.patch(`/leases/${leaseId}`, updates);

  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.leaseDetail(leaseId));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function activateLease(
  leaseId: string
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ journalId: string }>(`/leases/${leaseId}/activate`, {});

  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, journalId: result.value.journalId };
}

export async function terminateLease(
  leaseId: string,
  terminationDate: Date,
  reason: string
): Promise<{ ok: true; journalId: string; gainOrLoss: number } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ journalId: string; gainOrLoss: number }>(
    `/leases/${leaseId}/terminate`,
    { terminationDate: terminationDate.toISOString(), reason }
  );

  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, journalId: result.value.journalId, gainOrLoss: result.value.gainOrLoss };
}

// ─── Lease Payment Actions ───────────────────────────────────────────────────

export async function recordLeasePayment(
  leaseId: string,
  scheduleEntryId: string,
  paymentDate: Date,
  amount: number
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ journalId: string }>(
    `/leases/${leaseId}/payments`,
    { scheduleEntryId, paymentDate: paymentDate.toISOString(), amount }
  );

  revalidatePath(routes.finance.leaseDetail(leaseId));
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, journalId: result.value.journalId };
}

export async function runDepreciationForLease(
  leaseId: string,
  periodEnd: Date
): Promise<{ ok: true; journalId: string; amount: number } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ journalId: string; amount: number }>(
    `/leases/${leaseId}/depreciation`,
    { periodEnd: periodEnd.toISOString() }
  );

  revalidatePath(routes.finance.leaseDetail(leaseId));
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, journalId: result.value.journalId, amount: result.value.amount };
}

export async function accrueLeaseLiabilityInterest(
  leaseId: string,
  periodEnd: Date
): Promise<{ ok: true; journalId: string; amount: number } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ journalId: string; amount: number }>(
    `/leases/${leaseId}/accrue-interest`,
    { periodEnd: periodEnd.toISOString() }
  );

  revalidatePath(routes.finance.leaseDetail(leaseId));
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, journalId: result.value.journalId, amount: result.value.amount };
}

// ─── Lease Modification Actions ──────────────────────────────────────────────

export async function createLeaseModification(
  input: CreateModificationInput
): Promise<{ ok: true; modificationId: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ id: string }>(
    `/leases/${input.leaseId}/modifications`,
    input
  );

  revalidatePath(routes.finance.leaseDetail(input.leaseId));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, modificationId: result.value.id };
}

export async function calculateModificationImpact(modificationId: string): Promise<
  | {
      ok: true;
      rouAdjustment: number;
      liabilityAdjustment: number;
      gainOrLoss: number;
    }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.get<{
    rouAdjustment: number;
    liabilityAdjustment: number;
    gainOrLoss: number;
  }>(`/leases/modifications/${modificationId}/impact`);

  if (!result.ok) return { ok: false, error: result.error.message };
  return {
    ok: true,
    rouAdjustment: result.value.rouAdjustment,
    liabilityAdjustment: result.value.liabilityAdjustment,
    gainOrLoss: result.value.gainOrLoss,
  };
}

export async function processModification(
  modificationId: string
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ journalId: string }>(
    `/leases/modifications/${modificationId}/process`,
    {}
  );

  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, journalId: result.value.journalId };
}

// ─── Option Assessment Actions ───────────────────────────────────────────────

export async function reassessExtensionOption(
  leaseId: string,
  isReasonablyCertain: boolean,
  justification: string
): Promise<{ ok: true; journalId?: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ journalId?: string }>(
    `/leases/${leaseId}/reassess-extension`,
    { isReasonablyCertain, justification }
  );

  revalidatePath(routes.finance.leaseDetail(leaseId));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, journalId: result.value.journalId };
}

export async function reassessPurchaseOption(
  leaseId: string,
  isReasonablyCertain: boolean,
  justification: string
): Promise<{ ok: true; journalId?: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ journalId?: string }>(
    `/leases/${leaseId}/reassess-purchase`,
    { isReasonablyCertain, justification }
  );

  revalidatePath(routes.finance.leaseDetail(leaseId));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, journalId: result.value.journalId };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkRunLeaseDepreciation(
  periodEnd: Date
): Promise<
  | { ok: true; leasesProcessed: number; totalDepreciation: number; journalId: string }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{
    leasesProcessed: number;
    totalDepreciation: number;
    journalId: string;
  }>('/leases/bulk/depreciation', { periodEnd: periodEnd.toISOString() });

  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, ...result.value };
}

export async function bulkAccrueLeaseInterest(
  periodEnd: Date
): Promise<
  | { ok: true; leasesProcessed: number; totalInterest: number; journalId: string }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{
    leasesProcessed: number;
    totalInterest: number;
    journalId: string;
  }>('/leases/bulk/accrue-interest', { periodEnd: periodEnd.toISOString() });

  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, ...result.value };
}
