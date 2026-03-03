/**
 * SP-1003: Status Dictionary — single source of truth for all supplier-visible statuses.
 *
 * Every supplier-visible status string resolves through this dictionary.
 * No ad-hoc status strings in portal code — all statuses are looked up here.
 *
 * SP-LANG-01: Internal hold reasons (FRAUD_SUSPICION, SANCTIONS_HIT, etc.)
 * must NEVER appear in portal code. Use Status Dictionary labels instead.
 */

// ─── Status Entry ───────────────────────────────────────────────────────────

export interface StatusDictionaryEntry {
  /** Internal code (e.g., 'INVOICE_SUBMITTED') — not shown to suppliers. */
  readonly code: string;
  /** Supplier-facing label (e.g., 'Submitted'). */
  readonly label: string;
  /** Severity for UI display. */
  readonly severity: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  /** Short help text shown in tooltips / detail views. */
  readonly helpText: string;
  /** Category for grouping in dropdowns / filters. */
  readonly category: StatusCategory;
}

export type StatusCategory =
  | 'invoice'
  | 'payment'
  | 'case'
  | 'compliance'
  | 'onboarding'
  | 'document'
  | 'escalation'
  | 'bank_account';

// ─── Invoice Statuses ───────────────────────────────────────────────────────

const INVOICE_STATUSES: readonly StatusDictionaryEntry[] = [
  {
    code: 'INVOICE_DRAFT',
    label: 'Draft',
    severity: 'neutral',
    helpText: 'Invoice saved but not yet submitted.',
    category: 'invoice',
  },
  {
    code: 'INVOICE_SUBMITTED',
    label: 'Submitted',
    severity: 'info',
    helpText: 'Invoice submitted and awaiting review.',
    category: 'invoice',
  },
  {
    code: 'INVOICE_IN_REVIEW',
    label: 'Under Review',
    severity: 'info',
    helpText: 'Our team is reviewing your invoice.',
    category: 'invoice',
  },
  {
    code: 'INVOICE_APPROVED',
    label: 'Approved',
    severity: 'success',
    helpText: 'Invoice approved for payment processing.',
    category: 'invoice',
  },
  {
    code: 'INVOICE_REJECTED',
    label: 'Returned',
    severity: 'error',
    helpText: 'Invoice returned — please review the comments and resubmit.',
    category: 'invoice',
  },
  {
    code: 'INVOICE_ON_HOLD',
    label: 'On Hold',
    severity: 'warning',
    helpText: 'Invoice processing temporarily paused. Contact us for details.',
    category: 'invoice',
  },
  {
    code: 'INVOICE_CANCELLED',
    label: 'Cancelled',
    severity: 'neutral',
    helpText: 'Invoice cancelled at your request.',
    category: 'invoice',
  },
];

// ─── Payment Statuses (append-only fact machine) ────────────────────────────

const PAYMENT_STATUSES: readonly StatusDictionaryEntry[] = [
  {
    code: 'PAYMENT_SCHEDULED',
    label: 'Scheduled',
    severity: 'info',
    helpText: 'Payment scheduled for the next payment run.',
    category: 'payment',
  },
  {
    code: 'PAYMENT_APPROVED',
    label: 'Approved',
    severity: 'info',
    helpText: 'Payment approved and queued for processing.',
    category: 'payment',
  },
  {
    code: 'PAYMENT_PROCESSING',
    label: 'Processing',
    severity: 'info',
    helpText: 'Payment is being processed by the bank.',
    category: 'payment',
  },
  {
    code: 'PAYMENT_SENT',
    label: 'Sent',
    severity: 'success',
    helpText: 'Payment sent. Funds should arrive within 1–3 business days.',
    category: 'payment',
  },
  {
    code: 'PAYMENT_CLEARED',
    label: 'Cleared',
    severity: 'success',
    helpText: 'Payment confirmed by the bank.',
    category: 'payment',
  },
  {
    code: 'PAYMENT_ON_HOLD',
    label: 'On Hold',
    severity: 'warning',
    helpText: 'Payment temporarily paused. Contact us for details.',
    category: 'payment',
  },
  {
    code: 'PAYMENT_REJECTED',
    label: 'Unsuccessful',
    severity: 'error',
    helpText: 'Payment could not be completed. Please verify your bank details.',
    category: 'payment',
  },
];

