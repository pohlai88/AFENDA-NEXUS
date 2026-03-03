/**
 * SP-8025: Supplier Portal Payment View Service
 *
 * Provides supplier-safe payment display data with mapped hold reasons.
 * Ensures internal terminology is never exposed to suppliers.
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import {
  toSupplierSafeStatus,
  toExternalHoldReason,
} from '../../../shared/utils/status-display.js';

// ─── Domain Types ───────────────────────────────────────────────────────────

export interface PaymentViewData {
  readonly paymentId: string;
  readonly paymentRunId: string;
  readonly invoiceIds: string[];
  readonly amount: number;
  readonly currencyCode: string;
  readonly status: string;
  readonly supplierVisibleStatus: string;
  readonly scheduledDate: Date | null;
  readonly paidDate: Date | null;
  readonly isOnHold: boolean;
  readonly holdReason: string | null;
  readonly supplierVisibleHoldReason: string | null;
  readonly nextAction: string | null;
  readonly linkedCaseId: string | null;
}

export interface ListPaymentsInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly statusFilter?: string[];
}

export interface IPaymentViewRepo {
  findBySupplierId(input: ListPaymentsInput): Promise<Result<PaymentViewData[]>>;
  findById(paymentId: string, supplierId: string): Promise<Result<PaymentViewData>>;
}

// ─── View Service ───────────────────────────────────────────────────────────

export interface PaymentViewDeps {
  paymentRepo: IPaymentViewRepo;
}

/**
 * Lists payments for supplier portal with hold reasons properly mapped.
 *
 * SP-8025: Ensures internal hold reasons like SOD_VIOLATION, CREDIT_HOLD,
 * FRAUD_SUSPICION are translated to supplier-friendly explanations.
 *
 * @param input - Query parameters
 * @param deps - Dependencies
 * @returns List of payment view data with supplier-safe labels
 */
export async function listSupplierPayments(
  input: ListPaymentsInput,
  deps: PaymentViewDeps
): Promise<Result<PaymentViewData[]>> {
  const result = await deps.paymentRepo.findBySupplierId(input);
  if (!result.ok) return result;

  // Map all payments to supplier-safe view data
  const supplierSafePayments = result.value.map((payment) => ({
    ...payment,
    supplierVisibleStatus: toSupplierSafeStatus(payment.status as any),
    supplierVisibleHoldReason: payment.holdReason ? toExternalHoldReason(payment.holdReason) : null,
  }));

  return ok(supplierSafePayments);
}

/**
 * Gets a single payment with hold reason mapping for supplier portal.
 * * Hold reason mappings:
 * - SOD_VIOLATION → "Pending Approval"
 * - CREDIT_HOLD → "Under Review"
 *  * @param paymentId - Payment ID
 * @param supplierId - Supplier ID (for authorization check)
 * @param deps - Dependencies
 * @returns Payment view data with supplier-safe labels
 */
export async function getSupplierPayment(
  paymentId: string,
  supplierId: string,
  deps: PaymentViewDeps
): Promise<Result<PaymentViewData>> {
  const result = await deps.paymentRepo.findById(paymentId, supplierId);
  if (!result.ok) return result;

  const payment = result.value;

  // Map to supplier-safe view
  const supplierSafePayment: PaymentViewData = {
    ...payment,
    supplierVisibleStatus: toSupplierSafeStatus(payment.status as any),
    supplierVisibleHoldReason: payment.holdReason ? toExternalHoldReason(payment.holdReason) : null,
  };

  return ok(supplierSafePayment);
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
export function mapHoldReason(internalReason: string): string {
  return toExternalHoldReason(internalReason);
}
