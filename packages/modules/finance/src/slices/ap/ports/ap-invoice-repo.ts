import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';

export interface CreateApInvoiceInput {
  readonly tenantId: string;
  readonly companyId: string;
  readonly supplierId: string;
  readonly ledgerId: string;
  readonly invoiceNumber: string;
  readonly supplierRef: string | null;
  readonly invoiceDate: Date;
  readonly dueDate: Date;
  readonly currencyCode: string;
  readonly description: string | null;
  readonly poRef: string | null;
  readonly receiptRef: string | null;
  readonly paymentTermsId: string | null;
  readonly lines: readonly CreateApInvoiceLineInput[];
}

export interface CreateApInvoiceLineInput {
  readonly accountId: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unitPrice: bigint;
  readonly amount: bigint;
  readonly taxAmount: bigint;
}

export interface IApInvoiceRepo {
  create(input: CreateApInvoiceInput): Promise<Result<ApInvoice>>;
  findById(id: string): Promise<Result<ApInvoice>>;
  findBySupplier(
    supplierId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<ApInvoice>>;
  findByStatus(status: string, params?: PaginationParams): Promise<PaginatedResult<ApInvoice>>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<ApInvoice>>;
  findUnpaid(): Promise<ApInvoice[]>;
  updateStatus(id: string, status: string, journalId?: string): Promise<Result<ApInvoice>>;
  recordPayment(id: string, amount: bigint): Promise<Result<ApInvoice>>;
}
