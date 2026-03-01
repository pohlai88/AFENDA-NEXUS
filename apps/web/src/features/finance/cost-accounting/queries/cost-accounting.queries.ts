import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// â”€â”€â”€ View Models (what the UI receives from the API) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CostCenterListItem {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  level: number;
  status: string;
  managerId: string | null;
  managerName: string | null;
  companyId: string;
  currencyCode: string;
  budgetAmount: string;
  actualAmount: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
  children?: CostCenterListItem[];
}

export interface CostCenterDetail extends CostCenterListItem {
  description: string;
  parentCode: string | null;
  parentName: string | null;
  path: string[];
  type: string;
}

export interface CostDriverListItem {
  id: string;
  code: string;
  name: string;
  description: string;
  driverType: string;
  unitOfMeasure: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostDriverValueView {
  id: string;
  driverId: string;
  costCenterId: string;
  costCenterCode: string;
  costCenterName: string;
  period: string;
  value: number;
  percentage: number;
  updatedAt: string;
}

export interface AllocationRuleView {
  id: string;
  name: string;
  description: string;
  sourceCostCenterId: string;
  sourceCostCenterCode: string;
  sourceCostCenterName: string;
  driverId: string;
  driverCode: string;
  driverName: string;
  method: string;
  isActive: boolean;
  order: number;
  targets: Array<{
    costCenterId: string;
    costCenterCode: string;
    costCenterName: string;
    percentage: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AllocationRunView {
  id: string;
  runNumber: string;
  period: string;
  method: string;
  status: string;
  totalAllocated: string;
  currency: string;
  rulesApplied: number;
  costCentersAffected: number;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  initiatedBy: string;
  initiatedAt: string;
  completedAt: string | null;
  reversedAt: string | null;
  reversedBy: string | null;
}

export interface AllocationLineView {
  id: string;
  runId: string;
  ruleId: string;
  ruleName: string;
  fromCostCenterId: string;
  fromCostCenterCode: string;
  fromCostCenterName: string;
  toCostCenterId: string;
  toCostCenterCode: string;
  toCostCenterName: string;
  amount: string;
  percentage: number;
  driverValue: number;
}

export interface AllocationRunDetailView extends AllocationRunView {
  lines: AllocationLineView[];
}

export interface CostAccountingSummaryView {
  totalCostCenters: number;
  activeCostCenters: number;
  totalDrivers: number;
  totalRules: number;
  lastAllocationRun: string | null;
  totalAllocatedYTD: string;
  budgetVariancePercent: number;
  pendingAllocations: number;
}

// â”€â”€â”€ Request context type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Ctx = { tenantId: string; userId: string; token: string };

// â”€â”€â”€ Cost Center Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getCostCenters = cache(async (
  ctx: Ctx,
  params?: { status?: string; type?: string; parentId?: string; search?: string },
): Promise<ApiResult<{ data: CostCenterListItem[] }>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.type) query.type = params.type;
  if (params?.parentId) query.parentId = params.parentId;
  if (params?.search) query.search = params.search;

  return client.get<{ data: CostCenterListItem[] }>('/cost-accounting/cost-centers', query);
});

export const getCostCenterById = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<CostCenterDetail>> => {
  const client = createApiClient(ctx);
  return client.get<CostCenterDetail>(`/cost-accounting/cost-centers/${id}`);
});

export async function createCostCenter(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/cost-accounting/cost-centers', body);
}

export async function updateCostCenter(
  ctx: Ctx,
  id: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/cost-accounting/cost-centers/${id}`, body);
}

export async function updateCostCenterStatus(
  ctx: Ctx,
  id: string,
  status: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/cost-accounting/cost-centers/${id}/status`, { status });
}

