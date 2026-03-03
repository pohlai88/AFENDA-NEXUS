/**
 * SP-8025: Supplier-safe status display utilities
 *
 * Maps internal status codes to supplier-friendly display text.
 * Prevents exposure of harsh/technical language to suppliers.
 */

export type SupplierFacingStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Verification Pending'
  | 'Processing'
  | 'Scheduled'
  | 'Completed'
  | 'Pending Information'
  | 'In Progress';

export type InternalStatus =
  | 'SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DENIED'
  | 'FRAUD_SUSPICION'
  | 'CREDIT_HOLD'
  | 'SOD_VIOLATION'
  | 'PAYMENT_SCHEDULED'
  | 'PAID'
  | 'FAILED'
  | 'BLOCKED';

/**
 * Maps internal status codes to supplier-friendly display text.
 * 
 * Design principle: Avoid punitive/harsh language. Use constructive terms.
 * - REJECTED → Under Review (implies reconsideration possible)
 * - DENIED → Verification Pending (implies action needed)
 * - FRAUD_SUSPICION → Verification Pending (neutral, non-accusatory)
 * - BLOCKED → Under Review (avoids implying permanence)
 * 
 * @param internalStatus - Internal system status code
 * @returns Supplier-friendly display text
 */
export function toSupplierSafeStatus(internalStatus: InternalStatus): SupplierFacingStatus {
  const statusMap: Record<InternalStatus, SupplierFacingStatus> = {
    SUBMITTED: 'Submitted',
    PENDING: 'Under Review',
    APPROVED: 'Processing',
    REJECTED: 'Under Review',
    DENIED: 'Verification Pending',
    FRAUD_SUSPICION: 'Verification Pending',
    CREDIT_HOLD: 'Under Review',
    SOD_VIOLATION: 'Pending Information',
    PAYMENT_SCHEDULED: 'Scheduled',
    PAID: 'Completed',
    FAILED: 'Pending Information',
    BLOCKED: 'Under Review',
  };

  return statusMap[internalStatus] ?? 'In Progress';
}

/**
 * Maps internal hold/rejection reasons to supplier-friendly explanations.
 * 
 * @param internalReason - Internal hold reason code
 * @returns External-facing explanation
 */
export function toExternalHoldReason(internalReason: string): string {
  const reasonMap: Record<string, string> = {
    SOD_VIOLATION: 'Pending additional approval',
    CREDIT_HOLD: 'Account under review',
    FRAUD_SUSPICION: 'Additional verification required',
    MISSING_DOCUMENTS: 'Supporting documents needed',
    DUPLICATE_INVOICE: 'Invoice already submitted',
    AMOUNT_MISMATCH: 'Invoice details require clarification',
    PO_NOT_FOUND: 'Purchase order reference needed',
    VENDOR_BLOCKED: 'Account verification in progress',
  };

  return reasonMap[internalReason] ?? 'Additional information required';
}

/**
 * Translates internal error codes to user-friendly messages for suppliers.
 * 
 * @param errorCode - Internal application error code
 * @returns User-friendly error message
 */
export function translateErrorForSupplier(errorCode: string): string {
  const errorMap: Record<string, string> = {
    VALIDATION_FAILED: 'Please check the information you entered and try again.',
    INVALID_STATE: 'This action is not available at this time. Please contact support if the issue persists.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested information could not be found.',
    CONFLICT: 'This operation conflicts with existing data. Please review and try again.',
    DB_ERROR: 'We encountered a technical issue. Please try again later.',
    NETWORK_ERROR: 'Connection issue. Please check your internet and try again.',
    TIMEOUT: 'The request took too long. Please try again.',
  };

  return errorMap[errorCode] ?? 'An unexpected error occurred. Please contact support.';
}
