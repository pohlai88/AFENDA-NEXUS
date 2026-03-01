import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';

// --- Context type ------------------------------------------------------------

type Ctx = { tenantId: string; userId: string; token: string };

// --- View Models -------------------------------------------------------------

export interface ExpenseClaimListItem {
  id: string;
  claimNumber: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  status: string;
  totalAmount: number;
  currency: string;
  lineCount: number;
  submittedDate: string | null;
  createdAt: string;
}

export interface ExpenseLineView {
  id: string;
  expenseDate: string;
  category: string;
  description: string;
  merchantName: string;
  amount: number;
  currency: string;
  taxAmount: number;
  glAccountCode: string;
  costCenterCode: string | null;
  receiptAttached: boolean;
}

export interface ExpenseClaimDetail {
  id: string;
  claimNumber: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  description: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  lineCount: number;
  approvedAmount: number | null;
  approvedBy: string | null;
  approvedAt: string | null;
  paidDate: string | null;
  paymentReference: string | null;
  rejectionReason: string | null;
  submittedDate: string | null;
  periodFrom: string;
  periodTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePolicyView {
  id: string;
  name: string;
  description: string | null;
  categoryLimits: Record<string, number>;
  dailyLimit: number;
  monthlyLimit: number;
  requiresReceipt: boolean;
  receiptThreshold: number;
  requiresPreApproval: boolean;
  preApprovalThreshold: number;
  allowedCurrencies: string[];
  isDefault: boolean;
}

// --- Query Functions ---------------------------------------------------------

export const getExpenseClaims = cache(async (
  ctx: Ctx,
  params: { status?: string; page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<ExpenseClaimListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<ExpenseClaimListItem>>('/expense-claims', query);
});

export interface ExpenseSummary {
  totalClaims: number;
  pendingClaims: number;
  approvedThisMonth: number;
  pendingAmount: number;
  approvedAmount: number;
  paidThisMonth: number;
  rejectionRate: number;
  averageProcessingDays: number;
}

export const getExpenseSummary = cache(async (
  ctx: Ctx,
): Promise<ApiResult<ExpenseSummary>> => {
  const client = createApiClient(ctx);
  return client.get<ExpenseSummary>('/expense-claims/summary');
});

export const getExpenseClaim = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<ExpenseClaimDetail>> => {
  const client = createApiClient(ctx);
  return client.get<ExpenseClaimDetail>(`/expense-claims/${id}`);
});

export const getExpenseLines = cache(async (
  ctx: Ctx,
  claimId: string,
): Promise<ApiResult<{ data: ExpenseLineView[] }>> => {
  const client = createApiClient(ctx);
  return client.get<{ data: ExpenseLineView[] }>(`/expense-claims/${claimId}/lines`);
});

export const getExpensePolicies = cache(async (
  ctx: Ctx,
): Promise<ApiResult<{ data: ExpensePolicyView[] }>> => {
  const client = createApiClient(ctx);
  return client.get<{ data: ExpensePolicyView[] }>('/expense-policies');
});

/** Get the default (or first available) expense policy for new claims. */
export const getExpensePolicy = cache(async (
  ctx: Ctx,
): Promise<ApiResult<ExpensePolicyView>> => {
  const client = createApiClient(ctx);
  const result = await client.get<{ data: ExpensePolicyView[] }>('/expense-policies');
  if (!result.ok) return result;
  const defaultPolicy = result.value.data.find((p) => p.isDefault) ?? result.value.data[0];
  if (!defaultPolicy) return { ok: false, error: { code: 'NOT_FOUND', message: 'No expense policy configured', statusCode: 404 } };
  return { ok: true, value: defaultPolicy };
});

// --- Command Functions -------------------------------------------------------

export async function submitExpenseClaim(
  ctx: Ctx,
  claimId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/expense-claims/${claimId}/submit`, {});
}