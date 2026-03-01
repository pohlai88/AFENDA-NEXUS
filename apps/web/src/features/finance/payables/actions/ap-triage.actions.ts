'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import { routes } from '@/lib/constants';

export async function markInvoiceIncompleteAction(
  invoiceId: string,
  reason: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<CommandReceipt>(
    `/ap/invoices/${invoiceId}/mark-incomplete`,
    { reason }
  );
  if (result.ok) {
    revalidatePath(routes.finance.triage);
    revalidatePath(routes.finance.payables);
    revalidatePath(routes.finance.payableDetail(invoiceId));
  }
  return result;
}

export async function resolveTriageAction(
  invoiceId: string,
  targetStatus: 'DRAFT' | 'PENDING_APPROVAL'
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<CommandReceipt>(
    `/ap/invoices/${invoiceId}/resolve-triage`,
    { targetStatus }
  );
  if (result.ok) {
    revalidatePath(routes.finance.triage);
    revalidatePath(routes.finance.payables);
    revalidatePath(routes.finance.payableDetail(invoiceId));
  }
  return result;
}
