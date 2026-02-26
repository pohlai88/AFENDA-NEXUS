'use server';

import type {
  IntangibleAsset,
  IntangibleCategory,
  AmortizationScheduleEntry,
  ImpairmentTest,
  IntangibleSummary,
} from '../types';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockCategories: IntangibleCategory[] = [
  {
    id: 'icat-1',
    code: 'SOFT',
    name: 'Software',
    intangibleType: 'software',
    defaultAmortizationMethod: 'straight_line',
    defaultUsefulLifeMonths: 36,
    assetAccountId: 'gl-1700',
    assetAccountCode: '1700',
    accumulatedAmortAccountId: 'gl-1701',
    accumulatedAmortAccountCode: '1701',
    amortizationExpenseAccountId: 'gl-6200',
    amortizationExpenseAccountCode: '6200',
    impairmentAccountId: 'gl-6210',
    impairmentAccountCode: '6210',
  },
  {
    id: 'icat-2',
    code: 'PAT',
    name: 'Patents',
    intangibleType: 'patent',
    defaultAmortizationMethod: 'straight_line',
    defaultUsefulLifeMonths: 240,
    assetAccountId: 'gl-1710',
    assetAccountCode: '1710',
    accumulatedAmortAccountId: 'gl-1711',
    accumulatedAmortAccountCode: '1711',
    amortizationExpenseAccountId: 'gl-6200',
    amortizationExpenseAccountCode: '6200',
    impairmentAccountId: 'gl-6210',
    impairmentAccountCode: '6210',
  },
  {
    id: 'icat-3',
    code: 'LIC',
    name: 'Licenses',
    intangibleType: 'license',
    defaultAmortizationMethod: 'straight_line',
    defaultUsefulLifeMonths: 60,
    assetAccountId: 'gl-1720',
    assetAccountCode: '1720',
    accumulatedAmortAccountId: 'gl-1721',
    accumulatedAmortAccountCode: '1721',
    amortizationExpenseAccountId: 'gl-6200',
    amortizationExpenseAccountCode: '6200',
    impairmentAccountId: 'gl-6210',
    impairmentAccountCode: '6210',
  },
  {
    id: 'icat-4',
    code: 'GW',
    name: 'Goodwill',
    intangibleType: 'goodwill',
    defaultAmortizationMethod: 'straight_line',
    defaultUsefulLifeMonths: 0,
    assetAccountId: 'gl-1750',
    assetAccountCode: '1750',
    accumulatedAmortAccountId: 'gl-1751',
    accumulatedAmortAccountCode: '1751',
    amortizationExpenseAccountId: 'gl-6200',
    amortizationExpenseAccountCode: '6200',
    impairmentAccountId: 'gl-6210',
    impairmentAccountCode: '6210',
  },
];

