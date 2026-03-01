'use server';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { CreateIcTransaction } from '@afenda/contracts';
import type { ApiResult, CommandReceipt, AuditEntry } from '@/lib/types';
import {
  previewIcTransaction as previewQ,
  type IcTransactionPreviewResult,
} from '../queries/ic.queries';

// ─── IC Transaction Mutations ───────────────────────────────────────────────

export async function createIcTransactionAction(
  data: CreateIcTransaction
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ic-transactions', data);
}

export async function settleIcTransactionAction(
  transactionId: string,
  settlementData: {
    sellerCompanyId: string;
    buyerCompanyId: string;
    documentIds: string[];
    settlementMethod: 'NETTING' | 'CASH' | 'JOURNAL';
    settlementAmount: string;
    currency: string;
    fxGainLoss: string;
    reason?: string;
  }
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ic-transactions/${transactionId}/settle`, settlementData);
}

// ─── Queries (callable from server components via action) ───────────────────

export async function getIcTransactionAuditAction(
  transactionId: string
): Promise<ApiResult<AuditEntry[]>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.get<AuditEntry[]>(`/ic-transactions/${transactionId}/audit`);
}

// ─── Preview Action ─────────────────────────────────────────────────────────

export async function previewIcTransactionAction(
  body: Record<string, unknown>
): Promise<ApiResult<IcTransactionPreviewResult>> {
  const ctx = await getRequestContext();
  return previewQ(ctx, body);
}
