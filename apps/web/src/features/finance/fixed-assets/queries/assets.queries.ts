'use server';

import type {
  FixedAsset,
  AssetCategory,
  DepreciationScheduleEntry,
  DepreciationRun,
  AssetSummary,
  DisposalRequest,
} from '../types';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockCategories: AssetCategory[] = [
  {
    id: 'cat-1',
    code: 'LAND',
    name: 'Land',
    description: 'Land and property',
    defaultDepreciationMethod: 'straight_line',
    defaultUsefulLifeMonths: 0,
    defaultSalvagePercent: 0,
    assetAccountId: 'gl-1500',
    assetAccountCode: '1500',
    accumulatedDepAccountId: 'gl-1501',
    accumulatedDepAccountCode: '1501',
    depreciationExpenseAccountId: 'gl-6100',
    depreciationExpenseAccountCode: '6100',
    gainLossAccountId: 'gl-7100',
    gainLossAccountCode: '7100',
  },
  {
    id: 'cat-2',
    code: 'BLDG',
    name: 'Buildings',
    description: 'Buildings and structures',
    defaultDepreciationMethod: 'straight_line',
    defaultUsefulLifeMonths: 480,
    defaultSalvagePercent: 10,
    assetAccountId: 'gl-1510',
    assetAccountCode: '1510',
    accumulatedDepAccountId: 'gl-1511',
    accumulatedDepAccountCode: '1511',
    depreciationExpenseAccountId: 'gl-6110',
    depreciationExpenseAccountCode: '6110',
    gainLossAccountId: 'gl-7100',
    gainLossAccountCode: '7100',
  },
  {
    id: 'cat-3',
    code: 'MACH',
    name: 'Machinery & Equipment',
    description: 'Production machinery and equipment',
    defaultDepreciationMethod: 'straight_line',
    defaultUsefulLifeMonths: 120,
    defaultSalvagePercent: 5,
    assetAccountId: 'gl-1520',
    assetAccountCode: '1520',
    accumulatedDepAccountId: 'gl-1521',
    accumulatedDepAccountCode: '1521',
    depreciationExpenseAccountId: 'gl-6120',
    depreciationExpenseAccountCode: '6120',
    gainLossAccountId: 'gl-7100',
    gainLossAccountCode: '7100',
  },
  {
    id: 'cat-4',
    code: 'FURN',
    name: 'Furniture & Fixtures',
    description: 'Office furniture and fixtures',
    defaultDepreciationMethod: 'straight_line',
    defaultUsefulLifeMonths: 84,
    defaultSalvagePercent: 0,
    assetAccountId: 'gl-1530',
    assetAccountCode: '1530',
    accumulatedDepAccountId: 'gl-1531',
    accumulatedDepAccountCode: '1531',
    depreciationExpenseAccountId: 'gl-6130',
    depreciationExpenseAccountCode: '6130',
    gainLossAccountId: 'gl-7100',
    gainLossAccountCode: '7100',
  },
  {
    id: 'cat-5',
    code: 'COMP',
    name: 'Computer Equipment',
    description: 'Computers and IT equipment',
    defaultDepreciationMethod: 'straight_line',
    defaultUsefulLifeMonths: 36,
    defaultSalvagePercent: 0,
    assetAccountId: 'gl-1540',
    assetAccountCode: '1540',
    accumulatedDepAccountId: 'gl-1541',
    accumulatedDepAccountCode: '1541',
    depreciationExpenseAccountId: 'gl-6140',
    depreciationExpenseAccountCode: '6140',
    gainLossAccountId: 'gl-7100',
    gainLossAccountCode: '7100',
  },
  {
    id: 'cat-6',
    code: 'VEHI',
    name: 'Vehicles',
    description: 'Motor vehicles',
    defaultDepreciationMethod: 'declining_balance',
    defaultUsefulLifeMonths: 60,
    defaultSalvagePercent: 10,
    assetAccountId: 'gl-1550',
    assetAccountCode: '1550',
    accumulatedDepAccountId: 'gl-1551',
    accumulatedDepAccountCode: '1551',
    depreciationExpenseAccountId: 'gl-6150',
    depreciationExpenseAccountCode: '6150',
    gainLossAccountId: 'gl-7100',
    gainLossAccountCode: '7100',
  },
];

