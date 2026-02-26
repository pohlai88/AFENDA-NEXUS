'use server';

import type {
  TaxCode,
  TaxRateHistory,
  TaxReturnPeriod,
  WHTCertificate,
  TaxSummary,
} from '../types';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockTaxCodes: TaxCode[] = [
  {
    id: 'tc-1',
    code: 'VAT-STD',
    name: 'Standard VAT',
    description: 'Standard Value Added Tax rate',
    taxType: 'both',
    rate: 7,
    calculationMethod: 'percentage',
    taxAccountId: 'gl-2100',
    taxAccountCode: '2100',
    isDefault: true,
    status: 'active',
    effectiveFrom: new Date('2024-01-01'),
    effectiveTo: null,
    jurisdiction: 'TH',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tc-2',
    code: 'VAT-ZERO',
    name: 'Zero-Rated VAT',
    description: 'Zero-rated VAT for exports',
    taxType: 'sales',
    rate: 0,
    calculationMethod: 'percentage',
    taxAccountId: 'gl-2101',
    taxAccountCode: '2101',
    isDefault: false,
    status: 'active',
    effectiveFrom: new Date('2024-01-01'),
    effectiveTo: null,
    jurisdiction: 'TH',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tc-3',
    code: 'WHT-3',
    name: 'WHT 3%',
    description: 'Withholding tax at 3% for services',
    taxType: 'withholding',
    rate: 3,
    calculationMethod: 'percentage',
    taxAccountId: 'gl-2200',
    taxAccountCode: '2200',
    isDefault: false,
    status: 'active',
    effectiveFrom: new Date('2024-01-01'),
    effectiveTo: null,
    jurisdiction: 'TH',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tc-4',
    code: 'WHT-5',
    name: 'WHT 5%',
    description: 'Withholding tax at 5% for rent',
    taxType: 'withholding',
    rate: 5,
    calculationMethod: 'percentage',
    taxAccountId: 'gl-2200',
    taxAccountCode: '2200',
    isDefault: false,
    status: 'active',
    effectiveFrom: new Date('2024-01-01'),
    effectiveTo: null,
    jurisdiction: 'TH',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const mockTaxReturnPeriods: TaxReturnPeriod[] = [
  {
    id: 'trp-1',
    taxType: 'vat',
    periodName: 'February 2026',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-02-28'),
    dueDate: new Date('2026-03-15'),
    status: 'open',
    outputTax: 125000.0,
    inputTax: 85000.0,
    netPayable: 40000.0,
    currency: 'THB',
    filedDate: null,
    filedBy: null,
    paidDate: null,
    referenceNumber: null,
    attachmentCount: 0,
  },
  {
    id: 'trp-2',
    taxType: 'vat',
    periodName: 'January 2026',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    dueDate: new Date('2026-02-15'),
    status: 'paid',
    outputTax: 118500.0,
    inputTax: 92300.0,
    netPayable: 26200.0,
    currency: 'THB',
    filedDate: new Date('2026-02-10'),
    filedBy: 'Jane Smith',
    paidDate: new Date('2026-02-12'),
    referenceNumber: 'VAT-2026-01',
    attachmentCount: 2,
  },
  {
    id: 'trp-3',
    taxType: 'withholding',
    periodName: 'February 2026',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-02-28'),
    dueDate: new Date('2026-03-07'),
    status: 'ready',
    outputTax: 0,
    inputTax: 0,
    netPayable: 15600.0,
    currency: 'THB',
    filedDate: null,
    filedBy: null,
    paidDate: null,
    referenceNumber: null,
    attachmentCount: 5,
  },
];

const mockWHTCertificates: WHTCertificate[] = [
  {
    id: 'wht-1',
    certificateNumber: 'WHT-2026-0001',
    type: 'payable',
    vendorId: 'vend-1',
    vendorName: 'ABC Consulting Co., Ltd.',
    customerId: null,
    customerName: null,
    taxId: '0-1234-56789-01-2',
    issueDate: new Date('2026-02-20'),
    periodFrom: new Date('2026-02-01'),
    periodTo: new Date('2026-02-28'),
    grossAmount: 50000.0,
    taxRate: 3,
    taxAmount: 1500.0,
    currency: 'THB',
    incomeType: 'Service Fees',
    status: 'issued',
    replacedById: null,
    attachmentId: 'att-1',
    createdBy: 'John Doe',
    createdAt: new Date('2026-02-20'),
  },
  {
    id: 'wht-2',
    certificateNumber: 'WHT-2026-0002',
    type: 'payable',
    vendorId: 'vend-2',
    vendorName: 'Office Space Rentals Ltd.',
    customerId: null,
    customerName: null,
    taxId: '0-9876-54321-01-9',
    issueDate: new Date('2026-02-25'),
    periodFrom: new Date('2026-02-01'),
    periodTo: new Date('2026-02-28'),
    grossAmount: 80000.0,
    taxRate: 5,
    taxAmount: 4000.0,
    currency: 'THB',
    incomeType: 'Rental Income',
    status: 'issued',
    replacedById: null,
    attachmentId: 'att-2',
    createdBy: 'John Doe',
    createdAt: new Date('2026-02-25'),
  },
  {
    id: 'wht-3',
    certificateNumber: 'WHT-2026-0003',
    type: 'receivable',
    vendorId: null,
    vendorName: null,
    customerId: 'cust-1',
    customerName: 'Big Corp International',
    taxId: '0-5555-12345-01-1',
    issueDate: new Date('2026-02-22'),
    periodFrom: new Date('2026-02-01'),
    periodTo: new Date('2026-02-28'),
    grossAmount: 200000.0,
    taxRate: 3,
    taxAmount: 6000.0,
    currency: 'THB',
    incomeType: 'Service Income',
    status: 'draft',
    replacedById: null,
    attachmentId: null,
    createdBy: 'Jane Smith',
    createdAt: new Date('2026-02-22'),
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getTaxCodes(params?: {
  taxType?: string;
  status?: string;
  search?: string;
}): Promise<{ ok: true; data: TaxCode[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  let filtered = [...mockTaxCodes];

  if (params?.taxType) {
    filtered = filtered.filter((tc) => tc.taxType === params.taxType);
  }

  if (params?.status) {
    filtered = filtered.filter((tc) => tc.status === params.status);
  }

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (tc) =>
        tc.code.toLowerCase().includes(search) ||
        tc.name.toLowerCase().includes(search)
    );
  }

  return { ok: true, data: filtered };
}

export async function getTaxCodeById(
  id: string
): Promise<{ ok: true; data: TaxCode } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const taxCode = mockTaxCodes.find((tc) => tc.id === id);
  if (!taxCode) return { ok: false, error: 'Tax code not found' };
  return { ok: true, data: taxCode };
}

export async function getTaxRateHistory(
  taxCodeId: string
): Promise<{ ok: true; data: TaxRateHistory[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));

  const history: TaxRateHistory[] = [
    {
      id: 'trh-1',
      taxCodeId,
      rate: 7,
      effectiveFrom: new Date('2024-01-01'),
      effectiveTo: null,
      changedBy: 'System',
      changedAt: new Date('2024-01-01'),
      reason: 'Initial setup',
    },
  ];

  return { ok: true, data: history };
}

export async function getTaxReturnPeriods(params?: {
  taxType?: string;
  status?: string;
  year?: number;
}): Promise<{ ok: true; data: TaxReturnPeriod[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  let filtered = [...mockTaxReturnPeriods];

  if (params?.taxType) {
    filtered = filtered.filter((trp) => trp.taxType === params.taxType);
  }

  if (params?.status) {
    filtered = filtered.filter((trp) => trp.status === params.status);
  }

  if (params?.year) {
    filtered = filtered.filter(
      (trp) => trp.startDate.getFullYear() === params.year
    );
  }

  return { ok: true, data: filtered };
}

export async function getTaxReturnPeriodById(
  id: string
): Promise<{ ok: true; data: TaxReturnPeriod } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const period = mockTaxReturnPeriods.find((trp) => trp.id === id);
  if (!period) return { ok: false, error: 'Tax return period not found' };
  return { ok: true, data: period };
}

export async function getWHTCertificates(params?: {
  type?: string;
  status?: string;
  search?: string;
  periodFrom?: Date;
  periodTo?: Date;
}): Promise<{ ok: true; data: WHTCertificate[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));

  let filtered = [...mockWHTCertificates];

  if (params?.type) {
    filtered = filtered.filter((wht) => wht.type === params.type);
  }

  if (params?.status) {
    filtered = filtered.filter((wht) => wht.status === params.status);
  }

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (wht) =>
        wht.certificateNumber.toLowerCase().includes(search) ||
        wht.vendorName?.toLowerCase().includes(search) ||
        wht.customerName?.toLowerCase().includes(search)
    );
  }

  return { ok: true, data: filtered };
}

export async function getWHTCertificateById(
  id: string
): Promise<{ ok: true; data: WHTCertificate } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const cert = mockWHTCertificates.find((wht) => wht.id === id);
  if (!cert) return { ok: false, error: 'WHT certificate not found' };
  return { ok: true, data: cert };
}

export async function getTaxSummary(): Promise<{ ok: true; data: TaxSummary } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));

  const summary: TaxSummary = {
    outputTaxTotal: 243500.0,
    inputTaxTotal: 177300.0,
    netPayable: 66200.0,
    whtCollected: 6000.0,
    whtPaid: 5500.0,
    pendingReturns: 2,
    overdueReturns: 0,
  };

  return { ok: true, data: summary };
}