// ─── Case Statuses ──────────────────────────────────────────────────────────

const CASE_STATUSES: readonly StatusDictionaryEntry[] = [
  {
    code: 'CASE_DRAFT',
    label: 'Draft',
    severity: 'neutral',
    helpText: 'Case saved but not yet submitted.',
    category: 'case',
  },
  {
    code: 'CASE_SUBMITTED',
    label: 'Submitted',
    severity: 'info',
    helpText: 'Case submitted and awaiting assignment.',
    category: 'case',
  },
  {
    code: 'CASE_ASSIGNED',
    label: 'Assigned',
    severity: 'info',
    helpText: 'Case assigned to a team member for review.',
    category: 'case',
  },
  {
    code: 'CASE_IN_PROGRESS',
    label: 'In Progress',
    severity: 'info',
    helpText: 'Your case is being actively worked on.',
    category: 'case',
  },
  {
    code: 'CASE_AWAITING_INFO',
    label: 'Awaiting Your Response',
    severity: 'warning',
    helpText: 'We need additional information to proceed. Please check the comments.',
    category: 'case',
  },
  {
    code: 'CASE_RESOLVED',
    label: 'Resolved',
    severity: 'success',
    helpText: 'Case resolved. You will be notified if any follow-up is needed.',
    category: 'case',
  },
  {
    code: 'CASE_CLOSED',
    label: 'Closed',
    severity: 'neutral',
    helpText: 'Case closed. No further action needed.',
    category: 'case',
  },
  {
    code: 'CASE_REOPENED',
    label: 'Reopened',
    severity: 'warning',
    helpText: 'Case reopened for further review.',
    category: 'case',
  },
];

// ─── Compliance Statuses ────────────────────────────────────────────────────

const COMPLIANCE_STATUSES: readonly StatusDictionaryEntry[] = [
  {
    code: 'COMPLIANCE_VALID',
    label: 'Valid',
    severity: 'success',
    helpText: 'Certificate or document is current and valid.',
    category: 'compliance',
  },
  {
    code: 'COMPLIANCE_EXPIRING_SOON',
    label: 'Expiring Soon',
    severity: 'warning',
    helpText: 'This item expires soon. Please upload a renewal.',
    category: 'compliance',
  },
  {
    code: 'COMPLIANCE_EXPIRED',
    label: 'Expired',
    severity: 'error',
    helpText: 'This item has expired. Please upload a current version.',
    category: 'compliance',
  },
  {
    code: 'COMPLIANCE_PENDING_REVIEW',
    label: 'Under Review',
    severity: 'info',
    helpText: 'Your uploaded document is being reviewed.',
    category: 'compliance',
  },
];

// ─── Onboarding Statuses ────────────────────────────────────────────────────

const ONBOARDING_STATUSES: readonly StatusDictionaryEntry[] = [
  {
    code: 'ONBOARDING_INVITED',
    label: 'Invited',
    severity: 'info',
    helpText: 'You have been invited to register.',
    category: 'onboarding',
  },
  {
    code: 'ONBOARDING_IN_PROGRESS',
    label: 'In Progress',
    severity: 'info',
    helpText: 'Your registration is in progress.',
    category: 'onboarding',
  },
  {
    code: 'ONBOARDING_SUBMITTED',
    label: 'Submitted',
    severity: 'info',
    helpText: 'Your registration has been submitted for review.',
    category: 'onboarding',
  },
  {
    code: 'ONBOARDING_APPROVED',
    label: 'Approved',
    severity: 'success',
    helpText: 'Your registration has been approved. Welcome!',
    category: 'onboarding',
  },
  {
    code: 'ONBOARDING_REJECTED',
    label: 'Returned',
    severity: 'error',
    helpText: 'Your registration requires changes. Please review the feedback.',
    category: 'onboarding',
  },
];

// ─── Document Statuses ──────────────────────────────────────────────────────