export async function moveCostCenter(
  ctx: Ctx,
  id: string,
  newParentId: string | null,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/cost-accounting/cost-centers/${id}/move`, { parentId: newParentId });
}

// â”€â”€â”€ Cost Driver Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getCostDrivers = cache(async (
  ctx: Ctx,
): Promise<ApiResult<{ data: CostDriverListItem[] }>> => {
  const client = createApiClient(ctx);
  return client.get<{ data: CostDriverListItem[] }>('/cost-accounting/cost-drivers');
});

export async function createCostDriver(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/cost-accounting/cost-drivers', body);
}

export const getCostDriverValues = cache(async (
  ctx: Ctx,
  driverId: string,
  period: string,
): Promise<ApiResult<{ data: CostDriverValueView[] }>> => {
  const client = createApiClient(ctx);
  return client.get<{ data: CostDriverValueView[] }>(
    `/cost-accounting/cost-drivers/${driverId}/values`,
    { period },
  );
});

export async function updateDriverValues(
  ctx: Ctx,
  driverId: string,
  period: string,
  values: Array<{ costCenterId: string; value: number }>,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.put<CommandReceipt>(
    `/cost-accounting/cost-drivers/${driverId}/values`,
    { period, values },
  );
}

export async function deactivateDriver(
  ctx: Ctx,
  id: string,
  effectiveTo: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/cost-accounting/cost-drivers/${id}/deactivate`, { effectiveTo });
}

// â”€â”€â”€ Allocation Rule Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getAllocationRules = cache(async (
  ctx: Ctx,
): Promise<ApiResult<{ data: AllocationRuleView[] }>> => {
  const client = createApiClient(ctx);
  return client.get<{ data: AllocationRuleView[] }>('/cost-accounting/allocation-rules');
});

export async function createAllocationRule(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/cost-accounting/allocation-rules', body);
}

export async function updateAllocationRule(
  ctx: Ctx,
  ruleId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/cost-accounting/allocation-rules/${ruleId}`, body);
}

export async function toggleRuleActive(
  ctx: Ctx,
  ruleId: string,
  isActive: boolean,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/cost-accounting/allocation-rules/${ruleId}/toggle`, { isActive });
}

// â”€â”€â”€ Allocation Run Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getAllocationRuns = cache(async (
  ctx: Ctx,
  params?: { status?: string; period?: string },
): Promise<ApiResult<{ data: AllocationRunView[] }>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.period) query.period = params.period;

  return client.get<{ data: AllocationRunView[] }>('/cost-accounting/cost-allocation-runs', query);
});

export const getAllocationRunById = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<AllocationRunDetailView>> => {
  const client = createApiClient(ctx);
  return client.get<AllocationRunDetailView>(`/cost-accounting/cost-allocation-runs/${id}`);
});

export async function executeAllocationRun(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/cost-accounting/cost-allocation-runs', body);
}

export async function reverseAllocationRun(
  ctx: Ctx,
  runId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/cost-accounting/cost-allocation-runs/${runId}/reverse`, { reason });
}

export async function deleteAllocationRun(
  ctx: Ctx,
  runId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.delete<CommandReceipt>(`/cost-accounting/cost-allocation-runs/${runId}`);
}

// â”€â”€â”€ Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getCostAccountingSummary = cache(async (
  ctx: Ctx,
): Promise<ApiResult<CostAccountingSummaryView>> => {
  const client = createApiClient(ctx);
  return client.get<CostAccountingSummaryView>('/cost-accounting/summary');
});

// ─── Posting Preview Types ──────────────────────────────────────────────────

export interface PostingPreviewLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  description: string;
}

export interface PostingPreviewResult {
  ledgerName: string;
  periodName: string;
  currency: string;
  lines: PostingPreviewLine[];
  warnings: string[];
}

// ─── Preview Query ──────────────────────────────────────────────────────────

export async function previewCostAllocation(
  ctx: Ctx,
  body: {
    companyId: string;
    periodId: string;
    method: 'DIRECT' | 'STEP_DOWN' | 'RECIPROCAL';
    driverId: string;
    currencyCode?: string;
  }
): Promise<ApiResult<PostingPreviewResult>> {
  const client = createApiClient(ctx);
  return client.post<PostingPreviewResult>('/cost-allocation-runs/preview', body);
}

