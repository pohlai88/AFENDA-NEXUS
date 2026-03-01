'use server';

import type {
  IdParam,
  CreateProjectInput,
  UpdateProjectInput,
  AddCostInput,
  CreateBillingInput,
  CreateMilestoneInput,
  BillingWizardInput,
} from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import { routes } from '@/lib/constants';
import { createApiClient } from '@/lib/api-client';
import { getRequestContext } from '@/lib/auth';

// ─── Project Actions ─────────────────────────────────────────────────────────

export async function createProject(
  input: CreateProjectInput
): Promise<{ ok: true; projectId: IdParam['id'] } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post('/projects', input);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projects);
  return { ok: true, projectId: (res.value as { id: string }).id };
}

export async function updateProject(
  input: UpdateProjectInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.patch(`/projects/${input.id}`, input);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projects);
  revalidatePath(routes.finance.projectDetail(input.id));
  return { ok: true };
}

export async function updateProjectStatus(
  id: string,
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.patch(`/projects/${id}`, { status });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projects);
  revalidatePath(routes.finance.projectDetail(id));
  return { ok: true };
}

// ─── Cost Actions ────────────────────────────────────────────────────────────

export async function addProjectCost(
  input: AddCostInput
): Promise<{ ok: true; costId: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/projects/${input.projectId}/costs`, input);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projectDetail(input.projectId));
  return { ok: true, costId: (res.value as { id: string }).id };
}

export async function updateProjectCost(
  costId: string,
  updates: Partial<AddCostInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.patch(`/projects/costs/${costId}`, updates);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projects);
  return { ok: true };
}

export async function deleteProjectCost(
  costId: string,
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.delete(`/projects/costs/${costId}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projectDetail(projectId));
  return { ok: true };
}

// ─── Billing Actions ─────────────────────────────────────────────────────────

export async function createProjectBilling(
  input: CreateBillingInput
): Promise<{ ok: true; billingId: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/projects/${input.projectId}/billings`, input);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projectDetail(input.projectId));
  return { ok: true, billingId: (res.value as { id: string }).id };
}

export async function convertBillingToInvoice(
  billingId: string,
  projectId: string
): Promise<{ ok: true; invoiceId: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/projects/billings/${billingId}/convert-to-invoice`, {});
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projectDetail(projectId));
  revalidatePath(routes.finance.receivables);
  return { ok: true, invoiceId: (res.value as { invoiceId: string }).invoiceId };
}

export async function cancelBilling(
  billingId: string,
  projectId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/projects/billings/${billingId}/cancel`, { reason });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projectDetail(projectId));
  return { ok: true };
}

// ─── Milestone Actions ───────────────────────────────────────────────────────

export async function createMilestone(
  input: CreateMilestoneInput
): Promise<{ ok: true; milestoneId: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/projects/${input.projectId}/milestones`, input);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projectDetail(input.projectId));
  return { ok: true, milestoneId: (res.value as { id: string }).id };
}

export async function completeMilestone(
  milestoneId: string,
  projectId: string,
  completedDate: Date
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/projects/milestones/${milestoneId}/complete`, { completedDate });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projectDetail(projectId));
  return { ok: true };
}

// ─── WIP Actions ─────────────────────────────────────────────────────────────

export async function calculateWIP(
  projectId: string
): Promise<{ ok: true; wipAmount: number } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/projects/${projectId}/wip/calculate`, {});
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projectDetail(projectId));
  return { ok: true, wipAmount: (res.value as { wipAmount: number }).wipAmount };
}

export async function postWIPJournalEntry(
  projectId: string,
  periodEnd: Date
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/projects/${projectId}/wip/post-journal`, { periodEnd });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projectDetail(projectId));
  revalidatePath(routes.finance.journals);
  return { ok: true, journalId: (res.value as { journalId: string }).journalId };
}

// ─── Billing Wizard Actions ──────────────────────────────────────────────────

export async function generateBillingPreview(input: BillingWizardInput): Promise<
  | {
      ok: true;
      preview: {
        lineItems: Array<{ description: string; amount: number }>;
        totalAmount: number;
        taxes: number;
        grandTotal: number;
      };
    }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/projects/${input.projectId}/billing-preview`, input);
  if (!res.ok) return { ok: false, error: res.error.message };
  return {
    ok: true,
    preview: res.value as {
      lineItems: Array<{ description: string; amount: number }>;
      totalAmount: number;
      taxes: number;
      grandTotal: number;
    },
  };
}

export async function submitBillingWizard(input: BillingWizardInput): Promise<
  | {
      ok: true;
      billingId: string;
      invoiceId?: string;
    }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post(`/projects/${input.projectId}/billing-wizard`, input);
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projectDetail(input.projectId));
  revalidatePath(routes.finance.receivables);
  return { ok: true, ...(res.value as { billingId: string; invoiceId?: string }) };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkUpdateProjectStatus(
  projectIds: string[],
  status: 'active' | 'on_hold' | 'cancelled'
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post('/projects/bulk/update-status', { projectIds, status });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projects);
  return { ok: true, updated: (res.value as { updated: number }).updated };
}

export async function bulkCalculateWIP(projectIds: string[]): Promise<
  | {
      ok: true;
      results: Array<{ projectId: string; wipAmount: number }>;
    }
  | { ok: false; error: string }
> {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const res = await api.post('/projects/bulk/calculate-wip', { projectIds });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath(routes.finance.projects);
  return { ok: true, results: (res.value as { results: Array<{ projectId: string; wipAmount: number }> }).results };
}
