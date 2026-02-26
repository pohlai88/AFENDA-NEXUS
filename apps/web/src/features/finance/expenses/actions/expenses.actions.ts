'use server';

import { revalidatePath } from 'next/cache';
import type { ExpenseClaim, ExpenseLineItem, ClaimStatus } from '../types';

// ─── Claim Actions ───────────────────────────────────────────────────────────

export async function createExpenseClaim(
  data: Omit<ExpenseClaim, 'id' | 'claimNumber' | 'status' | 'submittedDate' | 'lineCount' | 'approvedAmount' | 'approvedBy' | 'approvedAt' | 'paidDate' | 'paymentReference' | 'rejectionReason' | 'createdAt' | 'updatedAt'>
): Promise<{ ok: true; data: { id: string; claimNumber: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));

  console.log('Creating expense claim:', data);

  const claimNumber = `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  revalidatePath('/finance/expenses');

  return {
    ok: true,
    data: { id: `exp-${Date.now()}`, claimNumber },
  };
}

export async function updateExpenseClaim(
  id: string,
  data: Partial<ExpenseClaim>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Updating expense claim:', id, data);

  revalidatePath('/finance/expenses');
  revalidatePath(`/finance/expenses/${id}`);

  return { ok: true };
}

export async function submitExpenseClaim(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));

  console.log('Submitting expense claim:', id);

  revalidatePath('/finance/expenses');
  revalidatePath(`/finance/expenses/${id}`);
  revalidatePath('/finance/approvals');

  return { ok: true };
}

export async function approveExpenseClaim(params: {
  id: string;
  approvedAmount?: number;
  comments?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));

  console.log('Approving expense claim:', params);

  revalidatePath('/finance/expenses');
  revalidatePath(`/finance/expenses/${params.id}`);
  revalidatePath('/finance/approvals');

  return { ok: true };
}

export async function rejectExpenseClaim(params: {
  id: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Rejecting expense claim:', params);

  revalidatePath('/finance/expenses');
  revalidatePath(`/finance/expenses/${params.id}`);
  revalidatePath('/finance/approvals');

  return { ok: true };
}

export async function cancelExpenseClaim(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  console.log('Cancelling expense claim:', id);

  revalidatePath('/finance/expenses');
  revalidatePath(`/finance/expenses/${id}`);

  return { ok: true };
}

export async function processExpensePayment(params: {
  claimIds: string[];
  paymentDate: Date;
  paymentMethod: string;
}): Promise<{ ok: true; data: { paymentReference: string; totalPaid: number } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));

  console.log('Processing expense payment:', params);

  revalidatePath('/finance/expenses');
  revalidatePath('/finance/payables');

  return {
    ok: true,
    data: {
      paymentReference: `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      totalPaid: 5750.75,
    },
  };
}

// ─── Line Item Actions ───────────────────────────────────────────────────────

export async function addExpenseLineItem(
  claimId: string,
  data: Omit<ExpenseLineItem, 'id' | 'claimId'>
): Promise<{ ok: true; data: { id: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  console.log('Adding expense line item:', claimId, data);

  revalidatePath(`/finance/expenses/${claimId}`);

  return { ok: true, data: { id: `line-${Date.now()}` } };
}

export async function updateExpenseLineItem(
  id: string,
  data: Partial<ExpenseLineItem>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  console.log('Updating expense line item:', id, data);

  revalidatePath('/finance/expenses');

  return { ok: true };
}

export async function deleteExpenseLineItem(
  id: string,
  claimId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));

  console.log('Deleting expense line item:', id);

  revalidatePath(`/finance/expenses/${claimId}`);

  return { ok: true };
}

// ─── Receipt Actions ─────────────────────────────────────────────────────────

export async function uploadReceipt(
  lineItemId: string,
  formData: FormData
): Promise<{ ok: true; data: { receiptId: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 1000));

  const file = formData.get('file') as File | null;
  if (!file) {
    return { ok: false, error: 'No file provided' };
  }

  console.log('Uploading receipt for line item:', lineItemId, file.name);

  return { ok: true, data: { receiptId: `rcpt-${Date.now()}` } };
}

export async function deleteReceipt(
  receiptId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));

  console.log('Deleting receipt:', receiptId);

  return { ok: true };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkApproveExpenseClaims(
  ids: string[]
): Promise<{ ok: true; data: { approvedCount: number } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));

  console.log('Bulk approving expense claims:', ids);

  revalidatePath('/finance/expenses');
  revalidatePath('/finance/approvals');

  return { ok: true, data: { approvedCount: ids.length } };
}

export async function bulkRejectExpenseClaims(params: {
  ids: string[];
  reason: string;
}): Promise<{ ok: true; data: { rejectedCount: number } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));

  console.log('Bulk rejecting expense claims:', params);

  revalidatePath('/finance/expenses');
  revalidatePath('/finance/approvals');

  return { ok: true, data: { rejectedCount: params.ids.length } };
}
