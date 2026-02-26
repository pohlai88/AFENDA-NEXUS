'use server';

import type {
  ExpenseClaim,
  ExpenseLineItem,
  ExpensePolicy,
  ExpenseSummary,
} from '../types';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockClaims: ExpenseClaim[] = [
  {
    id: 'exp-1',
    claimNumber: 'EXP-2026-0001',
    employeeId: 'emp-1',
    employeeName: 'John Smith',
    department: 'Sales',
    title: 'Q1 Client Meetings - West Coast',
    description: 'Business travel for client meetings in San Francisco and Los Angeles',
    status: 'pending_approval',
    submittedDate: new Date('2026-02-20'),
    periodFrom: new Date('2026-02-10'),
    periodTo: new Date('2026-02-15'),
    totalAmount: 3450.75,
    currency: 'USD',
    lineCount: 8,
    approvedAmount: null,
    approvedBy: null,
    approvedAt: null,
    paidDate: null,
    paymentReference: null,
    rejectionReason: null,
    createdAt: new Date('2026-02-16'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'exp-2',
    claimNumber: 'EXP-2026-0002',
    employeeId: 'emp-2',
    employeeName: 'Jane Doe',
    department: 'Marketing',
    title: 'Marketing Conference 2026',
    description: 'Attendance at annual marketing conference',
    status: 'approved',
    submittedDate: new Date('2026-02-18'),
    periodFrom: new Date('2026-02-05'),
    periodTo: new Date('2026-02-07'),
    totalAmount: 1875.00,
    currency: 'USD',
    lineCount: 5,
    approvedAmount: 1875.00,
    approvedBy: 'Mike Johnson',
    approvedAt: new Date('2026-02-22'),
    paidDate: null,
    paymentReference: null,
    rejectionReason: null,
    createdAt: new Date('2026-02-08'),
    updatedAt: new Date('2026-02-22'),
  },
  {
    id: 'exp-3',
    claimNumber: 'EXP-2026-0003',
    employeeId: 'emp-3',
    employeeName: 'Bob Wilson',
    department: 'Engineering',
    title: 'Office Supplies February',
    description: 'Monthly office supplies and equipment',
    status: 'paid',
    submittedDate: new Date('2026-02-15'),
    periodFrom: new Date('2026-02-01'),
    periodTo: new Date('2026-02-14'),
    totalAmount: 425.50,
    currency: 'USD',
    lineCount: 3,
    approvedAmount: 425.50,
    approvedBy: 'Sarah Brown',
    approvedAt: new Date('2026-02-16'),
    paidDate: new Date('2026-02-20'),
    paymentReference: 'PAY-2026-0089',
    rejectionReason: null,
    createdAt: new Date('2026-02-14'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'exp-4',
    claimNumber: 'EXP-2026-0004',
    employeeId: 'emp-1',
    employeeName: 'John Smith',
    department: 'Sales',
    title: 'Client Entertainment',
    description: 'Client dinner and entertainment',
    status: 'rejected',
    submittedDate: new Date('2026-02-10'),
    periodFrom: new Date('2026-02-08'),
    periodTo: new Date('2026-02-08'),
    totalAmount: 850.00,
    currency: 'USD',
    lineCount: 2,
    approvedAmount: null,
    approvedBy: null,
    approvedAt: null,
    paidDate: null,
    paymentReference: null,
    rejectionReason: 'Exceeds policy limit for entertainment. Please provide additional justification.',
    createdAt: new Date('2026-02-09'),
    updatedAt: new Date('2026-02-12'),
  },
  {
    id: 'exp-5',
    claimNumber: 'EXP-2026-0005',
    employeeId: 'emp-4',
    employeeName: 'Alice Chen',
    department: 'HR',
    title: 'Training Materials',
    description: 'Books and online course subscriptions',
    status: 'draft',
    submittedDate: null,
    periodFrom: new Date('2026-02-01'),
    periodTo: new Date('2026-02-25'),
    totalAmount: 299.99,
    currency: 'USD',
    lineCount: 4,
    approvedAmount: null,
    approvedBy: null,
    approvedAt: null,
    paidDate: null,
    paymentReference: null,
    rejectionReason: null,
    createdAt: new Date('2026-02-25'),
    updatedAt: new Date('2026-02-25'),
  },
];

const mockLineItems: ExpenseLineItem[] = [
  {
    id: 'line-1',
    claimId: 'exp-1',
    expenseDate: new Date('2026-02-10'),
    category: 'travel',
    description: 'Flight to San Francisco',
    merchantName: 'United Airlines',
    amount: 450.00,
    currency: 'USD',
    taxAmount: 0,
    taxCodeId: null,
    glAccountId: 'gl-6300',
    glAccountCode: '6300',
    costCenterId: 'cc-sales',
    costCenterCode: 'SALES',
    projectId: null,
    projectCode: null,
    receiptAttached: true,
    receiptId: 'rcpt-1',
    notes: null,
  },
  {
    id: 'line-2',
    claimId: 'exp-1',
    expenseDate: new Date('2026-02-10'),
    category: 'accommodation',
    description: 'Hotel - 3 nights',
    merchantName: 'Marriott SF',
    amount: 750.00,
    currency: 'USD',
    taxAmount: 67.50,
    taxCodeId: 'tc-1',
    glAccountId: 'gl-6310',
    glAccountCode: '6310',
    costCenterId: 'cc-sales',
    costCenterCode: 'SALES',
    projectId: null,
    projectCode: null,
    receiptAttached: true,
    receiptId: 'rcpt-2',
    notes: 'Company rate',
  },
  {
    id: 'line-3',
    claimId: 'exp-1',
    expenseDate: new Date('2026-02-11'),
    category: 'meals',
    description: 'Client lunch',
    merchantName: 'The Restaurant',
    amount: 125.50,
    currency: 'USD',
    taxAmount: 11.30,
    taxCodeId: 'tc-1',
    glAccountId: 'gl-6320',
    glAccountCode: '6320',
    costCenterId: 'cc-sales',
    costCenterCode: 'SALES',
    projectId: null,
    projectCode: null,
    receiptAttached: true,
    receiptId: 'rcpt-3',
    notes: 'Meeting with ABC Corp',
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getExpenseClaims(params?: {
  employeeId?: string;
  status?: string;
  department?: string;
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<{
  ok: true;
  data: ExpenseClaim[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  let filtered = [...mockClaims];

  if (params?.employeeId) {
    filtered = filtered.filter((c) => c.employeeId === params.employeeId);
  }

  if (params?.status) {
    filtered = filtered.filter((c) => c.status === params.status);
  }

  if (params?.department) {
    filtered = filtered.filter((c) => c.department === params.department);
  }

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.claimNumber.toLowerCase().includes(search) ||
        c.title.toLowerCase().includes(search) ||
        c.employeeName.toLowerCase().includes(search)
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

export async function getExpenseClaimById(
  id: string
): Promise<{ ok: true; data: ExpenseClaim } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const claim = mockClaims.find((c) => c.id === id);
  if (!claim) return { ok: false, error: 'Expense claim not found' };
  return { ok: true, data: claim };
}

export async function getExpenseLineItems(
  claimId: string
): Promise<{ ok: true; data: ExpenseLineItem[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));
  const items = mockLineItems.filter((i) => i.claimId === claimId);
  return { ok: true, data: items };
}

export async function getExpensePolicy(
  policyId?: string
): Promise<{ ok: true; data: ExpensePolicy } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 150));

  const policy: ExpensePolicy = {
    id: 'policy-default',
    name: 'Standard Expense Policy',
    description: 'Default expense policy for all employees',
    categoryLimits: {
      travel: 2000,
      meals: 75,
      accommodation: 300,
      transport: 150,
      supplies: 500,
      entertainment: 200,
      training: 1000,
      other: 250,
    },
    dailyLimit: 500,
    monthlyLimit: 5000,
    requiresReceipt: true,
    receiptThreshold: 25,
    requiresPreApproval: true,
    preApprovalThreshold: 1000,
    allowedCurrencies: ['USD', 'EUR', 'GBP'],
    isDefault: true,
  };

  return { ok: true, data: policy };
}

export async function getExpenseSummary(params?: {
  employeeId?: string;
  department?: string;
}): Promise<{ ok: true; data: ExpenseSummary } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));

  const summary: ExpenseSummary = {
    totalClaims: 45,
    pendingClaims: 8,
    approvedThisMonth: 32,
    pendingAmount: 12450.75,
    approvedAmount: 28750.00,
    paidThisMonth: 22500.00,
    rejectionRate: 5.2,
    averageProcessingDays: 2.4,
  };

  return { ok: true, data: summary };
}
