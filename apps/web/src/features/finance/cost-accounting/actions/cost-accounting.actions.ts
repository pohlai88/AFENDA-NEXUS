'use server';

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import {
  createCostCenter,
  updateCostCenter,
  updateCostCenterStatus,
  moveCostCenter,
  createCostDriver,
  updateDriverValues as updateDriverValuesQuery,
  deactivateDriver as deactivateDriverQuery,
  createAllocationRule,
  updateAllocationRule as updateAllocationRuleQuery,
  toggleRuleActive as toggleRuleActiveQuery,
  executeAllocationRun,
  reverseAllocationRun as reverseAllocationRunQuery,
  deleteAllocationRun as deleteAllocationRunQuery,
  previewCostAllocation as previewCostAllocationQuery,
  type PostingPreviewResult,
} from '../queries/cost-accounting.queries';
import type { CreateCostCenterInput, UpdateCostCenterInput, CreateDriverInput, CreateRuleInput, CreateAllocationRunInput } from '@afenda/contracts';
import type { ApiResult, CommandReceipt, AuditEntry } from '@/lib/types';
import { routes } from '@/lib/constants';

// â”€â”€â”€ Cost Center Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createCostCenterAction(
  data: CreateCostCenterInput,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await createCostCenter(ctx, data);
  if (result.ok) revalidatePath(routes.finance.costCenters);
  return result;
}

export async function updateCostCenterAction(
  id: string,
  data: Partial<UpdateCostCenterInput>,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await updateCostCenter(ctx, id, data);
  if (result.ok) {
    revalidatePath(routes.finance.costCenters);
    revalidatePath(routes.finance.costCenterDetail(id));
  }
  return result;
}

export async function updateCostCenterStatusAction(
  id: string,
  status: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await updateCostCenterStatus(ctx, id, status);
  if (result.ok) revalidatePath(routes.finance.costCenters);
  return result;
}

export async function moveCostCenterAction(
  id: string,
  newParentId: string | null,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await moveCostCenter(ctx, id, newParentId);
  if (result.ok) revalidatePath(routes.finance.costCenters);
  return result;
}

// â”€â”€â”€ Cost Driver Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createCostDriverAction(
  data: CreateDriverInput,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await createCostDriver(ctx, data);
  if (result.ok) revalidatePath(routes.finance.costDrivers);
  return result;
}

export async function updateDriverValuesAction(
  driverId: string,
  period: string,
  values: Array<{ costCenterId: string; value: number }>,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await updateDriverValuesQuery(ctx, driverId, period, values);
  if (result.ok) revalidatePath(routes.finance.costDrivers);
  return result;
}

export async function deactivateDriverAction(
  id: string,
  effectiveTo: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await deactivateDriverQuery(ctx, id, effectiveTo);
  if (result.ok) revalidatePath(routes.finance.costDrivers);
  return result;
}

// â”€â”€â”€ Allocation Rule Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createAllocationRuleAction(
  data: CreateRuleInput,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await createAllocationRule(ctx, data);
  if (result.ok) revalidatePath(routes.finance.costCenters);
  return result;
}

export async function updateAllocationRuleAction(
  ruleId: string,
  updates: Partial<CreateRuleInput>,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await updateAllocationRuleQuery(ctx, ruleId, updates);
  if (result.ok) revalidatePath(routes.finance.costCenters);
  return result;
}

export async function toggleRuleActiveAction(
  ruleId: string,
  isActive: boolean,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await toggleRuleActiveQuery(ctx, ruleId, isActive);
  if (result.ok) revalidatePath(routes.finance.costCenters);
  return result;
}

// â”€â”€â”€ Allocation Run Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function executeAllocationRunAction(
  data: CreateAllocationRunInput,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await executeAllocationRun(ctx, data);
  if (result.ok) {
    revalidatePath(routes.finance.costCenters);
    revalidatePath(routes.finance.journals);
  }
  return result;
}

export async function reverseAllocationRunAction(
  runId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await reverseAllocationRunQuery(ctx, runId, reason);
  if (result.ok) {
    revalidatePath(routes.finance.costCenters);
    revalidatePath(routes.finance.journals);
  }
  return result;
}

export async function deleteAllocationRunAction(
  runId: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await deleteAllocationRunQuery(ctx, runId);
  if (result.ok) revalidatePath(routes.finance.costCenters);
  return result;
}

// ─── Queries (called from server components via actions) ─────────────────────

export const getCostCenterAuditAction = cache(async (
  costCenterId: string,
): Promise<ApiResult<AuditEntry[]>> => {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.get<AuditEntry[]>(`/cost-accounting/cost-centers/${costCenterId}/audit`);
});

// ─── Preview Action ─────────────────────────────────────────────────────────

export async function previewCostAllocationAction(
  body: {
    companyId: string;
    periodId: string;
    method: 'DIRECT' | 'STEP_DOWN' | 'RECIPROCAL';
    driverId: string;
    currencyCode?: string;
  }
): Promise<ApiResult<PostingPreviewResult>> {
  const ctx = await getRequestContext();
  return previewCostAllocationQuery(ctx, body);
}
