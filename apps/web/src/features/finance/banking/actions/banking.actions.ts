'use server';

import type { IdParam } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import type { MatchStatus, ReconciliationAction } from '../types';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { routes } from '@/lib/constants';

// ─── Import Statement ────────────────────────────────────────────────────────

export async function importStatement(
  formData: FormData
): Promise<
  | { ok: true; data: { statementId: IdParam['id']; transactionCount: number } }
  | { ok: false; error: string }
> {
  const file = formData.get('file') as File | null;
  const bankAccountId = formData.get('bankAccountId') as string;

  if (!file) {
    return { ok: false, error: 'No file provided' };
  }

  if (!bankAccountId) {
    return { ok: false, error: 'Bank account is required' };
  }

  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ statementId: string; transactionCount: number }>(
    '/bank-statements/import',
    formData
  );

  revalidatePath(routes.finance.banking);
  revalidatePath(routes.finance.bankStatementsList);

  if (!result.ok) return { ok: false, error: result.error.message };

  return { ok: true, data: result.value };
}

// ─── Match Transactions ──────────────────────────────────────────────────────

export async function matchTransactions(params: {
  bankTransactionIds: string[];
  glTransactionIds: string[];
  statementId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post(`/bank-statements/${params.statementId}/match`, {
    bankTransactionIds: params.bankTransactionIds,
    glTransactionIds: params.glTransactionIds,
  });

  revalidatePath(routes.finance.bankReconciliationDetail(params.statementId));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

// ─── Unmatch Transactions ────────────────────────────────────────────────────

export async function unmatchTransactions(params: {
  bankTransactionIds: string[];
  statementId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post(`/bank-statements/${params.statementId}/unmatch`, {
    bankTransactionIds: params.bankTransactionIds,
  });

  revalidatePath(routes.finance.bankReconciliationDetail(params.statementId));

  if (!result.ok) return { ok: false, error: result.error.message };
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
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ journalId: string }>(
    `/bank-statements/transactions/${params.bankTransactionId}/journal`,
    {
      statementId: params.statementId,
      debitAccountId: params.debitAccountId,
      creditAccountId: params.creditAccountId,
      description: params.description,
      reference: params.reference,
    }
  );

  revalidatePath(routes.finance.bankReconciliationDetail(params.statementId));
  revalidatePath(routes.finance.journals);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}

// ─── Exclude Transaction ─────────────────────────────────────────────────────

export async function excludeTransactions(params: {
  bankTransactionIds: string[];
  statementId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post(`/bank-statements/${params.statementId}/exclude`, {
    bankTransactionIds: params.bankTransactionIds,
    reason: params.reason,
  });

  revalidatePath(routes.finance.bankReconciliationDetail(params.statementId));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

// ─── Include Transaction (undo exclude) ──────────────────────────────────────

export async function includeTransactions(params: {
  bankTransactionIds: string[];
  statementId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post(`/bank-statements/${params.statementId}/include`, {
    bankTransactionIds: params.bankTransactionIds,
  });

  revalidatePath(routes.finance.bankReconciliationDetail(params.statementId));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

// ─── Auto-Match Transactions ─────────────────────────────────────────────────

export async function autoMatchTransactions(params: {
  statementId: string;
  confidenceThreshold: 'high' | 'medium' | 'low';
}): Promise<{ ok: true; data: { matchedCount: number } } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ matchedCount: number }>(
    `/bank-statements/${params.statementId}/auto-match`,
    { confidenceThreshold: params.confidenceThreshold }
  );

  revalidatePath(routes.finance.bankReconciliationDetail(params.statementId));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
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
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  // Use the confirmed backend endpoint: POST /bank-reconciliations/:id/sign-off
  const result = await client.post(
    `/bank-reconciliations/${params.statementId}/sign-off`,
    { adjustmentEntries: params.adjustmentEntries }
  );

  revalidatePath(routes.finance.banking);
  revalidatePath(routes.finance.bankStatementsList);
  revalidatePath(routes.finance.bankReconciliationDetail(params.statementId));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

// ─── Update Transaction Match Status ─────────────────────────────────────────

export async function updateTransactionMatchStatus(params: {
  bankTransactionId: string;
  statementId: string;
  matchStatus: MatchStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.patch(
    `/bank-statements/transactions/${params.bankTransactionId}/match-status`,
    { matchStatus: params.matchStatus }
  );

  revalidatePath(routes.finance.bankReconciliationDetail(params.statementId));

  if (!result.ok) return { ok: false, error: result.error.message };
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
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const result = await client.post<{ affectedCount: number }>(
    `/bank-statements/${params.statementId}/bulk-action`,
    {
      action: params.action,
      bankTransactionIds: params.bankTransactionIds,
      glTransactionIds: params.glTransactionIds,
      reason: params.reason,
    }
  );

  revalidatePath(routes.finance.bankReconciliationDetail(params.statementId));

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
}
