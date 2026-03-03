/**
 * SP-8025: Supplier Portal Invoice View Service
 *
 * Provides supplier-safe invoice display data with mapped hold reasons.
 * Ensures internal terminology is never exposed to suppliers.
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import {
  toSupplierSafeStatus,
  toExternalHoldReason,
} from '../../../shared/utils/status-display.js';

// ─── Domain Types ───────────────────────────────────────────────────────────

export interface InvoiceViewData {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly amount: number;
  readonly currencyCode: string;
  readonly status: string;
  readonly supplierVisibleStatus: string;
  readonly submittedAt: Date;
  readonly dueDate: Date | null;
  readonly isOnHold: boolean;
  readonly holdReason: string | null;
  readonly supplierVisibleHoldReason: string | null;
  readonly nextAction: string | null;
  readonly linkedCaseId: string | null;
}

export interface ListInvoicesInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly statusFilter?: string[];
}

export interface IInvoiceViewRepo {
  findBySupplierId(input: ListInvoicesInput): Promise<Result<InvoiceViewData[]>>;
  findById(invoiceId: string, supplierId: string): Promise<Result<InvoiceViewData>>;
}

// ─── View Service ───────────────────────────────────────────────────────────

export interface InvoiceViewDeps {
  invoiceRepo: IInvoiceViewRepo;
}

/**
 * Lists invoices for supplier portal with hold reasons properly mapped.
 *
 * SP-8025: Ensures internal hold reasons like SOD_VIOLATION, CREDIT_HOLD,
 * FRAUD_SUSPICION are translated to supplier-friendly explanations.
 *
 * @param input - Query parameters
 * @param deps - Dependencies
 * @returns List of invoice view data with supplier-safe labels
 */
export async function listSupplierInvoices(
  input: ListInvoicesInput,
  deps: InvoiceViewDeps
): Promise<Result<InvoiceViewData[]>> {
  const result = await deps.invoiceRepo.findBySupplierId(input);
  if (!result.ok) return result;

  // Map all invoices to supplier-safe view data
  const supplierSafeInvoices = result.value.map((invoice) => ({
    ...invoice,
    supplierVisibleStatus: toSupplierSafeStatus(invoice.status as any),
    supplierVisibleHoldReason: invoice.holdReason ? toExternalHoldReason(invoice.holdReason) : null,
  }));

  return ok(supplierSafeInvoices);
}

/**
 * Gets a single invoice with hold reason mapping for supplier portal.
 * * Hold reason mappings:
 * - SOD_VIOLATION → "Pending Approval"
 * - CREDIT_HOLD → "Under Review"
 *  * @param invoiceId - Invoice ID
 * @param supplierId - Supplier ID (for authorization check)
 * @param deps - Dependencies
 * @returns Invoice view data with supplier-safe labels
 */
export async function getSupplierInvoice(
  invoiceId: string,
  supplierId: string,
  deps: InvoiceViewDeps
): Promise<Result<InvoiceViewData>> {
  const result = await deps.invoiceRepo.findById(invoiceId, supplierId);
  if (!result.ok) return result;

  const invoice = result.value;

  // Map to supplier-safe view
  const supplierSafeInvoice: InvoiceViewData = {
    ...invoice,
    supplierVisibleStatus: toSupplierSafeStatus(invoice.status as any),
    supplierVisibleHoldReason: invoice.holdReason ? toExternalHoldReason(invoice.holdReason) : null,
  };

  return ok(supplierSafeInvoice);
}

/**
 * Maps internal hold reason codes to supplier-friendly display text.
 *
 * Deprecated: Use toExternalHoldReason() from status-display.ts directly.
 * This is kept for backward compatibility with existing code.
 *
 * @param internalReason - Internal hold reason code
 * @returns Supplier-friendly explanation
 */
export function holdReasonDisplay(internalReason: string): string {
  return toExternalHoldReason(internalReason);
}
