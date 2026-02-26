// ─── Approval Item Types ─────────────────────────────────────────────────────

export type ApprovalDocumentType =
  | 'JOURNAL'
  | 'AP_INVOICE'
  | 'AR_INVOICE'
  | 'EXPENSE_CLAIM'
  | 'PURCHASE_ORDER'
  | 'PAYMENT'
  | 'IC_TRANSACTION'
  | 'ASSET_DISPOSAL'
  | 'BUDGET_TRANSFER';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'DELEGATED';

export type SLAStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED';

export interface ApprovalItem {
  id: string;
  documentType: ApprovalDocumentType;
  documentId: string;
  documentNumber: string;
  description: string;
  amount: number;
  currency: string;
  status: ApprovalStatus;

  // Requestor info
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;

  // SLA tracking
  dueAt: string;
  slaStatus: SLAStatus;
  slaHoursRemaining: number;

  // Workflow info
  workflowId: string;
  stepNumber: number;
  totalSteps: number;

  // Policy reference
  policyId: string;
  policyName: string;

  // Optional delegation
  delegatedFrom?: string;
  delegatedFromName?: string;

  // Metadata
  metadata?: Record<string, unknown>;
}

export interface ApprovalPolicy {
  id: string;
  name: string;
  description: string;
  documentTypes: ApprovalDocumentType[];
  thresholds: ApprovalThreshold[];
  slaHours: number;
  escalationEnabled: boolean;
  escalationHours: number;
  active: boolean;
}

export interface ApprovalThreshold {
  minAmount: number;
  maxAmount: number | null;
  approverRoles: string[];
  requiresAllApprovers: boolean;
}

export interface ApprovalAction {
  action: 'approve' | 'reject' | 'delegate' | 'escalate';
  itemIds: string[];
  comment?: string;
  delegateTo?: string;
}

// ─── Approval Stats ──────────────────────────────────────────────────────────

export interface ApprovalStats {
  pending: number;
  dueToday: number;
  atRisk: number;
  breached: number;
  approvedThisWeek: number;
  rejectedThisWeek: number;
}

// ─── Document Type Labels ────────────────────────────────────────────────────

export const documentTypeLabels: Record<ApprovalDocumentType, string> = {
  JOURNAL: 'Journal Entry',
  AP_INVOICE: 'Payable Invoice',
  AR_INVOICE: 'Receivable Invoice',
  EXPENSE_CLAIM: 'Expense Claim',
  PURCHASE_ORDER: 'Purchase Order',
  PAYMENT: 'Payment',
  IC_TRANSACTION: 'Intercompany Transaction',
  ASSET_DISPOSAL: 'Asset Disposal',
  BUDGET_TRANSFER: 'Budget Transfer',
};

export const documentTypeIcons: Record<ApprovalDocumentType, string> = {
  JOURNAL: 'FileText',
  AP_INVOICE: 'Receipt',
  AR_INVOICE: 'HandCoins',
  EXPENSE_CLAIM: 'Wallet',
  PURCHASE_ORDER: 'ShoppingCart',
  PAYMENT: 'Banknote',
  IC_TRANSACTION: 'ArrowLeftRight',
  ASSET_DISPOSAL: 'Trash2',
  BUDGET_TRANSFER: 'ArrowUpDown',
};

export const slaStatusConfig: Record<
  SLAStatus,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
> = {
  ON_TRACK: { variant: 'default', label: 'On Track' },
  AT_RISK: { variant: 'outline', label: 'At Risk' },
  BREACHED: { variant: 'destructive', label: 'SLA Breached' },
};
