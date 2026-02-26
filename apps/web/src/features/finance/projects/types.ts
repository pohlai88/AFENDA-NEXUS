// ─── Project Types ───────────────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectType = 'fixed_price' | 'time_materials' | 'cost_plus' | 'internal';
export type BillingMethod = 'milestone' | 'percentage_completion' | 'monthly' | 'on_completion';
export type RevenueRecognition =
  | 'completed_contract'
  | 'percentage_of_completion'
  | 'milestone'
  | 'time_based';

export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description: string;
  customerId: string | null;
  customerName: string | null;
  projectType: ProjectType;
  billingMethod: BillingMethod;
  revenueRecognition: RevenueRecognition;
  status: ProjectStatus;
  startDate: Date;
  endDate: Date | null;
  projectManager: string;
  department: string;
  contractValue: number;
  budgetedCost: number;
  currency: string;
  actualCost: number;
  actualRevenue: number;
  billedAmount: number;
  unbilledAmount: number;
  wipAmount: number;
  percentComplete: number;
  profitMargin: number;
  costCenterId: string | null;
  costCenterCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Project Cost ────────────────────────────────────────────────────────────

export type CostType = 'labor' | 'material' | 'expense' | 'subcontractor' | 'overhead' | 'other';

export interface ProjectCost {
  id: string;
  projectId: string;
  costType: CostType;
  date: Date;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  currency: string;
  employeeId: string | null;
  employeeName: string | null;
  vendorId: string | null;
  vendorName: string | null;
  glAccountId: string;
  glAccountCode: string;
  isBillable: boolean;
  isBilled: boolean;
  invoiceId: string | null;
  sourceType: string;
  sourceId: string | null;
  sourceNumber: string | null;
  createdAt: Date;
}

// ─── Project Billing ─────────────────────────────────────────────────────────

export type BillingStatus = 'draft' | 'pending' | 'invoiced' | 'paid' | 'cancelled';

export interface ProjectBilling {
  id: string;
  projectId: string;
  billingNumber: string;
  description: string;
  billingDate: Date;
  amount: number;
  currency: string;
  status: BillingStatus;
  milestoneId: string | null;
  milestoneName: string | null;
  percentageComplete: number | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  paidDate: Date | null;
  createdAt: Date;
}

// ─── Project Milestone ───────────────────────────────────────────────────────

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: Date;
  completedDate: Date | null;
  billingAmount: number;
  status: MilestoneStatus;
  percentageWeight: number;
  deliverables: string[];
}

// ─── WIP Calculation ─────────────────────────────────────────────────────────

export interface WIPCalculation {
  projectId: string;
  calculationDate: Date;
  method: RevenueRecognition;
  totalContractValue: number;
  percentComplete: number;
  earnedRevenue: number;
  billedToDate: number;
  wipBalance: number;
  costToDate: number;
  estimatedCostAtCompletion: number;
  estimatedProfit: number;
  profitMarginPercent: number;
}

// ─── Project Summary ─────────────────────────────────────────────────────────

export interface ProjectSummary {
  totalProjects: number;
  activeProjects: number;
  totalContractValue: number;
  totalBudgetedCost: number;
  totalActualCost: number;
  totalBilledAmount: number;
  totalUnbilledAmount: number;
  totalWIP: number;
  averageMargin: number;
  projectsOverBudget: number;
}

// ─── Status Config ───────────────────────────────────────────────────────────

export const projectStatusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: 'Planning', color: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', color: 'bg-success/15 text-success dark:bg-success/20' },
  on_hold: { label: 'On Hold', color: 'bg-warning/15 text-warning dark:bg-warning/20' },
  completed: { label: 'Completed', color: 'bg-info/15 text-info dark:bg-info/20' },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
  },
};

export const projectTypeLabels: Record<ProjectType, string> = {
  fixed_price: 'Fixed Price',
  time_materials: 'Time & Materials',
  cost_plus: 'Cost Plus',
  internal: 'Internal',
};

export const billingMethodLabels: Record<BillingMethod, string> = {
  milestone: 'Milestone-Based',
  percentage_completion: '% Completion',
  monthly: 'Monthly',
  on_completion: 'On Completion',
};

export const costTypeLabels: Record<CostType, string> = {
  labor: 'Labor',
  material: 'Material',
  expense: 'Expense',
  subcontractor: 'Subcontractor',
  overhead: 'Overhead',
  other: 'Other',
};

export const milestoneStatusConfig: Record<MilestoneStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', color: 'bg-info/15 text-info dark:bg-info/20' },
  completed: { label: 'Completed', color: 'bg-success/15 text-success dark:bg-success/20' },
  delayed: { label: 'Delayed', color: 'bg-destructive/15 text-destructive dark:bg-destructive/20' },
};
