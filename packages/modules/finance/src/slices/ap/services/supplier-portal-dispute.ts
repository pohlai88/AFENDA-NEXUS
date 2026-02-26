import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

/**
 * N9: Supplier dispute / query service.
 *
 * Allows suppliers to raise disputes on invoices or payments,
 * track dispute resolution status, and add comments.
 * Each dispute is linked to a specific invoice or payment run
 * and goes through a lifecycle: OPEN → IN_REVIEW → RESOLVED / REJECTED.
 */

export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';

export type DisputeCategory =
  | 'INCORRECT_AMOUNT'
  | 'MISSING_PAYMENT'
  | 'DUPLICATE_CHARGE'
  | 'PRICING_DISCREPANCY'
  | 'DELIVERY_ISSUE'
  | 'QUALITY_ISSUE'
  | 'OTHER';

export interface SupplierDispute {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly invoiceId: string | null;
  readonly paymentRunId: string | null;
  readonly category: DisputeCategory;
  readonly subject: string;
  readonly description: string;
  readonly status: DisputeStatus;
  readonly resolution: string | null;
  readonly resolvedBy: string | null;
  readonly resolvedAt: Date | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ISupplierDisputeRepo {
  create(dispute: SupplierDispute): Promise<SupplierDispute>;
  findById(id: string): Promise<SupplierDispute | null>;
  findBySupplierId(supplierId: string): Promise<readonly SupplierDispute[]>;
  updateStatus(
    id: string,
    status: DisputeStatus,
    resolution?: string,
    resolvedBy?: string
  ): Promise<SupplierDispute | null>;
}

export interface CreateDisputeInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly invoiceId: string | null;
  readonly paymentRunId: string | null;
  readonly category: DisputeCategory;
  readonly subject: string;
  readonly description: string;
}

export async function supplierCreateDispute(
  input: CreateDisputeInput,
  deps: {
    supplierRepo: ISupplierRepo;
    apInvoiceRepo: IApInvoiceRepo;
    supplierDisputeRepo: ISupplierDisputeRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<SupplierDispute>> {
  // Validate supplier
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.status === 'INACTIVE') {
    return err(new AppError('VALIDATION', 'Supplier is inactive'));
  }

  // Validate subject and description
  if (!input.subject || input.subject.trim().length === 0) {
    return err(new AppError('VALIDATION', 'Dispute subject is required'));
  }
  if (!input.description || input.description.trim().length === 0) {
    return err(new AppError('VALIDATION', 'Dispute description is required'));
  }

  // Must reference either an invoice or a payment run
  if (!input.invoiceId && !input.paymentRunId) {
    return err(new AppError('VALIDATION', 'Dispute must reference an invoice or payment run'));
  }

  // If invoice referenced, verify it belongs to this supplier
  if (input.invoiceId) {
    const invoiceResult = await deps.apInvoiceRepo.findById(input.invoiceId);
    if (!invoiceResult.ok) {
      return err(new AppError('NOT_FOUND', 'Invoice not found'));
    }
    if (invoiceResult.value.supplierId !== input.supplierId) {
      return err(new AppError('VALIDATION', 'Invoice does not belong to this supplier'));
    }
  }

  const dispute: SupplierDispute = {
    id: `disp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tenantId: input.tenantId,
    supplierId: input.supplierId,
    invoiceId: input.invoiceId,
    paymentRunId: input.paymentRunId,
    category: input.category,
    subject: input.subject.trim(),
    description: input.description.trim(),
    status: 'OPEN',
    resolution: null,
    resolvedBy: null,
    resolvedAt: null,
    createdBy: input.userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const created = await deps.supplierDisputeRepo.create(dispute);

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_DISPUTE_CREATED,
    payload: {
      disputeId: created.id,
      supplierId: input.supplierId,
      invoiceId: input.invoiceId,
      paymentRunId: input.paymentRunId,
      category: input.category,
      subject: input.subject,
      userId: input.userId,
    },
  });

  return ok(created);
}

export interface ListDisputesInput {
  readonly tenantId: string;
  readonly supplierId: string;
}

export async function supplierListDisputes(
  input: ListDisputesInput,
  deps: {
    supplierRepo: ISupplierRepo;
    supplierDisputeRepo: ISupplierDisputeRepo;
  }
): Promise<Result<readonly SupplierDispute[]>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }

  const disputes = await deps.supplierDisputeRepo.findBySupplierId(input.supplierId);
  return ok(disputes);
}

export interface GetDisputeByIdInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly disputeId: string;
}

export async function supplierGetDisputeById(
  input: GetDisputeByIdInput,
  deps: {
    supplierDisputeRepo: ISupplierDisputeRepo;
  }
): Promise<Result<SupplierDispute>> {
  const dispute = await deps.supplierDisputeRepo.findById(input.disputeId);
  if (!dispute) {
    return err(new AppError('NOT_FOUND', 'Dispute not found'));
  }
  if (dispute.supplierId !== input.supplierId) {
    return err(new AppError('VALIDATION', 'Dispute does not belong to this supplier'));
  }
  return ok(dispute);
}
