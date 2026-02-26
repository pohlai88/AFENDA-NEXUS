import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { ArInvoice, ArInvoiceStatus } from '../entities/ar-invoice.js';

export interface CreateArInvoiceInput {
  readonly tenantId: string;
  readonly companyId: string;
  readonly customerId: string;
  readonly ledgerId: string;
  readonly invoiceNumber: string;
  readonly customerRef: string | null;
  readonly invoiceDate: Date;
  readonly dueDate: Date;
  readonly currencyCode: string;
  readonly description: string | null;
  readonly paymentTermsId: string | null;
  readonly lines: readonly CreateArInvoiceLineInput[];
}

export interface CreateArInvoiceLineInput {
  readonly accountId: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unitPrice: bigint;
  readonly amount: bigint;
  readonly taxAmount: bigint;
}

export interface IArInvoiceRepo {
  create(input: CreateArInvoiceInput): Promise<Result<ArInvoice>>;
  findById(id: string): Promise<Result<ArInvoice>>;
  findByCustomer(
    customerId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<ArInvoice>>;
  findByStatus(
    status: ArInvoiceStatus,
    params?: PaginationParams
  ): Promise<PaginatedResult<ArInvoice>>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<ArInvoice>>;
  findUnpaid(): Promise<ArInvoice[]>;
  updateStatus(id: string, status: ArInvoiceStatus, journalId?: string): Promise<Result<ArInvoice>>;
  recordPayment(id: string, amount: bigint): Promise<Result<ArInvoice>>;
  writeOff(id: string): Promise<Result<ArInvoice>>;
}
