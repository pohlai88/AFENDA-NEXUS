'use server';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { CreateCreditMemo, CreateDebitMemo } from '@afenda/contracts';
import type { ApiResult, CommandReceipt } from '@/lib/types';

export async function createCreditMemoAction(
  data: CreateCreditMemo,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ap/credit-memos', data);
}

export async function createDebitMemoAction(
  data: CreateDebitMemo,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ap/debit-memos', data);
}

export async function batchImportInvoicesAction(
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ap/invoices/import', body);
}

export async function reconcileSupplierStatementAction(
  body: unknown,
): Promise<ApiResult<{ matched: number; unmatched: number; details: string }>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<{ matched: number; unmatched: number; details: string }>('/ap/supplier-recon', body);
}
