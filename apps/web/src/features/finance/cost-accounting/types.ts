// ─── Cost Center Types ───────────────────────────────────────────────────────

export type CostCenterType = 'department' | 'project' | 'location' | 'product' | 'service' | 'other';
export type CostCenterStatus = 'active' | 'inactive' | 'closed';

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string;
  type: CostCenterType;
  parentId: string | null;
  parentCode: string | null;
  managerId: string | null;
  managerName: string | null;
  budgetAmount: number;
  actualAmount: number;
  currency: string;
  status: CostCenterStatus;
  level: number;
  path: string[];
  children?: CostCenter[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Cost Driver Types ───────────────────────────────────────────────────────

export type DriverType = 'headcount' | 'revenue' | 'square_footage' | 'machine_hours' | 'direct_labor' | 'units_produced' | 'custom';
export type DriverStatus = 'active' | 'inactive';

export interface CostDriver {
  id: string;
  code: string;
  name: string;
  description: string;
  type: DriverType;
  unit: string;
  status: DriverStatus;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostDriverValue {
  id: string;
  driverId: string;
  costCenterId: string;
  costCenterCode: string;
  costCenterName: string;
  period: string;
  value: number;
  percentage: number;
  updatedAt: Date;
}

// ─── Cost Allocation Types ───────────────────────────────────────────────────

export type AllocationMethod = 'direct' | 'step_down' | 'reciprocal' | 'activity_based';
export type AllocationStatus = 'draft' | 'in_progress' | 'completed' | 'reversed';

export interface AllocationRule {
  id: string;
  name: string;
  description: string;
  sourceCostCenterId: string;
  sourceCostCenterCode: string;
  sourceCostCenterName: string;
  driverId: string;
  driverCode: string;
  driverName: string;
  method: AllocationMethod;
  isActive: boolean;
  order: number;
  targets: AllocationTarget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AllocationTarget {
  costCenterId: string;
  costCenterCode: string;
  costCenterName: string;
  percentage: number;
  fixedAmount?: number;
}

export interface AllocationRun {
  id: string;
  runNumber: string;
  period: string;
  method: AllocationMethod;
  status: AllocationStatus;
  totalAllocated: number;
  currency: string;
  rulesApplied: number;
  costCentersAffected: number;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  initiatedBy: string;
  initiatedAt: Date;
  completedAt: Date | null;
  reversedAt: Date | null;
  reversedBy: string | null;
}

export interface AllocationDetail {
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
  amount: number;
  percentage: number;
  driverValue: number;
}

// ─── Cost Summary ────────────────────────────────────────────────────────────

export interface CostAccountingSummary {
  totalCostCenters: number;
  activeCostCenters: number;
  totalDrivers: number;
  totalRules: number;
  lastAllocationRun: string | null;
  totalAllocatedYTD: number;
  budgetVariancePercent: number;
  pendingAllocations: number;
}

// ─── Status Configs ──────────────────────────────────────────────────────────

export const costCenterStatusConfig: Record<CostCenterStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  closed: { label: 'Closed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export const costCenterTypeLabels: Record<CostCenterType, string> = {
  department: 'Department',
  project: 'Project',
  location: 'Location',
  product: 'Product',
  service: 'Service',
  other: 'Other',
};

export const driverTypeLabels: Record<DriverType, string> = {
  headcount: 'Headcount',
  revenue: 'Revenue',
  square_footage: 'Square Footage',
  machine_hours: 'Machine Hours',
  direct_labor: 'Direct Labor Hours',
  units_produced: 'Units Produced',
  custom: 'Custom',
};

export const allocationMethodLabels: Record<AllocationMethod, string> = {
  direct: 'Direct Allocation',
  step_down: 'Step-Down',
  reciprocal: 'Reciprocal',
  activity_based: 'Activity-Based',
};

export const allocationStatusConfig: Record<AllocationStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  reversed: { label: 'Reversed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};
