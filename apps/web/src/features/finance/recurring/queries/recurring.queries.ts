import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';
import type { RecurringFrequency } from '@afenda/contracts';

// ─── View Models ────────────────────────────────────────────────────────────

export interface RecurringTemplateLine {
  accountCode: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface RecurringTemplateListItem {
  id: string;
  companyId: string;
  companyName?: string;
  ledgerId: string;
  description: string;
  frequency: RecurringFrequency;
  nextRunDate: string;
  isActive: boolean;
  lineCount: number;
  createdAt: string;
}

export interface RecurringTemplateDetail {
  id: string;
  companyId: string;
  companyName?: string;
  ledgerId: string;
  ledgerName?: string;
  description: string;
  frequency: RecurringFrequency;
  nextRunDate: string;
  isActive: boolean;
  lines: RecurringTemplateLine[];
  createdAt: string;
}

// ─── Query Functions ────────────────────────────────────────────────────────

type RequestCtx = { tenantId: string; userId: string; token: string };

export const getRecurringTemplates = cache(async (
  ctx: RequestCtx,
  params: { page?: string; limit?: string; active?: string }
): Promise<ApiResult<PaginatedResponse<RecurringTemplateListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.active) query.active = params.active;

  return client.get<PaginatedResponse<RecurringTemplateListItem>>('/recurring-templates', query);
});

export const getRecurringTemplate = cache(async (
  ctx: RequestCtx,
  id: string
): Promise<ApiResult<RecurringTemplateDetail>> => {
  const client = createApiClient(ctx);
  return client.get<RecurringTemplateDetail>(`/recurring-templates/${id}`);
});

export async function createRecurringTemplate(
  ctx: RequestCtx,
  body: unknown
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/recurring-templates', body);
}

export async function processRecurringTemplate(
  ctx: RequestCtx,
  id: string
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/recurring-templates/${id}/process`);
}
