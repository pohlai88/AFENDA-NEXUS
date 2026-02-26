// ─── Expense Claim Types ─────────────────────────────────────────────────────

export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'cancelled';
export type ExpenseCategory =
  | 'travel'
  | 'meals'
  | 'accommodation'
  | 'transport'
  | 'supplies'
  | 'entertainment'
  | 'training'
  | 'other';

export interface ExpenseClaim {
  id: string;
  claimNumber: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  description: string;
  status: ClaimStatus;
  submittedDate: Date | null;
  periodFrom: Date;
  periodTo: Date;
  totalAmount: number;
  currency: string;
  lineCount: number;
  approvedAmount: number | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  paidDate: Date | null;
  paymentReference: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Expense Line Item ───────────────────────────────────────────────────────

export interface ExpenseLineItem {
  id: string;
  claimId: string;
  expenseDate: Date;
  category: ExpenseCategory;
  description: string;
  merchantName: string;
  amount: number;
  currency: string;
  taxAmount: number;
  taxCodeId: string | null;
  glAccountId: string;
  glAccountCode: string;
  costCenterId: string | null;
  costCenterCode: string | null;
  projectId: string | null;
  projectCode: string | null;
  receiptAttached: boolean;
  receiptId: string | null;
  notes: string | null;
}

// ─── Expense Policy ──────────────────────────────────────────────────────────

export interface ExpensePolicy {
  id: string;
  name: string;
  description: string;
  categoryLimits: Record<ExpenseCategory, number>;
  dailyLimit: number;
  monthlyLimit: number;
  requiresReceipt: boolean;
  receiptThreshold: number;
  requiresPreApproval: boolean;
  preApprovalThreshold: number;
  allowedCurrencies: string[];
  isDefault: boolean;
}

// ─── Expense Summary ─────────────────────────────────────────────────────────

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

// ─── Status Config ───────────────────────────────────────────────────────────

export const claimStatusConfig: Record<ClaimStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  submitted: { label: 'Submitted', color: 'bg-info/15 text-info dark:bg-info/20' },
  pending_approval: {
    label: 'Pending Approval',
    color: 'bg-warning/15 text-warning dark:bg-warning/20',
  },
  approved: { label: 'Approved', color: 'bg-success/15 text-success dark:bg-success/20' },
  rejected: {
    label: 'Rejected',
    color: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
  },
  paid: {
    label: 'Paid',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  travel: 'Travel',
  meals: 'Meals',
  accommodation: 'Accommodation',
  transport: 'Transport',
  supplies: 'Supplies',
  entertainment: 'Entertainment',
  training: 'Training',
  other: 'Other',
};

export const expenseCategoryIcons: Record<ExpenseCategory, string> = {
  travel: 'Plane',
  meals: 'Utensils',
  accommodation: 'Building2',
  transport: 'Car',
  supplies: 'ShoppingBag',
  entertainment: 'Music',
  training: 'GraduationCap',
  other: 'MoreHorizontal',
};
