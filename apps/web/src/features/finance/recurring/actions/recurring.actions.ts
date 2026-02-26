'use server';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { CreateRecurringTemplate } from '@afenda/contracts';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function createRecurringTemplateAction(
  data: CreateRecurringTemplate
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/recurring-templates', data);
}

export async function processTemplateAction(
  templateId: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/recurring-templates/${templateId}/process`);
}

export async function toggleTemplateAction(
  templateId: string,
  isActive: boolean
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/recurring-templates/${templateId}`, { isActive });
}
