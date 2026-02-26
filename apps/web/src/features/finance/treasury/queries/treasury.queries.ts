'use server';

import type {
  CashForecast,
  CashForecastPeriod,
  Covenant,
  CovenantTest,
  IntercompanyLoan,
  ICLoanScheduleEntry,
  TreasurySummary,
} from '../types';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockForecasts: CashForecast[] = [
  {
    id: 'fcst-1',
    name: 'Q1 2026 Cash Forecast',
    description: 'Quarterly cash flow forecast for Q1 2026',
    periodType: 'weekly',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-03-31'),
    currency: 'USD',
    status: 'published',
    openingBalance: 5000000,
    closingBalance: 6250000,
    totalInflows: 8500000,
    totalOutflows: 7250000,
    netCashFlow: 1250000,
    createdBy: 'treasury@company.com',
    createdAt: new Date('2025-12-20'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'fcst-2',
    name: 'March 2026 Daily Forecast',
    description: 'Daily cash forecast for March 2026',
    periodType: 'daily',
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-03-31'),
    currency: 'USD',
    status: 'draft',
    openingBalance: 6250000,
    closingBalance: 6800000,
    totalInflows: 3200000,
    totalOutflows: 2650000,
    netCashFlow: 550000,
    createdBy: 'treasury@company.com',
    createdAt: new Date('2026-02-25'),
    updatedAt: new Date('2026-02-25'),
  },
];

const mockCovenants: Covenant[] = [
  {
    id: 'cov-1',
    name: 'Debt Service Coverage Ratio',
    description: 'DSCR must be at least 1.25x',
    type: 'financial',
    facilityId: 'fac-1',
    facilityName: 'Senior Credit Facility',
    lenderId: 'lend-1',
    lenderName: 'First National Bank',
    metric: 'DSCR',
    operator: 'gte',
    threshold: 1.25,
    currentValue: 1.45,
    status: 'compliant',
    testingFrequency: 'quarterly',
    nextTestDate: new Date('2026-03-31'),
    lastTestDate: new Date('2025-12-31'),
    gracePeriodDays: 30,
    consequences: 'Cross-default trigger, accelerated repayment',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'cov-2',
    name: 'Leverage Ratio',
    description: 'Total Debt / EBITDA must not exceed 3.5x',
    type: 'financial',
    facilityId: 'fac-1',
    facilityName: 'Senior Credit Facility',
    lenderId: 'lend-1',
    lenderName: 'First National Bank',
    metric: 'Debt/EBITDA',
    operator: 'lte',
    threshold: 3.5,
    currentValue: 3.2,
    status: 'at_risk',
    testingFrequency: 'quarterly',
    nextTestDate: new Date('2026-03-31'),
    lastTestDate: new Date('2025-12-31'),
    gracePeriodDays: 30,
    consequences: 'Interest rate step-up, restricted distributions',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'cov-3',
    name: 'Minimum Liquidity',
    description: 'Cash + available credit must exceed $2M',
    type: 'financial',
    facilityId: 'fac-2',
    facilityName: 'Working Capital Line',
    lenderId: 'lend-2',
    lenderName: 'Regional Bank Corp',
    metric: 'Liquidity',
    operator: 'gte',
    threshold: 2000000,
    currentValue: 8500000,
    status: 'compliant',
    testingFrequency: 'monthly',
    nextTestDate: new Date('2026-02-28'),
    lastTestDate: new Date('2026-01-31'),
    gracePeriodDays: 10,
    consequences: 'Facility freeze',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2026-01-31'),
  },
];

const mockICLoans: IntercompanyLoan[] = [
  {
    id: 'icl-1',
    loanNumber: 'ICL-2025-001',
    lenderEntityId: 'ent-parent',
    lenderEntityName: 'Global Holdings Inc.',
    borrowerEntityId: 'ent-sub1',
    borrowerEntityName: 'US Operations LLC',
    type: 'term',
    principal: 5000000,
    outstandingBalance: 3500000,
    currency: 'USD',
    interestRate: 5.5,
    rateType: 'fixed',
    startDate: new Date('2025-01-01'),
    maturityDate: new Date('2028-01-01'),
    accruedInterest: 32000,
    totalInterestPaid: 220000,
    status: 'active',
    armLengthRate: 5.25,
    isArmLength: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2026-02-25'),
  },
  {
    id: 'icl-2',
    loanNumber: 'ICL-2025-002',
    lenderEntityId: 'ent-parent',
    lenderEntityName: 'Global Holdings Inc.',
    borrowerEntityId: 'ent-sub2',
    borrowerEntityName: 'European Subsidiary GmbH',
    type: 'revolving',
    principal: 2000000,
    outstandingBalance: 1200000,
    currency: 'EUR',
    interestRate: 4.0,
    rateType: 'floating',
    referenceRate: 'EURIBOR 3M',
    spread: 2.5,
    startDate: new Date('2025-06-01'),
    maturityDate: new Date('2027-06-01'),
    accruedInterest: 8500,
    totalInterestPaid: 45000,
    status: 'active',
    armLengthRate: 3.8,
    isArmLength: true,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2026-02-20'),
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getCashForecasts(params?: {
  status?: string;
}): Promise<{ ok: true; data: CashForecast[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  let filtered = [...mockForecasts];

  if (params?.status) {
    filtered = filtered.filter((f) => f.status === params.status);
  }

  return { ok: true, data: filtered };
}

export async function getCashForecastById(
  id: string
): Promise<{ ok: true; data: CashForecast; periods: CashForecastPeriod[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));
  const forecast = mockForecasts.find((f) => f.id === id);
  if (!forecast) return { ok: false, error: 'Forecast not found' };

  const periods: CashForecastPeriod[] = [
    {
      id: 'period-1',
      forecastId: id,
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-07'),
      openingBalance: 5000000,
      inflows: [
        { id: '1', category: 'AR Collections', description: 'Customer payments', amount: 450000, isActual: true, confidence: 'high', sourceType: 'AR' },
        { id: '2', category: 'Other Income', description: 'Interest income', amount: 5000, isActual: true, confidence: 'high', sourceType: 'Manual' },
      ],
      outflows: [
        { id: '3', category: 'AP Payments', description: 'Vendor payments', amount: 280000, isActual: true, confidence: 'high', sourceType: 'AP' },
        { id: '4', category: 'Payroll', description: 'Weekly payroll', amount: 150000, isActual: true, confidence: 'high', sourceType: 'HR' },
      ],
      totalInflows: 455000,
      totalOutflows: 430000,
      netFlow: 25000,
      closingBalance: 5025000,
    },
  ];

  return { ok: true, data: forecast, periods };
}

export async function getCovenants(params?: {
  status?: string;
  facilityId?: string;
}): Promise<{ ok: true; data: Covenant[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  let filtered = [...mockCovenants];

  if (params?.status) {
    filtered = filtered.filter((c) => c.status === params.status);
  }

  if (params?.facilityId) {
    filtered = filtered.filter((c) => c.facilityId === params.facilityId);
  }

  return { ok: true, data: filtered };
}

export async function getCovenantById(
  id: string
): Promise<{ ok: true; data: Covenant; tests: CovenantTest[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  const covenant = mockCovenants.find((c) => c.id === id);
  if (!covenant) return { ok: false, error: 'Covenant not found' };

  const tests: CovenantTest[] = [
    {
      id: 'test-1',
      covenantId: id,
      testDate: new Date('2026-01-15'),
      periodEnd: new Date('2025-12-31'),
      actualValue: covenant.currentValue,
      threshold: covenant.threshold,
      variance: covenant.currentValue - covenant.threshold,
      variancePercent: ((covenant.currentValue - covenant.threshold) / covenant.threshold) * 100,
      status: covenant.status,
      notes: 'Q4 2025 compliance test',
      testedBy: 'controller@company.com',
      approvedBy: 'cfo@company.com',
      approvedAt: new Date('2026-01-16'),
    },
  ];

  return { ok: true, data: covenant, tests };
}

export async function getIntercompanyLoans(params?: {
  status?: string;
  entityId?: string;
}): Promise<{ ok: true; data: IntercompanyLoan[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  let filtered = [...mockICLoans];

  if (params?.status) {
    filtered = filtered.filter((l) => l.status === params.status);
  }

  if (params?.entityId) {
    filtered = filtered.filter(
      (l) => l.lenderEntityId === params.entityId || l.borrowerEntityId === params.entityId
    );
  }

  return { ok: true, data: filtered };
}

export async function getICLoanById(
  id: string
): Promise<{ ok: true; data: IntercompanyLoan; schedule: ICLoanScheduleEntry[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  const loan = mockICLoans.find((l) => l.id === id);
  if (!loan) return { ok: false, error: 'Loan not found' };

  const schedule: ICLoanScheduleEntry[] = [
    {
      id: 'sch-1',
      loanId: id,
      dueDate: new Date('2026-01-01'),
      principalDue: 125000,
      interestDue: 22917,
      totalDue: 147917,
      principalPaid: 125000,
      interestPaid: 22917,
      paidDate: new Date('2026-01-02'),
      status: 'paid',
    },
    {
      id: 'sch-2',
      loanId: id,
      dueDate: new Date('2026-04-01'),
      principalDue: 125000,
      interestDue: 21500,
      totalDue: 146500,
      principalPaid: 0,
      interestPaid: 0,
      paidDate: null,
      status: 'pending',
    },
  ];

  return { ok: true, data: loan, schedule };
}

export async function getTreasurySummary(): Promise<
  { ok: true; data: TreasurySummary } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 250));

  const summary: TreasurySummary = {
    totalCashPosition: 8500000,
    forecastedEndOfMonth: 6800000,
    activeLoans: 5,
    totalLoanBalance: 12500000,
    covenantsAtRisk: 1,
    covenantsBreeched: 0,
    upcomingMaturities: 2,
    netIntercompanyPosition: 4700000,
  };

  return { ok: true, data: summary };
}
