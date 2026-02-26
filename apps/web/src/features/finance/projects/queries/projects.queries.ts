'use server';

import type {
  Project,
  ProjectCost,
  ProjectBilling,
  ProjectMilestone,
  WIPCalculation,
  ProjectSummary,
} from '../types';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    projectNumber: 'PRJ-2025-001',
    name: 'ERP Implementation - ABC Corp',
    description: 'Full ERP implementation including modules for finance, HR, and supply chain',
    customerId: 'cust-1',
    customerName: 'ABC Corporation',
    projectType: 'fixed_price',
    billingMethod: 'milestone',
    revenueRecognition: 'percentage_of_completion',
    status: 'active',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2026-05-31'),
    projectManager: 'John Smith',
    department: 'Consulting',
    contractValue: 500000.0,
    budgetedCost: 350000.0,
    currency: 'USD',
    actualCost: 245000.0,
    actualRevenue: 300000.0,
    billedAmount: 250000.0,
    unbilledAmount: 50000.0,
    wipAmount: 35000.0,
    percentComplete: 60,
    profitMargin: 30,
    costCenterId: 'cc-consulting',
    costCenterCode: 'CONS',
    createdAt: new Date('2025-05-15'),
    updatedAt: new Date('2026-02-25'),
  },
  {
    id: 'proj-2',
    projectNumber: 'PRJ-2025-002',
    name: 'Website Redesign - XYZ Ltd',
    description: 'Complete website redesign with new branding and CMS',
    customerId: 'cust-2',
    customerName: 'XYZ Limited',
    projectType: 'time_materials',
    billingMethod: 'monthly',
    revenueRecognition: 'time_based',
    status: 'active',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2026-03-31'),
    projectManager: 'Jane Doe',
    department: 'Digital',
    contractValue: 0,
    budgetedCost: 75000.0,
    currency: 'USD',
    actualCost: 52000.0,
    actualRevenue: 65000.0,
    billedAmount: 58000.0,
    unbilledAmount: 7000.0,
    wipAmount: 0,
    percentComplete: 70,
    profitMargin: 20,
    costCenterId: 'cc-digital',
    costCenterCode: 'DGTL',
    createdAt: new Date('2025-08-20'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'proj-3',
    projectNumber: 'PRJ-2026-001',
    name: 'Internal System Upgrade',
    description: 'Upgrade internal systems and infrastructure',
    customerId: null,
    customerName: null,
    projectType: 'internal',
    billingMethod: 'on_completion',
    revenueRecognition: 'completed_contract',
    status: 'planning',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-09-30'),
    projectManager: 'Mike Johnson',
    department: 'IT',
    contractValue: 0,
    budgetedCost: 150000.0,
    currency: 'USD',
    actualCost: 0,
    actualRevenue: 0,
    billedAmount: 0,
    unbilledAmount: 0,
    wipAmount: 0,
    percentComplete: 0,
    profitMargin: 0,
    costCenterId: 'cc-it',
    costCenterCode: 'IT',
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-15'),
  },
];

const mockCosts: ProjectCost[] = [
  {
    id: 'cost-1',
    projectId: 'proj-1',
    costType: 'labor',
    date: new Date('2026-02-20'),
    description: 'Senior Consultant - 40 hours',
    quantity: 40,
    unitCost: 150.0,
    totalCost: 6000.0,
    currency: 'USD',
    employeeId: 'emp-1',
    employeeName: 'John Smith',
    vendorId: null,
    vendorName: null,
    glAccountId: 'gl-5100',
    glAccountCode: '5100',
    isBillable: true,
    isBilled: false,
    invoiceId: null,
    sourceType: 'Timesheet',
    sourceId: 'ts-1',
    sourceNumber: 'TS-2026-0045',
    createdAt: new Date('2026-02-20'),
  },
  {
    id: 'cost-2',
    projectId: 'proj-1',
    costType: 'subcontractor',
    date: new Date('2026-02-18'),
    description: 'Database migration services',
    quantity: 1,
    unitCost: 15000.0,
    totalCost: 15000.0,
    currency: 'USD',
    employeeId: null,
    employeeName: null,
    vendorId: 'vend-1',
    vendorName: 'Tech Solutions Inc',
    glAccountId: 'gl-5200',
    glAccountCode: '5200',
    isBillable: true,
    isBilled: true,
    invoiceId: 'inv-1',
    sourceType: 'AP Invoice',
    sourceId: 'ap-1',
    sourceNumber: 'AP-2026-0089',
    createdAt: new Date('2026-02-18'),
  },
];

const mockBillings: ProjectBilling[] = [
  {
    id: 'bill-1',
    projectId: 'proj-1',
    billingNumber: 'PB-2026-001',
    description: 'Phase 1 Completion - Requirements & Design',
    billingDate: new Date('2025-09-30'),
    amount: 100000.0,
    currency: 'USD',
    status: 'paid',
    milestoneId: 'ms-1',
    milestoneName: 'Phase 1 - Requirements & Design',
    percentageComplete: 20,
    invoiceId: 'inv-101',
    invoiceNumber: 'INV-2025-0156',
    paidDate: new Date('2025-10-15'),
    createdAt: new Date('2025-09-30'),
  },
  {
    id: 'bill-2',
    projectId: 'proj-1',
    billingNumber: 'PB-2026-002',
    description: 'Phase 2 Completion - Development',
    billingDate: new Date('2025-12-31'),
    amount: 150000.0,
    currency: 'USD',
    status: 'paid',
    milestoneId: 'ms-2',
    milestoneName: 'Phase 2 - Development',
    percentageComplete: 50,
    invoiceId: 'inv-102',
    invoiceNumber: 'INV-2025-0298',
    paidDate: new Date('2026-01-20'),
    createdAt: new Date('2025-12-31'),
  },
  {
    id: 'bill-3',
    projectId: 'proj-1',
    billingNumber: 'PB-2026-003',
    description: 'Phase 3 Progress Billing',
    billingDate: new Date('2026-02-28'),
    amount: 50000.0,
    currency: 'USD',
    status: 'pending',
    milestoneId: null,
    milestoneName: null,
    percentageComplete: 60,
    invoiceId: null,
    invoiceNumber: null,
    paidDate: null,
    createdAt: new Date('2026-02-25'),
  },
];

