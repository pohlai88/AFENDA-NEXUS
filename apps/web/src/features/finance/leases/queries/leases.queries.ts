'use server';

import type {
  LeaseContract,
  ROUAsset,
  LeaseScheduleEntry,
  LeaseModification,
  LeaseSummary,
} from '../types';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockLeases: LeaseContract[] = [
  {
    id: 'lease-1',
    leaseNumber: 'LS-2024-001',
    description: 'Head Office Building - Floor 5-8',
    lessorName: 'Prime Properties LLC',
    lessorId: 'lessor-1',
    assetClass: 'property',
    assetDescription: '4 floors of commercial office space, 20,000 sq ft',
    leaseType: 'finance',
    status: 'active',
    commencementDate: new Date('2024-01-01'),
    endDate: new Date('2029-12-31'),
    leaseTerm: 72,
    paymentAmount: 85000,
    paymentFrequency: 'monthly',
    currency: 'USD',
    incrementalBorrowingRate: 5.5,
    rouAssetValue: 5250000,
    leaseLiabilityValue: 5250000,
    accumulatedDepreciation: 1093750,
    carryingAmount: 4156250,
    currentLiability: 820000,
    nonCurrentLiability: 3650000,
    hasExtensionOption: true,
    extensionPeriod: 36,
    hasTerminationOption: false,
    terminationPenalty: null,
    hasPurchaseOption: false,
    purchasePrice: null,
    isReasonablyCertainToExtend: false,
    isReasonablyCertainToPurchase: false,
    costCenterId: 'cc-corp',
    costCenterCode: 'CORP',
    glAccountAsset: '1700',
    glAccountLiability: '2700',
    glAccountInterest: '7200',
    glAccountDepreciation: '6200',
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'lease-2',
    leaseNumber: 'LS-2025-001',
    description: 'Fleet Vehicles - Sales Team',
    lessorName: 'Auto Fleet Solutions',
    lessorId: 'lessor-2',
    assetClass: 'vehicle',
    assetDescription: '10 company vehicles for sales team',
    leaseType: 'operating',
    status: 'active',
    commencementDate: new Date('2025-03-01'),
    endDate: new Date('2028-02-29'),
    leaseTerm: 36,
    paymentAmount: 12500,
    paymentFrequency: 'monthly',
    currency: 'USD',
    incrementalBorrowingRate: 6.0,
    rouAssetValue: 420000,
    leaseLiabilityValue: 420000,
    accumulatedDepreciation: 128333,
    carryingAmount: 291667,
    currentLiability: 145000,
    nonCurrentLiability: 200000,
    hasExtensionOption: false,
    extensionPeriod: null,
    hasTerminationOption: true,
    terminationPenalty: 25000,
    hasPurchaseOption: true,
    purchasePrice: 85000,
    isReasonablyCertainToExtend: false,
    isReasonablyCertainToPurchase: false,
    costCenterId: 'cc-sales',
    costCenterCode: 'SALES',
    glAccountAsset: '1710',
    glAccountLiability: '2710',
    glAccountInterest: '7210',
    glAccountDepreciation: '6210',
    createdAt: new Date('2025-02-15'),
    updatedAt: new Date('2026-02-15'),
  },
];

const mockROUAssets: ROUAsset[] = [
  {
    id: 'rou-1',
    leaseId: 'lease-1',
    leaseNumber: 'LS-2024-001',
    assetNumber: 'ROU-2024-001',
    description: 'Head Office Building - Floor 5-8',
    assetClass: 'property',
    commencementDate: new Date('2024-01-01'),
    initialValue: 5250000,
    accumulatedDepreciation: 1093750,
    carryingAmount: 4156250,
    monthlyDepreciation: 72917,
    usefulLife: 72,
    currency: 'USD',
    impairmentLoss: 0,
    isImpaired: false,
  },
  {
    id: 'rou-2',
    leaseId: 'lease-2',
    leaseNumber: 'LS-2025-001',
    assetNumber: 'ROU-2025-001',
    description: 'Fleet Vehicles - Sales Team',
    assetClass: 'vehicle',
    commencementDate: new Date('2025-03-01'),
    initialValue: 420000,
    accumulatedDepreciation: 128333,
    carryingAmount: 291667,
    monthlyDepreciation: 11667,
    usefulLife: 36,
    currency: 'USD',
    impairmentLoss: 0,
    isImpaired: false,
  },
];

