import type { CompanyId, LedgerId, Money } from '@afenda/core';

export type ApInvoiceStatus =
  | 'DRAFT'
  | 'INCOMPLETE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'POSTED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'CANCELLED';

export type ApInvoiceType = 'STANDARD' | 'DEBIT_MEMO' | 'CREDIT_MEMO' | 'PREPAYMENT';

export type WhtIncomeType =
  | 'DIVIDENDS'
  | 'INTEREST'
  | 'ROYALTIES'
  | 'MANAGEMENT_FEES'
  | 'TECHNICAL_SERVICES'
  | 'CONSULTING'
  | 'RENT'
  | 'INSURANCE_PREMIUM'
  | 'OTHER';

export interface ApInvoice {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: CompanyId;
  readonly supplierId: string;
  readonly ledgerId: LedgerId;
  readonly invoiceNumber: string;
  readonly supplierRef: string | null;
  readonly invoiceDate: Date;
  readonly dueDate: Date;
  readonly totalAmount: Money;
  readonly paidAmount: Money;
  readonly status: ApInvoiceStatus;
  readonly invoiceType: ApInvoiceType;
  readonly description: string | null;
  readonly poRef: string | null;
  readonly receiptRef: string | null;
  readonly paymentTermsId: string | null;
  readonly journalId: string | null;
  readonly originalInvoiceId: string | null;
  readonly lines: readonly ApInvoiceLine[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ApInvoiceLine {
  readonly id: string;
  readonly invoiceId: string;
  readonly lineNumber: number;
  readonly accountId: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly amount: Money;
  readonly taxAmount: Money;
  readonly whtIncomeType: WhtIncomeType | null;
}