const mockMilestones: ProjectMilestone[] = [
  {
    id: 'ms-1',
    projectId: 'proj-1',
    name: 'Phase 1 - Requirements & Design',
    description: 'Complete requirements gathering and system design',
    dueDate: new Date('2025-09-30'),
    completedDate: new Date('2025-09-28'),
    billingAmount: 100000.0,
    status: 'completed',
    percentageWeight: 20,
    deliverables: ['Requirements Document', 'System Design Document', 'Project Plan'],
  },
  {
    id: 'ms-2',
    projectId: 'proj-1',
    name: 'Phase 2 - Development',
    description: 'Core system development and configuration',
    dueDate: new Date('2025-12-31'),
    completedDate: new Date('2025-12-28'),
    billingAmount: 150000.0,
    status: 'completed',
    percentageWeight: 30,
    deliverables: ['Configured System', 'Data Migration Plan', 'Integration Specs'],
  },
  {
    id: 'ms-3',
    projectId: 'proj-1',
    name: 'Phase 3 - Testing & Training',
    description: 'User acceptance testing and training',
    dueDate: new Date('2026-03-31'),
    completedDate: null,
    billingAmount: 100000.0,
    status: 'in_progress',
    percentageWeight: 25,
    deliverables: ['Test Results', 'Training Materials', 'User Guides'],
  },
  {
    id: 'ms-4',
    projectId: 'proj-1',
    name: 'Phase 4 - Go-Live',
    description: 'System go-live and post-implementation support',
    dueDate: new Date('2026-05-31'),
    completedDate: null,
    billingAmount: 150000.0,
    status: 'pending',
    percentageWeight: 25,
    deliverables: ['Go-Live Checklist', 'Support Documentation', 'Sign-off'],
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getProjects(params?: {
  status?: string;
  customerId?: string;
  department?: string;
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<
  | {
      ok: true;
      data: Project[];
      pagination: { page: number; perPage: number; total: number; totalPages: number };
    }
  | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 400));

  let filtered = [...mockProjects];

  if (params?.status) {
    filtered = filtered.filter((p) => p.status === params.status);
  }

  if (params?.customerId) {
    filtered = filtered.filter((p) => p.customerId === params.customerId);
  }

  if (params?.department) {
    filtered = filtered.filter((p) => p.department === params.department);
  }

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.projectNumber.toLowerCase().includes(search) ||
        p.name.toLowerCase().includes(search) ||
        p.customerName?.toLowerCase().includes(search)
    );
  }

  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;
  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);

  return {
    ok: true,
    data: filtered,
    pagination: { page, perPage, total, totalPages },
  };
}

export async function getProjectById(
  id: string
): Promise<{ ok: true; data: Project } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const project = mockProjects.find((p) => p.id === id);
  if (!project) return { ok: false, error: 'Project not found' };
  return { ok: true, data: project };
}

export async function getProjectCosts(
  projectId: string
): Promise<{ ok: true; data: ProjectCost[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  const costs = mockCosts.filter((c) => c.projectId === projectId);
  return { ok: true, data: costs };
}

export async function getProjectBillings(
  projectId: string
): Promise<{ ok: true; data: ProjectBilling[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));
  const billings = mockBillings.filter((b) => b.projectId === projectId);
  return { ok: true, data: billings };
}

export async function getProjectMilestones(
  projectId: string
): Promise<{ ok: true; data: ProjectMilestone[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const milestones = mockMilestones.filter((m) => m.projectId === projectId);
  return { ok: true, data: milestones };
}

export async function getWIPCalculation(
  projectId: string
): Promise<{ ok: true; data: WIPCalculation } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  const project = mockProjects.find((p) => p.id === projectId);
  if (!project) return { ok: false, error: 'Project not found' };

  const wip: WIPCalculation = {
    projectId,
    calculationDate: new Date(),
    method: project.revenueRecognition,
    totalContractValue: project.contractValue,
    percentComplete: project.percentComplete,
    earnedRevenue: project.actualRevenue,
    billedToDate: project.billedAmount,
    wipBalance: project.wipAmount,
    costToDate: project.actualCost,
    estimatedCostAtCompletion: project.budgetedCost,
    estimatedProfit: project.contractValue - project.budgetedCost,
    profitMarginPercent: project.profitMargin,
  };

  return { ok: true, data: wip };
}

export async function getProjectSummary(): Promise<
  { ok: true; data: ProjectSummary } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 250));

  const summary: ProjectSummary = {
    totalProjects: 12,
    activeProjects: 8,
    totalContractValue: 2500000.0,
    totalBudgetedCost: 1750000.0,
    totalActualCost: 1050000.0,
    totalBilledAmount: 1250000.0,
    totalUnbilledAmount: 185000.0,
    totalWIP: 85000.0,
    averageMargin: 28.5,
    projectsOverBudget: 2,
  };

  return { ok: true, data: summary };
}
