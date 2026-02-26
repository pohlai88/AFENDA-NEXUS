'use server';

import type { CreateLeaseInput, CreateModificationInput } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import { routes } from '@/lib/constants';

// ─── Lease Contract Actions ──────────────────────────────────────────────────

export async function createLease(
  input: CreateLeaseInput
): Promise<{ ok: true; leaseId: string; leaseNumber: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] createLease:', input);
  revalidatePath(routes.finance.leases);
  return { ok: true, leaseId: 'lease-new-' + Date.now(), leaseNumber: 'LS-2026-' + Date.now() };
}

export async function updateLease(
  leaseId: string,
  updates: Partial<CreateLeaseInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] updateLease:', leaseId, updates);
  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.leaseDetail(leaseId));
  return { ok: true };
}

export async function activateLease(
  leaseId: string
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] activateLease:', leaseId);
  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.journals);
  return { ok: true, journalId: 'je-lease-' + Date.now() };
}

export async function terminateLease(
  leaseId: string,
  terminationDate: Date,
  reason: string
): Promise<{ ok: true; journalId: string; gainOrLoss: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] terminateLease:', leaseId, terminationDate, reason);
  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.journals);
  return { ok: true, journalId: 'je-term-' + Date.now(), gainOrLoss: -15000 };
}

// ─── Lease Payment Actions ───────────────────────────────────────────────────

export async function recordLeasePayment(
  leaseId: string,
  scheduleEntryId: string,
  paymentDate: Date,
  amount: number
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] recordLeasePayment:', leaseId, scheduleEntryId, paymentDate, amount);
  revalidatePath(routes.finance.leaseDetail(leaseId));
  revalidatePath(routes.finance.journals);
  return { ok: true, journalId: 'je-pay-' + Date.now() };
}

export async function runDepreciationForLease(
  leaseId: string,
  periodEnd: Date
): Promise<{ ok: true; journalId: string; amount: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] runDepreciationForLease:', leaseId, periodEnd);
  revalidatePath(routes.finance.leaseDetail(leaseId));
  revalidatePath(routes.finance.journals);
  return { ok: true, journalId: 'je-dep-' + Date.now(), amount: 72917 };
}

export async function accrueLeaseLiabilityInterest(
  leaseId: string,
  periodEnd: Date
): Promise<{ ok: true; journalId: string; amount: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));
  console.log('[Action] accrueLeaseLiabilityInterest:', leaseId, periodEnd);
  revalidatePath(routes.finance.leaseDetail(leaseId));
  revalidatePath(routes.finance.journals);
  return { ok: true, journalId: 'je-int-' + Date.now(), amount: 20560 };
}

// ─── Lease Modification Actions ──────────────────────────────────────────────

export async function createLeaseModification(
  input: CreateModificationInput
): Promise<{ ok: true; modificationId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createLeaseModification:', input);
  revalidatePath(routes.finance.leaseDetail(input.leaseId));
  return { ok: true, modificationId: 'mod-new-' + Date.now() };
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
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] calculateModificationImpact:', modificationId);
  return {
    ok: true,
    rouAdjustment: 150000,
    liabilityAdjustment: 150000,
    gainOrLoss: 0,
  };
}

export async function processModification(
  modificationId: string
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] processModification:', modificationId);
  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.journals);
  return { ok: true, journalId: 'je-mod-' + Date.now() };
}

// ─── Option Assessment Actions ───────────────────────────────────────────────

export async function reassessExtensionOption(
  leaseId: string,
  isReasonablyCertain: boolean,
  justification: string
): Promise<{ ok: true; journalId?: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] reassessExtensionOption:', leaseId, isReasonablyCertain, justification);
  revalidatePath(routes.finance.leaseDetail(leaseId));
  if (isReasonablyCertain) {
    return { ok: true, journalId: 'je-ext-' + Date.now() };
  }
  return { ok: true };
}

export async function reassessPurchaseOption(
  leaseId: string,
  isReasonablyCertain: boolean,
  justification: string
): Promise<{ ok: true; journalId?: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] reassessPurchaseOption:', leaseId, isReasonablyCertain, justification);
  revalidatePath(routes.finance.leaseDetail(leaseId));
  return { ok: true };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkRunLeaseDepreciation(
  periodEnd: Date
): Promise<
  | { ok: true; leasesProcessed: number; totalDepreciation: number; journalId: string }
  | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 800));
  console.log('[Action] bulkRunLeaseDepreciation:', periodEnd);
  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.journals);
  return {
    ok: true,
    leasesProcessed: 12,
    totalDepreciation: 185000,
    journalId: 'je-bulk-dep-' + Date.now(),
  };
}

export async function bulkAccrueLeaseInterest(
  periodEnd: Date
): Promise<
  | { ok: true; leasesProcessed: number; totalInterest: number; journalId: string }
  | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 700));
  console.log('[Action] bulkAccrueLeaseInterest:', periodEnd);
  revalidatePath(routes.finance.leases);
  revalidatePath(routes.finance.journals);
  return {
    ok: true,
    leasesProcessed: 12,
    totalInterest: 45000,
    journalId: 'je-bulk-int-' + Date.now(),
  };
}
