import { createApiClient } from "@/lib/api-client";
import type { ApiResult, PaginatedResponse, CommandReceipt } from "@/lib/types";
import type { JournalStatus } from "@afenda/contracts";

// ─── View Models (what the UI receives from the API) ────────────────────────

export interface JournalListItem {
  id: string;
  documentNumber: string;
  description: string;
  status: JournalStatus;
  postingDate: string;
  totalDebit: string;
  totalCredit: string;
  currency: string;
  createdAt: string;
}

export interface JournalDetail {
  id: string;
  documentNumber: string;
  description: string;
  status: JournalStatus;
  postingDate: string;
  companyId: string;
  ledgerId: string;
  lines: JournalLineView[];
  totalDebit: string;
  totalCredit: string;
  currency: string;
  createdAt: string;
  postedAt?: string;
  reversedById?: string;
  voidedAt?: string;
  voidReason?: string;
}

export interface JournalLineView {
  id: string;
  accountCode: string;
  accountName?: string;
  description?: string;
  debit: string;
  credit: string;
  currency: string;
}

// ─── Query Functions (server-side, called from RSC pages) ───────────────────

export async function getJournals(
  ctx: { tenantId: string; userId: string; token: string },
  params: { periodId?: string; status?: string; page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<JournalListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.periodId) query.periodId = params.periodId;
  if (params.status) query.status = params.status;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  return client.get<PaginatedResponse<JournalListItem>>("/journals", query);
}

export async function getJournal(
  ctx: { tenantId: string; userId: string; token: string },
  id: string,
): Promise<ApiResult<JournalDetail>> {
  const client = createApiClient(ctx);
  return client.get<JournalDetail>(`/journals/${id}`);
}

export async function createJournal(
  ctx: { tenantId: string; userId: string; token: string },
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>("/journals", body);
}

export async function postJournal(
  ctx: { tenantId: string; userId: string; token: string },
  journalId: string,
  idempotencyKey: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/journals/${journalId}/post`, { idempotencyKey });
}

export async function reverseJournal(
  ctx: { tenantId: string; userId: string; token: string },
  journalId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/journals/${journalId}/reverse`, { reason });
}

export async function voidJournal(
  ctx: { tenantId: string; userId: string; token: string },
  journalId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/journals/${journalId}/void`, { reason });
}
