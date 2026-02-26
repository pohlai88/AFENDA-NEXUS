'use server';

import { revalidatePath } from 'next/cache';
import type { LeaseType, AssetClass, PaymentFrequency, ModificationType } from '../types';

// ─── Lease Contract Actions ──────────────────────────────────────────────────

interface CreateLeaseInput {
  description: string;
  lessorId: string;
  assetClass: AssetClass;
  assetDescription: string;
  leaseType: LeaseType;
  commencementDate: Date;
  endDate: Date;
  paymentAmount: number;
  paymentFrequency: PaymentFrequency;
  currency: string;
  incrementalBorrowingRate: number;
  hasExtensionOption?: boolean;
  extensionPeriod?: number;
  hasTerminationOption?: boolean;
  terminationPenalty?: number;
  hasPurchaseOption?: boolean;
  purchasePrice?: number;
  costCenterId?: string;
  glAccountAsset: string;
  glAccountLiability: string;
  glAccountInterest: string;
  glAccountDepreciation: string;
}

export async function createLease(
  input: CreateLeaseInput
): Promise<{ ok: true; leaseId: string; leaseNumber: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] createLease:', input);
  revalidatePath('/finance/leases');
  return { ok: true, leaseId: 'lease-new-' + Date.now(), leaseNumber: 'LS-2026-' + Date.now() };
}

export async function updateLease(
  leaseId: string,
  updates: Partial<CreateLeaseInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] updateLease:', leaseId, updates);
  revalidatePath('/finance/leases');
  revalidatePath(`/finance/leases/${leaseId}`);
  return { ok: true };
}

export async function activateLease(
  leaseId: string
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] activateLease:', leaseId);
  revalidatePath('/finance/leases');
  revalidatePath('/finance/journal');
  return { ok: true, journalId: 'je-lease-' + Date.now() };
}

export async function terminateLease(
  leaseId: string,
  terminationDate: Date,
  reason: string
): Promise<{ ok: true; journalId: string; gainOrLoss: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] terminateLease:', leaseId, terminationDate, reason);
  revalidatePath('/finance/leases');
  revalidatePath('/finance/journal');
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
  revalidatePath(`/finance/leases/${leaseId}`);
  revalidatePath('/finance/journal');
  return { ok: true, journalId: 'je-pay-' + Date.now() };
}

export async function runDepreciationForLease(
  leaseId: string,
  periodEnd: Date
): Promise<{ ok: true; journalId: string; amount: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] runDepreciationForLease:', leaseId, periodEnd);
  revalidatePath(`/finance/leases/${leaseId}`);
  revalidatePath('/finance/journal');
  return { ok: true, journalId: 'je-dep-' + Date.now(), amount: 72917 };
}

export async function accrueLeaseLiabilityInterest(
  leaseId: string,
  periodEnd: Date
): Promise<{ ok: true; journalId: string; amount: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));
  console.log('[Action] accrueLeaseLiabilityInterest:', leaseId, periodEnd);
  revalidatePath(`/finance/leases/${leaseId}`);
  revalidatePath('/finance/journal');
  return { ok: true, journalId: 'je-int-' + Date.now(), amount: 20560 };
}

// ─── Lease Modification Actions ──────────────────────────────────────────────

interface CreateModificationInput {
  leaseId: string;
  effectiveDate: Date;
  modificationType: ModificationType;
  description: string;
  revisedPaymentAmount?: number;
  revisedEndDate?: Date;
  revisedIBR?: number;
}

export async function createLeaseModification(
  input: CreateModificationInput
): Promise<{ ok: true; modificationId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createLeaseModification:', input);
  revalidatePath(`/finance/leases/${input.leaseId}`);
  return { ok: true, modificationId: 'mod-new-' + Date.now() };
}

export async function calculateModificationImpact(
  modificationId: string
): Promise<{
  ok: true;
  rouAdjustment: number;
  liabilityAdjustment: number;
  gainOrLoss: number;
} | { ok: false; error: string }> {
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
  revalidatePath('/finance/leases');
  revalidatePath('/finance/journal');
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
  revalidatePath(`/finance/leases/${leaseId}`);
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
  revalidatePath(`/finance/leases/${leaseId}`);
  return { ok: true };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkRunLeaseDepreciation(
  periodEnd: Date
): Promise<{ ok: true; leasesProcessed: number; totalDepreciation: number; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));
  console.log('[Action] bulkRunLeaseDepreciation:', periodEnd);
  revalidatePath('/finance/leases');
  revalidatePath('/finance/journal');
  return { ok: true, leasesProcessed: 12, totalDepreciation: 185000, journalId: 'je-bulk-dep-' + Date.now() };
}

export async function bulkAccrueLeaseInterest(
  periodEnd: Date
): Promise<{ ok: true; leasesProcessed: number; totalInterest: number; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 700));
  console.log('[Action] bulkAccrueLeaseInterest:', periodEnd);
  revalidatePath('/finance/leases');
  revalidatePath('/finance/journal');
  return { ok: true, leasesProcessed: 12, totalInterest: 45000, journalId: 'je-bulk-int-' + Date.now() };
}
