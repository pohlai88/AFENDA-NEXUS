import type { CompanyId, LedgerId, Money } from '@afenda/core';

export type ArInvoiceStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'POSTED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'WRITTEN_OFF'
  | 'CANCELLED';

export interface ArInvoice {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: CompanyId;
  readonly customerId: string;
  readonly ledgerId: LedgerId;
  readonly invoiceNumber: string;
  readonly customerRef: string | null;
  readonly invoiceDate: Date;
  readonly dueDate: Date;
  readonly totalAmount: Money;
  readonly paidAmount: Money;
  readonly status: ArInvoiceStatus;
  readonly description: string | null;
  readonly paymentTermsId: string | null;
  readonly journalId: string | null;
  readonly lines: readonly ArInvoiceLine[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ArInvoiceLine {
  readonly id: string;
  readonly invoiceId: string;
  readonly lineNumber: number;
  readonly accountId: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly amount: Money;
  readonly taxAmount: Money;
}
