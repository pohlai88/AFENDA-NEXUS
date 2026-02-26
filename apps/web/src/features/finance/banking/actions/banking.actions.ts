'use server';

import { revalidatePath } from 'next/cache';
import type { MatchStatus, ReconciliationAction } from '../types';

// ─── Import Statement ────────────────────────────────────────────────────────

export async function importStatement(formData: FormData): Promise<
  | { ok: true; data: { statementId: string; transactionCount: number } }
  | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 1500));

  const file = formData.get('file') as File | null;
  const bankAccountId = formData.get('bankAccountId') as string;
  const format = formData.get('format') as string;

  if (!file) {
    return { ok: false, error: 'No file provided' };
  }

  if (!bankAccountId) {
    return { ok: false, error: 'Bank account is required' };
  }

  // Simulate processing
  console.log(`Importing ${format} file: ${file.name} for account ${bankAccountId}`);

  revalidatePath('/finance/banking');
  revalidatePath('/finance/banking/statements');

  return {
    ok: true,
    data: {
      statementId: `stmt-new-${Date.now()}`,
      transactionCount: Math.floor(Math.random() * 100) + 50,
    },
  };
}

// ─── Match Transactions ──────────────────────────────────────────────────────

export async function matchTransactions(params: {
  bankTransactionIds: string[];
  glTransactionIds: string[];
  statementId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));

  console.log('Matching transactions:', params);

  revalidatePath(`/finance/banking/reconcile/${params.statementId}`);

  return { ok: true };
}

// ─── Unmatch Transactions ────────────────────────────────────────────────────

export async function unmatchTransactions(params: {
  bankTransactionIds: string[];
  statementId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  console.log('Unmatching transactions:', params);

  revalidatePath(`/finance/banking/reconcile/${params.statementId}`);

  return { ok: true };
}

// ─── Create Journal from Bank Transaction ────────────────────────────────────

export async function createJournalFromTransaction(params: {
  bankTransactionId: string;
  statementId: string;
  debitAccountId: string;
  creditAccountId: string;
  description?: string;
  reference?: string;
}): Promise<{ ok: true; data: { journalId: string } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));

  console.log('Creating journal from transaction:', params);

  revalidatePath(`/finance/banking/reconcile/${params.statementId}`);
  revalidatePath('/finance/general-ledger/journals');

  return {
    ok: true,
    data: { journalId: `jnl-${Date.now()}` },
  };
}

// ─── Exclude Transaction ─────────────────────────────────────────────────────

export async function excludeTransactions(params: {
  bankTransactionIds: string[];
  statementId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  console.log('Excluding transactions:', params);

  revalidatePath(`/finance/banking/reconcile/${params.statementId}`);

  return { ok: true };
}

// ─── Include Transaction (undo exclude) ──────────────────────────────────────

export async function includeTransactions(params: {
  bankTransactionIds: string[];
  statementId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  console.log('Including transactions:', params);

  revalidatePath(`/finance/banking/reconcile/${params.statementId}`);

  return { ok: true };
}

// ─── Auto-Match Transactions ─────────────────────────────────────────────────

export async function autoMatchTransactions(params: {
  statementId: string;
  confidenceThreshold: 'high' | 'medium' | 'low';
}): Promise<{ ok: true; data: { matchedCount: number } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Auto-matching transactions:', params);

  revalidatePath(`/finance/banking/reconcile/${params.statementId}`);

  return {
    ok: true,
    data: { matchedCount: Math.floor(Math.random() * 20) + 10 },
  };
}

// ─── Complete Reconciliation ─────────────────────────────────────────────────

export async function completeReconciliation(params: {
  statementId: string;
  adjustmentEntries?: Array<{
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description: string;
  }>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Completing reconciliation:', params);

  revalidatePath('/finance/banking');
  revalidatePath('/finance/banking/statements');
  revalidatePath(`/finance/banking/reconcile/${params.statementId}`);

  return { ok: true };
}

// ─── Update Transaction Match Status ─────────────────────────────────────────

export async function updateTransactionMatchStatus(params: {
  bankTransactionId: string;
  statementId: string;
  matchStatus: MatchStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));

  console.log('Updating transaction match status:', params);

  revalidatePath(`/finance/banking/reconcile/${params.statementId}`);

  return { ok: true };
}

// ─── Bulk Action ─────────────────────────────────────────────────────────────

export async function bulkReconciliationAction(params: {
  action: ReconciliationAction;
  bankTransactionIds: string[];
  statementId: string;
  glTransactionIds?: string[];
  reason?: string;
}): Promise<{ ok: true; data: { affectedCount: number } } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));

  console.log('Bulk reconciliation action:', params);

  revalidatePath(`/finance/banking/reconcile/${params.statementId}`);

  return {
    ok: true,
    data: { affectedCount: params.bankTransactionIds.length },
  };
}
