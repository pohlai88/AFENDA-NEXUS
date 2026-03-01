import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApprovalItem, ApprovalStats, ApprovalPolicy } from '../types';

// ─── Query Functions ─────────────────────────────────────────────────────────

type RequestCtx = { tenantId: string; userId: string; token: string };

export interface GetApprovalsParams {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  documentType?: string;
  slaStatus?: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  page?: number;
  limit?: number;
}

export const getApprovals = cache(async (ctx: RequestCtx, params: GetApprovalsParams = {}) => {
  const { status = 'PENDING', documentType, slaStatus, page = 1, limit = 20 } = params;
  const client = createApiClient(ctx);

  const query: Record<string, string> = {};
  if (status && status !== 'ALL') query.status = status;
  if (documentType) query.documentType = documentType;
  if (slaStatus) query.slaStatus = slaStatus;
  if (page) query.page = String(page);
  if (limit) query.limit = String(limit);

  const result = await client.get<ApprovalItem[]>('/approvals/pending', query);

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  const items = result.value;
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return {
    ok: true as const,
    data: {
      items: paged,
      total,
      page,
      limit,
      totalPages,
    },
  };
});

export const getApprovalStats = cache(async (ctx: RequestCtx) => {
  const client = createApiClient(ctx);
  const result = await client.get<ApprovalItem[]>('/approvals/pending');

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  const items = result.value;

  const stats: ApprovalStats = {
    pending: items.filter((i) => i.status === 'PENDING').length,
    dueToday: items.filter(
      (i) => i.dueAt && new Date(i.dueAt).toDateString() === new Date().toDateString()
    ).length,
    atRisk: items.filter((i) => i.slaStatus === 'AT_RISK').length,
    breached: items.filter((i) => i.slaStatus === 'BREACHED').length,
    approvedThisWeek: 0,
    rejectedThisWeek: 0,
  };

  return { ok: true as const, data: stats };
});

export const getApprovalPolicies = cache(async (ctx: RequestCtx) => {
  const client = createApiClient(ctx);
  // The backend endpoint accepts entityType as a path param, but listing all requires iterating
  // We fetch a common entity type to get policies
  const result = await client.get<ApprovalPolicy[]>('/approval-policies/AP_INVOICE');

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return { ok: true as const, data: result.value };
});

export const getApprovalById = cache(async (ctx: RequestCtx, id: string) => {
  const client = createApiClient(ctx);
  const result = await client.get<ApprovalItem[]>('/approvals/pending');

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  const item = result.value.find((a) => a.id === id);

  if (!item) {
    return { ok: false as const, error: 'Approval not found' };
  }

  return { ok: true as const, data: item };
});

export const getPendingApprovalCount = cache(async (ctx: RequestCtx) => {
  const client = createApiClient(ctx);
  const result = await client.get<ApprovalItem[]>('/approvals/pending');

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return {
    ok: true as const,
    data: result.value.filter((a) => a.status === 'PENDING').length,
  };
});