const mockIntangibles: IntangibleAsset[] = [
  {
    id: 'int-1',
    assetNumber: 'IA-2024-0001',
    name: 'SAP ERP License',
    description: 'Enterprise SAP ERP system license',
    categoryId: 'icat-3',
    categoryName: 'Licenses',
    intangibleType: 'license',
    status: 'active',
    acquisitionDate: new Date('2024-01-15'),
    amortizationStartDate: new Date('2024-02-01'),
    originalCost: 500000.0,
    residualValue: 0,
    usefulLifeMonths: 60,
    amortizationMethod: 'straight_line',
    currency: 'USD',
    hasIndefiniteLife: false,
    isInternallyGenerated: false,
    developmentPhase: null,
    patentNumber: null,
    registrationNumber: 'LIC-SAP-2024-001',
    expiryDate: new Date('2029-01-14'),
    vendorId: 'vend-sap',
    vendorName: 'SAP SE',
    accumulatedAmortization: 200000.0,
    carryingAmount: 300000.0,
    impairmentLoss: 0,
    lastAmortizationDate: new Date('2026-01-31'),
    lastImpairmentTestDate: new Date('2025-12-31'),
    nextImpairmentTestDate: new Date('2026-12-31'),
    attachmentCount: 2,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'int-2',
    assetNumber: 'IA-2023-0005',
    name: 'Product Patent #US12345',
    description: 'Patent for innovative product design',
    categoryId: 'icat-2',
    categoryName: 'Patents',
    intangibleType: 'patent',
    status: 'active',
    acquisitionDate: new Date('2023-03-01'),
    amortizationStartDate: new Date('2023-03-01'),
    originalCost: 250000.0,
    residualValue: 0,
    usefulLifeMonths: 180,
    amortizationMethod: 'straight_line',
    currency: 'USD',
    hasIndefiniteLife: false,
    isInternallyGenerated: true,
    developmentPhase: 'Granted',
    patentNumber: 'US12345678',
    registrationNumber: null,
    expiryDate: new Date('2038-02-28'),
    vendorId: null,
    vendorName: null,
    accumulatedAmortization: 48611.11,
    carryingAmount: 201388.89,
    impairmentLoss: 0,
    lastAmortizationDate: new Date('2026-01-31'),
    lastImpairmentTestDate: new Date('2025-12-31'),
    nextImpairmentTestDate: new Date('2026-12-31'),
    attachmentCount: 5,
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'int-3',
    assetNumber: 'IA-2020-0001',
    name: 'Acquisition Goodwill - ABC Co.',
    description: 'Goodwill arising from ABC Company acquisition',
    categoryId: 'icat-4',
    categoryName: 'Goodwill',
    intangibleType: 'goodwill',
    status: 'impaired',
    acquisitionDate: new Date('2020-06-01'),
    amortizationStartDate: new Date('2020-06-01'),
    originalCost: 1500000.0,
    residualValue: 0,
    usefulLifeMonths: 0,
    amortizationMethod: 'straight_line',
    currency: 'USD',
    hasIndefiniteLife: true,
    isInternallyGenerated: false,
    developmentPhase: null,
    patentNumber: null,
    registrationNumber: null,
    expiryDate: null,
    vendorId: null,
    vendorName: null,
    accumulatedAmortization: 0,
    carryingAmount: 1200000.0,
    impairmentLoss: 300000.0,
    lastAmortizationDate: null,
    lastImpairmentTestDate: new Date('2025-12-31'),
    nextImpairmentTestDate: new Date('2026-12-31'),
    attachmentCount: 8,
    createdAt: new Date('2020-06-01'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'int-4',
    assetNumber: 'IA-2022-0012',
    name: 'Custom CRM Software',
    description: 'Internally developed CRM system',
    categoryId: 'icat-1',
    categoryName: 'Software',
    intangibleType: 'software',
    status: 'active',
    acquisitionDate: new Date('2022-09-01'),
    amortizationStartDate: new Date('2022-10-01'),
    originalCost: 180000.0,
    residualValue: 0,
    usefulLifeMonths: 36,
    amortizationMethod: 'straight_line',
    currency: 'USD',
    hasIndefiniteLife: false,
    isInternallyGenerated: true,
    developmentPhase: 'Production',
    patentNumber: null,
    registrationNumber: null,
    expiryDate: null,
    vendorId: null,
    vendorName: null,
    accumulatedAmortization: 165000.0,
    carryingAmount: 15000.0,
    impairmentLoss: 0,
    lastAmortizationDate: new Date('2026-01-31'),
    lastImpairmentTestDate: null,
    nextImpairmentTestDate: null,
    attachmentCount: 3,
    createdAt: new Date('2022-09-01'),
    updatedAt: new Date('2026-02-01'),
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getIntangibleCategories(): Promise<
  { ok: true; data: IntangibleCategory[] } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 200));
  return { ok: true, data: mockCategories };
}