const mockSchedule: LeaseScheduleEntry[] = [
  {
    id: 'sch-1',
    leaseId: 'lease-1',
    periodNumber: 1,
    dueDate: new Date('2024-01-01'),
    openingBalance: 5250000,
    payment: 85000,
    interestExpense: 24063,
    principalReduction: 60937,
    closingBalance: 5189063,
    isPaid: true,
    paidDate: new Date('2024-01-02'),
    actualPayment: 85000,
  },
  {
    id: 'sch-25',
    leaseId: 'lease-1',
    periodNumber: 25,
    dueDate: new Date('2026-01-01'),
    openingBalance: 4550000,
    payment: 85000,
    interestExpense: 20854,
    principalReduction: 64146,
    closingBalance: 4485854,
    isPaid: true,
    paidDate: new Date('2026-01-03'),
    actualPayment: 85000,
  },
  {
    id: 'sch-26',
    leaseId: 'lease-1',
    periodNumber: 26,
    dueDate: new Date('2026-02-01'),
    openingBalance: 4485854,
    payment: 85000,
    interestExpense: 20560,
    principalReduction: 64440,
    closingBalance: 4421414,
    isPaid: true,
    paidDate: new Date('2026-02-02'),
    actualPayment: 85000,
  },
  {
    id: 'sch-27',
    leaseId: 'lease-1',
    periodNumber: 27,
    dueDate: new Date('2026-03-01'),
    openingBalance: 4421414,
    payment: 85000,
    interestExpense: 20265,
    principalReduction: 64735,
    closingBalance: 4356679,
    isPaid: false,
    paidDate: null,
    actualPayment: null,
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getLeases(params?: {
  status?: string;
  assetClass?: string;
  leaseType?: string;
  search?: string;
}): Promise<{ ok: true; data: LeaseContract[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  let filtered = [...mockLeases];

  if (params?.status) {
    filtered = filtered.filter((l) => l.status === params.status);
  }

  if (params?.assetClass) {
    filtered = filtered.filter((l) => l.assetClass === params.assetClass);
  }

  if (params?.leaseType) {
    filtered = filtered.filter((l) => l.leaseType === params.leaseType);
  }

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.leaseNumber.toLowerCase().includes(search) ||
        l.description.toLowerCase().includes(search) ||
        l.lessorName.toLowerCase().includes(search)
    );
  }

  return { ok: true, data: filtered };
}

export async function getLeaseById(
  id: string
): Promise<{ ok: true; data: LeaseContract } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const lease = mockLeases.find((l) => l.id === id);
  if (!lease) return { ok: false, error: 'Lease not found' };
  return { ok: true, data: lease };
}

export async function getROUAssets(params?: {
  assetClass?: string;
}): Promise<{ ok: true; data: ROUAsset[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));

  let filtered = [...mockROUAssets];

  if (params?.assetClass) {
    filtered = filtered.filter((a) => a.assetClass === params.assetClass);
  }

  return { ok: true, data: filtered };
}

export async function getLeaseSchedule(
  leaseId: string
): Promise<{ ok: true; data: LeaseScheduleEntry[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  const schedule = mockSchedule.filter((s) => s.leaseId === leaseId);
  return { ok: true, data: schedule };
}

export async function getLeaseModifications(
  leaseId: string
): Promise<{ ok: true; data: LeaseModification[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));
  return { ok: true, data: [] };
}

export async function getLeaseSummary(): Promise<
  { ok: true; data: LeaseSummary } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 250));

  const summary: LeaseSummary = {
    totalLeases: 15,
    activeLeases: 12,
    totalROUAssets: 5670000,
    totalLeaseLiability: 4815000,
    currentLiability: 965000,
    nonCurrentLiability: 3850000,
    monthlyPaymentsDue: 97500,
    leasesExpiringSoon: 2,
    pendingModifications: 1,
  };

  return { ok: true, data: summary };
}
