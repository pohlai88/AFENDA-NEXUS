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

// ─── Project Actions ─────────────────────────────────────────────────────────

export async function createProject(
  input: CreateProjectInput
): Promise<{ ok: true; projectId: IdParam['id'] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] createProject:', input);
  revalidatePath(routes.finance.projects);
  return { ok: true, projectId: 'proj-new-' + Date.now() };
}

export async function updateProject(
  input: UpdateProjectInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] updateProject:', input);
  revalidatePath(routes.finance.projects);
  revalidatePath(routes.finance.projectDetail(input.id));
  return { ok: true };
}

export async function updateProjectStatus(
  id: string,
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] updateProjectStatus:', id, status);
  revalidatePath(routes.finance.projects);
  revalidatePath(routes.finance.projectDetail(id));
  return { ok: true };
}

// ─── Cost Actions ────────────────────────────────────────────────────────────

export async function addProjectCost(
  input: AddCostInput
): Promise<{ ok: true; costId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] addProjectCost:', input);
  revalidatePath(routes.finance.projectDetail(input.projectId));
  return { ok: true, costId: 'cost-new-' + Date.now() };
}

export async function updateProjectCost(
  costId: string,
  updates: Partial<AddCostInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] updateProjectCost:', costId, updates);
  revalidatePath(routes.finance.projects);
  return { ok: true };
}

export async function deleteProjectCost(
  costId: string,
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  console.log('[Action] deleteProjectCost:', costId);
  revalidatePath(routes.finance.projectDetail(projectId));
  return { ok: true };
}

// ─── Billing Actions ─────────────────────────────────────────────────────────

export async function createProjectBilling(
  input: CreateBillingInput
): Promise<{ ok: true; billingId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createProjectBilling:', input);
  revalidatePath(routes.finance.projectDetail(input.projectId));
  return { ok: true, billingId: 'bill-new-' + Date.now() };
}

export async function convertBillingToInvoice(
  billingId: string,
  projectId: string
): Promise<{ ok: true; invoiceId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] convertBillingToInvoice:', billingId);
  revalidatePath(routes.finance.projectDetail(projectId));
  revalidatePath(routes.finance.receivables);
  return { ok: true, invoiceId: 'inv-new-' + Date.now() };
}

export async function cancelBilling(
  billingId: string,
  projectId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] cancelBilling:', billingId, reason);
  revalidatePath(routes.finance.projectDetail(projectId));
  return { ok: true };
}

// ─── Milestone Actions ───────────────────────────────────────────────────────

export async function createMilestone(
  input: CreateMilestoneInput
): Promise<{ ok: true; milestoneId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createMilestone:', input);
  revalidatePath(routes.finance.projectDetail(input.projectId));
  return { ok: true, milestoneId: 'ms-new-' + Date.now() };
}

export async function completeMilestone(
  milestoneId: string,
  projectId: string,
  completedDate: Date
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] completeMilestone:', milestoneId, completedDate);
  revalidatePath(routes.finance.projectDetail(projectId));
  return { ok: true };
}

// ─── WIP Actions ─────────────────────────────────────────────────────────────

export async function calculateWIP(
  projectId: string
): Promise<{ ok: true; wipAmount: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] calculateWIP:', projectId);
  revalidatePath(routes.finance.projectDetail(projectId));
  return { ok: true, wipAmount: 35000.0 };
}

export async function postWIPJournalEntry(
  projectId: string,
  periodEnd: Date
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] postWIPJournalEntry:', projectId, periodEnd);
  revalidatePath(routes.finance.projectDetail(projectId));
  revalidatePath(routes.finance.journals);
  return { ok: true, journalId: 'je-wip-' + Date.now() };
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
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] generateBillingPreview:', input);

  return {
    ok: true,
    preview: {
      lineItems: [
        { description: 'Professional Services', amount: 45000.0 },
        { description: 'Materials', amount: 5000.0 },
      ],
      totalAmount: 50000.0,
      taxes: 5000.0,
      grandTotal: 55000.0,
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
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] submitBillingWizard:', input);
  revalidatePath(routes.finance.projectDetail(input.projectId));
  revalidatePath(routes.finance.receivables);
  return { ok: true, billingId: 'bill-wiz-' + Date.now(), invoiceId: 'inv-wiz-' + Date.now() };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkUpdateProjectStatus(
  projectIds: string[],
  status: 'active' | 'on_hold' | 'cancelled'
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] bulkUpdateProjectStatus:', projectIds, status);
  revalidatePath(routes.finance.projects);
  return { ok: true, updated: projectIds.length };
}

export async function bulkCalculateWIP(projectIds: string[]): Promise<
  | {
      ok: true;
      results: Array<{ projectId: string; wipAmount: number }>;
    }
  | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 800));
  console.log('[Action] bulkCalculateWIP:', projectIds);
  revalidatePath(routes.finance.projects);
  return {
    ok: true,
    results: projectIds.map((id) => ({ projectId: id, wipAmount: Math.random() * 50000 })),
  };
}
