import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type {
  BankAccount,
  BankStatement,
  BankTransaction,
  GLTransaction,
  MatchSuggestion,
  ReconciliationSession,
} from '../types';

type RequestCtx = { tenantId: string; userId: string; token: string };

// ─── Query Functions ─────────────────────────────────────────────────────────

export const getBankAccounts = cache(async (
  ctx: RequestCtx
): Promise<{ ok: true; data: BankAccount[] } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const result = await client.get<BankAccount[]>('/bank-accounts');
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getBankAccountById = cache(async (
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: BankAccount } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const result = await client.get<BankAccount>(`/bank-accounts/${id}`);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getBankStatements = cache(async (
  ctx: RequestCtx,
  params?: {
    bankAccountId?: string;
    status?: string;
    page?: number;
    perPage?: number;
  }
): Promise<
  | {
      ok: true;
      data: BankStatement[];
      pagination: { page: number; perPage: number; total: number; totalPages: number };
    }
  | { ok: false; error: string }
> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.bankAccountId) query.bankAccountId = params.bankAccountId;
  if (params?.status) query.status = params.status;
  if (params?.page) query.page = String(params.page);
  if (params?.perPage) query.perPage = String(params.perPage);

  const result = await client.get<{
    items: BankStatement[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }>('/bank-statements', query);

  if (!result.ok) return { ok: false, error: result.error.message };

  const { items, total, page, perPage, totalPages } = result.value;
  return {
    ok: true,
    data: items,
    pagination: { page, perPage, total, totalPages },
  };
});

export const getBankStatementById = cache(async (
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: BankStatement } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const result = await client.get<BankStatement>(`/bank-statements/${id}`);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getBankTransactions = cache(async (
  ctx: RequestCtx,
  params: {
    statementId: string;
    matchStatus?: string;
    type?: string;
    search?: string;
  }
): Promise<{ ok: true; data: BankTransaction[] } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.matchStatus) query.matchStatus = params.matchStatus;
  if (params.type) query.type = params.type;
  if (params.search) query.search = params.search;

  const result = await client.get<BankTransaction[]>(
    `/bank-statements/${params.statementId}/lines`,
    query
  );
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getGLTransactions = cache(async (
  ctx: RequestCtx,
  params: {
    bankAccountId: string;
    fromDate?: Date;
    toDate?: Date;
    unreconciledOnly?: boolean;
  }
): Promise<{ ok: true; data: GLTransaction[] } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.fromDate) query.fromDate = params.fromDate.toISOString();
  if (params.toDate) query.toDate = params.toDate.toISOString();
  if (params.unreconciledOnly) query.unreconciledOnly = 'true';

  const result = await client.get<GLTransaction[]>(
    `/bank-accounts/${params.bankAccountId}/gl-transactions`,
    query
  );
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getMatchSuggestions = cache(async (
  ctx: RequestCtx,
  params: {
    statementId: string;
    bankTransactionId?: string;
  }
): Promise<{ ok: true; data: MatchSuggestion[] } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.bankTransactionId) query.bankTransactionId = params.bankTransactionId;

  const result = await client.get<MatchSuggestion[]>(
    `/bank-statements/${params.statementId}/match-suggestions`,
    query
  );
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, data: result.value };
});

export const getReconciliationSession = cache(async (
  ctx: RequestCtx,
  statementId: string
): Promise<{ ok: true; data: ReconciliationSession } | { ok: false; error: string }> => {
  const client = createApiClient(ctx);
  const result = await client.get<ReconciliationSession[]>('/bank-reconciliations', {
    statementId,
  });

  if (!result.ok) return { ok: false, error: result.error.message };

  const sessions = result.value;
  if (!sessions.length) return { ok: false, error: 'No reconciliation session found for this statement' };
  const session = sessions[0];
  if (!session) return { ok: false, error: 'No reconciliation session found for this statement' };
  return { ok: true, data: session };
});

export const getReconciliationStats = cache(async (
  ctx: RequestCtx,
  bankAccountId?: string
): Promise<
  | {
      ok: true;
      data: {
        pendingStatements: number;
        inProgressStatements: number;
        unreconciledDays: number;
        lastReconciledDate: Date | null;
        totalUnmatchedItems: number;
      };
    }
  | { ok: false; error: string }
> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (bankAccountId) query.bankAccountId = bankAccountId;

  const result = await client.get<{
    pendingStatements: number;
    inProgressStatements: number;
    unreconciledDays: number;
    lastReconciledDate: string | null;
    totalUnmatchedItems: number;
  }>('/bank-reconciliations/stats', query);

  if (!result.ok) return { ok: false, error: result.error.message };

  return {
    ok: true,
    data: {
      ...result.value,
      lastReconciledDate: result.value.lastReconciledDate
        ? new Date(result.value.lastReconciledDate)
        : null,
    },
  };
});
