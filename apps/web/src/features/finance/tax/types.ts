// ─── Tax Code Types ──────────────────────────────────────────────────────────

export type TaxType = 'sales' | 'purchase' | 'both' | 'withholding';
export type TaxCodeStatus = 'active' | 'inactive';
export type TaxCalculationMethod = 'percentage' | 'fixed' | 'compound' | 'inclusive';

export interface TaxCode {
  id: string;
  code: string;
  name: string;
  description: string;
  taxType: TaxType;
  rate: number;
  calculationMethod: TaxCalculationMethod;
  taxAccountId: string;
  taxAccountCode: string;
  isDefault: boolean;
  status: TaxCodeStatus;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  jurisdiction: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Tax Rate History ────────────────────────────────────────────────────────

export interface TaxRateHistory {
  id: string;
  taxCodeId: string;
  rate: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  changedBy: string;
  changedAt: Date;
  reason: string;
}

// ─── Tax Return Period ───────────────────────────────────────────────────────

export type TaxReturnStatus = 'open' | 'ready' | 'filed' | 'paid' | 'overdue';
export type TaxReturnType = 'vat' | 'gst' | 'sales_tax' | 'withholding' | 'corporate' | 'other';

export interface TaxReturnPeriod {
  id: string;
  taxType: TaxReturnType;
  periodName: string;
  startDate: Date;
  endDate: Date;
  dueDate: Date;
  status: TaxReturnStatus;
  outputTax: number;
  inputTax: number;
  netPayable: number;
  currency: string;
  filedDate: Date | null;
  filedBy: string | null;
  paidDate: Date | null;
  referenceNumber: string | null;
  attachmentCount: number;
}

// ─── WHT Certificate ─────────────────────────────────────────────────────────

export type WHTCertificateStatus = 'draft' | 'issued' | 'cancelled' | 'replaced';
export type WHTType = 'receivable' | 'payable';

export interface WHTCertificate {
  id: string;
  certificateNumber: string;
  type: WHTType;
  vendorId: string | null;
  vendorName: string | null;
  customerId: string | null;
  customerName: string | null;
  taxId: string;
  issueDate: Date;
  periodFrom: Date;
  periodTo: Date;
  grossAmount: number;
  taxRate: number;
  taxAmount: number;
  currency: string;
  incomeType: string;
  status: WHTCertificateStatus;
  replacedById: string | null;
  attachmentId: string | null;
  createdBy: string;
  createdAt: Date;
}

// ─── Tax Summary ─────────────────────────────────────────────────────────────

export interface TaxSummary {
  outputTaxTotal: number;
  inputTaxTotal: number;
  netPayable: number;
  whtCollected: number;
  whtPaid: number;
  pendingReturns: number;
  overdueReturns: number;
}

// ─── Status Config ───────────────────────────────────────────────────────────

export const taxReturnStatusConfig: Record<TaxReturnStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-info/15 text-info dark:bg-info/20' },
  ready: { label: 'Ready to File', color: 'bg-warning/15 text-warning dark:bg-warning/20' },
  filed: { label: 'Filed', color: 'bg-success/15 text-success dark:bg-success/20' },
  paid: {
    label: 'Paid',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  overdue: { label: 'Overdue', color: 'bg-destructive/15 text-destructive dark:bg-destructive/20' },
};

export const whtStatusConfig: Record<WHTCertificateStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  issued: { label: 'Issued', color: 'bg-success/15 text-success dark:bg-success/20' },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
  },
  replaced: { label: 'Replaced', color: 'bg-warning/15 text-warning dark:bg-warning/20' },
};

export const taxTypeLabels: Record<TaxType, string> = {
  sales: 'Sales Tax',
  purchase: 'Purchase Tax',
  both: 'Sales & Purchase',
  withholding: 'Withholding Tax',
};

export const taxReturnTypeLabels: Record<TaxReturnType, string> = {
  vat: 'VAT',
  gst: 'GST',
  sales_tax: 'Sales Tax',
  withholding: 'Withholding Tax',
  corporate: 'Corporate Tax',
  other: 'Other',
};