const mockAssets: FixedAsset[] = [
  {
    id: 'asset-1',
    assetNumber: 'FA-2024-0001',
    name: 'Dell PowerEdge Server',
    description: 'Primary production server',
    categoryId: 'cat-5',
    categoryName: 'Computer Equipment',
    status: 'active',
    acquisitionDate: new Date('2024-03-15'),
    inServiceDate: new Date('2024-03-20'),
    originalCost: 125000.0,
    salvageValue: 0,
    usefulLifeMonths: 36,
    depreciationMethod: 'straight_line',
    currency: 'USD',
    location: 'Data Center - Rack A1',
    department: 'IT',
    responsiblePerson: 'John Smith',
    serialNumber: 'SN-ABC123456',
    barcode: 'BC-0001',
    purchaseOrderId: 'po-1',
    purchaseOrderNumber: 'PO-2024-0045',
    vendorId: 'vend-1',
    vendorName: 'Dell Technologies',
    warrantyExpiryDate: new Date('2027-03-15'),
    accumulatedDepreciation: 76388.89,
    netBookValue: 48611.11,
    lastDepreciationDate: new Date('2026-01-31'),
    disposalDate: null,
    disposalType: null,
    disposalProceeds: null,
    disposalGainLoss: null,
    attachmentCount: 3,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'asset-2',
    assetNumber: 'FA-2023-0012',
    name: 'Toyota Camry 2023',
    description: 'Company vehicle - Sales',
    categoryId: 'cat-6',
    categoryName: 'Vehicles',
    status: 'active',
    acquisitionDate: new Date('2023-06-01'),
    inServiceDate: new Date('2023-06-05'),
    originalCost: 35000.0,
    salvageValue: 3500.0,
    usefulLifeMonths: 60,
    depreciationMethod: 'declining_balance',
    currency: 'USD',
    location: 'Parking Lot B',
    department: 'Sales',
    responsiblePerson: 'Jane Doe',
    serialNumber: 'VIN-XYZ789',
    barcode: 'BC-0012',
    purchaseOrderId: null,
    purchaseOrderNumber: null,
    vendorId: 'vend-2',
    vendorName: 'Toyota Dealer',
    warrantyExpiryDate: new Date('2026-06-01'),
    accumulatedDepreciation: 18900.0,
    netBookValue: 16100.0,
    lastDepreciationDate: new Date('2026-01-31'),
    disposalDate: null,
    disposalType: null,
    disposalProceeds: null,
    disposalGainLoss: null,
    attachmentCount: 2,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'asset-3',
    assetNumber: 'FA-2020-0003',
    name: 'Office Furniture Set',
    description: 'Executive office furniture',
    categoryId: 'cat-4',
    categoryName: 'Furniture & Fixtures',
    status: 'fully_depreciated',
    acquisitionDate: new Date('2020-01-15'),
    inServiceDate: new Date('2020-01-20'),
    originalCost: 15000.0,
    salvageValue: 0,
    usefulLifeMonths: 60,
    depreciationMethod: 'straight_line',
    currency: 'USD',
    location: 'Executive Floor',
    department: 'Administration',
    responsiblePerson: 'Mike Johnson',
    serialNumber: null,
    barcode: 'BC-0003',
    purchaseOrderId: null,
    purchaseOrderNumber: null,
    vendorId: null,
    vendorName: null,
    warrantyExpiryDate: null,
    accumulatedDepreciation: 15000.0,
    netBookValue: 0,
    lastDepreciationDate: new Date('2025-01-31'),
    disposalDate: null,
    disposalType: null,
    disposalProceeds: null,
    disposalGainLoss: null,
    attachmentCount: 1,
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2025-02-01'),
  },
];

const mockDepreciationRuns: DepreciationRun[] = [
  {
    id: 'run-1',
    runNumber: 'DEP-2026-02',
    periodStart: new Date('2026-02-01'),
    periodEnd: new Date('2026-02-28'),
    periodName: 'February 2026',
    status: 'draft',
    assetCount: 45,
    totalDepreciation: 28500.0,
    currency: 'USD',
    journalId: null,
    journalNumber: null,
    calculatedAt: new Date('2026-02-25'),
    calculatedBy: 'System',
    postedAt: null,
    postedBy: null,
  },
  {
    id: 'run-2',
    runNumber: 'DEP-2026-01',
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-01-31'),
    periodName: 'January 2026',
    status: 'posted',
    assetCount: 45,
    totalDepreciation: 28500.0,
    currency: 'USD',
    journalId: 'jnl-dep-1',
    journalNumber: 'JE-2026-0156',
    calculatedAt: new Date('2026-01-31'),
    calculatedBy: 'System',
    postedAt: new Date('2026-02-01'),
    postedBy: 'John Smith',
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getAssetCategories(): Promise<
  { ok: true; data: AssetCategory[] } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 200));
  return { ok: true, data: mockCategories };
}