export async function getIntangibleAssets(params?: {
  categoryId?: string;
  intangibleType?: string;
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<{
  ok: true;
  data: IntangibleAsset[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  let filtered = [...mockIntangibles];

  if (params?.categoryId) {
    filtered = filtered.filter((a) => a.categoryId === params.categoryId);
  }

  if (params?.intangibleType) {
    filtered = filtered.filter((a) => a.intangibleType === params.intangibleType);
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
        a.patentNumber?.toLowerCase().includes(search)
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

export async function getIntangibleAssetById(
  id: string
): Promise<{ ok: true; data: IntangibleAsset } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const asset = mockIntangibles.find((a) => a.id === id);
  if (!asset) return { ok: false, error: 'Intangible asset not found' };
  return { ok: true, data: asset };
}

export async function getAmortizationSchedule(
  assetId: string
): Promise<{ ok: true; data: AmortizationScheduleEntry[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  const asset = mockIntangibles.find((a) => a.id === assetId);
  if (!asset) return { ok: false, error: 'Asset not found' };

  if (asset.hasIndefiniteLife) {
    return { ok: true, data: [] };
  }

  const monthlyAmort = (asset.originalCost - asset.residualValue) / asset.usefulLifeMonths;
  const entries: AmortizationScheduleEntry[] = [];

  let accAmort = 0;
  const startDate = new Date(asset.amortizationStartDate);

  for (let i = 0; i < Math.min(asset.usefulLifeMonths, 36); i++) {
    const periodStart = new Date(startDate);
    periodStart.setMonth(periodStart.getMonth() + i);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(0);

    accAmort += monthlyAmort;

    entries.push({
      id: `amort-${assetId}-${i}`,
      assetId,
      periodStart,
      periodEnd,
      periodName: periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      amortizationAmount: monthlyAmort,
      accumulatedAmortization: Math.min(accAmort, asset.originalCost - asset.residualValue),
      carryingAmount: Math.max(asset.originalCost - accAmort - asset.impairmentLoss, asset.residualValue),
      isPosted: periodEnd < new Date(),
      journalId: periodEnd < new Date() ? `jnl-${i}` : null,
      journalNumber: periodEnd < new Date() ? `JE-${periodStart.getFullYear()}-${String(i + 200).padStart(4, '0')}` : null,
      postedDate: periodEnd < new Date() ? periodEnd : null,
    });
  }

  return { ok: true, data: entries };
}

export async function getImpairmentTests(
  assetId: string
): Promise<{ ok: true; data: ImpairmentTest[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));

  const tests: ImpairmentTest[] = [];

  const asset = mockIntangibles.find((a) => a.id === assetId);
  if ((asset?.impairmentLoss ?? 0) > 0) {
    tests.push({
      id: 'imp-1',
      assetId,
      testDate: new Date('2025-12-31'),
      carryingAmountBefore: 1500000.0,
      recoverableAmount: 1200000.0,
      impairmentLoss: 300000.0,
      result: 'impairment_recognized',
      methodology: 'Value in Use (DCF)',
      assumptions: 'Discount rate: 10%, Growth rate: 2%, Terminal value multiple: 5x',
      performedBy: 'John Smith',
      journalId: 'jnl-imp-1',
      journalNumber: 'JE-2025-0892',
      createdAt: new Date('2025-12-31'),
    });
  }

  return { ok: true, data: tests };
}

export async function getIntangibleSummary(): Promise<
  { ok: true; data: IntangibleSummary } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 250));

  const summary: IntangibleSummary = {
    totalAssets: 28,
    activeAssets: 22,
    fullyAmortizedAssets: 4,
    totalOriginalCost: 3250000.0,
    totalAccumulatedAmortization: 780000.0,
    totalCarryingAmount: 2170000.0,
    totalImpairmentLoss: 300000.0,
    monthlyAmortization: 18500.0,
    assetsRequiringImpairmentTest: 3,
  };

  return { ok: true, data: summary };
}
