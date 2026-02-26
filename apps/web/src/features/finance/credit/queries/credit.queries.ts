'use server';

import type {
  CustomerCredit,
  CreditReview,
  CreditHold,
  CreditSummary,
} from '../types';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockCustomerCredits: CustomerCredit[] = [
  {
    id: 'cc-1',
    customerId: 'cust-1',
    customerCode: 'CUST-001',
    customerName: 'ABC Corporation',
    creditLimit: 500000,
    currentBalance: 325000,
    availableCredit: 175000,
    utilizationPercent: 65,
    overdueAmount: 0,
    currency: 'USD',
    paymentTermsDays: 30,
    avgPaymentDays: 28,
    riskRating: 'low',
    status: 'active',
    lastReviewDate: new Date('2025-12-15'),
    nextReviewDate: new Date('2026-06-15'),
    reviewFrequency: 'quarterly',
    creditScoreExternal: 720,
    creditScoreInternal: 85,
    isOnHold: false,
    holdReason: null,
    holdDate: null,
    holdBy: null,
    approvedBy: 'credit.mgr@company.com',
    approvedDate: new Date('2025-12-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'cc-2',
    customerId: 'cust-2',
    customerCode: 'CUST-002',
    customerName: 'XYZ Industries',
    creditLimit: 250000,
    currentBalance: 245000,
    availableCredit: 5000,
    utilizationPercent: 98,
    overdueAmount: 45000,
    currency: 'USD',
    paymentTermsDays: 30,
    avgPaymentDays: 52,
    riskRating: 'high',
    status: 'on_hold',
    lastReviewDate: new Date('2025-11-20'),
    nextReviewDate: new Date('2026-02-28'),
    reviewFrequency: 'quarterly',
    creditScoreExternal: 580,
    creditScoreInternal: 45,
    isOnHold: true,
    holdReason: 'Overdue balance exceeds 30 days',
    holdDate: new Date('2026-02-15'),
    holdBy: 'credit.analyst@company.com',
    approvedBy: 'credit.mgr@company.com',
    approvedDate: new Date('2025-11-20'),
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date('2026-02-15'),
  },
  {
    id: 'cc-3',
    customerId: 'cust-3',
    customerCode: 'CUST-003',
    customerName: 'Global Trading LLC',
    creditLimit: 1000000,
    currentBalance: 450000,
    availableCredit: 550000,
    utilizationPercent: 45,
    overdueAmount: 0,
    currency: 'USD',
    paymentTermsDays: 45,
    avgPaymentDays: 38,
    riskRating: 'low',
    status: 'active',
    lastReviewDate: new Date('2026-01-10'),
    nextReviewDate: new Date('2027-01-10'),
    reviewFrequency: 'annually',
    creditScoreExternal: 780,
    creditScoreInternal: 92,
    isOnHold: false,
    holdReason: null,
    holdDate: null,
    holdBy: null,
    approvedBy: 'cfo@company.com',
    approvedDate: new Date('2026-01-10'),
    createdAt: new Date('2022-03-20'),
    updatedAt: new Date('2026-01-10'),
  },
];

const mockReviews: CreditReview[] = [
  {
    id: 'rev-1',
    reviewNumber: 'CR-2026-001',
    customerId: 'cust-2',
    customerCode: 'CUST-002',
    customerName: 'XYZ Industries',
    reviewType: 'risk_triggered',
    status: 'in_progress',
    currentLimit: 250000,
    proposedLimit: 150000,
    currentRating: 'high',
    proposedRating: 'high',
    currency: 'USD',
    requestedBy: 'system',
    requestedAt: new Date('2026-02-15'),
    assignedTo: 'credit.analyst@company.com',
    financialAnalysis: 'Customer shows declining payment behavior over past 6 months.',
    paymentHistory: 'Average days to pay increased from 35 to 52 days.',
    recommendation: null,
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    dueDate: new Date('2026-02-28'),
    completedAt: null,
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'rev-2',
    reviewNumber: 'CR-2026-002',
    customerId: 'cust-4',
    customerCode: 'CUST-004',
    customerName: 'New Ventures Inc.',
    reviewType: 'new_customer',
    status: 'pending',
    currentLimit: 0,
    proposedLimit: 100000,
    currentRating: 'medium',
    proposedRating: 'medium',
    currency: 'USD',
    requestedBy: 'sales@company.com',
    requestedAt: new Date('2026-02-22'),
    assignedTo: null,
    financialAnalysis: null,
    paymentHistory: null,
    recommendation: null,
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    dueDate: new Date('2026-03-05'),
    completedAt: null,
    createdAt: new Date('2026-02-22'),
    updatedAt: new Date('2026-02-22'),
  },
];

const mockHolds: CreditHold[] = [
  {
    id: 'hold-1',
    customerId: 'cust-2',
    customerCode: 'CUST-002',
    customerName: 'XYZ Industries',
    holdType: 'overdue',
    status: 'active',
    reason: 'Overdue balance exceeds 30 days threshold',
    amount: 45000,
    currency: 'USD',
    blockedOrders: 3,
    blockedOrderValue: 85000,
    holdDate: new Date('2026-02-15'),
    holdBy: 'system',
    releaseDate: null,
    releaseBy: null,
    releaseNotes: null,
    escalatedTo: null,
    escalatedAt: null,
    autoRelease: true,
    autoReleaseCondition: 'On full payment of overdue amount',
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getCustomerCredits(params?: {
  status?: string;
  riskRating?: string;
  onHold?: boolean;
  search?: string;
}): Promise<{ ok: true; data: CustomerCredit[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  let filtered = [...mockCustomerCredits];

  if (params?.status) {
    filtered = filtered.filter((c) => c.status === params.status);
  }

  if (params?.riskRating) {
    filtered = filtered.filter((c) => c.riskRating === params.riskRating);
  }

  if (params?.onHold !== undefined) {
    filtered = filtered.filter((c) => c.isOnHold === params.onHold);
  }

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.customerCode.toLowerCase().includes(search) ||
        c.customerName.toLowerCase().includes(search)
    );
  }

  return { ok: true, data: filtered };
}

export async function getCustomerCreditById(
  id: string
): Promise<{ ok: true; data: CustomerCredit } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const credit = mockCustomerCredits.find((c) => c.id === id);
  if (!credit) return { ok: false, error: 'Customer credit not found' };
  return { ok: true, data: credit };
}

export async function getCreditReviews(params?: {
  status?: string;
  reviewType?: string;
}): Promise<{ ok: true; data: CreditReview[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  let filtered = [...mockReviews];

  if (params?.status) {
    filtered = filtered.filter((r) => r.status === params.status);
  }

  if (params?.reviewType) {
    filtered = filtered.filter((r) => r.reviewType === params.reviewType);
  }

  return { ok: true, data: filtered };
}

export async function getCreditReviewById(
  id: string
): Promise<{ ok: true; data: CreditReview } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const review = mockReviews.find((r) => r.id === id);
  if (!review) return { ok: false, error: 'Credit review not found' };
  return { ok: true, data: review };
}

export async function getCreditHolds(params?: {
  status?: string;
  holdType?: string;
}): Promise<{ ok: true; data: CreditHold[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));

  let filtered = [...mockHolds];

  if (params?.status) {
    filtered = filtered.filter((h) => h.status === params.status);
  }

  if (params?.holdType) {
    filtered = filtered.filter((h) => h.holdType === params.holdType);
  }

  return { ok: true, data: filtered };
}

export async function getCreditSummary(): Promise<
  { ok: true; data: CreditSummary } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 250));

  const summary: CreditSummary = {
    totalCustomers: 125,
    totalCreditLimit: 45000000,
    totalOutstanding: 28500000,
    totalOverdue: 1250000,
    avgUtilization: 63.3,
    customersOnHold: 5,
    pendingReviews: 8,
    overdueReviews: 2,
    highRiskCustomers: 12,
  };

  return { ok: true, data: summary };
}