export async function getFixedAssets(params?: {
  categoryId?: string;
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<{
  ok: true;
  data: FixedAsset[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  let filtered = [...mockAssets];

  if (params?.categoryId) {
    filtered = filtered.filter((a) => a.categoryId === params.categoryId);
  }

  if (params?.status) {
    filtered = filtered.filter((a) => a.status === params.status);
  }

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.assetNumber.toLowerCase().includes(search) ||
        a.name.toLowerCase().includes(search) ||
        a.serialNumber?.toLowerCase().includes(search)
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

export async function getFixedAssetById(
  id: string
): Promise<{ ok: true; data: FixedAsset } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const asset = mockAssets.find((a) => a.id === id);
  if (!asset) return { ok: false, error: 'Asset not found' };
  return { ok: true, data: asset };
}

export async function getDepreciationSchedule(
  assetId: string
): Promise<{ ok: true; data: DepreciationScheduleEntry[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  const asset = mockAssets.find((a) => a.id === assetId);
  if (!asset) return { ok: false, error: 'Asset not found' };

  const monthlyDep = (asset.originalCost - asset.salvageValue) / asset.usefulLifeMonths;
  const entries: DepreciationScheduleEntry[] = [];

  let accDep = 0;
  const startDate = new Date(asset.inServiceDate);

  for (let i = 0; i < Math.min(asset.usefulLifeMonths, 36); i++) {
    const periodStart = new Date(startDate);
    periodStart.setMonth(periodStart.getMonth() + i);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(0);

    accDep += monthlyDep;

    entries.push({
      id: `sched-${assetId}-${i}`,
      assetId,
      periodStart,
      periodEnd,
      periodName: periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      depreciationAmount: monthlyDep,
      accumulatedDepreciation: Math.min(accDep, asset.originalCost - asset.salvageValue),
      netBookValue: Math.max(asset.originalCost - accDep, asset.salvageValue),
      isPosted: periodEnd < new Date(),
      journalId: periodEnd < new Date() ? `jnl-${i}` : null,
      journalNumber: periodEnd < new Date() ? `JE-${periodStart.getFullYear()}-${String(i + 100).padStart(4, '0')}` : null,
      postedDate: periodEnd < new Date() ? periodEnd : null,
    });
  }

  return { ok: true, data: entries };
}

export async function getDepreciationRuns(params?: {
  status?: string;
  year?: number;
}): Promise<{ ok: true; data: DepreciationRun[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  let filtered = [...mockDepreciationRuns];

  if (params?.status) {
    filtered = filtered.filter((r) => r.status === params.status);
  }

  if (params?.year) {
    filtered = filtered.filter((r) => r.periodStart.getFullYear() === params.year);
  }

  return { ok: true, data: filtered };
}

export async function getAssetSummary(): Promise<
  { ok: true; data: AssetSummary } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 250));

  const summary: AssetSummary = {
    totalAssets: 125,
    activeAssets: 98,
    fullyDepreciatedAssets: 22,
    disposedThisYear: 5,
    totalOriginalCost: 2450000.0,
    totalAccumulatedDepreciation: 1180000.0,
    totalNetBookValue: 1270000.0,
    monthlyDepreciation: 28500.0,
    pendingDisposals: 2,
  };

  return { ok: true, data: summary };
}

export async function getDisposalRequests(params?: {
  status?: string;
}): Promise<{ ok: true; data: DisposalRequest[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  const requests: DisposalRequest[] = [
    {
      id: 'disp-1',
      requestNumber: 'DR-2026-0001',
      assetId: 'asset-3',
      assetNumber: 'FA-2020-0003',
      assetName: 'Office Furniture Set',
      disposalType: 'donation',
      requestedDate: new Date('2026-02-20'),
      expectedProceeds: 0,
      reason: 'Fully depreciated, donating to charity',
      status: 'pending_approval',
      requestedBy: 'Jane Smith',
      approvedBy: null,
      approvedAt: null,
      completedAt: null,
    },
  ];

  let filtered = requests;
  if (params?.status) {
    filtered = filtered.filter((r) => r.status === params.status);
  }

  return { ok: true, data: filtered };
}