const DOCUMENT_STATUSES: readonly StatusDictionaryEntry[] = [
  {
    code: 'DOCUMENT_DRAFT',
    label: 'Draft',
    severity: 'neutral',
    helpText: 'Document uploaded but not yet shared.',
    category: 'document',
  },
  {
    code: 'DOCUMENT_ACTIVE',
    label: 'Active',
    severity: 'success',
    helpText: 'Document is current and accessible.',
    category: 'document',
  },
  {
    code: 'DOCUMENT_EXPIRED',
    label: 'Expired',
    severity: 'warning',
    helpText: 'Document has expired. Upload a new version if needed.',
    category: 'document',
  },
  {
    code: 'DOCUMENT_ARCHIVED',
    label: 'Archived',
    severity: 'neutral',
    helpText: 'Document archived after retention period.',
    category: 'document',
  },
];

// ─── Escalation Statuses ────────────────────────────────────────────────────

const ESCALATION_STATUSES: readonly StatusDictionaryEntry[] = [
  {
    code: 'ESCALATION_REQUESTED',
    label: 'Escalation Requested',
    severity: 'warning',
    helpText: 'Your escalation request is being routed to a senior manager.',
    category: 'escalation',
  },
  {
    code: 'ESCALATION_ASSIGNED',
    label: 'Escalation Assigned',
    severity: 'info',
    helpText: 'A senior manager has been assigned to your case.',
    category: 'escalation',
  },
  {
    code: 'ESCALATION_IN_PROGRESS',
    label: 'Escalation In Progress',
    severity: 'info',
    helpText: 'Your escalation is being actively addressed.',
    category: 'escalation',
  },
  {
    code: 'ESCALATION_RESOLVED',
    label: 'Escalation Resolved',
    severity: 'success',
    helpText: 'Your escalation has been resolved.',
    category: 'escalation',
  },
];

// ─── Bank Account Statuses ──────────────────────────────────────────────────

const BANK_ACCOUNT_STATUSES: readonly StatusDictionaryEntry[] = [
  {
    code: 'BANK_PROPOSED',
    label: 'Proposed',
    severity: 'info',
    helpText: 'Bank account change proposed, awaiting approval.',
    category: 'bank_account',
  },
  {
    code: 'BANK_APPROVED',
    label: 'Approved',
    severity: 'success',
    helpText: 'Bank account verified and active.',
    category: 'bank_account',
  },
  {
    code: 'BANK_REJECTED',
    label: 'Returned',
    severity: 'error',
    helpText: 'Bank account change was not approved. Please review the feedback.',
    category: 'bank_account',
  },
];

// ─── Full Dictionary ────────────────────────────────────────────────────────

const ALL_STATUSES: readonly StatusDictionaryEntry[] = [
  ...INVOICE_STATUSES,
  ...PAYMENT_STATUSES,
  ...CASE_STATUSES,
  ...COMPLIANCE_STATUSES,
  ...ONBOARDING_STATUSES,
  ...DOCUMENT_STATUSES,
  ...ESCALATION_STATUSES,
  ...BANK_ACCOUNT_STATUSES,
];

// Build lookup map for O(1) access
const STATUS_MAP = new Map<string, StatusDictionaryEntry>(
  ALL_STATUSES.map((entry) => [entry.code, entry])
);

/**
 * Look up a status entry by internal code.
 * Returns undefined if the code is not in the dictionary.
 */
export function getStatusEntry(code: string): StatusDictionaryEntry | undefined {
  return STATUS_MAP.get(code);
}

/**
 * Get the supplier-facing label for a status code.
 * Returns the code itself if not found (should never happen in correct code).
 */
export function getStatusLabel(code: string): string {
  return STATUS_MAP.get(code)?.label ?? code;
}

/**
 * Get all statuses for a given category.
 */
export function getStatusesByCategory(category: StatusCategory): readonly StatusDictionaryEntry[] {
  return ALL_STATUSES.filter((entry) => entry.category === category);
}

/**
 * Check if a code exists in the dictionary.
 */
export function isValidStatusCode(code: string): boolean {
  return STATUS_MAP.has(code);
}

/**
 * Get all status entries in the dictionary.
 */
export function getAllStatuses(): readonly StatusDictionaryEntry[] {
  return ALL_STATUSES;
}
