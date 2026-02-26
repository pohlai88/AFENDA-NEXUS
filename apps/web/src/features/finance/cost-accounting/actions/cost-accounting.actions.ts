'use server';

import { revalidatePath } from 'next/cache';
import type {
  CostCenterType,
  CostCenterStatus,
  DriverType,
  AllocationMethod,
  AllocationTarget,
} from '../types';

// ─── Cost Center Actions ─────────────────────────────────────────────────────

interface CreateCostCenterInput {
  code: string;
  name: string;
  description: string;
  type: CostCenterType;
  parentId?: string;
  managerId?: string;
  budgetAmount: number;
  currency: string;
}

export async function createCostCenter(
  input: CreateCostCenterInput
): Promise<{ ok: true; costCenterId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createCostCenter:', input);
  revalidatePath('/finance/cost-centers');
  return { ok: true, costCenterId: 'cc-new-' + Date.now() };
}

interface UpdateCostCenterInput {
  id: string;
  name?: string;
  description?: string;
  managerId?: string;
  budgetAmount?: number;
}

export async function updateCostCenter(
  input: UpdateCostCenterInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));
  console.log('[Action] updateCostCenter:', input);
  revalidatePath('/finance/cost-centers');
  revalidatePath(`/finance/cost-centers/${input.id}`);
  return { ok: true };
}

export async function updateCostCenterStatus(
  id: string,
  status: CostCenterStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] updateCostCenterStatus:', id, status);
  revalidatePath('/finance/cost-centers');
  return { ok: true };
}

export async function moveCostCenter(
  id: string,
  newParentId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));
  console.log('[Action] moveCostCenter:', id, 'to parent:', newParentId);
  revalidatePath('/finance/cost-centers');
  return { ok: true };
}

// ─── Cost Driver Actions ─────────────────────────────────────────────────────

interface CreateDriverInput {
  code: string;
  name: string;
  description: string;
  type: DriverType;
  unit: string;
  effectiveFrom: Date;
}

export async function createCostDriver(
  input: CreateDriverInput
): Promise<{ ok: true; driverId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createCostDriver:', input);
  revalidatePath('/finance/cost-centers');
  return { ok: true, driverId: 'drv-new-' + Date.now() };
}

export async function updateDriverValues(
  driverId: string,
  period: string,
  values: Array<{ costCenterId: string; value: number }>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] updateDriverValues:', driverId, period, values);
  revalidatePath('/finance/cost-centers');
  return { ok: true };
}

export async function deactivateDriver(
  id: string,
  effectiveTo: Date
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] deactivateDriver:', id, effectiveTo);
  revalidatePath('/finance/cost-centers');
  return { ok: true };
}

// ─── Allocation Rule Actions ─────────────────────────────────────────────────

interface CreateRuleInput {
  name: string;
  description: string;
  sourceCostCenterId: string;
  driverId: string;
  method: AllocationMethod;
  targets: AllocationTarget[];
}

export async function createAllocationRule(
  input: CreateRuleInput
): Promise<{ ok: true; ruleId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createAllocationRule:', input);
  revalidatePath('/finance/cost-centers');
  return { ok: true, ruleId: 'rule-new-' + Date.now() };
}

export async function updateAllocationRule(
  ruleId: string,
  updates: Partial<CreateRuleInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));
  console.log('[Action] updateAllocationRule:', ruleId, updates);
  revalidatePath('/finance/cost-centers');
  return { ok: true };
}

export async function toggleRuleActive(
  ruleId: string,
  isActive: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));
  console.log('[Action] toggleRuleActive:', ruleId, isActive);
  revalidatePath('/finance/cost-centers');
  return { ok: true };
}

export async function reorderRules(
  ruleIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] reorderRules:', ruleIds);
  revalidatePath('/finance/cost-centers');
  return { ok: true };
}

// ─── Allocation Run Actions ──────────────────────────────────────────────────

interface CreateAllocationRunInput {
  period: string;
  method: AllocationMethod;
  ruleIds?: string[];
}

export async function createAllocationRun(
  input: CreateAllocationRunInput
): Promise<{ ok: true; runId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createAllocationRun:', input);
  revalidatePath('/finance/cost-centers');
  return { ok: true, runId: 'run-new-' + Date.now() };
}

export async function calculateAllocation(
  runId: string
): Promise<{
  ok: true;
  preview: {
    totalAllocated: number;
    rulesApplied: number;
    costCentersAffected: number;
    allocations: Array<{
      from: string;
      to: string;
      amount: number;
    }>;
  };
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] calculateAllocation:', runId);

  return {
    ok: true,
    preview: {
      totalAllocated: 485000,
      rulesApplied: 2,
      costCentersAffected: 5,
      allocations: [
        { from: 'IT', to: 'FIN', amount: 97500 },
        { from: 'IT', to: 'HR', amount: 45000 },
        { from: 'IT', to: 'SALES', amount: 232500 },
        { from: 'HR', to: 'FIN', amount: 28500 },
        { from: 'HR', to: 'IT', amount: 52500 },
        { from: 'HR', to: 'SALES', amount: 69000 },
      ],
    },
  };
}

export async function executeAllocationRun(
  runId: string
): Promise<{ ok: true; journalEntryId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));
  console.log('[Action] executeAllocationRun:', runId);
  revalidatePath('/finance/cost-centers');
  revalidatePath('/finance/journal');
  return { ok: true, journalEntryId: 'je-alloc-' + Date.now() };
}

export async function reverseAllocationRun(
  runId: string,
  reason: string
): Promise<{ ok: true; reversalJournalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] reverseAllocationRun:', runId, reason);
  revalidatePath('/finance/cost-centers');
  revalidatePath('/finance/journal');
  return { ok: true, reversalJournalId: 'je-rev-' + Date.now() };
}

export async function deleteAllocationRun(
  runId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] deleteAllocationRun:', runId);
  revalidatePath('/finance/cost-centers');
  return { ok: true };
}
