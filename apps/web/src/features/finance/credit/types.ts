// ─── Credit Limit Types ──────────────────────────────────────────────────────

export type CreditStatus = 'active' | 'under_review' | 'suspended' | 'on_hold' | 'inactive';
export type RiskRating = 'low' | 'medium' | 'high' | 'very_high';
export type HoldType = 'credit_limit' | 'overdue' | 'manual' | 'payment_terms';

export interface CustomerCredit {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  utilizationPercent: number;
  overdueAmount: number;
  currency: string;
  paymentTermsDays: number;
  avgPaymentDays: number;
  riskRating: RiskRating;
  status: CreditStatus;
  lastReviewDate: Date | null;
  nextReviewDate: Date | null;
  reviewFrequency: 'monthly' | 'quarterly' | 'annually';
  creditScoreExternal: number | null;
  creditScoreInternal: number;
  isOnHold: boolean;
  holdReason: string | null;
  holdDate: Date | null;
  holdBy: string | null;
  approvedBy: string | null;
  approvedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Credit Review Types ─────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'escalated';
export type ReviewType = 'periodic' | 'limit_increase' | 'new_customer' | 'risk_triggered';

export interface CreditReview {
  id: string;
  reviewNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  reviewType: ReviewType;
  status: ReviewStatus;
  currentLimit: number;
  proposedLimit: number;
  currentRating: RiskRating;
  proposedRating: RiskRating;
  currency: string;
  requestedBy: string;
  requestedAt: Date;
  assignedTo: string | null;
  financialAnalysis: string | null;
  paymentHistory: string | null;
  recommendation: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  dueDate: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Credit Hold Types ───────────────────────────────────────────────────────

export type HoldStatus = 'active' | 'released' | 'escalated';

export interface CreditHold {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  holdType: HoldType;
  status: HoldStatus;
  reason: string;
  amount: number | null;
  currency: string;
  blockedOrders: number;
  blockedOrderValue: number;
  holdDate: Date;
  holdBy: string;
  releaseDate: Date | null;
  releaseBy: string | null;
  releaseNotes: string | null;
  escalatedTo: string | null;
  escalatedAt: Date | null;
  autoRelease: boolean;
  autoReleaseCondition: string | null;
}

// ─── Credit Summary ──────────────────────────────────────────────────────────

export interface CreditSummary {
  totalCustomers: number;
  totalCreditLimit: number;
  totalOutstanding: number;
  totalOverdue: number;
  avgUtilization: number;
  customersOnHold: number;
  pendingReviews: number;
  overdueReviews: number;
  highRiskCustomers: number;
}

// ─── Status Configs ──────────────────────────────────────────────────────────

export const creditStatusConfig: Record<CreditStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
};

export const riskRatingConfig: Record<RiskRating, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  high: { label: 'High', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  very_high: { label: 'Very High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export const reviewStatusConfig: Record<ReviewStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  escalated: { label: 'Escalated', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
};

export const reviewTypeLabels: Record<ReviewType, string> = {
  periodic: 'Periodic Review',
  limit_increase: 'Limit Increase',
  new_customer: 'New Customer',
  risk_triggered: 'Risk Triggered',
};

export const holdTypeLabels: Record<HoldType, string> = {
  credit_limit: 'Credit Limit Exceeded',
  overdue: 'Overdue Balance',
  manual: 'Manual Hold',
  payment_terms: 'Payment Terms Violation',
};

export const holdStatusConfig: Record<HoldStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  released: { label: 'Released', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  escalated: { label: 'Escalated', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
};
