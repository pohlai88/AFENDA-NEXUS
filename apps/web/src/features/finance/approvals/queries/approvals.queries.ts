import type { ApprovalItem, ApprovalStats, ApprovalPolicy } from '../types';

// ─── Mock Data (Replace with actual API calls) ──────────────────────────────

const mockApprovals: ApprovalItem[] = [
  {
    id: 'appr-001',
    documentType: 'AP_INVOICE',
    documentId: 'inv-123',
    documentNumber: 'INV-2026-001234',
    description: 'Office supplies - Vendor ABC Corp',
    amount: 5250.0,
    currency: 'USD',
    status: 'PENDING',
    requestedBy: 'user-001',
    requestedByName: 'John Smith',
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    slaStatus: 'ON_TRACK',
    slaHoursRemaining: 22,
    workflowId: 'wf-001',
    stepNumber: 1,
    totalSteps: 2,
    policyId: 'pol-001',
    policyName: 'Standard AP Approval',
  },
  {
    id: 'appr-002',
    documentType: 'EXPENSE_CLAIM',
    documentId: 'exp-456',
    documentNumber: 'EXP-2026-000089',
    description: 'Travel expenses - Client meeting NYC',
    amount: 1850.0,
    currency: 'USD',
    status: 'PENDING',
    requestedBy: 'user-002',
    requestedByName: 'Sarah Johnson',
    requestedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    slaStatus: 'AT_RISK',
    slaHoursRemaining: 6,
    workflowId: 'wf-002',
    stepNumber: 1,
    totalSteps: 1,
    policyId: 'pol-002',
    policyName: 'Expense Approval',
  },
  {
    id: 'appr-003',
    documentType: 'JOURNAL',
    documentId: 'jnl-789',
    documentNumber: 'JE-2026-002100',
    description: 'Month-end accruals adjustment',
    amount: 125000.0,
    currency: 'USD',
    status: 'PENDING',
    requestedBy: 'user-003',
    requestedByName: 'Mike Chen',
    requestedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    slaStatus: 'BREACHED',
    slaHoursRemaining: -2,
    workflowId: 'wf-003',
    stepNumber: 2,
    totalSteps: 2,
    policyId: 'pol-003',
    policyName: 'Journal Approval (High Value)',
    delegatedFrom: 'user-004',
    delegatedFromName: 'Lisa Wang',
  },
  {
    id: 'appr-004',
    documentType: 'IC_TRANSACTION',
    documentId: 'ic-101',
    documentNumber: 'IC-2026-000045',
    description: 'Intercompany service charge - Q4',
    amount: 75000.0,
    currency: 'EUR',
    status: 'PENDING',
    requestedBy: 'user-005',
    requestedByName: 'Hans Mueller',
    requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(Date.now() + 44 * 60 * 60 * 1000).toISOString(),
    slaStatus: 'ON_TRACK',
    slaHoursRemaining: 44,
    workflowId: 'wf-004',
    stepNumber: 1,
    totalSteps: 3,
    policyId: 'pol-004',
    policyName: 'Intercompany Approval',
  },
];

const mockStats: ApprovalStats = {
  pending: 4,
  dueToday: 1,
  atRisk: 1,
  breached: 1,
  approvedThisWeek: 12,
  rejectedThisWeek: 2,
};

const mockPolicies: ApprovalPolicy[] = [
  {
    id: 'pol-001',
    name: 'Standard AP Approval',
    description: 'Standard approval workflow for vendor invoices',
    documentTypes: ['AP_INVOICE'],
    thresholds: [
      {
        minAmount: 0,
        maxAmount: 5000,
        approverRoles: ['finance_analyst'],
        requiresAllApprovers: false,
      },
      {
        minAmount: 5000,
        maxAmount: 25000,
        approverRoles: ['finance_manager'],
        requiresAllApprovers: false,
      },
      {
        minAmount: 25000,
        maxAmount: null,
        approverRoles: ['finance_director', 'cfo'],
        requiresAllApprovers: true,
      },
    ],
    slaHours: 24,
    escalationEnabled: true,
    escalationHours: 48,
    active: true,
  },
  {
    id: 'pol-002',
    name: 'Expense Approval',
    description: 'Approval workflow for employee expense claims',
    documentTypes: ['EXPENSE_CLAIM'],
    thresholds: [
      {
        minAmount: 0,
        maxAmount: 500,
        approverRoles: ['line_manager'],
        requiresAllApprovers: false,
      },
      {
        minAmount: 500,
        maxAmount: 5000,
        approverRoles: ['department_head'],
        requiresAllApprovers: false,
      },
      {
        minAmount: 5000,
        maxAmount: null,
        approverRoles: ['finance_director'],
        requiresAllApprovers: false,
      },
    ],
    slaHours: 24,
    escalationEnabled: true,
    escalationHours: 72,
    active: true,
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export interface GetApprovalsParams {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  documentType?: string;
  slaStatus?: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  page?: number;
  limit?: number;
}

export async function getApprovals(params: GetApprovalsParams = {}) {
  const { status = 'PENDING', documentType, slaStatus, page = 1, limit = 20 } = params;

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  let filtered = [...mockApprovals];

  if (status !== 'ALL') {
    filtered = filtered.filter((item) => item.status === status);
  }

  if (documentType) {
    filtered = filtered.filter((item) => item.documentType === documentType);
  }

  if (slaStatus) {
    filtered = filtered.filter((item) => item.slaStatus === slaStatus);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    ok: true as const,
    data: {
      items,
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getApprovalStats() {
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    ok: true as const,
    data: mockStats,
  };
}

export async function getApprovalPolicies() {
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    ok: true as const,
    data: mockPolicies,
  };
}

export async function getApprovalById(id: string) {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const item = mockApprovals.find((a) => a.id === id);

  if (!item) {
    return {
      ok: false as const,
      error: 'Approval not found',
    };
  }

  return {
    ok: true as const,
    data: item,
  };
}

export async function getPendingApprovalCount() {
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    ok: true as const,
    data: mockApprovals.filter((a) => a.status === 'PENDING').length,
  };
}
