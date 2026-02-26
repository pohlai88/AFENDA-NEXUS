'use server';

import { revalidatePath } from 'next/cache';
import type {
  ProjectType,
  BillingMethod,
  RevenueRecognition,
  CostType,
} from '../types';

// ─── Project Actions ─────────────────────────────────────────────────────────

interface CreateProjectInput {
  projectNumber: string;
  name: string;
  description: string;
  customerId?: string;
  projectType: ProjectType;
  billingMethod: BillingMethod;
  revenueRecognition: RevenueRecognition;
  startDate: Date;
  endDate?: Date;
  projectManager: string;
  department: string;
  contractValue: number;
  budgetedCost: number;
  currency: string;
  costCenterId?: string;
}

export async function createProject(
  input: CreateProjectInput
): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] createProject:', input);
  revalidatePath('/finance/projects');
  return { ok: true, projectId: 'proj-new-' + Date.now() };
}

interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  projectManager?: string;
  endDate?: Date;
  budgetedCost?: number;
}

export async function updateProject(
  input: UpdateProjectInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] updateProject:', input);
  revalidatePath('/finance/projects');
  revalidatePath(`/finance/projects/${input.id}`);
  return { ok: true };
}

export async function updateProjectStatus(
  id: string,
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] updateProjectStatus:', id, status);
  revalidatePath('/finance/projects');
  revalidatePath(`/finance/projects/${id}`);
  return { ok: true };
}

// ─── Cost Actions ────────────────────────────────────────────────────────────

interface AddCostInput {
  projectId: string;
  costType: CostType;
  date: Date;
  description: string;
  quantity: number;
  unitCost: number;
  glAccountId: string;
  isBillable: boolean;
  employeeId?: string;
  vendorId?: string;
}

export async function addProjectCost(
  input: AddCostInput
): Promise<{ ok: true; costId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] addProjectCost:', input);
  revalidatePath(`/finance/projects/${input.projectId}`);
  return { ok: true, costId: 'cost-new-' + Date.now() };
}

export async function updateProjectCost(
  costId: string,
  updates: Partial<AddCostInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] updateProjectCost:', costId, updates);
  revalidatePath('/finance/projects');
  return { ok: true };
}

export async function deleteProjectCost(
  costId: string,
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  console.log('[Action] deleteProjectCost:', costId);
  revalidatePath(`/finance/projects/${projectId}`);
  return { ok: true };
}

// ─── Billing Actions ─────────────────────────────────────────────────────────

interface CreateBillingInput {
  projectId: string;
  description: string;
  billingDate: Date;
  amount: number;
  milestoneId?: string;
  percentageComplete?: number;
}

export async function createProjectBilling(
  input: CreateBillingInput
): Promise<{ ok: true; billingId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createProjectBilling:', input);
  revalidatePath(`/finance/projects/${input.projectId}`);
  return { ok: true, billingId: 'bill-new-' + Date.now() };
}

export async function convertBillingToInvoice(
  billingId: string,
  projectId: string
): Promise<{ ok: true; invoiceId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] convertBillingToInvoice:', billingId);
  revalidatePath(`/finance/projects/${projectId}`);
  revalidatePath('/finance/receivables');
  return { ok: true, invoiceId: 'inv-new-' + Date.now() };
}

export async function cancelBilling(
  billingId: string,
  projectId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] cancelBilling:', billingId, reason);
  revalidatePath(`/finance/projects/${projectId}`);
  return { ok: true };
}

// ─── Milestone Actions ───────────────────────────────────────────────────────

interface CreateMilestoneInput {
  projectId: string;
  name: string;
  description: string;
  dueDate: Date;
  billingAmount: number;
  percentageWeight: number;
  deliverables: string[];
}

export async function createMilestone(
  input: CreateMilestoneInput
): Promise<{ ok: true; milestoneId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createMilestone:', input);
  revalidatePath(`/finance/projects/${input.projectId}`);
  return { ok: true, milestoneId: 'ms-new-' + Date.now() };
}

export async function completeMilestone(
  milestoneId: string,
  projectId: string,
  completedDate: Date
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] completeMilestone:', milestoneId, completedDate);
  revalidatePath(`/finance/projects/${projectId}`);
  return { ok: true };
}

// ─── WIP Actions ─────────────────────────────────────────────────────────────

export async function calculateWIP(
  projectId: string
): Promise<{ ok: true; wipAmount: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] calculateWIP:', projectId);
  revalidatePath(`/finance/projects/${projectId}`);
  return { ok: true, wipAmount: 35000.0 };
}

export async function postWIPJournalEntry(
  projectId: string,
  periodEnd: Date
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] postWIPJournalEntry:', projectId, periodEnd);
  revalidatePath(`/finance/projects/${projectId}`);
  revalidatePath('/finance/journal');
  return { ok: true, journalId: 'je-wip-' + Date.now() };
}

// ─── Billing Wizard Actions ──────────────────────────────────────────────────

interface BillingWizardInput {
  projectId: string;
  billingType: 'milestone' | 'progress' | 'time_materials' | 'final';
  selectedMilestones?: string[];
  progressPercentage?: number;
  dateRange?: { from: Date; to: Date };
  customAmount?: number;
  notes?: string;
}

export async function generateBillingPreview(
  input: BillingWizardInput
): Promise<{
  ok: true;
  preview: {
    lineItems: Array<{ description: string; amount: number }>;
    totalAmount: number;
    taxes: number;
    grandTotal: number;
  };
} | { ok: false; error: string }> {
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

export async function submitBillingWizard(
  input: BillingWizardInput
): Promise<{
  ok: true;
  billingId: string;
  invoiceId?: string;
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] submitBillingWizard:', input);
  revalidatePath(`/finance/projects/${input.projectId}`);
  revalidatePath('/finance/receivables');
  return { ok: true, billingId: 'bill-wiz-' + Date.now(), invoiceId: 'inv-wiz-' + Date.now() };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkUpdateProjectStatus(
  projectIds: string[],
  status: 'active' | 'on_hold' | 'cancelled'
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] bulkUpdateProjectStatus:', projectIds, status);
  revalidatePath('/finance/projects');
  return { ok: true, updated: projectIds.length };
}

export async function bulkCalculateWIP(
  projectIds: string[]
): Promise<{
  ok: true;
  results: Array<{ projectId: string; wipAmount: number }>;
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));
  console.log('[Action] bulkCalculateWIP:', projectIds);
  revalidatePath('/finance/projects');
  return {
    ok: true,
    results: projectIds.map((id) => ({ projectId: id, wipAmount: Math.random() * 50000 })),
  };
}
